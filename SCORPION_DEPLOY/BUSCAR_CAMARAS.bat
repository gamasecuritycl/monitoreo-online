@echo off
title GAMA SEGURIDAD - Buscador de Camaras IP
cd /d "%~dp0"

:: Validar si el script .ps1 existe
if not exist "BUSCAR_CAMARAS.ps1" (
    echo ERROR: No se encuentra BUSCAR_CAMARAS.ps1 en este directorio.
    pause
    exit /b 1
)

:: Ejecutar el script saltándose las políticas de ejecución de Windows
powershell -NoProfile -ExecutionPolicy Bypass -File "BUSCAR_CAMARAS.ps1"
