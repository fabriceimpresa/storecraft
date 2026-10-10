/* Pacchetto Outlet (vedi assets/js/pacchetti.js): set di partenza di Luxury Outlet, moduli di tipo cartelli,
   pagine nella cartella luxury/. I moduli sono le schede della sua dashboard, copiate così come sono. */
Pacchetti.registra('outlet', {
  nome: 'Pacchetto Outlet',
  tipo: 'cartelli',
  cartella: 'luxury',
  negozio: 'luxury',
  descrizione: "Cartelli di Luxury Outlet: semplice, outlet a doppio prezzo, multi articolo e multi brand, percentuale, Last Chance, paletto da banco e magazzino.",
  moduli: [
    { titolo: 'Semplice', link: 'cartelli_semplici.html', tipo: 'CARTELLO', miniature: ['thumbnail/luxury/cartellosemplice.png'], alt: 'Anteprima Cartello Semplice',
      specifiche: ['Brand', '2° Brand', 'I Miei Loghi', 'Claim', 'Descrizione', 'Prezzo'] },
    { titolo: 'Outlet', link: 'cartelli_outlet.html', tipo: 'CARTELLO', miniature: ['thumbnail/luxury/doppiacifra.png'], alt: 'Anteprima Cartello Outlet',
      specifiche: ['Brand', '2° Brand', 'I Miei Loghi', 'Descrizione', 'Doppio Prezzo', 'Sconto'] },
    { titolo: 'Outlet Multi', link: 'cartelli_outletmulti.html', tipo: 'CARTELLO', miniature: ['thumbnail/luxury/cartellomulti.png'], alt: 'Anteprima Cartello Outlet Multi',
      specifiche: ['Brand', '2° Brand', 'I Miei Loghi', '2 o 3 Articoli', 'Descrizione', 'Doppio Prezzo', 'Sconto'] },
    { titolo: 'Multi Brand', link: 'cartelli_multireferenza.html', tipo: 'CARTELLO', miniature: ['thumbnail/luxury/duereferenze.png'], alt: 'Anteprima Cartello Multi Articolo',
      specifiche: ['Brand', '2° Brand', 'I Miei Loghi', '2 o 3 Articoli', 'Descrizione', 'Prezzo'] },
    { titolo: 'Percentuale', link: 'cartellopercentuale.html', tipo: 'CARTELLO', miniature: ['thumbnail/luxury/percentuale.png'], alt: 'Anteprima Promo Percentuale',
      specifiche: ['Brand', '2° Brand', 'I Miei Loghi', 'Descrizione', 'Sconto %'] },
    { titolo: 'Last Chance', link: 'cartelli_lastchance.html', tipo: 'CARTELLO', miniature: ['thumbnail/luxury/promolastchance.png'], alt: 'Anteprima Promo Last Chance',
      specifiche: ['Logo Last Chance', 'Brand', 'I Miei Loghi', 'Claim', 'Prezzo'] },
    { titolo: 'Paletto 15x10', link: 'cartello_banco.html', tipo: 'PALETTO FERRO', miniature: ['thumbnail/luxury/cartellobanco.png'], alt: 'Anteprima Cartello da Banco',
      specifiche: ['Formato 15x10', 'Brand', '2° Brand', 'I Miei Loghi', 'Descrizione', 'Doppio Prezzo', 'Sconto'] },
    { titolo: 'Magazzino', link: 'magazzino.html', tipo: 'CARTELLO', miniature: ['thumbnail/luxury/magazzinothumb.png'], alt: 'Anteprima Cartelli Magazzino',
      specifiche: ['Brand', 'I Miei Loghi', 'Categorie', 'Frecce Direzionali', 'Formato Pagina'] }
      
  ]
});
