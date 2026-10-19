/* Associare un modulo ai negozi (area operatore, Gestione pacchetti › scheda del modulo). Strumento solo dell'operatore:
   scrive nella cartella del progetto collegata (File System Access API, Chrome / Edge sul computer, come Importa loghi);
   le modifiche vanno poi pubblicate con un commit.

   Un modulo (pagina <cartella>/<pagina>.html, scheda nella dashboard del suo negozio) si associa a un negozio:
   - stesso negozio della pagina: la sua scheda entra nella dashboard del negozio;
   - altro negozio: la pagina si copia nella cartella del negozio e si adatta a lui (data-negozio, percorsi delle sue
     risorse, con le immagini che mancano copiate dal negozio della pagina; un logo ufficiale scritto nella pagina come
     scelta di partenza che il negozio non ha diventa il logo di partenza delle sue pagine), la miniatura si copia nelle sue anteprime e
     la scheda entra nella sua dashboard, con origine: '<cartella>/<pagina>.html' (così si riconosce la copia). Se il
     negozio ha già una pagina con lo stesso nome, la copia si chiama <pagina>-<cartella>.html.
   Togliendo la spunta a un clone (pagina copiata da qui, con il segno storecraft-origine) la scheda esce dalla
   dashboard e il clone si cancella, con i file copiati per lui (elencati dal clone stesso in
   <meta name="storecraft-copiati">, cioè solo quelli che nel negozio mancavano) che nessun'altra pagina del negozio
   usa. I file del negozio (es. la sua bandiera) e le pagine di partenza dei negozi non si cancellano mai.
   Le schede stanno nella prima sezione della dashboard del tipo del modulo (cartelli, promo o, se manca, cartelli,
   cartellini). Le funzioni sul testo non toccano i file: le usa anche la prova da riga di comando.

   Uso (testo):
     Associa.usato(testoDashboard, negozio, cartella, pagina)      true se la dashboard usa il modulo (sua scheda o copia);
                                         pagina senza parametri: anche le schede con i parametri (etichette.html?label=…);
                                         il link intero di un modulo (con ?label=…): solo quella scheda
     Associa.aggiungiScheda(testoDashboard, tipo, scheda)          nuovo testo con la scheda in fondo alla sezione
     Associa.togliScheda(testoDashboard, negozio, cartella, pagina) nuovo testo senza la scheda del modulo
     Associa.adattaPagina(html, da, a, origine)                    { html, risorse: [{ cartella, file }] } da copiare
     Associa.elencoLoghi(testoElenco)                              { file, prioritari } da assets/logos/<negozio>/elenco.js
     Associa.logoPredefinito(pagine, elenco)                       logo di partenza del negozio (dalle sue pagine o dal menu)
     Associa.sostituisciLoghi(html, elencoDa, elencoA, logo)       { html, sostituiti }: i loghi che il negozio non ha
   Uso (file, con la cartella del progetto collegata):
     Associa.scegliProgetto(passaggio)                              cartella del progetto scelta e controllata (Chrome / Edge)
     Associa.associa(progetto, { modulo, tipo, cartella, negozio, sezione, nuovaGalleria, logo })
                                         aggiunge il modulo al negozio: nella galleria (sezione della dashboard) con id
                                         sezione, o in una galleria nuova con il titolo nuovaGalleria (senza: la prima
                                         del tipo); un modulo import (dal .psd) porta con sé le sue grafiche
                                         (assets/img/<negozio>/import/<pagina>/) e il logo del .psd come grafica di
                                         partenza (logo: { modo: 'grafica' }) o come logo ufficiale del negozio
                                         (logo: { modo: 'ufficiale', nome, prioritario }: nel menu BRAND, con le
                                         varianti colorate, e logo di partenza della pagina)
     Associa.chiediAssociazione({ progetto, modulo, tipo, cartella, negozio, nomeNegozio })
                                         finestra che chiede galleria e, per un modulo import, il logo: { sezione,
                                         nuovaGalleria, logo } o null (annullata)
     Negozi clone (dal 19 ottobre 2026, + NUOVO NEGOZIO in Gestione negozi): un negozio nato dalle utilità, da un modello
     (luxury per un outlet, tebe per una boutique). Ha la sua cartella <negozio>/ con la dashboard e le pagine di servizio,
     la scheda assets/negozi/<negozio>.js (con clone: true), .css e -dashboard.js, le cartelle delle risorse e la voce in
     installati.js. Si modifica (nome, sigla, indirizzo, descrizione, logo), si cancella (tutto) o si rende sorgente.
     Associa.idNegozio(nome)                                    id e nome della cartella dal nome del negozio
     Associa.testoSchedaNegozio(o) / testoDashboardNegozio(o)   testo della scheda e della dashboard di un negozio nuovo
     Associa.creaNegozio(progetto, o)                           crea il negozio (o: id, nome, sigla, indirizzo, descrizione,
                                         modello, tema, aspetto, oro, logo, logoNome, sezioni, intestazione, cassa, qr, loghi)
     Associa.modificaNegozio(progetto, { negozio, nome, sigla, indirizzo, indirizzoBreve, descrizione, logo, logoNome })
     Associa.eliminaNegozio(progetto, { negozio })              cancella un negozio clone e tutte le sue cartelle
     Associa.rendiSorgenteNegozio(progetto, { negozio })        il negozio clone diventa sorgente (non si cancella più)
     Associa.rendiSorgenteModulo(progetto, { negozio, nome })   la pagina clone diventa sorgente derivata (storecraft-derivata)
     Associa.registrando(azione)                               esegue azione() ricordando i file com'erano prima: dà il
                                         registro per Associa.annulla
     Associa.annulla(progetto, registro)                        rimette i file com'erano (ANNULLA di Gestione pacchetti)
     Associa.gallerie(testoDashboard, tipo)                    gallerie della dashboard adatte al tipo: [{ id, titolo, tipo, schede }]
     Associa.nuovaSezione(testoDashboard, tipo, titolo)         { testo, id }: la dashboard con una galleria nuova, vuota
     Associa.aggiungiAElenco(testoElenco, file, prioritario)    elenco.js dei loghi con il logo (e tra i prioritari)
     Associa.logoUfficiale(progetto, { negozio, nome, immagine, prioritario })
                                         logo ufficiale nuovo: originale, quattro varianti colorate ed elenco.js
     Associa.togli(progetto, { modulo, cartella, negozio })           lo toglie dalla dashboard (un clone si cancella)
     Associa.eliminaClone(progetto, { negozio, nome })              cancella il clone <negozio>/<nome> e la sua scheda
     Associa.clone(html)                                             origine del clone ('<cartella>/<pagina>.html') o null
     Associa.creaModulo(progetto, { sorgente, nome, scheda, tipo, galleria, miniatura })
                                         nuovo modulo da uno esistente: pagina <cartella>/<nome>.html (copia della pagina di
                                         partenza, con storecraft-origine), miniatura JPG, modulo in una galleria (galleria:
                                         id di una galleria creata qui, o null per una Nuova Galleria, galleria-<n>.js in
                                         assets/pacchetti/ e nell'elenco); restituisce { galleria, pagina }

   Un nuovo modulo non è in nessuna dashboard: si associa ai negozi dalla sua scheda, come gli altri.
     Associa.salvaImport(progetto, { nome, html, grafiche, font, miniatura, scheda, tipo, galleria, titoloGalleria })
                                         modulo nato da Import layout (dal file Photoshop): pagina moduli/<nome>.html, le sue
                                         grafiche in moduli/<nome>-grafiche/ (html può essere una funzione che riceve i loro
                                         percorsi), la miniatura e il modulo in una galleria (esistente, o nuova con il titolo
                                         titoloGalleria); restituisce { galleria, pagina }
     Associa.eliminaModulo(progetto, { galleria, modulo, negozi })
                                         toglie un nuovo modulo dalla sua galleria e cancella la sua pagina in moduli/ e la
                                         miniatura (se nessun altro modulo le usa) e la galleria creata qui rimasta vuota;
                                         rifiuta un modulo ancora in una dashboard (negozi: i negozi installati)
     Associa.togliModulo(testoGalleria, modulo)                      { testo, rimasti }: il testo senza il modulo
     Associa.rinomina(progetto, { galleria, titolo })              nuovo titolo del carosello (galleria creata qui: anche il nome)
     Associa.rinominaGalleria(testoGalleria, titolo, conNome)        il testo con il titolo nuovo

   Etichette DYMO: un nuovo modulo clona un set (la pagina delle etichette di un negozio) tenendo solo i layout scelti.
     Associa.clonaEtichette(progetto, { cartella, link, moduli, nome })   pagina <cartella>/<nome>.html e galleria nuova
                                         con i layout scelti (moduli: le schede del set da tenere); nella pagina gli altri
                                         layout si nascondono e si apre su uno di quelli scelti

   Ghost (Controllo codice): una pagina in ghost resta nella cartella del negozio ma la sua dashboard non la mostra, né
   come widget né nel menu laterale; le sue schede hanno nascosta: true (dashboard.js le salta).
     Associa.fantasma(testoDashboard, pagina)               true se le schede che aprono la pagina sono in ghost
     Associa.impostaFantasma(testoDashboard, pagina, sì/no)  nuovo testo con tutte le schede della pagina in ghost o no

   Gestione negozi: un modulo alla volta, nella sua galleria (sezione della dashboard, per id; scheda per chiave: link,
   pdf o titolo).
     Associa.chiaveScheda(testoScheda)                        la chiave di una scheda
     Associa.fantasmaScheda(testo, sezione, chiave)            true se quel modulo è in ghost
     Associa.impostaFantasmaScheda(testo, sezione, chiave, sì/no)  nuovo testo con il solo modulo in ghost o no
     Associa.ordine(testo, sezione)                            ordine dei widget scritto nella sezione (null: di partenza)
     Associa.impostaOrdine(testo, sezione, chiavi | null)      nuovo testo con l'ordine (null o quello di partenza: tolto)
     Associa.schedaDuplicata(testo, sezione, chiave, link, origine)  nuovo testo con la copia dopo l'originale
     Associa.modificaScheda(testo, sezione, chiave, campi)      nuovo testo con titolo, specifiche, tipo, badge, miniature
     Associa.modifica(progetto, { negozio, sezione, chiave, campi, miniatura })  scrive la modifica (solo i cloni)
     Associa.spostaScheda(testo, sezione, chiave, altraSezione)  nuovo testo con il modulo in fondo a un'altra galleria
     Associa.scriviMiniatura(progetto, negozio, nome, file)   salva un'immagine tra le miniature del negozio, dà il percorso
     Associa.derivata(html)                                    pagina sorgente da cui deriva (storecraft-derivata) o null
     Associa.ultimoClone(testiDashboard, origine)              true se togliendo il clone sparisce dal catalogo (doppia conferma)

   Regola del 12 ottobre 2026: moduli sorgente (pagine scritte a codice, di Luxury Outlet e TEBE o derivate da loro,
   anche con storecraft-derivata) e moduli clone (pagine con storecraft-origine, create dalle utilità). Dalle utilità i
   sorgente si mettono in ghost e si spostano, ma non si modificano né si cancellano; i cloni permettono tutto.
     Associa.duplica(progetto, { negozio, sezione, chiave })    copia la pagina (<pagina>-copia.html, un clone) e la scheda
     Associa.togliDaOrdini(testo, pagina)                      nuovo testo senza le voci della pagina negli ordini */
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

  // Le sezioni della dashboard: { tipo, id, titolo, oggetto, inizio, fine } (inizio e fine dell'elenco schede, [ … ];
  // oggetto: dove comincia la sezione, { … })
  function sezioni(testo) {
    const elenco = [];
    for (const trovato of testo.matchAll(/tipo:\s*'(cartelli|promo|cartellini|etichette|stampe)'/g)) {
      // il tipo di una sezione è minuscolo (quello delle schede è maiuscolo: CARTELLO, PDF…); l'elenco schede la segue
      const schede = testo.indexOf('schede: [', trovato.index);
      if (schede < 0) continue;
      const aperta = schede + 'schede: '.length;
      // l'oggetto della sezione: la graffa aperta prima del tipo (tra le due ci sono solo id, carosello e titolo)
      let oggetto = -1;
      for (let i = trovato.index - 1, livello = 0; i >= 0; i--) {
        if (testo[i] === '}') livello++;
        else if (testo[i] === '{') { if (!livello) { oggetto = i; break; } livello--; }
      }
      const testa = oggetto >= 0 ? testo.slice(oggetto, trovato.index) : '';
      const id = (testa.match(/id:\s*'([^']+)'/) || [])[1] || '';
      const titolo = ((testa.match(/titolo:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/) || []).slice(1).find(v => v != null) || '').replace(/\\(.)/g, '$1');
      elenco.push({ tipo: trovato[1], id, titolo, oggetto, inizio: aperta, fine: chiusura(testo, aperta) });
    }
    return elenco;
  }

  // gallerie della dashboard dove può stare un modulo del tipo: cartelli e promo tra loro, gli altri con il loro tipo
  const compatibili = tipo => tipo === 'cartelli' || tipo === 'promo' ? ['cartelli', 'promo'] : [tipo];
  function gallerie(testo, tipo) {
    return sezioni(testo).filter(voce => compatibili(tipo).includes(voce.tipo))
      .map(voce => ({ id: voce.id, titolo: voce.titolo, tipo: voce.tipo, schede: schede(testo, voce).length }));
  }

  // una galleria nuova (sezione vuota della dashboard) dopo l'ultima del suo tipo (le promo dopo l'ultima dei cartelli,
  // se non ce ne sono); { testo, id }
  function nuovaSezione(testo, tipo, titolo) {
    const tutte = sezioni(testo);
    const dopo = [...tutte].reverse().find(voce => voce.tipo === tipo) || [...tutte].reverse().find(voce => compatibili(tipo).includes(voce.tipo)) || tutte.at(-1);
    if (!dopo || dopo.oggetto < 0) throw new Error('Nella dashboard non ci sono gallerie: non so dove mettere quella nuova.');
    const radice = String(titolo).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'galleria';
    let id = `${radice}-section`;
    for (let n = 2; tutte.some(voce => voce.id === id); n++) id = `${radice}-${n}-section`;
    const carosello = id.replace(/-section$/, '-carousel');
    const fine = chiusura(testo, dopo.oggetto);
    const rientro = testo.slice(testo.lastIndexOf('\n', dopo.oggetto) + 1, dopo.oggetto);
    const nuova = `{\n${rientro}  id: ${virgolette(id)}, carosello: ${virgolette(carosello)}, titolo: ${virgolette(titolo)}, tipo: ${virgolette(tipo)},\n${rientro}  schede: [\n${rientro}  ]\n${rientro}}`;
    return { testo: `${testo.slice(0, fine + 1)},\n${rientro}${nuova}${testo.slice(fine + 1)}`, id };
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

  // nome della pagina (es. etichette.html): vale anche la scheda con i parametri nel link (etichette.html?label=…);
  // link con i parametri (es. etichette.html?label=lastchance): solo la scheda con quel link, così ogni etichetta conta da sé
  const suaScheda = (scheda, negozio, cartella, nome) => {
    const fine = nome.includes('?') ? "'" : "(?:'|\\?)";
    const link = new RegExp(`link:\\s*'${nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${fine}`);
    return (negozio === cartella && link.test(scheda.testo)) || scheda.testo.includes(`origine: '${cartella}/${pagina(nome)}'`);
  };

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

  function aggiungiScheda(testo, tipo, scheda, idSezione = null) {
    const voce = idSezione ? sezioni(testo).find(v => v.id === idSezione) : sezione(testo, tipo);
    if (!voce) throw new Error(idSezione ? `Nella dashboard non c'è la galleria ${idSezione}.` : `Nella dashboard non c'è una sezione ${tipo} in cui mettere il modulo.`);
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
    return trovata ? togliOggetto(testo, trovata) : testo;
  }
  // toglie dal testo un oggetto { … } di un elenco: la sua riga intera (anche su più righe) e la virgola che lo separa
  // dal vicino
  function togliOggetto(testo, trovata) {
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
    // (anche una pagina sorgente derivata perde il suo segno storecraft-derivata: la copia è un clone)
    nuovo = nuovo.replace(/\n?\s*<!-- modulo sorgente, scritto a codice[^>]*-->/g, '')
      .replace(/\n?\s*<meta name="storecraft-(origine|copiati|derivata)" content="[^"]*">/g, '')
      .replace(/(<meta charset="[^"]*">)/i, `$1\n  <meta name="storecraft-origine" content="${origine}">`);
    return { html: nuovo, risorse };
  }

  // ----- Logo di partenza del menu BRAND in una pagina copiata in un altro negozio -----
  // Una pagina può scrivere il nome di un logo ufficiale del suo negozio come scelta di partenza (es. Luxury:
  // const DEFAULT_LOGO = "LUXURY_GOLD.png"). Copiata in un negozio che quel logo non ce l'ha, l'anteprima mostrerebbe
  // un'immagine rotta: il nome si sostituisce con il logo di partenza che usano le pagine del negozio (il nome di logo
  // del negozio scritto più spesso nelle sue pagine, cloni esclusi); se nessuna sua pagina ne scrive uno, il primo logo
  // del suo menu BRAND (brand prioritari per primi, come getOrderedLogoFiles di logos.js).

  // { file, prioritari } da assets/logos/<negozio>/elenco.js
  function elencoLoghi(testo) {
    const lista = nome => [...((String(testo).match(new RegExp(`^const\\s+${nome}\\s*=\\s*\\[([\\s\\S]*?)\\]`, 'm')) || [])[1] || '')
      .matchAll(/["']([^"']+)["']/g)].map(m => m[1]);
    return { file: lista('LOGO_FILES'), prioritari: lista('PRIORITY_BRANDS') };
  }
  const tra = nome => new RegExp(`(["'\`])${nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`, 'g');
  // il logo di partenza del negozio, dalle sue pagine (testi html) e dal suo elenco
  function logoPredefinito(pagine, elenco) {
    const conti = new Map();
    for (const html of pagine) {
      if (clone(html)) continue;
      for (const file of elenco.file) {
        const volte = (html.match(tra(file)) || []).length;
        if (volte) conti.set(file, (conti.get(file) || 0) + volte);
      }
    }
    if (conti.size) return [...conti].sort((x, y) => y[1] - x[1])[0][0];
    const ordinati = elenco.prioritari.filter(f => elenco.file.includes(f)).concat(elenco.file.filter(f => !elenco.prioritari.includes(f)));
    return ordinati[0] || '';
  }
  // sostituisce nella pagina i loghi del negozio di partenza che il negozio non ha; { html, sostituiti: [nomi] }
  function sostituisciLoghi(html, elencoDa, elencoA, predefinito) {
    const sostituiti = [];
    let nuovo = html;
    if (!predefinito) return { html, sostituiti };
    for (const file of elencoDa.file) {
      if (elencoA.file.includes(file) || !tra(file).test(nuovo)) continue;
      nuovo = nuovo.replace(tra(file), (tutto, virgolette) => `${virgolette}${predefinito}${virgolette}`);
      sostituiti.push(file);
    }
    return { html: nuovo, sostituiti };
  }

  // elenco.js con un logo nuovo in LOGO_FILES (in ordine alfabetico, come loghi-ufficiali.html) e, se prioritario, in
  // PRIORITY_BRANDS (in fondo ai prioritari)
  function aggiungiAElenco(testo, file, prioritario = false) {
    let nuovo = String(testo || '');
    if (!/^const\s+LOGO_FILES\s*=/m.test(nuovo)) nuovo = `// Elenco dei loghi ufficiali del negozio (file in questa cartella) e brand prioritari.\nconst LOGO_FILES = [\n];\n\nconst PRIORITY_BRANDS = [];\n`;
    const { file: files, prioritari } = elencoLoghi(nuovo);
    const tutti = [...new Set([...files, file])].sort((x, y) => x.toUpperCase().localeCompare(y.toUpperCase(), 'it', { sensitivity: 'base' }));
    nuovo = nuovo.replace(/^const\s+LOGO_FILES\s*=\s*\[[\s\S]*?\]\s*;?/m, `const LOGO_FILES = [\n${tutti.map(f => `  "${f}"`).join(',\n')}\n];`);
    if (prioritario && !prioritari.includes(file)) {
      const lista = [...prioritari, file].map(f => `"${f}"`).join(', ');
      nuovo = /^const\s+PRIORITY_BRANDS\s*=/m.test(nuovo)
        ? nuovo.replace(/^const\s+PRIORITY_BRANDS\s*=\s*\[[\s\S]*?\]\s*;?/m, `const PRIORITY_BRANDS = [${lista}];`)
        : `${nuovo.trimEnd()}\n\nconst PRIORITY_BRANDS = [${lista}];\n`;
    }
    return nuovo;
  }
  // nome del file di un logo ufficiale dal nome scritto: maiuscolo, senza accenti né spazi (SALE INVADERS → SALEINVADERS.png)
  const fileLogo = nome => `${String(nome).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9_-]+/g, '') || 'LOGO'}.png`;
  // le quattro varianti di stampa (come loghi-ufficiali.html): ogni pixel visibile nel colore, la trasparenza resta
  async function variante(immagine, rgb) {
    const bitmap = await createImageBitmap(immagine);
    const tela = document.createElement('canvas');
    tela.width = bitmap.width; tela.height = bitmap.height;
    const ctx = tela.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    const dati = ctx.getImageData(0, 0, tela.width, tela.height);
    for (let i = 0; i < dati.data.length; i += 4) if (dati.data[i + 3] > 0) { dati.data[i] = rgb[0]; dati.data[i + 1] = rgb[1]; dati.data[i + 2] = rgb[2]; }
    ctx.putImageData(dati, 0, 0);
    return new Promise(fatto => tela.toBlob(fatto, 'image/png'));
  }
  const rgbDi = esadecimale => { const h = String(esadecimale).replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  // logo ufficiale nuovo del negozio: assets/logos/<negozio>/<NOME>.png, le varianti white, black, red e gold (l'oro del
  // negozio, dalla sua scheda) in assets/img/<negozio>/printlogos/ ed elenco.js. Un logo con lo stesso nome che il
  // negozio ha già non si sovrascrive (si aggiunge solo ai prioritari, se richiesto). Restituisce il nome del file
  async function logoUfficiale(progetto, { negozio, nome, immagine, prioritario = false, avviso = () => {} }) {
    const file = fileLogo(nome);
    const elenco = `assets/logos/${negozio}/elenco.js`;
    const testo = await (await leggi(progetto, elenco)).text().catch(() => '');
    if (!elencoLoghi(testo).file.includes(file) || !await esiste(progetto, `assets/logos/${negozio}/${file}`)) {
      const scheda = await (await leggi(progetto, `assets/negozi/${negozio}.js`)).text().catch(() => '');
      const oro = (scheda.match(/oro:\s*'(#[0-9a-fA-F]{6})'/) || [])[1] || '#b48b37';
      avviso(`logo ufficiale ${file}: originale e varianti colorate in ${negozio}…`);
      await scriviFile(progetto, `assets/logos/${negozio}/${file}`, immagine);
      for (const [colore, rgb] of [['white', [255, 255, 255]], ['black', [0, 0, 0]], ['red', [224, 0, 0]], ['gold', rgbDi(oro)]]) {
        await scriviFile(progetto, `assets/img/${negozio}/printlogos/${colore}${file}`, await variante(immagine, rgb));
      }
    } else avviso(`logo ufficiale ${file}: ${negozio} lo ha già, uso quello`);
    await scriviFile(progetto, elenco, aggiungiAElenco(testo, file, prioritario));
    return file;
  }

  // ===== Negozi clone =====
  const PAGINE_NEGOZIO = ['index.html', 'lista-stampa.html', 'cronologia-stampa.html', 'bacheca.html', 'genera_loghi.html', 'gestisci_lista.html', 'pdf-viewer.html'];
  // id del negozio dal nome: minuscolo, senza accenti, parole unite da trattini (es. BOUTIQUE ROMA → boutique-roma)
  const idNegozio = nome => String(nome).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'negozio';
  // sigla di un negozio nuovo: il suo nome (la sigla di Luxury Outlet, LXRY, è un marchio a sé); solo un nome lungo
  // (oltre 12 caratteri) si accorcia nelle iniziali, per le etichette strette di Gestione negozi (BOUTIQUE ROMA CENTRO → BRC)
  const siglaNegozio = nome => {
    const pulito = String(nome).trim().toUpperCase();
    if (pulito.length <= 12) return pulito;
    const parole = pulito.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9 ]/g, '').split(/\s+/).filter(Boolean);
    return (parole.length > 1 ? parole.map(p => p[0]).join('') : parole[0] || pulito).slice(0, 12);
  };
  const testoHtml = valore => String(valore).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const RISORSE_NEGOZIO = ['img', 'logos', 'thumbnail', 'pdf', 'foto'];
  // Il logo del negozio nelle pagine del modello: le immagini (in assets/img/<modello>/) che portano il logo del modello
  // (piè dei cartelli, cartellini, etichette DYMO). Per un negozio nuovo si rifanno con il suo logo, alla stessa misura e
  // nello stesso riquadro (LogoNegozio.adatta): le pagine copiate nel negozio le trovano già e non si sposta niente.
  // (oro: le immagini oro prendono l'oro del negozio; le altre il colore principale dell'originale: rosso, arancio, nero)
  const LOGO_NELLE_PAGINE = {
    luxury: ['footer.png', 'footer_orange.png', 'footer_xmas.png', 'LUXURYOUTLET_BACK.png', ['logocartellini.png', 'oro'], 'loghinored.png', ['printlogos/goldLXRY_BRAND.png', 'oro']],
    tebe: [['footer_tebe.png', 'oro'], ['tebeoro.png', 'oro'], 'tebeblack.png']
  };
  // I brand propri del modello tra i suoi loghi ufficiali (il marchio del negozio, non i brand che vende): non si copiano
  // nel negozio nuovo e, nelle pagine copiate nel negozio, la scelta di partenza diventa il logo del negozio
  const BRAND_DEL_MODELLO = { luxury: ['LUXURY_GOLD.png', 'LXRY_BRAND.png', 'LXRY.png'], tebe: ['269TEBE.PNG', 'Tebe269.png', 'Tebe.png'], ophilya: ['269TEBE.PNG', 'Tebe269.png', 'Tebe.png'] };
  // le gallerie di partenza di un negozio nuovo, per tipo: id, carosello e titolo
  const DATI_SEZIONE = {
    cartelli: { id: 'generators', titolo: 'Crea Cartelli' },
    promo: { id: 'seasonal-promo', titolo: 'Promo Stagionali' },
    cartellini: { id: 'tickets', titolo: 'Cartellini' },
    etichette: { id: 'dymo', titolo: 'Etichette Dymo' },
    stampe: { id: 'prints', titolo: 'Stampe Pronte' }
  };

  function testoSchedaNegozio(o) {
    const riga = (chiave, valore, nota = '') => `  ${chiave}: ${typeof valore === 'string' ? virgolette(valore) : JSON.stringify(valore).replace(/"(\w+)":/g, '$1: ').replace(/"/g, "'")},${nota ? `   // ${nota}` : ''}`;
    return [
      `/* Scheda del negozio ${o.nome} (vedi assets/js/negozi.js). I colori sono in ${o.id}.css.`,
      `   Negozio clone: creato in Gestione negozi il ${new Date().toLocaleDateString('it-IT')} dal modello ${o.modello} (${o.tipo}). */`,
      `Negozi.registra(${virgolette(o.id)}, {`,
      riga('nome', o.nome),
      riga('sigla', o.sigla || siglaNegozio(o.nome), 'il nome; solo un nome lungo si accorcia nelle iniziali'),
      riga('clone', true, 'negozio clone: si modifica e si cancella da Gestione negozi; «rendi sorgente» toglie questa riga'),
      riga('modello', o.modello, 'il negozio da cui ha preso aspetto e pagine'),
      riga('logoSplash', o.logo),
      riga('logoSplashLarghezza', o.logoLarghezza || 150),
      riga('indirizzo', o.indirizzo || ''),
      riga('indirizzoBreve', o.indirizzoBreve || o.indirizzo || ''),
      riga('logoMenu', o.logo),
      riga('logoMenuLarghezza', o.logoLarghezza || 185),
      riga('oro', o.oro),
      ...(o.logoUfficiale ? [riga('logoUfficiale', o.logoUfficiale, 'il logo del negozio tra i loghi ufficiali: di partenza nei menu BRAND delle pagine copiate qui')] : []),
      ...(o.logoAColori ? [riga('logoAColori', true, 'logo a colori: nella dashboard e nella splash page resta a colori')] : []),
      riga('brandPrioritari', o.modello === 'tebe' ? 'maiuscolo' : 'stella'),
      riga('listaStampa', `${o.id}-lista-stampa`),
      riga('cronologiaStampa', `${o.id}-cronologia-stampa`),
      '  guida: null,',
      `  interfaccia: { tema: ${virgolette(o.tema)}, aspetto: ${virgolette(o.aspetto)} }`,
      '});',
      ''
    ].join('\n');
  }

  function testoDashboardNegozio(o) {
    const usati = {};
    const sezioni = o.sezioni.map(sezione => {
      const base = DATI_SEZIONE[sezione.tipo] || DATI_SEZIONE.cartelli;
      usati[base.id] = (usati[base.id] || 0) + 1;
      const id = usati[base.id] === 1 ? base.id : `${base.id}-${usati[base.id]}`;
      return `    {\n      id: ${virgolette(`${id}-section`)}, carosello: ${virgolette(`${id}-carousel`)}, titolo: ${virgolette(sezione.titolo || base.titolo)}, tipo: ${virgolette(sezione.tipo)},\n      schede: [\n      ]\n    }`;
    });
    const intestazione = ['titolo: false', ...['dataOra', 'radio', 'meteo'].filter(k => o.intestazione?.[k]).map(k => `${k}: true`)];
    return [
      `/* Contenuto della dashboard di ${o.nome} (vedi assets/js/dashboard.js). Immagini e PDF nella cartella assets/.`,
      '   Negozio clone creato in Gestione negozi: le gallerie nascono vuote e i moduli si aggiungono con le spunte di Gestione',
      '   pacchetti o del catalogo (una galleria senza moduli non compare nella dashboard). */',
      'Dashboard.contenuto({',
      `  intestazione: { ${intestazione.join(', ')} },`,
      `  logo: { src: ${virgolette(o.logo)}, larghezza: ${o.logoLarghezza || 185}, alt: ${virgolette(o.nome)} },`,
      `  identita: [${virgolette(o.indirizzo || '')}, ${virgolette(o.descrizione || '')}],`,
      `  qr: ${virgolette(o.qr || 'https://fabriceimpresa.github.io/storecraft/')},`,
      `  cassa: ${virgolette(o.cassa === 'solo-cassiere' ? 'solo-cassiere' : 'sempre')},`,
      '  sezioni: [',
      sezioni.join(',\n'),
      '  ]',
      '});',
      ''
    ].join('\n');
  }

  // l'elenco dei negozi installati con un negozio in più (o in meno)
  function installatiCon(testo, id, aggiungi = true) {
    return String(testo).replace(/Negozi\.installa\(\[([^\]]*)\]/, (tutto, dentro) => {
      const ids = [...dentro.matchAll(/'([^']+)'/g)].map(m => m[1]).filter(x => x !== id);
      if (aggiungi) ids.push(id);
      return `Negozi.installa([${ids.map(x => `'${x}'`).join(', ')}]`;
    });
  }

  // copia una cartella intera (sottocartelle comprese) da un percorso a un altro del progetto
  async function copiaCartella(progetto, da, a, avviso = () => {}, salta = () => false) {
    let sorgente;
    try { sorgente = await cartella(progetto, da); } catch { return 0; }
    let quanti = 0;
    for await (const [nome, voce] of sorgente.entries()) {
      if (voce.kind === 'directory') quanti += await copiaCartella(progetto, `${da}/${nome}`, `${a}/${nome}`, avviso, salta);
      else if (!salta(nome)) {
        await scriviFile(progetto, `${a}/${nome}`, await istantanea(voce));
        if (++quanti % 40 === 0) avviso(`copio ${da}/ in ${a}/… ${quanti} file`);
      }
    }
    return quanti;
  }
  // cancella una cartella intera; ricorda prima i suoi file (per annulla)
  async function cancellaCartella(progetto, percorso) {
    const parti = percorso.split('/');
    let dir;
    try { dir = await cartella(progetto, percorso); } catch { return false; }
    const ricordaTutto = async (d, base) => {
      for await (const [nome, voce] of d.entries()) {
        if (voce.kind === 'directory') await ricordaTutto(voce, `${base}/${nome}`);
        else await ricorda(progetto, `${base}/${nome}`);
      }
    };
    if (registro) await ricordaTutto(dir, percorso);
    await (await cartella(progetto, parti.slice(0, -1).join('/'))).removeEntry(parti.at(-1), { recursive: true });
    return true;
  }

  async function creaNegozio(progetto, o, avviso = () => {}) {
    const id = o.id;
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`«${id}» non va bene come nome della cartella: solo lettere minuscole, numeri e trattini`);
    const installati = await (await leggi(progetto, 'assets/negozi/installati.js')).text();
    if (new RegExp(`'${id}'`).test(installati) || await esiste(progetto, `assets/negozi/${id}.js`)) throw new Error(`c'è già un negozio «${id}»: scegli un altro nome`);
    try { await cartella(progetto, id); throw new Error(`c'è già una cartella ${id}/ nel progetto: scegli un altro nome`); } catch (errore) { if (errore.name !== 'NotFoundError' && errore.name !== 'TypeError') throw errore; }
    const m = o.modello;
    const LN = typeof window !== 'undefined' ? window.LogoNegozio : null;
    // il logo: quello caricato, già analizzato (sfondo tolto dagli angoli e ritagliato, o.logoTela), in
    // assets/img/<negozio>/logo.png; senza, quello di STORE // CRAFT
    let logo = 'img/storecraftlogo.png';
    let tela = o.logoTela || null;
    if (tela) {
      logo = `img/${id}/logo.png`;
      avviso(`salvo il logo assets/${logo}…`);
      await scriviFile(progetto, `assets/${logo}`, await LN.png(tela));
    } else if (o.logoFile) {
      const estensione = (String(o.logoNome || '').match(/\.(png|jpe?g|webp|svg)$/i) || [, 'png'])[1].toLowerCase();
      logo = `img/${id}/logo.${estensione}`;
      await scriviFile(progetto, `assets/${logo}`, o.logoFile);
    }
    if (!tela && LN) {
      const url = URL.createObjectURL(await leggi(progetto, 'assets/img/storecraftlogo.png'));
      try { const img = await LN.caricaImmagine(url); tela = document.createElement('canvas'); tela.width = img.naturalWidth; tela.height = img.naturalHeight; tela.getContext('2d').drawImage(img, 0, 0); }
      finally { URL.revokeObjectURL(url); }
    }
    const aColori = Boolean(o.logoAColori && o.logoTela);
    // il logo tra i loghi ufficiali del negozio (in evidenza, primo nei menu BRAND): a tinta piatta con le 4 varianti
    // colorate, a colori con una sola versione (le 4 varianti sono la stessa immagine, così le pagine la trovano)
    const logoUfficiale = fileLogo(o.nome);
    const dati = { ...o, logo, logoUfficiale, logoAColori: aColori };
    // le pagine del negozio: la dashboard e le pagine di servizio del modello, adattate a lui
    for (const file of PAGINE_NEGOZIO) {
      let html;
      try { html = await (await leggi(progetto, `${m}/${file}`)).text(); } catch { continue; }
      let { html: nuovo, risorse } = adattaPagina(html, m, id, `${m}/${file}`);
      // pagine proprie del negozio, non cloni: niente segno d'origine
      nuovo = nuovo.replace(/\n?\s*<meta name="storecraft-origine" content="[^"]*">/, '')
        .replace(new RegExp(`· ${(Negozi?.scheda?.(m)?.nome || m.toUpperCase()).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), `· ${testoHtml(o.nome)}`)
        .replace(new RegExp(`store=${m}\\b`, 'g'), `store=${id}`);
      avviso(`scrivo ${id}/${file}…`);
      await scriviFile(progetto, `${id}/${file}`, nuovo);
      await copiaRisorse(progetto, risorse, m, id);
    }
    // la bandiera Made in Italy del modello (la usano i moduli con il tema Made in Italy)
    await copiaRisorsa(progetto, 'img', m, id, 'madeinitaly.png');
    // il logo del negozio nelle immagini delle pagine dei modelli (piè dei cartelli, cartellini, etichette), alla stessa
    // misura e nello stesso riquadro del loro logo: le pagine copiate qui le trovano già (copiaRisorse non le
    // sovrascrive) e non si sposta niente. Di tutti e due i modelli: un negozio può ricevere moduli da Luxury e da TEBE
    if (tela && LN) {
      for (const [modelloImmagini, voci] of Object.entries(LOGO_NELLE_PAGINE)) for (const voce of voci) {
        const [file, colore] = Array.isArray(voce) ? voce : [voce, null];
        let originale;
        if (await esiste(progetto, `assets/img/${id}/${file}`)) continue;
        try { originale = await leggi(progetto, `assets/img/${modelloImmagini}/${file}`); } catch { continue; }
        const url = URL.createObjectURL(originale);
        try {
          avviso(`logo del negozio in assets/img/${id}/${file}…`);
          await scriviFile(progetto, `assets/img/${id}/${file}`, await LN.png(await LN.adatta(tela, await LN.caricaImmagine(url), { colori: aColori, colore: colore === 'oro' ? rgbDi(o.oro || '#b48b37') : null })));
        } finally { URL.revokeObjectURL(url); }
      }
    }
    // loghi ufficiali: quelli del modello, o nessuno (si importano da Loghi ufficiali)
    const propri = BRAND_DEL_MODELLO[m] || [];
    let elenco;
    if (o.loghi === 'copia') {
      avviso(`copio i loghi ufficiali di ${m} (senza i suoi marchi: ${propri.join(', ')})…`);
      // (senza badare a maiuscole: 269TEBE.PNG ha le varianti black269TEBE.png…)
      const minuscolo = nome => nome.toLowerCase().replace(/\.png$/, '');
      const salta = nome => propri.some(p => [p, ...['white', 'black', 'red', 'gold'].map(c => c + p)].some(x => minuscolo(x) === minuscolo(nome)));
      await copiaCartella(progetto, `assets/logos/${m}`, `assets/logos/${id}`, avviso, salta);
      await copiaCartella(progetto, `assets/img/${m}/printlogos`, `assets/img/${id}/printlogos`, avviso, salta);
      elenco = (await (await leggi(progetto, `assets/logos/${id}/elenco.js`)).text()).replace(/^\/\/ assets\/logos\/[\w-]+\/elenco\.js/m, `// assets/logos/${id}/elenco.js`)
        .replace(/loghi ufficiali di [^(\n]+\(/, `loghi ufficiali di ${o.nome} (`)
        .replace(/^\/\/ BRAND PRIORITARI[^\n]*(\n\/\/[^\n]*)*/m, '// BRAND PRIORITARI: in evidenza, mostrati per primi in ogni menu a cascata dei loghi (il primo è il logo del negozio).');
      // i marchi del modello escono anche dall'elenco
      const voci = elencoLoghi(elenco);
      elenco = elenco.replace(/^const\s+LOGO_FILES\s*=\s*\[[\s\S]*?\]\s*;?/m, `const LOGO_FILES = [\n${voci.file.filter(f => !propri.includes(f)).map(f => `  "${f}"`).join(',\n')}\n];`)
        .replace(/^const\s+PRIORITY_BRANDS\s*=\s*\[[\s\S]*?\]\s*;?/m, `const PRIORITY_BRANDS = [${voci.prioritari.filter(f => !propri.includes(f)).map(f => `"${f}"`).join(', ')}];`);
    } else {
      elenco = `// assets/logos/${id}/elenco.js\n// Elenco dei loghi ufficiali di ${o.nome} (file in questa cartella) e brand prioritari del negozio.\n// Il codice che usa l'elenco è comune, in assets/js/logos.js. loghi-ufficiali.html (nella radice)\n// aggiorna LOGO_FILES: tenerlo nella forma const LOGO_FILES = [ "NOME.png", … ];\nconst LOGO_FILES = [\n];\n\n// BRAND PRIORITARI: mostrati per primi in ogni menu a cascata dei loghi.\nconst PRIORITY_BRANDS = [];\n`;
    }
    // il logo del negozio tra i suoi loghi ufficiali, primo dei brand in evidenza
    if (tela && LN) {
      avviso(`logo ufficiale ${logoUfficiale}: ${aColori ? 'a colori, una sola versione' : 'a tinta piatta, 4 varianti'}…`);
      const originale = await LN.png(tela);
      await scriviFile(progetto, `assets/logos/${id}/${logoUfficiale}`, originale);
      for (const [colore, rgb] of [['white', [255, 255, 255]], ['black', [0, 0, 0]], ['red', [224, 0, 0]], ['gold', rgbDi(o.oro || '#b48b37')]]) {
        await scriviFile(progetto, `assets/img/${id}/printlogos/${colore}${logoUfficiale}`, aColori ? originale : await LN.png(LN.tinta(tela, rgb)));
      }
      elenco = aggiungiAElenco(elenco, logoUfficiale, false);
      const voci = elencoLoghi(elenco);
      elenco = elenco.replace(/^const\s+PRIORITY_BRANDS\s*=\s*\[[\s\S]*?\]\s*;?/m, `const PRIORITY_BRANDS = [${[logoUfficiale, ...voci.prioritari.filter(f => f !== logoUfficiale)].map(f => `"${f}"`).join(', ')}];`);
    }
    await scriviFile(progetto, `assets/logos/${id}/elenco.js`, elenco);
    // scheda, colori e dashboard
    avviso(`scrivo la scheda del negozio assets/negozi/${id}.js…`);
    await scriviFile(progetto, `assets/negozi/${id}.js`, testoSchedaNegozio(dati));
    const css = await (await leggi(progetto, `assets/negozi/${m}.css`)).text();
    await scriviFile(progetto, `assets/negozi/${id}.css`, `/* Colori del negozio ${o.nome}: copia dei colori di ${m} (negozio clone, vedi ${id}.js). */\n`
      + css.replace(new RegExp(`data-negozio="${m}"`, 'g'), `data-negozio="${id}"`)
        // il colore del cursore sul foglio scelto (oro come Luxury, rosso come TEBE); le misure restano quelle del modello
        .replace(/(--cursore-colore:\s*)#[0-9a-fA-F]{3,6}/, (t, prima) => `${prima}${o.cursore || (m === 'tebe' ? '#96382b' : '#b48b37')}`));
    await scriviFile(progetto, `assets/negozi/${id}-dashboard.js`, testoDashboardNegozio(dati));
    // per ultimo l'elenco dei negozi installati: da qui il negozio compare nella splash page e nei menu
    avviso('aggiungo il negozio a installati.js…');
    await scriviFile(progetto, 'assets/negozi/installati.js', installatiCon(installati, id, true));
    return { id, logo };
  }

  const eNegozioClone = testo => /^\s*clone:\s*true,/m.test(String(testo));
  async function eliminaNegozio(progetto, { negozio, avviso = () => {} }) {
    const scheda = await (await leggi(progetto, `assets/negozi/${negozio}.js`)).text();
    if (!eNegozioClone(scheda)) throw new Error(`${negozio} è un negozio sorgente: non si cancella dalle utilità`);
    // prima l'elenco: il negozio sparisce subito dalla splash page e dai menu
    avviso('tolgo il negozio da installati.js…');
    await scriviFile(progetto, 'assets/negozi/installati.js', installatiCon(await (await leggi(progetto, 'assets/negozi/installati.js')).text(), negozio, false));
    avviso(`cancello la cartella ${negozio}/…`);
    await cancellaCartella(progetto, negozio);
    for (const tipo of RISORSE_NEGOZIO) if (await cancellaCartella(progetto, `assets/${tipo}/${negozio}`)) avviso(`cancello assets/${tipo}/${negozio}/…`);
    for (const file of [`${negozio}.js`, `${negozio}.css`, `${negozio}-dashboard.js`]) { try { await cancella(progetto, `assets/negozi/${file}`); } catch { /* già tolto */ } }
  }
  async function rendiSorgenteNegozio(progetto, { negozio }) {
    const percorso = `assets/negozi/${negozio}.js`;
    const scheda = await (await leggi(progetto, percorso)).text();
    if (!eNegozioClone(scheda)) return;
    await scriviFile(progetto, percorso, scheda.replace(/^\s*clone:\s*true,[^\n]*\n/m,
      `  // negozio sorgente dal ${new Date().toLocaleDateString('it-IT')} (prima clone): si modifica e si cancella solo dal codice\n`));
  }
  // nome, sigla, indirizzo, descrizione e logo di un negozio clone, nella scheda e nella dashboard
  async function modificaNegozio(progetto, { negozio, nome, sigla, indirizzo, indirizzoBreve, descrizione, logoFile = null, logoNome = '' }) {
    const percorso = `assets/negozi/${negozio}.js`;
    let scheda = await (await leggi(progetto, percorso)).text();
    if (!eNegozioClone(scheda)) throw new Error(`${negozio} è un negozio sorgente: si modifica dal codice`);
    let dashboard = await (await leggi(progetto, `assets/negozi/${negozio}-dashboard.js`)).text();
    const campo = (testo, chiave, valore) => testo.replace(new RegExp(`(\\n\\s*${chiave}:\\s*)'(?:[^'\\\\]|\\\\.)*'`), (t, prima) => `${prima}${virgolette(valore)}`);
    if (logoFile) {
      const estensione = (String(logoNome).match(/\.(png|jpe?g|webp|svg)$/i) || [, 'png'])[1].toLowerCase();
      const logo = `img/${negozio}/logo-${Date.now().toString(36)}.${estensione}`;
      await scriviFile(progetto, `assets/${logo}`, logoFile);
      scheda = campo(campo(scheda, 'logoSplash', logo), 'logoMenu', logo);
      dashboard = dashboard.replace(/(logo:\s*\{\s*src:\s*)'[^']*'/, `$1${virgolette(logo)}`);
    }
    if (nome) {
      scheda = campo(campo(scheda, 'nome', nome), 'sigla', sigla || siglaNegozio(nome));
      dashboard = dashboard.replace(/(logo:\s*\{[^}]*alt:\s*)'(?:[^'\\]|\\.)*'/, `$1${virgolette(nome)}`);
    }
    if (indirizzo !== undefined) scheda = campo(scheda, 'indirizzo', indirizzo);
    if (indirizzoBreve !== undefined || indirizzo !== undefined) scheda = campo(scheda, 'indirizzoBreve', indirizzoBreve || indirizzo || '');
    if (indirizzo !== undefined || descrizione !== undefined) {
      dashboard = dashboard.replace(/identita:\s*\[\s*('(?:[^'\\]|\\.)*')\s*,\s*('(?:[^'\\]|\\.)*')\s*\]/, (t, a, b) =>
        `identita: [${indirizzo !== undefined ? virgolette(indirizzo) : a}, ${descrizione !== undefined ? virgolette(descrizione) : b}]`);
    }
    await scriviFile(progetto, percorso, scheda);
    await scriviFile(progetto, `assets/negozi/${negozio}-dashboard.js`, dashboard);
  }
  // un modulo clone diventa sorgente: la pagina perde il segno del clone e prende quello della pagina sorgente da cui
  // deriva (storecraft-derivata), le sue schede perdono origine; da qui si cancella solo dal codice
  async function rendiSorgenteModulo(progetto, { negozio, nome }) {
    const percorso = `${negozio}/${nome}`;
    const html = await (await leggi(progetto, percorso)).text();
    const origine = clone(html);
    if (!origine) return;
    await scriviFile(progetto, percorso, html.replace(/\n?\s*<meta name="storecraft-(origine|copiati)" content="[^"]*">/g, '')
      .replace(/(<meta charset="[^"]*">)/i, `$1\n  <meta name="storecraft-derivata" content="${origine}">`));
    const dashboard = `assets/negozi/${negozio}-dashboard.js`;
    const testo = await (await leggi(progetto, dashboard)).text();
    const segno = virgolette(origine).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await scriviFile(progetto, dashboard, testo.replace(new RegExp(`,\\s*origine:\\s*${segno}`, 'g'), '').replace(new RegExp(`origine:\\s*${segno},\\s*`, 'g'), ''));
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
  // Il contenuto di un file letto subito, tutto, in memoria. Chrome legge un file in due tempi (getFile, poi il
  // contenuto) e, se nel frattempo il file cambia sul disco (es. OneDrive che sincronizza la cartella mentre la pagina
  // scrive), rifiuta con InvalidStateError: si riprova qualche volta, con una piccola attesa (19 ottobre 2026)
  async function istantanea(maniglia) {
    for (let prova = 1; ; prova++) {
      try {
        const file = await maniglia.getFile();
        return new File([await file.arrayBuffer()], file.name, { type: file.type, lastModified: file.lastModified });
      } catch (errore) {
        if (prova >= 6 || !['InvalidStateError', 'NotReadableError'].includes(errore.name)) throw errore;
        await new Promise(fatto => setTimeout(fatto, 150 * prova));
      }
    }
  }
  async function leggi(progetto, percorso) {
    const parti = percorso.split('/');
    const dir = await cartella(progetto, parti.slice(0, -1).join('/'));
    return istantanea(await dir.getFileHandle(parti.at(-1)));
  }
  async function esiste(progetto, percorso) {
    try {
      const parti = percorso.split('/');
      await (await cartella(progetto, parti.slice(0, -1).join('/'))).getFileHandle(parti.at(-1));
      return true;
    } catch { return false; }
  }
  // ----- Annulla: durante un'operazione (registrando) ogni file scritto o cancellato si ricorda com'era la prima volta
  // (contenuto, o null se non c'era); annulla lo rimette così, dall'ultimo al primo -----
  let registro = null;
  async function ricorda(progetto, percorso) {
    if (!registro || registro.has(percorso)) return;
    registro.set(percorso, null);
    try { registro.set(percorso, await leggi(progetto, percorso)); } catch { /* non c'era */ }
  }
  async function registrando(azione) {
    const mio = new Map();
    const prima = registro;
    registro = mio;
    try { await azione(); } finally { registro = prima; }
    return mio;
  }
  async function annulla(progetto, passi, avviso = () => {}) {
    for (const [percorso, contenuto] of [...passi].reverse()) {
      if (contenuto) { avviso(`rimetto ${percorso}…`); await scriviFile(progetto, percorso, contenuto); }
      else { avviso(`tolgo ${percorso}…`); try { await cancella(progetto, percorso); } catch { /* già tolto */ } }
    }
  }
  async function scriviFile(progetto, percorso, contenuto) {
    await ricorda(progetto, percorso);
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

  // la pagina copiata dal negozio da al negozio a con il logo di partenza del negozio a (vedi sostituisciLoghi)
  async function loghiDelNegozio(progetto, html, da, a, avviso = () => {}) {
    const elenco = async negozio => elencoLoghi(await (await leggi(progetto, `assets/logos/${negozio}/elenco.js`)).text().catch(() => ''));
    let elencoDa, elencoA;
    try { [elencoDa, elencoA] = [await elenco(da), await elenco(a)]; } catch { return html; }   // un negozio senza elenco
    if (!elencoDa.file.some(file => !elencoA.file.includes(file) && tra(file).test(html))) return html;
    const pagine = [];
    for await (const [file, voce] of (await cartella(progetto, a)).entries()) {
      if (voce.kind === 'file' && file.endsWith('.html')) pagine.push(await (await istantanea(voce)).text());
    }
    const predefinito = logoPredefinito(pagine, elencoA);
    const esito = sostituisciLoghi(html, elencoDa, elencoA, predefinito);
    if (esito.sostituiti.length) avviso(`logo di partenza: ${esito.sostituiti.join(', ')} → ${predefinito} (come nelle pagine di ${a})`);
    return esito.html;
  }

  async function associa(progetto, { modulo, tipo, cartella: da, negozio: a, sezione: idSezione = null, nuovaGalleria = '', logo = null, avviso = () => {} }) {
    const dashboard = `assets/negozi/${a}-dashboard.js`;
    let testo = await (await leggi(progetto, dashboard)).text();
    const nome = pagina(modulo.link);
    if (usato(testo, a, da, nome)) return;
    const scheda = { ...modulo };
    // lo stile dorato è del modulo (stile: 'dorata'), non della galleria: la scheda lo porta con sé in qualunque sezione
    // vada (regola del 13 ottobre 2026); la sezione è quella del tipo della galleria
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
      let { html, risorse } = adattaPagina(sorgente, origineRisorse, a, `${da}/${nome}`);
      if (origineRisorse !== a) html = await loghiDelNegozio(progetto, html, origineRisorse, a, avviso);
      // un negozio con il suo logo tra i loghi ufficiali (+ NUOVO NEGOZIO): i marchi del modello scritti nella pagina
      // come scelta di partenza (es. LUXURY_GOLD.png, 269TEBE.PNG) diventano il logo del negozio
      try {
        const suo = ((await (await leggi(progetto, `assets/negozi/${a}.js`)).text()).match(/logoUfficiale:\s*'([^']+)'/) || [])[1];
        if (suo && origineRisorse !== a) for (const marchio of BRAND_DEL_MODELLO[origineRisorse] || []) {
          if (tra(marchio).test(html)) { html = html.replace(tra(marchio), (t, v) => `${v}${suo}${v}`); avviso(`logo di partenza: ${marchio} → ${suo}`); }
        }
      } catch { /* negozio senza scheda leggibile */ }
      const copiati = origineRisorse === a ? [] : await copiaRisorse(progetto, risorse, origineRisorse, a);   // il clone li elenca
      // modulo import (dal file Photoshop): le sue grafiche stanno accanto alla pagina, in <cartella>/<pagina>-grafiche/;
      // nel negozio vanno in assets/img/<negozio>/import/<pagina>/, elencate tra i file copiati per il clone
      if (/<meta name="storecraft-import"/.test(html)) {
        const grafiche = new Set([...html.matchAll(/(["'])([\w-]+-grafiche)\/([\w.-]+)\1/g)].map(m => `${m[2]}/${m[3]}`));
        for (const voce of grafiche) {
          const [cartellaGrafiche, file] = voce.split('/');
          const base = cartellaGrafiche.replace(/-grafiche$/, '');
          const destinazione = `assets/img/${a}/import/${base}/${file}`;
          try {
            await scriviFile(progetto, destinazione, await leggi(progetto, `${da}/${voce}`));
            if (!copiati.includes(`img/import/${base}/${file}`)) copiati.push(`img/import/${base}/${file}`);
            avviso(`grafica ${file} in assets/img/${a}/import/${base}/…`);
          } catch { avviso(`grafica ${da}/${voce} non trovata`); continue; }
          html = html.split(voce).join(`../${destinazione}`);
        }
        // il logo del .psd come logo ufficiale del negozio: nel menu BRAND e logo di partenza dei due cartelli
        const logoPsd = [...grafiche].find(voce => voce.endsWith('/logo-brand.png'));
        if (logo && logo.modo === 'ufficiale' && logoPsd) {
          const fileUfficiale = await logoUfficiale(progetto, { negozio: a, nome: logo.nome, immagine: await leggi(progetto, `${da}/${logoPsd}`), prioritario: !!logo.prioritario, avviso });
          html = html.replace(/stato:\s*\{\s*brand:\s*''/, `stato: { brand: ${virgolette(fileUfficiale)}`);
        }
      }
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
    if (nuovaGalleria) {
      avviso(`creo la galleria «${nuovaGalleria}» nella dashboard di ${a}…`);
      ({ testo, id: idSezione } = nuovaSezione(testo, tipo === 'promo' ? 'promo' : tipo, nuovaGalleria));
    }
    avviso(`aggiungo la scheda alla dashboard di ${a}…`);
    testo = aggiungiScheda(testo, tipo, scheda, idSezione);
    await scriviFile(progetto, dashboard, testo);
  }

  // ----- Finestra della scelta: galleria del negozio e, per un modulo import, il logo del .psd -----
  const STILE_FINESTRA = `
    .as-velo { position: fixed; inset: 0; z-index: 9999; background: rgba(8, 7, 6, .72); display: flex; align-items: center; justify-content: center; padding: 16px; }
    .as-finestra { width: min(560px, 100%); max-height: calc(100vh - 32px); overflow: auto; background: #121110; color: #d8d3ca; border: 1px solid #8f6a1f;
      box-shadow: 0 0 0 4px #121110, 0 0 0 5px rgba(143, 106, 31, .45); padding: 22px 24px; font: 13px/1.5 'IBM Plex Mono', ui-monospace, Consolas, monospace; }
    .as-finestra h3 { margin: 0 0 4px; font: 500 15px 'Cinzel', serif; letter-spacing: .2em; text-transform: uppercase; color: #d4a373; }
    .as-finestra .as-nota { margin: 0 0 14px; color: #8f877c; font-size: 12px; }
    .as-finestra fieldset { border: 0; border-top: 1px solid rgba(212, 163, 115, .25); margin: 0; padding: 12px 0 6px; }
    .as-finestra legend { padding: 0 8px 0 0; color: #d4a373; text-transform: lowercase; letter-spacing: .08em; }
    .as-finestra label { display: flex; gap: 8px; align-items: center; margin: 6px 0; cursor: pointer; }
    .as-finestra select, .as-finestra input[type="text"] { width: 100%; box-sizing: border-box; background: #0a0908; color: #e8e2d6; border: 1px solid #5c4a2c;
      padding: 7px 9px; font: inherit; }
    .as-finestra input[type="radio"], .as-finestra input[type="checkbox"] { accent-color: #d4a373; }
    .as-finestra .as-sotto { margin: 4px 0 8px 24px; }
    .as-finestra .as-sotto[hidden] { display: none; }
    .as-finestra .as-logo { display: flex; align-items: center; justify-content: center; height: 70px; margin: 4px 0 10px; background: #2a2622;
      background-image: linear-gradient(45deg, #1d1b18 25%, transparent 25%, transparent 75%, #1d1b18 75%), linear-gradient(45deg, #1d1b18 25%, transparent 25%, transparent 75%, #1d1b18 75%);
      background-size: 14px 14px; background-position: 0 0, 7px 7px; }
    .as-finestra .as-logo img { max-height: 60px; max-width: 90%; }
    .as-finestra .as-piccola { color: #8f877c; font-size: 11.5px; margin: 2px 0 0; }
    .as-finestra .as-comandi { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
    .as-finestra button { font: inherit; text-transform: lowercase; letter-spacing: .06em; padding: 8px 16px; cursor: pointer; border: 1px solid #d4a373; }
    .as-finestra .as-annulla { background: transparent; color: #d4a373; }
    .as-finestra .as-ok { background: #d4a373; color: #121110; }
    .as-finestra .as-ok:disabled { opacity: .45; cursor: default; }
    .as-finestra button:focus-visible, .as-finestra input:focus-visible, .as-finestra select:focus-visible { outline: 2px solid #e5ba73; outline-offset: 2px; }`;
  async function chiediAssociazione({ progetto, modulo, tipo, cartella: da, negozio, nomeNegozio = negozio, sezione: giaScelta = null }) {
    const testo = await (await leggi(progetto, `assets/negozi/${negozio}-dashboard.js`)).text();
    const elenco = gallerie(testo, tipo);
    // modulo import con il logo del .psd: la sua grafica, per l'anteprima
    let logoUrl = null;
    try {
      const html = await (await leggi(progetto, `${da}/${pagina(modulo.link)}`)).text();
      const voce = /<meta name="storecraft-import"/.test(html) && (html.match(/["']([\w-]+-grafiche\/logo-brand\.png)["']/) || [])[1];
      if (voce) logoUrl = URL.createObjectURL(await leggi(progetto, `${da}/${voce}`));
    } catch { /* pagina non leggibile: niente scelta del logo */ }
    if (!document.getElementById('associa-stile')) {
      const stile = document.createElement('style');
      stile.id = 'associa-stile';
      stile.textContent = STILE_FINESTRA;
      document.head.append(stile);
    }
    const crea = (tag, attributi = {}, ...figli) => {
      const nodo = document.createElement(tag);
      Object.entries(attributi).forEach(([k, v]) => { if (k === 'testo') nodo.textContent = v; else if (v !== false && v != null) nodo.setAttribute(k, v === true ? '' : v); });
      nodo.append(...figli);
      return nodo;
    };
    const sigla = voce => `${voce.titolo || voce.id}${voce.tipo === 'promo' ? ' · promo stagionali' : ''} · ${voce.schede} ${voce.schede === 1 ? 'modulo' : 'moduli'}`;
    const scelta = crea('select', { id: 'as-galleria' });
    elenco.forEach(voce => scelta.append(crea('option', { value: voce.id, testo: sigla(voce) })));
    scelta.append(crea('option', { value: '', testo: '+ nuova galleria' }));
    if (giaScelta && elenco.some(v => v.id === giaScelta)) scelta.value = giaScelta;   // la galleria da cui si aggiunge
    const titoloNuova = crea('input', { type: 'text', maxlength: '40', placeholder: 'titolo della galleria, es. Promo Import', 'aria-label': 'Titolo della nuova galleria' });
    const rigaNuova = crea('div', { class: 'as-sotto', hidden: elenco.length > 0 }, titoloNuova);
    const finestra = crea('div', { class: 'as-finestra', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'as-titolo' },
      crea('h3', { id: 'as-titolo', testo: `aggiungi a ${nomeNegozio}` }),
      crea('p', { class: 'as-nota', testo: `// ${modulo.titolo}: scegli in quale galleria della dashboard di ${nomeNegozio} va il widget` }),
      crea('fieldset', {}, crea('legend', { testo: 'galleria' }), scelta, rigaNuova));
    let nomeLogo, prioritario, modoLogo = () => null;
    if (logoUrl) {
      const radio = (valore, testoVoce, scelto) => crea('label', {}, crea('input', { type: 'radio', name: 'as-logo', value: valore, checked: scelto }), crea('span', { testo: testoVoce }));
      nomeLogo = crea('input', { type: 'text', maxlength: '30', value: String(modulo.titolo || '').replace(/\s+outlet$/i, '').toUpperCase(), 'aria-label': 'Nome del logo nel menu BRAND' });
      prioritario = crea('input', { type: 'checkbox' });
      const sotto = crea('div', { class: 'as-sotto', hidden: true },
        crea('label', {}, crea('span', { testo: 'nome nel menu brand' })), nomeLogo,
        crea('p', { class: 'as-piccola', testo: `// file ${fileLogo(nomeLogo.value)} in assets/logos/${negozio}/, con le varianti bianco, nero, rosso e oro` }),
        crea('label', {}, prioritario, crea('span', { testo: 'in evidenza: tra i brand prioritari, in cima al menu' })));
      const notaFile = sotto.querySelector('.as-piccola');
      nomeLogo.addEventListener('input', () => { notaFile.textContent = `// file ${fileLogo(nomeLogo.value)} in assets/logos/${negozio}/, con le varianti bianco, nero, rosso e oro`; });
      const campo = crea('fieldset', {}, crea('legend', { testo: 'logo del .psd' }),
        crea('div', { class: 'as-logo' }, crea('img', { src: logoUrl, alt: 'Logo del file Photoshop' })),
        radio('grafica', 'elemento grafico: resta il logo di partenza dei cartelli, il menu brand lo cambia', true),
        radio('ufficiale', 'logo ufficiale: entra nel menu brand del negozio ed è il logo di partenza', false), sotto);
      campo.addEventListener('change', evento => { if (evento.target.name === 'as-logo') sotto.hidden = evento.target.value !== 'ufficiale'; });
      modoLogo = () => campo.querySelector('input[name="as-logo"]:checked').value;
      finestra.append(campo);
    }
    const annulla = crea('button', { type: 'button', class: 'as-annulla', testo: 'annulla' });
    const ok = crea('button', { type: 'button', class: 'as-ok', testo: 'aggiungi' });
    finestra.append(crea('div', { class: 'as-comandi' }, annulla, ok));
    const velo = crea('div', { class: 'as-velo' }, finestra);
    const controlla = () => {
      ok.disabled = (scelta.value === '' && !titoloNuova.value.trim()) || (modoLogo() === 'ufficiale' && !nomeLogo.value.trim());
    };
    scelta.addEventListener('change', () => { rigaNuova.hidden = scelta.value !== ''; if (!rigaNuova.hidden) titoloNuova.focus(); controlla(); });
    finestra.addEventListener('input', controlla);
    finestra.addEventListener('change', controlla);
    document.body.append(velo);
    // dentro un riquadro alto quanto il suo contenuto (la pagina operatore) la finestra va nella parte che si vede
    try {
      const riquadro = window.frameElement && window.frameElement.getBoundingClientRect();
      if (riquadro) {
        const alto = Math.max(0, -riquadro.top), visibile = Math.min(window.innerHeight, window.parent.innerHeight);
        velo.style.alignItems = 'flex-start';
        finestra.style.marginTop = `${Math.max(16, alto + (visibile - finestra.offsetHeight) / 2)}px`;
        finestra.style.maxHeight = `${visibile - 32}px`;
      }
    } catch { /* riquadro di un altro sito: al centro */ }
    controlla();
    const prima = document.activeElement;
    (elenco.length ? scelta : titoloNuova).focus();
    return new Promise(fatto => {
      const chiudi = valore => {
        velo.remove();
        if (logoUrl) URL.revokeObjectURL(logoUrl);
        prima?.focus?.();
        fatto(valore);
      };
      annulla.addEventListener('click', () => chiudi(null));
      velo.addEventListener('click', evento => { if (evento.target === velo) chiudi(null); });
      velo.addEventListener('keydown', evento => { if (evento.key === 'Escape') { evento.stopPropagation(); chiudi(null); } });
      ok.addEventListener('click', () => {
        if (ok.disabled) return;
        const modo = modoLogo();
        chiudi({
          sezione: scelta.value || null,
          nuovaGalleria: scelta.value ? '' : titoloNuova.value.trim(),
          logo: modo ? { modo, nome: modo === 'ufficiale' ? nomeLogo.value.trim() : '', prioritario: modo === 'ufficiale' && prioritario.checked } : null
        });
      });
    });
  }

  async function cancella(progetto, percorso) {
    await ricorda(progetto, percorso);
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
    // (tutte quelle che lo aprono: un clone di etichette ne ha una per layout), e la sua voce nell'ordine dei widget
    if (schedeDellaPagina(testo, nome).length) {
      avviso(`tolgo la scheda dalla dashboard di ${negozio}…`);
      // le gallerie (sezioni) che avevano il clone: rimaste senza schede, si tolgono anche loro (regola del 19 ottobre 2026)
      const sue = sezioni(testo).filter(voce => schede(testo, voce).some(sk => pagina((sk.testo.match(/link:\s*'([^']+)'/) || [])[1]) === nome)).map(voce => voce.id).filter(Boolean);
      let scheda;
      while ((scheda = schedeDellaPagina(testo, nome)[0])) testo = togliOggetto(testo, scheda);
      testo = togliDaOrdini(testo, nome);
      for (const id of sue) {
        const voce = sezioni(testo).find(v => v.id === id);
        if (!voce || voce.oggetto < 0 || schede(testo, voce).length) continue;
        avviso(`la galleria «${voce.titolo || id}» di ${negozio} è rimasta vuota: la tolgo…`);
        testo = togliOggetto(testo, { inizio: voce.oggetto, fine: chiusura(testo, voce.oggetto) });
      }
      await scriviFile(progetto, dashboard, testo);
    }
    avviso(`cancello ${negozio}/${nome}…`);
    await cancella(progetto, `${negozio}/${nome}`);
    // file copiati per il clone (elencati da lui): quelli che ora nessuno usa più. Un clone senza elenco non ne cancella
    const copiati = ((html.match(/<meta name="storecraft-copiati" content="([^"]*)">/) || [])[1] || '').split(',').filter(Boolean);
    const usate = [testo];
    for await (const [file, voce] of (await cartella(progetto, negozio)).entries()) {
      if (voce.kind === 'file' && file.endsWith('.html')) usate.push(await (await istantanea(voce)).text());
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

  // Modulo import (Import layout): la pagina generata dal file Photoshop nella cartella dei moduli in lavorazione, con le
  // sue grafiche accanto (moduli/<nome>-grafiche/<chiave>.png), la miniatura e il modulo nella galleria scelta o in una
  // nuova. Come gli altri nuovi moduli non entra in nessuna dashboard.
  async function salvaImport(progetto, { nome, html, grafiche = {}, font = {}, miniatura = null, scheda = {}, tipo = 'cartelli', galleria = null, titoloGalleria = 'Nuova Galleria', avviso = () => {} }) {
    await preparaModuli(progetto);
    // font importati nell'editor: in assets/fonts/, se non ci sono già
    for (const [file, dati] of Object.entries(font)) {
      if (await esiste(progetto, `assets/fonts/${file}`)) continue;
      avviso(`salvo il font assets/fonts/${file}…`);
      await scriviFile(progetto, `assets/fonts/${file}`, dati);
    }
    let base = nomeFile(nome), libero = `${base}.html`;
    for (let n = 2; await esiste(progetto, `${MODULI}/${libero}`); n++) libero = `${base}-${n}.html`;
    base = libero.replace(/\.html$/, '');
    const percorsi = {};
    for (const [chiave, dati] of Object.entries(grafiche)) {
      const file = `${base}-grafiche/${nomeFile(chiave)}.png`;
      avviso(`salvo la grafica ${MODULI}/${file}…`);
      await scriviFile(progetto, `${MODULI}/${file}`, dati);
      percorsi[chiave] = file;
    }
    avviso(`salvo la pagina ${MODULI}/${libero}…`);
    await scriviFile(progetto, `${MODULI}/${libero}`, typeof html === 'function' ? html(percorsi) : html);
    if (miniatura) {
      avviso(`salvo la miniatura ${MODULI}/miniature/${base}.jpg…`);
      await scriviFile(progetto, `${MODULI}/miniature/${base}.jpg`, miniatura);
    }
    const modulo = { ...scheda, titolo: nome, link: libero, miniature: miniatura ? [`../${MODULI}/miniature/${base}.jpg`] : undefined };
    modulo.cartella = MODULI;
    return scriviNellaGalleria(progetto, { modulo, tipo, galleria, pagina: `${MODULI}/${libero}`, avviso, titolo: titoloGalleria });
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
      // in testa all'elenco: la galleria nuova è la prima del suo gruppo in Gestione pacchetti (una voce rimasta con lo stesso
      // nome, di una galleria cancellata a mano, si toglie: non si ripete)
      const pulito = togliDaElenco(testo, galleria);
      const inizio = pulito.indexOf('installa([') + 'installa(['.length;
      await scriviFile(progetto, elenco, `${pulito.slice(0, inizio)}'${galleria}', ${pulito.slice(inizio)}`);
    }
    return { galleria, pagina: percorso };
  }

  // ----- Eliminare un nuovo modulo (Gestione pacchetti, scheda del modulo) -----
  // Si eliminano solo i moduli creati da Nuovo modulo: quelli di una galleria creata qui (galleria-<n>), quelli aggiunti a
  // un set di partenza (aggiunti) e gli strumenti di cassa clonati. Il modulo esce dalla sua galleria; la sua pagina in
  // moduli/ e la miniatura provvisoria si cancellano se nessun altro modulo le usa (un set di etichette clonato ha una
  // pagina per tutti i suoi layout). Una galleria creata qui rimasta senza moduli si cancella e esce da elenco.js; un set
  // di partenza rimasto senza aggiunti perde l'elenco aggiunti. Un modulo ancora in una dashboard non si elimina: prima
  // si tolgono le spunte dei negozi (le dashboard cambiano solo con le spunte).

  // il modulo nel testo della galleria: { testo, rimasti } (rimasti: i moduli che restano nel suo elenco)
  function togliModulo(testo, modulo) {
    const chiave = modulo.aggiunto ? 'aggiunti: [' : 'moduli: [';
    const posizione = testo.indexOf(chiave);
    if (posizione < 0) throw new Error(`nella galleria non c'è l'elenco ${chiave.slice(0, -3)}`);
    const elenco = { inizio: posizione + chiave.length - 1 };
    elenco.fine = chiusura(testo, elenco.inizio);
    const voci = schede(testo, elenco);
    const segni = [`titolo: ${virgolette(modulo.titolo)}`, modulo.link ? `link: ${virgolette(modulo.link)}` : `strumento: ${virgolette(modulo.strumento)}`];
    const trovata = voci.find(voce => segni.every(segno => voce.testo.includes(segno)));
    if (!trovata) throw new Error(`il modulo ${modulo.titolo} non è nel file della galleria`);
    let nuovo = togliOggetto(testo, trovata);
    // un elenco rimasto vuoto si chiude su una riga
    if (voci.length === 1) {
      const aperta = nuovo.indexOf(chiave) + chiave.length - 1;
      nuovo = nuovo.slice(0, aperta + 1) + '\n  ' + nuovo.slice(chiusura(nuovo, aperta));
    }
    return { testo: nuovo, rimasti: voci.length - 1 };
  }
  // un set di partenza senza più aggiunti: via l'elenco e il suo commento
  const senzaAggiunti = testo => testo.replace(/,\s*(\/\/[^\n]*\n\s*)?aggiunti:\s*\[\s*\]/, '');
  // la galleria fuori da elenco.js
  const togliDaElenco = (testo, id) => testo.replace(new RegExp(`,\\s*'${id}'|'${id}',\\s*`), '');

  async function eliminaModulo(progetto, { galleria, modulo, negozi = [], avviso = () => {} }) {
    const nome = modulo.link ? pagina(modulo.link) : null;
    // ancora in una dashboard: prima le spunte
    if (nome && modulo.cartella) {
      const dove = [];
      for (const negozio of negozi) {
        const testo = await (await leggi(progetto, `assets/negozi/${negozio}-dashboard.js`)).text();
        if (usato(testo, negozio, modulo.cartella, nome)) dove.push(negozio);
      }
      if (dove.length) throw new Error(`il modulo è ancora nella dashboard di ${dove.join(', ')}: togli prima le spunte dei negozi`);
    }
    // fuori dalla galleria
    const file = `assets/pacchetti/${galleria}.js`;
    avviso(`tolgo ${modulo.titolo} dalla galleria ${galleria}…`);
    const { testo, rimasti } = togliModulo(await (await leggi(progetto, file)).text(), modulo);
    const galleriaVuota = rimasti === 0 && /^galleria-\d+$/.test(galleria);
    if (galleriaVuota) {
      avviso(`la galleria ${galleria} è vuota: la cancello…`);
      // prima l'elenco, poi il file: se qualcosa si ferma, l'elenco non resta con una galleria che non c'è più
      const elenco = 'assets/pacchetti/elenco.js';
      await scriviFile(progetto, elenco, togliDaElenco(await (await leggi(progetto, elenco)).text(), galleria));
      await cancella(progetto, file);
    } else await scriviFile(progetto, file, rimasti === 0 && modulo.aggiunto ? senzaAggiunti(testo) : testo);
    // la pagina e la miniatura provvisoria, se nessun'altra galleria le usa
    if (modulo.cartella !== MODULI) return { galleriaCancellata: galleriaVuota };
    const gallerie = [];
    for await (const [voce, maniglia] of (await cartella(progetto, 'assets/pacchetti')).entries()) {
      if (maniglia.kind === 'file' && voce.endsWith('.js')) gallerie.push(await (await istantanea(maniglia)).text());
    }
    const usata = segno => gallerie.some(testoGalleria => testoGalleria.includes(segno));
    if (nome && !usata(`link: '${nome}'`) && !usata(`link: '${nome}?`)) {
      avviso(`cancello ${MODULI}/${nome}…`);
      try { await cancella(progetto, `${MODULI}/${nome}`); } catch { /* già tolta */ }
      // modulo import: le sue grafiche, nella cartella accanto alla pagina
      const grafiche = nome.replace(/\.html$/, '-grafiche');
      try {
        const dir = await cartella(progetto, `${MODULI}/${grafiche}`);
        for await (const [file, voce] of dir.entries()) if (voce.kind === 'file') await ricorda(progetto, `${MODULI}/${grafiche}/${file}`);
        await (await cartella(progetto, MODULI)).removeEntry(grafiche, { recursive: true });
        avviso(`cancello ${MODULI}/${grafiche}/…`);
      } catch { /* non c'è */ }
    }
    for (const miniatura of modulo.miniature || []) {
      const file = (miniatura.split('?')[0].match(/^\.\.\/moduli\/(miniature\/.+)$/) || [])[1];
      if (!file || usata(`${MODULI}/${file}`)) continue;
      avviso(`cancello ${MODULI}/${file}…`);
      try { await cancella(progetto, `${MODULI}/${file}`); } catch { /* già tolta */ }
    }
    return { galleriaCancellata: galleriaVuota };
  }

  // ----- Rinominare una galleria (il titolo sopra il suo carosello in Gestione pacchetti) -----
  // Cambia il titolo nel file della galleria; una galleria creata qui (galleria-<n>) cambia anche il nome, uguale al
  // titolo. Un set di partenza tiene il suo nome (Pacchetto …): cambia solo il titolo del carosello, le dashboard no.
  const STRINGA = "'(?:[^'\\\\]|\\\\.)*'";
  function rinominaGalleria(testo, titolo, conNome = false) {
    const cambia = (chiave, valore) => {
      const riga = new RegExp(`^(\\s*${chiave}:\\s*)${STRINGA}`, 'm');
      if (!riga.test(testo)) throw new Error(`nel file della galleria non c'è ${chiave}`);
      testo = testo.replace(riga, (tutto, prima) => `${prima}${virgolette(valore)}`);
    };
    cambia('titolo', titolo);
    if (conNome) cambia('nome', titolo);
    return testo;
  }
  async function rinomina(progetto, { galleria, titolo, avviso = () => {} }) {
    const file = `assets/pacchetti/${galleria}.js`;
    avviso(`rinomino la galleria ${galleria}…`);
    await scriviFile(progetto, file, rinominaGalleria(await (await leggi(progetto, file)).text(), titolo, /^galleria-\d+$/.test(galleria)));
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

  // ----- Gestione negozi: i moduli di una galleria della dashboard (sezione) uno alla volta -----
  // Ogni scheda si riconosce dalla sua chiave: il collegamento (link, con l'eventuale ?label=…), il PDF o il titolo.
  // Ordine dei widget: ordine: [chiavi] nella sezione (dashboard.js mette le schede in quell'ordine, quelle non elencate
  // in fondo); senza ordine vale quello di partenza, cioè la sequenza delle schede nel file (per i negozi modello
  // l'ordine originale, per gli altri quello in cui i moduli sono stati aggiunti).
  const STRINGA_JS = `'(?:[^'\\\\]|\\\\.)*'|"(?:[^"\\\\]|\\\\.)*"`;
  const valoreStringa = scritta => scritta.slice(1, -1).replace(/\\(.)/g, '$1');
  function campo(testoScheda, nome) {
    const trovato = testoScheda.match(new RegExp(`(?:^|[\\s{,])${nome}:\\s*(${STRINGA_JS})`));
    return trovato ? valoreStringa(trovato[1]) : null;
  }
  const chiaveScheda = testoScheda => campo(testoScheda, 'link') || campo(testoScheda, 'pdf') || campo(testoScheda, 'titolo');
  // la sezione con quell'id: { inizio, fine } dell'oggetto { … } e l'elenco delle sue schede
  function sezioneConId(testo, id) {
    const posizione = testo.search(new RegExp(`\\bid:\\s*'${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`));
    if (posizione < 0) throw new Error(`nella dashboard non c'è la galleria ${id}`);
    const inizio = testo.lastIndexOf('{', posizione);
    const fine = chiusura(testo, inizio);
    const aperta = testo.indexOf('schede: [', inizio) + 'schede: '.length;
    if (aperta < 'schede: '.length || aperta > fine) throw new Error(`la galleria ${id} non ha schede`);
    return { inizio, fine, elenco: { inizio: aperta, fine: chiusura(testo, aperta) } };
  }
  function schedaConChiave(testo, id, chiave) {
    const trovata = schede(testo, sezioneConId(testo, id).elenco).find(scheda => chiaveScheda(scheda.testo) === chiave);
    if (!trovata) throw new Error(`il modulo ${chiave} non è nella galleria ${id}`);
    return trovata;
  }
  // ordine scritto nella sezione (null: quello di partenza)
  const RIGA_ORDINE = /\n[ \t]*ordine:\s*\[[^\]]*\],?[^\n]*/;
  function ordine(testo, id) {
    const { inizio, fine } = sezioneConId(testo, id);
    const riga = testo.slice(inizio, fine).match(/\n[ \t]*ordine:\s*\[([^\]]*)\]/);
    return riga ? [...riga[1].matchAll(new RegExp(STRINGA_JS, 'g'))].map(m => valoreStringa(m[0])) : null;
  }
  // nuovo testo con l'ordine dei widget della sezione (chiavi; null o l'ordine di partenza: si toglie)
  function impostaOrdine(testo, id, chiavi) {
    const { inizio, fine, elenco } = sezioneConId(testo, id);
    const partenza = schede(testo, elenco).map(scheda => chiaveScheda(scheda.testo));
    let corpo = testo.slice(inizio, fine + 1).replace(RIGA_ORDINE, '');
    if (chiavi && chiavi.join('\n') !== partenza.join('\n')) {
      const posto = corpo.indexOf('schede: [');
      const riga = corpo.lastIndexOf('\n', posto) + 1;
      const rientro = corpo.slice(riga, posto);
      corpo = `${corpo.slice(0, riga)}${rientro}ordine: [${chiavi.map(virgolette).join(', ')}],   // ordine dei widget scelto in Gestione negozi (senza: quello di partenza)\n${corpo.slice(riga)}`;
    }
    return testo.slice(0, inizio) + corpo + testo.slice(fine + 1);
  }
  // toglie dagli ordini le voci di una pagina (cancellata)
  function togliDaOrdini(testo, nome) {
    return testo.replace(/^([ \t]*ordine:\s*\[)([^\]]*)(\])/gm, (tutto, prima, lista, dopo) => prima
      + [...lista.matchAll(new RegExp(STRINGA_JS, 'g'))].map(m => m[0]).filter(voce => pagina(valoreStringa(voce)) !== nome).join(', ') + dopo);
  }
  // ghost di un solo modulo (non di tutte le schede della pagina, come Controllo codice)
  function fantasmaScheda(testo, id, chiave) {
    return /nascosta:\s*true/.test(schedaConChiave(testo, id, chiave).testo);
  }
  function impostaFantasmaScheda(testo, id, chiave, nascosta) {
    const scheda = schedaConChiave(testo, id, chiave);
    const senza = scheda.testo.replace(/,\s*nascosta:\s*true/, '');
    const nuova = nascosta ? senza.replace(/\s*\}$/, ', nascosta: true }') : senza;
    return testo.slice(0, scheda.inizio) + nuova + testo.slice(scheda.fine + 1);
  }
  // Duplica un modulo nello stesso negozio e nella stessa galleria: la pagina si copia nella cartella del negozio
  // (<pagina>-copia.html, un clone con storecraft-origine: si può cancellare) e la scheda entra subito dopo l'originale,
  // con il titolo «… (copia)», non in ghost; se la galleria ha un ordine, la copia ci entra dopo l'originale.
  // { testo, scheda } sul testo; duplica() scrive i file
  function schedaDuplicata(testo, id, chiave, link, origine) {
    const scheda = schedaConChiave(testo, id, chiave);
    const titolo = campo(scheda.testo, 'titolo') || 'Modulo';
    let nuova = scheda.testo.replace(/,\s*nascosta:\s*true/, '').replace(/,\s*origine:\s*'(?:[^'\\]|\\.)*'/, '')
      .replace(new RegExp(`(link:\\s*)(${STRINGA_JS})`), (tutto, prima) => `${prima}${virgolette(link)}`)
      .replace(new RegExp(`(titolo:\\s*)(${STRINGA_JS})`), (tutto, prima) => `${prima}${virgolette(`${titolo} (copia)`)}`)
      .replace(/\s*\}$/, `, origine: ${virgolette(origine)} }`);
    const rientro = testo.slice(testo.lastIndexOf('\n', scheda.inizio) + 1, scheda.inizio);
    let nuovo = `${testo.slice(0, scheda.fine + 1)},\n${rientro}${nuova}${testo.slice(scheda.fine + 1)}`;
    const voci = ordine(nuovo, id);
    if (voci) {
      const dopo = voci.indexOf(chiave);
      voci.splice(dopo < 0 ? voci.length : dopo + 1, 0, link);
      nuovo = impostaOrdine(nuovo, id, voci);
    }
    return nuovo;
  }
  async function duplica(progetto, { negozio, sezione, chiave, avviso = () => {} }) {
    const dashboard = `assets/negozi/${negozio}-dashboard.js`;
    const testo = await (await leggi(progetto, dashboard)).text();
    const link = campo(schedaConChiave(testo, sezione, chiave).testo, 'link');
    if (!link) throw new Error('si duplicano solo i moduli con una pagina (non i PDF né quelli in arrivo)');
    const nome = pagina(link);
    let libero = nome.replace(/\.html$/, '-copia.html');
    for (let n = 2; await esiste(progetto, `${negozio}/${libero}`); n++) libero = nome.replace(/\.html$/, `-copia-${n}.html`);
    avviso(`copio ${negozio}/${nome} in ${negozio}/${libero}…`);
    const sorgente = await (await leggi(progetto, `${negozio}/${nome}`)).text();
    // stesso negozio: niente risorse da copiare (l'elenco dei file copiati è vuoto)
    const { html } = adattaPagina(sorgente, negozio, negozio, `${negozio}/${nome}`);
    await scriviFile(progetto, `${negozio}/${libero}`, html
      .replace(/<title>([^<]*)<\/title>/i, (tutto, titolo) => `<title>${titolo} (copia)</title>`)
      .replace(/(<meta name="storecraft-origine" content="[^"]*">)/, '$1\n  <meta name="storecraft-copiati" content="">'));
    const nuovoLink = libero + (link.includes('?') ? `?${link.split('?')[1]}` : '');
    avviso(`aggiungo la copia alla galleria ${sezione} di ${negozio}…`);
    await scriviFile(progetto, dashboard, schedaDuplicata(testo, sezione, chiave, nuovoLink, `${negozio}/${nome}`));
    return { pagina: `${negozio}/${libero}`, chiave: nuovoLink };
  }

  // ----- Modifica di un clone (Gestione negozi, scheda del modulo). Regola del 12 ottobre 2026: i moduli sorgente
  // (pagine scritte a codice, di Luxury Outlet e TEBE o derivate da loro) non si modificano né si cancellano dalle
  // utilità; i cloni (pagine con storecraft-origine) permettono tutto. Si cambiano i campi della scheda nella dashboard:
  // titolo, specifiche, miniatura, tipo (la scritta in alto a destra) e badge (MENU SPECIALE) -----
  // un campo della scheda: scritto, cambiato o (vuoto) tolto
  function impostaCampo(testoScheda, nome, valore) {
    const vecchio = new RegExp(`(\\s*,)?(\\s*)\\b${nome}:\\s*(?:${STRINGA_JS}|\\[[^\\]]*\\]|true|false)`);
    const vuoto = valore === null || valore === undefined || valore === '' || (Array.isArray(valore) && !valore.length);
    const scritto = Array.isArray(valore) ? `[${valore.map(virgolette).join(', ')}]` : virgolette(valore);
    if (vecchio.test(testoScheda)) return testoScheda.replace(vecchio, (tutto, virgola = '', spazio) => (vuoto ? '' : `${virgola}${spazio}${nome}: ${scritto}`));
    return vuoto ? testoScheda : testoScheda.replace(/\s*\}$/, `, ${nome}: ${scritto} }`);
  }
  // nuovo testo della dashboard con i campi cambiati nella scheda del modulo (campi: { titolo, specifiche, tipo,
  // badge, miniature }; null o vuoto toglie il campo, tranne il titolo, che resta)
  function modificaScheda(testo, id, chiave, campi) {
    const scheda = schedaConChiave(testo, id, chiave);
    let nuova = scheda.testo;
    for (const [nome, valore] of Object.entries(campi)) {
      if (nome === 'titolo' && !String(valore || '').trim()) continue;
      nuova = impostaCampo(nuova, nome, valore);
    }
    return testo.slice(0, scheda.inizio) + nuova + testo.slice(scheda.fine + 1);
  }
  // Sposta la scheda di un modulo in un'altra galleria del negozio (in fondo): esce dalla galleria di partenza e dal suo
  // ordine, ed entra in fondo a quella d'arrivo (e al suo ordine, se ne ha uno). Vale per sorgente e cloni: cambia solo
  // la dashboard, non la pagina
  function spostaScheda(testo, da, chiave, a) {
    const scheda = schedaConChiave(testo, da, chiave);
    let nuovo = togliOggetto(testo, scheda);
    const vociDa = ordine(nuovo, da);
    if (vociDa) nuovo = impostaOrdine(nuovo, da, vociDa.filter(voce => voce !== chiave));
    const { elenco } = sezioneConId(nuovo, a);
    const esistenti = schede(nuovo, elenco);
    if (esistenti.length) {
      const ultima = esistenti[esistenti.length - 1];
      const rientro = nuovo.slice(nuovo.lastIndexOf('\n', ultima.inizio) + 1, ultima.inizio);
      nuovo = `${nuovo.slice(0, ultima.fine + 1)},\n${rientro}${scheda.testo}${nuovo.slice(ultima.fine + 1)}`;
    } else {
      const riga = nuovo.lastIndexOf('\n', elenco.fine);
      nuovo = `${nuovo.slice(0, elenco.inizio + 1)}\n        ${scheda.testo}\n${nuovo.slice(riga + 1, elenco.fine)}${nuovo.slice(elenco.fine)}`;
    }
    const vociA = ordine(nuovo, a);
    if (vociA) nuovo = impostaOrdine(nuovo, a, [...vociA, chiave]);
    return nuovo;
  }
  // Salva un'immagine (un File) tra le miniature del negozio: assets/thumbnail/<negozio>/<nome>-<marca>.<estensione>;
  // restituisce il percorso per la scheda (thumbnail/<negozio>/…). Campo miniature della scheda del modulo in Gestione
  // negozi, per sorgente e cloni (la pagina non cambia)
  async function scriviMiniatura(progetto, negozio, nome, file) {
    const estensione = (file.name.match(/\.(png|jpe?g|webp)$/i) || [, 'png'])[1].toLowerCase();
    const nuovo = `${nomeFile(nome)}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}.${estensione}`;
    await scriviFile(progetto, `assets/thumbnail/${negozio}/${nuovo}`, file);
    return `thumbnail/${negozio}/${nuovo}`;
  }
  // scrive la modifica: solo per i cloni; con un file la miniatura nuova va in assets/thumbnail/<negozio>/
  async function modifica(progetto, { negozio, sezione, chiave, campi, miniatura = null, avviso = () => {} }) {
    const dashboard = `assets/negozi/${negozio}-dashboard.js`;
    const testo = await (await leggi(progetto, dashboard)).text();
    const link = campo(schedaConChiave(testo, sezione, chiave).testo, 'link');
    const html = link ? await (await leggi(progetto, `${negozio}/${pagina(link)}`)).text() : '';
    if (!clone(html)) throw new Error('è un modulo sorgente: si modifica solo dal codice');
    const nuovi = { ...campi };
    if (miniatura) {
      const estensione = (miniatura.name.match(/\.(png|jpe?g|webp)$/i) || [, 'png'])[1].toLowerCase();
      const file = `${nomeFile(pagina(link).replace(/\.html$/, ''))}-${Date.now().toString(36)}.${estensione}`;
      avviso(`salvo la miniatura assets/thumbnail/${negozio}/${file}…`);
      await scriviFile(progetto, `assets/thumbnail/${negozio}/${file}`, miniatura);
      nuovi.miniature = [`thumbnail/${negozio}/${file}`];
    }
    avviso(`scrivo la scheda nella dashboard di ${negozio}…`);
    await scriviFile(progetto, dashboard, modificaScheda(testo, sezione, chiave, nuovi));
  }
  // Pagina sorgente derivata da un'altra (es. le pagine di OPHILYA, scritte a codice partendo da TEBE): non è un clone e
  // non si cancella; <meta name="storecraft-derivata" content="tebe/albero.html"> dice da quale pagina viene
  const derivata = html => (String(html).match(/<meta name="storecraft-derivata" content="([^"]+)">/) || [])[1] || null;
  // true se togliendo questo clone sparisce dal catalogo: nessun'altra dashboard ha un clone con la stessa origine (la
  // scheda di ogni clone porta origine: '<cartella>/<pagina>') e non viene da un modulo nuovo di moduli/, che resta nella
  // sua galleria. Allora si chiede conferma due volte. testi: i testi delle dashboard di tutti i negozi installati
  function ultimoClone(testi, origine) {
    if (!origine || origine.startsWith('moduli/')) return false;
    // si contano le schede (anche due copie nello stesso negozio)
    const segno = `origine: ${virgolette(origine)}`;
    return testi.reduce((totale, testo) => totale + String(testo).split(segno).length - 1, 0) <= 1;
  }

  const Associa = Object.freeze({ siglaNegozio, idNegozio, testoSchedaNegozio, testoDashboardNegozio, creaNegozio, modificaNegozio, eliminaNegozio, rendiSorgenteNegozio, rendiSorgenteModulo, eNegozioClone, istantanea, registrando, annulla, chiediAssociazione, gallerie, nuovaSezione, aggiungiAElenco, logoUfficiale, salvaImport, scriviMiniatura, spostaScheda, modificaScheda, modifica, derivata, ultimoClone, chiaveScheda, ordine, impostaOrdine, togliDaOrdini, fantasmaScheda, impostaFantasmaScheda, schedaDuplicata, duplica, rinominaGalleria, rinomina, togliModulo, eliminaModulo, elencoLoghi, logoPredefinito, sostituisciLoghi, fantasma, impostaFantasma, clonaEtichette, layoutEtichette, usato, aggiungiScheda, togliScheda, adattaPagina, clone, scegliProgetto, associa, togli, eliminaClone, creaModulo, nomeFile, pagina });
  if (typeof window !== 'undefined') window.Associa = Associa;
  if (typeof module !== 'undefined') module.exports = Associa;
})();
