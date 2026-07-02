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

:: ---- Registrar tarea en el Programador de Windows ----
echo.
echo [4/5] Registrando tarea de inicio automatico...

:: Eliminar tarea previa si existe
schtasks /delete /tn "%TAREA%" /f >nul 2>&1

:: Crear nueva tarea: arranca con el sistema, para cualquier usuario
schtasks /create ^
  /tn "%TAREA%" ^
  /tr "wscript.exe \"%DESTINO%\iniciar_silencioso.vbs\"" ^
  /sc ONLOGON ^
  /rl HIGHEST ^
  /f
echo OK.

:: ---- Iniciar ahora mismo ----
echo.
echo [5/5] Iniciando el sincronizador ahora...
schtasks /run /tn "%TAREA%"
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
