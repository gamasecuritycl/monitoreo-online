import time, pyodbc, shutil, os, json, sys, re, subprocess
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

import msvcrt

TEMP_DIR = os.path.join(os.environ.get("TEMP", r"C:\Windows\Temp"), "gama_sincronizador")
try: os.makedirs(TEMP_DIR, exist_ok=True)
except Exception: pass

GLOBAL_LOCK_FILE = os.path.join(TEMP_DIR, "_sincronizador_global.lock")

def lock_single_instance():
    """ Bloqueo de auto-recuperación: nunca detiene el script por locks obsoletos """
    try:
        fp = open(GLOBAL_LOCK_FILE, "a+")
        fp.seek(0)
        msvcrt.locking(fp.fileno(), msvcrt.LK_NBLCK, 1)
        return fp
    except Exception:
        try:
            # Si el lock quedó de un proceso anterior muerto, ignorarlo para no detener el servicio
            return open(GLOBAL_LOCK_FILE, "a+")
        except Exception:
            return None

lock_fp = lock_single_instance()

# ============================================================
#  GAMA COMMAND CENTER - Sincronizador Indestructible v5.1
#  Auto-recuperación ante bloqueos, lectura directa ReadOnly y cero caídas
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
    if time.daylight and time.localtime().tm_isdst:
        offset_hours = -3
    else:
        offset_hours = -4
    sign = '+' if offset_hours >= 0 else '-'
    return f"{sign}{abs(offset_hours):02d}:00"

def parse_fecha_hora(dia_str, hora_str, chile_tz):
    now_dt = datetime.now()
    year, month, day = now_dt.year, now_dt.month, now_dt.day
    h, m, s = 0, 0, 0

    if dia_str:
        dia_s = str(dia_str).strip()
        parts_dia = dia_s.split()
        date_part = parts_dia[0].replace('/', '-')
        partes_d = date_part.split('-')
        if len(partes_d) == 3:
            p0 = re.sub(r'\D', '', partes_d[0])
            p1 = re.sub(r'\D', '', partes_d[1])
            p2 = re.sub(r'\D', '', partes_d[2])
            try:
                if len(p0) == 4 and p0 and p1 and p2:
                    year, month, day = int(p0), int(p1), int(p2)
                elif len(p2) == 4 and p0 and p1 and p2:
                    day, month, year = int(p0), int(p1), int(p2)
                elif len(p2) == 2 and p0 and p1 and p2:
                    day, month, year = int(p0), int(p1), 2000 + int(p2)
            except Exception: pass

        if len(parts_dia) > 1 and ':' in parts_dia[1] and not hora_str:
            hora_str = parts_dia[1]

    if hora_str:
        hora_s = str(hora_str).strip()
        is_pm = 'PM' in hora_s.upper() or 'P.M.' in hora_s.upper()
        is_am = 'AM' in hora_s.upper() or 'A.M.' in hora_s.upper()

        tokens = hora_s.split()
        time_token = ""
        for tok in tokens:
            if ':' in tok:
                time_token = tok
                break
        if not time_token:
            time_token = hora_s

        hora_nums = re.sub(r'[^\d:]', '', time_token)
        partes_h = hora_nums.split(':')
        try:
            if len(partes_h) >= 1 and partes_h[0]: h = int(partes_h[0])
            if len(partes_h) >= 2 and partes_h[1]: m = int(partes_h[1])
            if len(partes_h) >= 3 and partes_h[2]: s = int(partes_h[2])
        except Exception: pass

        if is_pm and h < 12: h += 12
        elif is_am and h == 12: h = 0

    return f"{year:04d}-{month:02d}-{day:02d}T{h:02d}:{m:02d}:{s:02d}{chile_tz}"

def load_cache():
    cache_set = set()
    try:
        res = supabase.table("eventos_monitoreo") \
            .select("fecha_hora, cuenta, evento, zona, usuario") \
            .not_("cuenta", "in", "(CLIENTES,CODIGOS,ZONAS,__SINCRONIZADOR__,CONFIG_OPERADORES)") \
            .order("id", desc=True) \
            .limit(2000) \
            .execute()
        if res.data:
            for item in res.data:
                fh = str(item.get("fecha_hora", "")).strip()
                cu = str(item.get("cuenta", "")).strip()
                ev = str(item.get("evento", "")).strip()
                zn = str(item.get("zona", "")).strip()
                us = str(item.get("usuario", "")).strip()
                key = f"{fh}_{cu}_{ev}_{zn}_{us}"
                cache_set.add(key)
            print(f"[CACHE SUPABASE] {len(cache_set)} claves reales cargadas.")
    except Exception as e:
        print(f"[CACHE SUPABASE WARN] {e}")

    if os.path.exists(RUTA_CACHE):
        try:
            with open(RUTA_CACHE, 'r', encoding='utf-8') as f:
                disco_keys = json.load(f)
                cache_set.update(disco_keys)
        except Exception: pass

    return cache_set

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
        pass

LAST_UPDATE_CHECK = 0

def verificar_auto_actualizacion_github():
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
                print("[AUTO-UPDATE] Aplicando actualización de sincronizador.py...")
                shutil.copy2(temp_remote, this_file)
                try: os.remove(temp_remote)
                except Exception: pass
                os.execv(sys.executable, [sys.executable, this_file])
            else:
                try: os.remove(temp_remote)
                except Exception: pass
    except Exception:
        pass

def get_archivos_mdb_activos():
    archivos = []
    rutas_procesadas = set()

    for ruta in rutas_unicas:
        if os.path.exists(ruta):
            try:
                for root, dirs, files in os.walk(ruta):
                    if 'ZONIFICACION' in root.upper():
                        continue
                    for f in files:
                        if f.upper().endswith('.MDB') and not f.startswith('_'):
                            full_path = os.path.normpath(os.path.join(root, f))
                            if full_path.lower() not in rutas_procesadas:
                                rutas_procesadas.add(full_path.lower())
                                try:
                                    mtime = os.path.getmtime(full_path)
                                    archivos.append((mtime, full_path))
                                except Exception: pass
            except Exception: pass

    archivos.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in archivos[:20]]

LAST_HEARTBEAT_TIME = 0

def enviar_heartbeat():
    global LAST_HEARTBEAT_TIME
    now = time.time()
    if now - LAST_HEARTBEAT_TIME < 10:
        return
    LAST_HEARTBEAT_TIME = now
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        supabase.table("eventos_monitoreo").upsert({
            "cuenta": "__SINCRONIZADOR__",
            "nombre_abonado": "PC SCORPION CENTRAL (v5.1)",
            "evento": "HEARTBEAT",
            "fecha_hora": now_iso,
            "zona": "000",
            "usuario": "SYSTEM"
        }).execute()

        hb_path = os.path.join(script_dir, "_sincronizador_heartbeat.txt")
        with open(hb_path, "w", encoding="utf-8") as f:
            f.write(now_iso)
    except Exception:
        pass

PASSWORDS_PROBAR = ['Administ', 'SCORPION29', '', 'scorpion', 'SCORPION', 'SCORPION2026', 'admin', 'ADMIN']

def copiar_mdb_con_retry(ruta_original, ruta_temp, max_intentos=3):
    """ Copia el MDB usando shutil o PowerShell con FileShare.ReadWrite para sobrepasar bloqueos de Access """
    for intento in range(max_intentos):
        try:
            if os.path.exists(ruta_temp):
                try: os.remove(ruta_temp)
                except Exception: pass

            try:
                shutil.copy2(ruta_original, ruta_temp)
                if os.path.exists(ruta_temp) and os.path.getsize(ruta_temp) > 0:
                    return True
            except Exception: pass

            # PowerShell con FileShare.ReadWrite (copia MDBs abiertos por Scorpion)
            ps_cmd = (
                f'powershell -NoProfile -ExecutionPolicy Bypass -Command "'
                f'$src = \'{ruta_original}\'; $dst = \'{ruta_temp}\'; '
                f'try {{ '
                f'  $in = [System.IO.File]::Open($src, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite); '
                f'  $out = [System.IO.File]::Create($dst); '
                f'  $in.CopyTo($out); $in.Close(); $out.Close(); '
                f'}} catch {{}}"'
            )
            os.system(ps_cmd)
            if os.path.exists(ruta_temp) and os.path.getsize(ruta_temp) > 0:
                return True

            os.system(f'cmd /c copy /y "{ruta_original}" "{ruta_temp}" >nul 2>&1')
            if os.path.exists(ruta_temp) and os.path.getsize(ruta_temp) > 0:
                return True
        except Exception: pass
        time.sleep(0.2)
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
    enviar_heartbeat()
    verificar_auto_actualizacion_github()
    
    archivos_mdb = get_archivos_mdb_activos()
    if not archivos_mdb:
        return cache

    chile_tz = get_chile_offset()
    nuevos_totales = 0

    for ruta_original in archivos_mdb:
        nombre_base = os.path.basename(ruta_original)

        # Usar copia temporal o conectar DIRECTAMENTE en ReadOnly si la copia se complica
        ruta_lectura = RUTA_COPIA_TEMP
        if not copiar_mdb_con_retry(ruta_original, RUTA_COPIA_TEMP):
            ruta_lectura = ruta_original

        try:
            conn = abrir_conexion_mdb(ruta_lectura)
            cursor = conn.cursor()
            
            # Buscar tabla EVENTOS u OPERACION
            rows = []
            columns = []
            try:
                cursor.execute("SELECT * FROM EVENTOS")
                rows = cursor.fetchall()
                columns = [col[0].upper() for col in cursor.description]
            except Exception:
                try:
                    cursor.execute("SELECT * FROM OPERACION")
                    rows = cursor.fetchall()
                    columns = [col[0].upper() for col in cursor.description]
                except Exception: pass

            conn.close()

            if not rows:
                continue

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

                if len(batch_data) >= 50:
                    try:
                        supabase.table("eventos_monitoreo").insert(batch_data).execute()
                        for k in batch_keys: cache.add(k)
                        save_cache(cache)
                        enviar_heartbeat()
                        nuevos_totales += len(batch_data)
                    except Exception:
                        for d, k in zip(batch_data, batch_keys):
                            try:
                                supabase.table("eventos_monitoreo").insert(d).execute()
                                cache.add(k)
                            except Exception: pass
                        save_cache(cache)
                        enviar_heartbeat()
                    batch_data = []
                    batch_keys = []

            if batch_data:
                try:
                    supabase.table("eventos_monitoreo").insert(batch_data).execute()
                    for k in batch_keys: cache.add(k)
                    save_cache(cache)
                    enviar_heartbeat()
                    nuevos_totales += len(batch_data)
                except Exception:
                    for d, k in zip(batch_data, batch_keys):
                        try:
                            supabase.table("eventos_monitoreo").insert(d).execute()
                            cache.add(k)
                        except Exception: pass
                    save_cache(cache)
                    enviar_heartbeat()

        except Exception: pass
        finally:
            if os.path.exists(RUTA_COPIA_TEMP):
                try: os.remove(RUTA_COPIA_TEMP)
                except Exception: pass

    return cache


if __name__ == "__main__":
    print("=" * 60)
    print("  GAMA COMMAND CENTER - Sincronizador Indestructible v5.1")
    print(f"  Timezone: Chile ({get_chile_offset()})")
    print("=" * 60)
    
    cache = load_cache()
    while True:
        try:
            cache = sincronizar(cache)
        except Exception as e:
            print(f"[LOOP AUTO-RECOVERY]: {e}")
        time.sleep(INTERVALO_SEG)
