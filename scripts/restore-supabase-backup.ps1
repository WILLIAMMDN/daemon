[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $BackupPath,

    [string] $TargetDatabaseUrl = $env:DAEMON_RESTORE_DATABASE_URL,

    [switch] $Confirm,
    [switch] $CleanTarget,
    [switch] $AllowProduction
)

$ErrorActionPreference = 'Stop'
$backup = (Resolve-Path -LiteralPath $BackupPath).Path

if (-not $TargetDatabaseUrl) {
    throw 'Define -TargetDatabaseUrl o DAEMON_RESTORE_DATABASE_URL.'
}

if ($TargetDatabaseUrl -match 'lbxdcvsrmkkynttgwblc' -and -not $AllowProduction) {
    throw 'El destino parece produccion. Repite con -AllowProduction solo durante una recuperacion aprobada.'
}

if (-not (Get-Command pg_restore -ErrorAction SilentlyContinue)) {
    throw 'pg_restore no esta disponible en PATH. Instala PostgreSQL 17 client tools.'
}

$checksumPath = "$backup.sha256"
if (Test-Path -LiteralPath $checksumPath) {
    $expected = ((Get-Content -LiteralPath $checksumPath -Raw).Trim() -split '\s+')[0].ToLowerInvariant()
    $actual = (Get-FileHash -LiteralPath $backup -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($expected -ne $actual) {
        throw 'El checksum SHA-256 del backup no coincide.'
    }
    Write-Host '[OK] Checksum verificado.'
}

& pg_restore --list $backup | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw 'El archivo no es un backup PostgreSQL custom valido.'
}
Write-Host '[OK] Catalogo del backup legible.'

if (-not $Confirm) {
    Write-Warning 'Simulacion terminada. No se restauro nada. Usa -Confirm para ejecutar.'
    exit 0
}

$previousDatabase = $env:PGDATABASE
try {
    $env:PGDATABASE = $TargetDatabaseUrl
    $arguments = @('--no-owner', '--no-privileges', '--exit-on-error')
    if ($CleanTarget) {
        $arguments += @('--clean', '--if-exists')
    }
    $arguments += $backup

    & pg_restore @arguments
    if ($LASTEXITCODE -ne 0) {
        throw "pg_restore termino con codigo $LASTEXITCODE."
    }
} finally {
    $env:PGDATABASE = $previousDatabase
}

Write-Host '[OK] Restauracion completada. Ejecuta migraciones y smoke sobre el destino antes de habilitar trafico.'
