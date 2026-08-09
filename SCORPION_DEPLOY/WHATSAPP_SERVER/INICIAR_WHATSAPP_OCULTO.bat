@echo off
echo Iniciando WhatsApp Server en segundo plano...
cscript //nologo "%~dp0whatsapp_hidden.vbs"
timeout /t 2 >nul
echo Verificando estado...
curl -s http://localhost:3015/api/status >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ WhatsApp Server iniciado correctamente
    echo Puerto: 3015
    echo Estado: http://localhost:3015
) else (
    echo ⚠️ El servidor puede estar iniciando, espera unos segundos
)
pause
