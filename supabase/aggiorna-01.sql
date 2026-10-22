-- STORE // CRAFT · aggiornamento 1 (22 ottobre 2026): stampe ed etichette DYMO con i dettagli, l'anteprima e le
-- «vite» (vedi schema.sql). Da eseguire una volta sola, poi si riesegue schema.sql. Le due tabelle sono ancora vuote.
drop table if exists public.stampe, public.etichette_dymo cascade;
