@echo off
title DIAGNOSTICO - Gama Seguridad
echo ============================================
echo  DIAGNOSTICO RAPIDO - SINCRONIZADOR
echo ============================================
echo.
echo 1. Procesos pythonw.exe:
wmic process where "name='pythonw.exe'" get ProcessId,CommandLine 2>nul | findstr "sincronizador"
echo.
echo 2. Archivos sincronizador.py en C::
dir /s /b C:\sincronizador.py 2>nul
echo.
echo 3. Locks existentes:
dir /s /b C:\_gama_sincronizador.lock 2>nul
dir /s /b C:\_sincronizador.lock 2>nul
if exist "%TEMP%\_gama_sincronizador.lock" echo LOCK GLOBAL: %TEMP%\_gama_sincronizador.lock
echo.
echo 4. Log del sincronizador (ultimas 5 lineas):
set "LOG="
for /f "delims=" %%f in ('dir /s /b C:\_gama_log.txt 2^>nul') do set "LOG=%%f"
if defined LOG (
    echo Archivo: %LOG%
    for /f "usebackq delims=" %%l in ("%LOG%") do set "LAST=%%l"
    echo Ultima linea: %LAST%
) else (
    echo No se encontro _gama_log.txt
)
echo.
echo 5. Hora del PC Scorpion:
time /t
date /t
echo.
echo ============================================
pause
