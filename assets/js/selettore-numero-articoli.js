/* Selettore pronto del numero di articoli (2 ARTICOLI / 3 ARTICOLI…), costruito con il selettore comune
   (selettore.js, da includere prima). La pagina dichiara <div data-selettore-numero-articoli></div> (valori in
   data-counts, predefiniti "2,3"; id dei pulsanti in data-button<N>-id, predefiniti itemCount<N>Btn; funzione in
   data-on-change, predefinita setItemCount, chiamata con il numero anche sulla voce già scelta) e conserva la
   propria setItemCount. Parte dal primo valore: la pagina sceglie quello giusto con setActive. */
(() => {
  let selector;

  document.querySelectorAll('[data-selettore-numero-articoli]').forEach(placeholder => {
    if (selector) throw new Error('È previsto un solo selettore del numero di articoli per pagina.');

    const counts = (placeholder.dataset.counts || '2,3')
      .split(',')
      .map(value => Number(value.trim()));
    if (counts.length < 2 || counts.some(count => !Number.isInteger(count) || count < 1)) {
      throw new Error('Il selettore del numero di articoli richiede almeno due valori interi positivi.');
    }

    const changeHandlerName = placeholder.dataset.onChange || 'setItemCount';
    selector = Selettore.crea({
      ariaLabel: placeholder.dataset.ariaLabel || 'Seleziona il numero di articoli del cartello',
      ripeti: true,
      voci: counts.map((count, index) => ({
        valore: count,
        testo: count === 1 ? '1 ARTICOLO' : `${count} ARTICOLI`,
        id: placeholder.dataset[`button${count}Id`] || `itemCount${count}Btn`,
        attiva: index === 0
      })),
      quandoCambia: value => {
        const handler = window[changeHandlerName];
        if (typeof handler !== 'function') {
          throw new Error(`Funzione non disponibile per il selettore numero articoli: ${changeHandlerName}`);
        }
        handler(Number(value));
      }
    });
    // data-count sui pulsanti, come prima
    selector.querySelectorAll('button').forEach(button => { button.dataset.count = button.value; });

    placeholder.replaceWith(selector);
  });

  window.SelettoreNumeroArticoli = Object.freeze({
    setActive(count) {
      if (!selector) throw new Error('Nessun selettore numero articoli è stato registrato.');
      Selettore.attiva(selector, Number(count));
    }
  });
})();
