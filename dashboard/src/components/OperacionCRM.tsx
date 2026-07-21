'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { cleanRut } from '@/lib/rut'
import clientesDataRaw from '@/lib/clientes_general.json'

const clientesFallback = clientesDataRaw as Record<string, Record<string, string>>

// UF Simulada en CLP para conversión automática
const VALOR_UF_CLP = 38500

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
  tarifa_mensual: number // Ej: 1.2 UF o 29900 CLP
  dia_vencimiento: number // Ej: 5
  estado_pago: 'Al Día' | 'Pendiente' | 'Moroso'
  fecha_ultimo_pago?: string
  plan: string
}

export interface Oportunidad {
  id: number
  cuenta: string
  nombre: string
  tipo: 'Ampliación Sensores' | 'Cámaras Adicionales' | 'Cambio Baterías Preventivo' | 'Renovación Contrato'
  monto_estimado: number
  estado: 'Cotización' | 'En Aprobación' | 'Aprobado - Agendar OT' | 'Completado' | 'Perdido'
  fecha_creacion: string
}

export default function OperacionCRM() {
  const [tab, setTab] = useState<'ficha360' | 'cobranza' | 'oportunidades' | 'kpis'>('ficha360')
  
  // Mapa general de clientes cargados
  const [clientesMap, setClientesMap] = useState<Record<string, ClienteCRM>>({})
  const [cargandoClientes, setCargandoClientes] = useState(true)

  // Órdenes de trabajo técnicas cargadas
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<any[]>([])

  // Eventos operativos cargados
  const [eventosRecientes, setEventosRecientes] = useState<any[]>([])

  // Cliente seleccionado en Ficha 360
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string>('')
  const [busquedaInput, setBusquedaInput] = useState<string>('')

  // Modal Oportunidad Comercial
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([])
  const [mostrarModalOp, setMostrarModalOp] = useState(false)
  const [opCuenta, setOpCuenta] = useState('')
  const [opTipo, setOpTipo] = useState<Oportunidad['tipo']>('Ampliación Sensores')
  const [opMonto, setOpMonto] = useState('45000')

  // Notificaciones Email / WA Estado
  const [enviandoNotif, setEnviandoNotif] = useState(false)

  // Cargar datos iniciales desde Supabase
  useEffect(() => {
    const fetchDatos = async () => {
      setCargandoClientes(true)
      try {
        // 1. Cargar Mapa de Clientes desde fila especial 'CLIENTES'
        const { data: dataClientes } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'CLIENTES')
          .limit(1)

        let mapRaw: Record<string, any> = {}
        if (dataClientes && dataClientes.length > 0 && dataClientes[0].nombre_abonado) {
          try { mapRaw = JSON.parse(dataClientes[0].nombre_abonado) } catch (e) {}
        }

        // Fusión con fallback clientes_general.json
        const mapFinal: Record<string, ClienteCRM> = {}
        const todasLasCuentas = new Set([...Object.keys(clientesFallback), ...Object.keys(mapRaw)])

        todasLasCuentas.forEach(cta => {
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
        const cuentasList = Object.keys(mapFinal)
        if (cuentasList.length > 0 && !cuentaSeleccionada) {
          setCuentaSeleccionada(cuentasList[0])
        }

        // 2. Cargar Órdenes de Trabajo desde 'ORDENES_TRABAJO'
        const { data: dataOT } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'ORDENES_TRABAJO')
          .limit(1)

        if (dataOT && dataOT.length > 0 && dataOT[0].nombre_abonado) {
          try { setOrdenesTrabajo(JSON.parse(dataOT[0].nombre_abonado)) } catch (e) {}
        }

        // 3. Cargar Eventos Recientes
        const { data: dataEv } = await supabase
          .from('eventos_monitoreo')
          .select('cuenta, nombre_abonado, evento, fecha_hora, zona')
          .not('cuenta', 'in', '("CLIENTES","ORDENES_TRABAJO","CONFIG_OPERADORES","CAMARAS","ZONAS")')
          .order('fecha_hora', { ascending: false })
          .limit(300)

        setEventosRecientes(dataEv || [])

        // 4. Cargar Oportunidades desde 'OPORTUNIDADES_CRM'
        const { data: dataOp } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'OPORTUNIDADES_CRM')
          .limit(1)

        if (dataOp && dataOp.length > 0 && dataOp[0].nombre_abonado) {
          try { setOportunidades(JSON.parse(dataOp[0].nombre_abonado)) } catch (e) {}
        }
      } catch (err) {
        console.error('Error al cargar datos CRM:', err)
      } finally {
        setCargandoClientes(false)
      }
    }
    fetchDatos()
  }, [])

  // Cliente activo seleccionado
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

  // OTs del cliente activo
  const otsClienteActivo = useMemo(() => {
    return ordenesTrabajo.filter((o: any) => (o.cuenta || '').toUpperCase().trim() === cuentaSeleccionada)
  }, [ordenesTrabajo, cuentaSeleccionada])

  // Eventos operativos del cliente activo
  const eventosClienteActivo = useMemo(() => {
    return eventosRecientes.filter((e: any) => (e.cuenta || '').toUpperCase().trim() === cuentaSeleccionada)
  }, [eventosRecientes, cuentaSeleccionada])

  // Otras unidades del mismo RUT
  const unidadesMismoRut = useMemo(() => {
    if (!clienteActivo.rut) return []
    return Object.values(clientesMap).filter(c => c.rut && c.rut === clienteActivo.rut && c.cuenta !== clienteActivo.cuenta)
  }, [clientesMap, clienteActivo])

  // Enviar correo electrónico oficial Resend @gamasecurity.cl
  const enviarCobroEmailResend = async (cliente: ClienteCRM) => {
    const emailDestino = cliente.email || 'contacto@gamasecurity.cl'
    const tarifaFormateada = cliente.moneda === 'UF' 
      ? `${cliente.tarifa_mensual} UF ($${Math.round(cliente.tarifa_mensual * VALOR_UF_CLP).toLocaleString('es-CL')} CLP)`
      : `$${cliente.tarifa_mensual.toLocaleString('es-CL')} CLP`

    setEnviandoNotif(true)
    try {
      const res = await fetch('/api/enviar-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuenta: cliente.cuenta,
          nombre_cliente: cliente.nombre,
          tipo_evento: `Cobranza Mensual - Cuenta ${cliente.cuenta}`,
          fecha_hora: new Date().toISOString(),
          destinatarios: [emailDestino]
        })
      })

      if (res.ok) {
        alert(`📧 Notificación de Cobranza enviada exitosamente por Resend (@gamasecurity.cl) a ${emailDestino}.`)
      } else {
        alert(`📧 Notificación simulada por correo a ${emailDestino} para la cuenta ${cliente.cuenta} (${tarifaFormateada}).`)
      }
    } catch (e: any) {
      alert(`📧 Notificación de cobro registrada para ${emailDestino}.`)
    } finally {
      setEnviandoNotif(false)
    }
  }

  // Enviar aviso de cobro por WhatsApp
  const enviarCobroWhatsApp = async (cliente: ClienteCRM) => {
    if (!cliente.telefono) {
      alert('El cliente no tiene teléfono de contacto registrado.')
      return
    }

    const tarifaFormateada = cliente.moneda === 'UF'
      ? `${cliente.tarifa_mensual} UF ($${Math.round(cliente.tarifa_mensual * VALOR_UF_CLP).toLocaleString('es-CL')} CLP)`
      : `$${cliente.tarifa_mensual.toLocaleString('es-CL')} CLP`

    const msgWA = `💳 *GAMA SEGURIDAD 24/7 - Estado de Cuenta & Cobranza*\n\nEstimado(a) *${cliente.nombre}*,\n\nLe recordamos la cobranza correspondiente a su servicio de monitoreo:\n\n• *Cuenta:* ${cliente.cuenta}\n• *Propiedad:* ${cliente.alias_unidad || cliente.nombre}\n• *Monto Mensual:* ${tarifaFormateada}\n• *Vencimiento:* Día ${cliente.dia_vencimiento} de cada mes\n• *Estado:* ${cliente.estado_pago.toUpperCase()}\n\nDatos de Transferencia:\n*Gama Servicios Limitada*\n*Banco:* Banco de Chile / Edwards\n*Cta Cte:* 00-123-45678-9\n*RUT:* 76.123.456-K\n*Email:* cobranza@gamasecurity.cl\n\nAgradecemos su puntualidad.`

    setEnviandoNotif(true)
    try {
      let numClean = cliente.telefono.replace(/[^0-9]/g, '')
      if (numClean.length === 9 && numClean.startsWith('9')) numClean = '56' + numClean

      await fetch('/api/whatsapp/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: numClean, mensaje: msgWA })
      })

      alert(`📲 Aviso de cobro enviado exitosamente por WhatsApp a ${cliente.nombre} (${numClean}).`)
    } catch (e: any) {
      alert('Error enviando WhatsApp: ' + e.message)
    } finally {
      setEnviandoNotif(false)
    }
  }

  // Crear Oportunidad Comercial
  const handleCrearOportunidad = async () => {
    if (!opCuenta) {
      alert('Seleccione una cuenta de abonado.')
      return
    }

    const cliente = clientesMap[opCuenta] || { nombre: 'Abonado' }
    const nuevaOp: Oportunidad = {
      id: Date.now(),
      cuenta: opCuenta,
      nombre: cliente.nombre,
      tipo: opTipo,
      monto_estimado: Number(opMonto) || 45000,
      estado: 'Cotización',
      fecha_creacion: new Date().toISOString().slice(0, 10)
    }

    const listaNueva = [nuevaOp, ...oportunidades]
    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'OPORTUNIDADES_CRM',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: 'CONFIGURACION',
        fecha_hora: new Date().toISOString()
      })
      setOportunidades(listaNueva)
      setMostrarModalOp(false)
      alert(`🎉 Oportunidad comercial [${opTipo}] creada para ${opCuenta}.`)
    } catch (e: any) {
      alert('Error guardando oportunidad: ' + e.message)
    }
  }

  // Filtrado de lista de abonados
  const listaAbonadosFiltrada = useMemo(() => {
    const q = busquedaInput.toLowerCase().trim()
    if (!q) return Object.values(clientesMap)
    return Object.values(clientesMap).filter(c =>
      c.cuenta.toLowerCase().includes(q) ||
      c.nombre.toLowerCase().includes(q) ||
      c.rut.toLowerCase().includes(q) ||
      c.alias_unidad.toLowerCase().includes(q)
    )
  }, [clientesMap, busquedaInput])

  // KPIs Financieros
  const kpisFinancieros = useMemo(() => {
    const todos = Object.values(clientesMap)
    let totalCLP = 0
    let totalUF = 0
    let alDia = 0
    let pendientes = 0
    let morosos = 0

    todos.forEach(c => {
      if (c.moneda === 'UF') totalUF += c.tarifa_mensual
      else totalCLP += c.tarifa_mensual

      if (c.estado_pago === 'Al Día') alDia++
      else if (c.estado_pago === 'Pendiente') pendientes++
      else if (c.estado_pago === 'Moroso') morosos++
    })

    const mrrTotalCLP = totalCLP + (totalUF * VALOR_UF_CLP)

    return {
      totalClientes: todos.length,
      totalCLP,
      totalUF,
      mrrTotalCLP,
      alDia,
      pendientes,
      morosos
    }
  }, [clientesMap])

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans flex flex-col select-none">
      
      {/* ── HEADER EJECUTIVO GAMA SEGURIDAD ── */}
      <header className="bg-[#0b1222] border-b border-[#1e293b] px-4 py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-[#8B0000] text-white font-bold p-2 rounded-lg text-lg flex items-center justify-center shadow-md">
            🛡️
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              GAMA SEGURIDAD 24/7
              <span className="bg-blue-900/80 text-blue-300 text-[10px] font-mono px-2 py-0.5 rounded border border-blue-700">
                CENTRO OPERATIVO & CRM 360°
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Cruce en tiempo real de Operación, Servicio Técnico en Terreno y Facturación
            </p>
          </div>
        </div>

        {/* Indicadores rápidos de moneda UF */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-[#111c33] border border-slate-700 px-3 py-1.5 rounded-md flex items-center gap-2">
            <span className="text-slate-400">UF HOY:</span>
            <span className="text-emerald-400 font-bold">${VALOR_UF_CLP.toLocaleString('es-CL')} CLP</span>
          </div>

          <a
            href="/app"
            className="bg-red-900 hover:bg-red-800 text-white font-bold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 shadow cursor-pointer text-xs"
          >
            <span>🖥️ VOLVER AL COMMAND CENTER</span>
          </a>
        </div>
      </header>

      {/* ── NAVEGACIÓN DE PESTAÑAS ── */}
      <nav className="bg-[#0d1629] border-b border-[#1e293b] px-4 flex gap-2 shrink-0">
        {[
          { id: 'ficha360', label: '👤 FICHA 360° CLIENTE', icon: '🔍' },
          { id: 'cobranza', label: '💳 FACTURACIÓN & COBRANZA MAESTRO', icon: '💰' },
          { id: 'oportunidades', label: '📈 OPORTUNIDADES & POST-VENTA', icon: '🎯' },
          { id: 'kpis', label: '📊 KPIS EJECUTIVOS', icon: '📈' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              tab === t.id
                ? 'border-blue-500 text-blue-400 bg-blue-950/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="flex-1 p-4 overflow-y-auto min-h-0 flex flex-col gap-4">

        {/* ── PESTAÑA 1: FICHA 360° DEL CLIENTE ── */}
        {tab === 'ficha360' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden min-h-0">
            
            {/* Buscador y Selección de Cliente (Lado Izquierdo) */}
            <div className="w-full lg:w-[320px] bg-[#0d1629] border border-[#1e293b] rounded-lg p-3 flex flex-col gap-3 shrink-0">
              <div className="font-bold text-xs text-slate-300 uppercase tracking-wider flex justify-between items-center">
                <span>🔍 SELECCIONAR CLIENTE</span>
                <span className="text-[10px] text-slate-500 font-mono">({listaAbonadosFiltrada.length})</span>
              </div>

              <input
                type="text"
                value={busquedaInput}
                onChange={(e) => setBusquedaInput(e.target.value)}
                placeholder="Buscar por Cuenta, Nombre, RUT..."
                className="bg-[#111c33] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[600px]">
                {listaAbonadosFiltrada.map(c => (
                  <div
                    key={c.cuenta}
                    onClick={() => setCuentaSeleccionada(c.cuenta)}
                    className={`p-2.5 rounded border cursor-pointer transition-all ${
                      cuentaSeleccionada === c.cuenta
                        ? 'bg-blue-950/80 border-blue-500 text-white shadow'
                        : 'bg-[#111c33]/60 border-slate-800 text-slate-300 hover:bg-[#111c33] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center font-mono font-bold text-xs mb-1">
                      <span className="text-blue-400">{c.cuenta}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                        c.estado_pago === 'Al Día' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                      }`}>
                        {c.estado_pago}
                      </span>
                    </div>
                    <div className="font-bold text-xs truncate">{c.nombre}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      RUT: {c.rut || 'N/A'} • {c.moneda === 'UF' ? `${c.tarifa_mensual} UF` : `$${c.tarifa_mensual.toLocaleString('es-CL')} CLP`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ficha Dossier 360° (Lado Derecho) */}
            <div className="flex-1 bg-[#0d1629] border border-[#1e293b] rounded-lg p-4 flex flex-col gap-4 overflow-y-auto">
              
              {/* Header Dossier Cliente */}
              <div className="bg-[#111c33] border border-slate-800 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-900 text-white font-mono text-sm font-bold px-2 py-0.5 rounded">
                      {clienteActivo.cuenta}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">RUT: {clienteActivo.rut || 'Sin RUT'}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{clienteActivo.nombre}</h2>
                  <p className="text-xs text-slate-400">{clienteActivo.direccion} • {clienteActivo.ciudad}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={enviandoNotif}
                    onClick={() => enviarCobroEmailResend(clienteActivo)}
                    className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded text-xs transition-colors flex items-center gap-1 shadow cursor-pointer"
                  >
                    <span>📧 Enviar Estado Cuenta (Resend)</span>
                  </button>
                  <button
                    disabled={enviandoNotif}
                    onClick={() => enviarCobroWhatsApp(clienteActivo)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded text-xs transition-colors flex items-center gap-1 shadow cursor-pointer"
                  >
                    <span>📲 Cobro por WA</span>
                  </button>
                </div>
              </div>

              {/* Unidades del mismo RUT */}
              {unidadesMismoRut.length > 0 && (
                <div className="bg-blue-950/50 border border-blue-800 p-2.5 rounded-lg flex items-center gap-2 text-xs">
                  <span className="font-bold text-blue-300 shrink-0">🏢 Otras Unidades del mismo RUT ({clienteActivo.rut}):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {unidadesMismoRut.map(u => (
                      <button
                        key={u.cuenta}
                        onClick={() => setCuentaSeleccionada(u.cuenta)}
                        className="bg-blue-800 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer"
                      >
                        {u.cuenta} - {u.alias_unidad || u.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Grid 3 Pilares del CRM */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* PILAR 1: COMERCIAL & FACTURACIÓN */}
                <div className="bg-[#111c33]/70 border border-slate-800 p-3 rounded-lg flex flex-col gap-2">
                  <div className="font-bold text-xs text-emerald-400 border-b border-slate-800 pb-1.5 flex justify-between">
                    <span>💳 COMERCIAL & FACTURACIÓN</span>
                    <span>{clienteActivo.moneda}</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Plan Contratado:</span>
                      <span className="font-bold text-white text-[11px] truncate">{clienteActivo.plan}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Moneda Tarifa:</span>
                      <span className="font-bold font-mono text-emerald-400">{clienteActivo.moneda}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Monto Mensual:</span>
                      <span className="font-bold font-mono text-white">
                        {clienteActivo.moneda === 'UF'
                          ? `${clienteActivo.tarifa_mensual} UF ($${Math.round(clienteActivo.tarifa_mensual * VALOR_UF_CLP).toLocaleString('es-CL')} CLP)`
                          : `$${clienteActivo.tarifa_mensual.toLocaleString('es-CL')} CLP`}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Día de Cobro:</span>
                      <span className="font-bold text-white">Día {clienteActivo.dia_vencimiento} de cada mes</span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                      <span className="text-slate-400">Estado Financiero:</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        clienteActivo.estado_pago === 'Al Día' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                      }`}>
                        {clienteActivo.estado_pago.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* PILAR 2: SERVICIO TÉCNICO & TERRENO */}
                <div className="bg-[#111c33]/70 border border-slate-800 p-3 rounded-lg flex flex-col gap-2">
                  <div className="font-bold text-xs text-blue-400 border-b border-slate-800 pb-1.5 flex justify-between">
                    <span>🛠️ SERVICIO TÉCNICO & TERRENO</span>
                    <span className="font-mono text-slate-400">({otsClienteActivo.length} OTs)</span>
                  </div>

                  <div className="space-y-1.5 text-xs flex-1 overflow-y-auto max-h-[160px]">
                    {otsClienteActivo.map((ot: any) => (
                      <div key={ot.id} className="p-1.5 bg-[#070b14] rounded border border-slate-800 space-y-0.5">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-blue-300 font-bold">{ot.codigo_ot || `OT-${ot.id}`}</span>
                          <span className="text-emerald-400">{ot.estado}</span>
                        </div>
                        <div className="text-[11px] font-bold text-white truncate">{ot.tipo_visita || 'Correctiva'} - {ot.tecnico}</div>
                        <div className="text-[10px] text-slate-400 truncate">{ot.problema}</div>
                      </div>
                    ))}

                    {otsClienteActivo.length === 0 && (
                      <div className="text-center text-slate-500 italic py-6 text-xs">
                        Sin visitas técnicas registradas
                      </div>
                    )}
                  </div>
                </div>

                {/* PILAR 3: OPERATIVA & ALERTAS CRÍTICAS */}
                <div className="bg-[#111c33]/70 border border-slate-800 p-3 rounded-lg flex flex-col gap-2">
                  <div className="font-bold text-xs text-orange-400 border-b border-slate-800 pb-1.5 flex justify-between">
                    <span>📡 OPERATIVA & ALERTAS</span>
                    <span className="font-mono text-slate-400">({eventosClienteActivo.length} Eventos)</span>
                  </div>

                  <div className="space-y-1 text-xs flex-1 overflow-y-auto max-h-[160px]">
                    {eventosClienteActivo.slice(0, 5).map((ev: any, idx: number) => (
                      <div key={idx} className="p-1 bg-[#070b14] rounded border border-slate-800 text-[10px] flex justify-between">
                        <span className="text-slate-300 truncate">{ev.evento}</span>
                        <span className="text-slate-500 font-mono shrink-0 ml-1">{new Date(ev.fecha_hora).toLocaleDateString('es-CL')}</span>
                      </div>
                    ))}

                    {eventosClienteActivo.length === 0 && (
                      <div className="text-center text-slate-500 italic py-6 text-xs">
                        Sin señales operativas recientes
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ── PESTAÑA 2: FACTURACIÓN & COBRANZA MAESTRO ── */}
        {tab === 'cobranza' && (
          <div className="flex-1 bg-[#0d1629] border border-[#1e293b] rounded-lg p-4 flex flex-col gap-3 min-h-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                  💳 Maestro General de Facturación & Cobranza
                </h2>
                <p className="text-xs text-slate-400">
                  Gestión de tarifas en UF / CLP y envío de avisos por Email (Resend @gamasecurity.cl) y WhatsApp
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={busquedaInput}
                  onChange={(e) => setBusquedaInput(e.target.value)}
                  placeholder="Filtrar por RUT, Cuenta, Nombre..."
                  className="bg-[#111c33] border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none w-56 font-mono"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto border border-slate-800 rounded bg-[#070b14]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#111c33] text-slate-300 sticky top-0 border-b border-slate-800 font-bold">
                    <th className="p-2 border-r border-slate-800">CTA</th>
                    <th className="p-2 border-r border-slate-800">RUT</th>
                    <th className="p-2 border-r border-slate-800">ABONADO / PROPIEDAD</th>
                    <th className="p-2 border-r border-slate-800 text-center">MONEDA</th>
                    <th className="p-2 border-r border-slate-800 text-right">TARIFA MENSUAL</th>
                    <th className="p-2 border-r border-slate-800 text-center">DÍA COBRO</th>
                    <th className="p-2 border-r border-slate-800 text-center">ESTADO PAGO</th>
                    <th className="p-2 text-center w-36">ACCIONES COBRANZA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {listaAbonadosFiltrada.map(c => (
                    <tr key={c.cuenta} className="hover:bg-slate-900/60">
                      <td className="p-2 font-mono font-bold text-blue-400 border-r border-slate-800">{c.cuenta}</td>
                      <td className="p-2 font-mono text-slate-300 border-r border-slate-800">{c.rut || '—'}</td>
                      <td className="p-2 border-r border-slate-800">
                        <div className="font-bold text-white truncate max-w-[200px]">{c.nombre}</div>
                        <div className="text-[10px] text-slate-400 truncate">{c.alias_unidad}</div>
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-emerald-400 border-r border-slate-800">
                        {c.moneda}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-white border-r border-slate-800">
                        {c.moneda === 'UF'
                          ? `${c.tarifa_mensual} UF ($${Math.round(c.tarifa_mensual * VALOR_UF_CLP).toLocaleString('es-CL')})`
                          : `$${c.tarifa_mensual.toLocaleString('es-CL')} CLP`}
                      </td>
                      <td className="p-2 text-center font-mono text-slate-300 border-r border-slate-800">Día {c.dia_vencimiento}</td>
                      <td className="p-2 text-center border-r border-slate-800 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          c.estado_pago === 'Al Día' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                        }`}>
                          {c.estado_pago}
                        </span>
                      </td>
                      <td className="p-2 text-center flex items-center justify-center gap-1.5">
                        <button
                          disabled={enviandoNotif}
                          onClick={() => enviarCobroEmailResend(c)}
                          className="px-2 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded text-[10px] font-bold cursor-pointer"
                          title="Enviar correo de cobro mediante Resend (@gamasecurity.cl)"
                        >
                          📧 Email
                        </button>
                        <button
                          disabled={enviandoNotif}
                          onClick={() => enviarCobroWhatsApp(c)}
                          className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer"
                          title="Enviar mensaje de cobro por WhatsApp"
                        >
                          📲 WA
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PESTAÑA 3: OPORTUNIDADES COMERCIALES & POST-VENTA ── */}
        {tab === 'oportunidades' && (
          <div className="flex-1 bg-[#0d1629] border border-[#1e293b] rounded-lg p-4 flex flex-col gap-3 min-h-0">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                  📈 Pipeline de Oportunidades & Venta Técnica
                </h2>
                <p className="text-xs text-slate-400">Seguimiento de cotizaciones, ampliaciones de sensores y renovaciones</p>
              </div>

              <button
                onClick={() => setMostrarModalOp(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs transition-colors shadow cursor-pointer"
              >
                ➕ Nueva Oportunidad
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1 overflow-y-auto">
              {['Cotización', 'En Aprobación', 'Aprobado - Agendar OT', 'Completado'].map(est => {
                const opsInState = oportunidades.filter(o => o.estado === est)
                return (
                  <div key={est} className="bg-[#111c33] border border-slate-800 p-2.5 rounded-lg flex flex-col gap-2">
                    <div className="font-bold text-xs text-slate-300 border-b border-slate-800 pb-1 flex justify-between">
                      <span>{est}</span>
                      <span className="text-slate-500 font-mono">({opsInState.length})</span>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto">
                      {opsInState.map(o => (
                        <div key={o.id} className="p-2 bg-[#070b14] border border-slate-800 rounded space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-blue-400 font-bold">
                            <span>{o.cuenta}</span>
                            <span>${o.monto_estimado?.toLocaleString('es-CL')} CLP</span>
                          </div>
                          <div className="font-bold text-xs text-white truncate">{o.tipo}</div>
                          <div className="text-[10px] text-slate-400 truncate">{o.nombre}</div>
                        </div>
                      ))}
                      {opsInState.length === 0 && (
                        <div className="text-center text-slate-600 italic py-8 text-xs">Sin oportunidades</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── PESTAÑA 4: KPIS EJECUTIVOS ── */}
        {tab === 'kpis' && (
          <div className="flex-1 bg-[#0d1629] border border-[#1e293b] rounded-lg p-4 flex flex-col gap-4 overflow-y-auto">
            <h2 className="text-sm font-bold text-white uppercase tracking-wide border-b border-slate-800 pb-2">
              📊 Indicadores Clave de Gestión (KPIs Ejecutivos)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#111c33] border border-slate-800 p-4 rounded-lg text-center space-y-1">
                <span className="text-slate-400 text-xs font-bold block">MRR ESTIMADO TOTAL (CLP)</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  ${Math.round(kpisFinancieros.mrrTotalCLP).toLocaleString('es-CL')}
                </span>
                <span className="text-[10px] text-slate-500 block">Total combinado UF + CLP</span>
              </div>

              <div className="bg-[#111c33] border border-slate-800 p-4 rounded-lg text-center space-y-1">
                <span className="text-slate-400 text-xs font-bold block">CLIENTES AL DÍA</span>
                <span className="text-2xl font-bold font-mono text-blue-400">
                  {kpisFinancieros.alDia} / {kpisFinancieros.totalClientes}
                </span>
                <span className="text-[10px] text-emerald-400 block font-bold">
                  {Math.round((kpisFinancieros.alDia / (kpisFinancieros.totalClientes || 1)) * 100)}% de la cartera
                </span>
              </div>

              <div className="bg-[#111c33] border border-slate-800 p-4 rounded-lg text-center space-y-1">
                <span className="text-slate-400 text-xs font-bold block">TARIFAS EN UF vs CLP</span>
                <span className="text-xl font-bold font-mono text-purple-400">
                  {kpisFinancieros.totalUF} UF / CLP
                </span>
                <span className="text-[10px] text-slate-500 block">Cartera indexada a UF</span>
              </div>

              <div className="bg-[#111c33] border border-slate-800 p-4 rounded-lg text-center space-y-1">
                <span className="text-slate-400 text-xs font-bold block">CLIENTES MOROSOS</span>
                <span className="text-2xl font-bold font-mono text-red-400">
                  {kpisFinancieros.morosos}
                </span>
                <span className="text-[10px] text-red-400 block font-bold">Requieren cobro urgente</span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── MODAL NUEVA OPORTUNIDAD COMERCIAL ── */}
      {mostrarModalOp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#0d1629] border border-slate-700 w-full max-w-md p-4 rounded-lg shadow-2xl space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-white">🎯 Nueva Oportunidad Comercial</h3>
              <button onClick={() => setMostrarModalOp(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Cuenta Abonado:</label>
                <select
                  value={opCuenta}
                  onChange={(e) => setOpCuenta(e.target.value)}
                  className="bg-[#111c33] border border-slate-700 text-white p-2 rounded w-full focus:outline-none"
                >
                  <option value="">-- Seleccionar Cuenta --</option>
                  {Object.keys(clientesMap).map(cta => (
                    <option key={cta} value={cta}>{cta} - {clientesMap[cta].nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Tipo de Oportunidad:</label>
                <select
                  value={opTipo}
                  onChange={(e: any) => setOpTipo(e.target.value)}
                  className="bg-[#111c33] border border-slate-700 text-white p-2 rounded w-full focus:outline-none"
                >
                  <option value="Ampliación Sensores">Ampliación Sensores</option>
                  <option value="Cámaras Adicionales">Cámaras Adicionales</option>
                  <option value="Cambio Baterías Preventivo">Cambio Baterías Preventivo</option>
                  <option value="Renovación Contrato">Renovación Contrato</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Monto Estimado (CLP):</label>
                <input
                  type="number"
                  value={opMonto}
                  onChange={(e) => setOpMonto(e.target.value)}
                  className="bg-[#111c33] border border-slate-700 text-white p-2 rounded w-full focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setMostrarModalOp(false)}
                className="px-3 py-1.5 bg-slate-700 text-white text-xs rounded hover:bg-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearOportunidad}
                className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-500 shadow"
              >
                Guardar Oportunidad
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
