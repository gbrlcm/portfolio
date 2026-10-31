---
title: "VPS ou cloud? Quando uma infraestrutura simples basta"
description: "Critérios de engenharia para escolher entre VPS e cloud: armazenamento, object storage, alta disponibilidade, RPO/RTO e custo real."
pubDate: 2026-10-31T15:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/vps-ou-cloud-quando-infraestrutura-simples-basta.webp"
coverAlt: "Ilustração sem texto: um único servidor à esquerda, um losango amarelo de decisão no centro e, à direita, nós distribuídos em três zonas com balanceador, banco de dados e bucket de objetos"
category: "Arquitetura de Software"
tags:
  - "Infraestrutura"
  - "VPS"
  - "Cloud"
  - "Arquitetura"
  - "Object Storage"
  - "PostgreSQL"
  - "DevOps"
draft: false
lang: "pt-BR"
translationKey: "vps-vs-cloud"
---

Um SaaS com algumas centenas de clientes, um backend, um banco e uma fila de relatórios nasce, no papel, com Kubernetes, três zonas de disponibilidade, banco gerenciado com réplicas, balanceador, CDN, fila, *workers* e uma stack de observabilidade paga por volume de log. Dois desenvolvedores vão operar tudo isso. A carga real cabe, com folga, em uma máquina.

Isso acontece com frequência e raramente por decisão técnica. Acontece porque a arquitetura "de verdade" virou sinônimo de arquitetura distribuída, e porque ninguém é demitido por escolher o que todo mundo escolhe. Mas cada componente adicionado tem custo permanente: dinheiro, superfície de falha, configuração para manter e conhecimento que alguém precisa ter às três da manhã.

A tese deste artigo é simples e tem dois lados. **Uma VPS bem dimensionada, monitorada e administrada atende muitas aplicações empresariais e muitos produtos SaaS.** E **existem requisitos concretos que uma VPS não atende**, e o trabalho de engenharia é saber reconhecê-los. Não é uma disputa entre VPS e cloud: é uma decisão que depende de requisitos funcionais e não funcionais, da carga, da disponibilidade exigida, do custo e da capacidade operacional de quem vai manter o sistema.

> Este artigo é um estudo baseado em documentação oficial e em experimentos que executei localmente. Trechos marcados como **opinião** ou **interpretação** refletem a minha leitura; o restante cita fontes. Não tenho resultados de produção próprios para apresentar aqui, e os exemplos de arquitetura são cenários plausíveis, não cases. As referências estão no final, com a data de consulta.

## A complexidade que ninguém pediu

Donald Knuth escreveu em 1974 que a otimização prematura é a raiz de boa parte dos males da programação (*Structured Programming with go to Statements*, ACM Computing Surveys). A frase costuma ser citada para código, mas vale igualmente para infraestrutura: projetar para um problema que você não tem custa tempo agora e costuma errar o problema que você terá depois.

Três distinções ajudam a separar necessidade de preferência:

- **Necessidade técnica** é um requisito que você consegue enunciar e medir: "toleramos no máximo 15 minutos de perda de dados", "a carga triplica nas campanhas e volta ao normal em horas", "precisamos servir usuários na Europa e no Brasil com baixa latência".
- **Preferência tecnológica** é "queremos usar Kubernetes", "todo mundo usa serviço gerenciado". Pode ser legítima (por exemplo, por aprendizado ou contratação), mas precisa ser assumida como preferência, com o custo que ela traz.
- **Preparação para crescer** é diferente de **complexidade antecipada**. Uma aplicação preparada para crescer tem fronteiras claras (arquivos fora da máquina de aplicação, sessões sem estado local, migrações versionadas, backups testados). Uma aplicação com complexidade antecipada já paga hoje por distribuição que talvez nunca use.

O próprio Azure Well-Architected Framework, de um provedor que vende essa complexidade, inclui entre seus princípios de confiabilidade o *keep it simple*: adicionar componentes "somente se ajudarem a atingir o valor de negócio-alvo", porque cada componente crítico é um ponto de falha em potencial. O mesmo texto faz a ressalva oposta: simplificar demais pode introduzir pontos únicos de falha. A conclusão que tiro disso (**interpretação**) é que a pergunta não é "simples ou complexo?", e sim "qual é o mínimo que satisfaz os requisitos que eu consigo declarar?".

## VPS, VM e cloud: o que cada termo promete

Os termos se misturam no mercado, então vale separar o que cada um garante.

**Máquina virtual (VM)** é uma máquina emulada por um hipervisor sobre hardware físico compartilhado: o convidado enxerga CPU, memória, disco e rede virtuais, isolados dos demais convidados. **VPS** (*virtual private server*) é um nome comercial para uma VM vendida com recursos reservados e acesso administrativo (root), tipicamente com preço mensal fixo e rede e disco gerenciados pelo provedor. Tecnicamente, uma VPS é uma VM.

**Cloud**, na definição do NIST (SP 800-145), é um modelo de acesso sob demanda a um *pool* compartilhado de recursos computacionais configuráveis, que podem ser provisionados e liberados rapidamente com mínimo esforço de gestão ou interação com o provedor. O NIST lista cinco características essenciais: autosserviço sob demanda, acesso amplo pela rede, agrupamento de recursos (*resource pooling*), elasticidade rápida e serviço medido. Isso descreve **um modelo de consumo e de API**, não um tipo de servidor.

Daí duas consequências práticas:

1. **VPS e cloud não são categorias excludentes.** Uma instância EC2 com um volume EBS é, funcionalmente, uma VPS: uma VM com disco persistente e IP, sobre infraestrutura de cloud (**interpretação**). O que diferencia o uso não é a VM, e sim se você contrata *só a VM* ou *um conjunto de serviços* ao redor dela.
2. **Contratar uma VM é diferente de contratar serviços de infraestrutura.** Com a VM, você recebe computação e disco e assume o resto: sistema operacional, patches, firewall, backup, monitoramento, banco, TLS. Com serviços (banco gerenciado, balanceador, object storage, fila), o provedor opera partes da pilha, e você paga por isso em dinheiro e em acoplamento ao provedor. O modelo de responsabilidade compartilhada da AWS formaliza a divisão: o provedor cuida da segurança *da* nuvem (hardware, software de base, instalações); o cliente cuida da segurança *na* nuvem, o que inclui o sistema operacional convidado nas instâncias EC2, as aplicações, os dados e a configuração de firewall (*security groups*). **Cloud não elimina a necessidade de administrar infraestrutura; ela muda quais partes você administra.**

Também convém distinguir três tipos de hospedagem:

| | VPS tradicional | VM em cloud (ex.: EC2, Compute Engine, Azure VM) | Servidor dedicado |
|---|---|---|---|
| Hardware | Compartilhado, fatiado por hipervisor | Compartilhado, fatiado por hipervisor | Físico, exclusivo |
| Provisionamento | Minutos, geralmente por painel | Segundos a minutos, por API | Minutos a dias |
| Rede e disco | Simples, do provedor | Redes virtuais e discos em volumes separados da VM | Discos locais |
| Ecossistema ao redor | Pequeno | Extenso (banco, fila, storage, balanceador…) | Mínimo |
| Modelo de cobrança | Geralmente plano mensal | Por uso medido | Contrato mensal |

(Tabela de caracterização geral; as particularidades variam por provedor e por plano.)

**Infraestrutura compartilhada** significa que seu servidor divide hardware físico com outros clientes; **infraestrutura distribuída** é um conceito de arquitetura: seu *sistema* roda em vários nós que se coordenam pela rede. Uma VPS pode ser compartilhada e não distribuída (o caso comum). Um sistema pode ser distribuído em máquinas dedicadas. As duas coisas são independentes, e o custo de distribuir (consistência, latência de rede, falhas parciais) existe qualquer que seja o hardware.

## Quando uma VPS é suficiente

Uma VPS costuma atender bem cargas como:

- aplicações **monolíticas** (inclusive monólitos modulares);
- **APIs REST** com tráfego previsível;
- **sistemas administrativos** e aplicações internas empresariais, com usuários em horário comercial;
- **SaaS em estágio inicial**, com dezenas ou centenas de clientes;
- **sites institucionais** e **e-commerces de pequeno e médio porte**;
- sistemas de **processamento com carga previsível** (importações noturnas, geração de relatórios agendada).

O denominador comum é um **perfil de carga que você conhece**: sem picos imprevisíveis de ordens de grandeza e com tolerância definida a janelas de indisponibilidade curtas. Se essa tolerância não existe, o problema muda de natureza (veja a próxima seção).

### Uma arquitetura de referência

Uma pilha que uso como ponto de partida nos estudos, tudo em uma VPS Linux:

```text
Internet ──► Nginx (TLS, reverse proxy, limites)
                ├──► web  (Next.js, SSR)
                └──► api  (NestJS)
                        ├──► PostgreSQL  (dados, transações)
                        └──► Redis       (cache, rate limit, filas leves)

Fora da máquina: backups (base + WAL) em object storage; monitoramento e alertas externos
```

Responsabilidades:

- **Linux**: base; atualizações de segurança, `ufw`/`nftables` fechando tudo exceto 80/443 (e SSH restrito), usuários sem privilégio, relógio sincronizado.
- **Docker + Docker Compose**: empacota e versiona os serviços. A documentação do Docker descreve o deploy em servidor único como o caminho mais simples, e que, para escalar além de um host, o próximo passo seria um cluster (Swarm, na própria doc) ou outro orquestrador. Volumes nomeados persistem dados fora do ciclo de vida do contêiner; a camada gravável do contêiner **não** é durável.
- **Nginx**: termina TLS, faz *reverse proxy*, impõe limites (tamanho de corpo, taxas) e serve estáticos.
- **PostgreSQL**: fonte da verdade para dados estruturados e transacionais.
- **Redis**: cache e estruturas efêmeras. A documentação do Redis lista a opção "sem persistência" como uso comum para cache, e recomenda RDB + AOF apenas se você quer segurança de dados comparável à do PostgreSQL. Neste desenho, **Redis é descartável por definição**; se algo nele precisar sobreviver, é sinal de que o dado pertence ao banco.
- **Backups externos**: o item mais negligenciado (veja abaixo).
- **Monitoramento**: métricas de host (CPU, memória, disco, I/O), do banco (conexões, locks, atraso de *vacuum*, tamanho) e da aplicação (latência, taxa de erro), com alerta para fora da própria VPS. Um monitor que morre junto com o servidor não avisa de nada.
- **CI/CD**: pipeline que constrói a imagem, roda testes e publica por tag; o deploy é `docker compose pull && docker compose up -d`, com *rollback* para a tag anterior.

Um `compose.yaml` mínimo desse desenho (validado com `docker compose config`; ajuste imagens, segredos e *healthchecks* ao seu caso):

```yaml
services:
  nginx:
    image: nginx:1.27
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on: [web, api]
    networks: [edge, app]

  web:                       # Next.js (SSR)
    image: registry.example.com/saas-web:${TAG}
    restart: unless-stopped
    env_file: .env
    networks: [app]

  api:                       # NestJS
    image: registry.example.com/saas-api:${TAG}
    restart: unless-stopped
    env_file: .env
    depends_on:
      postgres: { condition: service_healthy }
    networks: [app, data]

  postgres:
    image: postgres:17
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/pg_password
    secrets: [pg_password]
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks: [data]

  redis:                     # cache descartável: sem RDB, sem AOF
    image: redis:7
    restart: unless-stopped
    command: ["redis-server", "--save", "", "--appendonly", "no",
              "--maxmemory", "256mb", "--maxmemory-policy", "allkeys-lru"]
    networks: [data]

volumes:
  pgdata:

networks:
  edge:
  app:
  data:
    internal: true           # banco e Redis sem rota para fora

secrets:
  pg_password:
    file: ./secrets/pg_password
```

E o trecho do Nginx que roteia `/api/` para o backend (validado com `nginx -t` na imagem `nginx:1.27`):

```nginx
upstream api { server api:3000; keepalive 16; }
upstream web { server web:3000; keepalive 16; }

server {
  listen 80;
  server_name app.example.com;
  client_max_body_size 1m;        # uploads grandes NÃO passam por aqui (veja a seção de object storage)

  location /api/ {
    proxy_pass http://api;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
  location / {
    proxy_pass http://web;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
  }
}
```

**Backup não é redundância.** O PostgreSQL documenta arquivamento contínuo: um *backup* base no nível do sistema de arquivos mais o arquivo contínuo de WAL permitem restaurar o cluster para qualquer instante posterior ao backup base (PITR). Duas ressalvas da própria documentação: `pg_dump` não serve para isso (um dump lógico não contém informação suficiente para o *replay* de WAL), e o arquivamento precisa ser configurado e testado *antes* do primeiro backup base. O whitepaper de *disaster recovery* da AWS faz a distinção correspondente: replicação contínua tem RPO próximo de zero, mas pode não proteger contra corrupção de dados ou exclusão maliciosa, que também se replicam; é o *backup com ponto no tempo* e o versionamento que protegem. E ambas as fontes insistem: teste a restauração. Um backup que nunca foi restaurado é uma hipótese.

### Dimensionamento: o que olhar, e por que não existe número mágico

Não existe "uma VPS aguenta N usuários". Usuários não são unidade de carga; **requisições por segundo, custo por requisição e padrão de acesso** são. Os recursos a observar:

- **CPU**: núcleos ocupados em horário de pico, fila de execução (*load average* relativo ao número de núcleos) e *steal time*, que em VM indica contenção de hipervisor.
- **Memória**: working set da aplicação, `shared_buffers` e cache de página do PostgreSQL, e memória por conexão. A memória que "sobra" não está ociosa: o Linux a usa como cache de disco, e é esse cache que mantém o banco rápido.
- **Armazenamento**: capacidade, crescimento diário e, mais importante para banco, **IOPS e latência**. Um disco com muita capacidade e IOPS limitado trava um banco antes de acabar o espaço.
- **Throughput de disco e de rede**: relevantes para backups, importações e downloads de arquivos grandes servidos pela própria máquina.
- **Concorrência**: pela lei de Little (*L = λ·W*), o número médio de requisições simultâneas em andamento é a taxa de chegada vezes o tempo médio de atendimento. Exemplo **hipotético**: 200 req/s com 50 ms de latência média mantêm, em média, 10 requisições em andamento; se a latência sobe para 500 ms por causa de uma consulta lenta, são 100, sem que o tráfego tenha mudado.
- **Conexões com o banco**: o PostgreSQL dimensiona certos recursos diretamente a partir de `max_connections` (padrão típico de 100, definido no `initdb`), e esse valor só muda com reinício. Mais conexões não é mais throughput: cada conexão é um processo com memória própria. Em geral, o que escala é um *pool* de tamanho limitado (da aplicação ou de um *pooler* externo) e consultas curtas. (**Opinião:** é um dos primeiros gargalos reais de apps pequenos, e costuma ser resolvido com configuração, não com hardware.)

Há ainda a **regra inversa**: a VPS que parece "pequena" pode estar subutilizada, e a "grande" pode estar sufocada. Monitorar é o que diz qual.

### Hardware não conserta uma consulta ruim

Para tornar isso concreto, rodei um experimento em um PostgreSQL 17.10 local descartável (um notebook, sem tuning, **não é benchmark**): uma tabela `pedidos` com 2 milhões de linhas (285 MB), consulta por `cliente_id` retornando 37 linhas, com `max_parallel_workers_per_gather = 0` para isolar o efeito.

| Cenário | Plano | Páginas lidas (8 kB) | Tempo de execução |
|---|---|---|---|
| Sem índice em `cliente_id` | `Seq Scan` | ~36.400 | 59 a 75 ms |
| Com índice em `cliente_id` | `Bitmap Index Scan` + `Bitmap Heap Scan` | 40 | 0,02 a 0,04 ms |

A diferença é de três ordens de grandeza em páginas lidas e tempo, na mesma máquina. Agora imagine essa consulta chamada centenas de vezes por segundo numa tabela de 200 milhões de linhas: nenhum upgrade de CPU resolve o que um índice resolve. O mesmo vale para outros gargalos em que mais hardware ajuda pouco:

- **Contenção de banco**: transações longas segurando locks, *deadlocks*, linhas "quentes" atualizadas por muitas requisições. Mais núcleos só criam mais espera.
- **Vazamento de memória** na aplicação: mais RAM só adia o OOM.
- **Bloqueio de I/O síncrono** (chamadas HTTP externas sem *timeout* dentro da requisição, arquivos grandes processados na mesma thread): a fila cresce com a máquina ociosa.
- **N+1 queries**, ausência de paginação, `SELECT *` em tabelas largas.

Os artigos sobre o [planejador de consultas](/pt/blog/query-planner-postgresql) e sobre [isolamento, locks e deadlocks](/pt/blog/isolamento-locks-deadlocks-postgresql) na série *PostgreSQL por Dentro* detalham como diagnosticar cada um. A consequência para esta discussão (**interpretação**): antes de migrar de infraestrutura por "falta de capacidade", confirme que o gargalo é capacidade e não eficiência.

## Quando migrar para cloud

Os critérios que justificam serviços de cloud são requisitos que uma VPS única não consegue cumprir, não uma contagem de usuários:

- **Variabilidade de demanda**: carga que oscila em ordens de grandeza (campanhas, sazonalidade, eventos). Pagar pelo pico o mês inteiro é caro; capacidade sob demanda resolve. O princípio de confiabilidade da AWS "pare de adivinhar capacidade" descreve exatamente isso.
- **Escalabilidade horizontal necessária**: quando o limite de uma máquina (mesmo grande) é o problema, não o desenho.
- **Alta disponibilidade e tolerância a falhas**: se o negócio não tolera as horas de indisponibilidade que uma máquina única implica (veja abaixo).
- **Recuperação de desastres com RPO/RTO exigentes**: **RPO** (*recovery point objective*) é quanto dado você aceita perder, medido em tempo; **RTO** (*recovery time objective*) é quanto tempo você aceita ficar fora. Restaurar um backup noturno numa VPS nova dá RPO de até 24 h e RTO de horas; se o negócio exige minutos para ambos, precisa de replicação e failover.
- **Distribuição geográfica**: latência para usuários distantes, residência de dados.
- **Segurança e conformidade**: certificações, auditoria, isolamento, gestão de chaves e identidade que o provedor já oferece e você teria de montar.
- **Capacidade operacional da equipe**: se ninguém quer ou pode operar PostgreSQL com replicação e backups testados, pagar um banco gerenciado é uma decisão racional, não uma fraqueza.
- **Provisionamento automatizado e ambientes efêmeros**: infraestrutura como código, ambientes de teste sob demanda.

### Vertical, horizontal e o problema do estado

**Escalabilidade vertical** é aumentar a máquina; é simples, sem mudança de código, mas tem teto, costuma exigir reinício e mantém o ponto único de falha. **Escalabilidade horizontal** é adicionar máquinas; só funciona direito quando as réplicas da aplicação são **intercambiáveis**, ou seja, **sem estado local** (*stateless*): sessões em Redis ou token assinado, arquivos em object storage, *jobs* em fila. O guia do Auto Scaling da AWS descreve o grupo como um conjunto de instâncias tratadas como unidade lógica, que substitui as não saudáveis por novas e distribui a capacidade entre zonas, o que, na minha leitura (**interpretação**), pressupõe instâncias descartáveis. Aplicações com estado local (arquivos em `/uploads`, sessão em memória) quebram esse modelo.

O estado não desaparece: **ele se concentra** nos componentes que o guardam (banco, object storage, cache). Escalar a camada *stateless* é relativamente fácil; escalar o banco é o problema difícil.

### Balanceamento, failover e redundância entre zonas

Um balanceador (o Elastic Load Balancing da AWS é um exemplo) distribui requisições entre alvos em uma ou mais zonas de disponibilidade e **envia tráfego apenas aos saudáveis**, com *health checks*. Uma **zona de disponibilidade (AZ)** é um ou mais data centers com energia, rede e conectividade redundantes, fisicamente separados de outras zonas da mesma região. Redundância entre zonas permite sobreviver à perda de um data center.

Para o banco, a AWS descreve duas formas no RDS: **Multi-AZ com uma instância *standby***, replicada **de forma síncrona** em outra zona, com failover; a documentação adverte que o *standby* **não serve tráfego de leitura** e que a replicação síncrona pode aumentar a latência de escrita e *commit* em relação a uma única zona. Para leitura, usam-se **réplicas de leitura** (assíncronas) ou um cluster Multi-AZ com *standbys* legíveis. Daí uma distinção importante: **alta disponibilidade (Multi-AZ) e escala de leitura (réplicas) resolvem problemas diferentes.**

Em PostgreSQL puro, a documentação oficial descreve soluções de *standby* (WAL shipping e replicação lógica, entre outras) que podem ser síncronas ou assíncronas e permitem promover o *standby* a primário. Montar isso, com detecção de falha, promoção segura e *fencing* do primário antigo, é trabalho de engenharia e operação seu. É exatamente o trabalho que o banco gerenciado vende.

### Uma VM maior não resolve tudo, e uma VM em cloud não é alta disponibilidade

Aumentar a máquina atende CPU/RAM/IOPS até um teto, mas **não** dá redundância, **não** dá recuperação de desastre, **não** resolve a latência geográfica e **não** resolve contenção de aplicação.

E rodar numa instância de cloud **não** significa alta disponibilidade. O SLA do EC2, na página consultada (última atualização indicada: 25/05/2022), compromete **99,99%** de disponibilidade mensal no nível de região **quando as instâncias rodam em duas ou mais zonas**, e **99,5%** no nível de instância para uma única instância. Em aritmética simples, 99,5% permite cerca de 3,6 horas de indisponibilidade por mês de 30 dias, enquanto 99,99% permite cerca de 4,3 minutos. Um SLA é compromisso contratual com créditos de serviço, não previsão de comportamento. Além disso, volumes EBS são replicados **dentro de uma zona de disponibilidade**, o que protege contra falha de componente, mas não contra a perda da zona. **Durabilidade não é disponibilidade**, e **disponibilidade não é escalabilidade**: um sistema pode escalar sem ser disponível (muitas máquinas no mesmo ponto de falha) e ser disponível sem escalar (duas máquinas pequenas em zonas distintas).

## Armazenamento: uma decisão arquitetural fundamental

Onde os bytes moram define o que acontece quando a máquina morre, quando você precisa de uma segunda instância e quando a conta chega. Seis modelos, com exemplos de provedores (que **não são equivalentes entre si em todos os aspectos**).

### Armazenamento local

É o disco da própria máquina (NVMe/SSD interno ou o disco da VPS). Vantagens: menor latência e simplicidade; `fsync` e arquivos funcionam como o programador espera. Limites: **a vida do dado está atada à vida da máquina**. Se a VM for recriada, o disco local pode desaparecer; mesmo quando persiste, depende de uma única máquina e de um único componente de falha. Caso de uso: temporários, cache de build, *spill* de ordenação, dados reproduzíveis.

### Block storage

Um **volume de bloco** é um dispositivo de blocos exposto à VM, sobre o qual você cria um sistema de arquivos (ou entrega o dispositivo bruto ao banco). A documentação do Amazon EBS o descreve como volumes que você anexa a instâncias EC2 e usa "como um disco local", com snapshots como backups com ponto no tempo, tipos distintos para IOPS e *throughput*, e replicação automática entre servidores **dentro da zona**. Persiste independentemente da instância. Na prática (**interpretação**; confirme as exceções do seu provedor), um volume de bloco é usado por **uma instância por vez**, com um sistema de arquivos comum por cima. Tipo de volume, IOPS e *throughput* são escolhidos e pagos à parte, por isso entram no custo. Caso de uso: **banco de dados** e qualquer coisa que espere um disco POSIX com baixa latência.

### File storage

**Sistema de arquivos compartilhado**, acessado por NFS ou SMB. O Amazon EFS, por exemplo, usa NFSv4.1/4.0, permite acesso concorrente de muitas instâncias, oferece semântica de arquivo (consistência forte e *file locking*) e pode replicar entre zonas. Cada operação passa pela rede e pelo protocolo, então o desempenho, em especial para muitos arquivos pequenos e metadados, é diferente do disco local; é preciso testar com o seu padrão de acesso (**interpretação**). Caso de uso: aplicações legadas que exigem sistema de arquivos compartilhado, diretórios de home, conteúdo compartilhado entre instâncias, quando alterar a aplicação para object storage não é viável.

### Object storage

Armazena **objetos** (dados + metadados) em **buckets**, endereçados por uma **chave** (e, com versionamento, um *version ID*), por uma **API HTTP**. O Amazon S3 se descreve assim: um objeto é um arquivo mais metadados; cada objeto tem uma chave única no bucket; o serviço é uma API REST. **Não é um sistema de arquivos.** A API opera sobre objetos por chave (`PUT`, `GET`, `DELETE`, `COPY`), sem a semântica POSIX: na prática (**interpretação** do modelo de API), não há *lock* de arquivo nem edição parcial no lugar, e "renomear" é copiar e excluir. O S3 documenta que não oferece *locking* entre escritores concorrentes (com `PUT`s simultâneos na mesma chave, vence o de timestamp mais recente) e que não existe atualização atômica entre chaves. "Pastas" são só prefixos de chave.

Propriedades que importam (todas citadas dos provedores, e **cada produto tem as suas**):

- **Durabilidade.** O S3 Standard foi *projetado* para 99,999999999% (onze noves) de durabilidade e 99,99% de disponibilidade de objetos ao longo de um ano, com dados armazenados em múltiplos dispositivos em pelo menos três zonas. "Projetado para" é uma meta de projeto, não uma garantia contratual; e durabilidade **não** protege contra você apagar o objeto.
- **Consistência.** O S3 oferece consistência forte de leitura após escrita para `PUT` e `DELETE`, em todas as regiões, e atualizações de uma única chave são atômicas; atualizações **entre** chaves não são. O Google Cloud Storage documenta consistência forte para escritas e listagens de objetos, mas concessão/revogação de acesso é **eventualmente** consistente (cerca de um minuto, segundo a documentação). O Cloudflare R2 documenta consistência forte para leitura após escrita, exclusão e listagem, com mudanças de permissões de chaves de API eventualmente consistentes. Se houver *cache* ou CDN na frente, a consistência prática passa a ser a do cache.
- **Versionamento.** No S3, quando ativado, uma exclusão insere um *delete marker* e a versão anterior permanece; uma sobrescrita cria nova versão. **Cada versão é cobrada como objeto inteiro**, e, uma vez ativado, o bucket nunca volta ao estado "sem versionamento" (só pode ser suspenso).
- ***Lifecycle policies.*** Regras de transição entre classes de armazenamento e de expiração. No S3, regras de ciclo de vida também se aplicam a versões não correntes, e há ação específica para **abortar uploads multipart incompletos**, cujas partes continuam sendo cobradas até serem concluídas ou abortadas.
- **URLs assinadas (*presigned*).** URL temporária que concede acesso a **uma operação em um objeto** com as credenciais de quem a gerou. No S3, vale até a expiração e **expira antes se as credenciais usadas na assinatura expirarem**; é um *bearer token* (quem tem a URL usa), e deve ser tratada como tal. No R2, são suportadas via API S3 (de 1 segundo a 7 dias; GET, HEAD, PUT, DELETE), **não** em domínios customizados, e não há suporte a POST de formulário.
- ***Multipart upload.*** O S3 recomenda usar para objetos de **100 MB ou mais**; as partes têm números de 1 a 10.000, podem ser enviadas em paralelo e reenviadas individualmente, e o upload só vira objeto quando você chama *complete*.
- **Custos.** Armazenamento por GB-mês, **requisições** (as de escrita e listagem custam mais que as de leitura), e **transferência de saída**. Alguns provedores cobram a saída; o R2 declara não cobrar *egress*.

**Exemplos e ressalvas.** *Amazon S3*, *Google Cloud Storage* e *Cloudflare R2* são serviços gerenciados; R2 expõe uma API compatível com S3, o que facilita portar código, mas "compatível" não é "idêntico" (por exemplo, a restrição de domínio customizado em URLs assinadas acima). *MinIO* é um servidor de object storage compatível com S3 que você mesmo opera. Ao consultar o repositório oficial em 31/10/2026, ele aparecia como **arquivado e sem manutenção** (arquivado pelo mantenedor em 25/04/2026), com a edição *community* distribuída apenas como código-fonte sob AGPLv3 e a empresa apontando para produtos AIStor como alternativa. Para quem planejava usá-lo, é uma informação de risco: avalie o estado do projeto na data em que decidir.

### Armazenamento de banco de dados

Bancos relacionais como o PostgreSQL são apropriados para **dados estruturados, relacionamentos, transações e consultas**: integridade referencial, índices, `JOIN`, isolamento, *point-in-time recovery*. Isso não os torna adequados para guardar *blobs* grandes por padrão. O PostgreSQL armazena valores grandes via **TOAST** (compressão e/ou fragmentação em tabela auxiliar), com limite de **1 GB por valor**; há também a facilidade de *large objects*, com acesso em fluxo. Colocar PDFs e vídeos no banco funciona em escala pequena, mas (**opinião**, em linha com a prática comum): infla o banco, o backup, o WAL e a replicação com bytes que não precisam de transações nem de consultas relacionais, e torna o banco o gargalo de leitura de arquivos. O que **deve** ficar no banco é o *metadado* do arquivo e a referência para onde ele mora.

### Cache

Cache guarda uma **cópia descartável** de um dado cuja fonte de verdade está em outro lugar, para ganhar latência. Redis é o exemplo: em memória, com política de remoção (`maxmemory-policy`) e a opção, documentada, de **não persistir nada**. Regra de ouro: se perder o conteúdo do cache causa perda de dado de negócio, aquilo não é cache, é um banco mal escolhido. Cache **não** substitui armazenamento persistente nem object storage.

### Comparação

| | Local | Bloco | Arquivo | Objeto | Banco | Cache |
|---|---|---|---|---|---|---|
| **Acesso** | Sistema de arquivos local | Dispositivo de blocos + FS | NFS/SMB (POSIX via rede) | API HTTP por chave | SQL sobre protocolo próprio | Comandos chave-valor (Redis) |
| **Persistência** | Atada à máquina | Independente da instância (replicada na zona) | Independente; pode ser multi-zona | Independente; multi-zona por padrão em classes padrão (S3) | Durável (WAL + backup) | Opcional; descartável por desenho |
| **Compartilhamento** | Uma máquina | Normalmente uma instância por vez | Muitas instâncias | Muitos clientes, via rede | Muitos clientes, com isolamento transacional | Muitos clientes |
| **Latência** | Mais baixa | Baixa (rede) | Média (rede + protocolo) | Mais alta por operação (HTTP) | Depende da consulta | Mais baixa (memória) |
| **Escalabilidade** | Limitada pela máquina | Limitada pelo volume | Alta (serviços gerenciados) | Muito alta | Vertical; horizontal é difícil | Vertical e por *sharding* |
| **Melhor para** | Temporários, cache de build | Bancos, discos de sistema | Legado com FS compartilhado | Arquivos, anexos, backups, mídia | Dados relacionais e transacionais | Respostas e sessões derivadas |
| **Limitações** | Perde-se com a máquina | Ancorado em uma zona; custo de IOPS | Latência em arquivos pequenos; custo | Sem *rename*/*append*; consistência entre chaves | Não é bom para blobs grandes | Perde-se; não é fonte da verdade |

(Tabela de síntese a partir da documentação citada. "Latência" é qualitativa: o seu valor real depende de região, tipo e carga, e deve ser medido.)

## Quando usar object storage

Considere um SaaS com upload de documentos, imagens, vídeos, relatórios, anexos e arquivos gerados automaticamente. Duas implementações.

**Alternativa A: `/uploads` na própria VPS.**

- *Vantagens:* simplicidade total (o framework já sabe fazer), latência local, sem custo extra de serviço, sem dependência de provedor, controle de acesso na própria aplicação.
- *Limitações:* o arquivo vive no disco da máquina, então o disco precisa estar no backup (mais volume e mais complexidade); a aplicação deixa de ser *stateless* (uma segunda instância não vê os arquivos); uploads e downloads grandes consomem banda, CPU e conexões do próprio servidor; o crescimento de volume pressiona o disco da VPS e a janela de backup; e a migração futura exige copiar tudo.

**Alternativa B: object storage.**

- *Vantagens:* a aplicação fica sem estado local; durabilidade e replicação são do serviço; upload e download vão direto ao storage por URL assinada, sem passar pelo seu servidor; *lifecycle* e versionamento prontos; cresce sem redimensionar disco.
- *Limitações:* mais um componente (e uma conta, credenciais, políticas de acesso, CORS); latência de rede por operação; **custo por requisição e por transferência**; semântica diferente de filesystem; dependência de provedor (mitigada por uma API compatível com S3, nunca eliminada).

### Fluxo recomendado

1. O cliente pede o upload (`POST /api/attachments`) informando nome, tipo e tamanho.
2. O backend **autentica e autoriza** (esse usuário pode anexar a esse documento?) e **valida** limites (tipo permitido, tamanho máximo, quota do tenant).
3. O backend cria o registro no PostgreSQL com `status = 'pending'` e gera a **chave do objeto** (identificador opaco, não o nome original) e uma **URL pré-assinada de `PUT`** de curta duração.
4. O cliente envia o arquivo **direto** ao object storage (para arquivos grandes, via *multipart*).
5. O cliente (ou um evento do storage) avisa o backend; este confirma a existência do objeto (`HEAD`), compara tamanho e checksum e marca `status = 'ready'`.
6. Toda **leitura** passa pela aplicação: ela verifica a permissão e devolve uma URL assinada de `GET` curta (ou serve o arquivo via CDN com autenticação). O bucket permanece privado.

O esquema de metadados em PostgreSQL (executado em um PostgreSQL 17.10 local para validar a sintaxe e o plano da consulta de limpeza):

```sql
CREATE TYPE attachment_status AS ENUM ('pending', 'ready', 'deleted');

CREATE TABLE attachments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     bigint NOT NULL REFERENCES tenants(id),
  document_id   bigint NOT NULL REFERENCES documents(id),
  storage_key   text NOT NULL UNIQUE,          -- ex.: t/7/2026/10/<uuid>, nunca o nome original
  original_name text NOT NULL,
  content_type  text NOT NULL,
  size_bytes    bigint CHECK (size_bytes >= 0),
  checksum      text,
  status        attachment_status NOT NULL DEFAULT 'pending',
  created_by    bigint NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  retain_until  timestamptz,                    -- retenção legal/contratual
  deleted_at    timestamptz
);

CREATE INDEX attachments_document_idx ON attachments (document_id) WHERE status = 'ready';
CREATE INDEX attachments_pending_idx  ON attachments (created_at)  WHERE status = 'pending';

-- Job de limpeza: uploads iniciados e nunca confirmados (usa o índice parcial acima)
SELECT storage_key FROM attachments
WHERE status = 'pending' AND created_at < now() - interval '24 hours';
```

E a geração da URL assinada no backend (TypeScript com AWS SDK v3; testei a assinatura localmente, sem rede, com um endpoint estilo R2 e credenciais fictícias; o `ContentLength` assinado faz o storage rejeitar um corpo de tamanho diferente do declarado):

```ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: 'auto',                                           // R2; na AWS, a região real
  endpoint: 'https://<ACCOUNT_ID>.r2.cloudflarestorage.com', // omitir na AWS
  credentials: { accessKeyId: process.env.S3_KEY!, secretAccessKey: process.env.S3_SECRET! },
});

export const uploadUrl = (key: string, type: string, size: number) =>
  getSignedUrl(s3, new PutObjectCommand({
    Bucket: 'saas-files', Key: key, ContentType: type, ContentLength: size,
  }), { expiresIn: 300 });

export const downloadUrl = (key: string, filename: string) =>
  getSignedUrl(s3, new GetObjectCommand({
    Bucket: 'saas-files', Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  }), { expiresIn: 60 });
```

### Perguntas que o fluxo precisa responder

- **Exclusão e retenção.** Exclua em duas fases: marque `deleted_at`/`status` no banco (resposta imediata ao usuário) e remova o objeto num job, respeitando `retain_until`. Com versionamento ligado, "excluir" cria um *delete marker*; para apagar de fato, é preciso uma regra de expiração de versões não correntes, senão você paga para sempre por arquivos que "apagou".
- **Consistência banco ↔ storage.** Não existe transação distribuída entre PostgreSQL e o bucket. O padrão `pending → ready` com *job* de reconciliação (objetos órfãos, registros sem objeto) é a resposta pragmática.
- **Desacoplar a máquina de aplicação.** A aplicação guarda só a *chave*, nunca um caminho de disco; a configuração do endpoint é externa. Trocar de provedor vira cópia de dados e mudança de configuração, não reescrita.
- **Quando guardar localmente ainda é boa decisão.** Arquivos temporários, caches, artefatos de build, volumes pequenos num produto interno com uma instância só e backup do disco funcionando. A alternativa A não é errada; é uma escolha com custo futuro conhecido.
- **Quando file storage compartilhado faz mais sentido.** Quando a aplicação (frequentemente legada) *precisa* de semântica de sistema de arquivos (locks POSIX, `rename`, leitura parcial) e reescrever é inviável.
- **Quando não usar object storage.** Dados relacionais e transacionais; arquivos que precisam de edição parcial; cargas que exigem latência de disco local por operação; metadados (esses ficam no banco).

**Object storage não substitui filesystem nem banco de dados**: é um terceiro tipo de armazenamento, ótimo para blobs imutáveis ou raramente reescritos, acessados pela rede.

## Duas arquiteturas completas para um SaaS

Cenário **plausível, não um case**: um SaaS B2B com painel Next.js, API NestJS, PostgreSQL, uploads de documentos e geração de relatórios em PDF.

### Arquitetura A: tudo em uma VPS

```text
Cliente ─► Nginx ─┬─► Next.js (SSR)
                  └─► NestJS ─┬─► PostgreSQL (volume local)
                              ├─► Redis (cache; descartável)
                              └─► worker de relatórios (processo/contêiner, fila em Redis ou tabela)
Backups: pg_basebackup + WAL ─► object storage externo (outra conta/provedor)
Uploads: URL assinada ─► object storage (opcional, recomendado desde o início)
```

- **Fluxo.** Requisição entra no Nginx (TLS), vai ao Next.js ou à API; a API consulta/escreve no PostgreSQL e usa Redis para cache; relatórios pesados vão para um *worker* na mesma máquina.
- **Persistência.** Banco no volume local; **backups e arquivos fora da máquina**.
- **Limitações.** Ponto único de falha (máquina, zona, provedor); manutenção do host exige janela (reinício de kernel, atualização de PostgreSQL); picos competem por CPU entre web, API, banco e workers; recuperação de desastre é *restore* manual (RTO de horas, RPO igual ao intervalo do WAL arquivado, se bem configurado).

### Arquitetura B: serviços distribuídos de cloud

```text
Cliente ─► CDN ─► Load balancer ─► N instâncias stateless (Next.js + NestJS) em ≥2 zonas
                                       ├─► Banco gerenciado (primário + standby em outra zona; réplica de leitura)
                                       ├─► Object storage (uploads, relatórios gerados)
                                       ├─► Redis gerenciado (cache)
                                       └─► Fila ─► Workers independentes (escalam pelo tamanho da fila)
Observabilidade: métricas, logs e traces centralizados; alertas; backups gerenciados com PITR
```

- **Fluxo.** A CDN absorve estáticos e downloads; o balanceador distribui entre instâncias saudáveis; a API enfileira relatórios; *workers* consomem a fila e gravam o PDF no object storage; o cliente baixa por URL assinada.
- **Ganhos.** Sobrevive à perda de uma zona; escala a camada de aplicação e os *workers* de forma independente; banco com failover e backups gerenciados.
- **Custos.** Mais componentes, mais configuração (redes, IAM, políticas), mais custo fixo e variável, tracing/observabilidade obrigatórios para diagnosticar falhas que agora atravessam serviços.

### Comparação

| Critério | A: VPS | B: cloud distribuída |
|---|---|---|
| **Complexidade** | Baixa; poucos componentes e uma máquina para entender | Alta; muitas peças, IAM, redes, filas |
| **Custo** | Previsível e baixo; pago mesmo quando ocioso | Variável; custo mínimo maior (balanceador, banco multi-zona, NAT, logs), escala com uso |
| **Manutenção** | Sua: SO, patches, banco, backups | Dividida: o provedor opera parte da pilha; você opera configuração e integração |
| **Desempenho** | Excelente em carga moderada (tudo na mesma máquina, sem saltos de rede) | Bom e escalável, mas com latência de rede entre componentes |
| **Disponibilidade** | Limitada pela máquina única; recuperação é manual | Pode sobreviver à perda de uma zona, **se** projetada e testada para isso |
| **Escalabilidade** | Vertical, com teto | Horizontal na camada *stateless*; o banco continua sendo o ponto difícil |
| **Segurança** | Sua responsabilidade integral (hardening, patches); superfície pequena | Responsabilidade compartilhada; recursos (IAM, KMS, auditoria) maiores, e erros de configuração também |
| **Dependência de provedor** | Baixa (Docker + Linux portam fácil) | Maior, proporcional ao uso de serviços proprietários |
| **Operação** | Pouco complexa até o dia do incidente grave | Mais complexa no dia a dia, com mais instrumentos para incidentes |

**Nenhuma é vencedora universal.** A resposta depende de quanto custa uma hora de indisponibilidade para o negócio, do perfil de carga, de quem opera e do orçamento. Um e-commerce com pico sazonal e SLA contratual tende a B; um sistema administrativo de uma empresa com 200 usuários em horário comercial tende a A (**interpretação**).

## O custo real da cloud

Os componentes principais:

- **Computação** (instâncias, contêineres, funções), cobrada por tempo ou por uso.
- **Armazenamento** (volumes, arquivos, objetos) por GB-mês, mais **requisições**.
- ***Egress*** (saída de dados para a internet) e **transferência entre regiões e entre zonas**, a linha que mais surpreende. A página de preços do EC2 informa 100 GB/mês de transferência para a internet gratuitos, agregados entre serviços (exceto China e GovCloud); acima disso há tarifas por faixa que dependem da região.
- **Balanceadores**, **NAT**, **IPs públicos**, **DNS**.
- **Serviços gerenciados** (banco, cache, fila), que embutem o custo de operação e de redundância.
- **Backups e snapshots**, retenção e cópias entre regiões.
- **Observabilidade, logs e monitoramento**, tipicamente cobrados por volume ingerido e retido.
- **Manutenção e tempo de engenharia**: o item que não aparece na fatura.

**TCO (*Total Cost of Ownership*)** é a soma de tudo isso ao longo da vida do sistema: custo de aquisição/assinatura, operação, pessoas, incidentes, migração futura e o **custo de oportunidade** de a equipe cuidar de infraestrutura em vez de produto. Comparar o preço de uma VPS com o preço de uma instância equivalente de cloud é uma comparação incompleta; a comparação certa é arquitetura contra arquitetura, incluindo gente.

**Como uma arquitetura distribuída fica mais cara para uma aplicação pequena.** Aritmética de custos fixos, sem números de preço: A tem um custo (a VPS). B tem a soma do custo *mínimo* de cada serviço necessário para ser B: duas ou mais instâncias de aplicação (para ter sentido a redundância), um balanceador, um banco multi-zona, NAT/rede, observabilidade e backups. Esse piso existe mesmo com tráfego quase zero; o benefício (disponibilidade, elasticidade) só se paga se o negócio *usa* essas propriedades.

**Quando serviços gerenciados reduzem custo e risco.** Quando o custo de um incidente ou de um dia de engenheiro é maior que a diferença de preço. Operar PostgreSQL com replicação, *failover*, backups com PITR testados e atualizações exige competência e atenção contínuas; um banco gerenciado transfere parte disso. O mesmo vale para object storage em vez de operar um cluster próprio.

**Preço com condições (exemplo do R2).** A página oficial de preços do Cloudflare R2, consultada em 31/10/2026 (a própria página indicava atualização em 30/10/2026), lista para a classe **Standard**: armazenamento a **US$ 0,015 por GB-mês**, operações **Classe A** (escrita/listagem, ex.: `PutObject`, `ListObjects`, `CreateMultipartUpload`) a **US$ 4,50 por milhão**, operações **Classe B** (leitura, ex.: `GetObject`, `HeadObject`) a **US$ 0,36 por milhão**, e **sem cobrança de *egress*** (a página adverte que outros serviços medidos conectados ao bucket podem cobrar). Um cálculo **hipotético** só de armazenamento: 500 GB em Standard = 500 × 0,015 = **US$ 7,50 por mês**, sem contar operações. Esse número vale apenas com essas condições (classe Standard, sem *Infrequent Access*, sem operações, sem impostos), e preços mudam; **consulte a tabela vigente antes de decidir**. Não comparei preços de S3/GCS aqui porque as tabelas oficiais de egress dependem de região e faixa e não pude extraí-las de forma verificável na consulta; a comparação correta para o seu caso deve usar a calculadora do provedor, com a sua região.

## Estratégia de evolução arquitetural

Arquitetura evolutiva significa **começar simples e deixar as fronteiras certas no lugar**, para que mudar custe pouco quando o requisito aparecer. Uma sequência plausível, em que cada degrau só é dado quando um requisito mensurável o justifica:

1. **Monólito modular em uma VPS**, com módulos internos bem delimitados (contas, cobrança, documentos), migrações versionadas e testes. Já nesta etapa:
   - **arquivos em object storage** desde o início (barato de fazer cedo, caro de migrar tarde);
   - **sessões e estado fora do processo** (cookie assinado/Redis), para que a aplicação seja *stateless*;
   - **backups externos com restauração testada**.
2. **Trabalho assíncrono**: *workers* e fila (no começo, uma tabela no PostgreSQL ou Redis) para relatórios e e-mails, tirando trabalho pesado do caminho da requisição.
3. **Separar o banco da máquina de aplicação**, para um host próprio ou serviço gerenciado, quando a disputa por recursos ou a necessidade de failover aparecer.
4. **Segunda instância de aplicação + balanceador**, o que só é possível se a etapa 1 foi feita corretamente.
5. **Alta disponibilidade do banco e réplicas de leitura**, quando RPO/RTO ou leitura pesada exigirem.
6. **Recuperação de desastres entre regiões** (*pilot light*, *warm standby* etc., as estratégias do whitepaper da AWS), quando a perda de uma região for um cenário que o negócio precise suportar.

**Microsserviços e Kubernetes não são evolução obrigatória.** A própria documentação do Kubernetes diz o que ele não é: não é um PaaS completo, não constrói nem implanta seu código-fonte e **não fornece bancos de dados, caches nem sistemas de armazenamento como serviços nativos**; ele orquestra contêineres. Faz sentido quando o número de serviços, equipes e implantações independentes torna a orquestração manual o gargalo. Separar um serviço resolve um problema real quando há **escala independente** (um componente com perfil de carga muito diferente), **isolamento de falhas** (um módulo instável não pode derrubar os demais), **ciclos de deploy e equipes independentes** ou **tecnologias distintas por necessidade**. Quando nada disso existe, só se troca chamada de função por chamada de rede, ganhando latência, falhas parciais, versionamento de contratos e depuração distribuída. (O artigo sobre [microsserviços](/pt/blog/microsservicos-quando-fazem-sentido) e o de [escalabilidade](/pt/blog/escalabilidade-de-sistemas) aprofundam essa decisão.)

Uma regra prática (**opinião**): trate cada degrau como resposta a um número que você mediu (latência p95, saturação de CPU, tempo de restauração, custo de uma hora fora do ar), não a uma tendência.

## Perguntas frequentes

**Uma VPS aguenta quantos usuários?**
Não existe número. Depende de requisições por segundo, custo de cada requisição, tamanho dos dados e eficiência das consultas. Meça a utilização de CPU, memória, I/O e conexões em carga real e faça testes de carga com o seu perfil de acesso.

**Banco gerenciado é sempre melhor que PostgreSQL na própria VPS?**
Não. Reduz trabalho operacional (failover, backup, atualização) e custa mais, com menos controle fino. Se a equipe sabe operar, tem backups com PITR testados e tolera o RTO de um restore, o PostgreSQL na VPS é uma escolha defensável.

**Posso começar na VPS e migrar depois?**
Sim, desde que as fronteiras estejam certas: aplicação sem estado local, arquivos em object storage, configuração externalizada, migrações versionadas e backups restauráveis. O que torna a migração cara é o acoplamento, não a VPS.

**Replicação substitui backup?**
Não. A replicação copia também o erro (um `DELETE` indevido, uma corrupção). Backup com ponto no tempo e versionamento protegem contra isso; replicação protege contra falha de máquina.

## Conclusão

Infraestrutura é um conjunto de promessas que você compra e que precisa operar: disponibilidade, durabilidade, capacidade, recuperação. Cada promessa tem preço, em dinheiro e em complexidade, e só vale pagar pelas que o sistema usa. Uma VPS bem administrada promete pouco e cumpre com custo baixo; a cloud promete muito e cobra em componentes, configuração e conta.

A decisão defensável é aquela que você consegue **justificar com requisitos**: qual RPO, qual RTO, qual pico, qual orçamento de incidente, quem vai operar. Se você consegue enunciar o requisito que uma VPS não atende, você tem a razão para o próximo degrau. Se não consegue, o que você tem é uma preferência. E, nos dois casos, o que protege o sistema não é a quantidade de serviços, e sim os fundamentos que valem em qualquer infraestrutura: consultas eficientes, estado fora da máquina de aplicação, backups restaurados de verdade, monitoramento que avisa antes do usuário e uma arquitetura que sua equipe entende por inteiro.

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura. Todas as páginas foram consultadas em 31/10/2026; preços, SLAs e estado de projetos mudam, então confirme na fonte antes de decidir. Os experimentos (esquema SQL, consulta com e sem índice, `docker compose config`, `nginx -t` e geração de URL assinada) foram executados localmente e os números ilustram o mecanismo; não representam benchmark.

- Knuth, D. E. *Structured Programming with go to Statements*. ACM Computing Surveys, 6(4), 1974 (referência bibliográfica; não consegui abrir uma página oficial para verificar, por isso não incluo URL).
- NIST, [SP 800-145: The NIST Definition of Cloud Computing](https://csrc.nist.gov/pubs/sp/800/145/final)
- AWS, [Modelo de responsabilidade compartilhada](https://aws.amazon.com/compliance/shared-responsibility-model/)
- AWS, [Reliability Pillar: Design principles](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/design-principles.html)
- Google Cloud, [Well-Architected Framework: Reliability](https://docs.cloud.google.com/architecture/framework/reliability)
- Microsoft, [Azure Well-Architected Framework: Reliability design principles](https://learn.microsoft.com/en-us/azure/well-architected/reliability/principles)
- AWS, [Disaster recovery options in the cloud](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html)
- AWS, [Amazon EC2 Service Level Agreement](https://aws.amazon.com/compute/sla/)
- AWS, [Amazon RDS: Multi-AZ DB instance deployments](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html)
- AWS, [Amazon EC2 Auto Scaling: Auto Scaling groups](https://docs.aws.amazon.com/autoscaling/ec2/userguide/auto-scaling-groups.html)
- AWS, [What is Elastic Load Balancing?](https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html)
- AWS, [What is Amazon EBS?](https://docs.aws.amazon.com/ebs/latest/userguide/what-is-ebs.html)
- AWS, [What is Amazon EFS?](https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html)
- AWS, [What is Amazon S3?](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) e [Data protection in Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/DataDurability.html)
- AWS, [S3 presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html), [Multipart upload](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html), [Versioning](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html) e [Lifecycle](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- AWS, [Amazon EC2 On-Demand Pricing](https://aws.amazon.com/ec2/pricing/on-demand/) (seção de transferência de dados)
- Google Cloud, [Cloud Storage consistency](https://docs.cloud.google.com/storage/docs/consistency)
- Cloudflare, [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [R2 consistency model](https://developers.cloudflare.com/r2/reference/consistency/) e [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- MinIO, [repositório oficial no GitHub](https://github.com/minio/minio) (estado do projeto na data de consulta)
- PostgreSQL Documentation 17, [TOAST](https://www.postgresql.org/docs/17/storage-toast.html), [Large Objects](https://www.postgresql.org/docs/17/largeobjects.html), [Continuous Archiving and PITR](https://www.postgresql.org/docs/17/continuous-archiving.html), [High Availability, Load Balancing, and Replication](https://www.postgresql.org/docs/17/different-replication-solutions.html) e [Connection Settings](https://www.postgresql.org/docs/17/runtime-config-connection.html)
- Redis, [Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
- Docker, [Compose in production](https://docs.docker.com/compose/how-tos/production/) e [Volumes](https://docs.docker.com/engine/storage/volumes/)
- Kubernetes, [Overview](https://kubernetes.io/docs/concepts/overview/)
