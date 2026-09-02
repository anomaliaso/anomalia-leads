/**
 * In che valuta mostrare i prezzi.
 *
 * Non è una conversione: `PLANS` porta due listini distinti, e questo decide solo quale far
 * vedere per primo. La scelta dell'utente vince sempre sul rilevamento.
 */
export type Currency = 'eur' | 'usd';

/**
 * Chi paga in euro, al 2026.
 *
 * I venti dell'area euro più la Bulgaria, entrata il 1º gennaio 2026. In coda i microstati che
 * usano l'euro per accordo (Andorra, Monaco, San Marino, Città del Vaticano) e i due che lo hanno
 * adottato unilateralmente (Montenegro, Kosovo): per un prezzo di listino contano come gli altri.
 *
 * Chi non è in lista vede i dollari. Non è una previsione sul futuro dell'euro, è il default meno
 * sbagliato per un prodotto venduto soprattutto a un pubblico anglofono.
 */
const EURO_COUNTRIES = new Set([
	'AT', 'BE', 'BG', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR',
	'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES',
	'AD', 'MC', 'SM', 'VA', 'ME', 'XK'
]);

export function currencyFor(country: string | null | undefined): Currency {
	return country && EURO_COUNTRIES.has(country.toUpperCase()) ? 'eur' : 'usd';
}

/**
 * Ripiego quando il paese non arriva — in sviluppo, o dietro a una rete che lo nasconde.
 *
 * `Intl` conosce la regione del browser, che è un'approssimazione: un italiano con il portatile in
 * inglese verrebbe letto come non-euro. Va bene, perché è solo il valore iniziale di uno switch
 * che l'utente può cambiare in un click.
 */
export function currencyFromBrowser(): Currency {
	try {
		const locale = new Intl.Locale(navigator.language);
		const region = locale.region ?? navigator.language.split('-')[1];
		return currencyFor(region);
	} catch {
		return 'usd';
	}
}
