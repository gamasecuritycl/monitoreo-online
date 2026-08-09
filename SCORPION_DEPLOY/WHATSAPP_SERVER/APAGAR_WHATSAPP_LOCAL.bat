@echo off
title GAMA SEGURIDAD - Apagar WhatsApp Local (Neonize)
color 0C
cls
cd /d "%~dp0"

echo =======================================================
echo    APAGANDO WHATSAPP v4.0 Neonize
echo =======================================================
echo.

:: 1. Detener bucles de consola
echo [*] Deteniendo bucles de consola...
wmic process where "CommandLine like '%%INICIAR_WHATSAPP%%'" call terminate >nul 2>&1

:: 2. Detener Neonize (Python - puerto 3016)
echo [*] Deteniendo Neonize service (puerto 3016)...
set "foundPID="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3016') do (
    set "foundPID=%%a"
)
if defined foundPID (
    echo [!] Encontrado Neonize PID %foundPID%
    taskkill /f /pid %foundPID% >nul 2>&1
)

:: 3. Detener Node.js (puerto 3015)
echo [*] Deteniendo Node.js server (puerto 3015)...
set "foundPID="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3015') do (
    set "foundPID=%%a"
)
if defined foundPID (
    echo [!] Encontrado Node.js PID %foundPID%
    taskkill /f /pid %foundPID% >nul 2>&1
)

:: 4. Matar procesos python de Neonize
echo [*] Limpiando procesos Python residuales...
taskkill /f /im python.exe /fi "WINDOWTITLE eq Neonize*" >nul 2>&1

echo.
echo [OK] WhatsApp v4.0 Neonize apagado correctamente.
echo Operacion completada. Cerrando en 3 segundos...
timeout /t 3 >nul
exit
