/**
 * ═══════════════════════════════════════════════════════════════════════
 *  GAMA SEGURIDAD - SERVIDOR WHATSAPP v3.0 (Baileys Edition)
 *  Motor: @whiskeysockets/baileys (WebSocket puro, sin Chromium)
 *  Puerto: 3015
 * ═══════════════════════════════════════════════════════════════════════
 *  CARACTERÍSTICAS:
 *  ✅ Reconexión automática con backoff exponencial
 *  ✅ Cola de mensajes: si WA desconecta, encola y reenvía al reconectar
 *  ✅ Heartbeat / Watchdog: detecta conexiones zombi
 *  ✅ QR como imagen PNG (para mostrar en el dashboard web)
 *  ✅ Pairing Code: vincular sin escanear QR físico (+56948855190)
 *  ✅ Mensajes entrantes → Supabase (histórico en tiempo real)
 *  ✅ Normalización de números chilenos (9xx → 569xx)
 * ═══════════════════════════════════════════════════════════════════════
 */

const express = require('express')
const cors    = require('cors')
const path    = require('path')
const fs      = require('fs')
const QRCode  = require('qrcode')

const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidBroadcast,
} = require('@whiskeysockets/baileys')

const pino    = require('pino')
const { createClient } = require('@supabase/supabase-js')

// ──────────────────────────────────────────────
//  CONFIG
// ──────────────────────────────────────────────
const PORT         = 3015
const SESSION_DIR  = path.join(__dirname, '.baileys-session')
const MAX_QUEUE    = 500          // máx mensajes en cola
const HEARTBEAT_MS = 30_000      // ping cada 30s
const MAX_RETRIES  = 3           // reconexiones rápidas antes de backoff
const PHONE_PAIR   = '56948855190'  // número para pairing code

const SUPABASE_URL  = 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjg1NTE0NCwiZXhwIjoyMDk4NDMxMTQ0fQ.z1g6qH3-m18hRk9383t_Y7hIQCMnaqxAnnJ_key_service_role' // Master Bypass Service Role Key
const supabase     = createClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTQ0NTY0MCwiZXhwIjoyMDk5NzIxNjQwfQ.ZN2sw5R4K5EHuttLzDguKnsF1KBgqUKqOpipB7dGR1Y')

// ──────────────────────────────────────────────
//  ESTADO GLOBAL
// ──────────────────────────────────────────────
let sock            = null
let isReady         = false
let currentQR       = null        // string raw del QR
let currentQRImage  = null        // PNG base64 del QR
let retryCount      = 0
let heartbeatTimer  = null
let reconnectTimer  = null
let messageQueue    = []          // [{ phone, text, resolve, reject, ts }]
let startTime       = Date.now()
let userName        = null
let pairingRequested = false

// ──────────────────────────────────────────────
//  EXPRESS
// ──────────────────────────────────────────────
const app = express()
app.use(cors())
app.use(express.json())

// ──────────────────────────────────────────────
//  TÚNEL NGROK AUTOMÁTICO (Serverless Bridge)
// ──────────────────────────────────────────────
async function iniciarNgrokTunnel() {
  if (!process.env.LOCAL_DEV) {
    log('🌐 Servidor en la nube detectado. Omitiendo Ngrok y operando en modo directo 100% Supabase-Realtime.')
    return
  }
  try {
    log('🌐 Iniciando Tunel de Ngrok en puerto 3015...')
    // Usar la librería oficial ngrok para levantar el túnel en caliente
    const ngrok = require('ngrok')
    const url = await ngrok.connect({
      proto: 'http',
      addr: PORT,
    })

    log(`🔗 Tunel Ngrok activo: ${url}`)
    
    // Guardar URL en Supabase
    await supabase
      .from('eventos_monitoreo')
      .upsert({
        cuenta: 'CONFIG_WHATSAPP_URL',
        nombre_abonado: url,
        evento: 'TUNNEL_URL',
        fecha_hora: new Date().toISOString()
      }, { onConflict: 'cuenta' })
    log('✅ URL del tunel Ngrok sincronizada en Supabase con exito.')

  } catch (err) {
    log(`⚠️  Error al levantar Ngrok: ${err.message}`, 'WARN')
  }
}

const server = app.listen(PORT, () => {
  log(`🚀 Servidor GAMA WhatsApp v3.0 escuchando en http://localhost:${PORT}`)
  log(`📁 Sesión guardada en: ${SESSION_DIR}`)
  conectar()
  suscribirSupabaseRealtime()
  iniciarNgrokTunnel()
})

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    log(`⚠️  Puerto ${PORT} ocupado. ¿Hay otra instancia corriendo?`, 'WARN')
  } else {
    log(`❌ Error servidor: ${err.message}`, 'ERROR')
  }
})

// ──────────────────────────────────────────────
//  LOGGER
// ──────────────────────────────────────────────
function log(msg, nivel = 'INFO') {
  const ts = new Date().toLocaleTimeString('es-CL', { hour12: false })
  const prefijo = nivel === 'ERROR' ? '❌' : nivel === 'WARN' ? '⚠️ ' : '  '
  console.log(`[${ts}] ${prefijo} ${msg}`)
}

// ──────────────────────────────────────────────
//  NORMALIZAR NÚMERO
// ──────────────────────────────────────────────
function normalizarJID(phone) {
  // Quitar todo excepto dígitos y +
  let digits = phone.toString().replace(/[^0-9]/g, '')
  // Chile: 9 dígitos empezando en 9 → agregar 56
  if (digits.length === 9 && digits.startsWith('9')) digits = '56' + digits
  // Chile: 8 dígitos → agregar 569
  else if (digits.length === 8) digits = '569' + digits
  return digits.endsWith('@s.whatsapp.net') ? digits : `${digits}@s.whatsapp.net`
}

// ──────────────────────────────────────────────
//  HEARTBEAT: detectar conexión zombi y forzar reinicio (Watchdog Nuclear)
// ──────────────────────────────────────────────
let watchdogFailures = 0

function iniciarHeartbeat() {
  detenerHeartbeat()
  watchdogFailures = 0
  heartbeatTimer = setInterval(async () => {
    if (!sock) return
    
    // Si la cola crece demasiado, el socket está bloqueado/congelado. Forzar autoreinicio.
    if (messageQueue.length > 20) {
      log(`🚨 WATCHDOG: Cola saturada con ${messageQueue.length} mensajes. Reiniciando servidor...`, 'ERROR')
      process.exit(1)
    }

    if (!isReady) return

    try {
      // Verificar que la sesión sigue viva consultando el estado
      const state = await Promise.race([
        sock.query({ tag: 'iq', attrs: { to: '@s.whatsapp.net', type: 'get', xmlns: 'w:p' }, content: [] }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 15_000))
      ]).catch(() => null)

      if (!state) {
        watchdogFailures++
        log(`⚠️  WATCHDOG: Chequeo de conexión fallido (${watchdogFailures}/4)`, 'WARN')
        if (watchdogFailures >= 4) {
          log('🚨 WATCHDOG: Conexión congelada detectada por 120s. Forzando reinicio...', 'ERROR')
          process.exit(1)
        }
      } else {
        watchdogFailures = 0
      }
    } catch {
      watchdogFailures++
      if (watchdogFailures >= 4) {
        log('🚨 WATCHDOG: Conexión en error detectada por 120s. Forzando reinicio...', 'ERROR')
        process.exit(1)
      }
    }
  }, HEARTBEAT_MS)
}

function detenerHeartbeat() {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null }
}

// ──────────────────────────────────────────────
//  PERSISTENCIA DE SESIÓN EN SUPABASE (Serverless-ready)
// ──────────────────────────────────────────────
async function loadSessionFromSupabase() {
  try {
    log('📥 Buscando credenciales de sesión en Supabase...')
    const { data, error } = await supabase
      .from('eventos_monitoreo')
      .select('nombre_abonado')
      .eq('cuenta', 'CONFIG_WHATSAPP_SESSION')
      .limit(1)
    
    if (error || !data || data.length === 0) {
      log('ℹ️  No se encontraron credenciales previas en Supabase. Se iniciará sesión limpia.')
      return
    }

    const sessionData = JSON.parse(data[0].nombre_abonado || '{}')
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true })
    }

    // Reconstruir archivos de sesión
    Object.entries(sessionData).forEach(([fileName, content]) => {
      const filePath = path.join(SESSION_DIR, fileName)
      fs.writeFileSync(filePath, JSON.stringify(content))
    })
    log('✅ Credenciales de sesión descargadas y reconstruidas localmente.')
  } catch (err) {
    log(`⚠️  Error al cargar credenciales de Supabase: ${err.message}`, 'WARN')
  }
}

async function guardarConfigSupabase(cuenta, nombre_abonado, evento) {
  try {
    await supabase.from('eventos_monitoreo').delete().eq('cuenta', cuenta)
    await supabase.from('eventos_monitoreo').insert({
      cuenta,
      nombre_abonado,
      evento,
      fecha_hora: new Date().toISOString()
    })
  } catch (e) {
    log(`⚠️ Error guardando config ${cuenta} en Supabase: ${e.message}`, 'WARN')
  }
}

async function saveSessionToSupabase() {
  try {
    if (!fs.existsSync(SESSION_DIR)) return

    const files = fs.readdirSync(SESSION_DIR)
    const sessionData = {}

    files.forEach(file => {
      // Guardamos creds.json y archivos de clave criptográfica (pre-keys, etc)
      if (file.endsWith('.json')) {
        try {
          const content = fs.readFileSync(path.join(SESSION_DIR, file), 'utf-8')
          sessionData[file] = JSON.parse(content)
        } catch {}
      }
    })

    if (Object.keys(sessionData).length === 0) return

    await guardarConfigSupabase(
      'CONFIG_WHATSAPP_SESSION',
      JSON.stringify(sessionData),
      'CONFIG_SESSION'
    )

  } catch (err) {
    log(`⚠️  Error al sincronizar credenciales a Supabase: ${err.message}`, 'WARN')
  }
}

// ──────────────────────────────────────────────
//  SINCRONIZAR ESTADO Y QR A SUPABASE
// ──────────────────────────────────────────────
let currentPairingCode = null

async function sincronizarEstadoASupabase() {
  try {
    const estadoObj = {
      ready:      isReady,
      estado:     isReady ? 'CONECTADO' : (currentQR ? 'ESPERANDO_QR' : 'CONECTANDO'),
      usuario:    userName,
      hasQR:      !!currentQR,
      cola:       messageQueue.length,
      uptime:     Math.round((Date.now() - startTime) / 1000),
      reintentos: retryCount,
      pairingCode: currentPairingCode,
      version:    '3.0',
    }

    await guardarConfigSupabase(
      'CONFIG_WHATSAPP_STATE',
      JSON.stringify(estadoObj),
      'CONFIG_STATE'
    )

    const qrObj = {
      status: isReady ? 'connected' : (currentQR ? 'waiting_qr' : 'connecting'),
      qr: currentQR,
      qrImage: currentQRImage,
      usuario: userName
    }

    await guardarConfigSupabase(
      'CONFIG_WHATSAPP_QR',
      JSON.stringify(qrObj),
      'CONFIG_QR'
    )

  } catch (err) {
    log(`⚠️  Error sincronizando estado a Supabase: ${err.message}`, 'WARN')
  }
}

// ──────────────────────────────────────────────
//  CONEXIÓN PRINCIPAL
// ──────────────────────────────────────────────
async function conectar() {
  // Cancelar timers previos
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  detenerHeartbeat()

  try {
    // 1. Descargar credenciales desde Supabase si existen
    await loadSessionFromSupabase()

    log(`🔌 Iniciando conexión Baileys... (intento ${retryCount + 1})`)

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
    const { version }          = await fetchLatestBaileysVersion()

    log(`📦 Versión protocolo WhatsApp: ${version.join('.')}`)

    sock = makeWASocket({
      version,
      auth:                     state,
      logger:                   pino({ level: 'silent' }),
      printQRInTerminal:        false,
      markOnlineOnConnect:      false,
      connectTimeoutMs:         60_000,
      keepAliveIntervalMs:      25_000,
      emitOwnEvents:            false,
      generateHighQualityLinkPreview: false,
      syncFullHistory:          false,
      browser:                  ['Gama Seguridad', 'Chrome', '124.0.0'],
    })

    // ── Guardar credenciales y sincronizar a Supabase ──
    sock.ev.on('creds.update', async () => {
      await saveCreds()
      await saveSessionToSupabase()
    })

    // ── Actualización de conexión ──
    sock.ev.on('connection.update', async update => {
      const { connection, lastDisconnect, qr } = update

      // QR code disponible
      if (qr) {
        currentQR = qr
        isReady   = false
        userName  = null
        log('📲 Nuevo código QR generado. Escanea con WhatsApp corporativo o usa /api/pair')
        // Mostrar en terminal también
        try {
          const qrTerminal = require('qrcode-terminal')
          qrTerminal.generate(qr, { small: true })
        } catch {}
        // Generar PNG para el dashboard
        try {
          currentQRImage = await QRCode.toDataURL(qr, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
        } catch {}
        
        await sincronizarEstadoASupabase()
      }

      if (connection === 'open') {
        isReady       = true
        currentQR     = null
        currentQRImage = null
        retryCount    = 0
        pairingRequested = false
        currentPairingCode = null
        userName      = sock.user?.name || sock.user?.id?.split(':')[0] || 'desconocido'
        log(`✅ ¡WhatsApp CONECTADO! Usuario: ${userName}`)
        iniciarHeartbeat()
        await sincronizarEstadoASupabase()
        // Despachar mensajes en cola
        setTimeout(despacharCola, 2_000)
      }

      if (connection === 'close') {
        isReady = false
        detenerHeartbeat()
        const statusCode = lastDisconnect?.error?.output?.statusCode
        const reason     = lastDisconnect?.error?.message || 'desconocido'

        log(`🔌 Desconectado. Código: ${statusCode}, Razón: ${reason}`, 'WARN')
        await sincronizarEstadoASupabase()

        if (statusCode === DisconnectReason.loggedOut) {
          log('🔴 Sesión cerrada (logout). Borrando sesión y esperando nuevo QR...', 'WARN')
          borrarSesion()
          retryCount = 0
          reconnectTimer = setTimeout(conectar, 3_000)
          return
        }

        if (statusCode === DisconnectReason.badSession) {
          log('🔴 Sesión inválida. Borrando y reiniciando...', 'WARN')
          borrarSesion()
          retryCount = 0
          reconnectTimer = setTimeout(conectar, 5_000)
          return
        }

        // Reconexión con backoff exponencial
        retryCount++
        const delay = retryCount <= MAX_RETRIES
          ? 5_000                                    // primeros 3 intentos: 5s
          : Math.min(15_000 * (retryCount - MAX_RETRIES), 120_000)  // luego backoff hasta 120s

        log(`⏳ Reintentando en ${Math.round(delay/1000)}s (intento ${retryCount})...`)
        reconnectTimer = setTimeout(conectar, delay)
      }
    })

    // ── Mensajes entrantes ──
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return
      for (const msg of messages) {
        if (msg.key.fromMe) continue
        if (isJidBroadcast(msg.key.remoteJid || '')) continue

        const body = msg.message?.conversation
          || msg.message?.extendedTextMessage?.text
          || msg.message?.imageMessage?.caption
          || ''

        if (!body) continue

        const jid    = msg.key.remoteJid || ''
        const numero = jid.replace('@s.whatsapp.net', '').replace('@g.us', '')
        const nombre = msg.pushName || ''

        log(`💬 Mensaje de ${nombre} (+${numero}): "${body.slice(0, 60)}"`)

        // Guardar en Supabase
        try {
          await supabase.from('conversaciones_whatsapp').insert({
            numero,
            tipo_evento:        'mensaje_entrante',
            estado:             'pendiente',
            respuesta_recibida: body,
            created_at:         new Date().toISOString(),
          })
        } catch (err) {
          log(`No se pudo guardar mensaje en Supabase: ${err.message}`, 'WARN')
        }
      }
    })

  } catch (err) {
    log(`❌ Error al iniciar conexión: ${err.message}`, 'ERROR')
    retryCount++
    const delay = Math.min(10_000 * retryCount, 120_000)
    log(`⏳ Reintentando en ${Math.round(delay/1000)}s...`)
    reconnectTimer = setTimeout(conectar, delay)
  }
}

// ──────────────────────────────────────────────
//  COLA DE MENSAJES
// ──────────────────────────────────────────────
async function despacharCola() {
  if (!isReady || !sock || messageQueue.length === 0) return
  log(`📬 Despachando cola: ${messageQueue.length} mensaje(s) pendiente(s)`)
  const pendientes = [...messageQueue]
  messageQueue = []
  for (const item of pendientes) {
    try {
      const jid = normalizarJID(item.phone)
      await sock.sendMessage(jid, { text: item.text })
      log(`✅ Cola → enviado a ${item.phone}`)
      item.resolve({ ok: true, fuente: 'cola' })
    } catch (err) {
      log(`❌ Cola → error enviando a ${item.phone}: ${err.message}`, 'ERROR')
      item.reject(err)
    }
    // Pequeño delay para no spammear
    await new Promise(r => setTimeout(r, 600))
  }
}

// ──────────────────────────────────────────────
//  ENVÍO DE MENSAJE (con cola)
// ──────────────────────────────────────────────
async function enviarMensaje(phone, text) {
  const jid = normalizarJID(phone)

  if (isReady && sock) {
    try {
      await sock.sendMessage(jid, { text })
      log(`✅ Mensaje enviado a ${phone}: "${text.slice(0, 40)}..."`)
      return { ok: true, fuente: 'directo' }
    } catch (err) {
      log(`❌ Error enviando a ${phone}: ${err.message}`, 'ERROR')
      throw err
    }
  } else {
    // Encolar
    if (messageQueue.length >= MAX_QUEUE) {
      log('⚠️  Cola llena. Descartando mensaje más antiguo.', 'WARN')
      const old = messageQueue.shift()
      old.reject(new Error('Cola llena, mensaje descartado'))
    }
    log(`📥 WhatsApp no conectado. Encolando mensaje para ${phone}`)
    return new Promise((resolve, reject) => {
      messageQueue.push({ phone, text, resolve, reject, ts: Date.now() })
    })
  }
}

// ──────────────────────────────────────────────
//  BORRAR SESIÓN
// ──────────────────────────────────────────────
async function borrarSesion() {
  try {
    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, { recursive: true, force: true })
      log(`🗑️  Sesión borrada localmente: ${SESSION_DIR}`)
    }
  } catch (err) {
    log(`Error borrando sesión local: ${err.message}`, 'WARN')
  }
  
  // Borrar también de Supabase
  try {
    await supabase
      .from('eventos_monitoreo')
      .delete()
      .eq('cuenta', 'CONFIG_WHATSAPP_SESSION')
    log('🗑️  Sesión borrada en Supabase.')
  } catch (err) {
    log(`Error borrando sesión en Supabase: ${err.message}`, 'WARN')
  }

  currentQR      = null
  currentQRImage = null
  isReady        = false
  userName       = null
}

// ──────────────────────────────────────────────
//  SUPABASE REALTIME (canal broadcast y tablas)
// ──────────────────────────────────────────────
function suscribirSupabaseRealtime() {
  try {
    // 1. Canal de envío rápido (broadcast)
    supabase.channel('whatsapp_outbound')
      .on('broadcast', { event: 'send_whatsapp' }, async ({ payload }) => {
        if (payload?.phone && payload?.text) {
          log(`📡 Broadcast Supabase → ${payload.phone}`)
          try {
            await enviarMensaje(payload.phone, payload.text)
          } catch (err) {
            log(`Error en broadcast: ${err.message}`, 'ERROR')
          }
        }
      })
      .subscribe(status => {
        log(`Supabase Realtime (outbound): ${status}`)
      })

    // 2. Canal de comandos del dashboard (escucha de tabla)
    supabase.channel('whatsapp_commands')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'eventos_monitoreo',
        filter: 'cuenta=eq.CONFIG_WHATSAPP_COMMAND'
      }, async payload => {
        const cmd = payload.new?.nombre_abonado || ''
        log(`📡 Comando recibido por Supabase: "${cmd}"`)

        if (cmd === 'LOGOUT') {
          log('🔴 Ejecutando comando LOGOUT...')
          try {
            if (sock) await sock.logout().catch(() => {})
          } catch {}
          await borrarSesion()
          retryCount = 0
          pairingRequested = false
          currentPairingCode = null
          if (reconnectTimer) clearTimeout(reconnectTimer)
          reconnectTimer = setTimeout(conectar, 2000)
          await sincronizarEstadoASupabase()
        }
        else if (cmd.startsWith('PAIR:')) {
          const phone = cmd.split(':')[1]?.replace(/[^0-9]/g, '')
          log(`🔑 Ejecutando comando PAIR para: ${phone}`)
          if (!sock || isReady) return
          try {
            pairingRequested = true
            const code = await sock.requestPairingCode(phone)
            currentPairingCode = code
            log(`🔑 Pairing Code generado exitosamente: ${code}`)
            await sincronizarEstadoASupabase()
          } catch (err) {
            log(`Error al solicitar pairing code: ${err.message}`, 'ERROR')
            pairingRequested = false
            currentPairingCode = null
            await sincronizarEstadoASupabase()
          }
        }
      })
      .subscribe(status => {
        log(`Supabase Realtime (commands): ${status}`)
      })

    // 3. Canal de despacho de notificaciones pendientes (escucha de tabla)
    supabase.channel('whatsapp_pending_dispatches')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'conversaciones_whatsapp',
        filter: 'estado=eq.pendiente'
      }, async payload => {
        const row = payload.new
        if (!row || !row.numero || !row.mensaje_enviado) return
        log(`📡 Notificación pendiente detectada para +${row.numero} (ID: ${row.id})`)

        try {
          // Despachar a WhatsApp
          await enviarMensaje(row.numero, row.mensaje_enviado)
          
          // Actualizar estado a enviado en Supabase
          await supabase
            .from('conversaciones_whatsapp')
            .update({ estado: 'enviado' })
            .eq('id', row.id)
          log(`✅ Fila ID: ${row.id} despachada y actualizada a 'enviado'.`)
        } catch (err) {
          log(`❌ Error despachando fila ID: ${row.id} - ${err.message}`, 'ERROR')
          await supabase
            .from('conversaciones_whatsapp')
            .update({ estado: 'error', error_msg: err.message })
            .eq('id', row.id)
        }
      })
      .subscribe(status => {
        log(`Supabase Realtime (dispatches): ${status}`)
      })

  } catch (err) {
    log(`Supabase Realtime no disponible: ${err.message}`, 'WARN')
  }
}

// ══════════════════════════════════════════════
//  API ROUTES
// ══════════════════════════════════════════════

// ── Estado del servidor ──
app.get('/api/status', (req, res) => {
  res.json({
    ready:      isReady,
    estado:     isReady ? 'CONECTADO' : (currentQR ? 'ESPERANDO_QR' : 'CONECTANDO'),
    usuario:    userName,
    hasQR:      !!currentQR,
    cola:       messageQueue.length,
    uptime:     Math.round((Date.now() - startTime) / 1000),
    reintentos: retryCount,
    version:    '3.0',
  })
})

// ── QR como imagen PNG (base64) ──
app.get('/api/qr', (req, res) => {
  if (isReady) {
    return res.json({ status: 'connected', qr: null, qrImage: null, usuario: userName })
  }
  if (!currentQR) {
    return res.json({ status: 'connecting', qr: null, qrImage: null })
  }
  res.json({
    status:   'waiting_qr',
    qr:       currentQR,
    qrImage:  currentQRImage,  // data:image/png;base64,...
  })
})

// ── QR como imagen PNG directa (para <img src="/api/qr-image"> ) ──
app.get('/api/qr-image', async (req, res) => {
  if (isReady || !currentQR) {
    return res.status(204).end()
  }
  try {
    const png = await QRCode.toBuffer(currentQR, { width: 300, margin: 2 })
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-cache')
    res.send(png)
  } catch {
    res.status(500).json({ error: 'No se pudo generar el QR' })
  }
})

// ── Pairing Code: vincular sin QR físico ──
app.post('/api/pair', async (req, res) => {
  const phone = (req.body?.phone || PHONE_PAIR).replace(/[^0-9]/g, '')
  if (!phone) return res.status(400).json({ ok: false, error: 'Falta número de teléfono' })
  if (isReady) return res.json({ ok: false, error: 'Ya conectado. Desconecta primero.' })
  if (!sock) return res.status(503).json({ ok: false, error: 'Socket no inicializado' })

  try {
    if (!pairingRequested) {
      pairingRequested = true
      const code = await sock.requestPairingCode(phone)
      log(`🔑 Pairing Code para ${phone}: ${code}`)
      return res.json({ ok: true, code, phone, instruccion: 'Ingresa este código en WhatsApp → Dispositivos vinculados → Vincular dispositivo → Vincular con número de teléfono' })
    } else {
      return res.json({ ok: false, error: 'Pairing code ya solicitado. Espera la conexión o reinicia el servidor.' })
    }
  } catch (err) {
    pairingRequested = false
    return res.status(500).json({ ok: false, error: err.message })
  }
})

// ── Enviar mensaje ──
app.post('/api/send', async (req, res) => {
  const { phone, text } = req.body
  if (!phone || !text) {
    return res.status(400).json({ ok: false, error: 'Faltan parámetros: phone y text' })
  }
  try {
    const result = await enviarMensaje(phone, text)
    res.json({ ok: true, ...result, estado: isReady ? 'CONECTADO' : 'ENCOLADO' })
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message })
  }
})

// ── Mensajes recibidos (en memoria) ──
app.get('/api/messages', async (req, res) => {
  try {
    const { data } = await supabase
      .from('conversaciones_whatsapp')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    res.json({ messages: data || [] })
  } catch {
    res.json({ messages: [] })
  }
})

// ── Desconectar / Reiniciar sesión ──
app.post('/api/logout', async (req, res) => {
  log('🔴 Logout solicitado por dashboard')
  try {
    if (sock) await sock.logout().catch(() => {})
  } catch {}
  borrarSesion()
  retryCount = 0
  pairingRequested = false
  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(conectar, 2_000)
  res.json({ ok: true, mensaje: 'Sesión cerrada. Reconectando en 2s...' })
})

// ── Panel Web de Estado ──
app.get('/', (req, res) => {
  const estado = isReady ? 'CONECTADO' : currentQR ? 'ESPERANDO QR' : 'CONECTANDO...'
  const color  = isReady ? '#22c55e' : currentQR ? '#f59e0b' : '#64748b'
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="8">
  <title>GAMA WhatsApp v3.0</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0f172a; color: #e2e8f0; font-family: 'Segoe UI', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
    h1 { color: #22c55e; font-size: 22px; margin-bottom: 4px; }
    h2 { color: #94a3b8; font-size: 14px; margin-bottom: 24px; font-weight: 400; }
    .badge { display: inline-block; padding: 8px 20px; border-radius: 999px; font-weight: 700; font-size: 13px; color: #000; background: ${color}; margin-bottom: 20px; }
    .qr-wrap { background: #fff; border-radius: 12px; padding: 16px; display: inline-block; margin: 16px 0; }
    .info { font-size: 12px; color: #64748b; margin-top: 20px; line-height: 1.8; }
    .usuario { color: #38bdf8; font-weight: 700; font-size: 16px; margin: 12px 0; }
    .cola { color: #f59e0b; font-size: 12px; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🛡️ GAMA SEGURIDAD</h1>
    <h2>WhatsApp Corporativo v3.0 — Puerto ${PORT}</h2>
    <div class="badge">${estado}</div>
    ${userName ? `<div class="usuario">👤 ${userName}</div>` : ''}
    ${currentQRImage ? `
    <div>
      <p style="color:#fef08a;font-size:13px;margin-bottom:8px;">📲 Escanea el QR con WhatsApp corporativo:</p>
      <div class="qr-wrap"><img src="${currentQRImage}" width="240" height="240" alt="QR"></div>
      <p style="font-size:11px;color:#94a3b8;">O usa Pairing Code: POST /api/pair</p>
    </div>` : ''}
    ${isReady ? `<div style="color:#4ade80;margin:12px 0;font-size:14px;">✅ Dispositivo vinculado y activo<br>Mensajes siendo procesados en tiempo real</div>` : ''}
    ${messageQueue.length > 0 ? `<div class="cola">📥 ${messageQueue.length} mensaje(s) en cola esperando reconexión</div>` : ''}
    <div class="info">
      ⏱ Uptime: ${Math.round((Date.now() - startTime) / 60000)} min |
      🔄 Reintentos: ${retryCount} |
      📬 Cola: ${messageQueue.length}<br>
      📡 Canal: whatsapp_outbound | 🔗 Supabase Realtime activo
    </div>
  </div>
</body>
</html>`)
})

log('═══════════════════════════════════════════')
log('  GAMA SEGURIDAD - WhatsApp Server v3.0   ')
log('═══════════════════════════════════════════')
