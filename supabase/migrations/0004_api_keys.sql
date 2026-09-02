-- Una API key per brand, non per utente: coerente col resto del modello, dove il tenant è il
-- brand e non l'account. Si salva solo l'hash — la chiave in chiaro si vede una volta sola, alla
-- generazione, esattamente come un token OAuth.

alter table brands add column api_key_hash text unique;
alter table brands add column api_key_prefix text;
