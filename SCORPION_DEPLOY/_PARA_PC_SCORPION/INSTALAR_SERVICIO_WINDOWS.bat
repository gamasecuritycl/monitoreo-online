@echo off
title INSTALAR SERVICIO NATIVO WINDOWS - GAMA MONITOREO 24/7
color 0A
echo =======================================================================
echo   GAMA SECURITY — INSTALACION DE SERVICIO NATIVO WINDOWS 24/7
echo =======================================================================
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Por favor ejecuta este archivo haciendo Clic Derecho -> Ejecutar como Administrador.
    pause
    exit /b 1
)

set BASE=C:\SCORPION\BASES DE DATOS\SCORPION_DEPLOY
set SCRIPT_PY=%BASE%\sincronizador.py
if not exist "%SCRIPT_PY%" set SCRIPT_PY=C:\SCORPION\BASES DE DATOS\sincronizador.py

:: 1. Buscar ejecutable de Python
set PY_EXE=pythonw.exe
if exist "C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python313\pythonw.exe" set PY_EXE="C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python313\pythonw.exe"
if exist "C:\Users\tetor\AppData\Local\Programs\Python\Python313\pythonw.exe" set PY_EXE="C:\Users\tetor\AppData\Local\Programs\Python\Python313\pythonw.exe"
if exist "C:\Python313\pythonw.exe" set PY_EXE="C:\Python313\pythonw.exe"

:: 2. Registrar Servicio / Tarea a nivel de Sistema (SYSTEM / HIGHEST)
echo Registrando servicio nativo GAMA_Sincronizador_SYSTEM...
schtasks /create /tn "GAMA_Sincronizador_SYSTEM" /tr "%PY_EXE% \"%SCRIPT_PY%\"" /sc ONSTART /ru "SYSTEM" /rl HIGHEST /f >nul 2>&1

:: 3. Iniciar el servicio de inmediato
schtasks /run /tn "GAMA_Sincronizador_SYSTEM" >nul 2>&1

echo.
echo =======================================================================
echo   ✓ SERVICIO NATIVO INSTALADO Y ACTIVADO CON EXITO
echo   - Transmite señales en segundo plano sin mostrar ventanas.
echo   - Inicia solo al encender la PC antes del login de usuarios.
echo   - Inmune a cierres accidentales o cambios de usuario.
echo =======================================================================
echo.
pause
