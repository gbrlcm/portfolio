---
name: seo-audit
description: >-
  Realiza auditoria técnica e estratégica de SEO do gabrielcampos.dev (robots, sitemap, canonical,
  metadata, Open Graph, headings, HTML semântico, links internos, indexabilidade, imagens,
  schema.org, Core Web Vitals, páginas de serviço, arquitetura de informação, SEO local e intenção
  de busca). Usar quando o usuário pedir revisão de SEO, indexação, metadata ou dados estruturados.
---

# SEO Audit

Somente diagnóstico, salvo pedido explícito de implementação. Regras de referência: `.agents/rules/seo.md`.

## Etapas

### 1. Gerar artefato de análise

1. `pnpm build`.
2. Listar páginas: `find dist -name 'index.html'`.
3. Para cada página extrair: `<html lang>`, `<title>`, meta description, canonical, robots, `og:*`, `twitter:*`, `hreflang`, headings (h1–h3), links internos/externos, imagens (`src`, `alt`, `width/height`, `loading`), blocos `application/ld+json`. Um `grep`/script pontual é suficiente; não adicionar dependências.

### 2. Checklist técnico

- [ ] `public/robots.txt`: permite rastreio, aponta sitemap correto, não bloqueia assets.
- [ ] `public/sitemap.xml`: só URLs existentes e canônicas; inclui `/en` e `/es` se indexáveis; sem `priority/changefreq` irrelevantes.
- [ ] Canonical absoluto, autorreferente, consistente com/sem barra final (conferir comportamento real no Cloudflare Pages via `curl -I`).
- [ ] Títulos/descriptions únicos por página e idioma, refletindo o Gabriel (não o template).
- [ ] `og:image` absoluto, 1200×630, existente; `twitter:card` coerente.
- [ ] `hreflang` recíproco + `x-default`.
- [ ] Um h1 por página; hierarquia sem saltos; HTML semântico.
- [ ] Links internos descritivos; nenhuma página órfã; âncoras do menu funcionam em todos os idiomas.
- [ ] Imagens: alt, dimensões, lazy abaixo da dobra, formato moderno.
- [ ] JSON-LD: existe? Representa fatos visíveis? Valida em validator.schema.org / Rich Results Test?
- [ ] Produção: `curl -sI https://gabrielcampos.dev/` (status, redirects, headers), 404 real para rota inexistente, `www`→apex.
- [ ] Core Web Vitals: PageSpeed Insights (campo CrUX se houver, senão lab). Citar data e fonte.
- [ ] Indexação real: `site:gabrielcampos.dev` (pesquisa externa) e, se o Gabriel tiver acesso, Search Console.

### 3. Estratégia

- Arquitetura de informação: quais páginas existem vs. quais intenções de busca o negócio precisa atender (serviços, sobre, cases, contato).
- Páginas de serviço: uma por serviço realmente oferecido, com intenção clara. Não criar variações artificiais.
- SEO local: só com localização confirmada; avaliar Google Business Profile e consistência de NAP.
- Palavras-chave: propor temas e intenções. **Não inventar volume/dificuldade**; se necessário, pesquisar com fonte externa citada ou marcar como "a validar com ferramenta (ex.: Google Keyword Planner)".

### 4. Entrega

Usar o formato de achado da skill `portfolio-audit` (estado atual → problema → oportunidade → recomendação → impacto → prioridade → implementação), com evidência para cada item. Separar quick wins técnicos de mudanças estratégicas.
