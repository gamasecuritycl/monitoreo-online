@echo off
title GAMA - Instalacion de dependencias
color 0A
echo.
echo =====================================================
echo   GAMA COMMAND CENTER - Instalacion
echo =====================================================
echo.
echo Verificando Python...
python --version
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Python no esta instalado o no esta en PATH.
    echo Por favor instala Python desde: https://www.python.org/downloads/
    echo IMPORTANTE: Marca la opcion "Add Python to PATH" durante la instalacion.
    echo.
    pause
    exit /b 1
)

echo.
echo Instalando dependencias...
pip install supabase pyodbc

echo.
echo =====================================================
echo   Instalacion completada exitosamente!
echo   Ahora ejecuta: INICIAR_SINCRONIZADOR.bat
echo =====================================================
echo.
pause
