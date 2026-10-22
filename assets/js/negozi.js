/* Negozi di STORE // CRAFT: le schede dei negozi e l'elenco dei negozi installati in questa copia.
   Ogni negozio ha la sua scheda in assets/negozi/: <negozio>.js (nome, sigla, oro, guida di montaggio, lista di
   stampa, valori iniziali dell'interfaccia…) e <negozio>.css (colori come variabili CSS: cursore, pulsantiera, riquadro
   PDF). L'elenco dei negozi installati sta in assets/negozi/installati.js: con un solo negozio la splash page si salta e
   i menu mostrano solo quel negozio. Prepara copia della pagina operatore scrive l'elenco per la copia di un cliente.

   Va incluso per primo nel <head> di ogni pagina, prima degli altri moduli: carica subito (durante la lettura della
   pagina) l'elenco, le schede dei negozi installati e i colori del negozio della pagina (data-negozio su <html>).

   Uso:
     Negozi.installati            elenco dei negozi installati, es. ['luxury', 'tebe', 'ophilya']
     Negozi.scheda(id)            scheda del negozio (null se non è installato)
     Negozi.corrente()            scheda del negozio della pagina (null nelle pagine della radice)
     Negozi.unico()               il negozio, se ne è installato uno solo; altrimenti null
   Nelle schede e in installati.js:
     Negozi.registra(id, scheda)  aggiunge la scheda di un negozio
     Negozi.installa([...])       dichiara i negozi installati e carica le loro schede;
     Negozi.installa([...], { copiaCliente: true, statistiche: { luxury: '<codice>' } })   così lo scrive Prepara copia
                                  nella copia per un cliente, con il codice di ogni negozio per spedire le statistiche
                                  (statistiche.js, sezione Statistiche dell'area operatore)
     Negozi.copiaCliente          true nella copia per un cliente: la pagina operatore mostra solo Gestione loghi e
                                  Pannello di controllo (loghi ufficiali e ghost delle pagine di quel cliente)
     Negozi.codiceStatistiche(id) codice del negozio per le statistiche (null se la copia non lo ha)
     Negozi.extra                 true se il menu IMPOSTAZIONI ha i set EXTRA (VINTAGE…): Negozi.installa([...], { extra: true });
                                  il progetto madre sì, le copie dei clienti no (dal 22 ottobre 2026) */
(() => {
  const script = document.currentScript;
  const versione = new URL(script.src).search;  // stessa versione (?v=) dei file comuni
  const cartella = new URL('../negozi/', script.src);
  const negozio = document.documentElement.dataset.negozio || null;
  const schede = {};
  let installati = [];
  let codiciStatistiche = {};
  let extra = false;
  let copiaCliente = false;

  // Caricamento durante la lettura della pagina: i moduli che seguono trovano già schede e colori.
  function scrivi(html) {
    document.write(html);
  }

  // Temi speciali spenti per il modulo (Gestione negozi: temiSpenti nella scheda della dashboard, che li passa
  // nell'indirizzo della pagina, ?senza-temi=italia,blackfriday,natale): i loro pulsanti non compaiono
  const PULSANTI_TEMI = { italia: '.made-in-italy-btn', blackfriday: '.black-friday-btn', natale: '.xmas-btn' };
  try {
    const spenti = (new URLSearchParams(location.search).get('senza-temi') || '').split(',').map(tema => PULSANTI_TEMI[tema]).filter(Boolean);
    if (spenti.length) scrivi(`<style>${spenti.join(', ')} { display: none !important; }</style>`);
  } catch { /* indirizzo non leggibile: tutti i temi */ }

  window.Negozi = Object.freeze({
    get installati() { return installati.slice(); },
    scheda: id => (installati.includes(id) && schede[id]) || null,
    corrente: () => (negozio && schede[negozio]) || null,
    unico: () => (installati.length === 1 ? installati[0] : null),
    codiceStatistiche: id => codiciStatistiche[id] || null,
    get extra() { return extra; },
    get copiaCliente() { return copiaCliente; },
    registra(id, scheda) {
      schede[id] = Object.freeze({ id, ...scheda });
    },
    installa(elenco, opzioni = {}) {
      installati = elenco.slice();
      codiciStatistiche = { ...(opzioni.statistiche || {}) };
      extra = Boolean(opzioni.extra);
      copiaCliente = Boolean(opzioni.copiaCliente);
      installati.forEach(id => {
        scrivi(`<script src="${new URL(`${id}.js${versione}`, cartella).href}"><\/script>`);
      });
      if (negozio) {
        scrivi(`<link rel="stylesheet" href="${new URL(`${negozio}.css${versione}`, cartella).href}">`);
      }
    }
  });

  scrivi(`<script src="${new URL(`installati.js${versione}`, cartella).href}"><\/script>`);
  // Radio accesa in questa scheda del browser (radio.js): nelle pagine del negozio la mini radio fluttuante riparte sulla
  // stessa stazione (nella dashboard c'è la radio grande, che la carica da sé; non nei riquadri dell'area operatore)
  try {
    if (negozio && window.top === window && sessionStorage.getItem(`storecraft_radio_acceso_${negozio}`) === '1') {
      scrivi(`<link rel="stylesheet" href="${new URL(`../css/radio.css${versione}`, script.src).href}">`);
      scrivi(`<script src="${new URL(`radio.js${versione}`, script.src).href}" data-mini="${negozio}"><\/script>`);
    }
  } catch { /* sessionStorage spento: niente mini radio */ }
  // La Bacheca dimostrativa (?demo) è stata tolta il 22 ottobre 2026: nei browser dove era stata aperta restano note e
  // comunicazioni segnate demo: true, che qui si tolgono una volta sola, con la locandina nell'archivio delle foto
  // (le note vere restano). Il segno è la chiave storecraft_bacheca_demo_<negozio>, che si toglie alla fine.
  try {
    Object.keys(localStorage).filter(chiave => chiave.startsWith('storecraft_bacheca_demo_')).forEach(chiave => {
      const negozioDemo = chiave.slice('storecraft_bacheca_demo_'.length);
      const leggi = k => { try { const v = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
      const chiaveNote = `storecraft_bacheca_${negozioDemo}`;
      const chiaveCom = `storecraft_bacheca_comunicazioni_${negozioDemo}`;
      const comunicazioni = leggi(chiaveCom);
      const foto = comunicazioni.filter(c => c && c.demo && c.foto).map(c => `${negozioDemo}:${c.id}`);
      localStorage.setItem(chiaveNote, JSON.stringify(leggi(chiaveNote).filter(nota => !(nota && nota.demo))));
      localStorage.setItem(chiaveCom, JSON.stringify(comunicazioni.filter(c => !(c && c.demo))));
      localStorage.removeItem(chiave);
      if (foto.length && window.indexedDB) {
        const apertura = indexedDB.open('storecraft-bacheca-foto', 1);
        apertura.onupgradeneeded = () => apertura.result.createObjectStore('foto');
        apertura.onsuccess = () => {
          const archivio = apertura.result.transaction('foto', 'readwrite').objectStore('foto');
          foto.forEach(k => archivio.delete(k));
        };
      }
    });
  } catch { /* localStorage spento: niente da pulire */ }

  // Icona di STORE // CRAFT (S in Cinzel, oro scuro, su fondo bianco), la stessa in tutte le pagine di tutti i negozi:
  // nella scheda del browser (32 o 512 px) e, su iPhone e iPad, sulla schermata Home.
  const immagini = new URL('../img/', script.src);
  scrivi(`<link rel="icon" type="image/png" sizes="32x32" href="${new URL(`favicon-32.png${versione}`, immagini).href}">`);
  scrivi(`<link rel="icon" type="image/png" sizes="512x512" href="${new URL(`favicon.png${versione}`, immagini).href}">`);
  scrivi(`<link rel="apple-touch-icon" href="${new URL(`apple-touch-icon.png${versione}`, immagini).href}">`);
})();
