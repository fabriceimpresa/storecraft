/* + NUOVO NEGOZIO (Gestione negozi, dal 19 ottobre 2026): aprire un negozio è un percorso a domande dirette, un passo
   alla volta, con a destra l'anteprima dal vivo della sua dashboard (nuovo-negozio-anteprima.html, la dashboard vera
   disegnata da dashboard.js con i colori del modello).
     1 TIPO      outlet (modello Luxury Outlet: tema scuro, STANDARD) o boutique (modello TEBE: tema chiaro, COMPATTO)
     2 NOME      nome, indirizzo, indirizzo breve e descrizione breve (la cartella del negozio si ricava dal nome; la sigla è il
                 nome stesso, accorciato nelle iniziali solo se è lungo, Associa.siglaNegozio)
     3 LOGO      il logo del negozio, caricato, o quello di STORE // CRAFT (si cambia quando si vuole: è un negozio clone)
     4 ASPETTO   tema chiaro o scuro, aspetto STANDARD o COMPATTO (di partenza quelli del modello)
     5 SEZIONI   le gallerie della dashboard, quante e quali (il menu di sinistra si compone da solo)
     6 DETTAGLI  data e ora, radio, meteo, Utilità Cassa, oro del negozio, loghi ufficiali, collegamento del QR
     7 APRI      riepilogo e APRI IL NEGOZIO, che scrive tutto nella cartella del progetto (Associa.creaNegozio)
   Uso: NuovoNegozio.apri({ contenitore, collega, alFatto, alChiudi }); collega() dà la cartella del progetto. */
(() => {
  const MODELLI = {
    outlet: {
      modello: 'luxury', tema: 'dark', aspetto: 'standard', oro: '#b48b37', descrizione: 'OUTLET MULTI BRAND',
      intestazione: { dataOra: true, radio: true, meteo: true },
      sezioni: [['cartelli', 'Crea Cartelli'], ['promo', 'Promo Stagionali'], ['cartellini', 'Crea Cartellini'], ['etichette', 'Etichette Dymo'], ['stampe', 'Stampe Pronte']]
    },
    boutique: {
      modello: 'tebe', tema: 'light', aspetto: 'minimal', oro: '#cc9e25', descrizione: 'MODA DONNA · BRANDS',
      intestazione: { dataOra: true, radio: false, meteo: false },
      sezioni: [['cartelli', 'Crea Cartelli'], ['cartellini', 'Cartellini'], ['etichette', 'Etichette Dymo'], ['stampe', 'Materiali Pronti']]
    }
  };
  const TIPI_SEZIONE = {
    cartelli: { nome: 'Crea Cartelli', nota: 'cartelli A4 e paletti', segno: '▤' },
    promo: { nome: 'Promo Stagionali', nota: 'schede dorate: saldi, Black Friday, Natale', segno: '✦' },
    cartellini: { nome: 'Cartellini', nota: 'fogli di cartellini prezzo', segno: '▦' },
    etichette: { nome: 'Etichette Dymo', nota: 'etichette 57 × 32 mm', segno: '▭' },
    stampe: { nome: 'Stampe Pronte', nota: 'PDF pronti: orari, taglie, avvisi', segno: '⎙' }
  };
  const PASSI = ['tipo', 'nome', 'logo', 'aspetto', 'sezioni', 'dettagli', 'apri'];
  // oro dei loghi in stampa (scheda del negozio, oro): la variante gold dei loghi ufficiali, i loghi personali ricolorati in
  // oro e i loghi oro dei piè di pagina. Non si sceglie (decisione del 19 ottobre 2026): è sempre quello del modello,
  // Luxury #b48b37 per un outlet, TEBE #cc9e25 per una boutique (MODELLI)
  // colore del cursore sul foglio (il triangolo che indica l'elemento del campo in uso): oro come Luxury, rosso come TEBE
  const CURSORI = { oro: '#b48b37', rosso: '#96382b' };

  const el = (tag, classe = '', testo) => { const n = document.createElement(tag); if (classe) n.className = classe; if (testo !== undefined) n.textContent = testo; return n; };
  const tasto = (testo, classe = '') => { const b = el('button', classe, testo); b.type = 'button'; return b; };
  const riduci = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let stato = null, opzioni = null, radice = null, passo = 0, cornice = null, ricarica = 0;
  // le parti fisse della pagina: si ridisegnano dentro, così il riquadro dell'anteprima non si ricarica a ogni scelta
  let parti = null;

  function nuovoStato() {
    return { tipo: null, nome: '', indirizzo: '', indirizzoBreve: '', breveAMano: false, descrizione: '', descrizioneAMano: false,
      logoFile: null, logoTela: null, logoAColori: false, analisi: null, logoNome: '', logoUrl: '', tema: 'dark', aspetto: 'standard', sezioni: [], intestazione: {},
      cassa: 'sempre', oro: '#b48b37', loghi: 'copia', qr: '' };
  }
  function scegliTipo(tipo) {
    const m = MODELLI[tipo];
    stato.tipo = tipo;
    stato.tema = m.tema; stato.aspetto = m.aspetto; stato.oro = m.oro;
    stato.cursore = m.modello === 'tebe' ? 'rosso' : 'oro';
    if (!stato.descrizioneAMano) stato.descrizione = m.descrizione;
    stato.intestazione = { ...m.intestazione };
    stato.sezioni = m.sezioni.map(([tipoSezione, titolo]) => ({ tipo: tipoSezione, titolo }));
  }
  const modello = () => MODELLI[stato.tipo]?.modello || 'luxury';
  const id = () => Associa.idNegozio(stato.nome || 'negozio');
  // indirizzo breve dall'indirizzo: senza VIA, VIALE, PIAZZA… e DEL, DELLA… (VIA DEL CORSO 15 → CORSO 15)
  const breveDa = indirizzo => String(indirizzo).trim().replace(/^(VIA|VIALE|PIAZZA|PIAZZALE|LARGO|CORSO(?=\s+\S+\s+\S))\s+((DEL|DELLA|DELLO|DEI|DEGLI|DELLE|DI|DE)\s+)?/i, '').toUpperCase();
  const nomeModello = () => (modello() === 'tebe' ? 'TEBE' : 'LUXURY OUTLET');
  const esisteGia = () => Negozi.installati.includes(id());
  const logoDi = () => stato.logoUrl || 'img/storecraftlogo.png';
  let telaStoreCraft = null;
  const telaStore = async () => {
    if (telaStoreCraft) return telaStoreCraft;
    const img = await LogoNegozio.caricaImmagine('assets/img/storecraftlogo.png');
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0);
    return (telaStoreCraft = c);
  };

  // il contenuto della dashboard per l'anteprima: le gallerie scelte, ognuna con qualche modulo di prova, così si vedono
  // i caroselli e il menu di sinistra che si compone
  function anteprima() {
    const prova = (sezione, n) => Array.from({ length: sezione.tipo === 'cartelli' ? 4 : 3 }, (_, i) => {
      const scheda = { titolo: `${TIPI_SEZIONE[sezione.tipo].nome.split(' ').pop()} ${i + 1}`, tipo: sezione.tipo === 'etichette' ? '57 X 32 MM' : sezione.tipo === 'stampe' ? 'PDF' : sezione.tipo === 'cartellini' ? 'CARTELLINO' : 'CARTELLO',
        miniature: ['img/storecraftlogo.png'], specifiche: ['Modulo di prova'] };
      if (sezione.tipo === 'stampe') scheda.pdf = `prova-${n}-${i}.pdf`; else scheda.link = `prova-${n}-${i}.html`;
      if (sezione.tipo === 'promo') scheda.stile = 'dorata';
      return scheda;
    });
    return {
      tema: stato.tema, aspetto: stato.aspetto,
      contenuto: {
        // con la radio accesa nei dettagli l'anteprima mostra il pulsantino della radio accanto a data e ora (la radio non parte da sola)
        intestazione: { titolo: false, ...stato.intestazione },
        logo: { src: logoDi(), larghezza: 185, alt: stato.nome || 'NUOVO NEGOZIO', aColori: !!(stato.logoAColori && stato.logoTela) },
        identita: [stato.indirizzo || 'INDIRIZZO DEL NEGOZIO', stato.descrizione || ''],
        qr: stato.qr || 'https://fabriceimpresa.github.io/storecraft/',
        cassa: stato.cassa,
        sezioni: stato.sezioni.map((sezione, n) => ({ id: `prova-${n}-section`, carosello: `prova-${n}-carousel`, titolo: sezione.titolo || TIPI_SEZIONE[sezione.tipo].nome,
          tipo: sezione.tipo, righe: 1, schede: prova(sezione, n) }))
      }
    };
  }
  function aggiornaAnteprima(subito = false) {
    if (!cornice) return;
    const titolo = parti?.anteprima?.querySelector('.nn-anteprima-titolo');
    if (titolo) titolo.textContent = `anteprima dal vivo · dashboard di ${stato.nome || 'nuovo negozio'}`;
    clearTimeout(ricarica);
    ricarica = setTimeout(() => {
      const iframe = cornice.querySelector('iframe');
      const src = `nuovo-negozio-anteprima.html?modello=${modello()}`;
      if (!iframe.getAttribute('src') || !iframe.getAttribute('src').endsWith(modello())) iframe.src = src;
      else iframe.contentWindow?.location.reload();
    }, subito ? 0 : 380);
  }
  function aggiornaAspetto() {
    cornice?.querySelector('iframe')?.contentWindow?.cambiaAspetto?.({ tema: stato.tema, aspetto: stato.aspetto });
    cornice?.classList.toggle('chiara', stato.tema === 'light');
  }
  function adattaAnteprima() {
    if (!cornice || !cornice.clientWidth) return;
    const scala = cornice.clientWidth / 1440;
    const iframe = cornice.querySelector('iframe');
    iframe.style.transform = `scale(${scala})`;
    cornice.style.height = `${Math.round(900 * scala)}px`;
  }

  // ----- passi -----
  function apri(o) {
    opzioni = o;
    stato = nuovoStato();
    passo = 0;
    cornice = null;
    radice = el('div', 'nn');
    radice.setAttribute('role', 'region');
    radice.setAttribute('aria-label', 'Apri un nuovo negozio');
    parti = { testa: el('div', 'nn-testa'), barra: el('div'), corpo: el('div', 'nn-corpo'), domanda: el('div', 'nn-domanda'), anteprima: null, comandi: el('div') };
    parti.corpo.append(parti.domanda);
    radice.append(parti.testa, parti.barra, parti.corpo, parti.comandi);
    o.contenitore.replaceChildren(radice);
    disegna();
  }

  function disegna(verso = 0) {
    const chiudi = tasto(stato.fatto ? '✕ chiudi' : '✕ annulla', 'nn-annulla');
    chiudi.addEventListener('click', esci);
    parti.testa.replaceChildren(el('p', 'nn-sopratitolo', 'apri un nuovo negozio'), chiudi);
    parti.barra.replaceChildren(barraPassi());
    parti.corpo.classList.toggle('senza-anteprima', passo === 0);
    const domanda = parti.domanda;
    domanda.replaceChildren(contenutoPasso());
    if (passo > 0 && !parti.anteprima) { parti.anteprima = pannelloAnteprima(); parti.corpo.append(parti.anteprima); }
    if (parti.anteprima) {
      parti.anteprima.hidden = passo === 0;
      parti.anteprima.classList.toggle('con-scorri', PASSI[passo] === 'sezioni');
      parti.anteprima.querySelector('.nn-anteprima-titolo').textContent = `anteprima dal vivo · dashboard di ${stato.nome || 'nuovo negozio'}`;
      requestAnimationFrame(adattaAnteprima);
    }
    parti.comandi.replaceChildren(...(stato.fatto ? [] : [comandi()]));
    if (verso && !riduci()) domanda.animate([{ opacity: 0, transform: `translateX(${verso * 28}px)` }, { opacity: 1, transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.2, .8, .2, 1)' });
    const primo = domanda.querySelector('input:not([type="hidden"]), [data-primo]');
    primo?.focus({ preventScroll: true });
  }

  function barraPassi() {
    const barra = el('ol', 'nn-passi');
    barra.style.setProperty('--fatto', String(passo / (PASSI.length - 1)));
    PASSI.forEach((nome, i) => {
      const voce = el('li', i < passo ? 'fatto' : i === passo ? 'ora' : '');
      const b = tasto('', 'nn-punto');
      b.append(el('span', 'nn-numero', String(i + 1)), el('span', 'nn-nome', nome));
      b.disabled = i > passo || stato.fatto || (i > 0 && !stato.tipo);
      b.setAttribute('aria-current', i === passo ? 'step' : 'false');
      b.addEventListener('click', () => vai(i));
      voce.append(b);
      barra.append(voce);
    });
    return barra;
  }

  function intestazione(titolo, nota) {
    const f = document.createDocumentFragment();
    f.append(el('p', 'nn-passo-n', `passo ${passo + 1} di ${PASSI.length}`), el('h2', 'nn-titolo', titolo));
    if (nota) f.append(el('p', 'nn-nota', nota));
    return f;
  }

  function contenutoPasso() {
    const f = document.createDocumentFragment();
    const nome = PASSI[passo];
    if (nome === 'tipo') {
      f.append(intestazione('Che negozio apri?', 'il tipo decide da quale negozio sorgente parte: colori, pagine di servizio, tema e aspetto. Dopo puoi cambiare tutto.'));
      const scelte = el('div', 'nn-tipi');
      [['outlet', 'Outlet', 'multibrand, prezzi barrati e percentuali, promo stagionali', 'modello Luxury Outlet · tema scuro · standard', ICONA_OUTLET],
        ['boutique', 'Boutique', 'moda e accessori, cartelli eleganti, cornici e paletti', 'modello TEBE · tema chiaro · compatto', ICONA_BOUTIQUE]].forEach(([chiave, titolo, testo, sotto, icona], i) => {
        const carta = tasto('', `nn-tipo${stato.tipo === chiave ? ' scelto' : ''}`);
        if (!i) carta.dataset.primo = '';
        carta.setAttribute('aria-pressed', String(stato.tipo === chiave));
        carta.insertAdjacentHTML('afterbegin', icona);
        carta.append(el('span', 'nn-tipo-titolo', titolo), el('span', 'nn-tipo-testo', testo), el('span', 'nn-tipo-sotto', sotto));
        carta.addEventListener('click', () => {
          if (stato.tipo !== chiave) scegliTipo(chiave);
          radice.querySelectorAll('.nn-tipo').forEach(c => { c.classList.toggle('scelto', c === carta); c.setAttribute('aria-pressed', String(c === carta)); });
          setTimeout(() => vai(1), riduci() ? 0 : 260);
        });
        scelte.append(carta);
      });
      f.append(scelte);
    } else if (nome === 'nome') {
      f.append(intestazione('Come si chiama?', 'il nome compare nella splash page, nel menu dei negozi e nella dashboard.'));
      const grande = campo('nome del negozio', stato.nome, 'es. BOUTIQUE ROMA', valore => {
        stato.nome = valore.toUpperCase();
        controllaNome();
        aggiornaAnteprima();
      }, 40, 'nn-campo-grande');
      const indirizzo = campo('indirizzo', stato.indirizzo, 'es. VIA DEL CORSO 12', valore => {
        stato.indirizzo = valore.toUpperCase();
        if (!stato.breveAMano) { stato.indirizzoBreve = breveDa(valore); breve.querySelector('input').value = stato.indirizzoBreve; }
        aggiornaAnteprima();
      }, 40);
      const breve = campo('indirizzo breve', stato.indirizzoBreve, 'es. CORSO 12', valore => { stato.indirizzoBreve = valore.toUpperCase(); stato.breveAMano = true; }, 24);
      breve.append(el('small', 'nn-campo-nota', 'nel menu dei negozi della dashboard, dove c’è poco spazio'));
      const descrizione = campo('descrizione breve', stato.descrizione, 'es. OUTLET MULTI BRAND', valore => { stato.descrizione = valore.toUpperCase(); stato.descrizioneAMano = true; aggiornaAnteprima(); }, 50);
      descrizione.append(el('small', 'nn-campo-nota', 'sotto l’indirizzo, nel banner della dashboard'));
      const riga = el('div', 'nn-riga');
      riga.append(indirizzo, breve);
      const cartella = el('p', 'nn-cartella');
      f.append(grande, cartella, riga, descrizione);
      // la cartella del negozio, dal nome; un nome già usato non va avanti
      function controllaNome() {
        cartella.textContent = stato.nome.trim() ? `cartella del negozio: ${id()}/${esisteGia() ? ' · c’è già un negozio con questo nome' : ''}` : 'la cartella del negozio si ricava dal nome';
        cartella.classList.toggle('err', esisteGia());
        aggiornaAvanti();
      }
      setTimeout(controllaNome);
    } else if (nome === 'logo') {
      f.append(intestazione('Il logo del negozio', 'si analizza dagli angoli: lo sfondo si toglie e il logo si ritaglia ai suoi bordi. Senza logo usa quello di STORE // CRAFT: si cambia quando vuoi, il negozio nasce clone.'));
      const scelte = el('div', 'nn-logo-scelte');
      const predefinito = tasto('', `nn-logo-scelta${stato.logoTela ? '' : ' scelto'}`);
      predefinito.dataset.primo = '';
      const imgStore = el('img'); imgStore.src = 'assets/img/storecraftlogo.png'; imgStore.alt = '';
      predefinito.append(imgStore, el('span', '', 'logo STORE // CRAFT'), el('small', '', 'di partenza'));
      predefinito.addEventListener('click', () => { stato.logoTela = null; stato.logoFile = null; stato.logoNome = ''; stato.logoUrl = ''; stato.logoAColori = false; stato.analisi = null; disegna(); aggiornaAnteprima(); });
      const carica = tasto('', `nn-logo-scelta carica${stato.logoTela ? ' scelto' : ''}`);
      const input = el('input'); input.type = 'file'; input.accept = 'image/png,image/svg+xml,image/webp,image/jpeg'; input.hidden = true;
      if (stato.logoUrl) { const img = el('img'); img.src = stato.logoUrl; img.alt = ''; carica.append(img, el('span', '', stato.logoNome), el('small', '', 'cambia')); }
      else carica.append(el('span', 'nn-piu', '+'), el('span', '', 'carica il logo'), el('small', '', 'png, jpg, webp o svg: trascinalo qui o clicca'));
      const nota = el('p', 'nn-analisi');
      const prendi = async file => {
        if (!file || !/^image\//.test(file.type)) return;
        nota.textContent = 'analizzo il logo…';
        try {
          const esito = await LogoNegozio.analizza(file);
          stato.logoTela = esito.tela; stato.logoFile = file; stato.logoNome = file.name;
          stato.logoUrl = esito.tela.toDataURL('image/png');
          stato.logoAColori = esito.colori;
          stato.analisi = esito;
          disegna(); aggiornaAnteprima();
        } catch (errore) { nota.textContent = `logo non leggibile: ${errore.message}`; nota.classList.add('err'); }
      };
      carica.addEventListener('click', () => input.click());
      input.addEventListener('change', () => prendi(input.files[0]));
      ['dragenter', 'dragover'].forEach(t => carica.addEventListener(t, e => { e.preventDefault(); carica.classList.add('sopra'); }));
      ['dragleave', 'drop'].forEach(t => carica.addEventListener(t, e => { e.preventDefault(); carica.classList.remove('sopra'); }));
      carica.addEventListener('drop', e => prendi(e.dataTransfer.files[0]));
      scelte.append(predefinito, carica, input);
      f.append(scelte, el('p', 'nn-titolo-centro', 'anteprima'));
      if (stato.analisi) {
        nota.replaceChildren(...[stato.analisi.giaTrasparente ? '✓ già trasparente' : '✓ sfondo tolto dagli angoli', '✓ ritagliato ai bordi del logo',
          `✓ ${stato.analisi.colori ? 'a colori' : 'a tinta piatta'} (riconosciuto)`].map(t => el('span', '', t)));
      }
      f.append(nota);
      if (stato.logoTela) {
        f.append(segmenti('tipo di logo', [
          ['piatto', 'tinta piatta', '4 varianti: bianco, nero, rosso e oro del negozio, come i loghi ufficiali'],
          ['colori', 'a colori', 'una sola versione scontornata: i colori restano in tutte le pagine']
        ], stato.logoAColori ? 'colori' : 'piatto', v => { stato.logoAColori = v === 'colori'; provaStampe(); aggiornaAnteprima(); disegnaProva(); }));
      }
      // come starà sui due temi della dashboard (a tinta piatta bianco o nero, a colori com'è)
      const prova = el('div', 'nn-logo-prova');
      const disegnaProva = () => {
        prova.replaceChildren();
        ['scuro', 'chiaro'].forEach(t => {
          const fondo = el('div', `nn-logo-fondo ${t}${stato.logoAColori ? ' a-colori' : ''}`);
          const img = el('img'); img.src = stato.logoUrl || 'assets/img/storecraftlogo.png'; img.alt = '';
          fondo.append(img, el('span', '', `dashboard · tema ${t}`));
          prova.append(fondo);
        });
      };
      disegnaProva();
      // come starà nelle stampe: le immagini del logo del modello rifatte con questo logo, alla stessa misura
      const stampe = el('div', 'nn-stampe');
      const provaStampe = async () => {
        const voci = modello() === 'tebe'
          ? [['footer_tebe.png', 'piè dei cartelli e cartellini', true], ['tebeoro.png', 'albero accessori', true]]
          : [['footer.png', 'piè dei cartelli'], ['logocartellini.png', 'cartellini', true], ['LUXURYOUTLET_BACK.png', 'etichette dymo']];
        const tela = stato.logoTela || await telaStore();
        const fatte = await Promise.all(voci.map(async ([file, testo, oro]) => {
          try { return [await LogoNegozio.adatta(tela, `assets/img/${modello()}/${file}`, { colori: !!(stato.logoAColori && stato.logoTela), colore: oro ? stato.oro.replace('#', '').match(/../g).map(h => parseInt(h, 16)) : null }), testo]; } catch { return null; }
        }));
        stampe.replaceChildren(...fatte.filter(Boolean).map(([c, testo]) => {
          const box = el('div', 'nn-stampa');
          const img = el('img'); img.src = c.toDataURL('image/png'); img.alt = '';
          box.append(img, el('span', '', testo));
          return box;
        }));
      };
      provaStampe();
      f.append(el('p', 'nn-gruppo-titolo', 'sulla dashboard'), prova, el('p', 'nn-gruppo-titolo', 'nelle stampe, al posto del logo del modello'), stampe);
    } else if (nome === 'aspetto') {
      f.append(intestazione('Che aspetto ha?', `di partenza quello di ${nomeModello()}; l’anteprima cambia mentre scegli. Ogni utente potrà poi sceglierlo da IMPOSTAZIONI.`));
      f.append(segmenti('tema', [['dark', 'scuro', 'fondo nero caldo, oro'], ['light', 'chiaro', 'avorio e oro, come TEBE']], stato.tema, v => { stato.tema = v; aggiornaAspetto(); }),
        segmenti('aspetto', [['standard', 'standard', 'angoli tondi, Cinzel e Plus Jakarta Sans'], ['minimal', 'compatto', 'squadrato, Fraunces e Arial']], stato.aspetto, v => { stato.aspetto = v; aggiornaAspetto(); }));
    } else if (nome === 'sezioni') {
      f.append(intestazione('Cosa c’è nella dashboard?', 'le gallerie, nell’ordine in cui le vedi. Il menu di sinistra si compone da solo. Le gallerie nascono vuote: i moduli li aggiungi poi con le spunte.'));
      f.append(elencoSezioni());
    } else if (nome === 'dettagli') {
      f.append(intestazione('Gli ultimi dettagli', 'tutto si cambia anche dopo.'));
      const gruppo = (titolo, ...figli) => { const g = el('div', 'nn-gruppo'); g.append(el('p', 'nn-gruppo-titolo', titolo), ...figli); return g; };
      const interruttori = el('div', 'nn-interruttori');
      [['dataOra', 'data e ora', 'in alto a sinistra'], ['radio', 'radio', 'dietro data e ora'], ['meteo', 'meteo', 'città e tempo nel banner']].forEach(([k, t, n]) => {
        interruttori.append(interruttore(t, n, !!stato.intestazione[k], v => { stato.intestazione[k] = v; if (k === 'dataOra' && !v) { stato.intestazione.radio = false; } aggiornaAnteprima(); disegna(); }, k === 'radio' && !stato.intestazione.dataOra));
      });
      const cassa = segmenti('', [['sempre', 'sempre', 'in creator e in cassiere'], ['solo-cassiere', 'solo in cassiere', 'nascoste in creator']], stato.cassa, v => { stato.cassa = v; aggiornaAnteprima(); }, true);
      const cursore = segmenti('', [['oro', 'oro', 'come Luxury Outlet'], ['rosso', 'rosso', 'come TEBE']], stato.cursore, v => { stato.cursore = v; }, true);
      cursore.prepend(el('p', 'nn-oro-nota nn-sotto-nota', 'il triangolo che nella pagina indica sul foglio l’elemento del campo in uso'));
      const loghi = segmenti('', [['copia', `copia i loghi di ${nomeModello()}`, 'i brand del modello, subito nei menu brand'], ['nessuno', 'nessun logo', 'li importi da loghi ufficiali']], stato.loghi, v => { stato.loghi = v; }, true);
      const qr = campo('collegamento iniziale del QR (instagram, sito…)', stato.qr, 'https://…', v => { stato.qr = v.trim(); }, 200);
      f.append(gruppo('intestazione', interruttori), gruppo('utilità cassa', cassa), gruppo('cursore sul foglio', cursore), gruppo('loghi ufficiali', loghi), qr);
    } else {
      f.append(stato.fatto ? fatto() : riepilogo());
    }
    return f;
  }

  function campo(etichetta, valore, esempio, cambia, massimo, classe = '') {
    const etichettaEl = el('label', `nn-campo ${classe}`.trim());
    const input = el('input');
    input.type = 'text'; input.value = valore; input.placeholder = esempio; input.maxLength = massimo; input.autocomplete = 'off'; input.spellcheck = false;
    input.addEventListener('input', () => cambia(input.value));
    etichettaEl.append(el('span', '', etichetta), input);
    return etichettaEl;
  }
  function segmenti(titolo, voci, attuale, cambia, piccolo = false) {
    const gruppo = el('div', `nn-segmenti${piccolo ? ' piccolo' : ''}`);
    if (titolo) gruppo.append(el('p', 'nn-gruppo-titolo', titolo));
    const fila = el('div', 'nn-segmenti-fila');
    fila.setAttribute('role', 'radiogroup');
    voci.forEach(([valore, testo, nota], i) => {
      const b = tasto('', `nn-segmento${valore === attuale ? ' scelto' : ''}`);
      if (!i && titolo) b.dataset.primo = '';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(valore === attuale));
      b.append(el('span', '', testo), el('small', '', nota));
      b.addEventListener('click', () => {
        fila.querySelectorAll('.nn-segmento').forEach(x => { x.classList.toggle('scelto', x === b); x.setAttribute('aria-checked', String(x === b)); });
        cambia(valore);
      });
      fila.append(b);
    });
    gruppo.append(fila);
    return gruppo;
  }
  function interruttore(testo, nota, acceso, cambia, spento = false) {
    const b = tasto('', `nn-interruttore${acceso ? ' acceso' : ''}`);
    b.setAttribute('role', 'switch');
    b.setAttribute('aria-checked', String(acceso));
    b.disabled = spento;
    b.append(el('i'), el('span', '', testo), el('small', '', spento ? 'serve data e ora' : nota));
    b.addEventListener('click', () => cambia(!acceso));
    return b;
  }

  function elencoSezioni() {
    const box = el('div', 'nn-sezioni');
    const lista = el('ol', 'nn-sezioni-lista');
    stato.sezioni.forEach((sezione, i) => {
      const riga = el('li', `nn-sezione t-${sezione.tipo}`);
      riga.append(el('span', 'nn-sezione-segno', TIPI_SEZIONE[sezione.tipo].segno));
      const input = el('input');
      input.type = 'text'; input.value = sezione.titolo; input.maxLength = 50; input.setAttribute('aria-label', `titolo della galleria ${i + 1}`);
      input.addEventListener('input', () => { sezione.titolo = input.value; aggiornaAnteprima(); });
      const testo = el('span', 'nn-sezione-testo');
      testo.append(input, el('small', '', `${TIPI_SEZIONE[sezione.tipo].nome.toLowerCase()} · ${TIPI_SEZIONE[sezione.tipo].nota}`));
      const muovi = (passoSezione) => { const j = i + passoSezione; if (j < 0 || j >= stato.sezioni.length) return; [stato.sezioni[i], stato.sezioni[j]] = [stato.sezioni[j], stato.sezioni[i]]; disegna(); aggiornaAnteprima(); };
      const su = tasto('↑', 'nn-mini'); su.disabled = !i; su.title = 'sposta su'; su.addEventListener('click', () => muovi(-1));
      const giu = tasto('↓', 'nn-mini'); giu.disabled = i === stato.sezioni.length - 1; giu.title = 'sposta giù'; giu.addEventListener('click', () => muovi(1));
      const via = tasto('✕', 'nn-mini via'); via.title = 'togli la galleria'; via.addEventListener('click', () => { stato.sezioni.splice(i, 1); disegna(); aggiornaAnteprima(); });
      riga.append(testo, su, giu, via);
      lista.append(riga);
    });
    if (!stato.sezioni.length) lista.append(el('li', 'nn-sezioni-vuote', 'nessuna galleria: aggiungine almeno una qui sotto'));
    const aggiungi = el('div', 'nn-aggiungi');
    aggiungi.append(el('span', 'nn-gruppo-titolo', 'aggiungi'));
    Object.entries(TIPI_SEZIONE).forEach(([tipo, dati]) => {
      const b = tasto(`+ ${dati.nome.toLowerCase()}`, 'nn-aggiungi-tasto');
      b.addEventListener('click', () => { stato.sezioni.push({ tipo, titolo: dati.nome }); disegna(); aggiornaAnteprima(); });
      aggiungi.append(b);
    });
    box.append(lista, aggiungi);
    return box;
  }

  function riepilogo() {
    const f = document.createDocumentFragment();
    f.append(intestazione(`Tutto pronto per ${stato.nome || 'il negozio'}`, 'controlla e apri: il negozio si scrive nella cartella del progetto (chrome o edge sul computer), poi va pubblicato con un commit.'));
    const voci = [
      ['tipo', `${stato.tipo} · modello ${nomeModello()}`, 0],
      ['nome', `${stato.nome} · cartella ${id()}/`, 1],
      ['indirizzo', [stato.indirizzo, stato.indirizzoBreve && `breve ${stato.indirizzoBreve}`].filter(Boolean).join(' · ') || '—', 1],
      ['descrizione', stato.descrizione || '—', 1],
      ['logo', stato.logoTela ? `${stato.logoNome} · ${stato.logoAColori ? 'a colori, una versione' : 'tinta piatta, 4 varianti'}` : 'STORE // CRAFT', 2],
      ['aspetto', `tema ${stato.tema === 'light' ? 'chiaro' : 'scuro'} · ${stato.aspetto === 'minimal' ? 'compatto' : 'standard'}`, 3],
      ['gallerie', stato.sezioni.map(s => s.titolo).join(' · ') || '—', 4],
      ['intestazione', ['dataOra', 'radio', 'meteo'].filter(k => stato.intestazione[k]).map(k => ({ dataOra: 'data e ora', radio: 'radio', meteo: 'meteo' }[k])).join(' · ') || 'nessun elemento', 5],
      ['utilità cassa', stato.cassa === 'sempre' ? 'sempre' : 'solo in cassiere', 5],
      ['cursore', `${stato.cursore} ${CURSORI[stato.cursore]}`, 5],
      ['loghi ufficiali', stato.loghi === 'copia' ? `copiati da ${nomeModello()}` : 'nessuno', 5]
    ];
    const lista = el('dl', 'nn-riepilogo');
    voci.forEach(([chiave, valore, quale]) => {
      const dt = el('dt', '', chiave);
      const dd = el('dd');
      dd.append(el('span', '', valore));
      if (chiave === 'oro dei loghi') dd.querySelector('span').style.setProperty('--c', valore), dd.querySelector('span').classList.add('nn-oro-testo');
      const cambia = tasto('cambia', 'nn-cambia');
      cambia.addEventListener('click', () => vai(quale));
      dd.append(cambia);
      lista.append(dt, dd);
    });
    const apriB = tasto('apri il negozio', 'nn-apri');
    apriB.dataset.primo = '';
    const registro = el('pre', 'nn-registro');
    registro.hidden = true;
    apriB.addEventListener('click', () => crea(apriB, registro));
    f.append(lista, apriB, registro);
    return f;
  }

  async function crea(apriB, registro) {
    const riga = (testo, classe = '') => { registro.hidden = false; const r = el('span', classe, testo); registro.append(r, '\n'); registro.scrollTop = registro.scrollHeight; };
    let progetto;
    try { progetto = await opzioni.collega(); } catch (errore) {
      riga(errore.name === 'AbortError' ? '// cartella del progetto non collegata: nessuna modifica' : `errore: ${errore.message}`, 'err');
      return;
    }
    apriB.disabled = true;
    riga(`$ apri-negozio ${id()} --modello ${modello()}`, 'cmd');
    try {
      await Associa.creaNegozio(progetto, {
        id: id(), nome: stato.nome.trim(), sigla: Associa.siglaNegozio(stato.nome), indirizzo: stato.indirizzo.trim(), indirizzoBreve: (stato.indirizzoBreve || breveDa(stato.indirizzo)).trim(), descrizione: stato.descrizione.trim(),
        tipo: stato.tipo, modello: modello(), tema: stato.tema, aspetto: stato.aspetto, oro: stato.oro, cursore: CURSORI[stato.cursore] || CURSORI.oro, logoTela: stato.logoTela, logoAColori: !!stato.logoAColori, logoNome: stato.logoNome,
        sezioni: stato.sezioni.map(s => ({ tipo: s.tipo, titolo: s.titolo.trim() || TIPI_SEZIONE[s.tipo].nome })), intestazione: stato.intestazione,
        cassa: stato.cassa, qr: stato.qr, loghi: stato.loghi
      }, testo => riga(testo));
      riga(`✔ ${stato.nome} è aperto: ${id()}/index.html`, 'ok');
      stato.fatto = true;
      setTimeout(() => disegna(1), 700);
    } catch (errore) {
      console.error(errore);
      riga(`errore: ${errore.message}`, 'err');
      apriB.disabled = false;
    }
  }

  function fatto() {
    const f = document.createDocumentFragment();
    const sigillo = el('div', 'nn-fatto');
    sigillo.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M19 33l9 9 17-19" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>');
    sigillo.append(el('p', 'nn-passo-n', 'negozio aperto'), el('h2', 'nn-titolo', stato.nome), el('p', 'nn-nota', `cartella ${id()}/ · negozio clone · ricorda il commit per pubblicarlo. Ora aggiungi i moduli alle sue gallerie con le spunte di Gestione pacchetti o del catalogo.`));
    const comandi = el('div', 'nn-fatto-comandi');
    const dash = el('a', 'nn-apri', 'apri la dashboard ↗');
    dash.href = `${id()}/index.html`; dash.target = '_blank'; dash.rel = 'noopener';
    const diagramma = tasto('vai al diagramma del negozio', 'nn-secondario');
    diagramma.dataset.primo = '';
    diagramma.addEventListener('click', () => opzioni.alFatto(id()));
    comandi.append(diagramma, dash);
    sigillo.append(comandi);
    f.append(sigillo);
    return f;
  }

  function pannelloAnteprima() {
    const pannello = el('div', 'nn-anteprima');
    pannello.append(el('p', 'nn-anteprima-titolo', `anteprima dal vivo · dashboard di ${stato.nome || 'nuovo negozio'}`));
    cornice = el('div', `nn-cornice${stato.tema === 'light' ? ' chiara' : ''}`);
    const iframe = el('iframe');
    iframe.title = 'Anteprima della dashboard del nuovo negozio';
    iframe.tabIndex = -1;
    iframe.src = `nuovo-negozio-anteprima.html?modello=${modello()}`;
    cornice.append(iframe);
    // passo 5 (sezioni): lo slider verticale accanto all'anteprima la scorre dall'alto in basso, per vedere tutte le gallerie
    const riga = el('div', 'nn-cornice-riga');
    const scorri = el('input', 'nn-scorri');
    scorri.type = 'range'; scorri.min = '0'; scorri.max = '1000'; scorri.value = '0';
    scorri.setAttribute('aria-label', 'Scorri l’anteprima in verticale');
    scorri.title = 'scorri l’anteprima';
    scorri.addEventListener('input', scorriAnteprima);
    riga.append(cornice, scorri);
    pannello.append(riga);
    requestAnimationFrame(adattaAnteprima);
    return pannello;
  }
  // l'anteprima scorre nella posizione dello slider (in millesimi dell'altezza che si può scorrere)
  function scorriAnteprima() {
    const scorri = parti?.anteprima?.querySelector('.nn-scorri');
    const finestra = cornice?.querySelector('iframe')?.contentWindow;
    if (!scorri || !finestra?.document?.documentElement) return;
    // da computer nella dashboard scorre la zona centrale (#main-content), non la pagina
    const d = finestra.document;
    const zona = [d.getElementById('main-content'), d.scrollingElement].find(e => e && e.scrollHeight > e.clientHeight + 1);
    if (zona) zona.scrollTop = (zona.scrollHeight - zona.clientHeight) * Number(scorri.value) / 1000;
  }

  function valido() {
    const nome = PASSI[passo];
    if (nome === 'tipo') return !!stato.tipo;
    if (nome === 'nome') return !!stato.nome.trim() && !esisteGia();
    if (nome === 'sezioni') return stato.sezioni.length > 0;
    return true;
  }
  function aggiornaAvanti() { const b = radice?.querySelector('.nn-avanti'); if (b) b.disabled = !valido(); }

  function comandi() {
    const fila = el('div', 'nn-comandi');
    const indietro = tasto('← indietro', 'nn-secondario');
    indietro.disabled = passo === 0;
    indietro.addEventListener('click', () => vai(passo - 1));
    fila.append(indietro);
    if (passo < PASSI.length - 1) {
      const avanti = tasto(passo === PASSI.length - 2 ? 'riepilogo →' : 'avanti →', 'nn-avanti');
      avanti.disabled = !valido();
      avanti.addEventListener('click', () => vai(passo + 1));
      fila.append(el('span', 'nn-suggerimento', 'invio per andare avanti'), avanti);
    }
    return fila;
  }

  function vai(n) {
    if (n < 0 || n >= PASSI.length || stato.fatto) return;
    if (n > passo && !valido()) return;
    const verso = Math.sign(n - passo);
    passo = n;
    disegna(verso);
  }
  function esci() {
    if (!stato.fatto && stato.tipo && !window.confirm('Lasciare l’apertura del negozio? Le scelte fatte si perdono.')) return;
    cornice = null;
    opzioni.alChiudi();
  }

  // Invio va avanti (non nei campi delle gallerie, che lo usano per scrivere); Esc annulla
  document.addEventListener('keydown', evento => {
    if (!radice?.isConnected) return;
    if (evento.key === 'Enter' && !evento.target.closest('.nn-sezioni, button, a') && !stato.fatto && passo < PASSI.length - 1 && valido()) { evento.preventDefault(); vai(passo + 1); }
    if (evento.key === 'Escape') { evento.preventDefault(); evento.stopImmediatePropagation(); esci(); }
  }, true);
  window.addEventListener('resize', adattaAnteprima);

  const ICONA_OUTLET = '<svg class="nn-tipo-icona" viewBox="0 0 64 64" aria-hidden="true"><path d="M8 34L30 12h22v22L30 56z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="44" cy="20" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M24 40l12-12M25 30a2 2 0 1 0 0 .1M35 40a2 2 0 1 0 0 .1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const ICONA_BOUTIQUE = '<svg class="nn-tipo-icona" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 18a5 5 0 1 1 5-5c0 3-5 4-5 8v3L8 42c-2 1.4-1 4 1.5 4h45c2.5 0 3.5-2.6 1.5-4L32 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  window.NuovoNegozio = Object.freeze({ apri, anteprima, anteprimaPronta: () => { aggiornaAspetto(); adattaAnteprima(); scorriAnteprima(); } });
})();
