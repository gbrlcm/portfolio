import type { SignatureSocialData } from './types';
import { sanitizeUrl, formatWhatsAppUrl } from './sanitizer';

export interface SocialItem {
	name: string;
	url: string;
	shortLabel: string;
	bgColor: string;
	iconKey: string;
}

export function getSocialItems(data: SignatureSocialData, _primaryColor?: string): SocialItem[] {
	const items: SocialItem[] = [];

	if (data.linkedin) {
		items.push({
			name: 'LinkedIn',
			url: sanitizeUrl(data.linkedin),
			shortLabel: 'in',
			bgColor: '#0A66C2',
			iconKey: 'linkedin',
		});
	}
	if (data.github) {
		items.push({
			name: 'GitHub',
			url: sanitizeUrl(data.github),
			shortLabel: 'gh',
			bgColor: '#24292e',
			iconKey: 'github',
		});
	}
	if (data.whatsapp) {
		items.push({
			name: 'WhatsApp',
			url: formatWhatsAppUrl(data.whatsapp),
			shortLabel: 'wa',
			bgColor: '#25D366',
			iconKey: 'whatsapp',
		});
	}
	if (data.instagram) {
		items.push({
			name: 'Instagram',
			url: sanitizeUrl(data.instagram),
			shortLabel: 'ig',
			bgColor: '#E4405F',
			iconKey: 'instagram',
		});
	}
	if (data.facebook) {
		items.push({
			name: 'Facebook',
			url: sanitizeUrl(data.facebook),
			shortLabel: 'fb',
			bgColor: '#1877F2',
			iconKey: 'facebook',
		});
	}
	if (data.twitter) {
		items.push({
			name: 'X (Twitter)',
			url: sanitizeUrl(data.twitter),
			shortLabel: 'x',
			bgColor: '#000000',
			iconKey: 'x',
		});
	}

	return items;
}

/**
 * Gera uma linha de ícones de redes sociais em HTML 100% compatível com e-mails (tabelas e imagens PNG hospedadas).
 */
export function renderSocialBadgesHtml(
	items: SocialItem[],
	_fontFamily?: string,
	_style: 'pill' | 'minimal' | 'brand' = 'brand'
): string {
	if (items.length === 0) return '';

	const cells = items.map((item) => {
		const iconUrl = `https://gabrielcampos.dev/images/icons/signature/${item.iconKey}.png`;

		return `
			<td style="padding-right: 6px; padding-bottom: 4px; vertical-align: middle;">
				<a href="${item.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; text-decoration: none; border: 0; outline: none;">
					<img src="${iconUrl}" alt="${item.name}" width="22" height="22" style="display: block; border: 0; outline: none; width: 22px; height: 22px; border-radius: 4px;" />
				</a>
			</td>
		`;
	}).join('');

	return `
		<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
			<tr>
				${cells}
			</tr>
		</table>
	`;
}

/**
 * Versão minimalista em texto com separadores "•"
 */
export function renderSocialLinksTextHtml(
	items: SocialItem[],
	fontFamily: string,
	linkColor: string,
	fontSize: string
): string {
	if (items.length === 0) return '';

	const links = items.map((item) => {
		return `<a href="${item.url}" target="_blank" rel="noopener noreferrer" style="color: ${linkColor}; text-decoration: none; font-weight: 500;">${item.name}</a>`;
	}).join(` <span style="color: #9ca3af; padding: 0 4px;">•</span> `);

	return `
		<div style="font-family: ${fontFamily}; font-size: ${fontSize}; line-height: 1.4; color: ${linkColor};">
			${links}
		</div>
	`;
}
