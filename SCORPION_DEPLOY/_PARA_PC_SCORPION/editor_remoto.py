"""
GAMA SECURITY - WORKER EDITOR REMOTO (GENERAL.MDB) v1.0
=========================================================
Worker independiente que corre en segundo plano en PC Scorpion.
Escucha órdenes de edición encoladas desde el Command Center web y ejecuta
actualizaciones directas en C:\SCORPION\BASES DE DATOS\GENERAL.MDB vía ODBC Flash (<15 ms).

REGLA OPERATIVA:
- Modo compartido Mode=Share Deny None (cero bloqueos para Scorpion Desktop).
- Conexión Flash: Abre -> Ejecuta UPDATE/INSERT/DELETE parametrizado -> Commit -> Cierra conexión de inmediato.
- Aislamiento: No interfiere con sincronizador.py v5.1.
"""

import time
import os
import sys
import logging
from datetime import datetime

# Configuración de Logs (Rotación automática a 2 MB)
LOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_editor_remoto_log.txt")
if os.path.exists(LOG_PATH) and os.path.getsize(LOG_PATH) > 2_000_000:
    try:
        with open(LOG_PATH, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()[-1000:]
        with open(LOG_PATH, "w", encoding="utf-8") as f:
            f.writelines(lines)
    except Exception:
        pass

logging.basicConfig(
    filename=LOG_PATH,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# Conexión Supabase
SUPABASE_URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzMjI4MzgsImV4cCI6MjA1NTg5ODgzOH0.29Jk8UeNqgC7fO-O3yD7nSOfKkI-gC2cK-_7h0U3s70"

try:
    from supabase import create_client
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    logging.critical(f"No se pudo inicializar cliente Supabase: {e}")
    sys.exit(1)

try:
    import pyodbc
except ImportError:
    logging.critical("Modulo 'pyodbc' no instalado. Ejecute 'pip install pyodbc'")
    sys.exit(1)

MDB_PATH = r"C:\SCORPION\BASES DE DATOS\GENERAL.MDB"
MDB_PWD = "SCORPION7"


def get_odbc_connection():
    """Genera conexión Flash ODBC en modo compartido para no interferir con Scorpion Desktop"""
    conn_str = (
        r"DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};"
        rf"DBQ={MDB_PATH};"
        rf"PWD={MDB_PWD};"
        r"ExtendedAnsiSQL=1;"
        r"Mode=Share Deny None;"
    )
    return pyodbc.connect(conn_str, autocommit=False)


def ejecutar_edicion_local(tipo_op, cuenta, datos_nuevos):
    """
    Ejecuta el UPDATE/INSERT/DELETE parametrizado en GENERAL.MDB con reintentos suaves.
    Tiempo de conexión estimado: < 15 ms.
    """
    if not os.path.exists(MDB_PATH):
        raise FileNotFoundError(f"No se encontró base de datos en {MDB_PATH}")

    cuenta_clean = str(cuenta).strip().upper()
    max_retries = 3
    retry_delay = 0.2

    for intento in range(1, max_retries + 1):
        conn = None
        cursor = None
        t_inicio = time.time()
        try:
            conn = get_odbc_connection()
            cursor = conn.cursor()

            # Operación 1: ELIMINAR ABONADO
            if tipo_op == "ELIMINAR_ABONADO":
                sql_delete = "DELETE FROM CLIENTES WHERE CUENTA = ?"
                cursor.execute(sql_delete, [cuenta_clean])
                rows_affected = cursor.rowcount
                if rows_affected == 0 and cuenta_clean.startswith("C"):
                    cursor.execute(sql_delete, [cuenta_clean[1:]])
                    rows_affected = cursor.rowcount
                conn.commit()
                t_duracion = int((time.time() - t_inicio) * 1000)
                logging.info(f"[{cuenta_clean}] DELETE exitoso en {t_duracion} ms ({rows_affected} filas eliminadas).")
                return t_duracion

            # Filtrar y mapear campos para UPDATE o INSERT
            cols = []
            values = []
            set_clauses = []

            for k, v in (datos_nuevos or {}).items():
                if k.startswith("_") or k.upper() == "CUENTA":
                    continue
                col_name = f"[{k}]" if " " in k else k
                cols.append(col_name)
                values.append(str(v) if v is not None else "")
                set_clauses.append(f"{col_name} = ?")

            # Operación 2: NUEVO ABONADO
            if tipo_op == "NUEVO_ABONADO":
                # Verificar si ya existe
                cursor.execute("SELECT CUENTA FROM CLIENTES WHERE CUENTA = ?", [cuenta_clean])
                if cursor.fetchone():
                    # Si ya existe, hacer UPDATE
                    if set_clauses:
                        sql_update = f"UPDATE CLIENTES SET {', '.join(set_clauses)} WHERE CUENTA = ?"
                        cursor.execute(sql_update, values + [cuenta_clean])
                else:
                    # INSERT de cuenta nueva
                    all_cols = ["CUENTA"] + cols
                    placeholders = ["?"] * len(all_cols)
                    all_vals = [cuenta_clean] + values
                    sql_insert = f"INSERT INTO CLIENTES ({', '.join(all_cols)}) VALUES ({', '.join(placeholders)})"
                    cursor.execute(sql_insert, all_vals)

                conn.commit()
                t_duracion = int((time.time() - t_inicio) * 1000)
                logging.info(f"[{cuenta_clean}] NUEVO_ABONADO procesado en {t_duracion} ms.")
                return t_duracion

            # Operación 3: UPDATE / EDITAR_GENERAL / EDITAR_CONTACTOS
            if not set_clauses:
                logging.warning(f"[{cuenta_clean}] No hay campos válidos para actualizar.")
                return 0

            sql_update = f"UPDATE CLIENTES SET {', '.join(set_clauses)} WHERE CUENTA = ?"
            values_with_pk = values + [cuenta_clean]

            cursor.execute(sql_update, values_with_pk)
            rows_affected = cursor.rowcount

            # Si no encontró coincidencia exacta, probar sin la 'C' inicial (ej: 'C745' vs '745')
            if rows_affected == 0 and cuenta_clean.startswith("C"):
                cuenta_alt = cuenta_clean[1:]
                values_alt = values + [cuenta_alt]
                cursor.execute(sql_update, values_alt)
                rows_affected = cursor.rowcount

            # Si aún no existe, insertar automáticamente como nuevo registro
            if rows_affected == 0:
                all_cols = ["CUENTA"] + cols
                placeholders = ["?"] * len(all_cols)
                all_vals = [cuenta_clean] + values
                sql_insert = f"INSERT INTO CLIENTES ({', '.join(all_cols)}) VALUES ({', '.join(placeholders)})"
                cursor.execute(sql_insert, all_vals)
                logging.info(f"[{cuenta_clean}] Cuenta no existía en GENERAL.MDB. Creada e insertada automáticamente.")

            conn.commit()
            t_duracion = int((time.time() - t_inicio) * 1000)

            logging.info(f"[{cuenta_clean}] UPDATE exitoso en {t_duracion} ms ({rows_affected} filas modificadas). Intento {intento}")
            return t_duracion

        except pyodbc.Error as odbc_err:
            logging.warning(f"[{cuenta_clean}] Intento {intento}/{max_retries} bloqueo ODBC: {odbc_err}")
            if conn:
                try: conn.rollback()
                except: pass
            if intento < max_retries:
                time.sleep(retry_delay * intento)
            else:
                raise odbc_err
        finally:
            if cursor:
                try: cursor.close()
                except: pass
            if conn:
                try: conn.close()
                except: pass


def procesar_ordenes_pendientes():
    """Consulta órdenes pendientes en Supabase y las ejecuta"""
    try:
        # 1. Buscar en tabla dedicada 'ordenes_editor_remoto'
        res = supabase.table("ordenes_editor_remoto") \
            .select("*") \
            .eq("estado", "PENDIENTE") \
            .order("creado_el", desc=False) \
            .limit(10) \
            .execute()

        ordenes = res.data or []
        for orden in ordenes:
            orden_id = orden.get("id")
            cuenta = orden.get("cuenta")
            tipo_op = orden.get("tipo_operacion")
            datos_nuevos = orden.get("datos_nuevos") or {}

            logging.info(f">> Procesando orden {orden_id} ({tipo_op}) para cuenta {cuenta}...")

            try:
                ms = ejecutar_edicion_local(tipo_op, cuenta, datos_nuevos)
                # Confirmar éxito (ACK)
                supabase.table("ordenes_editor_remoto").update({
                    "estado": "APLICADO_LOCAL",
                    "aplicado_el": datetime.now().isoformat(),
                    "resultado": f"OK - Modificado en GENERAL.MDB ({ms} ms)"
                }).eq("id", orden_id).execute()

                logging.info(f"✓ Orden {orden_id} aplicada exitosamente en PC Scorpion.")

            except Exception as ex:
                logging.error(f"✗ Falló orden {orden_id}: {ex}")
                supabase.table("ordenes_editor_remoto").update({
                    "estado": "ERROR_LOCAL",
                    "aplicado_el": datetime.now().isoformat(),
                    "resultado": f"ERROR: {str(ex)}"
                }).eq("id", orden_id).execute()

    except Exception as e:
        # Si la tabla 'ordenes_editor_remoto' no existe o falla la conexión, revisar eventos_monitoreo como fallback
        try:
            res_fb = supabase.table("eventos_monitoreo") \
                .select("*") \
                .eq("cuenta", "ORDEN_EDITOR_REMOTO") \
                .order("id", desc=False) \
                .limit(5) \
                .execute()

            for evt in (res_fb.data or []):
                import json
                try:
                    payload = json.loads(evt.get("nombre_abonado") or "{}")
                    if payload.get("estado") == "PENDIENTE":
                        cuenta = payload.get("cuenta")
                        datos_nuevos = payload.get("datos_nuevos") or {}
                        tipo_op = evt.get("evento") or "EDITAR_GENERAL"

                        ms = ejecutar_edicion_local(tipo_op, cuenta, datos_nuevos)
                        payload["estado"] = "APLICADO_LOCAL"
                        payload["aplicado_el"] = datetime.now().isoformat()
                        payload["resultado"] = f"OK ({ms} ms)"

                        supabase.table("eventos_monitoreo").update({
                            "nombre_abonado": json.dumps(payload),
                            "evento": f"{tipo_op}_APLICADO"
                        }).eq("id", evt.get("id")).execute()
                        logging.info(f"✓ Orden Fallback {evt.get('id')} aplicada.")
                except Exception as ef:
                    logging.error(f"Error procesando orden fallback: {ef}")
        except Exception:
            pass


def main():
    logging.info("=" * 60)
    logging.info("  INICIANDO GAMA SECURITY - WORKER EDITOR REMOTO v1.0")
    logging.info(f"  Base de Datos: {MDB_PATH}")
    logging.info("=" * 60)

    while True:
        try:
            procesar_ordenes_pendientes()
        except Exception as e:
            logging.error(f"Error en loop de polling: {e}")

        # Polling ultra ligero cada 3 segundos
        time.sleep(3)


if __name__ == "__main__":
    main()
