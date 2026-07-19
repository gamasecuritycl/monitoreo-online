@echo off
title GAMA SEGURIDAD - WHATSAPP CORPORATIVO 24/7
color 0A
cls
echo =======================================================
echo    GAMA SEGURIDAD - WHATSAPP CORPORATIVO SERVER v2.0
echo              SERVIDOR 24/7 EN SCORPION
echo =======================================================
echo.

cd /d "%~dp0"

echo  Liberando puerto 3015 si hubiese instancias anteriores...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3015') do taskkill /f /pid %%a 2>nul

echo  Iniciando servidor de WhatsApp corporativo en puerto 3015...
echo  Escuchando peticiones en tiempo real via Supabase Realtime...
echo.
echo  IMPORTANTE: La primera vez tendras que escanear el QR
echo  con el WhatsApp corporativo de Gama Seguridad.
echo  Despues de eso, la sesion se mantiene guardada.
echo.

node whatsapp_server.js

echo.
echo =======================================================
echo  El servidor ha finalizado. Presione una tecla para cerrar.
echo =======================================================
pause
