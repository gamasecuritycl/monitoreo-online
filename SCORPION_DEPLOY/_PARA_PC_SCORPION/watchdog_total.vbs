' ====================================================================
'  WATCHDOG TOTAL - GAMA SEGURIDAD
'  Un solo archivo. Monitorea Sincronizador + WhatsApp 24/7
'  Corre en segundo plano. Nunca se detiene.
'
'  USO: Doble click UNA VEZ -> se instala en inicio de Windows
'       y arranca. Para siempre automatico.
' ====================================================================

Dim WshShell, FSO, ScriptPath, ScriptDir, ParentDir, StartupPath, LogPath
Set WshShell = CreateObject("WScript.Shell")
Set FSO      = CreateObject("Scripting.FileSystemObject")

ScriptPath   = WScript.ScriptFullName
ScriptDir    = FSO.GetParentFolderName(ScriptPath)
ParentDir    = FSO.GetParentFolderName(ScriptDir)
StartupPath  = WshShell.SpecialFolders("Startup") & "\WatchdogGamaSeguridad.lnk"
LogPath      = ScriptDir & "\_watchdog_log.txt"

' === EVITAR DUPLICADOS (vía WMI) ===
Dim count, colItems, objItem
count = 0
On Error Resume Next
Set colItems = GetObject("winmgmts:\\.\root\cimv2").ExecQuery( _
    "SELECT * FROM Win32_Process WHERE Name='wscript.exe'")
For Each objItem In colItems
    cmd = LCase(objItem.CommandLine & "")
    If InStr(cmd, LCase(ScriptPath)) > 0 Then
        count = count + 1
    End If
Next
On Error Goto 0
If count > 1 Then WScript.Quit 0  ' Ya hay un watchdog corriendo

' === LOG ===
Sub LogMsg(msg)
    On Error Resume Next
    Dim f
    Set f = FSO.OpenTextFile(LogPath, 8, True)
    f.WriteLine Now() & " | " & msg
    f.Close()
    On Error Goto 0
End Sub

' === BUSCAR PYTHON ===
Function FindPython()
    Dim p, userFolder, subFolder
    ' Buscar en AppData de usuarios
    If FSO.FolderExists("C:\Users") Then
        For Each subFolder In FSO.GetFolder("C:\Users").SubFolders
            n = subFolder.Name
            If n <> "All Users" And n <> "Default" And n <> "Default User" And n <> "Public" Then
                p = "C:\Users\" & n & "\AppData\Local\Programs\Python\Python313\pythonw.exe"
                If FSO.FileExists(p) Then FindPython = p: Exit Function
                p = "C:\Users\" & n & "\AppData\Local\Programs\Python\Python312\pythonw.exe"
                If FSO.FileExists(p) Then FindPython = p: Exit Function
            End If
        Next
    End If
    ' Buscar en rutas comunes
    p = "C:\Python313\pythonw.exe"
    If FSO.FileExists(p) Then FindPython = p: Exit Function
    p = "C:\Python312\pythonw.exe"
    If FSO.FileExists(p) Then FindPython = p: Exit Function
    ' Fallback: confiar en PATH
    FindPython = "pythonw.exe"
End Function

' === INSTALAR EN INICIO DE WINDOWS (solo primera vez) ===
If Not FSO.FileExists(StartupPath) Then
    On Error Resume Next
    Set objShortcut = WshShell.CreateShortcut(StartupPath)
    objShortcut.TargetPath     = "wscript.exe"
    objShortcut.Arguments      = """" & ScriptPath & """"
    objShortcut.WorkingDirectory = ScriptDir
    objShortcut.Description    = "Watchdog Gama Seguridad"
    objShortcut.WindowStyle    = 7
    objShortcut.Save
    If Err.Number <> 0 Then
        MsgBox "No se pudo instalar en inicio de Windows." & vbCrLf & _
               "Copie este archivo manualmente a:" & vbCrLf & _
               WshShell.SpecialFolders("Startup"), 48, "Watchdog Gama"
    Else
        MsgBox "Watchdog instalado en inicio de Windows." & vbCrLf & _
               "Se iniciara automaticamente al encender el PC." & vbCrLf & vbCrLf & _
               "Ahora comenzara a monitorear servicios...", 64, "Watchdog Gama"
    End If
    On Error Goto 0
End If

LogMsg("WATCHDOG INICIADO")

' === INICIAR SERVICIOS (segundo plano, ventana 0) ===
Dim PythonPath
PythonPath = FindPython()
LogMsg("Python: " & PythonPath)

Sub StartSincronizador()
    On Error Resume Next
    LogMsg("Iniciando Sincronizador...")
    WshShell.Run """" & PythonPath & """ """ & ScriptDir & "\sincronizador.py""", 0, False
    If Err.Number <> 0 Then LogMsg("ERROR Sincronizador: " & Err.Description)
    On Error Goto 0
End Sub

Function FindFile(filename)
    If FSO.FileExists(ScriptDir & "\" & filename) Then FindFile = ScriptDir & "\" & filename : Exit Function
    If FSO.FileExists(ParentDir & "\" & filename) Then FindFile = ParentDir & "\" & filename : Exit Function
    FindFile = ScriptDir & "\" & filename
End Function

Sub StartWhatsApp()
    On Error Resume Next
    Dim whatsDir
    If FSO.FolderExists(ScriptDir & "\WHATSAPP_SERVER") Then whatsDir = ScriptDir Else whatsDir = ParentDir
    LogMsg("Iniciando WhatsApp Server...")
    WshShell.Run "cmd /c """ & whatsDir & "\WHATSAPP_SERVER\INICIAR_WHATSAPP_LOOP.bat""", 0, False
    If Err.Number <> 0 Then LogMsg("ERROR WhatsApp: " & Err.Description)
    On Error Goto 0
End Sub

Sub StartBridge()
    On Error Resume Next
    Dim bridgePath
    bridgePath = FindFile("dahua_p2p_bridge.py")
    LogMsg("Iniciando Bridge Dahua P2P... (" & bridgePath & ")")
    WshShell.Run """" & PythonPath & """ """ & bridgePath & """", 0, False
    If Err.Number <> 0 Then LogMsg("ERROR Bridge: " & Err.Description)
    On Error Goto 0
End Sub

Function ProcessExists(procName, cmdFilter)
    Dim col, it
    ProcessExists = False
    On Error Resume Next
    Set col = GetObject("winmgmts:\\.\root\cimv2").ExecQuery( _
        "SELECT * FROM Win32_Process WHERE Name='" & procName & "'")
    For Each it In col
        If InStr(LCase(it.CommandLine & ""), LCase(cmdFilter)) > 0 Then
            ProcessExists = True
            Exit Function
        End If
    Next
    On Error Goto 0
End Function

' Arranque inicial
StartSincronizador()
StartWhatsApp()
StartBridge()

' === BUCLE PRINCIPAL (cada 60 segundos) ===
Do While True
    If Not (ProcessExists("pythonw.exe", "sincronizador") Or ProcessExists("python.exe", "sincronizador")) Then
        LogMsg("Sincronizador caido. Reiniciando...")
        StartSincronizador()
    End If
    If Not ProcessExists("node.exe", "whatsapp_server") Then
        LogMsg("WhatsApp caido. Reiniciando...")
        StartWhatsApp()
    End If
    If Not (ProcessExists("pythonw.exe", "dahua_p2p_bridge") Or ProcessExists("python.exe", "dahua_p2p_bridge")) Then
        LogMsg("Bridge Dahua caido. Reiniciando...")
        StartBridge()
    End If
    WScript.Sleep 60000
Loop
