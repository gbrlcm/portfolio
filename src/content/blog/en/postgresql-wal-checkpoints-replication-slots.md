---
title: "WAL, checkpoints and replication slots: how PostgreSQL protects your data (and how a forgotten slot fills the disk)"
description: "Write-Ahead Logging, full-page writes, checkpoints, crash recovery, streaming and logical replication, lag and WAL retention: how each piece works and how an abandoned replication slot becomes an incident. With experiments."
pubDate: 2026-10-31T13:30:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/wal-checkpoints-replication-slots-postgresql.webp"
coverAlt: "WAL segments with a checkpoint and an inactive-slot bar retaining 628 MB, above the 256 MB max_wal_size"
category: "Databases"
tags:
  - "PostgreSQL"
  - "WAL"
  - "Checkpoint"
  - "Replication"
  - "Replication Slots"
  - "Databases"
  - "PostgreSQL Internals Series"
draft: false
lang: "en"
translationKey: "postgres-wal-replication"
---

A replication slot sat idle, with no consumer connected. On a lab server configured with `max_wal_size = 256MB`, the `pg_wal` directory reached **640 MB**, with **628 MB** retained for a standby that was no longer there. None of this raised an error: it was exactly what the slot was designed to do. On a production server with no disk alert, the end of this story is usually a full volume and the database stopping.

WAL is the piece that simultaneously underpins the durability of `COMMIT`, crash recovery, continuous backup and replicas. This is the tenth and last article in the *PostgreSQL Internals* series, and the one that connects almost all the previous ones: [MVCC](/en/blog/postgresql-mvcc) explains that old versions remain in the heap; [VACUUM](/en/blog/postgresql-vacuum-autovacuum-wraparound) removes them; WAL records all of it and lets another server repeat the same work.

> This article is a study based on the official documentation and on experiments on a local PostgreSQL 17.10, with disposable instances (a primary, a standby via `pg_basebackup`, and a failure-test cluster). Passages marked as opinion reflect my own reading. References are at the end. The numbers illustrate the mechanism and are not a benchmark.

## Write-Ahead Logging: the rule

The central rule, in the documentation: "changes to data files (where tables and indexes reside) must be written only after those changes have been logged, that is, after WAL records describing the changes have been flushed to permanent storage."

Consequences (all from the documentation):

- **At commit, only the WAL needs to be synced**, not all the data files changed by the transaction. WAL is written sequentially, and the cost of the *sync* is much lower than flushing scattered data pages.
- **Batching:** a single `fsync` can confirm several transactions (*group commit*).
- **Recovery by REDO:** changes not yet applied to the data pages can be redone from the WAL ("*roll-forward recovery*").
- Journaling file systems are not required for the integrity of data files or WAL.
- The same log enables **online backup and PITR** (restoring a physical backup and replaying WAL up to the desired point) and **replication**.

### What exists physically

WAL lives in `pg_wal/`, split into **segments** (16 MB by default; `wal_segment_size = 16777216` bytes on my server, set at `initdb`). Each position in the log is an **LSN** (*log sequence number*), and the segment name derives from it:

```sql
SELECT pg_current_wal_lsn(), pg_walfile_name(pg_current_wal_lsn());
--  0/30D40430 | 000000010000000000000030
```

With `pg_waldump` you can read the records. I ran a simple `UPDATE` and read the excerpt:

```text
rmgr: Heap        len: 72, tx: 964, lsn: 0/30D40430, desc: HOT_UPDATE old_xmax: 964, old_off: 1 ... new_off: 2, blkref #0: rel 1663/16384/16930 blk 0
rmgr: Transaction len: 46, tx: 964, lsn: 0/30D40478, desc: COMMIT 2026-10-31 15:22:30.758084 -03
```

A 72-byte `HOT_UPDATE` record (the logical change on page 0 of the relation) and a 46-byte `COMMIT`. Notice that WAL records changes to **physical blocks**, not the SQL statement. That is what lets a standby repeat them byte for byte (physical replication) and makes recovery independent of the original SQL.

## Full-page writes: why WAL is larger than it looks

If the server crashes in the middle of writing an 8 kB data page, the operating system may leave a "torn" page, half new and half old. Replaying a WAL record on top of a torn page doesn't fix it. PostgreSQL's defense is `full_page_writes` (default: `on`): according to the documentation, "the first modification of a data page after each checkpoint results in logging the **entire** page content".

I measured this with a 100,000-row table and updated 10% of it, twice, right after a `CHECKPOINT`:

| Operation | WAL generated |
|---|---|
| 1st `UPDATE` of 10,000 rows, after the checkpoint | **18 MB** |
| 2nd `UPDATE` of the same rows, with no new checkpoint | **3,211 kB** |
| same `UPDATE` after *another* checkpoint | **6,604 kB** |

And `pg_waldump --stats` for the last case showed: records 3.0 MB, **full-page images (FPI) 3.7 MB, 54.9% of the total**. In plain words: after each checkpoint, WAL "pays" again for the image of every page touched. The documentation summarizes the consequence: a smaller checkpoint interval "increases the output to the WAL, partially negating the goal of using a smaller interval".

Two documented options to reduce the cost, with their respective risks:

- **`wal_compression`** (default `off`; `pglz`, `lz4` or `zstd` depending on the build): compresses **only the page images** in the WAL, trading CPU for volume, "without increasing the risk of unrecoverable data corruption". I didn't measure the gain.
- **`full_page_writes = off`**: speeds up normal operation, but "can lead to unrecoverable data corruption or silent corruption after a crash". It is only justified when the file system and hardware guarantee atomic page writes, and that is something you need to **prove**, not assume.

## Checkpoints

A *checkpoint* writes all dirty pages to disk and records a marker in the WAL. It defines the **redo point**: recovery after a crash starts at the last completed checkpoint, and WAL older than it is no longer needed for that.

According to the documentation, a checkpoint starts "every `checkpoint_timeout` seconds (default: 5 minutes), or if `max_wal_size` (default: 1 GB) is about to be exceeded, whichever comes first". If no WAL has been written since the previous one, the new checkpoint is skipped. You can also force one with the `CHECKPOINT` command.

- **`checkpoint_completion_target`** (default 0.9): the writing of dirty pages is spread over 90% of the interval, to avoid I/O spikes. The documentation recommends not going above 0.9: 1.0 "is quite likely to result in checkpoints not being completed on time".
- **The interval trade-off.** More frequent checkpoints give faster recovery (less WAL to redo), at the cost of more page writes and more FPI. More spaced-out checkpoints reduce that cost and lengthen recovery.
- If checkpoints happen closer together than `checkpoint_warning` seconds, the log recommends increasing `max_wal_size`. The documentation says occasional occurrences (such as during large `COPY`s) aren't alarming, but frequent ones indicate the parameters need to go up.
- `min_wal_size` guarantees a minimum reserve of recycled segments even when the system is idle.

To observe it, turn on `log_checkpoints` (each checkpoint logs buffers written, write and *sync* times, and distance in WAL) and query the `pg_stat_checkpointer` view, which since PostgreSQL 17 gathers `num_timed`, `num_requested`, `write_time`, `sync_time` and `buffers_written`. A high `num_requested` relative to `num_timed` indicates checkpoints triggered by WAL volume rather than by the clock.

<figure>
  <img src="/images/blog/wal-checkpoints-replication-slots-postgresql-diagrama.webp" alt="Diagram with the recovery test sequence (checkpoint, commit, kill -9, REDO), the WAL volume of 18 MB on the first UPDATE after the checkpoint versus 3.2 MB on the second, and the wal_status states of a slot: reserved, extended, unreserved and lost." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Crash recovery, full-page writes and WAL retention by a slot with no consumer, measured on PostgreSQL 17.10. Diagram by the author.</figcaption>
</figure>

## Crash recovery, end to end

I set up the following test on a separate cluster: after a `CHECKPOINT`, I created a table with 50,000 rows and did another `CHECKPOINT`; I opened an **uncommitted** transaction inserting 20,000 rows; in another session, I did a committed `UPDATE` on 1,000 rows; and then I killed the `postmaster` and all its children with `kill -9`, with no clean shutdown. On restart, the server log recorded:

```text
LOG:  database system was not properly shut down; automatic recovery in progress
LOG:  redo starts at 0/1B75E40
LOG:  invalid record length at 0/1E8AFF0: expected at least 24, got 0
LOG:  redo done at 0/1E8AFC8
LOG:  checkpoint starting: end-of-recovery immediate wait
LOG:  database system is ready to accept connections
```

And the state of the data:

```text
 total | committed | uncommitted
 50000 |      1000 |           0
```

What happened, step by step:

1. The server read `pg_control` and saw there had been no clean shutdown.
2. It started REDO at the last checkpoint's point (`0/1B75E40`) and redid the roughly 3 MB of WAL up to the end (`0/1E8AFC8`), reapplying, among other things, the committed `UPDATE`.
3. The "invalid record length ... got 0" line is **not an error**: it is how the server recognizes the end of valid WAL (the remaining space is zeroed).
4. The 20,000 rows of the uncommitted transaction simply never pass MVCC's visibility test (their `xmin` belongs to a transaction that didn't commit); nothing needs to be undone, as we saw in the MVCC article.
5. An end-of-recovery checkpoint consolidates the state, and the server accepts connections.

Recovery time is proportional to the WAL generated since the last checkpoint, so it is indirectly bounded by `checkpoint_timeout` and `max_wal_size`.

## Durability: what a COMMIT guarantees

`fsync` (default `on`) and `synchronous_commit` (default `on`) define what "committed" means:

| `synchronous_commit` | `COMMIT` returns when... | Risk |
|---|---|---|
| `off` | without waiting for the WAL flush | losing the most recent transactions in a crash (maximum delay of 3× `wal_writer_delay`, or 600 ms with the 200 ms default), but **no corruption**: the state is the same as if they had been aborted |
| `local` | the local WAL has been synced | doesn't wait for replication |
| `on` (default) | the local WAL has been synced (and, with synchronous replicas, the standby wrote to durable storage) | loss only if the primary and all synchronous standbys lose their storage |
| `remote_write` | the standby wrote to the file system | survives a crash of the standby's PostgreSQL, not of its OS |
| `remote_apply` | the standby applied it, and the change is visible there | the slowest |

Two documented warnings: turning `fsync` off can cause "unrecoverable data corruption" in a crash, and is only advisable if the whole database can be recreated from external data; and "high-quality hardware, by itself, is not a sufficient justification" for turning it off. `synchronous_commit` can be changed **per transaction** (`SET LOCAL synchronous_commit TO OFF`), useful for non-critical work.

> Note on my tests: I ran `synchronous_commit` microbenchmarks on a Mac, but I'm not publishing them. My environment doesn't prove what the disk really did with an `fsync`, so the numbers wouldn't represent real durability. Take this kind of measurement on production hardware.

## Physical replication: streaming

A physical standby keeps a byte-for-byte copy of the cluster, continuously applying the WAL it receives. I set one up with `pg_basebackup -R`:

```bash
pg_basebackup -h 127.0.0.1 -p 54410 -U postgres -D sb -R -S sb1 -X stream -c fast
# -R writes primary_conninfo and primary_slot_name to postgresql.auto.conf
# -S uses the 'sb1' slot (created beforehand with pg_create_physical_replication_slot)
```

On the primary, `pg_stat_replication` shows progress at four positions: `sent_lsn` (sent), `write_lsn` (written on the standby), `flush_lsn` (flushed to disk) and `replay_lsn` (applied and visible). The difference between the primary's current LSN and each of them is the **lag** in bytes; the `write_lag`, `flush_lag` and `replay_lag` columns give the equivalent in time.

After a load of 200,000 rows, the primary and standby looked like this:

```text
application_name | lag_bytes_replay | write_lag | flush_lag | replay_lag
walreceiver      |         25394288 | 00:00:00.032 | 00:00:00.032 | 00:00:00.144
```

One second later the lag in bytes was already zero. Interpretation: lag in bytes is "how much is left to apply right now", lag in time is "how long a change took from commit until it was confirmed at that stage". Useful alerts combine both.

Beyond lag, the documentation warns about a side effect: **`hot_standby_feedback`** (default `off`) makes the standby report the `xmin` of its queries to the primary, which avoids query cancellations due to conflicts, but "can cause *bloat* on the primary in some workloads": it is the same logic as the cleanup horizon in the [VACUUM article](/en/blog/postgresql-vacuum-autovacuum-wraparound).

## Logical replication

Physical replication copies pages and requires the same major version. **Logical** replication decodes the WAL into row-level changes. It requires `wal_level = logical`, which, according to the documentation, "increases the WAL volume, particularly if many tables are configured for `REPLICA IDENTITY FULL` and many `UPDATE`/`DELETE` statements are executed". With a logical slot and the `test_decoding` test plugin, the WAL of an `INSERT`, `UPDATE`, `DELETE` sequence became:

```text
BEGIN 974
table public.lg: INSERT: id[integer]:1 v[text]:'a'
COMMIT 974
BEGIN 975
table public.lg: UPDATE: id[integer]:1 v[text]:'b'
COMMIT 975
BEGIN 976
table public.lg: DELETE: id[integer]:1
COMMIT 976
```

Note that the `UPDATE` and the `DELETE` identify the row only by its key (`id`): that is the *replica identity*, by default the primary key. For tables without a primary key, the default (`relreplident = d`) isn't enough to replicate `UPDATE`/`DELETE`; you need to configure `REPLICA IDENTITY` (for example `FULL`, at the cost of more WAL). Also notice `catalog_xmin = 974` in the `pg_replication_slots` view: a logical slot holds back the cleanup horizon of the system **catalog**.

Logical replication lets you replicate a subset of tables, across different major versions, and is the basis of several upgrade and change data capture (CDC) strategies. Its operational cost is higher: DDL isn't replicated automatically, and conflicts have to be handled (PostgreSQL 18 begins to log and count conflicts, per the release notes).

## Replication slots: the guarantee and the risk

A slot is a persistent record, on the primary, of "how far this consumer has read". As long as it exists, the server **does not remove** WAL the consumer may still need, even if the consumer is disconnected. The logical decoding documentation is explicit about the risk:

> "Replication slots persist across crashes and know nothing about the state of their consumer(s). They will prevent removal of required resources even when there is no connection using them. [...] In extreme cases this could cause the database to shut down to prevent transaction ID wraparound. [...] So if a slot is no longer required it should be dropped."

In other words: slots persist through crashes, know nothing about the state of their consumers, prevent removal of needed resources even without a connection, and **in extreme cases can make the database shut down to prevent XID wraparound**. That last point ties the slot directly to the VACUUM article, because the slot's `xmin` and `catalog_xmin` hold back the cleanup horizon.

### Experiment 1: the slot keeping its promise

With slot `sb1` created and the standby stopped, I generated load (six rounds of `UPDATE` on the 200,000-row table, with `CHECKPOINT` between them):

```text
 slot_name | active | wal_status | wal_retained
 sb1       | f      | extended   | 628 MB          pg_wal = 640 MB  (max_wal_size = 256MB)
```

`wal_status = extended` is defined in the documentation as: "`max_wal_size` is exceeded but the files are still retained, either by the replication slot or by `wal_keep_size`". When I turned the standby back on, it connected to the slot, received what was missing and went back to `reserved`, with `pg_wal` back at 256 MB. That was exactly the guarantee the slot offers.

### Experiment 2: the slot with no limit

The price of the guarantee is that **it has no ceiling by default**: `max_slot_wal_keep_size = -1` means, in the documentation's words, that "replication slots can retain an unlimited amount of WAL files". In production, this is the scenario of the forgotten slot of a decommissioned replica, a stalled CDC connector or a slow consumer: `pg_wal` grows until the disk runs out.

### Experiment 3: limiting retention

I restarted the primary with `max_slot_wal_keep_size = 200MB`, kept the standby off and repeated the load. At each round, I queried `pg_replication_slots`:

```text
round | wal_status | retained | safe_wal_size | invalidation_reason
    1 | reserved   | 112 MB   | 88 MB         |
    2 | lost       |          |               | wal_removed
    3 | lost       |          |               | wal_removed    (...)
```

And the primary's log:

```text
LOG:  invalidating obsolete replication slot "sb1"
DETAIL:  The slot's restart_lsn 0/34818E70 exceeds the limit by 25063824 bytes.
HINT:  You might need to increase "max_slot_wal_keep_size".
```

`pg_wal` went back to 256 MB, but the slot became **unusable** (`lost`, reason `wal_removed`). When I turned the standby back on:

```text
FATAL:  could not receive data from WAL stream: ERROR:  requested WAL segment 000000010000000000000034 has already been removed
```

The standby would need to be rebuilt from a new `pg_basebackup`. That is the essential trade-off: **either the primary's disk is at risk, or the replica is**. There is no third option without WAL archiving (`archive_mode` with a `restore_command` on the standby), which I didn't test here.

The `wal_status` states, according to the documentation: `reserved` (within `max_wal_size`), `extended` (above `max_wal_size`, but retained), `unreserved` ("the slot no longer retains the required WAL files and some of them are to be removed at the next checkpoint"; may return to `reserved`/`extended`) and `lost` ("the slot is no longer usable"). `safe_wal_size` shows how many bytes can still be written without the slot reaching `lost`, and is null if `max_slot_wal_keep_size` is `-1`.

### What PostgreSQL 18 adds

According to the PostgreSQL 18 release notes, the `idle_replication_slot_timeout` parameter automatically invalidates slots inactive for longer than the configured time (I confirmed on 18.6 that the default is `0`, that is, disabled). It attacks the forgotten-slot problem differently: by **idle time**, rather than by volume of WAL retained.

## Monitoring queries

```sql
-- 1. Slots, retention and state
SELECT slot_name, slot_type, active, wal_status,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS wal_retained,
       pg_size_pretty(safe_wal_size) AS margin,
       age(xmin) AS xmin_age, age(catalog_xmin) AS catalog_xmin_age,
       invalidation_reason
FROM pg_replication_slots;

-- 2. Lag per standby
SELECT application_name, state, sync_state,
       pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS lag_bytes,
       write_lag, flush_lag, replay_lag
FROM pg_stat_replication;

-- 3. Size of pg_wal (since version 10)
SELECT pg_size_pretty(sum(size)) FROM pg_ls_waldir();

-- 4. Checkpoints
SELECT num_timed, num_requested, write_time, sync_time, buffers_written FROM pg_stat_checkpointer;  -- PostgreSQL 17+
```

## Durability, recovery and availability: the triangle

| Goal | Mechanism | Cost |
|---|---|---|
| **Durability** (not losing what was committed) | WAL + `fsync` + `synchronous_commit`; synchronous replication for machine losses | commit latency |
| **Recovery** (coming back after a failure) | REDO from the checkpoint; physical backup + WAL archiving for PITR | WAL space, redo time |
| **Availability** (keep serving) | physical standbys, promotion, logical replicas | complexity, slot risk, attention to *split brain* |

**Asynchronous** replication (the default: empty `synchronous_standby_names`) means a failover can lose transactions committed on the primary not yet received by the standby. Synchronous replication reduces that window at the cost of latency and a dependency: if the synchronous standby becomes unavailable, commits can wait. The decision between them is a business one (RPO/RTO), not a technical one.

## Common pitfalls

- **Slots with no owner.** Decommissioned replicas, stalled CDC connectors, migration tools that left the slot behind. Take a periodic inventory.
- **No alert on `pg_wal` space and on `wal_status`.**
- **Unlimited `max_slot_wal_keep_size` in production** (the default) without monitoring; or too small, taking down legitimate replicas during load peaks.
- **Manually deleting files from `pg_wal`** to "free up space". It can make the cluster impossible to recover. The solution is to address the cause (slot, `wal_keep_size`, archiving) and let the server clean up.
- **Turning off `fsync` or `full_page_writes` "for performance".**
- **Confusing byte lag with time lag.**
- **Expecting `synchronous_commit=on` with one standby to protect from everything.** Without `synchronous_standby_names`, it only guarantees the local disk.
- **Ignoring `hot_standby_feedback`** and its bloat effect on the primary.
- **Using logical replication without `REPLICA IDENTITY`** on tables without a key.
- **Forgetting that logical slots retain `catalog_xmin`.**

## Practical recommendations

1. Monitor: size of `pg_wal`, `wal_status` and `wal_retained` per slot, lag in bytes and in time per standby, and `num_requested` from `pg_stat_checkpointer`.
2. Set `max_slot_wal_keep_size` consciously, knowing the value is the choice between protecting the primary or the replica; on PostgreSQL 18, evaluate `idle_replication_slot_timeout`.
3. Have a slot-removal procedure (`pg_drop_replication_slot`) as part of decommissioning any replica or connector.
4. Size `max_wal_size` so that most checkpoints are timed rather than volume-triggered; turn on `log_checkpoints`.
5. Consider `wal_compression` if FPI is a large share of your WAL; measure the CPU cost.
6. Periodically test recovery: restore a backup, apply WAL, promote a replica. A backup that has never been restored is a hypothesis.
7. Make the decision between synchronous and asynchronous replication in terms of the RPO and RTO agreed with the business.

## Frequently asked questions

**What is WAL?**
The log where PostgreSQL records changes before applying them to the data files, the basis of durability, recovery and replication.

**Does a checkpoint delete WAL?**
Not directly: it defines the point from which recovery starts; old segments are recycled or removed if nothing else (slot, `wal_keep_size`, archiving) needs them.

**Why is `pg_wal` bigger than `max_wal_size`?**
Because `max_wal_size` is a *soft* limit for triggering checkpoints; slots, `wal_keep_size` and archiving failures can retain more. That is what I measured: 640 MB with `max_wal_size = 256MB`.

**Can I safely drop a slot?**
If the consumer still exists and will try to reconnect to it, it may need to be rebuilt (the maintenance documentation warns about this for slots that hold back `xmin`). If the consumer was decommissioned, it is the right action.

**Physical or logical replication?**
Physical for read replicas and failover (full cluster copy, same major); logical for subsets of tables, different versions and CDC, with more operational work.

**Does synchronous replication eliminate data loss?**
It reduces the loss window on primary failures; it doesn't replace backup. And it can block commits if the synchronous standby becomes unavailable.

## Conclusion

WAL is simple in its rule and rich in its consequences: logging before applying makes `COMMIT` cheap and recovery possible; checkpoints bound how much is redone after a crash and how much you pay in page images; replication reuses the same log to keep other servers in sync; and slots are the contract that guarantees the log won't disappear before it's read, a contract that, without limits or monitoring, can fill the primary's disk. The series closes the loop like this: MVCC creates versions, VACUUM cleans them up, the planner and indexes find them, locks and isolation coordinate them, and WAL guarantees that none of it is lost. If this reading yields just one practical action, let it be this: **list your replication slots now and see how much WAL each one retains.**

## References

This article is a study based on the sources below. Passages marked as opinion reflect my own reading. The experiments were run on a local PostgreSQL 17.10 (and the `idle_replication_slot_timeout` check on 18.6).

- PostgreSQL Documentation 17, [28.3. Write-Ahead Logging (WAL)](https://www.postgresql.org/docs/17/wal-intro.html)
- PostgreSQL Documentation 17, [28.5. WAL Configuration](https://www.postgresql.org/docs/17/wal-configuration.html)
- PostgreSQL Documentation 17, [19.5. Write Ahead Log](https://www.postgresql.org/docs/17/runtime-config-wal.html) (`fsync`, `synchronous_commit`, `full_page_writes`, `wal_compression`, `wal_level`)
- PostgreSQL Documentation 17, [19.6. Replication](https://www.postgresql.org/docs/17/runtime-config-replication.html) (`max_slot_wal_keep_size`, `wal_keep_size`, `hot_standby_feedback`)
- PostgreSQL Documentation 17, [53.19. pg_replication_slots](https://www.postgresql.org/docs/17/view-pg-replication-slots.html)
- PostgreSQL Documentation 17, [47.2. Logical Decoding Concepts](https://www.postgresql.org/docs/17/logicaldecoding-explanation.html)
- PostgreSQL Documentation 17, [26.2. Log-Shipping Standby Servers](https://www.postgresql.org/docs/17/warm-standby.html)
- PostgreSQL Documentation 17, [pg_waldump](https://www.postgresql.org/docs/17/pgwaldump.html) and [pg_basebackup](https://www.postgresql.org/docs/17/app-pgbasebackup.html)
- PostgreSQL Documentation 17, [24.1. Routine Vacuuming](https://www.postgresql.org/docs/17/routine-vacuuming.html) (replication slots and wraparound)
- PostgreSQL Documentation 18, [Release Notes: PostgreSQL 18](https://www.postgresql.org/docs/18/release-18.html) (`idle_replication_slot_timeout`)
