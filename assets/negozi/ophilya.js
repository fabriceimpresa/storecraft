/* Scheda del negozio OPHILYA (vedi assets/js/negozi.js). I colori sono in ophilya.css. */
Negozi.registra('ophilya', {
  nome: 'OPHILYA',
  sigla: 'OPHILYA',
  // logo della splash page, nella cartella assets/
  logoSplash: 'img/ophilya/ophilyablack.png',
  // larghezza del logo nella splash page, in px
  logoSplashLarghezza: 150,
  // indirizzo del negozio e logo del menu del telefono (PROFILO UTENTE e lista NEGOZI), lo stesso della dashboard
  indirizzo: 'VIA DEL CORSO 268',
  indirizzoBreve: 'CORSO 268',   // nel menu da computer, più stretto
  logoMenu: 'img/ophilya/ophilyablack.png',
  logoMenuLarghezza: 205,
  // oro dei loghi ricolorati per la stampa e della variante gold dei loghi ufficiali (loghi-ufficiali.html): per ora come TEBE
  oro: '#cc9e25',
  // brand prioritari nei menu BRAND: 'stella' (stella gialla ★) o 'maiuscolo' (⭐ e maiuscolo, come TEBE)
  brandPrioritari: 'maiuscolo',
  // database della lista di stampa nel browser e nome della sua finestra
  listaStampa: 'ophilya-lista-stampa',
  // database della cronologia di stampa nel browser (cronologia-stampa.js): le stampe degli ultimi 7 giorni
  cronologiaStampa: 'ophilya-cronologia-stampa',
  // guida "Dove montare la stampa?": per pagina, le foto in assets/foto/ophilya/ (senza foto: riquadri "Foto in arrivo")
  guida: {
    'albero-ophilya.html': ['alberoophilya.jpg'],
    'paletto-ophilya.html': ['palettoophilya.jpg'],
    'paletto18x12-ophilya.html': ['palettoophilya.jpg']
  },
  // valori iniziali dell'interfaccia, finché l'utente non sceglie (theme.js)
  interfaccia: { tema: 'light', aspetto: 'minimal' },
  // niente vista schermi piccoli (responsive.js): il PC del negozio ha già una regolazione propria (27 ottobre 2026)
  schermiPiccoli: false
});
