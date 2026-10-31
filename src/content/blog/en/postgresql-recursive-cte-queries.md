---
title: "CTEs, materialization and recursive queries in PostgreSQL: what the planner does with WITH"
description: "How PostgreSQL treats CTEs since version 12: inlining, MATERIALIZED and NOT MATERIALIZED, side effects, WITH RECURSIVE, SEARCH and CYCLE, cycles in graphs and the impact on the execution plan."
pubDate: 2026-10-31T13:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/cte-recursive-queries-postgresql.webp"
coverAlt: "Comparison between an inlined CTE with an Index Scan and a MATERIALIZED CTE with a Seq Scan, and a WITH RECURSIVE query"
category: "Databases"
tags:
  - "SQL"
  - "CTE"
  - "WITH RECURSIVE"
  - "PostgreSQL"
  - "Planner"
  - "Databases"
  - "PostgreSQL Internals Series"
draft: false
lang: "en"
translationKey: "postgres-cte-recursive"
---

Two almost identical queries, with the same `WHERE id = 12345` filter over a CTE. In one, PostgreSQL resolved everything with a primary key lookup and 4 buffer accesses. In the other, it scanned 980,000 rows, wrote 4,902 temporary blocks and then discarded all of them but one. The difference between them is one word: `MATERIALIZED`.

The *Common Table Expression* (`WITH`) is one of the most used and least understood constructs in modern SQL. It serves at least three different purposes: naming a subquery, running chained writes, and walking hierarchical structures with recursion. Each one behaves differently in the planner. This is the ninth article in the *PostgreSQL Internals* series.

> This article is a study based on the official documentation and on experiments I ran on a disposable local PostgreSQL 17.10. Passages marked as opinion reflect my own reading. References are at the end.

## A CTE is not "a named subquery", nor "a temporary table"

The SQL standard defines `WITH`; what **the database does with it** is an implementation decision. In PostgreSQL, the story has a dividing line: version 12. The PostgreSQL 12 release notes say that inlining "can be prevented with `MATERIALIZED`, or forced for CTEs referenced multiple times with `NOT MATERIALIZED`. **Previously, CTEs were never inlined and were always evaluated before the rest of the query**."

In other words, up to version 11, every CTE was an optimization fence: the planner didn't push predicates into it nor merge it with the outer query. A lot of the "CTEs are slow" folklore comes from that era. Since 12, the default behavior has changed.

### The current rules (documentation, ch. 7.8)

A CTE is **inlined** (or "folded" into the parent query) when:

- it is not recursive;
- it has no side effects, that is, it is a `SELECT` without volatile functions;
- and, by default, it is referenced **only once** in the parent query.

You can override the decision: `AS MATERIALIZED` forces a separate computation; `AS NOT MATERIALIZED` forces inlining.

The experiments confirm it, using an `orders` table of 1 million rows, with 98% of the rows in `status = 'delivered'`:

```sql
-- 1) CTE referenced once (default): inlined
WITH t AS (SELECT * FROM orders WHERE status = 'delivered')
SELECT * FROM t WHERE id = 12345;
```

```text
Index Scan using orders_pkey on orders (actual rows=1 loops=1)
  Index Cond: (id = 12345)
  Filter: (status = 'delivered'::text)
  Buffers: shared read=4
```

The planner merged the two filters and used the primary key index.

```sql
-- 2) Same query with MATERIALIZED
WITH t AS MATERIALIZED (SELECT * FROM orders WHERE status = 'delivered')
SELECT * FROM t WHERE id = 12345;
```

```text
CTE Scan on t (actual rows=1 loops=1)
  Filter: (id = 12345)
  Rows Removed by Filter: 979999
  Buffers: shared hit=1 read=7352, temp written=4902
  CTE t
    ->  Seq Scan on orders (actual rows=980000 loops=1)
```

Now the CTE was computed in full (980,000 rows, a temporary table of 4,902 blocks), and only then filtered by `id`. The `id = 12345` predicate was **not** pushed into the materialized CTE.

### Referenced twice: materialized by default

```sql
WITH t AS (SELECT customer_id, sum(total) s FROM orders GROUP BY customer_id)
SELECT a.customer_id, b.s
FROM t a JOIN t b ON a.customer_id = b.customer_id + 1
WHERE a.s > 100000;
```

The plan showed `CTE t -> GroupAggregate ...` computed once and consumed by two `CTE Scan`s (one with `Filter: (s > 100000)`, the other inside a `Sort`), joined by `Merge Join`. With `NOT MATERIALIZED`, the same query became a `Hash Join` over **two** independent aggregations (`GroupAggregate` appears twice, one of them with the `sum(...) > 100000` filter pushed inside). Which is better? **It depends**, and that is why the choice exists:

| | Materialized | Inlined (`NOT MATERIALIZED`) |
|---|---|---|
| Cost of computing the CTE | once | once per reference |
| Outer-query predicates reach the CTE | **no** | **yes** |
| Base-table indexes | not used in the already-computed CTE | used |
| Ideal when | the CTE is expensive and reuse pays off | the outer query filters the CTE heavily |

The practical rule that follows: **materialize to reuse an expensive computation; inline to let the filter in.**

### Volatile functions and side effects

A CTE with a volatile function is not inlined, so as not to change the semantics. With `WITH t AS (SELECT id, random() r FROM customer) SELECT * FROM t WHERE r < 0.001`, the plan kept `CTE Scan on t` with the filter on top: `random()` is evaluated once per CTE row, which is probably what the query's author wants.

For **writing** CTEs (`INSERT`/`UPDATE`/`DELETE ... RETURNING`), the documentation guarantees they are "executed exactly once, and always to completion, independently of whether the primary query reads all (or indeed any) of their output". I confirmed it:

```sql
WITH ins AS (INSERT INTO log9 VALUES (1) RETURNING n) SELECT 1;
SELECT count(*) FROM log9;   -- 1 (the CTE ran, even without being read)
```

An important caveat from the same section: the `WITH` sub-statements and the main query execute **concurrently** on the same snapshot, so "the order in which the updates actually happen is unpredictable", and they **can't see each other's effects** on the affected tables. An idiomatic and safe pattern is "moving rows":

```sql
WITH moved AS (
  DELETE FROM active_orders WHERE created < now() - interval '1 year' RETURNING *
)
INSERT INTO archived_orders SELECT * FROM moved;
```

<figure>
  <img src="/images/blog/cte-recursive-queries-postgresql-diagrama.webp" alt="Flowchart of when a CTE is inlined (referenced once) or materialized (two or more times), the measured results of 4 versus 7,352 buffers, and the effect of an index on the parent column in a recursive query: about 208 ms versus 57 ms." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Inlining, MATERIALIZED and recursion, measured on PostgreSQL 17.10 (one experiment on one machine; it illustrates the plan, it is not a benchmark). Diagram by the author.</figcaption>
</figure>

## CTE versus subquery versus temporary table

| Construct | When it makes sense | Note |
|---|---|---|
| **Subquery** (`FROM (SELECT ...) x`) | one-off transformation | always inlined when possible |
| **CTE** (`WITH`) | readability, reuse, recursion, chained writes | inlined or materialized according to the rules above |
| **Temporary table** | a large intermediate result reused across several commands | has its own statistics (after `ANALYZE`) and can have indexes; the materialized CTE has neither |
| **View** | reuse across queries | expanded as a subquery |

A subtle point: a materialized CTE has **no statistics** of its own collected by `ANALYZE`; the planner estimates the cardinality from the subquery, which can produce the estimation errors discussed in the [article on the planner](/en/blog/postgresql-query-planner). If the intermediate result will be large and reused, a temporary table with `ANALYZE` can give the planner better information, at the cost of more code and disk writes (CTE materialization also writes to disk when it exceeds `work_mem`, as `temp written=4902` showed).

> **Opinion:** as a code-review rule, I prefer to treat `MATERIALIZED` and `NOT MATERIALIZED` as **intent comments that the planner obeys**, and to add them only with an `EXPLAIN` to justify them. Leaving the default resolves most cases since version 12.

## Recursive queries: `WITH RECURSIVE`

A recursive CTE has two terms joined by `UNION [ALL]`: a **non-recursive term** (the anchor) and a **recursive term**, which refers to the CTE itself. The documentation describes the execution:

1. Evaluate the non-recursive term; (for `UNION`, discard duplicates); include the rows in the result and put them in a **working table**.
2. While the working table is not empty: evaluate the recursive term, substituting the self-reference with the current contents of the working table (for `UNION`, discard duplicates and rows that duplicate earlier results); include the rows in the result and in an **intermediate table**.
3. Replace the contents of the working table with the intermediate table's, and empty the latter.

Note that "recursion" is, in practice, an **iteration**: each step works only with the new rows from the previous step. This shows up in `EXPLAIN ANALYZE` as `Recursive Union` and `WorkTable Scan`.

### Hierarchy: org chart

Table `org(id, boss_id, name)`; the CTO's (id 2) subordinates, with level and path:

```sql
WITH RECURSIVE sub AS (
  SELECT id, boss_id, name, 0 AS level, ARRAY[id] AS path
  FROM org WHERE id = 2
  UNION ALL
  SELECT o.id, o.boss_id, o.name, s.level + 1, s.path || o.id
  FROM org o JOIN sub s ON o.boss_id = s.id
)
SELECT * FROM sub ORDER BY path;
```

```text
 id | boss_id | name  | level | path
  2 |       1 | CTO   |     0 | {2}
  4 |       2 | Eng A |     1 | {2,4}
  6 |       4 | Dev 1 |     2 | {2,4,6}
  7 |       4 | Dev 2 |     2 | {2,4,7}
  5 |       2 | Eng B |     1 | {2,5}
```

Ordering by the `path` array gives a depth order (pre-order). PostgreSQL 14 implemented the SQL standard's `SEARCH` and `CYCLE` clauses for CTEs (per the release notes: "the same results could be achieved with existing syntax, but much less conveniently"). `SEARCH` does the ordering without building the array by hand:

```sql
WITH RECURSIVE sub AS (
  SELECT id, boss_id, name FROM org WHERE id = 1
  UNION ALL
  SELECT o.id, o.boss_id, o.name FROM org o JOIN sub s ON o.boss_id = s.id
) SEARCH DEPTH FIRST BY id SET ord
SELECT id, name, ord FROM sub ORDER BY ord;
```

`SEARCH BREADTH FIRST` orders by level.

### Graphs and cycles

In strict hierarchies (trees) the recursion ends on its own. In **graphs**, it doesn't: if there is a cycle, the recursive term generates rows forever. The documentation is clear: you must ensure the recursive part "will eventually return no tuples, or else the query will loop indefinitely". I tested with the edges `1→2`, `2→3`, `3→1`, `3→4`:

```sql
-- UNION ALL with no protection, held back only by LIMIT 12: 1,2,3,1,4,2,3,1,4,2,3,1 ...  (infinite without the LIMIT)

-- UNION: discards duplicates, terminates:
WITH RECURSIVE reach(n) AS (
  SELECT 1 UNION SELECT e.dst FROM edge e JOIN reach ON e.src = reach.n)
SELECT n FROM reach ORDER BY n;      -- 1,2,3,4

-- CYCLE: detects and marks
WITH RECURSIVE reach(n) AS (
  SELECT 1 UNION ALL SELECT e.dst FROM edge e JOIN reach ON e.src = reach.n)
CYCLE n SET is_cycle USING path
SELECT n, is_cycle, path FROM reach;
```

```text
 n | is_cycle | path
 1 | f        | {(1)}
 2 | f        | {(1),(2)}
 3 | f        | {(1),(2),(3)}
 1 | t        | {(1),(2),(3),(1)}     ← the cycle was detected and expansion of this branch stopped
 4 | f        | {(1),(2),(3),(4)}
```

`UNION` avoids cycles when the generated rows are identical, but not when they carry columns that change (such as `level` or `path`, which make every row distinct). The `CYCLE` clause tracks the chosen columns and stops the branch when a node is revisited. The documentation also mentions a trick: PostgreSQL only evaluates the rows that the parent query actually fetches, so a `LIMIT` stops an infinite recursion. But it itself advises against using this in production, and warns that it "usually does not work if you make the outer query sort the recursive query's results or join them to some other table". Use `CYCLE` or a stop condition.

### Performance: the index on the linking column

The recursive term runs once per iteration. In a binary tree of 200,000 nodes (`parent = id/2`), with the subtree starting at node 3 (68,928 nodes, 17 iterations):

| Scenario | Recursive-term plan | Total time (`EXPLAIN ANALYZE`) |
|---|---|---|
| no index on `parent` | `Hash Join` + `Seq Scan on tree` (200,000 rows × 17 loops) | ≈ 208 ms |
| with an index on `parent` | `Nested Loop` + `Index Scan using tree_parent_idx` | ≈ 57 ms |

A single experiment, on one machine; what matters is the shape: without an index, **each iteration scans the whole table**. The column that links child to parent (`boss_id`, `parent_id`) should have an index. This is the most common and cheapest mistake to fix.

### Alternatives for hierarchies

Recursion is the general approach, but not the only one. Alternatives offered by the PostgreSQL documentation or the ecosystem: `ltree` (a materialized-path type, from the *contrib* module family, with GiST indexes), closure tables, and nested sets. Each one trades read cost for write cost and maintenance complexity; I didn't evaluate them here. If you read a lot and write little on a deep hierarchy, it's worth comparing.

## What a CTE changes in the execution plan

Signs to look for in `EXPLAIN (ANALYZE, BUFFERS)`:

| Node | Meaning |
|---|---|
| `CTE Scan on t` + `CTE t -> ...` | the CTE was **materialized**; the outer query reads the already-computed result |
| absence of `CTE Scan` and combined filters on the base-table node | the CTE was **inlined** |
| huge `Rows Removed by Filter` on `CTE Scan` | the outer filter didn't get into the CTE; consider `NOT MATERIALIZED` |
| `temp written=N` in the buffers | the materialization (or sort/hash) exceeded `work_mem` |
| `Recursive Union` + `WorkTable Scan` | recursion; look at the recursive term's loop (`loops=N` = number of iterations) |
| `Subquery Scan` | an inlined subquery/CTE that the planner didn't fully flatten |

## Common pitfalls

- **Applying the "CTE is an optimization fence" rule to versions ≥ 12.** The default changed.
- **Expecting `MATERIALIZED` to speed things up.** It prevents predicate push-down; it only helps when reuse pays off.
- **A side-effect CTE depending on order.** The order among `WITH` sub-statements is unpredictable.
- **Recursion without a stop condition** on data with cycles (or that will get them in the future).
- **Recursion without an index** on the linking column.
- **`UNION ALL` + accumulator columns and the belief that `UNION` solves cycles.** If the row changes at every step, it's never a duplicate.
- **Using a CTE to "force" execution order.** The planner may inline the CTE; use `MATERIALIZED` explicitly, or reconsider the design.
- **Forgetting that materialized CTEs have no statistics of their own**, which affects the estimates of the following joins.

## Practical recommendations

1. On PostgreSQL ≥ 12, write CTEs for readability and let the default act; use `MATERIALIZED`/`NOT MATERIALIZED` with `EXPLAIN` in hand.
2. Materialize to reuse expensive computations referenced more than once; inline to let filters descend.
3. Use writing CTEs (`DELETE ... RETURNING` → `INSERT`) to move data atomically, remembering that the sub-statements can't see each other.
4. In `WITH RECURSIVE`: have an index on the linking column, a stop condition and cycle protection (`CYCLE`) if the data are graphs.
5. Prefer `CYCLE`/`SEARCH` (PostgreSQL 14+) over building path arrays by hand.
6. For large, reused intermediate results, evaluate a temporary table with `ANALYZE`.

## Frequently asked questions

**Is every CTE materialized in PostgreSQL?**
No, since version 12. By default, a non-recursive CTE without side effects and referenced once is inlined into the outer query.

**Is `WITH` slower than a subquery?**
Not necessarily. If inlined, it is equivalent. If materialized, it can be faster (reuse) or slower (no predicate push-down).

**How do I force materialization?**
`WITH name AS MATERIALIZED (...)`. To force inlining, `NOT MATERIALIZED`.

**How do I avoid an infinite loop in a recursive query?**
Use a stop condition, `UNION` when the rows are truly identical, or the `CYCLE` clause.

**Is a recursive CTE the best way to model hierarchies?**
It is the most general, but not the only one; it depends on the balance between reads and writes.

**Does `WITH` accept `INSERT`, `UPDATE` and `DELETE`?**
Yes, with `RETURNING`; they execute exactly once and to completion.

## Conclusion

The CTE is a construct that, from PostgreSQL 12 on, stopped being an optimization fence by default and became a conscious choice: inlined when the planner can, materialized when you ask or when the result is reused. Mastering that difference, recognizing `CTE Scan` and `Recursive Union` in the plan, and protecting recursions with an index and cycle detection is enough to use `WITH` with confidence. The last article in the series goes down to what underpins all of this: [WAL, checkpoints and replication slots](/en/blog/postgresql-wal-checkpoints-replication-slots).

## References

This article is a study based on the sources below. Passages marked as opinion reflect my own reading. The experiments were run on a local PostgreSQL 17.10; the numbers illustrate the mechanism and do not represent a benchmark.

- PostgreSQL Documentation 17, [7.8. WITH Queries (Common Table Expressions)](https://www.postgresql.org/docs/17/queries-with.html)
- PostgreSQL Documentation 12, [Release 12](https://www.postgresql.org/docs/12/release-12.html) (CTE inlining, `MATERIALIZED` and `NOT MATERIALIZED`)
- PostgreSQL Documentation 14, [Release 14](https://www.postgresql.org/docs/14/release-14.html) (`SEARCH` and `CYCLE`)
- PostgreSQL Documentation 17, [SELECT: WITH Clause](https://www.postgresql.org/docs/17/sql-select.html#SQL-WITH)
- PostgreSQL Documentation 17, [14.1. Using EXPLAIN](https://www.postgresql.org/docs/17/using-explain.html)
- PostgreSQL Documentation 17, [F.23. ltree](https://www.postgresql.org/docs/17/ltree.html)
