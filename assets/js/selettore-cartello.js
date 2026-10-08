/* Selettore pronto CARTELLO SUPERIORE / CARTELLO INFERIORE, costruito con il selettore comune (selettore.js,
   da includere prima). La pagina dichiara <div data-selettore-cartello></div> (id dei pulsanti in
   data-first-button-id / data-second-button-id, predefiniti selectCard1 / selectCard2; funzione in data-on-change,
   predefinita selectCard, chiamata con 1 o 2 anche sulla voce già scelta) e conserva la propria selectCard. */
(() => {
  const selectors = new Map();

  document.querySelectorAll('[data-selettore-cartello]').forEach(placeholder => {
    const firstId = placeholder.dataset.firstButtonId || 'selectCard1';
    const secondId = placeholder.dataset.secondButtonId || 'selectCard2';
    const changeHandlerName = placeholder.dataset.onChange || 'selectCard';
    if (document.getElementById(firstId) || document.getElementById(secondId)) {
      throw new Error('Gli id del selettore cartello sono già utilizzati.');
    }

    const selector = Selettore.crea({
      ariaLabel: 'Seleziona il cartello da modificare',
      ripeti: true,
      voci: [
        { valore: 1, testo: 'CARTELLO\nSUPERIORE', id: firstId, attiva: true },
        { valore: 2, testo: 'CARTELLO\nINFERIORE', id: secondId }
      ],
      quandoCambia: value => {
        const handler = window[changeHandlerName];
        if (typeof handler !== 'function') {
          throw new Error(`Funzione non disponibile per il selettore cartello: ${changeHandlerName}`);
        }
        handler(Number(value));
      }
    });

    selectors.set(placeholder.id || firstId, { selector, firstId, secondId });
    placeholder.replaceWith(selector);
  });

  window.SelettoreCartello = Object.freeze({
    setActive(buttonId) {
      const pair = Array.from(selectors.values()).find(({ firstId, secondId }) =>
        firstId === buttonId || secondId === buttonId
      );
      if (!pair) throw new Error(`Selettore cartello non registrato: ${buttonId}`);
      Selettore.attiva(pair.selector, buttonId === pair.firstId ? 1 : 2);
    },
    setLowerDisabled(disabled) {
      const pair = selectors.values().next().value;
      if (!pair) throw new Error('Nessun selettore cartello è stato registrato.');
      Selettore.disabilitaVoce(pair.selector, 2, disabled);
      if (disabled && Selettore.valore(pair.selector) === '2') {
        this.setActive(pair.firstId);
      }
    }
  });
})();
