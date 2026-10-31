---
title: "Cibersegurança industrial: proteger PLC, SCADA e MES"
description: "Segurança em OT: diferenças para TI, zonas e conduítes, ISA/IEC 62443, segmentação, acesso remoto, legados, patches, backup e resposta a incidentes."
pubDate: 2026-10-31T13:30:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/ciberseguranca-industrial-plc-scada-mes.webp"
coverAlt: "Ilustração de zonas aninhadas, Corporativa, DMZ, Operações e Controle, separadas por firewalls"
category: "Segurança"
tags:
  - "Cibersegurança Industrial"
  - "ISA/IEC 62443"
  - "OT Security"
  - "SCADA"
  - "Segmentação de Rede"
  - "Série Automação Industrial"
draft: false
lang: "pt-BR"
---

Os artigos anteriores descreveram uma fábrica cada vez mais conectada: controladores que expõem dados por OPC UA, gateways que publicam em brokers, plataformas na nuvem que recebem telemetria. Cada conexão nova resolve um problema de visibilidade e cria uma superfície de ataque. Este último artigo da série trata de como lidar com isso sem comprometer o que importa mais: a continuidade e a segurança física do processo.

Um aviso de escopo: este é um estudo conceitual, não um guia de implementação de segurança de uma planta específica. Decisões reais exigem avaliação de risco feita por especialistas com conhecimento do processo.

## Segurança de TI e segurança de OT

O **NIST SP 800-82 Rev. 3** (setembro de 2023) é o guia de segurança de tecnologia operacional (OT) do NIST. Seu resumo oficial descreve como proteger OT "respeitando seus requisitos específicos de desempenho, confiabilidade e segurança", e define OT como sistemas e dispositivos programáveis que interagem com o ambiente físico, como sistemas de controle industrial, automação predial e sistemas de transporte.

Essa frase resume a diferença central. Alguns contrastes práticos (síntese minha, a partir da literatura geral sobre o tema):

| Aspecto | TI corporativa | OT industrial |
|---|---|---|
| Prioridade típica | confidencialidade, integridade, disponibilidade | segurança operacional e disponibilidade em primeiro lugar |
| Reinício / aplicação de patch | rotineiro, em janelas curtas | exige parada planejada; pode ser possível só em paradas anuais |
| Ciclo de vida | anos | frequentemente décadas |
| Latência e tempo | tolerante | processos podem depender de temporização precisa |
| Ferramentas ativas (scanners) | de uso comum | podem derrubar equipamentos frágeis |
| Consequência de falha | perda de dados, de receita | parada, dano físico, risco a pessoas e ao ambiente |
| Dispositivos | atualizáveis, com agentes | controladores e instrumentos sem espaço para agentes |

Consequência: **receitas de TI aplicadas sem adaptação podem causar o problema que pretendiam evitar.** Um varredor de vulnerabilidades agressivo ou um patch aplicado fora de hora pode parar uma linha.

## Como um incidente afeta a continuidade

Não é necessário que o malware chegue ao PLC para parar uma fábrica. Dois casos documentados por fontes oficiais ilustram caminhos diferentes:

- **Colonial Pipeline (maio de 2021).** O alerta AA21-131A da CISA descreve um ataque de ransomware (DarkSide) contra a rede de TI de uma empresa de oleodutos, sem indicação, à época, de efeito direto nas redes de OT, e registra que a empresa **desconectou proativamente certos sistemas de OT** para garantir a segurança. Relatórios do Congresso dos EUA descrevem que isso resultou em uma parada temporária de todas as operações do oleoduto, e que o serviço foi restabelecido em etapas. A lição de engenharia: quando as fronteiras entre TI e OT são pouco claras, um incidente de TI pode se tornar uma parada operacional por decisão de precaução.
- **Ataque à rede elétrica da Ucrânia (dezembro de 2015).** O alerta IR-ALERT-H-16-056-01 do ICS-CERT/CISA (fevereiro de 2016) trata das interrupções de 23 de dezembro de 2015 em empresas de distribuição ucranianas. Aqui o ataque alcançou sistemas de supervisão e controle. Relatos sobre o número de pessoas afetadas divergem entre fontes, e a atribuição de autoria não consta do alerta americano; por isso não afirmo nenhum dos dois.

Em ambos, o que sustenta a recuperação é o mesmo conjunto de capacidades: saber o que existe, ter backups testados, conseguir operar em modo manual e ter um plano de resposta ensaiado.

## ISA/IEC 62443

A série **ISA/IEC 62443** é o conjunto de normas de referência para segurança de sistemas de automação e controle industrial (IACS). Segundo a ISA, o ISA99 a desenvolveu em cooperação com o grupo de trabalho 10 do comitê técnico 65 da IEC; as edições da ISA (ISA-62443-x-y) e da IEC (IEC 62443-x-y) têm conteúdo idêntico, e o princípio fundador é a **responsabilidade compartilhada** entre proprietários de ativos, fornecedores de produtos, integradores e prestadores de serviço.

A organização por partes (conforme a lista da ISA):

- **Parte 1 (geral):** 1-1, terminologia, conceitos e modelos.
- **Parte 2 (políticas e procedimentos):** 2-1, programa de segurança do proprietário do ativo; 2-3, gestão de patches (relatório técnico); 2-4, requisitos de programa de segurança para prestadores de serviço.
- **Parte 3 (sistema):** 3-2, avaliação de risco de segurança para o projeto do sistema; 3-3, requisitos de segurança do sistema e níveis de segurança.
- **Parte 4 (componente):** 4-1, ciclo de vida de desenvolvimento seguro de produtos; 4-2, requisitos técnicos de segurança para componentes.

### Zonas, conduítes e níveis de segurança

Dois conceitos centrais, descritos aqui a partir de fontes secundárias (a página da ISA consultada não os define), então confira nos textos da norma:

- Uma **zona** é um agrupamento lógico ou físico de ativos que compartilham os mesmos requisitos de segurança.
- Um **conduíte** é o canal de comunicação entre zonas, que deve oferecer proteções compatíveis com os níveis de segurança das zonas que conecta.
- Os **níveis de segurança** (SL 1 a SL 4) expressam a robustez pretendida contra ameaças de capacidade crescente, e são determinados por avaliação de risco. Os sete requisitos fundamentais da série são: identificação e autenticação, controle de uso, integridade do sistema, confidencialidade de dados, fluxo restrito de dados, resposta oportuna a eventos e disponibilidade de recursos.

O modelo de zonas e conduítes é útil também como ferramenta de engenharia de software. O trecho abaixo (Python, executado localmente) representa uma política de conduítes como lista de fluxos permitidos (*default deny*) e verifica fluxos observados contra ela. É uma ilustração do raciocínio, não uma ferramenta de monitoramento:

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Flow:
    src: str; dst: str; proto: str; port: int    # src inicia a conexão para dst

ALLOWED = {                                       # só o que está listado passa
    Flow("SUPERVISAO", "CONTROLE", "opcua", 4840),
    Flow("OPERACOES", "DMZ", "mqtt-tls", 8883),
    Flow("DMZ", "OPERACOES", "https", 443),
    Flow("DMZ", "CORPORATIVA", "https", 443),
}

observados = [
    Flow("SUPERVISAO", "CONTROLE", "opcua", 4840),
    Flow("OPERACOES", "DMZ", "mqtt-tls", 8883),
    Flow("CORPORATIVA", "CONTROLE", "rdp", 3389),
    Flow("CORPORATIVA", "OPERACOES", "smb", 445),
]
for f in observados:
    print("OK       " if f in ALLOWED else "VIOLAÇÃO ", f)
```

Na execução, os dois primeiros fluxos passam e os dois últimos, um acesso RDP direto da rede corporativa ao nível de controle e um compartilhamento SMB entre TI e a camada de operações, são sinalizados. O valor do exercício está em **explicitar a política**: se ninguém consegue listar quais fluxos deveriam existir, não há como saber quais são anomalias.

## Defesa em profundidade para OT

Defesa em profundidade significa não depender de uma única barreira. Um desenho conceitual, **ilustrativo**:

<figure>
  <img src="/images/blog/ciberseguranca-industrial-plc-scada-mes-diagrama.webp" alt="Diagrama com cinco zonas empilhadas, Corporativa, DMZ industrial, Operações, Supervisão e Controle, separadas por firewalls, e ao lado os sistemas de segurança independentes e quatro cuidados para não parar a planta." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Defesa em profundidade com zonas e conduítes. Desenho conceitual do autor.</figcaption>
</figure>

Camadas e cuidados, com ênfase em **não comprometer disponibilidade e segurança física**:

**Segmentação e firewalls.** Separar TI de OT e, dentro de OT, as zonas por função. O alerta da CISA sobre o ransomware de 2021 recomenda segmentação robusta entre TI e OT, com uma zona desmilitarizada que bloqueie tráfego não regulado entre elas. Cuidado operacional: regras de firewall mal planejadas podem interromper comunicações cíclicas. Valide em ambiente de teste ou em janela de manutenção, com plano de reversão.

**Controle de acesso e identidades.** Princípio do menor privilégio, contas individuais (não genéricas) quando o sistema permite, separação entre perfis de operação e de engenharia, remoção de contas dormentes e registro de acessos. Muitos sistemas legados têm usuários compartilhados e senhas fixas; nesses casos, compense com controles de rede e de acesso físico. Esta é uma boa prática geral (opinião), não texto de norma específica.

**Autenticação.** A CISA recomenda autenticação multifator para acesso remoto a redes de OT e de TI. Para operadores em chão de fábrica, métodos que exigem celular ou digitação longa podem ser impraticáveis em postos compartilhados; é um caso em que o desenho precisa considerar o contexto (cartões, tokens físicos, controle por estação).

**Acesso remoto e VPN.** Acesso de fornecedores e de equipes remotas é um vetor frequente de risco. Boas práticas coerentes com as orientações oficiais: passar por um servidor de saltos na DMZ, com MFA, sessão registrada, janela de tempo e restrição a ativos específicos; evitar a exposição direta de RDP, como a CISA recomenda (limitar endereços de origem e exigir MFA quando inevitável). Em janeiro de 2026, agências de oito países, incluindo CISA, FBI, o NCSC do Reino Unido, o BSI alemão e o Canadian Cyber Centre, publicaram princípios de conectividade segura para OT; ainda não li os oito princípios no texto original, e por isso remeto à fonte em vez de resumi-los. Uma VPN protege o canal, mas não substitui segmentação nem controle do que o usuário pode alcançar depois de entrar.

**Monitoramento de rede.** Observação passiva do tráfego (espelhamento de porta, sensores específicos de OT) para inventariar ativos, descobrir novos dispositivos e detectar fluxos fora da política. A preferência por monitoramento **passivo** em redes de controle evita interferir no processo. Alarme acionável e processo de triagem são mais importantes que a ferramenta.

**Proteção de PLCs e SCADA.** Reduzir a exposição: sem acesso à internet, senhas de equipamentos alteradas, serviços desnecessários desativados, chaves de modo de operação do CLP (quando houver) em posição adequada, acesso físico controlado e monitoramento de alterações de programa. Em SCADA/HMI, endurecimento de sistema operacional, lista de aplicativos permitidos e restrição de mídias removíveis. As opções reais dependem do que o fabricante suporta.

**Vulnerabilidades e legados.** Equipamentos antigos muitas vezes não podem ser atualizados, ou o fabricante já não dá suporte. A resposta é **controle compensatório**: isolá-los em zona própria, restringir quem pode falar com eles e monitorá-los. A série 62443 trata do ciclo de vida do produto (4-1) e dos requisitos de componentes (4-2), e, para quem escolhe produtos novos, esses itens são critérios de aquisição.

**Atualizações e patches.** A ISA lista a 62443-2-3 como relatório técnico sobre gestão de patches. O ponto central é um processo: inventário do que existe, acompanhamento de avisos do fabricante, avaliação de risco do patch (inclusive o risco de aplicá-lo), teste em ambiente equivalente, aplicação em janela de parada e plano de retorno. Nem todo patch deve ser aplicado imediatamente em OT; a decisão consciente de adiar, com controles compensatórios, é legítima.

**Backup e recuperação.** O alerta AA21-131A recomenda backups regulares, **testados e mantidos offline**, isolados das redes. Em OT, o backup inclui também programas de CLP, configurações de SCADA e HMI, receitas, bancos do MES e imagens de máquinas de engenharia. Um backup que nunca foi restaurado em teste é uma hipótese, não um backup. A CISA também recomenda **testar regularmente os controles manuais**, para que funções críticas continuem se as redes de OT forem desligadas.

**Resposta a incidentes.** Um plano específico para OT define: quem decide isolar a planta (o caso Colonial mostra que a decisão de desligar pode ser tomada por precaução), quem fala com operação, segurança do trabalho e fornecedores, como operar em modo manual, como preservar evidências sem atrasar a restauração e quando acionar autoridades. Ensaios (exercícios de mesa e simulações) revelam lacunas antes que o incidente real o faça.

## Relação com outras referências

- **ISA/IEC 62443:** a referência de requisitos e de processo para IACS, organizada por papéis (proprietário do ativo, integrador, fabricante) e níveis.
- **NIST SP 800-82 Rev. 3:** guia para proteger OT com topologias típicas, ameaças, vulnerabilidades e contramedidas. Fontes secundárias dizem que ele inclui uma sobreposição (*overlay*) de OT para o catálogo de controles NIST SP 800-53; confirme no documento.
- **Orientações de agências governamentais** (CISA e parceiros): recomendações práticas e atuais, como as sobre RDP, MFA, backups e conectividade segura.

Eles não competem: a 62443 e o NIST dão estrutura de programa e de requisitos, e as orientações das agências trazem prioridades táticas. Normas internacionais de gestão de segurança da informação para TI geral também existem, mas não as li para este estudo, então não faço comparação.

## Relação com engenharia de software

Para quem desenvolve software industrial, a segurança é um requisito de arquitetura: autenticação e autorização no MES por usuário e papel; comunicação com equipamentos configurada com os recursos de segurança do protocolo (por exemplo, OPC UA com certificados e modo SignAndEncrypt, em vez de segurança desativada); segredos fora do código; registros de auditoria; dependências atualizadas; gateways de borda tratados como ativos a serem atualizados; e um processo de desenvolvimento seguro, para o qual a IEC 62443-4-1 serve de referência. E, a regra que mais se perde na pressa: **toda nova integração é uma nova conduta entre zonas**, e deve ser decidida e documentada como tal.

## Conclusão

A cibersegurança industrial é, antes de tudo, uma disciplina de **projeto e de operação**: conhecer os ativos, separar zonas, controlar os conduítes, tratar o acesso remoto como risco principal, compensar o que não pode ser atualizado e, sobretudo, ensaiar a recuperação e a operação manual. Quem aplica essas medidas sem entender o processo pode derrubar a produção; quem ignora a segurança, abre a porta para que o incidente de TI vire parada de planta. O equilíbrio vem de trabalhar com a engenharia de automação, não por cima dela.

Com este artigo fecha-se a série. A [visão geral da arquitetura](/pt/blog/arquitetura-de-software-fabrica-moderna) é o ponto de partida para quem quiser percorrê-la em ordem.

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura. Não é um guia de implementação; decisões reais exigem avaliação de risco da planta específica. O código foi executado localmente.

- NIST. [SP 800-82 Rev. 3, Guide to Operational Technology (OT) Security](https://csrc.nist.gov/pubs/sp/800/82/r3/final), setembro de 2023.
- ISA. [ISA/IEC 62443 Series of Standards](https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards). Os conceitos de zonas, conduítes e níveis de segurança aqui descritos vêm de fontes secundárias, não de textos da norma.
- IEC. [IEC 62443-4-1:2018](https://webstore.iec.ch/en/publication/33615) (catálogo).
- CISA. [AA21-131A, DarkSide Ransomware: Best Practices for Preventing Business Disruption from Ransomware Attacks](https://www.cisa.gov/news-events/cybersecurity-advisories/aa21-131a).
- Congressional Research Service. [Colonial Pipeline: The DarkSide Strikes](https://www.congress.gov/crs_external_products/IN/PDF/IN11667/IN11667.2.pdf).
- CISA/ICS-CERT. [IR-ALERT-H-16-056-01, Cyber-Attack Against Ukrainian Critical Infrastructure](https://cisa.gov/news-events/ics-alerts/ir-alert-h-16-056-01). Texto completo não verificado nesta pesquisa.
- Canadian Centre for Cyber Security e parceiros (CISA, FBI, NCSC-UK, ASD ACSC, BSI, NCSC-NL, NCSC-NZ). [Joint guidance on secure connectivity principles for operational technology](https://cyber.gc.ca/en/news-events/joint-guidance-secure-connectivity-principles-operational-technology), atualizada em janeiro de 2026.
- OPC Foundation. [OPC 10000-2, Security](https://reference.opcfoundation.org/v105/Core/docs/Part2/).
