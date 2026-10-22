/* Negozi installati in questa copia di STORE // CRAFT (vedi assets/js/negozi.js).
   Con un solo negozio la splash page apre subito la sua dashboard e i menu mostrano solo quel negozio.
   Prepara copia della pagina operatore riscrive questo elenco nella copia per un cliente, con i negozi scelti
   e i codici delle statistiche dei clienti.
   extra: true accende i set EXTRA (VINTAGE…) nel menu IMPOSTAZIONI: solo qui nel progetto madre, le copie per i clienti
   per ora non li hanno (decisione del 22 ottobre 2026). */
Negozi.installa(['luxury', 'tebe', 'ophilya'], { extra: true });
