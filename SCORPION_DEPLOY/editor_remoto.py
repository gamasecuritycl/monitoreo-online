"""
GAMA SECURITY - WORKER EDITOR REMOTO (GENERAL.MDB) v2.7 - COMPATIBILIDAD NULL/VACIO
====================================================================================
Worker independiente que corre en segundo plano en PC Scorpion.
Maneja campos con restricción AllowZeroLength=False pasando NULL (None)
en lugar de cadenas vacías (""), permitiendo edición completa de expedientes.
"""

import time
import os
import sys
import json
import logging
import gc
from datetime import datetime

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

SUPABASE_URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"

try:
    from supabase import create_client
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    logging.critical(f"No se pudo inicializar cliente Supabase: {e}")
    sys.exit(1)

MDB_PWD = "SCORPION7"

CANDIDATAS_RUTAS_MDB = [
    r"C:\SCORPION\BASES DE DATOS\GENERAL.MDB",
    r"C:\SCORPION\BASE DE DATOS\GENERAL.MDB",
    r"C:\SCORPION\GENERAL.MDB",
]


def obtener_rutas_activas():
    rutas_norm = set()
    rutas_reales = []
    for r in CANDIDATAS_RUTAS_MDB:
        if os.path.exists(r):
            norm = os.path.normcase(os.path.abspath(r))
            if norm not in rutas_norm:
                rutas_norm.add(norm)
                rutas_reales.append(r)
                
    if not rutas_reales and os.path.exists(r"C:\SCORPION"):
        for root, _, files in os.walk(r"C:\SCORPION"):
            for f in files:
                if f.upper() == "GENERAL.MDB":
                    p = os.path.join(root, f)
                    norm = os.path.normcase(os.path.abspath(p))
                    if norm not in rutas_norm:
                        rutas_norm.add(norm)
                        rutas_reales.append(p)
    return rutas_reales


def get_field_safe(rs, col_name):
    """Lectura segura de un campo ADODB con triple fallback"""
    try:
        v = rs.Fields(col_name).Value
        return "" if v is None else str(v)
    except Exception:
        pass
    try:
        v = rs.Fields.Item(col_name).Value
        return "" if v is None else str(v)
    except Exception:
        pass
    try:
        v = rs.Fields[col_name].Value
        return "" if v is None else str(v)
    except Exception:
        pass
    return ""


def set_field_safe(rs, col_name, val):
    """
    Escritura segura en ADODB.
    En Access, si un campo tiene AllowZeroLength=False, asignar "" causa error.
    Asignar None (DBNull) soluciona 100% de los casos de campos vacíos.
    """
    val_to_set = val
    if val is not None and str(val).strip() == "":
        val_to_set = None

    try:
        rs.Fields(col_name).Value = val_to_set
        return True
    except Exception:
        pass
    try:
        rs.Fields.Item(col_name).Value = val_to_set
        return True
    except Exception:
        pass
    try:
        rs.Fields[col_name].Value = val_to_set
        return True
    except Exception:
        pass

    # Si falló con None (por ejemplo si el campo es NOT NULL), intentar con ""
    if val_to_set is None:
        try:
            rs.Fields(col_name).Value = ""
            return True
        except Exception:
            pass
        try:
            rs.Fields.Item(col_name).Value = ""
            return True
        except Exception:
            pass

    return False


def actualizar_mdb_recordset(mdb_path, tipo_op, cuenta_clean, datos_nuevos):
    import win32com.client
    conn = None
    rs = None
    
    num_solo = cuenta_clean.replace("C", "").strip()
    candidatos_cta = {cuenta_clean, num_solo, num_solo.zfill(4)}
    if not cuenta_clean.startswith("C"):
        candidatos_cta.add(f"C{cuenta_clean}")

    try:
        conn = win32com.client.Dispatch('ADODB.Connection')
        conn_str = f"Provider=Microsoft.ACE.OLEDB.12.0;Data Source={mdb_path};Jet OLEDB:Database Password={MDB_PWD};Mode=Share Deny None;"
        try:
            conn.Open(conn_str)
        except Exception:
            conn_str = f"Provider=Microsoft.Jet.OLEDB.4.0;Data Source={mdb_path};Jet OLEDB:Database Password={MDB_PWD};Mode=Share Deny None;"
            conn.Open(conn_str)

        tabla_usada = "USUARIOS"

        rs = win32com.client.Dispatch('ADODB.Recordset')
        # adOpenDynamic=2, adLockOptimistic=3
        rs.Open(f"SELECT * FROM [{tabla_usada}]", conn, 2, 3)

        # Mapa de columnas disponibles
        cols_map = {}
        try:
            count = int(rs.Fields.Count)
            for i in range(count):
                fn = ""
                try: fn = str(rs.Fields(i).Name)
                except Exception:
                    try: fn = str(rs.Fields.Item(i).Name)
                    except Exception: pass
                if fn:
                    cols_map[fn] = fn
                    cols_map[fn.upper()] = fn
                    cols_map[fn.upper().strip()] = fn
                    cols_map[fn.upper().replace(" ", "")] = fn
        except Exception as e_c:
            logging.warning(f"Error mapeando columnas: {e_c}")

        encontrado = False
        valores_previos = {}
        valores_guardados = {}
        cuenta_exacta_en_disco = ""

        if tipo_op == "ELIMINAR_ABONADO":
            while not rs.EOF:
                cta_disco = get_field_safe(rs, "CUENTA").strip().upper()
                if cta_disco in candidatos_cta:
                    rs.Delete()
                    encontrado = True
                    break
                rs.MoveNext()
            rs.Close()
            rs = None
            conn.Close()
            conn = None
            return True, {"operacion": "DELETE", "encontrado": encontrado, "mdb": mdb_path}

        while not rs.EOF:
            cta_disco = get_field_safe(rs, "CUENTA").strip().upper()
            if cta_disco in candidatos_cta:
                encontrado = True
                cuenta_exacta_en_disco = cta_disco
                
                for k, v in datos_nuevos.items():
                    k_str = str(k)
                    # Omitir metadatos internos que no son columnas
                    if k_str.startswith("_"):
                        continue

                    k_clean = k_str.upper().replace(" ", "").strip()
                    col_real = cols_map.get(k_clean) or cols_map.get(k_str.upper()) or cols_map.get(k_str)
                    
                    if col_real and col_real.upper() != "CUENTA":
                        val_ant = get_field_safe(rs, col_real)
                        valores_previos[k_str] = val_ant
                        
                        v_val = str(v).strip() if v is not None else ""
                        if set_field_safe(rs, col_real, v_val):
                            valores_guardados[k_str] = v_val

                # Volcar fisicamente a disco
                rs.Update()
                break
            rs.MoveNext()

        if not encontrado and tipo_op == "NUEVO_ABONADO":
            rs.AddNew()
            set_field_safe(rs, "CUENTA", cuenta_clean)
            for k, v in datos_nuevos.items():
                k_str = str(k)
                if k_str.startswith("_"):
                    continue
                k_clean = k_str.upper().replace(" ", "").strip()
                col_real = cols_map.get(k_clean) or cols_map.get(k_str.upper()) or cols_map.get(k_str)
                if col_real and col_real.upper() != "CUENTA":
                    v_val = str(v).strip() if v is not None else ""
                    if set_field_safe(rs, col_real, v_val):
                        valores_guardados[k_str] = v_val
            rs.Update()
            encontrado = True
            cuenta_exacta_en_disco = cuenta_clean

        rs.Close()
        rs = None
        conn.Close()
        conn = None

        return True, {
            "mdb": mdb_path,
            "encontrado_en_disco": encontrado,
            "cuenta_en_disco": cuenta_exacta_en_disco,
            "valores_anteriores": valores_previos,
            "valores_nuevos_grabados": valores_guardados
        }

    except Exception as ex:
        logging.error(f"Error actualizando {mdb_path}: {ex}")
        return False, {"mdb": mdb_path, "error": str(ex)}
    finally:
        if rs:
            try: rs.Close()
            except Exception: pass
        if conn:
            try: conn.Close()
            except Exception: pass
        gc.collect()


def ejecutar_edicion_local(tipo_op, cuenta, datos_nuevos):
    cuenta_clean = str(cuenta).strip().upper()
    rutas = obtener_rutas_activas()
    if not rutas:
        raise FileNotFoundError("No se encontró ningún archivo GENERAL.MDB en C:\\SCORPION")

    t_inicio = time.time()
    resultados = []
    for r in rutas:
        try:
            ok, det = actualizar_mdb_recordset(r, tipo_op, cuenta_clean, datos_nuevos)
            resultados.append({"ruta": r, "ok": ok, "detalle": det})
        except Exception as e:
            resultados.append({"ruta": r, "ok": False, "detalle": str(e)})

    ms = int((time.time() - t_inicio) * 1000)
    return ms, resultados


def procesar_ordenes_pendientes():
    try:
        # Consulta descendente para tomar las órdenes más recientes
        res = supabase.table("eventos_monitoreo") \
            .select("*") \
            .eq("cuenta", "ORDEN_EDITOR_REMOTO") \
            .order("id", desc=True) \
            .limit(20) \
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
            datos_nuevos = payload.get("datos_nuevos") or payload.get("datosNuevos") or {}
            orden_id = payload.get("ordenId") or payload.get("orden_id") or f"ORD-{evt_id}"

            logging.info(f">> Procesando orden {orden_id} ({tipo_op}) para cuenta {cuenta} con {len(datos_nuevos)} campos...")

            try:
                ms, detalles = ejecutar_edicion_local(tipo_op, cuenta, datos_nuevos)
                payload["estado"] = "APLICADO_LOCAL"
                payload["aplicado_el"] = datetime.now().isoformat()
                payload["resultado"] = f"OK - Grabado en disco ({ms} ms)"
                payload["detalles"] = detalles

                supabase.table("eventos_monitoreo").update({
                    "nombre_abonado": json.dumps(payload),
                    "evento": f"{tipo_op}_APLICADO"
                }).eq("id", evt_id).execute()

                logging.info(f"✓ Orden {orden_id} grabada en disco exitosamente en PC Scorpion.")

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
    logging.info("  INICIANDO GAMA SECURITY - WORKER EDITOR REMOTO v2.7 (PRODUCCION TOTAL)")
    rutas = obtener_rutas_activas()
    logging.info(f"  Rutas detectadas ({len(rutas)}): {', '.join(rutas)}")
    logging.info("=" * 60)

    while True:
        try:
            procesar_ordenes_pendientes()
        except Exception as e:
            logging.error(f"Error en loop de polling: {e}")
        time.sleep(3)


if __name__ == "__main__":
    main()
