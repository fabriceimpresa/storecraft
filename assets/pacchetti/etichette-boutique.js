/* Pacchetto Etichette Boutique (vedi assets/js/pacchetti.js): set di partenza di TEBE, moduli di tipo etichette,
   pagine nella cartella tebe/. I moduli sono le schede della sua dashboard,
   lette dalla dashboard a ogni apertura (origine), senza copia: il set resta sempre allineato. */
Pacchetti.registra('etichette-boutique', {
  nome: 'Pacchetto Etichette Boutique',
  titolo: 'Boutique',   // titolo breve, sopra il carosello in Gestione pacchetti
  tipo: 'etichette',
  cartella: 'tebe',
  negozio: 'tebe',
  descrizione: "Etichette DYMO di TEBE (57 x 32 mm): semplice, doppio prezzo, articolo, taglie e taglie brand.",
  // le schede sono quelle della sezione dymo-section della dashboard di tebe, lette a ogni apertura (sempre allineate)
  origine: { negozio: 'tebe', sezione: 'dymo-section' }
});
