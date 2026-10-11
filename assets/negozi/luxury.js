/* Scheda del negozio Luxury Outlet (vedi assets/js/negozi.js). I colori sono in luxury.css. */
Negozi.registra('luxury', {
  nome: 'LUXURY OUTLET',
  sigla: 'LXRY',
  // logo della splash page, nella cartella assets/
  logoSplash: 'img/luxury/printlogos/whiteLXRY_BRAND.png',
  // larghezza del logo nella splash page, in px
  logoSplashLarghezza: 150,
  // indirizzo del negozio e logo del menu del telefono (PROFILO UTENTE e lista NEGOZI), lo stesso della dashboard
  indirizzo: 'VIA DEL CORSO 15',
  logoMenu: 'img/luxury/logo-lxry-orizzontale.png',
  logoMenuLarghezza: 185,
  // oro dei loghi ricolorati per la stampa e della variante gold dei loghi ufficiali (logoimport)
  oro: '#b48b37',
  // brand prioritari nei menu BRAND: 'stella' (stella gialla ★, i brand stagionali) o 'maiuscolo' (⭐ e maiuscolo)
  brandPrioritari: 'stella',
  // database della lista di stampa nel browser e nome della sua finestra
  listaStampa: 'storecraft-lista-stampa',
  // database della cronologia di stampa nel browser (cronologia-stampa.js): le stampe degli ultimi 7 giorni
  cronologiaStampa: 'storecraft-cronologia-stampa',
  // guida "Dove montare la stampa?": null la spegne; altrimenti { pagina: [foto in assets/foto/luxury/] }
  guida: null,
  // valori iniziali dell'interfaccia, finché l'utente non sceglie (theme.js)
  interfaccia: { tema: 'dark', aspetto: 'standard' }
});
