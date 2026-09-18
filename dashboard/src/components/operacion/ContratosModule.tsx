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
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* ── BENTO CARDS DE RESUMEN DE CONTRATOS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-gradient-to-br from-[#0c182b] to-[#112240] border border-emerald-500/30 p-5 rounded-3xl shadow-xl space-y-2">
          <div className="flex justify-between items-center text-emerald-400">
            <span className="text-[11px] font-extrabold uppercase tracking-widest">CONTRATOS FIRMADOS VIGENTES</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {totalFirmados}
          </div>
          <p className="text-[11px] text-slate-400">
            Con firma digital y comodato validado
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#0c182b] to-[#112240] border border-amber-500/30 p-5 rounded-3xl shadow-xl space-y-2">
          <div className="flex justify-between items-center text-amber-400">
            <span className="text-[11px] font-extrabold uppercase tracking-widest">PENDIENTES DE FIRMA</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {totalPendientes}
          </div>
          <p className="text-[11px] text-slate-400">
            Listos para envío y firma electrónica
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#0c182b] to-[#112240] border border-red-500/30 p-5 rounded-3xl shadow-xl space-y-2">
          <div className="flex justify-between items-center text-red-400">
            <span className="text-[11px] font-extrabold uppercase tracking-widest">POR RENOVAR (30 DÍAS)</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black font-mono text-red-400">
            {totalPorRenovar}
          </div>
          <p className="text-[11px] text-slate-400">
            Próximos a vencimiento de plazo anual
          </p>
        </div>

      </div>

      {/* ── PANEL DE GESTIÓN DE CONTRATOS ── */}
      <div className="bg-[#0c182b]/85 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl space-y-5">
        
        {/* Barra de Filtros y Búsqueda */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por N° contrato, cuenta abonado, razón social o RUT..."
              className="w-full bg-[#050d1a] border border-[#1e3a5f] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2997ff]"
            />
          </div>

          <div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full bg-[#050d1a] border border-[#1e3a5f] rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="Todos">Todos los Estados</option>
              <option value="Firmado">🟢 Firmados</option>
              <option value="Pendiente Firma">🟡 Pendientes de Firma</option>
              <option value="Por Renovar">🔴 Por Renovar</option>
            </select>
          </div>
        </div>

        {/* Tabla de Contratos */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 font-black uppercase text-[10px] text-slate-400 tracking-wider bg-white/[0.02]">
                <th className="py-3.5 px-4">N° CONTRATO</th>
                <th className="py-3.5 px-4">CUENTA</th>
                <th className="py-3.5 px-4">CLIENTE / RAZÓN SOCIAL</th>
                <th className="py-3.5 px-4">DIRECCIÓN MONITOREO</th>
                <th className="py-3.5 px-4 text-right">TARIFA</th>
                <th className="py-3.5 px-4 text-center">ESTADO</th>
                <th className="py-3.5 px-4 text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {contratosFiltrados.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.04] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-black text-[#2997ff]">
                    {c.codigo_contrato}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    #{c.cuenta}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{c.razon_social}</div>
                    <div className="text-[10px] text-slate-400 font-mono">RUT: {c.rut}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 text-xs truncate max-w-xs">
                    {c.direccion} ({c.ciudad})
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                    {c.moneda === 'UF' ? `${c.tarifa} UF` : `$${c.tarifa.toLocaleString('es-CL')}`}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      c.estado === 'Firmado'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : c.estado === 'Por Renovar'
                        ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleAbrirModal(c)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0066cc] to-[#2997ff] text-white text-xs font-bold hover:brightness-110 transition-all flex items-center gap-1.5 mx-auto shadow-md"
                    >
                      <FileCheck className="h-3.5 w-3.5" />
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
