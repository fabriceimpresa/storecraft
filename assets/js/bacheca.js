/* Bacheca (Utilità Cassa): post-it con un titolo e un testo libero, nella pagina bacheca.html del negozio, a
   schermo intero. Stile in assets/css/bacheca.css.
   - Le note stanno nel browser, una lista per negozio (localStorage, chiave "storecraft_bacheca_<negozio>", fino all'11 ottobre 2026 "storecraft_blocco_note_<negozio>"): solo
     testo, poche decine di KB anche con tante note. Come la lista di stampa e i loghi personali restano nel browser
     e nel computer in cui si scrivono.
   - Ogni post-it ha un aspetto suo, scelto quando nasce: colore della carta, inclinazione, dettaglio (nastro adesivo,
     angolo piegato o niente; il nastro in quattro versioni, dal seme della nota) e formato (quadrato, alto, largo, grande), che segue anche quanto testo c'è.
     I post-it si incastrano in colonne, in ordine di tempo (disponi); aprendo la pagina cadono alla rinfusa
     e si posano, e quando la bacheca cambia (nota nuova, eliminata, finestra più stretta) si spostano animati.
   - Due viste per i gruppi di note: BACHECA NORMALE, i post-it aperti a grandezza piena (la settimana in corso), e
     BACHECA COMPATTA, le note chiuse in piccole etichette con il solo titolo, cliccabili (le settimane passate).
   - Un clic apre il post-it in grande per scrivere: si salva da solo mentre si scrive; una nota lasciata vuota sparisce.
   Uso nella pagina: <div id="bacheca" data-bacheca></div> con la barra (#nuova, #info) e l'editor (#velo…).
   Bacheca.elenco(negozio) dà le note (anche al widget della dashboard, cassa.js). Testi scritti sempre con
   textContent. */
(() => {
  const NEGOZIO = document.documentElement.dataset.negozio || 'luxury';
  const chiave = negozio => `storecraft_bacheca_${negozio}`;
  // fino all'11 ottobre 2026 la Bacheca si chiamava Blocco Note: le note salvate con la chiave di prima passano alla
  // nuova la prima volta che si leggono, così non si perde niente
  function trasloca(negozio) {
    try {
      const vecchia = `storecraft_blocco_note_${negozio}`;
      const prima = localStorage.getItem(vecchia);
      if (prima !== null && localStorage.getItem(chiave(negozio)) === null) localStorage.setItem(chiave(negozio), prima);
      if (prima !== null) localStorage.removeItem(vecchia);
    } catch (errore) { /* localStorage spento: niente da spostare */ }
  }
  // Carte dei post-it, sempre in quest'ordine (le note salvate ricordano la posizione): giallo, il colore base, rosa,
  // azzurro, verdino, arancio, viola, rosso e ocra. Ogni nota nuova prende un colore a caso, con il giallo classico più
  // probabile degli altri (PESI: circa una nota su tre), diverso da quello della
  // nota precedente
  const CARTE = ['#fff3a3', '#ffd1dc', '#c7ecff', '#d4f5c4', '#ffd9a8', '#e6d7ff', '#ffb3a8', '#ecd08c'];
  const PESI = [3, 1, 1, 1, 1, 1, 1, 1];
  // dettagli del post-it: nastro adesivo (in quattro versioni, dal seme della nota), angolo piegato o niente; le note che
  // avevano la puntina, tolta l'11 ottobre 2026, mostrano il nastro
  const DECORI = ['nastro', 'angolo', 'semplice'];
  const MAX_TITOLO = 60;
  const MAX_TESTO = 1500;

  function elenco(negozio = NEGOZIO) {
    trasloca(negozio);
    try {
      const note = JSON.parse(localStorage.getItem(chiave(negozio)) || '[]');
      return Array.isArray(note) ? note : [];
    } catch (errore) {
      console.error('Lettura della bacheca non riuscita.', errore);
      return [];
    }
  }

  function salva(note) {
    try {
      localStorage.setItem(chiave(NEGOZIO), JSON.stringify(note));
      return true;
    } catch (errore) {
      console.error('Salvataggio della bacheca non riuscito.', errore);
      return false;
    }
  }

  // formato del post-it secondo il testo, con un po' di varietà fissa per nota (dall'id)
  function formato(nota) {
    const lunghezza = (nota.testo || '').length;
    const caso = nota.seme % 3;
    if (lunghezza > 380) return 'grande';
    if (lunghezza > 160) return caso === 0 ? 'largo' : 'alto';
    if (lunghezza > 60) return ['alto', 'quadrato', 'largo'][caso];
    return caso === 2 ? 'alto' : 'quadrato';
  }

  function nuovaNota(precedente) {
    // colore diverso da quello dell'ultima nota
    let carta;
    const aCaso = () => { let n = Math.random() * PESI.reduce((a, b) => a + b, 0); return PESI.findIndex(p => (n -= p) < 0); };
    do carta = aCaso(); while (precedente && carta === precedente.carta);
    return {
      id: `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      titolo: '',
      testo: '',
      carta,
      decoro: DECORI[Math.floor(Math.random() * DECORI.length)],
      giro: Math.round((Math.random() * 5 - 2.5) * 10) / 10,
      seme: Math.floor(Math.random() * 1000),
      creata: Date.now(),
      modificata: Date.now(),
      nuova: true   // da leggere: l'avviso della dashboard resta finché qualcuno non apre il post-it
    };
  }

  // ----- Pagina -----
  const bacheca = document.querySelector('[data-bacheca]');
  if (!bacheca) {
    window.Bacheca = Object.freeze({ elenco });
    return;
  }

  const $ = id => document.getElementById(id);
  const nodo = (tag, classe, testo) => {
    const n = document.createElement(tag);
    if (classe) n.className = classe;
    if (testo !== undefined) n.textContent = testo;
    return n;
  };
  const riduciMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
  // ✕ per chiudere il foglio aperto (nota o comunicazione): un cerchio oro appena fuori dall'angolo in alto a destra,
  // dritto anche quando il foglio è storto (stile in bacheca.css, .bc-chiudi)
  function tastoChiudi(nome, azione) {
    const tasto = nodo('button', 'bc-chiudi');
    tasto.type = 'button';
    tasto.title = nome;
    tasto.setAttribute('aria-label', nome);
    tasto.addEventListener('click', azione);
    return tasto;
  }
  let note = elenco();
  // Comunicazioni ufficiali: una lista a parte, accanto alle note ("storecraft_bacheca_comunicazioni_<negozio>"), ognuna
  // con una scadenza; scadute spariscono da sole dalla bacheca (vedi "Comunicazioni ufficiali" più sotto)
  const chiaveComunicazioni = `storecraft_bacheca_comunicazioni_${NEGOZIO}`;
  function elencoComunicazioni() {
    try {
      const lista = JSON.parse(localStorage.getItem(chiaveComunicazioni) || '[]');
      return Array.isArray(lista) ? lista : [];
    } catch (errore) {
      console.error('Lettura delle comunicazioni non riuscita.', errore);
      return [];
    }
  }
  function salvaComunicazioni(lista) {
    try {
      localStorage.setItem(chiaveComunicazioni, JSON.stringify(lista));
      return true;
    } catch (errore) {
      console.error('Salvataggio delle comunicazioni non riuscito.', errore);
      return false;
    }
  }
  let comunicazioni = elencoComunicazioni();
  let aperta = null;          // id della nota nell'editor
  let cancellazione = false;  // modalità cancellazione: le note tremano e si selezionano
  const selezionate = new Set();
  let elementiCreati = 0;     // per sfasare il tremolio delle note
  let primaVolta = true;      // all'apertura della pagina i post-it cadono sulla bacheca

  const ordinate = () => [...note].sort((a, b) => b.creata - a.creata);
  const titoloDi = nota => nota.titolo.trim() || nota.testo.trim().split('\n')[0].slice(0, 40) || 'Nota senza titolo';
  const quando = tempo => new Date(tempo).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });


  // Misure della bacheca (variabili CSS di .bc-griglia): larghezza minima di una colonna, altezza di una riga, spazio
  function misure(griglia) {
    const stile = getComputedStyle(griglia);
    return {
      colonna: parseFloat(stile.getPropertyValue('--bc-colonna')) || 180,
      riga: parseFloat(stile.getPropertyValue('--bc-riga')) || 165,
      spazio: parseFloat(stile.getPropertyValue('--bc-spazio')) || 26
    };
  }

  // Disposizione in ordine di tempo: i post-it si mettono uno alla volta, dal più recente, nella colonna (o nelle due
  // colonne vicine, per i formati larghi) più libera in alto. Così restano incastrati tra loro ma le note più recenti
  // stanno sempre in alto. Ogni post-it ha anche un piccolo spostamento suo (dal seme), come attaccato a mano.
  function disponi(griglia, elementi, lista) {
    const { colonna, riga, spazio } = misure(griglia);
    const larghezza = griglia.clientWidth;
    const colonne = Math.max(1, Math.floor((larghezza + spazio) / (colonna + spazio)));
    const passo = (larghezza - spazio * (colonne - 1)) / colonne;
    const altezze = new Array(colonne).fill(0);
    elementi.forEach((el, i) => {
      const forma = formato(lista[i]);
      const span = colonne > 1 && (forma === 'largo' || forma === 'grande') ? 2 : 1;
      const righe = forma === 'alto' || forma === 'grande' ? 2 : 1;
      // la colonna (o la coppia) che lascia il post-it più in alto; a parità, la più a sinistra
      let migliore = 0;
      let alto = Infinity;
      for (let c = 0; c <= colonne - span; c++) {
        const cima = Math.max(...altezze.slice(c, c + span));
        if (cima < alto) { alto = cima; migliore = c; }
      }
      const altezza = riga * righe + spazio * (righe - 1);
      const seme = lista[i].seme || 0;
      const dx = (seme % 13) - 6;          // da -6 a +6 px
      const dy = (Math.floor(seme / 13) % 11) - 5;
      el.style.left = `${migliore * (passo + spazio) + dx}px`;
      el.style.top = `${alto + dy}px`;
      el.style.width = `${passo * span + spazio * (span - 1)}px`;
      el.style.height = `${altezza}px`;
      for (let c = migliore; c < migliore + span; c++) altezze[c] = alto + altezza + spazio;
    });
    const totale = Math.max(0, ...altezze) - spazio;
    griglia.style.height = `${totale}px`;
    return totale;
  }

  // posizioni prima di ridisegnare, per far scivolare i post-it al loro nuovo posto (FLIP)
  function posizioni() {
    const mappa = new Map();
    bacheca.querySelectorAll('[data-id]').forEach(el => mappa.set(el.dataset.id, el.getBoundingClientRect()));
    return mappa;
  }

  function scivola(prima) {
    if (riduciMovimento.matches || !prima.size) return;
    bacheca.querySelectorAll('[data-id]').forEach(el => {
      const vecchia = prima.get(el.dataset.id);
      if (!vecchia) return;
      const nuova = el.getBoundingClientRect();
      const dx = vecchia.left - nuova.left;
      const dy = vecchia.top - nuova.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      const giro = el.style.getPropertyValue('--giro') || '0deg';
      el.animate([
        { transform: `translate(${dx}px, ${dy}px) rotate(${giro})` },
        { transform: `rotate(${giro})` }
      ], { duration: 480, easing: 'cubic-bezier(.2, .9, .3, 1.1)' });
    });
  }

  // ordine casuale per la caduta all'apertura: i post-it arrivano alla rinfusa, non in fila
  function mescolati(quanti) {
    const ordine = [...Array(quanti).keys()];
    for (let i = ordine.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ordine[i], ordine[j]] = [ordine[j], ordine[i]];
    }
    return ordine;
  }

  // ----- Gruppi per settimana -----
  // La settimana in corso (dal lunedì alla domenica) si vede sempre in BACHECA NORMALE, i post-it aperti, anche se sono
  // tanti, e la pagina si scorre; le settimane passate vanno in BACHECA COMPATTA, piccole etichette con il titolo. La
  // bacheca si divide per settimana, dalla più
  // recente, con sopra ogni gruppo una scritta a mano («Settimana dal 5 all'11 ottobre»), quando le note sono tante (più
  // di SOGLIA_SETTIMANE) o quando c'è almeno una nota di una settimana passata. Se oggi sono state scritte almeno
  // NOTE_OGGI note, quelle di oggi stanno in un gruppo a sé, in cima: «Solo oggi, domenica 11 ottobre, hai 5 note in
  // bacheca».
  const SOGLIA_SETTIMANE = 12;
  const NOTE_OGGI = 5;
  const inizioGiorno = tempo => { const d = new Date(tempo); d.setHours(0, 0, 0, 0); return d; };
  function inizioSettimana(tempo) {
    const d = inizioGiorno(tempo);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));   // lunedì
    return d;
  }
  // «dal 5 all'11 ottobre», «dal 28 settembre al 4 ottobre» (l'anno solo se non è quello di oggi)
  function titoloSettimana(lunedi) {
    const domenica = new Date(lunedi);
    domenica.setDate(domenica.getDate() + 6);
    const mese = d => d.toLocaleDateString('it-IT', { month: 'long' });
    const anno = domenica.getFullYear() !== new Date().getFullYear() ? ` ${domenica.getFullYear()}` : '';
    const al = [8, 11].includes(domenica.getDate()) ? 'all\'' : 'al ';
    const primo = lunedi.getMonth() === domenica.getMonth() ? `${lunedi.getDate()}` : `${lunedi.getDate()} ${mese(lunedi)}`;
    return `Settimana dal ${primo} ${al}${domenica.getDate()} ${mese(domenica)}${anno}`;
  }
  const scrittaNote = n => (n === 1 ? 'nota' : 'note');
  function gruppi(lista) {
    const oggi = inizioGiorno(Date.now()).getTime();
    const diOggi = lista.filter(nota => nota.creata >= oggi);
    const soloOggi = diOggi.length >= NOTE_OGGI;
    const questaSettimana = inizioSettimana(Date.now()).getTime();
    const passate = lista.some(nota => nota.creata < questaSettimana);
    if (lista.length <= SOGLIA_SETTIMANE && !soloOggi && !passate) return [{ titolo: null, note: lista, vista: 'normale' }];
    const elenco = [];
    if (soloOggi) {
      const data = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
      elenco.push({ titolo: [`Solo oggi, ${data}, hai `, nodo('strong', 'bc-numero', String(diOggi.length)), ` ${scrittaNote(diOggi.length)} in bacheca`], note: diOggi, vista: 'normale' });
    }
    const settimane = new Map();
    lista.filter(nota => !(soloOggi && nota.creata >= oggi)).forEach(nota => {
      const chiave = inizioSettimana(nota.creata).getTime();
      if (!settimane.has(chiave)) settimane.set(chiave, []);
      settimane.get(chiave).push(nota);
    });
    // in bacheca normale la settimana in corso, in bacheca compatta quelle passate
    settimane.forEach((note, chiave) => elenco.push({ titolo: [titoloSettimana(new Date(chiave))], note, vista: chiave >= questaSettimana ? 'normale' : 'compatta' }));
    return elenco;
  }

  function disegna() {
    const prima = primaVolta ? new Map() : posizioni();
    const lista = ordinate();
    // promemoria scritto a mano: Oggi, domenica 11 ottobre, hai 12 note in bacheca!
    const oggi = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    // il numero di note in grassetto (oro nel tema scuro, rosso mattone nel chiaro: .bc-numero)
    const numero = nodo('strong', 'bc-numero', String(lista.length));
    $('info').replaceChildren(...(!lista.length ? [`Oggi, ${oggi}, nessuna nota in bacheca.`]
      : [`Oggi, ${oggi}, hai `, numero, ` ${scrittaNote(lista.length)} in bacheca!`]));
    // le comunicazioni ufficiali in cima, in una sezione a sé (null se non ce ne sono)
    const sezioneCom = sezioneComunicazioni();
    bacheca.classList.toggle('in-cancellazione', cancellazione);
    if (!lista.length) {
      const vuota = nodo('div', 'bc-vuota');
      vuota.append(nodo('strong', '', 'Bacheca'), 'Ancora nessun post-it. Premi il pulsante con il + qui sopra e scrivi un promemoria, un ordine, un numero di telefono…');
      bacheca.replaceChildren(...(sezioneCom ? [sezioneCom] : [vuota]));
      if (!primaVolta) scivola(prima);
      primaVolta = false;
      return;
    }
    const crea = (tipo, note) => note.map(nota => {
      const decoro = nota.decoro === 'puntina' ? 'nastro' : nota.decoro;
      const nastro = decoro === 'nastro' ? ` nastro-${(nota.seme || 0) % 4}` : '';
      const el = nodo('button', tipo === 'post-it' ? `bc-nota ${formato(nota)} ${decoro}${nastro}` : 'bc-etichetta');
      el.type = 'button';
      el.dataset.id = nota.id;
      el.style.setProperty('--carta', CARTE[nota.carta % CARTE.length]);
      el.style.setProperty('--giro', `${tipo === 'post-it' ? nota.giro : nota.giro / 2}deg`);
      el.setAttribute('aria-label', `Apri la nota ${titoloDi(nota)}`);
      if (tipo === 'post-it') {
        // senza titolo il post-it mostra solo il testo (il titolo ricavato dal testo serve alle etichette)
        if (nota.sticker) el.append(nodo('span', 'bc-sticker', nota.sticker));
        if (nota.titolo.trim()) el.append(nodo('h2', 'bc-nota-titolo', nota.titolo.trim()));
        el.append(nodo('p', 'bc-nota-testo', nota.testo), nodo('span', 'bc-nota-data', quando(nota.modificata)));
        if (nota.nuova) el.append(nodo('span', 'bc-da-leggere', 'nuova'));   // ancora da leggere
      } else {
        el.textContent = nota.sticker ? `${nota.sticker} ${titoloDi(nota)}` : titoloDi(nota);
        if (nota.nuova) el.prepend(nodo('span', 'bc-da-leggere-punto'));   // pallino rosso: ancora da leggere
      }
      // in modalità cancellazione un tocco seleziona la nota invece di aprirla; il pallino in alto a sinistra lo mostra
      el.append(nodo('span', 'bc-seleziona'));
      el.style.setProperty('--i', String(elementiCreati++ % 7));
      if (selezionate.has(nota.id)) el.classList.add('selezionata');
      if (cancellazione) el.setAttribute('aria-pressed', String(selezionate.has(nota.id)));
      el.addEventListener('click', () => (cancellazione ? selezionaNota(nota.id, el) : apri(nota.id)));
      return el;
    });
    // un gruppo: la scritta a mano (se c'è) e il contenitore dei suoi post-it o delle sue etichette
    const sezioni = gruppi(lista);
    bacheca.classList.toggle('in-cancellazione', cancellazione);
    const contenitori = [];
    const elementi = [];
    bacheca.replaceChildren(...sezioni.map(gruppo => {
      const tipo = gruppo.vista === 'normale' ? 'post-it' : 'etichette';   // bacheca normale o compatta
        const sezione = nodo('section', 'bc-gruppo');
        // con poche note il gruppo non ha titolo; sotto le comunicazioni ufficiali prende «Le note», per distinguere le sezioni
        const scritta = gruppo.titolo || (sezioneCom ? ['Le note'] : null);
        if (scritta) {
          const titolo = nodo('h2', 'bc-gruppo-titolo');
          // il testo in un solo elemento, così la linea che segue (::after) non lo spezza
          const testo = nodo('span');
          testo.append(...scritta.map(parte => (typeof parte === 'string' ? parte : parte.cloneNode(true))));
          titolo.append(testo);
          sezione.append(titolo);
        }
        const contenitore = nodo('div', tipo === 'post-it' ? 'bc-griglia' : 'bc-elenco');
        const suoi = crea(tipo, gruppo.note);
        contenitore.append(...suoi);
        sezione.append(contenitore);
        contenitori.push(contenitore);
        elementi.push(...suoi);
        return sezione;
    }));
    if (sezioneCom) bacheca.prepend(sezioneCom);
    // i post-it aperti si dispongono in colonne, in ordine di tempo
    contenitori.forEach((contenitore, i) => {
      if (contenitore.classList.contains('bc-griglia')) disponi(contenitore, [...contenitore.children], sezioni[i].note);
    });
    if (primaVolta && !riduciMovimento.matches) {
      const ordine = mescolati(elementi.length);
      elementi.forEach((el, i) => el.style.setProperty('--n', ordine[i]));
      contenitori.forEach(c => c.classList.add('entra'));
      setTimeout(() => contenitori.forEach(c => c.classList.remove('entra')), 700 + lista.length * 55);
    } else {
      scivola(prima);
    }
    primaVolta = false;
  }

  // ----- Comunicazioni ufficiali -----
  // Accanto alle note, le comunicazioni ufficiali (NUOVA COMUNICAZIONE, il foglio ad anelli): scritte su un foglio di
  // quaderno ad anelli, a righe, con il margine rosso, in una sezione a sé in cima alla bacheca («Comunicazioni
  // ufficiali», con il titolo in blu inchiostro). Ognuna ha una scadenza, scelta quando la si scrive (DURATE, dalla
  // creazione): scaduta sparisce da sola dalla bacheca. Si cancellano dal foglio (ELIMINA) o con CANCELLA NOTE, sempre
  // dopo una conferma: «Sei sicuro di volerla cancellare? È una Comunicazione Ufficiale».
  const UN_GIORNO = 24 * 60 * 60 * 1000;
  const DURATE = [[1, '1 giorno'], [3, '3 giorni'], [7, '1 settimana'], [14, '2 settimane'], [30, '1 mese'], [90, '3 mesi']];
  const DURATA_INIZIALE = 7;
  // Foto delle comunicazioni: una per comunicazione, allegata dal telefono (fotocamera o galleria) o dal computer. Le foto
  // stanno in IndexedDB (database "storecraft-bacheca-foto", archivio "foto", chiave "<negozio>:<id>"), che ha molto più
  // spazio del localStorage; la comunicazione ricorda solo che ha la foto (foto: true). All'importazione una foto grande
  // si riduce: il lato più lungo al massimo LATO_FOTO px, JPEG di qualità 0,85 (qualche centinaio di KB)
  const LATO_FOTO = 1600;
  const chiaveFoto = id => `${NEGOZIO}:${id}`;
  let databaseFoto = null;
  function apriDatabaseFoto() {
    databaseFoto ||= new Promise((ok, ko) => {
      const richiesta = indexedDB.open('storecraft-bacheca-foto', 1);
      richiesta.onupgradeneeded = () => richiesta.result.createObjectStore('foto');
      richiesta.onsuccess = () => ok(richiesta.result);
      richiesta.onerror = () => ko(richiesta.error);
    });
    return databaseFoto;
  }
  async function archivioFoto(modo, operazione) {
    const db = await apriDatabaseFoto();
    return new Promise((ok, ko) => {
      const transazione = db.transaction('foto', modo);
      const richiesta = operazione(transazione.objectStore('foto'));
      transazione.oncomplete = () => ok(richiesta.result);
      transazione.onerror = () => ko(transazione.error);
    });
  }
  const leggiFoto = id => archivioFoto('readonly', archivio => archivio.get(chiaveFoto(id)));
  const salvaFoto = (id, blob) => archivioFoto('readwrite', archivio => archivio.put(blob, chiaveFoto(id)));
  const urlFoto = new Map();   // id → indirizzo della foto già letta, per non rileggerla a ogni disegno
  function dimenticaFoto(id) {
    if (urlFoto.has(id)) URL.revokeObjectURL(urlFoto.get(id));
    urlFoto.delete(id);
  }
  function togliFoto(id) {
    dimenticaFoto(id);
    return archivioFoto('readwrite', archivio => archivio.delete(chiaveFoto(id))).catch(errore => console.error('Foto non cancellata.', errore));
  }
  function mostraFoto(img, id) {
    if (urlFoto.has(id)) { img.src = urlFoto.get(id); return; }
    leggiFoto(id).then(blob => {
      if (!blob) return;
      urlFoto.set(id, URL.createObjectURL(blob));
      img.src = urlFoto.get(id);
    }).catch(errore => console.error('Foto non letta.', errore));
  }
  // riduce la foto (e la gira come la mostra il telefono: il browser applica l'orientamento della foto)
  async function riduciFoto(file) {
    const indirizzo = URL.createObjectURL(file);
    try {
      const immagine = await new Promise((ok, ko) => {
        const img = new Image();
        img.onload = () => ok(img);
        img.onerror = () => ko(new Error('Immagine non leggibile'));
        img.src = indirizzo;
      });
      const scala = Math.min(1, LATO_FOTO / Math.max(immagine.naturalWidth, immagine.naturalHeight));
      const tela = document.createElement('canvas');
      tela.width = Math.round(immagine.naturalWidth * scala);
      tela.height = Math.round(immagine.naturalHeight * scala);
      const ctx = tela.getContext('2d');
      ctx.fillStyle = '#fff';   // le parti trasparenti (PNG) diventano bianche, non nere
      ctx.fillRect(0, 0, tela.width, tela.height);
      ctx.drawImage(immagine, 0, 0, tela.width, tela.height);
      return await new Promise(ok => tela.toBlob(ok, 'image/jpeg', 0.85));
    } finally {
      URL.revokeObjectURL(indirizzo);
    }
  }
  // all'apertura: le foto rimaste senza comunicazione (scadute o cancellate altrove) si tolgono; il browser non deve
  // cancellare l'archivio da solo quando lo spazio scarseggia
  navigator.storage?.persist?.().catch(() => {});
  apriDatabaseFoto().then(() => archivioFoto('readonly', archivio => archivio.getAllKeys())).then(chiavi => {
    const vive = new Set(comunicazioni.filter(c => c.foto).map(c => chiaveFoto(c.id)));
    chiavi.filter(k => String(k).startsWith(`${NEGOZIO}:`) && !vive.has(k)).forEach(k => togliFoto(String(k).slice(NEGOZIO.length + 1)));
  }).catch(() => {});

  // le scadute si tolgono all'apertura e poi a ogni minuto
  function togliScadute() {
    const rimaste = comunicazioni.filter(com => com.scadenza > Date.now());
    comunicazioni.filter(com => com.scadenza <= Date.now() && com.foto).forEach(com => togliFoto(com.id));
    if (rimaste.length === comunicazioni.length) return false;
    comunicazioni = rimaste;
    salvaComunicazioni(comunicazioni);
    return true;
  }
  togliScadute();
  // «Scade il 18 ottobre, tra 7 giorni», «Scade domani alle 18:30», «Scade oggi alle 18:30»
  function scritturaScadenza(scadenza) {
    const giorno = new Date(scadenza).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
    const ora = new Date(scadenza).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const giorni = Math.round((inizioGiorno(scadenza) - inizioGiorno(Date.now())) / UN_GIORNO);
    if (giorni <= 0) return `Scade oggi alle ${ora}`;
    if (giorni === 1) return `Scade domani alle ${ora}`;
    return `Scade il ${giorno}, tra ${giorni} giorni`;
  }

  // Commenti alle comunicazioni: piccoli post-it attaccati accanto al foglio (com.commenti, dal più vecchio), ognuno con
  // il testo (al massimo MAX_COMMENTO caratteri), il colore della carta, un'inclinazione sua e la data; sulla bacheca se
  // ne vedono gli ultimi COMMENTI_VISIBILI, tutti nel foglio aperto, dove si aggiungono e si tolgono
  const MAX_COMMENTO = 300;
  const COMMENTI_VISIBILI = 3;
  const quandoCommento = tempo => new Date(tempo).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  function notaCommento(commento, tag = 'div') {
    const nota = nodo(tag, 'bc-com-nota');
    nota.style.setProperty('--carta', CARTE[commento.carta % CARTE.length]);
    nota.style.setProperty('--giro', `${commento.giro || 0}deg`);
    nota.append(nodo('span', 'bc-com-nota-testo', commento.testo), nodo('span', 'bc-com-nota-data', quandoCommento(commento.creata)));
    return nota;
  }

  // la sezione delle comunicazioni sulla bacheca: un foglio ad anelli per comunicazione, dalla più recente
  function sezioneComunicazioni() {
    if (!comunicazioni.length) return null;
    const sezione = nodo('section', 'bc-gruppo bc-gruppo-com');
    const titolo = nodo('h2', 'bc-gruppo-titolo');
    const testo = nodo('span');
    testo.append('Comunicazioni ufficiali ', nodo('strong', 'bc-numero-com', String(comunicazioni.length)));
    titolo.append(testo);
    const fogli = nodo('div', 'bc-fogli');
    fogli.append(...[...comunicazioni].sort((a, b) => b.creata - a.creata).map(com => {
      const el = nodo('button', 'bc-com');
      el.type = 'button';
      el.dataset.id = com.id;
      el.style.setProperty('--giro', `${com.giro || 0}deg`);
      el.style.setProperty('--i', String(elementiCreati++ % 7));
      el.setAttribute('aria-label', `Apri la comunicazione ${com.titolo.trim() || 'senza titolo'}`);
      const scade = nodo('span', 'bc-com-scadenza', scritturaScadenza(com.scadenza));
      if (com.scadenza - Date.now() < UN_GIORNO) scade.classList.add('presto');
      el.append(nodo('span', 'bc-com-anelli'), nodo('span', 'bc-com-etichetta', 'Comunicazione ufficiale'));
      if (com.titolo.trim()) el.append(nodo('h3', 'bc-com-titolo', com.titolo.trim()));
      if (com.foto) {
        const foto = nodo('img', 'bc-com-immagine');
        foto.alt = '';
        mostraFoto(foto, com.id);
        el.append(foto);
      }
      el.append(nodo('p', 'bc-com-testo', com.testo), scade, nodo('span', 'bc-seleziona'));
      if (selezionate.has(com.id)) el.classList.add('selezionata');
      if (cancellazione) el.setAttribute('aria-pressed', String(selezionate.has(com.id)));
      el.addEventListener('click', () => (cancellazione ? selezionaNota(com.id, el) : apriComunicazione(com.id)));
      // accanto al foglio i commenti, come piccoli post-it attaccati di fianco: gli ultimi tre, «+ altri N» e + COMMENTA
      const blocco = nodo('div', 'bc-com-blocco');
      const colonna = nodo('div', 'bc-com-note');
      const commenti = com.commenti || [];
      if (commenti.length > COMMENTI_VISIBILI) {
        const nascosti = commenti.length - COMMENTI_VISIBILI;
        const altri = nodo('button', 'bc-com-altri', nascosti === 1 ? '+ 1 altro commento' : `+ altri ${nascosti} commenti`);
        altri.type = 'button';
        altri.addEventListener('click', () => { if (!cancellazione) apriComunicazione(com.id); });
        colonna.append(altri);
      }
      colonna.append(...commenti.slice(-COMMENTI_VISIBILI).map(commento => {
        const nota = notaCommento(commento, 'button');
        nota.type = 'button';
        nota.setAttribute('aria-label', `Commento: ${commento.testo}`);
        nota.addEventListener('click', () => { if (!cancellazione) apriComunicazione(com.id); });
        return nota;
      }));
      const commenta = nodo('button', 'bc-com-commenta', '+ Commenta');
      commenta.type = 'button';
      commenta.addEventListener('click', () => { if (!cancellazione) apriComunicazione(com.id, true); });
      colonna.append(commenta);
      blocco.append(el, colonna);
      return blocco;
    }));
    sezione.append(titolo, fogli);
    return sezione;
  }

  // Conferma nello stile STORE // CRAFT, nei colori del tema: titolo in Cinzel oro, testo, ANNULLA e il pulsante rosso.
  // Risponde true se si conferma; Esc, ANNULLA o un clic fuori rispondono false
  function conferma({ titolo, testo, si }) {
    return new Promise(risposta => {
      const veloConferma = nodo('div', 'bc-velo bc-conferma-velo');
      const box = nodo('div', 'bc-conferma');
      box.setAttribute('role', 'alertdialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-labelledby', 'bcConfermaTitolo');
      const h = nodo('h2', '', titolo);
      h.id = 'bcConfermaTitolo';
      const no = nodo('button', 'bc-conferma-no', 'Annulla');
      const ok = nodo('button', 'bc-conferma-si', si);
      no.type = 'button';
      ok.type = 'button';
      const comandi = nodo('div', 'bc-conferma-comandi');
      comandi.append(no, ok);
      box.append(h, nodo('p', '', testo), comandi);
      veloConferma.append(box);
      const prima = document.activeElement;
      // Esc chiude solo la conferma (prima degli altri ascoltatori della pagina)
      const tasti = evento => {
        if (evento.key !== 'Escape') return;
        evento.stopImmediatePropagation();
        fine(false);
      };
      function fine(valore) {
        veloConferma.remove();
        window.removeEventListener('keydown', tasti, true);
        prima?.focus?.();
        risposta(valore);
      }
      no.addEventListener('click', () => fine(false));
      ok.addEventListener('click', () => fine(true));
      veloConferma.addEventListener('click', evento => { if (evento.target === veloConferma) fine(false); });
      window.addEventListener('keydown', tasti, true);
      document.body.append(veloConferma);
      no.focus();
    });
  }
  const confermaComunicazioni = (quante, conNote = 0) => conferma({
    titolo: quante === 1 ? 'Sei sicuro di volerla cancellare?' : 'Sei sicuro di volerle cancellare?',
    testo: (quante === 1 ? 'È una Comunicazione Ufficiale.' : `Sono ${quante} Comunicazioni Ufficiali.`)
      + (conNote ? ` Insieme a ${conNote === 1 ? 'una nota' : `${conNote} note`}.` : ''),
    si: quante === 1 ? 'Cancella la comunicazione' : 'Cancella'
  });

  // Il foglio della comunicazione, per scriverla: titolo, testo su righe da quaderno, scadenza, ELIMINA e FATTO
  // (Esc o un clic fuori chiudono); si salva da solo mentre si scrive e una comunicazione lasciata vuota sparisce
  const comVelo = nodo('div', 'bc-velo');
  comVelo.hidden = true;
  const comFoglio = nodo('div', 'bc-com-foglio');
  comFoglio.id = 'comFoglio';
  comFoglio.setAttribute('role', 'dialog');
  comFoglio.setAttribute('aria-modal', 'true');
  comFoglio.setAttribute('aria-label', 'Comunicazione ufficiale');
  const comTitolo = nodo('input');
  comTitolo.type = 'text';
  comTitolo.placeholder = 'Titolo della comunicazione';
  comTitolo.autocomplete = 'off';
  comTitolo.maxLength = MAX_TITOLO;
  comTitolo.setAttribute('aria-label', 'Titolo della comunicazione');
  const comTesto = nodo('textarea');
  comTesto.placeholder = 'Scrivi qui la comunicazione per tutto lo staff…';
  comTesto.maxLength = MAX_TESTO;
  comTesto.setAttribute('aria-label', 'Testo della comunicazione');
  // ALLEGA FOTO: dal telefono apre fotocamera o galleria, dal computer la scelta del file; la foto si vede sotto il titolo,
  // con TOGLI LA FOTO
  const comFile = nodo('input');
  comFile.type = 'file';
  comFile.accept = 'image/*';
  comFile.hidden = true;
  const comAllega = nodo('button', 'bc-comando bc-allega');
  comAllega.type = 'button';
  comAllega.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h2.5l1.5-2h6l1.5 2H19a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/><circle cx="12" cy="13" r="3.5"/></svg>';
  const comAllegaTesto = nodo('span', '', 'Allega foto');
  comAllega.append(comAllegaTesto);
  const comAnteprima = nodo('div', 'bc-com-foto');
  comAnteprima.hidden = true;
  const comImmagine = nodo('img');
  comImmagine.alt = 'Foto allegata alla comunicazione';
  const comTogliFoto = nodo('button', 'bc-comando', 'Togli la foto');
  comTogliFoto.type = 'button';
  comAnteprima.append(comImmagine, comTogliFoto);
  const comDurata = nodo('select', 'bc-com-durata');
  comDurata.id = 'comDurata';
  comDurata.append(...DURATE.map(([giorni, nome]) => {
    const voce = nodo('option', '', nome);
    voce.value = String(giorni);
    return voce;
  }));
  const comScade = nodo('span', 'bc-com-scade', '');
  const rigaDurata = nodo('div', 'bc-com-riga');
  const etichettaDurata = nodo('label', '', 'Scadenza');
  etichettaDurata.htmlFor = 'comDurata';
  rigaDurata.append(etichettaDurata, comDurata, comScade, nodo('span', 'bc-spazio'), comAllega, comFile);
  const comSalvata = nodo('span', 'bc-salvata');
  comSalvata.setAttribute('role', 'status');
  const comElimina = nodo('button', 'bc-comando bc-elimina', 'Elimina');
  const comFatto = nodo('button', 'bc-comando bc-fatto', 'Fatto');
  comElimina.type = 'button';
  comFatto.type = 'button';
  const comComandi = nodo('div', 'bc-comandi');
  comComandi.append(comSalvata, nodo('span', 'bc-spazio'), comElimina, comFatto);
  comFoglio.append(nodo('span', 'bc-com-anelli'), nodo('span', 'bc-com-etichetta', 'Comunicazione ufficiale'), comTitolo, comAnteprima, comTesto, rigaDurata, comComandi);
  // Nel foglio aperto i commenti stanno attaccati sopra il bordo destro del foglio, come post-it appiccicati (sul telefono
  // sul bordo basso), ognuno con la ✕ per toglierlo. + COMMENTA, tra i comandi del foglio, fa comparire in fondo un
  // post-it giallo per scriverne uno nuovo (AGGIUNGI, o Invio; Maiuscolo + Invio va a capo): aggiunto, il commento
  // compare attaccato con gli altri e il post-it giallo sparisce. Senza commenti la colonna non c'è
  const comCommenti = nodo('aside', 'bc-com-commenti');
  comCommenti.id = 'comCommenti';
  comCommenti.setAttribute('aria-label', 'Commenti alla comunicazione');
  const comElenco = nodo('div', 'bc-com-elenco');
  const comNuovo = nodo('div', 'bc-com-nota bc-com-nuovo');
  comNuovo.hidden = true;
  const comCommento = nodo('textarea');
  comCommento.id = 'comCommento';
  comCommento.placeholder = 'Scrivi un commento…';
  comCommento.maxLength = MAX_COMMENTO;
  comCommento.setAttribute('aria-label', 'Nuovo commento');
  const comAggiungi = nodo('button', 'bc-comando bc-fatto', 'Aggiungi');
  comAggiungi.type = 'button';
  comNuovo.append(comCommento, comAggiungi);
  comCommenti.append(comElenco, comNuovo);
  const comApertura = nodo('div', 'bc-com-apertura');
  comApertura.append(comFoglio, comCommenti);
  comVelo.append(comApertura);
  const comCommenta = nodo('button', 'bc-comando bc-commenta-foglio', '+ Commenta');
  comCommenta.type = 'button';
  comElimina.before(comCommenta);
  // il post-it per scrivere il commento resta sempre ben visibile, da dovunque si commenti (+ COMMENTA sulla bacheca o
  // nel foglio): sul telefono (stessa soglia della colonna sotto il foglio) va in cima allo schermo, e di nuovo quando
  // la tastiera si apre e lo schermo utile si accorcia
  const comTelefono = window.matchMedia('(max-width: 900px)');
  function scriviCommento() {
    comNuovo.hidden = false;
    comCommenti.hidden = false;
    comApertura.classList.add('con-commenti');
    comCommento.focus({ preventScroll: true });
    // sul telefono il post-it va in cima allo schermo, sopra dove si apre la tastiera (.scrive dà lo spazio per scorrere fin lì)
    comApertura.classList.toggle('scrive', comTelefono.matches);
    const inVista = () => { if (!comNuovo.hidden) comNuovo.scrollIntoView({ block: comTelefono.matches ? 'start' : 'nearest' }); };
    requestAnimationFrame(inVista);
    if (!comTelefono.matches) return;
    window.visualViewport?.addEventListener('resize', inVista, { once: true });
    setTimeout(inVista, 400);
  }
  comCommenta.addEventListener('click', scriviCommento);
  function disegnaCommenti(com) {
    const commenti = com.commenti || [];
    comCommenti.hidden = !commenti.length && comNuovo.hidden;
    comApertura.classList.toggle('con-commenti', !comCommenti.hidden);
    comCommenta.textContent = commenti.length ? `+ Commenta (${commenti.length})` : '+ Commenta';
    comElenco.replaceChildren(...commenti.map(commento => {
      const nota = notaCommento(commento);
      const togli = nodo('button', 'bc-com-togli');
      togli.type = 'button';
      togli.title = 'Togli il commento';
      togli.setAttribute('aria-label', 'Togli il commento');
      togli.addEventListener('click', () => {
        com.commenti = (com.commenti || []).filter(c => c.id !== commento.id);
        if (!com.commenti.length) delete com.commenti;
        salvaComunicazioni(comunicazioni);
        disegnaCommenti(com);
        comSalvata.textContent = 'commento tolto';
      });
      nota.append(togli);
      return nota;
    }));
  }
  function aggiungiCommento() {
    const com = comunicazione();
    const testo = comCommento.value.trim().slice(0, MAX_COMMENTO);
    if (!com || !testo) return;
    const ora = Date.now();
    (com.commenti ||= []).push({
      id: `k${ora.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      testo,
      carta: Math.floor(Math.random() * CARTE.length),
      giro: Math.round((Math.random() * 6 - 3) * 10) / 10,
      creata: ora
    });
    comCommento.value = '';
    comNuovo.hidden = true;
    comApertura.classList.remove('scrive');
    comSalvata.textContent = salvaComunicazioni(comunicazioni) ? 'commento aggiunto' : 'non salvato: spazio del browser pieno?';
    disegnaCommenti(com);
    comElenco.lastElementChild?.scrollIntoView({ block: 'nearest' });
    comCommenta.focus();
  }
  comAggiungi.addEventListener('click', aggiungiCommento);
  comCommento.addEventListener('keydown', evento => {
    if (evento.key === 'Enter' && !evento.shiftKey) { evento.preventDefault(); aggiungiCommento(); }
  });
  document.body.append(comVelo);

  let comAperta = null;
  let comSalvataggio = 0;
  const comunicazione = () => comunicazioni.find(com => com.id === comAperta);
  const mostraScadenza = com => { comScade.textContent = scritturaScadenza(com.scadenza); };
  function apriComunicazione(id, conCommento = false) {
    const com = comunicazioni.find(c => c.id === id);
    if (!com) return;
    comAperta = id;
    ultimoFuocoCom = document.activeElement;
    comTitolo.value = com.titolo;
    comTesto.value = com.testo;
    comDurata.value = String(com.durata || DURATA_INIZIALE);
    mostraFotoFoglio(com);
    mostraScadenza(com);
    comSalvata.textContent = com.titolo || com.testo ? `modificata ${new Date(com.modificata).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : '';
    comVelo.hidden = false;
    // da + COMMENTA sulla bacheca si apre già il post-it per scrivere il commento
    comCommento.value = '';
    comNuovo.hidden = !conCommento;
    comApertura.classList.remove('scrive');
    disegnaCommenti(com);
    if (conCommento) scriviCommento();
    else (com.titolo ? comTesto : comTitolo).focus();
  }
  let ultimoFuocoCom = null;
  function scriviComunicazione() {
    const com = comunicazione();
    if (!com) return;
    com.titolo = comTitolo.value.slice(0, MAX_TITOLO);
    com.testo = comTesto.value.slice(0, MAX_TESTO);
    com.modificata = Date.now();
    clearTimeout(comSalvataggio);
    comSalvataggio = setTimeout(() => {
      comSalvata.textContent = salvaComunicazioni(comunicazioni) ? 'salvata' : 'non salvata: spazio del browser pieno?';
    }, 300);
  }
  // la scadenza conta dalla creazione: 1 settimana = una settimana dopo che la comunicazione è stata scritta
  comDurata.addEventListener('change', () => {
    const com = comunicazione();
    if (!com) return;
    com.durata = Number(comDurata.value);
    com.scadenza = com.creata + com.durata * UN_GIORNO;
    mostraScadenza(com);
    comSalvata.textContent = salvaComunicazioni(comunicazioni) ? 'salvata' : 'non salvata: spazio del browser pieno?';
  });
  function chiudiComunicazione() {
    if (comVelo.hidden) return;
    clearTimeout(comSalvataggio);
    comunicazioni = comunicazioni.filter(c => c.id !== comAperta || c.titolo.trim() || c.testo.trim() || c.foto || c.commenti?.length);
    salvaComunicazioni(comunicazioni);
    comAperta = null;
    comVelo.hidden = true;
    disegna();
    ultimoFuocoCom?.focus?.();
  }
  function nuovaComunicazione() {
    const ora = Date.now();
    const com = {
      id: `c${ora.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      titolo: '',
      testo: '',
      durata: DURATA_INIZIALE,
      scadenza: ora + DURATA_INIZIALE * UN_GIORNO,
      giro: Math.round((Math.random() * 2 - 1) * 10) / 10,   // appena storto, come un foglio appeso
      creata: ora,
      modificata: ora
    };
    comunicazioni.push(com);
    apriComunicazione(com.id);
  }
  comElimina.addEventListener('click', async () => {
    const com = comunicazione();
    if (!com) return;
    // una comunicazione appena iniziata e ancora vuota si toglie senza chiedere
    if ((com.titolo.trim() || com.testo.trim() || com.foto) && !(await confermaComunicazioni(1))) return;
    if (com.foto) togliFoto(com.id);
    comunicazioni = comunicazioni.filter(c => c.id !== com.id);
    salvaComunicazioni(comunicazioni);
    comAperta = null;
    comVelo.hidden = true;
    disegna();
  });
  comFatto.addEventListener('click', chiudiComunicazione);
  comFoglio.append(tastoChiudi('Chiudi la comunicazione', chiudiComunicazione));
  // foto nel foglio aperto: si vede, o si nasconde, e il pulsante dice ALLEGA o CAMBIA FOTO
  function mostraFotoFoglio(com) {
    comAnteprima.hidden = !com.foto;
    if (com.foto) mostraFoto(comImmagine, com.id);
    else comImmagine.removeAttribute('src');
    comAllegaTesto.textContent = com.foto ? 'Cambia foto' : 'Allega foto';
  }
  comAllega.addEventListener('click', () => comFile.click());
  comFile.addEventListener('change', async () => {
    const file = comFile.files[0];
    comFile.value = '';
    const com = comunicazione();
    if (!file || !com) return;
    comSalvata.textContent = 'preparo la foto…';
    try {
      const blob = await riduciFoto(file);
      await salvaFoto(com.id, blob);
      dimenticaFoto(com.id);
      com.foto = true;
      com.modificata = Date.now();
      salvaComunicazioni(comunicazioni);
      if (comAperta === com.id) mostraFotoFoglio(com);
      comSalvata.textContent = 'foto allegata';
    } catch (errore) {
      console.error('Foto non allegata.', errore);
      comSalvata.textContent = 'foto non allegata: il file è un\'immagine?';
    }
  });
  comTogliFoto.addEventListener('click', () => {
    const com = comunicazione();
    if (!com) return;
    togliFoto(com.id);
    delete com.foto;
    com.modificata = Date.now();
    salvaComunicazioni(comunicazioni);
    mostraFotoFoglio(com);
    comSalvata.textContent = 'foto tolta';
  });
  comTitolo.addEventListener('input', scriviComunicazione);
  comTesto.addEventListener('input', scriviComunicazione);
  comTitolo.addEventListener('keydown', evento => { if (evento.key === 'Enter') { evento.preventDefault(); comTesto.focus(); } });
  comVelo.addEventListener('click', evento => { if (evento.target === comVelo) chiudiComunicazione(); });
  $('nuovaCom').addEventListener('click', nuovaComunicazione);
  // a ogni minuto le comunicazioni scadute spariscono e le altre aggiornano «tra N giorni»
  setInterval(() => {
    if (!$('velo').hidden || !comVelo.hidden || cancellazione) return;
    togliScadute();
    disegna();
  }, 60 * 1000);

  // ----- Pulsanti e messaggi -----
  // NUOVA NOTA, CANCELLA NOTE e ANNULLA sono pulsanti a icona, come la pulsantiera della lista di stampa: il loro messaggio
  // (.bc-suggerimento) compare sotto al passaggio del mouse e sparisce da solo, e compare anche quando il pulsante cambia
  // stato (utile dal telefono, dove non c'è il passaggio del mouse)
  const DURATA_SUGGERIMENTO = 1800;
  function suggerisci(tasto, durata = DURATA_SUGGERIMENTO) {
    const fumetto = tasto.querySelector('.bc-suggerimento');
    if (!fumetto) return;
    clearTimeout(tasto.timerSuggerimento);
    fumetto.classList.add('is-visible');
    tasto.timerSuggerimento = setTimeout(() => fumetto.classList.remove('is-visible'), durata);
  }
  document.querySelectorAll('.bc-tasto').forEach(tasto => {
    tasto.addEventListener('mouseenter', () => suggerisci(tasto));
    tasto.addEventListener('mouseleave', () => {
      clearTimeout(tasto.timerSuggerimento);
      tasto.querySelector('.bc-suggerimento')?.classList.remove('is-visible');
    });
  });

  // ----- Cancella note -----
  // CANCELLA NOTE (il cestino), accanto a NUOVA NOTA, mette la bacheca in modalità cancellazione, come le app dell'iPhone
  // tenendo premuto: le note tremano e su ognuna compare un pallino; un tocco la seleziona (pallino rosso con la spunta).
  // Finché non c'è niente di selezionato il cestino esce senza cancellare; con note selezionate diventa rosso, con il
  // numero, e con un clic cancella tutte le note selezionate («Cancella 3 note»). Con note selezionate compare accanto
  // ANNULLA, che esce senza cancellare e toglie tutte le selezioni in una volta. Esc esce dalla modalità.
  const tastoCancella = $('cancella');
  function aggiornaCancella() {
    const n = selezionate.size;
    const messaggio = !cancellazione ? 'Seleziona note da cancellare'
      : !n ? 'Tocca le note da cancellare, o qui per uscire' : `Cancella ${n} ${scrittaNote(n)}`;
    $('cancellaTesto').textContent = messaggio;
    tastoCancella.setAttribute('aria-label', messaggio);
    $('cancellaConta').textContent = String(n);
    $('cancellaConta').hidden = !(cancellazione && n > 0);
    tastoCancella.classList.toggle('rosso', cancellazione && n > 0);
    $('annulla').hidden = !(cancellazione && n > 0);
    tastoCancella.setAttribute('aria-pressed', String(cancellazione));
    $('nuova').disabled = cancellazione;
    $('nuovaCom').disabled = cancellazione;
  }
  function selezionaNota(id, el) {
    if (selezionate.has(id)) selezionate.delete(id); else selezionate.add(id);
    el.classList.toggle('selezionata', selezionate.has(id));
    el.setAttribute('aria-pressed', String(selezionate.has(id)));
    aggiornaCancella();
    suggerisci(tastoCancella);
  }
  function esciCancellazione() {
    cancellazione = false;
    selezionate.clear();
    disegna();
    aggiornaCancella();
  }
  tastoCancella.addEventListener('click', async () => {
    if (!cancellazione) {
      if (!note.length && !comunicazioni.length) {
        $('cancellaTesto').textContent = 'Nessuna nota da cancellare';
        suggerisci(tastoCancella);
        setTimeout(aggiornaCancella, DURATA_SUGGERIMENTO + 200);
        return;
      }
      entraCancellazione();
      return;
    }
    if (!selezionate.size) { esciCancellazione(); return; }
    // le comunicazioni ufficiali si cancellano solo dopo la conferma
    const comScelte = comunicazioni.filter(c => selezionate.has(c.id)).length;
    const noteScelte = note.filter(n => selezionate.has(n.id)).length;
    if (comScelte && !(await confermaComunicazioni(comScelte, noteScelte))) return;
    comunicazioni.filter(c => selezionate.has(c.id) && c.foto).forEach(c => togliFoto(c.id));
    comunicazioni = comunicazioni.filter(c => !selezionate.has(c.id));
    salvaComunicazioni(comunicazioni);
    note = note.filter(n => !selezionate.has(n.id));
    salva(note);
    esciCancellazione();
  });
  $('annulla').addEventListener('click', esciCancellazione);

  // ----- Tieni premuto (telefono e tablet) -----
  // Come sull'iPhone: tenendo premuto il dito su una nota, un'etichetta o una comunicazione per TIENI_PREMUTO ms si entra
  // in modalità cancellazione con quella già selezionata (e il telefono vibra appena, dove si può). Spostando il dito (per
  // scorrere la pagina) non succede niente; il tocco che segue non apre né deseleziona la nota. Solo al tocco: con il
  // mouse resta il cestino
  const TIENI_PREMUTO = 550;
  const SELEZIONABILI = '.bc-nota, .bc-etichetta, .bc-com';
  let pressione = null;
  let ignoraTocco = false;
  function entraCancellazione(id) {
    cancellazione = true;
    selezionate.clear();
    if (id) selezionate.add(id);
    disegna();
    aggiornaCancella();
    suggerisci(tastoCancella, 3000);
  }
  const lascia = () => {
    if (!pressione) return;
    clearTimeout(pressione.timer);
    pressione = null;
  };
  bacheca.addEventListener('pointerdown', evento => {
    if (evento.pointerType !== 'touch' || cancellazione) return;
    const el = evento.target.closest(SELEZIONABILI);
    if (!el) return;
    lascia();
    pressione = {
      x: evento.clientX,
      y: evento.clientY,
      timer: setTimeout(() => {
        pressione = null;
        ignoraTocco = true;
        navigator.vibrate?.(15);
        entraCancellazione(el.dataset.id);
      }, TIENI_PREMUTO)
    };
  });
  bacheca.addEventListener('pointermove', evento => {
    if (pressione && Math.hypot(evento.clientX - pressione.x, evento.clientY - pressione.y) > 10) lascia();
  });
  ['pointercancel', 'pointerleave'].forEach(tipo => bacheca.addEventListener(tipo, lascia));
  bacheca.addEventListener('pointerup', () => {
    lascia();
    // il tocco che chiude il tieni premuto non deve arrivare alla nota (che è già stata ridisegnata)
    if (ignoraTocco) setTimeout(() => { ignoraTocco = false; }, 400);
  });
  bacheca.addEventListener('click', evento => {
    if (!ignoraTocco) return;
    evento.stopPropagation();
    evento.preventDefault();
  }, true);
  // niente menu del browser (copia, condividi…) tenendo premuto
  bacheca.addEventListener('contextmenu', evento => { if (evento.target.closest(SELEZIONABILI)) evento.preventDefault(); });

  // ----- Troppi post-it -----
  // Le note restano finché non le cancella l'utente. Oltre 100 un avviso propone di cancellarle tutte o di tenere solo
  // quelle dell'ultimo mese (scritte o modificate negli ultimi 30 giorni), oppure di lasciarle: all'apertura della pagina
  // e quando, scrivendone una nuova, si supera il limite.
  const LIMITE_NOTE = 100;
  const UN_MESE = 30 * 24 * 60 * 60 * 1000;
  let avvisoAperto = false;
  function avvisoTroppe() {
    if (note.length <= LIMITE_NOTE || avvisoAperto) return;
    avvisoAperto = true;
    const recenti = note.filter(n => Date.now() - n.modificata <= UN_MESE).length;
    const velo = nodo('div', 'bc-velo bc-avviso-velo');
    const box = nodo('div', 'bc-avviso');
    box.setAttribute('role', 'alertdialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'bnAvvisoTitolo');
    const titolo = nodo('h2', '', 'Hai parecchi post-it');
    titolo.id = 'bnAvvisoTitolo';
    const testo = nodo('p', '', `Sulla bacheca ci sono ${note.length} note. Vuoi fare un po' di ordine? `
      + `Le note dell'ultimo mese sono ${recenti}.`);
    const comandi = nodo('div', 'bc-avviso-comandi');
    const pulsante = (testoPulsante, classe, azione) => {
      const b = nodo('button', `bc-comando ${classe}`, testoPulsante);
      b.type = 'button';
      b.addEventListener('click', () => { azione(); chiudiAvviso(); });
      return b;
    };
    const chiudiAvviso = () => { velo.remove(); avvisoAperto = false; document.removeEventListener('keydown', esc); };
    const esc = evento => { if (evento.key === 'Escape') chiudiAvviso(); };
    comandi.append(
      pulsante('Tieni l\'ultimo mese', 'bc-fatto', () => { note = note.filter(n => Date.now() - n.modificata <= UN_MESE); salva(note); disegna(); }),
      pulsante('Cancella tutte', 'bc-elimina', () => {
        if (!confirm(`Cancellare tutte le ${note.length} note?`)) return;
        note = [];
        salva(note);
        disegna();
      }),
      pulsante('Lascia così', '', () => {}));
    box.append(titolo, testo, comandi);
    velo.append(box);
    document.body.append(velo);
    document.addEventListener('keydown', esc);
    comandi.firstChild.focus();
  }

  // ----- Editor -----
  const velo = $('velo');
  const foglio = $('foglio');
  const campoTitolo = $('notaTitolo');
  const campoTesto = $('notaTesto');
  let ultimoFuoco = null;
  let salvataggio = 0;

  // aprire un post-it lo segna come letto (toglie «nuova»), tranne quando si apre la nota appena creata per scriverla
  function apri(id, appenaCreata = false) {
    const nota = note.find(n => n.id === id);
    if (!nota) return;
    if (nota.nuova && !appenaCreata) { delete nota.nuova; salva(note); }
    aperta = id;
    ultimoFuoco = document.activeElement;
    foglio.style.setProperty('--carta', CARTE[nota.carta % CARTE.length]);
    segnaColore(nota.carta % CARTE.length);
    mostraSticker(nota);
    apriTavolozza();
    foglio.style.setProperty('--giro', `${nota.giro / 3}deg`);
    campoTitolo.value = nota.titolo;
    campoTesto.value = nota.testo;
    $('salvata').textContent = nota.titolo || nota.testo ? `modificata ${new Date(nota.modificata).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : '';
    velo.hidden = false;
    (nota.titolo ? campoTesto : campoTitolo).focus();
  }

  function scrivi() {
    const nota = note.find(n => n.id === aperta);
    if (!nota) return;
    nota.titolo = campoTitolo.value.slice(0, MAX_TITOLO);
    nota.testo = campoTesto.value.slice(0, MAX_TESTO);
    nota.modificata = Date.now();
    clearTimeout(salvataggio);
    salvataggio = setTimeout(() => {
      $('salvata').textContent = salva(note) ? 'salvata' : 'non salvata: spazio del browser pieno?';
    }, 300);
  }

  function chiudi() {
    if (velo.hidden) return;
    clearTimeout(salvataggio);
    // una nota lasciata vuota sparisce
    note = note.filter(n => n.id !== aperta || n.titolo.trim() || n.testo.trim());
    salva(note);
    aperta = null;
    velo.hidden = true;
    disegna();
    ultimoFuoco?.focus?.();
    avvisoTroppe();
  }

  function nuova() {
    const nota = nuovaNota(ordinate()[0]);
    note.push(nota);
    apri(nota.id, true);
  }

  // Colore scelto dall'utente: una fila di pallini, uno per carta, sotto il testo
  const NOMI_CARTE = ['Giallo', 'Rosa', 'Azzurro', 'Verdino', 'Arancio', 'Viola', 'Rosso', 'Ocra'];
  const colori = $('colori');
  colori.append(...CARTE.map((carta, i) => {
    const pallino = nodo('button', 'bc-colore');
    pallino.type = 'button';
    pallino.style.setProperty('--carta', carta);
    pallino.setAttribute('aria-label', NOMI_CARTE[i]);
    pallino.title = NOMI_CARTE[i];
    pallino.addEventListener('click', () => scegliColore(i));
    return pallino;
  }));
  function segnaColore(carta) {
    colori.querySelectorAll('.bc-colore').forEach((pallino, i) => pallino.setAttribute('aria-pressed', String(i === carta)));
  }
  function scegliColore(carta) {
    const nota = note.find(n => n.id === aperta);
    if (!nota) return;
    nota.carta = carta;
    // come CAMBIA ASPETTO il post-it si riattacca un po' storto in un altro modo (inclinazione nuova, ben diversa)
    let giro;
    do giro = nuovaNota(nota).giro; while (Math.abs(giro - nota.giro) < 1.2);
    nota.giro = giro;
    foglio.style.setProperty('--giro', `${giro / 3}deg`);
    foglio.style.setProperty('--carta', CARTE[carta]);
    segnaColore(carta);
    salva(note);
  }

  // ----- Emoji e sticker -----
  // Due iconcine, ognuna con la sua tavolozza: le EMOJI, sotto l'ultima riga del testo, mettono l'emoji dove si sta
  // scrivendo (titolo o testo); lo STICKER, nell'angolo in alto a destra del post-it, attacca lì un'emoji grande come un
  // adesivo (nota.sticker; con lo sticker attaccato l'iconcina diventa lo sticker stesso, e un tocco sullo stesso, o
  // «Togli lo sticker», lo toglie). Emoji scelte per il lavoro del negozio; si possono scrivere anche dalla tastiera.
  const EMOJI = ['✅', '❗', '⚠️', '⭐', '❤️', '🔥', '💡', '📌', '📞', '💬', '📦', '🚚', '🛒', '🛍️', '🏷️', '💶',
    '🧾', '📅', '⏰', '📝', '✂️', '🖨️', '🔑', '🎁', '👗', '👜', '👠', '🧥', '👔', '💎', '☀️', '❄️', '🎄', '🎉',
    '👍', '👏', '🙏', '😊', '😉', '😍'];
  const tastoEmoji = $('emojiTasto');
  const tavolozzaEmoji = $('emojiTavolozza');
  const tastoSticker = $('stickerTasto');
  const tavolozzaSticker = $('stickerTavolozza');
  const stickerFoglio = $('notaSticker');
  let ultimoCampo = campoTesto;
  campoTitolo.addEventListener('focus', () => { ultimoCampo = campoTitolo; });
  campoTesto.addEventListener('focus', () => { ultimoCampo = campoTesto; });

  function mostraSticker(nota) {
    stickerFoglio.textContent = nota?.sticker || '';
    tastoSticker.classList.toggle('ha-sticker', Boolean(nota?.sticker));
    $('togliSticker').hidden = !nota?.sticker;
  }
  // apre una tavolozza e chiude l'altra; senza argomento le chiude tutte e due
  function apriTavolozza(quale) {
    [[tavolozzaEmoji, tastoEmoji], [tavolozzaSticker, tastoSticker]].forEach(([tavolozza, tasto]) => {
      const mostra = tavolozza === quale && tavolozza.hidden;
      tavolozza.hidden = !mostra;
      tasto.setAttribute('aria-expanded', String(mostra));
    });
  }
  const tavolozzaAperta = () => !tavolozzaEmoji.hidden || !tavolozzaSticker.hidden;

  function metteEmoji(emoji) {
    // nel testo, dove c'era il cursore (rispettando il numero massimo di caratteri)
    const campo = ultimoCampo;
    if (campo.value.length + emoji.length > campo.maxLength) return;
    campo.setRangeText(emoji, campo.selectionStart, campo.selectionEnd, 'end');
    campo.focus();
    scrivi();
  }
  function attaccaSticker(emoji) {
    const nota = note.find(n => n.id === aperta);
    if (!nota) return;
    nota.sticker = nota.sticker === emoji ? '' : emoji;
    mostraSticker(nota);
    salva(note);
    apriTavolozza();
  }
  const voci = (griglia, azione) => $(griglia).append(...EMOJI.map(emoji => {
    const b = nodo('button', 'bc-emoji-voce', emoji);
    b.type = 'button';
    // tenere il cursore nel campo: il clic non gli toglie il fuoco
    b.addEventListener('mousedown', evento => evento.preventDefault());
    b.addEventListener('click', () => azione(emoji));
    return b;
  }));
  voci('emojiGriglia', metteEmoji);
  voci('stickerGriglia', attaccaSticker);
  tastoEmoji.addEventListener('mousedown', evento => evento.preventDefault());
  tastoEmoji.addEventListener('click', () => apriTavolozza(tavolozzaEmoji));
  tastoSticker.addEventListener('click', () => apriTavolozza(tavolozzaSticker));
  $('togliSticker').addEventListener('click', () => {
    const nota = note.find(n => n.id === aperta);
    if (!nota) return;
    nota.sticker = '';
    mostraSticker(nota);
    salva(note);
    apriTavolozza();
  });
  // un clic fuori dalle tavolozze le chiude
  foglio.addEventListener('click', evento => {
    if (tavolozzaAperta() && !evento.target.closest('.bc-emoji, #emojiTasto, #stickerTasto')) apriTavolozza();
  });

  // cambia aspetto: colore, dettaglio e inclinazione nuovi
  function cambiaAspetto() {
    const nota = note.find(n => n.id === aperta);
    if (!nota) return;
    let nuovo;
    do nuovo = nuovaNota(nota); while (nuovo.carta === nota.carta);   // il colore cambia sempre
    Object.assign(nota, { carta: nuovo.carta, decoro: nuovo.decoro, giro: nuovo.giro, seme: nuovo.seme });
    foglio.style.setProperty('--carta', CARTE[nota.carta]);
    segnaColore(nota.carta);
    foglio.style.setProperty('--giro', `${nota.giro / 3}deg`);
    salva(note);
  }

  function elimina() {
    const nota = note.find(n => n.id === aperta);
    if (!nota) return;
    if ((nota.titolo.trim() || nota.testo.trim()) && !confirm(`Eliminare la nota «${titoloDi(nota)}»?`)) return;
    note = note.filter(n => n.id !== aperta);
    salva(note);
    aperta = null;
    velo.hidden = true;
    disegna();
  }

  campoTitolo.maxLength = MAX_TITOLO;
  campoTesto.maxLength = MAX_TESTO;
  campoTitolo.addEventListener('input', scrivi);
  campoTesto.addEventListener('input', scrivi);
  campoTitolo.addEventListener('keydown', evento => { if (evento.key === 'Enter') { evento.preventDefault(); campoTesto.focus(); } });
  $('nuova').addEventListener('click', nuova);
  $('fatto').addEventListener('click', chiudi);
  foglio.append(tastoChiudi('Chiudi la nota', chiudi));
  $('aspetto').addEventListener('click', cambiaAspetto);
  $('elimina').addEventListener('click', elimina);
  velo.addEventListener('click', evento => { if (evento.target === velo) chiudi(); });
  // Esc chiude prima la tavolozza delle emoji, poi il post-it
  document.addEventListener('keydown', evento => {
    if (evento.key !== 'Escape') return;
    if (tavolozzaAperta()) { const tasto = tavolozzaSticker.hidden ? tastoEmoji : tastoSticker; apriTavolozza(); tasto.focus(); return; }
    if (!comVelo.hidden) { chiudiComunicazione(); return; }
    if (velo.hidden && cancellazione) { esciCancellazione(); return; }
    chiudi();
  });

  // cambiando la finestra la bacheca si risistema (post-it o etichette)
  let attesa = 0;
  // anche quando compare o sparisce la barra di scorrimento della pagina, che cambia la larghezza senza ridimensionare la
  // finestra: si guarda la larghezza della bacheca (solo la larghezza, non l'altezza che cambia a ogni disegno)
  let larghezzaBacheca = bacheca.clientWidth;
  new ResizeObserver(() => {
    if (bacheca.clientWidth === larghezzaBacheca) return;
    larghezzaBacheca = bacheca.clientWidth;
    clearTimeout(attesa);
    attesa = setTimeout(() => { if (velo.hidden && comVelo.hidden) disegna(); }, 150);
  }).observe(bacheca);
  // note scritte in un'altra scheda dello stesso negozio
  window.addEventListener('storage', evento => {
    if (evento.key === chiaveComunicazioni && comVelo.hidden) { comunicazioni = elencoComunicazioni(); togliScadute(); disegna(); return; }
    if (evento.key !== chiave(NEGOZIO) || aperta) return;
    note = elenco();
    disegna();
  });

  // i caratteri cambiano le misure: si disegna quando sono pronti
  // all'apertura, finita la caduta dei post-it, l'eventuale avviso dei troppi post-it; aperta dal banner della dashboard
  // (NUOVI MESSAGGI IN BACHECA, bacheca.html?nota=<id>) apre subito quel post-it, che così diventa letto
  const daAprire = new URLSearchParams(location.search).get('nota');
  if (daAprire) history.replaceState(null, '', location.pathname);
  (document.fonts?.ready || Promise.resolve()).then(() => {
    disegna();
    setTimeout(() => {
      if (daAprire && note.some(n => n.id === daAprire)) apri(daAprire);
      else avvisoTroppe();
    }, riduciMovimento.matches ? 0 : 900);
  });
  window.Bacheca = Object.freeze({ elenco });
})();
