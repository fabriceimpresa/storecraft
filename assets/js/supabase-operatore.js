/* Accesso dell'operatore a Supabase (dal 22 ottobre 2026), comune alla sezione Statistiche (statistiche.html) e a
   Prepara copia per un cliente (operatore.html): email e password dell'utente creato in Supabase › Authentication, la
   sessione resta nel browser (localStorage storecraft_operatore_supabase) finché non si esce, e si rinnova da sola.
   Solo per l'area operatore del progetto madre: le copie dei clienti spediscono con statistiche.js, senza accesso.
     SupabaseOperatore.dentro            true con una sessione salvata
     SupabaseOperatore.email             email dell'operatore
     SupabaseOperatore.accedi(email, password)
     SupabaseOperatore.esci()
     SupabaseOperatore.api(percorso, { metodo, corpo, prefer })   richiesta alle tabelle (rest/v1/<percorso>)
   Evento «supabase-operatore» su window quando si entra o si esce (anche da un'altra scheda). */
(() => {
  const SUPABASE = 'https://uzttznyyrhrqehejbxbf.supabase.co';
  const CHIAVE = 'sb_publishable_bBc9vT9fVRXFQIPevein4A_bewS5knI';
  const SESSIONE = 'storecraft_operatore_supabase';
  let sessione = null;
  try { sessione = JSON.parse(localStorage.getItem(SESSIONE)); } catch { sessione = null; }

  const avvisa = () => window.dispatchEvent(new Event('supabase-operatore'));
  function salva(s) {
    sessione = s ? { access_token: s.access_token, refresh_token: s.refresh_token, scade: Date.now() + (s.expires_in || 3600) * 1000,
      email: s.user?.email || sessione?.email } : null;
    try { sessione ? localStorage.setItem(SESSIONE, JSON.stringify(sessione)) : localStorage.removeItem(SESSIONE); } catch { /* niente */ }
  }
  window.addEventListener('storage', evento => {
    if (evento.key !== SESSIONE) return;
    try { sessione = JSON.parse(evento.newValue); } catch { sessione = null; }
    avvisa();
  });

  async function auth(tipo, corpo) {
    const risposta = await fetch(`${SUPABASE}/auth/v1/token?grant_type=${tipo}`, {
      method: 'POST', headers: { apikey: CHIAVE, 'Content-Type': 'application/json' }, body: JSON.stringify(corpo)
    });
    const dati = await risposta.json().catch(() => ({}));
    if (!risposta.ok) throw new Error(dati.error_description || dati.msg || dati.message || `errore ${risposta.status}`);
    return dati;
  }
  async function token() {
    if (!sessione) throw new Error('accesso richiesto');
    if (Date.now() > sessione.scade - 60000) {
      try { salva(await auth('refresh_token', { refresh_token: sessione.refresh_token })); }
      catch (errore) { salva(null); avvisa(); throw new Error('accesso scaduto: accedi di nuovo'); }
    }
    return sessione.access_token;
  }

  async function api(percorso, { metodo = 'GET', corpo, prefer } = {}) {
    const intestazioni = { apikey: CHIAVE, Authorization: `Bearer ${await token()}` };
    if (corpo) intestazioni['Content-Type'] = 'application/json';
    if (prefer) intestazioni.Prefer = prefer;
    const risposta = await fetch(`${SUPABASE}/rest/v1/${percorso}`, { method: metodo, headers: intestazioni, body: corpo ? JSON.stringify(corpo) : undefined });
    if (risposta.status === 401) { salva(null); avvisa(); throw new Error('accesso scaduto: accedi di nuovo'); }
    const dati = risposta.status === 204 ? null : await risposta.json().catch(() => null);
    if (!risposta.ok) throw new Error(dati?.message || `errore ${risposta.status}`);
    return dati;
  }

  window.SupabaseOperatore = Object.freeze({
    get dentro() { return Boolean(sessione); },
    get email() { return sessione?.email || ''; },
    async accedi(email, password) { salva(await auth('password', { email, password })); avvisa(); },
    esci() { salva(null); avvisa(); },
    api
  });
})();
