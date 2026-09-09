(() => {
  const printableLogos = new WeakMap();

  function createColorLogo(source, red, green, blue) {
    return new Promise((resolve, reject) => {
      const sourceImage = new Image();

      sourceImage.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          reject(new Error('Canvas non disponibile.'));
          return;
        }

        canvas.width = sourceImage.naturalWidth;
        canvas.height = sourceImage.naturalHeight;
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

      sourceImage.onerror = () => reject(new Error('Logo non disponibile.'));
      sourceImage.src = source;
    });
  }

  function createLoadedColorLogo(logoImage, red, green, blue) {
    if (!logoImage.complete || !logoImage.naturalWidth) {
      return null;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      return null;
    }

    canvas.width = logoImage.naturalWidth;
    canvas.height = logoImage.naturalHeight;
    context.drawImage(logoImage, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let pixel = 0; pixel < pixels.data.length; pixel += 4) {
      if (pixels.data[pixel + 3] > 0) {
        pixels.data[pixel] = red;
        pixels.data[pixel + 1] = green;
        pixels.data[pixel + 2] = blue;
      }
    }
    context.putImageData(pixels, 0, 0);
    return canvas.toDataURL('image/png');
  }

  function prepareLogo(logoImage, color) {
    if (!logoImage.getAttribute('src')) {
      return Promise.resolve();
    }
    const source = logoImage.currentSrc || logoImage.src;
    const record = printableLogos.get(logoImage);
    const colorKey = color.join(',');
    if (!source || (record?.colorKey === colorKey && (record?.convertedSource === source || (record.source === source && record.pending)))) {
      return record?.pending || Promise.resolve();
    }

    logoImage.style.filter = '';
    const loadedSource = createLoadedColorLogo(logoImage, ...color);
    if (loadedSource) {
      logoImage.src = loadedSource;
      logoImage.style.filter = 'none';
      printableLogos.set(logoImage, {
        source: loadedSource,
        convertedSource: loadedSource,
        colorKey
      });
      return Promise.resolve();
    }

    let resolvePending;
    let rejectPending;
    const pending = new Promise((resolve, reject) => {
      resolvePending = resolve;
      rejectPending = reject;
    });
    const nextRecord = { source, colorKey, pending };
    printableLogos.set(logoImage, nextRecord);
    createColorLogo(source, ...color)
      .then(printableSource => {
        if (printableLogos.get(logoImage) === nextRecord) {
          nextRecord.convertedSource = printableSource;
          nextRecord.source = printableSource;
          logoImage.src = printableSource;
          logoImage.style.filter = 'none';
          resolvePending();
        }
      })
      .catch(error => {
        if (printableLogos.get(logoImage) === nextRecord) {
          printableLogos.delete(logoImage);
        }
        rejectPending(error);
      });
    return pending;
  }

  function prepareAllLogos() {
    // Il logo .luxuryLogo (assets/img/footer.png) è già colorato in rosso nel file
    // sorgente, quindi non necessita più di conversione via canvas per la stampa.
    return Promise.all(
      Array.from(document.querySelectorAll('[id^="cardLogo"]'), logoImage => prepareLogo(logoImage, [255, 255, 255]))
    );
  }

  window.preparePrintLogos = prepareAllLogos;

  document.addEventListener('DOMContentLoaded', () => {
    prepareAllLogos().catch(error => console.error('Preparazione loghi per la stampa fallita.', error));
    new MutationObserver(() => {
      prepareAllLogos().catch(error => console.error('Preparazione loghi per la stampa fallita.', error));
    }).observe(document.body, {
      attributes: true,
      attributeFilter: ['src'],
      childList: true,
      subtree: true
    });
  });
})();
