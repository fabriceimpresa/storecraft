/* Bacheca (Utilità Cassa): post-it con un titolo e un testo libero, nella pagina bacheca.html del negozio, a
   schermo intero. Stile in assets/css/bacheca.css.
   - Le note stanno nel browser, una lista per negozio (localStorage, chiave "storecraft_bacheca_<negozio>", fino all'11 ottobre 2026 "storecraft_blocco_note_<negozio>"): solo
     testo, poche decine di KB anche con tante note. Come la lista di stampa e i loghi personali restano nel browser
     e nel computer in cui si scrivono.
   - Ogni post-it ha un aspetto suo, scelto quando nasce: colore della carta, inclinazione, dettaglio (nastro adesivo,
     angolo piegato o niente; il nastro in quattro versioni, dal seme della nota) e formato (quadrato, alto, largo, grande), che segue anche quanto testo c'è.
     La bacheca è una griglia che li incastra tra loro (grid-auto-flow: dense); aprendo la pagina cadono uno dopo l'altro
     e si posano, e quando la bacheca cambia (nota nuova, eliminata, finestra più stretta) si spostano animati.
   - Se i post-it non entrano nello schermo, o la finestra è stretta, diventano etichette con il solo titolo, cliccabili.
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
  let note = elenco();
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
  // La settimana in corso (dal lunedì alla domenica) si vede sempre con i post-it aperti, anche se sono tanti, e la pagina
  // si scorre; le settimane passate si chiudono in etichette con il titolo. La bacheca si divide per settimana, dalla più
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
    if (lista.length <= SOGLIA_SETTIMANE && !soloOggi && !passate) return [{ titolo: null, note: lista, aperto: true }];
    const elenco = [];
    if (soloOggi) {
      const data = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
      elenco.push({ titolo: [`Solo oggi, ${data}, hai `, nodo('strong', 'bc-numero', String(diOggi.length)), ` ${scrittaNote(diOggi.length)} in bacheca`], note: diOggi, aperto: true });
    }
    const settimane = new Map();
    lista.filter(nota => !(soloOggi && nota.creata >= oggi)).forEach(nota => {
      const chiave = inizioSettimana(nota.creata).getTime();
      if (!settimane.has(chiave)) settimane.set(chiave, []);
      settimane.get(chiave).push(nota);
    });
    // aperta solo la settimana in corso, chiuse in etichette quelle passate
    settimane.forEach((note, chiave) => elenco.push({ titolo: [titoloSettimana(new Date(chiave))], note, aperto: chiave >= questaSettimana }));
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
    if (!lista.length) {
      const vuota = nodo('div', 'bc-vuota');
      vuota.append(nodo('strong', '', 'Bacheca'), 'Ancora nessun post-it. Premi il pulsante con il + qui sopra e scrivi un promemoria, un ordine, un numero di telefono…');
      bacheca.replaceChildren(vuota);
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
      const tipo = gruppo.aperto ? 'post-it' : 'etichette';
        const sezione = nodo('section', 'bc-gruppo');
        if (gruppo.titolo) {
          const titolo = nodo('h2', 'bc-gruppo-titolo');
          // il testo in un solo elemento, così la linea che segue (::after) non lo spezza
          const testo = nodo('span');
          testo.append(...gruppo.titolo.map(parte => (typeof parte === 'string' ? parte : parte.cloneNode(true))));
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
  tastoCancella.addEventListener('click', () => {
    if (!cancellazione) {
      if (!note.length) {
        $('cancellaTesto').textContent = 'Nessuna nota da cancellare';
        suggerisci(tastoCancella);
        setTimeout(aggiornaCancella, DURATA_SUGGERIMENTO + 200);
        return;
      }
      cancellazione = true;
      selezionate.clear();
      disegna();
      aggiornaCancella();
      suggerisci(tastoCancella, 3000);
      return;
    }
    if (!selezionate.size) { esciCancellazione(); return; }
    note = note.filter(n => !selezionate.has(n.id));
    salva(note);
    esciCancellazione();
  });
  $('annulla').addEventListener('click', esciCancellazione);

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
  $('aspetto').addEventListener('click', cambiaAspetto);
  $('elimina').addEventListener('click', elimina);
  velo.addEventListener('click', evento => { if (evento.target === velo) chiudi(); });
  // Esc chiude prima la tavolozza delle emoji, poi il post-it
  document.addEventListener('keydown', evento => {
    if (evento.key !== 'Escape') return;
    if (tavolozzaAperta()) { const tasto = tavolozzaSticker.hidden ? tastoEmoji : tastoSticker; apriTavolozza(); tasto.focus(); return; }
    if (velo.hidden && cancellazione) { esciCancellazione(); return; }
    chiudi();
  });

  // cambiando la finestra la bacheca si risistema (post-it o etichette)
  let attesa = 0;
  window.addEventListener('resize', () => { clearTimeout(attesa); attesa = setTimeout(() => { if (velo.hidden) disegna(); }, 150); });
  // note scritte in un'altra scheda dello stesso negozio
  window.addEventListener('storage', evento => {
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
