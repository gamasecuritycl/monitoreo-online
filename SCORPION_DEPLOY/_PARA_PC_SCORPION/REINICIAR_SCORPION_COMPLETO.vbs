' ==============================================================================
'   GAMA SECURITY - AUTO-INICIO INTELIGENTE SCORPION v1.11.0 (SILENCIOSO)
'   1. Abre Scorpion -> Espera 8s a que desaparezca el Splash Screen de Terasoft
'   2. Enfoca la ventana de Login -> Escribe master / cafe + ENTER
'   3. Espera 5s -> Conecta Puerto (ALT+P -> C)
'   4. Espera 20s -> Abre Receptora IP y Receptora Vetti (MINIMIZADAS)
'   5. Salida limpia sin ventanas residuales.
' ==============================================================================

Set WshShell = CreateObject("WScript.Shell")
Set FSO      = CreateObject("Scripting.FileSystemObject")

' --- RUTAS EXACTAS PC SCORPION ---
Dim scorpionExe, receptoraIPExe, receptoraVettiExe

scorpionExe       = "C:\Program Files (x86)\SCORPION MONITORING SOFTWARE\SCORPION MONITORING SOFTWARE.EXE"
receptoraIPExe    = "C:\Program Files (x86)\Scorpion Universal IP Receiver\Scorpion IP Receiver SG.exe"
receptoraVettiExe = "C:\Program Files (x86)\Receptor Vetti 2.0\ReceptorVettiTcpTerminal.exe"

Function IsProcessRunning(exeName)
    IsProcessRunning = False
    On Error Resume Next
    Dim col, proc
    Set col = GetObject("winmgmts:\\.\root\cimv2").ExecQuery("SELECT * FROM Win32_Process")
    For Each proc In col
        If InStr(LCase(proc.Name & ""), LCase(exeName)) > 0 Or InStr(LCase(proc.CommandLine & ""), LCase(exeName)) > 0 Then
            IsProcessRunning = True
            Exit Function
        End If
    Next
    On Error Goto 0
End Function

' ==============================================================================
' PASO 1: VERIFICAR Y AUTENTICAR SCORPION (MANEJO DE SPLASH SCREEN)
' ==============================================================================
Dim scorpionVivo
scorpionVivo = IsProcessRunning("SCORPION MONITORING SOFTWARE.EXE") Or IsProcessRunning("Scorpion.exe")

If Not scorpionVivo Then
    ' 1.1 Ejecutar programa principal
    If FSO.FileExists(scorpionExe) Then
        WshShell.Run """" & scorpionExe & """", 1, False
    Else
        WshShell.Run "C:\SCORPION\Scorpion.exe", 1, False
    End If

    ' 1.2 ESPERAR 8 SEGUNDOS EXACTOS: Permite aceptar UAC (SÍ) y a que desaparezca
    '     la pantalla azul de presentación (Splash Screen Terasoft Versión 1.11.0)
    WScript.Sleep 8000

    ' 1.3 Forzar foco a la ventana de Login
    WshShell.AppActivate "SCORPION"
    WScript.Sleep 500
    WshShell.AppActivate "LOGIN"
    WScript.Sleep 500

    ' 1.4 Inyectar credenciales (master / cafe + ENTER)
    WshShell.SendKeys "master"
    WScript.Sleep 400
    WshShell.SendKeys "{TAB}"
    WScript.Sleep 400
    WshShell.SendKeys "cafe"
    WScript.Sleep 400
    WshShell.SendKeys "{ENTER}"

    ' 1.5 Esperar 5 segundos a que inicie la sesión y cargue la ventana principal
    WScript.Sleep 5000

    ' 1.6 Enfocar ventana principal de Scorpion
    WshShell.AppActivate "SCORPION"
    WScript.Sleep 600

    ' 1.7 Conectar Puerto (ALT + P -> C)
    WshShell.SendKeys "%p" ' Atajo nativo ALT + P (Menú PUERTOS)
    WScript.Sleep 800
    WshShell.SendKeys "c"  ' Tecla 'c' de Conectar
    WScript.Sleep 1000

    ' 1.8 ESPERAR 20 SEGUNDOS REQUERIDOS PARA CONEXIÓN TOTAL DEL PUERTO
    WScript.Sleep 20000
End If

' ==============================================================================
' PASO 2: ABRIR RECEPTORA VIRTUAL IP SG (MINIMIZADA)
' ==============================================================================
If Not IsProcessRunning("Scorpion IP Receiver SG.exe") Then
    If FSO.FileExists(receptoraIPExe) Then
        WshShell.Run """" & receptoraIPExe & """", 7, False
        WScript.Sleep 3000
    End If
End If

' ==============================================================================
' PASO 3: ABRIR RECEPTORA VETTI TERMINAL (MINIMIZADA)
' ==============================================================================
If Not IsProcessRunning("ReceptorVettiTcpTerminal.exe") Then
    If FSO.FileExists(receptoraVettiExe) Then
        WshShell.Run """" & receptoraVettiExe & """", 7, False
    End If
End If

' Salida silenciosa sin ventanas
WScript.Quit 0
