/* Generatore delle pagine di Import layout (area operatore): dai dati letti dal file Photoshop (.psd) alla pagina di
   generazione di cartelli, costruita sulla Nuova Base Comune (modelli/cartello-base.html) con i moduli comuni.
   ImportGenera.pagina(risultato, { base, nome, negozio, immagini }) restituisce il testo HTML della pagina:
   - risultato: i dati della conversione di import-layout.html (elementi con chiave, cartello, misure in mm dal bordo
     sinistro del foglio e dal bordo alto del proprio cartello, stile dei testi, colori, rotazione, livello);
   - base: il testo di modelli/cartello-base.html; nome: titolo della pagina; negozio: cartella del negozio;
   - immagini: { chiave: indirizzo } delle grafiche (nell'anteprima data URL, nella pagina salvata i file in assets/).
   Ogni elemento si posiziona in mm, ancorato secondo il suo allineamento (un testo centrato resta centrato anche se il
   contenuto cambia lunghezza); un elemento che un cartello non ha (es. la descrizione nel cartello in doppia cifra)
   prende la posizione di quello dell'altro cartello, spostata quanto sono spostati tra loro i due cartelli.
   risultato.ritocchi: i piccoli spostamenti fatti dall'operatore nell'anteprima, per cartello e per elemento.
   I campi si registrano in CAMPI della base (stato, pannello, foglio, cursore). Le regole che la pagina segue stanno
   in modelli/import-regole.json; qui come si scrive la pagina. */
(() => {
  const mmCss = v => `${Math.round(v * 100) / 100}mm`;
  const num = v => String(Math.round(v * 1000) / 1000);
  const J = v => JSON.stringify(v);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // testo di un prezzo o di uno sconto del .psd: parte prima del numero, numero, parte dopo («€ 18,00», «-70%»)
  function parti(testo) {
    const m = String(testo || '').trim().match(/^(\D*?)([\d.,]+)(\D*)$/);
    return m ? { prima: m[1], valore: m[2], dopo: m[3] } : { prima: '', valore: String(testo || '').trim(), dopo: '' };
  }
  const mediana = a => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : 0; };

  // colore delle varianti dei loghi ufficiali (print-logo-colors.js) più vicino al logo del .psd
  function coloreLogo(canvas) {
    if (!canvas) return 'white';
    const d = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let k = 0; k < d.length; k += 16) if (d[k + 3] > 128) { r += d[k]; g += d[k + 1]; b += d[k + 2]; n++; }
    if (!n) return 'white';
    r /= n; g /= n; b /= n;
    const colori = { white: [255, 255, 255], black: [0, 0, 0], red: [224, 0, 0], gold: [180, 139, 55] };
    return Object.entries(colori).sort(([, a], [, c]) => Math.hypot(a[0] - r, a[1] - g, a[2] - b) - Math.hypot(c[0] - r, c[1] - g, c[2] - b))[0][0];
  }

  function pagina(r, opzioni) {
    const { base, nome = 'Nuovo cartello', negozio = 'luxury', immagini = {} } = opzioni;
    const versione = (base.match(/negozi\.js\?v=([\w-]+)/) || [])[1];
    const v = versione ? `?v=${versione}` : '';
    const larghezzaFoglio = r.mm(r.psd.width);

    // elementi per cartello (chiave → elemento), nella posizione attuale (dopo ALLINEA CARTELLI e gli spostamenti)
    const per = { 1: {}, 2: {} };
    r.elementi.forEach(e => {
      const n = e.cartello === 'cartello-superiore' ? 1 : e.cartello === 'cartello-inferiore' ? 2 : 0;
      if (n && e.chiave && !e.rimosso && !per[n][e.chiave]) per[n][e.chiave] = e;
    });
    const foglio = {};
    r.elementi.filter(e => e.cartello === 'foglio' && e.chiave && !e.rimosso).forEach(e => { foglio[e.chiave] = e; });
    const comuni = Object.keys(per[1]).filter(k => per[2][k]);
    const scarto = { x: mediana(comuni.map(k => per[2][k].mm.x - per[1][k].mm.x)), y: mediana(comuni.map(k => per[2][k].mm.y - per[1][k].mm.y)) };
    const chiavi = new Set([...Object.keys(per[1]), ...Object.keys(per[2])]);
    const ha = k => chiavi.has(k);
    const modello = k => per[1][k] || per[2][k];       // stile di un elemento (font, colore…): dal superiore se c'è
    // lo stile di un elemento in un cartello: il suo, se il cartello lo ha (dal 19 ottobre 2026 i due cartelli hanno ognuno
    // il suo stile, cambiato nell'editor), altrimenti quello dell'altro cartello
    const stileDi = (n, k) => per[n][k] || modello(k);
    // ritocchi dell'operatore nella pagina generata (risultato.ritocchi[cartello][chiave] = { x, y } in mm)
    const ritocco = (n, k) => (r.ritocchi && r.ritocchi[n] && r.ritocchi[n][k]) || { x: 0, y: 0 };
    const geoFile = (n, k) => {
      if (per[n][k]) return per[n][k].mm;
      const altro = per[n === 1 ? 2 : 1][k];
      if (!altro) return null;
      const s = n === 1 ? -1 : 1;
      return { x: altro.mm.x + s * scarto.x, y: altro.mm.y + s * scarto.y, w: altro.mm.w, h: altro.mm.h };
    };
    const geo = (n, k) => {
      const g = geoFile(n, k);
      if (!g) return null;
      const t = ritocco(n, k);
      return { x: g.x + t.x, y: g.y + t.y, w: g.w, h: g.h };
    };
    const doppia = ha('prezzo-originario') || ha('percentuale');
    const conModalita = doppia && ha('descrizione');
    // la vista da cui parte il cartello: scelta in Layout Studio (r.modoIniziale), altrimenti quella del .psd
    const inDescrizione = n => r.modoIniziale && r.modoIniziale[n] ? r.modoIniziale[n] === 'descrizione'
      : !(per[n]['prezzo-originario'] || per[n]['percentuale']) && !!per[n]['descrizione'];

    // ---- font del .psd ----
    // font del progetto (file in assets/fonts/), Google Fonts (nome G:<famiglia>, dal loro foglio di stile) e font importati
    // nell'editor (risultato.fontUrl: nell'anteprima l'indirizzo del file, salvati in assets/fonts/)
    const extra = (r.extra || []).filter(x => !x.rimosso);
    const google = f => String(f).startsWith('G:');
    const famiglia = f => google(f) ? f.slice(2) : `PSD ${f}`;
    const font = {};
    [1, 2].forEach(n => chiavi.forEach(k => { const e = stileDi(n, k); if (e && e.tipo === 'testo' && e.font) font[e.font] = r.fileFont[e.font]; }));
    extra.forEach(x => { if (x.tipo === 'testo' && x.font) font[x.font] = r.fileFont[x.font]; });
    const googleFonts = Object.keys(font).filter(google).map(f => f.slice(2));
    const fontFace = Object.entries(font).filter(([f, file]) => !google(f) && file).map(([f, file]) =>
      `    @font-face {\n      font-family: '${famiglia(f)}';\n      src: url('${(r.fontUrl && r.fontUrl[f]) || `../assets/fonts/${file}`}') format('${/\.otf$/i.test(file) ? 'opentype' : 'truetype'}');\n      font-display: block;\n    }`).join('\n\n');

    // ---- stile e posizione degli elementi ----
    const css = [];
    const regoleTesto = e => {
      const regole = [
        `font-family: '${famiglia(e.font)}', serif`, `font-size: ${num(e.pt)}pt`, `letter-spacing: ${num(e.spaziatura / 1000)}em`,
        `line-height: ${e.interlinea ? num(e.interlinea) + 'pt' : '1'}`, `color: ${e.colore || '#000'}`, `text-align: ${{ destra: 'right', centro: 'center' }[e.allineamento] || 'left'}`,
        'white-space: nowrap', `font-weight: ${e.grassettoFinto ? 700 : 400}`
      ];
      if (e.corsivoFinto) regole.push('font-style: oblique');
      if (e.maiuscolo) regole.push('text-transform: uppercase');
      return regole.join('; ');
    };
    // lo stile comune e, per il cartello che lo ha diverso, il suo
    const stileTesto = k => {
      const comune = regoleTesto(modello(k));
      css.push(`    .el-${k} { ${comune}; }`);
      [1, 2].forEach(n => { const suo = per[n][k] && regoleTesto(per[n][k]); if (suo && suo !== comune) css.push(`    #card${n} .el-${k} { ${suo}; }`); });
    };
    // testo ancorato secondo l'allineamento: centrato sul centro, a sinistra sul bordo sinistro, a destra sul destro
    const posTesto = (n, k) => {
      const g = geo(n, k), e = stileDi(n, k);
      if (!g) return;
      const cy = mmCss(g.y + g.h / 2);
      const pos = e.allineamento === 'centro' ? `left: ${mmCss(g.x + g.w / 2)}; top: ${cy}; transform: translate(-50%, -50%)`
        : e.allineamento === 'destra' ? `right: ${mmCss(larghezzaFoglio - g.x - g.w)}; top: ${cy}; transform: translateY(-50%)`
        : `left: ${mmCss(g.x)}; top: ${cy}; transform: translateY(-50%)`;
      css.push(`    #card${n} .el-${k} { ${pos}; }`);
    };
    const posRiquadro = (n, k) => {
      const g = geo(n, k);
      if (g) css.push(`    #card${n} .el-${k} { left: ${mmCss(g.x)}; top: ${mmCss(g.y)}; width: ${mmCss(g.w)}; height: ${mmCss(g.h)}; }`);
    };

    ['claim-sx', 'claim-dx', 'descrizione', 'prezzo-originario', 'percentuale', 'prezzo-finale'].filter(ha).forEach(k => {
      stileTesto(k);
      [1, 2].forEach(n => posTesto(n, k));
    });
    if (ha('riquadro-brand')) {
      const e = modello('riquadro-brand');
      css.push(`    .el-riquadro-brand { background: ${e.colore || '#e00000'}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }`);
      [1, 2].forEach(n => { const suo = per[n]['riquadro-brand']; if (suo && suo.colore && suo.colore !== e.colore) css.push(`    #card${n} .el-riquadro-brand { background: ${suo.colore}; }`); });
      [1, 2].forEach(n => posRiquadro(n, 'riquadro-brand'));
    }
    if (ha('logo-brand')) {
      css.push('    .el-logo-brand { position: absolute; display: flex; align-items: center; justify-content: center; }');
      css.push('    .el-logo-brand img { max-width: 100%; max-height: 100%; width: auto; height: auto; }');
      [1, 2].forEach(n => {
        const g = geo(n, 'logo-brand'), rq = ha('riquadro-brand') ? geo(n, 'riquadro-brand') : null;
        if (!g) return;
        const x = rq ? g.x - rq.x : g.x, y = rq ? g.y - rq.y : g.y;
        css.push(`    #card${n} .el-logo-brand { left: ${mmCss(x)}; top: ${mmCss(y)}; width: ${mmCss(g.w)}; height: ${mmCss(g.h)}; }`);
      });
    }
    // barra del prezzo originario: lunghezza e spessore dal riquadro della forma ruotata
    if (ha('sbarra')) {
      const e = modello('sbarra');
      const a = (e.rotazione || 0) * Math.PI / 180, c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a)), den = c * c - s * s;
      css.push(`    .el-sbarra { background: ${e.colore || '#e00000'}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }`);
      [1, 2].forEach(n => {
        const g = geo(n, 'sbarra');
        if (!g) return;
        const suo = per[n].sbarra || e;
        if (suo.colore && suo.colore !== e.colore) css.push(`    #card${n} .el-sbarra { background: ${suo.colore}; }`);
        const lungo = suo.lungo || (Math.abs(den) > .05 ? (g.w * c - g.h * s) / den : Math.max(g.w, g.h));
        const spesso = suo.spesso || Math.max(.2, Math.abs(den) > .05 ? (g.h * c - g.w * s) / den : Math.min(g.w, g.h));
        css.push(`    #card${n} .el-sbarra { left: ${mmCss(g.x + g.w / 2)}; top: ${mmCss(g.y + g.h / 2)}; width: ${mmCss(lungo)}; height: ${mmCss(spesso)}; transform: translate(-50%, -50%) rotate(${num(suo.rotazione || 0)}deg); }`);
      });
    }
    // grafiche fisse (footer e le altre immagini con un nome riconosciuto)
    const grafiche = [...chiavi].filter(k => modello(k).tipo === 'immagine' && k !== 'logo-brand');
    grafiche.forEach(k => [1, 2].forEach(n => posRiquadro(n, k)));
    // elementi aggiunti nell'editor senza modulo (testi fissi, forme, immagini): misure in mm dal bordo alto del foglio,
    // nel cartello diventano dal bordo alto del cartello
    const metaMm = r.mm(r.meta || r.psd.height / 2);
    const cartelloDi = x => x.cartello === 'cartello-superiore' ? 1 : x.cartello === 'cartello-inferiore' ? 2 : 0;
    extra.forEach(x => {
      const n = cartelloDi(x), y = n === 2 ? x.y - metaMm : x.y;
      const ruota = x.rotazione ? ` rotate(${num(x.rotazione)}deg)` : '';
      const regole = [`opacity: ${x.opacita == null ? 1 : num(x.opacita)}`];
      if (x.tipo === 'testo') {
        regole.push(`font-family: '${famiglia(x.font)}', serif`, `font-size: ${num(x.pt)}pt`, `letter-spacing: ${num((x.spaziatura || 0) / 1000)}em`,
          `line-height: ${x.interlinea ? num(x.interlinea) + 'pt' : '1'}`, `color: ${x.colore || '#000'}`, `text-align: ${{ destra: 'right', centro: 'center' }[x.allineamento] || 'left'}`,
          'white-space: nowrap', `font-weight: ${x.grassetto ? 700 : 400}`);
        if (x.corsivo) regole.push('font-style: oblique');
        if (x.maiuscolo) regole.push('text-transform: uppercase');
        const cy = mmCss(y + x.h / 2);
        regole.push(x.allineamento === 'centro' ? `left: ${mmCss(x.x + x.w / 2)}; top: ${cy}; transform: translate(-50%, -50%)${ruota}`
          : x.allineamento === 'destra' ? `right: ${mmCss(larghezzaFoglio - x.x - x.w)}; top: ${cy}; transform: translateY(-50%)${ruota}`
          : `left: ${mmCss(x.x)}; top: ${cy}; transform: translateY(-50%)${ruota}`);
      } else {
        regole.push(`left: ${mmCss(x.x)}; top: ${mmCss(y)}; width: ${mmCss(x.w)}; height: ${mmCss(x.h)}`);
        if (ruota) regole.push(`transform:${ruota}`);
        if (x.tipo === 'forma') {
          regole.push(`background: ${x.forma === 'linea' ? (x.traccia || x.riempimento || '#000') : (x.riempimento || 'transparent')}`, '-webkit-print-color-adjust: exact', 'print-color-adjust: exact');
          if (x.forma !== 'linea' && x.spessoreTraccia) regole.push(`border: ${mmCss(x.spessoreTraccia)} solid ${x.traccia || '#000'}`, 'box-sizing: border-box');
          if (x.forma === 'cerchio') regole.push('border-radius: 50%');
          else if (x.forma === 'triangolo') regole.push('clip-path: polygon(50% 0, 100% 100%, 0 100%)');
          else if (x.raggio) regole.push(`border-radius: ${mmCss(x.raggio)}`);
        }
      }
      css.push(`    .ex-${x.id} { ${regole.join('; ')}; }`);
    });
    const markupExtra = n => extra.filter(x => cartelloDi(x) === n).map(x =>
      x.tipo === 'testo' ? `      <div class="elemento ex-${x.id}">${String(x.testo || '').split('\n').map(esc).join('<br>')}</div>`
      : x.tipo === 'immagine' ? `      <img class="elemento ex-${x.id}" src="${esc(immagini[`extra-${x.id}`] || '')}" alt="">`
      : `      <div class="elemento ex-${x.id}"></div>`).join('\n');

    if (conModalita) {
      css.push('    .card.modo-descrizione .el-prezzo-originario, .card.modo-descrizione .el-sbarra, .card.modo-descrizione .el-percentuale { display: none; }');
      css.push('    .card.modo-doppia .el-descrizione { display: none; }');
    }
    if (foglio.background && foglio.background.colore && foglio.background.colore !== '#FFFFFF') css.push(`    .print-sheet { background: ${foglio.background.colore}; }`);
    if (foglio['tratteggio-ritaglio']) {
      const t = foglio['tratteggio-ritaglio'], spessore = t.tratto && t.tratto.unita === 'mm' ? Math.max(.15, t.tratto.spessore) : .26;
      css.push(`    .cut-line { top: ${mmCss(r.mm(r.taglio))}; left: ${mmCss(t.mm.x)}; right: ${mmCss(Math.max(0, larghezzaFoglio - t.mm.x - t.mm.w))}; border-top: ${mmCss(spessore)} dashed ${(t.tratto && t.tratto.colore) || '#ccc'}; }`);
    }

    // ---- elementi dei cartelli ----
    const elementi = n => {
      const righe = [];
      if (ha('riquadro-brand')) righe.push(`      <div class="elemento el-riquadro-brand" id="riquadro${n}">${ha('logo-brand') ? `<div class="el-logo-brand"><img id="logo${n}" alt="Logo del brand"></div>` : ''}</div>`);
      else if (ha('logo-brand')) righe.push(`      <div class="elemento el-logo-brand"><img id="logo${n}" alt="Logo del brand"></div>`);
      if (ha('claim-sx')) righe.push(`      <div class="elemento el-claim-sx" id="claimSx${n}"></div>`);
      if (ha('claim-dx')) righe.push(`      <div class="elemento el-claim-dx" id="claimDx${n}"></div>`);
      if (ha('descrizione')) righe.push(`      <div class="elemento el-descrizione" id="descrizione${n}"></div>`);
      if (ha('prezzo-originario')) righe.push(`      <div class="elemento el-prezzo-originario" id="prezzoOriginario${n}"></div>`);
      if (ha('sbarra')) righe.push('      <div class="elemento el-sbarra"></div>');
      if (ha('percentuale')) righe.push(`      <div class="elemento el-percentuale" id="sconto${n}"></div>`);
      if (ha('prezzo-finale')) righe.push(`      <div class="elemento el-prezzo-finale" id="prezzoFinale${n}"></div>`);
      grafiche.forEach(k => righe.push(`      <img class="elemento el-${k}" src="${esc(immagini[k] || '')}" alt="">`));
      const aggiunti = markupExtra(n);
      if (aggiunti) righe.push(aggiunti);
      return righe.join('\n');
    };

    // ---- pannello ----
    const blocco1 = conModalita ? '        <div id="priceModeSelector" data-selettore-modalita-prezzo></div>' : '';
    const blocco2 = [];
    if (ha('logo-brand')) blocco2.push(`        <div class="form-group">
          <label class="section-label" for="brandSelect">BRAND</label>
          <div class="preset-select">
            <select id="brandSelect" onchange="onOfficialBrandChange()"></select>
          </div>
          <label for="customBrandSelect">Loghi Personali</label>
          <div class="preset-select">
            <select id="customBrandSelect" onchange="onCustomBrandChange()"></select>
          </div>
        </div>`);
    if (ha('claim-sx') || ha('claim-dx')) blocco2.push(`        <div class="form-row">
${ha('claim-sx') ? `          <div class="form-group">
            <label for="leftClaim">Claim Sinistro</label>
            <input type="text" id="leftClaim" oninput="onFieldInput('left', this.value)">
          </div>` : ''}
${ha('claim-dx') ? `          <div class="form-group">
            <label for="rightClaim">Claim Destro</label>
            <input type="text" id="rightClaim" oninput="onFieldInput('right', this.value)">
          </div>` : ''}
        </div>`);
    const blocco3 = [];
    // il menu dei testi pronti: Promozioni, Articoli o tutte e due (scelta di Layout Studio, di partenza tutte e due)
    const liste = (([1, 2].map(n => per[n].descrizione).find(e => e && e.liste && e.liste.length) || {}).liste) || ['Promozioni', 'Articoli'];
    const menu = liste.length > 1 ? { titolo: 'TESTI PRONTI', partenza: '-- Seleziona Testo Pronto --' }
      : liste[0] === 'Articoli' ? { titolo: 'Articoli', partenza: '-- Seleziona un articolo --' } : { titolo: 'Promozioni', partenza: '-- Seleziona Promozione --' };
    if (ha('descrizione')) blocco3.push(`        <div class="form-group" id="descGroup">
          <label class="section-label" for="presetDesc">${menu.titolo}</label>
          <div class="preset-select">
            <select id="presetDesc" class="ready-text-complete" data-testi-pronti="${liste.join(',')}" onchange="applyPreset()">
              <option value="" class="ready-text-placeholder">${menu.partenza}</option>
            </select>
          </div>
          <label for="desc">Testo Libero</label>
          <input type="text" id="desc" maxlength="37" placeholder="-- Testo Libero --" oninput="onFieldInput('desc', this.value)">
        </div>`);
    const prezzi = [];
    if (ha('prezzo-originario')) prezzi.push(`          <div class="form-group" id="oldGroup">
            <label for="priceOld">Prezzo Originario</label>
            <div class="input-affix">
              <span class="affix">€</span>
              <input data-prezzo type="text" id="priceOld" inputmode="decimal" oninput="onPriceInput('old', this)">
            </div>
          </div>`);
    if (ha('percentuale')) prezzi.push(`          <div class="form-group" id="discGroup">
            <label for="discount">Sconto</label>
            <div class="input-affix">
              <input data-percentuale type="number" id="discount" min="1" max="99" oninput="onDiscountInput()">
              <span class="affix">%</span>
            </div>
          </div>`);
    if (ha('prezzo-finale')) prezzi.push(`          <div class="form-group">
            <label for="priceNew">Prezzo Finale</label>
            <div class="input-affix">
              <span class="affix">€</span>
              <input data-prezzo type="text" id="priceNew" inputmode="decimal" oninput="onPriceInput('price', this)">
            </div>
          </div>`);
    if (prezzi.length) blocco3.push(`        <div class="form-row">\n${prezzi.join('\n')}\n        </div>`);

    // ---- campi (registrati in CAMPI della base) ----
    const campi = [];
    if (ha('claim-sx') || ha('claim-dx')) {
      const testo = k => ha(k) ? modello(k).testo.replace(/\s*\n\s*/g, ' ') : '';
      campi.push(`    // Claim Sinistro e Destro: la prima parola sopra, il resto sotto (es. "SHOP NOW" → SHOP / NOW)
    function scriviClaim(elemento, valore) {
      if (!elemento) return;
      const spazio = valore.indexOf(' ');
      if (spazio === -1) elemento.replaceChildren(document.createTextNode(valore));
      else elemento.replaceChildren(document.createTextNode(valore.slice(0, spazio)), document.createElement('br'), document.createTextNode(valore.slice(spazio + 1)));
    }
    CAMPI.push({
      stato: { left: ${J(testo('claim-sx'))}, right: ${J(testo('claim-dx'))} },
      pannello: s => {
        ${ha('claim-sx') ? "document.getElementById('leftClaim').value = s.left;" : ''}
        ${ha('claim-dx') ? "document.getElementById('rightClaim').value = s.right;" : ''}
      },
      foglio: (s, card, n) => {
        scriviClaim(document.getElementById('claimSx' + n), s.left);
        scriviClaim(document.getElementById('claimDx' + n), s.right);
      },
      cursore: [
        { controls: '#leftClaim', target: () => document.getElementById('claimSx' + currentCard) },
        { controls: '#rightClaim', target: () => document.getElementById('claimDx' + currentCard) }
      ]
    });`);
    }
    if (ha('logo-brand')) {
      const colore = coloreLogo(modello('logo-brand').livello.canvas);
      campi.push(`    // BRAND e Loghi Personali; senza scelta, il logo di partenza del .psd
    const LOGO_PARTENZA = ${J(immagini['logo-brand'] || '')};
    const COLORE_LOGHI = ${J(colore)};
    function cleanBrandName(filename) {
      return filename.replace(/\\.(png|jpg|jpeg|webp|svg)$/i, '').replace(/[-_]/g, ' ');
    }
    function addPlaceholder(select, text) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = text;
      select.replaceChildren(option);
    }
    function loadLocalLogos() {
      const { priorityFiles, remainingFiles } = getSortedLogoFiles();
      const brand = document.getElementById('brandSelect');
      addPlaceholder(brand, '-- Seleziona Brand --');
      brand.firstChild.className = 'brand-placeholder';
      [...priorityFiles, ...remainingFiles].forEach(fileName => appendBrandOption(brand, fileName, cleanBrandName(fileName), priorityFiles.includes(fileName)));
      const personali = document.getElementById('customBrandSelect');
      addPlaceholder(personali, '-- Seleziona Logo Personale --');
      LoghiPersonalizzati.elenco().filter(logo => logo && logo.name && logo.data).forEach(logo => {
        const option = document.createElement('option');
        option.value = logo.data;
        option.textContent = '★ ' + logo.name;
        personali.appendChild(option);
      });
    }
    // Scegliere un brand ufficiale azzera il logo personale, e viceversa.
    function onOfficialBrandChange() {
      setField('brand', document.getElementById('brandSelect').value);
      setField('customBrand', '');
      document.getElementById('customBrandSelect').value = '';
      renderCards();
    }
    function onCustomBrandChange() {
      setField('customBrand', document.getElementById('customBrandSelect').value);
      setField('brand', '');
      document.getElementById('brandSelect').value = '';
      renderCards();
    }
    CAMPI.push({
      stato: { brand: '', customBrand: '' },
      pannello: s => {
        document.getElementById('brandSelect').value = s.brand;
        document.getElementById('customBrandSelect').value = s.customBrand;
      },
      foglio: (s, card, n) => {
        const img = document.getElementById('logo' + n);
        if (s.customBrand) img.src = s.customBrand;
        else if (s.brand) PrintLogoColors.setBrandLogoSrc('logo' + n, '', s.brand, s.brand, COLORE_LOGHI);
        else img.src = LOGO_PARTENZA;
      },
      // sul riquadro rosso il triangolo non si vedrebbe: sta sopra il riquadro, centrato sul logo, con la punta a 1 mm
      // (come nelle pagine sorgente); senza riquadro, 1 mm sopra il logo
      cursore: [{ controls: '#brandSelect, #customBrandSelect', target: () => document.getElementById('logo' + currentCard), placement: 'above',
        gap: logo => { const riquadro = logo.closest('.el-riquadro-brand'); return 96 / 25.4 + (riquadro ? Math.max(0, logo.getBoundingClientRect().top - riquadro.getBoundingClientRect().top) : 0); } }]
    });`);
    }
    if (ha('descrizione')) {
      campi.push(`    // TESTI PRONTI e Testo Libero: fino a 31 caratteri il testo ha la sua grandezza, poi si rimpicciolisce
    const DESC_FULL_LENGTH = 31;
    function setDescriptionText(element, text) {
      element.textContent = text;
      element.style.fontSize = '';
      if (text.length > DESC_FULL_LENGTH) {
        const baseSize = parseFloat(getComputedStyle(element).fontSize);
        element.style.fontSize = (baseSize * DESC_FULL_LENGTH / text.length) + 'px';
      }
    }
    function applyPreset() {
      const value = document.getElementById('presetDesc').value;
      setField('descPreset', value);
      if (value !== '') {
        setField('desc', value);
        document.getElementById('desc').value = value;
      }
      renderCards();
    }
    CAMPI.push({
      stato: { descPreset: '', desc: ${J(modello('descrizione').testo.replace(/\s*\n\s*/g, ' '))} },
      pannello: s => {
        document.getElementById('presetDesc').value = s.descPreset;
        document.getElementById('desc').value = s.desc;
      },
      foglio: (s, card, n) => setDescriptionText(document.getElementById('descrizione' + n), s.desc),
      cursore: [{ controls: '#presetDesc, #desc', target: () => document.getElementById('descrizione' + currentCard) }]
    });`);
    }
    if (doppia || ha('prezzo-finale')) {
      const p = k => ha(k) ? parti(modello(k).testo) : { prima: '', valore: '', dopo: '' };
      const old = p('prezzo-originario'), sconto = p('percentuale'), finale = p('prezzo-finale');
      campi.push(`    // Prezzi e sconto: € fisso e due decimali nei campi (campi-prezzo.js), sul cartello come nel .psd
    const FORMATI = { old: ${J({ prima: old.prima, dopo: old.dopo })}, disc: ${J({ prima: sconto.prima, dopo: sconto.dopo })}, price: ${J({ prima: finale.prima, dopo: finale.dopo })} };
    const formatta = (campo, valore) => valore ? FORMATI[campo].prima + valore + FORMATI[campo].dopo : '';
    function onPriceInput(campo, input) {
      input.value = input.value.replace(/[^\\d,.]/g, '');
      onFieldInput(campo, input.value);
    }
    function onDiscountInput() {
      onFieldInput('disc', document.getElementById('discount').value.replace(/\\D/g, '').slice(0, 2));
    }
    CAMPI.push({
      stato: { old: ${J(old.valore)}, disc: ${J(sconto.valore.replace(/\D/g, ''))}, price: ${J(finale.valore)} },
      pannello: s => {
        ${ha('prezzo-originario') ? "document.getElementById('priceOld').value = s.old;" : ''}
        ${ha('percentuale') ? "document.getElementById('discount').value = s.disc;" : ''}
        ${ha('prezzo-finale') ? "document.getElementById('priceNew').value = s.price;" : ''}
      },
      foglio: (s, card, n) => {
        const scrivi = (id, testo) => { const el = document.getElementById(id + n); if (el) el.textContent = testo; };
        scrivi('prezzoOriginario', formatta('old', s.old));
        scrivi('sconto', formatta('disc', s.disc));
        scrivi('prezzoFinale', formatta('price', s.price));
      },
      cursore: [
        { controls: '#priceOld', target: () => document.getElementById('prezzoOriginario' + currentCard) },
        { controls: '#discount, #discount ~ .percent-stepper', target: () => document.getElementById('sconto' + currentCard) },
        { controls: '#priceNew', target: () => document.getElementById('prezzoFinale' + currentCard) }
      ]
    });`);
    }
    if (conModalita) {
      campi.push(`    // DOPPIA CIFRA / DESCRIZIONE ARTICOLO: con la descrizione spariscono prezzo originario, barra e sconto
    function setDescriptionMode(withDesc) {
      setField('withDesc', withDesc);
      syncPanel();
      renderCards();
    }
    CAMPI.push({
      stato: { withDesc: false },
      pannello: s => {
        SelettoreModalitaPrezzo.setDescription(s.withDesc);
        document.getElementById('descGroup').hidden = !s.withDesc;
        ['oldGroup', 'discGroup'].forEach(id => { const g = document.getElementById(id); if (g) g.hidden = s.withDesc; });
      },
      foglio: (s, card) => {
        card.classList.toggle('modo-descrizione', s.withDesc);
        card.classList.toggle('modo-doppia', !s.withDesc);
      },
      cursore: [{ controls: '#doublePriceBtn, #descriptionBtn', target: () => document.getElementById((cards[currentCard].withDesc ? 'descrizione' : 'prezzoOriginario') + currentCard) }]
    });`);
    }

    // ---- composizione della pagina dalla base ----
    let html = base;
    const metti = (segno, testo) => {
      if (!html.includes(segno)) throw new Error(`segno non trovato nella base: ${segno}`);
      html = html.replace(segno, testo);
    };
    metti('<title>Cartello base</title>', `<title>${esc(nome)}</title>`);
    metti('<h2>Cartello base</h2>', `<h2>${esc(nome)}</h2>`);
    metti('<html lang="it" data-negozio="luxury">', `<html lang="it" data-negozio="${esc(negozio)}">`);
    const fileComuni = [];
    if (ha('logo-brand')) fileComuni.push(
      `<script src="../assets/js/loghi-personalizzati.js${v}"></script>`,
      `  <script src="../assets/logos/${negozio}/elenco.js${v}"></script>`,
      `  <script src="../assets/js/logos.js${v}"></script>`,
      `  <script src="../assets/js/print-logo-colors.js${v}"></script>`);
    if (googleFonts.length) fileComuni.push(`${fileComuni.length ? '  ' : ''}<link href="https://fonts.googleapis.com/css2?${googleFonts.map(f => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:ital,wght@0,400;0,700;1,400`).join('&')}&display=swap" rel="stylesheet">`);
    metti('<!-- IMPORT: file comuni dei moduli aggiunti (loghi, testi pronti…) -->', fileComuni.join('\n') || '<!-- nessun file in più -->');
    const delFoglio = markupExtra(0);
    if (delFoglio) {
      css.push('    .print-sheet > .elemento { position: absolute; }');
      metti('    <div class="cut-line"></div>', `${delFoglio}\n    <div class="cut-line"></div>`);
    }
    metti('    /* IMPORT: @font-face dei font del .psd (file in ../assets/fonts/) */', `    /* font del .psd */\n${fontFace}\n\n    /* elementi del .psd: stile e posizione in mm (x dal bordo sinistro del foglio, y dal bordo alto del cartello) */\n${css.join('\n')}`);
    metti('        <!-- IMPORT: altri selettori e pulsanti (modalità, + AGGIUNGI 2° BRAND…) -->', blocco1);
    metti('        <!-- IMPORT: BRAND, Loghi Personali, Claim Sinistro e Destro -->', blocco2.join('\n\n'));
    metti('        <!-- IMPORT: TESTI PRONTI e Testo Libero, prezzi -->', blocco3.join('\n\n'));
    metti('      <!-- IMPORT: elementi del cartello superiore -->', elementi(1));
    metti('      <!-- IMPORT: elementi del cartello inferiore -->', elementi(2));
    const prima = [];
    if (ha('descrizione')) prima.push(`<script src="../assets/js/testi-pronti.js${v}"></script>`);
    metti('  <!-- IMPORT: moduli comuni da caricare prima dello script della pagina (testi-pronti.js, second-brand-toggle.js…) -->', prima.length ? '  ' + prima.join('\n  ') : '');
    if (conModalita) {
      const riga = html.match(/  <script src="\.\.\/assets\/js\/selettore-cartello\.js[^"]*"><\/script>\r?\n/);   // anche con gli a capo di Windows
      if (!riga) throw new Error('selettore-cartello.js non trovato nella base');
      html = html.replace(riga[0], `${riga[0]}  <script src="../assets/js/selettore-modalita-prezzo.js${v}"></script>\n`);
    }
    metti('    // IMPORT: registrazione dei campi', campi.join('\n\n'));
    const avvio = [];
    if (conModalita) [1, 2].forEach(n => avvio.push(`    cards[${n}].withDesc = ${inDescrizione(n)};   // modalità del cartello nel .psd`));
    // i testi di partenza di ogni cartello: i suoi (dal 19 ottobre 2026 si cambiano per cartello in Layout Studio), non
    // quelli del cartello superiore per tutti e due
    [1, 2].forEach(n => {
      const suo = k => per[n][k] && String(per[n][k].testo || '');
      const valori = {};
      if (per[n]['claim-sx']) valori.left = suo('claim-sx').replace(/\s*\n\s*/g, ' ');
      if (per[n]['claim-dx']) valori.right = suo('claim-dx').replace(/\s*\n\s*/g, ' ');
      if (per[n].descrizione) valori.desc = suo('descrizione').replace(/\s*\n\s*/g, ' ');
      if (per[n]['prezzo-originario']) valori.old = parti(suo('prezzo-originario')).valore;
      if (per[n].percentuale) valori.disc = parti(suo('percentuale')).valore.replace(/\D/g, '');
      if (per[n]['prezzo-finale']) valori.price = parti(suo('prezzo-finale')).valore;
      if (Object.keys(valori).length) avvio.push(`    Object.assign(cards[${n}], ${J(valori)});   // testi del cartello nel .psd`);
    });
    metti('    // IMPORT: avvio dopo i dati che servono (es. LoghiPersonalizzati.pronto.then(avvia))\n    window.onload = avvia;',
      `${avvio.join('\n')}${avvio.length ? '\n' : ''}    window.onload = ${ha('logo-brand') ? '() => LoghiPersonalizzati.pronto.then(() => { loadLocalLogos(); avvia(); })' : 'avvia'};`);
    return html;
  }

  window.ImportGenera = Object.freeze({ pagina, parti });
})();
