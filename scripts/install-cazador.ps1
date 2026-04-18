# ============================================================
# Inmonest — Bot Cazador (Milanuncios Particulares)
# Instalar tarea programada — ejecutar UNA VEZ como Administrador:
#   Click derecho → "Ejecutar con PowerShell (como administrador)"
# ============================================================

$scriptDir = "C:\Users\Daniel HDZ\Desktop\miviviendalibre\miviviendalibre"
$batPath   = "$scriptDir\scripts\run-cazador.bat"

# ── Crear el .bat si no existe ────────────────────────────────────────────────
if (-not (Test-Path $batPath)) {
    $batContent = @"
@echo off
cd /d C:\Users\Daniel HDZ\Desktop\miviviendalibre\miviviendalibre
echo [%DATE% %TIME%] Iniciando Bot Cazador...
npx tsx scripts\scrapers\milanuncios-cazador.ts >> logs\cazador.log 2>&1
echo [%DATE% %TIME%] Bot Cazador finalizado.
"@
    Set-Content -Path $batPath -Value $batContent -Encoding UTF8
    Write-Host "  📄 Creado: $batPath" -ForegroundColor Cyan
}

# ── Registrar la tarea ────────────────────────────────────────────────────────
$action   = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$batPath`""
$trigger  = New-ScheduledTaskTrigger -Daily -At "08:30AM"
$settings = New-ScheduledTaskSettingsSet `
  -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
  -RestartCount 2 `
  -RestartInterval (New-TimeSpan -Minutes 15) `
  -StartWhenAvailable

Register-ScheduledTask `
  -TaskName    "Inmonest-BotCazador" `
  -Action      $action `
  -Trigger     $trigger `
  -Settings    $settings `
  -Description "Bot Cazador — 5 particulares nuevos diarios (Milanuncios)" `
  -RunLevel    Highest `
  -Force

Write-Host ""
Write-Host "✅ Tarea 'Inmonest-BotCazador' registrada!" -ForegroundColor Green
Write-Host "   Ejecucion diaria a las 08:30 AM"
Write-Host "   Logs en: $scriptDir\logs\cazador.log"
Write-Host "   Estado en: $scriptDir\logs\cazador-state.json"
Write-Host ""
Write-Host "Para ejecutar manualmente ahora mismo:" -ForegroundColor Yellow
Write-Host "   npx tsx scripts\scrapers\milanuncios-cazador.ts --dry-run"
Write-Host "   (quita --dry-run para ejecucion real)"
Write-Host ""

Read-Host "Pulsa Enter para cerrar"
