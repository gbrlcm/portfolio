---
name: content-strategy
description: >-
  Planeja a estratégia de conteúdo de Gabriel Campos — páginas institucionais, páginas de serviço,
  cases, projetos, blog e clusters temáticos (desenvolvimento de software, arquitetura, integrações,
  automação, backend, sistemas transacionais, problemas empresariais), priorizando profundidade,
  utilidade e potencial comercial/autoridade. Usar quando o usuário pedir plano editorial, ideias de
  conteúdo, estrutura de cases/blog ou novas páginas.
---

# Content Strategy

Planejamento, não redação em massa. Regras de referência: `.agents/rules/content.md` e `.agents/rules/seo.md`.

## Etapas

### 1. Levantar matéria-prima real

1. Ler o conteúdo atual (`src/i18n/ui.ts`, `src/data/*.ts`, `public/llms.txt`) e separar o que é fato do que é placeholder do template.
2. Fontes públicas: GitHub `gbrlcm` (repos, linguagens, READMEs), LinkedIn (se acessível). Citar URLs.
3. Montar lista de **perguntas ao Gabriel**: experiências, projetos que pode citar, clientes/setores autorizados, problemas que já resolveu, serviços que quer vender, público-alvo, região.
4. Sem resposta, o plano marca o item como dependente de informação — nunca preenche com suposição.

### 2. Definir pilares

Escolher 3–5 pilares que cruzem **o que o Gabriel faz de verdade** com **problemas que geram demanda**. Candidatos (validar com evidência): backend e APIs, integrações entre sistemas, automação de processos, sistemas transacionais, arquitetura e performance, sites rápidos para negócios.

### 3. Mapear tipos de página

| Tipo | Objetivo | Exemplo de função |
| --- | --- | --- |
| Institucional (home, sobre) | entidade e credibilidade | quem é, o que faz, como trabalha |
| Serviço | conversão | um serviço real por página, problema → abordagem → processo → CTA |
| Case | prova | estrutura de `content.md`, com resultado verificável |
| Projeto | demonstração técnica | repositório, decisões, stack |
| Artigo/blog | autoridade e aquisição | responde pergunta específica com experiência própria |

Para cada pilar: 1 página de serviço (se vendido) + cases/projetos de prova + poucos artigos de suporte que linkem para o serviço.

### 4. Priorizar

Pontuar cada ideia (1–3) em: potencial comercial, potencial de autoridade, evidência disponível, esforço. Priorizar alto comercial + evidência disponível. Preferir 5 peças excelentes a 30 rasas. Rejeitar: páginas por cidade em massa, artigos genéricos sem experiência própria, conteúdo só para palavra-chave.

### 5. Implementação técnica (proposta)

Se houver cases/blog, propor Astro Content Collections (Markdown/MDX em `src/content/`), com i18n e frontmatter tipado. Sem CMS externo, salvo justificativa.

### 6. Entrega

- Pilares com justificativa.
- Mapa de páginas (URL proposta, tipo, intenção, idioma, links internos, CTA).
- Backlog priorizado (tabela com scores).
- Brief de 1–3 peças prioritárias (objetivo, público, pergunta respondida, fontes/evidências necessárias, estrutura).
- Perguntas pendentes ao Gabriel.
