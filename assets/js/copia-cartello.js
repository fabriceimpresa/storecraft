(() => {
  document.querySelectorAll('[data-copia-cartello]').forEach(placeholder => {
    const checkboxId = placeholder.dataset.checkboxId;
    const changeHandlerName = placeholder.dataset.onChange;
    if (!checkboxId || !changeHandlerName) {
      throw new Error('Il controllo Copia su altro cartello richiede checkboxId e onChange.');
    }
    if (document.getElementById(checkboxId)) {
      throw new Error(`Esiste già un elemento con id "${checkboxId}".`);
    }

    const label = document.createElement('label');
    label.className = 'check-row';
    if (placeholder.dataset.extraClass) {
      label.classList.add(placeholder.dataset.extraClass);
    }
    label.id = placeholder.id;
    label.htmlFor = checkboxId;
    label.hidden = placeholder.hidden;

    const text = document.createElement('span');
    text.textContent = 'COPIA SU ALTRO CARTELLO';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = checkboxId;
    checkbox.addEventListener('change', () => {
      const handler = window[changeHandlerName];
      if (typeof handler !== 'function') {
        throw new Error(`Funzione non disponibile per Copia su altro cartello: ${changeHandlerName}`);
      }
      handler(checkbox.checked);
    });

    label.append(text, checkbox);
    placeholder.replaceWith(label);
  });
})();
