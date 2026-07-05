@echo off
title GAMA COMMAND CENTER - Instalacion Nuclear v5.2
color 0A
setlocal enabledelayedexpansion

set DESTINO=C:\SCORPION\BASES DE DATOS
set TAREA=GAMA_Sincronizador

echo.
echo ============================================================
echo   GAMA COMMAND CENTER - INSTALACION NUCLEAR v5.2
echo   (Ejecutar como Administrador - UNICA VEZ)
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
taskkill /f /im wscript.exe >nul 2>&1
echo   ✓ pythonw.exe y wscript.exe eliminados.

:: ---- Crear directorio destino ----
if not exist "%DESTINO%" mkdir "%DESTINO%"

:: ---- Copiar archivos ----
copy /Y "%~dp0sincronizador.py" "%DESTINO%\sincronizador.py" >nul
echo   ✓ sincronizador.py copiado.

:: ---- LIMPIAR archivos obsoletos ----
echo   Limpiando archivos de versiones anteriores...
if exist "%DESTINO%\_sincronizador.lock" del /F "%DESTINO%\_sincronizador.lock" >nul 2>&1 & echo     - _sincronizador.lock eliminado
if exist "%DESTINO%\_sincronizador_cache.json" del /F "%DESTINO%\_sincronizador_cache.json" >nul 2>&1 & echo     - _sincronizador_cache.json eliminado
if exist "%DESTINO%\iniciar_silencioso.vbs" del /F "%DESTINO%\iniciar_silencioso.vbs" >nul 2>&1 & echo     - iniciar_silencioso.vbs eliminado (ya no se usa)
if exist "%DESTINO%\sincronizador.py.bak" del /F "%DESTINO%\sincronizador.py.bak" >nul 2>&1
echo   OK.

:: ---- 4. Registrar Tarea Programada NUCLEAR ----
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

:: Crear XML — SIN VBS, directo a pythonw.exe
set XML_FILE=%TEMP%\gama_task.xml

> "%XML_FILE%" echo ^<?xml version="1.0" encoding="UTF-16"?^>
>> "%XML_FILE%" echo ^<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task"^>
>> "%XML_FILE%" echo   ^<RegistrationInfo^>
>> "%XML_FILE%" echo     ^<Description^>GAMA Command Center - Sincronizador Nuclear v5.2^</Description^>
>> "%XML_FILE%" echo   ^</RegistrationInfo^>
>> "%XML_FILE%" echo   ^<Triggers^>
>> "%XML_FILE%" echo     ^<BootTrigger^>
>> "%XML_FILE%" echo       ^<Enabled^>true^</Enabled^>
>> "%XML_FILE%" echo       ^<Delay^>PT10S^</Delay^>
>> "%XML_FILE%" echo     ^</BootTrigger^>
>> "%XML_FILE%" echo     ^<LogonTrigger^>
>> "%XML_FILE%" echo       ^<Enabled^>true^</Enabled^>
>> "%XML_FILE%" echo       ^<Delay^>PT5S^</Delay^>
>> "%XML_FILE%" echo     ^</LogonTrigger^>
>> "%XML_FILE%" echo   ^</Triggers^>
>> "%XML_FILE%" echo   ^<Principals^>
>> "%XML_FILE%" echo     ^<Principal id="Author"^>
>> "%XML_FILE%" echo       ^<RunLevel^>HighestAvailable^</RunLevel^>
>> "%XML_FILE%" echo     ^</Principal^>
>> "%XML_FILE%" echo   ^</Principals^>
>> "%XML_FILE%" echo   ^<Settings^>
>> "%XML_FILE%" echo     ^<Enabled^>true^</Enabled^>
>> "%XML_FILE%" echo     ^<StartWhenAvailable^>true^</StartWhenAvailable^>
>> "%XML_FILE%" echo     ^<AllowStartOnDemand^>true^</AllowStartOnDemand^>
>> "%XML_FILE%" echo     ^<MultipleInstances^>IgnoreNew^</MultipleInstances^>
>> "%XML_FILE%" echo     ^<RestartOnFailure^>
>> "%XML_FILE%" echo       ^<Interval^>PT15S^</Interval^>
>> "%XML_FILE%" echo       ^<Count^>9999^</Count^>
>> "%XML_FILE%" echo     ^</RestartOnFailure^>
>> "%XML_FILE%" echo     ^<ExecutionTimeLimit^>PT0S^</ExecutionTimeLimit^>
>> "%XML_FILE%" echo     ^<Priority^>7^</Priority^>
>> "%XML_FILE%" echo   ^</Settings^>
>> "%XML_FILE%" echo   ^<Actions Context="Author"^>
>> "%XML_FILE%" echo     ^<Exec^>
>> "%XML_FILE%" echo       ^<Command^>"%PYTHONW%"^</Command^>
>> "%XML_FILE%" echo       ^<Arguments^>"%DESTINO%\sincronizador.py"^</Arguments^>
>> "%XML_FILE%" echo       ^<WorkingDirectory^>%DESTINO%^</WorkingDirectory^>
>> "%XML_FILE%" echo     ^</Exec^>
>> "%XML_FILE%" echo   ^</Actions^>
>> "%XML_FILE%" echo ^</Task^>

schtasks /create /tn "%TAREA%" /xml "%XML_FILE%" /f
del /F "%XML_FILE%" >nul 2>&1
echo   OK.

:: ---- 5. Iniciar ahora mismo ----
echo.
echo [5/5] Arrancando sincronizador en segundo plano...
schtasks /run /tn "%TAREA%"
echo   OK.

echo.
echo ============================================================
echo   INSTALACION NUCLEAR COMPLETADA v5.2
echo.
echo   Resumen del sistema 24/7:
echo   - Mutex Windows: no hay duplicados jamas
echo   - Cursor persistente: al reiniciar NO reprocesa eventos
echo   - Heartbeat cada ~30s en Supabase (dashboard lo monitorea)
echo   - Backoff exponencial: si Supabase falla, espera hasta 30s
echo   - Crash logging: cualquier error queda en _gama_log.txt
echo   - Task Scheduler: arranca al boot + logon + reinicio 15s
echo   - Sin VBS, sin lock files, sin ventanas
echo.
echo   Para verificar: abre el Administrador de Tareas
echo   y busca "pythonw.exe". O abre el dashboard
echo   y mira el indicador SINCRONIZADOR (verde = vivo).
echo ============================================================
echo.
pause
