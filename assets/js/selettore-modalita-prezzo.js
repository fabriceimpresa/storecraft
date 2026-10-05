(() => {
  const selectors = new Map();

  document.querySelectorAll('[data-selettore-modalita-prezzo]').forEach(placeholder => {
    const doubleButtonId = placeholder.dataset.doubleButtonId || 'doublePriceBtn';
    const descriptionButtonId = placeholder.dataset.descriptionButtonId || 'descriptionBtn';
    const changeHandlerName = placeholder.dataset.onChange || 'setDescriptionMode';
    if (document.getElementById(doubleButtonId) || document.getElementById(descriptionButtonId)) {
      throw new Error('Gli id del selettore modalità prezzo sono già utilizzati.');
    }

    const selector = document.createElement('div');
    selector.className = 'mode-switch';
    selector.setAttribute('role', 'group');
    selector.setAttribute('aria-label', 'Seleziona la modalità prezzo del cartello');

    const doubleButton = document.createElement('button');
    doubleButton.type = 'button';
    doubleButton.id = doubleButtonId;
    doubleButton.className = 'active';
    doubleButton.setAttribute('aria-pressed', 'true');
    doubleButton.textContent = 'DOPPIA CIFRA';

    const descriptionButton = document.createElement('button');
    descriptionButton.type = 'button';
    descriptionButton.id = descriptionButtonId;
    descriptionButton.setAttribute('aria-pressed', 'false');
    descriptionButton.textContent = 'DESCRIZIONE ARTICOLO';

    [[doubleButton, false], [descriptionButton, true]].forEach(([button, withDescription]) => {
      button.addEventListener('click', () => {
        const handler = window[changeHandlerName];
        if (typeof handler !== 'function') {
          throw new Error(`Funzione non disponibile per il selettore modalità prezzo: ${changeHandlerName}`);
        }
        handler(withDescription);
      });
    });

    selector.append(doubleButton, descriptionButton);
    selectors.set(placeholder.id || doubleButtonId, { doubleButton, descriptionButton });
    placeholder.replaceWith(selector);
  });

  window.SelettoreModalitaPrezzo = Object.freeze({
    setDescription(enabled) {
      const selector = selectors.values().next().value;
      if (!selector) throw new Error('Nessun selettore modalità prezzo è stato registrato.');
      const withDescription = Boolean(enabled);
      selector.doubleButton.classList.toggle('active', !withDescription);
      selector.doubleButton.setAttribute('aria-pressed', String(!withDescription));
      selector.descriptionButton.classList.toggle('active', withDescription);
      selector.descriptionButton.setAttribute('aria-pressed', String(withDescription));
    }
  });
})();
