/* Scheda del negozio TEBE (vedi assets/js/negozi.js). I colori sono in tebe.css. */
Negozi.registra('tebe', {
  nome: 'TEBE',
  sigla: 'TEBE',
  // logo della splash page, nella cartella assets/
  logoSplash: 'img/tebe/tebeblack.png',
  // larghezza del logo nella splash page, in px
  logoSplashLarghezza: 132,
  // oro dei loghi ricolorati per la stampa e della variante gold dei loghi ufficiali (logoimport)
  oro: '#cc9e25',
  // brand prioritari nei menu BRAND: 'stella' (stella gialla ★) o 'maiuscolo' (⭐ e maiuscolo, i brand della casa TEBE)
  brandPrioritari: 'maiuscolo',
  // database della lista di stampa nel browser e nome della sua finestra
  listaStampa: 'tebe-lista-stampa',
  // guida "Dove montare la stampa?": per pagina, le foto in assets/foto/tebe/ (cartelli in morsa sulla rastrelliera:
  // stessa foto, con sopra il cartello della pagina)
  guida: {
    'cartelli_semplici.html': ['morsasemplice.jpg'],
    'cartelli_sale.html': ['morsasale.jpg'],
    'cartelli_brand.html': ['morsabrand.jpg'],
    'cartellopercentuale.html': ['morsapercentuale.jpg'],
    'cartelli_multiarticolo.html': ['morsamultiarticolo.jpg'],
    'albero.html': ['albero.jpg'],
    'cornici10x15.html': ['cornice10x15.jpg'],
    'paletto.html': ['paletto.jpg'],
    'paletto18x12.html': ['paletto.jpg']
  },
  // valori iniziali dell'interfaccia, finché l'utente non sceglie (theme.js)
  interfaccia: { tema: 'light', aspetto: 'minimal' }
});
