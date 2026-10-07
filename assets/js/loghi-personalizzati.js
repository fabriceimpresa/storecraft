/* Loghi personalizzati: una lista per negozio, salvata nel browser (IndexedDB, database "storecraft-loghi-personalizzati",
   archivio "liste", una voce per negozio con l'elenco dei loghi { id, name, data } nell'ordine scelto dall'utente).
   Il negozio è quello della pagina (<html data-negozio="…">): ogni negozio vede e modifica solo la propria lista.
   Le immagini restano data URL, come prima, così menu, stampa e lista di stampa le usano senza cambiare.

   Uso:
     LoghiPersonalizzati.pronto            Promise risolta quando la lista del negozio è caricata
     LoghiPersonalizzati.elenco()          copia della lista (vuota finché pronto non è risolta)
     LoghiPersonalizzati.salva(lista)      Promise: sostituisce la lista del negozio
     LoghiPersonalizzati.negozio           negozio della pagina (luxury, tebe, ophilya)
     LoghiPersonalizzati.nomeNegozio(id)   nome da mostrare (LUXURY OUTLET, TEBE, OPHILYA)
     <span data-nome-negozio></span>       nella pagina, riceve " · " e il nome del negozio

   Passaggio dai dati di prima: la prima volta che un negozio apre la sua lista e la trova vuota, ci copia la vecchia
   lista del browser (localStorage "custom_brand_logos", o "customLogos" delle prime versioni). La vecchia lista resta
   intatta, come copia di sicurezza.

   Ogni modifica (anche da un'altra scheda) manda l'evento "loghipersonalizzati" su window, per chi deve aggiornarsi
   (print-logo-colors.js svuota la cache dei loghi ricolorati). */
(() => {
  const NEGOZIO = document.documentElement.dataset.negozio;
  const DB_NAME = 'storecraft-loghi-personalizzati';
  const STORE = 'liste';
  const VECCHIE_CHIAVI = ['custom_brand_logos', 'customLogos'];
  const canale = 'BroadcastChannel' in window ? new BroadcastChannel(DB_NAME) : null;

  // Nome del negozio dalla sua scheda (assets/negozi/<negozio>.js); per un negozio non installato in questa copia
  // (es. un backup arrivato da un altro sito) la sua sigla in maiuscolo.
  function nomeNegozio(id) {
    return Negozi.scheda(id)?.nome || String(id || '').toUpperCase();
  }
  let lista = [];
  let database = null;

  function apri() {
    if (database) return Promise.resolve(database);
    return new Promise((resolve, reject) => {
      const richiesta = indexedDB.open(DB_NAME, 1);
      richiesta.onupgradeneeded = () => richiesta.result.createObjectStore(STORE);
      richiesta.onsuccess = () => {
        database = richiesta.result;
        resolve(database);
      };
      richiesta.onerror = () => reject(richiesta.error);
    });
  }

  function leggi(db) {
    return new Promise((resolve, reject) => {
      const richiesta = db.transaction(STORE).objectStore(STORE).get(NEGOZIO);
      richiesta.onsuccess = () => resolve(richiesta.result);
      richiesta.onerror = () => reject(richiesta.error);
    });
  }

  function scrivi(db, valore) {
    return new Promise((resolve, reject) => {
      const transazione = db.transaction(STORE, 'readwrite');
      transazione.objectStore(STORE).put(valore, NEGOZIO);
      transazione.oncomplete = () => resolve();
      transazione.onerror = () => reject(transazione.error);
      transazione.onabort = () => reject(transazione.error);
    });
  }

  function vecchiaLista() {
    for (const chiave of VECCHIE_CHIAVI) {
      try {
        const valore = JSON.parse(localStorage.getItem(chiave) || '[]');
        if (Array.isArray(valore) && valore.length) return valore;
      } catch (error) {
        console.error(`Lettura della vecchia lista dei loghi personalizzati (${chiave}) fallita.`, error);
      }
    }
    return [];
  }

  function avvisa() {
    window.dispatchEvent(new Event('loghipersonalizzati'));
  }

  async function carica() {
    const db = await apri();
    let valore = await leggi(db);
    if (valore === undefined) {
      valore = vecchiaLista();
      await scrivi(db, valore);
    }
    lista = Array.isArray(valore) ? valore : [];
  }

  const pronto = carica().catch(error => {
    console.error('Lettura dei loghi personalizzati fallita.', error);
  });

  async function salva(nuovaLista) {
    const copia = Array.isArray(nuovaLista) ? nuovaLista.slice() : [];
    await scrivi(await apri(), copia);
    lista = copia;
    avvisa();
    if (canale) canale.postMessage(NEGOZIO);
  }

  // Modifiche fatte in un'altra scheda dello stesso negozio: si rilegge la lista.
  if (canale) {
    canale.onmessage = event => {
      if (event.data !== NEGOZIO) return;
      carica().then(avvisa).catch(error => console.error('Aggiornamento dei loghi personalizzati fallito.', error));
    };
  }

  // Nome del negozio della lista accanto ai titoli che lo chiedono (data-nome-negozio), es. in genera_loghi e gestisci_lista.
  function scriviNomeNegozio() {
    document.querySelectorAll('[data-nome-negozio]').forEach(elemento => {
      elemento.textContent = ` · ${nomeNegozio(NEGOZIO)}`;
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scriviNomeNegozio);
  } else {
    scriviNomeNegozio();
  }

  window.LoghiPersonalizzati = Object.freeze({
    negozio: NEGOZIO,
    nomeNegozio,
    pronto,
    elenco: () => lista.slice(),
    salva
  });
})();
