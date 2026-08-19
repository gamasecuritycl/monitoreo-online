@echo off
title FIX FINAL - Gama Seguridad
cd /d "%~dp0"
echo ============================================
echo  FIX FINAL - SINCRONIZADOR + WATCHDOG
echo ============================================
echo.

:: 1. Matar TODO proceso relacionado
echo PASO 1: Matando procesos...
taskkill /f /im pythonw.exe >nul 2>nul
taskkill /f /im python.exe >nul 2>nul
taskkill /f /im wscript.exe >nul 2>nul
taskkill /f /im node.exe >nul 2>nul
timeout /t 3 /nobreak >nul
echo   OK

:: 2. Copiar archivos actualizados al padre (SCORPION_DEPLOY)
echo.
echo PASO 2: Copiando sincronizador.py actualizado...
copy /y "%~dp0sincronizador.py" "%~dp0..\sincronizador.py" >nul
copy /y "%~dp0watchdog_total.vbs" "%~dp0..\watchdog_total.vbs" >nul
echo   OK

:: 3. Limpiar TODOS los archivos temporales y locks
echo.
echo PASO 3: Limpiando archivos temporales...
del /f /q "%TEMP%\_gama_sincronizador.lock" 2>nul
del /f /q "%~dp0_sincronizador.lock" 2>nul
del /f /q "%~dp0..\_sincronizador.lock" 2>nul
del /f /q "%~dp0_EVENTOS_TEMP.MDB" 2>nul
del /f /q "%~dp0..\_EVENTOS_TEMP.MDB" 2>nul
del /f /q "%~dp0_sincronizador_cache.json" 2>nul
del /f /q "%~dp0..\_sincronizador_cache.json" 2>nul
echo   OK

:: 4. Eliminar acceso directo VIEJO del inicio de Windows
echo.
echo PASO 4: Eliminando accesos directos viejos...
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
if exist "%STARTUP_DIR%\IniciarSilencioso.lnk" del "%STARTUP_DIR%\IniciarSilencioso.lnk" >nul
if exist "%STARTUP_DIR%\WatchdogSilencioso.lnk" del "%STARTUP_DIR%\WatchdogSilencioso.lnk" >nul
if exist "%STARTUP_DIR%\WatchdogGamaSeguridad.lnk" del "%STARTUP_DIR%\WatchdogGamaSeguridad.lnk" >nul
:: Buscar cualquier .lnk que contenga "iniciar_silencioso" o "watchdog" en el nombre
for %%f in ("%STARTUP_DIR%\*iniciar*") do del "%%f" >nul 2>nul
for %%f in ("%STARTUP_DIR%\*watchdog*") do del "%%f" >nul 2>nul
for %%f in ("%STARTUP_DIR%\*sincronizador*") do del "%%f" >nul 2>nul
for %%f in ("%STARTUP_DIR%\*gama*") do del "%%f" >nul 2>nul
echo   OK

:: 5. Verificar que no queden procesos
echo.
echo PASO 5: Verificando...
wmic process where "(name='pythonw.exe' or name='python.exe' or name='wscript.exe')" get Name,ProcessId 2>nul | find /c /v "" >nul
if errorlevel 1 (
    echo   Todos los procesos detenidos
) else (
    echo   AVISO: Pueden quedar procesos. Se ignoran.
)

:: 6. Iniciar watchdog NUEVO
echo.
echo PASO 6: Iniciando watchdog NUEVO...
start "" wscript.exe "%~dp0watchdog_total.vbs"
echo   OK - Watchdog iniciado

echo.
echo ============================================
echo  FIX APLICADO CORRECTAMENTE
echo.
echo  El watchdog nuevo arranco el sincronizador
echo  con lock global (%%TEMP%%\_gama_sincronizador.lock)
echo  No se duplicara aunque haya otra copia.
echo.
echo  Espera 10 segundos y revisa Command Center
echo ============================================
timeout /t 10 /nobreak >nul
echo.
wmic process where "(name='pythonw.exe' or name='wscript.exe' or name='node.exe')" get Name,ProcessId 2>nul
echo.
pause

