/* Made in Italy, comune a tutti i negozi. Stile del pulsante in assets/css/madeinitaly.css.
   Due modi:
   - MadeInItaly.toggle(...): le pagine che tengono lo stato dei cartelli (Luxury Outlet) creano i loro pulsanti
     .made-in-italy-btn e chiamano toggle con lo stato del cartello, i testi da cambiare e la funzione che aggiorna
     pannello e foglio; toggle conserva e ripristina solo testi e modalità coinvolti.
   - Modo automatico: <script src="…/madeinitaly.js" data-automatico></script> in fondo alla pagina, dopo i cartelli
     (pagine di TEBE e OPHILYA, che non tengono lo stato in un oggetto). Crea il pulsante .made-in-italy-btn e le
     bandierine ai lati dei cartelli (.card, .frame-box.tema-italia-target; non con .tema-italia-no-side-flags),
     ricorda i campi della pagina e li rimette com'erano spegnendo il tema. La pagina può dare i suoi agganci:
     window.applyTemaItaliaDescription, captureTemaItaliaState / restoreTemaItaliaState, temaItaliaIsActive /
     temaItaliaDeactivate (più cartelli con stato proprio); il modulo espone refreshTemaItaliaButton e
     deactivateTemaItalia. La bandiera è quella del negozio della pagina, assets/img/<negozio>/madeinitaly.png. */
window.MadeInItaly = {
  toggle({
    index, active, otherThemes, previous, state, targets = [],
    textField = 'desc', presetField = 'descPreset', descriptionMode = false, onChange
  }) {
    const next = !active[index];
    if (next) {
      if (previous) {
        previous[index] = {
          withDesc: state.withDesc,
          texts: targets.map(target => ({
            text: target[textField],
            preset: target[presetField]
          }))
        };
      }
      otherThemes.forEach(theme => { theme[index] = false; });
      if (descriptionMode) state.withDesc = true;
      targets.forEach(target => {
        target[textField] = 'Made in Italy';
        target[presetField] = 'Made in Italy';
      });
    } else if (previous && previous[index]) {
      const saved = previous[index];
      if (descriptionMode) state.withDesc = saved.withDesc;
      targets.forEach((target, position) => {
        target[textField] = saved.texts[position].text;
        target[presetField] = saved.texts[position].preset;
      });
      previous[index] = null;
    }
    active[index] = next;
    onChange();
  }
};

// Modo automatico (pagine di TEBE e OPHILYA): ripreso dal progetto TEBE, con il pulsante comune .made-in-italy-btn.
(function initMadeInItalyAutomatico() {
  const script = document.currentScript;
  if (!script || !('automatico' in script.dataset)) return;
  const cards = [...document.querySelectorAll('.card, .frame-box')];
  if (!cards.length) return;
  document.documentElement.dataset.madeInItaly = 'automatico';

  // Bandiera del negozio della pagina (data-negozio), in assets/img/<negozio>/.
  const flagSource = new URL(`../img/${document.documentElement.dataset.negozio}/madeinitaly.png`, script.src).href;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'made-in-italy-btn';
  button.setAttribute('aria-pressed', 'false');
  button.title = 'Attiva tema Italia';
  button.setAttribute('aria-label', 'Attiva tema Italia');

  const buttonImage = document.createElement('img');
  buttonImage.src = flagSource;
  buttonImage.alt = '';
  button.appendChild(buttonImage);
  document.body.appendChild(button);

  document.querySelectorAll('.card:not(.tema-italia-no-side-flags), .frame-box.tema-italia-target:not(.tema-italia-no-side-flags)').forEach(card => {
    card.append(
      createFlag('left'),
      createFlag('right')
    );
  });

  let isActive = false;
  let previousState = null;

  function paintButton() {
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
    button.title = isActive ? 'Disattiva tema Italia' : 'Attiva tema Italia';
    button.setAttribute('aria-label', button.title);
    document.querySelectorAll('.tema-italia-flag').forEach(flag => {
      flag.classList.toggle('is-visible', isActive);
    });
  }

  button.addEventListener('click', () => {
    // Le pagine con piu' cartelli indipendenti tengono loro lo stato del tema.
    if (typeof window.temaItaliaIsActive === 'function') {
      isActive = window.temaItaliaIsActive();
    }
    if (!isActive) previousState = captureState();
    isActive = !isActive;
    paintButton();

    if (isActive) {
      applyMadeInItalyDescription();
    } else if (typeof window.temaItaliaDeactivate === 'function') {
      window.temaItaliaDeactivate();
      previousState = null;
    } else {
      restoreState(previousState);
      previousState = null;
    }
  });

  // Permette alle pagine con stato proprio di riallineare il pulsante,
  // per esempio quando si passa da un cartello all'altro.
  window.refreshTemaItaliaButton = function refreshTemaItaliaButton() {
    if (typeof window.temaItaliaIsActive !== 'function') return;
    isActive = window.temaItaliaIsActive();
    paintButton();
  };

  window.deactivateTemaItalia = function deactivateTemaItalia() {
    if (typeof window.temaItaliaIsActive === 'function') {
      isActive = window.temaItaliaIsActive();
    }
    if (isActive) button.click();
  };

  function captureState() {
    return {
      controls: [...document.querySelectorAll('input, select, textarea')].map(control => ({
        element: control,
        value: control.value,
        checked: control.checked,
        selectedIndex: control.selectedIndex
      })),
      modeButtons: [...document.querySelectorAll('[id^="mode"]')].map(control => ({
        element: control,
        className: control.className
      })),
      activeMode: [...document.querySelectorAll('[id^="mode"]')]
        .concat([...document.querySelectorAll('button[id$="ModeBtn"]')])
        .find(control => control.classList.contains('active'))?.id || null,
      activeFrame: typeof currentActiveFrame === 'string' ? currentActiveFrame : null,
      appState: typeof window.captureTemaItaliaState === 'function'
        ? window.captureTemaItaliaState()
        : null,
      descriptionGroups: [...document.querySelectorAll('[id*="descGroup" i]')].map(group => ({
        element: group,
        style: group.getAttribute('style')
      }))
    };
  }

  function restoreState(state) {
    if (!state) return;

    state.controls.forEach(item => {
      item.element.value = item.value;
      item.element.checked = item.checked;
      if (item.element.tagName === 'SELECT') item.element.selectedIndex = item.selectedIndex;
    });

    state.controls.forEach(item => {
      if (item.element.matches('input, textarea')) {
        item.element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    if (state.appState && typeof window.restoreTemaItaliaState === 'function') {
      window.restoreTemaItaliaState(state.appState);
      return;
    }

    if (state.activeFrame && typeof window.switchActiveFrame === 'function') {
      window.switchActiveFrame(state.activeFrame);
    }

    if (state.activeMode && state.activeMode.endsWith('ModeBtn') && typeof window.setFrameMode === 'function') {
      const mode = state.activeMode === 'extraArticleModeBtn'
        ? 'extra'
        : state.activeMode === 'brandModeBtn'
          ? 'brand'
          : 'standard';
      window.setFrameMode(mode);
    } else if (state.activeMode && typeof window.switchMode === 'function') {
      const mode = state.activeMode === 'modeDoppia' || state.activeMode === 'modeStandard'
        ? state.activeMode === 'modeDoppia' ? 'doppia' : 'standard'
        : 'descrizione';
      window.switchMode(mode);
    } else {
      state.modeButtons.forEach(item => {
        item.element.className = item.className;
      });
    }
    state.descriptionGroups.forEach(item => {
      if (item.style === null) item.element.removeAttribute('style');
      else item.element.setAttribute('style', item.style);
    });
  }

  function createFlag(side) {
    const flag = document.createElement('img');
    flag.className = `tema-italia-flag tema-italia-flag-${side}`;
    flag.src = flagSource;
    flag.alt = '';
    return flag;
  }

  function applyMadeInItalyDescription() {
    if (typeof window.applyTemaItaliaDescription === 'function') {
      window.applyTemaItaliaDescription();
      return;
    }

    const descriptionModeButton = document.getElementById('modeDescrizione')
      || document.getElementById('modeDescription');
    if (descriptionModeButton && !descriptionModeButton.classList.contains('active')) {
      descriptionModeButton.click();
    }

    const standardModeButton = document.getElementById('standardModeBtn');
    if (standardModeButton && !standardModeButton.classList.contains('active')) {
      standardModeButton.click();
    }

    const descriptionSelect = [...document.querySelectorAll('select')].find(select =>
      select.id !== 'brandSelect' &&
      select.id !== 'customBrandSelect' &&
      [...select.options].some(option => normalize(option.textContent) === 'made in italy')
    );

    if (descriptionSelect) {
      const option = [...descriptionSelect.options].find(item =>
        normalize(item.textContent) === 'made in italy'
      );
      descriptionSelect.value = option.value;
      descriptionSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const descriptionInput = document.querySelector(
      'input[id*="desc" i], textarea[id*="desc" i]'
    );
    if (descriptionInput) {
      descriptionInput.value = 'Made in Italy';
      descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function normalize(value) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }
}());
