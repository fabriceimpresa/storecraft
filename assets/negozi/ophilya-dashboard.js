/* Contenuto della dashboard di OPHILYA (vedi assets/js/dashboard.js). Immagini e PDF nella cartella assets/.
   Le pagine di TEBE non ancora pronte per OPHILYA restano in Coming Soon; le Utilità Cassa solo in CASSIERE. */
Dashboard.contenuto({
  // al posto del titolo, l'interruttore tra TEBE e OPHILYA (se installati tutti e due)
  intestazione: { interruttore: ['tebe', 'ophilya'], titolo: 'Visual Merchandising & Cassa' },
  logo: { src: 'img/ophilya/ophilyablack.png', larghezza: 205, alt: 'OPHILYA' },
  identita: ['VIA DEL CORSO 268', 'LEATHER GOODS · MADE IN ITALY'],
  qr: 'https://www.instagram.com/tebe_269/',
  cassa: 'solo-cassiere',
  icona: 'img/ophilya/favicon.ico?v=20260930c',
  etichette: 'etichetteophilya.html',
  sezioni: [
    {
      id: 'generators-section', carosello: 'generators-carousel', titolo: 'Crea Cartelli', tipo: 'cartelli',
      schede: [
        { titolo: 'Albero Accessori', link: 'albero-ophilya.html', tipo: 'RASTRELLIERA', miniature: ['thumbnail/ophilya/alberoophilyathumb.png?v=20261002', 'thumbnail/ophilya/alberoophilyathumb2.png'], alt: 'Albero Accessori OPHILYA' },
        { titolo: 'Paletto 15x10', link: 'paletto-ophilya.html', tipo: 'PALETTO METALLO', miniature: ['thumbnail/ophilya/palettoophilyathumb.png', 'thumbnail/ophilya/palettothumb-2.png'], alt: 'Paletto 15x10 OPHILYA' },
        { titolo: 'Paletto 18x12', link: 'paletto18x12-ophilya.html', tipo: 'PALETTO METALLO', miniature: ['thumbnail/ophilya/palettoophilyathumb.png', 'thumbnail/ophilya/palettothumb-2.png'], alt: 'Paletto 18x12 OPHILYA' },
        { titolo: 'Semplice', tipo: 'CARTELLO', prossimamente: true },
        { titolo: 'Sale', tipo: 'CARTELLO', prossimamente: true },
        { titolo: 'Percentuale', tipo: 'CARTELLO', prossimamente: true },
        { titolo: 'Brand', tipo: 'CARTELLO', prossimamente: true },
        { titolo: 'Multi Articolo', tipo: 'CARTELLO', prossimamente: true },
        { titolo: 'Cornici 10x15', tipo: 'CORNICE', prossimamente: true },
        { titolo: 'Cornice 21x27', tipo: 'CORNICE', prossimamente: true }
      ]
    },
    {
      id: 'tickets-section', carosello: 'tickets-carousel', titolo: 'Cartellini', tipo: 'cartellini',
      schede: [
        { titolo: 'Cartellini', tipo: 'CARTELLINI', prossimamente: true },
        { titolo: 'Cartellini LXRY', tipo: 'CARTELLINI', prossimamente: true },
        { titolo: 'Prezzi Vetrina', tipo: 'CARTELLINI', prossimamente: true }
      ]
    },
    {
      id: 'dymo-section', carosello: 'dymo-carousel', titolo: 'Etichette Dymo', tipo: 'etichette',
      schede: [
        { titolo: 'Semplice', link: 'etichetteophilya.html', tipo: '57 x 32 MM', miniature: ['thumbnail/ophilya/label1thumb-ophilya.png'], alt: 'Anteprima etichetta Semplice' },
        { titolo: 'Doppio Prezzo', link: 'etichetteophilya.html?label=doppioprezzo', tipo: '57 x 32 MM', miniature: ['thumbnail/ophilya/label2thumb-ophilya.png'], alt: 'Anteprima etichetta Doppio Prezzo' },
        { titolo: 'Articolo', link: 'etichetteophilya.html?label=promo', tipo: '57 x 32 MM', miniature: ['thumbnail/ophilya/label3thumb-ophilya.png'], alt: 'Anteprima etichetta Articolo' },
        { titolo: 'Taglie', link: 'etichetteophilya.html?label=tagliedoppiacifra', tipo: '57 x 32 MM', miniature: ['thumbnail/ophilya/label4thumb-ophilya.png'], alt: 'Anteprima etichetta Taglie' }
      ]
    },
    {
      id: 'prints-section', carosello: 'prints-carousel', titolo: 'Materiali Pronti', tipo: 'stampe', voceMenu: 'Materiali Pronti',
      schede: [
        { titolo: 'Taglie Internazionali', pdf: 'pdf/ophilya/taglie.pdf', tipo: 'PDF', miniature: ['thumbnail/ophilya/taglieinternazionalithumb.png'], icona: '🏷️' },
        { titolo: 'Orari', pdf: 'pdf/ophilya/orari-ophilya.pdf', tipo: 'PDF', miniature: ['thumbnail/ophilya/orarithumb-ophilya.png'], icona: '🕒' },
        { titolo: 'Staff Only', pdf: 'pdf/ophilya/staffonly-ophilya.pdf', tipo: 'PDF', miniature: ['thumbnail/ophilya/staffthumb-ophilya.png'], icona: '🔒' },
        { titolo: 'Cercasi Personale', pdf: 'pdf/ophilya/cercasi-ophilya.pdf', tipo: 'PDF', miniature: ['thumbnail/ophilya/cercasithumb-ophilya.png'], icona: '📄' },
        { titolo: 'No Food & Drinks', pdf: 'pdf/ophilya/nofood_indoor-ophilya.pdf', tipo: 'PDF', miniature: ['thumbnail/ophilya/nofoodthumb-ophilya.png'], icona: '🚫' },
        { titolo: 'Vietato Fumare', pdf: 'pdf/ophilya/vietatofumare.pdf', tipo: 'PDF', miniature: ['thumbnail/ophilya/fumothumb.png'], icona: '🚭' }
      ]
    }
  ]
});
