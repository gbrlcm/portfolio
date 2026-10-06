---
trigger: model_decision
description: Aplicar ao validar, testar ou concluir qualquer alteração de código, conteúdo ou configuração — define comandos de verificação e critérios de pronto.
---

# Qualidade e validação

## Comandos reais (package.json)

| Objetivo | Comando |
| --- | --- |
| Typecheck + diagnósticos Astro | `pnpm check` (alias `pnpm typecheck` → `astro check`) |
| Build de produção | `pnpm build` (gera `dist/`) |
| Preview do build | `pnpm preview` |
| Dev server | `astro dev --background` (gerenciar com `astro dev status/logs/stop`) |

Não existem lint, formatter nem testes automatizados configurados. Não adicioná-los sem pedido; compensar com revisão manual e verificação no browser.

## Antes de declarar pronto

1. `pnpm check` sem erros novos.
2. `pnpm build` passa.
3. Mudança visível → verificar no browser (dev ou preview) em mobile (~360px) e desktop (~1280px), nas três rotas de idioma afetadas (`/`, `/en`, `/es`).
4. Console do browser sem erros novos; navegação via View Transitions continua funcionando (scripts re-inicializam em `astro:page-load`).
5. Acessibilidade básica: navegação por teclado, foco visível, contraste, `alt`.
6. SEO quando aplicável: inspecionar `dist/**/index.html` (title, description, canonical, og, hreflang, JSON-LD).
7. Revisar `git diff`: só arquivos esperados, sem mudanças acidentais, sem placeholders/fatos não confirmados, sem menção a Redstar Software.

Compilar não é o mesmo que estar pronto: a tarefa só está concluída quando o comportamento foi verificado.

## Relato

Informar comandos executados e resultado, o que foi verificado no browser, o que não pôde ser verificado e pendências (`TODO(gabriel)`).
