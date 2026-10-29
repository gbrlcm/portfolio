import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
	getBlogPostsByLang,
	getPostSlug,
	cleanSearchableContent,
	type SupportedBlogLanguage,
} from '../../lib/blog';

export const GET: APIRoute = async () => {
	const allPosts = await getCollection('blog', ({ data }) => !data.draft);

	const languages: SupportedBlogLanguage[] = ['pt-BR', 'en', 'es'];
	const index: Record<
		SupportedBlogLanguage,
		Array<{
			slug: string;
			title: string;
			category: string;
			description: string;
			content: string;
		}>
	> = {
		'pt-BR': [],
		en: [],
		es: [],
	};

	for (const lang of languages) {
		const posts = getBlogPostsByLang(allPosts, lang);
		index[lang] = posts.map((post) => ({
			slug: getPostSlug(post),
			title: post.data.title,
			category: post.data.category || '',
			description: post.data.description || '',
			content: cleanSearchableContent(post.body),
		}));
	}

	return new Response(JSON.stringify(index), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
		},
	});
};
