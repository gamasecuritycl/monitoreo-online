@echo off
chcp 65001 >nul
title GAMA SEGURIDAD — Instalador de Cámara Remota

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║     GAMA SEGURIDAD - Instalador de Cámara Remota        ║
echo ║     Cámara: 192.168.1.30 (Dahua)                        ║
echo ║     Destino: cloud.gamasecurity.cl                       ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: ────────────────────────────────────────────────────
::  CONFIGURACIÓN — Editar si cambia la cámara
:: ────────────────────────────────────────────────────
set CAMARA_IP=192.168.1.30
set CAMARA_USER=admin
set CAMARA_PASS=L2D55413
set STREAM_ID=camgama

:: Carpeta de instalación
set INSTALL_DIR=C:\GAMA_CAMARA
set MEDIAMTX_VERSION=v1.9.3
set MEDIAMTX_URL=https://github.com/bluenviron/mediamtx/releases/download/%MEDIAMTX_VERSION%/mediamtx_%MEDIAMTX_VERSION%_windows_amd64.zip

:: ────────────────────────────────────────────────────
echo [1/5] Creando carpeta de instalacion...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
cd /d "%INSTALL_DIR%"
echo      OK Carpeta: %INSTALL_DIR%

:: ────────────────────────────────────────────────────
echo [2/5] Descargando MediaMTX %MEDIAMTX_VERSION%...

if exist "%INSTALL_DIR%\mediamtx.exe" (
    echo      OK MediaMTX ya instalado, omitiendo descarga.
) else (
    powershell -Command "Invoke-WebRequest -Uri '%MEDIAMTX_URL%' -OutFile '%INSTALL_DIR%\mediamtx.zip' -UseBasicParsing"
    if errorlevel 1 (
        echo      ERROR: No se pudo descargar MediaMTX. Verifique internet.
        pause & exit /b 1
    )
    powershell -Command "Expand-Archive -Path '%INSTALL_DIR%\mediamtx.zip' -DestinationPath '%INSTALL_DIR%' -Force"
    del /q "%INSTALL_DIR%\mediamtx.zip"
    echo      OK MediaMTX descargado y extraido.
)

:: ────────────────────────────────────────────────────
echo [3/5] Generando configuracion mediamtx.yml...

(
echo logLevel: warn
echo rtspAddress: :8554
echo rtmpAddress: :1935
echo hlsAddress: :8888
echo webrtcAddress: :8889
echo.
echo paths:
echo   %STREAM_ID%:
echo     source: "rtsp://%CAMARA_USER%:%CAMARA_PASS%@%CAMARA_IP%:554/cam/realmonitor?channel=1^&subtype=0"
echo     sourceOnDemand: no
echo     sourceReconnectPeriod: 5s
echo     record: no
) > "%INSTALL_DIR%\mediamtx.yml"

echo      OK Configuracion generada.

:: ────────────────────────────────────────────────────
echo [4/5] Instalando como servicio de Windows...

sc query "GamaStream" >nul 2>&1
if not errorlevel 1 (
    echo      Servicio existente, actualizando...
    sc stop "GamaStream" >nul 2>&1
    sc delete "GamaStream" >nul 2>&1
    timeout /t 2 /nobreak >nul
)

sc create "GamaStream" binPath= "\"%INSTALL_DIR%\mediamtx.exe\" \"%INSTALL_DIR%\mediamtx.yml\"" DisplayName= "Gama Seguridad - Camera Stream" start= auto obj= LocalSystem
if errorlevel 1 (
    echo      ADVERTENCIA: Ejecutar como Administrador para instalar servicio.
    echo      Iniciando en modo manual...
) else (
    sc start "GamaStream" >nul
    echo      OK Servicio GamaStream instalado e iniciado automaticamente.
)

:: ────────────────────────────────────────────────────
echo [5/5] Obteniendo IP publica de esta maquina...
for /f "tokens=*" %%i in ('powershell -Command "(Invoke-WebRequest -Uri ifconfig.me -UseBasicParsing).Content.Trim()"') do set PUBLIC_IP=%%i
echo      OK IP Publica: %PUBLIC_IP%

:: ────────────────────────────────────────────────────
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                   INSTALACION COMPLETA                       ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║                                                              ║
echo ║  PASO SIGUIENTE - Configurar en el Dashboard:               ║
echo ║                                                              ║
echo ║  1. Abrir ExpedienteModal de su abonado                     ║
echo ║  2. Ir a pestana CAMARA DE VERIFICACION                     ║
echo ║  3. Clic en boton CONFIGURAR                                ║
echo ║  4. En CAM-01 ingresar UNA de estas URLs:                   ║
echo ║                                                              ║
echo ║     - Misma red local:                                       ║
echo ║       http://localhost:8889/%STREAM_ID%                      ║
echo ║                                                              ║
echo ║     - Desde internet (abrir puerto 8889 en router):          ║
echo ║       http://%PUBLIC_IP%:8889/%STREAM_ID%                    ║
echo ║                                                              ║
echo ║  IMPORTANTE: Para acceso REMOTO debe abrir el               ║
echo ║  puerto 8889 TCP en el router de la red 192.168.1.x         ║
echo ║  apuntando a la IP de ESTE PC.                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Abriendo test local del stream...
start "" "http://localhost:8889/%STREAM_ID%"
echo.
pause
