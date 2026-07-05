@echo off
title GAMA - Reiniciar Sincronizador Silencioso
color 0A
setlocal enabledelayedexpansion

:: ---- Auto-Elevacion a Administrador (UAC) ----
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo Solicitando permisos de administrador...
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

echo ========================================================
echo   GAMA COMMAND CENTER - Solucion Reinicio Silencioso
echo ========================================================
echo.

:: 1. Detener y eliminar Tarea Programada (por si acaso estuviera corriendo)
echo 1. Deteniendo y eliminando Tareas Programadas antiguas...
schtasks /end /tn "GAMA_Sincronizador" >nul 2>&1
schtasks /delete /tn "GAMA_Sincronizador" /f >nul 2>&1
echo   OK.
echo.

:: 2. Matar procesos colgados de forma forzada
echo 2. Matando procesos de Python y WScript colgados...
taskkill /f /im pythonw.exe /t
taskkill /f /im python.exe /t
taskkill /f /im wscript.exe /t
echo.

:: 3. Determinar la ruta de pythonw.exe
echo 3. Buscando instalacion de Python...
set PYTHONW=
if exist "%LOCALAPPDATA%\Programs\Python\Python313\pythonw.exe" set PYTHONW=%LOCALAPPDATA%\Programs\Python\Python313\pythonw.exe
if not defined PYTHONW if exist "%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe" set PYTHONW=%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe
if not defined PYTHONW if exist "%LOCALAPPDATA%\Programs\Python\Python311\pythonw.exe" set PYTHONW=%LOCALAPPDATA%\Programs\Python\Python311\pythonw.exe
if not defined PYTHONW if exist "C:\Python313\pythonw.exe" set PYTHONW=C:\Python313\pythonw.exe
if not defined PYTHONW if exist "C:\Python312\pythonw.exe" set PYTHONW=C:\Python312\pythonw.exe

:: Si no se encuentra en las rutas comunes, usar where
if not defined PYTHONW (
    for /f "tokens=*" %%i in ('where pythonw 2^nul') do (
        set PYTHONW=%%i
        goto found_path
    )
)
:found_path

if not defined PYTHONW set PYTHONW=pythonw.exe

echo   Pythonw detectado en: !PYTHONW!
echo.

:: 4. Arrancar en segundo plano de forma silenciosa
echo 4. Iniciando sincronizador de eventos de forma SILENCIOSA...
start "" "!PYTHONW!" "sincronizador.py"
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   Sincronizador iniciado correctamente en segundo plano.
    echo   Esta ventana se cerrara en 5 segundos.
    echo ========================================================
) else (
    echo [ERROR] Fallo al iniciar el sincronizador.
    pause
)

timeout /t 5 >nul
exit
