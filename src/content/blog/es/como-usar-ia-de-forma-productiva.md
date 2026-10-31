---
title: "Cómo usar IA de forma productiva en el desarrollo de software"
description: "Qué revelan estudios de METR, DORA, Stack Overflow y GitHub sobre la IA en programación, y prácticas para ganar velocidad sin sacrificar calidad ni control."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/como-usar-ia-de-forma-produtiva.webp"
coverAlt: "Ilustración de una lista de etapas: explorar, planificar, implementar y verificar, con la etapa verificar resaltada en amarillo"
category: "Inteligencia Artificial"
tags:
  - "IA"
  - "Productividad"
  - "Ingeniería de Software"
  - "Herramientas"
draft: false
lang: "es"
translationKey: "how-to-use-ai-productively"
---

Las herramientas de inteligencia artificial orientadas a la programación se han incorporado al día a día de prácticamente cualquier equipo de desarrollo. Sin embargo, el debate público suele polarizarse en dos posturas extremas: "la IA multiplica la productividad por diez" frente a "la IA solo genera código deficiente". Los datos empíricos disponibles narran una historia mucho más instructiva y útil que cualquiera de esos dos discursos.

En este artículo sintetizo qué han medido las investigaciones rigurosas, qué implicaciones prácticas se derivan de ello y las pautas de trabajo que, en mi análisis, distinguen el uso verdaderamente productivo del que solo lo aparenta en la superficie.

## Qué muestran los datos empíricos

### GitHub (2022): mayor velocidad en tareas aisladas y nuevas

En 2022, GitHub publicó un experimento controlado con 95 desarrolladores profesionales. Todos debían implementar un servidor HTTP en JavaScript, asignando a la mitad de ellos el uso de GitHub Copilot. El grupo con acceso a la herramienta completó la tarea **un 55 % más rápido** en promedio (1 h 11 min frente a 2 h 41 min), con un intervalo de confianza del 95 % situado entre el 21 % y el 89 %. La tasa de finalización fue igualmente superior: un 78 % frente al 70 %.

Se trata de un resultado empírico incuestionable, pero con un alcance muy específico: una tarea creada desde cero, acotada, bien definida y sin la fricción de un código heredado preexistente.

### METR (2025): menor velocidad en proyectos consolidados y conocidos

En julio de 2025, el instituto de investigación METR divulgó un estudio aleatorizado con 16 desarrolladores senior que resolvieron 246 incidencias reales en grandes repositorios de código abierto que ellos mismos llevaban años manteniendo. La herramienta evaluada fue Cursor Pro combinada con Claude 3.5 y 3.7 Sonnet.

El desenlace resultó inesperado: al disponer de IA, las tareas requirieron **un 19 % más de tiempo**. Con todo, el hallazgo más revelador fue la disonancia perceptual: antes del estudio, los participantes estimaban que serían un 24 % más rápidos. Una vez finalizado el ensayo, continuaban convencidos de haber sido un 20 % más rápidos, en contradicción directa con los tiempos reales cronometrados.

Los propios investigadores detallan con rigor lo que el ensayo **no** pretende demostrar: no aseguran que la muestra represente a la mayoría de los programadores, ni que la IA no agilice el trabajo de otros perfiles, admitiendo que los resultados podrían variar con herramientas posteriores o flujos de trabajo más maduros.

### METR (2026): probable ganancia de velocidad, pero con evidencia débil

En febrero de 2026, METR presentó una actualización basada en herramientas de finales de 2025 (57 programadores y más de 800 tareas). Las estimaciones cuantitativas reflejaron una mejora en la velocidad de entrega, si bien los autores advirtieron sobre la fragilidad metodológica de los datos: numerosos ingenieros rehusaron participar por negarse a trabajar sin asistentes de IA, y entre el 30 % y el 50 % admitió haber evitado enviar tareas que no deseaba resolver manualmente. La conclusión de METR apunta a que la IA probablemente aceleró el trabajo de los desarrolladores en mayor medida a comienzos de 2026 que en 2025, pero que dicho estudio constituye una evidencia débil al respecto, lo que ha motivado el rediseño de sus ensayos.

### DORA (2025): la IA amplifica la madurez previa del equipo

El informe *State of AI-assisted Software Development* de 2025, elaborado por el programa DORA de Google a partir de encuestas a casi 5.000 profesionales del sector, concluyó:

- El 90 % utiliza herramientas de IA en su trabajo habitual;
- Más del 80 % considera que estas han incrementado su productividad personal;
- El 30 % manifiesta poca o nula confianza en el código generado por IA;
- La adopción de IA presentó una correlación positiva con el rendimiento de entrega (throughput);
- Sin embargo, mantuvo una correlación **negativa** con la estabilidad de los despliegues.

La máxima que sintetiza el informe: la inteligencia artificial no subsana las deficiencias organizativas de un equipo; simplemente amplifica lo que ya existe.

### Stack Overflow (2025): alta penetración, confianza prudente

En la encuesta anual de 2025 de Stack Overflow, el 84 % de los participantes utiliza o planea adoptar herramientas de IA. No obstante, únicamente el 3,1 % confía plenamente en la precisión técnica de sus respuestas, y la principal frustración manifestada (por un 66 %) radica en soluciones que resultan "casi correctas, pero no del todo". Para un 45,2 %, depurar código generado por IA consume más tiempo del esperado.

## Qué implica esto en la práctica

Del análisis conjunto de estas investigaciones emergen tres conclusiones fundamentales:

1. **La percepción subjetiva no equivale a una medición objetiva.** En el ensayo de METR de 2025, los profesionales se sintieron más veloces a pesar de haber invertido más tiempo. Para evaluar si la IA beneficia realmente a una organización, es imperativo medir métricas objetivas (tiempo de ciclo, tasa de fallos tras despliegue, retrabajo) en lugar de apoyarse en encuestas de satisfacción.
2. **El contexto determina el impacto.** Desarrollar una funcionalidad aislada en un proyecto nuevo difiere radicalmente de intervenir en una base de código compleja y madura. El valor añadido de la IA tiende a ser mayor allí donde el conocimiento previo del desarrollador sobre el entorno es más limitado.
3. **El cuello de botella técnico se desplaza a la verificación.** Generar líneas de código se ha abaratado exponencialmente. Revisar, probar y garantizar su corrección arquitectónica sigue siendo costoso, y es exactamente ahí donde las soluciones "casi correctas" pasan factura. La correlación negativa identificada por DORA respecto a la estabilidad apunta precisamente a esa causa.

## Prácticas que marcan una diferencia real

### 1. Aporta contexto como lo harías con un nuevo compañero de equipo

Como destaca con frecuencia el tecnólogo Simon Willison, el contexto condiciona la calidad del resultado: el rendimiento de un modelo de lenguaje está delimitado por lo que figura en su ventana de contexto. Describe con precisión el objetivo perseguido, las restricciones técnicas, los archivos afectados y las convenciones del repositorio. Diversas herramientas admiten archivos de instrucciones a nivel de proyecto (como `.cursorrules` o `AGENTS.md`) que se leen al inicio de cada sesión, donde se explicitan comandos de prueba, patrones idiomáticos y pautas prohibidas.

### 2. Solicita un plan técnico antes de generar código

Para cualquier tarea de complejidad media o alta, exige primero que el asistente examine el código fuente relevante y formule un plan estructurado. Auditar y corregir un esquema conceptual de diez líneas resulta enormemente más económico que revisar un diff de quinientas líneas sintácticamente válido pero conceptualmente desacertado.

```text
Deficiente:
"Añade caché a la API de pedidos."

Apropiado:
"Examina src/pedidos/service.ts y src/infra/redis.ts.
Deseo implementar un patrón cache-aside en la función obtenerPedido, con un TTL de 5 minutos
e invalidación cada vez que se invoque actualizarPedido.
Replica el patrón de src/clientes/service.ts, que ya incorpora caché.
Antes de modificar ningún archivo, muéstrame el plan de implementación.
A continuación, ejecuta `pnpm test pedidos` y muéstrame la salida de los tests."
```

### 3. La verificación es innegociable

Willison resume este principio de forma contundente: lo único que jamás se puede delegar en una máquina es la comprobación empírica de si el código funciona. Y añade: si no has visto ejecutarse el sistema con éxito, no dispones de un sistema operativo.

En términos operativos:

- Proporciona al asistente mecanismos directos para validar su trabajo (suites de pruebas, verificación de tipos, compilación, linters);
- Prioriza herramientas con capacidad para ejecutar procesos de terminal y evaluar directamente los errores de ejecución;
- Revisa el diff línea por línea con el mismo rigor crítico que aplicarías a una pull request ajena.

### 4. Trabaja en incrementos pequeños y atómicos

Las modificaciones reducidas son más sencillas de auditar, probar y revertir ante imprevistos. Realiza commits frecuentes y descarta cambios monumentales por el mero hecho de que compilen sin advertencias.

### 5. Utiliza la IA en las tareas donde verdaderamente destaca

Áreas donde el retorno es extraordinariamente elevado:

- Comprender una base de código desconocida y documentar rutinas antiguas;
- Elaborar baterías de pruebas exhaustivas, incluidas pruebas de caracterización para la [modernización de sistemas legados](/es/blog/modernizacion-de-sistemas-legados);
- Código repetitivo, scripts de automatización interna y refactorizaciones sintácticas mecánicas;
- Traducción de algoritmos entre distintos lenguajes o bibliotecas;
- Elaboración de primeros borradores de documentación técnica;
- Técnica del patito de goma ("rubber ducking"): contrastar enfoques arquitectónicos antes de iniciar el desarrollo.

Áreas que exigen máxima prudencia manual: perímetros de seguridad, reglas de negocio sensibles, transacciones distribuidas y cualquier lógica que no seas capaz de auditar de forma autónoma.

### 6. Considera los riesgos operativos específicos

- **Información confidencial:** No suministres secretos, credenciales ni código sensible a plataformas sin garantías contractuales explícitas de retención y privacidad de datos.
- **Límites en la fecha de corte del modelo:** Los modelos pueden desconocer cambios recientes en APIs de bibliotecas modernas. Conviene priorizar dependencias consolidadas o inyectar la documentación actualizada en el contexto.
- **Dependencias alucinadas:** Comprueba siempre que los paquetes sugeridos existan en los repositorios oficiales antes de proceder a su instalación.
- **Exceso de aplomo:** La respuesta se articula con idéntica solvencia y seguridad discursiva tanto cuando es matemáticamente acertada como cuando incurre en un error grosero.

### 7. Mide resultados a nivel de equipo y prescinde de impresiones individuales

Las métricas promovidas por DORA (frecuencia de despliegue, tiempo de entrega de cambios, tasa de fallos en cambios y tiempo medio de recuperación) ofrecen un diagnóstico certero. Si la velocidad de commit se acelera pero los incidentes en producción se incrementan, la ganancia de productividad es ficticia.

## Un flujo de trabajo estructurado

1. **Explorar:** Solicitar al modelo que inspeccione los archivos correspondientes y explique el flujo actual.
2. **Planificar:** Requerir un esquema estructurado de actuación, revisarlo y acordar correcciones.
3. **Implementar con verificación:** Ejecutar las modificaciones en etapas pequeñas, ejecutando las pruebas tras cada cambio.
4. **Revisar:** Auditar el diff unificado de forma íntegra, con mentalidad de revisión de código.
5. **Consolidar:** Registrar un commit con mensaje descriptivo y actualizar las directrices del proyecto si se consolidó un nuevo patrón arquitectónico.

Este rigor no difiere sustancialmente de la buena ingeniería de software tradicional. Y ese es el principio rector: la IA amplifica el proceso organizativo preexistente. Si dicho proceso se fundamenta en pruebas automatizadas, revisiones minuciosas e integraciones continuas, la IA multiplicará la velocidad. Si tales fundamentos brillan por su ausencia, únicamente multiplicará la generación de deuda técnica.

Si tu objetivo trasciende el mero uso de herramientas y buscas comprender cómo se estructuran internamente estos modelos, escribí también una [hoja de ruta para aprender machine learning](/es/blog/como-aprender-machine-learning).

## Referencias

Este artículo es un estudio técnico basado en las investigaciones y análisis de la industria referenciados a continuación. Las secciones marcadas como opinión reflejan mi análisis propio.

- Eirini Kalliamvakou, GitHub. [Research: quantifying GitHub Copilot's impact on developer productivity and happiness](https://github.blog/news-insights/research/research-quantifying-github-copilots-impact-on-developer-productivity-and-happiness/) (septiembre de 2022).
- METR. [Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) (julio de 2025).
- METR. [Actualización sobre aceleración en desarrollo con herramientas de finales de 2025](https://metr.org/blog/2026-02-24-uplift-update/) (febrero de 2026).
- Google Cloud / DORA. [Announcing the 2025 DORA Report](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report) (septiembre de 2025).
- Stack Overflow. [2025 Developer Survey: AI](https://survey.stackoverflow.co/2025/ai).
- Simon Willison. [Here's how I use LLMs to help me write code](https://simonwillison.net/2025/Mar/11/using-llms-for-code/) (marzo de 2025).
