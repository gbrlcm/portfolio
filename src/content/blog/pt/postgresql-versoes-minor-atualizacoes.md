---
title: "PostgreSQL 18.1, 18.6 e as versões minor: por que atualizações pequenas importam"
description: "O que é uma versão minor do PostgreSQL, o que as releases 18.1 a 18.6 corrigiram, por que a 18.5 nunca saiu, por que minor não exige dump/restore e como planejar e acompanhar atualizações em produção."
pubDate: 2026-10-31T12:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/postgresql-versoes-minor-atualizacoes.webp"
coverAlt: "Linha do tempo das versões 18.1 a 18.6 do PostgreSQL com a 18.5 riscada como nunca publicada"
category: "Banco de Dados"
tags:
  - "PostgreSQL"
  - "PostgreSQL 18"
  - "Segurança"
  - "Atualizações"
  - "Operação"
  - "Banco de Dados"
  - "Série PostgreSQL por Dentro"
draft: false
lang: "pt-BR"
translationKey: "postgres-minor-releases"
---

"Está rodando, não vou mexer." É a resposta mais comum quando alguém propõe atualizar um PostgreSQL de produção de 18.1 para uma versão mais nova da série 18. É também uma decisão que merece ser tomada com informação, porque a diferença entre 18.1 e 18.6 não é cosmética: são quatro rodadas de correções (18.2, 18.3, 18.4 e 18.6), dezenas de vulnerabilidades documentadas e pelo menos três avisos de "faça isto depois de atualizar".

Este é o sétimo artigo da série *PostgreSQL por Dentro*. Ele usa o histórico oficial da série 18 como material de estudo: o que significa cada número, o que as versões corrigiram, por que uma delas nunca foi publicada e como planejar atualizações sem transformar uma manutenção de rotina em incidente.

> **Sobre as datas.** Este artigo foi escrito em **31/10/2026**. Todas as versões citadas abaixo (18.1, 18.2, 18.3, 18.4 e 18.6) constam nas notas de versão oficiais como já publicadas; a 18.5 consta como **nunca publicada**. A rodada agendada para 12/11/2026 ainda **não ocorreu** e é tratada aqui como planejada. O PostgreSQL 19 aparece na página oficial apenas como *release candidate* (RC 1, 15/10/2026), e não como versão final.

> Este artigo é um estudo baseado nas notas de versão, na política de versionamento e na página de segurança do projeto. Trechos marcados como opinião refletem a minha leitura. As referências estão no final.

## Major versus minor: o que o número diz

Desde o PostgreSQL 10, o número tem **duas partes**: `maior.menor`. Em `18.6`, 18 é a versão **major** e 6 é a **minor**. (Antes do 10 eram três partes, e a "major" era a combinação das duas primeiras, como em 9.6.)

| | Major (ex.: 17 → 18) | Minor (ex.: 18.1 → 18.6) |
|---|---|---|
| Cadência | uma por ano | pelo menos a cada três meses |
| Conteúdo | recursos novos, mudanças de comportamento | correções de bugs, de segurança e de corrupção de dados |
| Formato de armazenamento | **pode mudar** | **nunca muda** |
| Como atualizar | `pg_upgrade`, dump/restore ou replicação lógica | trocar os binários e reiniciar |

A documentação de atualização é direta: "versões minor nunca alteram o formato interno de armazenamento e são sempre compatíveis com versões minor anteriores e posteriores da mesma major"; e "para atualizar entre versões compatíveis, basta substituir os executáveis com o servidor parado e reiniciá-lo. O diretório de dados permanece inalterado". É por isso que **minor não exige dump/restore nem migração de dados**: o formato em disco é o mesmo.

A política de versionamento do projeto acrescenta o conteúdo esperado de uma minor: "apenas correções de bugs frequentemente encontrados, correções de baixo risco, problemas de segurança e problemas de corrupção de dados". E a recomendação: "sempre rodar a minor corrente da sua major"; a comunidade considera "fazer atualizações minor menos arriscado do que continuar rodando uma minor antiga".

Na prática, isso significa que **18.1 não é "um lançamento menor com novidades"**: é a primeira rodada de correções depois do lançamento inicial (18.0) e não traz funcionalidade nova. O que mudou da 18.0 para a 18.1 foram, entre outras coisas, duas vulnerabilidades (abaixo).

### O calendário

O projeto publica minors em datas pré-definidas: por padrão, a **segunda quinta-feira de fevereiro, maio, agosto e novembro**. Rodadas fora do calendário acontecem "se a equipe determinar que uma correção crítica de bug ou de segurança é importante demais para esperar".

<figure>
  <img src="/images/blog/postgresql-versoes-minor-atualizacoes-diagrama.webp" alt="Linha do tempo com as versões 18.0 (25/09/2025), 18.1 (13/11/2025), 18.2 (12/02/2026), 18.3 (26/02/2026), 18.4 (14/05/2026), 18.5 (não publicada) e 18.6 (13/08/2026), com o destaque de cada uma." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>A série 18 até a 18.6. Fonte: notas de versão e política de versionamento em postgresql.org, consultadas em 31/10/2026. Diagrama do autor.</figcaption>
</figure>

## O histórico da série 18, versão a versão

Fonte: notas de versão oficiais de cada release, lidas diretamente nas páginas do projeto.

| Versão | Data | Destaques (apenas o que consta nas notas) |
|---|---|---|
| **18.0** | 25/09/2025 | lançamento inicial |
| **18.1** | 13/11/2025 | 2 CVEs: `CREATE STATISTICS` não checava o privilégio `CREATE` no schema (CVE-2025-12817); estouro de inteiro em cálculo de alocação na libpq (CVE-2025-12818). Correções de *crash* em tabelas particionadas com triggers, de *use-after-free* no cache de sincronização do `pgoutput`, de dimensionamento de hash joins; `write_lag`/`flush_lag` de `pg_stat_replication` voltam a atualizar; BRIN com autossumarização para índices com expressões que exigem snapshot |
| **18.2** | 12/02/2026 | 5 CVEs (CVE-2026-2003 a 2007), incluindo estimadores de seletividade da `contrib/intarray` abusáveis para execução de código (agora exigem superusuário para anexar estimadores não nativos a operadores) e *buffer overrun* em `pgcrypto`. Pode exigir **reindexar índices em colunas `ltree`** |
| **18.3** | 26/02/2026 | publicada duas semanas após a 18.2. Corrige falha de *replay* de WAL de truncamento de multixid gerado por minor mais antiga (cenário típico: *standby* na última minor consumindo WAL de primário em versão anterior) e dois ajustes em correções de segurança da 18.2 (uma do CVE-2026-2006 que era "agressiva demais" e erra com `substring()` em dados *toasted*, e outra do CVE-2026-2007 no `pg_trgm`) |
| **18.4** | 14/05/2026 | 11 CVEs (CVE-2026-6472 a 6479, 6575, 6637, 6638); entre eles, recursão ilimitada no processamento de pacotes de inicialização que permitia a um cliente malicioso derrubar o *backend* (CVE-2026-6479), estouros de inteiro em alocações (CVE-2026-6473), SQL injection em `pg_createsubscriber`, *path traversal* em `pg_basebackup` e `pg_rewind`. Dezenas de correções, entre elas várias em colunas geradas virtuais |
| **18.5** | **nunca publicada** | segundo as notas da 18.6: "devido a uma regressão descoberta após o empacotamento" |
| **18.6** | 13/08/2026 | dezenas de CVEs (a tabela de CVEs nas notas inclui, por exemplo, CVE-2026-6471, 14662 a 14681, 15741, 15742, 16238, 16239, 16241, 18024, 18408 e 19385), com **três entradas de segurança que exigem ajustes de configuração ou limpeza de dados** depois de atualizar |

A página de segurança do projeto lista, para 2026, mais de 40 entradas (nem todas afetam todas as séries nem todos os componentes). Os escores CVSS v3 exibidos vão de 3,7 a 8,8; várias das entradas de 8,8 são casos de "buffer overflow executa código arbitrário" ou "type confusion". Parte das entradas afeta o servidor (por exemplo, `to_char()`, expressões regulares, `tsvector`) e parte afeta **ferramentas de cliente** (`psql`, `pg_dump`, `libpq`, `ecpg`), como mostram os títulos listados. A página distingue o que considera vulnerabilidade: acesso a privilégios ou dados indevidos, ou execução de código por um processo do PostgreSQL. Ações de superusuário não contam como vulnerabilidade, mas a escalada de usuário comum a superusuário conta.

### Quando uma minor exige trabalho depois do `restart`

A afirmação "minor é só trocar binário" é verdadeira para o formato de dados, mas as notas mostram que algumas minors pedem **ações adicionais**. Três exemplos reais da série 18:

1. **18.2 → reindexar `ltree`.** A seção de migração diz que, se houver índices em colunas `ltree`, "pode ser necessário reindexá-los".
2. **18.6 → `output_plugin_libraries`.** A correção do CVE-2026-6471 (replicação podia carregar qualquer biblioteca como *plugin* de saída de decodificação lógica) introduz o parâmetro `output_plugin_libraries`. Confirmei que o padrão no 18.6 é `pgoutput, test_decoding`. Se você usa um plugin de decodificação de terceiros (por exemplo, para CDC), precisa adicioná-lo à lista, senão a decodificação lógica vai falhar. As notas dizem ainda que `pg_upgrade --check` falha se o cluster novo não permitir plugins usados por slots lógicos do cluster antigo (versões 17 em diante).
3. **18.6 → `reltuples` inválido em tabelas com GIN.** Índices GIN construídos em paralelo podem ter deixado `reltuples` com valores absurdos (infinito ou NaN), o que pode **impedir o autovacuum e o autoanalyze** da tabela. As notas trazem uma consulta de verificação, e a correção é rodar `ANALYZE`. Executei a consulta no meu 18.6 de laboratório (sem GIN) apenas para validar a sintaxe:

```sql
SELECT DISTINCT t.oid::regclass, t.reltuples
FROM pg_class t
  JOIN pg_index i  ON t.oid = i.indrelid
  JOIN pg_class ic ON i.indexrelid = ic.oid
WHERE t.relhasindex AND ic.relam = 2742;   -- 2742 = oid do método de acesso gin
```

Outros itens de pós-atualização da 18.6: reindexar índices `btree_gist` com colunas `float` se houver `NaN` e com `bit`/`varbit`; reindexar `ltree` com valores de mais de ~14.653 rótulos; e scripts de `psql` com `COPY ... FROM STDIN` falho passam a exigir uma linha com `\.` (parte da correção do CVE-2026-6464).

> **Opinião:** a lição dessas notas é que "só uma minor" não dispensa a leitura da seção *Migration* de **cada versão entre a sua e a destino**. Se você pula da 18.1 para a 18.6, as instruções da 18.2 (ltree) continuam valendo (as notas da 18.3, 18.4 e 18.6 apontam para ela com "se você está atualizando de uma versão anterior à 18.2, veja a Seção E.4").

## Por que a 18.5 não existe, e o que isso ensina

A nota é curta: a 18.5 "nunca foi publicada, devido a uma regressão descoberta após o empacotamento" (*post-wrap*). Ou seja: o pacote da versão já havia sido gerado quando se encontrou um problema, e o projeto optou por não distribuí-la; a correção saiu como 18.6.

Há duas lições práticas:

- **Números de versão não são contínuos.** Scripts que assumem que "se existe a 18.6, existiram as 18.5, 18.4..." podem tropeçar. Não monte inventários nem testes de compatibilidade sobre sequências supostas.
- **O processo de release do projeto descarta versões ruins em vez de distribuí-las.** A 18.3, publicada duas semanas após a 18.2, mostra a mesma disciplina por outro ângulo: ela existe para corrigir uma falha de replay causada por um truncamento de multixid e dois ajustes das correções de segurança anteriores. Isso reforça o argumento a favor de ficar perto da versão mais recente, e não o contrário.

## Como planejar uma atualização minor em produção

O que as fontes oficiais garantem é compatibilidade de armazenamento e a recomendação de usar a minor corrente. O processo operacional é responsabilidade sua; o que segue é a minha recomendação, e a distingo do que é regra do projeto.

### 1. Saiba onde você está

```sql
SHOW server_version;           -- ex.: 18.6 (Homebrew)
SHOW server_version_num;       -- 180006: major*10000 + minor, desde a versão 10
SELECT version();              -- inclui plataforma e compilador
```

Verifique também as versões de extensões (`SELECT * FROM pg_extension;`) e dos clientes (`psql --version`, drivers com libpq embutida): várias correções afetam o **lado cliente**, como `psql`, `pg_dump` e `libpq`.

### 2. Leia as notas de migração do intervalo inteiro

Para cada versão entre a atual e a destino, leia a seção "Migration" e os itens marcados com ações. Procure: reindexações, novos parâmetros, mudanças de comportamento e alterações em ferramentas de cliente.

### 3. Teste em ambiente equivalente

Suba um staging com os mesmos binários, extensões e configuração, restaure dados representativos e rode a suíte de testes e as consultas críticas. Minors raramente quebram aplicações, mas as notas acima mostram exceções (plugins de decodificação, scripts `psql`).

### 4. Ordem em clusters com réplicas

Não há, na documentação de atualização consultada, uma regra oficial para a ordem entre primário e réplicas em minors. O episódio da 18.3 é instrutivo: uma falha de *replay* podia ocorrer exatamente quando um *standby* **já na minor mais nova** consumia WAL de um **primário ainda na antiga**. Por isso, em vez de assumir "réplicas primeiro" ou "primário primeiro", leia as notas das versões envolvidas, procure avisos sobre replay de WAL entre minors, e prefira janelas curtas em que a diferença de versões entre primário e réplicas dure o mínimo possível.

### 5. Execute: parar, trocar binários, reiniciar

Para um servidor único, é um `restart` e portanto uma indisponibilidade curta; em clusters com alta disponibilidade, um *switchover* ou atualização em rolling reduz o impacto, conforme a ferramenta que você usa (não detalho aqui; consulte a documentação dela). Garanta que conexões em andamento terminem de forma controlada.

### 6. Pós-atualização

- Confirme `server_version`.
- Execute as ações das notas (reindexar, `ANALYZE`, ajustar `output_plugin_libraries`).
- Acompanhe os logs por erros novos e verifique replicação (`pg_stat_replication`, lag).
- Verifique extensões que exigem `ALTER EXTENSION ... UPDATE` (apenas quando a própria extensão trouxer versão nova).

### 7. Reversão

A documentação garante compatibilidade do armazenamento com minors anteriores e posteriores, o que torna uma reversão de binários possível em princípio, mas eu não a testei e as ações de pós-atualização (como uma reindexação) podem ser afetadas. Tenha backup e plano de restore testado antes de qualquer mudança.

## Como acompanhar os avisos oficiais

- **Notas de versão** (`postgresql.org/docs/release/`): fonte primária de cada minor, com a data e a seção "Migration".
- **Roadmap** (`postgresql.org/developer/roadmap/`): datas planejadas das próximas minors. Em 31/10/2026, as listadas são 12/11/2026, 11/02/2027, 13/05/2027 e 12/08/2027.
- **Política de versionamento** (`postgresql.org/support/versioning/`): tabela com a minor corrente e o fim de suporte de cada major. Em 31/10/2026: 18 (18.6, até 14/11/2030), 17 (17.11, até 08/11/2029), 16 (16.15, até 09/11/2028), 15 (15.19, até 11/11/2027) e **14 (14.24, até 12/11/2026)**.
- **Segurança** (`postgresql.org/support/security/`): lista de CVEs com escores CVSS v3 e links para os anúncios. O projeto é uma CNA (*CVE Numbering Authority*) e pede que vulnerabilidades sejam reportadas a `security@postgresql.org`.
- **Lista `pgsql-announce`**: a página de segurança recomenda assiná-la e selecionar a tag **Security** para receber só avisos de segurança.

Um detalhe observado: o pacote do Homebrew da série 17 que usei nos experimentos estava na **17.10**, enquanto a página oficial já listava a **17.11** como corrente. Distribuições e gerenciadores de pacotes têm seu próprio ritmo; confirme com `SHOW server_version` o que você de fato está rodando, em vez de assumir que o "latest" do gerenciador é o mais novo do projeto.

## Armadilhas comuns

- **"Estável, não mexe."** Uma minor antiga mantém vulnerabilidades já corrigidas e conhecidas publicamente. A política do projeto diz que correções de segurança só saem para versões suportadas.
- **Atualizar sem ler a seção *Migration*.** Foi o que as notas da 18.2 e da 18.6 mostraram.
- **Ignorar o lado cliente.** Várias CVEs de 2026 são em `psql`, `pg_dump` e `libpq`.
- **Assumir sequência contínua de versões.** A 18.5 não existe.
- **Misturar versões de primário e réplicas por tempo indeterminado.**
- **Achar que "sem dump/restore" significa "sem teste".**
- **Confundir minor com major.** A 18 não vira 19 por atualização de pacote; major exige `pg_upgrade`, dump/restore ou replicação lógica.
- **Esquecer o fim de suporte da major.** A 14 deixa de receber correções em 12/11/2026, segundo a tabela oficial.

## Perguntas frequentes

**18.1 é muito diferente de 18.0?**
Não em recursos: é a primeira rodada de correções. Mas inclui correções de segurança e de falhas (por exemplo, nas áreas de partições, decodificação lógica e hash joins).

**Minor release exige downtime?**
Exige um reinício do servidor (portanto uma interrupção curta num servidor único); não exige migração de dados.

**Posso pular versões minor?**
Sim, a compatibilidade vale entre quaisquer minors da mesma major, mas leia as notas de migração de todas as versões intermediárias.

**Por que a 18.5 não foi lançada?**
Segundo as notas da 18.6, por uma regressão descoberta depois que o pacote foi gerado.

**Como saber se uma CVE afeta minha versão?**
Pela página de segurança (filtro por major) e pelas notas de versão; os escores CVSS indicam gravidade, não a aplicabilidade ao seu ambiente.

**O PostgreSQL 19 já saiu?**
Não na data deste artigo: a página oficial mostrava a RC 1 (15/10/2026).

## Conclusão

A diferença entre rodar a 18.1 e rodar a 18.6 não é a diferença entre "versão antiga" e "versão nova": é a diferença entre um servidor com quatro rodadas adicionais de correções de segurança e de integridade aplicadas e um sem elas. O projeto fez a parte difícil, que é manter compatibilidade de armazenamento entre minors e documentar o que exige ação. A sua parte é operacional: saber a versão que roda, ler as notas do intervalo, testar, seguir uma ordem consciente em clusters com réplicas e acompanhar os avisos oficiais. O próximo artigo volta à teoria com um tema que gera erros silenciosos em qualquer aplicação SQL: [o NULL e a lógica de três valores](/pt/blog/null-logica-tres-valores-sql).

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura. Consultadas em 31/10/2026.

- PostgreSQL Project, [Versioning Policy](https://www.postgresql.org/support/versioning/)
- PostgreSQL Project, [Release notes (índice)](https://www.postgresql.org/docs/release/) e [Developer Roadmap](https://www.postgresql.org/developer/roadmap/)
- PostgreSQL Documentation, notas de versão [18.1](https://www.postgresql.org/docs/release/18.1/), [18.2](https://www.postgresql.org/docs/release/18.2/), [18.3](https://www.postgresql.org/docs/release/18.3/), [18.4](https://www.postgresql.org/docs/release/18.4/) e [18.6](https://www.postgresql.org/docs/release/18.6/)
- PostgreSQL Documentation 18, [18.6. Upgrading a PostgreSQL Cluster](https://www.postgresql.org/docs/18/upgrading.html)
- PostgreSQL Project, [Security Information](https://www.postgresql.org/support/security/)
- PostgreSQL Documentation 18, [19.3. Preset Options (`server_version_num`)](https://www.postgresql.org/docs/18/runtime-config-preset.html)
