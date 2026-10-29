import type { SignatureData } from '../types';
import { escapeHtml, sanitizeUrl, getFontScale } from '../sanitizer';
import { getSocialItems, renderSocialBadgesHtml } from '../social-helper';

export function renderClassicTemplate(data: SignatureData): string {
	const scale = getFontScale(data.fontSize);
	const font = data.fontFamily;
	const primary = data.primaryColor;
	const text = data.textColor;
	const link = data.linkColor;

	const fullName = escapeHtml(data.fullName);
	const jobTitle = escapeHtml(data.jobTitle);
	const department = escapeHtml(data.department);
	const company = escapeHtml(data.companyName);
	const website = sanitizeUrl(data.website);
	const email = escapeHtml(data.email);
	const phone = escapeHtml(data.phone);
	const mobile = escapeHtml(data.mobilePhone);
	const address = escapeHtml(data.address);
	const avatar = sanitizeUrl(data.avatarUrl);
	const logo = sanitizeUrl(data.logoUrl);
	const ctaText = escapeHtml(data.ctaText);
	const ctaUrl = sanitizeUrl(data.ctaUrl);
	const disclaimer = escapeHtml(data.disclaimer);

	const socialItems = getSocialItems(data, primary);
	const socialHtml = renderSocialBadgesHtml(socialItems, font, 'brand');

	// Bloco de cargo e departamento
	let roleDepartment = '';
	if (jobTitle && department) {
		roleDepartment = `${jobTitle} <span style="color: ${primary};">|</span> ${department}`;
	} else if (jobTitle) {
		roleDepartment = jobTitle;
	} else if (department) {
		roleDepartment = department;
	}

	// Bloco de contatos
	const contactRows: string[] = [];
	if (email) {
		contactRows.push(`
			<tr>
				<td style="padding: 1px 0; font-family: ${font}; font-size: ${scale.bodySize}; line-height: ${scale.lineHeight}; color: ${text};">
					<span style="font-weight: bold; color: ${primary};">E:</span>&nbsp;
					<a href="mailto:${email}" style="color: ${link}; text-decoration: none;">${email}</a>
				</td>
			</tr>
		`);
	}
	if (phone) {
		const cleanPhone = phone.replace(/[^\d+]/g, '');
		contactRows.push(`
			<tr>
				<td style="padding: 1px 0; font-family: ${font}; font-size: ${scale.bodySize}; line-height: ${scale.lineHeight}; color: ${text};">
					<span style="font-weight: bold; color: ${primary};">T:</span>&nbsp;
					<a href="tel:${cleanPhone}" style="color: ${text}; text-decoration: none;">${phone}</a>
				</td>
			</tr>
		`);
	}
	if (mobile) {
		const cleanMobile = mobile.replace(/[^\d+]/g, '');
		contactRows.push(`
			<tr>
				<td style="padding: 1px 0; font-family: ${font}; font-size: ${scale.bodySize}; line-height: ${scale.lineHeight}; color: ${text};">
					<span style="font-weight: bold; color: ${primary};">M:</span>&nbsp;
					<a href="tel:${cleanMobile}" style="color: ${text}; text-decoration: none;">${mobile}</a>
				</td>
			</tr>
		`);
	}
	if (website) {
		const displayUrl = escapeHtml(data.website.replace(/^https?:\/\//i, '').replace(/\/$/, ''));
		contactRows.push(`
			<tr>
				<td style="padding: 1px 0; font-family: ${font}; font-size: ${scale.bodySize}; line-height: ${scale.lineHeight}; color: ${text};">
					<span style="font-weight: bold; color: ${primary};">W:</span>&nbsp;
					<a href="${website}" target="_blank" rel="noopener noreferrer" style="color: ${link}; text-decoration: none; font-weight: 500;">${displayUrl}</a>
				</td>
			</tr>
		`);
	}
	if (address) {
		contactRows.push(`
			<tr>
				<td style="padding: 1px 0; font-family: ${font}; font-size: ${scale.smallSize}; line-height: 14px; color: #6b7280;">
					${address}
				</td>
			</tr>
		`);
	}

	// Foto / Avatar
	const avatarCell = avatar
		? `
			<td valign="top" style="padding-right: 16px; vertical-align: top;">
				<img src="${avatar}" alt="${fullName}" width="${scale.avatarSize}" height="${scale.avatarSize}" style="display: block; border: 0; outline: none; text-decoration: none; border-radius: 8px; width: ${scale.avatarSize}px; height: ${scale.avatarSize}px; object-fit: cover;" />
			</td>
			<td valign="top" style="border-left: 2px solid ${primary}; padding-left: 16px; vertical-align: top;">
		`
		: `
			<td valign="top" style="vertical-align: top;">
		`;

	// CTA Button
	const ctaHtml = (ctaText && ctaUrl)
		? `
			<div style="margin-top: 10px;">
				<a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; font-family: ${font}; font-size: ${scale.smallSize}; font-weight: bold; color: #ffffff; background-color: ${primary}; text-decoration: none; padding: 6px 14px; border-radius: 4px; line-height: 14px;">
					${ctaText}
				</a>
			</div>
		`
		: '';

	// Logo
	const logoHtml = logo
		? `
			<div style="margin-top: 10px;">
				<img src="${logo}" alt="${company || 'Logo'}" height="${scale.logoHeight}" style="display: block; border: 0; outline: none; text-decoration: none; max-height: ${scale.logoHeight}px; max-width: 140px; object-fit: contain;" />
			</div>
		`
		: '';

	// Disclaimer
	const disclaimerHtml = disclaimer
		? `
			<tr>
				<td colspan="2" style="padding-top: 12px; border-top: 1px solid #e5e7eb; margin-top: 10px; font-family: ${font}; font-size: 10px; line-height: 14px; color: #9ca3af; font-style: italic;">
					${disclaimer}
				</td>
			</tr>
		`
		: '';

	return `
		<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-family: ${font};">
			<tr>
				${avatarCell}
					<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
						${fullName ? `
							<tr>
								<td style="font-family: ${font}; font-size: ${scale.nameSize}; font-weight: bold; line-height: 1.2; color: ${primary}; padding-bottom: 2px;">
									${fullName}
								</td>
							</tr>
						` : ''}
						${roleDepartment ? `
							<tr>
								<td style="font-family: ${font}; font-size: ${scale.titleSize}; line-height: 1.3; color: ${text}; padding-bottom: 2px;">
									${roleDepartment}
								</td>
							</tr>
						` : ''}
						${company ? `
							<tr>
								<td style="font-family: ${font}; font-size: ${scale.titleSize}; font-weight: 600; line-height: 1.3; color: #4b5563; padding-bottom: 8px;">
									${website ? `<a href="${website}" target="_blank" rel="noopener noreferrer" style="color: #4b5563; text-decoration: none;">${company}</a>` : company}
								</td>
							</tr>
						` : '<tr style="height: 6px;"><td style="height: 6px;"></td></tr>'}
						${contactRows.length > 0 ? `
							<tr>
								<td style="padding-bottom: 8px;">
									<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
										${contactRows.join('')}
									</table>
								</td>
							</tr>
						` : ''}
						${socialHtml ? `
							<tr>
								<td style="padding-top: 2px; padding-bottom: 4px;">
									${socialHtml}
								</td>
							</tr>
						` : ''}
						${(ctaHtml || logoHtml) ? `
							<tr>
								<td>
									${logoHtml}
									${ctaHtml}
								</td>
							</tr>
						` : ''}
					</table>
				</td>
			</tr>
			${disclaimerHtml}
		</table>
	`.trim();
}
