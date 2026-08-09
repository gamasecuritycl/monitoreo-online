@echo off
echo ═══════════════════════════════════════════════════════
echo  GAMA SEGURIDAD - UN SOLO PASO TODO
echo  Ejecutar como Administrador en PC Scorpion
echo ═══════════════════════════════════════════════════════
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Click derecho - Ejecutar como administrador
    pause
    exit /b 1
)

set SCORPION=C:\SCORPION\BASES DE DATOS\SCORPION_DEPLOY
set SRC=%SCORPION%\_PARA_PC_SCORPION

:: Verificar que el staging existe
if not exist "%SRC%\sincronizador.py" (
    echo ERROR: No se encontro la carpeta _PARA_PC_SCORPION
    echo Primero copia la carpeta _PARA_PC_SCORPION a:
    echo   %SCORPION%\
    pause
    exit /b 1
)

echo [1/5] Deteniendo todo...
taskkill /f /im pythonw.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im wscript.exe >nul 2>&1
timeout /t 3 >nul

echo [2/5] Copiando archivos actualizados...
copy /y "%SRC%\sincronizador.py" "%SCORPION%\sincronizador.py" >nul
copy /y "%SRC%\watchdog_total.vbs" "%SCORPION%\watchdog_total.vbs" >nul
copy /y "%SRC%\watchdog_total.vbs" "C:\SCORPION\BASES DE DATOS\watchdog_total.vbs" >nul 2>&1
if not exist "%SCORPION%\WHATSAPP_SERVER" mkdir "%SCORPION%\WHATSAPP_SERVER"
copy /y "%SRC%\whatsapp_server.js" "%SCORPION%\WHATSAPP_SERVER\whatsapp_server.js" >nul
copy /y "%SRC%\INICIAR_WHATSAPP.bat" "%SCORPION%\WHATSAPP_SERVER\INICIAR_WHATSAPP.bat" >nul
copy /y "%SRC%\INICIAR_WHATSAPP_LOOP.bat" "%SCORPION%\WHATSAPP_SERVER\INICIAR_WHATSAPP_LOOP.bat" >nul
echo       OK

echo [3/5] Instalando watchdog en inicio de Windows...
set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
copy /y "%SCORPION%\watchdog_total.vbs" "%STARTUP%\WatchdogGamaSeguridad.vbs" >nul 2>&1
echo       OK

echo [4/5] Iniciando servicios...
start "" /min pythonw.exe "%SCORPION%\sincronizador.py"
timeout /t 3 >nul
cd /d "%SCORPION%\WHATSAPP_SERVER"
start "" /min node whatsapp_server.js
timeout /t 8 >nul

echo [5/5] Iniciando watchdog...
start "" /min wscript.exe "%SCORPION%\watchdog_total.vbs"
timeout /t 3 >nul

:: VERIFICACION FINAL
echo.
echo ═══════════════════════════════════════════════════════
echo  ESTADO FINAL
echo ═══════════════════════════════════════════════════════

set OK=0
set FAIL=0

tasklist /fi "imagename eq pythonw.exe" | findstr /i "pythonw" >nul 2>&1
if %errorlevel% equ 0 (echo  [OK] Sincronizador) else (echo  [!!] Sincronizador NO detectado & set /a FAIL+=1)

curl -s http://localhost:3015/api/status >nul 2>&1
if %errorlevel% equ 0 (echo  [OK] WhatsApp Server) else (echo  [!!] WhatsApp Server iniciando... & set /a FAIL+=1)

if exist "%STARTUP%\WatchdogGamaSeguridad.vbs" (echo  [OK] Watchdog en Startup) else (echo  [!!] Watchdog NO instalado & set /a FAIL+=1)

if exist "%SCORPION%\_sincronizador_heartbeat.txt" (echo  [OK] Heartbeat activo) else (echo  [..] Heartbeat esperando primer ciclo)

echo.
if %FAIL% equ 0 (
    echo  TODO FUNCIONANDO. De ahora en adelante:
    echo  - Apagon? Todo arranca solo al encender
    echo  - Proceso cae? Watchdog lo reinicia en 30s
    echo  - Nunca mas intervene manualmente
) else (
    echo  Algunos servicios pueden estar iniciando.
    echo  El watchdog verificara y reiniciara en 30s si es necesario.
)
echo ═══════════════════════════════════════════════════════
echo.
pause
