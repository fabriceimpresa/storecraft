<# : parte per il Prompt dei comandi
@echo off
set "STORECRAFT_ROOT=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-Expression ([IO.File]::ReadAllText('%~f0'))"
goto :eof
#>

# Server locale di STORECRAFT: rende le pagine raggiungibili da http://localhost:8000, come se fossero online
# (la lista di stampa non funziona aprendo i file con il doppio clic). Si avvia solo con il doppio clic
# su questo file e si spegne chiudendo la sua finestra. Raggiungibile solo da questo computer.
$root = $env:STORECRAFT_ROOT.TrimEnd('\')
$port = 8000
$url = "http://localhost:$port/"
$host.UI.RawUI.WindowTitle = 'STORECRAFT - server locale'

function Open-Browser {
  $chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
              "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
              "$env:LocalAppData\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($chrome) { Start-Process $chrome $url } else { Start-Process $url }
}

$types = @{ '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='text/javascript; charset=utf-8';
  '.json'='application/json'; '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.gif'='image/gif';
  '.svg'='image/svg+xml'; '.webp'='image/webp'; '.ico'='image/x-icon'; '.ttf'='font/ttf'; '.otf'='font/otf';
  '.woff'='font/woff'; '.woff2'='font/woff2'; '.pdf'='application/pdf'; '.xml'='application/xml'; '.txt'='text/plain; charset=utf-8' }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
try {
  $listener.Start()
} catch {
  Write-Host ''
  Write-Host " La porta $port e' gia' in uso: probabilmente il server e' gia' acceso in un'altra finestra."
  Write-Host " Apro comunque $url"
  Open-Browser
  Start-Sleep -Seconds 6
  exit
}

Write-Host ''
Write-Host '  STORE // CRAFT - server locale acceso'
Write-Host ''
Write-Host "  Indirizzo:  $url"
Write-Host "  Cartella:   $root"
Write-Host ''
Write-Host '  Per spegnerlo chiudi questa finestra.'
Write-Host ''
Open-Browser

while ($listener.IsListening) {
  $task = $listener.GetContextAsync()
  while (-not $task.Wait(500)) { }
  $context = $task.Result
  try {
    $relative = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
    if ($relative -eq '') { $relative = 'index.html' }
    $path = [IO.Path]::GetFullPath((Join-Path $root $relative))
    if ($path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $path -PathType Leaf)) {
      $bytes = [IO.File]::ReadAllBytes($path)
      $extension = [IO.Path]::GetExtension($path).ToLower()
      if ($types.ContainsKey($extension)) { $context.Response.ContentType = $types[$extension] }
      $context.Response.Headers.Add('Cache-Control', 'no-store')
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $context.Response.StatusCode = 404
    }
  } catch {
    $context.Response.StatusCode = 500
  }
  $context.Response.Close()
}
