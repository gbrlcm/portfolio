---
title: "MES, ERP, SCADA e historiadores: diferencias e integración"
description: "Comparativa técnica entre MES, ERP, SCADA e historiadores de datos: qué recibe y produce cada uno, cómo se integran y qué se rompe con una mala integración."
pubDate: 2026-10-31T11:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/mes-erp-scada-historian-diferencas-e-integracao.webp"
coverAlt: "Ilustración con cuatro cajas: ERP, MES, SCADA e Historian, conectadas mediante flechas direccionales"
category: "Automatización Industrial"
tags:
  - "MES"
  - "ERP"
  - "SCADA"
  - "Historian"
  - "Integración de Sistemas Industriales"
  - "Serie Automatización Industrial"
draft: false
lang: "es"
translationKey: "mes-erp-scada-historian-differences-and-integration"
---

En los tres primeros artículos de la serie, cada sistema apareció de forma aislada. En la práctica, los problemas de diseño surgen en las fronteras: ¿Quién es el dueño de la orden de producción? ¿Quién conserva la temperatura del horno de ayer? ¿Quién determina que un lote está bloqueado? Este artículo compara **MES, ERP, SCADA e historiadores** cara a cara, muestra cómo se integran y qué suele fallar.

## Los cuatro sistemas en una frase

- **ERP:** planifica y contabiliza la operativa del negocio (pedidos, inventario, compras, costes). Es el sistema de registro de los datos empresariales.
- **MES:** ejecuta y registra la producción frente al plan (órdenes, lotes, registros de producción, calidad, paradas).
- **SCADA:** supervisa y opera el proceso industrial (pantallas HMI, alarmas, comandos), adquiriendo datos de los controladores.
- **Historiador (data historian):** almacena y sirve series temporales de variables de proceso, ofreciendo compresión y consultas por intervalo temporal.

Una advertencia sobre estas etiquetas: representan **funciones**, no necesariamente **productos independientes**. Un mismo paquete de software puede ofrecer SCADA e historiador integrados; un MES puede incluir captura de datos en planta; un ERP puede incorporar un módulo de taller. ISA-95 organiza las actividades por niveles jerárquicos, no exige la existencia de cuatro productos distintos.

## Qué es SCADA, con precisión

SCADA (*Supervisory Control and Data Acquisition*) es, según la definición ampliamente citada del NIST (guía SP 800-82 original, de 2006), un sistema informatizado capaz de reunir y procesar datos y aplicar controles operativos a largas distancias, típicamente en generación y distribución de energía, redes de suministros y oleoductos/gasoductos. En arquitecturas SCADA, los controladores de campo (RTUs o PLCs) efectúan la captación y el control local, mientras que una estación central presenta los datos al operador y permite enviar consignas de supervisión.

Dos distinciones esenciales:

- **SCADA no es el PLC.** El autómata (PLC) ejecuta la lógica de control en su propio ciclo determinista y continúa operando si el SCADA se cae. El SCADA supervisa, y no debe ser el responsable único de la seguridad física del proceso.
- **SCADA no es el MES.** El SCADA comprende variables (tags), alarmas y estados de equipo; por naturaleza, no tiene noción nativa de órdenes de fabricación, lotes o recetas de negocio.

En plantas continuas y de proceso químico, el rol equivalente suele desempeñarlo un **DCS** (sistema de control distribuido), que integra control y supervisión en un entorno unificado. La literatura sobre ciberseguridad, como NIST SP 800-82 Rev. 3 (2023), engloba SCADA, DCS y PLCs bajo el concepto general de sistemas de control industrial (ICS).

## Qué es un historiador de datos

El historiador (o *data historian*) es una base de datos especializada en **series temporales de proceso**: cada punto (tag) posee un valor, una marca de tiempo (timestamp) y, habitualmente, un indicador de calidad. Tres características lo distinguen de una base de datos relacional estándar:

1. **Ingesta continua de alta frecuencia**, con escrituras casi exclusivamente acumulativas (append-only).
2. **Reducción y compresión de datos a la entrada.** En lugar de almacenar cada lectura idéntica, muchos historiadores filtran fluctuaciones irrelevantes.
3. **Consultas orientadas a intervalos e interpolación:** valor puntual, promedio en un periodo, máximos/mínimos y tendencias.

La documentación de **AVEVA PI System** (producto comercial propietario, citado como ejemplo y no como norma absoluta) describe dos fases: el *exception reporting*, aplicado en la interfaz de adquisición con una banda muerta (deadband) simple, y la *compression*, aplicada en el archivo de almacenamiento con el algoritmo *swinging door*, que evalúa la pendiente de la señal en lugar de una banda fija. La misma documentación aconseja no comprimir datos manuales o acumuladores prefijados, y validar empíricamente cualquier cambio de compresión comparando curvas de tendencia, ya que su impacto acumulativo es difícil de prever. La consecuencia técnica fundamental: **lo que se consulta en un historiador suele ser una reconstrucción interpolada** de la señal original. Esto resulta crítico en análisis que dependen de transiciones de estado precisas.

En el ámbito de los estándares abiertos, **OPC UA** cuenta con la parte 11, *Historical Access*, que define el modelo de información estandarizado para consultar datos históricos; los servicios operativos residen en la parte 4 y las funciones de agregación (mínimo, máximo, promedio, etc.) en la parte 13. La edición 2020 de IEC 62541-11 figura en los catálogos técnicos consultados, aunque su estatus normativo varía entre organismos, por lo que conviene contrastar la edición vigente en cada proyecto.

## Tabla comparativa

| | ERP | MES | SCADA | Historiador |
|---|---|---|---|---|
| **Pregunta principal** | ¿Qué producir, comprar y entregar? | ¿Qué se está produciendo y cómo fue? | ¿Qué está pasando en el proceso? | ¿Cómo se comportó el proceso en el tiempo? |
| **Nivel ISA-95** | 4 | 3 | 2 a 3 (según fuente y función) | 2 a 3 (variable) |
| **Recibe** | pedidos, registros consolidados del MES | órdenes del ERP, eventos y recuentos de planta | variables de PLCs, comandos del operador | variables y eventos (de SCADA, pasarelas, PLCs) |
| **Produce** | órdenes, compras planificadas, costes | registros de producción, genealogía, KPIs | pantallas, alarmas, comandos, tags | series temporales consultables |
| **Escala temporal** | días a meses | minutos a turnos | segundos | milisegundos a años (retención histórica) |
| **Modelo de datos** | relacional, transaccional | relacional, transaccional | memoria de variables en tiempo real | series temporales comprimidas |
| **Criticidad temporal**| baja | media | media a alta | baja en lectura, alta en ingesta |
| **Fallo típico** | retraso en la planificación | línea sin consignas o sin trazabilidad | operador sin visibilidad del proceso | lagunas en las series de datos |
| **Dueño del dato** | maestros de producto, órdenes, saldos | producción ejecutada y trazabilidad | estado instantáneo del proceso | histórico continuo de variables |

La asignación de SCADA e historiadores al nivel 2 o 3 varía según la fuente. La documentación de la OPC Foundation sobre ISA-95, por ejemplo, sitúa SCADA e historiadores dentro de los sistemas del nivel 3.

## Cómo se comunican

Cada límite arquitectónico emplea patrones de integración habituales:

- **Control ↔ SCADA:** protocolos industriales. Los más comunes son OPC UA, Modbus, PROFINET y EtherNet/IP, además de controladores propietarios de cada fabricante. El artículo 06 trata este ámbito.
- **SCADA ↔ Historiador:** normalmente a través de conectores nativos o mediante OPC UA. Con frecuencia, el historiador adquiere datos directamente de los controladores, sin intermediación del SCADA.
- **Control/SCADA/Historiador ↔ MES:** eventos y valores agregados. El MES no requiere el ruido bruto de cada sensor a 10 ms; necesita recuentos de piezas, transiciones de estado y ventanas temporales vinculadas a órdenes de trabajo. Suele implementarse mediante OPC UA, mensajería asíncrona (MQTT, colas) o integración en base de datos.
- **MES ↔ ERP:** transacciones de negocio: liberación de órdenes de fabricación, notificación de consumos y producto terminado. La parte 5 de ISA-95 regula estas transacciones; las implementaciones prácticas adoptan APIs REST, colas de mensajes o transferencias estructuradas de archivos.

Los datos que deben **compartirse** entre capas exigen identificadores homogéneos (orden, lote, máquina, código de material), sincronización horaria precisa y atributos de calidad del dato (válido, estimado, con fallo). Sin identificadores canónicos unificados, la integración degenera en un mapeo manual frágil.

### Un ejemplo concreto: correlación de proceso y producción

Una aplicación representativa de integración entre historiador y MES consiste en vincular las variables de proceso con la orden correspondiente. El siguiente ejemplo **hipotético** muestra el concepto en SQL: las muestras de temperatura (tabla `tag_sample`, procedentes del historiador) se cruzan con el intervalo de ejecución de cada orden (`order_run`, originada en el MES), descartando lecturas de mala calidad. Se ejecutó en PostgreSQL 17 con anterioridad a su publicación.

```sql
CREATE TABLE tag_sample (
  tag text NOT NULL, ts timestamptz NOT NULL,
  value double precision NOT NULL, quality text NOT NULL DEFAULT 'GOOD',
  PRIMARY KEY (tag, ts));
CREATE TABLE order_run (
  erp_order_no text, machine text, started_at timestamptz, ended_at timestamptz);

SELECT o.erp_order_no, count(*) AS muestras,
       round(avg(s.value)::numeric, 1) AS media, max(s.value) AS maximo
FROM order_run o
JOIN tag_sample s
  ON s.tag = o.machine || '.horno.temp'
 AND s.ts >= o.started_at AND s.ts < o.ended_at
 AND s.quality = 'GOOD'
GROUP BY o.erp_order_no;
```

Generando lecturas sintéticas cada 10 minutos entre las 08:00 y las 10:00, con dos muestras marcadas con fallo, la consulta entrega 10 registros válidos (12 en total menos 2 erróneos). La lección de ingeniería: **la agregación temporal solo es fiable si los relojes de los servidores están estrictamente sincronizados** y el MES almacena con exactitud los instantes de inicio y fin. En entornos industriales reales, este análisis suele delegarse al historiador o a un almacén de analítica avanzada, donde la nomenclatura de variables, los husos horarios y los intervalos abiertos o cerrados resultan determinantes.

## Arquitectura integrada, de extremo a extremo

Un esquema conceptual **ilustrativo**, que no pretende ser una arquitectura obligatoria:

<figure>
  <img src="/images/blog/mes-erp-scada-historian-diferencas-e-integracao-diagrama.webp" alt="Diagrama con ERP en la parte superior, MES debajo, una capa de integración (OPC UA, pasarela, colas) y, en la base, historiador, SCADA y PLCs conectados a dicha capa." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Arquitectura integrada ilustrativa de ERP, MES, SCADA e historiador. Diagrama del autor.</figcaption>
</figure>

Flujo de extremo a extremo: el ERP libera la orden de fabricación; el MES la planifica y suministra las recetas; el PLC ejecuta la maquinaria y publica variables; el SCADA supervisa la operativa y el historiador registra las series continuas; la capa de integración transfiere al MES recuentos, estados y alarmas; el MES consolida la producción y envía al ERP volúmenes fabricados, materias primas consumidas y estado final.

### Bases de datos en cada capa

- **Relacionales** (PostgreSQL, SQL Server, Oracle y similares): ERP y MES, donde priman las transacciones ACID, la integridad referencial y las consultas estructuradas.
- **Historiadores industriales:** concebidos para almacenar millones de tags con compresión *swinging door* y filtrado de banda muerta; habitualmente productos comerciales acompañados de amplias librerías de controladores industriales.
- **Bases de datos de series temporales de propósito general** (como InfluxDB o TimescaleDB): alternativas de código abierto evaluadas cada vez más en la industria, que plantean compromisos en términos de conectividad nativa OT, algoritmos de interpolación y herramientas de planta. El artículo 08 analiza estas opciones.

## Qué se rompe cuando la integración es deficiente

- **Duplicidad de fuentes maestras.** Catálogos de productos y rutas operativas mantenidos en dos sistemas con datos que divergen.
- **Identificadores discordantes.** El ERP hace referencia a "OP-1001", el MES utiliza "ORD1001" y el historiador desconoce ambos códigos.
- **Relojes no sincronizados.** Eventos registrados fuera de su secuencia física real, lo que desvirtúa los indicadores de rendimiento.
- **Pérdida o duplicación de mensajes.** En ausencia de mecanismos idempotentes y confirmaciones explícitas, un corte de red computa la producción dos veces o la pierde.
- **Acoplamiento rígido.** El MES se detiene porque el ERP corporativo entró en mantenimiento; la maquinaria en planta frena porque falló un servicio web superior.
- **Datos huérfanos de contexto.** Cifras numéricas sin unidad de medida, sin flag de calidad o sin vinculación a la máquina origen.
- **Cálculos de KPI discordantes.** Cada departamento y aplicación midiendo el OEE con fórmulas y consideraciones distintas.
- **Vulneración de responsabilidades.** Delegar la seguridad operativa o el control en tiempo real en sistemas ofimáticos carentes de determinismo temporal.

## Relación con la ingeniería de software

Desde mi punto de vista, la recomendación práctica reside en concebir las integraciones con **contratos explícitos**: modelos de datos canónicos, definiciones inequívocas de marcas de tiempo y calidad, consumo de eventos idempotente, reintentos seguros y observabilidad continua. La taxonomía de ISA-95 proporciona un lenguaje ubicuo indispensable, mientras que los estándares abiertos (como las especificaciones de información de OPC UA) mitigan los mapeos manuales improvisados. Asimismo, cada estrato tecnológico debe contar con una **política de degradación elegante**: qué decisiones operativas puede tomar la línea de producción cuando los servicios superiores quedan inaccesibles. El [artículo 07](/pt/blog/engenharia-de-software-para-manufatura) profundiza en esta perspectiva arquitectónica.

## Conclusión

ERP, MES, SCADA e historiadores abordan preguntas diferentes, operan en escalas temporales distintas y gestionan modelos de datos dispares. Los fallos rara vez ocurren en el núcleo interno de cada aplicación; casi siempre se originan en sus interfaces de unión: sincronización temporal, calidad del dato, coherencia de identificadores y claridad en la titularidad de la información. El diseño de una integración industrial robusta exige definir de antemano la propiedad de cada entidad y prever el comportamiento aislado de cada capa ante la caída de las demás.

## Referencias

Este artículo es un estudio basado en las fuentes siguientes. Los pasajes marcados como opinión reflejan mi lectura. La arquitectura y la consulta SQL son ilustrativas.

- AVEVA. [Exception reporting attributes (UniInt Framework)](https://docs.aveva.com/bundle/pi-universal-interface-uniint-framework/page/1026196.html) y [Data Archive administration](https://docs.aveva.com/bundle/pi-server-da-admin/page/1022865.html), documentación del PI System. Descripción de un producto específico.
- IEC. [IEC 62541-11:2020, OPC Unified Architecture, Part 11: Historical Access](https://webstore.iec.ch/publication/61129). Consulta limitada al catálogo.
- NIST. [SP 800-82 Rev. 3, Guide to Operational Technology (OT) Security](https://csrc.nist.gov/pubs/sp/800/82/r3/final), 2023. La definición de SCADA citada procede de la guía original de 2006, [NIST SP 800-82](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-82.pdf), sustituida por revisiones posteriores.
- OPC Foundation. [OPC 10030, 4.2.3 ISA-95](https://reference.opcfoundation.org/specs/OPC-10030/4.2.3).
- ISA. [ISA-95 Standard: Enterprise-Control System Integration](https://www.isa.org/standards-and-publications/isa-standards/isa-95-standard).
