import time, pyodbc, shutil, os, json
from datetime import datetime, timezone, timedelta
from supabase import create_client

# ============================================================
#  GAMA COMMAND CENTER - Sincronizador para PC Scorpion
#  Versión: 2.2 - Rutas dinámicas y fix timezone Chile
# ============================================================

SUPABASE_URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"

# Detectar rutas dinámicas
# Si existe el directorio de Scorpion en C:\, lo priorizamos (PC Scorpion).
# De lo contrario, buscamos en el directorio local del proyecto.
if os.path.exists(r'C:\SCORPION\BASES DE DATOS\EVENTOS'):
    CARPETA_EVENTOS = r'C:\SCORPION\BASES DE DATOS\EVENTOS'
    RUTA_COPIA_TEMP = r'C:\SCORPION\BASES DE DATOS\_EVENTOS_TEMP.MDB'
    RUTA_CACHE      = r'C:\SCORPION\BASES DE DATOS\_sincronizador_cache.json'
else:
    # Ruta relativa al directorio del script
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

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

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

            # Construir timestamp con offset Chile explícito
            # El MDB puede guardar DD-MM-YYYY o YYYY-MM-DD
            partes = dia.split('-')
            if len(partes) == 3:
                if len(partes[0]) == 4:
                    # Formato YYYY-MM-DD
                    fecha_hora = f'{partes[0]}-{partes[1]}-{partes[2]}T{hora}{chile_tz}'
                else:
                    # Formato DD-MM-YYYY
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
    print("  GAMA COMMAND CENTER - Sincronizador v2.2")
    print(f"  Carpeta: {CARPETA_EVENTOS}")
    print(f"  Timezone: Chile ({get_chile_offset()})")
    print("=" * 55)
    cache = load_cache()
    while True:
        cache = sincronizar(cache)
        time.sleep(INTERVALO_SEG)
