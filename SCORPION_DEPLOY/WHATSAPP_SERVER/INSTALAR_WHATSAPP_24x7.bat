@echo off
echo ========================================
echo  INSTALAR WHATSAPP SERVER 24/7
echo ========================================
echo.
echo Esto instalara:
echo 1. WhatsApp Server oculto (sin ventana)
echo 2. Watchdog automatico (reinicia si se cae)
echo 3. Inicio automatico con Windows
echo.

:: Verificar administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Ejecuta como Administrador
    pause
    exit /b 1
)

echo Instalando...

:: Eliminar tareas existentes
schtasks /delete /tn "GAMA_WhatsApp_Server" /f >nul 2>&1
schtasks /delete /tn "GAMA_WhatsApp_Watchdog" /f >nul 2>&1

:: Crear tarea WhatsApp Server (inicia con Windows)
schtasks /create /tn "GAMA_WhatsApp_Server" /tr "wscript.exe \"C:\Users\tetor\Downloads\MONITOREO ONLINE\monitoreo-online\SCORPION_DEPLOY\WHATSAPP_SERVER\whatsapp_hidden.vbs\"" /sc onstart /ru SYSTEM /rl HIGHEST /f

:: Crear tarea Watchdog (inicia con Windows)
schtasks /create /tn "GAMA_WhatsApp_Watchdog" /tr "wscript.exe \"C:\Users\tetor\Downloads\MONITOREO ONLINE\monitoreo-online\SCORPION_DEPLOY\WHATSAPP_SERVER\whatsapp_watchdog.vbs\"" /sc onstart /ru SYSTEM /rl HIGHEST /f

echo.
echo ✅ Instalacion completada
echo.
echo El WhatsApp Server se iniciara automaticamente con Windows
echo El Watchdog lo mantendra activo 24/7
echo.
echo Para iniciar AHORA: INICIAR_WHATSAPP_OCULTO.bat
echo Para verificar: VERIFICAR_WHATSAPP.bat
echo Para detener: DETENER_WHATSAPP.bat
echo.
pause
