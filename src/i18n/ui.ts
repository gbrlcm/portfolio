export const languages = {
	'pt-BR': 'Português',
	en: 'English',
	es: 'Español',
} as const;

export type SupportedLanguage = keyof typeof languages;
export const defaultLang: SupportedLanguage = 'pt-BR';

export const ui = {
	'pt-BR': {
		meta: {
			title: 'Gabriel Campos — Desenvolvedor de Software',
			description:
				'Portfólio profissional de Gabriel Campos. Desenvolvimento web, sistemas sob medida e engenharia de software.',
		},
		nav: {
			home: 'Início',
			services: 'Serviços',
			features: 'Princípios',
			community: 'Contato',
			faqs: 'Dúvidas',
			getInTouch: 'ENTRE EM CONTATO',
		},
		hero: {
			title: 'GABRIEL CAMPOS',
			badge: 'Engenharia de Software',
			subtitle: 'Desenvolvimento web, sistemas e engenharia de software.',
		},
		services: {
			title: 'SERVIÇOS E ATUAÇÃO',
			readMore: 'Saiba mais',
			items: [
				{
					label: 'Sistemas Web',
					title: 'Aplicações Sob Medida',
					desc: 'Painéis, ferramentas internas e plataformas web desenvolvidas sob medida.',
					image: '/images/service-1.webp',
				},
				{
					label: 'Engenharia',
					title: 'APIs e Integrações',
					desc: 'Desenvolvimento e integração de APIs, serviços e fluxos automatizados de dados.',
					image: '/images/service-2.webp',
				},
				{
					label: 'Frontend',
					title: 'Sites de Alta Performance',
					desc: 'Landing pages e interfaces web rápidas, acessíveis e otimizadas.',
					image: '/images/service-3.webp',
				},
				{
					label: 'Infraestrutura',
					title: 'Deploy e Manutenção',
					desc: 'Configuração de ambientes estáticos e servidores com arquitetura moderna.',
					image: '/images/service-4.webp',
				},
			],
		},
		features: {
			title: 'PRINCÍPIOS DE TRABALHO',
			items: [
				{
					badge: '01',
					title: 'Código Limpo e Moderno',
					desc: 'Aplicações estruturadas com foco em legibilidade, manutenibilidade e padrões atuais.',
				},
				{
					badge: '02',
					title: 'Performance e Estabilidade',
					desc: 'Sistemas rápidos e eficientes, com foco em estabilidade e boa experiência de uso.',
				},
				{
					badge: '03',
					title: 'Comunicação Transparente',
					desc: 'Alinhamento constante durante o desenvolvimento, com clareza em todas as etapas.',
				},
			],
		},
		community: {
			title: 'ENTRE EM CONTATO',
			heading: 'Tem um projeto ou demanda técnica em mente?',
			desc: 'Converse diretamente pelo WhatsApp ou envie uma mensagem por e-mail para avaliar o escopo.',
			button: 'INICIAR CONVERSA',
			connect: 'Conecte-se nas redes:',
		},
		testimonials: {
			title: 'DEPOIMENTOS',
			items: [] as { quote: string; name: string; role: string; avatar: string }[],
		},
		faqs: {
			title: 'PERGUNTAS FREQUENTES',
			items: [
				{
					question: 'Quais tipos de projetos você desenvolve?',
					answer:
						'Desenvolvimento de sistemas web, aplicações sob medida, APIs, integrações de serviços e interfaces de alto desempenho.',
				},
				{
					question: 'Como posso entrar em contato?',
					answer:
						'Você pode iniciar uma conversa pelo WhatsApp ou enviar uma mensagem para os e-mails informados no rodapé.',
				},
				{
					question: 'Onde você atua?',
					answer:
						'Atendimento remoto para projetos em todo o Brasil e no exterior.',
				},
			],
		},
		footer: {
			joinTitle: 'GABRIEL CAMPOS',
			emailPlaceholder: 'Seu endereço de e-mail',
			socialTitle: 'Redes & Conexões',
			aboutTitle: 'Navegação',
			supportTitle: 'Canais Diretos',
			helpTitle: 'Contato Profissional',
			links: {
				home: 'Início',
				services: 'Serviços',
				features: 'Princípios',
				community: 'Contato',
				faqs: 'Dúvidas',
				contactUs: 'Fale Conosco',
				whatsapp: 'WhatsApp',
				telegram: 'Telegram',
				customerSupport: 'E-mail Principal',
			},
		},
		quickContact: {
			label: 'Contato Direto',
			whatsapp: 'WhatsApp',
			telegram: 'Telegram',
			email: 'E-mail',
		},
	},
	en: {
		meta: {
			title: 'Gabriel Campos — Software Developer',
			description:
				'Professional portfolio of Gabriel Campos. Web development, custom systems, and software engineering.',
		},
		nav: {
			home: 'Home',
			services: 'Services',
			features: 'Principles',
			community: 'Contact',
			faqs: 'FAQs',
			getInTouch: 'GET IN TOUCH',
		},
		hero: {
			title: 'GABRIEL CAMPOS',
			badge: 'Software Engineering',
			subtitle: 'Web development, systems, and software engineering.',
		},
		services: {
			title: 'SERVICES & EXPERTISE',
			readMore: 'Learn more',
			items: [
				{
					label: 'Web Systems',
					title: 'Custom Applications',
					desc: 'Dashboards, internal tools, and tailored web platforms.',
					image: '/images/service-1.webp',
				},
				{
					label: 'Engineering',
					title: 'APIs & Integrations',
					desc: 'Development and connection of APIs, services, and automated data workflows.',
					image: '/images/service-2.webp',
				},
				{
					label: 'Frontend',
					title: 'High-Performance Sites',
					desc: 'Fast, accessible, and search-optimized landing pages and web interfaces.',
					image: '/images/service-3.webp',
				},
				{
					label: 'Infrastructure',
					title: 'Deploy & Maintenance',
					desc: 'Modern static and containerized deployments with reliable architecture.',
					image: '/images/service-4.webp',
				},
			],
		},
		features: {
			title: 'WORKING PRINCIPLES',
			items: [
				{
					badge: '01',
					title: 'Clean and Modern Code',
					desc: 'Applications designed for readability, maintainability, and modern industry standards.',
				},
				{
					badge: '02',
					title: 'Performance and Reliability',
					desc: 'Fast and resilient systems with optimized load times and resource usage.',
				},
				{
					badge: '03',
					title: 'Transparent Communication',
					desc: 'Direct technical collaboration throughout development without unnecessary layers.',
				},
			],
		},
		community: {
			title: 'GET IN TOUCH',
			heading: 'Have a project or technical challenge in mind?',
			desc: 'Reach out directly via WhatsApp or send an email to discuss project scope.',
			button: 'START CONVERSATION',
			connect: 'Connect on social:',
		},
		testimonials: {
			title: 'TESTIMONIALS',
			items: [] as { quote: string; name: string; role: string; avatar: string }[],
		},
		faqs: {
			title: 'FREQUENTLY ASKED QUESTIONS',
			items: [
				{
					question: 'What types of projects do you develop?',
					answer:
						'Web systems, custom applications, APIs, service integrations, and high-performance interfaces.',
				},
				{
					question: 'How can I get in touch?',
					answer:
						'You can start a conversation via WhatsApp or send an email through the addresses listed in the footer.',
				},
				{
					question: 'Where are you based?',
					answer:
						'Based in Brazil, working remotely with clients worldwide.',
				},
			],
		},
		footer: {
			joinTitle: 'GABRIEL CAMPOS',
			emailPlaceholder: 'Email address',
			socialTitle: 'Social & Connect',
			aboutTitle: 'Navigation',
			supportTitle: 'Direct Channels',
			helpTitle: 'Professional Contact',
			links: {
				home: 'Home',
				services: 'Services',
				features: 'Principles',
				community: 'Contact',
				faqs: 'FAQs',
				contactUs: 'Contact us',
				whatsapp: 'WhatsApp',
				telegram: 'Telegram',
				customerSupport: 'Primary Email',
			},
		},
		quickContact: {
			label: 'Direct Contact',
			whatsapp: 'WhatsApp',
			telegram: 'Telegram',
			email: 'Email',
		},
	},
	es: {
		meta: {
			title: 'Gabriel Campos — Desarrollador de Software',
			description:
				'Portafolio profesional de Gabriel Campos. Desarrollo web, sistemas a medida e ingeniería de software.',
		},
		nav: {
			home: 'Inicio',
			services: 'Servicios',
			features: 'Principios',
			community: 'Contacto',
			faqs: 'Preguntas',
			getInTouch: 'CONTACTAR',
		},
		hero: {
			title: 'GABRIEL CAMPOS',
			badge: 'Ingeniería de Software',
			subtitle: 'Desarrollo web, sistemas e ingeniería de software.',
		},
		services: {
			title: 'SERVICIOS Y CAPACIDADES',
			readMore: 'Saber más',
			items: [
				{
					label: 'Sistemas Web',
					title: 'Aplicaciones a Medida',
					desc: 'Paneles, herramientas internas y plataformas web desarrolladas a medida.',
					image: '/images/service-1.webp',
				},
				{
					label: 'Ingeniería',
					title: 'APIs e Integraciones',
					desc: 'Desarrollo e integración de APIs, servicios y flujos automatizados de datos.',
					image: '/images/service-2.webp',
				},
				{
					label: 'Frontend',
					title: 'Sitios de Alto Rendimiento',
					desc: 'Landing pages e interfaces web rápidas, accesibles y optimizadas.',
					image: '/images/service-3.webp',
				},
				{
					label: 'Infraestructura',
					title: 'Despliegue y Mantenimiento',
					desc: 'Configuración de entornos estáticos y servidores con arquitectura moderna.',
					image: '/images/service-4.webp',
				},
			],
		},
		features: {
			title: 'PRINCIPIOS DE TRABAJO',
			items: [
				{
					badge: '01',
					title: 'Código Limpio y Moderno',
					desc: 'Aplicaciones estructuradas con foco en legibilidad, mantenimiento y estándares modernos.',
				},
				{
					badge: '02',
					title: 'Rendimiento y Estabilidad',
					desc: 'Sistemas rápidos y eficientes, con foco en estabilidad y buena experiencia de uso.',
				},
				{
					badge: '03',
					title: 'Comunicación Transparente',
					desc: 'Alineación constante durante el desarrollo, con claridad en todas las fases.',
				},
			],
		},
		community: {
			title: 'CONTACTO',
			heading: '¿Tienes un proyecto o desafío técnico en mente?',
			desc: 'Hablemos directamente por WhatsApp o envía un correo electrónico para evaluar el alcance.',
			button: 'INICIAR CONVERSACIÓN',
			connect: 'Conéctate en redes:',
		},
		testimonials: {
			title: 'TESTIMONIOS',
			items: [] as { quote: string; name: string; role: string; avatar: string }[],
		},
		faqs: {
			title: 'PREGUNTAS FRECUENTES',
			items: [
				{
					question: '¿Qué tipo de proyectos desarrollas?',
					answer:
						'Sistemas web, aplicaciones a medida, APIs, integraciones de servicios e interfaces de alto rendimiento.',
				},
				{
					question: '¿Cómo puedo contactarte?',
					answer:
						'Puedes iniciar una conversación por WhatsApp o enviar un correo a las direcciones del pie de página.',
				},
				{
					question: '¿Dónde operas?',
					answer:
						'Atención remota para proyectos en todo Brasil y en el extranjero.',
				},
			],
		},
		footer: {
			joinTitle: 'GABRIEL CAMPOS',
			emailPlaceholder: 'Correo electrónico',
			socialTitle: 'Redes y Conexiones',
			aboutTitle: 'Navegación',
			supportTitle: 'Canales Directos',
			helpTitle: 'Contacto Profesional',
			links: {
				home: 'Inicio',
				services: 'Servicios',
				features: 'Principios',
				community: 'Contacto',
				faqs: 'Preguntas',
				contactUs: 'Contáctanos',
				whatsapp: 'WhatsApp',
				telegram: 'Telegram',
				customerSupport: 'Correo Principal',
			},
		},
		quickContact: {
			label: 'Contacto Directo',
			whatsapp: 'WhatsApp',
			telegram: 'Telegram',
			email: 'Correo',
		},
	},
} as const;
