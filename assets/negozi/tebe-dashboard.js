/* Contenuto della dashboard di TEBE (vedi assets/js/dashboard.js). Immagini e PDF nella cartella assets/. */
Dashboard.contenuto({
  intestazione: {
    titolo: 'Visual Merchandising Studio',
    sottotitolo: 'Crea la tua grafica promozionale in tempo reale',
    // in più, accanto al selettore CASSIERE / CREATOR, l'interruttore tra TEBE e OPHILYA (se installati tutti e due)
    interruttore: ['tebe', 'ophilya']
  },
  logo: { src: 'img/tebe/tebeblack.png', larghezza: 205, alt: 'TEBE' },
  identita: ['VIA DEL CORSO 269', 'MODA DONNA · BRANDS · LINEA 269'],
  qr: 'https://www.instagram.com/tebe_269/',
  cassa: 'sempre',
  etichette: 'etichette.html',
  sezioni: [
    {
      id: 'generators-section', carosello: 'generators-carousel', titolo: 'Crea Cartelli', tipo: 'cartelli',
      schede: [
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
    },
    {
      id: 'tickets-section', carosello: 'tickets-carousel', titolo: 'Cartellini', tipo: 'cartellini',
      schede: [
        { titolo: 'Cartellini TEBE', link: 'cartellinitebe.html', tipo: 'CARTELLINI', miniature: ['thumbnail/tebe/cartellinitebethumb.png?v=20260930', 'thumbnail/tebe/cartellinitebethumb-2.png?v=20260930'] },
        { titolo: 'Cartellini LXRY', link: 'cartellinilxry.html', tipo: 'CARTELLINI', miniature: ['thumbnail/tebe/cartellinithumb.png?v=20260930b', 'thumbnail/tebe/cartellinithumb-2.png?v=20260930b'] },
        { titolo: 'Prezzi Vetrina', link: 'prezzivetrina.html', tipo: 'CARTELLINI', miniature: ['thumbnail/tebe/prezzivetrinathumb.png?v=20260930b', 'thumbnail/tebe/prezzivetrinathumb-2.png?v=20260930b'] }
      ]
    },
    {
      id: 'dymo-section', carosello: 'dymo-carousel', titolo: 'Etichette Dymo', tipo: 'etichette',
      schede: [
        { titolo: 'Semplice', link: 'etichette.html', tipo: '57 x 32 MM', miniature: ['thumbnail/tebe/label1thumb.png'], alt: 'Anteprima etichetta Semplice' },
        { titolo: 'Doppio Prezzo', link: 'etichette.html?label=doppioprezzo', tipo: '57 x 32 MM', miniature: ['thumbnail/tebe/label2thumb.png'], alt: 'Anteprima etichetta Doppio Prezzo' },
        { titolo: 'Articolo', link: 'etichette.html?label=promo', tipo: '57 x 32 MM', miniature: ['thumbnail/tebe/label3thumb.png'], alt: 'Anteprima etichetta Articolo' },
        { titolo: 'Taglie', link: 'etichette.html?label=tagliedoppiacifra', tipo: '57 x 32 MM', miniature: ['thumbnail/tebe/label4thumb.png'], alt: 'Anteprima etichetta Taglie' },
        { titolo: 'Taglie Brand', link: 'etichette.html?label=tagliebrand', tipo: '57 x 32 MM', miniature: ['thumbnail/tebe/label5thumb.png'], alt: 'Anteprima etichetta Taglie Brand' }
      ]
    },
    {
      id: 'prints-section', carosello: 'prints-carousel', titolo: 'Materiali Pronti', tipo: 'stampe', voceMenu: 'Materiali Pronti',
      schede: [
        { titolo: 'Taglie Internazionali', pdf: 'pdf/tebe/taglie.pdf', tipo: 'PDF', miniature: ['thumbnail/tebe/taglieinternazionalithumb.png'], icona: '🏷️' },
        { titolo: 'Orari', pdf: 'pdf/tebe/orari.pdf', tipo: 'PDF', miniature: ['thumbnail/tebe/orarithumb.png'], icona: '🕒' },
        { titolo: 'Staff Only', pdf: 'pdf/tebe/staffonly.pdf', tipo: 'PDF', miniature: ['thumbnail/tebe/staffthumb.png'], icona: '🔒' },
        { titolo: 'Cercasi Personale', pdf: 'pdf/tebe/cercasi.pdf', tipo: 'PDF', miniature: ['thumbnail/tebe/cercasithumb.png'], icona: '📄' },
        { titolo: 'No Food & Drinks', pdf: 'pdf/tebe/nofood_indoor.pdf', tipo: 'PDF', miniature: ['thumbnail/tebe/nofoodthumb.png'], icona: '🚫' },
        { titolo: 'Vietato Fumare', pdf: 'pdf/tebe/vietatofumare.pdf', tipo: 'PDF', miniature: ['thumbnail/tebe/fumothumb.png'], icona: '🚭' }
      ]
    }
  ]
});
