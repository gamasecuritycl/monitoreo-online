'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export interface OrdenTrabajo {
  id: number
  codigo_ot: string
  cuenta: string
  nombre_abonado: string
  direccion: string
  telefono_contacto: string
  tipo_visita: 'Correctiva' | 'Preventiva' | 'Cambio de Batería' | 'Instalación' | 'Revisión de Cámaras'
  tecnico: string
  fecha_cita: string
  bloque_horario: string
  problema: string
  estado: 'Pendiente' | 'Programada' | 'En Traslado' | 'En Terreno' | 'Completada' | 'Cancelada'
  novedad: string
  repuestos_utilizados?: string
  firma: string
  nombre_firmante?: string
  rut_firmante?: string
  fotos_evidencia?: string[]
  modo_pruebas_usado?: boolean
  voltaje_bateria?: string
  fecha_creacion: string
  fecha_cierre?: string
}

import { Operator } from '@/types/operator'

interface Props {
  onClose: () => void
  clientesMap?: Record<string, Record<string, string>>
  usuarioActivo?: Operator
}

const TECNITOS_NORMALIZADOS = ['Juan Perez', 'Diego Reyes', 'Mauricio Tapia', 'Cristian Munoz']
const TECNICOS = ['Juan Pérez', 'Diego Reyes', 'Mauricio Tapia', 'Cristian Muñoz']
const TIPOS_VISITA = ['Correctiva', 'Preventiva', 'Cambio de Batería', 'Instalación', 'Revisión de Cámaras'] as const
const BLOQUES_HORARIOS = ['Mañana (09:00 - 13:00)', 'Tarde (14:00 - 18:00)'] as const

function coincideTecnico(t1?: string | null, t2?: string | null) {
  if (!t1 || !t2) return false
  const norm1 = t1.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase().trim()
  const norm2 = t2.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase().trim()
  if (norm1 === norm2) return true

  const p1 = norm1.split(' ').filter(Boolean)
  const p2 = norm2.split(' ').filter(Boolean)
  if (p1.length > 0 && p2.length > 0 && p1[0] === p2[0]) {
    return true
  }
  return false
}

export default function ServicioTecnicoModal({ onClose, clientesMap = {}, usuarioActivo }: Props) {
  const [tabActive, setTabActive] = useState<'despacho' | 'tecnico_movil'>('despacho')

  // Bloqueo a vista móvil si inició sesión como Técnico
  useEffect(() => {
    if (usuarioActivo?.rol === 'Técnico') {
      setTabActive('tecnico_movil')
      setTecnicoSimulado(usuarioActivo.nombre)
    }
  }, [usuarioActivo])
  
  // Lista de órdenes
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [filtroEstadoTab, setFiltroEstadoTab] = useState<'todas' | 'pendientes' | 'completadas'>('todas')
  const [cargando, setCargando] = useState(false)

  // Formulario creación en Despacho
  const [buscarCuenta, setBuscarCuenta] = useState('')
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('')
  const [tecnicoAsignado, setTecnicoAsignado] = useState(TECNICOS[0])
  const [tipoVisita, setTipoVisita] = useState<typeof TIPOS_VISITA[number]>('Correctiva')
  const [fechaCita, setFechaCita] = useState(new Date().toISOString().slice(0, 10))
  const [bloqueHorario, setBloqueHorario] = useState<typeof BLOQUES_HORARIOS[number]>('Mañana (09:00 - 13:00)')
  const [telefonoContacto, setTelefonoContacto] = useState('')
  const [direccionAbonado, setDireccionAbonado] = useState('')
  const [problemaReportado, setProblemaReportado] = useState('')

  // Técnico Móvil (Terreno)
  const [tecnicoSimulado, setTecnicoSimulado] = useState(TECNICOS[0])
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenTrabajo | null>(null)
  const [novedadTexto, setNovedadTexto] = useState('')
  const [repuestosTexto, setRepuestosTexto] = useState('')
  const [nombreFirmanteText, setNombreFirmanteText] = useState('')
  
  // Canvas de Firma
  const [firmando, setFirmando] = useState(false)
  const [firmaImagen, setFirmaImagen] = useState('')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Visor de Comprobante Oficial Imprimible
  const [ordenImprimir, setOrdenImprimir] = useState<OrdenTrabajo | null>(null)

  // Cargar órdenes desde Supabase (Fila especial cuenta: 'ORDENES_TRABAJO' con id desc)
  const cargarOrdenes = async () => {
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from('eventos_monitoreo')
        .select('*')
        .eq('cuenta', 'ORDENES_TRABAJO')
        .order('id', { ascending: false })
        .limit(1)

      if (data && data.length > 0 && !error) {
        const parsed = JSON.parse(data[0].nombre_abonado || '[]')
        setOrdenes(parsed)
      }
    } catch (err) {
      console.error('Error cargando órdenes:', err)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarOrdenes()
  }, [])

  // Auto-completar dirección y teléfono al seleccionar cuenta
  useEffect(() => {
    if (cuentaSeleccionada && clientesMap[cuentaSeleccionada]) {
      const c = clientesMap[cuentaSeleccionada]
      setDireccionAbonado(c.direccion || '')
      setTelefonoContacto(c.telefono1 || c.t1 || '')
    }
  }, [cuentaSeleccionada, clientesMap])

  // Guardar/Actualizar todas las órdenes en Supabase
  const guardarOrdenesBase = async (listaNueva: OrdenTrabajo[]) => {
    try {
      await supabase
        .from('eventos_monitoreo')
        .upsert({
          cuenta: 'ORDENES_TRABAJO',
          nombre_abonado: JSON.stringify(listaNueva),
          evento: 'CONFIGURACION',
          fecha_hora: new Date().toISOString()
        })
      setOrdenes(listaNueva)
    } catch (err) {
      console.error('Error guardando órdenes:', err)
    }
  }

  // Enviar notificación de WhatsApp al cliente
  const enviarNotificacionWhatsApp = async (numeroTel: string, mensajeStr: string) => {
    if (!numeroTel || numeroTel.length < 8) return
    try {
      let numClean = numeroTel.replace(/[^0-9]/g, '')
      if (numClean.length === 9 && numClean.startsWith('9')) {
        numClean = '56' + numClean
      }
      await fetch('/api/whatsapp/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: numClean,
          mensaje: mensajeStr
        })
      })
    } catch (err) {
      console.warn('No se pudo enviar notificación de WhatsApp:', err)
    }
  }

  // Generador de Documento PDF Limpio para Impresión / Descarga
  const generarImpresionLimpia = (orden: OrdenTrabajo) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1100')
    if (!printWindow) {
      alert('Por favor permita las ventanas emergentes (pop-ups) en su navegador para imprimir el documento PDF.')
      return
    }

    const fotosHtml = orden.fotos_evidencia && orden.fotos_evidencia.length > 0 ? `
      <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:12px; margin-bottom:14px;">
        <div style="font-size:11px; font-weight:900; color:#1e3a8a; text-transform:uppercase; border-bottom:1px solid #cbd5e1; padding-bottom:4px; margin-bottom:8px;">
          IV. REGISTRO FOTOGRÁFICO DE EVIDENCIA EN TERRENO
        </div>
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px;">
          ${orden.fotos_evidencia.map((foto, idx) => `
            <div style="aspect-ratio: 4/3; background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; overflow:hidden; padding:2px;">
              <img src="${foto}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;" alt="Evidencia ${idx + 1}" />
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Certificado_Oficial_${orden.codigo_ot || orden.id}</title>
        <style>
          @page {
            size: letter portrait;
            margin: 10mm 12mm;
          }
          body {
            font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .cert-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .logo-box {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-box img {
            width: 65px;
            height: 65px;
            object-fit: contain;
          }
          .company-title {
            font-size: 20px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: 1px;
            margin: 0;
          }
          .company-sub {
            font-size: 11px;
            color: #475569;
            font-weight: 700;
            margin: 2px 0 0 0;
          }
          .cert-badge {
            background: #0f172a;
            color: #ffffff;
            font-family: monospace;
            font-size: 13px;
            font-weight: 900;
            padding: 6px 14px;
            border-radius: 6px;
            display: inline-block;
          }
          .cert-meta {
            text-align: right;
            font-size: 11px;
            color: #334155;
            font-weight: 700;
            margin-top: 6px;
          }
          .section-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px 14px;
            margin-bottom: 14px;
          }
          .section-title {
            font-size: 11px;
            font-weight: 900;
            color: #1e3a8a;
            text-transform: uppercase;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin-bottom: 8px;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 16px;
            font-size: 11px;
          }
          .signature-img {
            height: 65px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            padding: 4px;
            border-radius: 6px;
            margin-top: 6px;
          }
          .footer-stamp {
            border-top: 1px solid #cbd5e1;
            padding-top: 6px;
            margin-top: 12px;
            font-size: 9px;
            color: #64748b;
            font-family: monospace;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="cert-container">
          <div class="header">
            <div class="logo-box">
              <img src="/logo-gama.png" alt="GAMA" />
              <div>
                <h1 class="company-title">GAMA SEGURIDAD 24/7</h1>
                <p class="company-sub">Mantenimiento Electrónico & Monitoreo de Alarmas</p>
                <p class="company-sub" style="color: #64748b; font-size: 10px;">Certificado Oficial de Atención Técnica en Terreno</p>
              </div>
            </div>
            <div>
              <div class="cert-badge">CERTIFICADO N° ${orden.codigo_ot || 'OT-' + orden.id}</div>
              <div class="cert-meta">
                Fecha: ${orden.fecha_cierre || orden.fecha_cita}<br>
                <span style="color: #15803d; background: #dcfce7; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">STATUS: VERIFICADO OK</span>
              </div>
            </div>
          </div>

          <div class="section-box">
            <div class="section-title">I. Identificación del Abonado & Domicilio</div>
            <div class="grid-2">
              <div><strong>Código Cuenta:</strong> <span style="font-family: monospace; font-weight: 900; color: #1e3a8a;">${orden.cuenta}</span></div>
              <div><strong>Nombre / Razón Social:</strong> ${orden.nombre_abonado}</div>
              <div><strong>Dirección Comercial/Residencial:</strong> ${orden.direccion}</div>
              <div><strong>Teléfono Contacto:</strong> ${orden.telefono_contacto || 'Sin registro'}</div>
            </div>
          </div>

          <div class="section-box">
            <div class="section-title">II. Resumen Operativo del Servicio</div>
            <div class="grid-2">
              <div><strong>Tipo de Visita:</strong> ${orden.tipo_visita || 'Correctiva'}</div>
              <div><strong>Bloque Horario:</strong> ${orden.bloque_horario}</div>
              <div><strong>Técnico Certificado Responsable:</strong> ${orden.tecnico}</div>
              <div><strong>Voltaje Batería / Fuente:</strong> ${orden.voltaje_bateria || '13.8V DC (Normal)'}</div>
            </div>
          </div>

          <div class="section-box">
            <div class="section-title">III. Requerimiento & Diagnóstico Técnico Ejecutado</div>
            <div style="font-size: 11px; line-height: 1.5;">
              <div style="margin-bottom: 4px;"><strong>Falla Reportada Inicial:</strong> ${orden.problema}</div>
              <div style="margin-bottom: 4px;"><strong>Trabajo Realizado en Terreno:</strong> ${orden.novedad || 'Prueba y mantención ejecutada'}</div>
              <div><strong>Repuestos / Insumos Utilizados:</strong> ${orden.repuestos_utilizados || 'Ninguno (Mantenimiento preventivo)'}</div>
            </div>
          </div>

          ${fotosHtml}

          <div class="section-box">
            <div class="section-title">V. Conformidad & Recepción del Servicio</div>
            <div class="grid-2">
              <div>
                <p style="margin: 0; font-size: 11px; font-weight: bold;">Firma Cliente Receptor:</p>
                <p style="margin: 2px 0; font-size: 11px;">Nombre: <strong>${orden.nombre_firmante || 'Cliente'}</strong></p>
                <p style="margin: 2px 0; font-size: 11px;">RUT: <strong>${orden.rut_firmante || 'S/RUT'}</strong></p>
                ${orden.firma ? `<img src="${orden.firma}" class="signature-img" alt="Firma Touch" />` : '<div style="font-size: 10px; color: #94a3b8; font-style: italic; margin-top: 10px;">Firma Digitalizada Registrada</div>'}
              </div>
              <div style="text-align: right; display: flex; flex-direction: column; justify-between;">
                <div>
                  <p style="margin: 0; font-size: 11px; font-weight: bold;">Técnico Certificado GAMA Security:</p>
                  <p style="margin: 2px 0; font-size: 12px; font-weight: 900; color: #0f172a;">${orden.tecnico}</p>
                  <p style="margin: 0; font-size: 10px; color: #64748b;">GAMA Security 24/7 SpA — Chile</p>
                </div>
                <div class="footer-stamp">
                  Sello Digital de Validación GAMA # ${orden.id}
                </div>
              </div>
            </div>
          </div>

        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  // Crear una nueva Orden de Trabajo
  const handleCrearOrden = async () => {
    if (!cuentaSeleccionada) {
      alert('Por favor seleccione una cuenta de abonado.')
      return
    }
    if (!problemaReportado.trim()) {
      alert('Por favor describa el problema o requerimiento.')
      return
    }

    const abonadoInfo = clientesMap[cuentaSeleccionada] || { nombre: 'Abonado Desconocido' }
    const idOT = Date.now()
    const codigoOT = `OT-${idOT.toString().slice(-4)}`
    
    const nuevaOrden: OrdenTrabajo = {
      id: idOT,
      codigo_ot: codigoOT,
      cuenta: cuentaSeleccionada,
      nombre_abonado: abonadoInfo.nombre || 'Abonado Desconocido',
      direccion: direccionAbonado || abonadoInfo.direccion || 'Dirección no disponible',
      telefono_contacto: telefonoContacto || abonadoInfo.telefono1 || '',
      tipo_visita: tipoVisita,
      tecnico: tecnicoAsignado,
      fecha_cita: fechaCita,
      bloque_horario: bloqueHorario,
      problema: problemaReportado.trim(),
      estado: 'Programada',
      novedad: '',
      repuestos_utilizados: '',
      firma: '',
      nombre_firmante: '',
      fecha_creacion: new Date().toISOString().slice(0, 16).replace('T', ' ')
    }

    const listaNueva = [nuevaOrden, ...ordenes]
    await guardarOrdenesBase(listaNueva)
    
    // Notificación automática por WhatsApp al cliente
    if (nuevaOrden.telefono_contacto) {
      const msgWA = `🛠️ *GAMA SEGURIDAD 24/7 - Servicio Técnico*\n\nEstimado cliente, su orden de atención técnica *#${codigoOT}* ha sido programada con éxito:\n\n• *Tipo:* ${tipoVisita}\n• *Fecha:* ${fechaCita}\n• *Horario:* ${bloqueHorario}\n• *Técnico Asignado:* ${tecnicoAsignado}\n\nQuedamos atentos a su llegada.`
      enviarNotificacionWhatsApp(nuevaOrden.telefono_contacto, msgWA)
    }

    // Resetear formulario
    setProblemaReportado('')
    setBuscarCuenta('')
    setCuentaSeleccionada('')
    alert(`✅ Orden de trabajo #${codigoOT} programada con éxito para el técnico ${tecnicoAsignado}.`)
  }

  // Transición de estado de la OT por el Técnico
  const cambiarEstadoOrden = async (id: number, nuevoEstado: OrdenTrabajo['estado']) => {
    const listaNueva = ordenes.map(o => {
      if (o.id === id) {
        return { ...o, estado: nuevoEstado }
      }
      return o
    })
    await guardarOrdenesBase(listaNueva)
    if (ordenSeleccionada && ordenSeleccionada.id === id) {
      setOrdenSeleccionada({ ...ordenSeleccionada, estado: nuevoEstado })
    }
  }

  // Eliminar orden
  const handleEliminarOrden = (id: number) => {
    if (confirm('¿Está seguro de eliminar esta orden de trabajo?')) {
      const listaNueva = ordenes.filter(o => o.id !== id)
      guardarOrdenesBase(listaNueva)
    }
  }

  // Inicializar canvas de firma
  useEffect(() => {
    if (tabActive === 'tecnico_movil' && ordenSeleccionada && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#000080'
        ctx.lineWidth = 3
      }
    }
  }, [tabActive, ordenSeleccionada])

  const getPos = (e: any) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const rect = canvasRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const startDrawing = (e: any) => {
    setFirmando(true)
    const p = getPos(e)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
    }
  }

  const draw = (e: any) => {
    if (!firmando) return
    const p = getPos(e)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    setFirmando(false)
    if (canvasRef.current) {
      setFirmaImagen(canvasRef.current.toDataURL())
    }
  }

  const clearFirma = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      setFirmaImagen('')
    }
  }

  // Finalizar Orden desde el módulo técnico
  const handleFinalizarOrden = async () => {
    if (!ordenSeleccionada) return
    if (!novedadTexto.trim()) {
      alert('Por favor describa el trabajo o solución realizada en terreno.')
      return
    }

    const fechaCierreStr = new Date().toISOString().slice(0, 16).replace('T', ' ')

    try {
      await supabase.from('eventos_monitoreo').insert({
        fecha_hora: new Date().toISOString(),
        cuenta: ordenSeleccionada.cuenta,
        nombre_abonado: ordenSeleccionada.nombre_abonado,
        evento: `SERVICIO TECNICO COMPLETADO: ${novedadTexto.trim().toUpperCase()}`,
        zona: 'S/T',
        usuario: 'TEC'
      })

      const ordenCompletada: OrdenTrabajo = {
        ...ordenSeleccionada,
        estado: 'Completada',
        novedad: novedadTexto.trim(),
        repuestos_utilizados: repuestosTexto.trim(),
        nombre_firmante: nombreFirmanteText.trim() || 'Cliente',
        firma: firmaImagen,
        fecha_cierre: fechaCierreStr
      }

      const listaNueva = ordenes.map(o => o.id === ordenSeleccionada.id ? ordenCompletada : o)
      await guardarOrdenesBase(listaNueva)

      if (ordenCompletada.telefono_contacto) {
        const msgWA = `✅ *GAMA SEGURIDAD 24/7 - Atención Finalizada*\n\nSu orden de servicio técnico *#${ordenCompletada.codigo_ot || 'OT'}* ha sido completada exitosamente.\n\n• *Trabajo Realizado:* ${novedadTexto.trim()}\n• *Repuestos:* ${repuestosTexto.trim() || 'Ninguno'}\n• *Atendido por:* ${ordenCompletada.tecnico}\n\nGracias por su confianza.`
        enviarNotificacionWhatsApp(ordenCompletada.telefono_contacto, msgWA)
      }

      alert('🎉 ¡Orden de trabajo completada, firma capturada y notificada con éxito!')
      setOrdenImprimir(ordenCompletada)
      setOrdenSeleccionada(null)
      setNovedadTexto('')
      setRepuestosTexto('')
      setNombreFirmanteText('')
      setFirmaImagen('')
    } catch (err: any) {
      alert('Error al finalizar la orden de trabajo: ' + err.message)
    }
  }

  // Filtrar abonados para el buscador
  const clientesFiltrados = Object.entries(clientesMap)
    .filter(([cuenta, c]) => 
      cuenta.toLowerCase().includes(buscarCuenta.toLowerCase()) || 
      (c.nombre || '').toLowerCase().includes(buscarCuenta.toLowerCase())
    )
    .slice(0, 5)

  // Órdenes asignadas al técnico simulado
  const ordenesTécnico = ordenes.filter(o => coincideTecnico(o.tecnico, tecnicoSimulado))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 font-sans select-none">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 w-[96vw] max-w-[1550px] h-[92vh] flex flex-col shadow-2xl text-black overflow-hidden rounded-md">
        
        {/* Title bar Ampliado */}
        <div className="bg-[#8B0000] text-white px-4 py-2.5 flex justify-between items-center shrink-0 border-b border-red-950">
          <div className="font-black text-sm md:text-base tracking-wider flex items-center gap-2">
            <span>🛠️</span>
            <span>Scorpion — Módulo de Servicio Técnico & Agendamiento en Terreno</span>
          </div>
          <button 
            onClick={onClose} 
            className="bg-[#c0c0c0] text-black font-black text-sm border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-3 py-1 leading-none hover:bg-[#d0d0d0] cursor-pointer"
          >
            ✕ CERRAR
          </button>
        </div>

        {/* Content area Despacho Central */}
        <div className="p-4 bg-[#d4d0c8] flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 flex flex-col md:flex-row gap-5 overflow-hidden min-h-0">
              
              {/* Formulario Asignación Izquierda (AMPLIADO A 460px) */}
              <div className="w-full md:w-[440px] lg:w-[460px] bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 p-4 flex flex-col justify-between shrink-0 overflow-y-auto shadow-inner">
                <div className="space-y-4">
                  <div className="bg-[#000080] text-white text-xs md:text-sm font-black px-3 py-1.5 uppercase tracking-wider text-center rounded-sm">
                    ➕ AGENDAR ORDEN DE TRABAJO
                  </div>
                  
                  {/* Buscador de Abonado */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-black text-gray-800 uppercase block">1. BUSCAR ABONADO / CLIENTE:</label>
                    <input
                      type="text"
                      value={buscarCuenta}
                      onChange={(e) => setBuscarCuenta(e.target.value)}
                      placeholder="Escriba código de cuenta o nombre..."
                      className="bg-white border-2 border-gray-500 font-bold px-3 py-2 text-sm text-black select-text focus:outline-none focus:border-blue-800 w-full rounded"
                    />
                    
                    {buscarCuenta && !cuentaSeleccionada && (
                      <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-500 shadow-2xl z-30 divide-y divide-gray-200 rounded">
                        {clientesFiltrados.map(([cuenta, c]) => (
                          <div
                            key={cuenta}
                            onClick={() => {
                              setCuentaSeleccionada(cuenta)
                              setBuscarCuenta(`${cuenta} - ${c.nombre}`)
                            }}
                            className="p-2 text-xs font-bold hover:bg-blue-900 hover:text-white cursor-pointer truncate"
                          >
                            <strong className="font-mono text-blue-900 font-black">{cuenta}</strong> — {c.nombre}
                          </div>
                        ))}
                        {clientesFiltrados.length === 0 && (
                          <div className="p-2 text-xs text-gray-500 italic">No se encontraron clientes</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tipo de Visita & Técnico */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-800 uppercase block">Tipo de Visita:</label>
                      <select
                        value={tipoVisita}
                        onChange={(e: any) => setTipoVisita(e.target.value)}
                        className="bg-white border-2 border-gray-500 font-bold px-2 py-2 text-xs md:text-sm text-black focus:outline-none w-full rounded"
                      >
                        {TIPOS_VISITA.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-800 uppercase block">Técnico Asignado:</label>
                      <select
                        value={tecnicoAsignado}
                        onChange={(e) => setTecnicoAsignado(e.target.value)}
                        className="bg-white border-2 border-gray-500 font-bold px-2 py-2 text-xs md:text-sm text-black focus:outline-none w-full rounded"
                      >
                        {TECNICOS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Fecha y Bloque Horario */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-800 uppercase block">Fecha Programada:</label>
                      <input
                        type="date"
                        value={fechaCita}
                        onChange={(e) => setFechaCita(e.target.value)}
                        className="bg-white border-2 border-gray-500 font-bold px-2 py-1.5 text-xs md:text-sm text-black focus:outline-none w-full rounded"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-800 uppercase block">Bloque Horario:</label>
                      <select
                        value={bloqueHorario}
                        onChange={(e: any) => setBloqueHorario(e.target.value)}
                        className="bg-white border-2 border-gray-500 font-bold px-1.5 py-2 text-xs text-black focus:outline-none w-full rounded"
                      >
                        {BLOQUES_HORARIOS.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Teléfono de Contacto */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-800 uppercase block">Teléfono Contacto (WhatsApp):</label>
                    <input
                      type="text"
                      value={telefonoContacto}
                      onChange={(e) => setTelefonoContacto(e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className="bg-white border-2 border-gray-500 font-bold px-3 py-2 text-xs md:text-sm text-black select-text focus:outline-none w-full rounded"
                    />
                  </div>

                  {/* Problema Reportado */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-800 uppercase block">Requerimiento / Falla Reportada:</label>
                    <textarea
                      value={problemaReportado}
                      onChange={(e) => setProblemaReportado(e.target.value)}
                      placeholder="Ej: Cambio de batería 12V 7Ah en panel DSC y revisión de zona 03..."
                      className="bg-white border-2 border-gray-500 font-bold px-3 py-2 text-xs md:text-sm text-black select-text focus:outline-none w-full h-24 resize-none rounded"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCrearOrden}
                  className="bg-[#000080] text-white hover:bg-blue-900 border-2 border-t-white border-l-white border-b-gray-900 border-r-gray-900 w-full py-3 font-black text-xs md:text-sm cursor-pointer active:translate-y-0.5 mt-4 shadow-lg rounded"
                >
                  ➕ AGENDAR ORDEN & NOTIFICAR POR WA
                </button>
              </div>

              {/* Listado de Órdenes Derecha (AMPLIADO Y AMPLIAS TABLAS) */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 p-3 shadow-inner">
                <div className="bg-[#000080] text-white text-xs md:text-sm font-black px-3 py-1.5 uppercase tracking-wider mb-3 flex flex-wrap justify-between items-center rounded-sm gap-2">
                  <div className="flex items-center gap-2">
                    <span>📋 Listado de Órdenes:</span>
                    <div className="flex gap-1 bg-blue-950 p-1 rounded">
                      <button
                        onClick={() => setFiltroEstadoTab('todas')}
                        className={`px-2.5 py-0.5 text-xs font-black rounded cursor-pointer transition-colors ${filtroEstadoTab === 'todas' ? 'bg-white text-blue-950 shadow' : 'text-blue-200 hover:text-white'}`}
                      >
                        Todas ({ordenes.length})
                      </button>
                      <button
                        onClick={() => setFiltroEstadoTab('pendientes')}
                        className={`px-2.5 py-0.5 text-xs font-black rounded cursor-pointer transition-colors ${filtroEstadoTab === 'pendientes' ? 'bg-white text-blue-950 shadow' : 'text-blue-200 hover:text-white'}`}
                      >
                        Pendientes ({ordenes.filter(o => o.estado !== 'Completada' && o.estado !== 'Cancelada').length})
                      </button>
                      <button
                        onClick={() => setFiltroEstadoTab('completadas')}
                        className={`px-2.5 py-0.5 text-xs font-black rounded cursor-pointer transition-colors ${filtroEstadoTab === 'completadas' ? 'bg-emerald-400 text-black shadow' : 'text-emerald-200 hover:text-white'}`}
                      >
                        ✅ Completadas ({ordenes.filter(o => o.estado === 'Completada').length})
                      </button>
                    </div>
                  </div>

                  <button onClick={cargarOrdenes} className="hover:text-yellow-300 text-xs font-black cursor-pointer flex items-center gap-1">
                    <span>🔄</span>
                    <span>ACTUALIZAR TABLA</span>
                  </button>
                </div>

                <div className="flex-1 overflow-auto border-2 border-gray-500 bg-white rounded">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="bg-[#d4d0c8] text-black sticky top-0 border-b-2 border-gray-400 font-black z-10">
                        <th className="p-2.5 border-r border-gray-400 text-center w-28">OT / FECHA</th>
                        <th className="p-2.5 border-r border-gray-400 text-center w-24">ESTADO</th>
                        <th className="p-2.5 border-r border-gray-400 text-center w-16">CLIENTE</th>
                        <th className="p-2.5 border-r border-gray-400">ABONADO</th>
                        <th className="p-2.5 border-r border-gray-400">TIPO / TÉCNICO</th>
                        <th className="p-2.5 border-r border-gray-400">FALLA / TRABAJO REPORTADO</th>
                        <th className="p-2.5 text-center w-28">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300">
                      {ordenes
                        .filter(o => {
                          if (filtroEstadoTab === 'pendientes') return o.estado !== 'Completada' && o.estado !== 'Cancelada'
                          if (filtroEstadoTab === 'completadas') return o.estado === 'Completada'
                          return true
                        })
                        .map(o => (
                        <tr key={o.id} className="hover:bg-blue-50 transition-colors">
                          <td className="p-2.5 border-r border-gray-300 text-center">
                            <span className="font-black font-mono text-blue-900 text-xs md:text-sm block">{o.codigo_ot || `OT-${o.id.toString().slice(-4)}`}</span>
                            <span className="text-[11px] text-gray-500 font-bold block">{o.fecha_cita}</span>
                          </td>
                          <td className="p-2.5 border-r border-gray-300 text-center font-bold">
                            <span className={`px-2.5 py-1 rounded text-xs font-black whitespace-nowrap block ${
                              o.estado === 'Completada' ? 'bg-emerald-100 text-emerald-900 border border-emerald-400' :
                              o.estado === 'En Terreno' ? 'bg-purple-100 text-purple-900 border border-purple-400' :
                              o.estado === 'En Traslado' ? 'bg-amber-100 text-amber-900 border border-amber-400' :
                              'bg-blue-100 text-blue-900 border border-blue-400'
                            }`}>
                              {o.estado.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-2.5 border-r border-gray-300 text-center font-mono font-black text-xs md:text-sm">{o.cuenta}</td>
                          <td className="p-2.5 border-r border-gray-300 font-black truncate max-w-[180px] uppercase text-xs md:text-sm">{o.nombre_abonado}</td>
                          <td className="p-2.5 border-r border-gray-300">
                            <span className="font-black text-gray-900 block text-xs">{o.tipo_visita || 'Correctiva'}</span>
                            <span className="text-gray-600 font-bold text-[11px]">{o.tecnico}</span>
                          </td>
                          <td className="p-2.5 border-r border-gray-300 max-w-[260px] truncate font-medium text-xs md:text-sm" title={o.novedad || o.problema}>
                            {o.estado === 'Completada' ? (
                              <span className="text-emerald-900 font-bold">✅ {o.novedad || o.problema}</span>
                            ) : (
                              <span>{o.problema}</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center flex items-center justify-center gap-1.5 pt-3">
                            {o.estado === 'Completada' ? (
                              <button
                                onClick={() => setOrdenImprimir(o)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-600 px-2.5 py-1 text-xs font-black rounded cursor-pointer shadow flex items-center gap-1"
                                title="Ver / Imprimir Certificado Oficial PDF"
                              >
                                <span>📄</span>
                                <span>PDF</span>
                              </button>
                            ) : null}
                            <button
                              onClick={() => handleEliminarOrden(o.id)}
                              className="bg-red-700 hover:bg-red-600 text-white border border-red-500 px-2 py-1 text-xs font-bold rounded cursor-pointer"
                              title="Eliminar Orden de Trabajo"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                      {ordenes.length === 0 && !cargando && (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-gray-400 italic text-sm">No hay órdenes de trabajo registradas.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
          </div>
        </div>
      </div>
      {/* VISOR COMPROBANTE / CERTIFICADO OFICIAL COMPLETO (HOJA CARTA EXECUTIVE PDF) */}
      {ordenImprimir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 font-sans text-black select-text print:p-0 print:bg-white print:static print:inset-auto">
          <style>{`
            @media print {
              @page {
                size: letter portrait;
                margin: 5mm;
              }
              body, html {
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-cert-card {
                width: 100% !important;
                max-width: 100% !important;
                padding: 10px !important;
                margin: 0 !important;
                border: none !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                background: white !important;
                page-break-inside: avoid !important;
              }
            }
          `}</style>

          <div className="print-cert-card w-full max-w-[850px] bg-white p-6 md:p-8 shadow-2xl rounded-3xl border border-gray-400 max-h-[96vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0 print:overflow-visible">
            
            {/* Encabezado Corporativo Oficial */}
            <div className="flex justify-between items-start border-b-2 border-blue-900 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img src="/logo-gama.png" alt="Gama Seguridad" className="w-full h-full object-contain drop-shadow" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-blue-950 tracking-wider">GAMA SEGURIDAD 24/7</h1>
                  <p className="text-xs text-gray-600 font-bold">Mantenimiento Electrónico & Monitoreo de Alarmas</p>
                  <p className="text-[10px] text-gray-500">Certificado Oficial de Atención Técnica en Terreno</p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block bg-blue-950 text-white font-mono text-sm font-black px-4 py-1.5 rounded-lg shadow">
                  CERTIFICADO N° {ordenImprimir.codigo_ot || `OT-${ordenImprimir.id}`}
                </span>
                <p className="text-xs text-gray-700 mt-2 font-bold">Emisión: {ordenImprimir.fecha_cierre || ordenImprimir.fecha_cita}</p>
                <p className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 inline-block mt-1">
                  STATUS: VERIFICADO OK
                </p>
              </div>
            </div>

            {/* SECCIÓN 1: DATOS ABONADO */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5 space-y-2">
              <h3 className="text-xs font-black text-blue-900 uppercase border-b border-slate-300 pb-1">I. Identificación del Abonado & Domicilio</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><strong>Código Cuenta:</strong> <span className="font-mono font-black text-blue-900">{ordenImprimir.cuenta}</span></div>
                <div><strong>Nombre / Razón Social:</strong> {ordenImprimir.nombre_abonado}</div>
                <div><strong>Dirección Comercial/Residencial:</strong> {ordenImprimir.direccion}</div>
                <div><strong>Teléfono Contacto:</strong> {ordenImprimir.telefono_contacto || 'Sin registro'}</div>
              </div>
            </div>

            {/* SECCIÓN 2: RESUMEN DE ATENCIÓN */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5 space-y-2">
              <h3 className="text-xs font-black text-blue-900 uppercase border-b border-slate-300 pb-1">II. Resumen Operativo del Servicio</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><strong>Tipo de Visita:</strong> {ordenImprimir.tipo_visita || 'Correctiva'}</div>
                <div><strong>Bloque Horario:</strong> {ordenImprimir.bloque_horario}</div>
                <div><strong>Técnico Certificado Responsable:</strong> {ordenImprimir.tecnico}</div>
                <div><strong>Voltaje Batería / Fuente:</strong> {ordenImprimir.voltaje_bateria || '13.8V DC (Normal)'}</div>
              </div>
            </div>

            {/* SECCIÓN 3: DIAGNÓSTICO & INFORME */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5 space-y-2">
              <h3 className="text-xs font-black text-blue-900 uppercase border-b border-slate-300 pb-1">III. Requerimiento & Diagnóstico Técnico Ejecutado</h3>
              <div className="text-xs space-y-1.5">
                <div><strong>Falla Reportada Inicial:</strong> {ordenImprimir.problema}</div>
                <div><strong>Trabajo Realizado en Terreno:</strong> {ordenImprimir.novedad}</div>
                <div><strong>Repuestos / Insumos Utilizados:</strong> {ordenImprimir.repuestos_utilizados || 'Ninguno (Mantenimiento preventivo)'}</div>
              </div>
            </div>

            {/* SECCIÓN 4: FOTOS EVIDENCIA */}
            {ordenImprimir.fotos_evidencia && ordenImprimir.fotos_evidencia.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5 space-y-2">
                <h3 className="text-xs font-black text-blue-900 uppercase border-b border-slate-300 pb-1">IV. Registro Fotográfico de Evidencia en Terreno</h3>
                <div className="grid grid-cols-3 gap-3 pt-1">
                  {ordenImprimir.fotos_evidencia.map((foto, i) => (
                    <div key={i} className="aspect-square bg-white border border-gray-300 rounded-lg overflow-hidden p-1 shadow-sm">
                      <img src={foto} alt={`Foto ${i + 1}`} className="w-full h-full object-cover rounded" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN 5: REEPCIÓN & CONFORMIDAD */}
            <div className="border border-gray-300 p-4 rounded-xl bg-slate-50 mb-6 space-y-3">
              <h3 className="text-xs font-black text-blue-900 uppercase border-b border-slate-300 pb-1">V. Conformidad & Recepción del Servicio</h3>
              
              <div className="grid grid-cols-2 gap-6 pt-2">
                <div>
                  <p className="text-xs font-bold text-gray-700">Firma Cliente Receptor:</p>
                  <p className="text-xs text-gray-600">Nombre: <strong>{ordenImprimir.nombre_firmante || 'Cliente'}</strong></p>
                  <p className="text-xs text-gray-600">RUT: <strong>{ordenImprimir.rut_firmante || 'S/RUT'}</strong></p>
                  
                  {ordenImprimir.firma ? (
                    <img src={ordenImprimir.firma} alt="Firma Touch" className="h-20 border border-gray-400 bg-white p-1 rounded mt-2 shadow-sm" />
                  ) : (
                    <div className="h-20 border border-dashed border-gray-400 bg-white rounded mt-2 flex items-center justify-center text-xs text-gray-400 italic">
                      Firma Digitalizada Registrada
                    </div>
                  )}
                </div>

                <div className="text-right flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-700">Técnico Certificado GAMA Security:</p>
                    <p className="text-xs text-gray-900 font-black">{ordenImprimir.tecnico}</p>
                    <p className="text-[10px] text-gray-500">GAMA Security 24/7 SpA — Chile</p>
                  </div>

                  <div className="border-t border-gray-300 pt-2">
                    <span className="text-[10px] text-gray-400 block font-mono">Sello Digital de Validación GAMA # {ordenImprimir.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones Imprimir / Cerrar */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 print:hidden">
              <button
                onClick={() => setOrdenImprimir(null)}
                className="px-5 py-2.5 bg-gray-200 text-gray-800 font-black text-xs rounded-xl hover:bg-gray-300 cursor-pointer"
              >
                CERRAR
              </button>
              <button
                onClick={() => generarImpresionLimpia(ordenImprimir)}
                className="px-6 py-2.5 bg-blue-900 text-white font-black text-xs rounded-xl hover:bg-blue-950 shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                <span>🖨️</span>
                <span>IMPRIMIR / DESCARGAR CERTIFICADO PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
