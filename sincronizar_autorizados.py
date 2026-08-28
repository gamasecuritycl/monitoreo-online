import os
import sys
import json
import time
from datetime import datetime
import win32com.client
import requests

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SUPABASE_URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"

db_path = r"C:\Users\tetor\Downloads\MONITOREO ONLINE\monitoreo-online\PERSONAS AUTORIZADAS.MDB"
pwd = "SCORPION23"

print("=" * 70)
print(f"Extrayendo personas autorizadas desde {db_path}...")
print("=" * 70)

conn = win32com.client.Dispatch('ADODB.Connection')
conn_str = f"Provider=Microsoft.ACE.OLEDB.12.0;Data Source={db_path};Jet OLEDB:Database Password={pwd};Mode=Share Deny None;"
conn.Open(conn_str)

rs_tables = conn.OpenSchema(20)
tablas = []
while not rs_tables.EOF:
    t_type = str(rs_tables.Fields('TABLE_TYPE').Value).upper()
    t_name = str(rs_tables.Fields('TABLE_NAME').Value).strip()
    if t_type == 'TABLE' and not t_name.startswith('MSys') and not t_name.startswith('~'):
        tablas.append(t_name)
    rs_tables.MoveNext()
rs_tables.Close()

print(f"Total cuentas encontradas en MDB: {len(tablas)}")

mapa_autorizados = {}
total_personas = 0

for t in tablas:
    cuenta_clean = t.upper().strip()
    personas_cuenta = []
    try:
        rs = win32com.client.Dispatch('ADODB.Recordset')
        rs.Open(f"SELECT * FROM [{t}]", conn)
        
        idx = 1
        while not rs.EOF:
            nombre = str(rs.Fields('NOMBRE').Value or "").strip()
            clave = str(rs.Fields('CONTRASEÑA').Value or "").strip()
            # En algunas tablas el campo es GARGO o CARGO
            cargo = ""
            for cargo_field in ['GARGO', 'CARGO', 'CARG']:
                try:
                    c_val = rs.Fields(cargo_field).Value
                    if c_val:
                        cargo = str(c_val).strip()
                        break
                except: pass
                
            direccion = str(rs.Fields('DIRECCION').Value or "").strip()
            telefono = str(rs.Fields('TELEFONO').Value or "").strip()
            
            if nombre or clave or telefono:
                # Extraer prefijo de prioridad si viene en formato (01) ROMINA PALMA
                prioridad = idx
                nombre_display = nombre
                if nombre.startswith("(") and ")" in nombre:
                    partes = nombre.split(")", 1)
                    num_str = partes[0].replace("(", "").strip()
                    if num_str.isdigit():
                        prioridad = int(num_str)
                    nombre_display = partes[1].strip()
                elif len(nombre) > 2 and nombre[:2].isdigit():
                    prioridad = int(nombre[:2])
                    nombre_display = nombre[2:].strip()
                    
                personas_cuenta.append({
                    "prioridad": prioridad,
                    "nombre": nombre_display,
                    "nombre_raw": nombre,
                    "contrasena": clave,
                    "cargo": cargo,
                    "direccion": direccion,
                    "telefono": telefono
                })
                total_personas += 1
                idx += 1
            rs.MoveNext()
        rs.Close()
        
        if personas_cuenta:
            # Ordenar por prioridad
            personas_cuenta.sort(key=lambda x: x["prioridad"])
            mapa_autorizados[cuenta_clean] = personas_cuenta
            
            # Guardar también con variantes normalizadas (ej C701 y 701 y 0701)
            if cuenta_clean.startswith("C") and len(cuenta_clean) > 1:
                sin_c = cuenta_clean[1:]
                mapa_autorizados[sin_c] = personas_cuenta
                mapa_autorizados[sin_c.zfill(4)] = personas_cuenta
            elif cuenta_clean.isdigit():
                mapa_autorizados[f"C{cuenta_clean}"] = personas_cuenta
                mapa_autorizados[cuenta_clean.zfill(4)] = personas_cuenta
    except Exception as e:
        # print(f"Error en tabla {t}: {e}")
        pass

conn.Close()

print(f"Cuentas con personas registradas: {len(mapa_autorizados)}")
print(f"Total registros de personas: {total_personas}")

# Guardar localmente en JSON dentro de Next.js
json_path = os.path.join(r"C:\Users\tetor\Downloads\MONITOREO ONLINE\monitoreo-online\dashboard\src\lib", "personas_autorizadas.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(mapa_autorizados, f, ensure_ascii=False, indent=2)
print(f"Guardado local en: {json_path}")

# Subir a Supabase
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

# 1. Borrar anterior
del_url = f"{SUPABASE_URL}/rest/v1/eventos_monitoreo?cuenta=eq.PERSONAS_AUTORIZADAS"
r_del = requests.delete(del_url, headers=headers, timeout=15)
print(f"Delete en Supabase: {r_del.status_code}")

# 2. Insertar nuevo
ins_url = f"{SUPABASE_URL}/rest/v1/eventos_monitoreo"
payload = {
    "fecha_hora": datetime.now().isoformat(),
    "cuenta": "PERSONAS_AUTORIZADAS",
    "nombre_abonado": json.dumps(mapa_autorizados, ensure_ascii=False),
    "evento": "SINCRONIZACION AUTORIZADOS MDB",
    "zona": "000",
    "usuario": "SYSTEM"
}
r_ins = requests.post(ins_url, headers=headers, json=payload, timeout=20)
print(f"Insert en Supabase: {r_ins.status_code}")
if r_ins.status_code in [200, 201]:
    print("✅ Sincronización exitosa en Supabase!")
else:
    print(f"Respuesta Supabase: {r_ins.text}")
