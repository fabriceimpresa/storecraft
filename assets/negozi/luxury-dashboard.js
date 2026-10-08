/* Contenuto della dashboard di Luxury Outlet (vedi assets/js/dashboard.js). Immagini e PDF nella cartella assets/. */
Dashboard.contenuto({
  intestazione: {
    titolo: 'Visual Merchandising & Cassa',
    sottotitolo: 'Crea la grafica promozionale e calcola i prezzi in tempo reale.'
  },
  logo: { src: 'img/luxury/printlogos/blackLXRY_BRAND.png', larghezza: 205, alt: 'LUXURY OUTLET' },
  identita: ['VIA DEL CORSO 15', 'OUTLET MULTI BRAND · LINEA LXRY'],
  qr: 'https://instagram.com/luxuryoutletroma',
  cassa: 'sempre',
  etichette: 'etichette.html?label=outlet',
  sezioni: [
    {
      id: 'generators-section', carosello: 'generators-carousel', titolo: 'Genera Cartelli', tipo: 'cartelli',
      schede: [
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
    },
    {
      id: 'seasonal-promo-section', carosello: 'seasonal-promo-carousel', titolo: 'Promo Stagionali', tipo: 'promo',
      schede: [
        { titolo: 'Promo Multibrand ✦', voce: 'Promo Multibrand', link: 'promo_multibrand.html', tipo: 'FASCE COLORE', miniature: ['thumbnail/luxury/promomultibrand.png'],
          alt: 'Anteprima Promo Multibrand', badge: 'MENU SPECIALE', specifiche: ['50% + 50%', 'Fasce Colore', 'Testo Libero', 'I Miei Loghi'] },
        { titolo: 'Black Friday ✦', voce: 'Black Friday', link: 'blackfriday.html', tipo: 'BLACK FRIDAY', miniature: ['thumbnail/luxury/blackfriday.png'],
          alt: 'Anteprima Black Friday', specifiche: ['Brand', 'I Miei Loghi', 'Descrizione', 'Doppio Prezzo', 'Sconto'] },
        { titolo: 'Black Friday Lips ✦', voce: 'Black Friday Lips', link: 'blackfridaylips.html', tipo: 'BLACK FRIDAY', miniature: ['thumbnail/luxury/blackfridaylips.png'],
          alt: 'Anteprima Black Friday Lips', specifiche: ['Grafica Lips', 'Prezzo'] },
        { titolo: 'Xmas Ball ✦', voce: 'Xmas Ball', link: 'xmas_ball.html', tipo: 'CHRISTMAS', miniature: ['thumbnail/luxury/xmasball.png'],
          alt: 'Anteprima Xmas Ball', badge: 'MENU SPECIALE', specifiche: ['Brand', 'I Miei Loghi', 'Colore Palla', 'Doppio Prezzo', 'Sconto'] }
      ]
    },
    {
      id: 'tickets-section', carosello: 'tickets-carousel', titolo: 'Genera Cartellini', tipo: 'cartellini',
      schede: [
        { titolo: 'Vetrina', link: 'cartellinivetrina.html', tipo: 'CARTELLINI', miniature: ['thumbnail/luxury/cartellini.png'], alt: 'Anteprima Cartellini Vetrina',
          specifiche: ['Brand', 'I Miei Loghi', 'Descrizione', 'Doppio Prezzo', 'Sconto'] },
        { titolo: 'Promozionali', link: 'cartellinipromo.html', tipo: 'CARTELLINI', miniature: ['thumbnail/luxury/cartellinipromo.png'], alt: 'Anteprima Cartellini Promozionali',
          specifiche: ['Brand', 'I Miei Loghi', 'Promozione', 'Evento', 'Doppio Prezzo', 'Sconto'] },
        { titolo: 'Quadrati', link: 'cartelliniquadrati.html', tipo: 'CARTELLINI', miniature: ['thumbnail/luxury/cartelliniquadrati.png'], alt: 'Anteprima Quadrati',
          specifiche: ['Brand', 'I Miei Loghi', 'Descrizione', 'Doppio Prezzo', 'Sconto', 'Tema Sale'] },
        { titolo: 'Prezzi Vetrina', link: 'prezzivetrina.html', tipo: 'CARTELLINI', miniature: ['thumbnail/luxury/prezzivetrina.png'], alt: 'Anteprima Prezzi Vetrina',
          specifiche: ['Fasce Prezzo', 'Promozione', '24 cartellini'] }
      ]
    },
    {
      id: 'dymo-section', carosello: 'dymo-carousel', titolo: 'Etichette Dymo', tipo: 'etichette',
      schede: [
        { titolo: 'Outlet Doppio Prezzo', link: 'etichette.html?label=doppioprezzo', tipo: '57 x 32 MM', miniature: ['thumbnail/luxury/doppioprezzo.png?v=20261005-01'], alt: '1. Outlet Doppio Prezzo' },
        { titolo: 'Final | Outlet Price', link: 'etichette.html?label=finalprice', tipo: '57 x 32 MM', miniature: ['thumbnail/luxury/finalprice.png?v=20261005-01'], alt: '2. Final | Outlet Price' },
        { titolo: 'Last Chance', link: 'etichette.html?label=lastchance', tipo: '57 x 32 MM', miniature: ['thumbnail/luxury/lastchance.png'], alt: '3. Last Chance' },
        { titolo: 'Luxury Label', link: 'etichette.html?label=outlet', tipo: '57 x 32 MM', miniature: ['thumbnail/luxury/outlet.png'], alt: '4. Luxury Label' },
        { titolo: 'Promo 50+50', link: 'etichette.html?label=promo50', tipo: '57 x 32 MM', miniature: ['thumbnail/luxury/promo50.png'], alt: '5. Promo 50+50' },
        { titolo: 'Taglie | Doppia Cifra', link: 'etichette.html?label=tagliedoppiacifra', tipo: '57 x 32 MM', miniature: ['thumbnail/luxury/tagliedoppiacifra.png'], alt: '6. Taglie | Doppia Cifra' }
      ]
    },
    {
      id: 'prints-section', carosello: 'prints-carousel', titolo: 'Stampe Pronte // Listini & Punto Vendita', tipo: 'stampe',
      voceMenu: 'Listini & Punto Vendita',
      schede: [
        { titolo: 'Catalogo Fürstenberg', pdf: 'pdf/luxury/egoncatalogo.pdf', tipo: 'PDF', miniature: ['thumbnail/luxury/egoncatalogo.png'], alt: 'Catalogo Egon Von Fürstenberg', icona: '📄' },
        { titolo: 'Listino Fürstenberg', pdf: 'pdf/luxury/egonlistino.pdf', tipo: 'PDF', miniature: ['thumbnail/luxury/egonlistino.png'], alt: 'Listino Egon Von Fürstenberg', icona: '📄' },
        { titolo: 'Taglie Internazionali', pdf: 'pdf/luxury/taglie.pdf', tipo: 'PDF', miniature: ['thumbnail/luxury/taglie.png'], alt: 'Taglie Internazionali', icona: '🏷️' },
        { titolo: 'Orari Apertura', pdf: 'pdf/luxury/orari.pdf', tipo: 'PDF', miniature: ['thumbnail/luxury/orari.png'], alt: 'Orari Apertura', icona: '🕒' },
        { titolo: 'No Food & Drinks Indoor', pdf: 'pdf/luxury/nofood_indoor.pdf', tipo: 'PDF', miniature: ['thumbnail/luxury/nofoodindoor.png'], alt: 'No Food Drinks Indoor', icona: '🚫' },
        { titolo: 'No Food & Drinks Outdoor', pdf: 'pdf/luxury/nofood_outdoor.pdf', tipo: 'PDF', miniature: ['thumbnail/luxury/nofoodoutdoor.png'], alt: 'No Food Drinks Outdoor', icona: '🥤' },
        { titolo: 'Staff Only', pdf: 'pdf/luxury/staffonly.pdf', tipo: 'PDF', miniature: ['thumbnail/luxury/staffonly.png'], alt: 'Staff Only', icona: '🔒' },
        { titolo: 'Vietato Fumare', pdf: 'pdf/luxury/vietatofumare.pdf', tipo: 'PDF', miniature: ['thumbnail/luxury/vietatofumare.png'], alt: 'Vietato Fumare', icona: '🚭' }
      ]
    },
    {
      id: 'prints-promo-section', carosello: 'prints-promo-carousel', titolo: "Allestimenti Pronti // Operazioni Fast 'N' Beautiful", tipo: 'stampe',
      voceMenu: "Fast 'N' Beautiful", stella: true,
      schede: [
        { titolo: 'Set Last Chance ✦', pdf: 'pdf/luxury/lastchance.pdf', tipo: 'PDF', miniature: ['thumbnail/luxury/lastchancepronte.png'], alt: 'Collezione Last Chance', icona: '🏷️' },
        { titolo: 'Last Chance Verticale ✦', pdf: 'pdf/luxury/lastchanceverticali.pdf', tipo: 'PDF', miniature: ['thumbnail/luxury/lastchanceprontevert.png'], alt: 'Collezione Last Chance Verticale', icona: '🏷️', compatto: true },
        { titolo: 'SET WINTER SALE ✦', pdf: 'pdf/luxury/wintersale.pdf', tipo: 'PDF', miniature: ['thumbnail/luxury/wintersalethumb.jpg'], alt: 'Set Winter Sale', icona: '❄️' },
        { titolo: 'SET WINTER SALE VERT ✦', pdf: 'pdf/luxury/wintersalevert.pdf', tipo: 'PDF', miniature: ['thumbnail/luxury/wintersalevertthumb.jpg'], alt: 'Set Winter Sale Vert', icona: '❄️', compatto: true },
        { titolo: 'SET SUMMER SALE ✦', pdf: 'pdf/luxury/summersale.pdf', tipo: 'PDF', miniature: ['thumbnail/luxury/summersalethumb.jpg'], alt: 'Set Summer Sale', icona: '☀️' },
        { titolo: 'SET SUMMER SALE VERT ✦', pdf: 'pdf/luxury/summersalevert.pdf', tipo: 'PDF', miniature: ['thumbnail/luxury/summersalevertthumb.jpg'], alt: 'Set Summer Vert', icona: '☀️', compatto: true },
        { titolo: 'SET SPRING SALE ✦', pdf: 'pdf/luxury/springsale.pdf', tipo: 'PDF', miniature: ['thumbnail/luxury/springsalethumb.jpg'], alt: 'Set Spring Sale', icona: '🌸' },
        { titolo: 'SET SPRING SALE VERT ✦', pdf: 'pdf/luxury/springsalevert.pdf', tipo: 'PDF', miniature: ['thumbnail/luxury/springsalevertthumb.jpg'], alt: 'Set Spring Sale Vert', icona: '🌸', compatto: true }
      ]
    }
  ]
});
