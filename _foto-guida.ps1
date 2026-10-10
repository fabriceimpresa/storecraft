# Foto delle schede della guida dei componenti (guida-immagini/), con Chrome senza finestra e il server locale acceso
# (Avvia server.bat). Per ogni foto due passaggi su _foto-guida.html: il primo misura il ritaglio (titolo della pagina
# "PRONTA larghezza altezza"), il secondo fotografa a quella misura, a doppia risoluzione. Ogni passaggio parte con un
# profilo vuoto (niente preferenze, liste o loghi salvati). L'elenco delle foto è FOTO in _foto-guida.html.
# Uso: .\_foto-guida.ps1  (tutte)  oppure  .\_foto-guida.ps1 es-natale tel-home 'colore-*'
param([Parameter(ValueFromRemainingArguments = $true)] [string[]] $Foto)

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$radice = $PSScriptRoot

function Profilo {
  $cartella = Join-Path $env:TEMP ('foto-guida-' + [guid]::NewGuid())
  New-Item -ItemType Directory -Path $cartella | Out-Null
  $cartella
}

$p0 = Profilo
$dom = & $chrome --headless --disable-gpu "--user-data-dir=$p0" --dump-dom 'http://localhost:8000/_foto-guida.html?elenco' | Out-String
Remove-Item -Recurse -Force $p0 -ErrorAction SilentlyContinue
$tutte = [regex]::Match($dom, '<title>ELENCO ([^<]*)</title>').Groups[1].Value -split ' ' | Where-Object { $_ }
if (-not $tutte) { Write-Host 'Elenco delle foto non letto: il server locale è acceso?'; exit 1 }
if ($Foto) { $Foto = $tutte | Where-Object { $nome = $_; $Foto | Where-Object { $nome -like $_ } } } else { $Foto = $tutte }

foreach ($nome in $Foto) {
  $indirizzo = "http://localhost:8000/_foto-guida.html?foto=$nome"
  # le foto tel-* con il puntatore da telefono: le pagine passano alla vista telefono
  $telefono = @()
  if ($nome -like 'tel-*') { $telefono = @('--blink-settings=primaryPointerType=2,availablePointerTypes=2,primaryHoverType=1,availableHoverTypes=1') }
  $p1 = Profilo
  $dom = & $chrome --headless --disable-gpu --hide-scrollbars "--user-data-dir=$p1" @telefono --window-size=3000,1600 --virtual-time-budget=60000 --dump-dom $indirizzo | Out-String
  Remove-Item -Recurse -Force $p1 -ErrorAction SilentlyContinue
  $titolo = [regex]::Match($dom, '<title>([^<]*)</title>').Groups[1].Value
  if ($titolo -notmatch '^PRONTA (\d+) (\d+)$') { Write-Host "$nome : $titolo"; continue }
  $larghezza = $Matches[1]; $altezza = $Matches[2]
  $file = Join-Path $radice "guida-immagini\$nome.png"
  $p2 = Profilo
  & $chrome --headless --disable-gpu --hide-scrollbars "--user-data-dir=$p2" @telefono "--window-size=$larghezza,$altezza" --force-device-scale-factor=2 --virtual-time-budget=60000 "--screenshot=$file" $indirizzo 2>$null | Out-Null
  Remove-Item -Recurse -Force $p2 -ErrorAction SilentlyContinue
  Write-Host "$nome : $larghezza x $altezza"
}
