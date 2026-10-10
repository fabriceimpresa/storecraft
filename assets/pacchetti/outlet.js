/* Pacchetto Outlet (vedi assets/js/pacchetti.js): set di partenza di Luxury Outlet, moduli di tipo cartelli,
   pagine nella cartella luxury/. I moduli sono le schede della sua dashboard,
   lette dalla dashboard a ogni apertura (origine), senza copia: il set resta sempre allineato. */
Pacchetti.registra('outlet', {
  nome: 'Pacchetto Outlet',
  titolo: 'Outlet',   // titolo breve, sopra il carosello in Gestione pacchetti
  tipo: 'cartelli',
  cartella: 'luxury',
  negozio: 'luxury',
  descrizione: "Cartelli di Luxury Outlet: semplice, outlet a doppio prezzo, multi articolo e multi brand, percentuale, Last Chance, paletto da banco e magazzino.",
  // le schede sono quelle della sezione generators-section della dashboard di luxury, lette a ogni apertura (sempre allineate)
  origine: { negozio: 'luxury', sezione: 'generators-section' }
});
