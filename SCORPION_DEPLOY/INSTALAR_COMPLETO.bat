@echo off
title GAMA COMMAND CENTER - Instalacion Completa v4.0
color 0A
setlocal

set DESTINO=C:\SCORPION\BASES DE DATOS
set TAREA=GAMA_Sincronizador

echo.
echo =====================================================
echo   GAMA COMMAND CENTER - Instalador Completo v4.0
echo   (Ejecutar como Administrador)
echo =====================================================
echo.

:: ---- Verificar privilegios de Administrador ----
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Debes ejecutar este script como Administrador.
    echo Haz clic derecho sobre el archivo y selecciona "Ejecutar como Administrador".
    echo.
    pause
    exit /b 1
)

:: ---- Crear directorio destino si no existe ----
if not exist "%DESTINO%" (
    mkdir "%DESTINO%"
)

:: ---- Verificar Python ----
echo [1/5] Verificando Python...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Python no esta instalado.
    echo Descargalo desde: https://www.python.org/downloads/
    echo IMPORTANTE: Marca "Add Python to PATH" al instalar.
    echo.
    pause
    exit /b 1
)
python --version
echo OK.

:: ---- Instalar dependencias ----
echo.
echo [2/5] Instalando dependencias Python...
pip install supabase pyodbc requests --quiet
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo la instalacion de dependencias.
    pause
    exit /b 1
)
echo OK.

:: ---- Copiar archivos al destino ----
echo.
echo [3/5] Copiando archivos a "%DESTINO%"...
copy /Y "%~dp0sincronizador.py"      "%DESTINO%\sincronizador.py"      >nul
copy /Y "%~dp0iniciar_silencioso.vbs" "%DESTINO%\iniciar_silencioso.vbs" >nul
echo OK.

:: ---- Detener cualquier instancia previa ----
taskkill /f /im pythonw.exe >nul 2>&1

:: ---- Eliminar lock file stale si existe ----
if exist "%DESTINO%\_sincronizador.lock" (
    del /F "%DESTINO%\_sincronizador.lock" >nul 2>&1
)

:: ---- Registrar Tarea Programada (se ejecuta al iniciar el PC y al iniciar sesion) ----
echo.
echo [4/5] Registrando inicio automatico perpetuo en Task Scheduler...

:: Eliminar registro previo en Run por si existia
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "%TAREA%" /f >nul 2>&1

:: Eliminar la tarea programada anterior para recrearla limpia
schtasks /delete /tn "%TAREA%" /f >nul 2>&1

:: Crear XML temporal con dos disparadores: ONSTART (arranque del PC) + ONLOGON (inicio de sesion)
set XML_FILE=%TEMP%\gama_task.xml

> "%XML_FILE%" echo ^<?xml version="1.0" encoding="UTF-16"?^>
>> "%XML_FILE%" echo ^<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task"^>
>> "%XML_FILE%" echo   ^<RegistrationInfo^>
>> "%XML_FILE%" echo     ^<Description^>GAMA Command Center - Sincronizador de eventos Scorpion^</Description^>
>> "%XML_FILE%" echo   ^</RegistrationInfo^>
>> "%XML_FILE%" echo   ^<Triggers^>
>> "%XML_FILE%" echo     ^<BootTrigger^>
>> "%XML_FILE%" echo       ^<Enabled^>true^</Enabled^>
>> "%XML_FILE%" echo     ^</BootTrigger^>
>> "%XML_FILE%" echo     ^<LogonTrigger^>
>> "%XML_FILE%" echo       ^<Enabled^>true^</Enabled^>
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
>> "%XML_FILE%" echo     ^<RestartOnFailure^>
>> "%XML_FILE%" echo       ^<Interval^>PT1M^</Interval^>
>> "%XML_FILE%" echo       ^<Count^>999^</Count^>
>> "%XML_FILE%" echo     ^</RestartOnFailure^>
>> "%XML_FILE%" echo   ^</Settings^>
>> "%XML_FILE%" echo   ^<Actions Context="Author"^>
>> "%XML_FILE%" echo     ^<Exec^>
>> "%XML_FILE%" echo       ^<Command^>wscript.exe^</Command^>
>> "%XML_FILE%" echo       ^<Arguments^>"%DESTINO%\iniciar_silencioso.vbs"^</Arguments^>
>> "%XML_FILE%" echo     ^</Exec^>
>> "%XML_FILE%" echo   ^</Actions^>
>> "%XML_FILE%" echo ^</Task^>

schtasks /create /tn "%TAREA%" /xml "%XML_FILE%" /f

:: Limpiar XML temporal
del /F "%XML_FILE%" >nul 2>&1

echo OK.

:: ---- Iniciar ahora mismo ----
echo.
echo [5/5] Iniciando el sincronizador en segundo plano...
schtasks /run /tn "%TAREA%"
echo OK.

echo.
echo =====================================================
echo   INSTALACION COMPLETADA v4.0 (SERVICIO PERPETUO)
echo.
echo   El sincronizador ahora:
echo   - Arranca automaticamente al encender el PC
echo   - Arranca al iniciar sesion de cualquier usuario
echo   - Se auto-reinicia si ocurre un error
echo.
echo   Para verificar: abre el Administrador de Tareas
echo   y busca el proceso "pythonw.exe".
echo =====================================================
echo.
pause
