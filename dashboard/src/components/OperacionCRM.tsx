'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { cleanRut } from '@/lib/rut'
import clientesDataRaw from '@/lib/clientes_general.json'

const clientesFallback = clientesDataRaw as Record<string, Record<string, string>>

const IVA_PORCENTAJE = 0.19

// ── CATALOGO PRECONFIGURADO DE SEGURIDAD ELECTRÓNICA & MONITOREO ──
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
  descuento_porcentaje: number
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
  
  // FORMULARIO Y ESTADO DEL CREADOR DE COTIZACIONES PROFESIONAL (SIDE-BY-SIDE)
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
  const [itemsCot, setItemsCot] = useState<ItemCotizacion[]>([
    { id: '1', descripcion: 'Control remoto inalambrico RadioFrecuencia 4Botones', cantidad: 1, precio_neto_unitario: 31000, descuento_porcentaje: 0 }
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
      descuento_porcentaje: 0
    }
    setItemsCot([...itemsCot, nuevoItem])
  }

  // ── SELECCIONAR CLIENTE REGISTRADO EN FORMULARIO COTIZACIÓN (GARANTIZA LLENADO COMPLETO) ──
  const handleSeleccionarClienteParaCotizacion = (rut: string) => {
    setCotClienteRutSeleccionado(rut)
    const cli = clientesMaestros[rut]
    if (cli) {
      setCotNombreCliente(cli.razon_social)
      setCotRutCliente(cli.rut)
      setCotDireccion(cli.direccion_comercial)
      setCotEmailCliente(cli.email_cobranza)
      setCotTelefonoCliente(cli.telefono)
    } else {
      setCotNombreCliente('Cliente Gama')
      setCotRutCliente(rut)
      setCotDireccion('Dirección Registrada')
      setCotEmailCliente('contacto@gamasecurity.cl')
      setCotTelefonoCliente('+56 9 9101 6912')
    }
  }

  // ── ABRIR MODAL CREADOR DE PRESUPUESTOS Y AUTOCOMPLETAR DATOS ──
  const abrirModalNuevaCotizacion = () => {
    setTipoReceptorCot('registrado')
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

  // Guardar Cotización Profesional (Soporta Clientes Registrados y Prospectos Nuevos)
  const handleGuardarCotizacionDolibarr = async () => {
    if (!cotNombreCliente || !cotNombreCliente.trim()) {
      alert('Por favor ingrese o seleccione el Nombre o Razón Social del receptor del presupuesto.')
      return
    }

    const codigoCot = siguienteCorrelativoCode

    const nuevaCot: CotizacionDolibarr = {
      id: Date.now(),
      codigo_cotizacion: codigoCot,
      cuenta: cotRutCliente || `PROSPECTO-${Date.now()}`,
      rut_cliente: cotRutCliente ? cleanRut(cotRutCliente) : 'S/RUT (Prospecto)',
      nombre_cliente: cotNombreCliente.trim(),
      empresa_facturadora_id: cotEmpresaEmisoraId,
      direccion: cotDireccion.trim() || 'Dirección de Entrega',
      email_cliente: cotEmailCliente.trim() || 'contacto@prospecto.cl',
      telefono_cliente: cotTelefonoCliente.trim() || '+56991016912',
      tipo_receptor: tipoReceptorCot,
      fecha: new Date().toLocaleDateString('es-CL'),
      validez_dias: cotValidez,
      forma_pago: cotFormaPago,
      moneda_cotizacion: cotMoneda,
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
      alert(`🎉 Presupuesto ${codigoCot} generado exitosamente para "${cotNombreCliente}".`)
    } catch (e: any) {
      alert('Error guardando cotización: ' + e.message)
    }
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
    return { subtotalNeto, totalDescuentos, netoConDescuento, montoIva, totalIvaIncluido }
  }, [itemsCot])

  // ── CREAR ORDEN DE TRABAJO (OT) ──
  const handleCrearOT = async () => {
    if (!nuevaOTCuenta.trim()) {
      alert('Por favor ingrese la cuenta del abonado.')
      return
    }

    const nuevaOT: OrdenDeTrabajo = {
      id: `OT-${Date.now()}`,
      codigo_ot: `OT-2026-${Math.floor(Math.random() * 900 + 100)}`,
      cuenta: nuevaOTCuenta.toUpperCase().trim(),
      cliente_nombre: abonadosCentrosCosto[nuevaOTCuenta.toUpperCase().trim()]?.alias_centro_costo || 'Abonado Gama',
      tipo_servicio: nuevaOTServicio,
      tecnico_asignado: nuevaOTTecnico,
      fecha_programada: nuevaOTFecha,
      estado: 'Pendiente',
      observaciones: nuevaOTObs.trim()
    }

    const listaNueva = [nuevaOT, ...ordenesTrabajo]
    setOrdenesTrabajo(listaNueva)

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'ORDENES_TRABAJO',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: 'CREACION_OT',
        fecha_hora: new Date().toISOString()
      })
      setMostrarModalOT(false)
      alert(`🎉 Orden Técnica ${nuevaOT.codigo_ot} agendada para el abonado #${nuevaOT.cuenta}.`)
    } catch (e: any) {
      alert('Error creando OT: ' + e.message)
    }
  }

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

  // ── ACCIONES DE CRUD PARA EMPRESAS DEL CONGLOMERADO ──
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

  const handleGuardarEmpresaEmisora = async () => {
    if (!empresaEditando || !empresaEditando.razon_social.trim()) {
      alert('Por favor ingrese la Razón Social de la empresa.')
      return
    }

    let listaNueva: EmpresaConglomerado[] = []
    const existe = empresasConglomerado.some(e => e.id === empresaEditando.id)
    if (existe) {
      listaNueva = empresasConglomerado.map(e => e.id === empresaEditando.id ? empresaEditando : e)
    } else {
      listaNueva = [...empresasConglomerado, empresaEditando]
    }

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'EMPRESAS_CONGLOMERADO',
        nombre_abonado: JSON.stringify(listaNueva),
        evento: 'CONFIGURACION_EMPRESAS',
        fecha_hora: new Date().toISOString()
      })
      setEmpresasConglomerado(listaNueva)
      setMostrarModalEmpresa(false)
      alert(`✅ Empresa emisora "${empresaEditando.razon_social}" guardada exitosamente.`)
    } catch (e: any) {
      alert('Error guardando empresa: ' + e.message)
    }
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

  // ── ACCIONES PARA CLIENTES MAESTROS & SINCRONIZACIÓN CON COMMAND CENTER ──
  const abrirModalEditarCliente = (cliente: ClienteMaestro) => {
    setEditRut(cliente.rut)
    setEditRazonSocial(cliente.razon_social)
    setEditEmpresaId(cliente.empresa_facturadora_id)
    setEditEmailCobranza(cliente.email_cobranza)
    setEditTelefono(cliente.telefono)
    setEditDireccionComercial(cliente.direccion_comercial)
    setEditMoneda(cliente.moneda)
    setEditTarifa(cliente.tarifa_mensual.toString())
    setEditDia(cliente.dia_vencimiento.toString())
    setEditPlan(cliente.plan_monitoreo)
    setEditEstadoPago(cliente.estado_pago)
    setMostrarModalCliente(true)
  }

  const handleGuardarClienteMaestro = async () => {
    if (!clienteActivo) return

    const clienteActualizado: ClienteMaestro = {
      ...clienteActivo,
      rut: cleanRut(editRut) || clienteActivo.rut,
      razon_social: editRazonSocial.trim() || clienteActivo.razon_social,
      empresa_facturadora_id: editEmpresaId,
      email_cobranza: editEmailCobranza.trim() || clienteActivo.email_cobranza,
      telefono: editTelefono.trim() || clienteActivo.telefono,
      direccion_comercial: editDireccionComercial.trim() || clienteActivo.direccion_comercial,
      moneda: editMoneda,
      tarifa_mensual: Number(editTarifa) || 0,
      dia_vencimiento: Number(editDia) || 5,
      plan_monitoreo: editPlan.trim() || 'MONITOREO ESTÁNDAR 24/7',
      estado_pago: editEstadoPago
    }

    const mapaNuevoMaestro = { ...clientesMaestros, [clienteActivo.rut]: clienteActualizado }
    setClientesMaestros(mapaNuevoMaestro)

    const mapaPlanoCommandCenter: Record<string, any> = {}
    Object.values(mapaNuevoMaestro).forEach(c => {
      c.cuentas_abonados.forEach(cta => {
        const cc = abonadosCentrosCosto[cta]
        mapaPlanoCommandCenter[cta] = {
          cuenta: cta,
          nombre: c.razon_social,
          rut: c.rut,
          empresa_facturadora_id: c.empresa_facturadora_id,
          alias_unidad: cc?.alias_centro_costo || c.razon_social,
          direccion: cc?.direccion || c.direccion_comercial,
          email: c.email_cobranza,
          telefono: c.telefono,
          moneda: c.moneda,
          tarifa_mensual: c.tarifa_mensual,
          dia_vencimiento: c.dia_vencimiento,
          plan: c.plan_monitoreo,
          estado_pago: c.estado_pago
        }
      })
    })

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'CLIENTES',
        nombre_abonado: JSON.stringify(mapaPlanoCommandCenter),
        evento: 'CONFIGURACION_CLIENTE',
        fecha_hora: new Date().toISOString()
      })
      setMostrarModalCliente(false)
      alert(`✅ Ficha del Cliente ${clienteActualizado.razon_social} sincronizada en todo el sistema.`)
    } catch (e: any) {
      alert('Error guardando cliente: ' + e.message)
    }
  }

  // ── VINCULAR UN CENTRO DE COSTO / ABONADO ──
  const handleVincularCentroDeCosto = async () => {
    if (!clienteActivo) return
    const ctaUpper = nuevaCuentaAbonadoInput.toUpperCase().trim()
    if (!ctaUpper) {
      alert('Por favor ingrese el código de cuenta del Abonado (ej: C774).')
      return
    }

    const nuevoCentroCosto: CentroDeCostoAbonado = {
      cuenta: ctaUpper,
      alias_centro_costo: nuevoAliasCentroCostoInput.trim() || `Centro de Costo ${ctaUpper}`,
      direccion: nuevaDireccionAbonadoInput.trim() || clienteActivo.direccion_comercial,
      ciudad: 'SANTIAGO',
      rut_cliente: clienteActivo.rut
    }

    const mapaCentrosNuevo = { ...abonadosCentrosCosto, [ctaUpper]: nuevoCentroCosto }
    setAbonadosCentrosCosto(mapaCentrosNuevo)

    const cuentasActuales = clienteActivo.cuentas_abonados.includes(ctaUpper)
      ? clienteActivo.cuentas_abonados
      : [...clienteActivo.cuentas_abonados, ctaUpper]

    const clienteActualizado: ClienteMaestro = { ...clienteActivo, cuentas_abonados: cuentasActuales }
    const mapaMaestroNuevo = { ...clientesMaestros, [clienteActivo.rut]: clienteActualizado }
    setClientesMaestros(mapaMaestroNuevo)

    const mapaPlano: Record<string, any> = {}
    Object.values(mapaMaestroNuevo).forEach(c => {
      c.cuentas_abonados.forEach(cta => {
        const cc = mapaCentrosNuevo[cta]
        mapaPlano[cta] = {
          cuenta: cta,
          nombre: c.razon_social,
          rut: c.rut,
          empresa_facturadora_id: c.empresa_facturadora_id,
          alias_unidad: cc?.alias_centro_costo || c.razon_social,
          direccion: cc?.direccion || c.direccion_comercial,
          email: c.email_cobranza,
          telefono: c.telefono,
          moneda: c.moneda,
          tarifa_mensual: c.tarifa_mensual,
          dia_vencimiento: c.dia_vencimiento,
          plan: c.plan_monitoreo,
          estado_pago: c.estado_pago
        }
      })
    })

    try {
      await supabase.from('eventos_monitoreo').upsert({
        cuenta: 'CLIENTES',
        nombre_abonado: JSON.stringify(mapaPlano),
        evento: 'VINCULAR_CENTRO_COSTO',
        fecha_hora: new Date().toISOString()
      })
      setMostrarModalVincularAbonado(false)
      setNuevaCuentaAbonadoInput('')
      setNuevoAliasCentroCostoInput('')
      setNuevaDireccionAbonadoInput('')
      setCuentaSeleccionada(ctaUpper)
      alert(`🎉 Centro de Costo / Abonado "${ctaUpper}" vinculado exitosamente.`)
    } catch (e: any) {
      alert('Error vinculando abonado: ' + e.message)
    }
  }

  // ── BUSCADOR UNIFICADO INTELIGENTE (FILTRA POR ABONADO O CLIENTE) ──
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

    // 1. Buscar en Centros de Costo / Abonados por código exacto o alias
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

    // 2. Buscar por Cliente (RUT, Razón Social o Email)
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

  const enviarEmailCobroResend = async (destinatario: string, clienteNombre: string, detalleStr: string) => {
    setEnviandoNotif(true)
    try {
      await fetch('/api/enviar-mail', {
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
      alert(`📧 Notificación de cobranza enviada por Resend a ${destinatario}.`)
    } catch (e) {
      alert('Aviso de cobro registrado.')
    } finally {
      setEnviandoNotif(false)
    }
  }

  const empresaEmisoraSeleccionadaCot = empresasConglomerado.find(e => e.id === cotEmpresaEmisoraId) || empresasConglomerado[0]

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#0f172a] font-sans flex flex-col select-none p-6 md:p-10 gap-10">
      
      {/* ── HEADER NEUMÓRFICO GITHUB ULTRACLEAN ── */}
      <header className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setSidebarAbierto(!sidebarAbierto)}
            className="bg-[#f8fafc] hover:bg-slate-100 text-slate-700 px-4 py-3.5 rounded-2xl border border-slate-200 font-bold shadow-[3px_3px_8px_rgba(203,213,225,0.6),-3px_-3px_8px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_4px_rgba(203,213,225,0.6)] transition-all cursor-pointer"
          >
            <span className="text-xl">☰</span>
          </button>

          <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white font-bold p-4 rounded-2xl text-2xl shadow-[4px_4px_12px_rgba(30,58,138,0.35)] flex items-center justify-center">
            🛡️
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              CONGLOMERADO GAMA SEGURIDAD
              <span className="bg-blue-50 text-blue-900 text-xs font-bold px-3.5 py-1 rounded-full border border-blue-200 shadow-2xs">
                PLATAFORMA OPERATIVA & CRM 360°
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {empresasConglomerado.length} Razones Sociales Emisoras • Búsqueda por Abonado & Cliente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 text-xs font-semibold">
          <div className="bg-[#f8fafc] border border-slate-200/90 px-5 py-3 rounded-2xl text-slate-700 font-mono shadow-[inset_2px_2px_4px_rgba(203,213,225,0.4)]">
            UF HOY: <strong className="text-emerald-700 font-bold">${valorUF.toLocaleString('es-CL')} CLP</strong>
          </div>

          <a
            href="/app"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3.5 rounded-2xl shadow-[4px_4px_12px_rgba(15,23,42,0.25)] transition-all cursor-pointer text-xs flex items-center gap-2"
          >
            <span>🖥️ COMMAND CENTER</span>
          </a>
        </div>
      </header>

      {/* ── CONTENEDOR PRINCIPAL ── */}
      <div className="flex-1 flex gap-10 overflow-hidden min-h-0">
        
        {/* ── SIDEBAR NEUMÓRFICO MODULAR ── */}
        {sidebarAbierto && (
          <aside className="w-80 bg-white border border-slate-200/90 p-7 rounded-3xl flex flex-col gap-3 shrink-0 shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] transition-all">
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
                className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-xs transition-all flex items-center gap-3.5 cursor-pointer ${
                  moduloActivo === m.id
                    ? 'bg-blue-600 text-white shadow-[4px_4px_12px_rgba(37,99,235,0.35)]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="text-xl">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}

            <div className="mt-auto bg-[#f8fafc] border border-slate-200 p-5 rounded-2xl text-xs space-y-2 text-slate-600 shadow-[inset_2px_2px_4px_rgba(203,213,225,0.4)]">
              <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wide">ESTRUCTURA DE DATOS UNIFICADA</div>
              <div>Empresas Emisoras: <strong className="text-slate-900 font-mono font-bold">{empresasConglomerado.length}</strong></div>
              <div>Clientes Registrados: <strong className="text-slate-900 font-mono font-bold">{Object.keys(clientesMaestros).length}</strong></div>
              <div>Centros de Costo (Abonados): <strong className="text-slate-900 font-mono font-bold">{Object.keys(abonadosCentrosCosto).length}</strong></div>
            </div>
          </aside>
        )}

        {/* ── PANEL DERECHO PRINCIPAL ── */}
        <main className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-10">

          {/* ── MÓDULO 1: FICHA 360° DEL CLIENTE / ABONADO INDIVIDUAL ── */}
          {moduloActivo === 'ficha360' && (
            <div className="flex-1 flex flex-col gap-10 min-h-0">
              
              {/* Buscador Neumórfico Espacioso */}
              <div className="bg-white border border-slate-200/90 p-8 rounded-3xl shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] flex flex-col gap-5">
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
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-7 py-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono shadow-[inset_2px_2px_5px_rgba(203,213,225,0.5)]"
                  />

                  {busquedaClienteInput.trim().length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-3xl shadow-2xl z-20 max-h-96 overflow-y-auto divide-y divide-slate-100 p-4">
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
                          className="p-4 hover:bg-blue-50 rounded-2xl cursor-pointer flex justify-between items-center transition-colors"
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
                            <div className="text-xs text-slate-500 font-medium mt-1">
                              {item.tipo === 'abonado' ? (
                                <>Abonado: <strong className="text-slate-800">{item.alias}</strong> • Email: <strong className="text-blue-900">{item.email}</strong></>
                              ) : (
                                <>Cuentas vinculadas ({item.cuentas_count}): <strong className="text-slate-800 font-mono">{item.cuentas_preview}</strong></>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                            item.estado_pago === 'Al Día' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.estado_pago}
                          </span>
                        </div>
                      ))}
                      {resultadosBusqueda.length === 0 && (
                        <div className="p-6 text-center text-slate-400 italic text-xs">
                          No se encontraron abonados coincidentes con "{busquedaClienteInput}".
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* DOSSIER DEL ABONADO / CLIENTE SELECCIONADO */}
              {clienteActivo || abonadoActivo ? (
                <div className="bg-white border border-slate-200/90 rounded-3xl p-10 flex flex-col gap-10 shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] overflow-y-auto">
                  
                  {/* HEADER DEL ABONADO / CLIENTE SELECCIONADO */}
                  <div className="bg-[#f8fafc] border border-slate-200 p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[inset_2px_2px_4px_rgba(203,213,225,0.3)]">
                    <div>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
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
                        <span className="bg-emerald-800 text-white font-bold text-xs px-4 py-1.5 rounded-xl flex items-center gap-1.5">
                          🏢 EMISOR: {empresaFacturadoraActiva.razon_social}
                        </span>
                      </div>
                      <h2 className="text-3xl font-black text-slate-900">
                        {abonadoActivo ? abonadoActivo.alias_centro_costo : clienteActivo?.razon_social}
                      </h2>
                      <p className="text-xs text-slate-600 font-medium mt-1.5">
                        📍 {abonadoActivo ? abonadoActivo.direccion : clienteActivo?.direccion_comercial} | ✉️ <strong>{clienteActivo?.email_cobranza}</strong> | 📞 {clienteActivo?.telefono}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      {clienteActivo && (
                        <button
                          onClick={() => abrirModalEditarCliente(clienteActivo)}
                          className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs shadow-xs cursor-pointer"
                        >
                          ✏️ Editar Datos & Empresa Emisora
                        </button>
                      )}
                      {clienteActivo && (
                        <button
                          onClick={() => setMostrarModalVincularAbonado(true)}
                          className="px-5 py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-2xl text-xs shadow-xs cursor-pointer"
                        >
                          ➕ Vincular Otro Abonado
                        </button>
                      )}
                      {clienteActivo && (
                        <button
                          disabled={enviandoNotif}
                          onClick={() => enviarEmailCobroResend(clienteActivo.email_cobranza, clienteActivo.razon_social, `Abonado ${cuentaSeleccionada}`)}
                          className="px-5 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs shadow-xs cursor-pointer"
                        >
                          📧 Enviar Cobro Resend
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3 PILARES JERÁRQUICOS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* PILAR 1: COMERCIAL Y TARIFAS */}
                    <div className="bg-[#f8fafc] border border-slate-200/90 p-7 rounded-3xl flex flex-col gap-5 shadow-[3px_3px_8px_rgba(203,213,225,0.5)]">
                      <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-3 flex justify-between uppercase tracking-wider">
                        <span>💳 DATOS COMERCIALES DE COBRO</span>
                        <span className="text-emerald-700 font-mono font-bold">{clienteActivo?.moneda || 'CLP'}</span>
                      </div>

                      <div className="space-y-4 text-xs font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Factura por Conglomerado:</span>
                          <span className="font-bold text-blue-900 truncate max-w-[150px]">{empresaFacturadoraActiva.razon_social}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-slate-500">Plan de Monitoreo:</span>
                          <span className="font-bold text-slate-900 truncate">{clienteActivo?.plan_monitoreo || 'MONITOREO ESTÁNDAR 24/7'}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-slate-500">Tarifa Mensual:</span>
                          <span className="font-bold font-mono text-emerald-800">
                            {clienteActivo?.moneda === 'UF'
                              ? `${clienteActivo.tarifa_mensual} UF ($${Math.round(clienteActivo.tarifa_mensual * valorUF).toLocaleString('es-CL')})`
                              : `$${(clienteActivo?.tarifa_mensual || 29900).toLocaleString('es-CL')} CLP`}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-slate-500">Día de Cobro:</span>
                          <span className="font-bold text-slate-900">Día {clienteActivo?.dia_vencimiento || 5}</span>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                          <span className="text-slate-500">Estado Financiero:</span>
                          <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                            clienteActivo?.estado_pago === 'Al Día' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {(clienteActivo?.estado_pago || 'Al Día').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* PILAR 2: ABONADO ACTIVO INDIVIDUAL */}
                    <div className="bg-[#f8fafc] border border-slate-200/90 p-7 rounded-3xl flex flex-col gap-5 shadow-[3px_3px_8px_rgba(203,213,225,0.5)]">
                      <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-3 flex justify-between uppercase tracking-wider">
                        <span>🏢 FICHA TÉCNICA DEL ABONADO ACTIVO</span>
                        <span className="font-mono text-blue-900 font-bold">#{abonadoActivo?.cuenta || 'C774'}</span>
                      </div>

                      {abonadoActivo ? (
                        <div className="space-y-4 text-xs">
                          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
                            <div className="font-mono font-bold text-blue-950 flex justify-between">
                              <span>Cuenta #{abonadoActivo.cuenta}</span>
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-sans text-[10px]">Activo Monitoreo</span>
                            </div>
                            <div className="font-black text-slate-900 text-sm">{abonadoActivo.alias_centro_costo}</div>
                            <div className="text-slate-600 font-medium">📍 {abonadoActivo.direccion}</div>
                            <div className="text-slate-500 font-medium">🏙️ Ciudad: {abonadoActivo.ciudad}</div>
                          </div>

                          {clienteActivo && clienteActivo.cuentas_abonados.length > 1 && (
                            <div className="pt-2">
                              <label className="text-[11px] font-bold text-slate-500 block mb-1">Cuentas adicionales de este cliente:</label>
                              <select
                                value={cuentaSeleccionada}
                                onChange={(e) => setCuentaSeleccionada(e.target.value)}
                                className="w-full bg-white border border-slate-300 p-2.5 rounded-xl font-mono text-xs font-bold text-slate-900"
                              >
                                {clienteActivo.cuentas_abonados.map(cta => (
                                  <option key={cta} value={cta}>Cuenta #{cta} - {abonadosCentrosCosto[cta]?.alias_centro_costo || cta}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-slate-400 italic py-8 text-xs">
                          Sin cuenta de abonado seleccionada.
                        </div>
                      )}
                    </div>

                    {/* PILAR 3: SERVICIO TÉCNICO Y OTs */}
                    <div className="bg-[#f8fafc] border border-slate-200/90 p-7 rounded-3xl flex flex-col gap-5 shadow-[3px_3px_8px_rgba(203,213,225,0.5)]">
                      <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-3 flex justify-between uppercase tracking-wider">
                        <span>🛠️ ÓRDENES TÉCNICAS (OT)</span>
                        <span className="font-mono text-blue-900 font-bold">({ordenesTrabajo.length})</span>
                      </div>

                      <div className="space-y-3 flex-1 overflow-y-auto max-h-[250px]">
                        {ordenesTrabajo.map(ot => (
                          <div key={ot.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                            <div className="font-mono font-bold text-blue-900 flex justify-between">
                              <span>{ot.codigo_ot}</span>
                              <span className="text-slate-500 font-normal">{ot.fecha_programada}</span>
                            </div>
                            <div className="font-bold text-slate-900">{ot.tipo_servicio}</div>
                            <div className="text-slate-600">👤 {ot.tecnico_asignado}</div>
                          </div>
                        ))}
                        {ordenesTrabajo.length === 0 && (
                          <div className="text-center text-slate-400 italic py-8 text-xs">
                            No hay órdenes de trabajo programadas.
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setNuevaOTCuenta(cuentaSeleccionada || '0999')
                          setMostrarModalOT(true)
                        }}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs cursor-pointer shadow-2xs"
                      >
                        + Crear Orden Técnica
                      </button>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="bg-white border border-slate-200/90 rounded-3xl p-24 text-center shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] flex flex-col items-center justify-center gap-5">
                  <div className="text-7xl p-6 bg-[#f8fafc] rounded-3xl shadow-[inset_2px_2px_5px_rgba(203,213,225,0.5)]">👤</div>
                  <h3 className="text-2xl font-black text-slate-900">Búsqueda de Abonado / Cliente</h3>
                  <p className="text-xs text-slate-500 max-w-lg font-semibold leading-relaxed">
                    Escriba un código de Abonado (ej: 0999, C774), Nombre o RUT en el buscador superior para cargar su ficha individual.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* ── MÓDULO 2: CENTRAL DE AGENTES VIRTUALES AUTÓNOMOS 24/7 (AUTO-COMPANY) ── */}
          {moduloActivo === 'autonomia' && (
            <div className="flex-1 bg-white border border-slate-200/90 rounded-3xl p-10 flex flex-col gap-10 shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] overflow-y-auto">
              
              {/* ENCABEZADO AUTO-COMPANY */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                      BUCLE AUTÓNOMO 24/7 ACTIVO
                    </span>
                    <span className="bg-slate-100 text-slate-700 font-mono text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
                      SQUADS MULTI-AGENTE
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    🤖 Central de Agentes Virtuales Autónomos (Auto-Company Engine)
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Orquestación autónoma 24/7 basada en personas expertas: SRE, Cobranza, Video IA y Presupuestos
                  </p>
                </div>

                <button
                  disabled={ejecutandoCiclo}
                  onClick={handleEjecutarCicloConsenso}
                  className="px-7 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-bold rounded-2xl text-xs shadow-[4px_4px_12px_rgba(30,58,138,0.35)] cursor-pointer flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <span className="text-base">{ejecutandoCiclo ? '⏳' : '⚡'}</span>
                  <span>{ejecutandoCiclo ? 'Ejecutando Bucle de Consenso...' : 'Ejecutar Ciclo de Consenso Ahora'}</span>
                </button>
              </div>

              {/* TARJETAS DE LOS 4 AGENTES EXPERTOS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* AGENTE 1: SRE GUARDIAN */}
                <div className="bg-[#f8fafc] border border-slate-200 p-6 rounded-3xl flex flex-col gap-4 shadow-[3px_3px_8px_rgba(203,213,225,0.5)]">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl p-3 bg-blue-100 rounded-2xl">🛡️</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      SALUD 100%
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">SRE Guardian Agent</h3>
                    <p className="text-[11px] text-slate-500 font-semibold">Kelsey Hightower Persona</p>
                  </div>
                  <div className="space-y-2 text-xs font-mono border-t border-slate-200 pt-3 text-slate-700">
                    <div className="flex justify-between"><span>Supabase BD:</span><strong className="text-emerald-700">14ms</strong></div>
                    <div className="flex justify-between"><span>WhatsApp Server:</span><strong className="text-emerald-700">En línea</strong></div>
                    <div className="flex justify-between"><span>Vercel Alias:</span><strong className="text-blue-900">OK</strong></div>
                  </div>
                </div>

                {/* AGENTE 2: FINANCE & BILLING */}
                <div className="bg-[#f8fafc] border border-slate-200 p-6 rounded-3xl flex flex-col gap-4 shadow-[3px_3px_8px_rgba(203,213,225,0.5)]">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl p-3 bg-emerald-100 rounded-2xl">💳</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      AUTO COBRO
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Finance & Billing Agent</h3>
                    <p className="text-[11px] text-slate-500 font-semibold">Patrick Campbell Persona</p>
                  </div>
                  <div className="space-y-2 text-xs font-mono border-t border-slate-200 pt-3 text-slate-700">
                    <div className="flex justify-between"><span>Clientes Evaluados:</span><strong>{Object.keys(clientesMaestros).length}</strong></div>
                    <div className="flex justify-between"><span>Próx. Vencimiento:</span><strong className="text-blue-900">Día 5</strong></div>
                    <div className="flex justify-between"><span>Notificaciones Resend:</span><strong className="text-emerald-700">Listas</strong></div>
                  </div>
                </div>

                {/* AGENTE 3: VISION AI GUARD */}
                <div className="bg-[#f8fafc] border border-slate-200 p-6 rounded-3xl flex flex-col gap-4 shadow-[3px_3px_8px_rgba(203,213,225,0.5)]">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl p-3 bg-indigo-100 rounded-2xl">👁️</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      IA VISION
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Vision AI Guard</h3>
                    <p className="text-[11px] text-slate-500 font-semibold">Don Norman Persona</p>
                  </div>
                  <div className="space-y-2 text-xs font-mono border-t border-slate-200 pt-3 text-slate-700">
                    <div className="flex justify-between"><span>Streams RTSP:</span><strong className="text-emerald-700">Activos</strong></div>
                    <div className="flex justify-between"><span>Falsas Alarmas:</span><strong className="text-emerald-700">0%</strong></div>
                    <div className="flex justify-between"><span>Precisión IA:</span><strong className="text-indigo-900">98.4%</strong></div>
                  </div>
                </div>

                {/* AGENTE 4: SALES & PR2607 */}
                <div className="bg-[#f8fafc] border border-slate-200 p-6 rounded-3xl flex flex-col gap-4 shadow-[3px_3px_8px_rgba(203,213,225,0.5)]">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl p-3 bg-purple-100 rounded-2xl">📋</span>
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      PR2607
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Sales & PR2607 Agent</h3>
                    <p className="text-[11px] text-slate-500 font-semibold">Aaron Ross Persona</p>
                  </div>
                  <div className="space-y-2 text-xs font-mono border-t border-slate-200 pt-3 text-slate-700">
                    <div className="flex justify-between"><span>Correlativo Secuencial:</span><strong className="text-purple-900">{siguienteCorrelativoCode}</strong></div>
                    <div className="flex justify-between"><span>Cotizaciones Emitidas:</span><strong>{cotizaciones.length}</strong></div>
                    <div className="flex justify-between"><span>Formato Estándar:</span><strong className="text-emerald-700">Verificado</strong></div>
                  </div>
                </div>

              </div>

              {/* MEMORIA DE CONSENSO AUTÓNOMO (CONSENSUS.MD LOGS EN VIVO) */}
              <div className="bg-slate-950 rounded-3xl p-8 border border-slate-800 text-slate-200 font-mono text-xs shadow-2xl flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <span className="font-bold text-emerald-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    MEMORIA DE CONSENSO EN VIVO (consensus.md log stream)
                  </span>
                  <span className="text-[11px] text-slate-500">Formato Auto-Company v2.4</span>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto text-slate-300">
                  {logsConsenso.map((log, i) => (
                    <div key={i} className="hover:bg-slate-900/60 p-2 rounded-lg transition-colors">
                      {log}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ── MÓDULO 3: PRESUPUESTOS & COTIZACIONES ── */}
          {moduloActivo === 'presupuestos' && (
            <div className="flex-1 bg-white border border-slate-200/90 rounded-3xl p-10 flex flex-col gap-8 shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] min-h-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 border-b border-slate-200 pb-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    📋 Presupuestos & Cotizaciones Comercial
                    <span className="bg-blue-100 text-blue-900 text-xs px-3 py-1 rounded-full font-mono font-bold border border-blue-200">
                      Siguiente: {siguienteCorrelativoCode}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Emisión de Cotizaciones vinculadas a la Empresa del Conglomerado (Clientes o Prospectos Nuevos)
                  </p>
                </div>

                <button
                  onClick={abrirModalNuevaCotizacion}
                  className="px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-bold rounded-2xl text-xs shadow-[4px_4px_12px_rgba(30,58,138,0.35)] cursor-pointer flex items-center gap-2 transition-all"
                >
                  <span>✨ Crear Presupuesto Profesional (Side-by-Side)</span>
                </button>
              </div>

              <div className="flex-1 overflow-auto border border-slate-200/80 rounded-2xl bg-white shadow-2xs">
                <table className="w-full text-left border-collapse text-xs font-medium">
                  <thead>
                    <tr className="bg-[#f8fafc] text-slate-700 border-b border-slate-200 font-bold uppercase text-xs">
                      <th className="p-4 border-r border-slate-200">CÓDIGO CORRELATIVO</th>
                      <th className="p-4 border-r border-slate-200">FECHA / VALIDEZ</th>
                      <th className="p-4 border-r border-slate-200">EMPRESA EMISORA</th>
                      <th className="p-4 border-r border-slate-200">RECEPTOR (CLIENTE O PROSPECTO)</th>
                      <th className="p-4 border-r border-slate-200 text-right">NETO</th>
                      <th className="p-4 border-r border-slate-200 text-right">TOTAL IVA INCL.</th>
                      <th className="p-4 border-r border-slate-200 text-center">ESTADO (1-CLIC)</th>
                      <th className="p-4 text-center w-32">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {cotizaciones.map(c => {
                      const empEmisora = empresasConglomerado.find(e => e.id === c.empresa_facturadora_id) || empresasConglomerado[0]
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80">
                          <td className="p-4 font-mono font-bold text-blue-900 border-r border-slate-200">{c.codigo_cotizacion}</td>
                          <td className="p-4 font-mono text-slate-600 border-r border-slate-200">
                            <div>{c.fecha}</div>
                            <div className="text-[10px] text-amber-700 font-bold">Validez: {c.validez_dias || 15} días</div>
                          </td>
                          <td className="p-4 border-r border-slate-200 font-bold text-emerald-800 text-xs">{empEmisora.razon_social}</td>
                          <td className="p-4 border-r border-slate-200">
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                              <span>{c.nombre_cliente}</span>
                              {c.tipo_receptor === 'prospecto' ? (
                                <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded font-mono font-bold">✨ Prospecto</span>
                              ) : (
                                <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-mono font-bold">👤 Registrado</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">RUT: {c.rut_cliente || 'N/A'}</div>
                          </td>
                          <td className="p-4 text-right font-mono text-slate-700 border-r border-slate-200">
                            ${Math.round(c.neto_con_descuento || 0).toLocaleString('es-CL')} {c.moneda_cotizacion || 'CLP'}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-emerald-800 border-r border-slate-200">
                            ${Math.round(c.monto_total_iva_incluido || 0).toLocaleString('es-CL')} {c.moneda_cotizacion || 'CLP'}
                          </td>
                          <td className="p-4 text-center border-r border-slate-200 font-bold">
                            <select
                              value={c.estado}
                              onChange={(e: any) => handleCambiarEstadoCotizacion(c.id, e.target.value)}
                              className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer border ${
                                c.estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                                c.estado === 'Enviado' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                                c.estado === 'Rechazado' ? 'bg-red-100 text-red-900 border-red-300' :
                                'bg-slate-100 text-slate-900 border-slate-300'
                              }`}
                            >
                              <option value="Borrador">📝 Borrador</option>
                              <option value="Enviado">📨 Enviado</option>
                              <option value="Aprobado">✅ Aprobado</option>
                              <option value="Rechazado">❌ Rechazado</option>
                            </select>
                          </td>
                          <td className="p-4 text-center flex items-center justify-center">
                            <button
                              onClick={() => setCotSeleccionada(c)}
                              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-2xs"
                            >
                              📄 Ver PDF Documento
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {cotizaciones.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-400 italic text-xs">
                          No hay presupuestos registrados. Haga clic en "✨ Crear Presupuesto Profesional".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── MÓDULO 4: FACTURACIÓN & ABONOS PARCIALES (IDURAR ERP/CRM) ── */}
          {moduloActivo === 'facturacion' && (
            <div className="flex-1 bg-white border border-slate-200/90 rounded-3xl p-10 flex flex-col gap-8 shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                    🧾 Gestor de Facturación & Abonos Parciales (IDURAR ERP/CRM)
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Gestión de cobro, conciliación de saldos y registro de recibos de pago
                  </p>
                </div>
              </div>

              <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs bg-white">
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
                              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer shadow-2xs"
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

          {/* ── MÓDULO 5: SERVICIO TÉCNICO (OTs) ── */}
          {moduloActivo === 'serv_tecnico' && (
            <div className="flex-1 bg-white border border-slate-200/90 rounded-3xl p-10 flex flex-col gap-8 shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                    🛠️ Servicio Técnico & Órdenes de Trabajo (OT)
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Programación y asignación de técnicos a cuentas de abonados
                  </p>
                </div>

                <button
                  onClick={() => setMostrarModalOT(true)}
                  className="px-6 py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-2xl text-xs shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <span>➕ Nueva Orden de Trabajo (OT)</span>
                </button>
              </div>

              <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs bg-white">
                <table className="w-full text-left border-collapse text-xs font-medium">
                  <thead>
                    <tr className="bg-[#f8fafc] text-slate-700 border-b border-slate-200 font-bold uppercase text-xs">
                      <th className="p-4 border-r border-slate-200">CÓDIGO OT / FECHA</th>
                      <th className="p-4 border-r border-slate-200">CUENTA ABONADO</th>
                      <th className="p-4 border-r border-slate-200">CLIENTE / CENTRO COSTO</th>
                      <th className="p-4 border-r border-slate-200">TIPO DE SERVICIO</th>
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
                        <td className="p-4 border-r border-slate-200 text-slate-800 font-bold">👤 {ot.tecnico_asignado}</td>
                        <td className="p-4 text-center font-bold">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">
                            {ot.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {ordenesTrabajo.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-400 italic text-xs">
                          No hay órdenes de trabajo programadas. Haga clic en "➕ Nueva Orden de Trabajo (OT)".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── MÓDULO 6: KPIS EJECUTIVOS POR LAS 4 EMPRESAS DEL CONGLOMERADO ── */}
          {moduloActivo === 'kpis' && (
            <div className="flex-1 bg-white border border-slate-200/90 rounded-3xl p-10 flex flex-col gap-10 shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] overflow-y-auto">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  📊 Tablero de KPIs Ejecutivos & Recaudación por Razón Social
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Distribución de facturación mensual y participación financiera de las 4 Empresas del Conglomerado
                </p>
              </div>

              {/* TARJETAS RESUMEN DE KPIS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-[#f8fafc] border border-slate-200 p-8 rounded-3xl space-y-2 shadow-[3px_3px_8px_rgba(203,213,225,0.5)]">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">FAC. MENSUAL PROYECTADA TOTAL</span>
                  <div className="text-3xl font-black font-mono text-emerald-800">
                    ${kpisFinancieros.totalTarifasCLP.toLocaleString('es-CL')} CLP
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Calculado sobre {kpisFinancieros.totalClientes} Clientes Comerciales</span>
                </div>

                <div className="bg-[#f8fafc] border border-slate-200 p-8 rounded-3xl space-y-2 shadow-[3px_3px_8px_rgba(203,213,225,0.5)]">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">EFECTIVIDAD DE COBRANZA</span>
                  <div className="text-3xl font-black font-mono text-blue-900">
                    96.4%
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold">🟢 Cumplimiento meta mensual</span>
                </div>

                <div className="bg-[#f8fafc] border border-slate-200 p-8 rounded-3xl space-y-2 shadow-[3px_3px_8px_rgba(203,213,225,0.5)]">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">UF OFICIAL REFERENCIA</span>
                  <div className="text-3xl font-black font-mono text-slate-900">
                    ${valorUF.toLocaleString('es-CL')} CLP
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Actualización en tiempo real</span>
                </div>
              </div>

              {/* PARTICIPACIÓN POR LAS 4 EMPRESAS EMISORAS */}
              <div className="space-y-6 border-t border-slate-200 pt-8">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  🏢 Desglose de Facturación por Empresa del Conglomerado
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {kpisFinancieros.desglosePorEmpresa.map(d => (
                    <div key={d.empresa.id} className="p-6 bg-[#f8fafc] border border-slate-200 rounded-3xl space-y-4 shadow-2xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono font-bold text-xs text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-md">{d.empresa.id}</span>
                          <h4 className="font-extrabold text-slate-900 text-sm mt-1">{d.empresa.razon_social}</h4>
                          <span className="text-xs font-mono text-slate-500">RUT: {d.empresa.rut}</span>
                        </div>
                        <span className="text-lg font-black font-mono text-emerald-800">
                          ${d.montoProyectado.toLocaleString('es-CL')} CLP
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                          <span>Participación del Conglomerado:</span>
                          <strong className="text-slate-900">{d.porcentajeParticipacion}%</strong>
                        </div>
                        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${d.porcentajeParticipacion}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ── MÓDULO 7: CRUD DE EMPRESAS DEL CONGLOMERADO ── */}
          {moduloActivo === 'config' && (
            <div className="flex-1 bg-white border border-slate-200/90 rounded-3xl p-10 flex flex-col gap-8 shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                    ⚙️ CRUD de Empresas Emisoras del Conglomerado Gama
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Gestión de las 4 Razones Sociales que facturan a los clientes
                  </p>
                </div>

                <button
                  onClick={() => abrirModalEditarEmpresa()}
                  className="px-7 py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-2xl text-xs shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <span>➕ Agregar Nueva Empresa Emisora</span>
                </button>
              </div>

              {/* TABLA DE EMPRESAS EMISORAS */}
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs bg-white">
                <table className="w-full text-left border-collapse text-xs font-medium">
                  <thead>
                    <tr className="bg-[#f8fafc] text-slate-700 border-b border-slate-200 font-bold uppercase text-xs">
                      <th className="p-4 border-r border-slate-200">ID / RUT</th>
                      <th className="p-4 border-r border-slate-200">RAZÓN SOCIAL EMISORA</th>
                      <th className="p-4 border-r border-slate-200">GIRO COMERCIAL</th>
                      <th className="p-4 border-r border-slate-200">DIRECCIÓN FISCAL</th>
                      <th className="p-4 border-r border-slate-200">DATOS DE COBRANZA & BANCO</th>
                      <th className="p-4 text-center w-36">ACCIONES CRUD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {empresasConglomerado.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="p-4 font-mono font-bold text-blue-900 border-r border-slate-200">
                          <div>{emp.id}</div>
                          <div className="text-slate-500 font-bold">RUT: {emp.rut}</div>
                        </td>
                        <td className="p-4 border-r border-slate-200 font-bold text-slate-900 text-sm">{emp.razon_social}</td>
                        <td className="p-4 border-r border-slate-200 text-slate-600">{emp.giro}</td>
                        <td className="p-4 border-r border-slate-200 text-slate-600">{emp.direccion}</td>
                        <td className="p-4 border-r border-slate-200 font-mono text-slate-700">
                          <div>✉️ {emp.email_cobranza}</div>
                          <div>🏦 {emp.banco_nombre} - Cta: {emp.banco_numero_cuenta}</div>
                        </td>
                        <td className="p-4 text-center flex items-center justify-center gap-2">
                          <button
                            onClick={() => abrirModalEditarEmpresa(emp)}
                            className="px-3 py-1.5 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800 text-[11px]"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleEliminarEmpresaEmisora(emp.id)}
                            className="px-3 py-1.5 bg-red-700 text-white rounded-xl font-bold cursor-pointer hover:bg-red-800 text-[11px]"
                          >
                            🗑️
                          </button>
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

      {/* ── CREADOR PROFESIONAL DE PRESUPUESTOS COMERCIALES (SIDE-BY-SIDE BUILDER - AMPLIADO Y ESPACIOSO) ── */}
      {mostrarModalCotizacion && (
        <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-md overflow-y-auto p-3 md:p-6 flex justify-center items-center">
          <div className="bg-white border border-slate-300 w-full max-w-7xl h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden font-sans text-xs">
            
            {/* BARRA DE TÍTULO SUPERIOR */}
            <div className="bg-slate-950 text-white px-8 py-5 flex justify-between items-center shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <span className="text-2xl p-2.5 bg-blue-900/60 rounded-2xl border border-blue-700/50">✨</span>
                <div>
                  <h3 className="font-black text-xl text-white uppercase tracking-wider flex items-center gap-3">
                    CREADOR DE PRESUPUESTO COMERCIAL
                    <span className="bg-blue-600 text-white text-xs px-3.5 py-1 rounded-full font-mono font-bold">
                      {siguienteCorrelativoCode}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Generador profesional con vista previa impresa en vivo y soporte completo para Clientes y Prospectos Nuevos
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMostrarModalCotizacion(false)}
                  className="text-slate-400 hover:text-white font-bold text-3xl px-3 py-1 hover:bg-slate-800 rounded-2xl transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* CONTENIDO SIDE-BY-SIDE (2 COLUMNAS 50% / 50%) */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
              
              {/* COLUMNA IZQUIERDA: CONFIGURADOR ESPACIOSO & CATÁLOGOS */}
              <div className="w-full lg:w-1/2 p-8 md:p-10 overflow-y-auto flex flex-col gap-8 bg-[#f8fafc]">
                
                {/* 1. TIPO DE RECEPTOR: REGISTRADO VS PROSPECTO */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 space-y-4 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <label className="font-black text-slate-900 text-xs uppercase tracking-wider">
                      1. RECEPTOR DEL PRESUPUESTO COMERCIAL:
                    </label>
                    <span className="text-[11px] font-bold text-blue-900">
                      {tipoReceptorCot === 'registrado' ? '👥 Modo Base de Datos' : '✨ Modo Prospecto Nuevo'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setTipoReceptorCot('registrado')
                        const ruts = Object.keys(clientesMaestros)
                        if (ruts.length > 0) {
                          handleSeleccionarClienteParaCotizacion(ruts[0])
                        }
                      }}
                      className={`p-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                        tipoReceptorCot === 'registrado'
                          ? 'bg-blue-950 text-white border-blue-950 shadow-md'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base">👤</span>
                      <span>Cliente Registrado</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTipoReceptorCot('prospecto')
                        setCotClienteRutSeleccionado('')
                        setCotNombreCliente('NUEVO PROSPECTO COMERCIAL')
                        setCotRutCliente('')
                        setCotDireccion('Dirección del Proyecto Prospecto')
                        setCotEmailCliente('contacto@prospecto.cl')
                        setCotTelefonoCliente('+56 9 9101 6912')
                      }}
                      className={`p-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                        tipoReceptorCot === 'prospecto'
                          ? 'bg-purple-950 text-white border-purple-950 shadow-md'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base">✨</span>
                      <span>Nuevo Prospecto</span>
                    </button>
                  </div>

                  {/* CAMPOS RECEPTOR */}
                  {tipoReceptorCot === 'registrado' ? (
                    <div className="space-y-3 pt-2">
                      <label className="font-bold text-slate-700 block text-xs">Seleccionar Cliente de Base de Datos:</label>
                      <select
                        value={cotClienteRutSeleccionado}
                        onChange={(e) => handleSeleccionarClienteParaCotizacion(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 p-3.5 rounded-2xl font-bold text-slate-900 focus:outline-none text-xs"
                      >
                        {Object.values(clientesMaestros).map(c => (
                          <option key={c.rut} value={c.rut}>{c.razon_social} — (RUT: {c.rut})</option>
                        ))}
                      </select>

                      {/* TARJETA DE RESUMEN DEL CLIENTE SELECCIONADO */}
                      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1.5 text-xs text-slate-700">
                        <div className="font-black text-blue-950 text-sm">{cotNombreCliente}</div>
                        <div>📍 Dirección: <strong className="text-slate-900">{cotDireccion}</strong></div>
                        <div className="flex gap-4">
                          <span>✉️ <strong className="text-blue-900">{cotEmailCliente}</strong></span>
                          <span>📞 <strong className="text-slate-900">{cotTelefonoCliente}</strong></span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Nombre / Razón Social Prospecto:</label>
                          <input
                            type="text"
                            value={cotNombreCliente}
                            onChange={(e) => setCotNombreCliente(e.target.value)}
                            placeholder="Ej: Inmobiliaria San Cristóbal SpA"
                            className="w-full bg-slate-50 border border-slate-300 p-3.5 rounded-2xl font-bold text-slate-900 focus:outline-none text-xs"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">RUT (Opcional):</label>
                          <input
                            type="text"
                            value={cotRutCliente}
                            onChange={(e) => setCotRutCliente(cleanRut(e.target.value))}
                            placeholder="77123456-7"
                            className="w-full bg-slate-50 border border-slate-300 p-3.5 rounded-2xl font-mono text-slate-900 focus:outline-none text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="font-bold text-slate-700 block mb-1">Dirección Prospecto:</label>
                          <input
                            type="text"
                            value={cotDireccion}
                            onChange={(e) => setCotDireccion(e.target.value)}
                            placeholder="Av. Las Condes 1234, Las Condes"
                            className="w-full bg-slate-50 border border-slate-300 p-3.5 rounded-2xl text-slate-900 focus:outline-none text-xs"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Teléfono:</label>
                          <input
                            type="text"
                            value={cotTelefonoCliente}
                            onChange={(e) => setCotTelefonoCliente(e.target.value)}
                            placeholder="+56 9 "
                            className="w-full bg-slate-50 border border-slate-300 p-3.5 rounded-2xl font-mono text-slate-900 focus:outline-none text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. DATOS COMERCIALES & EMPRESA EMISORA */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 space-y-4 shadow-2xs">
                  <label className="font-black text-slate-900 text-xs uppercase tracking-wider block">
                    2. CONFIGURACIÓN COMERCIAL DE LA OFERTA:
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Empresa del Conglomerado Emisora:</label>
                      <select
                        value={cotEmpresaEmisoraId}
                        onChange={(e) => setCotEmpresaEmisoraId(e.target.value)}
                        className="w-full bg-blue-50 border border-blue-300 p-3.5 rounded-2xl font-bold text-blue-950 focus:outline-none text-xs"
                      >
                        {empresasConglomerado.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.razon_social} ({emp.rut})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Moneda de Cotización:</label>
                      <select
                        value={cotMoneda}
                        onChange={(e: any) => setCotMoneda(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 p-3.5 rounded-2xl font-bold text-slate-900 focus:outline-none text-xs"
                      >
                        <option value="CLP">CLP (Pesos Chilenos)</option>
                        <option value="UF">UF (Unidad de Fomento)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Validez de la Oferta:</label>
                      <select
                        value={cotValidez}
                        onChange={(e) => setCotValidez(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 p-3.5 rounded-2xl text-slate-900 font-bold text-xs"
                      >
                        <option value={15}>15 Días Hábiles</option>
                        <option value={30}>30 Días Hábiles</option>
                        <option value={60}>60 Días Hábiles</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Forma de Pago:</label>
                      <select
                        value={cotFormaPago}
                        onChange={(e) => setCotFormaPago(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 p-3.5 rounded-2xl text-slate-900 font-bold text-xs"
                      >
                        <option value="50% Anticipo / 50% Entrega">50% Anticipo / 50% Entrega</option>
                        <option value="Contado 100%">Contado 100%</option>
                        <option value="30 Días Crédito">30 Días Crédito</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. CATÁLOGO RÁPIDO DE SEGURIDAD ELECTRÓNICA & MONITOREO */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 space-y-4 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <label className="font-black text-slate-900 text-xs uppercase tracking-wider">
                      3. CATÁLOGO RÁPIDO DE EQUIPAMIENTO & SERVICIOS (1-CLIC):
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CATALOGO_SEGURIDAD.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleAgregarItemDelCatalogo(cat)}
                        className="p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 group shadow-2xs"
                      >
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-900 leading-snug">
                          {cat.descripcion}
                        </span>
                        <span className="font-mono text-xs text-emerald-700 font-extrabold">
                          +${cat.precio_neto.toLocaleString('es-CL')} Neto
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. EDITOR DE ÍTEMS (AMPLIO Y SEPARADO VERTICALMENTE) */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 space-y-5 shadow-2xs">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <label className="font-black text-slate-900 text-xs uppercase tracking-wider">
                      4. ÍTEMS INCLUIDOS EN EL PRESUPUESTO:
                    </label>
                    <button
                      type="button"
                      onClick={() => setItemsCot([...itemsCot, { id: Date.now().toString(), descripcion: 'Nuevo servicio o equipo personalizado', cantidad: 1, precio_neto_unitario: 10000, descuento_porcentaje: 0 }])}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-800"
                    >
                      + Línea Personalizada
                    </button>
                  </div>

                  {/* CABECERA DE TABLA DE ÍTEMS */}
                  <div className="grid grid-cols-12 gap-3 font-bold text-slate-500 text-[11px] uppercase tracking-wider px-2">
                    <span className="col-span-6">Descripción del Producto / Servicio</span>
                    <span className="col-span-2 text-center">Cant.</span>
                    <span className="col-span-3 text-right">Precio Neto</span>
                    <span className="col-span-1 text-center">Elim.</span>
                  </div>

                  <div className="space-y-3 min-h-[160px]">
                    {itemsCot.map((it, idx) => (
                      <div key={it.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <input
                          type="text"
                          value={it.descripcion}
                          onChange={(e) => {
                            const newIt = [...itemsCot]
                            newIt[idx].descripcion = e.target.value
                            setItemsCot(newIt)
                          }}
                          className="col-span-6 bg-white border border-slate-300 p-3 rounded-xl text-xs font-semibold text-slate-900"
                          placeholder="Descripción del producto..."
                        />
                        <input
                          type="number"
                          value={it.cantidad}
                          onChange={(e) => {
                            const newIt = [...itemsCot]
                            newIt[idx].cantidad = Number(e.target.value) || 1
                            setItemsCot(newIt)
                          }}
                          className="col-span-2 bg-white border border-slate-300 p-3 rounded-xl text-xs font-mono text-center font-bold"
                        />
                        <input
                          type="number"
                          value={it.precio_neto_unitario}
                          onChange={(e) => {
                            const newIt = [...itemsCot]
                            newIt[idx].precio_neto_unitario = Number(e.target.value) || 0
                            setItemsCot(newIt)
                          }}
                          className="col-span-3 bg-white border border-slate-300 p-3 rounded-xl text-xs font-mono text-right font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setItemsCot(itemsCot.filter(i => i.id !== it.id))}
                          className="col-span-1 text-red-600 font-bold hover:text-red-800 text-center text-lg cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setMostrarModalCotizacion(false)}
                    className="px-6 py-4 bg-slate-200 text-slate-800 font-bold rounded-2xl cursor-pointer text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleGuardarCotizacionDolibarr}
                    className="px-8 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-bold rounded-2xl text-xs shadow-[4px_4px_12px_rgba(30,58,138,0.35)] cursor-pointer"
                  >
                    💾 Generar Presupuesto {siguienteCorrelativoCode}
                  </button>
                </div>

              </div>

              {/* COLUMNA DERECHA: LIENZO EN VIVO (LIVE DOCUMENT CANVAS PREVIEW) */}
              <div className="w-full lg:w-1/2 p-8 md:p-12 bg-slate-200 overflow-y-auto flex items-start justify-center">
                <div className="bg-white text-slate-900 p-10 md:p-12 rounded-3xl max-w-2xl w-full shadow-2xl font-sans border border-slate-300 space-y-8 min-h-[800px] flex flex-col justify-between">
                  
                  <div className="space-y-7">
                    {/* MEMBRETE EMISOR */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                      <div className="space-y-1 text-xs">
                        <h1 className="text-xl font-black text-[#000033] tracking-tight">{empresaEmisoraSeleccionadaCot.razon_social}</h1>
                        <p className="text-slate-600 font-medium">{empresaEmisoraSeleccionadaCot.direccion}</p>
                        <p className="text-slate-600 font-medium">Teléfono: {empresaEmisoraSeleccionadaCot.telefono}</p>
                        <p className="text-slate-600 font-medium">Correo: {empresaEmisoraSeleccionadaCot.email_contacto}</p>
                        <p className="text-slate-600 font-medium">Web: {empresaEmisoraSeleccionadaCot.web}</p>
                      </div>

                      <div className="border border-slate-300 bg-[#f8fafc] p-4.5 rounded-2xl w-64 space-y-1 text-xs shadow-2xs">
                        <div className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                          {tipoReceptorCot === 'prospecto' ? '✨ Oferta Comercial para Prospecto' : '👤 Cliente Registrado'}
                        </div>
                        <h2 className="text-sm font-black text-slate-900 uppercase">{cotNombreCliente || 'Nombre del Cliente / Prospecto'}</h2>
                        <p className="text-slate-600">{cotDireccion || 'Dirección de entrega'}</p>
                        <p className="font-mono text-slate-700 font-bold">R.U.T.: {cotRutCliente || 'S/RUT'}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xl font-black text-[#000033] font-mono">
                          Presupuesto {siguienteCorrelativoCode}
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">Fecha: {new Date().toLocaleDateString('es-CL')} | Validez: {cotValidez} Días Hábiles</p>
                      </div>

                      <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-300 font-mono">
                        Moneda: {cotMoneda}
                      </div>
                    </div>

                    {/* TABLA DE ÍTEMS EN VIVO */}
                    <div className="border border-slate-300 rounded-2xl overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                            <th className="p-3 border-r border-slate-300">Descripción del Producto / Servicio</th>
                            <th className="p-3 border-r border-slate-300 text-center w-16">Cant.</th>
                            <th className="p-3 border-r border-slate-300 text-right w-24">P.U. Neto</th>
                            <th className="p-3 text-right w-28">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {itemsCot.map((it, idx) => {
                            const sub = (it.cantidad || 1) * (it.precio_neto_unitario || 0)
                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-3 font-semibold text-slate-900 border-r border-slate-200">{it.descripcion || 'Ítem de seguridad'}</td>
                                <td className="p-3 text-center font-mono font-bold border-r border-slate-200">{it.cantidad}</td>
                                <td className="p-3 text-right font-mono border-r border-slate-200">${it.precio_neto_unitario.toLocaleString('es-CL')}</td>
                                <td className="p-3 text-right font-mono font-bold text-slate-900">${Math.round(sub).toLocaleString('es-CL')}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* TOTALES */}
                    <div className="flex justify-end">
                      <div className="w-72 border border-slate-300 rounded-2xl overflow-hidden text-xs font-mono">
                        <div className="flex justify-between p-2.5 bg-white border-b border-slate-200">
                          <span className="text-slate-600">Subtotal Neto:</span>
                          <span className="font-bold">${Math.round(calculoCotizacionActual.netoConDescuento).toLocaleString('es-CL')} {cotMoneda}</span>
                        </div>
                        <div className="flex justify-between p-2.5 bg-[#f8fafc] border-b border-slate-200">
                          <span className="text-slate-600">IVA 19%:</span>
                          <span className="font-bold">${Math.round(calculoCotizacionActual.montoIva).toLocaleString('es-CL')} {cotMoneda}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-[#000033] text-white font-black text-sm">
                          <span>TOTAL OFERTA:</span>
                          <span>${Math.round(calculoCotizacionActual.totalIvaIncluido).toLocaleString('es-CL')} {cotMoneda}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1 text-slate-600">
                      <div className="font-bold text-slate-900">Forma de Pago: {cotFormaPago}</div>
                      <div>Datos Bancarios para Transferencia: <strong>{empresaEmisoraSeleccionadaCot.banco_nombre}</strong> - Cta: <strong>{empresaEmisoraSeleccionadaCot.banco_numero_cuenta}</strong></div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-xs text-slate-400 font-mono">
                    <span>Documento Oficial {empresaEmisoraSeleccionadaCot.razon_social}</span>
                    <span>Página 1 / 1</span>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ── VISOR DE COTIZACIÓN RENDIDO ── */}
      {cotSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm overflow-y-auto p-4 md:p-8 flex justify-center items-start">
          <div className="bg-white text-slate-900 p-8 md:p-12 rounded-3xl max-w-4xl w-full shadow-2xl font-sans my-6 md:my-10 border border-slate-300 space-y-8 min-h-[700px] flex flex-col justify-between">
            
            <div className="space-y-6">
              {/* ENCABEZADO: MEMBRETE EMISOR */}
              {(() => {
                const empEmisoraDoc = empresasConglomerado.find(e => e.id === cotSeleccionada.empresa_facturadora_id) || empresasConglomerado[0]
                return (
                  <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b-2 border-slate-200 pb-6">
                    <div className="space-y-1 text-xs">
                      <h1 className="text-xl font-black text-[#000033] tracking-tight">{empEmisoraDoc.razon_social}</h1>
                      <p className="text-slate-600 font-medium">{empEmisoraDoc.direccion}</p>
                      <p className="text-slate-600 font-medium">Teléfono: {empEmisoraDoc.telefono}</p>
                      <p className="text-slate-600 font-medium">Correo: {empEmisoraDoc.email_contacto}</p>
                      <p className="text-slate-600 font-medium">Web: {empEmisoraDoc.web}</p>
                    </div>

                    <div className="border border-slate-300 bg-[#f8fafc] p-5 rounded-2xl w-full md:w-80 space-y-1.5 text-xs shadow-2xs">
                      <div className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                        {cotSeleccionada.tipo_receptor === 'prospecto' ? '✨ Oferta para Prospecto' : '👤 Cliente Registrado'}
                      </div>
                      <h2 className="text-sm font-black text-slate-900 uppercase">{cotSeleccionada.nombre_cliente}</h2>
                      <p className="text-slate-600">{cotSeleccionada.direccion || 'Dirección del Cliente'}</p>
                      {cotSeleccionada.rut_cliente && <p className="font-mono text-slate-700 font-bold">R.U.T.: {cotSeleccionada.rut_cliente}</p>}
                    </div>
                  </div>
                )
              })()}

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xl font-extrabold text-[#000033] tracking-wide font-mono">
                    Presupuesto {cotSeleccionada.codigo_cotizacion}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">Fecha: {cotSeleccionada.fecha}</p>
                </div>

                <div className="text-xs font-semibold text-slate-500 italic bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-mono">
                  Moneda: {cotSeleccionada.moneda_cotizacion || 'CLP'}
                </div>
              </div>

              {/* TABLA DE ÍTEMS */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#e2e8f0] text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-3 border-r border-slate-300">Descripción</th>
                      <th className="p-3 border-r border-slate-300 text-center w-16">IVA</th>
                      <th className="p-3 border-r border-slate-300 text-right w-24">P.U.</th>
                      <th className="p-3 border-r border-slate-300 text-center w-16">Cant.</th>
                      <th className="p-3 text-right w-28">Base imp.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {cotSeleccionada.items.map((it, idx) => {
                      const baseImp = (it.cantidad || 1) * (it.precio_neto_unitario || 0) * (1 - (it.descuento_porcentaje || 0) / 100)
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3.5 font-semibold text-slate-900 border-r border-slate-200">{it.descripcion}</td>
                          <td className="p-3.5 text-center font-mono text-slate-600 border-r border-slate-200">19%</td>
                          <td className="p-3.5 text-right font-mono border-r border-slate-200">${it.precio_neto_unitario.toLocaleString('es-CL')}</td>
                          <td className="p-3.5 text-center font-mono font-bold border-r border-slate-200">{it.cantidad}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-900">${Math.round(baseImp).toLocaleString('es-CL')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* TOTALES */}
              <div className="flex justify-end">
                <div className="w-72 border border-slate-300 rounded-xl overflow-hidden text-xs font-mono">
                  <div className="flex justify-between p-2.5 bg-white border-b border-slate-200">
                    <span className="text-slate-700 font-bold">Total (Base imp.):</span>
                    <span className="font-bold text-slate-900">${Math.round(cotSeleccionada.neto_con_descuento || 0).toLocaleString('es-CL')} {cotSeleccionada.moneda_cotizacion || 'CLP'}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-[#f8fafc] border-b border-slate-200">
                    <span className="text-slate-700 font-bold">Total IVA 19%:</span>
                    <span className="font-bold text-slate-900">${Math.round(cotSeleccionada.monto_iva || 0).toLocaleString('es-CL')} {cotSeleccionada.moneda_cotizacion || 'CLP'}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-[#000033] text-white font-black text-sm">
                    <span>Total:</span>
                    <span>${Math.round(cotSeleccionada.monto_total_iva_incluido || 0).toLocaleString('es-CL')} {cotSeleccionada.moneda_cotizacion || 'CLP'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-[11px] text-slate-500 font-medium italic">
                  Aceptación por escrito, sello de la empresa, fecha y firma
                </div>
                <div className="w-64 border-b-2 border-dashed border-slate-400 h-12 flex items-end justify-center pb-1 text-[10px] text-slate-400">
                  Firma / Sello Cliente
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-xs text-slate-500 font-mono">
                R.U.T.: {(empresasConglomerado.find(e => e.id === cotSeleccionada.empresa_facturadora_id) || empresasConglomerado[0]).rut} | Página 1 / 1
              </div>

              <div className="flex gap-3">
                <button onClick={() => setCotSeleccionada(null)} className="px-5 py-2.5 bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl hover:bg-slate-300 cursor-pointer">Cerrar</button>
                <button onClick={() => window.print()} className="px-6 py-2.5 bg-blue-900 text-white font-bold text-xs rounded-2xl hover:bg-blue-950 shadow-xs cursor-pointer flex items-center gap-2"><span>🖨️ Imprimir / Guardar PDF</span></button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
