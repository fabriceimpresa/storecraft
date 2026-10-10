/* Pacchetto Cartellini Outlet (vedi assets/js/pacchetti.js): set di partenza di Luxury Outlet, moduli di tipo cartellini,
   pagine nella cartella luxury/. I moduli sono le schede della sua dashboard,
   lette dalla dashboard a ogni apertura (origine), senza copia: il set resta sempre allineato. */
Pacchetti.registra('cartellini-outlet', {
  nome: 'Pacchetto Cartellini Outlet',
  titolo: 'Outlet',   // titolo breve, sopra il carosello in Gestione pacchetti
  tipo: 'cartellini',
  cartella: 'luxury',
  negozio: 'luxury',
  descrizione: "Cartellini di Luxury Outlet: vetrina, promozionali, quadrati e prezzi vetrina.",
  // le schede sono quelle della sezione tickets-section della dashboard di luxury, lette a ogni apertura (sempre allineate)
  origine: { negozio: 'luxury', sezione: 'tickets-section' }
});
