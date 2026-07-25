"""
===============================================================================
 GAMA SEGURIDAD - DAHUA NVR / DVR / XVR MULTI-CHANNEL ENGINE (CONCURRENT ENGINE)
 ===============================================================================
 Arquitectura: Concurrente y BAJO DEMANDA (On-Demand).
 PropÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³sito: Evita bloqueos y saturaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de conexiones P2P en cÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡maras y NVRs.
 REGLAS DE LIFECYCLE DE TRANSMISIÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“N:
 - SOLO inicia la captura de un canal cuando hay una peticiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n activa local o en la nube.
 - Detiene la captura automÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ticamente despuÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s de 30 segundos de inactividad (sin peticiones).
 - Actualiza en-sitio (update) una ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡NICA fila por cÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡mara en Supabase (cuenta = DAHUA_FRAME_{SN}_CH_{canal}).
 - Los frames incluyen timestamp ISO para que el dashboard pueda verificar frescura.
 ===============================================================================
"""

import os
import sys
import time
import base64
import json
import socket
import logging
import threading
import requests
from requests.auth import HTTPDigestAuth
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
from datetime import datetime, timezone

SUPABASE_URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"

LOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_dahua_bridge.log")
logging.basicConfig(
    filename=LOG_PATH,
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('dahua_bridge')
console = logging.StreamHandler()
console.setLevel(logging.INFO)
console.setFormatter(logging.Formatter('%(asctime)s [%(levelname)s] %(message)s', datefmt='%H:%M:%S'))
logger.addHandler(console)


class CameraWorker(threading.Thread):
    """Worker que captura frames de una cÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡mara/NVR Dahua especÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­fico."""

    def __init__(self, engine, sn, user, pas, canal):
        super().__init__(daemon=True)
        self.engine = engine
        self.sn = sn
        self.user = user
        self.pas = pas
        self.canal = canal
        self.running = True
        self.local_ip = None
        self.last_upload_time = 0
        self.backoff = 0.3

    def run(self):
        key = f"{self.sn}_{self.canal}"
        logger.info(f"[WORKER] Iniciado para {self.sn} CH-{self.canal}")
        auth = HTTPDigestAuth(self.user, self.pas)

        # Intentar resolver IP local desde parametros o usar defaults
        local_ip = getattr(self.engine, "local_ip", None)
        
        endpoints = [
            # P2P cloud endpoints
            f"http://{self.sn}.easy4ipcloud.com/onvifsnapshot/media_service/snapshot?channel={self.canal}",
            f"https://{self.sn}.easy4ipcloud.com/onvifsnapshot/media_service/snapshot?channel={self.canal}",
            f"http://{self.sn}.dahuap2p.com/cgi-bin/snapshot.cgi?channel={self.canal}",
            f"https://{self.sn}.dahuap2p.com/cgi-bin/snapshot.cgi?channel={self.canal}",
            # Alternative P2P clouds
            f"http://{self.sn}.myp2pcloud.com/cgi-bin/snapshot.cgi?channel={self.canal}",
            f"https://{self.sn}.myp2pcloud.com/cgi-bin/snapshot.cgi?channel={self.canal}",
            f"http://{self.sn}.mypeoplecloud.com/cgi-bin/snapshot.cgi?channel={self.canal}",
            f"http://{self.sn}.ipcver.com/cgi-bin/snapshot.cgi?channel={self.canal}",
            # Local IPs (try custom first, then defaults)
        ]
        if local_ip:
            endpoints.append(f"http://{local_ip}/cgi-bin/snapshot.cgi?channel={self.canal}")
            endpoints.append(f"https://{local_ip}/cgi-bin/snapshot.cgi?channel={self.canal}")
        endpoints.append(f"http://192.168.1.19/cgi-bin/snapshot.cgi?channel={self.canal}")
        endpoints.append(f"http://192.168.1.2/cgi-bin/snapshot.cgi?channel={self.canal}")
        endpoints.append(f"http://192.168.1.18/cgi-bin/snapshot.cgi?channel={self.canal}")
        endpoints.append(f"http://192.168.0.19/cgi-bin/snapshot.cgi?channel={self.canal}")

        # DNS pre-check: Verificar si la camara esta registrada en P2P
        try:
            p2p_test = f"{self.sn}.dahuap2p.com"
            socket.gethostbyname(p2p_test)
            logger.info(f"[WORKER] P2P DNS OK: {p2p_test} resuelve correctamente")
        except socket.gaierror:
            logger.warning(f"[WORKER] P2P DNS FALLA: {p2p_test} NO resuelve - camara podria no estar en P2P")

        consecutive_failures = 0

        while self.running and self.engine.running:
            last_req = self.engine.last_request_times.get(key, 0)
            if time.time() - last_req > 30.0:
                logger.info(f"[WORKER] Deteniendo {key} por inactividad (30s)")
                break

            frame_fetched = False
            for url in endpoints:
                if not self.running or not self.engine.running:
                    break
                try:
                    resp = requests.get(url, auth=auth, timeout=1.5)
                    if resp.status_code == 200 and len(resp.content) > 1000:
                        image_bytes = resp.content
                        self.engine.latest_frames[key] = image_bytes

                        consecutive_failures = 0
                        self.backoff = 0.3

                        now_t = time.time()
                        if now_t - self.last_upload_time > 1.2:
                            self.last_upload_time = now_t
                            ts = datetime.now(timezone.utc).isoformat()
                            t = threading.Thread(
                                target=self.engine.upload_to_supabase_with_ts,
                                args=(self.sn, self.canal, image_bytes, ts),
                                daemon=True,
                            )
                            t.start()

                        frame_fetched = True
                        break
                except Exception as e:
                    consecutive_failures += 1
                    logger.warning(f"[WORKER] Error en {url}: {e} (fallo #{consecutive_failures})")

            if not frame_fetched:
                consecutive_failures += 1
                self.backoff = min(1.0 + (consecutive_failures * 0.5), 30.0)
                if consecutive_failures >= 3:
                    logger.warning(f"[WORKER] {consecutive_failures} fallos consecutivos {key}, backoff={self.backoff:.1f}s")

            time.sleep(0.3 if frame_fetched else self.backoff)

        self.engine.workers.pop(key, None)
        logger.info(f"[WORKER] Finalizado {self.sn} CH-{self.canal}")


class DahuaMultiDeviceEngine:
    """Motor multicanal que administra workers bajo demanda."""

    def __init__(self):
        self.latest_frames = {}
        self.row_ids = {}
        self.workers = {}
        self.last_request_times = {}
        self.registered_devices = []
        self.running = True
        self.local_ip = None
        self.start_time = time.time()

    def fetch_all_registered_devices(self):
        devices = []
        try:
            get_url = f"{SUPABASE_URL}/rest/v1/eventos_monitoreo?cuenta=like.CAMARAS_DAHUA_%25&select=nombre_abonado,cuenta"
            headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
            r = requests.get(get_url, headers=headers, timeout=3)
            if r.status_code == 200:
                rows = r.json()
                for row in rows:
                    raw_json = row.get("nombre_abonado", "")
                    if raw_json:
                        try:
                            cams = json.loads(raw_json)
                            if isinstance(cams, list):
                                for c in cams:
                                    if isinstance(c, dict) and c.get("serialNumber") and c.get("activa", True):
                                        devices.append({
                                            "sn": c["serialNumber"].strip().upper(),
                                            "user": c.get("usuario", "admin").strip(),
                                            "pass": c.get("password", "").strip(),
                                            "canal": int(c.get("canal", 1)),
                                        })
                        except Exception as e:
                            logger.warning(f"[DEVICES] Error parseando JSON: {e}")
        except Exception as e:
            logger.error(f"[DEVICES] Error consultando Supabase: {e}")
        return devices

    def fetch_active_cloud_requests(self):
        active_keys = []
        try:
            get_url = f"{SUPABASE_URL}/rest/v1/eventos_monitoreo?cuenta=like.DAHUA_STREAM_REQ_%25&select=cuenta,fecha_hora"
            headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
            r = requests.get(get_url, headers=headers, timeout=3)
            if r.status_code == 200:
                rows = r.json()
                now_utc = datetime.now(timezone.utc)
                for row in rows:
                    cuenta = row.get("cuenta", "")
                    fh_str = row.get("fecha_hora", "")
                    if cuenta and fh_str:
                        try:
                            fh_clean = fh_str.replace("Z", "+00:00")
                            fh = datetime.fromisoformat(fh_clean)
                            diff_sec = (now_utc - fh).total_seconds()
                            if diff_sec <= 15:
                                parts = cuenta.split("_")
                                if len(parts) >= 5:
                                    sn = parts[3]
                                    canal = int(parts[5])
                                    active_keys.append((sn, canal))
                        except Exception:
                            pass
        except Exception as e:
            logger.error(f"[CLOUD-REQ] Error: {e}")
        return active_keys

    def upload_to_supabase_with_ts(self, sn, canal, image_bytes, timestamp):
        try:
            base64_str = base64.b64encode(image_bytes).decode("utf-8")
            payload = json.dumps({"ts": timestamp, "img": base64_str})
            cuenta_key = f"DAHUA_FRAME_{sn}_CH_{canal}"

            row_id = self.row_ids.get(cuenta_key)
            if not row_id:
                try:
                    r_sel = supabase.table("eventos_monitoreo").select("id").eq("cuenta", cuenta_key).order("id", desc=True).limit(1).execute()
                    if r_sel.data:
                        row_id = r_sel.data[0]["id"]
                        self.row_ids[cuenta_key] = row_id
                except Exception:
                    pass

            if row_id:
                supabase.table("eventos_monitoreo").update({"nombre_abonado": payload, "fecha_hora": timestamp}).eq("id", row_id).execute()
            else:
                r_ins = supabase.table("eventos_monitoreo").insert({
                    "cuenta": cuenta_key,
                    "nombre_abonado": payload,
                    "evento": "FRAME_SYNC",
                    "fecha_hora": timestamp,
                }).execute()
                if r_ins.data:
                    self.row_ids[cuenta_key] = r_ins.data[0]["id"]

            logger.info(f"[UPLOAD] Frame OK {sn} CH-{canal} ({len(image_bytes)} bytes)")
        except Exception as e:
            logger.error(f"[UPLOAD] Error {sn} CH-{canal}: {e}")

    def upload_to_supabase(self, sn, canal, image_bytes):
        ts = datetime.now(timezone.utc).isoformat()
        self.upload_to_supabase_with_ts(sn, canal, image_bytes, ts)

    def manager_loop(self):
        logger.info("[MANAGER] Loop de control iniciado")
        last_dev_check = 0
        while self.running:
            try:
                if time.time() - last_dev_check > 30.0:
                    self.registered_devices = self.fetch_all_registered_devices()
                    logger.info(f"[MANAGER] {len(self.registered_devices)} dispositivo(s) cargado(s)")
                    last_dev_check = time.time()

                active_cloud = self.fetch_active_cloud_requests()
                for sn, canal in active_cloud:
                    key = f"{sn}_{canal}"
                    self.last_request_times[key] = time.time()

                for dev in self.registered_devices:
                    sn = dev["sn"]
                    canal = dev["canal"]
                    key = f"{sn}_{canal}"
                    if time.time() - self.last_request_times.get(key, 0) <= 30.0:
                        if key not in self.workers or not self.workers[key].is_alive():
                            worker = CameraWorker(self, sn, dev["user"], dev["pass"], canal)
                            self.workers[key] = worker
                            worker.start()
                            logger.info(f"[MANAGER] Worker iniciado para {key}")

            except Exception as e:
                logger.error(f"[MANAGER] Error: {e}", exc_info=True)
            time.sleep(3.0)


from supabase import create_client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
engine = DahuaMultiDeviceEngine()


class DahuaBridgeRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        if parsed.path == "/status":
            status_info = {
                "workers": len(engine.workers),
                "workers_active": [k for k, v in engine.workers.items() if v.is_alive()],
                "registered_devices": len(engine.registered_devices),
                "devices": [{"sn": d["sn"], "canal": d["canal"]} for d in engine.registered_devices],
                "last_requests": {k: datetime.fromtimestamp(v).isoformat() if v else None for k, v in engine.last_request_times.items()},
                "running": engine.running,
                "frames_in_memory": len(engine.latest_frames),
                "frame_keys": list(engine.latest_frames.keys()),
                "uptime": time.time() - engine.start_time if hasattr(engine, "start_time") else 0,
            }
            import json
import json as json_mod
            payload = json_mod.dumps(status_info, indent=2)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(payload.encode("utf-8"))
            return

        if parsed.path in ["/snapshot", "/api/snapshot"]:
            sn = params.get("sn", [""])[0].strip().upper()
            canal = params.get("canal", ["1"])[0]
            try:
                canal_int = int(canal)
            except ValueError:
                canal_int = 1
            key = f"{sn}_{canal_int}"

            engine.last_request_times[key] = time.time()

            if key not in engine.workers or not engine.workers[key].is_alive():
                dev_data = None
                for d in engine.registered_devices:
                    if d["sn"] == sn and d["canal"] == canal_int:
                        dev_data = d
                        break
                if not dev_data:
                    dev_data = {
                        "sn": sn,
                        "user": params.get("user", ["admin"])[0].strip(),
                        "pass": params.get("pass", [""])[0].strip(),
                        "canal": canal_int,
                    }
                logger.info(f"[HANDLER] Iniciando worker inmediato para {key}")
                worker = CameraWorker(engine, dev_data["sn"], dev_data["user"], dev_data["pass"], dev_data["canal"])
                engine.workers[key] = worker
                worker.start()

            # Guardar IP local si viene en el request
            local_ip = params.get("ip", [""])[0].strip()
            if local_ip:
                engine.local_ip = local_ip

            frame = None
            for _ in range(15):  # Esperar max 1.5s por el primer frame (15 x 0.1s)
                frame = engine.latest_frames.get(key)
                if frame:
                    break
                time.sleep(0.1)

            if frame:
                self.send_response(200)
                self.send_header("Content-Type", "image/jpeg")
                self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("X-Dahua-Status", "FRAME_OK")
                self.end_headers()
                self.wfile.write(frame)
            else:
                # Devolver SVG de "conectando" en vez de bytes vacios
                svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <rect width="640" height="360" fill="#090d16"/>
  <rect x="8" y="8" width="624" height="344" fill="none" stroke="#eab308" stroke-width="1.5" rx="6" stroke-dasharray="4"/>
  <circle cx="320" cy="120" r="20" fill="none" stroke="#eab308" stroke-width="2">
    <animateTransform attributeName="transform" type="rotate" from="0 320 120" to="360 320 120" dur="1s" repeatCount="indefinite"/>
  </circle>
  <text x="320" y="175" fill="#fef08a" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle">CONECTANDO CON CAMARA {sn} CH-{canal_int}...</text>
  <text x="320" y="200" fill="#94a3b8" font-family="monospace" font-size="11" text-anchor="middle">PID: {key}</text>
</svg>'''
                self.send_response(200)
                self.send_header("Content-Type", "image/svg+xml")
                self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("X-Dahua-Status", "CONNECTING")
                self.end_headers()
                self.wfile.write(svg.encode("utf-8"))
        else:
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(b"<h1>GAMA SEGURIDAD - DAHUA ON-DEMAND ENGINE ACTIVO</h1>")

    def log_message(self, format, *args):
        return


def start_server(port=8000):
    t = threading.Thread(target=engine.manager_loop, daemon=True)
    t.start()
    server_address = ("", port)
    httpd = HTTPServer(server_address, DahuaBridgeRequestHandler)
    logger.info("=" * 70)
    logger.info(f" DAHUA CONCURRENT ON-DEMAND ENGINE ACTIVO EN PUERTO {port}")
    logger.info(" Transmision bajo demanda: se inicia al ver y se cierra a los 30s.")
    logger.info(f" Log: {LOG_PATH}")
    logger.info("=" * 70)
    print(f"\n[OK] Dahua Bridge activo en puerto {port} - Log: {LOG_PATH}\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        engine.running = False
        logger.info("Deteniendo servidor Dahua P2P...")
        httpd.server_close()
        print("\n[INFO] Servidor Dahua P2P detenido.")


if __name__ == "__main__":
    start_server(8000)





