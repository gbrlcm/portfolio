---
title: "Arquitetura de software de uma fábrica: do sensor ao ERP"
description: "Como se organizam sensores, PLCs, SCADA, MES, historiadores e ERP, o modelo ISA-95 e o caminho de um dado do chão de fábrica ao sistema corporativo."
pubDate: 2026-10-31T09:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/arquitetura-de-software-fabrica-moderna.webp"
coverAlt: "Ilustração com cinco camadas empilhadas de L4 a L0: ERP, MES, PLC e SCADA, sensores e processo, com o MES destacado"
category: "Automação Industrial"
tags:
  - "Automação Industrial"
  - "ISA-95"
  - "MES"
  - "SCADA"
  - "PLC"
  - "Série Automação Industrial"
draft: false
lang: "pt-BR"
---

Para quem vem de desenvolvimento web ou de sistemas corporativos, uma fábrica costuma parecer uma caixa-preta: máquinas de um lado, um ERP do outro, e "alguma integração" no meio. Na prática existe um conjunto bem definido de camadas, cada uma com responsabilidades, escalas de tempo e requisitos diferentes. Entender esse mapa é o pré-requisito para qualquer trabalho de software em manufatura.

Este é o primeiro artigo de uma série de estudos sobre automação industrial e engenharia de software para manufatura. Aqui o objetivo é a visão geral: quais são os componentes, o que cada um faz, como os dados percorrem a arquitetura e onde entra o modelo ISA-95.

## O chão de fábrica (shop floor)

O chão de fábrica é onde a produção física acontece: máquinas, linhas, esteiras, tanques, fornos, robôs. Do ponto de vista de software, o que importa é a fronteira entre o mundo físico e o digital, que é feita por três tipos de elementos:

- **Sensores e instrumentação** medem grandezas físicas (temperatura, pressão, nível, vazão, posição, presença) e as convertem em sinais elétricos ou digitais.
- **Atuadores** fazem o caminho inverso: recebem um comando e produzem efeito físico (motores, válvulas, cilindros pneumáticos, resistências).
- **Controladores** leem os sensores, executam a lógica de controle e comandam os atuadores. O representante mais comum é o **PLC** (Programmable Logic Controller), tema do próximo artigo da série.

A fronteira costuma ser feita por sinais discretos (ligado/desligado), sinais analógicos (por exemplo, laços de corrente de 4–20 mA, um padrão de instrumentação amplamente usado) ou por barramentos digitais de campo. O ponto central é que essa camada opera com **ciclos curtos e previsíveis**: o controlador repete sua lógica continuamente, em intervalos da ordem de milissegundos, independentemente de qualquer sistema acima dele estar disponível.

## Controle, supervisão e execução: quem faz o quê

Acima do controle de máquina existem sistemas com papéis distintos. Confundi-los é a origem de boa parte dos problemas de integração.

**PLC (controle).** Executa a lógica que liga e desliga as saídas com base nas entradas. É um computador industrial robusto, com execução cíclica e determinística. Não é um sistema de gestão: ele sabe "acionar o motor se o sensor de presença estiver ativo", não "qual pedido de cliente está sendo produzido".

**HMI (interface homem-máquina).** Tela local de operação de uma máquina ou estação, onde o operador vê estados e dá comandos.

**SCADA (supervisão e aquisição de dados).** Sistema que se conecta a vários controladores para supervisionar um processo ou uma planta: telas sinópticas, alarmes, tendências, comandos remotos e coleta de dados. SCADA **não é** PLC: o PLC controla; o SCADA supervisiona e coleta dados dos controladores.

**Historiador de dados (historian).** Banco de dados otimizado para séries temporais de variáveis de processo (valores de sensores amostrados ao longo do tempo), com compressão e consultas por intervalo. Está normalmente associado ao SCADA ou ao nível de operações.

**MES (Manufacturing Execution System).** Executa e acompanha a produção: ordens de fabricação em andamento, apontamentos, rastreabilidade de lotes, qualidade, paradas, OEE. É o elo entre o plano e o que realmente acontece na linha. O artigo 03 da série trata dele em detalhe.

**ERP.** Sistema de gestão empresarial: pedidos, estoque, compras, custos, financeiro e planejamento. Trabalha com horizontes de dias, semanas e meses e não precisa saber o estado de uma máquina a cada segundo.

Uma forma útil de resumir: o PLC responde "o que esta máquina deve fazer agora?", o SCADA "o que está acontecendo no processo?", o MES "o que estamos produzindo e como está indo?" e o ERP "o que precisamos produzir, comprar e entregar?".

## O modelo ISA-95 (IEC 62264)

A norma **ISA-95**, publicada também como **IEC/ISO 62264**, trata da integração entre sistemas corporativos e sistemas de controle. Sua Parte 1 define terminologia e modelos de objetos para decidir que informação é trocada entre as funções de negócio, de operações de manufatura e de controle. Suas partes seguintes detalham atributos (Parte 2), atividades de operações de manufatura (Parte 3), modelos de objetos de operações (Parte 4) e transações entre negócio e manufatura (Parte 5). A norma é paga; as descrições aqui seguem a documentação pública e as fontes listadas, e as edições vigentes devem ser confirmadas nas lojas da ISA e da IEC.

O modelo mais conhecido é a **hierarquia funcional** em níveis, comumente descrita assim (conforme a descrição da OPC Foundation sobre a norma):

| Nível | Papel | Escala de tempo típica | Sistemas típicos |
|---|---|---|---|
| 4 | Planejamento de negócio e logística | meses, semanas, dias | ERP |
| 3 | Gestão de operações de manufatura | dias, turnos, horas, minutos, segundos | MES/MOM, qualidade, manutenção, inventário |
| 2 | Monitoramento e controle | subsegundos | PLC, DCS, SCADA/HMI (conforme o caso) |
| 1 | Sensoriamento e atuação | — | sensores e atuadores ligados ao controle |
| 0 | Processo físico | — | a produção em si |

Dois cuidados de leitura:

1. **O posicionamento do SCADA varia por fonte.** A descrição da OPC Foundation cita SCADA entre os sistemas do nível 3, enquanto na literatura de segurança industrial é comum vê-lo no nível 2 (supervisão e controle). Na prática, depende da função: telas de operação e controle direto ficam mais perto do nível 2; agregação de dados da planta fica mais perto do 3.
2. **A numeração 0 a 4 mistura duas coisas.** Ela costuma ser chamada de "modelo Purdue" (do *Purdue Enterprise Reference Architecture*, PERA), mas há divergência entre fontes sobre quais níveis fazem parte do PERA original e quais foram popularizados pela literatura de segurança. Por isso, trate "Purdue" e "ISA-95" como modelos relacionados, não como sinônimos exatos.

A norma foca, sobretudo, na **troca de informação entre sistemas do nível 3 e entre os níveis 3 e 4**, organizada em torno de quatro categorias: material, equipamento, ativos físicos e pessoal.

Um ponto que merece ênfase: **ISA-95 é um modelo funcional e de informação, não uma arquitetura de software obrigatória.** Ela diz que tipo de dado atravessa a fronteira entre planejamento e execução e que atividades existem em cada nível, mas não exige que cada nível seja um produto separado, nem uma tecnologia específica. Um mesmo produto pode cobrir mais de um nível, e arquiteturas modernas (com dados fluindo diretamente do chão de fábrica para a nuvem, por exemplo) rompem a pirâmide estrita sem deixar de usar o vocabulário da norma.

## Redes e protocolos: como os níveis conversam

Entre os níveis existem redes e protocolos com propósitos diferentes. Ainda sem entrar em detalhes, que são o tema do artigo 06:

- **Rede de campo e de controle:** liga sensores, atuadores, drives e PLCs. Costuma usar protocolos industriais de fabricantes ou padrões como PROFINET, EtherNet/IP, EtherCAT, Modbus e outros, com requisitos de latência e determinismo.
- **Rede de supervisão:** liga controladores a SCADA, historiadores e estações de engenharia.
- **Rede corporativa (IT):** onde vivem ERP, bancos de dados corporativos, e-mail e internet.

Um protocolo industrial **não é** uma linguagem de programação e um modelo de informação **não é** um protocolo. O **OPC UA**, por exemplo, é uma arquitetura de integração padronizada pela OPC Foundation (série OPC 10000, também publicada como IEC 62541) que combina um modelo de informação, serviços e mapeamentos de transporte. Ele suporta o padrão cliente-servidor e o publish-subscribe sobre o mesmo modelo de informação, e é um dos mecanismos usados para levar dados do controle para sistemas acima.

Entre as redes de OT (tecnologia operacional) e de IT costuma haver segmentação e uma zona intermediária (DMZ), por razões de segurança que o artigo 10 aprofunda.

## Do sensor ao ERP: um fluxo conceitual

O exemplo a seguir é **hipotético e simplificado**, criado para ilustrar o raciocínio. Não descreve uma fábrica real. Imagine uma linha de envase que produz um lote de um produto, com uma ordem de produção emitida pelo ERP.

<figure>
  <img src="/images/blog/arquitetura-de-software-fabrica-moderna-diagrama.webp" alt="Diagrama com cinco níveis de L4 a L0 (ERP, MES e historiador, PLC e SCADA, sensores e atuadores, processo físico). Setas sobem com contagens e eventos e descem com ordens e receitas. À direita, cinco passos numerados do sensor ao ERP." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Os níveis do ISA-95 e o caminho de uma contagem, do sensor ao ERP (exemplo hipotético). Diagrama do autor.</figcaption>
</figure>

O fluxo, de baixo para cima:

1. **Medição.** Um sensor detecta que um frasco passou na posição de contagem. O sinal chega a uma entrada do PLC.
2. **Controle.** A cada ciclo de varredura, o PLC lê a entrada, executa a lógica e incrementa um contador. Se algo sair do normal, ele trata o estado de falha localmente, sem depender de rede ou de sistemas superiores.
3. **Exposição do dado.** O contador e os estados da máquina ficam disponíveis como variáveis (tags) que SCADA, historiador ou um gateway leem por um protocolo industrial, por exemplo OPC UA ou Modbus TCP.
4. **Registro e supervisão.** O SCADA exibe o estado da linha e dispara alarmes. O historiador grava as séries temporais de processo.
5. **Contextualização no MES.** O MES associa esses valores a uma ordem de produção, a um lote e a um turno: "estas 12.000 unidades pertencem à ordem X, lote Y". O dado bruto ganha significado de negócio.
6. **Retorno ao ERP.** O MES devolve ao ERP o que interessa ao nível 4: quantidade produzida, consumo de materiais, refugo, status da ordem. O ERP atualiza estoque e custos.

Dois pontos de engenharia importam nesse caminho. Primeiro, **cada passo para cima reduz a frequência e aumenta o contexto**: o PLC lida com milissegundos e bits; o ERP, com quantidades consolidadas por ordem. Segundo, **a direção de comando é assimétrica**: o plano desce (ordens, receitas) e o resultado sobe (contagens, eventos), mas a decisão de segurança da máquina nunca depende de um nível superior estar disponível.

## Desafios da integração OT/IT

A integração entre tecnologia operacional e tecnologia da informação é onde a maior parte dos projetos encontra dificuldade, por diferenças de natureza e não só de tecnologia:

- **Prioridades diferentes.** Em TI corporativa, a ordem costuma ser confidencialidade, integridade e disponibilidade. Em OT, a disponibilidade e a segurança operacional (de pessoas e do processo) vêm primeiro. O guia NIST SP 800-82 Rev. 3 trata justamente de proteger OT respeitando seus requisitos de desempenho, confiabilidade e segurança.
- **Ciclo de vida.** Equipamentos industriais ficam em operação por muito mais tempo do que servidores corporativos, e atualizá-los exige parada planejada.
- **Heterogeneidade.** Uma mesma planta mistura fabricantes, gerações de PLCs e protocolos. A padronização de modelo de informação (OPC UA, vocabulário ISA-95) existe justamente para reduzir esse atrito, mas não o elimina.
- **Qualidade e semântica dos dados.** Um valor numérico sem unidade, origem, qualidade (por exemplo, "sensor em falha") ou timestamp confiável é fonte de erro em relatórios e indicadores.
- **Falha parcial.** Rede cai, MES fica indisponível, ERP está em manutenção. A planta precisa continuar produzindo e os sistemas precisam reconciliar dados depois.

## Relação com engenharia de software

Na minha leitura, o ensinamento prático para quem desenvolve software nesse ambiente é respeitar as fronteiras entre as camadas:

- **Não colocar lógica de segurança ou de controle em software de nível superior.** O controle fica no controlador, mesmo que o sistema acima faça a coordenação.
- **Projetar para desacoplamento.** Integrações assíncronas, filas e armazenamento local temporário (store-and-forward) evitam que uma queda no ERP pare a produção. O artigo 07 explora essas decisões.
- **Modelar o domínio com o vocabulário da norma.** Falar em ordem, lote, equipamento, material e pessoal, nos termos do ISA-95, facilita a conversa com engenheiros de automação e a integração com produtos de terceiros.
- **Tratar a arquitetura de referência como mapa, não como obrigação.** O que importa é cada dado ter dono, escala de tempo e fronteira de responsabilidade claros.

## Conclusão

Uma fábrica moderna não tem um "sistema" único, e sim um conjunto de camadas que operam em escalas de tempo muito diferentes, do ciclo de milissegundos do PLC ao planejamento mensal do ERP. O ISA-95 oferece o vocabulário e o modelo de informação para organizar essa conversa, sem impor uma arquitetura de software. Quem entende o que cada camada faz, e principalmente o que ela **não** deve fazer, consegue projetar integrações que sobrevivem a falhas e se mantêm compreensíveis.

Os próximos artigos aprofundam cada peça: [PLCs e linguagens de programação industrial](/pt/blog/plcs-linguagens-programacao-industrial), o [MES](/pt/blog/o-que-e-mes-manufacturing-execution-system) e os [protocolos de comunicação industrial](/pt/blog/protocolos-industriais-opc-ua-modbus-mqtt).

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura. O exemplo de linha de envase é hipotético.

- OPC Foundation. [OPC 10030, 4.2.3 ISA-95](https://reference.opcfoundation.org/specs/OPC-10030/4.2.3), OPC UA for ISA-95 Common Object Model.
- OPC Foundation. [OPC 10000-1, Overview and Concepts](https://reference.opcfoundation.org/specs/OPC-10000-1/full), OPC Unified Architecture.
- OPC Foundation. [OPC 10000-14, PubSub](https://reference.opcfoundation.org/specs/OPC-10000-14/full), OPC Unified Architecture.
- ISA. ANSI/ISA-95.00.01-2010 (IEC 62264-1), *Enterprise-Control System Integration, Part 1: Models and Terminology*. Catálogo: [ANSI Webstore](https://webstore.ansi.org/standards/isa/ansiisa9500012010iec62264mod).
- NIST. [SP 800-82 Rev. 3, Guide to Operational Technology (OT) Security](https://csrc.nist.gov/pubs/sp/800/82/r3/final), setembro de 2023.
- Siemens. [ISA-95 framework and layers](https://www.sw.siemens.com/en-US/technology/isa-95-framework-layers/) (descrição de fabricante; os níveis 1 e 2 são descritos de forma mais livre do que na norma).
