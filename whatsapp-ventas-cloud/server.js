/**
 * ═══════════════════════════════════════════════════════════════════════
 *  GAMA SEGURIDAD - BOT DE WHATSAPP VENTAS EN LA NUBE (24/7) v5.2
 *  - Compatible con Render.com, Koyeb, Railway, VPS
 *  - Motor: Baileys 7.x
 *  - Diagnóstico en vivo: /logs y /status con métricas en tiempo real
 *  - Fix Crítico: Auto-silenciamiento (fromMe) resuelto con registro de IDs
 *  - Fix Crítico: UUID válido para Supabase (numeroAUUID)
 *  - Fix Crítico: Reset de Takeover automático ante cualquier saludo
 *  - Inteligencia Comercial: Pack Vetti Smart, Monitoreo 0,9 UF + IVA
 *  - Envío automático de Ficha Técnica PDF oficial
 *  - Cotizador Dinámico Interactivo (accesos / sensores)
 *  - Agendador de Evaluación Técnica en Terreno $0
 *  - Alertas VIP inmediatas al celular del dueño (56991016912)
 *  - Memoria con Timeout de 10 min y reseteo por comando
 * ═══════════════════════════════════════════════════════════════════════
 */

const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const https = require('https')
const crypto = require('crypto')
const QRCode = require('qrcode')

const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  isJidBroadcast,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  Browsers,
} = require('@whiskeysockets/baileys')

const pino = require('pino')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const { createClient } = require('@supabase/supabase-js')

// ──────────────────────────────────────────────
//  CONFIGURACIÓN Y VARIABLES DE ENTORNO
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000
const SESSION_DIR = process.env.SESSION_DIR || path.join(__dirname, '.session-cloud')
const OWNER_PHONE = process.env.OWNER_PHONE || '56991016912' // Teléfono donde llegan alertas VIP
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || 'https://gama-ventas-bot.onrender.com'
const ASSETS_DIR = path.join(__dirname, 'assets')
const PDF_FICHA_ALARMAS = path.join(ASSETS_DIR, 'Ficha_Tecnica_GAMA_Vetti_Smart.pdf')
const PDF_FICHA_CAMARAS = path.join(ASSETS_DIR, 'Ficha_Tecnica_GAMA_Camaras_4K.pdf')

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true })
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true })

// ──────────────────────────────────────────────
//  BUFFER DE LOGS EN VIVO (HORA CHILE CONTINENTAL)
// ──────────────────────────────────────────────
const logBuffer = []
function log(msg, nivel = 'INFO') {
  const ts = new Date().toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour12: false })
  const line = `[${ts} CL] [CLOUD-BOT-${nivel}] ${msg}`
  console.log(line)
  logBuffer.push(line)
  if (logBuffer.length > 300) logBuffer.shift()
}

// Generador de UUID v4 determinista para cumplir con el esquema de Supabase
function numeroAUUID(numero) {
  const hash = crypto.createHash('md5').update(`wa-${numero}`).digest('hex')
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`
}

// Extractor robusto de texto desde cualquier tipo de mensaje de WhatsApp
function extraerTextoMensaje(msg) {
  if (!msg || !msg.message) return ''
  const m = msg.message
  const inner = m.ephemeralMessage?.message
    || m.viewOnceMessage?.message
    || m.viewOnceMessageV2?.message
    || m.documentWithCaptionMessage?.message
    || m.editedMessage?.message?.protocolMessage?.editedMessage
    || m

  return (
    inner.conversation
    || inner.extendedTextMessage?.text
    || inner.imageMessage?.caption
    || inner.videoMessage?.caption
    || inner.documentMessage?.caption
    || inner.buttonsResponseMessage?.selectedButtonId
    || inner.listResponseMessage?.singleSelectReply?.selectedRowId
    || inner.templateButtonReplyMessage?.selectedId
    || ''
  ).trim()
}

// ──────────────────────────────────────────────
//  VERIFICACIÓN DE FICHAS TÉCNICAS PDF OFICIALES
// ──────────────────────────────────────────────
function verificarFichasPDF() {
  if (fs.existsSync(PDF_FICHA_ALARMAS)) {
    const size = fs.statSync(PDF_FICHA_ALARMAS).size
    log(`[PDF] Ficha Vetti Smart lista: ${PDF_FICHA_ALARMAS} (${size} bytes)`)
  } else {
    log(`[PDF] AVISO: Ficha Vetti Smart no encontrada en ${PDF_FICHA_ALARMAS}`, 'WARN')
  }

  if (fs.existsSync(PDF_FICHA_CAMARAS)) {
    const size = fs.statSync(PDF_FICHA_CAMARAS).size
    log(`[PDF] Ficha Cámaras 4K lista: ${PDF_FICHA_CAMARAS} (${size} bytes)`)
  } else {
    log(`[PDF] AVISO: Ficha Cámaras 4K no encontrada en ${PDF_FICHA_CAMARAS}`, 'WARN')
  }
}
verificarFichasPDF()

// ──────────────────────────────────────────────
//  ESTADO EN MEMORIA Y TIMEOUT DE 10 MINUTOS
// ──────────────────────────────────────────────
const humanTakeover = new Map()     // telefono -> timestamp
const processedMessages = new Map() // id -> timestamp
const leadMemory = new Map()        // telefono -> datos del lead
const botSentMessageIds = new Set() // IDs de mensajes despachados por el bot (evita auto-takeover)
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutos

let genAI = null
if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    log('[IA] Gemini configurado y activo.')
  } catch (e) {
    log('Error inicializando Gemini: ' + e.message, 'WARN')
  }
}

const COMUNAS_CHILE = [
  // Región Metropolitana (Gran Santiago y Provincias)
  'santiago', 'las condes', 'providencia', 'vitacura', 'la reina', 'lo barnechea',
  'ñuñoa', 'nunoa', 'la florida', 'maipu', 'maipú', 'puente alto', 'san miguel', 'macul',
  'peñalolen', 'peñalolén', 'penalolen', 'quilicura', 'pudahuel', 'colina', 'chicureo', 'lampa',
  'san bernardo', 'buin', 'paine', 'melipilla', 'talagante', 'penaflor', 'peñaflor', 'padre hurtado',
  'el monte', 'isla de maipo', 'curacavi', 'curacaví', 'maria pinto', 'maría pinto', 'san pedro',
  'alhue', 'alhué', 'pirque', 'san jose de maipo', 'san josé de maipo', 'cerrillos', 'cerro navia',
  'conchali', 'conchalí', 'el bosque', 'estacion central', 'estación central', 'huechuraba',
  'independencia', 'la cisterna', 'la granja', 'la pintana', 'lo espejo', 'lo prado', 'pedro aguirre cerda',
  'quinta normal', 'recoleta', 'renca', 'san joaquin', 'san joaquín', 'san ramon', 'san ramón',
  'til til', 'tiltil', 'batuco', 'valle grande', 'chamisero',
  // Región de Valparaíso (Costa, Marga Marga, Quillota, Aconcagua)
  'viña', 'viña del mar', 'vina del mar', 'valparaiso', 'valparaíso', 'concon', 'concón',
  'quilpue', 'quilpué', 'villa alemana', 'limache', 'quillota', 'san antonio', 'la calera',
  'la cruz', 'nogales', 'hijuelas', 'la ligua', 'cabildo', 'zapallar', 'papudo', 'petorca',
  'casablanca', 'cartagena', 'el tabo', 'el quisco', 'algarrobo', 'santo domingo',
  'san felipe', 'los andes', 'catemu', 'llaillay', 'llay llay', 'panquehue', 'putaendo', 'santa maria',
  'santa maría', 'calle larga', 'rinconada', 'san esteban', 'olmue', 'olmué',
  // Región de O'Higgins
  'rancagua', 'machali', 'machalí', 'graneros', 'rengo', 'san vicente', 'san fernando', 'requinoa', 'requínoa'
]

function extraerComunaValida(texto) {
  if (!texto) return null
  const lower = texto.toLowerCase().trim()

  const descartes = [
    'cuentame', 'cuéntame', 'servicio', 'precio', 'costo', 'valor', 'cuanto', 'cuánto',
    'hola', 'gracias', 'buenas', 'informacion', 'información', 'detalle', 'detalles',
    'alarma', 'alarmas', 'camara', 'cámara', 'camaras', 'cámaras', 'cctv', 'empresa',
    'casa', 'parcela', 'departamento', 'depto', 'local', 'negocio', 'asesor', 'ejecutivo',
    'visita', 'horario', 'mañana', 'tarde', 'sabado', 'sábado', 'luz', 'mascota', 'perro', 'gato',
    'verisure', 'adt', 'prosegur', 'comodato', 'quiero', 'necesito', 'sobre', 'sobre el', 'bueno'
  ]

  // Buscar coincidencia con la lista oficial de comunas
  for (const c of COMUNAS_CHILE) {
    const regex = new RegExp(`(^|\\b|en\\s+|comuna\\s+de\\s+)${c}(\\b|$)`, 'i')
    if (regex.test(lower)) {
      return capitalizar(c)
    }
  }

  // Si dice explícitamente "vivo en X" o "en la comuna de X"
  const m = texto.match(/(?:vivo en|en la comuna de|comuna de)\s+([a-záéíóúñ\s]{3,25})/i)
  if (m && m[1]) {
    const candidata = m[1].trim().toLowerCase()
    if (!descartes.some(d => candidata.includes(d))) {
      return capitalizar(candidata)
    }
  }

  return null
}

// ──────────────────────────────────────────────
//  ENVÍO SEGURO DE MENSAJES (REGISTRA ID PROPIO)
// ──────────────────────────────────────────────
async function enviarMensajeBot(destJid, content, options = {}) {
  if (!sock) {
    log('Imposible enviar mensaje: Socket Baileys no conectado', 'ERROR')
    return null
  }
  try {
    const res = await sock.sendMessage(destJid, content, options)
    if (res?.key?.id) {
      botSentMessageIds.add(res.key.id)
      setTimeout(() => botSentMessageIds.delete(res.key.id), 5 * 60 * 1000)
    }
    return res
  } catch (err) {
    log(`[ERROR ENVIO BOT] a ${destJid}: ${err.message}`, 'ERROR')
    throw err
  }
}

// ──────────────────────────────────────────────
//  CONSULTA INTELIGENTE GEMINI (CON TIMEOUT)
// ──────────────────────────────────────────────
async function consultarGeminiOpcional(textoUsuario, lead) {
  if (!genAI) return null
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const prompt = `Eres Tomás, asesor comercial experto de GAMA Seguridad Chile en WhatsApp.
Tu misión es orientar al cliente con tono profesional, chileno, muy cercano y con emoticones (🛡️, 🏡, 🚨, ✨, 📲, 🤝).
Puntos clave de GAMA:
- Monitoreo 24/7 conectado a Central desde 0,9 UF + IVA mensual (~$35.000 CLP).
- Equipos 100% de propiedad del cliente (sin comodato ni arriendos infinitos de $75.000 como Verisure).
- Pack VETTI Smart inalámbrico con WiFi + 4G anti-corte de energía y App NT CLICK.
- Evaluación técnica en terreno 100% gratuita ($0) en RM y V Región.
- Si ya tiene alarma instalada (ADT, DSC), reprogramamos a costo $0 en sensores.
Cliente: ${lead.nombre || 'Prospecto'}.
Pregunta del cliente: "${textoUsuario}"
Responde en máximo 2 párrafos cortos, usa emoticones y termina preguntando en qué comuna se ubica su propiedad para confirmar cobertura o agendar la evaluación técnica gratuita.`

    const res = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Gemini')), 3500))
    ])
    const reply = res?.response?.text()
    if (reply && reply.trim().length > 15) return reply.trim()
  } catch (e) {
    // Timeout o error en IA: no interrumpe el flujo comercial
  }
  return null
}

// ──────────────────────────────────────────────
//  SISTEMA CONSULTIVO & TOMA DE DATOS
// ──────────────────────────────────────────────
async function procesarMensajeVentas(textoUsuario, numero, nombrePush, sock, remoteJid) {
  const t = textoUsuario.trim()
  const lower = t.toLowerCase()
  const now = Date.now()
  let reinicioPorInactividad = false
  let enviarPDF = false

  // 1. Inicializar o evaluar timeout de inactividad
  if (!leadMemory.has(numero)) {
    leadMemory.set(numero, {
      paso: 'inicio',
      nombre: (nombrePush && nombrePush !== 'Prospecto') ? nombrePush : null,
      comuna: null,
      tipoPropiedad: null,
      interes: 'Pack Vetti Smart',
      horarioVisita: null,
      reactivado: false,
      historial: [],
      lastActivity: now
    })
  } else {
    const leadExistente = leadMemory.get(numero)
    if (leadExistente.lastActivity && (now - leadExistente.lastActivity > INACTIVITY_TIMEOUT_MS)) {
      log(`[MEMORIA] ⏰ Inactividad > 10 min (+${numero}). Reiniciando flujo conversacional.`)
      leadExistente.paso = 'inicio'
      leadExistente.tipoPropiedad = null
      leadExistente.historial = []
      reinicioPorInactividad = true
    }
    leadExistente.lastActivity = now
  }

  const lead = leadMemory.get(numero)

  // 2. Comandos manuales de reinicio o unpause
  if (lower === 'menu' || lower === 'menú' || lower === 'reiniciar' || lower === 'inicio' || lower === 'volver' || lower === 'bot' || lower === 'activar bot') {
    lead.paso = 'inicio'
    lead.tipoPropiedad = null
    lead.historial = []
    reinicioPorInactividad = true
    humanTakeover.delete(numero)
  }

  // 3. Petición explícita de Ficha / Catálogo PDF
  if (lower.includes('ficha') || lower.includes('catalogo') || lower.includes('catálogo') || lower.includes('pdf')) {
    enviarPDF = true
  }

  lead.historial.push({ role: 'user', content: t })
  if (lead.historial.length > 8) lead.historial.shift()

  // 4. Procesamiento del Mensaje
  const resultado = await generarRespuestaLogica(t, lower, lead, numero, reinicioPorInactividad)
  if (resultado.enviarPDF) enviarPDF = true

  lead.historial.push({ role: 'assistant', content: resultado.texto })

  // 5. Despachar PDF si corresponde según el tipo de producto
  if (enviarPDF) {
    const esInteresCamaras = resultado.tipoPDF === 'camaras'
      || lead.interes === 'CCTV 4K'
      || lead.tipoPropiedad === 'Cámaras de Seguridad'
      || lower.includes('camara') || lower.includes('cámara') || lower.includes('cctv')

    const rutaPDF = esInteresCamaras ? PDF_FICHA_CAMARAS : PDF_FICHA_ALARMAS
    const nombreArchivo = esInteresCamaras ? 'Ficha_Tecnica_GAMA_Camaras_4K.pdf' : 'Ficha_Tecnica_GAMA_Vetti_Smart.pdf'
    const captionPDF = esInteresCamaras
      ? '📹 *Ficha Técnica Oficial - Cámaras de Seguridad 4K GAMA*\n\nAquí tienes las especificaciones técnicas completas de nuestros sistemas de videovigilancia Ultra HD con IA, visión nocturna a todo color y monitoreo desde tu celular 📲🛡️.'
      : '📄 *Ficha Comercial Oficial - GAMA Seguridad*\n\nAquí tienes las especificaciones técnicas del Pack VETTI Smart inalámbrico y nuestro plan de monitoreo 24/7 🛡️.'

    if (fs.existsSync(rutaPDF)) {
      setTimeout(async () => {
        await enviarMensajeBot(remoteJid, {
          document: fs.readFileSync(rutaPDF),
          mimetype: 'application/pdf',
          fileName: nombreArchivo,
          caption: captionPDF
        }).catch(e => log('[PDF] Error enviando documento: ' + e.message, 'ERROR'))
      }, 1500)
    } else {
      log(`[PDF] Archivo no encontrado para despacho: ${rutaPDF}`, 'WARN')
    }
  }

  return resultado.texto
}

async function generarRespuestaLogica(texto, lower, lead, numero, reinicioPorInactividad) {
  const nombreSaludo = lead.nombre ? ` ${lead.nombre}` : ''

  // A) Saludo especial si regresa tras más de 10 min de inactividad
  if (reinicioPorInactividad && lead.nombre && !['1', '2', '3', '4', '5'].includes(lower)) {
    lead.paso = 'esperando_opcion'
    return {
      texto: `¡Hola de nuevo ${lead.nombre}! 👋 Qué gusto saludarte otra vez por aquí 🛡️.\n\nPara retomar tu cotización o responder una nueva duda:\n\n¿Qué tipo de protección necesitas? 🏡📹\n\n1️⃣ **Casa o Parcela** 🏡\n2️⃣ **Departamento** 🏢\n3️⃣ **Negocio o Empresa** 🏪\n4️⃣ **Ya tengo alarma (Migración a costo $0)** 🔄\n5️⃣ **Cámaras de Seguridad 4K** 📹\n\n*(Puedes responder con el número 1, 2, 3... o escribirme directamente)*`,
      enviarPDF: false
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  DETECCIÓN DE INTENCIÓN CONSULTIVA (¡NUNCA CONFUNDIR CON COMUNA!)
  // ─────────────────────────────────────────────────────────────
  const esConsultaServicio = lower.includes('servicio') || lower.includes('cuentame') || lower.includes('cuéntame')
    || lower.includes('de que se trata') || lower.includes('de qué se trata') || lower.includes('como funciona') || lower.includes('cómo funciona')
    || lower.includes('que incluye') || lower.includes('qué incluye') || lower.includes('explicame') || lower.includes('explícame')
    || lower.includes('informacion') || lower.includes('información')

  const esConsultaPrecios = lower.includes('precio') || lower.includes('cuanto') || lower.includes('cuánto')
    || lower.includes('valor') || lower.includes('costo') || lower.includes('tarifa') || lower.includes('plan') || lower.includes('cuota')

  const esConsultaLuz = lower.includes('luz') || lower.includes('corte de luz') || lower.includes('bateria') || lower.includes('batería')
  const esConsultaMascotas = lower.includes('perro') || lower.includes('gato') || lower.includes('mascota') || lower.includes('animal')
  const esConsultaVerisure = lower.includes('verisure') || lower.includes('adt') || lower.includes('prosegur') || lower.includes('comodato')
  const esConsultaDemora = lower.includes('demora') || lower.includes('cuanto tardan') || lower.includes('cuando instalan') || lower.includes('plazo')

  // ─────────────────────────────────────────────────────────────
  //  1. PRIORIDAD: EXPLICACIÓN COMPLETA DEL SERVICIO (POTENCIA AL 1000%)
  // ─────────────────────────────────────────────────────────────
  if (esConsultaServicio) {
    const prodContext = lead.tipoPropiedad ? ` para tu **${lead.tipoPropiedad.toLowerCase()}**` : ''
    return {
      texto: `¡Con mucho gusto${nombreSaludo}! Te explico en detalle nuestro servicio de seguridad integral${prodContext} 🛡️✨:\n\nEn **GAMA Seguridad** protegemos tu propiedad con tecnología de punta conectada 24/7 a nuestra Central de Operaciones 🚨:\n\n📦 **¿Qué incluye el sistema?**\n• **Central Inteligente Vetti Hub:** Conexión dual WiFi + enlace celular 4G GSM anti-corte de luz e internet 📶.\n• **Sensores antimascotas PIR:** Detección de intrusión perimetral inmune a mascotas de hasta 25 kg 🐕.\n• **Contactos magnéticos:** Protección instantánea en puertas de acceso y ventanales 🚪.\n• **Sirena disuasiva 110 dB + Controles SOS:** Potencia acústica inmediata y botón de pánico en tu llavero 🚨.\n• **App Móvil NT CLICK:** Controlas, armas/desarmas y recibes alertas en tiempo real en tu celular 📲.\n\n💰 **Valores y condiciones transparentes:**\n• **Equipos 100% TUYOS en propiedad:** Cero arriendos eternos ni comodatos engañosos como en Verisure o ADT 🙌.\n• **Monitoreo Continuo 24/7:** Desde solo **0,9 UF + IVA mensual** (~$35.000 CLP), con verificación humana en menos de 2 minutos y coordinación con Carabineros 🚓.\n• **Instalación profesional bonificada ($0):** Con el plan de monitoreo.\n• **Evaluación técnica en terreno $0:** Sin ningún compromiso en RM y V Región 🤝.\n\n📍 Para verificar factibilidad técnica y cobertura inmediata:\n**¿En qué comuna o sector se ubica tu propiedad?** 🏡🏢`,
      enviarPDF: true,
      tipoPDF: 'alarmas'
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  2. CONSULTAS FRECUENTES (Luz, Mascotas, Verisure, Precios, etc.)
  // ─────────────────────────────────────────────────────────────
  if (esConsultaLuz) {
    return {
      texto: `¡Muy buena pregunta! 💡 Ante un corte de energía eléctrica (sea accidental o intencional), la central de alarma cuenta con **batería de respaldo autónoma** y enlace **4G GSM de emergencia** 📶.\n\nEl sistema sigue 100% activo, sonando ante intrusión y conectado a nuestra Central de Monitoreo 24/7 🛡️.\n\n📍 ¿En qué comuna se encuentra tu propiedad para verificar cobertura? 🏡`,
      enviarPDF: false
    }
  }

  if (esConsultaMascotas) {
    return {
      texto: `¡Totalmente cubierto! 🐕🐈 Nuestros sensores de movimiento incorporan **tecnología PIR inteligente antimascotas** que no se activa con mascotas de hasta 25 kg.\n\nPuedes armar tu alarma con tus regalones adentro sin falsas alarmas ni sobresaltos 🙌.\n\n¿Para qué tipo de propiedad la estás buscando? 🏡\n1️⃣ **Casa o Parcela** 🏡\n2️⃣ **Departamento** 🏢\n3️⃣ **Negocio o Empresa** 🏪`,
      enviarPDF: false
    }
  }

  if (esConsultaVerisure) {
    lead.interes = 'Migración vs Verisure'
    guardarEnSupabase(lead, numero)
    return {
      texto: `¡Es la mejor decisión que puedes tomar! 🙌 A diferencia de Verisure o ADT donde pagas cuotas de $70.000 a $85.000 mensuales y los equipos están en arriendo eterno (comodato engañoso):\n\n✅ **En GAMA los equipos son 100% TUYOS en propiedad** 🛡️.\n✅ Monitoreo profesional 24/7 desde solo **0,9 UF + IVA (~$35.000/mes)** 💰.\n✅ Si ya tienes sensores instalados, los **reprogramamos a costo $0** 🔄.\n\n📍 **¿En qué comuna se ubica tu propiedad para coordinar la evaluación técnica gratuita?**`,
      enviarPDF: false
    }
  }

  if (esConsultaPrecios) {
    return {
      texto: `¡Con total transparencia! 💰 En GAMA Seguridad cuidamos tu bolsillo:\n\n🛡️ **Plan Monitoreo 24/7:** Desde solo **0,9 UF + IVA al mes** (~$35.000 CLP) con conexión directa a Central y coordinación inmediata con Carabineros 🚨.\n🔒 **Equipos en propiedad:** 100% tuyos, sin arriendos eternos ni letras chicas.\n🛠️ **Instalación profesional:** Bonificada ($0) con el plan de monitoreo.\n📋 **Evaluación en terreno:** 100% gratuita ($0) en RM y V Región.\n\nPara darte el valor exacto según lo que necesitas:\n📍 **¿Es para Cámaras de Seguridad 📹 o Sistema de Alarma 🏡? ¿Y en qué comuna?**`,
      enviarPDF: true,
      tipoPDF: lead.tipoPropiedad === 'Cámaras de Seguridad' ? 'camaras' : 'alarmas'
    }
  }

  if (esConsultaDemora) {
    return {
      texto: `¡Instalación súper rápida! ⚡ Tras coordinar la visita técnica, la instalación se realiza generalmente dentro de **24 a 48 horas hábiles**.\n\nNuestros técnicos certificados dejan todo funcionando, configurado y la aplicación móvil activa en aproximadamente 2 a 3 horas 🛠️📲.\n\n📍 ¿En qué comuna se ubica tu propiedad?`,
      enviarPDF: false
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  3. PRIORIDAD: AGENDANDO VISITA TÉCNICA (BLOQUES 1, 2, 3, 4)
  // ─────────────────────────────────────────────────────────────
  if (lead.paso === 'agendando_visita') {
    let bloque = null
    if (lower === '1' || lower.includes('mañana') || lower.includes('manana')) {
      bloque = 'Mañana (10:00 a 13:00 hrs)'
    } else if (lower === '2' || lower.includes('tarde')) {
      bloque = 'Tarde (15:00 a 18:00 hrs)'
    } else if (lower === '3' || lower.includes('sabado') || lower.includes('sábado')) {
      bloque = 'Sábado en la mañana (10:00 a 13:00 hrs)'
    } else if (lower === '4' || lower.includes('especial') || lower.includes('asesor') || lower.includes('coordinar')) {
      bloque = 'Horario especial por coordinar con asesor'
    }

    if (bloque) {
      lead.horarioVisita = bloque
      lead.paso = 'finalizado'
      guardarEnSupabase(lead, numero, 'visita_agendada')
      dispararAlertaVIP(lead, numero)

      const esCamaras = lead.interes === 'CCTV 4K' || lead.tipoPropiedad === 'Cámaras de Seguridad'
      const solTexto = esCamaras ? 'Cámaras de Seguridad 4K Ultra HD 📹' : (lead.tipoPropiedad || 'Alarma con Monitoreo 24/7 🛡️')

      return {
        texto: `¡Excelente, ${lead.nombre || 'estimado/a'}! 🎉 Tu evaluación técnica gratuita ($0) quedó agendada con éxito:\n\n📅 **Bloque horario:** ${bloque}\n📍 **Comuna:** ${lead.comuna || 'Tu domicilio'}\n🛡️ **Solución requerida:** ${solTexto}\n\nUn especialista técnico de terreno se comunicará a la brevedad a este mismo WhatsApp para afinar los detalles de la visita y responder cualquier inquietud técnica. ¡Muchas gracias por confiar en GAMA Seguridad! ✨🤝🚨`,
        enviarPDF: false
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  4. VALIDACIÓN DE COMUNA (ESTRICTA)
  // ─────────────────────────────────────────────────────────────
  const comunaDetectada = extraerComunaValida(texto)

  if (lead.paso === 'pidiendo_comuna') {
    if (comunaDetectada) {
      lead.comuna = comunaDetectada
      guardarEnSupabase(lead, numero)

      const esCamaras = lead.interes === 'CCTV 4K' || lead.tipoPropiedad === 'Cámaras de Seguridad'

      if (lead.nombre && lead.nombre !== 'Prospecto') {
        lead.paso = 'agendando_visita'
        const textoVisita = esCamaras
          ? `¡Excelente! 🚨 En **${lead.comuna}** tenemos cobertura técnica completa y patrullaje de verificación rápida 🛡️.\n\nPara el sistema de Cámaras de Seguridad 4K, realizamos una **Evaluación Técnica en Terreno 100% Gratuita ($0)** sin compromiso para dimensionar la instalación 📹🤝.\n\n${lead.nombre}, ¿qué día y bloque horario te acomoda más? 📅\n\n1️⃣ **Mañana (10:00 a 13:00 hrs)** ☀️\n2️⃣ **Tarde (15:00 a 18:00 hrs)** 🌤️\n3️⃣ **Sábado en la mañana (10:00 a 13:00 hrs)** 🗓️\n4️⃣ **Coordinar un horario especial con un asesor** 🤝\n\n*(Puedes responder con 1, 2, 3 o 4)*`
          : `¡Excelente! 🚨 En **${lead.comuna}** tenemos cobertura técnica completa con patrullaje de verificación rápida 🛡️.\n\nPara revisar los puntos vulnerables en tu propiedad, realizamos una **Evaluación Técnica en Terreno 100% Gratuita ($0)** sin compromiso 🤝.\n\n${lead.nombre}, ¿qué día y bloque horario te acomoda más? 📅\n\n1️⃣ **Mañana (10:00 a 13:00 hrs)** ☀️\n2️⃣ **Tarde (15:00 a 18:00 hrs)** 🌤️\n3️⃣ **Sábado en la mañana (10:00 a 13:00 hrs)** 🗓️\n4️⃣ **Coordinar un horario especial con un asesor** 🤝\n\n*(Puedes responder con 1, 2, 3 o 4)*`

        return { texto: textoVisita, enviarPDF: false }
      } else {
        lead.paso = 'pidiendo_nombre'
        return {
          texto: `¡Excelente! 🚨 En **${lead.comuna}** tenemos cobertura técnica completa con patrullaje de verificación rápida 🛡️.\n\nPara preparar tu ficha técnica formal y coordinar la **Evaluación en Terreno Gratuita ($0)**:\n📋 **¿Cuál es tu nombre y apellido?**`,
          enviarPDF: false
        }
      }
    } else {
      // Si no es comuna válida y no fue una consulta ya respondida
      return {
        texto: `Para verificar la cobertura técnica inmediata y disponibilidad de técnicos en tu sector:\n\n📍 **¿En qué comuna se encuentra tu propiedad?**\n*(Por ejemplo: Limache, Viña del Mar, Quilpué, Las Condes, Maipú, Colina...)* 🏡🏢`,
        enviarPDF: false
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  5. PIDIENDO NOMBRE
  // ─────────────────────────────────────────────────────────────
  if (lead.paso === 'pidiendo_nombre' || (!lead.nombre && (lower.startsWith('me llamo') || lower.startsWith('soy ')))) {
    let nombreLimpio = texto.replace(/me llamo|soy|mi nombre es/gi, '').trim()
    const palabrasNoNombre = ['hola', 'servicio', 'precio', 'alarma', 'camara', 'comuna', 'visita']
    const esNombreInvalido = palabrasNoNombre.some(p => nombreLimpio.toLowerCase().includes(p))

    if (nombreLimpio.length > 1 && !esNombreInvalido) {
      lead.nombre = capitalizar(nombreLimpio)
      lead.paso = 'agendando_visita'
      guardarEnSupabase(lead, numero, 'calificado')

      const esCamaras = lead.interes === 'CCTV 4K' || lead.tipoPropiedad === 'Cámaras de Seguridad'
      const textoVisita = esCamaras
        ? `¡Un gusto, ${lead.nombre}! 🌟 Para el sistema de Cámaras 4K en **${lead.comuna || 'tu sector'}**, un técnico especializado realiza una **Evaluación Técnica en Terreno 100% Gratuita ($0)** para definir puntos ciegos, cableado y cobertura exacta 📹.\n\n¿Qué día y bloque horario te acomoda más? 📅\n\n1️⃣ **Mañana (10:00 a 13:00 hrs)** ☀️\n2️⃣ **Tarde (15:00 a 18:00 hrs)** 🌤️\n3️⃣ **Sábado en la mañana (10:00 a 13:00 hrs)** 🗓️\n4️⃣ **Coordinar un horario especial con un asesor** 🤝\n\n*(Puedes responder con el número 1, 2, 3 o 4)*`
        : `¡Un gusto, ${lead.nombre}! 🌟 Para proteger tu ${lead.tipoPropiedad?.toLowerCase() || 'propiedad'} en **${lead.comuna || 'tu sector'}**, realizamos una **Evaluación Técnica en Terreno 100% Gratuita ($0)** sin ningún compromiso 🤝.\n\n¿Qué día y bloque horario te acomoda más? 📅\n\n1️⃣ **Mañana (10:00 a 13:00 hrs)** ☀️\n2️⃣ **Tarde (15:00 a 18:00 hrs)** 🌤️\n3️⃣ **Sábado en la mañana (10:00 a 13:00 hrs)** 🗓️\n4️⃣ **Coordinar un horario especial con un asesor** 🤝\n\n*(Puedes responder con el número 1, 2, 3 o 4)*`

      return { texto: textoVisita, enviarPDF: false }
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  6. SELECCIÓN DE PRODUCTO (1 a 5)
  // ─────────────────────────────────────────────────────────────
  const esCamaras = lower === '5' || lower.includes('camara') || lower.includes('cámara') || lower.includes('cctv')
  const esCasa = lower === '1' || lower.includes('casa') || lower.includes('parcela') || lower.includes('hogar')
  const esDepto = lower === '2' || lower.includes('depto') || lower.includes('departamento') || lower.includes('condominio')
  const esEmpresa = lower === '3' || lower.includes('negocio') || lower.includes('empresa') || lower.includes('local') || lower.includes('bodega') || lower.includes('oficina')
  const esMigracion = lower === '4' || lower.includes('migrar') || lower.includes('cambiar') || lower.includes('tengo alarma') || lower.includes('reprogramar')

  if (esCamaras) {
    lead.tipoPropiedad = 'Cámaras de Seguridad'
    lead.interes = 'CCTV 4K'

    if (comunaDetectada) {
      lead.comuna = comunaDetectada
      guardarEnSupabase(lead, numero)
      lead.paso = 'agendando_visita'
      return {
        texto: `¡Excelente elección! 📹 Para el sistema de Cámaras de Seguridad 4K en **${lead.comuna}**, contamos con cobertura técnica completa y técnicos certificados 🛡️.\n\n*(Te adjunto la ficha técnica oficial en PDF con todos los detalles de Cámaras 4K con IA)* 📄\n\nPara definir los puntos de grabación y cableado sin compromiso, realizamos una **Evaluación Técnica en Terreno 100% Gratuita ($0)** 🤝.\n\n${lead.nombre || 'Estimado/a'}, ¿qué día y bloque horario te acomoda más? 📅\n\n1️⃣ **Mañana (10:00 a 13:00 hrs)** ☀️\n2️⃣ **Tarde (15:00 a 18:00 hrs)** 🌤️\n3️⃣ **Sábado en la mañana (10:00 a 13:00 hrs)** 🗓️\n4️⃣ **Coordinar un horario especial con un asesor** 🤝\n\n*(Puedes responder con 1, 2, 3 o 4)*`,
        enviarPDF: true,
        tipoPDF: 'camaras'
      }
    }

    lead.paso = 'pidiendo_comuna'
    guardarEnSupabase(lead, numero)
    return {
      texto: `¡Excelente elección! 📹 Instalamos sistemas profesionales de **Cámaras de Seguridad 4K Ultra HD** con Inteligencia Artificial, visión nocturna a todo color y monitoreo directo en tu celular vía App móvil 📲✨.\n\n🔒 **Lo más destacado:**\n• Detección perimetral inteligente de personas y vehículos (cero falsas alertas) 🚶‍♂️🚗.\n• Grabación continua 24/7 en alta resolución, sin cobros mensuales obligatorios.\n• Instalación técnica limpia, garantizada y estética 🛠️.\n• Opción de integración a nuestra Central de Monitoreo 24/7 🛡️.\n\n*(Te adjunto la ficha técnica oficial en PDF con todos los detalles)* 📄\n\nPara verificar factibilidad técnica y cobertura inmediata:\n📍 **¿En qué comuna o sector se ubica la propiedad que deseas proteger?** 🏡🏢`,
      enviarPDF: true,
      tipoPDF: 'camaras'
    }
  }

  if (esCasa || esDepto || esEmpresa || esMigracion) {
    if (esCasa) {
      lead.tipoPropiedad = 'Casa o Parcela'
      lead.interes = 'Pack VETTI Smart'
    } else if (esDepto) {
      lead.tipoPropiedad = 'Departamento'
      lead.interes = 'Alarma Departamento'
    } else if (esEmpresa) {
      lead.tipoPropiedad = 'Negocio / Empresa'
      lead.interes = 'Alarma Comercial'
    } else if (esMigracion) {
      lead.tipoPropiedad = 'Migración de Alarma'
      lead.interes = 'Migración $0'
    }

    if (comunaDetectada) {
      lead.comuna = comunaDetectada
      guardarEnSupabase(lead, numero)
      lead.paso = 'agendando_visita'
      return {
        texto: `¡Excelente elección! 🏡 Para ${lead.tipoPropiedad.toLowerCase()} en **${lead.comuna}** tenemos cobertura técnica completa con patrullaje y verificación rápida 🚨.\n\n*(Te adjunto la ficha técnica oficial en PDF con todos los detalles)* 📄\n\nPara revisar los puntos vulnerables en tu propiedad, realizamos una **Evaluación Técnica en Terreno 100% Gratuita ($0)** sin compromiso 🤝.\n\n${lead.nombre || 'Estimado/a'}, ¿qué día y bloque horario te acomoda más? 📅\n\n1️⃣ **Mañana (10:00 a 13:00 hrs)** ☀️\n2️⃣ **Tarde (15:00 a 18:00 hrs)** 🌤️\n3️⃣ **Sábado en la mañana (10:00 a 13:00 hrs)** 🗓️\n4️⃣ **Coordinar un horario especial con un asesor** 🤝\n\n*(Puedes responder con 1, 2, 3 o 4)*`,
        enviarPDF: true,
        tipoPDF: 'alarmas'
      }
    }

    lead.paso = 'pidiendo_comuna'
    guardarEnSupabase(lead, numero)

    if (esCasa) {
      return {
        texto: `¡Excelente elección! 🏡 Para casas recomendamos nuestro **Pack VETTI Smart Inalámbrico** con control total en tu celular desde la App NT CLICK 📲.\n\n✨ **Lo más destacado:**\n• Central con doble vía WiFi + 4G anti-corte de luz 📶.\n• Sensores antimascotas (evita falsas alarmas) 🐕.\n• Sirena de alta potencia 110 dB + botón de pánico SOS 🚨.\n• Monitoreo 24/7 conectado a Central por solo **0,9 UF + IVA mensual** (~$35.000 CLP) 🛡️.\n• **Instalación profesional bonificada ($0)** con el plan.\n• **Equipos 100% tuyos** (sin arriendos engañosos).\n\n*(Te adjunto la ficha técnica oficial en PDF con todos los detalles)* 📄\n\nPara verificar cobertura y factibilidad técnica inmediata:\n📍 **¿En qué comuna o sector se ubica tu casa?**`,
        enviarPDF: true,
        tipoPDF: 'alarmas'
      }
    } else if (esDepto) {
      return {
        texto: `¡Perfecto! 🏢 Para departamentos diseñamos una protección perimetral de alta precisión en puerta de acceso y ventanales.\n\n✨ **Beneficios:**\n• Detección perimetral instantánea antes de que ingresen 🚨.\n• Control y alertas push en tu celular en tiempo real 📲.\n• Conexión a Central 24/7 por **0,9 UF + IVA al mes** (~$35.000 CLP) 🛡️.\n• Equipos en propiedad sin arriendos eternos.\n\n*(Te adjunto la ficha técnica oficial en PDF)* 📄\n\n📍 **¿En qué comuna se encuentra tu departamento?**`,
        enviarPDF: true,
        tipoPDF: 'alarmas'
      }
    } else if (esEmpresa) {
      return {
        texto: `¡Excelente! 🏪 Para negocios y empresas contamos con protocolos de control de apertura/cierre, múltiples usuarios y respuesta prioritaria ante intrusión.\n\n✨ **Incluye:**\n• Supervisión continua 24/7 con reporte de señales a Carabineros 🚨.\n• Verificación técnica y control desde la App móvil 📲.\n• Planes corporativos accesibles desde **0,9 UF + IVA** al mes 💼.\n\n📍 **¿En qué comuna comercial se ubica tu negocio?**`,
        enviarPDF: false
      }
    } else if (esMigracion) {
      return {
        texto: `¡Es una tremenda oportunidad de ahorro! 🔄 Si ya cuentas con sensores instalados (marca DSC, Honeywell o ADT), nuestros técnicos **reprograman tu sistema a costo $0 en sensores** y lo conectamos a nuestra Central de Monitoreo 24/7 por solo **0,9 UF + IVA al mes** 💰.\n\nDejas de pagar mensualidades excesivas y conservas tus equipos 👍.\n\n📍 **¿En qué comuna está instalada tu alarma actual?**`,
        enviarPDF: false
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  7. DETECCIÓN ESPONTÁNEA DE COMUNA EN CUALQUIER MOMENTO
  // ─────────────────────────────────────────────────────────────
  if (comunaDetectada) {
    lead.comuna = comunaDetectada
    guardarEnSupabase(lead, numero)

    if (lead.nombre && lead.nombre !== 'Prospecto') {
      lead.paso = 'agendando_visita'
      return {
        texto: `¡Excelente! 🚨 En **${lead.comuna}** tenemos cobertura técnica completa con patrullaje de verificación rápida 🛡️.\n\nPara revisar los puntos vulnerables en tu propiedad, realizamos una **Evaluación Técnica en Terreno 100% Gratuita ($0)** sin compromiso 🤝.\n\n${lead.nombre}, ¿qué día y bloque horario te acomoda más? 📅\n\n1️⃣ **Mañana (10:00 a 13:00 hrs)** ☀️\n2️⃣ **Tarde (15:00 a 18:00 hrs)** 🌤️\n3️⃣ **Sábado en la mañana (10:00 a 13:00 hrs)** 🗓️\n4️⃣ **Coordinar un horario especial con un asesor** 🤝\n\n*(Puedes responder con el número 1, 2, 3 o 4)*`,
        enviarPDF: false
      }
    } else {
      lead.paso = 'pidiendo_nombre'
      return {
        texto: `¡Excelente! 🚨 En **${lead.comuna}** tenemos cobertura técnica completa con patrullaje de verificación rápida 🛡️.\n\nPara preparar tu ficha técnica formal y coordinar la **Evaluación en Terreno Gratuita ($0)**:\n📋 **¿Cuál es tu nombre y apellido?**`,
        enviarPDF: false
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  8. CONSULTA ABIERTA CON GEMINI IA (Si está configurado)
  // ─────────────────────────────────────────────────────────────
  const respuestaIA = await consultarGeminiOpcional(texto, lead)
  if (respuestaIA) {
    return {
      texto: respuestaIA,
      enviarPDF: false
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  9. MENÚ DE BIENVENIDA POR DEFECTO
  // ─────────────────────────────────────────────────────────────
  lead.paso = 'esperando_opcion'
  return {
    texto: `¡Hola${nombreSaludo}! Qué gusto saludarte 👋 Soy Tomás, tu asesor de seguridad en **GAMA Seguridad** 🛡️.\n\nTe ayudo de inmediato a cotizar la mejor protección con monitoreo 24/7 y **equipos 100% propios** (sin pagar arriendos eternos de $75.000 como en otras empresas) 🙌.\n\n¿Qué tipo de solución necesitas proteger? 🏡📹\n\n1️⃣ **Casa o Parcela** 🏡\n2️⃣ **Departamento** 🏢\n3️⃣ **Negocio o Empresa** 🏪\n4️⃣ **Ya tengo alarma (Migración a costo $0)** 🔄\n5️⃣ **Cámaras de Seguridad 4K** 📹\n\n*(Puedes responder con el número 1, 2, 3... o escribirme directamente)*`,
    enviarPDF: false
  }
}

function capitalizar(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ──────────────────────────────────────────────
//  GUARDAR LEAD EN SUPABASE (SCHEMA SEGURO CON UUID)
// ──────────────────────────────────────────────
async function guardarEnSupabase(lead, numero, estado = 'en_conversacion') {
  try {
    const direccionDetalle = [
      lead.tipoPropiedad ? `[${lead.tipoPropiedad}]` : '',
      lead.interes ? `Interés: ${lead.interes}` : '',
      lead.horarioVisita ? `Visita: ${lead.horarioVisita}` : ''
    ].filter(Boolean).join(' | ')

    const payload = {
      session_id: numeroAUUID(numero),
      nombre: lead.nombre || 'Prospecto WhatsApp',
      telefono: numero,
      comuna: lead.comuna || null,
      direccion: direccionDetalle || null,
      estado: estado,
      updated_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
    }
    await supabase.from('leads_sales_gama').upsert(payload, { onConflict: 'session_id' })
    log(`[CRM] Lead guardado en Supabase: +${numero} (${lead.nombre || 'Prospecto'}) -> ${estado}`)
  } catch (e) {
    log(`[CRM] Error guardando lead en Supabase: ${e.message}`, 'WARN')
  }
}

// ──────────────────────────────────────────────
//  ALERTA VIP AL CELULAR DEL DUEÑO (SIN SPAM AL CLIENTE)
// ──────────────────────────────────────────────
async function dispararAlertaVIP(lead, numero) {
  if (!OWNER_PHONE || !sock) return
  const numLimpio = String(numero).replace(/\D/g, '')
  const ownerLimpio = String(OWNER_PHONE).replace(/\D/g, '')

  // Omitir alerta en el mismo chat si quien prueba es el dueño
  if (numLimpio === ownerLimpio || numLimpio.endsWith(ownerLimpio) || ownerLimpio.endsWith(numLimpio)) {
    log(`[ALERTA VIP] Lead coincide con OWNER_PHONE (${numero}). Omitiendo alerta duplicada en el mismo chat de prueba.`)
    return
  }

  // Validar que la comuna sea real y no texto residual
  if (!lead.comuna || lead.comuna.toLowerCase().includes('servicio')) {
    log(`[ALERTA VIP] Comuna inválida o no confirmada (${lead.comuna}). Omitiendo alerta VIP.`)
    return
  }

  try {
    const alerta = `🚨 *[NUEVO LEAD CALIFICADO - GAMA]* 🚨\n\n` +
      `👤 *Nombre:* ${lead.nombre || 'Prospecto'}\n` +
      `📍 *Comuna:* ${lead.comuna}\n` +
      `🏡 *Tipo:* ${lead.tipoPropiedad || 'Casa o Parcela'}\n` +
      `📦 *Solución:* ${lead.interes || 'Pack VETTI Smart'}\n` +
      `📅 *Visita Técnica:* ${lead.horarioVisita || 'Por coordinar'}\n` +
      `📱 *Teléfono:* +${numero}\n\n` +
      `👉 *Chatear con el cliente ahora:* https://wa.me/${numero}`

    await enviarMensajeBot(`${OWNER_PHONE}@s.whatsapp.net`, { text: alerta })
    log(`[ALERTA VIP] Notificación enviada a +${OWNER_PHONE} para lead +${numero}`)
  } catch (e) {
    log(`[ALERTA VIP] Error enviando alerta: ${e.message}`, 'ERROR')
  }
}

function esPeticionDeHumano(texto) {
  const t = String(texto || '').toLowerCase()
  const palabrasClave = [
    'humano', 'persona', 'alguien', 'asesor', 'ejecutivo', 'vendedor',
    'llamar', 'llamen', 'llamame', 'llámenme', 'fono', 'telefono', 'teléfono',
    'hablar con alguien', 'comunicar con alguien', 'atencion humana', 'atención humana'
  ]
  return palabrasClave.some(p => t.includes(p))
}

// ──────────────────────────────────────────────
//  ESTADO Y SOCKET BAILEYS
// ──────────────────────────────────────────────
let sock = null
let qrActual = null
let qrImageBase64 = null
let estadoConexion = 'desconectado'
let numeroConectado = null
let usuarioConectado = null

async function conectar() {
  estadoConexion = 'conectando'
  log(`Iniciando Baileys en la nube (Puerto ${PORT})...`)

  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }))

    const messageStore = new Map()

    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
      },
      printQRInTerminal: true,
      logger: pino({ level: 'silent' }),
      browser: Browsers.macOS('GAMA Cloud Bot'),
      syncFullHistory: false,
      markOnlineOnConnect: true,
      getMessage: async (key) => {
        return messageStore.get(key.id) || undefined
      }
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        qrActual = qr
        qrImageBase64 = await QRCode.toDataURL(qr, { width: 320, margin: 2 })
        estadoConexion = 'esperando_qr'
        log('Nuevo Código QR generado. Abre https://gama-ventas-bot.onrender.com para escanear.')
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut
        log(`Conexión cerrada. Código: ${statusCode}. Reconectar: ${shouldReconnect}`, 'WARN')
        estadoConexion = 'desconectado'
        qrActual = null
        qrImageBase64 = null

        if (statusCode === DisconnectReason.loggedOut) {
          try {
            fs.rmSync(SESSION_DIR, { recursive: true, force: true })
            fs.mkdirSync(SESSION_DIR, { recursive: true })
          } catch {}
          setTimeout(conectar, 3000)
        } else if (shouldReconnect) {
          setTimeout(conectar, 5000)
        }
      } else if (connection === 'open') {
        estadoConexion = 'conectado'
        qrActual = null
        qrImageBase64 = null
        const rawUser = sock.user?.id || ''
        numeroConectado = rawUser.split(':')[0].split('@')[0]
        usuarioConectado = sock.user?.name || 'GAMA Bot Cloud'
        log(`✅ WHATSAPP CLOUD CONECTADO EXITOSAMENTE: +${numeroConectado} (${usuarioConectado})`)
      }
    })

    // ── PROCESAMIENTO DE MENSAJES ENTRANTES ──
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        if (!msg.key || !msg.key.remoteJid) continue

        // Guardar mensaje en store para reintentos de desencriptación
        if (msg.key.id && msg.message) {
          messageStore.set(msg.key.id, msg.message)
        }

        // 1. Descartar mensajes salientes (fromMe) sin silenciar nunca al bot
        if (msg.key.fromMe) {
          if (msg.key.id) botSentMessageIds.delete(msg.key.id)
          continue
        }

        const remoteJid = msg.key.remoteJid

        // Ignorar broadcasts y grupos
        if (isJidBroadcast(remoteJid) || remoteJid.endsWith('@g.us')) continue

        // Deduplicación de mensajes
        if (msg.key.id) {
          if (processedMessages.has(msg.key.id)) continue
          processedMessages.set(msg.key.id, Date.now())
        }

        const body = extraerTextoMensaje(msg)
        const numero = remoteJid.replace(/[^0-9]/g, '')
        const nombre = msg.pushName || 'Prospecto'
        const lowerRaw = body.toLowerCase()

        if (!body) {
          const mKeys = msg.message ? Object.keys(msg.message).join(', ') : 'vacio'
          log(`[IGNORADO] Mensaje sin texto legible de +${numero} (tipo: ${mKeys})`)
          continue
        }

        log(`📩 [MENSAJE RECIBIDO] de +${numero} (${nombre}): "${body.slice(0, 50)}"`)

        // Comandos o saludos que reactivan el bot de inmediato
        if (
          lowerRaw.includes('hola') ||
          lowerRaw.includes('buenas') ||
          lowerRaw.includes('menu') ||
          lowerRaw.includes('menú') ||
          lowerRaw.includes('bot') ||
          lowerRaw.includes('activar bot') ||
          lowerRaw.includes('reiniciar') ||
          lowerRaw.includes('inicio') ||
          lowerRaw.includes('volver')
        ) {
          if (humanTakeover.has(numero)) {
            humanTakeover.delete(numero)
            log(`⚡ Chat con +${numero} reactivado por saludo o comando.`)
          }
        }

        // 2. Verificar si está en modo Humano activo
        const lastTakeover = humanTakeover.get(numero)
        if (lastTakeover && (Date.now() - lastTakeover < 30 * 60 * 1000)) {
          const restantes = Math.round((30 * 60 * 1000 - (Date.now() - lastTakeover)) / 1000)
          log(`⏸️ Chat con +${numero} en modo Humano activo (${restantes}s restantes). Bot silenciado.`)
          continue
        }

        // 3. Evaluar Human Handoff (Petición explícita de asesor humano)
        if (esPeticionDeHumano(body)) {
          log(`🚨 HUMAN HANDOFF SOLICITADO por +${numero} (${nombre})`)
          humanTakeover.set(numero, Date.now())

          const respuestaTraspaso = `¡Comprendido ${nombre}! Te estoy transfiriendo de inmediato con nuestro asesor comercial de turno para que te atienda de forma personalizada por este mismo chat o llamada 🤝.`
          await enviarMensajeBot(remoteJid, { text: respuestaTraspaso })

          if (OWNER_PHONE) {
            const alertaOwner = `🚨 *[LEAD SOLICITA ASESOR HUMANO]*\n\nEl cliente *${nombre}* (+${numero}) solicita hablar con un asesor.\n\n*Mensaje:* "${body}"\n\n👉 *Chatear con el cliente:* https://wa.me/${numero}`
            await enviarMensajeBot(`${OWNER_PHONE}@s.whatsapp.net`, { text: alertaOwner }).catch(() => {})
          }
          continue
        }

        // 4. Procesar con el Motor Consultivo de Ventas
        try {
          await sock.sendPresenceUpdate('composing', remoteJid).catch(() => {})
          await new Promise(r => setTimeout(r, 1200))
          await sock.sendPresenceUpdate('paused', remoteJid).catch(() => {})

          const respuestaBot = await procesarMensajeVentas(body, numero, nombre, sock, remoteJid)
          await enviarMensajeBot(remoteJid, { text: respuestaBot })
          log(`🤖 Bot respondió con éxito a +${numero}`)
        } catch (err) {
          log(`Error respondiendo al cliente +${numero}: ${err.message}`, 'ERROR')
        }
      }
    })

  } catch (err) {
    log(`Error en conexión: ${err.message}`, 'ERROR')
    setTimeout(conectar, 10000)
  }
}

// ──────────────────────────────────────────────
//  AUTO KEEP-ALIVE (EVITA SUSPENSIÓN EN RENDER)
// ──────────────────────────────────────────────
if (RENDER_EXTERNAL_URL) {
  setInterval(() => {
    https.get(RENDER_EXTERNAL_URL, (res) => {}).on('error', () => {})
  }, 8 * 60 * 1000)
}

// ──────────────────────────────────────────────
//  EXPRESS INTERFACE
// ──────────────────────────────────────────────
const app = express()
app.use(cors())

app.get('/status', (req, res) => {
  res.json({
    ok: true,
    version: '5.2',
    uptimeSegundos: Math.round(process.uptime()),
    estado: estadoConexion,
    numero: numeroConectado,
    usuario: usuarioConectado,
    humanTakeoversActivos: Array.from(humanTakeover.keys()),
    leadsRegistrados: leadMemory.size,
  })
})

app.get('/logs', (req, res) => {
  res.setHeader('content-type', 'text/plain; charset=utf-8')
  res.send(logBuffer.length ? logBuffer.join('\n') : 'Sin logs registrados aún.')
})

app.get('/reset-takeover', (req, res) => {
  const count = humanTakeover.size
  humanTakeover.clear()
  log(`⚡ Todos los Human Takeovers han sido reseteados manualmente (${count} chats liberados).`)
  res.json({ ok: true, liberados: count })
})

app.get('/', (req, res) => {
  const isConectado = estadoConexion === 'conectado'
  const isEsperando = estadoConexion === 'esperando_qr' && qrImageBase64

  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GAMA WhatsApp Cloud Bot v5.2</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #050d1a; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #0f1c30; border: 1px solid #1e3a5f; border-radius: 24px; padding: 36px; max-width: 520px; width: 100%; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.6); }
    h1 { color: #38bdf8; font-size: 24px; font-weight: 800; margin-bottom: 6px; }
    h2 { color: #94a3b8; font-size: 14px; font-weight: 500; margin-bottom: 24px; }
    .badge { display: inline-block; padding: 8px 22px; border-radius: 999px; font-weight: 800; font-size: 13px; text-transform: uppercase; margin-bottom: 24px; }
    .badge-ok { background: #10b981; color: #022c22; }
    .badge-wait { background: #f59e0b; color: #451a03; }
    .qr-box { background: white; padding: 16px; border-radius: 16px; display: inline-block; margin: 16px 0; }
    .qr-box img { display: block; max-width: 260px; height: auto; }
    .phone-info { font-size: 18px; font-weight: 700; color: #10b981; margin: 16px 0; }
    .actions { margin-top: 20px; display: flex; gap: 10px; justify-content: center; }
    .btn { display: inline-block; background: #1e293b; color: #38bdf8; text-decoration: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid #334155; }
    .btn:hover { background: #334155; color: white; }
    .note { font-size: 12px; color: #64748b; margin-top: 24px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🛡️ GAMA SEGURIDAD</h1>
    <h2>WhatsApp Bot 24/7 en la Nube v5.2</h2>

    ${isConectado ? `
      <div class="badge badge-ok">✅ Conectado y Activo 24/7</div>
      <div class="phone-info">📱 +${numeroConectado} (${usuarioConectado})</div>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
        El bot está respondiendo en la nube 24/7 con Inteligencia Comercial.<br>
        Fichas PDF, Cotizador Dinámico, Agendador de Visitas $0 y Alertas VIP activos.
      </p>
      <div class="actions">
        <a class="btn" href="/logs" target="_blank">📋 Ver Logs en Vivo</a>
        <a class="btn" href="/reset-takeover" target="_blank">⚡ Desbloquear Chats</a>
      </div>
    ` : isEsperando ? `
      <div class="badge badge-wait">⏳ Esperando Escaneo</div>
      <p style="color: #cbd5e1; font-size: 13px; margin-bottom: 12px;">
        Abre WhatsApp Business en tu teléfono:<br>
        <strong>Ajustes > Dispositivos vinculados > Vincular un dispositivo</strong>
      </p>
      <div class="qr-box">
        <img src="${qrImageBase64}" alt="Código QR WhatsApp" />
      </div>
    ` : `
      <div class="badge badge-wait">Iniciando Servidor...</div>
      <p style="color: #94a3b8; font-size: 13px;">Conectando socket seguro...</p>
    `}

    <div class="note">
      ☁️ Corriendo en la nube 24/7 sin depender de tu computador personal.<br>
      Costo por mensaje: $0 pesos.
    </div>
  </div>
</body>
</html>
  `)
})

app.listen(PORT, () => {
  log(`🚀 Servidor en la nube escuchando en puerto ${PORT}`)
  conectar()
})
