# Automated Fail-Safe Deployment Script for Monitoreo Online
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "1. Compilando aplicación localmente (npm run build)..." -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

Set-Location -Path "$PSScriptRoot"
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: La compilación local falló. Abortando despliegue para evitar errores." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Compilación exitosa en local (0 errores)." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "2. Subiendo cambios a GitHub main..." -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

$env:GITHUB_TOKEN=$null
git add .
git commit -m "build: verified clean production release"
git push origin main

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "3. Desplegando en Vercel Producción..." -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

npx vercel --prod --yes

Write-Host "🎉 Despliegue completado exitosamente y enlazado a controltestmonitoreo.vercel.app" -ForegroundColor Green
