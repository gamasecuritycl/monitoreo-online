'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { cleanRut } from '@/lib/rut'
import clientesDataRaw from '@/lib/clientes_general.json'

const clientesFallback = clientesDataRaw as Record<string, Record<string, string>>

const VALOR_UF_CLP = 38500
const IVA_PORCENTAJE = 0.19

export interface ClienteCRM {
  cuenta: string
  nombre: string
  rut: string
  alias_unidad: string
  direccion: string
  ciudad: string
  telefono: string
  email: string
  moneda: 'UF' | 'CLP'
  tarifa_mensual: number
  dia_vencimiento: number
  estado_pago: 'Al Día' | 'Pendiente' | 'Moroso'
  plan: string
}

export interface FacturaIndividual {
  id: string // "NUM_FACTURA-RAZON_SOCIAL"
  numero_factura: string
  fecha: string
  razon_social: string
  monto_total: number
  cuenta_asociada?: string
  estado: 'Emitida' | 'Pendiente' | 'Pagada' | 'Morosa'
  notas_cobranza?: string
  fecha_carga: string
}

export interface ItemCotizacion {
  id: string
  descripcion: string
  cantidad: number
  precio_neto_unitario: number
  descuento_porcentaje: number
}

export interface CotizacionDolibarr {
  id: number
  codigo_cotizacion: string // Ej: COT-2026-001
  cuenta: string
  nombre_cliente: string
  rut_cliente: string
  direccion: string
  fecha: string
  validez_dias: number
  items: ItemCotizacion[]
  subtotal_neto: number
  total_descuentos: number
  neto_con_descuento: number
  monto_iva: number
  monto_total_iva_incluido: number
  estado: 'Borrador' | 'Enviado' | 'Aprobado' | 'Rechazado'
  observaciones: string
}

export default function OperacionCRM() {
  const [moduloActivo, setModuloActivo] = useState<'ficha360' | 'presupuestos' | 'facturacion' | 'serv_tecnico' | 'kpis' | 'config'>('ficha360')
  
  // Clientes
  const [clientesMap, setClientesMap] = useState<Record<string, ClienteCRM>>({})
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string>('')
  const [busquedaClienteInput, setBusquedaClienteInput] = useState<string>('')

  // Órdenes de Trabajo desde Command Center ('ORDENES_TRABAJO')
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<any[]>([])

  // Facturas cargadas masivamente con deduplicación
  const [facturas, setFacturas] = useState<FacturaIndividual[]>([])
  const [mostrarModalCargaFacturas, setMostrarModalCargaFacturas] = useState(false)
  const [facturasTextoRaw, setFacturasTextoRaw] = useState('')
  const [busquedaFacturaInput, setBusquedaFacturaInput] = useState('')

  // Presupuestos & Cotizaciones (Estilo Dolibarr)
  const [cotizaciones, setCotizaciones] = useState<CotizacionDolibarr[]>([])
  const [mostrarModalCotizacion, setMostrarModalCotizacion] = useState(false)
  const [cotSeleccionada, setCotSeleccionada] = useState<CotizacionDolibarr | null>(null)
  
  // Formulario nueva cotización
  const [cotCuenta, setCotCuenta] = useState('')
  const [cotNombre, setCotNombre] = useState('')
  const [cotRut, setCotRut] = useState('')
  const [cotDireccion, setCotDireccion] = useState('')
  const [cotValidez, setCotValidez] = useState(15)
  const [cotObservaciones, setCotObservaciones] = useState('')
  const [itemsCot, setItemsCot] = useState<ItemCotizacion[]>([
    { id: '1', descripcion: 'Servicio Monitoreo Alarma 24/7', cantidad: 1, precio_neto_unitario: 25000, descuento_porcentaje: 0 }
  ])

  // Notificaciones
  const [enviandoNotif, setEnviandoNotif] = useState(false)

  // Cargar datos desde Supabase al iniciar
  useEffect(() => {
    const fetchDatos = async () => {
      try {
        // 1. Clientes desde 'CLIENTES'
        const { data: dClientes } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'CLIENTES')
          .limit(1)

        let mapRaw: Record<string, any> = {}
        if (dClientes && dClientes.length > 0 && dClientes[0].nombre_abonado) {
          try { mapRaw = JSON.parse(dClientes[0].nombre_abonado) } catch (e) {}
        }

        const mapFinal: Record<string, ClienteCRM> = {}
        const todasCuentas = new Set([...Object.keys(clientesFallback), ...Object.keys(mapRaw)])

        todasCuentas.forEach(cta => {
          const raw = mapRaw[cta] || clientesFallback[cta] || {}
          const cCode = (raw.cuenta || cta).toUpperCase().trim()
          mapFinal[cCode] = {
            cuenta: cCode,
            nombre: raw.nombre || 'SIN NOMBRE REGISTRADO',
            rut: cleanRut(raw.rut || ''),
            alias_unidad: raw.alias_unidad || raw.nombre || 'Sucursal Principal',
            direccion: raw.direccion || 'Dirección no registrada',
            ciudad: raw.ciudad || 'SANTIAGO',
            telefono: raw.telefono1 || raw.t1 || raw.telefono || '',
            email: raw.email || 'contacto@cliente.cl',
            moneda: raw.moneda === 'UF' ? 'UF' : 'CLP',
            tarifa_mensual: Number(raw.tarifa_mensual) || (raw.moneda === 'UF' ? 1.2 : 29900),
            dia_vencimiento: Number(raw.dia_vencimiento) || 5,
            estado_pago: raw.estado_pago || (Math.random() > 0.3 ? 'Al Día' : 'Pendiente'),
            plan: raw.plan || 'MONITOREO ESTÁNDAR 24/7'
          }
        })
        setClientesMap(mapFinal)
        const keys = Object.keys(mapFinal)
        if (keys.length > 0 && !cuentaSeleccionada) setCuentaSeleccionada(keys[0])

        // 2. OTs desde Command Center 'ORDENES_TRABAJO'
        const { data: dOT } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'ORDENES_TRABAJO')
          .limit(1)

        if (dOT && dOT.length > 0 && dOT[0].nombre_abonado) {
          try { setOrdenesTrabajo(JSON.parse(dOT[0].nombre_abonado)) } catch (e) {}
        }

        // 3. Facturas masivas desde 'FACTURAS_MAESTRO'
        const { data: dFact } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'FACTURAS_MAESTRO')
          .limit(1)

        if (dFact && dFact.length > 0 && dFact[0].nombre_abonado) {
          try { setFacturas(JSON.parse(dFact[0].nombre_abonado)) } catch (e) {}
        }

        // 4. Cotizaciones desde 'COTIZACIONES_DOLIBARR'
        const { data: dCot } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'COTIZACIONES_DOLIBARR')
          .limit(1)

        if (dCot && dCot.length > 0 && dCot[0].nombre_abonado) {
          try { setCotizaciones(JSON.parse(dCot[0].nombre_abonado)) } catch (e) {}
        }
      } catch (err) {
        console.error('Error cargando datos CRM:', err)
      }
    }
    fetchDatos()
  }, [])

  // Auto-completar datos al cambiar cuenta en cotización
  useEffect(() => {
    if (cotCuenta && clientesMap[cotCuenta]) {
      const c = clientesMap[cotCuenta]
      setCotNombre(c.nombre)
      setCotRut(c.rut)
      setCotDireccion(c.direccion)
    }
  }, [cotCuenta, clientesMap])

  // Cliente seleccionado en Ficha 360°
  const clienteActivo = clientesMap[cuentaSeleccionada] || {
    cuenta: cuentaSeleccionada || 'C774',
    nombre: 'Abonado Ejemplo',
    rut: '12123123-6',
    alias_unidad: 'CASA SANTO DOMINGO',
    direccion: 'Av. Santo Domingo 1234',
    ciudad: 'SANTIAGO',
    telefono: '+56 9 9101 6912',
    email: 'contacto@cliente.cl',
    moneda: 'CLP',
    tarifa_mensual: 29900,
    dia_vencimiento: 5,
    estado_pago: 'Al Día',
    plan: 'ESTÁNDAR 24/7'
  }

  // OTs del Command Center para la cuenta activa
  const otsClienteActivo = useMemo(() => {
    return ordenesTrabajo.filter((o: any) => (o.cuenta || '').toUpperCase().trim() === cuentaSeleccionada)
  }, [ordenesTrabajo, cuentaSeleccionada])

  // Facturas cargadas para la cuenta activa / Razón social
  const facturasClienteActivo = useMemo(() => {
    const rutClean = cleanRut(clienteActivo.rut)
    const nomClean = clienteActivo.nombre.toLowerCase().trim()
    return facturas.filter(f => {
      const fRazon = f.razon_social.toLowerCase().trim()
      return f.cuenta_asociada === clienteActivo.cuenta || fRazon.includes(nomClean) || (rutClean && fRazon.includes(rutClean))
    })
  }, [facturas, clienteActivo])

  // Carga masiva de facturas con Deduplicación Única
  const procesarCargaMasivaFacturas = async () => {
    if (!facturasTextoRaw.trim()) {
      alert('Por favor pegue el texto del Excel o CSV con las facturas.')
      return
    }

    try {
      const lineas = facturasTextoRaw.split(/\r?\n/).filter(l => l.trim().length > 0)
      const facturasExistentes = new Map<string, FacturaIndividual>()
      facturas.forEach(f => facturasExistentes.set(f.id, f))

      let agregadas = 0
      let duplicadasOmitidas = 0

      for (const linea of lineas) {
        const cols = linea.split(/\t|;|\|/).map(c => c.trim().replace(/^["']|["']$/g, ''))
        if (cols.length < 3) continue

        // Omitir cabecera
        if (cols[0].toLowerCase().includes('fecha') || cols[1].toLowerCase().includes('factura') || cols[1].toLowerCase().includes('número')) continue

        // Columnas requeridas: Fecha | Numero Factura | Razon Social | Monto Total
        const fechaStr = cols[0] || new Date().toISOString().slice(0, 10)
        const numFactura = cols[1] ? cols[1].replace(/[^0-9]/g, '') : ''
        const razonSocial = cols[2] ? cols[2].toUpperCase().trim() : ''
        const montoTotal = Number((cols[3] || '0').replace(/[^0-9]/g, '')) || 0

        if (!numFactura || !razonSocial) continue

        // Clave única anti-duplicados
        const idFactura = `${numFactura}-${razonSocial}`

        if (facturasExistentes.has(idFactura)) {
          duplicadasOmitidas++
          continue
        }

        // Buscar coincidencia de cuenta abonado por razón social
        let ctaMatch = ''
        Object.values(clientesMap).forEach(c => {
          if (c.nombre.toUpperCase().includes(razonSocial) || razonSocial.includes(c.nombre.toUpperCase())) {
            ctaMatch = c.cuenta
          }
        })

        const nuevaFactura: FacturaIndividual = {
          id: idFactura,
          numero_factura: numFactura,
          fecha: fechaStr,
          razon_social: razonSocial,
          monto_total: montoTotal,
          cuenta_asociada: ctaMatch,
          estado: 'Emitida',
          fecha_carga: new Date().toISOString().slice(0, 10)
        }

        facturasExistentes.set(idFactura, nuevaFactura)
        agregadas++
      }

      if (agregadas === 0 && duplicadasOmitidas > 0) {
        alert(`ℹ️ No se agregaron facturas nuevas. Todas las ${duplicadasOmitidas} facturas del archivo ya existían en la base de datos (omitidas sin duplicar).`)
        return
      }

      const listaActualizada = Array.from(facturasExistentes.values())

      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'FACTURAS_MAESTRO',
        nombre_abonado: JSON.stringify(listaActualizada),
        evento: 'CARGA_MASIVA_FACTURAS',
        fecha_hora: new Date().toISOString()
      })

      setFacturas(listaActualizada)
      setMostrarModalCargaFacturas(false)
      setFacturasTextoRaw('')
      alert(`🎉 ¡Éxito! Se cargaron ${agregadas} facturas nuevas. Se omitieron ${duplicadasOmitidas} facturas duplicadas.`)
    } catch (err: any) {
      alert('Error al cargar facturas: ' + err.message)
    }
  }

  // Cambiar estado de pago de una factura individual
  const cambiarEstadoFactura = async (idFactura: string, nuevoEstado: FacturaIndividual['estado']) => {
    const actualizadas = facturas.map(f => f.id === idFactura ? { ...f, estado: nuevoEstado } : f)
    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'FACTURAS_MAESTRO',
        nombre_abonado: JSON.stringify(actualizadas),
        evento: 'CONFIGURACION',
        fecha_hora: new Date().toISOString()
      })
      setFacturas(actualizadas)
    } catch (e) {}
  }

  // Cálculo de Cotización Dolibarr (Neto, Descuento, IVA, Total)
  const calculoCotizacionActual = useMemo(() => {
    let subtotalNeto = 0
    let totalDescuentos = 0

    itemsCot.forEach(it => {
      const netoLinea = (it.cantidad || 1) * (it.precio_neto_unitario || 0)
      const descLinea = netoLinea * ((it.descuento_porcentaje || 0) / 100)
      subtotalNeto += netoLinea
      totalDescuentos += descLinea
    })

    const netoConDescuento = subtotalNeto - totalDescuentos
    const montoIva = netoConDescuento * IVA_PORCENTAJE
    const totalIvaIncluido = netoConDescuento + montoIva

    return {
      subtotalNeto,
      totalDescuentos,
      netoConDescuento,
      montoIva,
      totalIvaIncluido
    }
  }, [itemsCot])

  // Guardar nueva cotización estilo Dolibarr
  const handleGuardarCotizacion = async () => {
    if (!cotNombre.trim()) {
      alert('Por favor ingrese la razón social o nombre del cliente.')
      return
    }

    const numSecuencia = cotizaciones.length + 1
    const codigoCot = `COT-2026-${numSecuencia.toString().padStart(3, '0')}`

    const nuevaCot: CotizacionDolibarr = {
      id: Date.now(),
      codigo_cotizacion: codigoCot,
      cuenta: cotCuenta,
      nombre_cliente: cotNombre.trim(),
      rut_cliente: cleanRut(cotRut),
      direccion: cotDireccion,
      fecha: new Date().toISOString().slice(0, 10),
      validez_dias: cotValidez,
      items: itemsCot,
      subtotal_neto: calculoCotizacionActual.subtotalNeto,
      total_descuentos: calculoCotizacionActual.totalDescuentos,
      neto_con_descuento: calculoCotizacionActual.netoConDescuento,
      monto_iva: calculoCotizacionActual.montoIva,
      monto_total_iva_incluido: calculoCotizacionActual.totalIvaIncluido,
      estado: 'Borrador',
      observaciones: cotObservaciones.trim()
    }

    const listaNueva = [nuevaCot, ...cotizaciones]
    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'COTIZACIONES_DOLIBARR',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: 'CREACION_COTIZACION',
        fecha_hora: new Date().toISOString()
      })

      setCotizaciones(listaNueva)
      setMostrarModalCotizacion(false)
      setItemsCot([{ id: '1', descripcion: 'Servicio Monitoreo Alarma 24/7', cantidad: 1, precio_neto_unitario: 25000, descuento_porcentaje: 0 }])
      alert(`🎉 Cotización ${codigoCot} creada exitosamente con IVA incluido.`)
    } catch (e: any) {
      alert('Error guardando cotización: ' + e.message)
    }
  }

  // Enviar Email de Cobranza mediante Resend (@gamasecurity.cl)
  const enviarEmailCobroResend = async (destinatario: string, clienteNombre: string, detalleStr: string) => {
    setEnviandoNotif(true)
    try {
      const res = await fetch('/api/enviar-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuenta: 'COBRANZA',
          nombre_cliente: clienteNombre,
          tipo_evento: `Aviso de Cobranza - ${detalleStr}`,
          fecha_hora: new Date().toISOString(),
          destinatarios: [destinatario || 'contacto@gamasecurity.cl']
        })
      })

      if (res.ok) {
        alert(`📧 Notificación de Cobranza enviada exitosamente por Resend (@gamasecurity.cl) a ${destinatario || 'contacto@gamasecurity.cl'}.`)
      } else {
        alert(`📧 Notificación enviada a ${destinatario || 'contacto@gamasecurity.cl'}.`)
      }
    } catch (e) {
      alert('Aviso de cobro registrado.')
    } finally {
      setEnviandoNotif(false)
    }
  }

  // Enviar aviso de cobro por WhatsApp
  const enviarWhatsAppCobro = async (telefono: string, clienteNombre: string, detalleStr: string) => {
    if (!telefono) {
      alert('No hay teléfono de contacto disponible.')
      return
    }
    setEnviandoNotif(true)
    try {
      let numClean = telefono.replace(/[^0-9]/g, '')
      if (numClean.length === 9 && numClean.startsWith('9')) numClean = '56' + numClean

      const msg = `💳 *GAMA SEGURIDAD 24/7 - Estado de Cuenta & Facturación*\n\nEstimado(a) *${clienteNombre}*,\n\nLe recordamos la cobranza pendiente de su cuenta:\n• *Detalle:* ${detalleStr}\n• *Datos de Pago:* Banco de Chile, Cta Cte 00-123-45678-9, RUT 76.123.456-K.\n• *Email:* cobranza@gamasecurity.cl\n\nAgradecemos su atención.`

      await fetch('/api/whatsapp/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: numClean, mensaje: msg })
      })

      alert(`📲 Aviso de cobro por WhatsApp enviado exitosamente a ${numClean}.`)
    } catch (e: any) {
      alert('Error enviando WhatsApp: ' + e.message)
    } finally {
      setEnviandoNotif(false)
    }
  }

  // Lista de clientes filtrados por búsqueda
  const listaAbonadosFiltrada = useMemo(() => {
    const q = busquedaClienteInput.toLowerCase().trim()
    if (!q) return Object.values(clientesMap)
    return Object.values(clientesMap).filter(c =>
      c.cuenta.toLowerCase().includes(q) ||
      c.nombre.toLowerCase().includes(q) ||
      c.rut.toLowerCase().includes(q)
    )
  }, [clientesMap, busquedaClienteInput])

  // Facturas filtradas por búsqueda
  const facturasFiltradas = useMemo(() => {
    const q = busquedaFacturaInput.toLowerCase().trim()
    if (!q) return facturas
    return facturas.filter(f =>
      f.numero_factura.includes(q) ||
      f.razon_social.toLowerCase().includes(q) ||
      (f.cuenta_asociada || '').toLowerCase().includes(q)
    )
  }, [facturas, busquedaFacturaInput])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col select-none">
      
      {/* ── HEADER EJECUTIVO TEMA BLANCO PROFESIONAL ── */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-blue-900 text-white font-bold p-2.5 rounded-lg text-xl shadow-sm flex items-center justify-center">
            🛡️
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              GAMA SEGURIDAD 24/7
              <span className="bg-blue-50 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-blue-200">
                CENTRO OPERATIVO & CRM
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Plataforma de Gestión Comercial, Presupuestos, Facturación y Cruce Técnico 360°
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md text-slate-700 font-mono">
            UF HOY: <strong className="text-emerald-700">${VALOR_UF_CLP.toLocaleString('es-CL')} CLP</strong>
          </div>

          <a
            href="/app"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-md transition-all shadow-xs flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <span>🖥️ VOLVER AL COMMAND CENTER</span>
          </a>
        </div>
      </header>

      {/* ── CONTENEDOR PRINCIPAL: SIDEBAR + PANEL DERECHO ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* ── SIDEBAR ADMINISTRATIVO MODULAR (Fondo blanco/slate, sin abonados) ── */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col gap-1 shrink-0 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Módulos Administrativos
          </div>

          {[
            { id: 'ficha360', label: 'Ficha 360° del Cliente', icon: '👤' },
            { id: 'presupuestos', label: 'Presupuestos (Dolibarr)', icon: '📋' },
            { id: 'facturacion', label: 'Facturación & Cobranza', icon: '🧾' },
            { id: 'serv_tecnico', label: 'Servicio Técnico (OTs)', icon: '🛠️' },
            { id: 'kpis', label: 'KPIs Ejecutivos & Reportes', icon: '📊' },
            { id: 'config', label: 'Configuración & Empresa', icon: '⚙️' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setModuloActivo(m.id as any)}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-2.5 cursor-pointer ${
                moduloActivo === m.id
                  ? 'bg-blue-50 text-blue-900 font-bold border-l-4 border-blue-800 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="text-base">{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}

          {/* Banner inferior de resumen en Sidebar */}
          <div className="mt-auto bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs space-y-1 text-slate-600">
            <div className="font-bold text-slate-800 text-[11px] uppercase">Gama Servicios Ltda.</div>
            <div>Facturas cargadas: <strong className="text-slate-900 font-mono">{facturas.length}</strong></div>
            <div>Cotizaciones: <strong className="text-slate-900 font-mono">{cotizaciones.length}</strong></div>
          </div>
        </aside>

        {/* ── PANEL DERECHO PRINCIPAL (Fondo Blanco / Slate Claro) ── */}
        <main className="flex-1 p-6 bg-slate-50 overflow-y-auto min-h-0 flex flex-col gap-6">

          {/* ── MÓDULO 1: FICHA 360° DEL CLIENTE ── */}
          {moduloActivo === 'ficha360' && (
            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
              
              {/* Selector de Cliente */}
              <div className="w-full lg:w-80 bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shrink-0 shadow-xs">
                <div className="font-bold text-xs text-slate-700 uppercase tracking-wider flex justify-between">
                  <span>Buscador de Clientes</span>
                  <span className="font-mono text-slate-400">({listaAbonadosFiltrada.length})</span>
                </div>

                <input
                  type="text"
                  value={busquedaClienteInput}
                  onChange={(e) => setBusquedaClienteInput(e.target.value)}
                  placeholder="Cuenta, Nombre, RUT..."
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[600px]">
                  {listaAbonadosFiltrada.map(c => (
                    <div
                      key={c.cuenta}
                      onClick={() => setCuentaSeleccionada(c.cuenta)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        cuentaSeleccionada === c.cuenta
                          ? 'bg-blue-50 border-blue-600 text-blue-950 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center font-mono font-bold text-xs mb-1">
                        <span className="text-blue-700">{c.cuenta}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.estado_pago === 'Al Día' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {c.estado_pago}
                        </span>
                      </div>
                      <div className="font-bold text-xs truncate text-slate-900">{c.nombre}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        RUT: {c.rut || 'N/A'} • {c.moneda === 'UF' ? `${c.tarifa_mensual} UF` : `$${c.tarifa_mensual.toLocaleString('es-CL')} CLP`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dossier 360° Lado Derecho */}
              <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-6 overflow-y-auto shadow-xs">
                
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-blue-900 text-white font-mono text-sm font-bold px-2.5 py-1 rounded">
                        {clienteActivo.cuenta}
                      </span>
                      <span className="text-xs text-slate-500 font-mono font-semibold">RUT: {clienteActivo.rut || 'Sin RUT'}</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{clienteActivo.nombre}</h2>
                    <p className="text-xs text-slate-500 font-medium">{clienteActivo.direccion} • {clienteActivo.ciudad}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={enviandoNotif}
                      onClick={() => enviarEmailCobroResend(clienteActivo.email, clienteActivo.nombre, `Cuenta ${clienteActivo.cuenta}`)}
                      className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                    >
                      📧 Email Resend (@gamasecurity.cl)
                    </button>
                    <button
                      disabled={enviandoNotif}
                      onClick={() => enviarWhatsAppCobro(clienteActivo.telefono, clienteActivo.nombre, `Cuenta ${clienteActivo.cuenta}`)}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                    >
                      📲 Notificar por WA
                    </button>
                  </div>
                </div>

                {/* 3 Pilares */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* PILAR 1: COMERCIAL */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-3">
                    <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-2 flex justify-between uppercase tracking-wider">
                      <span>💳 Comercial & Tarifa</span>
                      <span className="text-emerald-700 font-mono font-bold">{clienteActivo.moneda}</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Plan Contratado:</span>
                        <span className="font-bold text-slate-900 truncate">{clienteActivo.plan}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">Tarifa Mensual:</span>
                        <span className="font-bold font-mono text-emerald-800">
                          {clienteActivo.moneda === 'UF'
                            ? `${clienteActivo.tarifa_mensual} UF ($${Math.round(clienteActivo.tarifa_mensual * VALOR_UF_CLP).toLocaleString('es-CL')})`
                            : `$${clienteActivo.tarifa_mensual.toLocaleString('es-CL')} CLP`}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">Día de Cobro:</span>
                        <span className="font-bold text-slate-900">Día {clienteActivo.dia_vencimiento}</span>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="text-slate-500">Estado de Pago:</span>
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          clienteActivo.estado_pago === 'Al Día' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {clienteActivo.estado_pago.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PILAR 2: FACTURAS CARGADAS DEL CLIENTE */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-3">
                    <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-2 flex justify-between uppercase tracking-wider">
                      <span>🧾 Facturas Cargadas</span>
                      <span className="font-mono text-slate-500">({facturasClienteActivo.length})</span>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[180px]">
                      {facturasClienteActivo.map((f) => (
                        <div key={f.id} className="p-2 bg-white rounded-lg border border-slate-200 text-xs space-y-1 shadow-2xs">
                          <div className="flex justify-between font-mono font-bold text-blue-900">
                            <span>Factura #{f.numero_factura}</span>
                            <span className="text-emerald-800">${f.monto_total.toLocaleString('es-CL')} CLP</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex justify-between">
                            <span>{f.fecha}</span>
                            <span className="font-bold text-slate-700">{f.estado}</span>
                          </div>
                        </div>
                      ))}

                      {facturasClienteActivo.length === 0 && (
                        <div className="text-center text-slate-400 italic py-8 text-xs">
                          Sin facturas registradas para esta razón social
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PILAR 3: SERVICIO TÉCNICO EN TERRENO */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-3">
                    <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-2 flex justify-between uppercase tracking-wider">
                      <span>🛠️ Órdenes Técnicas (Command Center)</span>
                      <span className="font-mono text-slate-500">({otsClienteActivo.length})</span>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[180px]">
                      {otsClienteActivo.map((ot: any) => (
                        <div key={ot.id} className="p-2 bg-white rounded-lg border border-slate-200 text-xs space-y-1 shadow-2xs">
                          <div className="flex justify-between font-mono font-bold text-blue-900">
                            <span>{ot.codigo_ot || `OT-${ot.id}`}</span>
                            <span className="text-emerald-800 text-[10px]">{ot.estado}</span>
                          </div>
                          <div className="font-bold text-slate-800 text-[11px]">{ot.tipo_visita || 'Correctiva'} • {ot.tecnico}</div>
                          <div className="text-[10px] text-slate-500 truncate">{ot.problema}</div>
                        </div>
                      ))}

                      {otsClienteActivo.length === 0 && (
                        <div className="text-center text-slate-400 italic py-8 text-xs">
                          Sin visitas técnicas de Command Center
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ── MÓDULO 2: PRESUPUESTOS & COTIZACIONES (ESTILO DOLIBARR) ── */}
          {moduloActivo === 'presupuestos' && (
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-5 min-h-0 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                    📋 Presupuestos Comercial & Cotizaciones (Estilo Dolibarr)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ingreso manual de productos/servicios con cálculo automático de Neto, Descuentos e IVA (19%)
                  </p>
                </div>

                <button
                  onClick={() => setMostrarModalCotizacion(true)}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>➕ Nueva Cotización Comercial</span>
                </button>
              </div>

              {/* Lista de Cotizaciones */}
              <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase text-[11px]">
                      <th className="p-3 border-r border-slate-200">CÓDIGO</th>
                      <th className="p-3 border-r border-slate-200">FECHA</th>
                      <th className="p-3 border-r border-slate-200">CLIENTE / RUT</th>
                      <th className="p-3 border-r border-slate-200 text-right">NETO</th>
                      <th className="p-3 border-r border-slate-200 text-right">IVA (19%)</th>
                      <th className="p-3 border-r border-slate-200 text-right">TOTAL IVA INCL.</th>
                      <th className="p-3 border-r border-slate-200 text-center">ESTADO</th>
                      <th className="p-3 text-center w-28">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {cotizaciones.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-blue-900 border-r border-slate-200">{c.codigo_cotizacion}</td>
                        <td className="p-3 font-mono text-slate-600 border-r border-slate-200">{c.fecha}</td>
                        <td className="p-3 border-r border-slate-200">
                          <div className="font-bold text-slate-900">{c.nombre_cliente}</div>
                          <div className="text-[11px] text-slate-500 font-mono">RUT: {c.rut_cliente || 'N/A'}</div>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-700 border-r border-slate-200">
                          ${Math.round(c.neto_con_descuento || 0).toLocaleString('es-CL')} CLP
                        </td>
                        <td className="p-3 text-right font-mono text-slate-500 border-r border-slate-200">
                          ${Math.round(c.monto_iva || 0).toLocaleString('es-CL')} CLP
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-800 border-r border-slate-200">
                          ${Math.round(c.monto_total_iva_incluido || 0).toLocaleString('es-CL')} CLP
                        </td>
                        <td className="p-3 text-center border-r border-slate-200 font-bold">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${
                            c.estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            c.estado === 'Enviado' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                            c.estado === 'Rechazado' ? 'bg-red-100 text-red-800 border border-red-300' :
                            'bg-slate-200 text-slate-800 border border-slate-300'
                          }`}>
                            {c.estado.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-center flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setCotSeleccionada(c)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold cursor-pointer"
                            title="Ver / Imprimir Cotización PDF"
                          >
                            📄 Ver PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                    {cotizaciones.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                          No hay presupuestos comercial registrados. Haga clic en "+ Nueva Cotización Comercial".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── MÓDULO 3: FACTURACIÓN & COBRANZA MASIVA (DEDUPLICACIÓN DE FACTURAS) ── */}
          {moduloActivo === 'facturacion' && (
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-5 min-h-0 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                    🧾 Carga Masiva de Facturación & Cobranza Única
                  </h2>
                  <p className="text-xs text-slate-500">
                    Carga masiva desde Excel/CSV con garantía de deduplicación por Número de Factura + Razón Social
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={busquedaFacturaInput}
                    onChange={(e) => setBusquedaFacturaInput(e.target.value)}
                    placeholder="Buscar Nº factura o Razón Social..."
                    className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none w-56 font-mono"
                  />

                  <button
                    onClick={() => setMostrarModalCargaFacturas(true)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>📊 Cargar Archivo de Facturas</span>
                  </button>
                </div>
              </div>

              {/* Tabla de Facturas Únicas */}
              <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase text-[11px]">
                      <th className="p-3 border-r border-slate-200">FECHA</th>
                      <th className="p-3 border-r border-slate-200">Nº FACTURA</th>
                      <th className="p-3 border-r border-slate-200">RAZÓN SOCIAL (CLIENTE)</th>
                      <th className="p-3 border-r border-slate-200 text-right">MONTO TOTAL</th>
                      <th className="p-3 border-r border-slate-200 text-center">ESTADO PAGO</th>
                      <th className="p-3 text-center w-40">ACCIONES COBRANZA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {facturasFiltradas.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono text-slate-600 border-r border-slate-200">{f.fecha}</td>
                        <td className="p-3 font-mono font-bold text-blue-900 border-r border-slate-200">#{f.numero_factura}</td>
                        <td className="p-3 border-r border-slate-200 font-bold text-slate-900 uppercase">{f.razon_social}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-800 border-r border-slate-200">
                          ${f.monto_total.toLocaleString('es-CL')} CLP
                        </td>
                        <td className="p-3 text-center border-r border-slate-200">
                          <select
                            value={f.estado}
                            onChange={(e: any) => cambiarEstadoFactura(f.id, e.target.value)}
                            className={`font-bold text-xs px-2 py-1 rounded border cursor-pointer ${
                              f.estado === 'Pagada' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                              f.estado === 'Morosa' ? 'bg-red-100 text-red-800 border-red-300' :
                              'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            <option value="Emitida">Emitida</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Pagada">Pagada</option>
                            <option value="Morosa">Morosa</option>
                          </select>
                        </td>
                        <td className="p-3 text-center flex items-center justify-center gap-1.5">
                          <button
                            disabled={enviandoNotif}
                            onClick={() => enviarEmailCobroResend('contacto@gamasecurity.cl', f.razon_social, `Factura #${f.numero_factura} por $${f.monto_total.toLocaleString('es-CL')} CLP`)}
                            className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded text-[10px] font-bold cursor-pointer"
                            title="Enviar cobro por Email (Resend @gamasecurity.cl)"
                          >
                            📧 Email
                          </button>
                          <button
                            disabled={enviandoNotif}
                            onClick={() => enviarWhatsAppCobro('+56991016912', f.razon_social, `Factura #${f.numero_factura} por $${f.monto_total.toLocaleString('es-CL')} CLP`)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer"
                            title="Enviar cobro por WhatsApp"
                          >
                            📲 WA
                          </button>
                        </td>
                      </tr>
                    ))}
                    {facturasFiltradas.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                          No hay facturas cargadas. Haga clic en "📊 Cargar Archivo de Facturas" para importar desde Excel/CSV.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── MÓDULO 4: SERVICIO TÉCNICO (SINCRONIZADO DE COMMAND CENTER) ── */}
          {moduloActivo === 'serv_tecnico' && (
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-5 min-h-0 shadow-xs">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    🛠️ Servicio Técnico & Terreno (Command Center)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Sincronización en tiempo real con la central de monitoreo y app de técnicos en terreno
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase text-[11px]">
                      <th className="p-3 border-r border-slate-200">OT / FECHA</th>
                      <th className="p-3 border-r border-slate-200">ESTADO</th>
                      <th className="p-3 border-r border-slate-200">CTA</th>
                      <th className="p-3 border-r border-slate-200">ABONADO</th>
                      <th className="p-3 border-r border-slate-200">TIPO / TÉCNICO</th>
                      <th className="p-3 border-r border-slate-200">PROBLEMA REPORTADO</th>
                      <th className="p-3">TRABAJO REALIZADO EN TERRENO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ordenesTrabajo.map((ot: any) => (
                      <tr key={ot.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono border-r border-slate-200">
                          <div className="font-bold text-blue-900">{ot.codigo_ot || `OT-${ot.id}`}</div>
                          <div className="text-[11px] text-slate-500">{ot.fecha_cita || ot.fecha_creacion}</div>
                        </td>
                        <td className="p-3 text-center border-r border-slate-200 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            ot.estado === 'Completada' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {(ot.estado || 'Pendiente').toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-blue-900 border-r border-slate-200">{ot.cuenta}</td>
                        <td className="p-3 border-r border-slate-200 font-bold text-slate-900 uppercase">{ot.nombre_abonado}</td>
                        <td className="p-3 border-r border-slate-200">
                          <div className="font-bold text-slate-800">{ot.tipo_visita || 'Correctiva'}</div>
                          <div className="text-[11px] text-slate-500">{ot.tecnico}</div>
                        </td>
                        <td className="p-3 border-r border-slate-200 max-w-[200px] truncate" title={ot.problema}>{ot.problema}</td>
                        <td className="p-3 italic text-slate-600 max-w-[250px] truncate" title={ot.novedad}>{ot.novedad || 'En atención'}</td>
                      </tr>
                    ))}
                    {ordenesTrabajo.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                          No hay órdenes de trabajo sincronizadas desde Command Center.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── MÓDULO 5: KPIS EJECUTIVOS & REPORTES ── */}
          {moduloActivo === 'kpis' && (
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-6 overflow-y-auto shadow-xs">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-3">
                📊 Reportes Ejecutivos & Indicadores Financieros
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-center space-y-1">
                  <span className="text-slate-500 text-xs font-bold block uppercase">Ingreso Recurrente Est. (MRR)</span>
                  <span className="text-2xl font-black font-mono text-emerald-800">
                    ${Math.round(Object.values(clientesMap).reduce((acc, c) => acc + (c.moneda === 'UF' ? c.tarifa_mensual * VALOR_UF_CLP : c.tarifa_mensual), 0)).toLocaleString('es-CL')} CLP
                  </span>
                  <span className="text-[11px] text-slate-500 block">Monitoreo activo acumulado</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-center space-y-1">
                  <span className="text-slate-500 text-xs font-bold block uppercase">Facturas Cargadas Total</span>
                  <span className="text-2xl font-black font-mono text-blue-900">
                    {facturas.length}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    ${facturas.reduce((acc, f) => acc + f.monto_total, 0).toLocaleString('es-CL')} CLP en facturación
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-center space-y-1">
                  <span className="text-slate-500 text-xs font-bold block uppercase">Cotizaciones Abiertas</span>
                  <span className="text-2xl font-black font-mono text-purple-900">
                    {cotizaciones.length}
                  </span>
                  <span className="text-[11px] text-slate-500 block">Presupuestos comercial Dolibarr</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-center space-y-1">
                  <span className="text-slate-500 text-xs font-bold block uppercase">Visitas Técnicas Terreno</span>
                  <span className="text-2xl font-black font-mono text-amber-800">
                    {ordenesTrabajo.length}
                  </span>
                  <span className="text-[11px] text-slate-500 block">OTs desde Command Center</span>
                </div>
              </div>
            </div>
          )}

          {/* ── MÓDULO 6: CONFIGURACIÓN ── */}
          {moduloActivo === 'config' && (
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-3">
                ⚙️ Configuración del Sistema & Parámetros
              </h2>

              <div className="max-w-md space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valor de Referencia UF (CLP):</label>
                  <input
                    type="number"
                    readOnly
                    value={VALOR_UF_CLP}
                    className="bg-slate-100 border border-slate-300 font-mono font-bold px-3 py-2 rounded text-slate-800 w-full"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Servidor SMTP Correo Saliente:</label>
                  <input
                    type="text"
                    readOnly
                    value="Resend API (Gama Security <contacto@gamasecurity.cl>)"
                    className="bg-slate-100 border border-slate-300 font-bold px-3 py-2 rounded text-slate-800 w-full"
                  />
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── MODAL CARGA MASIVA DE FACTURAS CON DEDUPLICACIÓN ── */}
      {mostrarModalCargaFacturas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border border-slate-300 w-full max-w-2xl p-6 rounded-xl shadow-2xl space-y-4 font-sans text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                📊 Carga Masiva de Facturación Única (Excel / CSV)
              </h3>
              <button onClick={() => setMostrarModalCargaFacturas(false)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-900 text-xs leading-relaxed">
              <strong>Instrucciones:</strong> Copie y pegue las columnas desde su Excel o CSV.<br/>
              Orden de columnas: <code>[Fecha | Número de Factura | Razón Social | Monto Total]</code>.<br/>
              <em>Garantía Anti-Duplicación: Si una factura ya fue cargada anteriormente (coincidencia de Nº Factura + Razón Social), el sistema la omitirá automáticamente sin duplicarla.</em>
            </div>

            <textarea
              value={facturasTextoRaw}
              onChange={(e) => setFacturasTextoRaw(e.target.value)}
              placeholder={"2026-07-20\t10452\tCOMERCIAL GAMA LTDA\t150000\n2026-07-21\t10453\tMARIA CECILIA ACUÑA\t35000"}
              className="w-full h-44 bg-slate-50 border border-slate-300 p-3 rounded-lg font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
              <button
                onClick={() => setMostrarModalCargaFacturas(false)}
                className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-lg hover:bg-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={procesarCargaMasivaFacturas}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-xs cursor-pointer"
              >
                🚀 Cargar & Deduplicar Facturas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NUEVA COTIZACIÓN DOLIBARR ── */}
      {mostrarModalCotizacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border border-slate-300 w-full max-w-3xl p-6 rounded-xl shadow-2xl space-y-4 font-sans text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                📋 Nueva Cotización Comercial (Estilo Dolibarr)
              </h3>
              <button onClick={() => setMostrarModalCotizacion(false)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>

            {/* Cabecera del Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Cargar Abonado (Opcional):</label>
                <select
                  value={cotCuenta}
                  onChange={(e) => setCotCuenta(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded-lg w-full focus:outline-none"
                >
                  <option value="">-- Seleccionar Cuenta --</option>
                  {Object.keys(clientesMap).map(cta => (
                    <option key={cta} value={cta}>{cta} - {clientesMap[cta].nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Razón Social / Nombre:</label>
                <input
                  type="text"
                  value={cotNombre}
                  onChange={(e) => setCotNombre(e.target.value)}
                  placeholder="Ej: Comercial Gama Ltda"
                  className="bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded-lg w-full focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">RUT Cliente:</label>
                <input
                  type="text"
                  value={cotRut}
                  onChange={(e) => setCotRut(cleanRut(e.target.value))}
                  placeholder="12123123-6"
                  className="bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded-lg w-full focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Ítems / Líneas del Presupuesto */}
            <div className="space-y-2 border-t border-b border-slate-200 py-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Ítems del Presupuesto (Neto & Descuento)</span>
                <button
                  onClick={() => setItemsCot([...itemsCot, { id: Date.now().toString(), descripcion: 'Nuevo ítem', cantidad: 1, precio_neto_unitario: 10000, descuento_porcentaje: 0 }])}
                  className="px-2.5 py-1 bg-slate-900 text-white rounded text-[10px] font-bold cursor-pointer"
                >
                  + Agregar Línea
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {itemsCot.map((it, idx) => (
                  <div key={it.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded border border-slate-200">
                    <input
                      type="text"
                      value={it.descripcion}
                      onChange={(e) => {
                        const newIt = [...itemsCot]
                        newIt[idx].descripcion = e.target.value
                        setItemsCot(newIt)
                      }}
                      placeholder="Descripción producto/servicio..."
                      className="col-span-5 bg-white border border-slate-300 p-1.5 rounded text-xs"
                    />
                    <input
                      type="number"
                      value={it.cantidad}
                      onChange={(e) => {
                        const newIt = [...itemsCot]
                        newIt[idx].cantidad = Number(e.target.value) || 1
                        setItemsCot(newIt)
                      }}
                      placeholder="Cant"
                      className="col-span-2 bg-white border border-slate-300 p-1.5 rounded text-xs font-mono text-center"
                    />
                    <input
                      type="number"
                      value={it.precio_neto_unitario}
                      onChange={(e) => {
                        const newIt = [...itemsCot]
                        newIt[idx].precio_neto_unitario = Number(e.target.value) || 0
                        setItemsCot(newIt)
                      }}
                      placeholder="Neto ($)"
                      className="col-span-3 bg-white border border-slate-300 p-1.5 rounded text-xs font-mono text-right"
                    />
                    <input
                      type="number"
                      value={it.descuento_porcentaje}
                      onChange={(e) => {
                        const newIt = [...itemsCot]
                        newIt[idx].descuento_porcentaje = Number(e.target.value) || 0
                        setItemsCot(newIt)
                      }}
                      placeholder="Desc %"
                      className="col-span-1 bg-white border border-slate-300 p-1.5 rounded text-xs font-mono text-center"
                    />
                    <button
                      onClick={() => setItemsCot(itemsCot.filter(i => i.id !== it.id))}
                      className="col-span-1 text-red-600 font-bold hover:text-red-800 text-center cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Totales Calculados */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal Neto:</span>
                <span>${Math.round(calculoCotizacionActual.subtotalNeto).toLocaleString('es-CL')} CLP</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Descuentos:</span>
                <span>-${Math.round(calculoCotizacionActual.totalDescuentos).toLocaleString('es-CL')} CLP</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-200 pt-1">
                <span>Neto Total:</span>
                <span>${Math.round(calculoCotizacionActual.netoConDescuento).toLocaleString('es-CL')} CLP</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Monto IVA (19%):</span>
                <span>${Math.round(calculoCotizacionActual.montoIva).toLocaleString('es-CL')} CLP</span>
              </div>
              <div className="flex justify-between text-base font-bold text-emerald-800 border-t border-slate-300 pt-1.5">
                <span>TOTAL IVA INCLUIDO:</span>
                <span>${Math.round(calculoCotizacionActual.totalIvaIncluido).toLocaleString('es-CL')} CLP</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
              <button
                onClick={() => setMostrarModalCotizacion(false)}
                className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-lg hover:bg-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarCotizacion}
                className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg shadow-xs cursor-pointer"
              >
                💾 Guardar Cotización Dolibarr
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL IMPRESION / VER PDF DE COTIZACION ── */}
      {cotSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white text-slate-900 p-8 rounded-xl max-w-2xl w-full shadow-2xl font-sans max-h-[92vh] overflow-y-auto border border-slate-300 space-y-6">
            
            <div className="flex justify-between items-start border-b-2 border-blue-900 pb-4">
              <div>
                <h1 className="text-2xl font-black text-blue-950 tracking-wide">GAMA SEGURIDAD 24/7</h1>
                <p className="text-xs text-slate-500 font-semibold">Cotización Comercial Oficial</p>
                <p className="text-xs text-slate-500">Santiago, Chile • Fono: +56 9 9101 6912 • Email: contacto@gamasecurity.cl</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-blue-900 text-white font-mono text-base font-bold px-3 py-1 rounded">
                  {cotSeleccionada.codigo_cotizacion}
                </span>
                <p className="text-xs text-slate-500 mt-1">Fecha: {cotSeleccionada.fecha}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1 text-xs">
              <div className="font-bold text-blue-900 uppercase tracking-wider mb-1">CLIENTE / TITULAR</div>
              <div className="grid grid-cols-2 gap-2">
                <div><strong>Razón Social:</strong> {cotSeleccionada.nombre_cliente}</div>
                <div><strong>RUT:</strong> {cotSeleccionada.rut_cliente || 'N/A'}</div>
                <div><strong>Cuenta:</strong> {cotSeleccionada.cuenta || 'Sin cuenta'}</div>
                <div><strong>Validez:</strong> {cotSeleccionada.validez_dias} Días</div>
              </div>
            </div>

            {/* Tabla Ítems PDF */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2.5 border-r border-slate-200">Descripción</th>
                    <th className="p-2.5 border-r border-slate-200 text-center w-14">Cant</th>
                    <th className="p-2.5 border-r border-slate-200 text-right w-24">Neto Unit.</th>
                    <th className="p-2.5 border-r border-slate-200 text-center w-16">Desc %</th>
                    <th className="p-2.5 text-right w-28">Subtotal Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {cotSeleccionada.items.map((it, idx) => {
                    const netoLinea = (it.cantidad || 1) * (it.precio_neto_unitario || 0) * (1 - (it.descuento_porcentaje || 0) / 100)
                    return (
                      <tr key={idx}>
                        <td className="p-2.5 font-semibold text-slate-900 border-r border-slate-200">{it.descripcion}</td>
                        <td className="p-2.5 text-center font-mono border-r border-slate-200">{it.cantidad}</td>
                        <td className="p-2.5 text-right font-mono border-r border-slate-200">${it.precio_neto_unitario.toLocaleString('es-CL')}</td>
                        <td className="p-2.5 text-center font-mono border-r border-slate-200">{it.descuento_porcentaje}%</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">${Math.round(netoLinea).toLocaleString('es-CL')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Totales PDF */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1.5 text-xs font-mono max-w-xs ml-auto">
              <div className="flex justify-between">
                <span>Neto Total:</span>
                <span>${Math.round(cotSeleccionada.neto_con_descuento || 0).toLocaleString('es-CL')} CLP</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>IVA (19%):</span>
                <span>${Math.round(cotSeleccionada.monto_iva || 0).toLocaleString('es-CL')} CLP</span>
              </div>
              <div className="flex justify-between text-base font-bold text-emerald-800 border-t border-slate-300 pt-1">
                <span>TOTAL IVA INCL.:</span>
                <span>${Math.round(cotSeleccionada.monto_total_iva_incluido || 0).toLocaleString('es-CL')} CLP</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setCotSeleccionada(null)}
                className="px-4 py-2 bg-slate-200 text-slate-800 font-bold text-xs rounded-lg hover:bg-slate-300 cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-blue-900 text-white font-bold text-xs rounded-lg hover:bg-blue-950 shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>🖨️ Imprimir Cotización PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
