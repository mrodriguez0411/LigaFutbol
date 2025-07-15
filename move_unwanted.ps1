$sourceDir = "app\(tabs)"
$destDir = "app\_archived"

# Archivos que queremos conservar
$keep = @(
    "_layout.tsx",
    "Home.tsx",
    "Calendar.tsx",
    "Tournaments.tsx",
    "News.tsx",
    "Suspensions.tsx",
    "Login.tsx"
)

# Crear directorio _archived si no existe
if (-not (Test-Path -Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
}

# Mover archivos no deseados
Get-ChildItem -Path $sourceDir -File | ForEach-Object {
    if ($keep -notcontains $_.Name) {
        $destPath = Join-Path -Path $destDir -ChildPath $_.Name
        Write-Host "Moviendo $($_.FullName) a $destPath"
        Move-Item -Path $_.FullName -Destination $destPath -Force
    }
}

Write-Host "¡Proceso completado!"
