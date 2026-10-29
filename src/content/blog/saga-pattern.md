---
title: "Saga pattern: transações entre microsserviços sem 2PC"
description: "Como o padrão Saga mantém consistência entre serviços: coreografia ou orquestração, compensações, ponto sem retorno, anomalias de isolamento e outbox."
pubDate: 2026-10-29
author: "Gabriel Campos"
category: "Arquitetura de Software"
tags:
  - "Saga Pattern"
  - "Microsserviços"
  - "Sistemas Distribuídos"
  - "Arquitetura"
draft: false
---

Dentro de um único banco de dados, garantir que um pedido só seja confirmado se o pagamento passar é trivial: uma transação resolve. Quando pedidos, pagamentos e estoque vivem em serviços diferentes, cada um com o próprio banco, essa garantia deixa de existir. O padrão Saga é a resposta mais usada para esse problema.

Neste artigo explico como ele funciona, as duas formas de coordená-lo, os tipos de passo, as anomalias que ele não resolve sozinho e o que é preciso para implementá-lo com segurança.

## O problema: um banco por serviço

Em arquiteturas de microsserviços, é comum que cada serviço tenha o próprio banco. Isso traz benefícios (encapsulamento, escala e tecnologia independentes, isolamento de falhas), mas tira das operações entre serviços as garantias ACID de uma transação local.

A alternativa clássica, o two-phase commit (2PC), raramente é viável nesse cenário: exige que todos os participantes e o broker de mensagens suportem o protocolo e acopla a disponibilidade de todos eles. Chris Richardson resume no microservices.io: 2PC não é uma opção.

## De onde vem a ideia

O conceito é mais antigo que microsserviços. Hector Garcia-Molina e Kenneth Salem publicaram o artigo *Sagas* no SIGMOD de 1987, tratando de **transações de longa duração** que prendiam recursos do banco por tempo demais. A proposta: dividir a transação longa em uma sequência de transações menores e, se uma delas falhar, executar **transações compensatórias** que desfazem o efeito das anteriores.

## Como uma saga funciona

Uma saga é uma sequência coordenada de transações locais. Cada passo:

1. executa uma transação local em um serviço;
2. atualiza o banco desse serviço;
3. dispara o próximo passo por meio de um evento ou mensagem.

Se um passo falha por uma regra de negócio, a saga executa compensações para os passos já concluídos, na ordem inversa.

Exemplo de checkout:

| Passo | Serviço | Ação | Compensação |
| :--- | :--- | :--- | :--- |
| 1 | Pedidos | Criar pedido como `PENDENTE` | Marcar pedido como `CANCELADO` |
| 2 | Estoque | Reservar itens | Liberar reserva |
| 3 | Pagamentos | Cobrar cartão | Estornar cobrança |
| 4 | Pedidos | Marcar pedido como `CONFIRMADO` | (não se aplica) |

Note que compensar não é apagar. O pedido cancelado continua existindo, e o estorno é uma nova operação, não a remoção da cobrança. Diferente de um rollback, a compensação deixa rastro.

## Três tipos de passo

A documentação de arquitetura da Microsoft (Azure Architecture Center) classifica os passos de uma saga em três tipos, e essa classificação ajuda muito no desenho:

- **Compensáveis:** podem ser desfeitos por outra transação com efeito oposto (reservar estoque, por exemplo).
- **Pivô:** o ponto sem retorno. Depois que ele tem sucesso, a saga precisa ir até o fim.
- **Retentáveis:** vêm depois do pivô, são idempotentes e podem ser repetidos até dar certo.

No exemplo acima, a cobrança costuma ser o pivô: depois de cobrar, o caminho é confirmar o pedido (com novas tentativas, se necessário), e não desfazer tudo. Uma boa prática é ordenar a saga para que os passos mais propensos a falhar por regra de negócio venham **antes** do pivô.

## Coreografia ou orquestração

### Coreografia

Não existe coordenador. Cada serviço publica eventos de domínio, e os outros reagem.

```text
Pedidos ──PedidoCriado──► Estoque ──EstoqueReservado──► Pagamentos
   ▲                                                       │
   └──────────────── PagamentoAprovado ◄───────────────────┘
```

Segundo o Azure Architecture Center, funciona bem para fluxos simples, com poucos serviços, e não introduz um ponto único de falha. Em compensação, o fluxo fica difícil de acompanhar à medida que novos passos entram, existe risco de dependência cíclica entre participantes e testes de integração exigem todos os serviços rodando.

### Orquestração

Um orquestrador central diz a cada participante o que fazer, guarda o estado da saga e dispara as compensações em caso de falha.

Vantagens: melhor para fluxos complexos, evita dependências cíclicas e deixa a lógica de cada serviço mais simples. Desvantagens: exige implementar a lógica de coordenação e o orquestrador vira um componente crítico.

Na minha opinião, coreografia é ótima para reações independentes ("pedido pago, então envie e-mail"), que é basicamente o [padrão Observer](/blog/observer-pattern) aplicado entre serviços. Para um fluxo de negócio com compensações, orquestração deixa a sequência explícita em um só lugar, o que facilita entender e depurar.

## Um orquestrador mínimo em TypeScript

Um esboço para ilustrar a estrutura. Em produção, o estado de cada execução precisa ser persistido, para que a saga continue depois de uma queda do processo.

```typescript
interface SagaStep<C> {
  name: string;
  execute: (ctx: C) => Promise<void>;
  compensate?: (ctx: C) => Promise<void>;
}

export async function runSaga<C>(steps: SagaStep<C>[], ctx: C): Promise<void> {
  const completed: SagaStep<C>[] = [];

  for (const step of steps) {
    try {
      await step.execute(ctx);
      completed.push(step);
    } catch (error) {
      // Compensa os passos concluídos, do último para o primeiro.
      for (const done of completed.reverse()) {
        await done.compensate?.(ctx);
      }
      throw error;
    }
  }
}

// Uso
await runSaga(
  [
    {
      name: 'criar-pedido',
      execute: (c) => pedidos.criarPendente(c.pedidoId),
      compensate: (c) => pedidos.cancelar(c.pedidoId),
    },
    {
      name: 'reservar-estoque',
      execute: (c) => estoque.reservar(c.pedidoId, c.itens),
      compensate: (c) => estoque.liberar(c.pedidoId),
    },
    {
      name: 'cobrar',
      execute: (c) => pagamentos.cobrar(c.pedidoId, c.total),
    },
    {
      name: 'confirmar-pedido',
      execute: (c) => pedidos.confirmar(c.pedidoId),
    },
  ],
  contexto,
);
```

O que falta nesse esboço, e é justamente a parte difícil: persistir o progresso, repetir passos retentáveis com backoff, garantir que cada chamada seja idempotente e tratar a falha de uma compensação (o que exige alerta e, às vezes, intervenção manual). Por isso, em fluxos críticos vale avaliar motores de workflow durável, como Temporal ou AWS Step Functions, em vez de escrever o orquestrador do zero.

## Confiabilidade: o problema do "salvar e publicar"

Cada passo precisa atualizar o próprio banco **e** publicar um evento. Se o processo cair entre as duas coisas, o banco foi atualizado e ninguém ficou sabendo, ou o evento foi publicado sobre uma alteração que não foi gravada.

A solução mais comum é o **transactional outbox**: gravar o evento em uma tabela do próprio banco, na mesma transação da alteração de negócio. Um processo separado lê essa tabela e publica no broker.

```sql
BEGIN;

INSERT INTO pedidos (id, status)
VALUES ('ped_123', 'PENDENTE');

INSERT INTO outbox (id, tipo, payload, criado_em)
VALUES (
  gen_random_uuid(),
  'PedidoCriado',
  '{"pedidoId": "ped_123"}',
  now()
);

COMMIT;
```

Como o publicador pode enviar a mesma mensagem mais de uma vez, os consumidores precisam ser **idempotentes**, por exemplo registrando os IDs de mensagens já processadas.

## O que a saga não resolve: isolamento

Sagas garantem atomicidade eventual (tudo acontece ou tudo é compensado), mas não isolamento. Enquanto uma saga está no meio do caminho, outras operações enxergam estados intermediários. O Azure Architecture Center lista as anomalias típicas:

- **Atualizações perdidas:** uma saga sobrescreve dados alterados por outra.
- **Leituras sujas:** uma saga lê dados que outra alterou, mas ainda não concluiu.
- **Leituras não repetíveis:** passos diferentes de uma mesma saga leem valores diferentes porque houve alteração entre as leituras.

E as contramedidas mais usadas:

- **Lock semântico:** marcar o registro como em andamento (o status `PENDENTE` do exemplo cumpre esse papel) e fazer o restante do sistema respeitar essa marcação.
- **Atualizações comutativas:** desenhar operações que podem ser aplicadas em qualquer ordem, como débitos e créditos em vez de "definir saldo".
- **Visão pessimista:** reordenar a saga para que atualizações sensíveis aconteçam em passos retentáveis, depois do pivô.
- **Reler o valor:** conferir se o dado não mudou antes de atualizar e reiniciar o passo se mudou.
- **Versionamento:** registrar as operações sobre um registro para aplicá-las na ordem correta.

## Quando não usar

O próprio Azure Architecture Center aponta cenários em que o padrão pode não servir: transações fortemente acopladas, compensações que acontecem em participantes anteriores do fluxo e dependências cíclicas.

Eu acrescentaria um critério anterior: se os dados envolvidos podem viver no mesmo banco, por exemplo em módulos de um monólito modular, uma transação local continua sendo a solução mais simples e mais segura. Saga é a ferramenta certa quando a distribuição já é uma necessidade, não uma escolha estética. O artigo sobre [quando microsserviços fazem sentido](/blog/microsservicos-quando-fazem-sentido) discute exatamente essa decisão.

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura.

- Hector Garcia-Molina e Kenneth Salem. *Sagas*. Proceedings of the 1987 ACM SIGMOD International Conference on Management of Data. [DOI 10.1145/38713.38742](https://doi.org/10.1145/38713.38742).
- Chris Richardson. [Pattern: Saga](https://microservices.io/patterns/data/saga.html), microservices.io.
- Chris Richardson. [Pattern: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html), microservices.io.
- Microsoft. [Saga design pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga), Azure Architecture Center.
