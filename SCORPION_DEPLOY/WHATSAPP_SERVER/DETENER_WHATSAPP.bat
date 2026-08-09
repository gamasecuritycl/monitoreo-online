@echo off
echo Deteniendo WhatsApp Server...
taskkill /f /im node.exe /fi "WINDOWTITLE eq whatsapp_server.js" >nul 2>&1
taskkill /f /im node.exe /fi "WINDOWTITLE eq *whatsapp*" >nul 2>&1
echo WhatsApp Server detenido
pause
