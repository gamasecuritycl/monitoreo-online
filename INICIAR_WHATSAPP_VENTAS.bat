@echo off
title GAMA SEGURIDAD - WHATSAPP VENTAS PUERTO 3016
color 0B
echo ========================================================
echo   GAMA SEGURIDAD - WHATSAPP COMERCIAL & META ADS (v1.0)
echo   Puerto: 3016 (Independiente del Command Center 3015)
echo ========================================================
cd /d "%~dp0SCORPION_DEPLOY\WHATSAPP_SERVER"
node whatsapp_ventas_server.js
pause
