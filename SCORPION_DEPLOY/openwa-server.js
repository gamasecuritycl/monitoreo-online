const express = require('express')
const cors = require('cors')
const path = require('path')
const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const qrcode = require('qrcode-terminal')

const app = express()
app.use(cors())
app.use(express.json())

const PORT = 3015
const SESSION_DIR = path.join(__dirname, '.baileys-session')
let sock = null
let isReady = false
let mensajesRecibidos = []
let currentQR = null
let reconnectAttempts = 0

async function iniciarBaileys() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
    const { version } = await fetchLatestBaileysVersion()

    sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      emitOwnEvents: false,
      browser: ['Chrome', 'Linux', '120.0.6099.144'],
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      patchMessageBeforeSending: true,
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        currentQR = qr
        if (!isReady) {
          qrcode.generate(qr, { small: true })
          console.log('[Baileys] 📱 Escanea el QR con WhatsApp (solo la primera vez)')
        }
      }
      if (connection === 'open') {
        isReady = true
        currentQR = null
        reconnectAttempts = 0
        console.log('[Baileys] ✅ WhatsApp conectado como', sock.user?.name || sock.user?.id)
      }
      if (connection === 'close') {
        isReady = false
        const statusCode = lastDisconnect?.error?.output?.statusCode
        const reason = lastDisconnect?.error?.message || 'desconocido'

        if (statusCode === DisconnectReason.loggedOut) {
          console.log('[Baileys] ❌ Sesión cerrada. Vuelve a escanear QR')
          const fs = require('fs')
          const dir = SESSION_DIR
          if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true })
          }
          return
        }

        reconnectAttempts++
        const delay = Math.min(30 + reconnectAttempts * 5, 120)
        console.log(`[Baileys] Desconectado (${reason}). Reintento en ${delay}s (intento ${reconnectAttempts})`)
        setTimeout(iniciarBaileys, delay * 1000)
      }
    })

    sock.ev.on('messages.upsert', (m) => {
      if (!m.messages) return
      for (const msg of m.messages) {
        if (msg.key.fromMe) continue
        const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
        if (!body) continue
        const registro = {
          from: msg.key.remoteJid,
          body: body,
          timestamp: Date.now(),
          senderName: msg.pushName || '',
        }
        mensajesRecibidos.push(registro)
        if (mensajesRecibidos.length > 200) mensajesRecibidos.shift()
        console.log('[Baileys] 📩 Mensaje de', msg.key.remoteJid, ':', body)
      }
    })

  } catch (err) {
    console.error('[Baileys] Error al iniciar:', err.message)
    setTimeout(iniciarBaileys, 60000)
  }
}

app.get('/api/status', (req, res) => {
  res.json({
    ready: isReady,
    mensajes_recibidos: mensajesRecibidos.length,
    uptime: process.uptime(),
    usuario: sock?.user?.id || null,
  })
})

app.get('/api/qr', (req, res) => {
  res.json({
    qr: currentQR,
    status: isReady ? 'connected' : (currentQR ? 'waiting_qr' : 'connecting'),
  })
})

app.post('/api/send', async (req, res) => {
  const { phone, text } = req.body
  if (!phone || !text) {
    return res.status(400).json({ ok: false, error: 'Faltan phone y text' })
  }
  if (!isReady || !sock) {
    return res.status(503).json({ ok: false, error: 'WhatsApp no conectado' })
  }
  try {
    const jid = phone.includes('@s.whatsapp.net') ? phone : `${phone}@s.whatsapp.net`
    const result = await sock.sendMessage(jid, { text })
    console.log('[Baileys] ✅ Mensaje enviado a', phone)
    res.json({ ok: true, messageId: result?.key?.id })
  } catch (err) {
    console.error('[Baileys] Error al enviar:', err.message)
    res.json({ ok: false, error: err.message })
  }
})

app.get('/api/messages', (req, res) => {
  const since = parseInt(req.query.since || '0')
  const mensajes = since
    ? mensajesRecibidos.filter(m => m.timestamp > since)
    : mensajesRecibidos.slice(-50)
  res.json({ messages: mensajes })
})

app.listen(PORT, () => {
  console.log(`[Baileys] Servidor corriendo en http://localhost:${PORT}`)
  iniciarBaileys()
})
