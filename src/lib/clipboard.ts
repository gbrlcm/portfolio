/**
 * Único ponto que usa `document.execCommand('copy')`, API obsoleta mas ainda
 * necessária como fallback em contextos sem Clipboard API (HTTP, navegadores
 * antigos) e para copiar seleção rica (HTML) do DOM.
 */
export function execCopy(): boolean {
	const legacy = document as unknown as { execCommand(command: string): boolean };
	return legacy.execCommand('copy');
}

/** Copia texto puro usando Clipboard API quando possível, com fallback via textarea. */
export async function copyText(text: string): Promise<void> {
	if (navigator.clipboard && window.isSecureContext) {
		await navigator.clipboard.writeText(text);
		return;
	}
	const textArea = document.createElement('textarea');
	textArea.value = text;
	textArea.style.position = 'fixed';
	textArea.style.left = '-999999px';
	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();
	execCopy();
	textArea.remove();
}
