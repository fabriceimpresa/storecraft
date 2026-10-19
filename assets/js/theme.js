(() => {
  // Tema e aspetto scelti si ricordano per negozio (Luxury Outlet conserva le chiavi di prima): così ogni negozio parte
  // dai suoi valori iniziali finché l'utente non sceglie.
  const NEGOZIO = document.documentElement.dataset.negozio;
  const SUFFISSO = NEGOZIO && NEGOZIO !== 'luxury' ? `_${NEGOZIO}` : '';
  const STORAGE_KEY = `storecraft_interface_theme${SUFFISSO}`;
  const LOOK_STORAGE_KEY = `storecraft_interface_look${SUFFISSO}`;
  const EXTRA_STORAGE_KEY = `storecraft_interface_extra${SUFFISSO}`;
  const THEMES = Object.freeze(['dark', 'light']);
  // Set EXTRA (dal 19 ottobre 2026): impongono insieme tema e aspetto e li bloccano finché sono attivi; uscendo dal set si torna
  // a tema e aspetto di partenza del negozio. Ogni set ha il suo foglio di stile, assets/css/extra-<set>.css, e i suoi
  // caratteri, caricati solo quando serve. MATRIX e NEUROMANCE sono in arrivo (solo nel menu, spenti)
  const EXTRAS = Object.freeze({
    vintage: {
      nome: 'VINTAGE',
      tema: 'light',
      aspetto: 'standard',
      font: 'https://fonts.googleapis.com/css2?family=Yellowtail&family=Racing+Sans+One&family=Alfa+Slab+One&family=Oswald:wght@400;500;600&family=Libre+Franklin:wght@400;500;600&display=swap'
    }
  });
  const SCRIPT = document.currentScript;
  let extraAttivo = null;
  const LOOKS = Object.freeze(['standard', 'minimal']);
  const root = document.documentElement;
  // Valori iniziali, finché l'utente non sceglie: quelli del negozio della pagina, nella sua scheda
  // (assets/negozi/<negozio>.js, interfaccia), altrimenti tema scuro e look standard.
  const INIZIALI = window.Negozi?.corrente()?.interfaccia || {};
  const DEFAULT_THEME = THEMES.includes(INIZIALI.tema) ? INIZIALI.tema : 'dark';
  const DEFAULT_LOOK = LOOKS.includes(INIZIALI.aspetto) ? INIZIALI.aspetto : 'standard';
  let systemMenu;
  // pulsanti che aprono il menu di sistema: MENU // IMPOSTAZIONI nel menu laterale e, sul telefono, il pulsante tondo fisso
  let systemMenuButtons = [];
  let systemMenuTitle;

  function readTheme() {
    try {
      const storedTheme = localStorage.getItem(STORAGE_KEY);
      return THEMES.includes(storedTheme) ? storedTheme : DEFAULT_THEME;
    } catch (error) {
      console.error('Lettura del tema dell’interfaccia non riuscita.', error);
      return DEFAULT_THEME;
    }
  }

  function readLook() {
    try {
      const storedLook = localStorage.getItem(LOOK_STORAGE_KEY);
      return LOOKS.includes(storedLook) ? storedLook : DEFAULT_LOOK;
    } catch (error) {
      console.error('Lettura del look dell’interfaccia non riuscita.', error);
      return DEFAULT_LOOK;
    }
  }

  function applyLook(look, persist = false) {
    if (!LOOKS.includes(look)) {
      throw new Error(`Look dell’interfaccia non riconosciuto: ${look}`);
    }
    root.dataset.interfaceLook = look;
    if (look === 'minimal') loadMinimalDisplayFont();
    document.querySelectorAll('[data-interface-look-choice]').forEach(button => {
      const selected = button.dataset.interfaceLookChoice === look;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });

    if (persist) {
      try {
        localStorage.setItem(LOOK_STORAGE_KEY, look);
      } catch (error) {
        console.error('Salvataggio del look dell’interfaccia non riuscito.', error);
        window.alert('Il look è stato applicato, ma non è stato possibile salvarlo in questo browser.');
      }
    }
  }

  function applyTheme(theme, persist = false) {
    if (!THEMES.includes(theme)) {
      throw new Error(`Tema dell’interfaccia non riconosciuto: ${theme}`);
    }
    root.dataset.interfaceTheme = theme;
    document.querySelectorAll('[data-interface-theme-choice]').forEach(button => {
      const selected = button.dataset.interfaceThemeChoice === theme;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (error) {
        console.error('Salvataggio del tema dell’interfaccia non riuscito.', error);
        window.alert('Il tema è stato applicato, ma non è stato possibile salvarlo in questo browser.');
      }
    }
  }

  function collapseSidebarSections() {
    document.querySelectorAll('[data-sidebar-section]').forEach(section => {
      section.classList.add('is-collapsed');
      const toggle = section.querySelector('.section-toggle');
      const title = section.querySelector('.label span')?.textContent;
      if (!toggle || !title) return;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', `Espandi ${title}`);
    });

    const promoToggle = document.querySelector('.nav-subtoggle[aria-controls="promoItems"]');
    const cartelliItems = document.getElementById('cartelliItems');
    const promoItems = document.getElementById('promoItems');
    promoToggle?.setAttribute('aria-expanded', 'false');
    if (cartelliItems) cartelliItems.hidden = false;
    if (promoItems) promoItems.hidden = true;
  }

  function loadMinimalDisplayFont() {
    const fontLinkId = 'interface-minimal-display-font';
    if (document.getElementById(fontLinkId)) return;
    const link = document.createElement('link');
    link.id = fontLinkId;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap';
    link.addEventListener('error', () => {
      console.error('Caricamento del carattere Fraunces per il look minimal non riuscito.');
    }, { once: true });
    document.head.append(link);
  }

  function readExtra() {
    try {
      const storedExtra = localStorage.getItem(EXTRA_STORAGE_KEY);
      return Object.hasOwn(EXTRAS, storedExtra) ? storedExtra : null;
    } catch (error) {
      console.error('Lettura del set extra dell’interfaccia non riuscita.', error);
      return null;
    }
  }

  // foglio di stile e caratteri del set, accanto a theme.js (stessa versione nell'indirizzo)
  function loadExtraStyles(extra) {
    const id = `interface-extra-${extra}`;
    if (document.getElementById(id)) return;
    const css = document.createElement('link');
    css.id = id;
    css.rel = 'stylesheet';
    const base = SCRIPT?.src ? new URL(SCRIPT.src) : new URL('../assets/js/theme.js', location.href);
    css.href = new URL(`../css/extra-${extra}.css${base.search}`, base).href;
    css.addEventListener('error', () => console.error(`Caricamento dello stile del set ${extra} non riuscito.`), { once: true });
    const font = document.createElement('link');
    font.id = `${id}-font`;
    font.rel = 'stylesheet';
    font.href = EXTRAS[extra].font;
    font.addEventListener('error', () => console.error(`Caricamento dei caratteri del set ${extra} non riuscito.`), { once: true });
    document.head.append(font, css);
  }

  // stato dei comandi del menu: set scelto, TEMA e ASPETTO spenti finché un set è attivo, ESCI DAL SET EXTRA visibile
  function refreshExtraControls() {
    document.querySelectorAll('[data-interface-extra-choice]').forEach(button => {
      const selected = button.dataset.interfaceExtraChoice === extraAttivo;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll('[data-interface-theme-choice], [data-interface-look-choice]').forEach(button => {
      button.disabled = Boolean(extraAttivo);
      const row = button.closest('.system-setting-row');
      row?.classList.toggle('is-bloccata', Boolean(extraAttivo));
      if (extraAttivo) row?.setAttribute('title', `Impostato dal set ${EXTRAS[extraAttivo].nome}`);
      else row?.removeAttribute('title');
    });
    document.querySelectorAll('[data-interface-extra-exit]').forEach(button => { button.hidden = !extraAttivo; });
  }

  // extra: il nome del set, o null per uscire e tornare a tema e aspetto di partenza del negozio
  function applyExtra(extra, persist = false) {
    if (extra !== null && !Object.hasOwn(EXTRAS, extra)) {
      throw new Error(`Set extra dell’interfaccia non riconosciuto: ${extra}`);
    }
    extraAttivo = extra;
    if (extra) {
      root.dataset.interfaceExtra = extra;
      loadExtraStyles(extra);
      applyTheme(EXTRAS[extra].tema);
      applyLook(EXTRAS[extra].aspetto);
    } else {
      // uscendo dal set si torna all'aspetto di partenza del negozio (scheda del negozio, interfaccia: per Luxury Outlet
      // SCURO e STANDARD), che diventa anche la scelta salvata di TEMA e ASPETTO (decisione del 19 ottobre 2026)
      delete root.dataset.interfaceExtra;
      applyTheme(DEFAULT_THEME, persist);
      applyLook(DEFAULT_LOOK, persist);
    }
    refreshExtraControls();

    if (persist) {
      try {
        if (extra) localStorage.setItem(EXTRA_STORAGE_KEY, extra);
        else localStorage.removeItem(EXTRA_STORAGE_KEY);
      } catch (error) {
        console.error('Salvataggio del set extra dell’interfaccia non riuscito.', error);
        window.alert('Il set è stato applicato, ma non è stato possibile salvarlo in questo browser.');
      }
    }
  }

  applyTheme(readTheme());
  applyLook(readLook());
  const initialExtra = readExtra();
  if (initialExtra) applyExtra(initialExtra);

  function setSystemMenuOpen(open) {
    if (!systemMenu || !systemMenuButtons.length) return;
    systemMenu.hidden = !open;
    systemMenuButtons.forEach(button => button.setAttribute('aria-expanded', String(open)));
    if (open) {
      collapseSidebarSections();
      showSystemMenuView('home');
    }
  }

  function showSystemMenuView(view) {
    if (!systemMenu) return;
    const views = ['home', 'settings', 'contacts', 'stores'];
    if (!views.includes(view)) throw new Error(`Vista del menu di sistema non riconosciuta: ${view}`);
    views.forEach(name => {
      const panel = systemMenu.querySelector(`[data-system-view="${name}"]`);
      panel.hidden = name !== view;
    });
    systemMenu.dataset.view = view;
    systemMenuTitle.textContent = {
      home: 'MENU',
      settings: 'IMPOSTAZIONI',
      contacts: 'CONTATTI & CREDITS',
      stores: 'NEGOZI'
    }[view];
    if (view === 'home') {
      systemMenu.querySelector('[data-system-menu-item="settings"]')?.focus({ preventScroll: true });
    } else if (view === 'settings') {
      // con un set extra attivo TEMA e ASPETTO sono spenti: il fuoco va sul set scelto
      systemMenu.querySelector(extraAttivo
        ? '[data-system-view="settings"] [data-interface-extra-choice].is-selected'
        : '[data-system-view="settings"] [data-interface-theme-choice].is-selected')
        ?.focus({ preventScroll: true });
    } else if (view === 'contacts' || view === 'stores') {
      systemMenu.querySelector(`[data-system-view="${view}"] [data-system-menu-back]`)
        ?.focus({ preventScroll: true });
    } else {
      systemMenu.querySelector('[data-system-view="contacts"] [data-system-menu-back]')?.focus({ preventScroll: true });
    }
  }

  window.toggleSystemMenu = () => {
    if (!systemMenu) return;
    setSystemMenuOpen(systemMenu.hidden);
    if (!systemMenu.hidden) showSystemMenuView('home');
  };
  window.openSystemMenuView = view => {
    if (view === 'settings' || view === 'contacts' || view === 'stores' || view === 'home') {
      showSystemMenuView(view);
      return;
    }
    if (view === 'profile') {
      showSystemMenuView('stores');
      return;
    }
    if (view === 'store') return;
    throw new Error(`Sezione del menu di sistema non riconosciuta: ${view}`);
  };

  document.addEventListener('DOMContentLoaded', () => {
    systemMenu = document.getElementById('system-menu');
    systemMenuButtons = [...document.querySelectorAll('[aria-controls="system-menu"]')];
    systemMenuTitle = document.getElementById('system-menu-title');
    if (!systemMenu || !systemMenuButtons.length || !systemMenuTitle) return;

    systemMenu.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSystemMenuOpen(false);
        // torna al pulsante visibile (sul telefono quello tondo)
        systemMenuButtons.find(button => button.offsetParent)?.focus({ preventScroll: true });
      }
    });
    document.querySelectorAll('[data-interface-theme-choice]').forEach(button => {
      button.addEventListener('click', () => {
        applyTheme(button.dataset.interfaceThemeChoice, true);
      });
    });
    document.querySelectorAll('[data-interface-look-choice]').forEach(button => {
      button.addEventListener('click', () => {
        applyLook(button.dataset.interfaceLookChoice, true);
      });
    });
    // set EXTRA: un clic sceglie il set; un altro clic sul set già scelto, o ESCI DAL SET EXTRA, ne esce
    document.querySelectorAll('[data-interface-extra-choice]').forEach(button => {
      button.addEventListener('click', () => {
        const extra = button.dataset.interfaceExtraChoice;
        applyExtra(extraAttivo === extra ? null : extra, true);
      });
    });
    document.querySelectorAll('[data-interface-extra-exit]').forEach(button => {
      button.addEventListener('click', () => {
        applyExtra(null, true);
        systemMenu.querySelector('[data-interface-theme-choice].is-selected')?.focus({ preventScroll: true });
      });
    });
    applyTheme(root.dataset.interfaceTheme || DEFAULT_THEME);
    applyLook(root.dataset.interfaceLook || DEFAULT_LOOK);
    refreshExtraControls();
    document.addEventListener('pointerdown', event => {
      if (!systemMenu.hidden && !systemMenu.contains(event.target) &&
          !systemMenuButtons.some(button => button.contains(event.target))) {
        setSystemMenuOpen(false);
      }
    });
  });
})();
