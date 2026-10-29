---
title: "Mandados falsos no BNMP e a responsabilidade de quem desenvolve"
description: "Três casos públicos de mandados e alvarás adulterados no BNMP, o que eles têm em comum e as decisões de engenharia que protegem sistemas capazes de afetar a liberdade."
pubDate: 2026-10-29T17:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/bnmp-mandados-falsos-sistemas-criticos.webp"
coverAlt: "Ilustração de uma porta com fechadura, uma chave e um livro de registros em que uma das linhas está destacada em amarelo"
category: "Segurança"
tags:
  - "Segurança da Informação"
  - "Sistemas Críticos"
  - "Auditoria"
  - "Setor Público"
  - "Engenharia de Software"
draft: false
lang: "pt-BR"
---

Na quarta-feira, 4 de janeiro de 2023, apareceu no Banco Nacional de Monitoramento de Prisões, o BNMP, um mandado de prisão contra o ministro Alexandre de Moraes, do Supremo Tribunal Federal. O documento parecia assinado pelo próprio Moraes. O Conselho Nacional de Justiça, que mantém o sistema, restringiu o acesso, acionou a Polícia Federal e informou que o problema havia sido causado pelo **uso indevido de uma credencial de acesso**, já bloqueada.

O episódio ficou conhecido pelo absurdo: um juiz mandando prender a si mesmo. Mas o que deveria preocupar quem desenvolve software é outra coisa. Por um período, um registro falso esteve em um banco de dados que policiais de todo o país consultam para decidir se alguém deve ser preso.

Neste artigo reúno os casos públicos envolvendo o BNMP, separo o que foi confirmado do que ainda está em apuração e discuto o que eles ensinam sobre construir sistemas cujos dados podem tirar a liberdade de uma pessoa. Não há aqui nada sobre como explorar o sistema: o foco é entender os casos, os impactos e a prevenção.

## O que é o BNMP e por que ele importa

O BNMP é o sistema nacional, mantido e gerido pelo CNJ, em que o Judiciário registra mandados de prisão, alvarás de soltura e outras medidas penais. A versão atual, chamada de **BNMP 3.0** e rebatizada como Banco Nacional de Medidas Penais e Prisões, foi instituída pela Resolução CNJ nº 417, de 20 de setembro de 2021. O acesso usa as credenciais da plataforma digital do Judiciário (PDPJ-Br), e páginas de tribunais que orientam seus usuários descrevem o login por token ou por CPF e senha.

Para entender o peso desse sistema, basta pensar em quem consome os dados. Um policial que aborda alguém pode consultar se há mandado aberto contra aquela pessoa. Uma unidade prisional confere se a ordem de soltura que recebeu é legítima. Um registro falso pode, no primeiro caso, levar à prisão de quem não deveria ser preso. No segundo, pode soltar quem deveria continuar preso. Em sistemas assim, **integridade dos dados** não é um requisito técnico entre outros. É a função do sistema.

## Os casos documentados

Encontrei três episódios distintos em fontes públicas, entre 2023 e 2026. Eles são frequentemente misturados em redes sociais, por isso vale separar:

| Data | O que aconteceu | O que foi confirmado | Situação |
| :--- | :--- | :--- | :--- |
| 4 de janeiro de 2023 | Mandado de prisão falso contra Alexandre de Moraes inserido no BNMP | O CNJ atribuiu o caso ao uso indevido de uma credencial; o hacker Walter Delgatti confessou à PF ter feito a inserção | Condenação pela Primeira Turma do STF em maio de 2025; recurso negado em junho de 2025 |
| Dezembro de 2025 | Quatro presos deixaram o sistema prisional de Belo Horizonte com alvarás de soltura falsificados | Segundo os investigadores, citados pela imprensa, o grupo usou credenciais ligadas a magistrados e servidores do TJMG para acessar sistemas do CNJ, entre eles o BNMP | Investigação em andamento; o TJMG informou ter cancelado as ordens irregulares em menos de 24 horas |
| 20 a 22 de janeiro de 2026 | Dados de um mandado foram substituídos por dados de autoridades, entre elas o presidente Lula e Alexandre de Moraes | O CNJ afirmou que as credenciais usadas pertenciam a usuários de tribunais e foram roubadas, que não houve invasão dos seus sistemas e que nenhum mandado chegou a ser expedido contra as autoridades | Operação da Polícia Civil de Goiás em 5 de fevereiro de 2026; investigação em andamento |

### Janeiro de 2023: o mandado contra Moraes

A investigação da Polícia Federal levou a Walter Delgatti Neto, o hacker conhecido pelo caso Vaza Jato, e à deputada federal Carla Zambelli. Segundo a acusação, Zambelli foi a autora intelectual e procurou Delgatti para executar o crime. Em maio de 2025, a Primeira Turma do STF condenou os dois por invasão de dispositivo informático e falsidade ideológica: 10 anos de prisão e perda do mandato para Zambelli, 8 anos e 3 meses para Delgatti, e indenização solidária de R$ 2 milhões. Em 6 de junho de 2025, a Turma negou, por unanimidade, os recursos. Zambelli nega envolvimento e afirma que o hacker agiu sozinho. Delgatti admite os crimes.

Um detalhe técnico importa: o tipo penal é "invasão de dispositivo informático", mas a explicação do CNJ na época falava em **uso indevido de credencial**. As duas coisas não se contradizem. Para o direito, acessar um sistema com a credencial de outra pessoa, sem autorização, pode configurar invasão. Para a engenharia, a distinção muda tudo: não foi uma falha no código que deixou alguém entrar, foi uma chave legítima nas mãos erradas.

### Dezembro de 2025: alvarás falsos em Minas Gerais

Segundo reportagem do Metrópoles de 23 de dezembro de 2025, quatro detentos deixaram o sistema prisional em Belo Horizonte apresentando alvarás de soltura falsificados. Um foi recapturado no mesmo dia. Os investigadores afirmam que o grupo, coordenado por um hacker que já estava preso, alterou mandados e alvarás usando credenciais vinculadas a magistrados e servidores do TJMG, com acesso ao BNMP e a outros sistemas do CNJ. O tribunal declarou que todas as ordens irregulares foram identificadas e canceladas em menos de 24 horas.

### Janeiro de 2026: dados de autoridades em um mandado

Em nota divulgada em 22 de janeiro de 2026, o CNJ informou que dados de um mandado judicial foram substituídos por dados associados a autoridades, incluindo Lula e Moraes, a partir de credenciais de usuários de tribunais obtidas por roubo. A nota diz que não houve invasão, violação ou comprometimento dos sistemas do CNJ, que a alteração não resultou na expedição de mandados contra as autoridades e que os dados foram corrigidos. Em 5 de fevereiro, a Polícia Civil de Goiás deflagrou uma operação sobre o caso, com apoio de núcleos de inteligência e de polícias de outros estados.

### O que não é BNMP

Para não misturar assuntos: em novembro de 2020, o Superior Tribunal de Justiça teve sua rede atingida por um ataque que criptografou sistemas e paralisou o tribunal por cerca de duas semanas. É um incidente grave, mas de outra natureza (disponibilidade de sistemas inteiros) e em outro órgão. Os casos acima tratam de **integridade de registros** em um sistema específico.

## O padrão: a chave certa na mão errada

Pelo que foi divulgado, nos três casos do BNMP o vetor descrito foi o mesmo: credenciais de pessoas autorizadas, usadas por quem não tinha autorização. É útil separar quatro situações que a imprensa costuma chamar, todas, de "invasão":

1. **Explorar uma vulnerabilidade:** entrar por uma falha no software, sem credencial válida.
2. **Usar credenciais obtidas indevidamente:** senha roubada por phishing, malware, vazamento ou reutilização em outro serviço.
3. **Abusar de uma permissão legítima:** alguém com acesso real usa esse acesso para fazer o que não deveria.
4. **Explorar uma falha de processo:** o software funciona, mas o procedimento em volta dele não confere o que deveria conferir.

Cada uma pede defesas diferentes. E a segunda tem uma característica cruel: do ponto de vista do sistema, quem entrou **é** o usuário autorizado. A senha está correta, o login é válido, a permissão existe.

## Uma analogia: porta, chave, crachá e livro de registro

Imagine o arquivo de um fórum onde ficam as ordens de prisão.

- **A porta trancada é a autenticação.** Ela decide se alguém pode entrar. Uma porta resistente impede quem tenta forçar a entrada, mas não distingue o dono da chave de quem a roubou.
- **A chave é a credencial.** Se ela é só uma senha, pode ser copiada sem que o dono perceba. Se exige algo que a pessoa tem fisicamente (um token de hardware, uma chave de segurança vinculada ao dispositivo), copiar fica muito mais difícil.
- **O crachá é a autorização.** Estar dentro do prédio não deveria dar acesso a todas as salas. Um servidor que cadastra dados não precisa poder assinar decisões, e um usuário de uma comarca não precisa alterar registros de outra.
- **A regra das duas pessoas é a segregação de funções.** Em cofres, certas operações exigem duas pessoas diferentes. Em sistemas, ações de alto impacto podem exigir a confirmação de um segundo usuário.
- **O livro de registro é a trilha de auditoria.** Ele não impede ninguém de entrar, mas permite saber quem entrou, quando, de onde e o que mudou. Só tem valor se não puder ser apagado por quem escreve nele.
- **O porteiro atento é o monitoramento.** Ele estranha quando alguém que sempre chega às 9h, por uma entrada, aparece às 3h da manhã por outra.

A lição da analogia: **uma chave roubada abre a porta sem forçá-la**. Por isso a defesa não pode depender só da porta. Ela precisa de chaves difíceis de copiar, salas separadas, um livro que ninguém apaga e alguém olhando o livro.

## O que a engenharia pode fazer

<figure>
  <img src="/images/blog/bnmp-mandados-falsos-sistemas-criticos-diagrama.webp" alt="Quatro cartões lado a lado: Prevenir (MFA resistente a phishing, menor privilégio, dupla aprovação), Detectar (alertas de comportamento anômalo, dispositivo ou rede desconhecidos, revisão de acessos), Investigar (trilha só de inserção, antes e depois de cada alteração, hash encadeado ancorado fora do banco) e Responder (revogar credenciais, corrigir dados com rastreabilidade, avisar quem consome o dado)." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>As quatro camadas de defesa e a analogia de cada uma. Diagrama do autor.</figcaption>
</figure>

### Prevenir

- **Autenticação multifator resistente a phishing.** Códigos por SMS ou aplicativo ajudam, mas podem ser capturados em páginas falsas. Métodos baseados em chaves criptográficas vinculadas ao site e ao dispositivo, como FIDO2/WebAuthn, são desenhados para resistir a isso. A publicação SP 800-63B do NIST trata dos níveis de garantia de autenticação e é uma boa referência para escolher.
- **Menor privilégio.** Cada perfil acessa apenas o necessário para sua função, com escopo por unidade judiciária quando fizer sentido.
- **Segregação de funções e dupla aprovação** para operações de alto impacto, como emitir alvarás de soltura ou alterar dados de um mandado já expedido.
- **Assinatura e verificação no ponto de uso.** Se cada documento é assinado digitalmente por quem tem competência para emiti-lo, quem consome o registro (a polícia, a unidade prisional) pode verificar a assinatura em vez de confiar no papel ou na tela.
- **Contexto de acesso.** Sessões curtas, reautenticação para ações sensíveis e alertas para dispositivos ou redes desconhecidas.

### Detectar

- **Alertas de comportamento anômalo:** login de dispositivo novo seguido de ação sensível, volume incomum de alterações, acesso fora do padrão de horário ou de unidade, alteração de registros já cumpridos.
- **Revisão periódica de acessos.** Servidores mudam de função, se aposentam, saem do órgão. Credenciais que ninguém revisa viram portas esquecidas.

### Investigar

Uma boa trilha de auditoria responde, para cada mudança: **quem** fez, **o quê**, **quando**, **de onde**, **qual era o valor antes e qual ficou depois**. E precisa resistir à adulteração.

Um exemplo simplificado em PostgreSQL de uma tabela de auditoria em que a aplicação só pode inserir, e cada registro guarda um hash encadeado ao anterior. Testei este código em um PostgreSQL 17 local, inclusive com inserções concorrentes. É uma demonstração do princípio, não uma descrição de como o BNMP funciona internamente.

```sql
CREATE TABLE audit_log (
  id          bigserial   PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_id    text        NOT NULL,
  actor_ip    inet,
  action      text        NOT NULL,
  entity      text        NOT NULL,
  entity_id   text        NOT NULL,
  before      jsonb,
  after       jsonb,
  prev_hash   bytea,
  hash        bytea       NOT NULL
);

CREATE OR REPLACE FUNCTION audit_chain() RETURNS trigger AS $$
BEGIN
  -- Serializa as inserções para que duas transações não usem o mesmo elo anterior.
  PERFORM pg_advisory_xact_lock(hashtext('audit_log'));
  -- O id é atribuído depois do lock, para que a ordem dos ids siga a ordem da cadeia.
  NEW.id := nextval('audit_log_id_seq');
  SELECT hash INTO NEW.prev_hash FROM audit_log ORDER BY id DESC LIMIT 1;
  NEW.hash := sha256(
    coalesce(NEW.prev_hash, ''::bytea) ||
    convert_to(concat_ws('|',
      to_char(NEW.occurred_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'),
      NEW.actor_id, NEW.actor_ip, NEW.action, NEW.entity, NEW.entity_id,
      NEW.before, NEW.after), 'UTF8')
  );
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER audit_chain BEFORE INSERT ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_chain();

-- A aplicação pode inserir e ler, nunca alterar ou apagar.
GRANT INSERT, SELECT ON audit_log TO app_user;
GRANT USAGE ON SEQUENCE audit_log_id_seq TO app_user;
```

Para verificar a integridade, recalcula-se cada hash a partir do anterior:

```sql
SELECT id,
       hash = sha256(
         coalesce(lag(hash) OVER (ORDER BY id), ''::bytea) ||
         convert_to(concat_ws('|',
           to_char(occurred_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'),
           actor_id, actor_ip, action, entity, entity_id, before, after), 'UTF8')
       ) AS elo_valido
  FROM audit_log
 ORDER BY id;
```

No teste, o usuário da aplicação recebeu `permission denied` ao tentar apagar um registro. E, quando um superusuário alterou o conteúdo de uma linha diretamente, a verificação passou a acusar o elo daquela linha como inválido.

Três limites dessa técnica, para não vender mais do que ela entrega:

- **Ela detecta, não impede.** Quem tem acesso de administrador ao banco pode alterar dados e, com esforço, recalcular a cadeia inteira. Por isso o hash mais recente precisa ser copiado periodicamente para um lugar fora do controle de quem administra o banco (outro sistema, outro órgão, um serviço de registro de tempo).
- **O canônico importa.** Os dados que entram no hash precisam ter uma representação estável. Por isso o horário é convertido explicitamente para UTC: sem isso, o mesmo registro produziria textos diferentes em sessões com fusos diferentes.
- **Ela registra o que a aplicação informa.** Se a credencial roubada é usada pela própria aplicação, o log vai registrar fielmente o usuário errado. A trilha precisa vir acompanhada de contexto (IP, dispositivo, sessão) e de monitoramento.

### Responder

- revogar credenciais e sessões comprometidas imediatamente;
- corrigir os dados com rastreabilidade, sem apagar o histórico do que foi alterado;
- avisar quem consome o dado, porque um registro falso pode já ter sido usado;
- comunicar o incidente nos termos da lei: a LGPD, no artigo 48, exige comunicar à ANPD e aos titulares incidentes de segurança que possam acarretar risco ou dano relevante.

## De quem é a responsabilidade?

Incidentes como esses raramente têm um único culpado técnico. A responsabilidade se distribui:

- **Desenvolvedores** decidem se a auditoria é um requisito desde o primeiro dia ou um log de texto adicionado depois. Decidem se operações críticas exigem confirmação, se mensagens de erro vazam informação, se dados sensíveis aparecem em logs.
- **Arquitetos** decidem onde ficam as fronteiras de confiança: o que um perfil pode fazer, como a assinatura é verificada no consumo, como os logs são protegidos de quem administra o sistema.
- **Equipes de segurança** operam o monitoramento, a resposta a incidentes e a revisão de acessos. No Judiciário, a Resolução CNJ nº 396/2021 instituiu uma Estratégia Nacional de Segurança Cibernética para os órgãos do Poder Judiciário.
- **Fornecedores** respondem pela qualidade do que entregam e pela transparência sobre vulnerabilidades e dependências.
- **Gestores públicos** decidem orçamento, prioridades, treinamento e exigências de autenticação para milhares de usuários espalhados por tribunais diferentes. Exigir multifator forte de todos os usuários de um sistema nacional é, antes de tudo, uma decisão de gestão.

Na minha opinião, o erro mais comum é tratar segurança como um item da lista de requisitos não funcionais, ao lado de "a página deve carregar rápido". Em sistemas como o BNMP, ela é a definição do que significa o sistema funcionar.

## Mais do que uma tela que não funciona

Quando um e-commerce falha, alguém não consegue comprar. Quando um sistema de registro penal falha, alguém pode ser preso sem motivo, ou solto sem direito. A diferença não está na tecnologia, que pode ser a mesma, mas nas consequências de um dado errado.

Para quem desenvolve, a pergunta útil não é "esse sistema é seguro?", porque nenhum é absolutamente. É: **se uma credencial legítima for parar nas mãos erradas amanhã, quanto dano ela consegue causar, quão rápido vamos perceber e quão bem conseguiremos reconstruir o que aconteceu?** Responder bem a essas três perguntas é o que separa um incidente contido de um registro falso circulando por dias.

## Referências

Este artigo é um estudo baseado nas fontes abaixo, mais o teste local descrito no exemplo de auditoria. Trechos marcados como opinião refletem a minha leitura. Os casos de 2025 e 2026 seguem em investigação, e os fatos estão descritos conforme divulgados por autoridades e veículos de imprensa até outubro de 2026.

- IstoÉ Dinheiro. [CNJ aciona PF por falsa ordem de prisão de Moraes contra ele mesmo](https://istoedinheiro.com.br/cnj-aciona-pf-por-falsa-ordem-de-prisao-de-moraes-contra-ele-mesmo) (5 de janeiro de 2023).
- Poder360. [STF condena Zambelli a 10 anos de prisão por unanimidade](https://www.poder360.com.br/poder-justica/stf-condena-zambelli-a-10-anos-de-prisao-por-unanimidade/) (maio de 2025).
- O Povo. [Por unanimidade, STF nega recurso e mantém condenação de Zambelli](https://www.opovo.com.br/noticias/politica/2025/06/06/por-unanimidade-stf-nega-recurso-e-mantem-condenacao-de-zambelli.html) (6 de junho de 2025).
- Metrópoles. [MG: detentos fogem de presídio com alvarás de soltura falsificados](https://www.metropoles.com/brasil/mg-detentos-fogem-de-presidio-com-alvaras-de-soltura-falsificados) (23 de dezembro de 2025).
- Migalhas. [CNJ sofre tentativa de expedição de mandado de prisão a Lula e Moraes](https://www.migalhas.com.br/quentes/448460/cnj-sofre-tentativa-de-expedicao-de-mandado-de-prisao-a-lula-e-moraes) (23 de janeiro de 2026), com a íntegra da nota do CNJ.
- Congresso em Foco. [Operação mira fraude contra falso mandado de prisão de Lula e Moraes](https://www.congressoemfoco.com.br/noticia/116140/operacao-mira-fraude-contra-falso-mandado-de-prisao-de-lula-e-moraes) (5 de fevereiro de 2026).
- Conselho Nacional de Justiça. [BNMP 3.0](https://www.cnj.jus.br/sistema-carcerario/bnmp-3-0/) e Resolução CNJ nº 417/2021.
- Conselho Nacional de Justiça. [Resolução nº 396/2021: Estratégia Nacional de Segurança Cibernética do Poder Judiciário](https://atos.cnj.jus.br/atos/detalhar/3975).
- Migalhas. [Hacker invade STJ, sequestra dados e cobra resgate](https://www.migalhas.com.br/quentes/335987/hacker-invade-stj-sequestra-dados-e-cobra-resgate) (novembro de 2020).
- NIST. [SP 800-63B: Digital Identity Guidelines, Authentication and Lifecycle Management](https://pages.nist.gov/800-63-4/sp800-63b.html).
- Presidência da República. [Lei nº 13.709/2018 (LGPD)](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm).
