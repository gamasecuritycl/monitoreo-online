/**
 * ═══════════════════════════════════════════════════════════════════════
 *  GAMA SEGURIDAD - SERVIDOR WHATSAPP VENTAS & META ADS v1.0
 *  Motor: @whiskeysockets/baileys 7.x
 *  Puerto: 3016 (Aislado e independiente del Command Center puerto 3015)
 *  Sesión: .baileys-ventas-session
 * ═══════════════════════════════════════════════════════════════════════
 */

const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const QRCode = require('qrcode')

const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  isJidBroadcast,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  Browsers,
} = require('@whiskeysockets/baileys')

const pino = require('pino')
const { createClient } = require('@supabase/supabase-js')

// ──────────────────────────────────────────────
//  CONFIGURACIÓN
// ──────────────────────────────────────────────
const PORT = process.env.VENTAS_PORT || 3016
const SESSION_DIR = path.join(__dirname, '.baileys-ventas-session')
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/ventas-whatsapp'

const SUPABASE_URL = 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true })
}

// ──────────────────────────────────────────────
//  ESTADO GLOBAL
// ──────────────────────────────────────────────
let sock = null
let qrActual = null
let qrImageBase64 = null
let pairingCodeActual = null
let estadoConexion = 'desconectado'
let usuarioConectado = null
let numeroConectado = null
let retryCount = 0
let reconnectTimer = null

const msgStore = new Map()
const processedMessages = new Map()
const DEDUP_TTL = 300_000

function log(msg, nivel = 'INFO') {
  const ts = new Date().toLocaleTimeString('es-CL', { hour12: false })
  console.log(`[${ts}] [VENTAS-${nivel}] ${msg}`)
}

function storeMessage(msg) {
  if (!msg?.key?.id || !msg?.message) return
  msgStore.set(msg.key.id, msg.message)
  if (msgStore.size > 1000) {
    const oldest = msgStore.keys().next().value
    msgStore.delete(oldest)
  }
}

async function getMessage(key) {
  const stored = msgStore.get(key.id)
  return stored || { conversation: '' }
}

function formatearNumero(raw) {
  let clean = String(raw).replace(/\D/g, '')
  if (clean.startsWith('56') && clean.length === 11) return clean
  if (clean.startsWith('9') && clean.length === 9) return '56' + clean
  if (clean.length === 8) return '569' + clean
  return clean
}

// ──────────────────────────────────────────────
//  CONEXIÓN BAILEYS
// ──────────────────────────────────────────────
async function conectar() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  estadoConexion = 'conectando'
  log('Iniciando socket Baileys Ventas en puerto ' + PORT + '...')

  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }))

    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
      },
      printQRInTerminal: true,
      logger: pino({ level: 'silent' }),
      browser: Browsers.macOS('GAMA Ventas'),
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      getMessage,
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        qrActual = qr
        qrImageBase64 = await QRCode.toDataURL(qr, { width: 320, margin: 2 })
        estadoConexion = 'esperando_qr'
        log('Nuevo código QR de Ventas generado. Listo para escanear.')
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut

        log(`Conexión cerrada. Código: ${statusCode}. Reconectar: ${shouldReconnect}`, 'WARN')
        estadoConexion = 'desconectado'
        usuarioConectado = null
        numeroConectado = null
        qrActual = null
        qrImageBase64 = null
        pairingCodeActual = null

        if (statusCode === DisconnectReason.loggedOut) {
          log('Sesión cerrada desde el celular. Limpiando credenciales...', 'WARN')
          try {
            fs.rmSync(SESSION_DIR, { recursive: true, force: true })
            fs.mkdirSync(SESSION_DIR, { recursive: true })
          } catch {}
          retryCount = 0
          reconnectTimer = setTimeout(conectar, 3000)
        } else if (shouldReconnect) {
          retryCount++
          const delay = Math.min(5000 * retryCount, 60000)
          log(`Reintentando conexión en ${delay / 1000}s... (Intento ${retryCount})`)
          reconnectTimer = setTimeout(conectar, delay)
        }
      } else if (connection === 'open') {
        estadoConexion = 'conectado'
        retryCount = 0
        qrActual = null
        qrImageBase64 = null
        pairingCodeActual = null

        const rawUser = sock.user?.id || ''
        numeroConectado = rawUser.split(':')[0].split('@')[0]
        usuarioConectado = sock.user?.name || 'Gama Ventas'

        log(`✅ WHATSAPP VENTAS CONECTADO EXITOSAMENTE: +${numeroConectado} (${usuarioConectado})`)
      }
    })

    // ── RECEPCIÓN DE MENSAJES DE LEADS ──
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      for (const msg of messages) {
        if (!msg.key || !msg.key.remoteJid) continue
        if (isJidBroadcast(msg.key.remoteJid)) continue

        storeMessage(msg)

        if (msg.key.id) {
          const now = Date.now()
          if (processedMessages.has(msg.key.id)) continue
          processedMessages.set(msg.key.id, now)
        }

        const body = msg.message?.conversation
          || msg.message?.extendedTextMessage?.text
          || msg.message?.imageMessage?.caption
          || msg.message?.videoMessage?.caption || ''

        if (!body) continue

        const rawJid = msg.key.remoteJid
        const isGroup = rawJid.endsWith('@g.us')
        if (isGroup) continue // No procesar grupos en canal de ventas

        const numero = rawJid.replace(/[^0-9]/g, '')
        const nombre = msg.pushName || 'Prospecto'

        log(`📩 Mensaje recibido de +${numero} (${nombre}): "${body.slice(0, 60)}"`)

        // 1. Guardar en Supabase para el CRM
        try {
          await supabase.from('conversaciones_whatsapp').insert({
            numero,
            tipo_evento: msg.key.fromMe ? 'mensaje_enviado' : 'mensaje_entrante',
            estado: 'enviado',
            respuesta_recibida: msg.key.fromMe ? null : body,
            mensaje_enviado: msg.key.fromMe ? body : null,
            created_at: new Date().toISOString(),
          })
        } catch (e) {
          log(`Error guardando en Supabase: ${e.message}`, 'WARN')
        }

        // 2. Reenviar a n8n si está activo
        if (!msg.key.fromMe) {
          try {
            await fetch(N8N_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'whatsapp_message_received',
                from: numero,
                nombre,
                text: body,
                timestamp: new Date().toISOString(),
              }),
            }).catch(() => {})
          } catch {}
        }
      }
    })

  } catch (err) {
    log(`Error fatal en conexión: ${err.message}`, 'ERROR')
    reconnectTimer = setTimeout(conectar, 10000)
  }
}

// ──────────────────────────────────────────────
//  SERVIDOR EXPRESS (API PUERTO 3016)
// ──────────────────────────────────────────────
const app = express()
app.use(cors())
app.use(express.json())

// Estado
app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    estado: estadoConexion,
    numero: numeroConectado,
    usuario: usuarioConectado,
    tieneQR: !!qrActual,
    puerto: PORT,
  })
})

// QR
app.get('/api/qr', (req, res) => {
  res.json({
    ok: true,
    qr: qrActual,
    qrImage: qrImageBase64,
    estado: estadoConexion,
  })
})

// Solicitar Pairing Code con número de teléfono
app.post('/api/pair', async (req, res) => {
  const { phone } = req.body
  if (!phone) return res.status(400).json({ error: 'Falta parámetro phone' })
  if (!sock) return res.status(503).json({ error: 'Socket no inicializado' })

  try {
    const cleanPhone = String(phone).replace(/\D/g, '')
    log(`Generando Pairing Code para teléfono +${cleanPhone}...`)
    const code = await sock.requestPairingCode(cleanPhone)
    pairingCodeActual = code
    log(`Código de emparejamiento generado: ${code}`)
    res.json({ ok: true, code, phone: cleanPhone })
  } catch (err) {
    log(`Error generando pairing code: ${err.message}`, 'ERROR')
    res.status(500).json({ error: err.message })
  }
})

// Resetear sesión solo de ventas
app.post('/api/reset-session', async (req, res) => {
  log('Petición de reset de sesión de Ventas recibida...', 'WARN')
  try {
    if (sock) {
      await sock.logout().catch(() => {})
      sock.end()
      sock = null
    }
    fs.rmSync(SESSION_DIR, { recursive: true, force: true })
    fs.mkdirSync(SESSION_DIR, { recursive: true })
    setTimeout(conectar, 1500)
    res.json({ ok: true, mensaje: 'Sesión de ventas reseteada. Generando nuevo QR...' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Enviar mensaje a un lead (usado por n8n o Meta Ads)
app.post('/api/send', async (req, res) => {
  const { numero, mensaje } = req.body
  if (!numero || !mensaje) {
    return res.status(400).json({ error: 'Faltan campos numero o mensaje' })
  }

  if (estadoConexion !== 'conectado' || !sock) {
    return res.status(503).json({ error: 'Servidor WhatsApp Ventas no está conectado todavía' })
  }

  const cleanNum = formatearNumero(numero)
  const jid = `${cleanNum}@s.whatsapp.net`

  try {
    log(`Enviando mensaje a +${cleanNum}...`)
    const sent = await sock.sendMessage(jid, { text: String(mensaje) })
    log(`✅ Mensaje enviado exitosamente a +${cleanNum} (ID: ${sent?.key?.id})`)
    res.json({ ok: true, id: sent?.key?.id, numero: cleanNum })
  } catch (err) {
    log(`Error enviando mensaje a +${cleanNum}: ${err.message}`, 'ERROR')
    res.status(500).json({ error: err.message })
  }
})

// Dashboard visual
app.get('/', (req, res) => {
  const isConectado = estadoConexion === 'conectado'
  const isEsperando = estadoConexion === 'esperando_qr'

  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="6">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GAMA WhatsApp Ventas & Meta Ads</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #050d1a; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #0f1c30; border: 1px solid #1e3a5f; border-radius: 24px; padding: 36px; max-width: 520px; width: 100%; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.6); }
    h1 { color: #38bdf8; font-size: 24px; font-weight: 800; margin-bottom: 6px; }
    h2 { color: #94a3b8; font-size: 14px; font-weight: 500; margin-bottom: 24px; }
    .badge { display: inline-block; padding: 8px 22px; border-radius: 999px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 24px; }
    .badge-ok { background: #10b981; color: #022c22; }
    .badge-wait { background: #f59e0b; color: #451a03; animation: pulse 2s infinite; }
    .badge-off { background: #ef4444; color: #450a0a; }
    .qr-box { background: white; padding: 16px; border-radius: 16px; display: inline-block; margin: 16px 0; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    .qr-box img { display: block; max-width: 260px; height: auto; }
    .phone-info { font-size: 18px; font-weight: 700; color: #10b981; margin: 16px 0; }
    .pair-section { margin-top: 24px; padding: 18px; background: #0a1424; border: 1px solid #1e293b; border-radius: 16px; text-align: left; }
    .pair-section label { display: block; font-size: 12px; color: #94a3b8; font-weight: 600; margin-bottom: 8px; }
    .pair-input-group { display: flex; gap: 8px; }
    .pair-input { flex: 1; background: #050d1a; border: 1px solid #334155; border-radius: 10px; padding: 10px 14px; color: white; font-size: 14px; outline: none; }
    .pair-btn { background: #0284c7; color: white; border: none; border-radius: 10px; padding: 10px 16px; font-weight: 700; font-size: 13px; cursor: pointer; }
    .pair-btn:hover { background: #0369a1; }
    .pair-code-display { margin-top: 12px; padding: 12px; background: #0369a1; color: white; border-radius: 10px; font-family: monospace; font-size: 20px; font-weight: 800; letter-spacing: 4px; text-align: center; }
    .note { font-size: 12px; color: #64748b; margin-top: 24px; line-height: 1.6; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
  </style>
</head>
<body>
  <div class="card">
    <h1>🛡️ GAMA SEGURIDAD</h1>
    <h2>WhatsApp Comercial & Meta Ads (Puerto ${PORT})</h2>

    ${
      isConectado
        ? `
      <div class="badge badge-ok">✅ Conectado y Activo</div>
      <div class="phone-info">📱 +${numeroConectado} (${usuarioConectado})</div>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
        Este canal exclusivo de ventas está listo para recibir leads de Meta Ads y responder cotizaciones automáticamente.
      </p>
      <div style="margin-top: 20px;">
        <button onclick="resetear()" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
          Desvincular y cambiar número
        </button>
      </div>
    `
        : isEsperando
        ? `
      <div class="badge badge-wait">⏳ Esperando Escaneo</div>
      <p style="color: #cbd5e1; font-size: 13px; margin-bottom: 12px;">
        Abre WhatsApp en tu <strong>teléfono nuevo</strong>:<br>
        <strong>Ajustes > Dispositivos vinculados > Vincular un dispositivo</strong>
      </p>
      <div class="qr-box">
        <img src="${qrImageBase64}" alt="Código QR WhatsApp Ventas" />
      </div>

      <div class="pair-section">
        <label>¿Prefieres vincular con código sin escanear QR?</label>
        <div class="pair-input-group">
          <input id="phoneInput" class="pair-input" type="text" placeholder="Ej: 56912345678" value="569" />
          <button class="pair-btn" onclick="solicitarCodigo()">Pedir Código</button>
        </div>
        <div id="codeResult"></div>
      </div>
    `
        : `
      <div class="badge badge-off">Iniciando Socket...</div>
      <p style="color: #94a3b8; font-size: 13px;">Generando canal seguro de conexión...</p>
    `
    }

    <div class="note">
      🔒 Canal 100% aislado del Command Center Operativo (Puerto 3015).<br>
      Tus alertas técnicas y monitoreo 24/7 se mantienen intactos.
    </div>
  </div>

  <script>
    async function solicitarCodigo() {
      const phone = document.getElementById('phoneInput').value;
      const res = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (data.code) {
        document.getElementById('codeResult').innerHTML = 
          '<div class="pair-code-display">' + data.code + '</div><div style="font-size:11px;color:#38bdf8;margin-top:6px;text-align:center;">Ingresa este código en tu WhatsApp en: Vincular con número de teléfono</div>';
      } else {
        alert(data.error || 'Error solicitando código');
      }
    }

    async function resetear() {
      if (!confirm('¿Seguro que deseas desvincular este número de ventas?')) return;
      await fetch('/api/reset-session', { method: 'POST' });
      location.reload();
    }
  </script>
</body>
</html>
  `)
})

app.listen(PORT, () => {
  log(`🚀 Servidor WhatsApp Ventas escuchando en http://localhost:${PORT}`)
  conectar()
})
