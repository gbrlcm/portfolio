---
title: "Shopify, Redis and SKIP LOCKED: what really changed in checkout"
description: "Shopify didn't abandon Redis: it moved inventory reservations out of it and into MySQL with SKIP LOCKED. What changed, how the technique works and when to use it."
pubDate: 2026-10-29T18:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/shopify-redis-mysql-skip-locked.webp"
coverAlt: "Illustration of a database table in which two rows appear locked in yellow and two workers move on to free rows, with the SQL snippet FOR UPDATE SKIP LOCKED"
category: "Backend"
tags:
  - "Databases"
  - "MySQL"
  - "PostgreSQL"
  - "Concurrency"
  - "Architecture"
draft: false
lang: "en"
translationKey: "shopify-redis-mysql-skip-locked"
---

In May 2026, a title from Shopify's engineering blog circulated widely among developers: *We replaced Redis with MySQL for inventory reservations—and it scaled*. On social media, it quickly became "Shopify swapped Redis for MySQL". The short phrase is catchy, but it is wrong on the point that matters most.

What the text describes is a change in **one specific flow**: the inventory reservations made during checkout. The article doesn't say the company removed Redis from its infrastructure, and the difference is not a detail. It changes the lesson an engineering team should take from the case.

In this article I reconstruct what Shopify published, explain how `SELECT ... FOR UPDATE SKIP LOCKED` works (with an example I ran on a real PostgreSQL) and discuss the underlying question: when is a specialized tool necessary, and when does the database you already have do a better job?

## What Shopify actually published

The post was written by Emilie Noel and published on May 12, 2026. The honest summary is:

- **What changed:** checkout inventory reservations, which lived in Redis, moved to MySQL, into the same database as the inventory record.
- **What made the change possible:** the `SKIP LOCKED` feature, available in MySQL 8.
- **What the text doesn't say:** that Redis was removed from Shopify in general. The scope is the reservation flow.

The text itself makes an observation worth more than the title: what wasn't possible five years earlier, such as using MySQL for this load, may be possible today with new features like `SKIP LOCKED`.

## The problem: selling what exists, no more, no less

When someone clicks "complete purchase", the system needs to guarantee the item is still available. There are two ways to get it wrong:

- **Selling too much (overselling):** two buyers get the last unit, and the merchant has to cancel an order and apologize.
- **Selling too little (underselling):** the system says the item is sold out when there was still stock, and the merchant loses the sale.

A reservation is a short hold, while the payment is processed, so that two simultaneous checkouts don't claim the same unit. The scale helps explain the pressure: according to the post, the Black Friday 2025 peak reached US$5.1 million in sales per minute, 11% above the previous year's peak. In limited-stock launches (so-called flash sales), thousands of people compete for the same units in the same second.

## How it worked with Redis

In the previous design, each item had a quantity key in Redis. Reserving was a `DECR`, releasing was an `INCR`. Atomic, fast and simple operations.

The problem was at the boundary between two systems. The reservations lived in Redis, but the **official inventory record** (the ledger) lived in MySQL. After payment, the "commit" step of the purchase had to update MySQL **and** clear the reservation in Redis. According to Shopify, those two operations couldn't be wrapped in a single atomic step. Depending on the order and where a failure happened, the result was overselling (sold, but never deducted from the ledger) or underselling (deducted from the ledger, but still marked as reserved). The text also mentions that the Redis model had no notion of multiple inventory locations and required maintaining a separate cluster.

An analogy helps. Imagine a shop where one employee writes reservations in a notebook and another keeps the stock ledger. Each does their job well. But if the phone rings in the middle of a sale and only one of the two records gets updated, the shop now has two truths. No faster tool fixes that: the problem is having **two places** for the same decision.

## Why not a counter in MySQL?

The obvious solution would be one row per item, with a quantity column, and an `UPDATE` that decrements it. Shopify says earlier attempts failed exactly there: a single row with the quantity couldn't withstand the contention.

The reason is the row lock. To decrement safely, each transaction locks the item's row. In a flash sale, all purchases of that item queue up behind the same lock, and the database processes one at a time. The operation is correct, but serialized.

## The new design

The turning point was to change the **modeling**, not just the technology:

1. **One row per sellable unit.** An item with 10 units has 10 rows. Reserving three units means selecting and moving three rows in one transaction.
2. **`SKIP LOCKED` to avoid waiting.** If another transaction has already locked some of those rows, the database simply skips them and returns other available ones. Instead of a queue behind a single lock, each checkout grabs different units in parallel.
3. **A bounded pool.** Having a row for every unit of the entire inventory doesn't scale (the post's example: 50 thousand units in 10 locations would be 500 thousand rows). The system keeps a pool of at most **1,000 available rows per item and location combination**, replenished from the ledger. The number was sized based on the reservation rates observed at peaks.
4. **Controlled replenishment.** When the pool empties, the reservation flow itself triggers replenishment, with a lock ensuring only one transaction does it at a time. The others wait, instead of all rushing to insert rows at the same time. The text admits that this adds latency to those reservations.

An important consequence of this choice: an empty `SKIP LOCKED` result doesn't mean "sold out". It may mean all the rows in the pool are locked at the moment, or that the pool needs to be replenished while the ledger still has stock.

### The details that only show up in production

The most useful part of the post, in my opinion, is the problems the team found when inspecting locks with `SHOW ENGINE INNODB STATUS`:

- **Two locks per reservation.** The prototype used an auto-incrementing primary key. InnoDB locked both the secondary index used in the `WHERE` and the clustered index. Switching to a composite primary key, `(shop_id, inventory_item_id, inventory_group_id, id)`, reduced it to one lock per row.
- **Gap locks and deadlocks.** At MySQL's default isolation level (`REPEATABLE READ`), a `SELECT ... FOR UPDATE SKIP LOCKED` on an empty table acquired gap locks, which blocked the replenishment inserts and could cause deadlocks. These transactions moved to `READ COMMITTED`, the first isolation level different from the default in the codebase.
- **Lock order.** Reserving and committing touched two tables in different orders, forming deadlock cycles. The fix was to standardize the order.
- **Batches with `UNION ALL`.** Carts with several items fetch all the units in a single round trip to the database.

### The real bottleneck: connections

After all that, the limit was neither the lock nor the query. Load tests showed threads queued in MySQL and connections exhausted in ProxySQL, with the CPU far from its maximum. To find out who was holding connections, the team began annotating SQL queries with comments identifying the business process (something like `/* conn_tag:checkout_completion */`) and measured total connection time per caller.

The conclusion: other parts of checkout were holding connections for too long, and the reservations were just the last straw. Cleaning up those parts removed **50% of reads and 33% of transactions** on the primary database. During flash sales, according to the post, the write database's CPU stayed below 50% and the read databases' below 16%.

### How they migrated without stopping checkout

- **Shadow mode:** each reservation was written to both Redis and MySQL, with Redis still as the source of truth, to compare results with real traffic.
- **Cutover with an emergency switch:** once correctness and performance were validated, MySQL became the source of truth, with a kill switch to go back to Redis and dual writing kept.
- **Gradual rollout:** pod by pod, from the least busy to the highest-volume merchants.

## How SKIP LOCKED works

`SELECT ... FOR UPDATE` reads rows and locks them for writing until the end of the transaction. If another transaction has already locked one of those rows, the default is to **wait**. There are two alternatives:

- **`NOWAIT`:** doesn't wait; the query fails with an error if any row is locked.
- **`SKIP LOCKED`:** doesn't wait; the locked rows are removed from the result.

The feature appeared in PostgreSQL 9.5 and reached MySQL in the 8.0 series (the official announcement is from development version 8.0.1). Both documentations carry the same warning, and it is essential: skipping locked rows returns an **inconsistent view of the data**. That is why the feature isn't suited to general transactional work, but is appropriate for avoiding contention when several sessions consume the same table used as a queue. The MySQL documentation adds that statements with `NOWAIT` or `SKIP LOCKED` are unsafe for statement-based replication.

An analogy helps: a stack of printed orders in a kitchen. Each cook takes the top sheet. Without `SKIP LOCKED`, if someone is holding the first sheet, everyone waits for them to decide. With `SKIP LOCKED`, whoever arrives takes the next free sheet. Nobody prepares the same dish twice, and nobody stands idle. The price is that nobody, at that instant, has an exact view of how many sheets remain, which is why the feature isn't suited to reporting.

<figure>
  <img src="/images/blog/shopify-redis-mysql-skip-locked-diagrama.webp" alt="Diagram with a table of five jobs. Worker A locks jobs 1 and 2; worker B runs the same query with SKIP LOCKED, skips the locked rows and receives jobs 3 and 4 without waiting." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Two workers running the same query: the rows locked by the first are skipped by the second. Diagram by the author.</figcaption>
</figure>

## Practical example: two workers on the same queue

The example below is **didactic and simplified**. It isn't Shopify's code, which wasn't published, and it doesn't model inventory reservations: it is a job queue, the use case the documentations cite. It was written for **PostgreSQL 9.5 or later**, at the default isolation level (`READ COMMITTED`). I ran this sequence on a local PostgreSQL 17 while preparing the article, and the results described are the ones I got.

### 1. The table

```sql
CREATE TABLE jobs (
  id         bigserial   PRIMARY KEY,
  payload    jsonb       NOT NULL,
  status     text        NOT NULL DEFAULT 'pending',
  attempts   int         NOT NULL DEFAULT 0,
  locked_at  timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- Partial index: only the pending rows, which are the ones the workers query.
CREATE INDEX jobs_pending_idx ON jobs (created_at) WHERE status = 'pending';

INSERT INTO jobs (payload)
SELECT jsonb_build_object('order', n) FROM generate_series(1, 5) AS n;
```

### 2. Worker A takes two jobs and keeps the transaction open

```sql
-- Session A
BEGIN;
SELECT id FROM jobs
 WHERE status = 'pending'
 ORDER BY created_at
 LIMIT 2
 FOR UPDATE SKIP LOCKED;
-- Result: 1, 2 (now locked by session A)
```

### 3. Worker B runs the same query while A hasn't finished

```sql
-- Session B, in parallel
BEGIN;
SELECT id FROM jobs
 WHERE status = 'pending'
 ORDER BY created_at
 LIMIT 2
 FOR UPDATE SKIP LOCKED;
-- Result: 3, 4, returned immediately
COMMIT;
```

In my test, B responded in about 0.05 s with jobs 3 and 4. A third session, running the same query **without** `SKIP LOCKED`, was blocked for about 3 seconds, until A committed the transaction. Only then did it receive 3 and 4: PostgreSQL re-evaluated the `status = 'pending'` condition on rows 1 and 2, which A had already marked as completed.

### 4. A better pattern: claim in a short transaction

Keeping the transaction open during the entire processing means holding a connection and locks for the duration of the job, which may involve slow network calls. That is exactly the kind of connection use that became a bottleneck at Shopify. A safer pattern is to **claim** the jobs in a short statement, marking them as processing:

```sql
UPDATE jobs
   SET status = 'processing', locked_at = now(), attempts = attempts + 1
 WHERE id IN (
   SELECT id FROM jobs
    WHERE status = 'pending'
    ORDER BY created_at
    LIMIT 2
    FOR UPDATE SKIP LOCKED
 )
RETURNING id, payload;
```

I fired three workers with this statement at the same time, over the same five jobs. Each one received a different set (1 and 2; 3 and 4; 5), with no duplication.

Since the transaction ends right after the claim, the row lock no longer protects the job during processing. That protection becomes the `status`. So you need a process that returns to the queue jobs abandoned by a worker that crashed:

```sql
UPDATE jobs
   SET status = 'pending', locked_at = NULL
 WHERE status = 'processing'
   AND locked_at < now() - interval '5 minutes';
```

And, since a returned job may be executed again, the processing must be **idempotent**: running it twice must have the same effect as running it once.

### And in MySQL?

The idea is the same, with two practical differences: MySQL 8 has no `RETURNING` on `UPDATE`, so the claim is done with a `SELECT ... FOR UPDATE SKIP LOCKED` followed by an `UPDATE` in the same transaction; and, as Shopify's case shows, it's worth checking the isolation level and the primary key so you don't accumulate gap locks and secondary-index locks.

## Where the technique works well, and where it doesn't

**It works well when:**

- the work must be atomic with business data that is already in the database (Shopify's case, and the reason behind the [transactional outbox](/en/blog/saga-pattern) pattern);
- the volume fits comfortably in the database you already operate;
- you want fewer moving parts: no extra cluster, no consistency between two systems.

Not by chance, Solid Queue, the queue backend configured by default in new Rails 8 applications, uses `FOR UPDATE SKIP LOCKED` to avoid waiting for locks when fetching jobs.

**Limitations to consider:**

- **Connections and long transactions.** Each worker occupies a connection while holding locks. Shopify's case shows the limit can appear there before it appears in the CPU.
- **High row churn.** Tables with many inserts, updates and deletes require attention to database maintenance (in PostgreSQL, for example, to vacuum).
- **Polling.** Workers querying the table at a fixed interval generate load even when there is no work.
- **Approximate order.** `SKIP LOCKED` doesn't guarantee strict processing order.
- **Not an event log.** Distributing the same event to several consumers, reprocessing history or integrating dozens of services are problems a message broker was built for.
- **Inconsistent read.** Never use `SKIP LOCKED` to count, sum or generate a report.

## When is a specialized tool necessary?

The lesson of the case is not "always use the database" nor "Redis is unnecessary". It is that **Shopify's problem was one of consistency, not speed**. As long as the reservation and the inventory lived in different systems, no optimization would eliminate the window between the two writes. Putting both in the same database turned a distributed coordination problem into a local transaction.

Some questions that help with the decision:

1. **Does the operation need to be atomic with data already in the database?** If so, keeping everything in the same database eliminates an entire class of inconsistencies.
2. **Are the required volume and latency within what the current database delivers?** Measure before assuming. Shopify only reached an answer after prototypes and load tests.
3. **Do you need something the database doesn't offer?** Fan-out to several consumers, event retention and reprocessing, microsecond cache latency: that is where the specialized tool is justified.
4. **Who will operate the extra piece?** Each new technology has an operational and knowledge cost. Dan McKinley, in *Choose Boring Technology* (2015), describes this as the baggage of "operations" and "cognitive overhead" that every new choice carries.

And one last one, which Shopify's own post leaves as its conclusion: **revisit old decisions**. The premise that "a relational database can't handle this" may have been true five years ago and no longer be. The opposite also holds: what works at today's volume may not work at tomorrow's. Architecture decisions have an expiry date, and it's worth recording them with the context in which they were made, as I discuss in the [system design roadmap](/en/blog/system-design-practical-roadmap).

## References

This article is a study based on the sources below, plus the local test described in the example. Passages marked as opinion reflect my own reading.

- Emilie Noel, Shopify Engineering. [We replaced Redis with MySQL for inventory reservations—and it scaled](https://shopify.engineering/scaling-inventory-reservations) (May 12, 2026). Primary source for the case.
- MySQL 8.0 Reference Manual. [Locking Reads (NOWAIT and SKIP LOCKED)](https://dev.mysql.com/doc/refman/8.0/en/innodb-locking-reads.html).
- MySQL Blog Archive. [MySQL 8.0.1: Using SKIP LOCKED and NOWAIT to handle hot rows](https://dev.mysql.com/blog-archive/mysql-8-0-1-using-skip-locked-and-nowait-to-handle-hot-rows/).
- PostgreSQL Documentation. [SELECT: The Locking Clause](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE).
- Rails. [Solid Queue (README)](https://github.com/rails/solid_queue).
- Hello Interview. [How Shopify Moved Inventory Reservations from Redis to MySQL](https://www.hellointerview.com/learn/system-design/in-the-wild/shopify-inventory-reservations). Independent analysis, useful for the points the original post doesn't detail, such as reservation expiry.
- Dan McKinley. [Choose Boring Technology](https://mcfunley.com/choose-boring-technology) (March 2015).
