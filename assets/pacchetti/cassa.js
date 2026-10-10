/* Pacchetto Utilità Cassa (vedi assets/js/pacchetti.js): gli strumenti di cassa della dashboard, comuni a tutti i
   negozi (assets/js/cassa.js), moduli di tipo cassa. Ogni modulo è uno strumento (id del suo widget in cassa.js): la
   vetrina mostra solo gli strumenti del pacchetto, vivi e funzionanti come nella dashboard. */
Pacchetti.registra('cassa', {
  nome: 'Pacchetto Utilità Cassa',
  titolo: 'Utilità Cassa',   // titolo breve, sopra il carosello in Gestione pacchetti
  tipo: 'cassa',
  descrizione: "Strumenti di cassa: calcola sconto, calcola aliquota sconto, cambio valuta, calcola IVA e generatore QR code.",
  moduli: [
    { titolo: 'Calcola Sconto', strumento: 'widget-sconto' },
    { titolo: 'Calcola Aliquota Sconto', strumento: 'widget-aliquota' },
    { titolo: 'Cambio Valuta', strumento: 'widget-valuta' },
    { titolo: 'Calcola IVA', strumento: 'widget-iva' },
    { titolo: 'Generatore QR Code', strumento: 'widget-qrcode' }
  ]
});
