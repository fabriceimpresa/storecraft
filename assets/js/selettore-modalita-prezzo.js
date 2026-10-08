/* Selettore pronto DOPPIA CIFRA / DESCRIZIONE ARTICOLO, costruito con il selettore comune (selettore.js, da
   includere prima). La pagina dichiara <div data-selettore-modalita-prezzo></div> (id dei pulsanti in
   data-double-button-id / data-description-button-id, predefiniti doublePriceBtn / descriptionBtn; funzione in
   data-on-change, predefinita setDescriptionMode, chiamata con false o true anche sulla voce già scelta) e conserva
   la propria setDescriptionMode. DESCRIZIONE ARTICOLO va su due righe (sul telefono su una). */
(() => {
  const selectors = new Map();

  document.querySelectorAll('[data-selettore-modalita-prezzo]').forEach(placeholder => {
    const doubleButtonId = placeholder.dataset.doubleButtonId || 'doublePriceBtn';
    const descriptionButtonId = placeholder.dataset.descriptionButtonId || 'descriptionBtn';
    const changeHandlerName = placeholder.dataset.onChange || 'setDescriptionMode';
    if (document.getElementById(doubleButtonId) || document.getElementById(descriptionButtonId)) {
      throw new Error('Gli id del selettore modalità prezzo sono già utilizzati.');
    }

    const selector = Selettore.crea({
      ariaLabel: 'Seleziona la modalità prezzo del cartello',
      ripeti: true,
      voci: [
        { valore: 'doppia', testo: 'DOPPIA CIFRA', id: doubleButtonId, attiva: true },
        { valore: 'descrizione', testo: 'DESCRIZIONE\nARTICOLO', id: descriptionButtonId }
      ],
      quandoCambia: value => {
        const handler = window[changeHandlerName];
        if (typeof handler !== 'function') {
          throw new Error(`Funzione non disponibile per il selettore modalità prezzo: ${changeHandlerName}`);
        }
        handler(value === 'descrizione');
      }
    });

    selectors.set(placeholder.id || doubleButtonId, selector);
    placeholder.replaceWith(selector);
  });

  window.SelettoreModalitaPrezzo = Object.freeze({
    setDescription(enabled) {
      const selector = selectors.values().next().value;
      if (!selector) throw new Error('Nessun selettore modalità prezzo è stato registrato.');
      Selettore.attiva(selector, enabled ? 'descrizione' : 'doppia');
    }
  });
})();
