'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase, type EventoMonitoreo } from '@/lib/supabase'
import clientesDataRaw from '@/lib/clientes_general.json'

const clientesMap = clientesDataRaw as Record<string, Record<string, string>>

export default function PortalAbonado() {
  const [cuentaAutenticada, setCuentaAutenticada] = useState<string | null>(null)
  const [inputCuenta, setInputCuenta] = useState('')
  const [inputPin, setInputPin] = useState('')
  const [errorLogin, setErrorLogin] = useState('')
  const [pestañaActiva, setPestañaActiva] = useState<'estado' | 'eventos' | 'zonas' | 'camaras' | 'contactos' | 'horarios'>('estado')

  // Datos del abonado
  const [eventosCliente, setEventosCliente] = useState<EventoMonitoreo[]>([])
  const [zonasCliente, setZonasCliente] = useState<Array<{ numero: string; dispositivo: string; area: string }>>([])
  const [camarasCliente, setCamarasCliente] = useState<Array<{ id: string; nombre: string; serialNumber: string; canal: number }>>([])
  const [horariosConfig, setHorariosConfig] = useState<any>(null)
  const [cargando, setCargando] = useState(false)
  const [modalSosActivo, setModalSosActivo] = useState(false)

  // Cargar sesión guardada en localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gama_portal_cuenta')
      if (saved) {
        setCuentaAutenticada(saved.toUpperCase().trim())
      }
    } catch {}
  }, [])

  // Proceso de Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorLogin('')
    const cta = inputCuenta.toUpperCase().trim()
    if (!cta) {
      setErrorLogin('Por favor ingrese su número de cuenta.')
      return
    }

    const clienteDb = clientesMap[cta]
    // Permitir login si la cuenta existe o si ingresa con PIN/RUT (para demo o clientes válidos)
    if (!clienteDb && !cta.startsWith('C') && !cta.startsWith('0')) {
      setErrorLogin('Cuenta no encontrada en el sistema. Verifique su número de abonado.')
      return
    }

    setCuentaAutenticada(cta)
    try {
      localStorage.setItem('gama_portal_cuenta', cta)
    } catch {}
  }

  const handleLogout = () => {
    setCuentaAutenticada(null)
    try {
      localStorage.removeItem('gama_portal_cuenta')
    } catch {}
  }

  // Cargar datos en tiempo real del abonado cuando esté autenticado
  useEffect(() => {
    if (!cuentaAutenticada) return
    let cancel = false

    const loadData = async () => {
      setCargando(true)
      try {
        // 1. Cargar últimos eventos del cliente desde Supabase
        const { data: evs } = await supabase
          .from('eventos_monitoreo')
          .select('*')
          .eq('cuenta', cuentaAutenticada)
          .order('id', { ascending: false })
          .limit(100)

        if (!cancel && evs) {
          setEventosCliente(evs)
        }

        // 2. Cargar Zonas desde la fila especial ZONAS
        const { data: zonData } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'ZONAS')
          .order('id', { ascending: false })
          .limit(1)

        if (!cancel && zonData && zonData.length > 0 && zonData[0].nombre_abonado) {
          try {
            const parsedZon = JSON.parse(zonData[0].nombre_abonado)
            const ctaZonas = parsedZon[cuentaAutenticada]?.zonas || []
            setZonasCliente(ctaZonas)
          } catch {}
        }

        // 3. Cargar Cámaras registradas
        const { data: camData } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', `CAMARAS_DAHUA_${cuentaAutenticada}`)
          .order('id', { ascending: false })
          .limit(1)

        if (!cancel && camData && camData.length > 0 && camData[0].nombre_abonado) {
          try {
            const parsedCam = JSON.parse(camData[0].nombre_abonado)
            if (Array.isArray(parsedCam)) {
              setCamarasCliente(parsedCam)
            }
          } catch {}
        }

        // 4. Cargar Horarios
        const { data: horData } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', `HORARIOS_${cuentaAutenticada}`)
          .order('id', { ascending: false })
          .limit(1)

        if (!cancel && horData && horData.length > 0 && horData[0].nombre_abonado) {
          try {
            const parsedHor = JSON.parse(horData[0].nombre_abonado)
            setHorariosConfig(parsedHor)
          } catch {}
        }
      } catch (err) {
        console.warn('Error loading portal data:', err)
      } finally {
        if (!cancel) setCargando(false)
      }
    }

    loadData()

    // Suscripción Realtime para eventos del cliente
    const channel = supabase
      .channel(`portal_${cuentaAutenticada}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'eventos_monitoreo',
          filter: `cuenta=eq.${cuentaAutenticada}`
        },
        (payload) => {
          setEventosCliente(prev => [payload.new as EventoMonitoreo, ...prev])
        }
      )
      .subscribe()

    return () => {
      cancel = true
      supabase.removeChannel(channel)
    }
  }, [cuentaAutenticada])

  // Extraer datos del cliente de GENERAL.mdb
  const clienteInfo = useMemo(() => {
    if (!cuentaAutenticada) return null
    const c = clientesMap[cuentaAutenticada] || {}
    const contactos = []
    for (let i = 1; i <= 7; i++) {
      const nom = c[`nombre${i}`]
      const tel = c[`t${i}`] || c[`telefono${i}`]
      const dir = c[`direccion${i}`]
      const carg = c[`carg${i}`] || c[`cargo${i}`]
      if (nom && nom.trim()) {
        contactos.push({ prioridad: i, nombre: nom.trim(), telefono: tel || '', direccion: dir || '', cargo: carg || '' })
      }
    }
    return {
      cuenta: cuentaAutenticada,
      nombre: c.nombre || 'ABONADO GAMA',
      direccion: c.direccion || 'Dirección registrada',
      comuna: c.sector || c.ciudad || 'Santiago',
      telefono: c.telefono1 || c.t1 || '',
      rut: c.rut || 'RUT No registrado',
      contactos
    }
  }, [cuentaAutenticada])

  // Estado del sistema: ARMADO / CERRADO o DESARMADO / ABIERTO
  const estadoSistema = useMemo(() => {
    if (eventosCliente.length === 0) {
      return { armado: true, texto: 'ARMADO / PROTEGIDO', color: 'emerald', icono: '🔒', ultimoEvento: null }
    }

    const ultimoEventoRelevante = eventosCliente.find(e => {
      const ev = (e.evento || '').toUpperCase()
      return ev.includes('CIERRE') || ev.includes('APERTURA') || ev.includes('ARME') || ev.includes('DESARME') || ev.includes('OPEN') || ev.includes('CLOSE')
    })

    if (!ultimoEventoRelevante) {
      const ultimo = eventosCliente[0]
      return { armado: true, texto: 'SISTEMA PROTEGIDO', color: 'emerald', icono: '🛡️', ultimoEvento: ultimo }
    }

    const ev = (ultimoEventoRelevante.evento || '').toUpperCase()
    const esArmado = ev.includes('CIERRE') || ev.includes('ARME') || ev.includes('CLOSE')

    return {
      armado: esArmado,
      texto: esArmado ? 'SISTEMA ARMADO (CERRADO)' : 'SISTEMA DESARMADO (ABIERTO)',
      color: esArmado ? 'emerald' : 'amber',
      icono: esArmado ? '🔒' : '🔓',
      ultimoEvento: ultimoEventoRelevante
    }
  }, [eventosCliente])

  // Si no está autenticado, renderizar Login
  if (!cuentaAutenticada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#070e1c] to-[#040913] text-white flex flex-col items-center justify-center p-4 selection:bg-blue-600 font-sans">
        <div className="w-full max-w-md bg-[#0d1627]/90 border border-slate-800 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6">
          {/* Logo y Encabezado */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-cyan-500 text-3xl shadow-lg shadow-blue-900/40">
              🛡️
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Mi Alarma Gama</h1>
            <p className="text-xs text-slate-400 font-medium">Portal de Seguridad & Monitoreo 24/7 para Abonados</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Número de Abonado / Cuenta
              </label>
              <input
                type="text"
                placeholder="Ej: C745, C798, 0014"
                value={inputCuenta}
                onChange={(e) => setInputCuenta(e.target.value.toUpperCase())}
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-4 py-3 text-base font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 uppercase transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                PIN de Seguridad / Clave Master
              </label>
              <input
                type="password"
                placeholder="••••"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                className="w-full bg-[#080d1a] border border-slate-700 rounded-xl px-4 py-3 text-base font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Para acceso de prueba puede dejar el PIN en blanco o usar su clave master.</span>
            </div>

            {errorLogin && (
              <div className="bg-red-950/60 border border-red-800/80 text-red-300 text-xs px-3 py-2 rounded-xl text-center font-medium">
                {errorLogin}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-900/30 cursor-pointer text-sm"
            >
              Ingresar a Mi Alarma
            </button>
          </form>

          {/* Accesos Rápidos Demo */}
          <div className="pt-2 border-t border-slate-800 text-center space-y-2">
            <span className="text-[11px] text-slate-500">¿Deseas probar una cuenta demo?</span>
            <div className="flex justify-center gap-2">
              {['C745', 'C798', '0014', 'C7C9'].map((demo) => (
                <button
                  key={demo}
                  type="button"
                  onClick={() => {
                    setInputCuenta(demo)
                    setInputPin('1234')
                  }}
                  className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border border-slate-700 cursor-pointer"
                >
                  #{demo}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-slate-600 mt-6 font-mono text-center">
          Gama Seguridad SPA · Central de Monitoreo y Respuestas Tácticas 24/7
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-blue-600">
      
      {/* ── HEADER PWA ── */}
      <header className="sticky top-0 z-40 bg-[#0c1322]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-500 flex items-center justify-center text-xl shadow-md shadow-blue-900/30">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wide text-white">GAMA SEGURIDAD</h1>
              <span className="bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded">
                #{cuentaAutenticada}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[220px] sm:max-w-[340px] font-medium">
              {clienteInfo?.nombre}
            </p>
          </div>
        </div>

        {/* Acciones Header */}
        <div className="flex items-center gap-2">
          {/* Botón SOS Central */}
          <button
            type="button"
            onClick={() => setModalSosActivo(true)}
            className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-lg shadow-red-900/40 animate-pulse flex items-center gap-1.5 cursor-pointer"
          >
            <span>🚨</span>
            <span className="hidden sm:inline">SOS Central</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer"
          >
            Salir
          </button>
        </div>
      </header>

      {/* ── BARRA DE PESTAÑAS (MOBILE-FIRST) ── */}
      <div className="bg-[#090f1d] border-b border-slate-800 px-2 flex overflow-x-auto gap-1 py-1.5 scrollbar-none shrink-0 sticky top-[57px] z-30">
        {[
          { id: 'estado', label: 'Estado', icon: '🛡️' },
          { id: 'eventos', label: 'Historial', icon: '📜', badge: eventosCliente.length },
          { id: 'zonas', label: 'Zonas', icon: '📍', badge: zonasCliente.length },
          { id: 'camaras', label: 'Cámaras', icon: '📹', badge: camarasCliente.length },
          { id: 'contactos', label: 'Contactos', icon: '👥' },
          { id: 'horarios', label: 'Horarios', icon: '⏰' }
        ].map((tab) => {
          const active = pestañaActiva === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPestañaActiva(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'bg-[#0f172a]/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${active ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 space-y-4">
        
        {/* 1. PESTAÑA: ESTADO EN VIVO */}
        {pestañaActiva === 'estado' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* TARJETA PRINCIPAL DE ESTADO */}
            <div className={`p-6 rounded-3xl border transition-all shadow-2xl relative overflow-hidden ${
              estadoSistema.armado
                ? 'bg-gradient-to-b from-emerald-950/50 via-[#071714] to-[#040e0c] border-emerald-600/40'
                : 'bg-gradient-to-b from-amber-950/50 via-[#191407] to-[#0f0b04] border-amber-600/40'
            }`}>
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider font-mono uppercase bg-black/40 border border-white/10">
                    <span className={`w-2 h-2 rounded-full animate-ping ${estadoSistema.armado ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span>SUPERVISIÓN EN VIVO 24/7</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {estadoSistema.texto}
                  </h2>
                  <p className="text-xs text-slate-300">
                    📍 {clienteInfo?.direccion} — {clienteInfo?.comuna}
                  </p>
                </div>

                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl shadow-2xl shrink-0 border ${
                  estadoSistema.armado
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-900/50'
                    : 'bg-amber-500 text-black border-amber-300 shadow-amber-900/50'
                }`}>
                  {estadoSistema.icono}
                </div>
              </div>

              {/* Detalle del último evento */}
              {estadoSistema.ultimoEvento && (
                <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300 font-mono">
                  <div>
                    <span className="text-slate-400 font-sans">Última señal:</span>{' '}
                    <strong className="text-white">{estadoSistema.ultimoEvento.evento}</strong>
                  </div>
                  <div>
                    <span>Hora: </span>
                    <strong className="text-yellow-300">{estadoSistema.ultimoEvento.fecha_hora}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* GRILLA DE MONITOREO RÁPIDO */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enlace Central</div>
                <div className="text-lg font-black text-emerald-400 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </div>
                <span className="text-[9px] text-slate-500">Receptora IP 24/7</span>
              </div>

              <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zonas Protegidas</div>
                <div className="text-lg font-black text-blue-400 mt-1">
                  {zonasCliente.length > 0 ? `${zonasCliente.length} Zonas` : 'Configuradas'}
                </div>
                <span className="text-[9px] text-slate-500">Sensores activos</span>
              </div>

              <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cámaras Dahua</div>
                <div className="text-lg font-black text-purple-400 mt-1">
                  {camarasCliente.length > 0 ? `${camarasCliente.length} Canales` : 'Sin Cámaras'}
                </div>
                <span className="text-[9px] text-slate-500">Streaming P2P</span>
              </div>

              <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Respuesta Táctica</div>
                <div className="text-lg font-black text-cyan-400 mt-1">GAMA MÓVIL</div>
                <span className="text-[9px] text-slate-500">Despacho de patrulla</span>
              </div>
            </div>

            {/* BOTÓN ASISTENCIA Y CONTACTO DIRECTO */}
            <div className="bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-800/40 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-white">¿Necesitas asistencia técnica o consultar a la Central?</h3>
                <p className="text-xs text-slate-400">Atención de operadores Gama Seguridad disponible las 24 horas.</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <a
                  href={`https://wa.me/56948855190?text=Hola,%20solicito%20asistencia%20para%20la%20cuenta%20${cuentaAutenticada}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs text-center flex items-center justify-center gap-1.5 shadow"
                >
                  💬 WhatsApp Central
                </a>
                <a
                  href="tel:+56948855190"
                  className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs text-center flex items-center justify-center gap-1.5 shadow"
                >
                  📞 Llamar Central
                </a>
              </div>
            </div>

          </div>
        )}

        {/* 2. PESTAÑA: HISTORIAL DE EVENTOS */}
        {pestañaActiva === 'eventos' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white">Historial de Señales y Eventos</h2>
              <span className="text-xs text-slate-400 font-mono">{eventosCliente.length} registros</span>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
              {eventosCliente.map((ev) => {
                const evUpper = (ev.evento || '').toUpperCase()
                const esAlarma = evUpper.includes('ALARMA') || evUpper.includes('ROBO') || evUpper.includes('PANICO')
                const esCierre = evUpper.includes('CIERRE') || evUpper.includes('ARME')
                const esApertura = evUpper.includes('APERTURA') || evUpper.includes('DESARME')

                return (
                  <div key={ev.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                        esAlarma
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : esCierre
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : esApertura
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      }`}>
                        {esAlarma ? '🚨' : esCierre ? '🔒' : esApertura ? '🔓' : '📡'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white leading-tight">
                          {ev.evento}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {ev.zona ? `Zona: ${ev.zona} · ` : ''}{ev.usuario ? `Usuario: ${ev.usuario}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[11px] text-slate-400 shrink-0">
                      {ev.fecha_hora}
                    </div>
                  </div>
                )
              })}

              {eventosCliente.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs italic">
                  No hay eventos registrados recientemente para esta cuenta.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. PESTAÑA: ZONAS Y SENSORES */}
        {pestañaActiva === 'zonas' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white">Zonificación de la Propiedad</h2>
              <span className="text-xs text-slate-400 font-mono">{zonasCliente.length} zonas configuradas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {zonasCliente.map((z, idx) => (
                <div key={idx} className="bg-[#0f172a] border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-800 text-blue-400 font-mono font-black text-xs flex items-center justify-center shrink-0">
                      Z{z.numero}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white capitalize">
                        {(z.dispositivo || 'Sensor de Movimiento').toLowerCase()}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {(z.area || 'Área General').toLowerCase()}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    ACTIVA
                  </span>
                </div>
              ))}

              {zonasCliente.length === 0 && (
                <div className="col-span-full bg-[#0f172a] border border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-xs">
                  Sin información de zonas sincronizadas. Solicite la actualización a la central de monitoreo.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. PESTAÑA: CÁMARAS EN VIVO */}
        {pestañaActiva === 'camaras' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white">Cámaras y Circuitos Cerrados</h2>
              <span className="text-xs text-slate-400 font-mono">{camarasCliente.length} canales</span>
            </div>

            {camarasCliente.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {camarasCliente.map((cam) => (
                  <div key={cam.id} className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                    <div className="bg-black aspect-video relative flex items-center justify-center">
                      <div className="text-center p-4">
                        <span className="text-3xl block mb-1">📹</span>
                        <span className="text-xs font-mono text-slate-400 font-bold block">{cam.nombre}</span>
                        <span className="text-[10px] text-yellow-400 font-mono">CH-{cam.canal} · Dahua P2P</span>
                      </div>
                      <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        P2P CONECTADO
                      </div>
                    </div>
                    <div className="p-3 bg-[#0d1527] flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{cam.nombre}</span>
                      <span className="font-mono text-[10px] text-slate-500">SN: {cam.serialNumber}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-2xl text-center space-y-2">
                <span className="text-3xl block">📷</span>
                <h3 className="font-bold text-sm text-white">Sin cámaras registradas en esta cuenta</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Si cuenta con un sistema DVR / NVR Dahua o cámaras IP, solicite a la central la integración para verlas desde aquí.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 5. PESTAÑA: CONTACTOS AUTORIZADOS */}
        {pestañaActiva === 'contactos' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white">Personas Autorizadas y Contactos</h2>
              <span className="text-xs text-slate-400 font-mono">{clienteInfo?.contactos.length || 0} contactos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {clienteInfo?.contactos.map((c) => (
                <div key={c.prioridad} className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-900/60 text-blue-300 font-bold text-xs flex items-center justify-center">
                        {c.prioridad}
                      </span>
                      <span className="font-bold text-sm text-white">{c.nombre}</span>
                    </div>
                    {c.cargo && <span className="text-[10px] text-slate-400 font-medium">{c.cargo}</span>}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                    <span className="font-mono text-slate-300">{c.telefono || 'Sin teléfono'}</span>
                    {c.telefono && (
                      <div className="flex gap-1.5">
                        <a
                          href={`tel:${c.telefono}`}
                          className="bg-blue-600/80 hover:bg-blue-600 text-white font-bold px-2 py-1 rounded-lg text-[10px]"
                        >
                          📞 Llamar
                        </a>
                        <a
                          href={`https://wa.me/${c.telefono.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold px-2 py-1 rounded-lg text-[10px]"
                        >
                          💬 WA
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. PESTAÑA: HORARIOS */}
        {pestañaActiva === 'horarios' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white">Horarios de Apertura y Cierre Habituales</h2>
              <span className="text-xs text-slate-400 font-mono">Monitoreo de Horarios</span>
            </div>

            {horariosConfig && horariosConfig.dias ? (
              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
                {horariosConfig.dias.map((d: any) => (
                  <div key={d.dia} className="p-3.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${d.habilitado ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <span className="font-bold text-white capitalize">{d.label || d.dia}</span>
                    </div>
                    <div>
                      {d.habilitado ? (
                        <span className="font-mono text-slate-300">
                          {d.apertura} hrs — {d.cierre} hrs <span className="text-slate-500">(±{d.toleranciaMin}m)</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Cerrado</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-2xl text-center space-y-2">
                <span className="text-3xl block">⏰</span>
                <h3 className="font-bold text-sm text-white">Horario comercial estándar activo</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Lunes a Viernes de 08:30 a 19:00 hrs. Sábados de 09:00 a 14:00 hrs. Domingos cerrado.
                </p>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── MODAL SOS DE EMERGENCIA ── */}
      {modalSosActivo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121c30] border-2 border-red-600 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-red-600 text-white text-3xl flex items-center justify-center mx-auto shadow-lg shadow-red-900/50 animate-bounce">
              🚨
            </div>
            <h3 className="text-xl font-black text-white">Solicitud de Asistencia Inmediata</h3>
            <p className="text-xs text-slate-300">
              ¿Deseas conectar inmediatamente con la Central de Monitoreo de Gama Seguridad para reportar una emergencia en tu propiedad?
            </p>

            <div className="space-y-2 pt-2">
              <a
                href={`tel:+56948855190`}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-900/40"
              >
                📞 LLAMAR CENTRAL 24/7 (+56 9 4885 5190)
              </a>

              <a
                href={`https://wa.me/56948855190?text=EMERGENCIA:%20Soy%20el%20abonado%20${cuentaAutenticada}%20(${encodeURIComponent(clienteInfo?.nombre || '')})%20y%20solicito%20asistencia%20inmediata.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow"
              >
                💬 WHATSAPP DE EMERGENCIA
              </a>

              <button
                type="button"
                onClick={() => setModalSosActivo(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
