-- Una scansione che trova zero conversazioni e una in cui ogni sorgente ha fallito si scrivevano
-- allo stesso modo: `items_found = 0`. In coda diventavano la stessa frase — "il silenzio è una
-- risposta valida" — mentre nel secondo caso lo scanner era semplicemente rotto.
--
-- È lo stesso guasto che i commenti di leads-core raccontano (un successo pulito e vuoto,
-- indistinguibile da una giornata tranquilla), qui alla scala della telemetria.

alter table radar_searches add column sources_failed integer not null default 0;
alter table radar_searches add column last_error text;
