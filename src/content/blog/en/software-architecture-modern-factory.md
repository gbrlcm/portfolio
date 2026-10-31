---
title: "Software Architecture of a Modern Factory: From Sensor to ERP"
description: "How sensors, PLCs, SCADA, MES, historians, and ERP fit together, the ISA-95 standard, and the path of production data from the shop floor to enterprise IT."
pubDate: 2026-10-31T09:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/arquitetura-de-software-fabrica-moderna.webp"
coverAlt: "Illustration with five stacked architectural layers from L4 to L0: ERP, MES, PLC/SCADA, sensors, and physical process, highlighting the MES"
category: "Industrial Automation"
tags:
  - "Industrial Automation"
  - "ISA-95"
  - "MES"
  - "SCADA"
  - "PLC"
  - "Industrial Automation Series"
draft: false
lang: "en"
translationKey: "software-architecture-modern-factory"
---

To developers coming from web development or enterprise IT, a manufacturing plant often looks like an impenetrable black box: physical machinery on one side, an ERP on the other, and "some integration glue" in between. In reality, modern manufacturing relies on a well-defined hierarchy of distinct layers, each operating with specific responsibilities, time scales, and engineering constraints. Understanding this structural map is the essential prerequisite for writing software in industrial manufacturing.

This is the first article in a series of studies on industrial automation and software engineering for manufacturing. The goal here is the architectural overview: identifying the core components, understanding what each does, following how data traverses the stack, and seeing where the ISA-95 standard fits.

## The shop floor

The shop floor is where physical transformation happens: machining centers, assembly lines, conveyor belts, mixing tanks, industrial furnaces, and robotics. From a software perspective, the critical boundary is where the physical world meets the digital domain, mediated by three elements:

- **Sensors and instrumentation** measure physical quantities (temperature, pressure, liquid level, volumetric flow, linear position, optical part presence) and convert them into electrical or digital signals.
- **Actuators** perform the inverse: they receive electrical commands and exert physical force (electric motors, pneumatic solenoids, proportional control valves, heating elements).
- **Controllers** ingest sensor readings, execute control algorithms, and command actuators. The ubiquitous workhorse is the **PLC** (Programmable Logic Controller), the core topic of the next article.

This physical-to-digital interface operates over discrete binary signals (on/off states), analog signals (such as 4–20 mA current loops, a resilient instrumentation standard), or digital fieldbuses. The defining architectural characteristic of this layer is **fast, deterministic execution**: the controller executes its scan loop continuously within millisecond time horizons, completely independent of whether upper-level enterprise networks are reachable.

## Control, supervision, and execution: who does what

Above machine-level control sit systems with fundamentally distinct functional roles. Confusing them is the root cause of most industrial integration failures.

**PLC (control).** Executes the real-time logic that switches outputs based on physical inputs. It is a hardened industrial computing platform running deterministic, cyclic execution. It is not an enterprise management tool: it understands that "if proximity sensor S-10 is energized, start conveyor motor M-01," not "which customer sales order is currently on the line."

**HMI (Human-Machine Interface).** The local operator screen mounted directly on a machine or cell, displaying instantaneous telemetry and accepting operator commands.

**SCADA (Supervisory Control and Data Acquisition).** A centralized supervisory system connected to multiple field controllers across an entire plant: dynamic graphic mimic screens, alarm management, real-time trend plots, supervisory setpoints, and data acquisition. SCADA **is not** a PLC: the PLC executes machine control; the SCADA supervises and aggregates telemetry across controllers.

**Data Historian.** A database engine purpose-built for high-frequency process time series (sensor values sampled over time), providing lossy/lossless compression algorithms and time-windowed interpolation queries. It typically sits alongside SCADA or within the operations tier.

**MES (Manufacturing Execution System).** Coordinates and tracks physical production on the floor: active work orders, shift production reporting, material lot genealogy, quality inspections, downtime tracking, and OEE. It represents the binding link between enterprise business planning and physical execution. Article 03 explores it in detail.

**ERP (Enterprise Resource Planning).** Corporate business management: customer sales orders, raw material purchasing, inventory accounting, cost ledgers, financials, and master production scheduling. It operates over time horizons of days, weeks, and months, with no need to process sub-second machine telemetry.

A practical summary: the PLC answers "what must this machine do right now?"; SCADA answers "what is happening across the physical process?"; the MES answers "what are we manufacturing and how is the batch progressing?"; and the ERP answers "what must we produce, purchase, and deliver to satisfy customer orders?"

## The ISA-95 model (IEC 62264)

The **ISA-95** standard, also published internationally as **IEC/ISO 62264**, governs the integration between enterprise systems and industrial control systems. Part 1 defines standard terminology and object models determining what information flows across business, manufacturing operations, and control functions. Subsequent parts detail attributes (Part 2), manufacturing operations management activity models (Part 3), operations object models (Part 4), and business-to-manufacturing transaction patterns (Part 5). Because ISA-95 is a commercial standard, descriptions here reflect public reference literature, and active normative editions should be confirmed via official ISA and IEC registries.

The best-known concept is the **functional hierarchy**, standardly structured across five levels (as outlined by the OPC Foundation):

| Level | Role | Typical time scale | Representative systems |
|---|---|---|---|
| 4 | Business planning and logistics | months, weeks, days | ERP |
| 3 | Manufacturing operations management | days, shifts, hours, minutes, seconds | MES/MOM, quality, maintenance, inventory |
| 2 | Monitoring and supervisory control | sub-seconds | PLC, DCS, SCADA/HMI |
| 1 | Sensing and physical actuation | — | sensors and actuators wired to controllers |
| 0 | Physical production process | — | the physical manufacturing process itself |

Two analytical considerations:

1. **SCADA positioning varies across literature.** OPC Foundation documentation frequently groups SCADA under Level 3 systems, whereas industrial cybersecurity literature places it at Level 2 (supervisory and control). In practice, this depends on function: real-time machine HMI screens align with Level 2; plant-wide telemetry aggregation aligns closer to Level 3.
2. **The 0-to-4 numbering blends two distinct frameworks.** While commonly referred to as the "Purdue Model" (derived from the *Purdue Enterprise Reference Architecture*, PERA), literature sources diverge on which levels constituted original PERA concepts versus later security community additions. Treat "Purdue" and "ISA-95" as closely related frameworks rather than strict synonyms.

ISA-95 focuses heavily on **information exchange between Level 3 systems and across the Level 3/Level 4 boundary**, structured across four core domain models: material, equipment, physical assets, and personnel.

A crucial architectural principle: **ISA-95 is a functional and semantic information model, not a prescribed software architecture.** It specifies which data structures cross the boundary between business planning and execution, and maps operational activities within each level; it does not mandate that each level must be a distinct physical software product or technology stack. A single platform may span multiple levels, and modern architectures (such as edge gateways streaming machine telemetry directly into cloud data lakes) bypass the rigid pyramid structure while still leveraging ISA-95 domain vocabulary.

## Networks and protocols: cross-level communication

Different boundaries require communication networks and protocols engineered for specific operational requirements (detailed in article 06):

- **Field and control networks:** interlink sensors, actuators, servo drives, and PLCs. They leverage deterministic industrial protocols (PROFINET, EtherNet/IP, EtherCAT, Modbus) engineered for strict latency boundaries.
- **Supervisory networks:** connect PLCs to SCADA servers, historians, and engineering workstations.
- **Enterprise IT networks:** host corporate ERP systems, transactional databases, email servers, and internet access.

An industrial protocol **is not** a programming language, and an information model **is not** a communication protocol. **OPC UA**, for example, is an open integration architecture standardized by the OPC Foundation (OPC 10000 series / IEC 62541) unifying semantic information modeling, client-server services, and transport bindings. Supporting both client-server polling and publish-subscribe patterns across a shared information model, it serves as the standard interoperability bridge between plant automation and enterprise IT.

Between Operational Technology (OT) and enterprise IT networks, strict network segmentation and an Industrial Demilitarized Zone (IDMZ) are mandatory, as explored in article 10.

## From sensor to ERP: a conceptual data journey

The following scenario is **hypothetical and simplified**, designed to illustrate the end-to-end data flow rather than document an actual production plant. Consider a packaging line bottling a pharmaceutical product, driven by a production order issued by the corporate ERP.

<figure>
  <img src="/images/blog/arquitetura-de-software-fabrica-moderna-diagrama.webp" alt="Diagram showing five architectural levels from L4 to L0 (ERP, MES/historian, PLC/SCADA, sensors/actuators, physical process). Arrows rise with counts and events, and descend with orders and recipes. On the right, five numbered steps trace the data path from sensor to ERP." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>ISA-95 levels and the end-to-end telemetry path from sensor to ERP (hypothetical example). Author's diagram.</figcaption>
</figure>

The data journey, moving bottom-up:

1. **Physical measurement.** An optical sensor detects a bottle passing the filling station. The electrical pulse arrives at a physical digital input terminal on the PLC.
2. **Deterministic control.** Within its cyclic scan, the PLC samples the input, evaluates logic, and increments an internal counter. If a mechanical fault occurs, the PLC enters a fail-safe state locally, with zero dependency on external network uptime.
3. **Telemetry exposure.** The counter and machine operating states are exposed as symbolic tags that a SCADA server, data historian, or edge gateway polls via an industrial protocol (e.g., OPC UA or Modbus TCP).
4. **Supervisory logging.** The SCADA system displays line velocity on the operator console and monitors threshold alarms. The data historian archives the continuous time series.
5. **Contextualization in the MES.** The MES ingests the cycle events and binds them to the active production work order, product lot, and operator shift: "these 12,000 completed units belong to work order WO-1001, lot L-2026-A." Raw sensor pulses are transformed into business context.
6. **Enterprise ERP reconciliation.** The MES transmits aggregated metrics to Level 4: total good units produced, consumed raw materials, scrap quantities, and order completion state. The ERP reconciles finished goods inventory and computes actual production cost.

Two foundational software engineering principles emerge along this pipeline. First, **every ascending layer decreases in temporal frequency and increases in semantic context**: the PLC processes bits every few milliseconds; the ERP processes consolidated business quantities per production batch. Second, **operational command flow is strictly asymmetrical**: plans descend (orders, recipes) while execution telemetry ascends (counts, events); machine physical safety decisions must never depend on upper enterprise availability.

## Challenges of OT/IT convergence

Bridging operational technology with enterprise information technology is where most software projects stumble, driven by cultural and architectural divergence:

- **Conflicting priorities.** Enterprise IT prioritizes Confidentiality, Integrity, and Availability (in that order). In industrial OT, physical safety and system Availability are the paramount imperatives. NIST SP 800-82 Rev. 3 provides guidance specifically on securing OT while respecting its strict performance and availability constraints.
- **Asset lifecycles.** Industrial plant equipment operates continuously for decades, and applying software patches requires carefully scheduled plant turnarounds.
- **Extreme heterogeneity.** A typical brownfield facility houses multiple generations of PLCs from competing vendors running disparate communication protocols. Information models like OPC UA and ISA-95 mitigate this friction, but cannot eliminate integration complexity.
- **Data semantics and data quality.** A bare integer lacking engineering units, sensor origin, quality status (e.g., "sensor open-circuit fault"), or trusted timestamping corrupts downstream analytics.
- **Partial network failure modes.** Network switches drop, the MES restarts, or the ERP enters maintenance. The manufacturing line must continue producing, and software systems must reconcile buffered telemetry once communication resumes.

## Relationship with software engineering

In my view, the core lesson for software engineers entering manufacturing is to respect architectural boundaries:

- **Never place machine control or safety logic in enterprise software.** Closed-loop control must remain on field controllers, even when upper-tier platforms coordinate macro dispatching.
- **Architect for asynchronous decoupling.** Message queues, event brokers, and edge store-and-forward buffers ensure that an ERP outage never stops a production line. Article 07 explores these design patterns.
- **Adopt standard domain vocabulary.** Speaking in terms of work orders, material lots, equipment entities, and operations schedules (conforming to ISA-95) facilitates collaboration with plant automation engineers and simplifies third-party software integration.
- **Treat reference models as structural maps, not dogmatic blueprints.** What matters is that every data point has an unambiguous system of record, a defined time horizon, and a clear operational owner.

## Conclusion

A modern factory is not a single software application; it is an integrated ecosystem of distinct layers operating across vastly different time scales, spanning the millisecond scan cycle of a PLC to the monthly financial accounting of an ERP. ISA-95 provides the ubiquitous domain vocabulary and semantic model to structure this integration without imposing a rigid software design. Understanding what each layer is responsible for—and especially what it **must never do**—enables engineers to build industrial software that survives real-world failures and remains maintainable.

Subsequent articles in this series examine each building block in depth: [PLCs and industrial programming languages](/en/blog/plc-industrial-programming-languages), the [MES](/en/blog/what-is-mes-manufacturing-execution-system), and [industrial communication protocols](/en/blog/industrial-protocols-opc-ua-modbus-mqtt).

## References

This article is a study based on the sources below. Passages marked as opinion reflect my own reading. The bottling line example is hypothetical.

- OPC Foundation. [OPC 10030, 4.2.3 ISA-95](https://reference.opcfoundation.org/specs/OPC-10030/4.2.3), OPC UA for ISA-95 Common Object Model.
- OPC Foundation. [OPC 10000-1, Overview and Concepts](https://reference.opcfoundation.org/specs/OPC-10000-1/full), OPC Unified Architecture.
- OPC Foundation. [OPC 10000-14, PubSub](https://reference.opcfoundation.org/specs/OPC-10000-14/full), OPC Unified Architecture.
- ISA. ANSI/ISA-95.00.01-2010 (IEC 62264-1), *Enterprise-Control System Integration, Part 1: Models and Terminology*. Catalog: [ANSI Webstore](https://webstore.ansi.org/standards/isa/ansiisa9500012010iec62264mod).
- NIST. [SP 800-82 Rev. 3, Guide to Operational Technology (OT) Security](https://csrc.nist.gov/pubs/sp/800/82/r3/final), September 2023.
- Siemens. [ISA-95 framework and layers](https://www.sw.siemens.com/en-US/technology/isa-95-framework-layers/) (vendor overview; Levels 1 and 2 are described more flexibly than in the formal standard text).
