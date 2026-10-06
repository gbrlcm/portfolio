---
name: ai-search
description: >-
  Avalia e planeja a otimização do gabrielcampos.dev para descoberta, compreensão e citação por
  buscas baseadas em IA e LLMs (GEO/AEO) — entidade e consistência de nome (Gabriel Lopes /
  Gabriel Campos), dados estruturados, conteúdo factual, páginas de autoridade, llms.txt e
  superfícies de AI Search. Usar quando o usuário mencionar AI Search, GEO, AEO, LLMs, ChatGPT,
  Perplexity, AI Overviews ou llms.txt.
---

# AI Search (GEO/AEO)

Premissa: os fundamentos que ajudam usuários e buscadores tradicionais são a base. `llms.txt` é complementar e experimental — **não** afirmar que melhora ranking ou citação. Não afirmar como sistemas de IA ranqueiam sem fonte citada.

## Etapas

### 1. Entidade e identidade

1. Levantar todas as formas de nome usadas: site, `public/llms.txt`, `public/humans.txt`, GitHub `gbrlcm`, LinkedIn `gabriel-lopes-campos`, X. Registrar divergências.
2. Recomendar uma forma canônica (ex.: "Gabriel Campos" como marca, "Gabriel Lopes Campos" como nome completo) e onde explicitá-la (página Sobre, JSON-LD `Person.name`/`alternateName`).
3. Verificar `sameAs` consistentes entre site e perfis (links recíprocos: perfis devem apontar para o site).
4. Confirmar que nada cita Redstar Software.

### 2. Compreensibilidade da página

- Quem é, o que faz, para quem, onde atua — em texto HTML (não só imagem), perto do topo.
- Fatos verificáveis e específicos (stack, tipos de sistema, experiência) com fonte.
- Seções que respondem perguntas reais de clientes, de forma direta (bom para FAQ visível e AEO).
- Conteúdo renderizado no HTML estático (Astro já garante; checar que nada essencial depende de JS).

### 3. Dados estruturados

Propor JSON-LD mínimo e fiel: `Person`, `WebSite`, e `Service`/`ProfessionalService`/`FAQPage` apenas se houver conteúdo visível correspondente. Validar em validator.schema.org.

### 4. llms.txt

1. Ler `public/llms.txt` atual; comparar com o site e com a especificação proposta em https://llmstxt.org (citar data de consulta).
2. Recomendar conteúdo factual: resumo, serviços reais, links para páginas-chave (sobre, serviços, cases, contato) em Markdown.
3. Rotular explicitamente como medida de baixo custo e efeito incerto.

### 5. Autoridade externa e citações

- Mapear menções verificáveis (GitHub, comunidade, palestras, artigos). Sugerir onde construir presença real; nunca sugerir criar citações artificiais.

### 6. Superfícies e teste

- Pesquisar (com fonte) quais superfícies são relevantes no momento (ex.: Google AI Overviews/AI Mode, ChatGPT search, Perplexity, Bing Copilot) e como cada uma documenta rastreio (ex.: user-agents como `OAI-SearchBot`, `PerplexityBot`, `Google-Extended`). Verificar `robots.txt` contra isso.
- Teste manual opcional: perguntar a esses sistemas "Quem é Gabriel Campos desenvolvedor?" e registrar resposta e data como baseline — qualitativo, não métrica.

### 7. Entrega

Formato de achado da skill `portfolio-audit`, separando: fundamentos (alto valor, também SEO) vs. medidas experimentais (llms.txt, testes em LLMs).
