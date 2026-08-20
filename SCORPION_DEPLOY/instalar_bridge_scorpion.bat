@echo off
chcp 65001 >nul
title GAMA SEGURIDAD - Instalador Bridge Dahua P2P (PC Scorpion)
color 0A

:: ============================================================================
::  INSTALADOR AUTOMÁTICO - BRIDGE DAHUA P2P PARA PC SCORPION
::  Ejecutar: CLIC DERECHO -> "Ejecutar como ADMINISTRADOR"
:: ============================================================================

echo.
echo  ╔══════════════════════════════════════════════════════════════════╗
echo  ║   GAMA SEGURIDAD - Instalador Bridge Dahua P2P v2.1            ║
echo  ║   PC Scorpion (24/7) - Servicio Windows Silencioso             ║
echo  ╚═════════════════════════════════════════════════════════════════╝
echo.

:: ---------------------------------------------------------------------------
:: 1. VERIFICAR PERMISOS DE ADMINISTRADOR
:: ---------------------------------------------------------------------------
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Debes ejecutar como ADMINISTRADOR.
    echo.
    echo Clic derecho en este archivo ^> "Ejecutar como administrador"
    pause
    exit /b 1
)
echo [OK] Permisos de Administrador confirmados.

:: ---------------------------------------------------------------------------
:: 2. DETECTAR DIRECTORIO DE INSTALACIÓN (donde está este .bat)
:: ---------------------------------------------------------------------------
set "INSTALL_DIR=%~dp0"
if not exist "%INSTALL_DIR%dahua_p2p_bridge.py" (
    echo [ERROR] No se encuentra dahua_p2p_bridge.py junto a este instalador.
    echo Coloca este .bat en la carpeta SCORPION_DEPLOY.
    pause
    exit /b 1
)
echo [OK] Directorio de instalación: %INSTALL_DIR%

:: ---------------------------------------------------------------------------
:: 3. VERIFICAR / INSTALAR PYTHON
:: ---------------------------------------------------------------------------
echo.
echo [1/6] Verificando Python...
where python >nul 2>&1
if %errorLevel% neq 0 (
    echo [WARN] Python no encontrado en PATH. Instalando via winget...
    winget install -e --id Python.Python.3.11 --silent --accept-source-agreements --accept-package-agreements
    if %errorLevel% neq 0 (
        echo [ERROR] Fallo instalando Python. Instala manualmente de python.org (marcar 'Add to PATH').
        pause
        exit /b 1
    )
    :: Refrescar PATH
    refreshenv >nul 2>&1
)
python --version
echo [OK] Python detectado.

:: ---------------------------------------------------------------------------
:: 4. INSTALAR LIBRERÍAS PYTHON
:: ---------------------------------------------------------------------------
echo.
echo [2/6] Instalando librerías (requests, supabase, pywin32)...
python -m pip install --upgrade pip >nul 2>&1
python -m pip install requests supabase pywin32 --quiet
if %errorLevel% neq 0 (
    echo [ERROR] Fallo instalando librerías. Verifica conexión a Internet.
    pause
    exit /b 1
)
echo [OK] Librerías listas.

:: ---------------------------------------------------------------------------
:: 5. VERIFICAR DLLs DAHUA SDK (OPCIONAL PERO RECOMENDADO)
:: ---------------------------------------------------------------------------
echo.
echo [3/6] Verificando DLLs Dahua SDK (para fallback nativo)... 
set "DLL_64=%INSTALL_DIR%dhnetsdk_x64.dll"
set "DLL_32=%INSTALL_DIR%dhnetsdk.dll"
if exist "%DLL_64%" (
    echo [OK] dhnetsdk_x64.dll encontrada (64-bit).
) else if exist "%DLL_32%" (
    echo [OK] dhnetsdk.dll encontrada (32-bit).
) else (
    echo [WARN] No se encontraron DLLs Dahua SDK.
    echo         El bridge funcionará SOLO con HTTP/P2P (sin fallback SDK nativo).
    echo         Para máximo rendimiento, copia dhnetsdk_x64.dll aquí.
)

:: ---------------------------------------------------------------------------
:: 6. CONFIGURAR IP CÁMARA C701 EN SUPABASE (AUTOMÁTICO)
:: ---------------------------------------------------------------------------
echo.
echo [4/6] Registrando cámara C701 (SN: AE0970BPAG00815) en Supabase...
curl -s -X PATCH "https://onxwyrwmpjxtwlmjrosr.supabase.co/rest/v1/eventos_monitoreo?cuenta=eq.CAMARAS_DAHUA_C701" ^
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs" ^
  -H "Content-Type: application/json" ^
  -H "Prefer: return=minimal" ^
  -d "{\"nombre_abonado\":\"[{\\\"id\\\":\\\"DH-C701-1\\\",\\\"nombre\\\":\\\"CAMARA ACCESO PRINCIPAL P2P\\\",\\\"serialNumber\\\":\\\"AE0970BPAG00815\\\",\\\"usuario\\\":\\\"admin\\\",\\\"password\\\":\\\"L2D55413\\\",\\\"canal\\\":1,\\\"substream\\\":true,\\\"activa\\\":true,\\\"local_ip\\\":\\\"192.168.1.2\\\"}]\"}" >nul
if %errorLevel% equ 0 (
    echo [OK] Cámara C701 registrada/actualizada en Supabase.
) else (
    echo [WARN] No se pudo actualizar Supabase (¿Internet?). El bridge leerá config local si existe.
)

:: ---------------------------------------------------------------------------
:: 7. CREAR VBS SILENCIOSO (SIN VENTANA CONSOLA)
:: ---------------------------------------------------------------------------
echo.
echo [5/6] Creando launcher silencioso (iniciar_bridge_silencioso.vbs)...
set "VBS_PATH=%INSTALL_DIR%iniciar_bridge_silencioso.vbs"
(
    echo Set WshShell = CreateObject("WScript.Shell")
    echo WshShell.CurrentDirectory = "%INSTALL_DIR:\=\\%"
    echo WshShell.Run "pythonw.exe dahua_p2p_bridge.py", 0, False
) > "%VBS_PATH%"
echo [OK] VBS creado: %VBS_PATH%

:: ---------------------------------------------------------------------------
:: 8. REGISTRAR EN PROGRAMADOR DE TAREAS (AUTO-START SILENCIOSO)
:: ---------------------------------------------------------------------------
echo.
echo [6/6] Registrando en Programador de Tareas (Inicio de sesión, máx. privilegios)...
set "TASK_NAME=GamaDahuaBridge"
schtasks /Query /TN "%TASK_NAME%" >nul 2>&1
if %errorLevel% equ 0 (
    echo [INFO] Tarea existente encontrada. Actualizando...
    schtasks /Delete /TN "%TASK_NAME%" /F >nul
)
schtasks /Create ^
    /TN "%TASK_NAME%" ^
    /TR "wscript.exe \"%VBS_PATH%\"" ^
    /SC ONLOGON ^
    /RL HIGHEST ^
    /F >nul
if %errorLevel% equ 0 (
    echo [OK] Tarea programada creada. El bridge arrancará solo al iniciar Windows.
) else (
    echo [ERROR] No se pudo crear la tarea. Ejecuta manualmente: wscript.exe "%VBS_PATH%"
)

:: ---------------------------------------------------------------------------
:: 9. ARRANCAR AHORA (PARA PROBAR)
:: ---------------------------------------------------------------------------
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║  INSTALACIÓN COMPLETA                                          ║
echo ╠══════════════════════════════════════════════════════════════════╣
echo ║  El bridge está listo. ¿Arrancarlo AHORA para probar?          ║
echo ║  (Se abrirá ventana de consola temporal para ver logs)         ║
echo ╚══════════════════════════════════════════════════════════════════╝
choice /C SN /M "Arrancar bridge ahora? (S/N): "
if "%ERRORLEVEL%"=="1" (
    echo.
    echo [INFO] Iniciando bridge en modo visible (para ver logs)... 
    echo [INFO] Presiona Ctrl+C en esa ventana para detener.
    echo.
    start "GamaDahuaBridge" cmd /k "cd /d "%INSTALL_DIR%" && python dahua_p2p_bridge.py"
    timeout /t 3 >nul
    echo.
    echo [PRUEBA] Abre en tu navegador (desde CUALQUIER PC): 
    echo          http://%COMPUTERNAME%:8000/status
    echo.
    echo Deberías ver JSON con "workers_active": ["AE0970BPAG00815_1"]
)
echo.
echo Para uso 24/7 silencioso: Reinicia el PC o ejecuta manualmente:
echo   wscript.exe "%VBS_PATH%"
echo.
pause