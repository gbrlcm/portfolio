---
title: "IIoT and Industry 4.0: Architectures with Edge and Cloud"
description: "What distinguishes IIoT from IoT, how to design telemetry pipelines across edge and cloud, the role of MQTT and OPC UA, digital twins, predictive maintenance, and real costs."
pubDate: 2026-10-31T13:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/iiot-industria-4-0-arquiteturas-edge-nuvem.webp"
coverAlt: "Illustration of a factory plant with a PLC and a highlighted edge gateway connected via arrow to a cloud platform"
category: "Industrial Automation"
tags:
  - "IIoT"
  - "Industry 4.0"
  - "Edge Computing"
  - "MQTT"
  - "Digital Twin"
  - "Industrial Automation Series"
draft: false
lang: "en"
translationKey: "iiot-industry-4-0-edge-cloud-architectures"
---

"Industry 4.0" is a label that carries far more marketing hype than technical precision. Beneath the buzzwords, however, lies a concrete technical shift: shop floor machines and operational systems that once lived in isolated silos are exposing telemetry through open, standardized protocols, feeding compute pipelines deployed at both the factory edge and enterprise cloud. The software engineering challenge lies in delivering this connectivity without destabilizing plant operations.

This is the ninth article in the series. The goal here is to separate sound system architecture from commercial promises.

## IIoT and consumer IoT are fundamentally different

**IIoT** (Industrial Internet of Things) adapts Internet of Things concepts to industrial manufacturing, but operational constraints reshape the underlying engineering design:

| Aspect | Consumer IoT (smart home, wearables, cities) | Industrial IIoT |
|---|---|---|
| Failure consequence | Minor user inconvenience, temporary service loss | Line shutdown, equipment destruction, physical injury |
| Asset lifecycle | 2 to 5 years | 15 to 30 years |
| Hardware landscape | Newly deployed, homogeneous sensors | Heterogeneous legacy machines, vintage fieldbuses |
| Availability requirements | Intermittent connectivity tolerated | Uninterrupted 24/7 manufacturing; deterministic degraded modes |
| Cybersecurity posture | Focus on data privacy and application access | Process safety, operational continuity, air-gap preservation |
| Network connectivity | Direct commodity internet routing common | Multi-tiered segmented OT networks; outbound-only restricted links |
| Enterprise integration | Mobile apps and public cloud backends | Bridging operational technology (OT) with enterprise IT |

This comparative framing represents an engineering synthesis (opinion), rather than a formal standard taxonomy. The practical rule: **IIoT does not displace deterministic industrial control**; it is built *alongside* field controllers, extracting telemetry and, in select workflows, providing supervisory setpoints without ever assuming responsibility for fundamental machine safety.

## Core components of an IIoT architecture

**Smart sensors and connected instrumentation.** Field devices that combine physical measurement with self-diagnostics and digital bus interfaces. In many brownfield plants, the vast majority of valuable operational data already exists inside existing controllers (PLCs, variable frequency drives, process instruments); extracting it via software interfaces is often far more cost-effective than installing redundant instrumentation.

**Industrial edge gateways.** Hardened appliances situated at the perimeter between machine control networks and higher enterprise tiers. They translate field protocols (Modbus, PROFINET, EtherNet/IP, OPC UA), normalize disparate data structures, and publish structured telemetry upwards. Commercial implementations illustrate this role: Microsoft's Azure IoT Operations OPC UA connector establishes managed sessions with plant OPC UA servers and publishes normalized metrics into local MQTT brokers deployed at the edge; in the AWS ecosystem, the IoT SiteWise OPC UA collector on AWS IoT Greengrass serves an analogous gateway function. These proprietary platforms illustrate design patterns rather than an endorsement.

**Edge computing.** Compute located in close physical proximity to the machine: high-frequency filtering, edge aggregation, local threshold alerting, store-and-forward buffers, and lightweight ML model inference. Edge computing slashes WAN bandwidth consumption, provides single-digit millisecond response times for local supervisory decisions, and guarantees operational continuity during cloud outages.

**Cloud infrastructure.** Long-term telemetry archiving, cross-facility benchmarking, model training pipelines, executive business intelligence dashboards, and ERP integration. The cloud scales storage and compute effortlessly, but introduces mandatory network dependency and recurring operational expense.

**Telemetry messaging and ingestion.** The predominant messaging paradigm is publish-subscribe over MQTT (covered in article 06), frequently combined with the Sparkplug specification to standardize topic hierarchies, state engines, and metric payloads, or OPC UA PubSub. Azure IoT Operations architecture documentation, for example, illustrates a tiered, layered network topology with local message brokers operating at each Purdue model level, terminating traffic locally rather than establishing long-haul tunnels straight to public clouds.

## Concrete example: edge data processing

The core principle of edge computing is reducing data volume before pushing bits over external links. The Python implementation below, **executed locally with synthetic data** (10 minutes of simulated temperature readings at 1 Hz with gaussian noise and an overheating excursion in the final minute), demonstrates two essential edge filtering techniques: deadband filtering (report by exception) and time-window aggregation.

```python
import statistics

def deadband(samples, band):
    """Emits only when the value leaves the deadband relative to the last transmitted sample."""
    last, out = None, []
    for ts, v in samples:
        if last is None or abs(v - last) >= band:
            out.append((ts, v)); last = v
    return out

def aggregate(samples, window_s=60):
    wins = {}
    for ts, v in samples:
        wins.setdefault(ts // window_s * window_s, []).append(v)
    return [{"window_start": w, "n": len(vs), "min": min(vs), "max": max(vs),
             "avg": round(statistics.fmean(vs), 2)} for w, vs in sorted(wins.items())]
```

In execution, 600 raw incoming samples collapsed down to 45 transmission events following a 0.5 °C deadband filter, and into 10 summary records across 1-minute aggregation windows; the window starting at 540 seconds was the only interval exhibiting a maximum reading above 185 °C. Because these numbers reflect synthetic noise and random seeds, **they do not represent real-world plant bandwidth savings**. The takeaway is architectural: tuning deadband thresholds and aggregation window sizes represents an explicit engineering trade-off between network bandwidth and telemetry fidelity, which must be calibrated against downstream analytical requirements. A local emergency shutdown rule requires raw unbuffered samples; long-term trend analysis requires aggregated windows; post-incident forensic audits require high-resolution raw buffers retained temporarily on edge storage.

## Designing the pipeline: acquisition, edge processing, and cloud metrics

A sequential decision roadmap for industrial IoT deployments:

1. **What is the exact business question?** "How much downtime did line 3 suffer this week, and what were the root stoppage codes?" requires fundamentally different telemetry than "what is the vibration spectrum of bearing B-12?" The business question dictates sample frequency, fidelity, and contextual metadata.
2. **What data already exists?** Cycle counters, equipment states, and alarms almost certainly reside in PLC data blocks. Audit controller tag tables and communication interfaces before purchasing supplemental hardware.
3. **Context must precede volume.** Telemetry lacking machine IDs, work order bindings, and lot numbers is near worthless for business analytics. Correlate machine events with the MES (articles 03 and 05).
4. **What runs on the edge?** Data normalization, source timestamping, local store-and-forward caching, threshold alerting, and downsampling.
5. **What travels over the WAN and how?** Structured messaging with delivery acknowledgments, consumer idempotency, and versioned schemas.
6. **Where do analytical metrics reside?** A central data lake or corporate warehouse with optimized time-series and relational storage, as detailed in [article 08](/pt/blog/bancos-de-dados-industriais-eventos-de-producao).
7. **Who consumes the output?** Line operators require sub-second local HMIs; plant managers need shift-level summaries; reliability engineers demand full raw history.

### Realistic architecture (illustrative)

<figure>
  <img src="/images/blog/iiot-industria-4-0-arquiteturas-edge-nuvem-diagrama.webp" alt="Diagram showing the plant (PLCs, local MES, and edge gateway) connected via outbound-only MQTT over TLS to a central cloud platform handling ingestion, storage, dashboards, and enterprise integration." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Illustrative IIoT architecture connecting plant edge gateways to a central platform. Diagram by the author.</figcaption>
</figure>

Three critical architectural decisions underpin this topology:

- **Strict outbound-only connectivity.** The edge gateway initiates outbound TLS connections toward the message broker; the cloud platform never initiates inbound connections into the industrial control network. This aligns with defensive OT zoning (article 10).
- **On-premise MES autonomy.** Manufacturing execution and shop floor dispatching do not depend on external cloud uptime.
- **Two-speed data paths.** Hard-real-time alarms and closed-loop control reside on the edge; cross-plant benchmarking and predictive machine learning models run in the cloud.

## Digital twins

A **digital twin** is a digital model of a physical asset or industrial process, continuously synchronized with real-world sensor streams and used for operational simulation, monitoring, and optimization. The **ISO 23247** series establishes an international digital twin framework for manufacturing; according to catalog metadata, Part 1 (2021) establishes foundational overviews, principles, terminology, and requirements, covering discrete, batch, and continuous manufacturing. In Europe, the **RAMI 4.0** (Reference Architectural Model Industrie 4.0, DIN SPEC 91345:2016) framework defines a three-dimensional model structuring cyber-physical assets across life cycles and technical hierarchies, formalizing the concept of the Asset Administration Shell (AAS).

In commercial reality, "digital twin" spans an enormous spectrum, ranging from a basic 2D dashboard mirroring machine states to complex thermodynamic multi-physics simulations fed by real-time telemetry. When evaluating vendor proposals, the litmus test is: *what concrete operational decision does this model enable that was previously impossible, and with what level of fidelity?*

## Predictive maintenance and advanced analytics

Predictive maintenance aims to forecast machine degradation before catastrophic failure occurs by analyzing condition indicators (bearing vibration, thermal signatures, motor current draw, cycle durations). The ISO 13381-1 standard (third edition, 2025) outlines requirements and processes for developing **prognostics**, emphasizing required telemetry, failure modes, and degradation modeling. Two pragmatic engineering caveats (my reading, not verbatim quotes from the standard):

- **Failure telemetry is exceedingly scarce.** Prognostic machine learning models require labeled training datasets demonstrating real component degradation, but well-maintained enterprise machinery rarely fails. Without extensive historical failure libraries, anomaly detection (identifying statistically significant deviations from healthy operational baselines) is generally far more achievable than predicting exact Remaining Useful Life (RUL).
- **Alerts must trigger automated workflows.** An anomaly model that fires alerts without integration into Computerized Maintenance Management Systems (CMMS) or production schedules will be dismissed by maintenance staff as unvalidated alarm fatigue.

Regarding **artificial intelligence** in industrial manufacturing: applications such as automated computer vision for defect inspection, vibration anomaly detection, and closed-loop parameter tuning are actively deployed, but they depend heavily on clean data pipelines, process engineering validation, and continuous model drift monitoring. Unverified marketing claims touting arbitrary efficiency gains without baseline measurement context should be treated with skepticism.

## Business benefits, technical constraints, and operational costs

**Tangible benefits:** immediate visibility into line stoppages and micro-stoppages, end-to-end component traceability, cross-facility performance benchmarking, elimination of paper shift sheets, and baseline infrastructure for advanced process modeling.

**Technical constraints and cost trade-offs:**

- **Data normalization and context.** Ingesting brownfield machines and legacy PLCs constitutes the vast majority of project labor.
- **Latency versus cloud dependency.** Real-time machine actions must remain on local controllers; cloud layers serve analytical insight, not real-time physical control.
- **Ongoing cloud operating costs.** Telemetry ingestion, cold storage retention, and analytical compute generate recurring operational expenditures; model annual data volume before finalizing ingestion schemas.
- **Expanded cybersecurity attack surface.** Every new networked gateway introduces potential vulnerabilities. Outbound-only connectivity, network micro-segmentation, mutual TLS, and lifecycle patch management for edge operating systems are mandatory engineering requirements (article 10).
- **Organizational ownership.** Performance dashboards only generate ROI when plant teams are designated and empowered to act on discovered anomalies.
- **Vendor platform lock-in.** Proprietary industrial cloud suites accelerate initial prototyping, but tightly couple ingestion payloads to proprietary APIs. Open standards (OPC UA companion specs, MQTT Sparkplug) substantially mitigate this migration friction.

## Hybrid architectures

Virtually every production-grade industrial deployment adopts a hybrid architectural model: hard-real-time machine control and MES dispatching remain strictly local; telemetry aggregation and filtering occur at a plant-level edge tier; cross-facility analytics, long-term archiving, and compute-heavy AI training run in centralized clouds. Pure "cloud-only" topologies are non-starters for mission-critical industrial manufacturing, while pure "local-only" stacks limit cross-plant optimization. The boundary between edge and cloud is a conscious architectural decision governed by network latency, operational cost, data residency regulations, and plant survival requirements during WAN blackouts.

## Relationship with software engineering

In my view, industrial IoT initiatives stumble less from raw technical limitations and more from three common architectural oversights: collecting uncontextualized data streams, failing to designate operational owners for new metrics, and underestimating the integration complexity of vintage automation hardware. From a software engineering standpoint, foundational software disciplines apply directly: consumer idempotency, edge store-and-forward buffers, source timestamping, versioned contract schemas, pipeline observability, and testing against simulated PLC endpoints.

## Conclusion

At its core, IIoT and Industry 4.0 represent the disciplined, structured integration of shop floor machine data with enterprise software and cloud analytics. A dependable architecture keeps machine control on deterministic hardware, processes high-frequency signals on local edge gateways, streams contextualized aggregates to the cloud, and treats industrial cybersecurity as a core constraint from day one. Successful outcomes depend far less on marketing buzzwords than on well-defined business goals and properly contextualized machine telemetry.

The final article in this series explores the discipline that underpins this entire ecosystem: [industrial cybersecurity](/pt/blog/ciberseguranca-industrial-plc-scada-mes).

## References

This article is a study based on the sources below. Passages marked as opinion reflect my own reading. Code was executed locally using synthetic telemetry; architecture diagrams are illustrative.

- Microsoft. [What is Azure IoT Operations?](https://learn.microsoft.com/en-us/azure/iot-operations/overview-iot-operations), [Data flows](https://learn.microsoft.com/en-us/azure/iot-operations/connect-to-cloud/overview-dataflow), and [Layered network](https://learn.microsoft.com/en-in/Azure/iot-operations/manage-layered-network/concept-layered-network). Commercial platform reference.
- AWS. [IoT SiteWise OPC UA collector, AWS IoT Greengrass](https://docs.aws.amazon.com/greengrass/v2/developerguide/iotsitewise-opcua-collector-component.html). Commercial platform reference.
- ISO. [ISO 23247-1:2021, Digital twin framework for manufacturing](https://scc-ccn.ca/standardsdb/standards/8177207) (catalog metadata; normative clauses not directly extracted).
- DIN. [DIN SPEC 91345:2016-04, RAMI 4.0](https://www.din.de/en/wdc-beuth:din21:250940128) (catalog).
- ISO. [ISO 13381-1:2025, Prognostics, General guidelines and requirements](https://www.iso.org/standard/88029.html) (catalog).
- OASIS. [MQTT Version 5.0](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html); Eclipse Foundation. [Sparkplug](https://www.eclipse.org/tahu/spec/sparkplug_spec.pdf).
- OPC Foundation. [OPC 10000-1](https://reference.opcfoundation.org/specs/OPC-10000-1/full) and [OPC 10000-14 (PubSub)](https://reference.opcfoundation.org/specs/OPC-10000-14/full).
