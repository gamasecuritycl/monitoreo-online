@echo off
title Preparar USB - Gama Seguridad
cd /d "%~dp0"

set DESTINO=%~dp0_PARA_PC_SCORPION

echo ============================================
echo  Preparando archivos para PC Scorpion
echo ============================================
echo.
echo  Destino: %DESTINO%
echo.

if exist "%DESTINO%" rmdir /s /q "%DESTINO%"
mkdir "%DESTINO%" 2>nul

:: Copiar sincronizador.py (v3.3, reparado)
copy /y "sincronizador.py" "%DESTINO%\sincronizador.py" >nul
echo  ✅ sincronizador.py (v3.3 - auto-update desactivado, stream_req eliminado, heartbeat agregado)

:: Copiar watchdog VBS (nuevo, un solo archivo, segundo plano total)
copy /y "watchdog_total.vbs" "%DESTINO%\watchdog_total.vbs" >nul
echo  ✅ watchdog_total.vbs (UN SOLO ARCHIVO - segundo plano, monitorea sincronizador + whatsapp, se auto-instala)

:: Crear README
del "%DESTINO%\LEEME.txt" 2>nul
echo ============================================>> "%DESTINO%\LEEME.txt"
echo  INSTRUCCIONES - PC SCORPION>> "%DESTINO%\LEEME.txt"
echo ============================================>> "%DESTINO%\LEEME.txt"
echo.>> "%DESTINO%\LEEME.txt"
echo  1. Copiar TODOS los archivos de esta carpeta>> "%DESTINO%\LEEME.txt"
echo     a la carpeta SCORPION_DEPLOY del PC Scorpion>> "%DESTINO%\LEEME.txt"
echo     (normalmente en C:\SCORPION_DEPLOY\ o similar)>> "%DESTINO%\LEEME.txt"
echo.>> "%DESTINO%\LEEME.txt"
echo  2. HACER DOBLE CLICK a watchdog_total.vbs>> "%DESTINO%\LEEME.txt"
echo     (SOLO UNA VEZ - se instala en inicio de Windows>> "%DESTINO%\LEEME.txt"
echo      y arranca el watchdog en segundo plano)>> "%DESTINO%\LEEME.txt"
echo.>> "%DESTINO%\LEEME.txt"
echo  3. Listo. Ya no hay que hacer nada mas.>> "%DESTINO%\LEEME.txt"
echo     El watchdog monitorea sincronizador + whatsapp>> "%DESTINO%\LEEME.txt"
echo     y se reinicia solo si se caen.>> "%DESTINO%\LEEME.txt"
echo.>> "%DESTINO%\LEEME.txt"
echo  *Si el sincronizador VIEJO esta corriendo:*>> "%DESTINO%\LEEME.txt"
echo  Antes del paso 2, matar procesos viejos con:>> "%DESTINO%\LEEME.txt"
echo    taskkill /f /im pythonw.exe>> "%DESTINO%\LEEME.txt"
echo.>> "%DESTINO%\LEEME.txt"
echo  *Si existe iniciar_silencioso.vbs en inicio:*>> "%DESTINO%\LEEME.txt"
echo  Eliminar el acceso directo viejo de:>> "%DESTINO%\LEEME.txt"
echo    %%APPDATA%%\Microsoft\Windows\Start Menu\Programs\Startup\>> "%DESTINO%\LEEME.txt"
echo.>> "%DESTINO%\LEEME.txt"
echo  =========== ARCHIVOS INCLUIDOS ===========>> "%DESTINO%\LEEME.txt"
echo.>> "%DESTINO%\LEEME.txt"
echo  sincronizador.py    - Script de sincronizacion reparado v3.3>> "%DESTINO%\LEEME.txt"
echo                       (sin auto-update, sin stream_req,>> "%DESTINO%\LEEME.txt"
echo                        con heartbeat constante)>> "%DESTINO%\LEEME.txt"
echo.>> "%DESTINO%\LEEME.txt"
echo  watchdog_total.vbs  - Watchdog TOTAL (UN SOLO ARCHIVO)>> "%DESTINO%\LEEME.txt"
echo                       Corre en segundo plano (CERO ventanas).>> "%DESTINO%\LEEME.txt"
echo                       Monitorea sincronizador + whatsapp 24/7.>> "%DESTINO%\LEEME.txt"
echo                       Se auto-instala en inicio de Windows>> "%DESTINO%\LEEME.txt"
echo                       al ejecutarlo.>> "%DESTINO%\LEEME.txt"
echo                       Detecta duplicados (no se monta).>> "%DESTINO%\LEEME.txt"

echo  ✅ LEEME.txt (instrucciones)
echo.
echo ============================================
echo  LISTO. Carpeta creada en:
echo  %DESTINO%
echo.
echo  Copie la carpeta "_PARA_PC_SCORPION" a un USB
echo  y siga las instrucciones del LEEME.txt
echo ============================================
echo.
pause
