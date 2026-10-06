---
trigger: glob
globs: "src/components/**, src/layouts/**, src/pages/**, src/styles/**"
description: Regras de design visual, responsividade, acessibilidade e performance visual para componentes, layouts e estilos.
---

# Design

## Direção visual

- Sóbrio, técnico, premium. Hierarquia clara > decoração.
- Proibido (ver `AGENTS.md`): neon, gradiente roxo/azul genérico, glassmorphism excessivo, blobs/partículas decorativas, ícones genéricos de "IA", animações chamativas.
- Paleta atual: tokens `task-*` em `src/styles/styles.css`. Usar tokens; propor mudança de paleta só em tarefa de design dedicada.
- Tipografia: no máximo 2 famílias em uso efetivo. Hoje são carregadas 4 (Anton, Archivo Black, Outfit, Plus Jakarta Sans) — não adicionar outras.

## Hierarquia e layout

- Um `<h1>` por página; seções com `<h2>` em ordem lógica.
- Cada seção deve ter um propósito claro e um próximo passo óbvio.
- Mobile-first. Testar 360px, 768px, 1280px+. Sem scroll horizontal.

## Acessibilidade (mínimo)

- Contraste WCAG AA (4.5:1 texto, 3:1 texto grande/UI).
- Elementos interativos são `<a>`/`<button>` reais, com foco visível e área de toque ≥ 44px.
- `alt` descritivo em imagens de conteúdo; `alt=""` em decorativas. `aria-label` em botões só com ícone.
- Respeitar `prefers-reduced-motion` em qualquer animação.
- Carrosséis/sliders: navegáveis por teclado e sem autoplay agressivo.

## Performance visual

- Imagens com `width`/`height` (evitar CLS), `loading="lazy"` abaixo da dobra, WebP/AVIF.
- Hero sem imagem pesada bloqueando LCP. Evitar JS para efeitos puramente decorativos.
- Animações apenas com `transform`/`opacity`.
