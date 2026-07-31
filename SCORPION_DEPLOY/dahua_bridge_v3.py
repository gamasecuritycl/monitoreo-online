"""
GAMA SEGURIDAD - DAHUA LAN BRIDGE v3.0
Capture from NVR via LAN (192.168.1.2), upload frames to Vercel API.
No P2P, no SDK. Works behind any firewall that allows HTTP outbound.
"""

import os, sys, time, base64, json, threading, socket, requests
from requests.auth import HTTPDigestAuth
from datetime import datetime, timezone

NVR_IP = "192.168.1.2"
NVR_USER = "admin"
NVR_PASS = "Patuto1965."
CHANNELS = list(range(1, 11))  # 1-10

VERCEL_URL = "https://controltestmonitoreo.vercel.app"
BRIDGE_SECRET = "gama_dahua_2024_secret"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_PATH = os.path.join(SCRIPT_DIR, "_dahua_bridge_v3.log")

import logging
logging.basicConfig(filename=LOG_PATH, level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
logger = logging.getLogger('dahua_bridge_v3')
console = logging.StreamHandler()
console.setLevel(logging.INFO)
console.setFormatter(logging.Formatter('%(asctime)s [%(levelname)s] %(message)s', datefmt='%H:%M:%S'))
logger.addHandler(console)

logger.info("="*70)
logger.info("  GAMA DAHUA BRIDGE v3.0 - LAN CAPTURE -> VERCEL API")
logger.info(f"  NVR: {NVR_IP} | Canales: {CHANNELS[0]}-{CHANNELS[-1]}")
logger.info(f"  Upload: {VERCEL_URL}/api/dahua-receive-frame")
logger.info("="*70)

def capture_frame(channel: int) -> bytes | None:
    urls = [
        f"http://{NVR_IP}/cgi-bin/snapshot.cgi?channel={channel}&subtype=1",
        f"http://{NVR_IP}/cgi-bin/snapshot.cgi?channel={channel}",
        f"http://{NVR_IP}/onvifsnapshot/media_service/snapshot?channel={channel}&subtype=1",
    ]
    auth = HTTPDigestAuth(NVR_USER, NVR_PASS)
    for url in urls:
        try:
            r = requests.get(url, auth=auth, timeout=3.0)
            if r.status_code == 200 and len(r.content) > 2000:
                logger.info(f"[CAPTURE] OK CH-{channel} ({len(r.content)} bytes)")
                return r.content
        except Exception as e:
            logger.warning(f"[CAPTURE] CH-{channel} {url.split('/')[-1]}: {e}")
    return None

def upload_frame(sn: str, channel: int, img_bytes: bytes):
    try:
        ts = datetime.now(timezone.utc).isoformat()
        b64 = base64.b64encode(img_bytes).decode('utf-8')
        payload = {"sn": sn, "canal": channel, "img": b64, "ts": ts}
        r = requests.post(
            f"{VERCEL_URL}/api/dahua-receive-frame",
            json=payload,
            headers={"x-bridge-secret": BRIDGE_SECRET},
            timeout=10
        )
        if r.status_code == 200:
            logger.info(f"[UPLOAD] OK {sn} CH-{channel} ({len(img_bytes)} bytes)")
        else:
            logger.error(f"[UPLOAD] FAIL {sn} CH-{channel}: {r.status_code} {r.text[:100]}")
    except Exception as e:
        logger.error(f"[UPLOAD] ERROR {sn} CH-{channel}: {e}")

class ChannelWorker(threading.Thread):
    def __init__(self, sn: str, channel: int):
        super().__init__(daemon=True)
        self.sn = sn
        self.channel = channel
        self.running = True
        self.fails = 0

    def run(self):
        while self.running:
            try:
                img = capture_frame(self.channel)
                if img:
                    self.fails = 0
                    upload_frame(self.sn, self.channel, img)
                    time.sleep(0.8)
                else:
                    self.fails += 1
                    backoff = min(1.0 + self.fails * 0.5, 30.0)
                    if self.fails % 5 == 0:
                        logger.warning(f"[WORKER] {self.sn} CH-{self.channel}: {self.fails} fallos, backoff={backoff:.1f}s")
                    time.sleep(backoff)
            except Exception as e:
                logger.error(f"[WORKER] {self.sn} CH-{self.channel}: {e}")
                time.sleep(5)

def main():
    sn = "2B02339PAYPW68F"
    workers = []
    for ch in CHANNELS:
        w = ChannelWorker(sn, ch)
        w.start()
        workers.append(w)
        logger.info(f"[MAIN] Worker CH-{ch} iniciado")
    logger.info(f"[MAIN] {len(workers)} workers activos. Bridge operativo.")
    try:
        while True:
            time.sleep(60)
            alive = sum(1 for w in workers if w.is_alive())
            logger.info(f"[HEARTBEAT] {alive}/{len(workers)} workers vivos")
    except KeyboardInterrupt:
        logger.info("[MAIN] Deteniendo...")
        for w in workers:
            w.running = False

if __name__ == "__main__":
    main()
