---
title: "Go for Backend: Why the Language Works Well for Services"
description: "Why Go is so widely used in backend and infrastructure: scale-oriented software engineering design, concurrency with goroutines, standard tooling, and limitations."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/go-para-backend.webp"
coverAlt: "Illustration of three goroutines in parallel lanes exchanging values through a channel highlighted in yellow"
category: "Backend"
tags:
  - "Go"
  - "Backend"
  - "Concurrency"
  - "APIs"
draft: false
lang: "en"
translationKey: "go-for-backend"
---

Go is the language behind much of the infrastructure powering the modern web: Docker, Kubernetes, Prometheus, and Terraform are all written in it. It is also a frequent choice for APIs, networking services, and command-line tools.

In this article, I explain why the language works so well for this type of system, drawing from texts by the Go team itself. I share idiomatic code examples and discuss its limitations, because no single language is the answer to everything.

## Why Go Was Created

In 2012, Rob Pike presented the talk *Go at Google: Language Design in the Service of Software Engineering* at the SPLASH conference. The paper explains that the language was born to tackle software development problems at scale within Google: slow builds (he cites a 2007 binary that took 45 minutes to compile), uncontrolled dependencies, each programmer using a different subset of the language, and the difficulty of maintaining large codebases.

One sentence from the text sums up the philosophy: Go is more about software engineering than programming language research.

This origin explains design choices that, at first glance, might look like limitations:

- **Unused imports are compilation errors**, and circular imports are forbidden. The dependency graph remains strictly explicit.
- **Small grammar and an official formatter (`gofmt`).** Code across different projects looks identical, eliminating style arguments.
- **Few ways to do the same thing.** Less expressiveness, more readability for newcomers.

## What the Language Delivers

- **Single static binary.** Straightforward deployments, lightweight container images, and no separate runtime to install.
- **Fast compilation.** Short edit-compile-test cycles.
- **Robust networking standard library.** `net/http`, `encoding/json`, `context`, `testing`, and `log/slog` handle an immense amount without external dependencies.
- **Integrated tooling.** `go test`, `go vet`, `go fmt`, profiling with `pprof`, and a built-in race detector (`-race`).
- **Compatibility promise.** Programs written for Go 1 continue to compile on subsequent versions, barring documented exceptions.
- **Generics since version 1.18** (March 2022), reserved for cases where they are genuinely needed.

The release cycle is predictable: a major version every six months, typically in February and August. The latest at the time of writing is 1.27, released in August 2026. Under the official support policy, each major version receives security and bug fixes until two newer versions exist.

## Concurrency: Goroutines and Channels

The best-known feature of Go is its built-in concurrency model. A **goroutine** is a function running concurrently, managed by the Go runtime, significantly lighter than an operating system thread. **Channels** allow goroutines to exchange values safely.

*Effective Go* summarizes the approach with a phrase that became an industry proverb: do not communicate by sharing memory; share memory by communicating.

A practical example: fetching data from multiple services in parallel, canceling everything if one fails or if the timeout expires. The `errgroup` package (from `golang.org/x/sync`) combined with `context` accomplishes this in just a few lines:

```go
package dashboard

import (
	"context"
	"time"

	"golang.org/x/sync/errgroup"
)

type Dashboard struct {
	Orders    []Order
	Customers []Customer
	Inventory []Item
}

func LoadDashboard(ctx context.Context) (*Dashboard, error) {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	g, ctx := errgroup.WithContext(ctx)
	var d Dashboard

	g.Go(func() (err error) {
		d.Orders, err = fetchOrders(ctx)
		return err
	})
	g.Go(func() (err error) {
		d.Customers, err = fetchCustomers(ctx)
		return err
	})
	g.Go(func() (err error) {
		d.Inventory, err = fetchInventory(ctx)
		return err
	})

	// Waits for all; if one fails, ctx is canceled for the others.
	if err := g.Wait(); err != nil {
		return nil, err
	}
	return &d, nil
}
```

Each goroutine writes to a separate field in the struct, eliminating data races. Furthermore, `context` propagates deadlines and cancellation signals to internal calls, provided they respect the received `ctx`.

## An HTTP API Using Only the Standard Library

Since Go 1.22, the standard multiplexer (`http.ServeMux`) supports HTTP methods and path parameters directly in routing patterns. For many services, this eliminates the need for a third-party framework:

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

	mux.HandleFunc("GET /orders/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"id": id, "status": "paid"})
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
			slog.Error("server stopped", "err", err)
			os.Exit(1)
		}
	}()

	<-ctx.Done() // wait for SIGTERM or Ctrl+C

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("error during shutdown", "err", err)
	}
}
```

Two details that make a huge difference in production: `ReadHeaderTimeout` prevents dangling, slow connections from exhausting resources, and graceful shutdown (`Shutdown`) allows in-flight requests to complete before terminating, which is critical in containerized environments.

## Errors as Values

Go does not have exceptions in the Java or TypeScript sense. Functions return an `error` as their final return value, and the caller explicitly handles it. While verbose, it makes every single failure point obvious in code.

```go
var ErrOrderNotFound = errors.New("order not found")

func FetchOrder(ctx context.Context, id string) (*Order, error) {
	o, err := repo.Find(ctx, id)
	if err != nil {
		// %w wraps the original error for errors.Is and errors.As
		return nil, fmt.Errorf("fetch order %s: %w", id, err)
	}
	if o == nil {
		return nil, ErrOrderNotFound
	}
	return o, nil
}

// In the HTTP layer
if errors.Is(err, ErrOrderNotFound) {
	http.Error(w, "not found", http.StatusNotFound)
	return
}
```

## Where Go Appears in Public Case Studies

A notable example: in their 2024 blog post on PostgreSQL sharding, Figma's databases team describes DBProxy, the service that sits between the application and PgBouncer, parses queries, and routes them to the correct shards. It is written in Go. This is precisely the kind of system where Go shines: a concurrent networking service with demanding latency and reliability requirements. I discuss this case study in greater detail in the article on [system scalability](/en/blog/system-scalability).

## Honest Limitations

- **Garbage collection.** For the vast majority of backend services, GC pauses are negligible. For ultra-low-latency workloads, they can become an issue. In 2020, Discord published *Why Discord is switching from Go to Rust*, explaining that an in-memory cache service suffered recurring latency spikes caused by GC sweeps, and upgrading versions or tuning settings did not resolve it. Context matters: the service was running Go 1.9.2, and the runtime has improved substantially since. Still, the case illustrates that tooling choices depend on workload characteristics.
- **Verbosity.** Explicit error checking and the absence of certain syntactic abstractions make code longer.
- **Data science and machine learning ecosystem.** Python remains leagues ahead in tooling and libraries for data science and ML workloads.
- **Rich domain modeling.** Without inheritance and with a straightforward type system, certain complex domain models feel less elegant than in languages like Kotlin or TypeScript.

In my opinion, Go is an outstanding choice for network services, APIs, background workers, CLIs, and cloud infrastructure. For a straightforward CRUD product with dozens of screens, an engineering team already fluent in TypeScript might be more productive maintaining a single language across the entire stack. Technical decisions should factor in team dynamics, not just programming language features.

## How to Get Started

1. **[A Tour of Go](https://go.dev/tour/):** the official interactive tutorial.
2. **[Effective Go](https://go.dev/doc/effective_go):** the guide to language style and idioms.
3. **[Organizing a Go module](https://go.dev/doc/modules/layout):** official recommendations on project structure.
4. **Build a small, real project:** an API with `net/http`, a background worker consuming a queue, or a CLI automating personal workflows.

## References

This article is a technical study based on the sources below. Sections marked as opinion reflect my own analysis.

- Rob Pike. [Go at Google: Language Design in the Service of Software Engineering](https://go.dev/talks/2012/splash.article) (SPLASH, October 2012).
- The Go Authors. [Effective Go](https://go.dev/doc/effective_go).
- The Go Authors. [Go 1 and the Future of Go Programs](https://go.dev/doc/go1compat).
- The Go Authors. [Release History](https://go.dev/doc/devel/release).
- The Go Authors. [Routing Enhancements for Go 1.22](https://go.dev/blog/routing-enhancements).
- Sammy Steele, Figma. [How Figma's databases team lived to tell the scale](https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/) (March 2024).
- Jesse Howarth, Discord. [Why Discord is switching from Go to Rust](https://discord.com/blog/why-discord-is-switching-from-go-to-rust) (February 2020).
