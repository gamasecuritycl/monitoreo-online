@echo off
title GAMA SEGURIDAD - Despliegue Automatico de Camara
cd /d "%~dp0"

:: 1. Limpieza de procesos previos locales para evitar bloqueos
echo Deteniendo procesos previos...
taskkill /f /im mediamtx.exe >nul 2>&1
taskkill /f /im cloudflared.exe >nul 2>&1

:: 2. Verificar si Node.js está disponible
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Node.js no esta instalado en este sistema.
    echo Instale Node.js antes de continuar.
    echo.
    pause
    exit /b 1
)

:: 3. Lanzar el instalador unificado automático
node "..\dashboard\auto_deploy.js"

exit /b 0
