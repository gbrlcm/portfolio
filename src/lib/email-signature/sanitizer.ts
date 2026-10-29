import type { TextSize } from './types';

export function escapeHtml(str: string | null | undefined): string {
	if (!str) return '';
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

export function sanitizeUrl(url: string | null | undefined): string {
	if (!url) return '';
	const trimmed = url.trim();
	if (!trimmed) return '';

	// Permite apenas protocolos seguros
	if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
		return escapeHtml(trimmed);
	}

	// Adiciona https:// se for um domínio normal
	return escapeHtml(`https://${trimmed}`);
}

export function formatWhatsAppUrl(numberOrUrl: string | null | undefined): string {
	if (!numberOrUrl) return '';
	const trimmed = numberOrUrl.trim();
	if (!trimmed) return '';

	if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
		return escapeHtml(trimmed);
	}

	// Remove caracteres não-numéricos
	const cleanNumber = trimmed.replace(/\D/g, '');
	if (!cleanNumber) return '';

	return `https://wa.me/${cleanNumber}`;
}

export function getFontScale(size: TextSize) {
	switch (size) {
		case 'sm':
			return {
				nameSize: '15px',
				titleSize: '12px',
				bodySize: '12px',
				smallSize: '11px',
				lineHeight: '16px',
				avatarSize: 72,
				logoHeight: 28,
			};
		case 'lg':
			return {
				nameSize: '19px',
				titleSize: '14px',
				bodySize: '14px',
				smallSize: '12px',
				lineHeight: '20px',
				avatarSize: 92,
				logoHeight: 36,
			};
		case 'md':
		default:
			return {
				nameSize: '17px',
				titleSize: '13px',
				bodySize: '13px',
				smallSize: '11px',
				lineHeight: '18px',
				avatarSize: 80,
				logoHeight: 32,
			};
	}
}
