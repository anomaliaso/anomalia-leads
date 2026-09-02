-- Il webhook per brand: dopo uno scan che produce bozze, un ping invece di un polling.
--
-- Il segreto NON è hashato come `api_key_hash`: serve in chiaro per firmare l'HMAC ad ogni
-- consegna, non solo per un confronto in fase di login. La minaccia è diversa da quella della API
-- key — chi già ha `api_key_hash` (cioè la chiave `alk_...`) può leggere la coda direttamente, quindi
-- vedere anche il segreto del webhook non gli dà nulla che non abbia già.

alter table brands add column webhook_url text;
alter table brands add column webhook_secret text;
