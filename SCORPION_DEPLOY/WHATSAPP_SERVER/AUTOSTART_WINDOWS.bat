@echo off
title GAMA SEGURIDAD - AUTO-INICIO WHATSAPP
color 0A
cls
echo =======================================================
echo    CONFIGURAR INICIO AUTOMATICO AL ENCENDER WINDOWS
echo =======================================================
echo.

cd /d "%~dp0"

:: Crear acceso directo en la carpeta de Inicio de Windows
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET=%~dp0INICIAR_SILENCIOSO.vbs"
set "SHORTCUT=%STARTUP%\GamaWhatsApp.lnk"

echo  Creando acceso directo en Inicio de Windows...

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%TARGET%'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'GAMA SEGURIDAD - WhatsApp Server 24/7'; $s.Save()"

if exist "%SHORTCUT%" (
    echo.
    echo  [OK] CONFIGURADO EXITOSAMENTE
    echo.
    echo  El servidor de WhatsApp se iniciara automaticamente
    echo  cada vez que se encienda o reinicie este PC.
    echo.
    echo  Ubicacion: %SHORTCUT%
) else (
    echo.
    echo  [ERROR] No se pudo crear el acceso directo.
    echo  Puedes hacerlo manualmente copiando INICIAR_SILENCIOSO.vbs
    echo  a la carpeta: %STARTUP%
)

echo.
echo  Cerrando ventana de forma automatica en 3 segundos...
timeout /t 3 >nul
exit

