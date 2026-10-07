/*
 * Lista di stampa condivisa tra le pagine cartelli e cartellini.
 * - "Aggiungi a lista stampa" (strumenti-stampa.js) fotografa il foglio della pagina (html2canvas, da cdnjs)
 *   e lo salva come pagina JPEG nel browser (IndexedDB, un database per negozio con il nome scritto nella scheda
 *   del negozio, listaStampa: "storecraft-lista-stampa" per Luxury Outlet, "tebe-lista-stampa", "ophilya-lista-stampa"):
 *   il localStorage (circa 5 MB) basterebbe solo per
 *   poche pagine. Le immagini colorate con un filtro CSS vengono prima
 *   ridisegnate già colorate (colorFilteredImages), perché html2canvas i filtri non li applica.
 * - lista-stampa.html mostra le pagine, le elimina, svuota la lista e la stampa come lista.pdf, generato qui
 *   senza librerie: un PDF A4 con una pagina per immagine (JPEG incorporato così com'è, filtro DCTDecode).
 * La lista resta nel browser e nel computer in cui è stata creata, come i loghi personalizzati.
 */
(function initListaStampa() {
  // Una lista per negozio (data-negozio della pagina): il nome del database è nella scheda del negozio
  // (Luxury Outlet conserva il database di prima, "storecraft-lista-stampa").
  const NEGOZIO = document.documentElement.dataset.negozio;
  const DB_NAME = Negozi.corrente()?.listaStampa || `${NEGOZIO}-lista-stampa`;
  const STORE = 'pages';
  const HTML2CANVAS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  const CAPTURE_SCALE = 2.5;      // foglio A4 a circa 240 dpi
  const JPEG_QUALITY = 0.9;
  const THUMB_WIDTH = 320;

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function withStore(mode, action) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const result = action(transaction.objectStore(STORE));
      transaction.oncomplete = () => { db.close(); resolve(result && 'result' in result ? result.result : undefined); };
      transaction.onerror = () => { db.close(); reject(transaction.error); };
    });
  }

  // Pagine in ordine di inserimento: { id, createdAt, page, title, orientation, width, height, jpeg, thumb }
  const getPages = () => withStore('readonly', store => store.getAll());
  const deletePage = id => withStore('readwrite', store => store.delete(id));
  const clearPages = () => withStore('readwrite', store => store.clear());
  const countPages = () => withStore('readonly', store => store.count());

  function loadHtml2canvas() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = HTML2CANVAS_SRC;
      script.onload = () => resolve(window.html2canvas);
      script.onerror = () => reject(new Error('Caricamento di html2canvas non riuscito.'));
      document.head.appendChild(script);
    });
  }

  const canvasToBlob = (canvas, type, quality) => new Promise(resolve => canvas.toBlob(resolve, type, quality));

  // Il browser sa applicare un filtro CSS mentre disegna su un canvas? (Chrome ed Edge sì)
  function canvasFilterSupported() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!('filter' in ctx)) return false;
    ctx.filter = 'brightness(0)';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1, 1);
    return ctx.getImageData(0, 0, 1, 1).data[0] === 0;
  }

  // html2canvas non applica il filtro CSS "filter": i loghi colorati con un filtro (es. le tinte di
  // promo_multibrand) uscirebbero neri. Ogni immagine filtrata del foglio viene ridisegnata su un canvas
  // con lo stesso filtro; nella copia fotografata si usa quell'immagine già colorata, senza filtro.
  // Restituisce le immagini colorate, segnate sull'originale con data-lista-colore (copiato nella copia).
  function colorFilteredImages(sheet) {
    const colored = [];
    if (!canvasFilterSupported()) return colored;
    sheet.querySelectorAll('img').forEach(img => {
      const filter = getComputedStyle(img).filter;
      if (!filter || filter === 'none' || !img.naturalWidth) return;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.filter = filter;
      ctx.drawImage(img, 0, 0);
      try {
        img.dataset.listaColore = String(colored.length);
        colored.push(canvas.toDataURL('image/png'));
      } catch (error) {
        delete img.dataset.listaColore;   // immagine di un altro sito: resta com'è
      }
    });
    return colored;
  }

  // Fotografa il foglio così come verrà stampato: senza ombra né zoom della vista telefono,
  // con i cartellini esclusi nascosti come in stampa.
  // Segna sull'errore il passaggio in cui è avvenuto, per il messaggio del riquadro PDF.
  async function step(name, action) {
    try {
      return await action();
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));
      if (!failure.step) failure.step = name;
      throw failure;
    }
  }

  // Regole di stampa della pagina (i blocchi @media print), da attivare a schermo nella copia fotografata.
  // I fogli di stampa non leggibili (es. i caratteri di Google Fonts, di un altro sito) si saltano.
  function printRules(doc) {
    const rules = [];
    for (const sheet of doc.styleSheets) {
      let list;
      try { list = sheet.cssRules; } catch (error) { continue; }
      for (const rule of list) {
        if (rule.media && [...rule.media].some(medium => medium.trim() === 'print')) {
          for (const inner of rule.cssRules) rules.push(inner.cssText);
        }
      }
    }
    return rules.join('\n');
  }

  // La copia fotografata (per la lista e per il PDF di iOS) usa le regole di stampa della pagina, così il foglio è
  // impaginato esattamente come nella stampa da computer (alcune pagine in stampa allargano i cartelli o li spostano
  // di qualche mm rispetto allo schermo), e il foglio non può essere schiacciato, così la foto ha la sua grandezza di
  // stampa anche quando una finestra stretta (es. iPad) lo restringe.
  async function captureSheet(sheet) {
    const html2canvas = await step('caricamento di html2canvas', loadHtml2canvas);
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    await Promise.all([...sheet.querySelectorAll('img')].map(img => img.complete ? null : new Promise(done => {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    })));
    const colored = colorFilteredImages(sheet);
    let canvas;
    try {
      canvas = await step('foto del foglio', () => html2canvas(sheet, {
        scale: CAPTURE_SCALE,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        onclone: doc => {
          const print = doc.createElement('style');
          print.textContent = printRules(doc);
          doc.head.appendChild(print);
          const style = doc.createElement('style');
          style.textContent = `
            .cartellino.disabled { visibility: hidden !important; }
            .print-sheet, .a4-sheet, #printable-grid, .sheet-wrap { zoom: 1 !important; box-shadow: none !important; flex-shrink: 0 !important; }
            .cursore, .tool-buttons, .app-modal { display: none !important; }
            .phone-current-card { outline: none !important; }
            img[data-lista-colore] { filter: none !important; }`;
          doc.head.appendChild(style);
          doc.querySelectorAll('img[data-lista-colore]').forEach(img => {
            img.src = colored[Number(img.dataset.listaColore)];
          });
        }
      }));
    } finally {
      sheet.querySelectorAll('img[data-lista-colore]').forEach(img => delete img.dataset.listaColore);
    }
    return canvas;
  }

  // Misure del foglio in mm, ricavate dalla foto (px CSS × CAPTURE_SCALE).
  const toMm = px => px / CAPTURE_SCALE * 25.4 / 96;
  // Orientamento della carta come nella stampa da computer: orizzontale solo per i cartellini (A4 orizzontale),
  // verticale per tutti gli altri fogli, anche per il mezzo A4 del Magazzino.
  const paperOrientation = sheet => sheet.classList.contains('a4-landscape') ? 'landscape' : 'portrait';

  // Ogni pagina della lista ricorda le misure vere del foglio (mmWidth, mmHeight): in lista.pdf sta a misura reale.
  async function addSheet(sheet) {
    const canvas = await captureSheet(sheet);
    const jpeg = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = THUMB_WIDTH;
    thumbCanvas.height = Math.round(canvas.height * THUMB_WIDTH / canvas.width);
    thumbCanvas.getContext('2d').drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    const thumb = await canvasToBlob(thumbCanvas, 'image/jpeg', 0.85);
    const record = {
      createdAt: Date.now(),
      page: location.pathname.split('/').pop() || 'index.html',
      title: document.title,
      orientation: paperOrientation(sheet),
      width: canvas.width,
      height: canvas.height,
      mmWidth: toMm(canvas.width),
      mmHeight: toMm(canvas.height),
      jpeg,
      thumb
    };
    await withStore('readwrite', store => store.add(record));
    return countPages();
  }

  // PDF di un solo foglio a misura reale (stampa da iPhone e iPad, assets/js/stampa-ios.js): A4 verticale, o
  // orizzontale per i cartellini, con il foglio grande quanto in stampa (mm → punti), centrato in larghezza;
  // sulla carta verticale sta in alto, su quella orizzontale a 4 mm dal bordo alto, come nella stampa da computer.
  // Le misure vengono dalla foto (px CSS × CAPTURE_SCALE), dove il foglio ha la sua grandezza di stampa anche
  // quando a schermo è rimpicciolito o schiacciato da una finestra stretta.
  async function sheetPdf(sheet) {
    const canvas = await captureSheet(sheet);
    const size = `${canvas.width} × ${canvas.height} px`;
    const jpeg = await step(`immagine JPEG (${size})`, async () => {
      const blob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
      if (!blob || !blob.size) throw new Error('il browser ha restituito un\'immagine vuota');
      return blob;
    });
    return step('creazione del PDF', () => buildPdf([{
      orientation: paperOrientation(sheet),
      width: canvas.width,
      height: canvas.height,
      jpeg,
      mmWidth: toMm(canvas.width),
      mmHeight: toMm(canvas.height)
    }]));
  }

  // lista.pdf (e il PDF di iOS): A4 (595,28 × 841,89 punti), verticale o orizzontale come nella stampa da
  // computer. Le pagine con mmWidth / mmHeight stanno a misura reale; quelle salvate prima di queste misure
  // (senza mmWidth) sono ancora adattate alla pagina mantenendo le proporzioni.
  async function buildPdf(pages) {
    const encoder = new TextEncoder();
    const chunks = [];
    const offsets = [];
    let length = 0;
    const push = data => {
      const bytes = typeof data === 'string' ? encoder.encode(data) : data;
      chunks.push(bytes);
      length += bytes.length;
    };
    const startObject = number => { offsets[number] = length; push(`${number} 0 obj\n`); };

    const pageCount = pages.length;
    // 1 catalogo, 2 albero delle pagine, poi per ogni pagina: pagina, contenuto, immagine
    const pageIds = pages.map((_, index) => 3 + index * 3);
    push('%PDF-1.4\n%âãÏÓ\n');
    startObject(1); push('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    startObject(2); push(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>\nendobj\n`);

    for (let index = 0; index < pageCount; index++) {
      const page = pages[index];
      const pageId = pageIds[index];
      const [pageWidth, pageHeight] = page.orientation === 'landscape' ? [841.89, 595.28] : [595.28, 841.89];
      const realSize = page.mmWidth && page.mmHeight;
      const fit = Math.min(pageWidth / page.width, pageHeight / page.height);
      const drawWidth = realSize ? page.mmWidth * 72 / 25.4 : page.width * fit;
      const drawHeight = realSize ? page.mmHeight * 72 / 25.4 : page.height * fit;
      const x = (pageWidth - drawWidth) / 2;
      // Posizione del foglio a misura reale come nella stampa da computer: sulla carta verticale in alto (margine 0),
      // su quella orizzontale (cartellini) a 4 mm dal bordo alto, il margine @page dei cartellini.
      // In PDF l'asse y parte dal basso: in alto vuol dire pageHeight - drawHeight.
      const top = page.orientation === 'portrait' ? 0 : 4 * 72 / 25.4;
      const y = realSize ? pageHeight - drawHeight - top : (pageHeight - drawHeight) / 2;
      const content = `q ${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`;
      const jpeg = new Uint8Array(await page.jpeg.arrayBuffer());

      startObject(pageId);
      push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 ${pageId + 2} 0 R >> >> /Contents ${pageId + 1} 0 R >>\nendobj\n`);
      startObject(pageId + 1);
      push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
      startObject(pageId + 2);
      push(`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
      push(jpeg);
      push('\nendstream\nendobj\n');
    }

    const objectCount = 3 + pageCount * 3;
    const xrefOffset = length;
    let xref = `xref\n0 ${objectCount}\n0000000000 65535 f \n`;
    for (let number = 1; number < objectCount; number++) {
      xref += `${String(offsets[number]).padStart(10, '0')} 00000 n \n`;
    }
    push(xref);
    push(`trailer\n<< /Size ${objectCount} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);
    return new Blob(chunks, { type: 'application/pdf' });
  }

  // iPhone e iPad (Safari e Chrome): la stampa del browser aggiunge margini, rimpicciolisce il foglio e in Safari
  // scrive indirizzo e data; i PDF creati qui sono invece a misura, e si consegnano con il menu Condividi di iOS.
  const isIos = () => /iP(hone|ad|od)/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // Riquadro di consegna del PDF: mostra la preparazione e poi il pulsante SALVA O STAMPA PDF, che apre Condividi
  // (Salva su File, Stampa…) o, dove Condividi non accetta file, apre il PDF in una nuova scheda.
  // Il pulsante serve perché iOS apre Condividi solo dopo un tocco, non alla fine di un'attesa.
  // pdfPromise: Promise<Blob>; fileName: nome del file proposto; fallback (facoltativo): { label, run }, pulsante
  // offerto se il PDF non riesce.
  function offerPdf(pdfPromise, fileName, fallback) {
    injectOfferStyle();
    const overlay = document.createElement('div');
    overlay.className = 'lista-pdf-overlay';
    const box = document.createElement('div');
    box.className = 'lista-pdf-box';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'PDF di stampa');
    const title = document.createElement('div');
    title.className = 'lista-pdf-title';
    title.textContent = 'PDF DI STAMPA';
    const text = document.createElement('p');
    text.className = 'lista-pdf-text';
    text.setAttribute('role', 'status');
    text.textContent = 'Preparazione del PDF a misura reale…';
    const share = document.createElement('button');
    share.type = 'button';
    share.className = 'lista-pdf-share';
    share.textContent = 'SALVA O STAMPA PDF';
    share.disabled = true;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'lista-pdf-close';
    close.textContent = 'Chiudi';
    box.append(title, text, share, close);
    overlay.append(box);
    document.body.append(overlay);

    let url = '';
    const dismiss = () => {
      overlay.remove();
      if (url) setTimeout(() => URL.revokeObjectURL(url), 60000);
    };
    close.addEventListener('click', dismiss);

    pdfPromise.then(pdf => {
      const file = new File([pdf], fileName, { type: 'application/pdf' });
      url = URL.createObjectURL(file);
      text.textContent = `${fileName} è pronto: foglio intero A4.`;
      share.disabled = false;
      share.focus();
      share.addEventListener('click', async () => {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: fileName });
            dismiss();
          } catch (error) {
            if (error && error.name !== 'AbortError') window.open(url, '_blank');
          }
        } else {
          window.open(url, '_blank');
          dismiss();
        }
      });
    }).catch(error => {
      console.error('Preparazione del PDF non riuscita.', error);
      text.textContent = 'Non è stato possibile preparare il PDF.';
      // Dettaglio tecnico (passaggio e messaggio del browser), per poter correggere la causa.
      const detail = document.createElement('small');
      detail.className = 'lista-pdf-detail';
      const reason = error && (error.message || error.name) ? (error.message || error.name) : String(error);
      detail.textContent = `${error && error.step ? `${error.step}: ` : ''}${reason}`;
      text.append(detail);
      // Riserva: la stampa normale del browser (su iPhone con la riduzione di stampa-ios.js).
      if (fallback) {
        share.textContent = fallback.label;
        share.disabled = false;
        share.addEventListener('click', () => {
          dismiss();
          fallback.run();
        }, { once: true });
      } else {
        share.hidden = true;
      }
    });
  }

  function injectOfferStyle() {
    if (document.getElementById('lista-pdf-style')) return;
    const style = document.createElement('style');
    style.id = 'lista-pdf-style';
    style.textContent = `
/* Colori del negozio della pagina nella sua scheda (assets/negozi/<negozio>.css); qui i valori di riserva */      :root { --lista-pdf-bg: #1e1d1a; --lista-pdf-text: #f4f1ea; --lista-pdf-accent: #d4a373; --lista-pdf-muted: #8c857b; --lista-pdf-focus: #e5ba73; --lista-pdf-backdrop: rgba(10, 9, 8, .78); --lista-pdf-shadow: rgba(0, 0, 0, .5); }
      .lista-pdf-overlay { position: fixed; inset: 0; z-index: 5000; display: flex; align-items: center; justify-content: center; padding: 16px; background: var(--lista-pdf-backdrop); backdrop-filter: blur(3px); }
      .lista-pdf-box { width: min(360px, 100%); padding: 20px 18px 16px; border: 1px solid var(--lista-pdf-accent); border-radius: 12px; background: var(--lista-pdf-bg); color: var(--lista-pdf-text); box-shadow: 0 12px 32px var(--lista-pdf-shadow); font-family: Arial, sans-serif; text-align: center; }
      .lista-pdf-title { margin-bottom: 10px; color: var(--lista-pdf-accent); font: 600 0.8rem/1.2 Arial, sans-serif; letter-spacing: .14em; }
      .lista-pdf-text { margin: 0 0 16px; font-size: 0.95rem; line-height: 1.45; }
      .lista-pdf-detail { display: block; margin-top: 8px; color: var(--lista-pdf-muted); font-size: 0.75rem; line-height: 1.35; word-break: break-word; }
      .lista-pdf-share, .lista-pdf-close { display: block; width: 100%; min-height: 48px; border-radius: 8px; font: 700 0.9rem/1.1 Arial, sans-serif; letter-spacing: .06em; cursor: pointer; }
      .lista-pdf-share { border: 0; background: #96382b; color: #fff; }
      .lista-pdf-share:disabled { opacity: .45; cursor: default; }
      .lista-pdf-close { margin-top: 8px; border: 1.5px solid var(--lista-pdf-accent); background: transparent; color: var(--lista-pdf-accent); }
      .lista-pdf-share:focus-visible, .lista-pdf-close:focus-visible { outline: 2px solid var(--lista-pdf-focus); outline-offset: 2px; }
      @media print { .lista-pdf-overlay { display: none !important; } }`;
    document.head.append(style);
  }

  window.ListaStampa = { addSheet, sheetPdf, getPages, deletePage, clearPages, countPages, buildPdf, isIos, offerPdf };
})();
