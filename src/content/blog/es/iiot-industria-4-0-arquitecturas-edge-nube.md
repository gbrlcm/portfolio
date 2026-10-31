---
title: "IIoT e Industria 4.0: arquitecturas con edge y nube"
description: "Qué diferencia a IIoT de IoT, cómo diseñar la captación entre edge y nube, el papel de MQTT y OPC UA, gemelos digitales, mantenimiento predictivo y costes reales."
pubDate: 2026-10-31T13:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/iiot-industria-4-0-arquiteturas-edge-nuvem.webp"
coverAlt: "Ilustración de una planta industrial con un PLC y una pasarela edge destacada, conectada mediante flecha a una plataforma en la nube"
category: "Automatización Industrial"
tags:
  - "IIoT"
  - "Industria 4.0"
  - "Edge Computing"
  - "MQTT"
  - "Digital Twin"
  - "Serie Automatización Industrial"
draft: false
lang: "es"
translationKey: "iiot-industry-4-0-edge-cloud-architectures"
---

"Industria 4.0" es una denominación que arrastra más carga de marketing que de rigor técnico. Sin embargo, tras la retórica comercial existe una transformación técnica indiscutible: máquinas y sistemas de planta que operaban en silos aislados comienzan a exponer telemetría mediante protocolos estandarizados, alimentando flujos de procesamiento distribuidos entre la periferia (*edge*) y la nube. El desafío de ingeniería radica en estructurar esta conectividad sin poner en riesgo la continuidad de la producción.

Este es el noveno artículo de la serie. El propósito aquí es deslindar lo que constituye arquitectura sólida de lo que representa mera promesa comercial.

## IIoT e IoT convencional no son equivalentes

El **IIoT** (Internet Industrial de las Cosas) traslada los paradigmas de IoT al entorno fabril, pero los requisitos operativos transforman por completo el diseño de los sistemas:

| Aspecto | IoT convencional (domótica, consumo, ciudades) | IIoT industrial |
|---|---|---|
| Consecuencia de un fallo | Molestia para el usuario, pérdida puntual de servicio | Parada de producción, daños en maquinaria, lesiones físicas |
| Ciclo de vida del activo | 2 a 5 años | Frecuentemente 15 a 30 años |
| Parque de dispositivos | Sensores nuevos, modernos y homogéneos | Maquinaria legada, heterogénea y buses industriales |
| Requisitos de disponibilidad | Tolera desconexiones transitorias | Operativa 24/7 ininterrumpida; modos degradados previstos |
| Enfoque de ciberseguridad | Privacidad de datos y autenticación de usuarios | Seguridad funcional, protección del proceso y aislamiento |
| Conectividad de red | Salida directa a internet habitual | Redes OT segmentadas en niveles; tráfico saliente restringido |
| Integración de sistemas | Aplicaciones móviles y backends en la nube | Convergencia entre tecnología de operaciones (OT) y TI |

Esta matriz comparativa constituye una síntesis propia (opinión), no una clasificación normativa formal. El criterio rector en planta: **el IIoT no sustituye al control industrial**; se construye *en paralelo* a él, captando datos y, en casos específicos, transmitiendo consignas de supervisión sin asumir jamás la responsabilidad directa de la seguridad física de la maquinaria.

## Componentes de una arquitectura IIoT

**Sensores inteligentes e instrumentación conectada.** Dispositivos de campo que combinan la medición física con capacidades de autodiagnóstico y comunicación digital por bus. En muchas plantas maduras, la inmensa mayoría de las variables útiles ya está disponible en la memoria de los autómatas (PLCs, variadores de frecuencia, controladores de proceso); acceder a ellas mediante software resulta más viable que instalar sensores redundantes.

**Pasarelas industriales (edge gateways).** Equipos reforzados situados en la frontera entre las redes de control de planta y las redes superiores. Traducen protocolos industriales (Modbus, PROFINET, EtherNet/IP, OPC UA), normalizan las estructuras de datos y publican telemetría estructurada. Ejemplos en plataformas comerciales: el conector OPC UA de Azure IoT Operations de Microsoft gestiona sesiones con servidores OPC UA de planta y publica métricas normalizadas en un broker MQTT local en el edge; en el entorno de AWS, el colector OPC UA de IoT SiteWise para Greengrass desempeña una función análoga. Constituyen desarrollos comerciales que ilustran patrones de integración, no recomendaciones comerciales.

**Edge computing (computación en el perímetro).** Procesamiento ejecutado en proximidad física a la máquina: filtrado de alta frecuencia, agregaciones temporales, evaluación de alarmas locales, buffers de almacenamiento ante desconexión (*store-and-forward*) e inferencia ligera de modelos analíticos. Disminuye drásticamente el consumo de ancho de banda WAN, garantiza tiempos de respuesta de milisegundos y asegura la continuidad operativa frente a caídas de internet.

**Infraestructura en la nube.** Almacenamiento histórico masivo, comparativas de rendimiento entre distintas fábricas, pipelines de entrenamiento de modelos, cuadros de mando corporativos e integración con el ERP empresarial. Ofrece escalabilidad ilimitada, pero introduce una dependencia obligatoria de la conectividad y un coste operativo continuo.

**Mensajería y transporte de telemetría.** El estándar dominante es la publicación-suscripción sobre MQTT (analizado en el artículo 06), frecuentemente articulado con la especificación Sparkplug para homogeneizar taxonomías de temas, estados de dispositivos y formatos de carga, o mediante OPC UA PubSub. La documentación de Azure IoT Operations describe una topología por capas, con brokers locales en cada estrato de red que retienen y gestionan el tráfico localmente en lugar de canalizarlo directamente a la nube pública.

## Ejemplo práctico: procesamiento en el edge

La premisa de la computación en el edge reside en condensar los datos antes de transmitirlos por enlaces externos. El fragmento siguiente en Python, **ejecutado en entorno local con datos sintéticos** (10 minutos de lecturas de temperatura a 1 Hz con ruido aleatorio y un incremento anómalo en el último minuto), muestra dos técnicas de reducción habituales: banda muerta (*deadband*, transmisión por excepción) y agregación por ventanas temporales.

```python
import statistics

def deadband(samples, band):
    """Solo emite cuando el valor sale de la banda respecto al último transmitido."""
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

En la prueba, las 600 muestras iniciales se redujeron a 45 tras aplicar un filtro de banda muerta de 0,5 °C y a 10 registros agregados de 1 minuto; la ventana temporal iniciada en 540 s fue la única con lecturas máximas por encima de 185 °C. Dado que estos cálculos provienen de datos simulados, **no constituyen mediciones de ahorro de ancho de banda en una instalación industrial real**. La conclusión es arquitectónica: ajustar el ancho de banda muerta o el tamaño de las ventanas representa una decisión técnica que equilibra volumen de datos y fidelidad analítica, y debe decidirse según las necesidades de los consumidores finales. Una alerta de seguridad requiere la muestra puntual en bruto; una gráfica de tendencias a largo plazo aprovecha la agregación; una auditoría forense posterior precisa de históricos completos retenidos temporalmente en el edge.

## Diseño de la solución: captar, procesar localmente y publicar indicadores

Hoja de ruta secuencial para desplegar proyectos de telemetría industrial:

1. **¿Qué pregunta de negocio se pretende responder?** Conocer "¿cuánto tiempo pasan detenidas las máquinas y por qué causas?" plantea exigencias de captura muy distintas a "¿cuál es el espectro de vibración del rodamiento principal?". La necesidad operativa determina variables, frecuencias y metadatos contextuales.
2. **¿Qué información reside ya en los controladores?** Contadores de ciclos, estados operativos y códigos de fallo suelen estar disponibles en los autómatas. Conviene verificar direcciones de memoria y protocolos antes de presupuestar sensores externos.
3. **El contexto debe anteceder al volumen.** Mediciones sin vincular a un identificador de máquina, orden de fabricación y lote carecen de valor analítico. Es imprescindible correlacionar los eventos de máquina con el MES (artículos 03 y 05).
4. **¿Qué procesos residen en la pasarela edge?** Normalización semántica, sellado de tiempo en origen, almacenamiento en cola local, filtrado de alarmas y agregación.
5. **¿Qué información se transmite y bajo qué protocolo?** Mensajería estructurada con confirmación de entrega, idempotencia en el destino y contratos de datos versionados.
6. **¿Dónde residen los indicadores?** En una plataforma centralizada (nube o centro de datos corporativo) dotada de motores de series temporales y modelos relacionales, según lo desarrollado en el [artículo 08](/pt/blog/bancos-de-dados-industriais-eventos-de-producao).
7. **¿Quién consume las métricas?** Los operarios en planta precisan paneles en tiempo real; los directores de producción requieren resúmenes por turno; los ingenieros de fiabilidad demandan series temporales detalladas.

### Arquitectura realista (ilustrativa)

<figure>
  <img src="/images/blog/iiot-industria-4-0-arquiteturas-edge-nuvem-diagrama.webp" alt="Diagrama de la planta industrial (PLCs, MES local y pasarela edge) conectada exclusivamente mediante conexiones salientes MQTT sobre TLS a una plataforma centralizada que gestiona ingesta, almacenamiento, cuadros de mando e integración corporativa." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Arquitectura IIoT ilustrativa integrando pasarelas edge y plataforma centralizada. Diagrama del autor.</figcaption>
</figure>

Tres decisiones de diseño destacan en este esquema:

- **Conexiones estrictamente salientes.** La pasarela de planta abre la conexión cifrada hacia el intermediario; la nube jamás inicia conexiones entrantes hacia la red de control. Es un principio básico de defensa perimetral (artículo 10).
- **MES local autónomo.** La ejecución física de la fabricación no se interrumpe si se pierde el enlace con la nube.
- **Flujos a dos velocidades.** Lazos de control y alarmas inmediatas se procesan en la planta; analítica avanzada y modelos predictivos se ejecutan en la plataforma central.

## Gemelos digitales (digital twins)

Un **gemelo digital** es una representación virtual de un activo o proceso físico, sincronizada de forma continua con los datos operativos reales y utilizada para simulación, monitorización y optimización. La serie de normas **ISO 23247** define un marco metodológico para gemelos digitales en fabricación; según los catálogos técnicos, la parte 1 (2021) establece conceptos fundamentales, principios y requisitos generales, siendo aplicable a procesos discretos, por lotes y continuos. En Alemania, el modelo **RAMI 4.0** (DIN SPEC 91345, 2016) estructura los activos ciberfísicos en tres dimensiones a lo largo de su ciclo de vida, formalizando la noción de Administración de Activos Digitales (Asset Administration Shell).

En el mercado, la denominación "gemelo digital" abarca un abanico muy heterogéneo: desde un esquema interactivo 2D que refleja estados de máquina hasta simulaciones multifísicas termodinámicas calibradas por sensores. Frente a una propuesta comercial, la cuestión clave es: *¿qué decisión operativa permite adoptar este modelo que antes resultaba inviable y con qué grado de fidelidad técnica?*

## Mantenimiento predictivo y analítica de datos

El mantenimiento predictivo busca anticipar fallos mecánicos analizando variables de condición (vibraciones, temperaturas, consumos eléctricos, ciclos de trabajo). La norma ISO 13381-1 (tercera edición, 2025) aporta directrices para el desarrollo de procesos de **prognosis**, abordando los datos necesarios y los modelos de degradación. Dos observaciones técnicas relevantes (criterio propio, no citas textuales de la norma):

- **Los registros de fallos reales son muy escasos.** Los modelos de prognosis precisan históricos de deterioro para su entrenamiento, y la maquinaria industrial bien gestionada apenas sufre averías catastróficas. Sin un catálogo amplio de fallos documentados, la detección de anomalías (identificar desviaciones estadísticas respecto a la pauta normal de funcionamiento) resulta mucho más viable que intentar predecir con exactitud la vida útil remanente (RUL).
- **La alerta debe integrarse en la operativa.** Un aviso predictivo que no genere automáticamente una orden de trabajo en el sistema de gestión de mantenimiento (GMAO/CMMS) ni dialogue con la planificación del MES acabará siendo ignorado por los equipos de planta.

En cuanto a la **inteligencia artificial** aplicada a la industria: herramientas como la visión artificial para detección de defectos superficiales, la identificación de anomalías en vibración o el ajuste fino de parámetros de proceso demuestran utilidad real, pero están supeditadas a la calidad del dato, a la validación por tecnólogos de proceso y al control de la degradación estadística del modelo. Las promesas de incrementos de rendimiento sin mediciones contrastadas deben acogerse con cautela.

## Ventajas, limitaciones y costes operativos

**Ventajas tangibles:** visibilidad directa sobre microparadas, trazabilidad punta a punta de piezas, comparación de rendimiento entre factorías, supresión del registro manual en papel y bases sólidas para analítica predictiva.

**Limitaciones y costes a sopesar:**

- **Calidad y contexto del dato.** La integración de autómatas legados y protocolos antiguos absorbe la mayor parte del esfuerzo del proyecto.
- **Latencia frente a dependencia externa.** Las acciones que demandan respuesta en tiempo real deben permanecer en los controladores locales; la nube es adecuada para análisis agregado, no para control de maquinaria.
- **Costes recurrentes de computación.** El almacenamiento, la transferencia masiva de telemetría y el procesamiento en la nube acumulan costes operativos continuos; es indispensable modelar los volúmenes anuales de datos antes de definir frecuencias de muestreo.
- **Ampliación de la superficie de ataque.** Cada nueva pasarela interconectada introduce potenciales vulnerabilidades. Las conexiones salientes, la microsegmentación, la autenticación robusta y la actualización periódica del software perimetral son exigencias obligatorias (artículo 10).
- **Adopción organizativa.** Los cuadros de mando solo generan rentabilidad si existen responsables asignados con capacidad operativa para intervenir sobre las anomalías detectadas.
- **Cautela tecnológica (vendor lock-in).** Las plataformas comerciales industriales aceleran las fases piloto, pero acoplan los formatos de datos a sus APIs propietarias. Respaldarse en estándares abiertos (OPC UA, MQTT Sparkplug) mitiga sustancialmente este riesgo.

## Arquitecturas híbridas

Prácticamente la totalidad de las implantaciones industriales consolidadas recurren a modelos híbridos: el control y la ejecución (MES) operan estrictamente en local; la agregación y el filtrado se resuelven en pasarelas perimetrales a nivel de planta; la analítica global y el entrenamiento de modelos complejos se centralizan en la nube. Las alternativas basadas exclusivamente en la nube son inviables para operativas fabriles críticas, mientras que un enfoque únicamente local impide el análisis comparativo entre plantas. La frontera arquitectónica entre el edge y la nube se rige por criterios de latencia, coste de infraestructura, soberanía de datos y resiliencia ante cortes de comunicaciones externas.

## Relación con la ingeniería de software

Desde mi punto de vista, los proyectos de IIoT rara vez fallan por limitaciones de hardware; fracasan habitualmente por tres descuidos metodológicos: recopilar datos sin contexto operativo, carecer de responsables para actuar sobre los indicadores y subestimar el acoplamiento con la maquinaria existente. En el ámbito del software, las buenas prácticas resultan directamente aplicables: idempotencia en la ingesta, almacenamiento intermedio en la pasarela, sellado de tiempo en origen, esquemas de datos versionados, observabilidad de las tuberías de telemetría y pruebas automatizadas frente a emuladores industriales.

## Conclusión

IIoT e Industria 4.0 definen la integración técnica estructurada entre la maquinaria de planta, las aplicaciones de gestión y la computación en la nube. Una arquitectura prudente conserva el control determinista en los autómatas, procesa en el edge lo que requiere rapidez e independencia, traslada a la nube lo que se beneficia de la escala analítica y concibe la ciberseguridad como un requisito fundacional. El retorno efectivo depende en menor medida de las etiquetas tecnológicas que de la formulación de objetivos operativos claros y de la calidad semántica de los datos capturados.

El último artículo de la serie aborda el factor que asegura la viabilidad de todo este ecosistema: la [ciberseguridad industrial](/pt/blog/ciberseguranca-industrial-plc-scada-mes).

## Referencias

Este artículo es un estudio basado en las fuentes siguientes. Los pasajes marcados como opinión reflejan mi lectura. El código se ejecutó localmente con datos sintéticos; la arquitectura tiene fines ilustrativos.

- Microsoft. [What is Azure IoT Operations?](https://learn.microsoft.com/en-us/azure/iot-operations/overview-iot-operations), [Data flows](https://learn.microsoft.com/en-us/azure/iot-operations/connect-to-cloud/overview-dataflow) y [Layered network](https://learn.microsoft.com/en-in/Azure/iot-operations/manage-layered-network/concept-layered-network). Referencia de plataforma comercial.
- AWS. [IoT SiteWise OPC UA collector, AWS IoT Greengrass](https://docs.aws.amazon.com/greengrass/v2/developerguide/iotsitewise-opcua-collector-component.html). Referencia de plataforma comercial.
- ISO. [ISO 23247-1:2021, Digital twin framework for manufacturing](https://scc-ccn.ca/standardsdb/standards/8177207) (catálogo oficial; texto íntegro de la norma no consultado directamente).
- DIN. [DIN SPEC 91345:2016-04, RAMI 4.0](https://www.din.de/en/wdc-beuth:din21:250940128) (catálogo).
- ISO. [ISO 13381-1:2025, Prognostics, General guidelines and requirements](https://www.iso.org/standard/88029.html) (catálogo).
- OASIS. [MQTT Version 5.0](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html); Eclipse Foundation. [Sparkplug](https://www.eclipse.org/tahu/spec/sparkplug_spec.pdf).
- OPC Foundation. [OPC 10000-1](https://reference.opcfoundation.org/specs/OPC-10000-1/full) y [OPC 10000-14 (PubSub)](https://reference.opcfoundation.org/specs/OPC-10000-14/full).
