export type TemplateId = 'classic' | 'minimal' | 'corporate' | 'modern-visual';

export type TextSize = 'sm' | 'md' | 'lg';

export interface SignaturePersonalData {
	fullName: string;
	jobTitle: string;
	department: string;
	email: string;
	phone: string;
	mobilePhone: string;
}

export interface SignatureCompanyData {
	companyName: string;
	website: string;
	address: string;
}

export interface SignatureSocialData {
	linkedin: string;
	instagram: string;
	facebook: string;
	whatsapp: string;
	github: string;
	twitter: string;
}

export interface SignatureStyleData {
	templateId: TemplateId;
	primaryColor: string;
	textColor: string;
	linkColor: string;
	fontFamily: string;
	fontSize: TextSize;
}

export interface SignatureExtraData {
	avatarUrl: string;
	logoUrl: string;
	ctaText: string;
	ctaUrl: string;
	disclaimer: string;
}

export interface SignatureData extends
	SignaturePersonalData,
	SignatureCompanyData,
	SignatureSocialData,
	SignatureStyleData,
	SignatureExtraData {}
