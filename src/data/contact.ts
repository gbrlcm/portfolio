export interface ContactChannel {
	id: 'whatsapp' | 'wechat' | 'telegram' | 'email';
	label: string;
	value: string;
	href: string;
	note?: string;
	primary?: boolean;
}

export const WHATSAPP_NUMBER = '55(19)98825-7631';

export const EMAIL = 'contato@gabrielcampos.dev';

const whatsappBase = `https://wa.me/${WHATSAPP_NUMBER}`;

export const contacts: ContactChannel[] = [
	{
		id: 'whatsapp',
		label: 'WhatsApp',
		value: `+${WHATSAPP_NUMBER.slice(0, 4)} ${WHATSAPP_NUMBER.slice(4)}`,
		href: whatsappBase,
		primary: true,
		note: 'Resposta mais rápida',
	},
	{
		id: 'wechat',
		label: 'WeChat',
		value: 'gabrielcampos_dev',
		href: '',
		note: 'Adicione o ID ao contato',
	},
	{
		id: 'telegram',
		label: 'Telegram',
		value: '@gabrielcampos',
		href: 'https://t.me/gabrielcampos',
	},
	{
		id: 'email',
		label: 'Email',
		value: EMAIL,
		href: `mailto:${EMAIL}`,
		note: 'Propostas e contratos',
	},
];
