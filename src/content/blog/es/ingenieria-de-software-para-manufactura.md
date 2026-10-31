---
title: "Ingeniería de software para manufactura: guía de arquitectura"
description: "Por qué el software industrial no es una app web: determinismo, disponibilidad, eventos, store-and-forward, observabilidad, pruebas con simuladores y CI/CD."
pubDate: 2026-10-31T12:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/engenharia-de-software-para-manufatura.webp"
coverAlt: "Ilustración de un monolito modular con seis módulos sobre una base de datos PostgreSQL con buffer en el edge"
category: "Automatización Industrial"
tags:
  - "Ingeniería de Software"
  - "Software Industrial"
  - "Arquitectura de Software"
  - "Manufactura"
  - "Sistemas Distribuidos"
  - "Serie Automatización Industrial"
draft: false
lang: "es"
translationKey: "software-engineering-for-manufacturing"
---

Quienes desarrollan aplicaciones web se acostumbran a tratar el fallo como una excepción aislada: si un servicio se interrumpe, el usuario recarga el navegador. En la industria manufacturera, el fallo tiene implicaciones radicalmente distintas. La caída del MES a mitad de un turno productivo no es una simple molestia: significa una línea de envasado operando a ciegas, lotes huérfanos de trazabilidad regulatoria y operarios anotando piezas a mano en papel. Y una instrucción incorrecta enviada a un actuador puede desencadenar daños mecánicos graves.

Este es el séptimo artículo de la serie y el más orientado a quienes escriben código fuente. Reúne los fundamentos de la ingeniería de software y examina cómo deben ajustarse al entorno de planta. Gran parte de lo expuesto responde a decisiones de diseño arquitectónico y, por tanto, representa opinión fundamentada; lo señalo explícitamente en el texto.

## Por qué no es una aplicación web convencional

Los requisitos no negociables que transforman el diseño arquitectónico del software:

**Disponibilidad y continuidad de la producción.** El sistema debe seguir aportando valor cuando elementos de la infraestructura técnica fallen. Esto exige prever un **modo degradado** explícito para cada servicio: ¿cómo opera la línea si la base de datos del MES queda inaccesible?, ¿qué sucede si se interrumpe el enlace de red entre la planta y los servidores corporativos? Responder "reiniciar y reintentar" es inaceptable en una fábrica.

**Determinismo y temporización.** En el control de maquinaria física, la corrección de un algoritmo depende de *cuándo* se ejecuta la acción, no solo de *qué* lógica computa. Conviene distinguir tres ámbitos temporales diferenciados:

- **Tiempo real estricto (hard real-time):** sobrepasar un plazo temporal supone un fallo crítico del sistema (control cinemático de servomotores, interbloqueos de seguridad física). Es dominio exclusivo de autómatas programables y silicio embebido dedicado, nunca de aplicaciones corporativas de propósito general.
- **Tiempo real blando (soft real-time):** el incumplimiento ocasional de un plazo degrada la calidad del servicio, pero no invalida su utilidad.
- **Monitorización y gestión de operaciones:** no existen plazos de milisegundos; lo crítico es la exactitud, la integridad de los datos y la secuencia cronológica de los eventos. Es el ámbito propio del MES, los historiadores de proceso y las plataformas de analítica.

El software encuadrado en los niveles 3 y 4 de ISA-95 (MES, pasarelas de integración, cuadros de mando) se sitúa casi exclusivamente en las dos últimas categorías. Confundir estos niveles es un error recurrente: implementar en un servidor empresarial una lógica que exigía respuesta en microsegundos, o aplicar la rigidez de un autómata en tiempo real a una base de datos de partes de turno. Cabe destacar que el kernel de Linux incorporó el parche PREEMPT_RT en su rama principal en la versión 6.12 (2024), lo que mejora la gestión de latencias deterministas en hardware estándar; no obstante, esto no convierte una aplicación de gestión en un sistema de tiempo real estricto certificado.

**Seguridad funcional y física.** El software puede actuar sobre maquinaria capaz de lesionar operarios o averiar instalaciones. Las funciones de seguridad física se rigen por normativas específicas (IEC 61508 / ISO 13849), requieren electrónica certificada independiente y **jamás** deben confiarse a un software de gestión corporativa.

**Trazabilidad inmutable y auditoría.** En sectores regulados (farmacéutico, automoción, alimentación), es preceptivo registrar quién ejecutó cada acción, en qué instante, bajo qué versión de receta y sobre qué versión de código. Esto condiciona el modelado de datos (registros inmutables basados en eventos en lugar de actualizaciones destructivas) y la gestión de cambios.

**Prolongado ciclo de vida y heterogeneidad tecnológica.** Maquinaria con tres décadas en funcionamiento convive con microservicios contemporáneos. El nuevo software debe acoplarse al equipamiento legado, no al revés.

## Monolitos, microservicios y arquitectura modular

Los microservicios rara vez constituyen el punto de partida idóneo en planta. Martin Fowler acuñó el término "microservice premium" para describir el sobrecoste operativo de gestionar una red distribuida de servicios, el cual ralentiza a los equipos y solo aporta rentabilidad cuando la escala organizativa desborda un único artefacto desplegable. Fowler subraya que la inmensa mayoría de los sistemas distribuidos de éxito comenzaron siendo arquitecturas monolíticas que se descompusieron con posterioridad, recomendando modularidad interna rigurosa antes de separar físicamente los servicios. Este blog aborda esta perspectiva en [cuándo tienen sentido los microservicios](/es/blog/microservicios-cuando-tienen-sentido).

En el entorno industrial, este sobrecoste operativo resulta crítico:

- **Mayor número de componentes distribuidos equivale a más puntos potenciales de fallo**, en un entorno donde cada minuto de paro tiene un coste financiero directo.
- **Complejidad de mantenimiento en planta**, donde el soporte informático presencial suele ser limitado y el acceso remoto por red está restringido por políticas de seguridad OT.
- **Gestión de la consistencia distribuida** en un dominio que exige trazabilidad estricta; esto obliga a introducir patrones complejos como [Saga](/es/blog/patron-saga) o tablas outbox transaccionales.

Desde mi perspectiva, la base de partida más sensata para un MES o una plataforma de integración fabril de tamaño medio es un **monolito modular**: un único artefacto desplegable estructurado en módulos con límites bien definidos (órdenes de trabajo, registro de producción, trazabilidad, maquinaria, integración ERP), respaldado por una única base de datos transaccional y complementado con procesos independientes en el perímetro para la captura de datos (adaptadores de máquina). Descomponer este sistema debe obedecer a evidencias empíricas (escalabilidad diferenciada, equipos de desarrollo autónomos, restricciones de aislamiento), no a una moda de diseño. Es una recomendación práctica, no una regla dogmática.

## Arquitectura orientada a eventos y colas de mensajes

El dominio manufacturero es intrínsecamente reactivo y orientado a eventos: una pieza pasa por la fotocélula, un motor térmico salta por sobrecarga, un lote recibe aprobación analítica, el ERP libera una orden de producción. Adoptar un enfoque orientado a eventos aporta ventajas técnicas directas:

- **Desacoplamiento temporal.** El emisor (el autómata o la pasarela) no se bloquea esperando la respuesta del receptor.
- **Capacidad de reproducción histórica.** Un registro cronológico continuo de eventos permite reconstruir estados y recalcular métricas de rendimiento a posteriori.
- **Trazabilidad de auditoría.** El flujo continuo de eventos constituye la constatación física inmutable de lo sucedido en planta.

Los compromisos operativos son igualmente reales: alteración del orden de los mensajes, duplicidad en la entrega (la entrega al menos una vez, *at-least-once*, es la norma en mensajería industrial, como QoS 1 en MQTT), consistencia eventual y mayor complejidad en la depuración. De ahí la exigencia de **idempotencia**: procesar un mismo evento múltiples veces debe producir idéntico resultado que procesarlo una sola vez, típicamente validado mediante claves naturales del evento. Quien desee profundizar en los patrones de suscripción puede consultar el artículo sobre el [patrón observer](/es/blog/patron-observer).

Las colas de mensajes actúan además como mecanismos de amortiguación: si tras una caída de red se vuelca de golpe la telemetría acumulada durante un turno completo, la cola nivela la absorción de carga en el MES sin degradar su servicio.

### El patrón store-and-forward en el edge

Un patrón angular en la integración de planta es el **store-and-forward** (almacenar y reenviar): el componente perimetral persiste localmente en disco cada evento antes de intentar transmitirlo por red, y solo lo elimina o marca como transferido tras recibir la confirmación explícita del servidor. Las pasarelas industriales comerciales incorporan esta función; la documentación de FactoryTalk Edge Gateway de Rockwell describe un buffer local FIFO con límite de capacidad donde las lecturas más antiguas se descartan si el buffer se satura durante una desconexión prolongada. Dimensionar este buffer es una decisión técnica clave: ¿cuántas horas de caída de red industrial debe soportar el sistema sin perder telemetría?

Un esquema básico en Python empleando SQLite que ilustra este patrón outbox (probado localmente frente a un consumidor simulado):

```python
import json, sqlite3, time

class Outbox:
    def __init__(self, path=":memory:"):
        self.db = sqlite3.connect(path)
        self.db.execute("""CREATE TABLE IF NOT EXISTS outbox (
            event_id TEXT PRIMARY KEY,           -- clave de idempotencia
            payload  TEXT NOT NULL,
            created_at REAL NOT NULL,
            sent_at REAL)""")

    def add(self, event_id, payload):
        self.db.execute("INSERT OR IGNORE INTO outbox (event_id, payload, created_at) "
                        "VALUES (?,?,?)", (event_id, json.dumps(payload), time.time()))
        self.db.commit()

    def flush(self, send, batch=100):
        rows = self.db.execute("SELECT event_id, payload FROM outbox WHERE sent_at IS NULL "
                               "ORDER BY created_at LIMIT ?", (batch,)).fetchall()
        for event_id, payload in rows:
            try:
                send(event_id, json.loads(payload))
            except Exception:
                break                              # reintentar en el próximo ciclo
            self.db.execute("UPDATE outbox SET sent_at=? WHERE event_id=?",
                            (time.time(), event_id))
            self.db.commit()
```

En la prueba local, se almacenaron tres eventos mientras el servicio de destino simulaba un fallo de red; los intentos de inserción con el mismo `event_id` fueron neutralizados por la clave primaria de SQLite; al restablecer la conexión, los tres mensajes se entregaron con éxito sin dejar elementos pendientes. En un entorno productivo real se requeriría: depuración periódica de registros confirmados, gestión de mensajes erróneos permanentes (*dead-letter queues*), monitorización de latencia y garantía de idempotencia en el extremo receptor.

## APIs REST y protocolos de comunicaciones industriales

Las APIs REST bajo HTTPS son idóneas para enlazar sistemas en los niveles 3 y 4 de ISA-95 (comunicación del MES con el ERP corporativo, portales analíticos o interfaces de usuario). **No** son adecuadas para interactuar directamente con la maquinaria de campo: dicha labor exige protocolos industriales especializados (OPC UA, Modbus TCP, buses deterministas), según lo expuesto en el [artículo 06](/es/blog/protocolos-industriales-opc-ua-modbus-mqtt). Interconectar ambos mundos se resuelve mediante **adaptadores de máquina** situados en la periferia, que traducen variables industriales a eventos del dominio exponiendo una interfaz unificada al resto del sistema.

Dos buenas prácticas al diseñar APIs de integración: versionar explícitamente los contratos de interfaz (las integraciones con el ERP suelen perdurar durante años) y asegurar que las operaciones de modificación sean idempotentes y reentrantes, apoyándose en identificadores generados en el cliente emisor.

## Arquitectura de persistencia de datos

El entorno de fabricación plantea al menos dos naturalezas de almacenamiento con requerimientos dispares:

- **Datos transaccionales y de negocio:** órdenes de trabajo, lotes, genealogía de componentes, partes de producción y calidad. Exigen bases de datos relacionales (PostgreSQL, SQL Server, Oracle) con garantías ACID, integridad referencial y registros de auditoría. Para repasar las garantías de atomicidad y aislamiento, véase el artículo sobre [ACID en bases de datos](/es/blog/acid-en-bases-de-datos).
- **Telemetría y series temporales:** lecturas analógicas continuas en alta frecuencia. Demandan historiadores de proceso o bases de series temporales con políticas de compresión, agregación temporal y purga cíclica. El artículo 08 aborda estas soluciones.

Es muy recomendable mantener segregadas ambas estructuras en la arquitectura técnica, aun cuando se emplee un mismo motor subyacente (por ejemplo, PostgreSQL complementado con extensiones temporales), dado que las tasas de inserción, los ciclos de retención y los patrones de consulta divergen por completo.

## Observabilidad, registros y auditoría regulatoria

En una planta de fabricación, la observabilidad afronta restricciones singulares: redes aisladas tras cortafuegos, accesos remotos restringidos y equipos de operación que dominan el proceso mecánico pero no la administración de sistemas. Recomendaciones de diseño:

- **Registros estructurados en JSON** (incluyendo metadatos de contexto: `order_id`, `lot_id`, `machine_code`), desterrando el texto plano libre.
- **Métricas operativas del pipeline**: longitud de las colas de mensajes, antigüedad del mensaje más antiguo sin procesar, latencia de ingesta y tasa de reconexión por autómata.
- **Trazabilidad distribuida** para flujos que atraviesan pasarelas intermedias. OpenTelemetry (proyecto de la CNCF) estandariza trazas, métricas y logs, si bien su despliegue depende de las restricciones de red de cada planta.
- **Segregar los logs técnicos de la traza de auditoría regulatoria.** Los primeros asisten en la depuración de errores y admiten rotación frecuente; las trazas de auditoría reflejan acciones críticas de negocio (modificación de recetas, desbloqueo manual de lotes defectuosos) y deben ser inmutables y custodiarse según la normativa aplicable.
- **Alertas procesables orientadas al proceso.** "La cola de la pasarela crece de forma continua desde hace 10 minutos" constituye una alerta útil; "se produjo un error HTTP 500" resulta ambiguo.

## Metodología de pruebas y simulación de maquinaria

Un sistema MES o de integración jamás se valida conectándolo directamente a una línea productiva viva. Una estrategia de pruebas solvente articula:

1. **Pruebas unitarias de dominio** para validar reglas operativas (fórmulas de OEE, máquinas de estados de órdenes de trabajo, árboles de trazabilidad).
2. **Emuladores de maquinaria física**: servidores virtuales de Modbus o servidores simulados de OPC UA que emitan telemetría realista, reproduciendo anomalías intencionadas (pérdidas de paquetes, valores fuera de rango, mensajes duplicados o desordenados). Este fue el entorno empleado para comprobar los ejemplos prácticos del artículo 06: un servidor Modbus simulado, un intermediario MQTT local y un cliente de ingesta.
3. **Pruebas de integración con dobles de prueba** (*test doubles*) para simular sistemas corporativos (ERP mockeado).
4. **Ensayos de resiliencia y caos**: simular caídas de bases de datos, cortes de red física o reinicios forzados durante el cierre de un lote, verificando que la información ni se pierde ni se duplica.
5. **Comisionado en banco de pruebas previo** (FAT, Factory Acceptance Testing) empleando bancos de prueba físicos o gemelos emulados antes del despliegue en fábrica.

En mi experiencia, la prueba que aporta mayor retorno técnico en integraciones industriales es la de **retransmisión y mensajes duplicados**: si el software procesa sin anomalías cada evento recibido dos veces y fuera de secuencia temporal, absorberá la inmensa mayoría de las contingencias de red física.

## Control de versiones y CI/CD en entornos de fabricación

La entrega continua habitual en el desarrollo web moderno (múltiples pases a producción diarios) rara vez encaja en una planta de fabricación. Los cambios deben someterse a gestión de modificaciones reglada, ventanas de parada técnica y, en sectores regulados, procesos de cualificación formal (IQ/OQ/PQ). Prácticas plenamente aplicables:

- **Control de versiones integral**: código de aplicación, esquemas de bases de datos, archivos de parametrización, recetas de fabricación y exportaciones de código de autómatas (la norma IEC 61131-10 define el formato de intercambio en XML analizado en el [artículo 02](/es/blog/plcs-lenguajes-programacion-industrial)).
- **Tuberías automatizadas de compilación y pruebas**, aunque el despliegue final en planta exija autorización manual firmada.
- **Entornos de ejecución segregados** (desarrollo, pruebas/homologación, producción en planta) respaldados por artefactos inmutables y versionados.
- **Estrategias de repliegue probadas**: procedimientos de rollback validados y migraciones de bases de datos retrocompatibles.
- **Ciclos de desarrollo seguro**: la norma internacional IEC 62443-4-1 (2018) estipula los requisitos del ciclo de vida para el desarrollo seguro de productos de automatización industrial, abarcando desde el modelado de amenazas hasta la remediación de vulnerabilidades. Es de aplicación directa para las organizaciones que desarrollan software industrial.

Dado que muchas plantas operan con redes totalmente aisladas del exterior, los pipelines suelen bifurcarse: compilación y pruebas automatizadas en la infraestructura corporativa o nube, seguidas del traslado controlado y firmado de artefactos hacia la red de planta.

## Alta disponibilidad y tolerancia a contingencias

Los mecanismos técnicos son conocidos (replicación de bases de datos, instancias balanceadas, conmutación automática por fallo), pero la arquitectura debe responder a las exigencias operativas reales del negocio:

- ¿Cuáles son los objetivos formales de **RTO** (tiempo máximo tolerable de indisponibilidad) y de **RPO** (volumen máximo admisible de datos no registrados)?
- ¿Qué protocolo operativo sigue el personal en planta mientras el sistema está fuera de servicio y cómo se concilian las anotaciones al restablecerse?
- ¿La redundancia técnica se implementa en local (en la propia fábrica) o en la nube? Depender de la nube para mantener en marcha la línea física convierte la conectividad WAN externa en un punto único de fallo.

La redundancia que no se somete a simulacros de conmutación no es fiable. En entornos industriales, los ensayos de corte deben planificarse y coordinarse con los responsables de producción.

## Coexistencia con maquinaria y sistemas legados

La presencia de equipamiento heredado es la norma en la industria. Pautas para su integración:

- **Capa anticorrupción (patrón adaptador):** el equipo legado se comunica con su protocolo y mapeo nativo; el adaptador traduce dicha información al modelo conceptual del dominio. Cualquier variación futura en el autómata queda contenida dentro del adaptador.
- **Pasarelas de conversión de protocolo:** instrumentación antigua basada en Modbus serie RS-485 puede integrarse en redes Ethernet mediante convertidores sin alterar su lógica interna.
- **Migración incremental:** sustitución progresiva de funciones por etapas, conviviendo con el sistema legado hasta alcanzar la equivalencia funcional. El artículo sobre [modernización de sistemas legados](/es/blog/modernizacion-de-sistemas-legados) analiza esta metodología en profundidad.
- **Ingeniería inversa documentada:** registrar tablas de memoria, particularidades del hardware y reglas no escritas de los operarios antes de emprender cualquier refactorización.

## Arquitectura de referencia

El esquema siguiente es **ilustrativo y representa una alternativa técnica contrastada, no un estándar dogmático**. Refleja los principios expuestos para una infraestructura industrial de escala media:

<figure>
  <img src="/images/blog/engenharia-de-software-para-manufatura-diagrama.webp" alt="Diagrama estructurado en tres bloques: planta física, capa edge perimetral (adaptadores, normalización semántica, buffer de almacenamiento local) y núcleo de gestión (monolito modular sobre PostgreSQL, series temporales y cola de mensajes), interconectado con el ERP y terminales de operario." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Arquitectura de referencia representativa para software de manufactura. Diagrama del autor.</figcaption>
</figure>

Aspectos destacados del diseño: el buffer perimetral en el edge desacopla la maquinaria física ante eventuales caídas del servidor central; los módulos del monolito comparten la base transacional pero se comunican mediante interfaces delimitadas; la telemetría de proceso permanece aislada de las tablas de negocio; y el ERP corporativo se gestiona como un sistema externo bajo contratos explícitos e idempotentes.

## Lenguajes y tecnologías de desarrollo

La elección de herramientas tecnológicas se fundamenta en el rol del componente y su escala temporal. La siguiente síntesis refleja la práctica extendida en el sector:

- **C y C++:** firmwares embebidos, controladores de comunicaciones de bus de campo y rutinas de muy baja latencia; común en el software de base de los fabricantes de hardware.
- **C# (.NET) y Java:** aplicaciones de MES empresarial, plataformas de integración y middleware de planta; amplia disponibilidad de librerías para OPC UA y conectores de bases de datos.
- **Python:** pasarelas de integración perimetral, analítica de datos, prototipado, simuladores de pruebas y emuladores de protocolos; menos indicado para lazos cerrados deterministas.
- **JavaScript/TypeScript:** interfaces web para operarios de planta, cuadros de mando interactivos y herramientas de supervisión.
- **SQL:** lenguaje fundamental para garantizar la integridad referencial, la trazabilidad de lotes y el balance de consumos; el dominio operativo de fabricación es predominantemente relacional.
- **Lenguajes IEC 61131-3 (Ladder, ST, FBD, SFC):** reservados para el control determinista dentro del PLC físico, nunca en servidores corporativos.

Cada tecnología responde a un marco temporal y a un nivel de riesgo operativo diferente; una factoría consolidada articula una combinación armónica de varias de ellas.

## Conclusión

La ingeniería de software para manufactura es, en esencia, ingeniería de software disciplinada bajo restricciones operativas inflexibles: disponibilidad continua, determinismo temporal, trazabilidad inmutable y seguridad física. Estas condiciones orientan hacia decisiones de diseño prudentes: arquitecturas monolíticas modulares antes de desplegar microservicios dispersos, flujos reactivos con idempotencia estricta, almacenamiento preventivo en el edge, separación nítida entre transacciones de negocio y telemetría de proceso, pruebas continuas frente a emuladores industriales y despliegues sincronizados con las ventanas de mantenimiento de planta. El factor determinante radica en el dominio técnico: comprender qué cometidos resuelve cada nivel de la pirámide fabril para no exigirle aquello para lo que jamás fue diseñado.

## Referencias

Este artículo es un estudio basado en las fuentes siguientes. Los pasajes marcados como opinión, incluyendo la recomendación de monolitos modulares, la arquitectura de referencia y la taxonomía de lenguajes, reflejan mi lectura. El código se ejecutó localmente frente a un receptor simulado.

- Martin Fowler. [Monolith First](https://www.martinfowler.com/bliki/MonolithFirst.html) y el debate sobre el "microservice premium" ([resumen en InfoQ](https://www.infoq.com/news/2015/05/microservices-premium)).
- IEC. [IEC 62443-4-1:2018, Secure product development lifecycle requirements](https://webstore.iec.ch/en/publication/33615). Consulta limitada al catálogo oficial.
- Rockwell Automation. [FactoryTalk Edge Gateway, Add an IoT Edge Runtime application](https://www.rockwellautomation.com/en-us/docs/factorytalk-edge-gateway/1-04-00/ft-edge-gateway-help-ditamap/applications/add-iot-edge-app.html), referencia del mecanismo de store-and-forward en una pasarela comercial.
- Phoronix. [Linux 6.12 Features](https://phoronix.com/review/linux-612-features), sobre la inclusión del parche PREEMPT_RT en la rama principal del kernel (fuente secundaria; verificar en kernel.org).
- OASIS. [MQTT Version 5.0](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html), sobre los niveles de entrega QoS.
- OpenTelemetry (CNCF). [opentelemetry.io](https://opentelemetry.io/). Marco de referencia internacional en observabilidad.
- Artículos relacionados en el blog: [microservicios](/es/blog/microservicios-cuando-tienen-sentido), [patrón Saga](/es/blog/patron-saga), [ACID en bases de datos](/es/blog/acid-en-bases-de-datos), [patrón Observer](/es/blog/patron-observer), [modernización de sistemas legados](/es/blog/modernizacion-de-sistemas-legados).
