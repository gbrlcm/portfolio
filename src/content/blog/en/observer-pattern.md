---
title: "Observer Pattern: Decoupling Event Publishers from Consumers"
description: "How the Observer design pattern works, a typed TypeScript implementation, Node.js EventEmitter mechanics, common pitfalls, and architectural trade-offs."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/observer-pattern.webp"
coverAlt: "Illustration of a central yellow event publisher broadcasting to four distinct observers: email, invoice, inventory, and metrics"
category: "Software Engineering"
tags:
  - "Design Patterns"
  - "Observer"
  - "TypeScript"
  - "Software Engineering"
draft: false
lang: "en"
translationKey: "observer-pattern"
---

The Observer pattern is one of the most widely deployed design patterns in software development, often operating unnoticed beneath daily abstractions. Every `addEventListener` in the browser DOM, every `EventEmitter` in Node.js, and the majority of reactive UI frameworks build on this identical principle: an object broadcasts notifications when an internal event occurs, without needing to know the concrete identity or implementation of its listeners.

In this article, I explain the foundational mechanics of the pattern, implement a type-safe `EventBus` in TypeScript, examine standard platform implementations, and highlight the architectural pitfalls that emerge when observers are deployed carelessly.

## What the Observer pattern actually is

The pattern was formally cataloged in the landmark book *Design Patterns: Elements of Reusable Object-Oriented Software* (1994) by Erich Gamma, Richard Helm, Ralph Johnson, and John Vlissides—the "Gang of Four" (GoF). The intent specified by the authors: define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.

It defines two core participant roles:

- **Subject** (or Publisher): maintains an internal registry of interested dependents and publishes notifications.
- **Observer** (or Subscriber): registers its interest with the subject and reacts when notified.

The engineering benefit is structural decoupling: the subject only knows an abstract observer interface ("an entity capable of receiving an event notification"), completely ignorant of the concrete downstream classes reacting to the signal.

## The problem it resolves

Consider an e-commerce checkout flow when a customer payment clears. Multiple distinct subsystems must react: send an email confirmation, generate an invoice, decrement warehouse inventory stock, and increment telemetry metrics. Without the Observer pattern, the code typically degrades into a tightly coupled procedural script:

```typescript
async function confirmPayment(order: Order) {
  await orders.markAsPaid(order.id);
  await email.sendConfirmation(order);
  await invoices.generate(order);
  await inventory.decrement(order.items);
  metrics.increment('orders_paid');
}
```

Every new business reaction demands modifying this single function, making it directly dependent on every disparate subsystem in the company. With the Observer pattern, this function merely announces a factual domain event (`OrderPaid`), and interested modules subscribe independently.

## Type-safe implementation in TypeScript

A minimal, strongly typed implementation with event-payload mapping:

```typescript
type Listener<T> = (payload: T) => void | Promise<void>;

export class EventBus<Events extends Record<string, unknown>> {
  private listeners: { [K in keyof Events]?: Set<Listener<Events[K]>> } = {};

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    const set = (this.listeners[event] ??= new Set());
    set.add(listener);
    // Returns an unsubscription function to prevent memory leaks.
    return () => set.delete(listener);
  }

  async emit<K extends keyof Events>(event: K, payload: Events[K]): Promise<void> {
    const set = this.listeners[event];
    if (!set) return;

    const results = await Promise.allSettled([...set].map((listener) => listener(payload)));
    for (const result of results) {
      if (result.status === 'rejected') {
        console.error(`Listener for "${String(event)}" failed`, result.reason);
      }
    }
  }
}

// Usage
type AppEvents = {
  'order.paid': { orderId: string; total: number };
  'user.created': { userId: string; email: string };
};

const bus = new EventBus<AppEvents>();

const unsubscribe = bus.on('order.paid', async ({ orderId }) => {
  await email.sendConfirmation(orderId);
});

await bus.emit('order.paid', { orderId: 'ord_123', total: 15990 });
unsubscribe();
```

Two deliberate design decisions in this implementation:

1. **`on` returns an unsubscription closure.** The subscriber immediately receives its own cleanup mechanism, minimizing forgotten listener memory leaks.
2. **A single listener failure does not abort other subscribers.** `Promise.allSettled` ensures all listeners execute before logging aggregated exceptions. If your business rules demand halting immediately upon the first failure, that choice must be modeled explicitly.

## Built-in platform implementations

### In the browser: `EventTarget`

The browser DOM is fundamentally an Observer implementation. `addEventListener` subscribes, `removeEventListener` tears down, and the modern `signal` option allows cancelling batches of listeners cleanly using an `AbortController`:

```typescript
const controller = new AbortController();

window.addEventListener('resize', updateLayout, { signal: controller.signal });
document.addEventListener('keydown', handleShortcuts, { signal: controller.signal });

// Aborts both event listeners in a single call
controller.abort();
```

This pattern is especially valuable in client-side lifecycle components that mount and unmount dynamically, such as Astro View Transitions.

### In Node.js: `EventEmitter`

The official Node.js documentation highlights three behavioral characteristics that frequently surprise developers:

- **Listeners execute synchronously**, in the exact order they were registered, and return values are discarded. An `async` listener is not awaited by `emit()`.
- **An unhandled `'error'` event throws an uncaught exception**, terminating the Node.js process. The official runtime recommendation is to always register a listener on the `'error'` channel.
- **Registering more than 10 listeners for a single event triggers a runtime console warning** alerting to potential memory leaks. It is not an unyielding ceiling, but an operational diagnostic flag.

```typescript
import { EventEmitter } from 'node:events';

const emitter = new EventEmitter();

emitter.on('error', (err) => {
  console.error('Emitter failure', err);
});

emitter.once('ready', () => {
  console.log('Executes exactly once');
});
```

## Common architectural pitfalls

### Memory leaks from unmanaged subscriptions

The subject retains a strong reference to every registered observer callback. If a component registers a listener and is discarded without unregistering, the garbage collector cannot reclaim it, and it will continue consuming memory and executing background handlers indefinitely. This is the single most common bug associated with the pattern.

### Synchronous execution bottlenecks and uncaught exceptions

In synchronous implementations, a slow or blocking observer halts the execution of all subsequent observers and the publisher itself. Furthermore, an uncaught exception inside one listener can crash the loop before other listeners are notified. Explicitly define whether notifications are synchronous or asynchronous, and handle errors defensively.

### Implicit temporal coupling

If observer B implicitly relies on observer A executing first, your architecture has hidden coupling masquerading as a decoupled event bus. The Observer pattern inherently assumes that observers are completely independent.

### Inscrutable, invisible control flow

In *What do you mean by "Event-Driven"?* (2017), Martin Fowler identifies a core architectural hazard: when a business workflow traverses a chain of decoupled event notifications, understanding the end-to-end flow becomes difficult because it is not explicitly stated in the source code. In complex distributed systems, the only way to reconstruct the workflow is often by tracing production logs.

My practical rule of thumb: if execution order is a strict business requirement, do not use the Observer pattern. An explicit procedural coordinator or orchestrator makes the workflow readable and maintainable.

### Cascading cycles and infinite loops

Listener A emits event 1, which triggers listener B, which in turn emits event 2, re-triggering listener A. In large event-driven systems, circular loops occur far more frequently than teams realize.

## Observer vs. Publish-Subscribe vs. Observables

| Paradigm | Component coupling | Execution boundary | Concrete example |
| :--- | :--- | :--- | :--- |
| **Observer** | Subject holds direct references to observers | Same memory process | `EventTarget`, `EventEmitter` |
| **Pub/Sub** | Publishers and subscribers only know topics/channels | Distributed across processes via brokers | Message queues (RabbitMQ, MQTT, Kafka) |
| **Observable / Streams** | Subscriber receives a reactive stream of values with functional operators | Same memory process | RxJS, WICG Observable API |

The Observable API, proposed within the WICG, landed in Chromium starting with version 135, introducing `EventTarget.when()` to return an Observable stream from DOM events. Cross-browser compatibility should be verified via MDN before deploying into production.

## From in-memory processes to distributed systems

An in-memory `EventEmitter` cannot survive process crashes: if a server restarts during dispatching, in-flight events vanish. When business reactions span multiple independent services, the pattern evolves into **distributed message queuing**, demanding dedicated message brokers, delivery acknowledgments, and idempotent consumers.

Fowler outlines four distinct meanings of event-driven architectures: **Event Notification**, **Event-Carried State Transfer**, **Event Sourcing**, and **CQRS**. It is essential to identify which you are implementing, as their architectural trade-offs diverge dramatically. For multi-service business transactions requiring coordinated compensating rollbacks, the appropriate pattern is the [Saga pattern](/en/blog/saga-pattern).

## When to use and when to avoid

Use the Observer pattern when:

- Multiple independent subsystems must react to a single factual event;
- The publishing subject should have zero dependency on downstream consumers;
- The relative execution order among observers has no business consequence.

Avoid the Observer pattern when:

- There is a strict, mandatory sequence of operational steps;
- The publisher requires the return value of the consumer to proceed;
- There is only one solitary consumer (a direct function call is cleaner and easier to trace).

## References

This article is a study based on the sources below. Passages marked as opinion reflect my own reading.

- Erich Gamma, Richard Helm, Ralph Johnson, and John Vlissides. *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley, 1994.
- Refactoring.Guru. [Observer](https://refactoring.guru/design-patterns/observer).
- MDN Web Docs. [EventTarget.addEventListener()](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener).
- MDN Web Docs. [Observable](https://developer.mozilla.org/en-US/docs/Web/API/Observable).
- Node.js. [Events](https://nodejs.org/api/events.html).
- Martin Fowler. [What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html) (February 2017).
