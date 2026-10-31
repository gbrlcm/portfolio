---
title: "VACUUM, autovacuum y wraparound de XID: lo que tumba un PostgreSQL sin avisar"
description: "Por qué PostgreSQL necesita VACUUM, cómo decide actuar el autovacuum, qué son el freeze y el wraparound de transaction ID, y cómo diagnosticar bloat y un vacuum atascado en producción."
pubDate: 2026-10-31T09:30:00-03:00
author: "Gabriel Campos"
category: "Bases de Datos"
tags:
  - "PostgreSQL"
  - "VACUUM"
  - "Autovacuum"
  - "Bloat"
  - "Bases de Datos"
  - "Serie PostgreSQL por Dentro"
draft: false
lang: "es"
translationKey: "postgres-vacuum"
---

En febrero de 2019, Mandrill, el servicio de correo transaccional de Mailchimp, estuvo fuera de línea durante unas 40 horas. El post-mortem público de la empresa señala la causa: uno de los shards de PostgreSQL alcanzó el límite de *transaction ID* (XID), entró en modo de protección y dejó de aceptar escrituras. El mismo post-mortem cuenta que, en noviembre de 2018, los ingenieros ya habían notado que los XID estaban en cerca de la mitad del límite en el pico de carga, concluyeron que no era una amenaza inmediata y abrieron un ítem de backlog para monitorear.

Nada en este tipo de incidente exige un bug de PostgreSQL. Solo exige que una rutina de mantenimiento silenciosa, el `VACUUM`, deje de acompañar la tasa de escritura. Este es el segundo artículo de la serie *PostgreSQL por Dentro*; asume lo que explicó el [artículo anterior sobre MVCC](/es/blog/postgresql-mvcc): `UPDATE` y `DELETE` dejan versiones antiguas de las filas en el heap, y alguien tiene que limpiarlas.

> Este artículo es un estudio basado en la documentación oficial, en el post-mortem público citado y en experimentos que ejecuté en PostgreSQL 17.10 y 18.6 locales y descartables. Los pasajes marcados como opinión reflejan mi lectura. Las referencias están al final.

## Para qué sirve el VACUUM

La documentación de mantenimiento de rutina enumera cuatro motivos para ejecutar `VACUUM`:

1. recuperar o reutilizar el espacio de las filas actualizadas o eliminadas;
2. actualizar las estadísticas que usa el planner;
3. actualizar el *visibility map*, que acelera los *index-only scans*;
4. proteger contra la pérdida de datos muy antiguos por *wraparound* de transaction ID o de multixact ID.

Los dos primeros son problemas de rendimiento. El cuarto es un problema de **corrección de datos**: es el único en el que ignorar el `VACUUM` hace que la base de datos deje de aceptar escrituras.

### Qué hace el VACUUM, en la práctica

En resumen, para cada página de la tabla: identifica tuplas muertas (que ningún snapshot activo puede ver), elimina las entradas correspondientes en los índices, marca los line pointers como reutilizables, actualiza el *free space map* y el *visibility map* y, cuando es necesario, **congela** tuplas antiguas.

Ejecutando `VACUUM (VERBOSE)` en una tabla de 100.000 filas en la que borré la mitad (`DELETE ... WHERE id % 2 = 0`), la salida fue:

```text
pages: 0 removed, 1725 remain, 1725 scanned (100.00% of total)
tuples: 50000 removed, 50000 remain, 0 are dead but not yet removable
index scan needed: 1725 pages from table (100.00% of total) had 50000 dead item identifiers removed
index "b1_pkey": pages: 276 in total, 0 newly deleted, 0 currently deleted, 0 reusable
```

Y el tamaño en disco:

| Etapa | Tabla (`pg_table_size`) |
|---|---|
| 100.000 filas insertadas | 14 MB |
| después del `DELETE` de 50.000 | 14 MB |
| después del `VACUUM` | **14 MB** |
| después del `VACUUM FULL` (tras otro `DELETE` de ⅓) | 9.208 kB |

Lo que más sorprende a quien no conoce el mecanismo: **el `VACUUM` común no devolvió ni un byte al sistema operativo**. Hizo que el espacio fuera *reutilizable* dentro del archivo, lo que `pgstattuple` confirma: antes, el 45,6% de los bytes eran tuplas muertas; después, `dead_tuple_count = 0` y `free_percent = 48,8`. La documentación describe exactamente eso: el `VACUUM` común "normalmente no devuelve el espacio al sistema operativo", salvo por las páginas completamente libres al **final** de la tabla (y ese truncamiento está controlado por `vacuum_truncate` y exige `ACCESS EXCLUSIVE` por un instante).

## VACUUM FULL: por qué no es "el VACUUM más fuerte"

`VACUUM FULL` no es una versión más agresiva del mismo algoritmo. **Reescribe la tabla entera** en un archivo nuevo, compactado, y recrea los índices. Según la documentación:

- puede recuperar más espacio, pero se ejecuta de forma mucho más lenta;
- exige un lock `ACCESS EXCLUSIVE`: durante la operación, la tabla no puede leerse ni escribirse;
- necesita espacio en disco para una copia completa hasta terminar;
- **nunca** lo ejecuta el autovacuum.

> **Opinión:** `VACUUM FULL` en una tabla de producción con tráfico es, en la mayoría de los escenarios, una indisponibilidad planificada. Para compactar tablas online existen herramientas externas como la extensión `pg_repack`, que tienen sus propios costos y riesgos y merecen un estudio aparte; no las probé en este artículo.

## Autovacuum: cuándo y cómo actúa

El autovacuum es un proceso lanzador (*launcher*) que, cada `autovacuum_naptime` (por defecto: 1 minuto), reevalúa las bases de datos y dispara *workers* (por defecto: `autovacuum_max_workers = 3`) para las tablas que superaron el umbral. La fórmula para tuplas muertas, de la documentación:

```text
vacuum threshold = autovacuum_vacuum_threshold
                 + autovacuum_vacuum_scale_factor * pg_class.reltuples
```

Con los valores por defecto **50** y **0,2** (confirmados con `SHOW` en la versión 17.10), una tabla de 10.000 filas solo entra en la cola con más de `50 + 0,2 × 10000 = 2050` tuplas muertas. Lo probé con `log_autovacuum_min_duration = 0` y `autovacuum_naptime = 10s`:

| Acción | `n_dead_tup` | ¿Se disparó el autovacuum? |
|---|---|---|
| 2.000 `UPDATE`s en una tabla de 10.000 filas | 2.000 | **No** (por debajo de 2.050) |
| 200 `UPDATE`s más | 2.200 | **Sí**: `tuples: 1974 removed` |

(El primer autovacuum registrado, justo después de la carga inicial, lo disparó el gatillo de **inserción**, `autovacuum_vacuum_insert_threshold = 1000` + `autovacuum_vacuum_insert_scale_factor = 0,2`, que existe para congelar y marcar páginas como *all-visible* en tablas que solo reciben `INSERT`.)

### El problema de la escala 0,2 en tablas grandes

Como el umbral escala con el tamaño de la tabla, una tabla con 500 millones de filas solo dispara el vacuum después de ~100 millones de tuplas muertas. Dos efectos:

- un bloat tolerado del 20% suele ser inaceptable en tablas grandes de alta rotación;
- cuando el vacuum por fin se ejecuta, tiene mucho trabajo acumulado y tarda.

PostgreSQL 18 trae el parámetro `autovacuum_vacuum_max_threshold` (por defecto **100.000.000** de tuplas; no figura en la documentación de la 17), que impone un tope absoluto al umbral calculado. En versiones anteriores, el camino es reducir `autovacuum_vacuum_scale_factor` por tabla:

```sql
ALTER TABLE eventos SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_vacuum_threshold    = 10000
);
```

### Por qué el autovacuum es "lento por diseño"

El `VACUUM` está limitado por costo (*cost-based delay*) para no competir con la carga de trabajo. Valores por defecto en la documentación de la 18: `autovacuum_vacuum_cost_delay = 2ms` y `autovacuum_vacuum_cost_limit = -1` (usa `vacuum_cost_limit`, que es 200). El límite de costo se **divide proporcionalmente entre los workers activos**, de modo que añadir workers no multiplica el rendimiento total. Es un error de configuración clásico: aumentar `autovacuum_max_workers` sin aumentar el límite de costo solo reparte el mismo presupuesto en porciones más finas.

## Congelamiento (freeze) y wraparound de XID

Aquí el `VACUUM` deja de tratar de rendimiento.

Los transaction IDs tienen 32 bits. PostgreSQL compara XIDs usando aritmética módulo 2³²: para cualquier XID normal, existen 2 mil millones de XIDs "más antiguos" y 2 mil millones "más nuevos". Si una tupla tiene un `xmin` que, después de ~2 mil millones de transacciones, dejaría de parecer "del pasado", de pronto parecería "del futuro" y **desaparecería** de las consultas. Eso es lo que la documentación llama wraparound, y por eso "es necesario hacer vacuum a toda tabla de toda base de datos al menos una vez cada dos mil millones de transacciones".

La solución es el **congelamiento**: el `VACUUM` marca como congeladas las tuplas suficientemente antiguas, y una tupla congelada se considera más antigua que cualquier XID normal. En términos físicos, la tupla recibe las dos flags `HEAP_XMIN_COMMITTED | HEAP_XMIN_INVALID` (máscara `0x0300` = 768 en `t_infomask`) en lugar de que se reescriba el `xmin`. Se puede observar:

```sql
CREATE TABLE fz AS SELECT g id, repeat('z',50) v FROM generate_series(1,1000) g;

SELECT count(*) FILTER (WHERE (t_infomask & 768) = 768) AS frozen, count(*) AS total
FROM heap_page_items(get_raw_page('fz', 0));
--  frozen | total
--       0 |    97

VACUUM (FREEZE) fz;
--  frozen | total
--      97 |    97
```

### Los parámetros, por orden de importancia

Valores por defecto verificados con `SHOW` en 17.10 y contrastados con la documentación:

| Parámetro | Por defecto | Qué hace |
|---|---|---|
| `vacuum_freeze_min_age` | 50 millones | edad mínima de un XID para que la tupla se congele durante un vacuum normal |
| `vacuum_freeze_table_age` | 150 millones | edad de la tabla a partir de la cual el `VACUUM` se vuelve **agresivo** (recorre todas las páginas que no están *all-frozen*) |
| `autovacuum_freeze_max_age` | 200 millones | edad de `relfrozenxid` que **fuerza** un autovacuum "anti-wraparound", incluso con el autovacuum desactivado |
| `vacuum_failsafe_age` | 1.600 millones | modo de emergencia: el vacuum ignora el *cost delay* y omite el trabajo no esencial (como la limpieza de índices) |
| `autovacuum_multixact_freeze_max_age` | 400 millones | equivalente de `autovacuum_freeze_max_age` para multixacts |

La secuencia de defensas, por lo tanto: el vacuum normal va congelando; a los 150 millones de edad se vuelve agresivo; a los 200 millones se fuerza el autovacuum; a los 1.600 millones el *failsafe* acelera todo; y cuando faltan 40 millones de transacciones el servidor empieza a emitir `WARNING`; con menos de 3 millones, rechaza nuevas transacciones que consuman XID:

```text
WARNING:  database "mydb" must be vacuumed within 39985967 transactions
ERROR:  database is not accepting commands that assign new transaction IDs
        to avoid wraparound data loss in database "mydb"
```

Según la documentación, en ese estado todavía es posible ejecutar el propio `VACUUM`. Ya no es necesario reiniciar en modo *single-user*, como ocurría en versiones antiguas. Aun así, el caso de Mandrill muestra el costo real: el vacuum necesario llegó a estimarse en decenas de días, y el equipo terminó truncando dos tablas de varios terabytes para liberar la situación (según el post-mortem público). Por lo que afirma el texto, la causa probable fue que el autovacuum no acompañó la carga de escritura, aunque la empresa dijo que no pudo confirmar si se quedó atrás o falló.

### Eager freezing en PostgreSQL 18

El vacuum "no agresivo" solo recorre páginas que no están *all-visible*, y por eso puede posponer el congelamiento hasta convertirse en un recorrido agresivo costoso. Las notas de versión de PostgreSQL 18 dicen que el `VACUUM` normal ahora puede congelar algunas páginas *all-visible* de forma anticipada, controlado por `vacuum_max_eager_freeze_failure_rate` (por defecto `0.03`, y `0` lo desactiva). En la documentación, el parámetro limita la fracción de páginas que pueden recorrerse sin lograr quedar *all-frozen* antes de que se apague el recorrido anticipado. El objetivo es distribuir el trabajo de congelamiento a lo largo de varios vacuums, en lugar de concentrarlo en un vacuum agresivo. Comento el cambio en el [artículo sobre PostgreSQL 18](/pt/blog/postgresql-18-mudancas-que-importam).

## Qué retiene la limpieza

El `VACUUM` solo elimina tuplas por debajo del horizonte (*removable cutoff*), y todo lo que retiene un `xmin` antiguo retiene el horizonte. La documentación cita tres fuentes específicas, y yo agrego una cuarta:

1. **Transacciones preparadas** olvidadas (`pg_prepared_xacts`);
2. **Transacciones largas** o `idle in transaction` (`pg_stat_activity.backend_xmin`);
3. **Replication slots** abandonados (`pg_replication_slots.xmin` y `catalog_xmin`);
4. **Réplicas con `hot_standby_feedback`**, que propagan el `xmin` de las consultas de la réplica al primario.

Reproduje el primer caso en el artículo anterior: con una transacción `REPEATABLE READ` abierta, el `VACUUM (VERBOSE)` reportó `2 are dead but not yet removable` y `removable cutoff: 744`, el `backend_xmin` de la sesión abierta.

## Diagnóstico en producción

Consultas que uso como punto de partida. Todas son de solo lectura.

**1. Quién está más cerca del wraparound:**

```sql
SELECT datname, age(datfrozenxid) AS edad_xid,
       round(100.0 * age(datfrozenxid) / 2147483647, 1) AS pct_del_limite
FROM pg_database
ORDER BY 2 DESC;

SELECT c.oid::regclass AS tabla, age(c.relfrozenxid) AS edad_xid,
       mxid_age(c.relminmxid) AS edad_mxid
FROM pg_class c
WHERE c.relkind IN ('r','m','t')
ORDER BY 2 DESC
LIMIT 20;
```

**2. Quién retiene el horizonte:**

```sql
SELECT pid, state, age(backend_xmin) AS edad_xmin, now() - xact_start AS dur_xact, left(query,80)
FROM pg_stat_activity
WHERE backend_xmin IS NOT NULL
ORDER BY age(backend_xmin) DESC NULLS LAST;

SELECT slot_name, slot_type, active, age(xmin) AS edad_xmin, age(catalog_xmin) AS edad_catalog_xmin
FROM pg_replication_slots;

SELECT gid, prepared, age(transaction) FROM pg_prepared_xacts;
```

**3. Tuplas muertas y último vacuum (estadístico, no exacto):**

```sql
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum, autovacuum_count
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 20;
```

**4. Bloat medido de verdad:** `pgstattuple` lee la tabla entera (costo de I/O proporcional al tamaño) y solo pueden ejecutarlo superusuarios o miembros de `pg_stat_scan_tables`. `pgstattuple_approx` omite las páginas marcadas como *all-visible* y es más barato, a costa de estimaciones en parte de los números.

**5. Logs del autovacuum:** `log_autovacuum_min_duration = 0` (en pruebas) o un valor como `1s` en producción registra cada ejecución con conteo de páginas, tuplas eliminadas, `removable cutoff`, tiempo y WAL generado, lo que permite ver la tendencia en lugar de adivinar.

En PostgreSQL 18, las notas de versión añaden `total_vacuum_time`, `total_autovacuum_time`, `total_analyze_time` y `total_autoanalyze_time` en `pg_stat_all_tables`, y un reporte opcional del tiempo dedicado a *cost delay* (requiere `track_cost_delay_timing`).

## Trampas comunes

- **Desactivar el autovacuum "porque estorba".** Sigue ejecutándose en modo anti-wraparound cuando se alcanza `autovacuum_freeze_max_age`, solo que en el peor momento, con el mayor volumen de trabajo acumulado.
- **Alertar solo por espacio en disco.** El wraparound no depende del disco. Monitorea `age(datfrozenxid)` y `mxid_age`.
- **Aumentar workers sin aumentar el presupuesto de costo** (explicado arriba).
- **Tratar el autovacuum anti-wraparound como cualquier otro.** Es el vacuum que la base de datos se niega a posponer; cancelarlo repetidamente solo empuja el problema. Si estorba una ventana de mantenimiento, el camino es programar la ventana con margen de edad, no matar el proceso.
- **Ejecutar `VACUUM FULL` por reflejo.** No corrige la causa y bloquea la tabla.
- **Confiar en `n_dead_tup` como medida exacta.** Es una estadística del sistema de recolección, actualizada de forma asíncrona.
- **Tablas de solo `INSERT`.** Sin tuplas muertas, el gatillo por `INSERT` (versiones 13+) es lo que dispara el vacuum para congelar y marcar páginas como *all-visible*.

## Recomendaciones prácticas

1. Monitorea `age(datfrozenxid)` y `age(relfrozenxid)` con una alerta bien por debajo de 200 millones (el umbral del vacuum forzado), por ejemplo a partir de 100 a 150 millones, ajustando al ritmo de consumo de XIDs de tu sistema.
2. Ajusta `autovacuum_vacuum_scale_factor` por tabla para las más grandes y más actualizadas.
3. Aumenta `autovacuum_vacuum_cost_limit` (o reduce el `cost_delay`) si los logs muestran vacuums que no terminan; verifica antes si el cuello de botella es el I/O.
4. Haz auditorías periódicas de *slots*, transacciones preparadas y transacciones `idle in transaction`.
5. Define `idle_in_transaction_session_timeout`.
6. Trata "vacuum corriendo hace días" como un incidente en curso, no como un estado normal.

## Preguntas frecuentes

**¿El autovacuum se ejecuta en horas pico?**
Sí, cuando la tabla supera el umbral. Está limitado por costo para reducir el impacto, pero no está programado.

**¿Necesito `VACUUM` manual si tengo autovacuum?**
Normalmente no. Casos comunes: después de cargas masivas (`VACUUM (ANALYZE)`), o para congelar una tabla que pasará a ser de solo lectura.

**¿`VACUUM` bloquea consultas?**
El `VACUUM` común no bloquea `SELECT`, `INSERT`, `UPDATE` ni `DELETE`, pero impide `ALTER TABLE` sobre la tabla mientras se ejecuta.

**¿Puede ocurrir wraparound en una base de datos inactiva?**
Solo si se consumen transacciones y nunca se congelan; la edad se mide en XIDs consumidos, no en tiempo.

**¿PostgreSQL pierde datos en el wraparound?**
El servidor fue diseñado para rechazar nuevas transacciones antes de que eso ocurra, justamente para evitar la pérdida de datos; el precio es la indisponibilidad de escritura.

## Conclusión

El `VACUUM` conecta tres cosas que suelen tratarse por separado: el rendimiento (bloat y estadísticas), el ahorro de I/O (visibility map) y la seguridad de los datos (freeze). El autovacuum por defecto es un buen punto de partida para bases de datos pequeñas y una configuración peligrosa para tablas grandes y de mucha escritura. En mi lectura de las fuentes, lo que más separa los incidentes evitables de los inevitables es tener métricas de edad de XID y de horizonte de limpieza *antes* del problema. El próximo artículo sube una capa: [cómo el planner elige un plan de ejecución](/es/blog/planificador-de-consultas-postgresql), que depende de las estadísticas que mantiene `ANALYZE`.

## Referencias

Este artículo es un estudio basado en las fuentes siguientes. Los pasajes marcados como opinión reflejan mi lectura. Los experimentos se ejecutaron en PostgreSQL 17.10 y 18.6 locales; los números ilustran el mecanismo y no representan un benchmark.

- PostgreSQL Documentation 17, [24.1. Routine Vacuuming](https://www.postgresql.org/docs/17/routine-vacuuming.html)
- PostgreSQL Documentation 18, [19.10. Vacuuming (runtime-config-vacuum)](https://www.postgresql.org/docs/18/runtime-config-vacuum.html)
- PostgreSQL Documentation 18, [Release Notes: PostgreSQL 18](https://www.postgresql.org/docs/18/release-18.html)
- PostgreSQL Documentation 18, [F.32. pgstattuple](https://www.postgresql.org/docs/18/pgstattuple.html)
- PostgreSQL Documentation 17, [65.7. Heap-Only Tuples (HOT)](https://www.postgresql.org/docs/17/storage-hot.html)
- Mailchimp, [What we learned from the recent Mandrill outage](https://mailchimp.com/what-we-learned-from-the-recent-mandrill-outage/) (post-mortem público, febrero de 2019)
- Sentry, [Transaction ID Wraparound in Postgres](https://blog.sentry.io/transaction-id-wraparound-in-postgres) (post de 2015 sobre otro incidente del mismo tipo)
