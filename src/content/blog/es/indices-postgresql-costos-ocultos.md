---
title: "Índices en PostgreSQL: tipos, orden de las columnas y los costos que nadie enumera"
description: "B-tree, Hash, GiST, SP-GiST, GIN y BRIN; índices compuestos, parciales, de expresión y con INCLUDE; index-only scan y visibility map; y el costo real de escritura y mantenimiento, medido."
pubDate: 2026-10-31T10:30:00-03:00
author: "Gabriel Campos"
category: "Bases de Datos"
tags:
  - "PostgreSQL"
  - "Índices"
  - "B-tree"
  - "GIN"
  - "BRIN"
  - "Bases de Datos"
  - "Serie PostgreSQL por Dentro"
draft: false
lang: "es"
translationKey: "postgres-indexes"
---

En una tabla de eventos con 1 millón de filas, un índice parcial de 240 kB atiende la consulta de la cola de pendientes; un índice completo sobre la misma columna ocupa 21 MB. En otro experimento, insertar 300.000 filas resultó cerca de 2,8 veces más lento después de añadir cinco índices a la tabla. Ambos resultados nacen de la misma raíz: **un índice es una segunda copia ordenada (o resumida) de parte de los datos**, y toda copia tiene que mantenerse.

Este es el cuarto artículo de la serie *PostgreSQL por Dentro*. Parte de que ya sabes qué es `CREATE INDEX` y se centra en lo que suele quedar fuera: cuándo tiene sentido cada tipo de índice, cómo funciona el orden de las columnas, qué cambia con `INCLUDE` y los *index-only scans*, y cuánto cuesta cada índice en la escritura.

> Este artículo es un estudio basado en la documentación oficial y en experimentos que ejecuté en PostgreSQL 17.10 y 18.6 locales y descartables (tabla `ev` con 1.000.000 de filas). Los pasajes marcados como opinión reflejan mi lectura. Las referencias están al final. Los números de tiempo y tamaño ilustran el mecanismo y dependen de la máquina, los datos y la configuración.

## Los tipos de índice y qué resuelve cada uno

PostgreSQL ofrece seis métodos de acceso nativos. La documentación (cap. 11.2) los describe así, y la elección tiene más que ver con **qué operador necesitas** que con "cuál es más rápido":

| Tipo | Operadores / uso | Cuándo tiene sentido |
|---|---|---|
| **B-tree** (por defecto) | `<`, `<=`, `=`, `>=`, `>`, `BETWEEN`, `IN`, `IS NULL`, `ORDER BY` | casi todo: igualdad, rango, ordenamiento |
| **Hash** | solo `=` | igualdad pura (guarda un hash de 32 bits del valor) |
| **GiST** | infraestructura para estrategias variadas: geometría, vecino más cercano (`<->`), rangos, full-text | datos que no son "ordenables" linealmente |
| **SP-GiST** | estructuras no balanceadas: quadtrees, k-d trees, tries | datos con particionamiento natural del espacio |
| **GIN** | índice invertido: una entrada por componente de valores compuestos (arrays, `jsonb`, `tsvector`) | "¿este valor contiene X?" |
| **BRIN** | resúmenes por rangos de bloques físicos (`<`, `<=`, `=`, `>=`, `>`) | columnas **correlacionadas con el orden físico** de la tabla |

Dos observaciones sobre los límites de la documentación: la página de tipos solo cita los arrays como ejemplo de GIN en la distribución estándar (el soporte de `jsonb` y `tsvector` aparece en otras partes del manual), y no trata los *index-only scans*, que son tema de otra sección.

### B-tree: el valor por defecto, con buenas razones

B-tree maneja igualdad, rango y ordenamiento, y soporta `IS NULL`/`IS NOT NULL`. Es también el único tipo que *siempre* soporta *index-only scan* (GiST y SP-GiST solo para algunas clases de operadores; GIN no lo soporta, según la documentación).

### Hash: más estrecho de lo que parece

Guarda solo el código hash. Solo sirve para `=`, no ordena. Una prueba mía, que no debe generalizarse: en una columna `email` con 50.000 valores distintos repetidos ~20 veces cada uno, el índice hash quedó en **32 MB** y el B-tree en **8,5 MB**. El resultado depende de la distribución (muchos valores duplicados), pero sirve de alerta contra la idea de que "hash es más pequeño y más rápido para igualdad" sin medir. Compara siempre `pg_relation_size`.

### GIN: invertido, bueno para "contiene"

```sql
CREATE INDEX ev_gin ON ev USING gin (payload jsonb_path_ops);

SELECT count(*) FROM ev WHERE payload @> '{"k": 5, "tag": "a3"}';
-- Bitmap Index Scan on ev_gin (actual rows=1428) ... Buffers: shared hit=48
```

El índice (4.448 kB, mucho menor que el heap de 111 MB) respondió a la condición compuesta con 48 accesos a buffer de índice. La contrapartida de GIN es el mantenimiento: tiene un costo de escritura mayor que B-tree. En mi experimento de escritura (abajo), GIN fue el quinto índice y añadió cerca de 240 ms al lote, el segundo mayor salto de la secuencia (el mayor fue el índice de expresión `lower(email)`, ~300 ms).

### BRIN: pequeño, pero solo para columnas correlacionadas

BRIN guarda, para cada rango de páginas (`pages_per_range`, por defecto 128), el mínimo y el máximo de la columna. Si los valores acompañan el orden físico (típicamente `created_at` en tablas *append-only*), el índice es minúsculo y bastante útil. Lo medí en la tabla `ev`, cuya columna `creado` crece con el `id`:

| Índice en `creado` | Tamaño | Plan de la consulta (2 días, 8.640 filas) |
|---|---|---|
| B-tree | **21 MB** | `Index Only Scan`, `Buffers: ... read=26` |
| BRIN (`pages_per_range=32`) | **32 kB** | `Bitmap Heap Scan`, `Heap Blocks: lossy=160`, `Rows Removed by Index Recheck: 2593` |

BRIN costó más de 600× menos espacio, al precio de leer 160 páginas del heap y reevaluar el predicado (*lossy*). Si se pierde la correlación con el orden físico (por ejemplo, por `UPDATE`s que mueven filas, o cargas fuera de orden), BRIN se degrada hasta quedar inútil, y la documentación dice que es "más efectivo para columnas bien correlacionadas con el orden físico". Verifica `pg_stats.correlation` antes de adoptarlo.

## Índices compuestos y el orden de las columnas

La regla, de la documentación (para B-tree):

> "Las restricciones de igualdad sobre las columnas de la izquierda, más cualquier restricción de desigualdad sobre la primera columna sin igualdad, siempre se usarán para limitar la porción del índice que se recorre."

Y, para las columnas a la derecha de esas, "se comprueban en el índice, así que siempre ahorran visitas a la tabla, pero no necesariamente reducen la porción del índice que hay que recorrer".

En la práctica, para `(tenant, creado)`:

| Consulta | Uso del índice |
|---|---|
| `tenant = 42 AND creado BETWEEN ...` | Limita el recorrido al rango exacto. Medido: `Bitmap Index Scan` con `Buffers: shared hit=3`, 21 filas |
| `tenant = 42` | Usa el prefijo; bien |
| `creado BETWEEN ...` (sin `tenant`), **PostgreSQL 17** | El índice no limita la búsqueda. En mi prueba, el planner hizo un `Parallel Seq Scan` con `Rows Removed by Filter: 332973` por worker |
| misma consulta, **PostgreSQL 18** | *Skip scan*: `Bitmap Index Scan` con `Index Searches: 202`, `Buffers: shared hit=409 read=232` contra ~14.267 buffers del seq scan en PG 17 con los mismos datos |

El **skip scan** es una novedad de PostgreSQL 18 (en las notas de versión: "los índices B-tree multicolumna pueden usarse cuando no hay restricción de igualdad en las columnas de la izquierda"). El índice se recorre con búsquedas repetidas `tenant = N AND creado ...` para cada valor distinto de la columna líder, de ahí las 202 *index searches* (el orden de magnitud del número de tenants, 200). La documentación deja claro el límite: solo compensa cuando hay **pocos valores distintos** en la columna líder; con muchos, habría que recorrer el índice entero y el planner prefiere `Seq Scan`.

Consecuencias prácticas:

- Pon primero las columnas con **igualdad** en las consultas más frecuentes, luego la columna de rango o de ordenamiento.
- No es regla poner primero la columna "más selectiva": lo que importa es cómo las consultas restringen el índice, y si hay un `ORDER BY` que atender.
- La documentación advierte: "los índices multicolumna deben usarse con moderación. En la mayoría de las situaciones, un índice de una sola columna es suficiente" y los índices con más de tres columnas "difícilmente ayudan, a menos que el uso de la tabla sea extremadamente estilizado".

> **Opinión:** el skip scan no elimina la necesidad de pensar en el orden de las columnas. Ayuda cuando la columna líder tiene cardinalidad baja (pocos tenants, pocos tipos). En entornos multi-tenant con miles de tenants, la consulta sin `tenant` seguirá exigiendo otro índice.

## Índices parciales

Un índice parcial cubre solo las filas que satisfacen un predicado. En la tabla `ev`, el 99% de las filas tiene `procesado = true`. Una cola de "pendientes" solo consulta el 1% restante:

```sql
CREATE INDEX ev_pend_part ON ev (creado) WHERE NOT procesado;
-- tamaño: 240 kB   (vs. 21 MB del índice completo sobre la misma columna)

SELECT id FROM ev WHERE NOT procesado ORDER BY creado LIMIT 10;
-- Index Scan using ev_pend_part ... Buffers: shared read=3
```

Además de ser menor, es más barato de mantener: los `INSERT` y `UPDATE` que no satisfacen el predicado ni siquiera lo tocan. Dos detalles:

- La consulta debe implicar el predicado del índice (el planner lo demuestra en casos simples). Escribe la consulta con el mismo predicado del índice; los predicados parametrizados o más complejos pueden no ser reconocidos. Verifícalo en el `EXPLAIN`.
- Un índice `UNIQUE` parcial es una forma idiomática de imponer "único entre los activos".

## Índices de expresión

El planner solo usa un índice cuando la expresión de la consulta coincide con la del índice.

```sql
-- Sin índice sobre la expresión: Parallel Seq Scan, Rows Removed by Filter: 333327 (por worker)
SELECT count(*) FROM ev WHERE lower(email) = 'user42@example.com';

CREATE INDEX ev_email_lower ON ev (lower(email));
ANALYZE ev;
-- Después: Bitmap Index Scan on ev_email_lower (actual rows=20), 8.584 kB
```

El `ANALYZE` después del `CREATE INDEX` importa: PostgreSQL recolecta estadísticas de la **expresión** indexada, lo que también mejora las estimaciones de cardinalidad (tema del [artículo sobre el planner](/pt/blog/query-planner-postgresql)). La función debe ser `IMMUTABLE`.

## Covering indexes, INCLUDE e index-only scans

Un *index-only scan* responde la consulta sin visitar el heap, pero solo cuando se cumplen dos condiciones de la documentación: el tipo de índice lo soporta, y la consulta referencia solo columnas almacenadas en el índice. Como las entradas del índice no guardan información de visibilidad MVCC, el executor consulta el **visibility map**: si la página del heap está marcada como *all-visible*, el dato viene del índice; si no, hay que visitar el heap. El mapa es "cuatro órdenes de magnitud menor que el heap" y por eso suele quedar en caché; la ganancia aparece cuando "una fracción significativa de las páginas del heap tiene marcados los bits all-visible", lo que depende del `VACUUM` (véase el [artículo sobre VACUUM](/pt/blog/vacuum-autovacuum-wraparound-postgresql)).

La cláusula `INCLUDE` añade columnas al índice **sin hacerlas parte de la clave de búsqueda**:

```sql
CREATE INDEX ev_cov ON ev (tenant, creado) INCLUDE (tipo);

SELECT tipo FROM ev
WHERE tenant = 42 AND creado >= '2025-03-01' AND creado < '2025-04-01';
-- Index Only Scan using ev_cov (actual rows=669), Heap Fetches: 0, Buffers: shared hit=1 read=6
```

Costo: `ev_cov` ocupa **39 MB** contra **30 MB** del índice sin `INCLUDE` (el `smallint tipo` añadió ~30%). La documentación recomienda ser conservador: las columnas de payload "duplican datos de la tabla e hinchan el índice", e incluirlas solo tiene sentido "si la tabla cambia con la lentitud suficiente para que el index-only scan no necesite acceder al heap". Para los índices `UNIQUE`, la unicidad vale solo para las columnas de la clave.

En mi experimento anterior sobre planes (artículo del planner), una tabla sin `VACUUM` reciente tuvo el plan cambiado de `Index Only Scan` a `Bitmap Heap Scan`; tras el `VACUUM`, volvió. Es decir: **el covering index solo cumple la promesa si el visibility map está al día**.

## El costo oculto: escritura, espacio y HOT

Cada índice adicional es una estructura que actualizar en cada `INSERT`, en cada `DELETE` (marcación para vacuum) y en cada `UPDATE` que no sea HOT.

### Medición de escritura

Inserté 300.000 filas en una tabla `UNLOGGED` (para aislar el costo de WAL), repitiendo 3 veces cada configuración. La tabla siempre tiene la clave primaria; los "N índices" de abajo son los extras:

| Índices extra | Tiempo de `INSERT` (ms, 3 ejecuciones) |
|---|---|
| 0 (solo PK) | 433 · 438 · 353 |
| 1 (`(tenant, creado)`) | 520 · 512 · 499 |
| 2 (+ `lower(email)`) | 810 · 790 · 802 |
| 3 (+ `(tipo)`) | 874 · 869 · 893 |
| 4 (+ `(creado)`) | 985 · 975 · 977 |
| 5 (+ GIN en `payload`) | 1210 · 1215 · 1249 |

Cinco índices extra dejaron la carga ~2,8× más lenta que solo la PK. Conviene recordar el contexto: una máquina, una tabla, sin concurrencia, `UNLOGGED`, datos con mucha repetición. El valor absoluto no es transferible, pero la tendencia sí: el costo crece con el número y con el tipo de índice (el de expresión `lower(email)` y el GIN costaron más que un B-tree simple sobre un entero).

### Espacio

En la tabla `ev`, el heap tenía **111 MB**, la PK **21 MB** y un índice compuesto **30 MB**. En tablas de fila estrecha, es común que la suma de los índices supere al propio heap.

### HOT: el costo escondido

Como se vio en el [artículo de MVCC](/pt/blog/mvcc-postgresql), un `UPDATE` solo puede ser HOT si no altera **ninguna columna indexada**. Indexar `status` o `updated_at` en una tabla con muchas actualizaciones de esas columnas desactiva HOT para esos updates y multiplica las entradas de índice. En el experimento de ese artículo, con `fillfactor` 70, 448 de 1.000 updates sobre una columna no indexada fueron HOT; al actualizar la columna indexada `w`, los contadores de HOT no aumentaron.

### Índices que nadie usa

`pg_stat_user_indexes.idx_scan` cuenta cuántas veces se usó cada índice desde el último reset de las estadísticas:

```sql
SELECT s.indexrelid::regclass AS indice,
       pg_size_pretty(pg_relation_size(s.indexrelid)) AS tamano,
       s.idx_scan,
       i.indisunique OR i.indisprimary AS garantiza_constraint
FROM pg_stat_user_indexes s
JOIN pg_index i USING (indexrelid)
ORDER BY s.idx_scan, pg_relation_size(s.indexrelid) DESC;
```

En mi laboratorio, `ev_hash` (32 MB) y `ev_bt_email` (8,5 MB) aparecieron con `idx_scan = 0`. Antes de eliminar cualquier índice con cero usos, recuerda que:

- los índices que sostienen `UNIQUE`/`PRIMARY KEY`/`EXCLUDE` y las claves foráneas no son "inútiles" solo por no leerse;
- las estadísticas son **por servidor**: un índice usado solo en réplicas de lectura, o en un informe trimestral, puede aparecer con cero en el primario;
- las estadísticas se ponen a cero con `pg_stat_reset()` y pueden tener poco historial;
- elimina con `DROP INDEX CONCURRENTLY` y, si es posible, tras un período de observación con señal real de producción.

## Trampas comunes

- **Indexar toda columna que aparece en `WHERE`.** Sin medir la selectividad y la frecuencia, pagas escritura y espacio por nada.
- **Índices redundantes.** `(a)` es redundante con `(a, b)` para búsquedas por prefijo (excepción: ordenamiento, `INCLUDE` y tipos de índice distintos).
- **Función sobre la columna.** `WHERE lower(email) = ...` o `WHERE creado::date = ...` no usan un índice simple sobre la columna; usa un índice de expresión o reescribe el rango.
- **`CREATE INDEX` sin `CONCURRENTLY` en una tabla en uso.** Bloquea escrituras durante la construcción. La variante concurrente es más lenta y, si falla, deja un índice *invalid* que hay que eliminar.
- **Esperar que un `INCLUDE` funcione sin `VACUUM` al día.** Mostrado arriba.
- **Adoptar BRIN sin comprobar la correlación.**
- **Confiar en que más columnas en el índice siempre ayudan.** La documentación dice lo contrario.
- **Olvidar que el planner puede legítimamente preferir `Seq Scan`.** Ya lo vimos en el artículo anterior.

## Recomendaciones prácticas

1. Elige el tipo por el operador: B-tree para igualdad/rango/orden; GIN para "contiene" en `jsonb`/arrays/full-text; BRIN para tablas append-only grandes con columna correlacionada; GiST/SP-GiST para geometría y datos espaciales.
2. Ordena las columnas del índice compuesto así: igualdades primero, luego rango/ordenamiento. Prueba los planes reales con `EXPLAIN (ANALYZE, BUFFERS)`.
3. Usa índices parciales para colas, flags raras y unicidad condicional.
4. Usa `INCLUDE` solo en consultas críticas, con columnas estrechas, en tablas cuyo visibility map se mantenga al día.
5. Mide el costo de escritura con la carga real antes y después de añadir un índice.
6. Haz una auditoría periódica de índices sin uso, mirando también las réplicas.
7. En PostgreSQL 18, considera el skip scan, pero confirma con `Index Searches` en el `EXPLAIN ANALYZE`.

## Preguntas frecuentes

**¿Un índice siempre acelera las consultas?**
No. Para porciones grandes de la tabla, el planner puede (correctamente) preferir `Seq Scan`; y todo índice añade costo de escritura.

**¿Cuál es el orden de las columnas en un índice compuesto?**
Igualdades a la izquierda, rango u ordenamiento después. El orden cambia cuánto del índice se recorre.

**¿Cuándo usar GIN en lugar de B-tree?**
Cuando la pregunta es de pertenencia/contención en valores compuestos (`@>`, `&&`, búsqueda textual), donde un B-tree no ayuda.

**¿`INCLUDE` es lo mismo que poner la columna en la clave?**
No. Las columnas `INCLUDE` no entran en la búsqueda ni en la unicidad; solo evitan la visita al heap.

**¿Puedo crear índices sin bloquear escrituras?**
Sí, con `CREATE INDEX CONCURRENTLY`, a costa de más tiempo y de un posible índice inválido en caso de fallo.

## Conclusión

Un índice es una decisión de costo-beneficio, no una optimización gratuita. Los números del laboratorio lo resumen: el índice parcial cupo en 240 kB donde el completo ocupaba 21 MB; BRIN ocupó 32 kB donde el B-tree ocupaba 21 MB; y cinco índices más hicieron que la carga de escritura fuera casi tres veces más lenta. Los beneficios son reales, pero solo para las consultas que el planner realmente usa. El próximo artículo desplaza el foco hacia la otra cara de la concurrencia: [aislamiento, locks y deadlocks](/pt/blog/isolamento-locks-deadlocks-postgresql).

## Referencias

Este artículo es un estudio basado en las fuentes siguientes. Los pasajes marcados como opinión reflejan mi lectura.

- PostgreSQL Documentation 17, [11.2. Index Types](https://www.postgresql.org/docs/17/indexes-types.html)
- PostgreSQL Documentation 18, [11.3. Multicolumn Indexes](https://www.postgresql.org/docs/18/indexes-multicolumn.html)
- PostgreSQL Documentation 17, [11.9. Index-Only Scans and Covering Indexes](https://www.postgresql.org/docs/17/indexes-index-only-scans.html)
- PostgreSQL Documentation 17, [11.8. Partial Indexes](https://www.postgresql.org/docs/17/indexes-partial.html)
- PostgreSQL Documentation 17, [11.7. Indexes on Expressions](https://www.postgresql.org/docs/17/indexes-expressional.html)
- PostgreSQL Documentation 17, [Chapter 67. BRIN Indexes](https://www.postgresql.org/docs/17/brin.html)
- PostgreSQL Documentation 17, [Chapter 66. GIN Indexes](https://www.postgresql.org/docs/17/gin.html)
- PostgreSQL Documentation 17, [28.2. The Cumulative Statistics System (`pg_stat_user_indexes`)](https://www.postgresql.org/docs/17/monitoring-stats.html)
- PostgreSQL Documentation 18, [Release Notes: PostgreSQL 18](https://www.postgresql.org/docs/18/release-18.html) (skip scan)
