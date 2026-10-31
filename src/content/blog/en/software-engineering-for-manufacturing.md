---
title: "Software Engineering for Manufacturing: Architectural Guide"
description: "Why industrial software is not a web app: determinism, operational uptime, event-driven architectures, store-and-forward, observability, mock testing, and CI/CD."
pubDate: 2026-10-31T12:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/engenharia-de-software-para-manufatura.webp"
coverAlt: "Illustration of a modular monolith with six bounded modules on top of a PostgreSQL database with an edge buffer"
category: "Industrial Automation"
tags:
  - "Software Engineering"
  - "Industrial Software"
  - "Software Architecture"
  - "Manufacturing"
  - "Distributed Systems"
  - "Industrial Automation Series"
draft: false
lang: "en"
translationKey: "software-engineering-for-manufacturing"
---

Developers building web applications are conditioned to treat software failure as an isolated exception: if a microservice crashes, the browser retries the HTTP request. In manufacturing, failure carries entirely different stakes. An MES crash mid-shift is not a minor user inconvenience; it means a factory line running blind with unrecorded production, batches lacking regulatory traceability, and operators frantically logging numbers on clipboards. An erroneous command dispatched to a controller can result in catastrophic physical damage.

This is the seventh article in the series and the most focused on software developers. It examines how foundational software engineering principles must be adapted to industrial environments. Much of what follows represents architectural choices and therefore substantiated engineering opinion; I mark it explicitly when appropriate.

## Why industrial software is not a standard web application

The non-negotiable requirements that reshape industrial system architecture:

**Operational uptime and process continuity.** The software system must remain valuable even when parts of the computing infrastructure drop offline. This requires formalizing a **degraded mode** for every service: How does the production line operate if the MES database becomes unreachable? What happens if the plant floor network drops its WAN connection to the data center? "Restart and refresh" is not an acceptable architectural answer.

**Determinism and temporal constraints.** In industrial machine control, correctness depends on *when* an action occurs, not merely *what* logic executes. Engineering literature distinguishes three temporal tiers:

- **Hard real-time:** missing an execution deadline constitutes total system failure (multi-axis motion control, safety interlocks). This is strictly the domain of dedicated embedded silicon and PLCs, never general-purpose enterprise application software.
- **Soft real-time:** missing a deadline degrades quality of service without rendering the system invalid.
- **Monitoring and operations management:** lacking hard real-time deadlines; correctness, message ordering, and data completeness are paramount. This is the domain of MES, data historians, and operational reporting.

ISA-95 Level 3 and Level 4 software (MES, enterprise integration, analytics) almost exclusively inhabits the latter two categories. Conflating these tiers is a recurring disaster: placing millisecond closed-loop machine control inside an enterprise server, or applying rigid controller-level hard real-time patterns to an operational shift reporting database. Notably, the Linux kernel formally merged the PREEMPT_RT patch into mainline Linux in release 6.12 (2024), improving deterministic latency boundaries on commodity hardware; however, this does not turn a standard web backend into a certified hard real-time safety system.

**Physical process safety.** Industrial software directly commands equipment that can injure workers or destroy tooling. Safety-instrumented systems (SIS) are governed by strict functional safety standards (IEC 61508 / ISO 13849), require certified safety hardware, and **must never** be implemented in standard business application software.

**Immutable traceability and auditability.** In regulated manufacturing (pharmaceuticals, medical devices, automotive), systems must record who executed each action, when, against which master recipe version, and on what software release. This profoundly impacts data modeling (append-only event sourcing instead of in-place mutation) and change management.

**Extended lifecycles and brownfield heterogeneity.** Thirty-year-old machine tools operate alongside modern containerized microservices. Greenfield software must adapt to legacy automation, not the other way around.

## Monoliths, microservices, and modular architecture

Microservices are rarely the right starting architecture for plant-floor systems. Martin Fowler introduced the concept of the "microservice premium": the substantial operational and infrastructural overhead required to manage a distributed network of services, which slows teams down and only pays off once system scale outgrows a single deployment artifact. He notes that the vast majority of successful distributed platforms began as monolithic applications that were decoupled later, recommending clean internal modularity before physically partitioning services. This blog covers the broader trade-offs in [when microservices make sense](/en/blog/microservices-when-they-make-sense).

In industrial plants, this distributed overhead is magnified:

- **More distributed moving parts mean more points of failure** in environments where unplanned downtime carries extreme financial costs.
- **Complex operational maintenance** where local plant IT staff is limited and remote SSH/VPN access is restricted by OT security policies.
- **Distributed data consistency** in a domain demanding strict transactional traceability; this requires distributed coordination patterns like [Saga](/en/blog/saga-pattern) and transactional outbox tables.

In my view, the most pragmatic starting point for an MES or plant integration platform is a **modular monolith**: a single deployable application artifact containing well-encapsulated internal modules with explicit public interfaces (orders, production reporting, lot genealogy, equipment tracking, ERP integration), backed by a single transactional database, coupled with dedicated standalone edge adapters for machine communications. Splitting this into distributed microservices should be driven by empirical operational evidence (differing scaling curves, isolated organizational teams, security isolation), rather than architectural dogma. This is a recommendation, not an immutable law.

## Event-driven architecture and message queuing

The industrial domain is inherently event-driven: a proximity sensor counts a part, a conveyor motor trips on overload, a quality lab releases a lot, the ERP dispatches a work order. Modeling industrial software around events provides concrete benefits:

- **Temporal decoupling.** Telemetry publishers (edge gateways, PLCs) do not block waiting for enterprise consumers.
- **Event replayability.** An append-only event log allows rehydrating state and recalculating historical KPIs retroactively.
- **Audit trails.** The raw event stream forms an immutable historical ledger of physical manufacturing reality.

The operational trade-offs are significant: event ordering challenges, message duplication (at-least-once delivery is the default across industrial message brokers, such as MQTT QoS 1), eventual consistency, and complex distributed tracing. These necessitate **idempotent consumer design**: processing the exact same event multiple times must yield the identical state as processing it once, typically enforced via composite natural keys. To explore decoupled subscription patterns, see the [observer pattern](/en/blog/observer-pattern).

Message queues also act as essential shock absorbers: when an entire shift's worth of buffered telemetry floods in simultaneously after a network outage, queues smooth the ingestion spike, protecting the MES from denial-of-service degradation.

### The store-and-forward pattern at the edge

A foundational pattern in manufacturing integration is **store-and-forward**: the edge adapter durably persists every telemetry event to a local disk queue before attempting network transmission, removing or marking events as sent only upon receiving consumer acknowledgment. Commercial gateways provide this capability; Rockwell's FactoryTalk Edge Gateway documentation describes a local FIFO buffer with size limits where the oldest unconfirmed telemetry is dropped once the buffer saturates during prolonged disconnections. Sizing this buffer is an explicit architectural trade-off: exactly how many hours of plant floor network downtime must the system survive without losing data?

A minimal implementation in Python leveraging SQLite illustrating this outbox pattern (tested locally against an emulated network consumer):

```python
import json, sqlite3, time

class Outbox:
    def __init__(self, path=":memory:"):
        self.db = sqlite3.connect(path)
        self.db.execute("""CREATE TABLE IF NOT EXISTS outbox (
            event_id TEXT PRIMARY KEY,           -- idempotency key
            payload  TEXT NOT NULL,
            created_at REAL NOT NULL,
            sent_at REAL)""")

    def add(self, event_id, payload):
        self.db.execute("INSERT OR IGNORE INTO outbox (event_id, payload, created_at) "
                        "VALUES (?,?,?)", (event_id, json.dumps(payload), time.time()))
        self.db.commit()

    def flush(self, send, batch=100):
        rows = self.db.execute("SELECT event_id, payload FROM outbox WHERE sent_at IS NULL "
                               "ORDER BY created_at LIMIT ?", (batch,)).fetchall()
        for event_id, payload in rows:
            try:
                send(event_id, json.loads(payload))
            except Exception:
                break                              # retry on the next execution pass
            self.db.execute("UPDATE outbox SET sent_at=? WHERE event_id=?",
                            (time.time(), event_id))
            self.db.commit()
```

During testing, three telemetry events were buffered while the target consumer threw connection errors; duplicate insertions sharing the same `event_id` were safely ignored by the SQLite primary key; once connectivity was restored, all three arrived at the consumer, leaving zero pending records. A production implementation requires: TTL retention policies, dead-letter queues for permanently malformed payloads, pipeline metrics, and ensuring the receiving backend endpoint is equally idempotent.

## REST APIs versus industrial protocols

REST APIs over HTTPS are well suited for enterprise integration between Level 3 and Level 4 systems (connecting an MES with corporate ERP, reporting portals, or web dashboards). They are **not** suited for direct machine control or fieldbus polling: that communication requires purpose-built industrial protocols (OPC UA, Modbus TCP, deterministic Ethernet fieldbuses), as covered in [article 06](/en/blog/industrial-protocols-opc-ua-modbus-mqtt). Bridging these worlds cleanly requires an **edge equipment adapter** running on the shop floor, translating industrial fieldbus tags into semantic domain events and exposing a clean, stable interface to upper-tier systems.

Two best practices for enterprise APIs: enforce explicit schema versioning (ERP integrations frequently remain in production for a decade) and design all mutating endpoints to be idempotent and re-entrant, relying on client-generated UUIDs.

## Data persistence architectures

Industrial manufacturing demands at least two distinct data storage paradigms:

- **Transactional / business state:** work orders, lots, component genealogy, shift yields, quality holds. Relational databases (PostgreSQL, SQL Server, Oracle) delivering ACID transaction semantics, foreign key constraints, and audit logging. For a refresher on atomic transactions, see [ACID in databases](/en/blog/acid-in-databases).
- **Process telemetry / time series:** high-frequency analog process variables. Industrial data historians or specialized time-series databases offering lossy/lossless compression, retention policies, and time-bucket aggregations. Article 08 explores these systems.

I strongly recommend keeping these two data tiers structurally decoupled, even if hosted within the same database engine (e.g., vanilla PostgreSQL for business tables alongside a TimescaleDB extension for telemetry), because write ingestion velocities, retention horizons, and query shapes diverge completely.

## Observability, logging, and audit trails

In industrial environments, observability operates under unique constraints: segmented firewalled networks, limited remote troubleshooting access, and plant operations teams who are process engineers rather than Linux sysadmins. Practical guidelines:

- **Structured logging** (JSON format with explicit `order_id`, `lot_id`, and `machine_code` context), avoiding unstructured plaintext.
- **Actionable operational metrics**: queue lengths, oldest unconsumed event age, ingestion lag, edge gateway disconnect counts, and controller timeout rates.
- **Distributed tracing** across cross-system workflows. OpenTelemetry (a CNCF project) standardizes logs, metrics, and traces, though adoption depends on what local plant networks permit.
- **Strictly separate debug logs from regulatory audit trails.** Debug logs assist software troubleshooting and can be rotated aggressively; regulatory audit trails record compliance-critical actions (recipe modifications, manual lot status overrides) and must be immutable, tamper-evident, and retained according to statutory requirements.
- **Alert on actionable failure states.** "Gateway ingestion buffer growing continuously for 10 minutes" is an actionable alert; "HTTP 500 error logged" is unhelpful noise.

## Testing and machine simulation

You cannot test industrial software by running experimental builds against live factory machinery. A comprehensive testing strategy relies on:

1. **Domain unit tests** verifying business calculation rules (OEE mathematics, order state machines, batch genealogy graphs).
2. **Hardware emulators**: mock Modbus TCP or OPC UA servers that emit simulated telemetry streams, including failure modes (timeouts, out-of-range sensor readings, out-of-order packets). This was the exact harness used to validate the examples in article 06: a local simulated Modbus server, an MQTT broker, and an ingestion client.
3. **Integration tests using test doubles** for external enterprise endpoints (mock ERP webhooks).
4. **Chaos and resilience tests**: cutting network interfaces, simulating database restarts, killing services during batch commits, and verifying that zero messages are lost or double-counted.
5. **Staging commissioning** on dedicated factory FAT (Factory Acceptance Test) testbeds or benchtop hardware-in-the-loop (HIL) setups before releasing code to production.

In my view, the single highest-ROI test in industrial integration is **duplicate and out-of-order message stress testing**: if your software cleanly absorbs every telemetry message arriving twice and in reverse chronological sequence, it will withstand 90% of real-world plant network anomalies.

## Version control and CI/CD in manufacturing

The rapid continuous delivery flow common in web startups (deploying to production multiple times per day) cannot be directly transposed to manufacturing lines. Industrial updates require formal change management, planned maintenance shutdowns, and, in regulated facilities, formal qualification (IQ/OQ/PQ). What translates effectively:

- **Version control for everything**: application source code, configuration files, database migrations, recipe definitions, and, where possible, textual exports of PLC logic projects (IEC 61131-10 XML format, discussed in [article 02](/en/blog/plc-industrial-programming-languages)).
- **Automated build and test pipelines**, even if final production deployments require manual sign-off by plant managers.
- **Strict environment isolation** (development, staging/FAT, live plant production) with immutable, versioned container artifacts.
- **Tested rollback procedures**: automated database schema rollbacks and backwards-compatible data migrations.
- **Secure development lifecycle practices**: the IEC 62443-4-1 (2018) standard defines security lifecycle requirements for industrial automation products, covering secure design, coding guidelines, vulnerability handling, and patch management. It applies to software development organizations engineering industrial products.

Because many manufacturing plants operate on air-gapped or restricted networks, deployment pipelines are frequently divided: building and automated testing occur in cloud/enterprise environments, with versioned immutable artifacts transferred into plant networks via strictly audited channels.

## High availability and disaster recovery

The architectural patterns are well established (database streaming replication, clustered instances behind reverse proxies, automated failover), but technical choices must stem from operational business requirements:

- What are the documented **RTO** (how long can the system remain down?) and **RPO** (how many minutes of telemetry loss are tolerable?) targets?
- Exactly what manual procedures do operators follow when the software is offline, and how is production reconciled upon recovery?
- Is high availability deployed locally on-site or in the cloud? Relying on cloud availability to run active machine packaging lines introduces WAN connectivity as a single point of operational failure.

Redundancy that has never been tested in an unannounced drill is merely theoretical. In industrial automation, failover drills must be rehearsed during scheduled maintenance turnarounds.

## Managing brownfield legacy systems

Legacy hardware is the permanent reality of industrial plants. Resilient integration strategies:

- **Anti-corruption layer (ACL / Adapter pattern):** legacy controllers speak their native register layouts; a dedicated edge adapter isolates this dialect, translating it into canonical domain events. Upstream changes to the legacy PLC remain contained within the adapter.
- **Hardware protocol gateways:** serial RS-485 Modbus RTU instruments can be connected to Ethernet IP networks via industrial converter gateways without touching controller firmware.
- **Incremental strangler migration:** replace legacy software features piece by piece, routing traffic through facades until feature parity is reached. This blog's article on [legacy system modernization](/en/blog/legacy-system-modernization) explores this strategy in depth.
- **Reverse engineering and documentation:** map and document unrecorded PLC register tables, undocumented machine quirks, and tribal operational knowledge before attempting any refactoring.

## Reference architecture

The diagram below is **illustrative and represents one sound approach, rather than a dogmatic standard**. It synthesizes these design principles for a mid-sized industrial manufacturing deployment:

<figure>
  <img src="/images/blog/engenharia-de-software-para-manufatura-diagrama.webp" alt="Diagram showing three blocks: shop floor, edge layer (adapters, normalization, local store-and-forward buffer), and core layer (modular monolith with PostgreSQL, time-series store, and message queue), connected to ERP and operator HMIs." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Illustrative reference architecture for industrial manufacturing software. Diagram by the author.</figcaption>
</figure>

Architectural focal points in this design: the edge buffer isolates shop floor machines from core server downtime; modular monolith services share a transactional database but communicate via clean internal interfaces; process time series are isolated from business transactions; and the corporate ERP is treated as an external system bounded by versioned, idempotent contracts.

## Technology stack selection

Technology choices align with operational roles and temporal tiers. The following overview reflects established industry practice:

- **C and C++:** firmware, fieldbus communication stacks, real-time drivers, and sub-millisecond motion control routines; dominant in embedded hardware and vendor software suites.
- **C# (.NET) and Java:** enterprise MES platforms, shop floor integrations, and industrial middleware; rich ecosystems of OPC UA companion libraries and robust database drivers.
- **Python:** edge integration scripts, analytical modeling, machine learning inference, testing harnesses, and protocol mocks; less suited for deterministic low-latency execution loops.
- **JavaScript/TypeScript:** operator station web UIs, responsive plant floor dashboards, and workflow tools.
- **SQL:** the foundational language for manufacturing business state, inventory reconciliation, and product genealogy; the operational domain is deeply relational.
- **IEC 61131-3 languages (Ladder, ST, FBD, SFC):** deterministic machine control inside the physical PLC, never on enterprise application servers.

Each technology corresponds to a distinct temporal scale and risk profile; production facilities leverage a deliberate combination of several.

## Conclusion

Industrial software engineering is simply software engineering conducted under uncompromising constraints: operational uptime, deterministic timing, immutable traceability, and physical safety. These constraints dictate prudent engineering choices: modular architectures before distributed microservices, event-driven designs with strict idempotency, store-and-forward edge buffering, structural segregation of business state from analog telemetry, simulation-driven testing, and delivery workflows aligned with plant maintenance turnarounds. The remainder is domain knowledge: deeply understanding what each layer of the factory hierarchy is designed to do, ensuring you never demand from a system what it was never engineered to deliver.

## References

This article is a study based on the sources below. Passages marked as opinion, including the recommendation for modular monoliths, the reference architecture, and language categorizations, reflect my own reading. The code snippet was tested locally against an emulated consumer.

- Martin Fowler. [Monolith First](https://www.martinfowler.com/bliki/MonolithFirst.html) and the "microservice premium" discussion ([summary on InfoQ](https://www.infoq.com/news/2015/05/microservices-premium)).
- IEC. [IEC 62443-4-1:2018, Secure product development lifecycle requirements](https://webstore.iec.ch/en/publication/33615). Catalog reference.
- Rockwell Automation. [FactoryTalk Edge Gateway, Add an IoT Edge Runtime application](https://www.rockwellautomation.com/en-us/docs/factorytalk-edge-gateway/1-04-00/ft-edge-gateway-help-ditamap/applications/add-iot-edge-app.html), commercial gateway store-and-forward documentation.
- Phoronix. [Linux 6.12 Features](https://phoronix.com/review/linux-612-features), regarding PREEMPT_RT merge into mainline Linux (secondary source; verify on kernel.org).
- OASIS. [MQTT Version 5.0](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html), regarding QoS delivery mechanics.
- OpenTelemetry (CNCF). [opentelemetry.io](https://opentelemetry.io/). Industry observability reference framework.
- Related blog articles: [microservices](/en/blog/microservices-when-they-make-sense), [Saga pattern](/en/blog/saga-pattern), [ACID in databases](/en/blog/acid-in-databases), [Observer pattern](/en/blog/observer-pattern), [legacy modernization](/en/blog/legacy-system-modernization).
