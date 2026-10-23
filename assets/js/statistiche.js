/* Statistiche dei negozi clienti (dal 22 ottobre 2026): nelle copie dei clienti, alla prima apertura della dashboard
   della giornata, spedisce a STORE // CRAFT (Supabase, supabase/schema.sql) i dati di utilizzo del negozio:
   - i fogli stampati di cartelli, cartellini e promo, dalla Cronologia di Stampa (cronologia-stampa.js): nome, titolo,
     pagina, tipo, misure, orientamento, quante volte e quando (anche giorno per giorno);
   - le etichette DYMO stampate, dalla cronologia DYMO (cronologia-dymo.js): layout, stampe e copie;
   - la versione di STORE // CRAFT della copia.
   Niente immagini dei fogli stampati (decisione del 22 ottobre 2026: occupavano spazio e non servono);
   - il backup dei loghi personali (loghi-personalizzati.js), solo quando la lista è cambiata.
   Mai la Bacheca. Parte solo se la copia ha il codice del negozio, scritto in installati.js:
     Negozi.installa(['luxury'], { statistiche: { luxury: '<codice>' } })
   Il codice permette solo di spedire i dati del proprio negozio (funzioni invia_statistiche e invia_backup_loghi);
   l'operatore li legge nella sezione Statistiche dell'area operatore (statistiche.html), dopo l'accesso.
   Una volta al giorno per browser (localStorage storecraft_statistiche_<negozio>); senza rete riprova alla prossima
   apertura. Mai da localhost né da file aperti da disco (prove), e mai una lista vuota di loghi personali.
   Statistiche.invia({ forza: true }) spedisce subito, anche in locale, per le prove. */
(() => {
  const SUPABASE = 'https://uzttznyyrhrqehejbxbf.supabase.co';
  const CHIAVE = 'sb_publishable_bBc9vT9fVRXFQIPevein4A_bewS5knI';   // chiave pubblica: permette solo le due funzioni

  const script = document.currentScript;
  const versioneFile = new URL(script.src).search;
  const ASSETS = new URL('../', script.src);
  const negozio = document.documentElement.dataset.negozio;
  const codice = window.Negozi?.codiceStatistiche?.(negozio) || null;
  const CHIAVE_GIORNO = `storecraft_statistiche_${negozio}`;
  const CHIAVE_LOGHI = `storecraft_statistiche_loghi_${negozio}`;

  const leggi = (chiave, riserva) => { try { return JSON.parse(localStorage.getItem(chiave)) ?? riserva; } catch { return riserva; } };
  const scrivi = (chiave, valore) => { try { localStorage.setItem(chiave, JSON.stringify(valore)); } catch { /* niente */ } };
  // fino al 22 ottobre 2026 ricordava i fogli già spediti con l'anteprima: la chiave non serve più
  try { localStorage.removeItem(`storecraft_statistiche_anteprime_${negozio}`); } catch { /* niente */ }
  const oggi = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Carica un modulo comune (stessa versione di questo file), se non c'è già
  function modulo(percorso, globale) {
    if (window[globale]) return Promise.resolve(window[globale]);
    return new Promise((ok, ko) => {
      const s = document.createElement('script');
      s.src = new URL(`${percorso}${versioneFile}`, ASSETS).href;
      s.onload = () => (window[globale] ? ok(window[globale]) : ko(new Error(`${globale} non disponibile`)));
      s.onerror = () => ko(new Error(`${percorso} non caricato`));
      document.head.append(s);
    });
  }

  async function impronta(testo) {
    if (!window.crypto?.subtle) return String(testo.length);
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(testo));
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function chiama(funzione, corpo) {
    const risposta = await fetch(`${SUPABASE}/rest/v1/rpc/${funzione}`, {
      method: 'POST',
      headers: { apikey: CHIAVE, Authorization: `Bearer ${CHIAVE}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo)
    });
    const dati = await risposta.json().catch(() => null);
    if (!risposta.ok) throw new Error(dati?.message || `errore ${risposta.status}`);
    return dati;
  }

  // Stampe di ogni giorno (dal 22 ottobre 2026 le cronologie le contano: giorni { 'AAAA-MM-GG': n }); le stampe
  // registrate prima, senza giorno, vanno sul giorno della prima stampa (un'approssimazione, solo per quelle)
  function giornoDi(ms) {
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function giorniStampe(s) {
    const giorni = { ...(s.giorni || {}) };
    const resto = (s.volte || 1) - Object.values(giorni).reduce((t, n) => t + n, 0);
    if (resto > 0) { const g = giornoDi(s.primaStampa || s.stampataIl); giorni[g] = (giorni[g] || 0) + resto; }
    return giorni;
  }
  function giorniDymo(e) {
    const giorni = JSON.parse(JSON.stringify(e.giorni || {}));
    const somma = Object.values(giorni).reduce((t, g) => ({ volte: t.volte + g.volte, copie: t.copie + g.copie }), { volte: 0, copie: 0 });
    const volte = (e.volte || 1) - somma.volte;
    const copie = (e.totaleCopie || e.copie || 1) - somma.copie;
    if (volte > 0 || copie > 0) {
      const g = giornoDi(e.primaStampa || e.stampataIl);
      giorni[g] = { volte: (giorni[g]?.volte || 0) + Math.max(0, volte), copie: (giorni[g]?.copie || 0) + Math.max(0, copie) };
    }
    return giorni;
  }

  // Raccoglie fogli ed etichette (solo i dati di stampa, senza immagini)
  async function raccogli() {
    const stampe = [];
    try {
      const cronologia = await modulo('js/cronologia-stampa.js', 'CronologiaStampa');
      for (const s of await cronologia.elenco()) {
        const chiave = s.impronta || `id-${s.primaStampa}-${s.id}`;
        const voce = {
          impronta: chiave,
          nome: (s.title || '').replace(/ · .*$/, '').replace(/ \/\/ .*$/, ''),
          titolo: s.title || '',
          tipo: s.tipo,
          pagina: s.page,
          mmLarghezza: s.mmWidth ? Math.round(s.mmWidth * 10) / 10 : null,
          mmAltezza: s.mmHeight ? Math.round(s.mmHeight * 10) / 10 : null,
          orientamento: s.orientation || null,
          volte: s.volte || 1,
          giorni: giorniStampe(s),
          primaStampa: s.primaStampa || s.stampataIl,
          stampataIl: s.stampataIl
        };
        stampe.push(voce);
      }
    } catch (errore) {
      console.warn('Statistiche: cronologia di stampa non letta.', errore);
    }
    const dymo = [];
    try {
      const cronologia = await modulo('js/cronologia-dymo.js', 'CronologiaDymo');
      for (const e of await cronologia.elenco()) {
        const voce = {
          impronta: e.impronta,
          layout: e.layout || 'senza-layout',
          nome: (e.nome || '').replace(/^\d+\.\s*/, ''),
          volte: e.volte || 1,
          copie: e.totaleCopie || e.copie || 1,
          giorni: giorniDymo(e),
          primaStampa: e.primaStampa || e.stampataIl,
          stampataIl: e.stampataIl
        };
        dymo.push(voce);
      }
    } catch (errore) {
      console.warn('Statistiche: cronologia DYMO non letta.', errore);
    }
    return { stampe, dymo };
  }

  // Backup dei loghi personali, solo se la lista è cambiata dall'ultimo invio, o se sul server c'è un backup diverso
  // da quello di questo browser (impronta data da invia_statistiche, dal 23 ottobre 2026: es. un backup falso spedito
  // con il codice del negozio, che così viene sostituito dal backup vero)
  async function inviaLoghi(improntaServer) {
    const loghi = await modulo('js/loghi-personalizzati.js', 'LoghiPersonalizzati');
    await loghi.pronto;
    const lista = loghi.elenco();
    // una lista vuota (browser nuovo, prova) non sostituisce mai il backup di un altro computer del negozio
    if (!lista.length) return { loghi: 'lista vuota, non spedita' };
    const firma = await impronta(JSON.stringify(lista.map(l => [l.id, l.name, l.data])));
    const suServer = improntaServer === undefined || improntaServer === firma;
    if (firma === leggi(CHIAVE_LOGHI, null) && suServer) return { loghi: 'invariati' };
    const backup = { version: 1, negozio, exportedAt: new Date().toISOString(), logos: lista };
    const esito = await chiama('invia_backup_loghi', { p_token: codice, p_backup: backup, p_impronta: firma });
    scrivi(CHIAVE_LOGHI, firma);
    return esito;
  }

  async function invia({ forza = false } = {}) {
    if (!codice) return { saltato: 'questa copia non ha il codice del negozio' };
    if (!forza && leggi(CHIAVE_GIORNO, null) === oggi()) return { saltato: 'già spedite oggi' };
    if (!navigator.onLine) return { saltato: 'senza rete' };
    const { stampe, dymo } = await raccogli();
    const versione = document.querySelector('.release-number')?.textContent?.trim() || window.Dashboard?.VERSIONE || '';
    const esito = await chiama('invia_statistiche', { p_token: codice, p_dati: { versione, stampe, dymo } });
    let loghi = null;
    try { loghi = await inviaLoghi(esito?.loghi_impronta); } catch (errore) { console.warn('Statistiche: backup dei loghi personali non spedito.', errore); }
    scrivi(CHIAVE_GIORNO, oggi());
    return { ...esito, loghi };
  }

  window.Statistiche = Object.freeze({ invia, attivo: Boolean(codice) });

  // Da solo, qualche secondo dopo l'apertura della dashboard, per non rallentarla; solo dal sito vero: una copia
  // provata in locale (localhost, file aperti da disco) non spedisce le stampe di prova ai clienti veri
  // (Statistiche.invia({ forza: true }) spedisce comunque, per le prove)
  const inLocale = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (codice && !inLocale) {
    setTimeout(() => {
      invia().catch(errore => console.warn('Statistiche non spedite: si riprova alla prossima apertura.', errore));
    }, 6000);
  }
})();
