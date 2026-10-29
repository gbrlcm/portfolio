import type { SignatureData } from './types';

export const DEFAULT_SIGNATURE_DATA: SignatureData = {
	fullName: 'Gabriel Campos',
	jobTitle: 'Engenheiro de Software & Arquiteto Web',
	department: 'Engenharia de Produto',
	email: 'contato@gabrielcampos.dev',
	phone: '+55 11 99999-9999',
	mobilePhone: '+55 11 98888-8888',
	companyName: 'Gabriel Campos Tech',
	website: 'https://gabrielcampos.dev',
	address: 'São Paulo, SP — Brasil',
	linkedin: 'https://www.linkedin.com/in/gbrlcm',
	instagram: 'https://www.instagram.com/gbrlcm',
	facebook: '',
	whatsapp: '+55 11 99999-9999',
	github: 'https://github.com/gbrlcm',
	twitter: '',
	templateId: 'classic',
	primaryColor: '#0d251a',
	textColor: '#222222',
	linkColor: '#0d251a',
	fontFamily: 'Arial, Helvetica, sans-serif',
	fontSize: 'md',
	avatarUrl: 'https://gabrielcampos.dev/images/avatar.jpg',
	logoUrl: '',
	ctaText: 'Conheça o portfólio',
	ctaUrl: 'https://gabrielcampos.dev',
	disclaimer: 'Esta mensagem pode conter informações confidenciais. Caso não seja o destinatário correto, por favor notifique o remetente e descarte este e-mail.',
};

export const AVAILABLE_FONTS = [
	{ id: 'Arial, Helvetica, sans-serif', label: 'Arial / Helvetica (Padrão universal)' },
	{ id: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
	{ id: 'Georgia, serif', label: 'Georgia (Elegante com serifa)' },
	{ id: 'Verdana, Geneva, sans-serif', label: 'Verdana (Alta legibilidade)' },
	{ id: "'Trebuchet MS', Helvetica, sans-serif", label: 'Trebuchet MS (Moderno)' },
	{ id: 'Tahoma, Geneva, sans-serif', label: 'Tahoma (Compacto)' },
	{ id: "'Times New Roman', Times, serif", label: 'Times New Roman (Clássico tradicional)' },
	{ id: "'Lucida Console', Monaco, monospace", label: 'Lucida Console (Mono / Técnico)' },
];

export const PRESET_PRIMARY_COLORS = [
	{ hex: '#0d251a', label: 'Verde GC (Identidade)' },
	{ hex: '#1e3a8a', label: 'Azul Marinho Corporativo' },
	{ hex: '#0f766e', label: 'Esmeralda Sofisticado' },
	{ hex: '#3730a3', label: 'Índigo Executivo' },
	{ hex: '#18181b', label: 'Grafite Carvão' },
	{ hex: '#831843', label: 'Vinho Tinto' },
	{ hex: '#9a3412', label: 'Terracota' },
	{ hex: '#4338ca', label: 'Cobalto' },
];

export const PRESET_TEXT_COLORS = [
	{ hex: '#222222', label: 'Preto Suave' },
	{ hex: '#374151', label: 'Cinza Escuro' },
	{ hex: '#111827', label: 'Carvão Profundo' },
	{ hex: '#47554e', label: 'Cinza Chumbo GC' },
];

export const PRESET_LINK_COLORS = [
	{ hex: '#0d251a', label: 'Mesma da Marca' },
	{ hex: '#1e40af', label: 'Azul Tradicional' },
	{ hex: '#0284c7', label: 'Azul Celeste' },
	{ hex: '#047857', label: 'Verde Floresta' },
];
