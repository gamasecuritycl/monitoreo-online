"""
GAMA SEGURIDAD - WhatsApp Service v1.0 (Neonize Edition)
Motor: Neonize (Whatsmeow/Go backend) - más robusto que Baileys
Puerto: 3016 (FastAPI)
"""

import os
import json
import time
import asyncio
import logging
import sqlite3
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from collections import OrderedDict
from pathlib import Path

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

# Neonize imports
from neonize.client import NewClient
from neonize.events import (
    MessageEv, ReceiptEv, ConnectedEv, DisconnectedEv, QREv
)
from neonize.proto.Neonize_pb2 import Message as NeonizeMessage
from neonize.proto.waE2E.WAWebProtobufsE2E_pb2 import Message as WAWebMessage

# ──────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────
PORT = 3016
# Use temp path without spaces for Neonize session
SESSION_DIR = Path(os.environ.get("TEMP", "C:\\Temp")) / "neonize-session"
DB_PATH = Path(__file__).parent / "whatsapp_neonize.db"
SUPABASE_URL = "https://onxwyrwmpjxtwlmjrosr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs"
MAX_RETRIES = 3
RETRY_DELAY_BASE = 2  # seconds
DEDUP_WINDOW = 300  # 5 minutes dedup window

# ──────────────────────────────────────────────
# LOGGING
# ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(message)s",
    datefmt="%H:%M:%S"
)
log = logging.getLogger("whatsapp-neonize")

# ──────────────────────────────────────────────
# DATABASE (SQLite for local persistence)
# ──────────────────────────────────────────────
def init_db():
    """Initialize SQLite database for message tracking."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            remote_jid TEXT,
            from_me INTEGER,
            body TEXT,
            timestamp INTEGER,
            status TEXT DEFAULT 'pending',
            retry_count INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS dedup (
            message_id TEXT PRIMARY KEY,
            received_at INTEGER
        )
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status)
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_dedup_received ON dedup(received_at)
    """)
    conn.commit()
    conn.close()
    log.info(f"Database initialized: {DB_PATH}")

def cleanup_old_dedup():
    """Remove dedup entries older than DEDUP_WINDOW."""
    try:
        conn = sqlite3.connect(str(DB_PATH))
        cutoff = int(time.time()) - DEDUP_WINDOW
        conn.execute("DELETE FROM dedup WHERE received_at < ?", (cutoff,))
        conn.commit()
        conn.close()
    except Exception as e:
        log.warning(f"Dedup cleanup error: {e}")

def is_duplicate(message_id: str) -> bool:
    """Check if message was already processed (dedup)."""
    if not message_id:
        return False
    try:
        conn = sqlite3.connect(str(DB_PATH))
        row = conn.execute(
            "SELECT 1 FROM dedup WHERE message_id = ?", (message_id,)
        ).fetchone()
        if row:
            conn.close()
            return True
        conn.execute(
            "INSERT INTO dedup (message_id, received_at) VALUES (?, ?)",
            (message_id, int(time.time()))
        )
        conn.commit()
        conn.close()
        return False
    except Exception as e:
        log.warning(f"Dedup check error: {e}")
        return False

def save_message(msg_id: str, remote_jid: str, from_me: bool, body: str, 
                 timestamp: int, status: str = "pending"):
    """Save message to local SQLite."""
    try:
        conn = sqlite3.connect(str(DB_PATH))
        conn.execute("""
            INSERT OR REPLACE INTO messages 
            (id, remote_jid, from_me, body, timestamp, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (msg_id, remote_jid, 1 if from_me else 0, body, timestamp, status))
        conn.commit()
        conn.close()
    except Exception as e:
        log.warning(f"Save message error: {e}")

def get_pending_messages() -> List[Dict]:
    """Get messages that need retry."""
    try:
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        rows = conn.execute("""
            SELECT * FROM messages 
            WHERE status = 'pending' AND retry_count < ?
            ORDER BY timestamp ASC
        """, (MAX_RETRIES,)).fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        log.warning(f"Get pending error: {e}")
        return []

def update_message_status(msg_id: str, status: str):
    """Update message status."""
    try:
        conn = sqlite3.connect(str(DB_PATH))
        if status == "failed":
            conn.execute("""
                UPDATE messages SET status = ?, retry_count = retry_count + 1
                WHERE id = ?
            """, (status, msg_id))
        else:
            conn.execute(
                "UPDATE messages SET status = ? WHERE id = ?", 
                (status, msg_id)
            )
        conn.commit()
        conn.close()
    except Exception as e:
        log.warning(f"Update status error: {e}")

# ──────────────────────────────────────────────
# SUPABASE CLIENT
# ──────────────────────────────────────────────
async def supabase_insert(table: str, data: Dict):
    """Insert row to Supabase."""
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(
                f"{SUPABASE_URL}/rest/v1/{table}",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                json=data,
                timeout=10
            )
            if res.status_code >= 400:
                log.warning(f"Supabase insert error: {res.status_code}")
        except Exception as e:
            log.warning(f"Supabase insert error: {e}")

async def supabase_upsert(table: str, data: Dict, on_conflict: str):
    """Upsert row to Supabase."""
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(
                f"{SUPABASE_URL}/rest/v1/{table}",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal,resolution=merge-duplicates"
                },
                json=data,
                params={"on_conflict": on_conflict},
                timeout=10
            )
            if res.status_code >= 400:
                log.warning(f"Supabase upsert error: {res.status_code}")
        except Exception as e:
            log.warning(f"Supabase upsert error: {e}")

# ──────────────────────────────────────────────
# NEONIZE CLIENT
# ──────────────────────────────────────────────
class WhatsAppService:
    def __init__(self):
        self.client: Optional[NewClient] = None
        self.is_ready = False
        self.current_qr = None
        self.user_name = None
        self.start_time = time.time()
        self.message_queue: List[Dict] = []
        self.connected_event = asyncio.Event()
        
    def init_client(self):
        """Initialize Neonize client."""
        # Use simple name without spaces for Neonize session
        session_name = "gama_whatsapp"
        
        # Custom QR handler to avoid terminal output errors
        def custom_qr_handler(client, qr_data):
            """Handle QR code without terminal output."""
            try:
                # Store QR data for API endpoint
                if hasattr(self, '_qr_data'):
                    self._qr_data = qr_data
                log.info("QR code received (stored for API)")
            except Exception as e:
                log.debug(f"QR handler error: {e}")
        
        self.client = NewClient(
            session_name
        )
        
        # Override the default QR handler
        self.client.event._qr = custom_qr_handler
        
        # Register event handlers using decorators
        @self.client.event(ConnectedEv)
        def on_connected(client: NewClient, event: ConnectedEv):
            asyncio.create_task(self._on_connected(client, event))
            
        @self.client.event(DisconnectedEv)
        def on_disconnected(client: NewClient, event: DisconnectedEv):
            asyncio.create_task(self._on_disconnected(client, event))
            
        @self.client.event(QREv)
        def on_qr(client: NewClient, event: QREv):
            asyncio.create_task(self._on_qr(client, event))
            
        @self.client.event(MessageEv)
        def on_message(client: NewClient, event: NeonizeMessage):
            asyncio.create_task(self._on_message(client, event))
            
        @self.client.event(ReceiptEv)
        def on_receipt(client: NewClient, event):
            asyncio.create_task(self._on_receipt(client, event))
        
        log.info("Neonize client initialized")
        
    async def connect(self):
        """Connect to WhatsApp."""
        if not self.client:
            self.init_client()
        
        log.info("Connecting to WhatsApp...")
        try:
            await self.client.connect()
        except Exception as e:
            log.error(f"Connection error: {e}")
            raise
            
    async def disconnect(self):
        """Disconnect from WhatsApp."""
        if self.client:
            try:
                await self.client.stop()
            except:
                pass
            self.is_ready = False
            
    # ── Event Handlers (async wrappers) ──
    
    async def _on_connected(self, client: NewClient, event: ConnectedEv):
        """Handle successful connection."""
        self.is_ready = True
        self.current_qr = None
        self.user_name = getattr(client, 'user', {}).get('name', 'Unknown')
        self.connected_event.set()
        
        log.info(f"✅ Connected! User: {self.user_name}")
        
        # Sync status to Supabase
        await self._sync_status()
        
        # Process queued messages
        asyncio.create_task(self._process_queue())
        
    async def _on_disconnected(self, client: NewClient, event: DisconnectedEv):
        """Handle disconnection."""
        self.is_ready = False
        self.connected_event.clear()
        log.warning(f"Disconnected: {event}")
        
        # Sync status to Supabase
        await self._sync_status()
        
    async def _on_qr(self, client: NewClient, event):
        """Handle QR code."""
        # QR codes are in event.Codes (list of QR code segments)
        if event.Codes:
            self.current_qr = ''.join(event.Codes)
            log.info(f"QR received: {self.current_qr[:20]}...")
        else:
            log.info("QR event received but no codes")
        
        # Sync status to Supabase
        await self._sync_status()
        
    async def _on_message(self, client: NewClient, event: NeonizeMessage):
        """Handle incoming/outgoing messages."""
        msg = event
        if not msg or not msg.Info:
            return
            
        message_id = msg.Info.ID
        remote_jid = msg.Info.MessageSource.Chat
        from_me = msg.Info.MessageSource.IsFromMe
        is_grp = msg.Info.MessageSource.IsGroup
        push_name = msg.Info.Pushname
        
        # Dedup check
        if is_duplicate(message_id):
            log.debug(f"Duplicate message ignored: {message_id}")
            return
        
        # Extract body from message content
        body = ""
        if msg.Message:
            try:
                wa_msg = WAWebMessage()
                wa_msg.ParseFromString(msg.Message)
                body = (
                    wa_msg.conversation or 
                    (wa_msg.extendedTextMessage.text if wa_msg.HasField('extendedTextMessage') else '') or
                    (wa_msg.imageMessage.caption if wa_msg.HasField('imageMessage') else '') or
                    (wa_msg.videoMessage.caption if wa_msg.HasField('videoMessage') else '')
                )
            except Exception as e:
                log.debug(f"Failed to parse message: {e}")
        
        if not body:
            return
            
        log.info(f"💬 [{'GROUP' if is_grp else 'CHAT'}] {'Me' if from_me else push_name}: {body[:50]}")
        
        # Save to local DB
        timestamp = int(time.time())
        save_message(message_id, str(remote_jid), from_me, body, timestamp, "received")
        
        # Save to Supabase
        numero = str(remote_jid).replace('@s.whatsapp.net', '').replace('@g.us', '')
        await supabase_insert("conversaciones_whatsapp", {
            "numero": numero,
            "tipo_evento": "mensaje_enviado" if from_me else "mensaje_entrante",
            "estado": "enviado",
            "respuesta_recibida": None if from_me else body,
            "mensaje_enviado": body if from_me else None,
            "created_at": datetime.now().isoformat()
        })
        
    async def _on_receipt(self, client: NewClient, event):
        """Handle message receipts (delivery confirmations)."""
        # Update status for outgoing messages
        for msg_id in event.MessageIDs:
            update_message_status(msg_id, "delivered")
            log.debug(f"Receipt for {msg_id}: delivered")
            
    # ── Send Message with Retry ──
    
    async def send_message(self, phone: str, text: str, retry_count: int = 0) -> Dict:
        """Send message with retry logic."""
        if not self.is_ready or not self.client:
            # Queue for later
            self.message_queue.append({
                "phone": phone,
                "text": text,
                "ts": time.time()
            })
            return {"ok": True, "queued": True}
            
        try:
            # Normalize JID
            jid = self._normalize_jid(phone)
            
            # Generate message ID for tracking
            msg_id = f"gama_{int(time.time()*1000)}"
            
            # Send via Neonize
            await self.client.send_message(jid, text)
            
            # Save as sent
            save_message(msg_id, jid, True, text, int(time.time()), "sent")
            
            log.info(f"✅ Sent to {phone}: {text[:40]}...")
            return {"ok": True, "msg_id": msg_id}
            
        except Exception as e:
            log.error(f"Send error to {phone}: {e}")
            
            # Retry logic
            if retry_count < MAX_RETRIES:
                delay = RETRY_DELAY_BASE ** (retry_count + 1)
                log.info(f"Retrying in {delay}s (attempt {retry_count + 1}/{MAX_RETRIES})")
                await asyncio.sleep(delay)
                return await self.send_message(phone, text, retry_count + 1)
            
            return {"ok": False, "error": str(e)}
            
    def _normalize_jid(self, phone: str) -> str:
        """Normalize phone number to JID."""
        # Remove non-digits
        digits = ''.join(c for c in phone if c.isdigit())
        
        # Chilean number normalization
        if len(digits) == 9 and digits.startswith('9'):
            digits = '56' + digits
        elif len(digits) == 8:
            digits = '569' + digits
            
        # Check if it's a group
        if '-' in phone or 'g.us' in phone:
            return f"{digits}@g.us"
            
        return f"{digits}@s.whatsapp.net"
        
    # ── Queue Processing ──
    
    async def _process_queue(self):
        """Process queued messages after connection."""
        if not self.message_queue:
            return
            
        log.info(f"Processing {len(self.message_queue)} queued messages...")
        pending = self.message_queue.copy()
        self.message_queue = []
        
        for item in pending:
            try:
                await self.send_message(item["phone"], item["text"])
                await asyncio.sleep(0.5)  # Rate limiting
            except Exception as e:
                log.error(f"Queue process error: {e}")
                
    # ── Status Sync ──
    
    async def _sync_status(self):
        """Sync connection status to Supabase."""
        status_obj = {
            "ready": self.is_ready,
            "estado": "CONECTADO" if self.is_ready else (
                "ESPERANDO_QR" if self.current_qr else "CONECTANDO"
            ),
            "usuario": self.user_name,
            "hasQR": bool(self.current_qr),
            "cola": len(self.message_queue),
            "uptime": int(time.time() - self.start_time),
            "version": "1.0-neonize"
        }
        
        await supabase_upsert(
            "eventos_monitoreo",
            {
                "cuenta": "CONFIG_WHATSAPP_STATE",
                "nombre_abonado": json.dumps(status_obj),
                "evento": "CONFIG_STATE",
                "fecha_hora": datetime.now().isoformat()
            },
            "cuenta"
        )
        
# ──────────────────────────────────────────────
# FASTAPI APP
# ──────────────────────────────────────────────
app = FastAPI(title="GAMA WhatsApp Neonize Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service instance
wa_service = WhatsAppService()

# ── Models ──
class SendMessageRequest(BaseModel):
    phone: str
    text: str
    
class StatusResponse(BaseModel):
    ready: bool
    estado: str
    usuario: Optional[str]
    hasQR: bool
    cola: int
    uptime: int
    version: str

# ── Endpoints ──

@app.get("/api/status", response_model=StatusResponse)
async def get_status():
    """Get WhatsApp connection status."""
    return StatusResponse(
        ready=wa_service.is_ready,
        estado="CONECTADO" if wa_service.is_ready else (
            "ESPERANDO_QR" if wa_service.current_qr else "CONECTANDO"
        ),
        usuario=wa_service.user_name,
        hasQR=bool(wa_service.current_qr),
        cola=len(wa_service.message_queue),
        uptime=int(time.time() - wa_service.start_time),
        version="1.0-neonize"
    )

@app.get("/api/qr")
async def get_qr():
    """Get QR code for pairing."""
    return {
        "status": "connected" if wa_service.is_ready else (
            "waiting_qr" if wa_service.current_qr else "connecting"
        ),
        "qr": wa_service.current_qr,
        "usuario": wa_service.user_name
    }

@app.post("/api/send")
async def send_message(req: SendMessageRequest):
    """Send WhatsApp message."""
    result = await wa_service.send_message(req.phone, req.text)
    if result.get("ok"):
        return {"ok": True, **result}
    raise HTTPException(status_code=503, detail=result.get("error", "Send failed"))

@app.post("/api/connect")
async def connect():
    """Connect to WhatsApp."""
    try:
        await wa_service.connect()
        return {"ok": True, "message": "Connecting..."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/disconnect")
async def disconnect():
    """Disconnect from WhatsApp."""
    await wa_service.disconnect()
    return {"ok": True, "message": "Disconnected"}

@app.get("/api/pending")
async def get_pending():
    """Get pending messages (for debugging)."""
    return {"pending": get_pending_messages()}

@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy" if wa_service.is_ready else "connecting",
        "service": "whatsapp-neonize",
        "version": "1.0",
        "uptime": int(time.time() - wa_service.start_time)
    }

# ── Lifecycle ──

@app.on_event("startup")
async def startup():
    """Initialize on startup."""
    init_db()
    wa_service.init_client()
    # Start connection in background
    asyncio.create_task(wa_service.connect())

@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown."""
    await wa_service.disconnect()

# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    log.info(f"Starting WhatsApp Neonize Service on port {PORT}")
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")
