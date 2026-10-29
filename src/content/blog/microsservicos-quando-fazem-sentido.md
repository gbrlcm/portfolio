---
title: "Microsserviços: quando fazem sentido (e quando não fazem)"
description: "O que são microsserviços segundo Lewis e Fowler, pré-requisitos, custos reais e o que os casos de Segment, Prime Video e Shopify ensinam sobre a escolha."
pubDate: 2026-10-29
author: "Gabriel Campos"
category: "Arquitetura de Software"
tags:
  - "Microsserviços"
  - "Arquitetura"
  - "Monólito Modular"
  - "Sistemas Distribuídos"
draft: false
---

Poucas decisões de arquitetura são tomadas com tanta convicção e tão pouca evidência quanto "vamos fazer em microsserviços". A arquitetura resolve problemas reais, mas cobra um preço alto, e esse preço costuma ser pago por times que ainda não têm os problemas que ela resolve.

Neste artigo junto a definição original, os pré-requisitos que os próprios defensores apontam e três casos públicos que ajudam a calibrar a decisão: Segment, Prime Video e Shopify.

## O que são microsserviços

O texto de referência é o artigo *Microservices*, de James Lewis e Martin Fowler, publicado em março de 2014. Eles descrevem o estilo como uma forma de construir aplicações como **conjuntos de serviços que podem ser publicados de forma independente**, e reconhecem que não existe uma definição precisa. O que existe são características comuns:

- componentização por meio de serviços;
- organização em torno de capacidades de negócio;
- produtos, não projetos;
- endpoints inteligentes e canais simples ("smart endpoints and dumb pipes");
- governança descentralizada;
- gestão de dados descentralizada (cada serviço com seus dados);
- automação de infraestrutura;
- projeto pensando em falhas;
- design evolutivo.

O ponto central é a **publicação independente**. Se para colocar uma mudança em produção você precisa coordenar o deploy de cinco serviços ao mesmo tempo, você tem um monólito distribuído: os custos dos microsserviços sem o principal benefício.

## O que se ganha

- **Deploy independente:** cada time publica no próprio ritmo.
- **Autonomia de times:** fronteiras claras de código e de responsabilidade.
- **Escala independente:** o serviço que recebe mais carga escala sozinho.
- **Isolamento de falhas**, quando bem projetado: um serviço fora do ar não derruba os outros.
- **Liberdade tecnológica:** cada serviço pode usar a ferramenta mais adequada.

## O que custa

Todos os ganhos acima vêm junto com os problemas de sistemas distribuídos:

- **A rede falha.** Chamadas entre serviços têm latência, timeouts e falhas parciais que não existiam numa chamada de função.
- **Consistência de dados vira problema de projeto.** Sem um banco compartilhado, uma operação que envolve vários serviços não cabe em uma transação. Padrões como o [Saga](/blog/saga-pattern) resolvem, mas adicionam complexidade.
- **Observabilidade é obrigatória.** Sem logs centralizados, métricas e rastreamento distribuído, depurar um erro que passa por seis serviços vira arqueologia.
- **Sobrecarga operacional.** Mais pipelines, mais repositórios, mais configurações, mais dependências para atualizar.

Fowler listou, também em 2014, pré-requisitos que considera necessários antes de adotar microsserviços: **provisionamento rápido** de infraestrutura, **monitoramento básico** e **deploy rápido de aplicações**. Se o time ainda não tem isso para um único sistema, multiplicar sistemas multiplica o problema.

## Monolith First

Em junho de 2015, Fowler publicou *Monolith First* com uma observação feita junto a colegas: quase todas as histórias de sucesso com microsserviços começaram com um monólito que ficou grande demais e foi dividido. E quase todos os casos de sistemas construídos como microsserviços desde o início acabaram em sérios problemas.

O motivo é prático: no começo de um produto, ninguém sabe exatamente onde estão as fronteiras certas do domínio. Errar uma fronteira dentro de um monólito custa uma refatoração. Errar uma fronteira entre serviços custa uma migração de dados e de contratos de API.

## Três casos públicos

### Segment: de mais de 140 serviços para um

Em julho de 2018, Alexandra Noonan publicou no blog da Segment o texto *Goodbye Microservices*. A empresa tinha um serviço (e uma fila) por destino de integração, e o número passou de 140. Problemas relatados:

- a sobrecarga operacional crescia linearmente a cada destino adicionado;
- três engenheiros em tempo integral passavam a maior parte do tempo só mantendo o sistema funcionando;
- bibliotecas compartilhadas divergiram de versão entre os repositórios;
- testes dependiam de chamadas HTTP reais e falhavam com frequência.

A solução foi consolidar tudo em um único serviço, em um monorepo, com uma única versão de cada dependência. A conclusão do texto: mover para um monólito eliminou problemas operacionais e aumentou significativamente a produtividade dos desenvolvedores. O próprio texto também registra o custo da escolha: isolamento de falhas fica mais difícil.

### Prime Video: um caso específico, não uma regra geral

Em 2023, o time de análise de qualidade de vídeo do Prime Video relatou ter migrado uma ferramenta de monitoramento de uma arquitetura distribuída em serverless (AWS Step Functions orquestrando funções Lambda, com dados intermediários no S3) para uma única aplicação rodando em ECS. Segundo a cobertura da InfoQ, a arquitetura original suportava cerca de 5% da carga esperada, por causa do custo das transições de estado e das leituras e escritas no S3. A nova versão processava os dados em memória e reduziu os custos operacionais em 90%.

O caso viralizou como "Amazon volta para o monólito", mas o próprio engenheiro citado foi cuidadoso: a abordagem distribuída não trazia muitos benefícios **naquele caso de uso específico**. Esse é o aprendizado útil: a arquitetura certa depende do padrão de dados e de carga, não de uma preferência geral.

### Shopify: o monólito modular

Em fevereiro de 2019, Kirsten Westeinde publicou no blog de engenharia da Shopify *Deconstructing the Monolith*. Em vez de quebrar a aplicação Rails principal em serviços, a empresa manteve todo o código em uma única base e passou a definir e respeitar fronteiras entre componentes. É o que se chama de **monólito modular**: um único artefato de deploy, com módulos isolados e interfaces explícitas.

## Fronteiras seguem pessoas

O artigo de Lewis e Fowler cita a lei de Conway (1968): organizações que projetam sistemas produzem designs que copiam a estrutura de comunicação da própria organização. Na prática, a divisão em serviços funciona melhor quando acompanha a divisão em times e em capacidades de negócio. Um time pequeno que mantém dez serviços raramente colhe os benefícios de autonomia: ele só ganhou mais coisas para operar.

## O meio-termo que recomendo na maioria dos casos

Minha opinião: para a maioria das empresas que estão crescendo, o ponto de partida mais eficiente é um **monólito modular**, com fronteiras de domínio explícitas, cada módulo dono das próprias tabelas e comunicação entre módulos apenas por interfaces públicas. Quando um módulo realmente precisar de deploy ou escala independentes, ele já está pronto para ser extraído.

```text
src/
  modules/
    pedidos/
      index.ts          ← única porta de entrada pública do módulo
      application/
      domain/
      infra/
    pagamentos/
      index.ts
      ...
    estoque/
      index.ts
      ...
```

A regra é simples de explicar e de verificar em revisão de código: um módulo só importa o `index.ts` de outro, nunca arquivos internos. Detalho essa separação de responsabilidades no artigo sobre [arquitetura de sistemas web](/blog/arquitetura-sistemas-web-eficientes). Se você está vindo de um sistema antigo, o artigo sobre [modernização de sistemas legados](/blog/modernizacao-sistemas-legados) mostra como extrair partes de forma incremental.

## Checklist de decisão

Microsserviços tendem a fazer sentido quando a maioria das respostas abaixo é "sim":

1. Existem vários times que precisam publicar partes diferentes do sistema de forma independente?
2. As fronteiras de domínio estão claras e estáveis há algum tempo?
3. Partes do sistema têm requisitos de escala ou disponibilidade muito diferentes entre si?
4. O time já tem deploy automatizado, provisionamento rápido e monitoramento?
5. Existe capacidade para operar observabilidade distribuída (logs, métricas, tracing)?
6. A consistência eventual entre partes do sistema é aceitável para o negócio?

Se a maioria for "não", o problema provavelmente se resolve com melhor modularização, e não com mais serviços.

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura.

- James Lewis e Martin Fowler. [Microservices](https://martinfowler.com/articles/microservices.html) (março de 2014).
- Martin Fowler. [Microservice Prerequisites](https://martinfowler.com/bliki/MicroservicePrerequisites.html) (2014).
- Martin Fowler. [Monolith First](https://martinfowler.com/bliki/MonolithFirst.html) (junho de 2015).
- Alexandra Noonan, Segment. [Goodbye Microservices: From 100s of problem children to 1 superstar](https://www.twilio.com/en-us/blog/developers/best-practices/goodbye-microservices) (julho de 2018).
- Rafał Gancarz, InfoQ. [Prime Video Switched from Serverless to EC2 and ECS to Save Costs](https://www.infoq.com/news/2023/05/prime-ec2-ecs-saves-costs/) (maio de 2023).
- Kirsten Westeinde, Shopify Engineering. [Deconstructing the Monolith: Designing Software that Maximizes Developer Productivity](https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity) (fevereiro de 2019).
