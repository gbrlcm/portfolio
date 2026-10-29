import type { SignatureData } from './types';
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
export function generateExportDocument(data: SignatureData): string {
	const signatureBody = generateSignatureHtml(data);
	const title = data.fullName
		? `Assinatura de E-mail — ${data.fullName}`
		: 'Assinatura de E-mail';

	return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${title}</title>
	<!-- Gerado por gabrielcampos.dev/ferramentas/gerador-de-assinatura-de-email -->
</head>
<body style="margin: 0; padding: 20px; background-color: #ffffff;">
	<!-- Início da Assinatura -->
	${signatureBody}
	<!-- Fim da Assinatura -->
</body>
</html>`;
}
