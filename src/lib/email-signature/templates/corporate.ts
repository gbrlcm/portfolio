import type { SignatureData } from '../types';
import { escapeHtml, sanitizeUrl, getFontScale } from '../sanitizer';
import { getSocialItems, renderSocialBadgesHtml } from '../social-helper';

export function renderCorporateTemplate(data: SignatureData): string {
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

	// Contatos formatados em linhas com ícones de texto limpos
	const contacts: string[] = [];
	if (email) {
		contacts.push(`
			<tr>
				<td style="padding: 2px 0; font-family: ${font}; font-size: ${scale.bodySize}; line-height: ${scale.lineHeight}; color: ${text};">
					<span style="display: inline-block; width: 18px; color: ${primary}; font-weight: bold;">&#9993;</span>
					<a href="mailto:${email}" style="color: ${link}; text-decoration: none; font-weight: 500;">${email}</a>
				</td>
			</tr>
		`);
	}
	if (phone) {
		const cleanPhone = phone.replace(/[^\d+]/g, '');
		contacts.push(`
			<tr>
				<td style="padding: 2px 0; font-family: ${font}; font-size: ${scale.bodySize}; line-height: ${scale.lineHeight}; color: ${text};">
					<span style="display: inline-block; width: 18px; color: ${primary}; font-weight: bold;">&#9742;</span>
					<a href="tel:${cleanPhone}" style="color: ${text}; text-decoration: none;">${phone}</a>
				</td>
			</tr>
		`);
	}
	if (mobile && mobile !== phone) {
		const cleanMobile = mobile.replace(/[^\d+]/g, '');
		contacts.push(`
			<tr>
				<td style="padding: 2px 0; font-family: ${font}; font-size: ${scale.bodySize}; line-height: ${scale.lineHeight}; color: ${text};">
					<span style="display: inline-block; width: 18px; color: ${primary}; font-weight: bold;">&#128241;</span>
					<a href="tel:${cleanMobile}" style="color: ${text}; text-decoration: none;">${mobile}</a>
				</td>
			</tr>
		`);
	}
	if (website) {
		const displayUrl = escapeHtml(data.website.replace(/^https?:\/\//i, '').replace(/\/$/, ''));
		contacts.push(`
			<tr>
				<td style="padding: 2px 0; font-family: ${font}; font-size: ${scale.bodySize}; line-height: ${scale.lineHeight}; color: ${text};">
					<span style="display: inline-block; width: 18px; color: ${primary}; font-weight: bold;">&#127760;</span>
					<a href="${website}" target="_blank" rel="noopener noreferrer" style="color: ${link}; text-decoration: none; font-weight: 500;">${displayUrl}</a>
				</td>
			</tr>
		`);
	}
	if (address) {
		contacts.push(`
			<tr>
				<td style="padding: 2px 0; font-family: ${font}; font-size: ${scale.smallSize}; line-height: 14px; color: #6b7280;">
					<span style="display: inline-block; width: 18px; color: ${primary}; font-weight: bold;">&#9679;</span>
					${address}
				</td>
			</tr>
		`);
	}

	return `
		<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-family: ${font}; border-top: 3px solid ${primary}; padding-top: 10px;">
			<tr>
				<td style="padding-top: 10px;">
					<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
						<tr>
							<!-- Coluna Principal com Dados -->
							<td valign="top" style="vertical-align: top; padding-right: 20px;">
								<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
									${fullName ? `
										<tr>
											<td style="font-family: ${font}; font-size: ${scale.nameSize}; font-weight: 700; line-height: 1.2; color: #111827; text-transform: uppercase; letter-spacing: 0.5px;">
												${fullName}
											</td>
										</tr>
									` : ''}
									${(jobTitle || department || company) ? `
										<tr>
											<td style="font-family: ${font}; font-size: ${scale.titleSize}; line-height: 1.3; color: ${primary}; font-weight: 600; padding-top: 2px; padding-bottom: 8px;">
												${jobTitle}${jobTitle && department ? ' • ' : ''}${department}${(jobTitle || department) && company ? ' | ' : ''}${company}
											</td>
										</tr>
									` : '<tr style="height: 6px;"><td style="height: 6px;"></td></tr>'}
									${contacts.length > 0 ? `
										<tr>
											<td style="padding-bottom: 8px;">
												<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
													${contacts.join('')}
												</table>
											</td>
										</tr>
									` : ''}
									${socialHtml ? `
										<tr>
											<td style="padding-top: 2px;">
												${socialHtml}
											</td>
										</tr>
									` : ''}
								</table>
							</td>

							<!-- Coluna Lateral com Foto / Logo / CTA (se existirem) -->
							${(avatar || logo || (ctaText && ctaUrl)) ? `
								<td valign="top" align="center" style="vertical-align: top; text-align: center; border-left: 1px solid #e5e7eb; padding-left: 20px;">
									<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
										${avatar ? `
											<tr>
												<td align="center" style="text-align: center; padding-bottom: 8px;">
													<img src="${avatar}" alt="${fullName}" width="${scale.avatarSize}" height="${scale.avatarSize}" style="display: block; margin: 0 auto; border: 0; outline: none; border-radius: 6px; width: ${scale.avatarSize}px; height: ${scale.avatarSize}px; object-fit: cover;" />
												</td>
											</tr>
										` : ''}
										${logo ? `
											<tr>
												<td align="center" style="text-align: center; padding-bottom: 8px;">
													<img src="${logo}" alt="${company || 'Logo'}" height="${scale.logoHeight}" style="display: block; margin: 0 auto; border: 0; outline: none; max-height: ${scale.logoHeight}px; max-width: 120px; object-fit: contain;" />
												</td>
											</tr>
										` : ''}
										${ctaText && ctaUrl ? `
											<tr>
												<td align="center" style="text-align: center; padding-top: 4px;">
													<a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; font-family: ${font}; font-size: ${scale.smallSize}; font-weight: bold; color: #ffffff; background-color: ${primary}; text-decoration: none; padding: 6px 14px; border-radius: 4px; white-space: nowrap;">
														${ctaText}
													</a>
												</td>
											</tr>
										` : ''}
									</table>
								</td>
							` : ''}
						</tr>
					</table>
				</td>
			</tr>
			${disclaimer ? `
				<tr>
					<td style="padding-top: 12px; margin-top: 10px; border-top: 1px solid #f3f4f6; font-family: ${font}; font-size: 10px; line-height: 14px; color: #9ca3af; text-align: justify;">
						${disclaimer}
					</td>
				</tr>
			` : ''}
		</table>
	`.trim();
}
