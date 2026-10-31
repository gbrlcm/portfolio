---
title: "Patrón Observer: desacoplando al emisor de quien reacciona"
description: "Cómo funciona el patrón Observer, una implementación tipada en TypeScript, el EventEmitter de Node.js, trampas comunes y cuándo recurrir a mensajería real."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/observer-pattern.webp"
coverAlt: "Ilustración de un emisor central de eventos en amarillo conectado a cuatro observadores: correo, factura, inventario y métricas"
category: "Ingeniería de Software"
tags:
  - "Design Patterns"
  - "Observer"
  - "TypeScript"
  - "Ingeniería de Software"
draft: false
lang: "es"
translationKey: "observer-pattern"
---

El patrón Observer es uno de los patrones de diseño más utilizados en la ingeniería de software cotidiana, a menudo pasando inadvertido. Cualquier `addEventListener` en el navegador, cada `EventEmitter` en Node.js y la gran mayoría de librerías reactivas se sustentan sobre el mismo principio: un objeto notifica a otros cuando ocurre un evento interno, sin necesidad de conocer la identidad ni la implementación de sus receptores.

En este artículo explico el funcionamiento del patrón, desarrollo una implementación con tipado estricto en TypeScript, analizo las versiones integradas en las plataformas estándar y detallo los errores arquitectónicos más frecuentes cuando se aplica sin disciplina.

## Qué es el patrón Observer

El patrón fue formalmente catalogado en el libro *Design Patterns: Elements of Reusable Object-Oriented Software* (1994) por Gamma, Helm, Johnson y Vlissides, conocidos como la "Gang of Four" (GoF). El propósito expresado por sus autores consiste en definir una dependencia de uno a muchos entre objetos, de forma que cuando un objeto cambia de estado, todos sus dependientes son notificados y actualizados automáticamente.

Intervienen dos roles participantes:

- **Subject** (o Sujeto/Publicador): custodia la lista de observadores suscritos y difunde las notificaciones.
- **Observer** (o Observador/Suscriptor): se registra ante el sujeto y reacciona cuando recibe la notificación.

El beneficio arquitectónico radica en el desacoplamiento: el sujeto únicamente interactúa con una interfaz abstracta ("algo susceptible de ser notificado"), siendo totalmente ajeno a las clases concretas que procesan el evento.

## El problema que resuelve

Imaginemos el instante en que se confirma el pago de un pedido en un comercio electrónico. Deben desencadenarse múltiples acciones: enviar un correo de confirmación al cliente, emitir la factura legal, descontar existencias del almacén y actualizar las métricas de negocio. Sin aplicar el patrón, el código suele degradarse en un procedimiento monolítico fuertemente acoplado:

```typescript
async function confirmarPago(pedido: Pedido) {
  await pedidos.marcarComoPago(pedido.id);
  await email.enviarConfirmacion(pedido);
  await factura.emitir(pedido);
  await stock.descontar(pedido.items);
  metricas.incrementar('pedidos_pagados');
}
```

Cada nueva reacción de negocio exige modificar esta misma función, obligándola a acoplarse con todos los subsistemas de la compañía. Al aplicar el patrón Observer, esta rutina se limita a anunciar un hecho factual (`PedidoPagado`), y cada módulo interesado se suscribe de manera autónoma.

## Implementación con tipado estricto en TypeScript

Una versión mínima de un bus de eventos en memoria con tipado estricto por nombre de evento:

```typescript
type Listener<T> = (payload: T) => void | Promise<void>;

export class EventBus<Events extends Record<string, unknown>> {
  private listeners: { [K in keyof Events]?: Set<Listener<Events[K]>> } = {};

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    const set = (this.listeners[event] ??= new Set());
    set.add(listener);
    // Devuelve la función de cancelación para evitar fugas de memoria.
    return () => set.delete(listener);
  }

  async emit<K extends keyof Events>(event: K, payload: Events[K]): Promise<void> {
    const set = this.listeners[event];
    if (!set) return;

    const results = await Promise.allSettled([...set].map((listener) => listener(payload)));
    for (const result of results) {
      if (result.status === 'rejected') {
        console.error(`El listener de "${String(event)}" falló`, result.reason);
      }
    }
  }
}

// Uso
type AppEvents = {
  'pedido.pagado': { pedidoId: string; total: number };
  'usuario.creado': { usuarioId: string; email: string };
};

const bus = new EventBus<AppEvents>();

const cancelar = bus.on('pedido.pagado', async ({ pedidoId }) => {
  await email.enviarConfirmacion(pedidoId);
});

await bus.emit('pedido.pagado', { pedidoId: 'ped_123', total: 15990 });
cancelar();
```

Dos decisiones de diseño clave en esta implementación:

1. **`on` devuelve una función de desuscripción explícita.** El suscriptor recibe de inmediato el mecanismo para desvincularse, reduciendo drásticamente las fugas de memoria por listeners huérfanos.
2. **El fallo de un listener no interrumpe a los demás.** El uso de `Promise.allSettled` garantiza que todos los observadores registrados se ejecutan antes de consolidar y notificar los errores. Si las reglas de negocio exigen detener la ejecución ante el primer fallo, dicha decisión debe modelarse de forma explícita.

## El patrón en las plataformas de desarrollo estándar

### En el navegador: `EventTarget`

El DOM del navegador constituye una implementación nativa del patrón Observer. `addEventListener` realiza la suscripción, `removeEventListener` la cancela, y la opción contemporánea `signal` permite revocar múltiples listeners en lote apoyándose en un `AbortController`:

```typescript
const controller = new AbortController();

window.addEventListener('resize', actualizarDiseno, { signal: controller.signal });
document.addEventListener('keydown', atajosTeclado, { signal: controller.signal });

// Cancela ambos listeners en una única llamada
controller.abort();
```

Esta técnica resulta especialmente valiosa en componentes frontend con ciclos de vida dinámicos de montaje y desmontaje, como las aplicaciones que emplean View Transitions.

### En Node.js: `EventEmitter`

La documentación oficial de Node.js explicita tres particularidades de comportamiento que con frecuencia desconciertan a los desarrolladores:

- **Los listeners se invocan de forma síncrona**, en el orden exacto en que fueron registrados, ignorándose sus valores de retorno. Un listener `async` no es esperado por la ejecución de `emit()`.
- **Un evento `'error'` que carezca de listener emite una excepción no capturada**, deteniendo el proceso de Node.js. La recomendación de la plataforma es suscribir siempre un manejador al canal `'error'`.
- **Por defecto, superar los 10 listeners en un mismo evento dispara una advertencia en consola** ante una potencial fuga de memoria. No constituye un límite rígido, sino una alerta diagnóstica para auditar el código.

```typescript
import { EventEmitter } from 'node:events';

const emisor = new EventEmitter();

emisor.on('error', (err) => {
  console.error('Fallo en el emisor', err);
});

emisor.once('listo', () => {
  console.log('Se ejecuta una única vez');
});
```

## Errores comunes de arquitectura

### Fugas de memoria por suscripciones olvidadas

El sujeto retiene una referencia fuerte hacia cada función observadora registrada. Si un componente se suscribe y es destruido sin cancelar su registro, el recolector de basura (*garbage collector*) no puede liberarlo de memoria, continuando la ejecución de manejadores en segundo plano de forma indefinida. Es el fallo más recurrente derivado del patrón.

### Bloqueos por ejecución síncrona y excepciones no controladas

En implementaciones puramente síncronas, un observador lento o bloqueante retrasa la ejecución de todos los observadores posteriores y del propio emisor. Asimismo, una excepción no controlada dentro de un listener puede interrumpir la notificación a los suscriptores restantes. Es indispensable definir con claridad si la notificación debe operar de forma síncrona o asíncrona, estructurando el control de errores defensivamente.

### Acoplamiento temporal encubierto

Si un observador B asume implícitamente que el observador A ha finalizado con anterioridad, existe un acoplamiento temporal oculto tras una aparente fachada desacoplada. El patrón Observer presupone que los observadores son estrictamente independientes entre sí.

### Flujo de control invisible y opaco

En su artículo *What do you mean by "Event-Driven"?* (2017), Martin Fowler señala un inconveniente sustancial: cuando un flujo de negocio atraviesa una secuencia de notificaciones de eventos desacopladas, resulta sumamente complejo de comprender porque la secuencia no está expresada explícitamente en el código fuente. Con frecuencia, el único modo de entender el comportamiento real del sistema consiste en analizar las trazas de ejecución en producción.

Mi criterio práctico: si el orden estricto de las operaciones es determinante para el negocio, no conviene emplear el patrón Observer. Una invocación procedimental explícita o un orquestador centralizado preserva la legibilidad del código.

### Cascada de eventos y bucles infinitos

Un observador emite un evento secundario que dispara a otro observador, el cual vuelve a emitir el evento original. En sistemas orientados a eventos de cierta escala, estas dependencias circulares emergen con mayor frecuencia de la deseable.

## Observer frente a Publish-Subscribe y Observables

| Enfoque | Acoplamiento entre partes | Ámbito de ejecución | Ejemplo representativo |
| :--- | :--- | :--- | :--- |
| **Observer** | El sujeto custodia referencias directas a los observadores | Mismo proceso en memoria | `EventTarget`, `EventEmitter` |
| **Pub/Sub** | Emisores y suscriptores solo conocen temas o canales | Distribuido entre procesos mediante broker | Colas de mensajería (RabbitMQ, MQTT, Kafka) |
| **Observable / Streams** | El suscriptor recibe un flujo continuo de valores con operadores | Mismo proceso en memoria | RxJS, Observable API del WICG |

La API Observable, promovida en el WICG, comenzó a desplegarse en Chromium a partir de la versión 135 mediante el método `EventTarget.when()`, que genera un flujo Observable a partir de eventos del DOM. Conviene verificar el soporte multinavergador en MDN antes de adoptarla en entornos productivos.

## Del proceso local al sistema distribuido

Un `EventEmitter` en memoria no sobrevive a la caída del servidor: si el proceso se reinicia durante la emisión, los eventos pendientes se pierden irremediablemente. Cuando las reacciones de negocio deben ejecutarse en servicios distribuidos a través de la red, el patrón evoluciona hacia **sistemas de mensajería asíncrona**, respaldados por brokers dedicados, confirmaciones de entrega y consumidores idempotentes.

Fowler diferencia cuatro acepciones que suelen confundirse en arquitecturas dirigidas por eventos: **Notificación de eventos**, **Transferencia de estado mediante eventos**, **Event Sourcing** y **CQRS**. Es imprescindible identificar qué modalidad se está implementando, dado que sus implicaciones arquitectónicas y costes de mantenimiento difieren sustancialmente. Para flujos de negocio transaccionales que involucran múltiples microservicios con necesidad de compensación, el patrón adecuado es el [patrón Saga](/es/blog/patron-saga).

## Cuándo utilizarlo y cuándo evitarlo

Conviene recurrir al patrón Observer cuando:

- Múltiples subsistemas independientes deben reaccionar ante un mismo hecho factual;
- El componente emisor no debe acoplarse con la lógica ni los módulos de los receptores;
- El orden relativo en que se ejecuten las distintas reacciones resulta indiferente para el negocio.

Debe evitarse cuando:

- Existe una secuencia estricta y obligatoria de ejecución por fases;
- El componente emisor necesita el valor de retorno de la acción para continuar;
- Solo interviene un único suscriptor (una invocación directa resulta mucho más transparente y depurable).

## Referencias

Este artículo es un estudio basado en las fuentes siguientes. Los pasajes marcados como opinión reflejan mi lectura.

- Erich Gamma, Richard Helm, Ralph Johnson y John Vlissides. *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley, 1994.
- Refactoring.Guru. [Observer](https://refactoring.guru/design-patterns/observer).
- MDN Web Docs. [EventTarget.addEventListener()](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener).
- MDN Web Docs. [Observable](https://developer.mozilla.org/en-US/docs/Web/API/Observable).
- Node.js. [Events](https://nodejs.org/api/events.html).
- Martin Fowler. [What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html) (febrero de 2017).
