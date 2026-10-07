/**
 * ═══════════════════════════════════════════════════════════════════════
 *  GAMA SEGURIDAD - BOT DE WHATSAPP VENTAS EN LA NUBE (24/7)
 *  - Compatible con Render.com, Koyeb, Railway, VPS
 *  - Motor: Baileys 7.x
 *  - Inteligencia Artificial: Google Gemini + Motor Conversacional Experto
 *  - Human Handoff (Derivación automática a asesor humano)
 *  - Flujo Consultivo: Opciones con botones/emojis, toma de datos, CRM Supabase
 * ═══════════════════════════════════════════════════════════════════════
 */

const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const https = require('https')
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
const OWNER_PHONE = process.env.OWNER_PHONE || '56991016912' // Teléfono donde llegan alertas de derivación
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || 'https://gama-ventas-bot.onrender.com'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true })
}

// ──────────────────────────────────────────────
//  MEMORIA DE CONVERSACIÓN & ESTADOS DE LEADS
// ──────────────────────────────────────────────
const humanTakeover = new Map()     // telefono -> timestamp
const processedMessages = new Map() // id -> timestamp
const leadMemory = new Map()        // telefono -> { paso, nombre, comuna, tipoPropiedad, interes, historial: [] }

let genAI = null
if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    console.log('[IA] Gemini configurado y activo.')
  } catch (e) {
    console.error('Error inicializando Gemini:', e.message)
  }
}

// ──────────────────────────────────────────────
//  PROMPT DE ENTRENAMIENTO IA (CÁLIDO, CONSULTIVO, EMOTICONES)
// ──────────────────────────────────────────────
const SYSTEM_PROMPT = `
Eres Tomás, el Asesor Comercial y Especialista de Seguridad de GAMA SEGURIDAD (Chile).
Atiendes prospectos que llegan desde anuncios en Facebook e Instagram por WhatsApp.

PERSONALIDAD Y TONO:
- Eres cálido, cercano, empático, entusiasta y muy educado (trato chileno formal y cercano, sin tecnicismos fríos).
- ¡Cero respuestas tipo robot o enciclopedia! Habla como una persona real conversando por WhatsApp.
- Usa emoticones amigables de manera estratégica (🛡️, 🏡, 🏢, 📲, ✨, 💰, 📍, 🤝, 🚨, 🐕, 🌟).
- No envíes párrafos eternos: usa mensajes ágiles, directos y con viñetas ordenadas.
- Brinda siempre opciones numeradas claras con emojis (1️⃣, 2️⃣, 3️⃣...) para que al cliente le sea súper fácil responder tocando un número.

OBJETIVOS DEL CHAT:
1. Conocer qué tipo de propiedad busca proteger (Casa/Parcela, Departamento, Negocio o Migrar alarma).
2. Presentar la solución a la medida destacando los beneficios reales:
   - Pack Vetti Smart Inalámbrico con App móvil NT CLICK.
   - Monitoreo 24/7 conectado a Central desde 0,9 UF + IVA mensual (~$35.000 CLP).
   - ¡EL GRAN DIFERENCIAL GAMA! Los equipos son 100% TUYOS en propiedad. Cero arriendos eternos ni comodatos abusivos de $70.000-$80.000 como Verisure o ADT.
   - Sensores antimascotas (hasta 25 kg) que evitan falsas alarmas.
   - Instalación técnica bonificada ($0 costo).
   - Si ya tienen alarma instalada (DSC, ADT, etc.): Migración a costo $0 en hardware.
3. Preguntar la comuna para confirmar cobertura inmediata (cubrimos las 52 comunas de RM y 38 de V Región) y ofrecer Evaluación Técnica en Terreno Gratuita ($0).
4. Tomar el nombre del cliente para prepararle la propuesta formal o agendar su visita.
5. Preguntar si prefiere coordinación por WhatsApp o llamada.
6. Si piden hablar con un humano o asesor telefónico: avisa con total amabilidad que los transfieres de inmediato.
`

// Comunas reconocidas para agilizar captura de datos
const COMUNAS_CHILE = [
  'santiago', 'las condes', 'providencia', 'vitacura', 'la reina', 'lo barnechea',
  'ñuñoa', 'la florida', 'maipu', 'maipú', 'puente alto', 'san miguel', 'macul',
  'peñalolen', 'peñalolén', 'quilicura', 'pudahuel', 'colina', 'chicureo', 'lampa',
  'san bernardo', 'buin', 'paine', 'melipilla', 'talagante', 'penaflor', 'peñaflor',
  'viña', 'viña del mar', 'valparaiso', 'valparaíso', 'concon', 'concón', 'quilpue',
  'quilpué', 'villa alemana', 'limache', 'quillota', 'san antonio', 'rengo', 'rancagua'
]

// ──────────────────────────────────────────────
//  MOTOR CONVERSACIONAL DE VENTAS GAMA
// ──────────────────────────────────────────────
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutos de inactividad

async function procesarMensajeVentas(textoUsuario, numero, nombrePush) {
  const t = textoUsuario.trim()
  const lower = t.toLowerCase()
  const now = Date.now()
  let reinicioPorInactividad = false

  // Obtener o inicializar estado del lead
  if (!leadMemory.has(numero)) {
    leadMemory.set(numero, {
      paso: 'inicio',
      nombre: (nombrePush && nombrePush !== 'Prospecto') ? nombrePush : null,
      comuna: null,
      tipoPropiedad: null,
      interes: 'alarma_monitoreo',
      historial: [],
      lastActivity: now
    })
  } else {
    const leadExistente = leadMemory.get(numero)
    // ESTRATEGIA DE MEMORIA: Si han pasado más de 10 minutos de inactividad, se reinicia el flujo
    if (leadExistente.lastActivity && (now - leadExistente.lastActivity > INACTIVITY_TIMEOUT_MS)) {
      console.log(`[MEMORIA] ⏰ Inactividad > 10 min (+${numero}). Reiniciando flujo conversacional.`)
      leadExistente.paso = 'inicio'
      leadExistente.tipoPropiedad = null
      leadExistente.historial = []
      reinicioPorInactividad = true
    }
    leadExistente.lastActivity = now
  }

  const lead = leadMemory.get(numero)

  // Comando manual para volver al menú
  if (lower === 'menu' || lower === 'menú' || lower === 'reiniciar' || lower === 'inicio' || lower === 'volver') {
    lead.paso = 'inicio'
    lead.tipoPropiedad = null
    lead.historial = []
    reinicioPorInactividad = true
  }

  lead.historial.push({ role: 'user', content: t })
  if (lead.historial.length > 8) lead.historial.shift()

  // 1. Si hay Gemini API Key configurada, enriquecer con IA manteniendo la guía
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const histText = lead.historial.map(m => `${m.role === 'user' ? 'Cliente' : 'Tomás (GAMA)'}: ${m.content}`).join('\n')
      const promptContext = `
${SYSTEM_PROMPT}

ESTADO ACTUAL DEL CLIENTE:
- Nombre detectado: ${lead.nombre || 'No indicado aún'}
- Comuna: ${lead.comuna || 'No indicada aún'}
- Tipo de propiedad: ${lead.tipoPropiedad || 'No indicado aún'}

HISTORIAL RECIENTE:
${histText}

Cliente: "${t}"
Tomás (GAMA Seguridad):`

      const res = await model.generateContent(promptContext)
      const respuesta = res?.response?.text()
      if (respuesta && respuesta.trim().length > 10) {
        const limpia = respuesta.trim()
        lead.historial.push({ role: 'assistant', content: limpia })
        // Extraer datos si están presentes
        actualizarDatosLeadDesdeTexto(lower, lead, numero)
        return limpia
      }
    } catch (err) {
      console.error('[IA] Error llamando a Gemini, usando motor nativo:', err.message)
    }
  }

  // 2. Motor Conversacional Nativo Experto de GAMA (Cálido, Dinámico, Guiado con Opciones)
  const respuestaNativa = generarRespuestaNativa(t, lower, lead, numero, reinicioPorInactividad)
  lead.historial.push({ role: 'assistant', content: respuestaNativa })
  return respuestaNativa
}

function generarRespuestaNativa(texto, lower, lead, numero, reinicioPorInactividad = false) {
  const nombreSaludo = lead.nombre ? ` ${lead.nombre}` : ''

  // Saludo especial si regresa tras más de 10 min de inactividad
  if (reinicioPorInactividad && lead.nombre && !lower.includes('1') && !lower.includes('2') && !lower.includes('3') && !lower.includes('4') && !lower.includes('5')) {
    lead.paso = 'esperando_opcion'
    return `¡Hola de nuevo ${lead.nombre}! 👋 Qué gusto saludarte otra vez por aquí.\n\nPara retomar tu cotización o hacer una nueva consulta:\n\n¿Qué tipo de propiedad necesitas proteger? 🏡\n\n1️⃣ **Casa o Parcela** 🏡\n2️⃣ **Departamento** 🏢\n3️⃣ **Negocio o Empresa** 🏪\n4️⃣ **Ya tengo alarma (Migración a costo $0)** 🔄\n5️⃣ **Cámaras de Seguridad 4K** 📹\n\n*(Puedes responder con el número 1, 2, 3... o escribirme directamente)*`
  }

  // A) PREGUNTAS FRECUENTES COMUNES (Respuestas inmediatas sin perder el hilo)
  if (lower.includes('luz') || lower.includes('corte de luz') || lower.includes('bateria')) {
    return `¡Muy buena pregunta! 💡 Ante un corte intencional de energía eléctrica, la central de alarma cuenta con **batería de respaldo autónoma** y conexión **4G GSM de emergencia** 📶, por lo que el sistema sigue 100% activo y conectado a la Central de Monitoreo.\n\n¿En qué comuna se encuentra tu propiedad para confirmar la factibilidad técnica? 📍`
  }

  if (lower.includes('perro') || lower.includes('gato') || lower.includes('mascota')) {
    return `¡Totalmente cubierto! 🐕🐈 Nuestros sensores de movimiento incorporan **tecnología PIR inteligente antimascotas** que no se activa con mascotas de hasta 25 kg. Puedes dejar a tus regalones adentro con la alarma armada sin falsas alarmas.\n\n¿Para qué tipo de propiedad la estás buscando? 🏡\n1️⃣ Casa o Parcela\n2️⃣ Departamento\n3️⃣ Negocio`
  }

  if (lower.includes('verisure') || lower.includes('adt')) {
    lead.interes = 'migracion_competencia'
    guardarEnSupabase(lead, numero)
    return `¡Es la mejor decisión que puedes tomar! 🙌 A diferencia de Verisure o ADT donde pagas cuotas altísimas de $70.000 a $85.000 mensuales y los equipos están en arriendo eterno, en GAMA Seguridad:\n\n✅ **Los equipos son 100% TUYOS en propiedad**.\n✅ Plan de Monitoreo 24/7 desde **0,9 UF + IVA (~$35.000/mes)** 💰.\n✅ Si ya tienes alarma instalada, la **migramos a costo $0 en sensores** 🔄.\n\n📍 **¿En qué comuna te ubicas para agendar la revisión técnica gratuita?**`
  }

  // B) FLUJO POR PASOS Y BOTONES NUMERADOS

  // PASO 0 / INICIO: Si recién saluda o no ha elegido propiedad
  if (lead.paso === 'inicio' || (!lead.tipoPropiedad && (lower.includes('hola') || lower.includes('buenas') || lower.includes('precio') || lower.includes('cotiz') || lower.includes('info') || lower === '1' || lower === '2' || lower === '3' || lower === '4' || lower === '5'))) {

    // Si ya presionó una opción directamente
    if (lower === '1' || lower.includes('casa') || lower.includes('parcela')) {
      lead.tipoPropiedad = 'Casa o Parcela'
      lead.paso = 'pidiendo_comuna'
      guardarEnSupabase(lead, numero)
      return `¡Excelente elección! 🏡 Para casas y parcelas recomendamos nuestro **Pack VETTI Smart Inalámbrico** con control total desde tu smartphone en la App NT CLICK 📲.\n\n✨ **Lo más destacado:**\n• Central con doble vía WiFi + 4G anti-corte de luz.\n• Sensores antimascotas (evita falsas alarmas) 🐕.\n• Sirena de alta potencia 110 dB + botón de pánico SOS 🚨.\n• Monitoreo 24/7 conectado a Central por solo **0,9 UF + IVA mensual** (~$35.000 CLP).\n• **Instalación profesional bonificada ($0)** con el plan.\n• **Equipos 100% tuyos** (sin arriendos engañosos).\n\nPara verificar cobertura y factibilidad técnica inmediata:\n📍 **¿En qué comuna o sector se ubica tu casa?**`
    }

    if (lower === '2' || lower.includes('depto') || lower.includes('departamento')) {
      lead.tipoPropiedad = 'Departamento'
      lead.paso = 'pidiendo_comuna'
      guardarEnSupabase(lead, numero)
      return `¡Perfecto! 🏢 Para departamentos diseñamos una protección de acceso directo de alta precisión para puerta principal y ventanales.\n\n✨ **Beneficios:**\n• Detección perimetral instantánea antes de que ingresen.\n• Control y notificaciones push en tu celular en tiempo real 📲.\n• Conexión a Central 24/7 por **0,9 UF + IVA al mes** (~$35.000 CLP).\n• Equipos en propiedad sin arriendos eternos.\n\n📍 **¿En qué comuna se encuentra tu departamento?**`
    }

    if (lower === '3' || lower.includes('negocio') || lower.includes('empresa') || lower.includes('local') || lower.includes('bodega')) {
      lead.tipoPropiedad = 'Negocio / Empresa'
      lead.paso = 'pidiendo_comuna'
      guardarEnSupabase(lead, numero)
      return `¡Excelente! 🏪 Para negocios y empresas contamos con protocolos de control de apertura/cierre, múltiples usuarios y respuesta prioritaria ante intrusión.\n\n✨ **Incluye:**\n• Supervisión continua 24/7 con reporte de señales a Carabineros.\n• Verificación técnica y control desde la App móvil 📲.\n• Planes corporativos accesibles desde **0,9 UF + IVA** al mes.\n\n📍 **¿En qué comuna o comuna comercial se ubica tu negocio?**`
    }

    if (lower === '4' || lower.includes('migrar') || lower.includes('cambiar') || lower.includes('tengo alarma')) {
      lead.tipoPropiedad = 'Migración de Alarma'
      lead.interes = 'migracion'
      lead.paso = 'pidiendo_comuna'
      guardarEnSupabase(lead, numero)
      return `¡Es una tremenda oportunidad de ahorro! 🔄 Si ya cuentas con sensores instalados (marca DSC, Honeywell o ADT), nuestros técnicos **reprograman tu sistema a costo $0 en sensores** y lo conectamos a nuestra Central de Monitoreo 24/7 por solo **0,9 UF + IVA al mes**.\n\nDejas de pagar mensualidades excesivas y conservas tus equipos 👍.\n\n📍 **¿En qué comuna está instalada tu alarma actual?**`
    }

    if (lower === '5' || lower.includes('camara') || lower.includes('cámara') || lower.includes('cctv')) {
      lead.tipoPropiedad = 'Cámaras de Seguridad'
      lead.interes = 'camaras_4k'
      lead.paso = 'pidiendo_comuna'
      guardarEnSupabase(lead, numero)
      return `¡Genial! 📹 Instalamos sistemas de **Cámaras de Seguridad 4K Ultra HD** con Inteligencia Artificial, visión nocturna a color y visualización en vivo desde tu celular sin costos mensuales adicionales obligatorios.\n\n📍 **¿En qué comuna se encuentra la propiedad que deseas vigilar?**`
    }

    // Menú de Bienvenida con Botones y Emojis
    lead.paso = 'esperando_opcion'
    return `¡Hola${nombreSaludo}! Qué gusto saludarte 👋 Soy Tomás, tu asesor de seguridad en **GAMA Seguridad** 🛡️.\n\nTe ayudo de inmediato a cotizar la mejor protección con monitoreo 24/7 y **equipos 100% propios** (sin pagar arriendos eternos de $75.000 como en otras empresas) 🙌.\n\n¿Qué tipo de propiedad necesitas proteger? 🏡\n\n1️⃣ **Casa o Parcela** 🏡\n2️⃣ **Departamento** 🏢\n3️⃣ **Negocio o Empresa** 🏪\n4️⃣ **Ya tengo alarma (Migración a costo $0)** 🔄\n5️⃣ **Cámaras de Seguridad 4K** 📹\n\n*(Puedes responder con el número 1, 2, 3... o escribirme directamente)*`
  }

  // PASO: PIDIENDO COMUNA
  // Revisar si el mensaje contiene alguna comuna de Chile
  const comunaEncontrada = COMUNAS_CHILE.find(c => lower.includes(c))
  if (comunaEncontrada || lead.paso === 'pidiendo_comuna') {
    lead.comuna = comunaEncontrada ? capitalizar(comunaEncontrada) : capitalizar(t.slice(0, 30))
    lead.paso = 'pidiendo_nombre'
    guardarEnSupabase(lead, numero)

    return `¡Excelente! En **${lead.comuna}** tenemos cobertura técnica completa con patrullaje de verificación rápida 🚨.\n\nPara tu tranquilidad, realizamos una **Evaluación Técnica en Terreno 100% Gratuita ($0)** sin ningún compromiso, donde un especialista revisa los puntos vulnerables de tu propiedad 🤝.\n\nPara preparar tu ficha técnica y cotización formal:\n📋 **¿Cuál es tu nombre y apellido?**`
  }

  // PASO: PIDIENDO NOMBRE
  if (lead.paso === 'pidiendo_nombre' || (!lead.nombre && (lower.startsWith('me llamo') || lower.startsWith('soy ') || t.split(' ').length <= 4))) {
    let nombreLimpio = t.replace(/me llamo|soy|mi nombre es/gi, '').trim()
    if (nombreLimpio.length > 1) {
      lead.nombre = capitalizar(nombreLimpio)
      lead.paso = 'confirmado'
      guardarEnSupabase(lead, numero, 'calificado')

      return `¡Un gusto, ${lead.nombre}! 🌟 Ya ingresé tus datos en nuestro sistema de atención preferencial:\n\n📋 **Resumen de tu cotización:**\n• **Interés:** ${lead.tipoPropiedad || 'Alarma y Monitoreo 24/7'}\n• **Comuna:** ${lead.comuna || 'Región Metropolitana / V Región'}\n• **Plan:** Desde 0,9 UF + IVA mensual (Equipos propios)\n• **Evaluación técnica en terreno:** Bonificada $0\n\n¿Cómo prefieres que nos comuniquemos contigo para afinar los detalles? 📲\n1️⃣ **Por este mismo WhatsApp** 💬\n2️⃣ **Por llamada telefónica** 📞`
    }
  }

  // PASO: CONFIRMACIÓN DE PREFERENCIA DE CONTACTO
  if (lead.paso === 'confirmado') {
    if (lower === '1' || lower.includes('whatsapp') || lower.includes('chat')) {
      return `¡Anotado! 💬 Te mantendremos informado y coordinaremos todo por este mismo chat de WhatsApp. Un asesor técnico te enviará la propuesta detallada en breve. ¡Muchas gracias por confiar en GAMA Seguridad! 🛡️✨`
    }
    if (lower === '2' || lower.includes('llamada') || lower.includes('llamar') || lower.includes('telefono')) {
      return `¡Perfecto! 📞 Nuestro ejecutivo comercial te llamará a la brevedad a este mismo número para resolver cualquier duda y coordinar tu visita técnica sin costo. ¡Que tengas un excelente día! 🛡️✨`
    }
  }

  // RESPUESTA GENERAL CONSULTIVA SI ESCRIBE OTRA COSA
  return `¡Comprendido! En GAMA Seguridad nos adaptamos exactamente a tus necesidades 🛡️.\n\nPara orientarte con la opción más conveniente:\n¿En qué **comuna** se ubica tu propiedad y buscas proteger **casa, departamento o negocio**? 🏡📍`
}

function actualizarDatosLeadDesdeTexto(lower, lead, numero) {
  const comuna = COMUNAS_CHILE.find(c => lower.includes(c))
  if (comuna && !lead.comuna) {
    lead.comuna = capitalizar(comuna)
    guardarEnSupabase(lead, numero)
  }
}

function capitalizar(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

async function guardarEnSupabase(lead, numero, estado = 'en_conversacion') {
  try {
    const payload = {
      session_id: `wa-${numero}`,
      nombre: lead.nombre || 'Prospecto WhatsApp',
      telefono: numero,
      comuna: lead.comuna || null,
      direccion: lead.tipoPropiedad ? `[${lead.tipoPropiedad}] ${lead.interes || ''}` : null,
      estado: estado,
      updated_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
    }
    await supabase.from('leads_sales_gama').upsert(payload, { onConflict: 'session_id' })
  } catch (e) {
    console.error('[SUPABASE] Error guardando lead:', e.message)
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

function log(msg, nivel = 'INFO') {
  const ts = new Date().toLocaleTimeString('es-CL', { hour12: false })
  console.log(`[${ts}] [CLOUD-BOT-${nivel}] ${msg}`)
}

async function conectar() {
  estadoConexion = 'conectando'
  log(`Iniciando Baileys en la nube (Puerto ${PORT})...`)

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
      browser: Browsers.macOS('GAMA Cloud Bot'),
      syncFullHistory: false,
      markOnlineOnConnect: true,
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        qrActual = qr
        qrImageBase64 = await QRCode.toDataURL(qr, { width: 320, margin: 2 })
        estadoConexion = 'esperando_qr'
        log('Nuevo Código QR de la nube generado. Abre la página para escanear.')
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
        log(`✅ WHATSAPP CLOUD CONECTADO: +${numeroConectado} (${usuarioConectado})`)
      }
    })

    // ── PROCESAMIENTO DE MENSAJES ENTRANTES ──
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        if (!msg.key || !msg.key.remoteJid) continue
        if (msg.key.fromMe) {
          // Si respondes tú desde el celular, activamos silencio de 30 min para ese contacto
          const dest = msg.key.remoteJid.replace(/[^0-9]/g, '')
          humanTakeover.set(dest, Date.now())
          continue
        }
        if (isJidBroadcast(msg.key.remoteJid) || msg.key.remoteJid.endsWith('@g.us')) continue

        if (msg.key.id) {
          if (processedMessages.has(msg.key.id)) continue
          processedMessages.set(msg.key.id, Date.now())
        }

        const body = msg.message?.conversation
          || msg.message?.extendedTextMessage?.text
          || msg.message?.imageMessage?.caption || ''

        if (!body) continue

        const remoteJid = msg.key.remoteJid
        const numero = remoteJid.replace(/[^0-9]/g, '')
        const nombre = msg.pushName || 'Prospecto'

        log(`📩 Mensaje de +${numero} (${nombre}): "${body.slice(0, 50)}"`)

        // 1. Verificar si está en modo Humano activo (últimos 30 minutos)
        const lastTakeover = humanTakeover.get(numero)
        if (lastTakeover && (Date.now() - lastTakeover < 30 * 60 * 1000)) {
          log(`⏸️ Chat con +${numero} está en modo Humano. Bot silenciado.`)
          continue
        }

        // 2. Evaluar Human Handoff (¿Pide hablar con alguien?)
        if (esPeticionDeHumano(body)) {
          log(`🚨 HUMAN HANDOFF ACTIVADO para +${numero} (${nombre})`)
          humanTakeover.set(numero, Date.now())

          const respuestaTraspaso = `¡Comprendido ${nombre}! Te estoy transfiriendo de inmediato con nuestro asesor comercial de turno para que te atienda de forma personalizada por este mismo chat o llamada 🤝.`
          await sock.sendMessage(remoteJid, { text: respuestaTraspaso })

          if (OWNER_PHONE && sock) {
            const alertaOwner = `🚨 *[LEAD CALIENTE GAMA]*\n\nEl cliente *${nombre}* (+${numero}) solicita hablar con un asesor.\n\n*Mensaje:* "${body}"\n\n👉 *Chatear con el cliente:* https://wa.me/${numero}`
            await sock.sendMessage(`${OWNER_PHONE}@s.whatsapp.net`, { text: alertaOwner }).catch(() => {})
          }
          continue
        }

        // 3. Procesar con el Motor de Ventas Consultivo GAMA
        try {
          // Simular tiempo de lectura humano y digitación (2 a 3 segundos)
          await sock.sendPresenceUpdate('composing', remoteJid).catch(() => {})
          await new Promise(r => setTimeout(r, 2200))
          await sock.sendPresenceUpdate('paused', remoteJid).catch(() => {})

          const respuestaBot = await procesarMensajeVentas(body, numero, nombre)
          await sock.sendMessage(remoteJid, { text: respuestaBot })
          log(`🤖 Bot respondió a +${numero}`)
        } catch (err) {
          log(`Error respondiendo al cliente: ${err.message}`, 'ERROR')
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
    https.get(RENDER_EXTERNAL_URL, (res) => {
      // Keep alive exitoso
    }).on('error', () => {})
  }, 8 * 60 * 1000) // cada 8 minutos
}

// ──────────────────────────────────────────────
//  EXPRESS INTERFACE
// ──────────────────────────────────────────────
const app = express()
app.use(cors())

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
  <title>GAMA WhatsApp Cloud Bot</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #050d1a; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #0f1c30; border: 1px solid #1e3a5f; border-radius: 24px; padding: 36px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.6); }
    h1 { color: #38bdf8; font-size: 24px; font-weight: 800; margin-bottom: 6px; }
    h2 { color: #94a3b8; font-size: 14px; font-weight: 500; margin-bottom: 24px; }
    .badge { display: inline-block; padding: 8px 22px; border-radius: 999px; font-weight: 800; font-size: 13px; text-transform: uppercase; margin-bottom: 24px; }
    .badge-ok { background: #10b981; color: #022c22; }
    .badge-wait { background: #f59e0b; color: #451a03; }
    .qr-box { background: white; padding: 16px; border-radius: 16px; display: inline-block; margin: 16px 0; }
    .qr-box img { display: block; max-width: 260px; height: auto; }
    .phone-info { font-size: 18px; font-weight: 700; color: #10b981; margin: 16px 0; }
    .note { font-size: 12px; color: #64748b; margin-top: 24px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🛡️ GAMA SEGURIDAD</h1>
    <h2>WhatsApp Bot 24/7 en la Nube (Human Handoff)</h2>

    ${isConectado ? `
      <div class="badge badge-ok">✅ Conectado y Activo 24/7</div>
      <div class="phone-info">📱 +${numeroConectado} (${usuarioConectado})</div>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
        El bot está respondiendo en la nube 24/7 con Inteligencia Artificial.<br>
        Si un cliente pide hablar con una persona, te notificará a tu celular y pausará el bot automáticamente.
      </p>
    ` : isEsperando ? `
      <div class="badge badge-wait">⏳ Esperando Escaneo</div>
      <p style="color: #cbd5e1; font-size: 13px; margin-bottom: 12px;">
        Abre WhatsApp Business en tu teléfono nuevo:<br>
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
