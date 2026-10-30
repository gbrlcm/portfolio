---
title: "Onde os sistemas fraudulentos são hospedados — e por que derrubar um domínio não resolve tudo"
description: "Domínio, IP, provedor e autor são coisas diferentes. O que incidentes reais, o CERT.br e a Europol mostram sobre a infraestrutura das fraudes e sobre investigá-la."
pubDate: 2026-10-30T11:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/onde-sistemas-fraudulentos-sao-hospedados.webp"
coverAlt: "Ilustração de uma pilha de camadas de internet com domínio, DNS, endereço IP e provedor, terminando em uma caixa amarela com um ponto de interrogação no lugar do autor, com o rótulo Série Mercado Clandestino 03"
category: "Segurança"
tags:
  - "Série Mercado Clandestino"
  - "Cibercrime"
  - "Infraestrutura"
  - "Resposta a Incidentes"
  - "DNS"
draft: false
lang: "pt-BR"
---

Entre janeiro e setembro de 2026, o [CERT.br acompanhou 4.672 páginas falsas](https://stats.cert.br/phishing/) usadas em tentativas de phishing. Dessas, 3.907 miravam organizações no Brasil, o que dá 84% do total. Olhando só para esse dado, seria tentador imaginar a operação aqui. Mas 3.249 páginas, cerca de 70%, estavam em endereços IP alocados aos Estados Unidos. Apenas 427 estavam em IPs alocados ao Brasil.

Quem escreveu essas páginas está nos Estados Unidos? Os dados não dizem isso. Eles dizem onde uma página estava hospedada em um momento, em um endereço alocado a um país. Entre esse fato e uma pessoa existe uma cadeia inteira de intermediários, e confundir os elos é um dos erros mais comuns nas discussões sobre crime digital.

Neste terceiro texto da série *O mercado clandestino do software*, saio do [painel do golpista](/pt/blog/por-dentro-de-um-sistema-fraudulento-labhost) e vou para a camada de baixo. O objetivo é compreender essa infraestrutura sob a ótica de quem investiga e defende. Por isso, o texto não aponta serviços "mais fáceis" de abusar nem trata de como esconder ou manter sistemas no ar.

## As peças que costumam ser confundidas

Antes de discutir responsabilidade, vale separar os componentes. Cada um é operado por alguém diferente e guarda registros diferentes.

| Peça | O que é | O que ajuda a descobrir | O que não prova |
| :--- | :--- | :--- | :--- |
| **Domínio** | Nome registrado, como `exemplo.com.br` | Quando foi registrado e por qual registrador | Quem o usa de fato. Dados de registro podem ser falsos, roubados ou protegidos por privacidade |
| **Serviço DNS** | Sistema que traduz o nome em endereços | Para onde o nome apontou ao longo do tempo | Quem controla o destino final |
| **Endereço IP** | Identificador de rede de um servidor ou conexão | Qual rede o anuncia e, com registros, qual cliente o usava em um instante | Quem estava diante do teclado |
| **Provedor de hospedagem** | Empresa que mantém o servidor | Conta, pagamento e logs, se existirem e forem acessíveis | Que a empresa sabia do crime |
| **Responsável pela operação** | Quem decide, opera e lucra | É a pergunta final da investigação | Não aparece em nenhuma das camadas acima de forma isolada |

Domínio, DNS e hospedagem podem estar em três empresas e em três países diferentes, sem que nenhuma delas tenha relação com o autor do golpe. Daí a regra que atravessa todo este texto: **cada camada aponta para a próxima, e nenhuma aponta sozinha para uma pessoa**.

## Seis categorias de infraestrutura documentadas

As categorias abaixo aparecem em incidentes públicos. Elas não se excluem, e nenhuma pode ser presumida em um caso específico sem evidência.

| Categoria | O que caracteriza | Caso ou fonte |
| :--- | :--- | :--- |
| Serviços legítimos abusados | Empresa regular cujos recursos são usados por terceiros, em violação às regras | [CISA e parceiros](https://www.ic3.gov/CSA/2025/251119.pdf) notam que até infraestrutura criminosa pode ser revendida a partir de provedores legítimos, que talvez nem saibam |
| Servidores comprometidos | Máquina invadida, usada sem o conhecimento do dono | Botnet Ebury: quase 400 mil servidores comprometidos desde 2009, segundo a ESET, [citada pelo BleepingComputer](https://www.bleepingcomputer.com/news/security/ebury-botnet-malware-infected-400-000-linux-servers-since-2009/), número acumulado e não simultâneo |
| Infraestrutura dedicada ao crime | Fornecedor que vende resistência a denúncias e ordens judiciais | Zservers, sancionada pelo [Tesouro dos EUA](https://home.treasury.gov/news/press-releases/sb0018); RedVDS, derrubado pela [Microsoft](https://blogs.microsoft.com/on-the-issues/2026/01/14/microsoft-disrupts-cybercrime/) |
| Domínios e DNS | Nomes registrados para enganar ou registros legítimos sequestrados | 77% dos domínios de phishing analisados pela [Interisle](https://interisle.net/press/pl2025-press-release) foram registrados com intenção maliciosa; ao menos 40 mil domínios ligados ao LabHost |
| Redes de dispositivos comprometidos | Computadores e roteadores de terceiros usados como intermediários | 911 S5: mais de 19 milhões de IPs associados a computadores infectados, segundo a [acusação](https://www.justice.gov/archives/opa/pr/911-s5-botnet-dismantled-and-its-administrator-arrested-coordinated-international-operation) |
| Serviços de terceiros | Plataformas de anúncios, mensagens e hospedagem de arquivos usadas para distribuir o golpe | O [IOCTA 2026](https://www.europol.europa.eu/cms/sites/default/files/documents/IOCTA-2026.pdf) descreve a publicidade maliciosa em grandes plataformas como vetor de fraude em escala |

Três desses casos merecem um olhar mais próximo, porque desmontam simplificações.

**O termo "bulletproof" engana.** A [orientação conjunta](https://www.ic3.gov/CSA/2025/251119.pdf) publicada em novembro de 2025 por agências dos EUA, Austrália, Canadá, Países Baixos, Nova Zelândia e Reino Unido define esse fornecedor como quem **sabe e intencionalmente** comercializa infraestrutura para criminosos. O elemento decisivo é a intenção, não a tecnologia. O mesmo documento alerta que essa infraestrutura fica integrada à internet legítima, e por isso bloquear uma rede inteira pode derrubar tráfego inocente.

**O provedor legítimo e o criminoso podem estar na mesma cadeia.** O RedVDS vendia máquinas virtuais descartáveis a partir de US$ 24 por mês. A Microsoft classificou o serviço como marketplace criminoso. Ainda assim, suas máquinas rodavam sobre redes de empresas de hospedagem. Segundo o [Microsoft Digital Defense Report 2026](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/msc/documents/presentations/CSR/Microsoft-Digital-Defense-Report-2026-v1.1.pdf), a maioria desses provedores começou a atender às notificações de remoção em janeiro de 2026, o que derrubou o número de máquinas disponíveis. Ser a empresa "embaixo" de uma operação criminosa não é a mesma coisa que fazer parte dela.

**Seu próprio DNS pode virar infraestrutura de terceiros.** Quando uma empresa apaga um recurso de nuvem e esquece o registro DNS que apontava para ele, surge um [registro órfão](https://learn.microsoft.com/en-us/azure/security/fundamentals/subdomain-takeover), que pode permitir a tomada do subdomínio. O golpe passa a sair de um endereço legítimo da própria vítima, e o rastreamento superficial aponta para a empresa errada.

## Por que um IP não identifica um criminoso

Um endereço IP é uma evidência útil e, ao mesmo tempo, muito menos do que parece. Cinco razões, todas documentadas:

1. **Conexões são compartilhadas.** Por causa da escassez de IPv4, provedores colocam muitos clientes atrás do mesmo endereço com CGNAT. Sem a porta de origem e o horário exato, um IP pode corresponder a muita gente ao mesmo tempo.
2. **O IP pode ser de uma vítima.** Foi essa a mercadoria do 911 S5. Segundo o Departamento de Justiça, clientes compravam IPs de computadores infectados para ocultar seus endereços e localização reais. Quem olhasse o registro veria uma família qualquer.
3. **O servidor pode ter sido invadido.** O CERT.br distingue explicitamente o [site legítimo comprometido](https://www.cert.br/docs/notificacoes/) do domínio malicioso, e orienta notificações diferentes para cada caso.
4. **O provedor pode não conhecer o cliente final.** O IOCTA 2026 descreve arranjos de sublocação em camadas, em várias jurisdições, em que pedidos judiciais acabam redirecionados a intermediários.
5. **Infraestrutura e ferramentas podem ser reaproveitadas.** Em 2019, a NCSC britânica e a NSA americana publicaram um [alerta conjunto](https://www.ncsc.gov.uk/files/Turla%20advisory%20UK%20FINAL.pdf) segundo o qual o grupo Turla, suspeito de ser baseado na Rússia, usou ferramentas e acessos de origem muito provavelmente iraniana, sem o conhecimento de quem os criou. Com a evidência parcial de uma vítima, a atribuição apontaria para o grupo errado. As próprias agências observam que atribuir ataques e provar a autoria de ferramentas pode ser muito difícil.

A consequência jurídica existe, embora varie por país. Nos EUA, em *Cobbler Nevada v. Gonzales*, de 2018, um tribunal federal de apelação decidiu, em uma ação civil de direitos autorais, que [ser o assinante de um IP não permite, sozinho, inferir que a pessoa cometeu a infração](https://cdn.ca9.uscourts.gov/datastore/opinions/2018/08/27/17-35041.pdf). A conexão era de uma casa de repouso, usada por moradores e visitantes.

País também não é localização. O próprio CERT.br tem o cuidado de falar em "códigos de país **de alocação** dos endereços IP". Esse código descreve a quem o bloco de endereços foi alocado. Ele não diz onde o servidor físico está com certeza e, muito menos, a nacionalidade ou a localização de quem cometeu a fraude.

## O que sustenta uma investigação legítima

Se nenhuma camada basta, o trabalho de investigação consiste em **correlacionar**. Nenhuma das fontes abaixo prova autoria sozinha. O peso vem da convergência entre elas.

| Evidência | O que pode indicar | Limitação |
| :--- | :--- | :--- |
| Registros de acesso | Quem conectou, quando, a partir de onde e com qual conta | Podem não existir: o RedVDS dizia não manter logs de atividade, segundo a [Microsoft](https://www.microsoft.com/en-us/security/blog/2026/01/14/inside-redvds-how-a-single-virtual-desktop-provider-fueled-worldwide-cybercriminal-operations/) |
| Dados de DNS | Histórico de apontamentos e relação entre domínios de uma mesma campanha | Mostra infraestrutura, não pessoas |
| Evidências de comprometimento | Se o servidor foi invadido, como e quando | Exige imagem e logs preservados antes da limpeza |
| Informações de domínio (WHOIS/RDAP) | Registrador, datas, contato de abuso | Dados pessoais costumam estar ocultos, e o CERT.br alerta que podem estar desatualizados |
| Cooperação com provedores | Conta, meio de pagamento, IP de acesso administrativo | Depende de ordem judicial, prazos de retenção e jurisdição |
| Fluxo de dinheiro | Quem recebe e para onde vai o dinheiro | Mistura de criptoativos, contas de terceiros |
| Padrões compartilhados | Mesma imagem de sistema, mesmo kit, mesma configuração | No RedVDS, máquinas com o mesmo nome de computador revelaram uma origem comum. Indica fornecedor, não o cliente que usou a máquina |

Nos casos da série, a atribuição veio da soma. No LabHost, dados de servidores, dispositivos apreendidos e rastreamento de pagamentos ligaram o criador aos crimes, segundo o [Crown Prosecution Service](https://www.cps.gov.uk/node/26240). Em nenhum deles a identificação dependeu só de um endereço.

### O que a lei brasileira exige guardar

No Brasil, o [Marco Civil da Internet](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm) obriga o administrador de sistema autônomo a guardar registros de conexão por um ano (art. 13) e provedores de aplicações com fins econômicos a guardar registros de acesso por seis meses (art. 15). O fornecimento desses dados segue regras próprias e, para formar prova em processo, passa por pedido ao juiz (art. 22).

A questão do CGNAT chegou ao Superior Tribunal de Justiça, que firmou o entendimento de que [provedores devem guardar e fornecer, mediante ordem judicial, a porta lógica de origem](https://www.stj.jus.br/docs_internet/jurisprudencia/jurisprudenciaemteses/Jurisprudencia%20em%20Teses%20223%20-%20Marco%20Civil%20da%20Internet%20II%20-%20Lei%20N%2012%20965%202014.pdf) associada ao IP. Em maio de 2026, o [Decreto 12.975](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D12975.htm) incluiu essa obrigação no regulamento do Marco Civil. Ele é contestado no STF na [ADI 7981](https://noticias.stf.jus.br/postsnoticias/partido-questiona-no-stf-decreto-que-altera-regulamentacao-do-marco-civil-da-internet/) e em projetos no Congresso, então vale conferir sua situação atual antes de usá-lo como referência.

Para quem desenvolve, a consequência é prática. Um log que registra só o IP pode ser inútil depois. Guardar IP, porta de origem e horário com fuso, com o relógio sincronizado, é a diferença entre um registro aproveitável e um enfeite.

<figure>
  <img src="/images/blog/onde-sistemas-fraudulentos-sao-hospedados-diagrama.webp" alt="Diagrama de uma cadeia de investigação. Da esquerda para a direita: domínio, DNS, endereço IP, provedor e conta de cliente, cada um com a pergunta que responde. Uma barreira amarela indica que nenhum desses elos prova autoria sozinho. Abaixo, três fontes de corroboração se juntam, dados de servidores e dispositivos, fluxo de pagamentos e conversas ou registros de plataforma, e levam à atribuição, com a observação de que a decisão cabe à Justiça." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Cada camada aponta para a próxima, mas a atribuição depende da convergência de evidências independentes. Diagrama conceitual do autor.</figcaption>
</figure>

## Por que derrubar um domínio não resolve tudo

Agora o título. A derrubada de um domínio é necessária e, com frequência, é a medida certa para proteger vítimas. Mas ela atua em uma camada apenas, e a operação pode depender de várias.

**O tempo joga contra.** Uma [pesquisa da USENIX Security de 2020](https://www.usenix.org/system/files/sec20-oest-sunrise.pdf), feita em parceria com uma grande empresa de pagamentos, mediu campanhas de phishing do início ao fim: em média, 21 horas entre o começo e a última vítima, com detecção cerca de nove horas após a primeira visita. Na mesma linha, o IOCTA 2026 diz que redes criminosas exploram o intervalo entre o registro do domínio e a ação das autoridades. Os números do CERT.br mostram os dois lados: nas páginas que acompanhou em 2026, 26,2% saíram do ar em até 8 horas e 36% ficaram mais de uma semana. Esse tempo é medido a partir da entrada no sistema de acompanhamento, e não da criação da página.

**Trocar um nome é barato.** O que a Interisle registrou em 2025 ajuda a dimensionar: 37% dos domínios de phishing vieram de serviços de registro em massa. Derrubar um nome não muda a capacidade de obter o próximo.

**O negócio pode sobreviver à infraestrutura.** O caso Lumma é o exemplo mais citado. Em maio de 2025, cerca de 2.300 domínios foram apreendidos ou bloqueados. Segundo a [Trend Micro](https://www.trendmicro.com/en/research/25/g/lumma-stealer-returns.html), a infraestrutura voltou a crescer em semanas, e o número de contas visadas entre clientes da empresa retornou aos níveis habituais entre junho e julho. O IOCTA 2026 relata padrão parecido em outras áreas: depois da queda de mercados da dark web, novos surgem rapidamente e herdam os usuários, e a rede de ataques NoName057(16) recuperou sua capacidade após uma operação internacional.

Seria fácil concluir que operações policiais não adiantam. As evidências não sustentam isso.

**Quando se atinge quem sustenta o ecossistema, o efeito pode ser maior.** A Microsoft relata que o Tycoon 2FA, depois da [ação de março de 2026](https://www.europol.europa.eu/media-press/newsroom/news/global-phishing-service-platform-taken-down-in-coordinated-public-private-action), viu seu volume de phishing [cair 92% em relação à média anterior](https://www.microsoft.com/en-us/security/blog/2026/07/23/email-threat-landscape-q2-2026-trends-and-insights/) e não migrou para infraestrutura substituta em escala comparável. O RedVDS [perdeu mais de 95% da infraestrutura](https://blogs.microsoft.com/on-the-issues/2026/03/04/how-a-global-coalition-disrupted-tycoon/). E o LockBit, apesar das tentativas de retorno, teve sucesso limitado, segundo o IOCTA 2026.

Dois avisos antes de comemorar. A Microsoft participou dessas operações e também é a fonte dos números, então convém ler com cuidado. E o intervalo de observação ainda é curto. Mesmo assim, o raciocínio do [relatório da empresa](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/msc/documents/presentations/CSR/Microsoft-Digital-Defense-Report-2026-v1.1.pdf) faz sentido do ponto de vista de arquitetura: enquanto os serviços compartilhados permanecem, os fraudadores trocam de conta e de domínio. Quando esses serviços são degradados, operações aparentemente sem relação tropeçam juntas.

Na minha leitura, a lição se parece com a de confiabilidade em sistemas distribuídos, só que invertida. Matar uma réplica não derruba um serviço. Atingir a dependência compartilhada, sim. Por isso, os resultados mais duradouros citados pelas fontes combinam ação técnica, judicial e financeira, em vez de uma derrubada isolada.

## Quando a marca copiada é a sua

Para uma empresa que descobre uma página imitando sua marca, a ordem das ações importa. As etapas abaixo são recomendações minhas, baseadas nas orientações do [CERT.br](https://www.cert.br/docs/notificacoes/) e do [CTIR Gov](https://www.gov.br/gsi/pt-br/assuntos/ctir/operacoes-e-servicos/notificacao-de-incidentes/orientacoes-para-notificacoes-de-incidentes-ciberneticos).

1. **Preservar antes de pedir a remoção.** Depois que a página cai, o conteúdo pode sumir. Registre URL, capturas, cabeçalhos da mensagem, horários com fuso e como a página foi descoberta. A [RFC 3227](https://www.rfc-editor.org/rfc/rfc3227) recomenda coletar primeiro o que é mais volátil. O CTIR Gov lembra da cadeia de custódia e de procedimentos de preservação.
2. **Classificar o caso.** O site é legítimo e foi comprometido, ou o domínio foi criado para o golpe? O CERT.br manda notificar a rede e o contato do domínio no primeiro caso. No segundo, orienta **não** usar o contato do domínio, que provavelmente é do fraudador, e acionar a rede e o registrador. Em domínios `.br`, é possível notificar o Registro.br diretamente.
3. **Notificar com evidência útil.** Inclua logs, data, hora e fuso, e sanitize dados que não são essenciais. O CERT.br recomenda tom neutro, sem linguagem acusatória ou jurídica, que reduz a chance de resposta, e cópia para o CSIRT nacional.
4. **Proteger clientes enquanto a página existe.** Invalide credenciais expostas, reforce o monitoramento de login e avise pelos canais oficiais.
5. **Acionar as autoridades quando houver indício de crime.** O CTIR Gov lembra que não conduz investigações criminais, tarefa da polícia. Havendo dados pessoais envolvidos, avalie as obrigações da LGPD.
6. **Monitorar reincidência.** Se a campanha voltar com outro domínio, o trabalho anterior vira insumo: padrões, kit e infraestrutura repetidos ajudam a correlacionar.

Há ainda um conflito real: remover rápido protege vítimas, mas pode destruir evidências e alertar o operador. Empresas não precisam resolver isso sozinhas. Em casos graves, vale coordenar com a autoridade antes de agir. O relatório da Microsoft descreve exatamente esse cuidado, para que ações técnicas não atrapalhem investigações criminais em curso.

## E se a infraestrutura abusada for a sua

Parte do problema descrito neste texto acontece em servidores de empresas comuns. Algumas práticas reduzem a chance de a sua virar a próxima hospedagem de um golpe:

- atualizar aplicações e equipamentos de borda, que o relatório da Microsoft aponta como alvo frequente e, muitas vezes, com pouca visibilidade;
- remover o registro DNS ao desativar qualquer recurso, como item fixo do checklist de encerramento;
- manter logs centralizados, com retenção compatível com o prazo legal e fora do alcance do próprio servidor;
- publicar um canal de abuso que alguém leia;
- ao receber uma notificação, investigar antes de responder. Seu servidor pode, sim, ter sido invadido.

Para quem opera hospedagem, a [orientação conjunta](https://www.ic3.gov/CSA/2025/251119.pdf) sugere listas de recursos maliciosos de alta confiança, filtros opcionais para clientes e padrões setoriais de responsabilidade, sempre avaliando o impacto sobre tráfego legítimo.

## O que fica

Infraestrutura é evidência, mas não é autoria. Saber onde uma página está responde a uma pergunta importante e deixa outra em aberto. Pular de uma para a outra é correr o risco de acusar quem também foi vítima e de deixar de procurar quem realmente operou o golpe.

No [próximo texto da série](/pt/blog/quem-escreve-o-codigo-do-crime-digital), saio dos servidores e vou para as pessoas: quem escreve esse código, como foi recrutado e como um desenvolvedor pode perceber que uma proposta não é o que parece.

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura. Empresas de hospedagem e sistemas autônomos que aparecem nas estatísticas não são nomeados de propósito: figurar nesses dados indica presença de abuso, não envolvimento. Dados de fornecedores refletem seus próprios ambientes e, em vários casos, ações de que eles mesmos participaram. Fontes consultadas em 30 de outubro de 2026.

- CERT.br. [Estatísticas de páginas falsas usadas em tentativas de phishing](https://stats.cert.br/phishing/). Dados de janeiro a setembro de 2026.
- CERT.br. [Notificações de incidentes de segurança](https://www.cert.br/docs/notificacoes/).
- Gabinete de Segurança Institucional, CTIR Gov. [Orientações para notificações de incidentes cibernéticos](https://www.gov.br/gsi/pt-br/assuntos/ctir/operacoes-e-servicos/notificacao-de-incidentes/orientacoes-para-notificacoes-de-incidentes-ciberneticos).
- Europol. [*The evolving threat landscape: how encryption, proxies and AI are expanding cybercrime. IOCTA 2026*](https://www.europol.europa.eu/cms/sites/default/files/documents/IOCTA-2026.pdf). Abril de 2026.
- Europol. [Global phishing-as-a-service platform taken down in coordinated public-private action](https://www.europol.europa.eu/media-press/newsroom/news/global-phishing-service-platform-taken-down-in-coordinated-public-private-action). Março de 2026.
- CISA, NSA, DC3, FBI e parceiros. [Bulletproof Defense: Mitigating Risks From Bulletproof Hosting Providers](https://www.ic3.gov/CSA/2025/251119.pdf). 19 de novembro de 2025.
- NCSC (Reino Unido), com apoio da NSA. [Advisory: Turla group exploits Iranian APT to expand coverage of victims](https://www.ncsc.gov.uk/files/Turla%20advisory%20UK%20FINAL.pdf). 21 de outubro de 2019.
- U.S. Department of Justice. [911 S5 Botnet Dismantled and Its Administrator Arrested in Coordinated International Operation](https://www.justice.gov/archives/opa/pr/911-s5-botnet-dismantled-and-its-administrator-arrested-coordinated-international-operation). 29 de maio de 2024.
- U.S. Department of the Treasury. [United States, Australia, and the United Kingdom Jointly Sanction Key Infrastructure that Enables Ransomware Attacks](https://home.treasury.gov/news/press-releases/sb0018). 11 de fevereiro de 2025.
- Crown Prosecution Service (Reino Unido). [Man who created 'one-stop shop for phishing' jailed](https://www.cps.gov.uk/node/26240). 14 de abril de 2025.
- Tribunal de Apelações do Nono Circuito (EUA). [*Cobbler Nevada, LLC v. Gonzales*, nº 17-35041](https://cdn.ca9.uscourts.gov/datastore/opinions/2018/08/27/17-35041.pdf). 27 de agosto de 2018.
- Oest, A. et al. [Sunrise to Sunset: Analyzing the End-to-end Life Cycle and Effectiveness of Phishing Attacks at Scale](https://www.usenix.org/system/files/sec20-oest-sunrise.pdf). 29th USENIX Security Symposium, 2020.
- Interisle Consulting Group. [Phishing Landscape 2025](https://interisle.net/press/pl2025-press-release). 9 de setembro de 2025.
- BleepingComputer. [Ebury botnet malware infected 400,000 Linux servers since 2009](https://www.bleepingcomputer.com/news/security/ebury-botnet-malware-infected-400-000-linux-servers-since-2009/). Maio de 2024.
- Microsoft. [Microsoft Digital Defense Report 2026](https://www.microsoft.com/en-us/security/security-insider/threat-landscape/2026-digital-defense-report). Outubro de 2026.
- Microsoft. [Microsoft disrupts global cybercrime subscription service responsible for millions in fraud losses](https://blogs.microsoft.com/on-the-issues/2026/01/14/microsoft-disrupts-cybercrime/). 14 de janeiro de 2026.
- Microsoft Threat Intelligence. [Inside RedVDS: How a single virtual desktop provider fueled worldwide cybercriminal operations](https://www.microsoft.com/en-us/security/blog/2026/01/14/inside-redvds-how-a-single-virtual-desktop-provider-fueled-worldwide-cybercriminal-operations/). 14 de janeiro de 2026.
- Microsoft. [Defending the gates: How a global coalition disrupted Tycoon 2FA](https://blogs.microsoft.com/on-the-issues/2026/03/04/how-a-global-coalition-disrupted-tycoon/). 4 de março de 2026.
- Microsoft Threat Intelligence. [Email threat landscape: Q2 2026 trends and insights](https://www.microsoft.com/en-us/security/blog/2026/07/23/email-threat-landscape-q2-2026-trends-and-insights/). 23 de julho de 2026.
- Microsoft Learn. [Prevent dangling DNS entries and avoid subdomain takeover](https://learn.microsoft.com/en-us/azure/security/fundamentals/subdomain-takeover).
- Trend Micro. [Lumma Stealer Returns](https://www.trendmicro.com/en/research/25/g/lumma-stealer-returns.html). Julho de 2025.
- IETF. [RFC 3227: Guidelines for Evidence Collection and Archiving](https://www.rfc-editor.org/rfc/rfc3227). Fevereiro de 2002.
- Presidência da República. [Lei nº 12.965/2014 (Marco Civil da Internet)](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm).
- Presidência da República. [Decreto nº 12.975, de 20 de maio de 2026](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D12975.htm).
- Superior Tribunal de Justiça. [Jurisprudência em Teses, edição 223: Marco Civil da Internet II](https://www.stj.jus.br/docs_internet/jurisprudencia/jurisprudenciaemteses/Jurisprudencia%20em%20Teses%20223%20-%20Marco%20Civil%20da%20Internet%20II%20-%20Lei%20N%2012%20965%202014.pdf).
- Supremo Tribunal Federal. [Partido questiona no STF decreto que altera regulamentação do Marco Civil da Internet](https://noticias.stf.jus.br/postsnoticias/partido-questiona-no-stf-decreto-que-altera-regulamentacao-do-marco-civil-da-internet/).
