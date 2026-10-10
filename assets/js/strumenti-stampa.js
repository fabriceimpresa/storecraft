/*
 * Pulsanti "Gestisci lista di stampa" e "Aggiungi a lista stampa" (più "Dove montare la stampa?" nei negozi che la usano) per le pagine
 * cartelli e cartellini (l'Anteprima di Stampa resta disponibile come StrumentiStampa.openPrintPreview).
 * Uso: <script src="assets/js/strumenti-stampa.js" data-panel="…" data-sheet="…"></script> in fondo al body.
 *   data-panel: elemento dopo il quale inserire i pulsanti (predefinito ".sidebar > .controls")
 *   data-sheet: foglio da aggiungere alla lista di stampa e da mostrare nell'anteprima (predefinito ".print-sheet")
 * Stili in assets/css/strumenti-stampa.css.
 */
(function initStrumentiStampa() {
  const script = document.currentScript;
  const panelSelector = script?.dataset.panel || '.sidebar > .controls';
  const sheetSelector = script?.dataset.sheet || '.print-sheet';

  // Guida "Dove montare la stampa?" del negozio della pagina, nella sua scheda (assets/negozi/<negozio>.js, guida):
  // null la spegne e il pulsante non compare (Luxury Outlet); altrimenti per pagina le foto in assets/foto/<negozio>/.
  // Finché l'elenco di una pagina è vuoto il popup mostra dei riquadri segnaposto "Foto in arrivo".
  const NEGOZIO = document.documentElement.dataset.negozio;
  const SCHEDA = Negozi.corrente();
  const GUIDE = SCHEDA?.guida || null;
  const SHOW_GUIDE = Boolean(GUIDE);
  const GUIDE_PHOTOS = Object.fromEntries(Object.entries(GUIDE || {}).map(([page, files]) =>
    [page, files.map(file => ({ src: new URL(`../foto/${NEGOZIO}/${file}`, script.src).href }))]));
  // Finestra della lista di stampa: una per negozio, con il nome della lista nella scheda (listaStampa).
  const LIST_WINDOW = SCHEDA?.listaStampa || `${NEGOZIO}-lista-stampa`;

  const panel = document.querySelector(panelSelector);
  if (!panel) return;

  const HELP_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><text x="12" y="19" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="normal" font-size="20" fill="currentColor">?</text></svg>';
  // Foglio con il più
  const ADD_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v3"/><path d="M13 3v5h5"/><path d="M17.5 13.5v7"/><path d="M14 17h7"/></svg>';
  // Stampante per il pulsante della lista di stampa
  const PRINTER_PATHS = '<path d="M6.5 9V3.5h11V9"/><path d="M6.5 17.5H5a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4.5a2 2 0 0 1-2 2h-1.5"/><path d="M6.5 14h11v6.5h-11z"/><path d="M17 11.75h.01"/>';
  // Lista di stampa: stampante grande con un piccolo foglio davanti, in basso a destra; attorno al foglio la
  // stampante si interrompe (maschera) e resta un filo di spazio vuoto, come attorno al più di Aggiungi a lista stampa
  const PRINTER_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><defs><mask id="toolPrinterMask" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff"/><rect x="13.2" y="12.6" width="11" height="11.4" rx="1.2" fill="#000"/></mask></defs><g mask="url(#toolPrinterMask)"><g transform="translate(-0.4 -0.6) scale(0.95)" stroke-width="1.37">${PRINTER_PATHS}</g></g><g transform="translate(13.3 13.05) scale(0.45)" stroke-width="2.9"><path d="M13 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M13 3v5h5"/></g></svg>`;

  // Etichetta al passaggio del mouse: compare subito (non con il ritardo variabile del title del browser)
  // e sparisce da sola dopo poco, o quando il mouse esce o si clicca.
  const TOOLTIP_MS = 1800;
  function createButton(label, icon, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tool-btn';
    button.setAttribute('aria-label', label);
    button.innerHTML = icon;
    const tip = document.createElement('span');
    tip.className = 'tool-tip';
    tip.setAttribute('aria-hidden', 'true');
    tip.textContent = label;
    button.appendChild(tip);
    let timer = 0;
    const hide = () => { clearTimeout(timer); tip.classList.remove('is-visible'); };
    button.addEventListener('mouseenter', () => {
      clearTimeout(timer);
      tip.classList.add('is-visible');
      timer = setTimeout(hide, TOOLTIP_MS);
    });
    button.addEventListener('mouseleave', hide);
    button.addEventListener('click', () => { hide(); onClick(); });
    return button;
  }

  const buttons = document.createElement('div');
  buttons.className = 'tool-buttons';
  buttons.append(
    ...(SHOW_GUIDE ? [createButton('Dove montare la stampa?', HELP_ICON, openGuide)] : []),
    createButton('Gestisci lista di stampa', PRINTER_ICON, openPrintList),
    createButton('Aggiungi a lista stampa', ADD_ICON, addToPrintList)
  );
  panel.after(buttons);

  // Stessa distanza minima dall'ultimo riquadro in tutte le pagine (10 px, come in Cartelli Semplici):
  // le colonne hanno spaziature diverse (gap, margini, margine sotto il tasto di stampa), quindi
  // si misura lo spazio reale e si corregge il margine superiore dei pulsanti.
  const TARGET_GAP = 10;
  function alignButtons() {
    buttons.style.marginTop = '0px';
    const gap = buttons.getBoundingClientRect().top - panel.getBoundingClientRect().bottom;
    buttons.style.marginTop = `${TARGET_GAP - gap}px`;
  }
  alignButtons();
  window.addEventListener('load', alignButtons);

  // --- POPUP ---
  const modal = document.createElement('div');
  modal.className = 'app-modal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="app-modal-backdrop"></div>
    <div class="app-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="appModalTitle">
      <div class="app-modal-header">
        <h3 id="appModalTitle"></h3>
        <button type="button" class="app-modal-close" aria-label="Chiudi">✕</button>
      </div>
      <div class="app-modal-body"></div>
    </div>`;
  document.body.appendChild(modal);
  const modalTitle = modal.querySelector('h3');
  const modalBody = modal.querySelector('.app-modal-body');
  modal.querySelector('.app-modal-backdrop').addEventListener('click', closeModal);
  modal.querySelector('.app-modal-close').addEventListener('click', closeModal);

  function openModal(title, content) {
    modalTitle.textContent = title;
    modalBody.replaceChildren(content);
    modal.hidden = false;
    document.addEventListener('keydown', closeModalOnEscape);
  }

  function closeModal() {
    modal.hidden = true;
    modalBody.replaceChildren();
    document.removeEventListener('keydown', closeModalOnEscape);
  }

  function closeModalOnEscape(event) {
    if (event.key === 'Escape') closeModal();
  }

  // Copia il foglio così com'è e la rimpicciolisce perché stia intera nel popup.
  // Gli id restano: alcune pagine ruotano o impaginano le metà tramite id (es. #cardBottom);
  // la copia sta in fondo al body, quindi getElementById continua a trovare l'originale.
  function openPrintPreview() {
    const sheet = document.querySelector(sheetSelector);
    if (!sheet) return;
    const style = getComputedStyle(sheet);
    // Larghezza e altezza calcolate dal CSS: non risentono dello zoom della vista telefono.
    const sheetWidth = parseFloat(style.width);
    const sheetHeight = parseFloat(style.height);
    const maxWidth = Math.min(window.innerWidth - 100, 960);
    const maxHeight = window.innerHeight - 160;
    const scale = Math.min(maxWidth / sheetWidth, maxHeight / sheetHeight, 1);

    const copy = sheet.cloneNode(true);
    copy.removeAttribute('aria-label');
    copy.style.zoom = '1';
    copy.style.width = `${sheetWidth}px`;
    copy.style.height = `${sheetHeight}px`;
    copy.style.boxShadow = 'none';
    copy.style.transform = `scale(${scale})`;

    const frame = document.createElement('div');
    frame.className = 'preview-frame';
    frame.style.width = `${sheetWidth * scale}px`;
    frame.style.height = `${sheetHeight * scale}px`;
    frame.appendChild(copy);

    openModal('Anteprima di Stampa', frame);
  }

  // Aggiungi a lista stampa: fotografa il foglio della pagina e lo aggiunge alla lista (assets/js/lista-stampa.js,
  // caricato solo quando serve). Gestisci lista di stampa apre lista-stampa.html, sempre nella stessa scheda dedicata.
  function loadListaStampa() {
    if (window.ListaStampa) return Promise.resolve(window.ListaStampa);
    return new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      tag.src = new URL('lista-stampa.js?v=20261010-51', script.src).href;
      tag.onload = () => resolve(window.ListaStampa);
      tag.onerror = () => reject(new Error('Caricamento di lista-stampa.js non riuscito.'));
      document.head.appendChild(tag);
    });
  }

  let adding = false;
  async function addToPrintList() {
    const sheet = document.querySelector(sheetSelector);
    if (!sheet || adding) return;
    adding = true;
    showToast('Aggiunta alla lista di stampa…');
    try {
      const lista = await loadListaStampa();
      const count = await lista.addSheet(sheet);
      showToast(`Pagina aggiunta alla lista di stampa (${count} ${count === 1 ? 'pagina' : 'pagine'})`, 2600);
    } catch (error) {
      console.error('Aggiunta alla lista di stampa non riuscita.', error);
      showToast('Non è stato possibile aggiungere la pagina alla lista di stampa', 3200);
    } finally {
      adding = false;
    }
  }

  function openPrintList() {
    window.open('lista-stampa.html', LIST_WINDOW);
  }

  // Avviso in basso al centro, che sparisce da solo
  let toast = null;
  let toastTimer = 0;
  function showToast(message, duration = 0) {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'tool-toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    if (duration) toastTimer = setTimeout(() => toast.classList.remove('is-visible'), duration);
  }

  function openGuide() {
    const page = location.pathname.split('/').pop() || 'index.html';
    const wrapper = document.createElement('div');
    const text = document.createElement('p');
    text.className = 'guide-text';
    text.textContent = `Dove montare la stampa di ${document.title} in negozio.`;
    const grid = document.createElement('div');
    grid.className = 'guide-grid';

    const photos = GUIDE_PHOTOS[page]?.length ? GUIDE_PHOTOS[page] : [
      { caption: 'Foto guida 1' },
      { caption: 'Foto guida 2' }
    ];

    photos.forEach(photo => {
      const item = document.createElement('figure');
      item.className = 'guide-item';
      const placeholder = document.createElement('div');
      placeholder.className = 'guide-placeholder';
      placeholder.textContent = 'Foto in arrivo';
      if (photo.src) {
        const image = document.createElement('img');
        image.src = photo.src;
        image.alt = photo.caption || '';
        image.onerror = () => image.replaceWith(placeholder);
        item.appendChild(image);
      } else {
        item.appendChild(placeholder);
      }
      if (photo.caption) {
        const caption = document.createElement('figcaption');
        caption.textContent = photo.caption;
        item.appendChild(caption);
      }
      grid.appendChild(item);
    });

    wrapper.append(text, grid);
    openModal('Dove montare la stampa?', wrapper);
  }

  window.StrumentiStampa = { openPrintPreview, openGuide, closeModal, addToPrintList, openPrintList };
})();
