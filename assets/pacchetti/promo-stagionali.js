/* Pacchetto Promo Stagionali (vedi assets/js/pacchetti.js): set di partenza di Luxury Outlet, moduli di tipo promo,
   pagine nella cartella luxury/. I moduli sono le schede della sua dashboard, copiate così come sono. */
Pacchetti.registra('promo-stagionali', {
  nome: 'Pacchetto Promo Stagionali',
  tipo: 'promo',
  cartella: 'luxury',
  negozio: 'luxury',
  descrizione: "Promo stagionali di Luxury Outlet: Promo Multibrand, Black Friday, Black Friday Lips e Xmas Ball, con menu e grafiche su misura.",
  moduli: [
    { titolo: 'Promo Multibrand ✦', voce: 'Promo Multibrand', link: 'promo_multibrand.html', tipo: 'FASCE COLORE', miniature: ['thumbnail/luxury/promomultibrand.png'],
      alt: 'Anteprima Promo Multibrand', badge: 'MENU SPECIALE', specifiche: ['50% + 50%', 'Fasce Colore', 'Testo Libero', 'I Miei Loghi'] },
    { titolo: 'Black Friday ✦', voce: 'Black Friday', link: 'blackfriday.html', tipo: 'BLACK FRIDAY', miniature: ['thumbnail/luxury/blackfriday.png'],
      alt: 'Anteprima Black Friday', specifiche: ['Brand', 'I Miei Loghi', 'Descrizione', 'Doppio Prezzo', 'Sconto'] },
    { titolo: 'Black Friday Lips ✦', voce: 'Black Friday Lips', link: 'blackfridaylips.html', tipo: 'BLACK FRIDAY', miniature: ['thumbnail/luxury/blackfridaylips.png'],
      alt: 'Anteprima Black Friday Lips', specifiche: ['Grafica Lips', 'Prezzo'] },
    { titolo: 'Xmas Ball ✦', voce: 'Xmas Ball', link: 'xmas_ball.html', tipo: 'CHRISTMAS', miniature: ['thumbnail/luxury/xmasball.png'],
      alt: 'Anteprima Xmas Ball', badge: 'MENU SPECIALE', specifiche: ['Brand', 'I Miei Loghi', 'Colore Palla', 'Doppio Prezzo', 'Sconto'] }
      
  ]
});
