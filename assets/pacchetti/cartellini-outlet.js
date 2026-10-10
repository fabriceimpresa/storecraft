/* Pacchetto Cartellini Outlet (vedi assets/js/pacchetti.js): set di partenza di Luxury Outlet, moduli di tipo cartellini,
   pagine nella cartella luxury/. I moduli sono le schede della sua dashboard, copiate così come sono. */
Pacchetti.registra('cartellini-outlet', {
  nome: 'Pacchetto Cartellini Outlet',
  tipo: 'cartellini',
  cartella: 'luxury',
  negozio: 'luxury',
  descrizione: "Cartellini di Luxury Outlet: vetrina, promozionali, quadrati e prezzi vetrina.",
  moduli: [
    { titolo: 'Vetrina', link: 'cartellinivetrina.html', tipo: 'CARTELLINI', miniature: ['thumbnail/luxury/cartellini.png'], alt: 'Anteprima Cartellini Vetrina',
      specifiche: ['Brand', 'I Miei Loghi', 'Descrizione', 'Doppio Prezzo', 'Sconto'] },
    { titolo: 'Promozionali', link: 'cartellinipromo.html', tipo: 'CARTELLINI', miniature: ['thumbnail/luxury/cartellinipromo.png'], alt: 'Anteprima Cartellini Promozionali',
      specifiche: ['Brand', 'I Miei Loghi', 'Promozione', 'Evento', 'Doppio Prezzo', 'Sconto'] },
    { titolo: 'Quadrati', link: 'cartelliniquadrati.html', tipo: 'CARTELLINI', miniature: ['thumbnail/luxury/cartelliniquadrati.png'], alt: 'Anteprima Quadrati',
      specifiche: ['Brand', 'I Miei Loghi', 'Descrizione', 'Doppio Prezzo', 'Sconto', 'Tema Sale'] },
    { titolo: 'Prezzi Vetrina', link: 'prezzivetrina.html', tipo: 'CARTELLINI', miniature: ['thumbnail/luxury/prezzivetrina.png'], alt: 'Anteprima Prezzi Vetrina',
      specifiche: ['Fasce Prezzo', 'Promozione', '24 cartellini'] }
      
  ]
});
