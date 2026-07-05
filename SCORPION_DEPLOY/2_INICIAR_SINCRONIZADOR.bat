@echo off
title GAMA COMMAND CENTER - Sincronizador ACTIVO
color 0A
echo.
echo =====================================================
echo   GAMA COMMAND CENTER - Sincronizador v5.2
echo   Iniciando en segundo plano (sin ventanas)...
echo =====================================================
echo.
cd /d "%~dp0"

:: Buscar pythonw.exe en rutas comunes
set PYTHONW=
if exist "%LOCALAPPDATA%\Programs\Python\Python313\pythonw.exe" set PYTHONW=%LOCALAPPDATA%\Programs\Python\Python313\pythonw.exe
if not defined PYTHONW if exist "%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe" set PYTHONW=%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe
if not defined PYTHONW if exist "%LOCALAPPDATA%\Programs\Python\Python311\pythonw.exe" set PYTHONW=%LOCALAPPDATA%\Programs\Python\Python311\pythonw.exe
if not defined PYTHONW if exist "C:\Python313\pythonw.exe" set PYTHONW=C:\Python313\pythonw.exe
if not defined PYTHONW if exist "C:\Python312\pythonw.exe" set PYTHONW=C:\Python312\pythonw.exe
if not defined PYTHONW set PYTHONW=pythonw.exe

echo Buscando Python...
echo Usando: %PYTHONW%
echo.
echo El sincronizador se ejecuta en segundo plano.
echo Para verificar: Task Manager ^> pythonw.exe
echo.

:: Ejecutar invisible con pythonw.exe
start "" "%PYTHONW%" "%~dp0sincronizador.py"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo al iniciar.
    pause
    exit /b 1
)
echo Sincronizador iniciado correctamente.
echo.
