---
title: "GEO: o que a pesquisa diz sobre aparecer em respostas de IA"
description: "Generative Engine Optimization a partir do artigo original (KDD 2024): o que foi testado, o que funcionou, os limites do estudo e o que aplicar hoje."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/geo-generative-engine-optimization.webp"
coverAlt: "Ilustração de uma resposta gerada por IA com marcadores de citação numerados, um deles ligado a uma fonte destacada em amarelo"
category: "SEO e AI Search"
tags:
  - "GEO"
  - "AI Search"
  - "SEO"
  - "llms.txt"
draft: false
---

Sempre que surge uma sigla nova em marketing digital, aparecem também os vendedores de fórmula. Com GEO (Generative Engine Optimization) não foi diferente. A diferença é que, neste caso, existe um artigo científico na origem do termo, e lê-lo é a melhor vacina contra promessas exageradas.

Neste texto resumo o que o estudo testou e encontrou, o que ele não prova, o que o Google e a OpenAI documentam sobre o assunto e o que, na minha leitura, vale aplicar hoje.

## SEO, AEO e GEO: qual a diferença?

| Sigla | Objetivo | Onde aparece |
| :--- | :--- | :--- |
| **SEO** | Ser encontrado e bem posicionado nos resultados de busca | Lista de links do buscador |
| **AEO** | Ter um trecho da página usado como resposta direta | Featured snippets, respostas de voz, assistentes |
| **GEO** | Ser citado e bem representado em respostas geradas por modelos de linguagem | AI Overviews, ChatGPT, Perplexity, Copilot |

Na prática as três se sobrepõem bastante. Conteúdo que não é rastreado nem indexado não aparece em nenhuma delas. Se você ainda não tem essa base, comece pelo [guia de SEO](/blog/seo-o-que-o-google-recomenda) e pelo [artigo sobre AEO](/blog/aeo-answer-engine-optimization).

## De onde vem o termo

O termo foi proposto no artigo *GEO: Generative Engine Optimization*, de Pranjal Aggarwal, Vishvak Murahari, Tanmay Rajpurohit, Ashwin Kalyan, Karthik Narasimhan e Ameet Deshpande, publicado no arXiv em 2023 e aceito na conferência KDD 2024.

A pergunta dos autores: se mecanismos generativos montam uma resposta a partir de várias fontes, o que um criador de conteúdo pode fazer para que a sua fonte apareça mais nessa resposta? Para testar, eles criaram o **GEO-bench**, um benchmark com consultas de vários domínios, e duas métricas de visibilidade:

- **Position-Adjusted Word Count:** quanto do texto da resposta é atribuído à sua fonte, ponderado pela posição em que aparece.
- **Subjective Impression:** uma avaliação mais qualitativa de relevância e influência da citação na resposta.

## O que foi testado

Os autores aplicaram nove estratégias de reescrita ao conteúdo das fontes:

1. Authoritative (tom mais assertivo e autoritativo)
2. Statistics Addition (adicionar estatísticas)
3. Keyword Stuffing (repetir palavras-chave)
4. Cite Sources (citar fontes confiáveis)
5. Quotation Addition (adicionar citações relevantes)
6. Easy-to-Understand (simplificar a linguagem)
7. Fluency Optimization (melhorar a fluência do texto)
8. Unique Words (usar vocabulário mais raro)
9. Technical Terms (adicionar termos técnicos)

## O que funcionou e o que não funcionou

Os resultados mais citados do artigo:

- **Os melhores métodos melhoraram a visibilidade em cerca de 41% (Position-Adjusted Word Count) e 28% (Subjective Impression)** em relação ao conteúdo original. O resumo do artigo fala em ganhos de "até 40%".
- **Quotation Addition, Statistics Addition e Cite Sources** ficaram entre as estratégias de melhor desempenho. Ou seja: conteúdo com citações, dados e fontes tende a ser mais usado.
- **Keyword Stuffing não ajudou.** No benchmark principal ficou abaixo da linha de base, e nos testes com o Perplexity o desempenho foi cerca de 10% pior que o original.
- **Fontes com posição pior na busca se beneficiaram mais.** Para fontes na 5ª posição, a estratégia Cite Sources aumentou a visibilidade em 115,1%. Para fontes na 1ª posição, a mesma estratégia reduziu a visibilidade em 30,3%.
- **O efeito varia por domínio.** Os autores concluem que estratégias específicas por tipo de conteúdo são necessárias.

O resultado sobre keyword stuffing é o que mais me interessa. Ele indica que a tática mais velha de SEO de baixa qualidade não se transfere para mecanismos generativos, e que o que funciona se parece muito com escrever bem: dar evidências, citar quem sabe e explicar com clareza.

## O que o estudo não prova

Antes de reescrever o site inteiro, vale ter os limites em mente:

- **É um benchmark de 2023.** Os modelos e os mecanismos comerciais mudaram muito desde então, e continuam mudando.
- **Visibilidade não é negócio.** Ser mais citado em uma resposta não significa receber cliques, leads ou vendas.
- **"Adicionar estatísticas" não autoriza inventar estatísticas.** Um número sem origem pode até ser citado por um modelo, mas destrói credibilidade quando alguém confere. Use dados com fonte, ou não use.

## O que o Google e a OpenAI documentam

### Google: os fundamentos de sempre

A documentação do Google sobre recursos de IA na busca (AI Overviews e AI Mode) é direta: não há requisitos adicionais nem otimizações especiais para aparecer nesses recursos. O Google também afirma que **não é preciso criar novos arquivos legíveis por máquina, arquivos de texto para IA ou marcação especial**, e que não existe dado estruturado específico para isso.

As recomendações listadas são as práticas de SEO: permitir rastreamento, facilitar a descoberta com links internos, oferecer boa experiência de página, manter o conteúdo importante em texto e manter os dados estruturados coerentes com o que está visível.

Para controlar o uso do conteúdo, o Google aponta os controles já existentes (`nosnippet`, `data-nosnippet`, `max-snippet`, `noindex`) e o token `Google-Extended` para treinamento e grounding em outros sistemas do Google.

### OpenAI: busca e treinamento são separados

A OpenAI documenta rastreadores diferentes, e a diferença importa:

- **`OAI-SearchBot`** é usado para busca: exibir sites nas respostas do ChatGPT com busca. Sites que o bloqueiam não aparecem nessas respostas.
- **`GPTBot`** coleta conteúdo que pode ser usado para treinar os modelos fundacionais. Bloqueá-lo indica que o conteúdo não deve ser usado em treinamento.
- **`ChatGPT-User`** atende ações iniciadas pelo usuário, como abrir uma página durante uma conversa. Por ser iniciado por uma pessoa, as regras de `robots.txt` podem não se aplicar.

Um `robots.txt` que permite aparecer na busca do ChatGPT, mas recusa o uso em treinamento, fica assim:

```text
User-agent: OAI-SearchBot
Allow: /

User-agent: GPTBot
Disallow: /
```

Se essa é a decisão certa depende do seu negócio. O ponto é que ela pode ser tomada de forma separada.

## E o llms.txt?

O `llms.txt` foi proposto por Jeremy Howard em setembro de 2024: um arquivo Markdown na raiz do site com um título (H1, o único item obrigatório), um resumo em bloco de citação e listas de links para as páginas mais importantes. A proposta é oferecer conteúdo amigável para modelos de linguagem.

Este site publica um [/llms.txt](/llms.txt), e eu o trato como uma camada experimental e barata, não como fator de visibilidade. A própria documentação do Google, citada acima, diz que arquivos de texto para IA não são necessários para aparecer nos recursos de IA da busca. Se você quiser publicar um, mantenha-o factual e coerente com o site, e não espere resultado mensurável dele.

## O que eu aplicaria hoje

Juntando o estudo e a documentação oficial, minha lista prática é curta:

1. **Garanta os fundamentos de SEO.** Indexação, rastreamento liberado, conteúdo em HTML visível.
2. **Cite fontes primárias.** Documentação oficial, artigos originais, dados públicos com link.
3. **Use números com origem.** Diga de onde vem cada dado e em que contexto ele foi medido.
4. **Traga citações de quem sabe.** Uma frase de um especialista ou de uma documentação oficial, com atribuição.
5. **Escreva com clareza.** Respostas diretas no início de cada seção, termos definidos, frases que fazem sentido fora de contexto.
6. **Deixe a autoria explícita.** Quem escreveu, com que experiência, e como entrar em contato.
7. **Mantenha a entidade consistente.** O mesmo nome, a mesma descrição e os mesmos perfis em todo lugar onde você aparece.
8. **Decida conscientemente sobre rastreadores.** Busca e treinamento são escolhas diferentes.

Quase nada disso é novo. E essa é a principal conclusão: GEO, até onde a evidência pública alcança, recompensa o mesmo conteúdo que já deveria ser escrito para pessoas.

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura.

- Pranjal Aggarwal et al. [GEO: Generative Engine Optimization](https://arxiv.org/abs/2311.09735). arXiv:2311.09735, aceito na KDD 2024.
- Google Search Central. [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features).
- OpenAI. [Overview of OpenAI Crawlers](https://developers.openai.com/api/docs/bots).
- Jeremy Howard. [The /llms.txt file](https://llmstxt.org/) (proposta publicada em setembro de 2024).
