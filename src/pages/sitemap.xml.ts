import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

interface SitemapEntry {
	loc: string;
	lastmod?: string;
	priority: string;
	changefreq: string;
}

export const GET: APIRoute = async ({ site }) => {
	const baseUrl = (site ? site.toString() : 'https://gabrielcampos.dev').replace(/\/$/, '');

	// Fetch only non-draft articles
	const posts = await getCollection('blog', ({ data }) => !data.draft);

	// Static core routes
	const coreUrls: SitemapEntry[] = [
		{ loc: `${baseUrl}/`, priority: '1.0', changefreq: 'weekly' },
		{ loc: `${baseUrl}/en/`, priority: '0.8', changefreq: 'weekly' },
		{ loc: `${baseUrl}/es/`, priority: '0.8', changefreq: 'weekly' },
		{ loc: `${baseUrl}/blog/`, priority: '0.9', changefreq: 'daily' },
		{ loc: `${baseUrl}/ferramentas/gerador-de-assinatura-de-email/`, priority: '0.9', changefreq: 'monthly' },
	];

	// Dynamic blog post routes
	const postUrls: SitemapEntry[] = posts.map((post) => ({
		loc: `${baseUrl}/blog/${post.id}/`,
		lastmod: (post.data.updatedDate || post.data.pubDate).toISOString().split('T')[0],
		priority: '0.8',
		changefreq: 'monthly',
	}));

	const allUrls: SitemapEntry[] = [...coreUrls, ...postUrls];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
	.map(
		(url) => `  <url>
    <loc>${url.loc}</loc>${url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(xml, {
		status: 200,
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
		},
	});
};
