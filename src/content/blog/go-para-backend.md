---
title: "Go para backend: por que a linguagem funciona bem em serviços"
description: "Por que Go é tão usado em backend e infraestrutura: design voltado à engenharia em escala, concorrência com goroutines, ferramentas padrão e limitações."
pubDate: 2026-10-29
author: "Gabriel Campos"
category: "Backend"
tags:
  - "Go"
  - "Backend"
  - "Concorrência"
  - "APIs"
draft: false
---

Go é a linguagem de boa parte da infraestrutura que sustenta a web moderna: Docker, Kubernetes, Prometheus e Terraform são escritos nela. Também é uma escolha frequente para APIs, serviços de rede e ferramentas de linha de comando.

Neste artigo explico por que a linguagem funciona bem nesse tipo de sistema, com base em textos do próprio time do Go, mostro exemplos de código idiomático e falo também das limitações, porque nenhuma linguagem é a resposta para tudo.

## Por que o Go foi criado

Em 2012, Rob Pike apresentou na conferência SPLASH a palestra *Go at Google: Language Design in the Service of Software Engineering*. O texto explica que a linguagem nasceu para atacar problemas de desenvolvimento de software em escala dentro do Google: builds lentos (ele cita um binário de 2007 que levava 45 minutos para compilar), dependências descontroladas, cada programador usando um subconjunto diferente da linguagem e dificuldade de manter grandes bases de código.

Uma frase do texto resume a filosofia: Go tem mais a ver com engenharia de software do que com pesquisa em linguagens de programação.

Essa origem explica escolhas que, à primeira vista, parecem limitações:

- **Importação não usada é erro de compilação**, e importações circulares são proibidas. O grafo de dependências fica sempre explícito.
- **Gramática pequena e um formatador oficial (`gofmt`).** O código de projetos diferentes tem a mesma cara, e discussões de estilo acabam.
- **Poucas formas de fazer a mesma coisa.** Menos expressividade, mais legibilidade para quem chega depois.

## O que a linguagem entrega

- **Binário estático único.** Deploy simples, imagens de contêiner pequenas, nada de runtime separado para instalar.
- **Compilação rápida.** Ciclo curto de edição e teste.
- **Biblioteca padrão forte para rede.** `net/http`, `encoding/json`, `context`, `testing` e `log/slog` resolvem muito sem dependências externas.
- **Ferramentas integradas.** `go test`, `go vet`, `go fmt`, perfilamento com `pprof` e detector de condição de corrida (`-race`).
- **Compromisso de compatibilidade.** Programas escritos para Go 1 continuam compilando nas versões seguintes, salvo exceções documentadas.
- **Generics desde a versão 1.18** (março de 2022), para os casos em que realmente fazem falta.

O ciclo de lançamentos é previsível: uma versão principal a cada seis meses, normalmente em fevereiro e agosto. A mais recente no momento em que escrevo é a 1.27, de agosto de 2026. Pela política oficial, cada versão principal recebe correções até que existam duas versões mais novas.

## Concorrência: goroutines e channels

O recurso mais conhecido do Go é a concorrência embutida na linguagem. Uma **goroutine** é uma função executada de forma concorrente, gerenciada pelo runtime, muito mais leve que uma thread do sistema operacional. **Channels** permitem que goroutines troquem valores com segurança.

O *Effective Go* resume a abordagem com uma frase que virou provérbio: não se comunique compartilhando memória; compartilhe memória se comunicando.

Um exemplo prático: buscar dados de vários serviços em paralelo, cancelando tudo se um deles falhar ou se o tempo acabar. O pacote `errgroup` (de `golang.org/x/sync`) junto com `context` resolve isso em poucas linhas:

```go
package painel

import (
	"context"
	"time"

	"golang.org/x/sync/errgroup"
)

type Painel struct {
	Pedidos  []Pedido
	Clientes []Cliente
	Estoque  []Item
}

func CarregarPainel(ctx context.Context) (*Painel, error) {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	g, ctx := errgroup.WithContext(ctx)
	var p Painel

	g.Go(func() (err error) {
		p.Pedidos, err = buscarPedidos(ctx)
		return err
	})
	g.Go(func() (err error) {
		p.Clientes, err = buscarClientes(ctx)
		return err
	})
	g.Go(func() (err error) {
		p.Estoque, err = buscarEstoque(ctx)
		return err
	})

	// Espera todas; se uma falhar, o ctx é cancelado para as outras.
	if err := g.Wait(); err != nil {
		return nil, err
	}
	return &p, nil
}
```

Cada goroutine escreve em um campo diferente da struct, então não há disputa pelo mesmo dado. E o `context` propaga o prazo e o cancelamento para as chamadas internas, desde que elas respeitem o `ctx` recebido.

## Uma API HTTP só com a biblioteca padrão

Desde o Go 1.22, o roteador padrão (`http.ServeMux`) aceita método HTTP e parâmetros no padrão da rota. Para muitos serviços, isso elimina a necessidade de um framework:

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
		json.NewEncoder(w).Encode(map[string]string{"id": id, "status": "pago"})
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
			slog.Error("servidor parou", "err", err)
			os.Exit(1)
		}
	}()

	<-ctx.Done() // espera SIGTERM ou Ctrl+C

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("erro no shutdown", "err", err)
	}
}
```

Dois detalhes que fazem diferença em produção: o `ReadHeaderTimeout` evita conexões penduradas indefinidamente, e o desligamento gracioso (`Shutdown`) termina as requisições em andamento antes de encerrar, o que importa em deploys com contêineres.

## Erros como valores

Go não tem exceções no sentido de Java ou TypeScript. Funções retornam um `error` como último valor, e quem chama decide o que fazer. É verboso, mas deixa explícito cada ponto em que algo pode falhar.

```go
var ErrPedidoNaoEncontrado = errors.New("pedido não encontrado")

func BuscarPedido(ctx context.Context, id string) (*Pedido, error) {
	p, err := repo.Buscar(ctx, id)
	if err != nil {
		// %w preserva o erro original para errors.Is e errors.As
		return nil, fmt.Errorf("buscar pedido %s: %w", id, err)
	}
	if p == nil {
		return nil, ErrPedidoNaoEncontrado
	}
	return p, nil
}

// Na camada HTTP
if errors.Is(err, ErrPedidoNaoEncontrado) {
	http.Error(w, "não encontrado", http.StatusNotFound)
	return
}
```

## Onde Go aparece em casos públicos

Um exemplo recente: no post sobre sharding de Postgres publicado em 2024, o time de bancos de dados da Figma descreve o DBProxy, o serviço que fica entre a aplicação e o PgBouncer, interpreta as consultas e as roteia para os shards corretos. Ele é escrito em Go. É o tipo de sistema em que a linguagem brilha: um serviço de rede, concorrente, com requisitos de latência e confiabilidade. Comento esse caso com mais detalhes no artigo sobre [escalabilidade de sistemas](/blog/escalabilidade-de-sistemas).

## Limitações honestas

- **Garbage collector.** Para a maioria dos serviços, as pausas do GC são irrelevantes. Para cargas muito sensíveis a latência, podem não ser. Em 2020, o Discord publicou *Why Discord is switching from Go to Rust*, explicando que um serviço com um cache grande em memória tinha picos de latência periódicos causados pelo GC, e que trocar de versão ou ajustar o GC não resolveu. Vale o contexto: o serviço rodava Go 1.9.2, e o runtime evoluiu bastante desde então. Ainda assim, o caso mostra que a escolha depende da carga.
- **Verbosidade.** Tratamento de erro explícito e a ausência de algumas abstrações deixam o código mais longo.
- **Ecossistema de dados e machine learning.** Python continua muito à frente em bibliotecas para ciência de dados e ML.
- **Modelagem de domínio rica.** Sem herança e com um sistema de tipos mais simples, algumas modelagens ficam menos elegantes do que em linguagens como Kotlin ou TypeScript.

Na minha opinião, Go é uma escolha excelente para serviços de rede, APIs, workers, CLIs e infraestrutura. Para um produto CRUD com muitas telas, um time já fluente em TypeScript pode ser mais produtivo mantendo uma única linguagem no front e no back. A decisão deve considerar o time, não só a linguagem.

## Como começar

1. **[A Tour of Go](https://go.dev/tour/):** o tutorial interativo oficial.
2. **[Effective Go](https://go.dev/doc/effective_go):** o guia de estilo e de idiomas da linguagem.
3. **[Organizing a Go module](https://go.dev/doc/modules/layout):** a recomendação oficial de estrutura de projeto.
4. **Um projeto pequeno e real:** uma API com `net/http`, um worker que consome uma fila ou uma CLI que automatiza uma tarefa sua.

## Referências

Este artigo é um estudo baseado nas fontes abaixo. Trechos marcados como opinião refletem a minha leitura.

- Rob Pike. [Go at Google: Language Design in the Service of Software Engineering](https://go.dev/talks/2012/splash.article) (SPLASH, outubro de 2012).
- The Go Authors. [Effective Go](https://go.dev/doc/effective_go).
- The Go Authors. [Go 1 and the Future of Go Programs](https://go.dev/doc/go1compat).
- The Go Authors. [Release History](https://go.dev/doc/devel/release).
- The Go Authors. [Routing Enhancements for Go 1.22](https://go.dev/blog/routing-enhancements).
- Sammy Steele, Figma. [How Figma's databases team lived to tell the scale](https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/) (março de 2024).
- Jesse Howarth, Discord. [Why Discord is switching from Go to Rust](https://discord.com/blog/why-discord-is-switching-from-go-to-rust) (fevereiro de 2020).
