---
title: "PostgreSQL's query planner: how the database chooses an execution plan (and why it gets it wrong)"
description: "How the PostgreSQL planner estimates costs, chooses between Seq Scan, Index Scan and Bitmap Scan, decides on Nested Loop, Hash or Merge Join, and why wrong cardinality estimates produce expensive plans."
pubDate: 2026-10-31T10:00:00-03:00
author: "Gabriel Campos"
category: "Databases"
tags:
  - "PostgreSQL"
  - "Query Planner"
  - "EXPLAIN"
  - "Query Optimization"
  - "Databases"
  - "PostgreSQL Internals Series"
draft: false
lang: "en"
translationKey: "postgres-query-planner"
---

The same query, `WHERE status = ...`, ran in two completely different ways on a 1-million-row table that I built for this article. For `'pending'` (2% of the rows) the database used an index; for `'delivered'` (98%) it ignored the index and read the whole table, and it was right in both cases. People who learn SQL early tend to carry the rule "an index is good, a `Seq Scan` is bad", and it is false in a way that only shows up when you read the plan.

SQL is declarative: you describe the result, and the **planner** (or *optimizer*) decides *how* to get it. This is the third article in the *PostgreSQL Internals* series. It covers what the planner knows, how it computes costs, which operators it can choose and, above all, why it gets things wrong and how you can see that in `EXPLAIN`.

> This article is a study based on the official documentation and on experiments I ran on a disposable local PostgreSQL 17.10 (with 1,000,000 rows in `orders` and 50,000 in `customer`). Passages marked as opinion reflect my own reading. References are at the end.

## What the planner does

For each query, PostgreSQL goes through *parser* → *rewriter* → **planner/optimizer** → executor. The planner generates candidate plans (access paths to each table, join orders and algorithms, aggregation strategies), estimates a **cost** for each one and picks the lowest.

Two important starting points, from the documentation (ch. 14.1, "Using EXPLAIN"):

- Costs are expressed in **arbitrary units** defined by the planner's cost parameters. Traditionally, the unit is a sequential page read (`seq_page_cost = 1.0`). Costs **are not milliseconds** and should not be compared with the real time from `EXPLAIN ANALYZE`.
- What you compare is **estimated rows versus actual rows**. When the two diverge, that is almost always where the problem lives.

The default cost parameters I checked on 17.10:

| Parameter | Default | Means |
|---|---|---|
| `seq_page_cost` | 1 | sequential read of a page |
| `random_page_cost` | 4 | non-sequential read of a page |
| `cpu_tuple_cost` | 0.01 | processing a row |
| `effective_cache_size` | 4GB | *hint* about how much data the OS + PG cache (affects index choice; doesn't allocate memory) |
| `work_mem` | 4MB | memory per sort/hash operation before spilling to disk |

## Reading a plan: what the numbers say

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE status = 'delivered';
```

```text
 Seq Scan on orders  (cost=0.00..19853.00 rows=979767 width=27) (actual rows=980000 loops=1)
   Filter: (status = 'delivered'::text)
   Rows Removed by Filter: 20000
   Buffers: shared hit=7353
```

- `cost=0.00..19853.00`: **startup cost** (before the first row) and **total cost**. A `Sort` has a high startup cost (it has to sort everything); a `Seq Scan` has zero.
- `rows=979767`: estimate of rows *emitted by the node*. `actual rows=980000`: real. Here the planner was off by 0.02%.
- `width=27`: estimated average row size, in bytes.
- `loops`: how many times the node was executed. According to the documentation, `actual time` and `rows` are **per-execution averages**; for the total, multiply by `loops`. This is a classic source of misreading in the inner nodes of a `Nested Loop`.
- `Buffers: shared hit=7353`: accesses to `shared_buffers` buffers. It counts **accesses**, not distinct pages: the same page read several times counts several times.

Two practical warnings, also from the documentation:

1. `EXPLAIN ANALYZE` **runs** the query. For `UPDATE`, `DELETE` or `INSERT`, use `BEGIN; EXPLAIN ANALYZE ...; ROLLBACK;`.
2. Timing output (`actual time`) has measurement overhead; on machines without a fast clock, `TIMING OFF` reduces that distortion.

(In PostgreSQL 18, according to the release notes, `EXPLAIN ANALYZE` automatically includes `BUFFERS` and shows more detail, such as the number of index searches per node.)

## Statistics: the raw material of every estimate

The planner doesn't look at the data. It looks at **statistics** recorded by `ANALYZE`:

- `pg_class.reltuples` and `relpages`: number of rows and pages. The documentation says they tend to be "a bit stale", but the planner **scales** these values to the table's current physical size.
- `pg_statistic` (visible through the `pg_stats` view): per column, the null fraction, `n_distinct`, the most common values (`most_common_vals` with `most_common_freqs`), a histogram (`histogram_bounds`) and the `correlation` between physical order and value order.

The size of these lists is controlled by `default_statistics_target` (default: **100**) or per column with `ALTER TABLE ... SET STATISTICS`. Statistics are always approximate, "even when freshly updated", because they come from a sample.

On my orders table:

```sql
SELECT attname, n_distinct, correlation, most_common_vals, most_common_freqs
FROM pg_stats WHERE tablename = 'orders' AND attname = 'status';
```

```text
 attname | n_distinct | correlation | most_common_vals     | most_common_freqs
---------+------------+-------------+----------------------+-------------------------
 status  |          2 |  0.96184266 | {delivered,pending}  | {0.97976667,0.020233333}
```

With that, the planner already knows that `status = 'delivered'` matches ~98% of the rows and `'pending'` ~2%: it estimated **20,233** rows for the latter (actual: 20,000) and **979,767** for the former (actual: 980,000).

## Table access methods

### Sequential Scan

Reads all pages in order. Predictable cost, great when a large fraction of the table is needed (the `'delivered'` case above: reading 98% of the table through an index would mean jumping between random pages with no gain).

### Index Scan

Walks the index and, for each entry, fetches the corresponding tuple from the heap. It's good for few rows, or when the index order is useful (`ORDER BY ... LIMIT`). The cost grows with the number of random heap accesses, and that is where `correlation` comes in: if the physical order is similar to the index order, the lookups land on neighboring pages and become much cheaper.

In my sample, the plan for `'pending'` was an `Index Scan`, not a *bitmap*: `cost=0.42..2768.87`, versus `19853.00` for the seq scan. The `correlation = 0.96` statistic for `status` (see the statistics section) is the most likely clue, but I didn't break down the planner's cost calculation to confirm it, so treat the relationship as a hypothesis.

### Bitmap Index Scan + Bitmap Heap Scan

A *bitmap scan* walks the index, builds a bitmap of candidate pages/rows, **sorts them physically** and only then visits the heap, once per page. The documentation positions the *bitmap* for intermediate selectivity: few rows → `Index Scan`; many → `Seq Scan`. I measured this with `customer_id` (≈ 20 orders per customer):

```text
-- customer_id = 777  (24 rows)
Bitmap Heap Scan on orders  (cost=4.59..85.48 rows=21 ...) (actual rows=24 ...)
  Recheck Cond: (customer_id = 777)
  Heap Blocks: exact=24
```

```text
-- customer_id BETWEEN 100 AND 1500  (28,152 rows)
Bitmap Heap Scan on orders  (cost=404.80..8185.66 rows=28524 ...) (actual rows=28152 ...)
  Heap Blocks: exact=7222
```

`Recheck Cond` appears because the bitmap can become *lossy* (per page, not per row) when it exceeds `work_mem`; in that case the conditions are re-evaluated on the page's rows. `BitmapAnd`/`BitmapOr` combine different indexes; according to the documentation, these nodes always report 0 actual rows due to an implementation limitation, a common false alarm.

### Index Only Scan and the visibility map

An `Index Only Scan` answers from the index alone, without going to the heap, **if** the heap page is marked *all-visible* in the *visibility map*. Otherwise, it has to visit the heap to check MVCC visibility (the index doesn't store `xmin`/`xmax`, as we saw in the [MVCC article](/pt/blog/mvcc-postgresql)). Experiment (200,000-row table, with `autovacuum` off, query `SELECT k FROM ios WHERE k < 50`):

| State | Plan chosen |
|---|---|
| after load + `ANALYZE` (no `VACUUM`) | `Bitmap Heap Scan` (`Heap Blocks: exact=327`) |
| after `VACUUM ios` | `Index Only Scan` (`Heap Fetches: 0`, `Buffers: shared hit=11`) |

Note that it wasn't just `Heap Fetches` that changed: the **plan** itself changed. The planner uses the visibility map to estimate how many *heap fetches* it would have; without `VACUUM`, the `Index Only Scan` wasn't worth it. It's a direct bridge to the [article on VACUUM](/pt/blog/vacuum-autovacuum-wraparound-postgresql) and will be picked up again in the [article on indexes](/pt/blog/indices-postgresql-custos-ocultos).

## Join algorithms

For each `JOIN`, the planner chooses among three algorithms, and the order in which to join the tables.

| Algorithm | How it works | When it tends to win |
|---|---|---|
| **Nested Loop** | for each row of the outer table, looks up the matching ones in the inner (ideally via an index) | small outer, indexed inner |
| **Hash Join** | builds a hash table from the smaller input, then scans the larger one probing the hash | equality joins, large inputs, no useful ordering |
| **Merge Join** | sorts (or reads already sorted) both inputs and walks them in parallel | inputs already sorted (indexes), or a useful `ORDER BY`, equality/ordering |

Four queries over the same data, and what the planner chose:

**1. A single customer row:** `Nested Loop` with `Index Scan` on `customer` and `Bitmap Heap Scan` on `orders`. Estimated total: 94. The outer side has 1 row; repeating costs almost nothing.

**2. Aggregating 1 million orders by state:** `Hash Join` with `Parallel Seq Scan` on `orders` and a hash table of 50,000 customers (2.4 MB, `Batches: 1`). Total cost ≈ 17,224.

**3. The same query, forced with `SET enable_hashjoin = off`:** the planner switched to `Nested Loop` + `Memoize`, and the estimated cost rose to ≈ 39,740. The `Memoize` node caches the inner side's results by key: in my test, ~283 thousand hits against ~50 thousand misses per worker, since there are only 50,000 distinct customers.

**4. With `enable_hashjoin` and `enable_nestloop` turned off** and `ORDER BY c.id LIMIT 5`: `Merge Join` with both sides read through an index, already sorted. No sort was needed, which is the algorithm's ideal scenario.

> The `enable_*` parameters exist for **diagnosis**: they don't forbid a method, they only penalize it heavily. Use them in a session to compare alternative plans, never as a production setting. (The PostgreSQL 18 notes say the handling of disabled features improved and that disabled nodes are now flagged in `EXPLAIN`.)

## Why a simple query produces an expensive plan

The dominant cause of bad plans that I find described in the sources is **cardinality error**: the planner estimates N rows, 100×N show up, and all the following decisions (join order, algorithm, memory use) are made on a wrong premise. The most common causes:

### 1. Correlated columns treated as independent

By default, the planner assumes that predicates on different columns are **independent** and multiplies the selectivities. The documentation is explicit: ordinary statistics, "because they are per column, cannot capture any knowledge about cross-column correlation". I reproduced this with a table where `city` determines `state`:

```sql
SELECT * FROM loc WHERE city = 'city7' AND state = 'S0';
```

```text
Gather  (cost=1000.00..4057.41 rows=187 ...)  (actual rows=2000 ...)   -- before
Seq Scan on loc  (cost=0.00..4274.00 rows=2033 ...)  (actual rows=2000 ...)   -- after
```

Estimate of **187** against **2,000** actual: an error of ~10×. The fix is **extended statistics**:

```sql
CREATE STATISTICS loc_dep (dependencies, mcv) ON city, state FROM loc;
ANALYZE loc;   -- required: CREATE STATISTICS only registers the interest
```

After `ANALYZE`, the estimate was **2,033**. The available types, according to the documentation:

- `dependencies`: functional dependency between columns. Applied **only** to equalities with constants and `IN` with constants; it doesn't help with ranges, `LIKE` or column-to-column comparison.
- `ndistinct`: improves the estimate for `GROUP BY` over several columns.
- `mcv`: list of the most common combined values; it fixes combined conditions, and is the only one that handles impossible combinations well.

The documentation also warns: creating extended statistics is only worthwhile for groups of columns that actually cause bad plans, otherwise "`ANALYZE` cycles are wasted".

### 2. Stale statistics or an insufficient sample

After bulk loads, `reltuples` and the histograms can be well behind reality. Autovacuum fires an automatic `ANALYZE`, but with proportional thresholds (`autovacuum_analyze_scale_factor = 0.1` by default), so large tables can take a while to be re-analyzed. Columns with an irregular distribution may need a `SET STATISTICS` above 100, at the cost of a slower `ANALYZE` and a larger `pg_statistic`.

### 3. Expressions and functions

The planner only has statistics for columns (and for indexed expressions or expression-based extended statistics). For `WHERE lower(email) = 'x'` without an index or statistics on the expression, the selectivity estimate falls back to a generic value. An expression index brings statistics for the expression; that is a topic for the [indexes article](/pt/blog/indices-postgresql-custos-ocultos).

### 4. Joins that multiply errors

In queries with many joins, the estimation error from each step multiplies. A 10× error in the first node can become 1000× in the third, and the planner may choose `Nested Loop` expecting 100 iterations to find 1 million. In `EXPLAIN ANALYZE`, the typical symptom is a node with `actual rows` much greater than `rows` and a high `loops`.

### 5. Costs that don't reflect the hardware

`random_page_cost = 4` assumes random access is 4× more expensive than sequential, which reflects spinning disks. On modern disks, or with most of the dataset in cache, lower values are common in practice; the decision is yours, and it should be validated by tests, not by rule of thumb. In other words, changing this number without measuring is guessing.

## A diagnostic roadmap

1. Run `EXPLAIN (ANALYZE, BUFFERS)` (inside `BEGIN/ROLLBACK` if there are writes).
2. Walk the plan from the bottom up looking for the **first** node where `rows` and `actual rows` diverge a lot. Remember to multiply by `loops`.
3. Check the statistics for the column(s) involved in `pg_stats` and the date of the last `ANALYZE` in `pg_stat_user_tables`.
4. If there are correlated columns in the `WHERE`/`GROUP BY`, consider `CREATE STATISTICS`.
5. Check for a high `Rows Removed by Filter` (missing index or non-sargable predicate).
6. Only then test alternatives: an index, a session-level `SET enable_...` to see the alternative plan, a query rewrite.

Divergences that **do not** indicate a problem, according to the documentation: nodes under `LIMIT` (the estimate assumes full execution), `Merge Join` that doesn't read its whole input, and `BitmapAnd/Or` with 0 actual rows.

## Common pitfalls

- **Comparing cost with time.** Different units.
- **Reading the `actual time` of a `Nested Loop`'s inner node without multiplying by `loops`.**
- **Concluding "the index wasn't used, so it's wrong".** The `'delivered'` case shows the planner being right to ignore the index.
- **Running `EXPLAIN ANALYZE` on a `DELETE` in production without a transaction.**
- **Solving everything with `enable_seqscan = off`.** It hides the problem, it doesn't fix it.
- **Testing on a small table.** The documentation warns that results on small tables may not hold for large ones: costs are not linear.
- **Forgetting that `ANALYZE` is sampled.** Plans can vary between `ANALYZE` runs without any change in the data.

## Frequently asked questions

**What is the difference between `EXPLAIN` and `EXPLAIN ANALYZE`?**
`EXPLAIN` shows the plan and the estimates without running. `EXPLAIN ANALYZE` runs the query and adds real times and counts.

**Does the planner always use the cheapest possible plan?**
It chooses the plan with the lowest *estimated* cost among the ones it considers. For queries with many joins, it switches to heuristic search (GEQO) above a certain number of tables (`geqo_threshold`), and may not find the global optimum. Check your version's documentation for the exact limit.

**Do I need to run `ANALYZE` manually?**
After large loads or radical changes in distribution, yes, it's good practice. Day to day, autovacuum takes care of it.

**Why did the planner ignore my index?**
Possible causes: the filter returns a large fraction of the table; the column has low selectivity; the predicate is not compatible with the index (a function applied to the column, a different type); stale statistics; or a high random-access cost compared to sequential.

**Can I influence the planner directly with hints?**
PostgreSQL core has no optimizer *hints*. There is the `pg_hint_plan` extension, which I haven't tested here.

## Conclusion

PostgreSQL's planner is a cost-based optimizer: only as good as the statistics that feed it and the cost model that guides it. When a plan is bad, the most useful question is almost never "which index should I create?", but rather "where did the estimated number stop being the real number?". That point of divergence points to stale statistics, ignored correlation or a predicate the planner can't estimate. The [next article](/pt/blog/indices-postgresql-custos-ocultos) covers indexes as physical structures, with their types and their write costs.

## References

This article is a study based on the sources below. Passages marked as opinion reflect my own reading. The experiments were run on a local PostgreSQL 17.10; the numbers illustrate the mechanism and do not represent a benchmark.

- PostgreSQL Documentation 17, [14.1. Using EXPLAIN](https://www.postgresql.org/docs/17/using-explain.html)
- PostgreSQL Documentation 17, [14.2. Statistics Used by the Planner](https://www.postgresql.org/docs/17/planner-stats.html)
- PostgreSQL Documentation 17, [Chapter 68. How the Planner Uses Statistics](https://www.postgresql.org/docs/17/planner-stats-details.html)
- PostgreSQL Documentation 17, [19.7. Query Planning (cost parameters and `enable_*`)](https://www.postgresql.org/docs/17/runtime-config-query.html)
- PostgreSQL Documentation 17, [CREATE STATISTICS](https://www.postgresql.org/docs/17/sql-createstatistics.html)
- PostgreSQL Documentation 17, [51.1. The Path of a Query](https://www.postgresql.org/docs/17/query-path.html)
- PostgreSQL Documentation 18, [Release Notes: PostgreSQL 18](https://www.postgresql.org/docs/18/release-18.html)
