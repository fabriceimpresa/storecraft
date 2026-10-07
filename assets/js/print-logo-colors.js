/**
 * Risolve i loghi brand (ufficiali e personalizzati) verso una versione già
 * colorata "in memoria", eliminando la dipendenza dai filtri CSS che Safari
 * (e talvolta Chrome) non applicano correttamente in fase di stampa.
 *
 * - Loghi ufficiali (assets/logos/<negozio>/NOME.png): esiste un file gemello
 *   pre-colorato in assets/img/<negozio>/printlogos/<colore><NOME>.png (es. "white",
 *   "black", "red", "gold"), generato una tantum per ogni brand.
 * - Loghi personalizzati (data URL, loghi-personalizzati.js): non esistono
 *   su disco, quindi vengono ricolorati al volo via canvas la prima volta che
 *   servono e la versione risultante viene tenuta in cache in memoria.
 */
(() => {
  // Cartelle del negozio della pagina (<html data-negozio="…">), ricavate dalla posizione di questo file.
  const NEGOZIO = document.documentElement.dataset.negozio;
  const PRINT_LOGOS_PATH = new URL(`../img/${NEGOZIO}/printlogos/`, document.currentScript.src).href;
  const LOGOS_PATH = new URL(`../logos/${NEGOZIO}/`, document.currentScript.src).href;
  const LOGO_ASSET_VERSION = '20261005-4';
  let customLogoCache = new Map(); // chiave: `${sourceData}|${colorKey}`

  function getOfficialPrintLogoPath(logoFileName, color) {
    return `${PRINT_LOGOS_PATH}${color}${getGeneratedLogoFileName(logoFileName)}?v=${LOGO_ASSET_VERSION}`;
  }

  // Se un logo personalizzato viene rinominato/eliminato (in questa o in un'altra
  // scheda, es. genera_loghi.html), invalidiamo la cache in memoria: eviterà di
  // riutilizzare per errore una versione colorata "orfana" del vecchio logo.
  // L'evento lo manda loghi-personalizzati.js.
  window.addEventListener('loghipersonalizzati', () => {
    customLogoCache = new Map();
  });

  // Permette anche l'invalidazione esplicita.
  function invalidateCustomLogoCache() {
    customLogoCache = new Map();
  }

  function colorizeDataUrl(sourceDataUrl, red, green, blue) {
    return new Promise((resolve, reject) => {
      const sourceImage = new Image();
      sourceImage.onload = () => {
        // Come in TEBE: un errore del canvas (es. immagine non leggibile) rifiuta la Promise invece di restare sospeso.
        try {
          const canvas = document.createElement('canvas');
          canvas.width = sourceImage.naturalWidth;
          canvas.height = sourceImage.naturalHeight;
          const context = canvas.getContext('2d');
          if (!context) {
            reject(new Error('Canvas non disponibile.'));
            return;
          }
          context.drawImage(sourceImage, 0, 0);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
          for (let pixel = 0; pixel < pixels.data.length; pixel += 4) {
            if (pixels.data[pixel + 3] > 0) {
              pixels.data[pixel] = red;
              pixels.data[pixel + 1] = green;
              pixels.data[pixel + 2] = blue;
            }
          }
          context.putImageData(pixels, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch (error) {
          reject(error);
        }
      };
      sourceImage.onerror = () => reject(new Error('Logo personalizzato non disponibile.'));
      sourceImage.src = sourceDataUrl;
    });
  }

  // L'oro è quello del negozio: Luxury Outlet #b48b37, TEBE e OPHILYA #cc9e25 (come la variante gold dei loghi ufficiali).
  const COLOR_RGB = {
    white: [255, 255, 255],
    black: [0, 0, 0],
    red: [224, 0, 0],
    gold: NEGOZIO === 'luxury' ? [180, 139, 55] : [204, 158, 37]
  };

  function getGeneratedLogoFileName(logoFileName) {
    return logoFileName.replace(/\.[^.]+$/, '.png');
  }

  // Converte una stringa colore in [r,g,b]. Supporta i nomi predefiniti
  // (white/black/red/gold, che hanno anche i file pre-generati) e qualunque
  // colore esadecimale arbitrario (es. "#c94b13"), usato ad esempio dalle
  // tinte per fascia di prezzo di promo_multibrand.html.
  function parseColorToRgb(color) {
    if (COLOR_RGB[color]) {
      return COLOR_RGB[color];
    }
    const hexMatch = /^#?([0-9a-f]{6})$/i.exec(color || '');
    if (hexMatch) {
      const hex = hexMatch[1];
      return [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16)
      ];
    }
    return COLOR_RGB.white;
  }

  /**
   * Restituisce l'URL/base64 pronto all'uso per il colore richiesto.
   * - Se `source` è un percorso che punta a assets/logos/<negozio>/ e il colore è uno
   *   dei 4 nomi predefiniti, restituisce subito (sincrono) il percorso del
   *   file pre-colorato gemello.
   * - In tutti gli altri casi (colore esadecimale arbitrario, oppure logo
   *   personalizzato in data URL) colorizza al volo via canvas e mette in
   *   cache il risultato in memoria.
   */
  function resolvePrintLogoSource(source, color) {
    if (!source) {
      return Promise.resolve(source);
    }

    const officialMatch = source.match(/assets\/logos\/[^/?#]+\/([^/?#]+)(?:[?#].*)?$/);
    if (officialMatch && COLOR_RGB[color]) {
      return Promise.resolve(getOfficialPrintLogoPath(officialMatch[1], color));
    }

    if (officialMatch || source.startsWith('data:')) {
      const cacheKey = source + '|' + color;
      if (customLogoCache.has(cacheKey)) {
        return Promise.resolve(customLogoCache.get(cacheKey));
      }
      const rgb = parseColorToRgb(color);
      return colorizeDataUrl(source, rgb[0], rgb[1], rgb[2]).then(result => {
        customLogoCache.set(cacheKey, result);
        return result;
      });
    }

    // Sorgente non riconosciuta (es. placeholder vuoto): restituiamo invariata.
    return Promise.resolve(source);
  }

  /**
   * Come setBrandLogoSrc ma restituisce una Promise con la source risolta,
   * utile quando il markup dell'immagine viene costruito via innerHTML
   * invece di impostare .src su un <img> già presente nel DOM.
   */
  function getBrandLogoSrc(customValue, officialFileName, defaultFileName, color) {
    const fileName = officialFileName || defaultFileName;
    const source = customValue || (fileName
      ? (typeof getLogoSource === 'function' ? getLogoSource(fileName) : LOGOS_PATH + fileName)
      : '');
    return resolvePrintLogoSource(source, color);
  }

  // Attende che le immagini scelte (selettore CSS) abbiano finito di caricare, così la stampa
  // (o la foto per la lista di stampa) non parte con un logo ancora a metà o mancante.
  function waitForImagesToLoad(images) {
    return Promise.all(Array.from(images).map(image => {
      if (!image.getAttribute('src')) {
        return undefined;
      }
      if (image.complete && image.naturalWidth > 0) {
        return typeof image.decode === 'function' ? image.decode().catch(() => {}) : undefined;
      }
      return new Promise((resolve, reject) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', () => reject(new Error(`Impossibile caricare il logo ${image.alt || ''}.`)), { once: true });
      });
    }));
  }

  // Attende sia i font locali sia i loghi (selettore CSS) prima di stampare.
  function prepareForPrint(selector = '[class*="logo"]') {
    const fontsReady = document.fonts?.ready || Promise.resolve();
    return Promise.all([fontsReady, waitForImagesToLoad(document.querySelectorAll(selector))]).then(() => undefined);
  }

  /**
   * Imposta il logo (ufficiale o personalizzato) di un <img id="imgId">
   * usando direttamente la versione già colorata, così sia a schermo sia in
   * stampa (qualsiasi browser) il colore è sempre corretto senza filtri CSS.
   *
   * @param {string} imgId - id dell'elemento <img>.
   * @param {string} customValue - data URL del logo personalizzato (o vuoto).
   * @param {string} officialFileName - nome file in assets/logos/<negozio>/ (o vuoto).
   * @param {string} defaultFileName - nome file di fallback in assets/logos/<negozio>/.
   * @param {'white'|'black'|'red'|'gold'} color - colore richiesto dalla pagina.
   */
  function setBrandLogoSrc(imgId, customValue, officialFileName, defaultFileName, color) {
    const imgElement = document.getElementById(imgId);
    if (!imgElement) {
      return;
    }
    getBrandLogoSrc(customValue, officialFileName, defaultFileName, color).then(resolvedSource => {
      if (resolvedSource) {
        imgElement.src = resolvedSource;
      }
    });
  }

  window.PrintLogoColors = {
    resolve: resolvePrintLogoSource,
    getOfficialPrintLogoPath,
    setBrandLogoSrc,
    getBrandLogoSrc,
    prepareForPrint,
    invalidateCustomLogoCache
  };
})();
