import type { SignatureData } from '../types';
import { escapeHtml, sanitizeUrl, getFontScale } from '../sanitizer';
import { getSocialItems, renderSocialLinksTextHtml } from '../social-helper';

export function renderMinimalTemplate(data: SignatureData): string {
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
	const socialHtml = renderSocialLinksTextHtml(socialItems, font, link, scale.smallSize);

	// Linha de subtítulo
	const subtitleParts: string[] = [];
	if (jobTitle) subtitleParts.push(jobTitle);
	if (department) subtitleParts.push(department);
	if (company) {
		const compHtml = website
			? `<a href="${website}" target="_blank" rel="noopener noreferrer" style="color: ${text}; text-decoration: none; font-weight: 600;">${company}</a>`
			: `<span style="font-weight: 600;">${company}</span>`;
		subtitleParts.push(compHtml);
	}
	const subtitleHtml = subtitleParts.join(' <span style="color: #d1d5db; padding: 0 4px;">/</span> ');

	// Linha de contatos inline
	const contactItems: string[] = [];
	if (email) {
		contactItems.push(`<a href="mailto:${email}" style="color: ${link}; text-decoration: none;">${email}</a>`);
	}
	if (phone) {
		const cleanPhone = phone.replace(/[^\d+]/g, '');
		contactItems.push(`<a href="tel:${cleanPhone}" style="color: ${text}; text-decoration: none;">${phone}</a>`);
	}
	if (mobile && mobile !== phone) {
		const cleanMobile = mobile.replace(/[^\d+]/g, '');
		contactItems.push(`<a href="tel:${cleanMobile}" style="color: ${text}; text-decoration: none;">${mobile}</a>`);
	}
	if (website) {
		const displayUrl = escapeHtml(data.website.replace(/^https?:\/\//i, '').replace(/\/$/, ''));
		contactItems.push(`<a href="${website}" target="_blank" rel="noopener noreferrer" style="color: ${link}; text-decoration: none;">${displayUrl}</a>`);
	}

	const contactsInlineHtml = contactItems.join(' <span style="color: #e5e7eb; padding: 0 6px;">•</span> ');

	// Foto circular pequena se houver
	const avatarCell = avatar
		? `
			<td valign="middle" style="padding-right: 14px; vertical-align: middle;">
				<img src="${avatar}" alt="${fullName}" width="${scale.avatarSize - 16}" height="${scale.avatarSize - 16}" style="display: block; border: 0; outline: none; border-radius: 50%; width: ${scale.avatarSize - 16}px; height: ${scale.avatarSize - 16}px; object-fit: cover;" />
			</td>
		`
		: '';

	return `
		<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-family: ${font};">
			<tr>
				${avatarCell}
				<td valign="middle" style="vertical-align: middle;">
					<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
						${fullName ? `
							<tr>
								<td style="font-family: ${font}; font-size: ${scale.nameSize}; font-weight: bold; line-height: 1.2; color: ${primary}; letter-spacing: -0.2px;">
									${fullName}
								</td>
							</tr>
						` : ''}
						${subtitleHtml ? `
							<tr>
								<td style="font-family: ${font}; font-size: ${scale.titleSize}; line-height: 1.4; color: #6b7280; padding-top: 2px; padding-bottom: 6px;">
									${subtitleHtml}
								</td>
							</tr>
						` : '<tr style="height: 4px;"><td style="height: 4px;"></td></tr>'}
						${contactsInlineHtml ? `
							<tr>
								<td style="font-family: ${font}; font-size: ${scale.bodySize}; line-height: 1.5; color: ${text}; padding-bottom: 6px;">
									${contactsInlineHtml}
								</td>
							</tr>
						` : ''}
						${address ? `
							<tr>
								<td style="font-family: ${font}; font-size: ${scale.smallSize}; line-height: 1.3; color: #9ca3af; padding-bottom: 6px;">
									${address}
								</td>
							</tr>
						` : ''}
						${socialHtml ? `
							<tr>
								<td style="padding-top: 2px; padding-bottom: 6px;">
									${socialHtml}
								</td>
							</tr>
						` : ''}
						${(ctaText && ctaUrl) || logo ? `
							<tr>
								<td style="padding-top: 6px;">
									<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
										<tr>
											${logo ? `
												<td style="padding-right: 12px; vertical-align: middle;">
													<img src="${logo}" alt="${company || 'Logo'}" height="${scale.logoHeight - 4}" style="display: block; border: 0; outline: none; max-height: ${scale.logoHeight - 4}px; max-width: 120px; object-fit: contain;" />
												</td>
											` : ''}
											${ctaText && ctaUrl ? `
												<td style="vertical-align: middle;">
													<a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; font-family: ${font}; font-size: ${scale.smallSize}; font-weight: 600; color: ${primary}; border: 1px solid ${primary}; text-decoration: none; padding: 4px 12px; border-radius: 20px; line-height: 14px;">
														${ctaText} &rarr;
													</a>
												</td>
											` : ''}
										</tr>
									</table>
								</td>
							</tr>
						` : ''}
					</table>
				</td>
			</tr>
			${disclaimer ? `
				<tr>
					<td colspan="2" style="padding-top: 10px; font-family: ${font}; font-size: 10px; line-height: 13px; color: #9ca3af;">
						${disclaimer}
					</td>
				</tr>
			` : ''}
		</table>
	`.trim();
}
