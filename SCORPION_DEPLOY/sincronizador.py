import time, pyodbc, shutil, os, json, sys
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
#  Versión: 3.0 (Irrompible - Manejo estricto de bloqueos Access)
# ============================================================

SUPABASE_URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"

# Detectar rutas dinámicas
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

def sincronizar(cache):
    print("--- Verificando nuevos eventos ---")
    ruta_original = get_ultimo_mdb()
    if not ruta_original:
        print("[INFO] No hay archivos .MDB.")
        return cache, INTERVALO_SEG

    print(f"[DB] {os.path.basename(ruta_original)}")
    chile_tz = get_chile_offset()

    conn = None
    cursor = None
    tiempo_espera = INTERVALO_SEG

    try:
        # Copia robusta del archivo para evitar bloqueos del archivo en uso
        if os.path.exists(RUTA_COPIA_TEMP):
            try:
                os.remove(RUTA_COPIA_TEMP)
            except Exception:
                pass
        
        # Copiar de forma que no bloquee lecturas/escrituras concurrentes
        shutil.copy2(ruta_original, RUTA_COPIA_TEMP)

        conn_str = (
            f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};'
            f'DBQ={RUTA_COPIA_TEMP};PWD={DB_PASSWORD};ReadOnly=1;'
        )
        
        # Conectar a la base de datos con manejo estricto de errores de tareas de cliente
        try:
            conn = pyodbc.connect(conn_str)
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM EVENTOS ORDER BY HORA DESC")
            rows = cursor.fetchall()
        except pyodbc.Error as odbc_err:
            err_msg = str(odbc_err)
            print(f"[ERROR] {err_msg}")
            
            # Si el motor Access reporta saturación de conexiones (-1036 / Demasiadas tareas de cliente)
            # incrementamos el tiempo de espera del bucle principal a 10s para dejar liberar recursos
            if "tareas de cliente" in err_msg or "-1036" in err_msg or "08004" in err_msg:
                print(">>> El motor Access está saturado. Esperaremos 10s para liberar conexiones...")
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

            # Construir timestamp
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
                # Insertar en Supabase. Si falla, se atrapa el error
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
                    # En caso de desconexión con Supabase, paramos la iteración de esta tanda
                    # para no perder la secuencia y reintentar en la siguiente vuelta.
                    break

        if cache_modificada:
            save_cache(cache)

        print(f"  >>> {nuevos} evento(s) nuevo(s) subidos." if nuevos > 0 else "  Sin eventos nuevos.")

    except Exception as e:
        print(f"[ERROR CRITICO] {e}")
    finally:
        # Asegurar el cierre estricto de los cursores y conexiones para no consumir recursos de Access
        if cursor:
            try: cursor.close()
            except: pass
        if conn:
            try: conn.close()
            except: pass
            
        if os.path.exists(RUTA_COPIA_TEMP):
            try:
                os.remove(RUTA_COPIA_TEMP)
            except:
                pass

    print(f"--- Esperando {tiempo_espera}s ---\n")
    return cache, tiempo_espera


if __name__ == "__main__":
    print("=" * 55)
    print("  GAMA COMMAND CENTER - Sincronizador v3.0")
    print(f"  Carpeta: {CARPETA_EVENTOS}")
    print(f"  Timezone: Chile ({get_chile_offset()})")
    print("=" * 55)
    cache = load_cache()
    while True:
        cache, sleep_time = sincronizar(cache)
        time.sleep(sleep_time)
