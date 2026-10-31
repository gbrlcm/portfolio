---
title: "O que é MES e como ele conecta planejamento e produção"
description: "O que é um MES, por que surgiu, como difere de ERP e SCADA, o que faz (ordens, rastreabilidade, OEE) e um fluxo completo do pedido ao retorno ao ERP."
pubDate: 2026-10-31T10:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/o-que-e-mes-manufacturing-execution-system.webp"
coverAlt: "Ilustração com ERP, MES e PLC empilhados, setas de ordens descendo e do realizado subindo, com o MES destacado"
category: "Automação Industrial"
tags:
  - "MES"
  - "Manufacturing Execution System"
  - "ISA-95"
  - "OEE"
  - "Rastreabilidade"
  - "Série Automação Industrial"
draft: false
lang: "pt-BR"
---

O ERP sabe que existe um pedido de 1.000 unidades. O PLC sabe que um sensor acabou de contar mais uma. Entre os dois há uma pergunta que nenhum dos dois responde sozinho: **essas unidades pertencem a qual ordem, qual lote, qual turno, e a produção está no ritmo planejado?** É esse espaço que o MES ocupa.

Este é o terceiro artigo da série. Depois da [visão geral da arquitetura](/pt/blog/arquitetura-de-software-fabrica-moderna) e dos [PLCs](/pt/blog/plcs-linguagens-programacao-industrial), subimos para o nível de execução da manufatura.

## O que é um MES e por que surgiu

**MES** significa *Manufacturing Execution System*, sistema de execução da manufatura. Segundo um artigo acadêmico publicado no *South African Journal of Industrial Engineering*, o termo foi criado em 1990 pela consultoria Advanced Manufacturing Research (AMR) para nomear um conjunto de software que viabiliza a execução da manufatura por meio da integração entre os sistemas de planejamento e de controle.

A motivação é estrutural: os sistemas de planejamento (como o ERP) trabalham com horizontes de dias a meses e com dados agregados, e os sistemas de controle (PLCs, DCS) trabalham em milissegundos e com sinais de máquina. Nenhum dos dois, sozinho, entende "a ordem 1001 está 78% concluída, o lote L-001 usou matéria-prima do fornecedor X e a linha ficou parada 40 minutos por falta de rótulo". Faltava uma camada que transformasse o plano em instruções de execução e os sinais de chão de fábrica em informação de negócio.

No modelo ISA-95, essa camada corresponde ao **nível 3**, a *gestão de operações de manufatura* (Manufacturing Operations Management, MOM). A parte 3 da norma descreve um modelo das atividades desse nível, e a documentação da OPC Foundation sobre a norma lista, entre as funções do nível 3, produção, manutenção, qualidade e laboratório, e movimentação de inventário. Na prática, "MES" é o nome comercial mais comum para produtos que cobrem parte ou todo esse escopo. Uma nota de leitura: o ISA-95 descreve **atividades e informação**, não um produto; um mesmo software pode cobrir mais de uma delas, e as fronteiras variam entre fornecedores.

## MES, ERP, SCADA e controle: quem faz o quê

| Sistema | Pergunta que responde | Horizonte | Dado típico |
|---|---|---|---|
| ERP (nível 4) | O que preciso produzir, comprar e entregar? | meses, semanas, dias | pedidos, estoque, custos |
| MES (nível 3) | O que estou produzindo agora e como está indo? | turnos, horas, minutos | ordens em execução, lotes, apontamentos, paradas |
| SCADA | O que está acontecendo no processo? | segundos | estados, alarmes, tendências de variáveis |
| PLC/DCS (nível 2) | O que cada máquina deve fazer agora? | milissegundos | entradas, saídas, estados de máquina |

A confusão mais comum é entre MES e ERP. Resumo prático (que o [artigo 04](/pt/blog/erp-na-industria-planejamento-e-execucao) aprofunda): **o ERP planeja e contabiliza; o MES executa e registra o que de fato aconteceu**. O ERP decide que vai fabricar 1.000 unidades até sexta; o MES coordena como isso acontece na linha, em qual ordem, com qual material, e informa o resultado real.

Já a diferença para o SCADA é de escopo e de semântica. O SCADA supervisiona variáveis de processo e comanda equipamentos; ele não sabe, por natureza, o que é uma ordem de fabricação ou um lote. Em muitas plantas os dois se integram, com o SCADA ou o historiador alimentando o MES com eventos e contagens. O artigo 05 compara os quatro em detalhe.

## O que um MES faz

O conjunto de funções varia por fornecedor e setor. As mais citadas:

- **Gestão de ordens de fabricação.** Recebe as ordens liberadas pelo ERP, programa e distribui para linhas ou estações, acompanha o status.
- **Apontamento de produção.** Registra quantidades boas, refugo, retrabalho e tempos, de forma manual (operador) ou automática (via equipamentos).
- **Rastreabilidade (genealogia).** Liga produto final, lote, matérias-primas consumidas, equipamento, turno e operador, em ambos os sentidos: de um lote de matéria-prima aos produtos que o usaram, e de um produto aos seus insumos. Em setores regulados (alimentos, farmacêutico, automotivo, dispositivos médicos) isso costuma ser requisito.
- **Controle de qualidade.** Coleta inspeções e resultados de testes, aplica planos de amostragem, bloqueia lotes fora de especificação.
- **Gestão de recursos e materiais.** Estado de equipamentos, ferramentas, disponibilidade de material nas linhas, instruções de trabalho.
- **Monitoramento de paradas e indicadores.** Motivos de parada, tempo de ciclo, OEE.

### OEE

O **OEE** (Overall Equipment Effectiveness) é o indicador mais associado ao MES. Em sua formulação mais difundida, é o produto de três fatores:

- **Disponibilidade** = tempo em que a máquina produziu ÷ tempo planejado de produção;
- **Desempenho** = produção real ÷ produção teórica no tempo em que operou (relação com o tempo de ciclo ideal);
- **Qualidade** = peças boas ÷ peças totais.

A norma **ISO 22400-2** (2014) define indicadores de desempenho para gestão de operações de manufatura, com fórmula, unidade e comportamento temporal para cada um, usando as unidades de trabalho da IEC 62264. Como a ISO 22400 é uma norma paga e esta consulta se baseou no catálogo, trate as fórmulas acima como a formulação corrente de mercado, e confira na norma as definições exatas antes de adotar o indicador em contrato. O ponto prático: dois sistemas podem chamar de "OEE" números diferentes se definirem de forma diferente o que é tempo planejado ou parada programada. Definir isso é decisão de projeto, não detalhe.

Um cálculo **hipotético** para fixar as ideias: turno de 480 min, 60 min de parada, tempo de ciclo ideal de 0,5 min/unidade, 810 unidades produzidas, das quais 30 refugadas.

- Disponibilidade = 420 / 480 = 0,875
- Desempenho = (0,5 × 810) / 420 = 0,964
- Qualidade = 780 / 810 = 0,963
- OEE = 0,875 × 0,964 × 0,963 ≈ 0,813 (equivale a 0,5 × 780 / 480)

## Um fluxo completo: do pedido ao retorno

O exemplo a seguir é **hipotético e simplificado**: uma fábrica de produtos envasados, com um MES entre o ERP e as linhas.

```text
1. Cliente faz pedido (1.000 un. de SKU-A)
2. ERP: confere estoque, cria a ordem de produção OP-1001, reserva materiais
3. ERP → MES: libera OP-1001 (produto, quantidade, receita/roteiro, data)
4. MES: programa na linha ENV-01, valida disponibilidade de material,
        gera os lotes e as instruções de trabalho
5. MES → controle (via SCADA/gateway): receita e parâmetros da ordem
6. PLC executa; sensores contam; paradas e falhas são sinalizadas
7. Controle → MES: contagens, estados, alarmes relevantes
8. MES: grava apontamentos, associa lotes de matéria-prima, registra qualidade
9. MES → ERP: quantidade produzida/refugada, consumo real, status da ordem
10. ERP: atualiza estoque de produto acabado e custo real
```

<figure>
  <img src="/images/blog/o-que-e-mes-manufacturing-execution-system-diagrama.webp" alt="Diagrama de sequência com quatro participantes, ERP, MES, SCADA e gateway, e PLC. O ERP libera a ordem ao MES, que envia receita e parâmetros ao SCADA e comandos ao PLC; contagens e estados voltam ao MES, que devolve quantidade, refugo e status ao ERP." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Fluxo resumido do pedido ao retorno ao ERP (exemplo hipotético). Diagrama do autor.</figcaption>
</figure>

Alguns pontos de projeto escondidos nesse fluxo:

- **Idempotência.** Contagens e apontamentos podem ser reenviados após uma falha de rede. O MES precisa conseguir receber a mesma mensagem duas vezes sem duplicar a produção.
- **Fonte de verdade.** A ordem nasce no ERP; o realizado nasce no MES. Quando há divergência (ordem alterada no ERP depois de liberada), é preciso uma regra de reconciliação.
- **Autonomia da linha.** O passo 6 não depende do MES estar disponível; a linha pode continuar produzindo e os eventos são reenviados quando a comunicação voltar. Isso é decisão de arquitetura, não um padrão que todo produto garante.

## Como um MES é construído

Do ponto de vista de software, um MES é um sistema de **domínio rico, integração pesada e disponibilidade exigente**. Há três caminhos comuns: comprar um produto de mercado, customizar uma plataforma ou desenvolver sob medida. O custo e a flexibilidade de cada um dependem do caso. Os módulos mais comuns espelham as funções: ordens, apontamento, rastreabilidade, qualidade, equipamentos/manutenção, indicadores, integração.

**Banco de dados.** Bancos relacionais (PostgreSQL, SQL Server, Oracle e semelhantes) são a escolha usual para o modelo transacional: ordens, lotes, genealogia, apontamentos exigem integridade referencial e consistência. Dados de processo de alta frequência costumam ir para um historiador ou banco de séries temporais, separado do transacional (tema do artigo 08).

Um esqueleto **ilustrativo** do núcleo relacional, em PostgreSQL (testado em PostgreSQL 17 antes de publicar):

```sql
CREATE TABLE work_order (
  id            bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  erp_order_no  text NOT NULL UNIQUE,
  product_code  text NOT NULL,
  qty_planned   integer NOT NULL CHECK (qty_planned > 0),
  status        text NOT NULL DEFAULT 'RELEASED'
                CHECK (status IN ('RELEASED','RUNNING','COMPLETED','CANCELLED'))
);

CREATE TABLE production_report (
  id            bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  work_order_id bigint NOT NULL REFERENCES work_order(id),
  lot_code      text NOT NULL,
  machine_code  text NOT NULL,
  reported_at   timestamptz NOT NULL,
  qty_good      integer NOT NULL CHECK (qty_good >= 0),
  qty_scrap     integer NOT NULL DEFAULT 0 CHECK (qty_scrap >= 0),
  UNIQUE (machine_code, reported_at)   -- reenvio do mesmo apontamento não duplica
);

-- Reenvio seguro:
INSERT INTO production_report
  (work_order_id, lot_code, machine_code, reported_at, qty_good, qty_scrap)
VALUES (1, 'L-001', 'ENV-01', '2026-03-02 09:00+00', 380, 20)
ON CONFLICT (machine_code, reported_at) DO NOTHING;

-- Progresso da ordem:
SELECT w.erp_order_no, w.qty_planned,
       SUM(r.qty_good) AS boas, SUM(r.qty_scrap) AS refugo,
       round(100.0 * SUM(r.qty_good) / w.qty_planned, 1) AS pct_concluido
FROM work_order w
JOIN production_report r ON r.work_order_id = w.id
GROUP BY w.id;
```

O modelo real tem muito mais: BOM e roteiro, genealogia de lotes, estados de equipamento, motivos de parada, planos de inspeção, usuários e auditoria. A chave `UNIQUE (machine_code, reported_at)` mostra um truque de integração simples: usar uma chave natural para tornar o recebimento idempotente. Em produção, a chave certa depende de como o equipamento ou gateway identifica eventos.

**Integração.** Para baixo, o MES conversa com SCADA, historiadores, gateways e PLCs por protocolos como OPC UA, que tem inclusive uma especificação de modelo comum para ISA-95 (OPC 10030). Para cima, integra com o ERP por APIs, mensageria ou arquivos; o ISA-95 parte 5 trata das transações entre negócio e manufatura. A escolha entre REST, filas ou outro mecanismo é decisão de arquitetura e depende do contexto.

## Desafios de implementação

- **Escopo e fronteira.** Onde termina o ERP e começa o MES? Cadastros de produto, roteiros e custos disputam dono. Decidir isso cedo evita duplicidade.
- **Dados de chão de fábrica.** Apontamento manual gera erros e atrasos; o automático exige integração com equipamentos heterogêneos e, às vezes, legados que não expõem dados.
- **Adoção pelo operador.** Um MES que atrapalha a rotina é contornado com planilhas. Interface e fluxo precisam respeitar o ritmo da linha.
- **Disponibilidade.** Parar o MES não deve parar a produção; é preciso definir o que a linha faz offline e como reconciliar depois.
- **Definição de indicadores.** Como visto no OEE, números só são comparáveis se as definições forem.
- **Evolução.** Mudanças de produto, receita e linha são constantes; o sistema precisa ser configurável sem recompilar.

## Relação com engenharia de software

Na minha leitura, um MES é um bom caso para aplicar modelagem de domínio e arquitetura orientada a eventos com cuidado: o domínio é rico (ordem, lote, recurso, evento de produção), há integração assíncrona por natureza, e consistência e rastreabilidade importam mais que velocidade de desenvolvimento. Ao mesmo tempo, não é um sistema que se desenhe como um CRUD web: tempo, falha parcial, idempotência e auditoria precisam estar no desenho inicial. O [artigo 07](/pt/blog/engenharia-de-software-para-manufatura) aborda essas escolhas.

## Conclusão

O MES existe porque planejar e executar são problemas diferentes, com escalas de tempo, donos e dados diferentes. Ele traduz ordens em execução e sinais de máquina em informação de negócio, e devolve ao ERP o que realmente aconteceu. Entender essa fronteira, entre planejamento (ERP), execução (MES), supervisão (SCADA) e controle (PLC), é o que permite projetar integrações e indicadores confiáveis.

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura. O fluxo de pedido, o cálculo de OEE e o esquema SQL são hipotéticos e ilustrativos.

- [Realising the potential of manufacturing execution systems](https://sajie.journals.ac.za/pub/article/view/358). South African Journal of Industrial Engineering, [DOI 10.7166/12-1-358](https://doi.org/10.7166%2F12-1-358) (origem do termo MES, AMR, 1990). Ano e autoria não verificados com certeza (as fontes consultadas divergem); confirmar na página do periódico antes de citar formalmente.
- ISA. [ISA-95 Standard: Enterprise-Control System Integration](https://www.isa.org/standards-and-publications/isa-standards/isa-95-standard). Descrição das partes, incluindo a Parte 3 (atividades de operações de manufatura).
- OPC Foundation. [OPC 10030, 4.2.3 ISA-95](https://reference.opcfoundation.org/specs/OPC-10030/4.2.3).
- ISO. [ISO 22400-2:2014, Key performance indicators (KPIs) for manufacturing operations management, Part 2: Definitions and descriptions](https://www.iso.org/standard/54497.html). Consulta limitada ao catálogo; as fórmulas não foram verificadas no texto da norma.
