/* Fasce Prezzo, un solo menu per tutte le pagine di tutti i negozi: voce di partenza "-- Seleziona Fascia Prezzo --" e due
   gruppi, Prezzi tondi e Prezzi ,90. Le voci si scrivono solo qui. Due modi:
   - <div data-fasce-prezzo data-select-id="pricePreset" data-on-change="applyPricePreset"></div>: il modulo crea
     etichetta e menu al posto del segnaposto (Prezzi Vetrina di Luxury);
   - <select data-fasce-prezzo ...></select> già nella pagina, con il suo id e il suo onchange: il modulo lo riempie
     (pagine di TEBE). Va caricato dopo il menu e prima dello script della pagina. */
(() => {
  const fasce = Object.freeze({
    'Prezzi tondi': Object.freeze([
      '10,00',
      '20,00',
      '30,00',
      '40,00',
      '50,00',
      '60,00',
      '70,00',
      '80,00',
      '90,00',
      '99,00'
    ]),
    'Prezzi ,90': Object.freeze([
      '19,90',
      '29,90',
      '39,90',
      '49,90',
      '59,90',
      '69,90',
      '79,90',
      '89,90'
    ])
  });

  function fill(select) {
    const initialOption = document.createElement('option');
    initialOption.value = '';
    initialOption.textContent = '-- Seleziona Fascia Prezzo --';
    const options = [initialOption];
    Object.entries(fasce).forEach(([name, prices]) => {
      const group = document.createElement('optgroup');
      group.label = name;
      prices.forEach(price => {
        const option = document.createElement('option');
        option.value = price;
        option.textContent = `€ ${price}`;
        group.append(option);
      });
      options.push(group);
    });
    select.replaceChildren(...options);
    select.classList.add('grouped-select');
    select.value = '';
  }

  function createField(placeholder) {
    if (placeholder instanceof HTMLSelectElement) {
      fill(placeholder);
      return;
    }
    const selectId = placeholder.dataset.selectId || 'pricePreset';
    if (document.getElementById(selectId)) {
      throw new Error(`L'id ${selectId} del menu Fasce Prezzo è già utilizzato.`);
    }

    const label = document.createElement('label');
    label.className = 'section-label';
    label.htmlFor = selectId;
    label.textContent = 'Fasce Prezzo';

    const select = document.createElement('select');
    select.id = selectId;
    select.className = 'grouped-select';
    const initialOption = document.createElement('option');
    initialOption.value = '';
    initialOption.textContent = '-- Seleziona Fascia Prezzo --';
    select.append(initialOption);

    Object.entries(fasce).forEach(([name, prices]) => {
      const group = document.createElement('optgroup');
      group.label = name;
      prices.forEach(price => {
        const option = document.createElement('option');
        option.value = price;
        option.textContent = `€ ${price}`;
        group.append(option);
      });
      select.append(group);
    });

    select.addEventListener('change', () => {
      const changeHandlerName = placeholder.dataset.onChange || 'applyPricePreset';
      const handler = window[changeHandlerName];
      if (typeof handler !== 'function') {
        throw new Error(`Funzione non disponibile per il menu Fasce Prezzo: ${changeHandlerName}`);
      }
      handler();
    });

    const selectWrap = document.createElement('div');
    selectWrap.className = 'preset-select';
    selectWrap.append(select);
    placeholder.replaceWith(label, selectWrap);
  }

  document.querySelectorAll('[data-fasce-prezzo]').forEach(createField);
})();
