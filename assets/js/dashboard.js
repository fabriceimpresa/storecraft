/* Dashboard dei negozi, comune a tutti (luxury/index.html, tebe/index.html, ophilya/index.html: tre pagine uguali,
   cambia solo data-negozio). Il modello è la dashboard di Luxury Outlet. Stile in assets/css/dashboard.css, tema e
   aspetto con theme.css / theme.js, caroselli con caroselli.css / caroselli.js, Utilità Cassa con cassa.js.

   I contenuti del negozio (sezioni, schede, miniature, collegamenti, logo e indirizzo, intestazione) stanno in
   assets/negozi/<negozio>-dashboard.js, che chiama Dashboard.contenuto({...}); questo modulo lo carica da solo.
   La pagina chiama Dashboard.disegna() in fondo al <body>, prima che theme.js prepari il menu di sistema.

   Contenuto del negozio:
     intestazione   { titolo, sottotitolo, interruttore: ['tebe', 'ophilya'], logo } (interruttore facoltativo: negozi tra cui passare,
                    mostrati solo se installati almeno due; titolo: false toglie titolo e sottotitolo e mette l'interruttore
                    in alto a sinistra, come nella dashboard originale di TEBE; con titolo: false e logo (true o il percorso di un'immagine propria), senza interruttore, in
                    alto a sinistra c'è il logo del negozio; con dataOra: true, senza logo, data e ora del giorno)
     logo           { src (nella cartella assets/), larghezza, alt }: sotto il divisorio, bianco su fondo scuro e nero
                    su fondo chiaro
     identita       [riga principale, riga sotto] accanto al logo (es. indirizzo e descrizione)
     qr             collegamento iniziale del Generatore QR
     cassa          'sempre' oppure 'solo-cassiere' (Utilità Cassa solo in modalità CASSIERE)
     etichette      pagina delle etichette DYMO per la voce del menu laterale
     sezioni        [{ id, carosello, titolo, tipo, schede, voceMenu, stella, righe }] (righe: 1 mette i cartelli su una riga sola)
                    tipo: 'cartelli' (due righe; menu CREA CARTELLI), 'promo' (schede dorate; sottosezione PROMO
                    STAGIONALI), 'cartellini' (menu CARTELLINI), 'etichette' (schede DYMO), 'stampe' (PDF con Apri &
                    Stampa; menu STAMPE PRONTE con la voce voceMenu)
     schede         [{ titolo, link | pdf, tipo, miniature: [immagine, seconda immagine facoltativa] (nella cartella
                    assets/), alt, specifiche: [...], badge, compatto, voce (nome nel menu, se diverso dal titolo),
                    prossimamente (Coming Soon: scheda spenta, non nel menu), icona (emoji se la miniatura manca),
                    nascosta (pagina in ghost, da Gestione negozi: la scheda non si vede, né come widget né nel menu;
                    la pagina resta nella cartella) }] */
(() => {
  // Versione del prodotto, visibile in CONTATTI & CREDITS (vedi "Versione del prodotto" in AGENTS.md)
  const VERSIONE = 'V 1.2.04 2026';
  const script = document.currentScript;
  const versioneFile = new URL(script.src).search;
  const ASSETS = new URL('../', script.src);
  const negozio = document.documentElement.dataset.negozio;
  let dati = null;

  // Contenuto del negozio, caricato durante la lettura della pagina
  document.write(`<script src="${new URL(`../negozi/${negozio}-dashboard.js${versioneFile}`, script.src).href}"><\/script>`);

  const risorsa = percorso => new URL(percorso, ASSETS).href;

  // Piccolo costruttore di elementi: i testi passano sempre da textContent
  function el(tag, attributi = {}, ...figli) {
    const nodo = document.createElement(tag);
    Object.entries(attributi).forEach(([nome, valore]) => {
      if (valore === false || valore === null || valore === undefined) return;
      if (nome === 'class') nodo.className = valore;
      else if (nome === 'text') nodo.textContent = valore;
      else if (nome.startsWith('on')) nodo.addEventListener(nome.slice(2), valore);
      else nodo.setAttribute(nome, valore === true ? '' : valore);
    });
    figli.flat().forEach(figlio => {
      if (figlio === null || figlio === undefined || figlio === false) return;
      nodo.append(typeof figlio === 'string' ? document.createTextNode(figlio) : figlio);
    });
    return nodo;
  }
  const due = n => String(n).padStart(2, '0');

  // ----- Menu laterale -----
  function vociMenu(sezione) {
    return sezione.schede.filter(s => !s.prossimamente).map(s =>
      el('a', { href: collegamento(s), class: 'nav-btn' }, s.voce || s.titolo.replace(/ ✦$/, ''),
        sezione.tipo === 'promo' ? [' ', el('span', { class: 'nav-star', 'aria-hidden': 'true', text: '✦' })] : []));
  }

  function gruppoMenu(id, titolo, ...contenuto) {
    return el('div', { class: 'sidebar-section is-collapsed', 'data-sidebar-section': id },
      el('div', { class: 'label' },
        el('span', { text: titolo }),
        el('button', { class: 'section-toggle', type: 'button', 'aria-label': `Espandi ${titolo}`, 'aria-expanded': 'false',
          onclick: () => toggleSidebarSection(id), text: '⌄' })),
      el('nav', {}, ...contenuto));
  }

  function menuLaterale() {
    const sezioni = tipo => dati.sezioni.filter(s => s.tipo === tipo);
    const gruppi = [];
    const cartelli = sezioni('cartelli').flatMap(vociMenu);
    const promo = sezioni('promo').flatMap(vociMenu);
    if (cartelli.length || promo.length) {
      gruppi.push(gruppoMenu('cartelli', 'CREA CARTELLI',
        el('div', { class: 'nav-group', id: 'cartelliItems' }, cartelli),
        promo.length ? [
          el('button', { class: 'nav-subtoggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'promoItems',
            onclick: event => togglePromoSubsection(event.currentTarget) },
            el('span', {}, 'Promo Stagionali ', el('span', { class: 'nav-star', 'aria-hidden': 'true', text: '✦' })),
            el('span', { class: 'nav-subtoggle-arrow', 'aria-hidden': 'true', text: '⌄' })),
          el('div', { class: 'nav-group', id: 'promoItems', hidden: true }, promo)
        ] : []));
    }
    const cartellini = sezioni('cartellini').flatMap(vociMenu);
    if (cartellini.length) gruppi.push(gruppoMenu('cartellini', 'CARTELLINI', cartellini));
    if (dati.etichette) {
      gruppi.push(gruppoMenu('etichette', 'ETICHETTE', el('a', { href: dati.etichette, class: 'nav-btn', text: 'Etichette DYMO' })));
    }
    gruppi.push(gruppoMenu('loghi', 'LOGHI PERSONALIZZATI',
      el('a', { href: 'genera_loghi.html', class: 'nav-btn', text: 'Importa Loghi' }),
      el('a', { href: 'gestisci_lista.html', class: 'nav-btn', text: 'Gestisci Loghi' })));
    const stampe = sezioni('stampe').filter(s => s.schede.some(scheda => !scheda.prossimamente));
    if (stampe.length) {
      gruppi.push(gruppoMenu('stampe', 'STAMPE PRONTE', stampe.map(s =>
        el('a', { href: `#${s.id}`, class: 'nav-btn', text: s.voceMenu || s.titolo,
          onclick: event => { event.preventDefault(); scrollToSection(s.id); } }))));
    }
    gruppi.push(gruppoMenu('cassa', "UTILITA' CASSA", [
      ['widget-sconto', 'Calcola Sconto'], ['widget-aliquota', 'Calcola Aliquota'], ['widget-valuta', 'Cambio Valuta'],
      ['widget-iva', 'Calcola IVA'], ['widget-qrcode', 'Generatore QR']
    ].map(([id, nome]) => el('a', { class: 'nav-btn', href: `#${id}`, text: nome,
      onclick: event => { event.preventDefault(); apriStrumento(id); } }))));
    // Lista di stampa del negozio: si apre nella sua finestra dedicata, come dal pulsante sotto i pannelli
    // (strumenti-stampa.js; nome della finestra nella scheda del negozio, listaStampa)
    const finestraLista = Negozi.corrente()?.listaStampa || `${document.documentElement.dataset.negozio}-lista-stampa`;
    gruppi.push(gruppoMenu('lista', 'LISTA STAMPA',
      el('a', { href: 'lista-stampa.html', class: 'nav-btn', text: 'Gestisci Lista di Stampa',
        onclick: event => { event.preventDefault(); window.open('lista-stampa.html', finestraLista); } })));
    return gruppi;
  }

  // Menu di sistema (MENU // IMPOSTAZIONI): viste e comportamento in theme.js
  // Cambio di negozio dalla lista NEGOZI del menu di sistema: come in IMPOSTAZIONI il menu resta aperto. La dashboard
  // del nuovo negozio lo riapre subito sulla stessa lista, senza animazione, così sembra che non si sia mai chiuso e si
  // possono fare più cambi di seguito (sessionStorage, solo per questa scheda); si richiude cliccando altrove
  const MENU_NEGOZI = 'storecraft_menu_negozi';
  function cambiaNegozioDalMenu(id) {
    try { sessionStorage.setItem(MENU_NEGOZI, '1'); } catch (errore) { /* senza sessionStorage il menu resta chiuso */ }
    PuntoVendita.scegli(id);
  }
  function riapriMenuNegozi() {
    let riapri = false;
    try {
      riapri = sessionStorage.getItem(MENU_NEGOZI) === '1';
      sessionStorage.removeItem(MENU_NEGOZI);
    } catch (errore) { return; }
    const menu = document.getElementById('system-menu');
    if (!riapri || !menu || !menu.hidden) return;
    menu.style.animation = 'none';   // riaperto senza l'animazione di apertura
    window.toggleSystemMenu();
    window.openSystemMenuView('stores');
    // l'animazione torna quando il menu si chiude (rimetterla con il menu aperto lo farebbe riaprire da capo)
    const ripristina = new MutationObserver(() => {
      if (menu.hidden) { menu.style.removeProperty('animation'); ripristina.disconnect(); }
    });
    ripristina.observe(menu, { attributes: true, attributeFilter: ['hidden'] });
  }

  function menuSistema() {
    const scheda = Negozi.corrente();
    const indietro = () => el('div', { class: 'system-menu-footer' },
      el('button', { class: 'system-menu-back', type: 'button', 'data-system-menu-back': true,
        onclick: () => openSystemMenuView('home'), text: '← Indietro' }));
    const voce = (id, icona, testo, fine, azione) => el('button', {
      class: 'system-menu-item', type: 'button', 'data-system-menu-item': id, onclick: azione, disabled: !azione },
      el('span', { class: 'system-menu-item-label' },
        el('span', { class: 'system-menu-icon', 'aria-hidden': 'true', text: icona }),
        el('span', { class: 'system-menu-label-text', text: testo })),
      fine);
    const scelta = (attributo, valore, testo) => el('button', { class: 'theme-choice', type: 'button', [attributo]: valore,
      'aria-pressed': 'false', text: testo });

    const negozi = Object.entries(PuntoVendita.NEGOZI).map(([id, n]) => id === negozio
      ? el('button', { class: 'system-store-choice is-active', type: 'button', 'aria-pressed': 'true', disabled: true },
          el('span', { text: n.nome }), el('span', { class: 'system-store-status', text: `${n.sigla} · ATTIVO` }))
      : el('button', { class: 'system-store-choice', type: 'button', 'aria-pressed': 'false', 'data-punto-vendita': id,
          disabled: !n.pronto, onclick: n.pronto ? () => cambiaNegozioDalMenu(id) : null },
          el('span', { text: n.nome }),
          n.pronto ? el('span', { 'aria-hidden': 'true', text: '›' }) : el('span', { class: 'system-menu-badge', text: 'IN ARRIVO' })));

    return el('section', { class: 'system-menu', id: 'system-menu', 'aria-label': 'Menu di sistema', hidden: true },
      el('div', { class: 'system-menu-heading system-menu-title', id: 'system-menu-title', text: 'MENU' }),
      el('div', { class: 'system-menu-view', 'data-system-view': 'home' },
        el('div', { class: 'system-menu-items' },
          // ︎ dopo il simbolo: iPhone lo mostra come carattere (oro, come gli altri) e non come emoji colorata
          voce('settings', '⚙︎', 'IMPOSTAZIONI', el('span', { 'aria-hidden': 'true', text: '›' }), () => openSystemMenuView('settings')),
          voce('profile', '♙', 'PROFILO UTENTE', el('span', { class: 'system-store-current', text: scheda.sigla }), () => openSystemMenuView('stores')),
          // STORE (in Coming Soon) tolta il 10 ottobre 2026: per ora non c'è
          voce('contacts', '✉︎', 'CONTATTI & CREDITS', el('span', { 'aria-hidden': 'true', text: '›' }), () => openSystemMenuView('contacts')),
          // HOME: torna alla scelta del punto vendita (solo con più di un negozio installato)
          PuntoVendita.unico() ? null : voce('home', '⌂', 'HOME', el('span', { 'aria-hidden': 'true', text: '›' }), () => PuntoVendita.apriSplash()))),
      el('div', { class: 'system-menu-view', 'data-system-view': 'settings', hidden: true },
        el('div', { class: 'system-setting-row' },
          el('span', { class: 'system-setting-label', text: 'TEMA' }),
          el('div', { class: 'theme-choices', role: 'group', 'aria-label': 'Tema' },
            scelta('data-interface-theme-choice', 'light', 'CHIARO'), scelta('data-interface-theme-choice', 'dark', 'SCURO'))),
        el('div', { class: 'system-setting-row' },
          el('span', { class: 'system-setting-label', text: 'ASPETTO' }),
          el('div', { class: 'theme-choices', role: 'group', 'aria-label': 'Aspetto interfaccia' },
            scelta('data-interface-look-choice', 'standard', 'STANDARD'), scelta('data-interface-look-choice', 'minimal', 'COMPATTO'))),
        indietro()),
      el('div', { class: 'system-menu-view', 'data-system-view': 'contacts', hidden: true },
        el('div', { class: 'system-credits' },
          el('span', {}, el('span', { class: 'release-number', text: VERSIONE }), ' · Developed by Fabrizio Notte'),
          el('br'), '© Marchi e loghi appartengono ai rispettivi proprietari', el('br'),
          el('a', { href: 'mailto:fabriceimpresa@gmail.com', text: 'fabriceimpresa@gmail.com' })),
        indietro()),
      el('div', { class: 'system-menu-view', 'data-system-view': 'stores', hidden: true },
        el('div', { class: 'system-store-list', role: 'group', 'aria-label': 'Seleziona negozio' }, negozi),
        indietro()));
  }

  // ----- Fondo pagina del telefono: logo STORE // CRAFT con CRAFTED WITH STORECRAFT e tre pulsanti (CREDITS, CONTATTI, torna in cima) -----
  const EMAIL = 'fabriceimpresa@gmail.com';

  function piedePagina() {
    const nome = Negozi.corrente()?.nome;
    const freccia = el('span', { class: 'footer-btn-arrow', 'aria-hidden': 'true' });
    // freccia lunga che alla fine si piega e punta in alto (disegno fisso, nessun testo dell'utente)
    freccia.innerHTML = '<svg viewBox="0 0 40 18" width="40" height="18" fill="none" stroke="currentColor" stroke-width="1.6" '
      + 'stroke-linecap="round" stroke-linejoin="round"><path d="M2 15H33V3"/><path d="M28.5 7.5L33 3L37.5 7.5"/></svg>';
    return el('div', { class: 'mobile-brand-footer' },
      el('div', { class: 'mobile-brand-footer-title' },
        el('div', { class: 'storecraft-mark' }, el('img', { src: risorsa('img/storecraftlogo.png'), alt: 'STORE // CRAFT' })),
        el('div', { class: 'signature-caption', text: 'CRAFTED WITH STORECRAFT' })),
      el('div', { class: 'mobile-footer-actions' },
        el('button', { class: 'footer-btn', type: 'button', 'aria-haspopup': 'dialog', onclick: apriCrediti, text: 'CREDITS' }),
        el('a', { class: 'footer-btn', href: `mailto:${EMAIL}?subject=${encodeURIComponent(`STORE // CRAFT${nome ? ` · ${nome}` : ''}`)}`,
          text: 'CONTATTI' }),
        el('button', { class: 'footer-btn', type: 'button', 'aria-label': 'Torna in cima alla pagina', onclick: () => returnToHomeTop() },
          freccia)));
  }

  // Popup dei crediti nello stile della splash page: cornice oro doppia, logo STORE // CRAFT, titolo tra due linee;
  // si chiude con CHIUDI, con Esc o toccando fuori dalla cornice
  function apriCrediti() {
    let finestra = document.getElementById('credits-dialog');
    if (!finestra) {
      finestra = el('dialog', { class: 'credits-dialog', id: 'credits-dialog', 'aria-labelledby': 'credits-dialog-title' },
        el('div', { class: 'credits-frame' },
          el('img', { class: 'credits-brand', src: risorsa('img/storecraftlogo.png'), alt: 'STORE // CRAFT' }),
          el('h2', { class: 'credits-title', id: 'credits-dialog-title', text: 'Credits' }),
          el('p', { class: 'credits-text' }, el('span', { class: 'release-number', text: VERSIONE }), ' · Developed by Fabrizio Notte'),
          el('p', { class: 'credits-text', text: '© Marchi e loghi appartengono ai rispettivi proprietari' }),
          el('a', { class: 'credits-mail', href: `mailto:${EMAIL}`, text: EMAIL }),
          el('button', { class: 'footer-btn credits-close', type: 'button', onclick: () => finestra.close(), text: 'CHIUDI' })));
      finestra.addEventListener('click', event => { if (event.target === finestra) finestra.close(); });
      document.body.append(finestra);
    }
    finestra.showModal();
  }

  // Casetta del pulsante HOME: la forma del simbolo ⌂ disegnata a tratto, così sta sempre al centro della scritta (il
  // carattere ⌂ ogni carattere tipografico lo mette a un'altezza diversa)
  function casetta() {
    const icona = el('span', { class: 'home-mark-icon', 'aria-hidden': 'true' });
    icona.innerHTML = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">'
      + '<path d="M1.5 6.5 7 1.5l5.5 5v6h-11z"/></svg>';
    return icona;
  }

  // ----- Pulsante IMPOSTAZIONI del telefono: tondo e oro, fisso in basso a sinistra, sempre presente, con l'ingranaggio; apre
  // il menu di sistema, che sul telefono compare sopra il pulsante, come unito a lui (al posto di MENU // IMPOSTAZIONI
  // in fondo al menu laterale). Su desktop e tablet non si vede. -----
  function pulsanteImpostazioni() {
    const pulsante = el('button', { class: 'system-fab', type: 'button', 'aria-label': 'Impostazioni', 'aria-controls': 'system-menu',
      'aria-expanded': 'false', onclick: () => {
        if (narrowViewQuery.matches) toggleMobileSidebar(false);
        toggleSystemMenu();
      } });
    // ingranaggio pieno, in bronzo scuro sul pulsante oro (disegno fisso, nessun testo dell'utente)
    pulsante.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="'
      + 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96'
      + 'c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.47.47 0 0 0-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96'
      + 'a.49.49 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61'
      + 'l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54'
      + 'c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58z'
      + 'M12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z"/></svg>';
    return pulsante;
  }

  // Arrivati in fondo alla pagina sul telefono il pulsante IMPOSTAZIONI entra nella fascia scura dei pulsanti del fondo
  // pagina, al primo posto: man mano che la fascia compare si rimpicciolisce (da 54 a 40 px come ☰, --fab-scala), si sposta
  // a sinistra fino al margine di ☰ (--fab-x) e, se serve, sale con la fascia restando al centro della riga dei pulsanti
  // (--fab-alza). Variabili su <html>, usate da dashboard.css
  const SCALA_IN_FONDO = 40 / 54;
  function alzaPulsanteImpostazioni() {
    const radice = document.documentElement;
    const pulsante = document.querySelector('.system-fab');
    const azioni = document.querySelector('.mobile-footer-actions');
    const primo = azioni?.querySelector('.footer-btn');
    if (!phoneViewQuery.matches || !pulsante || !azioni?.offsetParent || !primo) {
      radice.style.removeProperty('--fab-alza');
      radice.style.removeProperty('--fab-scala');
      radice.style.removeProperty('--fab-x');
      return;
    }
    const fascia = azioni.getBoundingClientRect();
    const riga = primo.getBoundingClientRect();
    const alzato = parseFloat(radice.style.getPropertyValue('--fab-alza')) || 0;
    const r = pulsante.getBoundingClientRect();
    const centroNormale = r.top + r.height / 2 + alzato;   // il rimpicciolimento è attorno al centro: il centro non cambia
    const quanto = Math.min(1, Math.max(0, (window.innerHeight - fascia.top) / fascia.height));
    // sale quanto serve; se invece la riga è un poco più in basso, scende solo quando la fascia è quasi tutta in vista
    const scarto = centroNormale - (riga.top + riga.height / 2);
    const alza = scarto > 0 ? scarto : scarto * quanto ** 4;
    if (Math.abs(alza) >= .5) radice.style.setProperty('--fab-alza', `${alza.toFixed(1)}px`);
    else radice.style.removeProperty('--fab-alza');
    if (quanto) {
      radice.style.setProperty('--fab-scala', (1 - (1 - SCALA_IN_FONDO) * quanto).toFixed(3));
      // rimpicciolito attorno al centro il bordo sinistro rientra di metà della differenza: lo si riporta al margine di ☰
      radice.style.setProperty('--fab-x', `-${(pulsante.offsetWidth * (1 - SCALA_IN_FONDO) / 2 * quanto).toFixed(1)}px`);
    } else {
      radice.style.removeProperty('--fab-scala');
      radice.style.removeProperty('--fab-x');
    }
  }

  // Il menu di sistema sta nel menu laterale su desktop e tablet; sul telefono accanto al pulsante IMPOSTAZIONI, fuori dal
  // menu laterale (che si sposta con transform e non lascerebbe il menu fisso sullo schermo). Cambiando vista si chiude.
  function postoMenuSistema() {
    const sistema = document.getElementById('system-menu');
    const pulsante = document.querySelector('.system-fab');
    const fondo = document.querySelector('#sidebar-menu > .sidebar-bottom');
    if (!sistema || !pulsante || !fondo) return;
    if (!sistema.hidden) toggleSystemMenu();
    if (phoneViewQuery.matches) pulsante.before(sistema);
    else fondo.before(sistema);
  }

  // ----- Schede -----
  function collegamento(scheda) {
    // il PDF (nella cartella assets/) arriva al visualizzatore con il percorso dalla radice del sito
    if (scheda.pdf) return 'pdf-viewer.html?file=' + encodeURIComponent(new URL(scheda.pdf, ASSETS).pathname);
    return scheda.link;
  }

  function anteprima(scheda, sezione) {
    const immagini = (scheda.miniature || []).map((src, i) => el('img', {
      class: 'preview-image', src: risorsa(src), alt: i === 0 ? (scheda.alt || scheda.titolo) : '', 'aria-hidden': i ? 'true' : false,
      onerror: scheda.icona ? event => { event.currentTarget.style.display = 'none'; event.currentTarget.parentElement.querySelector('.preview-icon').style.display = 'block'; } : null
    }));
    return el('div', { class: `preview${immagini.length > 1 ? ' slideshow' : ''}`,
      style: sezione.tipo === 'promo' ? 'background: radial-gradient(circle, #2a2218 0%, #0a0908 100%);' : false },
      immagini,
      scheda.icona ? el('span', { class: 'preview-icon', style: 'display:none;', text: scheda.icona }) : null,
      scheda.badge ? el('span', { class: 'card-badge', text: scheda.badge }) : null);
  }

  function scheda(s, numero, sezione) {
    const cima = el('div', { class: 'card-top' },
      el('span', { class: 'number', text: due(numero) }),
      s.tipo ? el('span', { class: 'card-type', text: s.tipo }) : null);
    const titolo = el('h3', { class: s.compatto ? 'compact-title' : false, text: s.titolo });
    const classi = `carousel-card${sezione.tipo === 'promo' ? ' gold-bf-card' : ''}${s.prossimamente ? ' is-soon' : ''}`;

    if (sezione.tipo === 'stampe') {
      const href = collegamento(s);
      return el('div', { class: classi, onclick: () => { location.href = href; } },
        cima, anteprima(s, sezione),
        el('div', { class: 'card-body' }, titolo,
          el('button', { type: 'button', class: 'tool-btn print-pdf-btn', text: 'Apri & Stampa' })));
    }
    const specifiche = s.specifiche?.length
      ? el('div', { class: 'card-desc' }, el('div', {}, el('p', {}, el('span', { class: 'spec-list' },
          s.specifiche.flatMap((testo, i) => [i ? ' ' : null, el('span', { class: 'spec', text: testo })])))))
      : null;
    return el('a', { href: s.prossimamente ? false : collegamento(s), class: classi,
      'aria-disabled': s.prossimamente ? 'true' : false, 'aria-label': s.prossimamente ? `${s.titolo}, prossimamente` : false },
      cima, anteprima(s, sezione),
      el('div', { class: 'card-body' }, titolo, specifiche ? el('span', { class: 'spec-toggle' }) : null),
      specifiche);
  }

  function sezione(s) {
    const classiCarosello = `carousel-container${s.tipo === 'cartelli' && s.righe !== 1 ? ' two-rows' : ''}${s.tipo === 'etichette' ? ' dymo' : ''}`;
    return el('div', { id: s.id },
      el('div', { class: 'section-title' }, s.titolo,
        s.stella ? [' ', el('span', { class: 'promo-lightning', 'aria-hidden': 'true', text: '✦' })] : []),
      el('div', { class: 'carousel-wrapper' },
        el('button', { class: 'carousel-arrow prev', type: 'button', 'aria-label': 'Scorri a sinistra', text: '‹',
          onclick: () => scrollCarousel(s.carosello, -1) }),
        el('div', { class: classiCarosello, id: s.carosello }, s.schede.map((sk, i) => scheda(sk, i + 1, s))),
        el('button', { class: 'carousel-arrow next', type: 'button', 'aria-label': 'Scorri a destra', text: '›',
          onclick: () => scrollCarousel(s.carosello, 1) })));
  }

  // Intestazione: titolo e sottotitolo e, se il negozio lo indica (e ne sono installati almeno due), l'interruttore tra i
  // negozi, in alto a destra accanto al selettore CASSIERE / CREATOR (posizione in dashboard.css)
  function intestazione() {
    const header = el('header', {},
      el('button', { class: 'home-mark', type: 'button', 'aria-label': "Torna all'inizio della home", onclick: () => returnToHomeTop() },
        casetta(), el('span', { text: 'HOME' })));
    // titolo: false (TEBE e OPHILYA, come nella loro dashboard originale): niente titolo né sottotitolo, al loro posto
    // l'interruttore dei negozi in alto a sinistra (classe .solo-selettori, regole in dashboard.css)
    if (dati.intestazione.titolo === false) {
      header.classList.add('solo-selettori');
    } else {
      header.append(el('h1', { text: dati.intestazione.titolo || 'Visual Merchandising Studio' }));
      if (dati.intestazione.sottotitolo) header.append(el('p', { text: dati.intestazione.sottotitolo }));
    }
    const interruttore = (dati.intestazione.interruttore || []).filter(id => PuntoVendita.NEGOZI[id]);
    if (interruttore.length >= 2) {
      header.append(el('div', { class: 'mode-switcher store-switch', role: 'group', 'aria-label': 'Negozio' },
        interruttore.map(id => el('button', { class: `mode-btn${id === negozio ? ' active' : ''}`, type: 'button',
          'aria-pressed': String(id === negozio), text: PuntoVendita.NEGOZI[id].nome,
          onclick: id === negozio ? null : () => PuntoVendita.scegli(id) }))));
    }
    return header;
  }

  function logoNegozio() {
    if (!dati.logo) return null;
    return el('div', { class: 'store-hero' },
      el('img', { class: 'store-logo', src: risorsa(dati.logo.src), alt: dati.logo.alt || Negozi.corrente().nome,
        style: dati.logo.larghezza ? `--store-logo-larghezza: ${dati.logo.larghezza}px` : false }),
      dati.identita ? el('div', { class: 'store-identity' },
        el('strong', { text: dati.identita[0] }), dati.identita[1] ? el('span', { text: dati.identita[1] }) : null) : null);
  }

  // Banner dell'intestazione: le scritte si alternano in giro, una ogni 10 secondi, quella in uscita sale e sparisce,
  // quella nuova entra dal basso (stile in dashboard.css, .testata-centro); parte con la prima visibile
  function alternaTestata(scritte) {
    let attiva = scritte[0];
    scritte.forEach((scritta, indice) => {
      scritta.classList.remove('is-visibile', 'is-sotto', 'is-sopra');
      scritta.classList.add(indice ? 'is-sotto' : 'is-visibile');
    });
    setInterval(() => {
      const prossima = scritte[(scritte.indexOf(attiva) + 1) % scritte.length];
      attiva.classList.replace('is-visibile', 'is-sopra');
      prossima.classList.remove('is-sotto');
      prossima.classList.add('is-visibile');
      const uscita = attiva;
      // finito lo scorrimento, la scritta uscita torna sotto senza animazione, pronta per il giro dopo
      setTimeout(() => {
        uscita.classList.add('senza-animazione');
        uscita.classList.replace('is-sopra', 'is-sotto');
        uscita.offsetHeight;
        uscita.classList.remove('senza-animazione');
      }, 900);
      attiva = prossima;
    }, 10 * 1000);
  }

  // Banner dell'intestazione, da desktop e tablet: si vede solo se la scritta più larga entra tutta tra i due elementi ai
  // lati (selettori, data e ora) con 24 px di respiro per parte; stringendo la finestra, prima di essere coperto o
  // tagliato, sparisce con una dissolvenza (.is-nascosto in dashboard.css) e ricompare quando torna lo spazio
  function controllaBanner(banner, testata) {
    const RESPIRO = 24;
    const misura = () => {
      if (phoneViewQuery.matches || banner.parentElement !== testata) return;
      const stile = getComputedStyle(testata);
      const interno = testata.clientWidth - parseFloat(stile.paddingLeft) - parseFloat(stile.paddingRight);
      // gli elementi ai lati, nel flusso dell'intestazione (non il pulsante HOME, fisso)
      const lati = [...testata.children].filter(figlio => figlio !== banner && figlio.offsetWidth
        && !['fixed', 'absolute'].includes(getComputedStyle(figlio).position));
      const lato = Math.max(0, ...lati.map(figlio => figlio.getBoundingClientRect().width));
      const serve = Math.max(0, ...[...banner.children].map(scritta => scritta.scrollWidth));
      banner.classList.toggle('is-nascosto', serve > interno - 2 * (lato + RESPIRO));
    };
    new ResizeObserver(misura).observe(testata);
    document.fonts?.ready.then(misura);
    new MutationObserver(misura).observe(document.documentElement,
      { attributes: true, attributeFilter: ['data-interface-look'] });
    phoneViewQuery.addEventListener('change', misura);
    requestAnimationFrame(misura);
  }

  // Finestra desktop stretta (fino a 720 px con il mouse): il menu laterale è chiuso e il banner non c'è, quindi al suo
  // posto, nello spazio libero tra ☰ e i selettori a destra, la scritta STORE // CRAFT in Cinzel come nel menu laterale
  // (.testata-marchio in dashboard.css); se non entra con 24 px di respiro per parte si nasconde. Non sul telefono,
  // dove STORE // CRAFT sta già nella barra in alto
  function marchioStretto(testata) {
    const RESPIRO = 24;
    const marchio = el('div', { class: 'testata-marchio', 'aria-hidden': 'true', text: 'STORE // CRAFT' });
    testata.append(marchio);
    const menu = document.querySelector('.mobile-nav-toggle');
    const misura = () => {
      marchio.hidden = true;
      if (!narrowViewQuery.matches || phoneViewQuery.matches || !menu) return;
      const selettori = [...testata.querySelectorAll('.mode-switcher')].filter(selettore => selettore.offsetWidth)
        .map(selettore => selettore.getBoundingClientRect());
      if (!selettori.length) return;
      const riquadro = testata.getBoundingClientRect();
      const inizio = menu.getBoundingClientRect().right + RESPIRO;
      const fine = Math.min(...selettori.map(rettangolo => rettangolo.left)) - RESPIRO;
      marchio.hidden = false;
      const larghezza = marchio.offsetWidth;
      if (fine - inizio < larghezza) { marchio.hidden = true; return; }
      // al centro dello spazio libero, alla stessa altezza dei selettori
      marchio.style.left = `${(inizio + fine - larghezza) / 2 - riquadro.left}px`;
      marchio.style.top = `${(selettori[0].top + selettori[0].bottom) / 2 - riquadro.top}px`;
    };
    new ResizeObserver(misura).observe(testata);
    document.fonts?.ready.then(misura);
    new MutationObserver(misura).observe(document.documentElement,
      { attributes: true, attributeFilter: ['data-interface-look'] });
    narrowViewQuery.addEventListener('change', misura);
    phoneViewQuery.addEventListener('change', misura);
    requestAnimationFrame(misura);
  }

  function disegna() {
    if (!dati) throw new Error(`Contenuto della dashboard non trovato: assets/negozi/${negozio}-dashboard.js`);
    // Pagine in ghost (Gestione negozi, nascosta: true): le loro schede non si vedono, né come widget né nel menu
    // laterale; una sezione che resta senza schede sparisce, e la voce Etichette DYMO se la sua pagina è in ghost
    const pagina = link => String(link || '').split('?')[0];
    const fantasmi = new Set(dati.sezioni.flatMap(s => s.schede).filter(s => s.nascosta && s.link).map(s => pagina(s.link)));
    dati.sezioni.forEach(s => { s.schede = s.schede.filter(scheda => !scheda.nascosta); });
    dati.sezioni = dati.sezioni.filter(s => s.schede.length);
    if (dati.etichette && fantasmi.has(pagina(dati.etichette))
      && !dati.sezioni.some(s => s.schede.some(scheda => pagina(scheda.link) === pagina(dati.etichette)))) dati.etichette = null;
    const corpo = document.body;
    corpo.classList.add('sidebar-collapsed');
    if (dati.cassa === 'solo-cassiere') corpo.classList.add('cassa-solo-cassiere');
    const modalita = () => el('div', { class: 'mode-switcher', 'aria-label': 'Modalità interfaccia' },
      el('button', { class: 'mode-btn', 'data-mode': 'cassiere', type: 'button', onclick: () => setLayoutMode('cassiere'), text: 'CASSIERE' }),
      el('button', { class: 'mode-btn active', 'data-mode': 'creator', type: 'button', onclick: () => setLayoutMode('creator'), text: 'CREATOR' }));

    const strumenti = el('div', { class: 'tools-grid', id: 'tools' });
    corpo.append(
      el('div', { class: 'sidebar-overlay', onclick: () => toggleMobileSidebar() }),
      el('div', { class: 'mobile-top-bar' },
        el('button', { class: 'mobile-nav-toggle', type: 'button', 'aria-label': 'Apri menu', 'aria-controls': 'sidebar-menu',
          'aria-expanded': 'false', onclick: () => premiTastoMenu(), text: '☰' }),
        el('button', { class: 'mobile-brand', type: 'button', onclick: () => returnToHomeTop(), text: 'STORE // CRAFT' }),
        modalita()),
      el('aside', { id: 'sidebar-menu' },
        el('div', { class: 'sidebar-header' },
          el('button', { class: 'brand', type: 'button', onclick: () => returnToHomeTop(), text: 'STORE // CRAFT' }),
          el('button', { class: 'mobile-close-btn', type: 'button', 'aria-label': 'Chiudi menu', onclick: () => toggleMobileSidebar(), text: '✕' })),
        menuLaterale(),
        menuSistema(),
        el('div', { class: 'sidebar-bottom' },
          el('div', { class: 'storecraft-mark' }, el('img', { src: risorsa('img/storecraftlogo.png'), alt: 'StoreCraft' })),
          el('div', { class: 'signature-caption', text: 'CRAFTED WITH STORECRAFT' }),
          el('div', { class: 'sidebar-credits' },
            el('button', { class: 'system-menu-toggle', id: 'system-menu-toggle', type: 'button', 'aria-expanded': 'false',
              'aria-controls': 'system-menu', onclick: () => toggleSystemMenu(), text: 'MENU // IMPOSTAZIONI' })))),
      el('main', { id: 'main-content' },
        intestazione(),
        logoNegozio(),
        dati.sezioni.map(sezione),
        el('div', { class: 'section-title', id: 'tools-title', text: 'Utilità Cassa' }),
        strumenti,
        piedePagina()),
      pulsanteImpostazioni());
    Cassa.crea(strumenti, { qr: dati.qr || '' });
    // appena la pagina è pronta (theme.js collega il menu a DOMContentLoaded, prima di questo)
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', riapriMenuNegozi, { once: true });
    else riapriMenuNegozi();
    postoMenuSistema();
    phoneViewQuery.addEventListener('change', postoMenuSistema);
    window.addEventListener('scroll', alzaPulsanteImpostazioni, { passive: true });
    window.addEventListener('resize', alzaPulsanteImpostazioni);
    phoneViewQuery.addEventListener('change', alzaPulsanteImpostazioni);
    // Intestazione con titolo (Luxury): da desktop e tablet titolo e sottotitolo si alternano ogni 10 secondi con
    // indirizzo e descrizione, allineati a sinistra, con lo stesso scorrimento verso l'alto di TEBE e OPHILYA
    // (.testata-sinistra in dashboard.css); il logo resta sotto, da solo nella sua riga. Sul telefono indirizzo e
    // descrizione tornano nella riga del logo, nascosti
    const intestazioneTitolo = corpo.querySelector('#main-content > header:not(.solo-selettori)');
    const identitaNegozio = corpo.querySelector('#main-content > .store-hero .store-identity');
    if (intestazioneTitolo && identitaNegozio && !intestazioneTitolo.querySelector('.store-switch')) {
      const titoli = el('div', { class: 'testata-titoli' }, ...intestazioneTitolo.querySelectorAll(':scope > :is(h1, p)'));
      const banner = el('div', { class: 'testata-centro testata-sinistra', 'aria-live': 'off' }, titoli);
      intestazioneTitolo.append(banner);
      const rigaLogo = identitaNegozio.parentElement;
      const posto = () => {
        if (phoneViewQuery.matches) rigaLogo.append(identitaNegozio);
        else banner.append(identitaNegozio);
      };
      phoneViewQuery.addEventListener('change', posto);
      posto();
      alternaTestata([titoli, identitaNegozio]);
    }
    // Intestazione senza titolo e senza interruttore dei negozi (Luxury dal 10 ottobre 2026): da desktop e tablet, come in
    // TEBE e OPHILYA, una sola riga in tre colonne (.con-logo in dashboard.css): a sinistra il posto dell'interruttore,
    // al centro il banner (la scritta Visual Merchandising Studio, poi indirizzo e descrizione, centrati) e a destra
    // CASSIERE / CREATOR. Il posto a sinistra resta vuoto, salvo logo nei contenuti: logo: true vi sposta il logo della
    // riga sotto, logo: 'percorso' vi mette un'immagine propria (colorata come il logo); in questi due casi la riga del
    // logo si nasconde. Sul telefono logo e selettore tornano al loro posto
    const testataLogo = corpo.querySelector('#main-content > header.solo-selettori');
    const rigaHero = corpo.querySelector('#main-content > .store-hero');
    if (testataLogo && rigaHero && !testataLogo.querySelector('.store-switch')) {
      testataLogo.classList.add('con-logo');
      const logoHero = rigaHero.querySelector('.store-logo');
      const selettoreCassa = corpo.querySelector('.mobile-top-bar .mode-switcher');
      const barraTelefono = corpo.querySelector('.mobile-top-bar');
      const identitaHero = rigaHero.querySelector('.store-identity');
      const sceltaLogo = dati.intestazione.logo;
      const logoProprio = typeof sceltaLogo === 'string'
        ? el('img', { class: 'store-logo logo-testata', src: risorsa(sceltaLogo), alt: dati.logo?.alt || Negozi.corrente().nome })
        : null;
      const riquadroLogo = el('div', { class: 'testata-logo' }, logoProprio);
      // dataOra: true nei contenuti (Luxury): nel posto a sinistra, senza logo, data e ora del giorno (es. VEN 10 OTT ·
      // 10:42) in un riquadro con l'aspetto e la larghezza di CASSIERE / CREATOR (stesse classi, regole in dashboard.css,
      // .orologio-testata); si aggiorna a ogni minuto
      if (!sceltaLogo && dati.intestazione.dataOra) {
        const testo = el('span', { class: 'mode-btn' });
        const orologio = el('div', { class: 'mode-switcher orologio-testata', role: 'timer', 'aria-label': 'Data e ora' }, testo);
        riquadroLogo.append(orologio);
        const scrivi = () => {
          const ora = new Date();
          const giorno = ora.toLocaleDateString('it-IT', { weekday: 'short' }).replace('.', '');
          const mese = ora.toLocaleDateString('it-IT', { month: 'short' }).replace('.', '');
          const orario = ora.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
          // la data in oro, l'ora in bianco (nel tema chiaro scura), divise da un puntino tenue
          testo.replaceChildren(el('span', { class: 'orologio-data', text: `${giorno} ${ora.getDate()} ${mese}`.toUpperCase() }),
            el('span', { class: 'orologio-punto', text: '·' }), el('span', { class: 'orologio-ora', text: orario }));
          setTimeout(scrivi, 60000 - (Date.now() % 60000) + 50);
        };
        scrivi();
        // largo come il selettore CASSIERE / CREATOR, che cambia con l'aspetto
        const pareggia = () => {
          orologio.style.minWidth = '';
          if (!phoneViewQuery.matches) orologio.style.minWidth = `${Math.ceil(selettoreCassa.offsetWidth)}px`;
        };
        document.fonts?.ready.then(pareggia);
        window.addEventListener('resize', pareggia);
        new MutationObserver(pareggia).observe(document.documentElement,
          { attributes: true, attributeFilter: ['data-interface-look', 'data-interface-theme'] });
        requestAnimationFrame(pareggia);
      }
      const titoloBanner = el('div', { class: 'testata-titolo', text: 'Visual Merchandising Studio' });
      const banner = el('div', { class: 'testata-centro', 'aria-live': 'off' }, titoloBanner);
      testataLogo.append(riquadroLogo, banner);
      const posto = () => {
        if (phoneViewQuery.matches) {
          if (logoHero) rigaHero.prepend(logoHero);
          if (identitaHero) rigaHero.append(identitaHero);
          barraTelefono.append(selettoreCassa);
        } else {
          if (sceltaLogo === true && logoHero) riquadroLogo.append(logoHero);
          if (identitaHero) banner.append(identitaHero);
          testataLogo.append(selettoreCassa);
        }
        rigaHero.classList.toggle('is-vuota', !phoneViewQuery.matches && Boolean(sceltaLogo));
      };
      phoneViewQuery.addEventListener('change', posto);
      posto();
      alternaTestata([titoloBanner, identitaHero].filter(Boolean));
      controllaBanner(banner, testataLogo);
      marchioStretto(testataLogo);
    }
    // l'interruttore dei negozi sta a sinistra del selettore CASSIERE / CREATOR, largo uguale (la larghezza del più largo
    // dei due, --larghezza-selettore, che cambia con l'aspetto), e titolo e sottotitolo lasciano libero lo spazio dei due
    // selettori (--larghezza-selettori); variabili usate da dashboard.css
    const selettore = corpo.querySelector('.mobile-top-bar .mode-switcher');
    const negozi = corpo.querySelector('.store-switch');
    if (negozi) {
      const radice = document.documentElement.style;
      const misura = () => {
        radice.removeProperty('--larghezza-selettore');
        const larghezza = Math.ceil(Math.max(selettore.offsetWidth, negozi.offsetWidth));
        radice.setProperty('--larghezza-selettore', `${larghezza}px`);
        radice.setProperty('--larghezza-selettori', `${2 * larghezza + 14}px`);
        radice.setProperty('--altezza-selettore', `${Math.ceil(selettore.offsetHeight)}px`);
        adattaTitolo();
      };
      // titolo e sottotitolo restano su una riga (dashboard.css, da desktop e tablet). Se a sinistra dei due selettori
      // affiancati il titolo dovrebbe scendere sotto il 90% della sua grandezza, i selettori si mettono uno sotto l'altro
      // (classe .selettori-in-colonna sul body); se lo spazio ancora non basta, il carattere si rimpicciolisce quanto serve
      const testi = () => [...corpo.querySelectorAll('#main-content > header :is(h1, p)')];
      const scala = testo => {
        const stile = getComputedStyle(testo);
        if (stile.whiteSpace !== 'nowrap') return 1;
        const spazio = testo.clientWidth - parseFloat(stile.paddingLeft) - parseFloat(stile.paddingRight);
        const intervallo = document.createRange();
        intervallo.selectNodeContents(testo);
        const larghezza = intervallo.getBoundingClientRect().width;
        return larghezza > spazio && spazio > 0 ? spazio / larghezza : 1;
      };
      const adattaTitolo = () => {
        testi().forEach(testo => { testo.style.fontSize = ''; });
        document.body.classList.remove('selettori-in-colonna');
        if (Math.min(...testi().map(scala)) < 0.9) document.body.classList.add('selettori-in-colonna');
        testi().forEach(testo => {
          const fattore = scala(testo);
          if (fattore < 1) testo.style.fontSize = `${parseFloat(getComputedStyle(testo).fontSize) * fattore}px`;
        });
      };
      // sul telefono, come nella dashboard originale di TEBE, l'interruttore sta nella barra in alto al posto della scritta
      // STORE // CRAFT (nascosta da dashboard.css), tra ☰ e CASSIERE / CREATOR; tornando a desktop o tablet torna
      // nell'intestazione
      // Nell'intestazione senza titolo (.solo-selettori, TEBE e OPHILYA) anche CASSIERE / CREATOR sta nell'intestazione,
      // a destra, allineato al bordo destro del contenuto come nella dashboard originale di TEBE, e indirizzo e
      // descrizione salgono al centro tra i due selettori (sul telefono tornano nella riga del logo, dove sono nascosti)
      const testata = corpo.querySelector('#main-content > header');
      const barra = corpo.querySelector('.mobile-top-bar');
      const rigaLogo = corpo.querySelector('#main-content > .store-hero');
      const identita = rigaLogo?.querySelector('.store-identity');
      // Al centro dell'intestazione indirizzo e descrizione si alternano ogni 10 secondi con la scritta Visual Merchandising
      // Studio, con un effetto di scorrimento verso l'alto (stile in dashboard.css, .testata-centro)
      const centro = testata.classList.contains('solo-selettori') && identita
        ? el('div', { class: 'testata-centro', 'aria-live': 'off' },
          el('div', { class: 'testata-titolo is-sotto', text: 'Visual Merchandising Studio' }))
        : null;
      if (centro) alternaTestata([identita, centro.querySelector('.testata-titolo')]);
      const posto = () => {
        if (phoneViewQuery.matches) {
          barra.append(selettore);
          selettore.before(negozi);
          if (identita) rigaLogo.append(identita);
        } else {
          testata.append(negozi);
          if (testata.classList.contains('solo-selettori')) {
            if (centro) {
              centro.prepend(identita);
              testata.append(centro);
            }
            testata.append(selettore);
          }
        }
        misura();
      };
      phoneViewQuery.addEventListener('change', posto);
      posto();
      if (centro) controllaBanner(centro, testata);
      marchioStretto(testata);
      document.fonts?.ready.then(misura);
      window.addEventListener('resize', misura);
      new MutationObserver(misura).observe(document.documentElement,
        { attributes: true, attributeFilter: ['data-interface-look', 'data-interface-theme'] });
    }
  }

  window.Dashboard = Object.freeze({
    contenuto(contenuto) { dati = contenuto; },
    disegna
  });

  // ===== Comportamento della dashboard (dalla dashboard Luxury) =====
  const phoneViewQuery = window.matchMedia('screen and (max-width: 720px) and (pointer: coarse)');
  const narrowViewQuery = window.matchMedia('screen and (max-width: 720px)');

  function updateCarouselArrows() {
    Caroselli.refresh();
  }

  // ☰ toccato: sul telefono dà prima un segno al tocco (si riempie d'oro e si abbassa un attimo, classe si-apre in
  // dashboard.css) e il menu, che parte dal bordo alto e coprirebbe subito ☰, si apre 0,15 s dopo
  function premiTastoMenu() {
    const toggle = document.querySelector('.mobile-nav-toggle');
    const apre = document.body.classList.contains('sidebar-collapsed');
    if (!apre || !phoneViewQuery.matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      toggleMobileSidebar();
      return;
    }
    toggle.classList.remove('si-apre');
    void toggle.offsetWidth;
    toggle.classList.add('si-apre');
    toggle.addEventListener('animationend', () => toggle.classList.remove('si-apre'), { once: true });
    setTimeout(() => toggleMobileSidebar(true), 150);
  }

  function toggleMobileSidebar(forceOpen) {
    const open = typeof forceOpen === 'boolean' ? forceOpen : document.body.classList.contains('sidebar-collapsed');
    document.body.classList.toggle('sidebar-collapsed', !open);
    const toggle = document.querySelector('.mobile-nav-toggle');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
    setTimeout(updateCarouselArrows, 300);
  }

  // Apre o chiude una sezione del menu laterale; ogni caricamento della dashboard riparte da chiuso.
  // Sul telefono si apre una sezione alla volta: aprendone una, le altre si chiudono; le voci si aprono e si chiudono
  // scorrendo (0,26 s). La sezione che si chiude resta visibile durante l'animazione (data-chiusura, dashboard.css);
  // controllaSpazioMenu misura comunque la forma finale.
  function toggleSidebarSection(sectionId) {
    const section = document.querySelector(`[data-sidebar-section="${sectionId}"]`);
    if (!section) return;
    if (phoneViewQuery.matches && section.classList.contains('is-collapsed')) {
      document.querySelectorAll('.sidebar-section:not(.is-collapsed)').forEach(aperta => {
        if (aperta !== section) toggleSidebarSection(aperta.dataset.sidebarSection);
      });
    }
    const toggle = section.querySelector('.section-toggle');
    const title = section.querySelector('.label span').textContent;
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    const nav = section.querySelector('nav');
    const anima = nav && phoneViewQuery.matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (anima) nav.getAnimations().forEach(animazione => animazione.cancel());
    const altezzaPrima = anima && isExpanded ? nav.offsetHeight : 0;
    toggle.setAttribute('aria-expanded', String(!isExpanded));
    toggle.setAttribute('aria-label', `${isExpanded ? 'Espandi' : 'Comprimi'} ${title}`);
    section.classList.toggle('is-collapsed', isExpanded);
    if (!isExpanded && section.classList.contains('ruota')) giraRuota(nav);
    if (!anima) return;
    const segno = isExpanded ? 'chiusura' : 'apertura';
    const altezza = isExpanded ? altezzaPrima : nav.offsetHeight;
    const aperto = { height: `${altezza}px`, opacity: 1 };
    const chiuso = { height: '0px', opacity: 0 };
    section.dataset[segno] = '';
    nav.style.overflow = 'hidden';
    const fine = () => {
      delete section.dataset[segno];
      nav.style.overflow = '';
      if (!isExpanded && section.classList.contains('ruota')) aggiornaRuota(nav);
    };
    nav.animate(isExpanded ? [aperto, chiuso] : [chiuso, aperto], { duration: 260, easing: 'ease' })
      .finished.then(fine, fine);
  }

  // Il clic sul titolo di una sezione (non solo sulla freccia) la apre o la chiude.
  function enableSidebarLabelToggle() {
    document.querySelectorAll('.sidebar-section > .label').forEach(label => {
      const sectionId = label.parentElement.dataset.sidebarSection;
      label.addEventListener('click', event => {
        if (event.target.closest('.section-toggle')) return;
        toggleSidebarSection(sectionId);
      });
    });
  }

  function initializeSidebarSections() {
    document.querySelectorAll('.sidebar-section').forEach(section => {
      const toggle = section.querySelector('.section-toggle');
      const title = section.querySelector('.label span').textContent;
      section.classList.add('is-collapsed');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', `Espandi ${title}`);
    });
    const promoToggle = document.querySelector('.nav-subtoggle[aria-controls="promoItems"]');
    promoToggle?.setAttribute('aria-expanded', 'false');
    const cartelli = document.getElementById('cartelliItems');
    const promo = document.getElementById('promoItems');
    if (cartelli) cartelli.hidden = false;
    if (promo) promo.hidden = true;
  }

  // PROMO STAGIONALI dentro CREA CARTELLI: aperta nasconde le voci dei cartelli e mostra le promo, chiusa il contrario.
  function togglePromoSubsection(buttonElem) {
    const isOpen = buttonElem.getAttribute('aria-expanded') !== 'true';
    buttonElem.setAttribute('aria-expanded', String(isOpen));
    document.getElementById('cartelliItems').hidden = isOpen;
    document.getElementById('promoItems').hidden = !isOpen;
    const nav = buttonElem.closest('.ruota > nav');
    const guida = nav?.querySelector('.voce-guida');
    if (guida) guida.textContent = isOpen ? '— Trova la tua promo —' : '— Trova il tuo cartello —';
    if (nav) giraRuota(nav);
  }

  // Rotella del telefono: nelle sezioni con almeno 4 voci (classe ruota) le voci scorrono in un riquadro con lo scatto al
  // centro; la voce al centro è ingrandita e oro, le altre più piccole e sfumate secondo la distanza (--vicino, da 0 a 1;
  // regole nel blocco telefono di dashboard.css). Su desktop e tablet il riquadro non c'è e --vicino non conta.
  const VOCI_RUOTA = ':is(.nav-btn, .nav-subtoggle)';
  // sopra la prima voce una voce guida, solo decorativa (non si sceglie), sfumata come le altre: fa capire che le voci
  // scorrono anche quando la rotella è all'inizio
  const GUIDE_RUOTA = { cartelli: 'Trova il tuo cartello', cartellini: 'Trova il tuo cartellino', stampe: 'Trova la tua stampa',
    cassa: 'Trova lo strumento' };
  function aggiornaRuota(nav) {
    if (!phoneViewQuery.matches) return;
    const riquadro = nav.getBoundingClientRect();
    if (!riquadro.height) return;
    const centro = riquadro.top + riquadro.height / 2;
    nav.querySelectorAll(':is(.nav-btn, .nav-subtoggle, .voce-guida)').forEach(voce => {
      if (!voce.offsetParent) return;
      const r = voce.getBoundingClientRect();
      const distanza = Math.abs(r.top + r.height / 2 - centro) / (riquadro.height / 2);
      voce.style.setProperty('--vicino', Math.max(0, 1 - distanza).toFixed(3));
      voce.classList.toggle('is-centro', distanza < r.height / riquadro.height);
    });
  }
  // riporta la rotella alla prima voce (al centro) e la ridisegna appena la sezione è aperta
  function giraRuota(nav) {
    nav.scrollTop = 0;
    requestAnimationFrame(() => aggiornaRuota(nav));
  }
  function attivaRuote() {
    document.querySelectorAll('.sidebar-section').forEach(section => {
      const nav = section.querySelector(':scope > nav');
      if (!nav || nav.querySelectorAll(VOCI_RUOTA).length < 4) return;
      section.classList.add('ruota');
      nav.prepend(el('span', { class: 'voce-guida', 'aria-hidden': 'true',
        text: `— ${GUIDE_RUOTA[section.dataset.sidebarSection] || 'Scorri le voci'} —` }));
      let attesa = 0;
      nav.addEventListener('scroll', () => {
        cancelAnimationFrame(attesa);
        attesa = requestAnimationFrame(() => aggiornaRuota(nav));
      }, { passive: true });
    });
  }

  // Pulsante + delle schede: apre e chiude insieme le specifiche di tutte le schede, senza aprire la pagina.
  function enableCardDescriptions() {
    const toggles = [...document.querySelectorAll('.card-body .spec-toggle')].filter(button => {
      const card = button.closest('.card, .carousel-card');
      return card && card.querySelector('.card-desc');
    });
    const setOpen = isOpen => {
      toggles.forEach(button => {
        button.closest('.card, .carousel-card').classList.toggle('desc-open', isOpen);
        button.setAttribute('aria-expanded', String(isOpen));
        button.setAttribute('aria-label', isOpen ? 'Nascondi specifiche' : 'Mostra specifiche');
        button.nextElementSibling.textContent = isOpen ? 'Nascondi specifiche' : 'Mostra specifiche';
      });
    };
    toggles.forEach(button => {
      const tip = document.createElement('span');
      tip.className = 'spec-tip';
      tip.setAttribute('aria-hidden', 'true');
      button.after(tip);
      button.setAttribute('role', 'button');
      button.setAttribute('tabindex', '0');
      const toggle = event => {
        event.preventDefault();
        event.stopPropagation();
        setOpen(button.getAttribute('aria-expanded') !== 'true');
      };
      button.addEventListener('click', toggle);
      button.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') toggle(event);
      });
    });
    setOpen(false);
  }

  function scrollCarousel(carouselId, direction) {
    const container = document.getElementById(carouselId);
    if (container) Caroselli.scroll(container, direction);
  }

  function scrollToSection(sectionId) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    if (narrowViewQuery.matches) {
      toggleMobileSidebar(false);
      setTimeout(updateCarouselArrows, 300);
    }
  }

  function returnToHomeTop() {
    const mainElem = document.getElementById('main-content');
    if (phoneViewQuery.matches) window.scrollTo({ top: 0, behavior: 'smooth' });
    else mainElem?.scrollTo({ top: 0, behavior: 'smooth' });
    Cassa.chiudi();
  }

  // Dal menu laterale: porta allo strumento di cassa e lo apre (popup su desktop e tablet, evidenziato sul telefono)
  function apriStrumento(id) {
    if (narrowViewQuery.matches) toggleMobileSidebar(false);
    if (phoneViewQuery.matches) {
      Cassa.apri(id, { scorri: true });
      return;
    }
    document.getElementById('tools-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    Cassa.apri(id, { scorri: true });
  }

  // Vista CASSIERE su desktop e tablet: la riga con logo e indirizzo sta in fondo alla pagina, con il bordo più basso
  // alla stessa altezza del fondo del pulsante MENU // IMPOSTAZIONI (margine sotto la riga in --hero-fondo, dashboard.css)
  function allineaRigaNegozio() {
    const mainElem = document.getElementById('main-content');
    const riga = mainElem?.querySelector(':scope > .store-hero');
    const pulsante = document.getElementById('system-menu-toggle')?.getBoundingClientRect();
    if (!riga || !riga.getClientRects().length || !document.body.classList.contains('cassiere-mode') || !pulsante?.height || pulsante.bottom > window.innerHeight) {
      mainElem?.style.removeProperty('--hero-fondo');
      return;
    }
    const fondoPulsante = window.innerHeight - pulsante.bottom;
    const spazioMain = parseFloat(getComputedStyle(mainElem).paddingBottom);
    // dal fondo della riga al suo elemento più basso (logo o indirizzo, anche se rimpicciolito con transform)
    const fondoRiga = riga.getBoundingClientRect().bottom;
    const piuBasso = Math.max(...[...riga.children].map(figlio => figlio.getBoundingClientRect().bottom));
    mainElem.style.setProperty('--hero-fondo', `${fondoPulsante - spazioMain - (fondoRiga - piuBasso)}px`);
  }

  function setLayoutMode(mode) {
    const mainElem = document.getElementById('main-content');
    const firstSection = mainElem.querySelector(':scope > div[id]:not(#tools)');
    const toolsSec = document.getElementById('tools');
    const toolsTitle = document.getElementById('tools-title');
    const riga = mainElem.querySelector(':scope > .store-hero');
    const header = mainElem.querySelector(':scope > header');
    const cassiere = mode === 'cassiere';
    const cambia = document.body.classList.contains('cassiere-mode') !== cassiere;
    document.body.classList.toggle('cassiere-mode', cassiere);
    document.querySelectorAll('.mode-btn[data-mode]').forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
    if (cassiere) {
      // si vedono solo le Utilità Cassa (le altre sezioni le nasconde dashboard.css); la riga del negozio va sotto i widget
      if (firstSection) {
        mainElem.insertBefore(toolsTitle, firstSection);
        mainElem.insertBefore(toolsSec, firstSection);
        if (riga) mainElem.insertBefore(riga, firstSection);
      }
    } else {
      if (riga && header) header.after(riga);
      mainElem.append(toolsTitle, toolsSec, document.querySelector('.mobile-brand-footer'));
    }
    allineaRigaNegozio();
    // comparsa dolce come nella splash page, un poco più veloce (0,75 s, ease-out): i contenuti salgono leggermente dal basso (16 px), la riga
    // del negozio scende leggermente dall'alto (16 px), 0,16 s dopo
    if (cambia && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const comparsa = da => [{ opacity: 0, transform: `translateY(${da}px)` }, { opacity: 1, transform: 'none' }];
      [...mainElem.children].filter(e => e !== riga && e !== header && getComputedStyle(e).display !== 'none')
        .forEach(e => e.animate(comparsa(16), { duration: 750, easing: 'ease-out', fill: 'backwards' }));
      riga?.animate(comparsa(-16), { duration: 750, delay: 160, easing: 'ease-out', fill: 'backwards' });
    }
    Cassa.chiudi();
    if (phoneViewQuery.matches) window.scrollTo({ top: 0, behavior: 'smooth' });
    else mainElem.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(updateCarouselArrows, 100);
  }

  // la riga del negozio della vista CASSIERE resta allineata al pulsante MENU // IMPOSTAZIONI
  window.addEventListener('resize', allineaRigaNegozio);
  new MutationObserver(allineaRigaNegozio).observe(document.documentElement,
    { attributes: true, attributeFilter: ['data-interface-look'] });

  phoneViewQuery.addEventListener('change', () => toggleMobileSidebar(false));
  narrowViewQuery.addEventListener('change', () => toggleMobileSidebar(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && narrowViewQuery.matches) toggleMobileSidebar(false);
  });

  // Funzioni chiamate anche da altri moduli o dal markup
  Object.assign(window, { toggleMobileSidebar, toggleSidebarSection, togglePromoSubsection, scrollCarousel,
    scrollToSection, returnToHomeTop, setLayoutMode, updateCarouselArrows });

  window.addEventListener('DOMContentLoaded', () => {
    if (!dati) return;
    initializeSidebarSections();
    enableSidebarLabelToggle();
    attivaRuote();
    enableCardDescriptions();
    Caroselli.init();

    const mainScroll = document.getElementById('main-content');
    const updateScrollState = () => {
      const scrollTop = phoneViewQuery.matches ? window.scrollY : mainScroll.scrollTop;
      document.body.classList.toggle('is-scrolled', scrollTop > 120);
    };
    mainScroll.addEventListener('scroll', updateScrollState);
    window.addEventListener('scroll', updateScrollState, { passive: true });
    phoneViewQuery.addEventListener('change', updateScrollState);
    window.addEventListener('pageshow', event => {
      if (event.persisted) initializeSidebarSections();
    });
    controllaSpazioMenu();
  });

  // Il menu laterale non deve mai scorrere: se aprendo una sezione lunga (es. CREA CARTELLI) il contenuto non entra,
  // prima spariscono il logo STORE // CRAFT e la scritta CRAFTED WITH STORECRAFT (classe firma-nascosta), poi, se serve
  // ancora, le voci si avvicinano quanto basta (--menu-stretto, fino a 7 px); regole in dashboard.css. Senza animazioni,
  // come il resto del menu: si misura dallo stato pieno e si sceglie il primo che entra.
  function controllaSpazioMenu() {
    const menu = document.getElementById('sidebar-menu');
    if (!menu?.querySelector('.sidebar-bottom')) return;
    const applica = (nascosta, stretto) => {
      menu.classList.toggle('firma-nascosta', nascosta);
      if (stretto) menu.style.setProperty('--menu-stretto', `${stretto}px`);
      else menu.style.removeProperty('--menu-stretto');
    };
    const troppo = () => menu.scrollHeight - menu.clientHeight > 1;
    // Scomparsa di logo e scritta: il menu passa subito alla forma nuova; una copia di logo e scritta, dove si vedevano
    // un attimo prima, si rimpicciolisce verso il centro (0,22 s) e poi si toglie. L'animazione non sposta niente nel
    // menu. La posizione si ricorda a ogni stato stabile, perché quando parte il controllo la sezione è già aperta e
    // logo e scritta sono già spinti in basso.
    let posizioni = null;   // { parti, riquadri } relativi al menu, con logo e scritta visibili
    const ricordaPosizioni = () => {
      const parti = [...menu.querySelectorAll('.sidebar-bottom :is(.storecraft-mark, .signature-caption)')];
      const base = menu.getBoundingClientRect();
      posizioni = { parti, riquadri: parti.map(parte => {
        const r = parte.getBoundingClientRect();
        return { left: r.left - base.left - menu.clientLeft + menu.scrollLeft, top: r.top - base.top - menu.clientTop + menu.scrollTop,
          width: r.width, height: r.height };
      }) };
    };
    const risucchia = () => {
      if (!posizioni || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const { parti, riquadri } = posizioni;
      if (!riquadri.some(r => r.height)) return;
      const alto = Math.min(...riquadri.map(r => r.top));
      const sinistra = Math.min(...riquadri.map(r => r.left));
      const copia = el('div', { class: 'firma-risucchio', 'aria-hidden': 'true' });
      copia.style.cssText = `left:${sinistra}px;top:${alto}px;width:${Math.max(...riquadri.map(r => r.left + r.width)) - sinistra}px;` +
        `height:${Math.max(...riquadri.map(r => r.top + r.height)) - alto}px`;
      parti.forEach((parte, i) => {
        const doppio = parte.cloneNode(true);
        doppio.style.cssText = `position:absolute;margin:0;left:${riquadri[i].left - sinistra}px;top:${riquadri[i].top - alto}px;` +
          `width:${riquadri[i].width}px;height:${riquadri[i].height}px`;
        copia.append(doppio);
      });
      menu.append(copia);
      copia.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0)', opacity: 0 }],
        { duration: 220, easing: 'ease-in', fill: 'forwards' }).finished.then(() => copia.remove(), () => copia.remove());
    };
    const controlla = () => {
      const eraVisibile = !menu.classList.contains('firma-nascosta');
      controllaStato();
      if (!menu.classList.contains('firma-nascosta')) ricordaPosizioni();
      else if (eraVisibile) risucchia();
    };
    // durante l'animazione delle sezioni (telefono) si misura la forma finale: la sezione che si chiude come chiusa,
    // quella che si apre come aperta
    const controllaStato = () => {
      const inChiusura = [...menu.querySelectorAll('[data-chiusura] > nav')];
      const inApertura = [...menu.querySelectorAll('[data-apertura] > nav')];
      inChiusura.forEach(nav => nav.style.setProperty('display', 'none', 'important'));
      inApertura.forEach(nav => nav.style.setProperty('height', 'auto', 'important'));
      try { misuraStato(); } finally {
        inChiusura.forEach(nav => nav.style.removeProperty('display'));
        inApertura.forEach(nav => nav.style.removeProperty('height'));
      }
    };
    const misuraStato = () => {
      applica(false, 0);
      // con MENU // IMPOSTAZIONI aperto dentro il menu laterale (aprendolo le sezioni si chiudono) il menu resta nella forma
      // piena: niente salti
      const sistema = document.getElementById('system-menu');
      if (sistema && !sistema.hidden && menu.contains(sistema)) return;
      // logo e scritta spariscono solo se lo spazio manca per una sezione aperta: con tutte le sezioni chiuse restano
      // (in una finestra molto bassa il menu scorre)
      if (!menu.querySelector('.sidebar-section:not(.is-collapsed)')) return;
      if (!troppo()) return;
      applica(true, 0);
      // voci più vicine di 1 px alla volta finché tutto entra (al massimo 7)
      for (let px = 1; px <= 7 && troppo(); px++) applica(true, px);
    };
    // si controlla quando cambia qualcosa dentro il menu (sezioni aperte o chiuse, PROMO STAGIONALI, apertura e chiusura
    // del menu di sistema, ma non le sue viste interne),
    // non per le classi messe da questo controllo sul menu stesso
    const sistema = document.getElementById('system-menu');
    new MutationObserver(registro => {
      if (registro.some(voce => voce.target !== menu && (voce.target === sistema || !sistema?.contains(voce.target)))) controlla();
    })
      .observe(menu, { subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'aria-expanded'] });
    new MutationObserver(controlla).observe(document.documentElement,
      { attributes: true, attributeFilter: ['data-interface-look'] });
    let attesa = 0;
    window.addEventListener('resize', () => { clearTimeout(attesa); attesa = setTimeout(controlla, 150); });
    controlla();
  }
})();
