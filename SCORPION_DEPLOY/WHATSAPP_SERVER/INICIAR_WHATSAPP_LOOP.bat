@echo off
title GAMA SEGURIDAD - WHATSAPP LOOP 24/7
color 0A
cls

cd /d "%~dp0"

:loop
echo =======================================================
echo    GAMA SEGURIDAD - WhatsApp v3.5 LOOP
echo            AUTO-RECUPERACION
echo =======================================================
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3015') do taskkill /f /pid %%a 2>nul
timeout /t 2 /nobreak >nul

node whatsapp_server.js

echo [%DATE% %TIME%] Servidor detenido. Reiniciando en 5s...
timeout /t 5 >nul
goto loop
