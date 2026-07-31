@echo off
title GAMA SEGURIDAD - INICIADOR NATIVO DAHUA P2P NETSDK
color 0A
echo =========================================================================
echo  GAMA SEGURIDAD - INICIADOR NATIVO DAHUA P2P NETSDK ENGINE ($0 COST NAT)
echo =========================================================================
echo.
echo  Iniciando servidor de túneles P2P Dahua por Número de Serie (SN)...
echo  Librerías C/C++ NetSDK: dhnetsdk.dll
echo.

cd /d "%~dp0"

where py >nul 2>&1
if %errorlevel% equ 0 (
    py dahua_p2p_bridge.py
) else (
    python dahua_p2p_bridge.py
)

pause
