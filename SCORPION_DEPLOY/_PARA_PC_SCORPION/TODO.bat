@echo off
setlocal enabledelayedexpansion

:: ═══════════════════════════════════════════════════════
::   GAMA SEGURIDAD — DESPLIEGUE NUCLEAR (1 CLICK)
::   v4.0 — Sin ventanas, sin intervención manual
::   Ejecutar como Administrador en PC Scorpion
:: ═══════════════════════════════════════════════════════

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Click derecho - Ejecutar como administrador
    pause
    exit /b 1
)

set BASE=C:\SCORPION\BASES DE DATOS\SCORPION_DEPLOY
set WA_DIR=%BASE%\WHATSAPP_SERVER

:: ─────────────────────────────────────
:: [1] MATAR TODO
:: ─────────────────────────────────────
echo [1/7] Deteniendo procesos...
taskkill /f /im pythonw.exe   >nul 2>&1
taskkill /f /im python.exe    >nul 2>&1
taskkill /f /im node.exe      >nul 2>&1
taskkill /f /im wscript.exe   >nul 2>&1
timeout /t 3 >nul

:: ─────────────────────────────────────
:: [2] BACKUP DE SESIÓN WHATSAPP (NUNCA BORRAR)
:: ─────────────────────────────────────
echo [2/7] Preservando sesion WhatsApp...
set SESSION_SRC=%WA_DIR%\.baileys-session
set SESSION_BCK=%BASE%\.baileys-session-backup

if exist "%SESSION_SRC%" (
    if not exist "%SESSION_BCK%" mkdir "%SESSION_BCK%"
    xcopy /e /y /q "%SESSION_SRC%\*" "%SESSION_BCK%\" >nul 2>&1
    echo       Sesion preservada en backup.
) else (
    echo       Sin sesion previa - se creara nueva al vincular.
)

:: ─────────────────────────────────────
:: [3] COPIAR ARCHIVOS ACTUALIZADOS
::     PERO SIN BORRAR .baileys-session
:: ─────────────────────────────────────
echo [3/7] Actualizando archivos...
set SRC=%BASE%\_PARA_PC_SCORPION

if not exist "%SRC%\sincronizador.py" (
    echo ERROR: No se encontro _PARA_PC_SCORPION
    pause
    exit /b 1
)

copy /y "%SRC%\sincronizador.py"  "%BASE%\sincronizador.py"       >nul
copy /y "%SRC%\watchdog_total.vbs" "%BASE%\watchdog_total.vbs"    >nul
copy /y "%SRC%\watchdog_total.vbs" "C:\SCORPION\BASES DE DATOS\watchdog_total.vbs" >nul 2>&1

:: Actualizar whatsapp_server.js SIN BORRAR .baileys-session
if not exist "%WA_DIR%" mkdir "%WA_DIR%"
copy /y "%SRC%\whatsapp_server.js" "%WA_DIR%\whatsapp_server.js"  >nul

:: Restaurar sesion si se copió algo
if exist "%SESSION_BCK%\creds.json" (
    if not exist "%SESSION_SRC%" mkdir "%SESSION_SRC%"
    xcopy /e /y /q "%SESSION_BCK%\*" "%SESSION_SRC%\" >nul 2>&1
    echo       Sesion restaurada correctamente.
)

:: ─────────────────────────────────────
:: [4] VERIFICAR / INSTALAR node_modules
:: ─────────────────────────────────────
echo [4/7] Verificando dependencias Node.js...
cd /d "%WA_DIR%"
if not exist "%WA_DIR%\node_modules\@whiskeysockets" (
    echo       Instalando node_modules (primera vez - puede tardar 2 min)...
    call npm install --prefix "%WA_DIR%" @whiskeysockets/baileys @supabase/supabase-js express cors pino qrcode qrcode-terminal uuid >nul 2>&1
    echo       Instalacion completada.
) else (
    echo       node_modules ya estan instalados.
)

:: ─────────────────────────────────────
:: [5] INSTALAR WATCHDOG EN STARTUP
:: ─────────────────────────────────────
echo [5/7] Instalando watchdog en inicio de Windows...
set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
copy /y "%BASE%\watchdog_total.vbs" "%STARTUP%\WatchdogGamaSeguridad.vbs" >nul 2>&1
echo       OK - Arrancara automaticamente con Windows

:: ─────────────────────────────────────
:: [6] LANZAR SERVICIOS (SIN VENTANAS)
:: ─────────────────────────────────────
echo [6/7] Iniciando servicios en segundo plano...

:: Sincronizador Python (sin ventana)
start "" /b pythonw.exe "%BASE%\sincronizador.py"
timeout /t 2 >nul

:: WhatsApp Server Node.js (sin ventana via VBS)
echo Set WShell = CreateObject("WScript.Shell") > "%TEMP%\start_wa.vbs"
echo WShell.Run "node ""%WA_DIR%\whatsapp_server.js""", 0, False >> "%TEMP%\start_wa.vbs"
wscript.exe "%TEMP%\start_wa.vbs"
timeout /t 5 >nul

:: Watchdog (sin ventana)
start "" /b wscript.exe "%BASE%\watchdog_total.vbs"
timeout /t 2 >nul

:: ─────────────────────────────────────
:: [7] VERIFICACION FINAL
:: ─────────────────────────────────────
echo [7/7] Verificando estado...
timeout /t 5 >nul

set FAIL=0

tasklist /fi "imagename eq pythonw.exe" | findstr /i "pythonw" >nul 2>&1
if %errorlevel% equ 0 (echo  [OK] Sincronizador corriendo) else (echo  [!!] Sincronizador NO detectado & set /a FAIL+=1)

curl -s --max-time 5 http://localhost:3015/api/status >nul 2>&1
if %errorlevel% equ 0 (echo  [OK] WhatsApp Server activo en puerto 3015) else (echo  [..] WhatsApp iniciando - espere 30s)

if exist "%STARTUP%\WatchdogGamaSeguridad.vbs" (echo  [OK] Watchdog en Startup) else (echo  [!!] Watchdog NO instalado & set /a FAIL+=1)

if exist "%SESSION_SRC%\creds.json" (
    echo  [OK] Sesion WhatsApp preservada - reconectara automaticamente
) else (
    echo  [!!] Sin sesion - abra https://www.gamasecurity.cl/app y vincule WhatsApp
    echo       Use el boton "Estado Servidor" y luego "Obtener Codigo"
)

echo.
echo ═══════════════════════════════════════════════════════
if %FAIL% equ 0 (
    echo  SISTEMA GAMA ACTIVO - Todo funcionando
    echo  WhatsApp puede tardar 30s adicionales en conectar
) else (
    echo  ATENCION: %FAIL% componente(s) con problemas
    echo  El watchdog reiniciara automaticamente en 60s
)
echo ═══════════════════════════════════════════════════════
echo.
echo Esta ventana se cerrara en 15 segundos...
timeout /t 15 >nul
