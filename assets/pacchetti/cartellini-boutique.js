/* Pacchetto Cartellini Boutique (vedi assets/js/pacchetti.js): set di partenza di TEBE, moduli di tipo cartellini,
   pagine nella cartella tebe/. I moduli sono le schede della sua dashboard, copiate così come sono. */
Pacchetti.registra('cartellini-boutique', {
  nome: 'Pacchetto Cartellini Boutique',
  tipo: 'cartellini',
  cartella: 'tebe',
  negozio: 'tebe',
  descrizione: "Cartellini di TEBE: cartellini TEBE, cartellini LXRY e prezzi vetrina.",
  moduli: [
    { titolo: 'Cartellini TEBE', link: 'cartellinitebe.html', tipo: 'CARTELLINI', miniature: ['thumbnail/tebe/cartellinitebethumb.png?v=20260930', 'thumbnail/tebe/cartellinitebethumb-2.png?v=20260930'] },
    { titolo: 'Cartellini LXRY', link: 'cartellinilxry.html', tipo: 'CARTELLINI', miniature: ['thumbnail/tebe/cartellinithumb.png?v=20260930b', 'thumbnail/tebe/cartellinithumb-2.png?v=20260930b'] },
    { titolo: 'Prezzi Vetrina', link: 'prezzivetrina.html', tipo: 'CARTELLINI', miniature: ['thumbnail/tebe/prezzivetrinathumb.png?v=20260930b', 'thumbnail/tebe/prezzivetrinathumb-2.png?v=20260930b'] }
      
  ]
});
