---
title: "Reputação profissional sem depender de viralizar"
description: "Reputação é evidência fácil de verificar, acumulada com consistência. Por que projetos pequenos, bem feitos e documentados valem mais que posts virais."
pubDate: 2026-10-29T12:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/reputacao-profissional-sem-viralizar.webp"
coverAlt: "Ilustração de uma grade de pequenos quadrados preenchidos com cadência regular ao longo do tempo, alguns destacados em amarelo, com o rótulo Série Carreira 03"
category: "Carreira"
tags:
  - "Carreira"
  - "Portfólio"
  - "Documentação"
  - "Série Carreira"
draft: false
---

Quem acompanha tecnologia nas redes sociais conhece o padrão: uma postagem com um número impressionante, uma opinião polêmica sobre uma linguagem, um fio sobre "10 ferramentas que você precisa conhecer". Algumas viralizam. Quase nenhuma muda a carreira de quem publicou.

Este é o terceiro texto da série sobre carreira. A tese: **reputação profissional não é alcance, é confiança de pessoas específicas, sustentada por evidências fáceis de verificar.** E evidências se acumulam melhor com consistência do que com picos.

## O que reputação é, na prática

Reputação, no sentido que importa para a carreira, é o que alguém pensa quando seu nome aparece em uma conversa sobre uma vaga, um projeto ou uma indicação. Ela tem dois componentes:

- **Confiança:** a pessoa acredita que você faz bem determinado tipo de trabalho.
- **Lembrança:** a pessoa associa seu nome a esse tipo de trabalho na hora certa.

Viralizar aumenta a lembrança de muita gente por pouco tempo, e quase nunca aumenta a confiança. Um recrutador técnico, um cliente em potencial ou um futuro colega raramente decide com base em um post. Decide com base no que consegue **verificar**: um projeto que funciona, um texto que explica uma decisão com clareza, uma recomendação de alguém que trabalhou com você.

## Uma escada de evidências

Nem toda evidência pesa igual. Uma forma útil de pensar, da mais fraca para a mais forte:

1. **Afirmação:** "tenho experiência com sistemas distribuídos". Qualquer um pode escrever.
2. **Demonstração:** um repositório que mostra o código.
3. **Explicação:** um texto ou README que mostra por que o código é assim, quais alternativas foram descartadas e quais são os limites.
4. **Resultado:** algo em uso por outras pessoas, com efeito observável.
5. **Endosso:** alguém com credibilidade própria confirma que você fez aquilo bem.

A maioria dos portfólios para no degrau 2. Subir para o 3 é o passo mais barato e mais subestimado: não exige novos projetos, só documentar melhor os que já existem.

## Por que projetos pequenos funcionam

Existe uma pressão para construir algo grande: um clone de rede social, um SaaS completo, uma plataforma com microsserviços. Projetos grandes demais costumam ficar pela metade, e projetos pela metade não servem de evidência.

Um projeto pequeno, terminado e bem documentado mostra mais:

- que você sabe delimitar escopo;
- que você termina o que começa;
- como você toma decisões técnicas;
- como você se comunica por escrito.

Exemplos de projetos pequenos com valor real: uma ferramenta de linha de comando que resolve um incômodo seu, uma biblioteca que encapsula uma integração chata com uma API pública, um estudo comparando duas abordagens com números medidos por você, uma contribuição bem descrita a um projeto open source que você usa.

## A anatomia de um README que vira evidência

Um README não precisa ser longo. Precisa responder às perguntas que alguém faria antes de confiar no projeto:

```markdown
# nome-do-projeto

Uma frase sobre o problema que ele resolve, e para quem.

## Por que existe
O contexto: o que estava errado, incômodo ou caro antes.

## Como usar
O menor exemplo que funciona, copiável.

## Decisões
- Por que esta linguagem, este banco, esta abordagem.
- O que foi considerado e descartado, e por quê.

## Limites conhecidos
O que o projeto não faz, onde ele quebra, o que ainda falta.

## Como rodar os testes
Um comando.
```

A seção de **limites conhecidos** é a que mais gera confiança, e a que quase ninguém escreve. Admitir onde o projeto falha mostra que você entende o que construiu.

Para documentação mais completa, o framework Diátaxis, de Daniele Procida, é uma boa referência. Ele separa a documentação em quatro tipos com propósitos diferentes: tutoriais (aprender fazendo), guias práticos (resolver uma tarefa), referência (consultar detalhes) e explicação (entender o porquê). A maioria dos projetos mistura os quatro em um único texto e acaba não servindo bem a nenhum.

## Escrever é trabalho de engenharia

Shawn Wang, conhecido como swyx, popularizou em 2018 a ideia de *learn in public*: aprender em público, publicando o que você aprende enquanto aprende, e criando o material que você gostaria de ter encontrado. Não é sobre ser especialista. É sobre deixar um rastro útil.

Alguns formatos que funcionam sem depender de algoritmo:

- **Registro de decisão:** um texto curto sobre uma escolha técnica, com contexto, alternativas e consequências.
- **Post-mortem pessoal:** o que deu errado em um projeto e o que você faria diferente.
- **Explicação de um conceito difícil**, com um exemplo que você mesmo construiu.
- **Comparação medida:** "testei A e B neste cenário, com estes números".

O critério é sempre o mesmo: alguém conseguiria verificar o que você escreveu?

## Reputação dentro da empresa também conta

Boa parte da reputação que muda carreira é interna: o que sua liderança e seus colegas sabem sobre o seu trabalho. E ela tem um problema conhecido: as pessoas esquecem o que você fez.

Julia Evans propôs, em 2019, o *brag document*: um documento simples, atualizado com frequência, listando o que você fez, por que importou e o que aprendeu. Ele serve para avaliações de desempenho, para conversas sobre promoção e para você mesmo lembrar do próprio progresso. Não é autopromoção. É memória organizada.

## Consistência ganha de picos

Um texto bem pensado por mês durante dois anos gera mais confiança do que um post viral seguido de silêncio. A consistência mostra que você continua aprendendo, e cria um arquivo que pode ser consultado a qualquer momento.

Também protege contra uma armadilha: perseguir viralização tende a puxar o conteúdo para o que gera engajamento (polêmica, simplificação, números chamativos), e não para o que gera confiança (precisão, nuance, limites honestos).

## O que evitar

- **Projetos de tutorial sem modificação.** Mostram que você seguiu instruções, não que sabe decidir.
- **Números sem contexto.** "Melhorei a performance em 90%" sem dizer de quanto para quanto, medido como, em que cenário.
- **Inflar o próprio papel.** Em algum momento, alguém que estava lá vai ler.
- **Esperar estar pronto.** O primeiro texto vai ser pior que o décimo. É assim para todo mundo.

Reputação é lenta, e isso é uma vantagem: o que é construído devagar, com evidência, também se desfaz devagar.

Este é o terceiro texto da série. Os anteriores falam sobre [resolver problemas em vez de entregar tarefas](/blog/programar-nao-e-resolver-problemas) e sobre [por que bons desenvolvedores param de crescer](/blog/por-que-bons-desenvolvedores-param-de-crescer). O próximo trata da [pressão por acompanhar todas as tecnologias novas](/blog/pressao-por-novas-tecnologias).

## Referências

Este artigo é um texto de opinião, apoiado nas fontes abaixo.

- Julia Evans. [Get your work recognized: write a brag document](https://jvns.ca/blog/brag-documents/) (2019).
- Shawn Wang (swyx). [Learn In Public](https://www.swyx.io/learn-in-public) (2018).
- Daniele Procida. [Diátaxis: a systematic approach to technical documentation](https://diataxis.fr/).
- GitHub Docs. [About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes).
