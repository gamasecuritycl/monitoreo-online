Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Rutas
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
nodeExe = "node"
serverScript = scriptDir & "\whatsapp_server.js"
logFile = scriptDir & "\whatsapp_hidden.log"

' Ejecutar node oculto (ventana 0 = oculta)
WshShell.Run """" & nodeExe & """ """ & serverScript & """", 0, False

' Registrar inicio
Set logStream = fso.OpenTextFile(logFile, 8, True)
logStream.WriteLine "[" & Now & "] WhatsApp Server iniciado (oculto)"
logStream.Close
