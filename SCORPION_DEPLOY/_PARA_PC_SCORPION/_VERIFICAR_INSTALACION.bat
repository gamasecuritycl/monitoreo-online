@echo off
title Verificar Watchdog - Gama Seguridad
echo ============================================
echo  VERIFICANDO INSTALACION DEL WATCHDOG
echo ============================================
echo.

:: Verificar acceso directo en inicio
set STARTUP_FILE="%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\WatchdogGamaSeguridad.lnk"
if exist %STARTUP_FILE% (
    echo  ✅ Acceso directo en Inicio de Windows: OK
) else (
    echo  ❌ Acceso directo en Inicio NO encontrado
    echo     Ejecute watchdog_total.vbs manualmente
)

:: Verificar que el watchdog esta corriendo
wmic process where "name='wscript.exe' and CommandLine like '%%watchdog_total%%'" get ProcessId 2>nul | findstr /r "^[0-9]" >nul
if errorlevel 1 (
    echo  ❌ Watchdog NO esta corriendo
    echo     Ejecute watchdog_total.vbs
) else (
    echo  ✅ Watchdog esta corriendo en segundo plano
)

:: Verificar sincronizador
wmic process where "(name='pythonw.exe' or name='python.exe') and CommandLine like '%%sincronizador%%'" get ProcessId 2>nul | findstr /r "^[0-9]" >nul
if errorlevel 1 (
    echo  ❌ Sincronizador NO esta corriendo
) else (
    echo  ✅ Sincronizador esta corriendo
)

:: Verificar whatsapp
wmic process where "name='node.exe' and CommandLine like '%%whatsapp%%'" get ProcessId 2>nul | findstr /r "^[0-9]" >nul
if errorlevel 1 (
    echo  ❌ WhatsApp NO esta corriendo
) else (
    echo  ✅ WhatsApp esta corriendo
)

:: Verificar que NO haya old watchdog
wmic process where "name='wscript.exe' and CommandLine like '%%iniciar_silencioso%%'" get ProcessId 2>nul | findstr /r "^[0-9]" >nul
if errorlevel 1 (
    echo  ✅ No hay watchdog viejo corriendo
) else (
    echo  ❌ Watchdog VIEJO aun corriendo - ejecute _LIMPIAR_Y_REINICIAR.bat
)

echo.
echo ============================================
pause
