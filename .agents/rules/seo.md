---
trigger: model_decision
description: Aplicar ao mexer em metadata, head, rotas, sitemap, robots, llms.txt, dados estruturados, headings, links internos, páginas de serviço/landing, SEO local, Google Ads ou AI Search.
---

# SEO (regras práticas)

## Técnico

- Toda página indexável: `<title>` único (~50–60 caracteres), `meta description` única (~140–160), canonical absoluto, `og:*` e `twitter:*` coerentes. Metadata vem via props do `BaseLayout`.
- `og:image` deve ser URL absoluta (ex.: `new URL(image, Astro.site)`).
- i18n: páginas traduzidas precisam de `hreflang` recíproco (`pt-BR`, `en`, `es`, `x-default`) e `<html lang>` correto.
- `public/sitemap.xml` é estático: ao criar/remover rota, manter sincronizado ou propor `@astrojs/sitemap` (justificar a dependência). Nunca listar URLs inexistentes.
- `robots.txt` não bloqueia CSS/JS/imagens. `noindex` (prop `noIndex`) só para páginas sem valor de busca.
- URLs curtas, minúsculas, com hífens, no idioma da página. Mudou URL publicada → redirect 301 (`public/_redirects` do Cloudflare Pages).

## Estrutura

- Um `<h1>` alinhado à intenção da página; headings não pulam níveis.
- HTML semântico (`header`, `nav`, `main`, `section`, `article`, `footer`).
- Links internos com texto descritivo; toda página indexável alcançável por link a partir da home.
- Imagens de conteúdo com `alt` descritivo e nome de arquivo significativo.

## Dados estruturados

- JSON-LD apenas com fatos visíveis na página. Base provável: `Person` (Gabriel Campos, `sameAs` GitHub/LinkedIn/X), `WebSite`, `ProfessionalService`/`Service` só se houver página real do serviço, `FAQPage` só com FAQ real visível.
- Nunca `Review`/`AggregateRating` sem avaliações reais. Validar no Rich Results Test / validator.schema.org.

## Conteúdo e intenção

- Uma intenção principal por página. Sem keyword stuffing, sem páginas-porta, sem gerar páginas por cidade/variação em massa.
- Volume/dificuldade de palavra-chave só com fonte externa atual citada. Nunca estimar de cabeça.

## SEO local e Google Ads

- SEO local só com dados reais (cidade/região de atuação confirmada pelo Gabriel). NAP consistente com Google Business Profile, se existir.
- Landing pages para Ads: mensagem alinhada ao anúncio, CTA único, carregamento rápido, `noindex` se forem variações duplicadas. Não prometer o que a página não entrega.

## AI Search (GEO/AEO)

- Mesmos fundamentos: entidade clara (quem é, o que faz, onde, links `sameAs`), respostas diretas a perguntas reais, fatos verificáveis.
- `public/llms.txt`: resumo factual e atualizado; experimental, não é fator de ranking. Manter coerente com o site.
- Não afirmar fator de ranking (Google ou LLM) sem fonte.
