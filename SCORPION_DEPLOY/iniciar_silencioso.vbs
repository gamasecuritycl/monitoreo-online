Dim oShell, oFSO, sScript, sPython
Set oShell = CreateObject("WScript.Shell")
Set oFSO   = CreateObject("Scripting.FileSystemObject")

sScript = "C:\SCORPION\BASES DE DATOS\sincronizador.py"

' Mantener el sincronizador vivo — si se cae, se reinicia automaticamente
Do While True
  ' Buscar Python
  sPython = ""
  If oFSO.FolderExists("C:\Users") Then
    Dim oFolder, oSubFolder, path
    Set oFolder = oFSO.GetFolder("C:\Users")
    For Each oSubFolder In oFolder.SubFolders
      If oSubFolder.Name <> "All Users" And oSubFolder.Name <> "Default" And oSubFolder.Name <> "Default User" And oSubFolder.Name <> "Public" Then
        path = "C:\Users\" & oSubFolder.Name & "\AppData\Local\Programs\Python\Python312\pythonw.exe"
        If oFSO.FileExists(path) Then
          sPython = path
          Exit For
        End If
        path = "C:\Users\" & oSubFolder.Name & "\AppData\Local\Programs\Python\Python313\pythonw.exe"
        If oFSO.FileExists(path) Then
          sPython = path
          Exit For
        End If
        path = "C:\Users\" & oSubFolder.Name & "\AppData\Local\Programs\Python\Python311\pythonw.exe"
        If oFSO.FileExists(path) Then
          sPython = path
          Exit For
        End If
      End If
    Next
  End If

  If sPython = "" Then
    If oFSO.FileExists("C:\Python313\pythonw.exe") Then
      sPython = "C:\Python313\pythonw.exe"
    ElseIf oFSO.FileExists("C:\Python312\pythonw.exe") Then
      sPython = "C:\Python312\pythonw.exe"
    Else
      sPython = "pythonw.exe"
    End If
  End If

  ' Ejecutar pythonw.exe de forma invisible y ESPERAR a que termine
  oShell.Run """" & sPython & """ """ & sScript & """", 0, True

  ' Si llegamos aqui es porque el proceso termino (crasheo o cierre)
  ' Esperar 5 segundos antes de reiniciar para no saturar la CPU
  WScript.Sleep 5000
Loop
