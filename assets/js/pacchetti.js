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

   Set di partenza (Outlet, Boutique…): non hanno una copia delle schede, ma origine: { negozio, sezione }. Le schede
   si leggono ogni volta da quella sezione della dashboard del negozio (il file assets/negozi/<negozio>-dashboard.js si
   carica in sola lettura, senza la dashboard), così il set resta sempre uguale alla dashboard. I set nuovi, composti
   per un nuovo negozio, avranno invece i loro moduli scritti nel file.

   Uso:
     Pacchetti.registra(id, { nome, titolo, tipo, cartella, negozio, descrizione, moduli | origine })   nel file del pacchetto
       origine   { negozio, sezione }: le schede sono quelle della sezione (id) della dashboard del negozio
       aggiunti  (con origine) moduli aggiunti al set da Nuovo modulo, scritti nel file, dopo le schede della dashboard:
                 non sono nella dashboard del negozio (si associano ai negozi dalla loro scheda); hanno aggiunto: true
       titolo    titolo breve sopra il carosello in Gestione pacchetti (es. 'Outlet'; il nome resta univoco)
       tipo      'cartelli', 'promo', 'cartellini', 'etichette' (come le sezioni della dashboard) o 'cassa' (Utilità
                 Cassa: ogni modulo è { titolo, strumento }, l'id del widget in assets/js/cassa.js)
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
  const schede = new URL('../negozi/', script.src);
  const pacchetti = {};
  const richiesti = new Set();
  const dashboard = {};            // contenuti delle dashboard lette, per negozio
  const dashboardRichieste = new Set();
  let elenco = [];

  // Lettura delle dashboard senza la dashboard: i file dei contenuti chiamano Dashboard.contenuto({...}); in queste
  // pagine (nessuna dashboard.js) lo raccoglie questo modulo, per negozio (dal nome del file che lo chiama)
  if (!window.Dashboard) {
    window.Dashboard = Object.freeze({
      contenuto(dati) {
        const negozio = (document.currentScript?.src.match(/\/negozi\/([^/?]+)-dashboard\.js/) || [])[1];
        if (negozio) dashboard[negozio] = dati;
      }
    });
  }
  function leggiDashboard(negozio) {
    if (dashboardRichieste.has(negozio)) return;
    dashboardRichieste.add(negozio);
    document.write(`<script src="${new URL(`${negozio}-dashboard.js${versione}`, schede).href}"><\/script>`);
  }

  // I moduli di un pacchetto: scritti nel file, oppure (set di partenza) le schede della sezione della dashboard
  function moduli(pacchetto) {
    if (!pacchetto.origine) return pacchetto.moduli || [];
    const { negozio, sezione } = pacchetto.origine;
    const trovata = dashboard[negozio]?.sezioni?.find(voce => voce.id === sezione);
    if (!trovata) throw new Error(`Sezione ${sezione} non trovata in assets/negozi/${negozio}-dashboard.js (pacchetto ${pacchetto.id})`);
    const schede = trovata.schede.map(scheda => ({ ...scheda }));
    // i moduli aggiunti; quelli che intanto sono entrati nella dashboard del negozio (spunta nella loro scheda) non si
    // ripetono: la loro scheda della dashboard resta un modulo aggiunto (spunta del negozio non bloccata)
    const aggiunti = [];
    (pacchetto.aggiunti || []).forEach(modulo => {
      const inDashboard = (modulo.cartella || pacchetto.cartella) === negozio && schede.find(scheda => scheda.link === modulo.link);
      if (inDashboard) inDashboard.aggiunto = true;
      else aggiunti.push({ ...modulo, aggiunto: true });
    });
    return schede.concat(aggiunti);
  }

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
      if (pacchetto.origine) leggiDashboard(pacchetto.origine.negozio);
    },
    carica,
    installa(ids) {
      elenco = ids.slice();
      carica(ids);
    },
    get elenco() { return elenco.slice(); },
    // il pacchetto con i suoi moduli (per i set di partenza letti in quel momento dalla dashboard)
    pacchetto: id => (pacchetti[id] ? Object.freeze({ ...pacchetti[id], moduli: moduli(pacchetti[id]) }) : null),
    schede(id, negozio) {
      const pacchetto = pacchetti[id];
      if (!pacchetto) throw new Error(`Pacchetto non trovato: assets/pacchetti/${id}.js`);
      return moduli(pacchetto).map(modulo => (modulo.link && pacchetto.cartella !== negozio
        ? { ...modulo, link: `../${pacchetto.cartella}/${modulo.link}` }
        : { ...modulo }));
    }
  });
})();
