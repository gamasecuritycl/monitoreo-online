@echo off
title GAMA SEGURIDAD - Instalador de Camara Remota

echo ====================================================
echo GAMA SEGURIDAD - Instalador de Camara Remota
echo Camara IP: 192.168.1.30 (Dahua)
echo ====================================================
echo.

set CAMARA_IP=192.168.1.19
set CAMARA_USER=admin
set CAMARA_PASS=L2D55413
set STREAM_ID=camgama
set INSTALL_DIR=C:\GAMA_CAMARA
set MEDIAMTX_VERSION=v1.9.3

echo [1/4] Creando directorio %INSTALL_DIR%
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo [2/4] Descargando MediaMTX...
if exist "%INSTALL_DIR%\mediamtx.exe" (
    echo MediaMTX ya instalado.
) else (
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/bluenviron/mediamtx/releases/download/%MEDIAMTX_VERSION%/mediamtx_%MEDIAMTX_VERSION%_windows_amd64.zip' -OutFile '%INSTALL_DIR%\mediamtx.zip' -UseBasicParsing"
    if errorlevel 1 (
        echo ERROR: No se pudo descargar MediaMTX.
        pause
        exit /b 1
    )
    powershell -Command "Expand-Archive -Path '%INSTALL_DIR%\mediamtx.zip' -DestinationPath '%INSTALL_DIR%' -Force"
    del /q "%INSTALL_DIR%\mediamtx.zip"
)

echo [3/4] Generando configuracion mediamtx.yml...
(
echo logLevel: warn
echo rtspAddress: :8554
echo rtmpAddress: :1935
echo hlsAddress: :8888
echo webrtcAddress: :8889
echo.
echo paths:
echo   %STREAM_ID%:
echo     source: "rtsp://%CAMARA_USER%:%CAMARA_PASS%@%CAMARA_IP%:554/cam/realmonitor?channel=1&subtype=1"
echo     sourceOnDemand: no
echo     record: no
) > "%INSTALL_DIR%\mediamtx.yml"

echo [4/4] Iniciando MediaMTX localmente...
echo ----------------------------------------------------
echo MediaMTX esta iniciando. Deje esta ventana abierta.
echo Si se cierra, la transmision de la camara se detendra.
echo ----------------------------------------------------
echo Abriendo vista previa local en el navegador...
start "" "http://localhost:8889/%STREAM_ID%"
echo.

cd /d "%INSTALL_DIR%"
mediamtx.exe mediamtx.yml
pause
