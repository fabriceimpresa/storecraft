/**
 * Risolve i loghi brand (ufficiali e personalizzati) verso una versione già
 * colorata "in memoria", eliminando la dipendenza dai filtri CSS che Safari
 * (e talvolta Chrome) non applicano correttamente in fase di stampa.
 *
 * - Loghi ufficiali (assets/logos/NOME.png): esiste un file gemello
 *   pre-colorato in assets/img/printlogos/<colore><NOME>.png (es. "white",
 *   "black", "red", "gold"), generato una tantum per ogni brand.
 * - Loghi personalizzati (salvati come base64 in localStorage): non esistono
 *   su disco, quindi vengono ricolorati al volo via canvas la prima volta che
 *   servono e la versione risultante viene tenuta in cache in memoria.
 */
(() => {
  const PRINT_LOGOS_PATH = 'assets/img/printlogos/';
  const CUSTOM_LOGOS_STORAGE_KEY = 'custom_brand_logos';
  let customLogoCache = new Map(); // chiave: `${sourceData}|${colorKey}`

  function getOfficialPrintLogoPath(logoFileName, color) {
    return PRINT_LOGOS_PATH + color + logoFileName;
  }

  // Se un logo personalizzato viene rinominato/eliminato in un'altra scheda
  // (es. genera_loghi.html), invalidiamo la cache in memoria: eviterà di
  // riutilizzare per errore una versione colorata "orfana" del vecchio logo.
  window.addEventListener('storage', event => {
    if (event.key === CUSTOM_LOGOS_STORAGE_KEY) {
      customLogoCache = new Map();
    }
  });

  // Permette anche l'invalidazione esplicita nella stessa scheda (lo storage
  // event non scatta sulla scheda che ha effettuato la modifica).
  function invalidateCustomLogoCache() {
    customLogoCache = new Map();
  }

  function colorizeDataUrl(sourceDataUrl, red, green, blue) {
    return new Promise((resolve, reject) => {
      const sourceImage = new Image();
      sourceImage.onload = () => {
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
      };
      sourceImage.onerror = () => reject(new Error('Logo personalizzato non disponibile.'));
      sourceImage.src = sourceDataUrl;
    });
  }

  const COLOR_RGB = {
    white: [255, 255, 255],
    black: [0, 0, 0],
    red: [224, 0, 0],
    gold: [180, 139, 55]
  };

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
   * - Se `source` è un percorso che punta a assets/logos/ e il colore è uno
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

    const officialMatch = source.match(/assets\/logos\/([^/?#]+)$/);
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
    const source = customValue || (fileName ? 'assets/logos/' + fileName : '');
    return resolvePrintLogoSource(source, color);
  }

  /**
   * Imposta il logo (ufficiale o personalizzato) di un <img id="imgId">
   * usando direttamente la versione già colorata, così sia a schermo sia in
   * stampa (qualsiasi browser) il colore è sempre corretto senza filtri CSS.
   *
   * @param {string} imgId - id dell'elemento <img>.
   * @param {string} customValue - data URL del logo personalizzato (o vuoto).
   * @param {string} officialFileName - nome file in assets/logos/ (o vuoto).
   * @param {string} defaultFileName - nome file di fallback in assets/logos/.
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
    invalidateCustomLogoCache
  };
})();
