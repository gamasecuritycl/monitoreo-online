@echo off
title GAMA SEGURIDAD - WHATSAPP CORPORATIVO 24/7
color 0A
cls
echo =======================================================
echo    GAMA SEGURIDAD - WHATSAPP v3.5 (Dedup + Retry)
echo              SERVIDOR 24/7 EN SCORPION
echo =======================================================
echo.

cd /d "%~dp0"

echo  Liberando puerto 3015...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3015') do taskkill /f /pid %%a 2>nul
timeout /t 2 /nobreak >nul

echo  Iniciando servidor WhatsApp v3.5...
echo.
echo  Mejoras:
echo    - Deduplicación de mensajes
echo    - Retry automático (3 intentos)
echo    - Confirmación de entrega (receipts)
echo    - Cola con recuperación
echo.

node whatsapp_server.js

echo.
echo =======================================================
echo  Servidor detenido. Presione una tecla para cerrar.
echo =======================================================
pause
