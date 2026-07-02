import time, pyodbc, shutil, os, json
from supabase import create_client

URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"
supabase = create_client(URL, KEY)

CARPETA_EVENTOS = r'E:\MONITOREO ONLINE\BASES DE DATOS\EVENTOS'
ruta_copia = r'E:\MONITOREO ONLINE\EVENTOS_TEMP.MDB'
password = 'Administ'
cache_file = r'E:\MONITOREO ONLINE\sincronizador_cache.json'

def load_cache():
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                return set(json.load(f))
        except Exception as e:
            print(f"Error cargando cache: {e}")
            return set()
    return set()

def save_cache(cache):
    try:
        # Mantener solo los ultimos 300 registros para evitar crecimiento indefinido del JSON
        cache_list = list(cache)
        if len(cache_list) > 300:
            cache_list = cache_list[-200:]
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(cache_list, f, indent=2)
    except Exception as e:
        print(f"Error guardando cache: {e}")

def get_ultimo_mdb():
    archivos = [f for f in os.listdir(CARPETA_EVENTOS) if f.upper().endswith('.MDB')]
    if not archivos: return None
    archivos.sort(reverse=True)
    return os.path.join(CARPETA_EVENTOS, archivos[0])

def sincronizar(cache):
    print("--- Verificando nuevos eventos ---")
    ruta_original = get_ultimo_mdb()
    if not ruta_original:
        print("No hay archivos .MDB")
        return cache

    print(f"Archivo: {os.path.basename(ruta_original)}")
    try:
        if os.path.exists(ruta_copia): os.remove(ruta_copia)
        shutil.copy2(ruta_original, ruta_copia)

        conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={ruta_copia};PWD={password};ReadOnly=1;'
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        # Consultar solo los ultimos 50 eventos para optimizar y reducir carga de red
        cursor.execute("SELECT TOP 50 * FROM EVENTOS ORDER BY HORA DESC")
        rows = cursor.fetchall()
        conn.close()

        # Reversar filas para procesar de los mas antiguos a los mas nuevos
        rows.reverse()
        nuevos = 0
        cache_modificada = False

        for row in rows:
            dia = str(row[0]).strip()
            hora = str(row[1]).strip()
            cuenta = str(row[2]).strip()
            nombre = str(row[3]).strip()
            evento = str(row[4]).strip()
            zona = str(row[6]).strip()
            usuario = str(row[7]).strip()

            # Llave unica compuesta del evento
            event_key = f"{dia}_{hora}_{cuenta}_{evento}_{zona}_{usuario}"

            # Omitir si ya fue procesado y subido con exito
            if event_key in cache:
                continue

            partes = dia.split('-')
            if len(partes) == 3:
                fecha_hora = f'{partes[2]}-{partes[1]}-{partes[0]}T{hora}'
            else:
                fecha_hora = hora

            data = {
                "fecha_hora": fecha_hora,
                "cuenta": cuenta,
                "nombre_abonado": nombre,
                "evento": evento,
                "zona": zona,
                "usuario": usuario
            }
            
            try:
                supabase.table("eventos_monitoreo").insert(data).execute()
                print(f"  [+] Ingestado: {cuenta} - {evento}")
                cache.add(event_key)
                cache_modificada = True
                nuevos += 1
            except Exception as e:
                # Si Supabase reporta llave duplicada, lo marcamos en cache para no reintentar
                cache.add(event_key)
                cache_modificada = True

        if cache_modificada:
            save_cache(cache)

        print(f"  Nuevos: {nuevos} eventos")

    except Exception as e:
        print(f"  ERROR: {e}")

    if os.path.exists(ruta_copia): os.remove(ruta_copia)
    print("--- Esperando 3 segundos ---")
    return cache

if __name__ == "__main__":
    cache = load_cache()
    while True:
        cache = sincronizar(cache)
        time.sleep(3)
