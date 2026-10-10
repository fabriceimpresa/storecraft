/* Scelta del negozio nelle pagine di amministrazione dei loghi ufficiali (logoimport.html e logogestione.html, nella
   radice, non collegate dalle dashboard): le pagine sono una sola per i tre negozi e agiscono sul negozio scelto qui.
   Stile in assets/css/operatore.css (stile terminale delle sezioni operatore).

   Uso:
     <div data-admin-negozio></div>        qui compare il selettore dei negozi installati (LUXURY OUTLET / TEBE / OPHILYA)
     <span data-admin-nome-negozio>        riceve il nome del negozio scelto
     <span data-admin-cartella-negozio>    riceve la cartella del negozio scelto (luxury, tebe, ophilya)
     AdminNegozio.negozio                  negozio scelto
     AdminNegozio.oro()                    oro del negozio per la variante "gold" dei loghi (RGB)
     AdminNegozio.scegliProgetto()         Promise: cartella del progetto scelta e controllata (index.html e assets/negozi)
     AdminNegozio.cartelle(progetto)       Promise { logos, printlogos }: cartelle del negozio nella cartella progetto
     AdminNegozio.elencoVuoto()            testo di partenza di assets/logos/<negozio>/elenco.js, se non esiste
     AdminNegozio.alCambio(funzione)       chiamata quando si sceglie un altro negozio (prima di cambiare si può
                                           chiedere conferma con AdminNegozio.prima(funzione che restituisce true/false))
   La scelta resta per la scheda (sessionStorage), così ricaricando la pagina non si torna al primo negozio per sbaglio.
   Nomi e oro dei negozi vengono dalle loro schede (assets/negozi/, vedi negozi.js); si scelgono solo i negozi installati
   in questa copia (con un solo negozio il selettore mostra solo quello). */
(() => {
  // Negozi installati, con nome e oro (RGB) dalle loro schede
  const NEGOZI = Object.fromEntries(Negozi.installati.map(id => {
    const scheda = Negozi.scheda(id);
    return [id, { nome: scheda.nome, oro: [1, 3, 5].map(i => parseInt(scheda.oro.slice(i, i + 2), 16)) }];
  }));
  const CHIAVE = 'storecraft_admin_negozio';
  let negozio = Negozi.installati[0];
  try {
    if (NEGOZI[sessionStorage.getItem(CHIAVE)]) negozio = sessionStorage.getItem(CHIAVE);
  } catch (error) {
    console.error('Lettura del negozio scelto fallita.', error);
  }
  const ascoltatori = [];
  let conferma = () => true;

  function aggiorna() {
    document.querySelectorAll('[data-admin-negozio] button').forEach(pulsante => {
      pulsante.setAttribute('aria-pressed', String(pulsante.dataset.negozio === negozio));
    });
    document.querySelectorAll('[data-admin-nome-negozio]').forEach(el => { el.textContent = NEGOZI[negozio].nome; });
    document.querySelectorAll('[data-admin-cartella-negozio]').forEach(el => { el.textContent = negozio; });
  }

  function scegli(nuovo) {
    if (nuovo === negozio || !NEGOZI[nuovo] || !conferma(nuovo)) return;
    negozio = nuovo;
    try {
      sessionStorage.setItem(CHIAVE, negozio);
    } catch (error) {
      console.error('Salvataggio del negozio scelto fallito.', error);
    }
    aggiorna();
    ascoltatori.forEach(funzione => funzione(negozio));
  }

  function crea(contenitore) {
    contenitore.className = 'admin-negozio';
    contenitore.setAttribute('role', 'group');
    contenitore.setAttribute('aria-label', 'Negozio');
    const etichetta = document.createElement('span');
    etichetta.className = 'admin-negozio-label';
    etichetta.textContent = 'NEGOZIO';
    contenitore.replaceChildren(etichetta);
    Object.entries(NEGOZI).forEach(([id, dati]) => {
      const pulsante = document.createElement('button');
      pulsante.type = 'button';
      pulsante.dataset.negozio = id;
      pulsante.textContent = dati.nome;
      pulsante.addEventListener('click', () => scegli(id));
      contenitore.append(pulsante);
    });
  }

  // Scelta della cartella del progetto STORE // CRAFT (quella con index.html e assets, es. DesktopSTORECRAFT), in lettura e
  // scrittura, con il controllo che sia davvero il progetto: scegliendo un'altra cartella non si crea niente al suo interno.
  // La finestra si apre dove si era scelta la volta prima (stesso id della copia per un cliente).
  // passaggio (facoltativo): funzione che riceve il passaggio in corso, da mostrare nella riga di stato della pagina
  async function scegliProgetto(passaggio = () => {}) {
    passaggio('scegli la cartella STORECRAFT nella finestra del browser…');
    const cartella = await window.showDirectoryPicker({ id: 'storecraft-progetto', mode: 'readwrite' });
    passaggio(`cartella "${cartella.name}" scelta: controllo che sia il progetto…`);
    try {
      await cartella.getFileHandle('index.html');
      await (await cartella.getDirectoryHandle('assets')).getDirectoryHandle('negozi');
    } catch (error) {
      throw new Error(`"${cartella.name}" non è la cartella del progetto: scegli la cartella STORECRAFT, quella che contiene index.html e assets`);
    }
    // permesso di modificare i file: il browser lo chiede con una sua finestra (rispondere «Modifica file»)
    passaggio('chiedo il permesso di modificare i file: rispondi alla finestra del browser…');
    const permesso = await cartella.requestPermission({ mode: 'readwrite' });
    if (permesso !== 'granted') throw new Error('il browser non ha dato il permesso di modificare i file della cartella: ricollega e rispondi «Modifica file»');
    return cartella;
  }

  async function cartelle(progetto) {
    const assets = await progetto.getDirectoryHandle('assets', { create: true });
    const logos = await (await assets.getDirectoryHandle('logos', { create: true })).getDirectoryHandle(negozio, { create: true });
    const img = await (await assets.getDirectoryHandle('img', { create: true })).getDirectoryHandle(negozio, { create: true });
    return { logos, printlogos: await img.getDirectoryHandle('printlogos', { create: true }) };
  }

  function elencoVuoto() {
    return `// assets/logos/${negozio}/elenco.js
// Elenco dei loghi ufficiali di ${NEGOZI[negozio].nome} (file in questa cartella) e brand prioritari (stagionali) del negozio.
// Il codice che usa l'elenco è comune, in assets/js/logos.js. logoimport.html e logogestione.html (nella radice)
// aggiornano LOGO_FILES: tenerlo nella forma const LOGO_FILES = [ "NOME.png", … ];
const LOGO_FILES = [
];

// BRAND PRIORITARI (STAGIONALI): mostrati per primi in ogni menu a cascata dei loghi,
// subito dopo la voce di default, ed esclusi dal resto dell'elenco alfabetico.
const PRIORITY_BRANDS = [];
`;
  }

  function avvia() {
    document.querySelectorAll('[data-admin-negozio]').forEach(crea);
    aggiorna();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', avvia);
  } else {
    avvia();
  }

  window.AdminNegozio = Object.freeze({
    get negozio() { return negozio; },
    nome: () => NEGOZI[negozio].nome,
    oro: () => NEGOZI[negozio].oro.slice(),
    cartelle,
    scegliProgetto,
    elencoVuoto,
    alCambio: funzione => ascoltatori.push(funzione),
    prima: funzione => { conferma = funzione; }
  });
})();
