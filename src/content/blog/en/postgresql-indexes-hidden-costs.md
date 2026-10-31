---
title: "Indexes in PostgreSQL: types, column order and the costs nobody lists"
description: "B-tree, Hash, GiST, SP-GiST, GIN and BRIN; composite, partial, expression and INCLUDE indexes; index-only scans and the visibility map; and the real, measured cost of writes and maintenance."
pubDate: 2026-10-31T10:30:00-03:00
author: "Gabriel Campos"
category: "Databases"
tags:
  - "PostgreSQL"
  - "Indexes"
  - "B-tree"
  - "GIN"
  - "BRIN"
  - "Databases"
  - "PostgreSQL Internals Series"
draft: false
lang: "en"
translationKey: "postgres-indexes"
---

On an events table with 1 million rows, a 240 kB partial index serves the pending-queue query; a full index on the same column takes up 21 MB. In another experiment, inserting 300,000 rows became about 2.8 times slower after I added five indexes to the table. Both results come from the same root: **an index is a second sorted (or summarized) copy of part of the data**, and every copy has to be maintained.

This is the fourth article in the *PostgreSQL Internals* series. It assumes you already know what `CREATE INDEX` is and focuses on what usually gets left out: when each index type makes sense, how column order works, what changes with `INCLUDE` and *index-only scans*, and how much each index costs on writes.

> This article is a study based on the official documentation and on experiments I ran on disposable local PostgreSQL 17.10 and 18.6 instances (table `ev` with 1,000,000 rows). Passages marked as opinion reflect my own reading. References are at the end. The timing and size numbers illustrate the mechanism and depend on machine, data and configuration.

## Index types and what each one solves

PostgreSQL offers six built-in access methods. The documentation (ch. 11.2) describes them as follows, and the choice is more about **which operator you need** than about "which one is faster":

| Type | Operators / use | When it makes sense |
|---|---|---|
| **B-tree** (default) | `<`, `<=`, `=`, `>=`, `>`, `BETWEEN`, `IN`, `IS NULL`, `ORDER BY` | almost everything: equality, range, ordering |
| **Hash** | only `=` | pure equality (stores a 32-bit hash of the value) |
| **GiST** | infrastructure for varied strategies: geometry, nearest neighbor (`<->`), ranges, full-text | data that isn't linearly "sortable" |
| **SP-GiST** | unbalanced structures: quadtrees, k-d trees, tries | data with natural space partitioning |
| **GIN** | inverted index: one entry per component of composite values (arrays, `jsonb`, `tsvector`) | "does this value contain X?" |
| **BRIN** | summaries per range of physical blocks (`<`, `<=`, `=`, `>=`, `>`) | columns **correlated with the physical order** of the table |

Two notes on documentation limits: the types page only cites arrays as an example of GIN in the default distribution (support for `jsonb` and `tsvector` appears in other parts of the manual), and it doesn't cover *index-only scans*, which is the subject of another section.

### B-tree: the default for good reasons

B-tree handles equality, range and ordering, and supports `IS NULL`/`IS NOT NULL`. It is also the only type that *always* supports *index-only scan* (GiST and SP-GiST only for some operator classes; GIN doesn't support it, according to the documentation).

### Hash: narrower than it looks

It stores only the hash code. It only serves `=`, and doesn't sort. A test of mine, which shouldn't be generalized: on an `email` column with 50,000 distinct values repeated ~20 times each, the hash index came out at **32 MB** and the B-tree at **8.5 MB**. The result depends on the distribution (many duplicate values), but it serves as a warning against the idea that "hash is smaller and faster for equality" without measuring. Always compare `pg_relation_size`.

### GIN: inverted, good for "contains"

```sql
CREATE INDEX ev_gin ON ev USING gin (payload jsonb_path_ops);

SELECT count(*) FROM ev WHERE payload @> '{"k": 5, "tag": "a3"}';
-- Bitmap Index Scan on ev_gin (actual rows=1428) ... Buffers: shared hit=48
```

The index (4,448 kB, much smaller than the 111 MB heap) answered the composite condition with 48 index buffer accesses. The flip side of GIN is maintenance: it has a higher write cost than B-tree. In my write experiment (below), GIN was the fifth index and added about 240 ms to the batch, the second-largest jump in the sequence (the largest was the `lower(email)` expression index, ~300 ms).

### BRIN: small, but only for correlated columns

BRIN stores, for each range of pages (`pages_per_range`, default 128), the minimum and maximum of the column. If the values follow the physical order (typically `created_at` in *append-only* tables), the index is tiny and quite useful. I measured it on table `ev`, whose `created` column grows with `id`:

| Index on `created` | Size | Query plan (2 days, 8,640 rows) |
|---|---|---|
| B-tree | **21 MB** | `Index Only Scan`, `Buffers: ... read=26` |
| BRIN (`pages_per_range=32`) | **32 kB** | `Bitmap Heap Scan`, `Heap Blocks: lossy=160`, `Rows Removed by Index Recheck: 2593` |

BRIN used more than 600× less space, at the price of reading 160 heap pages and re-evaluating the predicate (*lossy*). If the correlation with physical order is lost (for example, through `UPDATE`s that move rows, or out-of-order loads), BRIN degrades to the point of being useless, and the documentation says it is "most effective for columns well correlated with the physical order". Check `pg_stats.correlation` before adopting it.

## Composite indexes and column order

The rule, from the documentation (for B-tree):

> "Equality constraints on leading columns, plus any inequality constraints on the first column that does not have an equality constraint, will always be used to limit the portion of the index that is scanned."

And for columns to the right of those, they "are checked in the index, so they save visits to the table proper, but they do not reduce the portion of the index that has to be scanned".

In practice, for `(tenant, created)`:

| Query | Index usage |
|---|---|
| `tenant = 42 AND created BETWEEN ...` | Limits the scan to the exact range. Measured: `Bitmap Index Scan` with `Buffers: shared hit=3`, 21 rows |
| `tenant = 42` | Uses the prefix; good |
| `created BETWEEN ...` (without `tenant`), **PostgreSQL 17** | The index doesn't limit the search. In my test, the planner did a `Parallel Seq Scan` with `Rows Removed by Filter: 332973` per worker |
| same query, **PostgreSQL 18** | *Skip scan*: `Bitmap Index Scan` with `Index Searches: 202`, `Buffers: shared hit=409 read=232` against ~14,267 buffers for the seq scan on PG 17 with the same data |

**Skip scan** is new in PostgreSQL 18 (in the release notes: "multicolumn B-tree indexes can be used when there is no equality restriction on leading columns"). The index is walked with repeated `tenant = N AND created ...` searches for each distinct value of the leading column, hence the 202 *index searches* (the order of magnitude of the number of tenants, 200). The documentation makes the limit clear: it only pays off when there are **few distinct values** in the leading column; with many, the whole index would have to be scanned and the planner prefers `Seq Scan`.

Practical consequences:

- Put the columns with **equality** in the most frequent queries first, then the range or ordering column.
- It is not a rule to put the "most selective" column first: what matters is how the queries restrict the index, and whether there is an `ORDER BY` to serve.
- The documentation warns: "multicolumn indexes should be used sparingly. In most situations, an index on a single column is sufficient" and indexes with more than three columns "are unlikely to be helpful unless the usage of the table is extremely stylized".

> **Opinion:** skip scan doesn't remove the need to think about column order. It helps when the leading column has low cardinality (few tenants, few types). In multi-tenant environments with thousands of tenants, a query without `tenant` will still require another index.

## Partial indexes

A partial index covers only the rows that satisfy a predicate. On table `ev`, 99% of the rows have `processed = true`. A "pending" queue only queries the remaining 1%:

```sql
CREATE INDEX ev_pending_partial ON ev (created) WHERE NOT processed;
-- size: 240 kB   (vs. 21 MB for the full index on the same column)

SELECT id FROM ev WHERE NOT processed ORDER BY created LIMIT 10;
-- Index Scan using ev_pending_partial ... Buffers: shared read=3
```

Besides being smaller, it is cheaper to maintain: `INSERT`s and `UPDATE`s that don't satisfy the predicate don't even touch it. Two details:

- The query must imply the index's predicate (the planner proves this for simple cases). Write the query with the same predicate as the index; parameterized or more complex predicates may not be recognized. Check in `EXPLAIN`.
- A partial `UNIQUE` index is an idiomatic way to enforce "unique among the active ones".

## Expression indexes

The planner only uses an index when the query's expression matches the index's.

```sql
-- Without an index on the expression: Parallel Seq Scan, Rows Removed by Filter: 333327 (per worker)
SELECT count(*) FROM ev WHERE lower(email) = 'user42@example.com';

CREATE INDEX ev_email_lower ON ev (lower(email));
ANALYZE ev;
-- After: Bitmap Index Scan on ev_email_lower (actual rows=20), 8,584 kB
```

The `ANALYZE` after `CREATE INDEX` matters: PostgreSQL collects statistics on the indexed **expression**, which also improves cardinality estimates (a topic for the [article on the planner](/en/blog/postgresql-query-planner)). The function must be `IMMUTABLE`.

## Covering indexes, INCLUDE and index-only scans

An *index-only scan* answers the query without visiting the heap, but only when two conditions from the documentation are met: the index type supports it, and the query references only columns stored in the index. Since index entries don't store MVCC visibility information, the executor consults the **visibility map**: if the heap page is marked *all-visible*, the data comes from the index; otherwise it has to visit the heap. The map is "four orders of magnitude smaller than the heap" and so tends to stay cached; the gain shows up when "a significant fraction of the heap pages have their all-visible bits set", which depends on `VACUUM` (see the [article on VACUUM](/en/blog/postgresql-vacuum-autovacuum-wraparound)).

The `INCLUDE` clause adds columns to the index **without making them part of the search key**:

```sql
CREATE INDEX ev_cov ON ev (tenant, created) INCLUDE (kind);

SELECT kind FROM ev
WHERE tenant = 42 AND created >= '2025-03-01' AND created < '2025-04-01';
-- Index Only Scan using ev_cov (actual rows=669), Heap Fetches: 0, Buffers: shared hit=1 read=6
```

Cost: `ev_cov` takes up **39 MB** against **30 MB** for the index without `INCLUDE` (the `smallint kind` added ~30%). The documentation recommends being conservative: payload columns "duplicate data from the table and bloat the index", and including them only makes sense "if the table changes slowly enough that an index-only scan wouldn't need to visit the heap". For `UNIQUE` indexes, uniqueness applies only to the key columns.

In my earlier plan experiment (planner article), a table without a recent `VACUUM` had its plan switched from `Index Only Scan` to `Bitmap Heap Scan`; after `VACUUM`, it came back. In other words: **the covering index only keeps its promise if the visibility map is up to date**.

## The hidden cost: writes, space and HOT

Each additional index is a structure to update on every `INSERT`, every `DELETE` (marking for vacuum) and every `UPDATE` that isn't HOT.

### Write measurement

I inserted 300,000 rows into an `UNLOGGED` table (to isolate the WAL cost), repeating each configuration 3 times. The table always has the primary key; the "N indexes" below are the extras:

| Extra indexes | `INSERT` time (ms, 3 runs) |
|---|---|
| 0 (PK only) | 433 · 438 · 353 |
| 1 (`(tenant, created)`) | 520 · 512 · 499 |
| 2 (+ `lower(email)`) | 810 · 790 · 802 |
| 3 (+ `(kind)`) | 874 · 869 · 893 |
| 4 (+ `(created)`) | 985 · 975 · 977 |
| 5 (+ GIN on `payload`) | 1210 · 1215 · 1249 |

Five extra indexes made the load ~2.8× slower than the PK alone. It's worth remembering the context: one machine, one table, no concurrency, `UNLOGGED`, data with lots of repetition. The absolute value isn't transferable, but the trend is: cost grows with the number and the type of index (the `lower(email)` expression index and the GIN cost more than a simple B-tree on an integer).

### Space

On table `ev`, the heap was **111 MB**, the PK **21 MB** and a composite index **30 MB**. On narrow-row tables, it's common for the sum of the indexes to exceed the heap itself.

### HOT: the hidden cost

As seen in the [MVCC article](/en/blog/postgresql-mvcc), an `UPDATE` can only be HOT if it changes **no indexed column**. Indexing `status` or `updated_at` on a table with many updates to those columns turns off HOT for those updates and multiplies the index entries. In that article's experiment, with `fillfactor` 70, 448 of 1,000 updates on a non-indexed column were HOT; when updating the indexed column `w`, the HOT counters did not increase.

### Indexes nobody uses

`pg_stat_user_indexes.idx_scan` counts how many times each index was used since the last statistics reset:

```sql
SELECT s.indexrelid::regclass AS index_name,
       pg_size_pretty(pg_relation_size(s.indexrelid)) AS size,
       s.idx_scan,
       i.indisunique OR i.indisprimary AS enforces_constraint
FROM pg_stat_user_indexes s
JOIN pg_index i USING (indexrelid)
ORDER BY s.idx_scan, pg_relation_size(s.indexrelid) DESC;
```

In my lab, `ev_hash` (32 MB) and `ev_bt_email` (8.5 MB) showed up with `idx_scan = 0`. Before removing any index with zero uses, remember that:

- indexes that back `UNIQUE`/`PRIMARY KEY`/`EXCLUDE` and foreign keys are not "useless" just because they aren't read;
- statistics are **per server**: an index used only on read replicas, or in a quarterly report, may show up as zero on the primary;
- statistics reset with `pg_stat_reset()` and may have little history;
- remove with `DROP INDEX CONCURRENTLY` and, if possible, after an observation period with a real production signal.

## Common pitfalls

- **Indexing every column that appears in `WHERE`.** Without measuring selectivity and frequency, you pay for writes and space for nothing.
- **Redundant indexes.** `(a)` is redundant with `(a, b)` for prefix lookups (exception: ordering, `INCLUDE` and different index types).
- **A function on the column.** `WHERE lower(email) = ...` or `WHERE created::date = ...` don't use a simple index on the column; use an expression index or rewrite the range.
- **`CREATE INDEX` without `CONCURRENTLY` on a table in use.** It blocks writes during the build. The concurrent variant is slower and, if it fails, leaves an *invalid* index that has to be removed.
- **Expecting an `INCLUDE` to work without an up-to-date `VACUUM`.** Shown above.
- **Adopting BRIN without checking correlation.**
- **Trusting that more columns in the index always help.** The documentation says otherwise.
- **Forgetting that the planner can legitimately prefer `Seq Scan`.** We saw this in the previous article.

## Practical recommendations

1. Choose the type by operator: B-tree for equality/range/order; GIN for "contains" in `jsonb`/arrays/full-text; BRIN for large append-only tables with a correlated column; GiST/SP-GiST for geometry and spatial data.
2. Order composite index columns as: equalities first, then range/ordering. Test the real plans with `EXPLAIN (ANALYZE, BUFFERS)`.
3. Use partial indexes for queues, rare flags and conditional uniqueness.
4. Use `INCLUDE` only on critical queries, with narrow columns, on tables whose visibility map stays up to date.
5. Measure the write cost with the real load before and after adding an index.
6. Periodically audit unused indexes, looking at the replicas as well.
7. On PostgreSQL 18, consider skip scan, but confirm with `Index Searches` in `EXPLAIN ANALYZE`.

## Frequently asked questions

**Does an index always speed up queries?**
No. For large slices of the table, the planner may (correctly) prefer `Seq Scan`; and every index adds write cost.

**What is the column order in a composite index?**
Equalities on the left, range or ordering after. The order changes how much of the index is scanned.

**When should I use GIN instead of B-tree?**
When the question is about membership/containment in composite values (`@>`, `&&`, text search), where a B-tree doesn't help.

**Is `INCLUDE` the same as putting the column in the key?**
No. `INCLUDE` columns don't take part in the search or in uniqueness; they only avoid the heap visit.

**Can I create indexes without blocking writes?**
Yes, with `CREATE INDEX CONCURRENTLY`, at the cost of more time and a possible invalid index in case of failure.

## Conclusion

An index is a cost-benefit decision, not a free optimization. The lab numbers sum it up: the partial index fit in 240 kB where the full one took 21 MB; BRIN took 32 kB where the B-tree took 21 MB; and five extra indexes made the write load almost three times slower. The benefits are real, but only for the queries the planner actually uses them for. The next article shifts the focus to the other face of concurrency: [isolation, locks and deadlocks](/en/blog/postgresql-isolation-locks-deadlocks).

## References

This article is a study based on the sources below. Passages marked as opinion reflect my own reading.

- PostgreSQL Documentation 17, [11.2. Index Types](https://www.postgresql.org/docs/17/indexes-types.html)
- PostgreSQL Documentation 18, [11.3. Multicolumn Indexes](https://www.postgresql.org/docs/18/indexes-multicolumn.html)
- PostgreSQL Documentation 17, [11.9. Index-Only Scans and Covering Indexes](https://www.postgresql.org/docs/17/indexes-index-only-scans.html)
- PostgreSQL Documentation 17, [11.8. Partial Indexes](https://www.postgresql.org/docs/17/indexes-partial.html)
- PostgreSQL Documentation 17, [11.7. Indexes on Expressions](https://www.postgresql.org/docs/17/indexes-expressional.html)
- PostgreSQL Documentation 17, [Chapter 67. BRIN Indexes](https://www.postgresql.org/docs/17/brin.html)
- PostgreSQL Documentation 17, [Chapter 66. GIN Indexes](https://www.postgresql.org/docs/17/gin.html)
- PostgreSQL Documentation 17, [28.2. The Cumulative Statistics System (`pg_stat_user_indexes`)](https://www.postgresql.org/docs/17/monitoring-stats.html)
- PostgreSQL Documentation 18, [Release Notes: PostgreSQL 18](https://www.postgresql.org/docs/18/release-18.html) (skip scan)
