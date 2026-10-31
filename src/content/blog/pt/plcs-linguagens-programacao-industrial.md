---
title: "PLCs e IEC 61131-3: como o software controla máquinas"
description: "Como um PLC funciona: ciclo de varredura, I/O, Ladder, ST, FBD, SFC e IL da IEC 61131-3, com exemplos linha por linha e diferenças para software comum."
pubDate: 2026-10-31T09:30:00-03:00
author: "Gabriel Campos"
category: "Automação Industrial"
tags:
  - "PLC"
  - "IEC 61131-3"
  - "Ladder"
  - "Structured Text"
  - "Automação Industrial"
  - "Série Automação Industrial"
draft: false
lang: "pt-BR"
---

No [artigo anterior](/pt/blog/arquitetura-de-software-fabrica-moderna) o PLC apareceu como o elemento do nível de controle: o que lê sensores, executa lógica e comanda atuadores. Aqui abro essa caixa. Como um controlador programável executa código? Por que a programação industrial tem linguagens próprias? E o que muda, em termos de engenharia de software, quando o programa move uma prensa em vez de devolver um JSON?

## O que é um PLC

Um **PLC** (Programmable Logic Controller, ou CLP em português) é um computador industrial projetado para controlar processos físicos de forma contínua e previsível. Ele tem CPU, memória, módulos de entrada e saída (ou acesso a I/O remoto por rede) e um sistema de execução que repete o programa de controle indefinidamente.

A norma **IEC 61131** reúne a família de padrões para controladores programáveis. A parte 3, **IEC 61131-3**, define a sintaxe e a semântica de um conjunto unificado de linguagens de programação para esses controladores. A primeira edição é do início dos anos 1990; a terceira edição foi publicada em 2013 e, segundo o catálogo da IEC, foi substituída em maio de 2025 por uma nova edição. A página de catálogo da IEC descreve a edição de 2013 como uma revisão técnica compatível com a segunda, que acrescentou novos tipos de dados, funções de conversão, referências, espaços de nomes e recursos de orientação a objetos para classes e blocos de função.

Duas observações importantes de contexto:

- A IEC 61131-3 padroniza **linguagens e modelo de software**, não o hardware nem os protocolos de comunicação. Protocolos como PROFINET ou EtherNet/IP são outro assunto (artigo 06).
- **Conformidade é parcial e dependente do fabricante.** Cada ambiente de engenharia implementa a norma com extensões e omissões próprias. Um código escrito para um fabricante raramente roda sem adaptação em outro.

## Por dentro do PLC: entradas, saídas e o ciclo de varredura

O modelo de execução clássico é o **ciclo de varredura** (scan cycle), que se repete continuamente:

1. **Leitura das entradas.** O estado dos módulos de entrada é copiado para uma região de memória chamada imagem de processo (process image).
2. **Execução do programa.** A lógica é calculada sobre essa cópia, não diretamente sobre o hardware.
3. **Escrita das saídas.** Os resultados são transferidos da imagem de saída para os módulos físicos.
4. **Tarefas de sistema** (comunicação, diagnóstico), que variam conforme o controlador.

O manual de ciclo e tempos de resposta do Siemens S7-1500 descreve exatamente essa estrutura: em cada ciclo, as imagens de processo de saída e de entrada são atualizadas e então o programa cíclico (o bloco OB1) é executado. O mesmo manual faz uma distinção útil: o **tempo de ciclo** é parte do **tempo de resposta**, que é medido do momento em que um sinal de entrada chega até a reação na saída. Ou seja, uma entrada que muda no meio do ciclo só será vista no ciclo seguinte.

Por que usar uma imagem de processo? Para que, durante uma única passagem do programa, cada entrada tenha um valor estável. Sem isso, duas linhas do mesmo programa poderiam enxergar valores diferentes do mesmo sensor, tornando o comportamento difícil de prever.

A IEC 61131-3 acrescenta uma camada de organização: um **recurso** (aproximadamente, uma CPU) pode ter várias **tarefas**, e cada programa pode ser associado a uma tarefa executada periodicamente ou por evento. É assim que um mesmo controlador roda uma rotina rápida de controle de movimento e uma rotina mais lenta de sequenciamento, com prioridades distintas. Nomes e detalhes (OBs na Siemens, tarefas em outras plataformas) são específicos de cada fabricante.

### Entradas e saídas

- **Digitais:** dois estados. Exemplos: um sensor de presença (entrada), uma contatora de motor (saída).
- **Analógicas:** valores em faixa contínua, convertidos para número inteiro pelo módulo. Exemplos: um transmissor de pressão em 4–20 mA, uma válvula proporcional. O programa precisa **escalonar** o valor bruto para unidade de engenharia (bar, °C, mm) e tratar casos de sensor em falha.
- **Especiais:** contadores rápidos, encoders, saídas de pulso, comunicação serial. Dependem de módulos e recursos do fabricante.

## As cinco linguagens da IEC 61131-3

A norma define linguagens gráficas e textuais que convivem no mesmo projeto e compartilham o mesmo modelo de dados e de blocos.

**Ladder Diagram (LD).** Gráfica, inspirada nos diagramas de relés elétricos. A lógica é desenhada em degraus (rungs) entre dois trilhos de alimentação. É a linguagem mais associada a PLCs, por ser familiar a eletricistas e técnicos de manutenção.

**Function Block Diagram (FBD).** Gráfica, baseada em blocos conectados por linhas de sinal, como em um diagrama de circuito. Muito usada em malhas de controle, intertravamentos e processamento de sinais analógicos.

**Structured Text (ST).** Textual, de sintaxe próxima do Pascal. É a mais próxima do desenvolvimento de software convencional: variáveis, condicionais, laços, funções. Adequada a algoritmos, cálculos, manipulação de dados e lógica com muitas condições.

**Sequential Function Chart (SFC).** Gráfica, organiza o programa em **passos** (estados) e **transições** (condições), com suporte a sequências paralelas. Natural para processos sequenciais e máquinas de estado.

**Instruction List (IL).** Textual de baixo nível, semelhante a assembly. Foi **depreciada na terceira edição (2013)** e, segundo a literatura consultada, **removida na quarta edição (2025)**. Ainda aparece em código legado, e alguns fabricantes mantêm suporte por compatibilidade. Para código novo, não é a escolha.

### Quando cada uma costuma ser usada

| Linguagem | Estilo | Usos típicos | Ponto forte | Ponto fraco |
|---|---|---|---|---|
| LD | gráfica | intertravamentos, lógica discreta, manutenção em campo | legível por quem vem da elétrica | cresce mal em lógica complexa ou cálculo |
| FBD | gráfica | malhas de controle, sinais analógicos | fluxo de sinais explícito | diagramas grandes ficam densos |
| ST | textual | algoritmos, cálculos, estruturas de dados | expressividade, revisão de código textual | menos acessível a quem só conhece relés |
| SFC | gráfica | sequências e máquinas de estado | estado e transição visíveis | exige disciplina de modelagem |
| IL | textual | código legado | compacta | descontinuada |

Na prática, as equipes misturam: SFC ou ST para o sequenciamento, Ladder para intertravamentos que a manutenção precisa diagnosticar, FBD para malhas, ST para cálculos. Essa é uma observação de prática de engenharia, não uma regra normativa, e as preferências variam por setor, região e fabricante.

## Exemplo 1: partida e parada de motor em Ladder

O exemplo clássico é o circuito de **selo** (seal-in): um botão momentâneo liga o motor, e o próprio motor "se mantém" ligado até que um botão de parada ou uma proteção o desligue. A representação a seguir é ilustrativa, em texto:

```text
|     Start        Stop      Overload       Motor    |
|--+---[ ]----+----[/]--------[/]-----------( )------|
|  |          |                                      |
|  |  Motor   |                                      |
|  +---[ ]----+                                      |
```

O contato `Motor` fica em paralelo com `Start`: qualquer um dos dois pode alimentar o restante do degrau.

Leitura, elemento por elemento:

- `[ ]` é um **contato normalmente aberto**: conduz quando o bit associado é 1.
- `[/]` é um **contato normalmente fechado**: conduz quando o bit é 0.
- `( )` é uma **bobina**: recebe o resultado do degrau e escreve no bit associado.
- `Start`: botão de partida, entrada digital. Quando pressionado, conduz.
- `Motor` (contato em paralelo): lê o estado da própria saída. Depois que o motor liga, esse contato conduz e mantém o degrau energizado mesmo quando o operador solta `Start`. Isso é o selo.
- `Stop`: contato normalmente fechado. Enquanto o botão não é pressionado, o bit é 0 no sentido do contato, e ele conduz. Ao apertar, interrompe o degrau.
- `Overload`: contato do relé térmico, também normalmente fechado, interrompe se a proteção atuar.
- `Motor` (bobina): saída que aciona a contatora.

Um detalhe de engenharia: botões de parada e proteções são tradicionalmente cabeados como **contato normalmente fechado** no campo. Assim, se o fio se romper, o sistema vê "parada" em vez de continuar rodando. Esse é um princípio de projeto *fail-safe* de nível elementar. Funções de segurança de verdade (parada de emergência, proteção de operadores) seguem normas específicas e costumam usar hardware e controladores de segurança dedicados; este exemplo **não** é um circuito de segurança.

Na varredura, este degrau é avaliado a cada ciclo. Se `Start` for pressionado durante um ciclo, na próxima leitura o PLC energiza `Motor` na imagem de saída e a escrita física ocorre no final desse mesmo ciclo.

## Exemplo 2: controle de nível com Structured Text

O trecho abaixo é **ilustrativo** e não foi compilado em um ambiente de fabricante específico. Ele controla uma bomba que enche um tanque, com histerese, proteção contra funcionamento a seco e falha com rearme.

```pascal
PROGRAM EncheTanque
VAR
    NivelBaixo  AT %IX0.0 : BOOL;  // sensor de nível baixo (TRUE = líquido cobre o sensor)
    NivelAlto   AT %IX0.1 : BOOL;  // sensor de nível alto
    FluxoOk     AT %IX0.2 : BOOL;  // fluxostato na saída da bomba
    Rearme      AT %IX0.3 : BOOL;  // botão de rearme de falha
    Bomba       AT %QX0.0 : BOOL;  // saída para a contatora

    FalhaBomba  : BOOL;
    TempoSeco   : TON;             // temporizador de atraso na ligação
END_VAR

// 1. Histerese de nível
IF NOT FalhaBomba THEN
    IF NOT NivelBaixo THEN
        Bomba := TRUE;             // nível abaixo do mínimo: liga
    ELSIF NivelAlto THEN
        Bomba := FALSE;            // atingiu o máximo: desliga
    END_IF;
ELSE
    Bomba := FALSE;                // em falha, nunca liga
END_IF;

// 2. Proteção contra funcionamento a seco
TempoSeco(IN := Bomba AND NOT FluxoOk, PT := T#5S);
IF TempoSeco.Q THEN
    FalhaBomba := TRUE;
END_IF;

// 3. Rearme manual
IF Rearme THEN
    FalhaBomba := FALSE;
END_IF;
END_PROGRAM
```

Linha por linha:

- **Declarações `AT %IX0.0`** associam variáveis simbólicas a endereços diretos de I/O (`%I` entrada, `%Q` saída, `X` bit). Em projetos reais, o mapeamento costuma ser feito na configuração de hardware do fabricante.
- **Bloco 1 (histerese).** Enquanto não há falha: se o nível está abaixo do mínimo (`NOT NivelBaixo`), liga a bomba. Se chegou ao máximo, desliga. Entre os dois sensores, nenhuma condição é verdadeira e `Bomba` **mantém o valor anterior**, comportamento que evita liga-desliga rápido. Isso só funciona porque o programa é executado ciclicamente e as variáveis persistem entre ciclos.
- **Bloco 2 (funcionamento a seco).** `TON` é o temporizador padrão da norma. Ele só começa a contar quando `IN` é verdadeiro, isto é, a bomba está ligada **e** o fluxostato não confirma fluxo. Se isso dura 5 segundos (`T#5S`, literal de tempo da norma), `TempoSeco.Q` fica verdadeiro e a falha é registrada. Como `FalhaBomba` é uma variável que só é limpa pelo rearme, a falha fica **memorizada**.
- **Bloco 3 (rearme).** Limpa a falha quando o operador pressiona o botão. Como vem depois do bloco 2, em um ciclo em que ambos estejam verdadeiros o rearme vence. Aqui isso não causa problema, pois a bomba já foi desligada no ciclo seguinte à falha e o temporizador zera. Em outros projetos, a ordem das linhas é uma decisão de projeto.

Observe que a **ordem de execução importa**: diferente de uma aplicação orientada a eventos, o resultado depende da posição das instruções dentro do ciclo.

## Falhas e estados de máquina

Uma parte substancial do código de um PLC não é a lógica feliz, e sim o tratamento de condições anormais: sensor em curto, atuador que não responde, partida interrompida, queda de energia, modo manual versus automático. Algumas práticas de engenharia recorrentes (boas práticas, não exigências da norma):

- Modelar a máquina como **máquina de estados** explícita (parada, preparando, produzindo, em falha, em manutenção), em vez de um emaranhado de condições.
- Definir o **estado seguro** de cada saída em caso de falha ou de perda de comunicação.
- Tratar **modo manual e automático** separadamente, com intertravamentos claros.
- Usar **variáveis retentivas** (`RETAIN`, definido pela norma) com critério, para decidir o que sobrevive a um desligamento.
- Registrar **diagnóstico**: códigos de falha, contadores, timestamps de eventos que o SCADA e o MES possam consumir.

Controladores também possuem um **watchdog** do tempo de ciclo: se o programa demorar mais que o limite configurado, o controlador entra em um estado de falha ou chama um tratamento definido pelo fabricante. Os detalhes são do fabricante.

## Determinismo e diferenças para o desenvolvimento convencional

Na minha leitura, é aqui que desenvolvedores generalistas mais se surpreendem.

**Execução cíclica e previsível.** Um PLC não "espera requisições": ele roda o mesmo programa em laço, e o tempo de ciclo é uma propriedade de projeto. Para a maioria das aplicações de controle, importa que o tempo de ciclo seja **limitado e previsível**, não necessariamente o menor possível.

**Sem alocação dinâmica e sem exceções.** A linguagem não incentiva memória dinâmica, recursão ou exceções não tratadas. Variáveis têm tamanho conhecido. Esse estilo existe para tornar o comportamento analisável.

**O efeito é físico.** Um erro de lógica não devolve um erro HTTP: pode quebrar uma ferramenta, perder um lote ou ferir alguém. Por isso se valorizam revisão, simulação, comissionamento por etapas e, em funções de segurança, normas e certificações específicas.

**Ciclo de vida longo.** Programas de controle ficam em produção por décadas, e o ambiente de engenharia (versão do software, licenças, firmware) faz parte do que precisa ser preservado.

**Ferramentas.** Cada fabricante tem seu ambiente de desenvolvimento (por exemplo, TIA Portal da Siemens, Studio 5000 da Rockwell, TwinCAT da Beckhoff, e ambientes baseados em CODESYS), com compilador, simulador, diagnóstico online e bibliotecas próprias. Isso é uma diferença cultural importante: o "build" frequentemente é um download para o controlador, e depurar muitas vezes significa observar variáveis em execução na máquina. Para melhorar a portabilidade, a **IEC 61131-10** (publicada em 2019) define um formato de troca baseado em XML para projetos IEC 61131-3, que cobre configurações, tipos e unidades de organização de programa, nas cinco linguagens. A adoção prática varia por ferramenta.

Também há movimento de aproximar essas práticas das de software convencional: versionamento em Git de exportações em texto, testes em simulação, bibliotecas reutilizáveis e revisão de código. O ritmo e as possibilidades dependem muito do ecossistema do fabricante.

## Proprietário versus aberto

A IEC 61131-3 é um padrão aberto no sentido de ser uma norma publicada, mas o ecossistema ao redor é majoritariamente **proprietário**: instruções específicas, bibliotecas, formato de projeto e licenças de cada fabricante. Padrão de linguagem não significa portabilidade total. Quando se escolhe uma plataforma, escolhe-se também um conjunto de ferramentas e um horizonte de suporte.

## Relação com engenharia de software

O PLC não substitui o software de nível superior, e o inverso também é verdade. Um MES ou um serviço backend que precise interagir com o controlador deve tratá-lo como **autoridade sobre o estado da máquina**: pedir comandos pelas interfaces expostas (tags, métodos), nunca presumir que o programa vai aceitá-los em qualquer estado, e tolerar atrasos e recusas. Conhecer o ciclo de varredura e o modelo de estados do controlador evita erros de integração sutis, como ler dois valores que pertencem a ciclos diferentes e tratá-los como instantâneo consistente.

## Conclusão

Programar um PLC é engenharia de software com restrições de outro tipo: execução cíclica, determinismo, consequência física e vida longa. A IEC 61131-3 oferece um modelo comum de linguagens e de organização de programa, mas o dia a dia depende fortemente do ecossistema do fabricante. Quem vem do mundo web precisa trocar o modelo mental de requisição e resposta pelo de um laço que nunca para, e aceitar que o código certo é o que ainda funciona bem em condições de falha.

O próximo passo na série é subir uma camada: o [MES](/pt/blog/o-que-e-mes-manufacturing-execution-system), que conecta o que o controlador executa ao que a empresa planejou.

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura. Os exemplos de código são ilustrativos e não foram compilados em um ambiente de fabricante.

- IEC. [IEC 61131-3:2013, Programmable controllers, Part 3: Programming languages](https://webstore.iec.ch/publication/4552). Página de catálogo: edição 3.0, de 2013-02-20, retirada em 2025-05-22 e substituída pela edição de 2025.
- IEC. [IEC 61131-10:2019, PLC open XML exchange format](https://webstore.iec.ch/publication/33034).
- PLCopen. [PLCopen XML exchange](https://plcopen.org/node/223) e [documento de especificação](https://www.plcopen.org/sites/default/files/downloads/plcopen_xml_exchange.pdf).
- Siemens. [S7-1500, Cycle and response times, function manual](https://support.industry.siemens.com/cs/attachments/59193558/s71500_cycle_and_reaction_times_function_manual_en-US_en-US.pdf).
- Wikipedia. [IEC 61131-3](https://en.wikipedia.org/wiki/IEC_61131-3), usada apenas para a informação de que IL foi depreciada em 2013 e removida em 2025; confirmar no texto da norma.
