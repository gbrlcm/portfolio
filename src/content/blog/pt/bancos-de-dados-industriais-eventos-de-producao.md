---
title: "Bancos de dados industriais: eventos de produção em escala"
description: "Modelagem de fábrica em PostgreSQL, particionamento, BRIN, retenção, séries temporais e historiadores, com SQL para paradas, produtividade e OEE."
pubDate: 2026-10-31T12:30:00-03:00
author: "Gabriel Campos"
category: "Banco de Dados"
tags:
  - "PostgreSQL"
  - "Séries Temporais"
  - "TimescaleDB"
  - "InfluxDB"
  - "Historian"
  - "OEE"
  - "Série Automação Industrial"
draft: false
lang: "pt-BR"
---

Uma única máquina que reporta o estado a cada segundo gera 86.400 registros por dia. Dez máquinas, cada uma com vinte variáveis de processo amostradas a cada segundo, geram mais de 17 milhões de pontos por dia. Esses números são aritmética simples, não benchmark, e mostram por que dados industriais exigem decisões de engenharia de dados que um CRUD não exige.

Este é o oitavo artigo da série. Depois de ver [quem produz e consome dados](/pt/blog/mes-erp-scada-historian-diferencas-e-integracao) e [como eles chegam](/pt/blog/protocolos-industriais-opc-ua-modbus-mqtt), vamos ver como armazená-los e consultá-los.

## Tipos de dado numa fábrica

Misturar tudo numa única tabela é o erro mais comum. Há pelo menos cinco naturezas de dado, com requisitos diferentes:

1. **Dados mestres:** máquinas, linhas, produtos, receitas. Poucos, mudam devagar, precisam de integridade.
2. **Dados transacionais de produção:** ordens, lotes, apontamentos, genealogia. Volume moderado, consistência forte, auditoria.
3. **Eventos de máquina:** mudanças de estado, paradas, alarmes. Volume médio a alto, ordenados no tempo.
4. **Telemetria / séries temporais:** valores de sensores em alta frequência. Volume muito alto, escrita contínua apenas de acréscimo, consultas por intervalo.
5. **Dados analíticos derivados:** agregados por hora, turno, dia, usados em painéis e relatórios.

Essa classificação é uma ferramenta de raciocínio (opinião), não uma norma. Cada classe sugere uma estratégia de armazenamento diferente.

## Onde cada tecnologia se encaixa

**Banco relacional (PostgreSQL, SQL Server, Oracle).** O lugar natural de dados mestres, ordens, lotes e rastreabilidade: integridade referencial, transações, consultas ad hoc. O PostgreSQL também aguenta eventos e telemetria até certa escala, desde que se usem particionamento e índices adequados.

**Historiadores industriais.** Produtos desenhados para tags de processo, com compressão, interpolação e conectores para controladores e SCADA. Já vimos no artigo 05 que, no AVEVA PI, o dado passa por *exception reporting* na interface e por compressão *swinging door* no arquivo, o que significa que o que se consulta pode ser uma reconstrução do sinal. São produtos proprietários, com ecossistema próprio.

**Bancos de séries temporais.**

- **TimescaleDB** é uma extensão do PostgreSQL. Segundo a documentação, uma *hypertable* é uma tabela PostgreSQL particionada automaticamente por tempo (e opcionalmente por outras dimensões), dividida em *chunks* que cobrem faixas de tempo configuráveis; as consultas rodam apenas nos chunks relevantes. Mantém SQL e o ecossistema PostgreSQL. A sintaxe de criação e os recursos (compressão, agregados contínuos, políticas de retenção) têm mudado entre versões e há aspectos de licenciamento por edição; **verifique a documentação da versão que for usar**, pois não os detalho aqui.
- **InfluxDB** adota um modelo próprio. Na documentação da versão 3, a antiga *measurement* corresponde a uma tabela, as *tags* guardam metadados de identificação (como o `sensor_id`) e os *fields* guardam os valores medidos; as colunas de tags de uma tabela são imutáveis depois de definidas. Também existe a linguagem InfluxQL, projetada para o modelo da v1. Há diferenças significativas entre versões e edições do produto, então confirme na documentação o que cada uma suporta.

**Data lake / lakehouse.** Arquivos em formato colunar em armazenamento de objetos, consultados por motores analíticos. Faz sentido para histórico longo, análises entre plantas e treinamento de modelos, e menos para operação do dia a dia. Na minha leitura, é um destino para onde dados *derivados* ou *arquivados* fluem, não o primeiro lugar onde a produção grava.

Não há vencedor universal. A pergunta útil é: qual é a taxa de escrita, por quanto tempo guardo, que consultas preciso e quanto tempo de queda tolero?

## Modelando uma fábrica

Um modelo relacional mínimo para máquinas, linhas, produtos, lotes, ordens e eventos. Todo o SQL deste artigo foi executado em PostgreSQL 17 antes de publicar.

```sql
CREATE TABLE line    (id int PRIMARY KEY GENERATED ALWAYS AS IDENTITY, code text UNIQUE NOT NULL);
CREATE TABLE machine (id int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
                      line_id int NOT NULL REFERENCES line, code text UNIQUE NOT NULL,
                      ideal_cycle_s numeric NOT NULL CHECK (ideal_cycle_s > 0));
CREATE TABLE product (id int PRIMARY KEY GENERATED ALWAYS AS IDENTITY, sku text UNIQUE NOT NULL);
CREATE TABLE work_order (id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY, erp_no text UNIQUE NOT NULL,
                         product_id int NOT NULL REFERENCES product, qty_planned int NOT NULL);
CREATE TABLE lot (id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY, code text UNIQUE NOT NULL,
                  work_order_id bigint NOT NULL REFERENCES work_order);

-- eventos de estado de máquina, particionados por mês
CREATE TABLE machine_event (
  machine_id int NOT NULL REFERENCES machine,
  ts         timestamptz NOT NULL,
  state      text NOT NULL CHECK (state IN ('RUNNING','STOPPED','FAULT')),
  reason     text,
  PRIMARY KEY (machine_id, ts)           -- inclui a chave de partição
) PARTITION BY RANGE (ts);
CREATE TABLE machine_event_2026_03 PARTITION OF machine_event
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- contagens de produção, com BRIN no tempo
CREATE TABLE production_count (
  machine_id int NOT NULL REFERENCES machine, lot_id bigint NOT NULL REFERENCES lot,
  ts timestamptz NOT NULL, qty_good int NOT NULL, qty_scrap int NOT NULL DEFAULT 0,
  PRIMARY KEY (machine_id, ts)
) PARTITION BY RANGE (ts);
CREATE TABLE production_count_2026_03 PARTITION OF production_count
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE INDEX ON production_count USING brin (ts);
```

Algumas decisões que valem explicação:

- **Chave natural `(machine_id, ts)`** como chave primária: evita duplicatas quando a mesma leitura é reenviada (idempotência, discutida nos artigos 06 e 07). Com `INSERT ... ON CONFLICT DO NOTHING`, o reenvio é inofensivo.
- **A chave primária inclui a coluna de partição.** É uma limitação documentada do PostgreSQL: restrições de unicidade em tabelas particionadas precisam conter todas as colunas da chave de partição.
- **Eventos de estado, não estado atual.** Gravamos transições (do tipo "passou para STOPPED às 10:00") e derivamos intervalos. É mais compacto que amostrar o estado a cada segundo e preserva o histórico.
- **Granularidade da contagem.** Aqui as contagens são por hora, uma simplificação. Em produção, a granularidade (por ciclo, por minuto, por lote) é decisão que afeta volume e qualidade das análises.
- **Uma tabela de eventos e outra de contagens**, em vez de uma tabela genérica de "leituras", para que os tipos, restrições e índices reflitam o significado de cada dado.

### Particionamento

A documentação do PostgreSQL descreve três métodos declarativos: por faixa (*range*), por lista e por *hash*. Para dados de tempo, o particionamento por faixa é o natural. Benefícios documentados:

- **Poda de partições:** consultas com filtro de tempo ignoram partições que não podem conter linhas relevantes.
- **Retenção barata:** descartar um mês com `DROP TABLE` ou `ALTER TABLE ... DETACH PARTITION` evita o `DELETE` em massa e o custo de `VACUUM` associado.
- **Movimentação para armazenamento mais barato** de partições antigas.

E um cuidado, também da documentação: partições demais aumentam o tempo de planejamento e o uso de memória; de menos, deixam índices grandes e pior localidade. A recomendação oficial é testar com carga simulada, e não presumir.

### Índices

Para séries temporais com inserção em ordem cronológica, o índice **BRIN** é uma opção interessante: ele guarda resumos por faixa de páginas e é muito pequeno, mas só é eficiente quando a coluna indexada tem correlação com a ordem física das linhas, como um timestamp de inserção. Não serve para busca pontual nem para garantir unicidade (para isso, B-tree). Em tabelas com carga fora de ordem ou com muitas atualizações, a correlação se perde. O parâmetro `pages_per_range` (padrão 128) controla o compromisso entre tamanho e precisão.

### Retenção

```sql
ALTER TABLE machine_event DETACH PARTITION machine_event_2026_03;
DROP TABLE machine_event_2026_03;
```

Com particionamento por mês, a política "guardar 24 meses de eventos detalhados e agregar o restante" vira rotina: criar a partição do mês seguinte e descartar ou arquivar a mais antiga. Uma advertência de negócio: **em setores regulados, o prazo de retenção de registros de rastreabilidade é definido por regulação e contrato, não por conveniência técnica.** A tabela de eventos de máquina e a de rastreabilidade de lotes podem ter regras diferentes.

## Consultas: paradas, disponibilidade, OEE

Os dados de exemplo (sintéticos) descrevem um turno de 8h: a máquina roda de 08:00 às 10:00, para por falta de rótulo até 10:20, roda até 13:00, entra em falha até 13:30, roda até as 16:00.

### Identificar paradas e suas durações

```sql
SELECT machine_id, state, reason, ts AS inicio, next_ts - ts AS duracao
FROM (SELECT machine_id, ts, state, reason,
             lead(ts) OVER (PARTITION BY machine_id ORDER BY ts) AS next_ts
      FROM machine_event
      WHERE ts >= '2026-03-02' AND ts < '2026-03-03') ev
WHERE state <> 'RUNNING' AND next_ts IS NOT NULL
ORDER BY ts;
```

Resultado:

```text
 machine_id |  state  |     reason      |         inicio         | duracao
------------+---------+-----------------+------------------------+----------
          1 | STOPPED | falta de rótulo | 2026-03-02 10:00:00+00 | 00:20:00
          1 | FAULT   | sensor de nível | 2026-03-02 13:00:00+00 | 00:30:00
```

A função de janela `lead()` pareia cada evento com o seguinte, transformando transições em intervalos. A duração é o fim do intervalo menos o início.

### Disponibilidade, desempenho, qualidade e OEE do turno

```sql
WITH turno AS (SELECT '2026-03-02 08:00+00'::timestamptz AS ini,
                      '2026-03-02 16:00+00'::timestamptz AS fim),
ev AS (
  SELECT machine_id, state, ts,
         lead(ts) OVER (PARTITION BY machine_id ORDER BY ts) AS next_ts
  FROM machine_event, turno
  WHERE ts >= turno.ini - interval '1 day'
),
run AS (
  SELECT machine_id, sum(least(next_ts, fim) - greatest(ts, ini)) AS run_t
  FROM ev, turno
  WHERE state = 'RUNNING' AND next_ts > ini AND ts < fim
  GROUP BY machine_id
),
prod AS (
  SELECT machine_id, sum(qty_good) AS good, sum(qty_scrap) AS scrap
  FROM production_count, turno
  WHERE ts >= ini AND ts < fim GROUP BY machine_id
)
SELECT m.code,
  round(extract(epoch FROM r.run_t) / extract(epoch FROM (fim - ini)), 3)          AS disponibilidade,
  round((p.good + p.scrap) * m.ideal_cycle_s / extract(epoch FROM r.run_t), 3)      AS desempenho,
  round(p.good::numeric / (p.good + p.scrap), 3)                                    AS qualidade,
  round(p.good * m.ideal_cycle_s / extract(epoch FROM (fim - ini)), 3)              AS oee
FROM run r JOIN prod p USING (machine_id) JOIN machine m ON m.id = r.machine_id, turno;
```

Com tempo de ciclo ideal de 30 s, o resultado foi disponibilidade 0,896, desempenho 0,945, qualidade 0,966 e OEE 0,818, valores que conferem com a conta manual (430 min de operação em 480; 785 peças boas e 28 refugadas). Dois pontos de armadilha, que aparecem facilmente numa primeira versão da consulta e só são percebidos ao conferir com um cálculo manual (foi o que aconteceu ao preparar este exemplo):

1. **Intervalos que atravessam a fronteira do turno** precisam ser recortados (`least`/`greatest`). Filtrar eventos pelo timestamp antes de calcular o `lead()` descarta o evento que fecha o último intervalo e subestima a disponibilidade.
2. **OEE é uma definição, não uma consulta única.** Como discutido no [artigo 03](/pt/blog/o-que-e-mes-manufacturing-execution-system), o que conta como tempo planejado, parada programada e tempo de ciclo ideal muda o número. Documente a definição junto com a consulta.

### Poda de partições

```sql
EXPLAIN (COSTS OFF)
SELECT * FROM production_count WHERE ts >= '2026-03-02' AND ts < '2026-03-03';
```

O plano mostra apenas `production_count_2026_03` sendo lido: as demais partições nem entram. Com uma tabela de poucas linhas, o planejador usa varredura sequencial; o benefício dos índices BRIN e da poda aparece em volumes reais, que este exemplo não reproduz.

## Volume, escrita e confiabilidade

**Escrita em lote.** Inserir linha a linha com uma transação por linha é caro. O padrão é acumular eventos (na borda ou numa fila) e gravar em lotes, com `INSERT` multi-linha ou `COPY`. A latência extra de poucos segundos raramente importa para análise, mas importa para alarmes, que devem seguir outro caminho.

**Ordem e duplicidade.** Eventos chegam atrasados, repetidos ou fora de ordem, especialmente após uma queda de rede e o esvaziamento de um buffer na borda ([artigo 07](/pt/blog/engenharia-de-software-para-manufatura)). A chave natural e o `ON CONFLICT` resolvem duplicatas; a ordem é resolvida pelo timestamp de origem, e não pelo de chegada.

**Qualidade do dado.** Guardar o indicador de qualidade de cada leitura (bom, suspeito, falho) e não confundir "sem leitura" com "valor zero".

**Consultas históricas.** Cuidado com consultas pesadas sobre a base operacional: relatórios longos competem com a escrita. Alternativas: réplica de leitura, tabelas agregadas (por hora, turno, dia) mantidas por rotina, ou envio para uma plataforma analítica.

**Consistência.** O que precisa ser consistente (a relação entre ordem, lote e produção) vive no banco transacional com chaves estrangeiras. O que pode ser aproximado (telemetria de alta frequência) aceita compressão e perdas controladas. Misturar as duas exigências na mesma tabela costuma custar caro.

**Backup e recuperação.** Defina RPO e RTO por classe de dado. Backup do banco transacional é obrigatório; para telemetria bruta, às vezes basta preservar os agregados.

## Relação com engenharia de software

Na minha leitura, a decisão mais valiosa é **modelar eventos de forma explícita** e derivar o resto. Estados atuais, indicadores e relatórios são consultas sobre eventos imutáveis, o que facilita auditoria, reprocessamento e correção retroativa. A segunda é separar cedo o que é transacional do que é série temporal, mesmo que ambos morem inicialmente no PostgreSQL. E a terceira é tratar as definições de indicadores (OEE, paradas, tempo planejado) como código versionado e testado, não como fórmulas espalhadas em planilhas e telas.

## Conclusão

Bancos de dados industriais não são uma categoria única: são uma combinação de relacional para negócio e rastreabilidade, séries temporais ou historiadores para processo, e plataformas analíticas para histórico longo. O PostgreSQL, com particionamento por tempo, chave natural idempotente e índices adequados, resolve uma faixa grande de casos; a partir de certo volume ou de certas exigências industriais, TimescaleDB, InfluxDB ou um historiador passam a fazer sentido. O que não muda é a disciplina: eventos com timestamp de origem, qualidade explícita, retenção planejada e definições de indicadores documentadas.

O artigo seguinte sobe para a [IIoT e a Indústria 4.0](/pt/blog/iiot-industria-4-0-arquiteturas-edge-nuvem), onde esses dados passam a viajar entre planta, borda e nuvem.

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura. Os dados de exemplo são sintéticos e todo o SQL foi executado em PostgreSQL 17.

- PostgreSQL Global Development Group. [Table Partitioning](https://www.postgresql.org/docs/17/ddl-partitioning.html), PostgreSQL 17 Documentation.
- PostgreSQL Global Development Group. [BRIN Indexes](https://www.postgresql.org/docs/17/brin.html), PostgreSQL 17 Documentation.
- Tiger Data (Timescale). [Hypertables](https://www.tigerdata.com/docs/use-timescale/latest/hypertables), documentação do TimescaleDB. Recursos como compressão, agregados contínuos e retenção não foram verificados nesta pesquisa.
- InfluxData. [Explore your schema with InfluxQL](https://docs.influxdata.com/influxdb3/cloud/query-data/influxql/explore-schema/) e [InfluxDB 3 Core, SHOW](https://docs.influxdata.com/influxdb3/core/reference/influxql/show), documentação do InfluxDB 3.
- AVEVA. [Exception reporting attributes](https://docs.aveva.com/bundle/pi-universal-interface-uniint-framework/page/1026196.html) e [Data Archive](https://docs.aveva.com/bundle/pi-server-da-admin/page/1022865.html), documentação do PI System (exemplo de historiador proprietário).
- ISO. [ISO 22400-2:2014](https://www.iso.org/standard/54497.html), indicadores de desempenho para gestão de operações de manufatura (consulta limitada ao catálogo).
