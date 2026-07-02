@echo off
title GAMA COMMAND CENTER - Instalacion Completa
color 0A
setlocal

set DESTINO=C:\SCORPION\BASES DE DATOS
set TAREA=GAMA_Sincronizador

echo.
echo =====================================================
echo   GAMA COMMAND CENTER - Instalador Completo
echo   (Ejecutar como Administrador)
echo =====================================================
echo.

:: ---- Verificar Python ----
echo [1/5] Verificando Python...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Python no esta instalado.
    echo Descargalo desde: https://www.python.org/downloads/
    echo IMPORTANTE: Marca "Add Python to PATH" al instalar.
    echo.
    pause
    exit /b 1
)
python --version
echo OK.

:: ---- Instalar dependencias ----
echo.
echo [2/5] Instalando dependencias Python...
pip install supabase pyodbc --quiet
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo la instalacion de dependencias.
    pause
    exit /b 1
)
echo OK.

:: ---- Copiar archivos al destino ----
echo.
echo [3/5] Copiando archivos a "%DESTINO%"...
copy /Y "%~dp0sincronizador.py"      "%DESTINO%\sincronizador.py"      >nul
copy /Y "%~dp0iniciar_silencioso.vbs" "%DESTINO%\iniciar_silencioso.vbs" >nul
echo OK.

:: ---- Registrar en el Registro de Windows (Inicio Automático) ----
echo.
echo [4/5] Registrando inicio automatico en el Registro de Windows...

:: Eliminar tarea programada anterior para evitar conflictos
schtasks /delete /tn "%TAREA%" /f >nul 2>&1

:: Agregar clave Run al Registro de Windows para el usuario actual
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "%TAREA%" /t REG_SZ /d "wscript.exe \"%DESTINO%\iniciar_silencioso.vbs\"" /f >nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] No se pudo registrar en el Registro de Windows.
    pause
    exit /b 1
)
echo OK.

:: ---- Iniciar ahora mismo ----
echo.
echo [5/5] Iniciando el sincronizador en segundo plano...
:: Matar procesos pythonw o wscript anteriores que estén corriendo de este script
taskkill /IM wscript.exe /FI "WINDOWTITLE eq %TAREA%*" /F >nul 2>&1
start "" wscript.exe "%DESTINO%\iniciar_silencioso.vbs"
echo OK.

echo.
echo =====================================================
echo   INSTALACION COMPLETADA
echo.
echo   El sincronizador esta corriendo en segundo plano.
echo   Arrancara automaticamente cada vez que
echo   se encienda o reinicie este PC.
echo.
echo   Para verificar: abre el Administrador de Tareas
echo   y busca el proceso "pythonw.exe"
echo =====================================================
echo.
pause
