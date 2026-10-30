---
title: "O mercado negro do software: quem programa os sistemas que movimentam o crime digital?"
description: "Assinaturas, licenças, comissões e venda de acesso: como parte do cibercrime passou a funcionar como economia de serviços, segundo Europol, NCA e Justiça dos EUA."
pubDate: 2026-10-30T09:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/mercado-negro-do-software.webp"
coverAlt: "Ilustração de uma tabela de preços em três colunas, como a de um software comercial, com os valores mensais documentados do LabHost e a coluna do meio destacada em amarelo, com o rótulo Série Mercado Clandestino 01"
category: "Segurança"
tags:
  - "Série Mercado Clandestino"
  - "Cibercrime"
  - "Crime como Serviço"
  - "Segurança da Informação"
  - "Engenharia de Software"
draft: false
lang: "pt-BR"
---

Em fevereiro de 2024, a National Crime Agency (NCA), do Reino Unido, tomou o ambiente de administração do LockBit, um dos grupos de ransomware mais ativos do mundo. Três meses depois, a agência divulgou o que encontrou nos sistemas: [194 afiliados identificados até fevereiro de 2024](https://www.nationalcrimeagency.gov.uk/news/lockbit-leader-unmasked-and-sanctioned) e mais de 7.000 ataques montados com a plataforma entre junho de 2022 e fevereiro de 2024. Havia também um dado curioso: **até 114 desses afiliados pagaram para entrar no programa e, segundo a NCA, aparentemente nunca receberam um resgate**.

Clientes que pagam a entrada, usam a plataforma e não tiram retorno dela. Descrito assim, parece o relato de uma startup que vendeu mais licenças do que entregou valor. A comparação incomoda, mas é o ponto de partida desta série: **uma parte relevante do crime digital documentado hoje funciona como um mercado, com fornecedores, produtos, planos, suporte e intermediários**.

Este é o primeiro texto da série *O mercado clandestino do software*. Aqui analiso modelos de negócio que autoridades e pesquisadores documentaram e os papéis que aparecem nas investigações. O objetivo é entender estruturas e padrões, não ensinar a participar delas. Por isso, o texto não traz apelidos, contatos nem formas de acesso a mercados clandestinos. Os nomes de pessoas investigadas estão nas fontes oficiais e aqui não acrescentam nada à análise.

## Do "hacker" ao fornecedor: o que é crime como serviço

A Europol resume o modelo em uma frase: no cibercrime como serviço, [criminosos alugam ou vendem ferramentas, conhecimento ou serviços a outros criminosos para que estes cometam os ataques](https://www.europol.europa.eu/media-press/newsroom/news/international-investigation-disrupts-phishing-service-platform-labhost). O modelo se consolidou no ransomware e se espalhou para o phishing e outras áreas.

A [avaliação de ameaças da Europol publicada em abril de 2026](https://www.europol.europa.eu/cms/sites/default/files/documents/IOCTA-2026.pdf), o IOCTA 2026, vai mais longe e diz que, nessa economia, atores de ameaças híbridas, que podem ou não estar ligados a Estados, são "simplesmente mais um cliente". A edição anterior, o [IOCTA 2025](https://www.europol.europa.eu/cms/sites/default/files/documents/Steal-deal-repeat-IOCTA_2025.pdf), lista o que se compra e se vende: registros de infostealers (malware que rouba credenciais e cookies), dados de cartões, acesso inicial a redes corporativas, credenciais de serviços web, assinaturas de kits de phishing, serviços de falsificação de chamadas e modelos de linguagem maliciosos, além de soluções "antidetecção".

Duas ressalvas, feitas pelos próprios autores, são importantes. O IOCTA 2025 avisa que, como muitas transações acontecem em canais fechados, o relatório **cobre apenas a parte do ecossistema visível ao Centro Europeu de Cibercrime (EC3)**. E o IOCTA 2026 se define como uma visão centrada na aplicação da lei, baseada principalmente em informação qualitativa. São retratos do que a polícia europeia enxerga, não um censo do crime digital no mundo.

### As siglas, sem mistificação

| Termo | O que descreve | Exemplo documentado |
| :--- | :--- | :--- |
| Cybercrime-as-a-Service (CaaS) | O guarda-chuva: serviços vendidos a outros criminosos | Termo usado pela Europol |
| Ransomware-as-a-Service (RaaS) | Plataforma de ransomware operada por um núcleo e usada por afiliados | LockBit, ALPHV/BlackCat |
| Phishing-as-a-Service (PhaaS) | Assinatura de páginas falsas, hospedagem e painel | LabHost, Tycoon 2FA |
| Malware-as-a-Service (MaaS) | Malware vendido como licença, com suporte e atualizações | Lumma |
| Fraude como serviço | Rótulo descritivo para os insumos de golpes, como números, chips e servidores descartáveis | Rede de SIM boxes descrita no IOCTA 2026; RedVDS |
| Corretor de acesso inicial (IAB) | Quem vende a entrada em uma rede já comprometida | Genesis Market |

As fronteiras entre esses rótulos são fluidas. Eles descrevem formatos de mercado, não categorias jurídicas, e um mesmo fornecedor pode caber em mais de um.

## Um catálogo documentado

Os modelos abaixo vêm de casos com investigação oficial ou relatório técnico. Não são todos os modelos existentes e não significam que todo grupo criminoso opera assim. São exemplos verificáveis de cada formato.

| Modelo | O que se vende | Caso | O que as fontes registram |
| :--- | :--- | :--- | :--- |
| Licença em níveis | Malware pronto, com planos | Lumma | Planos de US$ 250 a US$ 20.000, este com acesso ao código-fonte, segundo a [Microsoft](https://blogs.microsoft.com/on-the-issues/2025/05/21/microsoft-leads-global-action-against-favored-cybercrime-tool/) |
| Assinatura mensal | Plataforma de phishing com hospedagem e painel | LabHost | Média de US$ 249 por mês, cerca de 10.000 usuários e ao menos 40.000 domínios, segundo a [Europol](https://www.europol.europa.eu/media-press/newsroom/news/international-investigation-disrupts-phishing-service-platform-labhost) |
| Infraestrutura descartável | Máquinas virtuais baratas por assinatura | RedVDS | A partir de US$ 24 por mês, segundo a [Microsoft](https://blogs.microsoft.com/on-the-issues/2026/01/14/microsoft-disrupts-cybercrime/) |
| Programa de afiliados com comissão | Ransomware e infraestrutura para quem executa os ataques | ALPHV/BlackCat | Os afiliados de um caso pagavam 20% de cada resgate aos administradores, segundo o [Departamento de Justiça dos EUA](https://www.justice.gov/opa/pr/two-americans-plead-guilty-targeting-multiple-us-victims-using-alphv-blackcat-ransomware) |
| Venda de acesso e identidade | Credenciais, cookies e "impressões digitais" de navegador | Genesis Market | Dados de mais de 1,5 milhão de computadores e mais de 80 milhões de credenciais, segundo o [Departamento de Justiça](https://www.justice.gov/archives/opa/pr/criminal-marketplace-disrupted-international-cyber-operation) |
| Hospedagem dedicada | Servidores que ignoram denúncias | Zservers | Sancionada por EUA, Austrália e Reino Unido por fornecer IPs a afiliados do LockBit, segundo o [Tesouro dos EUA](https://home.treasury.gov/news/press-releases/sb0018) |
| Rede de proxies | Acesso a IPs de computadores infectados | 911 S5 | Segundo a [acusação](https://www.justice.gov/archives/opa/pr/911-s5-botnet-dismantled-and-its-administrator-arrested-coordinated-international-operation), cerca de US$ 99 milhões em vendas entre 2018 e 2022 |
| Vitrine e reputação | Fóruns que anunciam ferramentas e dados | Cracked e Nulled | Mais de 4 e 5 milhões de usuários, respectivamente, até a derrubada em janeiro de 2025, segundo o IOCTA 2025 |

Três observações sobre essa tabela.

**Os planos imitam o software comercial.** No Lumma, a Microsoft descreve que, conforme o plano, o comprador podia criar versões próprias do malware, acrescentar ferramentas de distribuição e acompanhar os dados roubados em um portal. No RedVDS, o painel do cliente exibia programa de fidelidade e bônus por indicação, segundo a mesma empresa.

**Comissão é modelo de negócio, e as porcentagens variam.** O IOCTA 2026 registra que o Qilin oferece aos afiliados 80% a 85% de cada pagamento e que o DragonForce anunciou um serviço de análise de dados roubados e preparo de material de extorsão, com taxas que podem passar de 20% do resgate. Na outra ponta, o IOCTA 2025 diz que acessos valiosos e vulnerabilidades desconhecidas costumam ser negociados de forma privada, **possivelmente em troca de uma porcentagem dos ganhos do comprador**.

**Preço depende do alvo.** Segundo o IOCTA 2025, o valor de um acesso varia com o setor, o porte, a receita e a localização da organização comprometida, além do tipo e da persistência do acesso. O relatório cita a CrowdStrike, empresa de segurança, segundo a qual o preço anunciado de acessos subiu quase 50% em 2024. É um número de fornecedor, baseado no que a empresa monitora, e deve ser lido assim.

<figure>
  <img src="/images/blog/mercado-negro-do-software-diagrama.webp" alt="Diagrama em três camadas. Na base, fornecedores: desenvolvedores, operadores de infraestrutura e fornecedores de dados. No meio, intermediários: corretores de acesso, mercados e fóruns. No topo, executores: afiliados, golpistas assinantes e compradores de identidades. Entre as camadas, o pagamento desce, na forma de assinatura, licença ou comissão, e sobem acesso, dados, ferramentas e servidores. O diagrama observa que fornecedores também vendem direto aos executores." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Como as camadas do mercado se relacionam, segundo os casos citados no texto. Simplificação: uma mesma pessoa pode ocupar mais de uma camada. Diagrama do autor.</figcaption>
</figure>

## Nem todo grupo criminoso é uma plataforma

Aqui mora o erro mais comum de quem escreve sobre o assunto, inclusive o de quem usa a palavra "mercado" com entusiasmo demais. O IOCTA 2026 divide os grupos de ransomware em três formatos:

- **Programas públicos de afiliados**, em que quase qualquer pessoa pode se cadastrar e usar as capacidades da plataforma.
- **Grupos semifechados**, que recrutam de forma seletiva e buscam afiliados qualificados e de confiança.
- **Grupos fechados**, formados por pessoas que provavelmente trabalham juntas há anos, desenvolvem o próprio malware, hospedam boa parte da infraestrutura e executam os ataques. Dependem menos do crime como serviço e, segundo a Europol, são mais difíceis de identificar, porque seus rastros aparecem menos em dados apreendidos ou vazados.

Esse último ponto é um alerta sobre viés de sobrevivência. Sabemos muito sobre as plataformas abertas justamente porque elas têm muitos clientes, vazam e são apreendidas. Isso não prova que elas sejam a forma dominante do crime digital. Prova que são a forma mais visível.

## Quatro papéis que costumam ser confundidos

Na cobertura de um ataque, tudo vira "o hacker". As investigações mostram funções diferentes, com responsabilidades e evidências diferentes.

| Papel | O que faz | Exemplo documentado |
| :--- | :--- | :--- |
| **Executor** | Escolhe a vítima e realiza o ataque ou o golpe | Afiliados que montavam e negociavam ataques com o LockBit; compradores de identidades no Genesis Market |
| **Desenvolvedor** | Cria e mantém a ferramenta | O criador do LabHost, que segundo o [Crown Prosecution Service](https://www.cps.gov.uk/node/26240) foi central na criação e administração da plataforma e dava suporte aos assinantes |
| **Intermediário** | Vende o que viabiliza o ataque: acesso, dados, visibilidade | O Genesis Market, que o Departamento de Justiça chamou de um dos mais prolíficos corretores de acesso inicial do mundo |
| **Operador de infraestrutura** | Mantém servidores, IPs, domínios e redes | Os administradores da Zservers; o administrador do 911 S5, que segundo a acusação controlava cerca de 150 servidores dedicados |

Há ainda o **fornecedor de dados**, que o IOCTA 2025 descreve como quem usa infostealers e campanhas de phishing para coletar informações e revendê-las, em lotes brutos ou já processados. O relatório considera provável que existam criminosos especializados só em extrair e analisar esse material.

Na prática, os papéis se sobrepõem. O criador do LabHost também dava suporte. Segundo a NCA, o administrador do LockBit era também seu desenvolvedor. E o Departamento de Justiça acusa o administrador do 911 S5 de, com outras pessoas, criar o malware, operar a infraestrutura e vender o acesso. O valor da distinção está em lembrar que **"quem atacou" e "quem tornou o ataque possível" são perguntas diferentes**.

## Como o desenvolvimento é terceirizado

As fontes públicas mostram pelo menos quatro arranjos diferentes, que nem sempre têm a ver com um contrato de terceirização no sentido comum.

- **Salário.** Nos chats vazados do Conti, analisados pela [Check Point Research](https://research.checkpoint.com/2022/leaks-of-conti-ransomware-group-paint-picture-of-a-surprisingly-normal-tech-start-up-sort-of/), programadores e alguns gerentes recebiam salário em bitcoin, enquanto negociadores ganhavam de 0,5% a 1% do resgate.
- **Pagamento recorrente a um especialista.** A [acusação contra um suposto desenvolvedor do LockBit](https://www.justice.gov/usao-nj/pr/dual-russian-and-israeli-national-extradited-united-states-his-role-lockbit-ransomware) descreve transferências de cerca de US$ 10 mil por mês em criptomoeda, que somaram mais de US$ 230 mil.
- **Venda do código.** O plano mais caro do Lumma incluía o acesso ao código-fonte, o que transfere a manutenção ao comprador.
- **Reaproveitamento de código vazado.** O IOCTA 2026 registra que operadores de ransomware mudam de atividade com facilidade graças a bases de código vazadas, ferramentas de montagem de código com IA e plataformas que permitem gerar versões próprias. O DragonForce, por exemplo, oferece variantes montadas a partir do código vazado do Conti e do LockBit.

O último arranjo ajuda a explicar por que derrubar uma marca não encerra um problema: o código sobrevive à organização que o escreveu. Quem trabalha com software reconhece a dinâmica de um fork.

## Que trabalho técnico aparece nas investigações

Os vazamentos do Conti são o melhor retrato público disponível, com a ressalva de que descrevem **uma** organização em um momento específico. A Check Point identificou recursos humanos, programadores, testadores, especialistas em ofuscar código, administradores de sistemas, engenharia reversa, equipe ofensiva e pessoal de pesquisa e negociação. Nos arquivos do Tesouro americano sobre o [grupo Trickbot](https://home.treasury.gov/news/press-releases/jy1714), aparecem administradores, gerentes, desenvolvedores, programadores e testadores.

Grande parte desse trabalho é pouco glamorosa. Pesquisadores de Cambridge e Strathclyde mostraram, com entrevistas e dados de fóruns, que [operar infraestrutura de cibercrime é trabalho tedioso, pouco diferente do de um administrador de sistemas legítimo](https://www.cl.cam.ac.uk/~bjc63/Crime_is_boring.pdf), e que esse tédio leva a esgotamento e abandono de serviços. O [quarto texto desta série](/pt/blog/quem-escreve-o-codigo-do-crime-digital) trata dessas pessoas em detalhe.

## Por que ferramentas prontas reduzem a barreira técnica

A especialização faz no crime o que faz em qualquer mercado de software: quem compra não precisa entender tudo o que está por baixo. O cliente de uma plataforma de e-commerce não precisa saber administrar servidores. O assinante de uma plataforma de phishing também não.

A Europol é explícita: plataformas como o LabHost [tornam o cibercrime mais acessível para criminosos sem habilidade técnica e ampliam significativamente o número de pessoas capazes de atacar](https://www.europol.europa.eu/media-press/newsroom/news/international-investigation-disrupts-phishing-service-platform-labhost). O LabHost oferecia um cardápio de mais de 170 sites falsos e serviços que podiam ser colocados no ar "com poucos cliques".

Mas barreira menor não significa sucesso garantido. Três sinais nas próprias fontes:

- **Muitos clientes parecem não lucrar.** Os afiliados do LockBit que, segundo a NCA, aparentemente nunca receberam resgate são o exemplo mais claro. Dos 194, 75 nem chegaram a negociar com vítimas.
- **O mercado é cheio de propaganda enganosa.** O IOCTA 2025 registra que corretores de dados frequentemente exageram o valor do que vendem e que as ofertas podem ser falsas ou vir de vazamentos antigos.
- **A confiança é o gargalo.** A participação em fóruns depende de reputação construída ao longo do tempo. O IOCTA 2026 acrescenta que golpes de saída, em que administradores somem com o dinheiro dos usuários, são endêmicos nos mercados menores e que os mercados vivem cada vez menos.

Na minha leitura, isso ajuda a entender a semelhança com o software legítimo. Planos, marca, suporte e reputação existem para resolver a desconfiança entre compradores e vendedores que não podem recorrer a um contrato.

## Como o modelo de serviços muda escala e responsabilidade

O efeito mais visível é a escala. Uma plataforma de phishing esteve ligada a ao menos 40 mil domínios. Outra, o [Tycoon 2FA](https://www.europol.europa.eu/media-press/newsroom/news/global-phishing-service-platform-taken-down-in-coordinated-public-private-action), gerava dezenas de milhões de e-mails por mês e facilitou acesso indevido a quase 100 mil organizações, segundo a Europol. Cada desenvolvedor multiplica o alcance de dezenas ou milhares de executores.

O segundo efeito é a **diluição da responsabilidade percebida**. Quem escreve o código pode dizer a si mesmo que "só vende a ferramenta". Quem executa pode dizer que "só usou o que comprou". Quem aluga o servidor pode dizer que "só fornece infraestrutura". Cada participante vê uma fatia da operação, e essa fragmentação facilita não olhar para o todo. A Justiça, como veremos, nem sempre aceita esse raciocínio.

O terceiro efeito é menos comentado e, para quem trabalha com engenharia, o mais interessante: **plataformas centralizam evidências**. Um serviço com milhares de clientes precisa de cadastro, cobrança, logs, painel e suporte. Quando a polícia chega à infraestrutura, chega a tudo isso de uma vez.

- No LabHost, a Europol informou que uma grande quantidade de dados passou às mãos das autoridades para apoiar operações contra os usuários da plataforma.
- No Genesis Market, o Departamento de Justiça disse que o mercado "prometia falsamente uma nova era de anonimato e impunidade" e acabou se tornando uma forma de identificar e prender criminosos.
- No LockBit, a [NCA informou](https://www.nationalcrimeagency.gov.uk/news/nca-leads-international-investigation-targeting-worlds-most-harmful-ransomware-group) ter obtido o código-fonte da plataforma e grande quantidade de informações sobre quem trabalhou com o grupo e usou seus serviços.

A arquitetura que permite escalar o crime é a mesma que cria pontos únicos de falha para ele. Os criminosos também perceberam isso. A Europol nota uma mudança para plataformas menores, grupos fechados e infraestrutura própria.

## O que diferencia um papel do outro nas investigações

As fontes públicas mostram tipos de evidência que aparecem repetidamente quando autoridades atribuem um papel a alguém. A lista não é exaustiva, e cada caso depende das suas provas.

- **Dados do servidor.** No LabHost, segundo o Crown Prosecution Service, dados de servidores obtidos com parceiros internacionais ligaram o criador da plataforma aos crimes.
- **Fluxo de pagamentos.** O mesmo réu recebeu US$ 230 mil em criptomoedas, que passou por contas pessoais e converteu em dinheiro vivo por meio de um terceiro. No 911 S5, a acusação descreve a compra de imóveis com os recursos.
- **Registros da plataforma.** O ambiente de administração do LockBit permitiu à NCA separar afiliados que montaram ataques, que negociaram com vítimas e que receberam pagamentos.
- **Conversas de trabalho.** A acusação contra o suposto desenvolvedor do LockBit cita mensagens com o administrador sobre tarefas no construtor do malware e no painel de controle.
- **Contratos de infraestrutura.** O Tesouro americano relata, no caso Zservers, a locação de IPs a afiliados do LockBit e um episódio revelador: depois da reclamação de uma empresa, os administradores [desligaram o IP denunciado e atribuíram um novo ao mesmo cliente](https://home.treasury.gov/news/press-releases/sb0018), informando ao denunciante que o endereço tinha sido cortado. É esse tipo de conduta, e não o simples fato de hospedar algo, que separa infraestrutura dedicada ao crime de um provedor abusado.

Um cuidado necessário: acusação não é condenação. Os próprios comunicados do Departamento de Justiça lembram que uma acusação é apenas uma alegação e que os réus são presumidos inocentes até prova em contrário. Ao longo da série, sinalizo quando um fato vem de condenação, de acusação ou de relatório técnico.

## As consequências de participar conscientemente

**Legais.** No Brasil, o artigo 154-A do Código Penal, que trata da invasão de dispositivo informático, prevê no § 1º a mesma pena para quem ["produz, oferece, distribui, vende ou difunde dispositivo ou programa de computador com o intuito de permitir a prática"](https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm) da invasão. A fraude eletrônica, no artigo 171, § 2º-A, tem pena de 4 a 8 anos de reclusão. O artigo 29 estabelece que quem concorre para um crime responde por ele "na medida de sua culpabilidade". A [Lei 12.850/2013](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12850.htm) define organização criminosa, entre outros requisitos, pela associação de quatro ou mais pessoas com divisão de tarefas, "ainda que informalmente". Como cada situação depende dos fatos, da intenção e da prova, não faço aqui afirmações jurídicas sobre casos hipotéticos. No Reino Unido, o criador do LabHost foi condenado a oito anos e meio de prisão por, entre outros crimes, fabricar ou fornecer artigos para uso em fraude.

**Financeiras e de mobilidade.** As sanções do Tesouro americano bloqueiam bens e proíbem transações com pessoas e empresas designadas. No caso LockBit, a NCA informou que o líder identificado passou a estar sujeito a congelamentos de bens e proibições de viagem impostos por Reino Unido, Estados Unidos e Austrália.

**Profissionais e éticas.** A habilidade que constrói um painel administrativo, uma plataforma por assinatura ou uma infraestrutura resiliente é a mesma que o mercado legítimo paga para ter. Na minha opinião, o argumento do "só escrevi o código" perde força diante do que esses sistemas fizeram: o LabHost, sozinho, esteve ligado a ao menos um milhão de vítimas, segundo a promotoria britânica.

## O que isso significa para quem constrói software legítimo

Para empresas e desenvolvedores, a lição prática é ajustar o modelo de ameaça. O atacante pode não ter criado a ferramenta que usa: ele pode ter **comprado capacidade pronta**. Isso muda algumas prioridades.

- **Credenciais e sessões são mercadoria.** Se infostealers vendem cookies e "impressões digitais" de navegador, como no Genesis Market, um login válido não prova que é o usuário. Vale reautenticar em operações sensíveis, encurtar sessões de alto risco e desconfiar de sessões que mudam de contexto.
- **Sua marca pode estar no catálogo de alguém.** Plataformas como o LabHost vendiam páginas falsas de bancos, serviços públicos e empresas de entrega. Monitorar domínios parecidos com o seu e ter um canal de denúncia rápido faz diferença.
- **Autenticação resistente a phishing deixou de ser luxo.** O [Microsoft Digital Defense Report 2026](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/msc/documents/presentations/CSR/Microsoft-Digital-Defense-Report-2026-v1.1.pdf) atribui 44,6% das técnicas de phishing identificadas pela empresa ao *adversary-in-the-middle*, que captura o código e a sessão em tempo real. É um dado do ambiente que a Microsoft observa, não do mundo inteiro, mas mostra por que o [segundo texto da série](/pt/blog/por-dentro-de-um-sistema-fraudulento-labhost) dá tanta atenção a esse ponto.

## Para continuar a série

Este é o primeiro de cinco textos. Os próximos:

- [Por dentro de um sistema fraudulento](/pt/blog/por-dentro-de-um-sistema-fraudulento-labhost): a anatomia do LabHost, reconstruída só com o que as fontes sustentam.
- [Onde os sistemas fraudulentos são hospedados](/pt/blog/onde-sistemas-fraudulentos-sao-hospedados): domínio, IP, provedor e autor não são a mesma coisa.
- [Quem escreve o código do crime digital](/pt/blog/quem-escreve-o-codigo-do-crime-digital): divisão de trabalho, recrutamento e como avaliar uma proposta suspeita.
- [A inteligência artificial está mudando a economia do crime digital?](/pt/blog/ia-economia-do-crime-digital): o que é evidência, o que é estimativa e o que é hipótese.

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura. Por escolha editorial, o texto não reproduz nomes nem apelidos de pessoas investigadas, que constam das fontes oficiais. Relatórios de empresas de segurança refletem o que cada empresa observa em seus próprios ambientes e não são estatísticas representativas de todo o cibercrime. Fontes consultadas em 30 de outubro de 2026.

- Europol. [*The evolving threat landscape: how encryption, proxies and AI are expanding cybercrime. IOCTA 2026*](https://www.europol.europa.eu/cms/sites/default/files/documents/IOCTA-2026.pdf). Publications Office of the European Union, abril de 2026.
- Europol. *Steal, deal and repeat: How cybercriminals trade and exploit your data. IOCTA 2025*. Publications Office of the European Union, junho de 2025. [Página da publicação](https://op.europa.eu/en/publication-detail/-/publication/0a06109b-4b28-11f0-85ba-01aa75ed71a1/) e [PDF](https://www.europol.europa.eu/cms/sites/default/files/documents/Steal-deal-repeat-IOCTA_2025.pdf).
- Europol. [International investigation disrupts phishing-as-a-service platform LabHost](https://www.europol.europa.eu/media-press/newsroom/news/international-investigation-disrupts-phishing-service-platform-labhost). Abril de 2024.
- Europol. [Global phishing-as-a-service platform taken down in coordinated public-private action](https://www.europol.europa.eu/media-press/newsroom/news/global-phishing-service-platform-taken-down-in-coordinated-public-private-action) (Tycoon 2FA). Março de 2026.
- Crown Prosecution Service (Reino Unido). [Man who created 'one-stop shop for phishing' jailed](https://www.cps.gov.uk/node/26240). 14 de abril de 2025.
- National Crime Agency (Reino Unido). [International investigation disrupts the world's most harmful cyber crime group](https://www.nationalcrimeagency.gov.uk/news/nca-leads-international-investigation-targeting-worlds-most-harmful-ransomware-group). 20 de fevereiro de 2024.
- National Crime Agency (Reino Unido). [LockBit leader unmasked and sanctioned](https://www.nationalcrimeagency.gov.uk/news/lockbit-leader-unmasked-and-sanctioned). 7 de maio de 2024.
- U.S. Attorney's Office, District of New Jersey. [Dual Russian and Israeli National Extradited to the United States for His Role in the LockBit Ransomware Conspiracy](https://www.justice.gov/usao-nj/pr/dual-russian-and-israeli-national-extradited-united-states-his-role-lockbit-ransomware). Março de 2025.
- U.S. Department of Justice. [Two Americans Plead Guilty to Targeting Multiple U.S. Victims Using ALPHV BlackCat Ransomware](https://www.justice.gov/opa/pr/two-americans-plead-guilty-targeting-multiple-us-victims-using-alphv-blackcat-ransomware). Dezembro de 2025.
- U.S. Department of Justice. [Criminal Marketplace Disrupted in International Cyber Operation](https://www.justice.gov/archives/opa/pr/criminal-marketplace-disrupted-international-cyber-operation) (Genesis Market). 5 de abril de 2023.
- U.S. Department of Justice. [911 S5 Botnet Dismantled and Its Administrator Arrested in Coordinated International Operation](https://www.justice.gov/archives/opa/pr/911-s5-botnet-dismantled-and-its-administrator-arrested-coordinated-international-operation). 29 de maio de 2024.
- U.S. Department of the Treasury. [United States, Australia, and the United Kingdom Jointly Sanction Key Infrastructure that Enables Ransomware Attacks](https://home.treasury.gov/news/press-releases/sb0018) (Zservers). 11 de fevereiro de 2025.
- U.S. Department of the Treasury. [United States and United Kingdom Sanction Additional Members of the Russia-Based Trickbot Cybercrime Gang](https://home.treasury.gov/news/press-releases/jy1714). 7 de setembro de 2023.
- Microsoft. [Disrupting Lumma Stealer: Microsoft leads global action against favored cybercrime tool](https://blogs.microsoft.com/on-the-issues/2025/05/21/microsoft-leads-global-action-against-favored-cybercrime-tool/). 21 de maio de 2025.
- Microsoft. [Microsoft disrupts global cybercrime subscription service responsible for millions in fraud losses](https://blogs.microsoft.com/on-the-issues/2026/01/14/microsoft-disrupts-cybercrime/) (RedVDS). 14 de janeiro de 2026.
- Microsoft. [Microsoft Digital Defense Report 2026](https://www.microsoft.com/en-us/security/security-insider/threat-landscape/2026-digital-defense-report). Outubro de 2026. Período coberto: julho de 2025 a junho de 2026.
- Check Point Research. [Leaks of Conti Ransomware Group Paint Picture of a Surprisingly Normal Tech Start-Up… Sort Of](https://research.checkpoint.com/2022/leaks-of-conti-ransomware-group-paint-picture-of-a-surprisingly-normal-tech-start-up-sort-of/). 10 de março de 2022.
- Collier, B.; Clayton, R.; Hutchings, A.; Thomas, D. R. [Cybercrime is (often) boring: maintaining the infrastructure of cybercrime economies](https://www.cl.cam.ac.uk/~bjc63/Crime_is_boring.pdf). Workshop on the Economics of Information Security (WEIS), 2020.
- Presidência da República. [Decreto-Lei nº 2.848/1940 (Código Penal), texto compilado](https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm), artigos 29, 154-A e 171.
- Presidência da República. [Lei nº 12.850/2013](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12850.htm).
