@echo off
:: Ejecutar vía Tarea Programada con Máximos Privilegios (Bypass UAC - Sin cartel de "SÍ")
schtasks /run /tn "GAMA_Reiniciar_Scorpion" >nul 2>&1
if %errorlevel% neq 0 (
    :: Fallback en caso de ejecucion manual directa
    start "" wscript.exe //B "%~dp0REINICIAR_SCORPION_COMPLETO.vbs"
)
exit
