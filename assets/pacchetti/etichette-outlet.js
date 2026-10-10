/* Pacchetto Etichette Outlet (vedi assets/js/pacchetti.js): set di partenza di Luxury Outlet, moduli di tipo etichette,
   pagine nella cartella luxury/. I moduli sono le schede della sua dashboard,
   lette dalla dashboard a ogni apertura (origine), senza copia: il set resta sempre allineato. */
Pacchetti.registra('etichette-outlet', {
  nome: 'Pacchetto Etichette Outlet',
  titolo: 'Outlet',   // titolo breve, sopra il carosello in Gestione pacchetti
  tipo: 'etichette',
  cartella: 'luxury',
  negozio: 'luxury',
  descrizione: "Etichette DYMO di Luxury Outlet (57 x 32 mm): outlet doppio prezzo, final price, Last Chance, Luxury Label, promo 50+50, taglie.",
  // le schede sono quelle della sezione dymo-section della dashboard di luxury, lette a ogni apertura (sempre allineate)
  origine: { negozio: 'luxury', sezione: 'dymo-section' }
});
