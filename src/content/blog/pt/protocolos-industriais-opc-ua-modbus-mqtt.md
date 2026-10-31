---
title: "OPC UA, Modbus, MQTT e protocolos industriais, comparados"
description: "Modbus, OPC UA, MQTT, PROFINET, EtherNet/IP, EtherCAT e CANopen têm propósitos diferentes. Com mensagens reais e um exemplo PLC, gateway e backend."
pubDate: 2026-10-31T11:30:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/protocolos-industriais-opc-ua-modbus-mqtt.webp"
coverAlt: "Ilustração de um PLC ligado por Modbus a um gateway, que se liga por MQTT a um backend, com um quadro Modbus TCP em hexadecimal"
category: "Automação Industrial"
tags:
  - "OPC UA"
  - "Modbus"
  - "MQTT"
  - "PROFINET"
  - "Protocolos Industriais"
  - "Série Automação Industrial"
draft: false
lang: "pt-BR"
translationKey: "industrial-protocols-opc-ua-modbus-mqtt"
---

Quando alguém diz "vamos integrar a máquina ao sistema", a primeira pergunta de engenharia deveria ser: **integrar como, e com que garantias?** Os protocolos industriais não são variações do mesmo produto. Alguns existem para sincronizar um servo-motor a cada fração de milissegundo; outros, para ler um registrador de um medidor; outros, para entregar dados de milhares de máquinas a uma aplicação na nuvem. Tratá-los como equivalentes é um dos erros mais comuns de quem chega ao tema vindo do desenvolvimento de software.

Este é o sexto artigo da série. Ele se apoia na [arquitetura em camadas](/pt/blog/arquitetura-de-software-fabrica-moderna) e na [comparação entre MES, ERP, SCADA e historiadores](/pt/blog/mes-erp-scada-historian-diferencas-e-integracao).

## Três coisas diferentes que se confundem

Antes de comparar, vale separar três conceitos:

1. **Protocolo de comunicação.** Define como os bytes trafegam: formato de mensagem, endereçamento, temporização, tratamento de erro. Exemplo: Modbus, MQTT, o transporte binário do OPC UA.
2. **Padrão de integração / arquitetura.** Define papéis e padrões de interação: cliente-servidor, publish-subscribe, descoberta, segurança. O OPC UA é, ao mesmo tempo, protocolo e arquitetura.
3. **Modelo de informação.** Define o *significado* dos dados: que uma variável é uma temperatura, em qual unidade, pertencente a qual equipamento, com qual tipo. Modbus quase não tem isso (um registrador é só um número de 16 bits; o significado vem de uma tabela do fabricante). O OPC UA tem um modelo de informação explícito e extensível.

Nenhum deles é uma linguagem de programação. As linguagens (Ladder, ST, C#, Python) usam bibliotecas que implementam os protocolos.

## Cliente-servidor e publish-subscribe

No modelo **cliente-servidor**, quem precisa do dado o pede (ou assina) diretamente a quem o detém. Modbus e a operação básica do OPC UA são assim. Simples de raciocinar, mas o cliente precisa saber onde está cada servidor, e cada cliente adicional gera mais carga sobre o dispositivo.

No **publish-subscribe**, o produtor publica em um tópico ou canal; os consumidores assinam sem conhecer o produtor. Tipicamente há um intermediário (broker). É assim com MQTT. O OPC UA também define um modo PubSub (parte 14 da especificação), que, segundo a OPC Foundation, usa o mesmo modelo de informação do modo cliente-servidor; um publicador costuma ser um servidor OPC UA e um assinante, um cliente, mas isso não é obrigatório.

## Modbus: simples, antigo e ainda onipresente

O **Modbus** é um protocolo de aplicação do tipo requisição-resposta, desenhado para a comunicação com controladores. Existem variantes sobre linha serial (RTU e ASCII) e sobre TCP/IP, esta última na porta 502. O dado é organizado em quatro áreas: *coils* (bits de saída), *discrete inputs* (bits de entrada), *input registers* e *holding registers* (palavras de 16 bits). A especificação define códigos de função, como 0x03 (ler holding registers) e 0x10 (escrever vários registradores).

O que ele **não** tem: modelo de informação (o significado dos registradores vem do manual do dispositivo), publicação por exceção (o cliente precisa fazer polling), e, no protocolo básico, autenticação e criptografia. Isso não o torna inadequado; torna-o apropriado a certos contextos, especialmente dispositivos simples e redes isoladas. Existem extensões de segurança em especificações separadas, que não consultei para este artigo.

Um exemplo concreto, em Modbus TCP. A requisição para ler 3 holding registers a partir do endereço 0 do dispositivo (unit id) 1:

```text
00 01   00 00   00 06   01   03   00 00   00 03
 │       │       │      │    │     │       └ quantidade: 3 registradores
 │       │       │      │    │     └ endereço inicial: 0
 │       │       │      │    └ função 0x03: Read Holding Registers
 │       │       │      └ unit id
 │       │       └ comprimento do restante (6 bytes)
 │       └ identificador de protocolo (0 = Modbus)
 └ identificador da transação
```

E a resposta, para registradores com valores 2, 0 e 1234:

```text
00 01   00 00   00 09   01   03   06   00 02   00 00   04 D2
                                  └ 6 bytes de dados: 2, 0, 1234 (0x04D2)
```

Um contador de 32 bits ocupa dois registradores de 16 bits, e a ordem das palavras (alta primeiro ou baixa primeiro) **varia por fabricante**. É uma armadilha clássica, e um bom exemplo da ausência de modelo de informação.

## OPC UA: arquitetura e modelo de informação

O **OPC UA** (Unified Architecture), da OPC Foundation, é uma especificação em várias partes (série OPC 10000, também publicada como IEC 62541). A parte 1 apresenta os conceitos; as partes 1 a 5 são o núcleo. Ele reúne:

- **Espaço de endereçamento e modelo de informação**: nós (variáveis, objetos, métodos) com tipos, relações e atributos, organizados em *namespaces*. Fabricantes e consórcios publicam modelos complementares (as *companion specifications*), como o de ISA-95 (OPC 10030), de que tratamos no artigo anterior.
- **Serviços**: leitura, escrita, navegação, chamada de métodos, assinaturas com notificação de mudança, acesso a histórico (parte 11).
- **Segurança**: a parte 2 descreve o modelo, com canal seguro, certificados X.509 para identificar aplicações, autenticação de usuário e política de segurança por endpoint (modos como None, Sign e SignAndEncrypt, conforme a literatura consultada).
- **Transportes**: binário sobre TCP é o mais comum em chão de fábrica; também há mapeamentos para outros transportes, e o PubSub.

Em termos de uso, o OPC UA costuma ser a ponte entre o controle (PLC, que pode expor um servidor OPC UA, quando o fabricante suporta) e os sistemas acima (SCADA, MES, historiador, gateways). **Vale destacar: o suporte a OPC UA em um PLC depende do modelo e do firmware; não é universal.**

Um exemplo de uso, em Python com a biblioteca `asyncua` (testado localmente com um servidor simulado na mesma máquina):

```python
from asyncua import Client

async with Client("opc.tcp://127.0.0.1:4840/planta") as c:
    ns = await c.get_namespace_index("urn:exemplo:planta")
    no = await c.nodes.objects.get_child([f"{ns}:ENV-01", f"{ns}:ContadorBoas"])
    print(await no.read_value())          # leitura pontual

    class H:
        def datachange_notification(self, node, val, data):
            print("mudou para", val)       # notificação por mudança

    sub = await c.create_subscription(100, H())   # intervalo de 100 ms
    await sub.subscribe_data_change(no)
```

A diferença para o Modbus: o cliente navega por nomes e namespaces (não por endereços numéricos de registrador) e **assina** mudanças em vez de fazer polling. Em produção, o exemplo precisaria de segurança configurada (certificados, modo SignAndEncrypt), tratamento de reconexão e de qualidade do valor.

## MQTT: mensageria leve com broker

O **MQTT** é um protocolo de mensageria publish-subscribe, padronizado pela OASIS (versão 5.0 aprovada em março de 2019, sucedendo a 3.1.1 de 2014). Clientes se conectam a um broker, publicam em tópicos hierárquicos (por exemplo, `planta/linha1/ENV-01/telemetria`) e assinam tópicos, inclusive com curingas. A especificação oferece três níveis de qualidade de entrega (QoS 0, 1 e 2), mensagens retidas e mensagem de último desejo (*last will*) para sinalizar desconexão inesperada.

O que o MQTT **não** define: o formato do payload nem o significado dos dados (é só bytes, em JSON, Protobuf ou outro). Para suprir isso no contexto industrial, a Eclipse Foundation mantém a especificação **Sparkplug** (versão 3.0.0, de novembro de 2022), que padroniza o espaço de tópicos, usa payloads Protobuf e define o ciclo de vida de dispositivos por mensagens de nascimento e morte (NBIRTH, NDEATH, DBIRTH, DDEATH) e relato por exceção. Sparkplug é uma camada opcional sobre o MQTT, não parte dele.

MQTT é muito usado para levar dados do chão de fábrica a plataformas centrais e à nuvem, porque o broker desacopla produtores e consumidores. É uma escolha menos natural para controle de malha rápida. Segurança em MQTT vem de TLS e da autenticação/autorização do broker; os níveis de QoS tratam de entrega, não de segurança.

## Redes de campo e Ethernet industrial

Estes protocolos ficam abaixo, entre controladores, drives, I/O remoto e instrumentos, com requisitos de tempo mais rígidos. Seguem, abaixo, descrições curtas baseadas em fontes dos mantenedores; os detalhes de desempenho e de conformidade devem ser conferidos nas especificações.

- **PROFINET** (PI): Ethernet industrial associada à organização PI, que também mantém o PROFIBUS. A página de PI lista RT, IRT e TSN como tecnologias de comunicação em tempo real e anuncia tempos de ciclo de até 31,25 µs com recursos como fast forwarding e fragmentação. É uma alegação do mantenedor; o desempenho real depende do hardware e da topologia.
- **EtherNet/IP** (ODVA): usa Ethernet e TCP/IP padrão combinados com o CIP (Common Industrial Protocol) nas camadas superiores, e suporta UDP para dados cíclicos. A ODVA realiza testes de conformidade, e a página informa que fabricantes precisam assinar um acordo de licença para acessar a tecnologia. Atenção ao nome: o "IP" aqui é de *Industrial Protocol*, não de Internet Protocol.
- **EtherCAT** (EtherCAT Technology Group): um dispositivo mestre envia um quadro que atravessa todos os dispositivos escravos; cada um lê e insere seus dados "em voo" (*processing on the fly*), e o último devolve o quadro. O modelo mantém o tempo previsível. É coberto pelas normas IEC 61158 e IEC 61784. É muito usado em controle de movimento.
- **CANopen** (CAN in Automation): camada de aplicação sobre CAN, descrita na CiA 301 (padronizada como EN 50325-4, segundo a CiA). Define um dicionário de objetos com índice de 16 bits e subíndice de 8 bits, PDOs para dados de processo e SDOs para configuração, além de gerência de rede (NMT). Comum em máquinas móveis, motion e dispositivos embarcados.
- **Comunicação serial**: RS-232/RS-485 ainda carregam Modbus RTU e protocolos proprietários em campo.

Duas observações práticas: (1) a escolha, em geral, vem do **fabricante do controlador** e do ecossistema de dispositivos, não de uma análise abstrata; (2) a distinção entre **padrão aberto** e **tecnologia controlada por consórcio** importa: o Modbus tem especificação pública; o EtherNet/IP exige licença da ODVA; o OPC UA é uma especificação da OPC Foundation, também publicada como norma IEC; o MQTT é padrão OASIS e o Sparkplug, Eclipse.

## Latência, determinismo e confiabilidade

"Tempo real" significa coisas muito diferentes:

- **Controle de movimento e malhas rápidas** (ciclos de microssegundos a poucos milissegundos): domínio de EtherCAT, PROFINET IRT e redes equivalentes, com comunicação cíclica determinística. Falhar o prazo aqui é falha de controle.
- **Troca entre controlador e supervisão** (dezenas a centenas de ms): OPC UA, Modbus TCP, EtherNet/IP implícito. Atraso ocasional é tolerável.
- **Telemetria e integração com MES/nuvem** (segundos): MQTT, OPC UA PubSub, APIs. É monitoramento, não controle.

Um protocolo sobre TCP/IP padrão não é determinístico por si só: o tempo de entrega depende da rede, de filas e da carga. Isso não é defeito, é diferença de propósito. **Um erro de projeto frequente é usar uma camada pensada para telemetria em uma função que exige determinismo.**

## Interoperabilidade e proprietário versus aberto

A interoperabilidade entre fabricantes é maior no nível de informação (OPC UA com modelos complementares, Sparkplug sobre MQTT) do que nas redes de campo, onde o ecossistema de cada fabricante pesa mais. Mesmo com OPC UA, é comum que o modelo exposto pelo PLC seja específico do fabricante e precise de mapeamento. Padrão aberto reduz o *lock-in*, mas não elimina o trabalho de engenharia de integração.

## Exemplo: PLC, gateway, backend e MES

Um cenário **hipotético**, executado localmente com componentes simulados: um PLC (simulado por um servidor Modbus TCP) expõe estado e contador da máquina ENV-01; um gateway lê esses registradores, normaliza e publica via MQTT; um backend assina o tópico e entregaria o evento ao MES.

```text
PLC (Modbus TCP)  ──poll──►  Gateway  ──MQTT──►  Broker  ──►  Backend  ──►  MES
 holding regs 0..2           normaliza             │           (valida,
 [estado, cont_hi, cont_lo]  e publica             │            deduplica,
                                                   │            grava)
                              plant/line1/ENV-01/telemetry
```

O gateway, em Python com `pymodbus` e `paho-mqtt` (testado com um servidor Modbus simulado e um broker MQTT local):

```python
plc = AsyncModbusTcpClient("127.0.0.1", port=5020)
await plc.connect()
rr = await plc.read_holding_registers(0, count=3, device_id=1)
estado, hi, lo = rr.registers
contador = (hi << 16) | lo          # 32 bits em dois registradores

msg = {"machine": "ENV-01", "ts": int(time.time() * 1000),
       "state": {0: "STOPPED", 1: "IDLE", 2: "RUNNING"}.get(estado, "UNKNOWN"),
       "count": contador, "quality": "GOOD"}
client.publish("plant/line1/ENV-01/telemetry", json.dumps(msg), qos=1)
```

A mensagem recebida pelo backend, no teste:

```json
{"machine": "ENV-01", "ts": 1793470222958, "state": "RUNNING", "count": 1234, "quality": "GOOD"}
```

As decisões de engenharia mais importantes ficam fora do trecho de código:

- **Mapa de registradores e ordem de palavras** documentados e versionados: o gateway é o lugar onde o dado sem semântica ganha semântica.
- **Timestamp na origem** (ou o mais perto possível dela), para que atrasos de rede não distorçam séries e indicadores.
- **Idempotência e deduplicação** no backend: QoS 1 pode entregar a mesma mensagem mais de uma vez, então o consumidor precisa tolerar duplicatas, por exemplo com uma chave natural (máquina e timestamp), como no esquema do [artigo 03](/pt/blog/o-que-e-mes-manufacturing-execution-system).
- **Armazenamento local no gateway** (store-and-forward) para sobreviver a quedas de rede sem perder eventos.
- **Qualidade do dado**: o campo `quality` existe porque "leitura falhou" e "valor zero" são coisas diferentes.
- **Contagem por diferença.** Um contador cumulativo deve ser tratado com cuidado: o backend precisa lidar com reinício do contador e com perda de mensagens, calculando produção por diferenças e não presumindo continuidade.

## Segurança e autenticação

Em resumo, sem aprofundar (o artigo 10 trata do tema): Modbus básico não oferece autenticação nem criptografia, então depende de segmentação de rede; OPC UA inclui no modelo de segurança certificados, canal seguro e autenticação de usuário, que precisam ser **configurados** (um servidor com segurança "None" é permitido pelo protocolo e comum em testes); MQTT depende de TLS e de controle de acesso no broker; EtherNet/IP tem o CIP Security, conforme a ODVA, que pode ajudar a alinhar com a IEC 62443. Ter o recurso na especificação não significa que ele esteja ativo na instalação.

## Relação com engenharia de software

Na minha leitura, o ponto central é separar o **domínio** do **protocolo**. O código que entende ordens, lotes e eventos de produção não deve conhecer registradores Modbus nem nós OPC UA; um adaptador na borda traduz. Isso permite trocar o protocolo, simular equipamentos nos testes e tratar falhas de comunicação de forma uniforme. Também recomendo tratar a fronteira como não confiável: toda leitura de equipamento pode falhar, vir atrasada, duplicada ou fora de escala. O [artigo 07](/pt/blog/engenharia-de-software-para-manufatura) aprofunda a arquitetura desses adaptadores.

## Conclusão

Modbus, OPC UA, MQTT e as redes de campo resolvem problemas diferentes: transporte simples de registradores, integração semântica entre sistemas, mensageria desacoplada e controle determinístico entre dispositivos. A pergunta útil não é "qual é o melhor protocolo", e sim "qual requisito de tempo, de semântica, de segurança e de ecossistema esta fronteira tem". Responder a isso por camada, e documentar o contrato de cada uma, costuma evitar a maior parte dos retrabalhos de integração.

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura. Os exemplos de código foram executados localmente com componentes simulados (servidores e broker de teste), não com equipamentos reais.

- OPC Foundation. [OPC 10000-1, Overview and Concepts](https://reference.opcfoundation.org/specs/OPC-10000-1/full); [OPC 10000-2, Security](https://reference.opcfoundation.org/v105/Core/docs/Part2/); [OPC 10000-14, PubSub](https://reference.opcfoundation.org/specs/OPC-10000-14/full); [OPC 10030, ISA-95](https://reference.opcfoundation.org/specs/OPC-10030/4.2.3).
- OASIS. [MQTT Version 5.0](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html), OASIS Standard, 2019.
- Eclipse Foundation. [Sparkplug Specification](https://www.eclipse.org/tahu/spec/sparkplug_spec.pdf). Os detalhes citados vieram de resumos secundários; conferir a versão 3.0.0 no texto oficial.
- Modbus Organization. Modbus Application Protocol Specification V1.1b3, em modbus.org. O exemplo de quadro segue a estrutura MBAP + PDU da especificação; não consegui abrir o PDF oficial nesta pesquisa, então confira os códigos de função no documento.
- EtherCAT Technology Group. [Technology](https://www.ethercat.org/en/technology.html).
- ODVA. [EtherNet/IP](https://www.odva.org/technology-standards/key-technologies/ethernet-ip/).
- PI (PROFIBUS & PROFINET International). [PROFINET](https://www.profibus.com/technologies/profinet).
- CAN in Automation. [CANopen profiles](https://www.can-cia.org/can-knowledge/canopen-profiles) e [PDO protocol](https://www.can-cia.org/can-knowledge/pdo-protocol); CiA 301.
- NIST. [SP 800-82 Rev. 3](https://csrc.nist.gov/pubs/sp/800/82/r3/final), para o contexto de segurança em OT.
