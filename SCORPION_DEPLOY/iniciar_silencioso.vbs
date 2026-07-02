Dim oShell, oFSO, sScript, sPython
Set oShell = CreateObject("WScript.Shell")
Set oFSO   = CreateObject("Scripting.FileSystemObject")

sScript = "C:\SCORPION\BASES DE DATOS\sincronizador.py"
sPython = ""

' Escanear carpetas de usuarios en C:\Users para encontrar Python instalado a nivel de usuario
If oFSO.FolderExists("C:\Users") Then
    Dim oFolder, oSubFolder, path
    Set oFolder = oFSO.GetFolder("C:\Users")
    For Each oSubFolder In oFolder.SubFolders
        If oSubFolder.Name <> "All Users" And oSubFolder.Name <> "Default" And oSubFolder.Name <> "Default User" And oSubFolder.Name <> "Public" Then
            ' Buscar en Python 3.12 (pythonw.exe)
            path = "C:\Users\" & oSubFolder.Name & "\AppData\Local\Programs\Python\Python312\pythonw.exe"
            If oFSO.FileExists(path) Then
                sPython = path
                Exit For
            End If
            ' Buscar en Python 3.13 (pythonw.exe)
            path = "C:\Users\" & oSubFolder.Name & "\AppData\Local\Programs\Python\Python313\pythonw.exe"
            If oFSO.FileExists(path) Then
                sPython = path
                Exit For
            End If
            ' Buscar en Python 3.11 (pythonw.exe)
            path = "C:\Users\" & oSubFolder.Name & "\AppData\Local\Programs\Python\Python311\pythonw.exe"
            If oFSO.FileExists(path) Then
                sPython = path
                Exit For
            End If
        End If
    Next
End If

' Buscar en rutas globales si no se encontró en carpetas de usuario
If sPython = "" Then
    If oFSO.FileExists("C:\Python313\pythonw.exe") Then
        sPython = "C:\Python313\pythonw.exe"
    ElseIf oFSO.FileExists("C:\Python312\pythonw.exe") Then
        sPython = "C:\Python312\pythonw.exe"
    Else
        sPython = "pythonw.exe"
    End If
End If

' Ejecutar pythonw.exe de forma invisible directamente sin pasar por cmd.exe
oShell.Run """" & sPython & """ """ & sScript & """", 0, False
