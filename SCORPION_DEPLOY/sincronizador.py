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
    # Mantener el archivo abierto para bloquearlo en Windows
    lock_handle = open(LOCK_FILE, "w")
    lock_handle.write(str(os.getpid()))
    lock_handle.flush()
except Exception:
    print("[ERROR] No se pudo crear el archivo de bloqueo.")
    sys.exit(0)

# ============================================================
#  GAMA COMMAND CENTER - Sincronizador para PC Scorpion
#  Versión: 2.2 - Rutas dinámicas y fix timezone Chile
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
    # Directorio relativo al script en desarrollo/producción
    os.path.join(root_dir, 'BASES DE DATOS', 'EVENTOS'),
    os.path.join(root_dir, 'EVENTOS'),
    root_dir,
    # Rutas estándar en PC Scorpion (unidad C:)
    r'C:\SCORPION\BASES DE DATOS\EVENTOS',
    r'C:\SCORPION\BASE DE DATOS\EVENTOS',
    r'C:\SCORPION\BASES DE DATOS',
    r'C:\SCORPION\BASE DE DATOS',
    r'C:\SCORPION',
    # Unidad E: (antigua, mantenida como fallback secundario)
    r'E:\MONITOREO ONLINE\BASES DE DATOS\EVENTOS',
]

# Filtrar duplicados y normalizar
rutas_unicas = []
for p in candidatos_rutas:
    p_norm = os.path.normpath(p)
    if p_norm.lower() not in [r.lower() for r in rutas_unicas]:
        rutas_unicas.append(p_norm)

# Buscar el primer directorio que exista y contenga archivos .MDB reales
CARPETA_EVENTOS = None
for ruta in rutas_unicas:
    if os.path.exists(ruta):
        try:
            # Comprobar si hay algún archivo .MDB (ignorando temporales)
            if any(f.upper().endswith('.MDB') and not f.startswith('_') for f in os.listdir(ruta)):
                CARPETA_EVENTOS = ruta
                break
        except Exception:
            pass

# Si no encontramos ningún directorio con archivos .MDB, tomamos el primero que exista
if not CARPETA_EVENTOS:
    for ruta in rutas_unicas:
        if os.path.exists(ruta):
            CARPETA_EVENTOS = ruta
            break

# Si nada de lo anterior existe, usar ruta por defecto en el root_dir
if not CARPETA_EVENTOS:
    CARPETA_EVENTOS = os.path.join(root_dir, 'BASES DE DATOS', 'EVENTOS')

# Los archivos de control (temp y cache) se guardan siempre en la carpeta del script (seguro para escritura)
RUTA_COPIA_TEMP = os.path.join(script_dir, '_EVENTOS_TEMP.MDB')
RUTA_CACHE      = os.path.join(script_dir, '_sincronizador_cache.json')

DB_PASSWORD  = 'Administ'
INTERVALO_SEG = 3

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_for_updates():
    """Busca actualizaciones en GitHub y se auto-actualiza si hay cambios."""
    import urllib.request
    
    update_url = "https://raw.githubusercontent.com/gamasecuritycl/monitoreo-online/master/sincronizador.py"
    print("--- Comprobando actualizaciones desde GitHub ---")
    try:
        req = urllib.request.Request(
            update_url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            new_code = response.read().decode('utf-8')
            
        # Validar que el código descargado sea un script de Python válido y compile correctamente
        if "import pyodbc" in new_code and "SUPABASE_URL" in new_code:
            try:
                compile(new_code, "<string>", "exec")
            except SyntaxError as se:
                print(f"[UPDATE] Código descargado contiene errores de sintaxis: {se}")
                return
                
            current_script = os.path.abspath(__file__)
            with open(current_script, "r", encoding="utf-8") as f:
                current_code = f.read()
                
            if new_code.strip() != current_code.strip():
                print("[UPDATE] ¡Nueva versión detectada! Actualizando...")
                # Escribir el nuevo código
                with open(current_script, "w", encoding="utf-8") as f:
                    f.write(new_code)
                print("[UPDATE] Código actualizado con éxito. Reiniciando proceso...")
                
                # Cerrar handle de bloqueo
                try:
                    lock_handle.close()
                except Exception:
                    pass
                
                # Ejecutar la nueva versión reemplazando el proceso actual
                os.execv(sys.executable, [sys.executable] + sys.argv)
            else:
                print("[UPDATE] El sincronizador está en la versión más reciente.")
        else:
            print("[UPDATE] Código descargado inválido (no pasó la validación de firmas).")
    except Exception as e:
        print(f"[UPDATE] Error al comprobar actualizaciones: {e}")

def get_chile_offset() -> str:
    """Retorna el offset UTC de Chile (-04:00 invierno / -03:00 verano)."""
    if time.daylight and time.localtime().tm_isdst:
        offset_hours = -3   # CLST (horario verano)
    else:
        offset_hours = -4   # CLT  (horario invierno)
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
        if len(cache_list) > 2000:
            cache_list = cache_list[-1500:]
        with open(RUTA_CACHE, 'w', encoding='utf-8') as f:
            json.dump(cache_list, f, indent=2)
    except Exception as e:
        print(f"[CACHE] Error guardando: {e}")

def get_ultimo_mdb():
    try:
        # Filtrar archivos .MDB que no empiecen con guion bajo (_) para evitar leer el archivo temporal
        archivos = [f for f in os.listdir(CARPETA_EVENTOS) if f.upper().endswith('.MDB') and not f.startswith('_')]
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
        return cache

    print(f"[DB] {os.path.basename(ruta_original)}")
    chile_tz = get_chile_offset()

    try:
        if os.path.exists(RUTA_COPIA_TEMP):
            os.remove(RUTA_COPIA_TEMP)
        shutil.copy2(ruta_original, RUTA_COPIA_TEMP)

        conn_str = (
            f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};'
            f'DBQ={RUTA_COPIA_TEMP};PWD={DB_PASSWORD};ReadOnly=1;'
        )
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM EVENTOS ORDER BY HORA DESC")
        rows = cursor.fetchall()
        conn.close()

        print(f"  [DEBUG] Filas en MDB: {len(rows)}")
        if rows:
            print(f"  [DEBUG] Más reciente: Dia={str(rows[0][0]).strip()} | Hora={str(rows[0][1]).strip()}")
            print(f"  [DEBUG] Más antiguo: Dia={str(rows[-1][0]).strip()} | Hora={str(rows[-1][1]).strip()}")

        # Mapear índices de columnas de forma dinámica y robusta
        columns = [col[0].upper() for col in cursor.description]
        
        def get_val(r, col_names, default_idx):
            for name in col_names:
                if name in columns:
                    idx = columns.index(name)
                    return str(r[idx]).strip() if r[idx] is not None else ""
            if default_idx < len(r):
                return str(r[default_idx]).strip() if r[default_idx] is not None else ""
            return ""

        rows.reverse()
        nuevos = 0
        cache_modificada = False

        for row in rows:
            dia     = get_val(row, ['DIA'], 0)
            hora    = get_val(row, ['HORA'], 1)
            cuenta  = get_val(row, ['CUENTA'], 2)
            nombre  = get_val(row, ['NOMBRE', 'ABONADO', 'NOMBRE_ABONADO'], 3)
            evento  = get_val(row, ['EVENTO'], 4)
            zona    = get_val(row, ['ZONA'], 6)
            usuario = get_val(row, ['USUARIO'], 7)

            event_key = f"{dia}_{hora}_{cuenta}_{evento}_{zona}_{usuario}"
            if event_key in cache:
                continue

            # Sanitizar componentes de hora (ej: "0:8:26" -> "00:08:26")
            partes_hora = hora.split(':')
            if len(partes_hora) == 3:
                hora_clean = f"{partes_hora[0].zfill(2)}:{partes_hora[1].zfill(2)}:{partes_hora[2].zfill(2)}"
            else:
                hora_clean = hora

            # Construir timestamp con offset Chile explícito
            # Soportar separadores de fecha tanto '-' como '/'
            dia_clean = dia.replace('/', '-')
            partes_dia = dia_clean.split('-')
            
            fecha_hora = None
            if len(partes_dia) == 3:
                if len(partes_dia[0]) == 4:
                    # Formato YYYY-MM-DD
                    year, month, day = partes_dia[0], partes_dia[1], partes_dia[2]
                else:
                    # Formato DD-MM-YYYY (o MM-DD-YYYY, asumimos DD-MM-YYYY por Chile)
                    day, month, year = partes_dia[0], partes_dia[1], partes_dia[2]
                
                # Formatear a estándar ISO con ceros a la izquierda
                fecha_hora = f"{year}-{month.zfill(2)}-{day.zfill(2)}T{hora_clean}{chile_tz}"
            
            # Si no se pudo parsear, usar fecha actual para evitar errores en Supabase
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
                nuevos += 1
            except Exception as e:
                err_str = str(e).lower()
                # 23505 es el código de violación de clave única en PostgreSQL (Supabase)
                if "duplicate" in err_str or "23505" in err_str or "already exists" in err_str:
                    cache.add(event_key)
                    cache_modificada = True
                else:
                    print(f"  [ERROR] Fallo de red/conexión: {e}")

        if cache_modificada:
            save_cache(cache)

        print(f"  >>> {nuevos} evento(s) nuevo(s) subidos." if nuevos > 0 else "  Sin eventos nuevos.")

    except Exception as e:
        print(f"[ERROR] {e}")
    finally:
        if os.path.exists(RUTA_COPIA_TEMP):
            try:
                os.remove(RUTA_COPIA_TEMP)
            except:
                pass

    print(f"--- Esperando {INTERVALO_SEG}s ---\n")
    return cache


if __name__ == "__main__":
    print("=" * 55)
    print("  GAMA COMMAND CENTER - Sincronizador v3.0")
    print(f"  Carpeta: {CARPETA_EVENTOS}")
    print(f"  Timezone: Chile ({get_chile_offset()})")
    print("=" * 55)
    
    # Comprobación inicial de actualizaciones al arrancar
    check_for_updates()
    last_update_check = time.time()
    
    cache = load_cache()
    while True:
        cache = sincronizar(cache)
        
        # Comprobar actualizaciones cada 30 minutos (1800 segundos)
        if time.time() - last_update_check > 1800:
            check_for_updates()
            last_update_check = time.time()
            
        time.sleep(INTERVALO_SEG)
