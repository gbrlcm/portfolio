---
title: "Observer pattern: desacoplando quem emite de quem reage"
description: "Como funciona o padrão Observer, uma implementação tipada em TypeScript, o EventEmitter do Node.js, as armadilhas mais comuns e quando usar eventos de verdade."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/observer-pattern.webp"
coverAlt: "Ilustração de um emissor de eventos em amarelo ligado a quatro observadores: e-mail, nota fiscal, estoque e métricas"
category: "Engenharia de Software"
tags:
  - "Design Patterns"
  - "Observer"
  - "TypeScript"
  - "Engenharia de Software"
draft: false
lang: "pt-BR"
translationKey: "observer-pattern"
---

O Observer é um dos padrões de projeto mais usados no dia a dia, muitas vezes sem que ninguém perceba. Todo `addEventListener` no navegador, todo `EventEmitter` no Node.js e boa parte das bibliotecas reativas se apoiam na mesma ideia: um objeto avisa outros quando algo acontece, sem precisar saber quem são.

Neste artigo explico o padrão, mostro uma implementação tipada em TypeScript, passo pelas versões que já vêm prontas na plataforma e listo os problemas que costumam aparecer quando o padrão é usado sem cuidado.

## O que é o padrão Observer

O padrão foi catalogado no livro *Design Patterns* (1994), de Gamma, Helm, Johnson e Vlissides, a chamada "Gang of Four". A intenção descrita no livro é definir uma dependência de um-para-muitos entre objetos, de modo que, quando um objeto muda de estado, todos os seus dependentes sejam notificados e atualizados automaticamente.

São dois papéis:

- **Subject** (ou publicador): mantém a lista de interessados e os notifica.
- **Observer** (ou assinante): se registra no subject e reage às notificações.

O ganho é o desacoplamento: o subject conhece apenas uma interface ("algo que pode ser notificado"), não as classes concretas que reagem.

## O problema que ele resolve

Imagine o momento em que um pedido é pago. Várias coisas precisam acontecer: enviar e-mail de confirmação, emitir nota fiscal, atualizar estoque, registrar métricas. Sem o padrão, o código tende a ficar assim:

```typescript
async function confirmarPagamento(pedido: Pedido) {
  await pedidos.marcarComoPago(pedido.id);
  await email.enviarConfirmacao(pedido);
  await notaFiscal.emitir(pedido);
  await estoque.baixar(pedido.itens);
  metricas.incrementar('pedidos_pagos');
}
```

Cada nova reação exige alterar essa função, que passa a depender de todos os módulos envolvidos. Com o Observer, ela só anuncia o fato, e cada módulo interessado se inscreve.

## Implementação tipada em TypeScript

Uma versão mínima, com tipagem por nome de evento:

```typescript
type Listener<T> = (payload: T) => void | Promise<void>;

export class EventBus<Events extends Record<string, unknown>> {
  private listeners: { [K in keyof Events]?: Set<Listener<Events[K]>> } = {};

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    const set = (this.listeners[event] ??= new Set());
    set.add(listener);
    // Retorna a função de cancelamento, para evitar vazamentos.
    return () => set.delete(listener);
  }

  async emit<K extends keyof Events>(event: K, payload: Events[K]): Promise<void> {
    const set = this.listeners[event];
    if (!set) return;

    const results = await Promise.allSettled([...set].map((listener) => listener(payload)));
    for (const result of results) {
      if (result.status === 'rejected') {
        console.error(`Listener de "${String(event)}" falhou`, result.reason);
      }
    }
  }
}

// Uso
type AppEvents = {
  'pedido.pago': { pedidoId: string; total: number };
  'usuario.criado': { usuarioId: string; email: string };
};

const bus = new EventBus<AppEvents>();

const cancelar = bus.on('pedido.pago', async ({ pedidoId }) => {
  await email.enviarConfirmacao(pedidoId);
});

await bus.emit('pedido.pago', { pedidoId: 'ped_123', total: 15990 });
cancelar();
```

Duas decisões dessa implementação merecem atenção:

1. **`on` devolve uma função de cancelamento.** Quem se inscreve recebe na hora a forma de sair, o que reduz a chance de esquecer.
2. **A falha de um listener não impede os outros.** `Promise.allSettled` executa todos e só depois reporta os erros. Se a regra de negócio exige o contrário (parar no primeiro erro), essa escolha precisa ser explícita.

## O padrão já está na plataforma

### No navegador: `EventTarget`

O DOM é uma implementação do Observer. `addEventListener` inscreve, `removeEventListener` cancela, e a opção `signal` permite cancelar vários listeners de uma vez com um `AbortController`:

```typescript
const controller = new AbortController();

window.addEventListener('resize', atualizarLayout, { signal: controller.signal });
document.addEventListener('keydown', atalhos, { signal: controller.signal });

// Remove os dois listeners de uma vez
controller.abort();
```

Esse recurso é especialmente útil em componentes que montam e desmontam, como páginas com View Transitions.

### No Node.js: `EventEmitter`

A documentação do Node.js deixa claros três comportamentos que pegam muita gente de surpresa:

- **Os listeners são chamados de forma síncrona**, na ordem em que foram registrados, e os valores retornados são ignorados. Um listener `async` não é aguardado pelo `emit`.
- **Um evento `'error'` sem listener lança a exceção e encerra o processo.** A recomendação oficial é sempre registrar um listener para `'error'`.
- **Por padrão, mais de 10 listeners para um mesmo evento geram um aviso** de possível vazamento de memória. Não é um limite rígido, mas é um sinal para investigar.

```typescript
import { EventEmitter } from 'node:events';

const emitter = new EventEmitter();

emitter.on('error', (err) => {
  console.error('Falha no emitter', err);
});

emitter.once('pronto', () => {
  console.log('Executa uma única vez');
});
```

## Armadilhas comuns

### Vazamento de memória por listener esquecido

O subject guarda referência para cada observer. Se um componente se inscreve e nunca cancela, ele não é coletado pelo garbage collector, e continua reagindo a eventos mesmo depois de "destruído". É o problema mais frequente com o padrão.

### Execução síncrona e exceções

Em implementações síncronas, um listener lento atrasa todos os outros e o próprio emissor, e uma exceção pode interromper a notificação dos demais. Defina explicitamente se a notificação é síncrona ou assíncrona e como erros são tratados.

### Ordem implícita

Se um listener depende de outro ter rodado antes, existe um acoplamento escondido. O padrão pressupõe observers independentes entre si.

### Fluxo invisível

Martin Fowler, no artigo *What do you mean by "Event-Driven"?* (2017), aponta o problema de forma precisa: quando existe um fluxo lógico que atravessa várias notificações de eventos, ele fica difícil de enxergar porque não está explícito no código. Muitas vezes, a única forma de entender o fluxo é observar o sistema em produção.

Minha regra prática: se a ordem das reações importa para o negócio, eu não usaria Observer. Uma chamada explícita, ou um orquestrador, deixa o fluxo legível.

### Cascatas e ciclos

Um listener que emite outro evento, que dispara outro listener, que emite o primeiro evento de novo. Em sistemas grandes, isso acontece mais do que parece.

## Observer, Pub/Sub e Observables

| Abordagem | Quem conhece quem | Onde roda | Exemplo |
| :--- | :--- | :--- | :--- |
| **Observer** | O subject mantém a lista de observers | Mesmo processo | `EventTarget`, `EventEmitter` |
| **Pub/Sub** | Publicador e assinante só conhecem o canal ou tópico | Geralmente entre processos, via broker | Filas e tópicos de mensageria |
| **Observable / streams** | Assinante recebe uma sequência de valores, com operadores para transformá-la | Mesmo processo | RxJS, API Observable da WICG |

A API Observable, proposta na WICG, chegou ao Chrome na versão 135, com o método `EventTarget.when()` retornando um Observable de eventos. O suporte em outros navegadores ainda deve ser conferido no MDN antes de usar em produção.

## Do processo para o sistema distribuído

Um `EventEmitter` não sobrevive a uma queda do processo: se o servidor reiniciar no meio da notificação, o evento se perde. Quando as reações acontecem em outros serviços, o padrão vira **mensageria**, com broker, entrega garantida e consumidores idempotentes.

Fowler distingue quatro usos de eventos que costumam ser misturados: **notificação de evento**, **transferência de estado via evento**, **event sourcing** e **CQRS**. Vale saber qual deles você está aplicando, porque os custos são bem diferentes. Para operações de negócio que atravessam serviços, com necessidade de desfazer passos, o padrão adequado é o [Saga](/blog/saga-pattern), que explico em outro artigo.

## Quando usar e quando evitar

Use Observer quando:

- várias reações independentes dependem de um mesmo fato;
- o emissor não deveria conhecer os módulos que reagem;
- a ordem entre as reações não importa.

Evite quando:

- existe uma sequência obrigatória de passos;
- o emissor precisa do resultado da reação para continuar;
- há só um interessado (uma chamada direta é mais clara).

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura.

- Erich Gamma, Richard Helm, Ralph Johnson e John Vlissides. *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley, 1994.
- Refactoring.Guru. [Observer](https://refactoring.guru/design-patterns/observer).
- MDN Web Docs. [EventTarget.addEventListener()](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener).
- MDN Web Docs. [Observable](https://developer.mozilla.org/en-US/docs/Web/API/Observable).
- Node.js. [Events](https://nodejs.org/api/events.html).
- Martin Fowler. [What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html) (fevereiro de 2017).
