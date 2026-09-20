'use client'

import React, { useState, useMemo } from 'react'
import {
  DollarSign,
  Receipt,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Download,
  Trash2,
  CreditCard,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  SlidersHorizontal,
  X,
  FileSpreadsheet
} from 'lucide-react'

export interface FacturaCompra {
  id: string
  numero_factura: string
  proveedor_rut: string
  proveedor_nombre: string
  categoria: 'Hardware Alarmas' | 'CCTV & Cámaras' | 'SIMs M2M & Datos' | 'Cercos Eléctricos' | 'Infraestructura & Servidores' | 'Servicios Generales'
  fecha_emision: string
  fecha_vencimiento: string
  monto_neto: number
  monto_iva: number
  monto_total: number
  estado: 'Pagada' | 'Pendiente' | 'Vencida'
  medio_pago?: string
  notas?: string
}

export interface Proveedor {
  rut: string
  razon_social: string
  giro: string
  contacto: string
  email: string
  telefono: string
  dias_credito: number
  categoria_principal: string
}

const PROVEEDORES_INICIALES: Proveedor[] = [
  {
    rut: '76.012.345-K',
    razon_social: 'Intcomex Chile S.A.',
    giro: 'Distribución Mayorista de Seguridad Electrónica',
    contacto: 'Rodrigo Morales',
    email: 'ventas.seguridad@intcomex.com',
    telefono: '+56 2 2480 5000',
    dias_credito: 30,
    categoria_principal: 'Hardware Alarmas & CCTV'
  },
  {
    rut: '96.852.140-3',
    razon_social: 'Anixter Jorvex Chile SpA',
    giro: 'Cables, Conectividad y Paneles DSC Neo',
    contacto: 'Carolina Fuenzalida',
    email: 'contacto@anixter.cl',
    telefono: '+56 2 2580 9000',
    dias_credito: 45,
    categoria_principal: 'Hardware Alarmas'
  },
  {
    rut: '77.345.980-1',
    razon_social: 'Entel PCS Telecomunicaciones S.A.',
    giro: 'Conectividad M2M y Tarjetas SIM Multicarrier',
    contacto: 'Mesa Corporativa IoT',
    email: 'iot.corporativo@entel.cl',
    telefono: '+56 800 360 000',
    dias_credito: 30,
    categoria_principal: 'SIMs M2M & Datos'
  },
  {
    rut: '76.456.789-2',
    razon_social: 'Dahua Technology Chile SpA',
    giro: 'Cámaras IP, NVRs y Reconocimiento IA',
    contacto: 'Felipe Valenzuela',
    email: 'ventas@dahuachile.cl',
    telefono: '+56 2 3210 4000',
    dias_credito: 30,
    categoria_principal: 'CCTV & Cámaras'
  },
  {
    rut: '76.890.123-4',
    razon_social: 'Macrotel SpA (Cercos Hagroy)',
    giro: 'Energizadores Perimetrales y Aisladores',
    contacto: 'Gonzalo Silva',
    email: 'cercos@macrotel.cl',
    telefono: '+56 2 2780 1234',
    dias_credito: 15,
    categoria_principal: 'Cercos Eléctricos'
  }
]

const FACTURAS_COMPRAS_INICIALES: FacturaCompra[] = [
  {
    id: 'FC-101',
    numero_factura: 'FAC-89234',
    proveedor_rut: '76.012.345-K',
    proveedor_nombre: 'Intcomex Chile S.A.',
    categoria: 'Hardware Alarmas',
    fecha_emision: '2026-09-02',
    fecha_vencimiento: '2026-10-02',
    monto_neto: 1850000,
    monto_iva: 351500,
    monto_total: 2201500,
    estado: 'Pendiente',
    notas: 'Lote de 10 Paneles DSC Neo y 30 Sensores PIR'
  },
  {
    id: 'FC-102',
    numero_factura: 'FAC-12450',
    proveedor_rut: '77.345.980-1',
    proveedor_nombre: 'Entel PCS Telecomunicaciones S.A.',
    categoria: 'SIMs M2M & Datos',
    fecha_emision: '2026-09-05',
    fecha_vencimiento: '2026-09-25',
    monto_neto: 480000,
    monto_iva: 91200,
    monto_total: 571200,
    estado: 'Pendiente',
    notas: 'Mensualidad 192 SIM Cards M2M Activas en terreno'
  },
  {
    id: 'FC-103',
    numero_factura: 'FAC-54321',
    proveedor_rut: '76.456.789-2',
    proveedor_nombre: 'Dahua Technology Chile SpA',
    categoria: 'CCTV & Cámaras',
    fecha_emision: '2026-08-20',
    fecha_vencimiento: '2026-09-20',
    monto_neto: 1250000,
    monto_iva: 237500,
    monto_total: 1487500,
    estado: 'Pagada',
    medio_pago: 'Transferencia Banco de Chile',
    notas: 'Cámaras 4K ColorVu y NVR 16 Canales'
  },
  {
    id: 'FC-104',
    numero_factura: 'FAC-7654',
    proveedor_rut: '76.890.123-4',
    proveedor_nombre: 'Macrotel SpA (Cercos Hagroy)',
    categoria: 'Cercos Eléctricos',
    fecha_emision: '2026-08-10',
    fecha_vencimiento: '2026-08-25',
    monto_neto: 680000,
    monto_iva: 129200,
    monto_total: 809200,
    estado: 'Pagada',
    medio_pago: 'Transferencia Bci',
    notas: 'Energizadores XPower y postes galvanizados'
  }
]

export default function ComprasProveedoresModule({
  clientesMaestros,
  abonadosCentrosCosto
}: {
  clientesMaestros: Record<string, any>
  abonadosCentrosCosto: Record<string, any>
}) {
  const [compras, setCompras] = useState<FacturaCompra[]>(() => {
    try {
      const s = localStorage.getItem('gama_facturas_compras')
      return s ? JSON.parse(s) : FACTURAS_COMPRAS_INICIALES
    } catch {
      return FACTURAS_COMPRAS_INICIALES
    }
  })

  const [proveedores, setProveedores] = useState<Proveedor[]>(() => {
    try {
      const s = localStorage.getItem('gama_proveedores')
      return s ? JSON.parse(s) : PROVEEDORES_INICIALES
    } catch {
      return PROVEEDORES_INICIALES
    }
  })

  const [subTab, setSubTab] = useState<'facturas' | 'proveedores' | 'rentabilidad'>('facturas')
  const [filtroEstado, setFiltroEstado] = useState<string>('Todas')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todas')
  const [busqueda, setBusqueda] = useState<string>('')

  // Modal Nueva Factura de Compra
  const [modalNuevaFactura, setModalNuevaFactura] = useState(false)
  const [formFolio, setFormFolio] = useState('')
  const [formProveedorRut, setFormProveedorRut] = useState(PROVEEDORES_INICIALES[0].rut)
  const [formCategoria, setFormCategoria] = useState<FacturaCompra['categoria']>('Hardware Alarmas')
  const [formFechaEmision, setFormFechaEmision] = useState(new Date().toISOString().split('T')[0])
  const [formFechaVencimiento, setFormFechaVencimiento] = useState('')
  const [formMontoNeto, setFormMontoNeto] = useState<number>(100000)
  const [formNotas, setFormNotas] = useState('')

  const handleCrearFactura = (e: React.FormEvent) => {
    e.preventDefault()
    const prov = proveedores.find(p => p.rut === formProveedorRut)
    const neto = Number(formMontoNeto) || 0
    const iva = Math.round(neto * 0.19)
    const total = neto + iva

    const nueva: FacturaCompra = {
      id: `FC-${Date.now()}`,
      numero_factura: formFolio || `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
      proveedor_rut: formProveedorRut,
      proveedor_nombre: prov?.razon_social || 'Proveedor Externo',
      categoria: formCategoria,
      fecha_emision: formFechaEmision,
      fecha_vencimiento: formFechaVencimiento || formFechaEmision,
      monto_neto: neto,
      monto_iva: iva,
      monto_total: total,
      estado: 'Pendiente',
      notas: formNotas
    }

    const actualizadas = [nueva, ...compras]
    setCompras(actualizadas)
    try { localStorage.setItem('gama_facturas_compras', JSON.stringify(actualizadas)) } catch {}
    setModalNuevaFactura(false)
    setFormFolio('')
    setFormMontoNeto(100000)
    setFormNotas('')
  }

  const handleCambiarEstado = (id: string, nuevoEstado: FacturaCompra['estado']) => {
    const actualizadas = compras.map(c => {
      if (c.id === id) {
        return {
          ...c,
          estado: nuevoEstado,
          medio_pago: nuevoEstado === 'Pagada' ? 'Transferencia Bancaria' : undefined
        }
      }
      return c
    })
    setCompras(actualizadas)
    try { localStorage.setItem('gama_facturas_compras', JSON.stringify(actualizadas)) } catch {}
  }

  // Cálculos Financieros
  const totalCuentasPorPagar = useMemo(() => {
    return compras
      .filter(c => c.estado === 'Pendiente' || c.estado === 'Vencida')
      .reduce((acc, c) => acc + c.monto_total, 0)
  }, [compras])

  const totalPagadoMes = useMemo(() => {
    return compras
      .filter(c => c.estado === 'Pagada')
      .reduce((acc, c) => acc + c.monto_total, 0)
  }, [compras])

  const totalIvaCreditoFiscal = useMemo(() => {
    return compras.reduce((acc, c) => acc + c.monto_iva, 0)
  }, [compras])

  // Matriz de Rentabilidad por Cuenta
  const rentabilidadAbonados = useMemo(() => {
    const lista = Object.entries(abonadosCentrosCosto || {}).map(([cta, cc]: [string, any]) => {
      const cli = clientesMaestros[cc.rut_cliente] || {}
      const tarifaIngreso = cli.tarifa_mensual || 29900
      const costoSIM = 2500 // Costo promedio chip M2M Entel/Movistar
      const costoAmortizacion = 3500 // Amortización panel y sensores
      const costoGuardia = 4000 // Prorrateo turno central
      const costoTotalDirecto = costoSIM + costoAmortizacion + costoGuardia
      const margenNeto = tarifaIngreso - costoTotalDirecto
      const margenPct = Math.round((margenNeto / (tarifaIngreso || 1)) * 100)

      return {
        cuenta: cta,
        alias: cc.alias_centro_costo || `Abonado ${cta}`,
        rut: cc.rut_cliente || cli.rut || 'S/RUT',
        tarifaIngreso,
        costoSIM,
        costoAmortizacion,
        costoGuardia,
        costoTotalDirecto,
        margenNeto,
        margenPct
      }
    })
    return lista.sort((a, b) => b.margenNeto - a.margenNeto)
  }, [abonadosCentrosCosto, clientesMaestros])

  const comprasFiltradas = useMemo(() => {
    return compras.filter(c => {
      const matchEstado = filtroEstado === 'Todas' || c.estado === filtroEstado
      const matchCat = filtroCategoria === 'Todas' || c.categoria === filtroCategoria
      const matchBusqueda = !busqueda.trim() ||
        c.numero_factura.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.proveedor_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.notas || '').toLowerCase().includes(busqueda.toLowerCase())
      return matchEstado && matchCat && matchBusqueda
    })
  }, [compras, filtroEstado, filtroCategoria, busqueda])

  return (
    <div className="space-y-7 text-slate-800 font-sans">
      
      {/* ── BENTO CARDS DE RESUMEN FINANCIERO ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* KPI 1: Cuentas por Pagar */}
        <div className="bg-red-50/70 border border-red-200/90 p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="space-y-3 px-1 py-0.5">
            <div className="flex justify-between items-center gap-2 text-red-900">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider leading-tight">
                CUENTAS POR PAGAR
              </span>
              <div className="w-8 h-8 rounded-full bg-white text-red-600 flex items-center justify-center shadow-2xs shrink-0">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-sans text-slate-900">
              ${totalCuentasPorPagar.toLocaleString('es-CL')} <span className="text-xs font-bold text-slate-400">CLP</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
              {compras.filter(c => c.estado === 'Pendiente').length} facturas por liquidar
            </p>
          </div>
        </div>

        {/* KPI 2: Total Pagado */}
        <div className="bg-emerald-50/70 border border-emerald-200/90 p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="space-y-3 px-1 py-0.5">
            <div className="flex justify-between items-center gap-2 text-emerald-900">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider leading-tight">
                TOTAL LIQUIDADO / PAGADO
              </span>
              <div className="w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-2xs shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-sans text-emerald-700">
              ${totalPagadoMes.toLocaleString('es-CL')} <span className="text-xs font-bold text-slate-400">CLP</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
              Egresos operacionales confirmados
            </p>
          </div>
        </div>

        {/* KPI 3: IVA Crédito Fiscal */}
        <div className="bg-blue-50/70 border border-blue-200/90 p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="space-y-3 px-1 py-0.5">
            <div className="flex justify-between items-center gap-2 text-[#1E40AF]">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider leading-tight">
                IVA CRÉDITO FISCAL (19%)
              </span>
              <div className="w-8 h-8 rounded-full bg-white text-[#1E40AF] flex items-center justify-center shadow-2xs shrink-0">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-sans text-slate-900">
              ${totalIvaCreditoFiscal.toLocaleString('es-CL')} <span className="text-xs font-bold text-slate-400">CLP</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
              Crédito a descontar en F29 SII
            </p>
          </div>
        </div>

        {/* KPI 4: Margen Promedio */}
        <div className="bg-indigo-50/70 border border-indigo-200/90 p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="space-y-3 px-1 py-0.5">
            <div className="flex justify-between items-center gap-2 text-indigo-900">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider leading-tight">
                MARGEN NETO / ABONADO
              </span>
              <div className="w-8 h-8 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-2xs shrink-0">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-sans text-indigo-900">
              71% Promedio
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
              Sobre base de {Object.keys(abonadosCentrosCosto).length} cuentas activas
            </p>
          </div>
        </div>

      </div>

      {/* ── NAVEGACIÓN SUB-PESTAÑAS DE COMPRAS ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-100/90 p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'facturas', label: `Facturas de Compra (${compras.length})`, icon: Receipt },
            { id: 'proveedores', label: `Directorio Proveedores (${proveedores.length})`, icon: Building2 },
            { id: 'rentabilidad', label: `Rentabilidad por Abonado`, icon: TrendingUp },
          ].map(t => {
            const Icon = t.icon
            const esActivo = subTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id as any)}
                className={`px-4.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all flex items-center gap-2 cursor-pointer ${esActivo ? 'bg-[#0B2545] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'}`}
              >
                <Icon className="h-4 w-4" />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>

        {subTab === 'facturas' && (
          <button
            onClick={() => setModalNuevaFactura(true)}
            className="bg-[#0B2545] hover:bg-[#1E40AF] text-white text-xs py-2.5 px-4 rounded-xl font-bold flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Ingresar Factura de Compra</span>
          </button>
        )}
      </div>

      {/* ── SECCIÓN 1: FACTURAS DE PROVEEDORES ── */}
      {subTab === 'facturas' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-300/80 shadow-sm space-y-6">
          
          {/* Barra de Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-[#1E40AF] pointer-events-none" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por N° factura, proveedor o detalle..."
                className="w-full bg-slate-50/80 border border-slate-300 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E40AF] focus:bg-white font-sans transition-all"
              />
            </div>

            <div>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-300 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#1E40AF] focus:bg-white font-sans font-semibold cursor-pointer transition-all"
              >
                <option value="Todas">Todos los Estados</option>
                <option value="Pendiente">🟡 Pendientes de Pago</option>
                <option value="Pagada">🟢 Pagadas</option>
                <option value="Vencida">🔴 Vencidas</option>
              </select>
            </div>

            <div>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-300 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#1E40AF] focus:bg-white font-sans font-semibold cursor-pointer transition-all"
              >
                <option value="Todas">Todas las Categorías</option>
                <option value="Hardware Alarmas">Hardware Alarmas</option>
                <option value="CCTV & Cámaras">CCTV & Cámaras</option>
                <option value="SIMs M2M & Datos">SIMs M2M & Datos</option>
                <option value="Cercos Eléctricos">Cercos Eléctricos</option>
              </select>
            </div>
          </div>

          {/* Tabla de Facturas de Compra */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/60 p-2 sm:p-3">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 font-black uppercase text-[10px] sm:text-[11px] text-slate-500 tracking-wider">
                  <th className="py-3 px-4">FOLIO FACTURA</th>
                  <th className="py-3 px-4">PROVEEDOR</th>
                  <th className="py-3 px-4">CATEGORÍA</th>
                  <th className="py-3 px-4">VENCIMIENTO</th>
                  <th className="py-3 px-4 text-right">NETO</th>
                  <th className="py-3 px-4 text-right">TOTAL</th>
                  <th className="py-3 px-4 text-center">ESTADO</th>
                  <th className="py-3 px-4 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 font-medium">
                {comprasFiltradas.map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-[#1E40AF] whitespace-nowrap">{c.numero_factura}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{c.proveedor_nombre}</div>
                      <div className="text-[11px] text-slate-500 font-mono">RUT: {c.proveedor_rut}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                        {c.categoria}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 text-xs whitespace-nowrap">
                      {c.fecha_vencimiento}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                      ${c.monto_neto.toLocaleString('es-CL')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      ${c.monto_total.toLocaleString('es-CL')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center justify-center px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide whitespace-nowrap shadow-2xs ${
                        c.estado === 'Pagada'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90'
                          : c.estado === 'Vencida'
                          ? 'bg-red-50 text-red-800 border border-red-200/90'
                          : 'bg-amber-50 text-amber-900 border border-amber-200/90'
                      }`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {c.estado !== 'Pagada' ? (
                        <button
                          onClick={() => handleCambiarEstado(c.id, 'Pagada')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                        >
                          Marcar Pagada
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">Liquidada</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ── SECCIÓN 2: DIRECTORIO DE PROVEEDORES ── */}
      {subTab === 'proveedores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {proveedores.map(p => (
            <div key={p.rut} className="bg-white rounded-2xl p-6 border border-slate-300/80 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{p.razon_social}</h4>
                  <p className="text-slate-500 text-xs font-mono mt-0.5">RUT: {p.rut}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E40AF] text-[10px] font-bold shrink-0">
                  Crédito {p.dias_credito} Días
                </span>
              </div>

              <div className="text-xs space-y-2 text-slate-600 border-t border-b border-slate-100 py-3.5">
                <div><strong className="text-slate-800">Giro:</strong> {p.giro}</div>
                <div><strong className="text-slate-800">Contacto:</strong> {p.contacto}</div>
                <div><strong className="text-slate-800">Email:</strong> {p.email}</div>
                <div><strong className="text-slate-800">Teléfono:</strong> {p.telefono}</div>
              </div>

              <div className="flex justify-between items-center pt-1 text-xs">
                <span className="text-slate-500">Categoría:</span>
                <span className="font-bold text-[#0B2545]">{p.categoria_principal}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SECCIÓN 3: MATRIZ DE RENTABILIDAD POR ABONADO ── */}
      {subTab === 'rentabilidad' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-300/80 shadow-sm space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                Análisis de Margen Neto Unitario por Abonado
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cálculo de ingresos mensuales descontando SIM M2M, amortización de hardware y costo de central.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full font-bold">
              Fórmula: Tarifa Cobrada - Costos Directos ($10.000)
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/60 p-2 sm:p-3">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 font-black uppercase text-[10px] sm:text-[11px] text-slate-500 tracking-wider">
                  <th className="py-3 px-4">CUENTA</th>
                  <th className="py-3 px-4">TITULAR / RAZÓN SOCIAL</th>
                  <th className="py-3 px-4 text-right">TARIFA MENSUAL</th>
                  <th className="py-3 px-4 text-right">CHIP SIM M2M</th>
                  <th className="py-3 px-4 text-right">AMORTIZACIÓN</th>
                  <th className="py-3 px-4 text-right">MARGEN NETO</th>
                  <th className="py-3 px-4 text-center">RENTABILIDAD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 font-medium">
                {rentabilidadAbonados.slice(0, 30).map(r => (
                  <tr key={r.cuenta} className="hover:bg-blue-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-black text-[#1E40AF] whitespace-nowrap">#{r.cuenta}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 truncate max-w-xs">{r.alias}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">${r.tarifaIngreso.toLocaleString('es-CL')}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500 whitespace-nowrap">-${r.costoSIM.toLocaleString('es-CL')}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500 whitespace-nowrap">-${r.costoAmortizacion.toLocaleString('es-CL')}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 whitespace-nowrap">
                      +${r.margenNeto.toLocaleString('es-CL')}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-black">
                        {r.margenPct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL INGRESAR NUEVA FACTURA DE COMPRA ── */}
      {modalNuevaFactura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-5 text-xs text-slate-700">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h4 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-[#1E40AF]" />
                <span>Ingresar Factura de Proveedor</span>
              </h4>
              <button
                onClick={() => setModalNuevaFactura(false)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCrearFactura} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">N° Folio Factura *:</label>
                  <input
                    type="text"
                    required
                    value={formFolio}
                    onChange={(e) => setFormFolio(e.target.value)}
                    placeholder="Ej. FAC-12345"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Proveedor *:</label>
                  <select
                    value={formProveedorRut}
                    onChange={(e) => setFormProveedorRut(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                  >
                    {proveedores.map(p => (
                      <option key={p.rut} value={p.rut}>{p.razon_social}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Categoría:</label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                  >
                    <option value="Hardware Alarmas">Hardware Alarmas</option>
                    <option value="CCTV & Cámaras">CCTV & Cámaras</option>
                    <option value="SIMs M2M & Datos">SIMs M2M & Datos</option>
                    <option value="Cercos Eléctricos">Cercos Eléctricos</option>
                    <option value="Infraestructura & Servidores">Infraestructura & Servidores</option>
                    <option value="Servicios Generales">Servicios Generales</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Monto Neto ($ CLP) *:</label>
                  <input
                    type="number"
                    required
                    value={formMontoNeto}
                    onChange={(e) => setFormMontoNeto(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha Emisión:</label>
                  <input
                    type="date"
                    required
                    value={formFechaEmision}
                    onChange={(e) => setFormFechaEmision(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha Vencimiento:</label>
                  <input
                    type="date"
                    value={formFechaVencimiento}
                    onChange={(e) => setFormFechaVencimiento(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Descripción / Notas:</label>
                <textarea
                  rows={2}
                  value={formNotas}
                  onChange={(e) => setFormNotas(e.target.value)}
                  placeholder="Detalle de insumos comprados o servicio prestado..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 resize-none focus:outline-none focus:border-[#1E40AF]"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Total con IVA (19%):</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  ${Math.round(formMontoNeto * 1.19).toLocaleString('es-CL')} CLP
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNuevaFactura(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B2545] hover:bg-[#1E40AF] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Guardar Factura de Compra
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}
