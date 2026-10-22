/* Cronologia di stampa delle etichette DYMO (dal 22 ottobre 2026), comune alle pagine delle etichette dei negozi.
   È a parte dalla cronologia di cartelli e cartellini (cronologia-stampa.js) e non ha a che fare con la lista di stampa:
   si apre dentro la pagina delle etichette (pulsante «Cronologia di Stampa» al posto di «Torna al Dashboard»), così le
   etichette si ristampano con la stampante DYMO della pagina.

   Ogni etichetta stampata entra da sola: l'immagine a 300 dpi che va alla DYMO (PNG in base64) e il documento di stampa
   del browser (per ristampare quando la DYMO non risponde), con il layout, l'ora e le copie. La stessa etichetta
   ristampata identica (stessa immagine) non si salva due volte: si aggiornano data, numero di stampe e copie.
   Restano gli ultimi 30 giorni (DURATA). IndexedDB, un database per negozio: il nome della cronologia di stampa del
   negozio con «dymo» al posto di «stampa» (storecraft-cronologia-dymo, tebe-cronologia-dymo, ophilya-cronologia-dymo).

   Uso dalla pagina:
     CronologiaDymo.collega({ trovaStampante, statoStampante })   la stampante della pagina (checkDymoPresence, setDymoStatus)
     CronologiaDymo.registra({ png, html, layout, nome, copie })   dopo ogni stampa
     CronologiaDymo.apri()                                         apre la cronologia
   Nella cronologia: le etichette per giorno, un clic le seleziona; per ognuna selezionata il numero di copie (1–99);
   RISTAMPA manda tutte le selezionate alla DYMO (o, senza DYMO, alla stampa del browser, una alla volta). */
(() => {
  const DURATA = 30 * 24 * 60 * 60 * 1000;
  const negozio = document.documentElement.dataset.negozio || 'luxury';
  const scheda = window.Negozi?.scheda?.(negozio);
  const NOME_DB = scheda?.cronologiaStampa ? scheda.cronologiaStampa.replace(/stampa$/, 'dymo') : `${negozio}-cronologia-dymo`;
  const ARCHIVIO = 'etichette';
  let collegamento = { trovaStampante: null, statoStampante: null };

  // ----- Archivio -----
  let database = null;
  function apriDatabase() {
    if (database) return Promise.resolve(database);
    return new Promise((ok, ko) => {
      const apertura = indexedDB.open(NOME_DB, 1);
      apertura.onupgradeneeded = () => apertura.result.createObjectStore(ARCHIVIO, { keyPath: 'id' });
      apertura.onsuccess = () => { database = apertura.result; ok(database); };
      apertura.onerror = () => ko(apertura.error);
    });
  }
  async function operazione(modo, fa) {
    const db = await apriDatabase();
    return new Promise((ok, ko) => {
      const transazione = db.transaction(ARCHIVIO, modo);
      const risultato = fa(transazione.objectStore(ARCHIVIO));
      transazione.oncomplete = () => ok(risultato?.result);
      transazione.onerror = () => ko(transazione.error);
    });
  }
  // impronta dell'immagine (FNV-1a a 32 bit sul base64): basta per riconoscere la stessa etichetta
  function impronta(testo) {
    let h = 0x811c9dc5;
    for (let i = 0; i < testo.length; i++) { h ^= testo.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(16);
  }
  async function elenco() {
    const tutte = (await operazione('readonly', archivio => archivio.getAll())) || [];
    const limite = Date.now() - DURATA;
    const scadute = tutte.filter(e => e.stampataIl < limite);
    if (scadute.length) await operazione('readwrite', archivio => scadute.forEach(e => archivio.delete(e.id)));
    return tutte.filter(e => e.stampataIl >= limite).sort((a, b) => b.stampataIl - a.stampataIl);
  }
  async function registra({ png = null, html = '', layout = '', nome = '', copie = 1 } = {}) {
    try {
      const chiave = png ? impronta(png) : impronta(html);
      const esistenti = await elenco();
      const uguale = esistenti.find(e => e.impronta === chiave);
      const ora = Date.now();
      // stampe e copie di ogni giorno (giorno locale AAAA-MM-GG), per le statistiche esatte per periodo
      const d = new Date(ora);
      const giorno = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const giorni = { ...(uguale?.giorni || {}) };
      giorni[giorno] = { volte: (giorni[giorno]?.volte || 0) + 1, copie: (giorni[giorno]?.copie || 0) + copie };
      const voce = uguale
        ? { ...uguale, stampataIl: ora, volte: (uguale.volte || 1) + 1, copie, totaleCopie: (uguale.totaleCopie || uguale.copie || 1) + copie, giorni }
        : { id: `${ora}-${Math.random().toString(36).slice(2, 8)}`, impronta: chiave, png, html, layout, nome, copie, totaleCopie: copie, volte: 1, primaStampa: ora, stampataIl: ora, giorni };
      await operazione('readwrite', archivio => archivio.put(voce));
      if (pannello && !pannello.hidden) carica();
    } catch (errore) {
      console.error('Etichetta non salvata nella cronologia DYMO.', errore);
    }
  }

  // ----- Finestra della cronologia -----
  const nodo = (tag, classe, testo) => {
    const n = document.createElement(tag);
    if (classe) n.className = classe;
    if (testo !== undefined) n.textContent = testo;
    return n;
  };
  const ora = tempo => new Date(tempo).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  function titoloGiorno(tempo) {
    const giorno = new Date(tempo); giorno.setHours(0, 0, 0, 0);
    const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
    const differenza = Math.round((oggi - giorno) / 86400000);
    const data = giorno.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    return differenza === 0 ? `Oggi · ${data}` : differenza === 1 ? `Ieri · ${data}` : data;
  }
  const limitaCopie = valore => {
    const n = Number.parseInt(valore, 10);
    return Number.isFinite(n) ? Math.min(99, Math.max(1, n)) : 1;
  };

  let pannello = null;
  let etichette = [];
  const selezione = new Map();   // id → copie da ristampare
  let ultimoFuoco = null;

  function costruisci() {
    pannello = nodo('div', 'cd-pannello');
    pannello.hidden = true;
    pannello.setAttribute('role', 'dialog');
    pannello.setAttribute('aria-modal', 'true');
    pannello.setAttribute('aria-labelledby', 'cdTitolo');
    pannello.innerHTML = `
      <header class="cd-testata">
        <div class="cd-marchio">STORE // CRAFT</div>
        <h1 class="cd-titolo" id="cdTitolo">Cronologia Etichette DYMO</h1>
        <button type="button" class="cd-chiudi" aria-label="Chiudi la cronologia"><span aria-hidden="true">✕</span></button>
      </header>
      <div class="cd-barra">
        <span class="cd-info"></span>
        <div class="cd-comandi-barra">
          <button type="button" class="cd-contorno cd-tutte">Seleziona tutte</button>
          <button type="button" class="cd-contorno cd-svuota">Svuota cronologia</button>
        </div>
      </div>
      <div class="cd-elenco"></div>
      <footer class="cd-piede">
        <span class="cd-conto">Tocca le etichette da ristampare</span>
        <span class="cd-esito" role="status"></span>
        <button type="button" class="cd-ristampa" disabled>Ristampa</button>
      </footer>`;
    document.body.append(pannello);
    pannello.querySelector('.cd-chiudi').addEventListener('click', chiudi);
    pannello.querySelector('.cd-svuota').addEventListener('click', svuota);
    pannello.querySelector('.cd-tutte').addEventListener('click', selezionaTutte);
    pannello.querySelector('.cd-ristampa').addEventListener('click', ristampa);
    document.addEventListener('keydown', evento => {
      if (evento.key === 'Escape' && pannello && !pannello.hidden) chiudi();
    });
  }

  async function apri() {
    if (!pannello) costruisci();
    ultimoFuoco = document.activeElement;
    selezione.clear();
    pannello.hidden = false;
    document.documentElement.classList.add('cd-aperta');
    pannello.querySelector('.cd-esito').textContent = '';
    await carica();
    pannello.querySelector('.cd-chiudi').focus();
  }
  function chiudi() {
    pannello.hidden = true;
    document.documentElement.classList.remove('cd-aperta');
    ultimoFuoco?.focus?.();
  }

  async function carica() {
    try {
      etichette = await elenco();
    } catch (errore) {
      console.error('Lettura della cronologia DYMO non riuscita.', errore);
      etichette = [];
      pannello.querySelector('.cd-info').textContent = 'Non è stato possibile leggere la cronologia.';
    }
    [...selezione.keys()].forEach(id => { if (!etichette.some(e => e.id === id)) selezione.delete(id); });
    disegna();
  }

  function disegna() {
    const n = etichette.length;
    pannello.querySelector('.cd-info').textContent = `ultimi 30 giorni · ${n === 1 ? '1 etichetta' : `${n} etichette`}`;
    pannello.querySelector('.cd-svuota').disabled = !n;
    pannello.querySelector('.cd-tutte').disabled = !n;
    pannello.querySelector('.cd-tutte').textContent = n && selezione.size === n ? 'Deseleziona tutte' : 'Seleziona tutte';
    const elencoEl = pannello.querySelector('.cd-elenco');
    if (!n) {
      const vuota = nodo('div', 'cd-vuota');
      vuota.append(nodo('strong', '', 'Nessuna etichetta'), 'Qui compaiono da sole le etichette DYMO stampate negli ultimi 30 giorni, da ristampare quando servono.');
      elencoEl.replaceChildren(vuota);
      aggiornaPiede();
      return;
    }
    const giorni = new Map();
    etichette.forEach(e => {
      const chiave = new Date(e.stampataIl).toDateString();
      if (!giorni.has(chiave)) giorni.set(chiave, []);
      giorni.get(chiave).push(e);
    });
    elencoEl.replaceChildren(...[...giorni.values()].map(gruppo => {
      const sezione = nodo('section', 'cd-giorno');
      const griglia = nodo('div', 'cd-griglia');
      griglia.append(...gruppo.map(schedaEtichetta));
      sezione.append(nodo('h2', 'cd-giorno-titolo', titoloGiorno(gruppo[0].stampataIl)), griglia);
      return sezione;
    }));
    aggiornaPiede();
  }

  function schedaEtichetta(e) {
    const scelta = selezione.has(e.id);
    const scheda = nodo('div', `cd-scheda${scelta ? ' scelta' : ''}`);
    const tocca = nodo('button', 'cd-tocca');
    tocca.type = 'button';
    tocca.setAttribute('aria-pressed', String(scelta));
    tocca.setAttribute('aria-label', `${e.nome || 'Etichetta'}, stampata alle ${ora(e.stampataIl)}${scelta ? ', selezionata' : ''}`);
    const miniatura = nodo('div', 'cd-miniatura');
    if (e.png) {
      const img = document.createElement('img');
      img.src = `data:image/png;base64,${e.png}`;
      img.alt = '';
      miniatura.append(img);
    } else {
      miniatura.append(nodo('span', 'cd-senza', 'anteprima non disponibile'));
    }
    const spunta = nodo('span', 'cd-spunta');
    spunta.setAttribute('aria-hidden', 'true');
    miniatura.append(spunta);
    const dettagli = nodo('div', 'cd-dettagli');
    dettagli.append(nodo('span', '', ora(e.stampataIl)),
      nodo('span', '', e.volte > 1 ? `stampata ${e.volte} volte` : `${e.copie} ${e.copie === 1 ? 'copia' : 'copie'}`));
    tocca.append(miniatura, nodo('div', 'cd-nome', (e.nome || '').replace(/^\d+\.\s*/, '') || 'Etichetta'), dettagli);
    tocca.addEventListener('click', () => {
      if (selezione.has(e.id)) selezione.delete(e.id); else selezione.set(e.id, e.copie || 1);
      disegna();
    });
    scheda.append(tocca);

    // con l'etichetta scelta: quante copie ristampare (1–99) e ✕ per toglierla dalla cronologia
    const sotto = nodo('div', 'cd-sotto');
    if (scelta) {
      const etichettaCopie = nodo('label', 'cd-copie');
      etichettaCopie.append('Copie');
      const meno = nodo('button', 'cd-passo', '−');
      meno.type = 'button';
      meno.setAttribute('aria-label', 'Una copia in meno');
      const campo = document.createElement('input');
      campo.type = 'number';
      campo.min = '1';
      campo.max = '99';
      campo.inputMode = 'numeric';
      campo.value = String(selezione.get(e.id));
      campo.setAttribute('aria-label', `Copie da ristampare di ${e.nome || 'questa etichetta'}`);
      const piu = nodo('button', 'cd-passo', '+');
      piu.type = 'button';
      piu.setAttribute('aria-label', 'Una copia in più');
      const imposta = valore => { const v = limitaCopie(valore); campo.value = String(v); selezione.set(e.id, v); aggiornaPiede(); };
      campo.addEventListener('input', () => { if (campo.value !== '') { selezione.set(e.id, limitaCopie(campo.value)); aggiornaPiede(); } });
      campo.addEventListener('change', () => imposta(campo.value));
      meno.addEventListener('click', () => imposta(limitaCopie(campo.value) - 1));
      piu.addEventListener('click', () => imposta(limitaCopie(campo.value) + 1));
      const gruppo = nodo('span', 'cd-numero');
      gruppo.append(meno, campo, piu);
      etichettaCopie.append(gruppo);
      sotto.append(etichettaCopie);
    } else {
      sotto.append(nodo('span', 'cd-suggerimento', 'tocca per ristamparla'));
    }
    const elimina = nodo('button', 'cd-elimina', '✕');
    elimina.type = 'button';
    elimina.title = 'Elimina dalla cronologia';
    elimina.setAttribute('aria-label', `Elimina ${e.nome || 'questa etichetta'} dalla cronologia`);
    elimina.addEventListener('click', async () => {
      if (!confirm(`Eliminare «${(e.nome || 'questa etichetta').replace(/^\d+\.\s*/, '')}» delle ${ora(e.stampataIl)} dalla cronologia?`)) return;
      await operazione('readwrite', archivio => archivio.delete(e.id));
      selezione.delete(e.id);
      carica();
    });
    sotto.append(elimina);
    scheda.append(sotto);
    return scheda;
  }

  function aggiornaPiede() {
    const n = selezione.size;
    const copie = [...selezione.values()].reduce((somma, c) => somma + c, 0);
    pannello.querySelector('.cd-conto').textContent = n
      ? `${n} ${n === 1 ? 'etichetta' : 'etichette'} · ${copie} ${copie === 1 ? 'copia' : 'copie'} in tutto`
      : 'Tocca le etichette da ristampare';
    const pulsante = pannello.querySelector('.cd-ristampa');
    pulsante.disabled = !n;
    pulsante.textContent = n ? `Ristampa (${copie})` : 'Ristampa';
  }

  function selezionaTutte() {
    if (selezione.size === etichette.length) selezione.clear();
    else etichette.forEach(e => { if (!selezione.has(e.id)) selezione.set(e.id, e.copie || 1); });
    disegna();
  }

  async function svuota() {
    if (!etichette.length) return;
    if (!confirm('Svuotare la cronologia delle etichette DYMO? Tutte le etichette degli ultimi 30 giorni verranno eliminate.')) return;
    await operazione('readwrite', archivio => archivio.clear());
    selezione.clear();
    carica();
  }

  // ----- Ristampa -----
  // Alla DYMO con l'immagine salvata e il numero di copie; senza DYMO (o senza immagine) dalla stampa del browser, con
  // il documento di stampa salvato, una etichetta alla volta (le copie si impostano nella finestra di stampa).
  async function ristampa() {
    const scelte = etichette.filter(e => selezione.has(e.id)).map(e => ({ voce: e, copie: selezione.get(e.id) }));
    if (!scelte.length) return;
    const esito = pannello.querySelector('.cd-esito');
    const pulsante = pannello.querySelector('.cd-ristampa');
    pulsante.disabled = true;
    esito.textContent = 'Ristampa in corso…';
    let stampante = null;
    try { stampante = collegamento.trovaStampante ? await collegamento.trovaStampante() : null; } catch { stampante = null; }
    let inviate = 0;
    let dalBrowser = 0;
    try {
      for (const { voce, copie } of scelte) {
        if (stampante && voce.png && window.DymoDirect) {
          try {
            await DymoDirect.dymoPrintPng(stampante.name, voce.png, copie);
            inviate += copie;
            await registra({ png: voce.png, html: voce.html, layout: voce.layout, nome: voce.nome, copie });
            continue;
          } catch (errore) {
            console.error('Ristampa DYMO non riuscita.', errore);
            if (!confirm(`Errore della stampante DYMO (${errore.message}).\nStampare «${(voce.nome || 'l\'etichetta').replace(/^\d+\.\s*/, '')}» dal browser?`)) continue;
          }
        }
        if (!voce.html) continue;
        if (!dalBrowser && !stampante) {
          alert(`Stampante DYMO non trovata: le etichette si stampano dal browser, una alla volta.${scelte.some(s => s.copie > 1) ? '\nImposta il numero di copie nella finestra di stampa.' : ''}`);
        }
        await stampaDalBrowser(voce.html);
        dalBrowser += 1;
        await registra({ png: voce.png, html: voce.html, layout: voce.layout, nome: voce.nome, copie });
      }
      if (inviate && stampante) collegamento.statoStampante?.('CONNESSA', true, `${stampante.name} · ${inviate === 1 ? 'etichetta inviata' : `${inviate} etichette inviate`}`);
      esito.textContent = inviate
        ? `${inviate === 1 ? '1 etichetta inviata' : `${inviate} etichette inviate`} alla DYMO`
        : dalBrowser ? 'Stampa dal browser' : 'Niente ristampato';
      selezione.clear();
      await carica();
    } finally {
      aggiornaPiede();
    }
  }

  function stampaDalBrowser(html) {
    return new Promise(fatto => {
      document.querySelectorAll('.cd-cornice-stampa').forEach(vecchia => vecchia.remove());
      const cornice = document.createElement('iframe');
      cornice.className = 'cd-cornice-stampa';
      cornice.title = 'Ristampa etichetta';
      document.body.append(cornice);
      const doc = cornice.contentWindow.document;
      doc.open();
      // il documento salvato è quello della stampa senza la stampa automatica: qui si stampa a mano, a caratteri pronti
      doc.write(`<!DOCTYPE html>${html}`);
      doc.close();
      const vai = async () => {
        try { if (doc.fonts) await doc.fonts.ready; } catch { /* niente */ }
        await Promise.all([...doc.images].map(img => img.complete ? null : new Promise(r => { img.onload = r; img.onerror = r; })));
        try { cornice.contentWindow.focus(); cornice.contentWindow.print(); } catch (errore) { console.error('Stampa dal browser non riuscita.', errore); }
        setTimeout(fatto, 300);
      };
      if (doc.readyState === 'complete') vai(); else cornice.addEventListener('load', vai, { once: true });
    });
  }

  window.CronologiaDymo = Object.freeze({
    collega(opzioni = {}) { collegamento = { ...collegamento, ...opzioni }; },
    registra,
    apri,
    elenco
  });
})();
