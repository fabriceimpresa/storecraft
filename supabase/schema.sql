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
begin
  select id into v_negozio from negozi_clienti where token = p_token and attivo;
  if v_negozio is null then
    raise exception 'codice negozio non valido' using errcode = '28000';
  end if;
  if jsonb_array_length(coalesce(p_dati->'stampe', '[]')) > 2000 or jsonb_array_length(coalesce(p_dati->'dymo', '[]')) > 2000 then
    raise exception 'troppi dati in un invio';
  end if;

  insert into stampe as t (negozio_id, impronta, nome, titolo, tipo, pagina, mm_larghezza, mm_altezza, orientamento,
                           volte, vita_inizio, prima_stampa, stampata_il)
  select v_negozio, left(s->>'impronta', 80), left(coalesce(s->>'nome', ''), 200), left(s->>'titolo', 300),
         left(coalesce(s->>'tipo', ''), 30), left(s->>'pagina', 200),
         (s->>'mmLarghezza')::numeric, (s->>'mmAltezza')::numeric, left(s->>'orientamento', 20),
         greatest(1, coalesce((s->>'volte')::int, 1)),
         to_timestamp((s->>'primaStampa')::double precision / 1000), to_timestamp((s->>'primaStampa')::double precision / 1000),
         to_timestamp((s->>'stampataIl')::double precision / 1000)
  from jsonb_array_elements(coalesce(p_dati->'stampe', '[]')) s
  where coalesce(s->>'impronta', '') <> '' and s->>'stampataIl' is not null and s->>'primaStampa' is not null
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

  insert into etichette_dymo as t (negozio_id, impronta, layout, nome, volte, copie, vita_inizio, prima_stampa, stampata_il)
  select v_negozio, left(d->>'impronta', 80), left(d->>'layout', 60), left(d->>'nome', 120),
         greatest(1, coalesce((d->>'volte')::int, 1)), greatest(1, coalesce((d->>'copie')::int, 1)),
         to_timestamp((d->>'primaStampa')::double precision / 1000), to_timestamp((d->>'primaStampa')::double precision / 1000),
         to_timestamp((d->>'stampataIl')::double precision / 1000)
  from jsonb_array_elements(coalesce(p_dati->'dymo', '[]')) d
  where coalesce(d->>'impronta', '') <> '' and coalesce(d->>'layout', '') <> '' and d->>'stampataIl' is not null and d->>'primaStampa' is not null
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

  -- stampe di ogni giorno: il numero di un giorno nel browser può solo crescere (si tiene il più alto)
  insert into stampe_giorni as t (negozio_id, genere, impronta, giorno, volte)
  select v_negozio, 'foglio', left(s->>'impronta', 80), g.key::date, least(g.value::int, 100000)
  from jsonb_array_elements(coalesce(p_dati->'stampe', '[]')) s,
       jsonb_each_text(case when jsonb_typeof(s->'giorni') = 'object' then s->'giorni' else '{}'::jsonb end) g
  where coalesce(s->>'impronta', '') <> '' and g.key ~ '^\d{4}-\d{2}-\d{2}$' and g.value ~ '^\d{1,6}$'
  on conflict (negozio_id, genere, impronta, giorno) do update set volte = greatest(t.volte, excluded.volte);

  insert into stampe_giorni as t (negozio_id, genere, impronta, giorno, volte, copie)
  select v_negozio, 'dymo', left(d->>'impronta', 80), g.key::date,
         least(coalesce((g.value->>'volte')::int, 0), 100000), least(coalesce((g.value->>'copie')::int, 0), 1000000)
  from jsonb_array_elements(coalesce(p_dati->'dymo', '[]')) d,
       jsonb_each(case when jsonb_typeof(d->'giorni') = 'object' then d->'giorni' else '{}'::jsonb end) g
  where coalesce(d->>'impronta', '') <> '' and g.key ~ '^\d{4}-\d{2}-\d{2}$' and jsonb_typeof(g.value) = 'object'
    and coalesce(g.value->>'volte', '0') ~ '^\d{1,6}$' and coalesce(g.value->>'copie', '0') ~ '^\d{1,7}$'
  on conflict (negozio_id, genere, impronta, giorno) do update
    set volte = greatest(t.volte, excluded.volte), copie = greatest(t.copie, excluded.copie);

  update negozi_clienti set ultimo_invio = now(), versione = left(p_dati->>'versione', 40) where id = v_negozio;
  return jsonb_build_object('stampe', v_stampe, 'dymo', v_dymo);
end;
$$;

revoke all on function public.invia_statistiche(text, jsonb) from public;
grant execute on function public.invia_statistiche(text, jsonb) to anon, authenticated;

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

create or replace function public.invia_backup_loghi(p_token text, p_backup jsonb, p_impronta text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_negozio uuid;
  v_numero integer := jsonb_array_length(coalesce(p_backup->'logos', '[]'));
begin
  select id into v_negozio from negozi_clienti where token = p_token and attivo;
  if v_negozio is null then
    raise exception 'codice negozio non valido' using errcode = '28000';
  end if;
  if v_numero > 1000 or pg_column_size(p_backup) > 40000000 then
    raise exception 'backup troppo grande';
  end if;
  -- una lista vuota non sostituisce un backup con dei loghi (un computer nuovo del negozio, una prova)
  if v_numero = 0 and exists (select 1 from backup_loghi where negozio_id = v_negozio and numero > 0) then
    return jsonb_build_object('loghi', 0, 'saltato', true);
  end if;
  insert into backup_loghi (negozio_id, backup, numero, impronta, aggiornato_il)
  values (v_negozio, p_backup, v_numero, left(p_impronta, 80), now())
  on conflict (negozio_id) do update
    set backup = excluded.backup, numero = excluded.numero, impronta = excluded.impronta, aggiornato_il = now();
  return jsonb_build_object('loghi', v_numero);
end;
$$;

revoke all on function public.invia_backup_loghi(text, jsonb, text) from public;
grant execute on function public.invia_backup_loghi(text, jsonb, text) to anon, authenticated;

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
