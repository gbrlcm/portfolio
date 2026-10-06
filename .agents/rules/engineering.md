---
trigger: glob
globs: "src/**, astro.config.mjs, package.json, tsconfig.json, wrangler.jsonc, pnpm-workspace.yaml"
description: Regras de engenharia para código Astro/Tailwind/TypeScript do portfólio — arquitetura, dependências e organização.
---

# Engenharia

## Arquitetura existente (respeitar)

- Rotas por arquivo em `src/pages/`. i18n nativo do Astro: `pt-BR` (default, sem prefixo), `/en`, `/es`. Ao criar página, criar as três versões ou justificar.
- Layouts: `BaseLayout.astro` (head, meta, fonts, `ClientRouter`) → `PageLayout.astro` (Navbar, `<main>`, Footer, QuickContact).
- Componentes `.astro` em `src/components/{global,sections,ui}`. Sem framework de UI (React/Vue etc.) — não adicionar sem necessidade real.
- Textos traduzíveis em `src/i18n/ui.ts` (`useTranslations`, `getLocalizedPath` em `src/i18n/utils.ts`). Dados estáveis em `src/data/*.ts` (contato, site).
- Não há content collections hoje. Se surgir conteúdo longo (cases/blog), preferir Content Collections do Astro com Markdown/MDX antes de qualquer CMS.
- Interatividade: `<script>` nativo dentro do componente, TypeScript tipado, compatível com `astro:page-load` (há View Transitions).
- Estilos: Tailwind v4 com tokens em `@theme` (`src/styles/styles.css`). Reutilizar tokens existentes; não criar cores soltas.
- Ícones: `astro-icon` com coleções `lucide` e `simple-icons` já instaladas.
- Imagens estáticas em `public/images` (WebP). Para novas imagens, considerar `astro:assets` quando trouxer ganho real de performance.

## Dependências

- Não instalar pacotes sem justificar: problema, alternativa sem dependência, custo (bundle, manutenção).
- Usar `pnpm` (nunca npm/yarn). Não editar `pnpm-lock.yaml` manualmente.
- Não adicionar adapter SSR; o build precisa continuar gerando `dist/` estático para Cloudflare Pages.

## Código

- TypeScript strict; tipar props com `interface Props`.
- Evitar abstrações prematuras: extrair componente apenas quando houver reuso real ou ganho claro de legibilidade.
- Não duplicar strings entre idiomas fora de `ui.ts`/`data`.
- Remover código morto apenas em tarefa específica para isso, nunca "de carona".
- Não alterar tecnologia (framework, CSS, package manager, deploy) sem pedido explícito.
