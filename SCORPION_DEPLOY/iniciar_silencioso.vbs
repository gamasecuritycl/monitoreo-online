Dim oShell, oFSO, sLog, sScript, sPython
Set oShell = CreateObject("WScript.Shell")
Set oFSO   = CreateObject("Scripting.FileSystemObject")

sScript = "C:\SCORPION\BASES DE DATOS\sincronizador.py"
sLog    = "C:\SCORPION\BASES DE DATOS\_gama_log.txt"

sPython = ""

' Escanear carpetas de usuarios en C:\Users para encontrar Python instalado a nivel de usuario
If oFSO.FolderExists("C:\Users") Then
    Dim oFolder, oSubFolder, path
    Set oFolder = oFSO.GetFolder("C:\Users")
    For Each oSubFolder In oFolder.SubFolders
        If oSubFolder.Name <> "All Users" And oSubFolder.Name <> "Default" And oSubFolder.Name <> "Default User" And oSubFolder.Name <> "Public" Then
            ' Buscar en Python 3.12
            path = "C:\Users\" & oSubFolder.Name & "\AppData\Local\Programs\Python\Python312\python.exe"
            If oFSO.FileExists(path) Then
                sPython = path
                Exit For
            End If
            ' Buscar en Python 3.13
            path = "C:\Users\" & oSubFolder.Name & "\AppData\Local\Programs\Python\Python313\python.exe"
            If oFSO.FileExists(path) Then
                sPython = path
                Exit For
            End If
            ' Buscar en Python 3.11
            path = "C:\Users\" & oSubFolder.Name & "\AppData\Local\Programs\Python\Python311\python.exe"
            If oFSO.FileExists(path) Then
                sPython = path
                Exit For
            End If
        End If
    Next
End If

' Buscar en rutas globales si no se encontró en carpetas de usuario
If sPython = "" Then
    If oFSO.FileExists("C:\Python313\python.exe") Then
        sPython = "C:\Python313\python.exe"
    ElseIf oFSO.FileExists("C:\Python312\python.exe") Then
        sPython = "C:\Python312\python.exe"
    Else
        sPython = "python.exe"
    End If
End If

Dim sCmd
sCmd = """" & sPython & """ """ & sScript & """ >> """ & sLog & """ 2>&1"

oShell.Run "cmd /c " & sCmd, 0, False
