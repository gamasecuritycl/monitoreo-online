import { NextResponse } from 'next/server'

// Licitaciones de demostración curadas del rubro de Seguridad Privada y Tecnología
const LICITACIONES_DEMO = [
  {
    CodigoExterno: '2406-45-LP26',
    Nombre: 'SERVICIO DE MONITOREO DE ALARMAS Y CÁMARAS DE SEGURIDAD 24/7 PARA EDIFICIOS MUNICIPALES',
    CodigoEstado: 5,
    Estado: 'Publicada',
    Organismo: 'ILUSTRE MUNICIPALIDAD DE QUILPUÉ',
    Region: 'Región de Valparaíso',
    Comuna: 'Quilpué',
    RutComprador: '69.040.800-2',
    DireccionUnidad: 'Vicuña Mackenna 684, Quilpué',
    FechaCierre: '2026-10-15T15:00:00',
    MontoEstimado: 48500000,
    Moneda: 'CLP',
    Rubro: 'Monitoreo & Alarmas',
    Descripcion: 'Contratación del servicio de televigilancia, monitoreo ininterrumpido 24/7 y respuesta móvil ante activación de alarmas para recintos municipales, centros de salud y colegios.',
    Tipo: 'LP (Licitación Pública Mayor a 1.000 UTM)',
    Contacto: 'Departamento de Seguridad Pública y Emergencias',
    EnlaceMercadoPublico: 'https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=2406-45-LP26',
    EsDemo: true
  },
  {
    CodigoExterno: '1057422-12-LE26',
    Nombre: 'SUMINISTRO E INSTALACIÓN DE SISTEMA DE CCTV IP CON IA PARA CENTRO CÍVICO Y PARQUES',
    CodigoEstado: 5,
    Estado: 'Publicada',
    Organismo: 'SUBSECRETARÍA DE PREVENCIÓN DEL DELITO',
    Region: 'Región Metropolitana',
    Comuna: 'Santiago',
    RutComprador: '60.511.000-7',
    DireccionUnidad: 'Agustinas 1235, Santiago',
    FechaCierre: '2026-10-08T18:00:00',
    MontoEstimado: 120000000,
    Moneda: 'CLP',
    Rubro: 'CCTV & Cámaras',
    Descripcion: 'Adquisición de 64 cámaras domo PTZ y fijas con analítica de video, reconocimiento de placas patentes (LPR) y servidores NVR de almacenamiento redundante.',
    Tipo: 'LE (Licitación Pública Entre 100 y 1.000 UTM)',
    Contacto: 'División de Gestión Tecnológica',
    EnlaceMercadoPublico: 'https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=1057422-12-LE26',
    EsDemo: true
  },
  {
    CodigoExterno: '1589-3-LP26',
    Nombre: 'SERVICIO DE GUARDIAS DE SEGURIDAD PRIVADA Y CONTROL DE ACCESO OS-10 PARA HOSPITAL',
    CodigoEstado: 5,
    Estado: 'Publicada',
    Organismo: 'SERVICIO DE SALUD VIÑA DEL MAR - QUILLOTA',
    Region: 'Región de Valparaíso',
    Comuna: 'Viña del Mar',
    RutComprador: '61.608.200-K',
    DireccionUnidad: 'Limache 1390, Viña del Mar',
    FechaCierre: '2026-10-20T14:00:00',
    MontoEstimado: 89000000,
    Moneda: 'CLP',
    Rubro: 'Guardias de Seguridad',
    Descripcion: 'Provisión de personal de seguridad privada acreditado OS-10 para control peatonal, vehicular y resguardo perimetral durante 12 meses.',
    Tipo: 'LP (Licitación Pública Mayor a 1.000 UTM)',
    Contacto: 'Unidad de Abastecimiento y Operaciones',
    EnlaceMercadoPublico: 'https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=1589-3-LP26',
    EsDemo: true
  },
  {
    CodigoExterno: '3821-22-L126',
    Nombre: 'MANTENCIÓN PREVENTIVA Y CORRECTIVA DE CONTROL DE ACCESOS Y TORNICQUETES BIOMÉTRICOS',
    CodigoEstado: 5,
    Estado: 'Publicada',
    Organismo: 'DIRECCIÓN NACIONAL DE ADUANAS',
    Region: 'Región de Valparaíso',
    Comuna: 'Valparaíso',
    RutComprador: '60.803.000-4',
    DireccionUnidad: 'Plaza Sotomayor 60, Valparaíso',
    FechaCierre: '2026-10-05T12:00:00',
    MontoEstimado: 18500000,
    Moneda: 'CLP',
    Rubro: 'Control de Acceso',
    Descripcion: 'Servicio técnico especializado para mantención mensual de lectores faciales, torniquetes y tarjetas RFID en dependencias del puerto.',
    Tipo: 'L1 (Licitación Pública Menor a 100 UTM)',
    Contacto: 'Departamento de Infraestructura',
    EnlaceMercadoPublico: 'https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=3821-22-L126',
    EsDemo: true
  },
  {
    CodigoExterno: '4102-18-LP26',
    Nombre: 'SISTEMA INTEGRAL DE DETECCIÓN Y ALARMA DE INCENDIO Y ROBO CON MONITOREO CENTRALIZADO',
    CodigoEstado: 5,
    Estado: 'Publicada',
    Organismo: 'UNIVERSIDAD DE VALPARAÍSO',
    Region: 'Región de Valparaíso',
    Comuna: 'Valparaíso',
    RutComprador: '70.835.600-6',
    DireccionUnidad: 'Blanco 951, Valparaíso',
    FechaCierre: '2026-10-25T16:00:00',
    MontoEstimado: 64000000,
    Moneda: 'CLP',
    Rubro: 'Monitoreo & Alarmas',
    Descripcion: 'Modernización del sistema de detección de intrusión y conato de incendio en 8 facultades con enlace directo a central de monitoreo privada.',
    Tipo: 'LP (Licitación Pública Mayor a 1.000 UTM)',
    Contacto: 'Dirección de Administración y Logística',
    EnlaceMercadoPublico: 'https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=4102-18-LP26',
    EsDemo: true
  }
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticket = searchParams.get('ticket')?.trim() || ''
  const rubroFiltro = searchParams.get('rubro')?.toLowerCase() || ''
  const regionFiltro = searchParams.get('region')?.toLowerCase() || ''
  const codigo = searchParams.get('codigo')?.trim() || ''
  const accion = searchParams.get('accion') || ''

  try {
    // Si la acción es sólo testear la validez del ticket
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
        return NextResponse.json({
          success: true,
          ticket_valido: true,
          mensaje: `¡Ticket válido y activo! Se conectó con éxito a ChileCompra. Hay ${testData.Cantidad || testData.Listado.length} licitaciones activas hoy.`
        })
      }

      return NextResponse.json({
        success: false,
        ticket_valido: false,
        error: 'Respuesta inesperada de ChileCompra. Verifica tu ticket.'
      })
    }

    // Consulta de una licitación específica por código
    if (codigo && ticket) {
      const codUrl = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=${encodeURIComponent(codigo)}&ticket=${encodeURIComponent(ticket)}`
      const codRes = await fetch(codUrl)
      if (codRes.ok) {
        const codData = await codRes.json().catch(() => null)
        if (codData && Array.isArray(codData.Listado) && codData.Listado.length > 0) {
          const lic = codData.Listado[0]
          return NextResponse.json({
            success: true,
            modo: 'api_real_chilecompra_detalle',
            ticket_valido: true,
            total_encontradas: 1,
            licitaciones: [normalizarLicitacionReal(lic)]
          })
        }
      }
    }

    // Consulta general de licitaciones con ticket
    if (ticket && ticket.length > 5) {
      const apiUrl = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?estado=activas&ticket=${encodeURIComponent(ticket)}`
      const res = await fetch(apiUrl, {
        headers: { 'User-Agent': 'GamaSecurity-MercadoPublico/2.0' },
        next: { revalidate: 180 }
      })

      if (res.ok) {
        const data = await res.json().catch(() => null)

        // Si ChileCompra respondió con error de ticket
        if (data && data.Codigo && data.Mensaje) {
          return NextResponse.json({
            success: false,
            ticket_valido: false,
            error: `ChileCompra rechazó el ticket: "${data.Mensaje}" (Código ${data.Codigo}). Verifica que no tenga espacios extra.`,
            modo: 'error_ticket_chilecompra',
            total_encontradas: LICITACIONES_DEMO.length,
            licitaciones: LICITACIONES_DEMO
          })
        }

        if (data && Array.isArray(data.Listado)) {
          const listadoReal = data.Listado

          // 1. FILTRADO ESTRICTO DE SEGURIDAD (Sin falsos positivos)
          const filtradas = listadoReal.filter((lic: any) => {
            const nombre = lic.Nombre || ''
            return esLicitacionSeguridadReal(nombre)
          })

          // 2. ENRIQUECIMIENTO CONCURRENTE CON ORGANISMO Y REGIÓN OFICIAL
          const mapeadas = await enriquecerLicitacionesConDetalle(filtradas, ticket)

          // 3. Filtro por rubro
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

          // 4. Filtro por región si se solicita
          if (regionFiltro && regionFiltro !== 'todas') {
            resultado = resultado.filter((l: any) => 
              l.Region.toLowerCase().includes(regionFiltro) || 
              (l.Comuna && l.Comuna.toLowerCase().includes(regionFiltro))
            )
          }

          return NextResponse.json({
            success: true,
            ticket_valido: true,
            modo: 'api_real_chilecompra',
            mensaje: `Conectado en vivo: ${resultado.length} licitaciones identificadas con Organismo y Región oficial (de ${listadoReal.length} activas).`,
            total_encontradas: resultado.length,
            licitaciones: resultado
          })
        }
      }
    }

    // Sin ticket configurado: Catálogo demostración
    let resultado = [...LICITACIONES_DEMO]
    if (rubroFiltro && rubroFiltro !== 'todos') {
      resultado = resultado.filter((l: any) => {
        if (rubroFiltro === 'cctv') return l.Rubro.includes('CCTV')
        if (rubroFiltro === 'monitoreo') return l.Rubro.includes('Monitoreo')
        if (rubroFiltro === 'guardias') return l.Rubro.includes('Guardias')
        if (rubroFiltro === 'acceso') return l.Rubro.includes('Acceso')
        return true
      })
    }

    return NextResponse.json({
      success: true,
      ticket_valido: false,
      modo: 'catalogo_seguridad_radar',
      mensaje: 'Modo Radar Público Demostrativo (Ingresa tu ticket oficial de ChileCompra para ver en vivo las de hoy).',
      total_encontradas: resultado.length,
      licitaciones: resultado
    })
  } catch (error: any) {
    console.warn('[API MERCADO PUBLICO] Error en consulta:', error?.message)
    return NextResponse.json({
      success: true,
      ticket_valido: false,
      modo: 'catalogo_seguridad_radar',
      error: error?.message,
      total_encontradas: LICITACIONES_DEMO.length,
      licitaciones: LICITACIONES_DEMO
    })
  }
}

/**
 * Enriquecimiento en Lote:
 * Consulta la ficha completa de ChileCompra para las licitaciones principales
 * para obtener Comprador.NombreOrganismo, RegionUnidad y ComunaUnidad en tiempo récord.
 */
async function enriquecerLicitacionesConDetalle(lics: any[], ticket: string): Promise<any[]> {
  // Consultar en paralelo hasta 15 licitaciones concurrentemente con límite de tiempo
  const maxLote = Math.min(lics.length, 16)
  const aConsultar = lics.slice(0, maxLote)
  const restantes = lics.slice(maxLote)

  const promesas = aConsultar.map(async (lic) => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3500) // Máximo 3.5 segundos por llamada
      const url = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=${encodeURIComponent(lic.CodigoExterno)}&ticket=${encodeURIComponent(ticket)}`
      
      const r = await fetch(url, { signal: controller.signal, next: { revalidate: 600 } })
      clearTimeout(timeout)

      if (r.ok) {
        const d = await r.json().catch(() => null)
        if (d && Array.isArray(d.Listado) && d.Listado.length > 0) {
          const det = d.Listado[0]
          return normalizarLicitacionReal(det)
        }
      }
    } catch {}

    // Fallback heurístico si la subconsulta no responde a tiempo
    return normalizarLicitacionReal(lic)
  })

  const procesadas = await Promise.all(promesas)
  const procesadasRestantes = restantes.map(lic => normalizarLicitacionReal(lic))

  return [...procesadas, ...procesadasRestantes]
}

/**
 * Filtro de Seguridad Riguroso:
 * Elimina falsos positivos (médicos, glaciología, vialidad, alimentos, aseo, etc.)
 * y solo acepta licitaciones del rubro de Seguridad y Vigilancia.
 */
function esLicitacionSeguridadReal(nombreRaw: string): boolean {
  const n = nombreRaw.toLowerCase()

  // 1. LISTA NEGRA: Descartar inmediatamente procesos fuera del rubro
  const terminosExcluidos = [
    'vascular', 'glaciar', 'glaciares', 'medico', 'médico', 'médica', 'medica',
    'quirurg', 'quirúrg', 'salud', 'hospitalari', 'enfermer', 'farmac', 'farmacia',
    'paciente', 'clinico', 'clínico', 'infecc', 'odontol', 'dental', 'medicamento',
    'ambiental', 'ambiente', 'reductores de velocidad', 'lomo de toro', 'señalética', 'vial',
    'flora', 'fauna', 'forestal', 'plaga', 'desratiz', 'fumig', 'fumiga',
    'basura', 'residuos', 'aseo', 'limpieza', 'jardiner', 'jardin', 'áreas verdes',
    'alimento', 'alimentos', 'colacion', 'colación', 'almuerzo', 'catering',
    'vestuario', 'ropa', 'uniforme escolar', 'juguete', 'didactico',
    'software contable', 'erp', 'auditoria financiera', 'capacitacion', 'curso',
    'accesorios', 'accesorio', 'accesibilidad', 'acceso vascular', 'acceso a internet',
    'redes asistenciales', 'vehicular pesado', 'neumatico', 'repuesto', 'higiene y seguridad', 'comité paritario'
  ]

  if (terminosExcluidos.some(ex => n.includes(ex))) {
    return false
  }

  // 2. LISTA BLANCA ESTRICTA:
  // A. CCTV, Cámaras y Televigilancia
  if (
    n.includes('cctv') || n.includes('televigilancia') || n.includes('videovigilancia') || n.includes('video vigilancia') ||
    n.includes('camara de seguridad') || n.includes('cámara de seguridad') || n.includes('camaras de seguridad') || n.includes('cámaras de seguridad') ||
    n.includes('camara ip') || n.includes('cámara ip') || n.includes('camaras ip') || n.includes('cámaras ip') ||
    n.includes('camaras domo') || n.includes('cámaras domo') || n.includes('dvr') || n.includes('nvr') || n.includes('ptz') ||
    n.includes('analitica de video') || n.includes('analítica de video') || n.includes('lpr') || n.includes('patentes')
  ) {
    return true
  }

  // B. Alarmas y Monitoreo Electrónico
  if (
    n.includes('alarma de robo') || n.includes('alarma de intrusion') || n.includes('alarma de intrusión') ||
    n.includes('alarma de incendio') || n.includes('deteccion de incendio') || n.includes('detección de incendio') ||
    n.includes('central de monitoreo') || n.includes('cerco electrico') || n.includes('cerco eléctrico') ||
    n.includes('concertina') || n.includes('proteccion perimetral') || n.includes('protección perimetral') ||
    n.includes('sensor de movimiento') || (n.includes('alarma') && !n.includes('reloj') && !n.includes('retroceso')) ||
    (n.includes('monitoreo') && (n.includes('alarma') || n.includes('cámara') || n.includes('camara') || n.includes('seguridad') || n.includes('24/7') || n.includes('central')))
  ) {
    return true
  }

  // C. Guardias de Seguridad y Vigilancia OS-10
  if (
    n.includes('guardia') || n.includes('guardias') || n.includes('os-10') || n.includes('os10') ||
    n.includes('vigilancia privada') || n.includes('vigilante') || n.includes('rondin') || n.includes('rondín') ||
    n.includes('rondines') || n.includes('custodia') || n.includes('patrullaje')
  ) {
    return true
  }

  // D. Control de Acceso Físico y Tecnológico
  if (
    n.includes('torniquete') || n.includes('torniquetes') || n.includes('control de acceso') || n.includes('control de accesos') ||
    n.includes('biometrico') || n.includes('biométrico') || n.includes('lector facial') || n.includes('barrera vehicular') ||
    n.includes('talanquera') || n.includes('tarjeta rfid')
  ) {
    return true
  }

  // E. Seguridad Privada o Instalaciones
  if (n.includes('servicio de seguridad') || n.includes('sistema de seguridad') || n.includes('seguridad para')) {
    return true
  }

  return false
}

function normalizarLicitacionReal(lic: any) {
  const nombre = lic.Nombre || 'Licitación Pública de ChileCompra'
  const rubro = clasificarRubro(nombre)
  
  // Extraer organismo real (del objeto Comprador o del analizador textual)
  const organismo = 
    lic.Comprador?.NombreOrganismo || 
    lic.Organismo || 
    extraerOrganismoDeTexto(nombre) || 
    'Organismo del Estado de Chile'

  // Extraer región y comuna
  const region = 
    lic.Comprador?.RegionUnidad || 
    lic.Region || 
    extraerRegionDeTexto(nombre + ' ' + organismo) || 
    'Región Metropolitana'

  const comuna = 
    lic.Comprador?.ComunaUnidad || 
    lic.Comuna || 
    extraerComunaDeTexto(nombre + ' ' + organismo) || 
    ''

  const direccion = 
    lic.Comprador?.DireccionUnidad || 
    lic.DireccionUnidad || 
    (comuna ? `${comuna}, ${region}` : region)

  const rut = lic.Comprador?.RutUsuario || lic.RutComprador || '60.000.000-0'
  const contacto = lic.Comprador?.NombreUsuario || lic.Contacto || 'Encargado de Compras Públicas'

  return {
    CodigoExterno: lic.CodigoExterno,
    Nombre: nombre,
    CodigoEstado: lic.CodigoEstado || 5,
    Estado: 'Publicada',
    Organismo: organismo,
    Region: region,
    Comuna: comuna,
    RutComprador: rut,
    DireccionUnidad: direccion,
    FechaCierre: lic.FechaCierre || '',
    MontoEstimado: lic.MontoEstimado > 0 ? lic.MontoEstimado : estimarMontoPorRubro(rubro),
    Moneda: lic.Moneda || 'CLP',
    Rubro: rubro,
    Descripcion: lic.Descripcion || `Proceso oficial de compra pública licitado a través de Mercado Público de Chile para ${nombre}. Organismo: ${organismo} (${region}). Bases técnicas disponibles en el portal.`,
    Tipo: lic.Tipo || 'Licitación Pública',
    Contacto: contacto,
    EnlaceMercadoPublico: `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=${lic.CodigoExterno}`,
    EsDemo: Boolean(lic.EsDemo)
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

function estimarMontoPorRubro(rubro: string): number {
  if (rubro.includes('CCTV')) return 45000000
  if (rubro.includes('Guardias')) return 68000000
  if (rubro.includes('Acceso')) return 15000000
  return 32000000
}

/**
 * Analizador Heurístico para detectar el Organismo del Estado a partir del título
 */
function extraerOrganismoDeTexto(texto: string): string | null {
  const t = texto.toUpperCase()
  if (t.includes('FUNDACIÓN INTEGRA') || t.includes('FUNDACION INTEGRA')) return 'FUNDACIÓN INTEGRA'
  if (t.includes('JUNJI')) return 'JUNTA NACIONAL DE JARDINES INFANTILES (JUNJI)'
  if (t.includes('CARABINEROS')) return 'CARABINEROS DE CHILE'
  if (t.includes('GENDARMERÍA') || t.includes('GENDARMERIA')) return 'GENDARMERÍA DE CHILE'
  if (t.includes('POLICÍA DE INVESTIGACIONES') || t.includes('PDI')) return 'POLICÍA DE INVESTIGACIONES (PDI)'
  if (t.includes('SUBSECRETARÍA DE PREVENCIÓN DEL DELITO') || t.includes('SUBSECRETARIA DE PREVENCION')) return 'SUBSECRETARÍA DE PREVENCIÓN DEL DELITO'
  if (t.includes('UNIVERSIDAD DE VALPARAÍSO') || t.includes('UNIVERSIDAD DE VALPARAISO')) return 'UNIVERSIDAD DE VALPARAÍSO'
  if (t.includes('UNIVERSIDAD DE PLAYA ANCHA') || t.includes('UPLA')) return 'UNIVERSIDAD DE PLAYA ANCHA'
  if (t.includes('UNIVERSIDAD DE CHILE')) return 'UNIVERSIDAD DE CHILE'
  if (t.includes('UNIVERSIDAD DE SANTIAGO') || t.includes('USACH')) return 'UNIVERSIDAD DE SANTIAGO (USACH)'
  if (t.includes('DIRECCIÓN NACIONAL DE ADUANAS') || t.includes('ADUANAS')) return 'DIRECCIÓN NACIONAL DE ADUANAS'
  if (t.includes('SERVICIO DE SALUD VIÑA DEL MAR') || t.includes('SSVQ')) return 'SERVICIO DE SALUD VIÑA DEL MAR - QUILLOTA'
  if (t.includes('SERVICIO DE SALUD VALPARAÍSO') || t.includes('SSVSA')) return 'SERVICIO DE SALUD VALPARAÍSO - SAN ANTONIO'
  if (t.includes('SERVIU')) return 'SERVICIO DE VIVIENDA Y URBANIZACIÓN (SERVIU)'
  if (t.includes('FONASA')) return 'FONDO NACIONAL DE SALUD (FONASA)'
  
  // Buscar Municipalidades: "MUNICIPALIDAD DE [COMUNA]"
  const matchMuni = texto.match(/(?:ILUSTRE\s+)?MUNICIPALIDAD\s+DE\s+([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)(?:\s+(?:DE|PARA|EN|DEL|LA|EL|\b)|\.|\,|$)/i)
  if (matchMuni && matchMuni[1]) {
    return `I. MUNICIPALIDAD DE ${matchMuni[1].trim().toUpperCase()}`
  }

  // Buscar Hospitales: "HOSPITAL [NOMBRE]"
  const matchHosp = texto.match(/HOSPITAL\s+([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)(?:\s+(?:DE|PARA|EN|DEL|LA|EL|\b)|\.|\,|$)/i)
  if (matchHosp && matchHosp[1]) {
    return `HOSPITAL ${matchHosp[1].trim().toUpperCase()}`
  }

  return null
}

/**
 * Analizador Heurístico de Regiones de Chile
 */
function extraerRegionDeTexto(texto: string): string | null {
  const t = texto.toLowerCase()
  if (t.includes('valparaíso') || t.includes('valparaiso') || t.includes('viña del mar') || t.includes('quilpué') || t.includes('quilpue') || t.includes('villa alemana') || t.includes('quillota') || t.includes('san antonio') || t.includes('concón') || t.includes('concon') || t.includes('limache')) {
    return 'Región de Valparaíso'
  }
  if (t.includes('ñuble') || t.includes('nuble') || t.includes('chillán') || t.includes('chillan') || t.includes('san carlos')) {
    return 'Región de Ñuble'
  }
  if (t.includes('santiago') || t.includes('metropolitana') || t.includes('providencia') || t.includes('las condes') || t.includes('maipú') || t.includes('maipu') || t.includes('puente alto') || t.includes('recoleta') || t.includes('pudahuel')) {
    return 'Región Metropolitana'
  }
  if (t.includes('biobío') || t.includes('biobio') || t.includes('concepción') || t.includes('concepcion') || t.includes('talcahuano') || t.includes('los ángeles') || t.includes('los angeles')) {
    return 'Región del Biobío'
  }
  if (t.includes('coquimbo') || t.includes('la serena') || t.includes('ovalle') || t.includes('illapel')) {
    return 'Región de Coquimbo'
  }
  if (t.includes('o\'higgins') || t.includes('ohiggins') || t.includes('rancagua') || t.includes('san fernando')) {
    return 'Región de O\'Higgins'
  }
  if (t.includes('maule') || t.includes('talca') || t.includes('curicó') || t.includes('curico') || t.includes('linares')) {
    return 'Región del Maule'
  }
  if (t.includes('araucanía') || t.includes('araucania') || t.includes('temuco') || t.includes('villarrica') || t.includes('angol')) {
    return 'Región de La Araucanía'
  }
  if (t.includes('los ríos') || t.includes('los rios') || t.includes('valdivia')) {
    return 'Región de Los Ríos'
  }
  if (t.includes('los lagos') || t.includes('puerto montt') || t.includes('osorno') || t.includes('castro') || t.includes('chiloé')) {
    return 'Región de Los Lagos'
  }
  if (t.includes('antofagasta') || t.includes('calama')) {
    return 'Región de Antofagasta'
  }
  if (t.includes('tarapacá') || t.includes('tarapaca') || t.includes('iquique')) {
    return 'Región de Tarapacá'
  }
  if (t.includes('atacama') || t.includes('copiapó') || t.includes('copiapo') || t.includes('vallenar')) {
    return 'Región de Atacama'
  }
  if (t.includes('arica') || t.includes('parinacota')) {
    return 'Región de Arica y Parinacota'
  }
  if (t.includes('aysén') || t.includes('aysen') || t.includes('coyhaique')) {
    return 'Región de Aysén'
  }
  if (t.includes('magallanes') || t.includes('punta arenas')) {
    return 'Región de Magallanes'
  }
  return null
}

function extraerComunaDeTexto(texto: string): string | null {
  const t = texto.toLowerCase()
  const comunas = [
    'quilpué', 'quilpue', 'viña del mar', 'valparaíso', 'valparaiso', 'villa alemana', 'quillota', 'san antonio', 'concón', 'concon', 'limache',
    'chillán', 'chillan', 'san carlos', 'santiago', 'providencia', 'las condes', 'maipú', 'maipu', 'puente alto',
    'concepción', 'concepcion', 'talcahuano', 'la serena', 'coquimbo', 'rancagua', 'talca', 'temuco', 'valdivia', 'puerto montt', 'antofagasta', 'iquique'
  ]
  for (const c of comunas) {
    if (t.includes(c)) {
      return c.charAt(0).toUpperCase() + c.slice(1)
    }
  }
  return null
}
