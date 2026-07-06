@echo off
title GAMA COMMAND CENTER - Instalacion Nuclear v5.3
color 0A
setlocal enabledelayedexpansion

set DESTINO=C:\SCORPION\BASES DE DATOS
set TAREA=GAMA_Sincronizador

echo.
echo ============================================================
echo   GAMA COMMAND CENTER - INSTALACION NUCLEAR v5.3
echo   (Ejecutar como Administrador - SOLO UNA VEZ)
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
echo [1/5] Verificando Python...
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
echo [2/5] Instalando dependencias...
pip install supabase pyodbc requests --quiet
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo instalacion de dependencias.
    pause
    exit /b 1
)
echo   OK.

:: ---- 3. MATAR TODO proceso viejo ----
echo.
echo [3/5] Matando procesos anteriores...
taskkill /f /im pythonw.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im wscript.exe >nul 2>&1
echo   - pythonw.exe, python.exe, wscript.exe eliminados.
:: Esperar a que Windows libere handles de archivos
timeout /t 3 /nobreak >nul

:: ---- Crear directorio destino ----
if not exist "%DESTINO%" mkdir "%DESTINO%"

:: ---- FORZAR reemplazo del archivo ---
echo   Copiando sincronizador.py...
if exist "%DESTINO%\sincronizador.py" (
    del /F /Q "%DESTINO%\sincronizador.py" >nul 2>&1
    timeout /t 1 /nobreak >nul
)
if exist "%~dp0sincronizador.py" (
    copy /Y "%~dp0sincronizador.py" "%DESTINO%\sincronizador.py"
    copy /Y "%~dp0sincronizador_diagnostico.py" "%DESTINO%\sincronizador_diagnostico.py"
    copy /Y "%~dp03_DIAGNOSTICO.bat" "%DESTINO%\3_DIAGNOSTICO.bat"
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Fallo la copia local.
        pause
        exit /b 1
    )
    echo   OK - copiado desde %~dp0
) else (
    echo   Sincronizador.py no encontrado localmente, descargando desde GitHub...
    powershell -Command "(New-Object System.Net.WebClient).DownloadFile('https://raw.githubusercontent.com/gamasecuritycl/monitoreo-online/main/SCORPION_DEPLOY/sincronizador.py', '%DESTINO%\sincronizador.py')"
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] No se pudo descargar. Verifica conexion a internet.
        pause
        exit /b 1
    )
    echo   OK - descargado desde GitHub.
)

:: ---- LIMPIAR archivos obsoletos ----
echo   Limpiando archivos de versiones anteriores...
if exist "%DESTINO%\_sincronizador.lock" del /F "%DESTINO%\_sincronizador.lock" >nul 2>&1 & echo     - _sincronizador.lock eliminado
if exist "%DESTINO%\_sincronizador_cache.json" del /F "%DESTINO%\_sincronizador_cache.json" >nul 2>&1 & echo     - _sincronizador_cache.json eliminado
if exist "%DESTINO%\_sincronizador_cursor.txt" del /F "%DESTINO%\_sincronizador_cursor.txt" >nul 2>&1 & echo     - _sincronizador_cursor.txt eliminado
if exist "%DESTINO%\iniciar_silencioso.vbs" del /F "%DESTINO%\iniciar_silencioso.vbs" >nul 2>&1 & echo     - iniciar_silencioso.vbs eliminado
if exist "%DESTINO%\sincronizador.py.bak" del /F "%DESTINO%\sincronizador.py.bak" >nul 2>&1
:: Limpiar log viejo para arrancar fresco
if exist "%DESTINO%\_gama_log.txt" (
    del /F "%DESTINO%\_gama_log.txt" >nul 2>&1
    echo     - _gama_log.txt eliminado (log fresco)
)
echo   OK.

:: ---- 4. Registrar Tarea Programada NUCLEAR vía PowerShell ----
echo.
echo [4/5] Registrando servicio perpetuo en Task Scheduler...

:: Eliminar tarea anterior
schtasks /delete /tn "%TAREA%" /f >nul 2>&1

:: Buscar pythonw.exe en rutas comunes
set PYTHONW=
if exist "%LOCALAPPDATA%\Programs\Python\Python313\pythonw.exe" set PYTHONW=%LOCALAPPDATA%\Programs\Python\Python313\pythonw.exe
if not defined PYTHONW if exist "%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe" set PYTHONW=%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe
if not defined PYTHONW if exist "%LOCALAPPDATA%\Programs\Python\Python311\pythonw.exe" set PYTHONW=%LOCALAPPDATA%\Programs\Python\Python311\pythonw.exe
if not defined PYTHONW if exist "C:\Python313\pythonw.exe" set PYTHONW=C:\Python313\pythonw.exe
if not defined PYTHONW if exist "C:\Python312\pythonw.exe" set PYTHONW=C:\Python312\pythonw.exe
if not defined PYTHONW set PYTHONW=pythonw.exe

echo   Usando: %PYTHONW%

:: PowerShell script para crear tarea
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

:: ---- 5. Iniciar ahora mismo ----
echo.
echo [5/5] Arrancando sincronizador en segundo plano...
timeout /t 3 /nobreak >nul 2>&1
schtasks /run /tn "%TAREA%"
if %ERRORLEVEL% EQU 0 ( echo   OK. ) else ( echo   [AVISO] No se pudo arrancar ahora, pero arrancara al boot/logon. )

echo.
echo ============================================================
echo   INSTALACION NUCLEAR COMPLETADA v5.3
echo.
echo   Resumen del sistema 24/7:
echo   - Mutex Windows: no hay duplicados jamas
echo   - Cursor con nombre MDB: rotacion diaria no pierde eventos
echo   - Heartbeat cada ~30s en Supabase (dashboard lo monitorea)
echo   - Backoff exponencial: si Supabase falla, espera hasta 30s
echo   - Crash logging con flush inmediato
echo   - Log fresco (se borro _gama_log.txt)
echo   - Task Scheduler: arranca al boot + logon + reinicio 1min
echo   - Sin VBS, sin lock files, sin ventanas
echo.
echo   Para verificar: abre el Administrador de Tareas
echo   y busca "pythonw.exe". O abre el dashboard
echo   y mira el indicador SINCRONIZADOR (verde = vivo).
echo ============================================================
echo.
pause
