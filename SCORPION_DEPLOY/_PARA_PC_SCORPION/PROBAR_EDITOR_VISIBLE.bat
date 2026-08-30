@echo off
title GAMA SECURITY - PROBADOR EN VIVO EDITOR REMOTO
color 0A
cd /d "C:\SCORPION\BASES DE DATOS"
echo ========================================================
echo   GAMA SECURITY - PROBADOR EN VIVO EDITOR REMOTO
echo ========================================================
echo.

set PY_E=
for /d %%D in ("C:\Users\*") do (
    if exist "%%D\AppData\Local\Programs\Python\Python313\python.exe" set PY_E="%%D\AppData\Local\Programs\Python\Python313\python.exe"
    if exist "%%D\AppData\Local\Programs\Python\Python312\python.exe" set PY_E="%%D\AppData\Local\Programs\Python\Python312\python.exe"
    if exist "%%D\AppData\Local\Programs\Python\Python311\python.exe" set PY_E="%%D\AppData\Local\Programs\Python\Python311\python.exe"
)
if exist "C:\Python313\python.exe" set PY_E="C:\Python313\python.exe"
if exist "C:\Python312\python.exe" set PY_E="C:\Python312\python.exe"
if not defined PY_E set PY_E=python.exe

echo Ejecutando: %PY_E% editor_remoto.py
%PY_E% editor_remoto.py
pause
