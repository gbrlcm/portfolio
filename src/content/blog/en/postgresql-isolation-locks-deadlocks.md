---
title: "Isolation, locks and deadlocks in PostgreSQL: what happens when transactions fight over the same row"
description: "READ COMMITTED, REPEATABLE READ and SERIALIZABLE in practice: lost update, write skew, row and table locks, ALTER TABLE's lock queue, SKIP LOCKED, advisory locks and deadlocks, with reproducible experiments."
pubDate: 2026-10-31T11:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/isolamento-locks-deadlocks-postgresql.webp"
coverAlt: "Two sessions read a balance of 100 and both write 90 under READ COMMITTED, when the expected result was 80"
category: "Databases"
tags:
  - "PostgreSQL"
  - "Transaction Isolation"
  - "Locks"
  - "Deadlock"
  - "Concurrency"
  - "Databases"
  - "PostgreSQL Internals Series"
draft: false
lang: "en"
translationKey: "postgres-isolation-locks"
---

Two transactions read a balance of 100, each subtracts 10 and writes the result. The final balance should be 80. In a test I ran under `READ COMMITTED`, PostgreSQL's default, it ended at **90**: one of the subtractions simply vanished, with no error at all. With an atomic `UPDATE account SET balance = balance - 10`, the same scenario gave 80.

Concurrency is the part of the database where "it works on my machine" fails the most. This is the fifth article in the *PostgreSQL Internals* series, and the first that depends on you opening **two sessions** to understand it. All the scenarios below were run on a local PostgreSQL 17.10, with concurrent sessions simulated through `psql` and `pg_sleep`.

> This article is a study based on the official documentation and on disposable local experiments. Passages marked as opinion reflect my own reading. References are at the end. The experiments depend on timing (`pg_sleep`); the behavior described is the deterministic one, and the measured times are illustrative.

## Isolation: the contract, and what PostgreSQL implements

The SQL standard defines four isolation levels by the anomalies each one *may* allow. PostgreSQL implements three distinct levels, via MVCC (see the [article on MVCC](/pt/blog/mvcc-postgresql)):

| Level | When the snapshot is taken | Possible phenomena in PostgreSQL |
|---|---|---|
| `READ COMMITTED` (default) | at each **statement** | non-repeatable read, phantom, serialization anomaly |
| `REPEATABLE READ` | at the transaction's first command | **serialization anomaly** (e.g. write skew); no phantom reads |
| `SERIALIZABLE` | same, plus SSI detection | none; but may fail with a serialization error |

Two documented facts that tend to cause confusion: `READ UNCOMMITTED` **behaves like `READ COMMITTED`** (there is no dirty read in PostgreSQL), and PostgreSQL's `REPEATABLE READ` **doesn't allow phantom reads**, going beyond the standard's minimum. That is PostgreSQL-specific behavior, not the SQL standard's; in other databases, the same level name can carry different guarantees.

### READ COMMITTED and the read-modify-write "lost update"

The most common code pattern that generates inconsistency is to read, compute in the application and write back:

```sql
-- Sessions A and B, both in READ COMMITTED
BEGIN;
SELECT balance FROM account2 WHERE id = 1;           -- both read 100
-- (the application computes 100 - 10 = 90)
UPDATE account2 SET balance = 90 WHERE id = 1;       -- both write 90
COMMIT;
```

Measured result: final balance **90**, when the correct one would be 80. The database didn't get it wrong: each transaction followed the rules of the level; the `SELECT` simply didn't lock anything. There are three classic fixes:

1. **Do the calculation in the database:** `UPDATE account2 SET balance = balance - 10 WHERE id = 1`. In the same test with that form, the result was **80**. The second transaction waited for the first to commit and then **re-evaluated** the updated row. The documentation describes this behavior: if the row was changed by another transaction that committed, "the command's search condition (the `WHERE` clause) is re-evaluated to see if the updated version of the row still matches" and the `UPDATE` proceeds on the new version.
2. **Lock the row before reading:** `SELECT balance FROM account2 WHERE id = 1 FOR UPDATE`.
3. **Use a higher level** (`REPEATABLE READ` or `SERIALIZABLE`) and handle the failure with a retry.

The documentation also shows a subtle consequence of re-evaluation: the `WHERE` is re-evaluated only on the row that *was being updated*, which can produce results that no serial order would produce (the official example uses `UPDATE website SET hits = hits + 1` concurrent with a `DELETE ... WHERE hits = 10`, and the `DELETE` has no effect).

### REPEATABLE READ: fail instead of overwrite

Under `REPEATABLE READ`, the transaction works on a fixed snapshot. If it tries to update a row that **another transaction already updated and committed after the snapshot**, PostgreSQL doesn't re-evaluate: it aborts. I reproduced it like this:

```sql
-- Session A
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT balance FROM account2 WHERE id = 1;           -- 100 (snapshot fixed)
SELECT pg_sleep(2);

-- Session B (while A sleeps): UPDATE ... SET balance = balance - 5; commit

-- Session A
UPDATE account2 SET balance = balance - 10 WHERE id = 1;
-- ERROR:  could not serialize access due to concurrent update
```

This error is **expected behavior**, not a bug. The documentation tells the application to "abort the current transaction and retry the whole transaction from the start". Read-only transactions under `REPEATABLE READ` never suffer serialization conflicts.

### The limit of REPEATABLE READ: write skew

Serialization anomalies that don't involve the same row escape `REPEATABLE READ`. The classic example is the doctors' on-call roster: the business rule is "always at least one doctor on call". Ana and Bia are on call; each one, in a transaction, checks that there are two doctors and then takes herself off the roster. Both checks pass, both writes hit **different** rows, and no row conflict is detected.

```sql
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT count(*) FROM on_call WHERE is_on_call;      -- 2 in both sessions
-- ... pause ...
UPDATE on_call SET is_on_call = false WHERE doctor = :me;
COMMIT;
```

Result measured under `REPEATABLE READ`: **0 doctors on call** at the end, with both transactions committed. The business rule was violated without any error.

Repeating exactly the same experiment under `SERIALIZABLE`:

```text
ERROR:  could not serialize access due to read/write dependencies among transactions
DETAIL:  Reason code: Canceled on identification as a pivot, during write.
HINT:  The transaction might succeed if retried.
```

One of the transactions was cancelled; **1 doctor** remained on call, exactly what the rule requires. PostgreSQL's `SERIALIZABLE` uses **SSI** (*Serializable Snapshot Isolation*): it doesn't block more, but tracks read/write dependencies between concurrent transactions with *predicate locks* (visible in `pg_locks` as `SIReadLock`) and aborts one of the involved ones when it detects a dangerous cycle. According to the documentation, these locks "do not cause any blocking and therefore cannot play any part in causing a deadlock".

Practical consequences:

- `SERIALIZABLE` **requires** retry logic in the application. The error has `SQLSTATE 40001` (*serialization_failure*), the same as the `REPEATABLE READ` one above.
- There are false positives: SSI may cancel a transaction that wouldn't have violated anything, because it is conservative.
- The documentation warns that, even when checking beforehand whether a key exists, "it is possible to see unique constraint violations caused by conflicts with overlapping Serializable transactions".

> **Opinion:** in systems with business rules that span several rows (limits, quotas, "at least one", "at most N"), I prefer to treat `SERIALIZABLE` with retry as the first candidate, and explicit locks as the alternative when the cost of retry is high. The decision is domain-driven: there is no "safe by default" level without a corresponding cost.

<figure>
  <img src="/images/blog/isolamento-locks-deadlocks-postgresql-diagrama.webp" alt="Table with the READ COMMITTED, REPEATABLE READ and SERIALIZABLE levels against three scenarios: read-compute-write (loses an update under READ COMMITTED), concurrent UPDATE (serialization error under REPEATABLE READ) and on-call doctor write skew (violation under REPEATABLE READ, error and 1 remaining under SERIALIZABLE)." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>The same scenario at each isolation level, as observed on PostgreSQL 17.10. Diagram by the author.</figcaption>
</figure>

## Locks: what is actually locked

MVCC eliminates most of the blocking between readers and writers, but not all of it. There are three families of locks worth telling apart.

### 1. Row locks

Row locks block only **writers and other lockers of the same row**, never ordinary reads. Four modes (ch. 13.3.2), from strongest to weakest:

| Mode | Acquired by | Blocks |
|---|---|---|
| `FOR UPDATE` | `DELETE`; `UPDATE` that changes key columns; `SELECT ... FOR UPDATE` | everything below |
| `FOR NO KEY UPDATE` | `UPDATE` that does **not** change key columns | all except `FOR KEY SHARE` |
| `FOR SHARE` | `SELECT ... FOR SHARE` | `UPDATE`, `DELETE`, `FOR UPDATE`, `FOR NO KEY UPDATE` |
| `FOR KEY SHARE` | foreign key check; `SELECT ... FOR KEY SHARE` | `DELETE`, `FOR UPDATE`, updates that change a key |

PostgreSQL **records the row lock in the tuple itself** (in `xmax`, as we saw in the MVCC article) and doesn't keep an in-memory list, so there is no "lock escalation" and no limit on rows locked per transaction. The flip side, in the documentation's words: locking a row "may cause a disk write".

An experiment shows the subtlety of foreign keys. Transaction 1 inserts a row into `child` (which references `parent(id = 1)`), which takes `FOR KEY SHARE` on the parent and stays open:

```text
UPDATE parent SET name='b' WHERE id=1   → waited 0.05 s   (FOR NO KEY UPDATE doesn't conflict with KEY SHARE)
SELECT ... FROM parent WHERE id=1 FOR UPDATE → waited 1.47 s  (conflicts)
```

Without the `NO KEY UPDATE` and `KEY SHARE` modes, updating any non-key column of a parent would block inserts of children. They were created precisely to avoid that.

### 2. SKIP LOCKED, NOWAIT and queues

By default, `SELECT ... FOR UPDATE` waits. Two variants change that:

```sql
SELECT id FROM queue WHERE id = 1 FOR UPDATE NOWAIT;
-- ERROR:  could not obtain lock on row in relation "queue"

SELECT id FROM queue ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 2;
-- with id=1 locked by another session: returned 2 and 3
```

`SKIP LOCKED` skips rows that are already locked and is the basis of queue patterns on SQL tables, with several *workers* pulling work without blocking each other. The documentation describes it as suitable for this case, but notes that it gives an intentionally inconsistent view of the data. The [Shopify case study](/pt/blog/shopify-redis-mysql-skip-locked) covered on this blog uses exactly this mechanism (in MySQL).

### 3. Table locks

Every command acquires some table lock. The documentation's eight modes form a conflict matrix; the ones that matter most in production:

| Lock | Typical of | Conflicts with |
|---|---|---|
| `ACCESS SHARE` | `SELECT` | only `ACCESS EXCLUSIVE` |
| `ROW EXCLUSIVE` | `INSERT`, `UPDATE`, `DELETE` | `SHARE` and above |
| `SHARE UPDATE EXCLUSIVE` | `VACUUM`, `ANALYZE`, `CREATE INDEX CONCURRENTLY` | itself and `SHARE` and above (doesn't block DML) |
| `SHARE` | `CREATE INDEX` (without `CONCURRENTLY`) | blocks writes |
| `ACCESS EXCLUSIVE` | `DROP TABLE`, `TRUNCATE`, `VACUUM FULL`, many `ALTER TABLE`s | **everything, including `SELECT`** |

The documentation's tip deserves emphasis: **only `ACCESS EXCLUSIVE` blocks a plain `SELECT`**. And here lies one of the most common production traps.

### The lock queue: a waiting DDL also blocks whoever arrives after it

Locks are granted in **queue order**. If an `ALTER TABLE` migration (which asks for `ACCESS EXCLUSIVE`) has to wait for a long transaction reading the table, **the `SELECT`s that arrive after it wait behind it**, even though they are compatible with the long transaction. I reproduced it:

```text
Session 1: BEGIN; SELECT count(*) FROM account2; SELECT pg_sleep(4);   -- holds ACCESS SHARE
Session 2: SET lock_timeout = '3s'; ALTER TABLE account2 ADD COLUMN x int;   -- joins the queue
Session 3: SELECT count(*) FROM account2;   -- a trivial SELECT

Result: the trivial SELECT waited ≈ 2.55 s
        the ALTER TABLE failed: ERROR: canceling statement due to lock timeout
```

The `SELECT` doesn't conflict with session 1; it waited because it joined the queue **behind** the pending `ALTER TABLE`. The standard defense is a short `SET lock_timeout` on every migration, with retry. The parameter's default value is `0` (no limit), as I verified with `SHOW lock_timeout`. For monitoring, `pg_blocking_pids(pid)` and the `pg_locks` view (`granted` column) show who is waiting for whom.

### 4. Advisory locks

These are locks whose meaning is defined by the application: the database only guarantees mutual exclusion over a number (or a pair of numbers). The documentation recommends them for pessimistic locking patterns that fit MVCC poorly, and says they are "faster, avoid table bloat, and are automatically cleaned up by the server at the end of the session".

```sql
SELECT pg_try_advisory_lock(42);        -- f, if another session already holds key 42
SELECT pg_advisory_xact_lock(42);       -- transaction level: released at COMMIT/ROLLBACK
```

Documented cautions:

- **Session level** ignores transactions: a lock acquired in a transaction that later rolls back **stays held**. Locks accumulate: each acquisition requires an unlock.
- They share the lock table's memory (sized by `max_locks_per_transaction` × connections). Exhausting it prevents the server from granting *any* lock.
- In `SELECT pg_advisory_lock(id) FROM foo WHERE ... LIMIT 100`, the `LIMIT` may not be applied before the function; use a subquery. Unexpected locks stay "dangling" until the end of the session.
- In transaction-mode *poolers* (PgBouncer, for example), session locks are dangerous, because the same server session is reused by different clients. Prefer the `xact` variant.

## Deadlocks

A deadlock occurs when each transaction waits for a lock the other holds. PostgreSQL detects it automatically: after a wait exceeds `deadlock_timeout` (default **1 s**, as I confirmed with `SHOW`), it checks the wait graph and, if there is a cycle, aborts one of the transactions.

I reproduced it with two transactions updating the same two rows in opposite order:

```sql
-- A: UPDATE ... WHERE id=1;   sleep;   UPDATE ... WHERE id=2;
-- B: UPDATE ... WHERE id=2;   sleep;   UPDATE ... WHERE id=1;
```

```text
ERROR:  deadlock detected
DETAIL:  Process 68871 waits for ShareLock on transaction 902; blocked by process 68882.
         Process 68882 waits for ShareLock on transaction 901; blocked by process 68871.
HINT:  See server log for query details.
CONTEXT:  while updating tuple (0,10) in relation "account2"
```

Notice that the wait is for a `ShareLock` **on the transaction** (902, 901), not on the row: that is how PostgreSQL implements waiting on a row conflict. Which transaction is aborted is, according to the documentation, "difficult to predict and should not be relied upon". The `SQLSTATE` is `40P01` (*deadlock_detected*), distinct from the serialization `40001`. In both cases, the correct response from the application is the same: **retry the whole transaction**.

How to prevent it, according to the documentation (ch. 13.3.4):

1. Acquire locks on multiple objects **always in the same order** in every part of the application. In a balance transfer, update the lower `id` first, for example.
2. Take the **most restrictive mode** needed on each object first (avoid `SELECT ... FOR SHARE` followed by `UPDATE`).
3. Keep transactions short. Transactions that wait for user input or external calls hold locks indefinitely.
4. When you can't guarantee it, **retry**.

For investigation, `log_lock_waits = on` logs waits that exceed `deadlock_timeout`, and the log messages carry the two queries involved. In PostgreSQL 18, according to the release notes, `log_lock_failures` also logs `SELECT ... NOWAIT` failures.

## Common pitfalls

- **Read-modify-write in the application** under `READ COMMITTED`: silent lost update.
- **Treating error `40001` or `40P01` as a fatal failure** instead of a retry. Under `REPEATABLE READ`/`SERIALIZABLE` these errors are part of the contract.
- **Retry without idempotency:** repeating a transaction that also called an external service duplicates the external effect.
- **Migrations without `lock_timeout`:** the queued `ALTER TABLE` can take down the entire application, as shown.
- **Thinking `SERIALIZABLE` is just "slower".** It requires redesigning for retry and can raise the abort rate under high contention.
- **Session-level advisory locks through a pooler.**
- **Confusing a row lock with a table lock.** `SELECT ... FOR UPDATE` takes `ROW SHARE` on the table; heavy DDL (`ACCESS EXCLUSIVE`) conflicts with it.
- **An open transaction waiting on HTTP.** It holds locks and the vacuum horizon (see the [article on VACUUM](/pt/blog/vacuum-autovacuum-wraparound-postgresql)).

## Practical recommendations

1. Whenever possible, put the logic in the `UPDATE` (`balance = balance - x`), not read-compute-write.
2. For invariants across several rows, choose between `SERIALIZABLE` with retry or `SELECT ... FOR UPDATE` in a fixed order.
3. Implement a generic retry for `40001` and `40P01`, with a limit and *backoff*.
4. Set `lock_timeout` (and `statement_timeout`) in migrations and maintenance tools; consider `idle_in_transaction_session_timeout`.
5. Use `FOR UPDATE SKIP LOCKED` for table queues, and `NOWAIT` when failing fast is better than waiting.
6. Monitor `pg_stat_activity.wait_event_type = 'Lock'` and `pg_locks` with `granted = false`.
7. Prefer **transaction-level** advisory locks, and document the meaning of each key.

## Frequently asked questions

**What is PostgreSQL's default isolation level?**
`READ COMMITTED`.

**Does `SELECT FOR UPDATE` block reads?**
No. Ordinary reads continue without blocking; it blocks other writers and lockers of the same row.

**Is `SERIALIZABLE` equivalent to running transactions one at a time?**
The result is guaranteed to be equivalent to *some* serial order, but the transactions run concurrently and can be aborted to ensure that.

**How does PostgreSQL choose the victim of a deadlock?**
The documentation says it is hard to predict and that you shouldn't depend on it.

**Do I need to handle deadlocks if I lock in a consistent order?**
A consistent order reduces them a lot, but doesn't eliminate every case (indexes, FKs, triggers, implicit locks). Keep the retry.

**Does `pg_advisory_lock` work across different database instances?**
No. It only holds within a single PostgreSQL server; physical replicas don't share the state of these locks.

## Conclusion

The biggest lesson from the experiments is that the three isolation levels are not steps of "safety", but different contracts about **when you will see an error instead of wrong data**. Under `READ COMMITTED`, the database silently allows the lost read-modify-write; under `REPEATABLE READ`, it aborts same-row conflicts but lets write skew through; under `SERIALIZABLE`, it aborts that case too, and the bill reaches the application in the form of a retry code. Row, table and advisory locks are the explicit tools for the rest. In the next article, the [changes in PostgreSQL 18](/pt/blog/postgresql-18-mudancas-que-importam), including the ones that affect this behavior.

## References

This article is a study based on the sources below. Passages marked as opinion reflect my own reading. The experiments were run on a local PostgreSQL 17.10.

- PostgreSQL Documentation 17, [13.2. Transaction Isolation](https://www.postgresql.org/docs/17/transaction-iso.html)
- PostgreSQL Documentation 17, [13.3. Explicit Locking](https://www.postgresql.org/docs/17/explicit-locking.html)
- PostgreSQL Documentation 17, [13.4. Data Consistency Checks at the Application Level](https://www.postgresql.org/docs/17/applevel-consistency.html)
- PostgreSQL Documentation 17, [SELECT: The Locking Clause](https://www.postgresql.org/docs/17/sql-select.html#SQL-FOR-UPDATE-SHARE)
- PostgreSQL Documentation 17, [Appendix A. PostgreSQL Error Codes](https://www.postgresql.org/docs/17/errcodes-appendix.html) (`40001`, `40P01`)
- PostgreSQL Documentation 17, [28.2 / `pg_locks`](https://www.postgresql.org/docs/17/view-pg-locks.html)
- PostgreSQL Documentation 18, [Release Notes: PostgreSQL 18](https://www.postgresql.org/docs/18/release-18.html) (`log_lock_failures`)
- Ports, D. R. K.; Grittner, K. *Serializable Snapshot Isolation in PostgreSQL.* Proceedings of the VLDB Endowment, v. 5, n. 12, 2012. [arXiv:1208.4179](https://arxiv.org/abs/1208.4179)
