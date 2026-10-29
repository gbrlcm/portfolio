---
title: "ACID in Databases: The Fundamentals Every Senior Software Engineer Must Truly Understand"
description: "An in-depth guide to Atomicity, Consistency, Isolation, and Durability: concurrency anomalies, MVCC, WAL, PostgreSQL vs MySQL internals, and what databases cannot fix for you."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/acid-em-bancos-de-dados.webp"
coverAlt: "Schematic minimalist diagram illustrating database transactions committed across isolation levels in dark graphite and amber"
category: "Databases"
tags:
  - "PostgreSQL"
  - "Databases"
  - "ACID"
  - "Concurrency"
  - "Backend"
  - "Architecture"
draft: false
lang: "en"
translationKey: "acid-databases"
---

In almost every technical interview for backend or data engineering positions, the question eventually emerges: *"What does the ACID acronym stand for?"*. Almost everyone recites the textbook response without hesitation: Atomicity, Consistency, Isolation, and Durability. Four elegant words, memorized from college lecture slides or quick exam summaries.

The real challenge begins the following Monday, in production.

When a message broker fans out ten concurrent workers competing to debit the exact same user balance, when an external payment webhook triggers twice due to network jitter, or when an open transaction hoards row locks for five seconds while awaiting a synchronous HTTP response and starves your API connection pool, dictionary definitions won't help you.

Many software engineers treat relational databases like magic cupboards: you open the door with `BEGIN`, toss three SQL queries inside, shut it with `COMMIT`, and assume the engine will handle any race condition, prevent all duplicates, and keep the business logic sound. That is simply not how relational storage engines operate.

The ACID properties are neither magic nor absolute guarantees of business correctness. They are a rigorous set of mechanical guarantees provided under specific configuration parameters and isolation contracts—often with clear trade-offs in latency, lock contention, and architectural complexity.

In this guide, we dissect the ACID model in depth. No shallow four-paragraph overviews, no childish bakery analogies. We will build an understanding grounded in real code: inspecting internal behaviors within the PostgreSQL engine, analyzing real-world concurrency anomalies, breaking down core storage mechanisms like Multi-Version Concurrency Control (MVCC) and Write-Ahead Logging (WAL), contrasting how different relational engines implement these guarantees, and crucially, defining where the database's responsibility ends and yours begins.

---

## 1. Start with the Problem, Not the Acronym

To understand why ACID properties exist, don't begin with Jim Gray's seminal 1981 paper. Begin with a classic financial bug.

Consider a simplified banking system. Alice holds an account (`id = 1`) with an available balance of $500.00. Bob holds an account (`id = 2`) with an available balance of $200.00. Alice initiates a $100.00 transfer to Bob.

In terms of physical SQL statements executed against the database, this operation requires at least two discrete steps:

```sql
-- Step 1: Deduct $100 from Alice's account
UPDATE accounts SET balance = balance - 100.00 WHERE id = 1;

-- Step 2: Credit $100 to Bob's account
UPDATE accounts SET balance = balance + 100.00 WHERE id = 2;
```

If we execute these two statements independently, outside of any transactional boundary, what happens if the server suffers an abrupt power outage, a kernel panic, or a forceful `SIGKILL` by the Linux OOM killer right between Step 1 and Step 2?

The outcome is critical:

1. Step 1 was flushed to disk. Alice's balance dropped to $400.00.
2. Step 2 never ran. Bob's balance remains $200.00.
3. $100.00 vanished from the institution's balance sheet.

No syntax errors occurred. Each individual SQL statement was completely valid. The disaster occurred because a funds transfer is not a loose collection of isolated operations: it is a **Logical Unit of Work (LUW)**. From the domain perspective, debiting Alice and crediting Bob is an indivisible business event. Either both take place, or neither must have ever happened.

### The Concept of a Transaction

This requirement birthed the formal concept of a **database transaction**. A transaction is a delimiter that instructs the Database Management System (DBMS) that a series of operations must be treated as a single, atomic unit.

In the standard SQL specification and in PostgreSQL, the fundamental transactional boundaries are:

- `BEGIN` (or `START TRANSACTION`): marks the start of a new transactional unit.
- `COMMIT`: instructs the engine to make all mutations within this transaction permanent, durable, and visible to other transactions.
- `ROLLBACK`: instructs the engine to immediately discard all pending modifications made during the transaction, restoring data to its exact state prior to `BEGIN`.

```sql
BEGIN;

UPDATE accounts SET balance = balance - 100.00 WHERE id = 1;
UPDATE accounts SET balance = balance + 100.00 WHERE id = 2;

COMMIT;
```

If any failure occurs prior to `COMMIT`, or if the application issues an abort, the engine triggers a `ROLLBACK`, guaranteeing that no intermediate state pollutes storage.

### Single-Statement vs. Multi-Statement Atomicity

Engineers frequently confuse these two tiers of atomicity:

1. **Single-Statement Atomicity:** Even without typing `BEGIN` explicitly, virtually all relational databases treat every single SQL command as an implicit transaction (autocommit mode). If you execute `UPDATE products SET price = price * 1.10 WHERE category_id = 5;` modifying 50,000 rows, and on row 49,999 a numeric overflow check constraint triggers, the entire command rolls back. None of the prior 49,998 rows remain modified.
2. **Multi-Statement Transaction Atomicity:** The ability to extend that indivisibility across arbitrary batches of `UPDATE`, `INSERT`, and `DELETE` commands spanning multiple tables, committing or aborting them in unison.

The ACID properties are the theoretical and practical framework that makes this Logical Unit of Work trustworthy under high concurrency and physical hardware failures.

---

## 2. Atomicity — All or Nothing

**Atomicity** guarantees that a transaction possesses no observable partial states. Either all operations comprising the transaction are executed and committed successfully, or the entire database returns to the exact state it was in before the transaction began.

The word stems from the Greek *atomos* (indivisible). In database engineering, it means a transaction cannot be fragmented by crashes, errors, or timeouts.

### Executable Example in PostgreSQL

Let's establish a working schema in PostgreSQL:

```sql
-- 1. Table schema
CREATE TABLE accounts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_name VARCHAR(100) NOT NULL,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_balance_non_negative CHECK (balance >= 0)
);

CREATE TABLE transfers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_account_id BIGINT NOT NULL REFERENCES accounts(id),
    destination_account_id BIGINT NOT NULL REFERENCES accounts(id),
    amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_positive_amount CHECK (amount > 0),
    CONSTRAINT chk_distinct_accounts CHECK (source_account_id <> destination_account_id)
);

-- 2. Initial state
INSERT INTO accounts (owner_name, balance) VALUES ('Alice', 500.00);
INSERT INTO accounts (owner_name, balance) VALUES ('Bob', 200.00);
```

#### The Happy Path: Success and COMMIT

```sql
BEGIN;

-- Debit Alice
UPDATE accounts 
SET balance = balance - 100.00 
WHERE id = 1;

-- Credit Bob
UPDATE accounts 
SET balance = balance + 100.00 
WHERE id = 2;

-- Audit trail entry
INSERT INTO transfers (source_account_id, destination_account_id, amount)
VALUES (1, 2, 100.00);

COMMIT;
```

After `COMMIT`:
- Alice has $400.00.
- Bob has $300.00.
- The `transfers` audit row exists.

#### The Failure Path: Error and Automatic Abort

Now imagine a business constraint failure or insufficient funds:

```sql
BEGIN;

-- Attempt to transfer $450 from Alice (whose balance is $400)
-- This violates chk_balance_non_negative!
UPDATE accounts 
SET balance = balance - 450.00 
WHERE id = 1;
-- Output: ERROR: new row for relation "accounts" violates check constraint "chk_balance_non_negative"

-- Any subsequent statements within this transaction fail with:
-- ERROR: current transaction is aborted, commands ignored until end of transaction block
UPDATE accounts 
SET balance = balance + 450.00 
WHERE id = 2;

ROLLBACK;
```

When a statement fails in PostgreSQL, the transaction enters an aborted state. The engine rejects any further commands until you issue `ROLLBACK`. Alice's balance remains untouched at $400.00.

### How PostgreSQL Implements Atomicity

How does the storage engine roll back modified rows without corrupting disk storage?

1. **Write-Ahead Logging (WAL):** Every mutation is recorded sequentially in WAL buffers before being written to disk data pages. During recovery from a crash, uncommitted transactions recorded in the WAL are cleanly rolled back.
2. **Tuple Visibility via MVCC:** PostgreSQL does not overwrite rows in place. An `UPDATE` writes a new tuple version (*tuple*) with a metadata header (`xmin` pointing to the modifying transaction). If the transaction rolls back, that tuple simply remains invisible to all other readers and is later cleaned up asynchronously by the `VACUUM` background worker.

---

## 3. Consistency — Preserving Data Invariants

**Consistency** in ACID is often misunderstood, partly because the word is overloaded across computer science (such as in the CAP theorem, where Consistency denotes linearizability, or in eventual consistency).

In ACID, **Consistency means that a transaction transitions the database from one valid state to another valid state**, upholding all defined schemas, constraints, and business invariants.

### Database Constraints vs. Domain Invariants

Consistency is divided into two distinct tiers:

1. **Structural and Relational Constraints (Handled by the DBMS):**
   - `PRIMARY KEY` (uniqueness and non-nullability).
   - `FOREIGN KEY` (referential integrity).
   - `CHECK` constraints (e.g., `balance >= 0`, `amount > 0`).
   - `NOT NULL` constraints.
2. **Domain Invariants (Application Responsibility):**
   - Example: *"A user cannot hold more than 3 active subscription plans across different products"*.
   - If your application fails to validate domain rules and executes valid SQL that complies with table constraints, the database will happily commit the data. The database ensures mechanical consistency; domain consistency remains your responsibility.

---

## 4. Isolation — Concurrent Transaction Execution

If transactions executed strictly serially, one after another, database engines would be trivial to build. However, throughput would be unacceptably low on multi-core servers handling thousands of requests per second.

**Isolation** governs how concurrent transactions see each other's intermediate state. Perfect isolation means concurrent transactions produce outcomes identical to executing them in some sequential order.

When isolation levels are relaxed to maximize throughput, various **concurrency anomalies** emerge:

### The Classical Concurrency Anomalies

1. **Dirty Read:** Transaction A reads data modified by Transaction B that has not yet committed. If Transaction B rolls back, Transaction A acted upon phantom, invalid data.
2. **Non-Repeatable Read (Fuzzy Read):** Transaction A reads a row. Transaction B updates that same row and commits. Transaction A re-reads the row and observes altered values.
3. **Phantom Read:** Transaction A queries a range of rows (`WHERE status = 'pending'`). Transaction B inserts a new row matching that filter and commits. Transaction A queries the same range again and sees a new "phantom" row.
4. **Write Skew / Serialization Anomaly:** Two concurrent transactions read overlapping data sets, make decisions based on what they observed, update disjoint records, and commit—inadvertently violating a global business invariant that neither transaction violated in isolation.

---

## 5. SQL Isolation Levels in Practice

The ANSI/ISO SQL-92 standard defines four isolation levels, characterized by which anomalies they prevent:

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read | Serialization Anomaly |
| :--- | :---: | :---: | :---: | :---: |
| **Read Uncommitted** | Possible (in theory) | Possible | Possible | Possible |
| **Read Committed** | Prevented | Possible | Possible | Possible |
| **Repeatable Read** | Prevented | Prevented | Prevented (in Postgres) | Possible (Write Skew) |
| **Serializable** | Prevented | Prevented | Prevented | Prevented |

> **PostgreSQL Detail:** In PostgreSQL, `Read Uncommitted` is treated internally as `Read Committed`. The engine never allows dirty reads under any configuration due to its MVCC architecture.

### Setting Isolation Levels in SQL

```sql
-- Set level for the current transaction
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- Or set default for the entire session
SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

### PostgreSQL Serializable Snapshot Isolation (SSI)

PostgreSQL achieves full `Serializable` isolation without traditional two-phase locking (2PL) through **Serializable Snapshot Isolation (SSI)**. SSI tracks read-write dependencies (`si_read_locks`) in memory. If a dangerous cycle is detected indicating a potential serialization anomaly, one of the transactions is aborted with error code `40001` (`serialization_failure`), prompting the application to retry.

---

## 6. Durability — What Does It Mean to Commit?

**Durability** guarantees that once a transaction successfully commits, its state changes survive indefinitely—even in the event of an immediate server crash, power outage, or OS failure.

### The Physics of Write-Ahead Logging (WAL) and `fsync`

Hard drives and SSDs are slow compared to RAM. Writing updated 8KB database pages randomly across disk blocks on every commit would crush performance.

To achieve both durability and high throughput:

1. Modifying operations are appended sequentially to the in-memory **WAL Buffer**.
2. On `COMMIT`, PostgreSQL issues an `fsync()` system call, forcing the operating system and disk controller to flush the WAL buffer to non-volatile physical storage.
3. Actual table data pages (*shared buffers*) can be lazily flushed to disk later in batches by the background *checkpointer* process.

### The `synchronous_commit` Trade-off

PostgreSQL exposes a tuning parameter called `synchronous_commit`:

```sql
-- Default: maximum durability (waits for physical WAL flush)
SET synchronous_commit = on;

-- High-throughput mode: commits acknowledge immediately to the client
-- before the WAL is flushed to physical disk.
-- Window of potential data loss upon hard crash: typically 200–600ms.
SET synchronous_commit = off;
```

In financial or transactional systems, `synchronous_commit` should always remain `on`. For telemetry, temporary processing queues, or analytical event logging, setting it to `off` can deliver 5x–10x write throughput gains.

---

## 7. Practical Engineering: Production Checklist

When designing transactional systems backed by relational databases:

1. **Keep transactions short:** Never hold open a transaction while awaiting external network I/O (Stripe API calls, email sending, third-party microservices). This holds database locks and exhausts connection pools.
2. **Order row locks deterministically:** If two transactions update Account 1 and Account 2 in reverse order, a deadlock will occur. Always sort IDs before acquiring row locks (`SELECT ... FOR UPDATE`).
3. **Handle serialization failures gracefully:** In `Repeatable Read` and `Serializable` modes, prepare your application client to catch error `40001` and implement an exponential backoff retry policy.
4. **Enforce constraints in the schema:** Never rely solely on application code to prevent invalid data. Use database `CHECK`, `UNIQUE`, and `FOREIGN KEY` constraints as your final line of defense.

---

## 8. Database Comparison: PostgreSQL vs. MySQL (InnoDB)

| Feature | PostgreSQL | MySQL (InnoDB) |
| :--- | :--- | :--- |
| **Default Isolation Level** | `Read Committed` | `Repeatable Read` |
| **MVCC Implementation** | Tuple versions stored in main table heap; cleaned by `VACUUM` | Undo logs in dedicated tablespace; rows updated in place |
| **Repeatable Read Behavior** | Snapshot Isolation; prevents Phantom Reads | Next-Key Locks (Index Record Lock + Gap Lock) |
| **Serializable Mechanism** | SSI (Serializable Snapshot Isolation, optimistic lock-free) | Pessimistic Shared Locks (`LOCK IN SHARE MODE`) |

---

## 9. Technical References and Bibliography

1. **Gray, Jim.** *"The Transaction Concept: Virtues and Limitations."* Proceedings of the 7th International Conference on Very Large Data Bases (1981).
2. **Kleppmann, Martin.** *Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems.* O'Reilly Media (2017).
3. **Berenson, H., Bernstein, P., Gray, J., Melton, J., O'Neil, E., & O'Neil, P.** *"A Critique of ANSI SQL Isolation Levels."* ACM SIGMOD Record (1995).
4. **PostgreSQL Global Development Group.** *"Concurrency Control and Transaction Isolation."* Official PostgreSQL Documentation.

---

## Conclusion: The Boundary of Responsibility

The ACID model remains the gold standard of data safety in software engineering. However, the database engine is only a mechanical instrument. It faithfully enforces mathematical contracts, byte durability, and relational constraints.

True architectural resilience requires knowing what the database guarantees and what it leaves to your application architecture. When you master both, production issues cease to be mysteries and become manageable engineering parameters.
