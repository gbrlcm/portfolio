# Gabriel Campos — Portfolio

Repositório oficial do portfólio profissional de Gabriel Campos, acessível em [gabrielcampos.dev](https://gabrielcampos.dev). Desenvolvido com Astro e Tailwind CSS, focado em performance, entrega estática e suporte multilíngue.

## Sobre

Portfólio profissional de Gabriel Campos, estruturado para apresentar trajetória técnica, serviços, projetos e competências em engenharia de software e desenvolvimento de sistemas.

O repositório prioriza uma arquitetura estática leve, rápida e de fácil manutenção, servida globalmente através da infraestrutura de borda da Cloudflare.

## Stack

| Categoria | Tecnologia | Versão / Detalhes |
| :--- | :--- | :--- |
| **Framework** | [Astro](https://astro.build/) | `^7.3.5` (modo de saída estático) |
| **Linguagem** | [TypeScript](https://www.typescriptlang.org/) | `^5.9.3` (configuração estrita) |
| **Estilização** | [Tailwind CSS](https://tailwindcss.com/) | `^4.3.3` (via `@tailwindcss/vite`) |
| **Ícones** | [Astro Icon](https://github.com/natemoo-re/astro-icon) | `^1.2.0` (Iconify Lucide e Simple Icons) |
| **Package Manager** | [pnpm](https://pnpm.io/) | Baseado em `pnpm-lock.yaml` |
| **Runtime** | [Node.js](https://nodejs.org/) | `>=22.12.0` |
| **Hospedagem / Deploy** | [Cloudflare Pages](https://pages.cloudflare.com/) | Configurado via `wrangler.jsonc` |

## Estrutura do projeto

```text
portfolio/
├── public/                 # Assets estáticos servidos diretamente na raiz
│   ├── .well-known/        # security.txt
│   ├── icons/              # Ícones do manifest e aplicação
│   ├── images/             # Imagens em formato WebP
│   ├── humans.txt          # Metadados sobre autores e ferramentas
│   ├── llms.txt            # Informações estruturadas para crawlers/LLMs
│   ├── manifest.json       # Web App Manifest
│   ├── robots.txt          # Regras de rastreamento para buscadores
│   └── sitemap.xml         # Mapa do site indexável
├── src/
│   ├── components/
│   │   ├── global/         # Componentes transversais (Navbar, Footer, etc.)
│   │   ├── sections/       # Seções temáticas da página (Hero, Services, etc.)
│   │   └── ui/             # Componentes reutilizáveis de interface (Button, Card, etc.)
│   ├── data/               # Informações e configurações de conteúdo centralizadas
│   ├── i18n/               # Dicionários de tradução (pt-BR, en, es) e utilitários
│   ├── layouts/            # Layouts base da aplicação (BaseLayout, PageLayout)
│   ├── pages/              # Rotas e páginas estáticas (pt-BR na raiz, /en e /es)
│   └── styles/             # Folha de estilo global e temas do Tailwind CSS
├── AGENTS.md               # Instruções e diretrizes operacionais para agentes e devs
├── astro.config.mjs        # Configuração do Astro (i18n, vite, plugins)
├── package.json            # Dependências e scripts do projeto
├── pnpm-lock.yaml          # Lockfile de dependências
├── tsconfig.json           # Configurações do compilador TypeScript
└── wrangler.jsonc          # Configuração de assets para o Cloudflare
```

## Desenvolvimento

### Pré-requisitos

- **Node.js**: versão `>=22.12.0`
- **pnpm**: gerenciador de pacotes padrão do projeto

### Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/gbrlcm/portfolio.git
cd portfolio
pnpm install
```

### Desenvolvimento local

Inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

O site estará disponível por padrão em `http://localhost:4321`.

> **Nota para execução em segundo plano:** Conforme orientado em `AGENTS.md`, o servidor Astro pode ser executado em background com `astro dev --background` e monitorado com `astro dev status`, `astro dev logs` e `astro dev stop`.

### Typecheck

Para validar tipos TypeScript e diagnósticos dos componentes Astro:

```bash
pnpm typecheck
```

*(Ou utilize o alias `pnpm check`).*

### Lint

O repositório não possui um linter automatizado (como ESLint) configurado no `package.json`. A consistência e integridade do código são validadas através da checagem estrita de tipos do TypeScript e do Astro (`pnpm typecheck`).

### Testes

O projeto atualmente não inclui uma suíte de testes automatizados configurada. A validação das alterações é feita por meio de compilação estática (`pnpm build`) e verificação de tipos (`pnpm typecheck`).

### Build

Para compilar a aplicação para produção:

```bash
pnpm build
```

Os arquivos estáticos gerados serão salvos no diretório `./dist/`.

Para pré-visualizar o build localmente antes de publicar:

```bash
pnpm preview
```

## Arquitetura

- **Roteamento e Internacionalização (i18n):** O projeto utiliza o sistema de rotas baseado em arquivos do Astro. O idioma padrão é o português (`pt-BR`), servido na raiz `/`. Rotas adicionais em inglês e espanhol estão localizadas em `/en` e `/es`. As configurações de locale estão centralizadas em `astro.config.mjs` e as strings em `src/i18n/ui.ts`.
- **Layouts e Componentes:** A camada visual utiliza `BaseLayout.astro` (gerenciamento de `<head>`, metadados, fontes e `ClientRouter` para transições suaves) e `PageLayout.astro` (estrutura comum com `Navbar`, `Footer` e `QuickContact`). Componentes são divididos em elementos atômicos de interface (`src/components/ui/`) e blocos de conteúdo da página (`src/components/sections/`).
- **Camada de Dados:** Textos e metadados estruturados de contato, navegação e informações do site são mantidos em `src/data/`, desacoplando o conteúdo dos componentes visuais.
- **Assets e Otimização:** Imagens são armazenadas em formato `.webp` dentro de `public/images/`. Ícones vetoriais são gerenciados pelo `astro-icon` com pacotes Iconify (`lucide` e `simple-icons`).
- **Estilização:** Tailwind CSS v4 configurado via `@theme` no arquivo `src/styles/styles.css`, sem dependência de pré-processadores complexos.

## Conteúdo e SEO

O repositório possui suporte a indexação e descoberta técnica configurado diretamente nos arquivos do projeto:

- **Metadados:** Tags Open Graph, Twitter Cards, canonical URL e definição de idioma em `src/layouts/BaseLayout.astro`.
- **Sitemap e Robots:** Arquivo de rotas indexáveis em `public/sitemap.xml` e regras de rastreamento em `public/robots.txt`.
- **Descoberta para IA (AI Search):** Arquivo `public/llms.txt` com resumo estruturado sobre o perfil técnico e links oficiais.
- **Segurança e Metadados Adicionais:** `public/.well-known/security.txt`, `public/humans.txt` e Web App Manifest em `public/manifest.json`.

## Deploy

- **Plataforma:** [Cloudflare Pages](https://pages.cloudflare.com/)
- **Branch de produção:** `main`
- **Build Command:** `pnpm build`
- **Output Directory:** `dist`
- **Configuração:** O arquivo `wrangler.jsonc` define a publicação de assets estáticos a partir do diretório `./dist`.
- **Variáveis de Ambiente:** O build estático não requer variáveis de ambiente secretas em tempo de execução. A URL base é inferida através da propriedade `site` em `astro.config.mjs` (`https://gabrielcampos.dev`).

## Princípios do projeto

- **Simplicidade:** Ausência de frameworks pesados no client-side; páginas renderizadas em HTML estático com hidratação mínima.
- **Performance:** Formatos de imagem leves (`.webp`), importações otimizadas de fontes e build ultrarrápido pelo compilador do Astro e Vite.
- **Acessibilidade e Semântica:** Uso de marcação HTML semântica (`<main>`, `<header>`, `<footer>`, `<section>`) e contrastes definidos.
- **Manutenibilidade:** Separação clara entre fontes de dados (`src/data/`), traduções (`src/i18n/`) e apresentação (`src/components/`).
- **Qualidade de Código:** Validação com TypeScript em modo estrito (`astro/tsconfigs/strict`).
- **Sem Dependências Desnecessárias:** Estrutura enxuta, evitando bibliotecas redundantes ou overengineering.

## Agentes e automação

- **`AGENTS.md` (e symlink `CLAUDE.md`):** Fornece regras operacionais específicas do repositório para agentes de IA e desenvolvedores, como o ciclo de vida do servidor de desenvolvimento em segundo plano (`astro dev --background`, `status`, `logs`, `stop`) e referências para a documentação oficial do Astro.
- **Uso por Agentes:** Antes de realizar alterações de código, agentes devem consultar `AGENTS.md` e verificar compatibilidade de tipos (`pnpm typecheck`) e integridade do build (`pnpm build`) antes de concluir tarefas.

## Decisões técnicas

- **Astro como gerador estático:** Escolhido por gerar HTML estático por padrão (Zero-JS overhead), garantindo tempos de carregamento mínimos para um portfólio.
- **Tailwind CSS v4 com Vite:** Utilização da versão mais recente do Tailwind via plugin oficial do Vite (`@tailwindcss/vite`), reduzindo arquivos de configuração externos e unificando o tema em variáveis CSS nativas.
- **Deploy em Cloudflare Pages:** Proporciona distribuição global em CDN de borda com baixa latência, alta disponibilidade e processo de deploy estático sem custo operacional de servidores.
- **Internacionalização integrada:** Implementada nativamente através da configuração de i18n do Astro sem necessidade de pacotes externos volumosos.

## Contribuição

Para realizar modificações no repositório de forma segura:

1. **Entender as regras do projeto:** Consulte `AGENTS.md` e verifique os padrões existentes em `src/`.
2. **Avaliar o impacto:** Verifique se as alterações afetam mais de um idioma (`pt-BR`, `en`, `es`) ou componentes compartilhados.
3. **Fazer a alteração:** Mantenha os arquivos focados e evite adicionar dependências sem necessidade estrita.
4. **Executar validações:**
   ```bash
   pnpm typecheck
   pnpm build
   ```
5. **Revisar o diff:** Verifique as alterações antes de commitar:
   ```bash
   git diff
   ```

## Licença

Código e conteúdo sob direitos autorais de Gabriel Campos. Todos os direitos reservados.
