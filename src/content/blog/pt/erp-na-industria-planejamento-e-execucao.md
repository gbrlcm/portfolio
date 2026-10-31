---
title: "ERP na indústria: como organiza uma operação de manufatura"
description: "Como um ERP planeja a manufatura: MRP, BOM, roteiros, ordens, estoque, compras e custos, a diferença para o MES e o efeito de uma mudança de demanda."
pubDate: 2026-10-31T10:30:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/erp-na-industria-planejamento-e-execucao.webp"
coverAlt: "Ilustração de uma lista de materiais em árvore: o produto A usa 2 de B e 1 de C, e B usa 3 de D"
category: "Automação Industrial"
tags:
  - "ERP"
  - "MRP"
  - "BOM"
  - "Planejamento de Produção"
  - "Integração ERP MES"
  - "Série Automação Industrial"
draft: false
lang: "pt-BR"
---

Quando se fala em software de manufatura, o ERP costuma ser o sistema mais conhecido e o menos compreendido pelos desenvolvedores que precisam integrá-lo a outros. Ele não controla máquinas e não acompanha a linha em tempo real. O que ele faz é **planejar, comprometer recursos e contabilizar**: decide o que precisa ser produzido e comprado, reserva materiais, calcula custos e fecha as contas.

Este é o quarto artigo da série. Já vimos a [arquitetura geral](/pt/blog/arquitetura-de-software-fabrica-moderna), os [PLCs](/pt/blog/plcs-linguagens-programacao-industrial) e o [MES](/pt/blog/o-que-e-mes-manufacturing-execution-system). Agora olhamos para o nível 4 do ISA-95.

## O que é um ERP

**ERP** (Enterprise Resource Planning) é um conjunto integrado de módulos que compartilham uma base de dados da empresa: financeiro e contábil, vendas, compras, estoque, produção, custos, recursos humanos, entre outros. O ponto distintivo é a **integração em torno de dados mestres comuns**: o mesmo cadastro de item, de cliente e de fornecedor alimenta todos os módulos, e uma transação em um módulo (por exemplo, o recebimento de material) gera efeitos nos outros (estoque, contas a pagar, custo).

Na manufatura, o módulo de produção do ERP cuida de planejamento, não de execução em chão de fábrica. No vocabulário do ISA-95, os sistemas de negócio e logística pertencem ao nível 4, com horizontes de meses, semanas e dias, segundo a descrição publicada pela OPC Foundation sobre a norma.

## De MRP a ERP

A evolução costuma ser contada em etapas. As datas e atribuições abaixo vêm de fontes secundárias (a literatura sobre o tema é majoritariamente de consultorias e fornecedores), então trate-as como a narrativa corrente, não como história verificada em documentos primários:

- **MRP (Material Requirements Planning).** Atribuído a Joseph Orlicky, na década de 1960. A lógica central: a partir da demanda de produtos acabados, da estrutura de produto e do estoque, calcular **o que, quanto e quando** produzir ou comprar de cada componente.
- **MRP em ciclo fechado (closed-loop MRP).** Adicionou a verificação da viabilidade do plano contra a capacidade e a realimentação do que realmente aconteceu.
- **MRP II (Manufacturing Resource Planning).** Atribuído a Oliver Wight, no início dos anos 1980. Ampliou o escopo para capacidade, programação e funções financeiras e comerciais.
- **ERP.** Termo popularizado nos anos 1990 (há quem o credite à consultoria Gartner), que estende a integração para toda a empresa, além da manufatura.

O que importa para engenharia é a continuidade: o coração do planejamento de produção dos ERPs atuais continua sendo, conceitualmente, o cálculo de necessidades de materiais.

## Os dados mestres da manufatura

O planejamento só é tão bom quanto o cadastro que o alimenta.

**Item / material.** Cada matéria-prima, componente, semiacabado e produto acabado, com unidade de medida, política de reposição, lead time, tamanho de lote e estoque de segurança.

**BOM (Bill of Materials), ou lista de materiais.** A estrutura do produto: quais componentes e em que quantidade formam cada item. É hierárquica (um produto acabado contém semiacabados, que contêm matérias-primas). A documentação do Dynamics 365 Supply Chain Management, da Microsoft, exemplifica um comportamento comum: durante o planejamento, o sistema usa a BOM ativa e percorre todos os níveis da estrutura relacionada à ordem de produção. Versões de BOM têm validade por período, o que importa quando o produto muda.

**Roteiro de fabricação (routing).** A sequência de operações para fabricar um item, os recursos (centros de trabalho, máquinas) usados em cada uma e os tempos de preparação e execução. Serve para programar e para calcular custo.

**Centros de trabalho e capacidade.** Os recursos, seus calendários e sua capacidade disponível.

**Fornecedores e condições de compra.** Prazos, lotes mínimos, preços.

## O cálculo de necessidades de materiais

O núcleo do MRP é a **explosão da BOM com netting**: dado o que precisa ser entregue, desce-se a estrutura e, em cada nível, subtrai-se o que já existe em estoque ou já está a caminho, para chegar ao que realmente precisa ser produzido ou comprado.

Um exemplo **hipotético** e propositalmente pequeno. O produto A é feito de 2 unidades de B e 1 de C. B é feito de 3 unidades de D. Estoque atual: A=10, B=20, C=0, D=50. A demanda é de 100 unidades de A.

```text
A: demanda 100 − estoque 10        = necessidade líquida  90
B: 90 × 2 = 180 − estoque 20       = necessidade líquida 160
C: 90 × 1 =  90 − estoque 0        = necessidade líquida  90
D: 160 × 3 = 480 − estoque 50      = necessidade líquida 430
```

Em SQL, esse cálculo, para uma estrutura em árvore em que cada item aparece uma única vez, cabe em uma consulta recursiva. O exemplo foi executado em PostgreSQL 17 antes de publicar:

```sql
CREATE TABLE bom (
  parent_item text NOT NULL, child_item text NOT NULL,
  qty_per numeric NOT NULL CHECK (qty_per > 0),
  PRIMARY KEY (parent_item, child_item));
CREATE TABLE stock (item text PRIMARY KEY, on_hand numeric NOT NULL DEFAULT 0);

INSERT INTO bom   VALUES ('A','B',2), ('A','C',1), ('B','D',3);
INSERT INTO stock VALUES ('A',10), ('B',20), ('C',0), ('D',50);

WITH RECURSIVE explosion AS (
  SELECT 'A'::text AS item, 0 AS lvl,
         100::numeric AS gross,
         GREATEST(100 - s.on_hand, 0) AS net
  FROM stock s WHERE s.item = 'A'
  UNION ALL
  SELECT b.child_item, e.lvl + 1,
         e.net * b.qty_per,
         GREATEST(e.net * b.qty_per - s.on_hand, 0)
  FROM explosion e
  JOIN bom b   ON b.parent_item = e.item
  JOIN stock s ON s.item = b.child_item
)
SELECT item, lvl, gross, net FROM explosion ORDER BY lvl, item;
```

O resultado (A: 90, B: 160, C: 90, D: 430) confere com a conta à mão. Este exemplo é uma simplificação didática. Um MRP real trata: o mesmo componente aparecendo em vários produtos e níveis (o que exige processar cada item uma vez, em ordem de nível mais baixo), **lead times** e datas de necessidade em vez de apenas quantidades, tamanhos de lote, estoque de segurança, ordens já abertas, perdas e vários depósitos. Não devemos tomar essa consulta como substituto de um motor de planejamento.

### Planejamento e ordens

A saída do planejamento são **propostas de suprimento**: ordens planejadas de produção, requisições ou pedidos de compra, transferências. Nos ERPs em geral, uma ordem planejada é flexível e recalculável a cada rodada de planejamento; ao ser **firmada** ou convertida, vira uma **ordem de produção**, com BOM e roteiro congelados para aquela ordem, datas e reserva de materiais. O comportamento exato é do fabricante. Dois exemplos citados pelas documentações:

- Na documentação da SAP (versão antiga do help, mas ilustrativa do conceito), planned orders são convertidas para disparar o suprimento de componentes, podendo gerar requisições de compra, ordens de produção ou de processo.
- Na documentação da Microsoft para o Dynamics 365, o lead time de uma ordem de produção planejada vem de um valor estático do produto liberado, enquanto o de uma ordem firmada vem do agendamento que usa o roteiro e as restrições de recursos. Ou seja, **a data prometida pelo plano e a data realizável pelo agendamento podem divergir**.

## Estoque, compras e custos

**Estoque.** O ERP mantém saldo por item, depósito, lote e, em muitos casos, número de série, a partir de movimentações: recebimento, consumo em ordem, entrada de produto acabado, expedição, ajuste.

**Compras.** As necessidades líquidas de itens comprados viram requisições e pedidos de compra. Prazos de entrega dos fornecedores alimentam o planejamento. A documentação da Microsoft descreve o efeito: se o lead time do material é maior que o tempo até a necessidade, o sistema calcula o atraso e o propaga por todos os níveis da BOM até o pedido de venda.

**Custos industriais.** O ERP acumula custos de material, mão de obra e gastos gerais de fabricação por ordem, e os compara com o custo padrão. A qualidade desse cálculo depende de apontamentos fiéis, que é onde o MES entra: o realizado de material, tempo e refugo vem da execução.

## ERP versus MES: planejar versus executar

A diferença central, resumida em uma frase: **o ERP responde "o que e quanto precisamos fazer, com quê e a que custo"; o MES responde "o que está sendo feito agora, em qual máquina, e o que realmente aconteceu"**.

| Aspecto | ERP | MES |
|---|---|---|
| Horizonte | dias, semanas, meses | turno, hora, minuto |
| Granularidade | ordem, item, lote | operação, estação, evento |
| Foco | planejar, comprometer, contabilizar | executar, registrar, rastrear |
| Dado principal | demanda, estoque, custos | apontamentos, estados, qualidade |
| Falha tolerada | indisponibilidade curta sem parar a linha | idealmente nenhuma parada de linha |
| Origem da verdade | a ordem planejada e o saldo contábil | o realizado no chão de fábrica |

Em fábricas pequenas, o ERP pode cobrir um apontamento simples e dispensar um MES, o que é uma decisão legítima. O problema aparece quando se tenta usar o ERP para rastreabilidade detalhada, controle de paradas e acompanhamento em tempo real, funções para as quais ele não foi desenhado.

## Cenário: a demanda cai de 100 para 60

Voltando ao exemplo hipotético, suponha que o cliente reduza o pedido de A de 100 para 60 unidades. Executando a mesma consulta com demanda 60, as necessidades líquidas passam a A=50, B=80, C=50 e D=190 (antes, 90, 160, 90 e 430). Em um ERP real, a mudança se desdobra em várias frentes:

1. **Planejamento.** Na próxima rodada de MRP, as ordens planejadas encolhem. Note que, segundo a documentação da Microsoft, alterações manuais em ordens planejadas só são refletidas no restante do plano na rodada seguinte; o plano não é recalculado instantaneamente.
2. **Compras.** Pedidos já emitidos para D não desaparecem: o ERP sinaliza o excedente e alguém decide entre cancelar, adiar ou manter para consumo futuro, conforme as cláusulas com o fornecedor.
3. **Produção.** Ordens já firmadas e liberadas para o chão de fábrica têm BOM e quantidades congeladas. Alterar uma ordem em andamento exige reprogramar no MES e tratar o que já foi produzido.
4. **Estoque e custos.** O que foi produzido a mais vira estoque de produto acabado ou semiacabado, com impacto em capital de giro e em custos.

A lição de engenharia é que **a mudança se propaga em tempos diferentes por camadas diferentes**, e o sistema precisa expressar estados intermediários (planejado, firmado, liberado, em execução, concluído) em vez de supor que tudo é recalculável.

## Desafios de integração

**Consistência e dono do dado.** A ordem nasce no ERP; o realizado nasce no MES. Itens, BOMs e roteiros costumam ser mantidos no ERP e consumidos pelo MES. Duplicar o cadastro nos dois sistemas é fonte clássica de divergência.

**Sincronização assíncrona.** O ERP não precisa de resposta em milissegundos e o MES não deve parar por causa dele. A integração costuma ser baseada em mensagens ou arquivos, com reenvio e idempotência. A parte 5 do ISA-95 trata das transações entre sistemas de negócio e de manufatura; a adoção do vocabulário da norma ajuda, mas cada ERP e cada MES têm interfaces próprias.

**Granularidade.** O ERP quer quantidades por ordem; o chão de fábrica gera eventos por segundo. Alguém precisa agregar, e a fronteira dessa agregação é decisão de arquitetura.

**Tempo e fuso.** Fechamentos contábeis, turnos e horários de verão tornam a modelagem de datas mais delicada do que parece.

**Qualidade e logística.** Integrações com sistemas de qualidade (liberação ou bloqueio de lotes) e de logística (expedição, WMS, transporte) seguem a mesma lógica: o ERP precisa saber se um lote pode ser faturado e enviado, e esses sistemas precisam receber a ordem e devolver o resultado.

## Relação com engenharia de software

Na minha leitura, o ponto mais valioso para quem desenvolve é entender o ERP como **sistema de registro**, não como sistema de tempo real. Isso ajuda a decidir onde ele é a fonte da verdade (cadastros, ordens, saldos contábeis), onde ele consome (realizado) e como desenhar integrações tolerantes a atraso. Também ajuda a resistir à tentação de colocar lógica de chão de fábrica no ERP, ou lógica contábil no MES. O [artigo 05](/pt/blog/mes-erp-scada-historian-diferencas-e-integracao) coloca ERP, MES, SCADA e historiadores lado a lado.

## Conclusão

O ERP planeja a manufatura a partir de dados mestres, demanda e estoque, e a contabiliza ao final. A lógica de explosão de BOM com netting continua sendo o centro desse planejamento, mas ela vive no mundo das quantidades e datas planejadas, não no da execução. Quem integra ERP e MES precisa respeitar essa diferença de natureza e projetar para mudanças que se propagam em ritmos diferentes.

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura. O exemplo de BOM, a consulta SQL e o cenário de demanda são hipotéticos e ilustrativos.

- Microsoft. [Production planning (Planning Optimization), Dynamics 365 Supply Chain Management](https://learn.microsoft.com/en-us/dynamics365/supply-chain/master-planning/planning-optimization/production-planning), Microsoft Learn. Comportamento específico deste produto.
- SAP. [Planned orders, SAP Help (release 4.6C)](https://help.sap.com/saphelp_46c/helpdata/en/0a/2479384cda1269e10000009b38f8cf/content.htm). Documentação antiga, usada apenas para o conceito de conversão de ordens planejadas.
- OPC Foundation. [OPC 10030, 4.2.3 ISA-95](https://reference.opcfoundation.org/specs/OPC-10030/4.2.3), para os níveis e horizontes de tempo do ISA-95.
- ISA. [ISA-95 Standard: Enterprise-Control System Integration](https://www.isa.org/standards-and-publications/isa-standards/isa-95-standard).
- Sobre a história de MRP, MRP II e ERP: a narrativa e as atribuições (Orlicky, Wight, Gartner) vêm de fontes secundárias, como resumos de consultorias e fornecedores (por exemplo, [MRPeasy](https://www.mrpeasy.com/de/?p=6152) e [EBSCO Research Starters](https://www.ebsco.com/research-starters/business-and-management/material-requirements-planning-mrp)). Não consultei os textos originais; confirmar antes de citar formalmente.
