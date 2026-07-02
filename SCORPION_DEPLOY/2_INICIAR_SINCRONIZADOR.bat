@echo off
title GAMA COMMAND CENTER - Sincronizador ACTIVO
color 0A
echo.
echo =====================================================
echo   GAMA COMMAND CENTER - Sincronizador v2.0
echo   Conectando con Supabase...
echo   NO CERRAR ESTA VENTANA
echo =====================================================
echo.
cd /d %~dp0
python sincronizador.py
echo.
echo [DETENIDO] El sincronizador se ha detenido.
pause
