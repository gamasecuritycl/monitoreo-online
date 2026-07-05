@echo off
title GAMA - Mata y Arranca Sincronizador
color 0E
echo.
echo ========================================================
echo   GAMA COMMAND CENTER - Solucion Final Force Kill
echo ========================================================
echo.
echo 1. Cerrando todos los procesos de Python (Forzado)...
taskkill /f /im pythonw.exe /t
taskkill /f /im python.exe /t
taskkill /f /im wscript.exe /t
echo.
echo 2. Iniciando sincronizador de eventos de forma MANUAL (Interactiva)...
echo (Esta ventana debe quedar ABIERTA para ver el progreso)
echo ========================================================
echo.
cd /d "C:\SCORPION\BASES DE DATOS"
python sincronizador.py
pause
