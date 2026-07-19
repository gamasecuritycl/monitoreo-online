@echo off
title GAMA SEGURIDAD - WHATSAPP OFICIAL CENTRAL
color 0A
cls
echo =======================================================
echo    GAMA SEGURIDAD - WHATSAPP OFICIAL SERVER v1.0
echo =======================================================
echo.

cd /d "%~dp0"

echo  Liberando puerto 3015 si hubiese instancias anteriores...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3015') do taskkill /f /pid %%a 2>nul

echo  Iniciando servidor de WhatsApp corporativo en puerto 3015...
echo  Escuchando peticiones en tiempo real via Supabase Realtime...
echo.

node whatsapp_server.js
echo.
echo =======================================================
echo  El servidor ha finalizado. Presione una tecla para cerrar.
echo =======================================================
pause
