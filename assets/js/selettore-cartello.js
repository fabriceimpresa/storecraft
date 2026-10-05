(() => {
  const selectors = new Map();

  document.querySelectorAll('[data-selettore-cartello]').forEach(placeholder => {
    const firstId = placeholder.dataset.firstButtonId || 'selectCard1';
    const secondId = placeholder.dataset.secondButtonId || 'selectCard2';
    const changeHandlerName = placeholder.dataset.onChange || 'selectCard';
    if (document.getElementById(firstId) || document.getElementById(secondId)) {
      throw new Error('Gli id del selettore cartello sono già utilizzati.');
    }

    const selector = document.createElement('div');
    selector.className = 'mode-switch';
    selector.setAttribute('role', 'group');
    selector.setAttribute('aria-label', 'Seleziona il cartello da modificare');

    const upper = document.createElement('button');
    upper.type = 'button';
    upper.id = firstId;
    upper.className = 'active';
    upper.setAttribute('aria-pressed', 'true');
    upper.append('CARTELLO', document.createElement('br'), 'SUPERIORE');

    const lower = document.createElement('button');
    lower.type = 'button';
    lower.id = secondId;
    lower.setAttribute('aria-pressed', 'false');
    lower.append('CARTELLO', document.createElement('br'), 'INFERIORE');

    [[upper, 1], [lower, 2]].forEach(([button, cardIndex]) => {
      button.addEventListener('click', () => {
        if (button.disabled) return;
        const handler = window[changeHandlerName];
        if (typeof handler !== 'function') {
          throw new Error(`Funzione non disponibile per il selettore cartello: ${changeHandlerName}`);
        }
        handler(cardIndex);
      });
    });

    selector.append(upper, lower);
    selectors.set(placeholder.id || firstId, { upper, lower });
    placeholder.replaceWith(selector);
  });

  window.SelettoreCartello = Object.freeze({
    setActive(buttonId) {
      const pair = Array.from(selectors.values()).find(({ upper, lower }) =>
        upper.id === buttonId || lower.id === buttonId
      );
      if (!pair) throw new Error(`Selettore cartello non registrato: ${buttonId}`);
      [pair.upper, pair.lower].forEach(button => {
        const active = button.id === buttonId;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    },
    setLowerDisabled(disabled) {
      const pair = selectors.values().next().value;
      if (!pair) throw new Error('Nessun selettore cartello è stato registrato.');
      pair.lower.disabled = Boolean(disabled);
      if (disabled && pair.lower.getAttribute('aria-pressed') === 'true') {
        this.setActive(pair.upper.id);
      }
    }
  });
})();
