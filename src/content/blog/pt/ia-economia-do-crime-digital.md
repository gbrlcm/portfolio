---
title: "A inteligência artificial está mudando a economia do crime digital?"
description: "IA em golpes: o que está documentado, o que é estimativa e o que é hipótese, a partir de experimentos, Europol, FBI, Microsoft e um estudo de fóruns criminosos."
pubDate: 2026-10-30T13:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/ia-economia-do-crime-digital.webp"
coverAlt: "Ilustração de uma escala de evidências com quatro degraus, de hipótese a caso documentado, com o degrau de experimento controlado destacado em amarelo, com o rótulo Série Mercado Clandestino 05"
category: "Segurança"
tags:
  - "Série Mercado Clandestino"
  - "Cibercrime"
  - "Inteligência Artificial"
  - "Phishing"
  - "Prevenção a Fraudes"
draft: false
lang: "pt-BR"
---

Um número circula em apresentações de segurança: e-mails de phishing automatizados com IA teriam taxa de cliques de 54%, contra 12% dos tradicionais, um aumento de 4,5 vezes. A frase está no [Microsoft Digital Defense Report 2025](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/security/Microsoft-Digital-Defense-Report-2025-v5-21Nov25.pdf), e o [IOCTA 2025](https://www.europol.europa.eu/cms/sites/default/files/documents/Steal-deal-repeat-IOCTA_2025.pdf) da Europol também cita o mesmo estudo.

Fui até a fonte. O número vem de um [experimento acadêmico com 101 participantes](https://www.schneier.com/wp-content/uploads/2026/02/Evaluating-Large-Language-Models-Ability-to-Automate.pdf), recrutados principalmente em ambiente universitário e divididos em quatro grupos. Os 12% são do grupo de controle, com um e-mail genérico adaptado. Os 54% da IA têm um detalhe que costuma sumir nas citações: **e-mails escritos por especialistas humanos também tiveram 54%**. O estudo mostra que, naquele contexto, a IA igualou especialistas a um custo muito menor. Isso é importante. Mas é uma conclusão diferente de "a IA tornou o phishing 4,5 vezes mais eficaz no mundo real".

Este último texto da série *O mercado clandestino do software* faz o mesmo exercício para o resto do debate. A pergunta do título merece uma resposta, mas com a evidência separada por tipo. O texto não traz instruções de uso malicioso de IA, exemplos de mensagens fraudulentas nem técnicas para contornar defesas.

## Uma escala para ler qualquer afirmação sobre IA e crime

Antes dos fatos, um critério. Quando uma manchete fala de IA em golpes, vale perguntar em que degrau ela está.

| Tipo de evidência | O que significa | Exemplo |
| :--- | :--- | :--- |
| **Caso documentado** | Autoridade ou vítima confirma o uso em um crime real | Arup, Operação Modo Selva |
| **Experimento controlado** | Pesquisadores medem o efeito em condições definidas, sem criminosos reais | Heiding et al., Czybik et al. |
| **Telemetria de fornecedor** | Empresa relata o que vê nos próprios sistemas | Relatórios de Microsoft, Google, OpenAI |
| **Dados autodeclarados** | Vítimas ou analistas apontam a presença de IA | Denúncias ao FBI |
| **Avaliação de especialistas** | Autoridade faz um julgamento qualitativo | Europol, NCSC |
| **Projeção** | Afirmação sobre o que deve acontecer | "Vai aumentar a taxa de sucesso" |
| **Alegação comercial** | Marketing de fornecedores de segurança ou de ferramentas criminosas | Anúncios de modelos "sem limites" |

Nenhum degrau é inútil, mas eles não respondem à mesma pergunta.

## O que os experimentos realmente mostram

Três estudos com pessoas reais são os mais úteis, e juntos contam uma história mais rica do que qualquer número solto.

| Estudo | Desenho | Resultado principal |
| :--- | :--- | :--- |
| [Heiding et al.](https://www.schneier.com/wp-content/uploads/2026/02/Evaluating-Large-Language-Models-Ability-to-Automate.pdf), *Expert Systems with Applications*, 2026 | 101 participantes em quatro grupos | Controle 12%, especialistas 54%, IA 54%, IA com revisão humana 56% |
| [Bethany et al.](https://arxiv.org/pdf/2401.09727), pré-print, 2025 | Cerca de 9 mil pessoas de uma universidade, com e-mails internos simulados | Humanos 10,92% e IA 12,15% de cliques. Os autores concluem que foram igualmente eficazes, com variação por tema |
| [Czybik et al.](https://mlsec.tu-berlin.de/docs/2026-sec.pdf), USENIX Security 2026 | Cerca de 7.700 pessoas em treinamento de conscientização de uma universidade | Genérico 3,7% a 4,1%, personalizado por IA 10,0%, personalizado à mão 24,2% (com cerca de 100 pessoas) |

O terceiro é o mais esclarecedor. A personalização por IA quase triplicou a taxa de cliques em relação a e-mails genéricos, a um custo estimado de US$ 0,03 por mensagem. Mas o e-mail genérico escrito por IA **não superou** o escrito por um humano, e o personalizado à mão ainda foi 2,4 vezes mais eficaz que o automatizado. Os autores notam que esses ataques manuais não escalam.

Os três juntos sugerem uma conclusão mais precisa do que as manchetes. **O ganho não vem de a IA escrever melhor. Vem de personalizar barato.** O que antes exigia horas de um especialista agora custa centavos, com qualidade inferior à de um bom humano, mas muito superior à do disparo genérico. Para o criminoso, esse é um problema de custo unitário.

As limitações são reais. Os três estudos ocorreram em contextos universitários. Nenhum mediu perda financeira, e um clique não é uma fraude consumada. O estudo de Heiding estima que a automação pode aumentar a lucratividade em até 50 vezes, mas essa é uma análise econômica, não uma medição de campo. Czybik et al. também registram que participantes receberam uma comunicação prévia, o que pode introduzir viés.

## O que os fóruns criminosos dizem sobre si mesmos

Se a IA estivesse revolucionando o crime, isso deveria aparecer nas comunidades que vivem dele. Em março de 2026, pesquisadores de Cambridge, Edimburgo e Strathclyde publicaram um [estudo em pré-print](https://arxiv.org/pdf/2603.29545v1) sobre exatamente isso. Analisaram 97.895 discussões de fóruns relacionadas a IA, posteriores ao lançamento do ChatGPT, e leram em detalhe mais de 3.200.

A conclusão é sóbria. Apesar do interesse, a IA generativa **não reduziu significativamente a barreira de entrada nem causou disrupção nos modelos de negócio estabelecidos**. O maior impacto apareceu em áreas já muito automatizadas, como fraude de SEO, bots em redes sociais e algumas formas de golpe romântico. Coders experientes a usam para substituir buscas por erros e consultas a referências, e iniciantes acham pouca utilidade em comparação com scripts prontos. Os produtos de "IA criminosa" tiveram adoção pequena. Os autores encontraram até indícios de que proteções dos modelos e saturação econômica limitam certos abusos.

Há uma observação curiosa no fim do texto. Para os autores, o efeito mais importante pode ser indireto: demissões e um mercado de trabalho frio empurrando desenvolvedores qualificados para comunidades de golpes. É hipótese, explicitamente, e conversa com o que discuti no [texto anterior](/pt/blog/quem-escreve-o-codigo-do-crime-digital).

Ressalvas: é um pré-print, e fóruns não mostram grupos fechados, que na minha leitura são justamente os mais capazes de absorver essas ferramentas sem falar disso em público.

## O que as autoridades e os fornecedores afirmam

Aqui as fontes divergem, e a divergência é informativa.

O [IOCTA 2026](https://www.europol.europa.eu/cms/sites/default/files/documents/IOCTA-2026.pdf) é mais assertivo. Diz que a IA generativa continua acelerando fraudes, com personalização, personificação de atendentes e policiais e maior realismo em golpes corporativos. Registra usos concretos como assistência de código, roteiros para operadores de central de golpes e robôs de voz que fazem uma triagem inicial de vítimas em grande volume, e nota que criminosos frequentemente dependem de modelos públicos com proteções burladas. Ao mesmo tempo, o texto trata a IA agêntica como "um motor ainda em desenvolvimento" em uma seção e afirma, em outra, que criminosos já começaram a usá-la. O relatório é uma avaliação qualitativa e centrada na aplicação da lei.

O [Verizon DBIR 2026](https://www.verizon.com/business/resources/executivebriefs/2026-dbir-executive-summary.pdf) traz um dado que ajuda a calibrar: o ator mediano usou ou pesquisou assistência de IA em 15 técnicas documentadas, mas a maior parte do desenvolvimento assistido se concentrou em técnicas bem conhecidas, com mediana de 55 exemplos de malware existentes fazendo a mesma função. **Menos de 2,5% dos casos envolviam técnicas pouco comuns.** A leitura natural é que, por enquanto, a IA ajuda a fazer mais depressa o que já se fazia.

O [Google Threat Intelligence Group](https://cloud.google.com/blog/topics/threat-intelligence/from-prompting-to-autonomy-the-evolution-of-adversarial-ai) relatou em setembro de 2026 uma transição, entre os adversários mais avançados, de comandos isolados para fluxos com agentes, incluindo um caso de suposto ator financeiramente motivado operando em escala normalmente associada a grupos maiores. Em operações de influência, o mesmo relatório afirma que os ganhos são de produtividade e que nenhuma tática criou capacidades inéditas.

A [OpenAI](https://cdn.openai.com/pdf/df438d70-e3fe-4a6c-a403-ff632def8f79/disrupting-malicious-uses-of-ai.pdf), em fevereiro de 2026, registrou que atores costumam combinar IA com ferramentas tradicionais e fez uma observação que merece destaque. Conteúdo gerado por IA teve resultados muito diferentes dentro do mesmo lote, e em um caso de golpe os anúncios segmentados pareceram ser o fator-chave de engajamento. **O texto gerado, sozinho, não pareceu decisivo.**

A [Anthropic](https://www.anthropic.com/news/detecting-countering-misuse-aug-2025) relatou em agosto de 2025 uma operação de extorsão contra ao menos 17 organizações que usou um agente de programação para automatizar reconhecimento, coleta de credenciais e penetração em redes. É o tipo de caso que sustenta a preocupação com agentes, embora venha da própria empresa que opera o modelo.

Google, OpenAI, Anthropic e Microsoft veem o que passa por seus sistemas. Isso lhes dá informação que ninguém mais tem e, ao mesmo tempo, um viés de visibilidade e um interesse comercial. O [NCSC britânico](https://www.ncsc.gov.uk/report/impact-ai-cyber-threat-now-2027), que não vende modelos, avaliou em 2025 que a IA tornará elementos das intrusões mais eficazes, mas considerou **improvável** o desenvolvimento de ataques avançados, totalmente automatizados e de ponta a ponta até 2027.

## Os casos reais

**Arup, 2024.** Um funcionário de finanças em Hong Kong foi levado a uma videochamada com supostos colegas, incluindo o diretor financeiro, e transferiu cerca de US$ 25 milhões. A empresa [confirmou à CNN](https://edition.cnn.com/2024/05/16/tech/arup-deepfake-scam-loss-hong-kong-intl-hnk/index.html) o uso de vozes e imagens falsas. É um caso confirmado por vítima e polícia, e não prova que golpes desse tipo sejam comuns: ele é famoso em parte por ser raro.

**Operação Modo Selva, 2025.** A Polícia Civil do Rio Grande do Sul [mirou um grupo](https://sbtnews.sbt.com.br/noticia/policia/policia-do-rs-mira-quadrilha-que-usava-deepfake-de-gisele-buendchen-para-aplicar-golpes) suspeito de usar deepfakes de celebridades em anúncios falsos em redes sociais, cobrando "frete" via Pix por produtos inexistentes. Note a estrutura: o vídeo falso é uma peça de uma operação que também precisou de anúncios, sites, contas para receber o dinheiro e, segundo a polícia, movimentou mais de R$ 20 milhões. São suspeitos em investigação, não condenados.

**Denúncias ao FBI.** O [relatório de 2025 do IC3](https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf) trouxe uma seção sobre IA: 22.364 denúncias com referência ao tema e US$ 893 milhões em perdas ajustadas, de um total de mais de US$ 20 bilhões. A maior parte, US$ 632 milhões, está em golpes de investimento. O próprio relatório sugere que muitas vítimas não percebem a IA envolvida. O dado tem duas limitações opostas: pode subestimar, porque depende de a vítima mencionar a IA, e não prova que a IA tenha causado a perda. É uma denúncia com a etiqueta "IA", não uma medição de efeito.

## O que a automação acelera e o que continua sendo gargalo

Na minha leitura, a forma mais útil de pensar o assunto é abrir a operação em etapas, como fizemos no [caso LabHost](/pt/blog/por-dentro-de-um-sistema-fraudulento-labhost). A IA atua em algumas delas muito mais do que em outras.

<figure>
  <img src="/images/blog/ia-economia-do-crime-digital-diagrama.webp" alt="Diagrama com as etapas de uma operação de fraude em duas colunas. Em Acelerado por IA: pesquisa sobre o alvo, escrita e tradução de mensagens, personalização, conversa inicial com a vítima, código comum e peças de mídia falsa. Em Continua sendo gargalo: acesso e dados de qualidade, infraestrutura, contas para receber dinheiro, lavagem e saque, coordenação de pessoas e confiança entre criminosos." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Onde as fontes apontam ganho de velocidade e onde a operação continua dependendo de outros recursos. Síntese do autor, com base nos relatórios citados.</figcaption>
</figure>

**O que tende a acelerar:** pesquisa sobre o alvo, escrita, tradução, personalização, primeira conversa com a vítima, código genérico e peças de mídia. A barreira do idioma é um bom exemplo. O IOCTA 2026 diz que grupos de fora da Europa conseguem personalizar narrativas e alcançar cidadãos europeus, superando barreiras linguísticas. Para o público brasileiro, isso deve preocupar: o português errado sempre foi um sinal de alerta barato, e esse sinal enfraquece.

**O que continua sendo gargalo:** nada disso resolve onde receber o dinheiro. O golpe ainda precisa de dados válidos, acesso, infraestrutura, contas de passagem, lavagem, coordenação de pessoas e confiança entre criminosos. Os [textos sobre infraestrutura](/pt/blog/onde-sistemas-fraudulentos-sao-hospedados) e sobre [o mercado](/pt/blog/mercado-negro-do-software) mostraram que essas são as partes caras e arriscadas da operação. O IOCTA 2026 afirma que a resiliência das redes de fraude que dependem de serviços criminosos se apoia na capacidade de comprar e ativar chips em massa, um problema físico e regulatório, e descreve cadeias logísticas de SIM boxes que a polícia pode interceptar.

Isso também conversa com os [afiliados do LockBit que, segundo a NCA, aparentemente nunca receberam um resgate](/pt/blog/mercado-negro-do-software): produzir tentativas nunca foi o único gargalo do crime digital.

## O lado defensivo

Defensores usam as mesmas técnicas, e também aqui é preciso separar medição de marketing.

- **Detecção de anomalias e análise de comportamento.** O argumento é estrutural. Se o texto do golpe fica bom, a defesa precisa olhar para o que o golpista não controla: dispositivo, histórico, velocidade, destino do dinheiro. O [Microsoft Digital Defense Report 2026](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/msc/documents/presentations/CSR/Microsoft-Digital-Defense-Report-2026-v1.1.pdf) recomenda detecção por comportamento correlacionado.
- **Resposta automatizada.** O mesmo relatório descreve sistemas que isolam dispositivos, desativam contas e revogam sessões quando um incidente atinge um limiar de confiança, sem aguardar aprovação manual. Limiares mal calibrados bloqueiam clientes legítimos, então essa automação pede cuidado.
- **Detecção de conteúdo.** No estudo de Heiding, um modelo identificou 97,25% de 381 e-mails sem falsos positivos. A amostra é pequena e não prova eficácia contra um adversário que se adapta.
- **Verificação de identidade.** O [alerta da FinCEN](https://www.fincen.gov/news/news-releases/fincen-issues-alert-fraud-schemes-involving-deepfake-media-targeting-financial) de 2024 registrou aumento de relatos de documentos falsos possivelmente gerados com IA para burlar verificações. O relatório da Microsoft de 2025 afirma que identidades sintéticas já conseguem superar testes de vivacidade. Selfie, sozinha, não deve sustentar uma decisão de alto risco.
- **Monitoramento de transações.** No Brasil, o [Banco Central](https://www.bcb.gov.br/estabilidadefinanceira/pix-seguranca) prevê a marcação de fraude no Pix, que alerta outras instituições sobre chaves e documentos envolvidos em suspeita.

Fornecedores também divulgam números impressionantes. O relatório da Microsoft de 2025 cita US$ 4 bilhões em fraudes impedidas e 1,6 milhão de cadastros falsos bloqueados por hora. São dados da empresa sobre si mesma, sem verificação externa.

### O que fazer na prática

Minhas recomendações, que valem com ou sem IA do outro lado:

1. **Pare de confiar em sinais de escrita.** Treinamentos baseados em erros de português envelheceram. Ensine a verificar o pedido, não o estilo.
2. **Confirme fora de banda.** Pedido de pagamento por videochamada ou áudio se confirma por um canal já conhecido, antes de pagar, e não depois.
3. **Separe autoridade de canal.** Nenhuma transferência alta deveria depender de uma única pessoa convencida por uma única conversa.
4. **Reduza a superfície pública.** Czybik et al. recomendam limitar informações públicas ligadas a e-mails, já que a personalização se alimenta delas.
5. **Use autenticação resistente a phishing** e valide as operações, como detalhei no [segundo texto da série](/pt/blog/por-dentro-de-um-sistema-fraudulento-labhost).

## Então, a IA está mudando a economia do crime digital?

A resposta curta é sim em parte, de um modo menos cinematográfico do que o debate sugere.

O que as evidências sustentam: a IA reduz o **custo** de personalizar e de produzir conteúdo, e experimentos mostram que isso pode aumentar cliques em relação a campanhas genéricas. Criminosos usam essas ferramentas, e há casos reais de deepfake e de automação com agentes.

O que elas ainda não sustentam: que a IA tenha tornado os golpes em geral mais eficazes no mundo real. Faltam medições comparáveis de perda antes e depois. Os dados de fóruns sugerem adoção modesta na base do ecossistema, enquanto relatórios de fornecedores mostram avanços no topo. As duas coisas podem ser verdadeiras ao mesmo tempo, e isso é o que eu esperaria de qualquer tecnologia nova: ela chega antes para quem já é capaz.

O que continua em aberto: a IA agêntica. Europol, Microsoft e Google tratam o tema como uma mudança em curso, e o NCSC, em 2025, considerou improvável a automação completa de ataques avançados até 2027. Esse é um campo em que previsões envelhecem rápido, e este texto pode precisar de atualização em poucos meses.

Encerro a série com a mesma ideia que a abriu. Crime digital é uma operação com etapas, custos e pessoas. A IA mexe em algumas dessas etapas, e entender quais é mais útil do que temer ou descartar a tecnologia em bloco. A defesa, como sempre, está em atacar o que a operação não consegue terceirizar para um modelo.

A série completa: [o mercado](/pt/blog/mercado-negro-do-software), [a anatomia de um golpe](/pt/blog/por-dentro-de-um-sistema-fraudulento-labhost), [a infraestrutura](/pt/blog/onde-sistemas-fraudulentos-sao-hospedados) e [as pessoas](/pt/blog/quem-escreve-o-codigo-do-crime-digital).

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura. Relatórios de fornecedores refletem seus próprios ambientes e não representam todo o cibercrime. Microsoft, Google, OpenAI e Anthropic também vendem produtos de IA, e essa posição deve ser considerada na leitura dos dados. Fontes consultadas em 30 de outubro de 2026.

- Heiding, F.; Lermen, S.; Kao, A.; Mayrink Verdun, C.; Schneier, B.; Vishwanath, A. [Evaluating large language models' ability to automate spear phishing](https://www.schneier.com/wp-content/uploads/2026/02/Evaluating-Large-Language-Models-Ability-to-Automate.pdf). *Expert Systems with Applications*, v. 314, 2026.
- Czybik, S.; Kouam, A. J.; Heubl, P.; Nold, J. M.; Rieck, K. [A Large-Scale Study of Personalized Phishing using Large Language Models](https://mlsec.tu-berlin.de/docs/2026-sec.pdf). USENIX Security Symposium, 2026.
- Bethany, M. et al. [Lateral Phishing with Large Language Models: A Large Organization Comparative Study](https://arxiv.org/pdf/2401.09727). arXiv, versão de março de 2025.
- Hughes, J.; Collier, B.; Thomas, D. R. [Stand-Alone Complex or Vibercrime? Exploring the adoption and innovation of GenAI tools, coding assistants, and agents within cybercrime ecosystems](https://arxiv.org/pdf/2603.29545v1). Pré-print, arXiv, 31 de março de 2026.
- Europol. [*The evolving threat landscape: how encryption, proxies and AI are expanding cybercrime. IOCTA 2026*](https://www.europol.europa.eu/cms/sites/default/files/documents/IOCTA-2026.pdf). Abril de 2026.
- Europol. *Steal, deal and repeat. IOCTA 2025*. Junho de 2025. [PDF](https://www.europol.europa.eu/cms/sites/default/files/documents/Steal-deal-repeat-IOCTA_2025.pdf).
- National Cyber Security Centre (Reino Unido). [Impact of AI on cyber threat from now to 2027](https://www.ncsc.gov.uk/report/impact-ai-cyber-threat-now-2027). Maio de 2025.
- FBI, Internet Crime Complaint Center. [2025 Internet Crime Report](https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf). Abril de 2026.
- FinCEN. [FinCEN Issues Alert on Fraud Schemes Involving Deepfake Media Targeting Financial Institutions](https://www.fincen.gov/news/news-releases/fincen-issues-alert-fraud-schemes-involving-deepfake-media-targeting-financial). Novembro de 2024.
- Microsoft. [Microsoft Digital Defense Report 2025](https://www.microsoft.com/en-us/security/security-insider/threat-landscape/microsoft-digital-defense-report-2025). Outubro de 2025. Período: julho de 2024 a junho de 2025.
- Microsoft. [Microsoft Digital Defense Report 2026](https://www.microsoft.com/en-us/security/security-insider/threat-landscape/2026-digital-defense-report). Outubro de 2026. Período: julho de 2025 a junho de 2026.
- Verizon. [2026 Data Breach Investigations Report: Executive Summary](https://www.verizon.com/business/resources/executivebriefs/2026-dbir-executive-summary.pdf). 2026. Dados de outubro de 2024 a novembro de 2025.
- Google Threat Intelligence Group. [GTIG AI Threat Tracker: From Prompting to Autonomy](https://cloud.google.com/blog/topics/threat-intelligence/from-prompting-to-autonomy-the-evolution-of-adversarial-ai). 8 de setembro de 2026.
- OpenAI. [Disrupting malicious uses of AI](https://cdn.openai.com/pdf/df438d70-e3fe-4a6c-a403-ff632def8f79/disrupting-malicious-uses-of-ai.pdf). 25 de fevereiro de 2026.
- Anthropic. [Detecting and countering misuse of AI: August 2025](https://www.anthropic.com/news/detecting-countering-misuse-aug-2025). Agosto de 2025.
- CNN. [British engineering giant Arup revealed as $25 million deepfake scam victim](https://edition.cnn.com/2024/05/16/tech/arup-deepfake-scam-loss-hong-kong-intl-hnk/index.html). Maio de 2024.
- SBT News. [Polícia do RS mira quadrilha que usava deepfake de Gisele Bündchen para aplicar golpes](https://sbtnews.sbt.com.br/noticia/policia/policia-do-rs-mira-quadrilha-que-usava-deepfake-de-gisele-buendchen-para-aplicar-golpes). 1º de outubro de 2025.
- Banco Central do Brasil. [Segurança no Pix](https://www.bcb.gov.br/estabilidadefinanceira/pix-seguranca).
