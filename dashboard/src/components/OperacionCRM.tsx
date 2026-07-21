'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { cleanRut } from '@/lib/rut'
import clientesDataRaw from '@/lib/clientes_general.json'

const clientesFallback = clientesDataRaw as Record<string, Record<string, string>>

const IVA_PORCENTAJE = 0.19

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

// ── NIVEL 2: CLIENTE COMERCIAL (POR RUT ÚNICO) ──
export interface ClienteMaestro {
  rut: string
  razon_social: string
  empresa_facturadora_id: string // ID de la Empresa del Conglomerado asignada
  email_cobranza: string
  telefono: string
  direccion_comercial: string
  moneda: 'UF' | 'CLP'
  tarifa_mensual: number
  dia_vencimiento: number
  plan_monitoreo: string
  estado_pago: 'Al Día' | 'Pendiente' | 'Moroso'
  cuentas_abonados: string[] // Cuentas de Centros de Costo asignadas (ej: ['C774', 'C775'])
}

// ── NIVEL 3: CENTRO DE COSTO / ABONADO (COMMAND CENTER) ──
export interface CentroDeCostoAbonado {
  cuenta: string // Ej: 'C774'
  alias_centro_costo: string // Ej: 'Planta Lampa'
  direccion: string
  ciudad: string
  rut_cliente: string
}

export interface FacturaIndividual {
  id: string
  numero_factura: string
  fecha: string
  razon_social: string
  monto_total: number
  cuenta_asociada?: string
  rut_cliente?: string
  empresa_facturadora_id?: string
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
  rut_cliente: string
  nombre_cliente: string
  empresa_facturadora_id: string
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
  const [moduloActivo, setModuloActivo] = useState<'ficha360' | 'presupuestos' | 'facturacion' | 'serv_tecnico' | 'kpis' | 'config'>('ficha360')
  const [sidebarAbierto, setSidebarAbierto] = useState<boolean>(true)

  // ── NIVEL 1: EMPRESAS DEL CONGLOMERADO ──
  const [empresasConglomerado, setEmpresasConglomerado] = useState<EmpresaConglomerado[]>(EMPRESAS_INICIALES)
  const [mostrarModalEmpresa, setMostrarModalEmpresa] = useState(false)
  const [empresaEditando, setEmpresaEditando] = useState<EmpresaConglomerado | null>(null)

  // ── NIVEL 2: CLIENTES MAESTROS (POR RUT) ──
  const [clientesMaestros, setClientesMaestros] = useState<Record<string, ClienteMaestro>>({})
  const [rutClienteSeleccionado, setRutClienteSeleccionado] = useState<string>('')
  const [busquedaClienteInput, setBusquedaClienteInput] = useState<string>('')

  // ── NIVEL 3: CENTROS DE COSTO / ABONADOS (COMMAND CENTER) ──
  const [abonadosCentrosCosto, setAbonadosCentrosCosto] = useState<Record<string, CentroDeCostoAbonado>>({})

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
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<any[]>([])
  const [facturas, setFacturas] = useState<FacturaIndividual[]>([])
  const [mostrarModalCargaFacturas, setMostrarModalCargaFacturas] = useState(false)
  const [facturasTextoRaw, setFacturasTextoRaw] = useState('')
  const [busquedaFacturaInput, setBusquedaFacturaInput] = useState('')

  const [cotizaciones, setCotizaciones] = useState<CotizacionDolibarr[]>([])
  const [mostrarModalCotizacion, setMostrarModalCotizacion] = useState(false)
  const [cotSeleccionada, setCotSeleccionada] = useState<CotizacionDolibarr | null>(null)
  
  // Formulario Cotización Dolibarr
  const [cotEmpresaEmisoraId, setCotEmpresaEmisoraId] = useState('EMP-1')
  const [cotRutCliente, setCotRutCliente] = useState('')
  const [cotNombreCliente, setCotNombreCliente] = useState('')
  const [cotDireccion, setCotDireccion] = useState('')
  const [cotValidez, setCotValidez] = useState(15)
  const [cotObservaciones, setCotObservaciones] = useState('')
  const [itemsCot, setItemsCot] = useState<ItemCotizacion[]>([
    { id: '1', descripcion: 'Control remoto inalambrico RadioFrecuencia 4Botones', cantidad: 1, precio_neto_unitario: 31000, descuento_porcentaje: 0 }
  ])

  const [enviandoNotif, setEnviandoNotif] = useState(false)

  // ── INICIALIZACIÓN DE DATOS JERÁRQUICOS DESDE SUPABASE ──
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

        // Construir jerarquía: Cliente (RUT) -> Centros de Costo (Abonados)
        const mapaMaestro: Record<string, ClienteMaestro> = {}
        const mapaCentrosCosto: Record<string, CentroDeCostoAbonado> = {}

        const todasCuentas = new Set([...Object.keys(clientesFallback), ...Object.keys(rawClientesMap)])

        todasCuentas.forEach(cta => {
          const raw = rawClientesMap[cta] || clientesFallback[cta] || {}
          const cCode = (raw.cuenta || cta).toUpperCase().trim()
          const rutLimpio = cleanRut(raw.rut || '76123456K') || '76123456K'
          const razonSocial = (raw.nombre || 'CLIENTE SIN NOMBRE').toUpperCase().trim()

          // Registrar Abonado/Centro de Costo
          mapaCentrosCosto[cCode] = {
            cuenta: cCode,
            alias_centro_costo: raw.alias_unidad || raw.nombre || `Centro de Costo ${cCode}`,
            direccion: raw.direccion || 'Dirección sin registrar',
            ciudad: raw.ciudad || 'SANTIAGO',
            rut_cliente: rutLimpio
          }

          // Registrar o actualizar Cliente Maestro por RUT
          if (!mapaMaestro[rutLimpio]) {
            mapaMaestro[rutLimpio] = {
              rut: rutLimpio,
              razon_social: razonSocial,
              empresa_facturadora_id: raw.empresa_facturadora_id || 'EMP-1',
              email_cobranza: raw.email || 'cobranza@cliente.cl',
              telefono: raw.telefono1 || raw.t1 || raw.telefono || '+56991016912',
              direccion_comercial: raw.direccion || 'Dirección Comercial Principal',
              moneda: raw.moneda === 'UF' ? 'UF' : 'CLP',
              tarifa_mensual: Number(raw.tarifa_mensual) || (raw.moneda === 'UF' ? 1.2 : 29900),
              dia_vencimiento: Number(raw.dia_vencimiento) || 5,
              plan_monitoreo: raw.plan || 'MONITOREO ESTÁNDAR 24/7',
              estado_pago: raw.estado_pago || 'Al Día',
              cuentas_abonados: [cCode]
            }
          } else {
            if (!mapaMaestro[rutLimpio].cuentas_abonados.includes(cCode)) {
              mapaMaestro[rutLimpio].cuentas_abonados.push(cCode)
            }
          }
        })

        setClientesMaestros(mapaMaestro)
        setAbonadosCentrosCosto(mapaCentrosCosto)

        // 3. Cargar OTs, Facturas y Cotizaciones
        const { data: dOT } = await supabase.from('eventos_monitoreo').select('nombre_abonado').eq('cuenta', 'ORDENES_TRABAJO').limit(1)
        if (dOT && dOT.length > 0 && dOT[0].nombre_abonado) try { setOrdenesTrabajo(JSON.parse(dOT[0].nombre_abonado)) } catch (e) {}

        const { data: dFact } = await supabase.from('eventos_monitoreo').select('nombre_abonado').eq('cuenta', 'FACTURAS_MAESTRO').limit(1)
        if (dFact && dFact.length > 0 && dFact[0].nombre_abonado) try { setFacturas(JSON.parse(dFact[0].nombre_abonado)) } catch (e) {}

        const { data: dCot } = await supabase.from('eventos_monitoreo').select('nombre_abonado').eq('cuenta', 'COTIZACIONES_DOLIBARR').limit(1)
        if (dCot && dCot.length > 0 && dCot[0].nombre_abonado) try { setCotizaciones(JSON.parse(dCot[0].nombre_abonado)) } catch (e) {}

      } catch (err) {
        console.error('Error cargando estructura jerárquica:', err)
      }
    }
    fetchDatosJerarquicos()
  }, [])

  // Cliente activo seleccionado
  const clienteActivo = rutClienteSeleccionado && clientesMaestros[rutClienteSeleccionado] ? clientesMaestros[rutClienteSeleccionado] : null
  const empresaFacturadoraActiva = clienteActivo ? empresasConglomerado.find(e => e.id === clienteActivo.empresa_facturadora_id) || empresasConglomerado[0] : empresasConglomerado[0]

  // Lista de Centros de Costo (Abonados) asignados al Cliente Activo
  const centrosCostoClienteActivo = useMemo(() => {
    if (!clienteActivo) return []
    return clienteActivo.cuentas_abonados.map(cta => abonadosCentrosCosto[cta]).filter(Boolean)
  }, [clienteActivo, abonadosCentrosCosto])

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

    // Sincronizar plano llano para Command Center ('CLIENTES' en Supabase)
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
      alert(`✅ Ficha del Cliente RUT ${clienteActualizado.rut} (${clienteActualizado.razon_social}) sincronizada en todo el sistema.`)
    } catch (e: any) {
      alert('Error guardando cliente: ' + e.message)
    }
  }

  // ── VINCULAR O CREAR UN CENTRO DE COSTO (ABONADO COMMAND CENTER) ──
  const handleVincularCentroDeCosto = async () => {
    if (!clienteActivo) return
    const ctaUpper = nuevaCuentaAbonadoInput.toUpperCase().trim()
    if (!ctaUpper) {
      alert('Por favor ingrese el código de cuenta del Abonado (ej: C774).')
      return
    }

    // Crear/actualizar Centro de Costo
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

    // Sincronizar en Supabase para Command Center
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
      alert(`🎉 Centro de Costo / Abonado "${ctaUpper}" vinculado exitosamente al Cliente RUT ${clienteActivo.rut}.`)
    } catch (e: any) {
      alert('Error vinculando abonado: ' + e.message)
    }
  }

  // ── BUSCADOR UNIFICADO EN LA FICHA 360° (BUSCA POR RUT, CLIENTE, EMAIL O ABONADO) ──
  const listaClientesFiltrados = useMemo(() => {
    const q = busquedaClienteInput.toLowerCase().trim()
    if (!q) return []
    return Object.values(clientesMaestros).filter(c =>
      c.rut.toLowerCase().includes(q) ||
      c.razon_social.toLowerCase().includes(q) ||
      c.email_cobranza.toLowerCase().includes(q) ||
      c.cuentas_abonados.some(cta => cta.toLowerCase().includes(q))
    )
  }, [clientesMaestros, busquedaClienteInput])

  // Cotización guardada con selección de Empresa Emisora
  const handleGuardarCotizacionDolibarr = async () => {
    if (!cotNombreCliente.trim()) {
      alert('Por favor ingrese la razón social del cliente.')
      return
    }

    const numSecuencia = (cotizaciones.length + 258).toString().padStart(4, '0')
    const codigoCot = `PR2607-${numSecuencia}`

    const nuevaCot: CotizacionDolibarr = {
      id: Date.now(),
      codigo_cotizacion: codigoCot,
      cuenta: cotRutCliente,
      rut_cliente: cleanRut(cotRutCliente),
      nombre_cliente: cotNombreCliente.trim(),
      empresa_facturadora_id: cotEmpresaEmisoraId,
      direccion: cotDireccion || 'Dirección de Entrega',
      fecha: new Date().toLocaleDateString('es-CL'),
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
      alert(`🎉 Presupuesto Dolibarr ${codigoCot} creado exitosamente.`)
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

  const enviarWhatsAppCobro = async (telefono: string, clienteNombre: string, detalleStr: string) => {
    if (!telefono) { alert('No hay teléfono de contacto.'); return }
    setEnviandoNotif(true)
    try {
      let numClean = telefono.replace(/[^0-9]/g, '')
      if (numClean.length === 9 && numClean.startsWith('9')) numClean = '56' + numClean

      const msg = `💳 *${empresaFacturadoraActiva.razon_social} - Estado de Cuenta & Cobranza*\n\nEstimado(a) *${clienteNombre}*,\n\nLe recordamos la cobranza pendiente de su cuenta:\n• *Detalle:* ${detalleStr}\n• *Banco:* ${empresaFacturadoraActiva.banco_nombre}\n• *Nº Cta:* ${empresaFacturadoraActiva.banco_numero_cuenta}\n• *Email Cobranza:* ${empresaFacturadoraActiva.email_cobranza}\n\nAgradecemos su atención.`

      await fetch('/api/whatsapp/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: numClean, mensaje: msg })
      })
      alert(`📲 Aviso enviado por WhatsApp a ${numClean}.`)
    } catch (e: any) {
      alert('Error enviando WhatsApp: ' + e.message)
    } finally {
      setEnviandoNotif(false)
    }
  }

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
                SISTEMA OPERATIVO & CRM 360°
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {empresasConglomerado.length} Razones Sociales Emisoras • Gestión Comercial por RUT & Centros de Costo
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
              { id: 'ficha360', label: 'Ficha 360° del Cliente (RUT)', icon: '👤' },
              { id: 'presupuestos', label: 'Presupuestos (Dolibarr)', icon: '📋' },
              { id: 'facturacion', label: 'Facturación & Cobranza', icon: '🧾' },
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

          {/* ── MÓDULO 1: FICHA 360° DEL CLIENTE POR RUT & CENTROS DE COSTO ── */}
          {moduloActivo === 'ficha360' && (
            <div className="flex-1 flex flex-col gap-10 min-h-0">
              
              {/* Buscador Neumórfico Espacioso */}
              <div className="bg-white border border-slate-200/90 p-8 rounded-3xl shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] flex flex-col gap-5">
                <div className="font-bold text-xs text-slate-700 uppercase tracking-wider flex justify-between items-center">
                  <span>🔍 BUSCADOR UNIFICADO (BUSCA POR RUT, CLIENTE, EMAIL O CUENTA ABONADO)</span>
                  {rutClienteSeleccionado && (
                    <button
                      onClick={() => { setRutClienteSeleccionado(''); setBusquedaClienteInput('') }}
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
                    placeholder="Escriba RUT del Cliente (ej: 76.319.399-3), Razón Social, Email o Cuenta Abonado (ej: C774)..."
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-7 py-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono shadow-[inset_2px_2px_5px_rgba(203,213,225,0.5)]"
                  />

                  {busquedaClienteInput.trim().length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-3xl shadow-2xl z-20 max-h-96 overflow-y-auto divide-y divide-slate-100 p-4">
                      {listaClientesFiltrados.map(c => (
                        <div
                          key={c.rut}
                          onClick={() => { setRutClienteSeleccionado(c.rut); setBusquedaClienteInput('') }}
                          className="p-4 hover:bg-blue-50 rounded-2xl cursor-pointer flex justify-between items-center transition-colors"
                        >
                          <div>
                            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                              {c.razon_social}
                              <span className="font-mono text-blue-800 text-xs bg-blue-100 px-2.5 py-0.5 rounded-md font-bold">RUT: {c.rut}</span>
                            </div>
                            <div className="text-xs text-slate-500 font-medium mt-1">
                              Centros de Costo ({c.cuentas_abonados.length}): <strong className="text-slate-800 font-mono">{c.cuentas_abonados.join(', ')}</strong> • Email: <strong className="text-blue-900">{c.email_cobranza}</strong>
                            </div>
                          </div>
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                            c.estado_pago === 'Al Día' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {c.estado_pago}
                          </span>
                        </div>
                      ))}
                      {listaClientesFiltrados.length === 0 && (
                        <div className="p-6 text-center text-slate-400 italic text-xs">
                          No se encontraron clientes coincidentes con "{busquedaClienteInput}".
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* DOSSIER 360° DEL CLIENTE MAESTRO & CENTROS DE COSTO */}
              {clienteActivo ? (
                <div className="bg-white border border-slate-200/90 rounded-3xl p-10 flex flex-col gap-10 shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] overflow-y-auto">
                  
                  {/* HEADER DEL CLIENTE CON EMPRESA EMISORA ASIGNADA */}
                  <div className="bg-[#f8fafc] border border-slate-200 p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[inset_2px_2px_4px_rgba(203,213,225,0.3)]">
                    <div>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="bg-blue-950 text-white font-mono text-xs font-bold px-4 py-1.5 rounded-xl">
                          RUT CLIENTE: {clienteActivo.rut}
                        </span>
                        <span className="bg-emerald-800 text-white font-bold text-xs px-4 py-1.5 rounded-xl flex items-center gap-1.5">
                          🏢 EMPRESA A CARGO: {empresaFacturadoraActiva.razon_social} ({empresaFacturadoraActiva.rut})
                        </span>
                      </div>
                      <h2 className="text-3xl font-black text-slate-900">{clienteActivo.razon_social}</h2>
                      <p className="text-xs text-slate-600 font-medium mt-1.5">
                        📍 {clienteActivo.direccion_comercial} | ✉️ <strong>{clienteActivo.email_cobranza}</strong> | 📞 {clienteActivo.telefono}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <button
                        onClick={() => abrirModalEditarCliente(clienteActivo)}
                        className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs shadow-xs cursor-pointer"
                      >
                        ✏️ Editar Cliente & Empresa Emisora
                      </button>
                      <button
                        onClick={() => setMostrarModalVincularAbonado(true)}
                        className="px-5 py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-2xl text-xs shadow-xs cursor-pointer"
                      >
                        ➕ Vincular Centro de Costo (Abonado)
                      </button>
                      <button
                        disabled={enviandoNotif}
                        onClick={() => enviarEmailCobroResend(clienteActivo.email_cobranza, clienteActivo.razon_social, `Cliente RUT ${clienteActivo.rut}`)}
                        className="px-5 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs shadow-xs cursor-pointer"
                      >
                        📧 Enviar Cobro Resend
                      </button>
                    </div>
                  </div>

                  {/* 3 PILARES JERÁRQUICOS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* PILAR 1: COMERCIAL Y TARIFAS */}
                    <div className="bg-[#f8fafc] border border-slate-200/90 p-7 rounded-3xl flex flex-col gap-5 shadow-[3px_3px_8px_rgba(203,213,225,0.5)]">
                      <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-3 flex justify-between uppercase tracking-wider">
                        <span>💳 DATOS COMERCIALES DE COBRO</span>
                        <span className="text-emerald-700 font-mono font-bold">{clienteActivo.moneda}</span>
                      </div>

                      <div className="space-y-4 text-xs font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Factura por Conglomerado:</span>
                          <span className="font-bold text-blue-900 truncate max-w-[150px]">{empresaFacturadoraActiva.razon_social}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-slate-500">Plan de Monitoreo:</span>
                          <span className="font-bold text-slate-900 truncate">{clienteActivo.plan_monitoreo}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-slate-500">Tarifa Mensual:</span>
                          <span className="font-bold font-mono text-emerald-800">
                            {clienteActivo.moneda === 'UF'
                              ? `${clienteActivo.tarifa_mensual} UF ($${Math.round(clienteActivo.tarifa_mensual * valorUF).toLocaleString('es-CL')})`
                              : `$${clienteActivo.tarifa_mensual.toLocaleString('es-CL')} CLP`}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-slate-500">Día de Cobro:</span>
                          <span className="font-bold text-slate-900">Día {clienteActivo.dia_vencimiento}</span>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                          <span className="text-slate-500">Estado Financiero:</span>
                          <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                            clienteActivo.estado_pago === 'Al Día' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {clienteActivo.estado_pago.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* PILAR 2: CENTROS DE COSTO / ABONADOS VINCULADOS */}
                    <div className="bg-[#f8fafc] border border-slate-200/90 p-7 rounded-3xl flex flex-col gap-5 shadow-[3px_3px_8px_rgba(203,213,225,0.5)]">
                      <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-3 flex justify-between uppercase tracking-wider">
                        <span>🏢 CENTROS DE COSTO / ABONADOS</span>
                        <span className="font-mono text-blue-900 font-bold">({centrosCostoClienteActivo.length})</span>
                      </div>

                      <div className="space-y-3 flex-1 overflow-y-auto max-h-[250px]">
                        {centrosCostoClienteActivo.map((cc) => (
                          <div key={cc.cuenta} className="p-4 bg-white rounded-2xl border border-slate-200/80 text-xs space-y-1.5 shadow-2xs">
                            <div className="flex justify-between font-mono font-bold text-blue-950">
                              <span>Cuenta #{cc.cuenta}</span>
                              <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px]">Command Center</span>
                            </div>
                            <div className="font-bold text-slate-900">{cc.alias_centro_costo}</div>
                            <div className="text-xs text-slate-500 font-medium">{cc.direccion}</div>
                          </div>
                        ))}

                        {centrosCostoClienteActivo.length === 0 && (
                          <div className="text-center text-slate-400 italic py-12 text-xs">
                            Sin centros de costo / abonados vinculados a este RUT.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PILAR 3: SERVICIO TÉCNICO Y OTs */}
                    <div className="bg-[#f8fafc] border border-slate-200/90 p-7 rounded-3xl flex flex-col gap-5 shadow-[3px_3px_8px_rgba(203,213,225,0.5)]">
                      <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-3 flex justify-between uppercase tracking-wider">
                        <span>🛠️ ÓRDENES TÉCNICAS (COMMAND CENTER)</span>
                        <span className="font-mono text-slate-500 font-bold">(0)</span>
                      </div>

                      <div className="space-y-3 flex-1 overflow-y-auto max-h-[250px]">
                        <div className="text-center text-slate-400 italic py-12 text-xs">
                          Historial de OTs sincronizadas por Centro de Costo
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="bg-white border border-slate-200/90 rounded-3xl p-24 text-center shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] flex flex-col items-center justify-center gap-5">
                  <div className="text-7xl p-6 bg-[#f8fafc] rounded-3xl shadow-[inset_2px_2px_5px_rgba(203,213,225,0.5)]">👤</div>
                  <h3 className="text-2xl font-black text-slate-900">Expediente Comercial por RUT</h3>
                  <p className="text-xs text-slate-500 max-w-lg font-semibold leading-relaxed">
                    Seleccione un Cliente por RUT o busque en la barra superior para visualizar su Empresa Emisora asignada, Ficha Comercial y sus Centros de Costo (Abonados Command Center).
                  </p>
                </div>
              )}

            </div>
          )}

          {/* ── MÓDULO 2: PRESUPUESTOS DOLIBARR (PR2607) ── */}
          {moduloActivo === 'presupuestos' && (
            <div className="flex-1 bg-white border border-slate-200/90 rounded-3xl p-10 flex flex-col gap-8 shadow-[6px_6px_16px_rgba(203,213,225,0.7),-6px_-6px_16px_rgba(255,255,255,0.9)] min-h-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 border-b border-slate-200 pb-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                    📋 Presupuestos Comercial & Cotizaciones (Estilo Dolibarr)
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Emisión de Cotizaciones vinculadas a la Empresa del Conglomerado y Cliente (RUT)
                  </p>
                </div>

                <button
                  onClick={() => setMostrarModalCotizacion(true)}
                  className="px-6 py-4 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-2xl text-xs shadow-[3px_3px_8px_rgba(30,58,138,0.3)] cursor-pointer flex items-center gap-2"
                >
                  <span>➕ Nueva Cotización Comercial</span>
                </button>
              </div>

              <div className="flex-1 overflow-auto border border-slate-200/80 rounded-2xl bg-white shadow-2xs">
                <table className="w-full text-left border-collapse text-xs font-medium">
                  <thead>
                    <tr className="bg-[#f8fafc] text-slate-700 border-b border-slate-200 font-bold uppercase text-xs">
                      <th className="p-4 border-r border-slate-200">CÓDIGO</th>
                      <th className="p-4 border-r border-slate-200">FECHA</th>
                      <th className="p-4 border-r border-slate-200">EMPRESA EMISORA</th>
                      <th className="p-4 border-r border-slate-200">CLIENTE / RUT</th>
                      <th className="p-4 border-r border-slate-200 text-right">NETO</th>
                      <th className="p-4 border-r border-slate-200 text-right">TOTAL IVA INCL.</th>
                      <th className="p-4 border-r border-slate-200 text-center">ESTADO</th>
                      <th className="p-4 text-center w-32">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {cotizaciones.map(c => {
                      const empEmisora = empresasConglomerado.find(e => e.id === c.empresa_facturadora_id) || empresasConglomerado[0]
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80">
                          <td className="p-4 font-mono font-bold text-blue-900 border-r border-slate-200">{c.codigo_cotizacion}</td>
                          <td className="p-4 font-mono text-slate-600 border-r border-slate-200">{c.fecha}</td>
                          <td className="p-4 border-r border-slate-200 font-bold text-emerald-800 text-xs">{empEmisora.razon_social}</td>
                          <td className="p-4 border-r border-slate-200">
                            <div className="font-bold text-slate-900 text-xs">{c.nombre_cliente}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">RUT: {c.rut_cliente || 'N/A'}</div>
                          </td>
                          <td className="p-4 text-right font-mono text-slate-700 border-r border-slate-200">
                            ${Math.round(c.neto_con_descuento || 0).toLocaleString('es-CL')} CLP
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-emerald-800 border-r border-slate-200">
                            ${Math.round(c.monto_total_iva_incluido || 0).toLocaleString('es-CL')} CLP
                          </td>
                          <td className="p-4 text-center border-r border-slate-200 font-bold">
                            <span className={`px-3 py-1 rounded-full text-xs ${
                              c.estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {c.estado.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4 text-center flex items-center justify-center">
                            <button
                              onClick={() => setCotSeleccionada(c)}
                              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-2xs"
                            >
                              📄 Ver PDF Dolibarr
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

          {/* ── MÓDULO 6: CRUD DE EMPRESAS DEL CONGLOMERADO (4 RAZONES SOCIALES) ── */}
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

      {/* ── MODAL CRUD PARA AGREGAR/EDITAR EMPRESA EMISORA ── */}
      {mostrarModalEmpresa && empresaEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="bg-white border border-slate-300 w-full max-w-2xl p-9 rounded-3xl shadow-2xl space-y-6 text-xs font-sans max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <h3 className="font-black text-lg text-slate-900 uppercase tracking-wide">
                ⚙️ {empresaEditando.id ? 'Editar Empresa Emisora' : 'Agregar Nueva Empresa Emisora'}
              </h3>
              <button onClick={() => setMostrarModalEmpresa(false)} className="text-slate-400 font-bold text-2xl">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Razón Social Emisora:</label>
                  <input
                    type="text"
                    value={empresaEditando.razon_social}
                    onChange={(e) => setEmpresaEditando({ ...empresaEditando, razon_social: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 p-3 rounded-2xl font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">RUT Empresa:</label>
                  <input
                    type="text"
                    value={empresaEditando.rut}
                    onChange={(e) => setEmpresaEditando({ ...empresaEditando, rut: cleanRut(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 p-3 rounded-2xl font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Giro Comercial:</label>
                <input
                  type="text"
                  value={empresaEditando.giro}
                  onChange={(e) => setEmpresaEditando({ ...empresaEditando, giro: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 p-3 rounded-2xl text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Dirección Fiscal:</label>
                <input
                  type="text"
                  value={empresaEditando.direccion}
                  onChange={(e) => setEmpresaEditando({ ...empresaEditando, direccion: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 p-3 rounded-2xl text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Cobranza:</label>
                  <input
                    type="email"
                    value={empresaEditando.email_cobranza}
                    onChange={(e) => setEmpresaEditando({ ...empresaEditando, email_cobranza: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 p-3 rounded-2xl text-blue-900 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Teléfono:</label>
                  <input
                    type="text"
                    value={empresaEditando.telefono}
                    onChange={(e) => setEmpresaEditando({ ...empresaEditando, telefono: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 p-3 rounded-2xl font-mono text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Banco:</label>
                  <input
                    type="text"
                    value={empresaEditando.banco_nombre}
                    onChange={(e) => setEmpresaEditando({ ...empresaEditando, banco_nombre: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 p-3 rounded-2xl text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipo Cta:</label>
                  <input
                    type="text"
                    value={empresaEditando.banco_tipo_cuenta}
                    onChange={(e) => setEmpresaEditando({ ...empresaEditando, banco_tipo_cuenta: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 p-3 rounded-2xl text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nº Cuenta:</label>
                  <input
                    type="text"
                    value={empresaEditando.banco_numero_cuenta}
                    onChange={(e) => setEmpresaEditando({ ...empresaEditando, banco_numero_cuenta: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 p-3 rounded-2xl font-mono text-slate-900 font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
              <button onClick={() => setMostrarModalEmpresa(false)} className="px-5 py-3 bg-slate-200 text-slate-800 font-bold rounded-2xl cursor-pointer">Cancelar</button>
              <button onClick={handleGuardarEmpresaEmisora} className="px-6 py-3 bg-blue-900 text-white font-bold rounded-2xl shadow-xs cursor-pointer">💾 Guardar Empresa</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR CLIENTE (RUT) Y ASIGNAR EMPRESA DEL CONGLOMERADO ── */}
      {mostrarModalCliente && clienteActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="bg-white border border-slate-300 w-full max-w-2xl p-9 rounded-3xl shadow-2xl space-y-6 text-xs font-sans max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-black text-lg text-slate-900 uppercase tracking-wide">
                  ✏️ Editar Cliente Comercial (RUT: {clienteActivo.rut})
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Asigne la Empresa del Conglomerado que le facturará a este cliente.</p>
              </div>
              <button onClick={() => setMostrarModalCliente(false)} className="text-slate-400 font-bold text-2xl">✕</button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
                <label className="font-extrabold text-blue-950 block mb-1 text-xs uppercase tracking-wider">
                  🏢 Empresa del Conglomerado Asignada (Emisora / Facturadora):
                </label>
                <select
                  value={editEmpresaId}
                  onChange={(e) => setEditEmpresaId(e.target.value)}
                  className="w-full bg-white border border-blue-300 p-3 rounded-xl font-bold text-slate-900 text-xs focus:outline-none"
                >
                  {empresasConglomerado.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.razon_social} (RUT: {emp.rut})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Razón Social Cliente:</label>
                  <input
                    type="text"
                    value={editRazonSocial}
                    onChange={(e) => setEditRazonSocial(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-3.5 rounded-2xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Cobranza:</label>
                  <input
                    type="email"
                    value={editEmailCobranza}
                    onChange={(e) => setEditEmailCobranza(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-3.5 rounded-2xl font-bold text-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Teléfono:</label>
                  <input
                    type="text"
                    value={editTelefono}
                    onChange={(e) => setEditTelefono(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-3.5 rounded-2xl font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dirección Comercial:</label>
                  <input
                    type="text"
                    value={editDireccionComercial}
                    onChange={(e) => setEditDireccionComercial(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-3.5 rounded-2xl text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Moneda de Cobro:</label>
                  <select
                    value={editMoneda}
                    onChange={(e: any) => setEditMoneda(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-3.5 rounded-2xl font-bold text-slate-900"
                  >
                    <option value="CLP">CLP (Pesos Chilenos)</option>
                    <option value="UF">UF (Unidad de Fomento)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monto Mensual:</label>
                  <input
                    type="number"
                    step={editMoneda === 'UF' ? '0.1' : '1000'}
                    value={editTarifa}
                    onChange={(e) => setEditTarifa(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-3.5 rounded-2xl font-mono font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-5 border-t border-slate-200">
              <button onClick={() => setMostrarModalCliente(false)} className="px-6 py-3.5 bg-slate-200 text-slate-800 font-bold rounded-2xl cursor-pointer">Cancelar</button>
              <button onClick={handleGuardarClienteMaestro} className="px-7 py-3.5 bg-blue-900 text-white font-bold rounded-2xl shadow-xs cursor-pointer">💾 Guardar Cliente</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL VINCULAR CENTRO DE COSTO (ABONADO COMMAND CENTER) ── */}
      {mostrarModalVincularAbonado && clienteActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="bg-white border border-slate-300 w-full max-w-md p-8 rounded-3xl shadow-2xl space-y-5 text-xs font-sans">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide">
                ➕ Vincular Centro de Costo (Abonado)
              </h3>
              <button onClick={() => setMostrarModalVincularAbonado(false)} className="text-slate-400 font-bold text-xl">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Código de Abonado / Cuenta Command Center (ej: C774):</label>
                <input
                  type="text"
                  value={nuevaCuentaAbonadoInput}
                  onChange={(e) => setNuevaCuentaAbonadoInput(e.target.value)}
                  placeholder="C774"
                  className="w-full bg-slate-50 border border-slate-300 p-3 rounded-2xl font-mono font-bold text-slate-900 uppercase focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre / Alias del Centro de Costo:</label>
                <input
                  type="text"
                  value={nuevoAliasCentroCostoInput}
                  onChange={(e) => setNuevoAliasCentroCostoInput(e.target.value)}
                  placeholder="Ej: Sucursal San Bernardo / Planta Lampa"
                  className="w-full bg-slate-50 border border-slate-300 p-3 rounded-2xl text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Dirección del Centro de Costo:</label>
                <input
                  type="text"
                  value={nuevaDireccionAbonadoInput}
                  onChange={(e) => setNuevaDireccionAbonadoInput(e.target.value)}
                  placeholder="Av. Lo Blanco 713, San Bernardo"
                  className="w-full bg-slate-50 border border-slate-300 p-3 rounded-2xl text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button onClick={() => setMostrarModalVincularAbonado(false)} className="px-4 py-2.5 bg-slate-200 text-slate-800 font-bold rounded-2xl cursor-pointer">Cancelar</button>
              <button onClick={handleVincularCentroDeCosto} className="px-5 py-2.5 bg-blue-900 text-white font-bold rounded-2xl cursor-pointer">🚀 Vincular a RUT {clienteActivo.rut}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NUEVA COTIZACIÓN COMERCIAL CON SELECCIÓN DE EMPRESA DEL CONGLOMERADO ── */}
      {mostrarModalCotizacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="bg-white border border-slate-300 w-full max-w-6xl p-10 rounded-3xl shadow-2xl space-y-6 font-sans text-xs max-h-[94vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-5">
              <div>
                <h3 className="font-black text-lg text-slate-900 uppercase tracking-wide">
                  📋 Crear Presupuesto Comercial (Formato Oficial Dolibarr PR2607)
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Seleccione la Empresa del Conglomerado emisora y el Cliente receptor</p>
              </div>
              <button onClick={() => setMostrarModalCotizacion(false)} className="text-slate-400 font-bold text-2xl">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5 text-xs">Empresa del Conglomerado Emisora:</label>
                <select
                  value={cotEmpresaEmisoraId}
                  onChange={(e) => setCotEmpresaEmisoraId(e.target.value)}
                  className="bg-[#f8fafc] border border-blue-300 text-slate-900 p-3.5 rounded-2xl w-full focus:outline-none font-bold text-xs"
                >
                  {empresasConglomerado.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.razon_social} ({emp.rut})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5 text-xs">Razón Social Cliente Receptor:</label>
                <input
                  type="text"
                  value={cotNombreCliente}
                  onChange={(e) => setCotNombreCliente(e.target.value)}
                  placeholder="Ej: CORPORACION PRODEL"
                  className="bg-[#f8fafc] border border-slate-300 text-slate-900 p-3.5 rounded-2xl w-full focus:outline-none font-bold text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5 text-xs">RUT Cliente Receptor:</label>
                <input
                  type="text"
                  value={cotRutCliente}
                  onChange={(e) => setCotRutCliente(cleanRut(e.target.value))}
                  placeholder="76319399-3"
                  className="bg-[#f8fafc] border border-slate-300 text-slate-900 p-3.5 rounded-2xl w-full focus:outline-none font-mono font-bold text-xs"
                />
              </div>
            </div>

            {/* TABLA DE ÍTEMS CON ESPACIO AMPLIO */}
            <div className="space-y-4 border-t border-b border-slate-200 py-6">
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-900 uppercase tracking-wider text-xs">Ítems del Presupuesto (Neto & Descuento)</span>
                <button
                  onClick={() => setItemsCot([...itemsCot, { id: Date.now().toString(), descripcion: 'Nuevo ítem / servicio', cantidad: 1, precio_neto_unitario: 10000, descuento_porcentaje: 0 }])}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold cursor-pointer hover:bg-slate-800 shadow-xs"
                >
                  + Agregar Línea
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {itemsCot.map((it, idx) => (
                  <div key={it.id} className="grid grid-cols-12 gap-3 items-center bg-[#f8fafc] p-3.5 rounded-2xl border border-slate-200">
                    <input
                      type="text"
                      value={it.descripcion}
                      onChange={(e) => {
                        const newIt = [...itemsCot]
                        newIt[idx].descripcion = e.target.value
                        setItemsCot(newIt)
                      }}
                      placeholder="Descripción del producto o servicio..."
                      className="col-span-5 bg-white border border-slate-300 p-3 rounded-xl text-xs font-medium"
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
                    <input
                      type="number"
                      value={it.descuento_porcentaje}
                      onChange={(e) => {
                        const newIt = [...itemsCot]
                        newIt[idx].descuento_porcentaje = Number(e.target.value) || 0
                        setItemsCot(newIt)
                      }}
                      className="col-span-1 bg-white border border-slate-300 p-3 rounded-xl text-xs font-mono text-center font-bold"
                    />
                    <button
                      onClick={() => setItemsCot(itemsCot.filter(i => i.id !== it.id))}
                      className="col-span-1 text-red-600 font-bold hover:text-red-800 text-center text-lg cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* RESUMEN DE TOTALES */}
            <div className="bg-[#f8fafc] p-6 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono max-w-sm ml-auto">
              <div className="flex justify-between">
                <span className="text-slate-600">Total (Base imp.):</span>
                <span className="font-bold">${Math.round(calculoCotizacionActual.netoConDescuento).toLocaleString('es-CL')} CLP</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total IVA 19%:</span>
                <span>${Math.round(calculoCotizacionActual.montoIva).toLocaleString('es-CL')} CLP</span>
              </div>
              <div className="flex justify-between text-base font-black text-blue-900 border-t border-slate-300 pt-2">
                <span>TOTAL:</span>
                <span>${Math.round(calculoCotizacionActual.totalIvaIncluido).toLocaleString('es-CL')} CLP</span>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
              <button onClick={() => setMostrarModalCotizacion(false)} className="px-6 py-3.5 bg-slate-200 text-slate-800 font-bold rounded-2xl cursor-pointer text-xs">Cancelar</button>
              <button onClick={handleGuardarCotizacionDolibarr} className="px-7 py-3.5 bg-blue-900 text-white font-bold rounded-2xl shadow-xs cursor-pointer text-xs">💾 Generar Cotización PR2607</button>
            </div>
          </div>
        </div>
      )}

      {/* ── VISOR DE COTIZACIÓN RENDIDO SEGÚN PR2607-0258.pdf ── */}
      {cotSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 overflow-y-auto">
          <div className="bg-white text-slate-900 p-10 md:p-12 rounded-3xl max-w-4xl w-full shadow-2xl font-sans my-auto border border-slate-300 space-y-8 min-h-[750px] flex flex-col justify-between">
            
            <div className="space-y-6">
              {/* ENCABEZADO: MEMBRETE EMISOR DE LA EMPRESA DEL CONGLOMERADO SELECCIONADA */}
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
                      <div className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Enviar a</div>
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

                <div className="text-xs font-semibold text-slate-500 italic bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  Importes visualizados en Chile Peso
                </div>
              </div>

              {/* TABLA PR2607-0258 */}
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
                    <span className="font-bold text-slate-900">${Math.round(cotSeleccionada.neto_con_descuento || 0).toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-[#f8fafc] border-b border-slate-200">
                    <span className="text-slate-700 font-bold">Total IVA 19%:</span>
                    <span className="font-bold text-slate-900">${Math.round(cotSeleccionada.monto_iva || 0).toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-[#000033] text-white font-black text-sm">
                    <span>Total:</span>
                    <span>${Math.round(cotSeleccionada.monto_total_iva_incluido || 0).toLocaleString('es-CL')} CLP</span>
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
                <button onClick={() => window.print()} className="px-6 py-2.5 bg-blue-900 text-white font-bold text-xs rounded-2xl hover:bg-blue-950 shadow-xs cursor-pointer flex items-center gap-2"><span>🖨️ Imprimir Cotización Dolibarr (PDF)</span></button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
