(() => {
  const STORAGE_KEY = 'storecraft_interface_theme';
  const LOOK_STORAGE_KEY = 'storecraft_interface_look';
  const THEMES = Object.freeze(['dark', 'light']);
  const LOOKS = Object.freeze(['standard', 'minimal']);
  const root = document.documentElement;
  // Valori iniziali, finché l'utente non sceglie: quelli del negozio della pagina, nella sua scheda
  // (assets/negozi/<negozio>.js, interfaccia), altrimenti tema scuro e look standard.
  const INIZIALI = window.Negozi?.corrente()?.interfaccia || {};
  const DEFAULT_THEME = THEMES.includes(INIZIALI.tema) ? INIZIALI.tema : 'dark';
  const DEFAULT_LOOK = LOOKS.includes(INIZIALI.aspetto) ? INIZIALI.aspetto : 'standard';
  let systemMenu;
  let systemMenuButton;
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

  const initialTheme = readTheme();
  applyTheme(initialTheme);
  applyLook(readLook());

  function setSystemMenuOpen(open) {
    if (!systemMenu || !systemMenuButton) return;
    systemMenu.hidden = !open;
    systemMenuButton.setAttribute('aria-expanded', String(open));
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
      systemMenu.querySelector('[data-system-view="settings"] [data-interface-theme-choice].is-selected')
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
    systemMenuButton = document.getElementById('system-menu-toggle');
    systemMenuTitle = document.getElementById('system-menu-title');
    if (!systemMenu || !systemMenuButton || !systemMenuTitle) return;

    systemMenu.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSystemMenuOpen(false);
        systemMenuButton.focus({ preventScroll: true });
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
    applyTheme(root.dataset.interfaceTheme || DEFAULT_THEME);
    applyLook(root.dataset.interfaceLook || DEFAULT_LOOK);
    document.addEventListener('pointerdown', event => {
      if (!systemMenu.hidden && !systemMenu.contains(event.target) &&
          !systemMenuButton.contains(event.target)) {
        setSystemMenuOpen(false);
      }
    });
  });
})();
