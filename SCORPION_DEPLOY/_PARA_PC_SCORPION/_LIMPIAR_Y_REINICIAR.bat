@echo off
title Arreglar Watchdog - Gama Seguridad
cd /d "%~dp0"

echo ============================================
echo  ARREGLANDO WATCHDOG - GAMA SEGURIDAD
echo ============================================
echo.
echo  PASO 1: Detener procesos viejos...
echo.

:: Matar procesos del watchdog viejo
taskkill /f /im wscript.exe >nul 2>nul
echo   ✓ Watchdogs viejos detenidos

:: Matar sincronizadores viejos
taskkill /f /im pythonw.exe >nul 2>nul
echo   ✓ Sincronizadores detenidos

:: Matar node (whatsapp, se reiniciara solo)
taskkill /f /im node.exe >nul 2>nul
echo   ✓ WhatsApp detenido (se reiniciara solo)

echo.
echo  PASO 2: Eliminar acceso directo VIEJO del inicio...
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

:: Buscar y borrar cualquier acceso directo que apunte a iniciar_silencioso
if exist "%STARTUP_DIR%\IniciarSilencioso.lnk" (
    del "%STARTUP_DIR%\IniciarSilencioso.lnk" >nul
    echo   ✓ Acceso directo 'IniciarSilencioso' eliminado
)
if exist "%STARTUP_DIR%\WatchdogSilencioso.lnk" (
    del "%STARTUP_DIR%\WatchdogSilencioso.lnk" >nul
    echo   ✓ Acceso directo 'WatchdogSilencioso' eliminado
)
:: Buscar cualquier .lnk que contenga "iniciar_silencioso" o "watchdog" viejo
for %%f in ("%STARTUP_DIR%\*.lnk") do (
    findstr /m "iniciar_silencioso" "%%f" >nul 2>nul
    if not errorlevel 1 (
        del "%%f" >nul
        echo   ✓ Eliminado: %%~nxf
    )
)
echo   ✓ Accesos directos viejos limpiados

echo.
echo  PASO 3: Eliminar cache del sincronizador...
if exist "_sincronizador_cache.json" (
    del "_sincronizador_cache.json" >nul
    echo   ✓ Cache eliminada
)
if exist "_watchdog_log.txt" (
    del "_watchdog_log.txt" >nul
    echo   ✓ Log anterior eliminado
)

echo.
echo  PASO 4: Iniciar watchdog NUEVO...
start "" wscript.exe "%~dp0watchdog_total.vbs"
echo   ✓ Watchdog nuevo iniciado en segundo plano

echo.
echo ============================================
echo  LISTO. Todo arreglado.
echo  El watchdog nuevo ya esta cuidando:
echo   - Sincronizador de eventos
echo   - Servidor de WhatsApp
echo.
echo  No necesita hacer nada mas.
echo  Al reiniciar el PC, arranca solo.
echo ============================================
echo.
pause