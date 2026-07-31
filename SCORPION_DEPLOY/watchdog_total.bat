@echo off
title Watchdog Gama Seguridad
cd /d "%~dp0"
set STARTUP_SHORTCUT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\WatchdogGamaSeguridad.lnk

:: ====================================================================
::  WATCHDOG TOTAL - GAMA SEGURIDAD
::  Monitorea Sincronizador + WhatsApp Server 24/7
::  
::  USO: 
::    Doble click (primera vez)  → Instala en inicio de Windows + inicia watchdog
::    Reinicio de Windows         → Se inicia automaticamente (minimizado)
::    watchdog_total --start      → Solo corre el watchdog (desde shortcut startup)
::    watchdog_total --forzar     → Mata el sincronizador viejo y arranca el nuevo
:: ====================================================================

:: === PRIMERA VEZ: Instalar en inicio de Windows ===
if /i NOT "%1"=="--start" (
    if not exist "%STARTUP_SHORTCUT%" (
        cls
        echo ============================================
        echo  GAMA SEGURIDAD - Instalando Watchdog
        echo ============================================
        echo.
        echo Set WshShell = CreateObject("WScript.Shell") > "%TEMP%\instalar_watchdog.vbs"
        echo Set Shortcut = WshShell.CreateShortcut("%STARTUP_SHORTCUT%") >> "%TEMP%\instalar_watchdog.vbs"
        echo Shortcut.TargetPath = "%~f0" >> "%TEMP%\instalar_watchdog.vbs"
        echo Shortcut.Arguments = "--start" >> "%TEMP%\instalar_watchdog.vbs"
        echo Shortcut.WorkingDirectory = "%~dp0" >> "%TEMP%\instalar_watchdog.vbs"
        echo Shortcut.Description = "Watchdog Gama Seguridad - Sincronizador + WhatsApp" >> "%TEMP%\instalar_watchdog.vbs"
        echo Shortcut.WindowStyle = 7 >> "%TEMP%\instalar_watchdog.vbs"
        echo Shortcut.Save >> "%TEMP%\instalar_watchdog.vbs"
        cscript //nologo "%TEMP%\instalar_watchdog.vbs" >nul
        del "%TEMP%\instalar_watchdog.vbs" 2>nul

        if exist "%STARTUP_SHORTCUT%" (
            echo  ✅ Watchdog instalado en inicio de Windows
            echo  Se iniciara automaticamente al encender el PC.
        ) else (
            echo  ⚠ No se pudo crear el acceso directo.
            echo    Ejecute como Administrador o copie este .bat
            echo    a la carpeta Startup manualmente:
            echo    %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\
        )
        echo.
        echo  Iniciando watchdog ahora...
        echo.
    )
)

:: === FORZAR REINICIO DEL SINCRONIZADOR (--forzar) ===
if /i "%1"=="--forzar" (
    echo ============================================
    echo  Forzando reinicio del Sincronizador...
    echo ============================================
    :: Matar proceso por lock file
    if exist _sincronizador.lock (
        set /p OLDPID=<_sincronizador.lock
        taskkill /f /pid %OLDPID% 2>nul
        del _sincronizador.lock 2>nul
        echo  ✅ Viejo sincronizador (PID %OLDPID%) detenido.
    )
    :: Matar cualquier proceso python con sincronizador en el command line
    for /f "skip=1" %%p in ('wmic process where "name='python.exe' and CommandLine like '%%sincronizador%%'" get ProcessId 2^>nul') do (
        taskkill /f /pid %%p 2>nul
    )
    for /f "skip=1" %%p in ('wmic process where "name='pythonw.exe' and CommandLine like '%%sincronizador%%'" get ProcessId 2^>nul') do (
        taskkill /f /pid %%p 2>nul
    )
    if exist _sincronizador.lock del _sincronizador.lock 2>nul
    timeout /t 2 /nobreak >nul
    echo  Nueva version arrancara a continuacion...
)

:: === INICIAR AMBOS SERVICIOS ===

:: Buscar Python (preferir pythonw.exe para segundo plano)
set PYTHON_CMD=pythonw.exe
where pythonw.exe >nul 2>&1
if errorlevel 1 (
    set PYTHON_CMD=python.exe
)

:: Verificar Sincronizador
set SINCPID=
if exist _sincronizador.lock (
    set /p SINCPID=<_sincronizador.lock
    tasklist /fi "PID eq %SINCPID%" 2>nul | findstr /i "python" >nul
    if errorlevel 1 set SINCPID=
)
if not defined SINCPID (
    if exist _sincronizador.lock del _sincronizador.lock 2>nul
    echo [%date% %time%] Iniciando Sincronizador...
    start /min "" %PYTHON_CMD% sincronizador.py
)

:: Verificar WhatsApp (buscar ventana con el titulo del loop)
tasklist /fi "Imagename eq cmd.exe" /v 2>nul | find "WHATSAPP CORE SERVER" >nul
if errorlevel 1 (
    echo [%date% %time%] Iniciando WhatsApp Server...
    start /min "" cmd /c "WHATSAPP_SERVER\INICIAR_WHATSAPP_LOOP.bat"
)

:: === SALTAR BANNER SI FUE INICIADO DESDE STARTUP ===
if /i "%1"=="--start" goto loop

:: === VENTANA VISIBLE (ejecucion manual) ===
echo.
echo ============================================
echo  Watchdog activo - Presione Ctrl+C para salir
echo  Sincronizador + WhatsApp monitoreandose
echo ============================================
echo.

:loop
set SINCPID=
if exist _sincronizador.lock (
    set /p SINCPID=<_sincronizador.lock
    tasklist /fi "PID eq %SINCPID%" 2>nul | findstr /i "python" >nul
    if errorlevel 1 set SINCPID=
)
if not defined SINCPID (
    if exist _sincronizador.lock del _sincronizador.lock 2>nul
    echo [%date% %time%] ⚠ Sincronizador caido. Reiniciando...
    start /min "" %PYTHON_CMD% sincronizador.py
)

tasklist /fi "Imagename eq cmd.exe" /v 2>nul | find "WHATSAPP CORE SERVER" >nul
if errorlevel 1 (
    echo [%date% %time%] ⚠ WhatsApp Server caido. Reiniciando...
    start /min "" cmd /c "WHATSAPP_SERVER\INICIAR_WHATSAPP_LOOP.bat"
)

timeout /t 60 /nobreak >nul
goto loop
