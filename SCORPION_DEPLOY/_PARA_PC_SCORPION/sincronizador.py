import time, pyodbc, shutil, os, json, sys, re, subprocess
from datetime import datetime, timezone, timedelta
import requests
import pymysql

# ════════════════════════════════════════════════════════════════
#  GAMA COMMAND CENTER - SINCRONIZADOR HÍBRIDO INDESTRUCTIBLE v6.1
#  - Fuente 1: MySQL Central IPRS (Retransmisión en Vivo IP 1C7...)
#  - Fuente 2: Bases de Datos Access (.MDB) locales Scorpion en PC Central
#  - Auto-Actualización GitHub + Resiliencia Zero-Crash
# ════════════════════════════════════════════════════════════════

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
            return open(GLOBAL_LOCK_FILE, "a+")
        except Exception:
            return None

lock_fp = lock_single_instance()

# ── SUPABASE CONFIG ───────────────────────────────────────────────
SUPABASE_URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"

HEADERS_SUPABASE = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

# ── MYSQL CENTRAL CONFIG (IPRS) ───────────────────────────────────
MYSQL_HOST = "186.4.239.44"
MYSQL_PORT = 3306
MYSQL_USER = "user1"
MYSQL_PASS = "Electro@9713"
MYSQL_DB   = "retransmision"

script_dir = os.path.dirname(os.path.abspath(__file__))
if os.path.basename(script_dir).upper() == "SCORPION_DEPLOY":
    root_dir = os.path.dirname(script_dir)
else:
    root_dir = script_dir

candidatos_rutas_mdb = [
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

rutas_unicas_mdb = []
for p in candidatos_rutas_mdb:
    p_norm = os.path.normpath(p)
    if p_norm.lower() not in [r.lower() for r in rutas_unicas_mdb]:
        rutas_unicas_mdb.append(p_norm)

RUTA_COPIA_TEMP   = os.path.join(TEMP_DIR, '_EVENTOS_TEMP.MDB')
RUTA_CACHE        = os.path.join(TEMP_DIR, '_sincronizador_cache.json')
RUTA_CURSOR_MYSQL = os.path.join(TEMP_DIR, '_sincronizador_mysql_cursor.txt')

INTERVALO_SEG = 3
LAST_HEARTBEAT_TIME = 0
HEARTBEAT_ROW_ID = 1492786
LAST_UPDATE_CHECK = 0
CLIENTES_LOCAL_MAP = {}
CODIGOS_LOCAL_MAP = {}
PASSWORDS_PROBAR_MDB = ['Administ', 'SCORPION29', 'SCORPION7', '', 'scorpion', 'SCORPION', 'SCORPION2026', 'admin', 'ADMIN']

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

def load_maestros():
    """ Carga mapa de clientes y códigos para resolver nombres en vivo """
    global CLIENTES_LOCAL_MAP, CODIGOS_LOCAL_MAP
    candidate_json = [
        os.path.join(root_dir, "dashboard", "src", "lib", "clientes_general.json"),
        os.path.join(script_dir, "clientes_general.json")
    ]
    for cj in candidate_json:
        if os.path.exists(cj):
            try:
                with open(cj, 'r', encoding='utf-8') as f:
                    CLIENTES_LOCAL_MAP = json.load(f)
                break
            except Exception: pass

    try:
        r_cl = requests.get(f"{SUPABASE_URL}/rest/v1/eventos_monitoreo?cuenta=eq.CLIENTES&limit=1", headers=HEADERS_SUPABASE, timeout=5)
        if r_cl.status_code == 200 and r_cl.json():
            db_cl = json.loads(r_cl.json()[0].get('nombre_abonado') or '{}')
            if db_cl:
                CLIENTES_LOCAL_MAP.update(db_cl)
    except Exception: pass

    try:
        r_co = requests.get(f"{SUPABASE_URL}/rest/v1/eventos_monitoreo?cuenta=eq.CODIGOS&limit=1", headers=HEADERS_SUPABASE, timeout=5)
        if r_co.status_code == 200 and r_co.json():
            db_co = json.loads(r_co.json()[0].get('nombre_abonado') or '{}')
            if db_co:
                CODIGOS_LOCAL_MAP = db_co
    except Exception: pass

def parse_trama_alarma(trama):
    """ Decodifica tramas estándar Contact ID y SIA """
    if not trama: return None
    trama_clean = str(trama).strip().rstrip('\x14').rstrip('\r').rstrip('\n')
    
    # 1. Contact ID
    m_cid = re.search(r'18([A-Z0-9]{4})([ER])(\d{3})(\d{2})(\d{3})', trama_clean)
    if m_cid:
        cuenta = m_cid.group(1).upper()
        tipo = m_cid.group(2).upper()
        code = m_cid.group(3)
        zn_us = m_cid.group(5)
        num = int(zn_us) if zn_us.isdigit() else 0
        
        is_user_code = code in ['400', '401', '402', '403', '404', '405', '406', '407', '408', '409']
        if is_user_code:
            zona = ''
            usuario = str(num) if num > 0 else ''
        else:
            if num >= 500:
                usuario = str(num)
                zona = ''
            else:
                zona = str(num).zfill(3) if num > 0 else ''
                usuario = ''

        cid_key = f"{tipo}{code}"
        desc = ""
        if cid_key in CODIGOS_LOCAL_MAP:
            desc = CODIGOS_LOCAL_MAP[cid_key].get('descripcion', '')
        if not desc:
            fallback_cid = {
                'E130': 'ALARMA DE ROBO', 'R130': 'RESTABLECIMIENTO DE ROBO',
                'E401': 'APERTURA', 'R401': 'CIERRE',
                'E402': 'APERTURA', 'R402': 'CIERRE',
                'E406': 'APERTURA DESPUES DE ALARMA', 'R400': 'CIERRE ESPECIAL',
                'E602': 'AUTOTEST', 'E110': 'FUEGO', 'E120': 'PANICO',
                'E301': 'FALLA DE CORRIENTE ALTERNA', 'R301': 'RESTABLECIMIENTO AC',
                'E302': 'BATERIA BAJA', 'R302': 'RESTABLECIMIENTO BATERIA'
            }
            desc = fallback_cid.get(cid_key, cid_key)

        return {
            'cuenta': cuenta,
            'evento': desc,
            'zona': zona,
            'usuario': usuario
        }

    # 2. Formato SIA
    m_sia = re.search(r'\[#([A-Z0-9]{4})\|N[^/]*?/(.*?)\]', trama_clean)
    if m_sia:
        cuenta = m_sia.group(1).upper()
        payload = m_sia.group(2)
        subcodes = payload.split('/')
        first_sub = subcodes[0]
        m_sub = re.match(r'([A-Z]{2})(.*)', first_sub)
        if m_sub:
            code = m_sub.group(1).upper()
            val = m_sub.group(2)
            
            sia_map = {
                'OP': 'APERTURA', 'CL': 'CIERRE', 'OG': 'APERTURA', 'CG': 'CIERRE',
                'BA': 'ALARMA DE ROBO', 'BR': 'RESTABLECIMIENTO ROBO',
                'FA': 'FUEGO', 'FR': 'RESTABLECIMIENTO FUEGO',
                'PA': 'PANICO', 'PR': 'RESTABLECIMIENTO PANICO',
                'TA': 'SABOTAJE', 'TR': 'RESTABLECIMIENTO SABOTAJE',
                'RP': 'AUTOTEST', 'RX': 'AUTOTEST', 'RY': 'AUTOTEST',
                'AT': 'FALLA DE CORRIENTE ALTERNA', 'AR': 'RESTABLECIMIENTO AC',
                'LB': 'BATERIA BAJA', 'LR': 'RESTABLECIMIENTO BATERIA'
            }
            desc = sia_map.get(code, code)
            is_user_code = code in ['OP', 'CL', 'OG', 'CG']
            zona = val if not is_user_code else ''
            usuario = val if is_user_code else ''

            return {
                'cuenta': cuenta,
                'evento': desc,
                'zona': zona,
                'usuario': usuario
            }

    return None

def load_cache():
    cache_set = set()
    try:
        res = requests.get(
            f"{SUPABASE_URL}/rest/v1/eventos_monitoreo?select=fecha_hora,cuenta,evento,zona,usuario&cuenta=not.in.(CLIENTES,CODIGOS,ZONAS,__SINCRONIZADOR__,CONFIG_OPERADORES)&order=id.desc&limit=500",
            headers=HEADERS_SUPABASE,
            timeout=15
        )
        if res.status_code == 200:
            for item in res.json():
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
    except Exception:
        pass

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

def enviar_heartbeat():
    global LAST_HEARTBEAT_TIME, HEARTBEAT_ROW_ID
    now = time.time()
    if now - LAST_HEARTBEAT_TIME < 15:
        return
    LAST_HEARTBEAT_TIME = now
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        patch_data = {
            "fecha_hora": now_iso,
            "nombre_abonado": "PC CENTRAL EN LINEA (v6.1 Híbrido MDB+IPRS)",
            "evento": "HEARTBEAT",
            "zona": "000",
            "usuario": "SYSTEM"
        }
        r = requests.patch(
            f"{SUPABASE_URL}/rest/v1/eventos_monitoreo?id=eq.{HEARTBEAT_ROW_ID}",
            headers=HEADERS_SUPABASE,
            json=patch_data,
            timeout=5
        )
        if r.status_code not in [200, 204]:
            requests.patch(
                f"{SUPABASE_URL}/rest/v1/eventos_monitoreo?cuenta=eq.__SINCRONIZADOR__",
                headers=HEADERS_SUPABASE,
                json=patch_data,
                timeout=5
            )

        # Archivo local de heartbeat para el watchdog_total.vbs
        for d in [script_dir, r"C:\SCORPION\BASES DE DATOS", r"C:\SCORPION\BASES DE DATOS\SCORPION_DEPLOY"]:
            if os.path.exists(d):
                hb_path = os.path.join(d, "_sincronizador_heartbeat.txt")
                try:
                    with open(hb_path, "w", encoding="utf-8") as f:
                        f.write(now_iso)
                except Exception: pass
    except Exception:
        pass

# ── FUENTE 1: MySQL Central IPRS ───────────────────────────────────
def sincronizar_desde_mysql(cache):
    chile_tz = get_chile_offset()
    cursor_id = 0
    if os.path.exists(RUTA_CURSOR_MYSQL):
        try:
            with open(RUTA_CURSOR_MYSQL, 'r', encoding='utf-8') as f:
                cursor_id = int(f.read().strip())
        except Exception:
            cursor_id = 0

    try:
        conn = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASS,
            database=MYSQL_DB,
            connect_timeout=4
        )
        cur = conn.cursor()
        
        if cursor_id == 0:
            cur.execute("SELECT id, Fecha_Hora, Trama_evento FROM eventos_encriptados ORDER BY id DESC LIMIT 200")
        else:
            cur.execute("SELECT id, Fecha_Hora, Trama_evento FROM eventos_encriptados WHERE id > %s ORDER BY id ASC LIMIT 500", (cursor_id,))

        rows = cur.fetchall()
        conn.close()

        if not rows:
            return cache

        if cursor_id == 0:
            rows = list(reversed(rows))

        batch_data = []
        batch_keys = []
        max_seen_id = cursor_id

        for row in rows:
            ev_id = row[0]
            fecha_str = row[1]
            trama = row[2]
            if ev_id > max_seen_id:
                max_seen_id = ev_id

            parsed = parse_trama_alarma(trama)
            if not parsed:
                continue

            cuenta = parsed['cuenta']
            evento = parsed['evento']
            zona   = parsed['zona']
            usuario = parsed['usuario']

            f_tokens = str(fecha_str).strip().split()
            d_part = f_tokens[0] if len(f_tokens) > 0 else ""
            h_part = f_tokens[1] if len(f_tokens) > 1 else ""
            fecha_hora = parse_fecha_hora(d_part, h_part, chile_tz)

            nombre_abonado = CLIENTES_LOCAL_MAP.get(cuenta, {}).get('nombre', '') if isinstance(CLIENTES_LOCAL_MAP.get(cuenta), dict) else str(CLIENTES_LOCAL_MAP.get(cuenta) or '')
            if not nombre_abonado:
                nombre_abonado = f"ABONADO {cuenta}"

            event_key = f"{fecha_hora}_{cuenta}_{evento}_{zona}_{usuario}"
            if event_key in cache or event_key in batch_keys:
                continue

            batch_data.append({
                "fecha_hora": fecha_hora,
                "cuenta": cuenta,
                "nombre_abonado": nombre_abonado,
                "evento": evento,
                "zona": zona,
                "usuario": usuario
            })
            batch_keys.append(event_key)

            if len(batch_data) >= 50:
                try:
                    r_ins = requests.post(f"{SUPABASE_URL}/rest/v1/eventos_monitoreo", headers=HEADERS_SUPABASE, json=batch_data, timeout=8)
                    if r_ins.status_code in [200, 201]:
                        for k in batch_keys: cache.add(k)
                        save_cache(cache)
                except Exception:
                    for d, k in zip(batch_data, batch_keys):
                        try:
                            requests.post(f"{SUPABASE_URL}/rest/v1/eventos_monitoreo", headers=HEADERS_SUPABASE, json=[d], timeout=4)
                            cache.add(k)
                        except Exception: pass
                    save_cache(cache)
                batch_data = []
                batch_keys = []

        if batch_data:
            try:
                r_ins = requests.post(f"{SUPABASE_URL}/rest/v1/eventos_monitoreo", headers=HEADERS_SUPABASE, json=batch_data, timeout=8)
                if r_ins.status_code in [200, 201]:
                    for k in batch_keys: cache.add(k)
                    save_cache(cache)
            except Exception:
                for d, k in zip(batch_data, batch_keys):
                    try:
                        requests.post(f"{SUPABASE_URL}/rest/v1/eventos_monitoreo", headers=HEADERS_SUPABASE, json=[d], timeout=4)
                        cache.add(k)
                    except Exception: pass
                save_cache(cache)

        if max_seen_id > cursor_id:
            with open(RUTA_CURSOR_MYSQL, 'w', encoding='utf-8') as f:
                f.write(str(max_seen_id))

    except Exception:
        pass

    return cache

# ── FUENTE 2: Archivos MDB locales de Scorpion ─────────────────────
def get_archivos_mdb_activos():
    archivos = []
    rutas_procesadas = set()

    for ruta in rutas_unicas_mdb:
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

def copiar_mdb_con_retry(ruta_original, ruta_temp, max_intentos=2):
    for intento in range(max_intentos):
        try:
            if os.path.exists(ruta_temp):
                try: os.remove(ruta_temp)
                except Exception: pass

            shutil.copy2(ruta_original, ruta_temp)
            if os.path.exists(ruta_temp) and os.path.getsize(ruta_temp) > 0:
                return True
        except Exception: pass
        time.sleep(0.1)
    return False

def abrir_conexion_mdb(ruta_mdb):
    err_ultimo = None
    for pwd in PASSWORDS_PROBAR_MDB:
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

def sincronizar_desde_mdb(cache):
    archivos_mdb = get_archivos_mdb_activos()
    if not archivos_mdb:
        return cache

    chile_tz = get_chile_offset()

    for ruta_original in archivos_mdb:
        ruta_lectura = RUTA_COPIA_TEMP
        if not copiar_mdb_con_retry(ruta_original, RUTA_COPIA_TEMP):
            ruta_lectura = ruta_original

        try:
            conn = abrir_conexion_mdb(ruta_lectura)
            cursor = conn.cursor()
            
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

                # Ignorar eventos con más de 7 días de antigüedad
                try:
                    ev_clean = fecha_hora.split('T')[0]
                    ev_parts = [int(p) for p in ev_clean.split('-')]
                    ev_date = datetime(ev_parts[0], ev_parts[1], ev_parts[2])
                    if (datetime.now() - ev_date).days > 7:
                        continue
                except Exception: pass

                # Nombre resuelto si viene vacío
                if not nombre:
                    nombre = CLIENTES_LOCAL_MAP.get(cuenta, {}).get('nombre', '') if isinstance(CLIENTES_LOCAL_MAP.get(cuenta), dict) else str(CLIENTES_LOCAL_MAP.get(cuenta) or '')
                    if not nombre:
                        nombre = f"ABONADO {cuenta}"

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
                        r_ins = requests.post(f"{SUPABASE_URL}/rest/v1/eventos_monitoreo", headers=HEADERS_SUPABASE, json=batch_data, timeout=8)
                        if r_ins.status_code in [200, 201]:
                            for k in batch_keys: cache.add(k)
                            save_cache(cache)
                            enviar_heartbeat()
                    except Exception:
                        for d, k in zip(batch_data, batch_keys):
                            try:
                                requests.post(f"{SUPABASE_URL}/rest/v1/eventos_monitoreo", headers=HEADERS_SUPABASE, json=[d], timeout=4)
                                cache.add(k)
                            except Exception: pass
                        save_cache(cache)
                        enviar_heartbeat()
                    batch_data = []
                    batch_keys = []

            if batch_data:
                try:
                    r_ins = requests.post(f"{SUPABASE_URL}/rest/v1/eventos_monitoreo", headers=HEADERS_SUPABASE, json=batch_data, timeout=8)
                    if r_ins.status_code in [200, 201]:
                        for k in batch_keys: cache.add(k)
                        save_cache(cache)
                        enviar_heartbeat()
                except Exception:
                    for d, k in zip(batch_data, batch_keys):
                        try:
                            requests.post(f"{SUPABASE_URL}/rest/v1/eventos_monitoreo", headers=HEADERS_SUPABASE, json=[d], timeout=4)
                            cache.add(k)
                        except Exception: pass
                    save_cache(cache)
                    enviar_heartbeat()

        except Exception:
            pass
        finally:
            if os.path.exists(RUTA_COPIA_TEMP):
                try: os.remove(RUTA_COPIA_TEMP)
                except Exception: pass

    return cache

def sincronizar_ciclo_completo(cache):
    enviar_heartbeat()
    verificar_auto_actualizacion_github()
    
    # 1. Ingesta desde MDBs locales de Scorpion (Servidor físico)
    try:
        cache = sincronizar_desde_mdb(cache)
    except Exception as e_mdb:
        print(f"[MDB LOOP WARN]: {e_mdb}")
    enviar_heartbeat()

    # 2. Ingesta desde IPRS Cloud MySQL (Retransmisión IP)
    try:
        cache = sincronizar_desde_mysql(cache)
    except Exception as e_mysql:
        print(f"[MYSQL LOOP WARN]: {e_mysql}")
    enviar_heartbeat()

    return cache

if __name__ == "__main__":
    print("=" * 60)
    print("  GAMA COMMAND CENTER - Sincronizador Indestructible v6.1")
    print(f"  Timezone: Chile ({get_chile_offset()})")
    print("  Ingesta Híbrida: MDBs Scorpion Locales + IPRS Cloud")
    print("=" * 60)
    
    load_maestros()
    cache = load_cache()
    
    while True:
        try:
            cache = sincronizar_ciclo_completo(cache)
        except Exception as e:
            print(f"[LOOP AUTO-RECOVERY]: {e}")
        time.sleep(INTERVALO_SEG)
