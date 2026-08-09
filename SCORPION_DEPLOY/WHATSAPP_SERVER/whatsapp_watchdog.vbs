Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
nodeExe = "node"
serverScript = scriptDir & "\whatsapp_server.js"
logFile = scriptDir & "\whatsapp_watchdog.log"

Do
    ' Verificar si el servidor responde
    On Error Resume Next
    Set http = CreateObject("MSXML2.XMLHTTP")
    http.Open "GET", "http://localhost:3015/api/status", False
    http.Send
    statusOk = (http.Status = 200)
    On Error GoTo 0

    If Not statusOk Then
        ' Matar processos node residuales
        WshShell.Run "taskkill /f /im node.exe", 0, True

        ' Esperar 5 segundos
        WScript.Sleep 5000

        ' Reiniciar servidor oculto
        WshShell.Run """" & nodeExe & """ """ & serverScript & """", 0, False

        ' Log
        Set logStream = fso.OpenTextFile(logFile, 8, True)
        logStream.WriteLine "[" & Now & "] Watchdog: Servidor reiniciado"
        logStream.Close
    End If

    ' Verificar cada 60 segundos
    WScript.Sleep 60000
Loop
