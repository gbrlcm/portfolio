---
trigger: always_on
description: Fatos operacionais do projeto gabrielcampos.dev — stack, deploy, restrições e estado atual conhecido do repositório.
---

# Projeto — contexto operacional

Invariantes de identidade/objetivos estão em `AGENTS.md`. Aqui ficam os fatos concretos do repositório.

## Stack e deploy (verificado no repo)

- Astro 7 (output estático, sem adapter SSR) + Tailwind CSS v4 via `@tailwindcss/vite` + `astro-icon` (Iconify: `lucide`, `simple-icons`).
- TypeScript strict (`astro/tsconfigs/strict`). Package manager: **pnpm** (`pnpm-lock.yaml`, `pnpm-workspace.yaml`). Node `>=22.12.0`.
- Deploy: **Cloudflare Pages**. `wrangler.jsonc` publica `./dist` como assets estáticos. Não migrar o deploy, não adicionar adapter/SSR/Functions sem necessidade comprovada e aprovação.
- `site: https://gabrielcampos.dev` em `astro.config.mjs`.

## Restrições empresariais

- Site pessoal de Gabriel Campos. Nada de linguagem "nós/nossa equipe" de agência.
- Redstar Software não deve aparecer em lugar nenhum (inclusive `public/llms.txt`, `public/humans.txt`, JSON-LD, meta).
- Contato real disponível em `src/data/contact.ts` (WhatsApp, Telegram, e-mails por idioma, redes). Não inventar outros canais.

## Estado atual conhecido (snapshot — revalidar antes de agir)

O site foi construído a partir de um template ("TaskAI"). Grande parte da copy ainda é placeholder e **não representa fatos sobre o Gabriel**:

- `src/i18n/ui.ts`: meta "TaskAI", métricas fictícias (ex.: "1,9M+ usuários", "4,9"), depoimentos fictícios ("John D."), FAQ e serviços de "Assistente IA".
- `src/layouts/BaseLayout.astro`: title/description default do template.
- `public/llms.txt` e `public/humans.txt`: citam Redstar Software (pendente remover).
- `public/sitemap.xml`: estático e lista `/projetos` e `/contato`, que não existem.
- Componentes/dados possivelmente sem uso: `sections/Process`, `Contact`, `Budget`, `ui/CarouselView`, `global/Header`, `data/nav.ts`.

Nunca reaproveite esses placeholders como prova social ou fato. Trate-os como itens de auditoria.

## Simplicidade

- Uma mudança por objetivo. Sem reescritas amplas sem plano aprovado.
- Antes de qualquer feature nova, confirmar se resolve um problema das prioridades do `AGENTS.md`.
