---
title: "GEO: What Peer-Reviewed Research Reveals About AI Search Citations"
description: "Generative Engine Optimization based on the original KDD 2024 paper: experimental setup, what worked, study limitations, and what to apply today."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/geo-generative-engine-optimization.webp"
coverAlt: "Illustration of an AI-generated answer with numbered citation markers, one of them linked to a source highlighted in yellow"
category: "SEO and AI Search"
tags:
  - "GEO"
  - "AI Search"
  - "SEO"
  - "llms.txt"
draft: false
lang: "en"
translationKey: "geo-generative-engine-optimization"
---

Whenever a new acronym emerges in digital marketing, formula salesmen inevitably follow. Generative Engine Optimization (GEO) has been no exception. The crucial difference here is that an academic research paper sits at the origin of the term, and reading it provides the strongest antidote against hyperbole.

In this article, I analyze what the researchers actually tested and found, what the study does not prove, how Google and OpenAI officially document AI retrieval, and what I believe is genuinely worth implementing today.

## SEO, AEO, and GEO: What Is the Difference?

| Acronym | Primary Objective | Where Visibility Occurs |
| :--- | :--- | :--- |
| **SEO** | Get crawled, indexed, and ranked prominently in search engine results | Traditional SERP organic links |
| **AEO** | Have an extracted passage selected as a direct answer | Featured snippets, voice search, conversational Q&A |
| **GEO** | Be cited and represented accurately in generative AI syntheses | AI Overviews, ChatGPT Search, Perplexity, Copilot |

In practice, all three disciplines overlap substantially. Content that search bots cannot crawl and index cannot appear in any of them. If you have not yet addressed technical SEO foundations, begin with my [SEO guide](/en/blog/seo-what-google-recommends) and my [analysis of AEO](/en/blog/aeo-answer-engine-optimization).

## Where the Term GEO Originates

The term was coined in the research paper *GEO: Generative Engine Optimization* by Pranjal Aggarwal, Vishvak Murahari, Tanmay Rajpurohit, Ashwin Kalyan, Karthik Narasimhan, and Ameet Deshpande, originally posted to arXiv in 2023 and accepted at the ACM SIGKDD 2024 conference.

The authors posed a straightforward research question: if generative search engines synthesize multi-source answers, what content optimization strategies can creators adopt to increase their source visibility? To evaluate this empirically, they developed **GEO-bench**, a benchmark dataset spanning diverse query domains, and introduced two visibility metrics:

- **Position-Adjusted Word Count:** The volume of generative response text attributed to a source, weighted by where the citation appears.
- **Subjective Impression:** A qualitative assessment evaluating the perceived authority, relevance, and influence of a source's citation within the synthesized response.

## What Was Tested

The researchers evaluated nine distinct rewriting strategies applied to source content:

1. **Authoritative:** Enhancing tone to sound more authoritative and assertive.
2. **Statistics Addition:** Injecting relevant quantitative metrics and numerical data.
3. **Keyword Stuffing:** Repeating target keywords throughout the copy.
4. **Cite Sources:** Adding formal citations and reputable third-party references.
5. **Quotation Addition:** Incorporating direct quotations from recognized experts.
6. **Easy-to-Understand:** Simplifying vocabulary and sentence structure.
7. **Fluency Optimization:** Enhancing syntactic flow and readability.
8. **Unique Words:** Introducing specialized, less common vocabulary.
9. **Technical Terms:** Incorporating precise domain-specific technical terminology.

## What Worked and What Failed

Key findings from the empirical paper include:

- **Top strategies boosted visibility by approximately 41% (Position-Adjusted Word Count) and 28% (Subjective Impression)** relative to baseline content. The paper's abstract highlights relative gains of "up to 40%".
- **Quotation Addition, Statistics Addition, and Cite Sources** consistently ranked among the highest-performing interventions. In short: content backed by verifiable data, quotes, and primary sources is favored by retrieval-augmented generation (RAG) pipelines.
- **Keyword Stuffing failed completely.** On the primary benchmark, it underperformed baseline content; when tested against Perplexity, performance declined by approximately 10% compared to original sources.
- **Lower-ranked sources benefited substantially more.** For sources ranked 5th in conventional organic search, applying the Cite Sources strategy increased generative visibility by 115.1%. Conversely, for sources holding 1st position, the same strategy decreased visibility by 30.3%.
- **Impact varied significantly by domain.** The authors concluded that optimization strategies must be tailored to distinct content categories rather than applied as uniform formulas.

The finding regarding keyword stuffing is particularly illuminating: the oldest spam tactic in traditional SEO does not carry over to generative language models. What actually moves the needle in generative retrieval mirrors traditional good writing: providing verifiable evidence, citing primary sources, and communicating technical concepts with precision.

## What the Study Does Not Prove

Before overhauling an entire corporate website based on these findings, keep methodological boundaries in perspective:

- **The benchmark reflects 2023 models.** Commercial LLMs and generative retrieval architectures have undergone major architectural iterations since the experiment was conducted.
- **Citation visibility does not equal commercial return.** Earning citation tokens in a generated summary does not automatically convert into referral clicks, qualified leads, or closed contracts.
- **"Adding statistics" is not permission to invent data.** Fabricated numbers may occasionally fool a parser, but they utterly destroy professional credibility when human decision-makers verify them. Only publish figures with traceable methodology.

## What Google and OpenAI Officially Document

### Google: Web Standards and Technical Fundamentals

Official Google Search Central documentation regarding AI search capabilities (AI Overviews and AI Mode) is unambiguous: there are no special formatting tricks or secondary optimization requirements to qualify for AI syntheses. Google explicitly states that **publishers do not need to construct novel machine-readable files, special AI text files, or proprietary markup**, and that no specialized schema exists for this purpose.

Recommended guidance remains standard high-quality technical SEO: ensure unrestricted bot crawling, facilitate discovery through structured internal links, optimize page performance, publish core content in indexable HTML, and maintain schema markup that strictly mirrors visible page content.

To manage content utilization, Google points to existing standard web controls (`nosnippet`, `data-nosnippet`, `max-snippet`, `noindex`), alongside the `Google-Extended` user-agent token for controlling training and grounding across broader Google AI systems.

### OpenAI: Disentangling Search Retrieval from Model Training

OpenAI documents distinct crawlers, and understanding the architectural distinction is critical:

- **`OAI-SearchBot`** powers real-time search: displaying linked source citations within ChatGPT Search responses. Disallowing this crawler prevents a domain from being cited in active search results.
- **`GPTBot`** scrapes web content for foundational model pre-training. Disallowing it signals that content must not be used to train future model weights.
- **`ChatGPT-User`** handles direct end-user browsing requests, such as a user providing a specific URL in a prompt. Because this is user-initiated, standard `robots.txt` directives may not restrict it.

A standard `robots.txt` configuration that permits real-time ChatGPT Search retrieval while blocking offline model training looks like this:

```text
User-agent: OAI-SearchBot
Allow: /

User-agent: GPTBot
Disallow: /
```

Whether this posture suits your organization depends on your specific business model. The key takeaway is that crawling for retrieval and scraping for training are separate operational controls.

## What About llms.txt?

The `llms.txt` concept was proposed by Jeremy Howard in September 2024: a root-level Markdown file containing an H1 title (the only mandatory element), an introductory blockquote summary, and structured links pointing to high-value documentation pages. Its goal is to provide concise, structured context for LLM agents.

This website publishes an [/llms.txt](/llms.txt) file. I treat it strictly as an experimental, low-cost convenience layer for AI agents, not as a guaranteed ranking lever. Google's official documentation explicitly clarifies that AI text files are unnecessary for appearing in search AI features. If you decide to deploy one, ensure it remains strictly factual and aligned with your live site copy, without expecting measurable organic ranking lifts from it.

## What I Recommend Implementing Today

Synthesizing academic findings with search engine technical specifications, a pragmatic action plan emerges:

1. **Solidify SEO fundamentals.** Clean indexing, unhindered crawler access, and crawlable semantic HTML.
2. **Cite primary sources.** Link out to official documentation, peer-reviewed papers, and verified public datasets.
3. **Anchor statements with empirical numbers.** Clearly state data origins and testing parameters.
4. **Incorporate authoritative quotations.** Include direct quotes from recognized domain specialists or official documentation, accompanied by clear attribution.
5. **Structure for clarity.** Place direct answers at the top of sections, define terms explicitly, and write sentences that retain meaning in isolation.
6. **Maintain transparent authorship.** State who wrote the content, their technical background, and direct contact details.
7. **Ensure entity consistency.** Keep personal and organizational names, biographies, and social profiles uniform across all web touchpoints.
8. **Make deliberate crawler decisions.** Treat search indexing and AI model training as distinct technical choices in `robots.txt`.

Notice that virtually none of these steps are novel tricks. That is the core takeaway: GEO, according to empirical evidence, simply rewards the kind of deep, well-documented technical writing that engineers should have been producing for human readers all along.

## References

This article is a technical study based on the published research and primary documentation below. Statements marked as opinion reflect my own analysis.

- Pranjal Aggarwal et al. [GEO: Generative Engine Optimization](https://arxiv.org/abs/2311.09735). arXiv:2311.09735, accepted at ACM KDD 2024.
- Google Search Central. [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features).
- OpenAI. [Overview of OpenAI Crawlers](https://developers.openai.com/api/docs/bots).
- Jeremy Howard. [The /llms.txt file](https://llmstxt.org/) (proposal published September 2024).
