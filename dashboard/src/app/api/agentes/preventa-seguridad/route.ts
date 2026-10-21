import { NextRequest, NextResponse } from 'next/server'

interface EquipoItem {
  sku: string
  marca: 'DSC' | 'Paradox' | 'Crow' | 'Vetti' | 'Dahua' | 'Hikvision' | 'Western Digital' | 'Insumos'
  categoria: 'Alarma' | 'CCTV' | 'Sensor' | 'Comunicador' | 'Almacenamiento' | 'Insumo' | 'Mano de Obra'
  modelo: string
  descripcion: string
  cantidad: number
  precioUnitarioNeto: number
  subtotalNeto: number
}

interface PresupuestoEstructurado {
  folioSugerido: string
  clienteNombre: string
  tipoPropiedad: string
  modalidad: 'con_monitoreo' | 'proyecto_cerrado'
  equipos: EquipoItem[]
  subtotalEquiposNeto: number
  manoDeObraNeto: number
  subtotalNetoTotal: number
  iva19: number
  totalBruto: number
  cuotaMonitoreoUF?: number
  cuotaMonitoreoCLP?: number
  observacionesTecnicas: string[]
  tiempoEstimadoInstalacionDias: number
  garantiaMeses: number
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      mensaje = '',
      historial = [],
      modalidadPreferida = 'con_monitoreo', // 'con_monitoreo' | 'proyecto_cerrado'
      cliente = {
        nombre: 'Cliente Particular',
        comuna: 'Santiago',
        tipoRecinto: 'Casa Residencial'
      }
    } = body

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY

    const systemPrompt = `
Eres Gonzalo Ramos, Ingeniero Preventa Senior y Especialista en Diseño de Proyectos de Seguridad Electrónica de Gama Seguridad SpA (Santiago de Chile, 25 años de trayectoria).
Tu trato con Tomás Toro-Moreno (CEO & Fundador) es cercano, altamente técnico, certero y profesional. Conoces al revés y al derecho las normas técnicas, marcas oficiales, protocolos de cableado y precios de mercado en Chile.

TUS ESPECIALIDADES TÉCNICAS RIGUROSAS:
1. ALARMAS CABLEADAS E HÍBRIDAS:
   - DSC PowerSeries Neo (paneles HS2016, HS2032, HS2064, teclados HS2LCD, sensores cableados LC-100-PI antimascota hasta 25kg, LC-104-PIMW doble tecnología microondas, comunicadores TL280 IP y celulares LE2080 4G).
   - Paradox Spectra (SP4000, SP5500, SP6000), EVO192, teclados K32LCD+, sensores digitales NV5, barreras exteriores NV780MX, módulos IP150+.
   - Crow Runner 8/16.
2. ALARMAS INALÁMBRICAS:
   - Vetti Security (paneles híbridos WiFi/GSM, contactos magnéticos inalámbricos, PIR antimascota, sirenas solares para exterior, App Vetti).
   - Hikvision AX PRO (paneles DS-PWA64/96, sensores con cámara PIRCAM DS-PDPC12P-EG2, repetidores de señal).
   - Dahua Airfly (sensores inalámbricos 433/868MHz).
3. CCTV & VIDEOVIGILANCIA IP / HD:
   - Dahua WizSense & TiOC (Active Deterrence con luces disuasivas rojo/azul, sirena integrada 110dB, audio bidireccional, SMD Plus con filtro de mascotas y árboles). NVRs serie 4000/5000 4K.
   - Hikvision AcuSense & ColorVu (visión nocturna 24/7 a color real con luz cálida sin infrarrojos oscuros, detección perimetral de personas y vehículos).
   - Discos duros específicos para videovigilancia 24/7: Western Digital Purple (1TB, 2TB, 4TB, 6TB).
   - Switches PoE Gigabit (4, 8, 16 puertos) y cable UTP 100% Cobre Categoría 6 exterior con protección UV.

POLÍTICA COMERCIAL DE GAMA SEGURIDAD:
- FILOSOFÍA ANTI-COMODATO: El cliente SIEMPRE es el dueño de sus equipos desde el día 1. Cero letras chicas de 48 meses.
- MODALIDADES:
  A) "con_monitoreo": El cliente compra su equipamiento + instalación profesional y contrata el plan de Monitoreo Real 24/7 con Operadores Humanos Gama.
     * Residencial: 0.85 UF a 1.25 UF + IVA mensual.
     * Comercial / Pyme: 1.20 UF a 1.80 UF + IVA mensual.
     * Industrial / Bodegas: 1.80 UF a 3.00 UF + IVA mensual.
     (Considerar UF referencial a $39.500 CLP).
  B) "proyecto_cerrado": Venta e instalación llave en mano con garantía técnica de 12 meses, sin cuota mensual de monitoreo.

TU MISIÓN:
Analizar la solicitud de Tomás, formular una respuesta técnica y comercial contundente y devolver OBLIGATORIAMENTE un JSON estructurado para que el sistema genere el presupuesto PDF oficial.

Estructura de respuesta esperada (responde estrictamente en formato JSON válido sin bloques markdown decorativos):
{
  "analisisTecnico": "Texto explicativo detallado con justificación de equipos, vulnerabilidades cubiertas y consideraciones técnicas (evitar falsas alarmas, tipo de cableado, ubicación estratégica de cámaras y detectores).",
  "recomendacionDirecta": "Resumen ejecutivo en 2 líneas para Tomás.",
  "presupuesto": {
    "folioSugerido": "COT-2026-XXXX",
    "clienteNombre": "${cliente.nombre || 'Cliente Gama'}",
    "tipoPropiedad": "${cliente.tipoRecinto || 'Residencial'}",
    "modalidad": "${modalidadPreferida}",
    "equipos": [
      {
        "sku": "DSC-HS2032-KIT",
        "marca": "DSC",
        "categoria": "Alarma",
        "modelo": "HS2032PCBSPA",
        "descripcion": "Central de Alarma DSC Neo 8 zonas expandible a 32 + Gabinete + Transformador",
        "cantidad": 1,
        "precioUnitarioNeto": 98000,
        "subtotalNeto": 98000
      }
    ],
    "subtotalEquiposNeto": 98000,
    "manoDeObraNeto": 85000,
    "subtotalNetoTotal": 183000,
    "iva19": 34770,
    "totalBruto": 217770,
    "cuotaMonitoreoUF": 0.95,
    "cuotaMonitoreoCLP": 37525,
    "observacionesTecnicas": [
      "Instalación bajo norma técnica de seguridad privada OS-10.",
      "Garantía de 12 meses sobre equipamiento y conexionado.",
      "Conexión directa a Central de Monitoreo 24/7 Gama con respuesta en 15 segundos."
    ],
    "tiempoEstimadoInstalacionDias": 1,
    "garantiaMeses": 12
  }
}
`

    let resultadoFinal: any = null

    if (GEMINI_API_KEY) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: systemPrompt },
                  { text: `Mensaje de Tomás: "${mensaje}". Modalidad: ${modalidadPreferida}. Cliente: ${JSON.stringify(cliente)}` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.25,
              responseMimeType: 'application/json'
            }
          })
        })

        const data = await res.json()
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (rawText) {
          resultadoFinal = JSON.parse(rawText)
        }
      } catch (err: any) {
        console.warn('Error llamando Gemini en preventa-seguridad, usando fallback experto:', err.message)
      }
    }

    // Fallback experto si no hay respuesta de IA o falla conexión
    if (!resultadoFinal) {
      const esCctv = mensaje.toLowerCase().includes('camara') || mensaje.toLowerCase().includes('cctv')
      const esParcela = mensaje.toLowerCase().includes('parcela') || mensaje.toLowerCase().includes('perro') || mensaje.toLowerCase().includes('perimetr')

      let equiposFallback: EquipoItem[] = []
      let analisisFallback = ''
      let moFallback = 95000
      let planUfFallback = modalidadPreferida === 'con_monitoreo' ? 0.95 : undefined

      if (esParcela) {
        analisisFallback = 'Para parcelas o perímetros con presencia de mascotas, es crítico descartar el uso de PIRs comunes. Se diseña una solución híbrida con DSC Neo y detectores de exterior LC-104-PIMW con discriminación de masa de hasta 25kg, combinada con cámaras disuasivas Dahua TiOC que activan luz estroboscópica y advertencia sonora antes del forzamiento.'
        equiposFallback = [
          { sku: 'DSC-NEO-32', marca: 'DSC', categoria: 'Alarma', modelo: 'HS2032', descripcion: 'Central DSC Neo 8 a 32 zonas híbrida con gabinete y fuente', cantidad: 1, precioUnitarioNeto: 115000, subtotalNeto: 115000 },
          { sku: 'DSC-LCD-PRO', marca: 'DSC', categoria: 'Alarma', modelo: 'HS2LCDRF9', descripcion: 'Teclado alfanumérico Neo con receptor inalámbrico PowerG integrado', cantidad: 1, precioUnitarioNeto: 82000, subtotalNeto: 82000 },
          { sku: 'DSC-LC104', marca: 'DSC', categoria: 'Sensor', modelo: 'LC-104-PIMW', descripcion: 'Detector exterior doble tecnología antimascota e intemperie IP54', cantidad: 4, precioUnitarioNeto: 38000, subtotalNeto: 152000 },
          { sku: 'DAH-TIOC-4MP', marca: 'Dahua', categoria: 'CCTV', modelo: 'IPC-HFW3449T-AS-PV', descripcion: 'Cámara Bullet 4MP TiOC Disuasión Activa luz/sirena + analítica humana', cantidad: 2, precioUnitarioNeto: 69000, subtotalNeto: 138000 },
          { sku: 'DAH-NVR-4K', marca: 'Dahua', categoria: 'CCTV', modelo: 'NVR4104HS-P-4KS2/L', descripcion: 'NVR 4 canales 4K con 4 puertos PoE independientes', cantidad: 1, precioUnitarioNeto: 89000, subtotalNeto: 89000 },
          { sku: 'WD-PURPLE-2TB', marca: 'Western Digital', categoria: 'Almacenamiento', modelo: 'WD23PURZ', descripcion: 'Disco duro WD Purple 2TB diseñado para vigilancia continua 24/7', cantidad: 1, precioUnitarioNeto: 68000, subtotalNeto: 68000 },
          { sku: 'INS-CABLE-EXT', marca: 'Insumos', categoria: 'Insumo', modelo: 'UTP-CAT6-UV', descripcion: 'Insumos de montaje, conduit exterior UV, cajas estancas y conectores', cantidad: 1, precioUnitarioNeto: 45000, subtotalNeto: 45000 }
        ]
        moFallback = 140000
        planUfFallback = modalidadPreferida === 'con_monitoreo' ? 1.20 : undefined
      } else if (esCctv) {
        analisisFallback = 'Diseño enfocado en videovigilancia inteligente Dahua WizSense con NVR 4K y compresión H.265+. Las cámaras incorporan analítica SMD Plus para filtrar movimiento de árboles y lluvia, enviando avisos instantáneos al smartphone.'
        equiposFallback = [
          { sku: 'DAH-NVR-4K', marca: 'Dahua', categoria: 'CCTV', modelo: 'NVR4108HS-8P-4KS2', descripcion: 'NVR 8 canales 4K con 8 puertos PoE integrados', cantidad: 1, precioUnitarioNeto: 125000, subtotalNeto: 125000 },
          { sku: 'DAH-CAM-4MP', marca: 'Dahua', categoria: 'CCTV', modelo: 'IPC-HDW2431T-AS-S2', descripcion: 'Domo IP 4MP WizSense IR 30m micrófono incorporado IP67', cantidad: 4, precioUnitarioNeto: 49000, subtotalNeto: 196000 },
          { sku: 'WD-PURPLE-2TB', marca: 'Western Digital', categoria: 'Almacenamiento', modelo: 'WD23PURZ', descripcion: 'Disco duro WD Purple 2TB para vigilancia 24/7', cantidad: 1, precioUnitarioNeto: 68000, subtotalNeto: 68000 },
          { sku: 'INS-CCTV', marca: 'Insumos', categoria: 'Insumo', modelo: 'ACC-POE-KIT', descripcion: 'Cajas de derivación estancas, conectores RJ45 blindados y cable UTP', cantidad: 1, precioUnitarioNeto: 38000, subtotalNeto: 38000 }
        ]
        moFallback = 110000
      } else {
        analisisFallback = 'Arquitectura estándar de alta confiabilidad DSC Neo con teclado alfanumérico LCD, batería de respaldo 12V 7Ah ante cortes de energía y sensores antimascota en zonas de tránsito principal.'
        equiposFallback = [
          { sku: 'DSC-NEO-16', marca: 'DSC', categoria: 'Alarma', modelo: 'HS2016', descripcion: 'Central DSC Neo 6 a 16 zonas con gabinete metálico y transformador', cantidad: 1, precioUnitarioNeto: 89000, subtotalNeto: 89000 },
          { sku: 'DSC-LCD', marca: 'DSC', categoria: 'Alarma', modelo: 'HS2LCD', descripcion: 'Teclado LCD de texto descriptivo con teclas de pánico rápido', cantidad: 1, precioUnitarioNeto: 65000, subtotalNeto: 65000 },
          { sku: 'DSC-LC100', marca: 'DSC', categoria: 'Sensor', modelo: 'LC-100-PI', descripcion: 'Detector infrarrojo antimascota 25kg lente Fresnel gran angular', cantidad: 3, precioUnitarioNeto: 18000, subtotalNeto: 54000 },
          { sku: 'DSC-MAG-SUR', marca: 'DSC', categoria: 'Sensor', modelo: 'MAG-SOB-01', descripcion: 'Contacto magnético de sobreponer para puerta principal de acceso', cantidad: 2, precioUnitarioNeto: 6500, subtotalNeto: 13000 },
          { sku: 'BAT-12V7AH', marca: 'Insumos', categoria: 'Insumo', modelo: 'BAT-12V-7AH', descripcion: 'Batería de respaldo 12V 7Ah libre de mantenimiento', cantidad: 1, precioUnitarioNeto: 16500, subtotalNeto: 16500 },
          { sku: 'SIR-INT-30W', marca: 'Insumos', categoria: 'Alarma', modelo: 'SIR-110DB', descripcion: 'Sirena interior 30W bi-tonal de alto impacto sonoro', cantidad: 1, precioUnitarioNeto: 14000, subtotalNeto: 14000 }
        ]
        moFallback = 85000
        planUfFallback = modalidadPreferida === 'con_monitoreo' ? 0.95 : undefined
      }

      const subtotalEq = equiposFallback.reduce((acc, it) => acc + it.subtotalNeto, 0)
      const subtotalNeto = subtotalEq + moFallback
      const iva = Math.round(subtotalNeto * 0.19)
      const total = subtotalNeto + iva

      resultadoFinal = {
        analisisTecnico: analisisFallback,
        recomendacionDirecta: `Propuesta técnica optimizada para ${cliente.tipoRecinto || 'recinto'}. Equipamiento 100% de propiedad del cliente sin comodatos engañosos.`,
        presupuesto: {
          folioSugerido: `COT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          clienteNombre: cliente.nombre || 'Cliente Gama Seguridad',
          tipoPropiedad: cliente.tipoRecinto || 'Residencial',
          modalidad: modalidadPreferida,
          equipos: equiposFallback,
          subtotalEquiposNeto: subtotalEq,
          manoDeObraNeto: moFallback,
          subtotalNetoTotal: subtotalNeto,
          iva19: iva,
          totalBruto: total,
          cuotaMonitoreoUF: planUfFallback,
          cuotaMonitoreoCLP: planUfFallback ? Math.round(planUfFallback * 39500) : undefined,
          observacionesTecnicas: [
            'Equipos 100% propiedad del cliente (Sin comodato ni cláusulas de amarre).',
            'Instalación técnica calificada con garantía de 12 meses.',
            modalPreferidaConMonitoreo(modalidadPreferida)
          ],
          tiempoEstimadoInstalacionDias: 1,
          garantiaMeses: 12
        }
      }
    }

    return NextResponse.json({
      ok: true,
      data: resultadoFinal
    })
  } catch (err: any) {
    console.error('Error en /api/agentes/preventa-seguridad:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

function modalPreferidaConMonitoreo(modalidad: string): string {
  if (modalidad === 'con_monitoreo') {
    return 'Monitoreo 24/7 con Operadores Humanos Gama: verificación prioritaria en 15 segundos y aviso inmediato a Carabineros.'
  }
  return 'Proyecto cerrado llave en mano: incluye puesta en marcha y capacitación al usuario sin costos mensuales de monitoreo.'
}
