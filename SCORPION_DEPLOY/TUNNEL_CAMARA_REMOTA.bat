@echo off
chcp 65001 >nul
title GAMA SEGURIDAD — Tunnel Remoto de Camara (Cloudflare)

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║   GAMA SEGURIDAD - Acceso Remoto via Cloudflare Tunnel   ║
echo ║   Sin port forwarding. Sin IP publica. Sin router.       ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo REQUISITO: Primero ejecutar INSTALAR_CAMARA_REMOTA.bat
echo.

set INSTALL_DIR=C:\GAMA_CAMARA
set STREAM_ID=camgama
set CF_VERSION=2024.8.3

:: ────────────────────────────────────────────────────
echo [1/3] Descargando Cloudflare Tunnel (cloudflared)...

if exist "%INSTALL_DIR%\cloudflared.exe" (
    echo      OK cloudflared ya instalado.
) else (
    set CF_URL=https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%INSTALL_DIR%\cloudflared.exe' -UseBasicParsing"
    if errorlevel 1 (
        echo      ERROR descargando cloudflared.
        pause & exit /b 1
    )
    echo      OK cloudflared descargado.
)

:: ────────────────────────────────────────────────────
echo [2/3] Iniciando tunnel temporal hacia el stream local...
echo.
echo El tunnel se iniciara en la siguiente ventana.
echo Cuando aparezca una URL https://xxxx.trycloudflare.com
echo COPIE ESA URL y configurela en el Dashboard como CAM-01
echo.
echo La URL sera del tipo:
echo   https://xxxx.trycloudflare.com/%STREAM_ID%
echo.
echo Para un tunnel PERMANENTE (URL fija), necesita cuenta
echo gratuita en https://cloudflare.com y correr:
echo   cloudflared tunnel login
echo.

:: ────────────────────────────────────────────────────
echo [3/3] Lanzando tunnel...
echo.
echo === GUARDANDO URL DEL TUNNEL ===
start "Cloudflare Tunnel" /wait "%INSTALL_DIR%\cloudflared.exe" tunnel --url http://localhost:8889 --logfile "%INSTALL_DIR%\tunnel.log"

pause
