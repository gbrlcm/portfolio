---
title: "SEO em 2026: o que a documentação do Google realmente recomenda"
description: "SEO a partir da fonte primária: rastreamento, conteúdo útil, títulos, links, dados estruturados e os mitos que o próprio Google desmente na documentação."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/seo-o-que-o-google-recomenda.webp"
coverAlt: "Ilustração de uma barra de busca e três resultados, com o primeiro destacado em amarelo, ao lado do título SEO sem folclore"
category: "SEO e AI Search"
tags:
  - "SEO"
  - "SEO Técnico"
  - "Google Search"
  - "Conteúdo"
draft: false
---

SEO é provavelmente o assunto técnico com mais folclore na internet. Para cada recomendação útil circulam várias regras inventadas: densidade ideal de palavra-chave, número mínimo de palavras, ordem obrigatória de headings. Boa parte disso é desmentida, por escrito, pela própria documentação do Google.

Neste artigo uso o Google Search Central como fonte primária (consultado em outubro de 2026) para separar o que tem respaldo do que é crença. O foco é quem mantém um site institucional, um blog técnico ou um produto web e quer gastar tempo no que de fato faz diferença.

## O que é SEO, sem rodeios

SEO (Search Engine Optimization) é o trabalho de ajudar buscadores a encontrar, entender e exibir suas páginas, e de ajudar as pessoas a decidir, ainda na página de resultados, se vale a pena clicar.

Não é um truque aplicado no fim do projeto. É a combinação de uma base técnica (o buscador consegue acessar e interpretar a página?) com conteúdo que responde bem a uma necessidade real. Quando uma dessas partes falha, a outra não compensa.

## 1. Sem rastreamento e indexação, o resto não importa

Antes de discutir palavra-chave, confirme o básico: o Google consegue chegar até a página e decidiu indexá-la?

- **Verifique o índice.** Uma busca por `site:seudominio.com` dá uma visão rápida do que está indexado. Para uma URL específica, a Inspeção de URL do Search Console mostra como o Google vê a página.
- **Não bloqueie recursos.** Bloquear CSS ou JavaScript no `robots.txt` pode impedir que o Google entenda a página do jeito que o usuário a vê.
- **Publique um sitemap.** Ele não garante indexação, mas ajuda na descoberta, especialmente de páginas novas.
- **Resolva duplicidade.** Quando o mesmo conteúdo responde em mais de uma URL (com e sem barra final, com parâmetros de rastreamento, em HTTP e HTTPS), use redirecionamento ou `rel="canonical"` para indicar a versão preferida.

Um detalhe que confunde muita gente: `robots.txt` controla **rastreamento**, não **indexação**. Uma URL bloqueada ainda pode aparecer nos resultados, sem descrição, se outros sites apontarem para ela. Para manter uma página fora do índice, o caminho é `noindex`, e a página precisa continuar rastreável para que o Google consiga ler essa instrução.

```text
# robots.txt
User-agent: *
Disallow: /admin/

Sitemap: https://seudominio.com/sitemap.xml
```

```html
<!-- Na página que deve ficar fora do índice -->
<meta name="robots" content="noindex" />

<!-- Na versão duplicada, apontando para a preferida -->
<link rel="canonical" href="https://seudominio.com/blog/meu-artigo" />
```

## 2. Conteúdo útil vem antes de qualquer técnica

Na minha opinião, a página sobre conteúdo útil ("helpful, reliable, people-first content") é o texto mais importante do Search Central. Ela propõe perguntas de autoavaliação, entre elas:

- O conteúdo traz informação, pesquisa ou análise original?
- É o tipo de página que você salvaria nos favoritos ou indicaria para alguém?
- Foi escrito ou revisado por alguém que comprovadamente conhece o assunto?
- Tem erros factuais fáceis de verificar?

O Google também resume a avaliação em três perguntas. **Quem** criou o conteúdo (autoria clara, com assinatura onde o leitor espera encontrá-la). **Como** ele foi produzido (por exemplo, se houve testes reais ou uso relevante de automação). **Por que** ele existe. A última é a mais importante: o conteúdo deve existir principalmente para ajudar pessoas, não para atrair visitas de buscador.

Sobre E-E-A-T (experiência, especialidade, autoridade e confiabilidade), a documentação é direta: não é um fator de ranqueamento específico. Os sistemas usam uma mistura de sinais que tendem a identificar conteúdo com essas qualidades, e a confiabilidade é o aspecto mais importante. Temas que afetam saúde, finanças ou segurança (chamados de YMYL) recebem peso extra.

Os sinais de alerta listados pelo próprio Google ajudam a calibrar o que evitar:

- usar automação extensa para produzir conteúdo sobre muitos assuntos;
- escrever sobre tendências que você não cobriria para o seu público;
- alterar datas de publicação para parecer atualizado sem mudança real no conteúdo.

## 3. Título, snippet e URL

O título é o primeiro contato do usuário com a página nos resultados. A recomendação é simples: um `<title>` **único por página**, claro, conciso e que descreva com precisão o conteúdo.

A meta description nem sempre aparece. O snippet costuma vir do próprio conteúdo da página, e a description é usada quando descreve melhor o que o usuário procura. Ainda assim, vale escrever uma description curta, única e com os pontos mais relevantes.

Para URLs, palavras descritivas ajudam o usuário e podem aparecer como breadcrumb nos resultados. Já colocar palavra-chave no domínio ou no caminho, segundo a documentação, tem pouquíssimo efeito além de aparecer nesse breadcrumb.

```html
<title>Saga pattern: transações entre microsserviços sem 2PC</title>
<meta
  name="description"
  content="Como o padrão Saga mantém consistência entre serviços: coreografia, orquestração, compensações e outbox."
/>
```

## 4. Links internos com texto que descreve o destino

Links continuam sendo a principal forma de um buscador descobrir páginas e entender como elas se relacionam. Duas práticas resolvem a maior parte dos casos:

- **Texto âncora descritivo.** "Veja o guia de Core Web Vitals" informa muito mais do que "clique aqui", para pessoas e para buscadores.
- **Qualifique links que você não endossa.** Links em comentários e fóruns (conteúdo gerado por usuários) e links pagos devem levar `rel="ugc"`, `rel="sponsored"` ou `rel="nofollow"`.

Uma regra prática: toda página importante deve ser alcançável por links a partir de outras páginas do site, e não só pelo sitemap.

## 5. Experiência de página e Core Web Vitals

As Core Web Vitals medem a experiência com dados de campo: LCP (carregamento, bom até 2,5 s), INP (resposta a interações, bom até 200 ms) e CLS (estabilidade visual, bom até 0,1). O Google confirma que essas métricas são usadas pelos sistemas de ranqueamento.

O mesmo documento traz uma ressalva importante: a busca sempre tenta mostrar o conteúdo mais relevante, mesmo que a experiência de página seja ruim. Uma boa experiência ajuda quando existem muitas páginas igualmente úteis para a mesma busca. Ou seja: performance não salva conteúdo fraco, mas pode desempatar, e quase sempre melhora a conversão.

Escrevi um guia específico sobre como diagnosticar e corrigir essas métricas: [otimização de Core Web Vitals](/blog/otimizacao-core-web-vitals-performance).

## 6. Dados estruturados: descreva só o que está visível

Dados estruturados (geralmente em JSON-LD, com o vocabulário do schema.org) ajudam o buscador a entender entidades e podem habilitar resultados enriquecidos. Duas regras importam mais do que qualquer outra:

1. A marcação deve refletir o conteúdo visível. A diretriz do Google é literal: não marque conteúdo que o leitor não vê.
2. Marcação válida não garante resultado enriquecido. O Google decide se exibe ou não.

Também vale acompanhar mudanças. Em agosto de 2023, o Google passou a exibir resultados enriquecidos de FAQ apenas para sites governamentais e de saúde conhecidos e com autoridade, e restringiu os resultados de HowTo ao desktop. Adicionar `FAQPage` em toda página de blog, esperando ganhar espaço na página de resultados, deixou de fazer sentido para a maioria dos sites.

Este blog, por exemplo, publica `BlogPosting` e `BreadcrumbList` em cada artigo, apenas com dados que existem na página (título, autor, datas):

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "SEO em 2026: o que a documentação do Google realmente recomenda",
  "author": { "@type": "Person", "name": "Gabriel Campos" },
  "datePublished": "2026-10-29",
  "inLanguage": "pt-BR"
}
```

## 7. Mitos que a própria documentação desmente

| Crença comum | O que o Google documenta |
| :--- | :--- |
| A meta tag `keywords` ajuda a ranquear | O Google Search não usa a meta tag `keywords`. |
| Existe um número ideal de palavras | O tamanho do conteúdo, por si só, não importa para ranqueamento. Não há meta mágica. |
| Headings precisam seguir uma ordem rígida | Ordem e quantidade de headings não importam para o Google Search. Continuam importando para acessibilidade e leitura. |
| Conteúdo duplicado gera penalidade | Duplicidade é ineficiente, mas não causa ação manual. Copiar conteúdo de terceiros é outra história. |
| Palavra-chave no domínio dá vantagem | Tem pouquíssimo efeito além de aparecer no breadcrumb. |
| O TLD (.com, .dev, .io) influencia | Só importa para segmentação por país. Fora isso, o Google não se importa com o TLD. |
| E-E-A-T é um fator de ranqueamento | Perguntado diretamente na documentação, o Google responde que não. |

## 8. O que pode derrubar um site

As políticas de spam do Google descrevem práticas que podem rebaixar ou remover páginas dos resultados. Três delas aparecem com frequência hoje:

- **Keyword stuffing:** repetir termos de forma artificial para tentar manipular o ranqueamento.
- **Abuso de conteúdo em escala:** gerar muitas páginas com o objetivo principal de manipular ranqueamento, e não de ajudar usuários. A política vale independentemente de como o conteúdo foi produzido.
- **Abuso de reputação de site:** publicar conteúdo de terceiros em um domínio forte principalmente para aproveitar os sinais que esse domínio conquistou com o próprio conteúdo.

Sobre IA: a orientação publicada pelo Google em fevereiro de 2023 foca na qualidade do conteúdo, não na forma como ele é produzido. A documentação de conteúdo útil complementa o raciocínio: produzir grande volume com pouca supervisão é sinal de baixo esforço, e informar o uso de automação faz sentido quando o leitor naturalmente se perguntaria como aquele conteúdo foi feito.

## Checklist rápido

1. A página está indexada? (`site:` e Inspeção de URL)
2. CSS e JavaScript estão liberados no `robots.txt`?
3. Cada conteúdo tem uma única URL canônica?
4. O `<title>` é único e descreve a página?
5. A description é única e resume os pontos principais?
6. O conteúdo responde a uma pergunta real melhor que as alternativas?
7. Está claro quem escreveu, como e por quê?
8. Os links internos usam texto descritivo?
9. As Core Web Vitals estão na faixa "bom" nos dados de campo?
10. Os dados estruturados descrevem apenas o que está visível?

## Para continuar

SEO tradicional é a base para aparecer também em respostas geradas por IA. Em outros dois artigos detalho como estruturar páginas para [AEO (Answer Engine Optimization)](/blog/aeo-answer-engine-optimization) e o que a pesquisa diz sobre [GEO (Generative Engine Optimization)](/blog/geo-generative-engine-optimization).

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura.

- Google Search Central. [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).
- Google Search Central. [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
- Google Search Central. [Spam policies for Google web search](https://developers.google.com/search/docs/essentials/spam-policies).
- Google Search Central. [Introduction to robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro).
- Google Search Central. [Understanding page experience in Google Search results](https://developers.google.com/search/docs/appearance/page-experience).
- Google Search Central. [General structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).
- Google Search Central Blog. [Changes to HowTo and FAQ rich results](https://developers.google.com/search/blog/2023/08/howto-faq-changes) (agosto de 2023).
- Google Search Central Blog. [Google Search's guidance about AI-generated content](https://developers.google.com/search/blog/2023/02/google-search-and-ai-content) (fevereiro de 2023).
- web.dev. [Web Vitals](https://web.dev/articles/vitals).
