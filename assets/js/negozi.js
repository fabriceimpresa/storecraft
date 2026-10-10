/* Negozi di STORE // CRAFT: le schede dei negozi e l'elenco dei negozi installati in questa copia.
   Ogni negozio ha la sua scheda in assets/negozi/: <negozio>.js (nome, sigla, oro, guida di montaggio, lista di
   stampa, valori iniziali dell'interfaccia…) e <negozio>.css (colori come variabili CSS: cursore, pulsantiera, riquadro
   PDF). L'elenco dei negozi installati sta in assets/negozi/installati.js: con un solo negozio la splash page si salta e
   i menu mostrano solo quel negozio. Prepara copia.bat, nella radice, scrive l'elenco per la copia di un cliente.

   Va incluso per primo nel <head> di ogni pagina, prima degli altri moduli: carica subito (durante la lettura della
   pagina) l'elenco, le schede dei negozi installati e i colori del negozio della pagina (data-negozio su <html>).

   Uso:
     Negozi.installati            elenco dei negozi installati, es. ['luxury', 'tebe', 'ophilya']
     Negozi.scheda(id)            scheda del negozio (null se non è installato)
     Negozi.corrente()            scheda del negozio della pagina (null nelle pagine della radice)
     Negozi.unico()               il negozio, se ne è installato uno solo; altrimenti null
     Negozi.copiaCliente          true nella copia per un cliente (la pagina operatore mostra solo i loghi ufficiali)
   Nelle schede e in installati.js:
     Negozi.registra(id, scheda)  aggiunge la scheda di un negozio
     Negozi.installa([...])       dichiara i negozi installati e carica le loro schede;
     Negozi.installa([...], { copiaCliente: true })   così lo scrive Prepara copia nella copia per un cliente */
(() => {
  const script = document.currentScript;
  const versione = new URL(script.src).search;  // stessa versione (?v=) dei file comuni
  const cartella = new URL('../negozi/', script.src);
  const negozio = document.documentElement.dataset.negozio || null;
  const schede = {};
  let installati = [];
  let copiaCliente = false;

  // Caricamento durante la lettura della pagina: i moduli che seguono trovano già schede e colori.
  function scrivi(html) {
    document.write(html);
  }

  window.Negozi = Object.freeze({
    get installati() { return installati.slice(); },
    scheda: id => (installati.includes(id) && schede[id]) || null,
    corrente: () => (negozio && schede[negozio]) || null,
    unico: () => (installati.length === 1 ? installati[0] : null),
    get copiaCliente() { return copiaCliente; },
    registra(id, scheda) {
      schede[id] = Object.freeze({ id, ...scheda });
    },
    installa(elenco, opzioni = {}) {
      installati = elenco.slice();
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

  // Icona di STORE // CRAFT (S in Cinzel, oro scuro, su fondo bianco), la stessa in tutte le pagine di tutti i negozi:
  // nella scheda del browser (32 o 512 px) e, su iPhone e iPad, sulla schermata Home.
  const immagini = new URL('../img/', script.src);
  scrivi(`<link rel="icon" type="image/png" sizes="32x32" href="${new URL(`favicon-32.png${versione}`, immagini).href}">`);
  scrivi(`<link rel="icon" type="image/png" sizes="512x512" href="${new URL(`favicon.png${versione}`, immagini).href}">`);
  scrivi(`<link rel="apple-touch-icon" href="${new URL(`apple-touch-icon.png${versione}`, immagini).href}">`);
})();
