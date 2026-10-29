---
title: "Design system: quando vale a pena e como começar pequeno"
description: "O que é um design system de verdade, quando ele se paga, como usar design tokens (especificação W3C 2025.10) e como começar sem transformar tudo em burocracia."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/design-system-como-comecar.webp"
coverAlt: "Ilustração de quatro design tokens de cor aplicados a um componente de cartão com um botão Confirmar em amarelo"
category: "Frontend"
tags:
  - "Design System"
  - "Frontend"
  - "Design Tokens"
  - "Acessibilidade"
draft: false
lang: "pt-BR"
---

"Design system" virou um termo tão amplo que pode significar desde um arquivo no Figma com as cores da marca até uma equipe dedicada mantendo componentes para dezenas de produtos. Essa ambiguidade faz muita empresa começar pelo lugar errado: investir meses em uma biblioteca completa antes de saber quais problemas ela precisa resolver.

Neste artigo explico o que compõe um design system, quando ele se paga, como funcionam os design tokens (que ganharam uma especificação estável em 2025) e um caminho para começar pequeno.

## O que é um design system

Um design system é o conjunto de decisões, componentes e regras que permite construir interfaces consistentes de forma repetível. Ele costuma reunir:

- **Princípios:** o que a interface prioriza (clareza, densidade, acessibilidade).
- **Design tokens:** as decisões visuais básicas (cores, tipografia, espaçamento, raios, sombras) registradas como dados.
- **Componentes:** botões, campos, modais, tabelas, implementados em código e no design.
- **Padrões:** como os componentes se combinam para resolver problemas recorrentes (formulários, estados vazios, mensagens de erro).
- **Documentação:** quando usar, quando não usar, exemplos e requisitos de acessibilidade.
- **Governança:** quem decide, como se contribui, como se versiona.

É comum confundir o design system com partes dele:

| Termo | O que é | O que falta para ser um design system |
| :--- | :--- | :--- |
| **Guia de estilo** | Regras visuais e de marca | Componentes e código |
| **UI kit** | Componentes desenhados em uma ferramenta de design | Implementação em código e documentação de uso |
| **Biblioteca de componentes** | Componentes implementados em código | Princípios, padrões e governança |
| **Design system** | Tudo isso, mantido como produto | (nada) |

## Um produto que atende outros produtos

Em 2016, Nathan Curtis publicou um texto cujo título virou definição: *A Design System isn't a Project. It's a Product, Serving Products*. A ideia é que um design system não termina na entrega. Ele tem usuários (os times de produto), precisa de roadmap, suporte, versionamento e comunicação, e só tem valor se for adotado.

Essa mudança de perspectiva responde a pergunta mais importante: o design system está resolvendo um problema real dos times que vão usá-lo?

## Quando vale a pena (e quando não)

Na minha opinião, os sinais de que um design system se paga são:

- vários produtos ou vários times construindo interfaces em paralelo;
- o mesmo componente reimplementado várias vezes, com pequenas diferenças;
- inconsistências visuais e de comportamento percebidas por usuários;
- dificuldade para aplicar mudanças de marca ou de tema em todo o produto;
- problemas de acessibilidade se repetindo em telas diferentes.

E os sinais de que ainda não é a hora:

- um único produto pequeno, mantido por poucas pessoas;
- produto em fase de descoberta, com a interface mudando toda semana;
- nenhum responsável disponível para manter o sistema depois da primeira versão.

No segundo caso, o melhor investimento costuma ser só a camada de tokens e meia dúzia de componentes bem feitos. Um design system abandonado é pior do que nenhum, porque cria uma segunda fonte de verdade desatualizada.

## Design tokens: decisões como dados

Design tokens são as decisões visuais registradas em um formato independente de plataforma. O anúncio do W3C Design Tokens Community Group os descreve como a fonte única da verdade para cores, tipografia, espaçamento e outras decisões de design.

Em 28 de outubro de 2025, o grupo publicou a primeira versão estável da especificação, a **2025.10**. Ela inclui suporte a temas e múltiplas marcas, espaços de cor modernos (como Display P3 e Oklch) e relações entre tokens (aliases e referências). Ferramentas como Style Dictionary, Tokens Studio e Terrazzo aparecem como implementações de referência. Um detalhe de contexto: trata-se de um relatório de um Community Group do W3C, não de um padrão W3C formal.

### Três níveis de token

Uma organização que funciona bem na prática separa os tokens em níveis:

1. **Primitivos:** os valores brutos da paleta (`verde-900`, `amarelo-300`, `espaco-4`).
2. **Semânticos:** a intenção de uso (`cor-fundo`, `cor-texto-principal`, `cor-acao`). Apontam para primitivos.
3. **De componente** (opcional): decisões específicas (`botao-primario-fundo`). Apontam para semânticos.

Componentes devem usar tokens semânticos. Assim, trocar o tema ou a marca exige mudar só o mapeamento, não cada componente.

### Exemplo no formato da especificação

Na versão 2025.10, cores são objetos com espaço de cor e componentes (o `hex` é opcional), dimensões são objetos com valor e unidade, e referências usam chaves com o caminho do token:

```json
{
  "cor": {
    "verde-900": {
      "$type": "color",
      "$value": { "colorSpace": "srgb", "components": [0.051, 0.145, 0.102], "hex": "#0d251a" }
    },
    "amarelo-300": {
      "$type": "color",
      "$value": { "colorSpace": "srgb", "components": [0.965, 0.929, 0.357], "hex": "#f6ed5b" }
    }
  },
  "semantico": {
    "texto-principal": { "$type": "color", "$value": "{cor.verde-900}" },
    "acao": { "$type": "color", "$value": "{cor.amarelo-300}" }
  },
  "espaco": {
    "4": { "$type": "dimension", "$value": { "value": 1, "unit": "rem" } }
  }
}
```

Uma ferramenta de transformação gera, a partir desse arquivo, variáveis CSS para a web e constantes para iOS e Android. No CSS, o resultado é algo assim:

```css
:root {
  --cor-verde-900: #0d251a;
  --cor-amarelo-300: #f6ed5b;
  --texto-principal: var(--cor-verde-900);
  --acao: var(--cor-amarelo-300);
  --espaco-4: 1rem;
}
```

Projetos menores nem precisam de pipeline de transformação. Este site, por exemplo, define seus tokens de cor e tipografia diretamente no bloco `@theme` do Tailwind CSS v4 (as duas cores do exemplo acima são as dele), que já os expõe como variáveis CSS e como classes utilitárias.

## Componentes: atomic design como modelo mental

Brad Frost propôs, no livro *Atomic Design* (2016), uma forma de pensar interfaces em cinco níveis:

1. **Átomos:** os blocos básicos (rótulo, campo, botão).
2. **Moléculas:** grupos simples de elementos que funcionam como uma unidade (campo de busca com botão).
3. **Organismos:** componentes mais complexos, compostos de moléculas e átomos (cabeçalho com navegação e busca).
4. **Templates:** a estrutura de uma página, com os componentes posicionados.
5. **Páginas:** templates preenchidos com conteúdo real.

O próprio autor ressalta que não é um processo linear. É um modelo mental para enxergar a interface ao mesmo tempo como um todo e como um conjunto de partes.

### A API do componente importa tanto quanto o visual

Um bom componente tem poucas propriedades, nomes previsíveis e estados explícitos. Um exemplo de contrato para um botão:

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  // Obrigatório quando o botão tiver só ícone, para leitores de tela.
  ariaLabel?: string;
}
```

Evite propriedades que permitem qualquer coisa, como `color` ou `style` livres. Cada escape facilita o caso pontual e enfraquece a consistência do sistema.

## Acessibilidade embutida, não opcional

Um dos maiores ganhos de um design system é resolver acessibilidade uma vez e herdá-la em todas as telas: contraste mínimo de 4,5:1 para texto normal (WCAG AA), foco visível, navegação por teclado, rótulos acessíveis, área de toque adequada e respeito a `prefers-reduced-motion`. Se o componente base acerta, cada tela nova já nasce acessível.

O mesmo raciocínio vale para performance. Um componente de imagem que sempre declara largura e altura evita deslocamento de layout (CLS) em todas as telas que o usam. Detalho essa e outras métricas no guia de [otimização de Core Web Vitals](/blog/otimizacao-core-web-vitals-performance).

## Documentação: aprenda com sistemas públicos

Bons exemplos de documentação pública para estudar:

- **[GOV.UK Design System](https://design-system.service.gov.uk/):** componentes e padrões com pesquisa de uso por trás de cada decisão.
- **[Material Design 3](https://m3.material.io/):** tokens, componentes e diretrizes do Google.
- **[Carbon Design System](https://carbondesignsystem.com/):** o sistema da IBM, muito completo em padrões para aplicações de dados.

Para cada componente, a documentação deveria responder: para que serve, quando usar, quando não usar, quais variações existem, exemplos de código e requisitos de acessibilidade.

## Como começar pequeno

Um caminho que considero realista para um time pequeno:

1. **Faça um inventário.** Tire prints de todos os botões, campos, cores e tamanhos de fonte do produto atual. Brad Frost chama isso de inventário de interface, e o resultado costuma ser revelador.
2. **Defina os tokens primeiro.** Paleta primitiva, tokens semânticos, escala de espaçamento e tipografia.
3. **Construa os componentes mais usados.** Botão, campo de texto, select, checkbox, modal e mensagem de alerta resolvem boa parte das telas.
4. **Documente junto com o código.** Uma página por componente, mesmo que simples.
5. **Migre telas aos poucos.** Comece pelas que mudam com mais frequência.
6. **Versione e comunique.** Versionamento semântico e changelog, para que os times saibam o que mudou.

## Erros comuns

- Construir a biblioteca inteira antes de ter um produto usando.
- Copiar o design system de uma big tech sem ter os mesmos problemas.
- Tokens nomeados por valor (`azul-claro`) usados direto nos componentes, em vez de nomes semânticos.
- Nenhum responsável depois do lançamento.
- Componentes tão flexíveis que deixam de garantir consistência.

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura.

- Design Tokens Community Group (W3C). [Design Tokens specification reaches first stable version](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/) (outubro de 2025).
- Design Tokens Community Group. [Design Tokens Technical Reports 2025.10](https://www.designtokens.org/tr/2025.10/) e [Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/).
- Brad Frost. [Atomic Design, capítulo 2](https://atomicdesign.bradfrost.com/chapter-2/) (2016).
- Nathan Curtis. [A Design System isn't a Project. It's a Product, Serving Products](https://medium.com/eightshapes-llc/a-design-system-isn-t-a-project-it-s-a-product-serving-products-74dcfffef935) (fevereiro de 2016).
- W3C. [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/).
