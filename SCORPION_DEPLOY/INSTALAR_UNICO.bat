@echo off
title GAMA COMMAND CENTER - INSTALADOR UNICO v5.4
color 0A
setlocal enabledelayedexpansion

set DESTINO=C:\SCORPION\BASES DE DATOS
set TAREA=GAMA_Sincronizador
set GH_USER=gamasecuritycl
set GH_REPO=monitoreo-online
set GH_BRANCH=main
set GH_PATH=SCORPION_DEPLOY/sincronizador.py
set GH_RAW=https://raw.githubusercontent.com/%GH_USER%/%GH_REPO%/%GH_BRANCH%/%GH_PATH%
set BAT_URL=https://raw.githubusercontent.com/%GH_USER%/%GH_REPO%/%GH_BRANCH%/SCORPION_DEPLOY/INSTALAR_COMPLETO.bat

echo.
echo ============================================================
echo   GAMA COMMAND CENTER - INSTALADOR UNICO v5.4
echo   (Ejecutar como Administrador - UNA SOLA VEZ)
echo ============================================================
echo.

:: ---- Verificar Administrador ----
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Debes ejecutar como Administrador.
    echo Haz clic derecho ^> "Ejecutar como Administrador".
    pause
    exit /b 1
)

:: ---- 1. Verificar Python ----
echo [1/6] Verificando Python...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python no instalado. Descarga desde python.org
    echo IMPORTANTE: Marca "Add Python to PATH"
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo   %%v
echo   OK.

:: ---- 2. Instalar dependencias ----
echo.
echo [2/6] Instalando dependencias...
pip install supabase pyodbc requests --quiet
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo instalacion de dependencias.
    pause
    exit /b 1
)
echo   OK.

:: ---- 3. MATAR TODO proceso viejo ----
echo.
echo [3/6] Matando procesos anteriores...
taskkill /f /im pythonw.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im wscript.exe >nul 2>&1
echo   - pythonw.exe, python.exe, wscript.exe eliminados.
timeout /t 3 /nobreak >nul

:: ---- 4. Crear directorio destino ----
if not exist "%DESTINO%" mkdir "%DESTINO%"

:: ---- 5. DESCARGAR sincronizador.py SIEMPRE (forzando sin cache) ----
echo.
echo [4/6] Descargando sincronizador.py desde GitHub (sin cache)...
powershell -Command "[System.Net.ServicePointManager]::SecurityProtocol = 'Tls12'; (New-Object System.Net.WebClient).DownloadFile('%GH_RAW%?t=%RANDOM%', '%DESTINO%\sincronizador.py')"
if not exist "%DESTINO%\sincronizador.py" (
    echo [ERROR] No se pudo descargar sincronizador.py
    echo Verifica conexion a internet y que el repo es accesible.
    pause
    exit /b 1
)
echo   OK - descargado: %DESTINO%\sincronizador.py

:: ---- 6. LIMPIAR archivos obsoletos ----
echo.
echo [5/6] Limpiando archivos viejos...
if exist "%DESTINO%\_sincronizador.lock" del /F "%DESTINO%\_sincronizador.lock" >nul 2>&1
if exist "%DESTINO%\_sincronizador_cache.json" del /F "%DESTINO%\_sincronizador_cache.json" >nul 2>&1
if exist "%DESTINO%\_sincronizador_cursor.txt" del /F "%DESTINO%\_sincronizador_cursor.txt" >nul 2>&1
if exist "%DESTINO%\_sincronizador_cursors.json" del /F "%DESTINO%\_sincronizador_cursors.json" >nul 2>&1
if exist "%DESTINO%\iniciar_silencioso.vbs" del /F "%DESTINO%\iniciar_silencioso.vbs" >nul 2>&1
if exist "%DESTINO%\sincronizador.py.bak" del /F "%DESTINO%\sincronizador.py.bak" >nul 2>&1
if exist "%DESTINO%\_gama_log.txt" del /F "%DESTINO%\_gama_log.txt" >nul 2>&1
echo   OK - log fresco, cursors limpios.

:: ---- 7. Registrar Tarea Programada NUCLEAR ----
echo.
echo [6/6] Registrando servicio perpetuo en Task Scheduler...
schtasks /delete /tn "%TAREA%" /f >nul 2>&1

set PYTHONW=
if exist "%LOCALAPPDATA%\Programs\Python\Python313\pythonw.exe" set PYTHONW=%LOCALAPPDATA%\Programs\Python\Python313\pythonw.exe
if not defined PYTHONW if exist "%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe" set PYTHONW=%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe
if not defined PYTHONW if exist "%LOCALAPPDATA%\Programs\Python\Python311\pythonw.exe" set PYTHONW=%LOCALAPPDATA%\Programs\Python\Python311\pythonw.exe
if not defined PYTHONW if exist "C:\Python313\pythonw.exe" set PYTHONW=C:\Python313\pythonw.exe
if not defined PYTHONW if exist "C:\Python312\pythonw.exe" set PYTHONW=C:\Python312\pythonw.exe
if not defined PYTHONW set PYTHONW=pythonw.exe

echo   Usando: %PYTHONW%

set PS_SCRIPT=%TEMP%\gama_crear_tarea.ps1

> "%PS_SCRIPT%" echo $action = New-ScheduledTaskAction -Execute '%PYTHONW%' -Argument '"%DESTINO%\sincronizador.py"' -WorkingDirectory '%DESTINO%'
>> "%PS_SCRIPT%" echo $trigger1 = New-ScheduledTaskTrigger -AtStartup -RandomDelay "00:00:10"
>> "%PS_SCRIPT%" echo $trigger2 = New-ScheduledTaskTrigger -AtLogOn -RandomDelay "00:00:05"
>> "%PS_SCRIPT%" echo $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 9999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit 0 -MultipleInstances IgnoreNew
>> "%PS_SCRIPT%" echo Register-ScheduledTask -TaskName "%TAREA%" -Action $action -Trigger $trigger1,$trigger2 -Settings $settings -RunLevel Highest -Force ^| Out-Null
>> "%PS_SCRIPT%" echo Write-Host "OK."

powershell -ExecutionPolicy Bypass -File "%PS_SCRIPT%"
del /F "%PS_SCRIPT%" >nul 2>&1
echo   OK.

:: ---- 8. Iniciar AHORA ----
echo.
echo Arrancando sincronizador en segundo plano...
timeout /t 3 /nobreak >nul 2>&1
schtasks /run /tn "%TAREA%"
if %ERRORLEVEL% EQU 0 ( echo   OK. ) else ( echo   [AVISO] Arrancara al boot/logon. )

echo.
echo ============================================================
echo   INSTALACION COMPLETADA - GAMA SYNC v5.4
echo ============================================================
echo.
echo Resumen:
echo   - Watchdog: reinicio forzado si no hay heartbeat en 5 min
echo   - Timeout MDB: 120s max por archivo
echo.
echo Verificacion:
echo   - Task Manager ^> pythonw.exe debe estar corriendo
echo   - Dashboard: indicador SINCRONIZADOR = VERDE
echo   - Log: %DESTINO%\_gama_log.txt
echo ============================================================
echo.
pause