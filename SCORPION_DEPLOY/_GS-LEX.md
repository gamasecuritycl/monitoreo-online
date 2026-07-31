# GS-LEX: Gama Seguridad Lexicon (v1)
## Lenguaje comprimido para comunicación agente-usuario

### PROYECTO
- **GS** = Gama Seguridad (Chile, alarmas/monitoreo)
- **D** = Dahua (cámaras, XVR, NVR, DVR, IPC)
- **MO** = MONITOREO ONLINE (directorio raíz del proyecto)
- **SD** = SCORPION_DEPLOY (carpeta del bridge)
- **ED** = ExpedienteModal (componente dashboard)
- **SB** = Supabase (backend/BBDD)

### COMPONENTES
- **Bd** = Bridge Dahua (dahua_p2p_bridge.py)
- **BdN** = Bridge nativo (SDK P2P engine en Bd)
- **BdH** = Bridge HTTP (fallback HTTP P2P en Bd)
- **Wk** = CameraWorker (thread por cámara)
- **Mgr** = Manager loop (gestor central Bd)
- **Hb** = HeartbeatThread
- **API-rt** = /api/dahua-stream (route.ts en Next.js)

### ESTADOS Bd
- BdOK = bridge funcionando, DLL cargada
- BdNO = DLL faltante, solo HTTP
- BdAR = error arquitectura (32/64 mismatch)

### CÁMARAS
- **SN** = Serial Number (ej: AE0970BPAG00815)
- **CH** = Canal (1-32)
- **u** = usuario (default: admin)
- **p** = password
- **IPl** = IP local
- **ST** = Stream (sub/main)

### ACCIONES
- **L** = Login (intento de conexión)
- **Lok** = Login exitoso
- **Lfail** = Login fallido
- **Snap** = Captura snapshot
- **SnapOK** = Snapshot JPEG obtenido
- **SnapFAIL** = Snapshot fallido
- **UpSB** = Upload a Supabase
- **DNSok** = DNS resuelve
- **DNSno** = DNS no resuelve
- **KA** = Keep-Alive

### ERRORES COMUNES (códigos numéricos)
- **E1** = usr/pwd incorrecto
- **E3** = timeout
- **E7** = recursos insuficientes
- **E8** = sub conexión fallida
- **E9** = conexión ppal fallida (main conn fail)
- **E10** = max conexiones
- **E13** = IP sin permiso
- **E18** = dispositivo no inicializado

### TAREAS
- **T1** = Obtener/colocar DLL
- **T2** = Probar L-P2P
- **T3** = Probar Snap
- **T4** = Copiar a PC Scorpion
- **T5** = Ejecutar installer

### PROTOCOLOS/MODOS
- **M0** = TCP login (modo 0)
- **M16** = Cloud login (modo 16)
- **M19** = P2P login (modo 19)
- **HS** = HighLevelSecurity (login alternativo)
- **LE** = Lechange
- **IM** = Imou
- **E4** = Easy4IP

### UBICACIONES
- **PCT** = PC Tomás (dev/actual)
- **PCS** = PC Scorpion (producción final)
- **AD** = AnyDesk (para deploy remoto)

### FRASES COMPRIMIDAS
- "Bd v2.2 OK DLL" = Bridge v2.2 funcionando con DLL cargada
- "SN=X L-P2P E9" = Serial X falla login P2P con error 9
- "Wk SN=X CH=1 SnapOK=42KB UpSB" = Worker capturó 42KB y subió a Supabase
- "T4: Bd.dll+py -> PCS" = Copiar bridge completo a PC Scorpion
- "DNSno->BdN" = DNS falla, usar bridge nativo
- "SnapFAIL->Wk.backoff 3s" = Snapshot falló, worker espera 3s

### USO
- Prefijo GS: indica comando/frase para el agente
- Ej: "GS: T1 hecho, ahora T2 con SN=AE0970 E1" 
- Los errores se anexan sin espacio: E1, E9, E13
