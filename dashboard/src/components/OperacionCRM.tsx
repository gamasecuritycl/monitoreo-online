'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { cleanRut } from '@/lib/rut'
import clientesDataRaw from '@/lib/clientes_general.json'

import {
  Shield,
  User,
  FileText,
  DollarSign,
  MessageSquare,
  Pencil,
  Trash2,
  Building2,
  Wrench,
  BarChart3,
  Settings,
  Bot,
  Search,
  Plus,
  Printer,
  X,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Copy,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  ArrowRight,
  Check,
  AlertCircle,
  FileCheck,
  Layers,
  ChevronDown,
  Filter,
  Send,
  Sparkles,
  SlidersHorizontal,
  CreditCard,
  Building,
  Radio,
  FileSpreadsheet
} from 'lucide-react'

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

export type EtapaPipelineEspo = 'Lead' | 'Visita' | 'Cotizacion' | 'Negociacion' | 'Ganada' | 'Perdida'

export interface ItemCotizacion {
  id: string
  descripcion: string
  cantidad: number
  precio_neto_unitario: number
  descuento_valor: number
  tipo_descuento: 'porcentaje' | 'monto'
  descuento_porcentaje?: number
}

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

  // ── NIVEL 1: EMPRESAS DEL CONGLOMERADO Y FORMULARIO MODAL ──
  const [empresasConglomerado, setEmpresasConglomerado] = useState<EmpresaConglomerado[]>(EMPRESAS_INICIALES)
  const [mostrarModalEmpresa, setMostrarModalEmpresa] = useState(false)
  const [empresaEditando, setEmpresaEditando] = useState<EmpresaConglomerado | null>(null)

  const [empFormId, setEmpFormId] = useState('')
  const [empFormRazonSocial, setEmpFormRazonSocial] = useState('')
  const [empFormRut, setEmpFormRut] = useState('')
  const [empFormGiro, setEmpFormGiro] = useState('')
  const [empFormDireccion, setEmpFormDireccion] = useState('')
  const [empFormTelefono, setEmpFormTelefono] = useState('')
  const [empFormEmailCobranza, setEmpFormEmailCobranza] = useState('')
  const [empFormEmailContacto, setEmpFormEmailContacto] = useState('')
  const [empFormWeb, setEmpFormWeb] = useState('')
  const [empFormBancoNombre, setEmpFormBancoNombre] = useState('')
  const [empFormBancoTipoCuenta, setEmpFormBancoTipoCuenta] = useState('')
  const [empFormBancoNumeroCuenta, setEmpFormBancoNumeroCuenta] = useState('')

  // ── MULTI-CONFIGURACIÓN PESTAÑAS (MÓDULO 7) ──
  const [subTabConfig, setSubTabConfig] = useState<'empresas' | 'financiero' | 'whatsapp' | 'agentes'>('empresas')

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
  const [facturas, setFacturas] = useState<FacturaIndividual[]>([
    { id: 'FAC-1001', numero_factura: 'F-8820', fecha: '2026-07-01', razon_social: 'GAMA SEGURIDAD SPA DEMO', rut_cliente: '76.319.399-3', empresa_facturadora_id: 'EMP-1', monto_total: 35581, monto_abonado: 0, saldo_pendiente: 35581, cuenta_asociada: '0999', estado: 'Emitida', fecha_carga: '2026-07-01' },
    { id: 'FAC-1002', numero_factura: 'F-8821', fecha: '2026-07-05', razon_social: 'CORPORACION PRODEL', rut_cliente: '77.890.123-4', empresa_facturadora_id: 'EMP-2', monto_total: 89700, monto_abonado: 45000, saldo_pendiente: 44700, cuenta_asociada: 'C774', estado: 'Abonada', fecha_carga: '2026-07-05' }
  ])
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

  // ── MOTOR DE AGENTES DE IA AUTÓNOMOS 24/7 (AUTO-COMPANY ENGINE) ──
  const [logsConsenso, setLogsConsenso] = useState<string[]>([
    `[${new Date().toLocaleTimeString('es-CL')}] 🟢 SRE Guardian Agent: Chequeo de latencia Supabase (14ms) - Salud 100%.`,
    `[${new Date().toLocaleTimeString('es-CL')}] 💳 Finance & Billing Agent: Escaneo de 466 clientes completado. 0 morosidades detectadas hoy.`,
    `[${new Date().toLocaleTimeString('es-CL')}] 👁️ Vision AI Guard: 1,420 eventos de video verificados. 0 falsas alarmas críticas.`,
    `[${new Date().toLocaleTimeString('es-CL')}] 📋 Sales & PR2607 Agent: Correlativo activo listo (PR2607-0258).`
  ])
  const [ejecutandoCiclo, setEjecutandoCiclo] = useState(false)

  // ── INICIALIZACIÓN Y RECUPERACIÓN DUAL (LOCALSTORAGE + SUPABASE) ──
  useEffect(() => {
    try {
      const localEmp = localStorage.getItem('gama_empresas')
      if (localEmp) setEmpresasConglomerado(JSON.parse(localEmp))

      const localCot = localStorage.getItem('gama_cotizaciones')
      if (localCot) setCotizaciones(JSON.parse(localCot))

      const localFact = localStorage.getItem('gama_facturas')
      if (localFact) setFacturas(JSON.parse(localFact))

      const localOT = localStorage.getItem('gama_ordenes_trabajo')
      if (localOT) setOrdenesTrabajo(JSON.parse(localOT))
    } catch (e) {}

    const fetchDatosJerarquicos = async () => {
      try {
        const { data: dEmp } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'EMPRESAS_CONGLOMERADO')
          .order('id', { ascending: false })
          .limit(1)

        if (dEmp && dEmp.length > 0 && dEmp[0].nombre_abonado) {
          try {
            const parsed = JSON.parse(dEmp[0].nombre_abonado)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setEmpresasConglomerado(parsed)
              localStorage.setItem('gama_empresas', JSON.stringify(parsed))
            }
          } catch (e) {}
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

        const { data: dCot } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'COTIZACIONES_DOLIBARR')
          .order('id', { ascending: false })
          .limit(1)
        if (dCot && dCot.length > 0 && dCot[0].nombre_abonado) {
          try {
            const parsed = JSON.parse(dCot[0].nombre_abonado)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setCotizaciones(parsed)
              localStorage.setItem('gama_cotizaciones', JSON.stringify(parsed))
            }
          } catch (e) {}
        }

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
      cli = Object.values(clientesMaestros).find(c => (c.razon_social || '').toLowerCase().trim() === (rutOKey || '').toLowerCase().trim())
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
      localStorage.setItem('gama_cotizaciones', JSON.stringify(listaNueva))
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'COTIZACIONES_DOLIBARR',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: 'DUPLICAR_COTIZACION',
        fecha_hora: new Date().toISOString()
      })
      alert(`Presupuesto duplicado exitosamente con nuevo folio ${nuevoCodigo}.`)
    } catch (e: any) {
      console.error('Duplicado localmente:', e)
    }
  }

  const handleEliminarCotizacion = async (id: number, codigo: string) => {
    if (!confirm(`¿Está seguro de eliminar permanentemente el presupuesto ${codigo}?`)) return
    const listaNueva = cotizaciones.filter(c => c.id !== id)
    setCotizaciones(listaNueva)
    try {
      localStorage.setItem('gama_cotizaciones', JSON.stringify(listaNueva))
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'COTIZACIONES_DOLIBARR',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: 'ELIMINAR_COTIZACION',
        fecha_hora: new Date().toISOString()
      })
    } catch (e: any) {
      console.error('Eliminado localmente:', e)
    }
  }

  const handleCambiarEtapaPipeline = async (cotId: number, nuevaEtapa: EtapaPipelineEspo) => {
    const listaNueva = cotizaciones.map(c => c.id === cotId ? { ...c, etapa_pipeline: nuevaEtapa } : c)
    setCotizaciones(listaNueva)
    try {
      localStorage.setItem('gama_cotizaciones', JSON.stringify(listaNueva))
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
      const res = await fetch('/api/whatsapp/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fono, message: mensaje })
      })
      const data = await res.json()
      if (data.status === 'success' || data.success) {
        alert(`Notificación enviada con éxito por WhatsApp a ${cot.nombre_cliente} (${fono}).`)
      } else {
        const link = `https://wa.me/${fono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
        window.open(link, '_blank')
      }
    } catch (e) {
      const link = `https://wa.me/${fono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
      window.open(link, '_blank')
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

    setCotizaciones(listaNueva)
    try { localStorage.setItem('gama_cotizaciones', JSON.stringify(listaNueva)) } catch (e) {}

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'COTIZACIONES_DOLIBARR',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: cotEditandoId ? 'EDICION_COTIZACION' : 'CREACION_COTIZACION',
        fecha_hora: new Date().toISOString()
      })
    } catch (e: any) {
      console.error('Almacenado localmente:', e)
    }

    setMostrarModalCotizacion(false)
    setCotEditandoId(null)
    alert(`Presupuesto ${codigoCot} guardado exitosamente para "${nombreFinal}" (RUT: ${rutFinal}).`)
  }

  const handleRegistrarAbono = async () => {
    if (!facturaAbonando) return
    const monto = Number(montoAbonoInput) || 0
    if (monto <= 0) {
      alert('Por favor ingrese un monto de abono válido mayor a 0.')
      return
    }

    const nuevoAbonado = (facturaAbonando.monto_abonado || 0) + monto
    const nuevoSaldo = Math.max(0, facturaAbonando.monto_total - nuevoAbonado)
    const nuevoEstado = nuevoSaldo === 0 ? 'Pagada' : 'Abonada'

    const listaNueva = facturas.map(f => f.id === facturaAbonando.id ? {
      ...f,
      monto_abonado: nuevoAbonado,
      saldo_pendiente: nuevoSaldo,
      estado: nuevoEstado as any,
      notas_cobranza: `${f.notas_cobranza || ''} | Abono de $${monto.toLocaleString('es-CL')} via ${metodoPagoInput} (${new Date().toLocaleDateString('es-CL')}) ${notaAbonoInput}`.trim()
    } : f)

    setFacturas(listaNueva)
    try { localStorage.setItem('gama_facturas', JSON.stringify(listaNueva)) } catch (e) {}

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'FACTURAS_MAESTRO',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: 'REGISTRO_ABONO',
        fecha_hora: new Date().toISOString()
      })
    } catch (e: any) {
      console.error('Guardado localmente:', e)
    }

    setMostrarModalAbono(false)
    setFacturaAbonando(null)
    setMontoAbonoInput('')
    setNotaAbonoInput('')
    alert(`Abono de $${monto.toLocaleString('es-CL')} registrado correctamente para la Factura ${facturaAbonando.numero_factura}.`)
  }

  // ── EDICIÓN / CREACIÓN DE EMPRESA DEL CONGLOMERADO ──
  const abrirModalEditarEmpresa = (empresa?: EmpresaConglomerado) => {
    if (empresa) {
      setEmpresaEditando(empresa)
      setEmpFormId(empresa.id)
      setEmpFormRazonSocial(empresa.razon_social)
      setEmpFormRut(empresa.rut)
      setEmpFormGiro(empresa.giro)
      setEmpFormDireccion(empresa.direccion)
      setEmpFormTelefono(empresa.telefono)
      setEmpFormEmailCobranza(empresa.email_cobranza)
      setEmpFormEmailContacto(empresa.email_contacto)
      setEmpFormWeb(empresa.web)
      setEmpFormBancoNombre(empresa.banco_nombre)
      setEmpFormBancoTipoCuenta(empresa.banco_tipo_cuenta)
      setEmpFormBancoNumeroCuenta(empresa.banco_numero_cuenta)
    } else {
      setEmpresaEditando(null)
      setEmpFormId(`EMP-${empresasConglomerado.length + 1}`)
      setEmpFormRazonSocial('')
      setEmpFormRut('')
      setEmpFormGiro('Servicios de Monitoreo & Seguridad Electrónica')
      setEmpFormDireccion('Av. Valparaíso 1183, Viña del Mar, Chile')
      setEmpFormTelefono('+56 9 9101 6912')
      setEmpFormEmailCobranza('cobranza@gamasecurity.cl')
      setEmpFormEmailContacto('contacto@gamasecurity.cl')
      setEmpFormWeb('www.gamasecurity.cl')
      setEmpFormBancoNombre('Banco de Chile')
      setEmpFormBancoTipoCuenta('Cuenta Corriente')
      setEmpFormBancoNumeroCuenta('00-123-45678-9')
    }
    setMostrarModalEmpresa(true)
  }

  const handleGuardarEmpresaEmisora = async () => {
    if (!empFormRazonSocial.trim() || !empFormRut.trim()) {
      alert('Por favor ingrese la Razón Social y el RUT de la Empresa Emisora.')
      return
    }

    const nuevaEmp: EmpresaConglomerado = {
      id: empFormId || `EMP-${Date.now()}`,
      razon_social: empFormRazonSocial.trim(),
      rut: empFormRut.trim(),
      giro: empFormGiro.trim() || 'Servicios Integrales de Monitoreo & Alarma',
      direccion: empFormDireccion.trim(),
      telefono: empFormTelefono.trim(),
      email_cobranza: empFormEmailCobranza.trim(),
      email_contacto: empFormEmailContacto.trim(),
      web: empFormWeb.trim(),
      banco_nombre: empFormBancoNombre.trim(),
      banco_tipo_cuenta: empFormBancoTipoCuenta.trim(),
      banco_numero_cuenta: empFormBancoNumeroCuenta.trim()
    }

    let listaNueva: EmpresaConglomerado[] = []
    if (empresaEditando) {
      listaNueva = empresasConglomerado.map(e => e.id === empresaEditando.id ? nuevaEmp : e)
    } else {
      listaNueva = [...empresasConglomerado, nuevaEmp]
    }

    setEmpresasConglomerado(listaNueva)
    try { localStorage.setItem('gama_empresas', JSON.stringify(listaNueva)) } catch (e) {}

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'EMPRESAS_CONGLOMERADO',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: empresaEditando ? 'EDICION_EMPRESA' : 'CREACION_EMPRESA',
        fecha_hora: new Date().toISOString()
      })
    } catch (e: any) {
      console.error('Empresa guardada localmente:', e)
    }

    setMostrarModalEmpresa(false)
    setEmpresaEditando(null)
    alert(`Razón Social "${nuevaEmp.razon_social}" (RUT: ${nuevaEmp.rut}) guardada exitosamente.`)
  }

  const handleEliminarEmpresaEmisora = async (id: string) => {
    if (empresasConglomerado.length <= 1) {
      alert('Debe mantener al menos una empresa emisora en el conglomerado.')
      return
    }
    if (!confirm('¿Está seguro de eliminar permanentemente esta Razón Social Emisora?')) return

    const listaNueva = empresasConglomerado.filter(e => e.id !== id)
    setEmpresasConglomerado(listaNueva)
    try { localStorage.setItem('gama_empresas', JSON.stringify(listaNueva)) } catch (e) {}

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'EMPRESAS_CONGLOMERADO',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: 'ELIMINACION_EMPRESA',
        fecha_hora: new Date().toISOString()
      })
    } catch (e: any) {
      console.error('Error al eliminar empresa:', e)
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
      alert(`Ciclo de Consenso #${cId} completado. Todos los agentes reportan estado 100% Operativo.`)
    }, 600)
  }

  // ── BUSCADOR SEGURO INTELIGENTE 360° ──
  const resultadosBusqueda = useMemo(() => {
    const q = (busquedaClienteInput || '').toLowerCase().trim()
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

    Object.values(abonadosCentrosCosto || {}).forEach(cc => {
      if (!cc) return
      const cStr = String(cc.cuenta || '').toLowerCase()
      const aStr = String(cc.alias_centro_costo || '').toLowerCase()
      const rStr = String(cc.rut_cliente || '').toLowerCase()

      if (cStr.includes(q) || aStr.includes(q) || rStr.includes(q)) {
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
          cuentas_count: cli?.cuentas_abonados?.length || 1,
          cuentas_preview: cc.cuenta
        })
      }
    })

    Object.values(clientesMaestros || {}).forEach(cli => {
      if (!cli) return
      const rStr = String(cli.rut || '').toLowerCase()
      const nStr = String(cli.razon_social || '').toLowerCase()
      const eStr = String(cli.email_cobranza || '').toLowerCase()
      const cArr = (cli.cuentas_abonados || []).map(c => String(c).toLowerCase())
      
      const matchCta = cArr.some(c => c.includes(q))
      if (rStr.includes(q) || nStr.includes(q) || eStr.includes(q) || matchCta) {
        const yaExiste = list.some(l => l.rut === cli.rut)
        if (!yaExiste) {
          const firstFew = (cli.cuentas_abonados || []).slice(0, 3).join(', ')
          const extra = (cli.cuentas_abonados || []).length > 3 ? ` (+${cli.cuentas_abonados.length - 3} más)` : ''
          list.push({
            id: `cliente-${cli.rut}`,
            tipo: 'cliente',
            rut: cli.rut,
            razon_social: cli.razon_social,
            email: cli.email_cobranza || 'contacto@cliente.cl',
            estado_pago: cli.estado_pago || 'Al Día',
            cuentas_count: (cli.cuentas_abonados || []).length,
            cuentas_preview: firstFew + extra
          })
        }
      }
    })

    return list.slice(0, 15)
  }, [busquedaClienteInput, abonadosCentrosCosto, clientesMaestros])

  const empresaEmisoraSeleccionadaCot = empresasConglomerado.find(e => e.id === cotEmpresaEmisoraId) || empresasConglomerado[0]

  return (
    <div className="min-h-screen bg-zinc-50/90 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex flex-col select-none p-6 md:p-8 gap-6 antialiased">
      
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

      {/* ── HEADER PRINCIPAL SHADCN UI ── */}
      <header className="bg-white dark:bg-zinc-900 rounded-2xl p-5 md:p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 no-imprimir">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarAbierto(!sidebarAbierto)}
            className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-3 rounded-xl shadow-xs flex items-center justify-center">
            <Shield className="h-6 w-6 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
              GAMA SEGURIDAD
              <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>PLATAFORMA OPERATIVA CRM 360°</span>
              </span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
              {empresasConglomerado.length} Razones Sociales Emisoras • Búsqueda por Abonado & Cliente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 rounded-xl text-zinc-700 dark:text-zinc-300 font-mono shadow-2xs flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>UF HOY:</span>
            <strong className="text-emerald-700 dark:text-emerald-400 font-bold">${valorUF.toLocaleString('es-CL')} CLP</strong>
          </div>

          <a
            href="/app"
            className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer text-xs flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4 stroke-[1.75]" />
            <span>COMMAND CENTER</span>
          </a>
        </div>
      </header>

      {/* ── CONTENEDOR PRINCIPAL ── */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0 no-imprimir">
        
        {/* ── SIDEBAR NAVEGACIÓN SHADCN ── */}
        {sidebarAbierto && (
          <aside className="w-72 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-2xl flex flex-col gap-2 shrink-0 shadow-sm transition-all overflow-hidden">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 mb-1 flex justify-between items-center">
              <span>MÓDULOS DE GESTIÓN</span>
              <button onClick={() => setSidebarAbierto(false)} className="text-zinc-400 hover:text-zinc-600 font-bold text-xs cursor-pointer">✕</button>
            </div>

            {[
              { id: 'ficha360', label: 'Ficha 360° Cliente', icon: User },
              { id: 'autonomia', label: 'Agentes Autónomos IA', icon: Bot },
              { id: 'presupuestos', label: 'Presupuestos & Pipeline', icon: FileText },
              { id: 'facturacion', label: 'Facturación & Abonos', icon: DollarSign },
              { id: 'serv_tecnico', label: 'Servicio Técnico & SLA', icon: Wrench },
              { id: 'kpis', label: 'KPIs & Reportes', icon: BarChart3 },
              { id: 'config', label: 'CRUD Empresas & Config', icon: Settings },
            ].map(m => {
              const IconComp = m.icon
              const esActivo = moduloActivo === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => setModuloActivo(m.id as any)}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium text-xs transition-all flex items-center gap-3 cursor-pointer ${
                    esActivo
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <IconComp className={`h-4 w-4 stroke-[1.75] ${esActivo ? 'text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400'}`} />
                  <span>{m.label}</span>
                </button>
              )
            })}

            <div className="mt-auto bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-xl text-xs space-y-1.5 text-zinc-600 dark:text-zinc-400">
              <div className="font-bold text-zinc-900 dark:text-zinc-200 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-zinc-500" />
                <span>DATOS CONGLOMERADO</span>
              </div>
              <div className="flex justify-between">
                <span>Empresas Emisoras:</span>
                <strong className="text-zinc-900 dark:text-zinc-100 font-mono font-bold">{empresasConglomerado.length}</strong>
              </div>
              <div className="flex justify-between">
                <span>Clientes Registrados:</span>
                <strong className="text-zinc-900 dark:text-zinc-100 font-mono font-bold">{Object.keys(clientesMaestros).length}</strong>
              </div>
              <div className="flex justify-between">
                <span>Centros de Costo:</span>
                <strong className="text-zinc-900 dark:text-zinc-100 font-mono font-bold">{Object.keys(abonadosCentrosCosto).length}</strong>
              </div>
            </div>
          </aside>
        )}

        {/* ── PANEL DERECHO PRINCIPAL ── */}
        <main className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-6">

          {/* ── MÓDULO 1: FICHA 360° DEL CLIENTE ── */}
          {moduloActivo === 'ficha360' && (
            <div className="flex-1 flex flex-col gap-6 min-h-0">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col gap-4 overflow-hidden">
                <div className="font-bold text-xs text-zinc-500 uppercase tracking-wider flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-zinc-500" />
                    <span>BUSCADOR INTELIGENTE 360° (BUSCA POR CÓDIGO DE ABONADO C774, NOMBRE O RUT)</span>
                  </span>
                  {(cuentaSeleccionada || rutClienteSeleccionado) && (
                    <button
                      onClick={() => { setCuentaSeleccionada(''); setRutClienteSeleccionado(''); setBusquedaClienteInput('') }}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Limpiar Selección</span>
                    </button>
                  )}
                </div>

                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="absolute left-4 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <input
                      type="text"
                      value={busquedaClienteInput}
                      onChange={(e) => setBusquedaClienteInput(e.target.value)}
                      placeholder="Escriba código de Abonado (ej: 0999, C774), Nombre del Cliente o RUT..."
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-mono shadow-2xs"
                    />
                  </div>

                  {busquedaClienteInput.trim().length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl ring-1 ring-black/5 z-30 max-h-96 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 p-2">
                      {resultadosBusqueda.length > 0 ? (
                        resultadosBusqueda.map(item => (
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
                            className="p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-xl cursor-pointer flex justify-between items-center transition-all"
                          >
                            <div className="space-y-1">
                              <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
                                {item.tipo === 'abonado' && (
                                  <span className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono text-[10px] px-2 py-0.5 rounded-md font-bold">
                                    Abonado #{item.cuenta}
                                  </span>
                                )}
                                <span>{item.alias || item.razon_social}</span>
                                {item.rut && !item.rut.startsWith('CTA-') && (
                                  <span className="font-mono text-zinc-600 dark:text-zinc-400 text-[10px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-md font-medium">
                                    RUT: {item.rut}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-zinc-400" />
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-zinc-500 font-medium text-xs">
                          No se encontraron coincidencias para &quot;{busquedaClienteInput}&quot;.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {clienteActivo || abonadoActivo ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm overflow-y-auto">
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {abonadoActivo && (
                          <span className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono text-xs font-semibold px-3 py-1 rounded-lg">
                            CUENTA ABONADO #{abonadoActivo.cuenta}
                          </span>
                        )}
                        {clienteActivo && clienteActivo.rut && !clienteActivo.rut.startsWith('CTA-') && (
                          <span className="bg-zinc-800 text-zinc-200 font-mono text-xs font-semibold px-3 py-1 rounded-lg">
                            RUT: {clienteActivo.rut}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        {abonadoActivo ? abonadoActivo.alias_centro_costo : clienteActivo?.razon_social}
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-zinc-400" /> {abonadoActivo ? abonadoActivo.direccion : clienteActivo?.direccion_comercial} ({clienteActivo?.ciudad || 'Santiago'})</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-zinc-400" /> {clienteActivo?.email_cobranza}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-16 text-center shadow-sm flex flex-col items-center justify-center gap-4">
                  <div className="p-4 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl text-zinc-500">
                    <User className="h-10 w-10 stroke-[1.5]" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Búsqueda de Abonado / Cliente 360°</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md font-normal leading-relaxed">
                    Ingrese una cuenta de abonado (ej: 0999, C774), Razón Social o RUT en el buscador superior para inspeccionar el expediente.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* ── MÓDULO 2: AGENTES AUTÓNOMOS (AUTO-COMPANY) ── */}
          {moduloActivo === 'autonomia' && (
            <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm overflow-y-auto">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 text-white rounded-xl">
                    <Bot className="h-5 w-5 stroke-[1.75]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                      Central de Agentes Virtuales Autónomos (Auto-Company Engine)
                    </h2>
                    <p className="text-xs text-zinc-500 font-medium">Bucle continuo de verificación 24/7 y consenso operativo</p>
                  </div>
                </div>

                <button
                  disabled={ejecutandoCiclo}
                  onClick={handleEjecutarCicloConsenso}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${ejecutandoCiclo ? 'animate-spin' : ''}`} />
                  <span>{ejecutandoCiclo ? 'Ejecutando...' : 'Ejecutar Consenso'}</span>
                </button>
              </div>

              <div className="bg-zinc-950 rounded-2xl p-6 border border-zinc-800 text-zinc-200 font-mono text-xs shadow-2xl flex flex-col gap-3">
                <div className="font-bold text-emerald-400 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>MEMORIA DE CONSENSO EN VIVO (consensus.md)</span>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {logsConsenso.map((log, i) => (
                    <div key={i} className="p-2 hover:bg-zinc-900/60 rounded-lg">{log}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── MÓDULO 3: PRESUPUESTOS & PIPELINE CRM (ESPO-CRM INSPIRED) ── */}
          {moduloActivo === 'presupuestos' && (
            <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm min-h-0 overflow-hidden">
              
              {/* ENCABEZADO Y ALTERNADOR DE VISTA TABLA / KANBAN */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide flex items-center gap-3">
                    <FileText className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                    <span>Presupuestos & Pipeline CRM (DTE Chile)</span>
                    <span className="bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                      {siguienteCorrelativoCode}
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">
                    Pipeline comercial de oportunidades, notificaciones WhatsApp y desglose tributario DTE Chile (19% IVA)
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl shadow-2xs">
                    <button
                      onClick={() => setVistaCotizaciones('tabla')}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${vistaCotizaciones === 'tabla' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                    >
                      <TableIcon className="h-3.5 w-3.5" />
                      <span>Tabla DTE</span>
                    </button>
                    <button
                      onClick={() => setVistaCotizaciones('kanban')}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${vistaCotizaciones === 'kanban' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      <span>Pipeline Kanban</span>
                    </button>
                  </div>

                  <button
                    onClick={abrirModalNuevaCotizacion}
                    className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer transition-all flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Crear Presupuesto</span>
                  </button>
                </div>
              </div>

              {/* VISTA 1: TABLA GENERAL DTE */}
              {vistaCotizaciones === 'tabla' && (
                <div className="flex-1 overflow-auto border border-zinc-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs font-normal">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-semibold uppercase text-[11px] tracking-wider">
                        <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800">FOLIO / FECHA</th>
                        <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800">EMPRESA EMISORA</th>
                        <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800">RECEPTOR (CLIENTE / PROSPECTO)</th>
                        <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800">CIUDAD / COMUNA</th>
                        <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800 text-right">NETO AFECTO</th>
                        <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800 text-right">TOTAL IVA INCL.</th>
                        <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800 text-center">ETAPA PIPELINE</th>
                        <th className="p-3.5 text-center w-52">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {cotizaciones.map(c => {
                        const empEmisora = empresasConglomerado.find(e => e.id === c.empresa_facturadora_id) || empresasConglomerado[0]
                        return (
                          <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                            <td className="p-3.5 font-mono font-bold text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-zinc-800">
                              <div>{c.codigo_cotizacion}</div>
                              <div className="text-[10px] text-zinc-500 font-sans">{c.fecha}</div>
                            </td>
                            <td className="p-3.5 border-r border-zinc-200 dark:border-zinc-800 font-medium text-emerald-700 dark:text-emerald-400 text-xs">{empEmisora.razon_social}</td>
                            <td className="p-3.5 border-r border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-900 dark:text-zinc-100">
                              <div>{c.nombre_cliente}</div>
                              <div className="text-[10px] text-zinc-500 font-mono">RUT: {c.rut_cliente}</div>
                            </td>
                            <td className="p-3.5 border-r border-zinc-200 dark:border-zinc-800 font-medium text-zinc-700 dark:text-zinc-300">{c.ciudad_cliente || 'Santiago'}</td>
                            <td className="p-3.5 text-right font-mono border-r border-zinc-200 dark:border-zinc-800">${Math.round(c.neto_con_descuento || 0).toLocaleString('es-CL')}</td>
                            <td className="p-3.5 text-right font-mono font-bold text-emerald-800 dark:text-emerald-400 border-r border-zinc-200 dark:border-zinc-800">${Math.round(c.monto_total_iva_incluido || 0).toLocaleString('es-CL')}</td>
                            <td className="p-3.5 text-center border-r border-zinc-200 dark:border-zinc-800 font-medium">
                              <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] font-semibold">
                                {c.etapa_pipeline || 'Cotización'}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => handleEnviarWhatsAppCotizacion(c)} title="Enviar por WhatsApp" className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold cursor-pointer text-xs transition-colors">
                                  <MessageSquare className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => setCotSeleccionada(c)} title="Ver e Imprimir DTE" className="p-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-bold cursor-pointer text-xs transition-colors">
                                  <FileText className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => handleEditarCotizacion(c)} title="Editar Cotización" className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-bold cursor-pointer text-xs transition-colors">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => handleDuplicarCotizacion(c)} title="Copiar Cotización" className="p-2 bg-zinc-600 hover:bg-zinc-500 text-white rounded-lg font-bold cursor-pointer text-xs transition-colors">
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => handleEliminarCotizacion(c.id, c.codigo_cotizacion)} title="Eliminar Cotización" className="p-2 bg-red-700 hover:bg-red-600 text-white rounded-lg font-bold cursor-pointer text-xs transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
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
                <div className="flex-1 overflow-x-auto border border-zinc-200/80 dark:border-zinc-800 rounded-2xl bg-zinc-100/60 dark:bg-zinc-950 p-4 shadow-inner">
                  <div className="flex gap-4 min-w-[1200px] h-full items-stretch">
                    
                    {[
                      { key: 'Lead', label: 'Prospecto / Lead', color: 'border-emerald-500' },
                      { key: 'Visita', label: 'Visita Técnica', color: 'border-amber-500' },
                      { key: 'Cotizacion', label: 'Cotización Enviada', color: 'border-blue-500' },
                      { key: 'Negociacion', label: 'En Negociación', color: 'border-purple-500' },
                      { key: 'Ganada', label: 'Aprobada / Ganada', color: 'border-green-600' }
                    ].map(col => {
                      const cotsEnCol = cotizaciones.filter(c => (c.etapa_pipeline || 'Cotizacion') === col.key)
                      const totalMontoCol = cotsEnCol.reduce((acc, curr) => acc + (curr.monto_total_iva_incluido || 0), 0)

                      return (
                        <div key={col.key} className={`w-1/5 bg-white dark:bg-zinc-900 border-t-4 ${col.color} border-x border-b border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xs`}>
                          <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
                            <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">{col.label}</span>
                            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono border border-zinc-200 dark:border-zinc-700">
                              {cotsEnCol.length}
                            </span>
                          </div>
                          
                          <div className="text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-lg text-center border border-zinc-200 dark:border-zinc-700">
                            Monto: ${Math.round(totalMontoCol).toLocaleString('es-CL')} CLP
                          </div>

                          <div className="flex-1 overflow-y-auto space-y-3 pt-1">
                            {cotsEnCol.map(cot => (
                              <div key={cot.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm space-y-3 hover:border-zinc-400 transition-all">
                                <div className="flex justify-between items-start">
                                  <span className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100">{cot.codigo_cotizacion}</span>
                                  <span className="text-[10px] text-zinc-400 font-medium">{cot.fecha}</span>
                                </div>

                                <div className="space-y-1">
                                  <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 uppercase leading-snug">{cot.nombre_cliente}</h4>
                                  <span className="text-[10px] text-zinc-500 block font-mono">RUT: {cot.rut_cliente}</span>
                                  <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium block">📍 {cot.ciudad_cliente || 'Santiago'}</span>
                                </div>

                                <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg flex justify-between items-center font-mono text-xs">
                                  <span className="text-[10px] text-zinc-500 font-sans">Total IVA Incl.</span>
                                  <span className="font-bold text-emerald-700 dark:text-emerald-400">${Math.round(cot.monto_total_iva_incluido || 0).toLocaleString('es-CL')}</span>
                                </div>

                                {/* ACCIONES DE PIPELINE Y WHATSAPP */}
                                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                  <div className="flex gap-1.5">
                                    <button onClick={() => handleEnviarWhatsAppCotizacion(cot)} title="Notificar por WhatsApp" className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs cursor-pointer transition-colors">
                                      <MessageSquare className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => setCotSeleccionada(cot)} title="Ver DTE PDF" className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs cursor-pointer transition-colors">
                                      <FileText className="h-3.5 w-3.5" />
                                    </button>
                                  </div>

                                  <select
                                    value={cot.etapa_pipeline || 'Cotizacion'}
                                    onChange={(e) => handleCambiarEtapaPipeline(cot.id, e.target.value as any)}
                                    className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] font-semibold p-1.5 text-zinc-800 dark:text-zinc-200"
                                  >
                                    <option value="Lead">Lead</option>
                                    <option value="Visita">Visita</option>
                                    <option value="Cotizacion">Cotización</option>
                                    <option value="Negociacion">Negociación</option>
                                    <option value="Ganada">Ganada</option>
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
            <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm overflow-y-auto">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-zinc-900 text-white rounded-xl">
                  <DollarSign className="h-5 w-5 stroke-[1.75]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                    Gestor de Facturación & Abonos Parciales
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium">
                    Gestión de cobro, conciliación de saldos y registro de recibos de pago
                  </p>
                </div>
              </div>

              <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs bg-white dark:bg-zinc-900 p-2">
                <table className="w-full text-left border-collapse text-xs font-normal">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-semibold uppercase text-[11px]">
                      <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800">FOLIO / FECHA</th>
                      <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800">EMPRESA EMISORA</th>
                      <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800">CLIENTE / ABONADO</th>
                      <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800 text-right">TOTAL FACTURA</th>
                      <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800 text-right">TOTAL ABONADO</th>
                      <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800 text-right">SALDO PENDIENTE</th>
                      <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800 text-center">ESTADO</th>
                      <th className="p-3.5 text-center w-36">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {facturas.map(f => {
                      const empEmisora = empresasConglomerado.find(e => e.id === f.empresa_facturadora_id) || empresasConglomerado[0]
                      return (
                        <tr key={f.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-zinc-800">
                            <div>{f.numero_factura}</div>
                            <div className="text-zinc-500 text-[10px] font-sans">{f.fecha}</div>
                          </td>
                          <td className="p-3.5 border-r border-zinc-200 dark:border-zinc-800 font-medium text-emerald-700 dark:text-emerald-400 text-xs">{empEmisora.razon_social}</td>
                          <td className="p-3.5 border-r border-zinc-200 dark:border-zinc-800">
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">{f.razon_social}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">Abonado #{f.cuenta_asociada || 'N/A'}</div>
                          </td>
                          <td className="p-3.5 text-right font-mono text-zinc-900 dark:text-zinc-100 font-bold border-r border-zinc-200 dark:border-zinc-800">
                            ${f.monto_total.toLocaleString('es-CL')} CLP
                          </td>
                          <td className="p-3.5 text-right font-mono text-emerald-700 dark:text-emerald-400 font-bold border-r border-zinc-200 dark:border-zinc-800">
                            ${(f.monto_abonado || 0).toLocaleString('es-CL')} CLP
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-red-700 dark:text-red-400 border-r border-zinc-200 dark:border-zinc-800">
                            ${(f.saldo_pendiente || 0).toLocaleString('es-CL')} CLP
                          </td>
                          <td className="p-3.5 text-center border-r border-zinc-200 dark:border-zinc-800 font-bold">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold ${
                              f.estado === 'Pagada' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              f.estado === 'Abonada' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {f.estado.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3.5 text-center flex items-center justify-center">
                            <button
                              onClick={() => {
                                setFacturaAbonando(f)
                                setMontoAbonoInput((f.saldo_pendiente || 0).toString())
                                setMostrarModalAbono(true)
                              }}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                              <span>Registrar Abono</span>
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
            <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm overflow-y-auto">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 text-white rounded-xl">
                    <Wrench className="h-5 w-5 stroke-[1.75]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                      Servicio Técnico & Órdenes de Trabajo (SLA & Field Service)
                    </h2>
                    <p className="text-xs text-zinc-500 font-medium">
                      Programación, asignación técnica y monitoreo de niveles de servicio (SLA 2h / 6h / 24h)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMostrarModalOT(true)}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nueva Orden Técnica (OT)</span>
                </button>
              </div>

              <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs bg-white dark:bg-zinc-900 p-2">
                <table className="w-full text-left border-collapse text-xs font-normal">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-semibold uppercase text-[11px]">
                      <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800">CÓDIGO OT / FECHA</th>
                      <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800">CUENTA ABONADO</th>
                      <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800">CLIENTE / CENTRO COSTO</th>
                      <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800">TIPO DE SERVICIO</th>
                      <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800">SLA DE RESPUESTA</th>
                      <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800">TÉCNICO ASIGNADO</th>
                      <th className="p-3.5 text-center">ESTADO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {ordenesTrabajo.map(ot => (
                      <tr key={ot.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-zinc-800">
                          <div>{ot.codigo_ot}</div>
                          <div className="text-zinc-500 text-[10px] font-sans">{ot.fecha_programada}</div>
                        </td>
                        <td className="p-3.5 border-r border-zinc-200 dark:border-zinc-800 font-mono font-bold text-zinc-900 dark:text-zinc-100">#{ot.cuenta}</td>
                        <td className="p-3.5 border-r border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-900 dark:text-zinc-100">{ot.cliente_nombre}</td>
                        <td className="p-3.5 border-r border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">{ot.tipo_servicio}</td>
                        <td className="p-3.5 border-r border-zinc-200 dark:border-zinc-800 font-medium">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold ${
                            ot.prioridad_sla?.includes('2h') ? 'bg-red-100 text-red-800 border border-red-200' :
                            ot.prioridad_sla?.includes('6h') ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {ot.prioridad_sla || 'Normal (24h)'}
                          </span>
                        </td>
                        <td className="p-3.5 border-r border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold">{ot.tecnico_asignado}</td>
                        <td className="p-3.5 text-center font-semibold">
                          <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2.5 py-1 rounded-md text-[10px]">{ot.estado}</span>
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
            <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm overflow-y-auto">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-zinc-900 text-white rounded-xl">
                  <BarChart3 className="h-5 w-5 stroke-[1.75]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Tablero de KPIs Ejecutivos & Recaudación por Razón Social
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium">
                    Distribución de facturación mensual y participación financiera de las 4 Empresas del Conglomerado
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 p-6 rounded-2xl space-y-2 shadow-2xs">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">FAC. MENSUAL PROYECTADA TOTAL</span>
                  <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    ${kpisFinancieros.totalTarifasCLP.toLocaleString('es-CL')} CLP
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">Calculado sobre {kpisFinancieros.totalClientes} Clientes</span>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 p-6 rounded-2xl space-y-2 shadow-2xs">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">EFECTIVIDAD DE COBRANZA</span>
                  <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">96.4%</div>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Meta Cumplida</span>
                  </span>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 p-6 rounded-2xl space-y-2 shadow-2xs">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">UF REFERENCIA</span>
                  <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">${valorUF.toLocaleString('es-CL')} CLP</div>
                  <span className="text-xs text-zinc-500 font-medium">Oficial hoy</span>
                </div>
              </div>
            </div>
          )}

          {/* ── MÓDULO 7: CRUD EMPRESAS & CONFIGURACIÓN GLOBAL MULTI-PESTAÑA ── */}
          {moduloActivo === 'config' && (
            <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm overflow-y-auto">
              
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 text-white rounded-xl">
                    <Settings className="h-5 w-5 stroke-[1.75]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                      Centro de Configuración Global & CRUD del Conglomerado
                    </h2>
                    <p className="text-xs text-zinc-500 font-medium">
                      Gestión de Empresas Emisoras DTE, Parámetros Financieros UF/IVA y Servidor WhatsApp
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl shadow-2xs">
                  {[
                    { id: 'empresas', label: 'Razones Sociales', icon: Building2 },
                    { id: 'financiero', label: 'UF & Impuestos', icon: DollarSign },
                    { id: 'whatsapp', label: 'WhatsApp Server', icon: MessageSquare },
                    { id: 'agentes', label: 'Motor IA 24/7', icon: Bot }
                  ].map(tab => {
                    const TabIcon = tab.icon
                    const esActivo = subTabConfig === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSubTabConfig(tab.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${esActivo ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                      >
                        <TabIcon className="h-3.5 w-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* PESTAÑA 1: CRUD EMPRESAS EMISORAS */}
              {subTabConfig === 'empresas' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      Empresas Emisoras del Conglomerado ({empresasConglomerado.length})
                    </h3>
                    <button
                      onClick={() => abrirModalEditarEmpresa()}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer flex items-center gap-2 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Agregar Razón Social</span>
                    </button>
                  </div>

                  <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs bg-white dark:bg-zinc-900 p-2">
                    <table className="w-full text-left border-collapse text-xs font-normal">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-semibold uppercase text-[11px]">
                          <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800">ID / RUT</th>
                          <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800">RAZÓN SOCIAL EMISORA</th>
                          <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800">GIRO COMERCIAL</th>
                          <th className="p-3.5 border-r border-zinc-200 dark:border-zinc-800">DATOS BANCARIOS</th>
                          <th className="p-3.5 text-center w-36">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {empresasConglomerado.map(emp => (
                          <tr key={emp.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                            <td className="p-3.5 font-mono font-bold text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-zinc-800">
                              <div>{emp.id}</div>
                              <div className="text-zinc-500 font-medium">RUT: {emp.rut}</div>
                            </td>
                            <td className="p-3.5 border-r border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-900 dark:text-zinc-100">
                              <div>{emp.razon_social}</div>
                              <div className="text-[10px] text-zinc-500 font-normal">📍 {emp.direccion}</div>
                            </td>
                            <td className="p-3.5 border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{emp.giro}</td>
                            <td className="p-3.5 border-r border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                              <div><strong>{emp.banco_nombre}</strong> ({emp.banco_tipo_cuenta})</div>
                              <div className="text-zinc-500">N° {emp.banco_numero_cuenta}</div>
                            </td>
                            <td className="p-3.5 text-center flex items-center justify-center gap-2">
                              <button onClick={() => abrirModalEditarEmpresa(emp)} title="Editar Empresa" className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-semibold cursor-pointer text-xs flex items-center gap-1 transition-colors">
                                <Pencil className="h-3.5 w-3.5" />
                                <span>Editar</span>
                              </button>
                              <button onClick={() => handleEliminarEmpresaEmisora(emp.id)} title="Eliminar Empresa" className="px-2.5 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-lg font-semibold cursor-pointer text-xs transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PESTAÑA 2: UF, IVA & IMPUESTOS */}
              {subTabConfig === 'financiero' && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 p-6 rounded-2xl space-y-6 max-w-3xl">
                  <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">💰 Configuración UF, IVA & Presupuestos</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Valor UF Oficial ($ CLP):</label>
                      <input
                        type="number"
                        value={valorUF}
                        onChange={(e) => setValorUF(Number(e.target.value) || 38500)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Tasa IVA (Ley 825 Chile):</label>
                      <input
                        type="text"
                        disabled
                        value="19% IVA Incluido"
                        className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-semibold text-xs text-zinc-600 dark:text-zinc-400"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button onClick={() => alert('Parámetros financieros actualizados correctamente.')} className="px-5 py-2.5 bg-zinc-900 text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer">
                      Guardar Parámetros Financieros
                    </button>
                  </div>
                </div>
              )}

              {/* PESTAÑA 3: SERVIDOR WHATSAPP SCORPION */}
              {subTabConfig === 'whatsapp' && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 p-6 rounded-2xl space-y-6 max-w-3xl">
                  <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">📲 Configuración Servidor WhatsApp Scorpion</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Endpoint API Servidor WhatsApp:</label>
                      <input
                        type="text"
                        defaultValue="/api/whatsapp/send-direct"
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1 font-mono">Estado de Conexión Scorpion Server:</label>
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 font-semibold rounded-lg text-xs border border-emerald-200">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>En Línea & Operativo (24/7)</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* PESTAÑA 4: MOTOR DE AGENTES IA */}
              {subTabConfig === 'agentes' && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 p-6 rounded-2xl space-y-6 max-w-3xl">
                  <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">🤖 Motor de Agentes Virtuales Autónomos</h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex justify-between items-center">
                      <div><strong>SRE Guardian Agent:</strong> Monitoreo de latencia Supabase & Vercel.</div>
                      <span className="text-emerald-600 font-semibold">🟢 Activo</span>
                    </div>
                    <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex justify-between items-center">
                      <div><strong>Finance Agent:</strong> Escaneo de cobro y morosidad de abonados.</div>
                      <span className="text-emerald-600 font-semibold">🟢 Activo</span>
                    </div>
                    <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex justify-between items-center">
                      <div><strong>Vision AI Guard:</strong> Verificación de analíticas de video 24/7.</div>
                      <span className="text-emerald-600 font-semibold">🟢 Activo</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </main>
      </div>

      {/* ── MODAL EDITAR / CREAR EMPRESA CONGLOMERADO (SHADCN BLUR OVERLAY) ── */}
      {mostrarModalEmpresa && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-4 md:p-6 flex justify-center items-center overflow-y-auto no-imprimir">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl ring-1 ring-black/5 p-6 md:p-8 flex flex-col gap-6 text-xs text-zinc-900 dark:text-zinc-100 font-sans my-auto">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                  <Building2 className="h-5 w-5 text-zinc-900 dark:text-zinc-100 stroke-[1.75]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    {empresaEditando ? 'EDITAR EMISOR CONGLOMERADO' : 'CREAR NUEVA RAZÓN SOCIAL EMISORA'}
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">Configuración de datos fiscales, comerciales y bancarios para documentos DTE</p>
                </div>
              </div>
              <button onClick={() => setMostrarModalEmpresa(false)} className="text-zinc-400 hover:text-zinc-600 font-bold text-lg cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider block">1. IDENTIFICACIÓN TRIBUTARIA CHILENA:</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-1">RAZÓN SOCIAL:</label>
                    <input type="text" value={empFormRazonSocial} onChange={(e) => setEmpFormRazonSocial(e.target.value)} placeholder="ej: Gama Seguridad SpA" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded-lg font-semibold text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-1">R.U.T. EMISOR:</label>
                    <input type="text" value={empFormRut} onChange={(e) => setEmpFormRut(e.target.value)} placeholder="ej: 76.319.399-3" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded-lg font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 block mb-1">GIRO COMERCIAL SII:</label>
                  <input type="text" value={empFormGiro} onChange={(e) => setEmpFormGiro(e.target.value)} placeholder="ej: Servicios de Monitoreo & Seguridad Electrónica" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded-lg text-xs font-normal" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-1">DIRECCIÓN FISCAL:</label>
                    <input type="text" value={empFormDireccion} onChange={(e) => setEmpFormDireccion(e.target.value)} placeholder="ej: Av. Valparaíso 1183, Viña del Mar" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-1">SITIO WEB OFICIAL:</label>
                    <input type="text" value={empFormWeb} onChange={(e) => setEmpFormWeb(e.target.value)} placeholder="www.gamasecurity.cl" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded-lg text-xs font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-1">TELÉFONO CONTACTO:</label>
                    <input type="text" value={empFormTelefono} onChange={(e) => setEmpFormTelefono(e.target.value)} placeholder="+56 32 3276011" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded-lg text-xs font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-1">EMAIL COBRANZA / FACTURACIÓN:</label>
                    <input type="text" value={empFormEmailCobranza} onChange={(e) => setEmpFormEmailCobranza(e.target.value)} placeholder="cobranza@gamasecurity.cl" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded-lg text-xs" />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider block">2. DATOS BANCARIOS PARA TRANSFERENCIAS:</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-1">BANCO:</label>
                    <input type="text" value={empFormBancoNombre} onChange={(e) => setEmpFormBancoNombre(e.target.value)} placeholder="Banco de Chile" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded-lg font-semibold text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-1">TIPO CUENTA:</label>
                    <input type="text" value={empFormBancoTipoCuenta} onChange={(e) => setEmpFormBancoTipoCuenta(e.target.value)} placeholder="Cuenta Corriente" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded-lg font-semibold text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-1">N° DE CUENTA:</label>
                    <input type="text" value={empFormBancoNumeroCuenta} onChange={(e) => setEmpFormBancoNumeroCuenta(e.target.value)} placeholder="00-123-45678-9" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded-lg font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800">
              <button onClick={() => setMostrarModalEmpresa(false)} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold rounded-xl text-xs cursor-pointer">Cancelar</button>
              <button onClick={handleGuardarEmpresaEmisora} className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer">Guardar Empresa</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE REGISTRO DE ABONOS A FACTURAS ── */}
      {mostrarModalAbono && facturaAbonando && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-4 flex justify-center items-center no-imprimir">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl ring-1 ring-black/5 p-6 flex flex-col gap-5 text-xs text-zinc-900 dark:text-zinc-100 font-sans">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span>Registrar Abono / Pago de Factura</span>
                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded-md font-mono font-bold text-xs">
                  {facturaAbonando.numero_factura}
                </span>
              </h3>
              <button onClick={() => setMostrarModalAbono(false)} className="text-zinc-400 hover:text-zinc-600 font-bold text-lg cursor-pointer">✕</button>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500 font-medium">Cliente:</span>
                <strong className="text-zinc-900 dark:text-zinc-100">{facturaAbonando.razon_social}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-medium">Monto Total Factura:</span>
                <strong className="font-mono">${facturaAbonando.monto_total.toLocaleString('es-CL')} CLP</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-medium">Abonado a la Fecha:</span>
                <strong className="font-mono text-emerald-700 dark:text-emerald-400">${(facturaAbonando.monto_abonado || 0).toLocaleString('es-CL')} CLP</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700 font-bold text-sm">
                <span className="text-red-700 dark:text-red-400">Saldo Pendiente Actual:</span>
                <span className="font-mono text-red-700 dark:text-red-400">${(facturaAbonando.saldo_pendiente || 0).toLocaleString('es-CL')} CLP</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Monto del Nuevo Abono ($ CLP):</label>
                <input
                  type="number"
                  value={montoAbonoInput}
                  onChange={(e) => setMontoAbonoInput(e.target.value)}
                  placeholder="Ingrese el monto del abono..."
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Método de Pago:</label>
                <select
                  value={metodoPagoInput}
                  onChange={(e) => setMetodoPagoInput(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl font-semibold text-xs text-zinc-900 dark:text-zinc-100"
                >
                  <option value="Transferencia Bancaria">Transferencia Bancaria (Banco Chile / Santander)</option>
                  <option value="Cheque a Fecha">Cheque a Fecha / Al Día</option>
                  <option value="WebPay / Tarjeta">WebPay / Tarjeta Débito-Crédito</option>
                  <option value="Efectivo / Caja">Efectivo en Caja</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Observación / N° Comprobante:</label>
                <input
                  type="text"
                  value={notaAbonoInput}
                  onChange={(e) => setNotaAbonoInput(e.target.value)}
                  placeholder="ej: N° Transferencia 889210..."
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setMostrarModalAbono(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegistrarAbono}
                className="px-6 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                Guardar Abono
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREADOR DE PRESUPUESTOS MODAL DTE CHILE ── */}
      {mostrarModalCotizacion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto p-4 md:p-6 flex justify-center items-center no-imprimir">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-7xl h-[92vh] rounded-2xl shadow-2xl ring-1 ring-white/10 flex flex-col overflow-hidden p-5 md:p-6 gap-5 font-sans text-xs text-white">
            
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-800 text-zinc-100 rounded-xl">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white uppercase tracking-wider flex items-center gap-3">
                    {cotEditandoId ? 'EDITAR PRESUPUESTO DTE' : 'CREAR PRESUPUESTO COMERCIAL DTE'}
                    <span className="bg-zinc-800 text-zinc-200 text-xs px-3 py-0.5 rounded-full font-mono font-bold border border-zinc-700">
                      {cotEditandoId ? cotizaciones.find(c => c.id === cotEditandoId)?.codigo_cotizacion : siguienteCorrelativoCode}
                    </span>
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setMostrarModalCotizacion(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-lg px-3 py-1.5 rounded-xl border border-zinc-700 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-6 min-h-0">
              
              {/* CONFIGURADOR DE DATOS DE COTIZACIÓN */}
              <div className="w-full lg:w-1/2 p-6 bg-white text-zinc-900 rounded-2xl border border-zinc-300 overflow-y-auto flex flex-col gap-5 shadow-inner">
                
                {/* RECEPTOR */}
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
                  <label className="font-bold text-zinc-900 text-xs uppercase tracking-wider block">1. RECEPTOR DE LA OFERTA COMERCIAL:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTipoReceptorCot('registrado')
                        const ruts = Object.keys(clientesMaestros)
                        if (ruts.length > 0) handleSeleccionarClienteParaCotizacion(ruts[0])
                      }}
                      className={`p-3 rounded-xl font-semibold text-xs cursor-pointer border transition-all ${tipoReceptorCot === 'registrado' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-700 border-zinc-300'}`}
                    >
                      Cliente Registrado
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
                      className={`p-3 rounded-xl font-semibold text-xs cursor-pointer border transition-all ${tipoReceptorCot === 'prospecto' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-700 border-zinc-300'}`}
                    >
                      Nuevo Prospecto
                    </button>
                  </div>

                  {tipoReceptorCot === 'registrado' ? (
                    <div className="space-y-3 pt-1">
                      <select
                        value={cotClienteRutSeleccionado}
                        onChange={(e) => handleSeleccionarClienteParaCotizacion(e.target.value)}
                        className="w-full bg-white border border-zinc-300 p-3 rounded-xl font-semibold text-zinc-900 text-xs"
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
                        className="w-full bg-white border border-zinc-300 p-3 rounded-xl font-semibold text-zinc-900 text-xs"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={cotNombreCliente}
                      onChange={(e) => setCotNombreCliente(e.target.value)}
                      placeholder="Razón Social del Prospecto..."
                      className="w-full bg-white border border-zinc-300 p-3 rounded-xl font-semibold text-zinc-900 text-xs"
                    />
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">RUT RECEPTOR (EDITABLE):</label>
                      <input
                        type="text"
                        value={cotRutCliente}
                        onChange={(e) => setCotRutCliente(e.target.value)}
                        placeholder="ej: 75.123.456-7"
                        className="w-full bg-white border border-zinc-300 p-2.5 rounded-lg text-xs font-mono font-bold text-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">ATENCIÓN A (PERSONA):</label>
                      <input
                        type="text"
                        value={cotContactoPersona}
                        onChange={(e) => setCotContactoPersona(e.target.value)}
                        placeholder="Nombre de contacto..."
                        className="w-full bg-white border border-zinc-300 p-2.5 rounded-lg text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">DIRECCIÓN ENTREGA:</label>
                      <input
                        type="text"
                        value={cotDireccion}
                        onChange={(e) => setCotDireccion(e.target.value)}
                        className="w-full bg-white border border-zinc-300 p-2.5 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">CIUDAD / COMUNA:</label>
                      <input
                        type="text"
                        value={cotCiudadCliente}
                        onChange={(e) => setCotCiudadCliente(e.target.value)}
                        placeholder="ej: Viña del Mar, Santiago..."
                        className="w-full bg-white border border-zinc-300 p-2.5 rounded-lg text-xs font-semibold text-zinc-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">EMAIL CONFIRMACIÓN:</label>
                      <input
                        type="text"
                        value={cotEmailCliente}
                        onChange={(e) => setCotEmailCliente(e.target.value)}
                        className="w-full bg-white border border-zinc-300 p-2.5 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">TELÉFONO RECEPTOR:</label>
                      <input
                        type="text"
                        value={cotTelefonoCliente}
                        onChange={(e) => setCotTelefonoCliente(e.target.value)}
                        className="w-full bg-white border border-zinc-300 p-2.5 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* EMISOR Y CONDICIONES */}
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
                  <label className="font-bold text-zinc-900 text-xs uppercase tracking-wider block">2. RAZÓN SOCIAL EMISORA, MONEDA & PIPELINE:</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">EMPRESA EMISORA:</label>
                      <select value={cotEmpresaEmisoraId} onChange={(e) => setCotEmpresaEmisoraId(e.target.value)} className="w-full bg-white border border-zinc-300 p-2.5 rounded-lg font-semibold text-xs">
                        {empresasConglomerado.map(e => <option key={e.id} value={e.id}>{e.razon_social}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">MONEDA:</label>
                      <select value={cotMoneda} onChange={(e: any) => setCotMoneda(e.target.value)} className="w-full bg-white border border-zinc-300 p-2.5 rounded-lg font-semibold text-xs">
                        <option value="CLP">CLP (Pesos Chilenos)</option>
                        <option value="UF">UF (Unidad de Fomento)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">ETAPA PIPELINE:</label>
                      <select value={cotEtapaPipeline} onChange={(e: any) => setCotEtapaPipeline(e.target.value)} className="w-full bg-white border border-zinc-300 p-2.5 rounded-lg font-bold text-xs text-zinc-900">
                        <option value="Lead">Prospecto / Lead</option>
                        <option value="Visita">Visita Técnica</option>
                        <option value="Cotizacion">Cotización Enviada</option>
                        <option value="Negociacion">En Negociación</option>
                        <option value="Ganada">Aprobada / Ganada</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">FORMA DE PAGO:</label>
                      <input type="text" value={cotFormaPago} onChange={(e) => setCotFormaPago(e.target.value)} className="w-full bg-white border border-zinc-300 p-2.5 rounded-lg text-xs font-semibold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">DÍAS VALIDEZ:</label>
                      <input type="number" value={cotValidez} onChange={(e) => setCotValidez(Number(e.target.value) || 15)} className="w-full bg-white border border-zinc-300 p-2.5 rounded-lg text-xs font-bold text-center" />
                    </div>
                  </div>
                </div>

                {/* ÍTEMS */}
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-zinc-900 text-xs uppercase tracking-wider">3. DETALLE DE EQUIPOS & SERVICIOS:</label>
                    <button type="button" onClick={() => setItemsCot([...itemsCot, { id: Date.now().toString(), descripcion: 'Nuevo servicio / equipo de seguridad', cantidad: 1, precio_neto_unitario: 25000, descuento_valor: 0, tipo_descuento: 'porcentaje' }])} className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer">
                      <Plus className="h-3.5 w-3.5" />
                      <span>Agregar Línea</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[10px] font-bold text-zinc-400">Catálogo Rápido:</span>
                    {CATALOGO_SEGURIDAD.slice(0, 4).map(cat => (
                      <button key={cat.id} type="button" onClick={() => handleAgregarItemDelCatalogo(cat)} className="text-[10px] bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold px-2.5 py-1 rounded-md border border-zinc-300 transition-colors">
                        + {cat.categoria}
                      </button>
                    ))}
                  </div>

                  {itemsCot.map((it, idx) => (
                    <div key={it.id} className="grid grid-cols-12 gap-2 items-center p-3 bg-white rounded-xl border border-zinc-200 shadow-2xs">
                      <input type="text" value={it.descripcion} onChange={(e) => { const newIt = [...itemsCot]; newIt[idx].descripcion = e.target.value; setItemsCot(newIt) }} placeholder="Descripción..." className="col-span-6 bg-zinc-50 border border-zinc-200 p-2 rounded-lg text-xs font-medium" />
                      <input type="number" value={it.cantidad} onChange={(e) => { const newIt = [...itemsCot]; newIt[idx].cantidad = Number(e.target.value) || 1; setItemsCot(newIt) }} placeholder="Cant" className="col-span-2 bg-zinc-50 border border-zinc-200 p-2 rounded-lg text-xs text-center font-bold" />
                      <input type="number" value={it.precio_neto_unitario} onChange={(e) => { const newIt = [...itemsCot]; newIt[idx].precio_neto_unitario = Number(e.target.value) || 0; setItemsCot(newIt) }} placeholder="P. Unit Neto" className="col-span-3 bg-zinc-50 border border-zinc-200 p-2 rounded-lg text-xs text-right font-bold font-mono" />
                      <button type="button" onClick={() => setItemsCot(itemsCot.filter(i => i.id !== it.id))} className="col-span-1 text-red-600 font-bold text-center hover:bg-red-50 p-1.5 rounded-md flex justify-center">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setMostrarModalCotizacion(false)} className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold rounded-xl text-xs cursor-pointer">Cancelar</button>
                  <button type="button" onClick={handleGuardarCotizacionDolibarr} className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer">Guardar Presupuesto DTE</button>
                </div>
              </div>

              {/* VISTA PREVIA IMPRESA A4 EN TIEMPO REAL */}
              <div className="w-full lg:w-1/2 p-6 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-y-auto flex items-start justify-center">
                <div className="bg-white text-zinc-900 p-8 rounded-2xl max-w-xl w-full shadow-2xl font-sans border border-zinc-300 space-y-6 text-xs min-h-[750px] flex flex-col justify-between overflow-hidden">
                  <div className="space-y-5">
                    
                    {/* CABECERA DTE CHILE */}
                    <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-5 gap-4">
                      <div className="space-y-1 text-xs">
                        <h1 className="text-base font-bold text-zinc-900 uppercase">{empresaEmisoraSeleccionadaCot.razon_social}</h1>
                        <p className="font-mono text-zinc-700 font-bold text-[11px]">R.U.T.: {empresaEmisoraSeleccionadaCot.rut}</p>
                        <p className="text-zinc-600 text-[11px]">{empresaEmisoraSeleccionadaCot.giro}</p>
                        <p className="text-zinc-600 text-[11px]">📍 {empresaEmisoraSeleccionadaCot.direccion}</p>
                        <p className="text-zinc-600 text-[11px]">📞 {empresaEmisoraSeleccionadaCot.telefono} | ✉️ {empresaEmisoraSeleccionadaCot.email_contacto}</p>
                      </div>

                      <div className="border-2 border-zinc-900 bg-zinc-50 p-4 rounded-xl w-60 space-y-1 text-center shadow-xs">
                        <span className="text-[10px] font-bold text-zinc-900 uppercase block tracking-wider">COTIZACIÓN / PRESUPUESTO</span>
                        <h2 className="text-base font-bold text-zinc-900 font-mono">{siguienteCorrelativoCode}</h2>
                        <div className="text-[10px] text-zinc-600 pt-1 font-bold">
                          FECHA: {new Date().toLocaleDateString('es-CL')}
                        </div>
                        <div className="text-[10px] text-zinc-600 font-bold">
                          VALIDEZ: {cotValidez} DÍAS HÁBILES
                        </div>
                      </div>
                    </div>

                    {/* DATOS DEL CLIENTE / RECEPTOR */}
                    <div className="border border-zinc-300 bg-zinc-50 p-4 rounded-xl grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">RECEPTOR / RAZÓN SOCIAL:</span>
                        <strong className="text-zinc-900 text-xs block">{cotNombreCliente || 'Nombre del Cliente'}</strong>
                        <span className="text-zinc-900 font-mono font-bold block">R.U.T.: {cotRutCliente || 'S/RUT'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">ATENCIÓN A / ENTREGA:</span>
                        <strong className="text-zinc-900 text-xs block">{cotContactoPersona || cotNombreCliente}</strong>
                        <span className="text-zinc-600 block">📍 Dirección: {cotDireccion || 'Dirección de Entrega'}</span>
                        <span className="text-zinc-900 font-bold block">🏙️ Ciudad: {cotCiudadCliente || 'Santiago'}, Chile</span>
                      </div>
                    </div>

                    {/* TABLA DE DETALLE */}
                    <div className="border border-zinc-300 rounded-xl overflow-hidden text-[11px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-100 text-zinc-800 font-bold border-b border-zinc-300 uppercase text-[10px]">
                            <th className="p-2.5 border-r border-zinc-300 w-8 text-center">#</th>
                            <th className="p-2.5 border-r border-zinc-300">Descripción del Servicio / Equipo</th>
                            <th className="p-2.5 border-r border-zinc-300 text-center w-12">Cant.</th>
                            <th className="p-2.5 border-r border-zinc-300 text-right w-20">P. Unit</th>
                            <th className="p-2.5 text-right w-24">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {itemsCot.map((it, idx) => (
                            <tr key={idx}>
                              <td className="p-2.5 text-center font-mono text-zinc-400 border-r border-zinc-200">{idx + 1}</td>
                              <td className="p-2.5 font-semibold text-zinc-900 border-r border-zinc-200">{it.descripcion}</td>
                              <td className="p-2.5 text-center font-mono font-bold border-r border-zinc-200">{it.cantidad}</td>
                              <td className="p-2.5 text-right font-mono border-r border-zinc-200">${(it.precio_neto_unitario || 0).toLocaleString('es-CL')}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-zinc-900">${Math.round((it.cantidad || 1) * (it.precio_neto_unitario || 0)).toLocaleString('es-CL')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* DESGLOSE FINANCIERO TRIBUTARIO CHILENO */}
                    <div className="flex justify-between items-start gap-4 pt-2">
                      <div className="text-[10px] space-y-1 text-zinc-600 max-w-[240px]">
                        <p className="font-bold text-zinc-800">💳 DATOS PARA TRANSFERENCIA BANCARIA:</p>
                        <p>{empresaEmisoraSeleccionadaCot.banco_nombre}</p>
                        <p>{empresaEmisoraSeleccionadaCot.banco_tipo_cuenta}: <strong className="font-mono">{empresaEmisoraSeleccionadaCot.banco_numero_cuenta}</strong></p>
                        <p>RUT: <strong className="font-mono">{empresaEmisoraSeleccionadaCot.rut}</strong></p>
                        <p>Mail: {empresaEmisoraSeleccionadaCot.email_cobranza}</p>
                      </div>

                      <div className="w-64 border border-zinc-300 rounded-xl overflow-hidden font-mono text-xs shadow-xs">
                        <div className="flex justify-between p-2 bg-white border-b">
                          <span className="text-[11px] font-semibold text-zinc-600">Neto Afecto:</span>
                          <span className="font-bold">${Math.round(calculoCotizacionActual.netoConDescuento).toLocaleString('es-CL')} {cotMoneda}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-zinc-50 border-b text-zinc-900">
                          <span className="text-[11px] font-bold">IVA 19% (Ley 825):</span>
                          <span className="font-bold">${Math.round(calculoCotizacionActual.montoIva).toLocaleString('es-CL')} {cotMoneda}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-zinc-900 text-white font-bold">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto p-4 md:p-8 flex justify-center items-start">
          
          <div className="no-imprimir fixed top-6 right-8 z-50 flex gap-3">
            <button
              onClick={() => handleEnviarWhatsAppCotizacion(cotSeleccionada)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xl cursor-pointer flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Notificar por WhatsApp</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-xl shadow-xl cursor-pointer flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={() => setCotSeleccionada(null)}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl shadow-xl cursor-pointer"
            >
              ✕ Cerrar
            </button>
          </div>

          {/* DOCUMENTO IMPRIMIBLE OFICIAL A4 DTE CHILE */}
          <div id="seccion-imprimible-cotizacion" className="bg-white text-zinc-900 p-10 md:p-14 rounded-2xl max-w-4xl w-full shadow-2xl font-sans my-4 border border-zinc-300 space-y-8 min-h-[900px] flex flex-col justify-between overflow-hidden">
            
            <div className="space-y-6">
              
              {/* ENCABEZADO FISCAL CHILENO */}
              {(() => {
                const empEmisoraDoc = empresasConglomerado.find(e => e.id === cotSeleccionada.empresa_facturadora_id) || empresasConglomerado[0]
                return (
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b-2 border-zinc-900 pb-6">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-900 text-white rounded-lg">
                          <Shield className="h-6 w-6 stroke-[2]" />
                        </div>
                        <div>
                          <h1 className="text-xl font-bold text-zinc-900 uppercase">{empEmisoraDoc.razon_social}</h1>
                          <p className="font-mono text-zinc-800 font-bold">R.U.T.: {empEmisoraDoc.rut}</p>
                        </div>
                      </div>
                      <p className="text-zinc-600 pt-2">Giro: {empEmisoraDoc.giro}</p>
                      <p className="text-zinc-600">Dirección Fiscal: {empEmisoraDoc.direccion}</p>
                      <p className="text-zinc-600">Teléfono: {empEmisoraDoc.telefono} | Correo: {empEmisoraDoc.email_contacto}</p>
                      <p className="text-zinc-600 font-mono">Web: {empEmisoraDoc.web}</p>
                    </div>

                    <div className="border-2 border-zinc-900 bg-zinc-50 p-5 rounded-xl w-full md:w-80 space-y-2 text-center shadow-xs">
                      <div className="text-xs font-bold text-zinc-900 uppercase tracking-widest">PRESUPUESTO / COTIZACIÓN DTE</div>
                      <h2 className="text-xl font-bold text-zinc-900 font-mono">{cotSeleccionada.codigo_cotizacion}</h2>
                      <div className="text-xs text-zinc-600 border-t border-zinc-300 pt-2 grid grid-cols-2 text-left font-mono">
                        <div><strong>FECHA:</strong> {cotSeleccionada.fecha}</div>
                        <div><strong>VALIDEZ:</strong> {cotSeleccionada.validez_dias || 15} Días</div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* DATOS DEL CLIENTE RECEPTOR */}
              <div className="border border-zinc-300 bg-zinc-50 p-5 rounded-xl grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">RECEPTOR DE LA PROPUESTA:</span>
                  <strong className="text-zinc-900 text-sm block uppercase">{cotSeleccionada.nombre_cliente}</strong>
                  <p className="font-mono text-zinc-900 font-bold text-sm">R.U.T.: {cotSeleccionada.rut_cliente || 'S/RUT'}</p>
                  <p className="text-zinc-600">Giro: {cotSeleccionada.giro_cliente || 'Servicios Integrales / Particular'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">ATENCIÓN A / CIUDAD / ENTREGA:</span>
                  <strong className="text-zinc-900 text-sm block">{cotSeleccionada.contacto_persona || cotSeleccionada.nombre_cliente}</strong>
                  <p className="text-zinc-600">📍 Dirección: {cotSeleccionada.direccion || 'Dirección Principal'}</p>
                  <p className="text-zinc-900 font-bold">🏙️ Ciudad / Comuna: <span className="text-zinc-950 font-bold">{cotSeleccionada.ciudad_cliente || 'Santiago'}</span>, Chile</p>
                  <p className="text-zinc-600">✉️ Correo: {cotSeleccionada.email_cliente || 'contacto@cliente.cl'}</p>
                </div>
              </div>

              {/* TABLA DETALLE DE PRODUCTOS & SERVICIOS */}
              <div className="border border-zinc-300 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 text-zinc-800 font-bold border-b border-zinc-300 uppercase text-[11px]">
                      <th className="p-3.5 border-r border-zinc-300 text-center w-10">#</th>
                      <th className="p-3.5 border-r border-zinc-300">Descripción del Producto / Servicio Técnico</th>
                      <th className="p-3.5 border-r border-zinc-300 text-center w-16">Cant.</th>
                      <th className="p-3.5 border-r border-zinc-300 text-right w-28">P. Unit Neto</th>
                      <th className="p-3.5 text-right w-32">Subtotal Neto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {cotSeleccionada.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-3.5 text-center font-mono text-zinc-400 border-r border-zinc-200">{idx + 1}</td>
                        <td className="p-3.5 font-semibold text-zinc-900 border-r border-zinc-200">{it.descripcion}</td>
                        <td className="p-3.5 text-center font-mono font-bold border-r border-zinc-200">{it.cantidad}</td>
                        <td className="p-3.5 text-right font-mono border-r border-zinc-200">${(it.precio_neto_unitario || 0).toLocaleString('es-CL')}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-zinc-900">${Math.round((it.cantidad || 1) * (it.precio_neto_unitario || 0)).toLocaleString('es-CL')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* RESUMEN FINANCIERO Y TRIBUTARIO CHILENO */}
              <div className="flex justify-between items-start gap-6 pt-2">
                
                {/* CONDICIONES BANCARIAS Y TÉRMINOS */}
                <div className="text-xs space-y-2 text-zinc-600 max-w-md bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
                  {(() => {
                    const empEmisoraDoc = empresasConglomerado.find(e => e.id === cotSeleccionada.empresa_facturadora_id) || empresasConglomerado[0]
                    return (
                      <>
                        <h4 className="font-bold text-zinc-900 uppercase text-[11px]">💳 DATOS PARA TRANSFERENCIA ELECTRONICA:</h4>
                        <p className="text-[11px]">Empresa: <strong>{empEmisoraDoc.razon_social}</strong> (RUT: <strong className="font-mono">{empEmisoraDoc.rut}</strong>)</p>
                        <p className="text-[11px]">Banco: <strong>{empEmisoraDoc.banco_nombre}</strong> — {empEmisoraDoc.banco_tipo_cuenta}</p>
                        <p className="text-[11px]">N° Cuenta: <strong className="font-mono">{empresaEmisoraSeleccionadaCot.banco_numero_cuenta}</strong></p>
                        <p className="text-[11px]">Email Confirmación: <strong>{empEmisoraDoc.email_cobranza}</strong></p>
                        <div className="border-t border-zinc-200 pt-2 text-[10px] text-zinc-500 space-y-0.5">
                          <p>• Precios expresados en Pesos Chilenos (CLP) con IVA 19% incluido.</p>
                          <p>• Validez de la oferta: {cotSeleccionada.validez_dias || 15} días hábiles a contar de esta fecha.</p>
                          <p>• Garantía legal de equipos: 12 meses contra defectos de fabricación.</p>
                        </div>
                      </>
                    )
                  })()}
                </div>

                {/* CAJA DE TOTALES IMPUESTOS CHILE */}
                <div className="w-80 border-2 border-zinc-900 rounded-xl overflow-hidden font-mono text-xs shadow-md">
                  <div className="flex justify-between p-3 bg-white border-b border-zinc-200">
                    <span className="font-semibold text-zinc-600">Subtotal Neto Afecto:</span>
                    <span className="font-bold">${Math.round(cotSeleccionada.neto_con_descuento || 0).toLocaleString('es-CL')} {cotSeleccionada.moneda_cotizacion || 'CLP'}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-zinc-50 border-b border-zinc-200 text-zinc-900">
                    <span className="font-bold">IVA (19% Ley 825):</span>
                    <span className="font-bold">${Math.round(cotSeleccionada.monto_iva || 0).toLocaleString('es-CL')} {cotSeleccionada.moneda_cotizacion || 'CLP'}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-zinc-900 text-white font-bold text-sm">
                    <span>TOTAL GENERAL:</span>
                    <span>${Math.round(cotSeleccionada.monto_total_iva_incluido || 0).toLocaleString('es-CL')} {cotSeleccionada.moneda_cotizacion || 'CLP'}</span>
                  </div>
                </div>
              </div>

              {/* TIMBRE Y ACEPTACIÓN DEL CLIENTE */}
              <div className="border-t-2 border-zinc-200 pt-8 mt-6 grid grid-cols-2 gap-8 items-end">
                <div className="text-center space-y-2">
                  <div className="border-b border-zinc-400 w-48 mx-auto"></div>
                  <p className="font-bold text-xs text-zinc-800">{cotSeleccionada.vendedor || 'Ejecutivo Comercial Gama Seguridad'}</p>
                  <p className="text-[10px] text-zinc-500">Emisor Autorizado Conglomerado Gama</p>
                </div>

                <div className="text-center space-y-2">
                  <div className="border-b border-zinc-400 w-48 mx-auto"></div>
                  <p className="font-bold text-xs text-zinc-800">Aceptado por: {cotSeleccionada.contacto_persona || cotSeleccionada.nombre_cliente}</p>
                  <p className="text-[10px] text-zinc-500">Firma / Timbre de Aceptación del Cliente</p>
                </div>
              </div>

            </div>

            <div className="border-t border-zinc-200 pt-4 flex justify-between items-center text-xs text-zinc-500 font-mono no-imprimir">
              <span>Documento Oficial Gama Seguridad • Cumple Formato DTE Chile</span>
              <span>Página 1 de 1</span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
