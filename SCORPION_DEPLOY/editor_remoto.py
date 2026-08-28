"""
GAMA SECURITY - WORKER EDITOR REMOTO (GENERAL.MDB) v1.2 - BLINDADO
===================================================================
Worker independiente que corre en segundo plano en PC Scorpion.
Escucha órdenes de edición encoladas desde el Command Center web y ejecuta
actualizaciones directas en la tabla USUARIOS de C:\\SCORPION\\BASES DE DATOS\\GENERAL.MDB.

REGLAS DE SEGURIDAD OPERATIVA (PROTECCIÓN TOTAL SCORPION):
- Modo compartido estricto (Mode=Share Deny None; ExtendedAnsiSQL=1)
- try...finally absoluto para liberación instantánea de handles COM y ODBC
- Cero bloqueos ni retención de archivos (.ldb) para Scorpion Desktop
- Polling no intrusivo (solo toca GENERAL.MDB si hay orden PENDIENTE real)
"""

import time
import os
import sys
import json
import logging
import gc
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

# Conexión Supabase (Clave activa anon)
SUPABASE_URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"

try:
    from supabase import create_client
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    logging.critical(f"No se pudo inicializar cliente Supabase: {e}")
    sys.exit(1)

MDB_PATH = r"C:\SCORPION\BASES DE DATOS\GENERAL.MDB"
MDB_PWD = "SCORPION7"


def ejecutar_edicion_local(tipo_op, cuenta, datos_nuevos):
    """
    Ejecuta UPDATE/INSERT/DELETE en la tabla USUARIOS de GENERAL.MDB
    garantizando liberación total e inmediata de conexiones en bloque finally.
    """
    if not os.path.exists(MDB_PATH):
        raise FileNotFoundError(f"No se encontró base de datos en {MDB_PATH}")

    cuenta_clean = str(cuenta).strip().upper()
    cuentas_candidatas = [cuenta_clean]
    if cuenta_clean.startswith("C"):
        cuentas_candidatas.append(cuenta_clean[1:])
        cuentas_candidatas.append(cuenta_clean[1:].zfill(4))
    else:
        cuentas_candidatas.append(f"C{cuenta_clean}")

    t_inicio = time.time()
    tablas_candidatas = ["USUARIOS", "CLIENTES"]
    error_adodb = None

    # 1. INTENTO 1: ADODB (OLEDB) con cierre estricto en FINALLY
    conn_ado = None
    rs_cols = None
    rs_check = None
    try:
        import win32com.client
        conn_ado = win32com.client.Dispatch('ADODB.Connection')
        conn_str = f"Provider=Microsoft.ACE.OLEDB.12.0;Data Source={MDB_PATH};Jet OLEDB:Database Password={MDB_PWD};Mode=Share Deny None;"
        try:
            conn_ado.Open(conn_str)
        except Exception:
            # Fallback OLEDB 4.0
            conn_str = f"Provider=Microsoft.Jet.OLEDB.4.0;Data Source={MDB_PATH};Jet OLEDB:Database Password={MDB_PWD};Mode=Share Deny None;"
            conn_ado.Open(conn_str)

        # Detectar columnas existentes en tabla
        rs_cols = conn_ado.OpenSchema(4)
        cols_existentes = set()
        tabla_usada = "USUARIOS"
        while not rs_cols.EOF:
            t_name = str(rs_cols.Fields('TABLE_NAME').Value).upper()
            if t_name in tablas_candidatas:
                tabla_usada = t_name
                cols_existentes.add(str(rs_cols.Fields('COLUMN_NAME').Value).upper())
            rs_cols.MoveNext()
        rs_cols.Close()
        rs_cols = None

        # Operación ELIMINAR
        if tipo_op == "ELIMINAR_ABONADO":
            for cta in cuentas_candidatas:
                sql = f"DELETE FROM [{tabla_usada}] WHERE UCASE(TRIM([CUENTA])) = '{cta}'"
                conn_ado.Execute(sql)
            ms = int((time.time() - t_inicio) * 1000)
            logging.info(f"[{cuenta_clean}] ADODB: DELETE ejecutado en {ms} ms.")
            return ms

        # Preparar UPDATE
        set_parts = []
        for k, v in (datos_nuevos or {}).items():
            if k.startswith("_") or k.upper() == "CUENTA":
                continue
            k_upper = k.upper()
            if k_upper in cols_existentes or not cols_existentes:
                v_clean = str(v).replace("'", "''").strip() if v is not None else ""
                col_sql = f"[{k}]" if " " in k else k
                set_parts.append(f"{col_sql} = '{v_clean}'")

        if set_parts:
            # Probar UPDATE para cada variante de cuenta
            for cta in cuentas_candidatas:
                sql_update = f"UPDATE [{tabla_usada}] SET {', '.join(set_parts)} WHERE UCASE(TRIM([CUENTA])) = '{cta}'"
                conn_ado.Execute(sql_update)

            # Si es NUEVO_ABONADO, verificar si existe o insertar
            if tipo_op == "NUEVO_ABONADO":
                rs_check = win32com.client.Dispatch('ADODB.Recordset')
                rs_check.Open(f"SELECT [CUENTA] FROM [{tabla_usada}] WHERE UCASE(TRIM([CUENTA])) = '{cuenta_clean}'", conn_ado)
                if rs_check.EOF:
                    cols_list = ["[CUENTA]"]
                    vals_list = [f"'{cuenta_clean}'"]
                    for k, v in (datos_nuevos or {}).items():
                        if k.startswith("_") or k.upper() == "CUENTA": continue
                        v_clean = str(v).replace("'", "''").strip() if v is not None else ""
                        cols_list.append(f"[{k}]" if " " in k else k)
                        vals_list.append(f"'{v_clean}'")
                    sql_insert = f"INSERT INTO [{tabla_usada}] ({', '.join(cols_list)}) VALUES ({', '.join(vals_list)})"
                    conn_ado.Execute(sql_insert)
                rs_check.Close()
                rs_check = None

        ms = int((time.time() - t_inicio) * 1000)
        logging.info(f"[{cuenta_clean}] ADODB OLEDB: UPDATE exitoso en tabla {tabla_usada} ({ms} ms).")
        return ms

    except Exception as err:
        error_adodb = err
        logging.warning(f"[{cuenta_clean}] ADODB falló ({err}), probando pyodbc...")
    finally:
        # CIERRE Y LIBERACIÓN TOTAL COM
        if rs_cols:
            try: rs_cols.Close()
            except Exception: pass
            rs_cols = None
        if rs_check:
            try: rs_check.Close()
            except Exception: pass
            rs_check = None
        if conn_ado:
            try: conn_ado.Close()
            except Exception: pass
            conn_ado = None
        gc.collect()

    # 2. INTENTO 2: Fallback con pyodbc (con cierre estricto en FINALLY)
    conn_odbc = None
    cursor_odbc = None
    try:
        import pyodbc
        conn_str = (
            r"DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};"
            rf"DBQ={MDB_PATH};"
            rf"PWD={MDB_PWD};"
            r"ExtendedAnsiSQL=1;"
            r"Mode=Share Deny None;"
        )
        conn_odbc = pyodbc.connect(conn_str, autocommit=True)
        cursor_odbc = conn_odbc.cursor()

        # Determinar tabla
        tablas_mdb = [row.table_name.upper() for row in cursor_odbc.tables(tableType='TABLE')]
        tabla_usada = "USUARIOS" if "USUARIOS" in tablas_mdb else ("CLIENTES" if "CLIENTES" in tablas_mdb else "USUARIOS")

        # Operación ELIMINAR
        if tipo_op == "ELIMINAR_ABONADO":
            for cta in cuentas_candidatas:
                cursor_odbc.execute(f"DELETE FROM [{tabla_usada}] WHERE UCASE(TRIM([CUENTA])) = ?", [cta])
            ms = int((time.time() - t_inicio) * 1000)
            logging.info(f"[{cuenta_clean}] PYODBC: DELETE ejecutado en {ms} ms.")
            return ms

        # Preparar UPDATE
        cols = []
        vals = []
        set_clauses = []
        for k, v in (datos_nuevos or {}).items():
            if k.startswith("_") or k.upper() == "CUENTA":
                continue
            col_name = f"[{k}]" if " " in k else k
            cols.append(col_name)
            vals.append(str(v).strip() if v is not None else "")
            set_clauses.append(f"{col_name} = ?")

        if set_clauses:
            for cta in cuentas_candidatas:
                sql_update = f"UPDATE [{tabla_usada}] SET {', '.join(set_clauses)} WHERE UCASE(TRIM([CUENTA])) = ?"
                cursor_odbc.execute(sql_update, vals + [cta])

            if tipo_op == "NUEVO_ABONADO":
                cursor_odbc.execute(f"SELECT [CUENTA] FROM [{tabla_usada}] WHERE UCASE(TRIM([CUENTA])) = ?", [cuenta_clean])
                if not cursor_odbc.fetchone():
                    all_cols = ["[CUENTA]"] + cols
                    placeholders = ["?"] * len(all_cols)
                    all_vals = [cuenta_clean] + vals
                    sql_insert = f"INSERT INTO [{tabla_usada}] ({', '.join(all_cols)}) VALUES ({', '.join(placeholders)})"
                    cursor_odbc.execute(sql_insert, all_vals)

        ms = int((time.time() - t_inicio) * 1000)
        logging.info(f"[{cuenta_clean}] PYODBC: UPDATE exitoso en tabla {tabla_usada} ({ms} ms).")
        return ms

    except Exception as err_pyodbc:
        logging.error(f"[{cuenta_clean}] PYODBC también falló: {err_pyodbc}")
        raise err_pyodbc from error_adodb
    finally:
        # CIERRE Y LIBERACIÓN TOTAL ODBC
        if cursor_odbc:
            try: cursor_odbc.close()
            except Exception: pass
            cursor_odbc = None
        if conn_odbc:
            try: conn_odbc.close()
            except Exception: pass
            conn_odbc = None
        gc.collect()


def procesar_ordenes_pendientes():
    """Consulta órdenes pendientes en eventos_monitoreo y las ejecuta"""
    try:
        res = supabase.table("eventos_monitoreo") \
            .select("*") \
            .eq("cuenta", "ORDEN_EDITOR_REMOTO") \
            .order("id", desc=False) \
            .limit(10) \
            .execute()

        eventos = res.data or []
        for evt in eventos:
            evt_id = evt.get("id")
            nombre_raw = evt.get("nombre_abonado") or "{}"
            tipo_op = evt.get("evento") or "EDITAR_GENERAL"

            if tipo_op.endswith("_APLICADO") or tipo_op.endswith("_ERROR"):
                continue

            try:
                payload = json.loads(nombre_raw)
            except Exception:
                continue

            if payload.get("estado") != "PENDIENTE":
                continue

            cuenta = payload.get("cuenta")
            datos_nuevos = payload.get("datos_nuevos") or {}
            orden_id = payload.get("ordenId") or f"ORD-{evt_id}"

            logging.info(f">> Procesando orden {orden_id} ({tipo_op}) para cuenta {cuenta}...")

            try:
                ms = ejecutar_edicion_local(tipo_op, cuenta, datos_nuevos)
                payload["estado"] = "APLICADO_LOCAL"
                payload["aplicado_el"] = datetime.now().isoformat()
                payload["resultado"] = f"OK - Modificado en GENERAL.MDB [USUARIOS] ({ms} ms)"

                supabase.table("eventos_monitoreo").update({
                    "nombre_abonado": json.dumps(payload),
                    "evento": f"{tipo_op}_APLICADO"
                }).eq("id", evt_id).execute()

                logging.info(f"✓ Orden {orden_id} aplicada exitosamente en PC Scorpion.")

            except Exception as ex:
                logging.error(f"✗ Falló orden {orden_id}: {ex}")
                payload["estado"] = "ERROR_LOCAL"
                payload["aplicado_el"] = datetime.now().isoformat()
                payload["resultado"] = f"ERROR: {str(ex)}"

                supabase.table("eventos_monitoreo").update({
                    "nombre_abonado": json.dumps(payload),
                    "evento": f"{tipo_op}_ERROR"
                }).eq("id", evt_id).execute()

    except Exception as e:
        logging.error(f"Error consultando eventos_monitoreo: {e}")


def main():
    logging.info("=" * 60)
    logging.info("  INICIANDO GAMA SECURITY - WORKER EDITOR REMOTO v1.2 (BLINDADO)")
    logging.info(f"  Base de Datos: {MDB_PATH} (Tabla USUARIOS)")
    logging.info("=" * 60)

    while True:
        try:
            procesar_ordenes_pendientes()
        except Exception as e:
            logging.error(f"Error en loop de polling: {e}")

        # Polling no invasivo cada 5 segundos
        time.sleep(5)


if __name__ == "__main__":
    main()
