---
title: "What is MES and how it connects planning and production"
description: "What an MES is, why it emerged, how it differs from ERP and SCADA, what it does (orders, traceability, OEE), and an end-to-end flow from order to ERP feedback."
pubDate: 2026-10-31T10:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/o-que-e-mes-manufacturing-execution-system.webp"
coverAlt: "Illustration showing ERP, MES, and PLC stacked, with work order arrows descending and actual production arrows ascending, highlighting the MES"
category: "Industrial Automation"
tags:
  - "MES"
  - "Manufacturing Execution System"
  - "ISA-95"
  - "OEE"
  - "Traceability"
  - "Industrial Automation Series"
draft: false
lang: "en"
translationKey: "what-is-mes-manufacturing-execution-system"
---

The ERP knows there is an order for 1,000 units. The PLC knows a sensor just counted one more. Between the two lies a question neither can answer alone: **which order, batch, and shift do these units belong to, and is production running at the planned pace?** That is the gap the MES fills.

This is the third article in the series. Following the [architecture overview](/en/blog/software-architecture-modern-factory) and [PLCs](/en/blog/plc-industrial-programming-languages), we move up to the manufacturing execution level.

## What is an MES and why did it emerge

**MES** stands for *Manufacturing Execution System*. According to an academic article published in the *South African Journal of Industrial Engineering*, the term was coined in 1990 by the consultancy Advanced Manufacturing Research (AMR) to describe a software suite enabling manufacturing execution through integration between planning and control systems.

The underlying motivation is structural: planning systems (such as the ERP) operate with time horizons ranging from days to months on aggregated data, while control systems (PLCs, DCS) operate in milliseconds dealing with machine signals. Neither, on its own, understands "order 1001 is 78% complete, batch L-001 used raw material from supplier X, and the line was stopped for 40 minutes due to missing labels." A layer was missing to translate the plan into execution instructions and shop floor signals into business information.

In the ISA-95 model, this layer corresponds to **Level 3**, *Manufacturing Operations Management* (MOM). Part 3 of the standard outlines a model of activities for this level, and the OPC Foundation documentation on the standard lists production, maintenance, quality and lab operations, and inventory movement among Level 3 functions. In practice, "MES" is the most common commercial name for software products covering part or all of this scope. An editorial note: ISA-95 describes **activities and information**, not a software product; a single application can cover several activities, and boundaries vary across vendors.

## MES, ERP, SCADA, and control: who does what

| System | Question answered | Horizon | Typical data |
|---|---|---|---|
| ERP (Level 4) | What do I need to produce, purchase, and deliver? | months, weeks, days | orders, inventory, costs |
| MES (Level 3) | What am I producing right now and how is it going? | shifts, hours, minutes | active orders, lots, production reports, stoppages |
| SCADA | What is happening across the process? | seconds | states, alarms, variable trends |
| PLC/DCS (Level 2) | What should each machine do right now? | milliseconds | I/O, machine states |

The most common confusion is between MES and ERP. A practical summary (expanded in [article 04](/en/blog/erp-in-industry-planning-and-execution)): **the ERP plans and accounts; the MES executes and tracks what actually happened**. The ERP determines that 1,000 units must be produced by Friday; the MES coordinates how that happens on the line, in what sequence, with which materials, and reports back the actual results.

The difference with SCADA, on the other hand, comes down to scope and semantics. SCADA supervises process variables and commands equipment; by design, it has no native concept of a work order or a production batch. In many plants both integrate, with the SCADA or historian feeding the MES with events and counts. Article 05 compares all four in detail.

## What an MES does

The feature set varies by vendor and industry. The most common include:

- **Work order management.** Receives orders released by the ERP, schedules and dispatches them to lines or workstations, and tracks their status.
- **Production reporting.** Logs good quantities, scrap, rework, and operating times, either manually (by operators) or automatically (via equipment).
- **Traceability (genealogy).** Links finished goods, lot numbers, consumed raw materials, equipment, shift, and operator in both directions: from a raw material lot to the products that consumed it, and from a finished item back to its ingredients. In regulated sectors (food and beverage, pharma, automotive, medical devices), this is usually mandatory.
- **Quality management.** Gathers inspections and test results, enforces sampling plans, and holds non-compliant lots.
- **Resource and material management.** Equipment states, tooling, material availability at the line, and digital work instructions.
- **Downtime tracking and KPIs.** Stoppage reasons, cycle times, and OEE.

### OEE

**OEE** (Overall Equipment Effectiveness) is the indicator most strongly associated with an MES. In its standard formulation, it is the product of three factors:

- **Availability** = operating time ÷ planned production time;
- **Performance** = actual production ÷ theoretical production during operating time (measured against ideal cycle time);
- **Quality** = good units ÷ total units produced.

The **ISO 22400-2** (2014) standard defines performance indicators for manufacturing operations management, specifying formula, unit of measure, and time behavior for each, building upon IEC 62264 work units. Since ISO 22400 is a paid standard and this reference relies on its catalog summary, treat the formulas above as standard industry practice, and verify exact definitions against the standard text before committing to contractual metrics. The key takeaway: two systems may report different numbers under the label "OEE" if they define planned time or scheduled downtime differently. Defining this is an architectural project decision, not a mere detail.

A **hypothetical** calculation to illustrate: a 480-minute shift, 60 minutes of downtime, ideal cycle time of 0.5 min/unit, and 810 units produced, of which 30 were scrap.

- Availability = 420 / 480 = 0.875
- Performance = (0.5 × 810) / 420 = 0.964
- Quality = 780 / 810 = 0.963
- OEE = 0.875 × 0.964 × 0.963 ≈ 0.813 (equivalent to 0.5 × 780 / 480)

## An end-to-end flow: from order to feedback

The following example is **hypothetical and simplified**: a bottling plant with an MES sitting between the ERP and the packaging lines.

```text
1. Customer places an order (1,000 units of SKU-A)
2. ERP: checks inventory, creates production order WO-1001, reserves materials
3. ERP → MES: releases WO-1001 (product, quantity, recipe/routing, due date)
4. MES: schedules line BOT-01, validates material availability,
        generates lots and digital work instructions
5. MES → control (via SCADA/gateway): recipe and order parameters
6. PLC executes; sensors count parts; stoppages and faults are flagged
7. Control → MES: counts, states, and critical alarms
8. MES: persists production reports, links raw material lots, logs quality data
9. MES → ERP: good/scrap quantities, actual consumption, order status
10. ERP: updates finished goods inventory and actual product cost
```

<figure>
  <img src="/images/blog/o-que-e-mes-manufacturing-execution-system-diagrama.webp" alt="Sequence diagram with four participants: ERP, MES, SCADA/gateway, and PLC. The ERP releases the order to the MES, which sends recipe and parameters to SCADA and commands to the PLC; counts and states flow back to the MES, which returns quantity, scrap, and status to the ERP." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Summary flow from order creation to ERP feedback (hypothetical example). Author's diagram.</figcaption>
</figure>

Several subtle architectural considerations are embedded in this workflow:

- **Idempotency.** Part counts and reports may be retransmitted following a network failure. The MES must be able to receive the same event twice without double-counting production.
- **Source of truth.** The order originates in the ERP; actual execution originates in the MES. When discrepancies arise (such as an order modified in the ERP after being released), explicit reconciliation rules are required.
- **Line autonomy.** Step 6 does not depend on MES uptime; the line can keep running, buffering events until connectivity is restored. This is an explicit architectural design choice, not a universal guarantee across all products.

## How an MES is built

From a software engineering perspective, an MES is a system characterized by a **rich domain model, heavy integration, and strict availability requirements**. There are three common paths: buying an off-the-shelf product, customizing a commercial platform, or building bespoke software. Cost and flexibility vary case by case. Core modules typically mirror business functions: work orders, production reporting, traceability, quality, equipment/maintenance, KPIs, and integration.

**Database.** Relational databases (PostgreSQL, SQL Server, Oracle, and similar) are the standard choice for the transactional domain: orders, lots, genealogy, and production reports demand referential integrity and consistency. High-frequency process telemetry usually flows into a historian or time-series database separated from the transactional core (covered in article 08).

An **illustrative** relational schema skeleton in PostgreSQL (tested on PostgreSQL 17 prior to publishing):

```sql
CREATE TABLE work_order (
  id            bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  erp_order_no  text NOT NULL UNIQUE,
  product_code  text NOT NULL,
  qty_planned   integer NOT NULL CHECK (qty_planned > 0),
  status        text NOT NULL DEFAULT 'RELEASED'
                CHECK (status IN ('RELEASED','RUNNING','COMPLETED','CANCELLED'))
);

CREATE TABLE production_report (
  id            bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  work_order_id bigint NOT NULL REFERENCES work_order(id),
  lot_code      text NOT NULL,
  machine_code  text NOT NULL,
  reported_at   timestamptz NOT NULL,
  qty_good      integer NOT NULL CHECK (qty_good >= 0),
  qty_scrap     integer NOT NULL DEFAULT 0 CHECK (qty_scrap >= 0),
  UNIQUE (machine_code, reported_at)   -- re-reporting the same event will not duplicate
);

-- Safe retransmission:
INSERT INTO production_report
  (work_order_id, lot_code, machine_code, reported_at, qty_good, qty_scrap)
VALUES (1, 'L-001', 'BOT-01', '2026-03-02 09:00+00', 380, 20)
ON CONFLICT (machine_code, reported_at) DO NOTHING;

-- Order progress:
SELECT w.erp_order_no, w.qty_planned,
       SUM(r.qty_good) AS good, SUM(r.qty_scrap) AS scrap,
       round(100.0 * SUM(r.qty_good) / w.qty_planned, 1) AS pct_completed
FROM work_order w
JOIN production_report r ON r.work_order_id = w.id
GROUP BY w.id;
```

A production model includes far more: BOMs and routings, lot genealogy, machine states, downtime reason trees, inspection plans, users, and auditing. The `UNIQUE (machine_code, reported_at)` constraint shows a simple integration technique: using a natural key to make event ingestion idempotent. In production environments, the right key depends on how the equipment or edge gateway identifies events.

**Integration.** Downward, the MES communicates with SCADA, historians, edge gateways, and PLCs via protocols like OPC UA—which includes a companion specification for ISA-95 (OPC 10030). Upward, it integrates with the ERP via APIs, message queues, or flat files; ISA-95 Part 5 addresses transactions between business and manufacturing systems. Choosing between REST, message brokers, or batch integration is an architectural trade-off that depends on context.

## Implementation challenges

- **Scope and boundaries.** Where does the ERP end and the MES begin? Product catalogs, routings, and costing frequently dispute ownership. Resolving this early prevents split-brain duplication.
- **Shop floor data quality.** Manual reporting introduces delays and human error; automated reporting requires integrating heterogeneous equipment, including legacy PLCs that expose little or no structured data.
- **Operator adoption.** An MES that slows down daily routines gets bypassed with paper or spreadsheets. Interfaces and workflows must match line cadence.
- **Availability.** An MES outage must not halt physical production; clear offline operation policies and reconciliation mechanisms are essential.
- **KPI definition.** As shown with OEE, metrics are only comparable if their underlying definitions are uniform.
- **Continuous change.** Products, recipes, and lines change constantly; the system must support configuration changes without requiring code redeployments.

## Relationship with software engineering

In my view, an MES is a compelling case for applying domain-driven design and event-driven architecture with rigor: the domain is rich (orders, lots, resources, production events), integration is asynchronous by nature, and consistency and traceability matter far more than rapid feature delivery. At the same time, it cannot be approached like a simple web CRUD application: temporal dimensions, partial failures, idempotency, and auditable history must be foundational from day one. [Article 07](/en/blog/software-engineering-for-manufacturing) explores these choices.

## Conclusion

An MES exists because planning and execution are fundamentally different problems, operating on different time scales, with different stakeholders and data formats. It translates planned work orders into actual execution and converts raw machine signals into actionable business data, returning ground truth back to the ERP. Understanding the boundaries between planning (ERP), execution (MES), supervision (SCADA), and control (PLC) is what makes dependable integrations and accurate production indicators possible.

## References

This article is a study based on the sources below. Passages marked as opinion reflect my own reading. The order flow, OEE calculation, and SQL schema are hypothetical and illustrative.

- [Realising the potential of manufacturing execution systems](https://sajie.journals.ac.za/pub/article/view/358). South African Journal of Industrial Engineering, [DOI 10.7166/12-1-358](https://doi.org/10.7166%2F12-1-358) (origin of the term MES, AMR, 1990). Year and authorship not verified with absolute certainty (consulted sources differ); verify on the journal's website before citing formally.
- ISA. [ISA-95 Standard: Enterprise-Control System Integration](https://www.isa.org/standards-and-publications/isa-standards/isa-95-standard). Description of parts, including Part 3 (manufacturing operations activities).
- OPC Foundation. [OPC 10030, 4.2.3 ISA-95](https://reference.opcfoundation.org/specs/OPC-10030/4.2.3).
- ISO. [ISO 22400-2:2014, Key performance indicators (KPIs) for manufacturing operations management, Part 2: Definitions and descriptions](https://www.iso.org/standard/54497.html). Reference limited to catalog summary; formulas were not verified against full standard text.
