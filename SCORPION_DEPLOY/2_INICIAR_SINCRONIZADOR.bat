@echo off
title GAMA COMMAND CENTER - Sincronizador ACTIVO
color 0A
echo.
echo =====================================================
echo   GAMA COMMAND CENTER - Sincronizador v5.1
echo   Conectando con Supabase...
echo   NO CERRAR ESTA VENTANA
echo =====================================================
echo.
cd /d "%~dp0"

:: Buscar python en rutas comunes
set PYTHON_EXE=
if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" set PYTHON_EXE="%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
if not defined PYTHON_EXE if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" set PYTHON_EXE="%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
if not defined PYTHON_EXE if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" set PYTHON_EXE="%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
if not defined PYTHON_EXE if exist "C:\Python313\python.exe" set PYTHON_EXE="C:\Python313\python.exe"
if not defined PYTHON_EXE if exist "C:\Python312\python.exe" set PYTHON_EXE="C:\Python312\python.exe"
if not defined PYTHON_EXE set PYTHON_EXE=python

echo Buscando Python...
echo Usando ejecutable: %PYTHON_EXE%
echo.

%PYTHON_EXE% sincronizador.py
echo.
echo [DETENIDO] El sincronizador se ha detenido.
pause
