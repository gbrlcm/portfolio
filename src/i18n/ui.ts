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
			title: 'TaskAI — Portfólio Profissional & Soluções em IA',
			description:
				'Clone pixel-perfect do TaskAI no Astro e Tailwind CSS v4. Automação inteligente, engenharia de software e análise de dados de alto desempenho.',
		},
		nav: {
			home: 'Início',
			services: 'Serviços',
			features: 'Recursos',
			community: 'Comunidade',
			faqs: 'Dúvidas',
			getInTouch: 'ENTRE EM CONTATO',
		},
		hero: {
			title: 'SEU ASSISTENTE IA',
			badge: 'Serviços Ideais',
			subtitle: 'Potencialize suas tarefas com automação inteligente',
			usersCount: '1,9M+',
			usersLabel: 'Usuários atendidos',
			solutionsCount: '11+',
			solutionsLabel: 'Soluções em IA',
			ratingCount: '4,9',
			ratingLabel: 'Avaliação dos usuários',
		},
		services: {
			title: 'OTIMIZE SEU FLUXO DE TRABALHO',
			readMore: 'Saiba mais',
			items: [
				{
					label: 'Tarefas Básicas',
					title: 'Automação de Tarefas',
					desc: 'Automatize tarefas repetitivas e libere tempo para inovação.',
					image: '/images/service-1.webp',
				},
				{
					label: 'Assistência Profissional',
					title: 'Agendamento Inteligente',
					desc: 'Gerencie compromissos, reuniões e rotinas sem atritos.',
					image: '/images/service-2.webp',
				},
				{
					label: 'Soluções Corporativas',
					title: 'Análise de Dados',
					desc: 'Obtenha insights estratégicos e tome decisões assertivas.',
					image: '/images/service-3.webp',
				},
				{
					label: 'Integração Empresarial',
					title: 'Ferramentas Poderosas',
					desc: 'Integre soluções de IA avançadas aos seus sistemas legados.',
					image: '/images/service-4.webp',
				},
			],
		},
		features: {
			title: 'O QUE OFERECEMOS',
			items: [
				{
					badge: '01',
					title: 'Insights Impulsionados por IA',
					desc: 'Aprofunde-se nas nuances de dados, estratégias e padrões com precisão analítica.',
				},
				{
					badge: '02',
					title: 'Análises em Tempo Real',
					desc: 'Acompanhe tendências, métricas de performance e tomadas de decisão imediatas.',
				},
				{
					badge: '03',
					title: 'Relatórios Automatizados',
					desc: 'Mantenha stakeholders informados com relatórios dinâmicos e concisos.',
				},
			],
		},
		community: {
			title: 'JUNTE-SE À NOSSA COMUNIDADE DE IA',
			heading: 'Descubra o verdadeiro poder da IA com nossa comunidade em expansão.',
			desc: "Se você busca otimizar suas operações diárias, enriquecer o relacionamento com clientes ou escalar suas soluções tecnológicas, este é seu parceiro definitivo. Assine novidades, conecte-se nas redes e impulsione seu negócio hoje mesmo.",
			button: 'COMEÇAR AGORA',
			connect: 'Conecte-se nas redes:',
		},
		testimonials: {
			title: 'O QUE DIZEM NOSSOS CLIENTES',
			items: [
				{
					quote:
						'O Assistente de IA transformou completamente minha rotina de trabalho! Ele gerencia agendamentos, redige e-mails e acelera o brainstorm de ideias de produtos. Impossível voltar a fazer tudo manualmente!',
					name: 'John D.',
					role: 'Cliente',
					avatar: '/images/author-1.webp',
				},
				{
					quote:
						'Esta ferramenta mudou o patamar do meu negócio. Como empreendedor, precisava de automação confiável para focar na estratégia. Economizo dezenas de horas todas as semanas.',
					name: 'James T.',
					role: 'Cliente',
					avatar: '/images/author-2.webp',
				},
				{
					quote:
						'Eu estava hesitante no início, mas a plataforma foi incrível. Extremamente intuitiva, rápida e perfeitamente adaptada ao meu fluxo. É como ter uma equipe sênior dedicada em cada projeto.',
					name: 'Floyid M.',
					role: 'Cliente',
					avatar: '/images/author-3.webp',
				},
			],
		},
		faqs: {
			title: 'TEM ALGUMA DÚVIDA ?',
			items: [
				{
					question: 'O que é o Assistente de IA?',
					answer:
						'É uma solução tecnológica abrangente projetada para automatizar fluxos complexos, analisar grandes volumes de dados e otimizar processos profissionais com alto padrão de confiabilidade.',
				},
				{
					question: 'Como funciona o Assistente de IA?',
					answer:
						'Ele utiliza arquiteturas de linguagem natural e modelos preditivos modernos integrados diretamente via APIs, adaptando-se às regras de negócio e fluxos de cada cliente.',
				},
				{
					question: 'Com quais tarefas ele pode ajudar?',
					answer:
						'Automação de rotinas repetitivas, agendamentos inteligentes, análise exploratória de dados, redação técnica, integrações com bancos de dados e suporte ao cliente em tempo real.',
				},
				{
					question: 'O Assistente de IA é fácil de usar?',
					answer:
						'Sim! A interface foi desenhada visando fricção zero: intuitiva, responsiva em qualquer dispositivo e sem necessidade de treinamento complexo.',
				},
				{
					question: 'Quão seguros estão meus dados?',
					answer:
						'Totalmente seguros. Seguimos protocolos rígidos de segurança da informação, criptografia ponta a ponta (AES-256) e conformidade rigorosa com a LGPD e o GDPR.',
				},
			],
		},
		footer: {
			joinTitle: 'JUNTE-SE À COMUNIDADE',
			emailPlaceholder: 'Seu endereço de e-mail',
			socialTitle: 'Redes & Conexões',
			aboutTitle: 'Sobre',
			supportTitle: 'Suporte & Contato',
			helpTitle: 'Ajuda',
			links: {
				home: 'Início',
				services: 'Serviços',
				features: 'Recursos',
				community: 'Comunidade',
				faqs: 'Dúvidas',
				contactUs: 'Fale conosco',
				whatsapp: 'WhatsApp',
				telegram: 'Telegram',
				customerSupport: 'Suporte ao Cliente',
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
			title: 'TaskAI — Professional Portfolio & AI Solutions',
			description:
				'Pixel-perfect clone of TaskAI in Astro and Tailwind CSS v4. Smart automation, software engineering, and high-performance data analytics.',
		},
		nav: {
			home: 'Home',
			services: 'Services',
			features: 'Features',
			community: 'Community',
			faqs: 'FAQs',
			getInTouch: 'GET IN TOUCH',
		},
		hero: {
			title: 'YOUR AI ASSISTANT',
			badge: 'Optimal Services',
			subtitle: 'Empower your tasks with smart automation',
			usersCount: '1,9M+',
			usersLabel: 'Users served',
			solutionsCount: '11+',
			solutionsLabel: 'AI Solutions',
			ratingCount: '4,9',
			ratingLabel: 'User rating',
		},
		services: {
			title: 'OPTIMIZE YOUR WORKFLOW',
			readMore: 'Read more',
			items: [
				{
					label: 'Basic Tasks',
					title: 'Task Automation',
					desc: 'Automate repetitive tasks.',
					image: '/images/service-1.webp',
				},
				{
					label: 'Professional Assistance',
					title: 'Smart Scheduling',
					desc: 'Manage your appointments.',
					image: '/images/service-2.webp',
				},
				{
					label: 'Business Solutions',
					title: 'Data Analysis',
					desc: 'Gain insights and make decisions',
					image: '/images/service-3.webp',
				},
				{
					label: 'Enterprise Integration',
					title: 'Powerful Tools',
					desc: 'Integrate AI solutions into your systems',
					image: '/images/service-4.webp',
				},
			],
		},
		features: {
			title: 'WHAT WE OFFER',
			items: [
				{
					badge: '01',
					title: 'AI-Driven Insights',
					desc: 'Dive deep into the nuances of tennis strokes and strategies.',
				},
				{
					badge: '02',
					title: 'Real-Time Analytics',
					desc: 'Get to know the stars of today and tomorrow.',
				},
				{
					badge: '03',
					title: 'Automated Reports',
					desc: 'Stay updated with the latest news, match analyses.',
				},
			],
		},
		community: {
			title: 'JOIN OUR AI COMMUNITY',
			heading: 'Discover the power of AI with our growing community.',
			desc: "Whether you're optimizing your operations, enhancing customer engagement, or scaling your business, AISAAS is your ultimate AI partner. Subscribe to our updates, follow us on social media, and sign up on our platform to start your AI journey today.",
			button: 'GET STARTED',
			connect: 'Connect on social:',
		},
		testimonials: {
			title: 'WHAT CUSTOMERS SAY’S',
			items: [
				{
					quote:
						"The AI Assistant has completely transformed the way I work! It handles my scheduling, drafts emails, and even helps me brainstorm content ideas. I can't imagine going back to doing everything manually!",
					name: 'John D.',
					role: 'Customer',
					avatar: '/images/author-1.webp',
				},
				{
					quote:
						'This tool is a game-changer. As a small business owner, I needed something that could take care of routine tasks so I could focus on strategy. The AI Assistant has saved me hours every week.',
					name: 'James T.',
					role: 'Customer',
					avatar: '/images/author-2.webp',
				},
				{
					quote:
						"I was hesitant at first, but the AI Assistant has been amazing. It's intuitive, easy to use, and adapts to my workflow. It’s like having an extra pair of hands on every project.",
					name: 'Floyid M.',
					role: 'Customer',
					avatar: '/images/author-3.webp',
				},
			],
		},
		faqs: {
			title: 'HAVE A QUESTION ?',
			items: [
				{
					question: 'What is the AI Assistant?',
					answer:
						'The AI Assistant is an intelligent platform designed to automate everyday workflows, manage scheduling, analyze data, and accelerate productivity seamlessly.',
				},
				{
					question: 'How does the AI Assistant work?',
					answer:
						'It leverages advanced natural language processing and machine learning models to integrate with your existing tools, learn your habits, and execute tasks on demand.',
				},
				{
					question: 'What tasks can the AI Assistant help with?',
					answer:
						'From smart calendar management and automated email drafting to real-time analytics, report generation, and system integrations.',
				},
				{
					question: 'Is the AI Assistant easy to use?',
					answer:
						'Absolutely. It features an intuitive conversational interface with zero learning curve, ready to use out of the box on both desktop and mobile devices.',
				},
				{
					question: 'How secure is my data with the AI Assistant?',
					answer:
						'We adhere to enterprise-grade security standards with end-to-end encryption, strict access controls, and complete GDPR/LGPD compliance to protect your privacy.',
				},
			],
		},
		footer: {
			joinTitle: 'JOIN OUR COMMUNITY',
			emailPlaceholder: 'Email address',
			socialTitle: 'Social & Connect',
			aboutTitle: 'About',
			supportTitle: 'Support & Contact',
			helpTitle: 'Help',
			links: {
				home: 'Home',
				services: 'Services',
				features: 'Features',
				community: 'Community',
				faqs: 'FAQS',
				contactUs: 'Contact us',
				whatsapp: 'WhatsApp',
				telegram: 'Telegram',
				customerSupport: 'Customer Support',
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
			title: 'TaskAI — Portafolio Profesional y Soluciones de IA',
			description:
				'Clon pixel-perfect de TaskAI en Astro y Tailwind CSS v4. Automatización inteligente, ingeniería de software y analítica de datos de alto rendimiento.',
		},
		nav: {
			home: 'Inicio',
			services: 'Servicios',
			features: 'Funciones',
			community: 'Comunidad',
			faqs: 'Preguntas',
			getInTouch: 'CONTACTAR',
		},
		hero: {
			title: 'TU ASISTENTE DE IA',
			badge: 'Servicios Óptimos',
			subtitle: 'Potencia tus tareas con automatización inteligente',
			usersCount: '1,9M+',
			usersLabel: 'Usuarios atendidos',
			solutionsCount: '11+',
			solutionsLabel: 'Soluciones de IA',
			ratingCount: '4,9',
			ratingLabel: 'Calificación de usuarios',
		},
		services: {
			title: 'OPTIMIZA TU FLUJO DE TRABAJO',
			readMore: 'Leer más',
			items: [
				{
					label: 'Tareas Básicas',
					title: 'Automatización de Tareas',
					desc: 'Automatiza tareas repetitivas y ahorra tiempo valioso.',
					image: '/images/service-1.webp',
				},
				{
					label: 'Asistencia Profesional',
					title: 'Programación Inteligente',
					desc: 'Gestiona citas, calendarios y reuniones con facilidad.',
					image: '/images/service-2.webp',
				},
				{
					label: 'Soluciones Empresariales',
					title: 'Análisis de Datos',
					desc: 'Obtén insights clave y toma decisiones informadas.',
					image: '/images/service-3.webp',
				},
				{
					label: 'Integración Corporativa',
					title: 'Herramientas Potentes',
					desc: 'Integra soluciones de IA en tus sistemas empresariales.',
					image: '/images/service-4.webp',
				},
			],
		},
		features: {
			title: 'LO QUE OFRECEMOS',
			items: [
				{
					badge: '01',
					title: 'Insights Basados en IA',
					desc: 'Profundiza en los matices de estrategias, métricas y datos con máxima claridad.',
				},
				{
					badge: '02',
					title: 'Analítica en Tiempo Real',
					desc: 'Conoce los indicadores clave y las tendencias de hoy y del futuro.',
				},
				{
					badge: '03',
					title: 'Informes Automatizados',
					desc: 'Mantén informado a tu equipo con reportes generados de forma automática.',
				},
			],
		},
		community: {
			title: 'ÚNETE A NUESTRA COMUNIDAD DE IA',
			heading: 'Descubre el poder de la IA con nuestra creciente comunidad.',
			desc: 'Ya sea que estés optimizando tus operaciones, mejorando la interacción con tus clientes o escalando tu empresa, somos tu socio definitivo en IA. Suscríbete a nuestras novedades y comienza hoy mismo.',
			button: 'EMPEZAR AHORA',
			connect: 'Conéctate en redes:',
		},
		testimonials: {
			title: 'LO QUE DICEN NUESTROS CLIENTES',
			items: [
				{
					quote:
						'¡El Asistente de IA transformó por completo mi forma de trabajar! Gestiona mi agenda, redacta correos y me ayuda a generar ideas. ¡No imagino volver a hacerlo manualmente!',
					name: 'John D.',
					role: 'Cliente',
					avatar: '/images/author-1.webp',
				},
				{
					quote:
						'Esta herramienta cambia las reglas del juego. Como dueño de negocio, necesitaba algo que se encargara de las tareas rutinarias para concentrarme en la estrategia. Me ahorra horas cada semana.',
					name: 'James T.',
					role: 'Cliente',
					avatar: '/images/author-2.webp',
				},
				{
					quote:
						'Al principio tenía dudas, pero el Asistente de IA ha sido increíble. Es intuitivo, fácil de usar y se adapta a mi flujo de trabajo. Es como tener un par de manos extra en cada proyecto.',
					name: 'Floyid M.',
					role: 'Cliente',
					avatar: '/images/author-3.webp',
				},
			],
		},
		faqs: {
			title: '¿ TIENES PREGUNTAS ?',
			items: [
				{
					question: '¿Qué es el Asistente de IA?',
					answer:
						'Es una plataforma integral de inteligencia artificial diseñada para automatizar flujos de trabajo, optimizar la productividad y analizar datos con precisión.',
				},
				{
					question: '¿Cómo funciona el Asistente de IA?',
					answer:
						'Utiliza avanzados algoritmos de procesamiento de lenguaje natural y modelos de aprendizaje para conectarse con tus aplicaciones y resolver tareas de inmediato.',
				},
				{
					question: '¿Con qué tareas puede colaborar?',
					answer:
						'Gestión de agendas, redacción automatizada, análisis predictivo de datos, reportes ejecutivos e integración completa con tus herramientas de software.',
				},
				{
					question: '¿Es fácil de utilizar?',
					answer:
						'Por supuesto. La interfaz es intuitiva y conversacional, diseñada para operar sin curva de aprendizaje en cualquier navegador y dispositivo.',
				},
				{
					question: '¿Mis datos están seguros?',
					answer:
						'Totalmente protegidos. Aplicamos cifrado de grado empresarial de extremo a extremo y cumplimos con los estándares internacionales más estrictos de privacidad (GDPR).',
				},
			],
		},
		footer: {
			joinTitle: 'ÚNETE A LA COMUNIDAD',
			emailPlaceholder: 'Correo electrónico',
			socialTitle: 'Redes y Conexiones',
			aboutTitle: 'Acerca de',
			supportTitle: 'Soporte y Contacto',
			helpTitle: 'Ayuda',
			links: {
				home: 'Inicio',
				services: 'Servicios',
				features: 'Funciones',
				community: 'Comunidad',
				faqs: 'Preguntas',
				contactUs: 'Contáctanos',
				whatsapp: 'WhatsApp',
				telegram: 'Telegram',
				customerSupport: 'Atención al Cliente',
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
