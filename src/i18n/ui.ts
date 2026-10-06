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
			title: 'Gabriel Campos — Desenvolvimento de Software & Sistemas Web',
			description:
				'Desenvolvimento de software, sistemas web sob medida e integrações de APIs por Gabriel Campos. Código limpo, estabilidade e arquitetura moderna para empresas.',
		},
		nav: {
			home: 'Início',
			problems: 'Problemas',
			services: 'Serviços',
			principles: 'Como trabalho',
			about: 'Sobre',
			faqs: 'Dúvidas',
			contact: 'Contato',
			getInTouch: 'Falar no WhatsApp',
			getInTouchShort: 'Conversar',
		},
		hero: {
			title: 'Sistemas web e aplicações sob medida.',
			subtitle:
				'Desenvolvo sistemas internos, integrações de APIs e aplicações web com arquitetura moderna, código limpo e foco na operação do seu negócio.',
			ctaPrimary: 'Conversar no WhatsApp',
			ctaSecondary: 'Ver serviços e especialidades',
			trustNote: 'Atendimento direto com o desenvolvedor · Atuação remota para todo o Brasil',
		},
		problems: {
			title: 'ONDE POSSO AJUDAR SUA OPERAÇÃO',
			items: [
				{
					badge: '01',
					title: 'Processos manuais e planilhas desconexas',
					desc: 'Desenvolvo painéis e ferramentas internas para centralizar informações e organizar tarefas operacionais que hoje dependem de controle manual.',
				},
				{
					badge: '02',
					title: 'Sistemas lentos e difíceis de evoluir',
					desc: 'Posso ajudar na modernização e reestruturação de interfaces e serviços, priorizando estabilidade, rapidez e facilidade de manutenção.',
				},
				{
					badge: '03',
					title: 'Ferramentas e APIs que não se comunicam',
					desc: 'Construo integrações entre sistemas legados, plataformas externas e bancos de dados para manter seus dados sincronizados.',
				},
			],
		},
		services: {
			title: 'SERVIÇOS E ESPECIALIDADES',
			readMore: 'Conversar sobre este serviço',
			readMoreShort: 'Conversar sobre',
			items: [
				{
					label: 'Sistemas Web',
					title: 'Aplicações e Ferramentas Internas',
					desc: 'Desenvolvimento de painéis administrativos, portais e sistemas operacionais sob medida para centralizar a rotina da sua empresa.',
					deliverables: 'Arquitetura sob medida · Painéis administrativos · Bancos relacionais',
					image: '/images/service-1.webp',
				},
				{
					label: 'Engenharia Backend',
					title: 'APIs, Integrações e Automações',
					desc: 'Construção de APIs robustas e integração de serviços entre plataformas, automatizando o fluxo de dados entre ferramentas.',
					deliverables: 'APIs em Go e TypeScript · Integração de serviços · Estrutura em Docker',
					image: '/images/service-2.webp',
				},
				{
					label: 'Frontend & Performance',
					title: 'Sites e Landing Pages de Alto Desempenho',
					desc: 'Presença digital com carregamento rápido, código enxuto e estrutura técnica pronta para motores de busca e acessibilidade.',
					deliverables: 'Astro e Tailwind CSS · Otimização de Core Web Vitals · SEO técnico',
					image: '/images/service-3.webp',
				},
			],
		},
		principles: {
			title: 'COMO TRABALHO',
			items: [
				{
					badge: '01',
					title: 'Comunicação Direta',
					desc: 'Você conversa e alinha demandas diretamente com o desenvolvedor responsável pela execução, sem intermediários ou ruídos.',
				},
				{
					badge: '02',
					title: 'Entregas em Checkpoints',
					desc: 'O projeto evolui em etapas incrementais visíveis, permitindo validação contínua do que está sendo construído antes da conclusão.',
				},
				{
					badge: '03',
					title: 'Padrões de Fácil Manutenção',
					desc: 'O projeto é desenvolvido com tecnologias e padrões que facilitam manutenção, versionamento e continuidade por outras equipes.',
				},
			],
		},
		about: {
			title: 'SOBRE GABRIEL CAMPOS',
			titlePrefix: 'SOBRE',
			firstName: 'Gabriel',
			lastName: 'Campos',
			bioSubtitle: 'Apresentação & Atuação',
			bio1: 'Sou desenvolvedor de software com foco em engenharia web, sistemas e integração de serviços. Priorizo código limpo, estabilidade e compreensão profunda do contexto de negócio antes de propor qualquer solução técnica.',
			bio2: 'Atuo na comunidade técnica local através do GDG Americana e trabalho de forma remota com empresas e equipes de diversas regiões.',
			profStackTitle: 'Especialidades e tecnologias profissionais:',
			profStack: 'TypeScript · Go · Node.js / NestJS · Docker · PostgreSQL · REST APIs',
			linksSubtitle: 'Perfis & Redes Profissionais',
			githubLabel: 'GitHub ↗',
			linkedinLabel: 'LinkedIn ↗',
			xLabel: 'X ↗',
			whatsappLabel: 'WhatsApp ↗',
			telegramLabel: 'Telegram ↗',
		},
		faqs: {
			title: 'PERGUNTAS FREQUENTES',
			items: [
				{
					question: 'Que tipo de projeto você desenvolve?',
					answer:
						'Desenvolvo sistemas web sob medida (como painéis administrativos e portais internos), APIs, rotinas de integração de dados e sites institucionais de alta performance.',
				},
				{
					question: 'Você trabalha em sistemas já existentes?',
					answer:
						'Sim. Posso atuar na modernização de ferramentas em produção, criação de novas rotas de API, integrações entre sistemas ou correção de gargalos de estabilidade e performance.',
				},
				{
					question: 'Como funciona o processo de orçamento?',
					answer:
						'Conversamos inicialmente por WhatsApp ou e-mail para entender o escopo e as necessidades técnicas. A partir disso, preparo uma proposta detalhando escopo, etapas e valores.',
				},
				{
					question: 'Você trabalha remotamente?',
					answer:
						'Sim. Atendo de forma remota com comunicação alinhada e pontos de contato com clientes em qualquer região do Brasil ou no exterior.',
				},
				{
					question: 'Como funciona a propriedade do código desenvolvido?',
					answer:
						'Os termos de propriedade, acesso ao código-fonte e entrega são definidos na proposta e no contrato do projeto.',
				},
			],
		},
		contactSection: {
			title: 'VAMOS CONVERSAR?',
			heading: 'Tem uma demanda técnica ou um sistema para construir?',
			desc: 'Envie uma mensagem pelo WhatsApp ou por e-mail para avaliarmos o escopo e os requisitos do seu projeto.',
			buttonWa: 'Chamar no WhatsApp',
			buttonEmail: 'Enviar um E-mail',
			connect: 'Conecte-se nas redes:',
		},
		testimonials: {
			title: 'DEPOIMENTOS',
			items: [] as { quote: string; name: string; role: string; avatar: string }[],
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
				features: 'Como trabalho',
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
			title: 'Gabriel Campos — Software Development & Web Systems',
			description:
				'Custom software development, tailored web systems, and API integrations by Gabriel Campos. Clean code, modern architecture, and direct engineering.',
		},
		nav: {
			home: 'Home',
			problems: 'Challenges',
			services: 'Services',
			principles: 'How I Work',
			about: 'About',
			faqs: 'FAQs',
			contact: 'Contact',
			getInTouch: 'Chat on WhatsApp',
			getInTouchShort: 'Chat',
		},
		hero: {
			title: 'Custom web systems and software engineering.',
			subtitle:
				'I build internal tools, API integrations, and tailored web applications with modern architecture, clean code, and a focus on your business operations.',
			ctaPrimary: 'Chat on WhatsApp',
			ctaSecondary: 'Explore services & expertise',
			trustNote: 'Direct communication with the developer · Remote work worldwide',
		},
		problems: {
			title: 'CHALLENGES I HELP RESOLVE',
			items: [
				{
					badge: '01',
					title: 'Manual workflows and disconnected spreadsheets',
					desc: 'I develop dashboards and internal tools to centralize data and organize operational routines that currently rely on manual maintenance.',
				},
				{
					badge: '02',
					title: 'Slow, hard-to-maintain legacy systems',
					desc: 'I can help restructure and modernize applications, prioritizing stability, runtime speed, and ongoing maintainability.',
				},
				{
					badge: '03',
					title: 'Siloed tools and non-communicating APIs',
					desc: 'I build reliable integrations across legacy systems, external services, and databases to keep your company data synchronized.',
				},
			],
		},
		services: {
			title: 'SERVICES & EXPERTISE',
			readMore: 'Discuss this service',
			readMoreShort: 'Discuss',
			items: [
				{
					label: 'Web Systems',
					title: 'Internal Applications & Portals',
					desc: 'Custom administrative dashboards and operational platforms designed to centralize your company workflows.',
					deliverables: 'Tailored architecture · Admin dashboards · Relational databases',
					image: '/images/service-1.webp',
				},
				{
					label: 'Backend Engineering',
					title: 'APIs, Integrations & Automation',
					desc: 'Resilient backend services connecting disparate software, automating data flows between tools.',
					deliverables: 'Go & TypeScript APIs · Third-party integrations · Containerized Docker setups',
					image: '/images/service-2.webp',
				},
				{
					label: 'Frontend & Performance',
					title: 'High-Performance Websites & Landing Pages',
					desc: 'Fast, responsive digital presence built with lean code, solid Core Web Vitals, and native technical SEO.',
					deliverables: 'Astro & Tailwind CSS · Core Web Vitals optimization · Technical SEO',
					image: '/images/service-3.webp',
				},
			],
		},
		principles: {
			title: 'HOW I WORK',
			items: [
				{
					badge: '01',
					title: 'Direct Communication',
					desc: 'You discuss requirements and align tasks directly with the engineer building your software, without layers or intermediaries.',
				},
				{
					badge: '02',
					title: 'Checkpoint Deliveries',
					desc: 'The project progresses through tangible milestones, allowing continuous validation of what is built before final release.',
				},
				{
					badge: '03',
					title: 'Maintainable Standards',
					desc: 'The software is built with modern tools, clean version control, and clear architectural patterns to enable future maintenance by any team.',
				},
			],
		},
		about: {
			title: 'ABOUT GABRIEL CAMPOS',
			titlePrefix: 'ABOUT',
			firstName: 'Gabriel',
			lastName: 'Campos',
			bioSubtitle: 'Background & Focus',
			bio1: 'I am a software developer focused on web engineering, systems, and service integrations. I prioritize clean code, architectural simplicity, and a thorough understanding of the business problem before proposing technical solutions.',
			bio2: 'I actively contribute to the local tech community through GDG Americana and work remotely with organizations across diverse locations.',
			profStackTitle: 'Professional tech stack & expertise:',
			profStack: 'TypeScript · Go · Node.js / NestJS · Docker · PostgreSQL · REST APIs',
			linksSubtitle: 'Professional Profiles & Links',
			githubLabel: 'GitHub ↗',
			linkedinLabel: 'LinkedIn ↗',
			xLabel: 'X ↗',
			whatsappLabel: 'WhatsApp ↗',
			telegramLabel: 'Telegram ↗',
		},
		faqs: {
			title: 'FREQUENTLY ASKED QUESTIONS',
			items: [
				{
					question: 'What types of projects do you develop?',
					answer:
						'I build custom web systems (such as administrative tools and internal portals), APIs, automated integration routines, and high-performance websites.',
				},
				{
					question: 'Do you work on existing systems?',
					answer:
						'Yes. I can help modernize legacy tools, create new API routes, integrate external services, or address stability and performance bottlenecks.',
				},
				{
					question: 'How does the proposal and kickoff process work?',
					answer:
						'We begin with a conversation via WhatsApp or email to understand your technical requirements and scope. Based on that, I provide a detailed proposal covering scope, timeline, and pricing.',
				},
				{
					question: 'Do you work remotely?',
					answer:
						'Yes. I work 100% remotely with structured communication and regular check-ins for clients across Brazil and internationally.',
				},
				{
					question: 'Who owns the code developed during the project?',
					answer:
						'Terms regarding code ownership, repository access, and deliverables are formally defined in the project proposal and contract.',
				},
			],
		},
		contactSection: {
			title: 'READY TO DISCUSS YOUR PROJECT?',
			heading: 'Have a technical requirement or a system to build?',
			desc: 'Send a message via WhatsApp or email to discuss the scope and requirements of your project.',
			buttonWa: 'Chat on WhatsApp',
			buttonEmail: 'Send an Email',
			connect: 'Connect on social:',
		},
		testimonials: {
			title: 'TESTIMONIALS',
			items: [] as { quote: string; name: string; role: string; avatar: string }[],
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
				features: 'How I Work',
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
			title: 'Gabriel Campos — Desarrollo de Software & Sistemas Web',
			description:
				'Desarrollo de software, sistemas web a medida e integraciones de APIs por Gabriel Campos. Código limpio, arquitectura moderna y comunicación directa para empresas.',
		},
		nav: {
			home: 'Inicio',
			problems: 'Desafíos',
			services: 'Servicios',
			principles: 'Cómo trabajo',
			about: 'Sobre mí',
			faqs: 'Preguntas',
			contact: 'Contacto',
			getInTouch: 'Hablar por WhatsApp',
			getInTouchShort: 'Conversar',
		},
		hero: {
			title: 'Sistemas web y aplicaciones a medida.',
			subtitle:
				'Desarrollo herramientas internas, integraciones de APIs y aplicaciones web con arquitectura moderna, código limpio y foco en la operación de tu negocio.',
			ctaPrimary: 'Hablar por WhatsApp',
			ctaSecondary: 'Ver servicios y capacidades',
			trustNote: 'Trato directo con el desarrollador · Trabajo remoto en todo el mundo',
		},
		problems: {
			title: 'DÓNDE PUEDO AYUDAR A TU OPERACIÓN',
			items: [
				{
					badge: '01',
					title: 'Procesos manuales y hojas de cálculo desconectadas',
					desc: 'Desarrollo paneles y herramientas internas para centralizar información y organizar rutinas operativas que dependen de control manual.',
				},
				{
					badge: '02',
					title: 'Sistemas lentos y difíciles de mantener',
					desc: 'Puedo colaborar en la modernización y reestructuración de interfaces y servicios, priorizando estabilidad, rapidez y facilidad de mantenimiento.',
				},
				{
					badge: '03',
					title: 'Herramientas y APIs que no se comunican',
					desc: 'Construyo integraciones entre sistemas existentes, plataformas externas y bases de datos para mantener tus datos sincronizados.',
				},
			],
		},
		services: {
			title: 'SERVICIOS Y CAPACIDADES',
			readMore: 'Conversar sobre este servicio',
			readMoreShort: 'Conversar sobre',
			items: [
				{
					label: 'Sistemas Web',
					title: 'Aplicaciones y Paneles Internos',
					desc: 'Desarrollo de paneles administrativos, portales y plataformas operativas a medida para centralizar la rutina de tu empresa.',
					deliverables: 'Arquitectura a medida · Paneles de gestión · Bases de datos relacionales',
					image: '/images/service-1.webp',
				},
				{
					label: 'Ingeniería Backend',
					title: 'APIs, Integraciones y Automatización',
					desc: 'Construcción de APIs robustas y conexión de servicios entre plataformas, automatizando el flujo de datos entre herramientas.',
					deliverables: 'APIs en Go y TypeScript · Integración de servicios · Configuración en Docker',
					image: '/images/service-2.webp',
				},
				{
					label: 'Frontend y Rendimiento',
					title: 'Sitios y Landing Pages de Alto Desempeño',
					desc: 'Presencia digital con carga rápida, código optimizado y estructura técnica lista para motores de búsqueda y accesibilidad.',
					deliverables: 'Astro y Tailwind CSS · Optimización de Core Web Vitals · SEO técnico',
					image: '/images/service-3.webp',
				},
			],
		},
		principles: {
			title: 'CÓMO TRABAJO',
			items: [
				{
					badge: '01',
					title: 'Comunicación Directa',
					desc: 'Dialogas y defines requisitos directamente con el desarrollador a cargo de la ejecución, sin capas intermedias ni fricción.',
				},
				{
					badge: '02',
					title: 'Entregas por Checkpoints',
					desc: 'El proyecto progresa en hitos verificables, permitiendo validar continuamente lo construido antes de la entrega final.',
				},
				{
					badge: '03',
					title: 'Estándares Mantenibles',
					desc: 'El proyecto se construye con tecnologías y patrones modernos que facilitan el mantenimiento y la continuidad por otros equipos.',
				},
			],
		},
		about: {
			title: 'SOBRE GABRIEL CAMPOS',
			titlePrefix: 'SOBRE',
			firstName: 'Gabriel',
			lastName: 'Campos',
			bioSubtitle: 'Presentación y Enfoque',
			bio1: 'Soy desarrollador de software enfocado en ingeniería web, sistemas e integraciones. Priorizo el código limpio, la estabilidad técnica y la comprensión profunda de la necesidad operativa antes de proponer soluciones.',
			bio2: 'Participo en la comunidad tecnológica local a través de GDG Americana y colaboro de forma remota con empresas de diversas regiones.',
			profStackTitle: 'Especialidades y tecnologías profesionales:',
			profStack: 'TypeScript · Go · Node.js / NestJS · Docker · PostgreSQL · REST APIs',
			linksSubtitle: 'Perfiles y Redes Profesionales',
			githubLabel: 'GitHub ↗',
			linkedinLabel: 'LinkedIn ↗',
			xLabel: 'X ↗',
			whatsappLabel: 'WhatsApp ↗',
			telegramLabel: 'Telegram ↗',
		},
		faqs: {
			title: 'PREGUNTAS FRECUENTES',
			items: [
				{
					question: '¿Qué tipo de proyectos desarrollas?',
					answer:
						'Desarrollo sistemas web a medida (como paneles de gestión y portales internos), APIs, rutinas de integración de datos y sitios web de alto rendimiento.',
				},
				{
					question: '¿Trabajas en sistemas existentes?',
					answer:
						'Sí. Puedo colaborar en la modernización de herramientas en producción, desarrollo de nuevas rutas de API, integraciones de servicios o corrección de lentitud.',
				},
				{
					question: '¿Cómo funciona la propuesta y el inicio del proyecto?',
					answer:
						'Conversamos inicialmente por WhatsApp o correo electrónico para entender el alcance y las necesidades técnicas. Luego presento una propuesta detallada con etapas y valores.',
				},
				{
					question: '¿Trabajas de forma remota?',
					answer:
						'Sí. Atiendo de forma remota con comunicación clara y reuniones periódicas para empresas en cualquier región de Brasil o en el extranjero.',
				},
				{
					question: '¿De quién es la propiedad del código desarrollado?',
					answer:
						'Los términos de propiedad, acceso al código fuente y entregables se definen formalmente en la propuesta y el contrato del proyecto.',
				},
			],
		},
		contactSection: {
			title: '¿HABLAMOS SOBRE TU PROYECTO?',
			heading: '¿Tienes una necesidad técnica o un sistema que construir?',
			desc: 'Envía un mensaje por WhatsApp o correo electrónico para evaluar el alcance y los requerimientos de tu proyecto.',
			buttonWa: 'Hablar por WhatsApp',
			buttonEmail: 'Enviar un Correo',
			connect: 'Conéctate en redes:',
		},
		testimonials: {
			title: 'TESTIMONIOS',
			items: [] as { quote: string; name: string; role: string; avatar: string }[],
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
				features: 'Cómo trabajo',
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
