@echo off
title GAMA - Diagnostico de Inicio
color 0E
setlocal enabledelayedexpansion

:: ---- Auto-Elevacion a Administrador (UAC) ----
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
    if exist "%temp%\getadmin.vbs" ( del "%temp%\getadmin.vbs" )
    pushd "%CD%"
    CD /D "%~dp0"

set LOG_FILE=%~dp0_start_log.txt

echo ======================================================== > "%LOG_FILE%"
echo   GAMA COMMAND CENTER - LOG DE DEPURACION DE INICIO     >> "%LOG_FILE%"
echo   Fecha/Hora: %DATE% %TIME%                             >> "%LOG_FILE%"
echo ======================================================== >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

echo 1. Deteniendo y eliminando Tareas Programadas... >> "%LOG_FILE%"
schtasks /end /tn "GAMA_Sincronizador" >> "%LOG_FILE%" 2>&1
schtasks /delete /tn "GAMA_Sincronizador" /f >> "%LOG_FILE%" 2>&1

echo 2. Matando procesos de Python... >> "%LOG_FILE%"
taskkill /f /im pythonw.exe /t >> "%LOG_FILE%" 2>&1
taskkill /f /im python.exe /t >> "%LOG_FILE%" 2>&1
taskkill /f /im wscript.exe /t >> "%LOG_FILE%" 2>&1

echo 3. Buscando Pythonw... >> "%LOG_FILE%"
set PYTHONW=
if exist "%LOCALAPPDATA%\Programs\Python\Python313\pythonw.exe" set PYTHONW=%LOCALAPPDATA%\Programs\Python\Python313\pythonw.exe
if not defined PYTHONW if exist "%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe" set PYTHONW=%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe
if not defined PYTHONW if exist "%LOCALAPPDATA%\Programs\Python\Python311\pythonw.exe" set PYTHONW=%LOCALAPPDATA%\Programs\Python\Python311\pythonw.exe
if not defined PYTHONW if exist "C:\Python313\pythonw.exe" set PYTHONW=C:\Python313\pythonw.exe
if not defined PYTHONW if exist "C:\Python312\pythonw.exe" set PYTHONW=C:\Python312\pythonw.exe

if not defined PYTHONW (
    for /f "tokens=*" %%i in ('where pythonw 2^>nul') do (
        set PYTHONW=%%i
        goto found_path
    )
)
:found_path
if not defined PYTHONW set PYTHONW=pythonw.exe

echo   Pythonw ruta: !PYTHONW! >> "%LOG_FILE%"

echo 4. Iniciando de forma silenciosa... >> "%LOG_FILE%"
start "" "!PYTHONW!" "sincronizador.py"
echo   Exit code del start: %ERRORLEVEL% >> "%LOG_FILE%"
echo ======================================================== >> "%LOG_FILE%"
exit
