---
title: "Arquitectura de software de una fábrica moderna: del sensor al ERP"
description: "Cómo se organizan sensores, PLCs, SCADA, MES, historiadores y ERP, el modelo ISA-95 y el camino de los datos desde la planta hasta el sistema corporativo."
pubDate: 2026-10-31T09:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/arquitetura-de-software-fabrica-moderna.webp"
coverAlt: "Ilustración con cinco capas arquitectónicas de L4 a L0: ERP, MES, PLC y SCADA, sensores y proceso físico, con el MES destacado"
category: "Automatización Industrial"
tags:
  - "Automatización Industrial"
  - "ISA-95"
  - "MES"
  - "SCADA"
  - "PLC"
  - "Serie Automatización Industrial"
draft: false
lang: "es"
translationKey: "software-architecture-modern-factory"
---

Para quienes proceden del desarrollo web o de aplicaciones de gestión corporativa, una fábrica suele parecer una caja negra incomprensible: maquinaria física en un extremo, un ERP en el opuesto y "cierta integración" intermedia. En la práctica, existe una estructura jerárquica de niveles nítidamente delimitada, donde cada estrato opera con responsabilidades, escalas de tiempo y requisitos de ingeniería específicos. Conocer este mapa arquitectónico constituye el requisito indispensable para cualquier desarrollo de software en el sector manufacturero.

Este es el primer artículo de una serie de estudios técnicos sobre automatización industrial e ingeniería de software para manufactura. El objetivo aquí es ofrecer la panorámica general: qué componentes intervienen, qué función desempeña cada uno, cómo viaja la información y qué papel desempeña la norma internacional ISA-95.

## La planta de producción (shop floor)

La planta es el espacio físico donde tiene lugar la fabricación: máquinas, líneas de montaje, cintas transportadoras, reactores, hornos industriales y robots. Desde la perspectiva del software, lo determinante es la frontera que conecta el entorno físico con el digital, articulada mediante tres elementos fundamentales:

- **Sensores e instrumentación:** miden magnitudes físicas (temperatura, presión manométrica, nivel, caudal volumétrico, posición, presencia óptica) y las transforman en señales eléctricas analógicas o digitales.
- **Actuadores:** ejecutan la función inversa, recibiendo órdenes eléctricas para producir un efecto mecánico o térmico (motores, electroválvulas, cilindros neumáticos, resistencias calefactoras).
- **Controladores:** capturan las lecturas de los sensores, ejecutan algoritmos lógicos en tiempo real y gobiernan los actuadores. El equipo más característico es el **PLC** (Programmable Logic Controller, o autómata programable), objeto central del siguiente artículo de la serie.

Esta frontera se materializa mediante señales discretas (todo/nada), señales analógicas (como bucles de corriente de 4–20 mA, estándar ampliamente consolidado en instrumentación) o buses de campo digitales. La propiedad crítica de este nivel reside en su **ejecución determinista de ciclo corto**: el autómata itera su lógica de control ininterrumpidamente, en intervalos del orden de milisegundos, con total independencia de la disponibilidad de las redes informáticas superiores.

## Control, supervisión y ejecución: qué función corresponde a cada sistema

Por encima del control directo de la máquina operan sistemas con responsabilidades bien diferenciadas. Confundir sus funciones es la causa principal de la mayoría de los fallos de integración.

**PLC (control).** Ejecuta la lógica que conmuta salidas físicas en función de las entradas de los sensores. Es un ordenador industrial endurecido con ejecución cíclica predecible. No es un sistema de gestión empresarial: su lógica determina que "si el sensor de presencia se activa, debe encenderse el motor", ignorando "qué pedido comercial de cliente se está procesando".

**HMI (interfaz hombre-máquina).** Terminal visual táctil situada junto a la máquina donde el operario supervisa estados inmediatos y transmite consignas manuales.

**SCADA (supervisión, control y adquisición de datos).** Sistema centralizado que se enlaza a múltiples autómatas para supervisar un proceso continuo o una planta completa: pantallas sinópticas, gestión de alarmas, curvas de tendencia, consignas remotas y registro de datos. SCADA **no es** un PLC: el PLC ejecuta el control de la máquina; el SCADA supervisa la operativa global y adquiere datos de los controladores.

**Historiador de datos (data historian).** Base de datos especializada en series temporales de variables de proceso (muestras de sensores indexadas en el tiempo), dotada de compresión matemática y consultas por intervalos. Suele operar asociado al SCADA o al nivel de operaciones.

**MES (Manufacturing Execution System).** Gobierna y monitoriza la ejecución de la fabricación: órdenes de trabajo activas, registros de producción por turno, trazabilidad y genealogía de lotes, control de calidad, microparadas y OEE. Representa el puente indispensable entre la planificación corporativa y la realidad física de la línea. El artículo 03 lo analiza en detalle.

**ERP.** Sistema de planificación de recursos empresariales: gestión de pedidos comerciales, compras de materias primas, contabilidad de costes, inventario y finanzas. Opera en escalas temporales de días, semanas o meses, sin necesidad de procesar telemetría de máquina en milisegundos.

Una síntesis práctica: el autómata responde a "¿qué debe hacer esta máquina en este instante?"; el SCADA responde a "¿qué ocurre en el conjunto del proceso industrial?"; el MES responde a "¿qué estamos fabricando y a qué ritmo avanza?"; y el ERP responde a "¿qué debemos producir, comprar y entregar para cumplir los compromisos del negocio?".

## El modelo ISA-95 (IEC 62264)

La norma **ISA-95**, ratificada internacionalmente como **IEC/ISO 62264**, regula la integración entre los sistemas de gestión empresarial y los sistemas de control de planta. Su Parte 1 normaliza la terminología y los modelos de objetos para delimitar qué datos se intercambian entre las funciones comerciales, las operaciones de fabricación y el control de campo. Sus partes sucesivas detallan atributos (Parte 2), actividades de gestión de operaciones (Parte 3), modelos de información operativa (Parte 4) y transacciones entre negocio y manufactura (Parte 5). Como norma comercial, las referencias aquí recogidas proceden de documentación técnica abierta y catálogos oficiales de la ISA y la IEC.

El concepto más extendido es su **jerarquía funcional** por niveles, estructurada comúnmente según el modelo descrito por la OPC Foundation:

| Nivel | Rol funcional | Escala temporal representativa | Sistemas representativos |
|---|---|---|---|
| 4 | Planificación empresarial y logística | meses, semanas, días | ERP |
| 3 | Gestión de operaciones de fabricación | días, turnos, horas, minutos, segundos | MES/MOM, calidad, mantenimiento, inventario |
| 2 | Monitorización y control de supervisión | subsegundos | PLC, DCS, SCADA/HMI |
| 1 | Detección física y actuación | — | sensores y actuadores acoplados a controladores |
| 0 | Proceso físico | — | la transformación física de la materia |

Dos advertencias metodológicas:

1. **La ubicación del SCADA varía según las fuentes.** La OPC Foundation sitúa el SCADA dentro de los sistemas del nivel 3, mientras que la literatura técnica de ciberseguridad industrial tiende a encuadrarlo en el nivel 2 (control y supervisión). En la práctica depende de la función: los sinópticos de mando directo pertenecen al nivel 2; la agregación de datos de planta se aproxima al nivel 3.
2. **La numeración de 0 a 4 unifica dos marcos conceptuales.** Frecuentemente se la denomina "modelo Purdue" (en alusión a la arquitectura *Purdue Enterprise Reference Architecture*, PERA), si bien existen discrepancias entre publicaciones sobre qué niveles formaban parte del PERA original frente a incorporaciones posteriores de la comunidad de seguridad. Conviene tratar "Purdue" e "ISA-95" como marcos complementarios y no como sinónimos estrictos.

La norma se centra principalmente en el **intercambio de información entre los sistemas del nivel 3 y en la frontera entre los niveles 3 y 4**, organizado en torno a cuatro entidades básicas: materiales, equipos, activos físicos y personal.

Un matiz arquitectónico determinante: **ISA-95 constituye un modelo funcional y semántico, no un patrón obligatorio de software.** Define qué información fluye entre la planificación y la ejecución y qué actividades residen en cada nivel, sin exigir que cada escalón constituya un software independiente ni imponer tecnologías concretas. Una única plataforma puede abarcar varios niveles, y las arquitecturas contemporáneas (donde las pasarelas envían telemetría directa desde la máquina hacia la nube) flexibilizan la pirámide clásica manteniendo intacta la terminología de la norma.

## Redes y protocolos: comunicación entre niveles

Cada estrato exige redes y protocolos ajustados a sus demandas operativas (desarrollados en el artículo 06):

- **Redes de campo y de control:** interconectan sensores, actuadores, variadores y PLCs. Emplean protocolos deterministas (PROFINET, EtherNet/IP, EtherCAT, Modbus) diseñados para garantizar plazos de latencia estrictos.
- **Redes de supervisión:** comunican controladores con servidores SCADA, historiadores y estaciones de ingeniería.
- **Red corporativa (TI):** infraestructura donde operan el ERP, las bases de datos transaccionales y los servicios de oficina.

Un protocolo de comunicaciones **no es** un lenguaje de programación, y un modelo de información **no es** un protocolo de red. **OPC UA**, por ejemplo, es una arquitectura de integración normalizada por la OPC Foundation (serie OPC 10000 / IEC 62541) que aúna modelado semántico de datos, servicios cliente-servidor y enlaces de transporte binarios y PubSub. Al operar sobre un modelo común, actúa como el puente estándar para trasladar datos desde el control hacia los sistemas superiores.

Entre las redes de operaciones (OT) y las de TI corporativa se aplican políticas estrictas de segmentación mediante zonas desmilitarizadas (DMZ industrial), por motivos de ciberseguridad que detalla el artículo 10.

## Del sensor al ERP: recorrido conceptual de los datos

El siguiente escenario es **hipotético y simplificado**, concebido con fines didácticos sin reproducir una planta específica. Imaginemos una línea de envasado farmacéutico procesando un lote conforme a una orden generada en el ERP corporativo.

<figure>
  <img src="/images/blog/arquitetura-de-software-fabrica-moderna-diagrama.webp" alt="Diagrama con cinco niveles de L4 a L0 (ERP, MES e historiador, PLC y SCADA, sensores y actuadores, proceso físico). Las flechas ascienden con recuentos y eventos, y descienden con órdenes y recetas. A la derecha, cinco fases numeradas desde el sensor hasta el ERP." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Niveles de ISA-95 y trayecto de una medición desde el sensor hasta el ERP (ejemplo hipotético). Diagrama del autor.</figcaption>
</figure>

Secuencia de datos en sentido ascendente:

1. **Medición física.** Un sensor fotoeléctrico detecta el paso de un frasco en el puesto de llenado. La señal eléctrica conmuta un canal de entrada digital en el autómata.
2. **Control determinista.** En su ciclo de scan, el PLC evalúa la entrada física, ejecuta la lógica de control e incrementa un acumulador interno. Si detecta un fallo, conmuta a estado seguro en local, sin depender de redes externas.
3. **Exposición del dato.** El contador y los estados de la máquina quedan expuestos como variables (tags) legibles por un SCADA, historiador o pasarela mediante un protocolo como OPC UA o Modbus TCP.
4. **Registro y supervisión.** El SCADA refleja la cadencia en el panel del operador y vigila umbrales de alarma. El historiador almacena la serie temporal continua.
5. **Contextualización en el MES.** El MES vincula estos eventos numéricos con la orden de fabricación, el lote de materias primas y el turno de trabajo: "estas 12.000 unidades corresponden a la orden OP-1001, lote L-2026-A". El dato adquiere significado de negocio.
6. **Retorno al ERP.** El MES transfiere al nivel 4 las magnitudes consolidadas: unidades producidas, consumos efectivos de materias primas, descarte y cierre de la orden. El ERP ajusta el inventario de producto terminado y recalcula costes.

Dos premisas de diseño emergen en este trayecto. En primer lugar, **cada escalón ascendente reduce la frecuencia temporal y enriquece el contexto semántico**: el PLC computa bits en milisegundos; el ERP procesa totales consolidados por orden de fabricación. En segundo lugar, **el flujo de mando es asimétrico**: las directrices descienden (órdenes, recetas de producción) y los resultados ascienden (recuentos, eventos de parada); la seguridad intrínseca de la máquina nunca debe depender de la conectividad con niveles superiores.

## Desafíos de la convergencia OT/TI

La integración entre la tecnología de operaciones y la tecnología de la información concentra las mayores dificultades en planta, derivadas de diferencias metodológicas y culturales:

- **Prioridades contrapuestas.** En la TI corporativa, la jerarquía clásica prima la confidencialidad, la integridad y la disponibilidad. En el entorno OT, la seguridad física de las personas y la disponibilidad operativa ininterrumpida son prioritarias. La guía NIST SP 800-82 Rev. 3 se orienta precisamente a salvaguardar entornos OT respetando sus exigencias de disponibilidad y determinismo.
- **Ciclos de renovación tecnológica.** La maquinaria industrial opera durante décadas de forma ininterrumpida, y actualizar software exige paradas técnicas programadas con meses de antelación.
- **Heterogeneidad de plataformas.** Una fábrica madura combina autómatas de diferentes marcas, generaciones y buses de campo. Estándares semánticos como OPC UA y la taxonomía ISA-95 reducen la fricción, pero no eliminan la labor de adaptación.
- **Calidad y semántica del dato.** Un valor numérico sin unidades de ingeniería, origen físico contrastado, indicador de calidad o sellado temporal fidedigno induce a error en los análisis corporativos.
- **Tolerancia a fallos parciales.** Cortes de red, reinicios del MES o paradas por mantenimiento del ERP no deben detener la producción física de la planta; los sistemas deben funcionar en modo degradado y conciliar la información posteriormente.

## Relación con la ingeniería de software

Desde mi punto de vista, la conclusión práctica para los desarrolladores en este ámbito radica en respetar los límites de cada capa:

- **No delegar la seguridad o el control de máquina en aplicaciones superiores.** La lógica de control debe residir en el autómata programable, incluso cuando un software superior orqueste la planificación global.
- **Diseñar con desacoplamiento asíncrono.** Emplear colas de mensajes, brokers y almacenamiento intermedio en planta (*store-and-forward*) previene que una incidencia en el ERP detenga la maquinaria física. El artículo 07 profundiza en estos patrones.
- **Modelar el dominio con la taxonomía de la norma.** Utilizar términos como orden, lote, equipo, material y personal (según ISA-95) simplifica la interlocución con los tecnólogos de planta y agiliza la integración con paquetes comerciales.
- **Tratar el modelo de referencia como una guía estructural, no como una imposición rígida.** Lo relevante es que cada entidad de datos cuente con un único sistema propietario de registro, una escala temporal definida y límites de responsabilidad inequívocos.

## Conclusión

Una fábrica moderna no funciona mediante un software monolítico, sino a través de un ecosistema de niveles que operan en escalas temporales sumamente dispares, desde el ciclo de barrido en milisegundos del PLC hasta la planificación contable mensual del ERP. ISA-95 aporta la taxonomía común y los modelos de información para coordinar este flujo sin encorsetar la arquitectura de desarrollo. Comprender qué cometidos asume cada nivel —y sobre todo cuáles **no debe asumir jamás**— permite concebir integraciones industriales resilientes frente a contingencias físicas y mantenibles a largo plazo.

Los siguientes artículos de la serie examinan en profundidad cada componente: [PLCs y lenguajes de programación industrial](/es/blog/plcs-lenguajes-programacion-industrial), el [MES](/es/blog/que-es-mes-manufacturing-execution-system) y los [protocolos de comunicaciones industriales](/es/blog/protocolos-industriales-opc-ua-modbus-mqtt).

## Referencias

Este artículo es un estudio basado en las fuentes siguientes. Los pasajes marcados como opinión reflejan mi lectura. El ejemplo de la línea de envasado es hipotético.

- OPC Foundation. [OPC 10030, 4.2.3 ISA-95](https://reference.opcfoundation.org/specs/OPC-10030/4.2.3), OPC UA for ISA-95 Common Object Model.
- OPC Foundation. [OPC 10000-1, Overview and Concepts](https://reference.opcfoundation.org/specs/OPC-10000-1/full), OPC Unified Architecture.
- OPC Foundation. [OPC 10000-14, PubSub](https://reference.opcfoundation.org/specs/OPC-10000-14/full), OPC Unified Architecture.
- ISA. ANSI/ISA-95.00.01-2010 (IEC 62264-1), *Enterprise-Control System Integration, Part 1: Models and Terminology*. Catálogo: [ANSI Webstore](https://webstore.ansi.org/standards/isa/ansiisa9500012010iec62264mod).
- NIST. [SP 800-82 Rev. 3, Guide to Operational Technology (OT) Security](https://csrc.nist.gov/pubs/sp/800/82/r3/final), septiembre de 2023.
- Siemens. [ISA-95 framework and layers](https://www.sw.siemens.com/en-US/technology/isa-95-framework-layers/) (descripción de fabricante; los niveles 1 y 2 se exponen con mayor libertad que en la norma oficial).
