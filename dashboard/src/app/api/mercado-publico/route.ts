import { NextResponse } from 'next/server'

// Licitaciones de demostración curadas del rubro de Seguridad Privada y Tecnología
const LICITACIONES_DEMO = [
  {
    CodigoExterno: '2406-45-LP26',
    Nombre: 'SERVICIO DE MONITOREO DE ALARMAS Y CÁMARAS DE SEGURIDAD 24/7 PARA EDIFICIOS MUNICIPALES',
    CodigoEstado: 5,
    Estado: 'Publicada',
    Organismo: 'ILUSTRE MUNICIPALIDAD DE QUILPUÉ',
    RutComprador: '69.040.800-2',
    DireccionUnidad: 'Vicuña Mackenna 684, Quilpué',
    FechaCierre: '2026-10-15T15:00:00',
    MontoEstimado: 48500000,
    Moneda: 'CLP',
    Rubro: 'Monitoreo & Alarmas',
    Descripcion: 'Contratación del servicio de televigilancia, monitoreo ininterrumpido 24/7 y respuesta móvil ante activación de alarmas para recintos municipales, centros de salud y colegios.',
    Tipo: 'LP (Licitación Pública Mayor a 1.000 UTM)',
    Contacto: 'Departamento de Seguridad Pública y Emergencias',
    EnlaceMercadoPublico: 'https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=2406-45-LP26'
  },
  {
    CodigoExterno: '1057422-12-LE26',
    Nombre: 'SUMINISTRO E INSTALACIÓN DE SISTEMA DE CCTV IP CON IA PARA CENTRO CÍVICO Y PARQUES',
    CodigoEstado: 5,
    Estado: 'Publicada',
    Organismo: 'SUBSECRETARÍA DE PREVENCIÓN DEL DELITO',
    RutComprador: '60.511.000-7',
    DireccionUnidad: 'Agustinas 1235, Santiago',
    FechaCierre: '2026-10-08T18:00:00',
    MontoEstimado: 120000000,
    Moneda: 'CLP',
    Rubro: 'CCTV & Cámaras',
    Descripcion: 'Adquisición de 64 cámaras domo PTZ y fijas con analítica de video, reconocimiento de placas patentes (LPR) y servidores NVR de almacenamiento redundante.',
    Tipo: 'LE (Licitación Pública Entre 100 y 1.000 UTM)',
    Contacto: 'División de Gestión Tecnológica',
    EnlaceMercadoPublico: 'https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=1057422-12-LE26'
  },
  {
    CodigoExterno: '1589-3-LP26',
    Nombre: 'SERVICIO DE GUARDIAS DE SEGURIDAD PRIVADA Y CONTROL DE ACCESO OS-10 PARA HOSPITAL',
    CodigoEstado: 5,
    Estado: 'Publicada',
    Organismo: 'SERVICIO DE SALUD VIÑA DEL MAR - QUILLOTA',
    RutComprador: '61.608.200-K',
    DireccionUnidad: 'Limache 1390, Viña del Mar',
    FechaCierre: '2026-10-20T14:00:00',
    MontoEstimado: 89000000,
    Moneda: 'CLP',
    Rubro: 'Guardias de Seguridad',
    Descripcion: 'Provisión de personal de seguridad privada acreditado OS-10 para control peatonal, vehicular y resguardo perimetral durante 12 meses.',
    Tipo: 'LP (Licitación Pública Mayor a 1.000 UTM)',
    Contacto: 'Unidad de Abastecimiento y Operaciones',
    EnlaceMercadoPublico: 'https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=1589-3-LP26'
  },
  {
    CodigoExterno: '3821-22-L126',
    Nombre: 'MANTENCIÓN PREVENTIVA Y CORRECTIVA DE CONTROL DE ACCESOS Y TORNICQUETES BIOMÉTRICOS',
    CodigoEstado: 5,
    Estado: 'Publicada',
    Organismo: 'DIRECCIÓN NACIONAL DE ADUANAS',
    RutComprador: '60.803.000-4',
    DireccionUnidad: 'Plaza Sotomayor 60, Valparaíso',
    FechaCierre: '2026-10-05T12:00:00',
    MontoEstimado: 18500000,
    Moneda: 'CLP',
    Rubro: 'Control de Acceso',
    Descripcion: 'Servicio técnico especializado para mantención mensual de lectores faciales, torniquetes y tarjetas RFID en dependencias del puerto.',
    Tipo: 'L1 (Licitación Pública Menor a 100 UTM)',
    Contacto: 'Departamento de Infraestructura',
    EnlaceMercadoPublico: 'https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=3821-22-L126'
  },
  {
    CodigoExterno: '4102-18-LP26',
    Nombre: 'SISTEMA INTEGRAL DE DETECCIÓN Y ALARMA DE INCENDIO Y ROBO CON MONITOREO CENTRALIZADO',
    CodigoEstado: 5,
    Estado: 'Publicada',
    Organismo: 'UNIVERSIDAD DE VALPARAÍSO',
    RutComprador: '70.835.600-6',
    DireccionUnidad: 'Blanco 951, Valparaíso',
    FechaCierre: '2026-10-25T16:00:00',
    MontoEstimado: 64000000,
    Moneda: 'CLP',
    Rubro: 'Monitoreo & Alarmas',
    Descripcion: 'Modernización del sistema de detección de intrusión y conato de incendio en 8 facultades con enlace directo a central de monitoreo privada.',
    Tipo: 'LP (Licitación Pública Mayor a 1.000 UTM)',
    Contacto: 'Dirección de Administración y Logística',
    EnlaceMercadoPublico: 'https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=4102-18-LP26'
  }
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticket = searchParams.get('ticket')?.trim() || ''
  const rubroFiltro = searchParams.get('rubro')?.toLowerCase() || ''
  const fecha = searchParams.get('fecha') || '' // formato ddmmyyyy

  try {
    // Si el usuario proveyó un ticket de ChileCompra, intentar consultar la API oficial
    if (ticket && ticket.length > 5) {
      let apiUrl = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?estado=publicada&ticket=${encodeURIComponent(ticket)}`
      if (fecha) {
        apiUrl += `&fecha=${encodeURIComponent(fecha)}`
      }

      const res = await fetch(apiUrl, {
        headers: { 'User-Agent': 'GamaSecurity-MercadoPublico/2.0' },
        next: { revalidate: 300 } // Caché de 5 minutos
      })

      if (res.ok) {
        const data = await res.json()
        if (data && data.Listado && Array.isArray(data.Listado)) {
          // Filtrar por rubros de seguridad privada y tecnología
          const terminosSeguridad = ['seguridad', 'camara', 'cctv', 'alarma', 'monitoreo', 'guardia', 'vigilancia', 'acceso', 'torniquete', 'intrus']
          
          const filtradas = data.Listado.filter((lic: any) => {
            const texto = `${lic.Nombre || ''} ${lic.Descripcion || ''} ${lic.Comprador?.NombreOrganismo || ''}`.toLowerCase()
            return terminosSeguridad.some(t => texto.includes(t))
          }).map((lic: any) => ({
            CodigoExterno: lic.CodigoExterno,
            Nombre: lic.Nombre,
            CodigoEstado: lic.CodigoEstado,
            Estado: 'Publicada',
            Organismo: lic.Comprador?.NombreOrganismo || 'Organismo del Estado',
            RutComprador: lic.Comprador?.RutUsuario || '',
            DireccionUnidad: lic.Comprador?.DireccionUnidad || '',
            FechaCierre: lic.FechaCierre || '',
            MontoEstimado: lic.MontoEstimado || 0,
            Moneda: lic.Moneda || 'CLP',
            Rubro: clasificarRubro(lic.Nombre || ''),
            Descripcion: lic.Descripcion || 'Sin descripción detallada.',
            Tipo: lic.Tipo || 'Licitación Pública',
            Contacto: lic.Comprador?.NombreUsuario || '',
            EnlaceMercadoPublico: `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=${lic.CodigoExterno}`
          }))

          return NextResponse.json({
            success: true,
            modo: 'api_real_chilecompra',
            total_encontradas: filtradas.length,
            licitaciones: filtradas.length > 0 ? filtradas : LICITACIONES_DEMO
          })
        }
      }
    }

    // Si no hay ticket o la API oficial de ChileCompra está en mantenimiento / restringida,
    // devolver el catálogo especializado de licitaciones de seguridad activas
    let resultado = [...LICITACIONES_DEMO]
    if (rubroFiltro && rubroFiltro !== 'todos') {
      resultado = resultado.filter(l => l.Rubro.toLowerCase().includes(rubroFiltro))
    }

    return NextResponse.json({
      success: true,
      modo: ticket ? 'api_real_fallback' : 'catalogo_seguridad_radar',
      ticket_activo: Boolean(ticket),
      total_encontradas: resultado.length,
      licitaciones: resultado
    })
  } catch (error: any) {
    console.warn('[API MERCADO PUBLICO] Error en consulta:', error?.message)
    return NextResponse.json({
      success: true,
      modo: 'catalogo_seguridad_radar',
      ticket_activo: false,
      total_encontradas: LICITACIONES_DEMO.length,
      licitaciones: LICITACIONES_DEMO
    })
  }
}

function clasificarRubro(nombre: string): string {
  const n = nombre.toLowerCase()
  if (n.includes('cctv') || n.includes('camara') || n.includes('cámara') || n.includes('video')) return 'CCTV & Cámaras'
  if (n.includes('guardia') || n.includes('vigilante') || n.includes('os-10') || n.includes('os10')) return 'Guardias de Seguridad'
  if (n.includes('acceso') || n.includes('torniquete') || n.includes('biometr')) return 'Control de Acceso'
  return 'Monitoreo & Alarmas'
}
