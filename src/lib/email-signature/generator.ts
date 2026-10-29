import type { SignatureData } from './types';
import type { SupportedLanguage } from '../i18n/ui';
import { EMAIL_SIGNATURE_I18N } from './i18n';
import { renderClassicTemplate } from './templates/classic';
import { renderMinimalTemplate } from './templates/minimal';
import { renderCorporateTemplate } from './templates/corporate';
import { renderModernVisualTemplate } from './templates/modern-visual';

export function generateSignatureHtml(data: SignatureData): string {
	switch (data.templateId) {
		case 'minimal':
			return renderMinimalTemplate(data);
		case 'corporate':
			return renderCorporateTemplate(data);
		case 'modern-visual':
			return renderModernVisualTemplate(data);
		case 'classic':
		default:
			return renderClassicTemplate(data);
	}
}

/**
 * Gera um arquivo HTML completo, autônomo e válido para download com meta tags e charset UTF-8
 */
export function generateExportDocument(
	data: SignatureData,
	lang: SupportedLanguage = 'pt-BR'
): string {
	const signatureBody = generateSignatureHtml(data);
	const i18n = EMAIL_SIGNATURE_I18N[lang] || EMAIL_SIGNATURE_I18N['pt-BR'];
	const docLang = lang === 'pt-BR' ? 'pt-BR' : lang;
	const title = data.fullName
		? `${i18n.exportDoc.titleSuffix} — ${data.fullName}`
		: i18n.exportDoc.defaultTitle;

	return `<!DOCTYPE html>
<html lang="${docLang}">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${title}</title>
	<!-- ${i18n.exportDoc.generatorComment} -->
</head>
<body style="margin: 0; padding: 20px; background-color: #ffffff;">
	<!-- Start Signature -->
	${signatureBody}
	<!-- End Signature -->
</body>
</html>`;
}
