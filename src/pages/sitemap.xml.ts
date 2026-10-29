import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getPostAbsoluteUrl, validateBlogCollection } from '../lib/blog';

export const prerender = true;

interface SitemapEntry {
	loc: string;
	lastmod?: string;
	priority: string;
	changefreq: string;
}

export const GET: APIRoute = async ({ site }) => {
	const baseUrl = (site ? site.toString() : 'https://gabrielcampos.dev').replace(/\/$/, '');

	// Fetch only non-draft articles and validate collection
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	validateBlogCollection(posts);

	// Static core routes for all supported languages
	const coreUrls: SitemapEntry[] = [
		{ loc: `${baseUrl}/pt/`, priority: '1.0', changefreq: 'weekly' },
		{ loc: `${baseUrl}/en/`, priority: '0.8', changefreq: 'weekly' },
		{ loc: `${baseUrl}/es/`, priority: '0.8', changefreq: 'weekly' },
		{ loc: `${baseUrl}/pt/blog/`, priority: '0.9', changefreq: 'daily' },
		{ loc: `${baseUrl}/en/blog/`, priority: '0.8', changefreq: 'daily' },
		{ loc: `${baseUrl}/es/blog/`, priority: '0.8', changefreq: 'daily' },
		{ loc: `${baseUrl}/pt/ferramentas/gerador-de-assinatura-de-email/`, priority: '0.9', changefreq: 'monthly' },
		{ loc: `${baseUrl}/en/tools/email-signature-generator/`, priority: '0.9', changefreq: 'monthly' },
		{ loc: `${baseUrl}/es/herramientas/generador-de-firma-de-correo/`, priority: '0.9', changefreq: 'monthly' },
	];

	// Dynamic blog post routes mapped cleanly by language and slug
	const postUrls: SitemapEntry[] = posts.map((post) => ({
		loc: getPostAbsoluteUrl(post, baseUrl),
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
