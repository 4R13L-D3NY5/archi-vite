# Script de Respaldo Seguro de Ecosistema Archi-vite (XF Standard)
# Genera copias completas fechadas de PostgreSQL (Docker) y archivos físicos del DMS

Write-Host "=== Iniciando Backup de Archi-vite ===" -ForegroundColor Cyan

# 1. Definir rutas y fechas
$fecha = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "C:\Users\S1ST3M4S\XpertiFlow\projects\archi-vite\backups"
$tempDir = "$backupDir\temp_$fecha"
$zipPath = "$backupDir\Backup_Archivite_$fecha.zip"

# Crear directorios de backup
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

# 2. Respaldo de Base de Datos PostgreSQL de Docker (pg_dump)
Write-Host "-> Exportando base de datos PostgreSQL desde el contenedor..." -ForegroundColor Yellow
$dbBackupFile = "$tempDir\archivite_db_$fecha.sql"

# Comando seguro ejecutado en el contenedor postgres
docker exec archivite_postgres pg_dump -U admin -d archivite_db > $dbBackupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Base de datos exportada con exito." -ForegroundColor Green
} else {
    Write-Host "[WARNING] No se pudo conectar a Docker. Intentando exportar SQLite de fallback local..." -ForegroundColor Red
    $sqliteSource = "C:\Users\S1ST3M4S\XpertiFlow\projects\archi-vite\backend\archivite.db"
    if (Test-Path $sqliteSource) {
        Copy-Item -Path $sqliteSource -Destination "$tempDir\archivite_db_fallback.db"
        Write-Host "[OK] SQLite local de fallback copiado." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] No se encontraron bases de datos activas." -ForegroundColor Red
    }
}

# 3. Respaldo de archivos fisicos del DMS
Write-Host "-> Copiando archivos digitales del DMS..." -ForegroundColor Yellow
$dmsSource = "C:\Users\S1ST3M4S\XpertiFlow\projects\archi-vite\backend\media\dms"
$tempDmsDir = "$tempDir\dms"

if (Test-Path $dmsSource) {
    Copy-Item -Path $dmsSource -Destination $tempDmsDir -Recurse -Force
    Write-Host "[OK] Archivos DMS copiados." -ForegroundColor Green
} else {
    Write-Host "[INFO] No hay archivos en el DMS todavia." -ForegroundColor Yellow
}

# 4. Empaquetar todo en un archivo ZIP de alta compresion
Write-Host "-> Empaquetando en ZIP: Backup_Archivite_$fecha.zip..." -ForegroundColor Yellow
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force

# 5. Limpieza de archivos temporales
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "=== ¡Proceso de Respaldo Completado con Éxito! ===" -ForegroundColor Green
Write-Host "Backup guardado en: $zipPath" -ForegroundColor Cyan
