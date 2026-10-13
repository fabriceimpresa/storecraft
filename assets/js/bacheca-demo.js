/* Bacheca dimostrativa: riempie la Bacheca dei negozi installati con note e una comunicazione ufficiale di esempio,
   per mostrarla in funzione a un cliente. La carica negozi.js solo quando l'indirizzo della pagina ha ?demo (per esempio
   luxury/index.html?demo): le bacheche vere dei negozi restano come sono.

   - ?demo        aggiunge in ogni negozio installato (una volta sola per browser: storecraft_bacheca_demo_<negozio>)
                  50 note della settimana scorsa (in bacheca compatta), 49 della settimana in corso (in bacheca normale,
                  le 6 più recenti da leggere) e la comunicazione ufficiale «Promo Pinko -30%», nuova, con la foto della
                  promo (assets/img/bacheca-demo/promo-pinko.jpg, in IndexedDB come le foto vere) e quattro commenti.
                  Note e comunicazione nuove accendono gli avvisi del widget La tua Bacheca e del banner della dashboard.
   - ?demo=via    toglie solo le note e le comunicazioni demo (demo: true) con la loro foto.
   Le date sono calcolate al momento: la settimana in corso parte dal lunedì, la scorsa è quella prima. Dati nel formato
   di assets/js/bacheca.js (note in storecraft_bacheca_<negozio>, comunicazioni in storecraft_bacheca_comunicazioni_<negozio>). */
(() => {
  const parametro = new URLSearchParams(location.search).get('demo');
  if (parametro === null) return;
  const negozi = window.Negozi?.installati || [];
  const UN_GIORNO = 24 * 60 * 60 * 1000;
  const chiaveNote = n => `storecraft_bacheca_${n}`;
  const chiaveCom = n => `storecraft_bacheca_comunicazioni_${n}`;
  const chiaveDemo = n => `storecraft_bacheca_demo_${n}`;
  const leggi = k => { try { const v = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
  const scrivi = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (errore) { console.error('Bacheca demo non salvata.', errore); } };
  const FOTO = new URL('../img/bacheca-demo/promo-pinko.jpg', document.currentScript.src).href;

  // le foto delle comunicazioni: lo stesso archivio di bacheca.js
  function archivioFoto(operazione) {
    return new Promise((ok, ko) => {
      const apertura = indexedDB.open('storecraft-bacheca-foto', 1);
      apertura.onupgradeneeded = () => apertura.result.createObjectStore('foto');
      apertura.onerror = () => ko(apertura.error);
      apertura.onsuccess = () => {
        const transazione = apertura.result.transaction('foto', 'readwrite');
        operazione(transazione.objectStore('foto'));
        transazione.oncomplete = () => ok();
        transazione.onerror = () => ko(transazione.error);
      };
    });
  }

  if (parametro === 'via') {
    negozi.forEach(n => {
      const comunicazioni = leggi(chiaveCom(n));
      const via = comunicazioni.filter(c => c.demo).map(c => `${n}:${c.id}`);
      scrivi(chiaveNote(n), leggi(chiaveNote(n)).filter(nota => !nota.demo));
      scrivi(chiaveCom(n), comunicazioni.filter(c => !c.demo));
      try { localStorage.removeItem(chiaveDemo(n)); } catch { /* niente */ }
      if (via.length) archivioFoto(archivio => via.forEach(k => archivio.delete(k))).catch(() => {});
    });
    return;
  }

  // ----- I testi: un negozio di moda, la sua giornata -----
  const PERSONE = ['Giulia', 'Marco', 'Sara', 'Chiara', 'Luca', 'Francesca', 'Davide', 'Elena'];
  const BRAND = {
    luxury: ['Pinko', 'Liu Jo', 'Twinset', 'Patrizia Pepe', 'Elisabetta Franchi', 'MeiMeiJ'],
    tebe: ['269 TEBE', 'Dixie', 'Haveone', 'Okkia', 'Souvenir', 'Vicolo'],
    ophilya: ['OPHILYA', 'Dixie', 'Vicolo', 'Souvenir', 'Haveone', 'Okkia']
  };
  const NOTE = [
    ['Consegna corriere', 'Arrivati 4 colli {b}: 2 già sistemati in magazzino, gli altri due da aprire domattina.'],
    ['Cliente da richiamare', 'La signora Bianchi aspetta la taglia 42 del cappotto {b} cammello. Richiamarla appena arriva: 333 ••• 4512.'],
    ['Vetrina', 'Cambiare la vetrina sinistra entro sabato: manichini con i nuovi capispalla {b} e cartello Percentuale.'],
    ['Turni', 'Sabato chiudo io. Domenica apre {p} alle 10:30.'],
    ['Cassa', 'Fondo cassa controllato: tutto ok. Mancano rotoli per il POS, ne ho preso un pacco.'],
    ['Reso', 'Reso maglione {b} taglia M: scontrino del 3 ottobre, rimborso fatto con buono. Capo rimesso in vendita.'],
    ['Cartellini', 'Stampati i cartellini Vetrina per la parete {b}: prezzi aggiornati, controllate che siano tutti appesi.'],
    ['Pulizie', 'Specchi dei camerini e vetrina da pulire prima dell\'apertura.'],
    ['Riordino', 'Riordinare per taglia l\'espositore delle camicie {b}, il cliente di ieri ha messo tutto in disordine.'],
    ['Ordine in arrivo', 'Giovedì arriva il riassortimento {b}: tenere libero lo scaffale in fondo al magazzino.'],
    ['Prova sartoria', 'Pantalone {b} da accorciare per la cliente delle 17: orlo 2 cm, pronto per venerdì.'],
    ['Idea', 'Mettere gli accessori {b} vicino alla cassa: le borse piccole si vendono bene come acquisto d\'impulso.'],
    ['Allarme', 'Il varco antitaccheggio suona a vuoto ogni tanto: ho chiamato l\'assistenza, passano domani.'],
    ['Instagram', 'Foto delle nuove arrivate {b} fatte in vetrina: le pubblico stasera.'],
    ['Lista di stampa', 'In lista di stampa ci sono i cartelli Outlet per la parete di destra: stampateli in mattinata.'],
    ['Ricordati', 'Chiedere al titolare le chiavi del secondo magazzino.'],
    ['Cliente fidelity', 'Nuova cliente iscritta alla fidelity: le spetta il 10% sul prossimo acquisto {b}.'],
    ['Inventario', 'Fine mese inventario parziale del reparto {b}: segnatevi i capi danneggiati.'],
    ['Etichette', 'Finite le etichette DYMO bianche: ne ho ordinate due rotoli.'],
    ['Scambio taglie', 'La cliente di stamattina passa a cambiare la giacca {b}: dalla 44 alla 42, è già messa da parte.'],
    ['Vendite', 'Oggi ottima giornata: 3 cappotti {b} e 5 maglioni venduti entro le 16.'],
    ['Manutenzione', 'Una lampadina della vetrina centrale è bruciata. Ricambio nel cassetto sotto la cassa.'],
    ['Pausa pranzo', 'Oggi pausa dalle 13:30 alle 14:15, copre {p}.'],
    ['Promozione', 'Ricordate di proporre la borsa {b} a chi compra un capospalla: c\'è lo sconto abbinato.'],
    ['Cliente straniera', 'Una cliente americana tornerà domani per il tax free: tenere pronto il modulo.'],
    ['Camerini', 'Il gancio del camerino 2 è staccato, non appendeteci i cappotti pesanti.'],
    ['Pacchi regalo', 'Finite le scatole medie per i regali: usate le grandi fino al nuovo ordine.'],
    ['Formazione', 'Mercoledì alle 9 breve incontro sulla nuova collezione {b}, prima dell\'apertura.']
  ];
  const COMMENTI = [
    ['Giulia', 'Fatto! Vetrina centrale sistemata, i cartelli -30% sono al loro posto.'],
    ['Marco', 'Stampati anche i cartellini Vetrina per gli accessori Pinko: li trovate in cassa.'],
    ['Sara', 'Una cliente ha già chiesto se lo sconto vale sulle borse: le ho detto di sì, solo nuova collezione.'],
    ['Chiara', 'Messo il cartello in vetrina anche sul lato strada. Ottimo, si vede bene da fuori!']
  ];

  // numeri «a caso» ma sempre uguali per negozio (le note demo non cambiano a ogni prova)
  function generatore(seme) {
    let s = seme;
    return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  }
  const CARTE = 8;
  const DECORI = ['nastro', 'angolo', 'semplice'];
  function nota(caso, n, i, creata, nuova) {
    const [titolo, testo] = NOTE[i % NOTE.length];
    const brand = BRAND[n] || BRAND.luxury;
    const pesi = [3, 1, 1, 1, 1, 1, 1, 1];
    let k = caso() * 10; const carta = pesi.findIndex(p => (k -= p) < 0);
    return {
      id: `demo-${n}-${i}`,
      titolo,
      testo: testo.replace('{b}', brand[i % brand.length]).replace('{p}', PERSONE[(i + 3) % PERSONE.length]),
      carta: Math.max(0, Math.min(CARTE - 1, carta)),
      decoro: DECORI[Math.floor(caso() * DECORI.length)],
      giro: Math.round((caso() * 5 - 2.5) * 10) / 10,
      seme: Math.floor(caso() * 1000),
      creata,
      modificata: creata,
      autore: PERSONE[i % PERSONE.length],
      nuova,
      demo: true
    };
  }
  // ore di negozio (9:30 - 19:30) di un giorno, a caso
  const orario = (giorno, caso) => giorno + (9.5 + caso() * 10) * 60 * 60 * 1000;

  const foto = [];   // le foto salvate ora: aperta la Bacheca, quando sono pronte la pagina si ricarica (una volta) per mostrarle
  negozi.forEach((n, indice) => {
    try { if (localStorage.getItem(chiaveDemo(n))) return; } catch { return; }
    const caso = generatore(20261013 + indice * 97);
    const ora = Date.now();
    const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
    const lunedi = new Date(oggi); lunedi.setDate(oggi.getDate() - ((oggi.getDay() + 6) % 7));
    const inizio = lunedi.getTime();
    const giorniPassati = Math.max(1, Math.round((oggi.getTime() - inizio) / UN_GIORNO) + 1);
    const note = [];
    // settimana scorsa: 50 note, dal lunedì alla domenica (in bacheca compatta)
    for (let i = 0; i < 50; i++) note.push(nota(caso, n, i, orario(inizio - 7 * UN_GIORNO + (i % 7) * UN_GIORNO, caso), false));
    // settimana in corso: 49 note, dal lunedì a ora (le 6 più recenti da leggere). Oggi solo le ultime 4: con 5 note di
    // oggi la Bacheca le metterebbe in un gruppo a sé («Solo oggi»), spezzando la settimana (di lunedì è inevitabile)
    const giorniPrima = giorniPassati - 1;
    const correnti = [];
    for (let i = 0; i < 49; i++) {
      if (giorniPrima === 0 || i >= 45) correnti.push(ora - (49 - i) * 25 * 60 * 1000);
      else correnti.push(orario(inizio + (i % giorniPrima) * UN_GIORNO, caso));
    }
    correnti.sort((a, b) => a - b).forEach((creata, i) => note.push(nota(caso, n, 50 + i, creata, i >= 43)));
    scrivi(chiaveNote(n), leggi(chiaveNote(n)).concat(note));

    // la comunicazione ufficiale: Promo Pinko -30%, con la foto della promo e i commenti
    const pubblicata = ora - 3 * 60 * 60 * 1000;
    const id = `demo-${n}-promo-pinko`;
    const comunicazione = {
      id,
      titolo: 'Promo Pinko -30% · nuova collezione',
      testo: 'Da domani al 27 ottobre parte la promo Pinko: -30% su tutta la nuova collezione autunno inverno, solo in negozio.\n\n'
        + 'Cosa fare:\n1. Entro stasera allestire la vetrina centrale con i capispalla Pinko e la locandina in foto.\n'
        + '2. Stampare i cartelli -30% con Cartello Percentuale (brand PINKO) per la parete Pinko e il banco accessori.\n'
        + '3. Aggiornare i cartellini Vetrina degli accessori con il doppio prezzo.\n'
        + '4. Lo sconto NON vale sui saldi e sui capi già scontati: ricordatelo in cassa.\n\n'
        + 'A fine giornata scrivete qui sotto quanti pezzi Pinko avete venduto.',
      durata: 14,
      autore: 'Direzione',
      scadenza: pubblicata + 14 * UN_GIORNO,
      giro: -0.4,
      foto: true,
      creata: pubblicata,
      modificata: pubblicata,
      nuova: true,
      demo: true,
      commenti: COMMENTI.map(([autore, testo], i) => ({
        id: `demo-${n}-k${i}`, testo, autore,
        carta: [0, 2, 1, 3][i], giro: [-2.2, 1.6, -1.1, 2.4][i],
        creata: pubblicata + (i + 1) * 35 * 60 * 1000
      }))
    };
    scrivi(chiaveCom(n), leggi(chiaveCom(n)).filter(c => c.id !== id).concat(comunicazione));
    try { localStorage.setItem(chiaveDemo(n), String(ora)); } catch { /* niente */ }
    // la foto, nell'archivio delle foto della Bacheca
    foto.push(fetch(FOTO).then(r => r.blob()).then(blob => archivioFoto(archivio => archivio.put(blob, `${n}:${id}`)))
      .catch(errore => console.error('Foto della bacheca demo non salvata.', errore)));
  });
  if (foto.length) Promise.all(foto).then(() => { if (document.querySelector('[data-bacheca]')) location.reload(); });
})();
