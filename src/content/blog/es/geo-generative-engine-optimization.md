---
title: "GEO: qué dice la investigación sobre aparecer en respuestas de IA"
description: "Generative Engine Optimization a partir del artículo original (KDD 2024): qué se probó, qué funcionó, los límites del estudio y qué aplicar hoy."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/geo-generative-engine-optimization.webp"
coverAlt: "Ilustración de una respuesta generada por IA con marcadores de citación numerados, uno de ellos conectado a una fuente resaltada en amarillo"
category: "SEO y AI Search"
tags:
  - "GEO"
  - "AI Search"
  - "SEO"
  - "llms.txt"
draft: false
lang: "es"
translationKey: "geo-generative-engine-optimization"
---

Siempre que surge una sigla nueva en marketing digital, aparecen inevitablemente los vendedores de fórmulas mágicas. Con GEO (Generative Engine Optimization) no ha sido diferente. La gran diferencia es que, en este caso, existe un artículo científico en el origen del término, y leerlo constituye el mejor antídoto frente a promesas desmedidas.

En este artículo resumo qué evaluó y descubrió el estudio, qué aspectos no demuestra, cómo documentan la materia Google y OpenAI, y qué prácticas considero que vale la pena aplicar hoy.

## SEO, AEO y GEO: ¿cuál es la diferencia?

| Sigla | Objetivo | Dónde se manifiesta |
| :--- | :--- | :--- |
| **SEO** | Ser encontrado y posicionado en los resultados de búsqueda | Listado tradicional de enlaces orgánicos |
| **AEO** | Lograr que un fragmento de la página se utilice como respuesta directa | Featured snippets, búsquedas por voz, asistentes conversacionales |
| **GEO** | Ser citado y representado con precisión en respuestas de modelos de lenguaje | AI Overviews, ChatGPT Search, Perplexity, Copilot |

En la práctica, las tres disciplinas presentan un solapamiento notable. Aquel contenido que no resulta rastreado ni indexado no puede figurar en ninguna de ellas. Si aún no cuentas con esta base técnica, comienza por la [guía de SEO](/es/blog/seo-que-recomienda-google) y el [artículo sobre AEO](/es/blog/aeo-answer-engine-optimization).

## De dónde surge el término

El concepto fue introducido en el artículo científico *GEO: Generative Engine Optimization*, elaborado por Pranjal Aggarwal, Vishvak Murahari, Tanmay Rajpurohit, Ashwin Kalyan, Karthik Narasimhan y Ameet Deshpande, publicado en arXiv en 2023 y aceptado en la conferencia académica KDD 2024.

La pregunta planteada por los investigadores fue elemental: si los motores de búsqueda generativos componen una síntesis a partir de múltiples fuentes, ¿qué puede hacer un creador de contenido para que su fuente gane mayor presencia en dicha respuesta? Para evaluar esto empíricamente, diseñaron el benchmark **GEO-bench**, con consultas pertenecientes a múltiples dominios, y establecieron dos métricas de visibilidad:

- **Position-Adjusted Word Count:** volumen de texto de la respuesta atribuido a tu fuente, ponderado según la posición en que aparece la mención.
- **Subjective Impression:** evaluación cualitativa sobre la relevancia, autoridad e influencia de la cita en la respuesta sintetizada.

## Qué se puso a prueba

Los autores aplicaron nueve estrategias de reescritura sobre el contenido original de las fuentes:

1. **Authoritative:** tono más asertivo y autoritativo.
2. **Statistics Addition:** incorporación de estadísticas y datos numéricos.
3. **Keyword Stuffing:** reiteración forzada de palabras clave.
4. **Cite Sources:** inclusión de citas a fuentes fiables y verificables.
5. **Quotation Addition:** incorporación de citas textuales de expertos reconocidos.
6. **Easy-to-Understand:** simplificación de la terminología y la sintaxis.
7. **Fluency Optimization:** mejora de la fluidez y cohesión del texto.
8. **Unique Words:** empleo de vocabulario más infrecuente o especializado.
9. **Technical Terms:** adición de terminología técnica propia del dominio.

## Qué funcionó y qué no

Los resultados empíricos más relevantes del estudio revelan:

- **Las estrategias más eficaces incrementaron la visibilidad en torno a un 41 % (Position-Adjusted Word Count) y un 28 % (Subjective Impression)** respecto al contenido de partida. El resumen del artículo refiere mejoras relativas de "hasta un 40 %".
- **Quotation Addition, Statistics Addition y Cite Sources** se situaron de forma sistemática entre las estrategias con mejor rendimiento. En definitiva: el contenido respaldado por datos cuantitativos, citas directas y fuentes primarias tiende a ser más aprovechado por los sistemas generativos.
- **El Keyword Stuffing no aportó ninguna ventaja.** En el benchmark principal quedó por debajo del contenido base, y en los experimentos con Perplexity su rendimiento cayó aproximadamente un 10 % frente al original.
- **Las fuentes peor posicionadas en la búsqueda convencional obtuvieron un beneficio sustancialmente mayor.** Para fuentes situadas en la 5.ª posición orgánica, la estrategia de citar fuentes elevó la visibilidad en un 115,1 %. Por el contrario, en fuentes que ocupaban la 1.ª posición, la misma estrategia disminuyó la visibilidad en un 30,3 %.
- **El impacto varía según el dominio temático.** Los autores concluyen que resulta imprescindible diseñar enfoques adaptados a cada tipo de contenido en lugar de aplicar fórmulas genéricas.

El resultado relativo al keyword stuffing resulta especialmente revelador: la táctica más arcaica del SEO de baja calidad resulta completamente inútil frente a los modelos generativos. Lo que verdaderamente funciona coincide con las bases de la buena redacción técnica: fundamentar con evidencias, citar a especialistas con atribución y explicar con rigor y claridad.

## Qué no demuestra el estudio

Antes de reescribir un sitio web al completo a raíz de estas conclusiones, conviene tener presentes sus límites metodológicos:

- **Es un benchmark desarrollado con modelos de 2023.** Las arquitecturas de lenguaje y los buscadores comerciales han evolucionado notablemente desde entonces.
- **La visibilidad no equivale a rendimiento de negocio.** Obtener mayor número de citas en una respuesta de IA no garantiza la captación de tráfico cualificado, contactos comerciales ni ventas.
- **"Añadir estadísticas" no constituye licencia para inventar cifras.** Un dato carente de metodología puede ser recogido por un modelo de lenguaje, pero arruina la credibilidad profesional cuando un interlocutor humano lo verifica. Emplea datos con fuentes trazables o prescinde de ellos.

## Qué documentan oficialmente Google y OpenAI

### Google: los fundamentos técnicos habituales

La documentación oficial de Google relativa a las funcionalidades de IA en la búsqueda (AI Overviews y AI Mode) es tajante: no existen requisitos específicos ni optimizaciones ocultas para figurar en estas respuestas sintéticas. Google señala expresamente que **no es necesario generar archivos novedosos legibles por máquina, archivos de texto orientados a IA ni marcado sintáctico especial**, y que no existe ningún dato estructurado exclusivo para ello.

Las pautas recomendadas se reducen a las buenas prácticas de SEO técnico: permitir el rastreo sin restricciones, favorecer la navegación mediante enlaces internos, garantizar una experiencia de página sólida, presentar el contenido principal en HTML visible y mantener los datos estructurados en estricta coherencia con lo expuesto al usuario.

Para controlar la presencia del contenido, Google remite a los mecanismos habituales (`nosnippet`, `data-nosnippet`, `max-snippet`, `noindex`), complementados con la directiva `Google-Extended` para regular el uso en entrenamiento y contextualización en otros entornos de Google.

### OpenAI: el rastreo de búsqueda y el entrenamiento operan por separado

OpenAI documenta distintos agentes de rastreo, y distinguir su cometido es fundamental:

- **`OAI-SearchBot`** se utiliza para la búsqueda: mostrar fragmentos y enlaces hacia sitios web en las respuestas de ChatGPT Search. Si un sitio web lo bloquea, no se incluirá en dichas respuestas activas.
- **`GPTBot`** recopila contenidos para el entrenamiento de los modelos fundacionales. Bloquearlo indica que la información no debe utilizarse para actualizar los pesos del modelo.
- **`ChatGPT-User`** ejecuta acciones solicitadas directamente por un usuario, como inspeccionar una URL durante una sesión de chat. Al tratarse de una petición expresa de una persona, las directivas de `robots.txt` pueden no aplicarse de forma estándar.

Una configuración de `robots.txt` que autoriza la aparición en las búsquedas de ChatGPT pero restringe el uso para entrenamiento se articula así:

```text
User-agent: OAI-SearchBot
Allow: /

User-agent: GPTBot
Disallow: /
```

La idoneidad de esta decisión dependerá del modelo de negocio de cada proyecto. Lo relevante es que ambos propósitos pueden gestionarse de manera independiente.

## ¿Qué ocurre con el archivo llms.txt?

El formato `llms.txt` fue propuesto por Jeremy Howard en septiembre de 2024: un documento Markdown alojado en la raíz del servidor con un encabezado H1 (el único campo estrictamente obligatorio), una síntesis en bloque de cita y un conjunto de enlaces estructurados hacia la documentación más relevante del proyecto. Su propósito es brindar un contexto conciso y optimizado para agentes basados en LLM.

Este sitio web dispone de un archivo [/llms.txt](/llms.txt). Personalmente lo considero una capa experimental y de bajo coste técnico, no un factor garantizado de posicionamiento. La propia documentación de Google citada anteriormente recalca que los archivos de texto específicos para IA no resultan necesarios para acceder a las experiencias de búsqueda generativa. Si decides publicar uno, procura que sea estrictamente factual y coherente con el contenido de tu web, sin aguardar impactos deterministas en el tráfico.

## Qué aplicaría hoy en un proyecto real

Integrando la evidencia científica y las especificaciones técnicas de los motores de búsqueda, las prioridades prácticas se resumen en:

1. **Asegurar los fundamentos de SEO técnico.** Indexabilidad garantizada, rastreo libre de bloqueos y contenido estructurado en HTML accesible.
2. **Citar fuentes primarias.** Enlazar a documentación técnica original, estudios científicos y estadísticas públicas verificables.
3. **Emplear cifras con procedencia explícita.** Detallar el origen de cada métrica y el contexto específico en que fue obtenida.
4. **Incorporar citas de especialistas.** Fragmentos de expertos con autoridad técnica o documentación oficial debidamente referenciados.
5. **Redactar con máxima claridad.** Respuestas directas al comienzo de cada sección, términos técnicos definidos y enunciados que conserven sentido de forma aislada.
6. **Transparentar la autoría.** Identidad clara de quién escribe, experiencia que lo respalda y canales directos de contacto.
7. **Mantener coherencia en la entidad.** Emplear el mismo nombre, biografía y perfiles profesionales en todas las plataformas donde tengas presencia.
8. **Configurar de forma consciente los rastreadores.** Distinguir en `robots.txt` entre indexación para búsqueda y rastreo para entrenamiento de modelos.

Como se observa, prácticamente ninguna de estas directrices resulta novedosa. Y esa es la conclusión esencial: el GEO, según la evidencia técnica contrastable, recompensa exactamente el mismo rigor divulgativo que siempre debió caracterizar a los textos técnicos dirigidos a seres humanos.

## Referencias

Este artículo es un estudio técnico basado en las publicaciones académicas y la documentación oficial indicadas a continuación. Los fragmentos señalados como opinión reflejan mi análisis propio.

- Pranjal Aggarwal et al. [GEO: Generative Engine Optimization](https://arxiv.org/abs/2311.09735). arXiv:2311.09735, aceptado en KDD 2024.
- Google Search Central. [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features).
- OpenAI. [Overview of OpenAI Crawlers](https://developers.openai.com/api/docs/bots).
- Jeremy Howard. [The /llms.txt file](https://llmstxt.org/) (propuesta publicada en septiembre de 2024).
