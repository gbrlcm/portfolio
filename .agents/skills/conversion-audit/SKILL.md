---
name: conversion-audit
description: >-
  Avalia o gabrielcampos.dev como canal de aquisição — hero, proposta de valor, CTAs, WhatsApp,
  e-mail, contato, prova social, cases, credibilidade, objeções, FAQ, jornada, landing pages,
  Google Ads, conversão mobile, fricção e sinais de confiança — separando descoberta, consideração,
  decisão e contato. Usar quando o usuário pedir análise de conversão, CRO, leads, CTA ou landing page.
---

# Conversion Audit

Somente diagnóstico, salvo pedido explícito. Proibido recomendar dark patterns: urgência/escassez falsa, contadores fictícios, prova social inventada, pop-ups intrusivos, confirmshaming, opt-out escondido.

## Etapas

### 1. Mapear o funil real

1. Abrir o site no browser (produção) em mobile (~360px) primeiro, depois desktop.
2. Registrar cada CTA: texto, destino, posição, idioma. Fontes no código: `src/data/contact.ts` (WhatsApp, Telegram, e-mails), `QuickContact.astro`, `Navbar.astro`, `Footer.astro`, seções em `src/pages/*`.
3. Testar cada link de contato (WhatsApp com mensagem pré-preenchida por idioma, `mailto:`, Telegram, âncoras `#...`). Registrar quebrados.
4. Verificar se existe medição de conversão (eventos/analytics). Se não houver, apontar como lacuna e sugerir opção leve compatível com Cloudflare Pages (ex.: Cloudflare Web Analytics), justificando.

### 2. Avaliar por etapa

| Etapa | Perguntas-chave |
| --- | --- |
| Descoberta | Em 5 s fica claro quem é o Gabriel, o que faz e para quem? A mensagem bate com a origem (busca, LinkedIn, Ads)? |
| Consideração | Há prova real (cases, projetos, experiência, GitHub)? Serviços são concretos? Processo e forma de trabalho estão claros? |
| Decisão | Objeções respondidas (prazo, preço/modelo, comunicação, manutenção, confiança)? FAQ real? Sinais de confiança verificáveis? |
| Contato | CTA principal único e visível? Fricção mínima? Expectativa clara (tempo de resposta real, próximo passo)? Funciona bem no mobile? |

### 3. Credibilidade

- Identificar qualquer prova social não verificável (métricas, depoimentos, logos) — no estado atual, o template contém placeholders. Classificar como **P0**: remove credibilidade.
- Propor substitutos honestos: projetos reais, trechos de código/repos, experiência descrita, comunidade, depoimentos reais quando houver.

### 4. Landing pages e Google Ads

- Avaliar se há página específica por oferta. Para Ads: alinhamento anúncio↔página, CTA único, velocidade, mensuração de conversão (WhatsApp/e-mail como eventos), política de qualidade. Não criar landing pages sem oferta real definida.

### 5. Entrega

Formato de achado da skill `portfolio-audit`, agrupado por etapa do funil. Incluir: hipótese de melhoria, como medir, e dependências de informação do Gabriel. Separar quick wins (copy/CTA) de mudanças estruturais (novas páginas, cases).
