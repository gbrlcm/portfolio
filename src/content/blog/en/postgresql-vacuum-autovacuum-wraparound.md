---
title: "VACUUM, autovacuum and XID wraparound: what takes down a PostgreSQL without warning"
description: "Why PostgreSQL needs VACUUM, how autovacuum decides to act, what freezing and transaction ID wraparound are, and how to diagnose bloat and a stuck vacuum in production."
pubDate: 2026-10-31T09:30:00-03:00
author: "Gabriel Campos"
category: "Databases"
tags:
  - "PostgreSQL"
  - "VACUUM"
  - "Autovacuum"
  - "Bloat"
  - "Databases"
  - "PostgreSQL Internals Series"
draft: false
lang: "en"
translationKey: "postgres-vacuum"
---

In February 2019, Mandrill, Mailchimp's transactional email service, was down for about 40 hours. The company's public post-mortem points to the cause: one of the PostgreSQL shards reached the *transaction ID* (XID) limit, entered protection mode and stopped accepting writes. The same post-mortem says that in November 2018 the engineers had already noticed the XIDs were at about half the limit at peak load, concluded it was not an immediate threat and opened a backlog item to monitor it.

Nothing in this kind of incident requires a PostgreSQL bug. It only requires a silent maintenance routine, `VACUUM`, to stop keeping up with the write rate. This is the second article in the *PostgreSQL Internals* series; it assumes what the [previous article on MVCC](/en/blog/postgresql-mvcc) explained: `UPDATE` and `DELETE` leave old row versions in the heap, and someone has to clean them up.

> This article is a study based on the official documentation, on the public post-mortem cited, and on experiments I ran on disposable local PostgreSQL 17.10 and 18.6 instances. Passages marked as opinion reflect my own reading. References are at the end.

## What VACUUM is for

The routine maintenance documentation lists four reasons to run `VACUUM`:

1. to recover or reuse the space of updated or deleted rows;
2. to update the statistics used by the planner;
3. to update the *visibility map*, which speeds up *index-only scans*;
4. to protect against the loss of very old data due to transaction ID or multixact ID *wraparound*.

The first two are performance problems. The fourth is a **data correctness** problem: it is the only one where ignoring `VACUUM` makes the database stop accepting writes.

### What VACUUM does, in practice

In short, for each page of the table: it identifies dead tuples (that no active snapshot can see), removes the corresponding index entries, marks the line pointers as reusable, updates the *free space map* and the *visibility map*, and, when needed, **freezes** old tuples.

Running `VACUUM (VERBOSE)` on a 100,000-row table where I deleted half (`DELETE ... WHERE id % 2 = 0`), the output was:

```text
pages: 0 removed, 1725 remain, 1725 scanned (100.00% of total)
tuples: 50000 removed, 50000 remain, 0 are dead but not yet removable
index scan needed: 1725 pages from table (100.00% of total) had 50000 dead item identifiers removed
index "b1_pkey": pages: 276 in total, 0 newly deleted, 0 currently deleted, 0 reusable
```

And the size on disk:

| Step | Table (`pg_table_size`) |
|---|---|
| 100,000 rows inserted | 14 MB |
| after `DELETE` of 50,000 | 14 MB |
| after `VACUUM` | **14 MB** |
| after `VACUUM FULL` (following another `DELETE` of ⅓) | 9,208 kB |

What surprises people who don't know the mechanism the most: **plain `VACUUM` didn't give a single byte back to the operating system**. It made the space *reusable* inside the file, which `pgstattuple` confirms: before, 45.6% of the bytes were dead tuples; afterwards, `dead_tuple_count = 0` and `free_percent = 48.8`. The documentation describes exactly this: plain `VACUUM` "usually does not return the space to the operating system", except for completely free pages at the **end** of the table (and that truncation is controlled by `vacuum_truncate` and requires `ACCESS EXCLUSIVE` for a moment).

## VACUUM FULL: why it isn't "the stronger VACUUM"

`VACUUM FULL` is not a more aggressive version of the same algorithm. It **rewrites the entire table** into a new, compacted file and rebuilds the indexes. According to the documentation:

- it can recover more space, but runs much more slowly;
- it requires an `ACCESS EXCLUSIVE` lock: during the operation, the table can be neither read nor written;
- it needs disk space for a full copy until it finishes;
- it is **never** run by autovacuum.

> **Opinion:** `VACUUM FULL` on a production table with traffic is, in most scenarios, planned downtime. To compact a table online there are external tools such as the `pg_repack` extension, which have their own costs and risks and deserve separate study; I didn't test them in this article.

## Autovacuum: when and how it acts

Autovacuum is a launcher process that, every `autovacuum_naptime` (default: 1 minute), re-evaluates the databases and fires *workers* (default: `autovacuum_max_workers = 3`) for the tables that exceeded the threshold. The formula for dead tuples, from the documentation:

```text
vacuum threshold = autovacuum_vacuum_threshold
                 + autovacuum_vacuum_scale_factor * pg_class.reltuples
```

With the defaults **50** and **0.2** (confirmed with `SHOW` on version 17.10), a 10,000-row table only gets queued with more than `50 + 0.2 × 10000 = 2050` dead tuples. I tested this with `log_autovacuum_min_duration = 0` and `autovacuum_naptime = 10s`:

| Action | `n_dead_tup` | Did autovacuum fire? |
|---|---|---|
| 2,000 `UPDATE`s on a 10,000-row table | 2,000 | **No** (below 2,050) |
| 200 more `UPDATE`s | 2,200 | **Yes**: `tuples: 1974 removed` |

(The first autovacuum logged, right after the initial load, was fired by the **insert** trigger, `autovacuum_vacuum_insert_threshold = 1000` + `autovacuum_vacuum_insert_scale_factor = 0.2`, which exists to freeze and mark pages as *all-visible* on tables that only receive `INSERT`.)

### The problem with the 0.2 scale factor on large tables

Since the threshold scales with the table size, a table with 500 million rows only triggers vacuum after ~100 million dead tuples. Two effects:

- a tolerated 20% bloat is usually unacceptable on large, high-churn tables;
- when vacuum finally runs, it has a lot of accumulated work and takes a long time.

PostgreSQL 18 brings the `autovacuum_vacuum_max_threshold` parameter (default **100,000,000** tuples; it doesn't appear in the 17 documentation), which imposes an absolute cap on the calculated threshold. In earlier versions, the way to go is to lower `autovacuum_vacuum_scale_factor` per table:

```sql
ALTER TABLE events SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_vacuum_threshold    = 10000
);
```

### Why autovacuum is "slow by design"

`VACUUM` is cost-limited (*cost-based delay*) so it doesn't compete with the workload. Defaults in the 18 documentation: `autovacuum_vacuum_cost_delay = 2ms` and `autovacuum_vacuum_cost_limit = -1` (uses `vacuum_cost_limit`, which is 200). The cost limit is **divided proportionally among the active workers**, so adding workers doesn't multiply total throughput. This is a classic configuration mistake: raising `autovacuum_max_workers` without raising the cost limit just slices the same budget thinner.

## Freezing and XID wraparound

This is where `VACUUM` stops being about performance.

Transaction IDs are 32 bits. PostgreSQL compares XIDs using modulo 2³² arithmetic: for any normal XID, there are 2 billion XIDs "older" and 2 billion "newer". If a tuple has an `xmin` that, after ~2 billion transactions, would no longer look like it is "in the past", it would suddenly look like it is "in the future" and would **disappear** from queries. That is what the documentation calls wraparound, and that is why "every table in every database must be vacuumed at least once every two billion transactions".

The solution is **freezing**: `VACUUM` marks sufficiently old tuples as frozen, and a frozen tuple is considered older than any normal XID. Physically, the tuple gets both flags `HEAP_XMIN_COMMITTED | HEAP_XMIN_INVALID` (mask `0x0300` = 768 in `t_infomask`) instead of having its `xmin` rewritten. You can observe it:

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

### The parameters, in order of importance

Default values checked with `SHOW` on 17.10 and cross-checked with the documentation:

| Parameter | Default | What it does |
|---|---|---|
| `vacuum_freeze_min_age` | 50 million | minimum age of an XID for the tuple to be frozen during a normal vacuum |
| `vacuum_freeze_table_age` | 150 million | table age from which `VACUUM` becomes **aggressive** (scans all pages that are not *all-frozen*) |
| `autovacuum_freeze_max_age` | 200 million | `relfrozenxid` age that **forces** an "anti-wraparound" autovacuum, even with autovacuum turned off |
| `vacuum_failsafe_age` | 1.6 billion | emergency mode: vacuum ignores the *cost delay* and skips non-essential work (such as index cleanup) |
| `autovacuum_multixact_freeze_max_age` | 400 million | equivalent of `autovacuum_freeze_max_age` for multixacts |

The sequence of defenses, then: normal vacuum keeps freezing; at 150 million of age it becomes aggressive; at 200 million autovacuum is forced; at 1.6 billion the *failsafe* speeds everything up; and when 40 million transactions remain the server starts issuing a `WARNING`; with fewer than 3 million, it refuses new transactions that consume an XID:

```text
WARNING:  database "mydb" must be vacuumed within 39985967 transactions
ERROR:  database is not accepting commands that assign new transaction IDs
        to avoid wraparound data loss in database "mydb"
```

According to the documentation, in this state it is still possible to run `VACUUM` itself. Restarting in *single-user* mode is no longer necessary, as it was in older versions. Even so, the Mandrill case shows the real cost: the required vacuum was estimated at tens of days, and the team ended up truncating two multi-terabyte tables to get out of the situation (per the public post-mortem). From what the text states, the likely cause was autovacuum not keeping up with the write load, although the company said it could not confirm whether it fell behind or failed.

### Eager freezing in PostgreSQL 18

"Non-aggressive" vacuum only scans pages that are not *all-visible*, and so it can postpone freezing until it becomes an expensive aggressive scan. The PostgreSQL 18 release notes say that normal `VACUUM` can now freeze some *all-visible* pages ahead of time, controlled by `vacuum_max_eager_freeze_failure_rate` (default `0.03`, and `0` disables it). In the documentation, the parameter limits the fraction of pages that can be scanned without managing to become *all-frozen* before eager scanning is switched off. The goal is to spread the freezing work over several vacuums instead of concentrating it in one aggressive vacuum. I comment on the change in the [article on PostgreSQL 18](/pt/blog/postgresql-18-mudancas-que-importam).

## What holds cleanup back

`VACUUM` only removes tuples below the horizon (*removable cutoff*), and anything that holds an old `xmin` holds the horizon. The documentation cites three specific sources, and I add a fourth:

1. Forgotten **prepared transactions** (`pg_prepared_xacts`);
2. **Long transactions** or `idle in transaction` (`pg_stat_activity.backend_xmin`);
3. Abandoned **replication slots** (`pg_replication_slots.xmin` and `catalog_xmin`);
4. **Replicas with `hot_standby_feedback`**, which propagate the `xmin` of replica queries to the primary.

I reproduced the first case in the previous article: with a `REPEATABLE READ` transaction open, `VACUUM (VERBOSE)` reported `2 are dead but not yet removable` and `removable cutoff: 744`, the `backend_xmin` of the open session.

## Diagnosing in production

Queries I use as a starting point. All are read-only.

**1. Who is closest to wraparound:**

```sql
SELECT datname, age(datfrozenxid) AS xid_age,
       round(100.0 * age(datfrozenxid) / 2147483647, 1) AS pct_of_limit
FROM pg_database
ORDER BY 2 DESC;

SELECT c.oid::regclass AS table_name, age(c.relfrozenxid) AS xid_age,
       mxid_age(c.relminmxid) AS mxid_age
FROM pg_class c
WHERE c.relkind IN ('r','m','t')
ORDER BY 2 DESC
LIMIT 20;
```

**2. Who holds the horizon:**

```sql
SELECT pid, state, age(backend_xmin) AS xmin_age, now() - xact_start AS xact_duration, left(query,80)
FROM pg_stat_activity
WHERE backend_xmin IS NOT NULL
ORDER BY age(backend_xmin) DESC NULLS LAST;

SELECT slot_name, slot_type, active, age(xmin) AS xmin_age, age(catalog_xmin) AS catalog_xmin_age
FROM pg_replication_slots;

SELECT gid, prepared, age(transaction) FROM pg_prepared_xacts;
```

**3. Dead tuples and last vacuum (statistical, not exact):**

```sql
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum, autovacuum_count
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 20;
```

**4. Bloat measured for real:** `pgstattuple` reads the whole table (I/O cost proportional to the size) and can only be run by superusers or members of `pg_stat_scan_tables`. `pgstattuple_approx` skips pages marked as *all-visible* and is cheaper, at the cost of estimates for some of the numbers.

**5. Autovacuum logs:** `log_autovacuum_min_duration = 0` (in testing) or a value such as `1s` in production records each run with page counts, tuples removed, `removable cutoff`, time and WAL generated, which makes it possible to see a trend instead of guessing.

In PostgreSQL 18, the release notes add `total_vacuum_time`, `total_autovacuum_time`, `total_analyze_time` and `total_autoanalyze_time` to `pg_stat_all_tables`, and optional reporting of time spent in *cost delay* (requires `track_cost_delay_timing`).

## Common pitfalls

- **Turning autovacuum off "because it gets in the way".** It keeps running in anti-wraparound mode when `autovacuum_freeze_max_age` is reached, only at the worst moment, with the largest accumulated volume of work.
- **Alerting only on disk space.** Wraparound doesn't depend on disk. Monitor `age(datfrozenxid)` and `mxid_age`.
- **Raising workers without raising the cost budget** (explained above).
- **Treating anti-wraparound autovacuum like any other.** It is the vacuum the database refuses to postpone; cancelling it repeatedly only pushes the problem forward. If it interferes with a maintenance window, the way out is to schedule the window with age to spare, not to kill the process.
- **Running `VACUUM FULL` by reflex.** It doesn't fix the cause and it locks the table.
- **Relying on `n_dead_tup` as an exact measure.** It is a statistic from the collection system, updated asynchronously.
- **`INSERT`-only tables.** Without dead tuples, the `INSERT` trigger (versions 13+) is what fires vacuum to freeze and mark pages as *all-visible*.

## Practical recommendations

1. Monitor `age(datfrozenxid)` and `age(relfrozenxid)` with an alert well below 200 million (the forced-vacuum threshold), for example starting at 100 to 150 million, adjusting to your system's XID consumption rate.
2. Tune `autovacuum_vacuum_scale_factor` per table for the largest and most frequently updated ones.
3. Raise `autovacuum_vacuum_cost_limit` (or lower `cost_delay`) if the logs show vacuums that don't finish; first check whether the bottleneck is I/O.
4. Periodically audit slots, prepared transactions and `idle in transaction` transactions.
5. Set `idle_in_transaction_session_timeout`.
6. Treat "vacuum running for days" as an incident in progress, not as a normal state.

## Frequently asked questions

**Does autovacuum run at peak hours?**
Yes, when the table crosses the threshold. It is cost-limited to reduce the impact, but it isn't scheduled.

**Do I need a manual `VACUUM` if I have autovacuum?**
Usually not. Common cases: after bulk loads (`VACUUM (ANALYZE)`), or to freeze a table that will become read-only.

**Does `VACUUM` block queries?**
Plain `VACUUM` doesn't block `SELECT`, `INSERT`, `UPDATE` or `DELETE`, but it prevents `ALTER TABLE` on the table while it runs.

**Can wraparound happen on an idle database?**
Only if transactions are consumed and never frozen; age is measured in XIDs consumed, not in time.

**Does PostgreSQL lose data on wraparound?**
The server was designed to refuse new transactions before that happens, precisely to avoid data loss; the price is write unavailability.

## Conclusion

`VACUUM` connects three things that are usually treated separately: performance (bloat and statistics), I/O economy (visibility map) and data safety (freeze). The default autovacuum is a good starting point for small databases and a dangerous configuration for large, write-heavy tables. In my reading of the sources, what most separates avoidable incidents from unavoidable ones is having XID age and cleanup horizon metrics *before* the problem. The next article goes one layer up: [how the planner chooses an execution plan](/en/blog/postgresql-query-planner), which depends on the statistics that `ANALYZE` maintains.

## References

This article is a study based on the sources below. Passages marked as opinion reflect my own reading. The experiments were run on local PostgreSQL 17.10 and 18.6; the numbers illustrate the mechanism and do not represent a benchmark.

- PostgreSQL Documentation 17, [24.1. Routine Vacuuming](https://www.postgresql.org/docs/17/routine-vacuuming.html)
- PostgreSQL Documentation 18, [19.10. Vacuuming (runtime-config-vacuum)](https://www.postgresql.org/docs/18/runtime-config-vacuum.html)
- PostgreSQL Documentation 18, [Release Notes: PostgreSQL 18](https://www.postgresql.org/docs/18/release-18.html)
- PostgreSQL Documentation 18, [F.32. pgstattuple](https://www.postgresql.org/docs/18/pgstattuple.html)
- PostgreSQL Documentation 17, [65.7. Heap-Only Tuples (HOT)](https://www.postgresql.org/docs/17/storage-hot.html)
- Mailchimp, [What we learned from the recent Mandrill outage](https://mailchimp.com/what-we-learned-from-the-recent-mandrill-outage/) (public post-mortem, February 2019)
- Sentry, [Transaction ID Wraparound in Postgres](https://blog.sentry.io/transaction-id-wraparound-in-postgres) (2015 post about another incident of the same kind)
