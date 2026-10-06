# gabrielcampos.dev — Invariantes do projeto

Documento central e sempre ativo. Detalhes operacionais ficam em `.agents/rules/`;
processos multietapa ficam em `.agents/skills/`. Em caso de conflito, este arquivo prevalece.

## Identidade

- **Gabriel Campos** é a marca principal (nome civil: Gabriel Lopes Campos — usar de forma consistente quando for necessário identificar a pessoa).
- Portfólio **pessoal/profissional**: https://gabrielcampos.dev · repo https://github.com/gbrlcm/portfolio.
- Objetivo: demonstrar capacidade técnica real e gerar oportunidades (desenvolvimento de software, consultoria técnica, projetos).
- **Não** posicionar como agência genérica / software house. Falar em primeira pessoa, autoridade pessoal.
- **Não mencionar Redstar Software** em nenhum arquivo, copy, metadata ou dado estruturado.

## Prioridades (em ordem)

1. Credibilidade
2. Clareza
3. Conversão
4. Aquisição orgânica
5. Descoberta por buscadores e sistemas de IA
6. Performance
7. Manutenção simples

## Princípios técnicos

- Preferir soluções simples; evitar overengineering e abstrações sem benefício claro.
- Evitar dependências desnecessárias; não introduzir ferramentas sem justificar o valor.
- Não trocar tecnologias por preferência pessoal; respeitar a arquitetura existente quando adequada.
- Preservar compatibilidade com **Cloudflare Pages** (site estático). **Não migrar o deploy.**
- Priorizar performance. Não adicionar CMS complexo sem necessidade real.

## Princípios de conteúdo

- **Nunca inventar**: clientes, métricas, resultados, números, cases, certificações, cargos, projetos, depoimentos.
- Diferenciar sempre: experiência profissional · projeto pessoal · case · experimento · estudo · opinião.
- Informação não confirmada vira pergunta ao Gabriel ou placeholder explícito (`TODO(gabriel): ...`), nunca fato.

## Princípios de marca

- Evitar: estética genérica de agência, aparência "AI-generated", neon, gradientes roxo/azul genéricos, glassmorphism excessivo, excesso de animação ou de elementos decorativos, copy genérica de software house.
- Buscar: profissional, técnico, premium, sóbrio, direto, moderno, rápido, confiável.

## Princípios de SEO e AI Search

- SEO serve ao usuário e ao negócio. Sem keyword stuffing, sem páginas em massa, sem conteúdo feito só para manipular ranking.
- Priorizar conteúdo útil, específico e verificável.
- AI Search (GEO/AEO) complementa o SEO tradicional, não o substitui.
- `llms.txt` é camada complementar/experimental de contexto e discovery — **não** é fator garantido de ranking.
- Não afirmar fatores de ranking sem evidência. Dados estruturados devem refletir fielmente o conteúdo visível e real.

## Processo de trabalho do agente

Antes de mudanças relevantes:

1. Entender o estado atual (ler código e conteúdo envolvidos).
2. Identificar impacto (páginas, idiomas, SEO, deploy).
3. Criar plano.
4. Validar premissas (com o Gabriel quando envolver fatos ou posicionamento).
5. Implementar em etapas pequenas.
6. Testar (ver `.agents/rules/quality.md`).
7. Verificar no browser quando houver mudança visível.
8. Relatar alterações, evidências e pendências.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
