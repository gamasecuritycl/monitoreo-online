import os, pyodbc, datetime

# Calcular la base de datos de hoy
hoy_str = datetime.date.today().strftime("%Y-%m-%d")
archivo_hoy = f"{hoy_str}.MDB"

rutas_posibles = [
    os.path.join(r'C:\SCORPION\BASES DE DATOS\EVENTOS', archivo_hoy),
    os.path.join(r'E:\MONITOREO ONLINE\BASES DE DATOS\EVENTOS', archivo_hoy)
]

DB_PASSWORD = 'Administ'

print("=" * 65)
print("  GAMA COMMAND CENTER - DIAGNÓSTICO DE HOY")
print("=" * 65)

encontrado = False
for ruta in rutas_posibles:
    if os.path.exists(ruta):
        encontrado = True
        print(f"\n[OK] Encontrada base de datos en: {ruta}")
        mtime = datetime.datetime.fromtimestamp(os.path.getmtime(ruta))
        print(f"     Fecha de modificación: {mtime.strftime('%d-%m-%Y %H:%M:%S')}")
        print(f"     Tamaño del archivo: {os.path.getsize(ruta) // 1024} KB")
        try:
            conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={ruta};PWD={DB_PASSWORD};ReadOnly=1;'
            conn = pyodbc.connect(conn_str)
            cursor = conn.cursor()
            
            cursor.execute("SELECT COUNT(*) FROM EVENTOS")
            count = cursor.fetchone()[0]
            print(f"     Total de filas (EVENTOS): {count}")
            
            cursor.execute("SELECT * FROM EVENTOS")
            rows = cursor.fetchall()
            
            def parse_row_datetime(r):
                dia_str = str(r[0]).strip()
                hora_str = str(r[1]).strip()
                dt = None
                for fmt in ("%d-%m-%Y", "%Y-%m-%d"):
                    try:
                        dt = datetime.datetime.strptime(dia_str, fmt)
                        break
                    except ValueError:
                        continue
                if not dt:
                    dt = datetime.datetime.min
                try:
                    partes = hora_str.split(':')
                    if len(partes) == 3:
                        dt = dt.replace(hour=int(partes[0]), minute=int(partes[1]), second=int(partes[2]))
                except Exception:
                    pass
                return dt

            rows_sorted = sorted(rows, key=parse_row_datetime, reverse=True)
            print("\n     ÚLTIMOS 10 REGISTROS ENCONTRADOS EN EL ARCHIVO:")
            print("     " + "-" * 55)
            for row in rows_sorted[:10]:
                print(f"     Dia={str(row[0]).strip()} | Hora={str(row[1]).strip()} | Cuenta={str(row[2]).strip()} | Evento={str(row[4]).strip()}")
            print("     " + "-" * 55)
            
            conn.close()
        except Exception as e:
            print(f"[ERROR] Error al leer la base de datos: {e}")

if not encontrado:
    print(f"\n[ERROR] No se encontró el archivo de hoy '{archivo_hoy}' en ninguna de las rutas esperadas:")
    for r in rutas_posibles:
        print(f"  - {os.path.dirname(r)}")

print("=" * 65)
input("\nPresiona ENTER para cerrar...")
