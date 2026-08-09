@echo off
echo ═══════════════════════════════════════════════
echo  GAMA - Desplegar actualizaciones a Scorpion
echo  Copia todos los archivos actualizados
echo ═══════════════════════════════════════════════
echo.

set SRC=C:\Users\tetor\Downloads\MONITOREO ONLINE\monitoreo-online\SCORPION_DEPLOY
set DST=C:\SCORPION\BASES DE DATOS\SCORPION_DEPLOY

echo Origen: %SRC%
echo Destino: %DST%
echo.

if not exist "%DST%" (
    echo ERROR: No se encontro carpeta Scorpion en C:\SCORPION
    echo Verifica que AnyDesk este conectado al disco correcto
    pause
    exit /b 1
)

echo Copiando archivos...

:: Sincronizador
copy /y "%SRC%\sincronizador.py" "%DST%\sincronizador.py" >nul
echo   [OK] sincronizador.py

:: Watchdog
copy /y "%SRC%\watchdog_total.vbs" "%DST%\watchdog_total.vbs" >nul
echo   [OK] watchdog_total.vbs

:: WhatsApp server
if not exist "%DST%\WHATSAPP_SERVER" mkdir "%DST%\WHATSAPP_SERVER"
copy /y "%SRC%\WHATSAPP_SERVER\whatsapp_server.js" "%DST%\WHATSAPP_SERVER\whatsapp_server.js" >nul
echo   [OK] whatsapp_server.js

:: Scripts de WhatsApp
copy /y "%SRC%\WHATSAPP_SERVER\INICIAR_WHATSAPP.bat" "%DST%\WHATSAPP_SERVER\INICIAR_WHATSAPP.bat" >nul
copy /y "%SRC%\WHATSAPP_SERVER\INICIAR_WHATSAPP_LOOP.bat" "%DST%\WHATSAPP_SERVER\INICIAR_WHATSAPP_LOOP.bat" >nul
copy /y "%SRC%\WHATSAPP_SERVER\INSTALAR_WHATSAPP_24x7.bat" "%DST%\WHATSAPP_SERVER\INSTALAR_WHATSAPP_24x7.bat" >nul
echo   [OK] Scripts WhatsApp

:: Script de recuperacion
copy /y "%SRC%\RECUPERAR_TODO.bat" "%DST%\RECUPERAR_TODO.bat" >nul
echo   [OK] RECUPERAR_TODO.bat

:: Watchdog tambien en root
copy /y "%SRC%\watchdog_total.vbs" "C:\SCORPION\BASES DE DATOS\watchdog_total.vbs" >nul 2>&1
echo   [OK] watchdog_total.vbs (root)

echo.
echo ═══════════════════════════════════════════════
echo  ARCHIVOS COPIADOS CORRECTAMENTE
echo ═══════════════════════════════════════════════
echo.
echo  Siguiente paso: ejecutar RECUPERAR_TODO.bat
echo  (Click derecho - Ejecutar como administrador)
echo ═══════════════════════════════════════════════
echo.
pause
