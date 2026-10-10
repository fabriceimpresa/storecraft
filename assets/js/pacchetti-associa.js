/* Associare un modulo ai negozi (area operatore, Gestione pacchetti › scheda del modulo). Strumento solo dell'operatore:
   scrive nella cartella del progetto collegata (File System Access API, Chrome / Edge sul computer, come Importa loghi);
   le modifiche vanno poi pubblicate con un commit.

   Un modulo (pagina <cartella>/<pagina>.html, scheda nella dashboard del suo negozio) si associa a un negozio:
   - stesso negozio della pagina: la sua scheda entra nella dashboard del negozio;
   - altro negozio: la pagina si copia nella cartella del negozio e si adatta a lui (data-negozio, percorsi delle sue
     risorse, con le immagini che mancano copiate dal negozio della pagina), la miniatura si copia nelle sue anteprime e
     la scheda entra nella sua dashboard, con origine: '<cartella>/<pagina>.html' (così si riconosce la copia). Se il
     negozio ha già una pagina con lo stesso nome, la copia si chiama <pagina>-<cartella>.html.
   Togliendo la spunta a un clone (pagina copiata da qui, con il segno storecraft-origine) la scheda esce dalla
   dashboard e il clone si cancella, con i file copiati per lui (elencati dal clone stesso in
   <meta name="storecraft-copiati">, cioè solo quelli che nel negozio mancavano) che nessun'altra pagina del negozio
   usa. I file del negozio (es. la sua bandiera) e le pagine di partenza dei negozi non si cancellano mai.
   Le schede stanno nella prima sezione della dashboard del tipo del modulo (cartelli, promo o, se manca, cartelli,
   cartellini). Le funzioni sul testo non toccano i file: le usa anche la prova da riga di comando.

   Uso (testo):
     Associa.usato(testoDashboard, negozio, cartella, pagina)      true se la dashboard usa il modulo (sua scheda o copia)
     Associa.aggiungiScheda(testoDashboard, tipo, scheda)          nuovo testo con la scheda in fondo alla sezione
     Associa.togliScheda(testoDashboard, negozio, cartella, pagina) nuovo testo senza la scheda del modulo
     Associa.adattaPagina(html, da, a, origine)                    { html, risorse: [{ cartella, file }] } da copiare
   Uso (file, con la cartella del progetto collegata):
     Associa.scegliProgetto(passaggio)                              cartella del progetto scelta e controllata (Chrome / Edge)
     Associa.associa(progetto, { modulo, tipo, cartella, negozio })   aggiunge il modulo al negozio
     Associa.togli(progetto, { modulo, cartella, negozio })           lo toglie dalla dashboard (un clone si cancella)
     Associa.eliminaClone(progetto, { negozio, nome })              cancella il clone <negozio>/<nome> e la sua scheda
     Associa.clone(html)                                             origine del clone ('<cartella>/<pagina>.html') o null
     Associa.creaModulo(progetto, { sorgente, nome, scheda, tipo, galleria, miniatura })
                                         nuovo modulo da uno esistente: pagina <cartella>/<nome>.html (copia della pagina di
                                         partenza, con storecraft-origine), miniatura JPG, modulo in una galleria (galleria:
                                         id di una galleria creata qui, o null per una Nuova Galleria, galleria-<n>.js in
                                         assets/pacchetti/ e nell'elenco); restituisce { galleria, pagina }

   Un nuovo modulo non è in nessuna dashboard: si associa ai negozi dalla sua scheda, come gli altri.

   Etichette DYMO: un nuovo modulo clona un set (la pagina delle etichette di un negozio) tenendo solo i layout scelti.
     Associa.clonaEtichette(progetto, { cartella, link, moduli, nome })   pagina <cartella>/<nome>.html e galleria nuova
                                         con i layout scelti (moduli: le schede del set da tenere); nella pagina gli altri
                                         layout si nascondono e si apre su uno di quelli scelti

   Ghost (Gestione negozi): una pagina in ghost resta nella cartella del negozio ma la sua dashboard non la mostra, né
   come widget né nel menu laterale; le sue schede hanno nascosta: true (dashboard.js le salta).
     Associa.fantasma(testoDashboard, pagina)               true se le schede che aprono la pagina sono in ghost
     Associa.impostaFantasma(testoDashboard, pagina, sì/no)  nuovo testo con tutte le schede della pagina in ghost o no */
(() => {
  const RISORSE = ['img', 'logos', 'thumbnail', 'pdf', 'foto'];
  const virgolette = valore => `'${String(valore).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const pagina = link => String(link || '').split('?')[0];

  // Scheda come riga di testo, nella forma delle schede delle dashboard
  function scrivi(scheda) {
    const parti = Object.entries(scheda).filter(([, valore]) => valore !== undefined && valore !== null && valore !== false)
      .map(([chiave, valore]) => `${chiave}: ${Array.isArray(valore) ? `[${valore.map(virgolette).join(', ')}]`
        : valore === true ? 'true' : typeof valore === 'number' ? valore : virgolette(valore)}`);
    return `{ ${parti.join(', ')} }`;
  }

  // Fine della parentesi che si apre in posizione inizio (salta le stringhe)
  function chiusura(testo, inizio) {
    const apre = testo[inizio], chiude = apre === '[' ? ']' : '}';
    let livello = 0, stringa = null;
    for (let i = inizio; i < testo.length; i++) {
      const c = testo[i];
      if (stringa) { if (c === '\\') i++; else if (c === stringa) stringa = null; continue; }
      if (c === "'" || c === '"' || c === '`') { stringa = c; continue; }
      if (c === apre) livello++;
      else if (c === chiude && --livello === 0) return i;
    }
    throw new Error('Testo della dashboard non leggibile: parentesi non chiusa.');
  }

  // Le sezioni della dashboard: { tipo, inizio, fine } dell'elenco schede ([ … ])
  function sezioni(testo) {
    const elenco = [];
    for (const trovato of testo.matchAll(/tipo:\s*'(cartelli|promo|cartellini|etichette|stampe)'/g)) {
      // il tipo di una sezione è minuscolo (quello delle schede è maiuscolo: CARTELLO, PDF…); l'elenco schede la segue
      const schede = testo.indexOf('schede: [', trovato.index);
      if (schede < 0) continue;
      const aperta = schede + 'schede: '.length;
      elenco.push({ tipo: trovato[1], inizio: aperta, fine: chiusura(testo, aperta) });
    }
    return elenco;
  }

  function sezione(testo, tipo) {
    const tutte = sezioni(testo);
    return tutte.find(voce => voce.tipo === tipo) || (tipo === 'promo' ? tutte.find(voce => voce.tipo === 'cartelli') : null);
  }

  // Le schede (oggetti { … }) di un elenco, con la loro posizione nel testo
  function schede(testo, { inizio, fine }) {
    const elenco = [];
    for (let i = inizio + 1; i < fine; i++) {
      if (testo[i] === '{') { const termine = chiusura(testo, i); elenco.push({ inizio: i, fine: termine, testo: testo.slice(i, termine + 1) }); i = termine; }
    }
    return elenco;
  }

  const suaScheda = (scheda, negozio, cartella, nome) =>
    (negozio === cartella && new RegExp(`link:\\s*'${nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`).test(scheda.testo))
    || scheda.testo.includes(`origine: '${cartella}/${nome}'`);

  function trovaScheda(testo, negozio, cartella, nome) {
    for (const voce of sezioni(testo)) {
      const trovata = schede(testo, voce).find(scheda => suaScheda(scheda, negozio, cartella, nome));
      if (trovata) return trovata;
    }
    return null;
  }

  function usato(testo, negozio, cartella, nome) {
    return Boolean(trovaScheda(testo, negozio, cartella, nome));
  }

  function aggiungiScheda(testo, tipo, scheda) {
    const voce = sezione(testo, tipo);
    if (!voce) throw new Error(`Nella dashboard non c'è una sezione ${tipo} in cui mettere il modulo.`);
    const esistenti = schede(testo, voce);
    const riga = testo.lastIndexOf('\n', voce.fine);
    const rientro = esistenti.length ? testo.slice(testo.lastIndexOf('\n', esistenti[0].inizio) + 1, esistenti[0].inizio) : '        ';
    if (!esistenti.length) {
      const base = testo.slice(riga + 1, voce.fine);
      return `${testo.slice(0, voce.inizio + 1)}\n${rientro}${scrivi(scheda)}\n${base}${testo.slice(voce.fine)}`;
    }
    const ultima = esistenti[esistenti.length - 1];
    return `${testo.slice(0, ultima.fine + 1)},\n${rientro}${scrivi(scheda)}${testo.slice(ultima.fine + 1)}`;
  }

  function togliScheda(testo, negozio, cartella, nome) {
    const trovata = trovaScheda(testo, negozio, cartella, nome);
    if (!trovata) return testo;
    // la riga intera della scheda (anche su più righe) e la virgola che la separa dalla vicina
    let inizio = testo.lastIndexOf('\n', trovata.inizio);
    let fine = trovata.fine + 1;
    if (testo[fine] === ',') fine++;
    else {
      // ultima dell'elenco: si toglie la virgola dopo la scheda precedente
      const prima = testo.slice(0, inizio).search(/,\s*$/);
      if (prima >= 0) inizio = prima;
    }
    return testo.slice(0, inizio) + testo.slice(fine);
  }

  // Pagina copiata in un altro negozio: data-negozio, percorsi delle risorse del negozio, segno dell'origine.
  // Restituisce anche le risorse del negozio di partenza da copiare (file con il nome scritto nella pagina, o i file
  // che cominciano con il nome scritto prima di ${…}; non le cartelle intere, come printlogos/, che il negozio ha già)
  function adattaPagina(html, da, a, origine) {
    const risorse = [];
    const percorso = new RegExp(`(assets/(${RISORSE.join('|')})/)${da}/([^'"\`\\s)]*)`, 'g');
    let nuovo = html.replace(percorso, (tutto, prima, cartella, resto) => {
      const dinamico = resto.indexOf('${');
      const file = (dinamico >= 0 ? resto.slice(0, dinamico) : resto).split('?')[0];
      // i loghi no: il negozio ha i suoi (assets/logos/<negozio>/, con il suo elenco.js)
      if (cartella !== 'logos' && file) risorse.push({ cartella, file, prefisso: dinamico >= 0 });
      return `${prima}${a}/${resto}`;
    });
    nuovo = nuovo.replace(new RegExp(`data-negozio="${da}"`, 'g'), `data-negozio="${a}"`);
    // segno d'origine nuovo (una pagina che era già un clone o un modulo di moduli/ perde i suoi: origine e file copiati)
    nuovo = nuovo.replace(/\n?\s*<meta name="storecraft-(origine|copiati)" content="[^"]*">/g, '')
      .replace(/(<meta charset="[^"]*">)/i, `$1\n  <meta name="storecraft-origine" content="${origine}">`);
    return { html: nuovo, risorse };
  }

  // Origine scritta nella pagina clonata (null: pagina di partenza, non un clone)
  function clone(html) {
    return (String(html).match(/<meta name="storecraft-origine" content="([^"]+)">/) || [])[1] || null;
  }

  // ----- File (cartella del progetto collegata) -----
  async function scegliProgetto(passaggio = () => {}) {
    passaggio('scegli la cartella STORECRAFT nella finestra del browser…');
    let progetto;
    try {
      progetto = await window.showDirectoryPicker({ id: 'storecraft-progetto', mode: 'readwrite' });
    } catch (errore) {
      if (errore.name === 'AbortError') throw errore;   // finestra chiusa senza scegliere
      // i rifiuti di Chrome, spiegati: un'altra finestra di scelta aperta, o il clic troppo lontano nel tempo
      if (/already active/i.test(errore.message)) throw new Error("c'è già una finestra di scelta della cartella aperta in Chrome (forse dietro un'altra finestra): chiudila e riprova");
      if (errore.name === 'SecurityError' || /user gesture|activation/i.test(errore.message)) throw new Error('Chrome apre la finestra solo subito dopo un clic: clicca di nuovo il pulsante');
      throw errore;
    }
    passaggio(`cartella "${progetto.name}" scelta: controllo che sia il progetto…`);
    try {
      await progetto.getFileHandle('index.html');
      await (await progetto.getDirectoryHandle('assets')).getDirectoryHandle('negozi');
    } catch {
      throw new Error(`"${progetto.name}" non è la cartella del progetto: scegli la cartella STORECRAFT, quella che contiene index.html e assets`);
    }
    passaggio('chiedo il permesso di modificare i file: rispondi alla finestra del browser («Modifica file»)…');
    if (await progetto.requestPermission({ mode: 'readwrite' }) !== 'granted') {
      throw new Error('il browser non ha dato il permesso di modificare i file: ricollega e rispondi «Modifica file»');
    }
    return progetto;
  }
  async function cartella(progetto, percorso, crea = false) {
    let attuale = progetto;
    for (const nome of percorso.split('/').filter(Boolean)) attuale = await attuale.getDirectoryHandle(nome, { create: crea });
    return attuale;
  }
  async function leggi(progetto, percorso) {
    const parti = percorso.split('/');
    const dir = await cartella(progetto, parti.slice(0, -1).join('/'));
    return (await (await dir.getFileHandle(parti.at(-1))).getFile());
  }
  async function esiste(progetto, percorso) {
    try { await leggi(progetto, percorso); return true; } catch { return false; }
  }
  async function scriviFile(progetto, percorso, contenuto) {
    const parti = percorso.split('/');
    const dir = await cartella(progetto, parti.slice(0, -1).join('/'), true);
    const scrittura = await (await dir.getFileHandle(parti.at(-1), { create: true })).createWritable();
    await scrittura.write(contenuto);
    await scrittura.close();
  }
  // copia un file del negozio di partenza nel negozio, se manca; true se l'ha copiato
  async function copiaRisorsa(progetto, tipo, da, a, file) {
    if (!file || await esiste(progetto, `assets/${tipo}/${a}/${file}`)) return false;
    try { await scriviFile(progetto, `assets/${tipo}/${a}/${file}`, await leggi(progetto, `assets/${tipo}/${da}/${file}`)); return true; } catch { return false; /* manca anche nel negozio di partenza */ }
  }

  // copia nel negozio a le risorse della pagina adattata che gli mancano; restituisce i file copiati davvero
  async function copiaRisorse(progetto, risorse, da, a) {
    const copiati = [];
    const copia = async (tipo, file) => { if (await copiaRisorsa(progetto, tipo, da, a, file)) copiati.push(`${tipo}/${file}`); };
    for (const risorsa of risorse) {
      if (risorsa.prefisso) {
        if (!risorsa.file || risorsa.file.endsWith('/')) continue;
        const parti = risorsa.file.split('/');
        const dir = await cartella(progetto, `assets/${risorsa.cartella}/${da}/${parti.slice(0, -1).join('/')}`).catch(() => null);
        if (!dir) continue;
        for await (const [file, voce] of dir.entries()) {
          if (voce.kind === 'file' && file.startsWith(parti.at(-1))) await copia(risorsa.cartella, [...parti.slice(0, -1), file].join('/'));
        }
      } else await copia(risorsa.cartella, risorsa.file);
    }
    return copiati;
  }

  async function associa(progetto, { modulo, tipo, cartella: da, negozio: a, avviso = () => {} }) {
    const dashboard = `assets/negozi/${a}-dashboard.js`;
    let testo = await (await leggi(progetto, dashboard)).text();
    const nome = pagina(modulo.link);
    if (usato(testo, a, da, nome)) return;
    const scheda = { ...modulo };
    // un modulo con il suo stile va nella sezione di quello stile: dorato nelle promo, normale nei cartelli
    if (modulo.stile === 'dorata') tipo = 'promo';
    else if (modulo.stile === 'normale' && tipo === 'promo') tipo = 'cartelli';
    delete scheda.stile;
    delete scheda.aggiunto;
    delete scheda.prossimamente;
    delete scheda.cartella;   // cartella del modulo nelle gallerie: nella dashboard il collegamento è dalla cartella del negozio
    if (a !== da) {
      // la pagina nella cartella del negozio (nome libero), adattata a lui, con le risorse che le servono
      let libero = nome;
      for (let n = 1; await esiste(progetto, `${a}/${libero}`); n++) libero = nome.replace(/\.html$/, n === 1 ? `-${da}.html` : `-${da}-${n}.html`);
      avviso(`copio ${da}/${nome} in ${a}/${libero}…`);
      const sorgente = await (await leggi(progetto, `${da}/${nome}`)).text();
      // il negozio delle risorse della pagina: il suo data-negozio (una pagina di moduli/ usa quelle del negozio di partenza)
      const origineRisorse = (sorgente.match(/data-negozio="([\w-]+)"/) || [])[1] || da;
      const { html, risorse } = adattaPagina(sorgente, origineRisorse, a, `${da}/${nome}`);
      const copiati = origineRisorse === a ? [] : await copiaRisorse(progetto, risorse, origineRisorse, a);   // il clone li elenca
      // la miniatura nelle anteprime del negozio (da quelle del negozio di partenza o da moduli/miniature/)
      scheda.miniature = await Promise.all((modulo.miniature || []).map(async miniatura => {
        const [file, query = ''] = miniatura.split('?');
        const daNegozio = file.match(new RegExp(`^thumbnail/${origineRisorse}/(.+)$`));
        const daModuli = file.match(/^\.\.\/moduli\/miniature\/(.+)$/);
        const nomeMiniatura = (daNegozio || daModuli || [])[1];
        if (!nomeMiniatura || (daNegozio && origineRisorse === a)) return miniatura;
        if (!await esiste(progetto, `assets/thumbnail/${a}/${nomeMiniatura}`)) {
          await scriviFile(progetto, `assets/thumbnail/${a}/${nomeMiniatura}`, await leggi(progetto, daModuli ? `moduli/miniature/${nomeMiniatura}` : `assets/thumbnail/${origineRisorse}/${nomeMiniatura}`));
          copiati.push(`thumbnail/${nomeMiniatura}`);
        }
        return `thumbnail/${a}/${nomeMiniatura}${query ? `?${query}` : ''}`;
      }));
      // la pagina per ultima, con l'elenco dei file copiati per lei
      const elencoCopiati = `\n  <meta name="storecraft-copiati" content="${copiati.join(',')}">`;
      await scriviFile(progetto, `${a}/${libero}`, html.replace(/(<meta name="storecraft-origine" content="[^"]*">)/, `$1${elencoCopiati}`));
      scheda.link = libero + (modulo.link.includes('?') ? `?${modulo.link.split('?')[1]}` : '');
      scheda.origine = `${da}/${nome}`;
    }
    avviso(`aggiungo la scheda alla dashboard di ${a}…`);
    testo = aggiungiScheda(testo, tipo, scheda);
    await scriviFile(progetto, dashboard, testo);
  }

  async function cancella(progetto, percorso) {
    const parti = percorso.split('/');
    await (await cartella(progetto, parti.slice(0, -1).join('/'))).removeEntry(parti.at(-1));
  }

  // Cancella il clone <negozio>/<nome>: la sua scheda dalla dashboard, la pagina e i file copiati per lui (il suo elenco
  // storecraft-copiati) che nessun'altra pagina del negozio e la dashboard usano. Le pagine di partenza no.
  async function eliminaClone(progetto, { negozio, nome, avviso = () => {} }) {
    const html = await (await leggi(progetto, `${negozio}/${nome}`)).text();
    const origine = clone(html);
    if (!origine) throw new Error(`${negozio}/${nome} è una pagina di partenza del negozio: non si cancella`);
    const da = origine.split('/')[0];
    const dashboard = `assets/negozi/${negozio}-dashboard.js`;
    let testo = await (await leggi(progetto, dashboard)).text();
    // la scheda del clone: quella che apre il clone (il suo nome di file nella cartella del negozio), non la pagina di
    // partenza, che può stare nella stessa cartella (moduli creati da Nuovo modulo)
    const scheda = trovaScheda(testo, negozio, negozio, nome);
    if (scheda) {
      avviso(`tolgo la scheda dalla dashboard di ${negozio}…`);
      testo = togliScheda(testo, negozio, negozio, nome);
      await scriviFile(progetto, dashboard, testo);
    }
    avviso(`cancello ${negozio}/${nome}…`);
    await cancella(progetto, `${negozio}/${nome}`);
    // file copiati per il clone (elencati da lui): quelli che ora nessuno usa più. Un clone senza elenco non ne cancella
    const copiati = ((html.match(/<meta name="storecraft-copiati" content="([^"]*)">/) || [])[1] || '').split(',').filter(Boolean);
    const usate = [testo];
    for await (const [file, voce] of (await cartella(progetto, negozio)).entries()) {
      if (voce.kind === 'file' && file.endsWith('.html')) usate.push(await (await voce.getFile()).text());
    }
    for (const copiato of copiati) {
      const [tipo, ...resto] = copiato.split('/');
      const file = resto.join('/');
      if (usate.some(testoPagina => testoPagina.includes(`${tipo}/${negozio}/${file}`))) continue;
      try { avviso(`cancello assets/${tipo}/${negozio}/${file}…`); await cancella(progetto, `assets/${tipo}/${negozio}/${file}`); } catch { /* già tolto */ }
    }
  }

  // nome di file dal nome del modulo: minuscolo, senza accenti, parole unite da trattini
  const nomeFile = testo => String(testo).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'nuovo-modulo';

  // Nuovo modulo: la pagina di partenza copiata nella stessa cartella con un nome libero, la miniatura provvisoria e il
  // modulo in una galleria: una creata qui o un set di partenza (galleria: id; nel set va tra gli aggiunti) o una nuova
  // (galleria: null). Non entra in nessuna dashboard: si associa ai negozi dalla sua scheda.
  async function creaModulo(progetto, { sorgente, nome, scheda, tipo, galleria = null, miniatura, avviso = () => {} }) {
    const { cartella: da, link } = sorgente;
    // strumento di cassa: niente pagina né miniatura, solo il modulo nel catalogo (lo strumento di partenza con il suo nome)
    if (sorgente.strumento) return scriviNellaGalleria(progetto, { modulo: { titolo: nome, strumento: sorgente.strumento }, tipo, galleria, pagina: null, avviso });
    // la pagina nella cartella dei moduli in lavorazione (non in quella di un negozio: ci va solo associandolo)
    const a = MODULI;
    await preparaModuli(progetto);
    const origine = `${da}/${pagina(link)}`;
    let base = nomeFile(nome), libero = `${base}.html`;
    for (let n = 2; await esiste(progetto, `${a}/${libero}`); n++) libero = `${base}-${n}.html`;
    base = libero.replace(/\.html$/, '');
    avviso(`creo la pagina ${a}/${libero}…`);
    // la pagina resta del negozio di partenza (colori, loghi, risorse) finché non la si associa a un negozio
    const { html } = adattaPagina(await (await leggi(progetto, origine)).text(), da, da, origine);
    avviso(`salvo la miniatura ${MODULI}/miniature/${base}.jpg…`);
    await scriviFile(progetto, `${MODULI}/miniature/${base}.jpg`, miniatura);
    await scriviFile(progetto, `${a}/${libero}`, html.replace(/<title>[^<]*<\/title>/i, `<title>${nome.replace(/[<&]/g, '')}</title>`));
    // la variante della pagina (etichette DYMO: ?label=…) resta quella del modulo di partenza; la miniatura dalla cartella
    // assets/ (come le altre): ../moduli/miniature/
    const modulo = { ...scheda, titolo: nome, link: libero + (link.includes('?') ? `?${link.split('?')[1]}` : ''), miniature: [`../${MODULI}/miniature/${base}.jpg`] };
    modulo.cartella = a;
    return scriviNellaGalleria(progetto, { modulo, tipo, galleria, pagina: `${a}/${libero}`, avviso });
  }

  // il modulo nella galleria: una creata qui o un set di partenza (tra gli aggiunti), o una nuova galleria-<n>.js
  async function scriviNellaGalleria(progetto, { modulo, tipo, galleria, pagina: percorso, avviso, titolo = 'Nuova Galleria' }) {
    if (galleria) {
      avviso(`aggiungo il modulo alla galleria ${galleria}…`);
      const file = `assets/pacchetti/${galleria}.js`;
      let testo = await (await leggi(progetto, file)).text();
      // set di partenza (origine): il modulo va tra gli aggiunti (l'elenco si crea la prima volta, dopo l'origine)
      if (/origine:\s*\{/.test(testo) && !testo.includes('aggiunti: [')) {
        const origineInizio = testo.indexOf('{', testo.search(/origine:\s*\{/));
        const origineFine = chiusura(testo, origineInizio);
        testo = `${testo.slice(0, origineFine + 1)},\n  // moduli aggiunti da Nuovo modulo (Gestione pacchetti): non sono nella dashboard, si associano dalla loro scheda\n  aggiunti: [\n  ]${testo.slice(origineFine + 1)}`;
      }
      const chiave = testo.includes('aggiunti: [') ? 'aggiunti: [' : 'moduli: [';
      const inizio = testo.indexOf(chiave) + chiave.length - 1;
      const fine = chiusura(testo, inizio);
      const vuoto = !testo.slice(inizio + 1, fine).trim();
      await scriviFile(progetto, file, `${testo.slice(0, fine).replace(/\s*$/, '')}${vuoto ? '' : ','}\n    ${scrivi(modulo)}\n  ${testo.slice(fine)}`);
    } else {
      let n = 1;
      while (await esiste(progetto, `assets/pacchetti/galleria-${n}.js`)) n++;
      galleria = `galleria-${n}`;
      avviso(`creo la galleria assets/pacchetti/${galleria}.js…`);
      await scriviFile(progetto, `assets/pacchetti/${galleria}.js`, `/* Nuova Galleria (vedi assets/js/pacchetti.js): galleria creata in Gestione pacchetti, moduli di tipo ${tipo}. Ogni
   modulo ha la cartella delle sue pagine (cartella); si associa ai negozi dalla sua scheda. */
Pacchetti.registra('${galleria}', {
  nome: ${virgolette(titolo)},
  titolo: ${virgolette(titolo)},   // titolo breve, sopra il carosello in Gestione pacchetti
  tipo: '${tipo}',
  moduli: [
    ${scrivi(modulo)}
  ]
});
`);
      const elenco = 'assets/pacchetti/elenco.js';
      const testo = await (await leggi(progetto, elenco)).text();
      const inizio = testo.indexOf('installa([') + 'installa('.length;
      const fine = chiusura(testo, inizio);
      await scriviFile(progetto, elenco, `${testo.slice(0, fine)}, '${galleria}'${testo.slice(fine)}`);
    }
    return { galleria, pagina: percorso };
  }

  // Cartella dei moduli in lavorazione (Nuovo modulo): le loro pagine e, in miniature/, le miniature provvisorie. Le pagine
  // usano le risorse del negozio di partenza (stessi percorsi ../assets/); nelle cartelle dei negozi vanno solo associandole.
  // Non entra nelle copie per i clienti (si copiano solo le cartelle dei negozi).
  const MODULI = 'moduli';
  async function preparaModuli(progetto) {
    if (await esiste(progetto, `${MODULI}/index.html`)) return;
    // la ✕ delle pagine (index.html) da qui torna a Gestione pacchetti
    await scriviFile(progetto, `${MODULI}/index.html`, `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex, nofollow">
  <title>Moduli in lavorazione</title>
  <!-- Cartella dei moduli creati in Gestione pacchetti, non ancora in un negozio: la ✕ delle loro pagine torna qui,
       e da qui a Gestione pacchetti -->
  <meta http-equiv="refresh" content="0; url=../operatore.html#pacchetti">
</head>
<body></body>
</html>
`);
  }

  // Layout di una pagina di etichette: da ?label=… al layout (paramMap della pagina) e il layout di partenza (senza label)
  function layoutEtichette(html) {
    const mappa = {};
    const tabella = (html.match(/paramMap\s*=\s*\{([^}]*)\}/) || [])[1] || '';
    for (const [, label, layout] of tabella.matchAll(/'([\w-]+)'\s*:\s*'([\w-]+)'/g)) mappa[label] = layout;
    const iniziale = (html.match(/class="template-card active"[^>]*id="card-tpl-([\w-]+)"/) || html.match(/id="card-tpl-([\w-]+)"/) || [])[1];
    return { layout: link => mappa[new URLSearchParams(String(link).split('?')[1] || '').get('label')] || iniziale };
  }

  async function clonaEtichette(progetto, { cartella: da, link, moduli, nome, avviso = () => {} }) {
    const origine = `${da}/${pagina(link)}`;
    await preparaModuli(progetto);
    let base = nomeFile(nome), libero = `${base}.html`;
    for (let n = 2; await esiste(progetto, `${MODULI}/${libero}`); n++) libero = `${base}-${n}.html`;
    avviso(`creo la pagina ${MODULI}/${libero}…`);
    const sorgente = await (await leggi(progetto, origine)).text();
    const { layout } = layoutEtichette(sorgente);
    const tenuti = [...new Set(moduli.map(modulo => layout(modulo.link)).filter(Boolean))];
    // solo i layout scelti: gli altri nascosti nella galleria della pagina; se si apre su un layout nascosto, il primo tenuto
    const filtro = `\n  <meta name="storecraft-layout" content="${tenuti.join(',')}">
  <style>.template-card:not(${tenuti.map(chiave => `#card-tpl-${chiave}`).join(', ')}) { display: none !important; }</style>
  <script>
    // dopo che la pagina ha scelto il suo layout (dall'indirizzo o quello di partenza)
    addEventListener('load', () => setTimeout(() => {
      const attivo = document.querySelector('.template-card.active');
      if (attivo && getComputedStyle(attivo).display === 'none') document.getElementById('card-tpl-${tenuti[0]}')?.click();
    }));
  </script>`;
    const html = adattaPagina(sorgente, da, da, origine).html
      .replace(/<title>[^<]*<\/title>/i, `<title>${nome.replace(/[<&]/g, '')}</title>`)
      .replace(/(<meta name="storecraft-origine" content="[^"]*">)/, `$1${filtro}`);
    await scriviFile(progetto, `${MODULI}/${libero}`, html);
    // la galleria: i layout scelti, con le loro miniature, che aprono la nuova pagina
    const scelte = moduli.map(modulo => {
      const query = String(modulo.link).split('?')[1];
      const scheda = { ...modulo, link: libero + (query ? `?${query}` : ''), cartella: MODULI };
      delete scheda.aggiunto;
      return scheda;
    });
    avviso('creo la galleria…');
    const { galleria } = await scriviNellaGalleria(progetto, { modulo: scelte[0], tipo: 'etichette', galleria: null, pagina: null, avviso, titolo: nome });
    for (const scheda of scelte.slice(1)) await scriviNellaGalleria(progetto, { modulo: scheda, tipo: 'etichette', galleria, pagina: null, avviso });
    return { galleria, pagina: `${MODULI}/${libero}` };
  }

  async function togli(progetto, { modulo, cartella: da, negozio: a, avviso = () => {} }) {
    const dashboard = `assets/negozi/${a}-dashboard.js`;
    const testo = await (await leggi(progetto, dashboard)).text();
    const scheda = trovaScheda(testo, a, da, pagina(modulo.link));
    const link = scheda && (scheda.testo.match(/link:\s*'([^']+)'/) || [])[1];
    // nel negozio c'è un clone: si cancella tutto (scheda, pagina, risorse copiate)
    let eClone = false;
    if (a !== da && link) {
      try { eClone = Boolean(clone(await (await leggi(progetto, `${a}/${pagina(link)}`)).text())); } catch { /* pagina mancante */ }
    }
    if (eClone) {
      await eliminaClone(progetto, { negozio: a, nome: pagina(link), avviso });
      return;
    }
    avviso(`tolgo la scheda dalla dashboard di ${a}…`);
    await scriviFile(progetto, dashboard, togliScheda(testo, a, da, pagina(modulo.link)));
  }

  // Schede che aprono la pagina (link uguale, senza ?…), in tutte le sezioni
  function schedeDellaPagina(testo, nome) {
    return sezioni(testo).flatMap(voce => schede(testo, voce))
      .filter(scheda => pagina((scheda.testo.match(/link:\s*'([^']+)'/) || [])[1]) === nome);
  }
  function fantasma(testo, nome) {
    const trovate = schedeDellaPagina(testo, nome);
    return trovate.length > 0 && trovate.every(scheda => /nascosta:\s*true/.test(scheda.testo));
  }
  function impostaFantasma(testo, nome, nascosta) {
    // dall'ultima alla prima, così le posizioni delle schede prima restano giuste
    for (const scheda of schedeDellaPagina(testo, nome).reverse()) {
      const senza = scheda.testo.replace(/,\s*nascosta:\s*true/, '');
      const nuova = nascosta ? senza.replace(/\s*\}$/, ', nascosta: true }') : senza;
      testo = testo.slice(0, scheda.inizio) + nuova + testo.slice(scheda.fine + 1);
    }
    return testo;
  }

  const Associa = Object.freeze({ fantasma, impostaFantasma, clonaEtichette, layoutEtichette, usato, aggiungiScheda, togliScheda, adattaPagina, clone, scegliProgetto, associa, togli, eliminaClone, creaModulo, nomeFile, pagina });
  if (typeof window !== 'undefined') window.Associa = Associa;
  if (typeof module !== 'undefined') module.exports = Associa;
})();
