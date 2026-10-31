---
title: "MVCC in PostgreSQL: why an UPDATE never overwrites the row"
description: "How PostgreSQL implements MVCC: tuple versions, xmin/xmax, snapshots, hint bits, HOT, and the link to VACUUM. With reproducible experiments using pageinspect."
pubDate: 2026-10-31T09:00:00-03:00
author: "Gabriel Campos"
category: "Databases"
tags:
  - "PostgreSQL"
  - "MVCC"
  - "Databases"
  - "Concurrency"
  - "VACUUM"
  - "PostgreSQL Internals Series"
draft: false
lang: "en"
translationKey: "postgres-mvcc"
---

On a 10,000-row table (45 pages of 8 kB in my test), a single `UPDATE t1 SET v = v + 1` with no `WHERE` left the file with 89 pages. Nobody inserted new rows, `count(*)` is still 10,000, and yet the file nearly doubled. Whoever runs into this for the first time usually suspects a bug or a misconfiguration. It is neither: it is **MVCC** working exactly as designed.

This is the first article in the *PostgreSQL Internals* series. The idea here is to open the table and look at the bytes: what physically exists after an `INSERT`, an `UPDATE` and a `ROLLBACK`, how the database decides who sees what, and why that decision creates the cleanup work that the next article ([VACUUM, autovacuum and wraparound](/en/blog/postgresql-vacuum-autovacuum-wraparound)) covers in detail.

> This article is a study based on the official documentation and on experiments I ran on a disposable local PostgreSQL 17.10. Passages marked as opinion reflect my own reading. References are at the end.

## What MVCC solves

*Multi-Version Concurrency Control* is a technique in which the database keeps **several versions** of the same row at the same time, so that readers and writers don't have to block each other. The documentation sums up the contract like this: in MVCC, "locks acquired for querying (reading) data do not conflict with locks acquired for writing data, and so reading never blocks writing and writing never blocks reading" (ch. 13.1).

This is not an implementation detail; it is an architectural decision with a trade-off: the old version of a row has to exist *somewhere* for as long as some transaction might need it. What changes from database to database is where.

- **PostgreSQL:** old versions stay **in the table itself (the heap)**, next to the new versions.
- **InnoDB (MySQL):** the row in the table holds the most recent version; earlier versions are rebuilt from **undo logs** in a *rollback segment*, pointed to by a `DB_ROLL_PTR` field (MySQL 8.4 documentation).

Neither is "better" in absolute terms. PostgreSQL's model makes rollback instantaneous (just mark the transaction as aborted) and reading old versions simple, at the cost of bloat and a mandatory cleanup routine. InnoDB's model keeps the main table more compact, at the cost of reconstructing old versions and of a *purge* that can also fall behind. Both documentations give the same practical advice: long transactions hold back cleanup.

## Anatomy of a tuple

Each heap page is 8 kB by default, with a 24-byte header, an array of *line pointers* (4 bytes each) growing from the start, and tuples growing from the end. A row's physical address, the `ctid`, is the pair `(page, line pointer index)`. Line pointers never move once allocated, so the `ctid` stays valid even if the tuple is compacted inside the page.

Each tuple starts with a 23-byte header. The fields that matter for MVCC are:

| Field | Meaning |
|---|---|
| `t_xmin` | XID of the transaction that **inserted** this version |
| `t_xmax` | XID of the transaction that **deleted or locked** this version (0 if none) |
| `t_ctid` | TID of this version or of the **newer version** of the same row |
| `t_infomask`, `t_infomask2` | State bits: "xmin committed", "xmax invalid", "updated by HOT", etc. |

You can see this directly with the `pageinspect` extension. All the examples below were run on PostgreSQL 17.10; the XID numbers change on every run, the structure doesn't.

```sql
CREATE EXTENSION pageinspect;

CREATE TABLE account (
  id      int     PRIMARY KEY,
  balance numeric NOT NULL
) WITH (autovacuum_enabled = off);  -- disabled only for the experiment

INSERT INTO account VALUES (1, 500);

SELECT lp, t_xmin, t_xmax, t_ctid
FROM heap_page_items(get_raw_page('account', 0));
```

```text
 lp | t_xmin | t_xmax | t_ctid
----+--------+--------+--------
  1 |    741 |      0 | (0,1)
```

One physical row, created by transaction 741, not yet removed (`t_xmax = 0`), pointing to itself.

## UPDATE is "mark the old one + insert a new one"

Now the central point of the article:

```sql
UPDATE account SET balance = 400 WHERE id = 1;

SELECT lp, t_xmin, t_xmax, t_ctid,
       (t_infomask2 & 16384) > 0 AS hot_updated,
       (t_infomask2 & 32768) > 0 AS heap_only
FROM heap_page_items(get_raw_page('account', 0));
```

```text
 lp | t_xmin | t_xmax | t_ctid | hot_updated | heap_only
----+--------+--------+--------+-------------+-----------
  1 |    741 |    743 | (0,2)  | t           | f
  2 |    743 |      0 | (0,2)  | f           | t
```

There are now **two physical tuples** for the same logical row:

1. The original version (`lp 1`) received `t_xmax = 743`: transaction 743 "removed" it. Its `t_ctid` now points to `(0,2)`, forming a **chain** of versions.
2. The new version (`lp 2`) was created by 743 (`t_xmin = 743`), with `balance = 400`.

A `SELECT ctid, xmin, xmax, * FROM account` shows only the second one: `(0,2) | 743 | 0`. The first remains on disk, invisible to anyone who started after 743 committed, but potentially visible to anyone who started before.

In the documentation, `DELETE` is the same mechanism without the insert step: it only fills in `t_xmax`. `INSERT` simply creates a tuple with `t_xmin`. That is why PostgreSQL has no "undo" to apply on rollback: an aborted transaction leaves tuples with the `xmin` of a transaction that was never committed, and those tuples simply never pass the visibility test.

```sql
BEGIN; INSERT INTO account VALUES (2, 1); ROLLBACK;

SELECT lp, t_xmin, t_xmax FROM heap_page_items(get_raw_page('account', 0));
-- the (id=2) tuple is still there, with xmin = 749, from an aborted transaction
SELECT id FROM account;  -- returns only id = 1
```

The rollback was instantaneous (cost independent of the amount of data), but it left physical garbage that someone will have to collect.

## Who decides what a transaction sees: snapshots

A tuple being "alive" or "dead" is not an absolute property; it is relative to the observer. PostgreSQL solves this with **snapshots**. A snapshot is, in essence, three pieces of information:

- `xmin`: the lowest XID still in progress when the snapshot was taken (everything below it has already finished);
- `xmax`: the first XID not yet assigned (everything from there on is "the future");
- a list of XIDs **in progress** between the two.

You can see it with `pg_current_snapshot()`, which returns the format `xmin:xmax:list`. In an idle session, the result was `744:744:`, meaning no transaction in progress.

The visibility rule, greatly simplified, for a tuple with `xmin` and `xmax` is:

1. `xmin` must have **committed** and be "in the past" of the snapshot (lower than the snapshot's `xmax` and outside the in-progress list). Otherwise, the tuple was created by someone the observer can't see.
2. `xmax` must be 0, or have **aborted**, or be "in the future" of the snapshot / in progress. Otherwise, the tuple was removed by someone the observer can see, and it is dead *to them*.

To find out whether a transaction committed or aborted, the server consults the commit state (stored in `pg_xact`). Since that lookup would be expensive for every tuple, the result is cached in the tuple itself as **hint bits** in `t_infomask` (`HEAP_XMIN_COMMITTED`, `HEAP_XMIN_INVALID`, `HEAP_XMAX_INVALID`, etc.). That is why a `SELECT` can generate writes: the first reader that discovers a transaction's state writes the hint bit into the page, which becomes dirty. It is an optimization, not part of the logical contract.

> This is a simplified description of the logic in `HeapTupleSatisfiesMVCC` in the source code. There are additional cases (subtransactions, `cmin/cmax` for the current command inside the same transaction, locked tuples, multixacts) that don't fit here.

### When the snapshot is taken

This is where MVCC meets transaction isolation. The PostgreSQL documentation defines:

- **READ COMMITTED** (default): each *statement* takes its own snapshot. "A `SELECT` sees a snapshot of the database as of the instant the query begins to run."
- **REPEATABLE READ**: the snapshot is taken at the start of the first non-transaction-control command, and reused until the end. "Successive `SELECT` commands within a *single* transaction see the same data."
- **SERIALIZABLE**: uses the same snapshot mechanism as REPEATABLE READ and adds dependency detection (SSI) to prevent serialization anomalies.

Two details that tend to surprise people, both documented:

- `READ UNCOMMITTED` **doesn't actually exist**: "PostgreSQL's Read Uncommitted mode behaves like Read Committed". This is allowed by the SQL standard, which only defines what *may* occur at each level.
- PostgreSQL's `REPEATABLE READ` **doesn't allow phantom reads**, which goes beyond the minimum the SQL standard requires. But it still allows serialization anomalies, and that is why `SERIALIZABLE` exists.

The SQL standard defines isolation levels by the phenomena each one tolerates. MVCC with snapshots, on the other hand, is an implementation strategy of PostgreSQL. The two meet in the documentation tables, but they are different concepts. The [article on isolation, locks and deadlocks](/en/blog/postgresql-isolation-locks-deadlocks) goes deeper into the practical consequences.

## The cost: versions nobody sees anymore, but that are still there

When can a version be removed? When **no** transaction, current or future, can possibly need it. PostgreSQL computes that limit as the lowest `xmin` among all active snapshots. If an old transaction is open, the limit falls behind and cleanup stops.

This behavior can be reproduced. Session A opens a `REPEATABLE READ` transaction and reads the balance; meanwhile, session B updates the same row twice and runs `VACUUM (VERBOSE)`:

```sql
-- Session A
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT balance FROM account WHERE id = 1;     -- 400
SELECT pg_sleep(6);
SELECT balance FROM account WHERE id = 1;     -- still 400
SELECT backend_xmin FROM pg_stat_activity WHERE pid = pg_backend_pid();  -- 744
COMMIT;

-- Session B (during A's sleep)
UPDATE account SET balance = 300 WHERE id = 1;
UPDATE account SET balance = 200 WHERE id = 1;
SELECT balance FROM account WHERE id = 1;     -- 200
VACUUM (VERBOSE) account;
```

Relevant `VACUUM` output:

```text
tuples: 0 removed, 3 remain, 2 are dead but not yet removable
removable cutoff: 744, which was 2 XIDs old when operation ended
```

Session B sees 200; A sees 400, and both see the truth their snapshots define. Of the three tuples, two are dead to B, but `VACUUM` **could not remove them** ("dead but not yet removable"), because the *removable cutoff* (744) is session A's `backend_xmin`. Transaction A could, in theory, still need the 400 version and earlier ones.

This is the mechanism behind a common production incident: a forgotten transaction in `idle in transaction`, a long-running report or an open BI session prevents cleanup of the **whole table**, even rows the transaction never touched. The horizon is global to the database, not per table. It can also be held back by prepared transactions (`pg_prepared_xacts`), by *replication slots* with an old `xmin`/`catalog_xmin` and, on replicas with `hot_standby_feedback`, by queries on the replica. The maintenance documentation lists exactly these three sources (prepared transactions, long transactions and *replication slots*) as causes of stalled cleanup.

## HOT: when you can avoid touching the indexes

An `UPDATE` creates a new tuple, and indexes point to tuples. If every update had to create entries in all the indexes, the cost would be high. The **HOT** (*Heap-Only Tuple*) optimization avoids that when two conditions, quoted from the documentation, are true:

1. the update **doesn't modify any column referenced by the table's indexes** (summarizing indexes, such as BRIN, are excluded from the rule);
2. there is **enough free space in the same page** as the old row.

In the first update experiment, the `hot_updated` and `heap_only` flags appeared for exactly that reason: `balance` is not part of the primary key index.

What happens next is elegant. Since the index still points to the original line pointer (`lp 1`), `VACUUM` (or opportunistic page pruning, which also happens during `SELECT`s) can turn `lp 1` into a **redirect** to `lp 2`:

```text
 lp | lp_flags | lp_off | t_xmin | t_xmax | t_ctid
----+----------+--------+--------+--------+--------
  1 |        2 |      2 |        |        |          -- LP_REDIRECT → lp 2
  2 |        1 |   8152 |    743 |      0 | (0,2)
```

`lp_flags = 2` is `LP_REDIRECT`. The old tuple's space was reclaimed, and the index never even had to know.

### The role of fillfactor, measured

HOT's second condition depends on page space. To see the effect, I created two identical tables (1,000 rows, a non-indexed column `v`, an indexed column `w`) and updated `v`:

| `fillfactor` | updates | HOT updates | table pages |
|---|---|---|---|
| 100 | 1,000 | **0** | 11 |
| 70 | 1,000 | **448** | 13 |

With `fillfactor = 100`, the pages were born full and **no** update could be HOT, even without touching an indexed column. With 70, about 45% of them were HOT (in the rest, the page had no free space left at update time). When updating `w` (the indexed column), the updates stopped being HOT in any case (the counter stayed at 448 after another 1,000 updates).

The counters come from `pg_stat_user_tables` (`n_tup_upd`, `n_tup_hot_upd`); in test sessions, `pg_stat_force_next_flush()` avoids waiting for the statistics flush. This is a small experiment, on one machine, on purpose: it demonstrates the mechanism, it doesn't predict production numbers.

> **My opinion:** on tables with a lot of `UPDATE` on non-indexed columns (counters, status, last-access timestamps), it's worth monitoring the HOT/total ratio before thinking about other optimizations. It is one of the cheapest levers against bloat. At the same time, creating an index on a column "just in case" can turn off HOT for every update of that column. The [article on indexes](/en/blog/postgresql-indexes-hidden-costs) covers that cost.

## Row locks also use xmax

`SELECT ... FOR UPDATE` doesn't create a new version, but it also writes to the tuple. PostgreSQL records the locker's XID in `t_xmax` and sets a bit in `t_infomask` (`HEAP_XMAX_LOCK_ONLY`) to distinguish "locked" from "removed":

```sql
BEGIN;
SELECT id FROM account WHERE id = 1 FOR UPDATE;
SELECT ctid, xmin, xmax FROM account;   -- (0,1) | 747 | 748 (xmax = my own XID)
ROLLBACK;
```

Two practical consequences: row locks **generate disk writes** (the page becomes dirty, possibly with WAL), and when more than one transaction locks the same row, `xmax` starts pointing to a *MultiXact*. That is a topic for the article on locks.

## Common pitfalls

- **"Deleted rows free up space."** Not immediately. `DELETE` only fills in `xmax`. The space becomes reusable after `VACUUM`, and only goes back to the operating system in specific cases (empty pages at the end of the table). `VACUUM FULL` rewrites the table, but requires `ACCESS EXCLUSIVE`.
- **Treating `n_dead_tup` as absolute truth.** It's an approximate statistic, updated asynchronously. In my tests, `n_dead_tup` showed up as 0 right after the update because the statistics hadn't been flushed by the session yet. Use `pg_stat_force_next_flush()` only in tests.
- **`idle in transaction` in ORMs and pools.** A transaction left open just waiting for the application (for example, waiting on an external HTTP call) keeps the cleanup horizon stuck. The `idle_in_transaction_session_timeout` parameter exists for this.
- **Thinking `REPEATABLE READ` costs more space than `READ COMMITTED` by itself.** The cost comes from the transaction's *duration*. A `READ COMMITTED` transaction that lasts hours holds the horizon back in a similar way, because its `backend_xmin` is refreshed at each statement, but a long statement keeps its snapshot for as long as it runs.
- **Confusing the tuple's `xmin` with the session's `backend_xmin`.** The first is the creator of the version; the second is the horizon the session is holding.

## Practical recommendations

1. Treat transactions as a scarce resource: open late, close early, no external I/O in the middle.
2. Configure `idle_in_transaction_session_timeout` and `statement_timeout` according to the application's profile, and monitor `pg_stat_activity` for `state = 'idle in transaction'` and old `backend_xmin`.
3. For tables with a lot of updates on non-indexed columns, consider a `fillfactor` below 100 and track `n_tup_hot_upd / n_tup_upd`.
4. Review indexes that cover frequently updated columns: each one of them can prevent HOT.
5. Don't fix bloat with `VACUUM FULL` by reflex; first understand why cleanup was stalled.

## Frequently asked questions

**Does PostgreSQL have an undo log?**
Not in the InnoDB sense. Old versions stay in the heap itself. The WAL records changes for crash recovery, but isn't consulted to assemble old versions of rows.

**Can a `SELECT` block an `UPDATE`?**
At the row level, no: readers don't acquire locks that conflict with writers. There are table-level exceptions (for example, a read `ACCESS SHARE` conflicts with a DDL `ACCESS EXCLUSIVE`), but that is another mechanism.

**Why did my `UPDATE` of a small column increase the table size?**
Because it creates a full version of the row, not a delta. The entire tuple is copied, including columns that didn't change (except values stored in TOAST, which can be shared between versions when they aren't modified).

**How long does a dead version stay on disk?**
Until (1) no active snapshot can see it and (2) a `VACUUM` or page pruning removes it. If an old transaction is open, this can be indefinite.

## Conclusion

MVCC is neither magic nor an optional feature: it is the reason PostgreSQL can read without blocking writers and roll back in constant time. The price is physical and visible: every `UPDATE` creates a new tuple, every `DELETE` leaves a dead tuple, and the definition of "dead" depends on the oldest snapshot still in use. Most of the bloat problems I see described in production reports are not caused by a lack of `VACUUM`, but by something preventing `VACUUM` from advancing. The next article, [VACUUM, autovacuum and wraparound](/en/blog/postgresql-vacuum-autovacuum-wraparound), follows exactly that trail.

## References

This article is a study based on the sources below. Passages marked as opinion reflect my own reading. The experiments were run on a local PostgreSQL 17.10; the numerical results illustrate the mechanism and do not represent a benchmark.

- PostgreSQL Documentation 17, [13.1. Introduction (MVCC)](https://www.postgresql.org/docs/17/mvcc-intro.html)
- PostgreSQL Documentation 17, [13.2. Transaction Isolation](https://www.postgresql.org/docs/17/transaction-iso.html)
- PostgreSQL Documentation 17, [65.6. Database Page Layout](https://www.postgresql.org/docs/17/storage-page-layout.html)
- PostgreSQL Documentation 17, [65.7. Heap-Only Tuples (HOT)](https://www.postgresql.org/docs/17/storage-hot.html)
- PostgreSQL Documentation 17, [24.1. Routine Vacuuming](https://www.postgresql.org/docs/17/routine-vacuuming.html)
- PostgreSQL Documentation 17, [F.25. pageinspect](https://www.postgresql.org/docs/17/pageinspect.html)
- MySQL 8.4 Reference Manual, [17.3 InnoDB Multi-Versioning](https://dev.mysql.com/doc/refman/8.4/en/innodb-multi-versioning.html)
