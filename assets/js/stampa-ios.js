/* Stampa da iPhone e iPad (Safari e Chrome, stesso motore WebKit).
   iOS non rispetta i margini 0 di @page: lascia un suo margine (Safari ci scrive indirizzo, data e numero di
   pagina) e rimpicciolisce il foglio solo per farlo entrare in larghezza. In altezza gli ultimi mm del foglio
   finiscono su una seconda pagina bianca. Solo su iOS e solo in stampa, la pagina resta larga quanto il foglio
   e il foglio, centrato, è ridotto quanto basta per entrare anche in altezza. Desktop e Android non cambiano.
   Misure prese con prova-stampa.html (ottobre 2026), area utile più piccola tra Safari e Chrome:
   carta verticale circa 182 × 250 mm, carta orizzontale circa 270 × 178 mm. */
(() => {
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!ios) return;
  const sheet = document.querySelector('#printSheet, #a4Sheet, #printable-grid');
  if (!sheet) return;

  // Rapporto altezza / larghezza dell'area utile di iOS, con un poco di margine sulle misure.
  const PORTRAIT_RATIO = 1.33;
  const LANDSCAPE_RATIO = 0.64;
  // Cartellini su A4 orizzontale; tutti gli altri fogli su A4 verticale.
  const landscape = sheet.classList.contains('a4-landscape');
  const MM = 25.4 / 96;

  sheet.setAttribute('data-stampa-ios', '');
  document.documentElement.classList.add('stampa-ios');
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      html.stampa-ios, html.stampa-ios body {
        width: var(--stampa-ios-larghezza) !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
      }
      html.stampa-ios body { display: block !important; }
      html.stampa-ios [data-stampa-ios] {
        zoom: var(--stampa-ios-zoom) !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
    }`;
  document.head.append(style);

  // Misure del foglio in mm (valori CSS, senza lo zoom dell'anteprima del telefono) e riduzione necessaria.
  function measure() {
    const computed = getComputedStyle(sheet);
    const width = parseFloat(computed.width) * MM;
    const height = parseFloat(computed.height) * MM;
    if (!width || !height) return;
    const ratio = landscape ? LANDSCAPE_RATIO : PORTRAIT_RATIO;
    const zoom = Math.min(1, ratio * width / height);
    const root = document.documentElement.style;
    root.setProperty('--stampa-ios-larghezza', `${width.toFixed(2)}mm`);
    root.setProperty('--stampa-ios-zoom', zoom.toFixed(3));
  }

  // Il foglio può cambiare (es. Magazzino con 1 CARTELLO): si rimisura prima di ogni stampa.
  const print = window.print.bind(window);
  window.print = () => {
    measure();
    print();
  };
  window.addEventListener('beforeprint', measure);
  measure();
})();
