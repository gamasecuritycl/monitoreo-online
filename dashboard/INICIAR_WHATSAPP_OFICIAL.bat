@echo off
title GAMA SEGURIDAD - WHATSAPP OFICIAL CENTRAL
color 0A
cls
echo =======================================================
echo    GAMA SEGURIDAD - WHATSAPP OFICIAL SERVER v1.0
echo =======================================================
echo.
echo  Iniciando servidor de WhatsApp corporativo en puerto 3015...
echo  Escuchando peticiones en tiempo real via Supabase Realtime...
echo.

cd /d "%~dp0"

if not exist node_modules\@open-wa\wa-automate (
  echo  Instalando paquete @open-wa/wa-automate y express...
  call npm install @open-wa/wa-automate express @supabase/supabase-js --save
)

node whatsapp_server.js
pause
