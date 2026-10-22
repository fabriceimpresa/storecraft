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
--   una piccola anteprima (JPEG 240 px, circa 10 KB, spedita una volta sola per foglio). Per le etichette DYMO:
--   layout, stampe, copie e una piccola anteprima. Niente Bacheca.

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
  anteprima text,                        -- data:image/jpeg;base64,… (240 px)
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
  anteprima text,                        -- data:image/jpeg;base64,… (240 px)
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

-- La copia del cliente spedisce le statistiche del suo negozio. p_dati:
-- { "versione": "V 1.2.63 2026",
--   "stampe": [ { "impronta", "nome", "titolo", "tipo", "pagina", "mmLarghezza", "mmAltezza", "orientamento",
--                 "anteprima", "volte", "primaStampa", "stampataIl" } ],
--   "dymo":   [ { "impronta", "layout", "nome", "anteprima", "volte", "copie", "primaStampa", "stampataIl" } ] }
-- (date in millisecondi, come nel browser; anteprima solo la prima volta che il foglio si spedisce)
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
                           anteprima, volte, vita_inizio, prima_stampa, stampata_il)
  select v_negozio, left(s->>'impronta', 80), left(coalesce(s->>'nome', ''), 200), left(s->>'titolo', 300),
         left(coalesce(s->>'tipo', ''), 30), left(s->>'pagina', 200),
         (s->>'mmLarghezza')::numeric, (s->>'mmAltezza')::numeric, left(s->>'orientamento', 20),
         case when length(s->>'anteprima') <= 60000 and left(s->>'anteprima', 23) = 'data:image/jpeg;base64,' then s->>'anteprima' end,
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
    anteprima = coalesce(t.anteprima, excluded.anteprima),
    nome = excluded.nome,
    titolo = excluded.titolo,
    tipo = excluded.tipo,
    pagina = excluded.pagina,
    mm_larghezza = excluded.mm_larghezza,
    mm_altezza = excluded.mm_altezza,
    orientamento = excluded.orientamento;
  get diagnostics v_stampe = row_count;

  insert into etichette_dymo as t (negozio_id, impronta, layout, nome, anteprima, volte, copie, vita_inizio, prima_stampa, stampata_il)
  select v_negozio, left(d->>'impronta', 80), left(d->>'layout', 60), left(d->>'nome', 120),
         case when length(d->>'anteprima') <= 60000 and left(d->>'anteprima', 23) = 'data:image/jpeg;base64,' then d->>'anteprima' end,
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
    anteprima = coalesce(t.anteprima, excluded.anteprima),
    layout = excluded.layout,
    nome = excluded.nome;
  get diagnostics v_dymo = row_count;

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
  insert into backup_loghi (negozio_id, backup, numero, impronta, aggiornato_il)
  values (v_negozio, p_backup, v_numero, left(p_impronta, 80), now())
  on conflict (negozio_id) do update
    set backup = excluded.backup, numero = excluded.numero, impronta = excluded.impronta, aggiornato_il = now();
  return jsonb_build_object('loghi', v_numero);
end;
$$;

revoke all on function public.invia_backup_loghi(text, jsonb, text) from public;
grant execute on function public.invia_backup_loghi(text, jsonb, text) to anon, authenticated;
