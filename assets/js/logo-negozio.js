/* Logo di un negozio nuovo (+ NUOVO NEGOZIO in Gestione negozi): analisi del file caricato e adattamento nelle
   immagini delle pagine.
   - analizza(file): il logo si legge su una tela; se non è già trasparente, lo sfondo si riconosce dai quattro angoli
     (il colore medio dei loro pixel) e si toglie: per un logo a tinta piatta in tutta l'immagine, per un logo a colori
     solo lo sfondo collegato ai bordi (riempimento dagli angoli), così i bianchi dentro il logo restano; i pixel vicini
     al colore dello sfondo diventano semitrasparenti (bordi morbidi). Poi si ritaglia ai bordi del logo. Suggerisce anche
     se il logo è a tinta piatta (un solo colore: si colora nelle 4 varianti) o a colori (una sola versione).
   - tinta(tela, colore): il logo in un solo colore, con la sua trasparenza (le varianti bianco, nero, rosso, oro).
   - adatta(logo, immagine, { colori }): il logo nella misura di un'immagine del modello (es. footer.png di Luxury): la
     tela ha la stessa misura dell'originale e il logo sta dentro il riquadro che occupava il logo del modello (le sue
     parti visibili), centrato e rimpicciolito quanto serve: nelle pagine non si sposta niente. Un logo a tinta piatta
     prende il colore principale dell'originale (rosso, oro, nero…), uno a colori resta com'è.
   Uso: LogoNegozio.analizza(file) → { tela, colori, sfondoTolto, giaTrasparente }; LogoNegozio.png(tela) → Blob. */
(() => {
  const MASSIMO = 2000;   // lato più lungo della tela di lavoro

  const caricaImmagine = sorgente => new Promise((fatto, sbagliato) => {
    const img = new Image();
    img.onload = () => fatto(img);
    img.onerror = () => sbagliato(new Error('immagine non leggibile'));
    img.src = sorgente;
  });
  const telaDa = (larghezza, altezza) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(larghezza)); c.height = Math.max(1, Math.round(altezza)); return c; };
  const png = tela => new Promise(fatto => tela.toBlob(fatto, 'image/png'));

  // riquadro delle parti visibili (alfa > soglia); null se è tutto trasparente
  function riquadro(dati, larghezza, altezza, soglia = 8) {
    let x0 = larghezza, y0 = altezza, x1 = -1, y1 = -1;
    for (let y = 0; y < altezza; y++) for (let x = 0; x < larghezza; x++) {
      if (dati[(y * larghezza + x) * 4 + 3] > soglia) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }

  async function analizza(file) {
    const url = URL.createObjectURL(file);
    let img;
    try { img = await caricaImmagine(url); } finally { URL.revokeObjectURL(url); }
    const scala = Math.min(1, MASSIMO / Math.max(img.naturalWidth || img.width || 1, img.naturalHeight || img.height || 1));
    const w = Math.round((img.naturalWidth || img.width || 600) * scala), h = Math.round((img.naturalHeight || img.height || 300) * scala);
    const tela = telaDa(w, h);
    const ctx = tela.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const immagine = ctx.getImageData(0, 0, w, h);
    const d = immagine.data;
    // gli angoli: un quadratino per angolo
    const lato = Math.max(2, Math.round(Math.min(w, h) * .02));
    const angoli = [];
    [[0, 0], [w - lato, 0], [0, h - lato], [w - lato, h - lato]].forEach(([ax, ay]) => {
      for (let y = ay; y < ay + lato; y++) for (let x = ax; x < ax + lato; x++) angoli.push((y * w + x) * 4);
    });
    const giaTrasparente = angoli.filter(i => d[i + 3] < 30).length > angoli.length * .6;
    // il colore dello sfondo: la media degli angoli opachi
    const sfondo = [0, 1, 2].map(k => angoli.reduce((t, i) => t + d[i + k], 0) / angoli.length);
    // colori del logo (senza lo sfondo): tinta piatta se quasi tutti i pixel visibili hanno la stessa tinta
    const distanza = i => Math.hypot(d[i] - sfondo[0], d[i + 1] - sfondo[1], d[i + 2] - sfondo[2]);
    const VICINO = 34, LONTANO = 92;   // fino a VICINO è sfondo, da LONTANO è logo, in mezzo bordo semitrasparente
    let sfondoTolto = false;
    const colori = (() => {
      const conti = new Map();
      let visti = 0;
      for (let i = 0; i < d.length; i += 16) {
        if (d[i + 3] < 128 || (!giaTrasparente && distanza(i) < LONTANO)) continue;
        const r = d[i], g = d[i + 1], b = d[i + 2], massimo = Math.max(r, g, b), minimo = Math.min(r, g, b);
        // colori grigi (bianco, nero, grigi) contano come una sola tinta; gli altri per tinta
        const chiave = massimo - minimo < 40 ? 'grigio' : Math.round(((Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180 / Math.PI) + 360) % 360 / 30);
        conti.set(chiave, (conti.get(chiave) || 0) + 1);
        visti++;
      }
      if (!visti) return false;
      const ordinati = [...conti.values()].sort((a, b) => b - a);
      return ordinati[0] / visti < .88;   // a colori: nessuna tinta copre quasi tutto
    })();
    if (!giaTrasparente) {
      const alfa = i => { const t = distanza(i); return t <= VICINO ? 0 : t >= LONTANO ? 255 : Math.round((t - VICINO) / (LONTANO - VICINO) * 255); };
      if (!colori) {
        // tinta piatta: lo sfondo si toglie dappertutto (anche dentro le lettere)
        for (let i = 0; i < d.length; i += 4) d[i + 3] = Math.min(d[i + 3], alfa(i));
      } else {
        // a colori: solo lo sfondo collegato ai bordi, con un riempimento dagli angoli e dai bordi
        const visitato = new Uint8Array(w * h);
        const coda = [];
        for (let x = 0; x < w; x++) { coda.push(x, (h - 1) * w + x); }
        for (let y = 0; y < h; y++) { coda.push(y * w, y * w + w - 1); }
        while (coda.length) {
          const p = coda.pop();
          if (visitato[p]) continue;
          const i = p * 4;
          if (distanza(i) >= LONTANO) continue;
          visitato[p] = 1;
          d[i + 3] = Math.min(d[i + 3], alfa(i));
          const x = p % w, y = (p - x) / w;
          if (x > 0) coda.push(p - 1);
          if (x < w - 1) coda.push(p + 1);
          if (y > 0) coda.push(p - w);
          if (y < h - 1) coda.push(p + w);
        }
      }
      // i pixel dei bordi, semitrasparenti, perdono il colore dello sfondo che avevano mescolato (niente alone bianco)
      for (let i = 0; i < d.length; i += 4) {
        const a = d[i + 3];
        if (a === 0 || a === 255) continue;
        const k = a / 255;
        for (let c = 0; c < 3; c++) d[i + c] = Math.max(0, Math.min(255, Math.round((d[i + c] - sfondo[c] * (1 - k)) / k)));
      }
      sfondoTolto = true;
      ctx.putImageData(immagine, 0, 0);
    }
    // ritaglio ai bordi del logo, con un piccolo margine
    const r = riquadro(ctx.getImageData(0, 0, w, h).data, w, h);
    if (!r) throw new Error('nel file non c’è un logo visibile: lo sfondo copre tutto');
    const margine = Math.round(Math.max(r.w, r.h) * .01);
    const finale = telaDa(r.w + margine * 2, r.h + margine * 2);
    finale.getContext('2d').drawImage(tela, r.x, r.y, r.w, r.h, margine, margine, r.w, r.h);
    return { tela: finale, colori, sfondoTolto, giaTrasparente };
  }

  const rgb = colore => { const h = String(colore).replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  function tinta(tela, colore) {
    const c = telaDa(tela.width, tela.height);
    const ctx = c.getContext('2d');
    ctx.drawImage(tela, 0, 0);
    const [r, g, b] = Array.isArray(colore) ? colore : rgb(colore);
    const dati = ctx.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < dati.data.length; i += 4) { dati.data[i] = r; dati.data[i + 1] = g; dati.data[i + 2] = b; }
    ctx.putImageData(dati, 0, 0);
    return c;
  }

  // il colore principale delle parti visibili di un'immagine (il più frequente, a gruppi di 24 livelli)
  // (prima i pixel colorati: in un'immagine con una scritta oro e un riquadro nero conta l'oro; nero, bianco e grigi solo
  // se di colorati ce ne sono pochi)
  function colorePrincipale(dati) {
    let colorati = 0, opachi = 0;
    for (let i = 0; i < dati.length; i += 8) {
      if (dati[i + 3] < 200) continue;
      opachi++;
      if (Math.max(dati[i], dati[i + 1], dati[i + 2]) - Math.min(dati[i], dati[i + 1], dati[i + 2]) > 40) colorati++;
    }
    const soloColorati = colorati > opachi * .05;
    const conti = new Map();
    for (let i = 0; i < dati.length; i += 8) {
      if (dati[i + 3] < 200) continue;
      if (soloColorati && Math.max(dati[i], dati[i + 1], dati[i + 2]) - Math.min(dati[i], dati[i + 1], dati[i + 2]) <= 40) continue;
      const chiave = [dati[i], dati[i + 1], dati[i + 2]].map(v => Math.round(v / 24)).join(',');
      const voce = conti.get(chiave) || { n: 0, r: 0, g: 0, b: 0 };
      voce.n++; voce.r += dati[i]; voce.g += dati[i + 1]; voce.b += dati[i + 2];
      conti.set(chiave, voce);
    }
    const voce = [...conti.values()].sort((a, b) => b.n - a.n)[0];
    return voce ? [voce.r / voce.n, voce.g / voce.n, voce.b / voce.n].map(Math.round) : [0, 0, 0];
  }

  async function adatta(logo, originale, { colori = false, colore = null } = {}) {
    const img = originale instanceof HTMLImageElement ? originale : await caricaImmagine(typeof originale === 'string' ? originale : URL.createObjectURL(originale));
    const w = img.naturalWidth, h = img.naturalHeight;
    const prova = telaDa(w, h);
    const pctx = prova.getContext('2d', { willReadFrequently: true });
    pctx.drawImage(img, 0, 0);
    const dati = pctx.getImageData(0, 0, w, h).data;
    const zona = riquadro(dati, w, h, 20) || { x: 0, y: 0, w, h };
    const sorgente = colori ? logo : tinta(logo, colore || colorePrincipale(dati));
    const scala = Math.min(zona.w / sorgente.width, zona.h / sorgente.height);
    const lw = sorgente.width * scala, lh = sorgente.height * scala;
    const tela = telaDa(w, h);
    const ctx = tela.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sorgente, zona.x + (zona.w - lw) / 2, zona.y + (zona.h - lh) / 2, lw, lh);
    return tela;
  }

  window.LogoNegozio = Object.freeze({ analizza, tinta, adatta, png, caricaImmagine, colorePrincipale });
})();
