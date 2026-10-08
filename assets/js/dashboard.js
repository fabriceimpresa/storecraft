/* Dashboard dei negozi, comune a tutti (luxury/index.html, tebe/index.html, ophilya/index.html: tre pagine uguali,
   cambia solo data-negozio). Il modello è la dashboard di Luxury Outlet. Stile in assets/css/dashboard.css, tema e
   aspetto con theme.css / theme.js, caroselli con caroselli.css / caroselli.js, Utilità Cassa con cassa.js.

   I contenuti del negozio (sezioni, schede, miniature, collegamenti, logo e indirizzo, intestazione) stanno in
   assets/negozi/<negozio>-dashboard.js, che chiama Dashboard.contenuto({...}); questo modulo lo carica da solo.
   La pagina chiama Dashboard.disegna() in fondo al <body>, prima che theme.js prepari il menu di sistema.

   Contenuto del negozio:
     intestazione   { titolo, sottotitolo, interruttore: ['tebe', 'ophilya'] } (interruttore facoltativo: negozi tra cui passare,
                    mostrati solo se installati almeno due)
     logo           { src (nella cartella assets/), larghezza, alt }: sotto il divisorio, bianco su fondo scuro e nero
                    su fondo chiaro
     identita       [riga principale, riga sotto] accanto al logo (es. indirizzo e descrizione)
     qr             collegamento iniziale del Generatore QR
     cassa          'sempre' oppure 'solo-cassiere' (Utilità Cassa solo in modalità CASSIERE)
     etichette      pagina delle etichette DYMO per la voce del menu laterale
     sezioni        [{ id, carosello, titolo, tipo, schede, voceMenu, stella }]
                    tipo: 'cartelli' (due righe; menu CREA CARTELLI), 'promo' (schede dorate; sottosezione PROMO
                    STAGIONALI), 'cartellini' (menu CARTELLINI), 'etichette' (schede DYMO), 'stampe' (PDF con Apri &
                    Stampa; menu STAMPE PRONTE con la voce voceMenu)
     schede         [{ titolo, link | pdf, tipo, miniature: [immagine, seconda immagine facoltativa] (nella cartella
                    assets/), alt, specifiche: [...], badge, compatto, voce (nome nel menu, se diverso dal titolo),
                    prossimamente (Coming Soon: scheda spenta, non nel menu), icona (emoji se la miniatura manca) }] */
(() => {
  // Versione del prodotto, visibile in CONTATTI & CREDITS (vedi "Versione del prodotto" in AGENTS.md)
  const VERSIONE = 'V 1.76 2026';
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
          disabled: !n.pronto, onclick: n.pronto ? () => PuntoVendita.scegli(id) : null },
          el('span', { text: n.nome }),
          n.pronto ? el('span', { 'aria-hidden': 'true', text: '›' }) : el('span', { class: 'system-menu-badge', text: 'IN ARRIVO' })));

    return el('section', { class: 'system-menu', id: 'system-menu', 'aria-label': 'Menu di sistema', hidden: true },
      el('div', { class: 'system-menu-heading system-menu-title', id: 'system-menu-title', text: 'MENU' }),
      el('div', { class: 'system-menu-view', 'data-system-view': 'home' },
        el('div', { class: 'system-menu-items' },
          voce('settings', '⚙', 'IMPOSTAZIONI', el('span', { 'aria-hidden': 'true', text: '›' }), () => openSystemMenuView('settings')),
          voce('profile', '♙', 'PROFILO UTENTE', el('span', { class: 'system-store-current', text: scheda.sigla }), () => openSystemMenuView('stores')),
          voce('store', '◈', 'STORE', el('span', { class: 'system-menu-badge', text: 'COMING SOON' }), null),
          voce('contacts', '✉', 'CONTATTI & CREDITS', el('span', { 'aria-hidden': 'true', text: '›' }), () => openSystemMenuView('contacts')),
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
    const classiCarosello = `carousel-container${s.tipo === 'cartelli' ? ' two-rows' : ''}${s.tipo === 'etichette' ? ' dymo' : ''}`;
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
        el('span', { class: 'home-mark-icon', 'aria-hidden': 'true', text: '⌂' }), el('span', { text: 'HOME' })));
    header.append(el('h1', { text: dati.intestazione.titolo || 'Visual Merchandising Studio' }));
    if (dati.intestazione.sottotitolo) header.append(el('p', { text: dati.intestazione.sottotitolo }));
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

  function disegna() {
    if (!dati) throw new Error(`Contenuto della dashboard non trovato: assets/negozi/${negozio}-dashboard.js`);
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
          'aria-expanded': 'false', onclick: () => toggleMobileSidebar(), text: '☰' }),
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
        el('div', { class: 'mobile-brand-footer', text: 'STORE // CRAFT' })));
    Cassa.crea(strumenti, { qr: dati.qr || '' });
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
      const testata = corpo.querySelector('#main-content > header');
      const posto = () => {
        if (phoneViewQuery.matches) selettore.before(negozi);
        else testata.append(negozi);
        misura();
      };
      phoneViewQuery.addEventListener('change', posto);
      posto();
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

  function toggleMobileSidebar(forceOpen) {
    const open = typeof forceOpen === 'boolean' ? forceOpen : document.body.classList.contains('sidebar-collapsed');
    document.body.classList.toggle('sidebar-collapsed', !open);
    const toggle = document.querySelector('.mobile-nav-toggle');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
    setTimeout(updateCarouselArrows, 300);
  }

  // Apre o chiude una sezione del menu laterale; ogni caricamento della dashboard riparte da chiuso.
  function toggleSidebarSection(sectionId) {
    const section = document.querySelector(`[data-sidebar-section="${sectionId}"]`);
    if (!section) return;
    const toggle = section.querySelector('.section-toggle');
    const title = section.querySelector('.label span').textContent;
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isExpanded));
    toggle.setAttribute('aria-label', `${isExpanded ? 'Espandi' : 'Comprimi'} ${title}`);
    section.classList.toggle('is-collapsed', isExpanded);
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
    if (!riga || !document.body.classList.contains('cassiere-mode') || !pulsante?.height || pulsante.bottom > window.innerHeight) {
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
    const controllaStato = () => {
      applica(false, 0);
      // con MENU // IMPOSTAZIONI aperto (aprendolo le sezioni si chiudono) il menu resta nella forma piena: niente salti
      if (!document.getElementById('system-menu')?.hidden) return;
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
