import time, pyodbc, shutil, os, json, sys, requests, ctypes
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

# ── Mutex de Windows (evita duplicados aunque se lance desde VBS, terminal o tarea programada) ──
MUTEX_NAME = "Global\\GAMA_Sincronizador"
kernel32 = ctypes.windll.kernel32
mutex = kernel32.CreateMutexW(None, False, MUTEX_NAME)
if not mutex:
    print("[ERROR] No se pudo crear el mutex de sincronización.")
    sys.exit(1)
if ctypes.GetLastError() == 183:  # ERROR_ALREADY_EXISTS
    print("[ERROR] El sincronizador ya está en ejecución. Saliendo...")
    kernel32.CloseHandle(mutex)
    sys.exit(0)

# ============================================================
#  GAMA COMMAND CENTER - Sincronizador para PC Scorpion
#  Versión: 5.3 (Heartbeat fijo, log flush, crash-safe)
# ============================================================

SUPABASE_URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"

# Rutas de base de datos de EVENTOS
if os.path.exists(r'C:\SCORPION\BASES DE DATOS\EVENTOS'):
    CARPETA_EVENTOS = r'C:\SCORPION\BASES DE DATOS\EVENTOS'
    RUTA_COPIA_TEMP = r'C:\SCORPION\BASES DE DATOS\_EVENTOS_TEMP.MDB'
    RUTA_CACHE      = r'C:\SCORPION\BASES DE DATOS\_sincronizador_cache.json'
    RUTA_CURSOR_JSON = r'C:\SCORPION\BASES DE DATOS\_sincronizador_cursors.json'
else:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if os.path.basename(base_dir).upper() == "SCORPION_DEPLOY":
        root_dir = os.path.dirname(base_dir)
    else:
        root_dir = base_dir
    
    CARPETA_EVENTOS = os.path.join(root_dir, 'BASES DE DATOS', 'EVENTOS')
    RUTA_COPIA_TEMP = os.path.join(root_dir, 'BASES DE DATOS', '_EVENTOS_TEMP.MDB')
    RUTA_CACHE      = os.path.join(root_dir, 'BASES DE DATOS', '_sincronizador_cache.json')
    RUTA_CURSOR_JSON = os.path.join(root_dir, 'BASES DE DATOS', '_sincronizador_cursors.json')

# Rutas del archivo GENERAL.mdb (Clientes de Scorpion)
RUTAS_GENERAL_MDB = [
    r"C:\SCORPION\BASE DE DATOS\GENERAL.mdb",
    r"E:\MONITOREO ONLINE\GENERAL.mdb",
    os.path.join(os.path.dirname(CARPETA_EVENTOS), "BASE DE DATOS", "GENERAL.mdb"),
    os.path.join(os.path.dirname(CARPETA_EVENTOS), "GENERAL.mdb")
]
PASSWORD_GENERAL = "SCORPION7"

# Rutas del archivo CODIGOS.MDB (Mapeo de colores)
RUTAS_CODIGOS_MDB = [
    r"C:\SCORPION\BASES DE DATOS\CODIGOS.MDB",
    r"E:\MONITOREO ONLINE\BASES DE DATOS\CODIGOS.MDB",
    os.path.join(os.path.dirname(CARPETA_EVENTOS), "BASES DE DATOS", "CODIGOS.MDB"),
    os.path.join(os.path.dirname(CARPETA_EVENTOS), "CODIGOS.MDB")
]
PASSWORD_CODIGOS = "SCORPION17"

# Rutas de la carpeta ZONIFICACION (MDBs por abonado)
RUTAS_ZONIFICACION_DIR = [
    r"C:\SCORPION\BASES DE DATOS\ZONIFICACION",
    r"E:\MONITOREO ONLINE\BASES DE DATOS\ZONIFICACION",
    os.path.join(os.path.dirname(CARPETA_EVENTOS), "BASES DE DATOS", "ZONIFICACION"),
    os.path.join(os.path.dirname(CARPETA_EVENTOS), "ZONIFICACION")
]
PASSWORD_ZONAS = "SCORPION29"

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

# Heartbeat: cada N ciclos inserta un marker en Supabase para que el dashboard sepa que vivo
HEARTBEAT_CADENCIA = 10
_heartbeat_counter = 0
_errores_consecutivos = 0

def enviar_heartbeat():
    global _heartbeat_counter
    _heartbeat_counter += 1
    if _heartbeat_counter % HEARTBEAT_CADENCIA != 0:
        return
    try:
        ahora = datetime.now(timezone.utc).isoformat()
        supabase.table("eventos_monitoreo").insert({
            "fecha_hora": ahora,
            "cuenta": "__SINCRONIZADOR__",
            "nombre_abonado": "",
            "evento": "HEARTBEAT",
            "zona": str(os.getpid()),
            "usuario": "",
        }).execute()
    except Exception as e:
        print(f"[HEARTBEAT] Error: {e}")

def get_chile_offset() -> str:
    if time.daylight and time.localtime().tm_isdst:
        offset_hours = -3
    else:
        offset_hours = -4
    sign = '+' if offset_hours >= 0 else '-'
    return f"{sign}{abs(offset_hours):02d}:00"

def log_flush(*args, **kwargs):
    print(*args, **kwargs)
    sys.stdout.flush()

# ── Sistema de cursor: trackea el archivo MDB + último evento para no reprocesar en reinicios ──
RUTA_CURSOR_JSON = os.path.join(os.path.dirname(CARPETA_EVENTOS), '_sincronizador_cursors.json')

def parsear_fecha(dia: str) -> datetime:
    """Intenta parsear una fecha en formato YYYY-MM-DD o DD-MM-YYYY (con/sin hora o usando slashes)."""
    if not dia:
        return None
    s = dia.strip().replace('/', '-')
    s = s.split(' ')[0]
    for fmt in ("%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None

def normalizar_dia(dia: str) -> str:
    """Convierte cualquier formato de fecha a YYYY-MM-DD."""
    dt = parsear_fecha(dia)
    if dt:
        return dt.strftime("%Y-%m-%d")
    partes = dia.split('-')
    if len(partes) == 3 and len(partes[0]) <= 2:
        return f"{partes[2]}-{partes[1]}-{partes[0]}"
    return dia

def load_cursors():
    try:
        with open(RUTA_CURSOR_JSON, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {}

def save_cursors(cursors):
    try:
        temp = RUTA_CURSOR_JSON + ".tmp"
        with open(temp, 'w', encoding='utf-8') as f:
            json.dump(cursors, f, indent=2)
        os.replace(temp, RUTA_CURSOR_JSON)
    except Exception as e:
        print(f"[CURSOR] Error guardando: {e}")

def load_cursor(mdb_name):
    cursors = load_cursors()
    if mdb_name in cursors:
        return mdb_name, cursors[mdb_name].get('dia', ''), cursors[mdb_name].get('hora', '')
    return "", "", ""

def save_cursor(mdb_name, dia, hora):
    cursors = load_cursors()
    cursors[mdb_name] = {'dia': normalizar_dia(dia), 'hora': hora}
    save_cursors(cursors)

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
        temp = RUTA_CACHE + ".tmp"
        with open(temp, 'w', encoding='utf-8') as f:
            json.dump(cache_list, f, indent=2)
        os.replace(temp, RUTA_CACHE)
    except Exception as e:
        print(f"[CACHE] Error guardando: {e}")

# Dias hacia atrás a procesar (0 = todos, 90 = últimos 3 meses)
DIAS_PROCESAR = 90

# Límite de fecha para eventos (solo sube eventos de los últimos DIAS_PROCESAR días)
LIMITE_FECHA_EVENTOS = None

def init_limite_fecha():
    global LIMITE_FECHA_EVENTOS
    if DIAS_PROCESAR > 0:
        LIMITE_FECHA_EVENTOS = (datetime.now() - timedelta(days=DIAS_PROCESAR)).replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        LIMITE_FECHA_EVENTOS = None

def get_todos_mdb():
    """Devuelve lista de archivos MDB de los últimos DIAS_PROCESAR días, ordenados cronológicamente."""
    try:
        archivos = [f for f in os.listdir(CARPETA_EVENTOS) if f.upper().endswith('.MDB')]
    except Exception as e:
        print(f"[ERROR] No se puede leer EVENTOS: {e}")
        return []
    if not archivos:
        return []
    
    def sort_key(f):
        nombre = os.path.splitext(f)[0]
        try:
            return datetime.strptime(nombre, "%Y-%m-%d")
        except ValueError:
            return datetime.fromtimestamp(os.path.getmtime(os.path.join(CARPETA_EVENTOS, f)))
    
    archivos.sort(key=sort_key)
    
    if DIAS_PROCESAR > 0:
        if LIMITE_FECHA_EVENTOS is None:
            init_limite_fecha()
        filtrados = []
        for f in archivos:
            nombre = os.path.splitext(f)[0]
            try:
                f_fecha = datetime.strptime(nombre, "%Y-%m-%d")
                if f_fecha >= LIMITE_FECHA_EVENTOS:
                    filtrados.append(f)
            except ValueError:
                filtrados.append(f)  # si no se puede parsear, incluirlo por seguridad
        archivos = filtrados
    
    return [os.path.join(CARPETA_EVENTOS, f) for f in archivos]

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
        
    conn = None
    cursor = None
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
        
        clientes_map = {}
        for row in rows:
            doc = {}
            for col, val in zip(columns, row):
                if val is None:
                    doc[col.lower()] = ""
                else:
                    doc[col.lower()] = str(val).strip()
            
            # Indexar por número de cuenta (en mayúsculas y sin espacios)
            cuenta = doc.get("cuenta", "").upper().strip()
            if cuenta:
                clientes_map[cuenta] = doc
                
        cursor.close()
        cursor = None
        conn.close()
        conn = None
        
        clientes_json = json.dumps(clientes_map, ensure_ascii=False)
        
        print(f"[MIGRACIÓN CLIENTES] Subiendo {len(clientes_map)} expedientes a Supabase en fila especial...")
        
        # 1. Borrar registro anterior para no duplicar datos
        try:
            supabase.table("eventos_monitoreo").delete().eq("cuenta", "CLIENTES").execute()
        except Exception as del_err:
            print(f"[MIGRACIÓN CLIENTES] Nota al borrar: {del_err}")
            
        # 2. Insertar el nuevo JSON completo en la columna 'nombre_abonado'
        chile_tz = get_chile_offset()
        now_iso = datetime.now().strftime("%Y-%m-%dT%H:%M:%S") + chile_tz
        
        data = {
            "fecha_hora": now_iso,
            "cuenta": "CLIENTES",
            "nombre_abonado": clientes_json,
            "evento": "SINCRONIZACION CLIENTES MDB",
            "zona": "000",
            "usuario": "SYSTEM"
        }
        
        supabase.table("eventos_monitoreo").insert(data).execute()
        print("[MIGRACIÓN CLIENTES SUCCESS] Base de datos de clientes sincronizada exitosamente en Supabase (eventos_monitoreo).")
            
    except Exception as e:
        print(f"[MIGRACIÓN CLIENTES ERROR] Fallo durante la sincronización: {e}")
    finally:
        if cursor:
            try: cursor.close()
            except: pass
        if conn:
            try: conn.close()
            except: pass
        if os.path.exists(temp_general):
            try: os.remove(temp_general)
            except: pass



def buscar_codigos_mdb():
    for ruta in RUTAS_CODIGOS_MDB:
        if os.path.exists(ruta):
            return ruta
    return None

def buscar_zonificacion_dir():
    for ruta in RUTAS_ZONIFICACION_DIR:
        if os.path.exists(ruta) and os.path.isdir(ruta):
            return ruta
    return None

def sincronizar_codigos():
    ruta_codigos = buscar_codigos_mdb()
    if not ruta_codigos:
        print("[MIGRACIÓN CODIGOS] Archivo CODIGOS.MDB no encontrado. Omitiendo...")
        return
        
    print(f"[MIGRACIÓN CODIGOS] Leyendo base de datos de codigos de color: {ruta_codigos}")
    
    # Copia de seguridad temporal
    temp_codigos = ruta_codigos + ".temp"
    try:
        if os.path.exists(temp_codigos):
            os.remove(temp_codigos)
    except: pass
        
    conn = None
    cursor = None
    try:
        shutil.copy2(ruta_codigos, temp_codigos)
        conn_str = (
            f"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};"
            f"DBQ={temp_codigos};PWD={PASSWORD_CODIGOS};ReadOnly=1;"
        )
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        cursor.execute("SELECT CODIGO, DESCRIPCION, [ZN/US], COLORES FROM CODIGOS")
        rows = cursor.fetchall()
        
        codigos_map = {}
        for row in rows:
            codigo = str(row[0]).strip().upper()
            if codigo:
                codigos_map[codigo] = {
                    "descripcion": str(row[1]).strip().upper(),
                    "zn_us": str(row[2]).strip().upper(),
                    "color": str(row[3]).strip().upper()
                }
                
        cursor.close()
        cursor = None
        conn.close()
        conn = None
        
        codigos_json = json.dumps(codigos_map, ensure_ascii=False)
        print(f"[MIGRACIÓN CODIGOS] Subiendo {len(codigos_map)} codigos a Supabase en fila especial...")
        
        try:
            supabase.table("eventos_monitoreo").delete().eq("cuenta", "CODIGOS").execute()
        except: pass
        
        chile_tz = get_chile_offset()
        now_iso = datetime.now().strftime("%Y-%m-%dT%H:%M:%S") + chile_tz
        
        data = {
            "fecha_hora": now_iso,
            "cuenta": "CODIGOS",
            "nombre_abonado": codigos_json,
            "evento": "SINCRONIZACION CODIGOS COLORES MDB",
            "zona": "000",
            "usuario": "SYSTEM"
        }
        supabase.table("eventos_monitoreo").insert(data).execute()
        print("[MIGRACIÓN CODIGOS SUCCESS] Tabla de colores sincronizada exitosamente en Supabase.")
        
    except Exception as e:
        print(f"[MIGRACIÓN CODIGOS ERROR] Fallo: {e}")
    finally:
        if cursor:
            try: cursor.close()
            except: pass
        if conn:
            try: conn.close()
            except: pass
        if os.path.exists(temp_codigos):
            try: os.remove(temp_codigos)
            except: pass



def sincronizar_zonas():
    dir_zonas = buscar_zonificacion_dir()
    if not dir_zonas:
        print("[MIGRACIÓN ZONAS] Directorio ZONIFICACION no encontrado. Omitiendo...")
        return
        
    print(f"[MIGRACIÓN ZONAS] Escaneando directorio de zonificacion: {dir_zonas}")
    archivos = [f for f in os.listdir(dir_zonas) if f.upper().endswith('.MDB')]
    
    if not archivos:
        print("[MIGRACIÓN ZONAS] No se encontraron archivos de zonificacion .MDB. Omitiendo...")
        return
        
    print(f"[MIGRACIÓN ZONAS] Procesando {len(archivos)} archivos de abonados...")
    
    zonas_map = {}
    for archivo in archivos:
        cuenta = os.path.splitext(archivo)[0].upper().strip()
        ruta_mdb = os.path.join(dir_zonas, archivo)
        temp_zonas = ruta_mdb + ".temp"
        
        try:
            if os.path.exists(temp_zonas):
                os.remove(temp_zonas)
        except: pass
        
        conn = None
        cursor = None
        try:
            shutil.copy2(ruta_mdb, temp_zonas)
            conn_str = (
                f"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};"
                f"DBQ={temp_zonas};PWD={PASSWORD_ZONAS};ReadOnly=1;"
            )
            conn = pyodbc.connect(conn_str)
            cursor = conn.cursor()
            
            cursor.execute("SELECT NUMERO, DISPOSITIVOS, AREA FROM ZONAS")
            rows = cursor.fetchall()
            
            lista_zonas = []
            for row in rows:
                num = str(row[0]).strip()
                if num and num != 'None':
                    lista_zonas.append({
                        "numero": num.zfill(2) if num.isdigit() else num,
                        "dispositivo": str(row[1]).strip() if row[1] is not None else "",
                        "area": str(row[2]).strip() if row[2] is not None else ""
                    })
            
            cursor.close()
            cursor = None
            conn.close()
            conn = None
            
            if lista_zonas:
                # Ordenar por número de zona numéricamente
                try:
                    lista_zonas.sort(key=lambda x: int(x['numero']) if x['numero'].isdigit() else 99)
                except: pass
                zonas_map[cuenta] = lista_zonas
                
        except Exception as file_err:
            # Silenciar errores individuales por si hay algún archivo corrupto o abierto
            pass
        finally:
            if cursor:
                try: cursor.close()
                except: pass
            if conn:
                try: conn.close()
                except: pass
            if os.path.exists(temp_zonas):
                try: os.remove(temp_zonas)
                except: pass
                
    if not zonas_map:
        print("[MIGRACIÓN ZONAS] No se pudo leer la zonificación de ningún abonado. Omitiendo...")
        return
        
    try:
        zonas_json = json.dumps(zonas_map, ensure_ascii=False)
        print(f"[MIGRACIÓN ZONAS] Subiendo zonificacion de {len(zonas_map)} abonados a Supabase en fila especial...")
        
        try:
            supabase.table("eventos_monitoreo").delete().eq("cuenta", "ZONAS").execute()
        except: pass
        
        chile_tz = get_chile_offset()
        now_iso = datetime.now().strftime("%Y-%m-%dT%H:%M:%S") + chile_tz
        
        data = {
            "fecha_hora": now_iso,
            "cuenta": "ZONAS",
            "nombre_abonado": zonas_json,
            "evento": "SINCRONIZACION ZONAS MDB",
            "zona": "000",
            "usuario": "SYSTEM"
        }
        supabase.table("eventos_monitoreo").insert(data).execute()
        print(f"[MIGRACIÓN ZONAS SUCCESS] Zonificación de {len(zonas_map)} abonados sincronizada exitosamente en Supabase.")
        
    except Exception as e:
        print(f"[MIGRACIÓN ZONAS ERROR] Fallo al subir consolidado: {e}")


# ============================================================
#  BUCLE PRINCIPAL DE EVENTOS
# ============================================================

def procesar_mdb(ruta_mdb, mdb_name, cache):
    chile_tz = get_chile_offset()
    conn = None
    cursor = None
    nuevos = 0
    cache_modificada = False

    try:
        if os.path.exists(RUTA_COPIA_TEMP):
            try:
                os.remove(RUTA_COPIA_TEMP)
            except Exception:
                pass
        
        shutil.copy2(ruta_mdb, RUTA_COPIA_TEMP)

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
            print(f"[ERROR] {odbc_err}")
            sys.stdout.flush()
            return cache, 0

        rows.reverse()

        # Cargar cursor específico para este MDB
        cur_mdb, cur_dia, cur_hora = load_cursor(mdb_name)
        salteando = bool(cur_dia and cur_hora and cur_mdb == mdb_name)

        if cur_mdb and cur_mdb != mdb_name:
            print(f"  [CURSOR] Nuevo archivo MDB detectado ({mdb_name}), procesando todo...")
            sys.stdout.flush()

        for row in rows:
            dia     = str(row[0]).strip()
            hora    = str(row[1]).strip()
            cuenta  = str(row[2]).strip()
            nombre  = str(row[3]).strip()
            evento  = str(row[4]).strip()
            zona    = str(row[6]).strip()
            usuario = str(row[7]).strip()

            # Filtro por fecha: solo últimos DIAS_PROCESAR días
            if LIMITE_FECHA_EVENTOS:
                ev_fecha = parsear_fecha(dia)
                if ev_fecha and ev_fecha < LIMITE_FECHA_EVENTOS:
                    continue

            if salteando:
                nd = normalizar_dia(dia)
                if nd < cur_dia or (nd == cur_dia and hora <= cur_hora):
                    continue
                salteando = False

            event_key = f"{dia}_{hora}_{cuenta}_{evento}_{zona}_{usuario}"
            if event_key in cache:
                continue

            dia_norm = normalizar_dia(dia)
            partes = dia_norm.split('-')
            if len(partes) == 3:
                fecha_hora = f'{partes[0]}-{partes[1]}-{partes[2]}T{hora}{chile_tz}'
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
                cache.add(event_key)
                cache_modificada = True
                nuevos += 1
            except Exception as e:
                err_str = str(e).lower()
                if "duplicate" in err_str or "23505" in err_str or "already exists" in err_str:
                    cache.add(event_key)
                    cache_modificada = True
                else:
                    raise

        if cache_modificada:
            save_cache(cache)

        # Guardar cursor de este MDB
        if nuevos > 0 or not cur_mdb:
            if rows:
                last = rows[-1]
                save_cursor(mdb_name, str(last[0]).strip(), str(last[1]).strip())

        if nuevos:
            print(f"  [{mdb_name}] >>> {nuevos} nuevo(s).")
            sys.stdout.flush()

        return cache, nuevos

    except Exception as e:
        print(f"[ERROR CRITICO] {e}")
        sys.stdout.flush()
        return cache, 0
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


def sincronizar_eventos(cache):
    global _errores_consecutivos
    _errores_consecutivos = 0
    
    # Inicializar/actualizar el límite de fecha antes de procesar los archivos MDB
    init_limite_fecha()
    
    todos_mdb = get_todos_mdb()
    if not todos_mdb:
        return cache, INTERVALO_SEG

    total_nuevos = 0
    for ruta_mdb in todos_mdb:
        mdb_name = os.path.basename(ruta_mdb)
        mtime = datetime.fromtimestamp(os.path.getmtime(ruta_mdb)).strftime('%H:%M:%S')
        print(f"[DB] {mdb_name} (modificado {mtime})")
        sys.stdout.flush()
        
        cache, nuevos = procesar_mdb(ruta_mdb, mdb_name, cache)
        total_nuevos += nuevos

    enviar_heartbeat()
    _errores_consecutivos = 0
    
    if total_nuevos == 0:
        print(f"  [OK] Sin eventos nuevos en {len(todos_mdb)} archivo(s) MDB")
        sys.stdout.flush()
    
    return cache, INTERVALO_SEG


if __name__ == "__main__":
    try:
        init_limite_fecha()
        log_flush("=" * 65)
        log_flush("  GAMA COMMAND CENTER - Sincronizador v5.3")
        log_flush(f"  Carpeta Eventos: {CARPETA_EVENTOS}")
        log_flush(f"  Timezone: Chile ({get_chile_offset()})")
        log_flush(f"  Heartbeat cada ~{HEARTBEAT_CADENCIA * INTERVALO_SEG}s en Supabase")
        log_flush("=" * 65)
        
        # Pequeña espera al inicio para evitar restart loops violentos
        time.sleep(2)
        
        # 1. Sincronización inicial de clientes al arrancar
        log_flush("\n[+] Iniciando sincronización inicial de clientes de GENERAL.mdb...")
        sincronizar_clientes()
        sys.stdout.flush()
        
        # 2. Sincronización inicial de códigos de color (CODIGOS.MDB)
        log_flush("\n[+] Iniciando sincronización inicial de códigos de color (CODIGOS.MDB)...")
        sincronizar_codigos()
        sys.stdout.flush()
        
        # 3. Sincronización inicial de zonificación de abonados
        log_flush("\n[+] Iniciando sincronización inicial de zonificación de abonados...")
        sincronizar_zonas()
        sys.stdout.flush()
        
        # 4. Control de tiempo de modificación de GENERAL.mdb
        ruta_general = buscar_general_mdb()
        last_mtime = os.path.getmtime(ruta_general) if (ruta_general and os.path.exists(ruta_general)) else 0
        
        # 5. Control de tiempo para resincronización periódica de zonas/códigos (cada 1 hora)
        last_sync_zonas = time.time()
        INTERVALO_ZONAS = 3600  # 1 hora
        
        cache = load_cache()
        
        # Diagnóstico: listar todos los MDB y su fecha de modificación
        log_flush("[+] Archivos MDB en carpeta EVENTOS:")
        sys.stdout.flush()
        try:
            for f in sorted(os.listdir(CARPETA_EVENTOS), key=lambda x: os.path.getmtime(os.path.join(CARPETA_EVENTOS, x)), reverse=True):
                if f.upper().endswith('.MDB'):
                    fm = datetime.fromtimestamp(os.path.getmtime(os.path.join(CARPETA_EVENTOS, f))).strftime('%Y-%m-%d %H:%M:%S')
                    log_flush(f"    {f}  ->  modificado {fm}")
        except Exception as diag_err:
            log_flush(f"    [ERROR] {diag_err}")
        sys.stdout.flush()
        
        log_flush("[+] Sincronización inicial completa. Entrando en bucle principal de eventos...")
        sys.stdout.flush()
        
        # Bucle principal
        while True:
            # Verificar si GENERAL.mdb ha cambiado para resincronizar clientes
            ruta_general_current = buscar_general_mdb()
            if ruta_general_current and os.path.exists(ruta_general_current):
                try:
                    current_mtime = os.path.getmtime(ruta_general_current)
                    if current_mtime != last_mtime:
                        log_flush(f"\n[+] Se detecto cambio en GENERAL.mdb ({datetime.fromtimestamp(current_mtime).strftime('%H:%M:%S')})")
                        sincronizar_clientes()
                        last_mtime = current_mtime
                except Exception as ex:
                    log_flush(f"[ERROR MTR] Fallo al monitorear GENERAL.mdb: {ex}")
            
            # Resincronización periódica de códigos y zonas (cada 1 hora)
            ahora = time.time()
            if ahora - last_sync_zonas >= INTERVALO_ZONAS:
                log_flush(f"\n[+] Resincronización periódica de códigos y zonas ({INTERVALO_ZONAS//60} min)...")
                sincronizar_codigos()
                sincronizar_zonas()
                last_sync_zonas = ahora
                    
            cache, sleep_time = sincronizar_eventos(cache)
            time.sleep(sleep_time)
    except Exception as crash:
        log_flush(f"\n{'='*60}")
        log_flush(f"[CRASH FATAL] El sincronizador se detuvo inesperadamente:")
        log_flush(f"  {crash}")
        import traceback
        traceback.print_exc()
        sys.stdout.flush()
        log_flush(f"{'='*60}")
        log_flush(f"Task Scheduler reiniciará el proceso en 1 minuto.")
        log_flush(f"{'='*60}")
    finally:
        try:
            kernel32.CloseHandle(mutex)
        except:
            pass

