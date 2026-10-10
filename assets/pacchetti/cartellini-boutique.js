/* Pacchetto Cartellini Boutique (vedi assets/js/pacchetti.js): set di partenza di TEBE, moduli di tipo cartellini,
   pagine nella cartella tebe/. I moduli sono le schede della sua dashboard,
   lette dalla dashboard a ogni apertura (origine), senza copia: il set resta sempre allineato. */
Pacchetti.registra('cartellini-boutique', {
  nome: 'Pacchetto Cartellini Boutique',
  titolo: 'Boutique',   // titolo breve, sopra il carosello in Gestione pacchetti
  tipo: 'cartellini',
  cartella: 'tebe',
  negozio: 'tebe',
  descrizione: "Cartellini di TEBE: cartellini TEBE, cartellini LXRY e prezzi vetrina.",
  // le schede sono quelle della sezione tickets-section della dashboard di tebe, lette a ogni apertura (sempre allineate)
  origine: { negozio: 'tebe', sezione: 'tickets-section' }
});
