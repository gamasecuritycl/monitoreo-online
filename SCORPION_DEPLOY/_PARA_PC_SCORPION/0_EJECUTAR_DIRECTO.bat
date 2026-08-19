@echo off
title PROBAR SINCRONIZACION DIRECTA
color 0A
echo ========================================================
echo  EJECUCION DE PRUEBA DIRECTA DE SINCRONIZADOR
echo ========================================================
echo.
cd /d "C:\SCORPION\BASES DE DATOS"

set PY_E=python.exe
for /d %%D in ("C:\Users\*") do (
    if exist "%%D\AppData\Local\Programs\Python\Python313\python.exe" set PY_E="%%D\AppData\Local\Programs\Python\Python313\python.exe"
    if exist "%%D\AppData\Local\Programs\Python\Python312\python.exe" set PY_E="%%D\AppData\Local\Programs\Python\Python312\python.exe"
)

echo Usando Python: %PY_E%
echo.
%PY_E% "C:\SCORPION\BASES DE DATOS\sincronizador.py"
pause
