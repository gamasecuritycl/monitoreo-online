const { create, Client } = require('@open-wa/wa-automate')
const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())

const PORT = 3015
const SESSION_DIR = path.join(__dirname, '.openwa-session')

let client = null
let isReady = false
let mensajesRecibidos = []

// ── Iniciar OpenWA ──
async function iniciarOpenWA() {
  console.log('[OpenWA] Iniciando sesión WhatsApp Web...')
  try {
    client = await create({
      sessionId: 'gama-seguridad',
      dataPath: SESSION_DIR,
      headless: true,
      qrTimeout: 0,
      authTimeout: 0,
      restartOnCrash: true,
      cacheEnabled: false,
      useChrome: true,
      killProcessOnBrowserClose: true,
      throwErrorOnTosBlock: false,
      chromiumArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
      ],
    })

    client.onStateChange((state) => {
      console.log('[OpenWA] Estado:', state)
      if (state === 'CONNECTED') {
        isReady = true
        console.log('[OpenWA] ✅ WhatsApp conectado y listo')
      } else {
        isReady = false
      }
    })

    client.onMessage(async (message) => {
      const registro = {
        from: message.from,
        body: message.body,
        timestamp: Date.now(),
        chatId: message.chatId,
        senderName: message.sender?.pushname || '',
      }
      mensajesRecibidos.push(registro)
      if (mensajesRecibidos.length > 200) mensajesRecibidos.shift()
      console.log('[OpenWA] Mensaje recibido de', message.from, ':', message.body)
    })

    console.log('[OpenWA] Esperando escaneo de código QR...')
  } catch (err) {
    console.error('[OpenWA] Error al iniciar:', err.message)
    console.log('[OpenWA] Reintentando en 10 segundos...')
    setTimeout(iniciarOpenWA, 10000)
  }
}

// ── API REST ──

// Status del servidor
app.get('/api/status', (req, res) => {
  res.json({
    ready: isReady,
    mensajes_recibidos: mensajesRecibidos.length,
    uptime: process.uptime(),
  })
})

// Enviar mensaje
app.post('/api/send', async (req, res) => {
  const { phone, text } = req.body

  if (!phone || !text) {
    return res.status(400).json({ ok: false, error: 'Faltan phone y text' })
  }

  if (!isReady || !client) {
    return res.status(503).json({ ok: false, error: 'WhatsApp no está conectado' })
  }

  try {
    const chatId = phone.includes('@') ? phone : `${phone}@c.us`
    const result = await client.sendText(chatId, text)
    console.log('[OpenWA] ✅ Mensaje enviado a', phone)
    res.json({ ok: true, messageId: result.id })
  } catch (err) {
    console.error('[OpenWA] ❌ Error al enviar:', err.message)
    res.json({ ok: false, error: err.message })
  }
})

// Obtener mensajes recibidos
app.get('/api/messages', (req, res) => {
  const since = parseInt(req.query.since || '0')
  const mensajes = since
    ? mensajesRecibidos.filter(m => m.timestamp > since)
    : mensajesRecibidos.slice(-50)
  res.json({ messages: mensajes })
})

// Obtener QR code (para escanear)
app.get('/api/qr', async (req, res) => {
  if (!client) {
    return res.json({ qr: null, status: 'not_started' })
  }
  try {
    const qr = await client.getQrCode()
    res.json({ qr: qr || null, status: isReady ? 'connected' : 'waiting_qr' })
  } catch {
    res.json({ qr: null, status: isReady ? 'connected' : 'unknown' })
  }
})

// ── Iniciar ──
app.listen(PORT, () => {
  console.log(`[OpenWA] Servidor HTTP corriendo en http://localhost:${PORT}`)
  console.log('[OpenWA] Endpoints:')
  console.log('  GET  /api/status    - Estado de la conexión')
  console.log('  GET  /api/qr        - Código QR para escanear')
  console.log('  POST /api/send      - Enviar mensaje {phone, text}')
  console.log('  GET  /api/messages  - Mensajes recibidos')
  iniciarOpenWA()
})
