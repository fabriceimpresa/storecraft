/* Statistiche dei negozi clienti (dal 22 ottobre 2026): nelle copie dei clienti, alla prima apertura della dashboard
   della giornata, spedisce a STORE // CRAFT (Supabase, supabase/schema.sql) i dati di utilizzo del negozio:
   - i fogli stampati di cartelli, cartellini e promo, dalla Cronologia di Stampa (cronologia-stampa.js): nome, titolo,
     pagina, tipo, misure, orientamento, quante volte e quando, e una piccola anteprima (JPEG 240 px, circa 10 KB),
     spedita una volta sola per foglio;
   - le etichette DYMO stampate, dalla cronologia DYMO (cronologia-dymo.js): layout, stampe, copie e l'anteprima;
   - il backup dei loghi personali (loghi-personalizzati.js), solo quando la lista è cambiata.
   Mai la Bacheca. Parte solo se la copia ha il codice del negozio, scritto in installati.js:
     Negozi.installa(['luxury'], { copiaCliente: true, statistiche: { luxury: '<codice>' } })
   Il codice permette solo di spedire i dati del proprio negozio (funzioni invia_statistiche e invia_backup_loghi);
   l'operatore li legge nella sezione Statistiche dell'area operatore (statistiche.html), dopo l'accesso.
   Una volta al giorno per browser (localStorage storecraft_statistiche_<negozio>); senza rete riprova alla prossima
   apertura. Statistiche.invia({ forza: true }) spedisce subito, per le prove. */
(() => {
  const SUPABASE = 'https://uzttznyyrhrqehejbxbf.supabase.co';
  const CHIAVE = 'sb_publishable_bBc9vT9fVRXFQIPevein4A_bewS5knI';   // chiave pubblica: permette solo le due funzioni
  const LARGHEZZA_ANTEPRIMA = 240;
  const MASSIMO_RICORDATE = 2000;

  const script = document.currentScript;
  const versioneFile = new URL(script.src).search;
  const ASSETS = new URL('../', script.src);
  const negozio = document.documentElement.dataset.negozio;
  const codice = window.Negozi?.codiceStatistiche?.(negozio) || null;
  const CHIAVE_GIORNO = `storecraft_statistiche_${negozio}`;
  const CHIAVE_ANTEPRIME = `storecraft_statistiche_anteprime_${negozio}`;
  const CHIAVE_LOGHI = `storecraft_statistiche_loghi_${negozio}`;

  const leggi = (chiave, riserva) => { try { return JSON.parse(localStorage.getItem(chiave)) ?? riserva; } catch { return riserva; } };
  const scrivi = (chiave, valore) => { try { localStorage.setItem(chiave, JSON.stringify(valore)); } catch { /* niente */ } };
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

  // Anteprima piccola in JPEG, su fondo bianco (le etichette DYMO sono PNG trasparenti)
  async function anteprima(sorgente) {
    try {
      const img = new Image();
      img.src = typeof sorgente === 'string' ? sorgente : URL.createObjectURL(sorgente);
      await img.decode();
      const scala = Math.min(1, LARGHEZZA_ANTEPRIMA / img.naturalWidth);
      const tela = document.createElement('canvas');
      tela.width = Math.max(1, Math.round(img.naturalWidth * scala));
      tela.height = Math.max(1, Math.round(img.naturalHeight * scala));
      const ctx = tela.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, tela.width, tela.height);
      ctx.drawImage(img, 0, 0, tela.width, tela.height);
      if (typeof sorgente !== 'string') URL.revokeObjectURL(img.src);
      return tela.toDataURL('image/jpeg', 0.72);
    } catch {
      return null;
    }
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

  // Raccoglie fogli ed etichette; l'anteprima solo per quelli mai spediti da questo browser
  async function raccogli() {
    const ricordate = new Set(leggi(CHIAVE_ANTEPRIME, []));
    const nuove = [];
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
          primaStampa: s.primaStampa || s.stampataIl,
          stampataIl: s.stampataIl
        };
        if (!ricordate.has(chiave) && s.thumb) {
          voce.anteprima = await anteprima(s.thumb);
          if (voce.anteprima) nuove.push(chiave);
        }
        stampe.push(voce);
      }
    } catch (errore) {
      console.warn('Statistiche: cronologia di stampa non letta.', errore);
    }
    const dymo = [];
    try {
      const cronologia = await modulo('js/cronologia-dymo.js', 'CronologiaDymo');
      for (const e of await cronologia.elenco()) {
        const chiave = `dymo-${e.impronta}`;
        const voce = {
          impronta: e.impronta,
          layout: e.layout || 'senza-layout',
          nome: (e.nome || '').replace(/^\d+\.\s*/, ''),
          volte: e.volte || 1,
          copie: e.totaleCopie || e.copie || 1,
          primaStampa: e.primaStampa || e.stampataIl,
          stampataIl: e.stampataIl
        };
        if (!ricordate.has(chiave) && e.png) {
          voce.anteprima = await anteprima(`data:image/png;base64,${e.png}`);
          if (voce.anteprima) nuove.push(chiave);
        }
        dymo.push(voce);
      }
    } catch (errore) {
      console.warn('Statistiche: cronologia DYMO non letta.', errore);
    }
    return { stampe, dymo, nuove, ricordate };
  }

  // Backup dei loghi personali, solo se la lista è cambiata dall'ultimo invio
  async function inviaLoghi() {
    const loghi = await modulo('js/loghi-personalizzati.js', 'LoghiPersonalizzati');
    await loghi.pronto;
    const lista = loghi.elenco();
    const firma = await impronta(JSON.stringify(lista.map(l => [l.id, l.name, l.data])));
    if (firma === leggi(CHIAVE_LOGHI, null)) return { loghi: 'invariati' };
    const backup = { version: 1, negozio, exportedAt: new Date().toISOString(), logos: lista };
    const esito = await chiama('invia_backup_loghi', { p_token: codice, p_backup: backup, p_impronta: firma });
    scrivi(CHIAVE_LOGHI, firma);
    return esito;
  }

  async function invia({ forza = false } = {}) {
    if (!codice) return { saltato: 'questa copia non ha il codice del negozio' };
    if (!forza && leggi(CHIAVE_GIORNO, null) === oggi()) return { saltato: 'già spedite oggi' };
    if (!navigator.onLine) return { saltato: 'senza rete' };
    const { stampe, dymo, nuove, ricordate } = await raccogli();
    const versione = document.querySelector('.release-number')?.textContent?.trim() || window.Dashboard?.VERSIONE || '';
    const esito = await chiama('invia_statistiche', { p_token: codice, p_dati: { versione, stampe, dymo } });
    nuove.forEach(chiave => ricordate.add(chiave));
    scrivi(CHIAVE_ANTEPRIME, [...ricordate].slice(-MASSIMO_RICORDATE));
    let loghi = null;
    try { loghi = await inviaLoghi(); } catch (errore) { console.warn('Statistiche: backup dei loghi personali non spedito.', errore); }
    scrivi(CHIAVE_GIORNO, oggi());
    return { ...esito, loghi };
  }

  window.Statistiche = Object.freeze({ invia, attivo: Boolean(codice) });

  // Da solo, qualche secondo dopo l'apertura della dashboard, per non rallentarla
  if (codice) {
    setTimeout(() => {
      invia().catch(errore => console.warn('Statistiche non spedite: si riprova alla prossima apertura.', errore));
    }, 6000);
  }
})();
