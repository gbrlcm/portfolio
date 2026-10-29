import type { SupportedLanguage } from '../i18n/ui';

export interface ToolRouteDefinition {
	slug: string;
	path: string;
	name: string;
	shortName: string;
}

export const EMAIL_SIGNATURE_ROUTES: Record<SupportedLanguage, ToolRouteDefinition> = {
	'pt-BR': {
		slug: 'gerador-de-assinatura-de-email',
		path: '/pt/ferramentas/gerador-de-assinatura-de-email',
		name: 'Gerador de Assinatura de E-mail',
		shortName: 'Gerador de Assinatura',
	},
	en: {
		slug: 'email-signature-generator',
		path: '/en/tools/email-signature-generator',
		name: 'Email Signature Generator',
		shortName: 'Signature Generator',
	},
	es: {
		slug: 'generador-de-firma-de-correo',
		path: '/es/herramientas/generador-de-firma-de-correo',
		name: 'Generador de Firma de Correo',
		shortName: 'Generador de Firma',
	},
};

export const SIGNATURE_CUSTOM_LANGUAGE_URLS: Record<SupportedLanguage, string> = {
	'pt-BR': EMAIL_SIGNATURE_ROUTES['pt-BR'].path,
	en: EMAIL_SIGNATURE_ROUTES.en.path,
	es: EMAIL_SIGNATURE_ROUTES.es.path,
};

export function getSignatureHreflangs(siteUrl: string = 'https://gabrielcampos.dev') {
	const base = siteUrl.replace(/\/$/, '');
	return [
		{ lang: 'pt-BR', href: `${base}${EMAIL_SIGNATURE_ROUTES['pt-BR'].path}/` },
		{ lang: 'en', href: `${base}${EMAIL_SIGNATURE_ROUTES.en.path}/` },
		{ lang: 'es', href: `${base}${EMAIL_SIGNATURE_ROUTES.es.path}/` },
		{ lang: 'x-default', href: `${base}${EMAIL_SIGNATURE_ROUTES['pt-BR'].path}/` },
	];
}
