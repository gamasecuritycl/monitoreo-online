"""
GAMA SEGURIDAD - Cloud Dahua Bridge v2.0
Deploy en Railway.app / Fly.io
Captura frames via P2P HTTP (lechange.com, easy4ipcloud.com) y sube a Vercel API.
Sin SDK, sin DLL. Solo necesita SN, user, password.
"""

import os, sys, time, json, base64, threading, requests, socket, logging
from requests.auth import HTTPDigestAuth
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------
SUPABASE_URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"
VERCEL_URL = "https://controltestmonitoreo.vercel.app"
BRIDGE_SECRET = "gama_dahua_2024_secret"

# ---------------------------------------------------------------------------
# P2P DOMAINS (HTTP/HTTPS via port 443/80 - sin SDK)
# ---------------------------------------------------------------------------
P2P_DOMAINS = [
    ("https", "{sn}.lechange.com",    "/cgi-bin/snapshot.cgi"),
    ("https", "{sn}.lechange.cn",     "/cgi-bin/snapshot.cgi"),
    ("https", "{sn}.imoulife.com",    "/cgi-bin/snapshot.cgi"),
    ("https", "{sn}.imou.com",        "/cgi-bin/snapshot.cgi"),
    ("https", "{sn}.easy4ipcloud.com","/onvifsnapshot/media_service/snapshot"),
    ("https", "{sn}.easy4ipcloud.com","/cgi-bin/snapshot.cgi"),
    ("http",  "{sn}.easy4ipcloud.com","/onvifsnapshot/media_service/snapshot"),
    ("http",  "{sn}.easy4ipcloud.com","/cgi-bin/snapshot.cgi"),
    ("https", "{sn}.dahuap2p.com",    "/cgi-bin/snapshot.cgi"),
    ("http",  "{sn}.dahuap2p.com",    "/cgi-bin/snapshot.cgi"),
    ("https", "{sn}.myp2pcloud.com",  "/cgi-bin/snapshot.cgi"),
    ("http",  "{sn}.myp2pcloud.com",  "/cgi-bin/snapshot.cgi"),
    ("https", "{sn}.mypeoplecloud.com","/cgi-bin/snapshot.cgi"),
    ("http",  "{sn}.mypeoplecloud.com","/cgi-bin/snapshot.cgi"),
    ("https", "{sn}.ipcver.com",      "/cgi-bin/snapshot.cgi"),
    ("http",  "{sn}.ipcver.com",      "/cgi-bin/snapshot.cgi"),
]

_DNS_CACHE = {}
logger = logging.getLogger('cloud_bridge')
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s', datefmt='%H:%M:%S')

def check_p2p_dns(sn):
    if sn in _DNS_CACHE:
        return _DNS_CACHE[sn]
    results = {}
    hosts = set()
    for _, tpl, _ in P2P_DOMAINS:
        hosts.add(tpl.format(sn=sn))
    for h in hosts:
        try:
            socket.gethostbyname(h)
            results[h] = "OK"
            logger.info(f"[DNS] {h} => OK")
        except:
            results[h] = "FAIL"
    _DNS_CACHE[sn] = results
    return results

def build_urls(sn, canal, stream_type="sub"):
    urls = []
    st = 1 if stream_type == "sub" else 0
    for scheme, tpl, path in P2P_DOMAINS:
        host = tpl.format(sn=sn)
        if "onvifsnapshot" in path:
            url = f"{scheme}://{host}{path}?channel={canal}"
        else:
            url = f"{scheme}://{host}{path}?channel={canal}&subtype={st}"
        urls.append(url)
    return urls

class CloudBridge:
    def __init__(self):
        self.running = True
        self.frames = {}

    def fetch_devices(self):
        devices = {}
        try:
            url = f"{SUPABASE_URL}/rest/v1/eventos_monitoreo?cuenta=like.CAMARAS_DAHUA_%25&select=nombre_abonado"
            r = requests.get(url, headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}, timeout=10)
            if r.status_code == 200:
                for row in r.json():
                    raw = row.get("nombre_abonado", "")
                    if raw:
                        try:
                            cams = json.loads(raw)
                            if isinstance(cams, list):
                                for c in cams:
                                    if c.get("serialNumber") and c.get("activa", True):
                                        sn = c["serialNumber"].strip().upper()
                                        ch = int(c.get("canal", 1))
                                        key = f"{sn}_{ch}"
                                        if sn not in devices:
                                            devices[sn] = {"user": c.get("usuario", "admin").strip(), "pass": c.get("password", "").strip(), "channels": {}}
                                        devices[sn]["channels"][ch] = {"stream": "sub" if c.get("substream", True) else "main", "nombre": c.get("nombre", f"CH-{ch}")}
                        except:
                            pass
        except Exception as e:
            logger.error(f"[FETCH] Error: {e}")
        return devices

    def capture(self, sn, user, pwd, canal, stream="sub"):
        check_p2p_dns(sn)
        auth = HTTPDigestAuth(user, pwd) if user and pwd else None
        urls = build_urls(sn, canal, stream)
        for url in urls:
            try:
                r = requests.get(url, auth=auth, timeout=5)
                if r.status_code == 200 and len(r.content) > 1000:
                    return r.content
            except:
                continue
        return None

    def upload_to_vercel(self, sn, canal, img_bytes):
        try:
            b64 = base64.b64encode(img_bytes).decode()
            payload = {"sn": sn, "canal": canal, "img": b64, "ts": datetime.now(timezone.utc).isoformat()}
            r = requests.post(f"{VERCEL_URL}/api/dahua-receive-frame", json=payload, headers={"x-bridge-secret": BRIDGE_SECRET}, timeout=10)
            return r.status_code == 200
        except:
            return False

    def run(self):
        logger.info("="*60)
        logger.info("  CLOUD DAHUA BRIDGE v2.0 - P2P HTTP -> Vercel API")
        logger.info(f"  Vercel: {VERCEL_URL}")
        logger.info("="*60)

        last_refresh = 0
        devices = {}

        while self.running:
            try:
                if time.time() - last_refresh > 60:
                    devices = self.fetch_devices()
                    logger.info(f"[REFRESH] {sum(len(d['channels']) for d in devices.values())} canales en {len(devices)} dispositivos")
                    last_refresh = time.time()

                for sn, dev in devices.items():
                    for ch in list(dev["channels"].keys()):
                        key = f"{sn}_{ch}"
                        stream = dev["channels"][ch]["stream"]
                        img = self.capture(sn, dev["user"], dev["pass"], ch, stream)
                        if img:
                            self.frames[key] = img
                            self.upload_to_vercel(sn, ch, img)
                            logger.info(f"[FRAME] {key} ({len(img)} bytes)")
                        else:
                            logger.warning(f"[FAIL] {key}")

            except Exception as e:
                logger.error(f"[LOOP] {e}")

            time.sleep(2)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    bridge = CloudBridge()
    t = threading.Thread(target=bridge.run, daemon=True)
    t.start()

    from http.server import HTTPServer, BaseHTTPRequestHandler
    from urllib.parse import parse_qs, urlparse

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            params = parse_qs(urlparse(self.path).query)
            if self.path == "/status":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "OK", "frames": list(bridge.frames.keys())}).encode())
            elif "/snapshot" in self.path:
                sn = (params.get("sn") or [""])[0].upper()
                canal = int((params.get("canal") or ["1"])[0])
                key = f"{sn}_{canal}"
                img = bridge.frames.get(key)
                if img:
                    self.send_response(200)
                    self.send_header("Content-Type", "image/jpeg")
                    self.send_header("Cache-Control", "no-cache")
                    self.end_headers()
                    self.wfile.write(img)
                else:
                    self.send_response(202)
                    self.send_header("Content-Type", "image/svg+xml")
                    self.end_headers()
                    self.wfile.write(b'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect fill="#0a0f1a" width="640" height="360"/><text x="320" y="180" text-anchor="middle" fill="#f59e0b" font-family="monospace" font-size="14">Capturando...</text></svg>')
            else:
                self.send_response(404)
                self.end_headers()
        def log_message(self, fmt, *args): pass

    server = HTTPServer(("0.0.0.0", port), Handler)
    logger.info(f"[HTTP] Puerto {port} listo")
    server.serve_forever()
