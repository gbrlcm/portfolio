import type { SupportedLanguage } from '../i18n/ui';

export const WHATSAPP_PHONE = '+55 (19) 98825-7631';
export const WHATSAPP_RAW = '5519988257631';
export const WHATSAPP_NUMBER = WHATSAPP_RAW; // backwards compatibility

export const TELEGRAM_PHONE = '+55 (19) 98825-7631';
export const TELEGRAM_RAW = '5519988257631';
export const TELEGRAM_URL = 'https://t.me/+5519988257631';

export const EMAILS: Record<SupportedLanguage, string> = {
	'pt-BR': 'contato@gabrielcampos.dev',
	en: 'contact@gabrielcampos.dev',
	es: 'contacto@gabrielcampos.dev',
};

export const EMAIL = EMAILS['pt-BR']; // backwards compatibility

export const WHATSAPP_MESSAGES: Record<SupportedLanguage, string> = {
	'pt-BR': 'Olá Gabriel! Vim pelo seu portfólio e gostaria de conversar a respeito de um projeto.',
	en: 'Hello Gabriel! I came across your portfolio and would like to talk about a project.',
	es: '¡Hola Gabriel! Vi tu portafolio y me gustaría hablar sobre un proyecto.',
};

export function getContactEmail(lang: SupportedLanguage = 'pt-BR'): string {
	return EMAILS[lang] ?? EMAILS['pt-BR'];
}

export function getWhatsAppUrl(lang: SupportedLanguage = 'pt-BR'): string {
	const message = encodeURIComponent(WHATSAPP_MESSAGES[lang] ?? WHATSAPP_MESSAGES['pt-BR']);
	return `https://wa.me/${WHATSAPP_RAW}?text=${message}`;
}

export function getTelegramUrl(): string {
	return TELEGRAM_URL;
}

export interface ContactChannel {
	id: 'whatsapp' | 'telegram' | 'email';
	label: string;
	value: string;
	href: string;
	note?: string;
	primary?: boolean;
}

export function getContacts(lang: SupportedLanguage = 'pt-BR'): ContactChannel[] {
	const email = getContactEmail(lang);
	const waUrl = getWhatsAppUrl(lang);
	const notes: Record<SupportedLanguage, { whatsapp: string; telegram: string; email: string }> = {
		'pt-BR': {
			whatsapp: 'Resposta mais rápida',
			telegram: 'Mensagens diretas',
			email: 'Propostas e orçamentos',
		},
		en: {
			whatsapp: 'Fastest response',
			telegram: 'Direct messages',
			email: 'Inquiries & proposals',
		},
		es: {
			whatsapp: 'Respuesta más rápida',
			telegram: 'Mensajería directa',
			email: 'Propuestas y presupuestos',
		},
	};

	const currentNotes = notes[lang] ?? notes['pt-BR'];

	return [
		{
			id: 'whatsapp',
			label: 'WhatsApp',
			value: WHATSAPP_PHONE,
			href: waUrl,
			primary: true,
			note: currentNotes.whatsapp,
		},
		{
			id: 'telegram',
			label: 'Telegram',
			value: TELEGRAM_PHONE,
			href: TELEGRAM_URL,
			note: currentNotes.telegram,
		},
		{
			id: 'email',
			label: 'Email',
			value: email,
			href: `mailto:${email}`,
			note: currentNotes.email,
		},
	];
}

export const contacts = getContacts('pt-BR');
