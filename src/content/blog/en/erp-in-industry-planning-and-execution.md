---
title: "ERP in Manufacturing: How It Organizes Industrial Operations"
description: "How an ERP plans manufacturing: MRP, BOM explosion, routings, production orders, inventory, procurement, costing, differences from MES, and demand shifts."
pubDate: 2026-10-31T10:30:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/erp-na-industria-planejamento-e-execucao.webp"
coverAlt: "Tree illustration of a bill of materials: finished product A consumes 2 of component B and 1 of C, and B consumes 3 of D"
category: "Industrial Automation"
tags:
  - "ERP"
  - "MRP"
  - "BOM"
  - "Production Planning"
  - "ERP MES Integration"
  - "Industrial Automation Series"
draft: false
lang: "en"
translationKey: "erp-in-industry-planning-and-execution"
---

In conversations about manufacturing software, the ERP is simultaneously the most familiar system and the least understood by developers tasked with integrating it. An ERP does not control machinery and does not track the assembly line in sub-second intervals. Its core mission is to **plan, commit enterprise resources, and account for business costs**: it decides what needs to be produced and purchased, allocates materials, calculates product margins, and balances the general ledger.

This is the fourth article in the series. Having explored [general factory software architecture](/en/blog/software-architecture-modern-factory), [PLCs](/en/blog/plc-industrial-programming-languages), and the [MES](/en/blog/what-is-mes-manufacturing-execution-system), we now examine Level 4 of the ISA-95 model.

## What an ERP actually is

**ERP** (Enterprise Resource Planning) is an integrated suite of business software modules sharing a single corporate relational database: financials and general ledger, sales, purchasing, inventory management, manufacturing, cost accounting, human resources, and logistics. Its defining attribute is **unification around shared master data**: the identical item master, customer table, and vendor catalog feed all modules simultaneously, meaning a transaction in one department (such as a warehouse receiving dock scan) automatically updates inventory on hand, accounts payable, and standard costing.

In manufacturing, the ERP production module handles business-level planning and costing, not shop floor execution. In ISA-95 taxonomy, business planning and logistics reside at Level 4, operating across time horizons of days, weeks, and months, as published by the OPC Foundation.

## The evolution from MRP to modern ERP

The historical progression is standardly framed across several distinct phases. The dates and attributions below derive from secondary industrial management literature (vendor summaries and consulting retrospectives); treat them as the established industry narrative rather than primary historical records:

- **MRP (Material Requirements Planning).** Credited to Joseph Orlicky in the 1960s. The central mathematical logic: given independent market demand for finished goods, product structures, and current warehouse stock, calculate **what, how much, and when** to manufacture or purchase each dependent subcomponent.
- **Closed-Loop MRP.** Introduced rough-cut capacity planning (RCCP) and plant-floor feedback loops to validate whether the calculated material plan was physically achievable on available machinery.
- **MRP II (Manufacturing Resource Planning).** Credited to Oliver Wight in the early 1980s. Expanded planning logic to incorporate workforce capacity, detailed machine scheduling, financial projections, and commercial sales forecasting.
- **ERP.** A term popularized in the 1990s (widely attributed to Gartner), extending integrated database planning across the entirety of the enterprise, well beyond the factory floor.

The key software engineering takeaway is continuity: the computational core of production planning in modern enterprise ERP suites remains, conceptually, the exact mathematical explosion of material requirements.

## Manufacturing master data

Manufacturing planning calculations are only as dependable as the master data tables feeding them.

**Item / Material Master.** Every raw material, packaging component, subassembly, and finished SKU, annotated with stocking units of measure, replenishment policies, supplier lead times, minimum order quantities (MOQ), and safety stock thresholds.

**Bill of Materials (BOM).** The structural recipe defining which dependent components and in what exact quantities constitute a parent assembly. BOMs are hierarchical (a finished pharmaceutical vial contains liquid bulk and a packaging kit; the bulk contains active chemical ingredients and purified water). Documentation for Microsoft Dynamics 365 Supply Chain Management illustrates standard behavior: during master planning runs, the system traverses active BOM revisions down through every level of the product structure tied to a production order. BOMs carry effective date ranges, ensuring engineering design revisions are reflected accurately over time.

**Routing.** The sequential list of operational steps required to fabricate or assemble an item, defining required work centers, specialized machine tooling, setup changeover times, and run times per piece. Routings drive both finite-capacity scheduling and standard labor cost absorption.

**Work Centers and Capacity Calendars.** Physical machine groups or manual assembly cells, complete with working shift calendars, planned maintenance downtime, and nominal throughput capacities.

**Vendors and Purchase Trade Agreements.** Contractual lead times, price tiers, and minimum purchase quantities.

## The material requirements calculation: BOM explosion and netting

The mathematical core of MRP is **BOM explosion with inventory netting**: working backwards from independent finished goods customer demand, the algorithm traverses the product tree downward, subtracting on-hand warehouse inventory and open purchase orders at each level to arrive at net manufacturing and purchasing requirements.

A **hypothetical**, intentionally compact example. Finished product A consumes 2 units of component B and 1 unit of component C. Component B consumes 3 units of raw material D. Current inventory: A=10, B=20, C=0, D=50. Demand: a sales order for 100 units of A.

```text
A: demand 100 − stock 10        = net requirement  90
B: 90 × 2 = 180 − stock 20      = net requirement 160
C: 90 × 1 =  90 − stock 0       = net requirement  90
D: 160 × 3 = 480 − stock 50     = net requirement 430
```

In SQL, this tree calculation—where each component appears once—can be modeled via a recursive Common Table Expression (CTE). This query was executed and verified on PostgreSQL 17 prior to publishing:

```sql
CREATE TABLE bom (
  parent_item text NOT NULL, child_item text NOT NULL,
  qty_per numeric NOT NULL CHECK (qty_per > 0),
  PRIMARY KEY (parent_item, child_item));
CREATE TABLE stock (item text PRIMARY KEY, on_hand numeric NOT NULL DEFAULT 0);

INSERT INTO bom   VALUES ('A','B',2), ('A','C',1), ('B','D',3);
INSERT INTO stock VALUES ('A',10), ('B',20), ('C',0), ('D',50);

WITH RECURSIVE explosion AS (
  SELECT 'A'::text AS item, 0 AS lvl,
         100::numeric AS gross,
         GREATEST(100 - s.on_hand, 0) AS net
  FROM stock s WHERE s.item = 'A'
  UNION ALL
  SELECT b.child_item, e.lvl + 1,
         e.net * b.qty_per,
         GREATEST(e.net * b.qty_per - s.on_hand, 0)
  FROM explosion e
  JOIN bom b   ON b.parent_item = e.item
  JOIN stock s ON s.item = b.child_item
)
SELECT item, lvl, gross, net FROM explosion ORDER BY lvl, item;
```

The resulting output (A: 90, B: 160, C: 90, D: 430) exactly matches manual calculation. This SQL snippet is an illustrative simplification. An enterprise MRP engine handles far greater complexity: components shared across multiple branches at differing depths (requiring low-level code sequencing to ensure each SKU is aggregated only once), **supplier lead times** and time-phased bucket scheduling, minimum batch sizing rules, scrap shrinkage allowances, and multi-facility inventory pooling. This script should not be mistaken for a production planning engine.

### Master planning and work orders

The output of an MRP run is a schedule of **unfirmed supply proposals**: planned production orders, purchase requisitions, and warehouse transfer orders. In enterprise ERPs, a planned order is dynamic: it will be recalculated and adjusted on the next nightly MRP run. Once an operations planner **firms** or converts the proposal, it transforms into an official **production order** (or work order): its BOM revision and routing become frozen, operational dates are scheduled, and physical warehouse inventory is hard-allocated. Real-world implementations illustrate this lifecycle:

- In SAP ERP documentation (referencing historical help documentation that clearly captures core mechanics), planned orders are converted into purchase requisitions or production/process orders to trigger component procurement and shop floor execution.
- In Microsoft Dynamics 365 documentation, lead time on an unfirmed planned production order is derived from static item master lead times, whereas a firmed production order calculates its delivery schedule dynamically via finite capacity routing constraints. Consequently, **the delivery date initially promised by high-level planning and the actual scheduled date determined by plant constraints may diverge**.

## Inventory, procurement, and industrial costing

**Inventory valuation.** The ERP maintains real-time ledger balances by SKU, warehouse site, storage bin, lot number, and serial number across business transactions: supplier receipts, consumption dispatching to work orders, finished goods completion entries, scrap adjustments, and customer shipments.

**Procurement.** Net requirements for purchased raw materials trigger purchasing workflows. Supplier delivery lead times are critical inputs to master planning. Microsoft documentation highlights how this propagates: if a vendor lead time exceeds the available horizon before assembly begins, master planning calculates the projected delivery delay and cascades that delay up through all BOM levels directly into customer sales order fulfillment dates.

**Standard versus actual costing.** The ERP accumulates direct material consumption, direct machine run labor, and allocated overhead per work order, comparing real-world expenses against baseline standard costs. The accuracy of this financial accounting depends entirely on reliable shop floor production reporting—which is precisely where the MES provides ground truth: actual material lots consumed, machine run hours, and scrap rates.

## ERP versus MES: planning versus execution

The essential architectural distinction in a single sentence: **the ERP answers "what and how much should we manufacture, with what inventory, and at what standard cost"; the MES answers "what is being produced right now on line 4, and what physical quantities and downtime actually occurred."**

| Aspect | ERP | MES |
|---|---|---|
| Time horizon | Days, weeks, months | Shifts, hours, minutes |
| Data granularity | Production orders, material batches, SKU items | Workstation operations, tool cycles, machine states |
| Operational focus | Planning, procurement, cost ledger balancing | Execution dispatching, production logging, batch genealogy |
| Primary telemetry | Customer demand, inventory ledger, standard costs | Shift production reports, machine alarms, quality holds |
| Downtime tolerance | Brief service outages without stopping physical lines | Zero plant floor stoppage |
| System of record | Planned work orders and financial balance ledgers | Real-world shop floor actuals and genealogy |

In small job shops, an ERP with simple shop floor terminals can handle basic end-of-shift reporting, rendering a standalone MES unnecessary. Architectural issues arise when organizations attempt to stretch an enterprise ERP into handling high-speed automated part counting, sub-second downtime tracking, and machine-level interlocks—responsibilities for which transactional business software was never architected.

## Scenario: customer demand drops from 100 to 60 units

Returning to our hypothetical model, suppose a customer cuts their sales order for product A from 100 to 60 units. Rerunning the recursive calculation yields net requirements of A=50, B=80, C=50, and D=190 (down from 90, 160, 90, and 430). In an enterprise ERP, this demand reduction propagates across different timelines:

1. **Master planning.** On the subsequent MRP planning run, planned production proposals shrink automatically. Note that per Microsoft documentation, manual overrides on planned orders only reflect across dependent components after a fresh planning cycle; plans do not recalculate instantaneously across all tiers.
2. **Procurement.** Open purchase orders already dispatched to suppliers for raw material D do not vanish: the ERP flags an inventory surplus exception, requiring buyers to negotiate cancellations, defer delivery dates, or accept delivery into raw inventory.
3. **Plant operations.** Firmed production orders already dispatched to the shop floor have locked BOMs and allocated parts. Modifying an active order requires manual rescheduling in the MES and accounting for materials already consumed on the line.
4. **Working capital and inventory.** Overproduced subassemblies end up held in warehouse inventory, impacting balance sheet liquidity and carrying costs.

The software engineering lesson is that **enterprise business changes propagate at different velocities across different architectural layers**, and industrial systems must explicitly model lifecycle states (Planned, Firmed, Released, Running, Completed) rather than assuming operational state can be recalculated globally on the fly.

## Integration challenges between ERP and MES

**Source of truth and data ownership.** The work order originates in the ERP; actual execution originates in the MES. Product catalogs, BOMs, and standard routings are typically mastered in the ERP and synchronized down to the MES. Attempting to maintain master data tables in both systems independently is a classic source of data drift and operational errors.

**Asynchronous messaging.** An enterprise ERP does not operate on millisecond request loops, and a manufacturing line must never halt because the corporate ERP is rebooting for accounting maintenance. Integration should rely on asynchronous message queues or transactional flat-file transfers backed by store-and-forward mechanics and strict consumer idempotency. ISA-95 Part 5 standardizes B2M (Business-to-Manufacturing) transaction patterns; adhering to these data models simplifies integration across heterogeneous platforms.

**Semantic granularity.** The ERP expects aggregated totals per production order; the factory floor emits discrete sensor pulses every second. The MES or integration middleware must aggregate telemetry into business-meaningful intervals.

**Time zones and operational shift boundaries.** Financial accounting close dates, manufacturing shift changeovers, and daylight saving transitions make temporal modeling considerably more complex than simple UTC timestamp storage.

**Quality holds and warehouse logistics.** Integrations with Quality Management Systems (QMS) and Warehouse Management Systems (WMS) follow similar rules: the ERP must know if a batch is released or quarantined before generating customer invoices, while logistics systems must receive packing slips and report shipping confirmations.

## Relationship with software engineering

In my view, the most critical architectural principle for developers is to recognize the ERP as a **system of record**, not an operational real-time control platform. This clarifies where it acts as the authoritative source of truth (item master catalogs, release of production orders, financial ledgers), where it acts as a consumer (actual consumption, shift production yields), and how to architect latency-tolerant integration boundaries. It also prevents the temptation to embed high-frequency machine telemetry inside ERP databases or load complex financial ledgering into the plant MES. [Article 05](/en/blog/mes-erp-scada-historian-differences-and-integration) compares ERP, MES, SCADA, and data historians side by side.

## Conclusion

An ERP coordinates manufacturing from the perspective of corporate master data, customer demand, and inventory accounting. The mathematical logic of BOM explosion with inventory netting remains the foundational engine of production planning, but it operates purely in the domain of planned quantities and scheduled dates, completely decoupled from physical machine cycles. Engineers integrating ERP and MES systems must respect these distinct operational domains and design for business changes that propagate across asynchronous timelines.

## References

This article is a study based on the sources below. Passages marked as opinion reflect my own reading. The BOM structure, SQL CTE query, and demand adjustment scenarios are hypothetical and illustrative.

- Microsoft. [Production planning (Planning Optimization), Dynamics 365 Supply Chain Management](https://learn.microsoft.com/en-us/dynamics365/supply-chain/master-planning/planning-optimization/production-planning), Microsoft Learn. Commercial platform reference.
- SAP. [Planned orders, SAP Help (release 4.6C)](https://help.sap.com/saphelp_46c/helpdata/en/0a/2479384cda1269e10000009b38f8cf/content.htm). Reference to core conceptual mechanics of planned order conversion.
- OPC Foundation. [OPC 10030, 4.2.3 ISA-95](https://reference.opcfoundation.org/specs/OPC-10030/4.2.3), regarding ISA-95 hierarchical levels and time horizons.
- ISA. [ISA-95 Standard: Enterprise-Control System Integration](https://www.isa.org/standards-and-publications/isa-standards/isa-95-standard).
- On the history of MRP, MRP II, and ERP: historical narratives and attributions (Orlicky, Wight, Gartner) reflect secondary business literature (such as [MRPeasy](https://www.mrpeasy.com/de/?p=6152) and [EBSCO Research Starters](https://www.ebsco.com/research-starters/business-and-management/material-requirements-planning-mrp)); verify with historical texts before academic citation.
