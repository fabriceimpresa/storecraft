/* Scheda del negozio OPHILYA (vedi assets/js/negozi.js). I colori sono in ophilya.css. */
Negozi.registra('ophilya', {
  nome: 'OPHILYA',
  sigla: 'OPHILYA',
  // logo della splash page, nella cartella assets/
  logoSplash: 'img/ophilya/ophilyablack.png',
  // larghezza del logo nella splash page, in px
  logoSplashLarghezza: 150,
  // oro dei loghi ricolorati per la stampa e della variante gold dei loghi ufficiali (logoimport): per ora come TEBE
  oro: '#cc9e25',
  // brand prioritari nei menu BRAND: 'stella' (stella gialla ★) o 'maiuscolo' (⭐ e maiuscolo, come TEBE)
  brandPrioritari: 'maiuscolo',
  // database della lista di stampa nel browser e nome della sua finestra
  listaStampa: 'ophilya-lista-stampa',
  // guida "Dove montare la stampa?": per pagina, le foto in assets/foto/ophilya/ (senza foto: riquadri "Foto in arrivo")
  guida: {
    'paletto-ophilya.html': ['palettoophilya.jpg'],
    'paletto18x12-ophilya.html': ['palettoophilya.jpg']
  },
  // valori iniziali dell'interfaccia, finché l'utente non sceglie (theme.js)
  interfaccia: { tema: 'light', aspetto: 'minimal' }
});
