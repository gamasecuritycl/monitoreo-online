@echo off
title GAMA SEGURIDAD - Apagar WhatsApp Local de Forma Segura
color 0C
cls
cd /d "%~dp0"

echo =======================================================
echo    APAGANDO WHATSAPP CORE LOCAL SIN INTERFERENCIAS
echo =======================================================
echo.

:: 1. Detener el bucle infinito INICIAR_WHATSAPP_LOOP.bat si esta corriendo
echo [*] Deteniendo bucles de consola cmd.exe asociados a WhatsApp...
wmic process where "CommandLine like '%%INICIAR_WHATSAPP_LOOP.bat%%'" call terminate >nul 2>&1
wmic process where "CommandLine like '%%1_PROBAR_LOGS.bat%%'" call terminate >nul 2>&1

:: 2. Buscar exactamente qué Node.js está escuchando en el puerto 3015 y cerrarlo
echo [*] Buscando proceso Node.js en puerto 3015...
set "foundPID="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3015') do (
    set "foundPID=%%a"
)

if defined foundPID (
    echo [!] Encontrado proceso con PID %foundPID% en puerto 3015.
    echo [*] Finalizando proceso Node de WhatsApp de forma segura...
    taskkill /f /pid %foundPID% >nul 2>&1
    echo [OK] WhatsApp local apagado correctamente.
) else (
    echo [OK] No se detecto ningun proceso de WhatsApp corriendo en el puerto 3015.
)

echo.
echo Operacion completada. La ventana se cerrara sola en 3 segundos...
timeout /t 3 >nul
exit
