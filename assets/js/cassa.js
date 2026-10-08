/* Utilità Cassa, comuni a tutti i negozi: Calcola Sconto, Calcola Aliquota Sconto, Cambio Valuta, Calcola IVA,
   Generatore QR Code. Stile in assets/css/dashboard.css (.widget); serve qrcode.js (cdnjs) per il QR.
   Comportamento (regola presa da TEBE): su desktop e tablet lo strumento scelto si apre in un popup al centro della
   pagina, sopra un velo, e si chiude con la ✕, con Esc o toccando il velo; sul telefono gli strumenti restano pronti
   nella pagina e quello in uso si evidenzia.

   Uso:
     Cassa.crea(contenitore, { qr })   crea gli strumenti dentro il contenitore (#tools); qr = collegamento iniziale
                                       del Generatore QR (dalla scheda del negozio), usato anche se il campo è vuoto
     Cassa.apri(id, { scorri })        apre lo strumento (id: widget-sconto, widget-aliquota, widget-valuta,
                                       widget-iva, widget-qrcode); dal menu laterale scorri: true porta allo strumento
     Cassa.chiudi()                    chiude il popup
   Calcoli: IVA ricorda l'ultimo campo scritto (Imponibile, Importo IVA, Totale): cambiando aliquota quel valore resta
   fermo e si ricalcolano gli altri due; Azzera IVA svuota tutto. Cambio Valuta accetta punto e virgola, aggiorna
   entrambe le direzioni e mostra lo stato dei tassi (aggiornati o di riserva). */
(() => {
  const telefono = window.matchMedia('screen and (max-width: 720px) and (pointer: coarse)');
  const TASSI_RISERVA = { USD: 1.08, GBP: 0.85, RUB: 98.0, ILS: 4.00, CNY: 7.80, JPY: 160.5 };
  const SIMBOLI = { USD: '$', GBP: '£', RUB: '₽', ILS: '₪', CNY: '¥', JPY: '¥', EUR: '€' };
  let tassi = { ...TASSI_RISERVA };
  let aliquotaIva = 22;
  let origineIva = 'iva-net';
  let qrPredefinito = '';
  let contenitore = null;

  const $ = id => document.getElementById(id);
  const euro = valore => `€ ${valore.toFixed(2).replace('.', ',')}`;
  const numero = testo => parseFloat(String(testo).replace(',', '.'));

  // Markup degli strumenti (nessun testo dell'utente: solo testi fissi)
  function markup() {
    const chiudi = '<div class="widget-header-controls"><button class="close-btn" type="button" data-cassa-chiudi title="Chiudi" aria-label="Chiudi">✕</button></div>';
    return `
      <div class="widget" id="widget-sconto">
        ${chiudi}
        <h3>Calcola Sconto</h3>
        <div class="tool-row">
          <div class="input-group"><span class="input-prefix">€</span><input type="number" id="p-orig" class="tool-input" placeholder="Prezzo Pieno"></div>
          <div class="input-group"><span class="input-prefix">%</span><input type="number" id="p-sconto" class="tool-input" placeholder="Sconto"></div>
        </div>
        <button class="tool-btn" type="button" style="width:100%" data-cassa="sconto">Calcola Prezzo Finale</button>
        <div class="tool-result" id="res-sconto">€ 0,00</div>
      </div>

      <div class="widget" id="widget-aliquota">
        ${chiudi}
        <h3>Calcola Aliquota Sconto</h3>
        <div class="tool-row">
          <div class="input-group"><span class="input-prefix">€</span><input type="number" id="aliq-orig" class="tool-input" placeholder="Prezzo Originale"></div>
          <div class="input-group"><span class="input-prefix">€</span><input type="number" id="aliq-finale" class="tool-input" placeholder="Prezzo Scontato"></div>
        </div>
        <button class="tool-btn" type="button" style="width:100%" data-cassa="aliquota">Trova % Sconto</button>
        <div class="tool-result" id="res-aliquota">0%</div>
      </div>

      <div class="widget" id="widget-valuta">
        ${chiudi}
        <h3>Cambio Valuta</h3>
        <div class="tool-row">
          <select id="val-direction" class="tool-input-select">
            <option value="TO_EUR">Da Valuta Estera ➔ ad EUR (€)</option>
            <option value="FROM_EUR">Da EUR (€) ➔ a Valuta Estera</option>
          </select>
        </div>
        <div class="tool-row">
          <div class="input-group">
            <span class="input-prefix" id="val-curr-symbol">$</span>
            <input type="text" id="val-amount" class="tool-input" inputmode="decimal" autocomplete="off" placeholder="Importo">
            <select id="val-currency" class="tool-input-select" style="max-width: 140px; border-left: 1px solid var(--border);">
              <option value="USD" data-breve="USD">USD ($) USA</option>
              <option value="GBP" data-breve="GBP">GBP (£) GBR</option>
              <option value="RUB" data-breve="RUB">RUB (₽) RUS</option>
              <option value="ILS" data-breve="ILS">ILS (₪) ISR</option>
              <option value="CNY" data-breve="CNY">CNY (¥) CHN</option>
              <option value="JPY" data-breve="JPY">JPY (¥) JPN</option>
            </select>
          </div>
        </div>
        <button class="tool-btn" type="button" style="width:100%" data-cassa="valuta">Calcola Cambio</button>
        <div class="tool-result" id="res-valuta">€ 0,00</div>
        <div class="tool-status" id="val-status" role="status">Caricamento tassi di cambio…</div>
      </div>

      <div class="widget" id="widget-iva">
        ${chiudi}
        <h3>Calcola IVA</h3>
        <div class="iva-campi">
          <div class="rate-grid-widget">
            <button class="rate-btn-widget" type="button" data-aliquota="4">4%</button>
            <button class="rate-btn-widget" type="button" data-aliquota="5">5%</button>
            <button class="rate-btn-widget" type="button" data-aliquota="10">10%</button>
            <button class="rate-btn-widget active" type="button" data-aliquota="22">22%</button>
          </div>
          <div class="tool-row"><div class="input-group"><span class="input-prefix">€</span><input type="text" id="iva-net" class="tool-input" inputmode="decimal" autocomplete="off" placeholder="Imponibile"><span class="input-suffix">SENZA IVA</span></div></div>
          <div class="tool-row"><div class="input-group"><span class="input-prefix">€</span><input type="text" id="iva-vat" class="tool-input" inputmode="decimal" autocomplete="off" placeholder="Importo IVA"><span class="input-suffix">IVA</span></div></div>
          <div class="tool-row"><div class="input-group"><span class="input-prefix">€</span><input type="text" id="iva-gross" class="tool-input" inputmode="decimal" autocomplete="off" placeholder="Totale"><span class="input-suffix">CON IVA</span></div></div>
          <button class="tool-btn-secondary tool-btn" type="button" style="width:100%;" data-cassa="azzera-iva">Azzera IVA</button>
        </div>
      </div>

      <div class="widget" id="widget-qrcode">
        ${chiudi}
        <h3>Generatore QR Code</h3>
        <div class="tool-row"><div class="input-group"><input type="text" id="qr-input" class="tool-input" placeholder="Inserisci Link o Testo"></div></div>
        <div class="tool-row">
          <select id="qr-size" class="tool-input-select">
            <option value="100" selected>Dimensione: Piccolo (100px)</option>
            <option value="160">Dimensione: Medio (160px)</option>
            <option value="240">Dimensione: Grande (240px)</option>
          </select>
        </div>
        <div class="qr-preview-container"><div class="qr-preview-wrapper" id="qrcode"></div></div>
        <div class="tool-row" style="gap: 0.5rem; margin-top: 0.8rem;">
          <button class="tool-btn" type="button" style="flex: 1;" data-cassa="scarica-qr">Scarica QR</button>
          <button class="tool-btn tool-btn-secondary" type="button" style="flex: 1;" data-cassa="stampa-qr">Stampa QR</button>
        </div>
      </div>`;
  }

  // ----- Calcoli -----
  function calcolaSconto() {
    const pieno = parseFloat($('p-orig').value);
    const sconto = parseFloat($('p-sconto').value);
    $('res-sconto').textContent = Number.isFinite(pieno) && Number.isFinite(sconto) ? euro(pieno - pieno * sconto / 100) : '€ 0,00';
  }

  function calcolaAliquota() {
    const pieno = parseFloat($('aliq-orig').value);
    const scontato = parseFloat($('aliq-finale').value);
    $('res-aliquota').textContent = Number.isFinite(pieno) && Number.isFinite(scontato) && pieno > 0
      ? `-${Math.round((pieno - scontato) / pieno * 100)}%`
      : '0%';
  }

  const campiIva = { 'iva-net': 'net', 'iva-vat': 'vat', 'iva-gross': 'gross' };
  function calcolaIva(origine = origineIva) {
    origineIva = origine;
    const valore = numero($(origine).value);
    const altri = Object.keys(campiIva).filter(id => id !== origine);
    if (!Number.isFinite(valore) || valore < 0) {
      altri.forEach(id => { $(id).value = ''; });
      return;
    }
    const r = aliquotaIva / 100;
    const net = { 'iva-net': valore, 'iva-vat': valore / r, 'iva-gross': valore / (1 + r) }[origine];
    const valori = { 'iva-net': net, 'iva-vat': net * r, 'iva-gross': net * (1 + r) };
    altri.forEach(id => { $(id).value = valori[id].toFixed(2).replace('.', ','); });
  }

  function impostaAliquota(pulsante) {
    aliquotaIva = Number(pulsante.dataset.aliquota);
    contenitore.querySelectorAll('.rate-btn-widget').forEach(b => b.classList.toggle('active', b === pulsante));
    calcolaIva();
  }

  function azzeraIva() {
    Object.keys(campiIva).forEach(id => { $(id).value = ''; });
    origineIva = 'iva-net';
  }

  async function caricaTassi() {
    const stato = $('val-status');
    stato.textContent = 'Caricamento tassi di cambio…';
    try {
      const risposta = await fetch('https://open.er-api.com/v6/latest/EUR');
      if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`);
      const dati = await risposta.json();
      if (!dati || !dati.rates || !Object.keys(TASSI_RISERVA).every(v => Number.isFinite(dati.rates[v]) && dati.rates[v] > 0)) {
        throw new Error('Risposta tassi di cambio non valida.');
      }
      tassi = dati.rates;
      stato.textContent = 'Tassi di cambio aggiornati.';
    } catch (errore) {
      console.error('Aggiornamento tassi di cambio fallito.', errore);
      tassi = { ...TASSI_RISERVA };
      stato.textContent = 'Tassi di riserva in uso: aggiornamento non disponibile.';
    }
    calcolaValuta();
  }

  function calcolaValuta() {
    const direzione = $('val-direction').value;
    const importo = numero($('val-amount').value);
    const valuta = $('val-currency').value;
    const simbolo = SIMBOLI[valuta];
    const tasso = tassi[valuta];
    const risultato = $('res-valuta');
    $('val-curr-symbol').textContent = direzione === 'TO_EUR' ? simbolo : '€';
    if (!Number.isFinite(tasso) || tasso <= 0) {
      console.error('Tasso di cambio non disponibile:', valuta);
      risultato.textContent = 'Cambio non disponibile';
      return;
    }
    if (Number.isFinite(importo) && importo >= 0) {
      risultato.textContent = direzione === 'TO_EUR'
        ? euro(importo / tasso)
        : `${simbolo} ${(importo * tasso).toFixed(2).replace('.', ',')} (${valuta})`;
    } else {
      risultato.textContent = direzione === 'TO_EUR' ? '€ 0,00' : `${simbolo} 0,00`;
    }
  }

  // ----- QR -----
  function generaQr() {
    const testo = $('qr-input').value.trim() || qrPredefinito;
    const misura = parseInt($('qr-size').value, 10) || 100;
    const area = $('qrcode');
    area.replaceChildren();
    if (!testo || typeof QRCode === 'undefined') return;
    new QRCode(area, { text: testo, width: misura, height: misura, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
  }

  function immagineQr() {
    const elemento = $('qrcode').querySelector('img') || $('qrcode').querySelector('canvas');
    if (!elemento) return '';
    return elemento.tagName.toLowerCase() === 'canvas' ? elemento.toDataURL('image/png') : elemento.src;
  }

  function scaricaQr() {
    const url = immagineQr();
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qrcode.png';
    document.body.append(link);
    link.click();
    link.remove();
  }

  function stampaQr() {
    const url = immagineQr();
    if (!url) return;
    const finestra = window.open('', '_blank', 'width=450,height=450');
    if (!finestra) {
      console.error('Apertura della finestra di stampa bloccata dal browser.');
      return;
    }
    finestra.document.write(`<!DOCTYPE html><html><head><title>Stampa QR Code</title></head><body style="display:flex; justify-content:center; align-items:center; height:100vh; margin:0; background:#fff;"><img src="${url}" style="max-width:80%; height:auto;" onload="window.print(); window.close();"></body></html>`);
    finestra.document.close();
  }

  // Menu della valuta: nel look COMPATTO, come in TEBE, nel widget solo la sigla (USD) e nel popup il nome intero
  function etichetteValuta() {
    const menu = $('val-currency');
    if (!menu) return;
    const breve = document.documentElement.dataset.interfaceLook === 'minimal' && !menu.closest('.widget.expanded');
    menu.querySelectorAll('option').forEach(opzione => {
      opzione.dataset.intero ??= opzione.textContent;
      opzione.textContent = breve ? opzione.dataset.breve : opzione.dataset.intero;
    });
  }

  // ----- Apertura e chiusura -----
  // Sul telefono lo strumento appena scelto (toccandolo o scrivendo in un suo campo) si porta subito sotto la barra in
  // alto (scroll-margin-top in dashboard.css), così si vede che è quello in uso; scrivendo nello stesso non si muove.
  // Lo scorrimento parte poco dopo: entrando in un campo il browser (e su iPhone la tastiera che si apre) fa prima il
  // suo scorrimento, che altrimenti interromperebbe questo
  function evidenzia(strumento, { porta = true } = {}) {
    const nuovo = strumento && !strumento.classList.contains('mobile-active');
    contenitore.querySelectorAll('.widget.mobile-active').forEach(w => { if (w !== strumento) w.classList.remove('mobile-active'); });
    strumento?.classList.add('mobile-active');
    if (nuovo && porta) setTimeout(() => strumento.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
  }

  function apri(id, { scorri = false } = {}) {
    const strumento = $(id);
    if (!strumento) return;
    if (telefono.matches) {
      evidenzia(strumento, { porta: !scorri });
      if (scorri) {
        strumento.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => strumento.querySelector('input, select, button:not(.close-btn)')?.focus({ preventScroll: true }), 450);
      }
      return;
    }
    contenitore.querySelectorAll('.widget.expanded').forEach(w => w.classList.remove('expanded'));
    contenitore.classList.add('is-focused');
    strumento.classList.add('expanded');
    etichetteValuta();
    if (scorri) setTimeout(() => strumento.querySelector('input, select, button:not(.close-btn)')?.focus({ preventScroll: true }), 300);
  }

  function chiudi() {
    if (!contenitore) return;
    contenitore.classList.remove('is-focused');
    contenitore.querySelectorAll('.widget.expanded').forEach(w => w.classList.remove('expanded'));
    contenitore.querySelectorAll('.widget.mobile-active').forEach(w => w.classList.remove('mobile-active'));
    etichetteValuta();
  }

  function crea(elemento, { qr = '' } = {}) {
    contenitore = elemento;
    qrPredefinito = qr;
    contenitore.innerHTML = markup();
    $('qr-input').value = qr;

    // Calcoli
    const azioni = {
      sconto: calcolaSconto, aliquota: calcolaAliquota, valuta: calcolaValuta,
      'azzera-iva': azzeraIva, 'scarica-qr': scaricaQr, 'stampa-qr': stampaQr
    };
    contenitore.querySelectorAll('[data-cassa]').forEach(b => b.addEventListener('click', () => azioni[b.dataset.cassa]()));
    contenitore.querySelectorAll('[data-aliquota]').forEach(b => b.addEventListener('click', () => impostaAliquota(b)));
    Object.keys(campiIva).forEach(id => $(id).addEventListener('input', () => calcolaIva(id)));
    $('val-direction').addEventListener('change', calcolaValuta);
    $('val-currency').addEventListener('change', calcolaValuta);
    $('val-amount').addEventListener('input', calcolaValuta);
    $('qr-input').addEventListener('input', generaQr);
    $('qr-size').addEventListener('change', generaQr);

    // Apertura: clic sullo strumento (non sui comandi interni), ✕, velo, Esc
    contenitore.querySelectorAll('.widget').forEach(strumento => {
      strumento.addEventListener('click', evento => {
        if (evento.target.closest('[data-cassa-chiudi]')) { evento.stopPropagation(); chiudi(); return; }
        apri(strumento.id);
      });
    });
    contenitore.addEventListener('click', evento => { if (evento.target === contenitore) chiudi(); });
    document.addEventListener('keydown', evento => { if (evento.key === 'Escape') chiudi(); });
    // Sul telefono anche scrivendo in un campo si evidenzia il suo strumento
    document.addEventListener('focusin', evento => {
      const strumento = evento.target.closest?.('#tools .widget');
      if (strumento && telefono.matches) evidenzia(strumento);
    });
    // Passando alla vista telefono con un popup aperto, lo si chiude
    telefono.addEventListener('change', chiudi);

    // cambiando aspetto (IMPOSTAZIONI) si rifanno le etichette della valuta
    new MutationObserver(etichetteValuta).observe(document.documentElement,
      { attributes: true, attributeFilter: ['data-interface-look'] });
    etichetteValuta();
    generaQr();
    caricaTassi();
  }

  window.Cassa = Object.freeze({ crea, apri, chiudi });
})();
