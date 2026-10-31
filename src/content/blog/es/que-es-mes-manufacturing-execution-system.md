---
title: "Qué es MES y cómo conecta planificación y producción"
description: "Qué es un MES, por qué surgió, cómo se diferencia de ERP y SCADA, qué hace (órdenes, trazabilidad, OEE) y un flujo completo desde el pedido hasta el retorno al ERP."
pubDate: 2026-10-31T10:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/o-que-e-mes-manufacturing-execution-system.webp"
coverAlt: "Ilustración con ERP, MES y PLC apilados, flechas de órdenes descendiendo y de lo ejecutado ascendiendo, con el MES destacado"
category: "Automatización Industrial"
tags:
  - "MES"
  - "Manufacturing Execution System"
  - "ISA-95"
  - "OEE"
  - "Trazabilidad"
  - "Serie Automatización Industrial"
draft: false
lang: "es"
translationKey: "what-is-mes-manufacturing-execution-system"
---

El ERP sabe que existe un pedido de 1.000 unidades. El PLC sabe que un sensor acaba de contar una más. Entre ambos existe una pregunta que ninguno de los dos responde por sí solo: **¿a qué orden, a qué lote y a qué turno pertenecen estas unidades, y la producción avanza al ritmo planificado?** Ese es el espacio que ocupa el MES.

Este es el tercer artículo de la serie. Tras la [visión general de arquitectura](/es/blog/arquitectura-de-software-fabrica-moderna) y los [PLCs](/es/blog/plcs-lenguajes-programacion-industrial), subimos al nivel de ejecución de la manufactura.

## Qué es un MES y por qué surgió

**MES** significa *Manufacturing Execution System*, sistema de ejecución de la manufactura. Según un artículo académico publicado en el *South African Journal of Industrial Engineering*, el término fue acuñado en 1990 por la consultora Advanced Manufacturing Research (AMR) para nombrar un conjunto de software que hace viable la ejecución de la manufactura mediante la integración entre los sistemas de planificación y de control.

La motivación es estructural: los sistemas de planificación (como el ERP) trabajan con horizontes de días a meses y con datos agregados, mientras que los sistemas de control (PLCs, DCS) trabajan en milisegundos y con señales de máquina. Ninguno de los dos, por sí solo, entiende que "la orden 1001 está completada al 78 %, el lote L-001 utilizó materia prima del proveedor X y la línea estuvo parada 40 minutos por falta de etiquetas". Faltaba una capa que transformase el plan en instrucciones de ejecución y las señales de la planta en información de negocio.

En el modelo ISA-95, esta capa corresponde al **nivel 3**, la *gestión de operaciones de manufactura* (Manufacturing Operations Management, MOM). La parte 3 de la norma describe un modelo de las actividades de este nivel, y la documentación de la OPC Foundation sobre la norma enumera, entre las funciones del nivel 3, producción, mantenimiento, calidad y laboratorio, y movimiento de inventario. En la práctica, "MES" es el nombre comercial más habitual para productos que cubren parte o la totalidad de este alcance. Una nota de lectura: ISA-95 describe **actividades e información**, no un producto; un mismo software puede abarcar más de una actividad y los límites varían según el proveedor.

## MES, ERP, SCADA y control: quién hace qué

| Sistema | Pregunta que responde | Horizonte | Dato típico |
|---|---|---|---|
| ERP (nivel 4) | ¿Qué necesito producir, comprar y entregar? | meses, semanas, días | pedidos, inventario, costes |
| MES (nivel 3) | ¿Qué estoy produciendo ahora y cómo va? | turnos, horas, minutos | órdenes activas, lotes, registros de producción, paradas |
| SCADA | ¿Qué está ocurriendo en el proceso? | segundos | estados, alarmas, tendencias de variables |
| PLC/DCS (nivel 2) | ¿Qué debe hacer cada máquina en este instante? | milisegundos | entradas, salidas, estados de máquina |

La confusión más común se da entre MES y ERP. Un resumen práctico (que el [artículo 04](/es/blog/erp-en-la-industria-planificacion-y-ejecucion) profundiza): **el ERP planifica y contabiliza; el MES ejecuta y registra lo que realmente ocurrió**. El ERP decide que se fabricarán 1.000 unidades antes del viernes; el MES coordina cómo ocurre eso en la línea, en qué secuencia, con qué material, e informa el resultado real.

La diferencia frente al SCADA reside en el alcance y en la semántica. El SCADA supervisa variables de proceso y comanda equipos; por naturaleza, no sabe qué es una orden de fabricación o un lote. En muchas plantas ambos se integran, con el SCADA o el historiador alimentando al MES con eventos y recuentos. El artículo 05 compara los cuatro en detalle.

## Qué hace un MES

El conjunto de funciones varía según el proveedor y el sector industrial. Las más habituales:

- **Gestión de órdenes de fabricación.** Recibe las órdenes liberadas por el ERP, las programa y distribuye a líneas o estaciones, y realiza el seguimiento de su estado.
- **Registro de producción.** Registra cantidades conformes, descarte, retrabajo y tiempos, de forma manual (operador) o automática (mediante equipos).
- **Trazabilidad (genealogía).** Vincula el producto final, el lote, las materias primas consumidas, el equipo, el turno y el operador, en ambos sentidos: desde un lote de materia prima hacia los productos que lo utilizaron, y desde un producto terminado hacia sus insumos. En sectores regulados (alimentos, farmacéutico, automotriz, dispositivos médicos) esto suele ser obligatorio.
- **Control de calidad.** Recopila inspecciones y resultados de ensayos, aplica planes de muestreo y bloquea lotes fuera de especificación.
- **Gestión de recursos y materiales.** Estado de equipos, utillajes, disponibilidad de material en las líneas e instrucciones digitales de trabajo.
- **Monitorización de paradas e indicadores.** Motivos de parada, tiempo de ciclo y OEE.

### OEE

El **OEE** (Overall Equipment Effectiveness) es el indicador más asociado al MES. En su formulación más extendida, es el producto de tres factores:

- **Disponibilidad** = tiempo en que la máquina produjo ÷ tiempo planificado de producción;
- **Rendimiento** = producción real ÷ producción teórica en el tiempo operado (relación frente al tiempo de ciclo ideal);
- **Calidad** = piezas conformes ÷ piezas totales producidas.

La norma **ISO 22400-2** (2014) define indicadores de desempeño para la gestión de operaciones de manufactura, especificando fórmula, unidad y comportamiento temporal para cada uno, utilizando las unidades de trabajo de la IEC 62264. Como ISO 22400 es una norma de pago y esta consulta se basó en el catálogo, trate las fórmulas anteriores como la formulación corriente del mercado y verifique en la norma las definiciones exactas antes de adoptar el indicador contractualmente. El punto práctico: dos sistemas pueden etiquetar como "OEE" números distintos si definen de forma dispar qué es tiempo planificado o parada programada. Definir esto es una decisión de proyecto, no un detalle menor.

Un cálculo **hipotético** para ilustrar la idea: turno de 480 min, 60 min de parada, tiempo de ciclo ideal de 0,5 min/unidad, 810 unidades producidas, de las cuales 30 fueron de descarte.

- Disponibilidad = 420 / 480 = 0,875
- Rendimiento = (0,5 × 810) / 420 = 0,964
- Calidad = 780 / 810 = 0,963
- OEE = 0,875 × 0,964 × 0,963 ≈ 0,813 (equivale a 0,5 × 780 / 480)

## Un flujo completo: desde el pedido hasta el retorno

El siguiente ejemplo es **hipotético y simplificado**: una fábrica de productos envasados, con un MES situado entre el ERP y las líneas.

```text
1. El cliente realiza un pedido (1.000 uds. de SKU-A)
2. ERP: comprueba stock, crea la orden de producción OP-1001, reserva materiales
3. ERP → MES: libera OP-1001 (producto, cantidad, receta/ruta, fecha)
4. MES: programa en la línea ENV-01, valida disponibilidad de material,
        genera los lotes y las instrucciones de trabajo
5. MES → control (vía SCADA/gateway): receta y parámetros de la orden
6. El PLC ejecuta; los sensores cuentan; se señalizan paradas y fallos
7. Control → MES: recuentos, estados, alarmas relevantes
8. MES: guarda registros de producción, asocia lotes de materia prima, registra calidad
9. MES → ERP: cantidad producida/descarte, consumo real, estado de la orden
10. ERP: actualiza inventario de producto terminado y coste real
```

<figure>
  <img src="/images/blog/o-que-e-mes-manufacturing-execution-system-diagrama.webp" alt="Diagrama de secuencia con cuatro participantes: ERP, MES, SCADA/gateway y PLC. El ERP libera la orden al MES, que envía receta y parámetros al SCADA y comandos al PLC; recuentos y estados regresan al MES, que devuelve cantidad, descarte y estado al ERP." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Flujo resumido desde el pedido hasta el retorno al ERP (ejemplo hipotético). Diagrama del autor.</figcaption>
</figure>

Varios aspectos de diseño permanecen implícitos en este flujo:

- **Idempotencia.** Los recuentos y registros de producción pueden reenviarse tras un fallo de red. El MES debe ser capaz de recibir el mismo mensaje dos veces sin duplicar la producción.
- **Fuente de la verdad.** La orden se origina en el ERP; la ejecución real se origina en el MES. Cuando surgen discrepancias (órdenes modificadas en el ERP tras haber sido liberadas), se requiere una regla explícita de conciliación.
- **Autonomía de la línea.** El paso 6 no depende de la disponibilidad del MES; la línea puede continuar produciendo y los eventos se reenvían al restablecerse la comunicación. Esta es una decisión de arquitectura, no un comportamiento que cualquier producto garantice por defecto.

## Cómo se construye un MES

Desde la perspectiva del software, un MES es un sistema de **dominio rico, integración intensiva y alta exigencia de disponibilidad**. Existen tres caminos habituales: adquirir un producto comercial, personalizar una plataforma o desarrollar una solución a medida. El coste y la flexibilidad dependen de cada contexto. Los módulos más habituales reflejan las funciones de negocio: órdenes, registro de producción, trazabilidad, calidad, equipos/mantenimiento, indicadores e integración.

**Base de datos.** Las bases de datos relacionales (PostgreSQL, SQL Server, Oracle y similares) constituyen la elección estándar para el modelo transaccional: órdenes, lotes, genealogía y registros exigen integridad referencial y consistencia. Los datos de proceso de alta frecuencia suelen derivarse a un historiador o base de series temporales, separada del núcleo transaccional (tema tratado en el artículo 08).

Un esquema **ilustrativo** del núcleo relacional en PostgreSQL (probado en PostgreSQL 17 antes de publicar):

```sql
CREATE TABLE work_order (
  id            bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  erp_order_no  text NOT NULL UNIQUE,
  product_code  text NOT NULL,
  qty_planned   integer NOT NULL CHECK (qty_planned > 0),
  status        text NOT NULL DEFAULT 'RELEASED'
                CHECK (status IN ('RELEASED','RUNNING','COMPLETED','CANCELLED'))
);

CREATE TABLE production_report (
  id            bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  work_order_id bigint NOT NULL REFERENCES work_order(id),
  lot_code      text NOT NULL,
  machine_code  text NOT NULL,
  reported_at   timestamptz NOT NULL,
  qty_good      integer NOT NULL CHECK (qty_good >= 0),
  qty_scrap     integer NOT NULL DEFAULT 0 CHECK (qty_scrap >= 0),
  UNIQUE (machine_code, reported_at)   -- el reenvío del mismo registro no duplica datos
);

-- Reenvío seguro:
INSERT INTO production_report
  (work_order_id, lot_code, machine_code, reported_at, qty_good, qty_scrap)
VALUES (1, 'L-001', 'ENV-01', '2026-03-02 09:00+00', 380, 20)
ON CONFLICT (machine_code, reported_at) DO NOTHING;

-- Progreso de la orden:
SELECT w.erp_order_no, w.qty_planned,
       SUM(r.qty_good) AS buenas, SUM(r.qty_scrap) AS descarte,
       round(100.0 * SUM(r.qty_good) / w.qty_planned, 1) AS pct_completado
FROM work_order w
JOIN production_report r ON r.work_order_id = w.id
GROUP BY w.id;
```

El modelo real abarca mucho más: listas de materiales (BOM) y rutas, genealogía de lotes, estados de maquinaria, árboles de motivos de parada, planes de inspección, usuarios y auditoría. La restricción `UNIQUE (machine_code, reported_at)` ilustra una técnica de integración simple: emplear una clave natural para hacer idempotente la ingesta de eventos. En producción, la clave idónea dependerá de cómo identifique los eventos cada equipo o pasarela industrial.

**Integración.** Hacia abajo, el MES se comunica con SCADA, historiadores, pasarelas y PLCs mediante protocolos como OPC UA, que cuenta con una especificación de modelo común para ISA-95 (OPC 10030). Hacia arriba, se integra con el ERP mediante APIs, mensajería o archivos; la norma ISA-95 parte 5 aborda las transacciones entre los sistemas de negocio y de manufactura. La elección entre REST, colas de mensajería u otros mecanismos es una decisión de arquitectura sujeta al contexto de cada planta.

## Desafíos de implementación

- **Alcance y límites.** ¿Dónde termina el ERP y dónde comienza el MES? Los catálogos de producto, las rutas y los costes disputan la propiedad del dato. Definir esto tempranamente evita duplicidades y conflictos de sincronización.
- **Calidad de datos en planta.** El registro manual introduce errores y retrasos; el registro automatizado exige integrar maquinaria heterogénea y, en ocasiones, autómatas legados que no exponen datos de manera estructurada.
- **Adopción por parte del operario.** Un MES que dificulte la operativa diaria será evitado mediante hojas de cálculo o notas en papel. La interfaz y el flujo deben acoplarse al ritmo real de la línea.
- **Disponibilidad.** Una interrupción del MES no debe detener la producción física; es indispensable definir la operativa offline de la línea y el método de conciliación posterior.
- **Definición de indicadores.** Como se observó con el OEE, las métricas solo resultan comparables si sus definiciones subyacentes son idénticas.
- **Evolución continua.** Las modificaciones en productos, recetas y líneas son constantes; el sistema debe admitir reconfiguraciones sin requerir recompilaciones de código.

## Relación con la ingeniería de software

Desde mi punto de vista, un MES representa un escenario ideal para aplicar diseño guiado por el dominio (DDD) y arquitectura orientada a eventos con rigor: el dominio es rico (órdenes, lotes, recursos, eventos de producción), la integración es asíncrona por naturaleza, y la consistencia y la trazabilidad priman sobre la velocidad de entrega de funcionalidades. Al mismo tiempo, no es un sistema abordable como un simple CRUD web: la dimensión temporal, los fallos parciales, la idempotencia y la auditoría deben concebirse en el diseño inicial. El [artículo 07](/es/blog/ingenieria-de-software-para-manufactura) aborda estas decisiones.

## Conclusión

El MES existe porque planificar y ejecutar son problemas distintos, con escalas temporales, responsables y modelos de datos diferentes. Se encarga de traducir órdenes en ejecución y señales de máquina en información de negocio, devolviendo al ERP lo que verdaderamente ocurrió en planta. Comprender estos límites entre planificación (ERP), ejecución (MES), supervisión (SCADA) y control (PLC) es lo que permite diseñar integraciones sólidas e indicadores de rendimiento fiables.

## Referencias

Este artículo es un estudio basado en las fuentes siguientes. Los pasajes marcados como opinión reflejan mi lectura. El flujo de pedido, el cálculo de OEE y el esquema SQL son hipotéticos e ilustrativos.

- [Realising the potential of manufacturing execution systems](https://sajie.journals.ac.za/pub/article/view/358). South African Journal of Industrial Engineering, [DOI 10.7166/12-1-358](https://doi.org/10.7166%2F12-1-358) (origen del término MES, AMR, 1990). Año y autoría no verificados con certeza (las fuentes consultadas difieren); confirmar en la página de la revista antes de citar formalmente.
- ISA. [ISA-95 Standard: Enterprise-Control System Integration](https://www.isa.org/standards-and-publications/isa-standards/isa-95-standard). Descripción de las partes, incluyendo la Parte 3 (actividades de operaciones de manufactura).
- OPC Foundation. [OPC 10030, 4.2.3 ISA-95](https://reference.opcfoundation.org/specs/OPC-10030/4.2.3).
- ISO. [ISO 22400-2:2014, Key performance indicators (KPIs) for manufacturing operations management, Part 2: Definitions and descriptions](https://www.iso.org/standard/54497.html). Consulta limitada al catálogo; las fórmulas no fueron verificadas en el texto de la norma.
