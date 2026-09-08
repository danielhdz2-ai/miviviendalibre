#!/usr/bin/env pwsh
# Script para generar lista de URLs prioritarias para GSC

Write-Host "`n🎯 Generando URLs Prioritarias para Google Search Console..." -ForegroundColor Cyan

# Cargar variables de entorno
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^NEXT_PUBLIC_SUPABASE_URL=(.+)$') {
        $env:SUPABASE_URL = $matches[1]
    }
    if ($_ -match '^SUPABASE_SERVICE_ROLE_KEY=(.+)$') {
        $env:SUPABASE_SERVICE_ROLE_KEY = $matches[1]
    }
}

Write-Host "✓ Variables de entorno cargadas" -ForegroundColor Green
Write-Host "✓ Generando lista de URLs..." -ForegroundColor Green

# Ejecutar script
npx tsx scripts/seo/generate-priority-urls-gsc.mts

Write-Host "`n✅ Lista generada en scripts/seo/exports/urls-prioritarias.txt" -ForegroundColor Green
Write-Host "`nAbre el archivo con: notepad scripts\seo\exports\urls-prioritarias.txt" -ForegroundColor Yellow
