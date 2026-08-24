import time
import os
import sys
import shutil
import json
from datetime import datetime, timezone

# Ensure output redirection for background execution (similar to main synchronizer)
if sys.executable.lower().endswith("pythonw.exe"):
    try:
        log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_gama_clientes_log.txt")
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

# Supabase Credentials
SUPABASE_URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"

# Try importing supabase client, define a request-based fallback if it fails
SUPABASE_CLIENT = None
try:
    from supabase import create_client
    SUPABASE_CLIENT = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"[INIT WARN] Could not initialize Supabase package: {e}. Fallback to HTTP requests will be used.")

import requests

def get_chile_offset() -> str:
    if time.daylight and time.localtime().tm_isdst:
        offset_hours = -3
    else:
        offset_hours = -4
    sign = '+' if offset_hours >= 0 else '-'
    return f"{sign}{abs(offset_hours):02d}:00"

def upload_to_supabase(clientes_json):
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

    # 1. Try using the supabase library first
    if SUPABASE_CLIENT:
        try:
            print("[SUPABASE] Deleting existing CLIENTES row...")
            SUPABASE_CLIENT.table("eventos_monitoreo").delete().eq("cuenta", "CLIENTES").execute()
            print("[SUPABASE] Inserting new CLIENTES data...")
            SUPABASE_CLIENT.table("eventos_monitoreo").insert(data).execute()
            print("[SUPABASE SUCCESS] Uploaded successfully via supabase client.")
            return True
        except Exception as e:
            print(f"[SUPABASE ERROR] Failed via supabase client: {e}. Trying HTTP fallback...")

    # 2. Fallback using REST API requests
    try:
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        # First delete
        del_url = f"{SUPABASE_URL}/rest/v1/eventos_monitoreo?cuenta=eq.CLIENTES"
        r_del = requests.delete(del_url, headers=headers, timeout=15)
        print(f"[HTTP] Delete status: {r_del.status_code}")
        
        # Then insert
        ins_url = f"{SUPABASE_URL}/rest/v1/eventos_monitoreo"
        r_ins = requests.post(ins_url, headers=headers, json=data, timeout=15)
        if r_ins.status_code in [200, 201]:
            print("[HTTP SUCCESS] Uploaded successfully via REST API.")
            return True
        else:
            print(f"[HTTP ERROR] Insert failed: {r_ins.status_code} - {r_ins.text}")
    except Exception as e:
        print(f"[HTTP FALLBACK ERROR] Exception during REST query: {e}")
        
    return False

def update_local_json(clientes_json):
    """ Overwrites the static clientes_general.json fallback inside the Next.js app """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.normpath(os.path.join(script_dir, "..", "dashboard", "src", "lib", "clientes_general.json")),
        r"C:\Users\tetor\Downloads\MONITOREO ONLINE\monitoreo-online\dashboard\src\lib\clientes_general.json"
    ]
    
    updated = False
    for path in candidates:
        if os.path.exists(os.path.dirname(path)):
            try:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(clientes_json)
                print(f"[LOCAL JSON SUCCESS] Updated fallback at: {path}")
                updated = True
            except Exception as e:
                print(f"[LOCAL JSON ERROR] Failed to write to {path}: {e}")
                
    return updated

def read_usuarios_table(mdb_path):
    """ Connects to GENERAL.mdb and returns a list of dictionaries with low-case columns """
    temp_dir = os.path.join(os.environ.get("TEMP", r"C:\Windows\Temp"), "gama_sincronizador")
    os.makedirs(temp_dir, exist_ok=True)
    temp_db_path = os.path.join(temp_dir, "GENERAL_clientes_sync.mdb")

    # 1. Copy file to prevent locks
    try:
        if os.path.exists(temp_db_path):
            os.remove(temp_db_path)
        shutil.copy2(mdb_path, temp_db_path)
    except Exception as e:
        print(f"[SYNC ERROR] Failed to copy {mdb_path} to temp: {e}")
        return None

    pwd = 'SCORPION7'
    rows = []
    columns = []
    connected = False

    # 2. Try ADODB (OLEDB) connection first (doesn't trigger registry permissions error 63)
    try:
        import win32com.client
        conn = win32com.client.Dispatch('ADODB.Connection')
        conn_str = f"Provider=Microsoft.ACE.OLEDB.12.0;Data Source={temp_db_path};Jet OLEDB:Database Password={pwd};"
        conn.Open(conn_str)
        
        # Get schema columns
        rs_cols = conn.OpenSchema(4) # adSchemaColumns = 4
        while not rs_cols.EOF:
            if rs_cols.Fields('TABLE_NAME').Value == 'USUARIOS':
                columns.append(rs_cols.Fields('COLUMN_NAME').Value)
            rs_cols.MoveNext()
        rs_cols.Close()

        # Query all records
        rs = win32com.client.Dispatch('ADODB.Recordset')
        rs.Open("SELECT * FROM USUARIOS", conn)
        while not rs.EOF:
            row_dict = {}
            for col in columns:
                val = rs.Fields(col).Value
                row_dict[col] = val
            rows.append(row_dict)
            rs.MoveNext()
        rs.Close()
        conn.Close()
        connected = True
        print(f"[CONNECT ADODB] Successfully read {len(rows)} records using Microsoft.ACE.OLEDB.12.0")
    except Exception as e:
        print(f"[CONNECT ADODB FAIL] Failed: {e}. Trying pyodbc fallback...")

    # 3. Fallback to pyodbc if ADODB failed
    if not connected:
        try:
            import pyodbc
            conn_str = (
                f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};'
                f'DBQ={temp_db_path};PWD={pwd};ReadOnly=1;'
            )
            conn = pyodbc.connect(conn_str)
            cursor = conn.cursor()
            
            # Fetch column names
            columns = [col[0] for col in cursor.columns(table='USUARIOS')]
            
            cursor.execute("SELECT * FROM USUARIOS")
            raw_rows = cursor.fetchall()
            for r in raw_rows:
                row_dict = {}
                for col, val in zip(columns, r):
                    row_dict[col] = val
                rows.append(row_dict)
            cursor.close()
            conn.close()
            connected = True
            print(f"[CONNECT PYODBC] Successfully read {len(rows)} records using Microsoft Access Driver")
        except Exception as e:
            print(f"[CONNECT PYODBC FAIL] Failed: {e}")

    # Cleanup temp file
    try:
        os.remove(temp_db_path)
    except Exception:
        pass

    if not connected:
        return None

    # 4. Format rows to match Next.js dashboard client structure (lowercase keys, stripped values)
    clientes_map = {}
    for r in rows:
        doc = {}
        for col, val in r.items():
            k = col.lower()
            if val is None:
                doc[k] = ""
            else:
                doc[k] = str(val).strip()
        
        cuenta = doc.get("cuenta", "").upper().strip()
        if cuenta:
            clientes_map[cuenta] = doc

    return clientes_map

def main():
    print("=" * 60)
    print("  GAMA COMMAND CENTER - Sincronizador de Clientes v1.0")
    print(f"  Hora de inicio: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Active GENERAL.mdb candidate paths to watch
    candidates = [
        r"C:\Users\tetor\Downloads\GENERAL.mdb",
        r"C:\SCORPION\BASE DE DATOS\GENERAL.mdb"
    ]
    
    # Store states to detect modifications
    watched_files = {}
    for path in candidates:
        watched_files[path] = {"mtime": 0, "size": 0}

    last_successful_json_hash = None

    while True:
        try:
            newest_modified_path = None
            newest_mtime = 0
            
            # Check if any candidates have changed
            for path in candidates:
                if os.path.exists(path):
                    try:
                        mtime = os.path.getmtime(path)
                        size = os.path.getsize(path)
                        state = watched_files[path]
                        if mtime != state["mtime"] or size != state["size"]:
                            state["mtime"] = mtime
                            state["size"] = size
                            if mtime > newest_mtime:
                                newest_mtime = mtime
                                newest_modified_path = path
                    except Exception as e:
                        print(f"[WATCHER WARN] Error checking state for {path}: {e}")

            if newest_modified_path:
                print(f"[SYNC] Starting client synchronization from newest modified file: {newest_modified_path}...")
                clientes_map = read_usuarios_table(newest_modified_path)
                if clientes_map:
                    clientes_json = json.dumps(clientes_map, ensure_ascii=False)
                    current_hash = hash(clientes_json)
                    
                    if current_hash != last_successful_json_hash:
                        print(f"[SYNC] Synced map has {len(clientes_map)} active accounts. Uploading to Supabase...")
                        if upload_to_supabase(clientes_json):
                            last_successful_json_hash = current_hash
                            update_local_json(clientes_json)
                            print("[SYNC SUCCESS] Clients synchronized successfully!")
                        else:
                            print("[SYNC ERROR] Failed to upload to Supabase.")
                    else:
                        print("[SYNC] No database contents changed since last successful upload. Skipping upload.")
                else:
                    print("[SYNC ERROR] Could not read database content.")
                    
        except Exception as e:
            print(f"[LOOP ERROR] Auto-recovery: {e}")
            
        time.sleep(15)

if __name__ == "__main__":
    main()
