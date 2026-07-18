@echo off
title GAMA SEGURIDAD - Despliegue Automatico de Camara
cd /d "%~dp0"

:: 1. Limpieza de procesos y tareas previas para evitar bloqueos
echo Deteniendo procesos y tareas previas...
taskkill /f /im mediamtx.exe >nul 2>&1
taskkill /f /im cloudflared.exe >nul 2>&1
sc query "GamaStream" >nul 2>&1 && sc stop "GamaStream" >nul 2>&1 && sc delete "GamaStream" >nul 2>&1

:: 2. Verificar privilegios de Administrador (requerido para crear Tareas Programadas de segundo plano)
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ERROR: Debe ejecutar este script como ADMINISTRADOR.
    echo Haga clic derecho sobre este archivo y seleccione "Ejecutar como administrador".
    echo.
    pause
    exit /b 1
)

:: 3. Verificar si Node.js está disponible
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Node.js no esta instalado en este sistema.
    echo Instale Node.js antes de continuar.
    echo.
    pause
    exit /b 1
)

:: 4. Lanzar el instalador unificado automático
node "..\dashboard\auto_deploy.js"

echo.
echo Presione cualquier tecla para finalizar...
pause >nul
