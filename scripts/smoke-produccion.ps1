[CmdletBinding()]
param(
    [string] $FrontendUrl = 'https://daemonestudiante.web.app',
    [string] $BackendHealthUrl = 'https://daemon-5vo1.onrender.com/api/v1/salud',
    [int] $TimeoutSec = 60,
    [int] $RetryCount = 3,
    [int] $RetryDelaySec = 5,
    [switch] $SkipBundleScan
)

$ErrorActionPreference = 'Stop'

function Assert-Ok {
    param(
        [bool] $Condition,
        [string] $Message
    )

    if (-not $Condition) {
        throw $Message
    }

    Write-Host "[OK] $Message"
}

function Get-HeaderValue {
    param(
        $Headers,
        [string] $Name
    )

    foreach ($key in $Headers.Keys) {
        if ([string]::Equals([string] $key, $Name, [System.StringComparison]::OrdinalIgnoreCase)) {
            $value = $Headers[$key]
            if ($value -is [array]) {
                return ($value -join ', ')
            }

            return [string] $value
        }
    }

    return ''
}

function Invoke-CheckedGet {
    param(
        [string] $Uri,
        [hashtable] $Headers = @{}
    )

    for ($attempt = 1; $attempt -le $RetryCount; $attempt++) {
        try {
            return Invoke-WebRequest -Uri $Uri -Headers $Headers -UseBasicParsing -TimeoutSec $TimeoutSec
        } catch {
            if ($attempt -eq $RetryCount) {
                throw "GET $Uri failed after $RetryCount attempt(s): $($_.Exception.Message)"
            }

            Start-Sleep -Seconds $RetryDelaySec
        }
    }
}

function Join-WebUrl {
    param(
        [string] $BaseUrl,
        [string] $Path
    )

    if ($Path.StartsWith('/')) {
        return "$BaseUrl$Path"
    }

    return "$BaseUrl/$Path"
}

$frontend = $FrontendUrl.TrimEnd('/')

Write-Host "DAEMON production smoke test"
Write-Host "Frontend: $frontend"
Write-Host "Backend health: $BackendHealthUrl"

$login = Invoke-CheckedGet -Uri (Join-WebUrl $frontend '/login')
Assert-Ok ($login.StatusCode -eq 200) 'Frontend /login responds with HTTP 200.'
Assert-Ok ((Get-HeaderValue $login.Headers 'Content-Type') -match 'text/html') 'Frontend /login returns HTML.'
Assert-Ok ((Get-HeaderValue $login.Headers 'Cache-Control') -match 'no-store') 'Frontend HTML is served with no-store cache policy.'
Assert-Ok ($login.Content -match 'main-[A-Za-z0-9]+\.js') 'Frontend HTML references an Angular main bundle.'
Assert-Ok ($login.Content -match '<meta name="daemon-release" content="[0-9a-f]{40}">') 'Frontend app shell exposes the deployed commit release stamp (40-char hex SHA).'
Assert-Ok ((Get-HeaderValue $login.Headers 'X-Content-Type-Options') -eq 'nosniff') 'Frontend sends X-Content-Type-Options nosniff.'

$contentSecurityPolicy = Get-HeaderValue $login.Headers 'Content-Security-Policy'
Assert-Ok ($contentSecurityPolicy -match "script-src[^;]*'wasm-unsafe-eval'") 'Frontend CSP allows WebAssembly compilation required by Rive.'
Assert-Ok ($contentSecurityPolicy -match 'script-src[^;]*https://apis\.google\.com') 'Frontend CSP allows the official Google authentication script.'

$riveRuntime = Invoke-CheckedGet -Uri (Join-WebUrl $frontend '/rive/rive.wasm')
Assert-Ok ($riveRuntime.StatusCode -eq 200) 'Rive WebAssembly runtime responds with HTTP 200.'
Assert-Ok ((Get-HeaderValue $riveRuntime.Headers 'Content-Type') -match 'application/wasm') 'Rive runtime is served with the WebAssembly content type.'

$riveMascot = Invoke-CheckedGet -Uri (Join-WebUrl $frontend '/rive/login-teddy.riv')
Assert-Ok ($riveMascot.StatusCode -eq 200) 'Login teddy Rive asset responds with HTTP 200.'
Assert-Ok ($riveMascot.Content.Length -gt 0) 'Login teddy Rive asset is not empty.'

$health = Invoke-CheckedGet -Uri $BackendHealthUrl -Headers @{ Origin = $frontend }
Assert-Ok ($health.StatusCode -eq 200) 'Backend health responds with HTTP 200.'
Assert-Ok ((Get-HeaderValue $health.Headers 'Access-Control-Allow-Origin') -eq $frontend) 'Backend CORS allows the production frontend origin.'
Assert-Ok ((Get-HeaderValue $health.Headers 'Access-Control-Allow-Credentials') -eq 'true') 'Backend CORS allows credentials.'
Assert-Ok ((Get-HeaderValue $health.Headers 'X-Content-Type-Options') -eq 'nosniff') 'Backend sends X-Content-Type-Options nosniff.'
Assert-Ok ((Get-HeaderValue $health.Headers 'X-Frame-Options') -eq 'DENY') 'Backend sends X-Frame-Options DENY.'

$healthJson = $health.Content | ConvertFrom-Json
Assert-Ok ($healthJson.ok -eq $true) 'Backend health payload has ok=true.'
Assert-Ok ($healthJson.database.ok -eq $true) 'Backend health reports database ok.'
Assert-Ok ($healthJson.assets.public_url_configured -eq $true) 'Backend asset public URL is configured.'
Assert-Ok ($healthJson.assets.cloud_url_configured -eq $true) 'Backend asset cloud URL is configured.'
Assert-Ok ($healthJson.assets.uploads_disk -eq 'supabase') 'Backend uploads disk is Supabase.'

$worker = Invoke-CheckedGet -Uri (Join-WebUrl $frontend '/ngsw-worker.js')
Assert-Ok ($worker.StatusCode -eq 200) 'Angular service worker responds with HTTP 200.'
Assert-Ok ((Get-HeaderValue $worker.Headers 'Content-Type') -match 'javascript') 'Angular service worker is served as JavaScript.'

$manifestResponse = Invoke-CheckedGet -Uri (Join-WebUrl $frontend '/ngsw.json')
Assert-Ok ($manifestResponse.StatusCode -eq 200) 'Angular service worker manifest responds with HTTP 200.'
Assert-Ok ((Get-HeaderValue $manifestResponse.Headers 'Content-Type') -match 'application/json') 'Angular service worker manifest is served as JSON.'

$manifest = $manifestResponse.Content | ConvertFrom-Json
$assetUrls = @()
foreach ($group in $manifest.assetGroups) {
    if ($group.urls) {
        $assetUrls += $group.urls
    }
}

$jsFiles = @($assetUrls | Where-Object { $_ -match '\.js$' } | Select-Object -Unique)
Assert-Ok ($jsFiles.Count -gt 0) 'Angular service worker manifest lists JavaScript bundles.'

if (-not $SkipBundleScan) {
    $hasFirebaseVerification = $false
    $hasFirebaseReset = $false
    $oldEndpointHits = New-Object System.Collections.Generic.List[string]

    foreach ($file in $jsFiles) {
        $bundle = Invoke-CheckedGet -Uri (Join-WebUrl $frontend $file)
        $content = $bundle.Content

        if ($content.Contains('verificacion=firebase')) {
            $hasFirebaseVerification = $true
        }

        if ($content.Contains('reset=firebase')) {
            $hasFirebaseReset = $true
        }

        if ($content.Contains('/auth/recuperar') -or $content.Contains('/auth/enviar-verificacion')) {
            $oldEndpointHits.Add($file)
        }
    }

    Assert-Ok $hasFirebaseVerification 'Deployed bundles contain Firebase verification return flow.'
    Assert-Ok $hasFirebaseReset 'Deployed bundles contain Firebase reset return flow.'
    Assert-Ok ($oldEndpointHits.Count -eq 0) 'Deployed bundles do not reference old Laravel email endpoints.'
}

Write-Host 'Production smoke test finished successfully.'
