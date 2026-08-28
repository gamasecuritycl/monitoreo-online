@echo off
title GAMA SECURITY - BUSCAR BASE DE DATOS DE PERSONAS AUTORIZADAS
color 0B
echo ══════════════════════════════════════════════════════════════════════
echo   GAMA SECURITY — BUSCADOR DE PERSONAS AUTORIZADAS EN SCORPION
echo ══════════════════════════════════════════════════════════════════════
echo.

set PY_DIR=
for /d %%D in ("C:\Users\*") do (
    if exist "%%D\AppData\Local\Programs\Python\Python313\python.exe" set PY_DIR=%%D\AppData\Local\Programs\Python\Python313
    if exist "%%D\AppData\Local\Programs\Python\Python312\python.exe" set PY_DIR=%%D\AppData\Local\Programs\Python\Python312
    if exist "%%D\AppData\Local\Programs\Python\Python311\python.exe" set PY_DIR=%%D\AppData\Local\Programs\Python\Python311
)
if exist "C:\Python313\python.exe" set PY_DIR=C:\Python313
if exist "C:\Python312\python.exe" set PY_DIR=C:\Python312

if not defined PY_DIR (
    set PY_CMD=python.exe
) else (
    set PY_CMD="%PY_DIR%\python.exe"
)

%PY_CMD% "%~dp0DESCUBRIR_AUTORIZADOS.py"
pause
