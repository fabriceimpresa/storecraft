-- STORE // CRAFT · aggiornamento 3 (22 ottobre 2026): solo dati di stampa, senza immagini (le colonne delle anteprime
-- si tolgono), e le stampe di ogni giorno per i conteggi esatti per periodo. Da incollare in Supabase › SQL Editor ›
-- New query › Run. Si può rieseguire (anche se era già stato eseguito nella sua prima versione): non perde i dati di
-- stampa. Lo stesso codice sta in schema.sql.

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

-- Le stampe arrivate prima di questo aggiornamento: tutte sul giorno della loro ultima stampa (un'approssimazione)
insert into public.stampe_giorni (negozio_id, genere, impronta, giorno, volte)
select s.negozio_id, 'foglio', s.impronta, (s.stampata_il at time zone 'Europe/Rome')::date, s.volte
from public.stampe s
where not exists (select 1 from public.stampe_giorni g where g.negozio_id = s.negozio_id and g.genere = 'foglio' and g.impronta = s.impronta)
on conflict do nothing;
insert into public.stampe_giorni (negozio_id, genere, impronta, giorno, volte, copie)
select d.negozio_id, 'dymo', d.impronta, (d.stampata_il at time zone 'Europe/Rome')::date, d.volte, d.copie
from public.etichette_dymo d
where not exists (select 1 from public.stampe_giorni g where g.negozio_id = d.negozio_id and g.genere = 'dymo' and g.impronta = d.impronta)
on conflict do nothing;
