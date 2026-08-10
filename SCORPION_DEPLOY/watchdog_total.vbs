' ====================================================================
'  WATCHDOG TOTAL v2 - GAMA SEGURIDAD
'  Monitorea: Sincronizador + WhatsApp + Bridge
'  VERIFICACIÓN: Proceso + Heartbeat (no solo proceso vivo)
'  Si el heartbeat tiene >120s de antigüedad → reinicia
'  Corre en segundo plano. Nunca se detiene.
'
'  USO: Doble click UNA VEZ -> se instala en inicio de Windows
'       y arranca. Para siempre automatico.
' ====================================================================

Dim WshShell, FSO, ScriptPath, ScriptDir, StartupPath, LogPath
Set WshShell = CreateObject("WScript.Shell")
Set FSO      = CreateObject("Scripting.FileSystemObject")

ScriptPath   = WScript.ScriptFullName
ScriptDir    = FSO.GetParentFolderName(ScriptPath)
StartupPath  = WshShell.SpecialFolders("Startup") & "\WatchdogGamaSeguridad.lnk"
LogPath      = ScriptDir & "\_watchdog_log.txt"

' === EVITAR DUPLICADOS ===
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
If count > 1 Then WScript.Quit 0

' === LOG ===
Sub LogMsg(msg)
    On Error Resume Next
    Dim f
    Set f = FSO.OpenTextFile(LogPath, 8, True)
    f.WriteLine Now() & " | " & msg
    f.Close()
    ' Mantener log bajo 500KB
    If FSO.FileExists(LogPath) Then
        If FSO.GetFile(LogPath).Size > 512000 Then
            Dim content, nf
            Set content = FSO.OpenTextFile(LogPath, 1)
            Dim allText
            allText = content.ReadAll
            content.Close
            Set nf = FSO.OpenTextFile(LogPath, 2)
            nf.Write Right(allText, 256000)
            nf.Close
        End If
    End If
    On Error Goto 0
End Sub

' === BUSCAR PYTHON ===
Function FindPython()
    Dim p, subFolder
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
    p = "C:\Python313\pythonw.exe"
    If FSO.FileExists(p) Then FindPython = p: Exit Function
    p = "C:\Python312\pythonw.exe"
    If FSO.FileExists(p) Then FindPython = p: Exit Function
    FindPython = "pythonw.exe"
End Function

' === INSTALAR EN INICIO DE WINDOWS ===
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
        LogMsg("ERROR: No se pudo instalar en inicio: " & Err.Description)
    Else
        LogMsg("Watchdog instalado en inicio de Windows")
    End If
    On Error Goto 0
End If

LogMsg("═══ WATCHDOG v2 INICIADO ═══")

' === BUSCAR PYTHON ===
Dim PythonPath
PythonPath = FindPython()
LogMsg("Python: " & PythonPath)

' === FUNCIONES DE PROCESO ===
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

' === VERIFICAR HEARTBEAT (archivo) ===
Function HeartbeatFresh(heartbeatPath, maxAgeSec)
    ' Retorna True si el heartbeat existe y tiene menos de maxAgeSegundos
    HeartbeatFresh = False
    On Error Resume Next
    If FSO.FileExists(heartbeatPath) Then
        Dim f, fileTime, ageSec
        Set f = FSO.GetFile(heartbeatPath)
        fileTime = f.DateLastModified
        ageSec = DateDiff("s", fileTime, Now)
        If ageSec < maxAgeSec Then
            HeartbeatFresh = True
        End If
    End If
    On Error Goto 0
End Function

' === INICIAR SERVICIOS ===
Sub StartSincronizador()
    On Error Resume Next
    LogMsg("Iniciando Sincronizador...")
    WshShell.Run """" & PythonPath & """ """ & ScriptDir & "\sincronizador.py""", 0, False
    If Err.Number <> 0 Then LogMsg("ERROR Sincronizador: " & Err.Description)
    On Error Goto 0
End Sub

Sub StartWhatsApp()
    On Error Resume Next
    LogMsg("Iniciando WhatsApp Server...")
    WshShell.Run "cmd /c """ & ScriptDir & "\WHATSAPP_SERVER\INICIAR_WHATSAPP_LOOP.bat""", 0, False
    If Err.Number <> 0 Then LogMsg("ERROR WhatsApp: " & Err.Description)
    On Error Goto 0
End Sub

Sub StartBridge()
    On Error Resume Next
    LogMsg("Iniciando Bridge Dahua P2P...")
    WshShell.Run """" & PythonPath & """ """ & ScriptDir & "\dahua_p2p_bridge.py""", 0, False
    If Err.Number <> 0 Then LogMsg("ERROR Bridge: " & Err.Description)
    On Error Goto 0
End Sub

Sub KillProcess(procName, cmdFilter)
    On Error Resume Next
    Dim col, it
    Set col = GetObject("winmgmts:\\.\root\cimv2").ExecQuery( _
        "SELECT * FROM Win32_Process WHERE Name='" & procName & "'")
    For Each it In col
        If InStr(LCase(it.CommandLine & ""), LCase(cmdFilter)) > 0 Then
            it.Terminate
        End If
    Next
    WScript.Sleep 3000
    On Error Goto 0
End Sub

' === ARRANQUE INICIAL ===
Call StartSincronizador()
Call StartWhatsApp()
Call StartBridge()

' === VARIABLES DE CONTROL ===
Dim sincLastRestart, sincRestartCount
sincLastRestart = 0
sincRestartCount = 0

' === BUCLE PRINCIPAL (cada 30 segundos) ===
Do While True
    ' ── SINCRONIZADOR: verificar proceso + heartbeat ──
    Dim sincProcAlive
    sincProcAlive = ProcessExists("pythonw.exe", "sincronizador") Or ProcessExists("python.exe", "sincronizador")
    
    If Not sincProcAlive Then
        ' Proceso muerto → reiniciar
        Call LogMsg("SINCRONIZADOR: Proceso MUERTO. Reiniciando...")
        Call KillProcess("pythonw.exe", "sincronizador")
        Call KillProcess("python.exe", "sincronizador")
        Call StartSincronizador()
        sincRestartCount = sincRestartCount + 1
        sincLastRestart = Now
    ElseIf Not HeartbeatFresh(ScriptDir & "\_sincronizador_heartbeat.txt", 300) Then
        ' Proceso vivo PERO sin heartbeat en 300s → colgado, reiniciar
        Call LogMsg("SINCRONIZADOR: COLGADO (sin heartbeat >300s). Reiniciando...")
        Call KillProcess("pythonw.exe", "sincronizador")
        Call KillProcess("python.exe", "sincronizador")
        WScript.Sleep 5000
        Call StartSincronizador()
        sincRestartCount = sincRestartCount + 1
        sincLastRestart = Now
    End If

    ' ── WHATSAPP: verificar proceso (evitar duplicados) ──
    If Not ProcessExists("node.exe", "") Then
        Call LogMsg("WHATSAPP: Proceso MUERTO. Reiniciando...")
        Call StartWhatsApp()
    End If

    ' ── BRIDGE: verificar proceso ──
    If Not (ProcessExists("pythonw.exe", "dahua_p2p_bridge") Or ProcessExists("python.exe", "dahua_p2p_bridge")) Then
        Call LogMsg("BRIDGE: Proceso MUERTO. Reiniciando...")
        Call StartBridge()
    End If

    ' ── LOG DE ESTADO cada 5 minutos ──
    If sincRestartCount > 0 Then
        Call LogMsg("ESTADO: Sincronizador reiniciado " & sincRestartCount & " vez/veces. Último: " & sincLastRestart)
    End If

    WScript.Sleep 30000
Loop
