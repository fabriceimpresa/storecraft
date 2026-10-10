/* Nuova Galleria (vedi assets/js/pacchetti.js): galleria creata in Gestione pacchetti, moduli di tipo cartelli. Ogni
   modulo ha la cartella delle sue pagine (cartella); si associa ai negozi dalla sua scheda. */
Pacchetti.registra('galleria-1', {
  nome: 'Nuova Galleria',
  titolo: 'Nuova Galleria',   // titolo breve, sopra il carosello in Gestione pacchetti
  tipo: 'cartelli',
  moduli: [
    { titolo: 'NEW Percentuale - Test', tipo: 'CARTELLO', alt: 'Anteprima NEW Percentuale - Test', specifiche: ['Brand', '2° Brand', 'I Miei Loghi', 'Descrizione', 'Sconto %'], link: 'new-percentuale-test.html', miniature: ['../moduli/miniature/new-percentuale-test.jpg'], cartella: 'moduli' }
  ]
});
