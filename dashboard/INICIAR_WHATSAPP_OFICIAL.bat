@echo off
title GAMA SEGURIDAD - WHATSAPP OFICIAL CENTRAL
color 0A
cls
echo =======================================================
echo    GAMA SEGURIDAD - WHATSAPP OFICIAL SERVER v1.0
echo =======================================================
echo.
echo  Verificando paquetes...

cd /d "%~dp0"

if not exist node_modules\express (
  echo  Instalando dependencias necesarias (express, supabase-js)...
  call npm install express @supabase/supabase-js @open-wa/wa-automate --save
)

echo  Iniciando servidor de WhatsApp corporativo en puerto 3015...
echo  Escuchando peticiones en tiempo real via Supabase Realtime...
echo.

node whatsapp_server.js
pause
