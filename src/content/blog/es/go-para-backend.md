---
title: "Go para backend: por qué el lenguaje funciona bien en servicios"
description: "Por qué Go se utiliza tanto en backend e infraestructura: diseño orientado a la ingeniería a escala, concurrencia con goroutines, herramientas estándar y limitaciones."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/go-para-backend.webp"
coverAlt: "Ilustración de tres goroutines en líneas paralelas intercambiando valores a través de un canal resaltado en amarillo"
category: "Backend"
tags:
  - "Go"
  - "Backend"
  - "Concurrencia"
  - "APIs"
draft: false
lang: "es"
translationKey: "go-for-backend"
---

Go es el lenguaje que sustenta gran parte de la infraestructura de la web moderna: Docker, Kubernetes, Prometheus y Terraform están escritos en él. También es una elección frecuente para APIs, servicios de red y herramientas de línea de comandos.

En este artículo explico por qué el lenguaje funciona tan bien en este tipo de sistemas, basándome en textos del propio equipo de Go. Muestro ejemplos de código idiomático y abordo también sus limitaciones, porque ningún lenguaje es la respuesta para todo.

## Por qué se creó Go

En 2012, Rob Pike presentó en la conferencia SPLASH la ponencia *Go at Google: Language Design in the Service of Software Engineering*. El artículo explica que el lenguaje nació para abordar problemas de desarrollo de software a gran escala dentro de Google: compilaciones lentas (menciona un binario de 2007 que tardaba 45 minutos en compilar), dependencias descontroladas, cada programador usando un subconjunto diferente del lenguaje y la dificultad de mantener grandes bases de código.

Una frase del texto resume la filosofía: Go tiene más que ver con la ingeniería de software que con la investigación en lenguajes de programación.

Este origen explica decisiones de diseño que, a primera vista, podrían parecer limitaciones:

- **Las importaciones no utilizadas son errores de compilación**, y las dependencias circulares están prohibidas. El grafo de dependencias permanece siempre explícito.
- **Gramática pequeña y un formateador oficial (`gofmt`).** El código de diferentes proyectos tiene exactamente el mismo aspecto y se acaban las discusiones de estilo.
- **Pocas formas de hacer lo mismo.** Menor expresividad, mayor legibilidad para quienes se incorporan al proyecto.

## Lo que entrega el lenguaje

- **Binario estático único.** Despliegue simple, imágenes de contenedor ligeras y ningún runtime separado que instalar.
- **Compilación rápida.** Ciclo corto de edición, compilación y pruebas.
- **Biblioteca estándar robusta para redes.** `net/http`, `encoding/json`, `context`, `testing` y `log/slog` resuelven muchísimo sin necesidad de dependencias externas.
- **Herramientas integradas.** `go test`, `go vet`, `go fmt`, análisis de rendimiento con `pprof` y detector de condiciones de carrera (`-race`).
- **Compromiso de compatibilidad.** Los programas escritos para Go 1 continúan compilando en versiones posteriores, salvo excepciones documentadas.
- **Genéricos desde la versión 1.18** (marzo de 2022), para aquellos casos en los que realmente hacen falta.

El ciclo de lanzamientos es predecible: una versión principal cada seis meses, normalmente en febrero y agosto. La más reciente en el momento en que escribo es la 1.27, de agosto de 2026. Según la política oficial, cada versión principal recibe correcciones hasta que existan dos versiones más nuevas.

## Concurrencia: goroutines y canales

La característica más conocida de Go es su modelo de concurrencia integrado. Una **goroutine** es una función ejecutada de forma concurrente, gestionada por el runtime de Go, mucho más ligera que un hilo del sistema operativo. Los **canales (channels)** permiten que las goroutines intercambien valores de forma segura.

*Effective Go* resume el enfoque con una frase que se convirtió en proverbio: no te comuniques compartiendo memoria; comparte memoria comunicándote.

Un ejemplo práctico: obtener datos de varios servicios en paralelo, cancelando todo si uno de ellos falla o si se agota el tiempo límite. El paquete `errgroup` (de `golang.org/x/sync`) junto con `context` resuelve esto en pocas líneas:

```go
package panel

import (
	"context"
	"time"

	"golang.org/x/sync/errgroup"
)

type Panel struct {
	Pedidos  []Pedido
	Clientes []Cliente
	Stock    []Item
}

func CargarPanel(ctx context.Context) (*Panel, error) {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	g, ctx := errgroup.WithContext(ctx)
	var p Panel

	g.Go(func() (err error) {
		p.Pedidos, err = buscarPedidos(ctx)
		return err
	})
	g.Go(func() (err error) {
		p.Clientes, err = buscarClientes(ctx)
		return err
	})
	g.Go(func() (err error) {
		p.Stock, err = buscarStock(ctx)
		return err
	})

	// Espera a todas; si una falla, ctx se cancela para las demás.
	if err := g.Wait(); err != nil {
		return nil, err
	}
	return &p, nil
}
```

Cada goroutine escribe en un campo diferente de la estructura, por lo que no hay disputas de datos. Y `context` propaga el tiempo límite y la cancelación a las llamadas internas, siempre que estas respeten el `ctx` recibido.

## Una API HTTP utilizando únicamente la biblioteca estándar

Desde Go 1.22, el enrutador estándar (`http.ServeMux`) admite métodos HTTP y parámetros de ruta en los patrones. Para muchos servicios, esto elimina por completo la necesidad de un framework:

```go
package main

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /pedidos/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"id": id, "status": "pagado"})
	})

	srv := &http.Server{
		Addr:              ":8080",
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("el servidor se detuvo", "err", err)
			os.Exit(1)
		}
	}()

	<-ctx.Done() // espera SIGTERM o Ctrl+C

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("error durante el shutdown", "err", err)
	}
}
```

Dos detalles que marcan la diferencia en producción: `ReadHeaderTimeout` evita que conexiones lentas queden colgadas indefinidamente, y el cierre ordenado (`Shutdown`) permite que las solicitudes en curso finalicen antes de terminar el proceso, algo crítico en despliegues con contenedores.

## Errores como valores

Go no tiene excepciones en el sentido de Java o TypeScript. Las funciones retornan un `error` como último valor devuelto, y la función llamadora decide explícitamente qué hacer. Resulta más verboso, pero hace evidente cada punto en el que algo puede fallar.

```go
var ErrPedidoNoEncontrado = errors.New("pedido no encontrado")

func BuscarPedido(ctx context.Context, id string) (*Pedido, error) {
	p, err := repo.Buscar(ctx, id)
	if err != nil {
		// %w preserva el error original para errors.Is y errors.As
		return nil, fmt.Errorf("buscar pedido %s: %w", id, err)
	}
	if p == nil {
		return nil, ErrPedidoNoEncontrado
	}
	return p, nil
}

// En la capa HTTP
if errors.Is(err, ErrPedidoNoEncontrado) {
	http.Error(w, "no encontrado", http.StatusNotFound)
	return
}
```

## Dónde aparece Go en casos públicos

Un ejemplo reciente: en su artículo sobre sharding de Postgres publicado en 2024, el equipo de bases de datos de Figma describe DBProxy, el servicio que se ubica entre la aplicación y PgBouncer, interpreta las consultas y las enruta hacia los shards correctos. Está escrito en Go. Es exactamente el tipo de sistema en el que el lenguaje destaca: un servicio de red, concurrente, con requisitos exigentes de latencia y fiabilidad. Comento este caso con más detalle en el artículo sobre [escalabilidad de sistemas](/es/blog/escalabilidad-de-sistemas).

## Limitaciones honestas

- **Recolector de basura (Garbage Collector).** Para la gran mayoría de servicios, las pausas del GC son despreciables. Para cargas de trabajo con latencia crítica, pueden no serlo. En 2020, Discord publicó *Why Discord is switching from Go to Rust*, explicando que un servicio con una gran caché en memoria sufría picos periódicos de latencia causados por el GC, y que actualizar de versión o ajustar los parámetros del runtime no lo solucionó. Vale el contexto: el servicio ejecutaba Go 1.9.2, y el runtime ha evolucionado considerablemente desde entonces. Aun así, el caso demuestra que la elección tecnológica depende de la carga de trabajo.
- **Verbosidad.** El manejo explícito de errores y la ausencia de ciertas abstracciones hacen que el código sea más extenso.
- **Ecosistema de datos y machine learning.** Python sigue estando muy por delante en bibliotecas para ciencia de datos y ML.
- **Modelado de dominio complejo.** Sin herencia y con un sistema de tipos más simple, ciertos modelos resultan menos elegantes que en lenguajes como Kotlin o TypeScript.

En mi opinión, Go es una excelente elección para servicios de red, APIs, workers, CLIs e infraestructura. Para un producto CRUD con muchas pantallas, un equipo con experiencia en TypeScript puede ser más productivo manteniendo un único lenguaje tanto en el frontend como en el backend. La decisión debe considerar el equipo, no únicamente el lenguaje.

## Cómo empezar

1. **[A Tour of Go](https://go.dev/tour/):** el tutorial interactivo oficial.
2. **[Effective Go](https://go.dev/doc/effective_go):** la guía de estilo e idiomas del lenguaje.
3. **[Organizing a Go module](https://go.dev/doc/modules/layout):** la recomendación oficial de estructura de proyectos.
4. **Un proyecto real y pequeño:** una API con `net/http`, un worker que consuma una cola o una CLI que automatice una tarea propia.

## Referencias

Este artículo es un estudio técnico basado en las fuentes siguientes. Los fragmentos marcados como opinión reflejan mi lectura.

- Rob Pike. [Go at Google: Language Design in the Service of Software Engineering](https://go.dev/talks/2012/splash.article) (SPLASH, octubre de 2012).
- The Go Authors. [Effective Go](https://go.dev/doc/effective_go).
- The Go Authors. [Go 1 and the Future of Go Programs](https://go.dev/doc/go1compat).
- The Go Authors. [Release History](https://go.dev/doc/devel/release).
- The Go Authors. [Routing Enhancements for Go 1.22](https://go.dev/blog/routing-enhancements).
- Sammy Steele, Figma. [How Figma's databases team lived to tell the scale](https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/) (marzo de 2024).
- Jesse Howarth, Discord. [Why Discord is switching from Go to Rust](https://discord.com/blog/why-discord-is-switching-from-go-to-rust) (febrero de 2020).
