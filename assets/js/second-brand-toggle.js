(() => {
  const buttons = new Map();

  document.querySelectorAll('[data-second-brand-toggle]').forEach(placeholder => {
    const buttonId = placeholder.id;
    const changeHandlerName = placeholder.dataset.onChange;
    if (!buttonId || !changeHandlerName) {
      throw new Error('Il pulsante 2° Brand richiede un id e una funzione onChange.');
    }
    if (document.getElementById(buttonId) !== placeholder) {
      throw new Error(`Esiste già un elemento con id "${buttonId}".`);
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.id = buttonId;
    button.className = 'btn-toggle';
    button.setAttribute('aria-pressed', 'false');
    button.textContent = '+ AGGIUNGI 2° BRAND';
    button.addEventListener('click', () => {
      const handler = window[changeHandlerName];
      if (typeof handler !== 'function') {
        throw new Error(`Funzione non disponibile per il pulsante 2° Brand: ${changeHandlerName}`);
      }
      handler();
    });

    buttons.set(buttonId, button);
    placeholder.replaceWith(button);
  });

  window.SecondBrandToggle = Object.freeze({
    setState(buttonId, enabled) {
      const button = buttons.get(buttonId);
      if (!button) {
        throw new Error(`Pulsante 2° Brand non registrato: ${buttonId}`);
      }
      button.classList.toggle('active', Boolean(enabled));
      button.setAttribute('aria-pressed', String(Boolean(enabled)));
      button.textContent = enabled ? '2° BRAND ATTIVO' : '+ AGGIUNGI 2° BRAND';
    }
  });
})();
