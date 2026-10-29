---
title: "ACID en bases de datos: los fundamentos que todo desarrollador debería dominar de verdad"
description: "Guía exhaustiva sobre Atomicidad, Consistencia, Aislamiento y Durabilidad: anomalías de concurrencia, MVCC, WAL, PostgreSQL vs MySQL y los límites del motor relacional."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/acid-em-bancos-de-dados.webp"
coverAlt: "Diagrama esquemático minimalista que ilustra transacciones en bases de datos consolidadas a través de niveles de aislamiento"
category: "Bases de Datos"
tags:
  - "PostgreSQL"
  - "Bases de Datos"
  - "ACID"
  - "Concurrencia"
  - "Backend"
  - "Arquitectura"
draft: false
lang: "es"
translationKey: "acid-databases"
---

En prácticamente cualquier entrevista técnica para posiciones de ingeniería backend o datos, la pregunta surge en algún momento: *“¿Qué significa la sigla ACID?”*. Casi todo el mundo tiene la respuesta memorizada: Atomicidad, Consistencia, Aislamiento (Isolation) y Durabilidad. Cuatro términos elegantes, aprendidos de diapositivas universitarias o resúmenes rápidos de certificación.

El problema real comienza el lunes siguiente, en producción.

Cuando una cola de mensajería dispara diez workers en simultáneo intentando debitar el mismo saldo, cuando un webhook de pagos llega duplicado por inestabilidad de red, o cuando una transacción abierta retiene bloqueos (locks) durante cinco segundos mientras espera una llamada HTTP externa y satura el pool de conexiones de la API, la definición de manual no sirve de nada.

Muchos desarrolladores tratan a la base de datos relacional como un armario mágico: abres la puerta con `BEGIN`, colocas tres sentencias SQL dentro, cierras con `COMMIT` y asumes que el motor resolverá cualquier condición de carrera, evitará duplicados y mantendrá las reglas de negocio a salvo. La realidad operativa es muy diferente.

Las propiedades ACID no son magia ni garantías absolutas de corrección de negocio. Son un conjunto riguroso de garantías mecánicas que el motor proporciona bajo contratos y configuraciones muy específicas, y con costos claros en latencia, contención y complejidad arquitectónica.

En esta guía, analizamos el modelo ACID en profundidad. Sin resúmenes superficiales de cuatro párrafos ni analogías infantiles. Construiremos el entendimiento a partir de código ejecutable: examinando el comportamiento interno del motor PostgreSQL, analizando anomalías reales de concurrencia, explorando mecanismos de almacenamiento como MVCC y Write-Ahead Logging (WAL), contrastando cómo distintos motores implementan estas garantías y delimitando con precisión dónde termina la responsabilidad de la base de datos y dónde comienza la tuya.

---

## 1. Comienza por el problema, no por la sigla

Para entender por qué existen las propiedades ACID, no empieces por el paper teórico de Jim Gray en 1981. Empieza por un error financiero clásico.

Imagina un sistema bancario simplificado. Alicia tiene una cuenta (`id = 1`) con un saldo de $500.00. Roberto tiene una cuenta (`id = 2`) con un saldo de $200.00. Alicia decide transferir $100.00 a Roberto.

En términos de instrucciones SQL físicas ejecutadas contra el motor, esta operación requiere al menos dos pasos discretos:

```sql
-- Paso 1: Deducir $100 de la cuenta de Alicia
UPDATE accounts SET balance = balance - 100.00 WHERE id = 1;

-- Paso 2: Acreditar $100 en la cuenta de Roberto
UPDATE accounts SET balance = balance + 100.00 WHERE id = 2;
```

Si ejecutamos estas dos instrucciones de manera aislada, fuera de cualquier límite transaccional, ¿qué sucede si el servidor sufre una caída de tensión, un fallo de kernel (*kernel panic*) o una terminación forzada (`SIGKILL`) por el OOM killer exactamente entre el Paso 1 y el Paso 2?

El resultado es crítico:

1. El Paso 1 se escribió en disco. El saldo de Alicia bajó a $400.00.
2. El Paso 2 nunca llegó a ejecutarse. El saldo de Roberto se mantuvo en $200.00.
3. $100.00 desaparecieron del balance de la entidad.

No hubo errores de sintaxis. Cada sentencia SQL individual era totalmente válida. La inconsistencia ocurrió porque una transferencia de fondos no es un conjunto de operaciones sueltas: es una **Unidad Lógica de Trabajo** (*Logical Unit of Work* — LUW). Desde el punto de vista del dominio, debitar a Alicia y acreditar a Roberto es un evento indivisible. O suceden ambos, o ninguno de los dos debe haber ocurrido.

### El concepto de transacción

De esta necesidad nace el concepto formal de **transacción**. Una transacción es un delimitador que indica al sistema gestor de base de datos (SGBD) que una secuencia de operaciones debe tratarse como un bloque único e indivisible.

En el estándar SQL y en PostgreSQL, los delimitadores fundamentales son:

- `BEGIN` (o `START TRANSACTION`): marca el inicio de una nueva unidad transaccional.
- `COMMIT`: instruye al motor para que todas las modificaciones sean definitivas, visibles y permanentes.
- `ROLLBACK`: instruye al motor para descartar inmediatamente todas las alteraciones pendientes, restaurando el estado exacto previo a `BEGIN`.

```sql
BEGIN;

UPDATE accounts SET balance = balance - 100.00 WHERE id = 1;
UPDATE accounts SET balance = balance + 100.00 WHERE id = 2;

COMMIT;
```

Si ocurre cualquier falla antes de `COMMIT`, o si la aplicación aborta la operación, el motor ejecuta un `ROLLBACK`, garantizando que ningún estado intermedio corrompa los datos.

### Atomicidad de sentencia única vs. atomicidad de múltiples sentencias

Es habitual que los ingenieros confundan estos dos niveles de atomicidad:

1. **Atomicidad de instrucción única (*Single-Statement Atomicity*):** Incluso sin escribir `BEGIN`, casi todos los motores tratan cada sentencia SQL individual como una transacción implícita (modo *autocommit*). Si ejecutas un `UPDATE` masivo que modifica 50.000 filas y en la fila 49.999 se produce una violación de constraint, el motor revierte toda la sentencia. Ninguna de las 49.998 filas anteriores queda modificada.
2. **Atomicidad de transacción multisentencia (*Multi-Statement Transaction Atomicity*):** Es la capacidad de extender esta garantía de indivisibilidad a través de múltiples sentencias (`UPDATE`, `INSERT`, `DELETE`) en distintas tablas, consolidándolas o descartándolas en conjunto.

Las propiedades ACID son el marco mecánico que hace confiable esta abstracción ante concurrencia masiva y fallas de hardware.

---

## 2. Atomicidad — Todo o nada

La **Atomicidad** (*Atomicity*) determina que una transacción no posee estados parciales observables. O todas las operaciones que la componen se aplican con éxito y se persisten, o el sistema vuelve al estado rigurosamente idéntico al que tenía antes de iniciar la transacción.

La palabra proviene del griego *atomos* (indivisible). En bases de datos, significa que una transacción no puede quedar fragmentada por fallas o interrupciones.

### Ejemplo práctico en PostgreSQL

Definamos un esquema de prueba en PostgreSQL:

```sql
-- 1. Creación de tablas
CREATE TABLE accounts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_name VARCHAR(100) NOT NULL,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_balance_non_negative CHECK (balance >= 0)
);

CREATE TABLE transfers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_account_id BIGINT NOT NULL REFERENCES accounts(id),
    destination_account_id BIGINT NOT NULL REFERENCES accounts(id),
    amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_positive_amount CHECK (amount > 0),
    CONSTRAINT chk_distinct_accounts CHECK (source_account_id <> destination_account_id)
);

-- 2. Estado inicial
INSERT INTO accounts (owner_name, balance) VALUES ('Alicia', 500.00);
INSERT INTO accounts (owner_name, balance) VALUES ('Roberto', 200.00);
```

#### Caso exitoso: COMMIT

```sql
BEGIN;

-- Débito de Alicia
UPDATE accounts 
SET balance = balance - 100.00 
WHERE id = 1;

-- Crédito de Roberto
UPDATE accounts 
SET balance = balance + 100.00 
WHERE id = 2;

-- Registro de auditoría
INSERT INTO transfers (source_account_id, destination_account_id, amount)
VALUES (1, 2, 100.00);

COMMIT;
```

Tras el `COMMIT`:
- Alicia posee $400.00.
- Roberto posee $300.00.
- Queda registrado el movimiento en `transfers`.

#### Caso de fallo: ROLLBACK automático

```sql
BEGIN;

-- Intento de transferir $450 desde la cuenta de Alicia (cuyo saldo es $400)
-- Esto viola la restricción chk_balance_non_negative
UPDATE accounts 
SET balance = balance - 450.00 
WHERE id = 1;
-- Error: new row for relation "accounts" violates check constraint "chk_balance_non_negative"

-- Cualquier sentencia posterior dentro de este bloque es ignorada por el motor:
UPDATE accounts 
SET balance = balance + 450.00 
WHERE id = 2;

ROLLBACK;
```

En PostgreSQL, cuando una sentencia falla, la transacción entra en estado abortado. El motor rechaza comandos posteriores hasta que se envíe `ROLLBACK`. El saldo de Alicia permanece intacto en $400.00.

### Cómo implementa PostgreSQL la atomicidad

1. **Write-Ahead Logging (WAL):** Las modificaciones se registran secuencialmente en buffers de WAL antes de alterar páginas de datos en disco. Durante la recuperación tras un fallo, las transacciones no confirmadas se revierten limpiamente.
2. **Control de visibilidad mediante MVCC:** PostgreSQL no sobrescribe filas en el lugar (*in-place*). Un `UPDATE` escribe una nueva versión de fila (*tuple*) con identificadores de transacción (`xmin`). Si la transacción se revierte, esa tupla simplemente queda invisible para el resto de sesiones y luego es limpiada por el proceso `VACUUM`.

---

## 3. Consistencia — Preservar las reglas e invariantes

En ACID, **Consistencia significa que una transacción lleva a la base de datos de un estado válido a otro estado válido**, cumpliendo con todas las restricciones definidas de esquema e integridad.

### Restricciones del motor vs. Invariantes de dominio

Es crucial separar los dos planos:

1. **Restricciones formales (Responsabilidad del motor):**
   - Claves primarias (`PRIMARY KEY`).
   - Claves foráneas (`FOREIGN KEY`).
   - Restricciones de chequeo (`CHECK`).
   - Restricciones de no nulidad (`NOT NULL`).
2. **Invariantes de dominio (Responsabilidad de la aplicación):**
   - Ejemplo: *“Un cliente no puede tener más de tres suscripciones activas simultáneamente en diferentes productos”*.
   - Si tu código no valida reglas de negocio complejas y ejecuta SQL estructuralmente válido, el motor lo confirmará sin advertencias. La base de datos garantiza consistencia mecánica; la consistencia del negocio depende de tu arquitectura.

---

## 4. Aislamiento — Ejecución concurrente de transacciones

Si las transacciones se ejecutaran de manera estrictamente secuencial, una tras otra, los sistemas gestores serían simples de construir. Sin embargo, el rendimiento sería inaceptable en servidores con múltiples núcleos que procesan miles de peticiones por segundo.

El **Aislamiento** (*Isolation*) controla cómo las transacciones concurrentes observan los cambios intermedios de otras transacciones. Un aislamiento ideal implica que el resultado de transacciones paralelas sea indistinguible de haberlas ejecutado una después de otra.

Al relajar los niveles de aislamiento para ganar velocidad, surgen **anomalías de concurrencia**:

### Anomalías clásicas de concurrencia

1. **Lectura sucia (*Dirty Read*):** La transacción A lee datos modificados por la transacción B que aún no se han confirmado (*uncommitted*). Si B hace rollback, A operó sobre datos inexistentes.
2. **Lectura no repetible (*Non-Repeatable Read*):** La transacción A lee una fila. La transacción B modifica esa fila y hace commit. A vuelve a leer la misma fila y encuentra valores distintos.
3. **Lectura fantasma (*Phantom Read*):** La transacción A consulta un rango de registros (`WHERE status = 'pending'`). B inserta una nueva fila que coincide con el filtro y hace commit. A vuelve a consultar el rango y observa una fila "fantasma" que antes no existía.
4. **Desviación de escritura (*Write Skew*):** Dos transacciones paralelas leen datos superpuestos, toman decisiones sobre lo que observaron, actualizan registros disjuntos y confirman, violando una regla de negocio global que ninguna violó por sí sola.

---

## 5. Niveles de aislamiento en la práctica

El estándar ANSI/ISO SQL-92 define cuatro niveles de aislamiento según las anomalías que mitigan:

| Nivel de Aislamiento | Lectura Sucia | Lectura No Repetible | Lectura Fantasma | Anomalía de Serialización |
| :--- | :---: | :---: | :---: | :---: |
| **Read Uncommitted** | Posible (en teoría) | Posible | Posible | Posible |
| **Read Committed** | Prevenido | Posible | Posible | Posible |
| **Repeatable Read** | Prevenido | Prevenido | Prevenido (en Postgres) | Posible (Write Skew) |
| **Serializable** | Prevenido | Prevenido | Prevenido | Prevenido |

> **Nota sobre PostgreSQL:** En PostgreSQL, el nivel `Read Uncommitted` se ejecuta internamente como `Read Committed`. Debido a su arquitectura MVCC, el motor jamás permite lecturas sucias en ninguna configuración.

### Configuración en SQL

```sql
-- Configurar nivel para la transacción actual
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- O definir nivel por defecto para la sesión
SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

### Serializable Snapshot Isolation (SSI) en PostgreSQL

PostgreSQL logra el nivel `Serializable` completo sin recurrir a bloqueos pesados de dos fases (2PL), utilizando **Serializable Snapshot Isolation (SSI)**. SSI monitorea dependencias de lectura y escritura (`si_read_locks`) en memoria. Si detecta un ciclo que podría producir una anomalía de serialización, aborta una de las transacciones con el código de error `40001` (`serialization_failure`), permitiendo que la aplicación intente nuevamente la operación.

---

## 6. Durabilidad — ¿Qué significa confirmar una transacción?

La **Durabilidad** (*Durability*) garantiza que, una vez que una transacción ha sido confirmada con éxito (`COMMIT`), sus efectos persisten de forma indefinida, incluso si el servidor sufre un corte de energía total o una falla del sistema operativo de inmediato.

### Mecánica del Write-Ahead Log (WAL) y `fsync`

Escribir páginas de datos aleatorias de 8KB directamente en disco en cada commit arruinaría el rendimiento de cualquier aplicación.

Para balancear durabilidad y alto rendimiento:

1. Las modificaciones se escriben secuencialmente en el buffer de memoria del **WAL**.
2. Al ejecutar `COMMIT`, PostgreSQL emite una llamada al sistema `fsync()`, obligando al sistema operativo y al controlador de almacenamiento a vaciar el buffer del WAL a disco físico no volátil.
3. Las páginas de datos reales (*shared buffers*) se sincronizan posteriormente con el almacenamiento en bloques mediante el proceso de segundo plano *checkpointer*.

---

## 7. Prácticas recomendadas en entornos de producción

Al diseñar arquitecturas respaldadas por bases de datos relacionales:

1. **Mantén las transacciones cortas:** Nunca mantengas abierta una transacción mientras esperas I/O de red externa (APIs de pago como Stripe, envíos de correo, servicios de terceros). Retener bloqueos satura el pool de conexiones.
2. **Ordena los bloqueos de forma determinista:** Si dos transacciones intentan actualizar la Cuenta 1 y la Cuenta 2 en orden inverso, se generará un deadlock. Ordena siempre los IDs antes de solicitar bloqueos de fila (`SELECT ... FOR UPDATE`).
3. **Maneja los errores de concurrencia:** En niveles `Repeatable Read` y `Serializable`, prepara tu aplicación para capturar el error `40001` y reintentar con backoff exponencial.
4. **Implementa validaciones en el esquema:** No dependas exclusivamente del código backend para validar datos. Usa restricciones `CHECK`, `UNIQUE` y `FOREIGN KEY` como última línea de defensa.

---

## 8. Comparativa: PostgreSQL vs. MySQL (InnoDB)

| Característica | PostgreSQL | MySQL (InnoDB) |
| :--- | :--- | :--- |
| **Nivel por defecto** | `Read Committed` | `Repeatable Read` |
| **Implementación MVCC** | Versiones de tupla en heap principal; limpieza con `VACUUM` | Undo logs en tablespace dedicado; actualización in-place |
| **Repeatable Read** | Snapshot Isolation; previene lecturas fantasma | Next-Key Locks (Record Lock + Gap Lock) |
| **Serializable** | SSI (optimista, libre de bloqueos compartidos) | Bloqueos compartidos pesimistas (`LOCK IN SHARE MODE`) |

---

## 9. Referencias técnicas y bibliografía

1. **Gray, Jim.** *“The Transaction Concept: Virtues and Limitations.”* Proceedings of the 7th International Conference on Very Large Data Bases (1981).
2. **Kleppmann, Martin.** *Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems.* O'Reilly Media (2017).
3. **Berenson, H., et al.** *“A Critique of ANSI SQL Isolation Levels.”* ACM SIGMOD Record (1995).
4. **PostgreSQL Global Development Group.** *“Concurrency Control and Transaction Isolation.”* Documentación oficial de PostgreSQL.

---

## Conclusión: El límite de la responsabilidad

El modelo ACID sigue siendo el estándar fundamental de seguridad de datos en la ingeniería de software. No obstante, el motor relacional es una herramienta mecánica: cumple contratos matemáticos y restricciones formales.

La resiliencia de un sistema en producción radica en entender con claridad qué garantías asume la base de datos y cuáles deben ser gobernadas por el diseño de tu arquitectura.
