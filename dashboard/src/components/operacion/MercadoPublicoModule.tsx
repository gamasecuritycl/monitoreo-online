'use client'

import React, { useState, useEffect } from 'react'
import { 
  Building2, Search, Key, ExternalLink, FileText, 
  RefreshCw, AlertCircle, CheckCircle2, Clock, 
  Sparkles, Check, X
} from 'lucide-react'

export interface LicitacionChileCompra {
  CodigoExterno: string
  Nombre: string
  CodigoEstado: number
  Estado: string
  Organismo: string
  RutComprador?: string
  DireccionUnidad?: string
  FechaCierre: string
  MontoEstimado: number
  Moneda: string
  Rubro: string
  Descripcion: string
  Tipo: string
  Contacto?: string
  EnlaceMercadoPublico: string
  EsDemo?: boolean
}

interface MercadoPublicoModuleProps {
  onCotizarLicitacion: (lic: LicitacionChileCompra) => void
}

export default function MercadoPublicoModule({ onCotizarLicitacion }: MercadoPublicoModuleProps) {
  const [licitaciones, setLicitaciones] = useState<LicitacionChileCompra[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtroRubro, setFiltroRubro] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState<string>('')
  const [ticketApi, setTicketApi] = useState<string>('')
  const [modalTicketAbierto, setModalTicketAbierto] = useState(false)
  const [ticketInput, setTicketInput] = useState('')
  const [modoApi, setModoApi] = useState<string>('catalogo_seguridad_radar')
  const [mensajeApi, setMensajeApi] = useState<string>('')
  const [errorApi, setErrorApi] = useState<string>('')
  const [probandoTicket, setProbandoTicket] = useState(false)
  const [resultadoPrueba, setResultadoPrueba] = useState<{ ok: boolean; msg: string } | null>(null)

  // Cargar ticket guardado en localStorage
  useEffect(() => {
    try {
      const guardado = localStorage.getItem('gama_mercadopublico_ticket') || ''
      if (guardado) {
        setTicketApi(guardado)
        setTicketInput(guardado)
      }
    } catch {}
  }, [])

  const fetchLicitaciones = async () => {
    setCargando(true)
    setErrorApi('')
    setMensajeApi('')
    try {
      const params = new URLSearchParams()
      if (ticketApi) params.append('ticket', ticketApi)
      if (filtroRubro !== 'todos') params.append('rubro', filtroRubro)

      const res = await fetch(`/api/mercado-publico?${params.toString()}`)
      const data = await res.json()
      if (data.licitaciones) {
        setLicitaciones(data.licitaciones)
        setModoApi(data.modo || 'catalogo_seguridad_radar')
        if (data.mensaje) setMensajeApi(data.mensaje)
        if (data.error) setErrorApi(data.error)
      }
    } catch (err: any) {
      console.error('Error cargando licitaciones:', err)
      setErrorApi('Error de conexión al consultar el radar.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    fetchLicitaciones()
  }, [ticketApi, filtroRubro])

  const guardarTicket = () => {
    const val = ticketInput.trim()
    setTicketApi(val)
    try {
      localStorage.setItem('gama_mercadopublico_ticket', val)
    } catch {}
    setModalTicketAbierto(false)
    setResultadoPrueba(null)
  }

  const handleProbarTicket = async () => {
    const t = ticketInput.trim()
    if (!t) {
      setResultadoPrueba({ ok: false, msg: 'Por favor ingresa un ticket antes de probar.' })
      return
    }
    setProbandoTicket(true)
    setResultadoPrueba(null)
    try {
      const res = await fetch(`/api/mercado-publico?accion=test_ticket&ticket=${encodeURIComponent(t)}`)
      const data = await res.json()
      if (data.ticket_valido) {
        setResultadoPrueba({ ok: true, msg: data.mensaje || '¡Ticket válido y activo ante ChileCompra!' })
      } else {
        setResultadoPrueba({ ok: false, msg: data.error || 'ChileCompra rechazó el ticket.' })
      }
    } catch (err: any) {
      setResultadoPrueba({ ok: false, msg: `Error al probar: ${err.message}` })
    } finally {
      setProbandoTicket(false)
    }
  }

  // Filtrado local por búsqueda de texto
  const licitacionesFiltradas = licitaciones.filter(l => {
    if (!busqueda.trim()) return true
    const q = busqueda.toLowerCase()
    return (
      l.Nombre.toLowerCase().includes(q) ||
      l.Organismo.toLowerCase().includes(q) ||
      l.CodigoExterno.toLowerCase().includes(q) ||
      l.Descripcion.toLowerCase().includes(q)
    )
  })

  // KPIs
  const montoTotalEnJuego = licitacionesFiltradas.reduce((acc, l) => acc + (l.MontoEstimado || 0), 0)
  const cantMonitoreoCctv = licitacionesFiltradas.filter(l => l.Rubro.includes('CCTV') || l.Rubro.includes('Monitoreo')).length
  const cantGuardias = licitacionesFiltradas.filter(l => l.Rubro.includes('Guardias')).length

  return (
    <div className="space-y-6">
      {/* Banner Principal & Radar Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ChileCompra · Radar Oficial 24/7
              </span>
              {ticketApi ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ticket Configurado
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Modo Demostrativo
                </span>
              )}

              {modoApi === 'api_real_chilecompra' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> Servidor Oficial Conectado
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <Building2 className="w-7 h-7 text-indigo-400" />
              Mercado Público & Licitaciones Estatales
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Monitoreo activo de licitaciones públicas de seguridad privada, CCTV con analítica, televigilancia y alarmas. Prepara cotizaciones oficiales con 1 solo clic.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setModalTicketAbierto(true)
                setResultadoPrueba(null)
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition shadow-sm cursor-pointer"
            >
              <Key className="w-4 h-4 text-indigo-400" />
              {ticketApi ? 'Gestionar Ticket API' : 'Configurar Ticket API'}
            </button>

            <button
              onClick={fetchLicitaciones}
              disabled={cargando}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
              Actualizar Radar
            </button>
          </div>
        </div>

        {/* Mini KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 block">Licitaciones Listadas</span>
            <span className="text-xl font-black text-white">{licitacionesFiltradas.length}</span>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 block">Monto Estimado en Juego</span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              ${Math.round(montoTotalEnJuego).toLocaleString('es-CL')} CLP
            </span>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 block">CCTV & Monitoreo 24/7</span>
            <span className="text-xl font-black text-cyan-400">{cantMonitoreoCctv}</span>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 block">Guardias & Control</span>
            <span className="text-xl font-black text-indigo-400">{cantGuardias}</span>
          </div>
        </div>
      </div>

      {/* Alerta si ChileCompra rechazó el ticket o dio error */}
      {errorApi && (
        <div className="bg-amber-950/80 border border-amber-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <strong className="font-bold block text-white">Aviso de API ChileCompra:</strong>
              <span>{errorApi}</span>
            </div>
          </div>
          <button
            onClick={() => {
              setModalTicketAbierto(true)
              setResultadoPrueba(null)
            }}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shrink-0 cursor-pointer transition shadow"
          >
            Verificar Ticket
          </button>
        </div>
      )}

      {/* Mensaje de estado informativo de la API */}
      {mensajeApi && !errorApi && (
        <div className="bg-indigo-950/60 border border-indigo-500/30 rounded-2xl p-3 px-4 flex items-center gap-2.5 text-xs text-indigo-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{mensajeApi}</span>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Rubro Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'todos', label: 'Todas las Licitaciones' },
            { id: 'cctv', label: 'CCTV & Cámaras' },
            { id: 'monitoreo', label: 'Monitoreo & Alarmas' },
            { id: 'guardias', label: 'Guardias OS-10' },
            { id: 'acceso', label: 'Control de Acceso' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFiltroRubro(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filtroRubro === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por organismo, código..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Listado de Licitaciones */}
      {cargando ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-300">Consultando API de Mercado Público...</p>
          <p className="text-xs text-slate-500 mt-1">Conectando con base de datos de ChileCompra</p>
        </div>
      ) : licitacionesFiltradas.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-300">No se encontraron licitaciones con ese criterio</p>
          <p className="text-xs text-slate-500 mt-1">Intenta seleccionar &quot;Todas las Licitaciones&quot; o cambiar la búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {licitacionesFiltradas.map((lic) => {
            const rubroColor = 
              lic.Rubro.includes('CCTV') ? 'text-cyan-400 bg-cyan-950/60 border-cyan-800' :
              lic.Rubro.includes('Guardias') ? 'text-indigo-400 bg-indigo-950/60 border-indigo-800' :
              lic.Rubro.includes('Acceso') ? 'text-amber-400 bg-amber-950/60 border-amber-800' :
              'text-emerald-400 bg-emerald-950/60 border-emerald-800'

            const fechaCierreFormateada = lic.FechaCierre 
              ? new Date(lic.FechaCierre).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
              : 'Consultar portal'

            return (
              <div 
                key={lic.CodigoExterno}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg hover:shadow-indigo-500/5 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Encabezado de la Tarjeta */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${rubroColor}`}>
                          {lic.Rubro}
                        </span>
                        {lic.EsDemo ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            Ejemplo Demostrativo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            ChileCompra Oficial Real
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-white text-sm line-clamp-2 group-hover:text-indigo-300 transition">
                        {lic.Nombre}
                      </h3>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-800 shrink-0">
                      {lic.CodigoExterno}
                    </span>
                  </div>

                  {/* Organismo Comprador */}
                  <div className="flex items-center gap-2 text-xs text-slate-300 mb-3 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/60">
                    <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="font-semibold truncate">{lic.Organismo}</span>
                  </div>

                  {/* Descripción */}
                  <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                    {lic.Descripcion}
                  </p>
                </div>

                {/* Métricas y Acciones */}
                <div className="pt-3 border-t border-slate-800/80">
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Monto Estimado</span>
                      <span className="font-bold font-mono text-emerald-400">
                        ${Math.round(lic.MontoEstimado).toLocaleString('es-CL')} {lic.Moneda}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Cierre Ofertas</span>
                      <span className="font-bold text-slate-300 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {fechaCierreFormateada}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={lic.EnlaceMercadoPublico}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700/80"
                    >
                      <span>Ver Ficha</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => onCotizarLicitacion(lic)}
                      className="flex-2 flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Cotizar con 1 Clic</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Configuración y Prueba de Ticket ChileCompra */}
      {modalTicketAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <Key className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Ticket de API ChileCompra</h3>
                <p className="text-xs text-slate-400">Acceso oficial gratuito a Mercado Público</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <label className="text-xs font-bold text-slate-300 block">Ingresa o verifica tu Ticket:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ticketInput}
                  onChange={(e) => {
                    setTicketInput(e.target.value)
                    setResultadoPrueba(null)
                  }}
                  placeholder="Ej: F8E490D0-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleProbarTicket}
                  disabled={probandoTicket}
                  className="px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {probandoTicket ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span>Probar Conexión</span>
                </button>
              </div>
            </div>

            {/* Resultado de prueba del ticket */}
            {resultadoPrueba && (
              <div className={`p-3 rounded-xl mb-4 text-xs font-medium border flex items-start gap-2.5 ${
                resultadoPrueba.ok 
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200' 
                  : 'bg-red-950/60 border-red-500/50 text-red-200'
              }`}>
                {resultadoPrueba.ok ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <span>{resultadoPrueba.msg}</span>
              </div>
            )}

            {/* Pasos para conseguir el ticket gratis */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 mb-5 text-xs text-slate-300 space-y-2">
              <span className="font-bold text-indigo-400 block">¿Cómo obtener o revisar tu ticket gratuito?</span>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                <li>Ingresa a <a href="https://api.mercadopublico.cl" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold">api.mercadopublico.cl</a>.</li>
                <li>Haz clic en <strong>&quot;Participa&quot;</strong> e inicia sesión con tu <strong>ClaveÚnica</strong>.</li>
                <li>En <em>Motivo</em>, escribe <strong>&quot;Solicitud de Ticket&quot;</strong>.</li>
                <li>ChileCompra te enviará el ticket por correo. Cópialo completo y pégalo arriba.</li>
              </ol>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setModalTicketAbierto(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={guardarTicket}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-md cursor-pointer"
              >
                Guardar Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
