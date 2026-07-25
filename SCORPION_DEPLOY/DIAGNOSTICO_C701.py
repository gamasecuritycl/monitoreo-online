"""
================================================================================
 GAMA SEGURIDAD - DIAGNOSTICO CAMARA P2P C701
 SN: AE0970BPAG00815 | Usuario: admin | Pass: L2D55413
================================================================================
 Prueba todas las formas posibles de conectar a la camara Dahua C701.
 Ejecutar: python DIAGNOSTICO_C701.py
================================================================================
"""

import socket
import requests
from requests.auth import HTTPDigestAuth
import time
import json

SN       = "AE0970BPAG00815"
USUARIO  = "admin"
PASSWORD = "L2D55413"
CANAL    = 1

print("=" * 70)
print(f"DIAGNOSTICO CAMARA DAHUA C701 - SN: {SN}")
print("=" * 70)

# 1. TEST DNS P2P
print("\n[1] VERIFICANDO DNS P2P...")
dominios = [
    f"{SN}.easy4ipcloud.com",
    f"{SN}.lechange.com",
    f"{SN}.lechange.cn",
    f"{SN}.imoulife.com",
    f"{SN}.dahuap2p.com",
    f"{SN}.myp2pcloud.com",
    f"{SN}.mypeoplecloud.com",
    f"{SN}.ipcver.com",
]
alguno_resuelve = False
for dom in dominios:
    try:
        ip = socket.gethostbyname(dom)
        print(f"  ✅ {dom} => {ip}")
        alguno_resuelve = True
    except socket.gaierror:
        print(f"  ❌ {dom} => NO RESUELVE")

if not alguno_resuelve:
    print("\n  ⚠️  NINGÚN dominio P2P resuelve DNS.")
    print("  CAUSA PROBABLE: La cámara está OFFLINE o el P2P NO está activado.")
    print("  SOLUCION: Verificar en interfaz web de la cámara: Red > Servicios P2P > Habilitar")

# 2. TEST IPs LOCALES
print("\n[2] VERIFICANDO ACCESO POR IP LOCAL...")
ips_locales = [
    "192.168.1.19",
    "192.168.1.2",
    "192.168.1.18",
    "192.168.0.19",
    "192.168.1.100",
    "192.168.0.100",
]
auth = HTTPDigestAuth(USUARIO, PASSWORD)
for ip in ips_locales:
    try:
        url = f"http://{ip}/cgi-bin/snapshot.cgi?channel={CANAL}"
        r = requests.get(url, auth=auth, timeout=2)
        if r.status_code == 200 and len(r.content) > 100:
            print(f"  ✅ {ip} => IMAGEN OK ({len(r.content)} bytes)")
            with open(f"test_frame_{ip.replace('.','_')}.jpg", "wb") as f:
                f.write(r.content)
            print(f"     Frame guardado: test_frame_{ip.replace('.','_')}.jpg")
        elif r.status_code == 401:
            print(f"  ⚠️  {ip} => RESPONDE pero auth falla (401) - IP correcta, credenciales incorrectas")
        else:
            print(f"  ❌ {ip} => HTTP {r.status_code}")
    except requests.exceptions.ConnectTimeout:
        print(f"  ❌ {ip} => TIMEOUT (no responde)")
    except requests.exceptions.ConnectionError:
        print(f"  ❌ {ip} => SIN RUTA (red diferente)")
    except Exception as e:
        print(f"  ❌ {ip} => Error: {e}")

# 3. TEST IP PUBLICA PERSONALIZADA
print("\n[3] ACCESO POR IP PÚBLICA + PUERTO (si tienes port-forwarding)")
print("  Introduce la IP pública del router del cliente C701 (o Enter para omitir):")
ip_publica = input("  IP Pública (ej: 200.123.45.67): ").strip()
if ip_publica:
    puertos = [80, 8080, 37777, 443, 554]
    for puerto in puertos:
        try:
            # Test TCP primero
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(3)
            result = sock.connect_ex((ip_publica, puerto))
            sock.close()
            if result == 0:
                print(f"  ✅ {ip_publica}:{puerto} => PUERTO ABIERTO")
                # Intentar CGI snapshot si es HTTP
                if puerto in [80, 8080]:
                    try:
                        url = f"http://{ip_publica}:{puerto}/cgi-bin/snapshot.cgi?channel={CANAL}"
                        r = requests.get(url, auth=auth, timeout=4)
                        if r.status_code == 200 and len(r.content) > 100:
                            print(f"     ✅ IMAGEN CGI OK ({len(r.content)} bytes)")
                            with open(f"test_frame_public_{ip_publica.replace('.','_')}_{puerto}.jpg", "wb") as f:
                                f.write(r.content)
                        elif r.status_code == 401:
                            print(f"     ⚠️  Auth falla (contraseña incorrecta)")
                        else:
                            print(f"     HTTP {r.status_code}")
                    except Exception as e2:
                        print(f"     Error CGI: {e2}")
            else:
                print(f"  ❌ {ip_publica}:{puerto} => CERRADO")
        except Exception as e:
            print(f"  ❌ {ip_publica}:{puerto} => Error: {e}")

# 4. RESUMEN Y ACCIONES
print("\n" + "=" * 70)
print("RESUMEN Y PRÓXIMAS ACCIONES:")
print("=" * 70)
print("""
Si todos los DNS fallan Y las IPs locales también fallan:
  → La cámara está en una red diferente a este PC o está OFFLINE.
  → Necesitas UNO de los siguientes:
    a) IP local de la cámara + acceso a esa red (VPN o estar en la misma LAN)
    b) IP pública + puerto forwarding desde el router del cliente
    c) Activar P2P en la cámara (interfaz web > Red > P2P > Habilitar)
    d) Ver la cámara en DMSS - si DMSS la ve, el P2P funciona y el SN es correcto

Para agregar IP local a la configuración Supabase de C701:
  - Abre Expediente del abonado C701
  - Ve a "Cámara de Verificación"
  - Edita la cámara AE0970BPAG00815
  - Agrega el campo "ip": "192.168.X.X" con la IP real de la cámara

Para activar P2P en la cámara (accediendo a la interfaz web):
  - Abre http://[IP_CAMARA] en el browser
  - Red (Network) > Servicios P2P
  - Habilitar P2P
  - Guardar
  - El SN debería aparecer en la pantalla de P2P
""")
print("=" * 70)
input("Presiona Enter para cerrar...")
