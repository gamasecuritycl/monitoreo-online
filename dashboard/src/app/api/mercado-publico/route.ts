import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://onxwyrwmpjxtwlmjrosr.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHd5cndtcGp4dHdsbWpyb3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxNDQsImV4cCI6MjA5ODQzMTE0NH0.8kJRf8hm3rHK8sygMcyBT0R83tyK8hIQCmnAQxannJs'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticket = searchParams.get('ticket')?.trim() || ''
  const rubroFiltro = searchParams.get('rubro')?.toLowerCase() || ''
  const regionFiltro = searchParams.get('region')?.toLowerCase() || ''
  const codigo = searchParams.get('codigo')?.trim() || ''
  const accion = searchParams.get('accion') || ''

  try {
    // 1. Acción: Guardar ticket compartido en Supabase
    if (accion === 'save_ticket' && ticket) {
      try {
        await supabase.from('eventos_monitoreo').insert({
          cuenta: 'CONFIG_MERCADOPUBLICO_TICKET',
          nombre_abonado: ticket,
          evento: 'TICKET_CHILECOMPRA',
          fecha_hora: new Date().toISOString()
        })
      } catch (e: any) {
        console.warn('Error guardando ticket en Supabase:', e?.message)
      }
      return NextResponse.json({ success: true, mensaje: 'Ticket sincronizado exitosamente.' })
    }

    // 2. Acción: Obtener ticket compartido desde Supabase o env
    if (accion === 'get_ticket') {
      try {
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'CONFIG_MERCADOPUBLICO_TICKET')
          .order('id', { ascending: false })
          .limit(1)
        const t = data?.[0]?.nombre_abonado?.trim() || process.env.CHILECOMPRA_TICKET || ''
        return NextResponse.json({ success: true, ticket: t })
      } catch {
        return NextResponse.json({ success: false, ticket: '' })
      }
    }

    // 3. Acción: Probar validez del ticket ante la API oficial de ChileCompra
    if (accion === 'test_ticket') {
      if (!ticket || ticket.length < 5) {
        return NextResponse.json({
          success: false,
          ticket_valido: false,
          error: 'El ticket ingresado está vacío o es demasiado corto.'
        })
      }

      const testUrl = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?estado=activas&ticket=${encodeURIComponent(ticket)}`
      const testRes = await fetch(testUrl, {
        headers: { 'User-Agent': 'GamaSecurity-Tester/2.0' }
      })

      const testData = await testRes.json().catch(() => null)
      if (!testData) {
        return NextResponse.json({
          success: false,
          ticket_valido: false,
          error: 'No se recibió respuesta válida del servidor de ChileCompra.'
        })
      }

      if (testData.Codigo && testData.Mensaje) {
        return NextResponse.json({
          success: false,
          ticket_valido: false,
          error: `ChileCompra rechazó el ticket: "${testData.Mensaje}" (Código ${testData.Codigo})`
        })
      }

      if (Array.isArray(testData.Listado)) {
        // Auto-guardar en Supabase para sincronización
        try {
          await supabase.from('eventos_monitoreo').insert({
            cuenta: 'CONFIG_MERCADOPUBLICO_TICKET',
            nombre_abonado: ticket,
            evento: 'TICKET_CHILECOMPRA',
            fecha_hora: new Date().toISOString()
          })
        } catch {}

        return NextResponse.json({
          success: true,
          ticket_valido: true,
          mensaje: `¡Ticket válido y activo! Se conectó con éxito a ChileCompra. Hay ${testData.Cantidad || testData.Listado.length} licitaciones activas hoy en el portal.`
        })
      }

      return NextResponse.json({
        success: false,
        ticket_valido: false,
        error: 'Respuesta inesperada de ChileCompra. Verifica tu ticket.'
      })
    }

    // 4. Auto-detección de ticket activo
    let ticketActivo = ticket
    if (!ticketActivo || ticketActivo.length < 5) {
      try {
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'CONFIG_MERCADOPUBLICO_TICKET')
          .order('id', { ascending: false })
          .limit(1)
        if (data?.[0]?.nombre_abonado && data[0].nombre_abonado.trim().length > 5) {
          ticketActivo = data[0].nombre_abonado.trim()
        } else if (process.env.CHILECOMPRA_TICKET) {
          ticketActivo = process.env.CHILECOMPRA_TICKET
        }
      } catch {}
    }

    // 5. Consulta de una licitación específica por código oficial
    if (codigo && ticketActivo) {
      const codUrl = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=${encodeURIComponent(codigo)}&ticket=${encodeURIComponent(ticketActivo)}`
      const codRes = await fetch(codUrl)
      if (codRes.ok) {
        const codData = await codRes.json().catch(() => null)
        if (codData && Array.isArray(codData.Listado) && codData.Listado.length > 0) {
          const lic = codData.Listado[0]
          const normalizada = normalizarLicitacionReal(lic)

          // Auto-guardar en caché persistente de Supabase
          try {
            await supabase.from('eventos_monitoreo').insert({
              cuenta: 'CACHE_LICITACION',
              evento: normalizada.CodigoExterno,
              nombre_abonado: JSON.stringify({
                Organismo: normalizada.Organismo,
                Region: normalizada.Region,
                Comuna: normalizada.Comuna,
                DireccionUnidad: normalizada.DireccionUnidad,
                Contacto: normalizada.Contacto,
                MontoEstimado: normalizada.MontoEstimado,
                FechaCierre: normalizada.FechaCierre,
                Descripcion: normalizada.Descripcion
              }),
              fecha_hora: new Date().toISOString()
            })
          } catch {}

          return NextResponse.json({
            success: true,
            modo: 'api_real_chilecompra_detalle',
            ticket_valido: true,
            total_encontradas: 1,
            licitaciones: [normalizada]
          })
        }
      }
      return NextResponse.json({
        success: false,
        modo: 'api_real_chilecompra_detalle',
        error: `No se encontró la licitación con código ${codigo} en Mercado Público.`,
        total_encontradas: 0,
        licitaciones: []
      })
    }

    // 6. Consulta general en vivo a la API oficial de ChileCompra
    if (ticketActivo && ticketActivo.length > 5) {
      const apiUrl = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?estado=activas&ticket=${encodeURIComponent(ticketActivo)}`
      const res = await fetch(apiUrl, {
        headers: { 'User-Agent': 'GamaSecurity-MercadoPublico/2.0' },
        next: { revalidate: 120 }
      })

      if (res.ok) {
        const data = await res.json().catch(() => null)

        // Si ChileCompra respondió con error de ticket
        if (data && data.Codigo && data.Mensaje) {
          return NextResponse.json({
            success: false,
            ticket_valido: false,
            error: `ChileCompra rechazó el ticket: "${data.Mensaje}" (Código ${data.Codigo}).`,
            modo: 'ticket_invalido',
            mensaje: 'Ticket no válido o expirado en ChileCompra. Ingresa tu Ticket API activo de mercadopublico.cl.',
            total_encontradas: 0,
            licitaciones: []
          })
        }

        if (data && Array.isArray(data.Listado)) {
          const listadoReal = data.Listado

          // 1. Filtrado estricto de rubros de seguridad privada y tecnología
          const filtradas = listadoReal.filter((lic: any) => {
            const nombre = lic.Nombre || ''
            return esLicitacionSeguridadReal(nombre)
          })

          // 2. Cargar caché persistente de detalles desde Supabase
          const cacheMap = new Map<string, any>()
          try {
            const { data: cacheFilas } = await supabase
              .from('eventos_monitoreo')
              .select('evento, nombre_abonado')
              .eq('cuenta', 'CACHE_LICITACION')
            if (Array.isArray(cacheFilas)) {
              for (const r of cacheFilas) {
                if (r.evento && r.nombre_abonado) {
                  try {
                    cacheMap.set(r.evento.trim().toUpperCase(), JSON.parse(r.nombre_abonado))
                  } catch {}
                }
              }
            }
          } catch (e: any) {
            console.warn('Error leyendo cache de licitaciones:', e?.message)
          }

          // 3. Mapear cada licitación combinando datos oficiales de ChileCompra y caché persistente
          const mapeadas = filtradas.map((lic: any) => {
            const cod = (lic.CodigoExterno || '').trim().toUpperCase()
            const base = normalizarLicitacionReal(lic)
            const cached = cacheMap.get(cod)
            if (cached) {
              return {
                ...base,
                Organismo: cached.Organismo || base.Organismo,
                Region: cached.Region || base.Region,
                Comuna: cached.Comuna || base.Comuna,
                DireccionUnidad: cached.DireccionUnidad || base.DireccionUnidad,
                Contacto: cached.Contacto || base.Contacto,
                MontoEstimado: (typeof cached.MontoEstimado === 'number' && cached.MontoEstimado > 0) ? cached.MontoEstimado : base.MontoEstimado,
                FechaCierre: cached.FechaCierre || base.FechaCierre,
                Descripcion: cached.Descripcion || base.Descripcion
              }
            }
            return base
          })

          // 4. Filtro por rubro si el cliente lo solicita en query
          let resultado = mapeadas
          if (rubroFiltro && rubroFiltro !== 'todos') {
            resultado = resultado.filter((l: any) => {
              if (rubroFiltro === 'cctv') return l.Rubro.includes('CCTV')
              if (rubroFiltro === 'monitoreo') return l.Rubro.includes('Monitoreo')
              if (rubroFiltro === 'guardias') return l.Rubro.includes('Guardias')
              if (rubroFiltro === 'acceso') return l.Rubro.includes('Acceso')
              return true
            })
          }

          // 5. Filtro por región tolerante a tildes
          if (regionFiltro && regionFiltro !== 'todas') {
            const rf = regionFiltro.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
            resultado = resultado.filter((l: any) => {
              const regNorm = (l.Region || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
              const comNorm = (l.Comuna || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
              return regNorm.includes(rf) || comNorm.includes(rf)
            })
          }

          return NextResponse.json({
            success: true,
            ticket_valido: true,
            modo: 'api_real_chilecompra',
            mensaje: `Conectado en vivo: ${resultado.length} licitaciones del rubro de seguridad activas hoy (de ${listadoReal.length} licitaciones totales en ChileCompra).`,
            total_encontradas: resultado.length,
            licitaciones: resultado
          })
        }
      } else {
        return NextResponse.json({
          success: false,
          ticket_valido: false,
          error: `Error HTTP ${res.status} al consultar ChileCompra.`,
          modo: 'error_chilecompra',
          total_encontradas: 0,
          licitaciones: []
        })
      }
    }

    // 7. Si no hay ticket configurado: LA REALIDAD PURA, 0 inventos
    return NextResponse.json({
      success: true,
      ticket_valido: false,
      modo: 'requiere_ticket',
      mensaje: 'Para ver las licitaciones públicas oficiales en vivo, debes configurar tu Ticket API de Mercado Público.',
      total_encontradas: 0,
      licitaciones: []
    })
  } catch (error: any) {
    console.warn('[API MERCADO PUBLICO] Error en consulta:', error?.message)
    return NextResponse.json({
      success: false,
      ticket_valido: false,
      modo: 'error_conexion',
      error: error?.message || 'Error de conexión con ChileCompra.',
      mensaje: 'No fue posible conectar con los servidores de ChileCompra en este momento.',
      total_encontradas: 0,
      licitaciones: []
    })
  }
}

/**
 * Enriquecimiento en Lote en Paralelo:
 * Consulta la ficha completa de ChileCompra para todas las licitaciones de seguridad
 * en bloques concurrentes para obtener Comprador.NombreOrganismo, RegionUnidad, ComunaUnidad
 * y Fechas de forma fidedigna sin demorar la respuesta.
 */
async function enriquecerLicitacionesConDetalle(licitaciones: any[], ticket: string): Promise<any[]> {
  const BATCH_SIZE = 15
  const MAX_A_ENRIQUECER = 80
  const aEnriquecer = licitaciones.slice(0, MAX_A_ENRIQUECER)
  const restantes = licitaciones.slice(MAX_A_ENRIQUECER)

  const enriquecidas: any[] = []
  for (let i = 0; i < aEnriquecer.length; i += BATCH_SIZE) {
    const chunk = aEnriquecer.slice(i, i + BATCH_SIZE)
    const resChunk = await Promise.all(
      chunk.map(async (lic) => {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 6000)

          const url = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=${encodeURIComponent(lic.CodigoExterno)}&ticket=${encodeURIComponent(ticket)}`
          const res = await fetch(url, { 
            signal: controller.signal,
            headers: { 'User-Agent': 'GamaSecurity-DetailFetcher/2.0' }
          })
          clearTimeout(timeoutId)

          if (res.ok) {
            const data = await res.json().catch(() => null)
            if (data && Array.isArray(data.Listado) && data.Listado.length > 0) {
              return normalizarLicitacionReal(data.Listado[0])
            }
          }
        } catch {}
        return normalizarLicitacionReal(lic)
      })
    )
    enriquecidas.push(...resChunk)
  }

  const normales = restantes.map(normalizarLicitacionReal)
  return [...enriquecidas, ...normales]
}

/**
 * Filtro Estricto de Seguridad Privada:
 * Elimina falsos positivos de compras médicas, aseo, señalética vial, cámaras fotográficas, etc.
 * Solo deja compras legítimas de los rubros que Gama Seguridad atiende.
 */
function esLicitacionSeguridadReal(nombre: string): boolean {
  const n = nombre.toUpperCase()

  // 1. Descartar falsos positivos comunes de otras industrias
  const TERMINOS_EXCLUSION = [
    'SEGURIDAD DEL PACIENTE',
    'FARMACOVIGILANCIA',
    'SEGURIDAD VIAL',
    'BARRERAS DE CONTENCIÓN',
    'BARRERAS CONTENCIÓN',
    'BARRERAS METALICAS',
    'BARRERAS METÁLICAS',
    'DOBLE ONDA',
    'TACHAS REFLECTANTES',
    'DEMARCACIÓN',
    'DEMARCACION',
    'SEÑALÉTICA',
    'SENALETICA',
    'MASCARILLAS',
    'EPP MÉDICO',
    'EPP MEDICO',
    'GUANTES DE CIRUGÍA',
    'ROPA QUIRÚRGICA',
    'SEGURIDAD BIOLÓGICA',
    'VACUNAS',
    'EXTINTORES Y RED HÚMEDA',
    'ASEO Y LIMPIEZA',
    'TRANSPORTE ESCOLAR',
    'RECOLECCIÓN DE BASURA',
    'PAVIMENTACIÓN',
    // Exclusiones de falsos positivos de "cámara"
    'CÁMARA SANITARIA',
    'CAMARA SANITARIA',
    'CÁMARAS SANITARIAS',
    'CAMARAS SANITARIAS',
    'LIMPIEZA DE CÁMARA',
    'LIMPIEZA CAMARA',
    'CÁMARA DESGRASADORA',
    'CAMARA DESGRASADORA',
    'CÁMARAS DESGRASADORAS',
    'DESGRASADORA',
    'CÁMARA FRÍA',
    'CAMARA FRIA',
    'CÁMARAS FRÍAS',
    'CAMARAS FRIAS',
    'CÁMARA FRIGORÍFICA',
    'CAMARA FRIGORIFICA',
    'CÁMARAS FRIGORÍFICAS',
    'CÁMARA MORTUORIA',
    'CAMARA MORTUORIA',
    'CÁMARAS MORTUORIAS',
    'CAMARAS MORTUORIAS',
    'CÁMARA HIPERBÁRICA',
    'CAMARA HIPERBARICA',
    'AEROCAMARA',
    'AEROCÁMARA',
    'CÁMARA RETINAL',
    'CAMARA RETINAL',
    'TOMÓGRAFO',
    'TOMOGRAFO',
    'OFTALMOLOG',
    'ORQUESTA DE CÁMARA',
    'ORQUESTA CAMARA',
    'ORQUESTA CÁMARA',
    'CÁMARAS SUBMARINAS',
    'CAMARAS SUBMARINAS',
    'PISCICULTURA',
    'CÁMARA DE REJAS',
    'PLANTA PEAS',
    'AGUAS SERVIDAS',
    'ALCANTARILLADO',
    'CANON EOS',
    'EOS R5',
    'NIKON',
    'SONY ALPHA',
    'LENTES FOTOGRÁFICOS',
    'OFICINAS DVRM'
  ]

  for (const exclusion of TERMINOS_EXCLUSION) {
    if (n.includes(exclusion)) return false
  }

  // 2. Coincidencia con rubros de seguridad privada y tecnología
  const TERMINOS_INCLUSION = [
    'CCTV',
    'TELEVIGILANCIA',
    'VIDEOVIGILANCIA',
    'CIRCUITO CERRADO',
    'CENTRAL DE MONITOREO',
    'SALA DE MONITOREO',
    'MONITOREO DE ALARMAS',
    'SISTEMA DE MONITOREO',
    'MONITOREO Y ALARMA',
    'MONITOREO DE CÁMARAS',
    'MONITOREO DE CAMARAS',
    'MONITOREO 24/7',
    'ALARMA DE INTRUSIÓN',
    'ALARMAS DE INTRUSION',
    'ALARMAS DE ROBO',
    'ALARMA DE ROBO',
    'ALARMA COMUNITARIA',
    'ALARMAS COMUNITARIAS',
    'SISTEMA DE ALARMAS',
    'SISTEMAS DE ALARMAS',
    'INSTALACIÓN DE ALARMAS',
    'INSTALACION DE ALARMAS',
    'MANTENCIÓN DE ALARMAS',
    'CONTROL DE ACCESO',
    'TORNIQUETE',
    'TORNIQUETES',
    'LECTOR BIOMÉTRICO',
    'LECTOR BIOMETRICO',
    'LECTOR FACIAL',
    'BARRERA VEHICULAR',
    'BARRERAS VEHICULARES',
    'PÓRTICOS Y CÁMARAS',
    'PORTICOS Y CAMARAS',
    'GUARDIA DE SEGURIDAD',
    'GUARDIAS DE SEGURIDAD',
    'SERVICIO DE GUARDIAS',
    'SERVICIOS DE GUARDIAS',
    'SERVICIO GUARDIA',
    'SEGURIDAD PRIVADA',
    'VIGILANCIA PRIVADA',
    'VIGILANCIA Y SEGURIDAD',
    'OS-10',
    'OS10',
    'RONDÍN',
    'RONDIN',
    'RONDINES',
    'VIGILANTE PRIVADO',
    'VIGILANTES PRIVADOS',
    'NVR',
    'CERCO ELÉCTRICO',
    'CERCO ELECTRICO',
    'CONCERTINA',
    'CÁMARAS DE SEGURIDAD',
    'CAMARAS DE SEGURIDAD',
    'CÁMARA DE SEGURIDAD',
    'CAMARA DE SEGURIDAD',
    'CÁMARAS IP',
    'CAMARAS IP',
    'CÁMARAS CORPORALES',
    'CAMARAS CORPORALES',
    'BODYCAM',
    'CÁMARAS DE TELEVIGILANCIA',
    'CAMARAS DE TELEVIGILANCIA',
    'CÁMARAS DE VIGILANCIA',
    'CAMARAS DE VIGILANCIA',
    'CÁMARAS BARRIALES',
    'CAMARAS BARRIALES',
    'CÁMARAS IA',
    'CAMARAS IA',
    'CENTRAL DE CÁMARAS',
    'SALA DE CÁMARAS',
    'PUNTOS DE CÁMARAS',
    'PUNTOS DE CAMARAS',
    'RECAMBIO DE CÁMARAS',
    'RECAMBIO DE CAMARAS',
    'SISTEMA DE CÁMARAS',
    'SISTEMA DE CAMARAS',
    'SISTEMAS DE CÁMARAS',
    'SISTEMAS DE CAMARAS',
    'TRANSMISION DE DATOS CAMARAS',
    'TRANSMISIÓN DE DATOS CÁMARAS'
  ]

  return TERMINOS_INCLUSION.some(inclusion => n.includes(inclusion))
}

/**
 * Normaliza una licitación real de ChileCompra.
 * NO INVENTA visitas, garantías, ponderaciones ni montos presupuestarios.
 */
function normalizarLicitacionReal(lic: any) {
  const nombre = lic.Nombre || 'Licitación Pública'
  const rubro = clasificarRubro(nombre)
  
  const organismo = 
    lic.Comprador?.NombreOrganismo?.trim() || 
    lic.Organismo || 
    extraerOrganismoDeTexto(nombre) || 
    'Organismo Público (Ver en ChileCompra)'

  const region = 
    lic.Comprador?.RegionUnidad?.trim() || 
    lic.Region || 
    extraerRegionDeTexto(nombre + ' ' + organismo) || 
    'Chile'

  const comuna = 
    lic.Comprador?.ComunaUnidad?.trim() || 
    lic.Comuna || 
    extraerComunaDeTexto(nombre + ' ' + organismo) || 
    ''

  const direccion = 
    lic.Comprador?.DireccionUnidad?.trim() || 
    lic.DireccionUnidad || 
    (comuna ? `${comuna}, ${region}` : region)

  const rut = lic.Comprador?.RutUsuario || lic.RutComprador || ''
  const contacto = lic.Comprador?.NombreUsuario?.trim() || lic.Contacto || 'Encargado de Compras Públicas'
  const monto = typeof lic.MontoEstimado === 'number' && lic.MontoEstimado > 0 ? lic.MontoEstimado : (lic.ValorTiempoRenovacion || 0)
  const fechaCierre = lic.Fechas?.FechaCierre || lic.FechaCierre || ''

  return {
    CodigoExterno: lic.CodigoExterno,
    Nombre: nombre,
    CodigoEstado: lic.CodigoEstado || 5,
    Estado: lic.Estado || 'Publicada',
    Organismo: organismo,
    Region: region,
    Comuna: comuna,
    RutComprador: rut,
    DireccionUnidad: direccion,
    FechaCierre: fechaCierre,
    MontoEstimado: monto,
    Moneda: lic.Moneda || 'CLP',
    Rubro: rubro,
    Descripcion: lic.Descripcion || `Proceso oficial de compra pública licitado a través de Mercado Público (ChileCompra). Bases y especificaciones disponibles en el portal oficial.`,
    Tipo: lic.Tipo || 'Licitación Pública',
    Contacto: contacto,
    EnlaceMercadoPublico: `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=${encodeURIComponent(lic.CodigoExterno)}`,
    EsDemo: false,
    VisitaTerreno: lic.VisitaTerreno || null,
    Garantias: lic.Garantias || null,
    Ponderaciones: lic.Ponderaciones || null
  }
}

function clasificarRubro(nombre: string): string {
  const n = nombre.toLowerCase()
  if (n.includes('cctv') || n.includes('camara') || n.includes('cámara') || n.includes('video') || n.includes('televigil') || n.includes('dvr') || n.includes('nvr') || n.includes('ptz')) {
    return 'CCTV & Cámaras'
  }
  if (n.includes('guardia') || n.includes('vigilante') || n.includes('os-10') || n.includes('os10') || n.includes('sereno') || n.includes('custodia') || n.includes('patrull')) {
    return 'Guardias de Seguridad'
  }
  if (n.includes('torniquete') || n.includes('biometr') || n.includes('facial') || n.includes('control de acceso') || n.includes('talanquera') || n.includes('barrera')) {
    return 'Control de Acceso'
  }
  return 'Monitoreo & Alarmas'
}

/**
 * Analizador Heurístico para detectar el Organismo del Estado solo si está explícito en el título
 */
function extraerOrganismoDeTexto(texto: string): string | null {
  const t = texto.toUpperCase()
  if (t.includes('FUNDACIÓN INTEGRA') || t.includes('FUNDACION INTEGRA')) return 'FUNDACIÓN INTEGRA'
  if (t.includes('JUNJI')) return 'JUNTA NACIONAL DE JARDINES INFANTILES (JUNJI)'
  if (t.includes('CARABINEROS')) return 'CARABINEROS DE CHILE'
  if (t.includes('HOSPITAL') || t.includes('HGGB')) return 'HOSPITAL PÚBLICO'
  if (t.includes('MUNICIPALIDAD') || t.includes('MUNICIPIO')) return 'ILUSTRE MUNICIPALIDAD'
  if (t.includes('GENDARMERÍA') || t.includes('GENDARMERIA')) return 'GENDARMERÍA DE CHILE'
  if (t.includes('ARMADA')) return 'ARMADA DE CHILE'
  if (t.includes('MINISTERIO')) return 'MINISTERIO PÚBLICO'
  return null
}

function extraerRegionDeTexto(texto: string): string | null {
  const t = texto.toUpperCase()
  if (t.includes('VALPARAÍSO') || t.includes('VALPARAISO') || t.includes('VIÑA') || t.includes('QUILPUÉ') || t.includes('VILLA ALEMANA') || t.includes('QUILLOTA') || t.includes('SAN ANTONIO') || t.includes('CONCÓN') || t.includes('EL TABO') || t.includes('NOGALES')) return 'Región de Valparaíso'
  if (t.includes('SANTIAGO') || t.includes('METROPOLITANA') || t.includes('PROVIDENCIA') || t.includes('LAS CONDES') || t.includes('MAIPÚ') || t.includes('CONCHALÍ') || t.includes('PUENTE ALTO')) return 'Región Metropolitana'
  if (t.includes('BIOBÍO') || t.includes('BIOBIO') || t.includes('CONCEPCIÓN') || t.includes('CONCEPCION') || t.includes('TALCAHUANO') || t.includes('CHIGUAYANTE') || t.includes('CORONEL') || t.includes('LOS ÁNGELES') || t.includes('LOS ANGELES') || t.includes('HGGB') || t.includes('GRANT BENAVENTE')) return 'Región del Biobío'
  if (t.includes('ÑUBLE') || t.includes('NUBLE') || t.includes('CHILLÁN') || t.includes('CHILLAN')) return 'Región de Ñuble'
  if (t.includes('ANTOFAGASTA') || t.includes('CALAMA') || t.includes('MARIA ELENA')) return 'Región de Antofagasta'
  if (t.includes('COQUIMBO') || t.includes('LA SERENA') || t.includes('TIERRAS BLANCAS')) return 'Región de Coquimbo'
  if (t.includes('MAULE') || t.includes('TALCA') || t.includes('CURICÓ') || t.includes('LINARES')) return 'Región del Maule'
  if (t.includes('O\'HIGGINS') || t.includes('OHIGGINS') || t.includes('RANCAGUA')) return 'Región de O\'Higgins'
  if (t.includes('ARAUCANÍA') || t.includes('ARAUCANIA') || t.includes('TEMUCO')) return 'Región de La Araucanía'
  if (t.includes('LOS RÍOS') || t.includes('LOS RIOS') || t.includes('VALDIVIA')) return 'Región de Los Ríos'
  if (t.includes('LOS LAGOS') || t.includes('PUERTO MONTT') || t.includes('OSORNO') || t.includes('CHILOÉ') || t.includes('ANCUD')) return 'Región de Los Lagos'
  if (t.includes('TARAPACÁ') || t.includes('TARAPACA') || t.includes('IQUIQUE') || t.includes('CAMIÑA')) return 'Región de Tarapacá'
  if (t.includes('ATACAMA') || t.includes('COPIAPÓ') || t.includes('COPIAPO')) return 'Región de Atacama'
  if (t.includes('ARICA') || t.includes('PARINACOTA')) return 'Región de Arica y Parinacota'
  if (t.includes('AYSÉN') || t.includes('AYSEN') || t.includes('COYHAIQUE')) return 'Región de Aysén'
  if (t.includes('MAGALLANES') || t.includes('PUNTA ARENAS')) return 'Región de Magallanes'
  return null
}

function extraerComunaDeTexto(texto: string): string | null {
  const t = texto.toUpperCase()
  const COMUNAS = [
    'CONCEPCIÓN', 'CONCEPCION', 'TALCAHUANO', 'CHIGUAYANTE', 'CORONEL', 'CHILLÁN', 'CHILLAN',
    'QUILPUÉ', 'VIÑA DEL MAR', 'VALPARAÍSO', 'VILLA ALEMANA', 'CONCÓN', 'EL TABO', 'NOGALES',
    'SANTIAGO', 'PROVIDENCIA', 'CONCHALÍ', 'PUENTE ALTO', 'LAS CONDES', 'MAIPÚ',
    'ANTOFAGASTA', 'CALAMA', 'MARIA ELENA', 'LA SERENA', 'COQUIMBO', 'TALCA', 'TEMUCO', 'RANCAGUA',
    'ANCUD', 'CAMIÑA'
  ]
  for (const c of COMUNAS) {
    if (t.includes(c)) return c
  }
  return null
}
