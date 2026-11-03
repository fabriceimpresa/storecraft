#!/usr/bin/env node
/* Esportatore di STORE // CRAFT: scrive il FORMATO DI SCAMBIO (SCX) che la SaaS importa (fase 2, progetto con Rohi).
   Legge i file del progetto senza cambiarli e scrive una cartella:
     scx.json                       versione del formato, versione di STORE // CRAFT, data, elenco dei negozi
     negozi/<id>.json               scheda del negozio (assets/negozi/<id>.js) + colori (assets/negozi/<id>.css)
     negozi/<id>-dashboard.json     contenuto della dashboard (assets/negozi/<id>-dashboard.js): gallerie e widget
     liste/testi-pronti.json        liste di testi-pronti.js
     liste/fasce-prezzo.json        fasce di fasce-prezzo.js
     loghi/<id>.json                loghi ufficiali (elenco.js), brand prioritari e varianti di stampa
     risorse.json                   ogni file usato (percorso da assets/, peso, impronta SHA-256)
   I template delle pagine arriveranno in template/<negozio>/<pagina>.json (passo successivo).

   Uso:  node _esporta.mjs [cartella di uscita]      (di partenza _export/, fuori da git)
   Comincia con _ come gli altri strumenti interni: non entra nelle copie per i clienti. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const SCX_VERSIONE = 1;
const RADICE = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(RADICE, 'assets');
const USCITA = path.resolve(process.argv[2] || path.join(RADICE, '_export'));

const leggi = file => fs.readFileSync(path.join(RADICE, file), 'utf8');
const scrivi = (file, dati) => {
  const dove = path.join(USCITA, file);
  fs.mkdirSync(path.dirname(dove), { recursive: true });
  fs.writeFileSync(dove, JSON.stringify(dati, null, 2) + '\n');
  console.log('  scritto', path.relative(USCITA, dove));
};

// Esegue un file del progetto in una sandbox con gli oggetti globali dati (niente DOM, niente rete).
function esegui(file, globali) {
  vm.runInNewContext(leggi(file), { ...globali }, { filename: file, timeout: 2000 });
}

// Estrae il primo Object.freeze({ ... }) dopo un'etichetta (es. "const categorie =") e lo valuta.
function oggettoDopo(testo, etichetta, globali = {}) {
  const inizio = testo.indexOf(etichetta);
  if (inizio < 0) throw new Error(`"${etichetta}" non trovato`);
  const aperta = testo.indexOf('(', inizio);
  let livello = 0, fine = -1, stringa = null;
  for (let i = aperta; i < testo.length; i++) {
    const c = testo[i];
    if (stringa) { if (c === '\\') i++; else if (c === stringa) stringa = null; continue; }
    if (c === '"' || c === "'" || c === '`') stringa = c;
    else if (c === '(') livello++;
    else if (c === ')' && --livello === 0) { fine = i; break; }
  }
  const sorgente = 'Object.freeze' + testo.slice(aperta, fine + 1);
  return JSON.parse(JSON.stringify(vm.runInNewContext(sorgente, { ...globali }, { timeout: 1000 })));
}

// Variabili CSS dei colori del negozio, regola per regola (es. tema scuro di TEBE in una regola a parte).
function coloriNegozio(css) {
  const regole = [];
  const senzaCommenti = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, selettore, corpo] of senzaCommenti.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const variabili = {};
    for (const [, nome, valore] of corpo.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) variabili[nome] = valore.trim();
    if (Object.keys(variabili).length) regole.push({ selettore: selettore.trim().replace(/\s+/g, ' '), variabili });
  }
  return regole;
}

// Impronta e peso di un file di assets/ (null se non esiste).
const risorse = new Map();
function risorsa(relativo) {
  if (!relativo || /^https?:|^mailto:/.test(relativo)) return null;
  const pulito = relativo.split(/[?#]/)[0];
  if (risorse.has(pulito)) return pulito;
  const file = path.join(ASSETS, pulito);
  if (!fs.existsSync(file)) { risorse.set(pulito, { mancante: true }); return pulito; }
  const dati = fs.readFileSync(file);
  risorse.set(pulito, { byte: dati.length, sha256: crypto.createHash('sha256').update(dati).digest('hex') });
  return pulito;
}

// ---------- negozi installati ----------
let installati = [], opzioniInstallazione = {};
esegui('assets/negozi/installati.js', { Negozi: { installa: (elenco, opzioni = {}) => { installati = elenco; opzioniInstallazione = opzioni; } } });
const versione = (leggi('assets/js/dashboard.js').match(/VERSIONE\s*=\s*['"]([^'"]+)['"]/) || [])[1] || null;

console.log(`STORE // CRAFT ${versione} → SCX v${SCX_VERSIONE} in ${USCITA}`);
fs.mkdirSync(USCITA, { recursive: true });

const PERCORSI_SCHEDA = ['logoSplash', 'logoMenu', 'logoNegozi', 'logoUfficiale'];
for (const id of installati) {
  let scheda = null;
  esegui(`assets/negozi/${id}.js`, { Negozi: { registra: (chiave, dati) => { if (chiave === id) scheda = dati; } } });
  if (!scheda) throw new Error(`scheda del negozio ${id} non trovata`);
  PERCORSI_SCHEDA.forEach(campo => risorsa(scheda[campo]));
  if (scheda.guida) Object.values(scheda.guida).flat().forEach(foto => risorsa(`foto/${id}/${foto}`));
  scrivi(`negozi/${id}.json`, {
    id,
    scheda,
    colori: fs.existsSync(path.join(ASSETS, `negozi/${id}.css`)) ? coloriNegozio(leggi(`assets/negozi/${id}.css`)) : []
  });

  // dashboard: gallerie e widget; ogni widget punta alla sua pagina (il futuro template) o al suo PDF
  let contenuto = null;
  esegui(`assets/negozi/${id}-dashboard.js`, { Dashboard: { contenuto: dati => { contenuto = dati; } } });
  if (!contenuto) throw new Error(`dashboard del negozio ${id} non trovata`);
  if (contenuto.logo?.src) risorsa(contenuto.logo.src);
  for (const sezione of contenuto.sezioni || []) {
    for (const widget of sezione.schede || []) {
      (widget.miniature || []).forEach(risorsa);
      if (widget.pdf) risorsa(widget.pdf.replace(/^\/?assets\//, ''));
      if (widget.link) {
        const [pagina, query] = widget.link.split('?');
        widget.template = `${id}/${pagina.replace(/\.html$/, '')}`;
        if (query) widget.parametri = Object.fromEntries(new URLSearchParams(query));
      }
    }
  }
  scrivi(`negozi/${id}-dashboard.json`, { negozio: id, ...contenuto });

  // loghi ufficiali: elenco, prioritari e varianti di stampa
  const elenco = {};
  const testoElenco = leggi(`assets/logos/${id}/elenco.js`);
  vm.runInNewContext(testoElenco + '\n;__esci.LOGO_FILES = LOGO_FILES; __esci.PRIORITY_BRANDS = typeof PRIORITY_BRANDS === "undefined" ? [] : PRIORITY_BRANDS;', { __esci: elenco });
  const loghi = elenco.LOGO_FILES.map(file => {
    const varianti = {};
    for (const colore of ['white', 'black', 'red', 'gold']) {
      const percorso = `img/${id}/printlogos/${colore}${file}`;
      if (fs.existsSync(path.join(ASSETS, percorso))) varianti[colore] = risorsa(percorso);
    }
    return { file, nome: file.replace(/\.png$/i, ''), originale: risorsa(`logos/${id}/${file}`), prioritario: elenco.PRIORITY_BRANDS.includes(file), varianti };
  });
  scrivi(`loghi/${id}.json`, { negozio: id, brandPrioritari: scheda.brandPrioritari, oro: scheda.oro, loghi });
}

// ---------- liste comuni ----------
const testiPronti = oggettoDopo(leggi('assets/js/testi-pronti.js'), 'const categorie', {
  stella: testo => ({ testo, stella: true })
});
scrivi('liste/testi-pronti.json', {
  fonte: 'assets/js/testi-pronti.js',
  regola: 'testo pronto O testo libero; voce di partenza = avviso "Scegli un testo" solo a schermo',
  liste: Object.fromEntries(Object.entries(testiPronti).map(([nome, voci]) =>
    [nome, voci.map(voce => (typeof voce === 'string' ? { testo: voce } : voce))]))
});
scrivi('liste/fasce-prezzo.json', {
  fonte: 'assets/js/fasce-prezzo.js',
  partenza: '-- Seleziona Fascia Prezzo --',
  gruppi: oggettoDopo(leggi('assets/js/fasce-prezzo.js'), 'const fasce')
});

// ---------- risorse e indice ----------
const elencoRisorse = Object.fromEntries([...risorse].sort(([a], [b]) => a.localeCompare(b)));
scrivi('risorse.json', { base: 'assets/', file: elencoRisorse });
const mancanti = Object.entries(elencoRisorse).filter(([, info]) => info.mancante).map(([nome]) => nome);
scrivi('scx.json', {
  formato: 'storecraft-scx',
  versione: SCX_VERSIONE,
  storecraft: versione,
  esportato: new Date().toISOString(),
  negozi: installati,
  opzioniInstallazione: { extra: !!opzioniInstallazione.extra },
  conteggi: {
    risorse: risorse.size,
    risorseMancanti: mancanti.length
  }
});
if (mancanti.length) console.log(`  ! ${mancanti.length} risorse citate ma assenti:`, mancanti.slice(0, 10).join(', '));
console.log('fatto');
