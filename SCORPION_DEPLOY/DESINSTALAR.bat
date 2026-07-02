@echo off
title GAMA - Desinstalador
color 0C

echo.
echo =====================================================
echo   GAMA COMMAND CENTER - Desinstalador
echo =====================================================
echo.
echo Deteniendo y eliminando tarea programada...

schtasks /end /tn "GAMA_Sincronizador" >nul 2>&1
schtasks /delete /tn "GAMA_Sincronizador" /f >nul 2>&1
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "GAMA_Sincronizador" /f >nul 2>&1

echo.
echo Deteniendo proceso pythonw.exe...
taskkill /f /im pythonw.exe >nul 2>&1

echo.
echo =====================================================
echo   Servicio GAMA desinstalado correctamente.
echo =====================================================
echo.
pause
