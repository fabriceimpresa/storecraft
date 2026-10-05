(() => {
  const STORAGE_KEY = 'custom_brand_logos';

  function readCustomLogos() {
    try {
      const logos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(logos)
        ? logos.filter(logo => logo && logo.name && logo.data)
        : [];
    } catch (error) {
      console.error('Lettura dei loghi personalizzati fallita.', error);
      return [];
    }
  }

  function addOption(select, value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    select.append(option);
  }

  function populate(placeholder) {
    const brandSelectId = placeholder.dataset.brandSelectId || 'brandSelect';
    const customSelectId = placeholder.dataset.customSelectId || 'customBrandSelect';
    const brandChangeName = placeholder.dataset.brandChange || 'onOfficialBrandChange';
    const customChangeName = placeholder.dataset.customChange || 'onCustomBrandChange';
    const brandSelect = document.createElement('select');
    brandSelect.id = brandSelectId;
    const customSelect = document.createElement('select');
    customSelect.id = customSelectId;

    const brandLabel = document.createElement('label');
    brandLabel.className = 'section-label';
    brandLabel.htmlFor = brandSelectId;
    brandLabel.textContent = 'BRAND';
    const brandWrap = document.createElement('div');
    brandWrap.className = 'preset-select';
    brandWrap.append(brandSelect);

    const customLabel = document.createElement('label');
    customLabel.htmlFor = customSelectId;
    customLabel.textContent = 'Loghi Personalizzati';
    const customWrap = document.createElement('div');
    customWrap.className = 'preset-select';
    customWrap.append(customSelect);

    const brandPlaceholder = document.createElement('option');
    brandPlaceholder.value = '';
    brandPlaceholder.textContent = '-- Seleziona Brand --';
    brandPlaceholder.className = 'brand-placeholder';
    brandSelect.append(brandPlaceholder);

    if (typeof getSortedLogoFiles !== 'function' || typeof appendBrandOption !== 'function') {
      throw new Error('Il menu Brand richiede il modulo condiviso assets/js/logos.js.');
    }
    const { priorityFiles, remainingFiles } = getSortedLogoFiles();
    [...priorityFiles, ...remainingFiles].forEach(fileName => {
      const name = fileName.replace(/\.[^.]+$/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
      appendBrandOption(brandSelect, fileName, name, priorityFiles.includes(fileName));
    });

    const customPlaceholder = document.createElement('option');
    customPlaceholder.value = '';
    customPlaceholder.textContent = '-- Seleziona Logo Personalizzato --';
    customSelect.append(customPlaceholder);
    const logos = readCustomLogos();
    if (placeholder.dataset.sortCustom === 'true') {
      logos.sort((first, second) => first.name.localeCompare(second.name, 'it', { sensitivity: 'base' }));
    }
    const customValue = placeholder.dataset.customValue || 'data';
    if (!['data', 'id'].includes(customValue)) {
      throw new Error(`Valore personalizzato non supportato per il menu loghi: ${customValue}`);
    }
    logos
      .filter(logo => customValue !== 'id' || logo.id)
      .forEach(logo => {
        addOption(customSelect, logo[customValue], `★ ${logo.name}`);
      });

    brandSelect.addEventListener('change', () => {
      const handler = window[brandChangeName];
      if (typeof handler !== 'function') {
        throw new Error(`Funzione non disponibile per il menu Brand: ${brandChangeName}`);
      }
      handler();
    });
    customSelect.addEventListener('change', () => {
      const handler = window[customChangeName];
      if (typeof handler !== 'function') {
        throw new Error(`Funzione non disponibile per il menu Loghi Personalizzati: ${customChangeName}`);
      }
      handler();
    });

    placeholder.replaceChildren(brandLabel, brandWrap, customLabel, customWrap);
  }

  document.querySelectorAll('[data-menu-brand-cartellini]').forEach(populate);
  window.MenuBrandCartellini = Object.freeze({ readCustomLogos });
})();
