/* Vista telefono comune delle pagine cartelli e promo stagionali (body[data-layout="cartelli"]).
   Sul telefono la pagina è divisa in tre: in alto l'anteprima fissa del cartello in modifica, al centro il pannello
   che scorre, in fondo la barra di stampa. Desktop e tablet non cambiano: tutto ciò che si sposta torna al suo posto.
   Stile in assets/css/responsive.css. */
(() => {
  if (document.body.dataset.layout !== 'cartelli') return;
  const sheet = document.querySelector('#printSheet, .print-sheet, .a4-sheet');
  if (!sheet) return;
  const phone = window.matchMedia('screen and (max-width: 760px) and (pointer: coarse)');

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
    const anchor = document.createComment('Posizione desktop del pulsante tema');
    button.before(anchor);
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

  // Sul telefono i selettori a pulsanti stanno su una riga: l'a capo si nasconde e al suo posto compare uno spazio.
  document.querySelectorAll('.sidebar .mode-switch button br').forEach(br => {
    const space = document.createElement('span');
    space.className = 'phone-line-space';
    space.textContent = ' ';
    br.after(space);
  });

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

  // Barra di stampa fissa in fondo: pulsanti della lista di stampa, ANTEPRIMA e tasto di stampa.
  const actionBar = document.createElement('div');
  actionBar.className = 'phone-action-bar';
  actionBar.setAttribute('role', 'toolbar');
  actionBar.setAttribute('aria-label', 'Stampa');
  const moved = [document.querySelector('.tool-buttons'), document.querySelector('.sidebar .btn-print')].filter(Boolean);
  moved.forEach(element => {
    const anchor = document.createComment('Posizione desktop nella barra di stampa');
    element.before(anchor);
    element.phoneAnchor = anchor;
  });
  const previewButton = document.createElement('button');
  previewButton.type = 'button';
  previewButton.className = 'phone-preview-btn';
  previewButton.setAttribute('aria-label', 'Anteprima di stampa del foglio A4');
  previewButton.setAttribute('aria-expanded', 'false');
  previewButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg><span>ANTEPRIMA</span>';
  previewButton.addEventListener('click', () => setFullPreview(true));
  actionBar.append(previewButton);
  document.body.append(actionBar);

  // Intestazione dell'anteprima a tutto schermo, visibile solo quando è aperta.
  const head = document.createElement('div');
  head.className = 'phone-preview-head';
  const title = document.createElement('span');
  title.textContent = 'ANTEPRIMA DI STAMPA · A4';
  const closePreviewButton = document.createElement('button');
  closePreviewButton.type = 'button';
  closePreviewButton.className = 'phone-preview-close';
  closePreviewButton.setAttribute('aria-label', 'Chiudi anteprima di stampa');
  closePreviewButton.textContent = '✕';
  closePreviewButton.addEventListener('click', () => setFullPreview(false));
  head.append(title, closePreviewButton);
  preview.prepend(head);

  let fullPreview = false;

  // Anteprima a tutto schermo: lo stesso foglio, intero, rimpicciolito per entrare nello schermo.
  function setFullPreview(open) {
    const next = Boolean(open) && phone.matches;
    if (fullPreview === next) return;
    fullPreview = next;
    document.body.classList.toggle('phone-full-preview', fullPreview);
    if (fullPreview) {
      preview.setAttribute('role', 'dialog');
      preview.setAttribute('aria-modal', 'true');
      preview.setAttribute('aria-label', 'Anteprima di stampa del foglio A4');
    } else {
      ['role', 'aria-modal', 'aria-label'].forEach(name => preview.removeAttribute(name));
    }
    previewButton.setAttribute('aria-expanded', String(fullPreview));
    fitPreview(false);
    (fullPreview ? closePreviewButton : previewButton).focus();
  }

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
    if (fullPreview) {
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
    if (!phone.matches) setFullPreview(false);
    positions.forEach(({ button, anchor, index }) => {
      if (phone.matches) groups.get(index).append(button);
      else anchor.after(button);
    });
    moved.forEach(element => {
      if (!phone.matches) element.phoneAnchor.after(element);
      else if (element.classList.contains('btn-print')) actionBar.append(element);
      else actionBar.prepend(element);
    });
    fitPreview(false);
  }

  phone.addEventListener('change', update);
  window.addEventListener('resize', update);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && fullPreview) setFullPreview(false);
  });
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
})();
