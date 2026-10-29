---
title: "ACID em bancos de dados: os fundamentos que todo desenvolvedor deveria compreender de verdade"
description: "Guia aprofundado sobre Atomicidade, Consistência, Isolamento e Durabilidade: anomalias de concorrência, MVCC, WAL, PostgreSQL vs MySQL e o que o banco não resolve sozinho."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/acid-em-bancos-de-dados.webp"
coverAlt: "Diagrama esquemático e minimalista ilustrando transações em banco de dados sendo consolidadas através de camadas de isolamento sob paleta sóbria em grafite e âmbar"
category: "Banco de Dados"
tags:
  - "PostgreSQL"
  - "Banco de Dados"
  - "ACID"
  - "Concorrência"
  - "Backend"
  - "Arquitetura"
draft: false
---

Em quase toda entrevista para posições de backend ou engenharia de dados, a pergunta aparece em algum momento: *"O que significa a sigla ACID?"*. Quase todo mundo tem a resposta na ponta da língua: Atomicidade, Consistência, Isolamento e Durabilidade. Quatro palavras bonitas, memorizadas em algum resumo para vestibulares técnicos ou slides de introdução à computação.

O problema começa na segunda-feira seguinte, em produção.

Quando uma fila de mensagens dispara dez workers simultâneos tentando debitar o mesmo saldo, quando um webhook de pagamento chega duplicado por instabilidade de rede, ou quando uma transação aberta segura locks por cinco segundos enquanto espera uma chamada HTTP externa e derruba o pool de conexões da API, a definição de dicionário não ajuda em nada.

Muitos desenvolvedores tratam o banco de dados relacional como um armário mágico: você abre a porta com `BEGIN`, joga três comandos SQL lá dentro, fecha com `COMMIT` e assume que o motor resolverá qualquer concorrência, evitará qualquer duplicidade e manterá o negócio são e salvo. Não é assim que funciona.

As propriedades ACID não são magia nem garantias absolutas de correção de negócio. Elas são um conjunto rigoroso de garantias mecânicas que o banco oferece sob contratos e configurações muito específicas — e com custos claros de latência, contenção e complexidade arquitetural.

Neste artigo, vamos dissecar o modelo ACID a fundo. Sem definições superficiais de quatro parágrafos, sem analogias simplistas de bolo de padaria. Vamos construir o entendimento a partir do código, analisando o que acontece dentro do motor do PostgreSQL, investigando anomalias reais de concorrência, dissecando mecanismos internos como MVCC e Write-Ahead Logging (WAL), comparando como diferentes bancos implementam essas garantias e, fundamentalmente, delimitando onde termina a responsabilidade do banco de dados e onde começa a sua.

---

## 1. Comece pelo problema, não pela sigla

Para entender por que as propriedades ACID existem, não comece pela teoria de Jim Gray em 1981. Comece por um bug financeiro clássico.

Imagine um sistema bancário simplificado. Alice possui uma conta (`id = 1`) com saldo de R$ 500,00. Bob possui uma conta (`id = 2`) com saldo de R$ 200,00. Alice decide transferir R$ 100,00 para Bob.

Em termos de instruções SQL no banco de dados, essa operação exige no mínimo duas etapas físicas:

```sql
-- Etapa 1: Subtrai R$ 100 da conta de Alice
UPDATE contas SET saldo = saldo - 100.00 WHERE id = 1;

-- Etapa 2: Adiciona R$ 100 na conta de Bob
UPDATE contas SET saldo = saldo + 100.00 WHERE id = 2;
```

Se executarmos essas duas instruções isoladamente, fora de qualquer mecanismo transacional, o que acontece se o servidor sofrer uma queda súbita de energia, um kernel panic ou um encerramento forçado (`SIGKILL`) pelo OOM killer exatamente entre a Etapa 1 e a Etapa 2?

O resultado é desastroso:

1. A Etapa 1 foi gravada em disco. O saldo de Alice foi reduzido para R$ 400,00.
2. A Etapa 2 nunca foi executada. O saldo de Bob continuou em R$ 200,00.
3. R$ 100,00 evaporaram do balanço patrimonial da instituição.

Nenhum erro de sintaxe foi cometido. Cada uma das instruções SQL individuais era perfeitamente válida. O desastre ocorreu porque a transferência bancária não é uma coleção de operações independentes: ela é uma **Unidade Lógica de Trabalho** (*Logical Unit of Work* — LUW). Do ponto de vista do domínio, debitar de Alice e creditar em Bob é um evento indivisível. Ou ambos acontecem, ou nenhum dos dois deve ter acontecido.

### O conceito de transação

É dessa necessidade que nasce o conceito formal de **transação**. Uma transação é um delimitador que informa ao sistema gerenciador de banco de dados (SGBD) que uma sequência de operações deve ser tratada como um bloco único e indivisível.

No padrão SQL e no PostgreSQL (nosso banco principal de referência), os delimitadores fundamentais são:

- `BEGIN` (ou `START TRANSACTION`): marca o início de uma nova unidade transacional.
- `COMMIT`: instrui o banco a tornar todas as modificações daquela transação definitivas, visíveis e permanentes.
- `ROLLBACK`: instrui o banco a descartar imediatamente todas as alterações pendentes daquela transação, restaurando o estado exato dos dados ao momento anterior ao `BEGIN`.

```sql
BEGIN;

UPDATE contas SET saldo = saldo - 100.00 WHERE id = 1;
UPDATE contas SET saldo = saldo + 100.00 WHERE id = 2;

COMMIT;
```

Se qualquer erro ocorrer antes do `COMMIT`, ou se a aplicação decidir abortar a operação, o banco executa um `ROLLBACK`, garantindo que nenhuma alteração intermediária contamine os dados.

### Atomicidade de instrução vs. atomicidade de transação

É comum desenvolvedores confundirem esses dois níveis de atomicidade:

1. **Atomicidade de instrução única (*Single-Statement Atomicity*):** Mesmo sem você digitar `BEGIN` explicitamente, quase todos os bancos relacionais tratam cada comando SQL avulso como uma transação implícita (modo *autocommit*). Se você executar um único comando `UPDATE produtos SET preco = preco * 1.10 WHERE categoria_id = 5;` que modifique 50.000 linhas, e na linha 49.999 ocorrer uma violação de constraint (como estouro de valor numérico), o banco reverterá a instrução inteira. Nenhuma das 49.998 linhas anteriores ficará alterada.
2. **Atomicidade de múltiplas instruções (*Multi-Statement Transaction Atomicity*):** É a capacidade de estender essa garantia de indivisibilidade através de dezenas de instruções independentes (`UPDATE`, `INSERT`, `DELETE`) em tabelas diferentes, consolidando ou descartando todas elas em conjunto.

As propriedades ACID são, em essência, as garantias formais que tornam essa abstração de Unidade Lógica de Trabalho confiável na presença de concorrência massiva e falhas catastróficas de hardware e software.

---

## 2. Atomicidade — tudo ou nada

A **Atomicidade** (*Atomicity*) determina que uma transação não possui estados parciais observáveis. Ou todas as operações que a compõem são aplicadas com sucesso e persistidas, ou o sistema retorna ao estado rigorosamente idêntico àquele em que se encontrava antes de a transação ter começado.

A palavra deriva do grego *atomos* (indivisível). No contexto de banco de dados, significa que a transação não pode ser fatiada pelo destino, pelo acaso ou por uma falha.

### Um exemplo executável no PostgreSQL

Vamos criar uma estrutura mínima e funcional para testar esse comportamento no PostgreSQL:

```sql
-- 1. Criação das tabelas
CREATE TABLE contas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titular VARCHAR(100) NOT NULL,
    saldo NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_saldo_nao_negativo CHECK (saldo >= 0)
);

CREATE TABLE transferencias (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conta_origem_id BIGINT NOT NULL REFERENCES contas(id),
    conta_destino_id BIGINT NOT NULL REFERENCES contas(id),
    valor NUMERIC(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'concluida',
    criada_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_valor_positivo CHECK (valor > 0),
    CONSTRAINT chk_contas_distintas CHECK (conta_origem_id <> conta_destino_id)
);

-- 2. Inserção do estado inicial
INSERT INTO contas (titular, saldo) VALUES ('Alice', 500.00);
INSERT INTO contas (titular, saldo) VALUES ('Bob', 200.00);
```

#### O caminho feliz: sucesso e COMMIT

Quando a transação é executada do início ao fim sem interrupções:

```sql
BEGIN;

-- Débito de Alice
UPDATE contas 
SET saldo = saldo - 100.00 
WHERE id = 1;

-- Crédito de Bob
UPDATE contas 
SET saldo = saldo + 100.00 
WHERE id = 2;

-- Registro histórico para auditoria
INSERT INTO transferencias (conta_origem_id, conta_destino_id, valor)
VALUES (1, 2, 100.00);

COMMIT;
```

Se inspecionarmos o banco logo após o `COMMIT`, veremos:
- Alice possui R$ 400,00.
- Bob possui R$ 300,00.
- Existe uma linha na tabela `transferencias` documentando a operação.

#### O caminho de falha: erro e ROLLBACK

Agora, imagine que o código tente transferir um valor negativo ou que a segunda instrução tente creditar em uma conta inexistente, violando uma foreign key:

```sql
BEGIN;

-- Débito de Alice (executado com sucesso dentro do escopo da transação)
UPDATE contas 
SET saldo = saldo - 100.00 
WHERE id = 1;

-- Tentativa de registrar transferência violando constraint de valor positivo
INSERT INTO transferencias (conta_origem_id, conta_destino_id, valor)
VALUES (1, 2, -100.00); -- ERRO: violação da constraint "chk_valor_positivo"

-- No PostgreSQL, uma transação que gera erro entra no estado de ABORT.
-- Qualquer comando subsequente é rejeitado com:
-- ERROR: current transaction is aborted, commands ignored until end of transaction block

ROLLBACK;
```

Após o `ROLLBACK`:
- O saldo de Alice permanece intacto em R$ 400,00 (do commit anterior). O débito pendente de R$ 100,00 foi integralmente descartado.
- Nenhuma linha órfã foi criada em `transferencias`.

### Como o banco recupera transações incompletas por baixo dos panos?

Quando um servidor perde energia no meio de uma transação aberta, quem desfaz o trabalho parcial quando o sistema reinicia?

Bancos de dados relacionais não mantêm "cópias inteiras do banco" para fazer rollback. Isso seria proibitivamente lento. Diferentes bancos utilizam estratégias distintas:

1. **PostgreSQL (MVCC e Commit Log):** No PostgreSQL, quando um `UPDATE` ou `INSERT` é executado, ele escreve uma nova versão física da linha (*tuple*) diretamente nas páginas de dados. Cada linha no disco contém metadados em seu cabeçalho, incluindo `xmin` (o identificador da transação que a criou) e `xmax` (o identificador da transação que a atualizou ou excluiu). O PostgreSQL mantém um log de status de transações chamado `pg_xact` (historicamente conhecido como `pg_clog`). Se a transação sofrer `ROLLBACK` ou se o servidor cair, o PostgreSQL simplesmente marca aquele identificador de transação como `ABORTED` no `pg_xact`. Nenhuma tupla precisa ser apagada às pressas no disco! Qualquer transação futura que ler aquela página de dados consultará o `pg_xact`, verá que o `xmin` pertence a uma transação abortada e simplesmente **ignorará a existência daquela linha**. O processo em segundo plano chamado `VACUUM` cuidará de reciclar esse espaço físico mais tarde.
2. **MySQL com InnoDB (Undo Logs / Rollback Segments):** O motor InnoDB da Oracle adota uma abordagem física diferente. Quando uma linha é alterada, o InnoDB grava o estado anterior daquela linha em uma estrutura dedicada chamada **Undo Log** (armazenada em *Rollback Segments*). Se a transação for abortada ou se o banco reiniciar após um crash, o mecanismo de recuperação lê os Undo Logs em ordem reversa e desfaz fisicamente as páginas alteradas, restaurando os bytes originais.

### Desfazer alterações pendentes vs. compensar operações confirmadas

Há uma fronteira fundamental de engenharia que separa o `ROLLBACK` do banco de uma **transação de compensação**:

- **Desfazer (*Rollback*):** Ocorre enquanto a transação ainda está aberta e não confirmada. As modificações nunca foram oficializadas.
- **Compensar (*Compensating Transaction*):** Ocorre quando uma transação **já foi confirmada via `COMMIT`**, mas o processo de negócio precisou ser estornado minutos, horas ou dias depois (por exemplo: o cliente devolveu a mercadoria comprada).

Você **nunca** faz rollback de um `COMMIT` já concluído. Para reverter uma transferência já confirmada, você é obrigado a emitir uma **nova transação para a frente**, criando um lançamento a crédito e um estorno contábil formal.

### O que a atomicidade NÃO garante no mundo real

Muitos desenvolvedores acreditam ingenuamente que envolver um bloco de código com `BEGIN` e `COMMIT` garante que as regras de negócio estão protegidas. Isso é uma ilusão perigosa.

Se Alice tiver apenas R$ 50,00 e o seu código disparar:

```sql
BEGIN;
UPDATE contas SET saldo = saldo - 1000000.00 WHERE id = 1;
UPDATE contas SET saldo = saldo + 1000000.00 WHERE id = 2;
COMMIT;
```

Se a tabela `contas` não tiver uma constraint `CHECK (saldo >= 0)`, o banco de dados executará as duas instruções com **perfeita e impecável atomicidade**. Alice ficará com saldo negativo de R$ 999.950,00 e Bob receberá um milhão de reais. A atomicidade fez exatamente o que foi contratada para fazer: garantiu o tudo ou nada da execução. Ela não julga se o que você pediu faz sentido para a sua empresa.

Além disso, há um limite estrito: **o `ROLLBACK` do banco de dados não tem poder sobre o mundo externo**. Se dentro do seu método da aplicação você fizer:

```typescript
await db.query('BEGIN');
await db.query('UPDATE contas SET saldo = saldo - 100 WHERE id = 1');

// Chamada para gateway de pagamento externo ou disparo de e-mail
await stripe.charges.create({ ... });
await emailService.sendReceipt({ ... });

// Se a linha abaixo falhar:
await db.query('INSERT INTO transferencias ...'); // ERRO!
await db.query('ROLLBACK');
```

O `ROLLBACK` restaurará o saldo de Alice no banco de dados. Porém, a chamada para a Stripe já aconteceu, o dinheiro já foi cobrado no cartão e o e-mail de confirmação já está na caixa de entrada do cliente. **O banco de dados não desfaz chamadas de rede nem efeitos colaterais produzidos fora da sua própria fronteira de armazenamento.**

---

## 3. Consistência — manter as regras e invariantes dos dados

De todas as quatro letras da sigla ACID, a letra **C** (Consistência) é a que gera maior confusão conceitual na computação moderna.

Isso ocorre porque a palavra "consistência" é usada para coisas completamente distintas dependendo do contexto:

1. **Consistência no modelo ACID:** Refere-se à **preservação de invariantes de dados**. Significa que uma transação só pode levar o banco de um estado válido para outro estado igualmente válido, respeitando todas as regras de integridade declaradas no esquema.
2. **Consistência no Teorema CAP (e modelos distribuídos):** Refere-se à **Linearizabilidade** (*Single-Copy Consistency*). Significa que todos os nós de um cluster enxergam a mesma escrita no mesmo instante, como se houvesse apenas uma cópia global do dado.
3. **Consistência Eventual (*Eventual Consistency*):** Um modelo de convergência assíncrona onde réplicas distribuídas podem divergir temporariamente, mas convergem após algum tempo sem novas escritas.

Quando estamos discutindo ACID em bancos relacionais, consistência é estritamente sobre **regras, esquemas e invariantes**.

### O que são invariantes?

Um invariante é uma condição lógica sobre os dados que **precisa ser verdadeira em todos os momentos**. Se um invariante for quebrado, os dados estão corrompidos sob a ótica do sistema.

Exemplos clássicos de invariantes de negócio:
- O saldo de uma conta corrente sem cheque especial não pode ser negativo (`saldo >= 0`).
- Um pedido em status `cancelado` não pode ter data de entrega preenchida.
- Uma chave Pix deve pertencer a exatamente um único cliente do sistema financeiro nacional.
- A soma dos lançamentos de débito de um lançamento contábil deve ser rigorosamente igual à soma dos lançamentos de crédito (partidas dobradas).
- Um item de pedido não pode apontar para um produto que não existe no catálogo.

### O papel das restrições nativas do banco de dados

Para proteger esses invariantes, os bancos relacionais oferecem mecanismos declarativos de restrição (*constraints*):

```sql
CREATE TABLE pedidos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    codigo_rastreio VARCHAR(50) UNIQUE,
    status VARCHAR(20) NOT NULL,
    valor_total NUMERIC(10, 2) NOT NULL,
    desconto NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Invariante: status permitidos
    CONSTRAINT chk_status_valido CHECK (
        status IN ('rascunho', 'aguardando_pagamento', 'pago', 'enviado', 'cancelado')
    ),
    
    -- Invariante: desconto não pode exceder o total
    CONSTRAINT chk_desconto_coerente CHECK (desconto >= 0 AND desconto <= valor_total),
    
    -- Invariante: valor total positivo
    CONSTRAINT chk_total_positivo CHECK (valor_total >= 0)
);
```

Essas constraints formam a fundação da consistência ACID:
- `PRIMARY KEY` e `UNIQUE`: garantem unicidade de entidade.
- `NOT NULL`: impede ausência de dados obrigatórios.
- `FOREIGN KEY`: garante integridade referencial, impedindo a existência de registros órfãos.
- `CHECK`: valida expressões booleanas arbitrárias sobre os dados da linha.

### Defesa em profundidade: aplicação vs. banco de dados

Existe uma tentação recorrente em times modernos de software: *"Vamos deixar todas as validações apenas no código da aplicação (no Node.js, Go, Java, Python) e deixar o banco sem constraints, porque assim fica mais fácil mudar o esquema."*

Essa postura é uma das maiores causas de corrupção de dados em larga escala na indústria. Validar na aplicação é indispensável, mas insuficiente por três motivos:

1. **Condições de corrida (*Race Conditions*):** Se dois usuários tentarem cadastrar simultaneamente o mesmo e-mail, ambos os servidores de aplicação verificarão que o e-mail não existe no banco ao mesmo tempo. Ambos validarão a regra com sucesso no código e dispararão o `INSERT`. Sem uma constraint `UNIQUE` no banco, você terá dois usuários com o mesmo e-mail.
2. **Multiplicidade de pontos de escrita:** O seu backend não é a única coisa que acessa o banco ao longo dos anos. Há rotinas em background, workers de processamento em lote, scripts de migração de dados e intervenções emergenciais de operadores.
3. **Bugs de software:** O código da aplicação falha. Uma validação esquecida em um endpoint novo contamina o banco se a regra não estiver consolidada na camada de persistência.

A engenharia madura adota **defesa em profundidade**: a aplicação valida primeiro para fornecer feedback rápido e amigável ao usuário final; o banco de dados valida por último como a barreira definitiva e incorruptível da verdade.

### Três situações fundamentais sobre a consistência

Para nunca mais confundir o papel do banco na consistência, diferencie estas três situações:

| Situação | Comportamento do Banco | Avaliação do Domínio | Consequência |
| :--- | :--- | :--- | :--- |
| **1. Transação tecnicamente íntegra e correta no domínio** | Aceita e confirma via `COMMIT`. Todas as constraints foram respeitadas. | O estado final reflete com precisão a intenção do negócio. | Sistema saudável e dados corretos. |
| **2. Transação tecnicamente íntegra, mas errada no domínio** | Aceita e confirma via `COMMIT`. O banco não violou nenhuma regra declarada. | Erro de regra de negócio (ex.: cupom de desconto aplicado duas vezes para o mesmo cliente). | **Corrupção silenciosa**. O banco não tinha uma constraint modelada para proibir o evento. |
| **3. Regra dependente de sistemas distribuídos ou externos** | O banco local só consegue validar o que está sob seu controle físico imediato. | A transação depende de um score antifraude externo ou de saldo em outra instituição. | A consistência local é insuficiente. Exige padrões distribuídos (Outbox, Sagas, reconciliação). |

> [!IMPORTANT]
> O banco de dados é agnóstico ao modelo mental do seu negócio. Ele conhece tipos, chaves e expressões booleanas. Se você não declarou a regra ou não estruturou as transações para protegê-la, o banco confirmará alegremente dados financeiramente absurdos sob total conformidade ACID.

---

## 4. Isolamento — o que acontece quando duas transações são executadas simultaneamente?

Se o seu sistema processasse apenas uma transação por vez, de maneira sequencial e serializada, o isolamento seria um problema trivial. Você não precisaria de locks, nem de controle de concorrência multiversão, nem de níveis de isolamento.

O problema é a realidade: em um sistema moderno de produção, dezenas ou milhares de transações acontecem **no mesmo milissegundo**.

O **Isolamento** (*Isolation*) define como e quando as alterações feitas por uma transação em andamento se tornam visíveis para outras transações concorrentes. O objetivo ideal do isolamento é a **Serializabilidade**: garantir que o resultado final da execução concorrente de múltiplas transações seja rigorosamente equivalente ao resultado que seria obtido se elas tivessem sido executadas uma após a outra, em alguma ordem sequencial.

Porém, isolar completamente cada operação custa caro em termos de latência e paralelismo. Quando duas ou mais transações se entrelaçam sem isolamento adequado, anomalias graves de concorrência se manifestam.

Vamos investigar cada uma dessas anomalias com precisão cirúrgica.

---

### Anomalia 1: Dirty Read (Leitura Suja)

Uma leitura suja ocorre quando a transação **T2** lê dados que foram modificados pela transação **T1**, mas que **ainda não foram confirmados**. Se **T1** abortar e fizer rollback, os dados lidos por **T2** nunca existiram oficialmente.

```
Linha do tempo:
T1: BEGIN;
T1: UPDATE contas SET saldo = 500.00 WHERE id = 1; -- (saldo era 100)
    |
    +---> T2: BEGIN;
          T2: SELECT saldo FROM contas WHERE id = 1; -- Lê 500.00!
          T2: -- T2 toma uma decisão com base nesse saldo de 500...
          T2: COMMIT;
    |
T1: ROLLBACK; -- T1 cancela a alteração! O saldo volta a ser 100.00.
```

**Resultado:** T2 tomou decisões de negócio, aprovou crédito ou gerou faturamento com base em um saldo de R$ 500,00 que era uma ficção temporária.

---

### Anomalia 2: Non-Repeatable Read (Leitura Não Repetível / Leitura Difusa)

Ocorre quando a transação **T1** lê uma linha de dados, e em seguida a transação **T2** atualiza ou deleta essa mesma linha e executa `COMMIT`. Quando **T1** lê a mesma linha novamente dentro do mesmo bloco transacional, encontra valores alterados ou a linha ausente.

```
Linha do tempo:
T1: BEGIN;
T1: SELECT saldo FROM contas WHERE id = 1; -- Retorna 100.00
    |
    +---> T2: BEGIN;
          T2: UPDATE contas SET saldo = 300.00 WHERE id = 1;
          T2: COMMIT;
    |
T1: SELECT saldo FROM contas WHERE id = 1; -- Retorna 300.00!
T1: COMMIT;
```

**Resultado:** Dentro da mesmíssima transação T1, duas leituras idênticas da mesma chave primária retornaram valores diferentes. Isso quebra algoritmos de cálculo de impostos, relatórios financeiros e regras de fechamento contábil.

---

### Anomalia 3: Phantom Read (Leitura Fantasma)

Ocorre quando a transação **T1** executa uma consulta que busca um conjunto de linhas com base em uma condição de busca (predicado, ex.: `WHERE saldo > 1000`). Em seguida, a transação **T2** insere ou remove uma linha que satisfaz esse predicado e faz `COMMIT`. Quando **T1** repete a consulta com o mesmo predicado, vê um conjunto diferente de linhas: novas linhas "fantasmas" materializaram-se do nada.

```
Linha do tempo:
T1: BEGIN;
T1: SELECT COUNT(*) FROM contas WHERE saldo >= 1000.00; -- Retorna 5 contas
    |
    +---> T2: BEGIN;
          T2: INSERT INTO contas (titular, saldo) VALUES ('Carlos', 1500.00);
          T2: COMMIT;
    |
T1: SELECT COUNT(*) FROM contas WHERE saldo >= 1000.00; -- Retorna 6 contas!
T1: COMMIT;
```

> [!NOTE]
> Repare a diferença sutil entre Non-Repeatable Read e Phantom Read: no Non-Repeatable Read, uma linha que já existia teve seus dados alterados. No Phantom Read, linhas inteiras foram adicionadas ou removidas de uma consulta por intervalo/predicado.

---

### Anomalia 4: Lost Update (Atualização Perdida)

Ocorre quando duas transações leem o mesmo registro concorrentemente, calculam uma nova versão baseada no valor lido e ambas tentam gravar a atualização. Uma das gravações sobrescreve cegamente a outra, apagando o efeito da primeira.

Imagine que o saldo inicial da conta seja R$ 100,00. Dois saques simultâneos de R$ 40,00 e R$ 30,00 acontecem em caixas eletrônicos diferentes:

```
Linha do tempo:
T1: BEGIN;
T2: BEGIN;

T1: SELECT saldo FROM contas WHERE id = 1; -- Lê 100.00
T2: SELECT saldo FROM contas WHERE id = 1; -- Lê 100.00

T1: -- Calcula em memória: 100 - 40 = 60
T2: -- Calcula em memória: 100 - 30 = 70

T1: UPDATE contas SET saldo = 60.00 WHERE id = 1;
T1: COMMIT;

T2: UPDATE contas SET saldo = 70.00 WHERE id = 1; -- Sobrescreve T1!
T2: COMMIT;
```

**Resultado antes:** Saldo = R$ 100,00. Saques realizados: R$ 40,00 e R$ 30,00 (total R$ 70,00 retirados).  
**Resultado final:** Saldo = R$ 70,00! O débito de R$ 40,00 feito por T1 foi simplesmente apagado da história. O cliente sacou R$ 70,00, mas sua conta só reduziu R$ 30,00.

---

### Anomalia 5: Write Skew (Desvio de Escrita)

O Write Skew é a mais traiçoeira e sutil das anomalias de concorrência. Ela ocorre quando duas transações concorrentes leem dados sobrepostos que determinam um invariante global de negócio, cada uma atualiza um subconjunto **disjunto** (linhas diferentes) e ambas confirmam com sucesso. Individualmente, cada transação parecia perfeitamente válida; juntas, elas quebram o invariante.

O exemplo clássico é o da escala médica hospitalar:
- **Invariante:** O hospital deve ter **sempre pelo menos um médico** de plantão ativo (`COUNT(*) WHERE plantao_ativo = true >= 1`).
- **Estado inicial:** Dra. Alice e Dr. Bob estão ambos de plantão ativo (total = 2).

```
Linha do tempo:
T1 (Alice quer sair do plantão):
T1: BEGIN;
T1: SELECT COUNT(*) FROM medicos WHERE plantao_ativo = true; -- Retorna 2 (Seguro sair!)
T1: UPDATE medicos SET plantao_ativo = false WHERE id = 1; -- (Alice sai)

T2 (Bob quer sair do plantão simultaneamente):
T2: BEGIN;
T2: SELECT COUNT(*) FROM medicos WHERE plantao_ativo = true; -- Retorna 2 (Seguro sair!)
T2: UPDATE medicos SET plantao_ativo = false WHERE id = 2; -- (Bob sai)

T1: COMMIT;
T2: COMMIT;
```

**Resultado:** Ambos os commits foram aceitos sem conflito de lock, pois T1 alterou a linha 1 e T2 alterou a linha 2. Nenhuma linha foi atualizada por dois processos ao mesmo tempo. No entanto, o hospital ficou com **zero médicos de plantão**. O invariante foi aniquilado.

---

### Anomalia 6: Deadlocks (Bloqueios Mútuos)

Um deadlock não é uma anomalia de leitura, mas uma consequência inevitável de mecanismos de isolamento baseados em bloqueios (*pessimistic locks*).

Ocorre quando duas transações bloqueiam recursos diferentes e tentam adquirir o recurso que a outra está segurando, formando um ciclo de dependência circular:

```
Linha do tempo:
T1: BEGIN;
T1: UPDATE contas SET saldo = saldo - 50 WHERE id = 1; -- Adquire Exclusive Lock na linha 1

T2: BEGIN;
T2: UPDATE contas SET saldo = saldo - 30 WHERE id = 2; -- Adquire Exclusive Lock na linha 2

T1: UPDATE contas SET saldo = saldo + 50 WHERE id = 2; -- T1 fica BLOQUEADA esperando T2 liberar a linha 2
T2: UPDATE contas SET saldo = saldo + 30 WHERE id = 1; -- T2 tenta adquirir linha 1, segurada por T1!
```

Nenhuma das duas transações pode avançar. Elas esperariam eternamente. O motor do banco possui um algoritmo detector de ciclos no grafo de locks (no PostgreSQL configurado pelo parâmetro `deadlock_timeout`, tipicamente 1 segundo). Quando o ciclo é detectado, o banco intervém cirurgicamente e **aborta uma das transações com erro**, permitindo que a outra prossiga:

```
ERROR: deadlock detected
DETAIL: Process 18402 waits for ShareLock on transaction 8912; blocked by process 18403.
Process 18403 waits for ExclusiveLock on tuple (0,1) of relation "contas"; blocked by process 18402.
HINT: See server log for query details.
```

---

## 5. Os níveis de isolamento na prática

Para balancear a rigidez da integridade contra a necessidade de alta taxa de transferência (*throughput*), o padrão ANSI SQL-92 definiu quatro **Níveis de Isolamento de Transação**:

1. `READ UNCOMMITTED`
2. `READ COMMITTED`
3. `REPEATABLE READ`
4. `SERIALIZABLE`

O padrão definiu esses níveis com base nas anomalias que cada um deveria proibir. Contudo, em 1995, um artigo clássico de computação intitulado *A Critique of ANSI SQL Isolation Levels* (Berenson, Bernstein, Gray, Melton, O'Neil e O'Neil) demonstrou formalmente que as definições do padrão ANSI eram falhas e incompletas: elas presumiam implementações puras baseadas em locks e ignoravam fenômenos vitais como Lost Update e Write Skew, além de ignorar bancos que utilizam MVCC.

Por isso, **o comportamento real varia drasticamente dependendo do banco de dados utilizado**.

### Tabela comparativa: ANSI vs. PostgreSQL real

| Nível de Isolamento | Leitura Suja (*Dirty Read*) | Leitura Não Repetível | Leitura Fantasma (*Phantom Read*) | Desvio de Escrita (*Write Skew*) | Comportamento Real no PostgreSQL | Impacto em Concorrência / Custo |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **READ UNCOMMITTED** | Permitida pelo padrão ANSI | Permitida | Permitida | Permitida | **Não existe no PostgreSQL**. É mapeado internamente para `READ COMMITTED`. Leituras sujas são fisicamente impossíveis. | Idêntico ao `READ COMMITTED`. |
| **READ COMMITTED** *(Padrão no PostgreSQL)* | **Impedida** | Permitida | Permitida | Permitida | Cada comando SQL dentro da transação enxerga um novo snapshot, congelado no instante de início do comando. | Muito baixo. Máxima concorrência. Leitores não bloqueiam escritores e vice-versa. |
| **REPEATABLE READ** | **Impedida** | **Impedida** | Permitida pelo padrão ANSI | Permitida | No PostgreSQL, **também impede Phantom Reads!** Utiliza *Snapshot Isolation*. Enxerga um snapshot fixo capturado no início da primeira consulta da transação. | Moderado. Transações abortam com erro se tentarem atualizar uma linha alterada concorrentemente após o snapshot. |
| **SERIALIZABLE** | **Impedida** | **Impedida** | **Impedida** | **Impedida** | Utiliza **SSI (Serializable Snapshot Isolation)**. Rastreia conflitos de leitura/escrita em memória sem locks de bloqueio. Aborta qualquer transação que ameace quebrar a equivalência serial. | Alto índice potencial de cancelamentos e repetições (*retries*). Exige código preparado para falhas `40001`. |

> [!IMPORTANT]
> Observe dois detalhes essenciais sobre o PostgreSQL documentados oficialmente:
> 1. No PostgreSQL, configurar `SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED` não permite leituras sujas. O motor simplesmente executa a transação como `READ COMMITTED`.
> 2. O `REPEATABLE READ` do PostgreSQL é muito mais estrito do que o padrão ANSI exige: por usar *Snapshot Isolation*, ele já elimina o Phantom Read clássico. Contudo, ele **ainda permite Write Skew**.

### Como funciona o MVCC (Multi-Version Concurrency Control)

Bancos legados implementavam isolamento puramente através de locks pessimistas (duas fases — 2PL): para ler uma linha, a transação pegava um Shared Lock (bloqueando escritas); para escrever, pegava um Exclusive Lock (bloqueando qualquer leitura). Isso causava congestionamentos severos em sistemas web.

O PostgreSQL resolve isso utilizando **MVCC** (*Multi-Version Concurrency Control*):

> **A regra de ouro do MVCC:**  
> Leitores nunca bloqueiam escritores. Escritores nunca bloqueiam leitores.

Quando você executa um `UPDATE` no PostgreSQL:
1. O banco não sobrescreve os bytes da linha existente.
2. Ele marca a linha antiga como expirada (preenchendo seu campo de cabeçalho `xmax` com o ID da transação atual).
3. Ele grava uma **nova versão física da linha** (*tuple*) em outro lugar da página de disco, com o campo `xmin` apontando para a transação atual.
4. Quando outra transação faz um `SELECT`, ela usa um **Snapshot** (uma lista de quais transações estavam ativas ou confirmadas no momento de corte) para decidir qual versão histórica da linha é visível para ela.

### O motor do SERIALIZABLE no PostgreSQL: SSI

Enquanto o MySQL InnoDB previne anomalias no nível mais estrito utilizando locks de intervalo pesados (*Next-Key Locks* e *Gap Locks*), o PostgreSQL utiliza uma inovação acadêmica implementada a partir da versão 9.1: o **Serializable Snapshot Isolation (SSI)**, baseado nas pesquisas de Michael Cahill e Uwe Röhm.

O SSI opera de forma otimista:
- As transações leem dados sem segurar locks pesados de leitura.
- O PostgreSQL cria em memória estruturas ultra-leves chamadas **SIREAD Locks** (locks de predicado) para registrar que uma transação leu uma linha ou um índice.
- O motor monitora um grafo em busca de dependências cruzadas de leitura/escrita (*rw-antidependencies*). Se duas transações formarem uma estrutura perigosa que possa resultar em um ciclo não serializável, o PostgreSQL aborta sumariamente uma delas.

O erro retornado pelo PostgreSQL possui o código de estado SQLSTATE `40001`:

```
ERROR: could not serialize access due to read/write dependencies among transactions
DETAIL: Reason code = Canceled on identification as a pivot, during write.
HINT: The transaction might succeed if retried.
```

### O padrão obrigatório de Retry na aplicação

Se você optar por utilizar o nível `SERIALIZABLE` (ou `REPEATABLE READ`), o seu código de aplicação **é obrigado por contrato** a implementar laços de repetição (*retry loops* com *exponential backoff* e *jitter*). Tratar o erro de serialização como uma falha fatal para o usuário é um erro primário de arquitetura.

Exemplo conceitual de implementação resiliente em TypeScript / Node.js:

```typescript
import { Pool, PoolClient } from 'pg';

async function executeWithRetry<T>(
    pool: Pool, 
    operation: (client: PoolClient) => Promise<T>, 
    maxRetries = 5
): Promise<T> {
    let attempt = 0;
    
    while (true) {
        attempt++;
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');
            
            const result = await operation(client);
            
            await client.query('COMMIT');
            return result;
        } catch (error: any) {
            await client.query('ROLLBACK').catch(() => {});
            
            // SQLSTATE 40001: serialization_failure
            // SQLSTATE 40P01: deadlock_detected
            const isRetryable = error.code === '40001' || error.code === '40P01';
            
            if (isRetryable && attempt < maxRetries) {
                // Backoff exponencial com jitter aleatório
                const delayMs = Math.pow(2, attempt) * 50 + Math.random() * 50;
                await new Promise((res) => setTimeout(res, delayMs));
                continue;
            }
            
            throw error; // Erro não recuperável ou estouro de tentativas
        } finally {
            client.release();
        }
    }
}
```

---

## 6. Durabilidade — o que significa uma transação ter sido confirmada?

A **Durabilidade** (*Durability*) garante que, no instante em que o banco de dados confirma o encerramento com sucesso de uma transação via `COMMIT`, os efeitos dessas operações tornam-se permanentes. Eles sobreviverão a falhas de processo, travamento do sistema operacional e quedas súbitas de energia elétrica.

Mas como um sistema gerenciador de banco de dados cumpre essa promessa sem destruir a performance da máquina?

### O problema do Buffer Pool e a solução Write-Ahead Logging (WAL)

Páginas de tabelas e índices em bancos relacionais vivem primariamente na memória RAM (o chamado *Buffer Pool* ou *Shared Buffers* no PostgreSQL). Modificar dados diretamente no disco de forma aleatória a cada transação geraria milhares de escritas randômicas por segundo, colapsando a taxa de operações de entrada e saída por segundo (IOPS) do storage.

Para contornar isso, os motores relacionais utilizam o protocolo **Write-Ahead Logging (WAL)**:

```
[Memória RAM]
1. Transação modifica a página no Shared Buffers (torna-se uma página suja / "dirty page").
2. Transação gera um registro sequencial no WAL Buffer descrevendo a mudança exata em bytes.

[Momento do COMMIT]
3. O banco NÃO grava a página de tabela alterada no arquivo de dados agora.
4. O banco força a escrita SÍNCRONA apenas do WAL Buffer para o arquivo físico de log (WAL file).
5. O banco chama a instrução do sistema operacional fsync() no arquivo de WAL.
6. Somente após o fsync() confirmar que os bytes tocaram a mídia não volátil, o COMMIT OK é retornado ao cliente.
```

Por que o WAL é incrivelmente mais rápido? Porque gravar no log é uma escrita **estritamente sequencial** (*append-only*). Se a energia cair um milissegundo após o `COMMIT`, as páginas de tabela na RAM são perdidas, mas o arquivo de log WAL contém a história completa. Quando o PostgreSQL reiniciar, o processo de recuperação (*crash recovery*) lerá o WAL a partir do último *checkpoint* e reaplicará (*REDO*) cada alteração nas páginas de dados.

### A chamada de sistema `fsync` e as armadilhas de performance

Gravar no disco em sistemas modernos é um processo em camadas:
1. Sua aplicação envia dados para o PostgreSQL.
2. O PostgreSQL faz uma escrita (`write()`) no sistema de arquivos do Linux/macOS.
3. O sistema operacional guarda isso na **Page Cache do Kernel**. Ele ainda não foi gravado no disco! Se a energia cair agora, os dados na cache evaporam.
4. Para garantir a durabilidade real, o banco emite a syscall `fsync()`, que ordena ao controlador de disco que esvazie os buffers voláteis da controladora e grave os blocos nas células físicas do SSD/HD.

#### O trade-off: `synchronous_commit` no PostgreSQL

O PostgreSQL oferece uma alavanca direta entre durabilidade extrema e altíssimo rendimento: o parâmetro `synchronous_commit`.

- **`synchronous_commit = on` (Padrão, Durabilidade ACID estrita):** Cada `COMMIT` aguarda o `fsync` do WAL no disco antes de responder ao cliente. Taxa de commits limitada pela latência de escrita síncrona do storage.
- **`synchronous_commit = off` (Commit assíncrono):** O servidor responde `COMMIT` imediatamente assim que a transação é gravada no buffer de memória do WAL, sem aguardar a conclusão física do `fsync`. Um processo em background (`walwriter`) descarrega os logs periodicamente (a cada ~600ms configuráveis).

> [!WARNING]
> O que acontece se o servidor sofrer uma queda de energia com `synchronous_commit = off`?  
> Você pode perder até algumas centenas de milissegundos das **últimas transações confirmadas**. Porém — e este é um ponto crucial — **o banco de dados NÃO é corrompido**. O estado restaurado será perfeitamente consistente, apenas um pouco defasado no tempo. É uma escolha de engenharia legítima para métricas de telemetria, logs de acesso ou dados de alto volume onde performance pontual supera a garantia absoluta de cada evento individual.

No MySQL InnoDB, o parâmetro equivalente é `innodb_flush_log_at_trx_commit`:
- `1`: Totalmente compatível com ACID (grava e dá flush no disco a cada commit).
- `2`: Grava na page cache do SO a cada commit, mas dá flush no disco uma vez por segundo (resiste a crash do MySQL, perde dados em crash do SO).
- `0`: Grava e dá flush no disco apenas uma vez por segundo.

### Durabilidade NÃO é Backup nem Alta Disponibilidade

Existe uma confusão grave entre Durabilidade, Replicação e Backup:

- **Durabilidade é uma propriedade de nó único:** Ela garante que uma transação gravada no disco sobreviverá a uma reinicialização daquele servidor. Se o datacenter for atingido por um incêndio ou se o disco queimar fisicamente, a durabilidade daquele nó não serve para nada.
- **Replicação e Alta Disponibilidade (HA):** Replicar transações para outros servidores (via Streaming Replication física ou protocolos de consenso como Raft/Paxos) protege a continuidade da operação caso a máquina primária morra.
- **Backups e Planos de Recuperação (DRP):** Se um desenvolvedor rodar `DELETE FROM clientes;` em produção sem cláusula `WHERE`, o banco executará a instrução com **100% de durabilidade e atomicidade**. O ACID preservará a deleção para sempre com máxima integridade mecânica. O que salva a empresa nesse cenário é um backup restaurável e testado com recuperação pontual (*Point-in-Time Recovery* — PITR).

### O caso clássico da desconexão de rede durante o COMMIT

Considere a seguinte sequência de eventos no mundo real:

```
1. Aplicação web envia COMMIT para o PostgreSQL.
2. PostgreSQL grava no WAL, executa fsync(), conclui a transação com sucesso absoluto.
3. PostgreSQL prepara o pacote de resposta TCP "COMMIT OK" e o envia para o socket.
4. [A conexão de rede é interrompida abruptamente por um switch ou timeout de proxy].
5. A aplicação web recebe um SocketTimeoutException ou ECONNRESET.
```

O que a sua aplicação faz? Se ela presumir que a operação falhou e reenviar a requisição de cobrança ou transferência cegamente, **o cliente será cobrado duas vezes**. A transação foi efetivada com pleno sucesso no banco, mas a confirmação nunca chegou de volta ao emissor.

A única solução sólida de engenharia para esse problema é o uso de **Chaves de Idempotência** (*Idempotency Keys*), onde cada operação financeira carrega um identificador único originado pelo cliente. Antes de reenviar qualquer transação ambígua, o sistema consulta a existência da chave persistida no banco.

---

## 7. ACID na prática: construa um exemplo completo

Vamos agora juntar todas as peças em um cenário de transferência financeira no PostgreSQL, projetado profissionalmente para suportar alta concorrência sem sofrer de Lost Updates, Deadlocks ou estouro de saldo.

### 1. Modelagem com proteção estrita

```sql
-- Limpa resquícios anteriores caso existam
DROP TABLE IF EXISTS transferencias CASCADE;
DROP TABLE IF EXISTS contas CASCADE;

-- Tabela de contas
CREATE TABLE contas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titular VARCHAR(100) NOT NULL,
    saldo NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    versao INTEGER NOT NULL DEFAULT 1,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_saldo_positivo CHECK (saldo >= 0.00)
);

-- Tabela de auditoria e controle de idempotência
CREATE TABLE transferencias (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    idempotency_key UUID NOT NULL UNIQUE,
    conta_origem_id BIGINT NOT NULL REFERENCES contas(id),
    conta_destino_id BIGINT NOT NULL REFERENCES contas(id),
    valor NUMERIC(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'concluida',
    criada_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_valor_positivo CHECK (valor > 0.00),
    CONSTRAINT chk_contas_distintas CHECK (conta_origem_id <> conta_destino_id)
);

-- Índices essenciais para consultas de integridade
CREATE INDEX idx_transferencias_origem ON transferencias(conta_origem_id);
CREATE INDEX idx_transferencias_destino ON transferencias(conta_destino_id);

-- Carga inicial de dados
INSERT INTO contas (titular, saldo) VALUES ('Alice', 500.00);  -- id: 1
INSERT INTO contas (titular, saldo) VALUES ('Bob', 200.00);    -- id: 2
```

### 2. A anatomia do erro INGÊNUO em concorrência

Veja como um desenvolvedor júnior costuma implementar uma transferência na aplicação sob o nível padrão `READ COMMITTED`:

```sql
-- Código ingênuo (NÃO FAÇA ISSO EM PRODUÇÃO)
BEGIN;

-- 1. Lê o saldo na aplicação
SELECT saldo FROM contas WHERE id = 1; -- Aplicação vê 500.00 e valida: 500 >= 100? Sim!

-- 2. Debita de Alice
UPDATE contas SET saldo = saldo - 100.00 WHERE id = 1;

-- 3. Credita Bob
UPDATE contas SET saldo = saldo + 100.00 WHERE id = 2;

COMMIT;
```

**Por que isso quebra sob concorrência?**  
Se dez requisições simultâneas chegarem para transferir R$ 100,00 da conta de Alice (que só tem R$ 500,00), todas as dez sessões lerão o saldo inicial de R$ 500,00 ao mesmo tempo. As cinco primeiras conseguirão debitar; a sexta tentará debitar e colidirá com a nossa constraint `CHECK (saldo >= 0)`, explodindo com exceção não tratada na cara do cliente. E se não tivéssemos a constraint, Alice ficaria com saldo negativo de -R$ 500,00!

### 3. Estratégia Robusta A: Atualização Condicional Atômica

A maneira mais performática e elegante de debitar um saldo no PostgreSQL sem criar gargalos desnecessários de lock é delegar a verificação de saldo para a própria cláusula `WHERE` do comando `UPDATE`:

```sql
BEGIN;

-- O próprio UPDATE atômico garante que o débito só ocorre se houver fundos suficientes
UPDATE contas 
SET saldo = saldo - 100.00,
    versao = versao + 1,
    atualizado_em = CURRENT_TIMESTAMP
WHERE id = 1 AND saldo >= 100.00;

-- A aplicação verifica o número de linhas afetadas (Row Count).
-- Se Row Count == 0, significa que Alice não tem saldo!
-- A aplicação imediatamente dispara ROLLBACK e retorna "Saldo insuficiente".

UPDATE contas 
SET saldo = saldo + 100.00,
    versao = versao + 1,
    atualizado_em = CURRENT_TIMESTAMP
WHERE id = 2;

INSERT INTO transferencias (idempotency_key, conta_origem_id, conta_destino_id, valor)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 2, 100.00);

COMMIT;
```

### 4. Estratégia Robusta B: Bloqueio Pessimista (`FOR UPDATE`) com Prevenção de Deadlock

Quando você precisa inspecionar o saldo, calcular juros complexos ou avaliar regras de crédito antes de alterar qualquer valor, você deve adquirir um bloqueio exclusivo de linha com `SELECT ... FOR UPDATE`.

Mas atenção: **como evitar deadlocks ao bloquear duas contas?**

Se a Sessão 1 estiver transferindo de 1 para 2, e a Sessão 2 estiver transferindo de 2 para 1 concorrentemente:
- Sessão 1 bloqueia 1 e pede 2.
- Sessão 2 bloqueia 2 e pede 1.
- **Deadlock imediato.**

A regra definitiva de engenharia para evitar esse deadlock é: **sempre adquira locks em ordem determinística** (por exemplo, sempre bloqueie primeiro o menor ID, independentemente de ser origem ou destino).

```sql
BEGIN;

-- Bloqueia ambas as contas ordenadas estritamente pelo ID numérico
-- Isso garante que nenhuma transação concorrente tente obter locks em ordem inversa!
SELECT id, titular, saldo 
FROM contas 
WHERE id IN (1, 2) 
ORDER BY id 
FOR UPDATE;

-- Agora a aplicação tem exclusividade garantida sobre as duas linhas.
-- Nenhuma outra transação pode alterar os saldos de Alice ou Bob até o nosso COMMIT.

-- Valida saldo em memória: Alice tem pelo menos 100.00? Sim!

UPDATE contas SET saldo = saldo - 100.00 WHERE id = 1;
UPDATE contas SET saldo = saldo + 100.00 WHERE id = 2;

INSERT INTO transferencias (idempotency_key, conta_origem_id, conta_destino_id, valor)
VALUES ('b1ffcd88-8b1a-4ef8-aa5c-5aa8ac270b22', 1, 2, 100.00);

COMMIT;
```

### Teste prático de duas sessões concorrentes

Para você reproduzir esse comportamento no seu terminal, abra duas janelas de `psql`:

#### Sessão 1:
```sql
BEGIN;
SELECT saldo FROM contas WHERE id = 1 FOR UPDATE;
-- Retorna saldo = 500.00 e segura o lock de linha na conta 1!
```

#### Sessão 2 (no outro terminal, logo em seguida):
```sql
BEGIN;
UPDATE contas SET saldo = saldo - 50.00 WHERE id = 1;
-- O cursor fica piscando e o comando NÃO retorna. 
-- A Sessão 2 está limpa e seguramente pausada, aguardando a Sessão 1 liberar a linha!
```

#### De volta à Sessão 1:
```sql
UPDATE contas SET saldo = saldo - 100.00 WHERE id = 1;
COMMIT;
-- No instante exato em que a Sessão 1 dá COMMIT, a Sessão 2 acorda instantaneamente,
-- enxerga o novo saldo de 400.00 e executa sua alteração com integridade total!
```

---

## 8. O que ACID não garante

Para se tornar um engenheiro sênior de backend, tão importante quanto saber o que uma ferramenta faz é ter clareza cirúrgica sobre o que ela **não** faz.

O modelo ACID é frequentemente cercado de falsas premissas:

```
                  ┌──────────────────────────────────────────────┐
                  │              O QUE O ACID NÃO É              │
                  ├──────────────────────────────────────────────┤
                  │ ✘ Não é corretor de lógica de negócio        │
                  │ ✘ Não impede bugs de código da aplicação     │
                  │ ✘ Não é sistema de segurança ou autorização  │
                  │ ✘ Não elimina deadlocks (pode causá-los)     │
                  │ ✘ Não garante alta performance infinita      │
                  │ ✘ Não recupera dados deletados com sucesso   │
                  │ ✘ Não desfaz chamadas HTTP e APIs externas   │
                  │ ✘ Não oferece atomicidade distribuída nativa │
                  └──────────────────────────────────────────────┘
```

1. **Correção das regras de negócio:** O banco é neutro. Se você transferir R$ 100 da conta errada porque trocou as variáveis no seu controller, a transação ACID será executada com impecável integridade técnica. O seu erro de negócio foi imortalizado no disco.
2. **Ausência de bugs na aplicação:** Memory leaks, loops infinitos, exceções não tratadas e cálculos incorretos continuam derrubando o seu software, independentemente de quão robusto seja o banco.
3. **Segurança e controle de acesso:** ACID não impede SQL Injection, nem vazamento de dados por credenciais expostas, nem que um usuário acerte um ID de outro usuário sem verificação de autorização no backend.
4. **Ausência de deadlocks:** É justamente a existência das garantias de Isolamento que **cria** a possibilidade de deadlocks. O motor do banco gerencia locks para evitar corrupção, e o preço disso é a necessidade de abortar transações quando ocorrem ciclos de bloqueio.
5. **Performance mágica sob qualquer carga:** Quanto mais alto o nível de isolamento e mais estrita a durabilidade, mais contenção de disco e memória você cria. Serializabilidade perfeita reduz a concorrência máxima teórica do sistema.
6. **Recuperação de desastres humanos:** Um `DROP TABLE` acidental rodado em produção é executado atomicamente e com durabilidade definitiva. O banco não adivinha arrependimentos.
7. **Consistência atômica com APIs externas:** Como vimos, o banco de dados não tem jurisdição sobre sistemas de terceiros. Se a sua transação falhar depois de disparar uma mensagem para o Twilio ou Stripe, o rollback não cancelará o SMS nem a cobrança.
8. **Atomicidade global entre múltiplos bancos ou microsserviços:** Uma transação ACID no PostgreSQL protege apenas as tabelas gerenciadas por aquela instância física de banco. Ela não cobre o MongoDB do serviço vizinho nem a fila do RabbitMQ.

---

## 9. ACID em sistemas distribuídos e arquiteturas modernas

Quando uma arquitetura migra de um monolito com banco relacional único para microsserviços ou sistemas baseados em eventos, a primeira baixa imediata são as garantias ACID locais.

### O problema do Dual Write

Considere um fluxo clássico de criação de pedidos:
1. O serviço salva o pedido no PostgreSQL local.
2. O serviço publica o evento `PedidoCriado` no Apache Kafka ou RabbitMQ para que o serviço de estoque reserve os itens.

Como escrever esse código de forma confiável?

```typescript
// Cenário A: Salva no banco primeiro
await db.query('BEGIN');
await db.query('INSERT INTO pedidos ...');
await db.query('COMMIT');

// O servidor cai aqui! Falha de rede ou queda de energia.
await kafkaProducer.send({ topic: 'pedidos', message: 'PedidoCriado' }); // NUNCA EXECUTADO!
```

No Cenário A, o pedido foi confirmado no banco de dados, mas o evento nunca chegou ao Kafka. O cliente teve seu cartão cobrado, mas a logística nunca soube da existência do pedido.

E se invertermos a ordem?

```typescript
// Cenário B: Publica no broker primeiro
await kafkaProducer.send({ topic: 'pedidos', message: 'PedidoCriado' });

// O banco rejeita a inserção (ex.: erro de constraint ou timeout)
await db.query('INSERT INTO pedidos ...'); // EXPLODE!
```

No Cenário B, o evento de pedido criado foi emitido para toda a empresa, os robôs do armazém começaram a separar os produtos, mas o registro oficial do pedido não existe no banco!

Isso é o infame **Dual Write Problem**. Não existe transação ACID local que envolva um banco de dados e um message broker independente.

### O padrão Transactional Outbox

A solução padrão da indústria para restaurar a consistência em arquiteturas modernas é o padrão **Transactional Outbox**:

```
                       ┌──────────────────────────────────────────────┐
                       │           BANCO DE DADOS RELACIONAL          │
                       │                                              │
  Aplicação ──────────►│  BEGIN TRANSACTION                           │
                       │    1. INSERT INTO pedidos (...);             │
                       │    2. INSERT INTO outbox_events (...);       │
                       │  COMMIT;                                     │
                       └──────────────────────┬───────────────────────┘
                                              │
                                              ▼ (Lê tabela outbox ou CDC/Debezium)
                                   ┌──────────────────────┐
                                   │   Outbox Publisher   │
                                   └──────────┬───────────┘
                                              │ Publica com At-Least-Once
                                              ▼
                                   ┌──────────────────────┐
                                   │     Kafka Broker     │
                                   └──────────────────────┘
```

Como funciona:
1. Criamos uma tabela chamada `outbox_events` **no mesmo banco de dados** onde residem as tabelas de negócio.
2. Quando salvamos o pedido, inserimos na mesma transação local um registro na tabela `outbox_events`.
3. Como ambas as operações estão no mesmo banco, elas desfrutam da **Atomicidade ACID local**. Ou ambas são gravadas, ou nenhuma é.
4. Um processo separado (um worker de pooling ou um conector de Change Data Capture como o Debezium, que lê diretamente o WAL do PostgreSQL) lê a tabela de outbox e publica as mensagens no Kafka com garantia de entrega *At-Least-Once*.
5. O consumidor do outro lado deve ser implementado de forma **idempotente**, usando a chave da mensagem para descartar entregas duplicadas.

### Sagas vs. Transações ACID

Quando um processo de negócio precisa cruzar múltiplos microsserviços (ex.: Pedidos ➔ Pagamentos ➔ Estoque ➔ Nota Fiscal), a abordagem arquitetural recomendada é o padrão **Saga**.

Uma Saga é uma sequência de transações ACID locais distribuídas em vários serviços. Cada etapa atualiza seu próprio banco e emite uma mensagem que aciona o próximo passo.

> [!WARNING]
> Uma Saga **NÃO possui a propriedade de Isolamento (o "I" do ACID)**.  
> Durante a execução de uma Saga, os estados intermediários ficam publicamente visíveis no banco de cada serviço. Se o passo 3 falhar, a Saga dispara **Transações de Compensação** para desfazer os passos 1 e 2. Durante esse intervalo, outros processos podem ter lido dados temporários que acabarão sendo cancelados. Lidar com essa falta de isolamento exige técnicas de domínio específicas, como o uso de estados semânticos transitórios (`pendente_aprovacao`, `bloqueado_para_reserva`).

E o antigo **Two-Phase Commit (2PC / XA)**? Embora o 2PC ofereça atomicidade entre múltiplos bancos de dados, ele é praticamente inviável em ambientes de microsserviços em nuvem: é um protocolo bloqueante síncrono que derruba a disponibilidade global de todo o sistema se um único participante ficar inacessível ou sofrer latência de rede.

---

## 10. Comparação entre bancos de dados

Embora todos os quatro grandes bancos relacionais afirmem suportar ACID, a mecânica interna pela qual entregam essas propriedades é muito diferente:

| Característica | PostgreSQL | MySQL (InnoDB) | SQLite | Microsoft SQL Server |
| :--- | :--- | :--- | :--- | :--- |
| **Nível Padrão de Isolamento** | `READ COMMITTED` | `REPEATABLE READ` | `SERIALIZABLE` | `READ COMMITTED` (com locks pessimistas por padrão) |
| **Implementação do MVCC** | Grava novas tuplas diretamente no heap da tabela (`xmin`/`xmax`). | Clustered Index + páginas de Undo Log em Rollback Segments. | Rollback Journal (padrão) ou WAL dedicado. Suporta apenas um escritor por vez. | Baseado em locks compartilhados por padrão. Suporta MVCC via `READ_COMMITTED_SNAPSHOT` ou `SNAPSHOT` usando o banco `tempdb`. |
| **Limpeza de Versões Antigas** | Processo em segundo plano `VACUUM` / `autovacuum`. | Processo interno `purge thread` limpa páginas do Undo Log. | Não requer garbage collector; sobrescrita direta ao reciclar journal/WAL. | As versões antigas em `tempdb` são limpas automaticamente por um thread de limpeza de versões. |
| **Prevenção de Phantom Reads no nível padrão** | Não previne no nível padrão. Previne em `REPEATABLE READ` via Snapshot Isolation. | **Previne** em `REPEATABLE READ` via Next-Key Locks (Index Record Lock + Gap Lock) para leituras com lock. | Previne, pois serializa todas as transações de escrita no arquivo. | Não previne no padrão. Exige `SNAPSHOT`, `REPEATABLE READ` ou `SERIALIZABLE`. |
| **Implementação de SERIALIZABLE** | **SSI (Serializable Snapshot Isolation)**. Rastreia conflitos em memória sem bloquear leituras. | Bloqueio pessimista tradicional: converte todas as leituras comuns em `LOCK IN SHARE MODE`. | Trava exclusiva no arquivo inteiro do banco de dados para escrita. | Bloqueios pessimistas de intervalo de chaves (*Key-Range Locks*). |
| **Controle de Durabilidade** | `synchronous_commit` (`on`, `off`, `local`, `remote_write`). | `innodb_flush_log_at_trx_commit` (`1`, `2`, `0`). | `PRAGMA synchronous` (`FULL`, `NORMAL`, `OFF`). | Configuração de banco `DELAYED_DURABILITY` (`DISABLED`, `ALLOWED`, `FORCED`). |

### Nuances que você precisa saber

- **PostgreSQL vs. MySQL no Isolamento:** Enquanto o PostgreSQL adota `READ COMMITTED` por padrão para privilegiar throughput e evitar cancelamentos inesperados de transação, o MySQL adota `REPEATABLE READ` por padrão, usando Gap Locks para trancar intervalos inteiros de índices.
- **SQLite:** Por ser uma biblioteca embarcada que opera em arquivo local, no modo tradicional de journal o SQLite adquire um lock no arquivo todo: múltiplos leitores podem ler ao mesmo tempo, mas se alguém for escrever, ninguém mais lê nem escreve. No modo WAL (`PRAGMA journal_mode=WAL;`), ele permite múltiplos leitores simultâneos com exatamente um escritor simultâneo.
- **SQL Server:** É o único dos quatro que, em sua configuração original histórica, implementa o nível `READ COMMITTED` segurando locks de leitura compartilhados (*S-locks*), o que faz com que uma leitura simples bloqueie um `UPDATE` concorrente naquela linha. Para fazer o SQL Server se comportar com MVCC moderno (leitores não bloqueando escritores), os administradores precisam habilitar explicitamente a flag de banco `ALTER DATABASE MeuBanco SET READ_COMMITTED_SNAPSHOT ON;`.

---

## 11. Desempenho, bloqueios e decisões de engenharia

Em sistemas com tráfego intenso, a esmagadora maioria dos incidentes de banco de dados não é causada por falta de CPU ou RAM. É causada por **más decisões de concorrência e gerenciamento descuidado de transações**.

### O maior crime contra a performance: a transação longa

Analise o seguinte trecho de código, comum em sistemas corporativos:

```typescript
// ANTI-PATTERN GRAVE: Transação longa com I/O de rede
async function processarCheckout(pedidoId: number) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // 1. Bloqueia o pedido no banco
        await client.query('SELECT * FROM pedidos WHERE id = $1 FOR UPDATE', [pedidoId]);
        
        // 2. Chamada HTTP externa para um gateway de pagamento (latência: 1.5 a 4 segundos!)
        const cobranca = await axios.post('https://api.pagamentos.com/charges', { ... });
        
        // 3. Atualiza o status
        await client.query('UPDATE pedidos SET status = $1 WHERE id = $2', [cobranca.status, pedidoId]);
        
        await client.query('COMMIT');
    } finally {
        client.release();
    }
}
```

**O que há de errado com isso?**  
Manter uma transação de banco de dados aberta enquanto sua aplicação espera uma resposta HTTP externa é desastroso:

1. **Locks segurados por segundos:** Qualquer outra requisição que precise tocar naquela linha ficará congelada esperando o lock ser liberado.
2. **Esgotamento do Pool de Conexões:** Se a API de pagamentos sofrer uma lentidão momentânea e demorar 5 segundos para responder, 100 requisições simultâneas prenderão 100 conexões ativas do seu pool (HikariCP, PgBouncer, etc.). Em 10 segundos, o pool esgota, novos endpoints simples de `SELECT` começam a tomar timeout e a **sua API inteira sai do ar**.
3. **Bloqueio do `VACUUM` no PostgreSQL:** O `autovacuum` do PostgreSQL não pode remover tuplas mortas mais recentes do que a transação ativa mais antiga do sistema (`xmin horizon`). Uma única transação esquecida aberta por horas impede a limpeza do banco, gerando inchaço severo de tabelas e índices (*table bloat*).

> **Regra de Ouro da Engenharia de Banco de Dados:**  
> **Nunca, sob hipótese alguma, faça chamadas de rede externas, envio de e-mails, processamento de arquivos pesados ou aguarde interações de usuário dentro de uma transação de banco de dados.**  
> Prepare todos os dados antes, abra a transação, execute apenas os comandos SQL essenciais e feche com `COMMIT` no menor número possível de milissegundos.

### Investigando contenção em vez de baixar o isolamento cegamente

Quando um sistema começa a apresentar lentidão, muitos desenvolvedores simplesmente diminuem o nível de isolamento de forma desesperada, abrindo as portas para corrupção de dados. A abordagem correta é investigar as fontes reais de contenção no PostgreSQL:

#### 1. Identificar transações abertas e presas:
```sql
SELECT 
    pid, 
    now() - xact_start AS duracao_transacao,
    state, 
    query 
FROM pg_stat_activity 
WHERE state IN ('idle in transaction', 'active') 
  AND xact_start IS NOT NULL
ORDER BY duracao_transacao DESC;
```

Se você encontrar conexões com estado `'idle in transaction'` com minutos de duração, você tem um bug na sua aplicação: código que abriu `BEGIN`, executou algo e esqueceu de dar `COMMIT` ou `ROLLBACK` em algum caminho de tratamento de erros.

#### 2. Investigar transações esperando por locks:
```sql
SELECT 
    blocked_locks.pid     AS pid_bloqueado,
    blocked_activity.usename  AS usuario_bloqueado,
    blocking_locks.pid    AS pid_bloqueador,
    blocking_activity.usename AS usuario_bloqueador,
    blocked_activity.query    AS query_bloqueada,
    blocking_activity.query   AS query_bloqueadora
FROM  pg_catalog.pg_locks         blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks         blocking_locks 
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

Essa consulta mostra exatamente qual processo está travando o sistema e qual instrução SQL originou o bloqueio.

### O papel dos índices na concorrência

Você já se perguntou como a falta de um índice pode destruir a concorrência do seu banco?

Imagine um comando de exclusão ou atualização:
```sql
UPDATE pedidos SET status = 'processando' WHERE codigo_rastreio = 'BR123456789';
```

Se a coluna `codigo_rastreio` **não tiver um índice**:
1. O PostgreSQL não consegue ir direto à linha desejada. Ele é obrigado a fazer um **Sequential Scan**, lendo todas as páginas da tabela do início ao fim.
2. Durante a varredura, dependendo do modo de lock ou do nível de isolamento, ele pode adquirir locks em linhas sequenciais ou elevar a contenção de predicado no SSI para a tabela inteira!
3. Com o índice presente, o banco vai cirurgicamente no ponteiro exato da tupla via *Index Scan*, adquire o lock exclusivamente naquela única linha e libera o restante da tabela para ser manipulado por outros workers sem qualquer atrito.

---

## 12. Referências técnicas e bibliografia

Este artigo foi construído com base na leitura e verificação direta das fontes primárias da documentação técnica e de trabalhos fundacionais da ciência da computação:

### Documentação Primária dos SGBDs

1. **PostgreSQL Global Development Group.** *PostgreSQL 17 Documentation: Tutorial — Transactions*. Disponível em: <https://www.postgresql.org/docs/current/tutorial-transactions.html>. Acesso em: 29 out. 2026.
2. **PostgreSQL Global Development Group.** *PostgreSQL 17 Documentation: Concurrency Control — Transaction Isolation*. Disponível em: <https://www.postgresql.org/docs/current/transaction-iso.html>. Acesso em: 29 out. 2026.
3. **PostgreSQL Global Development Group.** *PostgreSQL 17 Documentation: Concurrency Control — Explicit Locking*. Disponível em: <https://www.postgresql.org/docs/current/explicit-locking.html>. Acesso em: 29 out. 2026.
4. **PostgreSQL Global Development Group.** *PostgreSQL 17 Documentation: Data Definition — Constraints*. Disponível em: <https://www.postgresql.org/docs/current/ddl-constraints.html>. Acesso em: 29 out. 2026.
5. **PostgreSQL Global Development Group.** *PostgreSQL 17 Documentation: Reliability and the Write-Ahead Log*. Disponível em: <https://www.postgresql.org/docs/current/wal-intro.html>. Acesso em: 29 out. 2026.
6. **Oracle Corporation.** *MySQL 8.4 Reference Manual: InnoDB and the ACID Model*. Disponível em: <https://dev.mysql.com/doc/refman/8.4/en/innodb-acid-model.html>. Acesso em: 29 out. 2026.
7. **Oracle Corporation.** *MySQL 8.4 Reference Manual: InnoDB Transaction Isolation Levels*. Disponível em: <https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html>. Acesso em: 29 out. 2026.
8. **Hipp, D. Richard et al.** *SQLite Documentation: SQLite Is Transactional*. Disponível em: <https://www.sqlite.org/transactional.html>. Acesso em: 29 out. 2026.
9. **Hipp, D. Richard et al.** *SQLite Documentation: Atomic Commit in SQLite*. Disponível em: <https://www.sqlite.org/atomiccommit.html>. Acesso em: 29 out. 2026.
10. **Microsoft Corporation.** *Microsoft Learn: Guia de Bloqueio de Transação e Controle de Versão de Linha no SQL Server*. Disponível em: <https://learn.microsoft.com/pt-br/sql/relational-databases/sql-server-transaction-locking-and-row-versioning-guide?view=sql-server-ver17>. Acesso em: 29 out. 2026.
11. **IBM Corporation.** *IBM Documentation: ACID Properties of Transactions in TXSeries*. Disponível em: <https://www.ibm.com/docs/en/cics-tx/11.1.0?topic=processing-acid-properties-transactions>. Acesso em: 29 out. 2026.

### Trabalhos Acadêmicos e Artigos Fundacionais

12. **Gray, Jim.** *The Transaction Concept: Virtues and Limitations*. Proceedings of the 7th International Conference on Very Large Data Bases (VLDB), 1981, pp. 144–154. Artigo histórico que formulou formalmente o conceito de Unidade Lógica de Trabalho e transações de banco de dados.
13. **Haerder, Theo; Reuter, Andreas.** *Principles of Transaction-Oriented Database Recovery*. ACM Computing Surveys (CSUR), vol. 15, no. 4, 1983, pp. 287–317. Trabalho pioneiro que cunhou e popularizou a sigla **ACID**.
14. **Berenson, Hal; Bernstein, Phil; Gray, Jim; Melton, Jim; O'Neil, Elizabeth; O'Neil, Patrick.** *A Critique of ANSI SQL Isolation Levels*. ACM SIGMOD Record, vol. 24, no. 2, 1995, pp. 1–10. Demonstração clássica das fragilidades e anomalias não mapeadas pelo padrão ANSI SQL-92.
15. **Cahill, Michael J.; Röhm, Uwe; Fekete, Alan D.** *Serializable Isolation for Snapshot Databases*. ACM Transactions on Database Systems (TODS), vol. 34, no. 4, 2009, pp. 20:1–20:42. A base teórica da implementação do SSI utilizada pelo PostgreSQL moderno.

---

## Conclusão: a responsabilidade que nenhum banco tira das suas costas

As propriedades ACID são uma das maiores conquistas da engenharia de software no último meio século. Elas libertaram os desenvolvedores da tarefa inglória de construir algoritmos artesanais de recuperação de disco e locks em arquivos locais para cada novo sistema em desenvolvimento.

Contudo, confiar cegamente nas quatro letras da sigla como se fossem um escudo mágico contra más decisões de projeto é a receita perfeita para sistemas frágeis, corrupções silenciosas de saldo e apagões em dias de pico.

Ao desenhar a próxima funcionalidade crítica do seu sistema, deixe sempre esta pergunta ecoando na sua cabeça:

> **"Quando eu escrevo esta operação que altera o estado do sistema, sei exatamente quais garantias o meu banco está me oferecendo por padrão — e quais continuam sendo de minha exclusiva responsabilidade?"**

Se você souber responder a isso com clareza, você deixou de ser apenas alguém que faz CRUD e passou a ser o engenheiro que projeta sistemas verdadeiramente resilientes.
