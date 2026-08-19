@echo off
title GAMA SECURITY - INICIO DIRECTO SINCRONIZADOR v5.1
color 0A
echo ═══════════════════════════════════════════════════════
echo   GAMA SEGURIDAD — INICIO DIRECTO SINCRONIZADOR v5.1
echo ═══════════════════════════════════════════════════════
echo.

echo [1/5] Deteniendo sincronizadores anteriores...
taskkill /f /fi "IMAGENAME eq pythonw.exe" >nul 2>&1
taskkill /f /fi "IMAGENAME eq python.exe"  >nul 2>&1
timeout /t 2 >nul

echo [2/5] Actualizando sincronizador.py en C:\SCORPION...
set DIR_ACTUAL=%~dp0

if exist "%DIR_ACTUAL%sincronizador.py" (
    copy /y "%DIR_ACTUAL%sincronizador.py" "C:\SCORPION\BASES DE DATOS\sincronizador.py" >nul 2>&1
    copy /y "%DIR_ACTUAL%sincronizador.py" "C:\SCORPION\BASES DE DATOS\SCORPION_DEPLOY\sincronizador.py" >nul 2>&1
    if exist "%DIR_ACTUAL%watchdog_total.vbs" (
        copy /y "%DIR_ACTUAL%watchdog_total.vbs" "C:\SCORPION\BASES DE DATOS\SCORPION_DEPLOY\watchdog_total.vbs" >nul 2>&1
        copy /y "%DIR_ACTUAL%watchdog_total.vbs" "C:\SCORPION\BASES DE DATOS\watchdog_total.vbs" >nul 2>&1
    )
    echo       Archivos copiados con exito.
)

echo [3/5] Localizando Python de la PC Scorpion...
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

echo [4/5] Verificando e instalando librerias (pyodbc, supabase)...
%PY_E% -m pip install pyodbc supabase >nul 2>&1

echo [5/5] Lanzando Sincronizador v5.1...
cd /d "C:\SCORPION\BASES DE DATOS"
start "" /b %PY_W% "C:\SCORPION\BASES DE DATOS\sincronizador.py"
start "" /b wscript.exe "C:\SCORPION\BASES DE DATOS\SCORPION_DEPLOY\watchdog_total.vbs" >nul 2>&1

:: Crear Tarea Programada apuntando a la ruta absoluta detectada
schtasks /create /tn "GAMA_Sincronizador" /tr "%PY_W% \"C:\SCORPION\BASES DE DATOS\sincronizador.py\"" /sc ONSTART /rl HIGHEST /f >nul 2>&1
schtasks /run /tn GAMA_Sincronizador >nul 2>&1

timeout /t 5 >nul

echo.
echo ═══════════════════════════════════════════════════════
echo   ✓ PROCESO FINALIZADO
echo   Comprueba que la luz superior cambie a [SINCR. VERDE]
echo ═══════════════════════════════════════════════════════
echo.
pause
