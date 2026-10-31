---
title: "SEO in 2026: What Google Documentation Actually Recommends"
description: "SEO from primary sources: crawling, helpful content, titles, links, structured data, and the myths Google explicitly debunks in its documentation."
pubDate: 2026-10-29
author: "Gabriel Campos"
cover: "/images/blog/seo-o-que-o-google-recomenda.webp"
coverAlt: "Illustration of a search bar and three results, with the first highlighted in yellow, next to the title SEO without folklore"
category: "SEO and AI Search"
tags:
  - "SEO"
  - "Technical SEO"
  - "Google Search"
  - "Content"
draft: false
lang: "en"
translationKey: "seo-what-google-recommends"
---

SEO is probably the technical topic burdened with the most folklore on the internet. For every practical recommendation, multiple fabricated rules circulate: ideal keyword density, mandatory minimum word counts, rigid heading hierarchies. Much of this is directly debunked, in writing, by Google's own documentation.

In this article, I use Google Search Central as a primary source (consulted in October 2026) to separate evidence-backed best practices from superstition. The focus is for anyone maintaining a corporate website, a technical blog, or a web application who wants to invest time in what truly makes an impact.

## What SEO Is, Plain and Simple

SEO (Search Engine Optimization) is the process of helping search engines discover, understand, and display your pages, while helping searchers decide directly on the search engine results page (SERP) whether your page is worth clicking.

It is not an afterthought trick tacked on at the end of a project. It is the synthesis of technical hygiene (can the search engine fetch and render the page?) with content that effectively answers a real human need. When either element is missing, the other cannot compensate.

## 1. Without Crawling and Indexing, Nothing Else Matters

Before debating keywords, verify the fundamentals: can Google reach your page, and did it choose to index it?

- **Inspect the index.** A quick `site:yourdomain.com` search provides an overview of indexed URLs. For a specific URL, Google Search Console's URL Inspection tool displays exactly how Google views the page.
- **Do not block critical assets.** Blocking CSS or JavaScript files in `robots.txt` prevents Googlebot from rendering the page as a user sees it.
- **Publish a sitemap.** While an XML sitemap does not guarantee indexing, it aids discovery, particularly for newly created pages.
- **Resolve duplicate content.** When identical content resolves across multiple URLs (with and without trailing slashes, via tracking parameters, or over both HTTP and HTTPS), implement 301 redirects or `rel="canonical"` tags to declare the canonical version.

A detail that frequently confuses developers: `robots.txt` dictates **crawling**, not **indexing**. A disallowed URL can still appear in search results (without a snippet description) if external websites link to it. To ensure a page is excluded from the search index, use a `noindex` directive—and ensure the page remains crawlable so Google can read that meta tag.

```text
# robots.txt
User-agent: *
Disallow: /admin/

Sitemap: https://yourdomain.com/sitemap.xml
```

```html
<!-- On a page intended to stay out of the search index -->
<meta name="robots" content="noindex" />

<!-- On a duplicate version pointing to the canonical URL -->
<link rel="canonical" href="https://yourdomain.com/blog/my-article" />
```

## 2. Helpful Content Precedes Any Technical Tactic

In my opinion, the official guide on creating helpful, reliable, people-first content is the single most valuable document on Search Central. It poses foundational self-assessment questions, including:

- Does the content provide original information, reporting, research, or analysis?
- Is this the type of page you would bookmark, share with a colleague, or recommend?
- Was it written or reviewed by someone who demonstrably knows the subject well?
- Does it contain easily verifiable factual errors?

Google synthesizes this evaluation into three questions: **Who** created the content (transparent authorship with bylines where readers expect them). **How** it was produced (for example, whether real testing occurred or how automation was utilized). **Why** it exists. The last question is the most critical: content should exist primarily to help people, not to manipulate search rankings.

Regarding E-E-A-T (Experience, Expertise, Authoritativeness, and Trustworthiness), documentation is explicit: it is not a direct ranking factor. Google's ranking systems utilize a combination of signals to identify content demonstrating these traits, with trust being the core metric. Topics impacting health, finances, or personal safety (YMYL—Your Money or Your Life) are held to stricter standards.

Google's documented warning signs highlight practices to avoid:

- Utilizing extensive automation to churn out content across wide-ranging topics;
- Writing about trending topics that you would not otherwise cover for your primary audience;
- Changing publication dates to appear fresh without substantive updates to the underlying content.

## 3. Title, Snippet, and URL Structure

The page title is the user's initial touchpoint on the SERP. The standard is simple: a **unique `<title>` tag per page**, concise, clear, and accurately reflective of the page's content.

Meta descriptions do not always display. Search snippets are frequently generated directly from page copy, and the meta description is selected when it provides a better match for the specific search query. Regardless, writing unique, concise descriptions highlighting key takeaways remains best practice.

For URLs, clean descriptive slugs assist users and can appear as breadcrumbs in search listings. However, stuffing keywords into domains or URL paths, according to Google documentation, provides negligible ranking benefit beyond breadcrumb display.

```html
<title>Saga Pattern: Distributed Transactions Across Microservices</title>
<meta
  name="description"
  content="How the Saga pattern maintains data consistency across distributed microservices: choreography, orchestration, compensations, and outbox."
/>
```

## 4. Internal Links with Descriptive Anchor Text

Hyperlinks remain the primary vehicle through which search engines discover pages and understand conceptual relationships. Two practices handle the vast majority of scenarios:

- **Descriptive anchor text.** "Read our guide to Core Web Vitals" conveys far more semantic value than "click here", both to searchers and search spiders.
- **Qualify non-endorsed links.** Links within user comments, community forums (UGC), or sponsored placements should include `rel="ugc"`, `rel="sponsored"`, or `rel="nofollow"`.

A general rule of thumb: every high-value page should be discoverable via standard HTML links from other areas of the site, rather than relying exclusively on the XML sitemap.

## 5. Page Experience and Core Web Vitals

Core Web Vitals quantify real-world user experience using field data: LCP (loading speed, good under 2.5 s), INP (responsiveness to interactions, good under 200 ms), and CLS (visual stability, good under 0.1). Google confirms that these metrics inform its ranking systems.

Crucially, the documentation notes that relevance remains supreme: Google Search consistently seeks to present the most relevant information, even if page performance is sub-optimal. Excellent page experience acts as a tiebreaker when multiple pages provide comparable relevance and depth. In short: technical performance cannot salvage unhelpful content, but it can tip the balance and almost universally improves user conversion rates.

I wrote a detailed technical guide on profiling and tuning these metrics: [otimização de Core Web Vitals](/pt/blog/otimizacao-core-web-vitals-performance).

## 6. Structured Data: Only Describe What Is Visually Present

Structured data (typically formatted as JSON-LD using schema.org vocabularies) assists search engines in disambiguating entities and can unlock rich snippets. Two core rules supersede all others:

1. The markup must faithfully represent visible page content. Google's rule is literal: do not mark up content that human visitors cannot see.
2. Valid schema markup does not guarantee a rich snippet. The search engine algorithmically determines whether to render enhanced presentation.

Staying current with platform changes is equally important. In August 2023, Google restricted FAQ rich results exclusively to well-known authoritative health and government websites, and constrained HowTo snippets to desktop search. Adding generic `FAQPage` markup across every blog post in hopes of occupying extra SERP real estate is no longer an effective tactic for typical websites.

This blog, for instance, publishes `BlogPosting` and `BreadcrumbList` schema on every article using only data that actually exists on the page (headline, author, publication dates):

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "SEO in 2026: What Google Documentation Actually Recommends",
  "author": { "@type": "Person", "name": "Gabriel Campos" },
  "datePublished": "2026-10-29",
  "inLanguage": "en"
}
```

## 7. Common Myths Google Documentation Explicitly Refutes

| Common Myth | What Google Documents |
| :--- | :--- |
| The `keywords` meta tag boosts ranking | Google Search completely ignores the meta `keywords` tag. |
| There is an ideal word count | Content length alone is not a ranking factor. There is no magic word count. |
| Headings must follow a rigid H1-H6 hierarchy | Heading order and count do not dictate ranking in Google Search. They remain essential for accessibility and human readability. |
| Duplicate content triggers automated penalties | Duplication is crawl-inefficient, but does not incur manual penalties. Wholesale plagiarism is an entirely different matter. |
| Exact-match keyword domains give an advantage | It has negligible ranking influence beyond displaying in the breadcrumb snippet. |
| Top-level domains (.com, .dev, .io) matter | TLDs only matter for country-code targeting (ccTLDs). Beyond that, Google treats generic TLDs identically. |
| E-E-A-T is a direct ranking factor | When addressed directly in official documentation, Google explicitly states it is not a standalone ranking factor. |

## 8. Practices That Risk De-Indexing or Penalties

Google's Search Essentials detail spam policies that can demote or delist pages. Three patterns are prevalent today:

- **Keyword stuffing:** Artificially repeating search queries to manipulate ranking algorithms.
- **Scaled content abuse:** Generating high volumes of unoriginal pages with the primary intent of ranking rather than helping readers, regardless of how the content is produced.
- **Site reputation abuse:** Publishing third-party content on established domains primarily to exploit existing domain authority.

Regarding AI: guidance published by Google in February 2023 clarifies that the focus is on content quality, not the production mechanism. Documentation on helpful content reinforces this: generating vast quantities of text without human oversight indicates low effort, whereas disclosing automation is valuable when readers would naturally wonder how findings were gathered.

## Quick Technical Checklist

1. Is the page indexed? (Verify via `site:` query and URL Inspection tool)
2. Are CSS and JavaScript assets accessible in `robots.txt`?
3. Does each distinct page have a single canonical URL?
4. Is the `<title>` tag unique, concise, and descriptive?
5. Is the meta description unique and representative of the main takeaways?
6. Does the content answer real questions more effectively than competing resources?
7. Is authorship, methodology, and site purpose transparent?
8. Do internal links use informative, contextual anchor text?
9. Are Core Web Vitals comfortably within "Good" thresholds in real user field data?
10. Does structured data strictly reflect content visible to human visitors?

## Further Reading

Traditional SEO forms the foundation for visibility in AI-assisted search experiences. In companion articles, I explore how to structure pages for [AEO (Answer Engine Optimization)](/en/blog/aeo-answer-engine-optimization) and what peer-reviewed research reveals about [GEO (Generative Engine Optimization)](/en/blog/geo-generative-engine-optimization).

## References

This article is a technical study based on the primary documentation below. Statements marked as opinion reflect my own analysis.

- Google Search Central. [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).
- Google Search Central. [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
- Google Search Central. [Spam policies for Google web search](https://developers.google.com/search/docs/essentials/spam-policies).
- Google Search Central. [Introduction to robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro).
- Google Search Central. [Understanding page experience in Google Search results](https://developers.google.com/search/docs/appearance/page-experience).
- Google Search Central. [General structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).
- Google Search Central Blog. [Changes to HowTo and FAQ rich results](https://developers.google.com/search/blog/2023/08/howto-faq-changes) (August 2023).
- Google Search Central Blog. [Google Search's guidance about AI-generated content](https://developers.google.com/search/blog/2023/02/google-search-and-ai-content) (February 2023).
- web.dev. [Web Vitals](https://web.dev/articles/vitals).
