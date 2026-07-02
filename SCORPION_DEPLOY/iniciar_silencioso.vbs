Dim oShell, oFSO, sLog, sScript, sPython
Set oShell = CreateObject("WScript.Shell")
Set oFSO   = CreateObject("Scripting.FileSystemObject")

sScript = "C:\SCORPION\BASES DE DATOS\sincronizador.py"
sLog    = "C:\SCORPION\BASES DE DATOS\_gama_log.txt"

' Buscar python en rutas comunes
Dim rutas(4)
rutas(0) = oShell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Programs\Python\Python313\python.exe"
rutas(1) = oShell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Programs\Python\Python312\python.exe"
rutas(2) = oShell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Programs\Python\Python311\python.exe"
rutas(3) = "C:\Python313\python.exe"
rutas(4) = "C:\Python312\python.exe"

sPython = ""
Dim i
For i = 0 To 4
    If oFSO.FileExists(rutas(i)) Then
        sPython = rutas(i)
        Exit For
    End If
Next

' Si no se encontró, usar python del PATH
If sPython = "" Then sPython = "python.exe"

Dim sCmd
sCmd = """" & sPython & """ """ & sScript & """ >> """ & sLog & """ 2>&1"

oShell.Run "cmd /c " & sCmd, 0, False
