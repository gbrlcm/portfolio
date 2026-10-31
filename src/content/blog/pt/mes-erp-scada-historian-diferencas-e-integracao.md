---
title: "MES, ERP, SCADA e historiadores: diferenças e integração"
description: "Comparativo técnico entre MES, ERP, SCADA e historiadores: o que cada um recebe e produz, como se integram e o que quebra quando a integração é ruim."
pubDate: 2026-10-31T11:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/mes-erp-scada-historian-diferencas-e-integracao.webp"
coverAlt: "Ilustração com quatro caixas, ERP, MES, SCADA e Historian, ligadas por setas"
category: "Automação Industrial"
tags:
  - "MES"
  - "ERP"
  - "SCADA"
  - "Historian"
  - "Integração de Sistemas Industriais"
  - "Série Automação Industrial"
draft: false
lang: "pt-BR"
---

Nos três primeiros artigos da série, cada sistema apareceu isoladamente. Na prática, os problemas de projeto surgem nas fronteiras: quem é dono da ordem de produção? Quem guarda a temperatura do forno de ontem? Quem decide que um lote está bloqueado? Este artigo compara **MES, ERP, SCADA e historiadores** lado a lado, mostra como se integram e o que costuma dar errado.

## Os quatro sistemas em uma frase

- **ERP:** planeja e contabiliza a operação da empresa (pedidos, estoque, compras, custos). É o sistema de registro dos dados de negócio.
- **MES:** executa e registra a produção contra o plano (ordens, lotes, apontamentos, qualidade, paradas).
- **SCADA:** supervisiona e opera o processo (telas, alarmes, comandos), coletando dados dos controladores.
- **Historiador (historian):** armazena e serve séries temporais de variáveis de processo, com compressão e consulta por intervalo.

Um aviso sobre os rótulos: são **funções**, não necessariamente **produtos**. Um mesmo software pode oferecer SCADA e historiador integrados; um MES pode incluir coleta de dados; um ERP pode ter módulo de chão de fábrica. O ISA-95 organiza as atividades por nível, não obriga a existência de quatro produtos distintos.

## O que é SCADA, com precisão

SCADA (*Supervisory Control and Data Acquisition*) é, nas palavras de uma definição amplamente citada do NIST (guia SP 800-82 original, de 2006), um sistema computadorizado capaz de reunir e processar dados e aplicar controles operacionais a longas distâncias, tipicamente em geração e distribuição de energia, redes e dutos. Em arquiteturas SCADA, controladores de campo (RTUs ou PLCs) fazem a coleta e o controle local, e uma estação central apresenta os dados e permite comandos de supervisão.

Duas distinções importantes:

- **SCADA não é PLC.** O PLC executa a lógica de controle em ciclo próprio e continua funcionando se o SCADA cair. O SCADA supervisiona, e não deve ser o responsável pela segurança do processo.
- **SCADA não é MES.** O SCADA conhece tags, alarmes e estados; não conhece, por natureza, ordens, lotes ou receitas de negócio.

Em plantas contínuas e de processo, o papel equivalente costuma ser exercido por um **DCS** (sistema de controle distribuído), que integra controle e supervisão. A literatura de segurança, como o NIST SP 800-82 Rev. 3 (2023), trata SCADA, DCS e PLCs como componentes de sistemas de controle industrial.

## O que é um historiador de dados

O historiador (ou *data historian*) é um banco de dados especializado em **séries temporais de processo**: cada ponto (tag) tem valor, timestamp e, tipicamente, um indicador de qualidade. Três características o diferenciam de um banco relacional comum:

1. **Ingestão contínua em alta cadência**, com escrita quase sempre apenas de acréscimo.
2. **Redução de dados na entrada.** Em vez de gravar tudo, muitos historiadores filtram valores sem mudança relevante.
3. **Consulta orientada a intervalo e interpolação:** valor em um instante, média num período, tendência.

A documentação do **AVEVA PI System** (produto proprietário, e um exemplo, não a regra) descreve dois estágios: o *exception reporting*, aplicado na interface de coleta com uma banda morta (deadband) simples, e a *compression*, aplicada no arquivo de dados com o algoritmo *swinging door*, que acompanha a inclinação do sinal em vez de aplicar banda fixa. A mesma documentação orienta, por exemplo, a não comprimir dados digitados manualmente ou totalizados, e a testar mudanças de desvio contra as tendências, pois o efeito é difícil de prever. A consequência prática para engenharia: **o que se consulta de um historiador pode ser uma reconstrução** (por interpolação) do sinal original. Isso importa para análises que dependem de eventos exatos.

No lado dos padrões abertos, o **OPC UA** possui a parte 11, *Historical Access*, que define o modelo de informação para acesso a dados históricos; os serviços ficam na parte 4 e as agregações (mínimo, máximo, média etc.) na parte 13. A edição de 2020 da IEC 62541-11 consta nos catálogos consultados, mas o status atual apareceu inconsistente entre os catálogos, então convém verificar a edição vigente.

## Tabela comparativa

| | ERP | MES | SCADA | Historiador |
|---|---|---|---|---|
| **Pergunta principal** | O que produzir, comprar, entregar? | O que está sendo produzido e como foi? | O que está acontecendo no processo? | Como o processo se comportou ao longo do tempo? |
| **Nível ISA-95** | 4 | 3 | 2 a 3 (varia por fonte e função) | 2 a 3 (varia) |
| **Recebe** | pedidos, apontamentos agregados do MES | ordens do ERP, eventos e contagens do controle | tags dos controladores, comandos do operador | tags e eventos (do SCADA, gateways, PLCs) |
| **Produz** | ordens, planos de compra, custos | apontamentos, genealogia, indicadores | telas, alarmes, comandos, tags consolidadas | séries temporais consultáveis |
| **Escala de tempo** | dias a meses | minutos a turnos | segundos | milissegundos a anos (armazenamento) |
| **Modelo de dados** | relacional, transacional | relacional transacional | tags em tempo real | séries temporais |
| **Criticidade de tempo** | baixa | média | média a alta | baixa na consulta, alta na ingestão |
| **Falha típica** | atraso no planejamento | linha sem instrução ou sem registro | operador sem visibilidade | buracos nos dados |
| **Dono do dado** | cadastros, ordens, saldos | realizado e rastreabilidade | estado instantâneo do processo | histórico de variáveis |

A posição do SCADA e do historiador no nível 2 ou 3 varia conforme a fonte e a função. A documentação da OPC Foundation sobre o ISA-95, por exemplo, lista SCADA e historiadores entre os sistemas do nível 3.

## Como eles se comunicam

Cada fronteira tem um estilo de integração típico:

- **Controle ↔ SCADA:** protocolos industriais. Os mais comuns são OPC UA, Modbus, PROFINET e EtherNet/IP, além de protocolos proprietários e de drivers do fabricante. O artigo 06 trata disso.
- **SCADA ↔ historiador:** em geral por interfaces ou conectores nativos, ou por OPC UA. Muitas vezes o historiador coleta diretamente dos controladores, sem passar pelo SCADA.
- **Controle/SCADA/historiador ↔ MES:** eventos e agregados. O MES não precisa do sinal bruto de cada sensor; precisa de contagens, estados, e janelas de tempo associadas a ordens. Costuma-se usar OPC UA, mensageria (MQTT, filas) ou acesso a banco de dados.
- **MES ↔ ERP:** transações de negócio: liberação de ordem, retorno de produção e consumo. A parte 5 do ISA-95 trata dessas transações; as implementações costumam ser APIs, mensagens ou arquivos.

Os dados que precisam ser **compartilhados** entre camadas incluem identificadores consistentes (ordem, lote, equipamento, material), horários sincronizados e a qualidade do dado (válido, estimado, falho). Sem identificadores comuns, a integração vira um mapeamento manual frágil.

### Um exemplo concreto: associando processo e produção

Um uso típico de integração entre historiador e MES é correlacionar a variável de processo com a ordem. O exemplo abaixo, **hipotético**, mostra o princípio em SQL: as amostras de temperatura (tabela `tag_sample`, representando o que viria de um historiador) são cruzadas com a janela de execução de cada ordem (`order_run`, vinda do MES), ignorando amostras com qualidade ruim. Foi executado em PostgreSQL 17 antes de publicar.

```sql
CREATE TABLE tag_sample (
  tag text NOT NULL, ts timestamptz NOT NULL,
  value double precision NOT NULL, quality text NOT NULL DEFAULT 'GOOD',
  PRIMARY KEY (tag, ts));
CREATE TABLE order_run (
  erp_order_no text, machine text, started_at timestamptz, ended_at timestamptz);

SELECT o.erp_order_no, count(*) AS amostras,
       round(avg(s.value)::numeric, 1) AS media, max(s.value) AS maximo
FROM order_run o
JOIN tag_sample s
  ON s.tag = o.machine || '.forno.temp'
 AND s.ts >= o.started_at AND s.ts < o.ended_at
 AND s.quality = 'GOOD'
GROUP BY o.erp_order_no;
```

Com dados sintéticos de 10 em 10 minutos entre 08h e 10h, e duas amostras marcadas como ruins, a consulta devolve 10 amostras, como esperado (12 menos 2). O ponto de engenharia: **a junção por tempo só funciona se os relógios estiverem alinhados** e se o MES registrar início e fim da execução com precisão. Em produção, esse tipo de cruzamento costuma ser feito no próprio historiador ou em uma plataforma analítica, e os detalhes (nome de tag, fuso, intervalo aberto ou fechado) importam.

## Arquitetura integrada, de ponta a ponta

Um desenho conceitual, **ilustrativo**, não uma arquitetura obrigatória:

<figure>
  <img src="/images/blog/mes-erp-scada-historian-diferencas-e-integracao-diagrama.webp" alt="Diagrama com ERP no topo, MES abaixo, uma camada de integração (OPC UA, gateway, fila) e, na base, historiador, SCADA e PLCs ligados a essa camada." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Arquitetura integrada ilustrativa de ERP, MES, SCADA e historiador. Diagrama do autor.</figcaption>
</figure>

Fluxo de ponta a ponta: o ERP libera a ordem; o MES a programa e envia parâmetros; o PLC executa e expõe variáveis; o SCADA supervisiona e o historiador registra as séries; a camada de integração entrega ao MES contagens, estados e eventos; o MES consolida e devolve ao ERP quantidades, consumos e status.

### Bancos de dados em cada camada

- **Relacionais** (PostgreSQL, SQL Server, Oracle e semelhantes): ERP e MES, onde há transações, integridade referencial e consultas ad hoc.
- **Historiadores industriais:** otimizados para tags, compressão e interpolação; geralmente produtos proprietários com ecossistema de conectores.
- **Bancos de séries temporais de uso geral** (como InfluxDB ou TimescaleDB): alternativa ou complemento em arquiteturas mais abertas, com trade-offs de funcionalidades industriais (certas interfaces, interpolações e ferramentas de operação). O artigo 08 compara essas opções.

## O que dá errado quando a integração é ruim

- **Duplicidade de verdade.** Cadastros de produto e roteiro mantidos nos dois sistemas e divergindo.
- **Identificadores incompatíveis.** O ERP chama de "OP-1001" o que o MES chama de "ORD1001", e o historiador não conhece nenhum dos dois.
- **Relógios desalinhados.** Eventos que parecem ter acontecido fora da ordem real, gerando indicadores errados.
- **Mensagens duplicadas ou perdidas.** Sem idempotência e sem confirmação, uma queda de rede produz produção contada duas vezes ou perdida.
- **Acoplamento forte.** O MES cai porque o ERP está em manutenção; a linha para porque um serviço de nível superior travou.
- **Dados sem contexto.** Valores sem unidade, sem qualidade ou sem identificador de equipamento, que alimentam relatórios errados.
- **Indicadores inconsistentes.** Cada sistema calculando OEE à sua maneira.
- **Limites ignorados.** Funções de controle ou de segurança migradas para um sistema que não foi projetado para elas.

## Relação com engenharia de software

Na minha leitura, a lição prática é projetar integrações com **contratos explícitos**: identificadores canônicos, semântica de tempo e de qualidade, idempotência, reprocessamento e monitoramento. O vocabulário do ISA-95 serve como linguagem comum, e os modelos de informação padronizados (como os do OPC UA) reduzem mapeamentos ad hoc. Além disso, cada camada deve ter **autonomia degradada** bem definida: o que ela faz quando a camada acima ou ao lado some. O [artigo 07](/pt/blog/engenharia-de-software-para-manufatura) volta a esse ponto no contexto de arquitetura.

## Conclusão

ERP, MES, SCADA e historiadores respondem a perguntas diferentes, em escalas de tempo diferentes e com modelos de dados diferentes. Os problemas raramente estão dentro de um deles e quase sempre nas fronteiras: identificadores, tempo, qualidade do dado e responsabilidade. Quem desenha a integração deve primeiro decidir quem é dono de cada dado e o que cada camada faz quando as outras falham.

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura. A arquitetura e a consulta SQL são ilustrativas.

- AVEVA. [Exception reporting attributes (UniInt Framework)](https://docs.aveva.com/bundle/pi-universal-interface-uniint-framework/page/1026196.html) e [Data Archive administration](https://docs.aveva.com/bundle/pi-server-da-admin/page/1022865.html), documentação do PI System. Descrição de um produto específico.
- IEC. [IEC 62541-11:2020, OPC Unified Architecture, Part 11: Historical Access](https://webstore.iec.ch/publication/61129). Consulta limitada ao catálogo.
- NIST. [SP 800-82 Rev. 3, Guide to Operational Technology (OT) Security](https://csrc.nist.gov/pubs/sp/800/82/r3/final), 2023. A definição de SCADA citada vem do guia original de 2006, [NIST SP 800-82](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-82.pdf), substituído por revisões posteriores.
- OPC Foundation. [OPC 10030, 4.2.3 ISA-95](https://reference.opcfoundation.org/specs/OPC-10030/4.2.3).
- ISA. [ISA-95 Standard: Enterprise-Control System Integration](https://www.isa.org/standards-and-publications/isa-standards/isa-95-standard).
