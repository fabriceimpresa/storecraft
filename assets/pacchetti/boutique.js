/* Pacchetto Boutique (vedi assets/js/pacchetti.js): set di partenza di TEBE, moduli di tipo cartelli,
   pagine nella cartella tebe/. I moduli sono le schede della sua dashboard,
   lette dalla dashboard a ogni apertura (origine), senza copia: il set resta sempre allineato. */
Pacchetti.registra('boutique', {
  nome: 'Pacchetto Boutique',
  titolo: 'Boutique',   // titolo breve, sopra il carosello in Gestione pacchetti
  tipo: 'cartelli',
  cartella: 'tebe',
  negozio: 'tebe',
  descrizione: "Cartelli di TEBE: cartelli stretti e lunghi in morsa (semplice, sale, percentuale, brand, multi articolo), albero accessori, cornici e paletti.",
  // le schede sono quelle della sezione generators-section della dashboard di tebe, lette a ogni apertura (sempre allineate)
  origine: { negozio: 'tebe', sezione: 'generators-section' }
});
