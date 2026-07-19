param(
    [switch]$Lan,
    [string]$EnvSource
)

$raiz = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $raiz 'backend-laravel'
$frontend = Join-Path $raiz 'frontend-angular'
$comandoFrontend = if ($Lan) { 'npm run start:lan' } else { 'npm run start:local' }
$envDestino = Join-Path $backend '.env'

if (-not (Test-Path -LiteralPath $envDestino -PathType Leaf)) {
    if ([string]::IsNullOrWhiteSpace($EnvSource)) {
        throw "Falta backend-laravel\.env. Si estas en un worktree, ejecuta de nuevo con -EnvSource 'C:\laragon\www\daemon\backend-laravel\.env'."
    }

    $envOrigen = (Resolve-Path -LiteralPath $EnvSource -ErrorAction Stop).Path
    Copy-Item -LiteralPath $envOrigen -Destination $envDestino
    Write-Host 'Configuracion local copiada al worktree. El archivo .env permanece excluido de Git.'
}

$firebaseConfigurado = Select-String -LiteralPath $envDestino -Pattern '^\s*FIREBASE_PROJECT_ID\s*=\s*["'']?[A-Za-z0-9][A-Za-z0-9._-]*["'']?\s*(?:#.*)?$' -Quiet

if (-not $firebaseConfigurado) {
    throw 'FIREBASE_PROJECT_ID no esta configurado en backend-laravel\.env. El login Firebase local no puede validarse sin ese valor.'
}

Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$backend'; php artisan config:clear; php artisan serve --host=localhost --port=8000"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$frontend'; $comandoFrontend"

Write-Host 'DAEMON local: http://localhost:4200'

if ($Lan) {
    $ip = Get-NetIPConfiguration |
        Where-Object { $_.NetAdapter.Status -eq 'Up' -and $_.IPv4DefaultGateway -and $_.IPv4Address } |
        ForEach-Object { $_.IPv4Address.IPAddress } |
        Select-Object -First 1

    if ($ip) {
        Write-Host "DAEMON en red privada: http://${ip}:4200"
    } else {
        Write-Warning 'No se pudo detectar la IPv4 privada. Consulta ipconfig y abre http://TU_IP:4200.'
    }
    Write-Warning 'Comparte esta URL solo dentro de una red privada de confianza.'
}
