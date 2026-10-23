-- STORE // CRAFT · statistiche delle stampe dei negozi clienti (Supabase, piano gratuito)
--
-- Da incollare in Supabase › SQL Editor › New query › Run (si può rieseguire: non cancella i dati).
--
-- Come funziona
-- - Ogni negozio di ogni copia cliente ha un codice segreto (token), scritto nella sua copia: con quel codice la
--   copia può solo SPEDIRE le statistiche del proprio negozio, attraverso la funzione invia_statistiche. Non può
--   leggere niente, né i dati degli altri negozi.
-- - Le tabelle sono chiuse a chi non ha fatto l'accesso (RLS senza regole per anon): la chiave pubblica della copia
--   (publishable / anon) serve solo a chiamare la funzione.
-- - L'operatore legge tutto dalla sezione Statistiche dell'area operatore, dopo l'accesso con email e password
--   (utente creato a mano in Authentication › Users; le iscrizioni libere sono spente).
-- - Per ogni foglio stampato (cartelli, cartellini, promo): nome, pagina, tipo, misure, quante volte e quando, e
--   le stampe di ogni giorno. Per le etichette DYMO: layout, stampe e copie. Niente immagini dei fogli stampati (dal
--   22 ottobre 2026: le anteprime sono state tolte, solo dati di stampa) e niente Bacheca.

-- Negozi clienti registrati dall'operatore
create table if not exists public.negozi_clienti (
  id uuid primary key default gen_random_uuid(),
  cliente text not null,                 -- es. «Luxury Outlet srl»
  negozio text not null,                 -- id del negozio nella copia: luxury, tebe, ophilya…
  nome text not null,                    -- nome mostrato: LUXURY OUTLET
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  attivo boolean not null default true,
  creato_il timestamptz not null default now(),
  ultimo_invio timestamptz,
  versione text,                         -- versione di STORE // CRAFT della copia all'ultimo invio
  note text
);

-- Fogli stampati (dalla Cronologia di Stampa) ed etichette DYMO (dalla cronologia DYMO): una riga per foglio o
-- etichetta diversi, riconosciuti dalla loro impronta. Nel browser la cronologia dura 7 giorni (DYMO 30): ristampato
-- dopo, lo stesso foglio ricomincia da capo con una «vita» nuova (prima stampa più recente). Così i conteggi non si
-- perdono: volte_prima tiene le stampe delle vite passate, vita_inizio la prima stampa della vita in corso, e
-- volte = volte_prima + le stampe della vita in corso.
create table if not exists public.stampe (
  id bigint generated always as identity primary key,
  negozio_id uuid not null references public.negozi_clienti(id) on delete cascade,
  impronta text not null,
  nome text not null,                    -- es. Cartello Semplice
  titolo text,                           -- titolo intero della pagina
  tipo text not null,                    -- cartelli, cartellini, promo
  pagina text,                           -- es. cartelli_semplici.html
  mm_larghezza numeric,
  mm_altezza numeric,
  orientamento text,                     -- portrait, landscape
  volte integer not null default 1,
  volte_prima integer not null default 0,
  vita_inizio timestamptz,
  prima_stampa timestamptz,
  stampata_il timestamptz not null,
  unique (negozio_id, impronta)
);

create table if not exists public.etichette_dymo (
  id bigint generated always as identity primary key,
  negozio_id uuid not null references public.negozi_clienti(id) on delete cascade,
  impronta text not null,
  layout text not null,                  -- es. outlet-doppio-prezzo
  nome text,                             -- nome del layout mostrato
  volte integer not null default 1,      -- stampe (invii alla DYMO o al browser)
  copie integer not null default 1,      -- etichette uscite in tutto
  volte_prima integer not null default 0,
  copie_prima integer not null default 0,
  vita_inizio timestamptz,
  prima_stampa timestamptz,
  stampata_il timestamptz not null,
  unique (negozio_id, impronta)
);

alter table public.negozi_clienti enable row level security;
alter table public.stampe enable row level security;
alter table public.etichette_dymo enable row level security;

-- Permessi espliciti (il progetto è creato con «Automatically expose new tables» spento): niente per anon, che
-- passa solo dalla funzione invia_statistiche; lettura per l'operatore, che gestisce anche i negozi clienti
revoke all on public.negozi_clienti, public.stampe, public.etichette_dymo from anon;
grant select, insert, update, delete on public.negozi_clienti to authenticated;
grant select, delete on public.stampe, public.etichette_dymo to authenticated;

drop policy if exists "operatore legge i negozi" on public.negozi_clienti;
create policy "operatore legge i negozi" on public.negozi_clienti for all to authenticated using (true) with check (true);
drop policy if exists "operatore legge le stampe" on public.stampe;
create policy "operatore legge le stampe" on public.stampe for select to authenticated using (true);
drop policy if exists "operatore cancella le stampe" on public.stampe;
create policy "operatore cancella le stampe" on public.stampe for delete to authenticated using (true);
drop policy if exists "operatore legge le dymo" on public.etichette_dymo;
create policy "operatore legge le dymo" on public.etichette_dymo for select to authenticated using (true);
drop policy if exists "operatore cancella le dymo" on public.etichette_dymo;
create policy "operatore cancella le dymo" on public.etichette_dymo for delete to authenticated using (true);

-- Le anteprime dei fogli e delle etichette (fino al 22 ottobre 2026) non servono più: le colonne si tolgono
alter table public.stampe drop column if exists anteprima;
alter table public.etichette_dymo drop column if exists anteprima;

-- Stampe di ogni giorno (dal 22 ottobre 2026): una riga per foglio (o etichetta DYMO) e per giorno, con le stampe di
-- quel giorno (le DYMO anche le copie). Senza anteprime: pesa pochissimo e rende esatti i conteggi per periodo.
-- Il giorno è quello del computer del negozio. Le stampe registrate prima di questo aggiornamento stanno sul giorno
-- della loro prima o ultima stampa (un'approssimazione, solo per quelle).
create table if not exists public.stampe_giorni (
  negozio_id uuid not null references public.negozi_clienti(id) on delete cascade,
  genere text not null check (genere in ('foglio', 'dymo')),
  impronta text not null,
  giorno date not null,
  volte integer not null default 0,
  copie integer not null default 0,
  primary key (negozio_id, genere, impronta, giorno)
);
alter table public.stampe_giorni enable row level security;
revoke all on public.stampe_giorni from anon;
grant select, delete on public.stampe_giorni to authenticated;
drop policy if exists "operatore legge i giorni" on public.stampe_giorni;
create policy "operatore legge i giorni" on public.stampe_giorni for select to authenticated using (true);
drop policy if exists "operatore cancella i giorni" on public.stampe_giorni;
create policy "operatore cancella i giorni" on public.stampe_giorni for delete to authenticated using (true);

-- La copia del cliente spedisce le statistiche del suo negozio. p_dati:
-- { "versione": "V 1.2.63 2026",
--   "stampe": [ { "impronta", "nome", "titolo", "tipo", "pagina", "mmLarghezza", "mmAltezza", "orientamento",
--                 "volte", "giorni": { "AAAA-MM-GG": n }, "primaStampa", "stampataIl" } ],
--   "dymo":   [ { "impronta", "layout", "nome", "volte", "copie",
--                 "giorni": { "AAAA-MM-GG": { "volte", "copie" } }, "primaStampa", "stampataIl" } ] }
-- (date in millisecondi, come nel browser; un'anteprima spedita dalle copie di prima si ignora)
-- (la funzione invia_statistiche, con i limiti e i controlli, sta in fondo: «Difese contro i dati falsi»)

-- Backup dei loghi personali (dal 22 ottobre 2026): l'ultima lista di ogni negozio, nel formato del backup di
-- Gestisci Lista ({ version, negozio, exportedAt, logos: [{ id, name, data }] }), spedita solo quando la lista cambia
-- (impronta). Una riga per negozio, sostituita a ogni invio.
create table if not exists public.backup_loghi (
  negozio_id uuid primary key references public.negozi_clienti(id) on delete cascade,
  backup jsonb not null,
  numero integer not null default 0,
  impronta text,
  aggiornato_il timestamptz not null default now()
);
alter table public.backup_loghi enable row level security;
revoke all on public.backup_loghi from anon;
grant select on public.backup_loghi to authenticated;
drop policy if exists "operatore legge i backup" on public.backup_loghi;
create policy "operatore legge i backup" on public.backup_loghi for select to authenticated using (true);

-- (la funzione invia_backup_loghi, con lo storico, sta in fondo: «Difese contro i dati falsi»)

-- Anagrafica dei clienti (dal 22 ottobre 2026; prima volta con aggiorna-02.sql)
create table if not exists public.clienti (
  id uuid primary key default gen_random_uuid(),
  numero integer generated by default as identity unique,  -- numero cliente STORE // CRAFT, progressivo
  registrato_il date not null default current_date,
  ragione_sociale text not null,
  sede_indirizzo text,                   -- sede legale
  sede_citta text,
  sede_provincia text,                   -- sigla: RM, MI…
  sede_cap text,
  partita_iva text,
  codice_sdi text,                       -- codice destinatario per la fattura elettronica
  pec text,                              -- legal mail
  negozio_indirizzo text,
  negozio_citta text,
  negozio_provincia text,
  contatto_nome text,                    -- contatto interno
  contatto_telefono text,
  note text,
  aggiornato_il timestamptz not null default now()
);
create unique index if not exists clienti_ragione_sociale on public.clienti (lower(ragione_sociale));

alter table public.negozi_clienti add column if not exists cliente_id uuid references public.clienti(id) on delete set null;

alter table public.clienti enable row level security;
revoke all on public.clienti from anon;
grant select, insert, update, delete on public.clienti to authenticated;
drop policy if exists "operatore gestisce i clienti" on public.clienti;
create policy "operatore gestisce i clienti" on public.clienti for all to authenticated using (true) with check (true);

-- Le prime schede: i clienti già registrati nelle statistiche che non hanno ancora una scheda
insert into public.clienti (ragione_sociale, registrato_il)
select n.cliente, min(n.creato_il)::date
from public.negozi_clienti n
where not exists (select 1 from public.clienti c where lower(c.ragione_sociale) = lower(n.cliente))
group by n.cliente
order by min(n.creato_il);

update public.negozi_clienti n set cliente_id = c.id
from public.clienti c
where n.cliente_id is null and lower(c.ragione_sociale) = lower(n.cliente);

-- Negozio registrato o cambiato: senza scheda si collega a quella con la stessa ragione sociale; con la scheda prende
-- la sua ragione sociale (così Statistiche e Prepara copia, che leggono negozi_clienti.cliente, restano allineate)
create or replace function public.negozio_segue_cliente() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.cliente_id is null then
    select id into new.cliente_id from clienti where lower(ragione_sociale) = lower(new.cliente);
  else
    select ragione_sociale into new.cliente from clienti where id = new.cliente_id;
  end if;
  return new;
end;
$$;
drop trigger if exists negozio_segue_cliente on public.negozi_clienti;
create trigger negozio_segue_cliente before insert or update of cliente, cliente_id on public.negozi_clienti
  for each row execute function public.negozio_segue_cliente();

-- Ragione sociale cambiata nella scheda: la prendono anche i suoi negozi
create or replace function public.cliente_rinominato() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.ragione_sociale is distinct from old.ragione_sociale then
    update negozi_clienti set cliente = new.ragione_sociale where cliente_id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists cliente_rinominato on public.clienti;
create trigger cliente_rinominato after update of ragione_sociale on public.clienti
  for each row execute function public.cliente_rinominato();

-- Difese contro i dati falsi (dal 23 ottobre 2026; prima volta con aggiorna-04.sql): limiti di invio, controlli di
-- plausibilità, storico dei backup dei loghi e impronta del backup restituita alla copia
-- 1. Registro degli invii, per i limiti (si tengono solo gli ultimi 7 giorni)
create table if not exists public.invii_registro (
  id bigint generated always as identity primary key,
  negozio_id uuid not null references public.negozi_clienti(id) on delete cascade,
  genere text not null check (genere in ('statistiche', 'loghi')),
  il timestamptz not null default now()
);
create index if not exists invii_registro_negozio on public.invii_registro (negozio_id, genere, il);
alter table public.invii_registro enable row level security;
revoke all on public.invii_registro from anon;
grant select on public.invii_registro to authenticated;
drop policy if exists "operatore legge gli invii" on public.invii_registro;
create policy "operatore legge gli invii" on public.invii_registro for select to authenticated using (true);

-- Conta gli invii delle ultime 24 ore e, se c'è posto, registra questo; altrimenti rifiuta
create or replace function public.registra_invio(p_negozio uuid, p_genere text, p_massimo integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from invii_registro where negozio_id = p_negozio and il < now() - interval '7 days';
  if (select count(*) from invii_registro where negozio_id = p_negozio and genere = p_genere and il > now() - interval '1 day') >= p_massimo then
    raise exception 'troppi invii oggi' using errcode = '54000';
  end if;
  insert into invii_registro (negozio_id, genere) values (p_negozio, p_genere);
end;
$$;
revoke all on function public.registra_invio(uuid, text, integer) from public, anon, authenticated;

-- Un giorno AAAA-MM-GG dal 2026 a domani, oppure null (una data sbagliata non deve fermare tutto l'invio)
create or replace function public.giorno_valido(p_testo text)
returns date
language plpgsql
stable
as $$
declare
  v date;
begin
  if p_testo !~ '^\d{4}-\d{2}-\d{2}$' then return null; end if;
  v := p_testo::date;
  return case when v between date '2026-01-01' and current_date + 1 then v end;
exception when others then
  return null;
end;
$$;
revoke all on function public.giorno_valido(text) from public, anon, authenticated;

-- 2. Statistiche con i limiti e i controlli
create or replace function public.invia_statistiche(p_token text, p_dati jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_negozio uuid;
  v_stampe integer := 0;
  v_dymo integer := 0;
  v_da constant timestamptz := '2026-01-01';
  v_a constant timestamptz := now() + interval '1 day';
  v_impronta text;
begin
  select id into v_negozio from negozi_clienti where token = p_token and attivo;
  if v_negozio is null then
    raise exception 'codice negozio non valido' using errcode = '28000';
  end if;
  if jsonb_typeof(coalesce(p_dati->'stampe', '[]')) <> 'array' or jsonb_typeof(coalesce(p_dati->'dymo', '[]')) <> 'array'
     or jsonb_array_length(coalesce(p_dati->'stampe', '[]')) > 1000 or jsonb_array_length(coalesce(p_dati->'dymo', '[]')) > 1000 then
    raise exception 'troppi dati in un invio';
  end if;
  perform registra_invio(v_negozio, 'statistiche', 20);

  -- solo le righe plausibili: impronta, tipo, date nel 2026 e non nel futuro, stampe e misure possibili
  create temp table _stampe on commit drop as
  select left(s->>'impronta', 80) as impronta, left(coalesce(s->>'nome', ''), 200) as nome, left(s->>'titolo', 300) as titolo,
         s->>'tipo' as tipo, left(s->>'pagina', 200) as pagina,
         case when s->>'mmLarghezza' ~ '^\d{1,3}(\.\d+)?$' then (s->>'mmLarghezza')::numeric end as mm_larghezza,
         case when s->>'mmAltezza' ~ '^\d{1,3}(\.\d+)?$' then (s->>'mmAltezza')::numeric end as mm_altezza,
         case when s->>'orientamento' in ('portrait', 'landscape') then s->>'orientamento' end as orientamento,
         coalesce(s->>'volte', '1')::int as volte,
         to_timestamp((s->>'primaStampa')::double precision / 1000) as prima_stampa,
         to_timestamp((s->>'stampataIl')::double precision / 1000) as stampata_il,
         case when jsonb_typeof(s->'giorni') = 'object' then s->'giorni' else '{}'::jsonb end as giorni
  from jsonb_array_elements(coalesce(p_dati->'stampe', '[]')) s
  where jsonb_typeof(s) = 'object'
    and coalesce(s->>'impronta', '') ~ '^[A-Za-z0-9-]{1,80}$'
    and s->>'tipo' in ('cartelli', 'cartellini', 'promo')
    and coalesce(s->>'volte', '1') ~ '^\d{1,4}$'
    and coalesce(s->>'primaStampa', '') ~ '^\d{12,14}(\.\d+)?$' and coalesce(s->>'stampataIl', '') ~ '^\d{12,14}(\.\d+)?$';
  delete from _stampe
  where volte < 1 or volte > 5000
     or prima_stampa < v_da or stampata_il > v_a or prima_stampa > stampata_il
     or (mm_larghezza is not null and (mm_larghezza < 20 or mm_larghezza > 600))
     or (mm_altezza is not null and (mm_altezza < 20 or mm_altezza > 600));

  insert into stampe as t (negozio_id, impronta, nome, titolo, tipo, pagina, mm_larghezza, mm_altezza, orientamento,
                           volte, vita_inizio, prima_stampa, stampata_il)
  select v_negozio, impronta, nome, titolo, tipo, pagina, mm_larghezza, mm_altezza, orientamento,
         volte, prima_stampa, prima_stampa, stampata_il
  from _stampe
  on conflict (negozio_id, impronta) do update set
    -- vita nuova (il foglio era uscito dalla cronologia del browser): le stampe di prima restano
    volte_prima = case when excluded.vita_inizio > t.vita_inizio then t.volte else t.volte_prima end,
    volte = case when excluded.vita_inizio > t.vita_inizio then t.volte + excluded.volte
                 else t.volte_prima + greatest(excluded.volte, t.volte - t.volte_prima) end,
    vita_inizio = greatest(t.vita_inizio, excluded.vita_inizio),
    prima_stampa = least(t.prima_stampa, excluded.prima_stampa),
    stampata_il = greatest(t.stampata_il, excluded.stampata_il),
    nome = excluded.nome,
    titolo = excluded.titolo,
    tipo = excluded.tipo,
    pagina = excluded.pagina,
    mm_larghezza = excluded.mm_larghezza,
    mm_altezza = excluded.mm_altezza,
    orientamento = excluded.orientamento;
  get diagnostics v_stampe = row_count;

  create temp table _dymo on commit drop as
  select left(d->>'impronta', 80) as impronta, d->>'layout' as layout, left(d->>'nome', 120) as nome,
         coalesce(d->>'volte', '1')::int as volte, coalesce(d->>'copie', '1')::int as copie,
         to_timestamp((d->>'primaStampa')::double precision / 1000) as prima_stampa,
         to_timestamp((d->>'stampataIl')::double precision / 1000) as stampata_il,
         case when jsonb_typeof(d->'giorni') = 'object' then d->'giorni' else '{}'::jsonb end as giorni
  from jsonb_array_elements(coalesce(p_dati->'dymo', '[]')) d
  where jsonb_typeof(d) = 'object'
    and coalesce(d->>'impronta', '') ~ '^[A-Za-z0-9-]{1,80}$'
    and coalesce(d->>'layout', '') ~ '^[A-Za-z0-9_-]{1,60}$'
    and coalesce(d->>'volte', '1') ~ '^\d{1,4}$' and coalesce(d->>'copie', '1') ~ '^\d{1,5}$'
    and coalesce(d->>'primaStampa', '') ~ '^\d{12,14}(\.\d+)?$' and coalesce(d->>'stampataIl', '') ~ '^\d{12,14}(\.\d+)?$';
  delete from _dymo
  where volte < 1 or volte > 5000 or copie < 1 or copie > 50000
     or prima_stampa < v_da or stampata_il > v_a or prima_stampa > stampata_il;

  insert into etichette_dymo as t (negozio_id, impronta, layout, nome, volte, copie, vita_inizio, prima_stampa, stampata_il)
  select v_negozio, impronta, layout, nome, volte, copie, prima_stampa, prima_stampa, stampata_il
  from _dymo
  on conflict (negozio_id, impronta) do update set
    volte_prima = case when excluded.vita_inizio > t.vita_inizio then t.volte else t.volte_prima end,
    copie_prima = case when excluded.vita_inizio > t.vita_inizio then t.copie else t.copie_prima end,
    volte = case when excluded.vita_inizio > t.vita_inizio then t.volte + excluded.volte
                 else t.volte_prima + greatest(excluded.volte, t.volte - t.volte_prima) end,
    copie = case when excluded.vita_inizio > t.vita_inizio then t.copie + excluded.copie
                 else t.copie_prima + greatest(excluded.copie, t.copie - t.copie_prima) end,
    vita_inizio = greatest(t.vita_inizio, excluded.vita_inizio),
    prima_stampa = least(t.prima_stampa, excluded.prima_stampa),
    stampata_il = greatest(t.stampata_il, excluded.stampata_il),
    layout = excluded.layout,
    nome = excluded.nome;
  get diagnostics v_dymo = row_count;

  -- stampe di ogni giorno, solo dei fogli e delle etichette accettati e solo per i giorni plausibili (dal 2026 a
  -- domani, al massimo 2000 stampe e 20000 etichette in un giorno): il numero di un giorno può solo crescere
  insert into stampe_giorni as t (negozio_id, genere, impronta, giorno, volte)
  select v_negozio, 'foglio', impronta, giorno, volte from (
    select s.impronta, giorno_valido(g.key) as giorno,
           case when g.value ~ '^\d{1,4}$' then g.value::int end as volte
    from _stampe s, jsonb_each_text(s.giorni) g
  ) x
  where giorno is not null and volte between 0 and 2000
  on conflict (negozio_id, genere, impronta, giorno) do update set volte = greatest(t.volte, excluded.volte);

  insert into stampe_giorni as t (negozio_id, genere, impronta, giorno, volte, copie)
  select v_negozio, 'dymo', impronta, giorno, volte, copie from (
    select d.impronta, giorno_valido(g.key) as giorno,
           case when jsonb_typeof(g.value) = 'object' and coalesce(g.value->>'volte', '0') ~ '^\d{1,4}$'
                then coalesce((g.value->>'volte')::int, 0) end as volte,
           case when jsonb_typeof(g.value) = 'object' and coalesce(g.value->>'copie', '0') ~ '^\d{1,5}$'
                then coalesce((g.value->>'copie')::int, 0) end as copie
    from _dymo d, jsonb_each(d.giorni) g
  ) x
  where giorno is not null and volte between 0 and 2000 and copie between 0 and 20000
  on conflict (negozio_id, genere, impronta, giorno) do update
    set volte = greatest(t.volte, excluded.volte), copie = greatest(t.copie, excluded.copie);

  update negozi_clienti set ultimo_invio = now(), versione = left(p_dati->>'versione', 40) where id = v_negozio;
  select impronta into v_impronta from backup_loghi where negozio_id = v_negozio;
  return jsonb_build_object('stampe', v_stampe, 'dymo', v_dymo, 'loghi_impronta', v_impronta);
end;
$$;

revoke all on function public.invia_statistiche(text, jsonb) from public;
grant execute on function public.invia_statistiche(text, jsonb) to anon, authenticated;

-- 3. Storico dei backup dei loghi personali: gli ultimi 5 per negozio (il più recente è anche in backup_loghi)
create table if not exists public.backup_loghi_storico (
  id bigint generated always as identity primary key,
  negozio_id uuid not null references public.negozi_clienti(id) on delete cascade,
  backup jsonb not null,
  numero integer not null default 0,
  impronta text,
  arrivato_il timestamptz not null default now()
);
create index if not exists backup_loghi_storico_negozio on public.backup_loghi_storico (negozio_id, arrivato_il desc);
alter table public.backup_loghi_storico enable row level security;
revoke all on public.backup_loghi_storico from anon;
grant select on public.backup_loghi_storico to authenticated;
drop policy if exists "operatore legge lo storico dei backup" on public.backup_loghi_storico;
create policy "operatore legge lo storico dei backup" on public.backup_loghi_storico for select to authenticated using (true);

-- il backup di oggi entra anche nello storico (una volta sola)
insert into public.backup_loghi_storico (negozio_id, backup, numero, impronta, arrivato_il)
select b.negozio_id, b.backup, b.numero, b.impronta, b.aggiornato_il from public.backup_loghi b
where not exists (select 1 from public.backup_loghi_storico s where s.negozio_id = b.negozio_id);

create or replace function public.invia_backup_loghi(p_token text, p_backup jsonb, p_impronta text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_negozio uuid;
  v_numero integer;
begin
  select id into v_negozio from negozi_clienti where token = p_token and attivo;
  if v_negozio is null then
    raise exception 'codice negozio non valido' using errcode = '28000';
  end if;
  if jsonb_typeof(p_backup) <> 'object' or jsonb_typeof(p_backup->'logos') <> 'array' then
    raise exception 'backup non valido';
  end if;
  v_numero := jsonb_array_length(p_backup->'logos');
  if v_numero > 300 or pg_column_size(p_backup) > 15000000 then
    raise exception 'backup troppo grande';
  end if;
  -- ogni logo: un id, un nome breve e un'immagine (data:image/…), nient'altro
  if exists (select 1 from jsonb_array_elements(p_backup->'logos') l
             where jsonb_typeof(l) <> 'object' or length(coalesce(l->>'id', '')) not between 1 and 80
                or length(coalesce(l->>'name', '')) > 80 or coalesce(l->>'data', '') !~ '^data:image/(png|jpeg|webp|gif);base64,') then
    raise exception 'backup non valido';
  end if;
  -- una lista vuota non sostituisce un backup con dei loghi (un computer nuovo del negozio, una prova)
  if v_numero = 0 and exists (select 1 from backup_loghi where negozio_id = v_negozio and numero > 0) then
    return jsonb_build_object('loghi', 0, 'saltato', true);
  end if;
  -- lo stesso backup già arrivato non si ripete
  if exists (select 1 from backup_loghi where negozio_id = v_negozio and impronta = left(p_impronta, 80)) then
    return jsonb_build_object('loghi', v_numero, 'invariato', true);
  end if;
  perform registra_invio(v_negozio, 'loghi', 3);

  insert into backup_loghi (negozio_id, backup, numero, impronta, aggiornato_il)
  values (v_negozio, p_backup, v_numero, left(p_impronta, 80), now())
  on conflict (negozio_id) do update
    set backup = excluded.backup, numero = excluded.numero, impronta = excluded.impronta, aggiornato_il = now();
  insert into backup_loghi_storico (negozio_id, backup, numero, impronta) values (v_negozio, p_backup, v_numero, left(p_impronta, 80));
  delete from backup_loghi_storico where negozio_id = v_negozio and id not in
    (select id from backup_loghi_storico where negozio_id = v_negozio order by arrivato_il desc, id desc limit 5);
  return jsonb_build_object('loghi', v_numero);
end;
$$;

revoke all on function public.invia_backup_loghi(text, jsonb, text) from public;
grant execute on function public.invia_backup_loghi(text, jsonb, text) to anon, authenticated;
