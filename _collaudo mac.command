#!/bin/zsh
# Collaudo automatico delle stampe per il Mac, gemello di _collaudo.bat: confronta, per ogni pagina di cartelli, promo e
# cartellini, la stampa diretta e la lista di stampa (vedi _collaudo.py). Solo dal computer del progetto, con il server
# locale acceso (Avvia server mac.command). Si avvia con il doppio clic (si apre il Terminale).
# Per la copia online di un cliente, dal Terminale:  python3 _collaudo.py --sito https://luxury-outlet.it/storecraft
cd "${0:A:h}" || exit 1
printf '\e]0;STORECRAFT - collaudo stampe\a'

if ! python3 -c 'import pymupdf, numpy, websocket' 2>/dev/null; then
  echo ''
  echo '  Per il collaudo servono tre pacchetti Python: pymupdf, numpy, websocket-client.'
  printf '  Li installo adesso? (s/n) '
  read risposta
  if [[ "$risposta" == [sS]* ]]; then
    python3 -m pip install --user pymupdf numpy websocket-client || { echo '  Installazione non riuscita.'; read; exit 1; }
  else
    exit 1
  fi
fi

python3 _collaudo.py "$@"
if [[ -f "_collaudo/rapporto.html" ]]; then
  if [[ -d "/Applications/Google Chrome.app" ]]; then open -a "Google Chrome" "http://localhost:8000/_collaudo/rapporto.html"
  else open "http://localhost:8000/_collaudo/rapporto.html"; fi
fi
echo ''
echo '  Premi Invio per chiudere.'
read
