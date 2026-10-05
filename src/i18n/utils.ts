import { defaultLang, ui, type SupportedLanguage } from './ui';

export function getLangFromUrl(url: URL): SupportedLanguage {
	const [, lang] = url.pathname.split('/');
	if (lang in ui) return lang as SupportedLanguage;
	return defaultLang;
}

export function useTranslations(lang: SupportedLanguage) {
	return function t() {
		return ui[lang] || ui[defaultLang];
	};
}

export function getLocalizedPath(pathname: string, targetLang: SupportedLanguage): string {
	// Strip existing language prefix if present
	const segments = pathname.split('/').filter(Boolean);
	if (segments.length > 0 && (segments[0] === 'en' || segments[0] === 'es' || segments[0] === 'pt-BR')) {
		segments.shift();
	}
	const remaining = segments.join('/');

	if (targetLang === defaultLang) {
		return remaining ? `/${remaining}` : '/';
	}
	return remaining ? `/${targetLang}/${remaining}` : `/${targetLang}`;
}
