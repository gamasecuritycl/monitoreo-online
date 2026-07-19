@echo off
title GAMA SEGURIDAD - Instalando WhatsApp Server v3.0
color 0A
cls

:: ── NAVEGAR A LA CARPETA DEL SCRIPT (CRÍTICO) ──────────────────────────
cd /d "%~dp0"
echo  Carpeta de trabajo: %CD%
echo ============================================================
echo    GAMA SEGURIDAD - WhatsApp Server v3.0 (Baileys)
echo    INSTALACION DE DEPENDENCIAS
echo ============================================================
echo.
echo  Eliminando node_modules anteriores si existen...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f /q package-lock.json

echo.
echo  Instalando dependencias con npm (puede tardar 2-3 minutos)...
echo.
call npm install

echo.
if %errorlevel%==0 (
  color 0A
  echo ============================================================
  echo   INSTALACION COMPLETADA EXITOSAMENTE
  echo.
  echo   Siguiente paso: Ejecuta INICIAR_WHATSAPP.bat
  echo   para conectar tu WhatsApp corporativo.
  echo ============================================================
) else (
  color 0C
  echo ============================================================
  echo   ERROR EN LA INSTALACION
  echo   Verifica que Node.js este instalado:
  echo   https://nodejs.org/ (version LTS)
  echo ============================================================
)
echo.
pause
