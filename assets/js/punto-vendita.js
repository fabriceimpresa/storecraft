/* Punto vendita scelto: quale negozio usa il browser oggi.
   La scelta si fa nella splash page (index.html nella radice) o da PROFILO UTENTE nella dashboard di un negozio, e vale
   per la giornata: il giorno dopo, aprendo STORE // CRAFT, la splash page la chiede di nuovo. Salvata in localStorage
   ("storecraft_punto_vendita": { negozio, giorno }).

   Uso:
     PuntoVendita.NEGOZI                 negozi installati: { luxury: { nome, sigla, logo, larghezzaLogo, pronto }, tebe: …, ophilya: … }
     PuntoVendita.unico()                il negozio, se ne è installato uno solo; altrimenti null
     PuntoVendita.sceltoOggi()           negozio scelto oggi, o null
     PuntoVendita.scegli(negozio)        salva la scelta di oggi e apre la dashboard del negozio
     PuntoVendita.ricorda(negozio)       salva la scelta di oggi senza cambiare pagina
     PuntoVendita.dashboard(negozio)     indirizzo della dashboard del negozio
     PuntoVendita.splash()               indirizzo della splash page
     PuntoVendita.apriSplash()           apre la splash page per scegliere di nuovo (index.html?scegli)
   Nomi, sigle e loghi vengono dalle schede dei negozi installati in questa copia (assets/negozi/, vedi negozi.js).
   "pronto" dice se il negozio è già nella struttura: quelli non pronti compaiono come IN ARRIVO. */
(() => {
  const CHIAVE = 'storecraft_punto_vendita';
  const RADICE = new URL('../../', document.currentScript.src);
  // Negozi installati, dalle loro schede (logo: il logo della splash page, indirizzo completo)
  const NEGOZI = Object.freeze(Object.fromEntries(Negozi.installati.map(id => {
    const scheda = Negozi.scheda(id);
    return [id, Object.freeze({
      nome: scheda.nome,
      sigla: scheda.sigla,
      logo: new URL(`assets/${scheda.logoSplash}`, RADICE).href,
      larghezzaLogo: scheda.logoSplashLarghezza || 150,
      pronto: true
    })];
  })));

  // Giorno locale, non UTC: la scelta scade a mezzanotte del negozio.
  function oggi() {
    const data = new Date();
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  }

  function sceltoOggi() {
    // Con un solo negozio installato non c'è niente da scegliere: è sempre quello.
    if (Negozi.unico()) return Negozi.unico();
    try {
      const scelta = JSON.parse(localStorage.getItem(CHIAVE) || 'null');
      return scelta && scelta.giorno === oggi() && NEGOZI[scelta.negozio]?.pronto ? scelta.negozio : null;
    } catch (error) {
      console.error('Lettura del punto vendita scelto fallita.', error);
      return null;
    }
  }

  function ricorda(negozio) {
    try {
      localStorage.setItem(CHIAVE, JSON.stringify({ negozio, giorno: oggi() }));
    } catch (error) {
      console.error('Salvataggio del punto vendita scelto fallito.', error);
    }
  }

  function dashboard(negozio) {
    return new URL(`${negozio}/index.html`, RADICE).href;
  }

  function scegli(negozio) {
    if (!NEGOZI[negozio]?.pronto) return;
    ricorda(negozio);
    location.href = dashboard(negozio);
  }

  window.PuntoVendita = Object.freeze({
    NEGOZI,
    sceltoOggi,
    scegli,
    ricorda,
    unico: Negozi.unico,
    dashboard,
    splash: () => new URL('index.html', RADICE).href,
    // Voce HOME del menu di sistema: torna alla splash page e la mostra anche se oggi un negozio è già scelto.
    apriSplash: () => { location.href = new URL('index.html?scegli', RADICE).href; }
  });
})();
