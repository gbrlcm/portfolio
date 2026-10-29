import { defaultLang, ui, type SupportedLanguage } from './ui';

export function getLangFromUrl(url: URL): SupportedLanguage {
	const [, lang]: string[] = url.pathname.split('/');
	if (lang === 'pt') return 'pt-BR';
	if (lang in ui) return lang as SupportedLanguage;
	return defaultLang;
}

export function useTranslations(lang: SupportedLanguage) {
	return function t() {
		return ui[lang] || ui[defaultLang];
	};
}

export function getLocalizedPath(pathname: string, targetLang: SupportedLanguage): string {
	const segments: string[] = pathname.split('/').filter(Boolean);

	if (
		segments.length > 0 &&
		(segments[0] === 'en' ||
			segments[0] === 'es' ||
			segments[0] === 'pt' ||
			segments[0] === 'pt-BR')
	) {
		segments.shift();
	}

	const remaining: string = segments.join('/');
	const targetPrefix = targetLang === 'pt-BR' ? 'pt' : targetLang;

	return remaining ? `/${targetPrefix}/${remaining}` : `/${targetPrefix}`;
}
