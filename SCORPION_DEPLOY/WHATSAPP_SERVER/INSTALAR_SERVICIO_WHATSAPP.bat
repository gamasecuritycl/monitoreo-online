@echo off
echo ========================================
echo  INSTALAR WHATSAPP SERVER COMO SERVICIO
echo ========================================
echo.

:: Verificar si se ejecuta como administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Ejecuta este archivo como Administrador
    echo Click derecho - Ejecutar como administrador
    pause
    exit /b 1
)

echo Creando tarea programada para inicio automatico...
echo.

:: Eliminar tarea existente si existe
schtasks /delete /tn "GAMA_WhatsApp_Server" /f >nul 2>&1

:: Crear tarea para inicio con Windows
schtasks /create /tn "GAMA_WhatsApp_Server" /tr "wscript.exe \"C:\Users\tetor\Downloads\MONITOREO ONLINE\monitoreo-online\SCORPION_DEPLOY\WHATSAPP_SERVER\whatsapp_hidden.vbs\"" /sc onstart /ru SYSTEM /rl HIGHEST /f

if %errorlevel% equ 0 (
    echo ✅ Tarea programada creada correctamente
    echo.
    echo El WhatsApp Server se iniciara automaticamente con Windows
    echo Para iniciar ahora: INICIAR_WHATSAPP_OCULTO.bat
    echo.
) else (
    echo ❌ Error al crear la tarea programada
)

echo.
pause
