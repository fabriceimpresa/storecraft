/*
 * Cursore a triangolo rosso delle pagine cartelli e cartellini (stili in assets/css/cursore.css).
 * Indica sul foglio l'elemento legato al campo del pannello con cui l'utente sta interagendo:
 * - di preferenza sta SOPRA l'elemento, con la punta in giù;
 * - se lì coprirebbe un altro elemento (o uscirebbe dal cartello), si mette DI LATO,
 *   prima a sinistra con la punta verso destra, poi a destra con la punta verso sinistra;
 * - se nessuna posizione è libera, sceglie quella che copre meno.
 *
 * Uso:
 *   const cursore = Cursore.create({
 *     panel: 'aside',                 // dove ascoltare le interazioni con i campi
 *     watch: '#printSheet',           // foglio da osservare: quando cambia, il cursore si riposiziona
 *     clip: 'main',                   // facoltativo: area visibile, fuori da lì il cursore si nasconde
 *     scope: '#cardTop',              // facoltativo: il cursore deve restare dentro questo riquadro
 *     obstacles: '#cardTop .titolo, …',  // elementi da non coprire
 *     rules: [{ controls: '#campo1, #campo2', target: '#elemento' }, …],
 *     sideGap: 9                      // facoltativo: distanza in px della punta quando il cursore sta di lato
 *   });
 *   cursore.point({ target, scope, obstacles, placement: 'above', gap });  // puntamento da codice
 * placement: 'above' = sempre sopra; 'side' = solo di lato (prima sinistra, poi destra); 'left' / 'right' = sempre da quel lato.
 * Ogni regola (e point) accetta anche gap: distanza in px della punta quando il cursore sta sopra; può essere una
 * funzione che riceve l'elemento indicato e restituisce la distanza (es. per portare la punta fuori dal cartello).
 * target, scope e obstacles possono essere selettori, elementi o funzioni che li restituiscono.
 * Se target restituisce più elementi compare un triangolo per ciascuno (modifiche su più colonne);
 * i triangoli in più partono da dove era il primo e si spostano ognuno sul proprio elemento;
 * in quel caso scope e obstacles, se sono funzioni, ricevono l'elemento indicato.
 */
(function () {
  const GAP = 96 / 25.4;      // 1 mm tra la punta e l'elemento (sopra)
  const SIDE_GAP = GAP + 10;  // di lato più spazio libero (le pagine possono cambiarlo con sideGap)
  const LONG = 36;            // lato lungo del triangolo
  const SHORT = 24;           // altezza del triangolo
  const CLEAR = 3;            // distanza minima dagli altri elementi

  function resolveOne(value, arg) {
    if (typeof value === 'function') value = value(arg);
    if (value && typeof value !== 'string' && !(value instanceof Element) && value.length !== undefined) value = value[0];
    if (typeof value === 'string') return document.querySelector(value);
    return value || null;
  }

  function resolveMany(value, arg) {
    if (typeof value === 'function') value = value(arg);
    if (!value) return [];
    if (typeof value === 'string') return [...document.querySelectorAll(value)];
    if (value instanceof Element) return [value];
    return [...value];
  }

  // Visibile davvero: né l'elemento né i suoi contenitori sono trasparenti, nascosti o chiusi
  // (es. la scritta SALE dentro un contenitore con opacità 0 e altezza 0).
  function isShown(node) {
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0.5 || rect.height <= 0.5) return false;
    for (let el = node; el && el !== document.body; el = el.parentElement) {
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none' || parseFloat(style.opacity) < 0.05) return false;
      if (el !== node && style.overflow !== 'visible') {
        const box = el.getBoundingClientRect();
        if (box.width <= 0.5 || box.height <= 0.5) return false;
      }
    }
    return true;
  }

  // Riquadro dell'inchiostro: per i testi quello delle righe di testo, non del blocco intero.
  // Gli elementi che contengono altri blocchi (un cartellino intero) o con un bordo usano il loro riquadro.
  const INLINE_TAGS = ['SPAN', 'B', 'STRONG', 'I', 'EM', 'BR', 'SUP', 'SUB'];
  // tight: stringe il riquadro sull'inchiostro dei caratteri (serve per centrare il cursore sull'elemento indicato)
  function inkRect(node, tight = false) {
    if (!node || !isShown(node)) return null;
    // gli elementi posizionati in assoluto (es. la bandierina sopra "MADE IN ITALY") non contano
    const floating = [...node.children].filter(child => getComputedStyle(child).position === 'absolute');
    const onlyText = [...node.children].every(child => INLINE_TAGS.includes(child.tagName) || floating.includes(child));
    // un testo dentro un riquadro con il bordo (es. le caselle delle taglie) conta come riquadro
    const style = getComputedStyle(node);
    const boxed = parseFloat(style.borderTopWidth) > 0 && style.borderTopStyle !== 'none';
    if (node.tagName !== 'IMG' && !boxed && onlyText && node.textContent.trim()) {
      const range = document.createRange();
      range.selectNodeContents(node);
      if (floating.length) {
        // riquadro delle sole righe di testo, senza gli elementi in assoluto
        const rects = [...range.getClientRects()].filter(r => r.width > 0.5 && r.height > 0.5
          && !floating.some(f => { const b = f.getBoundingClientRect(); return r.left >= b.left - 0.5 && r.right <= b.right + 0.5 && r.top >= b.top - 0.5 && r.bottom <= b.bottom + 0.5; }));
        if (rects.length) {
          return {
            left: Math.min(...rects.map(r => r.left)), right: Math.max(...rects.map(r => r.right)),
            top: Math.min(...rects.map(r => r.top)), bottom: Math.max(...rects.map(r => r.bottom))
          };
        }
      }
      const rect = range.getBoundingClientRect();
      if (rect.width > 0.5 && rect.height > 0.5) return tight ? glyphBounds(node, rect, range) : rect;
    }
    return node.getBoundingClientRect();
  }

  // La riga di testo comprende lo spazio sotto la linea di base e sopra le maiuscole: per centrare
  // il cursore sul testo (es. le cifre di un prezzo) si stringe il riquadro in verticale sul corpo
  // delle maiuscole, con le misure del carattere. Le proporzioni valgono anche con lo zoom del telefono.
  const measure = document.createElement('canvas').getContext('2d');
  function glyphBounds(node, rect, range) {
    // testo su più righe: si tiene il riquadro delle righe
    const lineTops = new Set([...range.getClientRects()].map(r => Math.round(r.top)));
    if (lineTops.size > 1) return rect;
    const style = getComputedStyle(node);
    measure.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    // Corpo delle maiuscole (dalla linea di base all'altezza della H): le lettere che scendono sotto
    // la riga (p, g, la virgola dei prezzi) non spostano il centro.
    const m = measure.measureText('H');
    const fontHeight = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
    if (!fontHeight || !m.actualBoundingBoxAscent) return rect;
    const k = rect.height / fontHeight;
    const baseline = rect.top + m.fontBoundingBoxAscent * k;
    return {
      left: rect.left,
      right: rect.right,
      top: baseline - m.actualBoundingBoxAscent * k,
      bottom: baseline
    };
  }

  const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const inside = (a, s) => a.left >= s.left - 0.5 && a.right <= s.right + 0.5 && a.top >= s.top - 0.5 && a.bottom <= s.bottom + 0.5;

  function create(config) {
    // Un triangolo per ogni elemento indicato: di norma uno, più di uno quando un campo
    // modifica più elementi insieme (il target restituisce un elenco).
    const markers = [];
    function markerAt(index) {
      while (markers.length <= index) {
        const marker = document.createElement('div');
        marker.className = 'cursore';
        marker.setAttribute('aria-hidden', 'true');
        document.body.appendChild(marker);
        markers.push(marker);
      }
      return markers[index];
    }
    markerAt(0);

    let request = null;
    let frame = 0;

    const sideGap = config.sideGap ?? SIDE_GAP;

    // t: riquadro delle righe (per la posizione sopra); g: inchiostro dei caratteri (per centrare di lato)
    function candidates(t, g, aboveGap = GAP) {
      const cx = (t.left + t.right) / 2;
      const cy = (g.top + g.bottom) / 2;
      return {
        above: { side: 'down', left: cx - LONG / 2, top: t.top - aboveGap - SHORT, width: LONG, height: SHORT },
        left: { side: 'right', left: t.left - sideGap - SHORT, top: cy - LONG / 2, width: SHORT, height: LONG },
        right: { side: 'left', left: t.right + sideGap, top: cy - LONG / 2, width: SHORT, height: LONG }
      };
    }

    // Posizione del triangolo per un elemento; scope e obstacles, se sono funzioni, ricevono l'elemento.
    function placementFor(target, clipRect) {
      const rect = inkRect(target);
      if (!rect || (clipRect && !intersects(rect, clipRect))) return null;
      const glyphs = inkRect(target, true);
      const gap = typeof request.gap === 'function' ? request.gap(target) : request.gap;
      const options = candidates(rect, glyphs, gap);
      if (request.placement === 'above') return options.above;
      if (request.placement === 'left' || request.placement === 'right') return options[request.placement];

      const scope = resolveOne(request.scope, target);
      const scopeRect = scope && scope.getBoundingClientRect();
      const obstacles = resolveMany(request.obstacles, target)
        .filter(node => node !== target && !node.contains(target) && !target.contains(node))
        .map(node => inkRect(node))
        .filter(Boolean)
        .map(o => ({ left: o.left - CLEAR, top: o.top - CLEAR, right: o.right + CLEAR, bottom: o.bottom + CLEAR }));
      const toRect = box => ({ left: box.left, top: box.top, right: box.left + box.width, bottom: box.top + box.height });
      const overlap = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      // quanto copre una posizione: area sovrapposta agli altri elementi, più una penalità se esce dal riquadro
      const cost = box => {
        const r = toRect(box);
        const covered = obstacles.reduce((sum, o) => sum + overlap(r, o), 0);
        const outside = scopeRect && !inside(r, scopeRect) ? box.width * box.height : 0;
        return covered + outside;
      };
      // placement 'side': solo di lato (es. le righe di Multi Articolo, indicate sempre accanto al testo)
      const order = request.placement === 'side' ? [options.left, options.right] : [options.above, options.left, options.right];
      // la prima posizione libera nell'ordine sopra, sinistra, destra; se nessuna è libera, quella che copre meno
      return order.find(box => cost(box) === 0) || order.reduce((best, box) => (cost(box) < cost(best) ? box : best));
    }

    function update(animate) {
      frame = 0;
      const targets = request ? resolveMany(request.target) : [];
      const clip = resolveOne(config.clip);
      const clipRect = clip && clip.getBoundingClientRect();
      // Quando il cursore si sdoppia o si moltiplica, i triangoli nuovi partono da dove era
      // il primo e raggiungono ciascuno il proprio elemento, invece di comparire già al loro posto.
      const first = markers[0];
      const origin = animate && first.classList.contains('is-visible')
        ? { left: first.style.left, top: first.style.top, side: ['down', 'right', 'left'].find(s => first.classList.contains(`cursore--${s}`)) }
        : null;
      let shown = 0;
      targets.forEach(target => {
        const chosen = placementFor(target, clipRect);
        if (!chosen) return;
        const marker = markerAt(shown++);
        const wasVisible = marker.classList.contains('is-visible');
        if (!wasVisible && origin) {
          marker.classList.add('is-instant', 'is-visible');
          marker.classList.remove('cursore--down', 'cursore--right', 'cursore--left');
          if (origin.side) marker.classList.add(`cursore--${origin.side}`);
          marker.style.left = origin.left;
          marker.style.top = origin.top;
          marker.getBoundingClientRect(); // fissa la partenza prima di avviare il movimento
          marker.classList.remove('is-instant');
        } else {
          marker.classList.toggle('is-instant', !animate || !wasVisible);
        }
        marker.classList.remove('cursore--down', 'cursore--right', 'cursore--left');
        marker.classList.add(`cursore--${chosen.side}`);
        marker.style.left = `${chosen.left}px`;
        marker.style.top = `${chosen.top}px`;
        marker.classList.add('is-visible');
      });
      markers.slice(shown).forEach(marker => marker.classList.remove('is-visible'));
    }

    function schedule(animate = true) {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => update(animate));
    }

    function point(next) {
      request = { scope: config.scope, obstacles: config.obstacles, ...next };
      schedule(true);
    }

    // Si usa il percorso dell'evento (registrato al momento del clic) e non closest():
    // alcune pagine ricostruiscono i pulsanti appena cliccati (es. i selettori riga di Multi Articolo),
    // che quindi non sono più nella pagina quando l'evento arriva al pannello.
    function ruleFor(event) {
      const path = event.composedPath().filter(node => node instanceof Element);
      for (const node of path) {
        const rule = (config.rules || []).find(candidate => node.matches(candidate.controls));
        if (rule) return rule;
      }
      return null;
    }

    const panel = resolveOne(config.panel);
    if (panel) {
      ['focusin', 'input', 'change', 'click'].forEach(type => {
        panel.addEventListener(type, event => {
          const rule = ruleFor(event);
          if (rule) point({ target: rule.target, placement: rule.placement, gap: rule.gap, scope: rule.scope ?? config.scope, obstacles: rule.obstacles ?? config.obstacles });
        });
      });
    }

    // Il foglio cambia (testi, modalità, cartellini ridisegnati): il cursore segue l'elemento.
    const watched = resolveOne(config.watch);
    if (watched) {
      new MutationObserver(() => schedule(true)).observe(watched, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'style'] });
      // un'immagine appena caricata (es. un logo) cambia misure senza modificare la pagina
      watched.addEventListener('load', () => schedule(true), true);
    }
    document.addEventListener('transitionend', event => {
      if (!markers.includes(event.target)) schedule(true);
    }, true);
    window.addEventListener('scroll', () => schedule(false), true);
    window.addEventListener('resize', () => schedule(false));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => schedule(false));

    return { point, refresh: () => schedule(true), hide: () => { request = null; markers.forEach(m => m.classList.remove('is-visible')); } };
  }

  window.Cursore = { create };
})();
