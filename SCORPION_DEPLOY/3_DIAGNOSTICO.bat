@echo off
title GAMA COMMAND CENTER - Diagnostico de MDBs
color 0B
echo.
echo =====================================================
echo   GAMA COMMAND CENTER - Diagnostico de MDBs
echo =====================================================
echo.

:: Buscar python en rutas comunes
set PYTHON_EXE=
if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" set PYTHON_EXE="%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
if not defined PYTHON_EXE if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" set PYTHON_EXE="%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
if not defined PYTHON_EXE if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" set PYTHON_EXE="%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
if not defined PYTHON_EXE if exist "C:\Python313\python.exe" set PYTHON_EXE="C:\Python313\python.exe"
if not defined PYTHON_EXE if exist "C:\Python312\python.exe" set PYTHON_EXE="C:\Python312\python.exe"
if not defined PYTHON_EXE set PYTHON_EXE=python

cd /d "%~dp0"
%PYTHON_EXE% sincronizador_diagnostico.py
