#!/bin/zsh
# Server locale di STORECRAFT per il Mac, gemello di Avvia server.bat: rende le pagine raggiungibili da
# http://localhost:8000, come se fossero online (la lista di stampa non funziona aprendo i file con il doppio clic).
# Si avvia con il doppio clic su questo file (si apre il Terminale) e si spegne chiudendo la sua finestra.
# Raggiungibile solo da questo computer. Usa Python 3, già presente sul Mac.
cd "${0:A:h}" || exit 1
port=8000
url="http://localhost:$port/"
printf '\e]0;STORECRAFT - server locale\a'

apri_browser() {
  if [[ -d "/Applications/Google Chrome.app" ]]; then open -a "Google Chrome" "$url"; else open "$url"; fi
}

if lsof -nP -iTCP:$port -sTCP:LISTEN >/dev/null 2>&1; then
  echo ''
  echo " La porta $port è già in uso: probabilmente il server è già acceso in un'altra finestra."
  echo " Apro comunque $url"
  apri_browser
  sleep 6
  exit 0
fi

echo ''
echo '  STORE // CRAFT - server locale acceso'
echo ''
echo "  Indirizzo:  $url"
echo "  Cartella:   $PWD"
echo ''
echo '  Per spegnerlo chiudi questa finestra.'
echo ''
(sleep 1; apri_browser) &

# come il .bat: niente copie salvate dal browser (Cache-Control: no-store), niente elenco delle richieste e niente avvisi
# per le richieste chiuse a metà dal browser (BrokenPipe)
exec python3 -c '
import http.server, sys
class Gestore(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()
    def log_message(self, *args):
        pass
class Server(http.server.ThreadingHTTPServer):
    # il browser che chiude una richiesta a metà (es. anteprima di Gestione pacchetti che si ricarica) non è un errore
    def handle_error(self, request, client_address):
        if isinstance(sys.exc_info()[1], (BrokenPipeError, ConnectionResetError)):
            return
        super().handle_error(request, client_address)
Server(("127.0.0.1", int(sys.argv[1])), Gestore).serve_forever()
' $port
