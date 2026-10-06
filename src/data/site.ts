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

export const heroImageConfig = {
	src: '/images/hero-750.webp',
	srcset:
		'/images/hero-400.webp 400w, /images/hero-640.webp 640w, /images/hero-750.webp 750w, /images/hero-1080.webp 1080w, /images/hero-1600.webp 1600w',
	sizes:
		'(min-width: 1280px) 700px, (min-width: 1024px) 55vw, (min-width: 768px) calc(100vw - 4rem), calc(100vw - 2rem)',
	width: 1600,
	height: 901,
	type: 'image/webp',
	ogImage: '/images/og-image.jpg',
} as const;
