'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { cleanRut } from '@/lib/rut'
import clientesDataRaw from '@/lib/clientes_general.json'

const clientesFallback = clientesDataRaw as Record<string, Record<string, string>>

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
  id: string
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
  codigo_cotizacion: string
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

export interface ConfigEmpresa {
  razon_social: string
  rut_empresa: string
  giro: string
  direccion: string
  telefono: string
  email_cobranza: string
  email_contacto: string
  banco_nombre: string
  banco_tipo_cuenta: string
  banco_numero_cuenta: string
  valor_uf: number
}

export default function OperacionCRM() {
  const [moduloActivo, setModuloActivo] = useState<'ficha360' | 'presupuestos' | 'facturacion' | 'serv_tecnico' | 'kpis' | 'config'>('ficha360')
  
  // Sidebar colapsable
  const [sidebarAbierto, setSidebarAbierto] = useState<boolean>(true)

  // Clientes
  const [clientesMap, setClientesMap] = useState<Record<string, ClienteCRM>>({})
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string>('')
  const [busquedaClienteInput, setBusquedaClienteInput] = useState<string>('')

  // Modal Edición Completa de Cliente y Tarifa (Sincronización Total)
  const [mostrarModalTarifa, setMostrarModalTarifa] = useState(false)
  const [editNombre, setEditNombre] = useState('')
  const [editRut, setEditRut] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editTelefono, setEditTelefono] = useState('')
  const [editDireccion, setEditDireccion] = useState('')
  const [editMoneda, setEditMoneda] = useState<'UF' | 'CLP'>('CLP')
  const [editTarifa, setEditTarifa] = useState('29900')
  const [editDia, setEditDia] = useState('5')
  const [editPlan, setEditPlan] = useState('MONITOREO ESTÁNDAR 24/7')
  const [editEstadoPago, setEditEstadoPago] = useState<'Al Día' | 'Pendiente' | 'Moroso'>('Al Día')

  // Configuración de Empresa Corporativa
  const [configEmpresa, setConfigEmpresa] = useState<ConfigEmpresa>({
    razon_social: 'GAMA SERVICIOS LIMITADA',
    rut_empresa: '76.123.456-K',
    giro: 'Servicios de Monitoreo y Seguridad Electrónica 24/7',
    direccion: 'Av. Providencia 1234, Of. 502, Santiago, Chile',
    telefono: '+56 9 9101 6912',
    email_cobranza: 'cobranza@gamasecurity.cl',
    email_contacto: 'contacto@gamasecurity.cl',
    banco_nombre: 'Banco de Chile / Edwards',
    banco_tipo_cuenta: 'Cuenta Corriente',
    banco_numero_cuenta: '00-123-45678-9',
    valor_uf: 38500
  })

  // Órdenes de Trabajo desde Command Center
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<any[]>([])

  // Facturas masivas
  const [facturas, setFacturas] = useState<FacturaIndividual[]>([])
  const [mostrarModalCargaFacturas, setMostrarModalCargaFacturas] = useState(false)
  const [facturasTextoRaw, setFacturasTextoRaw] = useState('')
  const [busquedaFacturaInput, setBusquedaFacturaInput] = useState('')

  // Presupuestos & Cotizaciones
  const [cotizaciones, setCotizaciones] = useState<CotizacionDolibarr[]>([])
  const [mostrarModalCotizacion, setMostrarModalCotizacion] = useState(false)
  const [cotSeleccionada, setCotSeleccionada] = useState<CotizacionDolibarr | null>(null)
  
  // Formulario cotización
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

  // Cargar datos al iniciar desde Supabase
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

        // 2. Configuración Empresa desde 'CONFIGURACION_EMPRESA'
        const { data: dCfg } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'CONFIGURACION_EMPRESA')
          .limit(1)

        if (dCfg && dCfg.length > 0 && dCfg[0].nombre_abonado) {
          try { setConfigEmpresa(JSON.parse(dCfg[0].nombre_abonado)) } catch (e) {}
        }

        // 3. OTs desde Command Center 'ORDENES_TRABAJO'
        const { data: dOT } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'ORDENES_TRABAJO')
          .limit(1)

        if (dOT && dOT.length > 0 && dOT[0].nombre_abonado) {
          try { setOrdenesTrabajo(JSON.parse(dOT[0].nombre_abonado)) } catch (e) {}
        }

        // 4. Facturas masivas desde 'FACTURAS_MAESTRO'
        const { data: dFact } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'FACTURAS_MAESTRO')
          .limit(1)

        if (dFact && dFact.length > 0 && dFact[0].nombre_abonado) {
          try { setFacturas(JSON.parse(dFact[0].nombre_abonado)) } catch (e) {}
        }

        // 5. Cotizaciones desde 'COTIZACIONES_DOLIBARR'
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

  useEffect(() => {
    if (cotCuenta && clientesMap[cotCuenta]) {
      const c = clientesMap[cotCuenta]
      setCotNombre(c.nombre)
      setCotRut(c.rut)
      setCotDireccion(c.direccion)
    }
  }, [cotCuenta, clientesMap])

  const clienteActivo = cuentaSeleccionada && clientesMap[cuentaSeleccionada] ? clientesMap[cuentaSeleccionada] : null

  // Abrir Modal Edición Completa del Cliente (Email, Teléfono, Dirección, Tarifa, Plan)
  const abrirModalEditarTarifa = (cliente: ClienteCRM) => {
    setEditNombre(cliente.nombre)
    setEditRut(cliente.rut)
    setEditEmail(cliente.email)
    setEditTelefono(cliente.telefono)
    setEditDireccion(cliente.direccion)
    setEditMoneda(cliente.moneda)
    setEditTarifa(cliente.tarifa_mensual.toString())
    setEditDia(cliente.dia_vencimiento.toString())
    setEditPlan(cliente.plan)
    setEditEstadoPago(cliente.estado_pago)
    setMostrarModalTarifa(true)
  }

  // Guardar Edición Completa y Sincronizar en Supabase 'CLIENTES'
  const handleGuardarTarifaCliente = async () => {
    if (!clienteActivo) return

    const clienteActualizado: ClienteCRM = {
      ...clienteActivo,
      nombre: editNombre.trim() || clienteActivo.nombre,
      rut: cleanRut(editRut) || clienteActivo.rut,
      email: editEmail.trim() || clienteActivo.email,
      telefono: editTelefono.trim() || clienteActivo.telefono,
      direccion: editDireccion.trim() || clienteActivo.direccion,
      moneda: editMoneda,
      tarifa_mensual: Number(editTarifa) || 0,
      dia_vencimiento: Number(editDia) || 5,
      plan: editPlan.trim() || 'MONITOREO ESTÁNDAR 24/7',
      estado_pago: editEstadoPago
    }

    const mapNuevo = { ...clientesMap, [clienteActivo.cuenta]: clienteActualizado }
    setClientesMap(mapNuevo)

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'CLIENTES',
        nombre_abonado: JSON.stringify(mapNuevo),
        evento: 'CONFIGURACION_CLIENTE',
        fecha_hora: new Date().toISOString()
      })
      setMostrarModalTarifa(false)
      alert(`✅ Datos del cliente ${clienteActivo.cuenta} (${clienteActualizado.nombre}) actualizados y sincronizados en todo el sistema (Command Center, Expedientes y Cobranza).`)
    } catch (e: any) {
      alert('Error al guardar datos del cliente: ' + e.message)
    }
  }

  // Guardar Configuración de Empresa Corporativa
  const handleGuardarConfigEmpresa = async () => {
    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'CONFIGURACION_EMPRESA',
        nombre_abonado: JSON.stringify(configEmpresa),
        evento: 'CONFIGURACION_EMPRESA_UPDATE',
        fecha_hora: new Date().toISOString()
      })
      alert('✅ Datos institucionales de la empresa guardados exitosamente.')
    } catch (e: any) {
      alert('Error guardando configuración de empresa: ' + e.message)
    }
  }

  const otsClienteActivo = useMemo(() => {
    if (!cuentaSeleccionada) return []
    return ordenesTrabajo.filter((o: any) => (o.cuenta || '').toUpperCase().trim() === cuentaSeleccionada)
  }, [ordenesTrabajo, cuentaSeleccionada])

  const facturasClienteActivo = useMemo(() => {
    if (!clienteActivo) return []
    const rutClean = cleanRut(clienteActivo.rut)
    const nomClean = clienteActivo.nombre.toLowerCase().trim()
    return facturas.filter(f => {
      const fRazon = f.razon_social.toLowerCase().trim()
      return f.cuenta_asociada === clienteActivo.cuenta || fRazon.includes(nomClean) || (rutClean && fRazon.includes(rutClean))
    })
  }, [facturas, clienteActivo])

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
        if (cols[0].toLowerCase().includes('fecha') || cols[1].toLowerCase().includes('factura') || cols[1].toLowerCase().includes('número')) continue

        const fechaStr = cols[0] || new Date().toISOString().slice(0, 10)
        const numFactura = cols[1] ? cols[1].replace(/[^0-9]/g, '') : ''
        const razonSocial = cols[2] ? cols[2].toUpperCase().trim() : ''
        const montoTotal = Number((cols[3] || '0').replace(/[^0-9]/g, '')) || 0

        if (!numFactura || !razonSocial) continue

        const idFactura = `${numFactura}-${razonSocial}`

        if (facturasExistentes.has(idFactura)) {
          duplicadasOmitidas++
          continue
        }

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
        alert(`ℹ️ No se agregaron facturas nuevas. Todas las ${duplicadasOmitidas} facturas del archivo ya existían (omitidas sin duplicar).`)
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
      alert(`🎉 ¡Éxito! Se cargaron ${agregadas} facturas nuevas. Omitidas ${duplicadasOmitidas} duplicadas.`)
    } catch (err: any) {
      alert('Error al cargar facturas: ' + err.message)
    }
  }

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
      alert(`🎉 Cotización ${codigoCot} creada exitosamente.`)
    } catch (e: any) {
      alert('Error guardando cotización: ' + e.message)
    }
  }

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
          destinatarios: [destinatario || configEmpresa.email_cobranza || 'contacto@gamasecurity.cl']
        })
      })

      if (res.ok) {
        alert(`📧 Notificación enviada por Resend (@gamasecurity.cl) a ${destinatario || configEmpresa.email_cobranza}.`)
      } else {
        alert(`📧 Notificación enviada a ${destinatario || configEmpresa.email_cobranza}.`)
      }
    } catch (e) {
      alert('Aviso de cobro registrado.')
    } finally {
      setEnviandoNotif(false)
    }
  }

  const enviarWhatsAppCobro = async (telefono: string, clienteNombre: string, detalleStr: string) => {
    if (!telefono) {
      alert('No hay teléfono de contacto disponible para este cliente.')
      return
    }
    setEnviandoNotif(true)
    try {
      let numClean = telefono.replace(/[^0-9]/g, '')
      if (numClean.length === 9 && numClean.startsWith('9')) numClean = '56' + numClean

      const msg = `💳 *${configEmpresa.razon_social} - Estado de Cuenta & Cobranza*\n\nEstimado(a) *${clienteNombre}*,\n\nLe recordamos la cobranza pendiente de su cuenta:\n• *Detalle:* ${detalleStr}\n• *Banco:* ${configEmpresa.banco_nombre}\n• *Tipo Cta:* ${configEmpresa.banco_tipo_cuenta}\n• *Nº Cta:* ${configEmpresa.banco_numero_cuenta}\n• *Email Cobranza:* ${configEmpresa.email_cobranza}\n\nAgradecemos su atención.`

      await fetch('/api/whatsapp/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: numClean, mensaje: msg })
      })

      alert(`📲 Aviso de cobro enviado por WhatsApp a ${numClean}.`)
    } catch (e: any) {
      alert('Error enviando WhatsApp: ' + e.message)
    } finally {
      setEnviandoNotif(false)
    }
  }

  const listaAbonadosFiltrada = useMemo(() => {
    const q = busquedaClienteInput.toLowerCase().trim()
    if (!q) return []
    return Object.values(clientesMap).filter(c =>
      c.cuenta.toLowerCase().includes(q) ||
      c.nombre.toLowerCase().includes(q) ||
      c.rut.toLowerCase().includes(q) ||
      c.direccion.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    )
  }, [clientesMap, busquedaClienteInput])

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
    <div className="min-h-screen bg-[#f1f5f9] text-[#0f172a] font-sans flex flex-col select-none p-5 md:p-8 gap-8">
      
      {/* ── HEADER NEUMÓRFICO GITHUB ULTRACLEAN ── */}
      <header className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0">
        <div className="flex items-center gap-5">
          <button
            onClick={() => setSidebarAbierto(!sidebarAbierto)}
            className="bg-[#f8fafc] hover:bg-slate-100 text-slate-700 px-4 py-3 rounded-2xl border border-slate-200 font-bold shadow-[3px_3px_8px_rgba(203,213,225,0.6),-3px_-3px_8px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_4px_rgba(203,213,225,0.6)] transition-all cursor-pointer"
            title={sidebarAbierto ? "Ocultar Menú" : "Mostrar Menú"}
          >
            <span className="text-xl">☰</span>
          </button>

          <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white font-bold p-3.5 rounded-2xl text-2xl shadow-[4px_4px_12px_rgba(30,58,138,0.35)] flex items-center justify-center">
            🛡️
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              {configEmpresa.razon_social}
              <span className="bg-blue-50 text-blue-900 text-xs font-bold px-3 py-1 rounded-full border border-blue-200 shadow-2xs">
                OPERACIÓN & CRM 360°
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {configEmpresa.giro} • RUT: {configEmpresa.rut_empresa}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="bg-[#f8fafc] border border-slate-200/90 px-4 py-2.5 rounded-2xl text-slate-700 font-mono shadow-[inset_2px_2px_4px_rgba(203,213,225,0.4)]">
            UF HOY: <strong className="text-emerald-700 font-bold">${configEmpresa.valor_uf.toLocaleString('es-CL')} CLP</strong>
          </div>

          <a
            href="/app"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-2xl shadow-[4px_4px_12px_rgba(15,23,42,0.25)] transition-all cursor-pointer text-xs flex items-center gap-2"
          >
            <span>🖥️ COMMAND CENTER</span>
          </a>
        </div>
      </header>

      {/* ── CONTENEDOR PRINCIPAL ── */}
      <div className="flex-1 flex gap-8 overflow-hidden min-h-0">
        
        {/* ── SIDEBAR NEUMÓRFICO ── */}
        {sidebarAbierto && (
          <aside className="w-72 bg-white border border-slate-200/90 p-6 rounded-3xl flex flex-col gap-2 shrink-0 shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] transition-all">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-3 flex justify-between items-center">
              <span>MÓDULOS DEL SISTEMA</span>
              <button
                onClick={() => setSidebarAbierto(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {[
              { id: 'ficha360', label: 'Ficha 360° del Cliente', icon: '👤' },
              { id: 'presupuestos', label: 'Presupuestos (Dolibarr)', icon: '📋' },
              { id: 'facturacion', label: 'Facturación & Cobranza', icon: '🧾' },
              { id: 'serv_tecnico', label: 'Servicio Técnico (OTs)', icon: '🛠️' },
              { id: 'kpis', label: 'KPIs Ejecutivos & Reportes', icon: '📊' },
              { id: 'config', label: 'Configuración de Empresa', icon: '⚙️' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setModuloActivo(m.id as any)}
                className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-3 cursor-pointer ${
                  moduloActivo === m.id
                    ? 'bg-blue-600 text-white shadow-[4px_4px_12px_rgba(37,99,235,0.35)]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="text-lg">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}

            <div className="mt-auto bg-[#f8fafc] border border-slate-200 p-4 rounded-2xl text-xs space-y-1.5 text-slate-600 shadow-[inset_2px_2px_4px_rgba(203,213,225,0.4)]">
              <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wide">{configEmpresa.razon_social}</div>
              <div>Facturas Cargadas: <strong className="text-slate-900 font-mono font-bold">{facturas.length}</strong></div>
              <div>Cotizaciones: <strong className="text-slate-900 font-mono font-bold">{cotizaciones.length}</strong></div>
            </div>
          </aside>
        )}

        {/* ── PANEL DERECHO PRINCIPAL ── */}
        <main className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-8">

          {/* ── MÓDULO 1: FICHA 360° DE CLIENTES ── */}
          {moduloActivo === 'ficha360' && (
            <div className="flex-1 flex flex-col gap-8 min-h-0">
              
              {/* Buscador Neumórfico Espacioso */}
              <div className="bg-white border border-slate-200/90 p-7 rounded-3xl shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] flex flex-col gap-4">
                <div className="font-bold text-xs text-slate-700 uppercase tracking-wider flex justify-between items-center">
                  <span>🔍 BUSCADOR DE EXPEDIENTES CRM 360°</span>
                  {cuentaSeleccionada && (
                    <button
                      onClick={() => { setCuentaSeleccionada(''); setBusquedaClienteInput('') }}
                      className="text-xs text-red-600 hover:underline font-bold cursor-pointer"
                    >
                      ✕ Limpiar Selección
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={busquedaClienteInput}
                    onChange={(e) => setBusquedaClienteInput(e.target.value)}
                    placeholder="Escriba Nombre del Titular, Email (ej: cliente@gmail.com), RUT, Código de Cuenta (ej: C774)..."
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-6 py-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono shadow-[inset_2px_2px_5px_rgba(203,213,225,0.5)]"
                  />

                  {busquedaClienteInput.trim().length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 max-h-80 overflow-y-auto divide-y divide-slate-100 p-3">
                      {listaAbonadosFiltrada.map(c => (
                        <div
                          key={c.cuenta}
                          onClick={() => { setCuentaSeleccionada(c.cuenta); setBusquedaClienteInput('') }}
                          className="p-4 hover:bg-blue-50 rounded-2xl cursor-pointer flex justify-between items-center transition-colors"
                        >
                          <div>
                            <div className="font-bold text-xs text-slate-900">
                              {c.nombre} <span className="font-mono text-blue-700 font-bold ml-1">({c.cuenta})</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                              RUT: {c.rut || 'N/A'} • Email: <strong className="text-blue-900">{c.email || 'Sin email'}</strong> • {c.direccion}
                            </div>
                          </div>
                          <span className={`px-3.5 py-1 rounded-full text-[10px] font-bold ${
                            c.estado_pago === 'Al Día' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {c.estado_pago}
                          </span>
                        </div>
                      ))}
                      {listaAbonadosFiltrada.length === 0 && (
                        <div className="p-5 text-center text-slate-400 italic text-xs">
                          No se encontraron clientes coincidentes con "{busquedaClienteInput}".
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Dossier 360° Si hay cliente seleccionado */}
              {clienteActivo ? (
                <div className="bg-white border border-slate-200/90 rounded-3xl p-8 flex flex-col gap-8 shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] overflow-y-auto">
                  
                  <div className="bg-[#f8fafc] border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 shadow-[inset_2px_2px_4px_rgba(203,213,225,0.3)]">
                    <div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="bg-blue-900 text-white font-mono text-xs font-bold px-3.5 py-1 rounded-lg">
                          {clienteActivo.cuenta}
                        </span>
                        <span className="text-xs text-slate-500 font-mono font-bold">RUT: {clienteActivo.rut || 'Sin RUT'}</span>
                      </div>
                      <h2 className="text-2xl font-black text-slate-900">{clienteActivo.nombre}</h2>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        📍 {clienteActivo.direccion} • {clienteActivo.ciudad} | ✉️ <strong>{clienteActivo.email || 'Sin correo registrado'}</strong> | 📞 {clienteActivo.telefono || 'Sin teléfono'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={() => abrirModalEditarTarifa(clienteActivo)}
                        className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs shadow-xs cursor-pointer"
                      >
                        ✏️ Editar Cliente & Email
                      </button>
                      <button
                        disabled={enviandoNotif}
                        onClick={() => enviarEmailCobroResend(clienteActivo.email, clienteActivo.nombre, `Cuenta ${clienteActivo.cuenta}`)}
                        className="px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-2xl text-xs shadow-xs cursor-pointer"
                      >
                        📧 Email Resend
                      </button>
                      <button
                        disabled={enviandoNotif}
                        onClick={() => enviarWhatsAppCobro(clienteActivo.telefono, clienteActivo.nombre, `Cuenta ${clienteActivo.cuenta}`)}
                        className="px-4 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs shadow-xs cursor-pointer"
                      >
                        📲 Notificar WA
                      </button>
                    </div>
                  </div>

                  {/* 3 Pilares con Neumorfismo Amplio y Espacioso */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    <div className="bg-[#f8fafc] border border-slate-200/90 p-6 rounded-2xl flex flex-col gap-4 shadow-[3px_3px_8px_rgba(203,213,225,0.5)]">
                      <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-2.5 flex justify-between uppercase tracking-wider">
                        <span>💳 COMERCIAL & TARIFA</span>
                        <span className="text-emerald-700 font-mono font-bold">{clienteActivo.moneda}</span>
                      </div>

                      <div className="space-y-3 text-xs font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Plan Contratado:</span>
                          <span className="font-bold text-slate-900 truncate">{clienteActivo.plan}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-slate-500">Email Oficial:</span>
                          <span className="font-bold text-blue-950 truncate max-w-[160px]">{clienteActivo.email || 'Sin correo'}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-slate-500">Tarifa Mensual:</span>
                          <span className="font-bold font-mono text-emerald-800">
                            {clienteActivo.moneda === 'UF'
                              ? `${clienteActivo.tarifa_mensual} UF ($${Math.round(clienteActivo.tarifa_mensual * configEmpresa.valor_uf).toLocaleString('es-CL')})`
                              : `$${clienteActivo.tarifa_mensual.toLocaleString('es-CL')} CLP`}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-slate-500">Día de Vencimiento:</span>
                          <span className="font-bold text-slate-900">Día {clienteActivo.dia_vencimiento}</span>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                          <span className="text-slate-500">Estado de Pago:</span>
                          <span className={`px-3 py-1 rounded-full font-bold text-[10px] ${
                            clienteActivo.estado_pago === 'Al Día' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {clienteActivo.estado_pago.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#f8fafc] border border-slate-200/90 p-6 rounded-2xl flex flex-col gap-4 shadow-[3px_3px_8px_rgba(203,213,225,0.5)]">
                      <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-2.5 flex justify-between uppercase tracking-wider">
                        <span>🧾 FACTURAS CARGADAS</span>
                        <span className="font-mono text-slate-500 font-bold">({facturasClienteActivo.length})</span>
                      </div>

                      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[220px]">
                        {facturasClienteActivo.map((f) => (
                          <div key={f.id} className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs space-y-1 shadow-2xs">
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
                          <div className="text-center text-slate-400 italic py-10 text-xs">
                            Sin facturas registradas para esta razón social
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#f8fafc] border border-slate-200/90 p-6 rounded-2xl flex flex-col gap-4 shadow-[3px_3px_8px_rgba(203,213,225,0.5)]">
                      <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-2.5 flex justify-between uppercase tracking-wider">
                        <span>🛠️ ÓRDENES TÉCNICAS</span>
                        <span className="font-mono text-slate-500 font-bold">({otsClienteActivo.length})</span>
                      </div>

                      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[220px]">
                        {otsClienteActivo.map((ot: any) => (
                          <div key={ot.id} className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs space-y-1 shadow-2xs">
                            <div className="flex justify-between font-mono font-bold text-blue-900">
                              <span>{ot.codigo_ot || `OT-${ot.id}`}</span>
                              <span className="text-emerald-800 text-[10px]">{ot.estado}</span>
                            </div>
                            <div className="font-bold text-slate-800 text-[11px]">{ot.tipo_visita || 'Correctiva'} • {ot.tecnico}</div>
                            <div className="text-[10px] text-slate-500 truncate">{ot.problema}</div>
                          </div>
                        ))}

                        {otsClienteActivo.length === 0 && (
                          <div className="text-center text-slate-400 italic py-10 text-xs">
                            Sin visitas técnicas de Command Center
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="bg-white border border-slate-200/90 rounded-3xl p-20 text-center shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] flex flex-col items-center justify-center gap-4">
                  <div className="text-6xl p-5 bg-[#f8fafc] rounded-3xl shadow-[inset_2px_2px_5px_rgba(203,213,225,0.5)]">🔍</div>
                  <h3 className="text-xl font-black text-slate-900">Expediente CRM 360° del Cliente</h3>
                  <p className="text-xs text-slate-500 max-w-md font-medium leading-relaxed">
                    Ingrese el Nombre del Titular, Correo Electrónico, Número de Abonado (ej: C774) o RUT en el buscador superior para consultar su expediente unificado.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* ── MÓDULO 2: PRESUPUESTOS DOLIBARR ── */}
          {moduloActivo === 'presupuestos' && (
            <div className="flex-1 bg-white border border-slate-200/90 rounded-3xl p-8 flex flex-col gap-6 shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] min-h-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                    📋 Presupuestos Comercial & Cotizaciones (Estilo Dolibarr)
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Ingreso manual de productos/servicios con cálculo de Neto, Descuentos e IVA (19%)
                  </p>
                </div>

                <button
                  onClick={() => setMostrarModalCotizacion(true)}
                  className="px-5 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-2xl text-xs shadow-[3px_3px_8px_rgba(30,58,138,0.3)] cursor-pointer flex items-center gap-2"
                >
                  <span>➕ Nueva Cotización Comercial</span>
                </button>
              </div>

              <div className="flex-1 overflow-auto border border-slate-200/80 rounded-2xl bg-white shadow-2xs">
                <table className="w-full text-left border-collapse text-xs font-medium">
                  <thead>
                    <tr className="bg-[#f8fafc] text-slate-700 border-b border-slate-200 font-bold uppercase text-[11px]">
                      <th className="p-4 border-r border-slate-200">CÓDIGO</th>
                      <th className="p-4 border-r border-slate-200">FECHA</th>
                      <th className="p-4 border-r border-slate-200">CLIENTE / RUT</th>
                      <th className="p-4 border-r border-slate-200 text-right">NETO</th>
                      <th className="p-4 border-r border-slate-200 text-right">IVA (19%)</th>
                      <th className="p-4 border-r border-slate-200 text-right">TOTAL IVA INCL.</th>
                      <th className="p-4 border-r border-slate-200 text-center">ESTADO</th>
                      <th className="p-4 text-center w-28">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {cotizaciones.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/80">
                        <td className="p-4 font-mono font-bold text-blue-900 border-r border-slate-200">{c.codigo_cotizacion}</td>
                        <td className="p-4 font-mono text-slate-600 border-r border-slate-200">{c.fecha}</td>
                        <td className="p-4 border-r border-slate-200">
                          <div className="font-bold text-slate-900">{c.nombre_cliente}</div>
                          <div className="text-[11px] text-slate-500 font-mono">RUT: {c.rut_cliente || 'N/A'}</div>
                        </td>
                        <td className="p-4 text-right font-mono text-slate-700 border-r border-slate-200">
                          ${Math.round(c.neto_con_descuento || 0).toLocaleString('es-CL')} CLP
                        </td>
                        <td className="p-4 text-right font-mono text-slate-500 border-r border-slate-200">
                          ${Math.round(c.monto_iva || 0).toLocaleString('es-CL')} CLP
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-800 border-r border-slate-200">
                          ${Math.round(c.monto_total_iva_incluido || 0).toLocaleString('es-CL')} CLP
                        </td>
                        <td className="p-4 text-center border-r border-slate-200 font-bold">
                          <span className={`px-3 py-1 rounded-full text-[10px] ${
                            c.estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            c.estado === 'Enviado' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                            c.estado === 'Rechazado' ? 'bg-red-100 text-red-800 border border-red-300' :
                            'bg-slate-200 text-slate-800 border border-slate-300'
                          }`}>
                            {c.estado.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-center flex items-center justify-center">
                          <button
                            onClick={() => setCotSeleccionada(c)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold cursor-pointer shadow-2xs"
                          >
                            📄 Ver PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                    {cotizaciones.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-10 text-center text-slate-400 italic">
                          No hay presupuestos comercial registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── MÓDULO 3: FACTURACIÓN & COBRANZA MASIVA ── */}
          {moduloActivo === 'facturacion' && (
            <div className="flex-1 bg-white border border-slate-200/90 rounded-3xl p-8 flex flex-col gap-6 shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] min-h-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                    🧾 Carga Masiva de Facturación & Cobranza Única
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Carga masiva desde Excel/CSV con deduplicación por Número de Factura + Razón Social
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={busquedaFacturaInput}
                    onChange={(e) => setBusquedaFacturaInput(e.target.value)}
                    placeholder="Buscar Nº factura o Razón Social..."
                    className="bg-[#f8fafc] border border-slate-200 rounded-2xl px-5 py-2.5 text-xs text-slate-900 focus:outline-none w-64 font-mono shadow-[inset_2px_2px_4px_rgba(203,213,225,0.4)]"
                  />

                  <button
                    onClick={() => setMostrarModalCargaFacturas(true)}
                    className="px-5 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    <span>📊 Cargar Archivo Facturas</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto border border-slate-200/80 rounded-2xl bg-white shadow-2xs">
                <table className="w-full text-left border-collapse text-xs font-medium">
                  <thead>
                    <tr className="bg-[#f8fafc] text-slate-700 border-b border-slate-200 font-bold uppercase text-[11px]">
                      <th className="p-4 border-r border-slate-200">FECHA</th>
                      <th className="p-4 border-r border-slate-200">Nº FACTURA</th>
                      <th className="p-4 border-r border-slate-200">RAZÓN SOCIAL (CLIENTE)</th>
                      <th className="p-4 border-r border-slate-200 text-right">MONTO TOTAL</th>
                      <th className="p-4 border-r border-slate-200 text-center">ESTADO PAGO</th>
                      <th className="p-4 text-center w-44">ACCIONES COBRANZA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {facturasFiltradas.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/80">
                        <td className="p-4 font-mono text-slate-600 border-r border-slate-200">{f.fecha}</td>
                        <td className="p-4 font-mono font-bold text-blue-900 border-r border-slate-200">#{f.numero_factura}</td>
                        <td className="p-4 border-r border-slate-200 font-bold text-slate-900 uppercase">{f.razon_social}</td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-800 border-r border-slate-200">
                          ${f.monto_total.toLocaleString('es-CL')} CLP
                        </td>
                        <td className="p-4 text-center border-r border-slate-200">
                          <select
                            value={f.estado}
                            onChange={(e: any) => cambiarEstadoFactura(f.id, e.target.value)}
                            className={`font-bold text-xs px-3 py-1.5 rounded-xl border cursor-pointer ${
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
                        <td className="p-4 text-center flex items-center justify-center gap-2">
                          <button
                            disabled={enviandoNotif}
                            onClick={() => enviarEmailCobroResend(configEmpresa.email_cobranza, f.razon_social, `Factura #${f.numero_factura} por $${f.monto_total.toLocaleString('es-CL')} CLP`)}
                            className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-[10px] font-bold cursor-pointer"
                          >
                            📧 Email
                          </button>
                          <button
                            disabled={enviandoNotif}
                            onClick={() => enviarWhatsAppCobro('+56991016912', f.razon_social, `Factura #${f.numero_factura} por $${f.monto_total.toLocaleString('es-CL')} CLP`)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-bold cursor-pointer"
                          >
                            📲 WA
                          </button>
                        </td>
                      </tr>
                    ))}
                    {facturasFiltradas.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-slate-400 italic">
                          No hay facturas cargadas. Haga clic en "📊 Cargar Archivo Facturas".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── MÓDULO 4: SERVICIO TÉCNICO ── */}
          {moduloActivo === 'serv_tecnico' && (
            <div className="flex-1 bg-white border border-slate-200/90 rounded-3xl p-8 flex flex-col gap-6 shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] min-h-0">
              <div className="flex justify-between items-center border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                    🛠️ Servicio Técnico & Terreno (Command Center)
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Sincronización en tiempo real con la central de monitoreo
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-auto border border-slate-200/80 rounded-2xl bg-white shadow-2xs">
                <table className="w-full text-left border-collapse text-xs font-medium">
                  <thead>
                    <tr className="bg-[#f8fafc] text-slate-700 border-b border-slate-200 font-bold uppercase text-[11px]">
                      <th className="p-4 border-r border-slate-200">OT / FECHA</th>
                      <th className="p-4 border-r border-slate-200">ESTADO</th>
                      <th className="p-4 border-r border-slate-200">CTA</th>
                      <th className="p-4 border-r border-slate-200">ABONADO</th>
                      <th className="p-4 border-r border-slate-200">TIPO / TÉCNICO</th>
                      <th className="p-4 border-r border-slate-200">PROBLEMA REPORTADO</th>
                      <th className="p-4">TRABAJO REALIZADO EN TERRENO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ordenesTrabajo.map((ot: any) => (
                      <tr key={ot.id} className="hover:bg-slate-50/80">
                        <td className="p-4 font-mono border-r border-slate-200">
                          <div className="font-bold text-blue-900">{ot.codigo_ot || `OT-${ot.id}`}</div>
                          <div className="text-[11px] text-slate-500">{ot.fecha_cita || ot.fecha_creacion}</div>
                        </td>
                        <td className="p-4 text-center border-r border-slate-200 font-bold">
                          <span className={`px-3 py-1 rounded-full text-[10px] ${
                            ot.estado === 'Completada' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {(ot.estado || 'Pendiente').toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-blue-900 border-r border-slate-200">{ot.cuenta}</td>
                        <td className="p-4 border-r border-slate-200 font-bold text-slate-900 uppercase">{ot.nombre_abonado}</td>
                        <td className="p-4 border-r border-slate-200">
                          <div className="font-bold text-slate-800">{ot.tipo_visita || 'Correctiva'}</div>
                          <div className="text-[11px] text-slate-500">{ot.tecnico}</div>
                        </td>
                        <td className="p-4 border-r border-slate-200 max-w-[200px] truncate" title={ot.problema}>{ot.problema}</td>
                        <td className="p-4 italic text-slate-600 max-w-[250px] truncate" title={ot.novedad}>{ot.novedad || 'En atención'}</td>
                      </tr>
                    ))}
                    {ordenesTrabajo.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-slate-400 italic">
                          No hay órdenes de trabajo sincronizadas desde Command Center.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── MÓDULO 5: KPIS EJECUTIVOS ── */}
          {moduloActivo === 'kpis' && (
            <div className="flex-1 bg-white border border-slate-200/90 rounded-3xl p-8 flex flex-col gap-6 shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] overflow-y-auto">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-4">
                📊 Reportes Ejecutivos & Indicadores Financieros
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#f8fafc] border border-slate-200/90 p-6 rounded-2xl text-center space-y-2 shadow-[inset_2px_2px_4px_rgba(203,213,225,0.4)]">
                  <span className="text-slate-500 text-xs font-bold block uppercase">MRR ESTIMADO TOTAL</span>
                  <span className="text-2xl font-black font-mono text-emerald-800">
                    ${Math.round(Object.values(clientesMap).reduce((acc, c) => acc + (c.moneda === 'UF' ? c.tarifa_mensual * configEmpresa.valor_uf : c.tarifa_mensual), 0)).toLocaleString('es-CL')} CLP
                  </span>
                  <span className="text-[11px] text-slate-500 block font-medium">Monitoreo activo acumulado</span>
                </div>

                <div className="bg-[#f8fafc] border border-slate-200/90 p-6 rounded-2xl text-center space-y-2 shadow-[inset_2px_2px_4px_rgba(203,213,225,0.4)]">
                  <span className="text-slate-500 text-xs font-bold block uppercase">FACTURACIÓN MASIVA</span>
                  <span className="text-2xl font-black font-mono text-blue-900">
                    {facturas.length}
                  </span>
                  <span className="text-[11px] text-slate-500 block font-medium">
                    ${facturas.reduce((acc, f) => acc + f.monto_total, 0).toLocaleString('es-CL')} CLP cargados
                  </span>
                </div>

                <div className="bg-[#f8fafc] border border-slate-200/90 p-6 rounded-2xl text-center space-y-2 shadow-[inset_2px_2px_4px_rgba(203,213,225,0.4)]">
                  <span className="text-slate-500 text-xs font-bold block uppercase">COTIZACIONES</span>
                  <span className="text-2xl font-black font-mono text-purple-900">
                    {cotizaciones.length}
                  </span>
                  <span className="text-[11px] text-slate-500 block font-medium">Presupuestos comercial Dolibarr</span>
                </div>

                <div className="bg-[#f8fafc] border border-slate-200/90 p-6 rounded-2xl text-center space-y-2 shadow-[inset_2px_2px_4px_rgba(203,213,225,0.4)]">
                  <span className="text-slate-500 text-xs font-bold block uppercase">VISITAS TÉCNICAS</span>
                  <span className="text-2xl font-black font-mono text-amber-800">
                    {ordenesTrabajo.length}
                  </span>
                  <span className="text-[11px] text-slate-500 block font-medium">OTs desde Command Center</span>
                </div>
              </div>
            </div>
          )}

          {/* ── MÓDULO 6: CONFIGURACIÓN DE EMPRESA COMPLETA ── */}
          {moduloActivo === 'config' && (
            <div className="flex-1 bg-white border border-slate-200/90 rounded-3xl p-8 flex flex-col gap-6 shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                    ⚙️ Configuración Institucional de la Empresa & Parámetros
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Gestión de Razones Sociales, Datos de Cobranza, Cuentas Bancarias y Valor UF
                  </p>
                </div>

                <button
                  onClick={handleGuardarConfigEmpresa}
                  className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-2xl text-xs shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <span>💾 Guardar Datos Institucionales</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-medium">
                
                {/* CARD 1: DATOS CORPORATIVOS */}
                <div className="bg-[#f8fafc] border border-slate-200 p-6 rounded-2xl space-y-4 shadow-[inset_2px_2px_4px_rgba(203,213,225,0.3)]">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-200 pb-2">
                    🏢 Datos Sociales & Fiscales
                  </h3>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Razón Social Principal:</label>
                    <input
                      type="text"
                      value={configEmpresa.razon_social}
                      onChange={(e) => setConfigEmpresa({ ...configEmpresa, razon_social: e.target.value })}
                      className="bg-white border border-slate-300 px-4 py-2.5 rounded-xl text-slate-900 font-bold w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">RUT Empresa / Conglomerado:</label>
                    <input
                      type="text"
                      value={configEmpresa.rut_empresa}
                      onChange={(e) => setConfigEmpresa({ ...configEmpresa, rut_empresa: cleanRut(e.target.value) })}
                      className="bg-white border border-slate-300 px-4 py-2.5 rounded-xl font-mono font-bold text-slate-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Giro Comercial:</label>
                    <input
                      type="text"
                      value={configEmpresa.giro}
                      onChange={(e) => setConfigEmpresa({ ...configEmpresa, giro: e.target.value })}
                      className="bg-white border border-slate-300 px-4 py-2.5 rounded-xl text-slate-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Dirección Fiscal Corporativa:</label>
                    <input
                      type="text"
                      value={configEmpresa.direccion}
                      onChange={(e) => setConfigEmpresa({ ...configEmpresa, direccion: e.target.value })}
                      className="bg-white border border-slate-300 px-4 py-2.5 rounded-xl text-slate-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* CARD 2: DATOS DE COBRANZA & TRANSFERENCIAS */}
                <div className="bg-[#f8fafc] border border-slate-200 p-6 rounded-2xl space-y-4 shadow-[inset_2px_2px_4px_rgba(203,213,225,0.3)]">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-200 pb-2">
                    💳 Banco & Datos de Cobranza Oficial
                  </h3>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Correo Oficial de Cobranza (Resend @gamasecurity.cl):</label>
                    <input
                      type="email"
                      value={configEmpresa.email_cobranza}
                      onChange={(e) => setConfigEmpresa({ ...configEmpresa, email_cobranza: e.target.value })}
                      className="bg-white border border-slate-300 px-4 py-2.5 rounded-xl text-blue-900 font-bold w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Banco de Depósito:</label>
                      <input
                        type="text"
                        value={configEmpresa.banco_nombre}
                        onChange={(e) => setConfigEmpresa({ ...configEmpresa, banco_nombre: e.target.value })}
                        className="bg-white border border-slate-300 px-3.5 py-2.5 rounded-xl text-slate-900 font-semibold w-full"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Tipo de Cuenta:</label>
                      <input
                        type="text"
                        value={configEmpresa.banco_tipo_cuenta}
                        onChange={(e) => setConfigEmpresa({ ...configEmpresa, banco_tipo_cuenta: e.target.value })}
                        className="bg-white border border-slate-300 px-3.5 py-2.5 rounded-xl text-slate-900 font-semibold w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Número de Cuenta Corriente:</label>
                    <input
                      type="text"
                      value={configEmpresa.banco_numero_cuenta}
                      onChange={(e) => setConfigEmpresa({ ...configEmpresa, banco_numero_cuenta: e.target.value })}
                      className="bg-white border border-slate-300 px-4 py-2.5 rounded-xl text-slate-900 font-mono font-bold w-full"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Valor de Referencia UF (CLP):</label>
                    <input
                      type="number"
                      value={configEmpresa.valor_uf}
                      onChange={(e) => setConfigEmpresa({ ...configEmpresa, valor_uf: Number(e.target.value) || 38500 })}
                      className="bg-white border border-slate-300 px-4 py-2.5 rounded-xl font-mono font-bold text-emerald-800 w-full"
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── MODAL EDITAR COMPLETO CLIENTE & TARIFA (SINCRONIZACIÓN TOTAL) ── */}
      {mostrarModalTarifa && clienteActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5">
          <div className="bg-white border border-slate-300 w-full max-w-xl p-8 rounded-3xl shadow-2xl space-y-5 text-xs font-sans max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-black text-base text-slate-900 uppercase tracking-wide">
                  ✏️ Editar Ficha de Cliente & Tarifa ({clienteActivo.cuenta})
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Los cambios de Email, Teléfono y Datos se sincronizarán en todo el sistema.</p>
              </div>
              <button onClick={() => setMostrarModalTarifa(false)} className="text-slate-400 hover:text-slate-700 font-bold text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre / Razón Social:</label>
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-3 rounded-xl font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">RUT Cliente:</label>
                  <input
                    type="text"
                    value={editRut}
                    onChange={(e) => setEditRut(cleanRut(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 p-3 rounded-xl font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Correo Electrónico (Email Cobranza):</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="cliente@dominio.cl"
                    className="w-full bg-slate-50 border border-slate-300 p-3 rounded-xl font-bold text-blue-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Teléfono Contacto / WA:</label>
                  <input
                    type="text"
                    value={editTelefono}
                    onChange={(e) => setEditTelefono(e.target.value)}
                    placeholder="+56 9 9123 4567"
                    className="w-full bg-slate-50 border border-slate-300 p-3 rounded-xl font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Dirección de la Propiedad:</label>
                <input
                  type="text"
                  value={editDireccion}
                  onChange={(e) => setEditDireccion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-3 rounded-xl text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Moneda de Cobro:</label>
                  <select
                    value={editMoneda}
                    onChange={(e: any) => setEditMoneda(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-3 rounded-xl font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="CLP">CLP (Pesos Chilenos)</option>
                    <option value="UF">UF (Unidad de Fomento)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Monto Mensual {editMoneda === 'UF' ? '(en UF)' : '(en CLP)'}:
                  </label>
                  <input
                    type="number"
                    step={editMoneda === 'UF' ? '0.1' : '1000'}
                    value={editTarifa}
                    onChange={(e) => setEditTarifa(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-3 rounded-xl font-mono font-bold text-slate-900 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Día Vencimiento (1-30):</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={editDia}
                    onChange={(e) => setEditDia(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-3 rounded-xl font-mono text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estado de Pago Inicial:</label>
                  <select
                    value={editEstadoPago}
                    onChange={(e: any) => setEditEstadoPago(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-3 rounded-xl font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="Al Día">Al Día</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Moroso">Moroso</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Plan de Monitoreo:</label>
                <input
                  type="text"
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-3 rounded-xl font-semibold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setMostrarModalTarifa(false)}
                className="px-5 py-3 bg-slate-200 text-slate-800 font-bold rounded-2xl hover:bg-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarTarifaCliente}
                className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-2xl shadow-xs cursor-pointer"
              >
                💾 Sincronizar Cliente & Tarifa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CARGA MASIVA FACTURAS ── */}
      {mostrarModalCargaFacturas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5">
          <div className="bg-white border border-slate-300 w-full max-w-2xl p-8 rounded-3xl shadow-2xl space-y-5 font-sans text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                📊 Carga Masiva de Facturación Única (Excel / CSV)
              </h3>
              <button onClick={() => setMostrarModalCargaFacturas(false)} className="text-slate-400 hover:text-slate-700 font-bold text-xl">✕</button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-900 text-xs leading-relaxed">
              <strong>Instrucciones:</strong> Copie y pegue las columnas desde su Excel o CSV.<br/>
              Orden de columnas: <code>[Fecha | Número de Factura | Razón Social | Monto Total]</code>.<br/>
              <em>Garantía Anti-Duplicación: Si una factura ya fue cargada anteriormente, el sistema la omitirá automáticamente sin duplicarla.</em>
            </div>

            <textarea
              value={facturasTextoRaw}
              onChange={(e) => setFacturasTextoRaw(e.target.value)}
              placeholder={"2026-07-20\t10452\tCOMERCIAL GAMA LTDA\t150000\n2026-07-21\t10453\tMARIA CECILIA ACUÑA\t35000"}
              className="w-full h-48 bg-[#f8fafc] border border-slate-300 p-4 rounded-2xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setMostrarModalCargaFacturas(false)}
                className="px-5 py-3 bg-slate-200 text-slate-800 font-bold rounded-2xl hover:bg-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={procesarCargaMasivaFacturas}
                className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-xs cursor-pointer"
              >
                🚀 Cargar & Deduplicar Facturas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NUEVA COTIZACIÓN DOLIBARR ── */}
      {mostrarModalCotizacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5">
          <div className="bg-white border border-slate-300 w-full max-w-3xl p-8 rounded-3xl shadow-2xl space-y-5 font-sans text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                📋 Nueva Cotización Comercial (Estilo Dolibarr)
              </h3>
              <button onClick={() => setMostrarModalCotizacion(false)} className="text-slate-400 hover:text-slate-700 font-bold text-xl">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Cargar Abonado (Opcional):</label>
                <select
                  value={cotCuenta}
                  onChange={(e) => setCotCuenta(e.target.value)}
                  className="bg-[#f8fafc] border border-slate-300 text-slate-900 p-3 rounded-2xl w-full focus:outline-none"
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
                  className="bg-[#f8fafc] border border-slate-300 text-slate-900 p-3 rounded-2xl w-full focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">RUT Cliente:</label>
                <input
                  type="text"
                  value={cotRut}
                  onChange={(e) => setCotRut(cleanRut(e.target.value))}
                  placeholder="12123123-6"
                  className="bg-[#f8fafc] border border-slate-300 text-slate-900 p-3 rounded-2xl w-full focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-b border-slate-200 py-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Ítems del Presupuesto (Neto & Descuento)</span>
                <button
                  onClick={() => setItemsCot([...itemsCot, { id: Date.now().toString(), descripcion: 'Nuevo ítem', cantidad: 1, precio_neto_unitario: 10000, descuento_porcentaje: 0 }])}
                  className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold cursor-pointer"
                >
                  + Agregar Línea
                </button>
              </div>

              <div className="space-y-2.5 max-h-52 overflow-y-auto">
                {itemsCot.map((it, idx) => (
                  <div key={it.id} className="grid grid-cols-12 gap-2 items-center bg-[#f8fafc] p-2.5 rounded-2xl border border-slate-200">
                    <input
                      type="text"
                      value={it.descripcion}
                      onChange={(e) => {
                        const newIt = [...itemsCot]
                        newIt[idx].descripcion = e.target.value
                        setItemsCot(newIt)
                      }}
                      placeholder="Descripción producto/servicio..."
                      className="col-span-5 bg-white border border-slate-300 p-2 rounded-xl text-xs"
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
                      className="col-span-2 bg-white border border-slate-300 p-2 rounded-xl text-xs font-mono text-center"
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
                      className="col-span-3 bg-white border border-slate-300 p-2 rounded-xl text-xs font-mono text-right"
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
                      className="col-span-1 bg-white border border-slate-300 p-2 rounded-xl text-xs font-mono text-center"
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

            <div className="bg-[#f8fafc] p-5 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal Neto:</span>
                <span>${Math.round(calculoCotizacionActual.subtotalNeto).toLocaleString('es-CL')} CLP</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Descuentos:</span>
                <span>-${Math.round(calculoCotizacionActual.totalDescuentos).toLocaleString('es-CL')} CLP</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-200 pt-1.5">
                <span>Neto Total:</span>
                <span>${Math.round(calculoCotizacionActual.netoConDescuento).toLocaleString('es-CL')} CLP</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Monto IVA (19%):</span>
                <span>${Math.round(calculoCotizacionActual.montoIva).toLocaleString('es-CL')} CLP</span>
              </div>
              <div className="flex justify-between text-base font-bold text-emerald-800 border-t border-slate-300 pt-2">
                <span>TOTAL IVA INCLUIDO:</span>
                <span>${Math.round(calculoCotizacionActual.totalIvaIncluido).toLocaleString('es-CL')} CLP</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setMostrarModalCotizacion(false)}
                className="px-5 py-3 bg-slate-200 text-slate-800 font-bold rounded-2xl hover:bg-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarCotizacion}
                className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-2xl shadow-xs cursor-pointer"
              >
                💾 Guardar Cotización Dolibarr
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL IMPRESION COTIZACION PDF ── */}
      {cotSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5">
          <div className="bg-white text-slate-900 p-10 rounded-3xl max-w-2xl w-full shadow-2xl font-sans max-h-[92vh] overflow-y-auto border border-slate-300 space-y-6">
            
            <div className="flex justify-between items-start border-b-2 border-blue-900 pb-5">
              <div>
                <h1 className="text-2xl font-black text-blue-950 tracking-wide">{configEmpresa.razon_social}</h1>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Cotización Comercial Oficial</p>
                <p className="text-xs text-slate-500">{configEmpresa.direccion} • Tel: {configEmpresa.telefono} • Email: {configEmpresa.email_contacto}</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-blue-900 text-white font-mono text-base font-bold px-3.5 py-1.5 rounded-xl">
                  {cotSeleccionada.codigo_cotizacion}
                </span>
                <p className="text-xs text-slate-500 mt-1">Fecha: {cotSeleccionada.fecha}</p>
              </div>
            </div>

            <div className="bg-[#f8fafc] p-5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
              <div className="font-bold text-blue-900 uppercase tracking-wider mb-1">CLIENTE / TITULAR</div>
              <div className="grid grid-cols-2 gap-3">
                <div><strong>Razón Social:</strong> {cotSeleccionada.nombre_cliente}</div>
                <div><strong>RUT:</strong> {cotSeleccionada.rut_cliente || 'N/A'}</div>
                <div><strong>Cuenta:</strong> {cotSeleccionada.cuenta || 'Sin cuenta'}</div>
                <div><strong>Validez:</strong> {cotSeleccionada.validez_dias} Días</div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3.5 border-r border-slate-200">Descripción</th>
                    <th className="p-3.5 border-r border-slate-200 text-center w-14">Cant</th>
                    <th className="p-3.5 border-r border-slate-200 text-right w-24">Neto Unit.</th>
                    <th className="p-3.5 border-r border-slate-200 text-center w-16">Desc %</th>
                    <th className="p-3.5 text-right w-28">Subtotal Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {cotSeleccionada.items.map((it, idx) => {
                    const netoLinea = (it.cantidad || 1) * (it.precio_neto_unitario || 0) * (1 - (it.descuento_porcentaje || 0) / 100)
                    return (
                      <tr key={idx}>
                        <td className="p-3.5 font-semibold text-slate-900 border-r border-slate-200">{it.descripcion}</td>
                        <td className="p-3.5 text-center font-mono border-r border-slate-200">{it.cantidad}</td>
                        <td className="p-3.5 text-right font-mono border-r border-slate-200">${it.precio_neto_unitario.toLocaleString('es-CL')}</td>
                        <td className="p-3.5 text-center font-mono border-r border-slate-200">{it.descuento_porcentaje}%</td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">${Math.round(netoLinea).toLocaleString('es-CL')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-[#f8fafc] p-5 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono max-w-xs ml-auto">
              <div className="flex justify-between">
                <span>Neto Total:</span>
                <span>${Math.round(cotSeleccionada.neto_con_descuento || 0).toLocaleString('es-CL')} CLP</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>IVA (19%):</span>
                <span>${Math.round(cotSeleccionada.monto_iva || 0).toLocaleString('es-CL')} CLP</span>
              </div>
              <div className="flex justify-between text-base font-bold text-emerald-800 border-t border-slate-300 pt-1.5">
                <span>TOTAL IVA INCL.:</span>
                <span>${Math.round(cotSeleccionada.monto_total_iva_incluido || 0).toLocaleString('es-CL')} CLP</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setCotSeleccionada(null)}
                className="px-5 py-3 bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl hover:bg-slate-300 cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-blue-900 text-white font-bold text-xs rounded-2xl hover:bg-blue-950 shadow-xs cursor-pointer flex items-center gap-2"
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
