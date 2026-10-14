/* Radio di STORE // CRAFT (dal 14 ottobre 2026, definitiva in Luxury Outlet dalla versione 1.2.29), in due forme:
   - nella dashboard, dietro data e ora: il riquadro dell'intestazione si ribalta all'indietro, come una carta, con il
     pulsantino tondo accanto, e dietro c'è una piccola radio vintage, pulita e minimal: levetta di accensione con la
     spia, finestra della scala con le tacche, l'ago e il nome della stazione retroilluminato, manopola delle stazioni e
     manopola del volume. La carica dashboard.js solo per i negozi con radio: true nell'intestazione (oggi Luxury);
   - nelle altre pagine del negozio, la mini radio fluttuante: se la radio era accesa, cambiando pagina riparte da sola
     sulla stessa stazione in un piccolo riquadro in basso a destra (levetta, scala, manopola delle stazioni). Il sito è
     fatto di pagine separate: cambiando pagina l'audio si interrompe e lo streaming si ricollega (un secondo o due); se
     il browser non lascia ripartire l'audio senza un clic, la mini radio lo dice («tocca per riprendere»). La carica
     negozi.js solo quando la radio è accesa (sessionStorage "storecraft_radio_acceso_<negozio>", per scheda del browser).

   Uso:  Radio.monta(orologio, { negozio })   orologio: il riquadro .orologio-testata della dashboard
         Radio.mini({ negozio })               la mini radio fluttuante (da sola, al caricamento, nelle altre pagine)
   Stazioni: streaming https in MP3 o AAC, che suonano direttamente nel browser (verificati il 14 ottobre 2026; gli
   indirizzi possono cambiare). Stazione, volume e faccia mostrata restano nel browser, per negozio (localStorage
   "storecraft_radio_<negozio>"); la radio non parte da sola la prima volta: i browser lo vietano, serve la levetta.
   La musica in un negozio richiede il permesso per la musica d'ambiente (SIAE e diritti connessi), a carico del negozio:
   la radio fornisce solo il lettore. */
(() => {
  // in ordine sulla scala, dalle più classiche alle più moderne (18 stazioni, verificate il 14 ottobre 2026)
  const STAZIONI = [
    { nome: 'Radio Monte Carlo', breve: 'Monte Carlo', url: 'https://icy.unitedradio.it/RMC.aac' },
    { nome: 'Crooners · Sinatra, Dean Martin, Tony Bennett', breve: 'Crooners', url: 'https://stream.ella-radio.de/ella-sinatra-style/mp3-192/' },
    { nome: 'Swing & Big Band', breve: 'Swing', url: 'https://stream.ella-radio.de/ella-swing-and-bigband/mp3-192/' },
    { nome: 'Anni 50 · Elvis e il rock and roll', breve: 'Anni 50', url: 'https://drive.uber.radio/uber/boomerang1950s/icecast.audio' },
    { nome: 'Smooth Soul', breve: 'Smooth Soul', url: 'https://media-ice.musicradio.com/SmoothSoulMP3' },
    { nome: 'Smooth Bossa Nova', breve: 'Bossa Nova', url: 'https://stream.ella-radio.de/ella-smooth-bossa-nova/mp3-192/' },
    { nome: 'Radio Swiss Jazz', breve: 'Jazz', url: 'https://stream.srg-ssr.ch/srgssr/rsj/aac/192' },
    { nome: 'Heart 70s', breve: 'Anni 70', url: 'https://media-ssl.musicradio.com/Heart70sMP3' },
    { nome: 'Heart 80s', breve: 'Anni 80', url: 'https://media-ssl.musicradio.com/Heart80sMP3' },
    { nome: 'Heart 90s', breve: 'Anni 90', url: 'https://media-ssl.musicradio.com/Heart90sMP3' },
    { nome: 'Heart 00s', breve: 'Anni 2000', url: 'https://media-ssl.musicradio.com/Heart00sMP3' },
    { nome: 'Dance Revival · disco e dance anni 70, 80 e 90', breve: 'Dance Revival', url: 'https://cast1.torontocast.com:4560/stream' },
    { nome: 'Capital · le hit di oggi', breve: 'Hit di oggi', url: 'https://media-ssl.musicradio.com/CapitalUKMP3' },
    { nome: 'Radio 105', breve: 'Radio 105', url: 'https://icy.unitedradio.it/Radio105.mp3' },
    { nome: 'Heart Dance', breve: 'Dance', url: 'https://media-ssl.musicradio.com/HeartDanceMP3' },
    { nome: 'Virgin Radio Italia', breve: 'Rock', url: 'https://icy.unitedradio.it/Virgin.mp3' },
    { nome: 'Smooth Country', breve: 'Country', url: 'https://media-ssl.musicradio.com/SmoothCountryMP3' },
    { nome: 'France Musique Opéra · tutta l\'opera', breve: 'Opera', url: 'https://icecast.radiofrance.fr/francemusiqueopera-hifi.aac' }
  ];
  const LARGHEZZA_RADIO = 300;   // px della faccia radio (l'orologio è largo come CASSIERE / CREATOR)
  const INATTIVITA = 6000;       // ms senza il mouse sopra (né la tastiera dentro) prima che la radio si contragga
  const RITORNO = 30000;         // ms dopo la contrazione, sempre senza usarla, prima che la carta torni sull'orologio

  const el = (tag, attributi = {}, ...figli) => {
    const nodo = document.createElement(tag);
    Object.entries(attributi).forEach(([nome, valore]) => {
      if (valore === false || valore == null) return;
      if (nome === 'class') nodo.className = valore;
      else if (nome === 'text') nodo.textContent = valore;
      else if (nome.startsWith('on')) nodo.addEventListener(nome.slice(2), valore);
      else nodo.setAttribute(nome, valore === true ? '' : valore);
    });
    nodo.append(...figli.filter(Boolean));
    return nodo;
  };
  const svg = disegno => {
    const nodo = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    nodo.setAttribute('viewBox', '0 0 24 24');
    nodo.setAttribute('aria-hidden', 'true');
    nodo.innerHTML = disegno;   // disegni fissi del modulo, nessun testo dell'utente
    return nodo;
  };
  // icone del pulsantino: la nota musicale, doppia croma (sull'orologio) e l'orologio (sulla radio)
  const ICONA_RADIO = '<path d="M9 17.5V6.2l10-2.2v11.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 9.6l10-2.2" stroke="currentColor" stroke-width="1.6"/><ellipse cx="6.6" cy="17.6" rx="2.6" ry="2.05" transform="rotate(-18 6.6 17.6)" fill="currentColor"/><ellipse cx="16.6" cy="15.5" rx="2.6" ry="2.05" transform="rotate(-18 16.6 15.5)" fill="currentColor"/>';
  const ICONA_OROLOGIO = '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';

  // ----- Il motore: audio, stato salvato, accensione (comune alla radio grande e alla mini) -----
  function motore(negozio) {
    const chiave = `storecraft_radio_${negozio}`;
    const chiaveAcceso = `storecraft_radio_acceso_${negozio}`;
    const stato = (() => { try { return JSON.parse(localStorage.getItem(chiave)) || {}; } catch { return {}; } })();
    const m = {
      stazione: Math.min(STAZIONI.length - 1, Math.max(0, Number(stato.stazione) || 0)),
      volume: Number.isFinite(stato.volume) ? stato.volume : 60,
      faccia: stato.faccia === 'radio' ? 'radio' : 'orologio',
      acceso: false,
      audio: new Audio(),
      quandoCambia: () => {},
      // la radio era accesa in questa scheda (pagina di prima): la mini radio riparte da sola
      eraAcceso: () => { try { return sessionStorage.getItem(chiaveAcceso) === '1'; } catch { return false; } },
      salva() {
        try { localStorage.setItem(chiave, JSON.stringify({ stazione: m.stazione, volume: m.volume, faccia: m.faccia })); } catch { /* niente */ }
      },
      segnale(valore) { m.stato = valore; m.quandoCambia(); m.annuncia(); },
      // stato della radio per il resto della pagina (il banner della dashboard, dashboard.js, mette nel giro la stazione in onda)
      annuncia() {
        window.dispatchEvent(new CustomEvent('storecraft:radio', { detail: {
          acceso: m.acceso, stato: m.stato || '', stazione: STAZIONI[m.stazione].breve, nome: STAZIONI[m.stazione].nome } }));
      },
      suona() {
        m.audio.src = STAZIONI[m.stazione].url;
        m.audio.volume = m.volume / 100;
        m.segnale('sintonizzo');
        // senza un clic il browser può non lasciarla ripartire: lo si dice, un tocco la riprende
        m.audio.play().catch(errore => m.segnale(errore?.name === 'NotAllowedError' ? 'bloccata' : 'assente'));
      },
      accendi(on) {
        m.acceso = on;
        try { if (on) sessionStorage.setItem(chiaveAcceso, '1'); else sessionStorage.removeItem(chiaveAcceso); } catch { /* niente */ }
        if (on) m.suona();
        else { m.audio.pause(); m.audio.removeAttribute('src'); m.audio.load(); m.segnale(''); }
      },
      // subito = false mentre si trascina la manopola: la scala segue gli scatti, la radio si sintonizza al rilascio
      stazioneDopo(passo, subito = true) {
        m.stazione = (m.stazione + passo + STAZIONI.length) % STAZIONI.length;
        m.salva();
        if (m.acceso && subito) m.suona(); else { m.quandoCambia(); m.annuncia(); }
      },
      sintonizza() { if (m.acceso) m.suona(); },
      cambiaVolume(delta) {
        m.volume = Math.min(100, Math.max(0, m.volume + delta));
        m.audio.volume = m.volume / 100;
        m.salva();
        m.quandoCambia();
      }
    };
    m.audio.preload = 'none';
    m.audio.addEventListener('playing', () => m.segnale('in-onda'));
    m.audio.addEventListener('waiting', () => m.acceso && m.segnale('sintonizzo'));
    m.audio.addEventListener('error', () => m.acceso && m.audio.getAttribute('src') && m.segnale('assente'));
    return m;
  }

  // ----- I pezzi della radio: levetta con la spia, scala con ago e nome, manopole -----
  function pezzi(m) {
    const leva = el('button', { class: 'radio-leva', type: 'button', role: 'switch', 'aria-checked': 'false' }, el('span', { class: 'radio-leva-asta' }));
    const spia = el('span', { class: 'radio-spia', 'aria-hidden': 'true' });
    const ago = el('span', { class: 'radio-ago', 'aria-hidden': 'true' });
    const nome = el('span', { class: 'radio-nome' });
    const scala = el('div', { class: 'radio-scala' }, el('span', { class: 'radio-tacche', 'aria-hidden': 'true' }), ago, nome);
    const manopola = (classe, etichetta, min, max) => el('div', { class: `radio-manopola ${classe}`, role: 'slider', tabindex: '0', 'aria-label': etichetta,
      'aria-valuemin': String(min), 'aria-valuemax': String(max) }, el('span', { class: 'radio-manopola-segno', 'aria-hidden': 'true' }));
    const sintonia = manopola('radio-sintonia', 'Stazione', 1, STAZIONI.length);
    const regola = manopola('radio-volume', 'Volume', 0, 100);
    // la presa del volume è un poco più larga della manopola, così si prende anche cliccando accanto
    regola.append(el('span', { class: 'radio-manopola-presa', 'aria-hidden': 'true' }));
    leva.addEventListener('click', () => {
      // spenta da sola (bloccata dal browser): il clic la riprende invece di spegnerla
      if (m.acceso && m.stato === 'bloccata') m.suona(); else m.accendi(!m.acceso);
    });
    giraManopola(sintonia, (passo, trascina) => m.stazioneDopo(passo, !trascina), true, () => m.sintonizza());
    giraManopola(regola, delta => m.cambiaVolume(delta), false);
    // disegna lo stato attuale (chiamata dal motore a ogni cambio)
    const disegna = radio => {
      const s = STAZIONI[m.stazione];
      nome.textContent = m.stato === 'bloccata' ? 'tocca per riprendere' : s.breve;
      ago.style.left = `${8 + (m.stazione / (STAZIONI.length - 1)) * 84}%`;
      sintonia.style.setProperty('--giro', `${-135 + (m.stazione / (STAZIONI.length - 1)) * 270}deg`);
      sintonia.setAttribute('aria-valuenow', String(m.stazione + 1));
      sintonia.setAttribute('aria-valuetext', s.nome);
      sintonia.dataset.suggerimento = 'Cambia stazione';
      regola.style.setProperty('--giro', `${-135 + m.volume * 2.7}deg`);
      regola.setAttribute('aria-valuenow', String(Math.round(m.volume)));
      regola.setAttribute('aria-valuetext', `volume ${Math.round(m.volume)}%`);
      regola.dataset.suggerimento = `Volume ${Math.round(m.volume)}%`;
      // l'altoparlante in fondo al riquadro di aiuto: le onde crescono con il volume (radio.css, data-livello)
      regola.dataset.livello = m.volume <= 0 ? '0' : m.volume < 34 ? '1' : m.volume < 67 ? '2' : '3';
      leva.setAttribute('aria-checked', String(m.acceso));
      leva.setAttribute('aria-label', m.acceso ? 'Spegni la radio' : 'Accendi la radio');
      leva.dataset.suggerimento = m.stato === 'bloccata' ? 'Riprendi' : m.acceso ? 'Spegni' : 'Accendi';
      radio.classList.toggle('accesa', m.acceso);
      radio.dataset.segnale = m.stato || '';
    };
    return { leva, spia, scala, sintonia, regola, disegna };
  }

  // le manopole: si girano trascinando su e giù (il volume anche a destra e a sinistra), con la rotella, con le frecce;
  // la manopola delle stazioni anche con un clic; il volume con un clic a destra sale, a sinistra scende (VOLUME_CLIC)
  const VOLUME_CLIC = 10;
  // manopola delle stazioni (aScatti): tenendo premuto e trascinando, su o a destra avanti, giù o a sinistra indietro,
  // le stazioni scorrono veloci, uno scatto ogni SCATTO px; la radio si sintonizza solo al rilascio (fineTrascina)
  const SCATTO = 9;
  function giraManopola(manopola, passo, aScatti, fineTrascina = () => {}) {
    // clic o trascinamento: finché il mouse premuto si sposta meno di SOGLIA px è ancora un clic (la mano che trema non
    // gira la manopola); oltre, si trascina e il clic non conta più
    const SOGLIA = 4;
    let partenza = null, partenzaX = null, accumulo = 0, trascinata = false, mossa = 0;
    manopola.addEventListener('pointerdown', evento => {
      partenza = evento.clientY; partenzaX = evento.clientX; accumulo = 0; trascinata = false; mossa = 0;
      manopola.setPointerCapture(evento.pointerId);
    });
    manopola.addEventListener('pointermove', evento => {
      if (partenza === null) return;
      let delta = partenza - evento.clientY + evento.clientX - partenzaX;
      partenza = evento.clientY;
      partenzaX = evento.clientX;
      if (!trascinata) {
        mossa += delta;
        if (Math.abs(mossa) < SOGLIA) return;
        trascinata = true;
        delta = mossa;   // il primo tratto, trattenuto finché era un clic, conta tutto
      }
      if (aScatti) { accumulo += delta; while (Math.abs(accumulo) >= SCATTO) { passo(Math.sign(accumulo), true); accumulo -= Math.sign(accumulo) * SCATTO; } }
      else passo(delta * .6);
    });
    manopola.addEventListener('pointerup', evento => {
      if (trascinata && aScatti) fineTrascina();
      if (!trascinata) {
        if (aScatti) passo(1);
        else {
          const riquadro = manopola.getBoundingClientRect();
          passo(evento.clientX < riquadro.left + riquadro.width / 2 ? -VOLUME_CLIC : VOLUME_CLIC);
        }
      }
      partenza = null;
    });
    manopola.addEventListener('pointercancel', () => { if (trascinata && aScatti) fineTrascina(); partenza = null; });
    manopola.addEventListener('wheel', evento => { evento.preventDefault(); passo(aScatti ? -Math.sign(evento.deltaY) : -Math.sign(evento.deltaY) * 5); }, { passive: false });
    manopola.addEventListener('keydown', evento => {
      const verso = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[evento.key];
      if (!verso) return;
      evento.preventDefault();
      passo(aScatti ? verso : verso * 5);
    });
  }

  // ----- La radio della dashboard, dietro data e ora -----
  function monta(orologio, { negozio = 'luxury' } = {}) {
    const m = motore(negozio);
    const contenitore = el('div', { class: 'orologio-radio' });
    const carta = el('div', { class: 'or-carta' });
    orologio.replaceWith(contenitore);
    const fronte = el('div', { class: 'or-faccia or-fronte' }, orologio);
    const retro = el('div', { class: 'or-faccia or-retro' });
    carta.append(fronte, retro);
    const gira = el('button', { class: 'or-gira', type: 'button' });
    contenitore.append(carta, gira);

    const p = pezzi(m);
    const radio = el('div', { class: 'radio-vintage' }, el('div', { class: 'radio-accensione' }, p.leva, p.spia), p.scala, p.sintonia, p.regola);
    retro.append(radio);
    m.quandoCambia = () => p.disegna(radio);

    const larghezze = () => {
      contenitore.style.setProperty('--larghezza-fronte', `${Math.ceil(orologio.getBoundingClientRect().width)}px`);
      contenitore.style.setProperty('--larghezza-retro', `${LARGHEZZA_RADIO}px`);
    };
    new ResizeObserver(larghezze).observe(orologio);
    // Radio contratta: dopo un po' che nessuno la usa (mouse fuori, tastiera altrove) si stringe alla larghezza
    // dell'orologio, con la sola levetta e la scala, così il banner torna al centro del contenuto; il mouse sopra, o
    // la tastiera, la riaprono
    let attesa = null;
    // in uso: il mouse sopra, o la tastiera dentro (solo :focus-visible: dopo un clic il comando resta selezionato, ma
    // non vuol dire che la si stia usando, e la radio si deve contrarre lo stesso)
    const sopra = () => contenitore.matches(':hover') || Boolean(contenitore.querySelector(':focus-visible'));
    const contrai = () => {
      clearTimeout(attesa);
      attesa = setTimeout(() => {
        if (!contenitore.classList.contains('girato')) return;
        if (sopra()) contrai();   // ancora in uso: si riprova più tardi
        else {
          contenitore.classList.add('compatta');
          // ancora un po' senza usarla: la carta si rigira sull'orologio (la radio, se accesa, continua a suonare)
          attesa = setTimeout(() => {
            if (!contenitore.classList.contains('girato')) return;
            if (sopra()) contrai();
            else mostra('orologio');
          }, RITORNO);
        }
      }, INATTIVITA);
    };
    const apri = () => { clearTimeout(attesa); contenitore.classList.remove('compatta'); };
    contenitore.addEventListener('pointerenter', apri);
    contenitore.addEventListener('pointerleave', contrai);
    contenitore.addEventListener('focusin', apri);
    contenitore.addEventListener('focusout', evento => { if (!contenitore.contains(evento.relatedTarget)) contrai(); });
    const mostra = (faccia, anima = true) => {
      m.faccia = faccia;
      const girato = faccia === 'radio';
      if (girato) contrai(); else apri();
      contenitore.classList.toggle('senza-animazione', !anima);
      contenitore.classList.toggle('girato', girato);
      fronte.inert = girato;
      retro.inert = !girato;
      gira.replaceChildren(svg(girato ? ICONA_OROLOGIO : ICONA_RADIO));
      gira.setAttribute('aria-label', girato ? 'Torna a orologio' : 'Passa a radio');
      gira.dataset.suggerimento = girato ? 'Torna a orologio' : 'Passa a radio';
      m.salva();
    };
    gira.addEventListener('click', () => mostra(m.faccia === 'radio' ? 'orologio' : 'radio'));
    larghezze();
    // tornando alla dashboard con la radio accesa (dalla mini radio di un'altra pagina) riparte, girata sulla radio
    if (m.eraAcceso()) { m.faccia = 'radio'; m.accendi(true); }
    m.quandoCambia();
    mostra(m.faccia, false);
    requestAnimationFrame(() => contenitore.classList.remove('senza-animazione'));
  }

  // ----- La mini radio fluttuante, nelle altre pagine del negozio (solo se la radio era accesa) -----
  function mini({ negozio = 'luxury' } = {}) {
    if (document.querySelector('.radio-mini')) return;
    const m = motore(negozio);
    const p = pezzi(m);
    const radio = el('div', { class: 'radio-vintage radio-mini', role: 'region', 'aria-label': 'Radio' },
      el('div', { class: 'radio-accensione' }, p.leva, p.spia), p.scala, p.sintonia);
    document.body.append(radio);
    m.quandoCambia = () => { p.disegna(radio); radio.hidden = !m.acceso && !m.eraAcceso(); };
    // sopra il riquadro «Torna al Menu Principale», se la pagina lo ha
    const posto = () => {
      const torna = document.querySelector('.floating-nav-box');
      radio.style.bottom = torna && torna.getClientRects().length && getComputedStyle(torna).display !== 'none' ? `${Math.ceil(window.innerHeight - torna.getBoundingClientRect().top) + 10}px` : '';
    };
    // la pagina sistema il riquadro dopo: si ricalcola a pagina caricata, al ridimensionamento e quando il riquadro cambia
    posto();
    requestAnimationFrame(posto);
    window.addEventListener('load', posto);
    window.addEventListener('resize', posto);
    const torna = document.querySelector('.floating-nav-box');
    if (torna) new ResizeObserver(posto).observe(torna);
    m.accendi(true);
    // spenta dalla levetta la mini radio sparisce dopo un attimo (riaccenderla si fa dalla dashboard)
    p.leva.addEventListener('click', () => { if (!m.acceso) setTimeout(() => { if (!m.acceso) radio.remove(); }, 900); });
  }

  window.Radio = Object.freeze({ monta, mini, STAZIONI });

  // caricata da negozi.js in una pagina che non è la dashboard (lì c'è la radio grande): la mini radio
  const script = document.currentScript;
  if (script?.dataset.mini !== undefined) {
    const parti = () => { if (!window.Dashboard) mini({ negozio: script.dataset.mini || 'luxury' }); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', parti); else parti();
  }
})();
