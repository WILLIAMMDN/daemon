$raiz = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $raiz 'backend-laravel'
$frontend = Join-Path $raiz 'frontend-angular'

Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$backend'; php artisan serve"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$frontend'; npm start"

Write-Host 'DAEMON iniciado: http://localhost:4200'
