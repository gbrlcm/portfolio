---
title: "Por que bons desenvolvedores param de crescer"
description: "A partir de certo ponto, crescer na carreira depende menos de técnica e mais de entender produto, clientes, custos e retorno. Um guia prático para fazer essa transição."
pubDate: 2026-10-29T13:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/por-que-bons-desenvolvedores-param-de-crescer.webp"
coverAlt: "Ilustração de uma escada cujos degraus sobem até formar um platô horizontal, com um degrau seguinte destacado em amarelo e o rótulo Série Carreira 02"
category: "Carreira"
tags:
  - "Carreira"
  - "Produto"
  - "Negócios"
  - "Série Carreira"
draft: false
lang: "pt-BR"
---

Existe um tipo de profissional que quase toda equipe já teve: tecnicamente excelente, resolve bugs que ninguém resolve, revisa código com precisão, conhece o sistema inteiro. E, mesmo assim, está há anos no mesmo nível, sem entender por quê. As avaliações dizem coisas como "precisa de mais visão de negócio" ou "precisa ampliar o impacto", frases que soam vagas para quem passou a carreira sendo medido por código.

Este é o segundo texto da série sobre carreira. A tese: **a partir de certo ponto, o que limita o crescimento não é a profundidade técnica, mas o alcance das decisões em que você é confiável para participar.** E esse alcance depende de entender o negócio.

## O que muda quando a carreira avança

Nos primeiros anos, o trabalho é claramente técnico: receber um problema bem definido e resolvê-lo bem. Crescer significa resolver problemas maiores, com menos ajuda.

Depois, o problema muda de natureza. Os problemas deixam de chegar bem definidos. Alguém precisa decidir **qual** problema resolver, **quanto** investir nele e **o que** deixar de fazer para isso. Essas decisões envolvem prioridades de produto, clientes, custo e retorno. Quem não participa delas fica restrito a executar o que foi decidido por outros, por melhor que execute.

Will Larson, no livro e no site *Staff Engineer*, descreve quatro arquétipos comuns de engenheiros em nível staff: o Tech Lead, que guia a execução de um time; o Arquiteto, responsável pela direção técnica de uma área; o Solucionador, que resolve problemas difíceis onde for preciso; e o Braço Direito, que amplia o alcance de uma liderança. Todos têm algo em comum: o impacto deles é medido no nível da organização, não da tarefa.

## O que é "visão de negócio", concretamente

A expressão é vaga, então vale traduzir. Gergely Orosz, no texto *The Product-Minded Software Engineer* (2019), lista características de engenheiros com mentalidade de produto. Algumas das que ele cita:

- interesse no negócio, no comportamento dos usuários e nos dados sobre isso;
- curiosidade e interesse genuíno no "por quê?";
- boa relação com pessoas que não são da engenharia;
- oferecer trade-offs entre produto e engenharia logo no início;
- tratar casos de borda de forma pragmática;
- ciclos rápidos de validação.

Em termos práticos, entender o negócio significa conseguir responder perguntas como estas sobre o lugar onde você trabalha:

- Como a empresa ganha dinheiro? Quem paga, por quê, e quanto?
- Quais são os maiores custos? Onde a tecnologia entra neles?
- Quem são os clientes mais importantes, e o que eles reclamam?
- O que faria a empresa perder clientes no próximo ano?
- Quanto custa, aproximadamente, uma semana de trabalho do seu time?

Quem não sabe responder não é um profissional pior. Mas está trabalhando com metade da informação que as pessoas que tomam as decisões usam.

## Um exemplo de conta que muda conversas

Os números abaixo são **hipotéticos**, escolhidos só para ilustrar o raciocínio.

Um time de operações gasta 20 horas por mês conciliando manualmente pagamentos entre dois sistemas. O custo total de uma hora desse trabalho (salário, encargos, estrutura) é de R$ 80. Isso dá R$ 1.600 por mês, ou R$ 19.200 por ano. Automatizar a conciliação levaria duas semanas de um desenvolvedor, com custo total estimado em R$ 12 mil, mais uma manutenção de cerca de R$ 300 por mês.

```text
Economia mensal:      R$ 1.600 - R$ 300 = R$ 1.300
Investimento:         R$ 12.000
Retorno do investimento (payback): 12.000 / 1.300 ≈ 9,2 meses
```

Com essa conta, a conversa deixa de ser "eu acho que vale automatizar" e passa a ser "o investimento se paga em menos de um ano, e ainda reduz o risco de erro manual". Pode ser que a empresa tenha prioridades melhores. Mas agora é uma decisão informada, e você participou dela.

A conta não precisa ser precisa para ser útil. Ela precisa ser **explícita**, para que alguém possa corrigir as premissas.

## Por que bons técnicos evitam esse terreno

Na minha leitura, há três motivos frequentes, e todos são compreensíveis:

1. **Parece trabalho de outra pessoa.** Produto é do PM, vendas é do comercial, custo é do financeiro. Mas decisões técnicas sempre têm custo e efeito no negócio, e quem conhece a técnica é quem melhor estima esses dois.
2. **O feedback é mais lento e ambíguo.** Um teste passa ou falha. Uma decisão de produto pode levar meses para mostrar se estava certa, e às vezes nunca fica claro.
3. **Exige falar com pessoas diferentes.** Suporte, vendas, financeiro, clientes. Isso consome tempo e tira da zona de conforto.

## Um plano de 30 dias para começar

Sem pedir permissão a ninguém e sem mudar de cargo:

- **Semana 1: ouça o cliente.** Leia tickets de suporte da última semana, ou peça para acompanhar uma ligação de atendimento. Anote os problemas que se repetem.
- **Semana 2: entenda o dinheiro.** Peça para alguém explicar como a empresa precifica o produto e quais são os principais custos. Aprenda o significado de receita recorrente, margem, custo de aquisição de cliente e cancelamento (churn), se forem relevantes para o seu negócio.
- **Semana 3: conecte com o seu trabalho.** Escolha uma tarefa do backlog e escreva, em um parágrafo, qual resultado de negócio ela deveria gerar e como medir.
- **Semana 4: proponha algo.** Uma página com um problema, duas alternativas, custo estimado, benefício esperado e como medir. Leve para quem decide.

O objetivo não é virar gerente de produto. É ser o desenvolvedor que a liderança quer na sala quando a decisão é tomada.

## Cuidados para não exagerar

- **Não abandone a profundidade técnica.** Ela é o que dá credibilidade às suas opiniões de negócio. Um engenheiro que fala de ROI, mas não sustenta tecnicamente o que propõe, perde a confiança dos dois lados.
- **Não finja certeza.** Estimativas de negócio são incertas. Mostre as premissas e o intervalo.
- **Não transforme tudo em dinheiro.** Segurança, acessibilidade e qualidade têm valor mesmo quando a conta não fecha no trimestre. Entender o negócio inclui saber defendê-los.

Crescer, a partir de certo ponto, é aumentar o tamanho das perguntas que você ajuda a responder. Código continua sendo a ferramenta principal. A diferença é saber para que a empresa precisa dele.

No texto anterior da série, discuti por que [saber programar não é o mesmo que resolver problemas](/blog/programar-nao-e-resolver-problemas). No próximo, falo sobre como [construir reputação profissional sem depender de viralizar](/blog/reputacao-profissional-sem-viralizar).

## Referências

Este artigo é um texto de opinião, apoiado nas fontes abaixo. O exemplo numérico é hipotético.

- Will Larson. [Staff Engineer: Staff archetypes](https://staffeng.com/guides/staff-archetypes/).
- Gergely Orosz. [The Product-Minded Software Engineer](https://blog.pragmaticengineer.com/the-product-minded-engineer/) (setembro de 2019, atualizado em 2022).
- Patrick McKenzie. [Don't Call Yourself A Programmer, And Other Career Advice](https://www.kalzumeus.com/2011/10/28/dont-call-yourself-a-programmer/) (outubro de 2011).
