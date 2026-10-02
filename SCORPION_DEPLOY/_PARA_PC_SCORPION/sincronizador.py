import time, pyodbc, shutil, os, json, sys, re, subprocess
from datetime import datetime, date, timezone, timedelta
import requests
import pymysql

try:
    from zoneinfo import ZoneInfo
except ImportError:
    ZoneInfo = None

# ════════════════════════════════════════════════════════════════
#  GAMA COMMAND CENTER - SINCRONIZADOR HÍBRIDO INDESTRUCTIBLE v6.5
#  - Fuente 1: MySQL Central IPRS (Retransmisión en Vivo IP 1C7...)
#  - Fuente 2: Bases de Datos Access (.MDB) locales Scorpion en PC Central
#  - Traducción Universal SIA (DC-03 / DC-05) y Contact ID en Vivo
#  - Sincronización Estricta de Horarios con Scorpion (America/Santiago)
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
    "Prefer": "resolution=ignore-duplicates,return=minimal"
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
PASSWORDS_PROBAR_MDB = ['SCORPION7', 'Administ', 'SCORPION29', '', 'scorpion', 'SCORPION', 'SCORPION2026', 'admin', 'ADMIN']
MDB_PASSWORD_CACHE = {}
MDB_FILE_STATE = {}

# ── DICCIONARIO COMPLETO SIA (DC-03 / DC-05) TRADUCIDO AL ESPAÑOL ──
SIA_MAP = {
    # Asalto / Holdup (Atraco / Coacción)
    'HA': 'ALARMA DE ASALTO', 'HH': 'RESTABLECIMIENTO ASALTO', 'HR': 'RESTABLECIMIENTO ASALTO',
    'HJ': 'FALLA ZONA DE ASALTO', 'HK': 'RESTABLEC. FALLA ASALTO', 'HT': 'ASALTO SILENCIOSO', 'HP': 'ASALTO VERIFICADO',
    # Médico / Auxilio
    'MA': 'EMERGENCIA MEDICA', 'MH': 'RESTABLECIMIENTO MEDICO', 'MR': 'RESTABLECIMIENTO MEDICO',
    'MJ': 'FALLA ZONA MEDICA', 'MK': 'RESTABLEC. FALLA MEDICA', 'MB': 'ANULACION ZONA MEDICA',
    'QA': 'EMERGENCIA AUXILIO', 'QH': 'RESTABLECIMIENTO AUXILIO', 'QR': 'RESTABLECIMIENTO AUXILIO',
    # Robo / Intrusión
    'BA': 'ALARMA DE ROBO', 'BH': 'RESTABLECIMIENTO ROBO', 'BR': 'RESTABLECIMIENTO ROBO',
    'BC': 'CANCELACION DE ALARMA', 'BV': 'ROBO VERIFICADO', 'BB': 'ANULACION DE ZONA (BYPASS)',
    'BU': 'DESANULACION DE ZONA', 'BJ': 'FALLA ZONA DE ROBO', 'BK': 'RESTABLEC. FALLA ROBO',
    'BM': 'SUPERVISION ROBO', 'BT': 'ALARMA ROBO RETARDADA', 'BZ': 'ALARMA ROBO PERIMETRAL',
    # Pánico
    'PA': 'ALARMA DE PANICO', 'PH': 'RESTABLECIMIENTO PANICO', 'PR': 'RESTABLECIMIENTO PANICO',
    'PJ': 'FALLA ZONA DE PANICO', 'PK': 'RESTABLEC. FALLA PANICO', 'PB': 'BYPASS ZONA PANICO',
    # Fuego / Humo
    'FA': 'ALARMA DE FUEGO', 'FH': 'RESTABLECIMIENTO FUEGO', 'FR': 'RESTABLECIMIENTO FUEGO',
    'FS': 'FLUJO DE AGUA (SPRINKLER)', 'FJ': 'FALLA ZONA DE FUEGO', 'FK': 'RESTABLEC. FALLA FUEGO',
    'FB': 'BYPASS DE FUEGO', 'FU': 'DESANULACION BYPASS FUEGO',
    'KA': 'ALARMA SENSOR DE CALOR', 'KH': 'RESTABLECIMIENTO CALOR',
    'SA': 'ALARMA SENSOR DE HUMO', 'SH': 'RESTABLECIMIENTO HUMO',
    # Tamper / Sabotaje
    'TA': 'TAMPER / SABOTAJE', 'TH': 'RESTABLECIMIENTO TAMPER', 'TR': 'RESTABLECIMIENTO TAMPER',
    'TB': 'BYPASS DE TAMPER', 'TU': 'DESANULACION TAMPER', 'TJ': 'FALLA ZONA TAMPER', 'TK': 'RESTABLEC. FALLA TAMPER',
    # Condiciones Técnicas / Gas / Agua / Temperatura
    'GA': 'ALARMA DE GAS', 'GH': 'RESTABLECIMIENTO GAS', 'GR': 'RESTABLECIMIENTO GAS',
    'WA': 'ALARMA DE INUNDACION', 'WH': 'RESTABLECIMIENTO AGUA', 'WR': 'RESTABLECIMIENTO AGUA',
    'ZA': 'ALARMA CONGELAMIENTO', 'ZH': 'RESTABLEC. CONGELAMIENTO',
    # Eléctrico / Batería
    'AT': 'FALLA DE CORRIENTE ALTERNA (AC)', 'AR': 'RESTABLEC. CORRIENTE AC', 'AH': 'RESTABLEC. CORRIENTE AC',
    'YT': 'BATERIA BAJA DEL SISTEMA', 'YR': 'RESTABLECIMIENTO BATERIA', 'YH': 'RESTABLECIMIENTO BATERIA',
    'LB': 'BATERIA BAJA', 'LR': 'RESTABLECIMIENTO BATERIA',
    'XT': 'BATERIA TRANSMISOR BAJA', 'XR': 'RESTABLEC. BATERIA TRANSMISOR',
    'YP': 'FALLA FUENTE DE PODER', 'YQ': 'RESTABLEC. FUENTE DE PODER',
    # Cierres / Aperturas (Armado / Desarmado)
    'CL': 'CIERRE', 'CP': 'CIERRE PROGRAMADO', 'CA': 'CIERRE AUTOMATICO', 'CG': 'CIERRE DE GRUPO',
    'CR': 'CIERRE RECIENTE', 'CF': 'CIERRE FORZADO', 'CT': 'CIERRE TARDIO', 'CE': 'CIERRE EXTENDIDO',
    'OP': 'APERTURA', 'OA': 'APERTURA AUTOMATICA', 'OG': 'APERTURA DE GRUPO', 'OR': 'DESARME TRAS ALARMA',
    'OQ': 'APERTURA REMOTA', 'OK': 'APERTURA TEMPRANA', 'OT': 'APERTURA TARDIA',
    # Tests / Supervisión / Sistema
    'RP': 'AUTOTEST', 'RX': 'AUTOTEST MANUAL', 'RY': 'AUTOTEST', 'TX': 'AUTOTEST',
    'TS': 'INICIO DE TEST', 'TE': 'FIN DE TEST', 'TW': 'TEST DE CAMINATA',
    'ZZ': 'IDENTIFICADOR DE PANEL'
}

# ── DICCIONARIO FALLBACK CONTACT ID (CID) ──────────────────────────
CID_FALLBACK_MAP = {
    'E100': 'ALARMA MEDICA', 'R100': 'RESTABLECIMIENTO MEDICO',
    'E110': 'ALARMA DE FUEGO', 'R110': 'RESTABLECIMIENTO FUEGO',
    'E120': 'ALARMA DE PANICO', 'R120': 'RESTABLECIMIENTO PANICO',
    'E121': 'PANICO BAJO COACCION', 'R121': 'RESTABLECIMIENTO COACCION',
    'E122': 'PANICO SILENCIOSO / ASALTO', 'R122': 'RESTABLECIMIENTO ASALTO',
    'E130': 'ALARMA DE ROBO', 'R130': 'RESTABLECIMIENTO DE ROBO',
    'E131': 'ALARMA PERIMETRAL', 'R131': 'RESTABLECIMIENTO PERIMETRAL',
    'E132': 'ALARMA INTERIOR', 'R132': 'RESTABLECIMIENTO INTERIOR',
    'E137': 'TAMPER / SABOTAJE', 'R137': 'RESTABLECIMIENTO TAMPER',
    'E301': 'FALLA DE CORRIENTE ALTERNA', 'R301': 'RESTABLECIMIENTO AC',
    'E302': 'BATERIA BAJA', 'R302': 'RESTABLECIMIENTO BATERIA',
    'E351': 'FALLA LINEA TELEFONICA', 'R351': 'RESTABLECIMIENTO TELEFONICO',
    'E400': 'APERTURA / CIERRE', 'R400': 'CIERRE ESPECIAL',
    'E401': 'APERTURA', 'R401': 'CIERRE',
    'E402': 'APERTURA DE GRUPO', 'R402': 'CIERRE DE GRUPO',
    'E406': 'APERTURA TRAS ALARMA',
    'E407': 'ARME/DESARME REMOTO', 'R407': 'CIERRE REMOTO',
    'E408': 'ARME RAPIDO', 'R408': 'CIERRE RAPIDO',
    'E409': 'APERTURA CON LLAVE', 'R409': 'CIERRE CON LLAVE',
    'E530': 'FALLA COBERTURA INALAMBRICA', 'R530': 'RESTABLECIMIENTO COBERTURA',
    'E570': 'ANULACION DE ZONA (BYPASS)', 'R570': 'DESANULACION DE ZONA',
    'E602': 'AUTOTEST', 'R602': 'AUTOTEST OK',
}

def get_chile_offset_info():
    """ Calcula de forma dinámica y exacta el huso horario oficial de Chile """
    if ZoneInfo:
        try:
            now_cl = datetime.now(ZoneInfo("America/Santiago"))
            offset_seconds = now_cl.utcoffset().total_seconds()
            offset_hours = int(offset_seconds // 3600)
            offset_minutes = int((abs(offset_seconds) % 3600) // 60)
            sign = "+" if offset_hours >= 0 else "-"
            tz_str = f"{sign}{abs(offset_hours):02d}:{offset_minutes:02d}"
            return tz_str, offset_hours
        except Exception:
            pass
    # Fallback predeterminado a Chile Continental (Verano UTC-3)
    return "-03:00", -3

def parse_fecha_hora(dia_val, hora_val, chile_tz, add_hours=0):
    """
    Parsea fechas de forma indestructible y tolerante a formatos mixtos:
    - Objetos nativos pyodbc (datetime / date)
    - Cadenas DD/MM/YYYY o MM/DD/YYYY (resuelve con cercanía a fecha actual)
    - Formatos ISO YYYY-MM-DD
    - AM/PM y 24 horas
    """
    now_dt = datetime.now()
    year, month, day = now_dt.year, now_dt.month, now_dt.day
    h, m, s = 0, 0, 0

    # 1. Si pyodbc ya entrega un objeto datetime o date nativo
    if isinstance(dia_val, datetime):
        year, month, day = dia_val.year, dia_val.month, dia_val.day
        if not hora_val:
            h, m, s = dia_val.hour, dia_val.minute, dia_val.second
    elif isinstance(dia_val, date):
        year, month, day = dia_val.year, dia_val.month, dia_val.day
    elif dia_val:
        dia_s = str(dia_val).strip()
        parts_dia = dia_s.split()
        date_part = parts_dia[0].replace('/', '-')
        partes_d = date_part.split('-')
        if len(partes_d) == 3:
            p0 = int(re.sub(r'\D', '', partes_d[0]) or 0)
            p1 = int(re.sub(r'\D', '', partes_d[1]) or 0)
            p2 = int(re.sub(r'\D', '', partes_d[2]) or 0)
            
            if p0 > 1000:  # YYYY-MM-DD
                year, month, day = p0, p1, p2
            elif p2 > 1000 or p2 < 100:  # DD-MM-YYYY o MM-DD-YYYY
                yr = p2 if p2 > 1000 else 2000 + p2
                if p0 > 12 and p1 <= 12:  # p0 es día
                    day, month, year = p0, p1, yr
                elif p1 > 12 and p0 <= 12:  # p1 es día
                    day, month, year = p1, p0, yr
                elif p0 <= 12 and p1 <= 12 and p0 > 0 and p1 > 0:
                    # Ambigüedad (ej: 01/10 vs 10/01 en Octubre): elegir la fecha más cercana al día de hoy
                    try:
                        cand1 = datetime(yr, p1, p0)  # p0=dia, p1=mes
                        diff1 = abs((now_dt - cand1).total_seconds())
                    except Exception: diff1 = float('inf')
                    try:
                        cand2 = datetime(yr, p0, p1)  # p0=mes, p1=dia
                        diff2 = abs((now_dt - cand2).total_seconds())
                    except Exception: diff2 = float('inf')

                    if diff1 <= diff2:
                        day, month, year = p0, p1, yr
                    else:
                        day, month, year = p1, p0, yr

        if len(parts_dia) > 1 and ':' in parts_dia[1] and not hora_val:
            hora_val = parts_dia[1]

    # 2. Parseo de hora
    if hora_val:
        if isinstance(hora_val, datetime):
            h, m, s = hora_val.hour, hora_val.minute, hora_val.second
        else:
            hora_s = str(hora_val).strip()
            is_pm = 'PM' in hora_s.upper() or 'P.M.' in hora_s.upper()
            is_am = 'AM' in hora_s.upper() or 'A.M.' in hora_s.upper()

            tokens = hora_s.split()
            time_token = next((t for t in tokens if ':' in t), hora_s)
            hora_nums = re.sub(r'[^\d:]', '', time_token)
            partes_h = hora_nums.split(':')
            try:
                if len(partes_h) >= 1 and partes_h[0]: h = int(partes_h[0])
                if len(partes_h) >= 2 and partes_h[1]: m = int(partes_h[1])
                if len(partes_h) >= 3 and partes_h[2]: s = int(partes_h[2])
            except Exception: pass

            if is_pm and h < 12: h += 12
            elif is_am and h == 12: h = 0

    base_dt = datetime(year, month, day, h, m, s)
    if add_hours:
        base_dt += timedelta(hours=add_hours)

    return f"{base_dt.year:04d}-{base_dt.month:02d}-{base_dt.day:02d}T{base_dt.hour:02d}:{base_dt.minute:02d}:{base_dt.second:02d}{chile_tz}"

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

def traducir_codigo_evento(raw_code: str) -> str:
    """ Traduce cualquier código SIA o Contact ID crudo a español legible """
    if not raw_code: return ''
    clean = raw_code.strip().upper()

    # 1. Si ya es una descripción en español (contiene espacios o palabras clave)
    if ' ' in clean or any(w in clean for w in ['ALARMA', 'APERTURA', 'CIERRE', 'AUTOTEST', 'RESTABLECIMIENTO', 'BATERIA', 'CORRIENTE', 'PANICO', 'FUEGO', 'SABOTAJE']):
        return clean

    # 2. Buscar en CODIGOS.MDB si está cargado
    if clean in CODIGOS_LOCAL_MAP and CODIGOS_LOCAL_MAP[clean].get('descripcion'):
        return CODIGOS_LOCAL_MAP[clean]['descripcion']

    # 3. Buscar en diccionario SIA de 2 letras
    m_sia_clean = re.match(r'^([A-Z]{2})(?:[\s/_-]?\d+)?$', clean)
    if m_sia_clean and m_sia_clean.group(1) in SIA_MAP:
        return SIA_MAP[m_sia_clean.group(1)]

    # 4. Buscar en diccionario Contact ID
    if clean in CID_FALLBACK_MAP:
        return CID_FALLBACK_MAP[clean]

    # 5. Formato CID con prefijo E/R
    m_cid_clean = re.match(r'^([ER])(\d{3})$', clean)
    if m_cid_clean:
        prefix, num = m_cid_clean.group(1), m_cid_clean.group(2)
        key = f"{prefix}{num}"
        if key in CID_FALLBACK_MAP:
            return CID_FALLBACK_MAP[key]
        if f"E{num}" in CID_FALLBACK_MAP:
            base = CID_FALLBACK_MAP[f"E{num}"]
            return f"RESTABLECIMIENTO {base}" if prefix == 'R' else base

    return clean

def parse_trama_alarma(trama):
    """ Decodifica tramas estándar Contact ID y SIA con traducción total al español """
    if not trama: return None
    trama_clean = str(trama).strip().rstrip('\x14').rstrip('\r').rstrip('\n')
    
    # 1. Contact ID (admite hex mayúsculas y minúsculas: c7cc, C7CC, etc.)
    m_cid = re.search(r'18([a-zA-Z0-9]{4})([ERer])(\d{3})(\d{2})(\d{3})', trama_clean)
    if m_cid:
        cuenta = m_cid.group(1).upper().strip()
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
            desc = CID_FALLBACK_MAP.get(cid_key, cid_key)

        return {
            'cuenta': cuenta,
            'evento': desc,
            'zona': zona,
            'usuario': usuario
        }

    # 2. Formato SIA Estándar y Extendido (DC-03 / DC-05)
    # Soporta [#CUENTA|N.../CODE...], [#CUENTA/CODE...], S01001[#CUENTA|Nri1/OP0002], etc.
    m_sia = re.search(r'\[#?([a-zA-Z0-9]{3,6})(?:\|[^/]*?)?/(?:[^/]*?/)?([A-Za-z]{2})([a-zA-Z0-9_-]*)\]', trama_clean)
    if not m_sia:
        m_sia = re.search(r'\[#?([a-zA-Z0-9]{3,6})\|N[^/]*?/(.*?)\]', trama_clean, re.IGNORECASE)
        if m_sia:
            cuenta = m_sia.group(1).upper().strip()
            payload = m_sia.group(2)
            first_sub = payload.split('/')[0]
            m_sub = re.match(r'([A-Za-z]{2})(.*)', first_sub)
            if m_sub:
                code = m_sub.group(1).upper()
                val = m_sub.group(2).strip()
                desc = SIA_MAP.get(code, code)
                is_user_code = code in ['OP', 'CL', 'OG', 'CG', 'OA', 'CA', 'OR', 'CR', 'OQ', 'CP', 'CF', 'CT', 'CE', 'NL', 'OK', 'OT']
                return {
                    'cuenta': cuenta,
                    'evento': desc,
                    'zona': '' if is_user_code else val,
                    'usuario': val if is_user_code else ''
                }
    else:
        cuenta = m_sia.group(1).upper().strip()
        code = m_sia.group(2).upper()
        val = m_sia.group(3).strip()
        desc = SIA_MAP.get(code, code)
        is_user_code = code in ['OP', 'CL', 'OG', 'CG', 'OA', 'CA', 'OR', 'CR', 'OQ', 'CP', 'CF', 'CT', 'CE', 'NL', 'OK', 'OT']
        return {
            'cuenta': cuenta,
            'evento': desc,
            'zona': '' if is_user_code else val,
            'usuario': val if is_user_code else ''
        }

    # 3. Fallback Resiliente / Dead-Letter Queue: Jamás descartar tramas
    # Si la trama tiene algún identificador de abonado, extraerlo con precisión
    m_any_cta = re.search(r'#([A-Za-z0-9]{3,6})', trama_clean)
    if not m_any_cta:
        m_any_cta = re.search(r'18([A-Za-z0-9]{4})', trama_clean)
    cuenta_fallback = m_any_cta.group(1).upper() if m_any_cta else ""
    
    try:
        dead_log = os.path.join(script_dir, "_tramas_no_reconocidas.log")
        with open(dead_log, "a", encoding="utf-8") as f_dl:
            f_dl.write(f"{datetime.now().isoformat()} | Cuenta: {cuenta_fallback or 'DESCONOCIDA'} | Trama: {trama_clean}\n")
    except Exception: pass

    if cuenta_fallback and (not cuenta_fallback.isdigit() or len(cuenta_fallback) == 4):
        # Limpiar caracteres de control para el nombre del evento
        trama_display = re.sub(r'[\r\n\x00-\x1f]', '', trama_clean)[:30]
        return {
            'cuenta': cuenta_fallback,
            'evento': f"SEÑAL SIN IDENTIFICAR [{trama_display}]",
            'zona': '00',
            'usuario': ''
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
            
            content_local_norm = content_local.replace(b'\r\n', b'\n').strip()
            content_remote_norm = content_remote.replace(b'\r\n', b'\n').strip()
            
            if content_local_norm != content_remote_norm:
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
            "nombre_abonado": "PC CENTRAL EN LINEA (v6.5 Híbrido MDB+IPRS)",
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
    chile_tz, offset_hours = get_chile_offset_info()
    # Diferencia entre reloj MySQL IPRS (Ecuador UTC-5) y Chile (UTC-3 verano = +2h, UTC-4 invierno = +1h)
    mysql_diff_hours = offset_hours + 5

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
            cur.execute("SELECT id, Fecha_Hora, Trama_evento FROM eventos_encriptados WHERE IP_Publica LIKE %s ORDER BY id DESC LIMIT 200", ('%1C7%',))
        else:
            cur.execute("SELECT id, Fecha_Hora, Trama_evento FROM eventos_encriptados WHERE id > %s AND IP_Publica LIKE %s ORDER BY id ASC LIMIT 500", (cursor_id, '%1C7%'))

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
            fecha_hora = parse_fecha_hora(d_part, h_part, chile_tz, add_hours=mysql_diff_hours)

            # Jamás descartar ninguna señal desde el 01/08/2026; ignorar fechas viejas previas para cuidar almacenamiento
            try:
                ev_clean = fecha_hora.split('T')[0]
                ev_parts = [int(p) for p in ev_clean.split('-')]
                ev_date = datetime(ev_parts[0], ev_parts[1], ev_parts[2])
                if ev_date < datetime(2026, 8, 1):
                    continue
            except Exception: pass

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
    """ Retorna únicamente los archivos MDB activos y recientemente modificados para no saturar ODBC """
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
    # Limitar a los 5 archivos más recientes para evitar agotar las tareas cliente ODBC (-1036)
    return [item[1] for item in archivos[:5]]

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
    """ Abre conexión pyodbc reutilizando password probada exitosamente para no saturar Access """
    global MDB_PASSWORD_CACHE
    cached_pwd = MDB_PASSWORD_CACHE.get(ruta_mdb)
    lista_pwd = [cached_pwd] + [p for p in PASSWORDS_PROBAR_MDB if p != cached_pwd] if cached_pwd is not None else PASSWORDS_PROBAR_MDB

    err_ultimo = None
    for pwd in lista_pwd:
        try:
            conn_str = (
                f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};'
                f'DBQ={ruta_mdb};PWD={pwd};ReadOnly=1;'
            )
            c = pyodbc.connect(conn_str)
            MDB_PASSWORD_CACHE[ruta_mdb] = pwd
            return c
        except Exception as e:
            err_ultimo = e
            if '1036' in str(e):
                # Demasiadas tareas de cliente: breve pausa para que Access recicle
                time.sleep(0.3)
            continue
    raise err_ultimo if err_ultimo else Exception("No se pudo abrir MDB")

def sincronizar_desde_mdb(cache):
    global MDB_FILE_STATE
    archivos_mdb = get_archivos_mdb_activos()
    if not archivos_mdb:
        return cache

    chile_tz, _ = get_chile_offset_info()

    for ruta_original in archivos_mdb:
        # Optimización 99%: Solo leer MDB si ha cambiado de peso o timestamp
        try:
            cur_mtime = os.path.getmtime(ruta_original)
            cur_size = os.path.getsize(ruta_original)
            last_state = MDB_FILE_STATE.get(ruta_original)
            if last_state and last_state == (cur_mtime, cur_size):
                continue
        except Exception:
            continue

        ruta_lectura = RUTA_COPIA_TEMP
        if not copiar_mdb_con_retry(ruta_original, RUTA_COPIA_TEMP):
            ruta_lectura = ruta_original

        conn = None
        cursor = None
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
                cuenta  = get_val(row, ['CUENTA'], 2).upper().strip()
                nombre  = get_val(row, ['NOMBRE', 'ABONADO', 'NOMBRE_ABONADO'], 3).strip()
                evento_raw = get_val(row, ['EVENTO'], 4).strip()
                zona    = get_val(row, ['ZONA'], 6).strip()
                usuario = get_val(row, ['USUARIO'], 7).strip()

                if not cuenta or not evento_raw:
                    continue

                # Traducir evento si viene como código SIA o CID
                evento = traducir_codigo_evento(evento_raw)

                # Parseo robusto coordinado con el registro exacto de Scorpion
                fecha_hora = parse_fecha_hora(dia, hora, chile_tz, add_hours=0)

                # Jamás descartar ninguna señal desde el 01/08/2026; ignorar fechas anteriores para cuidar almacenamiento
                try:
                    ev_clean = fecha_hora.split('T')[0]
                    ev_parts = [int(p) for p in ev_clean.split('-')]
                    ev_date = datetime(ev_parts[0], ev_parts[1], ev_parts[2])
                    if ev_date < datetime(2026, 8, 1):
                        continue
                except Exception: pass

                # Nombre resuelto si viene vacío
                if not nombre:
                    nombre = CLIENTES_LOCAL_MAP.get(cuenta, {}).get('nombre', '') if isinstance(CLIENTES_LOCAL_MAP.get(cuenta), dict) else str(CLIENTES_LOCAL_MAP.get(cuenta) or '')
                    if not nombre:
                        nombre = CLIENTES_LOCAL_MAP.get(cuenta.lower(), {}).get('nombre', '') if isinstance(CLIENTES_LOCAL_MAP.get(cuenta.lower()), dict) else str(CLIENTES_LOCAL_MAP.get(cuenta.lower()) or '')
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

        except Exception as e_proc:
            if '1036' in str(e_proc):
                time.sleep(0.5)
        finally:
            MDB_FILE_STATE[ruta_original] = (cur_mtime, cur_size)
            if cursor:
                try: cursor.close()
                except Exception: pass
            if conn:
                try: conn.close()
                except Exception: pass
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
    tz_str, _ = get_chile_offset_info()
    print("=" * 60)
    print("  GAMA COMMAND CENTER - Sincronizador Indestructible v6.5")
    print(f"  Timezone Oficial: Chile ({tz_str})")
    print("  Ingesta Híbrida: MDBs Scorpion Locales + IPRS Cloud")
    print("  Decodificación Total SIA & Contact ID en Español")
    print("=" * 60)
    
    load_maestros()
    cache = load_cache()
    
    while True:
        try:
            cache = sincronizar_ciclo_completo(cache)
        except Exception as e:
            print(f"[LOOP AUTO-RECOVERY]: {e}")
        time.sleep(INTERVALO_SEG)
