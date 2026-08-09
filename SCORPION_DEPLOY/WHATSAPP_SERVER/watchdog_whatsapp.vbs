/**
 * ═══════════════════════════════════════════════════════════════════════
 *  GAMA SEGURIDAD - WATCHDOG DEFINITIVO WhatsApp Server
 *  Verifica cada 30s si el servidor responde en puerto 3015
 *  Si no responde → mata node viejo → reinicia → log
 *  Ejecutar con: cscript //B watchdog_whatsapp.vbs
 * ═══════════════════════════════════════════════════════════════════════
 */

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' ── CONFIGURACIÓN ──
WATCHDOG_DIR = "C:\SCORPION\BASES DE DATOS\WHATSAPP_SERVER"
NODE_EXE = "node"
SERVER_SCRIPT = WATCHDOG_DIR & "\whatsapp_server.js"
LOG_FILE = WATCHDOG_DIR & "\watchdog_whatsapp.log"
PORT = 3015
CHECK_INTERVAL = 30000  ' 30 segundos
FAIL_THRESHOLD = 2      ' Reiniciar tras 2 fallos consecutivos

failCount = 0

Sub WriteLog(msg)
    On Error Resume Next
    Set logStream = fso.OpenTextFile(LOG_FILE, 8, True)
    logStream.WriteLine "[" & Now & "] " & msg
    logStream.Close
    On Error GoTo 0
End Sub

Function IsServerRunning()
    On Error Resume Next
    Set http = CreateObject("MSXML2.XMLHTTP")
    http.Open "GET", "http://localhost:" & PORT & "/api/status", False
    http.setTimeouts 5000, 5000, 5000, 10000
    http.Send
    If Err.Number = 0 And http.Status = 200 Then
        IsServerRunning = True
    Else
        IsServerRunning = False
    End If
    Set http = Nothing
    On Error GoTo 0
End Function

Sub KillNode()
    On Error Resume Next
    WshShell.Run "taskkill /f /im node.exe", 0, True
    WScript.Sleep 3000
    On Error GoTo 0
End Sub

Sub StartServer()
    On Error Resume Next
    ' Matar procesos node residuales primero
    WshShell.Run "taskkill /f /im node.exe", 0, True
    WScript.Sleep 2000
    
    ' Iniciar servidor oculto
    WshShell.Run "cmd /c cd /d """ & WATCHDOG_DIR & """ && start /min """ & NODE_EXE & """ """ & SERVER_SCRIPT & """", 0, False
    WScript.Sleep 5000
    On Error GoTo 0
End Sub

' ── LOOP PRINCIPAL ──
WriteLog "═══ WATCHDOG INICIADO ═══ Puerto: " & PORT

Do
    If IsServerRunning() Then
        failCount = 0
    Else
        failCount = failCount + 1
        WriteLog "⚠️ Servidor NO responde (fallo " & failCount & "/" & FAIL_THRESHOLD & ")"
        
        If failCount >= FAIL_THRESHOLD Then
            WriteLog "🔄 Reiniciando servidor..."
            KillNode
            StartServer
            
            ' Verificar que arrancó
            WScript.Sleep 15000
            If IsServerRunning() Then
                WriteLog "✅ Servidor reiniciado correctamente"
                failCount = 0
            Else
                WriteLog "❌ Servidor NO arrancó tras reinicio"
            End If
        End If
    End If
    
    WScript.Sleep CHECK_INTERVAL
Loop
