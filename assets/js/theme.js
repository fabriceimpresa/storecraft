(() => {
  const STORAGE_KEY = 'storecraft_interface_theme';
  const LOOK_STORAGE_KEY = 'storecraft_interface_look';
  const THEMES = Object.freeze(['dark', 'light']);
  const LOOKS = Object.freeze(['standard', 'minimal']);
  const root = document.documentElement;
  let systemMenu;
  let systemMenuButton;
  let settingsPanel;

  function readTheme() {
    try {
      const storedTheme = localStorage.getItem(STORAGE_KEY);
      return THEMES.includes(storedTheme) ? storedTheme : 'dark';
    } catch (error) {
      console.error('Lettura del tema dell’interfaccia non riuscita.', error);
      return 'dark';
    }
  }

  function readLook() {
    try {
      const storedLook = localStorage.getItem(LOOK_STORAGE_KEY);
      return LOOKS.includes(storedLook) ? storedLook : 'standard';
    } catch (error) {
      console.error('Lettura del look dell’interfaccia non riuscita.', error);
      return 'standard';
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

  applyTheme(readTheme());
  applyLook(readLook());

  function setSystemMenuOpen(open) {
    if (!systemMenu || !systemMenuButton) return;
    systemMenu.hidden = !open;
    systemMenuButton.setAttribute('aria-expanded', String(open));
    if (!open) settingsPanel.hidden = true;
    if (open) {
      systemMenu.querySelector('[data-system-menu-item="settings"]')?.focus({ preventScroll: true });
    }
  }

  function positionSettingsPanel() {
    if (!settingsPanel || settingsPanel.hidden || !systemMenu) return;
    const menuRect = systemMenu.getBoundingClientRect();
    const settingsButton = systemMenu.querySelector('[data-system-menu-item="settings"]');
    const settingsRect = settingsButton.getBoundingClientRect();
    const panelWidth = settingsPanel.getBoundingClientRect().width;
    const gap = 8;
    const fitsBesideMenu = menuRect.right + gap + panelWidth <= window.innerWidth - 12;

    settingsPanel.style.left = `${fitsBesideMenu ? menuRect.right + gap : menuRect.left}px`;
    settingsPanel.style.bottom = fitsBesideMenu
      ? `${window.innerHeight - settingsRect.bottom}px`
      : `${window.innerHeight - menuRect.top + gap}px`;
  }

  function showSystemMenuView(view) {
    if (!systemMenu) return;
    const views = ['home', 'contacts'];
    if (!views.includes(view)) throw new Error(`Vista del menu di sistema non riconosciuta: ${view}`);
    views.forEach(name => {
      const panel = systemMenu.querySelector(`[data-system-view="${name}"]`);
      panel.hidden = name !== view;
    });
    systemMenu.dataset.view = view;
    settingsPanel.hidden = true;
    if (view === 'home') {
      systemMenu.querySelector('[data-system-menu-item="settings"]')?.focus({ preventScroll: true });
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
    if (view === 'settings') {
      systemMenu.querySelector('[data-system-view="home"]').hidden = false;
      systemMenu.querySelector('[data-system-view="contacts"]').hidden = true;
      systemMenu.dataset.view = 'home';
      settingsPanel.hidden = false;
      positionSettingsPanel();
      settingsPanel.querySelector('[data-interface-theme-choice].is-selected')?.focus({ preventScroll: true });
      return;
    }
    if (view === 'contacts' || view === 'home') {
      showSystemMenuView(view);
      return;
    }
    if (view === 'profile' || view === 'store') return;
    throw new Error(`Sezione del menu di sistema non riconosciuta: ${view}`);
  };

  document.addEventListener('DOMContentLoaded', () => {
    systemMenu = document.getElementById('system-menu');
    systemMenuButton = document.getElementById('system-menu-toggle');
    settingsPanel = document.getElementById('system-settings-panel');
    if (!systemMenu || !systemMenuButton || !settingsPanel) return;

    [systemMenu, settingsPanel].forEach(panel => panel.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSystemMenuOpen(false);
        systemMenuButton.focus({ preventScroll: true });
      }
    }));
    systemMenu.addEventListener('animationend', positionSettingsPanel);
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
    applyTheme(root.dataset.interfaceTheme || 'dark');
    applyLook(root.dataset.interfaceLook || 'standard');
    document.addEventListener('pointerdown', event => {
      if (!systemMenu.hidden && !systemMenu.contains(event.target) &&
          !settingsPanel.contains(event.target) && !systemMenuButton.contains(event.target)) {
        setSystemMenuOpen(false);
      }
    });
    window.addEventListener('resize', positionSettingsPanel);
  });
})();
