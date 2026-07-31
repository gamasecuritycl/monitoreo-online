Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\tetor\Downloads\MONITOREO ONLINE\monitoreo-online\SCORPION_DEPLOY"
WshShell.Run "C:\Users\tetor\AppData\Local\Programs\Python\Python313\python.exe dahua_p2p_bridge.py", 0, False
