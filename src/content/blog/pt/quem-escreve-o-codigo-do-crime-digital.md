---
title: "Quem escreve o código do crime digital? A divisão de trabalho por trás das fraudes online"
description: "Empresas de fachada, salários em bitcoin e profissionais de segurança condenados: o que investigações oficiais mostram sobre o trabalho técnico no cibercrime."
pubDate: 2026-10-30T12:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/quem-escreve-o-codigo-do-crime-digital.webp"
coverAlt: "Ilustração de um anúncio de vaga de desenvolvedor com requisitos comuns, em que a linha sobre o cliente final está em branco e destacada em amarelo, com o rótulo Série Mercado Clandestino 04"
category: "Segurança"
tags:
  - "Série Mercado Clandestino"
  - "Cibercrime"
  - "Carreira"
  - "Ética"
  - "Engenharia de Software"
draft: false
lang: "pt-BR"
---

A empresa parecia normal: cibersegurança, serviços de teste de invasão, site próprio e uma lista de clientes. Um administrador de sistemas entrou por esse caminho. Segundo o [Departamento de Justiça dos EUA](https://www.justice.gov/usao-wdwa/pr/high-level-organizer-notorious-hacking-group-fin7-sentenced-ten-years-prison-scheme), ele admitiu em acordo judicial que logo percebeu que a empresa, a Combi Security, não era legítima. Ela não tinha clientes reais, e [os nomes no site incluíam vítimas do próprio grupo](https://www.justice.gov/archives/opa/pr/three-members-notorious-international-cybercrime-group-fin7-custody-role-attacking-over-100). O negócio de verdade era o FIN7, responsável pelo roubo de dezenas de milhões de cartões. Ele ficou, tornou-se um dos gerentes do grupo e, em 2021, foi condenado a dez anos de prisão.

Essa história concentra as perguntas deste quarto texto da série *O mercado clandestino do software*. Quem são as pessoas que escrevem e mantêm esses sistemas? Como chegaram lá? O que mudou no momento em que aquele profissional entendeu onde estava?

Um aviso sobre o método. Este texto se baseia em investigações oficiais, relatórios técnicos e pesquisa acadêmica. Não generaliza sobre nacionalidade, formação ou perfil social, porque as fontes não sustentam um "perfil do criminoso digital". Nas palavras do [IOCTA 2025](https://www.europol.europa.eu/cms/sites/default/files/documents/Steal-deal-repeat-IOCTA_2025.pdf) da Europol, a variedade de métodos torna difícil criar perfis nítidos. Por isso também omito os nomes das pessoas, e não cito comunidades, canais ou formas de contato.

## Um organograma que você reconheceria

O retrato interno mais detalhado que temos veio de um vazamento. Em 2022, mensagens internas do grupo Conti foram publicadas, e a [Check Point Research](https://research.checkpoint.com/2022/leaks-of-conti-ransomware-group-paint-picture-of-a-surprisingly-normal-tech-start-up-sort-of/) descreveu ali uma hierarquia quase clássica, com líderes de equipe que respondiam à gerência.

| Função no Conti | O que fazia | Equivalente no mercado legítimo |
| :--- | :--- | :--- |
| Recursos humanos | Encontrava candidatos, entrevistava, mediava com gestores técnicos | Recrutamento |
| Programadores | Mantinham o malware, servidores de back-end e painéis | Desenvolvimento |
| Testadores | Verificavam se o malware era detectado | QA |
| Ofuscadores de código | Dificultavam a análise dos binários | Engenharia de build |
| Administradores de sistemas | Montavam painéis, servidores, proxies e domínios | SRE/DevOps |
| Engenharia reversa | Estudava ferramentas existentes | Pesquisa e desenvolvimento |
| Equipe ofensiva | Avançava dentro das redes das vítimas | Sem equivalente legítimo fora de testes autorizados |
| OSINT e negociação | Pesquisava vítimas e negociava resgates | Vendas e atendimento |

Havia salário em bitcoin, comissão para negociadores e bônus de funcionário do mês, pago com multas de outros empregados. Nos arquivos de sanções do [Tesouro americano](https://home.treasury.gov/news/press-releases/jy1714) sobre o Trickbot aparecem administradores, gerentes, programadores, líderes de equipe e até responsáveis por recursos humanos e finanças. No [Tycoon 2FA](https://blogs.microsoft.com/on-the-issues/2026/03/04/how-a-global-coalition-disrupted-tycoon/), a Microsoft descreve um desenvolvedor principal com parceiros para marketing, pagamentos e suporte técnico.

Esses são casos individuais, e a estrutura varia muito. O próprio [IOCTA 2026](https://www.europol.europa.eu/cms/sites/default/files/documents/IOCTA-2026.pdf) separa programas abertos a quase qualquer pessoa de grupos fechados, que trabalham juntos há anos. Mas o padrão é suficiente para desfazer uma imagem. Boa parte desse trabalho se parece com um emprego.

## O trabalho entediante que mantém tudo de pé

O artigo [*Cybercrime is (often) boring*](https://www.cl.cam.ac.uk/~bjc63/Crime_is_boring.pdf), de pesquisadores de Cambridge e Strathclyde, é uma das melhores leituras sobre o assunto. Com entrevistas e dados de fóruns, os autores argumentam que manter serviços de hospedagem, botnets ou ataques de negação de serviço é trabalho tedioso e **pouco diferente da atividade de um administrador de sistemas legítimo**, muitas vezes terceirizado a pessoas mal pagas. Esse tédio, concluem, leva a esgotamento e abandono de serviços.

É um contraponto útil ao mito do gênio solitário, com uma ressalva: o estudo se apoia em três tipos de serviço e em comunidades específicas. Ele não descreve todo o ecossistema.

## Como as pessoas entram

As fontes mostram caminhos diferentes, e misturá-los produz conclusões erradas.

**Anúncios de emprego.** A Kaspersky, empresa de segurança, [analisou cerca de 200 mil anúncios](https://www.kaspersky.com/about/press-releases/developers-attackers-and-designers-topped-the-list-of-the-most-demanded-it-professionals-on-the-darknet) de emprego em 155 fóruns da dark web entre janeiro de 2020 e junho de 2022 e encontrou desenvolvedores como o perfil mais procurado. As medianas salariais iam de US$ 1.300 a US$ 4.000 por mês. A amostra de salários foi pequena, e anúncios criminosos não são garantia de pagamento real. Vale como retrato do que se anuncia, não do que se ganha.

**Recrutamento em plataformas comuns.** A Check Point relata que o Conti buscava candidatos em sites de emprego e bases de currículos, além de indicações com bônus. Ou seja, parte do recrutamento acontecia fora de qualquer submundo.

**Empresas de fachada.** A Combi Security não foi caso único. Em 2021, a [Gemini Advisory](https://www.recordedfuture.com/blog/fin7-ransomware-bastion-secure), da Recorded Future, relatou com alta confiança que o FIN7 operava outra falsa empresa de segurança, a Bastion Secure, para atrair especialistas em TI sem que soubessem do que se tratava. As tarefas passadas a uma fonte da empresa de pesquisa coincidiam com a preparação de um ataque de ransomware. A análise observa que o grupo podia pagar a esses "funcionários" muito menos do que a cúmplices informados.

**Abordagem direta a quem já tem acesso.** Este é o caso brasileiro mais conhecido. Em julho de 2025, a Polícia Civil de São Paulo prendeu um operador de TI da C&M Software, empresa que conecta instituições financeiras ao Pix, por suspeita de facilitar o desvio de [cerca de R$ 541 milhões](https://www.cnnbrasil.com.br/nacional/sudeste/sp/ataque-hacker-desviou-r-541-milhoes-em-massa-diz-policia/) da BMP. Segundo o [depoimento relatado pela imprensa](https://sbtnews.sbt.com.br/noticia/policia/ataque-hacker-a-bancos-funcionario-recebeu-r-15-mil-para-entregar-senha-e-executar-comandos), ele disse ter sido abordado ao sair de um bar e ter recebido R$ 15 mil para entregar credenciais e executar comandos. Não localizei informação sobre sentença, e [uma reportagem](https://www.xataka.com.br/informatica/ex-funcionario-da-c-m-software-preso-ataque-hacker-r-1-bilhao-afirma-ser-inocente) registra que ele se diz inocente, então o caso deve ser tratado como investigação, não como fato provado. O padrão, porém, combina com o que o IOCTA 2025 descreve: compra de credenciais de funcionários e recrutamento de pessoas de dentro.

**Fóruns e comunidades.** O IOCTA 2026 descreve fóruns como porta de entrada, com tutoriais, reputação, recrutamento e triagem de membros. Do lado da prevenção, o programa [Cyber Choices](https://www.cyberchoices.uk/), da NCA britânica, trabalha com jovens para explicar a diferença entre atividades legais e ilegais e direcionar suas habilidades para caminhos legítimos.

## O espectro do conhecimento

A pergunta mais delicada é o que cada pessoa sabia. Os casos mostram uma gradação, que resumo abaixo. **Esta tabela é uma ferramenta de leitura, não uma classificação jurídica.** O enquadramento depende da lei do país, das provas e da intenção, e não faço afirmações sobre situações hipotéticas.

| Situação | Caso público | O que a fonte registra |
| :--- | :--- | :--- |
| Não sabia para o que trabalhava | Conti | A Check Point relata um desenvolvedor informado de que o back-end era de um sistema de análise de anúncios |
| Descobriu e continuou | FIN7/Combi Security | Admitiu ter percebido rapidamente que a empresa era criminosa. Foi condenado |
| Descobriu e recebeu incentivo para ficar | Conti | Segundo a Check Point, o grupo oferecia aumento a desenvolvedores que entendiam o que estavam construindo |
| Prestação de serviço recorrente | LockBit | A acusação descreve um suposto desenvolvedor pago mensalmente, que admitiu às autoridades trabalho de código e consultoria |
| Acesso legítimo vendido ou cedido | C&M Software | Suspeita, segundo a polícia, ainda sem condenação que eu tenha localizado |
| Execução direta | ALPHV/BlackCat | Profissionais que se declararam culpados de usar o ransomware contra vítimas |

A passagem entre as linhas é o ponto central. No Brasil, o [artigo 29 do Código Penal](https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm) diz que quem concorre para o crime responde "na medida de sua culpabilidade". O artigo 154-A, § 1º, alcança quem produz, oferece ou vende programa "com o intuito de permitir" a invasão. A palavra "intuito" indica que a intenção importa, e a prova dessa intenção é discutida caso a caso. Para uma orientação sobre uma situação concreta, o caminho é um advogado criminalista, não um artigo de blog.

Minha opinião, e aqui é só opinião: a pergunta profissional mais útil não é "isso é crime?", e sim "o que eu estou deliberadamente evitando saber?".

## Quando o profissional é da própria segurança

O caso que mais incomoda quem trabalha na área é o do ALPHV/BlackCat. Em 2023, três profissionais da indústria de cibersegurança usaram a plataforma contra vítimas nos Estados Unidos e concordaram em repassar 20% dos resgates aos administradores, segundo o [Departamento de Justiça](https://www.justice.gov/opa/pr/two-americans-who-attacked-multiple-us-victims-using-alphv-blackcat-ransomware-sentenced). A acusação ressalta que eles tinham habilidades e experiência justamente em proteger sistemas contra o tipo de dano que causaram. Dois foram condenados a quatro anos de prisão em abril de 2026, e a [imprensa especializada](https://therecord.media/ransomware-cyber-incident-responders) os identifica como um profissional de resposta a incidentes e um negociador de ransomware.

O caso desmonta duas ideias de uma vez. A primeira é a de que o risco está só "fora", em algum lugar distante. A segunda é a de que formação ética e credenciais profissionais vacinam alguém. As competências de um defensor e as de um atacante são muito próximas, e a diferença está em autorização e propósito.

## Quais competências legítimas podem ser desviadas

A lista é quase um currículo comum. Desenvolvimento web e de painéis, integração de APIs de pagamento e mensagens, automação, administração de servidores, design de interfaces. Na Kaspersky, designers apareceram como o terceiro perfil mais procurado, atrás de desenvolvedores e atacantes. Faz sentido: uma página falsa precisa parecer real.

Nenhuma dessas habilidades é suspeita em si. O que pode transformar um trabalho comum em colaboração é **o contexto em que a entrega será usada**.

## Como as investigações ligaram pessoas aos papéis

Quem imagina que uma função "de bastidor" é invisível deveria ler os documentos.

- **Credenciais e repositórios.** Segundo a [acusação no caso LockBit](https://www.justice.gov/usao-nj/pr/dual-russian-and-israeli-national-extradited-united-states-his-role-lockbit-ransomware), investigadores encontraram no computador do suspeito credenciais de administrador de um repositório com o código-fonte do construtor do malware.
- **Conversas de trabalho.** A mesma acusação cita mensagens com o administrador do grupo sobre o construtor e o painel de controle.
- **Pagamentos.** Foram cerca de US$ 10 mil mensais, mais de US$ 230 mil no total, enviados por serviços de mistura de criptomoedas para uma carteira atribuída a ele.
- **Depoimento.** O suspeito teria admitido a autoridades israelenses o trabalho de código e os pagamentos.
- **Dados de servidor e dispositivos.** No LabHost, foi o que ligou o criador aos crimes, segundo o [Crown Prosecution Service](https://www.cps.gov.uk/node/26240).
- **Dados da própria plataforma.** No LockBit, os registros permitiram à [NCA](https://www.nationalcrimeagency.gov.uk/news/lockbit-leader-unmasked-and-sanctioned) separar afiliados por atividade.

No caso LockBit, são alegações da acusação. Ainda assim, o conjunto mostra um padrão: a rotina de trabalho produz evidência. Commits, tarefas, mensagens e pagamentos existem porque o trabalho existe.

<figure>
  <img src="/images/blog/quem-escreve-o-codigo-do-crime-digital-diagrama.webp" alt="Diagrama de um funil de avaliação de proposta em quatro perguntas: quem é o cliente, é possível verificá-lo de forma independente; o que o sistema faz e quem será afetado; existe autorização por escrito do dono do ambiente; como o dinheiro chega. Respostas claras levam a seguir com contrato. Respostas evasivas levam a parar, registrar e buscar orientação jurídica." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Quatro perguntas para avaliar uma proposta antes de aceitar. Recomendação do autor, baseada nos casos citados, sem valor de orientação jurídica.</figcaption>
</figure>

## Sinais de contexto em uma proposta

Nenhum sinal abaixo prova nada, e propostas legítimas podem ter um ou outro, principalmente em empresas pequenas. A lista é uma recomendação minha. O que conta é a combinação, e principalmente a reação quando você pergunta.

- **O cliente final não pode ser conhecido.** Sigilo comercial existe, mas costuma vir com uma empresa identificável e contrato.
- **O produto copia uma marca que não pertence ao cliente.** Clonar a tela de login de um banco ou órgão público para um "projeto", sem autorização da instituição, é o sinal mais forte da lista.
- **Pedem que o sistema capture dados além do necessário**, como senhas, códigos de verificação, documentos ou dados de cartão, sem explicação compatível com a função do sistema.
- **O teste de invasão não tem autorização escrita.** Em um pentest real, há escopo definido e autorização de quem é dono do ambiente. Foi esse disfarce que o FIN7 usou.
- **A empresa existe só na superfície.** Site bonito, sem registro verificável, sem clientes que confirmem a relação por canal independente. A Combi listava vítimas como clientes.
- **O pagamento evita rastros**, com pedidos para receber só em criptomoeda, por contas de terceiros ou sem nota, quando o contrato não tem razão para isso.
- **As tarefas evoluem na direção errada.** Começa como manutenção e passa a incluir contornar antivírus, remover logs ou esconder origem de tráfego.
- **Ofertas para quem tem acesso privilegiado.** Pagamento por credenciais, por executar um comando ou por "só olhar" o sistema do seu empregador não tem interpretação inocente plausível.

## Como avaliar um cliente antes de assinar

Um roteiro prático, que vale também para consultores e freelancers:

1. **Confirme a existência da empresa.** Consulte o CNPJ ou registro equivalente, veja quem responde por ela e se a atividade declarada faz sentido.
2. **Verifique referências por canal independente.** Procure o cliente citado pelo contato oficial dele, não pelo número que recebeu do contratante.
3. **Pergunte o que o sistema faz e quem será afetado.** Peça para ver o fluxo completo, não só o módulo isolado.
4. **Exija contrato com objeto claro**, com partes identificadas e, em segurança ofensiva, autorização escrita com escopo e período.
5. **Avalie dados e marcas.** Quais dados pessoais serão tratados? Com que base? O cliente é dono das marcas usadas?
6. **Mantenha registros do que foi combinado.** Uma trilha profissional protege você.
7. **Combine um critério de saída.** Decida de antemão o que faria você parar.

## Se você desconfiar depois de começar

O momento mais perigoso é o da descoberta, como mostram os casos. Na minha opinião, o caminho razoável é parar de executar novas tarefas, não apagar nada, guardar contratos e mensagens e procurar um advogado antes de tomar qualquer outra atitude. Não faça sua própria investigação, não confronte o contratante sozinho e não acesse sistemas além do que já era autorizado. Se você recebeu uma abordagem para vender acesso do seu trabalho, comunique à área de segurança ou jurídica da empresa.

## O que fica

Os casos deste texto não mostram um único tipo de pessoa. Há quem foi enganado, quem descobriu e ficou, quem foi seduzido por um valor pequeno e quem usou conscientemente a própria experiência profissional. A engenharia de software não é neutra nesse sentido. Toda entrega tem um uso, e parte da maturidade de um profissional é fazer perguntas sobre ele.

O [último texto da série](/pt/blog/ia-economia-do-crime-digital) trata da tecnologia que promete mudar essa divisão de trabalho: a inteligência artificial substitui quem escreve esse código ou só acelera o que já existia? Para o panorama econômico, volte ao [primeiro texto](/pt/blog/mercado-negro-do-software).

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura e recomendações minhas não constituem orientação jurídica. Por escolha editorial, o texto não reproduz nomes nem apelidos de pessoas investigadas ou condenadas, que constam das fontes oficiais. Acusações não equivalem a condenações. Fontes consultadas em 30 de outubro de 2026.

- U.S. Department of Justice. [Three Members of Notorious International Cybercrime Group "Fin7" In Custody for Role in Attacking Over 100 U.S. Companies](https://www.justice.gov/archives/opa/pr/three-members-notorious-international-cybercrime-group-fin7-custody-role-attacking-over-100). 1º de agosto de 2018.
- U.S. Attorney's Office, Western District of Washington. [High-level organizer of notorious hacking group FIN7 sentenced to ten years in prison](https://www.justice.gov/usao-wdwa/pr/high-level-organizer-notorious-hacking-group-fin7-sentenced-ten-years-prison-scheme). 2021.
- U.S. Department of Justice. [Two Americans Who Attacked Multiple U.S. Victims Using ALPHV BlackCat Ransomware Sentenced to Prison](https://www.justice.gov/opa/pr/two-americans-who-attacked-multiple-us-victims-using-alphv-blackcat-ransomware-sentenced). 30 de abril de 2026.
- U.S. Attorney's Office, District of New Jersey. [Dual Russian and Israeli National Extradited to the United States for His Role in the LockBit Ransomware Conspiracy](https://www.justice.gov/usao-nj/pr/dual-russian-and-israeli-national-extradited-united-states-his-role-lockbit-ransomware). Março de 2025.
- U.S. Department of the Treasury. [United States and United Kingdom Sanction Additional Members of the Russia-Based Trickbot Cybercrime Gang](https://home.treasury.gov/news/press-releases/jy1714). 7 de setembro de 2023.
- National Crime Agency (Reino Unido). [LockBit leader unmasked and sanctioned](https://www.nationalcrimeagency.gov.uk/news/lockbit-leader-unmasked-and-sanctioned). 7 de maio de 2024.
- National Crime Agency (Reino Unido). [Cyber Choices](https://www.cyberchoices.uk/).
- Crown Prosecution Service (Reino Unido). [Man who created 'one-stop shop for phishing' jailed](https://www.cps.gov.uk/node/26240). 14 de abril de 2025.
- The Record. [Cyber incident responders who carried out ransomware attacks given 4-year sentences](https://therecord.media/ransomware-cyber-incident-responders). 2026.
- Europol. [*IOCTA 2026*](https://www.europol.europa.eu/cms/sites/default/files/documents/IOCTA-2026.pdf). Abril de 2026.
- Europol. *Steal, deal and repeat. IOCTA 2025*. Junho de 2025. [PDF](https://www.europol.europa.eu/cms/sites/default/files/documents/Steal-deal-repeat-IOCTA_2025.pdf).
- Check Point Research. [Leaks of Conti Ransomware Group Paint Picture of a Surprisingly Normal Tech Start-Up… Sort Of](https://research.checkpoint.com/2022/leaks-of-conti-ransomware-group-paint-picture-of-a-surprisingly-normal-tech-start-up-sort-of/). 10 de março de 2022.
- Recorded Future (Gemini Advisory). [FIN7 Recruits Talent for Push into Ransomware](https://www.recordedfuture.com/blog/fin7-ransomware-bastion-secure). Outubro de 2021.
- Microsoft. [Defending the gates: How a global coalition disrupted Tycoon 2FA](https://blogs.microsoft.com/on-the-issues/2026/03/04/how-a-global-coalition-disrupted-tycoon/). 4 de março de 2026.
- Kaspersky. [Developers, attackers and designers topped the list of the most demanded IT professionals on the darknet](https://www.kaspersky.com/about/press-releases/developers-attackers-and-designers-topped-the-list-of-the-most-demanded-it-professionals-on-the-darknet). Janeiro de 2023.
- Collier, B.; Clayton, R.; Hutchings, A.; Thomas, D. R. [Cybercrime is (often) boring: maintaining the infrastructure of cybercrime economies](https://www.cl.cam.ac.uk/~bjc63/Crime_is_boring.pdf). WEIS, 2020.
- CNN Brasil. [Ataque hacker desviou R$ 541 milhões "em massa", diz polícia](https://www.cnnbrasil.com.br/nacional/sudeste/sp/ataque-hacker-desviou-r-541-milhoes-em-massa-diz-policia/). Julho de 2025.
- SBT News. [Ataque hacker a bancos: funcionário recebeu R$ 15 mil para entregar senha e executar comandos](https://sbtnews.sbt.com.br/noticia/policia/ataque-hacker-a-bancos-funcionario-recebeu-r-15-mil-para-entregar-senha-e-executar-comandos). Julho de 2025.
- Xataka Brasil. [Ex-funcionário da C&M Software, preso por ataque hacker de R$ 1 bilhão, afirma ser inocente](https://www.xataka.com.br/informatica/ex-funcionario-da-c-m-software-preso-ataque-hacker-r-1-bilhao-afirma-ser-inocente). 2025.
- Presidência da República. [Decreto-Lei nº 2.848/1940 (Código Penal), texto compilado](https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm), artigos 29 e 154-A.
