/* Pacchetto Boutique (vedi assets/js/pacchetti.js): set di partenza di TEBE, moduli di tipo cartelli,
   pagine nella cartella tebe/. I moduli sono le schede della sua dashboard, copiate così come sono. */
Pacchetti.registra('boutique', {
  nome: 'Pacchetto Boutique',
  tipo: 'cartelli',
  cartella: 'tebe',
  negozio: 'tebe',
  descrizione: "Cartelli di TEBE: cartelli stretti e lunghi in morsa (semplice, sale, percentuale, brand, multi articolo), albero accessori, cornici e paletti.",
  moduli: [
    { titolo: 'Semplice', link: 'cartelli_semplici.html', tipo: 'CARTELLO', miniature: ['thumbnail/tebe/semplicethumb.png', 'thumbnail/tebe/semplicethumb-2.png'] },
    { titolo: 'Sale', link: 'cartelli_sale.html', tipo: 'CARTELLO', miniature: ['thumbnail/tebe/salethumb.png', 'thumbnail/tebe/salethumb-2.png'] },
    { titolo: 'Percentuale', link: 'cartellopercentuale.html', tipo: 'CARTELLO', miniature: ['thumbnail/tebe/percentualethumb.png', 'thumbnail/tebe/percentualethumb-2.png'] },
    { titolo: 'Brand', link: 'cartelli_brand.html', tipo: 'CARTELLO', miniature: ['thumbnail/tebe/brandthumb.png', 'thumbnail/tebe/brandthumb-2.png'] },
    { titolo: 'Multi Articolo', link: 'cartelli_multiarticolo.html', tipo: 'CARTELLO', miniature: ['thumbnail/tebe/multithumb.png', 'thumbnail/tebe/multithumb-2.png'] },
    { titolo: 'Albero Accessori', link: 'albero.html', tipo: 'RASTRELLIERA', miniature: ['thumbnail/tebe/alberothumb.png', 'thumbnail/tebe/alberothumb2.png'] },
    { titolo: 'Cornici 10x15', voce: 'Cornici 10 x 15', link: 'cornici10x15.html', tipo: 'CORNICE', miniature: ['thumbnail/tebe/cornicithumb.png', 'thumbnail/tebe/cornicithumb-2.png'], alt: 'Cornice 10x15' },
    { titolo: 'Cornice 21x27', voce: 'Cornice 21 x 27', link: 'cornice21x27.html', tipo: 'CORNICE', miniature: ['thumbnail/tebe/cornice21x27thumb.png', 'thumbnail/tebe/cornice21x27thumb-2.png'] },
    { titolo: 'Paletto 15x10', link: 'paletto.html', tipo: 'PALETTO METALLO', miniature: ['thumbnail/tebe/palettothumb.png', 'thumbnail/tebe/palettothumb-2.png'] },
    { titolo: 'Paletto 18x12', link: 'paletto18x12.html', tipo: 'PALETTO METALLO', miniature: ['thumbnail/tebe/palettothumb.png', 'thumbnail/tebe/palettothumb-2.png'] }
      
  ]
});
