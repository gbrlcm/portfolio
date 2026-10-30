---
title: "Por dentro de um sistema fraudulento: como um golpe digital se transforma em uma operação de software"
description: "A anatomia do LabHost, plataforma de phishing por assinatura derrubada em 2024, reconstruída só com o que a Justiça britânica, a Europol e pesquisadores documentaram."
pubDate: 2026-10-30T10:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/por-dentro-de-um-sistema-fraudulento-labhost.webp"
coverAlt: "Ilustração de um painel administrativo esquemático com uma lista de sessões e um campo de código de verificação destacado em amarelo, com o rótulo Série Mercado Clandestino 02"
category: "Segurança"
tags:
  - "Série Mercado Clandestino"
  - "Cibercrime"
  - "Phishing"
  - "Autenticação"
  - "Prevenção a Fraudes"
draft: false
lang: "pt-BR"
---

Em abril de 2024, cerca de 800 usuários de uma plataforma online receberam uma mensagem inesperada. Ela não vinha do suporte, e sim da polícia. Segundo a empresa de inteligência [Intel 471](https://www.intel471.com/blog/labhost-a-defunct-but-potent-phishing-kit), o recado dizia que as autoridades vinham coletando os dados deles o tempo todo.

A plataforma era o LabHost. Ela se apresentava como uma ["loja completa para phishing"](https://www.cps.gov.uk/node/26240), criada "por spammers, para spammers". Por uma mensalidade, o cliente recebia páginas falsas de bancos, órgãos públicos e empresas, hospedagem para colocá-las no ar e um painel para acompanhar as vítimas em tempo real. Segundo a promotoria britânica, milhares de criminosos usaram o serviço para fraudar ao menos um milhão de vítimas em 91 países.

Neste segundo texto da série *O mercado clandestino do software*, uso o LabHost para mostrar como um golpe vira uma operação de software, com componentes, assinaturas, suporte e painel administrativo. Escolhi o caso porque ele reúne o que poucos reúnem: **condenação judicial, comunicado oficial de uma operação internacional e análises independentes**. Reconstruo apenas os elementos que essas fontes sustentam. Não há aqui código, telas ou instruções que permitam reproduzir a plataforma.

## A linha do tempo

- **Agosto de 2021:** segundo o [Crown Prosecution Service](https://www.cps.gov.uk/node/26240) (CPS), começa o período em que o réu britânico foi central na criação, operação e administração do LabHost, que vai até outubro de 2023. A Intel 471 situa os primeiros anúncios por volta de setembro de 2021.
- **Setembro de 2023:** a Europol começa a apoiar o caso, conduzido pela Polícia Metropolitana de Londres.
- **Outubro de 2023:** uma interrupção longa levanta suspeitas de que o serviço teria sumido com o dinheiro dos clientes. Segundo o [BleepingComputer](https://www.bleepingcomputer.com/news/security/labhost-phishing-service-with-40-000-domains-disrupted-37-arrested/), ele volta plenamente em 6 de dezembro. A reportagem diz que não está claro se o episódio teve relação com a investigação.
- **Fevereiro de 2024:** a empresa de segurança Fortra alerta que o LabHost vinha ganhando popularidade e superando concorrentes estabelecidos.
- **14 a 17 de abril de 2024:** buscas em 70 endereços resultam em 37 prisões, quatro delas no Reino Unido, de pessoas ligadas à administração do site, incluindo o desenvolvedor original. Participaram autoridades de 19 países, segundo a [Europol](https://www.europol.europa.eu/media-press/newsroom/news/international-investigation-disrupts-phishing-service-platform-labhost).
- **18 de setembro de 2024:** o criador se declara culpado de fabricar ou fornecer artigos para uso em fraude, de incentivar ou auxiliar a prática de crime e de transferir bens de origem criminosa.
- **14 de abril de 2025:** ele é condenado a oito anos e meio de prisão.

## O que as fontes permitem reconstruir

A tabela lista os componentes do LabHost descritos nas fontes. Onde a informação vem de pesquisadores privados, e não de autoridades, isso está indicado.

| Componente | Função | Fonte |
| :--- | :--- | :--- |
| Catálogo de páginas falsas | Mais de 170 sites falsos prontos, imitando instituições financeiras, serviços postais e operadoras, entre outros | Europol |
| Hospedagem incluída | Infraestrutura para colocar as páginas no ar; ao menos 40 mil domínios ligados à plataforma | Europol |
| Visão geral de campanhas | Acompanhamento dos golpes de cada assinante | Europol |
| Interação em tempo real | Ferramenta chamada LabRat, que permitia monitorar e controlar ataques em andamento, desenhada para capturar credenciais e códigos de dois fatores | Europol |
| Envio de mensagens | Módulo de campanhas por SMS | Pesquisadores (PhishLabs, citados pela Intel 471) |
| Planos de assinatura | De US$ 179 a US$ 300 por mês, com mais páginas nos planos maiores; média de US$ 249, segundo a Europol | Europol e Intel 471 |
| Suporte técnico | Orientação aos assinantes por um serviço de mensagens criptografado | CPS |
| Coleta de dados | Números de cartão, PINs e senhas | Polícia Metropolitana, citada pela imprensa |

Igualmente importante é o que **não** sabemos. As fontes públicas que consultei não descrevem a arquitetura interna, as linguagens usadas, como os dados eram armazenados ou como o painel se comunicava com as páginas. Qualquer diagrama que mostre esses detalhes seria invenção. Por isso, o esquema abaixo representa só o fluxo que as fontes sustentam, em nível conceitual.

<figure>
  <img src="/images/blog/por-dentro-de-um-sistema-fraudulento-labhost-diagrama.webp" alt="Fluxo conceitual em quatro etapas: mensagem enviada à vítima, página falsa hospedada pela plataforma, painel em que o operador acompanha a vítima em tempo real, e uso dos dados na conta verdadeira. Abaixo, a plataforma fornece catálogo, hospedagem, painel e suporte ao assinante. Quatro pontos de defesa estão marcados: denúncia e derrubada de domínios, autenticação resistente a phishing, detecção de sessão anômala e validação da operação antes de liberar dinheiro." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>O fluxo documentado do LabHost e os pontos em que uma empresa pode interrompê-lo. Diagrama conceitual do autor, sem detalhes de implementação.</figcaption>
</figure>

## O ponto crítico: o código que vale por poucos segundos

O componente que a Europol considerou o mais destrutivo foi o LabRat. Ele explica por que o phishing moderno vai além de "roubar a senha".

Muitas empresas protegem o login com um segundo fator: um código enviado por SMS ou gerado em um aplicativo. A lógica é que, mesmo com a senha roubada, o criminoso não teria o código. O problema aparece quando o golpe acontece **em tempo real**. A vítima, acreditando estar no site verdadeiro, digita a senha e, em seguida, o código que acabou de receber. Se alguém do outro lado acompanha a sessão, esse código pode ser usado enquanto ainda é válido. Pesquisadores da Trend Micro, citados pela Intel 471, descreveram a ferramenta como do tipo *adversary-in-the-middle* (AiTM), capaz de capturar tokens de sessão.

O LabHost saiu do ar, mas a técnica não. O [Microsoft Digital Defense Report 2026](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/msc/documents/presentations/CSR/Microsoft-Digital-Defense-Report-2026-v1.1.pdf) atribui 44,6% das técnicas de phishing que a empresa identificou ao AiTM, contra 33,6% do phishing por URL padrão e 12,9% dos anexos tradicionais. É o retrato da telemetria de um fornecedor, não uma estatística mundial, mas a direção combina com a história de outra plataforma, o [Tycoon 2FA](https://www.europol.europa.eu/media-press/newsroom/news/global-phishing-service-platform-taken-down-in-coordinated-public-private-action), derrubada em março de 2026 e descrita pela Europol como um kit por assinatura para interceptar sessões de autenticação ao vivo.

O código de uso único protege contra senhas vazadas em massa. Contra alguém que convence a vítima a entregá-lo no momento certo, protege muito menos.

Métodos resistentes a phishing mudam essa equação. Em autenticação baseada em chaves criptográficas, como FIDO2/WebAuthn, usada por chaves de segurança e passkeys, a credencial fica vinculada ao domínio do site legítimo. O navegador não a oferece a um domínio diferente, por mais parecido que ele seja. Não há código para a vítima digitar e, portanto, nada para ser repassado. A publicação [SP 800-63B do NIST](https://pages.nist.gov/800-63-4/sp800-63b.html) é direta: senhas, códigos de uso único de tabela e autenticação fora de banda, como um código por SMS, não são resistentes a phishing. A norma exige ao menos uma opção resistente a phishing no nível AAL2 e o requisito completo no AAL3. A agência americana CISA recomenda esse tipo de MFA em seu guia sobre [implementação de MFA resistente a phishing](https://www.cisa.gov/sites/default/files/publications/fact-sheet-implementing-phishing-resistant-mfa-508c.pdf).

Uma ressalva: autenticação forte protege o login, não tudo o que vem depois. Uma sessão já autenticada pode ser roubada por malware no dispositivo, como fazem os infostealers. E uma fraude em que a vítima é convencida a fazer ela mesma a transferência passa ao largo do login. Para esses casos, a defesa está na detecção de sessões anômalas e na validação da operação, discutidas mais abaixo.

## Nem toda fraude é phishing

O LabHost é um caso de engenharia social industrializada. Mas fraudes digitais têm naturezas diferentes, e cada uma pede defesas diferentes. Esta classificação é minha, a partir das categorias descritas no [IOCTA 2025](https://www.europol.europa.eu/cms/sites/default/files/documents/Steal-deal-repeat-IOCTA_2025.pdf) da Europol:

| Categoria | Como funciona | Exemplo documentado | Defesa principal |
| :--- | :--- | :--- | :--- |
| Engenharia social | A vítima é induzida a entregar dados ou a agir | LabHost; ligações falsas de suporte técnico descritas no IOCTA 2025 | Autenticação resistente a phishing, validação de operações |
| Abuso de contas | Uso de credenciais ou sessões roubadas para se passar pelo titular | Genesis Market, que vendia cookies e "impressões digitais" de navegador | Detecção de sessão anômala, reautenticação, revogação de sessões |
| Exploração de vulnerabilidades | Uso de falhas em sistemas expostos ou injeção de código em lojas online | Corretores de acesso explorando VPNs e firewalls; skimmers em sites, segundo o IOCTA 2025 | Gestão de vulnerabilidades, atualização, monitoramento de integridade |
| Uso indevido de sistemas legítimos | Ferramentas e credenciais legítimas usadas para fins ilegítimos | Vítimas induzidas a instalar ferramentas legítimas de acesso remoto; credenciais usadas para alterar o [BNMP](/pt/blog/bnmp-mandados-falsos-sistemas-criticos) | Menor privilégio, dupla aprovação, auditoria |
| Ameaça interna | Funcionário recrutado ou perfil falso contratado | Recrutamento de funcionários e candidaturas com identidades falsas, descritos no IOCTA 2025 | Verificação na contratação, segregação de funções |

Na prática, os golpes combinam categorias. O IOCTA 2025 observa que os criminosos costumam usar técnicas diferentes em etapas diferentes do mesmo processo. Um phishing captura a credencial (engenharia social), que é usada para entrar na conta (abuso de contas), que serve para movimentar dinheiro.

## O que acontece com a vítima

A promotoria britânica estima perdas globais de ao menos £ 100 milhões associadas ao LabHost, das quais mais de £ 32 milhões no Reino Unido. Segundo a Polícia Metropolitana de Londres, [citada pela Malwarebytes](https://www.malwarebytes.com/blog/news/2024/04/law-enforcement-reels-in-phishing-as-a-service-whopper), cerca de 70 mil pessoas no Reino Unido caíram em páginas do serviço. No mundo, a plataforma teria reunido 480 mil números de cartão, 64 mil PINs e mais de um milhão de senhas.

O dano não termina no primeiro uso. O IOCTA 2025 registra que dados podem ser vendidos e comprados várias vezes por criminosos diferentes, ou revendidos depois de usados, o que pode resultar em **vários atacantes mirando a mesma vítima**. O IOCTA 2026 chama isso de ciclo vicioso de revitimização. Uma senha capturada hoje pode reaparecer meses depois em outro golpe, em outro serviço em que a vítima reutilizou a mesma senha.

## Como empresas podem detectar e prevenir

As medidas abaixo são recomendações minhas, organizadas pelos pontos do fluxo em que atuam. Nenhuma, isoladamente, resolve.

### Autenticação

- **Oferecer passkeys ou chaves de segurança** aos clientes e exigi-las de funcionários com acesso privilegiado. Das medidas desta lista, é a que torna a página falsa inútil no momento do login.
- **Não tratar SMS como fator forte** em operações de alto risco. Ele continua útil contra ataques em massa, mas não contra o phishing em tempo real.

### Sessão e autorização

- **Reautenticar antes de ações sensíveis**: cadastrar novo beneficiário, trocar e-mail ou telefone, aumentar limites, emitir cartão virtual.
- **Detectar sessões anômalas**: um login bem-sucedido seguido de troca de dispositivo, de rede ou de padrão de uso merece atrito adicional. "Impressões digitais" de navegador podem ser roubadas, como mostrou o Genesis Market, então não devem ser o único sinal.

### Validação de operações

- **Confirmar a operação, não só o usuário.** A confirmação deve mostrar o que está sendo autorizado (valor, destinatário) por um canal que o golpista não controla.
- **Limites e períodos de espera para destinatários novos.** Fraudes de transferência dependem de velocidade.
- **No Brasil, conhecer o MED.** O [Mecanismo Especial de Devolução do Pix](https://www.bcb.gov.br/estabilidadefinanceira/pix-seguranca) permite bloquear temporariamente recursos na conta de destino. O pedido pode ser feito em até 80 dias, mas o próprio Banco Central avisa que o mecanismo não garante a devolução, que depende da análise do caso e de haver saldo.

### Monitoramento e proteção de dados

- **Monitorar domínios parecidos com a sua marca** e ter um processo rápido de denúncia. O [CERT.br orienta](https://www.cert.br/docs/notificacoes/) que, quando o domínio é malicioso, a notificação vá para a rede que hospeda a página e para o registrador, e não para o contato do próprio domínio, que provavelmente é controlado pelo fraudador.
- **Minimizar os dados expostos.** O IOCTA 2025 mostra que dados pessoais servem de matéria-prima para golpes mais convincentes. Cada dado que a empresa não coleta, ou não exibe em telas e mensagens, é um dado a menos para alimentar um roteiro de fraude.

### Resposta a incidentes

- **Revogar sessões e credenciais** de clientes afetados e avisá-los por um canal oficial.
- **Preservar evidências** (URLs, cabeçalhos de mensagens, horários com fuso) antes de pedir a derrubada. O [próximo texto da série](/pt/blog/onde-sistemas-fraudulentos-sao-hospedados) detalha essa ordem.
- **Comunicar o incidente** quando houver dados pessoais envolvidos: o artigo 48 da [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm) exige comunicar à ANPD e aos titulares incidentes que possam acarretar risco ou dano relevante.

## Como a investigação chegou à autoria

O LabHost também mostra como plataformas centralizadas deixam rastros. Segundo o [Crown Prosecution Service](https://www.cps.gov.uk/node/26240), o criador foi preso no aeroporto de Manchester em 14 de abril de 2024, e seus dispositivos foram apreendidos. Dados de servidores obtidos com parceiros internacionais e outras evidências digitais o ligaram aos crimes. Ele recebeu US$ 230 mil em criptomoedas, valor que passou por contas de criptoativos e contas bancárias pessoais e foi convertido em dinheiro vivo por meio de um terceiro.

Os assinantes também ficaram expostos. A Europol informou que os dados reunidos passariam a apoiar operações contra os usuários da plataforma. Na minha leitura, essa é a ironia central do crime como serviço: **o painel que dava ao golpista controle sobre a vítima era o mesmo banco de dados que daria à polícia controle sobre o golpista**.

## O que o caso ensina

Para quem desenvolve, o LabHost é desconfortavelmente familiar. Catálogo de modelos, planos, painel, hospedagem gerenciada, suporte por chat. Na minha avaliação, nada disso exige sofisticação técnica rara. O que o tornava perigoso era a combinação de três coisas: páginas convincentes, interação em tempo real e um modelo de negócio que colocava essas capacidades nas mãos de pessoas sem conhecimento técnico.

Para quem defende, a lição é que **a fraude atravessa o sistema inteiro**, da mensagem à transferência. Proteger só o login, só o e-mail ou só a transação deixa caminhos abertos. A defesa que funciona é a que interrompe o fluxo em mais de um ponto.

No próximo texto da série, saio do painel e vou para a infraestrutura: [onde esses sistemas são hospedados e por que derrubar um domínio não resolve tudo](/pt/blog/onde-sistemas-fraudulentos-sao-hospedados). O texto anterior trata do [mercado de serviços como um todo](/pt/blog/mercado-negro-do-software).

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura. Por escolha editorial, o texto não reproduz nomes nem apelidos de pessoas investigadas ou condenadas, que constam das fontes oficiais. Informações atribuídas a empresas privadas estão identificadas como tal no texto. Fontes consultadas em 30 de outubro de 2026.

- Crown Prosecution Service (Reino Unido). [Man who created 'one-stop shop for phishing' jailed](https://www.cps.gov.uk/node/26240). 14 de abril de 2025.
- Europol. [International investigation disrupts phishing-as-a-service platform LabHost](https://www.europol.europa.eu/media-press/newsroom/news/international-investigation-disrupts-phishing-service-platform-labhost). Abril de 2024.
- Europol. [Global phishing-as-a-service platform taken down in coordinated public-private action](https://www.europol.europa.eu/media-press/newsroom/news/global-phishing-service-platform-taken-down-in-coordinated-public-private-action) (Tycoon 2FA). Março de 2026.
- Europol. *Steal, deal and repeat: How cybercriminals trade and exploit your data. IOCTA 2025*. Publications Office of the European Union, junho de 2025. [Página da publicação](https://op.europa.eu/en/publication-detail/-/publication/0a06109b-4b28-11f0-85ba-01aa75ed71a1/).
- Europol. [*The evolving threat landscape: how encryption, proxies and AI are expanding cybercrime. IOCTA 2026*](https://www.europol.europa.eu/cms/sites/default/files/documents/IOCTA-2026.pdf). Abril de 2026.
- Microsoft. [Microsoft Digital Defense Report 2026](https://www.microsoft.com/en-us/security/security-insider/threat-landscape/2026-digital-defense-report). Outubro de 2026. Período coberto: julho de 2025 a junho de 2026.
- Intel 471. [LabHost: A defunct but potent phishing kit](https://www.intel471.com/blog/labhost-a-defunct-but-potent-phishing-kit). 16 de abril de 2025.
- BleepingComputer (Bill Toulas). [LabHost phishing service with 40,000 domains disrupted, 37 arrested](https://www.bleepingcomputer.com/news/security/labhost-phishing-service-with-40-000-domains-disrupted-37-arrested/). 18 de abril de 2024.
- Malwarebytes. [Law enforcement reels in phishing-as-a-service whopper](https://www.malwarebytes.com/blog/news/2024/04/law-enforcement-reels-in-phishing-as-a-service-whopper). Abril de 2024.
- U.S. Department of Justice. [Criminal Marketplace Disrupted in International Cyber Operation](https://www.justice.gov/archives/opa/pr/criminal-marketplace-disrupted-international-cyber-operation) (Genesis Market). 5 de abril de 2023.
- NIST. [SP 800-63B-4: Digital Identity Guidelines, Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html).
- CISA. [Implementing Phishing-Resistant MFA](https://www.cisa.gov/sites/default/files/publications/fact-sheet-implementing-phishing-resistant-mfa-508c.pdf) (fact sheet). Outubro de 2022.
- Banco Central do Brasil. [Segurança no Pix](https://www.bcb.gov.br/estabilidadefinanceira/pix-seguranca).
- CERT.br. [Notificações de incidentes de segurança](https://www.cert.br/docs/notificacoes/).
- Presidência da República. [Lei nº 13.709/2018 (LGPD)](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm).
