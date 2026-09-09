(() => {
  const printableLogos = new WeakMap();

  function createWhiteLogo(source) {
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
            pixels.data[pixel] = 255;
            pixels.data[pixel + 1] = 255;
            pixels.data[pixel + 2] = 255;
          }
        }
        context.putImageData(pixels, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };

      sourceImage.onerror = () => reject(new Error('Logo non disponibile.'));
      sourceImage.src = source;
    });
  }

  function prepareLogo(logoImage) {
    const source = logoImage.currentSrc || logoImage.src;
    const record = printableLogos.get(logoImage);
    if (!source || record?.convertedSource === source || (record?.source === source && record.pending)) {
      return;
    }

    logoImage.style.filter = '';
    const nextRecord = { source, pending: true };
    printableLogos.set(logoImage, nextRecord);
    createWhiteLogo(source)
      .then(printableSource => {
        if (printableLogos.get(logoImage) === nextRecord) {
          nextRecord.pending = false;
          nextRecord.convertedSource = printableSource;
          logoImage.src = printableSource;
          logoImage.style.filter = 'none';
        }
      })
      .catch(() => {
        if (printableLogos.get(logoImage) === nextRecord) {
          printableLogos.delete(logoImage);
        }
      });
  }

  function prepareAllLogos() {
    document.querySelectorAll('[id^="cardLogo"]').forEach(prepareLogo);
  }

  document.addEventListener('DOMContentLoaded', () => {
    prepareAllLogos();
    new MutationObserver(prepareAllLogos).observe(document.body, {
      attributes: true,
      attributeFilter: ['src'],
      childList: true,
      subtree: true
    });
  });
})();
