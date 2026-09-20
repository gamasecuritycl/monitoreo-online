import { NextRequest, NextResponse } from 'next/server'

// Perfil de Gama Seguridad para contextualizar el análisis IA
const PERFIL_GAMA_SEGURIDAD = `
Eres un experto en compras públicas de Chile y analista comercial senior de GAMA SEGURIDAD SpA.

PERFIL DE LA EMPRESA:
- Razón Social: GAMA SEGURIDAD SpA
- Rubro: Seguridad Privada, Televigilancia, CCTV, Alarmas y Monitoreo 24/7
- Servicios que ofrece:
  * Servicio de monitoreo de alarmas 24/7 con central operativa propia
  * Instalación y mantención de sistemas CCTV con analítica de video e IA
  * Cámaras IP, PTZ, domo, fijas, DVR/NVR, LPR (lector de patentes)
  * Sistemas de alarma de intrusión, detección de incendio, concertinas
  * Televigilancia y videovigilancia con analítica
  * Guardias de seguridad privada acreditados OS-10 (control de acceso, rondines, custodia)
  * Control de acceso: torniquetes, lectores biométricos, barreras vehiculares, RFID
  * Mantención correctiva y preventiva de sistemas de seguridad
  * Respuesta móvil ante activación de alarmas
- Cobertura geográfica principal: Región de Valparaíso (Quilpué, Viña del Mar, Valparaíso, Concón)
- También opera en: Región Metropolitana y otras regiones bajo evaluación
- Acreditaciones: OS-10, empresa constituida en Chile
- Capacidad técnica: Central de monitoreo propia, vehículos de respuesta, técnicos certificados
`

// Función de análisis IA especializada
function construirPromptAnalisis(licitacionJson: any, licitacionBasica: any): string {
  const nombre = licitacionBasica?.Nombre || licitacionJson?.Nombre || 'Licitación'
  const organismo = licitacionBasica?.Organismo || licitacionJson?.Comprador?.NombreOrganismo || 'Organismo del Estado'
  const region = licitacionBasica?.Region || ''
  const comuna = licitacionBasica?.Comuna || ''
  const monto = licitacionBasica?.MontoEstimado || 0
  const tipo = licitacionBasica?.Tipo || ''
  const descripcion = licitacionBasica?.Descripcion || ''
  const rut = licitacionBasica?.RutComprador || licitacionJson?.Comprador?.RutUsuario || ''
  const fechaCierre = licitacionBasica?.FechaCierre || ''
  const codigoExterno = licitacionBasica?.CodigoExterno || ''

  // Extraer Items del detalle de la API (si están disponibles)
  let itemsTexto = ''
  const items = licitacionJson?.Items?.Listado
  if (Array.isArray(items) && items.length > 0) {
    itemsTexto = '\n\nÍTEMS DEL PROCESO (Requerimiento Técnico Oficial):\n'
    items.forEach((item: any, i: number) => {
      itemsTexto += `${i + 1}. ${item.NombreProducto || item.Nombre || 'Ítem'}`
      if (item.Descripcion) itemsTexto += `: ${item.Descripcion}`
      if (item.Cantidad) itemsTexto += ` (Cantidad: ${item.Cantidad} ${item.UnidadMedida || ''})`
      itemsTexto += '\n'
    })
  }

  // Extraer Documentos adjuntos
  let docsTexto = ''
  const docs = licitacionJson?.Documentos?.Listado
  if (Array.isArray(docs) && docs.length > 0) {
    docsTexto = '\n\nDOCUMENTOS ADJUNTOS EN EL PORTAL:\n'
    docs.forEach((doc: any) => {
      docsTexto += `- ${doc.Nombre || doc.NombreDocumento || 'Documento'}\n`
    })
  }

  // Preguntas de aclaración si existen
  let preguntasTexto = ''
  const preguntas = licitacionJson?.Preguntas?.Listado
  if (Array.isArray(preguntas) && preguntas.length > 0) {
    preguntasTexto = '\n\nPREGUNTAS Y RESPUESTAS DEL PROCESO:\n'
    preguntas.slice(0, 5).forEach((p: any) => {
      if (p.Pregunta) preguntasTexto += `P: ${p.Pregunta}\n`
      if (p.Respuesta) preguntasTexto += `R: ${p.Respuesta}\n`
    })
  }

  return `${PERFIL_GAMA_SEGURIDAD}

---

DATOS DE LA LICITACIÓN A ANALIZAR:

ID/Código: ${codigoExterno}
Nombre: ${nombre}
Organismo Comprador: ${organismo}
RUT Organismo: ${rut}
Región: ${region} ${comuna ? `(${comuna})` : ''}
Monto Estimado: $${Math.round(monto).toLocaleString('es-CL')} CLP
Tipo de Proceso: ${tipo}
Fecha Cierre de Ofertas: ${fechaCierre}
Descripción General: ${descripcion}
${itemsTexto}
${docsTexto}
${preguntasTexto}

---

INSTRUCCIONES:

Analiza esta licitación EXCLUSIVAMENTE desde la perspectiva de GAMA SEGURIDAD SpA y genera un informe ejecutivo en formato JSON con la siguiente estructura EXACTA (sin markdown, solo JSON puro):

{
  "viabilidad": "ALTA|MEDIA|BAJA",
  "puntaje_viabilidad": <número 0-100>,
  "resumen_ejecutivo": "<2-3 párrafos analizando la oportunidad para Gama Seguridad>",
  "alineacion_servicios": "<párrafo explicando qué servicios de Gama aplican directamente>",
  "servicios_requeridos": [
    { "servicio": "<nombre del servicio requerido>", "aplica_gama": true, "nota": "<breve nota>" }
  ],
  "documentos_adjuntos": ["<nombre doc 1>", "<nombre doc 2>"],
  "requisitos_tecnicos": [
    { "requisito": "<descripción>", "gama_cumple": true, "accion_requerida": "<qué hacer si no cumple>" }
  ],
  "requisitos_administrativos": [
    { "requisito": "<descripción>", "gama_cumple": true, "accion_requerida": "<qué hacer>" }
  ],
  "plan_de_accion": [
    { "paso": 1, "accion": "<descripción clara>", "plazo": "<inmediato|3 días|1 semana|etc>", "responsable": "<Gerencia|Técnico|Administración>", "prioridad": "ALTA|MEDIA|BAJA" }
  ],
  "riesgos": [
    { "tipo": "<Técnico|Administrativo|Geográfico|Precio>", "descripcion": "<descripción>", "impacto": "ALTO|MEDIO|BAJO", "mitigacion": "<cómo reducir el riesgo>" }
  ],
  "precio_referencial": {
    "minimo_clp": <número>,
    "maximo_clp": <número>,
    "recomendado_clp": <número>,
    "justificacion": "<por qué ese precio>"
  },
  "contacto_clave": {
    "nombre": "<nombre del funcionario si disponible>",
    "unidad": "<unidad o departamento>",
    "observacion": "<consejo para el contacto>"
  },
  "notas_estrategicas": "<consejo adicional de valor para mejorar las posibilidades de ganar>",
  "fecha_analisis": "${new Date().toLocaleString('es-CL')}"
}

IMPORTANTE: 
- Responde SOLO con el JSON, sin explicaciones adicionales ni markdown
- Sé específico y práctico en el plan de acción
- Si el monto estimado está disponible, propone un precio competitivo real
- Considera la ubicación geográfica para evaluar si Gama puede cubrir bien el servicio
- Los plazos del plan de acción deben considerar la fecha de cierre: ${fechaCierre}
`
}

export async function POST(req: NextRequest) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY no configurada en el servidor.' }, { status: 500 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
  }

  const { codigo, ticket, licitacion_basica } = body

  if (!codigo) {
    return NextResponse.json({ error: 'Falta el código de licitación.' }, { status: 400 })
  }

  // 1. Intentar obtener el detalle completo de ChileCompra (Items, Documentos, etc.)
  let detalleChileCompra: any = null
  if (ticket && ticket.length > 5) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(
        `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=${encodeURIComponent(codigo)}&ticket=${encodeURIComponent(ticket)}`,
        { signal: controller.signal, headers: { 'User-Agent': 'GamaSecurity-AI/1.0' } }
      )
      clearTimeout(timeout)
      if (res.ok) {
        const data = await res.json().catch(() => null)
        if (data && Array.isArray(data.Listado) && data.Listado.length > 0) {
          detalleChileCompra = data.Listado[0]
        }
      }
    } catch {
      // Si falla el detalle, seguimos con los datos básicos
    }
  }

  // 2. Construir el prompt especializado
  const prompt = construirPromptAnalisis(detalleChileCompra, licitacion_basica)

  // 3. Llamar a Gemini 2.5 Flash
  let informeTexto = ''
  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 16384,
          },
        }),
      }
    )

    const geminiData = await geminiRes.json()
    if (!geminiRes.ok) {
      const msg = geminiData?.error?.message || `Error Gemini HTTP ${geminiRes.status}`
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    informeTexto = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    if (!informeTexto) {
      return NextResponse.json({ error: 'Gemini no devolvió contenido.' }, { status: 500 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: `Error al llamar a Gemini: ${e.message}` }, { status: 500 })
  }

  // 4. Parsear el JSON del informe (limpiar markdown si Gemini lo agregó)
  let informe: any
  try {
    const limpio = informeTexto
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    informe = JSON.parse(limpio)
  } catch {
    // Si no se pudo parsear, devolver el texto crudo para debugging
    return NextResponse.json({
      error: 'No se pudo parsear la respuesta de Gemini como JSON.',
      texto_crudo: informeTexto.slice(0, 2000)
    }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    codigo_licitacion: codigo,
    detalle_obtenido: Boolean(detalleChileCompra),
    items_analizados: Array.isArray(detalleChileCompra?.Items?.Listado) ? detalleChileCompra.Items.Listado.length : 0,
    informe
  })
}
