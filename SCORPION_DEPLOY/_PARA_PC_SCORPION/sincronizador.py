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
        try:
            os.remove(LOCK_FILE)
        except Exception:
            pass
except Exception:
    pass

try:
    lock_handle = open(LOCK_FILE, "w")
    lock_handle.write(str(os.getpid()))
    lock_handle.flush()
except Exception:
    print("[ERROR] El sincronizador ya está en ejecución en segundo plano. Saliendo...")
    sys.exit(0)

# ============================================================
#  GAMA COMMAND CENTER - Sincronizador para PC Scorpion
#  Versión: 3.6 - Multi-MDB Scan por Fecha de Modificación + Safe Copy
# ============================================================

SUPABASE_URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"

# Detectar rutas dinámicas
script_dir = os.path.dirname(os.path.abspath(__file__))
if os.path.basename(script_dir).upper() == "SCORPION_DEPLOY":
    root_dir = os.path.dirname(script_dir)
else:
    root_dir = script_dir

# Lista ordenada de posibles directorios que contienen bases de datos de eventos .MDB
candidatos_rutas = [
    r'C:\SCORPION\BASES DE DATOS\EVENTOS',
    r'C:\SCORPION\BASE DE DATOS\EVENTOS',
    r'C:\SCORPION\BASES DE DATOS',
    r'C:\SCORPION\BASE DE DATOS',
    r'C:\SCORPION',
    os.path.join(root_dir, 'BASES DE DATOS', 'EVENTOS'),
    os.path.join(root_dir, 'EVENTOS'),
    root_dir,
    r'E:\MONITOREO ONLINE\BASES DE DATOS\EVENTOS',
]

rutas_unicas = []
for p in candidatos_rutas:
    p_norm = os.path.normpath(p)
    if p_norm.lower() not in [r.lower() for r in rutas_unicas]:
        rutas_unicas.append(p_norm)

CARPETA_EVENTOS = None
for ruta in rutas_unicas:
    if os.path.exists(ruta):
        try:
            if any(f.upper().endswith('.MDB') and not f.startswith('_') for f in os.listdir(ruta)):
                CARPETA_EVENTOS = ruta
                break
        except Exception:
            pass

if not CARPETA_EVENTOS:
    for ruta in rutas_unicas:
        if os.path.exists(ruta):
            CARPETA_EVENTOS = ruta
            break

if not CARPETA_EVENTOS:
    CARPETA_EVENTOS = os.path.join(root_dir, 'BASES DE DATOS', 'EVENTOS')

RUTA_COPIA_TEMP = os.path.join(script_dir, '_EVENTOS_TEMP.MDB')
RUTA_CACHE      = os.path.join(script_dir, '_sincronizador_cache.json')

DB_PASSWORD  = 'Administ'
INTERVALO_SEG = 3

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_chile_offset() -> str:
    """Retorna el offset UTC de Chile (-04:00 invierno / -03:00 verano)."""
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
        if len(cache_list) > 5000:
            cache_list = cache_list[-4000:]
        with open(RUTA_CACHE, 'w', encoding='utf-8') as f:
            json.dump(cache_list, f, indent=2)
    except Exception as e:
        print(f"[CACHE] Error guardando: {e}")

def get_archivos_mdb_activos():
    """
    Obtiene todos los archivos .MDB ordenados por FECHA DE MODIFICACIÓN DESCENDENTE.
    Garantiza que se procesen los archivos que Scorpion actualiza en tiempo real,
    sin importar el nombre del archivo.
    """
    try:
        if not os.path.exists(CARPETA_EVENTOS):
            return []
        
        archivos = []
        for f in os.listdir(CARPETA_EVENTOS):
            if f.upper().endswith('.MDB') and not f.startswith('_'):
                full_path = os.path.join(CARPETA_EVENTOS, f)
                try:
                    mtime = os.path.getmtime(full_path)
                    archivos.append((mtime, full_path))
                except Exception:
                    archivos.append((0, full_path))

        archivos.sort(key=lambda x: x[0], reverse=False)
        return [item[1] for item in archivos[-5:]]
    except Exception as e:
        print(f"[ERROR] No se puede leer EVENTOS: {e}")
        return []

def enviar_heartbeat():
    """ Envía señal continua de heartbeat para mantener status VERDE en la central web y notificar a watchdog_total.vbs """
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        supabase.table("eventos_monitoreo").upsert({
            "cuenta": "__SINCRONIZADOR__",
            "nombre_abonado": "PC SCORPION CENTRAL (v3.6 Multi-MDB)",
            "evento": "HEARTBEAT",
            "fecha_hora": now_iso,
            "zona": "000",
            "usuario": "SYSTEM"
        }).execute()

        hb_path = os.path.join(script_dir, "_sincronizador_heartbeat.txt")
        with open(hb_path, "w", encoding="utf-8") as f:
            f.write(now_iso)
    except Exception as e:
        pass

def copiar_mdb_con_retry(ruta_original, ruta_temp, max_intentos=3):
    """ Copia el MDB de Access manejando bloqueos de archivo de forma segura """
    for intento in range(max_intentos):
        try:
            if os.path.exists(ruta_temp):
                try: os.remove(ruta_temp)
                except Exception: pass
            shutil.copy2(ruta_original, ruta_temp)
            return True
        except Exception as e:
            time.sleep(0.2)
    return False

def sincronizar(cache):
    print("--- Verificando nuevos eventos ---")
    enviar_heartbeat()
    
    archivos_mdb = get_archivos_mdb_activos()
    if not archivos_mdb:
        print("[INFO] No hay archivos .MDB de eventos.")
        return cache

    chile_tz = get_chile_offset()
    nuevos_totales = 0
    cache_modificada = False

    for ruta_original in archivos_mdb:
        nombre_base = os.path.basename(ruta_original)
        print(f"[DB] Analizando MDB: {nombre_base}")

        if not copiar_mdb_con_retry(ruta_original, RUTA_COPIA_TEMP):
            print(f"  [WARN] No se pudo copiar {nombre_base} (bloqueado por Scorpion). Reintentando en siguiente ciclo.")
            continue

        try:
            conn_str = (
                f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};'
                f'DBQ={RUTA_COPIA_TEMP};PWD={DB_PASSWORD};ReadOnly=1;'
            )
            conn = pyodbc.connect(conn_str)
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM EVENTOS ORDER BY HORA DESC")
            rows = cursor.fetchall()
            columns = [col[0].upper() for col in cursor.description]
            conn.close()

            def get_val(r, col_names, default_idx):
                for name in col_names:
                    if name in columns:
                        idx = columns.index(name)
                        return str(r[idx]).strip() if r[idx] is not None else ""
                if default_idx < len(r):
                    return str(r[default_idx]).strip() if r[default_idx] is not None else ""
                return ""

            rows.reverse()
            nuevos_este_mdb = 0

            for row in rows:
                dia     = get_val(row, ['DIA'], 0)
                hora    = get_val(row, ['HORA'], 1)
                cuenta  = get_val(row, ['CUENTA'], 2)
                nombre  = get_val(row, ['NOMBRE', 'ABONADO', 'NOMBRE_ABONADO'], 3)
                evento  = get_val(row, ['EVENTO'], 4)
                zona    = get_val(row, ['ZONA'], 6)
                usuario = get_val(row, ['USUARIO'], 7)

                if not cuenta or not evento:
                    continue

                event_key = f"{dia}_{hora}_{cuenta}_{evento}_{zona}_{usuario}"
                if event_key in cache:
                    continue

                partes_hora = hora.split(':')
                if len(partes_hora) == 3:
                    hora_clean = f"{partes_hora[0].zfill(2)}:{partes_hora[1].zfill(2)}:{partes_hora[2].zfill(2)}"
                else:
                    hora_clean = hora

                dia_clean = dia.replace('/', '-')
                partes_dia = dia_clean.split('-')
                
                fecha_hora = None
                if len(partes_dia) == 3:
                    if len(partes_dia[0]) == 4:
                        year, month, day = partes_dia[0], partes_dia[1], partes_dia[2]
                    else:
                        day, month, year = partes_dia[0], partes_dia[1], partes_dia[2]
                    
                    fecha_hora = f"{year}-{month.zfill(2)}-{day.zfill(2)}T{hora_clean}{chile_tz}"
                
                if not fecha_hora:
                    hoy_iso = datetime.now().strftime('%Y-%m-%d')
                    fecha_hora = f"{hoy_iso}T{hora_clean}{chile_tz}"

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
                    nuevos_totales += 1
                    nuevos_este_mdb += 1
                except Exception as e:
                    err_str = str(e).lower()
                    if "duplicate" in err_str or "23505" in err_str or "already exists" in err_str:
                        cache.add(event_key)
                        cache_modificada = True
                    else:
                        print(f"  [ERROR] Fallo de red/conexión al insertar: {e}")

            if nuevos_este_mdb > 0:
                print(f"  >>> {nuevos_este_mdb} eventos subidos desde {nombre_base}")

        except Exception as e:
            print(f"[ERROR] Leyendo {nombre_base}: {e}")
        finally:
            if os.path.exists(RUTA_COPIA_TEMP):
                try: os.remove(RUTA_COPIA_TEMP)
                except Exception: pass

    if cache_modificada:
        save_cache(cache)

    print(f"  >>> Resumen ciclo: {nuevos_totales} evento(s) nuevo(s) subidos en total." if nuevos_totales > 0 else "  Sin eventos nuevos en ningún MDB.")
    print(f"--- Esperando {INTERVALO_SEG}s ---\n")
    return cache


if __name__ == "__main__":
    print("=" * 60)
    print("  GAMA COMMAND CENTER - Sincronizador v3.6 (Multi-MDB mtime)")
    print(f"  Carpeta: {CARPETA_EVENTOS}")
    print(f"  Timezone: Chile ({get_chile_offset()})")
    print("=" * 60)
    
    cache = load_cache()
    while True:
        try:
            cache = sincronizar(cache)
        except Exception as e:
            print(f"[ERROR FATAL EN BUCLE]: {e}")
        time.sleep(INTERVALO_SEG)
