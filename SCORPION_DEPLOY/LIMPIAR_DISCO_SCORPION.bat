@echo off
title LIMPIEZA DE DISCO Y LOGS - GAMA SECURITY
color 0A
echo =======================================================================
echo   GAMA SECURITY — LIMPIEZA AUTOMATICA DE DISCO Y LOGS
echo =======================================================================
echo.

echo [1/4] Eliminando archivos de registros acumulados (.txt / .log)...
del /q /f "C:\SCORPION\BASES DE DATOS\_gama_log.txt" >nul 2>&1
del /q /f "C:\SCORPION\BASES DE DATOS\_watchdog_log.txt" >nul 2>&1
del /q /f "C:\SCORPION\BASES DE DATOS\SCORPION_DEPLOY\_gama_log.txt" >nul 2>&1
del /q /f "C:\SCORPION\BASES DE DATOS\SCORPION_DEPLOY\_watchdog_log.txt" >nul 2>&1
del /q /f "C:\SCORPION\BASES DE DATOS\_EVENTOS_TEMP.MDB" >nul 2>&1
del /q /f "C:\SCORPION\BASES DE DATOS\_sincronizador_cache.json" >nul 2>&1

echo [2/4] Limpiando temporales aislados en Windows Temp...
rmdir /s /q "%TEMP%\gama_sincronizador" >nul 2>&1
mkdir "%TEMP%\gama_sincronizador" >nul 2>&1

echo [3/4] Vaciando papelera y temporales de usuario...
del /q /f /s "%TEMP%\*.tmp" >nul 2>&1
del /q /f /s "%TEMP%\*.log" >nul 2>&1

echo [4/4] Limpieza completada exitosamente.
echo.
echo =======================================================================
echo   ✓ ESPACIO EN DISCO RECUPERADO
echo =======================================================================
echo.
pause
