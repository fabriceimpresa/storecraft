/* Vista telefono comune degli editor: cartelli e promo stagionali (body[data-layout="cartelli"]), cartellini e
   Prezzi Vetrina (body[data-layout="cartellini"] e "prezzi").
   Sul telefono la pagina è divisa in tre: in alto l'anteprima fissa, al centro il pannello che scorre, in fondo la
   barra di stampa. Desktop e tablet non cambiano: tutto ciò che si sposta torna al suo posto.
   Stile in assets/css/responsive.css. */
(() => {
  const layout = document.body.dataset.layout;
  const phone = window.matchMedia('screen and (max-width: 760px) and (pointer: coarse)');

  // Ricorda la posizione desktop di un elemento spostato sul telefono.
  function anchorBefore(element, text) {
    const anchor = document.createComment(text);
    element.before(anchor);
    return anchor;
  }

  // Sul telefono i selettori a pulsanti stanno su una riga: l'a capo si nasconde e al suo posto compare uno spazio.
  function addLineSpaces(selector) {
    document.querySelectorAll(selector).forEach(br => {
      const space = document.createElement('span');
      space.className = 'phone-line-space';
      space.textContent = ' ';
      br.after(space);
    });
  }

  // Barra di stampa fissa in fondo: pulsanti della lista di stampa, ANTEPRIMA e tasto di stampa.
  function createActionBar(moved, onPreview) {
    const bar = document.createElement('div');
    bar.className = 'phone-action-bar';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'Stampa');
    moved.forEach(element => { element.phoneAnchor = anchorBefore(element, 'Posizione desktop nella barra di stampa'); });
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'phone-preview-btn';
    button.setAttribute('aria-label', 'Anteprima di stampa del foglio A4');
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg><span>ANTEPRIMA</span>';
    button.addEventListener('click', onPreview);
    bar.append(button);
    document.body.append(bar);
    // Sul telefono gli elementi vanno nella barra (il tasto di stampa in fondo), altrimenti tornano al loro posto.
    const place = () => moved.forEach(element => {
      if (!phone.matches) element.phoneAnchor.after(element);
      else if (element.classList.contains('btn-print')) bar.append(element);
      else bar.prepend(element);
    });
    return { button, place };
  }

  // Intestazione dell'anteprima a tutto schermo, visibile solo quando è aperta.
  function createPreviewHead(preview, onClose) {
    const head = document.createElement('div');
    head.className = 'phone-preview-head';
    const title = document.createElement('span');
    title.textContent = 'ANTEPRIMA DI STAMPA · A4';
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'phone-preview-close';
    closeButton.setAttribute('aria-label', 'Chiudi anteprima di stampa');
    closeButton.textContent = '✕';
    closeButton.addEventListener('click', onClose);
    head.append(title, closeButton);
    preview.prepend(head);
    return closeButton;
  }

  // Anteprima a tutto schermo come finestra di dialogo accessibile; fit ridisegna l'anteprima.
  function createFullPreview(preview, fit) {
    let open = false;
    let previewButton = null;
    let closeButton = null;
    const set = value => {
      const next = Boolean(value) && phone.matches;
      if (open === next) return;
      open = next;
      document.body.classList.toggle('phone-full-preview', open);
      if (open) {
        preview.setAttribute('role', 'dialog');
        preview.setAttribute('aria-modal', 'true');
        preview.setAttribute('aria-label', 'Anteprima di stampa del foglio A4');
      } else {
        ['role', 'aria-modal', 'aria-label'].forEach(name => preview.removeAttribute(name));
      }
      if (previewButton) previewButton.setAttribute('aria-expanded', String(open));
      fit(false);
      const focus = open ? closeButton : previewButton;
      if (focus) focus.focus();
    };
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && open) set(false);
    });
    return {
      set,
      isOpen: () => open,
      bind(button, close) { previewButton = button; closeButton = close; }
    };
  }

  if (layout === 'cartelli') setupCartelli();
  else if (layout === 'cartellini' || layout === 'prezzi') setupCartellini();

  /* Cartelli e promo stagionali: in alto il cartello in modifica (superiore o inferiore), che scorre seguendo il
     selettore comune CARTELLO SUPERIORE / INFERIORE. */
  function setupCartelli() {
    const sheet = document.querySelector('#printSheet, .print-sheet, .a4-sheet');
    if (!sheet) return;

    // Cartello n del foglio: #cardN nella maggior parte delle pagine, #cartelloBoxN nel Magazzino.
    const cardElement = index => document.getElementById(`card${index}`) || document.getElementById(`cartelloBox${index}`);

    // Anteprima: un riquadro fermo (pulsanti dei temi, intestazione) e dentro un riquadro che scorre sul foglio.
    const preview = document.createElement('div');
    preview.className = 'phone-preview';
    sheet.before(preview);
    const frame = document.createElement('div');
    frame.className = 'phone-preview-frame';
    preview.append(frame);
    frame.append(sheet);

    // Pulsanti dei temi (Made in Italy, Black Friday, Natale): sul telefono in basso a destra dell'anteprima,
    // solo quelli del cartello in modifica.
    const themeButtons = [...document.querySelectorAll('.made-in-italy-btn, .black-friday-btn, .xmas-btn')];
    const toolbar = document.createElement('div');
    toolbar.className = 'phone-theme-toolbar';
    toolbar.setAttribute('role', 'group');
    toolbar.setAttribute('aria-label', 'Temi dei cartelli');
    const groups = new Map();
    const cardIndexOf = button => button.dataset.cardIndex || (button.className.includes('-lower') ? '2' : '1');
    const positions = themeButtons.map(button => {
      const anchor = anchorBefore(button, 'Posizione desktop del pulsante tema');
      const index = cardIndexOf(button);
      if (!groups.has(index)) {
        const group = document.createElement('div');
        group.className = 'phone-theme-group';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', index === '2' ? 'Temi del cartello inferiore' : 'Temi del cartello superiore');
        toolbar.append(group);
        groups.set(index, group);
      }
      return { button, anchor, index };
    });
    preview.append(toolbar);

    addLineSpaces('.sidebar .mode-switch button br');

    // Sul telefono il menu 1 / 2 cartelli ha il titolo Impostazioni di Stampa (sul desktop resta senza),
    // tranne nei menu su misura che hanno già il titolo di sezione IMPOSTAZIONI STAMPA.
    const sheetSelect = document.querySelector('.sidebar select[aria-label="Impostazioni di Stampa"]');
    const sheetGroup = sheetSelect && sheetSelect.closest('.form-group');
    const hasSectionTitle = sheetSelect && sheetSelect.closest('.panel-block')?.querySelector('.section-title');
    if (sheetGroup && !hasSectionTitle && sheetSelect.id) {
      const label = document.createElement('label');
      label.className = 'section-label phone-only-label';
      label.htmlFor = sheetSelect.id;
      label.textContent = 'Impostazioni di Stampa';
      sheetGroup.prepend(label);
    }

    const full = createFullPreview(preview, fitPreview);
    const actions = createActionBar(
      [document.querySelector('.tool-buttons'), document.querySelector('.sidebar .btn-print')].filter(Boolean),
      () => full.set(true)
    );
    full.bind(actions.button, createPreviewHead(preview, () => full.set(false)));

    // Cartello in modifica, letto dal selettore comune CARTELLO SUPERIORE / INFERIORE (senza selettore: il primo).
    function currentCard() {
      const lower = document.getElementById('selectCard2');
      return lower && lower.getAttribute('aria-pressed') === 'true' ? '2' : '1';
    }

    // Misure del foglio in px CSS, senza lo zoom: valgono per A4 e per il mezzo A4 (Magazzino con 1 CARTELLO).
    function sheetSize() {
      const style = getComputedStyle(sheet);
      return { width: parseFloat(style.width), height: parseFloat(style.height) };
    }

    // Porzione di foglio (in frazioni dell'altezza) che contiene il cartello: con due cartelli il foglio si divide
    // a metà dello spazio tra i due, con uno solo si lascia sotto lo stesso margine che c'è sopra.
    function cardSlot(index) {
      const sheetRect = sheet.getBoundingClientRect();
      if (!sheetRect.height) return [0, 0.5];
      const visible = ['1', '2'].map(n => {
        const card = cardElement(n);
        const rect = card && card.getBoundingClientRect();
        if (!rect || !rect.height) return null;
        return { n, top: (rect.top - sheetRect.top) / sheetRect.height, bottom: (rect.bottom - sheetRect.top) / sheetRect.height };
      }).filter(Boolean);
      if (visible.length === 2) {
        const middle = (visible[0].bottom + visible[1].top) / 2;
        return index === '2' ? [middle, 1] : [0, middle];
      }
      if (visible.length === 1) return [0, Math.min(1, visible[0].bottom + Math.max(0, visible[0].top))];
      return [0, 0.5];
    }

    function fitPreview(smooth) {
      if (!phone.matches) {
        sheet.style.removeProperty('zoom');
        frame.style.removeProperty('height');
        groups.forEach(group => { group.hidden = false; });
        return;
      }
      const style = getComputedStyle(frame);
      const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const size = sheetSize();
      if (full.isOpen()) {
        const zoom = Math.min(1, (frame.clientWidth - padX) / size.width, (window.innerHeight - padY) / size.height);
        sheet.style.zoom = String(zoom);
        frame.style.height = `${Math.round(size.height * zoom + padY)}px`;
        frame.scrollTo({ top: 0 });
        groups.forEach(group => { group.hidden = true; });
        return;
      }
      const zoom = Math.min(1, Math.max(1, frame.clientWidth - padX) / size.width);
      sheet.style.zoom = String(zoom);
      const index = currentCard();
      const [start, end] = cardSlot(index);
      const height = size.height * zoom;
      frame.style.height = `${Math.round((end - start) * height + padY)}px`;
      frame.scrollTo({ top: start * height, behavior: smooth ? 'smooth' : 'auto' });
      groups.forEach((group, groupIndex) => { group.hidden = groupIndex !== index; });
    }

    function update() {
      if (!phone.matches) full.set(false);
      positions.forEach(({ button, anchor, index }) => {
        if (phone.matches) groups.get(index).append(button);
        else anchor.after(button);
      });
      actions.place();
      fitPreview(false);
    }

    phone.addEventListener('change', update);
    window.addEventListener('resize', update);
    // Cambio di cartello (aria-pressed del selettore) o di numero di cartelli (classi sul foglio e sui cartelli).
    const panel = document.querySelector('.sidebar');
    if (panel) {
      new MutationObserver(() => { if (phone.matches) fitPreview(true); })
        .observe(panel, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
    }
    const layoutObserver = new MutationObserver(() => { if (phone.matches) fitPreview(false); });
    // Sul foglio non si osserva style: è lì che si scrive lo zoom.
    layoutObserver.observe(sheet, { attributes: true, attributeFilter: ['class', 'hidden'] });
    [cardElement('1'), cardElement('2')].filter(Boolean).forEach(card => {
      layoutObserver.observe(card, { attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
    });
    update();
  }

  /* Cartellini e Prezzi Vetrina: in alto il cartellino scelto, bordato d'oro e ingrandito al centro della sua riga,
     con metà dei vicini ai lati; cambiando linguetta l'anteprima scorre sul nuovo cartellino. La lente in basso a
     sinistra mostra tutta la pagina e riporta al cartellino. In Prezzi Vetrina la linguetta sceglie una colonna:
     si vede il cartellino di quella colonna nella prima riga. Le linguette stanno su una riga che scorre di lato. */
  function setupCartellini() {
    const main = document.querySelector('body > main');
    const wrap = main && main.querySelector('.sheet-wrap');
    const grid = document.getElementById('printable-grid');
    const tabs = document.getElementById('tabs-container');
    if (!wrap || !grid || !tabs) return;

    // Anteprima: un riquadro fermo (pulsante Sale, intestazione) e dentro la <main>, che scorre sul foglio.
    const preview = document.createElement('div');
    preview.className = 'phone-preview';
    main.before(preview);
    preview.append(main);

    // Pulsante del tema Sale (Quadrati): sul telefono in basso a destra dell'anteprima.
    const themeButtons = [...document.querySelectorAll('.sale-theme-btn')];
    const toolbar = document.createElement('div');
    toolbar.className = 'phone-theme-toolbar';
    toolbar.setAttribute('role', 'group');
    toolbar.setAttribute('aria-label', 'Temi dei cartellini');
    const group = document.createElement('div');
    group.className = 'phone-theme-group';
    toolbar.append(group);
    preview.append(toolbar);
    const positions = themeButtons.map(button => ({ button, anchor: anchorBefore(button, 'Posizione desktop del pulsante tema') }));

    addLineSpaces('aside .mode-switch button br');

    const full = createFullPreview(preview, fitPreview);
    const actions = createActionBar(
      [document.querySelector('.tool-buttons'), document.querySelector('#editorPanel .btn-print')].filter(Boolean),
      () => full.set(true)
    );
    full.bind(actions.button, createPreviewHead(preview, () => full.set(false)));

    let currentCard = null;

    // Cartellino scelto: la linguetta attiva indica il cartellino (o, in Prezzi Vetrina, la colonna, che nella
    // griglia riempita per righe è il cartellino con lo stesso indice nella prima riga).
    function selectedCard() {
      const index = [...tabs.children].findIndex(tab => tab.classList.contains('active'));
      return grid.children[Math.max(0, index)] || null;
    }

    function markCard(card) {
      if (currentCard && currentCard !== card) currentCard.classList.remove('phone-current-card');
      currentCard = phone.matches ? card : null;
      if (currentCard) currentCard.classList.add('phone-current-card');
      else if (card) card.classList.remove('phone-current-card');
    }

    // Lente in basso a sinistra dell'anteprima: passa dal cartellino ingrandito a tutta la pagina e ritorno.
    const LENS_ICON = sign => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/><path d="M7.5 10.5h6"/>' + (sign === '+' ? '<path d="M10.5 7.5v6"/>' : '') + '</svg>';
    let pageView = false;
    const lens = document.createElement('button');
    lens.type = 'button';
    lens.className = 'phone-lens-btn';
    lens.addEventListener('click', () => {
      pageView = !pageView;
      updateLens();
      fitPreview(false);
    });
    preview.append(lens);
    function updateLens() {
      lens.setAttribute('aria-pressed', String(pageView));
      lens.setAttribute('aria-label', pageView ? 'Ingrandisci il cartellino scelto' : 'Vedi tutta la pagina dei cartellini');
      lens.title = pageView ? 'Cartellino' : 'Tutta la pagina';
      lens.innerHTML = LENS_ICON(pageView ? '+' : '−');
    }
    updateLens();

    // Spazio del bordo oro attorno al cartellino scelto (outline 6 px + distanza 2 px, in responsive.css).
    const MARK = 8;
    // Larghezza visibile nell'anteprima ingrandita, in cartellini: quello scelto al centro e metà dei vicini ai lati.
    const CELLS = 2;

    // Riga del cartellino: posizione verticale (in px a schermo) della riga, della precedente e della successiva.
    function rowsAround(card) {
      const rect = card.getBoundingClientRect();
      const rows = [];
      [...grid.children].forEach(child => {
        const r = child.getBoundingClientRect();
        if (r.height && !rows.some(row => Math.abs(row.top - r.top) < 1)) rows.push({ top: r.top, bottom: r.bottom });
      });
      rows.sort((a, b) => a.top - b.top);
      const at = rows.findIndex(row => Math.abs(row.top - rect.top) < 1);
      return { rows, at };
    }

    // Larghezza di un cartellino con il suo spazio: distanza dal vicino nella stessa riga (o la sua larghezza).
    function cellWidth(card) {
      const rect = card.getBoundingClientRect();
      const lefts = [...grid.children]
        .map(child => child.getBoundingClientRect())
        .filter(r => r.height && Math.abs(r.top - rect.top) < 1 && Math.abs(r.left - rect.left) > 1)
        .map(r => Math.abs(r.left - rect.left));
      return lefts.length ? Math.min(...lefts) : rect.width;
    }

    // Tratto della <main> da mostrare (in px, coordinate del suo contenuto) per la riga del cartellino: la riga con
    // il suo bordo oro; la prima riga comincia dal bordo della <main>, l'ultima finisce sul bordo, così attorno al
    // foglio resta il margine dell'anteprima.
    function rowWindow(card, zoom, padTop, padBottom) {
      const sheetRect = grid.getBoundingClientRect();
      const whole = { top: 0, height: sheetRect.height + padTop + padBottom };
      if (!card || !sheetRect.height) return whole;
      const { rows, at } = rowsAround(card);
      if (at < 0) return whole;
      const top = at === 0 ? 0 : padTop + Math.max(0, rows[at].top - sheetRect.top - MARK * zoom);
      const bottom = at === rows.length - 1
        ? sheetRect.height + padTop + padBottom
        : padTop + Math.min(sheetRect.height, rows[at].bottom - sheetRect.top + MARK * zoom);
      return { top, height: bottom - top };
    }

    // Scorrimento orizzontale che mette il cartellino al centro dell'anteprima.
    function centerLeft(card) {
      if (!card) return 0;
      const rect = card.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      const center = rect.left - mainRect.left + main.scrollLeft + rect.width / 2;
      return Math.max(0, center - main.clientWidth / 2);
    }

    // Lo zoom sta sulla .sheet-wrap (come nelle regole di stampa e nella lista di stampa); le misure sono del foglio.
    function setZoom(zoom) {
      wrap.style.zoom = String(zoom);
      const rect = grid.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }

    function fitPreview(smooth) {
      if (!phone.matches) {
        wrap.style.removeProperty('zoom');
        main.style.removeProperty('height');
        markCard(null);
        return;
      }
      const card = selectedCard();
      markCard(card);
      const style = getComputedStyle(main);
      const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const padTop = parseFloat(style.paddingTop);
      const padBottom = parseFloat(style.paddingBottom);
      const padY = padTop + padBottom;
      const natural = setZoom(1);
      if (full.isOpen()) {
        // padY comprende lo spazio dell'intestazione (padding-top della <main> a tutto schermo).
        const zoom = Math.min(1, (main.clientWidth - padX) / natural.width, (window.innerHeight - padY) / natural.height);
        const size = setZoom(zoom);
        main.style.height = `${Math.round(size.height + padY)}px`;
        main.scrollTo({ top: 0, left: 0 });
        return;
      }
      const fitWidth = Math.min(1, Math.max(1, main.clientWidth - padX) / natural.width);
      // Tutta la pagina: il foglio intero a tutta larghezza.
      if (pageView || !card) {
        const size = setZoom(fitWidth);
        main.style.height = `${Math.round(size.height + padY)}px`;
        main.scrollTo({ top: 0, left: 0, behavior: smooth ? 'smooth' : 'auto' });
        return;
      }
      // Cartellino ingrandito: CELLS cartellini nella larghezza, mai meno della pagina intera.
      const zoom = Math.max(fitWidth, Math.min(1, main.clientWidth / (CELLS * cellWidth(card))));
      setZoom(zoom);
      const view = rowWindow(card, zoom, padTop, padBottom);
      main.style.height = `${Math.round(view.height)}px`;
      main.scrollTo({ top: view.top, left: centerLeft(card), behavior: smooth ? 'smooth' : 'auto' });
    }

    // La linguetta scelta resta visibile nella riga che scorre.
    function showActiveTab(smooth) {
      if (!phone.matches) return;
      const active = tabs.querySelector('.tab-item.active');
      if (!active) return;
      const left = active.offsetLeft - (tabs.clientWidth - active.offsetWidth) / 2;
      tabs.scrollTo({ left: Math.max(0, left), behavior: smooth ? 'smooth' : 'auto' });
    }

    function update() {
      if (!phone.matches) full.set(false);
      positions.forEach(({ button, anchor }) => {
        if (phone.matches) group.append(button);
        else anchor.after(button);
      });
      actions.place();
      fitPreview(false);
      showActiveTab(false);
    }

    phone.addEventListener('change', update);
    window.addEventListener('resize', update);
    // Le pagine ridisegnano linguette e griglia a ogni scelta: cambio di linguetta, cartellino escluso o modificato.
    // Lo scorrimento è morbido solo quando cambia la linguetta.
    const observer = new MutationObserver(records => {
      if (!phone.matches) return;
      const tabChanged = records.some(record => record.target === tabs);
      fitPreview(tabChanged);
      if (tabChanged) showActiveTab(true);
    });
    observer.observe(tabs, { childList: true });
    observer.observe(grid, { childList: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (phone.matches) fitPreview(false); });
    update();
  }
})();
