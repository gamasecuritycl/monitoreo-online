@echo off
title GAMA SEGURIDAD - Instalador de Servicio de Windows WhatsApp
color 0E
cls
cd /d "%~dp0"

:: Verificar privilegios de administrador
openfiles >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Por favor ejecuta este archivo como Administrador ^(Clic derecho -> Ejecutar como Administrador^).
    echo.
    pause
    exit /b
)

echo =======================================================
echo    INSTALADOR DE SERVICIO AUTOMATICO - GAMA WHATSAPP
echo =======================================================
echo.

:: Buscar si nssm está en la ruta
where nssm >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Descargando helper de servicios NSSM de forma temporal...
    powershell -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'nssm.zip'" >nul 2>&1
    powershell -Command "Expand-Archive -Path 'nssm.zip' -DestinationPath 'nssm_temp'" >nul 2>&1
    
    :: Mover nssm según arquitectura
    if exist "nssm_temp\nssm-2.24\win64\nssm.exe" (
        copy "nssm_temp\nssm-2.24\win64\nssm.exe" "%SystemRoot%\System32\nssm.exe" >nul
    ) else (
        copy "nssm_temp\nssm-2.24\win32\nssm.exe" "%SystemRoot%\System32\nssm.exe" >nul
    )
    
    :: Limpiar temporales
    del /f /q nssm.zip >nul 2>&1
    rmdir /s /q nssm_temp >nul 2>&1
)

echo [*] Registrando servicio 'GamaWhatsAppService' en Windows...
nssm stop GamaWhatsAppService >nul 2>&1
nssm remove GamaWhatsAppService confirm >nul 2>&1

:: Buscar la ruta de node.exe instalada en el sistema
for /f "delims=" %%i in ('where node') do set "NODE_PATH=%%i"

if "%NODE_PATH%"=="" (
    echo [ERROR] No se detecto Node.js instalado en el sistema.
    echo Por favor instala Node.js antes de continuar.
    echo.
    pause
    exit /b
)

:: Instalar el servicio con nssm
nssm install GamaWhatsAppService "%NODE_PATH%" "whatsapp_server.js"
nssm set GamaWhatsAppService AppDirectory "%CD%"
nssm set GamaWhatsAppService DisplayName "GAMA WhatsApp Service v3.0"
nssm set GamaWhatsAppService Description "Servidor de control y notificaciones automaticas para WhatsApp con tunel Cloudflare integrado"
nssm set GamaWhatsAppService Start SERVICE_AUTO_START

:: Configurar recuperacion automatica ante fallos
nssm set GamaWhatsAppService AppExit Default Restart
nssm set GamaWhatsAppService AppThrottle 1500

echo [*] Iniciando el servicio 'GAMA WhatsApp Service v3.0'...
nssm start GamaWhatsAppService >nul 2>&1

echo.
echo [OK] ¡Servicio instalado e iniciado exitosamente!
echo El servidor correra de forma invisible 24/7 y partira solo al prender Windows.
echo.
timeout /t 5 >nul
exit
