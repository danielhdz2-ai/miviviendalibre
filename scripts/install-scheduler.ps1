# ============================================================
# Inmonest — Instalar tarea programada
# Ejecutar UNA VEZ como Administrador:
# Click derecho en este .ps1 → "Ejecutar con PowerShell (como administrador)"
# ============================================================

$batPath = "C:\Users\Daniel HDZ\Desktop\miviviendalibre\miviviendalibre\scripts\run-seed.bat"

$action   = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$batPath`""
$trigger  = New-ScheduledTaskTrigger -Daily -At "03:00AM"
$settings = New-ScheduledTaskSettingsSet `
  -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
  -RestartCount 2 `
  -RestartInterval (New-TimeSpan -Minutes 10) `
  -StartWhenAvailable

Register-ScheduledTask `
  -TaskName    "Inmonest-SeedContent" `
  -Action      $action `
  -Trigger     $trigger `
  -Settings    $settings `
  -Description "Genera contenido diario para Inmonest — 3AM" `
  -RunLevel    Highest `
  -Force

Write-Host ""
Write-Host "✅ Tarea registrada correctamente!" -ForegroundColor Green
Write-Host "   Se ejecutará cada día a las 3:00 AM"
Write-Host "   Los logs quedan en: C:\Users\Daniel HDZ\Desktop\miviviendalibre\miviviendalibre\logs\seed-content.log"
Write-Host ""
Write-Host "⚠️  RECUERDA: Abre scripts\run-seed.bat y pon tu SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
Write-Host "   Encuéntrala en: https://supabase.com/dashboard/project/ktsdxpmaljiyuwimcugx/settings/api"

Read-Host "Pulsa Enter para cerrar"
