import time, pyodbc, shutil, os, json, sys, re
from datetime import datetime, timezone, timedelta
from supabase import create_client

# Redirigir salida a log si se ejecuta en segundo plano con pythonw.exe (máximo 2MB)
if sys.executable.lower().endswith("pythonw.exe"):
    try:
        log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_gama_log.txt")
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

# Evitar múltiples instancias del sincronizador a la vez en el mismo PC
import msvcrt

# Usar directorio temporal aislado de Windows para evitar CUALQUIER interferencia de archivos en C:\SCORPION
TEMP_DIR = os.path.join(os.environ.get("TEMP", r"C:\Windows\Temp"), "gama_sincronizador")
try: os.makedirs(TEMP_DIR, exist_ok=True)
except Exception: pass

GLOBAL_LOCK_FILE = os.path.join(TEMP_DIR, "_sincronizador_global.lock")

def lock_single_instance():
    lock_file = GLOBAL_LOCK_FILE
    try:
        fp = open(lock_file, "a+")
        fp.seek(0)
        msvcrt.locking(fp.fileno(), msvcrt.LK_NBLCK, 1)
        return fp
    except (IOError, OSError, PermissionError):
        print("[ERROR] El sincronizador ya está en ejecución en otro proceso. Saliendo...")
        sys.exit(0)
    except Exception as e:
        print(f"[ERROR] No se pudo obtener el bloqueo del sincronizador ({e}). Saliendo...")
        sys.exit(0)

lock_fp = lock_single_instance()

# ============================================================
#  GAMA COMMAND CENTER - Sincronizador para PC Scorpion
#  Versión: 3.9 - Cero-Interferencia (Temp en Windows %TEMP%) + Scan Recursivo OPERACION/EVENTOS
# ============================================================

SUPABASE_URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"

script_dir = os.path.dirname(os.path.abspath(__file__))
if os.path.basename(script_dir).upper() == "SCORPION_DEPLOY":
    root_dir = os.path.dirname(script_dir)
else:
    root_dir = script_dir

candidatos_rutas = [
    r'C:\SCORPION\BASES DE DATOS\OPERACION',
    r'C:\SCORPION\BASE DE DATOS\OPERACION',
    r'C:\SCORPION\OPERACION',
    r'C:\SCORPION\BASES DE DATOS\EVENTOS',
    r'C:\SCORPION\BASE DE DATOS\EVENTOS',
    r'C:\SCORPION\BASES DE DATOS',
    r'C:\SCORPION\BASE DE DATOS',
    r'C:\SCORPION',
    os.path.join(root_dir, 'BASES DE DATOS', 'OPERACION'),
    os.path.join(root_dir, 'OPERACION'),
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

RUTA_COPIA_TEMP = os.path.join(TEMP_DIR, '_EVENTOS_TEMP.MDB')
RUTA_CACHE      = os.path.join(TEMP_DIR, '_sincronizador_cache.json')

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

def parse_fecha_hora(dia_str, hora_str, chile_tz):
    """
    Convierte cualquier formato de fecha/hora de Access (12h AM/PM, 24h, DD/MM/YYYY, YYYY-MM-DD, con o sin timestamp)
    a ISO 8601 estricto compatible con PostgreSQL timestamptz.
    Ejemplo: '2026-08-15T09:32:15-04:00'
    """
    now_dt = datetime.now()
    year, month, day = now_dt.year, now_dt.month, now_dt.day

    # 1. Parsear Día (Asegurar remoción de porción de hora '00:00:00')
    if dia_str:
        dia_clean = str(dia_str).split()[0].strip().replace('/', '-')
        partes_d = dia_clean.split('-')
        if len(partes_d) == 3:
            p0 = re.sub(r'\D', '', partes_d[0])
            p1 = re.sub(r'\D', '', partes_d[1])
            p2 = re.sub(r'\D', '', partes_d[2])
            try:
                if len(p0) == 4 and p0 and p1 and p2: # YYYY-MM-DD
                    year, month, day = int(p0), int(p1), int(p2)
                elif len(p2) == 4 and p0 and p1 and p2: # DD-MM-YYYY
                    day, month, year = int(p0), int(p1), int(p2)
                elif len(p2) == 2 and p0 and p1 and p2: # DD-MM-YY
                    day, month, year = int(p0), int(p1), 2000 + int(p2)
            except Exception:
                pass

    # 2. Parsear Hora (convertir AM/PM a 24 Horas)
    h, m, s = 0, 0, 0
    if hora_str:
        hora_clean = str(hora_str).strip()
        is_pm = 'PM' in hora_clean.upper() or 'P.M.' in hora_clean.upper()
        is_am = 'AM' in hora_clean.upper() or 'A.M.' in hora_clean.upper()

        hora_nums = re.sub(r'[^\d:]', '', hora_clean)
        partes_h = hora_nums.split(':')
        try:
            if len(partes_h) >= 1 and partes_h[0]: h = int(partes_h[0])
            if len(partes_h) >= 2 and partes_h[1]: m = int(partes_h[1])
            if len(partes_h) >= 3 and partes_h[2]: s = int(partes_h[2])
        except Exception:
            pass

        if is_pm and h < 12:
            h += 12
        elif is_am and h == 12:
            h = 0

    return f"{year:04d}-{month:02d}-{day:02d}T{h:02d}:{m:02d}:{s:02d}{chile_tz}"

CACHE_VERSION_FILE = os.path.join(TEMP_DIR, "_cache_version.txt")
CACHE_CURRENT_VERSION = "v4.1_force_purge_temp_cache_v5"

def load_cache():
    # Purga total de cualquier archivo de cache antiguo en TEMP o en carpetas de Scorpion
    try:
        ver_actual = ""
        if os.path.exists(CACHE_VERSION_FILE):
            with open(CACHE_VERSION_FILE, "r") as vf: ver_actual = vf.read().strip()
        if ver_actual != CACHE_CURRENT_VERSION:
            posibles_caches = [
                RUTA_CACHE,
                os.path.join(script_dir, '_sincronizador_cache.json'),
                r'C:\SCORPION\BASES DE DATOS\_sincronizador_cache.json',
                r'C:\SCORPION\BASES DE DATOS\SCORPION_DEPLOY\_sincronizador_cache.json',
            ]
            for cfile in posibles_caches:
                if os.path.exists(cfile):
                    try: os.remove(cfile)
                    except Exception: pass
            with open(CACHE_VERSION_FILE, "w") as vf: vf.write(CACHE_CURRENT_VERSION)
            print("[CACHE] Purga total de cache viciado ejecutada para v4.1")
            return set()
    except Exception:
        pass

    if os.path.exists(RUTA_CACHE):
        try:
            with open(RUTA_CACHE, 'r', encoding='utf-8') as f:
                return set(json.load(f))
        except Exception as e:
            print(f"[CACHE] Error al cargar: {e}")
    return set()

def save_cache(cache):
    try:
        cache_list = list(cache)
        if len(cache_list) > 35000:
            cache_list = cache_list[-30000:]
            cache.clear()
            cache.update(cache_list)
        with open(RUTA_CACHE, 'w', encoding='utf-8') as f:
            json.dump(cache_list, f)
    except Exception as e:
        print(f"[CACHE] Error al guardar en disco: {e}")

LAST_UPDATE_CHECK = 0

def verificar_auto_actualizacion_github():
    """ Revisa GitHub en segundo plano cada 10 minutos. Si hay una nueva versión de sincronizador.py, la descarga y reinicia automáticamente sin intervención humana. """
    global LAST_UPDATE_CHECK
    now = time.time()
    if now - LAST_UPDATE_CHECK < 600:
        return
    LAST_UPDATE_CHECK = now
    try:
        import urllib.request
        url_raw = "https://raw.githubusercontent.com/gamasecuritycl/monitoreo-online/main/sincronizador.py"
        this_file = os.path.abspath(__file__)
        temp_remote = this_file + ".remote"
        
        urllib.request.urlretrieve(url_raw, temp_remote)
        if os.path.exists(temp_remote) and os.path.getsize(temp_remote) > 1000:
            with open(this_file, 'rb') as f1, open(temp_remote, 'rb') as f2:
                content_local = f1.read()
                content_remote = f2.read()
            
            if content_local != content_remote:
                print("[AUTO-UPDATE] Nueva versión detectada en GitHub. Aplicando actualización transparente...")
                shutil.copy2(temp_remote, this_file)
                try: os.remove(temp_remote)
                except Exception: pass
                os.execv(sys.executable, [sys.executable, this_file])
            else:
                try: os.remove(temp_remote)
                except Exception: pass
    except Exception as e:
        pass

def get_archivos_mdb_activos():
    """
    Escanea TODAS las carpetas candidatas (C:\SCORPION\BASES DE DATOS\OPERACION, EVENTOS, etc.)
    y sus subcarpetas de forma recursiva (os.walk), retornando los MDBs de eventos más recientes primero.
    """
    ahora = time.time()
    siete_dias_sec = 7 * 86400
    archivos = []
    rutas_procesadas = set()

    for ruta in rutas_unicas:
        if os.path.exists(ruta):
            try:
                for root, dirs, files in os.walk(ruta):
                    for f in files:
                        if f.upper().endswith('.MDB') and not f.startswith('_'):
                            f_base = os.path.splitext(f)[0]
                            # Omitir archivos de zonificación de 4 caracteres (ej: 0014.MDB, C7C9.MDB)
                            if len(f_base) == 4 and f_base.isalnum() and not f_base.startswith('202'):
                                continue
                            full_path = os.path.normpath(os.path.join(root, f))
                            if full_path.lower() not in rutas_procesadas:
                                rutas_procesadas.add(full_path.lower())
                                try:
                                    mtime = os.path.getmtime(full_path)
                                    if (ahora - mtime) <= siete_dias_sec:
                                        archivos.append((mtime, full_path))
                                except Exception:
                                    pass
            except Exception:
                pass

    if not archivos:
        for ruta in rutas_unicas:
            if os.path.exists(ruta):
                try:
                    for root, dirs, files in os.walk(ruta):
                        for f in files:
                            if f.upper().endswith('.MDB') and not f.startswith('_'):
                                f_base = os.path.splitext(f)[0]
                                if len(f_base) == 4 and f_base.isalnum() and not f_base.startswith('202'):
                                    continue
                                full_path = os.path.normpath(os.path.join(root, f))
                                if full_path.lower() not in rutas_procesadas:
                                    rutas_procesadas.add(full_path.lower())
                                    try: archivos.append((os.path.getmtime(full_path), full_path))
                                    except: pass
                except Exception:
                    pass

    archivos.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in archivos[:15]]

def procesar_comandos_sistema():
    try:
        res = supabase.table("eventos_monitoreo").select("id, nombre_abonado").eq("cuenta", "CONFIG_SYSTEM_COMMAND").execute()
        if res.data and len(res.data) > 0:
            for item in res.data:
                cmd = str(item.get("nombre_abonado", "")).strip()
                cmd_id = item.get("id")
                print(f"[REMOTO] Ejecutando comando de sistema: {cmd}")

                if cmd in ["RESTART_WHATSAPP", "CLEAN_WHATSAPP_SESSION"]:
                    os.system("taskkill /f /im node.exe >nul 2>&1")
                    wa_dir = os.path.join(script_dir, "WHATSAPP_SERVER")
                    if not os.path.exists(wa_dir):
                        wa_dir = os.path.join(os.path.dirname(script_dir), "SCORPION_DEPLOY", "WHATSAPP_SERVER")

                    if cmd == "CLEAN_WHATSAPP_SESSION":
                        session_dir = os.path.join(wa_dir, ".baileys-session")
                        if os.path.exists(session_dir):
                            try: shutil.rmtree(session_dir, ignore_errors=True)
                            except Exception as ex: print(f"Error borrando sesión: {ex}")
                        try:
                            supabase.table("eventos_monitoreo").delete().eq("cuenta", "CONFIG_WHATSAPP_SESSION").execute()
                        except: pass

                    wa_js = os.path.join(wa_dir, "whatsapp_server.js")
                    if os.path.exists(wa_js):
                        src_js = os.path.join(script_dir, "_PARA_PC_SCORPION", "whatsapp_server.js")
                        if os.path.exists(src_js) and src_js != wa_js:
                            try: shutil.copy2(src_js, wa_js)
                            except: pass
                        import subprocess
                        subprocess.Popen(["node", wa_js], cwd=wa_dir, creationflags=0x08000000)

                # Eliminar comando procesado
                supabase.table("eventos_monitoreo").delete().eq("id", cmd_id).execute()
    except Exception as e:
        pass

LAST_HEARTBEAT_TIME = 0

def enviar_heartbeat():
    """ Envía señal continua de heartbeat (máx 1 cada 10s) para mantener status VERDE en la central web """
    global LAST_HEARTBEAT_TIME
    now = time.time()
    if now - LAST_HEARTBEAT_TIME < 10:
        return
    LAST_HEARTBEAT_TIME = now
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        supabase.table("eventos_monitoreo").upsert({
            "cuenta": "__SINCRONIZADOR__",
            "nombre_abonado": "PC SCORPION CENTRAL (v3.8 Time24h)",
            "evento": "HEARTBEAT",
            "fecha_hora": now_iso,
            "zona": "000",
            "usuario": "SYSTEM"
        }).execute()

        hb_path = os.path.join(script_dir, "_sincronizador_heartbeat.txt")
        with open(hb_path, "w", encoding="utf-8") as f:
            f.write(now_iso)

        procesar_comandos_sistema()
    except Exception as e:
        pass

PASSWORDS_PROBAR = ['Administ', 'SCORPION29', '', 'scorpion', 'SCORPION', 'SCORPION2026', 'admin', 'ADMIN']

def copiar_mdb_con_retry(ruta_original, ruta_temp, max_intentos=5):
    for intento in range(max_intentos):
        try:
            if os.path.exists(ruta_temp):
                try: os.remove(ruta_temp)
                except Exception: pass
            shutil.copy2(ruta_original, ruta_temp)
            if os.path.exists(ruta_temp) and os.path.getsize(ruta_temp) > 0:
                return True
        except Exception:
            try:
                os.system(f'cmd /c copy /y "{ruta_original}" "{ruta_temp}" >nul 2>&1')
                if os.path.exists(ruta_temp) and os.path.getsize(ruta_temp) > 0:
                    return True
            except Exception:
                pass
            time.sleep(0.3)
    return False

def abrir_conexion_mdb(ruta_mdb):
    err_ultimo = None
    for pwd in PASSWORDS_PROBAR:
        try:
            conn_str = (
                f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};'
                f'DBQ={ruta_mdb};PWD={pwd};ReadOnly=1;'
            )
            return pyodbc.connect(conn_str)
        except Exception as e:
            err_ultimo = e
            continue
    raise err_ultimo if err_ultimo else Exception("No se pudo abrir MDB")

def sincronizar(cache):
    print("--- Verificando nuevos eventos ---")
    enviar_heartbeat()
    verificar_auto_actualizacion_github()
    
    archivos_mdb = get_archivos_mdb_activos()
    if not archivos_mdb:
        print("[INFO] No hay archivos .MDB activos.")
        return cache

    chile_tz = get_chile_offset()
    nuevos_totales = 0

    for ruta_original in archivos_mdb:
        nombre_base = os.path.basename(ruta_original)

        if not copiar_mdb_con_retry(ruta_original, RUTA_COPIA_TEMP):
            print(f"[WARN] No se pudo copiar {nombre_base}")
            continue

        try:
            conn = abrir_conexion_mdb(RUTA_COPIA_TEMP)
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM EVENTOS")
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

            batch_data = []
            batch_keys = []
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

                fecha_hora = parse_fecha_hora(dia, hora, chile_tz)
                event_key = f"{fecha_hora}_{cuenta}_{evento}_{zona}_{usuario}"
                if event_key in cache or event_key in batch_keys:
                    continue

                batch_data.append({
                    "fecha_hora":     fecha_hora,
                    "cuenta":         cuenta,
                    "nombre_abonado": nombre,
                    "evento":         evento,
                    "zona":           zona,
                    "usuario":        usuario,
                })
                batch_keys.append(event_key)

                # Subida por tandas de 50 eventos (50x más rápido)
                if len(batch_data) >= 50:
                    try:
                        supabase.table("eventos_monitoreo").insert(batch_data).execute()
                        for k in batch_keys: cache.add(k)
                        save_cache(cache)
                        enviar_heartbeat()
                        nuevos_este_mdb += len(batch_data)
                        nuevos_totales += len(batch_data)
                    except Exception as e:
                        # Fallback 1 a 1 en caso de cualquier detalle
                        for d, k in zip(batch_data, batch_keys):
                            try:
                                supabase.table("eventos_monitoreo").insert(d).execute()
                                cache.add(k)
                            except Exception as ex:
                                print(f"  [ERROR INSERT] {d['cuenta']} | {d['evento']} | {d['fecha_hora']}: {ex}")
                                # IMPORTANTE: NO agregar a cache si falla, para reintentar en el siguiente ciclo
                        save_cache(cache)
                        enviar_heartbeat()
                    batch_data = []
                    batch_keys = []

            # Procesar residuos finales del MDB
            if batch_data:
                try:
                    supabase.table("eventos_monitoreo").insert(batch_data).execute()
                    for k in batch_keys: cache.add(k)
                    save_cache(cache)
                    enviar_heartbeat()
                    nuevos_este_mdb += len(batch_data)
                    nuevos_totales += len(batch_data)
                except Exception as e:
                    for d, k in zip(batch_data, batch_keys):
                        try:
                            supabase.table("eventos_monitoreo").insert(d).execute()
                            cache.add(k)
                        except Exception as ex:
                            print(f"  [ERROR INSERT] {d['cuenta']} | {d['evento']} | {d['fecha_hora']}: {ex}")
                            # IMPORTANTE: NO agregar a cache si falla, para reintentar en el siguiente ciclo
                    save_cache(cache)
                    enviar_heartbeat()

            if nuevos_este_mdb > 0:
                print(f"  >>> {nuevos_este_mdb} eventos subidos desde {nombre_base}")

        except Exception as e:
            print(f"[ERROR] Leyendo {nombre_base}: {e}")
        finally:
            if os.path.exists(RUTA_COPIA_TEMP):
                try: os.remove(RUTA_COPIA_TEMP)
                except Exception: pass

    print(f"  >>> Resumen ciclo: {nuevos_totales} evento(s) nuevo(s) subidos en total." if nuevos_totales > 0 else "  Sin eventos nuevos en ningún MDB.")
    return cache


if __name__ == "__main__":
    print("=" * 60)
    print("  GAMA COMMAND CENTER - Sincronizador v3.8 (ISO Time 24h + Batch)")
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
