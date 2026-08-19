# STORE // CRAFT

STORE // CRAFT è una piccola applicazione web statica per il visual merchandising e la gestione rapida dei prezzi in negozio. Permette di personalizzare e stampare cartelli promozionali in formato A4, usando testi, prezzi, sconti e loghi di brand disponibili localmente.

## Funzionalità

- Dashboard iniziale con accesso ai modelli disponibili.
- Generatore **Cartello A4 Doppio / Outlet**:
  - due cartelli su un foglio A4 verticale;
  - logo del brand selezionabile;
  - claim laterali personalizzabili;
  - prezzo originale, percentuale di sconto e prezzo finale;
  - copia dei dati dal primo cartello al secondo;
  - anteprima aggiornata in tempo reale.
- Generatore **Last Chance Outlet**:
  - due cartelli su un foglio A4 verticale;
  - grafiche per ultime taglie e fine serie;
  - brand, claim, prezzo finale e nota in italiano personalizzabili;
  - copia del primo cartello sul secondo;
  - anteprima aggiornata in tempo reale.
- Strumenti rapidi nella dashboard:
  - calcolo del prezzo finale applicando uno sconto percentuale;
  - conversione da USD, GBP o EUR in EUR tramite tassi di cambio online.
- Layout dedicati alla stampa: durante la stampa il pannello dei controlli viene nascosto e resta solo il foglio A4.

## Struttura del progetto

```text
STORECRAFT/
├── index.html                 # Dashboard e strumenti di cassa
├── cartelli_outlet.html       # Generatore cartelli Outlet
├── cartelli_lastchance.html   # Generatore cartelli Last Chance
├── assets/
│   ├── img/
│   │   ├── LASTCHANCE_BACK.png
│   │   └── LUXURYOUTLET_BACK.png
│   ├── logos/                 # Loghi locali dei brand
│   └── css/                   # Riservata a eventuali fogli di stile futuri
└── readme.md
```

## Avvio

Non sono necessarie dipendenze, installazioni o una fase di compilazione.

1. Aprire `index.html` in un browser.
2. Scegliere uno dei generatori disponibili.
3. Compilare i campi del primo e del secondo cartello oppure usare il pulsante di copia.
4. Selezionare **Stampa Foglio (A4)**.
5. Nella finestra di stampa scegliere il formato A4 verticale e verificare l’anteprima prima di stampare.

Per un’esperienza più affidabile, il progetto può essere servito da un semplice server locale, ad esempio:

```bash
python3 -m http.server 8000
```

Poi visitare <http://localhost:8000>.

## Asset e personalizzazione

I generatori fanno riferimento agli asset con percorsi relativi. I loghi presenti in `assets/logos/` vengono caricati dall’elenco definito nei file HTML e mostrati nei menu di selezione. Per aggiungere un nuovo logo occorre:

1. inserire il file immagine in `assets/logos/`;
2. aggiungere il relativo nome nell’array `LOGO_FILES` di `cartelli_outlet.html` e `cartelli_lastchance.html`.

Le grafiche principali dei modelli si trovano in `assets/img/`.

## Note tecniche

- HTML, CSS e JavaScript sono inclusi direttamente nelle pagine.
- Gli aggiornamenti dei cartelli avvengono lato client, senza backend.
- Il calcolo dello sconto non richiede connessione internet.
- La conversione valuta usa l’API pubblica Frankfurter (`api.frankfurter.app`) e quindi richiede una connessione attiva. In caso di errore di rete viene mostrato un messaggio di errore.
- La stampa è configurata con `@page` in formato A4 portrait; il risultato dipende anche dalle impostazioni del browser e della stampante.

## Stato del progetto

Progetto locale leggero, pensato come strumento operativo per preparare rapidamente materiale promozionale da banco o vetrina.
