$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot

Write-Host 'Instalando backend Laravel...'
Set-Location (Join-Path $raiz 'backend-laravel')
if (-not (Test-Path '.env')) { Copy-Item '.env.example' '.env' }
composer install
php artisan key:generate
php artisan migrate
php artisan storage:link

Write-Host 'Instalando frontend Angular...'
Set-Location (Join-Path $raiz 'frontend-angular')
npm ci

Write-Host 'Configuracion terminada. Ejecuta scripts/iniciar.ps1.'
