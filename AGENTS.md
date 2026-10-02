# AGENTS.md

Indicazioni per agenti AI (e persone) che lavorano su questo repository.

## Cos'è

**STORE // CRAFT** è un insieme di strumenti statici per il visual merchandising, pensati per la stampa, nati per il negozio **Luxury Outlet**. Il personale apre una pagina, compila il modulo nel pannello laterale, controlla l'anteprima (A4, cartellino o etichetta DYMO) e stampa. La dashboard `index.html` raccoglie cartelli, promo stagionali, cartellini, etichette DYMO, stampe pronte e utilità di cassa, con le modalità CREATOR e CASSIERE.

## Lavoro in corso: allineamento alla versione TEBE / OPHILYA

Da StoreCraft è nata una seconda versione per i negozi TEBE e OPHILYA (cartella locale `Desktop\TEBE`, repository `github.com/fabriceimpresa/tebes`), con menu uniformi, regole di stampa più precise (soprattutto per le etichette DYMO), cursore sul foglio, pulsantiera con lista di stampa e documentazione completa (`AGENTS.md` di TEBE).

L'obiettivo finale è un'unica interfaccia STORE // CRAFT che ospiti tutti e tre i negozi: Luxury Outlet, TEBE e OPHILYA. Per arrivarci, questo repository viene reso **strutturalmente compatibile** con la versione TEBE, sul ramo `aggiornamento-tebe`.

Decisioni prese:

1. **TEBE si legge e basta.** La cartella `Desktop\TEBE` è solo un riferimento: non va mai modificata. Se serve un suo file, lo si copia qui e si modifica la copia.
2. **Il tema scuro di StoreCraft resta**, riadattato in parte con la struttura di TEBE (stessi elementi, stesse regole di impaginazione dei pannelli, colori di StoreCraft).
3. **Prima uniformità interna, poi allineamento.** I pannelli di cartelli e cartellini vengono prima resi uniformi tra loro, poi allineati alle regole del "pannello standard" di TEBE.
4. **Lo stile comune del pannello sta in un file condiviso** (`assets/css/pannello.css`), invece di essere copiato in ogni pagina come in TEBE.
5. **I temi Black Friday e Natale restano.** I pulsanti `toggleBlackFriday` / `toggleXmas` (uno per il cartello superiore, uno per quello inferiore) sono esclusivi di StoreCraft e vanno conservati, insieme ai loro file `assets/img/tema_*`.
6. **Si parte dalla dashboard** (`index.html`), rivista insieme all'utente un dettaglio alla volta.
7. **I fogli di stampa non si toccano** (misure in `mm`/`pt`, grafica dei cartelli, font di stampa) se il compito non lo chiede esplicitamente.

## Architettura

- Niente build, dipendenze o framework: HTML + CSS + JS vanilla, aperti nel browser o serviti in modo statico. Librerie solo da cdnjs (`qrcodejs@1.0.0`).
- Una pagina autonoma per strumento, con `<style>` e `<script>` inline. In `assets/js/` solo la logica condivisa: `logos.js`, `print-logo-colors.js`, `print-white-logos.js`, `dymo-direct.js` (`dymo.connect.framework.js` è presente nel repo).
- Dashboard: tema scuro con variabili su `:root` (`--bg #121110`, `--sidebar`, `--card`, `--border`, `--accent #d4a373`, `--gold #e5ba73`, `--text`, `--text-muted`), Cinzel per il marchio, Plus Jakarta Sans per il testo.

## Pagine

- Cartelli: `cartelli_semplici`, `cartelli_outlet`, `cartelli_outletmulti`, `cartelli_multireferenza`, `cartellopercentuale`, `cartelli_lastchance`, `cartello_banco`, `magazzino`.
- Promo stagionali: `promo_multibrand`, `blackfriday`, `blackfridaylips`, `xmas_ball`.
- Cartellini: `cartellinivetrina`, `cartellinipromo`.
- Etichette DYMO: `etichette` (più le versioni `etichettedb` ed `etichetteoriginal`).
- Loghi: `genera_loghi`, `gestisci_lista`, `logoimport`, `logogestione`.
- Altro: `pdf-viewer`.

## Convenzioni

- Testi dell'interfaccia, messaggi, commenti nel codice e documentazione in **italiano**.
- Prezzi in formato italiano, `€ 29,90`.
- Testo inserito dall'utente con `textContent` o nodi DOM, non con `innerHTML`.
- Per le convenzioni non ancora scritte qui, il riferimento è l'`AGENTS.md` di TEBE: quando una regola di TEBE viene adottata in StoreCraft, la si riporta in questo file.

## Verifica delle modifiche

Non ci sono test né linter. Servi la cartella (`python -m http.server 8000`), apri la pagina, poi controlla **Stampa → Anteprima** con scala 100 % e margini "Nessuno".
