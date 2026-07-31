@echo off
title Instalar Bridge Dahua en Inicio de Windows
cd /d "%~dp0"

:: Crear acceso directo en Carpeta de Inicio
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set VBS_PATH=%STARTUP_DIR%\BridgeDahuaP2P.lnk

:: Generar .lnk via script VBS
echo Set WshShell = CreateObject("WScript.Shell") > "%TEMP%\create_shortcut.vbs"
echo Set Shortcut = WshShell.CreateShortcut("%VBS_PATH%") >> "%TEMP%\create_shortcut.vbs"
echo Shortcut.TargetPath = "%CD%\iniciar_bridge.vbs" >> "%TEMP%\create_shortcut.vbs"
echo Shortcut.WorkingDirectory = "%CD%" >> "%TEMP%\create_shortcut.vbs"
echo Shortcut.Description = "Bridge Dahua P2P - Gama Seguridad" >> "%TEMP%\create_shortcut.vbs"
echo Shortcut.WindowStyle = 7 >> "%TEMP%\create_shortcut.vbs"
echo Shortcut.Save >> "%TEMP%\create_shortcut.vbs"
cscript //nologo "%TEMP%\create_shortcut.vbs"
del "%TEMP%\create_shortcut.vbs"

echo ============================================
echo  ✅ Bridge Dahua P2P instalado en inicio de Windows
echo  📍 %VBS_PATH%
echo ============================================
echo.
echo El bridge se iniciara automaticamente al encender el PC.
echo Para desinstalar, elimina el acceso directo de:
echo   %STARTUP_DIR%
echo.
pause
