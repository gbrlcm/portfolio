---
title: "System Scalability: Lessons from Figma, Notion, and Discord"
description: "Vertical vs. horizontal scaling, caching, queues, read replicas, and sharding explained through case studies from Figma, Notion, and Discord."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/escalabilidade-de-sistemas.webp"
coverAlt: "Illustration comparing a large server, vertical scaling, with a grid of smaller servers, horizontal scaling, with one highlighted in yellow"
category: "Software Architecture"
tags:
  - "Scalability"
  - "Architecture"
  - "Databases"
  - "Backend"
draft: false
lang: "en"
translationKey: "system-scalability"
---

Scalability is the capability of a software system to handle increasing load proportionally as additional hardware resources are supplied, without requiring architectural rewrites. It is fundamentally distinct from raw single-request performance: an application can respond in 15 milliseconds for an isolated developer on localhost, yet collapse into cascading timeouts under a concurrent load of a thousand active users.

Fortunately, modern engineering blogs provide transparent, production-tested blueprints of how industry-leading teams overcame severe scale bottlenecks. In this article, I structure the primary scaling strategies in the progressive sequence they should be evaluated, drawing directly on technical retrospectives published by Figma, Notion, and Discord.

## Before you scale: measure and profile

Attempting to scale an infrastructure stack without telemetry profiling is merely spending capital in the wrong places. The bare minimum observational baseline:

- **Latency distributions across percentiles** (p50, p95, p99), rather than misleading arithmetic averages.
- **Throughput metrics:** incoming requests, transactions, or asynchronous tasks processed per second.
- **Resource saturation:** CPU core usage, memory pressure, database connection pool exhaustion, and message queue backlogs.
- **Error rates across boundary layers.**

With this telemetry, engineers can identify the true primary bottleneck. Frequently, the culprit is merely a missing database index or an ORM N+1 query loop, both of which are resolved in application code without touching system architecture.

It is also vital to internalize Amdahl's Law: the sequential, unparallelizable portion of a computing task strictly bounds the theoretical speedup gained by adding concurrent workers. If every user transaction contends for an identical serial bottleneck (a global table row lock, an unindexed hot table, a singleton coordinator), spinning up additional container instances achieves nothing.

## 1. Vertical scaling: legitimate and underrated

Vertical scaling means upgrading the existing physical host or virtual machine with more CPU cores, faster RAM, and higher IOPS disk storage. It requires zero application code changes and is almost always the correct first engineering step.

Figma serves as a prime case study. According to an architectural retrospective published by their database team in March 2024, their primary datastore expanded nearly 100-fold between 2020 and 2024. The team began scaling simply by upgrading a single primary PostgreSQL database onto the largest available AWS EC2 instance type. Only after exhausting vertical headroom did they invest engineering cycles into distributed complexity.

The ceiling of vertical scaling is both hardware-bound and financial: eventually, larger instance types do not exist, or their cost scales exponentially. Until that threshold is reached, vertical scaling buys engineering teams valuable months to plan subsequent architectural phases without emergency firefighting.

## 2. Stateless application layers and horizontal scaling

Horizontal scaling means provisioning additional application runtime instances behind a load balancer. For this model to scale linearly, application processes must be strictly **stateless**: zero session state stored in local memory and zero uploads saved to local instance disks.

The *Twelve-Factor App* methodology crystallizes this requirement: scale is achieved by launching independent runtime processes, and share-nothing process models make scaling concurrency simple and reliable.

In production:

- Session tokens reside in centralized shared datastores (Redis, Memcached) or cryptographically signed client-side cookies;
- File uploads stream directly to distributed object storage (such as Amazon S3);
- Environment configurations are injected via environment variables;
- Any incoming HTTP request can be served interchangeably by any running instance.

## 3. Caching: the cheapest throughput win (and subtlest bugs)

Caching relieves query pressure on underlying datastores. The ubiquitous standard pattern is **cache-aside**: the application queries the cache; upon a cache miss, it fetches from the primary database, populates the cache with a Time-To-Live (TTL), and returns the payload.

A classic production hazard of cache-aside is the cache stampede: when a heavily accessed key expires, hundreds of concurrent requests simultaneously miss the cache and overwhelm the primary database with identical queries. Discord documented an elegant solution in their architecture post on storing trillions of messages: their data proxy layer implements **request coalescing**. If multiple inbound requests query the same database row concurrently, the proxy executes a single query against the database and broadcasts the result to all awaiting clients.

A TypeScript implementation of cache-aside featuring request coalescing:

```typescript
type Loader<T> = () => Promise<T>;

const cache = new Map<string, { value: unknown; expiresAt: number }>();
const inFlight = new Map<string, Promise<unknown>>();

export async function cached<T>(key: string, ttlMs: number, load: Loader<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T;
  }

  // If a request is already in flight for this key, reuse it.
  const pending = inFlight.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const promise = load()
    .then((value) => {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, promise);
  return promise;
}
```

In Go, the standard library sub-repository provides `golang.org/x/sync/singleflight`, which implements this exact coalescing pattern (discussed further in [Go for backend development](/en/blog/go-for-backend)). In multi-node production topologies, local memory caches transition to distributed clusters (Redis, Dragonfly), but the coalescing and invalidation principles remain identical.

Essential caching operational trade-offs: tuning realistic TTL expirations, engineering robust cache invalidation strategies, and accepting that clients will occasionally read stale data during the TTL window.

## 4. Message queues and asynchronous processing

Not every user-initiated task belongs within the synchronous request-response lifecycle. Sending transactional emails, generating PDF invoices, emitting tax receipts, and refreshing analytical rollups can all be offloaded to message queues and processed by worker pools.

Engineering benefits:

- Immediate reduction in user-facing HTTP request latencies;
- Inbound traffic spikes are absorbed by queue buffers rather than crashing database connection pools;
- Background worker fleets scale horizontally and independently of web tiers;
- Transient failures in third-party APIs convert into managed retries rather than hard user errors.

A strict architectural prerequisite: message consumers must be **idempotent**. Because virtually all distributed message brokers (RabbitMQ, SQS, Kafka) enforce at-least-once delivery guarantees, duplicate message deliveries must be safely handled.

## 5. The database tier: from indexes to distributed sharding

The database is almost invariably the final, hardest scaling bottleneck, because it is the stateful layer of the application. Strategies, ordered from simplest to most operationally complex:

### Query profiling and index tuning

Before altering infrastructure, execute `EXPLAIN (ANALYZE, BUFFERS)` against your slowest, most frequent queries. Eliminating sequential scans by adding targeted multi-column indexes is the single highest-ROI performance optimization in software engineering.

### Read replicas

If an application's workload is heavily read-dominated, read replicas offload read query volume from the primary write node. The trade-off is **replication lag**: immediately after a write commits to the primary, read replicas may not have caught up with the change. User queries demanding read-your-own-writes guarantees ("I just updated my profile, show it to me") must be routed to the primary node.

### Vertical partitioning

Vertical partitioning splits tables across distinct physical database clusters based on domain boundaries. By late 2022, Figma was operating roughly a dozen vertically partitioned PostgreSQL clusters (e.g., file metadata in one cluster, user organizations in another). Their team described this as an accessible, high-leverage architectural intervention. The physical limitation: you cannot vertically partition a single monolithic table, and several core Figma tables had already expanded to billions of rows and multiple terabytes.

### Horizontal database sharding

Horizontal sharding partitions the rows of a single table across multiple physical database instances according to a deterministic sharding key. It is the most powerful database scaling technique, and by far the most operationally demanding to maintain. Two public case studies illuminate the trade-offs:

**Notion (2021):** With a single PostgreSQL primary nearing saturation, Notion partitioned their data into **480 logical shards distributed across 32 physical PostgreSQL databases**, using the **workspace ID** as their sharding key. This key choice was effective because all page blocks belong to a single workspace and users predominantly query one workspace at a time, preventing cross-shard joins. The number 480 was selected because it has numerous divisors, simplifying future physical rebalancing. The migration leveraged dual-writing, backfilling, and automated verification comparing query results across the legacy cluster and new shards. The team noted two retrospective lessons: they waited slightly too long to begin, and yet premature sharding can easily freeze product data models before they mature.

**Figma (2023–2024):** The team evaluated distributed SQL engines (CockroachDB, TiDB, Google Cloud Spanner, Vitess), but ultimately chose to implement application-level sharding over their existing PostgreSQL infrastructure with a deliberately restricted feature set (e.g., dropping cross-shard distributed transactions). Related tables sharing the same sharding key were grouped into "colos" to preserve relational joins and ACID transactions within a key boundary. A custom Go proxy service, DBProxy, routes inbound SQL queries dynamically. Figma executed the migration in two sequential phases: first **logical sharding** (queries were routed through DBProxy as if partitioned, but hitting a single physical cluster, validated with a reversible feature flag), followed by **physical sharding** onto distinct database hardware. Migrating their first major table took roughly nine months.

### The danger of hot partitions

Sharding does not magically eliminate scaling bottlenecks. Discord documented severe **hot partition** bottlenecks on their initial Apache Cassandra cluster: when a popular channel received massive bursts of messages within a tight time interval, node latencies spiked, degrading the entire cluster. Following their migration to ScyllaDB fronted by an intermediate Rust data service, Discord reported p99 read latencies for historical messages plummeting from 40–125 ms down to ~15 ms, while compacting their database cluster from 177 Cassandra nodes to 72 ScyllaDB instances.

The critical lesson for sharding keys: distribute write traffic evenly across nodes, not merely storage volume. Figma, for instance, hashes their sharding keys within DBProxy, because monotonically incrementing IDs or timestamp prefixes inevitably concentrate writes into a single hot shard.

## A pragmatic progression for scaling systems

A recommended progression, ordered by increasing complexity and operational risk:

1. Measure baseline percentiles to locate the true bottleneck.
2. Optimize SQL queries, add missing indexes, and eliminate N+1 loops.
3. Scale the primary database vertically.
4. Make application tiers stateless and scale horizontally behind a load balancer.
5. Introduce in-memory caching for read-heavy query paths.
6. Offload slow or long-running work to message queues and workers.
7. Add database read replicas.
8. Vertically partition tables by domain boundaries.
9. Implement horizontal database sharding, backed by dual-writing, verification, and rollback plans.

Skipping steps is not inherently wrong, but every leap should be justified by empirical performance metrics. If your next architectural step involves decomposing into independent services, review [when microservices make sense](/en/blog/microservices-when-they-make-sense) and the [practical system design roadmap](/en/blog/system-design-practical-roadmap).

## References

This article is a study based on the sources below. Passages marked as opinion reflect my own reading.

- Sammy Steele, Figma. [How Figma's databases team lived to tell the scale](https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/) (March 2024).
- Garrett Fidalgo, Notion. [Herding elephants: lessons learned from sharding Postgres at Notion](https://www.notion.com/blog/sharding-postgres-at-notion) (October 2021).
- Bo Ingram, Discord. [How Discord Stores Trillions of Messages](https://discord.com/blog/how-discord-stores-trillions-of-messages) (March 2023).
- Adam Wiggins. [The Twelve-Factor App: Concurrency](https://12factor.net/concurrency).
- Donne Martin. [The System Design Primer](https://github.com/donnemartin/system-design-primer).
