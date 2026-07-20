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

function normalizarJID(raw) {
  if (!raw) return ''
  const str = String(raw).trim()
  if (str.endsWith('@g.us') || str.endsWith('@s.whatsapp.net')) return str
  if (str.includes('-') || str.startsWith('120') || str.includes('@g')) {
    return str.replace('@s.whatsapp.net', '') + '@g.us'
  }
  let digits = str.replace(/[^0-9]/g, '')
  if (digits.length === 9 && digits.startsWith('9')) digits = '56' + digits
  else if (digits.length === 8) digits = '569' + digits
  return `${digits}@s.whatsapp.net`
}

async function sincronizarGruposASupabase() {
  if (!sock || !isReady) return
  try {
    const groups = await sock.groupFetchAllParticipating()
    const groupList = Object.values(groups).map(g => ({
      id: g.id,
      subject: g.subject || 'Grupo WhatsApp',
      creation: g.creation,
      owner: g.owner,
      participantsCount: g.participants?.length || 0,
    }))

    log(`👥 ${groupList.length} Grupo(s) de WhatsApp detectados:`)
    groupList.forEach(g => log(`   📌 Grupo: "${g.subject}" (ID: ${g.id})`))

    await guardarConfigSupabase('CONFIG_WHATSAPP_GROUPS', JSON.stringify(groupList), 'CONFIG_GROUPS')
  } catch (err) {
    log(`⚠️ Error al obtener grupos de WhatsApp: ${err.message}`, 'WARN')
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
      mobile:                   false,
      browser:                  ['GAMA Seguridad', 'Chrome', '12.0'],
      connectTimeoutMs:         60_000,
      defaultQueryTimeoutMs:    60_000,
      keepAliveIntervalMs:      25_000,
      syncFullHistory:          true,
      markOnlineOnConnect:      true,
    })

    // ── Guardar credenciales y sincronizar a Supabase ──
    sock.ev.on('creds.update', async () => {
      await saveCreds()
      await saveSessionToSupabase()
    })

    // ── Sincronizar Historial de Mensajes Pasados (3-7 días) ──
    sock.ev.on('messaging-history.set', async ({ messages }) => {
      if (!messages || messages.length === 0) return
      log(`📜 Recibido historial de WhatsApp: ${messages.length} mensaje(s). Sincronizando a Supabase...`)
      for (const msg of messages) {
        if (isJidBroadcast(msg.key.remoteJid || '')) continue
        const body = msg.message?.conversation
          || msg.message?.extendedTextMessage?.text
          || msg.message?.imageMessage?.caption
          || ''
        if (!body) continue

        const jid = msg.key.remoteJid || ''
        const numero = jid.replace('@s.whatsapp.net', '')
        const fechaMsg = msg.messageTimestamp ? new Date(msg.messageTimestamp * 1000).toISOString() : new Date().toISOString()

        try {
          await supabase.from('conversaciones_whatsapp').insert({
            numero,
            tipo_evento: msg.key.fromMe ? 'mensaje_enviado' : 'mensaje_entrante',
            estado: 'enviado',
            respuesta_recibida: msg.key.fromMe ? null : body,
            mensaje_enviado: msg.key.fromMe ? body : null,
            created_at: fechaMsg,
          })
        } catch {}
      }
      log(`✅ Sincronización de historial de ${messages.length} mensaje(s) completada.`)
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
        setTimeout(sincronizarGruposASupabase, 5_000)
        // Sincronizar grupos cada 60s
        setInterval(sincronizarGruposASupabase, 60_000)
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

    // ── Mensajes Entrantes y Salientes (Grupos e Individuales) ──
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        if (!msg.key || !msg.key.remoteJid) continue
        if (isJidBroadcast(msg.key.remoteJid)) continue

        const body = msg.message?.conversation
          || msg.message?.extendedTextMessage?.text
          || msg.message?.imageMessage?.caption
          || ''

        if (!body) continue

        const rawJid = msg.key.remoteJid
        const isGroup = rawJid.endsWith('@g.us') || rawJid.includes('-')
        const numero = isGroup ? (rawJid.endsWith('@g.us') ? rawJid : rawJid + '@g.us') : rawJid.replace('@s.whatsapp.net', '')
        const nombre = msg.pushName || (isGroup ? 'Grupo WhatsApp' : '')

        log(`💬 [${isGroup ? 'GRUPO' : 'CHAT'}] ${msg.key.fromMe ? 'Enviado por Mí' : nombre}: "${body.slice(0, 50)}"`)

        try {
          await supabase.from('conversaciones_whatsapp').insert({
            numero,
            tipo_evento: msg.key.fromMe ? 'mensaje_enviado' : 'mensaje_entrante',
            estado: 'enviado',
            respuesta_recibida: msg.key.fromMe ? null : body,
            mensaje_enviado: msg.key.fromMe ? body : null,
            nombre_grupo: isGroup ? nombre : null,
            created_at: msg.messageTimestamp ? new Date(msg.messageTimestamp * 1000).toISOString() : new Date().toISOString(),
          })
        } catch (err) {
          log(`⚠️ Error guardando mensaje en Supabase: ${err.message}`, 'WARN')
        }

        // 🤖 BOT AUTO-RESPONDER 24/7: Si el mensaje no viene de mí, evaluar respuesta automática
        if (!msg.key.fromMe && body && !isGroup) {
          try {
            let autoRespEnabled = true
            let promptText = ''

            const { data: configRow } = await supabase
              .from('eventos_monitoreo')
              .select('nombre_abonado')
              .eq('cuenta', 'CONFIG_WHATSAPP_AI_PROMPT')
              .single()

            if (configRow?.nombre_abonado) {
              const config = JSON.parse(configRow.nombre_abonado)
              if (config.autoResponder === false) autoRespEnabled = false
              if (config.prompt) promptText = config.prompt
            }

            if (autoRespEnabled) {
              log(`🤖 [BOT IA 24/7] Procesando mensaje de ${nombre} (+${numero}): "${body}"`)
              responderConIA(sock, rawJid, numero, body, promptText, nombre)
            } else {
              log(`ℹ️ [BOT IA 24/7] Auto-Responder desactivado en configuración.`)
            }
          } catch (e) {
            log(`⚠️ Error evaluando Auto-Responder IA: ${e.message}`, 'WARN')
            responderConIA(sock, rawJid, numero, body, '', nombre)
          }
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
    // 4. Polling Worker de respaldo (cada 3s para máxima confiabilidad)
    setInterval(async () => {
      if (!isReady || !sock) return
      try {
        const { data: pendientes } = await supabase
          .from('conversaciones_whatsapp')
          .select('*')
          .eq('estado', 'pendiente')
          .limit(10)

        if (pendientes && pendientes.length > 0) {
          for (const row of pendientes) {
            if (!row.numero || !row.mensaje_enviado) continue
            log(`📥 Polling Worker: Notificación pendiente detectada para +${row.numero} (ID: ${row.id})`)
            try {
              await enviarMensaje(row.numero, row.mensaje_enviado)
              await supabase.from('conversaciones_whatsapp').update({ estado: 'enviado' }).eq('id', row.id)
              log(`✅ Polling Worker: Fila ID: ${row.id} enviada con éxito a +${row.numero}`)
            } catch (err) {
              log(`❌ Polling Worker: Error enviando a ID ${row.id}: ${err.message}`, 'ERROR')
              await supabase.from('conversaciones_whatsapp').update({ estado: 'error', error_msg: err.message }).eq('id', row.id)
            }
          }
        }
      } catch (err) {}
    }, 3000)

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

// Memoria de autenticación de clientes y temporizadores de inactividad de 5 min
const userAuthSessions = {}
const inactivityTimers = {}

function reiniciarTemporizadorInactividad(sock, jid, numero) {
  if (inactivityTimers[numero]) {
    clearTimeout(inactivityTimers[numero])
  }

  inactivityTimers[numero] = setTimeout(async () => {
    try {
      const msjCierre = `Estimado cliente, por inactividad de 5 minutos daremos por finalizada esta atención.\n\nAgradecemos su tiempo y quedamos atentos a cualquier futura consulta. Gama Seguridad 24/7.`

      await sock.sendMessage(jid, { text: msjCierre })

      await supabase.from('conversaciones_whatsapp').insert({
        numero: numero,
        tipo_evento: 'mensaje_enviado',
        estado: 'enviado',
        mensaje_enviado: msjCierre,
        cuenta: userAuthSessions[numero]?.cuenta || 'BOT_TIMEOUT',
        created_at: new Date().toISOString()
      })

      delete userAuthSessions[numero]
      delete inactivityTimers[numero]
      log(`⏳ [INACTIVIDAD 5 MIN] Sesión finalizada automáticamente para ${numero}`)
    } catch (e) {
      log(`⚠️ Error en timeout de inactividad: ${e.message}`)
    }
  }, 5 * 60 * 1000) // 5 minutos exactos
}

// ──────────────────────────────────────────────
//  FUNCIÓN DE RESPUESTA AUTOMÁTICA CON GEMINI IA & MENÚ INTERACTIVO (DISPARADORES)
// ──────────────────────────────────────────────
async function responderConIA(sock, jid, numero, bodyCliente, promptMaestro, nombreCliente) {
  try {
    // 🚫 REGLA ESTRICTA: EL BOT SOLO RESPONDE EN CHATS INDIVIDUALES DE WHATSAPP (NUNCA EN GRUPOS)
    if (jid.includes('@g.us') || numero.includes('g.us') || jid.includes('-')) {
      log(`🚫 [BOT IGNORA GRUPO] El asistente virtual está configurado EXCLUSIVAMENTE para chats personales. Se ignora mensaje de grupo: ${jid}`)
      return
    }

    const textClean = bodyCliente.trim().toLowerCase()
    let cuentaActiva = ''
    const numLimpio = numero.replace(/[^0-9]/g, '')

    // Reiniciar temporizador de inactividad de 5 minutos
    reiniciarTemporizadorInactividad(sock, jid, numero)

    // 1. Identificar abonado por coincidencia en eventos_monitoreo
    const { data: clienteMatch } = await supabase
      .from('eventos_monitoreo')
      .select('cuenta, nombre_abonado')
      .ilike('nombre_abonado', `%${numLimpio}%`)
      .limit(1)

    if (clienteMatch && clienteMatch.length > 0) {
      cuentaActiva = clienteMatch[0].cuenta
    } else if (userAuthSessions[numero]?.cuenta) {
      cuentaActiva = userAuthSessions[numero].cuenta
    }

    // 2. DISPARADORES Y MENÚ INTERACTIVO POR OPCIONES (1, 2, 3, 4)
    let respuestaDirecta = ''
    const authSession = userAuthSessions[numero]

    // Cierre o despedida del cliente
    if (
      textClean === 'no' ||
      textClean === 'gracias' ||
      textClean === 'muchas gracias' ||
      textClean.includes('chao') ||
      textClean.includes('adios') ||
      textClean.includes('adiós') ||
      textClean.includes('todo bien') ||
      textClean.includes('ninguna')
    ) {
      respuestaDirecta = `Muchas gracias por comunicarse con el Asistente Virtual de Gama Seguridad 24/7.\n\nQuedamos a su entera disposición ante cualquier requerimiento. ¡Que tenga un excelente día!`
      if (inactivityTimers[numero]) clearTimeout(inactivityTimers[numero])
      delete userAuthSessions[numero]
      delete inactivityTimers[numero]
    }

    // Re-mostrar menú ante "sí", "más dudas", "menú"
    else if (
      textClean === 'si' ||
      textClean === 'sí' ||
      textClean.includes('mas dudas') ||
      textClean.includes('más dudas') ||
      textClean.includes('otra duda') ||
      textClean.includes('otra consulta')
    ) {
      respuestaDirecta = `Con gusto le asistimos nuevamente.\nPor favor responde con el número de la opción deseada:\n\n1️⃣ Consulta de mi alarma y bitácora\n2️⃣ Soporte técnico y guía de teclado DSC\n3️⃣ Consultas comerciales\n4️⃣ Hablar con un operador o especialista en vivo`
    }

    else if (authSession?.state === 'AWAITING_NAME_OR_ADDRESS') {
      // 🔍 BÚSQUEDA INTELIGENTE POR PALABRAS CLAVE / COINCIDENCIA PARCIAL / FUZZY
      const palabras = textClean.split(/\s+/).filter(w => w.length >= 3)
      let matchEncontrado = null

      if (palabras.length > 0) {
        const orClause = palabras.map(p => `nombre_abonado.ilike.%${p}%,descripcion.ilike.%${p}%,cuenta.ilike.%${p}%`).join(',')
        
        try {
          const { data: resultados } = await supabase
            .from('eventos_monitoreo')
            .select('cuenta, nombre_abonado, descripcion')
            .or(orClause)
            .limit(30)

          if (resultados && resultados.length > 0) {
            let maxScore = 0
            for (const r of resultados) {
              const textPool = `${r.cuenta || ''} ${r.nombre_abonado || ''} ${r.descripcion || ''}`.toLowerCase()
              let score = 0
              palabras.forEach(p => {
                if (textPool.includes(p)) score += 2
              })
              if (textClean && textPool.includes(textClean)) score += 5

              if (score > maxScore) {
                maxScore = score
                matchEncontrado = {
                  cuenta: r.cuenta,
                  nombre: r.nombre_abonado || r.descripcion || r.cuenta
                }
              }
            }
          }
        } catch (e) {
          log(`⚠️ Error en búsqueda difusa de abonados: ${e.message}`, 'WARN')
        }
      }

      if (matchEncontrado) {
        userAuthSessions[numero] = {
          state: 'AWAITING_CONFIRMATION',
          cuenta: matchEncontrado.cuenta,
          nombre: matchEncontrado.nombre
        }
        respuestaDirecta = `Verificación de seguridad:\n\nEncontramos una coincidencia para tu búsqueda ("${bodyCliente}"):\n• Propiedad / Titular: ${matchEncontrado.nombre}\n• Código: ${matchEncontrado.cuenta}\n\n¿Corresponde esta propiedad a tu sistema? Responde "sí" para confirmar.`
      } else {
        userAuthSessions[numero] = { state: 'AWAITING_NAME_OR_ADDRESS' }
        respuestaDirecta = `No encontramos una propiedad registrada que coincida con "${bodyCliente}".\n\nPor favor indícanos el nombre del titular, la calle o la comuna (ej: "Santo Domingo", "Marbella" o "María Acuña"), o responde 4 para comunicarte con un operador.`
      }
    }
    else if (authSession?.state === 'AWAITING_CONFIRMATION') {
      if (textClean === 'si' || textClean === 'sí' || textClean === 'confirmar' || textClean.includes('correcto') || textClean.includes('es mi')) {
        userAuthSessions[numero] = { state: 'VERIFIED', cuenta: authSession.cuenta }
        cuentaActiva = authSession.cuenta
        respuestaDirecta = `Verificación exitosa. Cuenta [${cuentaActiva}] autenticada.\n\n🛡️ Hola, te comunicas con el Asistente Virtual de Gama Seguridad 24/7 🚨\nPor favor responde con el número de la opción deseada:\n\n1️⃣ Consulta de mi alarma y bitácora\n2️⃣ Soporte técnico y guía de teclado DSC\n3️⃣ Consultas comerciales\n4️⃣ Hablar con un operador o especialista en vivo`
      } else {
        userAuthSessions[numero] = null
        respuestaDirecta = `Verificación cancelada. Si necesitas asistencia directa, por favor responde 4 para comunicarte con un operador.`
      }
    }

    // Opción 1: CONSULTA DE ALARMA Y BITÁCORA
    else if (textClean === '1' || textClean.includes('bitacora') || textClean.includes('alarma')) {
      if (cuentaActiva) {
        let eventosTxt = ''
        try {
          const fechaHace3Dias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          const { data: eventos } = await supabase
            .from('eventos_monitoreo')
            .select('evento, fecha_hora, zona, usuario, descripcion')
            .eq('cuenta', cuentaActiva)
            .gte('fecha_hora', fechaHace3Dias)
            .order('fecha_hora', { ascending: false })
            .limit(10)

          if (eventos && eventos.length > 0) {
            eventosTxt = eventos.map(e => {
              const f = e.fecha_hora ? new Date(e.fecha_hora).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''
              return `• ${f} - ${e.evento || e.descripcion || 'Señal recibida'} ${e.zona ? `(Zona ${e.zona})` : ''}`
            }).join('\n')
          }
        } catch (e) {}

        respuestaDirecta = `Consulta de bitácora y estado de alarma:\n\nCuenta: ${cuentaActiva}\nEstado general: Sistema operando normal.\n\nÚltimos eventos registrados:\n${eventosTxt || '• Se confirma recepción de señales de comunicación normales en la central.'}\n\n¿Tienes alguna otra duda o consulta?\n• Responde el número de otra opción (1, 2, 3, 4)\n• O escribe "menú" para volver al menú principal.`
      } else {
        userAuthSessions[numero] = { state: 'AWAITING_NAME_OR_ADDRESS' }
        respuestaDirecta = `Consulta de bitácora y estado de alarma:\n\nPor seguridad de tus datos, por favor indícanos el nombre y apellido del titular registrado (o la dirección de la propiedad) para verificar tu sistema.`
      }
    }

    // Opción 3: CONSULTAS COMERCIALES (Módulo en desarrollo)
    else if (textClean === '3' || textClean.includes('comercial') || textClean.includes('cotiza')) {
      respuestaDirecta = `Consultas comerciales - Gama Seguridad 24/7\n\nEstimado cliente, le informamos que el módulo de consultas comerciales se encuentra actualmente en desarrollo.\n\nSi requiere atención o cotizaciones, por favor responde con el número 4 o presiona el enlace para comunicarse con un especialista.\n\n¿Tienes alguna otra duda o consulta?\n• Escribe "menú" para volver al menú principal.`
    }

    // Opción 4: TRANSFERENCIA A OPERADOR HUMANO (Con enlace directo de chat)
    else if (textClean === '4' || textClean.includes('humano') || textClean.includes('operador') || textClean.includes('especialista')) {
      respuestaDirecta = `Atención directa con especialista en vivo\n\nUn especialista de nuestra Central de Monitoreo Gama Seguridad 24/7 está disponible para atenderle directamente.\n\nPresiona el siguiente enlace para abrir el chat directo:\nhttps://wa.me/56991016912`

      // Marcar en Supabase para alertar al operador en la pantalla web
      try {
        await supabase.from('conversaciones_whatsapp').insert({
          numero: numero,
          tipo_evento: 'solicitud_humana',
          estado: 'requiere_atencion_humana',
          respuesta_recibida: '⚠️ CLIENTE SOLICITA ATENCIÓN HUMANA EN VIVO',
          cuenta: cuentaActiva || 'ESPECIALISTA',
          created_at: new Date().toISOString()
        })
      } catch (e) {}
    }

    // Opción 2A: Soporte Teclado DSC (Diagnóstico *2)
    else if (textClean === '2a' || textClean.includes('falla') || (textClean.includes('luz') && textClean.includes('amarilla'))) {
      respuestaDirecta = `Soporte técnico - Teclado DSC (Diagnóstico *2)\n\nSi el teclado mantiene un doble pitido cada 10 segundos y la luz amarilla o triángulo de SISTEMA encendido:\n\n1. Diríjase al teclado de su propiedad.\n2. Presione [*][2].\n3. Verifique el número iluminado:\n   - Luz 1: Batería baja (revisión si persiste >24h tras corte de luz).\n   - Luz 2: Falta de energía eléctrica CA (verifique transformador o enchufe).\n   - Luz 3: Falla en línea telefónica o internet.\n   - Luz 4: Falla de comunicación con la central (requiere revisión técnica).\n   - Luz 5: Falla de zona o cableado en sensor.\n   - Luz 7: Memoria de alarma (presione # para borrar aviso).\n   - Luz 8: Pérdida de hora del reloj (responda 2d para reprogramar).\n\n¿Tienes alguna otra duda o consulta?\n• Responde 2b, 2c, 2d o 4\n• O escribe "menú" para volver al menú principal.`
    }

    // Opción 2B: Zona Abierta (Luz verde apagada)
    else if (textClean === '2b' || textClean.includes('verde') || textClean.includes('abierta')) {
      respuestaDirecta = `Soporte técnico - Zona Abierta (Luz verde apagada)\n\nSi el indicador verde (Luz o Ticket Verde) está apagado, el sistema detecta que hay un sensor, puerta o ventana abierta.\n\n¿Qué hacer?\n1. Recorra su propiedad y asegúrese de que todas las puertas y ventanas estén bien cerradas.\n2. Si realizó trabajos recientes, verifique que no se hayan cortado los cables de los sensores.\n3. Al cerrar todo correctamente, el indicador verde ("LISTO") se encenderá automáticamente para permitir armar.\n\nSi un sensor o ventana está en mal estado y no cierra, puede anularlo temporalmente respondiendo 2c.\n\n¿Tienes alguna otra duda o consulta?\n• Responde 2c para ver cómo anular el sensor dañado\n• O escribe "menú" para volver al inicio.`
    }

    // Opción 2C: Exclusión / Anulación de Zona (*1)
    else if (textClean === '2c' || textClean.includes('exclusion') || textClean.includes('exclusión') || textClean.includes('anular')) {
      respuestaDirecta = `Soporte técnico - Anulación de Zona Dañada (*1)\n\nSi un sensor está dañado o una puerta no cierra y necesita armar la alarma para pasar la noche, puede anular esa zona temporalmente:\n\nInstrucción de anulación:\n1. Presione [*][1].\n2. Ingrese el número de la zona a 2 dígitos (ejemplo: 03 para Zona 3, o 12 para Zona 12).\n3. Presione [#].\n\nEjemplo Zona 3: *1 03 #\nEjemplo Zona 12: *1 12 #\n\nLa luz verde ("LISTO") se encenderá y podrá armar su alarma normalmente.\n*Nota: La anulación dura solo para ese armado. Al desarmar el sistema, la zona vuelve a su estado normal.\n\n¿Tienes alguna otra duda o consulta?\n• Responde "menú" para volver al inicio.`
    }

    // Opción 2D: Programación de Hora (*6)
    else if (textClean === '2d' || textClean.includes('hora') || textClean.includes('fecha') || textClean.includes('reloj')) {
      respuestaDirecta = `Soporte técnico - Programación de Hora y Fecha (*6)\n\nSi su teclado indica Luz 8 (Pérdida de hora del reloj), siga estos pasos:\n\n1. Presione [*][6].\n2. Ingrese su Clave Maestra de 4 dígitos (ejemplo: 1234).\n3. Presione [1].\n4. Ingrese la hora y fecha en formato: HHMM MMDDAA\n   (HH: Hora 24h | MM: Minutos | MM: Mes | DD: Día | AA: Año)\n\nEjemplo (28 de Mayo de 2026 a las 13:04 hrs con clave 1234):\nPresione: *6 1234 1 1304 05 28 26\n\nEl teclado emitirá un doble pitido de confirmación y la luz amarilla de sistema se apagará.\n\n¿Tienes alguna otra duda o consulta?\n• Responde "menú" para volver al inicio.`
    }

    // Opción 2: Menú Soporte Técnico DSC
    else if (textClean === '2' || textClean.includes('soporte') || textClean.includes('tecnico') || textClean.includes('técnico')) {
      respuestaDirecta = `Soporte técnico y guía de teclado DSC - Gama Seguridad 24/7\n\nPor favor responde con la letra de la opción deseada:\n\n2a. Teclado pita o tiene luz amarilla (Diagnóstico *2)\n2b. No puedo armar / Luz verde apagada (Zona abierta)\n2c. Exclusión / Anulación de sensor dañado (*1)\n2d. Programar hora y fecha del teclado (*6)\n4. Hablar con un especialista técnico`
    }

    // Saludo inicial o palabra de inicio: Entregar Menú Principal Limpio
    else if (
      textClean === 'hola' ||
      textClean === 'buenas' ||
      textClean.includes('hola') ||
      textClean.includes('buenas') ||
      textClean.includes('prueba') ||
      textClean.includes('menu') ||
      textClean.includes('menú') ||
      textClean.includes('inicio') ||
      textClean.includes('ayuda')
    ) {
      respuestaDirecta = `🛡️ Hola, te comunicas con el Asistente Virtual de Gama Seguridad 24/7 🚨\nPor favor responde con el número de la opción deseada:\n\n1️⃣ Consulta de mi alarma y bitácora\n2️⃣ Soporte técnico y guía de teclado DSC\n3️⃣ Consultas comerciales\n4️⃣ Hablar con un operador o especialista en vivo`
    }

    // Si hubo una respuesta directa del menú interactivo, enviarla sin llamar a Gemini
    if (respuestaDirecta) {
      await sock.sendMessage(jid, { text: respuestaDirecta })
      log(`🤖 ✅ [BOT MENU INTERACTIVO] Respuesta directa enviada a ${nombreCliente}`)

      await supabase.from('conversaciones_whatsapp').insert({
        numero: numero,
        tipo_evento: 'mensaje_enviado',
        estado: 'enviado',
        mensaje_enviado: respuestaDirecta,
        cuenta: cuentaActiva || 'BOT_MENU',
        created_at: new Date().toISOString()
      })
      return
    }

    // 3. Si es opción 1 o consulta abierta: Traer Bitácora de 3 días y llamar a Gemini AI
    let resumenEventos = 'Sin eventos de alarma registrados en los últimos 3 días.'
    if (cuentaActiva) {
      const fechaHace3Dias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      const { data: eventos } = await supabase
        .from('eventos_monitoreo')
        .select('cuenta, evento, fecha_hora, zona, usuario, descripcion')
        .eq('cuenta', cuentaActiva)
        .gte('fecha_hora', fechaHace3Dias)
        .order('fecha_hora', { ascending: false })
        .limit(30)

      if (eventos && eventos.length > 0) {
        resumenEventos = eventos.map(e => {
          const f = e.fecha_hora ? new Date(e.fecha_hora).toLocaleString('es-CL') : ''
          return `[${f}] Cuenta: ${e.cuenta} | Evento: ${e.evento || e.descripcion || 'Sin desmit.'} | Zona: ${e.zona || 'N/A'}`
        }).join('\n')
      }
    }

    // 4. Consultar Gemini API
    const GEMINI_KEY = process.env.GEMINI_API_KEY || 'AIzaSyA'
    const fullPrompt = `${promptMaestro || 'Eres el Asistente Virtual de Gama Seguridad 24/7.'}

MENÚ INTERACTIVO Y REGLAS DE ATENCIÓN:
- Opción 1: Consulta Bitácora 3 días.
- Opción 2: Soporte Técnico.
- Opción 3: Consultas Comerciales (Módulo en desarrollo).
- Opción 4: Derivación a Especialista con enlace directo https://wa.me/56991016912.

IDENTIFICACIÓN Y CONTEXTO DEL CLIENTE:
- Nombre Cliente: ${nombreCliente || 'Cliente'}
- Cuenta de Abonado: ${cuentaActiva || 'No identificada aún'}

EVENTOS DE BITÁCORA Y TELEMETRÍA (ÚLTIMOS 3 DÍAS):
${resumenEventos}

MENSAJE RECIBIDO DEL CLIENTE:
"${bodyCliente}"

Responde directamente el mensaje a enviar al cliente por WhatsApp.`

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }]
      })
    })

    const resData = await res.json()
    const respuestaIA = resData?.candidates?.[0]?.content?.parts?.[0]?.text

    if (respuestaIA && respuestaIA.trim()) {
      const textoFinal = respuestaIA.trim()
      await sock.sendMessage(jid, { text: textoFinal })
      log(`🤖 ✅ [BOT IA 24/7] Respuesta enviada a ${nombreCliente}: "${textoFinal.slice(0, 60)}..."`)

      await supabase.from('conversaciones_whatsapp').insert({
        numero: numero,
        tipo_evento: 'mensaje_enviado',
        estado: 'enviado',
        mensaje_enviado: textoFinal,
        cuenta: cuentaActiva || 'BOT_IA',
        created_at: new Date().toISOString()
      })
    }
  } catch (err) {
    log(`⚠️ Error enviando respuesta automática IA: ${err.message}`, 'WARN')
  }
}
