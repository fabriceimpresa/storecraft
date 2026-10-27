@echo off
rem Collaudo automatico delle stampe (stampa diretta contro lista di stampa). Solo dal computer del progetto,
rem con il server locale acceso (Avvia server.bat). Vedi _collaudo.py.
cd /d "%~dp0"
python -X utf8 _collaudo.py %*
if exist "_collaudo\rapporto.html" start "" "http://localhost:8000/_collaudo/rapporto.html"
pause
