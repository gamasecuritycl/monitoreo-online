@echo off
echo ========================================
echo  VERIFICAR ESTADO WHATSAPP SERVER
echo ========================================
echo.

curl -s http://localhost:3015/api/status
echo.

if %errorlevel% equ 0 (
    echo.
    echo ✅ Servidor respondiendo correctamente
) else (
    echo.
    echo ❌ Servidor no responde - reiniciando...
    cscript //nologo "%~dp0whatsapp_hidden.vbs"
    timeout /t 5 >nul
    echo Servidor reiniciado
)

pause
