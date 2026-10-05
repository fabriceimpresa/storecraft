# CLAUDE.md

Contesto, decisioni e convenzioni del progetto stanno in `AGENTS.md`, così Claude e gli altri agenti hanno un'unica fonte:

@AGENTS.md

## Note specifiche per Claude Code

- **Non modificare mai `Desktop\TEBE`**: si legge come riferimento, si scrive solo in questo repository.
- All'inizio di ogni sessione di lavoro, avviare `Avvia server.bat` nella radice del repository. Il link Githack per provare online il ramo `aggiornamento-storecraft` è documentato in `AGENTS.md`; il link online riflette solo le modifiche già pushate, quindi per il lavoro locale usare il server.
- Non esistono comandi di build, lint o test. Per verificare una modifica, servi il repo e apri la pagina; per impaginazione o stampa chiedi all'utente di controllare l'anteprima di stampa del browser.
- Prima di modificare una pagina, leggi i suoi `<style>` e `<script>` inline. Se cambi una funzione duplicata in più pagine, aggiorna tutte le copie.
- La documentazione (README.md, AGENTS.md, CLAUDE.md) si scrive solo in italiano.
- Non inserire nella documentazione correzioni o problemi da risolvere: vanno segnalati separatamente all'utente.
- Se aggiungi, rinomini o rimuovi una pagina, un modulo o una convenzione, aggiorna `AGENTS.md` nella stessa modifica.
