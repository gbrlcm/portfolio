export interface Service {
	code: string;
	title: string;
	summary: string;
	items: string[];
}

export const services: Service[] = [
	{
		code: '01',
		title: 'Landing pages e sites institucionais',
		summary:
			'Presença digital rápida, com carregamento rápido e estrutura pronta para posicionar a marca.',
		items: ['Design sob medida', 'Deploy e domínio', 'SEO técnico'],
	},
	{
		code: '02',
		title: 'Aplicações e sistemas internos',
		summary:
			'Ferramentas que tiram trabalho manual do time: painéis, automações e fluxos sob medida.',
		items: ['Arquitetura', 'Integrações', 'Manutenção'],
	},
	{
		code: '03',
		title: 'Otimização e performance',
		summary:
			'Diagnóstico de lentidão em código e infraestrutura, com correções priorizadas por impacto.',
		items: ['Auditoria', 'Core Web Vitals', 'Monitoramento'],
	},
];

export interface Step {
	code: string;
	title: string;
	summary: string;
}

export const process: Step[] = [
	{
		code: '01',
		title: 'Você conta o que precisa',
		summary: 'Formulário de 2 minutos ou uma mensagem no WhatsApp. Sem discovery call cobrada.',
	},
	{
		code: '02',
		title: 'Você recebe o orçamento',
		summary: 'Escopo, prazo e valor por escrito, em até 24h úteis.',
	},
	{
		code: '03',
		title: 'Eu executo',
		summary: 'Entregas em checkpoints, com o que está pronto sempre visível.',
	},
	{
		code: '04',
		title: 'Você aprova e sobe',
		summary: 'Publicação, monitoramento e um período de garantia incluído.',
	},
];
