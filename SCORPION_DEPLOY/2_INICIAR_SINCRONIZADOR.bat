@echo off
title GAMA - Reiniciar Sincronizador Silencioso
color 0A
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

echo ========================================================
echo   GAMA COMMAND CENTER - Solucion Reinicio Silencioso
echo ========================================================
echo.

:: 1. Detener y eliminar Tarea Programada
echo 1. Deteniendo y eliminando Tareas Programadas antiguas...
schtasks /end /tn "GAMA_Sincronizador" >nul 2>&1
schtasks /delete /tn "GAMA_Sincronizador" /f >nul 2>&1
echo   OK.
echo.

:: 2. Matar procesos colgados de forma forzada
echo 2. Matando procesos de Python y WScript colgados...
taskkill /f /im pythonw.exe /t >nul 2>&1
taskkill /f /im python.exe /t >nul 2>&1
taskkill /f /im wscript.exe /t >nul 2>&1
echo   Procesos limpiados.
echo.

:: 3. Determinar la ruta de pythonw.exe
echo 3. Buscando instalacion de Python...
set PYTHONW=
if exist "%LOCALAPPDATA%\Programs\Python\Python313\pythonw.exe" set PYTHONW="%LOCALAPPDATA%\Programs\Python\Python313\pythonw.exe"
if not defined PYTHONW if exist "%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe" set PYTHONW="%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe"
if not defined PYTHONW if exist "%LOCALAPPDATA%\Programs\Python\Python311\pythonw.exe" set PYTHONW="%LOCALAPPDATA%\Programs\Python\Python311\pythonw.exe"
if not defined PYTHONW if exist "C:\Python313\pythonw.exe" set PYTHONW="C:\Python313\pythonw.exe"
if not defined PYTHONW if exist "C:\Python312\pythonw.exe" set PYTHONW="C:\Python312\pythonw.exe"
if not defined PYTHONW set PYTHONW=pythonw.exe

echo   Usando: %PYTHONW%
echo.

:: 4. Arrancar en segundo plano de forma silenciosa
echo 4. Iniciando sincronizador de eventos...
start "" %PYTHONW% "%~dp0sincronizador.py"

:: Esperar 3 segundos para que el script arranque y verifique el Mutex
timeout /t 3 /nobreak >nul

:: Verificar si el proceso pythonw.exe esta corriendo en el Tasklist
tasklist /nh /fi "imagename eq pythonw.exe" | findstr /i "pythonw.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   [OK] Sincronizador iniciado y ejecutandose en segundo plano.
    echo   Esta ventana se cerrara en 5 segundos.
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   [ERROR] El sincronizador no se pudo mantener activo.
    echo   Verifica el log en: _gama_log.txt
    echo ========================================================
    pause
)

timeout /t 5 >nul
exit
