$files = git status --porcelain | Where-Object { $_ -match "^.M " -or $_ -match "^M" } | ForEach-Object { $_.Substring(3) }

$count = 1
foreach ($file in $files) {
    if ($file -match "playwright") {
        git add $file
        git commit -m "test(e2e): actualizar configuración de playwright"
    } elseif ($file -match "tailwind") {
        git add $file
        git commit -m "style(theme): implementar sistema de sombras multicapa premium"
    } elseif ($file -match "layout") {
        $filename = Split-Path $file -Leaf
        git add $file
        git commit -m "feat(layout): responsividad nativa y mobile tab bar en $filename"
    } elseif ($file -match "cargando|estado-vacio") {
        $filename = Split-Path $file -Leaf
        git add $file
        git commit -m "feat(ui): animaciones skeleton y estados vacíos premium en $filename"
    } else {
        $filename = Split-Path $file -Leaf
        git add $file
        git commit -m "refactor(ui): estandarización corporativa nz-card en $filename"
    }
    Write-Host "Committed ${count}: $file"
    $count++
}

git push origin main
