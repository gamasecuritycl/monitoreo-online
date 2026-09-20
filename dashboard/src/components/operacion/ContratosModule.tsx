'use client'

import React, { useState, useMemo } from 'react'
import {
  FileCheck,
  Search,
  Filter,
  Download,
  Smartphone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Plus
} from 'lucide-react'
import ContratoDigitalModal from './ContratoDigitalModal'
import clientesDataRaw from '@/lib/clientes_general.json'

export interface ContratoItem {
  id: string
  codigo_contrato: string
  cuenta: string
  razon_social: string
  rut: string
  direccion: string
  ciudad: string
  plan: string
  tarifa: number
  moneda: 'CLP' | 'UF'
  estado: 'Firmado' | 'Pendiente Firma' | 'Por Renovar' | 'Borrador'
  fecha_inicio: string
  plazo_meses: number
  telefono: string
  email: string
}

function getDatosGeneralMdb(cta: string) {
  const g = (clientesDataRaw as Record<string, any>) || {}
  if (!cta) return null
  const clean = cta.toString().trim().toUpperCase()
  const match = g[clean] 
    || g[clean.padStart(4, '0')] 
    || g[clean.replace(/^0+/, '')] 
    || g[clean.replace(/^C0*/, 'C')]
    || g['C' + clean.replace(/^0+/, '')]
    || g[clean.replace(/^C/, '')]
    || g[clean.replace(/^C/, '').padStart(4, '0')]
  return match || null
}

export default function ContratosModule({
  clientesMaestros,
  abonadosCentrosCosto,
  empresasConglomerado
}: {
  clientesMaestros: Record<string, any>
  abonadosCentrosCosto: Record<string, any>
  empresasConglomerado: any[]
}) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos')
  const [contratoSeleccionado, setContratoSeleccionado] = useState<any | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  // Generar lista de contratos a partir de abonados y maestros, vinculando direcciones reales de GENERAL.MDB
  const listaContratos: ContratoItem[] = useMemo(() => {
    return Object.entries(abonadosCentrosCosto || {}).map(([cta, cc]: [string, any], idx) => {
      const cli = clientesMaestros[cc.rut_cliente] || {}
      const ctaUpper = cta.toUpperCase()
      const codigo = `CTR-2026-${ctaUpper}`

      // Obtener datos reales de GENERAL.MDB
      const general = getDatosGeneralMdb(ctaUpper)
      const dirMdb = (general?.direccion || general?.DIRECCION || '').trim()
      const ciudadMdb = (general?.ciudad || general?.CIUDAD || '').trim()
      const nomMdb = (general?.nombre || general?.NOMBRE || '').trim()
      const telMdb = (general?.telefono1 || general?.t1 || general?.telefono || '').trim()

      // Buscar si en la ficha viene algún RUT registrado en observaciones
      let rutGeneral = ''
      if (general) {
        const obsTexto = `${general.observacion1 || ''} ${general.referencia1 || ''} ${general.comentario || ''}`
        const rutMatch = obsTexto.match(/RUT(?:\s+CLIENTA|\s+CLIENTE)?[:\s]+([\d\.\-kK]+)/i)
        if (rutMatch && rutMatch[1]) {
          rutGeneral = rutMatch[1].trim()
        }
      }

      // Mock status para demostración
      let estado: ContratoItem['estado'] = 'Pendiente Firma'
      if (idx % 3 === 0) estado = 'Firmado'
      else if (idx % 5 === 0) estado = 'Por Renovar'

      const direccionFinal = dirMdb || cc.direccion || cli.direccion_comercial || 'Dirección sin registrar'
      const ciudadFinal = ciudadMdb || cc.ciudad || cli.ciudad || 'Viña del Mar'
      const razonSocialFinal = nomMdb || cc.alias_centro_costo || cli.razon_social || `Abonado ${ctaUpper}`
      const rutFinal = rutGeneral || cc.rut_cliente || cli.rut || 'S/RUT'

      return {
        id: `CTR-${ctaUpper}`,
        codigo_contrato: codigo,
        cuenta: ctaUpper,
        razon_social: razonSocialFinal,
        rut: rutFinal,
        direccion: direccionFinal,
        ciudad: ciudadFinal,
        plan: cli.plan_monitoreo || 'Monitoreo Central 24/7 con Verificación IA',
        tarifa: cli.tarifa_mensual || 29900,
        moneda: cli.moneda || 'CLP',
        estado,
        fecha_inicio: '2026-01-01',
        plazo_meses: 12,
        telefono: telMdb || cli.telefono || '+56 9 9101 6912',
        email: cli.email_cobranza || cli.email_contacto || 'contacto@cliente.cl'
      }
    })
  }, [abonadosCentrosCosto, clientesMaestros])

  const contratosFiltrados = useMemo(() => {
    return listaContratos.filter(c => {
      const matchEstado = filtroEstado === 'Todos' || c.estado === filtroEstado
      const matchBusqueda = !busqueda.trim() ||
        c.codigo_contrato.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.cuenta.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.razon_social.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.rut.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.direccion.toLowerCase().includes(busqueda.toLowerCase())
      return matchEstado && matchBusqueda
    })
  }, [listaContratos, filtroEstado, busqueda])

  const totalFirmados = listaContratos.filter(c => c.estado === 'Firmado').length
  const totalPendientes = listaContratos.filter(c => c.estado === 'Pendiente Firma').length
  const totalPorRenovar = listaContratos.filter(c => c.estado === 'Por Renovar').length

  const handleAbrirModal = (contrato: ContratoItem) => {
    const general = getDatosGeneralMdb(contrato.cuenta)
    const dirMdb = (general?.direccion || general?.DIRECCION || '').trim()
    const ciudadMdb = (general?.ciudad || general?.CIUDAD || '').trim()
    const nomMdb = (general?.nombre || general?.NOMBRE || '').trim()
    const telMdb = (general?.telefono1 || general?.t1 || general?.telefono || '').trim()

    const cli = clientesMaestros[contrato.rut] || {
      razon_social: nomMdb || contrato.razon_social,
      rut: contrato.rut,
      direccion_comercial: dirMdb || contrato.direccion,
      ciudad: ciudadMdb || contrato.ciudad,
      telefono: telMdb || contrato.telefono,
      email_cobranza: contrato.email,
      tarifa_mensual: contrato.tarifa,
      moneda: contrato.moneda,
      plan_monitoreo: contrato.plan
    }
    const abon = {
      cuenta: contrato.cuenta,
      alias_centro_costo: nomMdb || contrato.razon_social,
      direccion: dirMdb || contrato.direccion,
      ciudad: ciudadMdb || contrato.ciudad
    }

    setContratoSeleccionado({ cliente: cli, abonado: abon })
    setModalAbierto(true)
  }

  return (
    <div className="space-y-7 text-slate-800 font-sans">
      
      {/* ── BENTO CARDS DE RESUMEN DE CONTRATOS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        
        <div className="bg-emerald-50/70 border border-emerald-200/90 p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="space-y-3 px-1 py-0.5">
            <div className="flex justify-between items-center gap-2 text-emerald-900">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider leading-tight">
                CONTRATOS FIRMADOS VIGENTES
              </span>
              <div className="w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-2xs shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-sans text-slate-900">
              {totalFirmados}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
              Con firma digital y comodato validado
            </p>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/90 p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="space-y-3 px-1 py-0.5">
            <div className="flex justify-between items-center gap-2 text-amber-900">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider leading-tight">
                PENDIENTES DE FIRMA
              </span>
              <div className="w-8 h-8 rounded-full bg-white text-amber-600 flex items-center justify-center shadow-2xs shrink-0">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-sans text-slate-900">
              {totalPendientes}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
              Listos para envío y firma electrónica
            </p>
          </div>
        </div>

        <div className="bg-red-50/70 border border-red-200/90 p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="space-y-3 px-1 py-0.5">
            <div className="flex justify-between items-center gap-2 text-red-900">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider leading-tight">
                POR RENOVAR (30 DÍAS)
              </span>
              <div className="w-8 h-8 rounded-full bg-white text-red-600 flex items-center justify-center shadow-2xs shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-sans text-slate-900">
              {totalPorRenovar}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
              Próximos a vencimiento de plazo anual
            </p>
          </div>
        </div>

      </div>

      {/* ── PANEL DE GESTIÓN DE CONTRATOS ── */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-300/80 shadow-sm space-y-6">
        
        {/* Barra de Filtros y Búsqueda */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative sm:col-span-2 flex items-center">
            <Search className="absolute left-4 h-4.5 w-4.5 text-[#1E40AF] pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por N° contrato, cuenta abonado, razón social o RUT..."
              className="w-full bg-slate-50/80 border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E40AF] focus:bg-white font-sans transition-all"
            />
          </div>

          <div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full bg-slate-50/80 border border-slate-300 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#1E40AF] focus:bg-white font-sans font-semibold cursor-pointer transition-all"
            >
              <option value="Todos">Todos los Estados</option>
              <option value="Firmado">🟢 Firmados</option>
              <option value="Pendiente Firma">🟡 Pendientes de Firma</option>
              <option value="Por Renovar">🔴 Por Renovar</option>
            </select>
          </div>
        </div>

        {/* Tabla de Contratos */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/60 p-2 sm:p-3">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 font-black uppercase text-[10px] sm:text-[11px] text-slate-500 tracking-wider">
                <th className="py-3 px-4">N° CONTRATO</th>
                <th className="py-3 px-4">CUENTA</th>
                <th className="py-3 px-4">CLIENTE / RAZÓN SOCIAL</th>
                <th className="py-3 px-4">DIRECCIÓN MONITOREO</th>
                <th className="py-3 px-4 text-right">TARIFA</th>
                <th className="py-3 px-4 text-center">ESTADO</th>
                <th className="py-3 px-4 text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 font-medium">
              {contratosFiltrados.map((c) => (
                <tr key={c.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-black text-[#1E40AF] whitespace-nowrap">
                    {c.codigo_contrato}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                    #{c.cuenta}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{c.razon_social}</div>
                    <div className="text-[11px] text-slate-500 font-mono">RUT: {c.rut}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 text-xs truncate max-w-xs">
                    {c.direccion} ({c.ciudad})
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {c.moneda === 'UF' ? `${c.tarifa} UF` : `$${c.tarifa.toLocaleString('es-CL')}`}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex items-center justify-center px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide whitespace-nowrap shadow-2xs ${
                      c.estado === 'Firmado'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90'
                        : c.estado === 'Por Renovar'
                        ? 'bg-red-50 text-red-800 border border-red-200/90'
                        : 'bg-amber-50 text-amber-900 border border-amber-200/90'
                    }`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleAbrirModal(c)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0B2545] hover:bg-[#1E40AF] text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                    >
                      <FileCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>{c.estado === 'Firmado' ? 'Ver Contrato' : 'Firmar / Emitir'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Digital Signature */}
      {modalAbierto && contratoSeleccionado && (
        <ContratoDigitalModal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          cliente={contratoSeleccionado.cliente}
          abonado={contratoSeleccionado.abonado}
          empresaEmisora={empresasConglomerado?.[0]}
        />
      )}

    </div>
  )
}
