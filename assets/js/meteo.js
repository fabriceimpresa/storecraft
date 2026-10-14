/* Meteo della dashboard (14 ottobre 2026): città e tempo di adesso, per il banner dell'intestazione e il riquadro di
   data e ora (dashboard.js, solo nei negozi con meteo: true in intestazione).

   La città si ricava dalla rete dell'utente (get.geojs.io: posizione approssimata dall'indirizzo IP, nessun permesso da
   chiedere; basta la città), il nome in italiano dalla ricerca città di Open-Meteo, il tempo da Open-Meteo (gratuito,
   senza chiave). Senza rete o se un servizio non risponde: Roma, la città dei negozi.
   Tutto resta nel browser (localStorage storecraft_meteo, comune a tutti i negozi): la città per un giorno, il tempo
   per 30 minuti; nessun dato dei negozi esce.

   Uso:
     Meteo.leggi()            Promise con { citta, temperatura, codice, descrizione, breve } (o null)
     evento 'storecraft:meteo' su window, con lo stesso oggetto in detail, a ogni aggiornamento */
(() => {
  const CHIAVE = 'storecraft_meteo';
  const DURATA_CITTA = 24 * 60 * 60 * 1000;
  const DURATA_TEMPO = 30 * 60 * 1000;
  const ROMA = { citta: 'Roma', lat: 41.89, lon: 12.48 };

  // codici WMO di Open-Meteo: descrizione per il banner e forma breve per il riquadro dell'orologio
  const TEMPO = [
    [[0], 'Sereno', 'Sereno'], [[1], 'Poco nuvoloso', 'Sereno'], [[2], 'Variabile', 'Variabile'], [[3], 'Coperto', 'Coperto'],
    [[45, 48], 'Nebbia', 'Nebbia'], [[51, 53, 55, 56, 57], 'Pioggerella', 'Pioggia'], [[61, 63, 65, 66, 67], 'Pioggia', 'Pioggia'],
    [[71, 73, 75, 77, 85, 86], 'Neve', 'Neve'], [[80, 81, 82], 'Rovesci', 'Rovesci'], [[95, 96, 99], 'Temporale', 'Temporale']
  ];
  const parole = codice => TEMPO.find(([codici]) => codici.includes(codice)) || [[], '', ''];

  const leggiArchivio = () => { try { return JSON.parse(localStorage.getItem(CHIAVE)) || {}; } catch { return {}; } };
  const scriviArchivio = dati => { try { localStorage.setItem(CHIAVE, JSON.stringify(dati)); } catch { /* niente */ } };
  const json = async (url) => {
    const risposta = await fetch(url, { cache: 'no-store' });
    if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`);
    return risposta.json();
  };

  async function posizione() {
    const archivio = leggiArchivio();
    if (archivio.posto && Date.now() - archivio.posto.quando < DURATA_CITTA) return archivio.posto;
    let posto = { ...ROMA };
    try {
      const rete = await json('https://get.geojs.io/v1/ip/geo.json');
      const lat = parseFloat(rete.latitude), lon = parseFloat(rete.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lon)) posto = { citta: rete.city || '', lat, lon };
      // il nome della città in italiano (Rome → Roma), dalla ricerca città di Open-Meteo
      if (rete.city) {
        const cerca = await json(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(rete.city)}&count=1&language=it${rete.country_code ? `&countryCode=${rete.country_code}` : ''}`);
        if (cerca.results?.[0]?.name) posto.citta = cerca.results[0].name;
      }
      if (!posto.citta) posto.citta = ROMA.citta;
    } catch (errore) {
      console.warn('Meteo: posizione non trovata, uso Roma', errore);
    }
    posto.quando = Date.now();
    scriviArchivio({ ...leggiArchivio(), posto });
    return posto;
  }

  let inCorso = null;
  function leggi() {
    if (inCorso) return inCorso;
    inCorso = (async () => {
      const archivio = leggiArchivio();
      if (archivio.tempo && Date.now() - archivio.tempo.quando < DURATA_TEMPO) return completa(archivio.posto, archivio.tempo);
      const posto = await posizione();
      try {
        const dati = await json(`https://api.open-meteo.com/v1/forecast?latitude=${posto.lat}&longitude=${posto.lon}&current=temperature_2m,weather_code&timezone=auto`);
        const tempo = { temperatura: Math.round(dati.current.temperature_2m), codice: dati.current.weather_code, quando: Date.now() };
        if (!Number.isFinite(tempo.temperatura)) throw new Error('risposta senza temperatura');
        scriviArchivio({ ...leggiArchivio(), tempo });
        return completa(posto, tempo);
      } catch (errore) {
        console.warn('Meteo: tempo non disponibile', errore);
        return archivio.tempo ? completa(posto, archivio.tempo) : null;
      }
    })().then(meteo => {
      if (meteo) window.dispatchEvent(new CustomEvent('storecraft:meteo', { detail: meteo }));
      return meteo;
    }).finally(() => { inCorso = null; });
    return inCorso;
  }
  function completa(posto, tempo) {
    if (!posto || !tempo) return null;
    const [, descrizione, breve] = parole(tempo.codice);
    return { citta: posto.citta, temperatura: tempo.temperatura, codice: tempo.codice, descrizione, breve };
  }

  // si aggiorna da solo ogni 30 minuti, finché la pagina è aperta
  leggi();
  setInterval(leggi, DURATA_TEMPO);
  window.Meteo = Object.freeze({ leggi });
})();
