import { getImage } from 'astro:assets';
import heroImage from '../assets/images/hero.webp';

export const site = {
	name: 'Gabriel Campos',
	domain: 'gabrielcampos.dev',
	url: import.meta.env.SITE,
	locale: 'pt-BR',
	role: 'Desenvolvedor de software',
	tagline: 'Sites e sistemas que carregam rápido e vendem.',
	description:
		'Desenvolvimento web sob medida para empresas e produtos digitais. Peça um orçamento sem compromisso.',
	available: true,
	availabilityLabel: 'Aceitando projetos',
	responseTime: 'Resposta em até 24h',
	location: 'Brasil · remoto no mundo todo',
	social: {
		github: 'https://github.com/gbrlcm',
		linkedin: 'https://www.linkedin.com/in/gabriel-lopes-campos',
		x: 'https://x.com/Gabriel07132569',
	},
} as const;

export type Site = typeof site;

/**
 * Hero image options shared by the <Image /> in Hero.astro and the
 * <link rel="preload"> generated in the pages. Both must use the same
 * options so Astro emits identical URLs (avoids a double download).
 */
export const heroImageConfig = {
	src: heroImage,
	widths: [400, 640, 750, 1080, 1600],
	sizes:
		'(min-width: 1280px) 700px, (min-width: 1024px) 55vw, (min-width: 768px) calc(100vw - 4rem), calc(100vw - 2rem)',
	format: 'webp',
	type: 'image/webp',
	ogImage: '/images/og-image.jpg',
} as const;

/** Builds the preload config for the hero image (same URLs as <Image />). */
export async function getHeroPreload() {
	const { src, widths, sizes, format, type } = heroImageConfig;
	const img = await getImage({ src, widths: [...widths], sizes, format });
	return { href: img.src, imagesrcset: img.srcSet.attribute, imagesizes: sizes, type };
}
