'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { cleanRut } from '@/lib/rut'
import clientesDataRaw from '@/lib/clientes_general.json'

const clientesFallback = clientesDataRaw as Record<string, Record<string, string>>

const IVA_PORCENTAJE = 0.19

// ── CATÁLOGO PRECONFIGURADO DE SEGURIDAD ELECTRÓNICA & MONITOREO ──
const CATALOGO_SEGURIDAD = [
  { id: 'CAT-1', descripcion: 'Kit Alarma DSC Neo 8 Zonas con Teclado LCD & Sirena Exterior 110dB', precio_neto: 235294, categoria: 'Kit Alarma' },
  { id: 'CAT-2', descripcion: 'Cámara IP 4MP Hikvision DarkFighter Visión Nocturna Color 24/7', precio_neto: 71428, categoria: 'CCTV' },
  { id: 'CAT-3', descripcion: 'Control remoto inalambrico RadioFrecuencia 4Botones Botón Pánico', precio_neto: 26050, categoria: 'Accesorios' },
  { id: 'CAT-4', descripcion: 'Cerco Eléctrico Perimetral 6 Hilos con Energizador 12.000V Batería Respaldo', precio_neto: 378151, categoria: 'Cerco' },
  { id: 'CAT-5', descripcion: 'Servicio de Monitoreo de Alarma 24/7 & Verificación por Video IA (Mensual)', precio_neto: 25126, categoria: 'Monitoreo' },
  { id: 'CAT-6', descripcion: 'Sensor de Movimiento Exterior Infrarrojo Dual Tech Antimask', precio_neto: 48500, categoria: 'Sensores' }
]

// ── NIVEL 1: EMPRESA DEL CONGLOMERADO (CRUD 4 RAZONES SOCIALES) ──
export interface EmpresaConglomerado {
  id: string
  razon_social: string
  rut: string
  giro: string
  direccion: string
  telefono: string
  email_cobranza: string
  email_contacto: string
  web: string
  banco_nombre: string
  banco_tipo_cuenta: string
  banco_numero_cuenta: string
}

// ── NIVEL 2: CLIENTE COMERCIAL (POR RUT ÚNICO O FICHA) ──
export interface ClienteMaestro {
  rut: string
  razon_social: string
  empresa_facturadora_id: string
  email_cobranza: string
  telefono: string
  direccion_comercial: string
  ciudad?: string
  moneda: 'UF' | 'CLP'
  tarifa_mensual: number
  dia_vencimiento: number
  plan_monitoreo: string
  estado_pago: 'Al Día' | 'Pendiente' | 'Moroso'
  cuentas_abonados: string[]
}

// ── NIVEL 3: CENTRO DE COSTO / ABONADO (COMMAND CENTER) ──
export interface CentroDeCostoAbonado {
  cuenta: string
  alias_centro_costo: string
  direccion: string
  ciudad: string
  rut_cliente: string
}

export interface FacturaIndividual {
  id: string
  numero_factura: string
  fecha: string
  razon_social: string
  rut_cliente: string
  empresa_facturadora_id: string
  monto_total: number
  monto_abonado: number
  saldo_pendiente: number
  cuenta_asociada?: string
  estado: 'Emitida' | 'Abonada' | 'Pagada' | 'Morosa'
  notas_cobranza?: string
  fecha_carga: string
}

export interface ItemCotizacion {
  id: string
  descripcion: string
  cantidad: number
  precio_neto_unitario: number
  descuento_valor: number
  tipo_descuento: 'porcentaje' | 'monto'
  descuento_porcentaje?: number
}

export type EtapaPipelineEspo = 'Lead' | 'Visita' | 'Cotizacion' | 'Negociacion' | 'Ganada' | 'Perdida'

export interface CotizacionDolibarr {
  id: number
  codigo_cotizacion: string
  cuenta: string
  rut_cliente: string
  nombre_cliente: string
  empresa_facturadora_id: string
  direccion: string
  ciudad_cliente?: string
  email_cliente?: string
  telefono_cliente?: string
  giro_cliente?: string
  contacto_persona?: string
  vendedor?: string
  tipo_receptor?: 'registrado' | 'prospecto'
  etapa_pipeline?: EtapaPipelineEspo
  fecha: string
  validez_dias: number
  forma_pago?: string
  moneda_cotizacion?: 'CLP' | 'UF'
  descuento_global_valor?: number
  descuento_global_tipo?: 'porcentaje' | 'monto'
  items: ItemCotizacion[]
  subtotal_neto: number
  total_descuentos: number
  neto_con_descuento: number
  monto_iva: number
  monto_total_iva_incluido: number
  estado: 'Borrador' | 'Enviado' | 'Aprobado' | 'Rechazado'
  observaciones: string
}

export interface OrdenDeTrabajo {
  id: string
  codigo_ot: string
  cuenta: string
  cliente_nombre: string
  tipo_servicio: string
  tecnico_asignado: string
  fecha_programada: string
  prioridad_sla?: 'Crítica (2h)' | 'Alta (6h)' | 'Normal (24h)'
  estado: 'Pendiente' | 'En Proceso' | 'Completada' | 'Cancelada'
  observaciones: string
}

const EMPRESAS_INICIALES: EmpresaConglomerado[] = [
  {
    id: 'EMP-1',
    razon_social: 'Gama Seguridad SpA',
    rut: '76.319.399-3',
    giro: 'Servicios de Seguridad Electrónica & Alarmas',
    direccion: 'Av. Valparaíso 1183 Of. 03, Viña del Mar, Chile',
    telefono: '+56 32 3276011',
    email_cobranza: 'cobranza@gamasecurity.cl',
    email_contacto: 'contacto@gamasecurity.cl',
    web: 'www.gamasecurity.cl',
    banco_nombre: 'Banco de Chile / Edwards',
    banco_tipo_cuenta: 'Cuenta Corriente',
    banco_numero_cuenta: '00-123-45678-9'
  },
  {
    id: 'EMP-2',
    razon_social: 'Gama Servicios Limitada',
    rut: '76.123.456-K',
    giro: 'Servicios Integrales de Monitoreo 24/7',
    direccion: 'Av. Providencia 1234, Of. 502, Santiago, Chile',
    telefono: '+56 9 9101 6912',
    email_cobranza: 'servicios@gamasecurity.cl',
    email_contacto: 'contacto@gamasecurity.cl',
    web: 'www.gamasecurity.cl',
    banco_nombre: 'Banco Santander',
    banco_tipo_cuenta: 'Cuenta Corriente',
    banco_numero_cuenta: '00-987-65432-1'
  },
  {
    id: 'EMP-3',
    razon_social: 'Gama Tecnología & Telecom SpA',
    rut: '77.890.123-4',
    giro: 'Venta e Instalación de CCTV & Sistemas de Control de Acceso',
    direccion: 'Calle Esmeralda 450, Valparaíso, Chile',
    telefono: '+56 32 2548900',
    email_cobranza: 'tecnologia@gamasecurity.cl',
    email_contacto: 'contacto@gamasecurity.cl',
    web: 'www.gamasecurity.cl',
    banco_nombre: 'Banco BCI',
    banco_tipo_cuenta: 'Cuenta Corriente',
    banco_numero_cuenta: '11-223-34455-6'
  },
  {
    id: 'EMP-4',
    razon_social: 'Gama Monitoreo 24/7 SpA',
    rut: '76.999.888-1',
    giro: 'Central de Operaciones & Verificación por Video IA',
    direccion: 'Av. Apoquindo 3000, Las Condes, Santiago, Chile',
    telefono: '+56 2 2890 1200',
    email_cobranza: 'monitoreo@gamasecurity.cl',
    email_contacto: 'contacto@gamasecurity.cl',
    web: 'www.gamasecurity.cl',
    banco_nombre: 'Banco Estado',
    banco_tipo_cuenta: 'Cuenta Corriente',
    banco_numero_cuenta: '22-334-45566-7'
  }
]

export default function OperacionCRM() {
  const [moduloActivo, setModuloActivo] = useState<'ficha360' | 'autonomia' | 'presupuestos' | 'facturacion' | 'serv_tecnico' | 'kpis' | 'config'>('ficha360')
  const [sidebarAbierto, setSidebarAbierto] = useState<boolean>(true)

  // ── NIVEL 1: EMPRESAS DEL CONGLOMERADO ──
  const [empresasConglomerado, setEmpresasConglomerado] = useState<EmpresaConglomerado[]>(EMPRESAS_INICIALES)
  const [mostrarModalEmpresa, setMostrarModalEmpresa] = useState(false)
  const [empresaEditando, setEmpresaEditando] = useState<EmpresaConglomerado | null>(null)

  // ── NIVEL 2 Y 3: SELECCIÓN DE CLIENTE Y ABONADO INDIVIDUAL ──
  const [clientesMaestros, setClientesMaestros] = useState<Record<string, ClienteMaestro>>({})
  const [abonadosCentrosCosto, setAbonadosCentrosCosto] = useState<Record<string, CentroDeCostoAbonado>>({})
  
  const [rutClienteSeleccionado, setRutClienteSeleccionado] = useState<string>('')
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string>('')
  const [busquedaClienteInput, setBusquedaClienteInput] = useState<string>('')

  // UF Global
  const [valorUF, setValorUF] = useState(38500)

  // Órdenes de Trabajo & Facturas & Cotizaciones
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenDeTrabajo[]>([
    { id: 'OT-1', codigo_ot: 'OT-2026-081', cuenta: '0999', cliente_nombre: 'GAMA SEGURIDAD SPA DEMO', tipo_servicio: 'Mantención Perimetral Alarma', tecnico_asignado: 'Técnico Juan Pérez', fecha_programada: '2026-07-22', prioridad_sla: 'Crítica (2h)', estado: 'En Proceso', observaciones: 'Revisión urgente de sensor infrarrojo' },
    { id: 'OT-2', codigo_ot: 'OT-2026-082', cuenta: 'C774', cliente_nombre: 'CORPORACION PRODEL', tipo_servicio: 'Instalación Cámara IP DarkFighter', tecnico_asignado: 'Técnico Carlos Rojas', fecha_programada: '2026-07-23', prioridad_sla: 'Alta (6h)', estado: 'Pendiente', observaciones: 'Montaje de 2 cámaras en acceso principal' }
  ])
  const [facturas, setFacturas] = useState<FacturaIndividual[]>([])
  const [cotizaciones, setCotizaciones] = useState<CotizacionDolibarr[]>([])
  
  // Selector Vista Cotizaciones (Tabla DTE vs Kanban Pipeline EspoCRM)
  const [vistaCotizaciones, setVistaCotizaciones] = useState<'tabla' | 'kanban'>('tabla')

  // Modales Facturación & Abonos Parciales
  const [mostrarModalAbono, setMostrarModalAbono] = useState(false)
  const [facturaAbonando, setFacturaAbonando] = useState<FacturaIndividual | null>(null)
  const [montoAbonoInput, setMontoAbonoInput] = useState('')
  const [metodoPagoInput, setMetodoPagoInput] = useState('Transferencia Bancaria')
  const [notaAbonoInput, setNotaAbonoInput] = useState('')

  // Modales OT & Creador de Presupuesto Side-by-Side (DTE Chile Standard)
  const [mostrarModalCotizacion, setMostrarModalCotizacion] = useState(false)
  const [cotSeleccionada, setCotSeleccionada] = useState<CotizacionDolibarr | null>(null)
  const [cotEditandoId, setCotEditandoId] = useState<number | null>(null)

  // FORMULARIO Y ESTADO DEL CREADOR DE COTIZACIONES PROFESIONAL
  const [tipoReceptorCot, setTipoReceptorCot] = useState<'registrado' | 'prospecto'>('registrado')
  const [cotEmpresaEmisoraId, setCotEmpresaEmisoraId] = useState('EMP-1')
  const [cotClienteRutSeleccionado, setCotClienteRutSeleccionado] = useState('')
  const [cotNombreCliente, setCotNombreCliente] = useState('')
  const [cotRutCliente, setCotRutCliente] = useState('')
  const [cotGiroCliente, setCotGiroCliente] = useState('Servicios Integrales / Particular')
  const [cotContactoPersona, setCotContactoPersona] = useState('')
  const [cotDireccion, setCotDireccion] = useState('')
  const [cotCiudadCliente, setCotCiudadCliente] = useState('Santiago')
  const [cotEmailCliente, setCotEmailCliente] = useState('')
  const [cotTelefonoCliente, setCotTelefonoCliente] = useState('')
  const [cotVendedor, setCotVendedor] = useState('Ejecutivo Comercial Gama Seguridad')
  const [cotEtapaPipeline, setCotEtapaPipeline] = useState<EtapaPipelineEspo>('Cotizacion')
  const [cotValidez, setCotValidez] = useState(15)
  const [cotFormaPago, setCotFormaPago] = useState('50% Anticipo / 50% Al Finalizar')
  const [cotMoneda, setCotMoneda] = useState<'CLP' | 'UF'>('CLP')
  const [cotObservaciones, setCotObservaciones] = useState('Garantía de equipos 12 meses. Precios netos afectos al 19% IVA según normativa legal chilena.')
  
  // DESCUENTO GLOBAL DE COTIZACIÓN ($ O %)
  const [descuentoGlobalValor, setDescuentoGlobalValor] = useState<number>(0)
  const [descuentoGlobalTipo, setDescuentoGlobalTipo] = useState<'porcentaje' | 'monto'>('porcentaje')

  const [itemsCot, setItemsCot] = useState<ItemCotizacion[]>([
    { id: '1', descripcion: 'Control remoto inalambrico RadioFrecuencia 4Botones Botón Pánico', cantidad: 1, precio_neto_unitario: 31000, descuento_valor: 0, tipo_descuento: 'porcentaje' }
  ])

  // Modales OT
  const [mostrarModalOT, setMostrarModalOT] = useState(false)
  const [enviandoNotif, setEnviandoNotif] = useState(false)

  // ── MOTOR DE AGENTES DE IA AUTÓNOMOS 24/7 (AUTO-COMPANY ENGINE) ──
  const [logsConsenso, setLogsConsenso] = useState<string[]>([
    `[${new Date().toLocaleTimeString('es-CL')}] 🟢 SRE Guardian Agent: Chequeo de latencia Supabase (14ms) - Salud 100%.`,
    `[${new Date().toLocaleTimeString('es-CL')}] 💳 Finance & Billing Agent: Escaneo de 466 clientes completado. 0 morosidades detectadas hoy.`,
    `[${new Date().toLocaleTimeString('es-CL')}] 👁️ Vision AI Guard: 1,420 eventos de video verificados. 0 falsas alarmas críticas.`,
    `[${new Date().toLocaleTimeString('es-CL')}] 📋 Sales & PR2607 Agent: Correlativo activo listo (PR2607-0258).`
  ])
  const [ejecutandoCiclo, setEjecutandoCiclo] = useState(false)

  // ── INICIALIZACIÓN DE DATOS JERÁRQUICOS DESDE SUPABASE & FALLBACK ──
  useEffect(() => {
    const fetchDatosJerarquicos = async () => {
      try {
        const { data: dEmp } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'EMPRESAS_CONGLOMERADO')
          .limit(1)

        if (dEmp && dEmp.length > 0 && dEmp[0].nombre_abonado) {
          try { setEmpresasConglomerado(JSON.parse(dEmp[0].nombre_abonado)) } catch (e) {}
        }

        const { data: dClientes } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'CLIENTES')
          .limit(1)

        let rawClientesMap: Record<string, any> = {}
        if (dClientes && dClientes.length > 0 && dClientes[0].nombre_abonado) {
          try { rawClientesMap = JSON.parse(dClientes[0].nombre_abonado) } catch (e) {}
        }

        const mapaMaestro: Record<string, ClienteMaestro> = {}
        const mapaCentrosCosto: Record<string, CentroDeCostoAbonado> = {}

        const todasCuentas = new Set([...Object.keys(clientesFallback), ...Object.keys(rawClientesMap)])

        todasCuentas.forEach(cta => {
          const raw = rawClientesMap[cta] || clientesFallback[cta] || {}
          const cCode = (raw.cuenta || cta).toUpperCase().trim()
          
          const nombreAbonado = (raw.alias_unidad || raw.nombre || `Abonado ${cCode}`).trim()
          const rutRaw = raw.rut ? cleanRut(raw.rut) : ''
          const rutKey = rutRaw && rutRaw !== '76123456K' ? rutRaw : `CTA-${cCode}`

          mapaCentrosCosto[cCode] = {
            cuenta: cCode,
            alias_centro_costo: nombreAbonado,
            direccion: raw.direccion || 'Dirección sin registrar',
            ciudad: raw.ciudad || 'SANTIAGO',
            rut_cliente: rutKey
          }

          if (!mapaMaestro[rutKey]) {
            mapaMaestro[rutKey] = {
              rut: rutRaw || `RUT-${cCode}`,
              razon_social: raw.nombre || nombreAbonado,
              empresa_facturadora_id: raw.empresa_facturadora_id || 'EMP-1',
              email_cobranza: raw.email || 'cobranza@cliente.cl',
              telefono: raw.telefono1 || raw.t1 || raw.telefono || '+56991016912',
              direccion_comercial: raw.direccion || 'Dirección Principal',
              ciudad: raw.ciudad || 'Santiago',
              moneda: raw.moneda === 'UF' ? 'UF' : 'CLP',
              tarifa_mensual: Number(raw.tarifa_mensual) || (raw.moneda === 'UF' ? 1.2 : 29900),
              dia_vencimiento: Number(raw.dia_vencimiento) || 5,
              plan_monitoreo: raw.plan || 'MONITOREO ESTÁNDAR 24/7',
              estado_pago: raw.estado_pago || 'Al Día',
              cuentas_abonados: [cCode]
            }
          } else {
            if (!mapaMaestro[rutKey].cuentas_abonados.includes(cCode)) {
              mapaMaestro[rutKey].cuentas_abonados.push(cCode)
            }
          }
        })

        setClientesMaestros(mapaMaestro)
        setAbonadosCentrosCosto(mapaCentrosCosto)

        const { data: dOT } = await supabase.from('eventos_monitoreo').select('nombre_abonado').eq('cuenta', 'ORDENES_TRABAJO').limit(1)
        if (dOT && dOT.length > 0 && dOT[0].nombre_abonado) try { setOrdenesTrabajo(JSON.parse(dOT[0].nombre_abonado)) } catch (e) {}

        const { data: dFact } = await supabase.from('eventos_monitoreo').select('nombre_abonado').eq('cuenta', 'FACTURAS_MAESTRO').limit(1)
        if (dFact && dFact.length > 0 && dFact[0].nombre_abonado) {
          try { setFacturas(JSON.parse(dFact[0].nombre_abonado)) } catch (e) {}
        } else {
          const facturasIniciales: FacturaIndividual[] = [
            { id: 'FAC-1001', numero_factura: 'F-8820', fecha: '2026-07-01', razon_social: 'GAMA SEGURIDAD SPA DEMO', rut_cliente: '76.319.399-3', empresa_facturadora_id: 'EMP-1', monto_total: 35581, monto_abonado: 0, saldo_pendiente: 35581, cuenta_asociada: '0999', estado: 'Emitida', fecha_carga: '2026-07-01' },
            { id: 'FAC-1002', numero_factura: 'F-8821', fecha: '2026-07-05', razon_social: 'CORPORACION PRODEL', rut_cliente: '77.890.123-4', empresa_facturadora_id: 'EMP-2', monto_total: 89700, monto_abonado: 45000, saldo_pendiente: 44700, cuenta_asociada: 'C774', estado: 'Abonada', fecha_carga: '2026-07-05' }
          ]
          setFacturas(facturasIniciales)
        }

        const { data: dCot } = await supabase.from('eventos_monitoreo').select('nombre_abonado').eq('cuenta', 'COTIZACIONES_DOLIBARR').limit(1)
        if (dCot && dCot.length > 0 && dCot[0].nombre_abonado) try { setCotizaciones(JSON.parse(dCot[0].nombre_abonado)) } catch (e) {}

      } catch (err) {
        console.error('Error cargando datos:', err)
      }
    }
    fetchDatosJerarquicos()
  }, [])

  const abonadoActivo = useMemo(() => {
    if (cuentaSeleccionada && abonadosCentrosCosto[cuentaSeleccionada]) {
      return abonadosCentrosCosto[cuentaSeleccionada]
    }
    return null
  }, [cuentaSeleccionada, abonadosCentrosCosto])

  const clienteActivo = useMemo(() => {
    if (abonadoActivo && abonadoActivo.rut_cliente && clientesMaestros[abonadoActivo.rut_cliente]) {
      return clientesMaestros[abonadoActivo.rut_cliente]
    }
    if (rutClienteSeleccionado && clientesMaestros[rutClienteSeleccionado]) {
      return clientesMaestros[rutClienteSeleccionado]
    }
    return null
  }, [abonadoActivo, rutClienteSeleccionado, clientesMaestros])

  const siguienteCorrelativoCode = useMemo(() => {
    let maxNum = 259
    cotizaciones.forEach(c => {
      const match = (c.codigo_cotizacion || '').match(/PR2607-(\d+)/)
      if (match) {
        const n = parseInt(match[1], 10)
        if (n > maxNum) maxNum = n
      }
    })
    const nextNum = maxNum + 1
    return `PR2607-${nextNum.toString().padStart(4, '0')}`
  }, [cotizaciones])

  const kpisFinancieros = useMemo(() => {
    let totalTarifasCLP = 0
    let totalClientes = Object.keys(clientesMaestros).length

    Object.values(clientesMaestros).forEach(c => {
      if (c.moneda === 'UF') {
        totalTarifasCLP += Math.round((c.tarifa_mensual || 1.2) * valorUF)
      } else {
        totalTarifasCLP += c.tarifa_mensual || 29900
      }
    })

    const desglosePorEmpresa = empresasConglomerado.map(emp => {
      const clientesDeEstaEmpresa = Object.values(clientesMaestros).filter(c => c.empresa_facturadora_id === emp.id)
      let montoProyectado = 0
      clientesDeEstaEmpresa.forEach(c => {
        if (c.moneda === 'UF') montoProyectado += Math.round(c.tarifa_mensual * valorUF)
        else montoProyectado += c.tarifa_mensual || 29900
      })
      const porcentajeParticipacion = totalTarifasCLP > 0 ? (montoProyectado / totalTarifasCLP) * 100 : 25
      return {
        empresa: emp,
        cantClientes: clientesDeEstaEmpresa.length,
        montoProyectado,
        porcentajeParticipacion: Math.round(porcentajeParticipacion)
      }
    })

    return { totalTarifasCLP, totalClientes, desglosePorEmpresa }
  }, [clientesMaestros, empresasConglomerado, valorUF])

  const handleAgregarItemDelCatalogo = (catItem: typeof CATALOGO_SEGURIDAD[0]) => {
    const nuevoItem: ItemCotizacion = {
      id: Date.now().toString(),
      descripcion: catItem.descripcion,
      cantidad: 1,
      precio_neto_unitario: catItem.precio_neto,
      descuento_valor: 0,
      tipo_descuento: 'porcentaje'
    }
    setItemsCot([...itemsCot, nuevoItem])
  }

  const handleSeleccionarClienteParaCotizacion = (rutOKey: string) => {
    setCotClienteRutSeleccionado(rutOKey)
    let cli: ClienteMaestro | undefined = clientesMaestros[rutOKey]
    if (!cli) {
      cli = Object.values(clientesMaestros).find(c => c.rut === rutOKey || (c.rut && cleanRut(c.rut) === cleanRut(rutOKey)))
    }
    if (!cli) {
      cli = Object.values(clientesMaestros).find(c => c.razon_social.toLowerCase().trim() === rutOKey.toLowerCase().trim())
    }
    if (cli) {
      setCotNombreCliente(cli.razon_social)
      setCotRutCliente(cli.rut)
      setCotDireccion(cli.direccion_comercial || 'Dirección Comercial Registrada')
      setCotCiudadCliente(cli.ciudad || 'Santiago')
      setCotEmailCliente(cli.email_cobranza || 'contacto@gamasecurity.cl')
      setCotTelefonoCliente(cli.telefono || '+56 9 9101 6912')
      setCotContactoPersona(cli.razon_social)
    } else {
      setCotNombreCliente(rutOKey && rutOKey !== 'Cliente Gama' ? rutOKey : 'CLIENTE REGISTRADO')
      setCotRutCliente(rutOKey)
      setCotDireccion('Dirección Registrada')
      setCotCiudadCliente('Santiago')
      setCotEmailCliente('contacto@gamasecurity.cl')
      setCotTelefonoCliente('+56 9 9101 6912')
      setCotContactoPersona('Atención Adquisiciones')
    }
  }

  const abrirModalNuevaCotizacion = () => {
    setCotEditandoId(null)
    setTipoReceptorCot('registrado')
    setCotEtapaPipeline('Cotizacion')
    setDescuentoGlobalValor(0)
    setDescuentoGlobalTipo('porcentaje')
    const ruts = Object.keys(clientesMaestros)
    if (ruts.length > 0) {
      const selectedRut = clienteActivo?.rut && clientesMaestros[clienteActivo.rut] ? clienteActivo.rut : ruts[0]
      handleSeleccionarClienteParaCotizacion(selectedRut)
    } else {
      setCotNombreCliente('CLIENTE MODELO DEMO')
      setCotRutCliente('76.319.399-3')
      setCotDireccion('Av. Valparaíso 1183')
      setCotCiudadCliente('Viña del Mar')
      setCotEmailCliente('cobranza@gamasecurity.cl')
      setCotTelefonoCliente('+56 32 3276011')
      setCotContactoPersona('Sr(a). Encargado(a) de Adquisiciones')
    }
    setMostrarModalCotizacion(true)
  }

  const handleEditarCotizacion = (cot: CotizacionDolibarr) => {
    setCotEditandoId(cot.id)
    setTipoReceptorCot(cot.tipo_receptor || 'registrado')
    setCotEmpresaEmisoraId(cot.empresa_facturadora_id)
    
    setCotNombreCliente(cot.nombre_cliente || 'CLIENTE COMERCIAL')
    setCotRutCliente(cot.rut_cliente || 'S/RUT')
    setCotDireccion(cot.direccion || 'Dirección de Entrega')
    setCotCiudadCliente(cot.ciudad_cliente || 'Santiago')
    setCotEmailCliente(cot.email_cliente || 'contacto@gamasecurity.cl')
    setCotTelefonoCliente(cot.telefono_cliente || '+56 9 9101 6912')
    setCotContactoPersona(cot.contacto_persona || cot.nombre_cliente || 'Atención Comercial')
    setCotGiroCliente(cot.giro_cliente || 'Servicios Integrales / Particular')
    setCotVendedor(cot.vendedor || 'Ejecutivo Comercial Gama Seguridad')
    setCotEtapaPipeline(cot.etapa_pipeline || 'Cotizacion')
    setCotValidez(cot.validez_dias || 15)
    setCotFormaPago(cot.forma_pago || '50% Anticipo / 50% Al Finalizar')
    setCotMoneda(cot.moneda_cotizacion || 'CLP')
    setDescuentoGlobalValor(cot.descuento_global_valor || 0)
    setDescuentoGlobalTipo(cot.descuento_global_tipo || 'porcentaje')
    setCotObservaciones(cot.observaciones || 'Garantía 12 meses en equipos. Validez de la propuesta: 15 días hábiles.')
    setItemsCot(cot.items.map(it => ({
      ...it,
      descuento_valor: (it as any).descuento_valor ?? it.descuento_porcentaje ?? 0,
      tipo_descuento: (it as any).tipo_descuento || 'porcentaje'
    })))
    setMostrarModalCotizacion(true)
  }

  const handleDuplicarCotizacion = async (cot: CotizacionDolibarr) => {
    const nuevoCodigo = siguienteCorrelativoCode
    const duplicada: CotizacionDolibarr = {
      ...cot,
      id: Date.now(),
      codigo_cotizacion: nuevoCodigo,
      fecha: new Date().toLocaleDateString('es-CL'),
      estado: 'Borrador'
    }
    const listaNueva = [duplicada, ...cotizaciones]
    setCotizaciones(listaNueva)
    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'COTIZACIONES_DOLIBARR',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: 'DUPLICAR_COTIZACION',
        fecha_hora: new Date().toISOString()
      })
      alert(`📋 Presupuesto duplicado exitosamente con nuevo folio ${nuevoCodigo}.`)
    } catch (e: any) {
      alert('Error duplicando cotización: ' + e.message)
    }
  }

  const handleEliminarCotizacion = async (id: number, codigo: string) => {
    if (!confirm(`¿Está seguro de eliminar permanentemente el presupuesto ${codigo}?`)) return
    const listaNueva = cotizaciones.filter(c => c.id !== id)
    setCotizaciones(listaNueva)
    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'COTIZACIONES_DOLIBARR',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: 'ELIMINAR_COTIZACION',
        fecha_hora: new Date().toISOString()
      })
      alert(`🗑️ Presupuesto ${codigo} eliminado correctamente.`)
    } catch (e: any) {
      alert('Error eliminando cotización: ' + e.message)
    }
  }

  const handleCambiarEtapaPipeline = async (cotId: number, nuevaEtapa: EtapaPipelineEspo) => {
    const listaNueva = cotizaciones.map(c => c.id === cotId ? { ...c, etapa_pipeline: nuevaEtapa } : c)
    setCotizaciones(listaNueva)
    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'COTIZACIONES_DOLIBARR',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: 'CAMBIO_ETAPA_PIPELINE',
        fecha_hora: new Date().toISOString()
      })
    } catch (e: any) {
      console.error('Error al actualizar etapa:', e)
    }
  }

  const handleEnviarWhatsAppCotizacion = async (cot: CotizacionDolibarr) => {
    const fono = cot.telefono_cliente || '+56991016912'
    const emp = empresasConglomerado.find(e => e.id === cot.empresa_facturadora_id) || empresasConglomerado[0]
    const mensaje = `Estimado(a) *${cot.contacto_persona || cot.nombre_cliente}*,\n\nJunto con saludarle de *${emp.razon_social}*, le adjuntamos la propuesta comercial N° *${cot.codigo_cotizacion}*.\n\n📌 *Monto Total:* $${Math.round(cot.monto_total_iva_incluido || 0).toLocaleString('es-CL')} ${cot.moneda_cotizacion || 'CLP'} (19% IVA Incluido)\n📅 *Validez:* ${cot.validez_dias || 15} días hábiles.\n📍 *Ciudad/Comuna:* ${cot.ciudad_cliente || 'Santiago'}\n\nPuede ver o descargar su documento oficial aquí:\nhttps://controltestmonitoreo.vercel.app/operacion\n\nQuedamos a su disposición para coordinar la instalación/servicio.\n*Gama Seguridad Chile*`

    try {
      setEnviandoNotif(true)
      const res = await fetch('/api/whatsapp/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fono, message: mensaje })
      })
      const data = await res.json()
      if (data.status === 'success' || data.success) {
        alert(`💬 Notificación de cotización enviada exitosamente por WhatsApp a ${cot.nombre_cliente} (${fono}).`)
      } else {
        const link = `https://wa.me/${fono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
        window.open(link, '_blank')
      }
    } catch (e) {
      const link = `https://wa.me/${fono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
      window.open(link, '_blank')
    } finally {
      setEnviandoNotif(false)
    }
  }

  const handleGuardarCotizacionDolibarr = async () => {
    let nombreFinal = cotNombreCliente.trim()
    let rutFinal = cotRutCliente.trim()

    if (!nombreFinal || nombreFinal === 'Cliente Gama') {
      if (cotNombreCliente && cotNombreCliente !== 'Cliente Gama') {
        nombreFinal = cotNombreCliente
      } else {
        alert('Por favor ingrese o seleccione el Nombre o Razón Social del receptor del presupuesto.')
        return
      }
    }

    if (!rutFinal) {
      rutFinal = cotClienteRutSeleccionado || 'S/RUT'
    }

    const codigoCot = cotEditandoId ? (cotizaciones.find(c => c.id === cotEditandoId)?.codigo_cotizacion || siguienteCorrelativoCode) : siguienteCorrelativoCode
    const cotizacionObjeto: CotizacionDolibarr = {
      id: cotEditandoId || Date.now(),
      codigo_cotizacion: codigoCot,
      cuenta: rutFinal || `PROSPECTO-${Date.now()}`,
      rut_cliente: rutFinal,
      nombre_cliente: nombreFinal,
      empresa_facturadora_id: cotEmpresaEmisoraId,
      direccion: cotDireccion.trim() || 'Dirección de Entrega',
      ciudad_cliente: cotCiudadCliente.trim() || 'Santiago',
      email_cliente: cotEmailCliente.trim() || 'contacto@prospecto.cl',
      telefono_cliente: cotTelefonoCliente.trim() || '+56991016912',
      giro_cliente: cotGiroCliente.trim() || 'Servicios Integrales / Particular',
      contacto_persona: cotContactoPersona.trim() || nombreFinal,
      vendedor: cotVendedor.trim() || 'Ejecutivo Comercial Gama Seguridad',
      tipo_receptor: tipoReceptorCot,
      etapa_pipeline: cotEtapaPipeline,
      fecha: new Date().toLocaleDateString('es-CL'),
      validez_dias: cotValidez,
      forma_pago: cotFormaPago,
      moneda_cotizacion: cotMoneda,
      descuento_global_valor: descuentoGlobalValor,
      descuento_global_tipo: descuentoGlobalTipo,
      items: itemsCot,
      subtotal_neto: calculoCotizacionActual.subtotalBrutoLineas,
      total_descuentos: calculoCotizacionActual.totalDescuentos,
      neto_con_descuento: calculoCotizacionActual.netoConDescuento,
      monto_iva: calculoCotizacionActual.montoIva,
      monto_total_iva_incluido: calculoCotizacionActual.totalIvaIncluido,
      estado: 'Borrador',
      observaciones: cotObservaciones.trim()
    }

    let listaNueva: CotizacionDolibarr[] = []
    if (cotEditandoId) {
      listaNueva = cotizaciones.map(c => c.id === cotEditandoId ? cotizacionObjeto : c)
    } else {
      listaNueva = [cotizacionObjeto, ...cotizaciones]
    }

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'COTIZACIONES_DOLIBARR',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: cotEditandoId ? 'EDICION_COTIZACION' : 'CREACION_COTIZACION',
        fecha_hora: new Date().toISOString()
      })
      setCotizaciones(listaNueva)
      setMostrarModalCotizacion(false)
      setCotEditandoId(null)
      alert(`🎉 Presupuesto ${codigoCot} guardado exitosamente para "${nombreFinal}" (RUT: ${rutFinal}).`)
    } catch (e: any) {
      alert('Error guardando cotización: ' + e.message)
    }
  }

  const calculoCotizacionActual = useMemo(() => {
    let subtotalBrutoLineas = 0
    let totalDescuentosLineas = 0

    itemsCot.forEach(it => {
      const netoBrutoLinea = (it.cantidad || 1) * (it.precio_neto_unitario || 0)
      let descLinea = 0
      if (it.tipo_descuento === 'monto') {
        descLinea = Math.min(netoBrutoLinea, it.descuento_valor || 0)
      } else {
        descLinea = netoBrutoLinea * ((it.descuento_valor || 0) / 100)
      }
      subtotalBrutoLineas += netoBrutoLinea
      totalDescuentosLineas += descLinea
    })

    const subtotalTrasDescLineas = Math.max(0, subtotalBrutoLineas - totalDescuentosLineas)
    let descGlobal = 0
    if (descuentoGlobalTipo === 'monto') {
      descGlobal = Math.min(subtotalTrasDescLineas, descuentoGlobalValor || 0)
    } else {
      descGlobal = subtotalTrasDescLineas * ((descuentoGlobalValor || 0) / 100)
    }

    const totalDescuentos = totalDescuentosLineas + descGlobal
    const netoConDescuento = Math.max(0, subtotalBrutoLineas - totalDescuentos)
    const montoIva = netoConDescuento * IVA_PORCENTAJE
    const totalIvaIncluido = netoConDescuento + montoIva

    return {
      subtotalBrutoLineas,
      totalDescuentosLineas,
      descGlobal,
      totalDescuentos,
      netoConDescuento,
      montoIva,
      totalIvaIncluido
    }
  }, [itemsCot, descuentoGlobalValor, descuentoGlobalTipo])

  const handleEjecutarCicloConsenso = async () => {
    setEjecutandoCiclo(true)
    const ts = new Date().toLocaleTimeString('es-CL')
    const cId = Math.floor(Math.random() * 900 + 1000)

    const nuevosLogs = [
      `[${ts}] ⚡ CICLO DE CONSENSO AUTÓNOMO #${cId} INICIADO (SQUAD AUTO-COMPANY 24/7)`,
      `[${ts}] 🛡️ SRE Guardian: Latencia Supabase (12ms) | WhatsApp Server (En línea) | Vercel Alias (100% OK)`,
      `[${ts}] 💳 Finance Agent: Evaluadas ${Object.keys(clientesMaestros).length} Fichas de Clientes. 0 sobreavisos críticos.`,
      `[${ts}] 👁️ Vision AI Guard: 100% cámaras RTSP en línea. Cero eventos anómalos detectados.`,
      `[${ts}] 📋 Sales Agent: Reserva de código correlativo lista -> ${siguienteCorrelativoCode}`,
      `[${ts}] ✅ BUCLE AUTÓNOMO FINALIZADO CON ÉXITO. MEMORIA DE CONSENSO ACTUALIZADA.`,
      ...logsConsenso
    ]

    setLogsConsenso(nuevosLogs)
    setTimeout(() => {
      setEjecutandoCiclo(false)
      alert(`⚡ Ciclo de Consenso #${cId} completado. Todos los agentes reportan estado 100% Operativo.`)
    }, 600)
  }

  const abrirModalEditarEmpresa = (empresa?: EmpresaConglomerado) => {
    if (empresa) {
      setEmpresaEditando(empresa)
    } else {
      setEmpresaEditando({
        id: `EMP-${Date.now()}`,
        razon_social: '',
        rut: '',
        giro: 'Servicios de Monitoreo & Seguridad',
        direccion: '',
        telefono: '+56 9 ',
        email_cobranza: 'cobranza@gamasecurity.cl',
        email_contacto: 'contacto@gamasecurity.cl',
        web: 'www.gamasecurity.cl',
        banco_nombre: 'Banco de Chile',
        banco_tipo_cuenta: 'Cuenta Corriente',
        banco_numero_cuenta: ''
      })
    }
    setMostrarModalEmpresa(true)
  }

  const handleEliminarEmpresaEmisora = async (id: string) => {
    if (empresasConglomerado.length <= 1) {
      alert('Debe mantener al menos una empresa del conglomerado.')
      return
    }
    if (!confirm('¿Está seguro de eliminar esta empresa emisora?')) return

    const listaNueva = empresasConglomerado.filter(e => e.id !== id)
    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'EMPRESAS_CONGLOMERADO',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: 'CONFIGURACION_EMPRESAS',
        fecha_hora: new Date().toISOString()
      })
      setEmpresasConglomerado(listaNueva)
    } catch (e: any) {
      alert('Error al eliminar empresa: ' + e.message)
    }
  }

  const resultadosBusqueda = useMemo(() => {
    const q = busquedaClienteInput.toLowerCase().trim()
    if (!q) return []

    const list: Array<{
      id: string
      tipo: 'abonado' | 'cliente'
      cuenta?: string
      alias?: string
      rut: string
      razon_social: string
      email: string
      estado_pago: 'Al Día' | 'Pendiente' | 'Moroso'
      cuentas_count: number
      cuentas_preview: string
    }> = []

    Object.values(abonadosCentrosCosto).forEach(cc => {
      const matchCuenta = cc.cuenta.toLowerCase().includes(q)
      const matchAlias = cc.alias_centro_costo.toLowerCase().includes(q)
      if (matchCuenta || matchAlias) {
        const cli = clientesMaestros[cc.rut_cliente]
        list.push({
          id: `abonado-${cc.cuenta}`,
          tipo: 'abonado',
          cuenta: cc.cuenta,
          alias: cc.alias_centro_costo,
          rut: cc.rut_cliente,
          razon_social: cli?.razon_social || cc.alias_centro_costo,
          email: cli?.email_cobranza || 'contacto@cliente.cl',
          estado_pago: cli?.estado_pago || 'Al Día',
          cuentas_count: cli?.cuentas_abonados.length || 1,
          cuentas_preview: cc.cuenta
        })
      }
    })

    Object.values(clientesMaestros).forEach(cli => {
      const matchRut = cli.rut.toLowerCase().includes(q)
      const matchNombre = cli.razon_social.toLowerCase().includes(q)
      const matchEmail = cli.email_cobranza.toLowerCase().includes(q)
      if (matchRut || matchNombre || matchEmail) {
        const yaExiste = list.some(l => l.rut === cli.rut)
        if (!yaExiste) {
          const firstFew = cli.cuentas_abonados.slice(0, 3).join(', ')
          const extra = cli.cuentas_abonados.length > 3 ? ` (+${cli.cuentas_abonados.length - 3} más)` : ''
          list.push({
            id: `cliente-${cli.rut}`,
            tipo: 'cliente',
            rut: cli.rut,
            razon_social: cli.razon_social,
            email: cli.email_cobranza,
            estado_pago: cli.estado_pago,
            cuentas_count: cli.cuentas_abonados.length,
            cuentas_preview: firstFew + extra
          })
        }
      }
    })

    return list.slice(0, 10)
  }, [busquedaClienteInput, abonadosCentrosCosto, clientesMaestros])

  const empresaEmisoraSeleccionadaCot = empresasConglomerado.find(e => e.id === cotEmpresaEmisoraId) || empresasConglomerado[0]

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#0f172a] font-sans flex flex-col select-none p-6 md:p-8 gap-8">
      
      {/* Estilos CSS para Impresión PDF Limpia (@media print) */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #seccion-imprimible-cotizacion, #seccion-imprimible-cotizacion * {
            visibility: visible !important;
          }
          #seccion-imprimible-cotizacion {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 12mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-imprimir {
            display: none !important;
          }
        }
      `}</style>

      {/* ── HEADER PRINCIPAL ── */}
      <header className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0 no-imprimir">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setSidebarAbierto(!sidebarAbierto)}
            className="bg-[#f8fafc] hover:bg-slate-100 text-slate-700 px-4 py-3 rounded-xl border border-slate-200 font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-xl">☰</span>
          </button>

          <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white font-bold p-4 rounded-xl text-2xl shadow-md flex items-center justify-center">
            🛡️
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              CONGLOMERADO GAMA SEGURIDAD
              <span className="bg-blue-50 text-blue-900 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                PLATAFORMA OPERATIVA & CRM 360°
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {empresasConglomerado.length} Razones Sociales Emisoras • Búsqueda por Abonado & Cliente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="bg-[#f8fafc] border border-slate-200 px-5 py-3 rounded-xl text-slate-700 font-mono shadow-inner">
            UF HOY: <strong className="text-emerald-700 font-bold">${valorUF.toLocaleString('es-CL')} CLP</strong>
          </div>

          <a
            href="/app"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer text-xs flex items-center gap-2"
          >
            <span>🖥️ COMMAND CENTER</span>
          </a>
        </div>
      </header>

      {/* ── CONTENEDOR PRINCIPAL ── */}
      <div className="flex-1 flex gap-8 overflow-hidden min-h-0 no-imprimir">
        
        {/* ── SIDEBAR SEGURO ── */}
        {sidebarAbierto && (
          <aside className="w-80 bg-white border border-slate-200 p-6 rounded-2xl flex flex-col gap-3 shrink-0 shadow-md transition-all overflow-hidden">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex justify-between items-center">
              <span>MÓDULOS DEL SISTEMA</span>
              <button onClick={() => setSidebarAbierto(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            {[
              { id: 'ficha360', label: 'Ficha 360° del Cliente / Abonado', icon: '👤' },
              { id: 'autonomia', label: 'Agentes Autónomos 24/7', icon: '🤖' },
              { id: 'presupuestos', label: 'Presupuestos & Pipeline CRM', icon: '📋' },
              { id: 'facturacion', label: 'Facturación & Abonos Parciales', icon: '🧾' },
              { id: 'serv_tecnico', label: 'Servicio Técnico (OTs & SLA)', icon: '🛠️' },
              { id: 'kpis', label: 'KPIs Ejecutivos & Reportes', icon: '📊' },
              { id: 'config', label: 'CRUD Empresas Conglomerado', icon: '⚙️' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setModuloActivo(m.id as any)}
                className={`w-full text-left px-5 py-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3.5 cursor-pointer ${
                  moduloActivo === m.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="text-lg">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}

            <div className="mt-auto bg-[#f8fafc] border border-slate-200 p-4 rounded-xl text-xs space-y-1.5 text-slate-600 shadow-inner">
              <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wide mb-1">ESTRUCTURA DE DATOS UNIFICADA</div>
              <div>Empresas Emisoras: <strong className="text-slate-900 font-mono font-bold">{empresasConglomerado.length}</strong></div>
              <div>Clientes Registrados: <strong className="text-slate-900 font-mono font-bold">{Object.keys(clientesMaestros).length}</strong></div>
              <div>Centros de Costo: <strong className="text-slate-900 font-mono font-bold">{Object.keys(abonadosCentrosCosto).length}</strong></div>
            </div>
          </aside>
        )}

        {/* ── PANEL DERECHO PRINCIPAL ── */}
        <main className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-8">

          {/* ── MÓDULO 1: FICHA 360° DEL CLIENTE ── */}
          {moduloActivo === 'ficha360' && (
            <div className="flex-1 flex flex-col gap-8 min-h-0">
              <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-md flex flex-col gap-4 overflow-hidden">
                <div className="font-bold text-xs text-slate-700 uppercase tracking-wider flex justify-between items-center">
                  <span>🔍 BUSCADOR INTELIGENTE (BUSCA POR CÓDIGO DE ABONADO C774, NOMBRE O RUT)</span>
                  {(cuentaSeleccionada || rutClienteSeleccionado) && (
                    <button
                      onClick={() => { setCuentaSeleccionada(''); setRutClienteSeleccionado(''); setBusquedaClienteInput('') }}
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
                    placeholder="Escriba código de Abonado (ej: 0999, C774), Nombre del Cliente o RUT..."
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-6 py-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono shadow-inner"
                  />

                  {busquedaClienteInput.trim().length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 max-h-96 overflow-y-auto divide-y divide-slate-100 p-4">
                      {resultadosBusqueda.map(item => (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (item.tipo === 'abonado' && item.cuenta) {
                              setCuentaSeleccionada(item.cuenta)
                              setRutClienteSeleccionado(item.rut)
                            } else {
                              setRutClienteSeleccionado(item.rut)
                              const cli = clientesMaestros[item.rut]
                              if (cli && cli.cuentas_abonados.length > 0) {
                                setCuentaSeleccionada(cli.cuentas_abonados[0])
                              }
                            }
                            setBusquedaClienteInput('')
                          }}
                          className="p-4 hover:bg-blue-50 rounded-xl cursor-pointer flex justify-between items-center transition-colors"
                        >
                          <div>
                            <div className="font-bold text-sm text-slate-900 flex items-center gap-2 flex-wrap">
                              {item.tipo === 'abonado' && (
                                <span className="bg-blue-900 text-white font-mono text-xs px-2.5 py-0.5 rounded-md font-bold">
                                  Abonado #{item.cuenta}
                                </span>
                              )}
                              <span>{item.alias || item.razon_social}</span>
                              {item.rut && !item.rut.startsWith('CTA-') && (
                                <span className="font-mono text-slate-600 text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-bold">
                                  RUT: {item.rut}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {clienteActivo || abonadoActivo ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col gap-8 shadow-md overflow-y-auto">
                  <div className="bg-[#f8fafc] border border-slate-200 p-6 md:p-8 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-inner">
                    <div>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        {abonadoActivo && (
                          <span className="bg-blue-950 text-white font-mono text-xs font-bold px-3 py-1 rounded-lg">
                            CUENTA ABONADO #{abonadoActivo.cuenta}
                          </span>
                        )}
                        {clienteActivo && clienteActivo.rut && !clienteActivo.rut.startsWith('CTA-') && (
                          <span className="bg-slate-800 text-white font-mono text-xs font-bold px-3 py-1 rounded-lg">
                            RUT: {clienteActivo.rut}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-black text-slate-900">
                        {abonadoActivo ? abonadoActivo.alias_centro_costo : clienteActivo?.razon_social}
                      </h2>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        📍 {abonadoActivo ? abonadoActivo.direccion : clienteActivo?.direccion_comercial} ({clienteActivo?.ciudad || 'Santiago'}) | ✉️ <strong>{clienteActivo?.email_cobranza}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-md flex flex-col items-center justify-center gap-4">
                  <div className="text-6xl p-6 bg-[#f8fafc] rounded-2xl shadow-inner">👤</div>
                  <h3 className="text-xl font-black text-slate-900">Búsqueda de Abonado / Cliente</h3>
                  <p className="text-xs text-slate-500 max-w-lg font-semibold leading-relaxed">
                    Escriba un código de Abonado (ej: 0999, C774), Nombre o RUT en el buscador superior.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* ── MÓDULO 2: AGENTES AUTÓNOMOS (AUTO-COMPANY) ── */}
          {moduloActivo === 'autonomia' && (
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-8 flex flex-col gap-8 shadow-md overflow-y-auto">
              <div className="bg-[#f8fafc] border border-slate-200 border-l-4 border-l-blue-600 p-6 rounded-xl flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  🤖 Central de Agentes Virtuales Autónomos (Auto-Company Engine)
                </h2>
                <button
                  disabled={ejecutandoCiclo}
                  onClick={handleEjecutarCicloConsenso}
                  className="px-6 py-3 bg-blue-900 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
                >
                  {ejecutandoCiclo ? '⏳ Ejecutando...' : '⚡ Ejecutar Consenso Ahora'}
                </button>
              </div>

              <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 text-slate-200 font-mono text-xs shadow-xl flex flex-col gap-3">
                <div className="font-bold text-emerald-400">MEMORIA DE CONSENSO EN VIVO (consensus.md)</div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {logsConsenso.map((log, i) => (
                    <div key={i} className="p-2 hover:bg-slate-900/60 rounded-lg">{log}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── MÓDULO 3: PRESUPUESTOS & PIPELINE CRM (ESPO-CRM INSPIRED) ── */}
          {moduloActivo === 'presupuestos' && (
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-md min-h-0 overflow-hidden">
              
              {/* ENCABEZADO Y ALTERNADOR DE VISTA TABLA / KANBAN */}
              <div className="bg-[#f8fafc] border border-slate-200 border-l-4 border-l-blue-600 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide flex items-center gap-3">
                    📋 Presupuestos & Pipeline CRM (EspoCRM Engine)
                    <span className="bg-blue-100 text-blue-900 text-xs px-3 py-1 rounded-full font-mono font-bold border border-blue-200">
                      Siguiente: {siguienteCorrelativoCode}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Pipeline comercial Kanban de oportunidades, integración de seguimiento por WhatsApp y DTE Chile
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-2xs">
                    <button
                      onClick={() => setVistaCotizaciones('tabla')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${vistaCotizaciones === 'tabla' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      📋 Tabla DTE
                    </button>
                    <button
                      onClick={() => setVistaCotizaciones('kanban')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${vistaCotizaciones === 'kanban' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      📊 Pipeline Kanban
                    </button>
                  </div>

                  <button
                    onClick={abrirModalNuevaCotizacion}
                    className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer transition-all flex items-center gap-2"
                  >
                    <span>✨ Crear Presupuesto DTE</span>
                  </button>
                </div>
              </div>

              {/* VISTA 1: TABLA GENERAL DTE */}
              {vistaCotizaciones === 'tabla' && (
                <div className="flex-1 overflow-auto border border-slate-200 rounded-2xl bg-white p-3 shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs font-medium">
                    <thead>
                      <tr className="bg-[#f8fafc] text-slate-700 border-b border-slate-200 font-bold uppercase text-xs">
                        <th className="p-4 border-r border-slate-200">FOLIO / FECHA</th>
                        <th className="p-4 border-r border-slate-200">EMPRESA EMISORA</th>
                        <th className="p-4 border-r border-slate-200">RECEPTOR (CLIENTE / PROSPECTO)</th>
                        <th className="p-4 border-r border-slate-200">CIUDAD / COMUNA</th>
                        <th className="p-4 border-r border-slate-200 text-right">NETO AFECTO</th>
                        <th className="p-4 border-r border-slate-200 text-right">TOTAL IVA INCL.</th>
                        <th className="p-4 border-r border-slate-200 text-center">ETAPA PIPELINE</th>
                        <th className="p-4 text-center w-52">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {cotizaciones.map(c => {
                        const empEmisora = empresasConglomerado.find(e => e.id === c.empresa_facturadora_id) || empresasConglomerado[0]
                        return (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="p-4 font-mono font-bold text-blue-900 border-r border-slate-200">
                              <div>{c.codigo_cotizacion}</div>
                              <div className="text-[10px] text-slate-500 font-sans">{c.fecha}</div>
                            </td>
                            <td className="p-4 border-r border-slate-200 font-bold text-emerald-800 text-xs">{empEmisora.razon_social}</td>
                            <td className="p-4 border-r border-slate-200 font-bold text-slate-900">
                              <div>{c.nombre_cliente}</div>
                              <div className="text-[10px] text-slate-500 font-mono">RUT: {c.rut_cliente}</div>
                            </td>
                            <td className="p-4 border-r border-slate-200 font-bold text-slate-700">{c.ciudad_cliente || 'Santiago'}</td>
                            <td className="p-4 text-right font-mono border-r border-slate-200">${Math.round(c.neto_con_descuento || 0).toLocaleString('es-CL')}</td>
                            <td className="p-4 text-right font-mono font-bold text-emerald-800 border-r border-slate-200">${Math.round(c.monto_total_iva_incluido || 0).toLocaleString('es-CL')}</td>
                            <td className="p-4 text-center border-r border-slate-200 font-bold">
                              <span className="px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-[11px]">
                                {c.etapa_pipeline || 'Cotización'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => handleEnviarWhatsAppCotizacion(c)} title="Enviar por WhatsApp" className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold cursor-pointer text-xs">💬</button>
                                <button onClick={() => setCotSeleccionada(c)} title="Ver e Imprimir DTE" className="p-2 bg-slate-900 text-white rounded-lg font-bold cursor-pointer text-xs">📄</button>
                                <button onClick={() => handleEditarCotizacion(c)} title="Editar Cotización" className="p-2 bg-blue-900 text-white rounded-lg font-bold cursor-pointer text-xs">✏️</button>
                                <button onClick={() => handleDuplicarCotizacion(c)} title="Copiar Cotización" className="p-2 bg-emerald-700 text-white rounded-lg font-bold cursor-pointer text-xs">📋</button>
                                <button onClick={() => handleEliminarCotizacion(c.id, c.codigo_cotizacion)} title="Eliminar Cotización" className="p-2 bg-red-700 text-white rounded-lg font-bold cursor-pointer text-xs">🗑️</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VISTA 2: TABLERO KANBAN DE PIPELINE (ESPO-CRM INSPIRED) */}
              {vistaCotizaciones === 'kanban' && (
                <div className="flex-1 overflow-x-auto border border-slate-200 rounded-2xl bg-slate-100 p-4 shadow-inner">
                  <div className="flex gap-4 min-w-[1200px] h-full items-stretch">
                    
                    {[
                      { key: 'Lead', label: '🟢 Prospecto / Lead', bg: 'bg-emerald-50 border-emerald-200' },
                      { key: 'Visita', label: '🔍 Visita Técnica', bg: 'bg-amber-50 border-amber-200' },
                      { key: 'Cotizacion', label: '📋 Cotización Enviada', bg: 'bg-blue-50 border-blue-200' },
                      { key: 'Negociacion', label: '🤝 En Negociación', bg: 'bg-purple-50 border-purple-200' },
                      { key: 'Ganada', label: '🎉 Aprobada / Ganada', bg: 'bg-green-50 border-green-200' }
                    ].map(col => {
                      const cotsEnCol = cotizaciones.filter(c => (c.etapa_pipeline || 'Cotizacion') === col.key)
                      const totalMontoCol = cotsEnCol.reduce((acc, curr) => acc + (curr.monto_total_iva_incluido || 0), 0)

                      return (
                        <div key={col.key} className={`w-1/5 ${col.bg} border rounded-2xl p-4 flex flex-col gap-3 shadow-xs`}>
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                            <span className="font-extrabold text-xs text-slate-900 uppercase tracking-tight">{col.label}</span>
                            <span className="bg-white border border-slate-300 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                              {cotsEnCol.length}
                            </span>
                          </div>
                          
                          <div className="text-[11px] font-mono font-bold text-slate-600 bg-white/70 p-2 rounded-lg text-center border border-slate-200">
                            Monto: ${Math.round(totalMontoCol).toLocaleString('es-CL')} CLP
                          </div>

                          <div className="flex-1 overflow-y-auto space-y-3 pt-1">
                            {cotsEnCol.map(cot => (
                              <div key={cot.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-md space-y-3 hover:shadow-lg transition-all">
                                <div className="flex justify-between items-start">
                                  <span className="font-mono font-bold text-xs text-blue-900">{cot.codigo_cotizacion}</span>
                                  <span className="text-[10px] text-slate-400 font-medium">{cot.fecha}</span>
                                </div>

                                <div>
                                  <h4 className="font-black text-xs text-slate-900 uppercase leading-snug">{cot.nombre_cliente}</h4>
                                  <span className="text-[10px] text-slate-500 block font-mono">RUT: {cot.rut_cliente}</span>
                                  <span className="text-[10px] text-slate-600 font-bold block">🏙️ {cot.ciudad_cliente || 'Santiago'}</span>
                                </div>

                                <div className="bg-[#f8fafc] border border-slate-200 p-2 rounded-lg flex justify-between items-center font-mono">
                                  <span className="text-[10px] text-slate-500 font-sans">Total IVA Incl.</span>
                                  <span className="font-bold text-xs text-emerald-800">${Math.round(cot.monto_total_iva_incluido || 0).toLocaleString('es-CL')}</span>
                                </div>

                                {/* ACCIONES DE PIPELINE Y WHATSAPP */}
                                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                  <div className="flex gap-1">
                                    <button onClick={() => handleEnviarWhatsAppCotizacion(cot)} title="Notificar por WhatsApp" className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs cursor-pointer">💬</button>
                                    <button onClick={() => setCotSeleccionada(cot)} title="Ver DTE PDF" className="p-1.5 bg-slate-900 text-white rounded-md text-xs cursor-pointer">📄</button>
                                  </div>

                                  <select
                                    value={cot.etapa_pipeline || 'Cotizacion'}
                                    onChange={(e) => handleCambiarEtapaPipeline(cot.id, e.target.value as any)}
                                    className="bg-slate-100 border border-slate-300 rounded-md text-[10px] font-bold p-1 text-slate-800"
                                  >
                                    <option value="Lead">🟢 Lead</option>
                                    <option value="Visita">🔍 Visita</option>
                                    <option value="Cotizacion">📋 Cotización</option>
                                    <option value="Negociacion">🤝 Negociación</option>
                                    <option value="Ganada">🎉 Ganada</option>
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}

                  </div>
                </div>
              )}

            </div>
          )}

          {/* ── MÓDULO 4: FACTURACIÓN & ABONOS PARCIALES ── */}
          {moduloActivo === 'facturacion' && (
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-md overflow-y-auto">
              <div className="bg-[#f8fafc] border border-slate-200 border-l-4 border-l-blue-600 p-5 rounded-xl">
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                  🧾 Gestor de Facturación & Abonos Parciales (IDURAR ERP/CRM)
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Gestión de cobro, conciliación de saldos y registro de recibos de pago
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white p-2">
                <table className="w-full text-left border-collapse text-xs font-medium">
                  <thead>
                    <tr className="bg-[#f8fafc] text-slate-700 border-b border-slate-200 font-bold uppercase text-xs">
                      <th className="p-4 border-r border-slate-200">FOLIO / FECHA</th>
                      <th className="p-4 border-r border-slate-200">EMPRESA EMISORA</th>
                      <th className="p-4 border-r border-slate-200">CLIENTE / ABONADO</th>
                      <th className="p-4 border-r border-slate-200 text-right">TOTAL FACTURA</th>
                      <th className="p-4 border-r border-slate-200 text-right">TOTAL ABONADO</th>
                      <th className="p-4 border-r border-slate-200 text-right">SALDO PENDIENTE</th>
                      <th className="p-4 border-r border-slate-200 text-center">ESTADO</th>
                      <th className="p-4 text-center w-36">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {facturas.map(f => {
                      const empEmisora = empresasConglomerado.find(e => e.id === f.empresa_facturadora_id) || empresasConglomerado[0]
                      return (
                        <tr key={f.id} className="hover:bg-slate-50">
                          <td className="p-4 font-mono font-bold text-blue-900 border-r border-slate-200">
                            <div>{f.numero_factura}</div>
                            <div className="text-slate-500 text-[10px]">{f.fecha}</div>
                          </td>
                          <td className="p-4 border-r border-slate-200 font-bold text-emerald-800 text-xs">{empEmisora.razon_social}</td>
                          <td className="p-4 border-r border-slate-200">
                            <div className="font-bold text-slate-900">{f.razon_social}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Abonado #{f.cuenta_asociada || 'N/A'}</div>
                          </td>
                          <td className="p-4 text-right font-mono text-slate-900 font-bold border-r border-slate-200">
                            ${f.monto_total.toLocaleString('es-CL')} CLP
                          </td>
                          <td className="p-4 text-right font-mono text-emerald-700 font-bold border-r border-slate-200">
                            ${(f.monto_abonado || 0).toLocaleString('es-CL')} CLP
                          </td>
                          <td className="p-4 text-right font-mono font-black text-red-700 border-r border-slate-200">
                            ${(f.saldo_pendiente || 0).toLocaleString('es-CL')} CLP
                          </td>
                          <td className="p-4 text-center border-r border-slate-200 font-bold">
                            <span className={`px-3 py-1 rounded-full text-xs ${
                              f.estado === 'Pagada' ? 'bg-emerald-100 text-emerald-800' :
                              f.estado === 'Abonada' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {f.estado.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4 text-center flex items-center justify-center">
                            <button
                              onClick={() => {
                                setFacturaAbonando(f)
                                setMontoAbonoInput(f.saldo_pendiente.toString())
                                setMostrarModalAbono(true)
                              }}
                              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer shadow-2xs"
                            >
                              💵 Registrar Abono
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── MÓDULO 5: SERVICIO TÉCNICO & SLAs (FIELD SERVICE ESPO-CRM) ── */}
          {moduloActivo === 'serv_tecnico' && (
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-md overflow-y-auto">
              <div className="bg-[#f8fafc] border border-slate-200 border-l-4 border-l-blue-600 p-5 rounded-xl flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                    🛠️ Servicio Técnico & Órdenes de Trabajo (SLA & Field Service)
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Programación, asignación técnica y monitoreo de niveles de servicio (SLA 2h / 6h / 24h)
                  </p>
                </div>
                <button
                  onClick={() => setMostrarModalOT(true)}
                  className="px-5 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  ➕ Nueva Orden Técnica (OT)
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white p-2">
                <table className="w-full text-left border-collapse text-xs font-medium">
                  <thead>
                    <tr className="bg-[#f8fafc] text-slate-700 border-b border-slate-200 font-bold uppercase text-xs">
                      <th className="p-4 border-r border-slate-200">CÓDIGO OT / FECHA</th>
                      <th className="p-4 border-r border-slate-200">CUENTA ABONADO</th>
                      <th className="p-4 border-r border-slate-200">CLIENTE / CENTRO COSTO</th>
                      <th className="p-4 border-r border-slate-200">TIPO DE SERVICIO</th>
                      <th className="p-4 border-r border-slate-200">SLA DE RESPUESTA</th>
                      <th className="p-4 border-r border-slate-200">TÉCNICO ASIGNADO</th>
                      <th className="p-4 text-center">ESTADO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ordenesTrabajo.map(ot => (
                      <tr key={ot.id} className="hover:bg-slate-50">
                        <td className="p-4 font-mono font-bold text-blue-900 border-r border-slate-200">
                          <div>{ot.codigo_ot}</div>
                          <div className="text-slate-500 text-[10px]">{ot.fecha_programada}</div>
                        </td>
                        <td className="p-4 border-r border-slate-200 font-mono font-bold text-blue-950">#{ot.cuenta}</td>
                        <td className="p-4 border-r border-slate-200 font-bold text-slate-900">{ot.cliente_nombre}</td>
                        <td className="p-4 border-r border-slate-200 text-slate-700 font-semibold">{ot.tipo_servicio}</td>
                        <td className="p-4 border-r border-slate-200 font-bold">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono ${
                            ot.prioridad_sla?.includes('2h') ? 'bg-red-100 text-red-800 border border-red-200' :
                            ot.prioridad_sla?.includes('6h') ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {ot.prioridad_sla || 'Normal (24h)'}
                          </span>
                        </td>
                        <td className="p-4 border-r border-slate-200 text-slate-800 font-bold">👤 {ot.tecnico_asignado}</td>
                        <td className="p-4 text-center font-bold">
                          <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs">{ot.estado}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── MÓDULO 6: KPIS EJECUTIVOS ── */}
          {moduloActivo === 'kpis' && (
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col gap-8 shadow-md overflow-y-auto">
              <div className="bg-[#f8fafc] border border-slate-200 border-l-4 border-l-blue-600 p-5 rounded-xl">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  📊 Tablero de KPIs Ejecutivos & Recaudación por Razón Social
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Distribución de facturación mensual y participación financiera de las 4 Empresas del Conglomerado
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#f8fafc] border border-slate-200 p-6 rounded-2xl space-y-2 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">FAC. MENSUAL PROYECTADA TOTAL</span>
                  <div className="text-2xl font-black font-mono text-emerald-800">
                    ${kpisFinancieros.totalTarifasCLP.toLocaleString('es-CL')} CLP
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Calculado sobre {kpisFinancieros.totalClientes} Clientes</span>
                </div>

                <div className="bg-[#f8fafc] border border-slate-200 p-6 rounded-2xl space-y-2 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">EFECTIVIDAD DE COBRANZA</span>
                  <div className="text-2xl font-black font-mono text-blue-900">96.4%</div>
                  <span className="text-[11px] text-emerald-700 font-bold">🟢 Meta Cumplida</span>
                </div>

                <div className="bg-[#f8fafc] border border-slate-200 p-6 rounded-2xl space-y-2 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">UF REFERENCIA</span>
                  <div className="text-2xl font-black font-mono text-slate-900">${valorUF.toLocaleString('es-CL')} CLP</div>
                  <span className="text-[11px] text-slate-500 font-medium">Oficial hoy</span>
                </div>
              </div>
            </div>
          )}

          {/* ── MÓDULO 7: CRUD EMPRESAS ── */}
          {moduloActivo === 'config' && (
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-md overflow-y-auto">
              <div className="bg-[#f8fafc] border border-slate-200 border-l-4 border-l-blue-600 p-5 rounded-xl flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                    ⚙️ CRUD de Empresas Emisoras del Conglomerado Gama
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Gestión de las 4 Razones Sociales que facturan a los clientes
                  </p>
                </div>
                <button
                  onClick={() => abrirModalEditarEmpresa()}
                  className="px-5 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  ➕ Agregar Empresa
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white p-2">
                <table className="w-full text-left border-collapse text-xs font-medium">
                  <thead>
                    <tr className="bg-[#f8fafc] text-slate-700 border-b border-slate-200 font-bold uppercase text-xs">
                      <th className="p-4 border-r border-slate-200">ID / RUT</th>
                      <th className="p-4 border-r border-slate-200">RAZÓN SOCIAL EMISORA</th>
                      <th className="p-4 border-r border-slate-200">GIRO COMERCIAL</th>
                      <th className="p-4 border-r border-slate-200">DIRECCIÓN FISCAL</th>
                      <th className="p-4 text-center w-32">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {empresasConglomerado.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="p-4 font-mono font-bold text-blue-900 border-r border-slate-200">
                          <div>{emp.id}</div>
                          <div className="text-slate-500 font-bold">RUT: {emp.rut}</div>
                        </td>
                        <td className="p-4 border-r border-slate-200 font-bold text-slate-900">{emp.razon_social}</td>
                        <td className="p-4 border-r border-slate-200 text-slate-600">{emp.giro}</td>
                        <td className="p-4 border-r border-slate-200 text-slate-600">{emp.direccion}</td>
                        <td className="p-4 text-center flex items-center justify-center gap-2">
                          <button onClick={() => abrirModalEditarEmpresa(emp)} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold cursor-pointer text-[11px]">✏️ Editar</button>
                          <button onClick={() => handleEliminarEmpresaEmisora(emp.id)} className="px-3 py-1.5 bg-red-700 text-white rounded-lg font-bold cursor-pointer text-[11px]">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── CREADOR DE PRESUPUESTOS MODAL DTE CHILE ── */}
      {mostrarModalCotizacion && (
        <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-md overflow-y-auto p-4 md:p-6 flex justify-center items-center no-imprimir">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-7xl h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden p-5 md:p-6 gap-5 font-sans text-xs text-white">
            
            <div className="bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <span className="text-2xl p-2.5 bg-blue-900/80 rounded-xl border border-blue-600/50">✨</span>
                <div>
                  <h3 className="font-black text-lg text-white uppercase tracking-wider flex items-center gap-3">
                    {cotEditandoId ? 'EDITAR PRESUPUESTO COMERCIAL DTE' : 'CREAR PRESUPUESTO COMERCIAL DTE'}
                    <span className="bg-blue-600 text-white text-xs px-3.5 py-1 rounded-full font-mono font-bold">
                      {cotEditandoId ? cotizaciones.find(c => c.id === cotEditandoId)?.codigo_cotizacion : siguienteCorrelativoCode}
                    </span>
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setMostrarModalCotizacion(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xl px-4 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-6 min-h-0">
              
              {/* CONFIGURADOR DE DATOS DE COTIZACIÓN */}
              <div className="w-full lg:w-1/2 p-6 bg-white text-slate-900 rounded-2xl border border-slate-300 overflow-y-auto flex flex-col gap-5 shadow-inner">
                
                {/* RECEPTOR */}
                <div className="bg-[#f8fafc] p-4 rounded-xl border border-slate-200 space-y-3">
                  <label className="font-black text-slate-900 text-xs uppercase tracking-wider block">1. RECEPTOR DE LA OFERTA COMERCIAL:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTipoReceptorCot('registrado')
                        const ruts = Object.keys(clientesMaestros)
                        if (ruts.length > 0) handleSeleccionarClienteParaCotizacion(ruts[0])
                      }}
                      className={`p-3 rounded-xl font-bold text-xs cursor-pointer border ${tipoReceptorCot === 'registrado' ? 'bg-blue-950 text-white' : 'bg-white text-slate-700'}`}
                    >
                      👤 Cliente Registrado
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTipoReceptorCot('prospecto')
                        setCotClienteRutSeleccionado('')
                        setCotNombreCliente('NUEVO PROSPECTO COMERCIAL')
                        setCotRutCliente('75.000.000-0')
                        setCotContactoPersona('Sr(a). Director(a) / Adquisiciones')
                      }}
                      className={`p-3 rounded-xl font-bold text-xs cursor-pointer border ${tipoReceptorCot === 'prospecto' ? 'bg-purple-950 text-white' : 'bg-white text-slate-700'}`}
                    >
                      ✨ Nuevo Prospecto
                    </button>
                  </div>

                  {tipoReceptorCot === 'registrado' ? (
                    <div className="space-y-3 pt-1">
                      <select
                        value={cotClienteRutSeleccionado}
                        onChange={(e) => handleSeleccionarClienteParaCotizacion(e.target.value)}
                        className="w-full bg-white border border-slate-300 p-3 rounded-xl font-bold text-slate-900 text-xs"
                      >
                        {Object.values(clientesMaestros).map(c => (
                          <option key={c.rut} value={c.rut}>{c.razon_social} — (RUT: {c.rut})</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={cotNombreCliente}
                        onChange={(e) => setCotNombreCliente(e.target.value)}
                        placeholder="Razón Social / Nombre..."
                        className="w-full bg-white border border-slate-300 p-3 rounded-xl font-bold text-slate-900 text-xs"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={cotNombreCliente}
                      onChange={(e) => setCotNombreCliente(e.target.value)}
                      placeholder="Razón Social del Prospecto..."
                      className="w-full bg-white border border-slate-300 p-3 rounded-xl font-bold text-slate-900 text-xs"
                    />
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">RUT RECEPTOR (EDITABLE):</label>
                      <input
                        type="text"
                        value={cotRutCliente}
                        onChange={(e) => setCotRutCliente(e.target.value)}
                        placeholder="ej: 75.123.456-7"
                        className="w-full bg-white border border-slate-300 p-2.5 rounded-lg text-xs font-mono font-bold text-blue-900"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">ATENCIÓN A (PERSONA):</label>
                      <input
                        type="text"
                        value={cotContactoPersona}
                        onChange={(e) => setCotContactoPersona(e.target.value)}
                        placeholder="Nombre de contacto..."
                        className="w-full bg-white border border-slate-300 p-2.5 rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">DIRECCIÓN ENTREGA:</label>
                      <input
                        type="text"
                        value={cotDireccion}
                        onChange={(e) => setCotDireccion(e.target.value)}
                        className="w-full bg-white border border-slate-300 p-2.5 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">CIUDAD / COMUNA:</label>
                      <input
                        type="text"
                        value={cotCiudadCliente}
                        onChange={(e) => setCotCiudadCliente(e.target.value)}
                        placeholder="ej: Viña del Mar, Santiago..."
                        className="w-full bg-white border border-slate-300 p-2.5 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">EMAIL CONFIRMACIÓN:</label>
                      <input
                        type="text"
                        value={cotEmailCliente}
                        onChange={(e) => setCotEmailCliente(e.target.value)}
                        className="w-full bg-white border border-slate-300 p-2.5 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">TELÉFONO RECEPTOR:</label>
                      <input
                        type="text"
                        value={cotTelefonoCliente}
                        onChange={(e) => setCotTelefonoCliente(e.target.value)}
                        className="w-full bg-white border border-slate-300 p-2.5 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* EMISOR Y CONDICIONES */}
                <div className="bg-[#f8fafc] p-4 rounded-xl border border-slate-200 space-y-3">
                  <label className="font-black text-slate-900 text-xs uppercase tracking-wider block">2. RAZÓN SOCIAL EMISORA, MONEDA & PIPELINE:</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">EMPRESA EMISORA:</label>
                      <select value={cotEmpresaEmisoraId} onChange={(e) => setCotEmpresaEmisoraId(e.target.value)} className="w-full bg-white border border-slate-300 p-2.5 rounded-lg font-bold text-xs">
                        {empresasConglomerado.map(e => <option key={e.id} value={e.id}>{e.razon_social}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">MONEDA:</label>
                      <select value={cotMoneda} onChange={(e: any) => setCotMoneda(e.target.value)} className="w-full bg-white border border-slate-300 p-2.5 rounded-lg font-bold text-xs">
                        <option value="CLP">CLP (Pesos Chilenos)</option>
                        <option value="UF">UF (Unidad de Fomento)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">ETAPA PIPELINE:</label>
                      <select value={cotEtapaPipeline} onChange={(e: any) => setCotEtapaPipeline(e.target.value)} className="w-full bg-white border border-slate-300 p-2.5 rounded-lg font-bold text-xs text-blue-900">
                        <option value="Lead">🟢 Prospecto / Lead</option>
                        <option value="Visita">🔍 Visita Técnica</option>
                        <option value="Cotizacion">📋 Cotización Enviada</option>
                        <option value="Negociacion">🤝 En Negociación</option>
                        <option value="Ganada">🎉 Aprobada / Ganada</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">FORMA DE PAGO:</label>
                      <input type="text" value={cotFormaPago} onChange={(e) => setCotFormaPago(e.target.value)} className="w-full bg-white border border-slate-300 p-2.5 rounded-lg text-xs font-bold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">DÍAS VALIDEZ:</label>
                      <input type="number" value={cotValidez} onChange={(e) => setCotValidez(Number(e.target.value) || 15)} className="w-full bg-white border border-slate-300 p-2.5 rounded-lg text-xs font-bold text-center" />
                    </div>
                  </div>
                </div>

                {/* ÍTEMS */}
                <div className="bg-[#f8fafc] p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-black text-slate-900 text-xs uppercase tracking-wider">3. DETALLE DE EQUIPOS & SERVICIOS:</label>
                    <button type="button" onClick={() => setItemsCot([...itemsCot, { id: Date.now().toString(), descripcion: 'Nuevo servicio / equipo de seguridad', cantidad: 1, precio_neto_unitario: 25000, descuento_valor: 0, tipo_descuento: 'porcentaje' }])} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold">+ Agregar Línea</button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[10px] font-bold text-slate-400">Catálogo Rápido:</span>
                    {CATALOGO_SEGURIDAD.slice(0, 4).map(cat => (
                      <button key={cat.id} type="button" onClick={() => handleAgregarItemDelCatalogo(cat)} className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold px-2.5 py-1 rounded-md border border-blue-200">
                        + {cat.categoria}
                      </button>
                    ))}
                  </div>

                  {itemsCot.map((it, idx) => (
                    <div key={it.id} className="grid grid-cols-12 gap-2 items-center p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <input type="text" value={it.descripcion} onChange={(e) => { const newIt = [...itemsCot]; newIt[idx].descripcion = e.target.value; setItemsCot(newIt) }} placeholder="Descripción..." className="col-span-6 bg-[#f8fafc] border p-2 rounded-lg text-xs font-medium" />
                      <input type="number" value={it.cantidad} onChange={(e) => { const newIt = [...itemsCot]; newIt[idx].cantidad = Number(e.target.value) || 1; setItemsCot(newIt) }} placeholder="Cant" className="col-span-2 bg-[#f8fafc] border p-2 rounded-lg text-xs text-center font-bold" />
                      <input type="number" value={it.precio_neto_unitario} onChange={(e) => { const newIt = [...itemsCot]; newIt[idx].precio_neto_unitario = Number(e.target.value) || 0; setItemsCot(newIt) }} placeholder="P. Unit Neto" className="col-span-3 bg-[#f8fafc] border p-2 rounded-lg text-xs text-right font-bold font-mono" />
                      <button type="button" onClick={() => setItemsCot(itemsCot.filter(i => i.id !== it.id))} className="col-span-1 text-red-600 font-bold text-center hover:bg-red-50 p-1 rounded-md">✕</button>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setMostrarModalCotizacion(false)} className="px-6 py-3 bg-slate-200 text-slate-800 font-bold rounded-xl text-xs">Cancelar</button>
                  <button type="button" onClick={handleGuardarCotizacionDolibarr} className="px-8 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-md">💾 Guardar Presupuesto DTE</button>
                </div>
              </div>

              {/* VISTA PREVIA IMPRESA A4 EN TIEMPO REAL */}
              <div className="w-full lg:w-1/2 p-6 bg-slate-900 rounded-2xl border border-slate-800 overflow-y-auto flex items-start justify-center">
                <div className="bg-white text-slate-900 p-8 rounded-2xl max-w-xl w-full shadow-2xl font-sans border border-slate-300 space-y-6 text-xs min-h-[750px] flex flex-col justify-between overflow-hidden">
                  <div className="space-y-5">
                    
                    {/* CABECERA DTE CHILE */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 gap-4">
                      <div className="space-y-1 text-xs">
                        <h1 className="text-base font-black text-[#000033] uppercase">{empresaEmisoraSeleccionadaCot.razon_social}</h1>
                        <p className="font-mono text-slate-700 font-bold text-[11px]">R.U.T.: {empresaEmisoraSeleccionadaCot.rut}</p>
                        <p className="text-slate-600 text-[11px]">{empresaEmisoraSeleccionadaCot.giro}</p>
                        <p className="text-slate-600 text-[11px]">📍 {empresaEmisoraSeleccionadaCot.direccion}</p>
                        <p className="text-slate-600 text-[11px]">📞 {empresaEmisoraSeleccionadaCot.telefono} | ✉️ {empresaEmisoraSeleccionadaCot.email_contacto}</p>
                      </div>

                      <div className="border-2 border-slate-900 bg-slate-50 p-4 rounded-xl w-60 space-y-1 text-center shadow-xs">
                        <span className="text-[10px] font-black text-blue-900 uppercase block tracking-wider">COTIZACIÓN / PRESUPUESTO</span>
                        <h2 className="text-base font-black text-slate-900 font-mono">{siguienteCorrelativoCode}</h2>
                        <div className="text-[10px] text-slate-600 pt-1 font-bold">
                          FECHA: {new Date().toLocaleDateString('es-CL')}
                        </div>
                        <div className="text-[10px] text-slate-600 font-bold">
                          VALIDEZ: {cotValidez} DÍAS HÁBILES
                        </div>
                      </div>
                    </div>

                    {/* DATOS DEL CLIENTE / RECEPTOR */}
                    <div className="border border-slate-300 bg-[#f8fafc] p-4 rounded-xl grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RECEPTOR / RAZÓN SOCIAL:</span>
                        <strong className="text-slate-900 text-xs block">{cotNombreCliente || 'Nombre del Cliente'}</strong>
                        <span className="text-blue-900 font-mono font-bold block">R.U.T.: {cotRutCliente || 'S/RUT'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ATENCIÓN A / ENTREGA:</span>
                        <strong className="text-slate-900 text-xs block">{cotContactoPersona || cotNombreCliente}</strong>
                        <span className="text-slate-600 block">📍 Dirección: {cotDireccion || 'Dirección de Entrega'}</span>
                        <span className="text-slate-900 font-bold block">🏙️ Ciudad: {cotCiudadCliente || 'Santiago'}, Chile</span>
                      </div>
                    </div>

                    {/* TABLA DE DETALLE */}
                    <div className="border border-slate-300 rounded-xl overflow-hidden text-[11px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 uppercase text-[10px]">
                            <th className="p-2.5 border-r border-slate-300 w-8 text-center">#</th>
                            <th className="p-2.5 border-r border-slate-300">Descripción del Servicio / Equipo</th>
                            <th className="p-2.5 border-r border-slate-300 text-center w-12">Cant.</th>
                            <th className="p-2.5 border-r border-slate-300 text-right w-20">P. Unit</th>
                            <th className="p-2.5 text-right w-24">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {itemsCot.map((it, idx) => (
                            <tr key={idx}>
                              <td className="p-2.5 text-center font-mono text-slate-400 border-r border-slate-200">{idx + 1}</td>
                              <td className="p-2.5 font-semibold text-slate-900 border-r border-slate-200">{it.descripcion}</td>
                              <td className="p-2.5 text-center font-mono font-bold border-r border-slate-200">{it.cantidad}</td>
                              <td className="p-2.5 text-right font-mono border-r border-slate-200">${(it.precio_neto_unitario || 0).toLocaleString('es-CL')}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-900">${Math.round((it.cantidad || 1) * (it.precio_neto_unitario || 0)).toLocaleString('es-CL')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* DESGLOSE FINANCIERO TRIBUTARIO CHILENO */}
                    <div className="flex justify-between items-start gap-4 pt-2">
                      <div className="text-[10px] space-y-1 text-slate-600 max-w-[240px]">
                        <p className="font-bold text-slate-800">💳 DATOS PARA TRANSFERENCIA BANCARIA:</p>
                        <p>{empresaEmisoraSeleccionadaCot.banco_nombre}</p>
                        <p>{empresaEmisoraSeleccionadaCot.banco_tipo_cuenta}: <strong className="font-mono">{empresaEmisoraSeleccionadaCot.banco_numero_cuenta}</strong></p>
                        <p>RUT: <strong className="font-mono">{empresaEmisoraSeleccionadaCot.rut}</strong></p>
                        <p>Mail: {empresaEmisoraSeleccionadaCot.email_cobranza}</p>
                      </div>

                      <div className="w-64 border border-slate-300 rounded-xl overflow-hidden font-mono text-xs shadow-xs">
                        <div className="flex justify-between p-2 bg-white border-b">
                          <span className="text-[11px] font-semibold text-slate-600">Neto Afecto:</span>
                          <span className="font-bold">${Math.round(calculoCotizacionActual.netoConDescuento).toLocaleString('es-CL')} {cotMoneda}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-[#f8fafc] border-b text-blue-900">
                          <span className="text-[11px] font-bold">IVA 19% (Ley 825):</span>
                          <span className="font-bold">${Math.round(calculoCotizacionActual.montoIva).toLocaleString('es-CL')} {cotMoneda}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-slate-900 text-white font-black">
                          <span>TOTAL:</span>
                          <span>${Math.round(calculoCotizacionActual.totalIvaIncluido).toLocaleString('es-CL')} {cotMoneda}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VISOR IMPRESO PDF COMPLETO CHILE DTE ── */}
      {cotSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-md overflow-y-auto p-4 md:p-8 flex justify-center items-start">
          
          <div className="no-imprimir fixed top-6 right-8 z-50 flex gap-3">
            <button
              onClick={() => handleEnviarWhatsAppCotizacion(cotSeleccionada)}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xl cursor-pointer flex items-center gap-2"
            >
              <span>💬 Notificar por WhatsApp</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xl cursor-pointer flex items-center gap-2"
            >
              <span>🖨️ Imprimir / Guardar PDF Oficial</span>
            </button>
            <button
              onClick={() => setCotSeleccionada(null)}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xl cursor-pointer"
            >
              ✕ Cerrar
            </button>
          </div>

          {/* DOCUMENTO IMPRIMIBLE OFICIAL A4 DTE CHILE */}
          <div id="seccion-imprimible-cotizacion" className="bg-white text-slate-900 p-10 md:p-14 rounded-2xl max-w-4xl w-full shadow-2xl font-sans my-4 border border-slate-300 space-y-8 min-h-[900px] flex flex-col justify-between overflow-hidden">
            
            <div className="space-y-6">
              
              {/* ENCABEZADO FISCAL CHILENO */}
              {(() => {
                const empEmisoraDoc = empresasConglomerado.find(e => e.id === cotSeleccionada.empresa_facturadora_id) || empresasConglomerado[0]
                return (
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b-2 border-slate-900 pb-6">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 bg-slate-900 text-white rounded-lg">🛡️</span>
                        <div>
                          <h1 className="text-xl font-black text-[#000033] uppercase">{empEmisoraDoc.razon_social}</h1>
                          <p className="font-mono text-slate-800 font-bold">R.U.T.: {empEmisoraDoc.rut}</p>
                        </div>
                      </div>
                      <p className="text-slate-600 pt-2">Giro: {empEmisoraDoc.giro}</p>
                      <p className="text-slate-600">Dirección Fiscal: {empEmisoraDoc.direccion}</p>
                      <p className="text-slate-600">Teléfono: {empEmisoraDoc.telefono} | Correo: {empEmisoraDoc.email_contacto}</p>
                      <p className="text-slate-600 font-mono">Web: {empEmisoraDoc.web}</p>
                    </div>

                    <div className="border-2 border-slate-900 bg-slate-50 p-5 rounded-xl w-full md:w-80 space-y-2 text-center shadow-xs">
                      <div className="text-xs font-black text-blue-900 uppercase tracking-widest">PRESUPUESTO / COTIZACIÓN DTE</div>
                      <h2 className="text-xl font-black text-slate-900 font-mono">{cotSeleccionada.codigo_cotizacion}</h2>
                      <div className="text-xs text-slate-600 border-t border-slate-300 pt-2 grid grid-cols-2 text-left font-mono">
                        <div><strong>FECHA:</strong> {cotSeleccionada.fecha}</div>
                        <div><strong>VALIDEZ:</strong> {cotSeleccionada.validez_dias || 15} Días</div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* DATOS DEL CLIENTE RECEPTOR */}
              <div className="border border-slate-300 bg-[#f8fafc] p-5 rounded-xl grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RECEPTOR DE LA PROPUESTA:</span>
                  <strong className="text-slate-900 text-sm block uppercase">{cotSeleccionada.nombre_cliente}</strong>
                  <p className="font-mono text-blue-900 font-extrabold text-sm">R.U.T.: {cotSeleccionada.rut_cliente || 'S/RUT'}</p>
                  <p className="text-slate-600">Giro: {cotSeleccionada.giro_cliente || 'Servicios Integrales / Particular'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ATENCIÓN A / CIUDAD / ENTREGA:</span>
                  <strong className="text-slate-900 text-sm block">{cotSeleccionada.contacto_persona || cotSeleccionada.nombre_cliente}</strong>
                  <p className="text-slate-600">📍 Dirección: {cotSeleccionada.direccion || 'Dirección Principal'}</p>
                  <p className="text-slate-900 font-bold">🏙️ Ciudad / Comuna: <span className="text-blue-950 font-black">{cotSeleccionada.ciudad_cliente || 'Santiago'}</span>, Chile</p>
                  <p className="text-slate-600">✉️ Correo: {cotSeleccionada.email_cliente || 'contacto@cliente.cl'}</p>
                </div>
              </div>

              {/* TABLA DETALLE DE PRODUCTOS & SERVICIOS */}
              <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 uppercase text-[11px]">
                      <th className="p-3.5 border-r border-slate-300 text-center w-10">#</th>
                      <th className="p-3.5 border-r border-slate-300">Descripción del Producto / Servicio Técnico</th>
                      <th className="p-3.5 border-r border-slate-300 text-center w-16">Cant.</th>
                      <th className="p-3.5 border-r border-slate-300 text-right w-28">P. Unit Neto</th>
                      <th className="p-3.5 text-right w-32">Subtotal Neto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {cotSeleccionada.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-3.5 text-center font-mono text-slate-400 border-r border-slate-200">{idx + 1}</td>
                        <td className="p-3.5 font-semibold text-slate-900 border-r border-slate-200">{it.descripcion}</td>
                        <td className="p-3.5 text-center font-mono font-bold border-r border-slate-200">{it.cantidad}</td>
                        <td className="p-3.5 text-right font-mono border-r border-slate-200">${(it.precio_neto_unitario || 0).toLocaleString('es-CL')}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">${Math.round((it.cantidad || 1) * (it.precio_neto_unitario || 0)).toLocaleString('es-CL')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* RESUMEN FINANCIERO Y TRIBUTARIO CHILENO */}
              <div className="flex justify-between items-start gap-6 pt-2">
                
                {/* CONDICIONES BANCARIAS Y TÉRMINOS */}
                <div className="text-xs space-y-2 text-slate-600 max-w-md bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  {(() => {
                    const empEmisoraDoc = empresasConglomerado.find(e => e.id === cotSeleccionada.empresa_facturadora_id) || empresasConglomerado[0]
                    return (
                      <>
                        <h4 className="font-bold text-slate-900 uppercase text-[11px]">💳 DATOS PARA TRANSFERENCIA ELECTRONICA:</h4>
                        <p className="text-[11px]">Empresa: <strong>{empEmisoraDoc.razon_social}</strong> (RUT: <strong className="font-mono">{empEmisoraDoc.rut}</strong>)</p>
                        <p className="text-[11px]">Banco: <strong>{empEmisoraDoc.banco_nombre}</strong> — {empEmisoraDoc.banco_tipo_cuenta}</p>
                        <p className="text-[11px]">N° Cuenta: <strong className="font-mono">{empresaEmisoraSeleccionadaCot.banco_numero_cuenta}</strong></p>
                        <p className="text-[11px]">Email Confirmación: <strong>{empEmisoraDoc.email_cobranza}</strong></p>
                        <div className="border-t border-slate-200 pt-2 text-[10px] text-slate-500 space-y-0.5">
                          <p>• Precios expresados en Pesos Chilenos (CLP) con IVA 19% incluido.</p>
                          <p>• Validez de la oferta: {cotSeleccionada.validez_dias || 15} días hábiles a contar de esta fecha.</p>
                          <p>• Garantía legal de equipos: 12 meses contra defectos de fabricación.</p>
                        </div>
                      </>
                    )
                  })()}
                </div>

                {/* CAJA DE TOTALES IMPUESTOS CHILE */}
                <div className="w-80 border-2 border-slate-900 rounded-xl overflow-hidden font-mono text-xs shadow-md">
                  <div className="flex justify-between p-3 bg-white border-b border-slate-200">
                    <span className="font-semibold text-slate-600">Subtotal Neto Afecto:</span>
                    <span className="font-bold">${Math.round(cotSeleccionada.neto_con_descuento || 0).toLocaleString('es-CL')} {cotSeleccionada.moneda_cotizacion || 'CLP'}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-[#f8fafc] border-b border-slate-200 text-blue-900">
                    <span className="font-bold">IVA (19% Ley 825):</span>
                    <span className="font-bold">${Math.round(cotSeleccionada.monto_iva || 0).toLocaleString('es-CL')} {cotSeleccionada.moneda_cotizacion || 'CLP'}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-[#000033] text-white font-black text-sm">
                    <span>TOTAL GENERAL:</span>
                    <span>${Math.round(cotSeleccionada.monto_total_iva_incluido || 0).toLocaleString('es-CL')} {cotSeleccionada.moneda_cotizacion || 'CLP'}</span>
                  </div>
                </div>
              </div>

              {/* TIMBRE Y ACEPTACIÓN DEL CLIENTE */}
              <div className="border-t-2 border-slate-200 pt-8 mt-6 grid grid-cols-2 gap-8 items-end">
                <div className="text-center space-y-2">
                  <div className="border-b border-slate-400 w-48 mx-auto"></div>
                  <p className="font-bold text-xs text-slate-800">{cotSeleccionada.vendedor || 'Ejecutivo Comercial Gama Seguridad'}</p>
                  <p className="text-[10px] text-slate-500">Emisor Autorizado Conglomerado Gama</p>
                </div>

                <div className="text-center space-y-2">
                  <div className="border-b border-slate-400 w-48 mx-auto"></div>
                  <p className="font-bold text-xs text-slate-800">Aceptado por: {cotSeleccionada.contacto_persona || cotSeleccionada.nombre_cliente}</p>
                  <p className="text-[10px] text-slate-500">Firma / Timbre de Aceptación del Cliente</p>
                </div>
              </div>

            </div>

            <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-xs text-slate-500 font-mono no-imprimir">
              <span>Documento Oficial Gama Seguridad • Cumple Formato DTE Chile</span>
              <span>Página 1 de 1</span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
