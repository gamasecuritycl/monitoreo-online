@echo off
title GAMA SEGURIDAD - Vincular Camara IP a Abonado
cd /d "%~dp0"

:: Verificar si Node.js está disponible
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado en este sistema.
    echo Instale Node.js para poder ejecutar esta herramienta.
    pause
    exit /b 1
)

:: Ejecutar el script interactivo de vinculación
node "..\dashboard\vincular_camara.js"
pause
