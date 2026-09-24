import time
import os
import sys
import shutil
import json
import msvcrt
from datetime import datetime, timezone
import requests

# ════════════════════════════════════════════════════════════════
#  GAMA SECURITY - SINCRONIZADOR DE CLIENTES Y EXPEDIENTES v2.0
#  Vigila GENERAL.mdb (Downloads y SCORPION) + PERSONAS AUTORIZADAS
#  Actualiza Supabase (CLIENTES + PERSONAS_AUTORIZADAS) y JSON local
# ════════════════════════════════════════════════════════════════

TEMP_DIR = os.path.join(os.environ.get("TEMP", r"C:\Windows\Temp"), "gama_sincronizador")
os.makedirs(TEMP_DIR, exist_ok=True)

try:
    sys.stdout.reconfigure(line_buffering=True, errors='replace')
    sys.stderr.reconfigure(line_buffering=True, errors='replace')
except Exception:
    pass

# Redirigir salida a log si corre con pythonw.exe
if sys.executable.lower().endswith("pythonw.exe"):
    try:
        log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_gama_clientes_log.txt")
        if os.path.exists(log_path) and os.path.getsize(log_path) > 2_000_000:
            try:
                with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.readlines()[-1000:]
                with open(log_path, "w", encoding="utf-8") as f:
                    f.writelines(lines)
            except Exception:
                pass
        sys.stdout = open(log_path, "a", encoding="utf-8", buffering=1)
        sys.stderr = sys.stdout
    except Exception:
        pass

LOCK_FILE = os.path.join(TEMP_DIR, "_sincronizador_clientes.lock")
def lock_single_instance():
    """ Bloqueo de auto-recuperación: nunca detiene el script por locks obsoletos """
    try:
        fp = open(LOCK_FILE, "a+")
        fp.seek(0)
        msvcrt.locking(fp.fileno(), msvcrt.LK_NBLCK, 1)
        return fp
    except Exception:
        try:
            return open(LOCK_FILE, "a+")
        except Exception:
            return None

# Supabase Credentials
SUPABASE_URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"

HEADERS_SUPABASE = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

CLIENTES_ROW_ID = 1016426
AUTORIZADOS_ROW_ID = 1074660

def get_chile_offset() -> str:
    return "-03:00"

def upload_to_supabase(clientes_map: dict, personas_map: dict) -> bool:
    chile_tz = get_chile_offset()
    now_iso = datetime.now().strftime("%Y-%m-%dT%H:%M:%S") + chile_tz
    
    ok_clientes = False
    ok_autorizados = False

    # 1. Subir CLIENTES
    try:
        clientes_json = json.dumps(clientes_map, ensure_ascii=False)
        data_cl = {
            "fecha_hora": now_iso,
            "cuenta": "CLIENTES",
            "nombre_abonado": clientes_json,
            "evento": "SINCRONIZACION CLIENTES MDB",
            "zona": "000",
            "usuario": "SYSTEM"
        }
        post_url = f"{SUPABASE_URL}/rest/v1/eventos_monitoreo"
        r_cl = requests.post(post_url, headers=HEADERS_SUPABASE, json=data_cl, timeout=15)
        if r_cl.status_code in [200, 201, 204]:
            ok_clientes = True
            print(f"[{datetime.now().strftime('%H:%M:%S')}] [SUPABASE] Clientes insertados/actualizados exitosamente ({len(clientes_map)} cuentas).")
        else:
            print(f"[SUPABASE ERROR] Falló subida CLIENTES: {r_cl.status_code} - {r_cl.text}")
    except Exception as e:
        print(f"[SUPABASE ERROR] Excepción subiendo CLIENTES: {e}")

    # 2. Subir PERSONAS_AUTORIZADAS
    try:
        personas_json = json.dumps(personas_map, ensure_ascii=False)
        data_pa = {
            "fecha_hora": now_iso,
            "cuenta": "PERSONAS_AUTORIZADAS",
            "nombre_abonado": personas_json,
            "evento": "SINCRONIZACION AUTORIZADOS MDB",
            "zona": "000",
            "usuario": "SYSTEM"
        }
        post_url_pa = f"{SUPABASE_URL}/rest/v1/eventos_monitoreo"
        r_pa = requests.post(post_url_pa, headers=HEADERS_SUPABASE, json=data_pa, timeout=15)
        if r_pa.status_code in [200, 201, 204]:
            ok_autorizados = True
            print(f"[{datetime.now().strftime('%H:%M:%S')}] [SUPABASE] Personas autorizadas insertadas/actualizadas exitosamente ({len(personas_map)} cuentas).")
        else:
            print(f"[SUPABASE ERROR] Falló subida AUTORIZADOS: {r_pa.status_code} - {r_pa.text}")
    except Exception as e:
        print(f"[SUPABASE ERROR] Excepción subiendo AUTORIZADOS: {e}")

    return ok_clientes

def update_local_json(clientes_map: dict):
    """ Sobrescribe clientes_general.json en el dashboard local """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.normpath(os.path.join(script_dir, "..", "dashboard", "src", "lib", "clientes_general.json")),
        r"C:\Users\tetor\Downloads\MONITOREO ONLINE\monitoreo-online\dashboard\src\lib\clientes_general.json"
    ]
    clientes_json = json.dumps(clientes_map, ensure_ascii=False, indent=2)
    for path in candidates:
        if os.path.exists(os.path.dirname(path)):
            try:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(clientes_json)
                print(f"[LOCAL JSON] Archivo actualizado: {path}")
            except Exception as e:
                print(f"[LOCAL JSON ERROR] No se pudo escribir {path}: {e}")

def read_personas_autorizadas_mdb() -> dict:
    """ Extrae personas desde PERSONAS AUTORIZADAS.MDB si existe """
    candidatos_pa = [
        r"C:\Users\tetor\Downloads\MONITOREO ONLINE\monitoreo-online\PERSONAS AUTORIZADAS.MDB",
        r"C:\SCORPION\PERSONAS AUTORIZADAS.MDB",
        r"C:\SCORPION\BASE DE DATOS\PERSONAS AUTORIZADAS.MDB"
    ]
    pa_path = None
    for p in candidatos_pa:
        if os.path.exists(p):
            pa_path = p
            break
            
    if not pa_path:
        return {}

    mapa_pa = {}
    try:
        import pyodbc
        pwd = "SCORPION23"
        conn_str = f"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={pa_path};PWD={pwd};ReadOnly=1;"
        conn = pyodbc.connect(conn_str)
        cur = conn.cursor()
        tablas = [row.table_name for row in cur.tables(tableType='TABLE') if not row.table_name.startswith('MSys')]
        
        for t in tablas:
            cuenta_clean = t.upper().strip()
            try:
                cur.execute(f"SELECT * FROM [{t}]")
                cols = [c[0].upper() for c in cur.description]
                idx = 1
                personas = []
                for row in cur.fetchall():
                    r_dict = dict(zip(cols, [str(x).strip() if x is not None else "" for x in row]))
                    nombre = r_dict.get("NOMBRE", "")
                    clave = r_dict.get("CONTRASEÑA", "") or r_dict.get("CONTRASENA", "")
                    cargo = r_dict.get("CARGO", "") or r_dict.get("GARGO", "") or r_dict.get("CARG", "")
                    direccion = r_dict.get("DIRECCION", "")
                    telefono = r_dict.get("TELEFONO", "")
                    
                    if nombre or clave or telefono:
                        prioridad = idx
                        nombre_disp = nombre
                        if nombre.startswith("(") and ")" in nombre:
                            parts = nombre.split(")", 1)
                            if parts[0].replace("(", "").strip().isdigit():
                                prioridad = int(parts[0].replace("(", "").strip())
                            nombre_disp = parts[1].strip()
                        personas.append({
                            "prioridad": prioridad,
                            "nombre": nombre_disp,
                            "nombre_raw": nombre,
                            "contrasena": clave,
                            "cargo": cargo,
                            "direccion": direccion,
                            "telefono": telefono
                        })
                        idx += 1
                if personas:
                    personas.sort(key=lambda x: x["prioridad"])
                    mapa_pa[cuenta_clean] = personas
                    if cuenta_clean.startswith("C") and len(cuenta_clean) > 1:
                        mapa_pa[cuenta_clean[1:]] = personas
                    else:
                        mapa_pa[f"C{cuenta_clean}"] = personas
            except Exception:
                pass
        conn.close()
    except Exception as e:
        print(f"[PA MDB WARN] {e}")
        
    return mapa_pa

def extract_general_mdb(mdb_path: str):
    """ Conecta a GENERAL.mdb, extrae clientes y personas autorizadas """
    temp_mdb = os.path.join(TEMP_DIR, "GENERAL_sync_temp.mdb")
    try:
        if os.path.exists(temp_mdb):
            try: os.remove(temp_mdb)
            except Exception: pass
        shutil.copy2(mdb_path, temp_mdb)
    except Exception as e:
        print(f"[EXTRACT ERROR] No se pudo copiar {mdb_path} a temp: {e}")
        return None, None

    pwd = "SCORPION7"
    clientes_map = {}
    
    # Comenzar con personas desde PERSONAS AUTORIZADAS.MDB si existen
    personas_map = read_personas_autorizadas_mdb()

    try:
        import pyodbc
        conn_str = f"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={temp_mdb};PWD={pwd};ReadOnly=1;"
        conn = pyodbc.connect(conn_str)
        cur = conn.cursor()
        
        cur.execute("SELECT * FROM [USUARIOS]")
        cols = [c[0].lower() for c in cur.description]
        rows = cur.fetchall()
        
        for r in rows:
            doc = {}
            for col_name, val in zip(cols, r):
                doc[col_name] = "" if val is None else str(val).strip()
                
            cuenta = doc.get("cuenta", "").upper().strip()
            if not cuenta:
                continue
                
            clientes_map[cuenta] = doc
            
            # Extraer personas autorizadas directamente de GENERAL.mdb (nombre1 a nombre7)
            # si la cuenta no tiene autorizados en PERSONAS AUTORIZADAS.MDB
            pa_existentes = personas_map.get(cuenta) or []
            if not pa_existentes:
                contactos_gen = []
                for i in range(1, 8):
                    nom = doc.get(f"nombre{i}", "")
                    tel = doc.get(f"t{i}", "")
                    carg = doc.get(f"carg{i}", "") or doc.get(f"cargo{i}", "")
                    dir_c = doc.get(f"direccion{i}", "")
                    contra = doc.get(f"contra{i}", "")
                    if nom or tel:
                        contactos_gen.append({
                            "prioridad": i,
                            "nombre": nom,
                            "nombre_raw": nom,
                            "contrasena": contra,
                            "cargo": carg,
                            "direccion": dir_c,
                            "telefono": tel
                        })
                if contactos_gen:
                    personas_map[cuenta] = contactos_gen
                    if cuenta.startswith("C") and len(cuenta) > 1:
                        personas_map[cuenta[1:]] = contactos_gen
                    else:
                        personas_map[f"C{cuenta}"] = contactos_gen

        conn.close()
    except Exception as e:
        print(f"[EXTRACT DB ERROR] {e}")
        return None, None
    finally:
        try:
            if os.path.exists(temp_mdb):
                os.remove(temp_mdb)
        except Exception:
            pass

    return clientes_map, personas_map

import hashlib

def replicate_downloads_to_scorpion(downloads_path: str, watched_files: dict = None):
    r""" Si el MDB más nuevo viene de Downloads, replicarlo a C:\SCORPION """
    destinos = [
        r"C:\SCORPION\BASE DE DATOS\GENERAL.mdb",
        r"C:\SCORPION\BASES DE DATOS\GENERAL.mdb"
    ]
    for dst in destinos:
        try:
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(downloads_path, dst)
            if watched_files is not None and dst in watched_files:
                try:
                    watched_files[dst]["mtime"] = os.path.getmtime(dst)
                    watched_files[dst]["size"] = os.path.getsize(dst)
                except Exception:
                    pass
            print(f"[REPLICA SUCCESS] Replicado a: {dst}")
        except Exception as e:
            print(f"[REPLICA WARN] No se pudo copiar a {dst}: {e}")

def main():
    lock_fp = lock_single_instance()
    if not lock_fp:
        print("[INIT] Ya existe otra instancia de sincronizador_clientes corriendo. Saliendo.")
        sys.exit(0)

    print("=" * 65)
    print("  GAMA SECURITY - Sincronizador Activo de Clientes & Expedientes")
    print(f"  Inicio: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 65)

    candidates = [
        r"C:\Users\tetor\Downloads\GENERAL.mdb",
        r"C:\SCORPION\BASE DE DATOS\GENERAL.mdb",
        r"C:\SCORPION\BASES DE DATOS\GENERAL.mdb"
    ]

    watched_files = {}
    for path in candidates:
        watched_files[path] = {"mtime": 0, "size": 0}

    last_hash = None

    while True:
        try:
            newest_path = None
            newest_mtime = 0

            for path in candidates:
                if os.path.exists(path):
                    try:
                        mtime = os.path.getmtime(path)
                        size = os.path.getsize(path)
                        state = watched_files[path]
                        if mtime != state["mtime"] or size != state["size"]:
                            state["mtime"] = mtime
                            state["size"] = size
                            if mtime > newest_mtime:
                                newest_mtime = mtime
                                newest_path = path
                    except Exception as e:
                        pass

            if newest_path:
                print(f"\n[CAMBIO DETECTADO] Leyendo archivo más reciente: {newest_path}")
                
                # Si fue en Downloads, replicar hacia SCORPION
                if "Downloads" in newest_path:
                    replicate_downloads_to_scorpion(newest_path, watched_files)
                    
                cl_map, pa_map = extract_general_mdb(newest_path)
                if cl_map:
                    payload_str = json.dumps(cl_map, sort_keys=True) + json.dumps(pa_map, sort_keys=True)
                    cur_hash = hashlib.sha256(payload_str.encode("utf-8")).hexdigest()
                    
                    if cur_hash != last_hash:
                        print(f"[SYNC] Subiendo a Supabase: {len(cl_map)} abonados, {len(pa_map)} con autorizados...")
                        if upload_to_supabase(cl_map, pa_map):
                            last_hash = cur_hash
                            update_local_json(cl_map)
                            print(f"[SYNC SUCCESS] Sincronización completada exitosamente a las {datetime.now().strftime('%H:%M:%S')}!")
                        else:
                            print("[SYNC WARN] Falló la subida a Supabase.")
                    else:
                        print("[SYNC] Contenido idéntico al último sincronizado.")
                else:
                    print("[SYNC ERROR] No se pudieron extraer datos del MDB.")

        except Exception as e:
            print(f"[LOOP ERROR] Error: {e}")

        time.sleep(10)

if __name__ == "__main__":
    main()
