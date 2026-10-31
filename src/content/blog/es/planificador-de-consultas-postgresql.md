---
title: "El query planner de PostgreSQL: cómo la base de datos elige un plan de ejecución (y por qué se equivoca)"
description: "Cómo el planner de PostgreSQL estima costos, elige entre Seq Scan, Index Scan y Bitmap Scan, decide entre Nested Loop, Hash o Merge Join y por qué las estimaciones de cardinalidad erróneas generan planes caros."
pubDate: 2026-10-31T10:00:00-03:00
author: "Gabriel Campos"
category: "Bases de Datos"
tags:
  - "PostgreSQL"
  - "Query Planner"
  - "EXPLAIN"
  - "Optimización de Consultas"
  - "Bases de Datos"
  - "Serie PostgreSQL por Dentro"
draft: false
lang: "es"
translationKey: "postgres-query-planner"
---

La misma consulta, `WHERE status = ...`, se ejecutó de dos formas completamente distintas en una tabla de 1 millón de filas que armé para este artículo. Para `'pendiente'` (2% de las filas) la base de datos usó un índice; para `'entregado'` (98%) ignoró el índice y leyó la tabla entera, y acertó en los dos casos. Quien aprende SQL temprano suele cargar con la regla "índice es bueno, `Seq Scan` es malo", y es falsa de una manera que solo aparece cuando se lee el plan.

SQL es declarativo: describes el resultado, y el **planner** (u *optimizer*) decide *cómo* obtenerlo. Este es el tercer artículo de la serie *PostgreSQL por Dentro*. Cubre qué sabe el planner, cómo calcula costos, qué operadores puede elegir y, sobre todo, por qué se equivoca y cómo se ve eso en el `EXPLAIN`.

> Este artículo es un estudio basado en la documentación oficial y en experimentos que ejecuté en un PostgreSQL 17.10 local descartable (con 1.000.000 de filas en `pedido` y 50.000 en `cliente`). Los pasajes marcados como opinión reflejan mi lectura. Las referencias están al final.

## Qué hace el planner

Para cada consulta, PostgreSQL pasa por *parser* → *rewriter* → **planner/optimizer** → executor. El planner genera planes candidatos (caminos de acceso a cada tabla, órdenes y algoritmos de join, estrategias de agregación), estima un **costo** para cada uno y elige el menor.

Dos puntos de partida importantes, de la documentación (cap. 14.1, "Using EXPLAIN"):

- Los costos se expresan en **unidades arbitrarias** definidas por los parámetros de costo del planner. Tradicionalmente, la unidad es una lectura secuencial de página (`seq_page_cost = 1.0`). Los costos **no son milisegundos** y no deben compararse con el tiempo real de `EXPLAIN ANALYZE`.
- Lo que se compara son las **filas estimadas versus las filas reales**. Cuando ambas divergen, casi siempre ahí está el problema.

Los parámetros de costo por defecto que verifiqué en la 17.10:

| Parámetro | Por defecto | Significa |
|---|---|---|
| `seq_page_cost` | 1 | lectura secuencial de una página |
| `random_page_cost` | 4 | lectura no secuencial de una página |
| `cpu_tuple_cost` | 0,01 | procesar una fila |
| `effective_cache_size` | 4GB | *hint* sobre cuántos datos cachean el SO + PG (afecta la elección de índices; no reserva memoria) |
| `work_mem` | 4MB | memoria por operación de sort/hash antes de ir a disco |

## Leyendo un plan: qué dicen los números

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM pedido WHERE status = 'entregado';
```

```text
 Seq Scan on pedido  (cost=0.00..19853.00 rows=979767 width=27) (actual rows=980000 loops=1)
   Filter: (status = 'entregado'::text)
   Rows Removed by Filter: 20000
   Buffers: shared hit=7353
```

- `cost=0.00..19853.00`: **costo de arranque** (antes de la primera fila) y **costo total**. Un `Sort` tiene un costo de arranque alto (necesita ordenar todo); un `Seq Scan` tiene cero.
- `rows=979767`: estimación de filas *emitidas por el nodo*. `actual rows=980000`: real. Aquí el planner acertó con un 0,02% de error.
- `width=27`: tamaño medio estimado de la fila, en bytes.
- `loops`: cuántas veces se ejecutó el nodo. Según la documentación, `actual time` y `rows` son **promedios por ejecución**; para el total, multiplica por `loops`. Es una fuente clásica de lecturas erróneas en nodos internos de un `Nested Loop`.
- `Buffers: shared hit=7353`: accesos a buffers de `shared_buffers`. Cuenta **accesos**, no páginas distintas: la misma página leída varias veces suma varias veces.

Dos advertencias prácticas, también de la documentación:

1. `EXPLAIN ANALYZE` **ejecuta** la consulta. Para `UPDATE`, `DELETE` o `INSERT`, usa `BEGIN; EXPLAIN ANALYZE ...; ROLLBACK;`.
2. La salida de tiempo (`actual time`) tiene sobrecarga de medición; en máquinas sin reloj rápido, `TIMING OFF` reduce esa distorsión.

(En PostgreSQL 18, según las notas de versión, `EXPLAIN ANALYZE` pasa a incluir `BUFFERS` automáticamente y muestra más detalles, como el número de búsquedas de índice por nodo.)

## Estadísticas: la materia prima de toda estimación

El planner no mira los datos. Mira **estadísticas** grabadas por `ANALYZE`:

- `pg_class.reltuples` y `relpages`: número de filas y de páginas. La documentación dice que suelen estar "algo desactualizados", pero el planner **escala** esos valores al tamaño físico actual de la tabla.
- `pg_statistic` (visible mediante la vista `pg_stats`): por columna, la fracción de nulos, `n_distinct`, los valores más comunes (`most_common_vals` con `most_common_freqs`), un histograma (`histogram_bounds`) y la `correlation` entre el orden físico y el orden de los valores.

El tamaño de esas listas lo controla `default_statistics_target` (por defecto: **100**) o, por columna, `ALTER TABLE ... SET STATISTICS`. Las estadísticas son siempre aproximadas, "incluso recién actualizadas", pues provienen de una muestra.

En mi tabla de pedidos:

```sql
SELECT attname, n_distinct, correlation, most_common_vals, most_common_freqs
FROM pg_stats WHERE tablename = 'pedido' AND attname = 'status';
```

```text
 attname | n_distinct | correlation | most_common_vals       | most_common_freqs
---------+------------+-------------+------------------------+-------------------------
 status  |          2 |  0.96184266 | {entregado,pendiente}  | {0.97976667,0.020233333}
```

Con eso el planner ya sabe que `status = 'entregado'` coincide con ~98% de las filas y `'pendiente'` con ~2%: estimó **20.233** filas para el segundo (real: 20.000) y **979.767** para el primero (real: 980.000).

## Los métodos de acceso a una tabla

### Sequential Scan

Lee todas las páginas en orden. Costo predecible, óptimo cuando se necesita una fracción grande de la tabla (el caso `'entregado'` de arriba: leer el 98% de la tabla vía índice significaría saltar entre páginas aleatorias sin ganancia).

### Index Scan

Recorre el índice y, para cada entrada, busca la tupla correspondiente en el heap. Es bueno para pocas filas, o cuando el orden del índice es útil (`ORDER BY ... LIMIT`). El costo crece con el número de accesos aleatorios al heap, y ahí entra la `correlation`: si el orden físico se parece al del índice, las búsquedas caen en páginas vecinas y resultan mucho más baratas.

En mi muestra, el plan para `'pendiente'` fue un `Index Scan`, no un *bitmap*: `cost=0.42..2768.87`, contra `19853.00` del seq scan. La estadística `correlation = 0.96` para `status` (véase la sección de estadísticas) es la pista más probable, pero no descompuse el cálculo de costo del planner para confirmarlo, así que toma la relación como hipótesis.

### Bitmap Index Scan + Bitmap Heap Scan

Un *bitmap scan* recorre el índice, arma un bitmap de páginas/filas candidatas, **las ordena físicamente** y solo entonces visita el heap, una vez por página. La documentación ubica el *bitmap* para selectividad intermedia: pocas filas → `Index Scan`; muchas → `Seq Scan`. Lo medí con `cliente_id` (≈ 20 pedidos por cliente):

```text
-- cliente_id = 777  (24 filas)
Bitmap Heap Scan on pedido  (cost=4.59..85.48 rows=21 ...) (actual rows=24 ...)
  Recheck Cond: (cliente_id = 777)
  Heap Blocks: exact=24
```

```text
-- cliente_id BETWEEN 100 AND 1500  (28.152 filas)
Bitmap Heap Scan on pedido  (cost=404.80..8185.66 rows=28524 ...) (actual rows=28152 ...)
  Heap Blocks: exact=7222
```

`Recheck Cond` aparece porque el bitmap puede volverse *lossy* (por página, no por fila) cuando excede `work_mem`; en ese caso las condiciones se reevalúan sobre las filas de la página. `BitmapAnd`/`BitmapOr` combinan índices distintos; según la documentación, esos nodos siempre reportan 0 filas reales por una limitación de implementación, una falsa alarma común.

### Index Only Scan y el visibility map

Un `Index Only Scan` responde solo con el índice, sin ir al heap, **si** la página del heap está marcada como *all-visible* en el *visibility map*. De lo contrario, necesita visitar el heap para comprobar la visibilidad MVCC (el índice no guarda `xmin`/`xmax`, como vimos en el [artículo de MVCC](/es/blog/postgresql-mvcc)). Experimento (tabla de 200.000 filas, con `autovacuum` desactivado, consulta `SELECT k FROM ios WHERE k < 50`):

| Estado | Plan elegido |
|---|---|
| tras la carga + `ANALYZE` (sin `VACUUM`) | `Bitmap Heap Scan` (`Heap Blocks: exact=327`) |
| tras `VACUUM ios` | `Index Only Scan` (`Heap Fetches: 0`, `Buffers: shared hit=11`) |

Fíjate en que no solo cambió `Heap Fetches`: cambió el propio **plan**. El planner usa el visibility map para estimar cuántos *heap fetches* tendría; sin `VACUUM`, el `Index Only Scan` no compensaba. Es un puente directo con el [artículo sobre VACUUM](/es/blog/postgresql-vacuum-autovacuum-wraparound) y se retomará en el [artículo sobre índices](/es/blog/indices-postgresql-costos-ocultos).

## Los algoritmos de join

El planner elige, para cada `JOIN`, entre tres algoritmos, y el orden en que unir las tablas.

| Algoritmo | Cómo funciona | Cuándo suele ganar |
|---|---|---|
| **Nested Loop** | para cada fila de la tabla externa, busca las correspondientes en la interna (idealmente por índice) | externa pequeña, interna indexada |
| **Hash Join** | arma una tabla hash de la entrada menor, luego recorre la mayor sondeando el hash | joins por igualdad, entradas grandes, sin orden útil |
| **Merge Join** | ordena (o lee ya ordenadas) las dos entradas y las recorre en paralelo | entradas ya ordenadas (índices), o `ORDER BY` útil, igualdad/orden |

Cuatro consultas sobre la misma masa de datos, y lo que eligió el planner:

**1. Una fila de cliente:** `Nested Loop` con `Index Scan` en `cliente` y `Bitmap Heap Scan` en `pedido`. Total estimado: 94. La externa tiene 1 fila; repetir cuesta casi nada.

**2. Agregación de 1 millón de pedidos por estado:** `Hash Join` con `Parallel Seq Scan` en `pedido` y tabla hash de 50.000 clientes (2,4 MB, `Batches: 1`). Costo total ≈ 17.224.

**3. La misma consulta, forzada con `SET enable_hashjoin = off`:** el planner cambió a `Nested Loop` + `Memoize`, y el costo estimado subió a ≈ 39.740. El nodo `Memoize` guarda en caché los resultados del lado interno por clave: en mi prueba, ~283 mil aciertos contra ~50 mil fallos por worker, ya que hay solo 50.000 clientes distintos.

**4. Con `enable_hashjoin` y `enable_nestloop` desactivados** y `ORDER BY c.id LIMIT 5`: `Merge Join` con ambos lados leídos por índice, ya ordenados. No hizo falta ningún ordenamiento, que es el escenario ideal del algoritmo.

> Los parámetros `enable_*` existen para **diagnóstico**: no prohíben un método, solo lo penalizan con fuerza. Úsalos en una sesión para comparar planes alternativos, nunca como configuración de producción. (Las notas de PostgreSQL 18 dicen que el tratamiento de las funcionalidades deshabilitadas mejoró y que los nodos deshabilitados se indican en el `EXPLAIN`.)

## Por qué una consulta simple genera un plan caro

La causa dominante de planes malos que encuentro descrita en las fuentes es el **error de cardinalidad**: el planner estima N filas, aparecen 100×N, y todas las decisiones siguientes (orden de join, algoritmo, uso de memoria) se toman sobre una premisa errónea. Las causas más comunes:

### 1. Columnas correlacionadas tratadas como independientes

Por defecto, el planner asume que los predicados sobre columnas distintas son **independientes** y multiplica las selectividades. La documentación es explícita: las estadísticas comunes, "al ser por columna, no pueden capturar ningún conocimiento sobre la correlación entre columnas". Lo reproduje con una tabla donde `ciudad` determina `estado`:

```sql
SELECT * FROM loc WHERE ciudad = 'ciudad7' AND estado = 'E0';
```

```text
Gather  (cost=1000.00..4057.41 rows=187 ...)  (actual rows=2000 ...)   -- antes
Seq Scan on loc  (cost=0.00..4274.00 rows=2033 ...)  (actual rows=2000 ...)   -- después
```

Estimación de **187** contra **2.000** reales: un error de ~10×. La corrección son las **estadísticas extendidas**:

```sql
CREATE STATISTICS loc_dep (dependencies, mcv) ON ciudad, estado FROM loc;
ANALYZE loc;   -- necesario: CREATE STATISTICS solo registra el interés
```

Después del `ANALYZE`, la estimación fue **2.033**. Los tipos disponibles, según la documentación:

- `dependencies`: dependencia funcional entre columnas. Se aplica **solo** a igualdades con constantes y a `IN` con constantes; no ayuda con rangos, `LIKE` ni comparaciones entre columnas.
- `ndistinct`: mejora la estimación de `GROUP BY` con varias columnas.
- `mcv`: lista de los valores combinados más comunes; corrige condiciones combinadas, y es el único que maneja bien las combinaciones imposibles.

La documentación también advierte: crear estadísticas extendidas solo vale la pena para grupos de columnas que realmente causan planes malos; de lo contrario "los ciclos de `ANALYZE` se desperdician".

### 2. Estadísticas desactualizadas o con muestra insuficiente

Después de cargas masivas, `reltuples` y los histogramas pueden estar muy por detrás de la realidad. El autovacuum dispara un `ANALYZE` automático, pero con umbrales proporcionales (`autovacuum_analyze_scale_factor = 0,1` por defecto), así que las tablas grandes pueden tardar en reanalizarse. Las columnas con distribución irregular pueden exigir un `SET STATISTICS` mayor que 100, a costa de un `ANALYZE` más lento y de un `pg_statistic` mayor.

### 3. Expresiones y funciones

El planner solo tiene estadísticas de columnas (y de expresiones indexadas o de estadísticas extendidas por expresión). Para `WHERE lower(email) = 'x'` sin índice ni estadística sobre la expresión, la estimación de selectividad cae en un valor genérico. Un índice por expresión trae estadísticas de la expresión; eso es tema del [artículo de índices](/es/blog/indices-postgresql-costos-ocultos).

### 4. Joins que multiplican errores

En consultas con muchos joins, el error de estimación de cada etapa se multiplica. Un error de 10× en el primer nodo puede volverse 1000× en el tercero, y el planner puede elegir `Nested Loop` esperando 100 iteraciones para encontrar 1 millón. En `EXPLAIN ANALYZE`, el síntoma típico es un nodo con `actual rows` mucho mayor que `rows` y `loops` alto.

### 5. Costos que no reflejan el hardware

`random_page_cost = 4` asume que el acceso aleatorio es 4× más caro que el secuencial, lo que refleja discos rotacionales. En discos modernos, o con la mayor parte del dataset en caché, los valores menores son comunes en la práctica; la decisión es tuya, y debe validarse con pruebas, no con una regla de bolsillo. En otras palabras, cambiar ese número sin medir es adivinar.

## Una hoja de ruta de diagnóstico

1. Ejecuta `EXPLAIN (ANALYZE, BUFFERS)` (dentro de `BEGIN/ROLLBACK` si hay escritura).
2. Recorre el plan de abajo hacia arriba buscando el **primer** nodo en el que `rows` y `actual rows` divergen mucho. Recuerda multiplicar por `loops`.
3. Verifica las estadísticas de la(s) columna(s) involucrada(s) en `pg_stats` y la fecha del último `ANALYZE` en `pg_stat_user_tables`.
4. Si hay columnas correlacionadas en el `WHERE`/`GROUP BY`, considera `CREATE STATISTICS`.
5. Verifica un `Rows Removed by Filter` alto (índice faltante o predicado no sargable).
6. Solo entonces prueba alternativas: un índice, un `SET enable_...` en la sesión para ver el plan alternativo, una reescritura de la consulta.

Divergencias que **no** indican un problema, según la documentación: nodos bajo `LIMIT` (la estimación asume ejecución completa), `Merge Join` que no lee toda la entrada y `BitmapAnd/Or` con 0 filas reales.

## Trampas comunes

- **Comparar costo con tiempo.** Unidades distintas.
- **Leer el `actual time` del nodo interno de un `Nested Loop` sin multiplicar por `loops`.**
- **Concluir "el índice no se usó, luego está mal".** El caso `'entregado'` muestra al planner acertando al ignorar el índice.
- **Ejecutar `EXPLAIN ANALYZE` de un `DELETE` en producción sin transacción.**
- **Resolver todo con `enable_seqscan = off`.** Esconde el problema, no lo arregla.
- **Probar en una tabla pequeña.** La documentación advierte que los resultados en tablas pequeñas pueden no valer para las grandes: los costos no son lineales.
- **Olvidar que `ANALYZE` es muestral.** Los planes pueden variar entre ejecuciones de `ANALYZE` sin cambios en los datos.

## Preguntas frecuentes

**¿Cuál es la diferencia entre `EXPLAIN` y `EXPLAIN ANALYZE`?**
`EXPLAIN` muestra el plan y las estimaciones sin ejecutar. `EXPLAIN ANALYZE` ejecuta la consulta y añade tiempos y conteos reales.

**¿El planner usa siempre el plan más barato posible?**
Elige el plan de menor costo *estimado* entre los que considera. Para consultas con muchos joins, pasa a usar búsqueda heurística (GEQO) por encima de cierto número de tablas (`geqo_threshold`), y puede no encontrar el óptimo global. Consulta la documentación de tu versión para el límite exacto.

**¿Necesito ejecutar `ANALYZE` manualmente?**
Después de cargas grandes o cambios radicales en la distribución, sí, es una buena práctica. En el día a día, el autovacuum se encarga.

**¿Por qué el planner ignoró mi índice?**
Causas posibles: el filtro devuelve una fracción grande de la tabla; la columna tiene baja selectividad; el predicado no es compatible con el índice (función aplicada a la columna, tipo distinto); estadísticas desactualizadas; o un costo de acceso aleatorio alto frente al secuencial.

**¿Puedo influir directamente en el planner con hints?**
El core de PostgreSQL no tiene *hints* de optimizador. Existe la extensión `pg_hint_plan`, que no probé aquí.

## Conclusión

El planner de PostgreSQL es un optimizador basado en costos: tan bueno como las estadísticas que lo alimentan y el modelo de costos que lo guía. Cuando el plan es malo, la pregunta más útil casi nunca es "¿qué índice crear?", sino "¿en qué punto el número estimado dejó de ser el número real?". Ese punto de divergencia apunta a estadísticas desactualizadas, correlación ignorada o un predicado que el planner no logra estimar. El [próximo artículo](/es/blog/indices-postgresql-costos-ocultos) trata los índices como estructuras físicas, con sus tipos y sus costos de escritura.

## Referencias

Este artículo es un estudio basado en las fuentes siguientes. Los pasajes marcados como opinión reflejan mi lectura. Los experimentos se ejecutaron en un PostgreSQL 17.10 local; los números ilustran el mecanismo y no representan un benchmark.

- PostgreSQL Documentation 17, [14.1. Using EXPLAIN](https://www.postgresql.org/docs/17/using-explain.html)
- PostgreSQL Documentation 17, [14.2. Statistics Used by the Planner](https://www.postgresql.org/docs/17/planner-stats.html)
- PostgreSQL Documentation 17, [Chapter 68. How the Planner Uses Statistics](https://www.postgresql.org/docs/17/planner-stats-details.html)
- PostgreSQL Documentation 17, [19.7. Query Planning (parámetros de costo y `enable_*`)](https://www.postgresql.org/docs/17/runtime-config-query.html)
- PostgreSQL Documentation 17, [CREATE STATISTICS](https://www.postgresql.org/docs/17/sql-createstatistics.html)
- PostgreSQL Documentation 17, [51.1. The Path of a Query](https://www.postgresql.org/docs/17/query-path.html)
- PostgreSQL Documentation 18, [Release Notes: PostgreSQL 18](https://www.postgresql.org/docs/18/release-18.html)
