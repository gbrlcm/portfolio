---
title: "MVCC en PostgreSQL: por qué un UPDATE nunca sobrescribe la fila"
description: "Cómo PostgreSQL implementa MVCC: versiones de tupla, xmin/xmax, snapshots, hint bits, HOT y la relación con VACUUM. Con experimentos reproducibles usando pageinspect."
pubDate: 2026-10-31T09:00:00-03:00
author: "Gabriel Campos"
category: "Bases de Datos"
tags:
  - "PostgreSQL"
  - "MVCC"
  - "Bases de Datos"
  - "Concurrencia"
  - "VACUUM"
  - "Serie PostgreSQL por Dentro"
draft: false
lang: "es"
translationKey: "postgres-mvcc"
---

En una tabla de 10.000 filas (45 páginas de 8 kB en mi prueba), un único `UPDATE t1 SET v = v + 1` sin `WHERE` dejó el archivo con 89 páginas. Nadie insertó filas nuevas, el `count(*)` sigue en 10.000 y, aun así, el archivo casi se duplicó. Quien se encuentra con esto por primera vez suele sospechar de un bug o de una configuración errónea. No es ninguna de las dos cosas: es **MVCC** funcionando exactamente como fue diseñado.

Este es el primer artículo de la serie *PostgreSQL por Dentro*. La idea es abrir la tabla y mirar los bytes: qué existe físicamente después de un `INSERT`, de un `UPDATE` y de un `ROLLBACK`, cómo decide la base de datos quién ve qué, y por qué esa decisión genera el trabajo de limpieza que el próximo artículo ([VACUUM, autovacuum y wraparound](/es/blog/postgresql-vacuum-autovacuum-wraparound)) detalla.

> Este artículo es un estudio basado en la documentación oficial y en experimentos que ejecuté en un PostgreSQL 17.10 local descartable. Los pasajes marcados como opinión reflejan mi lectura. Las referencias están al final.

## Qué resuelve MVCC

*Multi-Version Concurrency Control* es una técnica en la que la base de datos mantiene **varias versiones** de la misma fila al mismo tiempo, para que lectores y escritores no necesiten bloquearse mutuamente. La documentación resume el contrato así: en MVCC, "los locks adquiridos para consultar (leer) datos no entran en conflicto con los locks adquiridos para escribir datos, y por lo tanto leer nunca bloquea escribir y escribir nunca bloquea leer" (cap. 13.1).

Esto no es un detalle de implementación, es una decisión de arquitectura con contrapartida: la versión antigua de una fila tiene que existir *en algún lugar* mientras alguna transacción pueda necesitarla. Lo que cambia de una base de datos a otra es dónde.

- **PostgreSQL:** las versiones antiguas quedan **en la propia tabla (heap)**, junto a las versiones nuevas.
- **InnoDB (MySQL):** la fila en la tabla guarda la versión más reciente; las versiones anteriores se reconstruyen a partir de **undo logs** en un *rollback segment*, apuntadas por un campo `DB_ROLL_PTR` (documentación de MySQL 8.4).

Ninguno de los dos es "mejor" en términos absolutos. El modelo de PostgreSQL hace el rollback instantáneo (basta marcar la transacción como abortada) y la lectura de versiones antiguas simple, a costa de bloat y de una rutina de limpieza obligatoria. El modelo de InnoDB mantiene la tabla principal más compacta, a costa de reconstruir versiones antiguas y de un *purge* que también puede quedarse atrás. Las dos documentaciones dan el mismo consejo práctico: las transacciones largas retienen la limpieza.

## Anatomía de una tupla

Cada página del heap tiene 8 kB por defecto, con una cabecera de 24 bytes, un array de *line pointers* (4 bytes cada uno) que crece desde el inicio y las tuplas que crecen desde el final. La dirección física de una fila, el `ctid`, es el par `(página, índice del line pointer)`. Los line pointers nunca se mueven una vez asignados, así que el `ctid` sigue siendo válido aunque la tupla se compacte dentro de la página.

Cada tupla comienza con una cabecera de 23 bytes. Los campos que importan para MVCC son:

| Campo | Significado |
|---|---|
| `t_xmin` | XID de la transacción que **insertó** esta versión |
| `t_xmax` | XID de la transacción que **eliminó o bloqueó** esta versión (0 si ninguna) |
| `t_ctid` | TID de esta versión o de la **versión más nueva** de la misma fila |
| `t_infomask`, `t_infomask2` | Bits de estado: "xmin confirmado", "xmax inválido", "actualizada por HOT", etc. |

Puedes verlo directamente con la extensión `pageinspect`. Todos los ejemplos siguientes se ejecutaron en PostgreSQL 17.10; los números de XID cambian en cada ejecución, la estructura no.

```sql
CREATE EXTENSION pageinspect;

CREATE TABLE cuenta (
  id    int     PRIMARY KEY,
  saldo numeric NOT NULL
) WITH (autovacuum_enabled = off);  -- desactivado solo para el experimento

INSERT INTO cuenta VALUES (1, 500);

SELECT lp, t_xmin, t_xmax, t_ctid
FROM heap_page_items(get_raw_page('cuenta', 0));
```

```text
 lp | t_xmin | t_xmax | t_ctid
----+--------+--------+--------
  1 |    741 |      0 | (0,1)
```

Una fila física, creada por la transacción 741, aún no eliminada (`t_xmax = 0`), apuntando a sí misma.

## UPDATE es "marcar la antigua + insertar una nueva"

Ahora, el punto central del artículo:

```sql
UPDATE cuenta SET saldo = 400 WHERE id = 1;

SELECT lp, t_xmin, t_xmax, t_ctid,
       (t_infomask2 & 16384) > 0 AS hot_updated,
       (t_infomask2 & 32768) > 0 AS heap_only
FROM heap_page_items(get_raw_page('cuenta', 0));
```

```text
 lp | t_xmin | t_xmax | t_ctid | hot_updated | heap_only
----+--------+--------+--------+-------------+-----------
  1 |    741 |    743 | (0,2)  | t           | f
  2 |    743 |      0 | (0,2)  | f           | t
```

Ahora existen **dos tuplas físicas** para la misma fila lógica:

1. La versión original (`lp 1`) recibió `t_xmax = 743`: la transacción 743 la "eliminó". Su `t_ctid` pasó a apuntar a `(0,2)`, formando una **cadena** de versiones.
2. La versión nueva (`lp 2`) fue creada por 743 (`t_xmin = 743`), con `saldo = 400`.

Un `SELECT ctid, xmin, xmax, * FROM cuenta` muestra solo la segunda: `(0,2) | 743 | 0`. La primera sigue en el disco, invisible para quien empezó después de que 743 confirmara, pero potencialmente visible para quien empezó antes.

En la documentación, `DELETE` es el mismo mecanismo sin el paso de inserción: solo rellena `t_xmax`. `INSERT`, en cambio, únicamente crea una tupla con `t_xmin`. Por eso PostgreSQL no tiene un "undo" que aplicar en un rollback: una transacción abortada deja tuplas con el `xmin` de una transacción que nunca fue confirmada, y esas tuplas simplemente nunca pasan la prueba de visibilidad.

```sql
BEGIN; INSERT INTO cuenta VALUES (2, 1); ROLLBACK;

SELECT lp, t_xmin, t_xmax FROM heap_page_items(get_raw_page('cuenta', 0));
-- la tupla (id=2) sigue ahí, con xmin = 749, de una transacción abortada
SELECT id FROM cuenta;  -- devuelve solo id = 1
```

El rollback fue instantáneo (costo independiente de la cantidad de datos), pero dejó basura física que alguien tendrá que recoger.

## Quién decide qué ve una transacción: snapshots

Que una tupla esté "viva" o "muerta" no es una propiedad absoluta; es relativa al observador. PostgreSQL lo resuelve con **snapshots**. Un snapshot es, en esencia, tres datos:

- `xmin`: el menor XID aún en curso cuando se tomó el snapshot (todo lo anterior ya terminó);
- `xmax`: el primer XID aún no asignado (todo lo que sea igual o mayor es "futuro");
- una lista de XIDs **en curso** entre ambos.

Puedes verlo con `pg_current_snapshot()`, que devuelve el formato `xmin:xmax:lista`. En una sesión inactiva, el resultado fue `744:744:`, es decir, ninguna transacción en curso.

La regla de visibilidad, muy simplificada, para una tupla con `xmin` y `xmax` es:

1. `xmin` debe haber **confirmado** y estar "en el pasado" del snapshot (menor que el `xmax` del snapshot y fuera de la lista de en curso). De lo contrario, la tupla fue creada por alguien a quien el observador no ve.
2. `xmax` debe ser 0, o haber **abortado**, o estar "en el futuro" del snapshot / en curso. De lo contrario, la tupla fue eliminada por alguien a quien el observador sí ve, y está muerta *para él*.

Para saber si una transacción confirmó o abortó, el servidor consulta el estado de commit (guardado en `pg_xact`). Como esa consulta sería cara para cada tupla, el resultado se cachea en la propia tupla como **hint bits** en `t_infomask` (`HEAP_XMIN_COMMITTED`, `HEAP_XMIN_INVALID`, `HEAP_XMAX_INVALID`, etc.). Por eso un `SELECT` puede generar escritura: el primer lector que descubre el estado de una transacción graba el hint bit en la página, que queda sucia. Es una optimización, no parte del contrato lógico.

> Esta es una descripción simplificada de la lógica de `HeapTupleSatisfiesMVCC` en el código fuente. Hay casos adicionales (subtransacciones, `cmin/cmax` para el comando actual dentro de la misma transacción, tuplas bloqueadas, multixacts) que no caben aquí.

### Cuándo se toma el snapshot

Este es el punto en que MVCC se encuentra con el aislamiento de transacciones. La documentación de PostgreSQL define:

- **READ COMMITTED** (por defecto): cada *statement* toma su propio snapshot. "Un `SELECT` ve un snapshot de la base de datos en el instante en que la consulta comienza a ejecutarse."
- **REPEATABLE READ**: el snapshot se toma al inicio del primer comando que no sea de control de transacción, y se reutiliza hasta el final. "Comandos `SELECT` sucesivos dentro de una *única* transacción ven los mismos datos."
- **SERIALIZABLE**: usa el mismo mecanismo de snapshot que REPEATABLE READ y añade detección de dependencias (SSI) para impedir anomalías de serialización.

Dos detalles que suelen sorprender, ambos documentados:

- `READ UNCOMMITTED` **no existe en realidad**: "el modo Read Uncommitted de PostgreSQL se comporta como Read Committed". El estándar SQL lo permite, porque define solo lo que *puede* ocurrir en cada nivel.
- El `REPEATABLE READ` de PostgreSQL **no permite lecturas fantasma**, lo que va más allá del mínimo exigido por el estándar SQL. Pero aún permite anomalías de serialización, y por eso existe `SERIALIZABLE`.

El estándar SQL define los niveles de aislamiento por los fenómenos que cada uno tolera. MVCC con snapshots, en cambio, es una estrategia de implementación de PostgreSQL. Los dos se encuentran en las tablas de la documentación, pero son conceptos distintos. El [artículo sobre aislamiento, locks y deadlocks](/es/blog/aislamiento-locks-deadlocks-postgresql) profundiza en las consecuencias prácticas.

## El costo: versiones que nadie ve, pero que siguen ahí

¿Cuándo se puede eliminar una versión? Cuando **ninguna** transacción, actual o futura, pueda necesitarla. PostgreSQL calcula ese límite como el menor `xmin` entre todos los snapshots activos. Si hay una transacción antigua abierta, el límite se queda atrás y la limpieza se detiene.

Este comportamiento se puede reproducir. La sesión A abre una transacción `REPEATABLE READ` y lee el saldo; mientras tanto, la sesión B actualiza la misma fila dos veces y ejecuta `VACUUM (VERBOSE)`:

```sql
-- Sesión A
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT saldo FROM cuenta WHERE id = 1;     -- 400
SELECT pg_sleep(6);
SELECT saldo FROM cuenta WHERE id = 1;     -- sigue en 400
SELECT backend_xmin FROM pg_stat_activity WHERE pid = pg_backend_pid();  -- 744
COMMIT;

-- Sesión B (durante el sleep de A)
UPDATE cuenta SET saldo = 300 WHERE id = 1;
UPDATE cuenta SET saldo = 200 WHERE id = 1;
SELECT saldo FROM cuenta WHERE id = 1;     -- 200
VACUUM (VERBOSE) cuenta;
```

Salida relevante del `VACUUM`:

```text
tuples: 0 removed, 3 remain, 2 are dead but not yet removable
removable cutoff: 744, which was 2 XIDs old when operation ended
```

La sesión B ve 200; la A, 400, y ambas ven la verdad que definen sus snapshots. De las tres tuplas, dos están muertas para B, pero el `VACUUM` **no pudo eliminarlas** ("dead but not yet removable"), porque el *removable cutoff* (744) es el `backend_xmin` de la sesión A. La transacción A aún podría, en teoría, necesitar la versión de 400 y otras anteriores.

Este es el mecanismo detrás de un incidente común en producción: una transacción olvidada en `idle in transaction`, un informe lento o una sesión de BI abierta impiden la limpieza de **toda la tabla**, incluso de filas que la transacción nunca tocó. El horizonte es global a la base de datos, no por tabla. También pueden retenerlo las transacciones preparadas (`pg_prepared_xacts`), los *replication slots* con `xmin`/`catalog_xmin` antiguos y, en réplicas con `hot_standby_feedback`, las consultas en la réplica. La documentación de mantenimiento enumera exactamente estas tres fuentes (transacciones preparadas, transacciones largas y *replication slots*) como causas de limpieza bloqueada.

## HOT: cuando se puede evitar tocar los índices

Un `UPDATE` crea una tupla nueva, y los índices apuntan a tuplas. Si cada update tuviera que crear entradas en todos los índices, el costo sería alto. La optimización **HOT** (*Heap-Only Tuple*) lo evita cuando se cumplen dos condiciones, citadas de la documentación:

1. la actualización **no modifica ninguna columna referenciada por los índices** de la tabla (los índices de resumen, como BRIN, quedan fuera de la regla);
2. hay **espacio libre suficiente en la misma página** de la fila antigua.

En el experimento del primer update, las flags `hot_updated` y `heap_only` aparecieron exactamente por eso: `saldo` no forma parte del índice de la clave primaria.

Lo que ocurre después es elegante. Como el índice sigue apuntando al line pointer original (`lp 1`), el `VACUUM` (o la poda oportunista de página, que también ocurre durante los `SELECT`) puede convertir `lp 1` en un **redirect** hacia `lp 2`:

```text
 lp | lp_flags | lp_off | t_xmin | t_xmax | t_ctid
----+----------+--------+--------+--------+--------
  1 |        2 |      2 |        |        |          -- LP_REDIRECT → lp 2
  2 |        1 |   8152 |    743 |      0 | (0,2)
```

`lp_flags = 2` es `LP_REDIRECT`. El espacio de la tupla antigua se recuperó, y el índice ni siquiera necesitó enterarse.

### El papel del fillfactor, medido

La segunda condición de HOT depende del espacio en la página. Para ver el efecto, creé dos tablas idénticas (1.000 filas, una columna `v` sin índice, una `w` indexada) y actualicé `v`:

| `fillfactor` | updates | updates HOT | páginas de la tabla |
|---|---|---|---|
| 100 | 1.000 | **0** | 11 |
| 70 | 1.000 | **448** | 13 |

Con `fillfactor = 100`, las páginas nacieron llenas y **ningún** update pudo ser HOT, aun sin tocar una columna indexada. Con 70, cerca del 45% fueron HOT (en el resto, la página ya no tenía espacio libre en el momento del update). Al actualizar `w` (columna indexada), los updates dejaron de ser HOT en cualquier caso (el contador se mantuvo en 448 tras otros 1.000 updates).

Los contadores provienen de `pg_stat_user_tables` (`n_tup_upd`, `n_tup_hot_upd`); en sesiones de prueba, `pg_stat_force_next_flush()` evita esperar el *flush* de las estadísticas. Este es un experimento pequeño, en una máquina, a propósito: demuestra el mecanismo, no predice números de producción.

> **Mi opinión:** en tablas con muchos `UPDATE` sobre columnas no indexadas (contadores, estado, timestamps de último acceso), vale la pena monitorear la razón HOT/total antes de pensar en otras optimizaciones. Es una de las palancas más baratas contra el bloat. Al mismo tiempo, crear un índice sobre una columna "solo por precaución" puede desactivar HOT para todos los updates de esa columna. El [artículo sobre índices](/es/blog/indices-postgresql-costos-ocultos) trata ese costo.

## Los locks de fila también usan xmax

`SELECT ... FOR UPDATE` no crea una nueva versión, pero también escribe en la tupla. PostgreSQL graba el XID de quien bloqueó en `t_xmax` y marca un bit en `t_infomask` (`HEAP_XMAX_LOCK_ONLY`) para distinguir "bloqueada" de "eliminada":

```sql
BEGIN;
SELECT id FROM cuenta WHERE id = 1 FOR UPDATE;
SELECT ctid, xmin, xmax FROM cuenta;   -- (0,1) | 747 | 748 (xmax = mi propio XID)
ROLLBACK;
```

Dos consecuencias prácticas: los locks de fila **generan escritura en disco** (la página queda sucia, posiblemente con WAL), y cuando más de una transacción bloquea la misma fila, el `xmax` pasa a apuntar a un *MultiXact*. Eso es tema del artículo sobre locks.

## Trampas comunes

- **"Las filas borradas liberan espacio."** No de inmediato. `DELETE` solo rellena `xmax`. El espacio vuelve a ser reutilizable después del `VACUUM`, y solo vuelve al sistema operativo en casos específicos (páginas vacías al final de la tabla). `VACUUM FULL` reescribe la tabla, pero exige `ACCESS EXCLUSIVE`.
- **Tomar `n_dead_tup` como verdad absoluta.** Es una estadística aproximada, actualizada de forma asíncrona. En mis pruebas, `n_dead_tup` apareció como 0 justo después del update porque las estadísticas aún no habían sido liberadas por la sesión. Usa `pg_stat_force_next_flush()` solo en pruebas.
- **`idle in transaction` en ORMs y pools.** Una transacción abierta solo esperando a la aplicación (por ejemplo, esperando una llamada HTTP externa) mantiene detenido el horizonte de limpieza. El parámetro `idle_in_transaction_session_timeout` existe para esto.
- **Creer que `REPEATABLE READ` cuesta más espacio que `READ COMMITTED` por sí solo.** El costo viene de la *duración* de la transacción. Una transacción `READ COMMITTED` que dura horas retiene el horizonte de forma parecida, porque su `backend_xmin` se actualiza en cada statement, pero un statement largo mantiene su snapshot mientras dura.
- **Confundir el `xmin` de la tupla con el `backend_xmin` de la sesión.** El primero es el creador de la versión; el segundo es el horizonte que la sesión está reteniendo.

## Recomendaciones prácticas

1. Trata las transacciones como un recurso escaso: ábrelas tarde, ciérralas pronto, sin I/O externo en el medio.
2. Configura `idle_in_transaction_session_timeout` y `statement_timeout` según el perfil de la aplicación, y monitorea `pg_stat_activity` por `state = 'idle in transaction'` y `backend_xmin` antiguo.
3. Para tablas con muchos updates en columnas no indexadas, evalúa un `fillfactor` menor que 100 y sigue `n_tup_hot_upd / n_tup_upd`.
4. Revisa los índices que cubren columnas actualizadas con frecuencia: cada uno de ellos puede impedir HOT.
5. No resuelvas el bloat con `VACUUM FULL` por reflejo; entiende primero por qué la limpieza estaba bloqueada.

## Preguntas frecuentes

**¿PostgreSQL tiene undo log?**
No en el sentido de InnoDB. Las versiones antiguas quedan en el propio heap. El WAL registra cambios para la recuperación ante fallos, pero no se consulta para armar versiones antiguas de las filas.

**¿Un `SELECT` puede bloquear un `UPDATE`?**
En términos de filas, no: los lectores no adquieren locks que entren en conflicto con los escritores. Hay excepciones a nivel de tabla (por ejemplo, un `ACCESS SHARE` de lectura entra en conflicto con el `ACCESS EXCLUSIVE` de un DDL), pero ese es otro mecanismo.

**¿Por qué mi `UPDATE` de una columna pequeña aumentó el tamaño de la tabla?**
Porque crea una versión completa de la fila, no un delta. Se copia toda la tupla, incluidas las columnas que no cambiaron (excepto los valores almacenados en TOAST, que pueden compartirse entre versiones cuando no se modifican).

**¿Cuánto tiempo permanece una versión muerta en el disco?**
Hasta que (1) ningún snapshot activo pueda verla y (2) un `VACUUM` o una poda de página la elimine. Si hay una transacción antigua abierta, puede ser indefinido.

## Conclusión

MVCC no es magia ni una funcionalidad opcional: es la razón por la que PostgreSQL puede leer sin bloquear escritores y hacer rollback en tiempo constante. El precio es físico y visible: cada `UPDATE` crea una nueva tupla, cada `DELETE` deja una tupla muerta, y la definición de "muerta" depende del snapshot más antiguo aún en uso. La mayoría de los problemas de bloat que veo descritos en relatos de producción no se deben a la falta de `VACUUM`, sino a algo que impide que el `VACUUM` avance. El próximo artículo, [VACUUM, autovacuum y wraparound](/es/blog/postgresql-vacuum-autovacuum-wraparound), sigue exactamente ese rastro.

## Referencias

Este artículo es un estudio basado en las fuentes siguientes. Los pasajes marcados como opinión reflejan mi lectura. Los experimentos se ejecutaron en un PostgreSQL 17.10 local; los resultados numéricos ilustran el mecanismo y no representan un benchmark.

- PostgreSQL Documentation 17, [13.1. Introduction (MVCC)](https://www.postgresql.org/docs/17/mvcc-intro.html)
- PostgreSQL Documentation 17, [13.2. Transaction Isolation](https://www.postgresql.org/docs/17/transaction-iso.html)
- PostgreSQL Documentation 17, [65.6. Database Page Layout](https://www.postgresql.org/docs/17/storage-page-layout.html)
- PostgreSQL Documentation 17, [65.7. Heap-Only Tuples (HOT)](https://www.postgresql.org/docs/17/storage-hot.html)
- PostgreSQL Documentation 17, [24.1. Routine Vacuuming](https://www.postgresql.org/docs/17/routine-vacuuming.html)
- PostgreSQL Documentation 17, [F.25. pageinspect](https://www.postgresql.org/docs/17/pageinspect.html)
- MySQL 8.4 Reference Manual, [17.3 InnoDB Multi-Versioning](https://dev.mysql.com/doc/refman/8.4/en/innodb-multi-versioning.html)
