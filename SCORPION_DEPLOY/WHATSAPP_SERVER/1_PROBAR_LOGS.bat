@echo off
title GAMA SEGURIDAD - Probador de Arranque WhatsApp Server
color 0B
cls
cd /d "%~dp0"

echo =======================================================
echo    GAMA SEGURIDAD - PROBADOR DE CONEXION WHATSAPP
echo =======================================================
echo.
echo  Intentando ejecutar el servidor por 10 segundos...
echo  (Cualquier error se guardara en error_arranque.txt)
echo.

node whatsapp_server.js 2> error_arranque.txt

echo.
echo  Proceso finalizado. 
echo  Si habia un error, se guardo en 'error_arranque.txt'.
echo.
if exist error_arranque.txt (
  echo  --- CONTENIDO DE ERROR ---
  type error_arranque.txt
  echo  --------------------------
) else (
  echo  [OK] No se reportaron errores de arranque inmediatos.
)
echo.
pause
