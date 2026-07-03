import time, pyodbc, shutil, os, json, sys, requests
from datetime import datetime, timezone, timedelta
from supabase import create_client

# Redirigir salida a log si se ejecuta en segundo plano con pythonw.exe
if sys.executable.lower().endswith("pythonw.exe"):
    try:
        log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_gama_log.txt")
        sys.stdout = open(log_path, "a", encoding="utf-8", buffering=1)
        sys.stderr = sys.stdout
    except Exception:
        pass

# Evitar múltiples instancias del sincronizador a la vez en el mismo PC
LOCK_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_sincronizador.lock")
try:
    if os.path.exists(LOCK_FILE):
        os.remove(LOCK_FILE)
except Exception:
    print("[ERROR] El sincronizador ya esta en ejecucion en segundo plano. Saliendo...")
    sys.exit(0)

try:
    lock_handle = open(LOCK_FILE, "w")
    lock_handle.write(str(os.getpid()))
    lock_handle.flush()
except Exception:
    print("[ERROR] No se pudo crear el archivo de bloqueo.")
    sys.exit(0)

# ============================================================
#  GAMA COMMAND CENTER - Sincronizador para PC Scorpion
#  Versión: 4.0 (Sincronización en tiempo real de clientes y eventos)
# ============================================================

SUPABASE_URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"

# Rutas de base de datos de EVENTOS
if os.path.exists(r'C:\SCORPION\BASES DE DATOS\EVENTOS'):
    CARPETA_EVENTOS = r'C:\SCORPION\BASES DE DATOS\EVENTOS'
    RUTA_COPIA_TEMP = r'C:\SCORPION\BASES DE DATOS\_EVENTOS_TEMP.MDB'
    RUTA_CACHE      = r'C:\SCORPION\BASES DE DATOS\_sincronizador_cache.json'
else:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if os.path.basename(base_dir).upper() == "SCORPION_DEPLOY":
        root_dir = os.path.dirname(base_dir)
    else:
        root_dir = base_dir
    
    CARPETA_EVENTOS = os.path.join(root_dir, 'BASES DE DATOS', 'EVENTOS')
    RUTA_COPIA_TEMP = os.path.join(root_dir, 'BASES DE DATOS', '_EVENTOS_TEMP.MDB')
    RUTA_CACHE      = os.path.join(root_dir, 'BASES DE DATOS', '_sincronizador_cache.json')

# Rutas del archivo GENERAL.mdb (Clientes de Scorpion)
RUTAS_GENERAL_MDB = [
    r"C:\SCORPION\BASE DE DATOS\GENERAL.mdb",
    r"E:\MONITOREO ONLINE\GENERAL.mdb",
    os.path.join(os.path.dirname(CARPETA_EVENTOS), "BASE DE DATOS", "GENERAL.mdb"),
    os.path.join(os.path.dirname(CARPETA_EVENTOS), "GENERAL.mdb")
]
PASSWORD_GENERAL = "SCORPION7"

DB_PASSWORD  = 'Administ'
INTERVALO_SEG = 3

# Inicializar Supabase con reintentos
supabase = None
def conectar_supabase():
    global supabase
    while True:
        try:
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            break
        except Exception as e:
            print(f"[SUPABASE] Error de conexión inicial: {e}. Reintentando en 10s...")
            time.sleep(10)

conectar_supabase()

def get_chile_offset() -> str:
    if time.daylight and time.localtime().tm_isdst:
        offset_hours = -3
    else:
        offset_hours = -4
    sign = '+' if offset_hours >= 0 else '-'
    return f"{sign}{abs(offset_hours):02d}:00"

def load_cache():
    if os.path.exists(RUTA_CACHE):
        try:
            with open(RUTA_CACHE, 'r', encoding='utf-8') as f:
                return set(json.load(f))
        except Exception as e:
            print(f"[CACHE] Error: {e}")
    return set()

def save_cache(cache):
    try:
        cache_list = list(cache)
        if len(cache_list) > 3000:
            cache_list = cache_list[-2000:]
        with open(RUTA_CACHE, 'w', encoding='utf-8') as f:
            json.dump(cache_list, f, indent=2)
    except Exception as e:
        print(f"[CACHE] Error guardando: {e}")

def get_ultimo_mdb():
    try:
        archivos = [f for f in os.listdir(CARPETA_EVENTOS) if f.upper().endswith('.MDB')]
    except Exception as e:
        print(f"[ERROR] No se puede leer EVENTOS: {e}")
        return None
    if not archivos:
        return None
    archivos.sort(reverse=True)
    return os.path.join(CARPETA_EVENTOS, archivos[0])

# ============================================================
#  FUNCIONES DE MONITORIZACIÓN Y SUBIDA DE CLIENTES (GENERAL.mdb)
# ============================================================

def buscar_general_mdb():
    for ruta in RUTAS_GENERAL_MDB:
        if os.path.exists(ruta):
            return ruta
    return None

def sincronizar_clientes():
    ruta_general = buscar_general_mdb()
    if not ruta_general:
        print("[MIGRACIÓN CLIENTES] Archivo GENERAL.mdb no encontrado. Omitiendo...")
        return
        
    print(f"[MIGRACIÓN CLIENTES] Leyendo base de datos de clientes: {ruta_general}")
    
    # Copia de seguridad temporal para evitar bloqueo en caliente de Scorpion
    temp_general = ruta_general + ".temp"
    try:
        if os.path.exists(temp_general):
            os.remove(temp_general)
    except:
        pass
        
    try:
        shutil.copy2(ruta_general, temp_general)
        conn_str = (
            f"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};"
            f"DBQ={temp_general};PWD={PASSWORD_GENERAL};ReadOnly=1;"
        )
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        # Obtener columnas
        columns = [row.column_name for row in cursor.columns(table='USUARIOS')]
        
        cursor.execute("SELECT * FROM USUARIOS")
        rows = cursor.fetchall()
        
        clientes = []
        for row in rows:
            doc = {}
            for col, val in zip(columns, row):
                if val is None:
                    doc[col.lower()] = ""
                else:
                    doc[col.lower()] = str(val).strip()
            
            # Solo añadir si tiene número de cuenta
            if doc.get("cuenta"):
                clientes.append(doc)
                
        cursor.close()
        conn.close()
        
        # Subir el JSON mediante la API HTTP de Next.js
        print(f"[MIGRACIÓN CLIENTES] Subiendo {len(clientes)} expedientes a Supabase...")
        api_url = "https://dashboard-ten-self-68.vercel.app/api/sincronizar-clientes"
        headers = {"Content-Type": "application/json"}
        
        res = requests.post(api_url, headers=headers, json=clientes, timeout=30)
        if res.status_code == 200:
            print("[MIGRACIÓN CLIENTES SUCCESS] Clientes actualizados exitosamente en Supabase.")
        else:
            print(f"[MIGRACIÓN CLIENTES ERROR] Error de API: {res.status_code} - {res.text}")
            
    except Exception as e:
        print(f"[MIGRACIÓN CLIENTES ERROR] Fallo durante la sincronización: {e}")
    finally:
        if os.path.exists(temp_general):
            try: os.remove(temp_general)
            except: pass


# ============================================================
#  BUCLE PRINCIPAL DE EVENTOS
# ============================================================

def sincronizar_eventos(cache):
    print("--- Verificando nuevos eventos ---")
    ruta_original = get_ultimo_mdb()
    if not ruta_original:
        print("[INFO] No hay archivos .MDB de eventos.")
        return cache, INTERVALO_SEG

    print(f"[DB] {os.path.basename(ruta_original)}")
    chile_tz = get_chile_offset()

    conn = None
    cursor = None
    tiempo_espera = INTERVALO_SEG

    try:
        if os.path.exists(RUTA_COPIA_TEMP):
            try:
                os.remove(RUTA_COPIA_TEMP)
            except Exception:
                pass
        
        shutil.copy2(ruta_original, RUTA_COPIA_TEMP)

        conn_str = (
            f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};'
            f'DBQ={RUTA_COPIA_TEMP};PWD={DB_PASSWORD};ReadOnly=1;'
        )
        
        try:
            conn = pyodbc.connect(conn_str)
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM EVENTOS ORDER BY HORA DESC")
            rows = cursor.fetchall()
        except pyodbc.Error as odbc_err:
            err_msg = str(odbc_err)
            print(f"[ERROR] {err_msg}")
            if "tareas de cliente" in err_msg or "-1036" in err_msg or "08004" in err_msg:
                print(">>> El motor Access está saturado. Esperaremos 10s...")
                tiempo_espera = 10
            return cache, tiempo_espera

        rows.reverse()
        nuevos = 0
        cache_modificada = False

        for row in rows:
            dia     = str(row[0]).strip()
            hora    = str(row[1]).strip()
            cuenta  = str(row[2]).strip()
            nombre  = str(row[3]).strip()
            evento  = str(row[4]).strip()
            zona    = str(row[6]).strip()
            usuario = str(row[7]).strip()

            event_key = f"{dia}_{hora}_{cuenta}_{evento}_{zona}_{usuario}"
            if event_key in cache:
                continue

            partes = dia.split('-')
            if len(partes) == 3:
                if len(partes[0]) == 4:
                    fecha_hora = f'{partes[0]}-{partes[1]}-{partes[2]}T{hora}{chile_tz}'
                else:
                    fecha_hora = f'{partes[2]}-{partes[1]}-{partes[0]}T{hora}{chile_tz}'
            else:
                fecha_hora = hora

            data = {
                "fecha_hora":     fecha_hora,
                "cuenta":         cuenta,
                "nombre_abonado": nombre,
                "evento":         evento,
                "zona":           zona,
                "usuario":        usuario,
            }

            try:
                supabase.table("eventos_monitoreo").insert(data).execute()
                print(f"  [+] {cuenta} | {nombre} | {evento} | Z:{zona}")
                cache.add(event_key)
                cache_modificada = True
                nuevos += 1
            except Exception as e:
                err_str = str(e).lower()
                if "duplicate" in err_str or "23505" in err_str or "already exists" in err_str:
                    cache.add(event_key)
                    cache_modificada = True
                else:
                    print(f"  [ERROR SUPABASE] Fallo de red al insertar: {e}")
                    break

        if cache_modificada:
            save_cache(cache)

        print(f"  >>> {nuevos} evento(s) nuevo(s) subidos." if nuevos > 0 else "  Sin eventos nuevos.")

    except Exception as e:
        print(f"[ERROR CRITICO] {e}")
    finally:
        if cursor:
            try: cursor.close()
            except: pass
        if conn:
            try: conn.close()
            except: pass
        if os.path.exists(RUTA_COPIA_TEMP):
            try: os.remove(RUTA_COPIA_TEMP)
            except: pass

    print(f"--- Esperando {tiempo_espera}s ---\n")
    return cache, tiempo_espera


if __name__ == "__main__":
    print("=" * 65)
    print("  GAMA COMMAND CENTER - Sincronizador v4.0")
    print(f"  Carpeta Eventos: {CARPETA_EVENTOS}")
    print(f"  Timezone: Chile ({get_chile_offset()})")
    print("=" * 65)
    
    # 1. Sincronización inicial de clientes al arrancar
    print("\n[+] Iniciando sincronización inicial de clientes de GENERAL.mdb...")
    sincronizar_clientes()
    
    # 2. Control de tiempo de modificación de GENERAL.mdb
    ruta_general = buscar_general_mdb()
    last_mtime = os.path.getmtime(ruta_general) if (ruta_general and os.path.exists(ruta_general)) else 0
    
    cache = load_cache()
    
    # Bucle principal
    while True:
        # Verificar si GENERAL.mdb ha cambiado para resincronizar clientes
        ruta_general_current = buscar_general_mdb()
        if ruta_general_current and os.path.exists(ruta_general_current):
            try:
                current_mtime = os.path.getmtime(ruta_general_current)
                if current_mtime != last_mtime:
                    print(f"\n[+] Se detecto cambio en GENERAL.mdb ({datetime.fromtimestamp(current_mtime).strftime('%H:%M:%S')})")
                    sincronizar_clientes()
                    last_mtime = current_mtime
            except Exception as ex:
                print(f"[ERROR MTR] Fallo al monitorear GENERAL.mdb: {ex}")
                
        cache, sleep_time = sincronizar_eventos(cache)
        time.sleep(sleep_time)
