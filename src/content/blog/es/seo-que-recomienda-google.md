---
title: "SEO en 2026: lo que la documentación de Google realmente recomienda"
description: "SEO a partir de fuentes primarias: rastreo, contenido útil, títulos, enlaces, datos estructurados y los mitos que Google desmiente en su documentación."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/seo-o-que-o-google-recomenda.webp"
coverAlt: "Ilustración de una barra de búsqueda y tres resultados, con el primero resaltado en amarillo, junto al título SEO sin folclore"
category: "SEO y AI Search"
tags:
  - "SEO"
  - "SEO Técnico"
  - "Google Search"
  - "Contenido"
draft: false
lang: "es"
translationKey: "seo-what-google-recommends"
---

El SEO es probablemente el tema técnico con mayor dosis de folclore en internet. Por cada recomendación útil circulan múltiples reglas inventadas: densidad ideal de palabras clave, recuento mínimo de palabras u orden jerárquico estricto de encabezados. Gran parte de esto queda desmentido, por escrito, en la propia documentación oficial de Google.

En este artículo utilizo Google Search Central como fuente primaria (consultada en octubre de 2026) para separar las prácticas respaldadas por evidencia de la pura superstición. El enfoque está dirigido a quienes gestionan un sitio corporativo, un blog técnico o una aplicación web y desean invertir su tiempo en lo que realmente genera impacto.

## Qué es el SEO, sin rodeos

El SEO (Search Engine Optimization) es el trabajo de ayudar a los motores de búsqueda a descubrir, comprender y mostrar tus páginas, y de ayudar a las personas a decidir, directamente en la página de resultados, si vale la pena hacer clic.

No es un truco superficial aplicado al finalizar un proyecto. Es la combinación de una base técnica sólida (¿puede el motor de búsqueda acceder e interpretar la página?) con contenido que responde de forma eficaz a una necesidad humana real. Cuando una de estas partes falla, la otra no puede compensarlo.

## 1. Sin rastreo e indexación, el resto no importa

Antes de discutir palabras clave, confirma los aspectos básicos: ¿puede Google llegar a la página y ha decidido indexarla?

- **Verifica el índice.** Una búsqueda con `site:tudominio.com` ofrece una visión rápida de las URLs indexadas. Para una URL específica, la herramienta de Inspección de URLs de Search Console muestra exactamente cómo ve Google la página.
- **No bloquees recursos esenciales.** Bloquear archivos CSS o JavaScript en el `robots.txt` puede impedir que Google interprete la página tal como la percibe un usuario.
- **Publica un sitemap.** Un sitemap no garantiza la indexación, pero facilita enormemente el descubrimiento, especialmente de páginas nuevas.
- **Resuelve la duplicidad.** Cuando el mismo contenido responde en más de una URL (con y sin barra final, con parámetros de seguimiento, o en HTTP y HTTPS), utiliza redirecciones 301 o la etiqueta `rel="canonical"` para declarar la versión preferida.

Un detalle que confunde a muchos desarrolladores: `robots.txt` controla el **rastreo**, no la **indexación**. Una URL bloqueada puede seguir apareciendo en los resultados (sin texto de descripción) si otros sitios web enlazan hacia ella. Para mantener una página fuera del índice, la vía correcta es la directiva `noindex`, y la página debe permanecer accesible para que Google pueda leer dicha instrucción.

```text
# robots.txt
User-agent: *
Disallow: /admin/

Sitemap: https://tudominio.com/sitemap.xml
```

```html
<!-- En la página que debe quedar fuera del índice -->
<meta name="robots" content="noindex" />

<!-- En la versión duplicada, apuntando a la preferida -->
<link rel="canonical" href="https://tudominio.com/blog/mi-articulo" />
```

## 2. El contenido útil precede a cualquier técnica

En mi opinión, la guía sobre contenido útil ("helpful, reliable, people-first content") es el texto más valioso de Search Central. Propone preguntas clave de autoevaluación, entre ellas:

- ¿Ofrece el contenido información, investigación o análisis original?
- ¿Es el tipo de página que guardarías en marcadores o recomendarías a un colega?
- ¿Fue escrito o revisado por alguien que demuestre conocer profundamente el tema?
- ¿Contiene errores factuales sencillos de contrastar?

Google resume esta evaluación en tres preguntas: **Quién** creó el contenido (autoría transparente, con firma visible donde el lector espera encontrarla). **Cómo** se produjo (por ejemplo, si hubo pruebas reales o qué grado de automatización se empleó). **Por qué** existe. Esta última es la más decisiva: el contenido debe existir fundamentalmente para ayudar a personas, no para manipular clasificaciones en buscadores.

Respecto a E-E-A-T (experiencia, especialización, autoridad y confiabilidad), la documentación es tajante: no es un factor de posicionamiento directo. Los sistemas algorítmicos emplean una combinación de señales para identificar contenidos con estas características, siendo la confiabilidad el eje principal. Las temáticas relacionadas con salud, finanzas o seguridad personal (denominadas YMYL) reciben una exigencia mayor.

Las señales de alerta listadas por Google ayudan a calibrar qué prácticas evitar:

- Utilizar automatización masiva para generar contenidos sobre una multiplicidad de temas dispersos;
- Escribir sobre tendencias coyunturales que no encajan con la audiencia habitual de tu sitio;
- Alterar artificialmente las fechas de publicación para simular frescura sin haber actualizado realmente el contenido.

## 3. Título, fragmento (snippet) y estructura de URL

El título constituye el primer contacto del usuario con la página en la lista de resultados. La recomendación es elemental: una etiqueta `<title>` **única por página**, clara, concisa y que refleje con total fidelidad el contenido.

La meta description no siempre se muestra. El fragmento de búsqueda suele generarse directamente a partir del texto de la página, y la descripción se emplea cuando responde mejor a la consulta específica del usuario. Aun así, conviene redactar descripciones concisas, únicas y que resuman los puntos fundamentales.

En cuanto a las URLs, términos descriptivos ayudan al usuario y pueden mostrarse como migas de pan (breadcrumbs) en los resultados. Sin embargo, sobrecargar palabras clave en el dominio o en la ruta tiene un impacto insignificante más allá de su visualización en las migas de pan, de acuerdo con la documentación oficial.

```html
<title>Patrón Saga: transacciones entre microservicios sin 2PC</title>
<meta
  name="description"
  content="Cómo el patrón Saga mantiene la consistencia entre servicios distribuidos: coreografía, orquestación, compensaciones y outbox."
/>
```

## 4. Enlaces internos con texto ancla descriptivo

Los hipervínculos continúan siendo el mecanismo primordial mediante el cual los motores de búsqueda descubren URLs y entienden cómo se interconectan. Dos prácticas resuelven la gran mayoría de escenarios:

- **Texto ancla (anchor text) descriptivo.** "Consulta nuestra guía de Core Web Vitals" transmite mucha más información semántica que "haz clic aquí", tanto para usuarios como para rastreadores.
- **Califica los enlaces no respaldados.** Los enlaces en comentarios y foros comunitarios (UGC) o enlaces patrocinados deben incluir `rel="ugc"`, `rel="sponsored"` o `rel="nofollow"`.

Una regla de oro práctica: cualquier página relevante debe poder alcanzarse mediante enlaces HTML estándar desde otras secciones del sitio, y no depender únicamente del archivo sitemap.

## 5. Experiencia de página y Core Web Vitals

Las Core Web Vitals cuantifican la experiencia del usuario a partir de datos de campo reales: LCP (velocidad de carga, óptimo hasta 2,5 s), INP (tiempo de respuesta a interacciones, óptimo hasta 200 ms) y CLS (estabilidad visual, óptimo hasta 0,1). Google confirma formalmente que estas métricas forman parte de sus sistemas de clasificación.

El propio documento formula una advertencia crucial: el buscador siempre procura presentar el contenido más relevante, aun cuando la experiencia técnica de página sea modesta. Un rendimiento impecable actúa como factor de desempate cuando existen múltiples páginas con similar calidad y relevancia. Dicho de otro modo: el rendimiento técnico no compensa un contenido deficiente, pero inclina la balanza y casi invariablemente incrementa las tasas de conversión.

Escribí una guía detallada sobre cómo diagnosticar y optimizar estas métricas: [otimização de Core Web Vitals](/pt/blog/otimizacao-core-web-vitals-performance).

## 6. Datos estructurados: describe únicamente lo que es visible

Los datos estructurados (habitualmente implementados en JSON-LD según el vocabulario de schema.org) asisten a los motores de búsqueda en la identificación de entidades y pueden activar resultados enriquecidos. Dos directrices fundamentales prevalecen:

1. El marcado debe reflejar estrictamente el contenido visible. La directriz de Google es explícita: no marques contenido que un visitante humano no pueda ver.
2. Un marcado sintácticamente válido no garantiza la aparición de resultados enriquecidos. El buscador decide algorítmicamente si los presenta.

Asimismo, resulta fundamental seguir la evolución de las políticas. En agosto de 2023, Google restringió los resultados enriquecidos de FAQ exclusivamente a sitios web gubernamentales y sanitarios de reconocida autoridad, y limitó los resultados de HowTo al entorno de escritorio. Añadir `FAQPage` de forma indiscriminada a cualquier artículo de blog con la expectativa de ganar espacio visual ha dejado de tener utilidad práctica para la mayoría de sitios.

Este blog, por ejemplo, incluye esquemas `BlogPosting` y `BreadcrumbList` en cada publicación únicamente con información visible en la página (título, autor, fechas de publicación):

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "SEO en 2026: lo que la documentación de Google realmente recomienda",
  "author": { "@type": "Person", "name": "Gabriel Campos" },
  "datePublished": "2026-10-29",
  "inLanguage": "es"
}
```

## 7. Mitos que la propia documentación oficial desmiente

| Creencia popular | Lo que documenta Google |
| :--- | :--- |
| La metaetiqueta `keywords` mejora el ranking | Google Search ignora por completo la etiqueta meta `keywords`. |
| Existe una cantidad ideal de palabras | La extensión del texto por sí sola no influye en la clasificación. No existe una cifra mágica. |
| Los encabezados deben seguir una jerarquía inflexible | El orden y la cantidad de encabezados no determinan el posicionamiento en Google Search. Siguen siendo cruciales para accesibilidad y usabilidad. |
| El contenido duplicado genera penalizaciones algorítmicas | La duplicidad resulta ineficiente a nivel de rastreo, pero no origina sanciones manuales. El plagio de contenidos ajenos es una cuestión completamente distinta. |
| Incluir palabras clave exactas en el dominio da ventaja | Su impacto es insignificante más allá de su visualización en las migas de pan. |
| La extensión de dominio (.com, .dev, .io) influye en el posicionamiento | Solo incide en la orientación geográfica (ccTLD). En dominios genéricos, Google los procesa por igual. |
| E-E-A-T es un factor directo de posicionamiento | Preguntado de forma directa en su documentación, Google aclara que no constituye un factor independiente. |

## 8. Prácticas que pueden penalizar un sitio web

Las directrices sobre spam de Google describen conductas que pueden provocar la pérdida de posiciones o la exclusión del índice. Tres patrones destacan con especial frecuencia hoy en día:

- **Keyword stuffing:** Inserción forzada y reiterativa de términos con el fin de manipular los algoritmos de clasificación.
- **Abuso de contenido a escala:** Producción masiva de páginas con el propósito primordial de posicionar en lugar de aportar valor real a los usuarios, con independencia del mecanismo empleado.
- **Abuso de reputación de sitio web:** Publicación de contenidos de terceros en dominios consolidados con el objetivo primordial de aprovechar la autoridad previa de dicho dominio.

En relación con la IA: las directrices divulgadas por Google en febrero de 2023 se enfocan en la calidad del contenido resultante, y no en la tecnología empleada en su elaboración. La documentación sobre contenido útil refuerza este principio: generar volúmenes elevados sin supervisión técnica denota bajo esfuerzo, mientras que transparentar la automatización tiene sentido cuando el lector naturalmente se preguntaría cómo se elaboró dicho contenido.

## Lista rápida de verificación

1. ¿Está la página indexada? (Verifícalo mediante consulta `site:` y la herramienta de Inspección de URLs)
2. ¿Se encuentran los recursos CSS y JavaScript accesibles en `robots.txt`?
3. ¿Dispone cada contenido de una única URL canónica?
4. ¿Es la etiqueta `<title>` única, clara y representativa del contenido?
5. ¿Es la meta description exclusiva y sintetiza los puntos clave?
6. ¿Responde el contenido a una necesidad real con mayor profundidad que las alternativas?
7. ¿Se transparenta con claridad la autoría, metodología y propósito del sitio?
8. ¿Emplean los enlaces internos un texto ancla específico y contextual?
9. ¿Se sitúan las Core Web Vitals en la franja "bueno" en las métricas de campo?
10. ¿Describen los datos estructurados exclusivamente lo que resulta visible para el usuario?

## Lecturas complementarias

El SEO tradicional constituye la base para destacar también en respuestas formuladas por sistemas de inteligencia artificial. En dos artículos complementarios expongo cómo estructurar páginas para [AEO (Answer Engine Optimization)](/es/blog/aeo-answer-engine-optimization) y qué revela la investigación académica sobre [GEO (Generative Engine Optimization)](/es/blog/geo-generative-engine-optimization).

## Referencias

Este artículo es un estudio técnico fundamentado en las fuentes oficiales referenciadas a continuación. Las secciones marcadas como opinión reflejan mi análisis propio.

- Google Search Central. [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).
- Google Search Central. [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
- Google Search Central. [Spam policies for Google web search](https://developers.google.com/search/docs/essentials/spam-policies).
- Google Search Central. [Introduction to robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro).
- Google Search Central. [Understanding page experience in Google Search results](https://developers.google.com/search/docs/appearance/page-experience).
- Google Search Central. [General structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).
- Google Search Central Blog. [Changes to HowTo and FAQ rich results](https://developers.google.com/search/blog/2023/08/howto-faq-changes) (agosto de 2023).
- Google Search Central Blog. [Google Search's guidance about AI-generated content](https://developers.google.com/search/blog/2023/02/google-search-and-ai-content) (febrero de 2023).
- web.dev. [Web Vitals](https://web.dev/articles/vitals).
