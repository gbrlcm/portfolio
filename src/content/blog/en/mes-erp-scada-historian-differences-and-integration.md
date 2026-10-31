---
title: "MES, ERP, SCADA, and Historians: Differences and Integration"
description: "A technical comparison of MES, ERP, SCADA, and data historians: inputs, outputs, how they integrate, and what breaks when integration fails."
pubDate: 2026-10-31T11:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/mes-erp-scada-historian-diferencas-e-integracao.webp"
coverAlt: "Illustration with four boxes: ERP, MES, SCADA, and Historian, interconnected by directional arrows"
category: "Industrial Automation"
tags:
  - "MES"
  - "ERP"
  - "SCADA"
  - "Historian"
  - "Industrial System Integration"
  - "Industrial Automation Series"
draft: false
lang: "en"
translationKey: "mes-erp-scada-historian-differences-and-integration"
---

In the first three articles of this series, each system appeared in isolation. In practice, architectural challenges emerge at the interfaces: Who owns the production work order? Who stores yesterday's furnace temperature? Who decides that a batch is quarantined? This article compares **MES, ERP, SCADA, and historians** side by side, explains how they integrate, and highlights what typically goes wrong.

## The four systems in a single sentence

- **ERP:** plans and accounts for business operations (orders, inventory, purchasing, financials). It is the system of record for corporate business data.
- **MES:** executes and logs production against the plan (work orders, lots, production reporting, quality, downtime).
- **SCADA:** supervises and operates the industrial process (HMI screens, alarms, control commands), acquiring data from field controllers.
- **Historian (data historian):** ingests and serves time-series telemetry of process variables, providing compression and time-interval queries.

A word of caution regarding these labels: they represent **functional roles**, not necessarily separate **software products**. A single product suite may package SCADA and a historian together; an MES may embed shop floor data collection; an ERP might include a basic plant floor dispatch module. ISA-95 organizes activities by hierarchical level, rather than prescribing four separate standalone products.

## What SCADA actually is, precisely

SCADA (*Supervisory Control and Data Acquisition*) is, in the words of a widely cited definition from NIST (original SP 800-82 guide, 2006), a computer-based system capable of gathering and processing data and applying operational controls over long distances, typically in power generation and transmission, utilities, and pipelines. In SCADA architectures, field controllers (RTUs or PLCs) handle local data acquisition and automated control, while a central supervisory station presents telemetry to operators and accepts supervisory setpoints.

Two essential distinctions:

- **SCADA is not a PLC.** The PLC executes its deterministic scan cycle independently and remains operational if the supervisory SCADA crashes. SCADA supervises and monitors; it must never be solely responsible for fundamental process safety.
- **SCADA is not an MES.** SCADA understands tags, alarms, and telemetry states; by default, it has no native concept of work orders, material lots, or business recipes.

In continuous process plants, an equivalent role is often handled by a **DCS** (Distributed Control System), which tightly integrates control loops and supervisory stations. Security literature, such as NIST SP 800-82 Rev. 3 (2023), groups SCADA, DCS, and PLCs under the overarching umbrella of industrial control systems (ICS).

## What a data historian is

A data historian is a specialized database purpose-built for **industrial process time series**: each telemetry point (tag) contains a value, a timestamp, and typically a quality indicator. Three primary characteristics distinguish it from a standard relational database:

1. **Continuous high-throughput ingestion**, almost exclusively append-only.
2. **Ingress data compression.** Rather than persisting every raw sample, many historians filter out minor fluctuations.
3. **Interpolated, time-windowed queries:** point-in-time value, interval averages, min/max, and trendlines.

Documentation for the **AVEVA PI System** (a proprietary commercial product, used here as an illustrative example rather than a universal standard) describes two filtering stages: *exception reporting*, applied at the data collection interface using a deadband threshold, and *compression*, applied to the archive storage using the *swinging door* algorithm, which tracks rate-of-change slope rather than static deadbands. The same documentation advises against compressing manually entered or pre-totalized data, recommending empirical validation of compression deviations against trend charts because their downstream impacts are non-trivial. The key engineering takeaway: **queries to a historian often retrieve an interpolated reconstruction** of the original signal. This distinction is critical for downstream root-cause analysis that depends on precise edge transitions.

In the open standards ecosystem, **OPC UA** Part 11 (*Historical Access*) defines the standardized information model for retrieving historical telemetry; operational services reside in Part 4 and temporal aggregations (min, max, average, etc.) in Part 13. The 2020 edition of IEC 62541-11 appears across standard catalogs, though its adoption status varies across registries, making it prudent to verify the specific version in active use.

## Comparison table

| | ERP | MES | SCADA | Historian |
|---|---|---|---|---|
| **Core question** | What to produce, buy, and deliver? | What is being produced and how did it go? | What is happening across the process? | How has the process behaved over time? |
| **ISA-95 level** | 4 | 3 | 2 to 3 (varies by source and function) | 2 to 3 (varies) |
| **Ingests** | customer orders, aggregated MES reports | ERP work orders, machine counts/events | PLC tags, operator commands | tags and events (from SCADA, gateways, PLCs) |
| **Produces** | work orders, purchasing plans, cost ledger | production reports, genealogy, KPIs | HMI screens, alarms, commands, tags | queryable time-series archives |
| **Time horizon** | days to months | minutes to shifts | seconds | milliseconds to years (historical retention) |
| **Data model** | relational, transactional | relational, transactional | real-time tag memory | compressed time series |
| **Time criticality** | low | medium | medium to high | low on query, high on ingestion |
| **Typical failure** | delayed planning | line operating blind or without tracking | operator loses process visibility | data gaps and blind spots |
| **Data ownership** | master data, orders, balance | actuals and batch traceability | instantaneous plant state | historical parameter trends |

The exact classification of SCADA and data historians within Level 2 or Level 3 varies depending on industry standards and vendor definitions. The OPC Foundation documentation on ISA-95, for instance, lists SCADA and historians among Level 3 systems.

## How they communicate

Each architectural interface typically relies on dedicated integration patterns:

- **Control ↔ SCADA:** industrial protocols. The most common include OPC UA, Modbus, PROFINET, and EtherNet/IP, alongside vendor-proprietary fieldbus drivers. Article 06 covers these protocols.
- **SCADA ↔ Historian:** generally via native vendor connectors or OPC UA. In many architectures, the historian queries controllers directly, bypassing the SCADA server entirely.
- **Control/SCADA/Historian ↔ MES:** production events and aggregations. An MES does not need raw 10 ms analog sensor noise; it requires cycle counts, operating states, and time windows mapped to work orders. Common transports include OPC UA, message brokers (MQTT, AMQP), or database integration.
- **MES ↔ ERP:** business transactions: work order release, material consumption, and yield reporting. ISA-95 Part 5 standardizes these transactions; modern implementations typically rely on REST APIs, message queues, or batch files.

Data that must be **consistently shared** across layers includes canonical identifiers (order number, lot ID, equipment tag, material SKU), synchronized clock timestamps, and data quality flags (valid, estimated, faulted). Without shared semantic identifiers, cross-layer integration degrades into fragile, error-prone manual mappings.

### A concrete example: correlating process telemetry with production orders

A classic integration scenario between a historian and an MES is correlating process telemetry with a specific production work order. The **hypothetical** example below demonstrates the core principle in SQL: temperature readings (the `tag_sample` table, representing historian data) are joined against the execution window of each order (`order_run`, sourced from the MES), filtering out bad quality flags. This was tested on PostgreSQL 17 prior to publication.

```sql
CREATE TABLE tag_sample (
  tag text NOT NULL, ts timestamptz NOT NULL,
  value double precision NOT NULL, quality text NOT NULL DEFAULT 'GOOD',
  PRIMARY KEY (tag, ts));
CREATE TABLE order_run (
  erp_order_no text, machine text, started_at timestamptz, ended_at timestamptz);

SELECT o.erp_order_no, count(*) AS samples,
       round(avg(s.value)::numeric, 1) AS average, max(s.value) AS maximum
FROM order_run o
JOIN tag_sample s
  ON s.tag = o.machine || '.furnace.temp'
 AND s.ts >= o.started_at AND s.ts < o.ended_at
 AND s.quality = 'GOOD'
GROUP BY o.erp_order_no;
```

With synthetic samples generated every 10 minutes between 08:00 and 10:00, with two samples marked bad, the query returns 10 valid samples, as expected (12 total minus 2 bad). The engineering reality: **time-based joins only work reliably if system clocks are strictly synchronized** and the MES records start and end timestamps accurately. In production, this correlation is often performed within the historian itself or an analytical data warehouse, where time zones, tag namespace naming, and open/closed interval bounds matter significantly.

## Integrated architecture, end-to-end

A conceptual, **illustrative** diagram, not a rigid blueprint:

<figure>
  <img src="/images/blog/mes-erp-scada-historian-diferencas-e-integracao-diagrama.webp" alt="Diagram with ERP at the top, MES below it, an integration layer (OPC UA, gateway, message queue), and at the base, historian, SCADA, and PLCs connected to this integration layer." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Illustrative integrated architecture of ERP, MES, SCADA, and historian. Author's diagram.</figcaption>
</figure>

End-to-end operational flow: the ERP releases the work order; the MES schedules it and dispatches recipe parameters; the PLC executes the machine cycle and exposes telemetry; the SCADA supervises operations and the historian logs time series; the integration layer delivers counts, machine states, and events to the MES; the MES reconciles data and transmits quantities, consumed lots, and completion status back to the ERP.

### Databases across layers

- **Relational databases** (PostgreSQL, SQL Server, Oracle, and similar): ERP and MES, where transactions, referential integrity, and complex relational queries are paramount.
- **Industrial data historians:** specialized for dense tag arrays, swinging-door compression, and deadband filtering; typically proprietary software backed by rich connectivity suites.
- **General-purpose time-series databases** (such as InfluxDB or TimescaleDB): increasingly evaluated as open alternatives or complements, requiring engineering evaluation around industrial-grade interfaces, interpolation capabilities, and plant operational tooling. Article 08 explores these trade-offs.

## What breaks when integration is flawed

- **Dual source of truth.** Material masters and routings maintained in multiple systems that drift out of sync.
- **Incompatible identifiers.** The ERP tracks "WO-1001", the MES labels it "ORD1001", and the historian knows neither.
- **Clock drift.** Asynchronous system clocks generate out-of-sequence events, producing erroneous performance indicators.
- **Lost or duplicated messages.** In the absence of idempotent consumer logic and acknowledgments, network partitions cause double-reported or dropped production counts.
- **Tight cascading coupling.** The MES halts because the enterprise ERP is down for scheduled maintenance; the shop floor freezes because an upper-tier service crashed.
- **Context-free telemetry.** Raw numbers lacking physical engineering units, quality flags, or machine bindings that corrupt downstream reporting.
- **Conflicting KPI definitions.** Each system computing OEE via divergent formulas and baseline assumptions.
- **Violated architectural boundaries.** Attempting to push real-time machine safety or closed-loop control to an enterprise IT layer never engineered for deterministic execution.

## Relationship with software engineering

In my view, the practical lesson is to architect industrial integrations around **explicit contracts**: canonical domain identifiers, well-defined time and quality semantics, idempotent event ingestion, reliable reprocessing, and telemetry monitoring. ISA-95 vocabulary provides the ubiquitous domain language, and standardized information models (such as OPC UA companion specs) minimize fragile ad-hoc translations. Furthermore, each architectural layer requires a clear **graceful degradation strategy**: defining exactly how local automation operates when upper-level systems become unreachable. [Article 07](/pt/blog/engenharia-de-software-para-manufatura) revisits these architectural patterns.

## Conclusion

ERP, MES, SCADA, and historians answer different questions, operate on distinct time horizons, and utilize fundamentally different data storage paradigms. System integration failures rarely originate within a single component; they almost invariably occur at system boundaries: mismatched identifiers, clock skew, data quality ambiguities, and unassigned data ownership. Designing a dependable manufacturing architecture begins with establishing clear ownership for every piece of data and determining how each layer behaves when the rest of the stack fails.

## References

This article is a study based on the sources below. Passages marked as opinion reflect my own reading. The system architecture and SQL query are illustrative.

- AVEVA. [Exception reporting attributes (UniInt Framework)](https://docs.aveva.com/bundle/pi-universal-interface-uniint-framework/page/1026196.html) and [Data Archive administration](https://docs.aveva.com/bundle/pi-server-da-admin/page/1022865.html), PI System documentation. Description of a specific product.
- IEC. [IEC 62541-11:2020, OPC Unified Architecture, Part 11: Historical Access](https://webstore.iec.ch/publication/61129). Reference limited to catalog summary.
- NIST. [SP 800-82 Rev. 3, Guide to Operational Technology (OT) Security](https://csrc.nist.gov/pubs/sp/800/82/r3/final), 2023. The cited SCADA definition comes from the original 2006 guide, [NIST SP 800-82](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-82.pdf), superseded by subsequent revisions.
- OPC Foundation. [OPC 10030, 4.2.3 ISA-95](https://reference.opcfoundation.org/specs/OPC-10030/4.2.3).
- ISA. [ISA-95 Standard: Enterprise-Control System Integration](https://www.isa.org/standards-and-publications/isa-standards/isa-95-standard).
