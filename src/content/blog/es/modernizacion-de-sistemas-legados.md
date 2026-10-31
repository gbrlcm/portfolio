---
title: "Sistemas legados: cómo modernizar sin reescribir desde cero"
description: "Por qué las grandes reescrituras fracasan y cómo modernizar sistemas legados gradualmente mediante Strangler Fig, tests de caracterización y capas anticorrupción."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/modernizacao-sistemas-legados.webp"
coverAlt: "Ilustración de una capa de enrutamiento distribuyendo tráfico entre un sistema legado discontinuo y componentes nuevos, el primero destacado en amarillo"
category: "Arquitectura de Software"
tags:
  - "Sistemas Legados"
  - "Modernización"
  - "Arquitectura"
  - "Refactorización"
draft: false
lang: "es"
translationKey: "legacy-system-modernization"
---

Cualquier sistema software que triunfa en el mercado acaba convirtiéndose en legado. Sigue facturando, atendiendo a miles de clientes y sosteniendo la operativa diaria de la compañía, pero cada nuevo cambio cuesta mucho más de lo razonable, muy pocos desarrolladores comprenden su funcionamiento interno y nadie se atreve a tocar ciertos módulos críticos.

La reacción espontánea suele ser plantear una reescritura integral desde cero. En este artículo expongo, a partir de análisis de Joel Spolsky, Martin Fowler, Michael Feathers y Thoughtworks, por qué esa opción constituye casi invariablemente el peor error estratégico y cómo acometer una modernización incremental entregando valor de negocio en cada fase.

## Qué es un sistema legado

Existen dos definiciones de gran utilidad práctica. La perspectiva de negocio: un sistema en producción que sigue generando valor económico sustancial, pero resulta frágil, costoso y arriesgado de modificar. La perspectiva técnica, formulada por Michael Feathers en *Working Effectively with Legacy Code* (2004): código legado es, simplemente, código sin pruebas automatizadas.

La definición de Feathers es profundamente clarificadora. Transforma la pregunta estéril de "¿este lenguaje de programación es antiguo?" en "¿puede el equipo modificar este código con seguridad y confianza?". Un sistema operativo desarrollado en 2010 con una sólida cobertura de pruebas automatizadas es mucho menos legado que un microservicio desplegado el mes pasado sin ningún tipo de test.

## La tentación de la reescritura total

En abril de 2000, Joel Spolsky publicó su célebre artículo *Things You Should Never Do, Part I*, a raíz de la decisión estratégica de Netscape de desechar su navegador y reescribirlo desde cero. Spolsky catalogó esa decisión como el error más grave que puede cometer una empresa de software, explicando el porqué: el código antiguo ya ha sido probado exhaustivamente en producción. Esas ramas extrañas y confusas que nadie comprende son, en su inmensa mayoría, correcciones quirúrgicas a fallos y casos límite detectados tras años de operativa real. El código no se oxida ni acumula defectos por el mero hecho de permanecer en disco.

Martin Fowler, en su revisión de 2024 de *Strangler Fig*, subraya una conclusión análoga: el plan de reemplazar un sistema completo de una sola vez (*big bang*), por atractivo que luzca en una presentación ejecutiva, culmina en fracaso en la gran mayoría de los casos. Señala dos motivos troncales: reconstruir un sistema empresarial complejo requiere muchísimo más tiempo del previsto, durante el cual los clientes no pueden esperar sin nuevas funcionalidades; además, una parte sustancial de la lógica original ni siquiera resulta ya necesaria en la operativa moderna.

Thoughtworks, en su trabajo *Patterns of Legacy Displacement* (Ian Cartwright, Rob Horn y James Lewis, 2024), advierte sobre la trampa de la **paridad funcional**: el empeño dogmático de que el sistema nuevo deba replicar el cien por cien de los comportamientos del legado. Documentar cada comportamiento marginal de un sistema antiguo absorbe una cantidad colosal de recursos de ingeniería, y la meta de paridad conduce a un lanzamiento único masivo que concentra todo el riesgo operacional en un solo día.

## Antes de intervenir: clarificar objetivos y límites

Modernizar no constituye un fin en sí mismo. Antes de seleccionar tecnologías o patrones, es preceptivo responder a estas cuestiones de negocio:

- **¿Qué resultado concreto persigue la empresa?** ¿Reducir costes de computación, acelerar el ritmo de entregas, abandonar una tecnología descatalogada o cumplir una nueva normativa legal?
- **¿Qué módulos de la aplicación cambian con mayor frecuencia?** Es ahí donde la modernización aporta un retorno sobre la inversión más inmediato.
- **¿Cuáles son los flujos operativos verdaderamente críticos?** ¿Qué procesos de negocio no pueden interrumpirse bajo ninguna circunstancia?
- **¿Dónde reside la información y quién depende de ella?** Integraciones no documentadas, informes analíticos, hojas de cálculo departamentales y procesos batch nocturnos suelen descubrirse tardíamente.

Thoughtworks estructura cuatro actividades continuas e iterativas: entender los resultados deseados, descomponer el problema en módulos manejables, entregar dichos incrementos de forma continua a producción y adaptar la estructura organizativa para sustentarlos. Sus autores insisten en que la tecnología representa únicamente la mitad del desafío; la otra mitad reside en los métodos de trabajo, la organización de equipos y el liderazgo técnico.

## La red de seguridad: pruebas de caracterización

Antes de alterar un comportamiento en el código, es imprescindible saber qué hace hoy con exactitud. Feathers acuñó el término **pruebas de caracterización** (*characterization tests*) para denominar a aquellos tests automatizados que registran el comportamiento real actual del sistema, no el comportamiento ideal teórico. Si el código legado alberga un comportamiento anómalo, la prueba debe reflejar dicho comportamiento. La corrección se abordará posteriormente como una decisión deliberada.

```typescript
import { describe, expect, it } from 'vitest';
import { calcularEnvio } from '../legado/envio';

// Test de caracterización: registra el comportamiento actual, aunque resulte extraño.
describe('calcularEnvio (comportamiento actual)', () => {
  const casos = [
    { codigoPostal: '28001', pesoKg: 0.5, esperado: 18.9 },
    { codigoPostal: '28001', pesoKg: 10, esperado: 42.3 },
    // El sistema actual devuelve 0 ante peso negativo en lugar de arrojar error.
    // Preservamos este comportamiento hasta decidir cambiarlo deliberadamente.
    { codigoPostal: '28001', pesoKg: -1, esperado: 0 },
  ];

  for (const { codigoPostal, pesoKg, esperado } of casos) {
    it(`CP ${codigoPostal}, ${pesoKg} kg`, () => {
      expect(calcularEnvio(codigoPostal, pesoKg)).toBe(esperado);
    });
  }
});
```

Los valores esperados en los tests no se inventan: se obtienen ejecutando el código existente frente a entradas reales o representativas. Una estrategia muy efectiva consiste en registrar peticiones y respuestas anónimas de producción y reproducirlas contra la nueva implementación.

## Strangler Fig: sustitución incremental

La denominación procede de un viaje de Martin Fowler por las selvas tropicales de Queensland (Australia) en 2001. Las higueras estranguladoras (*strangler figs*) germinan en las ramas altas de un árbol hospedador y van desarrollando raíces hacia el suelo hasta que, con el paso de los años, envuelven y reemplazan por completo al árbol original.

Trasladado a la arquitectura de software: en lugar de apagar el sistema antiguo de golpe, se interpone un proxy inverso o pasarela de enrutamiento frente a él, derivando selectivamente fragmentos del tráfico hacia componentes modernos, funcionalidad por funcionalidad.

```nginx
# Capa de enrutamiento frente al sistema legado
location /api/v2/pedidos/ {
    proxy_pass http://nuevo-servicio-pedidos;
}

location / {
    proxy_pass http://sistema-legado;
}
```

A medida que más rutas migran hacia los nuevos componentes, el sistema legado disminuye su perímetro hasta que puede desconectarse con seguridad. Fowler reconoce que esta estrategia exige habilitar una **arquitectura de transición**: código y pasarelas intermedias concebidas exclusivamente para permitir la coexistencia temporal entre lo nuevo y lo antiguo, destinadas a ser desmanteladas al finalizar la migración. Aunque muchos equipos muestran reticencias ante este coste transitorio, la reducción sustancial del riesgo y la entrega temprana de valor justifican plenamente el esfuerzo.

## Otros patrones del repertorio de modernización

- **Branch by Abstraction:** definir una interfaz abstracta alrededor del componente legado a sustituir, redirigir el código existente para que consuma dicha abstracción y reemplazar la implementación interna de forma controlada mediante feature flags. Muy eficaz en refactorizaciones dentro de una misma base de código.
- **Interceptación de eventos (Event Interception):** capturar las mutaciones de estado de la base de datos antigua mediante Change Data Capture (CDC) y canalizarlas asíncronamente hacia los nuevos componentes.
- **Legacy Mimic:** diseñar los nuevos servicios para que emulen las interfaces del sistema legado, de modo que los clientes externos no perciban la transición interna.
- **Desviar el flujo (Divert the Flow):** extraer en primer lugar del sistema antiguo aquellos procesos transversales que involucran a múltiples departamentos de la organización.
- **Capa anticorrupción (Anti-Corruption Layer, ACL):** una capa adaptadora situada entre el modelo de datos antiguo y el nuevo dominio, impidiendo que nomenclaturas confusas y malas prácticas del legado contaminen el código moderno.

```typescript
// Capa anticorrupción: el legado define CLI_STATUS = 'A' | 'I' | 'B'.
// El nuevo dominio expresa conceptos limpios de negocio.
type EstadoCliente = 'activo' | 'inactivo' | 'bloqueado';

export function traducirEstadoLegado(codigo: string): EstadoCliente {
  switch (codigo) {
    case 'A': return 'activo';
    case 'I': return 'inactivo';
    case 'B': return 'bloqueado';
    default:
      throw new Error(`Código de estado de cliente desconocido en legado: ${codigo}`);
  }
}
```

## La base de datos: el reto más complejo

Sustituir código de aplicación es relativamente sencillo en comparación con migrar la persistencia de datos. Principios fundamentales para mitigar riesgos:

- **Un único custodio del dato durante la transición.** Conviene evitar que el sistema nuevo y el antiguo escriban concurrentemente en las mismas tablas sin coordinación.
- **Sincronización asíncrona explícita.** Emplear mecanismos de captura de cambios (CDC) o eventos de dominio publicados por el sistema propietario, evitando duplicar sentencias de escritura dispersas por la lógica de aplicación.
- **Verificación en paralelo antes del corte.** Ejecutar consultas de lectura en ambos almacenes y cotejar automáticamente la equivalencia de resultados antes de designar el nuevo almacén como fuente maestra. Notion detalló este proceso de verificación al particionar su base de datos PostgreSQL, como analizo en el artículo sobre [escalabilidad de sistemas](/es/blog/escalabilidad-de-sistemas).
- **Procedimientos de contingencia verificados.** Cada fase de migración debe contar con un plan de repliegue probado.

## El papel de la inteligencia artificial en la modernización

Las herramientas contemporáneas de inteligencia artificial representan una valiosa ayuda para descifrar bases de código desconocidas: explicar funciones crípticas, desentrañar dependencias y proponer baterías de tests de caracterización. No obstante, los modelos pueden generar explicaciones incorrectas con gran seguridad aparente. La máxima al intervenir en sistemas legados se mantiene inalterada: ningún cambio es válido sin pruebas automatizadas que corroboren empíricamente el comportamiento. Profundizo en este enfoque en el artículo sobre [cómo usar la IA de forma productiva](/es/blog/como-usar-ia-de-forma-productiva).

## Lista de comprobación para la modernización

1. ¿Está el objetivo de negocio formalizado por escrito con métricas verificables?
2. ¿Se encuentran identificados y priorizados los flujos operativos críticos?
3. ¿Dispone el equipo de pruebas de caracterización para el código que se va a intervenir?
4. ¿Existe una capa de enrutamiento o una abstracción que permita la migración progresiva?
5. ¿Aporta valor de negocio independiente cada incremento desplegado?
6. ¿Está claramente asignada la titularidad de cada dato a lo largo de la transición?
7. ¿Se dispone de un plan de marcha atrás probado para cada etapa?
8. ¿Tiene la arquitectura de transición una fecha límite establecida para su desmantelamiento?

Si el destino de la modernización apunta a una arquitectura de servicios desacoplados, conviene examinar previamente [cuándo tienen sentido los microservicios](/es/blog/microservicios-cuando-tienen-sentido). En numerosos escenarios empresariales, consolidar un monolito modular resuelve los cuellos de botella con un nivel de riesgo sustancialmente inferior.

## Referencias

Este artículo es un estudio basado en las fuentes siguientes. Los pasajes marcados como opinión reflejan mi lectura.

- Joel Spolsky. [Things You Should Never Do, Part I](https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/) (abril de 2000).
- Martin Fowler. [Strangler Fig](https://martinfowler.com/bliki/StranglerFigApplication.html) (versión de agosto de 2024).
- Ian Cartwright, Rob Horn y James Lewis. [Patterns of Legacy Displacement](https://martinfowler.com/articles/patterns-legacy-displacement/) (marzo de 2024).
- Martin Fowler. [Branch By Abstraction](https://martinfowler.com/bliki/BranchByAbstraction.html).
- Microsoft. [Anti-corruption Layer pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer), Azure Architecture Center.
- Michael Feathers. *Working Effectively with Legacy Code*. Prentice Hall, 2004.
- Garrett Fidalgo, Notion. [Herding elephants: lessons learned from sharding Postgres at Notion](https://www.notion.com/blog/sharding-postgres-at-notion) (octubre de 2021).
