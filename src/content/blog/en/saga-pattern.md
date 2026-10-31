---
title: "Saga Pattern: Distributed Transactions Without 2PC"
description: "How the Saga pattern preserves consistency across microservices: choreography vs. orchestration, compensating transactions, pivot steps, and transactional outbox."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/saga-pattern.webp"
coverAlt: "Illustration of three saga phases—orders, inventory, and payments—where the last fails and dashed arrows indicate compensating transactions C1 and C2"
category: "Software Architecture"
tags:
  - "Saga Pattern"
  - "Microservices"
  - "Distributed Systems"
  - "Architecture"
draft: false
lang: "en"
translationKey: "saga-pattern"
---

Inside a single relational database, ensuring that an order is only confirmed if the customer payment clears is straightforward: wrapping both operations in a database transaction guarantees atomicity. When orders, payments, and inventory live across independent services—each backing onto its own database—that ACID guarantee disappears. The Saga pattern is the industry standard architectural solution to this problem.

In this article, I explain how the Saga pattern works, the two primary coordination models, the three functional step types, the isolation anomalies it leaves unaddressed, and the engineering primitives needed to implement it safely.

## The problem: database-per-service architectures

In microservice architectures, the database-per-service pattern is standard practice. While this guarantees loose coupling, independent scalability, and domain encapsulation, it eliminates the local ACID transaction guarantees traditionally relied upon for cross-boundary business workflows.

The classic distributed alternative—two-phase commit (2PC)—is rarely viable in modern distributed cloud systems: it requires every participant database and message broker to support distributed XA protocols, introduces blocking locks, and severely couples system availability across all nodes. Chris Richardson summarizes this clearly on microservices.io: in microservice environments, 2PC is practically not an option.

## The origins of the pattern

The architectural concept predates modern microservices by decades. Hector Garcia-Molina and Kenneth Salem published their foundational paper *Sagas* at the 1987 ACM SIGMOD conference, addressing **long-lived database transactions** that held locks for prolonged periods, bottlenecking concurrent workloads. Their proposed solution: decompose the long transaction into a sequential chain of small local transactions and, if any step fails, execute **compensating transactions** that semantically undo the changes committed by prior steps.

## How a saga operates

A saga is a coordinated sequence of local transactions. Each step in the sequence:

1. Executes a local transaction within a specific service boundary;
2. Commits changes to that service's private database;
3. Emits an event or message triggering the subsequent step.

If a step fails due to a violated business rule, the saga executes compensating transactions for all preceding completed steps in reverse order.

An e-commerce checkout flow:

| Step | Service | Action | Compensation |
| :--- | :--- | :--- | :--- |
| 1 | Orders | Create order as `PENDING` | Mark order as `CANCELLED` |
| 2 | Inventory | Reserve stock units | Release stock reservation |
| 3 | Payments | Charge payment card | Issue payment refund |
| 4 | Orders | Update order to `CONFIRMED` | (not applicable) |

Compensating is fundamentally distinct from rolling back. The cancelled order record remains preserved in the database, and issuing a refund represents an explicit compensating ledger entry rather than an in-place deletion of the initial charge. Unlike database-level rollbacks, compensations leave an explicit audit trail.

## Three functional step types

Microsoft's Azure Architecture Center categorizes saga steps into three distinct structural roles, a taxonomy that significantly clarifies workflow design:

- **Compensable steps:** actions that can be semantically undone by an opposing transaction (e.g., releasing reserved inventory).
- **Pivot step:** the definitive point of no return. Once the pivot transaction commits, the saga must run forward to completion.
- **Retriable steps:** operations scheduled after the pivot step; they must be idempotent and can be safely retried until successful.

In the checkout example above, payment authorization functions as the pivot: once the customer's card is successfully billed, the remaining objective is to confirm the order (retrying if necessary), rather than unwinding the entire purchase. A core architectural best practice is ordering the saga so that steps most vulnerable to business rule validation failures execute **before** the pivot step.

## Choreography versus orchestration

### Choreography

In a choreographed saga, there is no central orchestrator. Each service listens for domain events published by peers and executes its local transaction reactively.

```text
Orders ──OrderCreated──► Inventory ──StockReserved──► Payments
   ▲                                                     │
   └─────────────── PaymentApproved ◄────────────────────┘
```

Per the Azure Architecture Center, choreography is ideal for simple workflows with few participating services, as it avoids introducing a single coordinating point of failure. However, as workflows expand, business logic becomes decentralized and difficult to follow, circular dependencies can emerge, and comprehensive integration testing requires spinning up all services concurrently.

### Orchestration

An orchestration model introduces a centralized coordinator (a saga state machine) that explicitly directs participants by issuing command messages, tracking saga state transitions, and triggering compensating sequences if exceptions occur.

Advantages: suited for complex multi-step workflows, eliminates circular service dependencies, and keeps individual service boundaries clean and focused on business domains. Disadvantages: requires implementing dedicated orchestration logic, and the orchestrator becomes a critical operational component.

In my view, choreography shines for fire-and-forget asynchronous reactions ("order paid, send notification email"), which is essentially the [Observer pattern](/en/blog/observer-pattern) distributed over a network. For multi-step transactional business flows requiring compensations, orchestration concentrates workflow state and error handling in a single place, vastly simplifying operational debugging.

## A minimal saga orchestrator in TypeScript

The following illustrative TypeScript implementation demonstrates the structural flow. In production, workflow progress must be durably persisted so that execution can resume across process restarts.

```typescript
interface SagaStep<C> {
  name: string;
  execute: (ctx: C) => Promise<void>;
  compensate?: (ctx: C) => Promise<void>;
}

export async function runSaga<C>(steps: SagaStep<C>[], ctx: C): Promise<void> {
  const completed: SagaStep<C>[] = [];

  for (const step of steps) {
    try {
      await step.execute(ctx);
      completed.push(step);
    } catch (error) {
      // Compensate completed steps in reverse order.
      for (const done of completed.reverse()) {
        await done.compensate?.(ctx);
      }
      throw error;
    }
  }
}

// Usage
await runSaga(
  [
    {
      name: 'create-order',
      execute: (c) => orders.createPending(c.orderId),
      compensate: (c) => orders.cancel(c.orderId),
    },
    {
      name: 'reserve-stock',
      execute: (c) => inventory.reserve(c.orderId, c.items),
      compensate: (c) => inventory.release(c.orderId),
    },
    {
      name: 'charge',
      execute: (c) => payments.charge(c.orderId, c.total),
    },
    {
      name: 'confirm-order',
      execute: (c) => orders.confirm(c.orderId),
    },
  ],
  context,
);
```

What is absent from this minimal sketch represents the actual complexity of distributed production systems: durable state checkpointing, exponential backoff retries on retriable steps, strict idempotent receiver handling, and dealing with failures within compensating transactions themselves (which require alerting and manual operational intervention). For mission-critical workflows, evaluating durable workflow engines such as Temporal or AWS Step Functions is often far more robust than rolling custom orchestrators from scratch.

## Reliability: solving the dual-write problem

Each step must mutate its local database **and** dispatch an event message. If the process crashes between those two operations, the database commits while the rest of the system remains unaware, or a message is published for a transaction that rolled back locally.

The standard pattern to resolve this dual-write dilemma is the **transactional outbox**: atomically inserting the outbound event into an outbox table within the exact same database transaction that updates the business state. An independent background worker continuously tails the outbox table and dispatches messages to the broker.

```sql
BEGIN;

INSERT INTO orders (id, status)
VALUES ('ord_123', 'PENDING');

INSERT INTO outbox (id, event_type, payload, created_at)
VALUES (
  gen_random_uuid(),
  'OrderCreated',
  '{"orderId": "ord_123"}',
  now()
);

COMMIT;
```

Because message brokers and outbox relays guarantee at-least-once delivery, downstream consumers must be **idempotent**, typically by tracking processed message IDs within a deduplication table.

## The Achilles' heel of sagas: lack of isolation

Sagas guarantee eventual atomicity (either all steps execute or all are compensated), but they **do not provide isolation**. While a saga is mid-flight, concurrent transactions can read uncommitted, dirty intermediate states. The Azure Architecture Center highlights the classic isolation anomalies:

- **Lost updates:** one saga overwrites modifications committed by another concurrent saga.
- **Dirty reads:** a saga reads uncommitted intermediate data from a workflow that subsequently aborts and compensates.
- **Non-repeatable reads:** different steps within the same saga read fluctuating values because concurrent workflows mutated the records between read steps.

Standard architectural countermeasures include:

- **Semantic locks:** flagging records with an in-flight status (`PENDING`) that downstream services treat as temporarily locked.
- **Commutative updates:** engineering business operations to be order-independent (e.g., additive balance adjustments rather than setting absolute totals).
- **Pessimistic views:** reordering saga steps so that high-risk mutations execute exclusively within retriable steps following the pivot.
- **Rereading values:** verifying baseline data has not mutated before applying updates, aborting or retrying if changes are detected.
- **Version timestamps:** recording chronological sequence numbers on mutated records to enforce deterministic ordering.

## When to avoid sagas

The Azure Architecture Center identifies several scenarios where sagas are counterproductive: tightly coupled synchronous transactions, workflows requiring compensations in preceding service participants, and circular dependencies.

I would emphasize a prior engineering constraint: if the participating entities can comfortably reside within the same database engine—such as within bounded modules of a modular monolith—a standard ACID transaction remains infinitely simpler, faster, and more dependable. The Saga pattern is the appropriate tool when distributed databases are an inescapable operational requirement, not an aesthetic design choice. The article on [when microservices make sense](/en/blog/microservices-when-they-make-sense) examines this decision in detail.

## References

This article is a study based on the sources below. Passages marked as opinion reflect my own reading.

- Hector Garcia-Molina and Kenneth Salem. *Sagas*. Proceedings of the 1987 ACM SIGMOD International Conference on Management of Data. [DOI 10.7166/12-1-358](https://doi.org/10.1145/38713.38742).
- Chris Richardson. [Pattern: Saga](https://microservices.io/patterns/data/saga.html), microservices.io.
- Chris Richardson. [Pattern: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html), microservices.io.
- Microsoft. [Saga design pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga), Azure Architecture Center.
