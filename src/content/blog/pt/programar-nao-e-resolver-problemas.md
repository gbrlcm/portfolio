---
title: "Saber programar não é o mesmo que resolver problemas"
description: "Código é uma ferramenta, não o resultado. Como sair da lógica de entregar tarefas, evitar a complexidade que não resolve nada e começar a pensar em impacto."
pubDate: 2026-10-29T14:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/programar-nao-e-resolver-problemas.webp"
coverAlt: "Ilustração de uma linha emaranhada que se transforma em uma seta reta apontando para um alvo, com o rótulo Série Carreira 01"
category: "Carreira"
tags:
  - "Carreira"
  - "Engenharia de Software"
  - "Produto"
  - "Série Carreira"
draft: false
lang: "pt-BR"
---

Imagine um pedido comum em qualquer empresa: "precisamos de um dashboard de pedidos". Um desenvolvedor competente consegue entregar isso com gráficos, filtros, exportação para planilha e permissões por perfil. Leva algumas semanas. O dashboard fica bonito, e quase ninguém abre depois do primeiro mês.

Agora imagine outra conversa, antes de qualquer código. "Para que vocês vão usar o dashboard?" A resposta: o time comercial quer saber quais pedidos estão atrasados para ligar para o cliente antes que ele reclame. A solução que resolve isso pode ser uma consulta SQL e um e-mail diário com a lista de pedidos atrasados. Leva uma tarde.

O exemplo é hipotético, mas o padrão não é. A diferença entre as duas entregas não está em saber programar. Está em entender qual problema existe.

Este é o primeiro texto de uma série curta sobre carreira em engenharia. A tese dele é simples: **programar é uma habilidade; resolver problemas é o trabalho.**

## O que as empresas pagam, de fato

Em 2011, Patrick McKenzie publicou um texto que ainda circula entre desenvolvedores, *Don't Call Yourself A Programmer, And Other Career Advice*. Uma das frases mais citadas: engenheiros são contratados para criar valor de negócio, não para programar coisas. E a conclusão dele é crua: aumente receita, reduza custos.

Dá para discordar do tom, e eu acho que o trabalho de um desenvolvedor também envolve qualidade, segurança e cuidado com as pessoas que usam o sistema. Mas a ideia central é difícil de contestar. Nenhuma empresa tem como objetivo "ter código". Ela tem objetivos (vender mais, errar menos, atender mais rápido, cumprir uma lei), e o código é um dos meios.

Quando um desenvolvedor esquece isso, ele passa a medir o próprio trabalho pelo que produziu (tarefas fechadas, linhas escritas, tecnologias usadas), e não pelo que mudou.

## Tarefa entregue não é problema resolvido

A mentalidade de tarefas tem um apelo compreensível. Ela é clara, mensurável e protege: se o ticket dizia "criar tela X" e a tela X existe, o trabalho foi feito. Se ninguém usa, o problema é de quem pediu.

O custo dessa proteção é alto. Quem só executa tarefas:

- não percebe quando a tarefa resolve o problema errado;
- não propõe alternativas mais baratas;
- não sabe se o que entregou funcionou, porque nunca olhou o depois;
- vira substituível, porque executar uma especificação clara é exatamente o tipo de trabalho mais fácil de terceirizar ou automatizar.

Pensar em resultado não é ignorar a tarefa. É tratar a tarefa como uma **hipótese**: "acreditamos que esta tela vai reduzir as ligações de reclamação". Hipóteses podem ser testadas. Tarefas, só concluídas.

## Complexo não é o mesmo que bom

Existe um tipo de satisfação em construir algo sofisticado: uma arquitetura elegante, uma abstração genérica, um sistema que "aguenta qualquer escala". Às vezes isso é necessário. Muitas vezes, é complexidade que não resolve problema nenhum.

Fred Brooks, no ensaio *No Silver Bullet* (1986), separou a complexidade de software em duas partes: a **essencial**, que vem do próprio problema, e a **acidental**, que vem das ferramentas e das escolhas de quem constrói. A primeira não dá para eliminar. A segunda é, em boa parte, responsabilidade nossa.

Uma observação atribuída a John Gall, no livro *Systemantics* (1975), ficou conhecida como lei de Gall: um sistema complexo que funciona invariavelmente evoluiu de um sistema simples que funcionava. Projetar o sistema complexo desde o início, sem ter visto o simples funcionar, raramente dá certo.

Um teste prático ajuda: **se eu precisasse resolver isto até amanhã, sem escrever código novo, o que eu faria?** Às vezes a resposta é uma planilha, um ajuste de processo, uma configuração em uma ferramenta que a empresa já paga, ou simplesmente remover uma funcionalidade que atrapalha. Nem sempre essa é a solução final, mas ela revela o tamanho real do problema.

## Cinco perguntas antes de abrir o editor

1. **Qual problema isso resolve, e para quem?** Se a resposta é "o gerente pediu", ainda não há resposta.
2. **Como saberemos que funcionou?** Um número, um comportamento observável, uma reclamação que deixa de chegar.
3. **O que acontece se não fizermos nada?** Às vezes, nada. Isso também é informação.
4. **Qual é a menor versão que já gera valor?** Ela costuma ser bem menor do que a especificação inicial.
5. **O que isso custa para manter?** Todo código entregue vira um compromisso de manutenção, de segurança e de entendimento para quem vier depois.

Essas perguntas não exigem cargo de gestão nem permissão especial. Exigem curiosidade e um pouco de coragem para perguntar "por quê?" sem parecer que está questionando a autoridade de alguém. Uma forma que funciona bem é perguntar pelo uso: "como você imagina usando isso no dia a dia?".

## Como isso aparece no dia a dia

- **No refinamento de tarefas:** em vez de estimar direto, peça o contexto. "Qual é o problema por trás?" é uma pergunta legítima em qualquer cerimônia.
- **Na proposta técnica:** apresente pelo menos duas alternativas, com custo e benefício. Uma delas pode ser a mais simples possível.
- **Na entrega:** defina, antes, o que vai olhar depois. Volte a olhar uma ou duas semanas após o deploy.
- **Na comunicação:** descreva o trabalho pelo efeito, não pela técnica. "Reduzi o tempo de fechamento do relatório mensal" diz mais do que "implementei um job em Go com filas".

## O que esta tese não diz

Ela não diz que técnica não importa. Resolver bem um problema exige saber programar bem: código ruim cria problemas novos mais rápido do que resolve os antigos. Também não diz que todo desenvolvedor deve virar gerente de produto. Diz que **a técnica rende mais quando está apontada para o problema certo**, e que identificar o problema certo é parte do trabalho, não um extra.

A próxima vez que receber uma tarefa, experimente uma única mudança: antes de estimar, pergunte como alguém vai saber que ela deu certo. A resposta (ou a falta dela) costuma mudar o que você vai construir.

No próximo texto da série, discuto [por que desenvolvedores tecnicamente bons param de crescer](/blog/por-que-bons-desenvolvedores-param-de-crescer), e o papel de entender o negócio nisso.

## Referências

Este artigo é um texto de opinião, apoiado nas fontes abaixo. O exemplo da abertura é hipotético.

- Patrick McKenzie. [Don't Call Yourself A Programmer, And Other Career Advice](https://www.kalzumeus.com/2011/10/28/dont-call-yourself-a-programmer/) (outubro de 2011).
- Frederick P. Brooks Jr. *No Silver Bullet: Essence and Accidents of Software Engineering* (1986). [Relatório técnico TR86-020, Universidade da Carolina do Norte](https://www.cs.unc.edu/techreports/86-020.pdf).
- John Gall. *Systemantics: How Systems Work and Especially How They Fail*. Quadrangle, 1975.
- Gergely Orosz. [The Product-Minded Software Engineer](https://blog.pragmaticengineer.com/the-product-minded-engineer/) (2019).
