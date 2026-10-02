/*
 * Lista di stampa condivisa tra le pagine cartelli e cartellini.
 * - "Aggiungi a lista stampa" (strumenti-stampa.js) fotografa il foglio della pagina (html2canvas, da cdnjs)
 *   e lo salva come pagina JPEG nel browser (IndexedDB, database "storecraft-lista-stampa"): il localStorage
 *   (circa 5 MB) basterebbe solo per poche pagine.
 * - lista-stampa.html mostra le pagine, le elimina, svuota la lista e la stampa come lista.pdf, generato qui
 *   senza librerie: un PDF A4 con una pagina per immagine (JPEG incorporato così com'è, filtro DCTDecode).
 * La lista resta nel browser e nel computer in cui è stata creata, come i loghi personalizzati.
 */
(function initListaStampa() {
  const DB_NAME = 'storecraft-lista-stampa';
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

  // Fotografa il foglio così come verrà stampato: senza ombra né zoom della vista telefono,
  // con i cartellini esclusi nascosti come in stampa.
  async function addSheet(sheet) {
    const html2canvas = await loadHtml2canvas();
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    await Promise.all([...sheet.querySelectorAll('img')].map(img => img.complete ? null : new Promise(done => {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    })));
    const canvas = await html2canvas(sheet, {
      scale: CAPTURE_SCALE,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      onclone: doc => {
        const style = doc.createElement('style');
        style.textContent = `
          .cartellino.disabled { visibility: hidden !important; }
          .print-sheet, #printable-grid, .sheet-wrap { zoom: 1 !important; box-shadow: none !important; }
          .cursore, .tool-buttons, .app-modal { display: none !important; }`;
        doc.head.appendChild(style);
      }
    });
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
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      width: canvas.width,
      height: canvas.height,
      jpeg,
      thumb
    };
    await withStore('readwrite', store => store.add(record));
    return countPages();
  }

  // lista.pdf: A4 (595,28 × 841,89 punti), verticale o orizzontale come il foglio,
  // immagine centrata e adattata alla pagina mantenendo le proporzioni.
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
      const fit = Math.min(pageWidth / page.width, pageHeight / page.height);
      const drawWidth = page.width * fit;
      const drawHeight = page.height * fit;
      const x = (pageWidth - drawWidth) / 2;
      const y = (pageHeight - drawHeight) / 2;
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

  window.ListaStampa = { addSheet, getPages, deletePage, clearPages, countPages, buildPdf };
})();
