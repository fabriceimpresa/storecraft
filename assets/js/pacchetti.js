/* Pacchetti di moduli di STORE // CRAFT (area operatore, Gestione pacchetti). Un modulo è una pagina che genera un
   cartello o un foglio di cartellini (es. Cartello Semplice), costruita con i moduli comuni; un pacchetto (o set) è una
   collezione di moduli dello stesso tipo: Pacchetto Outlet (i cartelli di Luxury Outlet), Pacchetto Boutique (i cartelli
   in morsa, le cornici, i paletti di TEBE), i pacchetti di cartellini e così via. Ogni pacchetto ha il suo file in
   assets/pacchetti/<id>.js; l'elenco di tutti i pacchetti del progetto sta in assets/pacchetti/elenco.js.

   I pacchetti sono uno strumento dell'operatore per comporre i set: le dashboard dei negozi non li usano e restano
   come sono (le loro schede stanno in assets/negozi/<negozio>-dashboard.js). I moduli hanno però la stessa forma delle
   schede della dashboard, quindi un set si potrà importare in un negozio esistente: Pacchetti.schede(id, negozio) dà
   le schede pronte per la dashboard di quel negozio (con ../<cartella>/ davanti ai collegamenti se le pagine del
   pacchetto stanno nella cartella di un altro negozio).

   Uso:
     Pacchetti.registra(id, { nome, tipo, cartella, negozio, descrizione, moduli })   nel file del pacchetto
       tipo      'cartelli', 'promo' o 'cartellini' (come le sezioni della dashboard)
       cartella  cartella delle pagine dei moduli (es. 'luxury')
       negozio   il negozio di cui è il set di partenza, se c'è (es. 'luxury')
       moduli    [{ titolo, link, tipo, miniature, alt, specifiche, badge, voce, prossimamente }] (come le schede della
                 dashboard: immagini con il percorso dalla cartella assets/)
     Pacchetti.carica([id, …])         carica i file dei pacchetti durante la lettura della pagina
     Pacchetti.installa([id, …])       in elenco.js: tutti i pacchetti del progetto, caricati (la pagina Gestione pacchetti)
     Pacchetti.elenco                  gli id dell'elenco
     Pacchetti.pacchetto(id)           il pacchetto (null se non è caricato)
     Pacchetti.schede(id, negozio)     i moduli come schede della dashboard di quel negozio (per importare un set)
   Va incluso prima dei file dei pacchetti (pacchetti.html: prima questo modulo, poi assets/pacchetti/elenco.js). */
(() => {
  const script = document.currentScript;
  const versione = new URL(script.src).search;   // stessa versione (?v=) dei file comuni
  const cartella = new URL('../pacchetti/', script.src);
  const pacchetti = {};
  const richiesti = new Set();
  let elenco = [];

  function carica(ids) {
    ids.filter(id => !richiesti.has(id)).forEach(id => {
      richiesti.add(id);
      // durante la lettura della pagina: chi segue trova già i pacchetti
      document.write(`<script src="${new URL(`${id}.js${versione}`, cartella).href}"><\/script>`);
    });
  }

  window.Pacchetti = Object.freeze({
    registra(id, pacchetto) {
      pacchetti[id] = Object.freeze({ id, ...pacchetto });
    },
    carica,
    installa(ids) {
      elenco = ids.slice();
      carica(ids);
    },
    get elenco() { return elenco.slice(); },
    pacchetto: id => pacchetti[id] || null,
    schede(id, negozio) {
      const pacchetto = pacchetti[id];
      if (!pacchetto) throw new Error(`Pacchetto non trovato: assets/pacchetti/${id}.js`);
      return pacchetto.moduli.map(modulo => (modulo.link && pacchetto.cartella !== negozio
        ? { ...modulo, link: `../${pacchetto.cartella}/${modulo.link}` }
        : { ...modulo }));
    }
  });
})();
