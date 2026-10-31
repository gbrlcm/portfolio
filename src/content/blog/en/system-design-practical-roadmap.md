---
title: "Practical System Design: A Roadmap Before Writing Code"
description: "A pragmatic system design roadmap for production software: requirements, back-of-the-envelope math, architecture, data modeling, bottlenecks, and trade-offs."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/system-design-roteiro-pratico.webp"
coverAlt: "Illustrative system architecture diagram with client, load balancer, three application instances, a relational database, and a cache highlighted in yellow"
category: "Software Architecture"
tags:
  - "System Design"
  - "Architecture"
  - "Distributed Systems"
  - "Backend"
draft: false
lang: "en"
translationKey: "system-design-practical-roadmap"
---

System design is widely recognized as a grueling interview round at major technology companies, but its true value belongs in daily engineering: it is the disciplined thinking process where you decide, before writing a single line of application code, how a software system will fulfill demands for throughput, latency, availability, and infrastructure cost. Architectural decisions made without this preliminary exercise almost inevitably resurface later as production outages.

This article provides a pragmatic system design roadmap grounded in reference literature: the *System Design Primer*, Google's Site Reliability Engineering (SRE) book, Martin Kleppmann's *Designing Data-Intensive Applications*, and the AWS Well-Architected Framework.

## What system design actually is

System design is the structured process of defining components, data architectures, network interfaces, and operational workflows to satisfy both functional requirements (what the software accomplishes) and non-functional requirements (how it behaves under high concurrency, infrastructure degradation, and multi-year data growth). The end deliverable is never merely a decorative box-and-arrow diagram: it is a documented set of justified technical decisions and consciously accepted architectural trade-offs.

## Step 1: Requirements before components

The single most common engineering failure is starting with architecture diagrams. Always begin with requirements gathering:

- **Who uses the system and for what core workflows?** What are the top three or four mission-critical user journeys?
- **What is the expected volume?** Daily active users (DAU), peak requests per second (RPS), read-to-write ratio, and projected annual growth.
- **What latency is tolerable?** Measured at what specific statistical percentile?
- **What level of availability is mandatory?** What is the financial and operational consequence to the business if the service goes dark for one hour?
- **What consistency model is required?** A financial ledger balance and a social media like counter demand completely different data consistency semantics.
- **What are the hard constraints?** Infrastructure budget, team size, delivery timelines, legacy systems, and regulatory compliance.

Google's SRE book establishes an indispensable operational vocabulary for non-functional requirements:

- **SLI** (Service Level Indicator): a carefully defined quantitative metric evaluating an aspect of service behavior, such as latency or error rate.
- **SLO** (Service Level Objective): a target value or range of values specifying acceptable performance for an SLI.
- **SLA** (Service Level Agreement): a contractual commitment made to end users specifying explicit remedies if SLOs are breached.

Two foundational guidelines from SRE literature applicable to every software project: prioritize **percentiles** over arithmetic averages (the p99 tail latency reveals realistic worst-case user experiences that averages mask) and **never calibrate target SLOs purely from current system performance**, as this traps teams into heroic manual operational efforts to sustain arbitrary numbers.

## Step 2: Back-of-the-envelope calculations

Rough napkin math prevents two opposing architectural mistakes: over-engineering a modest service with distributed sharding, and under-engineering a system bound for immediate saturation. An illustrative calculation using **hypothetical figures**:

```text
Daily active users:                 200,000
Requests per user per day:          20
Total requests per day:             4,000,000 requests
Average per second:                 4,000,000 / 86,400 ≈ 46 req/s
Peak (assuming 5x average):         ≈ 230 req/s

New records per day:                500,000
Average record size:                1 KB
Annual storage growth:              500,000 × 1 KB × 365 ≈ 183 GB
```

Armed with these numbers, architectural conversations change completely. A peak write load of roughly 230 requests per second, depending on transactional complexity, is a load that a single well-indexed relational database and a small cluster of application containers can handle comfortably. It is not an operational profile that inherently justifies distributed sharding or a sprawling mesh of microservices.

It is equally essential to develop intuition regarding the relative latency orders of magnitude across physical hardware. Peter Norvig's classic latency numbers remain a vital conceptual compass, even as absolute hardware speeds have increased:

| Operation | Approximate latency |
| :--- | :--- |
| Read from main memory (RAM) | 100 ns |
| Send 2 KB over 1 Gbps network | 20,000 ns (20 µs) |
| Read 1 MB sequentially from RAM | 250,000 ns (250 µs) |
| Disk seek on spinning mechanical drive | 8,000,000 ns (8 ms) |
| Round-trip network packet from US to Europe | 150,000,000 ns (150 ms) |

The engineering takeaway: physical disks and network hops are orders of magnitude slower than in-memory operations, and transcontinental network round-trips carry unavoidable physical latencies. Every distributed network hop placed into a synchronous user request path incurs an explicit performance cost.

## Step 3: High-level architectural design

With quantitative requirements and throughput constraints in hand, map the core architectural components and their data flows. For most web platforms, the baseline reference topology looks like this:

```text
Client
  │
  ▼
CDN (static assets)
  │
  ▼
Load balancer
  │
  ▼
Stateless application (N instances) ──► Cache (e.g., Redis)
  │                     │
  │                     └──► Queue ──► Workers (asynchronous jobs)
  ▼
Relational database (primary + read replicas)
```

Every box in this topology must be justified by an explicit requirement. If there are no long-running asynchronous workflows, message queues do not belong in the initial design. If read volume is modest, read replicas can be deferred.

## Step 4: Data modeling and API design

Data models must be derived directly from **access patterns**: which specific queries does the application execute most frequently, with which filter criteria, and at what concurrency? Recommended guidelines during this design phase:

- **Relational databases as the default.** Relational engines deliver ACID transactions, referential integrity, and flexible query capabilities. Deviate toward specialized NoSQL stores only when driven by proven constraints, not trend chasing.
- **Index for actual queries**, verifying execution plans via `EXPLAIN`, rather than blindly indexing every column.
- **Idempotent APIs on mutating endpoints.** Passing an idempotency key prevents duplicate financial charges or duplicated order entries when network drops prompt client retries.

```http
POST /payments
Idempotency-Key: 6f1c2a9e-4b7d-4f3a-9c1e-2d8b5a7e0f13
Content-Type: application/json

{ "orderId": "ord_123", "amount": 15990 }
```

## Step 5: Identifying bottlenecks and scaling paths

The *System Design Primer* provides a diagnostic rule of thumb:

- If a software system is sluggish for **a single isolated user**, you have a **performance** defect.
- If the system responds rapidly for one user but degrades severely **under concurrent load**, you have a **scalability** defect.

Their remedies are distinct. Performance issues are addressed by profiling CPU bottlenecks, optimizing slow SQL queries, and eliminating redundant work per request. Scalability challenges require in-memory caching layers, asynchronous background job workers, database read replicas, and horizontal partitioning. I examine these techniques, accompanied by production post-mortems from Figma, Notion, and Discord, in the guide on [system scalability](/en/blog/system-scalability).

## Step 6: Explicit trade-off analysis

Every architectural design represents a collection of deliberate trade-offs. The most prevalent include:

- **Latency versus throughput.** Latency measures the round-trip duration to execute a single task; throughput measures the volume of tasks executed per unit of time. Micro-batching writes dramatically improves database throughput, but increases the latency of individual requests.
- **Consistency versus availability.** In distributed systems across network boundaries, partitions will eventually occur. When they do, the architecture must choose between returning potentially stale reads (favoring availability) or rejecting/delaying requests until data consensus is guaranteed (favoring consistency). This is the practical essence of the CAP theorem.
- **Simplicity versus operational flexibility.** Every new infrastructural component added to the architecture is an additional failure mode requiring monitoring, patching, and cognitive overhead during midnight incidents.

When a platform decomposes into distributed microservices backed by independent datastores, cross-boundary consistency becomes a major challenge. The [Saga pattern](/en/blog/saga-pattern) provides one solution, while the article on [when microservices make sense](/en/blog/microservices-when-they-make-sense) examines whether such distributed decoupling is warranted in the first place.

## Step 7: Documenting architectural decisions

Forgotten architectural decisions are needlessly reopened whenever new engineers join the organization. The Architecture Decision Record (ADR) format, introduced by Michael Nygard in 2011, solves this via lightweight version-controlled text files:

```markdown
# ADR 004: Use PostgreSQL as primary database

## Status
Accepted

## Context
The system requires ACID transactions between orders and payments, as well
as flexible filtered queries. Estimated peak write load is ~230 req/s.

## Decision
Use managed PostgreSQL with one read replica.

## Consequences
Strong consistency across order workflows. Database sharding is deferred
out of scope until estimated volume is revised.
```

## Final review against the Well-Architected Framework

Before declaring a system design complete, evaluate it against the six pillars of the AWS Well-Architected Framework as an objective checklist, regardless of your cloud provider: **Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, and Sustainability**. If an architectural review has not discussed a particular pillar, there is almost certainly an unmitigated operational risk lurking beneath the surface.

## References

This article is a study based on the sources below. Passages marked as opinion reflect my own reading.

- Donne Martin. [The System Design Primer](https://github.com/donnemartin/system-design-primer).
- Google. [Site Reliability Engineering, "Service Level Objectives" chapter](https://sre.google/sre-book/service-level-objectives/).
- Martin Kleppmann and Chris Riccomini. *Designing Data-Intensive Applications*, 2nd Edition. O'Reilly, 2026. [Author announcement](https://martin.kleppmann.com/2026/03/24/designing-data-intensive-applications-2e.html).
- AWS. [The pillars of the Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html).
- Peter Norvig. [Teach Yourself Programming in Ten Years](https://norvig.com/21-days.html) (approximate timing latency numbers).
- Michael Nygard. [Documenting Architecture Decisions](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions) (2011).
