<# : parte per il Prompt dei comandi
@echo off
set "STORECRAFT_ROOT=%~dp0"
powershell -NoProfile -STA -ExecutionPolicy Bypass -Command "Invoke-Expression ([IO.File]::ReadAllText('%~f0', [Text.Encoding]::UTF8))"
goto :eof
#>

# Prepara una copia di STORE // CRAFT per un cliente, con i negozi scelti (uno, due o tutti).
# Doppio clic su questo file: nella prima finestra si spuntano i negozi, nella seconda si sceglie la cartella di
# destinazione. La copia contiene la splash page della radice (non gli strumenti dell'operatore), i file comuni (assets/css, js,
# fonts), le cartelle dei negozi scelti con le loro risorse (assets/img/<negozio>/, logos, pdf, thumbnail, foto) e le
# loro schede (assets/negozi/), con l'elenco assets/negozi/installati.js già scritto. Restano fuori la cronologia Git,
# il piano di lavoro, la documentazione per lo sviluppo e questi comandi .bat. Il repository non viene modificato.
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$root = $env:STORECRAFT_ROOT.TrimEnd('\')
$titolo = 'STORE // CRAFT · Prepara copia'
$host.UI.RawUI.WindowTitle = 'STORE // CRAFT - prepara copia'
$utf8 = New-Object System.Text.UTF8Encoding $false
# Prove senza finestre: con STORECRAFT_NEGOZI (es. "tebe,ophilya") e STORECRAFT_DESTINAZIONE impostate, le finestre si
# saltano (nessuna conferma, nessun messaggio finale).
$automatica = [bool]($env:STORECRAFT_NEGOZI -and $env:STORECRAFT_DESTINAZIONE)

function Avviso($testo, $icona = 'Information') {
  if ($automatica) { Write-Host "  $testo"; return }
  [void][System.Windows.Forms.MessageBox]::Show($testo, $titolo, 'OK', $icona)
}

# Negozi disponibili: le schede in assets/negozi/ (<negozio>.js), con il nome scritto nella scheda.
$cartellaSchede = Join-Path $root 'assets\negozi'
$negozi = @(Get-ChildItem -LiteralPath $cartellaSchede -Filter '*.js' | Where-Object { $_.Name -ne 'installati.js' -and $_.BaseName -notlike '*-dashboard' } | Sort-Object Name | ForEach-Object {
  $testo = [IO.File]::ReadAllText($_.FullName, $utf8)
  $nome = if ($testo -match "nome:\s*'([^']+)'") { $Matches[1] } else { $_.BaseName.ToUpper() }
  [pscustomobject]@{ Id = $_.BaseName; Nome = $nome }
})
if (-not $negozi) {
  Avviso "Non trovo le schede dei negozi in $cartellaSchede." 'Error'
  exit
}
# Ordine: quello dell'elenco installati.js del repository, poi gli altri.
$ordine = @()
$installatiRepo = [IO.File]::ReadAllText((Join-Path $cartellaSchede 'installati.js'), $utf8)
[regex]::Matches($installatiRepo, "'([a-z0-9_-]+)'") | ForEach-Object { $ordine += $_.Groups[1].Value }
$negozi = @($negozi | Sort-Object { $i = [array]::IndexOf($ordine, $_.Id); if ($i -lt 0) { 999 } else { $i } })

if ($automatica) {
  $scelti = @($env:STORECRAFT_NEGOZI -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
  $nomiScelti = ($negozi | Where-Object { $scelti -contains $_.Id } | ForEach-Object { $_.Nome }) -join ', '
  $destinazione = $env:STORECRAFT_DESTINAZIONE.TrimEnd('\')
  if (-not (Test-Path -LiteralPath $destinazione)) { New-Item -ItemType Directory -Path $destinazione -Force | Out-Null }
} else {

# 1. Finestra con le caselle dei negozi
$form = New-Object System.Windows.Forms.Form
$form.Text = $titolo
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.Font = New-Object System.Drawing.Font('Segoe UI', 10)
$form.ClientSize = New-Object System.Drawing.Size(380, (130 + 32 * $negozi.Count))
$form.TopMost = $true

$etichetta = New-Object System.Windows.Forms.Label
$etichetta.Text = 'Quali negozi vuoi nella copia?'
$etichetta.Location = New-Object System.Drawing.Point(20, 18)
$etichetta.AutoSize = $true
$form.Controls.Add($etichetta)

$caselle = @()
$y = 54
foreach ($negozio in $negozi) {
  $casella = New-Object System.Windows.Forms.CheckBox
  $casella.Text = $negozio.Nome
  $casella.Tag = $negozio.Id
  $casella.Location = New-Object System.Drawing.Point(32, $y)
  $casella.AutoSize = $true
  $form.Controls.Add($casella)
  $caselle += $casella
  $y += 32
}

$avanti = New-Object System.Windows.Forms.Button
$avanti.Text = 'Avanti'
$avanti.Size = New-Object System.Drawing.Size(100, 32)
$avanti.Location = New-Object System.Drawing.Point(260, ($y + 22))
$avanti.DialogResult = 'OK'
$avanti.Enabled = $false
$form.Controls.Add($avanti)
$form.AcceptButton = $avanti

$annulla = New-Object System.Windows.Forms.Button
$annulla.Text = 'Annulla'
$annulla.Size = New-Object System.Drawing.Size(100, 32)
$annulla.Location = New-Object System.Drawing.Point(150, ($y + 22))
$annulla.DialogResult = 'Cancel'
$form.Controls.Add($annulla)
$form.CancelButton = $annulla

# Avanti si attiva quando almeno un negozio è spuntato
$caselle | ForEach-Object { $_.Add_CheckedChanged({ $avanti.Enabled = @($caselle | Where-Object { $_.Checked }).Count -gt 0 }) }

if ($form.ShowDialog() -ne 'OK') { exit }
$scelti = @($caselle | Where-Object { $_.Checked } | ForEach-Object { $_.Tag })
$nomiScelti = ($negozi | Where-Object { $scelti -contains $_.Id } | ForEach-Object { $_.Nome }) -join ', '

# 2. Cartella di destinazione (finestra standard di Windows, con Crea nuova cartella)
$dialogo = New-Object System.Windows.Forms.FolderBrowserDialog
$dialogo.Description = "Scegli la cartella in cui preparare la copia con: $nomiScelti"
$dialogo.ShowNewFolderButton = $true
$proprietario = New-Object System.Windows.Forms.Form
$proprietario.TopMost = $true
if ($dialogo.ShowDialog($proprietario) -ne 'OK') { exit }
$destinazione = $dialogo.SelectedPath.TrimEnd('\')

# La copia non può stare dentro questo repository (si copierebbe dentro sé stessa)
$radiceCompleta = [IO.Path]::GetFullPath($root).TrimEnd('\') + '\'
if (([IO.Path]::GetFullPath($destinazione).TrimEnd('\') + '\').StartsWith($radiceCompleta, [StringComparison]::OrdinalIgnoreCase)) {
  Avviso "La copia non può stare dentro il repository di STORE // CRAFT.`n`nScegli un'altra cartella (es. sul Desktop o in Documenti)." 'Warning'
  exit
}
# Cartella non vuota: si chiede conferma prima di scriverci dentro
if (Get-ChildItem -LiteralPath $destinazione -Force | Select-Object -First 1) {
  $risposta = [System.Windows.Forms.MessageBox]::Show(
    "La cartella scelta non è vuota:`n$destinazione`n`nI file con lo stesso nome verranno sostituiti; gli altri file restano. Per una copia pulita conviene una cartella vuota.`n`nVuoi continuare?",
    $titolo, 'YesNo', 'Warning')
  if ($risposta -ne 'Yes') { exit }
}
}

Write-Host ''
Write-Host "  Preparo la copia con: $nomiScelti"
Write-Host "  in: $destinazione"
Write-Host ''

# Copia un file o una cartella; le cartelle si uniscono a quelle già presenti (robocopy, come Esplora file)
function Copia($origine, $arrivo) {
  if (Test-Path -LiteralPath $origine -PathType Container) {
    robocopy $origine $arrivo /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "Copia di $origine non riuscita (robocopy, codice $LASTEXITCODE)." }
    return
  }
  $cartella = Split-Path -Parent $arrivo
  if (-not (Test-Path -LiteralPath $cartella)) { New-Item -ItemType Directory -Path $cartella -Force | Out-Null }
  Copy-Item -LiteralPath $origine -Destination $arrivo -Force
}

try {
  $tutti = @($negozi | ForEach-Object { $_.Id })
  $assets = Join-Path $root 'assets'

  # Radice: la splash page; non gli strumenti dell'operatore (operatore, logoimport, logogestione, guide dei componenti), il piano e le pagine di prova (_*)
  Get-ChildItem -LiteralPath $root -File -Filter '*.html' | Where-Object { $_.Name -notlike '_*' -and $_.Name -ne 'Storecraft Aggiornamento.html' -and @('operatore.html', 'logoimport.html', 'logogestione.html', 'guida-componenti.html', 'guida-campione.html', 'schema-pagine.html') -notcontains $_.Name } | ForEach-Object {
    Copia $_.FullName (Join-Path $destinazione $_.Name)
  }

  # Cartelle delle pagine dei negozi scelti
  foreach ($id in $scelti) {
    $pagine = Join-Path $root $id
    if (Test-Path -LiteralPath $pagine) { Copia $pagine (Join-Path $destinazione $id) }
  }

  # assets: file comuni interi; nelle cartelle divise per negozio i file comuni e le sottocartelle dei soli negozi scelti
  Get-ChildItem -LiteralPath $assets -Directory | ForEach-Object {
    $arrivo = Join-Path $destinazione "assets\$($_.Name)"
    if ($_.Name -eq 'negozi') {
      foreach ($id in $scelti) {
        Get-ChildItem -LiteralPath $_.FullName -File | Where-Object { $_.BaseName -eq $id -or $_.BaseName -eq "$id-dashboard" } | ForEach-Object { Copia $_.FullName (Join-Path $arrivo $_.Name) }
      }
      $elenco = ($scelti | ForEach-Object { "'$_'" }) -join ', '
      $testo = "/* Negozi installati in questa copia di STORE // CRAFT (vedi assets/js/negozi.js).`r`n" +
               "   Con un solo negozio la splash page apre subito la sua dashboard e i menu mostrano solo quel negozio.`r`n" +
               "   Scritto da Prepara copia.bat il $(Get-Date -Format 'dd/MM/yyyy'). */`r`n" +
               "Negozi.installa([$elenco]);`r`n"
      if (-not (Test-Path -LiteralPath $arrivo)) { New-Item -ItemType Directory -Path $arrivo -Force | Out-Null }
      [IO.File]::WriteAllText((Join-Path $arrivo 'installati.js'), $testo, $utf8)
      return
    }
    $divisa = @(Get-ChildItem -LiteralPath $_.FullName -Directory | Where-Object { $tutti -contains $_.Name }).Count -gt 0
    if (-not $divisa) {
      Copia $_.FullName $arrivo
      return
    }
    Get-ChildItem -LiteralPath $_.FullName | ForEach-Object {
      if ($_.PSIsContainer -and $tutti -contains $_.Name -and $scelti -notcontains $_.Name) { return }
      Copia $_.FullName (Join-Path $arrivo $_.Name)
    }
  }
} catch {
  Avviso "La copia non è riuscita:`n$($_.Exception.Message)" 'Error'
  exit
}

Write-Host '  Copia pronta.'
Avviso "Copia pronta: $nomiScelti`n`nCartella: $destinazione`n`nPer provarla in locale o pubblicarla, apri la cartella: la pagina d'ingresso è index.html."
if (-not $automatica) { Start-Process explorer.exe $destinazione }
