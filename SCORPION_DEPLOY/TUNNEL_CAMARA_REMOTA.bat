@echo off
title GAMA SEGURIDAD - Tunnel Remoto de Camara

echo ====================================================
echo GAMA SEGURIDAD - Acceso Remoto via Cloudflare Tunnel
echo Sin configurar puertos en el router.
echo ====================================================
echo.
echo Requisito: Primero correr INSTALAR_CAMARA_REMOTA.bat
echo.

set INSTALL_DIR=C:\GAMA_CAMARA
set STREAM_ID=camgama

echo [1/3] Verificando cloudflared...
if exist "%INSTALL_DIR%\cloudflared.exe" (
    echo cloudflared ya descargado.
) else (
    echo Descargando cloudflared...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%INSTALL_DIR%\cloudflared.exe' -UseBasicParsing"
    if errorlevel 1 (
        echo ERROR: No se pudo descargar cloudflared.
        pause
        exit /b 1
    )
)

echo [2/3] Iniciando tunnel temporal...
echo ----------------------------------------------------
echo Busque una linea que diga:
echo.
echo   https://xxxx-xxxx-xxxx.trycloudflare.com
echo.
echo Copie esa URL completa. Su camara estara en:
echo   https://xxxx-xxxx-xxxx.trycloudflare.com/%STREAM_ID%
echo ----------------------------------------------------
echo.

cd /d "%INSTALL_DIR%"
cloudflared.exe tunnel --url http://localhost:8889
pause
