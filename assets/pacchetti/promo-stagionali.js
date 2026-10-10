/* Pacchetto Promo Stagionali (vedi assets/js/pacchetti.js): set di partenza di Luxury Outlet, moduli di tipo promo,
   pagine nella cartella luxury/. I moduli sono le schede della sua dashboard,
   lette dalla dashboard a ogni apertura (origine), senza copia: il set resta sempre allineato. */
Pacchetti.registra('promo-stagionali', {
  nome: 'Pacchetto Promo Stagionali',
  titolo: 'Promozioni Stagionali',   // titolo breve, sopra il carosello in Gestione pacchetti
  tipo: 'promo',
  cartella: 'luxury',
  negozio: 'luxury',
  descrizione: "Promo stagionali di Luxury Outlet: Promo Multibrand, Black Friday, Black Friday Lips e Xmas Ball, con menu e grafiche su misura.",
  // le schede sono quelle della sezione seasonal-promo-section della dashboard di luxury, lette a ogni apertura (sempre allineate)
  origine: { negozio: 'luxury', sezione: 'seasonal-promo-section' }
});
