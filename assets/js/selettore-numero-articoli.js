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
    selector = document.createElement('div');
    selector.className = 'mode-switch';
    selector.setAttribute('role', 'group');
    selector.setAttribute('aria-label', placeholder.dataset.ariaLabel || 'Seleziona il numero di articoli del cartello');

    counts.forEach((count, index) => {
      const buttonId = placeholder.dataset[`button${count}Id`] || `itemCount${count}Btn`;
      if (document.getElementById(buttonId)) {
        throw new Error(`L'id ${buttonId} del selettore numero articoli è già utilizzato.`);
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.id = buttonId;
      button.dataset.count = String(count);
      button.className = index === 0 ? 'active' : '';
      button.setAttribute('aria-pressed', String(index === 0));
      button.textContent = `${count} ARTICOLI`;
      button.addEventListener('click', () => {
        const handler = window[changeHandlerName];
        if (typeof handler !== 'function') {
          throw new Error(`Funzione non disponibile per il selettore numero articoli: ${changeHandlerName}`);
        }
        handler(count);
      });
      selector.append(button);
    });

    placeholder.replaceWith(selector);
  });

  window.SelettoreNumeroArticoli = Object.freeze({
    setActive(count) {
      if (!selector) throw new Error('Nessun selettore numero articoli è stato registrato.');
      const activeCount = Number(count);
      const buttons = [...selector.querySelectorAll('button')];
      const activeButton = buttons.find(button => Number(button.dataset.count) === activeCount);
      if (!activeButton) throw new Error(`Valore non previsto per il selettore numero articoli: ${count}`);

      buttons.forEach(button => {
        const active = button === activeButton;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }
  });
})();
