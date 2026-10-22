/*
 * Cronologia di stampa: ogni foglio stampato dalle pagine di cartelli, cartellini e promo stagionali (quelle con la
 * pulsantiera di strumenti-stampa.js; etichette DYMO e PDF pronti restano fuori) viene ricordato nel browser, così si
 * ritrova e si ristampa uguale da cronologia-stampa.html del negozio.
 * - Un database per negozio (IndexedDB), con il nome nella scheda del negozio (cronologiaStampa:
 *   "storecraft-cronologia-stampa" per Luxury Outlet, "tebe-cronologia-stampa", "ophilya-cronologia-stampa"), separato
 *   dalla lista di stampa e dai loghi personali.
 * - Due archivi: "stampe" con i dati e la miniatura (leggero, per l'elenco) e "fogli" con la foto grande (letta solo
 *   quando si apre o si ristampa una stampa).
 * - Restano solo le stampe degli ultimi 7 giorni (DURATA): le più vecchie si cancellano da sole a ogni apertura e
 *   registrazione. Lo stesso foglio ristampato identico non si salva due volte: si aggiornano data e numero di stampe.
 * - La foto è quella della lista di stampa (ListaStampa.fotografa, lista-stampa.js, da caricare prima), con la
 *   stessa qualità: circa 240 dpi, JPEG 0,9.
 * La cronologia resta nel browser e nel computer in cui si stampa, come la lista e i loghi personali.
 */
(function initCronologiaStampa() {
  const NEGOZIO = document.documentElement.dataset.negozio;
  const DB_NAME = Negozi.corrente()?.cronologiaStampa || `${NEGOZIO}-cronologia-stampa`;
  const DURATA = 7 * 24 * 60 * 60 * 1000;
  // stessa qualità della lista di stampa (circa 240 dpi, JPEG 0,9): ristampe nitide come i fogli della lista
  const FOTO = { scala: 2.5, qualita: 0.9 };

  function apri() {
    return new Promise((resolve, reject) => {
      const richiesta = indexedDB.open(DB_NAME, 1);
      richiesta.onupgradeneeded = () => {
        const db = richiesta.result;
        const stampe = db.createObjectStore('stampe', { keyPath: 'id', autoIncrement: true });
        stampe.createIndex('impronta', 'impronta');
        db.createObjectStore('fogli', { keyPath: 'id' });
      };
      richiesta.onsuccess = () => resolve(richiesta.result);
      richiesta.onerror = () => reject(richiesta.error);
    });
  }

  // Esegue azione(archivi) in una transazione e restituisce il suo risultato (una richiesta IndexedDB o un valore)
  async function transazione(modo, azione) {
    const db = await apri();
    return new Promise((resolve, reject) => {
      const t = db.transaction(['stampe', 'fogli'], modo);
      const risultato = azione({ stampe: t.objectStore('stampe'), fogli: t.objectStore('fogli') });
      t.oncomplete = () => { db.close(); resolve(risultato instanceof IDBRequest ? risultato.result : risultato); };
      t.onerror = () => { db.close(); reject(t.error); };
      t.onabort = () => { db.close(); reject(t.error); };
    });
  }

  // Cancella le stampe più vecchie di 7 giorni (dall'ultima volta che sono state stampate), con le loro foto
  const pulisci = () => transazione('readwrite', ({ stampe, fogli }) => {
    const limite = Date.now() - DURATA;
    stampe.openCursor().onsuccess = evento => {
      const cursore = evento.target.result;
      if (!cursore) return;
      if (!(cursore.value.stampataIl >= limite)) {
        fogli.delete(cursore.value.id);
        cursore.delete();
      }
      cursore.continue();
    };
  });

  // Impronta della foto, per riconoscere lo stesso foglio ristampato identico
  async function impronta(blob) {
    if (!window.crypto?.subtle) return '';
    const hash = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Tipo della stampa, per i filtri della pagina: 'promo' lo dichiara la pagina (data-cronologia sullo script di
  // strumenti-stampa.js), altrimenti dal layout del pannello (cartellini e Prezzi Vetrina, o cartelli)
  function tipoPagina(dichiarato) {
    if (dichiarato) return dichiarato;
    const layout = document.body.dataset.layout;
    return layout === 'cartellini' || layout === 'prezzi' ? 'cartellini' : 'cartelli';
  }

  // Stampe di ogni giorno (giorno locale AAAA-MM-GG → numero), per le statistiche esatte per periodo (dal 22 ottobre 2026)
  function giornoDi(ms = Date.now()) {
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const piuOggi = (giorni = {}) => ({ ...giorni, [giornoDi()]: (giorni[giornoDi()] || 0) + 1 });

  // Registra la stampa del foglio. Restituisce { nuova: true | false } (false: stesso foglio già in cronologia)
  async function registra(foglio, tipo) {
    const foto = await ListaStampa.fotografa(foglio, FOTO);
    const firma = await impronta(foto.jpeg);
    await pulisci();
    const adesso = Date.now();
    const esistente = firma
      ? await transazione('readonly', ({ stampe }) => stampe.index('impronta').get(firma))
      : undefined;
    if (esistente) {
      await transazione('readwrite', ({ stampe }) => stampe.put({ ...esistente, stampataIl: adesso, volte: (esistente.volte || 1) + 1, giorni: piuOggi(esistente.giorni) }));
      return { nuova: false };
    }
    const { jpeg, ...dati } = foto;
    await transazione('readwrite', ({ stampe, fogli }) => {
      const richiesta = stampe.add({ ...dati, tipo: tipoPagina(tipo), impronta: firma, primaStampa: adesso, stampataIl: adesso, volte: 1, giorni: piuOggi() });
      richiesta.onsuccess = () => fogli.put({ id: richiesta.result, jpeg });
    });
    // chiede al browser di non cancellare questi dati quando il disco si riempie
    navigator.storage?.persist?.().catch(() => {});
    return { nuova: true };
  }

  // Stampe in cronologia (senza la foto grande), dalla più recente
  async function elenco() {
    await pulisci();
    const tutte = await transazione('readonly', ({ stampe }) => stampe.getAll());
    return tutte.sort((a, b) => b.stampataIl - a.stampataIl);
  }

  // Stampa completa, con la foto grande (jpeg): per l'anteprima, la ristampa e la lista di stampa
  async function stampa(id) {
    const [dati, foglio] = await transazione('readonly', ({ stampe, fogli }) => {
      const coppia = [];
      stampe.get(id).onsuccess = e => { coppia[0] = e.target.result; };
      fogli.get(id).onsuccess = e => { coppia[1] = e.target.result; };
      return coppia;
    });
    return dati && foglio ? { ...dati, jpeg: foglio.jpeg } : null;
  }

  // Ristampata dalla cronologia: aggiorna data e numero di stampe
  async function ristampata(id) {
    const dati = await transazione('readonly', ({ stampe }) => stampe.get(id));
    if (dati) await transazione('readwrite', ({ stampe }) => stampe.put({ ...dati, stampataIl: Date.now(), volte: (dati.volte || 1) + 1, giorni: piuOggi(dati.giorni) }));
  }

  const elimina = id => transazione('readwrite', ({ stampe, fogli }) => { stampe.delete(id); fogli.delete(id); });
  const svuota = () => transazione('readwrite', ({ stampe, fogli }) => { stampe.clear(); fogli.clear(); });

  // Spazio usato da tutto il sito nel browser (byte), se il browser lo dice
  async function spazio() {
    try { return (await navigator.storage?.estimate?.())?.usage ?? null; } catch { return null; }
  }

  window.CronologiaStampa = { registra, elenco, stampa, ristampata, elimina, svuota, spazio, DURATA };
})();
