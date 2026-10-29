---
title: "Você não precisa acompanhar todas as tecnologias novas"
description: "Acompanhar tudo é impossível e desnecessário. Como avaliar tecnologias com critério, investir em fundamentos e tomar decisões técnicas com autonomia."
pubDate: 2026-10-29T11:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/pressao-por-novas-tecnologias.webp"
coverAlt: "Ilustração de muitos pontos espalhados, dos quais poucos estão ligados por uma linha clara destacada em amarelo, com o rótulo Série Carreira 04"
category: "Carreira"
tags:
  - "Carreira"
  - "Tomada de Decisão"
  - "Arquitetura"
  - "Série Carreira"
draft: false
lang: "pt-BR"
---

Toda semana surge um framework novo, uma ferramenta de IA que "muda tudo", uma linguagem que promete substituir outra. Para quem trabalha com tecnologia, a sensação é de estar sempre atrasado. E a reação mais comum é tentar acompanhar tudo: mais newsletters, mais vídeos, mais cursos começados e abandonados.

Este é o quarto texto da série sobre carreira, e o formato é diferente dos anteriores: em vez de uma única linha de argumento, respondo às perguntas que essa pressão costuma provocar. A tese, porém, é uma só: **o que diferencia um bom profissional não é conhecer todas as tecnologias, é saber avaliar qualquer uma.**

## "Se eu não aprender isso agora, vou ficar para trás?"

Quase sempre, não. No momento do lançamento, não há como saber quais tecnologias vão durar. As que ficam levam tempo para amadurecer, e quem chega um pouco depois encontra documentação melhor, erros já mapeados e casos reais para estudar.

Existe uma heurística conhecida como efeito Lindy, popularizada por Nassim Taleb: para coisas não perecíveis, como ideias e tecnologias, quanto mais tempo algo já sobreviveu, maior a expectativa de que continue existindo. É uma heurística, não uma lei, mas ajuda a calibrar. SQL, HTTP, Unix e a programação orientada a eventos estão aí há décadas. Investir neles rende por muito tempo.

## "Então devo ignorar o que é novo?"

Também não. O ponto é separar **conhecer** de **adotar**.

O Technology Radar da Thoughtworks, publicado periodicamente, é um bom modelo mental. Ele classifica tecnologias em quatro anéis:

- **Adopt:** recomendadas para uso amplo.
- **Trial:** vale usar em projetos onde o risco é aceitável.
- **Assess:** vale explorar para entender o impacto.
- **Hold:** proceder com cautela.

Você pode manter o seu próprio radar mental. A maioria das novidades fica, para você, em "assess": vale saber o que é e qual problema promete resolver. Bem poucas merecem "trial". E quase nada deveria entrar em "adopt" sem ter passado pelas anteriores.

## "Como avaliar uma tecnologia sem gastar semanas?"

Um roteiro que cabe em duas ou três horas:

1. **Qual problema ela resolve?** Escreva em uma frase. Se não conseguir, ela ainda não é para você.
2. **Eu tenho esse problema?** Hoje, no projeto real, e não em um cenário hipotético.
3. **Como resolvo esse problema hoje?** E quanto isso me custa?
4. **Qual é a maturidade?** Tempo de existência, frequência de releases, quem mantém, quem usa em produção, qualidade da documentação.
5. **Qual é o custo de adoção?** Aprendizado do time, migração, operação, novas dependências.
6. **Dá para voltar atrás?** Decisões reversíveis podem ser tomadas rápido. Irreversíveis merecem mais cuidado.
7. **Um teste mínimo:** uma prova de conceito pequena contra um caso real, com tempo limitado.

Ao fim, escreva a conclusão em poucas linhas. Mesmo que a resposta seja "não agora", o registro evita refazer a análise quando o assunto voltar.

## "Mas a empresa quer usar a tecnologia da moda"

Às vezes a pressão vem de dentro. Dan McKinley escreveu em 2015 um texto que virou referência, *Choose Boring Technology*. A ideia central: cada empresa tem um número pequeno de "fichas de inovação" (ele sugere cerca de três), e cada tecnologia nova e pouco conhecida gasta uma delas. Tecnologias "chatas" não são piores: seus modos de falha são bem conhecidos. E toda tecnologia nova traz uma bagagem de operação e de sobrecarga cognitiva.

O argumento ajuda em conversas difíceis. Em vez de "não gosto dessa ferramenta", você pode dizer: "vale gastar uma ficha de inovação aqui? Qual problema ela resolve que as ferramentas atuais não resolvem? Quem vai operar isso às três da manhã?". Um exemplo recente de como essa pergunta pode levar à resposta mais simples é a decisão da Shopify de [mover reservas de estoque do Redis para o MySQL](/blog/shopify-redis-mysql-skip-locked).

## "O que vale estudar, então?"

Fundamentos que aparecem em qualquer stack:

- **Redes:** HTTP, DNS, TLS, latência.
- **Bancos de dados:** modelagem, índices, transações, isolamento, locks.
- **Sistemas operacionais:** processos, memória, concorrência.
- **Estruturas de dados e complexidade**, no nível de saber estimar custo.
- **Arquitetura:** acoplamento, coesão, trade-offs, como os que discuto no [roteiro de system design](/blog/system-design-roteiro-pratico).
- **Escrita técnica:** explicar uma decisão com clareza.

Quem entende transações e locks aprende o próximo banco de dados em dias. Quem só memorizou a API de um ORM recomeça do zero a cada troca.

## "Como desenvolver autonomia para decidir?"

Autonomia técnica não é ter liberdade para escolher qualquer coisa. É ter critério reconhecido para escolher bem. Algumas práticas que constroem isso:

- **Escreva antes de decidir.** Contexto, alternativas, critérios, decisão, consequências. O formato de ADR (Architecture Decision Record), proposto por Michael Nygard, é simples e funciona.
- **Defina os critérios antes de comparar.** Quem escolhe os critérios depois de ver as opções costuma escolher os que justificam a preferência inicial.
- **Revise decisões antigas.** Volte, depois de alguns meses, a uma decisão que você tomou. O que aconteceu? O que você não previu?
- **Procure a melhor objeção.** Antes de defender uma escolha, tente formular o melhor argumento contra ela.
- **Diferencie fato, interpretação e preferência.** "Esta biblioteca tem 3 mantenedores ativos" é fato. "Ela é mais moderna" é interpretação. "Gosto mais da sintaxe" é preferência. As três têm lugar, mas não o mesmo peso.

## "E a ansiedade de sempre achar que sabe pouco?"

Ela não vai embora completamente, e talvez não deva: algum desconforto mantém a curiosidade. Mas ela diminui quando a medida muda. Em vez de "quantas tecnologias eu conheço?", pergunte "quantos problemas diferentes eu consigo resolver bem?" e "consigo avaliar uma tecnologia que nunca vi?".

Uma regra prática: reserve um tempo fixo e limitado na semana para explorar novidades, e trate o resto do tempo como trabalho profundo em fundamentos e em problemas reais. Uma ou duas horas por semana de exploração são suficientes para manter o radar atualizado sem viver em função dele.

O ecossistema vai continuar produzindo novidades mais rápido do que qualquer pessoa consegue acompanhar. Isso não é um problema seu para resolver. O seu problema é ter critério para saber quais delas merecem a sua atenção.

Este é o último texto da série sobre carreira. Os anteriores: [resolver problemas em vez de entregar tarefas](/blog/programar-nao-e-resolver-problemas), [por que bons desenvolvedores param de crescer](/blog/por-que-bons-desenvolvedores-param-de-crescer) e [reputação sem depender de viralizar](/blog/reputacao-profissional-sem-viralizar).

## Referências

Este artigo é um texto de opinião, apoiado nas fontes abaixo.

- Dan McKinley. [Choose Boring Technology](https://mcfunley.com/choose-boring-technology) (março de 2015).
- Thoughtworks. [Technology Radar](https://www.thoughtworks.com/radar).
- Michael Nygard. [Documenting Architecture Decisions](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions) (novembro de 2011).
- Nassim Nicholas Taleb. *Antifragile: Things That Gain from Disorder*. Random House, 2012 (sobre o efeito Lindy).
