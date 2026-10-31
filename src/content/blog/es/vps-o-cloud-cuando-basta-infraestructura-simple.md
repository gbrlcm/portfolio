---
title: "¿VPS o cloud? Cuándo basta una infraestructura simple"
description: "Criterios de ingeniería para elegir entre VPS y cloud: almacenamiento, object storage, alta disponibilidad, RPO/RTO y costo real."
pubDate: 2026-10-31T15:00:00-03:00
author: "Gabriel Campos"
cover: "/images/blog/vps-ou-cloud-quando-infraestrutura-simples-basta.webp"
coverAlt: "Ilustración sin texto: un único servidor a la izquierda, un rombo amarillo de decisión en el centro y, a la derecha, nodos distribuidos en tres zonas con balanceador, base de datos y bucket de objetos"
category: "Arquitectura de Software"
tags:
  - "Infraestructura"
  - "VPS"
  - "Cloud"
  - "Arquitectura"
  - "Object Storage"
  - "PostgreSQL"
  - "DevOps"
draft: false
lang: "es"
translationKey: "vps-vs-cloud"
---

Un SaaS con unos cientos de clientes, un backend, una base de datos y una cola de reportes nace, en el papel, con Kubernetes, tres zonas de disponibilidad, una base gestionada con réplicas, un balanceador, una CDN, una cola, workers y un stack de observabilidad facturado por volumen de logs. Dos desarrolladores van a operar todo eso. La carga real cabe, con holgura, en una sola máquina.

Esto pasa con frecuencia y rara vez por una decisión técnica. Pasa porque la arquitectura "de verdad" se volvió sinónimo de arquitectura distribuida, y porque a nadie lo despiden por elegir lo que todos eligen. Pero cada componente agregado tiene un costo permanente: dinero, superficie de falla, configuración que mantener y conocimiento que alguien debe tener a las tres de la mañana.

La tesis de este artículo es simple y tiene dos caras. **Una VPS bien dimensionada, monitoreada y administrada atiende muchas aplicaciones empresariales y muchos productos SaaS.** Y **hay requisitos concretos que una VPS no cumple**, y el trabajo de ingeniería es saber reconocerlos. No es una disputa entre VPS y cloud: es una decisión que depende de los requisitos funcionales y no funcionales, de la carga, de la disponibilidad exigida, del costo y de la capacidad operativa de quien va a mantener el sistema.

> Este artículo es un estudio basado en documentación oficial y en experimentos que ejecuté localmente. Los pasajes marcados como **opinión** o **interpretación** reflejan mi lectura; el resto cita fuentes. No tengo resultados de producción propios para presentar aquí, y los ejemplos de arquitectura son escenarios plausibles, no casos reales. Las referencias están al final, con la fecha de consulta.

## La complejidad que nadie pidió

Donald Knuth escribió en 1974 que la optimización prematura es la raíz de buena parte de los males de la programación (*Structured Programming with go to Statements*, ACM Computing Surveys). La frase suele citarse para el código, pero vale igual para la infraestructura: diseñar para un problema que no tienes cuesta tiempo ahora y suele equivocar el problema que tendrás después.

Tres distinciones ayudan a separar necesidad de preferencia:

- Una **necesidad técnica** es un requisito que puedes enunciar y medir: "toleramos como máximo 15 minutos de pérdida de datos", "la carga se triplica en las campañas y vuelve a la normalidad en horas", "necesitamos atender a usuarios en Europa y Brasil con baja latencia".
- Una **preferencia tecnológica** es "queremos usar Kubernetes", "todos usan servicios gestionados". Puede ser legítima (por aprendizaje o contratación, por ejemplo), pero hay que asumirla como preferencia, con el costo que trae.
- **Estar preparado para crecer** es distinto de **tener complejidad anticipada**. Una aplicación preparada para crecer tiene fronteras claras (archivos fuera de la máquina de aplicación, sesiones sin estado local, migraciones versionadas, backups probados). Una aplicación con complejidad anticipada ya paga hoy por una distribución que quizás nunca use.

El propio Azure Well-Architected Framework, de un proveedor que vende esa complejidad, incluye *keep it simple* entre sus principios de confiabilidad: agregar componentes a la arquitectura solo si ayudan a lograr el valor de negocio buscado, porque cada componente crítico es un punto de falla potencial. El mismo texto hace la salvedad opuesta: simplificar en exceso puede introducir puntos únicos de falla. Mi conclusión (**interpretación**) es que la pregunta no es "¿simple o complejo?", sino "¿cuál es el mínimo que satisface los requisitos que puedo declarar?".

## VPS, VM y cloud: qué promete cada término

Los términos se mezclan en el mercado, así que conviene separar lo que garantiza cada uno.

Una **máquina virtual (VM)** es una máquina emulada por un hipervisor sobre hardware físico compartido: el invitado ve CPU, memoria, disco y red virtuales, aislados de los demás invitados. Una **VPS** (*virtual private server*) es un nombre comercial para una VM vendida con recursos reservados y acceso administrativo (root), normalmente con precio mensual fijo y red y disco gestionados por el proveedor. Técnicamente, una VPS es una VM.

**Cloud**, según la definición del NIST (SP 800-145), es un modelo de acceso bajo demanda a un *pool* compartido de recursos computacionales configurables, que pueden aprovisionarse y liberarse rápidamente con un esfuerzo de gestión o interacción con el proveedor mínimos. El NIST enumera cinco características esenciales: autoservicio bajo demanda, acceso amplio por red, agrupación de recursos (*resource pooling*), elasticidad rápida y servicio medido. Eso describe **un modelo de consumo y de API**, no un tipo de servidor.

De ahí salen dos consecuencias prácticas:

1. **VPS y cloud no son categorías excluyentes.** Una instancia EC2 con un volumen EBS es, funcionalmente, una VPS: una VM con disco persistente e IP, sobre infraestructura cloud (**interpretación**). Lo que diferencia el uso no es la VM, sino si contratas *solo la VM* o *un conjunto de servicios* a su alrededor.
2. **Contratar una VM es distinto de contratar servicios de infraestructura.** Con la VM recibes cómputo y disco y asumes el resto: sistema operativo, parches, firewall, backup, monitoreo, base de datos, TLS. Con servicios (base gestionada, balanceador, object storage, cola), el proveedor opera partes del stack, y lo pagas en dinero y en acoplamiento al proveedor. El modelo de responsabilidad compartida de AWS formaliza la división: el proveedor se ocupa de la seguridad *de* la nube (hardware, software base, instalaciones); el cliente, de la seguridad *en* la nube, lo que incluye el sistema operativo invitado en las instancias EC2, las aplicaciones, los datos y la configuración del firewall (*security groups*). **Cloud no elimina la necesidad de administrar infraestructura; cambia qué partes administras.**

También conviene distinguir tres tipos de hosting:

| | VPS tradicional | VM en cloud (ej.: EC2, Compute Engine, Azure VM) | Servidor dedicado |
|---|---|---|---|
| Hardware | Compartido, dividido por un hipervisor | Compartido, dividido por un hipervisor | Físico, exclusivo |
| Aprovisionamiento | Minutos, normalmente por panel | Segundos a minutos, por API | Minutos a días |
| Red y disco | Simples, del proveedor | Redes virtuales y discos en volúmenes separados de la VM | Discos locales |
| Ecosistema alrededor | Pequeño | Extenso (base de datos, cola, storage, balanceador…) | Mínimo |
| Modelo de cobro | Normalmente plan mensual | Por uso medido | Contrato mensual |

(Caracterización general; los detalles varían según proveedor y plan.)

**Infraestructura compartida** significa que tu servidor comparte hardware físico con otros clientes; **infraestructura distribuida** es un concepto de arquitectura: tu *sistema* corre en varios nodos que se coordinan por la red. Una VPS puede ser compartida y no distribuida (el caso común). Un sistema puede estar distribuido en máquinas dedicadas. Ambas cosas son independientes, y el costo de distribuir (consistencia, latencia de red, fallas parciales) existe sea cual sea el hardware.

## Cuándo una VPS es suficiente

Una VPS suele atender bien cargas como:

- aplicaciones **monolíticas** (incluidos los monolitos modulares);
- **APIs REST** con tráfico predecible;
- **sistemas administrativos** y aplicaciones internas empresariales, con usuarios en horario laboral;
- **SaaS en etapa temprana**, con decenas o cientos de clientes;
- **sitios institucionales** y **e-commerce de pequeño y mediano tamaño**;
- sistemas de **procesamiento** con carga predecible (importaciones nocturnas, generación de reportes programada).

El denominador común es un **perfil de carga que conoces**: sin picos impredecibles de órdenes de magnitud y con una tolerancia definida a ventanas cortas de indisponibilidad. Si esa tolerancia no existe, el problema cambia de naturaleza (mira la siguiente sección).

### Una arquitectura de referencia

Un stack que uso como punto de partida en mis estudios, todo en una VPS Linux:

```text
Internet ──► Nginx (TLS, reverse proxy, límites)
                ├──► web  (Next.js, SSR)
                └──► api  (NestJS)
                        ├──► PostgreSQL  (datos, transacciones)
                        └──► Redis       (caché, rate limiting, colas livianas)

Fuera de la máquina: backups (base + WAL) en object storage; monitoreo y alertas externos
```

Responsabilidades:

- **Linux**: la base; actualizaciones de seguridad, `ufw`/`nftables` cerrando todo salvo 80/443 (y SSH restringido), usuarios sin privilegios, reloj sincronizado.
- **Docker + Docker Compose**: empaqueta y versiona los servicios. La documentación de Docker describe el despliegue en un solo servidor como el camino más simple, y que, para escalar más allá de un host, el siguiente paso sería un clúster (Swarm, en su propia doc) u otro orquestador. Los volúmenes con nombre persisten datos más allá del ciclo de vida del contenedor; la capa escribible del contenedor **no** es durable.
- **Nginx**: termina TLS, hace de *reverse proxy*, impone límites (tamaño del cuerpo, tasas) y sirve estáticos.
- **PostgreSQL**: fuente de la verdad para datos estructurados y transaccionales.
- **Redis**: caché y estructuras efímeras. La documentación de Redis lista "sin persistencia" como opción común para caché, y recomienda RDB + AOF solo si quieres una seguridad de datos comparable a la de PostgreSQL. En este diseño, **Redis es desechable por definición**; si algo en él debe sobrevivir, es señal de que el dato pertenece a la base de datos.
- **Backups externos**: el ítem más descuidado (ver abajo).
- **Monitoreo**: métricas del host (CPU, memoria, disco, I/O), de la base (conexiones, locks, atraso de *vacuum*, tamaño) y de la aplicación (latencia, tasa de errores), con alertas desde fuera de la propia VPS. Un monitor que muere junto con el servidor no avisa de nada.
- **CI/CD**: pipeline que construye la imagen, ejecuta pruebas y publica por tag; el despliegue es `docker compose pull && docker compose up -d`, con *rollback* al tag anterior.

Un `compose.yaml` mínimo de este diseño (validado con `docker compose config`; ajusta imágenes, secretos y *healthchecks* a tu caso):

```yaml
services:
  nginx:
    image: nginx:1.27
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on: [web, api]
    networks: [edge, app]

  web:                       # Next.js (SSR)
    image: registry.example.com/saas-web:${TAG}
    restart: unless-stopped
    env_file: .env
    networks: [app]

  api:                       # NestJS
    image: registry.example.com/saas-api:${TAG}
    restart: unless-stopped
    env_file: .env
    depends_on:
      postgres: { condition: service_healthy }
    networks: [app, data]

  postgres:
    image: postgres:17
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/pg_password
    secrets: [pg_password]
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks: [data]

  redis:                     # caché desechable: sin RDB, sin AOF
    image: redis:7
    restart: unless-stopped
    command: ["redis-server", "--save", "", "--appendonly", "no",
              "--maxmemory", "256mb", "--maxmemory-policy", "allkeys-lru"]
    networks: [data]

volumes:
  pgdata:

networks:
  edge:
  app:
  data:
    internal: true           # base de datos y Redis sin ruta hacia afuera

secrets:
  pg_password:
    file: ./secrets/pg_password
```

Y el fragmento de Nginx que enruta `/api/` al backend (validado con `nginx -t` en la imagen `nginx:1.27`):

```nginx
upstream api { server api:3000; keepalive 16; }
upstream web { server web:3000; keepalive 16; }

server {
  listen 80;
  server_name app.example.com;
  client_max_body_size 1m;        # las subidas grandes NO pasan por aquí (ver la sección de object storage)

  location /api/ {
    proxy_pass http://api;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
  location / {
    proxy_pass http://web;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
  }
}
```

**Un backup no es redundancia.** PostgreSQL documenta el archivado continuo: un *backup* base a nivel de sistema de archivos más el archivo continuo de WAL permiten restaurar el clúster a cualquier instante posterior al backup base (PITR). Dos salvedades de la propia documentación: `pg_dump` no sirve para esto (un volcado lógico no contiene información suficiente para el *replay* de WAL), y el archivado debe configurarse y probarse *antes* del primer backup base. El whitepaper de *disaster recovery* de AWS hace la distinción correspondiente: la replicación continua tiene un RPO cercano a cero, pero puede no proteger contra corrupción de datos o borrado malicioso, que también se replican; es el *backup con punto en el tiempo* y el versionado lo que protege. Y ambas fuentes insisten: prueba la restauración. Un backup que nunca se restauró es una hipótesis.

### Dimensionamiento: qué mirar, y por qué no existe un número mágico

No existe "una VPS aguanta N usuarios". Los usuarios no son unidad de carga; **las solicitudes por segundo, el costo por solicitud y el patrón de acceso** sí lo son. Los recursos a observar:

- **CPU**: núcleos ocupados en horas pico, cola de ejecución (*load average* relativo al número de núcleos) y *steal time*, que en una VM indica contención del hipervisor.
- **Memoria**: working set de la aplicación, `shared_buffers` y caché de páginas de PostgreSQL, y memoria por conexión. La memoria que "sobra" no está ociosa: Linux la usa como caché de disco, y ese caché es lo que mantiene rápida a la base.
- **Almacenamiento**: capacidad, crecimiento diario y, más importante para una base, **IOPS y latencia**. Un disco con mucha capacidad e IOPS limitado traba una base antes de que se acabe el espacio.
- **Throughput de disco y de red**: relevantes para backups, importaciones y descargas de archivos grandes servidos por la propia máquina.
- **Concurrencia**: por la ley de Little (*L = λ·W*), el número medio de solicitudes en curso es la tasa de llegada por el tiempo medio de atención. Un ejemplo **hipotético**: 200 req/s con 50 ms de latencia media mantienen, en promedio, 10 solicitudes en curso; si la latencia sube a 500 ms por una consulta lenta, son 100, sin que el tráfico haya cambiado.
- **Conexiones a la base**: PostgreSQL dimensiona ciertos recursos directamente a partir de `max_connections` (valor por defecto típico de 100, definido en `initdb`), y ese valor solo cambia con un reinicio. Más conexiones no es más throughput: cada conexión es un proceso con memoria propia. En general, lo que escala es un *pool* de tamaño acotado (de la aplicación o de un *pooler* externo) y consultas cortas. (**Opinión:** es uno de los primeros cuellos de botella reales de las apps pequeñas, y suele resolverse con configuración, no con hardware.)

Existe además la **regla inversa**: la VPS que parece "pequeña" puede estar subutilizada, y la "grande" puede estar ahogada. Monitorear es lo que dice cuál es cuál.

### El hardware no arregla una consulta mala

Para hacerlo concreto, ejecuté un experimento en un PostgreSQL 17.10 local descartable (una laptop, sin tuning, **no es un benchmark**): una tabla `pedidos` con 2 millones de filas (285 MB), una consulta por `cliente_id` que devuelve 37 filas, con `max_parallel_workers_per_gather = 0` para aislar el efecto.

| Escenario | Plan | Páginas leídas (8 kB) | Tiempo de ejecución |
|---|---|---|---|
| Sin índice en `cliente_id` | `Seq Scan` | ~36.400 | 59 a 75 ms |
| Con índice en `cliente_id` | `Bitmap Index Scan` + `Bitmap Heap Scan` | 40 | 0,02 a 0,04 ms |

La diferencia es de tres órdenes de magnitud en páginas leídas y en tiempo, en la misma máquina. Ahora imagina esa consulta llamada cientos de veces por segundo sobre una tabla de 200 millones de filas: ninguna mejora de CPU resuelve lo que resuelve un índice. Lo mismo vale para otros cuellos de botella en los que más hardware ayuda poco:

- **Contención en la base**: transacciones largas reteniendo locks, *deadlocks*, filas "calientes" actualizadas por muchas solicitudes. Más núcleos solo crean más espera.
- **Fugas de memoria** en la aplicación: más RAM solo posterga el OOM.
- **I/O síncrono bloqueante** (llamadas HTTP externas sin *timeout* dentro de la solicitud, archivos grandes procesados en el mismo hilo): la cola crece con la máquina ociosa.
- **Consultas N+1**, ausencia de paginación, `SELECT *` en tablas anchas.

Los artículos sobre el [planificador de consultas](/es/blog/planificador-de-consultas-postgresql) y sobre [aislamiento, locks y deadlocks](/es/blog/aislamiento-locks-deadlocks-postgresql) de la serie *PostgreSQL por Dentro* detallan cómo diagnosticar cada uno. La consecuencia para esta discusión (**interpretación**): antes de migrar de infraestructura por "falta de capacidad", confirma que el cuello de botella es capacidad y no eficiencia.

## Cuándo migrar a cloud

Los criterios que justifican servicios cloud son requisitos que una VPS única no puede cumplir, no un conteo de usuarios:

- **Variabilidad de la demanda**: carga que oscila en órdenes de magnitud (campañas, estacionalidad, eventos). Pagar el pico todo el mes es caro; la capacidad bajo demanda lo resuelve. El principio de confiabilidad de AWS "deja de adivinar la capacidad" describe exactamente esto.
- **Escalabilidad horizontal necesaria**: cuando el límite de una máquina (incluso grande) es el problema, no el diseño.
- **Alta disponibilidad y tolerancia a fallas**: si el negocio no tolera las horas de indisponibilidad que implica una máquina única (ver abajo).
- **Recuperación ante desastres con RPO/RTO exigentes**: el **RPO** (*recovery point objective*) es cuántos datos aceptas perder, medido en tiempo; el **RTO** (*recovery time objective*) es cuánto tiempo aceptas estar fuera de servicio. Restaurar un backup nocturno en una VPS nueva da un RPO de hasta 24 h y un RTO de horas; si el negocio exige minutos para ambos, necesitas replicación y failover.
- **Distribución geográfica**: latencia para usuarios lejanos, residencia de datos.
- **Seguridad y cumplimiento**: certificaciones, auditoría, aislamiento, gestión de claves e identidad que el proveedor ya ofrece y que tendrías que montar tú.
- **Capacidad operativa del equipo**: si nadie quiere o puede operar PostgreSQL con replicación y backups probados, pagar una base gestionada es una decisión racional, no una debilidad.
- **Aprovisionamiento automatizado y entornos efímeros**: infraestructura como código, entornos de prueba bajo demanda.

### Vertical, horizontal y el problema del estado

La **escalabilidad vertical** es agrandar la máquina; es simple, sin cambios de código, pero tiene techo, suele exigir reinicio y mantiene el punto único de falla. La **escalabilidad horizontal** es agregar máquinas; solo funciona bien cuando las réplicas de la aplicación son **intercambiables**, es decir, **sin estado local** (*stateless*): sesiones en Redis o token firmado, archivos en object storage, *jobs* en una cola. La guía de Auto Scaling de AWS describe el grupo como un conjunto de instancias tratadas como una unidad lógica, que reemplaza las no saludables por nuevas y distribuye la capacidad entre zonas, lo que, en mi lectura (**interpretación**), presupone instancias descartables. Las aplicaciones con estado local (archivos en `/uploads`, sesión en memoria) rompen ese modelo.

El estado no desaparece: **se concentra** en los componentes que lo guardan (base de datos, object storage, caché). Escalar la capa *stateless* es relativamente fácil; escalar la base es el problema difícil.

### Balanceo, failover y redundancia entre zonas

Un balanceador (el Elastic Load Balancing de AWS es un ejemplo) distribuye solicitudes entre destinos en una o más zonas de disponibilidad y **envía tráfico solo a los saludables**, mediante *health checks*. Una **zona de disponibilidad (AZ)** es uno o más centros de datos con energía, red y conectividad redundantes, físicamente separados de otras zonas de la misma región. La redundancia entre zonas permite sobrevivir a la pérdida de un centro de datos.

Para la base de datos, AWS describe dos formas en RDS: **Multi-AZ con una instancia *standby***, replicada **de forma síncrona** en otra zona, con failover; la documentación advierte que el *standby* **no sirve tráfico de lectura** y que la replicación síncrona puede aumentar la latencia de escritura y de *commit* respecto de una sola zona. Para lectura se usan **réplicas de lectura** (asíncronas) o un clúster Multi-AZ con *standbys* legibles. De ahí una distinción importante: **alta disponibilidad (Multi-AZ) y escala de lectura (réplicas) resuelven problemas distintos.**

En PostgreSQL puro, la documentación oficial describe soluciones de *standby* (WAL shipping y replicación lógica, entre otras) que pueden ser síncronas o asíncronas y permiten promover el *standby* a primario. Armar eso, con detección de fallas, promoción segura y *fencing* del primario anterior, es trabajo de ingeniería y operación tuyo. Es exactamente el trabajo que vende una base gestionada.

### Una VM más grande no resuelve todo, y una VM en cloud no es alta disponibilidad

Agrandar la máquina cubre CPU/RAM/IOPS hasta un techo, pero **no** da redundancia, **no** da recuperación ante desastres, **no** resuelve la latencia geográfica y **no** resuelve la contención de la aplicación.

Y correr en una instancia cloud **no** significa alta disponibilidad. El SLA de EC2, en la página consultada (última actualización indicada: 25/05/2022), compromete **99,99%** de disponibilidad mensual a nivel de región **cuando las instancias corren en dos o más zonas**, y **99,5%** a nivel de instancia para una sola instancia. En aritmética simple, 99,5% permite cerca de 3,6 horas de indisponibilidad por mes de 30 días, mientras que 99,99% permite cerca de 4,3 minutos. Un SLA es un compromiso contractual con créditos de servicio, no una predicción de comportamiento. Además, los volúmenes EBS se replican **dentro de una zona de disponibilidad**, lo que protege contra la falla de un componente pero no contra la pérdida de la zona. **Durabilidad no es disponibilidad**, y **disponibilidad no es escalabilidad**: un sistema puede escalar sin ser disponible (muchas máquinas detrás del mismo punto de falla) y ser disponible sin escalar (dos máquinas pequeñas en zonas distintas).

## Almacenamiento: una decisión arquitectónica fundamental

Dónde viven los bytes define qué pasa cuando la máquina muere, cuando necesitas una segunda instancia y cuando llega la factura. Seis modelos, con ejemplos de proveedores (que **no son equivalentes en todos los aspectos**).

### Almacenamiento local

Es el disco de la propia máquina (NVMe/SSD interno o el disco de la VPS). Ventajas: menor latencia y simplicidad; `fsync` y los archivos funcionan como el programador espera. Límites: **la vida del dato está atada a la vida de la máquina**. Si la VM se recrea, el disco local puede desaparecer; aun cuando persiste, depende de una sola máquina y de un único punto de falla. Casos de uso: temporales, caché de build, *spill* de ordenamientos, datos reproducibles.

### Block storage

Un **volumen de bloques** es un dispositivo de bloques expuesto a la VM, sobre el cual creas un sistema de archivos (o entregas el dispositivo en bruto a una base de datos). La documentación de Amazon EBS lo describe como volúmenes que se adjuntan a instancias EC2 y se usan "como un disco local", con snapshots como backups con punto en el tiempo, tipos distintos para IOPS y *throughput*, y replicación automática entre servidores **dentro de la zona**. Persiste independientemente de la instancia. En la práctica (**interpretación**; confirma las excepciones de tu proveedor), un volumen de bloques lo usa **una instancia a la vez**, con un sistema de archivos común encima. El tipo de volumen, los IOPS y el *throughput* se eligen y se pagan aparte, por eso entran en el costo. Caso de uso: **bases de datos** y todo lo que espere un disco POSIX de baja latencia.

### File storage

**Sistema de archivos compartido**, accedido por NFS o SMB. Amazon EFS, por ejemplo, usa NFSv4.1/4.0, permite acceso concurrente de muchas instancias, ofrece semántica de archivos (consistencia fuerte y *file locking*) y puede replicar entre zonas. Cada operación pasa por la red y por el protocolo, así que el rendimiento, en especial con muchos archivos pequeños y metadatos, es distinto al del disco local; hay que probar con tu patrón de acceso (**interpretación**). Casos de uso: aplicaciones legadas que exigen un sistema de archivos compartido, directorios home, contenido compartido entre instancias, cuando cambiar la aplicación a object storage no es viable.

### Object storage

Almacena **objetos** (datos + metadatos) en **buckets**, direccionados por una **clave** (y, con versionado, un *version ID*), mediante una **API HTTP**. Amazon S3 se describe así: un objeto es un archivo más metadatos; cada objeto tiene una clave única en el bucket; el servicio es una API REST. **No es un sistema de archivos.** La API opera sobre objetos por clave (`PUT`, `GET`, `DELETE`, `COPY`), sin la semántica POSIX: en la práctica (**interpretación** del modelo de la API), no hay *lock* de archivo ni edición parcial en el lugar, y "renombrar" es copiar y eliminar. S3 documenta que no ofrece *locking* entre escritores concurrentes (con `PUT`s simultáneos sobre la misma clave, gana el de timestamp más reciente) y que no existe actualización atómica entre claves. Las "carpetas" son solo prefijos de clave.

Propiedades que importan (todas citadas de los proveedores, y **cada producto tiene las suyas**):

- **Durabilidad.** S3 Standard fue *diseñado* para 99,999999999% (once nueves) de durabilidad y 99,99% de disponibilidad de objetos a lo largo de un año, con datos almacenados en múltiples dispositivos en al menos tres zonas. "Diseñado para" es una meta de diseño, no una garantía contractual; y la durabilidad **no** te protege de que borres tú mismo el objeto.
- **Consistencia.** S3 ofrece consistencia fuerte de lectura tras escritura para `PUT` y `DELETE`, en todas las regiones, y las actualizaciones de una sola clave son atómicas; las actualizaciones **entre** claves no lo son. Google Cloud Storage documenta consistencia fuerte para escrituras y listados de objetos, pero otorgar/revocar acceso es **eventualmente** consistente (alrededor de un minuto, según la documentación). Cloudflare R2 documenta consistencia fuerte para lectura tras escritura, borrado y listado, con los cambios de permisos de claves de API eventualmente consistentes. Si hay caché o CDN delante, la consistencia práctica pasa a ser la del caché.
- **Versionado.** En S3, cuando se activa, un borrado inserta un *delete marker* y la versión anterior permanece; una sobrescritura crea una versión nueva. **Cada versión se cobra como un objeto completo**, y, una vez activado, el bucket nunca vuelve al estado "sin versionado" (solo puede suspenderse).
- ***Lifecycle policies.*** Reglas de transición entre clases de almacenamiento y de expiración. En S3, las reglas de ciclo de vida también se aplican a versiones no actuales, y hay una acción específica para **abortar subidas multipart incompletas**, cuyas partes se siguen cobrando hasta que se completen o se aborten.
- **URLs firmadas (*presigned*).** URL temporal que concede acceso a **una operación sobre un objeto** con las credenciales de quien la generó. En S3 vale hasta su expiración y **expira antes si expiran las credenciales usadas para firmarla**; es un *bearer token* (quien tiene la URL la usa) y debe tratarse como tal. En R2 se soportan mediante la API S3 (de 1 segundo a 7 días; GET, HEAD, PUT, DELETE), **no** en dominios personalizados, y no hay soporte para POST de formularios.
- ***Multipart upload.*** S3 recomienda usarlo para objetos de **100 MB o más**; las partes se numeran de 1 a 10.000, pueden enviarse en paralelo y reintentarse individualmente, y la subida solo se convierte en objeto cuando llamas a *complete*.
- **Costos.** Almacenamiento por GB-mes, **solicitudes** (las de escritura y listado cuestan más que las de lectura) y **transferencia de salida**. Algunos proveedores cobran el egress; R2 declara no cobrarlo.

**Ejemplos y salvedades.** *Amazon S3*, *Google Cloud Storage* y *Cloudflare R2* son servicios gestionados; R2 expone una API compatible con S3, lo que facilita portar código, pero "compatible" no es "idéntico" (por ejemplo, la restricción de dominio personalizado en las URLs firmadas mencionada arriba). *MinIO* es un servidor de object storage compatible con S3 que operas tú mismo. Al consultar su repositorio oficial el 31/10/2026, aparecía como **archivado y sin mantenimiento** (archivado por el mantenedor el 25/04/2026), con la edición *community* distribuida solo como código fuente bajo AGPLv3 y la empresa señalando sus productos AIStor como alternativa. Para quien pensaba usarlo, es información de riesgo: evalúa el estado del proyecto en la fecha en que decidas.

### Almacenamiento en base de datos

Las bases relacionales como PostgreSQL son apropiadas para **datos estructurados, relaciones, transacciones y consultas**: integridad referencial, índices, `JOIN`, aislamiento, *point-in-time recovery*. Eso no las vuelve adecuadas para guardar *blobs* grandes por defecto. PostgreSQL almacena valores grandes mediante **TOAST** (compresión y/o fragmentación en una tabla auxiliar), con un límite de **1 GB por valor**; existe también la facilidad de *large objects*, con acceso en flujo. Poner PDFs y videos en la base funciona a escala pequeña, pero (**opinión**, en línea con la práctica común): infla la base, el backup, el WAL y la replicación con bytes que no necesitan transacciones ni consultas relacionales, y convierte a la base en el cuello de botella para leer archivos. Lo que **sí** debe quedar en la base es el *metadato* del archivo y la referencia a dónde vive.

### Caché

Un caché guarda una **copia desechable** de un dato cuya fuente de verdad está en otro lugar, para ganar latencia. Redis es el ejemplo: en memoria, con política de expulsión (`maxmemory-policy`) y la opción, documentada, de **no persistir nada**. Regla de oro: si perder el contenido del caché provoca pérdida de datos de negocio, eso no es un caché, es una base de datos mal elegida. El caché **no** sustituye al almacenamiento persistente ni al object storage.

### Comparación

| | Local | Bloque | Archivo | Objeto | Base de datos | Caché |
|---|---|---|---|---|---|---|
| **Acceso** | Sistema de archivos local | Dispositivo de bloques + FS | NFS/SMB (POSIX por red) | API HTTP por clave | SQL sobre protocolo propio | Comandos clave-valor (Redis) |
| **Persistencia** | Atada a la máquina | Independiente de la instancia (replicada en la zona) | Independiente; puede ser multizona | Independiente; multizona por defecto en clases estándar (S3) | Durable (WAL + backup) | Opcional; desechable por diseño |
| **Compartición** | Una máquina | Normalmente una instancia a la vez | Muchas instancias | Muchos clientes, por red | Muchos clientes, con aislamiento transaccional | Muchos clientes |
| **Latencia** | La más baja | Baja (red) | Media (red + protocolo) | Más alta por operación (HTTP) | Depende de la consulta | La más baja (memoria) |
| **Escalabilidad** | Limitada por la máquina | Limitada por el volumen | Alta (servicios gestionados) | Muy alta | Vertical; la horizontal es difícil | Vertical y por *sharding* |
| **Mejor para** | Temporales, caché de build | Bases de datos, discos de sistema | Legado con FS compartido | Archivos, adjuntos, backups, media | Datos relacionales y transaccionales | Respuestas y sesiones derivadas |
| **Limitaciones** | Se pierde con la máquina | Anclado a una zona; costo de IOPS | Latencia en archivos pequeños; costo | Sin *rename*/*append*; consistencia entre claves | Malo para blobs grandes | Puede perderse; no es la fuente de la verdad |

(Tabla de síntesis a partir de la documentación citada. "Latencia" es cualitativa: su valor real depende de región, tipo y carga, y debe medirse.)

## Cuándo usar object storage

Considera un SaaS con subida de documentos, imágenes, videos, reportes, adjuntos y archivos generados automáticamente. Dos implementaciones.

**Alternativa A: `/uploads` en la propia VPS.**

- *Ventajas:* simplicidad total (el framework ya sabe hacerlo), latencia local, sin costo extra de servicio, sin dependencia de proveedor, control de acceso en la propia aplicación.
- *Limitaciones:* el archivo vive en el disco de la máquina, así que el disco debe estar en el backup (más volumen y más complejidad); la aplicación deja de ser *stateless* (una segunda instancia no ve los archivos); las subidas y descargas grandes consumen ancho de banda, CPU y conexiones del propio servidor; el crecimiento del volumen presiona el disco de la VPS y la ventana de backup; y la migración futura exige copiar todo.

**Alternativa B: object storage.**

- *Ventajas:* la aplicación queda sin estado local; la durabilidad y la replicación son del servicio; la subida y la descarga van directo al storage por URL firmada, sin pasar por tu servidor; *lifecycle* y versionado listos; crece sin redimensionar discos.
- *Limitaciones:* un componente más (y una cuenta, credenciales, políticas de acceso, CORS); latencia de red por operación; **costo por solicitud y por transferencia**; semántica distinta a la de un sistema de archivos; dependencia del proveedor (mitigada por una API compatible con S3, nunca eliminada).

### Flujo recomendado

1. El cliente solicita la subida (`POST /api/attachments`) indicando nombre, tipo y tamaño.
2. El backend **autentica y autoriza** (¿este usuario puede adjuntar a este documento?) y **valida** límites (tipo permitido, tamaño máximo, cuota del tenant).
3. El backend crea el registro en PostgreSQL con `status = 'pending'` y genera la **clave del objeto** (un identificador opaco, no el nombre original) y una **URL prefirmada de `PUT`** de corta duración.
4. El cliente envía el archivo **directo** al object storage (para archivos grandes, vía *multipart*).
5. El cliente (o un evento del storage) avisa al backend; este confirma que el objeto existe (`HEAD`), compara tamaño y checksum y marca `status = 'ready'`.
6. Toda **lectura** pasa por la aplicación: verifica el permiso y devuelve una URL firmada de `GET` corta (o sirve el archivo mediante una CDN con autenticación). El bucket permanece privado.

El esquema de metadatos en PostgreSQL (ejecutado en un PostgreSQL 17.10 local para validar la sintaxis y el plan de la consulta de limpieza):

```sql
CREATE TYPE attachment_status AS ENUM ('pending', 'ready', 'deleted');

CREATE TABLE attachments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     bigint NOT NULL REFERENCES tenants(id),
  document_id   bigint NOT NULL REFERENCES documents(id),
  storage_key   text NOT NULL UNIQUE,          -- ej.: t/7/2026/10/<uuid>, nunca el nombre original
  original_name text NOT NULL,
  content_type  text NOT NULL,
  size_bytes    bigint CHECK (size_bytes >= 0),
  checksum      text,
  status        attachment_status NOT NULL DEFAULT 'pending',
  created_by    bigint NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  retain_until  timestamptz,                    -- retención legal/contractual
  deleted_at    timestamptz
);

CREATE INDEX attachments_document_idx ON attachments (document_id) WHERE status = 'ready';
CREATE INDEX attachments_pending_idx  ON attachments (created_at)  WHERE status = 'pending';

-- Job de limpieza: subidas iniciadas y nunca confirmadas (usa el índice parcial de arriba)
SELECT storage_key FROM attachments
WHERE status = 'pending' AND created_at < now() - interval '24 hours';
```

Y la generación de la URL firmada en el backend (TypeScript con AWS SDK v3; probé la firma localmente, sin red, con un endpoint estilo R2 y credenciales ficticias; el `ContentLength` firmado hace que el storage rechace un cuerpo de tamaño distinto al declarado):

```ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: 'auto',                                           // R2; en AWS, la región real
  endpoint: 'https://<ACCOUNT_ID>.r2.cloudflarestorage.com', // omitir en AWS
  credentials: { accessKeyId: process.env.S3_KEY!, secretAccessKey: process.env.S3_SECRET! },
});

export const uploadUrl = (key: string, type: string, size: number) =>
  getSignedUrl(s3, new PutObjectCommand({
    Bucket: 'saas-files', Key: key, ContentType: type, ContentLength: size,
  }), { expiresIn: 300 });

export const downloadUrl = (key: string, filename: string) =>
  getSignedUrl(s3, new GetObjectCommand({
    Bucket: 'saas-files', Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  }), { expiresIn: 60 });
```

### Preguntas que el flujo debe responder

- **Eliminación y retención.** Elimina en dos fases: marca `deleted_at`/`status` en la base (respuesta inmediata al usuario) y borra el objeto en un job, respetando `retain_until`. Con el versionado activado, "eliminar" crea un *delete marker*; para borrar de verdad hace falta una regla de expiración de versiones no actuales, o pagas para siempre por archivos que "borraste".
- **Consistencia base ↔ storage.** No existe una transacción distribuida entre PostgreSQL y el bucket. El patrón `pending → ready` con un *job* de reconciliación (objetos huérfanos, registros sin objeto) es la respuesta pragmática.
- **Desacoplar la máquina de aplicación.** La aplicación guarda solo la *clave*, nunca una ruta de disco; la configuración del endpoint es externa. Cambiar de proveedor pasa a ser una copia de datos y un cambio de configuración, no una reescritura.
- **Cuándo guardar localmente sigue siendo buena decisión.** Archivos temporales, cachés, artefactos de build, volúmenes pequeños en un producto interno con una sola instancia y backup de disco funcionando. La alternativa A no es incorrecta; es una elección con un costo futuro conocido.
- **Cuándo tiene más sentido un file storage compartido.** Cuando la aplicación (a menudo legada) *necesita* semántica de sistema de archivos (locks POSIX, `rename`, lectura parcial) y reescribirla no es viable.
- **Cuándo no usar object storage.** Datos relacionales y transaccionales; archivos que necesitan edición parcial; cargas que exigen latencia de disco local por operación; metadatos (esos van en la base).

**El object storage no sustituye a un sistema de archivos ni a una base de datos**: es un tercer tipo de almacenamiento, excelente para blobs inmutables o rara vez reescritos, accedidos por la red.

## Dos arquitecturas completas para un SaaS

Un **escenario plausible, no un caso real**: un SaaS B2B con panel en Next.js, API en NestJS, PostgreSQL, subida de documentos y generación de reportes en PDF.

### Arquitectura A: todo en una VPS

```text
Cliente ─► Nginx ─┬─► Next.js (SSR)
                  └─► NestJS ─┬─► PostgreSQL (volumen local)
                              ├─► Redis (caché; desechable)
                              └─► worker de reportes (proceso/contenedor, cola en Redis o tabla)
Backups: pg_basebackup + WAL ─► object storage externo (otra cuenta/proveedor)
Subidas: URL firmada ─► object storage (opcional, recomendado desde el inicio)
```

- **Flujo.** La solicitud entra en Nginx (TLS), va a Next.js o a la API; la API consulta/escribe en PostgreSQL y usa Redis como caché; los reportes pesados van a un *worker* en la misma máquina.
- **Persistencia.** Base en el volumen local; **backups y archivos fuera de la máquina**.
- **Limitaciones.** Punto único de falla (máquina, zona, proveedor); el mantenimiento del host exige ventana (reinicio de kernel, actualización de PostgreSQL); los picos compiten por CPU entre web, API, base y workers; la recuperación ante desastres es un *restore* manual (RTO de horas, RPO igual al intervalo del WAL archivado, si está bien configurado).

### Arquitectura B: servicios distribuidos de cloud

```text
Cliente ─► CDN ─► Load balancer ─► N instancias stateless (Next.js + NestJS) en ≥2 zonas
                                       ├─► Base gestionada (primario + standby en otra zona; réplica de lectura)
                                       ├─► Object storage (subidas, reportes generados)
                                       ├─► Redis gestionado (caché)
                                       └─► Cola ─► Workers independientes (escalan según el tamaño de la cola)
Observabilidad: métricas, logs y traces centralizados; alertas; backups gestionados con PITR
```

- **Flujo.** La CDN absorbe estáticos y descargas; el balanceador reparte entre instancias saludables; la API encola reportes; los *workers* consumen la cola y guardan el PDF en el object storage; el cliente descarga por URL firmada.
- **Ganancias.** Sobrevive a la pérdida de una zona; escala la capa de aplicación y los *workers* de forma independiente; base con failover y backups gestionados.
- **Costos.** Más componentes, más configuración (redes, IAM, políticas), más costo fijo y variable, y el tracing/observabilidad pasan a ser obligatorios para diagnosticar fallas que ahora atraviesan servicios.

### Comparación

| Criterio | A: VPS | B: cloud distribuida |
|---|---|---|
| **Complejidad** | Baja; pocos componentes y una máquina que entender | Alta; muchas piezas, IAM, redes, colas |
| **Costo** | Predecible y bajo; se paga aunque esté ociosa | Variable; costo mínimo mayor (balanceador, base multizona, NAT, logs), escala con el uso |
| **Mantenimiento** | Tuyo: SO, parches, base, backups | Compartido: el proveedor opera parte del stack; tú operas configuración e integración |
| **Rendimiento** | Excelente con carga moderada (todo en la misma máquina, sin saltos de red) | Bueno y escalable, pero con latencia de red entre componentes |
| **Disponibilidad** | Limitada por la máquina única; la recuperación es manual | Puede sobrevivir a la pérdida de una zona, **si** se diseña y se prueba para eso |
| **Escalabilidad** | Vertical, con techo | Horizontal en la capa *stateless*; la base sigue siendo el punto difícil |
| **Seguridad** | Responsabilidad íntegramente tuya (hardening, parches); superficie pequeña | Responsabilidad compartida; recursos más ricos (IAM, KMS, auditoría), y también errores de configuración |
| **Dependencia del proveedor** | Baja (Docker + Linux se portan fácil) | Mayor, proporcional al uso de servicios propietarios |
| **Operación** | Poco compleja hasta el día del incidente grave | Más compleja en el día a día, con más instrumentos para incidentes |

**Ninguna es ganadora universal.** La respuesta depende de cuánto le cuesta al negocio una hora de indisponibilidad, del perfil de carga, de quién opera y del presupuesto. Un e-commerce con picos estacionales y un SLA contractual tiende a B; un sistema administrativo de una empresa con 200 usuarios en horario laboral tiende a A (**interpretación**).

## El costo real de la cloud

Los componentes principales:

- **Cómputo** (instancias, contenedores, funciones), cobrado por tiempo o por uso.
- **Almacenamiento** (volúmenes, archivos, objetos) por GB-mes, más **solicitudes**.
- ***Egress*** (salida de datos a internet) y **transferencia entre regiones y entre zonas**, la línea que más sorprende. La página de precios de EC2 informa 100 GB/mes de transferencia a internet gratuitos, agregados entre servicios (excepto China y GovCloud); por encima de eso hay tarifas por tramos que dependen de la región.
- **Balanceadores**, **NAT**, **IPs públicas**, **DNS**.
- **Servicios gestionados** (base, caché, cola), que incorporan el costo de operación y de redundancia.
- **Backups y snapshots**, retención y copias entre regiones.
- **Observabilidad, logs y monitoreo**, normalmente cobrados por volumen ingerido y retenido.
- **Mantenimiento y tiempo de ingeniería**: el ítem que no aparece en la factura.

El **TCO (*Total Cost of Ownership*)** es la suma de todo eso durante la vida del sistema: costo de adquisición/suscripción, operación, personas, incidentes, migración futura y el **costo de oportunidad** de que el equipo cuide infraestructura en lugar de producto. Comparar el precio de una VPS con el de una instancia cloud equivalente es una comparación incompleta; la comparación correcta es arquitectura contra arquitectura, incluyendo a las personas.

**Cómo una arquitectura distribuida resulta más cara para una aplicación pequeña.** Aritmética de costos fijos, sin cifras de precios: A tiene un costo (la VPS). B tiene la suma del costo *mínimo* de cada servicio necesario para ser B: dos o más instancias de aplicación (para que la redundancia tenga sentido), un balanceador, una base multizona, NAT/red, observabilidad y backups. Ese piso existe aun con tráfico casi nulo; el beneficio (disponibilidad, elasticidad) solo se paga si el negocio *usa* esas propiedades.

**Cuándo los servicios gestionados reducen costo y riesgo.** Cuando el costo de un incidente o de un día de ingeniero es mayor que la diferencia de precio. Operar PostgreSQL con replicación, *failover*, backups con PITR probados y actualizaciones exige competencia y atención continuas; una base gestionada transfiere parte de eso. Lo mismo vale para el object storage frente a operar un clúster propio.

**Un precio con sus condiciones (el ejemplo de R2).** La página oficial de precios de Cloudflare R2, consultada el 31/10/2026 (la propia página indicaba una actualización el 30/10/2026), lista para la clase **Standard**: almacenamiento a **US$ 0,015 por GB-mes**, operaciones **Clase A** (escritura/listado, ej.: `PutObject`, `ListObjects`, `CreateMultipartUpload`) a **US$ 4,50 por millón**, operaciones **Clase B** (lectura, ej.: `GetObject`, `HeadObject`) a **US$ 0,36 por millón**, y **sin cobro de *egress*** (la página advierte que otros servicios medidos conectados al bucket pueden cobrar). Un cálculo **hipotético** solo de almacenamiento: 500 GB en Standard = 500 × 0,015 = **US$ 7,50 por mes**, sin contar operaciones. Ese número vale solo con esas condiciones (clase Standard, sin *Infrequent Access*, sin operaciones, sin impuestos), y los precios cambian; **consulta la tabla vigente antes de decidir**. No comparé precios de S3/GCS aquí porque las tablas oficiales de egress dependen de la región y del tramo, y no pude extraerlas de forma verificable durante la investigación; la comparación correcta para tu caso debe usar la calculadora del proveedor, con tu región.

## Estrategia de evolución arquitectónica

Arquitectura evolutiva significa **empezar simple y dejar las fronteras correctas en su lugar**, para que cambiar cueste poco cuando aparezca el requisito. Una secuencia plausible, en que cada escalón se da solo cuando un requisito medible lo justifica:

1. **Monolito modular en una VPS**, con módulos internos bien delimitados (cuentas, facturación, documentos), migraciones versionadas y pruebas. Ya en esta etapa:
   - **archivos en object storage** desde el inicio (barato de hacer temprano, caro de migrar tarde);
   - **sesiones y estado fuera del proceso** (cookie firmada/Redis), para que la aplicación sea *stateless*;
   - **backups externos con restauración probada**.
2. **Trabajo asíncrono**: *workers* y cola (al principio, una tabla en PostgreSQL o Redis) para reportes y correos, sacando el trabajo pesado del camino de la solicitud.
3. **Separar la base de la máquina de aplicación**, hacia un host propio o un servicio gestionado, cuando aparezca la disputa por recursos o la necesidad de failover.
4. **Segunda instancia de aplicación + balanceador**, lo que solo es posible si la etapa 1 se hizo correctamente.
5. **Alta disponibilidad de la base y réplicas de lectura**, cuando el RPO/RTO o una lectura pesada lo exijan.
6. **Recuperación ante desastres entre regiones** (*pilot light*, *warm standby*, etc., las estrategias del whitepaper de AWS), cuando perder una región sea un escenario que el negocio deba soportar.

**Los microservicios y Kubernetes no son una evolución obligatoria.** La propia documentación de Kubernetes dice qué no es: no es un PaaS todo incluido, no construye ni despliega tu código fuente y **no provee bases de datos, cachés ni sistemas de almacenamiento de clúster como servicios nativos**; orquesta contenedores. Tiene sentido cuando el número de servicios, equipos y despliegues independientes hace de la orquestación manual el cuello de botella. Separar un servicio resuelve un problema real cuando hay **escala independiente** (un componente con un perfil de carga muy distinto), **aislamiento de fallas** (un módulo inestable no puede tumbar a los demás), **ciclos de despliegue y equipos independientes** o **tecnologías distintas por necesidad**. Cuando nada de eso existe, solo cambias una llamada de función por una llamada de red, ganando latencia, fallas parciales, versionado de contratos y depuración distribuida. (Los artículos sobre [microservicios](/pt/blog/microsservicos-quando-fazem-sentido) y sobre [escalabilidad](/pt/blog/escalabilidade-de-sistemas), ambos en portugués, profundizan en esta decisión.)

Una regla práctica (**opinión**): trata cada escalón como respuesta a un número que mediste (latencia p95, saturación de CPU, tiempo de restauración, costo de una hora fuera de línea), no a una tendencia.

## Preguntas frecuentes

**¿Cuántos usuarios aguanta una VPS?**
No existe un número. Depende de las solicitudes por segundo, del costo de cada solicitud, del tamaño de los datos y de la eficiencia de las consultas. Mide la utilización de CPU, memoria, I/O y conexiones bajo carga real y haz pruebas de carga con tu perfil de acceso.

**¿Una base gestionada es siempre mejor que PostgreSQL en la propia VPS?**
No. Reduce el trabajo operativo (failover, backup, actualización) y cuesta más, con menos control fino. Si el equipo sabe operarla, tiene backups con PITR probados y tolera el RTO de un restore, PostgreSQL en la VPS es una elección defendible.

**¿Puedo empezar en la VPS y migrar después?**
Sí, siempre que las fronteras estén bien puestas: aplicación sin estado local, archivos en object storage, configuración externalizada, migraciones versionadas y backups restaurables. Lo que encarece la migración es el acoplamiento, no la VPS.

**¿La replicación reemplaza al backup?**
No. La replicación copia también el error (un `DELETE` indebido, una corrupción). El backup con punto en el tiempo y el versionado protegen contra eso; la replicación protege contra la falla de una máquina.

## Conclusión

La infraestructura es un conjunto de promesas que compras y que tienes que operar: disponibilidad, durabilidad, capacidad, recuperación. Cada promesa tiene un precio, en dinero y en complejidad, y solo vale la pena pagar por las que el sistema usa. Una VPS bien administrada promete poco y lo cumple a bajo costo; la cloud promete mucho y cobra en componentes, configuración y factura.

La decisión defendible es la que puedes **justificar con requisitos**: qué RPO, qué RTO, qué pico, qué presupuesto de incidentes, quién va a operar. Si puedes enunciar el requisito que una VPS no cumple, tienes la razón para el siguiente escalón. Si no puedes, lo que tienes es una preferencia. Y, en ambos casos, lo que protege al sistema no es la cantidad de servicios, sino los fundamentos que valen en cualquier infraestructura: consultas eficientes, estado fuera de la máquina de aplicación, backups realmente restaurados, monitoreo que avisa antes que el usuario y una arquitectura que tu equipo entiende de punta a punta.

## Referencias

Este artículo es un estudio basado en las fuentes siguientes. Los pasajes marcados como opinión reflejan mi lectura. Todas las páginas se consultaron el 31/10/2026; los precios, los SLA y el estado de los proyectos cambian, así que confirma en la fuente antes de decidir. Los experimentos (esquema SQL, consulta con y sin índice, `docker compose config`, `nginx -t` y generación de URL firmada) se ejecutaron localmente y los números ilustran el mecanismo; no representan un benchmark.

- Knuth, D. E. *Structured Programming with go to Statements*. ACM Computing Surveys, 6(4), 1974 (referencia bibliográfica; no pude abrir una página oficial para verificarla, por eso no incluyo URL).
- NIST, [SP 800-145: The NIST Definition of Cloud Computing](https://csrc.nist.gov/pubs/sp/800/145/final)
- AWS, [Modelo de responsabilidad compartida](https://aws.amazon.com/compliance/shared-responsibility-model/)
- AWS, [Reliability Pillar: Design principles](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/design-principles.html)
- Google Cloud, [Well-Architected Framework: Reliability](https://docs.cloud.google.com/architecture/framework/reliability)
- Microsoft, [Azure Well-Architected Framework: Reliability design principles](https://learn.microsoft.com/en-us/azure/well-architected/reliability/principles)
- AWS, [Disaster recovery options in the cloud](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html)
- AWS, [Amazon EC2 Service Level Agreement](https://aws.amazon.com/compute/sla/)
- AWS, [Amazon RDS: Multi-AZ DB instance deployments](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html)
- AWS, [Amazon EC2 Auto Scaling: Auto Scaling groups](https://docs.aws.amazon.com/autoscaling/ec2/userguide/auto-scaling-groups.html)
- AWS, [What is Elastic Load Balancing?](https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html)
- AWS, [What is Amazon EBS?](https://docs.aws.amazon.com/ebs/latest/userguide/what-is-ebs.html)
- AWS, [What is Amazon EFS?](https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html)
- AWS, [What is Amazon S3?](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) y [Data protection in Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/DataDurability.html)
- AWS, [S3 presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html), [Multipart upload](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html), [Versioning](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html) y [Lifecycle](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- AWS, [Amazon EC2 On-Demand Pricing](https://aws.amazon.com/ec2/pricing/on-demand/) (sección de transferencia de datos)
- Google Cloud, [Cloud Storage consistency](https://docs.cloud.google.com/storage/docs/consistency)
- Cloudflare, [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [R2 consistency model](https://developers.cloudflare.com/r2/reference/consistency/) y [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- MinIO, [repositorio oficial en GitHub](https://github.com/minio/minio) (estado del proyecto en la fecha de consulta)
- PostgreSQL Documentation 17, [TOAST](https://www.postgresql.org/docs/17/storage-toast.html), [Large Objects](https://www.postgresql.org/docs/17/largeobjects.html), [Continuous Archiving and PITR](https://www.postgresql.org/docs/17/continuous-archiving.html), [High Availability, Load Balancing, and Replication](https://www.postgresql.org/docs/17/different-replication-solutions.html) y [Connection Settings](https://www.postgresql.org/docs/17/runtime-config-connection.html)
- Redis, [Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
- Docker, [Compose in production](https://docs.docker.com/compose/how-tos/production/) y [Volumes](https://docs.docker.com/engine/storage/volumes/)
- Kubernetes, [Overview](https://kubernetes.io/docs/concepts/overview/)
