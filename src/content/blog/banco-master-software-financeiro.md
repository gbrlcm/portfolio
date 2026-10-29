---
title: "O caso Banco Master visto por quem constrói software financeiro"
description: "Liquidações, FGC, Will Bank e novas regras: o que está documentado no caso Master, o que ainda é hipótese e as lições de engenharia para sistemas financeiros."
pubDate: 2026-10-29T16:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/banco-master-software-financeiro.webp"
coverAlt: "Ilustração de duas colunas de lançamentos contábeis ligadas por linhas de conciliação, com um lançamento sem correspondência destacado em amarelo"
category: "Mercado de Tecnologia"
tags:
  - "Sistemas Financeiros"
  - "Fintechs"
  - "Conciliação"
  - "Arquitetura"
  - "Mercado"
draft: false
---

Em 21 de janeiro de 2026, clientes do Will Bank abriam o aplicativo e encontravam uma situação estranha. O app carregava, mostrava saldo e limite, mas nenhuma transferência era concluída. Na véspera, a Mastercard havia suspendido o uso dos cartões do banco na sua rede, depois de pagamentos não honrados. Naquele dia, o Banco Central decretou a liquidação extrajudicial da Will Financeira.

Para quem desenvolve software, a cena resume uma verdade desconfortável: **o sistema pode estar no ar e a instituição, não**. A interface continuava funcionando. O que tinha parado era a capacidade de liquidar, ou seja, de transformar o número da tela em dinheiro de verdade.

O Will Bank era parte do conglomerado do Banco Master, cujos credores receberam dezenas de bilhões de reais do Fundo Garantidor de Créditos. Neste artigo, separo o que está documentado sobre o caso, o que ainda é alegação ou hipótese e o que ele ensina para quem constrói sistemas financeiros.

## O que aconteceu, em ordem

As datas abaixo vêm de comunicados do Banco Central reproduzidos pela imprensa e de reportagens. Onde uma informação é alegação de investigadores, isso está indicado.

- **28 de março de 2025:** o BRB, banco público controlado pelo Distrito Federal, anuncia a intenção de comprar o Banco Master.
- **3 de setembro de 2025:** o Banco Central rejeita a operação.
- **17 de novembro de 2025:** Daniel Vorcaro, controlador do Master, é preso pela Polícia Federal no aeroporto, quando tentava deixar o país em um jato particular, segundo as reportagens.
- **18 de novembro de 2025:** a PF deflagra a Operação Compliance Zero. No mesmo dia, o Banco Central decreta a liquidação extrajudicial do Banco Master, do Banco Master de Investimento, do Banco Letsbank e da Master Corretora de Câmbio, e coloca o Banco Master Múltiplo sob Regime Especial de Administração Temporária (RAET). A nota do BC cita **grave crise de liquidez** e **graves violações** das normas do sistema financeiro, e informa que o conglomerado detinha 0,57% dos ativos e 0,55% das captações do sistema.
- **21 de janeiro de 2026:** liquidação da Will Financeira (Will Bank).
- **17 de março de 2026:** o RAET do Banco Master Múltiplo é convertido em liquidação extrajudicial.
- **27 de março de 2026:** o BC liquida três instituições do conglomerado Entrepay (uma instituição de pagamento, uma adquirente e uma sociedade de crédito direto). O CEO do grupo é investigado pela PF no âmbito do caso Master, segundo a imprensa. O BC citou comprometimento da situação econômico-financeira e infrações às normas.
- **23 de abril de 2026:** o Conselho Monetário Nacional aprova regras para limitar o uso da garantia do FGC por bancos com captação agressiva e amplia exigências de liquidez para bancos médios.

Além disso, investigadores afirmam que parte das carteiras de crédito vendidas pelo Master ao BRB era falsa. Um relatório citado pelo Senado fala em R$ 16,7 bilhões transferidos pelo BRB ao Master entre julho de 2024 e outubro de 2025, dos quais R$ 12,2 bilhões teriam sido identificados como fraudulentos. O Master afirmou, em nota, que as carteiras foram compradas de terceiros, prática comum no mercado. O ex-presidente do BRB declarou à PF que não há comprovação de que as carteiras eram "podres". Essas versões estão em disputa em investigações ainda em curso.

O caso também ganhou desdobramentos políticos e judiciais amplos, que seguem em apuração e estão fora do escopo deste texto. Até o fim de outubro de 2026, as investigações criminais continuavam em andamento, e a defesa de Vorcaro nega irregularidades.

## O tamanho do impacto

O número mais concreto é o do FGC, o fundo privado, mantido pelas instituições associadas, que garante até R$ 250 mil por CPF ou CNPJ, por instituição ou conglomerado, com teto de R$ 1 milhão a cada quatro anos.

- Em 18 de fevereiro de 2026, segundo a CNN Brasil com dados do fundo, o FGC já havia pago **R$ 37,2 bilhões** a credores do conglomerado Master, cerca de 92% de um total estimado em **R$ 40,6 bilhões**, para aproximadamente **800 mil credores**.
- Para o Will Bank, a estimativa na mesma data era de **R$ 6,3 bilhões**, com pagamentos ainda no início.
- Reportagens posteriores somam um custo estimado acima de R$ 50 bilhões para o FGC quando incluídas outras instituições ligadas ao caso. Os números variam conforme a data e a fonte.

Duas observações para calibrar conclusões:

1. **O Master não é o sistema bancário brasileiro.** O próprio BC informou que o conglomerado tinha 0,57% dos ativos do sistema. O caso diz muito sobre governança, supervisão e incentivos, mas não autoriza afirmar que "os bancos brasileiros" estão em risco.
2. **O FGC funcionou como previsto para o investidor protegido.** Quem tinha até o limite de cobertura recebeu. O debate regulatório que veio depois é sobre quem paga a conta (as instituições associadas) e como evitar que estratégias agressivas transfiram risco para o sistema.

## O que muda nas regras

Segundo a Agência Brasil, o CMN criou em abril de 2026 um indicador chamado **Ativo de Referência**, que mede qualidade, liquidez e diversificação dos ativos de um banco. Instituições que captam muito com garantia do FGC, mas mantêm ativos de maior risco ou difíceis de vender, precisam direcionar parte desses recursos para títulos públicos federais. O objetivo declarado é limitar o uso excessivo da garantia e desestimular estratégias de crescimento agressivo. O pacote também estende a bancos médios a exigência de cobertura de liquidez para 30 dias de estresse (o LCR), com versão simplificada para instituições menores e implantação gradual a partir de 2027. A regulamentação do BC veio em maio de 2026.

Para quem trabalha com tecnologia em bancos médios, isso tem tradução direta: **novos cálculos, novos dados, novos relatórios**. Indicador regulatório não se calcula em planilha manual com segurança. Ele depende de dados de ativos bem classificados, histórico confiável e trilha de como cada número foi obtido.

## O que está comprovado para o mercado de tecnologia, e o que não está

Quando um caso desse tamanho estoura, é comum aparecerem afirmações sobre "demissões em massa no setor", "fintechs sem crédito" ou "contratos cancelados". Procurei evidências para cada uma. O resultado:

**Documentado:**

- **Clientes de uma fintech ficaram sem acesso ao dinheiro.** Com a liquidação, clientes do Will Bank ficaram impossibilitados de movimentar contas, fazer Pix e usar cartões. As estimativas de base de clientes variam na imprensa (entre 10 e 12 milhões).
- **A falha de uma instituição de pagamento afeta quem depende dela.** Com a liquidação da Entrepay, parceiros precisaram buscar alternativas. O Banco do Nordeste, que já havia rompido com a empresa, informou que intensificou o contato com as bandeiras para garantir a restituição de valores.
- **Uma bandeira de cartão teve prejuízo.** A imprensa reportou perdas da Mastercard com o colapso do grupo, embora relativamente pequenas no conjunto.
- **Há trabalho regulatório novo.** As regras do CMN e do BC exigem cálculos e informações adicionais, inclusive de depositários centrais a partir de novembro de 2026.

**Não encontrei comprovação:**

- de demissões em massa no setor de tecnologia causadas pelo caso. Há uma menção, sem números nem data precisa, a demissões no próprio Will Bank;
- de cancelamentos generalizados de contratos com fornecedores de software;
- de retração mensurável de investimento em fintechs atribuível ao Master.

Isso não significa que esses efeitos não existam. Significa que, até onde a informação pública alcança, eles não podem ser afirmados. Qualquer análise que os apresente como fato precisa mostrar a fonte.

## Lições de engenharia

### 1. Saldo na tela não é dinheiro disponível

No Will Bank, o app mostrava saldos que não podiam ser movimentados. Isso não é necessariamente um defeito de software: a instituição estava em liquidação, e congelar operações era o comportamento esperado. Mas a cena mostra que **disponibilidade do sistema** e **capacidade de liquidar** são coisas diferentes, e a interface precisa refletir a segunda.

Em sistemas financeiros, vale projetar desde o início:

- um modo de operação congelada (somente leitura) que possa ser ativado de forma centralizada, sem deploy;
- mensagens claras para o usuário sobre o que está suspenso, por quê e onde buscar informação;
- separação entre saldo contábil, saldo disponível e saldo bloqueado.

### 2. Lastro se verifica na origem, não na planilha

Se a alegação dos investigadores sobre as carteiras se confirmar, o problema central é velho: ativos que existiam em um registro, mas não na realidade. Em uma cessão de crédito, cada contrato vendido deveria ser rastreável até a sua origem: quem tomou o empréstimo, quando, com que autorização, e se as parcelas estão sendo pagas.

A engenharia ajuda quando a verificação é **sistemática e independente**. Um exemplo didático, em SQL, de conciliação entre a carteira recebida e uma fonte independente (o sistema do originador, um registro externo ou o arquivo de repasses do convênio):

```sql
-- Contratos que constam na carteira comprada, mas não têm correspondência
-- na fonte independente, ou que divergem em valor ou situação.
SELECT c.contrato_id, c.valor_presente, c.situacao,
       f.valor_presente AS valor_fonte, f.situacao AS situacao_fonte
  FROM carteira_cedida c
  LEFT JOIN fonte_independente f ON f.contrato_id = c.contrato_id
 WHERE f.contrato_id IS NULL
    OR f.valor_presente <> c.valor_presente
    OR f.situacao <> c.situacao;
```

<figure>
  <img src="/images/blog/banco-master-software-financeiro-diagrama.webp" alt="Fluxo da esquerda para a direita: contrato originado, carteira cedida, conciliação contra uma fonte que o vendedor não controla e pagamento liberado só sem divergências. Da conciliação sai um caminho alternativo, em caso de divergência, para operação bloqueada. Abaixo, a regra do livro-razão de partidas dobradas: toda transação precisa somar zero." width="1600" height="900" loading="lazy" decoding="async" />
  <figcaption>Exemplo conceitual de verificação de lastro antes do pagamento, não uma descrição dos sistemas das instituições envolvidas. Diagrama do autor.</figcaption>
</figure>

A consulta é trivial. O que não é trivial é decidir que ela roda **antes** de cada pagamento, contra uma fonte que o vendedor não controla, e que qualquer divergência bloqueia a operação até ser explicada. É uma decisão de processo, suportada por software.

### 3. Livro-razão imutável e partidas dobradas

Sistemas financeiros sérios não guardam "saldo" como um número que se atualiza. Guardam **lançamentos** imutáveis, e o saldo é derivado deles. Toda movimentação tem pelo menos dois lados que se anulam (débito em uma conta, crédito em outra). Isso permite conciliar, auditar e reconstruir qualquer saldo em qualquer data.

```sql
CREATE TABLE lancamentos (
  id           bigserial     PRIMARY KEY,
  transacao_id uuid          NOT NULL,
  conta_id     text          NOT NULL,
  valor        numeric(18,2) NOT NULL,  -- positivo = crédito, negativo = débito
  criado_em    timestamptz   NOT NULL DEFAULT now()
);

-- Verificação: toda transação precisa somar zero.
SELECT transacao_id, sum(valor) AS diferenca
  FROM lancamentos
 GROUP BY transacao_id
HAVING sum(valor) <> 0;
```

Se essa consulta retorna qualquer linha, há dinheiro que apareceu ou desapareceu sem contrapartida. Em um sistema bem construído, ela deveria retornar vazio sempre, e um alerta deveria disparar no primeiro resultado.

### 4. Seu parceiro financeiro é uma dependência crítica

Fintechs, plataformas e varejistas que dependem de um banco ou de uma instituição de pagamento parceira herdam o risco dessa contraparte. O caso Entrepay mostra o efeito prático: quando a instituição é liquidada, a operação para de uma vez.

Algumas perguntas que deveriam fazer parte de qualquer integração financeira:

- A instituição é autorizada pelo Banco Central? A que conglomerado prudencial pertence?
- Existe um segundo parceiro capaz de assumir a operação? Quanto tempo leva a troca?
- Os dados dos seus clientes e das suas transações estão sob seu controle, em formato que permita migrar?
- O contrato prevê o que acontece em caso de intervenção ou liquidação?

### 5. Observabilidade para o que importa ao negócio

Monitorar CPU e latência é necessário, mas não basta. Em sistemas financeiros, os alertas mais valiosos costumam ser de negócio: quebra de conciliação, concentração incomum de operações em uma contraparte, divergência entre o saldo interno e o extrato do banco liquidante, crescimento de pendências não explicadas.

## O que isso significa para quem trabalha com tecnologia

- **Para desenvolvedores:** conciliação, auditoria, qualidade de dados e conformidade não são trabalho burocrático. Em sistemas financeiros, são o núcleo do produto. Quem domina esses temas tende a ser mais difícil de substituir do que quem domina apenas um framework.
- **Para quem empreende:** a escolha de um parceiro financeiro é uma decisão de arquitetura, com plano de contingência.
- **Para quem vende software B2B ao setor:** as novas exigências criam demanda por cálculo regulatório, gestão de dados e trilhas de auditoria. Isso é uma oportunidade plausível, mas é uma **hipótese de mercado**, não um efeito medido. Vale validá-la conversando com potenciais clientes antes de investir.

Uma conclusão que me parece segura: o caso Master não foi, na sua essência, uma falha de tecnologia. Foi, segundo o que já foi apurado e o que ainda está sendo investigado, uma combinação de modelo de negócio, governança e supervisão. Mas a tecnologia é o lugar onde muitas dessas decisões ficam visíveis, ou ficam escondidas. Um sistema que concilia tudo, registra tudo e não aceita lançamento sem contrapartida não impede uma fraude decidida no topo, mas torna muito mais difícil sustentá-la por muito tempo.

Para outro caso em que a integridade dos registros é a função principal do sistema, veja o artigo sobre [mandados falsos no BNMP](/blog/bnmp-mandados-falsos-sistemas-criticos).

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura. Fatos atribuídos a investigadores são alegações em apuração, e as investigações seguiam em andamento quando o texto foi escrito (outubro de 2026).

- Poder360. [Banco Central decreta liquidação extrajudicial do Banco Master](https://poder360.com.br/poder-economia/banco-central-decreta-liquidacao-extrajudicial-do-banco-master/) (18 de novembro de 2025).
- Poder360. [Banco Central liquida Banco Master Múltiplo](https://www.poder360.com.br/poder-economia/banco-central-liquida-banco-master-multiplo/) (março de 2026).
- Tecnoblog. [Will Bank deixa de operar após ser liquidado pelo Banco Central](https://tecnoblog.net/noticias/will-bank-deixa-de-operar-apos-ser-liquidado-pelo-banco-central/) (janeiro de 2026).
- CNN Brasil. [FGC já pagou R$ 37,7 bilhões a credores do Master e Will Bank](https://www.cnnbrasil.com.br/economia/macroeconomia/fgc-ja-pagou-r-377-bilhoes-a-credores-do-master-e-will-bank/) (18 de fevereiro de 2026).
- Congresso em Foco. [Banco Central decreta liquidação extrajudicial do grupo Entrepay](https://www.congressoemfoco.com.br/noticia/117624/banco-central-decreta-liquidacao-extrajudicial-do-grupo-entrepay) (27 de março de 2026).
- Agência Brasil. [Bancos apoiam novas regras do FGC após decisão do CMN](https://agenciabrasil.ebc.com.br/economia/noticia/2026-04/bancos-apoiam-novas-regras-do-fgc-apos-decisao-do-cmn) (24 de abril de 2026).
- Senado Federal. [Documento com relatório sobre as operações entre BRB e Banco Master](https://legis.senado.leg.br/sdleg-getter/documento/download/4df7fcaa-3447-49d7-b840-50f3d035b71d).
- Wikipedia. [Banco Master scandal](https://en.wikipedia.org/wiki/Banco_Master_scandal), usada apenas como apoio para a cronologia, conferida com as fontes acima.
