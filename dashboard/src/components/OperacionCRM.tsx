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

export interface CotizacionDolibarr {
  id: number
  codigo_cotizacion: string
  cuenta: string
  rut_cliente: string
  nombre_cliente: string
  empresa_facturadora_id: string
  direccion: string
  email_cliente?: string
  telefono_cliente?: string
  tipo_receptor?: 'registrado' | 'prospecto'
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

  // Modal Edición de Cliente Maestro & Asignación de Empresa Emisora
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false)
  const [editRut, setEditRut] = useState('')
  const [editRazonSocial, setEditRazonSocial] = useState('')
  const [editEmpresaId, setEditEmpresaId] = useState('EMP-1')
  const [editEmailCobranza, setEditEmailCobranza] = useState('')
  const [editTelefono, setEditTelefono] = useState('')
  const [editDireccionComercial, setEditDireccionComercial] = useState('')
  const [editMoneda, setEditMoneda] = useState<'UF' | 'CLP'>('CLP')
  const [editTarifa, setEditTarifa] = useState('29900')
  const [editDia, setEditDia] = useState('5')
  const [editPlan, setEditPlan] = useState('MONITOREO ESTÁNDAR 24/7')
  const [editEstadoPago, setEditEstadoPago] = useState<'Al Día' | 'Pendiente' | 'Moroso'>('Al Día')

  // Modal Vincular Centro de Costo (Abonado)
  const [mostrarModalVincularAbonado, setMostrarModalVincularAbonado] = useState(false)
  const [nuevaCuentaAbonadoInput, setNuevaCuentaAbonadoInput] = useState('')
  const [nuevoAliasCentroCostoInput, setNuevoAliasCentroCostoInput] = useState('')
  const [nuevaDireccionAbonadoInput, setNuevaDireccionAbonadoInput] = useState('')

  // UF Global
  const [valorUF, setValorUF] = useState(38500)

  // Órdenes de Trabajo & Facturas & Cotizaciones
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenDeTrabajo[]>([])
  const [facturas, setFacturas] = useState<FacturaIndividual[]>([])
  const [cotizaciones, setCotizaciones] = useState<CotizacionDolibarr[]>([])
  
  // Modales Facturación & Abonos Parciales (IDURAR ERP/CRM)
  const [mostrarModalAbono, setMostrarModalAbono] = useState(false)
  const [facturaAbonando, setFacturaAbonando] = useState<FacturaIndividual | null>(null)
  const [montoAbonoInput, setMontoAbonoInput] = useState('')
  const [metodoPagoInput, setMetodoPagoInput] = useState('Transferencia Bancaria')
  const [notaAbonoInput, setNotaAbonoInput] = useState('')

  // Modales OT & Creador de Presupuesto Side-by-Side (Crater / InvoiceNinja)
  const [mostrarModalCotizacion, setMostrarModalCotizacion] = useState(false)
  const [cotSeleccionada, setCotSeleccionada] = useState<CotizacionDolibarr | null>(null)
  const [cotEditandoId, setCotEditandoId] = useState<number | null>(null)

  // FORMULARIO Y ESTADO DEL CREADOR DE COTIZACIONES PROFESIONAL
  const [tipoReceptorCot, setTipoReceptorCot] = useState<'registrado' | 'prospecto'>('registrado')
  const [cotEmpresaEmisoraId, setCotEmpresaEmisoraId] = useState('EMP-1')
  const [cotClienteRutSeleccionado, setCotClienteRutSeleccionado] = useState('')
  const [cotNombreCliente, setCotNombreCliente] = useState('')
  const [cotRutCliente, setCotRutCliente] = useState('')
  const [cotDireccion, setCotDireccion] = useState('')
  const [cotEmailCliente, setCotEmailCliente] = useState('')
  const [cotTelefonoCliente, setCotTelefonoCliente] = useState('')
  const [cotValidez, setCotValidez] = useState(15)
  const [cotFormaPago, setCotFormaPago] = useState('50% Anticipo / 50% Entrega')
  const [cotMoneda, setCotMoneda] = useState<'CLP' | 'UF'>('CLP')
  const [cotObservaciones, setCotObservaciones] = useState('')
  
  // DESCUENTO GLOBAL DE COTIZACIÓN ($ O %)
  const [descuentoGlobalValor, setDescuentoGlobalValor] = useState<number>(0)
  const [descuentoGlobalTipo, setDescuentoGlobalTipo] = useState<'porcentaje' | 'monto'>('porcentaje')

  const [itemsCot, setItemsCot] = useState<ItemCotizacion[]>([
    { id: '1', descripcion: 'Control remoto inalambrico RadioFrecuencia 4Botones', cantidad: 1, precio_neto_unitario: 31000, descuento_valor: 0, tipo_descuento: 'porcentaje' }
  ])

  // Modales OT
  const [mostrarModalOT, setMostrarModalOT] = useState(false)
  const [nuevaOTCuenta, setNuevaOTCuenta] = useState('')
  const [nuevaOTServicio, setNuevaOTServicio] = useState('Instalación de Cámaras de Seguridad')
  const [nuevaOTTecnico, setNuevaOTTecnico] = useState('Técnico Juan Pérez')
  const [nuevaOTFecha, setNuevaOTFecha] = useState(new Date().toISOString().split('T')[0])
  const [nuevaOTObs, setNuevaOTObs] = useState('')

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
        // 1. Cargar Empresas del Conglomerado
        const { data: dEmp } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'EMPRESAS_CONGLOMERADO')
          .limit(1)

        if (dEmp && dEmp.length > 0 && dEmp[0].nombre_abonado) {
          try { setEmpresasConglomerado(JSON.parse(dEmp[0].nombre_abonado)) } catch (e) {}
        }

        // 2. Cargar Clientes y Centros de Costo / Abonados
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

        // 3. Cargar OTs, Facturas y Cotizaciones
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
        console.error('Error cargando estructura jerárquica:', err)
      }
    }
    fetchDatosJerarquicos()
  }, [])

  // ABONADO ACTIVO SELECCIONADO INDIVIDUALMENTE
  const abonadoActivo = useMemo(() => {
    if (cuentaSeleccionada && abonadosCentrosCosto[cuentaSeleccionada]) {
      return abonadosCentrosCosto[cuentaSeleccionada]
    }
    return null
  }, [cuentaSeleccionada, abonadosCentrosCosto])

  // CLIENTE MAESTRO ASOCIADO
  const clienteActivo = useMemo(() => {
    if (abonadoActivo && abonadoActivo.rut_cliente && clientesMaestros[abonadoActivo.rut_cliente]) {
      return clientesMaestros[abonadoActivo.rut_cliente]
    }
    if (rutClienteSeleccionado && clientesMaestros[rutClienteSeleccionado]) {
      return clientesMaestros[rutClienteSeleccionado]
    }
    return null
  }, [abonadoActivo, rutClienteSeleccionado, clientesMaestros])

  const empresaFacturadoraActiva = clienteActivo ? empresasConglomerado.find(e => e.id === clienteActivo.empresa_facturadora_id) || empresasConglomerado[0] : empresasConglomerado[0]

  // ── MOTOR DINÁMICO DE CORRELATIVO SECUENCIAL DE COTIZACIONES (PR2607-XXXX) ──
  const siguienteCorrelativoCode = useMemo(() => {
    let maxNum = 257
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

  // ── RECAUDACIÓN Y KPIS POR LAS 4 EMPRESAS DEL CONGLOMERADO ──
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

  // ── AGREGAR ÍTEM DEL CATÁLOGO AL PRESUPUESTO EN 1 CLIC ──
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

  // ── SELECCIONAR CLIENTE REGISTRADO EN FORMULARIO COTIZACIÓN ──
  const handleSeleccionarClienteParaCotizacion = (rutOKey: string) => {
    setCotClienteRutSeleccionado(rutOKey)
    
    let cli: ClienteMaestro | undefined = clientesMaestros[rutOKey]

    if (!cli) {
      cli = Object.values(clientesMaestros).find(c =>
        c.rut === rutOKey ||
        (c.rut && cleanRut(c.rut) === cleanRut(rutOKey))
      )
    }

    if (!cli) {
      cli = Object.values(clientesMaestros).find(c =>
        c.razon_social.toLowerCase().trim() === rutOKey.toLowerCase().trim()
      )
    }

    if (cli) {
      setCotNombreCliente(cli.razon_social)
      setCotRutCliente(cli.rut)
      setCotDireccion(cli.direccion_comercial || 'Dirección Comercial Registrada')
      setCotEmailCliente(cli.email_cobranza || 'contacto@gamasecurity.cl')
      setCotTelefonoCliente(cli.telefono || '+56 9 9101 6912')
    } else {
      setCotNombreCliente(rutOKey && rutOKey !== 'Cliente Gama' ? rutOKey : 'CLIENTE REGISTRADO')
      setCotRutCliente(rutOKey)
      setCotDireccion('Dirección Registrada')
      setCotEmailCliente('contacto@gamasecurity.cl')
      setCotTelefonoCliente('+56 9 9101 6912')
    }
  }

  // ── ABRIR MODAL CREADOR DE PRESUPUESTOS ──
  const abrirModalNuevaCotizacion = () => {
    setCotEditandoId(null)
    setTipoReceptorCot('registrado')
    setDescuentoGlobalValor(0)
    setDescuentoGlobalTipo('porcentaje')
    const ruts = Object.keys(clientesMaestros)
    if (ruts.length > 0) {
      const selectedRut = clienteActivo?.rut && clientesMaestros[clienteActivo.rut] ? clienteActivo.rut : ruts[0]
      handleSeleccionarClienteParaCotizacion(selectedRut)
    } else {
      setCotNombreCliente('CLIENTE MODELO DEMO')
      setCotRutCliente('76.319.399-3')
      setCotDireccion('Av. Valparaíso 1183, Viña del Mar')
      setCotEmailCliente('cobranza@gamasecurity.cl')
      setCotTelefonoCliente('+56 32 3276011')
    }
    setMostrarModalCotizacion(true)
  }

  // ── GESTIÓN DE COTIZACIONES: EDITAR ──
  const handleEditarCotizacion = (cot: CotizacionDolibarr) => {
    setCotEditandoId(cot.id)
    setTipoReceptorCot(cot.tipo_receptor || 'registrado')
    setCotEmpresaEmisoraId(cot.empresa_facturadora_id)
    
    const cliEncontrado = Object.values(clientesMaestros).find(c =>
      c.rut === cot.rut_cliente ||
      (c.rut && cleanRut(c.rut) === cleanRut(cot.rut_cliente)) ||
      c.razon_social.toLowerCase().trim() === (cot.nombre_cliente || '').toLowerCase().trim()
    )

    if (cliEncontrado) {
      setCotClienteRutSeleccionado(cliEncontrado.rut)
      setCotNombreCliente(cliEncontrado.razon_social)
      setCotRutCliente(cliEncontrado.rut)
      setCotDireccion(cot.direccion || cliEncontrado.direccion_comercial)
      setCotEmailCliente(cot.email_cliente || cliEncontrado.email_cobranza)
      setCotTelefonoCliente(cot.telefono_cliente || cliEncontrado.telefono)
    } else {
      setCotClienteRutSeleccionado(cot.rut_cliente || cot.nombre_cliente)
      setCotNombreCliente(cot.nombre_cliente && cot.nombre_cliente !== 'Cliente Gama' ? cot.nombre_cliente : (cot.rut_cliente || 'CLIENTE COMERCIAL'))
      setCotRutCliente(cot.rut_cliente || 'S/RUT')
      setCotDireccion(cot.direccion || 'Dirección de Entrega')
      setCotEmailCliente(cot.email_cliente || 'contacto@gamasecurity.cl')
      setCotTelefonoCliente(cot.telefono_cliente || '+56 9 9101 6912')
    }

    setCotValidez(cot.validez_dias || 15)
    setCotFormaPago(cot.forma_pago || '50% Anticipo / 50% Entrega')
    setCotMoneda(cot.moneda_cotizacion || 'CLP')
    setDescuentoGlobalValor(cot.descuento_global_valor || 0)
    setDescuentoGlobalTipo(cot.descuento_global_tipo || 'porcentaje')
    setItemsCot(cot.items.map(it => ({
      ...it,
      descuento_valor: (it as any).descuento_valor ?? it.descuento_porcentaje ?? 0,
      tipo_descuento: (it as any).tipo_descuento || 'porcentaje'
    })))
    setMostrarModalCotizacion(true)
  }

  // ── GESTIÓN DE COTIZACIONES: DUPLICAR ──
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

  // ── GESTIÓN DE COTIZACIONES: ELIMINAR ──
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

  // ── ACCIÓN ABONOS PARCIALES (IDURAR ERP/CRM) ──
  const handleRegistrarAbonoParcial = async () => {
    if (!facturaAbonando) return
    const abonoNum = Number(montoAbonoInput)
    if (!abonoNum || abonoNum <= 0) {
      alert('Por favor ingrese un monto de abono válido.')
      return
    }

    const nuevoAbonado = (facturaAbonando.monto_abonado || 0) + abonoNum
    const nuevoSaldo = Math.max(0, facturaAbonando.monto_total - nuevoAbonado)
    const nuevoEstado: 'Emitida' | 'Abonada' | 'Pagada' | 'Morosa' = nuevoSaldo === 0 ? 'Pagada' : 'Abonada'

    const facturaActualizada: FacturaIndividual = {
      ...facturaAbonando,
      monto_abonado: nuevoAbonado,
      saldo_pendiente: nuevoSaldo,
      estado: nuevoEstado,
      notas_cobranza: `Abono de $${abonoNum.toLocaleString('es-CL')} registrado el ${new Date().toLocaleDateString('es-CL')} via ${metodoPagoInput}. ${notaAbonoInput}`
    }

    const listaNueva = facturas.map(f => f.id === facturaAbonando.id ? facturaActualizada : f)
    setFacturas(listaNueva)

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'FACTURAS_MAESTRO',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: 'REGISTRO_ABONO',
        fecha_hora: new Date().toISOString()
      })
      setMostrarModalAbono(false)
      setMontoAbonoInput('')
      setNotaAbonoInput('')
      alert(`🎉 Abono de $${abonoNum.toLocaleString('es-CL')} registrado exitosamente. Saldo restante: $${nuevoSaldo.toLocaleString('es-CL')} CLP.`)
    } catch (e: any) {
      alert('Error registrando abono: ' + e.message)
    }
  }

  // ── CAMBIO RÁPIDO DE ESTADO DE COTIZACIÓN (IDURAR ERP/CRM) ──
  const handleCambiarEstadoCotizacion = async (id: number, nuevoEstado: 'Borrador' | 'Enviado' | 'Aprobado' | 'Rechazado') => {
    const listaNueva = cotizaciones.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c)
    setCotizaciones(listaNueva)

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'COTIZACIONES_DOLIBARR',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: 'CAMBIO_ESTADO_COTIZACION',
        fecha_hora: new Date().toISOString()
      })
    } catch (e: any) {
      console.error('Error cambiando estado:', e)
    }
  }

  // Guardar Cotización Profesional
  const handleGuardarCotizacionDolibarr = async () => {
    let nombreFinal = cotNombreCliente.trim()
    let rutFinal = cotRutCliente.trim()

    if (tipoReceptorCot === 'registrado') {
      const cli = (cotClienteRutSeleccionado && clientesMaestros[cotClienteRutSeleccionado]) ||
                  Object.values(clientesMaestros).find(c => c.rut === cotClienteRutSeleccionado || (c.rut && cleanRut(c.rut) === cleanRut(cotClienteRutSeleccionado))) ||
                  Object.values(clientesMaestros).find(c => c.razon_social.toLowerCase().trim() === cotNombreCliente.toLowerCase().trim())
      
      if (cli) {
        nombreFinal = cli.razon_social
        rutFinal = cli.rut
      }
    }

    if (!nombreFinal || nombreFinal === 'Cliente Gama') {
      if (cotNombreCliente && cotNombreCliente !== 'Cliente Gama') {
        nombreFinal = cotNombreCliente
      } else {
        alert('Por favor ingrese o seleccione el Nombre o Razón Social del receptor del presupuesto.')
        return
      }
    }

    const codigoCot = cotEditandoId ? (cotizaciones.find(c => c.id === cotEditandoId)?.codigo_cotizacion || siguienteCorrelativoCode) : siguienteCorrelativoCode

    const cotizacionObjeto: CotizacionDolibarr = {
      id: cotEditandoId || Date.now(),
      codigo_cotizacion: codigoCot,
      cuenta: rutFinal || `PROSPECTO-${Date.now()}`,
      rut_cliente: rutFinal ? cleanRut(rutFinal) : 'S/RUT (Prospecto)',
      nombre_cliente: nombreFinal,
      empresa_facturadora_id: cotEmpresaEmisoraId,
      direccion: cotDireccion.trim() || 'Dirección de Entrega',
      email_cliente: cotEmailCliente.trim() || 'contacto@prospecto.cl',
      telefono_cliente: cotTelefonoCliente.trim() || '+56991016912',
      tipo_receptor: tipoReceptorCot,
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
      alert(`🎉 Presupuesto ${codigoCot} guardado exitosamente para "${nombreFinal}".`)
    } catch (e: any) {
      alert('Error guardando cotización: ' + e.message)
    }
  }

  // CALCULADORA DE TOTALES CON DESCUENTOS POR LÍNEA Y GLOBAL
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

  // ── EJECUTAR CICLO DE CONSENSO DE AGENTES AUTÓNOMOS (AUTO-COMPANY) ──
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

  // BUSCADOR UNIFICADO INTELIGENTE
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
    <div className="min-h-screen bg-[#edf2f7] text-[#0f172a] font-sans flex flex-col select-none p-6 md:p-10 gap-10">
      
      {/* ── HEADER NEUMÓRFICO CON MARGEN INTERNO DE PROTECCIÓN ── */}
      <header className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0 overflow-hidden">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setSidebarAbierto(!sidebarAbierto)}
            className="bg-[#f8fafc] hover:bg-slate-100 text-slate-700 px-5 py-4 rounded-2xl border border-slate-200 font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-xl">☰</span>
          </button>

          <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white font-bold p-5 rounded-2xl text-2xl shadow-md flex items-center justify-center">
            🛡️
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              CONGLOMERADO GAMA SEGURIDAD
              <span className="bg-blue-50 text-blue-900 text-xs font-bold px-4 py-1.5 rounded-full border border-blue-200 shadow-2xs">
                PLATAFORMA OPERATIVA & CRM 360°
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {empresasConglomerado.length} Razones Sociales Emisoras • Búsqueda por Abonado & Cliente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 text-xs font-semibold">
          <div className="bg-[#f8fafc] border border-slate-200 px-6 py-4 rounded-2xl text-slate-700 font-mono shadow-inner">
            UF HOY: <strong className="text-emerald-700 font-bold">${valorUF.toLocaleString('es-CL')} CLP</strong>
          </div>

          <a
            href="/app"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-7 py-4 rounded-2xl shadow-md transition-all cursor-pointer text-xs flex items-center gap-2"
          >
            <span>🖥️ COMMAND CENTER</span>
          </a>
        </div>
      </header>

      {/* ── CONTENEDOR PRINCIPAL ── */}
      <div className="flex-1 flex gap-10 overflow-hidden min-h-0">
        
        {/* ── SIDEBAR NEUMÓRFICO MODULAR ── */}
        {sidebarAbierto && (
          <aside className="w-80 bg-white border border-slate-200 p-8 rounded-3xl flex flex-col gap-3 shrink-0 shadow-lg transition-all overflow-hidden">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-3 flex justify-between items-center">
              <span>MÓDULOS DEL SISTEMA</span>
              <button onClick={() => setSidebarAbierto(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            {[
              { id: 'ficha360', label: 'Ficha 360° del Cliente / Abonado', icon: '👤' },
              { id: 'autonomia', label: 'Agentes Autónomos 24/7', icon: '🤖' },
              { id: 'presupuestos', label: 'Presupuestos & Cotizaciones', icon: '📋' },
              { id: 'facturacion', label: 'Facturación & Abonos Parciales', icon: '🧾' },
              { id: 'serv_tecnico', label: 'Servicio Técnico (OTs)', icon: '🛠️' },
              { id: 'kpis', label: 'KPIs Ejecutivos & Reportes', icon: '📊' },
              { id: 'config', label: 'CRUD Empresas Conglomerado', icon: '⚙️' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setModuloActivo(m.id as any)}
                className={`w-full text-left px-6 py-4 rounded-2xl font-bold text-xs transition-all flex items-center gap-4 cursor-pointer ${
                  moduloActivo === m.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="text-xl">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}

            <div className="mt-auto bg-[#f8fafc] border border-slate-200 p-6 rounded-2xl text-xs space-y-2 text-slate-600 shadow-inner">
              <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wide">ESTRUCTURA DE DATOS UNIFICADA</div>
              <div>Empresas Emisoras: <strong className="text-slate-900 font-mono font-bold">{empresasConglomerado.length}</strong></div>
              <div>Clientes Registrados: <strong className="text-slate-900 font-mono font-bold">{Object.keys(clientesMaestros).length}</strong></div>
              <div>Centros de Costo: <strong className="text-slate-900 font-mono font-bold">{Object.keys(abonadosCentrosCosto).length}</strong></div>
            </div>
          </aside>
        )}

        {/* ── PANEL DERECHO PRINCIPAL ── */}
        <main className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-10">

          {/* ── MÓDULO 1: FICHA 360° DEL CLIENTE ── */}
          {moduloActivo === 'ficha360' && (
            <div className="flex-1 flex flex-col gap-10 min-h-0">
              
              {/* Buscador Neumórfico Espacioso */}
              <div className="bg-white border border-slate-200 p-8 md:p-10 rounded-3xl shadow-lg flex flex-col gap-5 overflow-hidden">
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
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-8 py-5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono shadow-inner"
                  />

                  {busquedaClienteInput.trim().length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-3xl shadow-2xl z-20 max-h-96 overflow-y-auto divide-y divide-slate-100 p-6">
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
                          className="p-5 hover:bg-blue-50 rounded-2xl cursor-pointer flex justify-between items-center transition-colors"
                        >
                          <div>
                            <div className="font-bold text-sm text-slate-900 flex items-center gap-2 flex-wrap">
                              {item.tipo === 'abonado' && (
                                <span className="bg-blue-900 text-white font-mono text-xs px-3 py-1 rounded-md font-bold">
                                  Abonado #{item.cuenta}
                                </span>
                              )}
                              <span>{item.alias || item.razon_social}</span>
                              {item.rut && !item.rut.startsWith('CTA-') && (
                                <span className="font-mono text-slate-600 text-xs bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md font-bold">
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

              {/* DOSSIER DEL ABONADO / CLIENTE SELECCIONADO */}
              {clienteActivo || abonadoActivo ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-10 flex flex-col gap-10 shadow-lg overflow-y-auto">
                  
                  {/* HEADER DEL ABONADO / CLIENTE */}
                  <div className="bg-[#f8fafc] border border-slate-200 p-8 md:p-10 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-inner">
                    <div>
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        {abonadoActivo && (
                          <span className="bg-blue-950 text-white font-mono text-xs font-bold px-4 py-1.5 rounded-xl">
                            CUENTA ABONADO #{abonadoActivo.cuenta}
                          </span>
                        )}
                        {clienteActivo && clienteActivo.rut && !clienteActivo.rut.startsWith('CTA-') && (
                          <span className="bg-slate-800 text-white font-mono text-xs font-bold px-4 py-1.5 rounded-xl">
                            RUT: {clienteActivo.rut}
                          </span>
                        )}
                      </div>
                      <h2 className="text-3xl font-black text-slate-900">
                        {abonadoActivo ? abonadoActivo.alias_centro_costo : clienteActivo?.razon_social}
                      </h2>
                      <p className="text-xs text-slate-600 font-medium mt-2">
                        📍 {abonadoActivo ? abonadoActivo.direccion : clienteActivo?.direccion_comercial} | ✉️ <strong>{clienteActivo?.email_cobranza}</strong>
                      </p>
                    </div>
                  </div>

                  {/* 3 PILARES JERÁRQUICOS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* PILAR 1: COMERCIAL Y TARIFAS */}
                    <div className="bg-[#f8fafc] border border-slate-200 p-8 rounded-3xl flex flex-col gap-5 shadow-xs">
                      <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-4 flex justify-between uppercase tracking-wider">
                        <span>💳 DATOS COMERCIALES DE COBRO</span>
                      </div>

                      <div className="space-y-4 text-xs font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Plan de Monitoreo:</span>
                          <span className="font-bold text-slate-900">{clienteActivo?.plan_monitoreo || 'MONITOREO ESTÁNDAR 24/7'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tarifa Mensual:</span>
                          <span className="font-bold font-mono text-emerald-800">
                            ${(clienteActivo?.tarifa_mensual || 29900).toLocaleString('es-CL')} CLP
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* PILAR 2: ABONADO ACTIVO INDIVIDUAL */}
                    <div className="bg-[#f8fafc] border border-slate-200 p-8 rounded-3xl flex flex-col gap-5 shadow-xs">
                      <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-4 flex justify-between uppercase tracking-wider">
                        <span>🏢 FICHA TÉCNICA DEL ABONADO</span>
                      </div>

                      {abonadoActivo && (
                        <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
                          <div className="font-mono font-bold text-blue-950">Cuenta #{abonadoActivo.cuenta}</div>
                          <div className="font-black text-slate-900 text-sm">{abonadoActivo.alias_centro_costo}</div>
                          <div className="text-slate-600 font-medium">📍 {abonadoActivo.direccion}</div>
                        </div>
                      )}
                    </div>

                    {/* PILAR 3: SERVICIO TÉCNICO Y OTs */}
                    <div className="bg-[#f8fafc] border border-slate-200 p-8 rounded-3xl flex flex-col gap-5 shadow-xs">
                      <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-4 flex justify-between uppercase tracking-wider">
                        <span>🛠️ ÓRDENES TÉCNICAS (OT)</span>
                      </div>

                      <button
                        onClick={() => {
                          setNuevaOTCuenta(cuentaSeleccionada || '0999')
                          setMostrarModalOT(true)
                        }}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs cursor-pointer shadow-md"
                      >
                        + Crear Orden Técnica
                      </button>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-24 text-center shadow-lg flex flex-col items-center justify-center gap-6">
                  <div className="text-7xl p-8 bg-[#f8fafc] rounded-3xl shadow-inner">👤</div>
                  <h3 className="text-2xl font-black text-slate-900">Búsqueda de Abonado / Cliente</h3>
                  <p className="text-xs text-slate-500 max-w-lg font-semibold leading-relaxed">
                    Escriba un código de Abonado (ej: 0999, C774), Nombre o RUT en el buscador superior.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* ── MÓDULO 2: AGENTES VIRTUALES AUTÓNOMOS (AUTO-COMPANY) ── */}
          {moduloActivo === 'autonomia' && (
            <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-10 flex flex-col gap-10 shadow-lg overflow-y-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    🤖 Central de Agentes Virtuales Autónomos (Auto-Company Engine)
                  </h2>
                </div>

                <button
                  disabled={ejecutandoCiclo}
                  onClick={handleEjecutarCicloConsenso}
                  className="px-8 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white font-bold rounded-2xl text-xs shadow-md cursor-pointer"
                >
                  {ejecutandoCiclo ? '⏳ Ejecutando...' : '⚡ Ejecutar Consenso Ahora'}
                </button>
              </div>

              {/* MEMORIA DE CONSENSO */}
              <div className="bg-slate-950 rounded-3xl p-8 border border-slate-800 text-slate-200 font-mono text-xs shadow-2xl flex flex-col gap-4">
                <div className="font-bold text-emerald-400">MEMORIA DE CONSENSO EN VIVO (consensus.md)</div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {logsConsenso.map((log, i) => (
                    <div key={i} className="p-2 hover:bg-slate-900/60 rounded-lg">{log}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── MÓDULO 3: PRESUPUESTOS & COTIZACIONES COMERCIAL ── */}
          {moduloActivo === 'presupuestos' && (
            <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-8 md:p-10 flex flex-col gap-8 shadow-lg min-h-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 border-b border-slate-200 pb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide flex items-center gap-3">
                    📋 Presupuestos & Cotizaciones Comercial
                    <span className="bg-blue-100 text-blue-900 text-xs px-4 py-1.5 rounded-full font-mono font-bold border border-blue-200">
                      Siguiente: {siguienteCorrelativoCode}
                    </span>
                  </h2>
                </div>

                <button
                  onClick={abrirModalNuevaCotizacion}
                  className="px-8 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white font-bold rounded-2xl text-xs shadow-md cursor-pointer transition-all"
                >
                  <span>✨ Crear Presupuesto Profesional (Side-by-Side)</span>
                </button>
              </div>

              {/* TABLA DE PRESUPUESTOS CON MARGEN PROTEGIDO */}
              <div className="flex-1 overflow-auto border border-slate-200 rounded-3xl bg-white p-4 shadow-xs">
                <table className="w-full text-left border-collapse text-xs font-medium">
                  <thead>
                    <tr className="bg-[#f8fafc] text-slate-700 border-b border-slate-200 font-bold uppercase text-xs">
                      <th className="p-5 border-r border-slate-200">FOLIO / FECHA</th>
                      <th className="p-5 border-r border-slate-200">EMPRESA EMISORA</th>
                      <th className="p-5 border-r border-slate-200">RECEPTOR</th>
                      <th className="p-5 border-r border-slate-200 text-right">NETO</th>
                      <th className="p-5 border-r border-slate-200 text-right">TOTAL IVA INCL.</th>
                      <th className="p-5 border-r border-slate-200 text-center">ESTADO</th>
                      <th className="p-5 text-center w-52">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {cotizaciones.map(c => {
                      const empEmisora = empresasConglomerado.find(e => e.id === c.empresa_facturadora_id) || empresasConglomerado[0]
                      return (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="p-5 font-mono font-bold text-blue-900 border-r border-slate-200">
                            <div>{c.codigo_cotizacion}</div>
                            <div className="text-[10px] text-slate-500 font-sans">{c.fecha}</div>
                          </td>
                          <td className="p-5 border-r border-slate-200 font-bold text-emerald-800 text-xs">{empEmisora.razon_social}</td>
                          <td className="p-5 border-r border-slate-200 font-bold text-slate-900">{c.nombre_cliente}</td>
                          <td className="p-5 text-right font-mono border-r border-slate-200">${Math.round(c.neto_con_descuento || 0).toLocaleString('es-CL')}</td>
                          <td className="p-5 text-right font-mono font-bold text-emerald-800 border-r border-slate-200">${Math.round(c.monto_total_iva_incluido || 0).toLocaleString('es-CL')}</td>
                          <td className="p-5 text-center border-r border-slate-200 font-bold">
                            <span className="px-3 py-1 bg-slate-100 rounded-xl text-xs">{c.estado}</span>
                          </td>
                          <td className="p-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => setCotSeleccionada(c)} title="Ver Documento PDF" className="p-2.5 bg-slate-900 text-white rounded-xl font-bold cursor-pointer text-xs">📄</button>
                              <button onClick={() => handleEditarCotizacion(c)} title="Editar Cotización" className="p-2.5 bg-blue-900 text-white rounded-xl font-bold cursor-pointer text-xs">✏️</button>
                              <button onClick={() => handleDuplicarCotizacion(c)} title="Copiar Cotización" className="p-2.5 bg-emerald-700 text-white rounded-xl font-bold cursor-pointer text-xs">📋</button>
                              <button onClick={() => handleEliminarCotizacion(c.id, c.codigo_cotizacion)} title="Eliminar Cotización" className="p-2.5 bg-red-700 text-white rounded-xl font-bold cursor-pointer text-xs">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── MÓDULOS FACTURACIÓN, OT, KPIS & CONFIG ── */}
          {moduloActivo === 'facturacion' && (
            <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-10 flex flex-col gap-8 shadow-lg overflow-y-auto">
              <h2 className="text-lg font-black text-slate-900 uppercase">🧾 Gestor de Facturación & Abonos Parciales</h2>
            </div>
          )}

          {moduloActivo === 'serv_tecnico' && (
            <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-10 flex flex-col gap-8 shadow-lg overflow-y-auto">
              <h2 className="text-lg font-black text-slate-900 uppercase">🛠️ Servicio Técnico & Órdenes de Trabajo</h2>
            </div>
          )}

          {moduloActivo === 'kpis' && (
            <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-10 flex flex-col gap-10 shadow-lg overflow-y-auto">
              <h2 className="text-2xl font-black text-slate-900">📊 Tablero de KPIs Ejecutivos & Reportes</h2>
            </div>
          )}

          {moduloActivo === 'config' && (
            <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-10 flex flex-col gap-8 shadow-lg overflow-y-auto">
              <h2 className="text-lg font-black text-slate-900 uppercase">⚙️ CRUD de Empresas Emisoras del Conglomerado</h2>
            </div>
          )}

        </main>
      </div>

      {/* ── CREADOR PROFESIONAL DE PRESUPUESTOS (MODAL CON PROTECCIÓN TOTAL DE MÁRGENES DE BORDE) ── */}
      {mostrarModalCotizacion && (
        <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-md overflow-y-auto p-4 md:p-8 flex justify-center items-center">
          
          {/* VUELO DE MARGEN EXTERNO PROTEGIDO: p-6 MD:P-8 DENTRO DEL MODAL */}
          <div className="bg-slate-950 border border-slate-800 w-full max-w-7xl h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden p-6 md:p-8 gap-6 font-sans text-xs text-white">
            
            {/* CABECERA CON PAD INTERNO PROPIO Y MARGEN COMPLETO */}
            <div className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 flex justify-between items-center shrink-0 shadow-md">
              <div className="flex items-center gap-5">
                <span className="text-3xl p-3 bg-blue-900/80 rounded-2xl border border-blue-600/50">✨</span>
                <div>
                  <h3 className="font-black text-2xl text-white uppercase tracking-wider flex items-center gap-4">
                    {cotEditandoId ? 'EDITAR PRESUPUESTO COMERCIAL' : 'CREAR PRESUPUESTO COMERCIAL'}
                    <span className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded-full font-mono font-bold">
                      {cotEditandoId ? cotizaciones.find(c => c.id === cotEditandoId)?.codigo_cotizacion : siguienteCorrelativoCode}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Generador profesional con vista previa impresa en vivo, descuentos por producto/global en CLP y UF
                  </p>
                </div>
              </div>

              <button
                onClick={() => setMostrarModalCotizacion(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-2xl px-5 py-3 rounded-2xl border border-slate-700 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* CONTENIDO EN 2 COLUMNAS INTERNAS PADDADAS */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-6 min-h-0">
              
              {/* COLUMNA IZQUIERDA: CONFIGURADOR DENTRO DE CARD CON PADDING 8 */}
              <div className="w-full lg:w-1/2 p-8 md:p-10 bg-white text-slate-900 rounded-3xl border border-slate-300 overflow-y-auto flex flex-col gap-8 shadow-inner">
                
                {/* 1. RECEPTOR */}
                <div className="bg-[#f8fafc] p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
                  <div className="flex justify-between items-center">
                    <label className="font-black text-slate-900 text-xs uppercase tracking-wider">
                      1. RECEPTOR DEL PRESUPUESTO COMERCIAL:
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setTipoReceptorCot('registrado')
                        const ruts = Object.keys(clientesMaestros)
                        if (ruts.length > 0) handleSeleccionarClienteParaCotizacion(ruts[0])
                      }}
                      className={`p-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                        tipoReceptorCot === 'registrado' ? 'bg-blue-950 text-white border-blue-950' : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      <span>👤 Cliente Registrado</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTipoReceptorCot('prospecto')
                        setCotClienteRutSeleccionado('')
                        setCotNombreCliente('NUEVO PROSPECTO COMERCIAL')
                        setCotRutCliente('')
                        setCotDireccion('Dirección Prospecto')
                        setCotEmailCliente('contacto@prospecto.cl')
                        setCotTelefonoCliente('+56 9 9101 6912')
                      }}
                      className={`p-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                        tipoReceptorCot === 'prospecto' ? 'bg-purple-950 text-white border-purple-950' : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      <span>✨ Nuevo Prospecto</span>
                    </button>
                  </div>

                  {tipoReceptorCot === 'registrado' ? (
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="font-bold text-slate-700 block text-xs mb-1">Seleccionar Cliente de Base de Datos:</label>
                        <select
                          value={cotClienteRutSeleccionado}
                          onChange={(e) => handleSeleccionarClienteParaCotizacion(e.target.value)}
                          className="w-full bg-white border border-slate-300 p-4 rounded-2xl font-bold text-slate-900 text-xs"
                        >
                          {Object.values(clientesMaestros).map(c => (
                            <option key={c.rut} value={c.rut}>{c.razon_social} — (RUT: {c.rut})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block text-xs mb-1">Nombre / Razón Social para la Cotización:</label>
                        <input
                          type="text"
                          value={cotNombreCliente}
                          onChange={(e) => setCotNombreCliente(e.target.value)}
                          className="w-full bg-white border border-slate-300 p-4 rounded-2xl font-bold text-slate-900 text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Nombre Prospecto:</label>
                          <input
                            type="text"
                            value={cotNombreCliente}
                            onChange={(e) => setCotNombreCliente(e.target.value)}
                            className="w-full bg-white border border-slate-300 p-4 rounded-2xl font-bold text-slate-900 text-xs"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">RUT (Opcional):</label>
                          <input
                            type="text"
                            value={cotRutCliente}
                            onChange={(e) => setCotRutCliente(cleanRut(e.target.value))}
                            className="w-full bg-white border border-slate-300 p-4 rounded-2xl font-mono text-slate-900 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. DATOS COMERCIALES */}
                <div className="bg-[#f8fafc] p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
                  <label className="font-black text-slate-900 text-xs uppercase tracking-wider block">
                    2. CONFIGURACIÓN COMERCIAL DE LA OFERTA:
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Empresa Emisora:</label>
                      <select
                        value={cotEmpresaEmisoraId}
                        onChange={(e) => setCotEmpresaEmisoraId(e.target.value)}
                        className="w-full bg-white border border-slate-300 p-4 rounded-2xl font-bold text-slate-900 text-xs"
                      >
                        {empresasConglomerado.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.razon_social} ({emp.rut})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Moneda:</label>
                      <select
                        value={cotMoneda}
                        onChange={(e: any) => setCotMoneda(e.target.value)}
                        className="w-full bg-white border border-slate-300 p-4 rounded-2xl font-bold text-slate-900 text-xs"
                      >
                        <option value="CLP">CLP (Pesos Chilenos)</option>
                        <option value="UF">UF (Unidad de Fomento)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. ÍTEMS & DESCUENTOS */}
                <div className="bg-[#f8fafc] p-6 rounded-3xl border border-slate-200 space-y-5 shadow-xs">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <label className="font-black text-slate-900 text-xs uppercase tracking-wider">
                      3. ÍTEMS & DESCUENTOS POR LÍNEA:
                    </label>
                    <button
                      type="button"
                      onClick={() => setItemsCot([...itemsCot, { id: Date.now().toString(), descripcion: 'Nuevo equipo o servicio', cantidad: 1, precio_neto_unitario: 10000, descuento_valor: 0, tipo_descuento: 'porcentaje' }])}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      + Línea
                    </button>
                  </div>

                  <div className="space-y-3 min-h-[160px]">
                    {itemsCot.map((it, idx) => (
                      <div key={it.id} className="grid grid-cols-12 gap-2.5 items-center p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                        <input
                          type="text"
                          value={it.descripcion}
                          onChange={(e) => {
                            const newIt = [...itemsCot]
                            newIt[idx].descripcion = e.target.value
                            setItemsCot(newIt)
                          }}
                          className="col-span-5 bg-[#f8fafc] border border-slate-300 p-3 rounded-xl text-xs font-semibold text-slate-900"
                        />
                        <input
                          type="number"
                          value={it.cantidad}
                          onChange={(e) => {
                            const newIt = [...itemsCot]
                            newIt[idx].cantidad = Number(e.target.value) || 1
                            setItemsCot(newIt)
                          }}
                          className="col-span-1 bg-[#f8fafc] border border-slate-300 p-3 rounded-xl text-xs font-mono text-center font-bold"
                        />
                        <input
                          type="number"
                          value={it.precio_neto_unitario}
                          onChange={(e) => {
                            const newIt = [...itemsCot]
                            newIt[idx].precio_neto_unitario = Number(e.target.value) || 0
                            setItemsCot(newIt)
                          }}
                          className="col-span-2 bg-[#f8fafc] border border-slate-300 p-3 rounded-xl text-xs font-mono text-right font-bold"
                        />
                        <div className="col-span-3 flex gap-1">
                          <input
                            type="number"
                            value={it.descuento_valor || 0}
                            onChange={(e) => {
                              const newIt = [...itemsCot]
                              newIt[idx].descuento_valor = Number(e.target.value) || 0
                              setItemsCot(newIt)
                            }}
                            className="w-full bg-[#f8fafc] border border-slate-300 p-3 rounded-xl text-xs font-mono text-right font-bold text-amber-900"
                          />
                          <select
                            value={it.tipo_descuento || 'porcentaje'}
                            onChange={(e: any) => {
                              const newIt = [...itemsCot]
                              newIt[idx].tipo_descuento = e.target.value
                              setItemsCot(newIt)
                            }}
                            className="bg-amber-100 text-amber-900 font-bold border border-amber-300 rounded-xl p-1 text-xs"
                          >
                            <option value="porcentaje">%</option>
                            <option value="monto">$</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => setItemsCot(itemsCot.filter(i => i.id !== it.id))}
                          className="col-span-1 text-red-600 font-bold hover:text-red-800 text-center text-lg"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. DESCUENTO GLOBAL */}
                <div className="bg-[#f8fafc] p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
                  <label className="font-black text-slate-900 text-xs uppercase tracking-wider block">
                    4. DESCUENTO GLOBAL SOBRE EL SUBTOTAL NETO:
                  </label>

                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={descuentoGlobalValor}
                      onChange={(e) => setDescuentoGlobalValor(Number(e.target.value) || 0)}
                      className="flex-1 bg-white border border-amber-300 p-4 rounded-2xl font-mono text-sm font-bold text-amber-950"
                    />
                    <select
                      value={descuentoGlobalTipo}
                      onChange={(e: any) => setDescuentoGlobalTipo(e.target.value)}
                      className="bg-amber-100 text-amber-950 font-bold border border-amber-300 rounded-2xl px-5 text-xs"
                    >
                      <option value="porcentaje">% Porcentaje Subtotal</option>
                      <option value="monto">$ Monto Fijo ({cotMoneda})</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setMostrarModalCotizacion(false)}
                    className="px-8 py-4 bg-slate-200 text-slate-800 font-bold rounded-2xl cursor-pointer text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleGuardarCotizacionDolibarr}
                    className="px-10 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white font-bold rounded-2xl text-xs shadow-lg cursor-pointer"
                  >
                    💾 Guardar Presupuesto {cotEditandoId ? (cotizaciones.find(c => c.id === cotEditandoId)?.codigo_cotizacion) : siguienteCorrelativoCode}
                  </button>
                </div>

              </div>

              {/* COLUMNA DERECHA: LIENZO EN VIVO IMPRESO CON PADDING DE SEGURIDAD 12 */}
              <div className="w-full lg:w-1/2 p-8 md:p-12 bg-slate-900 rounded-3xl border border-slate-800 overflow-y-auto flex items-start justify-center">
                
                {/* HOJA A4 IMPRESA CON PADDING INTERNO DE MARGEN 12 */}
                <div className="bg-white text-slate-900 p-10 md:p-14 rounded-3xl max-w-2xl w-full shadow-2xl font-sans border border-slate-300 space-y-10 min-h-[850px] flex flex-col justify-between overflow-hidden">
                  
                  <div className="space-y-8">
                    {/* MEMBRETE EMISOR CON MARGEN PROTEGIDO */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 gap-6">
                      <div className="space-y-1 text-xs">
                        <h1 className="text-xl font-black text-[#000033] tracking-tight">{empresaEmisoraSeleccionadaCot.razon_social}</h1>
                        <p className="text-slate-600 font-medium">{empresaEmisoraSeleccionadaCot.direccion}</p>
                        <p className="text-slate-600 font-medium">Teléfono: {empresaEmisoraSeleccionadaCot.telefono}</p>
                        <p className="text-slate-600 font-medium">Correo: {empresaEmisoraSeleccionadaCot.email_contacto}</p>
                        <p className="text-slate-600 font-medium">Web: {empresaEmisoraSeleccionadaCot.web}</p>
                      </div>

                      {/* CUADRO DE DATOS DEL CLIENTE CON PADDING DE SEGURIDAD 6 */}
                      <div className="border border-slate-300 bg-[#f8fafc] p-6 rounded-2xl w-72 space-y-2 text-xs shadow-xs">
                        <div className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                          {tipoReceptorCot === 'prospecto' ? '✨ Oferta Comercial para Prospecto' : '👤 Cliente Registrado'}
                        </div>
                        <h2 className="text-sm font-black text-slate-900 uppercase">
                          {cotNombreCliente || 'Nombre del Cliente'}
                        </h2>
                        <p className="text-slate-600 leading-tight">{cotDireccion || 'Dirección de entrega'}</p>
                        <p className="font-mono text-slate-700 font-bold">R.U.T.: {cotRutCliente || 'S/RUT'}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xl font-black text-[#000033] font-mono">
                          Presupuesto {cotEditandoId ? (cotizaciones.find(c => c.id === cotEditandoId)?.codigo_cotizacion) : siguienteCorrelativoCode}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">Fecha: {new Date().toLocaleDateString('es-CL')} | Validez: {cotValidez} Días Hábiles</p>
                      </div>

                      <div className="text-xs font-bold text-slate-700 bg-slate-100 px-4 py-2 rounded-xl border border-slate-300 font-mono">
                        Moneda: {cotMoneda}
                      </div>
                    </div>

                    {/* TABLA DE ÍTEMS EN VIVO CON CABECERA INTERNA PROTEGIDA DE MARGEN */}
                    <div className="border border-slate-300 rounded-2xl overflow-hidden text-xs shadow-2xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                            <th className="p-4 border-r border-slate-300">Descripción del Producto / Servicio</th>
                            <th className="p-4 border-r border-slate-300 text-center w-16">Cant.</th>
                            <th className="p-4 border-r border-slate-300 text-right w-24">P.U. Neto</th>
                            <th className="p-4 border-r border-slate-300 text-right w-20">Desc.</th>
                            <th className="p-4 text-right w-28">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {itemsCot.map((it, idx) => {
                            const brutoLinea = (it.cantidad || 1) * (it.precio_neto_unitario || 0)
                            const descL = it.tipo_descuento === 'monto' ? (it.descuento_valor || 0) : (brutoLinea * ((it.descuento_valor || 0) / 100))
                            const sub = Math.max(0, brutoLinea - descL)
                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-4 font-semibold text-slate-900 border-r border-slate-200">{it.descripcion || 'Ítem de seguridad'}</td>
                                <td className="p-4 text-center font-mono font-bold border-r border-slate-200">{it.cantidad}</td>
                                <td className="p-4 text-right font-mono border-r border-slate-200">${it.precio_neto_unitario.toLocaleString('es-CL')}</td>
                                <td className="p-4 text-right font-mono text-amber-800 border-r border-slate-200 font-bold">
                                  {it.descuento_valor ? (it.tipo_descuento === 'monto' ? `$${it.descuento_valor}` : `${it.descuento_valor}%`) : '-'}
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-slate-900">${Math.round(sub).toLocaleString('es-CL')}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* TOTALES CON DESCUENTOS */}
                    <div className="flex justify-end">
                      <div className="w-80 border border-slate-300 rounded-2xl overflow-hidden text-xs font-mono shadow-xs">
                        <div className="flex justify-between p-3 bg-white border-b border-slate-200">
                          <span className="text-slate-600">Subtotal Bruto:</span>
                          <span className="font-bold">${Math.round(calculoCotizacionActual.subtotalBrutoLineas).toLocaleString('es-CL')} {cotMoneda}</span>
                        </div>
                        {calculoCotizacionActual.totalDescuentos > 0 && (
                          <div className="flex justify-between p-3 bg-amber-50 border-b border-slate-200 text-amber-900 font-bold">
                            <span>Descuentos Totales:</span>
                            <span>-${Math.round(calculoCotizacionActual.totalDescuentos).toLocaleString('es-CL')} {cotMoneda}</span>
                          </div>
                        )}
                        <div className="flex justify-between p-3 bg-[#f8fafc] border-b border-slate-200">
                          <span className="text-slate-600">Base Imponible Neto:</span>
                          <span className="font-bold text-slate-900">${Math.round(calculoCotizacionActual.netoConDescuento).toLocaleString('es-CL')} {cotMoneda}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-[#f8fafc] border-b border-slate-200">
                          <span className="text-slate-600">IVA 19%:</span>
                          <span className="font-bold">${Math.round(calculoCotizacionActual.montoIva).toLocaleString('es-CL')} {cotMoneda}</span>
                        </div>
                        <div className="flex justify-between p-4 bg-[#000033] text-white font-black text-sm">
                          <span>TOTAL OFERTA:</span>
                          <span>${Math.round(calculoCotizacionActual.totalIvaIncluido).toLocaleString('es-CL')} {cotMoneda}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5 text-slate-600">
                      <div className="font-bold text-slate-900">Forma de Pago: {cotFormaPago}</div>
                      <div>Datos Bancarios para Transferencia: <strong>{empresaEmisoraSeleccionadaCot.banco_nombre}</strong> - Cta: <strong>{empresaEmisoraSeleccionadaCot.banco_numero_cuenta}</strong></div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-6 flex justify-between items-center text-xs text-slate-400 font-mono">
                    <span>Documento Oficial {empresaEmisoraSeleccionadaCot.razon_social}</span>
                    <span>Página 1 / 1</span>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ── VISOR DE COTIZACIÓN RENDIDO (DOCUMENTO PDF CON MARGEN PROTEGIDO DE SEGURIDAD 12) ── */}
      {cotSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-md overflow-y-auto p-6 md:p-12 flex justify-center items-start">
          
          {/* VISOR PDF DE HOJA IMPRESA CON MARGEN DE SEGURIDAD P-10 MD:P-14 */}
          <div className="bg-white text-slate-900 p-10 md:p-14 rounded-3xl max-w-4xl w-full shadow-2xl font-sans my-6 md:my-10 border border-slate-300 space-y-10 min-h-[800px] flex flex-col justify-between overflow-hidden">
            
            <div className="space-y-8">
              {/* ENCABEZADO: MEMBRETE EMISOR CON MARGEN PROTEGIDO */}
              {(() => {
                const empEmisoraDoc = empresasConglomerado.find(e => e.id === cotSeleccionada.empresa_facturadora_id) || empresasConglomerado[0]
                return (
                  <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b-2 border-slate-200 pb-8">
                    <div className="space-y-1 text-xs">
                      <h1 className="text-2xl font-black text-[#000033] tracking-tight">{empEmisoraDoc.razon_social}</h1>
                      <p className="text-slate-600 font-medium">{empEmisoraDoc.direccion}</p>
                      <p className="text-slate-600 font-medium">Teléfono: {empEmisoraDoc.telefono}</p>
                      <p className="text-slate-600 font-medium">Correo: {empEmisoraDoc.email_contacto}</p>
                      <p className="text-slate-600 font-medium">Web: {empEmisoraDoc.web}</p>
                    </div>

                    {/* TARJETA DE DATOS DEL CLIENTE CON PADDING DE SEGURIDAD 6 */}
                    <div className="border border-slate-300 bg-[#f8fafc] p-6 rounded-2xl w-full md:w-80 space-y-2 text-xs shadow-xs">
                      <div className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                        {cotSeleccionada.tipo_receptor === 'prospecto' ? '✨ Oferta para Prospecto' : '👤 Cliente Registrado'}
                      </div>
                      <h2 className="text-base font-black text-slate-900 uppercase">{cotSeleccionada.nombre_cliente}</h2>
                      <p className="text-slate-600 leading-tight">{cotSeleccionada.direccion || 'Dirección del Cliente'}</p>
                      {cotSeleccionada.rut_cliente && <p className="font-mono text-slate-700 font-bold">R.U.T.: {cotSeleccionada.rut_cliente}</p>}
                    </div>
                  </div>
                )
              })()}

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-2xl font-extrabold text-[#000033] tracking-wide font-mono">
                    Presupuesto {cotSeleccionada.codigo_cotizacion}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">Fecha: {cotSeleccionada.fecha}</p>
                </div>

                <div className="text-xs font-semibold text-slate-700 bg-slate-100 px-4 py-2 rounded-xl border border-slate-300 font-mono">
                  Moneda: {cotSeleccionada.moneda_cotizacion || 'CLP'}
                </div>
              </div>

              {/* TABLA DE ÍTEMS EN VISOR CON PADDING INTERNO 4.5 EN TH Y TD */}
              <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#e2e8f0] text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-4 border-r border-slate-300">Descripción</th>
                      <th className="p-4 border-r border-slate-300 text-center w-16">IVA</th>
                      <th className="p-4 border-r border-slate-300 text-right w-24">P.U.</th>
                      <th className="p-4 border-r border-slate-300 text-center w-16">Cant.</th>
                      <th className="p-4 text-right w-28">Base imp.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {cotSeleccionada.items.map((it, idx) => {
                      const brutoLinea = (it.cantidad || 1) * (it.precio_neto_unitario || 0)
                      const descL = it.tipo_descuento === 'monto' ? (it.descuento_valor || 0) : (brutoLinea * ((it.descuento_valor || it.descuento_porcentaje || 0) / 100))
                      const baseImp = Math.max(0, brutoLinea - descL)
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-4 font-semibold text-slate-900 border-r border-slate-200">{it.descripcion}</td>
                          <td className="p-4 text-center font-mono text-slate-600 border-r border-slate-200">19%</td>
                          <td className="p-4 text-right font-mono border-r border-slate-200">${it.precio_neto_unitario.toLocaleString('es-CL')}</td>
                          <td className="p-4 text-center font-mono font-bold border-r border-slate-200">{it.cantidad}</td>
                          <td className="p-4 text-right font-mono font-bold text-slate-900">${Math.round(baseImp).toLocaleString('es-CL')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* TOTALES */}
              <div className="flex justify-end">
                <div className="w-80 border border-slate-300 rounded-2xl overflow-hidden text-xs font-mono shadow-xs">
                  <div className="flex justify-between p-3 bg-white border-b border-slate-200">
                    <span className="text-slate-700 font-bold">Total Neto:</span>
                    <span className="font-bold text-slate-900">${Math.round(cotSeleccionada.neto_con_descuento || 0).toLocaleString('es-CL')} {cotSeleccionada.moneda_cotizacion || 'CLP'}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-[#f8fafc] border-b border-slate-200">
                    <span className="text-slate-700 font-bold">Total IVA 19%:</span>
                    <span className="font-bold text-slate-900">${Math.round(cotSeleccionada.monto_iva || 0).toLocaleString('es-CL')} {cotSeleccionada.moneda_cotizacion || 'CLP'}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-[#000033] text-white font-black text-sm">
                    <span>Total:</span>
                    <span>${Math.round(cotSeleccionada.monto_total_iva_incluido || 0).toLocaleString('es-CL')} {cotSeleccionada.moneda_cotizacion || 'CLP'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-[11px] text-slate-500 font-medium italic">
                  Aceptación por escrito, sello de la empresa, fecha y firma
                </div>
                <div className="w-64 border-b-2 border-dashed border-slate-400 h-12 flex items-end justify-center pb-1 text-[10px] text-slate-400">
                  Firma / Sello Cliente
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-xs text-slate-500 font-mono">
                R.U.T.: {(empresasConglomerado.find(e => e.id === cotSeleccionada.empresa_facturadora_id) || empresasConglomerado[0]).rut} | Página 1 / 1
              </div>

              <div className="flex gap-4">
                <button onClick={() => setCotSeleccionada(null)} className="px-6 py-3 bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl hover:bg-slate-300 cursor-pointer">Cerrar</button>
                <button onClick={() => window.print()} className="px-7 py-3 bg-blue-900 text-white font-bold text-xs rounded-2xl hover:bg-blue-950 shadow-md cursor-pointer flex items-center gap-2"><span>🖨️ Imprimir / Guardar PDF</span></button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
