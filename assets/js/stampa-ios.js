/* Stampa da iPhone e iPad (Safari e Chrome, stesso motore WebKit) a misura esatta.
   La stampa del browser su iOS non rispetta i margini di @page: lascia un suo margine (Safari ci scrive indirizzo,
   data e numero di pagina) e rimpicciolisce il foglio (circa 87% in Safari, 94% in Chrome; misurato con i PDF di
   prova di ottobre 2026), così le stampe non hanno le misure della versione desktop e non entrano nelle cornici.
   Solo su iOS il tasto di stampa delle pagine (che chiama window.print) non usa la stampa del browser: crea un PDF
   A4 con il foglio a misura reale, come la stampa da computer, e lo consegna con il menu Condividi
   (ListaStampa.sheetPdf e offerPdf in lista-stampa.js, caricato qui con la stessa versione). Se il PDF non riesce,
   il riquadro offre la stampa normale del browser. Su computer e Android il modulo si ferma alla prima riga e la
   stampa resta quella di sempre. Il PDF va stampato al 100% (dimensioni reali). */
(() => {
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!ios) return;
  // Il foglio della pagina, cercato in quest'ordine; .print-sheet per le pagine senza id sul foglio
  // (Albero e Paletti di TEBE e OPHILYA).
  const sheet = ['#printSheet', '#a4Sheet', '#printable-grid', '.print-sheet']
    .map(selector => document.querySelector(selector)).find(Boolean);
  if (!sheet) return;

  // lista-stampa.js sta accanto a questo file, con la stessa versione (le pagine sono nelle cartelle dei negozi).
  const listaStampaSrc = new URL(`lista-stampa.js${new URL(document.currentScript.src).search}`, document.currentScript.src).href;
  function loadListaStampa() {
    if (window.ListaStampa) return Promise.resolve(window.ListaStampa);
    return new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      tag.src = listaStampaSrc;
      tag.onload = () => resolve(window.ListaStampa);
      tag.onerror = () => reject(new Error('Caricamento di lista-stampa.js non riuscito.'));
      document.head.appendChild(tag);
    });
  }

  // Se il PDF non riesce, il riquadro offre la stampa normale del browser.
  const browserPrint = window.print.bind(window);
  const fallback = { label: 'USA LA STAMPA DEL BROWSER', run: browserPrint };
  window.print = () => {
    if (document.querySelector('.lista-pdf-overlay')) return;
    loadListaStampa()
      .then(lista => lista.offerPdf(lista.sheetPdf(sheet), `${document.title}.pdf`, fallback))
      .catch(error => {
        console.error('Preparazione del PDF di stampa non riuscita.', error);
        browserPrint();
      });
  };
})();
