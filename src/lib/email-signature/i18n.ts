import type { SignatureData } from './types';
import type { SupportedLanguage } from '../i18n/ui';

export interface SignatureTranslations {
	meta: {
		title: string;
		description: string;
		appName: string;
		offersCurrency: string;
	};
	breadcrumbs: {
		home: string;
		tools: string;
		current: string;
	};
	header: {
		title: string;
		subtitle: string;
		fillExample: string;
		fillExampleTitle: string;
		clear: string;
		clearTitle: string;
	};
	steps: {
		step1Title: string;
		step1Subtitle: string;
		step2Title: string;
		step2Subtitle: string;
		step3Title: string;
		step3Subtitle: string;
		step4Title: string;
		step4Subtitle: string;
	};
	step1: {
		title: string;
		subtitle: string;
		classicTitle: string;
		classicDesc: string;
		minimalTitle: string;
		minimalDesc: string;
		corporateTitle: string;
		corporateDesc: string;
		modernTitle: string;
		modernDesc: string;
		photoLabel: string;
	};
	step2: {
		title: string;
		subtitle: string;
		personalData: string;
		fullName: string;
		fullNamePlaceholder: string;
		jobTitle: string;
		jobTitlePlaceholder: string;
		department: string;
		departmentPlaceholder: string;
		companyName: string;
		companyNamePlaceholder: string;
		contactChannels: string;
		email: string;
		phone: string;
		mobilePhone: string;
		website: string;
		address: string;
		addressPlaceholder: string;
		socialNetworks: string;
	};
	step3: {
		title: string;
		subtitle: string;
		primaryColor: string;
		textColor: string;
		linkColor: string;
		fontFamily: string;
		fontSize: string;
		sizeSm: string;
		sizeSmDesc: string;
		sizeMd: string;
		sizeMdDesc: string;
		sizeLg: string;
		sizeLgDesc: string;
		hexPlaceholder: string;
	};
	step4: {
		title: string;
		subtitle: string;
		avatarLabel: string;
		avatarHint: string;
		logoLabel: string;
		logoHint: string;
		ctaLabel: string;
		ctaTextLabel: string;
		ctaTextPlaceholder: string;
		ctaUrlLabel: string;
		ctaUrlPlaceholder: string;
		disclaimerLabel: string;
		disclaimerPlaceholder: string;
		disclaimerHint: string;
	};
	navigation: {
		prev: string;
		next: string;
		finish: string;
		stepIndicator: string;
	};
	preview: {
		liveTitle: string;
		liveBadge: string;
		copyFormatted: string;
		copySuccess: string;
		copyHtml: string;
		downloadHtml: string;
		instructionsTitle: string;
		gmailTitle: string;
		gmailSteps: string[];
		outlookTitle: string;
		outlookSteps: string[];
		appleTitle: string;
		appleSteps: string[];
		imageHostTitle: string;
		imageHostDesc: string;
	};
	toasts: {
		exampleLoaded: string;
		exampleLoadedDesc: string;
		fieldsCleared: string;
		fieldsClearedDesc: string;
		copySuccess: string;
		copySuccessDesc: string;
		copyFallback: string;
		copyFallbackDesc: string;
		copyError: string;
		copyErrorDesc: string;
		htmlCopied: string;
		htmlCopiedDesc: string;
		downloadStarted: string;
		downloadStartedDesc: string;
		confirmClear: string;
	};
	exportDoc: {
		titleSuffix: string;
		defaultTitle: string;
		generatorComment: string;
	};
	defaultData: SignatureData;
	fonts: { id: string; label: string }[];
	primaryColors: { hex: string; label: string }[];
	textColors: { hex: string; label: string }[];
	linkColors: { hex: string; label: string }[];
}

export const EMAIL_SIGNATURE_I18N: Record<SupportedLanguage, SignatureTranslations> = {
	'pt-BR': {
		meta: {
			title: 'Gerador de Assinatura de E-mail Gratuito e Profissional — Gabriel Campos',
			description:
				'Crie assinaturas de e-mail profissionais compatíveis com Gmail, Microsoft Outlook e Apple Mail. Modelos clássicos, minimalistas e corporativos gerados em HTML limpo, sem cadastro e 100% privado.',
			appName: 'Gerador de Assinatura de E-mail Profissional',
			offersCurrency: 'BRL',
		},
		breadcrumbs: {
			home: 'Início',
			tools: 'Ferramentas',
			current: 'Gerador de Assinatura de E-mail',
		},
		header: {
			title: 'Gerador de Assinatura de E-mail',
			subtitle:
				'Crie assinaturas profissionais compatíveis com Gmail, Outlook e Apple Mail em poucos cliques. Sem cadastro e 100% privado no seu navegador.',
			fillExample: 'Preencher Exemplo',
			fillExampleTitle: 'Preencher todos os campos com dados de exemplo',
			clear: 'Limpar',
			clearTitle: 'Limpar formulário',
		},
		steps: {
			step1Title: 'Modelo',
			step1Subtitle: 'Layout visual',
			step2Title: 'Info',
			step2Subtitle: 'Dados & contatos',
			step3Title: 'Estilo',
			step3Subtitle: 'Cores & fontes',
			step4Title: 'Extras',
			step4Subtitle: 'Fotos & CTA',
		},
		step1: {
			title: 'Escolha o modelo de assinatura',
			subtitle: 'Compare as estruturas abaixo e selecione a que melhor representa seu perfil profissional.',
			classicTitle: 'Clássico',
			classicDesc: 'Divisor vertical & foto destacada',
			minimalTitle: 'Minimalista',
			minimalDesc: 'Tipografia limpa & bullets sutis',
			corporateTitle: 'Corporativo',
			corporateDesc: 'Borda superior sólida & layout executivo',
			modernTitle: 'Moderno Visual',
			modernDesc: 'Card acolhedor, foto redonda & chips sutis',
			photoLabel: 'FOTO',
		},
		step2: {
			title: 'Informações Pessoais & Contato',
			subtitle: 'Preencha apenas os campos que deseja exibir. Campos em branco não aparecerão na assinatura final.',
			personalData: 'Dados Pessoais & Empresa',
			fullName: 'Nome Completo',
			fullNamePlaceholder: 'ex: Gabriel Campos',
			jobTitle: 'Cargo / Função',
			jobTitlePlaceholder: 'ex: Engenheiro de Software',
			department: 'Departamento',
			departmentPlaceholder: 'ex: Engenharia de Produto',
			companyName: 'Empresa',
			companyNamePlaceholder: 'ex: Gabriel Campos Tech',
			contactChannels: 'Canais de Contato',
			email: 'E-mail Profissional',
			phone: 'Telefone Fixo / Escritório',
			mobilePhone: 'Celular / WhatsApp Direto',
			website: 'Website / Portfólio (URL)',
			address: 'Endereço / Localização',
			addressPlaceholder: 'ex: São Paulo, SP — Brasil',
			socialNetworks: 'Redes Sociais & Links',
		},
		step3: {
			title: 'Personalização visual',
			subtitle: 'Ajuste as cores da sua marca e a tipografia. A prévia ao lado reflete as alterações instantaneamente.',
			primaryColor: 'Cor Principal da Marca (Destaques e divisores)',
			textColor: 'Cor do Texto Principal',
			linkColor: 'Cor dos Links & Ícones',
			fontFamily: 'Família Tipográfica (Font-Safe para clientes de e-mail)',
			fontSize: 'Tamanho da Tipografia',
			sizeSm: 'Pequeno',
			sizeSmDesc: 'Compacto e discreto',
			sizeMd: 'Médio',
			sizeMdDesc: 'Padrão recomendado',
			sizeLg: 'Grande',
			sizeLgDesc: 'Maior destaque visual',
			hexPlaceholder: '#000000',
		},
		step4: {
			title: 'Imagens, Ações & Aviso Legal',
			subtitle: 'Adicione fotos, logotipo, botão de chamada para ação e termo de confidencialidade opcional.',
			avatarLabel: 'URL da Foto de Perfil (Avatar)',
			avatarHint: 'Insira o link público HTTPS direto de uma foto quadrada (.jpg, .png ou .webp). Deixe em branco se preferir sem foto.',
			logoLabel: 'URL do Logotipo da Empresa',
			logoHint: 'Insira o link público HTTPS direto do logotipo (.png ou .jpg com fundo transparente). Deixe em branco para ocultar.',
			ctaLabel: 'Botão de Ação / Chamada (CTA)',
			ctaTextLabel: 'Texto do Botão',
			ctaTextPlaceholder: 'ex: Agendar Reunião, Ver Portfólio',
			ctaUrlLabel: 'Link de Destino do Botão (URL)',
			ctaUrlPlaceholder: 'https://seusite.com/agendar',
			disclaimerLabel: 'Aviso Legal / Termo de Confidencialidade (Opcional)',
			disclaimerPlaceholder: 'Insira um aviso legal curto para rodapé do e-mail...',
			disclaimerHint: 'Texto legal discreto posicionado no fim da assinatura. Deixe em branco para desativar.',
		},
		navigation: {
			prev: 'Voltar',
			next: 'Avançar',
			finish: 'Concluir & Copiar',
			stepIndicator: 'Etapa {current} de 4',
		},
		preview: {
			liveTitle: 'Prévia em Tempo Real',
			liveBadge: 'Atualização Dinâmica',
			copyFormatted: 'Copiar Assinatura Formatada',
			copySuccess: 'Copiado para a área de transferência!',
			copyHtml: 'Copiar Código HTML',
			downloadHtml: 'Baixar Arquivo .HTML',
			instructionsTitle: 'Como instalar a assinatura no seu cliente de e-mail',
			gmailTitle: 'Gmail (Google Workspace)',
			gmailSteps: [
				'Copie a assinatura com o botão "Copiar Assinatura Formatada" acima.',
				'No Gmail no navegador, clique no ícone de engrenagem no canto superior direito e selecione Ver todas as configurações.',
				'Na aba Geral, role até a seção Assinatura.',
				'Clique em Criar nova assinatura, dê um nome (ex.: "Profissional") e cole diretamente na caixa de texto (Ctrl+V ou Cmd+V).',
				'Ajuste os valores padrão para novos e-mails e respostas, e clique em Salvar alterações no fim da página.',
			],
			outlookTitle: 'Microsoft Outlook (Web & Desktop)',
			outlookSteps: [
				'Copie a assinatura formatada com o botão acima.',
				'No Outlook Web: vá em Configurações &rarr; Contas &rarr; Assinaturas.',
				'No Outlook Desktop (Windows/Mac): vá em Arquivo &rarr; Opções &rarr; E-mail &rarr; Assinaturas.',
				'Crie uma nova assinatura e cole o conteúdo no editor de rich-text (Ctrl+V ou Cmd+V).',
				'Defina a assinatura para novas mensagens e respostas e clique em Salvar.',
			],
			appleTitle: 'Apple Mail (Mac & iOS)',
			appleSteps: [
				'Copie a assinatura formatada com o botão acima.',
				'No macOS, abra o Mail &rarr; Ajustes (Settings) &rarr; Assinaturas.',
				'Adicione uma nova assinatura, desmarque a opção "Sempre usar minha fonte padrão".',
				'Cole o conteúdo diretamente na caixa de edição da assinatura.',
				'No iPhone/iPad: acesse Ajustes &rarr; Mail &rarr; Assinatura e cole.',
			],
			imageHostTitle: 'Onde hospedar suas fotos e logotipos?',
			imageHostDesc:
				'Clientes de e-mail exigem que as imagens estejam acessíveis via link público HTTPS direto (terminando em .jpg, .png ou .webp). Você pode utilizar a foto do seu próprio site, foto do seu perfil do LinkedIn (aberta ao público), Imgur, Cloudinary ou Google Drive (com permissão pública de visualização direta).',
		},
		toasts: {
			exampleLoaded: 'Exemplo carregado!',
			exampleLoadedDesc: 'Os campos foram preenchidos com dados completos para demonstração.',
			fieldsCleared: 'Campos limpos',
			fieldsClearedDesc: 'O formulário foi redefinido.',
			copySuccess: 'Assinatura copiada com sucesso!',
			copySuccessDesc: 'Pronta para colar (Cmd+V ou Ctrl+V) no Gmail ou Outlook.',
			copyFallback: 'Assinatura copiada!',
			copyFallbackDesc: 'Cole diretamente nas configurações do seu cliente de e-mail.',
			copyError: 'Não foi possível copiar automaticamente',
			copyErrorDesc: 'Por favor, selecione e copie manualmente ou use "Copiar Código HTML".',
			htmlCopied: 'Código HTML copiado!',
			htmlCopiedDesc: 'Código-fonte pronto para colar em clientes com suporte a HTML direto.',
			downloadStarted: 'Download iniciado!',
			downloadStartedDesc: 'O arquivo .html foi salvo no seu computador.',
			confirmClear: 'Deseja realmente limpar todos os campos preenchidos?',
		},
		exportDoc: {
			titleSuffix: 'Assinatura de E-mail',
			defaultTitle: 'Assinatura de E-mail',
			generatorComment: 'Gerado por gabrielcampos.dev/pt/ferramentas/gerador-de-assinatura-de-email',
		},
		defaultData: {
			fullName: 'Gabriel Campos',
			jobTitle: 'Engenheiro de Software & Arquiteto Web',
			department: 'Engenharia de Produto',
			email: 'contato@gabrielcampos.dev',
			phone: '+55 11 99999-9999',
			mobilePhone: '+55 11 98888-8888',
			companyName: 'Gabriel Campos Tech',
			website: 'https://gabrielcampos.dev/pt/',
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
			ctaUrl: 'https://gabrielcampos.dev/pt/',
			disclaimer:
				'Esta mensagem pode conter informações confidenciais. Caso não seja o destinatário correto, por favor notifique o remetente e descarte este e-mail.',
		},
		fonts: [
			{ id: 'Arial, Helvetica, sans-serif', label: 'Arial / Helvetica (Padrão universal)' },
			{ id: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
			{ id: 'Georgia, serif', label: 'Georgia (Elegante com serifa)' },
			{ id: 'Verdana, Geneva, sans-serif', label: 'Verdana (Alta legibilidade)' },
			{ id: "'Trebuchet MS', Helvetica, sans-serif", label: 'Trebuchet MS (Moderno)' },
			{ id: 'Tahoma, Geneva, sans-serif', label: 'Tahoma (Compacto)' },
			{ id: "'Times New Roman', Times, serif", label: 'Times New Roman (Clássico tradicional)' },
			{ id: "'Lucida Console', Monaco, monospace", label: 'Lucida Console (Mono / Técnico)' },
		],
		primaryColors: [
			{ hex: '#0d251a', label: 'Verde GC (Identidade)' },
			{ hex: '#1e3a8a', label: 'Azul Marinho Corporativo' },
			{ hex: '#0f766e', label: 'Esmeralda Sofisticado' },
			{ hex: '#3730a3', label: 'Índigo Executivo' },
			{ hex: '#18181b', label: 'Grafite Carvão' },
			{ hex: '#831843', label: 'Vinho Tinto' },
			{ hex: '#9a3412', label: 'Terracota' },
			{ hex: '#4338ca', label: 'Cobalto' },
		],
		textColors: [
			{ hex: '#222222', label: 'Preto Suave' },
			{ hex: '#374151', label: 'Cinza Escuro' },
			{ hex: '#111827', label: 'Carvão Profundo' },
			{ hex: '#47554e', label: 'Cinza Chumbo GC' },
		],
		linkColors: [
			{ hex: '#0d251a', label: 'Mesma da Marca' },
			{ hex: '#1e40af', label: 'Azul Tradicional' },
			{ hex: '#0284c7', label: 'Azul Celeste' },
			{ hex: '#047857', label: 'Verde Floresta' },
		],
	},
	en: {
		meta: {
			title: 'Free Professional Email Signature Generator — Gabriel Campos',
			description:
				'Design professional email signatures fully compatible with Gmail, Microsoft Outlook, and Apple Mail. Clean HTML templates, privacy-first, and zero signup required.',
			appName: 'Professional Email Signature Generator',
			offersCurrency: 'USD',
		},
		breadcrumbs: {
			home: 'Home',
			tools: 'Tools',
			current: 'Email Signature Generator',
		},
		header: {
			title: 'Email Signature Generator',
			subtitle:
				'Create sleek, professional email signatures compatible with Gmail, Outlook, and Apple Mail. 100% private in your browser, no signup required.',
			fillExample: 'Fill Example',
			fillExampleTitle: 'Fill all inputs with demonstration data',
			clear: 'Clear',
			clearTitle: 'Reset form',
		},
		steps: {
			step1Title: 'Template',
			step1Subtitle: 'Visual layout',
			step2Title: 'Info',
			step2Subtitle: 'Details & contact',
			step3Title: 'Style',
			step3Subtitle: 'Colors & fonts',
			step4Title: 'Extras',
			step4Subtitle: 'Images & CTA',
		},
		step1: {
			title: 'Choose a signature template',
			subtitle: 'Compare layouts below and pick the structure that best matches your professional identity.',
			classicTitle: 'Classic',
			classicDesc: 'Vertical divider & highlighted photo',
			minimalTitle: 'Minimal',
			minimalDesc: 'Clean typography & subtle bullets',
			corporateTitle: 'Corporate',
			corporateDesc: 'Solid top accent & executive layout',
			modernTitle: 'Modern Visual',
			modernDesc: 'Warm card styling, rounded avatar & chips',
			photoLabel: 'PHOTO',
		},
		step2: {
			title: 'Personal & Contact Information',
			subtitle: 'Fill in only the fields you wish to display. Blank fields will not appear in the finished signature.',
			personalData: 'Personal & Company Details',
			fullName: 'Full Name',
			fullNamePlaceholder: 'e.g. Gabriel Campos',
			jobTitle: 'Job Title / Role',
			jobTitlePlaceholder: 'e.g. Software Engineer',
			department: 'Department',
			departmentPlaceholder: 'e.g. Product Engineering',
			companyName: 'Company Name',
			companyNamePlaceholder: 'e.g. Gabriel Campos Tech',
			contactChannels: 'Contact Channels',
			email: 'Professional Email',
			phone: 'Office / Landline Phone',
			mobilePhone: 'Mobile / WhatsApp Phone',
			website: 'Website / Portfolio (URL)',
			address: 'Address / Location',
			addressPlaceholder: 'e.g. San Francisco, CA — USA',
			socialNetworks: 'Social Profiles & Links',
		},
		step3: {
			title: 'Visual Customization',
			subtitle: 'Customize brand palette and typography. The live preview updates instantly.',
			primaryColor: 'Primary Brand Color (Accents and dividers)',
			textColor: 'Primary Text Color',
			linkColor: 'Link & Icon Color',
			fontFamily: 'Typography Family (Email-safe standard fonts)',
			fontSize: 'Font Size',
			sizeSm: 'Small',
			sizeSmDesc: 'Compact & understated',
			sizeMd: 'Medium',
			sizeMdDesc: 'Recommended default',
			sizeLg: 'Large',
			sizeLgDesc: 'Prominent visibility',
			hexPlaceholder: '#000000',
		},
		step4: {
			title: 'Images, Actions & Disclaimer',
			subtitle: 'Add profile photos, company logo, call-to-action button, and optional confidentiality notice.',
			avatarLabel: 'Profile Photo URL (Avatar)',
			avatarHint: 'Direct public HTTPS link to a square photo (.jpg, .png, or .webp). Leave blank to omit.',
			logoLabel: 'Company Logo URL',
			logoHint: 'Direct public HTTPS link to your logo (.png or .jpg with transparent background). Leave blank to omit.',
			ctaLabel: 'Call to Action Button (CTA)',
			ctaTextLabel: 'Button Label',
			ctaTextPlaceholder: 'e.g. Book a Meeting, View Portfolio',
			ctaUrlLabel: 'Button Destination Link (URL)',
			ctaUrlPlaceholder: 'https://yourdomain.com/contact',
			disclaimerLabel: 'Confidentiality Notice / Disclaimer (Optional)',
			disclaimerPlaceholder: 'Enter a short legal confidentiality notice for the email footer...',
			disclaimerHint: 'Subtle legal footer text placed at the very end. Leave blank to disable.',
		},
		navigation: {
			prev: 'Back',
			next: 'Next',
			finish: 'Finish & Copy',
			stepIndicator: 'Step {current} of 4',
		},
		preview: {
			liveTitle: 'Live Preview',
			liveBadge: 'Real-time updates',
			copyFormatted: 'Copy Formatted Signature',
			copySuccess: 'Copied to clipboard!',
			copyHtml: 'Copy HTML Source',
			downloadHtml: 'Download .HTML File',
			instructionsTitle: 'How to install this signature in your email client',
			gmailTitle: 'Gmail (Google Workspace)',
			gmailSteps: [
				'Copy the formatted signature using the "Copy Formatted Signature" button above.',
				'Open Gmail in your browser, click the gear icon in the top right corner and select See all settings.',
				'Under the General tab, scroll down to the Signature section.',
				'Click Create new, name it (e.g. "Professional"), and paste directly into the signature editor box (Ctrl+V or Cmd+V).',
				'Set signature defaults for new messages and replies, then click Save Changes at the bottom of the page.',
			],
			outlookTitle: 'Microsoft Outlook (Web & Desktop)',
			outlookSteps: [
				'Copy the formatted signature using the button above.',
				'Outlook Web: navigate to Settings &rarr; Accounts &rarr; Signatures.',
				'Outlook Desktop (Windows/Mac): go to File &rarr; Options &rarr; Mail &rarr; Signatures.',
				'Create a new signature and paste the content directly into the rich-text box (Ctrl+V or Cmd+V).',
				'Set the signature for new messages and replies, then save.',
			],
			appleTitle: 'Apple Mail (Mac & iOS)',
			appleSteps: [
				'Copy the formatted signature using the button above.',
				'On macOS, open Mail &rarr; Settings (Preferences) &rarr; Signatures.',
				'Add a new signature and uncheck "Always match my default message font".',
				'Paste the formatted content directly into the signature preview pane.',
				'On iPhone/iPad: open Settings &rarr; Mail &rarr; Signature and paste.',
			],
			imageHostTitle: 'Where to host your photos and logos?',
			imageHostDesc:
				'Email clients require images to be hosted on public HTTPS direct links (ending with .jpg, .png, or .webp). You can host them on your personal website, a public LinkedIn profile image, Imgur, Cloudinary, or Google Drive (configured with public direct view permissions).',
		},
		toasts: {
			exampleLoaded: 'Sample data loaded!',
			exampleLoadedDesc: 'All fields have been filled with sample data for demonstration.',
			fieldsCleared: 'Form reset',
			fieldsClearedDesc: 'All inputs have been cleared.',
			copySuccess: 'Signature copied successfully!',
			copySuccessDesc: 'Ready to paste (Cmd+V or Ctrl+V) into Gmail or Outlook.',
			copyFallback: 'Signature copied!',
			copyFallbackDesc: 'Paste directly into your email client settings.',
			copyError: 'Unable to copy automatically',
			copyErrorDesc: 'Please select and copy manually or use "Copy HTML Source".',
			htmlCopied: 'HTML source copied!',
			htmlCopiedDesc: 'Raw HTML is ready to paste into HTML-supported email editors.',
			downloadStarted: 'Download started!',
			downloadStartedDesc: 'The .html file has been saved to your computer.',
			confirmClear: 'Are you sure you want to clear all entered information?',
		},
		exportDoc: {
			titleSuffix: 'Email Signature',
			defaultTitle: 'Email Signature',
			generatorComment: 'Generated by gabrielcampos.dev/en/tools/email-signature-generator',
		},
		defaultData: {
			fullName: 'Gabriel Campos',
			jobTitle: 'Software Engineer & Web Architect',
			department: 'Product Engineering',
			email: 'contact@gabrielcampos.dev',
			phone: '+1 (555) 019-2834',
			mobilePhone: '+1 (555) 019-5821',
			companyName: 'Gabriel Campos Tech',
			website: 'https://gabrielcampos.dev/en/',
			address: 'San Francisco, CA — USA',
			linkedin: 'https://www.linkedin.com/in/gbrlcm',
			instagram: 'https://www.instagram.com/gbrlcm',
			facebook: '',
			whatsapp: '+1 555 019 2834',
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
			ctaText: 'View Portfolio',
			ctaUrl: 'https://gabrielcampos.dev/en/',
			disclaimer:
				'This message may contain confidential information. If you are not the intended recipient, please notify the sender and delete this email.',
		},
		fonts: [
			{ id: 'Arial, Helvetica, sans-serif', label: 'Arial / Helvetica (Universal standard)' },
			{ id: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
			{ id: 'Georgia, serif', label: 'Georgia (Elegant serif)' },
			{ id: 'Verdana, Geneva, sans-serif', label: 'Verdana (High legibility)' },
			{ id: "'Trebuchet MS', Helvetica, sans-serif", label: 'Trebuchet MS (Modern)' },
			{ id: 'Tahoma, Geneva, sans-serif', label: 'Tahoma (Compact)' },
			{ id: "'Times New Roman', Times, serif", label: 'Times New Roman (Classic traditional)' },
			{ id: "'Lucida Console', Monaco, monospace", label: 'Lucida Console (Mono / Technical)' },
		],
		primaryColors: [
			{ hex: '#0d251a', label: 'GC Forest Green (Brand)' },
			{ hex: '#1e3a8a', label: 'Corporate Navy Blue' },
			{ hex: '#0f766e', label: 'Sophisticated Emerald' },
			{ hex: '#3730a3', label: 'Executive Indigo' },
			{ hex: '#18181b', label: 'Charcoal Black' },
			{ hex: '#831843', label: 'Deep Burgundy' },
			{ hex: '#9a3412', label: 'Terracotta' },
			{ hex: '#4338ca', label: 'Cobalt Blue' },
		],
		textColors: [
			{ hex: '#222222', label: 'Soft Black' },
			{ hex: '#374151', label: 'Dark Slate' },
			{ hex: '#111827', label: 'Deep Charcoal' },
			{ hex: '#47554e', label: 'GC Muted Lead' },
		],
		linkColors: [
			{ hex: '#0d251a', label: 'Match Brand Color' },
			{ hex: '#1e40af', label: 'Traditional Blue' },
			{ hex: '#0284c7', label: 'Sky Blue' },
			{ hex: '#047857', label: 'Forest Green' },
		],
	},
	es: {
		meta: {
			title: 'Generador de Firma de Correo Electrónico Gratis y Profesional — Gabriel Campos',
			description:
				'Crea firmas de correo profesionales compatibles con Gmail, Microsoft Outlook y Apple Mail. Plantillas elegantes en HTML limpio, sin registro y 100% privado en tu navegador.',
			appName: 'Generador de Firma de Correo Profesional',
			offersCurrency: 'USD',
		},
		breadcrumbs: {
			home: 'Inicio',
			tools: 'Herramientas',
			current: 'Generador de Firma de Correo',
		},
		header: {
			title: 'Generador de Firma de Correo',
			subtitle:
				'Crea firmas profesionales compatibles con Gmail, Outlook y Apple Mail en pocos clics. Sin registro y 100% privado en tu navegador.',
			fillExample: 'Rellenar Ejemplo',
			fillExampleTitle: 'Rellenar todos los campos con datos de demostración',
			clear: 'Limpiar',
			clearTitle: 'Restablecer formulario',
		},
		steps: {
			step1Title: 'Modelo',
			step1Subtitle: 'Diseño visual',
			step2Title: 'Info',
			step2Subtitle: 'Datos y contactos',
			step3Title: 'Estilo',
			step3Subtitle: 'Colores y fuentes',
			step4Title: 'Extras',
			step4Subtitle: 'Fotos y CTA',
		},
		step1: {
			title: 'Elige el modelo de firma',
			subtitle: 'Compara las estructuras a continuación y selecciona la que mejor represente tu perfil profesional.',
			classicTitle: 'Clásico',
			classicDesc: 'Divisor vertical y foto destacada',
			minimalTitle: 'Minimalista',
			minimalDesc: 'Tipografía limpia y viñetas sutiles',
			corporateTitle: 'Corporativo',
			corporateDesc: 'Borde superior sólido y diseño ejecutivo',
			modernTitle: 'Moderno Visual',
			modernDesc: 'Tarjeta estilizada, avatar redondo y chips sutiles',
			photoLabel: 'FOTO',
		},
		step2: {
			title: 'Información Personal y Contacto',
			subtitle: 'Completa únicamente los campos que deseas mostrar. Los campos vacíos no aparecerán en la firma final.',
			personalData: 'Datos Personales y Empresa',
			fullName: 'Nombre Completo',
			fullNamePlaceholder: 'ej: Gabriel Campos',
			jobTitle: 'Cargo / Puesto',
			jobTitlePlaceholder: 'ej: Ingeniero de Software',
			department: 'Departamento',
			departmentPlaceholder: 'ej: Ingeniería de Producto',
			companyName: 'Empresa',
			companyNamePlaceholder: 'ej: Gabriel Campos Tech',
			contactChannels: 'Canales de Contacto',
			email: 'Correo Electrónico Profesional',
			phone: 'Teléfono Fijo / Oficina',
			mobilePhone: 'Teléfono Móvil / WhatsApp',
			website: 'Sitio Web / Portafolio (URL)',
			address: 'Dirección / Ubicación',
			addressPlaceholder: 'ej: Madrid, España / Buenos Aires, Argentina',
			socialNetworks: 'Redes Sociales y Enlaces',
		},
		step3: {
			title: 'Personalización Visual',
			subtitle: 'Ajusta los colores de tu marca y la tipografía. La vista previa refleja los cambios al instante.',
			primaryColor: 'Color Principal de la Marca (Resaltes y divisores)',
			textColor: 'Color del Texto Principal',
			linkColor: 'Color de Enlaces e Íconos',
			fontFamily: 'Familia Tipográfica (Fuentes seguras para clientes de correo)',
			fontSize: 'Tamaño de la Tipografía',
			sizeSm: 'Pequeño',
			sizeSmDesc: 'Compacto y discreto',
			sizeMd: 'Mediano',
			sizeMdDesc: 'Estándar recomendado',
			sizeLg: 'Grande',
			sizeLgDesc: 'Mayor protagonismo visual',
			hexPlaceholder: '#000000',
		},
		step4: {
			title: 'Imágenes, Acciones y Aviso Legal',
			subtitle: 'Añade fotos de perfil, logotipo, botón de llamada a la acción y cláusula de confidencialidad opcional.',
			avatarLabel: 'URL de la Foto de Perfil (Avatar)',
			avatarHint: 'Enlace público HTTPS directo a una foto cuadrada (.jpg, .png o .webp). Déjalo en blanco si prefieres sin foto.',
			logoLabel: 'URL del Logotipo de la Empresa',
			logoHint: 'Enlace público HTTPS directo de tu logotipo (.png o .jpg con fondo transparente). Déjalo en blanco para omitir.',
			ctaLabel: 'Botón de Llamada a la Acción (CTA)',
			ctaTextLabel: 'Texto del Botón',
			ctaTextPlaceholder: 'ej: Agendar Reunión, Ver Portafolio',
			ctaUrlLabel: 'Enlace de Destino del Botón (URL)',
			ctaUrlPlaceholder: 'https://tusitio.com/contacto',
			disclaimerLabel: 'Aviso Legal / Cláusula de Confidencialidad (Opcional)',
			disclaimerPlaceholder: 'Introduce un aviso legal breve para el pie del correo...',
			disclaimerHint: 'Texto legal discreto situado al final de la firma. Déjalo en blanco para desactivarlo.',
		},
		navigation: {
			prev: 'Volver',
			next: 'Avanzar',
			finish: 'Terminar y Copiar',
			stepIndicator: 'Etapa {current} de 4',
		},
		preview: {
			liveTitle: 'Vista Previa en Tiempo Real',
			liveBadge: 'Actualización en Directo',
			copyFormatted: 'Copiar Firma con Formato',
			copySuccess: '¡Copiado al portapapeles!',
			copyHtml: 'Copiar Código HTML',
			downloadHtml: 'Descargar Archivo .HTML',
			instructionsTitle: 'Cómo instalar la firma en tu cliente de correo',
			gmailTitle: 'Gmail (Google Workspace)',
			gmailSteps: [
				'Copia la firma con el botón "Copiar Firma con Formato" superior.',
				'En Gmail en tu navegador, haz clic en el icono del engranaje y selecciona Ver todos los ajustes.',
				'En la pestaña General, baja hasta la sección Firma.',
				'Haz clic en Crear nueva, ponle un nombre (ej.: "Profesional") y pega directamente en el editor (Ctrl+V o Cmd+V).',
				'Configura la firma para nuevos correos y respuestas, y haz clic en Guardar cambios al final.',
			],
			outlookTitle: 'Microsoft Outlook (Web y Escritorio)',
			outlookSteps: [
				'Copia la firma formateada con el botón de arriba.',
				'En Outlook Web: dirígete a Configuración &rarr; Cuentas &rarr; Firmas.',
				'En Outlook Escritorio (Windows/Mac): ve a Archivo &rarr; Opciones &rarr; Correo &rarr; Firmas.',
				'Crea una nueva firma y pega el contenido directamente en el editor (Ctrl+V o Cmd+V).',
				'Asigna la firma a los nuevos mensajes y respuestas y guarda los cambios.',
			],
			appleTitle: 'Apple Mail (Mac e iOS)',
			appleSteps: [
				'Copia la firma con formato con el botón de arriba.',
				'En macOS, abre Mail &rarr; Ajustes (Preferencias) &rarr; Firmas.',
				'Añade una nueva firma y desmarca la casilla "Usar siempre mi tipo de letra de mensaje predeterminado".',
				'Pega el contenido directamente en la casilla de edición de firma.',
				'En iPhone/iPad: ve a Ajustes &rarr; Mail &rarr; Firma y pega.',
			],
			imageHostTitle: '¿Dónde alojar tus fotos y logotipos?',
			imageHostDesc:
				'Los clientes de correo requieren que las imágenes estén disponibles a través de enlaces públicos HTTPS directos (terminados en .jpg, .png o .webp). Puedes usar tu propio sitio web, tu foto pública de LinkedIn, Imgur, Cloudinary o Google Drive (con permisos públicos de acceso directo).',
		},
		toasts: {
			exampleLoaded: '¡Ejemplo cargado!',
			exampleLoadedDesc: 'Los campos se han completado con datos de demostración.',
			fieldsCleared: 'Campos limpiados',
			fieldsClearedDesc: 'El formulario se ha restablecido.',
			copySuccess: '¡Firma copiada con éxito!',
			copySuccessDesc: 'Lista para pegar (Cmd+V o Ctrl+V) en Gmail u Outlook.',
			copyFallback: '¡Firma copiada!',
			copyFallbackDesc: 'Pega directamente en los ajustes de tu cliente de correo.',
			copyError: 'No se pudo copiar automáticamente',
			copyErrorDesc: 'Por favor, selecciona y copia manualmente o usa "Copiar Código HTML".',
			htmlCopied: '¡Código HTML copiado!',
			htmlCopiedDesc: 'Código fuente listo para clientes compatibles con HTML directo.',
			downloadStarted: '¡Descarga iniciada!',
			downloadStartedDesc: 'El archivo .html se ha guardado en tu equipo.',
			confirmClear: '¿Seguro que deseas limpiar todos los campos del formulario?',
		},
		exportDoc: {
			titleSuffix: 'Firma de Correo',
			defaultTitle: 'Firma de Correo',
			generatorComment: 'Generado por gabrielcampos.dev/es/herramientas/generador-de-firma-de-correo',
		},
		defaultData: {
			fullName: 'Gabriel Campos',
			jobTitle: 'Ingeniero de Software y Arquitecto Web',
			department: 'Ingeniería de Producto',
			email: 'contacto@gabrielcampos.dev',
			phone: '+34 910 000 000',
			mobilePhone: '+34 600 000 000',
			companyName: 'Gabriel Campos Tech',
			website: 'https://gabrielcampos.dev/es/',
			address: 'Madrid, España',
			linkedin: 'https://www.linkedin.com/in/gbrlcm',
			instagram: 'https://www.instagram.com/gbrlcm',
			facebook: '',
			whatsapp: '+34 600 000 000',
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
			ctaText: 'Ver Portafolio',
			ctaUrl: 'https://gabrielcampos.dev/es/',
			disclaimer:
				'Este mensaje puede contener información confidencial. Si no eres el destinatario indicado, por favor notifícalo al remitente y elimina este correo.',
		},
		fonts: [
			{ id: 'Arial, Helvetica, sans-serif', label: 'Arial / Helvetica (Estándar universal)' },
			{ id: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
			{ id: 'Georgia, serif', label: 'Georgia (Elegante con serifa)' },
			{ id: 'Verdana, Geneva, sans-serif', label: 'Verdana (Alta legibilidad)' },
			{ id: "'Trebuchet MS', Helvetica, sans-serif", label: 'Trebuchet MS (Moderno)' },
			{ id: 'Tahoma, Geneva, sans-serif', label: 'Tahoma (Compacto)' },
			{ id: "'Times New Roman', Times, serif", label: 'Times New Roman (Clásico tradicional)' },
			{ id: "'Lucida Console', Monaco, monospace", label: 'Lucida Console (Mono / Técnico)' },
		],
		primaryColors: [
			{ hex: '#0d251a', label: 'Verde Bosque GC (Marca)' },
			{ hex: '#1e3a8a', label: 'Azul Marino Corporativo' },
			{ hex: '#0f766e', label: 'Esmeralda Sofisticado' },
			{ hex: '#3730a3', label: 'Índigo Ejecutivo' },
			{ hex: '#18181b', label: 'Grafito Carbón' },
			{ hex: '#831843', label: 'Vino Tinto' },
			{ hex: '#9a3412', label: 'Terracota' },
			{ hex: '#4338ca', label: 'Cobalto' },
		],
		textColors: [
			{ hex: '#222222', label: 'Negro Suave' },
			{ hex: '#374151', label: 'Gris Oscuro' },
			{ hex: '#111827', label: 'Carbón Profundo' },
			{ hex: '#47554e', label: 'Gris Plomo GC' },
		],
		linkColors: [
			{ hex: '#0d251a', label: 'Mismo de la Marca' },
			{ hex: '#1e40af', label: 'Azul Tradicional' },
			{ hex: '#0284c7', label: 'Azul Celeste' },
			{ hex: '#047857', label: 'Verde Bosque' },
		],
	},
};
