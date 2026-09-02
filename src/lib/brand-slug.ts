/**
 * Lo slug sta nell'URL, quindi due brand con lo stesso nome non possono collidere: il suffisso
 * casuale è più semplice di un contatore, e non richiede di interrogare il database per sapere
 * quale numero è libero.
 */
export function createBrandSlug(name: string): string {
	const base =
		name
			.toLowerCase()
			.normalize('NFD')
			.replace(/[̀-ͯ]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '')
			.slice(0, 40) || 'brand';

	return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
