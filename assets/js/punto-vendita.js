/* Punto vendita scelto: quale negozio usa il browser oggi.
   La scelta si fa nella splash page (index.html nella radice) o da PROFILO UTENTE nella dashboard di un negozio, e vale
   per la giornata: il giorno dopo, aprendo STORE // CRAFT, la splash page la chiede di nuovo. Salvata in localStorage
   ("storecraft_punto_vendita": { negozio, giorno }).

   Uso:
     PuntoVendita.NEGOZI                 { luxury: { nome, sigla, pronto }, tebe: …, ophilya: … }
     PuntoVendita.sceltoOggi()           negozio scelto oggi, o null
     PuntoVendita.scegli(negozio)        salva la scelta di oggi e apre la dashboard del negozio
     PuntoVendita.ricorda(negozio)       salva la scelta di oggi senza cambiare pagina
     PuntoVendita.dashboard(negozio)     indirizzo della dashboard del negozio
     PuntoVendita.splash()               indirizzo della splash page
   "pronto" dice se il negozio è già nella struttura: quelli non pronti compaiono come IN ARRIVO. */
(() => {
  const CHIAVE = 'storecraft_punto_vendita';
  const RADICE = new URL('../../', document.currentScript.src);
  const NEGOZI = Object.freeze({
    luxury: Object.freeze({ nome: 'LUXURY OUTLET', sigla: 'LXRY', pronto: true }),
    tebe: Object.freeze({ nome: 'TEBE', sigla: 'TEBE', pronto: false }),
    ophilya: Object.freeze({ nome: 'OPHILYA', sigla: 'OPHILYA', pronto: false })
  });

  // Giorno locale, non UTC: la scelta scade a mezzanotte del negozio.
  function oggi() {
    const data = new Date();
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  }

  function sceltoOggi() {
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
    dashboard,
    splash: () => new URL('index.html', RADICE).href
  });
})();
