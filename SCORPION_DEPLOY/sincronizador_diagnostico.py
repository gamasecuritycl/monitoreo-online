import os, pyodbc

base_dir = r'C:\SCORPION\BASES DE DATOS'
DB_PASSWORD = 'Administ'

print("=" * 60)
print("  GAMA COMMAND CENTER - DIAGNÓSTICO DE BASES DE DATOS")
print("=" * 60)

def analizar_archivo(ruta):
    try:
        conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={ruta};PWD={DB_PASSWORD};ReadOnly=1;'
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        # Verificar si existe la tabla EVENTOS
        tablas = [t.table_name for t in cursor.tables(tableType='TABLE')]
        if 'EVENTOS' not in tablas:
            print(f"[INFO] {os.path.basename(ruta)}: No contiene la tabla 'EVENTOS' (Tablas: {tablas})")
            conn.close()
            return
            
        cursor.execute("SELECT COUNT(*) FROM EVENTOS")
        count = cursor.fetchone()[0]
        
        cursor.execute("SELECT TOP 1 * FROM EVENTOS ORDER BY HORA DESC")
        latest = cursor.fetchone()
        
        if latest:
            print(f"[OK] {os.path.basename(ruta)} | Filas: {count} | Último evento: Dia={str(latest[0]).strip()} | Hora={str(latest[1]).strip()} | Cuenta={str(latest[2]).strip()} | Evento={str(latest[4]).strip()}")
        else:
            print(f"[OK] {os.path.basename(ruta)} | Filas: {count} | Sin eventos")
            
        conn.close()
    except Exception as e:
        print(f"[ERROR] No se pudo leer {os.path.basename(ruta)}: {e}")

# Buscar todos los archivos .mdb de forma recursiva
for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.upper().endswith('.MDB'):
            analizar_archivo(os.path.join(root, f))

print("=" * 60)
input("\nPresiona ENTER para cerrar...")
