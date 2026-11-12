/* Riepilogo e controlli di Aggiorna copia cliente (pagina operatore, dall'8 novembre 2026).
   Prima di aggiornare la copia di un cliente (es. storecraftlxry) la pagina operatore mostra:
   - da quale versione a quale si passa (VERSIONE di assets/js/dashboard.js nella copia e nel progetto);
   - cosa cambia, in parole: i paragrafi «Dove siamo arrivati» / «Prima» di Storecraft Aggiornamento.html per le versioni
     tra quella della copia (esclusa) e quella del progetto (compresa);
   - quali pagine cambiano, negozio per negozio, e cosa cambia in comune;
   - i controlli di compatibilità, ognuno ok (verde), avviso (arancione) o blocco (rosso).
   Con un blocco l'aggiornamento non si può fare; con un avviso serve la spunta «Ho letto il riepilogo».
   Solo calcoli sui testi già letti: nessun accesso a cartelle o file (lo fa operatore.html), così si prova da solo.

   Uso: RiepilogoCopia.calcola(dati) → { versioneCopia, versioneProgetto, novita, gruppi, controlli, bloccato, avvisi }
        RiepilogoCopia.testo(riepilogo, { copia, data }) → il riepilogo come testo semplice (file da scaricare) */
(() => {
  // Versione del prodotto: 'V 1.2.77 2026' → '1.2.77'. Numerazione di AGENTS.md: 1.0 … 1.99, poi 1.2.01 … 1.2.99
  const versione = testoDashboard => (String(testoDashboard || '').match(/VERSIONE\s*=\s*['"]V\s*([0-9.]+)/) || [])[1] || null;
  const rango = v => {
    if (!v) return -1;
    const parti = v.split('.').map(Number);
    if (parti.some(n => !Number.isFinite(n))) return -1;
    return parti.length >= 3 ? 1000 + parti[2] : parti[1];   // 1.x prima di 1.2.xx
  };

  const senzaTag = html => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

  // Le note di versione dal piano: «Dove siamo arrivati (8 novembre 2026, versione 1.2.78: …)» e «Prima (…)»
  function novita(pianoHtml, daVersione, aVersione) {
    const da = rango(daVersione);
    const a = rango(aVersione);
    const voci = [];
    for (const m of String(pianoHtml || '').matchAll(/<p><strong>(?:Dove siamo arrivati|Prima) \(([^,]+), versione ([0-9.]+):([\s\S]*?)<\/strong><\/p>/g)) {
      const r = rango(m[2]);
      if (r > da && r <= a) voci.push({ versione: m[2], data: m[1].trim(), testo: senzaTag(m[3]).replace(/\)\s*$/, '') });
    }
    return voci.sort((x, y) => rango(y.versione) - rango(x.versione));
  }

  // Le pagine e i file che cambiano, raggruppati: per negozio (pagine .html della sua cartella e altri file), loghi,
  // schede dei negozi, file comuni (assets/js, assets/css, …), radice
  function gruppi(scrivere, togliere, negozi) {
    // riferimenti: file che cambiano solo nei numeri di aggiornamento dei collegamenti (?v=20261103-1), non nel contenuto
    const g = { negozi: {}, loghi: 0, schede: [], comuni: { js: 0, css: 0, immagini: 0, caratteri: 0, altri: 0 }, radice: [], riferimenti: 0 };
    const conta = (percorso, come) => {
      const parti = percorso.split('/');
      if (come === 'riferimenti') { g.riferimenti += 1; return; }
      if (negozi.includes(parti[0])) {
        const n = (g.negozi[parti[0]] ??= { pagine: [], altri: 0 });
        if (parti.length === 2 && /\.html$/.test(parti[1])) n.pagine.push({ nome: parti[1], come });
        else n.altri += 1;
      } else if (/^assets\/(logos\/|img\/[^/]+\/printlogos\/)/.test(percorso)) g.loghi += 1;
      else if (/^assets\/negozi\//.test(percorso)) g.schede.push({ nome: parti.at(-1), come });
      else if (parti.length === 1) g.radice.push({ nome: percorso, come });
      else if (/\.js$/.test(percorso)) g.comuni.js += 1;
      else if (/\.css$/.test(percorso)) g.comuni.css += 1;
      else if (/\.(png|jpe?g|svg|webp|gif|ico)$/i.test(percorso)) g.comuni.immagini += 1;
      else if (/\.(woff2?|ttf|otf)$/i.test(percorso)) g.comuni.caratteri += 1;
      else g.comuni.altri += 1;
    };
    scrivere.forEach(([percorso, motivo]) => conta(percorso, motivo));
    togliere.forEach(percorso => conta(percorso, 'tolto'));
    return g;
  }

  const pagina = link => String(link || '').split(/[?#]/)[0];
  // un link di una dashboard, dalla cartella del negozio: 'cartelli_semplici.html' → 'luxury/cartelli_semplici.html'
  function percorsoDaLink(negozio, link) {
    const nome = pagina(link);
    if (!nome || /^(https?:|mailto:|tel:|#|javascript:)/i.test(nome)) return null;
    const parti = [];
    for (const parte of `${negozio}/${nome}`.split('/')) {
      if (parte === '..') parti.pop();
      else if (parte && parte !== '.') parti.push(parte);
    }
    return parti.join('/');
  }

  /* dati:
     versioneCopia, versioneProgetto      testi di assets/js/dashboard.js (della copia e del progetto)
     piano                                testo di Storecraft Aggiornamento.html del progetto
     negozi                               negozi della copia (installati.js)
     codici                               codici delle statistiche della copia ({ luxury: '…' })
     scrivere                             [[percorso, 'nuovo' | 'cambiato' | 'riferimenti']] (riferimenti: cambiano solo
                                          i numeri ?v=… dei collegamenti)
     togliere                             [percorso]
     presenti                             numero di file della copia (senza i protetti)
     finali                               Set dei percorsi che la copia avrà dopo l'aggiornamento
     dashboards                           { negozio: testo di assets/negozi/<negozio>-dashboard.js dopo l'aggiornamento }
     testi                                Map percorso → testo dei file .html/.js/.css dopo l'aggiornamento
     tenuti                               loghi della copia tenuti come sono
     fantasmiCopia, fantasmiDopo          pagine in ghost prima e dopo, per negozio ({ luxury: ['x.html'] }) */
  function calcola(dati) {
    const vCopia = versione(dati.versioneCopia);
    const vProgetto = versione(dati.versioneProgetto);
    const controlli = [];
    const ok = testo => controlli.push({ livello: 'ok', testo });
    const avviso = (testo, dettagli) => controlli.push({ livello: 'avviso', testo, dettagli });
    const blocco = (testo, dettagli) => controlli.push({ livello: 'blocco', testo, dettagli });
    const totale = dati.scrivere.length + dati.togliere.length;

    // 1. versioni: mai tornare indietro
    if (!vProgetto) blocco('Non trovo la versione del progetto (VERSIONE in assets/js/dashboard.js).');
    else if (!vCopia) avviso(`Non trovo la versione della copia: non so da quale versione parte. Il progetto è alla ${vProgetto}.`);
    else if (rango(vCopia) > rango(vProgetto)) blocco(`La copia del cliente (${vCopia}) è più nuova del progetto (${vProgetto}): aggiornandola tornerebbe indietro. Controlla di aver collegato la cartella giusta del progetto.`);
    else if (rango(vCopia) === rango(vProgetto) && totale) avviso(`Copia e progetto hanno la stessa versione (${vProgetto}) ma ${totale === 1 ? '1 file è diverso' : `${totale} file sono diversi`}: il progetto ha modifiche senza un numero di versione nuovo (prima del commit si incrementa VERSIONE).`);
    else if (rango(vCopia) < rango(vProgetto)) ok(`Versione: dalla ${vCopia} alla ${vProgetto}.`);
    else ok(`Versione: ${vProgetto}, già aggiornata.`);

    // 2. negozi della copia (il progetto li ha tutti: lo controlla già la scelta della cartella)
    ok(`Negozi della copia: ${dati.negozi.join(', ')}, tutti presenti nel progetto.`);

    // 3. nessuna pagina collegata dalle dashboard della copia sparisce
    const mancanti = [];
    for (const negozio of dati.negozi) {
      const testo = dati.dashboards[negozio];
      if (!testo) { mancanti.push(`${negozio}: manca la dashboard (assets/negozi/${negozio}-dashboard.js)`); continue; }
      for (const m of testo.matchAll(/link:\s*'([^']+)'/g)) {
        const percorso = percorsoDaLink(negozio, m[1]);
        if (percorso && !dati.finali.has(percorso)) mancanti.push(`${negozio}: la scheda apre ${m[1]}, che dopo l'aggiornamento non c'è`);
      }
    }
    if (mancanti.length) blocco(mancanti.length === 1 ? '1 pagina collegata dalle dashboard non ci sarebbe più.' : `${mancanti.length} pagine collegate dalle dashboard non ci sarebbero più.`, [...new Set(mancanti)]);
    else ok('Tutte le pagine collegate dalle dashboard della copia ci sono anche dopo l\'aggiornamento.');

    // 4. file tolti ancora citati da pagine, script o stili che restano
    const citati = [];
    for (const percorso of dati.togliere) {
      const nome = percorso.split('/').pop();
      if (nome.length < 5) continue;
      const dove = [...dati.testi].filter(([altro, testo]) => altro !== percorso && testo.includes(nome)).map(([altro]) => altro);
      if (dove.length) citati.push(`${percorso} (citato in ${dove.slice(0, 3).join(', ')}${dove.length > 3 ? ` e altri ${dove.length - 3}` : ''})`);
    }
    if (citati.length) avviso(citati.length === 1 ? '1 file da togliere è ancora citato da file che restano: controlla che non serva.' : `${citati.length} file da togliere sono ancora citati da file che restano: controlla che non servano.`, citati);
    else if (dati.togliere.length) ok(`I ${dati.togliere.length} file da togliere non sono citati da nessuna pagina che resta.`);

    // 5. tante cancellazioni: forse la cartella sbagliata
    const quota = dati.presenti ? dati.togliere.length / dati.presenti : 0;
    if (dati.togliere.length > 25 || quota > 0.2) avviso(`Si toglierebbero ${dati.togliere.length} file su ${dati.presenti} della copia (${Math.round(quota * 100)}%): è tanto, controlla che la cartella sia quella giusta.`);

    // 6. quello che è del cliente resta: loghi, ghost, statistiche
    ok(`Loghi ufficiali della copia: ${dati.tenuti} tenuti come sono, i nuovi del progetto si aggiungono.`);
    const ghostPersi = [];
    for (const negozio of dati.negozi) {
      const dopo = new Set((dati.fantasmiDopo || {})[negozio] || []);
      for (const nome of (dati.fantasmiCopia || {})[negozio] || []) if (!dopo.has(nome)) ghostPersi.push(`${negozio}: ${nome}`);
    }
    if (ghostPersi.length) avviso(ghostPersi.length === 1 ? '1 pagina in ghost nella copia tornerebbe visibile.' : `${ghostPersi.length} pagine in ghost nella copia tornerebbero visibili.`, ghostPersi);
    else ok('Le pagine in ghost della copia restano in ghost.');
    const conCodice = dati.negozi.filter(id => (dati.codici || {})[id]);
    ok(conCodice.length ? `Codici delle statistiche invariati (${conCodice.join(', ')}).` : 'Nessun codice delle statistiche nella copia: resta così.');

    return {
      versioneCopia: vCopia,
      versioneProgetto: vProgetto,
      novita: vCopia && vProgetto ? novita(dati.piano, vCopia, vProgetto) : [],
      gruppi: gruppi(dati.scrivere, dati.togliere, dati.negozi),
      controlli,
      bloccato: controlli.some(c => c.livello === 'blocco'),
      avvisi: controlli.some(c => c.livello === 'avviso'),
      totale,
    };
  }

  const SEGNO = { ok: '✓', avviso: '⚠', blocco: '✗' };
  const COME = { nuovo: 'nuova', cambiato: 'cambiata', tolto: 'tolta' };

  // Righe in parole delle pagine e dei file che cambiano (per la pagina e per il file da scaricare)
  function righeGruppi(g) {
    const righe = [];
    for (const [negozio, n] of Object.entries(g.negozi)) {
      const pagine = n.pagine.map(p => `${p.nome.replace(/\.html$/, '')} (${COME[p.come]})`);
      righe.push(`${negozio}: ${pagine.length ? `${pagine.length === 1 ? '1 pagina' : `${pagine.length} pagine`} — ${pagine.join(', ')}` : 'nessuna pagina'}${n.altri ? (n.altri === 1 ? '; 1 altro file' : `; altri ${n.altri} file`) : ''}`);
    }
    if (g.schede.length) righe.push(`schede dei negozi: ${g.schede.map(s => `${s.nome} (${COME[s.come] || s.come})`).join(', ')}`);
    const c = g.comuni;
    const comuni = [c.js && `${c.js} script`, c.css && `${c.css} stili`, c.immagini && `${c.immagini} immagini`, c.caratteri && `${c.caratteri} caratteri`, c.altri && (c.altri === 1 ? '1 altro file' : `${c.altri} altri file`)].filter(Boolean);
    if (comuni.length) righe.push(`in comune a tutti i negozi: ${comuni.join(', ')}`);
    if (g.loghi) righe.push(`loghi ufficiali: ${g.loghi} file`);
    if (g.radice.length) righe.push(`pagine principali: ${g.radice.map(r => `${r.nome} (${COME[r.come] || r.come})`).join(', ')}`);
    if (g.riferimenti) righe.push(`${g.riferimenti === 1 ? '1 file cambia' : `${g.riferimenti} file cambiano`} solo nei numeri di aggiornamento dei collegamenti (?v=…): stesso contenuto`);
    if (!righe.length) righe.push('nessun cambiamento');
    return righe;
  }

  function testo(r, { copia, data }) {
    const righe = [`RIEPILOGO AGGIORNAMENTO — copia «${copia}» — ${data}`, ''];
    righe.push(`Versione: ${r.versioneCopia || '?'} → ${r.versioneProgetto || '?'}`, '');
    righe.push('COSA CAMBIA');
    if (r.novita.length) r.novita.forEach(n => righe.push(`- ${n.versione} (${n.data}): ${n.testo}`));
    else righe.push('- nessuna nota di versione nel piano per questo passaggio');
    righe.push('', `PAGINE E FILE (${r.totale} cambiamenti)`);
    righeGruppi(r.gruppi).forEach(riga => righe.push(`- ${riga}`));
    righe.push('', 'CONTROLLI');
    r.controlli.forEach(c => {
      righe.push(`${SEGNO[c.livello]} ${c.testo}`);
      (c.dettagli || []).forEach(d => righe.push(`    · ${d}`));
    });
    righe.push('', r.bloccato ? 'ESITO: BLOCCATO, la copia non si aggiorna.' : r.avvisi ? 'ESITO: si può aggiornare dopo aver letto gli avvisi.' : 'ESITO: tutto in ordine.');
    return righe.join('\n') + '\n';
  }

  const RiepilogoCopia = Object.freeze({ versione, rango, novita, gruppi, righeGruppi, percorsoDaLink, calcola, testo, SEGNO });
  if (typeof window !== 'undefined') window.RiepilogoCopia = RiepilogoCopia;
  if (typeof module !== 'undefined') module.exports = RiepilogoCopia;
})();
