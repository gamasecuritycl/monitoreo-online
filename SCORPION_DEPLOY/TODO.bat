@echo off
title GAMA SECURITY - INICIO DIRECTO SINCRONIZADOR Y SERVICIOS v6.1
color 0A
echo ═══════════════════════════════════════════════════════
echo   GAMA SEGURIDAD — INICIO SERVICIOS INTEGRALES v6.1
echo ═══════════════════════════════════════════════════════
echo.

echo [1/5] Deteniendo procesos anteriores...
taskkill /f /fi "IMAGENAME eq pythonw.exe" >nul 2>&1
taskkill /f /fi "IMAGENAME eq python.exe"  >nul 2>&1
timeout /t 2 >nul

echo [2/5] Actualizando sincronizador y scripts en C:\SCORPION...
set DIR_ACTUAL=%~dp0

if exist "%DIR_ACTUAL%sincronizador.py" (
    copy /y "%DIR_ACTUAL%sincronizador.py" "C:\SCORPION\BASES DE DATOS\sincronizador.py" >nul 2>&1
    copy /y "%DIR_ACTUAL%sincronizador.py" "C:\SCORPION\BASES DE DATOS\SCORPION_DEPLOY\sincronizador.py" >nul 2>&1
    if exist "%DIR_ACTUAL%sincronizador_clientes.py" (
        copy /y "%DIR_ACTUAL%sincronizador_clientes.py" "C:\SCORPION\BASES DE DATOS\sincronizador_clientes.py" >nul 2>&1
        copy /y "%DIR_ACTUAL%sincronizador_clientes.py" "C:\SCORPION\BASES DE DATOS\SCORPION_DEPLOY\sincronizador_clientes.py" >nul 2>&1
    )
    if exist "%DIR_ACTUAL%editor_remoto.py" (
        copy /y "%DIR_ACTUAL%editor_remoto.py" "C:\SCORPION\BASES DE DATOS\editor_remoto.py" >nul 2>&1
        copy /y "%DIR_ACTUAL%editor_remoto.py" "C:\SCORPION\BASES DE DATOS\SCORPION_DEPLOY\editor_remoto.py" >nul 2>&1
    )
    if exist "%DIR_ACTUAL%watchdog_total.vbs" (
        copy /y "%DIR_ACTUAL%watchdog_total.vbs" "C:\SCORPION\BASES DE DATOS\SCORPION_DEPLOY\watchdog_total.vbs" >nul 2>&1
        copy /y "%DIR_ACTUAL%watchdog_total.vbs" "C:\SCORPION\BASES DE DATOS\watchdog_total.vbs" >nul 2>&1
    )
    echo       Archivos copiados con exito.
)

echo [3/5] Localizando Python y Node.js en la PC Scorpion...
set PY_DIR=
for /d %%D in ("C:\Users\*") do (
    if exist "%%D\AppData\Local\Programs\Python\Python313\pythonw.exe" set PY_DIR=%%D\AppData\Local\Programs\Python\Python313
    if exist "%%D\AppData\Local\Programs\Python\Python312\pythonw.exe" set PY_DIR=%%D\AppData\Local\Programs\Python\Python312
    if exist "%%D\AppData\Local\Programs\Python\Python311\pythonw.exe" set PY_DIR=%%D\AppData\Local\Programs\Python\Python311
)
if exist "C:\Python313\pythonw.exe" set PY_DIR=C:\Python313
if exist "C:\Python312\pythonw.exe" set PY_DIR=C:\Python312

if not defined PY_DIR (
    set PY_W=pythonw.exe
    set PY_E=python.exe
) else (
    set PY_W="%PY_DIR%\pythonw.exe"
    set PY_E="%PY_DIR%\python.exe"
)

echo Ruta Python: %PY_W%

echo [4/5] Verificando e instalando librerias Python (pyodbc, requests, pymysql)...
%PY_E% -m pip install pyodbc requests pymysql supabase >nul 2>&1

echo [5/5] Lanzando Sincronizador v6.1, Sincronizador Clientes, Editor Remoto y Watchdog...
cd /d "C:\SCORPION\BASES DE DATOS"
start "" /b %PY_W% "C:\SCORPION\BASES DE DATOS\sincronizador.py"
if exist "C:\SCORPION\BASES DE DATOS\sincronizador_clientes.py" (
    start "" /b %PY_W% "C:\SCORPION\BASES DE DATOS\sincronizador_clientes.py"
)
if exist "C:\SCORPION\BASES DE DATOS\editor_remoto.py" (
    start "" /b %PY_W% "C:\SCORPION\BASES DE DATOS\editor_remoto.py"
)

:: Iniciar servidor WhatsApp (en subcarpeta o en carpeta actual)
set WA_EJECUTADO=0
if exist "%DIR_ACTUAL%WHATSAPP_SERVER\whatsapp_server.js" (
    echo Iniciando WhatsApp Server (subcarpeta)...
    start "" /b cmd /c "cd /d \"%DIR_ACTUAL%WHATSAPP_SERVER\" && node whatsapp_server.js"
    set WA_EJECUTADO=1
)
if exist "%DIR_ACTUAL%whatsapp_server.js" (
    copy /y "%DIR_ACTUAL%whatsapp_server.js" "C:\SCORPION\BASES DE DATOS\whatsapp_server.js" >nul 2>&1
    copy /y "%DIR_ACTUAL%whatsapp_server.js" "C:\SCORPION\BASES DE DATOS\SCORPION_DEPLOY\whatsapp_server.js" >nul 2>&1
    if "%WA_EJECUTADO%"=="0" (
        echo Iniciando WhatsApp Server...
        start "" /b cmd /c "cd /d \"%DIR_ACTUAL%\" && node whatsapp_server.js"
    )
)

start "" /b wscript.exe "C:\SCORPION\BASES DE DATOS\SCORPION_DEPLOY\watchdog_total.vbs" >nul 2>&1

:: Crear Tareas Programadas apuntando a la ruta absoluta detectada
schtasks /create /tn "GAMA_Sincronizador" /tr "%PY_W% \"C:\SCORPION\BASES DE DATOS\sincronizador.py\"" /sc ONSTART /rl HIGHEST /f >nul 2>&1
schtasks /run /tn GAMA_Sincronizador >nul 2>&1

if exist "C:\SCORPION\BASES DE DATOS\sincronizador_clientes.py" (
    schtasks /create /tn "GAMA_Sincronizador_Clientes" /tr "%PY_W% \"C:\SCORPION\BASES DE DATOS\sincronizador_clientes.py\"" /sc ONSTART /rl HIGHEST /f >nul 2>&1
    schtasks /run /tn GAMA_Sincronizador_Clientes >nul 2>&1
)

if exist "C:\SCORPION\BASES DE DATOS\editor_remoto.py" (
    schtasks /create /tn "GAMA_Editor_Remoto" /tr "%PY_W% \"C:\SCORPION\BASES DE DATOS\editor_remoto.py\"" /sc ONSTART /rl HIGHEST /f >nul 2>&1
    schtasks /run /tn GAMA_Editor_Remoto >nul 2>&1
)

timeout /t 5 >nul

echo.
echo ═══════════════════════════════════════════════════════
echo   ✓ PROCESO FINALIZADO EXITOSAMENTE
echo   - Sincronizador v6.1: ACTIVO
echo   - WhatsApp Server: ACTIVO
echo   - Watchdog: ACTIVO
echo ═══════════════════════════════════════════════════════
echo.
pause
