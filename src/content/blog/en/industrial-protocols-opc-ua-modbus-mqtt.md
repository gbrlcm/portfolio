---
title: "OPC UA, Modbus, MQTT, and Industrial Protocols Compared"
description: "Modbus, OPC UA, MQTT, PROFINET, EtherNet/IP, EtherCAT, and CANopen serve different needs. With real packet structures and a PLC-gateway-backend architecture."
pubDate: 2026-10-31T11:30:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/protocolos-industriais-opc-ua-modbus-mqtt.webp"
coverAlt: "Illustration of a PLC connected via Modbus to an edge gateway, which connects via MQTT to a backend, displaying a Modbus TCP hexadecimal frame"
category: "Industrial Automation"
tags:
  - "OPC UA"
  - "Modbus"
  - "MQTT"
  - "PROFINET"
  - "Industrial Protocols"
  - "Industrial Automation Series"
draft: false
lang: "en"
translationKey: "industrial-protocols-opc-ua-modbus-mqtt"
---

When someone announces "we are going to integrate the machine with the software platform," the first engineering question must be: **integrate how, and with what guarantees?** Industrial protocols are not minor variations of a single concept. Some exist to synchronize a servo motor every fraction of a millisecond; others read a 16-bit register from a power meter; others stream telemetry from thousands of assets into cloud infrastructure. Treating them as interchangeable is one of the most common pitfalls for software engineers entering industrial automation.

This is the sixth article in the series. It builds directly upon the [layered software architecture](/en/blog/software-architecture-modern-factory) and the [comparison between MES, ERP, SCADA, and historians](/en/blog/mes-erp-scada-historian-differences-and-integration).

## Three distinct concepts often conflated

Before comparing them, it is essential to distinguish between three concepts:

1. **Communication protocol.** Governs how bytes travel across the wire: frame framing, addressing, timing, handshake, and error detection. Examples: Modbus, MQTT, the OPC UA binary transport.
2. **Integration / architectural pattern.** Defines interaction models and architectural roles: client-server, publish-subscribe, endpoint discovery, cryptographic session negotiation. OPC UA encompasses both a protocol and a full architectural framework.
3. **Information model.** Defines the semantic *meaning* of the payload: that a specific variable represents a temperature, expressed in degrees Celsius, belonging to a designated equipment asset, conforming to a strict data type. Modbus provides virtually none of this (a register is merely an opaque 16-bit integer; semantic interpretation is found only in the vendor's manual). OPC UA provides a standardized, strongly typed, extensible information model.

None of these are programming languages. Automation languages (Ladder Logic, Structured Text, C#, Python) invoke software libraries that implement these protocol specifications.

## Client-server versus publish-subscribe

In the **client-server** model, the consumer requesting data polls (or establishes a point-to-point subscription with) the endpoint hosting it. Modbus and standard OPC UA operate this way. It is straightforward to conceptualize, but the client must know the network address of every server, and each concurrent client introduces compute overhead on resource-constrained embedded field controllers.

In **publish-subscribe** (PubSub), data producers publish telemetry to topics or channels; consumers subscribe without direct awareness of individual publishers. Typically, an intermediary broker decouples the endpoints. This is the core paradigm of MQTT. OPC UA also defines a PubSub extension (Part 14 of the specification), which, according to the OPC Foundation, leverages the exact same underlying information model as client-server OPC UA. Publishers typically run within OPC UA servers and subscribers in clients, though this topology is flexible.

## Modbus: simple, ancient, and still ubiquitous

**Modbus** is an application-layer request-response protocol designed in the late 1970s for PLC communication. Variants operate over serial links (Modbus RTU and Modbus ASCII) and Ethernet (Modbus TCP, operating on IANA port 502). Data is strictly categorized into four memory banks: *coils* (discrete binary outputs), *discrete inputs* (binary read-only inputs), *input registers* (16-bit read-only words), and *holding registers* (16-bit read-write words). The specification defines explicit function codes, such as `0x03` (Read Holding Registers) and `0x10` (Write Multiple Registers).

What Modbus **lacks**: a native information model (register mappings must be decoded from vendor PDFs), report-by-exception eventing (clients must continuously poll), and, in its foundational RFC-style specification, native authentication or encryption. This does not make Modbus obsolete; it makes it suited for constrained microcontrollers and isolated air-gapped field networks. Security extensions (Modbus Security) exist in separate specifications, which were not evaluated in depth for this article.

A concrete Modbus TCP frame example: a request to read 3 holding registers starting at address 0 from slave (unit ID) 1:

```text
00 01   00 00   00 06   01   03   00 00   00 03
 │       │       │      │    │     │       └ quantity: 3 registers
 │       │       │      │    │     └ starting address: 0
 │       │       │      │    └ function 0x03: Read Holding Registers
 │       │       │      └ unit ID
 │       │       └ length of remaining frame (6 bytes)
 │       └ protocol identifier (0 = Modbus)
 └ transaction identifier
```

And the corresponding response containing values 2, 0, and 1234:

```text
00 01   00 00   00 09   01   03   06   00 02   00 00   04 D2
                                  └ 6 data bytes: 2, 0, 1234 (0x04D2)
```

A 32-bit counter spans two consecutive 16-bit registers, and the word endianness (big-endian vs. little-endian word order) **varies by hardware manufacturer**. This is a classic industrial pitfall, illustrating the consequence of an absent semantic information model.

## OPC UA: architecture and semantic information models

**OPC UA** (Unified Architecture), maintained by the OPC Foundation, is a multi-part specification (the OPC 10000 series, also standardized under IEC 62541). Part 1 outlines core concepts, while Parts 1 through 5 specify foundational mechanics. It unifies:

- **Address space and information modeling**: nodes (variables, objects, methods) equipped with formal data types, semantic relationships, and metadata attributes organized in hierarchical *namespaces*. Industry consortia publish standardized domain models (*companion specifications*), such as the ISA-95 model (OPC 10030) discussed in the previous article.
- **Services**: reading, writing, browsing the node graph, method execution, change-driven event subscriptions, and historical telemetry access (Part 11).
- **Security architecture**: Part 2 details end-to-end security, including encrypted communication channels, application-level X.509 certificates, user authentication tokens, and per-endpoint security policies (such as None, Sign, and SignAndEncrypt).
- **Transport bindings**: binary TCP (`opc.tcp`) is standard on the shop floor; WebSockets and PubSub bindings over UDP or MQTT are also defined.

In real-world architectures, OPC UA acts as the primary interoperability bridge between Level 2 automation (modern PLCs exposing embedded OPC UA servers) and upper-level IT systems (SCADA, MES, historians, and IoT gateways). **A crucial engineering reality: OPC UA server support inside a PLC depends on the CPU model, licensing, and firmware version; it is not universally available.**

A Python client implementation using the `asyncua` library (tested locally against an emulated OPC UA server running on the same host):

```python
from asyncua import Client

async with Client("opc.tcp://127.0.0.1:4840/plant") as c:
    ns = await c.get_namespace_index("urn:example:plant")
    node = await c.nodes.objects.get_child([f"{ns}:BOT-01", f"{ns}:GoodCount"])
    print(await node.read_value())          # point-in-time read

    class H:
        def datachange_notification(self, node, val, data):
            print("changed to", val)       # change notification

    sub = await c.create_subscription(100, H())   # 100 ms interval
    await sub.subscribe_data_change(node)
```

The contrast with Modbus is sharp: the client discovers and accesses data by symbolic node path and namespace (not arbitrary register offsets) and **subscribes** to value changes asynchronously instead of polling. In a production deployment, this client must configure TLS certificates (SignAndEncrypt mode), network retry policies, and telemetry quality inspections.

## MQTT: lightweight message broker transport

**MQTT** is a lightweight publish-subscribe messaging protocol standardized by OASIS (version 5.0 approved in March 2019, succeeding version 3.1.1 from 2014). Clients connect to a centralized message broker, publish payloads to hierarchical string topics (for instance, `plant/line1/BOT-01/telemetry`), and subscribe using hierarchical filters including wildcards. The specification provides three Quality of Service delivery guarantees (QoS 0, 1, and 2), message retention, and *Last Will and Testament* (LWT) hooks to detect unexpected client disconnection.

What standard MQTT **does not** define: the payload encoding format or the semantic data schema (payloads are opaque byte arrays carrying JSON, Protocol Buffers, or CBOR). To address this gap in industrial environments, the Eclipse Foundation maintains the **Sparkplug** specification (version 3.0.0, released November 2022). Sparkplug standardizes a structured topic namespace, mandates Protobuf payloads, and defines an explicit state engine managing node birth and death announcements (NBIRTH, NDEATH, DBIRTH, DDEATH) alongside report-by-exception eventing. Sparkplug is an application-layer profile built on top of MQTT, not a native feature of core MQTT.

MQTT is widely adopted for streaming shop floor telemetry into centralized enterprise platforms and cloud data lakes because the broker cleanly decouples edge devices from analytical consumers. It is not designed for closed-loop high-speed machine control. Security in MQTT relies on transport-layer TLS combined with broker client authentication and topic authorization policies; QoS levels dictate message delivery retries, not cryptographic security.

## Fieldbuses and industrial Ethernet

These deterministic protocols operate at the lowest levels of the factory hierarchy—interconnecting PLCs, servo drives, distributed I/O blocks, and intelligent instrumentation with strict timing constraints. Below are high-level overviews based on maintainer documentation; exact performance envelopes and compliance requirements should be verified against standard texts:

- **PROFINET** (PI): industrial Ethernet maintained by PROFIBUS & PROFINET International (PI). PI documentation categorizes communication into RT (Real-Time), IRT (Isochronous Real-Time), and TSN, advertising cycle times as low as 31.25 µs through fast hardware forwarding and packet fragmentation. This represents vendor consortium specifications; actual latency depends heavily on network topology and silicon support.
- **EtherNet/IP** (ODVA): combines standard unmodified Ethernet and TCP/IP with the Common Industrial Protocol (CIP) at upper layers, leveraging UDP for cyclic implicit I/O messaging. ODVA conducts formal interoperability conformance testing, requiring vendors to execute licensing agreements to incorporate the technology. Note the nomenclature: "IP" stands for *Industrial Protocol*, not Internet Protocol.
- **EtherCAT** (EtherCAT Technology Group): an active master broadcasts an Ethernet frame that traverses all slave nodes sequentially; each node processes input/output data "on the fly" in hardware before forwarding the packet, and the final physical slave bounces the frame back. This topology guarantees microsecond-level determinism. Standardized under IEC 61158 and IEC 61784, it is dominant in synchronized multi-axis motion control.
- **CANopen** (CAN in Automation): an application-layer protocol running on Controller Area Network (CAN) buses, specified in CiA 301 (standardized as EN 50325-4, per CiA). It defines an Object Dictionary indexed by 16-bit IDs and 8-bit sub-indexes, Process Data Objects (PDOs) for real-time cyclic data, Service Data Objects (SDOs) for configuration, and Network Management (NMT) state machines. Common in automated guided vehicles (AGVs), off-highway machinery, and embedded motion controllers.
- **Serial communication**: RS-232 and RS-485 physical transceivers continue to carry Modbus RTU and proprietary point-to-point protocols across legacy field equipment.

Two practical observations: (1) protocol adoption on machine tooling is overwhelmingly determined by the **PLC vendor ecosystem** rather than abstract technical preference; (2) the distinction between **open standards** and **consortium-controlled technologies** matters: Modbus is open-spec; EtherNet/IP requires ODVA licensing agreements; OPC UA is an OPC Foundation specification also ratified as an IEC standard; MQTT is an OASIS standard and Sparkplug belongs to Eclipse.

## Latency, determinism, and reliability

"Real-time" denotes radically different operational expectations across the stack:

- **Motion control and closed high-speed loops** (cycle times from microseconds to single-digit milliseconds): domain of EtherCAT, PROFINET IRT, and equivalent fieldbuses with deterministic cyclic packet scheduling. Missing a packet deadline represents a critical control loop failure.
- **Controller-to-supervisory communication** (tens to hundreds of milliseconds): OPC UA, Modbus TCP, implicit EtherNet/IP messaging. Occasional jitter or retransmissions are completely tolerable.
- **MES telemetry and enterprise/cloud integration** (seconds): MQTT, OPC UA PubSub, REST APIs. This is asynchronous monitoring, not machine control.

Any protocol riding over standard commodity TCP/IP is non-deterministic by definition: transmission latencies depend on network switch buffer queues, collisions, and packet retransmissions. This is not a technical defect; it is a fundamental architectural trade-off. **A recurring software design flaw is attempting to use a protocol designed for cloud telemetry in a function that demands deterministic hard real-time execution.**

## Interoperability: open standards versus proprietary silos

Interoperability across heterogeneous vendor equipment improves substantially at semantic information layers (OPC UA companion specifications, Sparkplug over MQTT) compared to the fieldbus level, where hardware vendor lock-in remains intense. Even with OPC UA, default PLC information models frequently expose vendor-specific naming conventions that necessitate explicit normalization layers. Open standards reduce long-term platform lock-in, but they do not eliminate the engineering effort required for protocol mapping.

## Concrete architectural example: PLC, gateway, backend, and MES

A **hypothetical** telemetry ingestion pipeline executed locally with software emulators: a PLC (simulated by a Modbus TCP server) exposes operating state and part counts for machine BOT-01; an edge gateway polls the registers, normalizes the payload, and publishes via MQTT; a backend service consumes the topic to ingest events into the MES.

```text
PLC (Modbus TCP)  ──poll──►  Edge Gateway  ──MQTT──►  Broker  ──►  Backend  ──►  MES
  holding regs 0..2           normalizes               │            (validates,
  [state, count_hi, count_lo] and publishes            │             deduplicates,
                                                       │             persists)
                                plant/line1/BOT-01/telemetry
```

The edge gateway implementation in Python using `pymodbus` and `paho-mqtt` (tested against an emulated Modbus server and local MQTT broker):

```python
plc = AsyncModbusTcpClient("127.0.0.1", port=5020)
await plc.connect()
rr = await plc.read_holding_registers(0, count=3, device_id=1)
state, hi, lo = rr.registers
counter = (hi << 16) | lo          # 32 bits across two registers

msg = {"machine": "BOT-01", "ts": int(time.time() * 1000),
       "state": {0: "STOPPED", 1: "IDLE", 2: "RUNNING"}.get(state, "UNKNOWN"),
       "count": counter, "quality": "GOOD"}
client.publish("plant/line1/BOT-01/telemetry", json.dumps(msg), qos=1)
```

The payload ingested by the backend consumer during testing:

```json
{"machine": "BOT-01", "ts": 1793470222958, "state": "RUNNING", "count": 1234, "quality": "GOOD"}
```

Crucial software engineering decisions lie beyond this snippet:

- **Register mapping schemas and word endianness** must be documented and version-controlled: the edge gateway is precisely where raw unformatted bytes gain domain semantics.
- **Timestamping at the physical origin** (or as close to the edge as possible), ensuring network buffering does not skew downstream time series or OEE calculations.
- **Idempotency and deduplication** in backend consumers: MQTT QoS 1 guarantees at-least-once delivery, meaning duplicate frames are expected; consumers must handle duplicates using composite keys (such as machine ID plus source timestamp), as demonstrated in [article 03](/en/blog/what-is-mes-manufacturing-execution-system).
- **Edge store-and-forward buffers** to survive plant network outages without dropping telemetry frames.
- **Explicit data quality flags**: the `quality` attribute exists because a failed fieldbus read and a literal numeric reading of zero represent completely different physical realities.
- **Delta-based counting logic**: cumulative counter rollovers and connection drops require backends to calculate production via differential delta logic rather than assuming an unbroken monotonic sequence.

## Security and authentication

In summary, without exploring deep OT cybersecurity architecture (covered in article 10): vanilla Modbus lacks authentication and encryption, relying entirely on physical or VLAN network isolation; OPC UA embeds X.509 certificate validation, secure channel encryption, and user authorization tokens, which must be **actively configured** (running with "None" security is permitted by the standard and common in dev setups); MQTT relies on TLS transport and broker access control lists; EtherNet/IP supports CIP Security, which helps organizations align with IEC 62443. Having security primitives available in a specification does not imply they are enabled in a physical plant.

## Relationship with software engineering

In my view, the cardinal rule is to isolate the **core business domain** from the **underlying communication protocol**. Software that models work orders, production lots, and quality inspections must never contain references to Modbus register addresses or OPC UA node IDs; edge adaptors must translate between the two worlds. This decoupling allows changing protocols without touching business logic, enables automated integration testing via mock controllers, and standardizes error recovery. Furthermore, engineers must treat the physical edge as intrinsically untrusted: hardware readings can fail, arrive out of order, duplicate, or produce corrupt out-of-range values. [Article 07](/en/blog/software-engineering-for-manufacturing) dives into the architecture of these edge adapters.

## Conclusion

Modbus, OPC UA, MQTT, and fieldbus protocols address fundamentally distinct challenges: simple register transfers, semantic system-to-system integration, decoupled enterprise messaging, and deterministic sub-millisecond machine control. The right question is never "which protocol is superior," but rather "what timing deadlines, semantic richness, cybersecurity requirements, and vendor constraints govern this specific architectural boundary." Answering this layer by layer and formalizing interface contracts prevents the majority of industrial integration failures.

## References

This article is a study based on the sources below. Passages marked as opinion reflect my own reading. Code snippets were executed locally using simulated test servers and brokers, not live physical machinery.

- OPC Foundation. [OPC 10000-1, Overview and Concepts](https://reference.opcfoundation.org/specs/OPC-10000-1/full); [OPC 10000-2, Security](https://reference.opcfoundation.org/v105/Core/docs/Part2/); [OPC 10000-14, PubSub](https://reference.opcfoundation.org/specs/OPC-10000-14/full); [OPC 10030, ISA-95](https://reference.opcfoundation.org/specs/OPC-10030/4.2.3).
- OASIS. [MQTT Version 5.0](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html), OASIS Standard, 2019.
- Eclipse Foundation. [Sparkplug Specification](https://www.eclipse.org/tahu/spec/sparkplug_spec.pdf). Cited details derived from secondary summaries; verify version 3.0.0 in the official text.
- Modbus Organization. Modbus Application Protocol Specification V1.1b3, at modbus.org. The frame structure example conforms to the standard MBAP + PDU format; consult the official specification for exact function code definitions.
- EtherCAT Technology Group. [Technology](https://www.ethercat.org/en/technology.html).
- ODVA. [EtherNet/IP](https://www.odva.org/technology-standards/key-technologies/ethernet-ip/).
- PI (PROFIBUS & PROFINET International). [PROFINET](https://www.profibus.com/technologies/profinet).
- CAN in Automation. [CANopen profiles](https://www.can-cia.org/can-knowledge/canopen-profiles) and [PDO protocol](https://www.can-cia.org/can-knowledge/pdo-protocol); CiA 301.
- NIST. [SP 800-82 Rev. 3](https://csrc.nist.gov/pubs/sp/800/82/r3/final), for OT security context.
