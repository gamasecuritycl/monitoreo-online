@echo off
title GAMA SEGURIDAD - Bridge Dahua LAN
color 0A
echo ==============================================
echo   GAMA SEGURIDAD - Bridge Dahua LAN v2.3
echo   Instalacion PC Casa
echo ==============================================
echo.

:: Verificar Admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Ejecutar como ADMINISTRADOR
    pause
    exit /b 1
)
echo [OK] Admin OK

:: Verificar VBS
set VBS=%~dp0iniciar_bridge.vbs
if not exist "%VBS%" (
    echo [ERROR] No se encuentra %VBS%
    pause
    exit /b 1
)
echo [OK] VBS encontrado

:: Registrar tarea programada
echo.
echo [1/2] Registrando inicio automatico...
schtasks /Query /TN "GamaDahuaBridge" >nul 2>&1
if %errorLevel% equ 0 (
    schtasks /Delete /TN "GamaDahuaBridge" /F >nul
)
schtasks /Create /TN "GamaDahuaBridge" /TR "wscript.exe \"%VBS%\"" /SC ONLOGON /RL HIGHEST /F >nul
if %errorLevel% equ 0 (
    echo [OK] Bridge arrancara automaticamente al iniciar sesion
) else (
    echo [ERROR] No se pudo crear la tarea programada
)

:: Iniciar ahora
echo.
echo [2/2] Iniciando bridge ahora...
wscript.exe "%VBS%"
timeout /t 5 >nul
echo [OK] Bridge iniciado en background
echo.
echo ==============================================
echo  LISTO!
echo ==============================================
echo.
echo  Prueba camara C701:
echo    http://localhost:8000/snapshot?sn=AE0970BPAG00815^&canal=1^&user=admin^&pass=L2D55413
echo.
echo  Dashboard:
echo    https://dashboard-eight-sable-51.vercel.app/app
echo.
pause
