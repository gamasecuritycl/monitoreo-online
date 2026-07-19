Set WshShell = CreateObject("WScript.Shell")
scriptPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
dashboardPath = scriptPath & "\..\dashboard"
WshShell.CurrentDirectory = dashboardPath
WshShell.Run "cmd /c node whatsapp_server.js", 0, False
