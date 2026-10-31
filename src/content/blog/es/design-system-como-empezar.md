---
title: "Design system: cuándo vale la pena y cómo empezar pequeño"
description: "Qué es un design system de verdad, cuándo se amortiza, cómo usar design tokens (especificación W3C 2025.10) y cómo empezar sin convertir todo en burocracia."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/design-system-como-comecar.webp"
coverAlt: "Ilustración de cuatro design tokens de color aplicados a un componente de tarjeta con un botón Confirmar en amarillo"
category: "Frontend"
tags:
  - "Design System"
  - "Frontend"
  - "Design Tokens"
  - "Accesibilidad"
draft: false
lang: "es"
translationKey: "design-system-where-to-start"
---

"Design system" se ha convertido en un término tan amplio que puede significar desde un archivo en Figma con los colores de la marca hasta un equipo dedicado que mantiene componentes para decenas de productos. Esta ambigüedad hace que muchas empresas comiencen por el lugar equivocado: invertir meses en una biblioteca completa antes de saber qué problemas necesita resolver.

En este artículo explico qué compone un design system, cuándo se amortiza, cómo funcionan los design tokens (que obtuvieron una especificación estable en 2025) y un camino para empezar pequeño.

## Qué es un design system

Un design system es el conjunto de decisiones, componentes y reglas que permite construir interfaces consistentes de forma repetible. Suele reunir:

- **Principios:** lo que prioriza la interfaz (claridad, densidad, accesibilidad).
- **Design tokens:** las decisiones visuales básicas (colores, tipografía, espaciado, radios, sombras) registradas como datos.
- **Componentes:** botones, campos, modales, tablas, implementados en código y en el diseño.
- **Patrones:** cómo se combinan los componentes para resolver problemas recurrentes (formularios, estados vacíos, mensajes de error).
- **Documentación:** cuándo usar, cuándo no usar, ejemplos y requisitos de accesibilidad.
- **Gobernanza:** quién decide, cómo se contribuye, cómo se versiona.

Es común confundir el design system con partes de él:

| Término | Qué es | Qué le falta para ser un design system |
| :--- | :--- | :--- |
| **Guía de estilo** | Reglas visuales y de marca | Componentes y código |
| **UI kit** | Componentes diseñados en una herramienta de diseño | Implementación en código y documentación de uso |
| **Biblioteca de componentes** | Componentes implementados en código | Principios, patrones y gobernanza |
| **Design system** | Todo eso, mantenido como producto | (nada) |

## Un producto que sirve a otros productos

En 2016, Nathan Curtis publicó un artículo cuyo título se convirtió en definición: *A Design System isn't a Project. It's a Product, Serving Products*. La idea es que un design system no termina con la entrega. Tiene usuarios (los equipos de producto), necesita hoja de ruta (roadmap), soporte, versionado y comunicación, y solo tiene valor si se adopta.

Este cambio de perspectiva responde a la pregunta más importante: ¿está el design system resolviendo un problema real de los equipos que van a utilizarlo?

## Cuándo vale la pena (y cuándo no)

En mi opinión, las señales de que un design system se amortiza son:

- varios productos o varios equipos construyendo interfaces en paralelo;
- el mismo componente reimplementado varias veces, con pequeñas diferencias;
- inconsistencias visuales y de comportamiento percibidas por los usuarios;
- dificultad para aplicar cambios de marca o de tema en todo el producto;
- problemas de accesibilidad repitiéndose en diferentes pantallas.

Y las señales de que aún no es el momento:

- un único producto pequeño, mantenido por pocas personas;
- producto en fase de descubrimiento, con la interfaz cambiando cada semana;
- ningún responsable disponible para mantener el sistema después de la primera versión.

En el segundo caso, la mejor inversión suele ser solo la capa de tokens y media docena de componentes bien hechos. Un design system abandonado es peor que ninguno, porque crea una segunda fuente de verdad desactualizada.

## Design tokens: decisiones como datos

Los design tokens son las decisiones visuales registradas en un formato independiente de la plataforma. El anuncio del W3C Design Tokens Community Group los describe como la fuente única de verdad para colores, tipografía, espaciado y otras decisiones de diseño.

El 28 de octubre de 2025, el grupo publicó la primera versión estable de la especificación, la **2025.10**. Incluye soporte para temas y múltiples marcas, espacios de color modernos (como Display P3 y Oklch) y relaciones entre tokens (alias y referencias). Herramientas como Style Dictionary, Tokens Studio y Terrazzo aparecen como implementaciones de referencia. Un detalle de contexto: se trata de un informe de un Community Group del W3C, no de un estándar formal del W3C.

### Tres niveles de token

Una organización que funciona bien en la práctica separa los tokens en niveles:

1. **Primitivos:** los valores brutos de la paleta (`verde-900`, `amarelo-300`, `espacio-4`).
2. **Semánticos:** la intención de uso (`color-fondo`, `color-texto-principal`, `color-accion`). Apuntan a primitivos.
3. **De componente** (opcional): decisiones específicas (`boton-primario-fondo`). Apuntan a semánticos.

Los componentes deben usar tokens semánticos. Así, cambiar el tema o la marca solo requiere modificar el mapeo, no cada componente.

### Ejemplo en el formato de la especificación

En la versión 2025.10, los colores son objetos con espacio de color y componentes (el `hex` es opcional), las dimensiones son objetos con valor y unidad, y las referencias usan llaves con la ruta del token:

```json
{
  "cor": {
    "verde-900": {
      "$type": "color",
      "$value": { "colorSpace": "srgb", "components": [0.051, 0.145, 0.102], "hex": "#0d251a" }
    },
    "amarelo-300": {
      "$type": "color",
      "$value": { "colorSpace": "srgb", "components": [0.965, 0.929, 0.357], "hex": "#f6ed5b" }
    }
  },
  "semantico": {
    "texto-principal": { "$type": "color", "$value": "{cor.verde-900}" },
    "acao": { "$type": "color", "$value": "{cor.amarelo-300}" }
  },
  "espaco": {
    "4": { "$type": "dimension", "$value": { "value": 1, "unit": "rem" } }
  }
}
```

Una herramienta de transformación genera, a partir de este archivo, variables CSS para la web y constantes para iOS y Android. En CSS, el resultado es algo como esto:

```css
:root {
  --cor-verde-900: #0d251a;
  --cor-amarelo-300: #f6ed5b;
  --texto-principal: var(--cor-verde-900);
  --acao: var(--cor-amarelo-300);
  --espaco-4: 1rem;
}
```

Los proyectos más pequeños ni siquiera necesitan una canalización de transformación. Este sitio web, por ejemplo, define sus tokens de color y tipografía directamente en el bloque `@theme` de Tailwind CSS v4 (los dos colores del ejemplo anterior son los suyos), que ya los expone como variables CSS y clases de utilidad.

## Componentes: atomic design como modelo mental

Brad Frost propuso, en el libro *Atomic Design* (2016), una forma de pensar en interfaces en cinco niveles:

1. **Átomos:** los bloques básicos (etiqueta, campo, botón).
2. **Moléculas:** grupos simples de elementos que funcionan como una unidad (campo de búsqueda con botón).
3. **Organismos:** componentes más complejos, compuestos por moléculas y átomos (encabezado con navegación y búsqueda).
4. **Plantillas (Templates):** la estructura de una página, con los componentes posicionados.
5. **Páginas:** plantillas completadas con contenido real.

El propio autor enfatiza que no es un proceso lineal. Es un modelo mental para ver la interfaz tanto como un todo como un conjunto de partes.

### La API del componente importa tanto como el diseño visual

Un buen componente tiene pocas propiedades, nombres predecibles y estados explícitos. Un ejemplo de contrato para un botón:

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  // Obligatorio cuando el botón solo tiene icono, para lectores de pantalla.
  ariaLabel?: string;
}
```

Evita propiedades que permitan cualquier cosa, como `color` o `style` libres. Cada vía de escape facilita el caso puntual y debilita la consistencia del sistema.

## Accesibilidad integrada, no opcional

Uno de los mayores beneficios de un design system es resolver la accesibilidad una vez y heredarla en todas las pantallas: contraste mínimo de 4,5:1 para texto normal (WCAG AA), foco visible, navegación por teclado, etiquetas accesibles, área táctil adecuada y respeto por `prefers-reduced-motion`. Si el componente base acierta, cada pantalla nueva nace ya accesible.

El mismo razonamiento se aplica al rendimiento. Un componente de imagen que siempre declara ancho y alto evita el desplazamiento acumulativo del diseño (CLS) en todas las pantallas que lo utilizan. Detallo esta y otras métricas en la guía de [otimização de Core Web Vitals](/pt/blog/otimizacao-core-web-vitals-performance).

## Documentación: aprende de sistemas públicos

Buenos ejemplos de documentación pública para estudiar:

- **[GOV.UK Design System](https://design-system.service.gov.uk/):** componentes y patrones con investigación de uso detrás de cada decisión.
- **[Material Design 3](https://m3.material.io/):** tokens, componentes y directrices de Google.
- **[Carbon Design System](https://carbondesignsystem.com/):** el sistema de IBM, muy completo en patrones para aplicaciones de datos.

Para cada componente, la documentación debería responder: para qué sirve, cuándo usarlo, cuándo no usarlo, qué variaciones existen, ejemplos de código y requisitos de accesibilidad.

## Cómo empezar pequeño

Un camino que considero realista para un equipo pequeño:

1. **Haz un inventario.** Toma capturas de pantalla de todos los botones, campos, colores y tamaños de fuente del producto actual. Brad Frost llama a esto inventario de interfaz, y el resultado suele ser revelador.
2. **Define los tokens primero.** Paleta primitiva, tokens semánticos, escala de espaciado y tipografía.
3. **Construye los componentes más utilizados.** Botón, campo de texto, select, checkbox, modal y mensaje de alerta resuelven buena parte de las pantallas.
4. **Documenta junto con el código.** Una página por componente, aunque sea sencilla.
5. **Migra pantallas gradualmente.** Comienza por las que cambian con mayor frecuencia.
6. **Versiona y comunica.** Versionado semántico y changelog, para que los equipos sepan qué ha cambiado.

## Errores comunes

- Construir toda la biblioteca antes de tener un producto utilizándola.
- Copiar el design system de una big tech sin tener los mismos problemas.
- Tokens nombrados por valor (`azul-claro`) utilizados directamente en los componentes, en lugar de nombres semánticos.
- Ningún responsable tras el lanzamiento.
- Componentes tan flexibles que dejan de garantizar la consistencia.

## Referencias

Este artículo es un estudio basado en las fuentes siguientes. Los fragmentos marcados como opinión reflejan mi lectura.

- Design Tokens Community Group (W3C). [Design Tokens specification reaches first stable version](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/) (octubre de 2025).
- Design Tokens Community Group. [Design Tokens Technical Reports 2025.10](https://www.designtokens.org/tr/2025.10/) y [Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/).
- Brad Frost. [Atomic Design, capítulo 2](https://atomicdesign.bradfrost.com/chapter-2/) (2016).
- Nathan Curtis. [A Design System isn't a Project. It's a Product, Serving Products](https://medium.com/eightshapes-llc/a-design-system-isn-t-a-project-it-s-a-product-serving-products-74dcfffef935) (febrero de 2016).
- W3C. [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/).
