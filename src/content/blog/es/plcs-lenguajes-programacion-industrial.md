---
title: "PLCs e IEC 61131-3: cómo el software controla maquinaria"
description: "Cómo funciona un PLC: ciclo de scan, imagen de proceso, Ladder, Structured Text, FBD, SFC e IL de IEC 61131-3, con ejemplos prácticos y contraste con software web."
pubDate: 2026-10-31T09:30:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/plcs-linguagens-programacao-industrial.webp"
coverAlt: "Ilustración del ciclo de scan de un autómata (PLC): lectura de entradas, ejecución del programa y escritura de salidas en bucle cerrado, con un peldaño Ladder debajo"
category: "Automatización Industrial"
tags:
  - "PLC"
  - "IEC 61131-3"
  - "Ladder"
  - "Structured Text"
  - "Automatización Industrial"
  - "Serie Automatización Industrial"
draft: false
lang: "es"
translationKey: "plc-industrial-programming-languages"
---

En el [artículo anterior](/es/blog/arquitectura-de-software-fabrica-moderna), el autómata programable (PLC) figuró como el componente central del nivel de control: el encargado de leer sensores, ejecutar algoritmos lógicos y gobernar actuadores mecánicos. Aquí abrimos esa caja negra. ¿Cómo procesa código un controlador industrial? ¿Por qué la automatización de planta exige lenguajes propios? ¿Y qué cambia en términos de ingeniería de software cuando el programa acciona una prensa de estampado en lugar de devolver un JSON?

## Qué es un PLC

Un **PLC** (Programmable Logic Controller, o autómata programable industrial) es un ordenador diseñado para controlar procesos físicos en tiempo real de forma continua, determinista y robusta. Dispone de CPU, memoria de trabajo, módulos de entradas y salidas físicas (o conexión a periferia descentralizada mediante buses de campo) y un motor de ejecución que itera la lógica de control indefinidamente.

La norma internacional **IEC 61131** estructura la familia de estándares aplicables a los autómatas programables. Su tercera parte, **IEC 61131-3**, define la sintaxis y la semántica de un conjunto armonizado de lenguajes de programación industrial. La primera edición data de comienzos de los años 90; la tercera edición se publicó en 2013 y, según los catálogos técnicos de la IEC, fue reemplazada en mayo de 2025 por una nueva revisión. La documentación de la edición de 2013 la define como una revisión técnica compatible que incorporó tipos de datos avanzados, funciones de conversión, referencias explícitas, espacios de nombres y soporte de orientación a objetos para clases y bloques de función.

Dos precisiones fundamentales de partida:

- La norma IEC 61131-3 estandariza **lenguajes y modelos lógicos de software**, no las especificaciones del hardware físico ni los protocolos de comunicaciones. Protocolos como PROFINET o EtherNet/IP pertenecen a ámbitos normativos distintos (tratados en el artículo 06).
- **La conformidad es parcial y depende de cada fabricante.** Cada entorno de ingeniería comercial adopta la norma con dialectos, omisiones y extensiones propias. Un programa desarrollado para una plataforma rara vez compila en otra sin adaptaciones considerables.

## Estructura interna del autómata: entradas, salidas y el ciclo de scan

El paradigma de ejecución característico de un PLC es el **ciclo de scan** (ciclo de barrido), ejecutado de forma continua en un bucle cerrado:

1. **Lectura de entradas.** El estado de los canales de entrada físicos se lee y se almacena en una zona de memoria interna denominada imagen de proceso de entradas (PII).
2. **Ejecución de la lógica.** El programa de usuario se evalúa operando exclusivamente sobre dicha imagen en memoria, no interrogando al hardware en tiempo real.
3. **Escritura de salidas.** Los resultados calculados se transfieren desde la imagen de proceso de salidas (PIQ) a los módulos físicos actuadores.
4. **Tareas de gestión del sistema** (comunicaciones, diagnósticos internos), variables según el microprocesador.

El manual de ciclo y tiempos de reacción del Siemens S7-1500 documenta con precisión esta estructura: en cada ciclo se actualizan las imágenes de proceso y a continuación se ejecuta el programa cíclico principal (el bloque OB1). El documento introduce una distinción operativa esencial: el **tiempo de ciclo** es solo una fracción del **tiempo de reacción** global, medido desde que una señal física conmuta en el sensor hasta que se materializa la conmutación física en la salida. Si una entrada cambia a mitad de la ejecución del scan, solo se evaluará en el ciclo posterior.

¿Por qué emplear una imagen de proceso? Para garantizar que durante un pase completo del programa cada entrada conserve un valor estrictamente invariable. Sin este mecanismo atómico, dos instrucciones de un mismo ciclo podrían leer estados contradictorios de un sensor con rebotes, provocando comportamientos erráticos.

La norma IEC 61131-3 añade una capa organizativa superior: un **recurso** de hardware (una CPU física) puede gobernar múltiples **tareas**, cada una ligada a programas ejecutados periódicamente o activados por interrupción física. Así, un único autómata puede compatibilizar una tarea de interpolación de ejes de 1 ms con un control secuencial de transporte de 50 ms asignando prioridades distintas. La nomenclatura concreta (bloques OB en Siemens, tareas periódicas en Rockwell) varía según el entorno.

### Entradas y salidas físicas

- **Digitales:** dos estados binarios (0 o 1). Ejemplos: detectores inductivos de proximidad (entrada), contactores de arranque de motores (salida).
- **Analógicas:** señales en rangos continuos de tensión o corriente convertidas a números enteros mediante conversores A/D (bucles 4–20 mA, 0–10 V). El programa debe **escalar** el valor entero en bruto a magnitudes de ingeniería (bar, °C, mm/s) y detectar roturas de hilo o saturación.
- **Especiales:** tarjetas de contaje rápido para encoders, salidas de tren de pulsos (PTO), pasarelas serie.

## Los cinco lenguajes de la norma IEC 61131-3

La norma estandariza lenguajes gráficos y textuales que coexisten en el mismo proyecto, compartiendo estructuras de datos y bloques de función homogéneos.

**Diagrama Ladder o de Contactos (LD).** Lenguaje gráfico inspirado en los esquemas eléctricos de lógica cableada por relés. Las instrucciones se ordenan en "peldaños" (*rungs*) situados entre dos barras de alimentación virtual. Es el lenguaje más difundido en fabricación discreta debido a su lectura directa para electricistas y personal de mantenimiento en planta.

**Diagrama de Bloques de Funciones (FBD).** Lenguaje gráfico de flujo de señales donde los algoritmos se encapsulan en bloques interconectados por líneas de datos, similar a esquemas electrónicos. Muy utilizado en lazos de control PID, interbloqueos de proceso y tratamiento de señales analógicas.

**Texto Estructurado (ST).** Lenguaje textual de alto nivel con sintaxis emparentada con Pascal. Es el más afín al desarrollo de software convencional: definición formal de variables, estructuras de control (`IF-THEN-ELSE`, `CASE`), bucles iterativos (`FOR`, `WHILE`) y modularización funcional. Idóneo para cálculos matemáticos complejos, procesado de datos y máquinas de estados elaboradas.

**Diagrama Funcional Secuencial (SFC).** Lenguaje gráfico basado en redes de Petri que estructura la lógica en **etapas** operativas (estados) y **transiciones** condicionadas, admitiendo ramas divergentes y convergentes simultáneas. Es la herramienta por excelencia para procesos secuenciales, recetas y control por fases.

**Lista de Instrucciones (IL).** Lenguaje textual de bajo nivel semejante a ensamblador. Fue **declarado obsoleto (deprecated) en la tercera edición de 2013** y **suprimido en la cuarta edición de 2025**, según la literatura técnica consultada. Aún pervive en bases de código heredadas y algunos entornos lo mantienen por compatibilidad retroactiva. No debe emplearse en proyectos de nueva implantación.

### Criterios de selección de lenguajes

| Lenguaje | Naturaleza | Usos habituales | Ventaja clave | Limitación técnica |
|---|---|---|---|---|
| LD | Gráfica | Interbloqueos, maniobras discretas, diagnóstico en campo | Inmediato para técnicos electricistas | Poco adecuado para algoritmos matemáticos complejos |
| FBD | Gráfica | Lazos analógicos, regulación PID | Visualización clara del flujo de señal | Los diagramas extensos pierden legibilidad |
| ST | Textual | Algoritmos, cálculo, arrays y estructuras de datos | Gran expresividad, compatible con control de versiones | Menos accesible para personal sin base informática |
| SFC | Gráfica | Secuencias automáticas y máquinas de estados | Visibilidad directa de la secuencia activa | Exige modelado metodológico previo riguroso |
| IL | Textual | Mantenimiento de código heredado | Huella de memoria compacta | Obsoleto y eliminado de la norma |

En la práctica industrial, las ingenierías combinan lenguajes: SFC o ST para la coordinación secuencial, Ladder para interbloqueos de seguridad operativa visibles para el mantenimiento, FBD para regulación continua y ST para manipulaciones algorítmicas. Esta articulación refleja la experiencia de planta habitual más que una obligación estricta, variando sensiblemente según el sector y la región.

## Ejemplo 1: Arranque y parada de motor con circuito de autorretención en Ladder

El circuito clásico de maniobra utiliza una conexión de **autorretención** o enclavamiento (*seal-in*): un pulsador normalmente abierto energiza la bobina y un contacto auxiliar del propio contactor mantiene el circuito cerrado tras soltar el botón, hasta que un pulsador de parada o relé térmico interrumpe la corriente. Representación esquemática textual:

```text
|     Start        Stop      Overload       Motor    |
|--+---[ ]----+----[/]--------[/]-----------( )------|
|  |          |                                      |
|  |  Motor   |                                      |
|  +---[ ]----+                                      |
```

El contacto de realimentación `Motor` se sitúa en paralelo con `Start`: cualquiera de los dos caminos alimenta el tramo derecho del peldaño.

Análisis funcional de cada componente:

- `[ ]` es un **contacto normalmente abierto (NO)**: cierra la continuidad lógica cuando su variable asociada vale 1.
- `[/]` es un **contacto normalmente cerrado (NC)**: cierra la continuidad lógica cuando su variable asociada vale 0.
- `( )` representa una **bobina de salida**: activa su bit correspondiente en memoria cuando existe continuidad de corriente lógica a lo largo del peldaño.
- `Start`: pulsador de marcha (entrada digital). Al presionarse, conduce.
- `Motor` (contacto en paralelo): lee el estado de la propia salida. Tras arrancar el motor, este contacto cierra y preserva la energización del peldaño aunque el operador libere el pulsador `Start`. Constituye la autorretención.
- `Stop`: contacto normalmente cerrado. Mientras el pulsador no se accione, el bit asociado es 0 y permite el paso. Al pulsarlo, conmuta a 1, interrumpiendo el peldaño.
- `Overload`: contacto del relé térmico de protección del motor, cableado asimismo en reposo cerrado, que corta la alimentación si el motor sufre sobrecalentamiento.
- `Motor` (bobina): salida digital conectada al contactor electromecánico de potencia.

Una regla esencial de seguridad eléctrica: los pulsadores de parada y relés de sobrecarga se cablean físicamente en campo como **contactos normalmente cerrados**. De este modo, si el cable físico sufre un corte accidental, el circuito se desenergiza (bit 0), deteniendo la máquina por seguridad (*fail-safe*). La seguridad funcional certificada de máquinas (paradas de emergencia, barreras inmateriales) se rige por normas específicas (ISO 13849 / IEC 62061) y requiere autómatas de seguridad dedicados; este esquema **no** es un circuito de seguridad funcional certificado.

Durante la operación cíclica, este peldaño se evalúa en cada scan. Si `Start` está activo, la CPU activa `Motor` en la imagen de salidas, transfiriendo la orden física al contactor al término del barrido actual.

## Ejemplo 2: Control de llenado de depósito en Texto Estructurado (ST)

El fragmento siguiente es **ilustrativo** (diseñado conforme a IEC 61131-3 sin depender de un compilador propietario concreto). Regula una bomba de impulsión con control de nivel por histéresis, enclavamiento por marcha en seco y rearme manual de fallo.

```pascal
PROGRAM LlenarTanque
VAR
    NivelBajo   AT %IX0.0 : BOOL;  // sensor de nivel bajo (TRUE = líquido cubre el sensor)
    NivelAlto   AT %IX0.1 : BOOL;  // sensor de nivel alto
    FlujoOk     AT %IX0.2 : BOOL;  // interruptor de flujo en la descarga
    Rearme      AT %IX0.3 : BOOL;  // pulsador de rearme de fallo
    Bomba       AT %QX0.0 : BOOL;  // salida al contactor del motor

    FalloBomba  : BOOL;
    TiempoSeco  : TON;             // temporizador con retardo a la conexión
END_VAR

// 1. Histéresis de nivel
IF NOT FalloBomba THEN
    IF NOT NivelBajo THEN
        Bomba := TRUE;             // nivel por debajo del mínimo: arranca
    ELSIF NivelAlto THEN
        Bomba := FALSE;            // alcanzó el máximo: detiene
    END_IF;
ELSE
    Bomba := FALSE;                // en fallo, nunca arranca
END_IF;

// 2. Protección contra marcha en seco
TiempoSeco(IN := Bomba AND NOT FlujoOk, PT := T#5S);
IF TiempoSeco.Q THEN
    FalloBomba := TRUE;
END_IF;

// 3. Rearme manual
IF Rearme THEN
    FalloBomba := FALSE;
END_IF;
END_PROGRAM
```

Análisis detallado:

- Las directivas **`AT %IX0.0`** vinculan nombres simbólicos legibles con direcciones físicas de hardware (`%I` entrada, `%Q` salida, `X` bit individual). En entornos industriales modernos, esta asociación se suele desacoplar mediante tablas de mapeo de hardware.
- **Bloque 1 (histéresis).** En ausencia de avería activa: si el fluido cae por debajo del nivel mínimo (`NOT NivelBajo`), arranca la bomba. Si alcanza el sensor superior (`NivelAlto`), se apaga. En la franja intermedia entre ambos niveles, ninguna condición se cumple y `Bomba` **conserva el valor del ciclo precedente**, evitando arranques y paradas continuos del motor. Este comportamiento descansa en la naturaleza cíclica del PLC, donde las variables conservan su estado entre scans consecutivos.
- **Bloque 2 (marcha en seco).** `TON` es el bloque funcional normalizado de temporizador con retardo a la conexión (*on-delay*). Solo acumula tiempo cuando su entrada `IN` permanece activa (bomba operando **y** detector de flujo reportando ausencia de caudal). Si esta condición anómala se prolonga 5 segundos (`T#5S`, literal temporal de la norma), la salida `TiempoSeco.Q` se activa, registrando `FalloBomba`. Como esta variable solo se resetea por el botón de rearme, el estado de fallo queda **memorizado**.
- **Bloque 3 (rearme).** Restaura el estado operativo al pulsar el botón correspondiente. Al evaluarse después del bloque 2, en un ciclo donde coincidan ambas condiciones primará la señal de rearme. En este caso no reviste peligro porque la bomba ya se paró en el scan previo y el temporizador se reinicia. En programas industriales complejos, la secuencia de ejecución interna de las líneas condiciona de forma directa el comportamiento del sistema.

Obsérvese que **el orden secuencial de evaluación es crítico**: a diferencia de un modelo asíncrono reactivo, el comportamiento en tiempo de ejecución depende de la disposición de las sentencias dentro del scan.

## Gestión de estados, diagnóstico y contingencias

Una parte predominante del software de un autómata no atiende al ciclo ideal de producción, sino al gobierno de situaciones anómalas: sensores descalibrados, atascos mecánicos, desconexiones intempestivas de red, paradas de seguridad y alternancia entre modos manual y automático. Pautas de diseño extendidas en la industria:

- Articular el control de las máquinas en torno a **máquinas de estados finitos** explícitas (siguiendo estándares como PackML: Parada, Preparando, Produciendo, Bloqueada, Fallo), superando el anidamiento disperso de booleanos.
- Determinar de forma unívoca el **estado seguro** de cada salida física ante fallos de CPU o desconexión de módulos remotos.
- Separar de manera estricta el **gobierno manual (paso a paso)** del **modo automático**, aplicando interbloqueos de seguridad por software.
- Declarar **variables retentivas** (`RETAIN`, contempladas en la norma) con criterio técnico para determinar qué contadores de piezas y recetas deben conservarse tras un corte del suministro eléctrico.
- Generar **registros estructurados de diagnóstico**: códigos de incidencia, contadores y marcas temporales consumibles por el SCADA y el MES.

Asimismo, los autómatas integran un circuito de supervisión de tiempo de barrido (**watchdog**): si un bucle infinito provoca que el programa sobrepase el tiempo máximo configurado (por ejemplo, 100 ms), la CPU suspende de inmediato la ejecución y sitúa todas las salidas físicas en posición segura de fallo.

## Determinismo frente a desarrollo de software convencional

Este aspecto marca la diferencia de mentalidad más acusada para los ingenieros de software procedentes del entorno web o corporativo:

**Ejecución cíclica y determinista.** Un autómata industrial no aguarda solicitudes asíncronas en reposo: ejecuta su bucle de scan de forma ininterrumpida, constituyendo el tiempo de ciclo una variable de diseño fija. En control de procesos físicos, lo decisivo no es alcanzar velocidades punta arbitrarias, sino garantizar que la ejecución sea **predecible, acotada y estrictamente determinista**.

**Ausencia de asignación dinámica de memoria y excepciones no controladas.** Los compiladores industriales rechazan la asignación dinámica en el heap, la recursión profunda y las excepciones que interrumpan el flujo de control. El espacio de memoria ocupado por cada variable es constante. Este enfoque garantiza la estabilidad continua en tiempo de ejecución.

**Impacto físico directo.** Un fallo de programación en planta no deriva en una página de error HTTP: puede desencadenar la colisión de un robot, la pérdida de un lote químico o daños a los operarios. Por ello, la disciplina fabril exige revisiones de código, simulación hardware-in-the-loop (HIL), comisionado escalonado y certificaciones de seguridad funcional cuando proceda.

**Ciclo de vida plurianual.** El software de control opera en líneas de producción durante 15 a 30 años ininterrumpidos. Preservar las herramientas de ingeniería, versiones de compilador, licencias de software y firmwares originales forma parte ineludible del mantenimiento a largo plazo.

**Entornos de desarrollo propietarios.** Cada fabricante comercializa su propia suite de automatización (como Siemens TIA Portal, Rockwell Studio 5000, Beckhoff TwinCAT o plataformas basadas en CODESYS), integrando compiladores, simuladores lógicos y utilidades de diagnóstico en línea vinculadas a la maquinaria viva. Para facilitar la portabilidad, la norma **IEC 61131-10** (publicada en 2019) define un esquema de intercambio en XML para proyectos IEC 61131-3, estandarizando tipos de datos y unidades de programa en los cinco lenguajes. Su adopción práctica en el mercado es gradual.

Existe una tendencia creciente hacia la adopción de metodologías de ingeniería de software convencionales: control de versiones textual en repositorios Git, validación en autómatas emulados (*soft-PLCs*), modularidad de librerías y revisiones entre pares.

## Estándares abiertos frente a ecosistemas cerrados

Aunque IEC 61131-3 constituye una norma internacional pública, el ecosistema de herramientas es eminentemente **propietario**: librerías cerradas, formatos de proyecto binarios e instrucciones exclusivas de cada marca. La unificación sintáctica no asegura la portabilidad directa entre fabricantes. Seleccionar una plataforma de automatización implica comprometerse con el catálogo de hardware y el ciclo de soporte de dicho proveedor.

## Relación con la ingeniería de software

El autómata industrial no sustituye a los sistemas informáticos superiores, ni las aplicaciones de gestión pueden reemplazar a los controladores en tiempo real. Cuando un MES, un SCADA o un backend interactúa con un PLC, debe considerar al autómata como la **única autoridad sobre el estado físico de la máquina**: las órdenes deben solicitarse mediante variables de consigna o métodos normalizados, sin asumir que el controlador las aceptará en cualquier circunstancia, tolerando rechazos y demoras. Entender el ciclo de barrido y las imágenes de proceso evita fallos de integración sutiles, como leer dos señales vinculadas que fueron registradas en ciclos de scan distintos y asumirlas como una captura instantánea coherente.

## Conclusión

Programar un autómata programable constituye una disciplina de desarrollo de software gobernada por restricciones físicas deterministas: tiempo de barrido garantizado, consecuencias mecánicas reales y prolongados ciclos de explotación. La norma IEC 61131-3 aporta una taxonomía de lenguajes compartida, si bien el desarrollo cotidiano está ligado a los entornos de cada fabricante. Quien proceda del sector del software convencional debe cambiar el paradigma de petición-respuesta por el de un bucle de ejecución continuo, asumiendo que el único código válido es aquel capaz de responder de forma segura ante las contingencias del mundo físico.

El paso siguiente en la serie consiste en ascender de nivel: el [MES](/es/blog/que-es-mes-manufacturing-execution-system), encargado de tender el puente entre la ejecución en el autómata y la planificación del negocio.

## Referencias

Este artículo es un estudio basado en las fuentes siguientes. Los pasajes marcados como opinión reflejan mi lectura. Los ejemplos de código son ilustrativos y no se compilaron en el entorno específico de un fabricante.

- IEC. [IEC 61131-3:2013, Programmable controllers, Part 3: Programming languages](https://webstore.iec.ch/publication/4552). Registro del catálogo: Edición 3.0, de 2013-02-20, retirada el 2025-05-22 y sustituida por la edición de 2025.
- IEC. [IEC 61131-10:2019, PLC open XML exchange format](https://webstore.iec.ch/publication/33034).
- PLCopen. [PLCopen XML exchange](https://plcopen.org/node/223) y [documento de especificación](https://www.plcopen.org/sites/default/files/downloads/plcopen_xml_exchange.pdf).
- Siemens. [S7-1500, Cycle and response times, function manual](https://support.industry.siemens.com/cs/attachments/59193558/s71500_cycle_and_reaction_times_function_manual_en-US_en-US.pdf).
- Wikipedia. [IEC 61131-3](https://en.wikipedia.org/wiki/IEC_61131-3), consultada únicamente para verificar la consideración de obsolescencia de IL en 2013 y su supresión en 2025; confirmar en el texto oficial de la norma.
