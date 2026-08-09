@echo off
echo ═══════════════════════════════════════════════
echo  GAMA SEGURIDAD - RECUPERACION COMPLETA POST-APAGON
echo  Ejecutar como Administrador en PC Scorpion
echo ═══════════════════════════════════════════════
echo.

:: Verificar administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Ejecuta como Administrador
    pause
    exit /b 1
)

set SCORPION=%~dp0
echo Ruta: %SCORPION%
echo.

:: PASO 1: Matar todos los procesos anteriores
echo [1/6] Deteniendo procesos anteriores...
taskkill /f /im pythonw.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im wscript.exe >nul 2>&1
timeout /t 3 >nul
echo       OK

:: PASO 2: Verificar que los archivos criticos existen
echo [2/6] Verificando archivos...
if not exist "%SCORPION%sincronizador.py" (
    echo       ERROR: sincronizador.py no encontrado
    pause
    exit /b 1
)
if not exist "%SCORPION%watchdog_total.vbs" (
    echo       ERROR: watchdog_total.vbs no encontrado
    pause
    exit /b 1
)
if not exist "%SCORPION%WHATSAPP_SERVER\whatsapp_server.js" (
    echo       ERROR: whatsapp_server.js no encontrado
    pause
    exit /b 1
)
echo       OK - Todos los archivos presentes

:: PASO 3: Verificar bases de datos MDB
echo [3/6] Verificando bases MDB...
set MDB_COUNT=0
if exist "%SCORPION%EVENTOS\*.MDB" (
    for %%f in ("%SCORPION%EVENTOS\*.MDB") do set /a MDB_COUNT+=1
)
echo       MDBs encontrados: %MDB_COUNT%

:: PASO 4: Instalar watchdog en inicio de Windows
echo [4/6] Instalando watchdog en inicio...
set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
copy /y "%SCORPION%watchdog_total.vbs" "%STARTUP%\WatchdogGamaSeguridad.vbs" >nul 2>&1
if %errorlevel% equ 0 (
    echo       OK - Watchdog instalado en Startup
) else (
    echo       WARN - No se pudo copiar a Startup (intentar manual)
)

:: PASO 5: Iniciar sincronizador
echo [5/6] Iniciando sincronizador...
start "" /min pythonw.exe "%SCORPION%sincronizador.py"
timeout /t 5 >nul

:: Verificar que arrancó
tasklist /fi "imagename eq pythonw.exe" | findstr /i "pythonw" >nul 2>&1
if %errorlevel% equ 0 (
    echo       OK - Sincronizador corriendo
) else (
    echo       WARN - Reintentando con python.exe...
    start "" /min python.exe "%SCORPION%sincronizador.py"
    timeout /t 3 >nul
)

:: PASO 6: Iniciar WhatsApp server
echo [6/6] Iniciando WhatsApp server...
cd /d "%SCORPION%WHATSAPP_SERVER"
start "" /min node whatsapp_server.js
timeout /t 8 >nul

curl -s http://localhost:3015/api/status >nul 2>&1
if %errorlevel% equ 0 (
    echo       OK - WhatsApp server corriendo
) else (
    echo       WARN - WhatsApp puede estar iniciando...
)

:: RESUMEN
echo.
echo ═══════════════════════════════════════════════
echo  RESUMEN DE RECUPERACION
echo ═══════════════════════════════════════════════
echo.

tasklist /fi "imagename eq pythonw.exe" | findstr /i "pythonw" >nul 2>&1
if %errorlevel% equ 0 (echo  [OK] Sincronizador: CORRIENDO) else (echo  [!!] Sincronizador: NO DETECTADO)

curl -s http://localhost:3015/api/status >nul 2>&1
if %errorlevel% equ 0 (echo  [OK] WhatsApp: CORRIENDO) else (echo  [!!] WhatsApp: NO DETECTADO)

echo.
echo  Watchdog instalado en: %STARTUP%
echo  Log watchdog: %SCORPION%_watchdog_log.txt
echo.
echo  Si algo falla, el watchdog lo reiniciara solo en 30s.
echo  Si el PC se apaga de nuevo, todo arranca solo al encender.
echo ═══════════════════════════════════════════════
echo.
pause
