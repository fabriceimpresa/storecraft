/* Testi pronti dei menu a cascata, comuni a tutti i negozi: le voci si scrivono solo qui, le pagine dichiarano quali
   liste usare. Si riempie ogni <select data-testi-pronti="Lista,Lista"> quando il modulo viene caricato (va incluso
   dopo i menu e prima dello script della pagina, che può leggere o impostare il valore scelto).

   Attributi del <select>:
     data-testi-pronti="Promozioni,Articoli"   liste da usare, nell'ordine scritto
     data-testi-senza-gruppi                   voci di seguito, senza i titoli dei gruppi (elenchi brevi o di una lista)
     data-testi-maiuscolo                      voci (testo e valore) in maiuscolo
     data-scelta-iniziale="SALE"               voce scelta all'apertura della pagina (se non è la voce di partenza)
   Opzioni che restano nel menu, prima delle liste:
     <option value="">-- Seleziona … --</option>        voce di partenza (facoltativa)
     <option data-voce-propria value="…">…</option>     voci proprie della pagina (es. "Sconto alla Cassa")
   Nelle liste una voce { testo, stella: true } è in evidenza con ⭐ (classe priority-brand-option, come i brand della
   casa TEBE). La scelta già fatta (attributo selected o valore impostato) resta. */
(() => {
  const stella = testo => Object.freeze({ testo, stella: true });
  const categorie = Object.freeze({
    // Testi per i cartelli: promozioni e articoli
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
    ]),
    // Materiali e provenienza (Cornici di TEBE), in evidenza prima degli articoli
    Materiali: Object.freeze([
      stella('Puro Cotone'),
      stella('Lana & Cachemire'),
      stella('Pura Seta'),
      stella('Lino Puro'),
      stella('Eco Pelliccia'),
      stella('Lana Merinos'),
      stella('Made in Italy')
    ]),
    // Scritta promozionale dei cartellini (Cartellini Vetrina di Luxury, Cartellini LXRY di TEBE)
    'Promozioni Cartellini': Object.freeze([
      'FINAL PRICE',
      'GENUINE LEATHER',
      'LAST WEEK',
      'MADE IN ITALY',
      'SPECIAL DEAL',
      'SPRING SALE',
      'SUMMER SALE',
      'VERA PELLE',
      'WINTER SALE'
    ]),
    // Scritte delle etichette DYMO di TEBE e OPHILYA: le stagioni in evidenza
    'Etichette DYMO': Object.freeze([
      stella('BLACK FRIDAY'),
      stella('SPRING SALE'),
      stella('SUMMER SALE'),
      stella('WINTER SALE'),
      'FINAL PRICE',
      'GENUINE LEATHER',
      'OUTLET PRICE',
      'SALE',
      'SPECIAL DEAL',
      'VERA PELLE'
    ])
  });

  function populate(select, categoryNames, { senzaGruppi = false, maiuscolo = false } = {}) {
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

    // voce scelta: quella già impostata, oppure quella iniziale dichiarata dalla pagina (data-scelta-iniziale)
    const selectedValue = select.value || select.dataset.sceltaIniziale || '';
    // restano la voce di partenza (valore vuoto) e le voci proprie della pagina
    const kept = Array.from(select.options)
      .filter(option => option.value === '' || option.hasAttribute('data-voce-propria'))
      .map(option => option.cloneNode(true));
    const createOption = voce => {
      const testo = typeof voce === 'string' ? voce : voce.testo;
      const valore = maiuscolo ? testo.toUpperCase() : testo;
      const option = document.createElement('option');
      option.value = valore;
      option.textContent = voce.stella ? `⭐ ${valore}` : valore;
      if (voce.stella) option.className = 'priority-brand-option';
      return option;
    };
    const options = [...kept];
    categoryNames.forEach(name => {
      const voci = categorie[name].map(createOption);
      if (senzaGruppi) {
        options.push(...voci);
        return;
      }
      const group = document.createElement('optgroup');
      group.label = name;
      group.append(...voci);
      options.push(group);
    });

    select.replaceChildren(...options);
    const selectedValueExists = Array.from(select.options).some(option => option.value === selectedValue);
    if (selectedValue && !selectedValueExists) {
      throw new Error(`Il valore selezionato non esiste nei testi pronti: ${selectedValue}`);
    }
    select.value = selectedValueExists ? selectedValue : (select.options[0]?.value ?? '');
    select.classList.toggle(
      'ready-text-complete',
      !senzaGruppi && categoryNames.includes('Promozioni') && categoryNames.includes('Articoli')
    );
  }

  document.querySelectorAll('select[data-testi-pronti]').forEach(select => {
    const categoryNames = select.dataset.testiPronti.split(',').map(name => name.trim());
    populate(select, categoryNames, {
      senzaGruppi: select.hasAttribute('data-testi-senza-gruppi'),
      maiuscolo: select.hasAttribute('data-testi-maiuscolo')
    });
  });

  window.TestiPronti = Object.freeze({ populate });
})();
