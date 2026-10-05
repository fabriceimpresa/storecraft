(() => {
  const categorie = Object.freeze({
    Promozioni: Object.freeze([
      'Special Deal',
      'Final Price',
      'Summer Sale',
      'Spring Sale',
      'Winter Sale',
      'Black Friday',
      'Made in Italy',
      'Vera Pelle • Genuine Leather',
      'Made in Italy • Genuine Leather',
      'Fino ad esaurimento scorte'
    ]),
    Articoli: Object.freeze([
      'Abito',
      'Bermuda',
      'Blusa',
      'Borsa',
      'Borsa Vera Pelle',
      'Camicia',
      'Cappello',
      'Cappotto',
      'Cardigan',
      'Cintura',
      'Coprispalle',
      'Foulard',
      'Giacca',
      'Gilet',
      'Gonna',
      'Jeans',
      'Maglia',
      'Occhiali',
      'Pantaloncino',
      'Pantalone',
      'Shorts',
      'T-Shirt',
      'Top',
      'Tutina'
    ])
  });

  function populate(select, categoryNames) {
    if (!(select instanceof HTMLSelectElement)) {
      throw new TypeError('TestiPronti.populate richiede un elemento select.');
    }
    if (!Array.isArray(categoryNames) || categoryNames.length === 0) {
      throw new TypeError('Indicare almeno una categoria di testi pronti.');
    }

    const unknownCategory = categoryNames.find(name => !Object.prototype.hasOwnProperty.call(categorie, name));
    if (unknownCategory) {
      throw new Error(`Categoria di testi pronti non riconosciuta: ${unknownCategory}`);
    }

    const placeholder = Array.from(select.options).find(option => option.value === '');
    if (!placeholder) {
      throw new Error('Il menu Testi Pronti deve contenere un’opzione iniziale vuota.');
    }

    const selectedValue = select.value;
    const options = [placeholder.cloneNode(true)];
    categoryNames.forEach(name => {
      const group = document.createElement('optgroup');
      group.label = name;
      categorie[name].forEach(text => {
        const option = document.createElement('option');
        option.value = text;
        option.textContent = text;
        group.append(option);
      });
      options.push(group);
    });

    select.replaceChildren(...options);
    const selectedValueExists = Array.from(select.options).some(option => option.value === selectedValue);
    if (selectedValue && !selectedValueExists) {
      throw new Error(`Il valore selezionato non esiste nei testi pronti: ${selectedValue}`);
    }
    select.value = selectedValue;
    select.classList.toggle(
      'ready-text-complete',
      categoryNames.includes('Promozioni') && categoryNames.includes('Articoli')
    );
  }

  document.querySelectorAll('select[data-testi-pronti]').forEach(select => {
    const categoryNames = select.dataset.testiPronti.split(',').map(name => name.trim());
    populate(select, categoryNames);
  });

  window.TestiPronti = Object.freeze({ populate });
})();
