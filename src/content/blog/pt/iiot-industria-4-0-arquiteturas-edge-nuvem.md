---
title: "IIoT e Indústria 4.0: arquiteturas com borda e nuvem"
description: "O que diferencia IIoT de IoT, como projetar coleta, borda e nuvem, o papel de MQTT e OPC UA, digital twins e manutenção preditiva, com limites e custos."
pubDate: 2026-10-31T13:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/iiot-industria-4-0-arquiteturas-edge-nuvem.webp"
coverAlt: "Ilustração de uma planta com PLC e uma borda destacada, ligada por seta a uma nuvem"
category: "Automação Industrial"
tags:
  - "IIoT"
  - "Indústria 4.0"
  - "Edge Computing"
  - "MQTT"
  - "Digital Twin"
  - "Série Automação Industrial"
draft: false
lang: "pt-BR"
---

"Indústria 4.0" é um termo que carrega mais marketing do que precisão. Por trás dele há, porém, uma mudança técnica concreta: máquinas e sistemas de chão de fábrica que antes ficavam isolados passam a expor dados de forma padronizada, e esses dados são processados na borda e na nuvem. O trabalho de engenharia está em fazer isso sem comprometer a operação.

Este é o nono artigo da série. O objetivo aqui é separar o que é arquitetura do que é promessa.

## IIoT e IoT convencional não são a mesma coisa

A **IIoT** (Internet Industrial das Coisas) aplica conceitos de IoT a ambientes industriais, mas os requisitos mudam o desenho:

| Aspecto | IoT convencional (consumo, cidades, edifícios) | IIoT |
|---|---|---|
| Consequência de falha | incômodo, perda de serviço | parada de produção, dano a equipamento ou a pessoas |
| Ciclo de vida do ativo | anos | muitas vezes décadas |
| Dispositivos | sensores e módulos novos, homogêneos | equipamentos legados, heterogêneos, protocolos industriais |
| Disponibilidade | tolera indisponibilidade | operação contínua; modo degradado definido |
| Segurança | foco em privacidade e acesso | segurança operacional e proteção do processo |
| Conectividade | internet direta é comum | redes segmentadas, acesso à internet restrito |
| Integração | aplicativos e nuvem | OT (controle) com IT (negócio) |

Essa tabela é uma generalização minha (opinião), não uma classificação normativa. O ponto prático: **a IIoT não substitui o controle industrial**; ela se constrói *ao lado* dele, lendo dados e, em alguns casos, enviando parâmetros, sem assumir a responsabilidade pela segurança do processo.

## Componentes de uma arquitetura IIoT

**Sensores inteligentes e equipamentos conectados.** Dispositivos que, além de medir, oferecem diagnóstico e comunicação digital. Em muitas plantas, a maior parte dos dados úteis já existe nos controladores (PLC, drives, instrumentos) e basta acessá-los; sensores adicionais são justificados caso a caso.

**Gateways industriais.** Equipamentos na fronteira entre as redes de controle e as redes superiores. Traduzem protocolos (Modbus, PROFINET, EtherNet/IP, OPC UA), normalizam e publicam dados. Um exemplo de implementação comercial: o conector OPC UA do Azure IoT Operations, da Microsoft, gerencia sessões com servidores OPC UA e publica os dados em tópicos de um broker MQTT que roda na borda; no ecossistema da AWS, o coletor OPC UA do IoT SiteWise para Greengrass cumpre papel análogo. São produtos específicos de fornecedores e servem como ilustração, não como recomendação.

**Edge computing.** Processamento próximo da fonte: filtragem, agregação, regras de alarme, buffer local, inferência de modelos. Reduz volume trafegado, latência de decisões locais e dependência da conexão externa.

**Nuvem.** Armazenamento de longo prazo, análises entre plantas, treinamento de modelos, painéis corporativos, integração com sistemas de negócio. Escala bem, mas depende de conectividade e acrescenta custo recorrente.

**Telemetria e mensageria.** O padrão dominante é publish-subscribe sobre MQTT (artigo 06), muitas vezes com o Sparkplug para padronizar tópicos e estados, ou OPC UA PubSub. A documentação do Azure IoT Operations descreve uma topologia em camadas, com um broker por nível da rede, em que os dados terminam no broker local de cada camada em vez de serem tunelados.

## Um exemplo de processamento na borda

O princípio da borda é reduzir antes de enviar. O trecho abaixo, **executado localmente com dados sintéticos** (10 minutos de temperatura a 1 Hz com ruído e uma elevação no último minuto), mostra duas técnicas comuns: banda morta (relato por exceção) e agregação por janela.

```python
import statistics

def deadband(samples, band):
    """Só emite quando o valor sai da banda em relação ao último enviado."""
    last, out = None, []
    for ts, v in samples:
        if last is None or abs(v - last) >= band:
            out.append((ts, v)); last = v
    return out

def aggregate(samples, window_s=60):
    wins = {}
    for ts, v in samples:
        wins.setdefault(ts // window_s * window_s, []).append(v)
    return [{"window_start": w, "n": len(vs), "min": min(vs), "max": max(vs),
             "avg": round(statistics.fmean(vs), 2)} for w, vs in sorted(wins.items())]
```

Na execução, as 600 amostras brutas viraram 45 após a banda morta de 0,5 e 10 agregados de 1 minuto; a janela que começa em 540 s foi a única com máximo acima de 185. Os números dependem da semente e do ruído sintético, e **não representam economia real de uma instalação**. A lição é estrutural: decisões como a largura da banda e o tamanho da janela são escolhas de engenharia que trocam resolução por volume, e devem ser feitas sabendo o que as análises posteriores precisam. Um alarme local pode usar a amostra bruta; uma análise de tendência, o agregado; uma investigação de falha pode exigir o dado completo guardado por algum tempo na borda.

## Projetando a solução: coletar, processar localmente, publicar indicadores

Um roteiro de decisões, na ordem em que costumam aparecer:

1. **Qual pergunta de negócio?** "Quanto tempo as máquinas ficam paradas e por quê?" é diferente de "qual a vibração do rolamento?". A pergunta define quais dados, com qual frequência e com qual contexto.
2. **Quais dados já existem?** Contadores, estados e alarmes costumam estar no PLC. Verifique protocolos e mapas de memória antes de comprar sensores.
3. **Contexto antes de volume.** Dado sem identificação de máquina, ordem e lote tem pouco valor. Ligue os eventos ao MES (artigos 03 e 05).
4. **O que roda na borda?** Normalização, timestamp na origem, buffer local, regras de alarme, agregação.
5. **O que sobe e como?** Mensageria com confirmação, idempotência e esquema versionado.
6. **Onde ficam os indicadores?** Plataforma central (nuvem ou data center) com séries temporais e agregados, como no [artigo 08](/pt/blog/bancos-de-dados-industriais-eventos-de-producao).
7. **Quem consome?** Operação precisa de painéis em segundos; gestão, de tendências; engenharia, de histórico completo.

### Arquitetura realista (ilustrativa)

<figure>
  <img src="/images/blog/iiot-industria-4-0-arquiteturas-edge-nuvem-diagrama.webp" alt="Diagrama com a planta (PLCs, MES local e gateway de borda) ligada por MQTT sobre TLS, com conexão apenas de saída, a uma plataforma central com ingestão, armazenamento, painéis e integração." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Arquitetura IIoT ilustrativa com borda e plataforma central. Diagrama do autor.</figcaption>
</figure>

Três escolhas deste desenho merecem destaque:

- **Conexão de saída apenas.** A planta inicia a conexão para a plataforma; a plataforma não abre conexões para dentro das redes de controle. É um padrão defensivo comum (artigo 10).
- **MES local.** A execução da produção não depende da nuvem.
- **Dados em duas velocidades.** Alarmes e controle local ficam na borda; analytics e comparação entre plantas, na nuvem.

## Digital twins

Um **digital twin** é uma representação digital de um ativo ou processo físico, mantida atualizada a partir de dados reais e usada para análise, simulação ou monitoramento. A série **ISO 23247** define um *framework* de digital twin para manufatura; segundo os catálogos consultados, a parte 1 (2021) trata de visão geral, princípios, termos e requisitos, e a série é aplicável a processos discretos, em batelada e contínuos. A **RAMI 4.0** (DIN SPEC 91345, 2016) é um modelo de referência alemão em três dimensões que representa ativos (físicos ou não) ao longo do ciclo de valor, e é frequentemente associada à ideia de ativos digitais.

Na prática, "digital twin" cobre um espectro muito amplo, de um painel que espelha o estado de uma máquina até um modelo físico de simulação calibrado com dados. Ao ver o termo em uma proposta, a pergunta útil é: *que decisão este modelo permite tomar que antes não era possível, e com que fidelidade?*

## Manutenção preditiva e analytics

A manutenção preditiva busca antecipar falhas a partir de dados de condição (vibração, temperatura, corrente, ciclos). A norma ISO 13381-1 (terceira edição, 2025) fornece orientações e requisitos para desenvolver e aplicar processos de **prognóstico**, e destaca, entre seus temas, os dados necessários e os modelos de falha e deterioração. Duas observações realistas, que são leitura minha e não conteúdo da norma:

- **Dados de falha são escassos.** Modelos de prognóstico precisam de exemplos de degradação ou falha, e equipamentos bem mantidos falham pouco. Sem histórico rotulado, o caminho costuma ser detecção de anomalias (comparar com o comportamento normal), que é menos ambiciosa que prever a vida útil restante.
- **O alerta precisa virar ação.** Um modelo que avisa sem integração com a ordem de manutenção e com a programação da produção tende a ser ignorado.

Sobre **inteligência artificial** na manufatura: aplicações como visão computacional para inspeção, detecção de anomalias e otimização de parâmetros existem, mas dependem de qualidade de dados, validação com especialistas de processo e monitoramento de desvio do modelo. Não vou citar ganhos percentuais porque não os verifiquei em fontes primárias; desconfie de números sem contexto de medição.

## Vantagens, limitações, custos

**Vantagens plausíveis:** visibilidade de paradas e de produtividade, rastreabilidade, comparação entre linhas e plantas, redução de coleta manual, base para análises avançadas.

**Limitações e custos a considerar:**

- **Qualidade e contexto dos dados.** Integrar equipamentos legados costuma ser a maior parte do esforço.
- **Latência e disponibilidade.** Decisões que exigem resposta rápida ficam na borda ou no controlador; a nuvem serve para análise e não para controle.
- **Custo recorrente.** Armazenamento, transferência e processamento em nuvem somam-se ao longo do tempo; modele o volume antes de assumir o custo. As planilhas de preço mudam, então não as reproduzo aqui.
- **Segurança.** Cada nova conexão aumenta a superfície de ataque. Conexão de saída apenas, segmentação, autenticação forte e atualização de gateways são requisitos, não opcionais (artigo 10).
- **Pessoas e processo.** Indicadores só mudam a operação quando alguém é responsável por agir sobre eles.
- **Dependência de fornecedor.** Plataformas de nuvem industriais facilitam o início, mas acoplam formatos e APIs. Padrões abertos (OPC UA, MQTT/Sparkplug) reduzem o risco, sem eliminá-lo.

## Arquiteturas híbridas

Quase todas as soluções sérias são híbridas: controle e execução local; agregação em um nível intermediário (planta ou site); análises e treinamento centralizados. A alternativa "tudo na nuvem" é rara em operação crítica, e "tudo local" limita a análise entre plantas. A fronteira é decisão de projeto, orientada por latência, custo, regulamentação (localização de dados) e disponibilidade.

## Relação com engenharia de software

Na minha leitura, projetos de IIoT falham menos por tecnologia e mais por três descuidos: dados sem contexto, ausência de dono para os indicadores e subestimação da integração com sistemas existentes. Do lado de software, as práticas dos artigos anteriores se aplicam diretamente: idempotência, buffer na borda, timestamp de origem, esquemas versionados, observabilidade da própria pipeline de dados e testes com simuladores.

## Conclusão

IIoT e Indústria 4.0 descrevem, no melhor sentido, a conexão estruturada entre chão de fábrica, aplicações e nuvem. A arquitetura sensata mantém o controle onde ele está, processa na borda o que precisa de rapidez e resiliência, envia à nuvem o que ganha com escala, e trata a segurança como requisito de projeto. Os resultados dependem menos do rótulo da tecnologia que de perguntas de negócio claras e de dados bem contextualizados.

O último artigo da série trata do que torna tudo isso arriscado se for feito sem cuidado: a [cibersegurança industrial](/pt/blog/ciberseguranca-industrial-plc-scada-mes).

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura. O código foi executado localmente com dados sintéticos; a arquitetura é ilustrativa.

- Microsoft. [What is Azure IoT Operations?](https://learn.microsoft.com/en-us/azure/iot-operations/overview-iot-operations), [Data flows](https://learn.microsoft.com/en-us/azure/iot-operations/connect-to-cloud/overview-dataflow) e [Layered network](https://learn.microsoft.com/en-in/Azure/iot-operations/manage-layered-network/concept-layered-network). Exemplo de fornecedor.
- AWS. [IoT SiteWise OPC UA collector, AWS IoT Greengrass](https://docs.aws.amazon.com/greengrass/v2/developerguide/iotsitewise-opcua-collector-component.html). Exemplo de fornecedor.
- ISO. [ISO 23247-1:2021, Digital twin framework for manufacturing](https://scc-ccn.ca/standardsdb/standards/8177207) (página de catálogo; texto da norma não consultado).
- DIN. [DIN SPEC 91345:2016-04, RAMI 4.0](https://www.din.de/en/wdc-beuth:din21:250940128) (catálogo).
- ISO. [ISO 13381-1:2025, Prognostics, General guidelines and requirements](https://www.iso.org/standard/88029.html) (catálogo; cláusulas não consultadas).
- OASIS. [MQTT Version 5.0](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html); Eclipse Foundation. [Sparkplug](https://www.eclipse.org/tahu/spec/sparkplug_spec.pdf).
- OPC Foundation. [OPC 10000-1](https://reference.opcfoundation.org/specs/OPC-10000-1/full) e [OPC 10000-14 (PubSub)](https://reference.opcfoundation.org/specs/OPC-10000-14/full).
