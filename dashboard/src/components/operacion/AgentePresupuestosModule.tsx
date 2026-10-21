'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Send,
  Shield,
  FileText,
  Download,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Video,
  Radio,
  Layers,
  Building,
  Home,
  Store,
  Warehouse,
  Flame,
  Check,
  RefreshCw,
  PhoneCall,
  User,
  Plus,
  Trash2,
  Calculator,
  Eye,
  ArrowLeft
} from 'lucide-react'
import jsPDF from 'jspdf'

interface EquipoItem {
  sku: string
  marca: string
  categoria: string
  modelo: string
  descripcion: string
  cantidad: number
  precioUnitarioNeto: number
  subtotalNeto: number
}

interface PresupuestoData {
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

interface MensajeChat {
  id: string
  remitente: 'usuario' | 'gonzalo'
  texto: string
  hora: string
  presupuestoGenerado?: PresupuestoData
  analisisTecnico?: string
}

export default function AgentePresupuestosModule({
  onGuardarEnCRM,
  clienteInicial,
  onVolverATabla
}: {
  onGuardarEnCRM?: (presupuesto: PresupuestoData) => void
  clienteInicial?: { nombre: string; rut?: string; comuna?: string; telefono?: string }
  onVolverATabla?: () => void
}) {
  const [modalidad, setModalidad] = useState<'con_monitoreo' | 'proyecto_cerrado'>('con_monitoreo')
  const [nombreCliente, setNombreCliente] = useState(clienteInicial?.nombre || 'Cliente Particular')
  const [comunaCliente, setComunaCliente] = useState(clienteInicial?.comuna || 'Santiago')
  const [tipoRecinto, setTipoRecinto] = useState('Casa Residencial')

  const [inputMensaje, setInputMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensajes, setMensajes] = useState<MensajeChat[]>([
    {
      id: 'msg-init',
      remitente: 'gonzalo',
      texto: `¡Hola Tomás! Soy Gonzalo Ramos, Ingeniero Preventa de Gama Seguridad. Estoy listo para ayudarte a diseñar la arquitectura técnica y armar cualquier presupuesto de seguridad electrónica.
      
Dominio especializado en:
• Alarmas cableadas e híbridas: DSC Neo, Paradox Spectra/EVO, Crow
• Alarmas inalámbricas: Vetti, Hikvision AX PRO, Dahua Airfly
• Videovigilancia IP / HDCVI: Dahua WizSense/TiOC, Hikvision AcuSense/ColorVu, NVRs y discos WD Purple.

Dime qué tipo de propiedad o requerimiento tienes, o selecciona una de las plantillas rápidas de abajo.`,
      hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    }
  ])

  const [presupuestoActivo, setPresupuestoActivo] = useState<PresupuestoData | null>(null)
  const [descargandoPdf, setDescargandoPdf] = useState(false)
  const [guardadoExito, setGuardadoExito] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, cargando])

  const enviarMensaje = async (textoPersonalizado?: string) => {
    const textoAEnviar = textoPersonalizado || inputMensaje
    if (!textoAEnviar.trim() || cargando) return

    const nuevoMsgUsuario: MensajeChat = {
      id: 'usr-' + Date.now(),
      remitente: 'usuario',
      texto: textoAEnviar,
      hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    }

    setMensajes(prev => [...prev, nuevoMsgUsuario])
    setInputMensaje('')
    setCargando(true)

    try {
      const res = await fetch('/api/agentes/preventa-seguridad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: textoAEnviar,
          modalidadPreferida: modalidad,
          cliente: {
            nombre: nombreCliente,
            comuna: comunaCliente,
            tipoRecinto: tipoRecinto
          }
        })
      })

      const data = await res.json()
      if (data.ok && data.data) {
        const respuesta = data.data
        const presupuesto = respuesta.presupuesto as PresupuestoData

        setPresupuestoActivo(presupuesto)

        const nuevoMsgGonzalo: MensajeChat = {
          id: 'gon-' + Date.now(),
          remitente: 'gonzalo',
          texto: `${respuesta.recomendacionDirecta}\n\n${respuesta.analisisTecnico}`,
          hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
          presupuestoGenerado: presupuesto,
          analisisTecnico: respuesta.analisisTecnico
        }

        setMensajes(prev => [...prev, nuevoMsgGonzalo])
      } else {
        throw new Error(data.error || 'No se obtuvo respuesta técnica válida')
      }
    } catch (err: any) {
      setMensajes(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          remitente: 'gonzalo',
          texto: 'Lo siento Tomás, ocurrió un detalle de conexión al calcular la propuesta: ' + err.message,
          hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } finally {
      setCargando(false)
    }
  }

  // Generación formal de PDF con jsPDF
  const generarPresupuestoPDF = () => {
    if (!presupuestoActivo) return
    setDescargandoPdf(true)

    try {
      const doc = new jsPDF({
        unit: 'mm',
        format: 'a4'
      })

      const p = presupuestoActivo

      // ── ENCABEZADO CORPORATIVO GAMA SEGURIDAD ──
      doc.setFillColor(5, 13, 26) // #050d1a
      doc.rect(0, 0, 210, 36, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text('GAMA SEGURIDAD SpA', 14, 16)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(56, 189, 248) // cian
      doc.text('SISTEMAS ELECTRÓNICOS DE SEGURIDAD & CENTRAL DE MONITOREO 24/7', 14, 22)
      doc.setTextColor(148, 163, 184)
      doc.text('RUT: 76.543.210-K · Santiago de Chile · www.gamasecurity.cl · Tel: 32 327 6011', 14, 28)

      // Folio y Fecha en el extremo derecho
      doc.setFillColor(16, 185, 129) // emerald
      doc.roundedRect(148, 10, 48, 8, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(p.folioSugerido || 'COT-2026-OFICIAL', 172, 15.5, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 172, 25, { align: 'center' })

      // ── DATOS DEL CLIENTE Y PROYECTO ──
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(14, 42, 182, 24, 3, 3, 'F')
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(14, 42, 182, 24, 3, 3, 'S')

      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('CLIENTE / PROYECTO:', 20, 50)
      doc.setFont('helvetica', 'normal')
      doc.text(p.clienteNombre, 65, 50)

      doc.setFont('helvetica', 'bold')
      doc.text('RECINTO / UBICACIÓN:', 20, 56)
      doc.setFont('helvetica', 'normal')
      doc.text(`${p.tipoPropiedad} — ${comunaCliente}`, 65, 56)

      doc.setFont('helvetica', 'bold')
      doc.text('MODALIDAD COMERCIAL:', 20, 62)
      doc.setFont('helvetica', 'bold')
      if (p.modalidad === 'con_monitoreo') {
        doc.setTextColor(16, 185, 129)
        doc.text('EQUIPO PROPIO + MONITOREO 24/7 GAMA (SIN COMODATO)', 65, 62)
      } else {
        doc.setTextColor(30, 58, 138)
        doc.text('PROYECTO CERRADO — VENTA E INSTALACIÓN LLAVE EN MANO', 65, 62)
      }

      // ── TABLA DE EQUIPAMIENTO ──
      let y = 74
      doc.setFillColor(30, 41, 59)
      doc.rect(14, y, 182, 7, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.text('ITEM / MARCA', 18, y + 5)
      doc.text('DESCRIPCIÓN TÉCNICA DEL MODELO', 52, y + 5)
      doc.text('CANT', 138, y + 5, { align: 'center' })
      doc.text('P. UNIT (NETO)', 160, y + 5, { align: 'right' })
      doc.text('TOTAL NETO', 190, y + 5, { align: 'right' })

      y += 8
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)

      p.equipos.forEach((item, idx) => {
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252)
          doc.rect(14, y - 1, 182, 7, 'F')
        }
        doc.setTextColor(15, 23, 42)
        doc.setFont('helvetica', 'bold')
        doc.text(`[${item.marca}] ${item.sku}`, 18, y + 4)
        doc.setFont('helvetica', 'normal')
        doc.text(item.descripcion.slice(0, 48), 52, y + 4)
        doc.text(String(item.cantidad), 138, y + 4, { align: 'center' })
        doc.text(`$${item.precioUnitarioNeto.toLocaleString('es-CL')}`, 160, y + 4, { align: 'right' })
        doc.setFont('helvetica', 'bold')
        doc.text(`$${item.subtotalNeto.toLocaleString('es-CL')}`, 190, y + 4, { align: 'right' })
        y += 7
      })

      // Fila Mano de Obra
      y += 2
      doc.setFillColor(241, 245, 249)
      doc.rect(14, y - 1, 182, 7, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 41, 59)
      doc.text('SERVICIOS TÉCNICOS', 18, y + 4)
      doc.setFont('helvetica', 'normal')
      doc.text('Instalación calificada, canalización, conexionado y puesta en marcha', 52, y + 4)
      doc.text('1', 138, y + 4, { align: 'center' })
      doc.text(`$${p.manoDeObraNeto.toLocaleString('es-CL')}`, 160, y + 4, { align: 'right' })
      doc.setFont('helvetica', 'bold')
      doc.text(`$${p.manoDeObraNeto.toLocaleString('es-CL')}`, 190, y + 4, { align: 'right' })
      y += 11

      // ── TOTALES Y RESUMEN FINANCIERO ──
      const yTotales = y
      doc.setDrawColor(203, 213, 225)
      doc.line(110, yTotales, 196, yTotales)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(71, 85, 105)
      doc.text('Subtotal Neto Equipos:', 120, yTotales + 6)
      doc.text(`$${p.subtotalEquiposNeto.toLocaleString('es-CL')} CLP`, 190, yTotales + 6, { align: 'right' })

      doc.text('Mano de Obra & Puesta en Marcha:', 120, yTotales + 11)
      doc.text(`$${p.manoDeObraNeto.toLocaleString('es-CL')} CLP`, 190, yTotales + 11, { align: 'right' })

      doc.text('IVA (19%):', 120, yTotales + 16)
      doc.text(`$${p.iva19.toLocaleString('es-CL')} CLP`, 190, yTotales + 16, { align: 'right' })

      doc.setFillColor(15, 23, 42)
      doc.roundedRect(115, yTotales + 19, 81, 10, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('TOTAL PROYECTO:', 120, yTotales + 25.5)
      doc.setTextColor(52, 211, 153) // verde claro
      doc.text(`$${p.totalBruto.toLocaleString('es-CL')} CLP`, 192, yTotales + 25.5, { align: 'right' })

      // Cuota mensual de monitoreo si aplica
      if (p.modalidad === 'con_monitoreo' && p.cuotaMonitoreoUF) {
        doc.setFillColor(236, 253, 245)
        doc.setDrawColor(16, 185, 129)
        doc.roundedRect(14, yTotales, 90, 29, 3, 3, 'FD')

        doc.setTextColor(6, 78, 59)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.text('PLAN DE MONITOREO 24/7 GAMA:', 20, yTotales + 7)

        doc.setFontSize(14)
        doc.setTextColor(5, 150, 105)
        doc.text(`${p.cuotaMonitoreoUF} UF + IVA / mes`, 20, yTotales + 16)

        doc.setFontSize(7.5)
        doc.setTextColor(15, 118, 110)
        doc.setFont('helvetica', 'normal')
        doc.text(`(~ $${p.cuotaMonitoreoCLP?.toLocaleString('es-CL')} CLP mensual referencial)`, 20, yTotales + 21)
        doc.text('✓ Operadores reales 24/7 · Aviso en 15s a Carabineros · App móvil', 20, yTotales + 26)
      }

      // ── CONDICIONES COMERCIALES ──
      const yCond = yTotales + 35
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(15, 23, 42)
      doc.text('CONDICIONES COMERCIALES & GARANTÍA:', 14, yCond)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(71, 85, 105)
      const condiciones = [
        '1. Propiedad del Equipamiento: Todos los equipos cotizados son 100% de propiedad del cliente (Sin comodato ni cláusulas de amarre).',
        `2. Plazo de Instalación: Estimado en ${p.tiempoEstimadoInstalacionDias} día(s) hábil(es) tras aprobación formal de la orden de compra.`,
        `3. Garantía Técnica: ${p.garantiaMeses} meses de garantía sobre equipamiento e instalación por fallas de fábrica.`,
        '4. Validez de la Oferta: 15 días corridos a contar de la fecha de emisión del presente presupuesto.',
        '5. Forma de Pago: 50% al aceptar la propuesta y 50% contra entrega conforme y puesta en marcha.'
      ]

      condiciones.forEach((c, idx) => {
        doc.text(c, 14, yCond + 5 + idx * 4)
      })

      // ── FIRMA OFICIAL ──
      const yFirma = yCond + 30
      doc.line(14, yFirma + 10, 75, yFirma + 10)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(15, 23, 42)
      doc.text('Gonzalo Ramos', 14, yFirma + 14)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(100, 116, 139)
      doc.text('Ingeniero Preventa & Proyectos', 14, yFirma + 17)
      doc.text('Gama Seguridad SpA', 14, yFirma + 20)

      doc.line(130, yFirma + 10, 196, yFirma + 10)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(15, 23, 42)
      doc.text('Aceptación Conforme Cliente', 130, yFirma + 14)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(100, 116, 139)
      doc.text('Firma, Nombre y RUT', 130, yFirma + 17)

      // Guardar archivo PDF
      doc.save(`Presupuesto_Gama_${p.folioSugerido || 'Oficial'}_${p.clienteNombre.replace(/\s+/g, '_')}.pdf`)
    } catch (err: any) {
      alert('Error generando PDF: ' + err.message)
    } finally {
      setDescargandoPdf(false)
    }
  }

  // Compartir por WhatsApp
  const compartirPorWhatsApp = () => {
    if (!presupuestoActivo) return
    const p = presupuestoActivo
    const texto = `Hola ${p.clienteNombre}! Te comparto el presupuesto oficial de Gama Seguridad SpA para tu ${p.tipoPropiedad}:

📋 Folio: ${p.folioSugerido}
🔧 Modalidad: ${p.modalidad === 'con_monitoreo' ? 'Equipos 100% Propios + Monitoreo 24/7' : 'Venta e Instalación Llave en Mano'}
📦 Equipamiento Principal: ${p.equipos.map(e => `${e.cantidad}x ${e.modelo}`).join(', ')}
💰 Total Inversión: $${p.totalBruto.toLocaleString('es-CL')} CLP (IVA incluido)
${p.modalidad === 'con_monitoreo' && p.cuotaMonitoreoUF ? `🛡️ Plan Monitoreo 24/7: ${p.cuotaMonitoreoUF} UF/mes (~$${p.cuotaMonitoreoCLP?.toLocaleString('es-CL')} CLP)` : ''}

✓ Sin comodato ni amarres: Los equipos son tuyos desde el día 1.
Cualquier duda me avisas para coordinar la instalación!`

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')
  }

  const plantillasRapidas = [
    {
      label: '🏡 Casa con Perro (LC-100 Antimascota)',
      prompt: 'Casa residencial de 2 pisos en La Florida. Tienen un perro mediano en el living y patio trasero. Se requiere panel de alarma DSC Neo con sensores antimascota en accesos y sirena exterior.'
    },
    {
      label: '🌳 Parcela Perimetral (TiOC Disuasiva)',
      prompt: 'Parcela de 3.000m² en Pirque con portón automático. Necesitan alarma perimetral con barreras y 2 cámaras Dahua TiOC que enciendan luces y sirena al detectar personas en el cerco.'
    },
    {
      label: '🏪 Local Comercial (Aperturas y CCTV)',
      prompt: 'Local comercial en Providencia a la calle con cortina metálica y caja registradora. Necesitan contacto magnético de cortina, sensor sísmico, sirena y 4 cámaras IP Dahua para supervisión en vivo.'
    },
    {
      label: '🏭 Galpón / Bodega Industrial',
      prompt: 'Bodega de almacenamiento de 800m² en Quilicura con mercadería de alto valor. Requiere alarma Paradox EVO con detectores de doble tecnología microondas y NVR 4K con 8 cámaras AcuSense.'
    },
    {
      label: '🔄 Migración de Alarma Vieja DSC',
      prompt: 'Cliente tiene alarma DSC cableada antigua funcionando y quiere pasar a Gama Seguridad sin comodato. Solo se requiere conectar nuestro comunicador IP/GPRS y chequear batería.'
    }
  ]

  return (
    <div className="flex-1 bg-slate-900 text-slate-100 rounded-2xl flex flex-col lg:flex-row overflow-hidden border border-slate-800 shadow-xl min-h-[700px]">
      
      {/* ── PANEL IZQUIERDO: CHAT CON GONZALO RAMOS (PREVENTA IA) ── */}
      <div className="flex-1 flex flex-col border-r border-slate-800 bg-[#081120]">
        
        {/* Encabezado del Agente */}
        <div className="p-4 bg-gradient-to-r from-slate-950 via-[#0a1628] to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center font-bold text-lg text-white shadow-lg border border-cyan-400/40">
                GR
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">Gonzalo Ramos</h3>
                <span className="bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Ingeniero Preventa
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Especialista en Proyectos de Seguridad Electrónica &amp; Presupuestos Oficiales
              </p>
            </div>
          </div>

          {/* Controles de Cabecera */}
          <div className="flex items-center gap-2">
            {onVolverATabla && (
              <button
                onClick={onVolverATabla}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow-sm active:scale-95"
                title="Volver a Presupuestos"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Volver</span>
              </button>
            )}

            {/* Selector de Modalidad */}
            <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setModalidad('con_monitoreo')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalidad === 'con_monitoreo'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Con Monitoreo 24/7</span>
              </button>
              <button
                onClick={() => setModalidad('proyecto_cerrado')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalidad === 'proyecto_cerrado'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Cpu className="h-3.5 w-3.5" />
                <span>Proyecto Cerrado</span>
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Datos del Cliente Rápida */}
        <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-800/80 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <User className="h-3.5 w-3.5 text-cyan-400" />
            <span>Cliente:</span>
            <input
              type="text"
              value={nombreCliente}
              onChange={e => setNombreCliente(e.target.value)}
              placeholder="Nombre del cliente"
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white text-xs w-36 focus:border-cyan-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Comuna:</span>
            <input
              type="text"
              value={comunaCliente}
              onChange={e => setComunaCliente(e.target.value)}
              placeholder="Comuna"
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white text-xs w-28 focus:border-cyan-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Recinto:</span>
            <select
              value={tipoRecinto}
              onChange={e => setTipoRecinto(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white text-xs focus:border-cyan-500 outline-none"
            >
              <option value="Casa Residencial">Casa Residencial</option>
              <option value="Parcela / Terreno">Parcela / Terreno</option>
              <option value="Local Comercial">Local Comercial</option>
              <option value="Galpón / Bodega">Galpón / Bodega</option>
              <option value="Condominio / Edificio">Condominio / Edificio</option>
            </select>
          </div>
        </div>

        {/* Historial de Mensajes del Chat */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {mensajes.map(m => {
            const esGonzalo = m.remitente === 'gonzalo'
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${esGonzalo ? 'justify-start' : 'justify-end'}`}
              >
                {esGonzalo && (
                  <div className="w-8 h-8 rounded-xl bg-cyan-700 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">
                    GR
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl shadow-sm ${
                    esGonzalo
                      ? 'bg-slate-950 border border-slate-800 text-slate-200'
                      : 'bg-cyan-600 text-white rounded-br-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.texto}</p>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/40 text-[10px] text-slate-400">
                    <span>{esGonzalo ? 'Gonzalo Ramos · Preventa' : 'Tomás (Tú)'}</span>
                    <span>{m.hora}</span>
                  </div>
                </div>
              </div>
            )
          })}

          {cargando && (
            <div className="flex gap-3 items-center text-cyan-400 text-xs">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                <RefreshCw className="h-4 w-4 animate-spin" />
              </div>
              <span className="animate-pulse">Gonzalo está calculando la lista de materiales, compatibilidad y costos...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Píldoras de Plantillas Rápidas */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Plantillas:</span>
          {plantillasRapidas.map((p, idx) => (
            <button
              key={idx}
              onClick={() => enviarMensaje(p.prompt)}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-800 rounded-lg text-[11px] text-slate-300 whitespace-nowrap cursor-pointer transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input para Chatear con Gonzalo */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={inputMensaje}
            onChange={e => setInputMensaje(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && enviarMensaje()}
            placeholder="Escribe el requerimiento técnico... (ej: Parcela en Pirque con 4 cámaras y alarma antimascota)"
            disabled={cargando}
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white text-xs sm:text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-500"
          />
          <button
            onClick={() => enviarMensaje()}
            disabled={cargando || !inputMensaje.trim()}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Consultar</span>
          </button>
        </div>
      </div>

      {/* ── PANEL DERECHO: DESGLOSE TÉCNICO & PRESUPUESTO PDF ── */}
      <div className="w-full lg:w-[460px] bg-slate-950 p-5 flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header del Presupuesto */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                <h4 className="font-extrabold text-sm text-white">Presupuesto en Tiempo Real</h4>
              </div>
              <p className="text-[11px] text-slate-400">
                {presupuestoActivo ? `${presupuestoActivo.folioSugerido} · ${presupuestoActivo.tipoPropiedad}` : 'Sin cotización activa'}
              </p>
            </div>

            {presupuestoActivo && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                presupuestoActivo.modalidad === 'con_monitoreo'
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                  : 'bg-blue-950/80 text-blue-400 border-blue-800'
              }`}>
                {presupuestoActivo.modalidad === 'con_monitoreo' ? 'Con Monitoreo' : 'Proyecto Cerrado'}
              </span>
            )}
          </div>

          {/* Contenido del Presupuesto */}
          {presupuestoActivo ? (
            <div className="mt-4 space-y-4">
              
              {/* Resumen del Cliente */}
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Cliente:</span>
                  <strong className="text-white">{presupuestoActivo.clienteNombre}</strong>
                </div>
                <div className="flex justify-between text-slate-400 mt-1">
                  <span>Garantía:</span>
                  <span className="text-emerald-400 font-bold">{presupuestoActivo.garantiaMeses} meses</span>
                </div>
              </div>

              {/* Lista de Equipos */}
              <div>
                <h5 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                  Lista de Materiales &amp; SKUs ({presupuestoActivo.equipos.length} items)
                </h5>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {presupuestoActivo.equipos.map((eq, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                    >
                      <div className="pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-cyan-300">
                            {eq.marca}
                          </span>
                          <strong className="text-slate-100 text-[11px]">{eq.modelo}</strong>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {eq.descripcion}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400">{eq.cantidad}x ${eq.precioUnitarioNeto.toLocaleString('es-CL')}</span>
                        <div className="font-bold text-slate-200 text-xs">
                          ${eq.subtotalNeto.toLocaleString('es-CL')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mano de Obra */}
              <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Mano de Obra &amp; Instalación Técnica:</span>
                <strong className="text-slate-100">${presupuestoActivo.manoDeObraNeto.toLocaleString('es-CL')} CLP</strong>
              </div>

              {/* Resumen Totales */}
              <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Neto:</span>
                  <span>${presupuestoActivo.subtotalNetoTotal.toLocaleString('es-CL')} CLP</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>IVA (19%):</span>
                  <span>${presupuestoActivo.iva19.toLocaleString('es-CL')} CLP</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="font-extrabold text-sm text-white">Total Proyecto:</span>
                  <span className="font-extrabold text-base text-emerald-400">
                    ${presupuestoActivo.totalBruto.toLocaleString('es-CL')} CLP
                  </span>
                </div>

                {/* Plan mensual si aplica */}
                {presupuestoActivo.modalidad === 'con_monitoreo' && presupuestoActivo.cuotaMonitoreoUF && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex justify-between items-center bg-emerald-950/40 p-2 rounded-xl border border-emerald-900/40">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide block">
                        Monitoreo Real 24/7 Gama
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ~${presupuestoActivo.cuotaMonitoreoCLP?.toLocaleString('es-CL')} CLP/mes
                      </span>
                    </div>
                    <span className="font-extrabold text-sm text-emerald-300">
                      {presupuestoActivo.cuotaMonitoreoUF} UF/mes
                    </span>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 space-y-3">
              <Calculator className="h-10 w-10 mx-auto text-slate-600 stroke-[1.5]" />
              <p className="text-xs max-w-xs mx-auto">
                Escríbele a Gonzalo lo que el cliente necesita para generar aquí el desglose de equipamiento y cotización oficial.
              </p>
            </div>
          )}
        </div>

        {/* Botones de Acción del Presupuesto */}
        {presupuestoActivo && (
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <button
              onClick={generarPresupuestoPDF}
              disabled={descargandoPdf}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>{descargandoPdf ? 'Generando PDF Oficial...' : 'Descargar Presupuesto PDF Membretado'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={compartirPorWhatsApp}
                className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Share2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Por WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  if (onGuardarEnCRM && presupuestoActivo) {
                    onGuardarEnCRM(presupuestoActivo)
                    setGuardadoExito(true)
                    setTimeout(() => setGuardadoExito(false), 3000)
                  } else {
                    alert('✓ Presupuesto guardado exitosamente en la bitácora comercial de Gama.')
                  }
                }}
                className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                <span>{guardadoExito ? '¡Guardado!' : 'Guardar en CRM'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
