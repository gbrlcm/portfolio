---
title: "Ciberseguridad industrial: proteger PLC, SCADA y MES"
description: "Seguridad en OT: diferencias con TI, zonas y conductos, ISA/IEC 62443, segmentación, acceso remoto, sistemas legados, parches, copias y respuesta a incidentes."
pubDate: 2026-10-31T13:30:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/ciberseguranca-industrial-plc-scada-mes.webp"
coverAlt: "Ilustración de zonas de seguridad anidadas: Corporativa, DMZ, Operaciones y Control, separadas por cortafuegos"
category: "Seguridad"
tags:
  - "Ciberseguridad Industrial"
  - "ISA/IEC 62443"
  - "OT Security"
  - "SCADA"
  - "Segmentación de Red"
  - "Serie Automatización Industrial"
draft: false
lang: "es"
translationKey: "industrial-cybersecurity-plc-scada-mes"
---

Los artículos anteriores describieron una fábrica progresivamente conectada: controladores que publican datos por OPC UA, pasarelas que emiten hacia intermediarios de mensajería y plataformas en la nube que reciben telemetría analítica. Cada nueva interconexión resuelve una necesidad de visibilidad operativa y abre, al mismo tiempo, una superficie de ataque. Este último artículo de la serie aborda cómo gestionar esta realidad sin comprometer lo prioritario: la continuidad operativa y la seguridad física del proceso.

Una advertencia sobre el alcance: este es un estudio conceptual, no una guía de implantación específica para una planta concreta. Las decisiones reales exigen evaluaciones de riesgos ejecutadas por especialistas con conocimiento directo del proceso físico.

## Seguridad en TI frente a seguridad en OT

La publicación **NIST SP 800-82 Rev. 3** (septiembre de 2023) es la guía de seguridad en tecnología operacional (OT) del NIST. Su resumen oficial detalla cómo proteger los entornos OT "respetando sus requisitos específicos de rendimiento, fiabilidad y seguridad funcional", definiendo OT como sistemas y dispositivos programables que interactúan directamente con el entorno físico, tales como sistemas de control industrial, automatización de edificios e infraestructuras de transporte.

Esa definición resume la divergencia central. Varios contrastes prácticos (síntesis propia a partir de la literatura técnica general):

| Aspecto | TI corporativa | OT industrial |
|---|---|---|
| Prioridad habitual | Confidencialidad, Integridad, Disponibilidad (CID) | Seguridad funcional y Disponibilidad operativa en primer lugar |
| Reinicios y aplicación de parches | Rutinarios, en ventanas breves | Exigen paradas programadas de planta; a menudo viables solo en paradas anuales |
| Ciclo de vida del activo | 3 a 5 años | Frecuentemente 15 a 30 años |
| Latencia y determinismo | Tolerante a fluctuaciones | Lazos físicos dependientes de temporizaciones estrictas |
| Herramientas activas (escáneres) | Práctica común | Pueden provocar el bloqueo de pilas de red embebidas frágiles |
| Consecuencia de un fallo | Pérdida de datos o impacto financiero | Parada de producción, daños en maquinaria, riesgo físico para personas y medio ambiente |
| Dispositivos | Actualizables, compatibles con agentes de seguridad | Autómatas e instrumentos sin capacidad de albergar agentes |

La consecuencia de ingeniería: **las recetas tradicionales de seguridad informática corporativa aplicadas sin adaptación en planta pueden originar el mismo problema que pretenden prevenir.** Un escaneo agresivo de vulnerabilidades o un parche aplicado sin pruebas puede detener por completo una línea de fabricación.

## Cómo afecta un incidente a la continuidad operativa

No es imprescindible que un código malicioso alcance un PLC para paralizar una factoría. Dos casos documentados por fuentes oficiales ilustran vectores distintos:

- **Colonial Pipeline (mayo de 2021).** El aviso AA21-131A de CISA describe un ataque de ransomware (DarkSide) contra la red corporativa de TI de una compañía de oleoductos. Sin evidencias de afectación directa en las redes de control OT, la empresa **desconectó de forma proactiva determinados sistemas de OT** como medida de precaución. Informes del Servicio de Investigación del Congreso de EE. UU. indican que esto provocó la interrupción temporal de todas las operaciones del oleoducto, restableciéndose el servicio por fases días después. La lección de ingeniería: cuando los límites entre TI y OT son difusos, un incidente ofimático puede transformarse en una parada de planta por decisión preventiva.
- **Ataque a la red eléctrica de Ucrania (diciembre de 2015).** El aviso IR-ALERT-H-16-056-01 del ICS-CERT/CISA (febrero de 2016) analiza los cortes de suministro eléctrico del 23 de diciembre de 2015 en distribuidoras ucranianas. En este escenario, el ataque comprometió directamente los sistemas de supervisión y control (SCADA). Las cifras de personas afectadas varían entre las distintas fuentes y la atribución no figura en la alerta estadounidense, por lo que no se afirman en este texto.

En ambos escenarios, la capacidad de recuperación dependió de los mismos principios: conocimiento riguroso del inventario de activos, copias de seguridad aisladas y verificadas, capacidad de operación en modo manual degradado y planes de respuesta ensayados.

## ISA/IEC 62443

La serie **ISA/IEC 62443** constituye el conjunto de normas internacionales de referencia para la seguridad en sistemas de automatización y control industrial (IACS). Según la ISA, el comité ISA99 la desarrolló en estrecha colaboración con el grupo de trabajo 10 del comité técnico 65 de la IEC; las ediciones de ISA (ISA-62443-x-y) y de la IEC (IEC 62443-x-y) presentan contenidos idénticos, rigiéndose por el principio de **responsabilidad compartida** entre propietarios de activos, fabricantes de componentes, integradores de sistemas y proveedores de servicios.

Estructuración modular de la norma (conforme al catálogo oficial de la ISA):

- **Parte 1 (General):** 1-1, terminología, conceptos y modelos arquitectónicos.
- **Parte 2 (Políticas y procedimientos):** 2-1, programa de seguridad para propietarios de activos; 2-3, gestión de parches en IACS (informe técnico); 2-4, requisitos de seguridad para proveedores de servicios.
- **Parte 3 (Sistema):** 3-2, evaluación de riesgos de ciberseguridad para el diseño del sistema; 3-3, requisitos técnicos de seguridad y niveles de seguridad (SL).
- **Parte 4 (Componente):** 4-1, requisitos del ciclo de vida de desarrollo seguro de producto; 4-2, requisitos técnicos de ciberseguridad para componentes individuales.

### Zonas, conductos y niveles de seguridad

Dos conceptos arquitectónicos clave, expuestos a partir de literatura técnica secundaria (las definiciones normativas completas deben consultarse en el texto oficial):

- Una **zona** es una agrupación física o lógica de activos que comparten requisitos y políticas de seguridad homogéneos.
- Un **conducto** es el canal de comunicación que interconecta zonas, debiendo proporcionar salvaguardas proporcionales a los niveles de seguridad de las zonas enlazadas.
- Los **niveles de seguridad** (Security Levels, SL 1 a SL 4) cuantifican la solidez requerida frente a adversarios con distintos grados de capacitación y recursos, asignándose mediante evaluación previa de riesgos. Los siete requisitos fundamentales (FR) de la norma contemplan: control de identificación y autenticación, control de uso, integridad del sistema, confidencialidad de datos, restricción de flujos de datos, respuesta oportuna a eventos y disponibilidad de recursos.

El modelo de zonas y conductos resulta muy útil como disciplina de ingeniería de software. El siguiente fragmento en Python (ejecutado localmente) modela una política de conductos mediante una lista restrictiva explícita (*default deny*) y comprueba flujos de red observados. Constituye una ilustración del modelo mental, no una herramienta de monitorización perimetral:

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Flow:
    src: str; dst: str; proto: str; port: int    # src inicia la conexión hacia dst

ALLOWED = {                                       # default deny: solo lo listado pasa
    Flow("SUPERVISION", "CONTROL", "opcua", 4840),
    Flow("OPERACIONES", "DMZ", "mqtt-tls", 8883),
    Flow("DMZ", "OPERACIONES", "https", 443),
    Flow("DMZ", "CORPORATIVA", "https", 443),
}

observados = [
    Flow("SUPERVISION", "CONTROL", "opcua", 4840),
    Flow("OPERACIONES", "DMZ", "mqtt-tls", 8883),
    Flow("CORPORATIVA", "CONTROL", "rdp", 3389),
    Flow("CORPORATIVA", "OPERACIONES", "smb", 445),
]
for f in observados:
    print("OK       " if f in ALLOWED else "VIOLACIÓN", f)
```

En la ejecución, los dos primeros flujos son aceptados, mientras que los dos últimos —una conexión RDP directa desde la red corporativa al nivel de control y un recurso compartido SMB hacia operaciones— son catalogados como violaciones de política. La utilidad reside en **visibilizar la política de tráfico**: si no es posible enumerar qué flujos deben existir legítimamente, resulta inviable detectar anomalías.

## Defensa en profundidad en entornos industriales

La defensa en profundidad establece que la seguridad no debe recaer jamás en una barrera aislada. Un esquema conceptual **ilustrativo**:

<figure>
  <img src="/images/blog/ciberseguranca-industrial-plc-scada-mes-diagrama.webp" alt="Diagrama con cinco zonas de seguridad: Corporativa, DMZ industrial, Operaciones, Supervisión y Control, separadas por cortafuegos, con sistemas de seguridad física independientes y cuatro pautas operativas para proteger la planta." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Defensa en profundidad con zonas y conductos. Esquema conceptual del autor.</figcaption>
</figure>

Capas arquitectónicas y precauciones operativas, orientadas a **preservar la disponibilidad y la seguridad de las personas e instalaciones**:

**Segmentación y cortafuegos.** Desacoplar la infraestructura de TI corporativa de la red industrial OT y segmentar internamente las zonas operativas. Las directrices de CISA frente al ransomware aconsejan una segmentación estricta entre TI y OT mediante una zona desmilitarizada industrial (IDMZ) que intercepte e impida cualquier tráfico directo entre ambas. Precaución en planta: reglas de cortafuegos mal planificadas pueden bloquear comunicaciones cíclicas críticas. Deben validarse en bancos de pruebas o durante paradas técnicas, siempre con procedimientos de reversión inmediatos.

**Gestión de identidades y accesos.** Aplicar el principio de mínimo privilegio, habilitar cuentas personales (no genéricas) cuando el software lo permita, separar perfiles de operación en planta de los privilegios de ingeniería, eliminar credenciales obsoletas y auditar accesos. Numerosos equipos legados solo disponen de contraseñas universales compartidas; en tales casos, deben establecerse controles compensatorios en las capas de red y mediante cerramientos físicos. Esta recomendación refleja buenas prácticas consolidadas en la industria (opinión), más allá de preceptos normativos individuales.

**Autenticación multifactor (MFA).** Los organismos de ciberseguridad recomiendan autenticación multifactor para cualquier acceso remoto a redes OT y corporativas. Para los operarios de planta en puestos compartidos con indumentaria de protección, mecanismos basados en teléfonos móviles o claves complejas pueden ser inoperantes; el diseño debe contemplar el contexto laboral (tarjetas RFID, llaves físicas criptográficas, terminales aisladas).

**Acceso remoto y conectividad segura.** El mantenimiento externo por parte de fabricantes y técnicos remotos representa un vector de exposición habitual. Recomendaciones alineadas con pautas oficiales: canalizar todo acceso a través de un servidor de salto (*jump host*) ubicado en la IDMZ, reforzado con MFA, grabación de sesiones, límites temporales estrictos y restricción a destinos autorizados; erradicar la exposición de RDP directamente a internet (filtrar IPs de origen y forzar MFA si resulta inevitable). En enero de 2026, agencias de ocho países (incluidas CISA, el FBI, el NCSC británico, el BSI alemán y el Centro Canadiense de Ciberseguridad) publicaron directrices conjuntas sobre principios de conectividad segura para OT; remito a dicho documento oficial para la consulta de sus recomendaciones íntegras. Una VPN cifra el canal de transporte, pero no sustituye la segmentación interna ni el control de privilegios tras el inicio de sesión.

**Monitorización pasiva de red.** Análisis de tráfico no intrusivo (mediante duplicación de puertos SPAN y sondas pasivas especializadas en OT) para generar inventarios dinámicos de activos, registrar nuevos dispositivos y alertar sobre comunicaciones anómalas en conductos. Priorizar la monitorización **pasiva** en redes de nivel 1 y 2 previene la desestabilización de pilas IP embebidas frágiles. Disponer de procedimientos claros de triaje de alertas es más determinante que la herramienta en sí.

**Bastionado de autómatas y SCADA.** Minimizar la superficie expuesta: suprimir salidas directas a internet en PLCs, cambiar contraseñas de fábrica, deshabilitar puertos y servicios prescindibles, posicionar las llaves físicas de modo de la CPU (cuando existan) en modo RUN (impidiendo modificaciones remotas sin presencia física), custodiar físicamente los armarios de control y supervisar cambios en los proyectos lógicos. En estaciones SCADA/HMI: endurecimiento del sistema operativo base, listas de aplicaciones permitidas y bloqueo de puertos USB. Las medidas reales están delimitadas por las capacidades admitidas por el fabricante.

**Gestión de vulnerabilidades y sistemas legados.** Equipos con décadas en servicio a menudo no admiten parches o carecen de soporte técnico. La respuesta adecuada consiste en aplicar **controles compensatorios**: aislarlos en microzonas específicas, restringir los equipos autorizados a comunicarse con ellos y monitorizar su tráfico. La serie 62443 contempla el ciclo de desarrollo seguro (4-1) y los requisitos técnicos de componentes (4-2), proporcionando criterios de compra esenciales al incorporar nueva maquinaria.

**Gestión de actualizaciones y parches.** La norma ISA-62443-2-3 recoge directrices sobre la gestión de parches en entornos IACS. El factor decisivo es el rigor metodológico: inventariar activos, monitorizar boletines de seguridad, evaluar el riesgo derivado de la vulnerabilidad frente al impacto operativo del parche, validar en entornos piloto, ejecutar parches exclusivamente en paradas programadas y disponer de planes de retroceso. No todo parche debe aplicarse de inmediato en OT; posponer una actualización adoptando medidas compensatorias perimetrales es una estrategia de gestión del riesgo plenamente justificada.

**Copias de seguridad y recuperación.** El aviso AA21-131A hace hincapié en realizar copias de seguridad de forma periódica, **verificadas mediante pruebas de restauración y conservadas fuera de línea (offline)**, desconectadas de la red. En la industria, el alcance del respaldo abarca más que bases de datos: programas lógicos de PLCs, archivos de proyectos SCADA/HMI, recetas de fabricación, bases del MES e imágenes de configuración de las estaciones de ingeniería. Un respaldo que no ha sido restaurado en un simulacro es solo una conjetura. CISA insiste asimismo en **validar periódicamente la operativa en modo manual**, asegurando que las funciones operativas críticas subsistan si las redes de control deben apagarse.

**Respuesta ante incidentes.** Un plan específico para OT debe determinar: qué perfiles tienen la potestad de aislar o detener la producción de la planta (el incidente de Colonial demostró que la desconexión suele acometerse por precaución preventiva), canales de comunicación de emergencia con responsables de planta, seguridad industrial y suministradores de maquinaria, procedimientos para migrar a control manual aislado, técnicas de preservación forense de evidencias que no demoren la puesta en marcha física y criterios de notificación regulatoria. Los ejercicios de simulación en mesa (*tabletop exercises*) descubren fallos de coordinación con anterioridad a una crisis real.

## Relación con otros marcos de referencia

- **ISA/IEC 62443:** marco de referencia normativo que estructura requisitos técnicos y de gestión para IACS según los roles de la cadena de valor (propietario, integrador, fabricante) y niveles de riesgo.
- **NIST SP 800-82 Rev. 3:** guía técnica de referencia para la protección de sistemas OT que presenta arquitecturas de referencia, catálogos de amenazas y contramedidas, e incorpora una superposición de controles adaptados de NIST SP 800-53.
- **Directrices de agencias gubernamentales** (CISA, NCSC y aliados internacionales): recomendaciones prácticas actualizadas sobre mitigación de accesos RDP, adopción de MFA, copias de seguridad desconectadas y conectividad segura.

Estos marcos no compiten entre sí: ISA/IEC 62443 y NIST SP 800-82 articulan la gobernanza programática y los requisitos estructurales, mientras que las alertas de los organismos oficiales señalan prioridades operativas tácticas. Aunque existen normas generales de gestión de seguridad de la información corporativa (como ISO/IEC 27001), no se abordaron específicamente en este análisis comparativo.

## Relación con la ingeniería de software

Para los ingenieros que desarrollan software industrial, la seguridad constituye un requisito intrínseco de diseño: autenticación y control de accesos basado en roles dentro del MES; comunicación con maquinaria configurada empleando las capacidades criptográficas del protocolo (por ejemplo, OPC UA con certificados X.509 y modo SignAndEncrypt, en lugar de seguridad desactivada); gestión de secretos separada del repositorio; registros de auditoría inmutables; dependencias de código actualizadas; pasarelas perimetrales gestionadas como activos actualizables; y metodologías de desarrollo seguro acordes con IEC 62443-4-1. Y el principio que suele descuidarse ante la urgencia de entrega: **cada nueva integración de sistemas representa un nuevo conducto entre zonas**, debiendo evaluarse y documentarse rigurosamente como tal.

## Conclusión

La ciberseguridad industrial constituye, ante todo, una disciplina de **diseño arquitectónico y rigor operativo**: mantener un inventario exhaustivo de activos, compartimentar redes en zonas aisladas, gobernar los conductos, catalogar el acceso remoto como vector crítico, blindar con controles compensatorios los sistemas que no admiten actualización y ensayar con regularidad la recuperación de copias y el control manual en planta. Introducir medidas de seguridad ofimáticas sin comprender el proceso físico puede detener la producción; descuidar la seguridad abre la puerta a que un incidente administrativo culmine en un paro de fábrica. La solvencia técnica se alcanza cooperando estrechamente con la ingeniería de control, nunca imponiendo criterios desconectados de la realidad de la planta.

Con este artículo concluye la serie dedicada a la automatización industrial. La [visión general de arquitectura](/es/blog/arquitectura-de-software-fabrica-moderna) sirve como punto de partida para consultar el recorrido completo.

## Referencias

Este artículo es un estudio basado en las fuentes siguientes. Los pasajes marcados como opinión reflejan mi lectura. No constituye una guía de implantación directa; las decisiones prácticas requieren evaluaciones de riesgos en la planta correspondiente. El código se ejecutó localmente.

- NIST. [SP 800-82 Rev. 3, Guide to Operational Technology (OT) Security](https://csrc.nist.gov/pubs/sp/800/82/r3/final), septiembre de 2023.
- ISA. [ISA/IEC 62443 Series of Standards](https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards). Los conceptos de zonas, conductos y niveles de seguridad descritos proceden de resúmenes técnicos secundarios, no de citas textuales de la norma.
- IEC. [IEC 62443-4-1:2018](https://webstore.iec.ch/en/publication/33615) (catálogo).
- CISA. [AA21-131A, DarkSide Ransomware: Best Practices for Preventing Business Disruption from Ransomware Attacks](https://www.cisa.gov/news-events/cybersecurity-advisories/aa21-131a).
- Congressional Research Service. [Colonial Pipeline: The DarkSide Strikes](https://www.congress.gov/crs_external_products/IN/PDF/IN11667/IN11667.2.pdf).
- CISA/ICS-CERT. [IR-ALERT-H-16-056-01, Cyber-Attack Against Ukrainian Critical Infrastructure](https://cisa.gov/news-events/ics-alerts/ir-alert-h-16-056-01). Texto completo no contrastado en esta consulta.
- Canadian Centre for Cyber Security y agencias aliadas (CISA, FBI, NCSC-UK, ASD ACSC, BSI, NCSC-NL, NCSC-NZ). [Joint guidance on secure connectivity principles for operational technology](https://cyber.gc.ca/en/news-events/joint-guidance-secure-connectivity-principles-operational-technology), actualizada en enero de 2026.
- OPC Foundation. [OPC 10000-2, Security](https://reference.opcfoundation.org/v105/Core/docs/Part2/).
