import type { SignatureData } from '../types';
import { escapeHtml, sanitizeUrl, getFontScale } from '../sanitizer';
import { getSocialItems, renderSocialBadgesHtml } from '../social-helper';

export function renderModernVisualTemplate(data: SignatureData): string {
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

	// Bloco de contatos
	const contacts: string[] = [];
	if (email) {
		contacts.push(`
			<td style="padding-right: 14px; padding-bottom: 4px; font-family: ${font}; font-size: ${scale.bodySize}; line-height: ${scale.lineHeight};">
				<a href="mailto:${email}" style="color: ${link}; text-decoration: none; font-weight: 500;">${email}</a>
			</td>
		`);
	}
	if (phone) {
		const cleanPhone = phone.replace(/[^\d+]/g, '');
		contacts.push(`
			<td style="padding-right: 14px; padding-bottom: 4px; font-family: ${font}; font-size: ${scale.bodySize}; line-height: ${scale.lineHeight}; color: ${text};">
				<a href="tel:${cleanPhone}" style="color: ${text}; text-decoration: none;">${phone}</a>
			</td>
		`);
	}
	if (mobile && mobile !== phone) {
		const cleanMobile = mobile.replace(/[^\d+]/g, '');
		contacts.push(`
			<td style="padding-right: 14px; padding-bottom: 4px; font-family: ${font}; font-size: ${scale.bodySize}; line-height: ${scale.lineHeight}; color: ${text};">
				<a href="tel:${cleanMobile}" style="color: ${text}; text-decoration: none;">${mobile}</a>
			</td>
		`);
	}
	if (website) {
		const displayUrl = escapeHtml(data.website.replace(/^https?:\/\//i, '').replace(/\/$/, ''));
		contacts.push(`
			<td style="padding-right: 14px; padding-bottom: 4px; font-family: ${font}; font-size: ${scale.bodySize}; line-height: ${scale.lineHeight};">
				<a href="${website}" target="_blank" rel="noopener noreferrer" style="color: ${primary}; text-decoration: none; font-weight: 600;">${displayUrl}</a>
			</td>
		`);
	}

	return `
		<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-family: ${font};">
			<tr>
				<td>
					<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
						<tr>
							${avatar ? `
								<td valign="top" style="vertical-align: top; padding-right: 16px;">
									<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
										<tr>
											<td style="border: 2px solid ${primary}; border-radius: 50%; padding: 3px;">
												<img src="${avatar}" alt="${fullName}" width="${scale.avatarSize}" height="${scale.avatarSize}" style="display: block; border: 0; outline: none; border-radius: 50%; width: ${scale.avatarSize}px; height: ${scale.avatarSize}px; object-fit: cover;" />
											</td>
										</tr>
										${logo ? `
											<tr>
												<td align="center" style="padding-top: 8px; text-align: center;">
													<img src="${logo}" alt="${company || 'Logo'}" height="${scale.logoHeight - 4}" style="display: block; margin: 0 auto; border: 0; outline: none; max-height: ${scale.logoHeight - 4}px; max-width: 90px; object-fit: contain;" />
												</td>
											</tr>
										` : ''}
									</table>
								</td>
							` : (logo ? `
								<td valign="top" style="vertical-align: top; padding-right: 16px;">
									<img src="${logo}" alt="${company || 'Logo'}" height="${scale.logoHeight + 4}" style="display: block; border: 0; outline: none; max-height: ${scale.logoHeight + 4}px; max-width: 120px; object-fit: contain;" />
								</td>
							` : '')}

							<td valign="top" style="vertical-align: top;">
								<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
									${fullName ? `
										<tr>
											<td style="font-family: ${font}; font-size: ${scale.nameSize}; font-weight: 800; line-height: 1.15; color: ${primary};">
												${fullName}
											</td>
										</tr>
									` : ''}
									${(jobTitle || department || company) ? `
										<tr>
											<td style="font-family: ${font}; font-size: ${scale.titleSize}; line-height: 1.35; color: #4b5563; padding-top: 3px; padding-bottom: 6px;">
												<span style="font-weight: 600; color: ${text};">${jobTitle}</span>
												${jobTitle && department ? ` &bull; ${department}` : (department || '')}
												${company ? ` <span style="color: ${primary}; font-weight: 600;">@ ${company}</span>` : ''}
											</td>
										</tr>
									` : '<tr style="height: 4px;"><td style="height: 4px;"></td></tr>'}
									${contacts.length > 0 ? `
										<tr>
											<td style="padding-bottom: 6px;">
												<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
													<tr>
														${contacts.join('')}
													</tr>
												</table>
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
									${(socialHtml || (ctaText && ctaUrl)) ? `
										<tr>
											<td style="padding-top: 4px;">
												<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
													<tr>
														${socialHtml ? `
															<td style="vertical-align: middle; padding-right: 14px;">
																${socialHtml}
															</td>
														` : ''}
														${ctaText && ctaUrl ? `
															<td style="vertical-align: middle;">
																<a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; font-family: ${font}; font-size: ${scale.smallSize}; font-weight: bold; color: #ffffff; background-color: ${primary}; text-decoration: none; padding: 6px 16px; border-radius: 50px; line-height: 14px;">
																	${ctaText}
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
					</table>
				</td>
			</tr>
			${disclaimer ? `
				<tr>
					<td style="padding-top: 10px; font-family: ${font}; font-size: 10px; line-height: 14px; color: #9ca3af; border-top: 1px dashed #e5e7eb; margin-top: 8px;">
						${disclaimer}
					</td>
				</tr>
			` : ''}
		</table>
	`.trim();
}
