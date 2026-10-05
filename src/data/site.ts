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
