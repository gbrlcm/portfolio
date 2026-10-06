---
name: portfolio-audit
description: >-
  Executa uma auditoria estratégica completa do portfólio gabrielcampos.dev (código, arquitetura,
  páginas, UX, copy, posicionamento, SEO, performance, acessibilidade, conversão, cases, SEO local,
  Google Ads, AI Search e estrutura de aquisição) e entrega diagnóstico + plano priorizado, sem
  modificar o projeto. Usar quando o usuário pedir auditoria geral, diagnóstico, revisão estratégica
  ou "o que melhorar" no portfólio.
---

# Portfolio Audit

Auditoria somente-leitura. **Não editar arquivos do projeto.** O resultado é um relatório e um plano.
Respeitar `AGENTS.md` e `.agents/rules/*` (ler `content.md`, `seo.md`, `design.md`, `quality.md` mesmo que não estejam ativas).

## Etapas

### 1. Coleta (estado atual)

1. Inventário do repo: `git log --oneline -n 20`, árvore de `src/` e `public/`, `package.json`, `astro.config.mjs`.
2. Ler `src/pages/**`, `src/layouts/**`, `src/i18n/ui.ts`, `src/data/*.ts`, `public/{robots.txt,sitemap.xml,llms.txt,humans.txt,manifest.json}`.
3. Mapear componentes usados vs. não usados (grep de imports).
4. `pnpm check` e `pnpm build`; inspecionar `dist/index.html`, `dist/en/index.html`, `dist/es/index.html` (head, headings, links, imagens, JSON-LD).
5. Browser: abrir `https://gabrielcampos.dev` (produção) e, se útil, `astro dev --background`. Capturar mobile (~360px) e desktop (~1280px). Anotar console, CLS visível, navegação, CTAs.
6. Performance: rodar PageSpeed Insights/Lighthouse na URL de produção quando possível; citar a fonte e data. Sem ferramenta disponível → marcar "não medido".
7. Pesquisa externa quando necessário (concorrência de portfólios de devs/consultores no Brasil, SERP de termos de serviço, documentação Google Search Central). Sempre citar URL.

### 2. Análise por área

Cobrir cada área abaixo. Para detalhes, aplicar as skills especializadas como checklists:
`seo-audit` (SEO técnico/estratégico/local), `conversion-audit` (CRO, CTA, jornada, Ads),
`ai-search` (entidade, llms.txt, GEO/AEO), `content-strategy` (lacunas de conteúdo e cases).

- Código e arquitetura (simplicidade, código morto, compatibilidade Cloudflare Pages)
- Páginas e arquitetura de informação
- UX e design (vs. `design.md`)
- Copy e posicionamento (pessoa vs. agência; placeholders do template; Redstar)
- Cases e prova (o que existe, o que é verificável)
- SEO, SEO local, AI Search
- Performance e acessibilidade
- Conversão e estrutura de aquisição (orgânico, indicação, LinkedIn/GitHub, Ads)

### 3. Formato obrigatório de cada achado

| Campo | Conteúdo |
| --- | --- |
| Área | ex.: SEO técnico |
| Estado atual | o que existe, com evidência (arquivo:linha, URL, screenshot, saída de comando) |
| Problema | por que é ruim — ou "nenhum" |
| Oportunidade | o que se ganha |
| Recomendação | ação concreta |
| Impacto | alto/médio/baixo + em qual prioridade do `AGENTS.md` |
| Esforço | P/M/G |
| Prioridade | P0 (bloqueia credibilidade) · P1 · P2 · P3 |
| Implementação | arquivos afetados e passos; dependências de informação do Gabriel |

Separar fato (observado) de inferência (hipótese) e de opinião. Nunca inventar métricas.

### 4. Entrega

Salvar o relatório em Markdown no diretório de artefatos da conversa (não no repo), contendo:

1. Resumo executivo (≤10 linhas).
2. Tabela de achados ordenada por prioridade.
3. Plano em fases (ex.: Fase 0 limpeza de placeholders/fatos falsos → Fase 1 identidade e conversão → Fase 2 SEO técnico → Fase 3 conteúdo/cases → Fase 4 aquisição).
4. Perguntas para o Gabriel (informações factuais necessárias: experiências, clientes autorizados, cases, cidade de atuação, serviços que quer vender).
5. O que não foi verificado e por quê.

Encerrar pedindo aprovação antes de qualquer implementação.
