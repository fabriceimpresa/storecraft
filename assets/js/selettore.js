/* Selettore a pulsanti, comune a tutte le pagine di tutti i negozi (stile .mode-switch di pannello.css).
   La pagina scrive le voci, nel suo ordine e quante ne servono; il modulo fa il resto (voce attiva, aria-pressed,
   clic, ruolo accessibile). Cosa succede scegliendo una voce lo decide la funzione della pagina (data-on-change),
   che riceve il valore della voce: è lì che stanno le differenze tra una pagina e l'altra.

     <div data-selettore id="modeSelector" data-on-change="switchMode" aria-label="Modalità del cartello">
       <button value="standard" id="modeStandard" class="active">STANDARD</button>
       <button value="descrizione" id="modeDescrizione">DESCRIZIONE<br>ARTICOLO</button>
       <button value="brand" id="modeBrand">AGGIUNGI<br>BRAND</button>
     </div>

   - la voce di partenza ha la classe active (altrimenti la prima);
   - <br> manda a capo la scritta (sul telefono responsive.js la rimette su una riga);
   - il clic sulla voce già scelta non richiama la funzione, salvo data-ripeti.
   Comandi per la pagina (selettore = elemento o id; i comandi non richiamano la funzione della pagina):
     Selettore.attiva(selettore, valore)              sceglie la voce
     Selettore.valore(selettore)                      valore della voce scelta
     Selettore.voci(selettore, [{ valore, testo, id }])  sostituisce le voci (testo con \n per andare a capo)
     Selettore.nascondiVoce(selettore, valore, sì/no)
     Selettore.disabilitaVoce(selettore, valore, sì/no)
   Per i selettori pronti costruiti da altri moduli (selettore-cartello.js, selettore-modalita-prezzo.js,
   selettore-numero-articoli.js) c'è anche
     Selettore.crea({ ariaLabel, voci: [{ valore, testo, id, attiva }], quandoCambia(valore, elemento), ripeti })
   che restituisce il selettore pronto da inserire nella pagina.
   Va incluso dopo i selettori e prima dello script della pagina (e prima dei moduli dei selettori pronti). */
(() => {
  const funzioni = new WeakMap();   // funzione passata a Selettore.crea, al posto di data-on-change

  const trova = selettore => {
    const elemento = typeof selettore === 'string' ? document.getElementById(selettore) : selettore;
    if (!elemento || !elemento.hasAttribute('data-selettore')) {
      throw new Error(`Selettore non trovato: ${selettore}`);
    }
    return elemento;
  };

  const pulsanti = elemento => [...elemento.querySelectorAll(':scope > button')];

  function segna(elemento, valore) {
    pulsanti(elemento).forEach(pulsante => {
      const scelto = pulsante.value === String(valore);
      pulsante.classList.toggle('active', scelto);
      pulsante.setAttribute('aria-pressed', String(scelto));
    });
  }

  function preparaPulsante(pulsante) {
    pulsante.type = 'button';
    if (!pulsante.hasAttribute('value')) throw new Error('Ogni voce del selettore deve avere un value.');
  }

  // Pulsante di una voce; \n nel testo manda a capo (con lo spazio della scritta su una riga, se richiesto)
  function creaPulsante({ valore, testo, id }, conSpazio) {
    const pulsante = document.createElement('button');
    pulsante.value = String(valore);
    if (id) {
      if (document.getElementById(id)) throw new Error(`L'id ${id} del selettore è già utilizzato.`);
      pulsante.id = id;
    }
    String(testo).split('\n').forEach((riga, indice) => {
      if (indice > 0) {
        pulsante.append(document.createElement('br'));
        if (conSpazio) {
          const spazio = document.createElement('span');
          spazio.className = 'phone-line-space';   // lo spazio della scritta su una riga, sul telefono
          spazio.textContent = ' ';
          pulsante.append(spazio);
        }
      }
      pulsante.append(riga);
    });
    preparaPulsante(pulsante);
    return pulsante;
  }

  function prepara(elemento) {
    if (elemento.dataset.selettorePronto) return;
    elemento.dataset.selettorePronto = '1';
    elemento.classList.add('mode-switch');
    elemento.setAttribute('role', 'group');
    pulsanti(elemento).forEach(preparaPulsante);

    const iniziale = pulsanti(elemento).find(pulsante => pulsante.classList.contains('active')) || pulsanti(elemento)[0];
    if (iniziale) segna(elemento, iniziale.value);

    elemento.addEventListener('click', evento => {
      const pulsante = evento.target.closest('button');
      if (!pulsante || pulsante.parentElement !== elemento || pulsante.disabled) return;
      const giaScelto = pulsante.classList.contains('active');
      segna(elemento, pulsante.value);
      if (giaScelto && !elemento.hasAttribute('data-ripeti')) return;
      let funzione = funzioni.get(elemento);
      if (!funzione) {
        const nome = elemento.dataset.onChange;
        if (!nome) return;
        funzione = window[nome];
        if (typeof funzione !== 'function') throw new Error(`Funzione non disponibile per il selettore: ${nome}`);
      }
      funzione(pulsante.value, elemento);
    });
  }

  function voce(elemento, valore) {
    const pulsante = pulsanti(elemento).find(item => item.value === String(valore));
    if (!pulsante) throw new Error(`Voce non prevista nel selettore: ${valore}`);
    return pulsante;
  }

  document.querySelectorAll('[data-selettore]').forEach(prepara);

  window.Selettore = Object.freeze({
    prepara: selettore => prepara(trova(selettore)),

    crea({ ariaLabel, voci, quandoCambia, ripeti = false }) {
      const elemento = document.createElement('div');
      elemento.setAttribute('data-selettore', '');
      if (ariaLabel) elemento.setAttribute('aria-label', ariaLabel);
      if (ripeti) elemento.setAttribute('data-ripeti', '');
      voci.forEach(item => {
        const pulsante = creaPulsante(item, false);   // lo spazio per il telefono lo aggiunge responsive.js
        if (item.attiva) pulsante.classList.add('active');
        elemento.append(pulsante);
      });
      if (quandoCambia) funzioni.set(elemento, quandoCambia);
      prepara(elemento);
      return elemento;
    },

    attiva(selettore, valore) {
      const elemento = trova(selettore);
      voce(elemento, valore);
      segna(elemento, valore);
    },

    valore(selettore) {
      const scelto = pulsanti(trova(selettore)).find(pulsante => pulsante.classList.contains('active'));
      return scelto ? scelto.value : null;
    },

    voci(selettore, elenco) {
      const elemento = trova(selettore);
      const precedente = this.valore(elemento);
      // i pulsanti vecchi escono subito, così i loro id si possono riusare
      elemento.replaceChildren();
      const nuovi = elenco.map(item => creaPulsante(item, true));
      elemento.append(...nuovi);
      const resta = nuovi.find(pulsante => pulsante.value === precedente) || nuovi[0];
      if (resta) segna(elemento, resta.value);
    },

    nascondiVoce(selettore, valore, nascosta = true) {
      voce(trova(selettore), valore).hidden = Boolean(nascosta);
    },

    disabilitaVoce(selettore, valore, disabilitata = true) {
      voce(trova(selettore), valore).disabled = Boolean(disabilitata);
    }
  });
})();
