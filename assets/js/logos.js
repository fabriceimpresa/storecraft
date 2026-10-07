// assets/js/logos.js
// Codice comune dei menu BRAND. L'elenco dei loghi ufficiali (LOGO_FILES) e i brand prioritari (PRIORITY_BRANDS)
// sono del negozio, in assets/logos/<negozio>/elenco.js, da caricare prima di questo file.

// Cartella dei loghi del negozio della pagina (<html data-negozio="…">), ricavata dalla posizione di questo file:
// vale sia per la dashboard nella radice sia per le pagine nelle cartelle dei negozi.
const LOGO_ASSET_PATH = new URL(`../logos/${document.documentElement.dataset.negozio}/`, document.currentScript.src).href;
const LOGO_ASSET_VERSION = "20261005-4";

function getLogoSource(fileName) {
  return fileName ? `${LOGO_ASSET_PATH}${fileName}?v=${LOGO_ASSET_VERSION}` : '';
}

/**
 * Restituisce l'elenco LOGO_FILES riordinato secondo la regola generale:
 * prima i PRIORITY_BRANDS (in ordine alfabetico tra loro), poi tutti gli altri
 * in ordine alfabetico invariato. Va usata da qualsiasi pagina che popola un
 * menu a cascata brand, per garantire lo stesso comportamento ovunque.
 */
function getSortedLogoFiles() {
  const priorityFiles = PRIORITY_BRANDS.filter(f => LOGO_FILES.includes(f));
  const remainingFiles = LOGO_FILES.filter(f => !PRIORITY_BRANDS.includes(f));
  return { priorityFiles, remainingFiles };
}

/**
 * Restituisce LOGO_FILES come singolo array già riordinato secondo la regola generale
 * (brand prioritari stagionali per primi, poi il resto in ordine alfabetico).
 */
function getOrderedLogoFiles() {
  const { priorityFiles, remainingFiles } = getSortedLogoFiles();
  return priorityFiles.concat(remainingFiles);
}

/**
 * Crea e appende un'opzione <option> a un elemento <select> per un menu brand,
 * evidenziando i brand prioritari (stagionali) con una stella e uno stile dedicato
 * (classe CSS "priority-brand-option"). Restituisce l'elemento creato.
 */
function appendBrandOption(selectEl, fileName, displayName, isPriority) {
  const option = document.createElement('option');
  option.value = fileName;
  option.textContent = displayName;
  if (isPriority && document.documentElement.dataset.negozio !== 'luxury') {
    // TEBE e OPHILYA: i brand della casa in maiuscolo con ⭐, come nel progetto TEBE
    option.textContent = `⭐ ${displayName.toUpperCase()}`;
    option.className = 'priority-brand-option';
  } else if (isPriority) {
    // brand prioritari: la stella ★ dei loghi personalizzati, ma gialla (.brand-star, colore in pannello.css)
    const star = document.createElement('span');
    star.className = 'brand-star';
    star.textContent = '★ ';
    option.prepend(star);
    option.className = 'priority-brand-option';
  }
  selectEl.appendChild(option);
  return option;
}