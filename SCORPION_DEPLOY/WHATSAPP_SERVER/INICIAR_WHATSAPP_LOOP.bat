@echo off
title GAMA SEGURIDAD - WHATSAPP SERVER 24/7
color 0A
cls

cd /d "%~dp0"

:loop
echo =======================================================
echo    GAMA SEGURIDAD - WhatsApp v4.0
echo =======================================================
echo.

node whatsapp_server.js

echo.
echo [WHATSAPP SERVER] Reiniciando en 3 segundos...
timeout /t 3 /nobreak >nul
goto loop
