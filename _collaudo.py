# Collaudo automatico delle stampe: stampa diretta contro lista di stampa (27 ottobre 2026).
# Si lancia SOLO dal computer del progetto, con il server locale acceso (Avvia server.bat): usa Chrome senza finestra,
# comandato con il protocollo DevTools. Non entra nelle copie dei clienti (comincia con _).
#
# Per ogni pagina di cartelli, promo e cartellini delle dashboard dei negozi installati (non quelle in arrivo né in
# ghost, come il Collaudo di stampa del Pannello di controllo):
#   1. STAMPA DIRETTA: il PDF che esce da Stampa → Salva come PDF della pagina (Page.printToPDF, formato della pagina,
#      margini nessuno, sfondi);
#   2. LISTA DI STAMPA: il foglio fotografato come con «Aggiungi a lista stampa» e messo nel PDF della lista
#      (ListaStampa.fotografa e ListaStampa.buildPdf, le stesse funzioni della pagina);
#   3. CONFRONTO: le due prime pagine disegnate a 100 dpi e sovrapposte: somiglianza, spostamento in mm, fogli in più.
# Risultato in _collaudo/: rapporto.html (da aprire nel browser, anche dal Pannello di controllo › Collaudo di stampa),
# rapporto.json e, per ogni pagina, le immagini della stampa diretta, della lista e della sovrapposizione.
#
# Uso:  python _collaudo.py                 tutti i negozi installati del progetto (server locale)
#       python _collaudo.py luxury tebe     solo questi negozi
#       python _collaudo.py luxury/cartelli_outlet.html   solo queste pagine
#       python _collaudo.py --sito https://luxury-outlet.it/storecraft   la copia di un cliente, online o servita
#                                            in locale: negozi e pagine si leggono dal sito stesso (dopo
#                                            un'installazione o un aggiornamento, tutto il catalogo del cliente)
# (oppure doppio clic su _collaudo.bat su Windows, _collaudo mac.command sul Mac)
# Serve Python 3 con tre pacchetti: python3 -m pip install pymupdf numpy websocket-client
# Il collaudo apre solo le pagine dei cartelli: non scrive niente nel sito, nella lista di stampa o nelle statistiche
# del cliente (Chrome parte ogni volta con un profilo vuoto, poi cancellato).

import base64, json, os, re, shutil, socket, subprocess, sys, tempfile, time, urllib.request
from datetime import datetime

try:
    import numpy as np
    import pymupdf
    import websocket
except ImportError as errore:
    print(f'Manca un pacchetto Python ({errore.name}). Installali una volta con:')
    print('  python3 -m pip install pymupdf numpy websocket-client')
    sys.exit(1)

RADICE = os.path.dirname(os.path.abspath(__file__))
SERVER = 'http://localhost:8000'


def trova_chrome():
    # Windows e Mac; altrimenti la variabile CHROME con il percorso
    candidati = [os.environ.get('CHROME', ''),
                 r'C:\Program Files\Google\Chrome\Application\chrome.exe',
                 r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
                 os.path.expandvars(r'%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe'),
                 '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                 os.path.expanduser('~/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
                 shutil.which('google-chrome') or '', shutil.which('chromium') or '']
    return next((c for c in candidati if c and os.path.isfile(c)), None)


CHROME = trova_chrome()
USCITA = os.path.join(RADICE, '_collaudo')
DPI = 100
MM = 25.4 / DPI                 # mm per pixel
INCHIOSTRO = 0.82               # sotto questa luminosità (0 nero, 1 bianco) un pixel è stampato
# esito: somiglianza dopo l'allineamento e spostamento tra le due stampe
SOMIGLIANZA_OK = 97.0
TOLLERANZA = 2                  # pixel (0,5 mm) di differenza ammessi sui bordi (lo spostamento si misura a parte)
SPOSTAMENTO_OK = 0.6            # mm
MASSIMO = 10                    # mm: spostamento più grande che si cerca


# ------------------------------------------------------------------ pagine da collaudare

def leggi(percorso):
    # dal sito che si collauda (il progetto in locale o la copia di un cliente)
    with urllib.request.urlopen(richiesta(f'{SERVER}/{percorso}'), timeout=20) as r:
        return r.read().decode('utf-8')


def richiesta(indirizzo):
    # con l'identità di un browser: Cloudflare (sito dei clienti) rifiuta le richieste di Python senza
    return urllib.request.Request(indirizzo, headers={'User-Agent': 'Mozilla/5.0 (STORE CRAFT collaudo)'})


def negozi_installati():
    testo = leggi('assets/negozi/installati.js')
    elenco = re.search(r"Negozi\.installa\(\[([^\]]*)\]", testo)
    return re.findall(r"'([\w-]+)'", elenco.group(1)) if elenco else []


def pagine_del_negozio(negozio):
    # come collaudo() in schema-pagine.html: le schede delle sezioni di cartelli, promo e cartellini
    pagine, tipo = [], None
    for riga in leggi(f'assets/negozi/{negozio}-dashboard.js').split('\n'):
        if re.search(r'carosello:', riga):
            m = re.search(r"tipo:\s*'(\w+)'", riga)
            tipo = m.group(1) if m else None
            continue
        if tipo not in ('cartelli', 'promo', 'cartellini'):
            continue
        m = re.search(r"link:\s*'([^'?]+\.html)", riga)
        if not m or re.search(r'prossimamente|nascosta:\s*true', riga):
            continue
        link = m.group(1)
        if any(p['link'] == link for p in pagine):
            continue
        t = re.search(r"voce:\s*'([^']+)'", riga) or re.search(r"titolo:\s*'([^']+)'", riga)
        pagine.append({'negozio': negozio, 'link': link, 'titolo': t.group(1) if t else link, 'tipo': tipo})
    return pagine


# ------------------------------------------------------------------ Chrome senza finestra

def porta_libera():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


class Chrome:
    def __init__(self):
        self.profilo = tempfile.mkdtemp(prefix='collaudo-')
        self.porta = porta_libera()
        self.processo = subprocess.Popen([
            CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
            '--no-default-browser-check', f'--remote-debugging-port={self.porta}', f'--user-data-dir={self.profilo}',
            '--window-size=1440,1000', 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        indirizzo = None
        for _ in range(100):
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{self.porta}/json/list', timeout=1) as r:
                    pagine = [t for t in json.load(r) if t.get('type') == 'page']
                if pagine:
                    indirizzo = pagine[0]['webSocketDebuggerUrl']
                    break
            except Exception:
                pass
            time.sleep(0.1)
        if not indirizzo:
            raise RuntimeError('Chrome senza finestra non risponde')
        self.ws = websocket.create_connection(indirizzo, timeout=180, suppress_origin=True)
        self.numero = 0
        self.manda('Page.enable')
        self.manda('Runtime.enable')

    def manda(self, metodo, **parametri):
        self.numero += 1
        numero = self.numero
        self.ws.send(json.dumps({'id': numero, 'method': metodo, 'params': parametri}))
        while True:
            messaggio = json.loads(self.ws.recv())
            if messaggio.get('id') == numero:
                if 'error' in messaggio:
                    raise RuntimeError(f"{metodo}: {messaggio['error'].get('message')}")
                return messaggio.get('result', {})

    def valuta(self, codice):
        r = self.manda('Runtime.evaluate', expression=codice, awaitPromise=True, returnByValue=True)
        if r.get('exceptionDetails'):
            dettagli = r['exceptionDetails']
            testo = dettagli.get('exception', {}).get('description') or dettagli.get('text')
            raise RuntimeError(testo)
        return r.get('result', {}).get('value')

    def apri(self, indirizzo):
        self.manda('Page.navigate', url=indirizzo)
        for _ in range(300):
            time.sleep(0.1)
            try:
                if self.valuta("document.readyState === 'complete' && location.href !== 'about:blank'"):
                    break
            except Exception:
                pass
        # caratteri, immagini e moduli che lavorano dopo il caricamento (testi pronti, campi, loghi)
        self.valuta("""(async () => {
            await document.fonts.ready;
            await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
            await new Promise(r => setTimeout(r, 1500));
            return true;
        })()""")

    def chiudi(self):
        try:
            self.ws.close()
        except Exception:
            pass
        self.processo.terminate()
        try:
            self.processo.wait(10)
        except Exception:
            self.processo.kill()
        shutil.rmtree(self.profilo, ignore_errors=True)


# foto del foglio come «Aggiungi a lista stampa» e PDF della lista con quel foglio solo
CODICE_LISTA = r"""(async () => {
  const strumenti = document.querySelector('script[src*="strumenti-stampa.js"]');
  if (!strumenti) throw new Error('la pagina non ha la pulsantiera della lista di stampa');
  const sheet = document.querySelector(strumenti.dataset.sheet || '.print-sheet');
  if (!sheet) throw new Error('foglio non trovato');
  if (!window.ListaStampa) await new Promise((ok, ko) => {
    const tag = document.createElement('script');
    tag.src = strumenti.src.replace('strumenti-stampa.js', 'lista-stampa.js');
    tag.onload = ok; tag.onerror = () => ko(new Error('lista-stampa.js non caricato'));
    document.head.appendChild(tag);
  });
  const foto = await ListaStampa.fotografa(sheet);
  const pdf = await ListaStampa.buildPdf([{ createdAt: Date.now(), ...foto }]);
  const dati = await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(pdf); });
  return { pdf: dati.split(',')[1], mm: [foto.mmWidth, foto.mmHeight], orientamento: foto.orientation };
})()"""


# ------------------------------------------------------------------ confronto

def disegna(pdf_bytes):
    documento = pymupdf.open(stream=pdf_bytes, filetype='pdf')
    pagine = documento.page_count
    pagina = documento[0]
    misure = (pagina.rect.width * 25.4 / 72, pagina.rect.height * 25.4 / 72)
    pix = pagina.get_pixmap(dpi=DPI, colorspace=pymupdf.csGRAY)
    grigio = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width).astype(np.float32) / 255
    pix_colore = pagina.get_pixmap(dpi=DPI)
    documento.close()
    return grigio, pix_colore, pagine, misure


def spostamento(a, b):
    # di quanto va spostata b per sovrapporsi ad a (correlazione dell'inchiostro, con la FFT)
    ia, ib = 1 - a, 1 - b
    fa, fb = np.fft.rfft2(ia), np.fft.rfft2(ib)
    corr = np.fft.irfft2(fa * np.conj(fb), s=ia.shape)
    # solo spostamenti piccoli (fino a MASSIMO mm): con due cartelli uguali sul foglio la correlazione più alta
    # potrebbe essere il cartello superiore sopra l'inferiore, mezzo A4 più in là
    r = int(round(MASSIMO / MM))
    finestra = np.roll(np.roll(corr, r, axis=0), r, axis=1)[:2 * r + 1, :2 * r + 1]
    dy, dx = np.unravel_index(np.argmax(finestra), finestra.shape)
    return int(dx - r), int(dy - r)


def sposta(img, dx, dy):
    fuori = np.ones_like(img)
    h, w = img.shape
    ys, yd = (slice(0, h - dy), slice(dy, h)) if dy >= 0 else (slice(-dy, h), slice(0, h + dy))
    xs, xd = (slice(0, w - dx), slice(dx, w)) if dx >= 0 else (slice(-dx, w), slice(0, w + dx))
    fuori[yd, xd] = img[ys, xs]
    return fuori


def allarga(maschera, passi=TOLLERANZA):
    # la maschera allargata di un pixel per passo, nelle otto direzioni
    for _ in range(passi):
        m = maschera.copy()
        m[1:, :] |= maschera[:-1, :]; m[:-1, :] |= maschera[1:, :]
        m[:, 1:] |= maschera[:, :-1]; m[:, :-1] |= maschera[:, 1:]
        m[1:, 1:] |= maschera[:-1, :-1]; m[:-1, :-1] |= maschera[1:, 1:]
        m[1:, :-1] |= maschera[:-1, 1:]; m[:-1, 1:] |= maschera[1:, :-1]
        maschera = m
    return maschera


def sfuma(img):
    # media 3 x 3: i puntini isolati di una trama di fondo (es. il puntinato di Black Friday Lips) diventano grigio
    # chiaro e non contano come inchiostro; scritte, linee e grafiche restano
    p = np.pad(img, 1, mode='edge')
    h, w = img.shape
    return sum(p[y:y + h, x:x + w] for y in range(3) for x in range(3)) / 9


def somiglianza(a, b):
    # quanta parte dell'inchiostro di ognuna ha l'inchiostro dell'altra entro TOLLERANZA pixel: 100 = uguali.
    # La tolleranza assorbe i bordi dei caratteri (la lista è una foto JPEG, la stampa diretta è vettoriale).
    # inchiostro, tranne i puntini isolati (un pixel scuro da solo, sfumato, resta sopra 0,9; una linea sottile no)
    ia = (a < INCHIOSTRO) & (sfuma(a) < 0.9)
    ib = (b < INCHIOSTRO) & (sfuma(b) < 0.9)
    totale = ia.sum() + ib.sum()
    if totale == 0:
        return 100.0
    fuori = (ia & ~allarga(ib)).sum() + (ib & ~allarga(ia)).sum()
    return float(100 * (1 - fuori / totale))


def riquadro(img):
    ys, xs = np.where(img < INCHIOSTRO)
    if not len(xs):
        return None
    return [float(xs.min() * MM), float(ys.min() * MM), float(xs.max() * MM), float(ys.max() * MM)]


def sovrapposizione(a, b, percorso):
    # nero dove coincidono, rosso solo stampa diretta, blu solo lista
    ia, ib = a < INCHIOSTRO, b < INCHIOSTRO
    img = np.full(a.shape + (3,), 255, dtype=np.uint8)
    img[ia & ib] = (40, 40, 40)
    img[ia & ~ib] = (220, 40, 40)
    img[~ia & ib] = (30, 110, 230)
    pix = pymupdf.Pixmap(pymupdf.csRGB, img.shape[1], img.shape[0], img.tobytes(), False)
    pix.save(percorso)


def confronta(diretta, lista, cartella):
    a, pa, pagine_a, misure_a = disegna(diretta)
    b, pb, pagine_b, misure_b = disegna(lista)
    pa.save(os.path.join(cartella, 'diretta.png'))
    pb.save(os.path.join(cartella, 'lista.png'))
    esito = {'fogli_diretta': pagine_a, 'fogli_lista': pagine_b,
             'carta_diretta': [round(x, 1) for x in misure_a], 'carta_lista': [round(x, 1) for x in misure_b]}
    if a.shape != b.shape:
        esito.update(esito='diverse', motivo='carta di misura o orientamento diverso', somiglianza=0, spostamento=None)
        return esito
    dx, dy = spostamento(a, b)
    esito['somiglianza_grezza'] = round(somiglianza(a, b), 1)
    allineata = sposta(b, dx, dy)
    esito['somiglianza'] = round(somiglianza(a, allineata), 1)
    esito['spostamento'] = [round(-dx * MM, 2), round(-dy * MM, 2)]   # di quanto la lista è spostata rispetto alla diretta
    esito['riquadro_diretta'] = riquadro(a)
    esito['riquadro_lista'] = riquadro(b)
    sovrapposizione(a, b, os.path.join(cartella, 'sovrapposte.png'))
    distanza = (dx * dx + dy * dy) ** 0.5 * MM
    motivi = []
    if pagine_a > 1:
        motivi.append(f'la stampa diretta fa {pagine_a} fogli')
    if distanza > SPOSTAMENTO_OK:
        motivi.append(f'lista spostata di {esito["spostamento"][0]:+.1f} mm in orizzontale e {esito["spostamento"][1]:+.1f} mm in verticale')
    if esito['somiglianza'] < SOMIGLIANZA_OK:
        motivi.append(f'contenuto diverso (somiglianza {esito["somiglianza"]:.1f}%)')
    esito['esito'] = 'uguali' if not motivi else 'da controllare'
    esito['motivo'] = '; '.join(motivi)
    return esito


# ------------------------------------------------------------------ rapporto

def rapporto(risultati, inizio):
    with open(os.path.join(USCITA, 'rapporto.json'), 'w', encoding='utf-8') as f:
        json.dump({'sito': SERVER, 'data': inizio.isoformat(timespec='seconds'), 'pagine': risultati}, f, ensure_ascii=False, indent=1)
    righe = []
    negozio = None
    for r in risultati:
        if r['negozio'] != negozio:
            negozio = r['negozio']
            righe.append(f'<tr class="negozio"><td colspan="5">{negozio.upper()}</td></tr>')
        base = f"{r['negozio']}/{os.path.splitext(r['link'])[0]}"
        stato = r.get('esito', 'errore')
        classe = {'uguali': 'ok', 'da controllare': 'ko', 'diverse': 'ko'}.get(stato, 'ko')
        numeri = '' if 'somiglianza' not in r else f"{r['somiglianza']:.1f}%"
        sposto = '' if not r.get('spostamento') else f"{r['spostamento'][0]:+.1f} · {r['spostamento'][1]:+.1f} mm"
        immagini = '' if stato == 'errore' else (
            f'<a href="{base}/diretta.png" target="_blank"><img src="{base}/diretta.png" alt="stampa diretta"></a>'
            f'<a href="{base}/lista.png" target="_blank"><img src="{base}/lista.png" alt="lista di stampa"></a>'
            + (f'<a href="{base}/sovrapposte.png" target="_blank"><img src="{base}/sovrapposte.png" alt="sovrapposte"></a>' if os.path.exists(os.path.join(USCITA, base, 'sovrapposte.png')) else ''))
        righe.append(
            f'<tr><td><b>{r["titolo"]}</b><span>{r["link"]}</span></td>'
            f'<td class="{classe}">{"✔ uguali" if stato == "uguali" else "! " + stato}<span>{r.get("motivo") or r.get("errore") or ""}</span></td>'
            f'<td class="num">{numeri}</td><td class="num">{sposto}</td><td class="img">{immagini}</td></tr>')
    uguali = sum(1 for r in risultati if r.get('esito') == 'uguali')
    html = f"""<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Collaudo stampe</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  body {{ margin: 0; padding: 28px 24px 60px; background: #121110; color: #d8d2c6; font: 13px 'IBM Plex Mono', monospace; }}
  h1 {{ margin: 0 0 6px; color: #e5ba73; font: 500 15px 'IBM Plex Mono', monospace; letter-spacing: .22em; }}
  .riga {{ color: #7fcf95; margin-bottom: 8px; }}
  .legenda {{ color: #8f877a; margin-bottom: 22px; font-size: 12px; }}
  .legenda i {{ display: inline-block; width: 10px; height: 10px; margin: 0 6px 0 14px; vertical-align: -1px; }}
  table {{ width: 100%; border-collapse: collapse; }}
  th {{ text-align: left; color: #fff; font-weight: 500; font-size: 11px; letter-spacing: .12em; padding: 8px 10px; border-bottom: 1px solid #3a352d; }}
  td {{ padding: 10px; border-bottom: 1px solid #26231f; vertical-align: top; }}
  td span {{ display: block; color: #8f877a; font-size: 11.5px; margin-top: 3px; }}
  td b {{ color: #fff; font-weight: 500; }}
  tr.negozio td {{ color: #e5ba73; letter-spacing: .2em; padding-top: 26px; border-bottom-color: #3a352d; }}
  .ok {{ color: #7fcf95; }} .ko {{ color: #e07a6b; }} .num {{ color: #e5ba73; white-space: nowrap; }}
  td:nth-child(2) {{ min-width: 240px; }}
  .img {{ white-space: nowrap; }}
  .img img {{ height: 120px; margin-right: 8px; background: #fff; border: 1px solid #3a352d; }}
</style></head><body>
<h1>COLLAUDO STAMPE · STAMPA DIRETTA / LISTA DI STAMPA</h1>
<div class="riga">{SERVER} · {inizio.strftime('%d/%m/%Y %H:%M')} · {len(risultati)} pagine · {uguali} uguali · {len(risultati) - uguali} da controllare</div>
<div class="legenda">sovrapposte: <i style="background:#282828"></i>coincidono <i style="background:#dc2828"></i>solo stampa diretta <i style="background:#1e6ee6"></i>solo lista di stampa · un clic su un'immagine la apre grande</div>
<table><thead><tr><th>PAGINA</th><th>ESITO</th><th>SOMIGLIANZA</th><th>SPOSTAMENTO LISTA</th><th>STAMPA DIRETTA · LISTA · SOVRAPPOSTE</th></tr></thead>
<tbody>{''.join(righe)}</tbody></table>
</body></html>"""
    with open(os.path.join(USCITA, 'rapporto.html'), 'w', encoding='utf-8') as f:
        f.write(html)


# ------------------------------------------------------------------ via

def main(argomenti):
    global SERVER, USCITA
    if '--sito' in argomenti:
        i = argomenti.index('--sito')
        SERVER = argomenti[i + 1].rstrip('/')
        argomenti = argomenti[:i] + argomenti[i + 2:]
        nome = re.sub(r'[^\w.-]+', '_', re.sub(r'^https?://', '', SERVER)).strip('_')
        USCITA = os.path.join(RADICE, '_collaudo', nome)
    try:
        urllib.request.urlopen(richiesta(SERVER + '/assets/negozi/installati.js'), timeout=10)
    except Exception:
        print(f'Il sito {SERVER} non risponde' + (': avvia prima Avvia server.bat' if 'localhost' in SERVER else ''))
        return 1
    negozi = negozi_installati()
    scelti_negozi = [a for a in argomenti if '/' not in a]
    scelte_pagine = [a for a in argomenti if '/' in a]
    pagine = [p for n in negozi if not scelti_negozi or n in scelti_negozi for p in pagine_del_negozio(n)]
    if scelte_pagine:
        pagine = [p for p in pagine if f"{p['negozio']}/{p['link']}" in scelte_pagine]
    if not pagine:
        print('Nessuna pagina da collaudare.')
        return 1
    if not CHROME:
        print('Google Chrome non trovato: installalo, oppure indica il percorso nella variabile CHROME.')
        return 1
    os.makedirs(USCITA, exist_ok=True)
    inizio = datetime.now()
    print(f'$ collaudo stampe · {SERVER} · {len(pagine)} pagine · {", ".join(sorted({p["negozio"] for p in pagine}))}')
    chrome = Chrome()
    risultati = []
    try:
        for i, p in enumerate(pagine, 1):
            cartella = os.path.join(USCITA, p['negozio'], os.path.splitext(p['link'])[0])
            os.makedirs(cartella, exist_ok=True)
            r = dict(p)
            try:
                chrome.apri(f"{SERVER}/{p['negozio']}/{p['link']}")
                diretta = base64.b64decode(chrome.manda('Page.printToPDF', printBackground=True, preferCSSPageSize=True,
                                                        marginTop=0, marginBottom=0, marginLeft=0, marginRight=0)['data'])
                lista = chrome.valuta(CODICE_LISTA)
                lista_pdf = base64.b64decode(lista['pdf'])
                with open(os.path.join(cartella, 'diretta.pdf'), 'wb') as f: f.write(diretta)
                with open(os.path.join(cartella, 'lista.pdf'), 'wb') as f: f.write(lista_pdf)
                r.update(confronta(diretta, lista_pdf, cartella))
                r['foglio_mm'] = [round(x, 1) for x in lista['mm']]
            except Exception as errore:
                r['esito'] = 'errore'
                r['errore'] = str(errore).split('\n')[0][:200]
            risultati.append(r)
            segno = '✔' if r['esito'] == 'uguali' else '!'
            dettaglio = r.get('motivo') or r.get('errore') or ''
            print(f"  {segno} [{i}/{len(pagine)}] {p['negozio']}/{p['link']}  {r.get('somiglianza', '')}{'%' if 'somiglianza' in r else ''}  {dettaglio}")
    finally:
        chrome.chiudi()
    rapporto(risultati, inizio)
    uguali = sum(1 for r in risultati if r['esito'] == 'uguali')
    print(f'$ fatto: {uguali} uguali, {len(risultati) - uguali} da controllare · {os.path.join(USCITA, "rapporto.html")}')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
