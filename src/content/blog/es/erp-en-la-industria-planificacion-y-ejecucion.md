---
title: "ERP en la industria: cómo organiza una operación de manufactura"
description: "Cómo planifica un ERP la manufactura: MRP, explosión de BOM, rutas, órdenes de producción, inventario, compras, costes, diferencias con MES y giros de demanda."
pubDate: 2026-10-31T10:30:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/erp-na-industria-planejamento-e-execucao.webp"
coverAlt: "Ilustración de una lista de materiales en árbol: el producto A consume 2 unidades de B y 1 de C, y B consume 3 de D"
category: "Automatización Industrial"
tags:
  - "ERP"
  - "MRP"
  - "BOM"
  - "Planificación de Producción"
  - "Integración ERP MES"
  - "Serie Automatización Industrial"
draft: false
lang: "es"
translationKey: "erp-in-industry-planning-and-execution"
---

En las conversaciones sobre software industrial, el ERP suele ser el sistema más nombrado y, al mismo tiempo, el menos comprendido por los desarrolladores encargados de integrarlo. Un ERP no gobierna actuadores físicos ni monitoriza la cadencia de la maquinaria en milisegundos. Su función troncal radica en **planificar, asignar recursos corporativos y contabilizar costes**: determina qué debe fabricarse y adquirirse, bloquea materiales en almacén, calcula márgenes y concilia el balance financiero.

Este es el cuarto artículo de la serie. Tras revisar la [arquitectura global de planta](/es/blog/arquitectura-de-software-fabrica-moderna), los [PLCs](/es/blog/plcs-lenguajes-programacion-industrial) y el [MES](/es/blog/que-es-mes-manufacturing-execution-system), analizamos el nivel 4 del estándar ISA-95.

## Qué es un ERP

Un **ERP** (Enterprise Resource Planning) es una suite integrada de módulos que comparten una única base de datos empresarial: contabilidad y finanzas, ventas, compras, gestión de almacén, producción, costes, recursos humanos y logística. Su rasgo determinante es la **coherencia alrededor de maestros comunes**: la misma ficha de artículo, cliente y proveedor alimenta todos los departamentos; así, una transacción en un área (como una recepción en el muelle de descarga) impacta automáticamente en existencias, cuentas a pagar y valoración contable.

En la industria manufacturera, el módulo fabril del ERP gestiona la planificación corporativa, no la ejecución en el taller. Conforme a la taxonomía ISA-95 recogida por la OPC Foundation, los sistemas de negocio pertenecen al nivel 4, operando en horizontes temporales de meses, semanas y días.

## La evolución desde el MRP hasta el ERP moderno

La evolución histórica se estructura habitualmente en etapas sucesivas. Las fechas y referencias que siguen proceden de fuentes secundarias especializadas (publicaciones de consultoría y proveedores de software); deben tomarse como el relato consolidado en el sector, más que como registros historiográficos estrictos:

- **MRP (Material Requirements Planning).** Atribuido a Joseph Orlicky en la década de 1960. Su algoritmo matemático central: partiendo de la demanda de productos terminados, la estructura de componentes y las existencias en almacén, calcula **qué, cuánto y cuándo** fabricar o aprovisionar de cada elemento.
- **MRP en bucle cerrado (closed-loop MRP).** Incorporó la validación de viabilidad frente a la capacidad real de los centros de trabajo y la retroalimentación de lo ejecutado en planta.
- **MRP II (Manufacturing Resource Planning).** Atribuido a Oliver Wight a principios de los años 80. Amplió la planificación hacia la mano de obra, programación de maquinaria, proyección financiera y previsiones de ventas.
- **ERP.** Término generalizado en la década de 1990 (atribuido a la consultora Gartner) que extiende la integración modular al conjunto de la corporación.

Para los ingenieros de software, la conclusión relevante es la continuidad técnica: el motor matemático del cálculo de producción en los ERPs modernos sigue siendo, conceptualmente, la explosión de necesidades de materiales.

## Los datos maestros de la manufactura

La planificación corporativa solo es tan fiable como la exactitud de los datos maestros que la sustentan.

**Maestro de artículos / materiales.** Cada materia prima, semielaborado y producto terminado, catalogado con su unidad de medida, política de reaprovisionamiento, plazo de entrega del proveedor (*lead time*), lote mínimo de compra y stock de seguridad.

**Lista de materiales (BOM, Bill of Materials).** La estructura jerárquica del producto: qué componentes y en qué cantidades exactas conforman un conjunto superior. Es modular y escalonada (un producto terminado agrupa semielaborados, que a su vez contienen materias primas). La documentación de Microsoft Dynamics 365 Supply Chain Management expone el comportamiento estándar: durante la planificación maestra, el motor recorre los niveles activos de la BOM asignada a la orden de producción. Las listas de materiales cuentan con rangos de vigencia temporal para contemplar cambios de diseño de ingeniería.

**Ruta de fabricación (routing).** La secuencia de operaciones necesarias para manufacturar un artículo, asignando centros de trabajo, maquinaria específica, tiempos de preparación (*setup*) y cadencias unitarias de ejecución. Sirve para planificar la capacidad de planta y computar la absorción de costes laborales.

**Centros de trabajo y capacidad.** Recursos productivos, calendarios de turnos laborales y capacidad nominal disponible.

**Proveedores y condiciones de suministro.** Plazos logísticos, lotes mínimos de pedido y tarifas comerciales.

## El cálculo de necesidades de materiales: explosión de BOM y cálculo neto

El núcleo algorítmico del MRP reside en la **explosión de la lista de materiales con cálculo neto (*netting*)**: a partir de los pedidos de clientes, el sistema desciende por el árbol del producto deduciendo en cada nivel el inventario disponible y las órdenes de compra en curso, hasta obtener las necesidades netas reales de fabricación y compra.

Un ejemplo **hipotético** y deliberadamente reducido. El producto terminado A requiere 2 unidades de B y 1 de C. El componente B requiere 3 unidades de D. Stock inicial en almacén: A=10, B=20, C=0, D=50. Demanda: pedido de cliente de 100 unidades de A.

```text
A: demanda 100 − stock 10       = necesidad neta  90
B: 90 × 2 = 180 − stock 20      = necesidad neta 160
C: 90 × 1 =  90 − stock 0       = necesidad neta  90
D: 160 × 3 = 480 − stock 50     = necesidad neta 430
```

En SQL, este cálculo recursivo —en un árbol donde cada componente interviene de forma unívoca— puede implementarse mediante una CTE recursiva (*Common Table Expression*). El código fue probado y validado en PostgreSQL 17 antes de publicarse:

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

El resultado (A: 90, B: 160, C: 90, D: 430) coincide con el cálculo aritmético manual. Este fragmento representa una simplificación didáctica. Un motor MRP real aborda una casuística mucho más amplia: componentes compartidos entre distintas ramas a diferentes profundidades (lo que obliga a consolidar necesidades según el código de nivel inferior, *low-level code*), **plazos de aprovisionamiento desfasados en el tiempo**, reglas de agrupamiento de lotes, mermas porcentuales de fabricación y existencias multialmacén. Esta consulta ilustra el concepto matemático, no sustituye a un planificador industrial.

### Planificación y órdenes de fabricación

El resultado de una corrida de MRP se traduce en **propuestas de aprovisionamiento**: órdenes planificadas de producción, solicitudes de compra y traslados de almacén. En los ERPs empresariales, una orden planificada es una entidad flexible: se recalcula y ajusta en cada ejecución nocturna del motor. Al ser **confirmada** (*firmed*) o convertida por los planificadores, pasa a ser una **orden de producción** oficial: su BOM y ruta quedan congeladas, se programan fechas de inicio/fin y se bloquea el inventario de componentes. Casos documentados en el sector:

- En la documentación de SAP (referencias clásicas de help que ilustran el estándar), las órdenes planificadas se convierten para desencadenar el suministro, generando solicitudes de compra u órdenes de fabricación o procesos.
- En Dynamics 365 de Microsoft, el plazo de entrega de una orden planificada proviene de parámetros estáticos del artículo, mientras que el de una orden confirmada se calcula dinámicamente según las restricciones de capacidad de la ruta. En consecuencia, **la fecha comprometida inicialmente en el plan corporativo y la fecha físicamente viable tras la secuenciación de planta pueden diferir**.

## Inventario, aprovisionamiento y costes industriales

**Control de inventario.** El ERP gestiona existencias contables por artículo, almacén, ubicación, lote y número de serie a través de movimientos continuos: albaranes de recepción, imputación de consumos a órdenes, declaraciones de producto terminado, expediciones comerciales y ajustes de inventario.

**Compras.** Las necesidades netas de materias primas generan propuestas de compra. Los plazos logísticos de los proveedores alimentan el algoritmo del MRP. La documentación técnica de Microsoft ilustra cómo repercute esto: si el plazo del proveedor excede el tiempo disponible hasta el inicio de la fabricación, el sistema calcula el retraso acumulado y lo propaga a lo largo de todos los niveles de la BOM hasta recalcular la fecha de entrega del pedido del cliente.

**Costes de producción.** El ERP acumula consumos reales de materiales, horas de mano de obra y costes indirectos de fabricación por cada orden de producción, contrastándolos con el escandallo estándar. La precisión de este cálculo depende de la fidelidad del registro en planta, que es donde interviene el MES: las cantidades efectivas de materia prima, las horas de máquina y las piezas de descarte proceden de la ejecución real.

## ERP frente a MES: planificar frente a ejecutar

La divergencia esencial en una única definición: **el ERP responde a "¿qué y cuánto debemos producir, con qué materiales y a qué coste teórico?"; el MES responde a "¿qué se está fabricando en este momento, en qué puesto concreto y qué consumos y descarte han ocurrido verdaderamente en planta?".**

| Criterio | ERP | MES |
|---|---|---|
| Horizonte temporal | Días, semanas, meses | Turnos, horas, minutos |
| Granularidad | Órdenes de fabricación, artículos, lotes contables | Operaciones de puesto, ciclos de máquina, eventos |
| Cometido | Planificar, aprovisionar, contabilizar | Ejecutar, registrar, asegurar trazabilidad |
| Datos primarios | Demanda agregada, inventario, costes estándar | Registros de piezas, estados de máquina, calidad |
| Tolerancia a cortes | Indisponibilidades breves no detienen la maquinaria | Caídas de servicio detienen o descontrolan la línea |
| Fuente de la verdad | La orden de trabajo planificada y los saldos contables | La ejecución real y la genealogía del lote en planta |

En talleres pequeños, un ERP básico con captura de partes de trabajo manuales puede bastar sin necesidad de un MES, constituyendo una opción legítima. Los problemas aparecen cuando se intenta forzar al ERP a gestionar la trazabilidad en milisegundos, el registro automatizado de microparadas o el interbloqueo con autómatas, cometidos para los que no fue concebido.

## Escenario: la demanda de clientes cae de 100 a 60 unidades

Retomando el modelo hipotético, supongamos que el cliente reduce su pedido comercial de A de 100 a 60 unidades. Al ejecutar de nuevo la consulta recursiva con demanda 60, las necesidades netas descienden a A=50, B=80, C=50 y D=190 (frente a las 90, 160, 90 y 430 originales). En un entorno real de gestión, este ajuste impacta en diferentes áreas:

1. **Planificación.** En la siguiente ejecución del MRP, las órdenes planificadas se contraen. Conviene notar que, según la documentación de Microsoft, las modificaciones manuales sobre órdenes planificadas no se reflejan automáticamente en el resto de la estructura hasta la siguiente corrida completa del planificador.
2. **Aprovisionamiento.** Los pedidos de compra ya emitidos al proveedor para el material D no desaparecen solos: el ERP genera avisos de sobrestock y compras debe gestionar cancelaciones, demoras de entrega o admisión en almacén según los contratos vigentes.
3. **Planta de producción.** Las órdenes ya confirmadas y liberadas al taller tienen listas de materiales y recursos congelados. Modificar una orden en ejecución requiere reprogramar la secuencia en el MES y conciliar las piezas ya procesadas.
4. **Almacén y finanzas.** El excedente ya manufacturado se convierte en inventario inmovilizado, impactando en el capital circulante y en los costes de custodia.

La lección de arquitectura radica en que **las variaciones de demanda se propagan a velocidades distintas en cada estrato organizativo**, obligando al software a modelar estados de ciclo de vida explícitos (Planificada, Confirmada, Liberada, En Proceso, Concluida) en lugar de asumir que la realidad de planta se recalcula instantáneamente sin fricciones.

## Retos de integración entre ERP y MES

**Titularidad del dato.** La orden nace en el ERP; la ejecución nace en el MES. Los catálogos de artículos, las listas de materiales y las rutas maestras se definen habitualmente en el ERP y se replican hacia el MES. Mantener catálogos independientes en ambos entornos es el origen clásico de inconsistencias en planta.

**Comunicaciones asíncronas.** El ERP corporativo no ofrece tiempos de respuesta en milisegundos y la línea productiva jamás debe detenerse ante el reinicio o mantenimiento del ERP. La integración debe cimentarse en colas de mensajes o transferencias estructuradas de datos, garantizando reintentos e idempotencia. La parte 5 de ISA-95 estandariza las transacciones entre sistemas de negocio y operaciones de fabricación (B2M); adoptar esta taxonomía simplifica el acoplamiento.

**Nivel de agregación.** El ERP procesa volúmenes agregados por orden de fabricación; la maquinaria en planta genera señales continuas por segundo. El MES debe actuar como filtro consolidando la telemetría en intervalos de negocio comprensibles.

**Husos horarios y cierres de turno.** Los cierres contables mensuales, los relevos de turnos de operarios y los cambios de horario estacional exigen una modelización temporal rigurosa que trasciende el mero uso de marcas horarias UTC.

**Calidad y logística de expedición.** El diálogo con sistemas de calidad (desbloqueo de lotes) y de logística de almacén (SGA/WMS) comparte esta dinámica: el ERP requiere confirmar que un lote cuenta con visto bueno de laboratorio antes de facturar y expedir, mientras que el almacén precisa albaranes para consolidar los envíos.

## Relación con la ingeniería de software

Desde mi punto de vista, el concepto fundamental para los desarrolladores radica en concebir el ERP como un **sistema de registro formal (*system of record*)**, no como un motor reactivo de tiempo real. Esto permite delimitar con claridad dónde actúa como custodio maestro (artículos, órdenes, saldos financieros), dónde opera como consumidor (consumos reales, descarte de piezas) y cómo estructurar interfaces asíncronas inmunes a retrasos. Asimismo, previene la tentación recurrente de sobrecargar el ERP con telemetría de máquina o de implementar la contabilidad general dentro del MES. El [artículo 05](/es/blog/mes-erp-scada-historian-diferencias-e-integracion) compara ERP, MES, SCADA e historiadores cara a cara.

## Conclusión

El ERP vertebra la manufactura desde la óptica de los datos maestros, la demanda comercial y la contabilidad analítica. La lógica de explosión de listas de materiales con cálculo neto constituye el motor clásico de la planificación fabril, pero habita en el dominio de las cantidades teóricas y los plazos programados, no en el de la ejecución en máquina. Diseñar integraciones eficaces entre ERP y MES requiere comprender esta diferencia de naturaleza y preparar los sistemas para absorber variaciones operativas que se propagan a ritmos dispares.

## Referencias

Este artículo es un estudio basado en las fuentes siguientes. Los pasajes marcados como opinión reflejan mi lectura. El árbol de BOM, la consulta recursiva en SQL y los supuestos de demanda son hipotéticos y de carácter ilustrativo.

- Microsoft. [Production planning (Planning Optimization), Dynamics 365 Supply Chain Management](https://learn.microsoft.com/en-us/dynamics365/supply-chain/master-planning/planning-optimization/production-planning), Microsoft Learn. Referencia de plataforma comercial.
- SAP. [Planned orders, SAP Help (release 4.6C)](https://help.sap.com/saphelp_46c/helpdata/en/0a/2479384cda1269e10000009b38f8cf/content.htm). Documentación técnica sobre los conceptos de conversión de órdenes planificadas.
- OPC Foundation. [OPC 10030, 4.2.3 ISA-95](https://reference.opcfoundation.org/specs/OPC-10030/4.2.3), niveles jerárquicos y horizontes temporales en ISA-95.
- ISA. [ISA-95 Standard: Enterprise-Control System Integration](https://www.isa.org/standards-and-publications/isa-standards/isa-95-standard).
- Sobre la trayectoria histórica de MRP, MRP II y ERP: las cronologías y menciones de autoría (Orlicky, Wight, Gartner) provienen de publicaciones secundarias del sector (como [MRPeasy](https://www.mrpeasy.com/de/?p=6152) y [EBSCO Research Starters](https://www.ebsco.com/research-starters/business-and-management/material-requirements-planning-mrp)); verificar con textos originales antes de citas formales.
