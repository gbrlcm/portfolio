import type { CollectionEntry } from 'astro:content';

export type SupportedBlogLanguage = 'pt-BR' | 'en' | 'es';

export const BLOG_LANGUAGES: Record<
	SupportedBlogLanguage,
	{ label: string; code: SupportedBlogLanguage; htmlLang: string; ogLocale: string }
> = {
	'pt-BR': { label: 'Português', code: 'pt-BR', htmlLang: 'pt-BR', ogLocale: 'pt_BR' },
	en: { label: 'English', code: 'en', htmlLang: 'en', ogLocale: 'en_US' },
	es: { label: 'Español', code: 'es', htmlLang: 'es', ogLocale: 'es_ES' },
};

export function normalizeBlogLang(lang?: string): SupportedBlogLanguage {
	if (!lang) return 'pt-BR';
	const lower = lang.toLowerCase();
	if (lower === 'pt' || lower === 'pt-br' || lower === 'pt_br') return 'pt-BR';
	if (lower === 'en' || lower === 'en-us' || lower === 'en_us') return 'en';
	if (lower === 'es' || lower === 'es-es' || lower === 'es_es') return 'es';
	return 'pt-BR';
}

export function getPostLang(post: CollectionEntry<'blog'>): SupportedBlogLanguage {
	if (post.data.lang) {
		return normalizeBlogLang(post.data.lang);
	}
	if (post.id.startsWith('en/')) return 'en';
	if (post.id.startsWith('es/')) return 'es';
	return 'pt-BR';
}

export function getPostSlug(postOrId: CollectionEntry<'blog'> | string): string {
	const rawId = typeof postOrId === 'string' ? postOrId : postOrId.id;
	return rawId.replace(/^(pt|en|es)\//, '');
}

export function getPostUrl(post: CollectionEntry<'blog'>): string {
	const lang = getPostLang(post);
	const slug = getPostSlug(post);
	const prefix = lang === 'pt-BR' ? 'pt' : lang;
	return `/${prefix}/blog/${slug}`;
}

export function getPostAbsoluteUrl(
	post: CollectionEntry<'blog'>,
	siteUrl = 'https://gabrielcampos.dev'
): string {
	const base = siteUrl.replace(/\/$/, '');
	const path = getPostUrl(post);
	return `${base}${path}/`;
}

export function getBlogIndexUrl(lang: SupportedBlogLanguage): string {
	const prefix = lang === 'pt-BR' ? 'pt' : lang;
	return `/${prefix}/blog`;
}

export function getBlogIndexAbsoluteUrl(
	lang: SupportedBlogLanguage,
	siteUrl = 'https://gabrielcampos.dev'
): string {
	const base = siteUrl.replace(/\/$/, '');
	const path = getBlogIndexUrl(lang);
	return `${base}${path}/`;
}

export function getBlogIndexHreflangs(
	siteUrl = 'https://gabrielcampos.dev'
): { lang: string; href: string }[] {
	return [
		{ lang: 'pt-BR', href: getBlogIndexAbsoluteUrl('pt-BR', siteUrl) },
		{ lang: 'en', href: getBlogIndexAbsoluteUrl('en', siteUrl) },
		{ lang: 'es', href: getBlogIndexAbsoluteUrl('es', siteUrl) },
	];
}

export function getBlogPostsByLang(
	allPosts: CollectionEntry<'blog'>[],
	lang: SupportedBlogLanguage
): CollectionEntry<'blog'>[] {
	return allPosts
		.filter((post) => !post.data.draft && getPostLang(post) === lang)
		.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export interface PostTranslationItem {
	lang: SupportedBlogLanguage;
	label: string;
	url: string;
	post: CollectionEntry<'blog'>;
}

export function getPostTranslations(
	post: CollectionEntry<'blog'>,
	allPosts: CollectionEntry<'blog'>[]
): PostTranslationItem[] {
	const translationKey = post.data.translationKey?.trim();
	if (!translationKey) return [];

	const currentLang = getPostLang(post);

	return allPosts
		.filter((p) => {
			if (p.data.draft) return false;
			if (p.id === post.id) return false;
			if (!p.data.translationKey || p.data.translationKey.trim() !== translationKey) return false;
			return getPostLang(p) !== currentLang;
		})
		.map((p) => {
			const targetLang = getPostLang(p);
			return {
				lang: targetLang,
				label: BLOG_LANGUAGES[targetLang]?.label ?? targetLang,
				url: getPostUrl(p),
				post: p,
			};
		})
		.sort((a, b) => a.lang.localeCompare(b.lang));
}

export function getPostHreflangs(
	post: CollectionEntry<'blog'>,
	allPosts: CollectionEntry<'blog'>[],
	siteUrl = 'https://gabrielcampos.dev'
): { lang: string; href: string }[] {
	const translationKey = post.data.translationKey?.trim();
	if (!translationKey) return [];

	const groupPosts = allPosts.filter(
		(p) => !p.data.draft && p.data.translationKey?.trim() === translationKey
	);

	// If it is the only post with this key, no translations exist, so no alternate hreflang
	if (groupPosts.length <= 1) return [];

	return groupPosts.map((p) => ({
		lang: getPostLang(p),
		href: getPostAbsoluteUrl(p, siteUrl),
	}));
}

export function validateBlogCollection(posts: CollectionEntry<'blog'>[]): void {
	const seenSlugsByLang = new Map<SupportedBlogLanguage, Set<string>>();
	const seenKeysByLang = new Map<SupportedBlogLanguage, Set<string>>();

	for (const lang of ['pt-BR', 'en', 'es'] as const) {
		seenSlugsByLang.set(lang, new Set<string>());
		seenKeysByLang.set(lang, new Set<string>());
	}

	for (const post of posts) {
		const lang = getPostLang(post);
		const slug = getPostSlug(post);
		const id = post.id;

		// 1. Folder vs declared language check
		if (id.startsWith('pt/') && lang !== 'pt-BR') {
			throw new Error(
				`[Blog Validation] Post "${id}" is located in "pt/" folder but has lang: "${post.data.lang}". Expected "pt-BR".`
			);
		}
		if (id.startsWith('en/') && lang !== 'en') {
			throw new Error(
				`[Blog Validation] Post "${id}" is located in "en/" folder but has lang: "${post.data.lang}". Expected "en".`
			);
		}
		if (id.startsWith('es/') && lang !== 'es') {
			throw new Error(
				`[Blog Validation] Post "${id}" is located in "es/" folder but has lang: "${post.data.lang}". Expected "es".`
			);
		}

		// 2. Duplicate slug within same language
		const slugsSet = seenSlugsByLang.get(lang)!;
		if (slugsSet.has(slug)) {
			throw new Error(
				`[Blog Validation] Duplicate slug "${slug}" detected for language "${lang}" in post "${id}".`
			);
		}
		slugsSet.add(slug);

		// 3. Duplicate translationKey within same language
		const translationKey = post.data.translationKey?.trim();
		if (translationKey) {
			const keysSet = seenKeysByLang.get(lang)!;
			if (keysSet.has(translationKey)) {
				throw new Error(
					`[Blog Validation] Duplicate translationKey "${translationKey}" detected for language "${lang}" in post "${id}". Each language can have at most one article per translationKey.`
				);
			}
			keysSet.add(translationKey);
		}
	}
}

/**
 * Strips markdown syntax, frontmatter and code blocks to produce a clean searchable string
 */
export function cleanSearchableContent(rawMarkdown?: string): string {
	if (!rawMarkdown) return '';
	return rawMarkdown
		.replace(/^---[\s\S]*?---/, '') // remove frontmatter
		.replace(/```[\s\S]*?```/g, '') // remove code blocks
		.replace(/`([^`]+)`/g, '$1') // inline code
		.replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // images
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // link labels
		.replace(/<[^>]+>/g, '') // html tags
		.replace(/[#*~_>=\-+]/g, ' ') // markdown symbols
		.replace(/\s+/g, ' ') // collapse whitespaces
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim();
}

