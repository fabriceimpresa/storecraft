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
   casa TEBE). All'apertura il menu sta sulla voce con l'attributo selected (o su data-scelta-iniziale), altrimenti
   sulla voce di partenza; se ha sotto un Testo Libero vale poi la regola TESTO PRONTO O TESTO LIBERO (in fondo). */
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

    // voce scelta: quella dichiarata dalla pagina (attributo selected o data-scelta-iniziale), di solito la voce
    // di partenza; non quella che il browser rimette ricaricando la pagina (autocomplete="off" lo evita del tutto)
    select.autocomplete = 'off';
    const selectedValue = select.querySelector('option[selected]')?.value || select.dataset.sceltaIniziale || '';
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

  /* TESTO PRONTO O TESTO LIBERO (regola comune dal 22 ottobre 2026): quando un menu di testi pronti ha sotto il suo
     Testo Libero, nel pannello si vede solo quello che il cartello sta usando.
       - Testo pronto: il menu mostra la voce scelta e il Testo Libero resta vuoto, con "-- Inserisci Testo Libero --".
       - Testo libero: il Testo Libero ha il testo e il menu torna sulla voce di partenza "-- Seleziona … --".
     Le pagine non cambiano: continuano a scrivere e leggere il campo con .value. Il modulo tiene per ogni coppia il
     testo che il cartello usa: se la pagina scrive nel campo un testo uguale a una voce del menu (senza badare a
     maiuscole, spazi e a capo, es. "LANA &\nCACHEMIRE" = "Lana & Cachemire") è un testo pronto, che si mostra nel
     menu; la pagina, leggendo il campo, riceve sempre il testo del cartello. Quello che l'utente scrive a mano resta
     Testo Libero anche se è uguale a una voce. Scegliendo la voce di partenza («-- Seleziona … --») sul cartello compare
     un AVVISO DI SISTEMA (22 ottobre 2026): il triangolo con il punto esclamativo e «Scegli un testo», nel colore del
     cursore del negozio (--cursore-colore: oro per Luxury, rosso per TEBE e OPHILYA), che si vede solo a schermo e non
     va in stampa né nella lista di stampa: manca un testo prima di stampare. La pagina riceve dal campo un testo
     segnato (AVVISO, tra due caratteri invisibili U+2063) e lo scrive sul cartello come gli altri; qui un osservatore
     della pagina lo trasforma nell'avviso (.testo-mancante). Solo una voce di partenza che dice di lasciare il campo
     vuoto (es. «— LASCIA IL CAMPO VUOTO —» di Cartellini Promo) svuota il cartello.
     Coppie: ogni <select data-testi-pronti> con il campo che lo segue nello stesso .form-group (prima di un altro
     menu) e ha l'etichetta "Testo Libero"; per altri menu, o per indicare il campo, data-testo-libero="id del campo"
     sul <select> (data-testo-libero="no" esclude il menu). */
  const descrittore = {
    input: Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'),
    textarea: Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value'),
    select: Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')
  };
  const normalizza = testo => String(testo ?? '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('it');

  // Avviso di sistema sul cartello quando il menu torna sulla voce di partenza
  const SEGNO = '\u2063';
  const TESTO_AVVISO = 'Scegli un testo';
  const AVVISO = SEGNO + TESTO_AVVISO + SEGNO;
  const eAvviso = testo => String(testo ?? '').includes(SEGNO);
  function preparaAvvisi() {
    if (document.getElementById('stile-testo-mancante')) return;
    const stile = document.createElement('style');
    stile.id = 'stile-testo-mancante';
    stile.textContent = `
      .testo-mancante {
        display: inline-flex;
        align-items: center;
        gap: 0.35em;
        color: var(--cursore-colore, #b48b37);
        font: 600 max(13px, 0.5em)/1.2 system-ui, -apple-system, 'Segoe UI', Arial, sans-serif;
        font-style: normal;
        letter-spacing: 0.02em;
        text-transform: none;
        white-space: nowrap;
        vertical-align: middle;
      }
      .testo-mancante::before {
        content: '';
        flex: none;
        width: 1.15em;
        height: 1.15em;
        background: currentColor;
        -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2.5 1.5 21h21z' fill='none' stroke='black' stroke-width='2.2' stroke-linejoin='round'/%3E%3Cpath d='M12 9.5v5.5' stroke='black' stroke-width='2.4' stroke-linecap='round'/%3E%3Ccircle cx='12' cy='18' r='1.4'/%3E%3C/svg%3E") center / contain no-repeat;
        mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2.5 1.5 21h21z' fill='none' stroke='black' stroke-width='2.2' stroke-linejoin='round'/%3E%3Cpath d='M12 9.5v5.5' stroke='black' stroke-width='2.4' stroke-linecap='round'/%3E%3Ccircle cx='12' cy='18' r='1.4'/%3E%3C/svg%3E") center / contain no-repeat;
      }
      @media print { .testo-mancante { visibility: hidden !important; } }`;
    document.head.append(stile);
    // il testo segnato, scritto dalla pagina sul cartello, diventa l'avviso
    const trasforma = radice => {
      const camminatore = document.createTreeWalker(radice, NodeFilter.SHOW_TEXT, {
        acceptNode: n => (n.nodeValue.includes(SEGNO) && !n.parentElement?.closest('.testo-mancante, input, textarea, select, option'))
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
      });
      const nodi = [];
      while (camminatore.nextNode()) nodi.push(camminatore.currentNode);
      nodi.forEach(nodo => {
        const avviso = document.createElement('span');
        avviso.className = 'testo-mancante';
        avviso.setAttribute('role', 'note');
        avviso.textContent = nodo.nodeValue.split(SEGNO).join('').trim() || TESTO_AVVISO;
        nodo.replaceWith(avviso);
      });
    };
    new MutationObserver(cambi => cambi.forEach(cambio => {
      if (cambio.type === 'characterData') {
        if (cambio.target.nodeValue.includes(SEGNO) && cambio.target.parentNode) trasforma(cambio.target.parentNode);
      } else {
        cambio.addedNodes.forEach(n => { if (n.nodeType === 3 ? n.nodeValue.includes(SEGNO) : n.textContent.includes(SEGNO)) trasforma(n.nodeType === 3 ? n.parentNode : n); });
      }
    })).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    trasforma(document.body);
  }
  const PARTENZA_CAMPO = '-- Inserisci Testo Libero';

  function campoTestoLibero(select) {
    const id = select.dataset.testoLibero;
    if (id === 'no') return null;
    if (id) return document.getElementById(id);
    const gruppo = select.closest('.form-group') || select.parentElement;
    const elementi = Array.from(gruppo.querySelectorAll('select, input[type="text"], input:not([type]), textarea'));
    for (const elemento of elementi.slice(elementi.indexOf(select) + 1)) {
      if (elemento instanceof HTMLSelectElement) return null;
      const etichetta = elemento.id && document.querySelector(`label[for="${CSS.escape(elemento.id)}"]`);
      if (etichetta && /^testo libero/i.test(etichetta.textContent.trim())) return elemento;
    }
    return null;
  }

  function abbina(select, campo) {
    const valoreCampo = campo instanceof HTMLTextAreaElement ? descrittore.textarea : descrittore.input;
    const leggiCampo = () => valoreCampo.get.call(campo);
    const scriviCampo = valore => valoreCampo.set.call(campo, valore);
    const scriviMenu = valore => descrittore.select.set.call(select, valore);
    const coppia = { pronto: false, testo: '', scrive: false, avviso: false };
    const voce = testo => normalizza(testo) && Array.from(select.options)
      .find(option => option.value && normalizza(option.value) === normalizza(testo));
    // il menu mostra la voce del testo pronto in uso, altrimenti la voce di partenza
    const mostraMenu = () => {
      const scelta = coppia.pronto && voce(coppia.testo);
      scriviMenu(scelta ? scelta.value : '');
    };
    const imposta = testo => {
      const valore = String(testo ?? '');
      // mentre si sceglie la voce di partenza la pagina può svuotare il campo: resta l'avviso
      if (coppia.tieni && !valore) return;
      // l'avviso (es. tornando su un cartello che lo aveva): campo vuoto, menu sulla voce di partenza
      coppia.avviso = eAvviso(valore);
      if (coppia.avviso) {
        coppia.pronto = false;
        coppia.testo = '';
        scriviCampo('');
        mostraMenu();
        return;
      }
      const scelta = !coppia.scrive && voce(valore);
      coppia.pronto = Boolean(scelta);
      coppia.testo = scelta ? valore : '';
      scriviCampo(scelta ? '' : valore);
      mostraMenu();
    };

    Object.defineProperty(campo, 'value', {
      configurable: true,
      get: () => (coppia.avviso ? AVVISO : coppia.pronto ? coppia.testo : leggiCampo()),
      set: imposta
    });
    Object.defineProperty(select, 'value', {
      configurable: true,
      get: () => descrittore.select.get.call(select),
      // la pagina può scegliere una voce (es. Made in Italy); la voce di partenza la decide il campo
      set: valore => {
        const scelta = valore && voce(valore);
        // se la voce è già quella del testo in uso, il testo resta com'è (es. su due righe, «PURA» a capo «SETA»)
        const giaInUso = coppia.pronto && voce(coppia.testo) === scelta;
        if (scelta && !leggiCampo() && !giaInUso) {
          coppia.pronto = true;
          coppia.testo = scelta.value;
        }
        mostraMenu();
      }
    });

    // l'utente scrive nel Testo Libero: il testo pronto non c'è più, il menu torna alla voce di partenza
    campo.addEventListener('input', () => {
      if (coppia.sintetico) return;   // l'evento mandato dal modulo per far rileggere il campo alla pagina
      coppia.avviso = false;
      coppia.pronto = false;
      coppia.testo = '';
      mostraMenu();
      coppia.scrive = true;
      setTimeout(() => { coppia.scrive = false; });
    }, true);
    // l'utente sceglie una voce: il Testo Libero si svuota; la pagina poi scrive il testo nel campo (anche
    // formattato, es. su due righe) e lo legge da lì. La voce di partenza svuota il cartello.
    select.addEventListener('change', () => {
      const valore = descrittore.select.get.call(select);
      if (!valore) {
        // voce di partenza: sul cartello l'avviso di sistema (o, con «lascia il campo vuoto», niente); dopo la
        // funzione della pagina il campo si rilegge
        const svuota = /vuot/i.test(select.selectedOptions[0]?.textContent || '');
        coppia.pronto = false;
        coppia.testo = '';
        coppia.avviso = !svuota;
        coppia.tieni = !svuota;
        scriviCampo('');
        setTimeout(() => {
          coppia.tieni = false;
          scriviMenu('');
          coppia.sintetico = true;
          campo.dispatchEvent(new Event('input', { bubbles: true }));
          coppia.sintetico = false;
        });
        return;
      }
      coppia.avviso = false;
      coppia.pronto = true;
      coppia.testo = valore;
      scriviCampo('');
    }, true);

    if (campo.placeholder.startsWith('-- Testo Libero')) {
      campo.placeholder = campo.placeholder.replace('-- Testo Libero', PARTENZA_CAMPO);
    }
    // all'apertura: il testo scritto nel campo, oppure, a campo vuoto, la voce già scelta nel menu
    // (es. Winter Sale nelle Promozioni di Promo Multibrand)
    const sceltaIniziale = descrittore.select.get.call(select);
    if (!leggiCampo() && sceltaIniziale) {
      coppia.pronto = true;
      coppia.testo = sceltaIniziale;
      mostraMenu();
    } else {
      imposta(leggiCampo());
    }
  }

  // dopo che la pagina ha costruito i suoi menu (es. gli articoli del Paletto, copiati dalle Promozioni) si
  // ricontrolla il testo scritto nel campo dall'HTML
  const coppie = [];
  document.querySelectorAll('select[data-testi-pronti], select[data-testo-libero]').forEach(select => {
    const campo = campoTestoLibero(select);
    if (campo) {
      abbina(select, campo);
      coppie.push(campo);
    }
  });
  window.addEventListener('DOMContentLoaded', () => {
    coppie.forEach(campo => { campo.value = campo.value; });
  });
  if (coppie.length) {
    if (document.body) preparaAvvisi(); else window.addEventListener('DOMContentLoaded', preparaAvvisi);
  }

  window.TestiPronti = Object.freeze({ populate });
})();
