# STORE // CRAFT

STORE // CRAFT è una piccola applicazione web statica per il visual merchandising e la gestione rapida dei prezzi in negozio. Permette di personalizzare e stampare cartelli promozionali in formato A4, usando testi, prezzi, sconti e loghi di brand disponibili localmente.

## Funzionalità

- Dashboard iniziale con accesso ai modelli disponibili.
- Generatore **Cartello A4 Doppio / Outlet**: due cartelli su un foglio A4 verticale, con logo, claim, prezzi, sconto e anteprima in tempo reale.
- Generatore **Last Chance Outlet** per ultime taglie e fine serie, con brand, claim, prezzo finale e nota personalizzabili.
- Copia dei dati dal primo cartello al secondo.
- Calcolo del prezzo finale applicando uno sconto percentuale.
- Conversione da USD, GBP o EUR in EUR tramite tassi di cambio online.
- Layout dedicati alla stampa: durante la stampa il pannello dei controlli viene nascosto e resta solo il foglio A4.

## Struttura del progetto

```text
STORECRAFT/
├── index.html                 # Dashboard e strumenti di cassa
├── cartelli_outlet.html       # Generatore cartelli Outlet
├── cartelli_lastchance.html   # Generatore cartelli Last Chance
├── assets/
│   ├── img/                   # Grafiche dei modelli
│   ├── logos/                 # Loghi locali dei brand
│   └── css/                   # Riservata a eventuali fogli di stile futuri
└── README.md
```

## Avvio

Non sono necessarie dipendenze, installazioni o una fase di compilazione. Aprire `index.html` in un browser e scegliere uno dei generatori disponibili.

Per un’esperienza più affidabile, il progetto può essere servito da un semplice server locale:

```bash
python3 -m http.server 8000
```

Poi visitare <http://localhost:8000>.

## Asset e personalizzazione

I generatori usano percorsi relativi. I loghi presenti in `assets/logos/` vengono caricati dall’elenco `LOGO_FILES` definito nei file HTML. Per aggiungere un logo, inserire il file nella cartella e aggiungerne il nome negli array dei due generatori.

## Note tecniche

- HTML, CSS e JavaScript sono inclusi direttamente nelle pagine.
- Gli aggiornamenti dei cartelli avvengono lato client, senza backend.
- Il calcolo dello sconto non richiede connessione internet.
- La conversione valuta usa l’API pubblica Frankfurter (`api.frankfurter.app`) e richiede una connessione attiva.
- La stampa è configurata con `@page` in formato A4 portrait; il risultato dipende anche dalle impostazioni del browser e della stampante.

## Stato del progetto

Progetto locale leggero, pensato come strumento operativo per preparare rapidamente materiale promozionale da banco o vetrina.
