@echo off
title GAMA SEGURIDAD - WHATSAPP CORE SERVER LOOP 24/7
color 0A
cls

:: Navegar a la carpeta del script
cd /d "%~dp0"

:loop
echo =======================================================
echo    GAMA SEGURIDAD - WHATSAPP CORPORATIVO SERVER v3.0
echo            BUCLE DE AUTO-RECUPERACION ACTIVO
echo =======================================================
echo.
echo [%DATE% %TIME%] Levantando servidor en puerto 3015...

:: Forzar cierre de puertos ocupados previamente
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3015') do taskkill /f /pid %%a 2>nul

:: Lanzar el servidor de Node
node whatsapp_server.js

echo.
echo [%DATE% %TIME%] WARNING: El servidor de WhatsApp se detuvo o cayo!
echo Reiniciando de forma automatica en 5 segundos...
timeout /t 5 >nul
goto loop
