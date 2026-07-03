@echo off
title GAMA COMMAND CENTER - Instalacion Completa v3.0
color 0A
setlocal

set DESTINO=C:\SCORPION\BASES DE DATOS
set TAREA=GAMA_Sincronizador

echo.
echo =====================================================
21: echo   GAMA COMMAND CENTER - Instalador Completo v3.0
echo   (Ejecutar como Administrador)
echo =====================================================
echo.

:: ---- Verificar privilegios de Administrador ----
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Debes ejecutar este script como Administrador.
    echo Haz clic derecho sobre el archivo y selecciona "Ejecutar como Administrador".
    echo.
    pause
    exit /b 1
)

:: ---- Crear directorio destino si no existe ----
if not exist "%DESTINO%" (
    mkdir "%DESTINO%"
)

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
pip install supabase pyodbc requests --quiet
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

:: ---- Registrar Tarea Programada Perpetua (Al Iniciar Sesion del Usuario) ----
echo.
echo [4/5] Registrando inicio automatico perpetuo en Task Scheduler...

:: Eliminar registros previos en Run por si existían
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "%TAREA%" /f >nul 2>&1

:: Eliminar la tarea programada anterior para recrearla limpia
schtasks /delete /tn "%TAREA%" /f >nul 2>&1

:: Crear una tarea programada que arranca al iniciar sesión del usuario (ONLOGON)
:: con privilegios elevados para garantizar acceso total a la red física de AnyDesk
schtasks /create /tn "%TAREA%" /tr "wscript.exe \"%DESTINO%\iniciar_silencioso.vbs\"" /sc ONLOGON /rl HIGHEST /f
echo OK.

:: ---- Iniciar ahora mismo ----
echo.
echo [5/5] Iniciando el sincronizador en segundo plano...
taskkill /f /im pythonw.exe >nul 2>&1
schtasks /run /tn "%TAREA%"
echo OK.

echo.
echo =====================================================
echo   INSTALACION COMPLETADA (SERVICIO PERPETUO)
echo.
echo   El sincronizador se ha configurado como Tarea de Windows.
echo   Se ejecutara de forma invisible al encender el PC,
echo   sin importar si hay un usuario logueado o no.
echo.
echo   Para verificar: abre el Administrador de Tareas
echo   y busca el proceso "pythonw.exe" corriendo bajo SYSTEM/Admin.
echo =====================================================
echo.
pause
