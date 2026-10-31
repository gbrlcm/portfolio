---
title: "OPC UA, Modbus, MQTT y protocolos industriales, comparados"
description: "Modbus, OPC UA, MQTT, PROFINET, EtherNet/IP, EtherCAT y CANopen tienen propósitos distintos. Con tramas reales y un ejemplo de PLC, pasarela y backend."
pubDate: 2026-10-31T11:30:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/protocolos-industriais-opc-ua-modbus-mqtt.webp"
coverAlt: "Ilustración de un PLC conectado por Modbus a una pasarela, que se comunica por MQTT con un backend, mostrando una trama Modbus TCP en hexadecimal"
category: "Automatización Industrial"
tags:
  - "OPC UA"
  - "Modbus"
  - "MQTT"
  - "PROFINET"
  - "Protocolos Industriales"
  - "Serie Automatización Industrial"
draft: false
lang: "es"
translationKey: "industrial-protocols-opc-ua-modbus-mqtt"
---

Cuando alguien plantea "vamos a integrar la máquina con el sistema informático", la primera pregunta de ingeniería debería ser: **¿integrar cómo y con qué garantías?** Los protocolos industriales no son variantes cosméticas de un mismo producto. Algunos están concebidos para sincronizar un servomotor cada fracción de milisegundo; otros leen un registro de 16 bits de un analizador de redes; otros transportan telemetría de miles de máquinas hacia la nube. Tratarlos como equivalentes es uno de los errores más comunes de quienes se aproximan a la automatización desde el desarrollo de software.

Este es el sexto artículo de la serie. Se apoya en la [arquitectura de software en capas](/es/blog/arquitectura-de-software-fabrica-moderna) y en la [comparativa entre MES, ERP, SCADA e historiadores](/es/blog/mes-erp-scada-historian-diferencias-e-integracion).

## Tres conceptos diferentes que suelen confundirse

Antes de comparar opciones, conviene delimitar tres niveles conceptuales:

1. **Protocolo de comunicación.** Define cómo viajan los bytes: formato de trama, direccionamiento, temporizaciones y gestión de errores. Ejemplos: Modbus, MQTT o el transporte binario de OPC UA.
2. **Patrón de integración / arquitectura.** Establece los roles y modelos de interacción: cliente-servidor, publicación-suscripción (PubSub), descubrimiento de servicios y negociación criptográfica. OPC UA constituye, al mismo tiempo, un protocolo de transporte y un marco arquitectónico completo.
3. **Modelo de información.** Define el *significado* de los datos: que una variable determinada representa una temperatura, en grados Celsius, perteneciente a un equipo concreto y con un tipo de dato estricto. Modbus prácticamente carece de esto (un registro es simplemente un entero de 16 bits; el significado reside en una tabla técnica en el manual del fabricante). OPC UA posee un modelo de información explícito, semántico y ampliable.

Ninguno de ellos es un lenguaje de programación. Los lenguajes industriales o convencionales (Ladder, Structured Text, C#, Python) utilizan librerías que implementan dichos estándares.

## Cliente-servidor frente a publicación-suscripción

En el modelo **cliente-servidor**, el componente que requiere el dato lo solicita (o se suscribe punto a punto) directamente al dispositivo que lo custodia. Modbus y la operativa estándar de OPC UA funcionan de este modo. Es un esquema sencillo de razonar, pero el cliente debe conocer la dirección de red de cada servidor, y cada cliente adicional genera mayor consumo de procesamiento en autómatas de recursos limitados.

En **publicación-suscripción** (PubSub), el productor emite mensajes hacia un tema (topic) o canal; los consumidores se suscriben sin necesidad de conocer la identidad física del emisor. Generalmente interviene un intermediario central (*broker*). Este es el paradigma natural de MQTT. OPC UA también especifica un modo PubSub (parte 14 de la norma) que, según la OPC Foundation, reutiliza exactamente el mismo modelo de información semántico del modo cliente-servidor; típicamente un publicador opera sobre un servidor OPC UA y un suscriptor sobre un cliente, aunque la topología admite variaciones.

## Modbus: sencillo, veterano y omnipresente

**Modbus** es un protocolo de nivel de aplicación basado en petición-respuesta, diseñado a finales de los años 70 para la comunicación con autómatas programables. Existen variantes sobre enlace serie (Modbus RTU y ASCII) y sobre TCP/IP (Modbus TCP, en el puerto IANA 502). La memoria de datos se estructura en cuatro tablas: *coils* (salidas discretas de 1 bit), *discrete inputs* (entradas de 1 bit de solo lectura), *input registers* (registros de 16 bits de solo lectura) y *holding registers* (registros de 16 bits de lectura y escritura). La especificación establece códigos de función definidos, como `0x03` (leer holding registers) y `0x10` (escribir múltiples registros).

Lo que Modbus **no** ofrece: modelo de información semántico (la interpretación de cada dirección debe extraerse de tablas en PDF), transmisión por excepción (el cliente está obligado a realizar polling cíclico) y, en su especificación base, autenticación y cifrado. Esto no lo invalida; lo hace idóneo para microcontroladores simples y redes de campo aisladas. Existen especificaciones complementarias de seguridad (Modbus Security), no evaluadas en detalle para este artículo.

Un ejemplo práctico de trama Modbus TCP: una solicitud para leer 3 holding registers a partir de la dirección 0 del dispositivo (unit ID) 1:

```text
00 01   00 00   00 06   01   03   00 00   00 03
 │       │       │      │    │     │       └ cantidad: 3 registros
 │       │       │      │    │     └ dirección inicial: 0
 │       │       │      │    └ función 0x03: Read Holding Registers
 │       │       │      └ unit ID
 │       │       └ longitud del resto de la trama (6 bytes)
 │       └ identificador de protocolo (0 = Modbus)
 └ identificador de transacción
```

Y la correspondiente respuesta con valores 2, 0 y 1234:

```text
00 01   00 00   00 09   01   03   06   00 02   00 00   04 D2
                                  └ 6 bytes de datos: 2, 0, 1234 (0x04D2)
```

Un contador de 32 bits requiere dos registros consecutivos de 16 bits, y el orden de palabras (*word endianness*: palabra alta o baja en primer lugar) **varía según el fabricante**. Constituye un clásico error en planta y un ejemplo evidente de la ausencia de modelo de información intrínseco.

## OPC UA: arquitectura y modelos de información semánticos

**OPC UA** (Unified Architecture), desarrollado por la OPC Foundation, es una especificación modular en múltiples partes (serie OPC 10000, estandarizada internacionalmente como IEC 62541). La parte 1 expone los conceptos fundamentales; las partes 1 a 5 definen el núcleo. Reúne:

- **Espacio de direcciones y modelo de información**: nodos (variables, objetos, métodos) con tipos de datos estrictos, relaciones ontológicas y metadatos organizados en espacios de nombres (*namespaces*). Consorcios sectoriales publican modelos estandarizados (*companion specifications*), como la especificación para ISA-95 (OPC 10030) analizada en el artículo anterior.
- **Servicios**: lectura, escritura, exploración jerárquica de nodos, invocación de métodos remotos, suscripciones por cambio de valor y consulta de datos históricos (parte 11).
- **Seguridad**: la parte 2 describe la arquitectura criptográfica, que contempla canales seguros cifrados, certificados digitales X.509 para identificar aplicaciones, autenticación de usuarios y perfiles de seguridad por endpoint (como None, Sign y SignAndEncrypt).
- **Transportes**: el transporte binario sobre TCP (`opc.tcp`) es la norma en planta; también se contemplan enlaces sobre WebSockets y PubSub sobre UDP o MQTT.

En la arquitectura fabril, OPC UA suele actuar como enlace entre los autómatas (PLCs con servidor OPC UA embebido, cuando el hardware lo admite) y los niveles superiores (SCADA, MES, historiadores y pasarelas). **Conviene subrayar: la disponibilidad de un servidor OPC UA en un autómata depende del modelo de CPU, las licencias y la versión de firmware; no es una característica universal.**

Un ejemplo de uso en Python con la librería `asyncua` (probado localmente frente a un servidor simulado en la misma máquina):

```python
from asyncua import Client

async with Client("opc.tcp://127.0.0.1:4840/planta") as c:
    ns = await c.get_namespace_index("urn:ejemplo:planta")
    nodo = await c.nodes.objects.get_child([f"{ns}:ENV-01", f"{ns}:ContadorBuenas"])
    print(await nodo.read_value())          # lectura puntual

    class H:
        def datachange_notification(self, node, val, data):
            print("cambió a", val)       # notificación por cambio

    sub = await c.create_subscription(100, H())   # intervalo de 100 ms
    await sub.subscribe_data_change(nodo)
```

La diferencia frente a Modbus es determinante: el cliente navega por nombres simbólicos y espacios de nombres (no por números de registro arbitrarios) y **se suscribe** asíncronamente a cambios en lugar de realizar consultas cíclicas por sondeo. En producción, este script requeriría configurar certificados X.509 (modo SignAndEncrypt), reconexión automática y verificación de los flags de calidad del valor.

## MQTT: mensajería ligera con broker

**MQTT** es un protocolo de mensajería de publicación-suscripción estandarizado por OASIS (versión 5.0 ratificada en marzo de 2019, que amplía la versión 3.1.1 de 2014). Los clientes se conectan a un broker centralizado, publican mensajes en temas jerárquicos (por ejemplo, `planta/linea1/ENV-01/telemetria`) y se suscriben mediante patrones que admiten comodines (*wildcards*). La especificación ofrece tres niveles de calidad de servicio (QoS 0, 1 y 2), retención de mensajes y mecanismos de última voluntad (*last will and testament*) para alertar ante caídas abruptas de conexión.

Lo que MQTT estándar **no** normaliza: el formato de la carga útil ni el significado semántico de las variables (transporta bytes opacos, típicamente en JSON, Protocol Buffers o CBOR). Para resolver esta carencia en la industria, la Eclipse Foundation promueve la especificación **Sparkplug** (versión 3.0.0, de noviembre de 2022). Sparkplug estandariza una taxonomía de temas, payloads estructurados en Protobuf y un ciclo de vida con mensajes de estado de nodo (NBIRTH, NDEATH, DBIRTH, DDEATH) y transmisión por excepción. Sparkplug es una capa de perfil industrial que se apoya sobre MQTT, no una función integrada en MQTT básico.

MQTT destaca al transmitir telemetría desde la planta industrial hacia plataformas centrales y servicios en la nube, ya que el broker desacopla físicamente productores y consumidores. No está concebido para lazos rápidos de control cerrado. La seguridad en MQTT descansa sobre cifrado TLS en el transporte y control de accesos en el broker; los niveles de QoS regulan reintentos de entrega, no la seguridad criptográfica.

## Redes de campo y Ethernet industrial

Estos protocolos se sitúan en el estrato inferior, comunicando autómatas, servoaccionamientos, módulos de E/S distribuida e instrumentación con restricciones temporales estrictas. A continuación se resumen sus características según la documentación técnica de sus organizaciones; los detalles de rendimiento deben contrastarse en las especificaciones oficiales:

- **PROFINET** (PI): red basada en Ethernet industrial gestionada por PROFIBUS & PROFINET International (PI). La documentación de PI clasifica la comunicación en RT (Real-Time), IRT (Isochronous Real-Time) y TSN, indicando ciclos teóricos de hasta 31,25 µs mediante conmutación hardware y fragmentación. Representa la especificación del consorcio; el rendimiento operativo efectivo está ligado al hardware y a la topología física.
- **EtherNet/IP** (ODVA): combina Ethernet estándar y TCP/IP sin modificaciones con el protocolo CIP (Common Industrial Protocol) en las capas superiores, admitiendo tráfico UDP para intercambio cíclico de variables. La ODVA gestiona ensayos de conformidad obligatorios y exige a los fabricantes acuerdos de licencia para comercializar equipos compatibles. Obsérvese el acrónimo: "IP" alude a *Industrial Protocol*, no a Internet Protocol.
- **EtherCAT** (EtherCAT Technology Group): un controlador maestro emite una trama Ethernet que recorre en anillo todos los dispositivos esclavos; cada nodo procesa y actualiza sus datos "al vuelo" (*processing on the fly*) a nivel de silicio, y el último esclavo físico devuelve la trama. Este esquema proporciona un determinismo estricto en microsegundos. Está normalizado bajo IEC 61158 e IEC 61784, siendo el estándar de referencia en control de movimiento multieje.
- **CANopen** (CAN in Automation): capa de aplicación sobre el bus CAN, regulada en CiA 301 (estandarizada como EN 50325-4, según CiA). Estructura los datos en un Diccionario de Objetos indexado por claves de 16 bits y subíndices de 8 bits, Objetos de Datos de Proceso (PDOs) para variables en tiempo real y Objetos de Datos de Servicio (SDOs) para configuración. Muy extendido en robótica móvil (AGVs), maquinaria pesada y actuadores embebidos.
- **Comunicaciones serie**: interfaces físicas RS-232 y RS-485 continúan canalizando Modbus RTU y protocolos propietarios en maquinaria instalada.

Dos reflexiones prácticas: (1) la adopción de un bus de campo suele venir condicionada por el **fabricante del PLC** y el catálogo de periféricos disponibles, más que por una elección abstracta; (2) la diferencia entre **estándar abierto** y **tecnología tutelada por consorcio** es relevante: Modbus es de acceso público; EtherNet/IP requiere licencia de la ODVA; OPC UA es un estándar de la OPC Foundation refrendado como norma IEC; MQTT es estándar OASIS y Sparkplug pertenece a Eclipse.

## Latencia, determinismo y fiabilidad

El concepto de "tiempo real" engloba realidades operativas dispares:

- **Control de movimiento y lazos ultrarrápidos** (ciclos de microsegundos a milisegundos simples): dominio reservado a EtherCAT, PROFINET IRT y redes equivalentes con determinismo cíclico estricto. Incumplir un plazo de transmisión supone un fallo crítico en la máquina.
- **Comunicación entre controlador y supervisión** (decenas a cientos de milisegundos): OPC UA, Modbus TCP o mensajería implícita en EtherNet/IP. Una fluctuación temporal ocasional resulta tolerable.
- **Telemetría e integración con MES/nube** (segundos): MQTT, OPC UA PubSub y APIs REST. Representa tareas de monitorización asíncrona, no de control en bucle cerrado.

Cualquier protocolo que opere sobre la pila TCP/IP convencional no es determinista por diseño: los tiempos de entrega dependen de la latencia de conmutadores, colas y retransmisiones por congestión. No es un defecto técnico, es un compromiso arquitectónico diferente. **Un error frecuente de diseño consiste en utilizar una tecnología pensada para telemetría en la nube para una función que exige control determinista.**

## Interoperabilidad: protocolos abiertos frente a ecosistemas cerrados

La interoperabilidad entre fabricantes heterogéneos es sustancialmente mayor en los niveles semánticos (OPC UA con especificaciones complementarias, Sparkplug sobre MQTT) que en las redes de bus de campo, donde la dependencia del hardware propietario es acusada. Incluso con OPC UA, es habitual que el modelo expuesto por el autómata responda a nomenclaturas internas del fabricante y precise normalización. Adoptar estándares abiertos mitiga la cautela tecnológica (*vendor lock-in*), pero no suprime la labor de ingeniería de integración.

## Ejemplo práctico: PLC, pasarela, backend y MES

Un escenario **hipotético** ejecutado en pruebas locales con simuladores de software: un PLC (emulado mediante un servidor Modbus TCP) publica el estado y el contador de la máquina ENV-01; una pasarela (gateway) interroga los registros, normaliza la carga y la publica vía MQTT; un servicio de backend consume el mensaje para persistirlo en el MES.

```text
PLC (Modbus TCP)  ──sondeo──►  Pasarela  ──MQTT──►  Broker  ──►  Backend  ──►  MES
  holding regs 0..2            normaliza             │           (valida,
  [estado, cont_hi, cont_lo]   y publica             │            deduplica,
                                                     │            almacena)
                                 planta/linea1/ENV-01/telemetria
```

La pasarela de enlace en Python utilizando `pymodbus` y `paho-mqtt` (probada con un servidor Modbus simulado y un broker MQTT local):

```python
plc = AsyncModbusTcpClient("127.0.0.1", port=5020)
await plc.connect()
rr = await plc.read_holding_registers(0, count=3, device_id=1)
estado, hi, lo = rr.registers
contador = (hi << 16) | lo          # 32 bits en dos registros

msg = {"machine": "ENV-01", "ts": int(time.time() * 1000),
       "state": {0: "STOPPED", 1: "IDLE", 2: "RUNNING"}.get(estado, "UNKNOWN"),
       "count": contador, "quality": "GOOD"}
client.publish("planta/linea1/ENV-01/telemetria", json.dumps(msg), qos=1)
```

El mensaje capturado por el servicio backend durante la prueba:

```json
{"machine": "ENV-01", "ts": 1793470222958, "state": "RUNNING", "count": 1234, "quality": "GOOD"}
```

Las decisiones técnicas más determinantes se sitúan fuera de estas líneas de código:

- **Mapeo de registros y orden de bytes** rigurosamente documentados y versionados: la pasarela constituye el punto donde los datos carentes de contexto adquieren significado semántico.
- **Sellado de tiempo en el origen** (o lo más próximo posible a la máquina), para evitar que las latencias de red alteren series temporales y métricas de OEE.
- **Idempotencia y deduplicación** en los consumidores del backend: la entrega con QoS 1 puede generar mensajes duplicados; el backend debe absorberlos sin duplicar producción mediante claves compuestas (máquina e instante temporal), como se vio en el [artículo 03](/es/blog/que-es-mes-manufacturing-execution-system).
- **Almacenamiento intermedio local en la pasarela** (*store-and-forward*) para tolerar interrupciones de red industrial sin pérdida de registros.
- **Atributos explícitos de calidad**: la propiedad `quality` existe porque una lectura fallida en el bus de campo y un valor numérico cero representan realidades físicas completamente distintas.
- **Cálculo de producción por incrementos**: el desbordamiento de contadores y las pérdidas de conexión exigen que el backend calcule piezas por diferencias relativas entre lecturas válidas, evitando presunciones de continuidad monótona.

## Seguridad y autenticación

De forma resumida, sin entrar en la arquitectura de ciberseguridad OT (que aborda el artículo 10): Modbus estándar carece de autenticación y cifrado, dependiendo de la segmentación perimetral de red; OPC UA incorpora certificados digitales, canal cifrado y autenticación de usuarios, elementos que deben ser **explícitamente configurados** (el modo "None" está admitido por la norma y abunda en bancos de pruebas); MQTT se protege mediante TLS y listas de control de acceso en el broker; EtherNet/IP contempla CIP Security para facilitar el cumplimiento de la norma IEC 62443. La presencia de capacidades criptográficas en una norma no garantiza que se encuentren activadas en una instalación industrial real.

## Relación con la ingeniería de software

Desde mi punto de vista, el principio rector reside en aislar el **modelo de dominio** del **protocolo de comunicación**. El código que gestiona órdenes de fabricación, lotes y calidad no debe contener acoplamiento alguno con direcciones de memoria Modbus o identificadores de nodo OPC UA; una capa adaptadora perimetral debe asumir la traducción. Esto facilita sustituir protocolos, simular maquinaria en tests unitarios y homogeneizar el control de errores. Asimismo, conviene tratar los datos de planta como fuentes no confiables: cualquier lectura física puede fallar, llegar demorada, duplicarse o salirse de rango. El [artículo 07](/es/blog/ingenieria-de-software-para-manufactura) profundiza en el diseño de estos adaptadores.

## Conclusión

Modbus, OPC UA, MQTT y los buses de campo resuelven necesidades heterogéneas: transferencia básica de registros, integración semántica entre sistemas, mensajería desacoplada e intercambio determinista entre controladores. La cuestión adecuada no es "qué protocolo es superior", sino "qué requisitos de latencia, semántica, ciberseguridad y compatibilidad exige cada frontera técnica". Delimitar estos criterios por capas y formalizar contratos de interfaz evita la mayor parte de las incidencias en proyectos de integración industrial.

## Referencias

Este artículo es un estudio basado en las fuentes siguientes. Los pasajes marcados como opinión reflejan mi lectura. Los ejemplos de código se ejecutaron localmente con componentes simulados (servidores y broker de prueba), no con maquinaria física real.

- OPC Foundation. [OPC 10000-1, Overview and Concepts](https://reference.opcfoundation.org/specs/OPC-10000-1/full); [OPC 10000-2, Security](https://reference.opcfoundation.org/v105/Core/docs/Part2/); [OPC 10000-14, PubSub](https://reference.opcfoundation.org/specs/OPC-10000-14/full); [OPC 10030, ISA-95](https://reference.opcfoundation.org/specs/OPC-10030/4.2.3).
- OASIS. [MQTT Version 5.0](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html), OASIS Standard, 2019.
- Eclipse Foundation. [Sparkplug Specification](https://www.eclipse.org/tahu/spec/sparkplug_spec.pdf). Los aspectos citados proceden de resúmenes secundarios; consultar la versión 3.0.0 en el documento oficial.
- Modbus Organization. Modbus Application Protocol Specification V1.1b3, en modbus.org. La estructura de la trama sigue el formato MBAP + PDU de la norma; contrastar los códigos de función en el texto oficial.
- EtherCAT Technology Group. [Technology](https://www.ethercat.org/en/technology.html).
- ODVA. [EtherNet/IP](https://www.odva.org/technology-standards/key-technologies/ethernet-ip/).
- PI (PROFIBUS & PROFINET International). [PROFINET](https://www.profibus.com/technologies/profinet).
- CAN in Automation. [CANopen profiles](https://www.can-cia.org/can-knowledge/canopen-profiles) y [PDO protocol](https://www.can-cia.org/can-knowledge/pdo-protocol); CiA 301.
- NIST. [SP 800-82 Rev. 3](https://csrc.nist.gov/pubs/sp/800/82/r3/final), sobre el marco de ciberseguridad en OT.
