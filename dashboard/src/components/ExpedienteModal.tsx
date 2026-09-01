'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import type { EventoMonitoreo } from '@/lib/supabase'
import { supabase, supabaseIA } from '@/lib/supabase'
import VideoVerificacionModal from './VideoVerificacionModal'
import { cleanRut } from '@/lib/rut'
import { esAbonadoInactivo } from '@/lib/inactivos_filter'
import { DIAS_SEMANA_DEFAULT, type DiaHorario, type ConfigHorarioAbonado } from './HorariosModal'

// Base de datos de fallback precargada
import clientesDataRaw from '@/lib/clientes_general.json'

const clientesGeneralFallback = clientesDataRaw as Record<string, Record<string, string>>

interface ExpedienteModalProps {
  evento?: EventoMonitoreo
  pestanaInicial?: 'telefonos' | 'horarios' | 'camara'
  onClose: () => void
  usuarioRol?: string
}

export default function ExpedienteModal({ evento, pestanaInicial, onClose, usuarioRol = 'Administrador' }: ExpedienteModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const buscarInputRef = useRef<HTMLInputElement>(null)
  
  // Cuenta activa seleccionada (inicia vacía salvo que venga de un evento con cuenta explícita)
  const cuentaInicial = evento?.cuenta && evento.cuenta !== 'SYS' && evento.cuenta !== '0000' && evento.cuenta !== 'ZONAS'
    ? evento.cuenta.toUpperCase().trim()
    : ''

  const [cuentaActiva, setCuentaActiva] = useState(cuentaInicial)
  const [buscarCuentaInput, setBuscarCuentaInput] = useState('')
  
  // Cache en memoria para todos los datos de clientes cargados
  const [clientesMap, setClientesMap] = useState<Record<string, Record<string, string>>>(() => {
    try {
      const local = localStorage.getItem('gama_clientes_cache')
      if (local) {
        const parsed = JSON.parse(local)
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return { ...clientesGeneralFallback, ...parsed }
        }
      }
    } catch (e) {}
    return clientesGeneralFallback
  })

  // Buffer de edición local para la cuenta activa
  const [clienteForm, setClienteForm] = useState<Record<string, string>>({})
  const [modoEdicion, setModoEdicion] = useState(false)
  const [esNuevo, setEsNuevo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ tipo: 'info' | 'ok' | 'error' | 'warn'; texto: string } | null>(null)

  // Control de pestañas
  const [tabEmergentes, setTabEmergentes] = useState<'telefonos' | 'horarios' | 'camara' | 'servicio_tecnico'>(pestanaInicial || 'telefonos')
  const [tabInfo, setTabInfo] = useState<'caracteristicas' | 'referencias' | 'observaciones'>('caracteristicas')
  const [tabInstalacion, setTabInstalacion] = useState<'instalacion' | 'ucontrol' | 'tiempos' | 'teclados' | 'sirenas'>('instalacion')

  const [ordenesCuenta, setOrdenesCuenta] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        const maxDim = 800
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75)
        setModoEdicion(true)
        setClienteForm(prev => ({ ...prev, foto: compressedBase64 }))
        setStatusMsg({ tipo: 'ok', texto: '📷 Fotografía cargada. Presione GUARDAR para sincronizar.' })
        setTimeout(() => setStatusMsg(null), 3000)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Foco automático en la casilla de búsqueda de NOMBRE al abrir el modal
  useEffect(() => {
    setTimeout(() => {
      buscarInputRef.current?.focus()
    }, 150)
  }, [])

  // Cargar clientes desde Supabase en segundo plano y sincronizar con caché en Tiempo Real
  useEffect(() => {
    const fetchClientesSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'CLIENTES')
          .order('id', { ascending: false })
          .limit(1)

        if (data && data.length > 0 && !error && data[0].nombre_abonado) {
          try {
            const remoteMap = JSON.parse(data[0].nombre_abonado)
            if (remoteMap && typeof remoteMap === 'object') {
              setClientesMap(prev => {
                const combined = { ...prev, ...remoteMap }
                try { localStorage.setItem('gama_clientes_cache', JSON.stringify(combined)) } catch (e) {}
                return combined
              })
            }
          } catch (errJson) {}
        }
      } catch (err) {
        console.warn('[EXPEDIENTE] Error cargando CLIENTES desde Supabase:', err)
      }
    }
    fetchClientesSupabase()

    // Realtime: suscripción instantánea cuando se modifique CLIENTES en Supabase
    let channel: any
    try {
      channel = supabase
        .channel('clientes-live-expediente')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos_monitoreo', filter: 'cuenta=eq.CLIENTES' }, (payload: any) => {
          if (payload.new && payload.new.nombre_abonado) {
            try {
              const remoteMap = JSON.parse(payload.new.nombre_abonado)
              if (remoteMap && typeof remoteMap === 'object') {
                setClientesMap(prev => ({ ...prev, ...remoteMap }))
              }
            } catch (e) {}
          }
        })
        .subscribe()
    } catch (e) {}

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  // Sincronizar el formulario al cambiar cuentaActiva o clientesMap
  useEffect(() => {
    if (esNuevo) return
    if (!cuentaActiva) {
      setClienteForm({})
      return
    }
    const target = clientesMap[cuentaActiva] || clientesGeneralFallback[cuentaActiva] || {
      cuenta: cuentaActiva,
      nombre: '',
      ciudad: 'LIMACHE',
      direccion: '',
      sector: ''
    }
    setClienteForm({ ...target, cuenta: cuentaActiva })
    setModoEdicion(false)
  }, [cuentaActiva, clientesMap, esNuevo])

  // Cargar historial de Órdenes de Trabajo para la cuenta activa
  useEffect(() => {
    const fetchOTs = async () => {
      if (!cuentaActiva) return
      try {
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'ORDENES_TRABAJO')
          .limit(1)
        if (data && data.length > 0 && data[0].nombre_abonado) {
          const list: any[] = JSON.parse(data[0].nombre_abonado || '[]')
          const filtered = list.filter((o: any) => (o.cuenta || '').toUpperCase().trim() === cuentaActiva.toUpperCase().trim())
          setOrdenesCuenta(filtered)
        }
      } catch (e) {}
    }
    fetchOTs()
  }, [cuentaActiva])

  // Estados de Horarios
  const [horariosDias, setHorariosDias] = useState<DiaHorario[]>(DIAS_SEMANA_DEFAULT)
  const [horariosNoCierre, setHorariosNoCierre] = useState(true)
  const [horariosTelWA, setHorariosTelWA] = useState('')
  const [horariosAlertaInhabitual, setHorariosAlertaInhabitual] = useState(true)
  const [guardandoHorarios, setGuardandoHorarios] = useState(false)

  useEffect(() => {
    if (!cuentaActiva) return
    const fetchH = async () => {
      try {
        const local = localStorage.getItem(`gama_horarios_${cuentaActiva}`)
        if (local) {
          const p = JSON.parse(local)
          if (p.dias && Array.isArray(p.dias)) {
            setHorariosDias(p.dias)
            setHorariosNoCierre(Boolean(p.notificarNoCierre))
            setHorariosTelWA(p.telefonoWhatsApp || '')
            setHorariosAlertaInhabitual(Boolean(p.alertaAperturaInhabitual))
            return
          }
        }
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', `HORARIOS_${cuentaActiva}`)
          .order('id', { ascending: false })
          .limit(1)
        if (data && data.length > 0 && data[0].nombre_abonado) {
          const p: ConfigHorarioAbonado = JSON.parse(data[0].nombre_abonado)
          if (p.dias && Array.isArray(p.dias)) {
            setHorariosDias(p.dias)
            setHorariosNoCierre(Boolean(p.notificarNoCierre))
            setHorariosTelWA(p.telefonoWhatsApp || '')
            setHorariosAlertaInhabitual(Boolean(p.alertaAperturaInhabitual))
            localStorage.setItem(`gama_horarios_${cuentaActiva}`, JSON.stringify(p))
            return
          }
        }
        const t = clienteForm?.telefono1 || clienteForm?.t1 || ''
        setHorariosDias(DIAS_SEMANA_DEFAULT)
        setHorariosNoCierre(true)
        setHorariosTelWA(t.replace(/[^0-9+]/g, ''))
        setHorariosAlertaInhabitual(true)
      } catch (e) {}
    }
    fetchH()
  }, [cuentaActiva, clienteForm?.telefono1, clienteForm?.t1])

  const guardarHorariosExpediente = async () => {
    if (!cuentaActiva) {
      alert('Seleccione un abonado antes de configurar horarios.')
      return
    }
    setGuardandoHorarios(true)
    try {
      const payload: ConfigHorarioAbonado = {
        cuenta: cuentaActiva,
        nombre: clienteForm.nombre || 'ABONADO',
        dias: horariosDias,
        notificarNoCierre: horariosNoCierre,
        telefonoWhatsApp: horariosTelWA.trim(),
        alertaAperturaInhabitual: horariosAlertaInhabitual,
        actualizadoEl: new Date().toISOString()
      }
      localStorage.setItem(`gama_horarios_${cuentaActiva}`, JSON.stringify(payload))
      const { error } = await supabase.from('eventos_monitoreo').upsert({
        cuenta: `HORARIOS_${cuentaActiva}`,
        nombre_abonado: JSON.stringify(payload),
        evento: 'CONFIG_HORARIOS_ABONADO',
        fecha_hora: new Date().toISOString()
      })
      if (error) throw error
      setStatusMsg({ tipo: 'ok', texto: '✅ Horarios guardados con éxito' })
      setTimeout(() => setStatusMsg(null), 3000)
    } catch (e: any) {
      setStatusMsg({ tipo: 'error', texto: '❌ Error al guardar horarios: ' + e.message })
    } finally {
      setGuardandoHorarios(false)
    }
  }

  // BOTÓN 1: EDITAR
  const handleEditar = () => {
    if (!cuentaActiva) {
      alert('Seleccione un abonado en la lista de abajo antes de editar.')
      return
    }
    setModoEdicion(true)
    setStatusMsg({
      tipo: 'info',
      texto: `✏️ MODO EDICIÓN ACTIVO [${cuentaActiva}]: Modifique los campos y presione GUARDAR para sincronizar en GENERAL.MDB.`
    })
  }

  // BOTÓN 2: GUARDAR (CREACIÓN O ACTUALIZACIÓN)
  const handleGuardar = async () => {
    const cuentaClean = (clienteForm.cuenta || cuentaActiva).toUpperCase().trim()
    if (!cuentaClean) {
      alert('Debe ingresar un código de cuenta válido.')
      return
    }

    setGuardando(true)
    setStatusMsg({ tipo: 'info', texto: '⏳ Guardando y encolando orden para PC Scorpion...' })

    try {
      const datosNuevos = { ...clienteForm, cuenta: cuentaClean }
      const tipoOp = esNuevo ? 'NUEVO_ABONADO' : 'EDITAR_GENERAL'

      // 1. Actualización de caché local inmediata
      const newMap = { ...clientesMap, [cuentaClean]: datosNuevos }
      setClientesMap(newMap)
      try { localStorage.setItem('gama_clientes_cache', JSON.stringify(newMap)) } catch (e) {}

      // 2. Envío a API Editor Remoto
      const res = await fetch('/api/editor-remoto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuenta: cuentaClean,
          tipoOperacion: tipoOp,
          datosNuevos,
          operador: { nombre: 'OPERADOR CENTRAL', rol: usuarioRol }
        })
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Error al guardar en el servidor')
      }

      setModoEdicion(false)
      setEsNuevo(false)
      setCuentaActiva(cuentaClean)
      setStatusMsg({
        tipo: 'ok',
        texto: `✅ [${cuentaClean}] GUARDADO Y SINCRONIZADO EN GENERAL.MDB (PC SCORPION)`
      })
      setTimeout(() => setStatusMsg(null), 4000)

    } catch (err: any) {
      console.error('Error guardando abonado:', err)
      setStatusMsg({ tipo: 'error', texto: `❌ Error: ${err.message}` })
    } finally {
      setGuardando(false)
    }
  }

  // BOTÓN 3: NUEVO ABONADO
  const handleNuevo = () => {
    const nuevaCuenta = prompt('Ingrese el código para el nuevo abonado (ej: C703, C800):', '')
    if (!nuevaCuenta) return
    const cClean = nuevaCuenta.toUpperCase().trim()

    const existente = clientesMap[cClean] || clientesGeneralFallback[cClean]

    if (existente) {
      const nombreExistente = (existente.nombre || 'ABONADO').trim()
      const esInactivo = esAbonadoInactivo(cClean, nombreExistente)
      const msg = esInactivo
        ? `La cuenta [${cClean}] correspondía a un abonado inactivo/renunciado:\n"${nombreExistente}".\n\n¿Desea SOBREESCRIBIR esta cuenta y registrar un NUEVO ABONADO desde cero con este código?`
        : `La cuenta [${cClean}] ya existe actualmente para:\n"${nombreExistente}".\n\n¿Desea SOBREESCRIBIR esta cuenta y registrar un NUEVO ABONADO desde cero?\n\n(Presione "Cancelar" si solo desea modificar sus datos actuales con el botón EDITAR).`

      const deseaSobreescribir = confirm(msg)
      if (!deseaSobreescribir) {
        // Cargar para edición normal si no desea sobreescribir desde cero
        setCuentaActiva(cClean)
        setClienteForm(existente)
        setModoEdicion(true)
        setEsNuevo(false)
        setStatusMsg({
          tipo: 'info',
          texto: `✏️ Cargada cuenta existente [${cClean}] para edición.`
        })
        return
      }
    }

    const nuevoRegistro: Record<string, string> = {
      cuenta: cClean,
      nombre: '',
      ciudad: 'LIMACHE',
      plan: 'PREMIUM',
      tipo1: 'COMERCIO',
      direccion: '',
      sector: '',
      telefono1: '',
      telefono2: '',
      telefono3: '',
      telefono4: '',
      telefono5: '',
      telefono6: '',
      nombre1: '',
      direccion1: '',
      carg1: '',
      t1: '',
      'caract adic1': '',
      referencia1: '',
      observacion1: '',
      fecha: new Date().toLocaleDateString('es-CL'),
      instalador: 'CENTRAL GAMA'
    }

    setCuentaActiva(cClean)
    setClienteForm(nuevoRegistro)
    setEsNuevo(true)
    setModoEdicion(true)
    setStatusMsg({
      tipo: 'warn',
      texto: `🆕 CREANDO/SOBREESCRIBIENDO ABONADO [${cClean}]: Complete los datos y presione GUARDAR para sincronizar en Scorpion.`
    })
  }

  // BOTÓN 4: ELIMINAR / DAR DE BAJA
  const handleEliminar = async () => {
    if (!cuentaActiva) {
      alert('Seleccione un abonado para eliminar.')
      return
    }
    const cuentaClean = cuentaActiva.toUpperCase().trim()
    const nombreAbonado = clienteForm.nombre || clientesMap[cuentaClean]?.nombre || 'ABONADO'

    if (!confirm(`¿CONFIRMA ELIMINAR / DAR DE BAJA AL ABONADO [${cuentaClean}] ${nombreAbonado}?\n\nEsta acción eliminará el registro de GENERAL.MDB en la PC Scorpion.`)) {
      return
    }

    setGuardando(true)
    setStatusMsg({ tipo: 'info', texto: `⏳ Eliminando cuenta ${cuentaClean} de Scorpion...` })

    try {
      // 1. Eliminar de memoria local
      const newMap = { ...clientesMap }
      delete newMap[cuentaClean]
      setClientesMap(newMap)
      try { localStorage.setItem('gama_clientes_cache', JSON.stringify(newMap)) } catch (e) {}

      // 2. Enviar orden de eliminación a API Editor Remoto
      const res = await fetch('/api/editor-remoto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuenta: cuentaClean,
          tipoOperacion: 'ELIMINAR_ABONADO',
          datosNuevos: {},
          operador: { nombre: 'OPERADOR CENTRAL', rol: usuarioRol }
        })
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Error al eliminar en el servidor')
      }

      setCuentaActiva('')
      setClienteForm({})
      setModoEdicion(false)
      setEsNuevo(false)

      setStatusMsg({
        tipo: 'ok',
        texto: `🗑️ [${cuentaClean}] ABONADO ELIMINADO EXITOSAMENTE DE GENERAL.MDB`
      })
      setTimeout(() => setStatusMsg(null), 4000)

    } catch (err: any) {
      console.error('Error eliminando abonado:', err)
      setStatusMsg({ tipo: 'error', texto: `❌ Error: ${err.message}` })
    } finally {
      setGuardando(false)
    }
  }

  // BOTÓN 5: CANCELAR
  const handleCancelar = () => {
    if (esNuevo) {
      setCuentaActiva('')
      setClienteForm({})
      setEsNuevo(false)
    } else if (cuentaActiva) {
      const target = clientesMap[cuentaActiva] || clientesGeneralFallback[cuentaActiva] || {}
      setClienteForm({ ...target, cuenta: cuentaActiva })
    }
    setModoEdicion(false)
    setStatusMsg({ tipo: 'info', texto: '↩️ EDICIÓN CANCELADA — Datos restaurados.' })
    setTimeout(() => setStatusMsg(null), 2500)
  }

  // Lista de todos los abonados para el buscador inferior (incluye todas las cuentas para que los operadores siempre puedan buscarlas y editarlas)
  const listaAbonados = useMemo(() => {
    return Object.values(clientesMap)
      .map(c => ({
        cuenta: (c.cuenta || '').toUpperCase().trim(),
        nombre: (c.nombre || '').toUpperCase().trim()
      }))
      .filter(a => a.cuenta)
      .sort((a, b) => a.cuenta.localeCompare(b.cuenta))
  }, [clientesMap])

  const listaFiltrada = useMemo(() => {
    const q = buscarCuentaInput.trim().toLowerCase()
    if (!q) return listaAbonados
    return listaAbonados.filter(a => 
      a.cuenta.toLowerCase().includes(q) ||
      a.nombre.toLowerCase().includes(q)
    )
  }, [listaAbonados, buscarCuentaInput])

  const updateField = (key: string, val: string) => {
    if (!modoEdicion) return
    setClienteForm(prev => ({ ...prev, [key]: val }))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 font-sans p-2 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* VENTANA SCORPION RETRO EXACTA */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-[96vw] max-w-[1020px] bg-[#d4d0c8] text-black border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] shadow-[4px_4px_24px_rgba(0,0,0,0.85)] focus:outline-none flex flex-col justify-between select-none"
        style={{ fontSize: '11px' }}
      >
        {/* Barra de Título */}
        <div className="bg-[#000080] text-white font-bold px-2 py-0.5 flex justify-between items-center select-none shrink-0 h-6">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">📖</span>
            <span className="text-[11px] tracking-wide font-sans">Scorpion - Expediente de Usuario</span>
            {modoEdicion && (
              <span className="bg-amber-400 text-black px-1 text-[9px] font-black rounded-xs ml-2 animate-pulse">
                ✏️ EDITANDO
              </span>
            )}
            {esNuevo && (
              <span className="bg-green-400 text-black px-1 text-[9px] font-black rounded-xs ml-2">
                🆕 NUEVO
              </span>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-black border-r-black text-black font-bold flex items-center justify-center active:border-t-black active:border-l-black active:border-b-white active:border-r-white text-[10px] pb-0.5 cursor-pointer leading-none"
          >
            ✕
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL CON ESPACIADO SUPERIOR ADECUADO PARA NO TAPAR INFORMACION BASICA */}
        <div className="px-2 pt-3.5 pb-2 flex flex-col gap-2.5 overflow-y-auto">
          
          {/* FILA 1: INFORMACION BASICA + FOTOGRAFIA */}
          <div className="flex flex-col md:flex-row gap-2 shrink-0">
            
            {/* Caja INFORMACION BASICA */}
            <div className="flex-1 border border-gray-400 p-2 relative pt-3.5 flex flex-col gap-1.5 bg-[#d4d0c8]">
              <div className="absolute -top-2.5 left-2.5 bg-[#d4d0c8] px-1 font-bold text-[9px] uppercase tracking-wider text-gray-800">
                INFORMACION BASICA:
              </div>

              {/* Fila 1: Cuenta y Nombre */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[11px]">Cuenta:</span>
                  <input
                    type="text"
                    value={clienteForm.cuenta || cuentaActiva || ''}
                    readOnly={!esNuevo}
                    onChange={(e) => updateField('cuenta', e.target.value.toUpperCase())}
                    placeholder="—"
                    className={`w-16 border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1 py-0.5 font-mono font-bold text-blue-900 text-[11px] ${
                      esNuevo ? 'bg-white focus:outline-blue-700' : 'bg-[#ffffd0]'
                    }`}
                  />
                </div>
                <div className="flex-1 flex items-center gap-1">
                  <span className="font-bold text-[11px]">Nombre:</span>
                  <input
                    type="text"
                    value={clienteForm.nombre || ''}
                    readOnly={!modoEdicion}
                    onChange={(e) => updateField('nombre', e.target.value.toUpperCase())}
                    placeholder={cuentaActiva ? '' : 'Seleccione un abonado en la lista de abajo...'}
                    className={`w-full border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-blue-900 text-[11px] truncate focus:outline-none ${
                      modoEdicion ? 'bg-white focus:ring-1 focus:ring-blue-600' : 'bg-[#ffffd0]'
                    }`}
                  />
                </div>
              </div>

              {/* Fila 2: Ciudad, Plan y Tipo */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 flex-1">
                  <span className="font-bold text-[11px]">Ciudad</span>
                  <input
                    type="text"
                    value={clienteForm.ciudad || ''}
                    readOnly={!modoEdicion}
                    onChange={(e) => updateField('ciudad', e.target.value.toUpperCase())}
                    className={`w-full border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-blue-900 text-[11px] focus:outline-none ${
                      modoEdicion ? 'bg-white' : 'bg-[#ffffd0]'
                    }`}
                    placeholder="Ciudad o Comuna..."
                  />
                </div>
                <div className="flex items-center gap-1 w-36">
                  <span className="font-bold text-[11px]">Plan</span>
                  <input
                    type="text"
                    value={clienteForm.plan || ''}
                    readOnly={!modoEdicion}
                    onChange={(e) => updateField('plan', e.target.value.toUpperCase())}
                    className={`w-full border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1 py-0.5 text-blue-900 text-[11px] focus:outline-none ${
                      modoEdicion ? 'bg-white' : 'bg-[#ffffd0]'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-1 w-36">
                  <span className="font-bold text-[11px]">Tipo</span>
                  <input
                    type="text"
                    value={clienteForm.tipo1 || ''}
                    readOnly={!modoEdicion}
                    onChange={(e) => updateField('tipo1', e.target.value.toUpperCase())}
                    className={`w-full border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1 py-0.5 text-blue-900 text-[11px] focus:outline-none ${
                      modoEdicion ? 'bg-white' : 'bg-[#ffffd0]'
                    }`}
                  />
                </div>
              </div>

              {/* Fila 3: Dirección, Botón Mapa y Sector */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-1">
                  <span className="font-bold text-[11px]">Dirección:</span>
                  <input
                    type="text"
                    value={clienteForm.direccion || ''}
                    readOnly={!modoEdicion}
                    onChange={(e) => updateField('direccion', e.target.value.toUpperCase())}
                    className={`flex-1 border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-blue-900 text-[11px] truncate focus:outline-none ${
                      modoEdicion ? 'bg-white' : 'bg-[#ffffd0]'
                    }`}
                  />
                  {clienteForm.direccion && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clienteForm.direccion}, ${clienteForm.ciudad || clienteForm.sector || 'Chile'}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ver ubicación en Google Maps / Street View"
                      className="bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-1.5 py-0.5 text-[10px] font-bold text-blue-900 hover:bg-white active:border-t-gray-700 shrink-0 flex items-center gap-0.5"
                    >
                      <span>📍</span>
                      <span className="hidden sm:inline">Mapa</span>
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1 w-44">
                  <span className="font-bold text-[11px]">Sector:</span>
                  <input
                    type="text"
                    value={clienteForm.sector || ''}
                    readOnly={!modoEdicion}
                    onChange={(e) => updateField('sector', e.target.value.toUpperCase())}
                    className={`w-full border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1 py-0.5 text-blue-900 text-[11px] focus:outline-none ${
                      modoEdicion ? 'bg-white' : 'bg-[#ffffd0]'
                    }`}
                  />
                </div>
              </div>

              {/* Fila 4: Marco TELEFONOS */}
              <div className="border border-gray-400 p-1.5 relative mt-2 bg-[#d4d0c8]">
                <div className="absolute -top-2.5 left-2 bg-[#d4d0c8] px-1 text-[8px] font-bold text-gray-700">
                  TELEFONOS:
                </div>
                <div className="grid grid-cols-6 gap-1 pt-0.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      value={clienteForm[`telefono${i + 1}`] || ''}
                      readOnly={!modoEdicion}
                      onChange={(e) => updateField(`telefono${i + 1}`, e.target.value)}
                      placeholder=""
                      className={`w-full border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1 py-0.5 text-center font-bold text-blue-900 text-[10px] focus:outline-none ${
                        modoEdicion ? 'bg-white' : 'bg-[#ffffd0]'
                      }`}
                    />
                  ))}
                </div>
              </div>

            </div>

            {/* Caja FOTOGRAFIA (Móvil / PC) */}
            <div className="w-full md:w-[280px] border border-gray-400 p-1 flex flex-col justify-between bg-[#d4d0c8] shrink-0">
              <div className="flex items-center justify-between px-1">
                <span className="font-bold text-[10px] text-gray-800 tracking-wider">FOTOGRAFIA / FACHADA</span>
                {clienteForm.foto && modoEdicion && (
                  <button
                    type="button"
                    onClick={() => setClienteForm(prev => ({ ...prev, foto: '' }))}
                    className="text-red-700 font-bold text-[9px] hover:underline cursor-pointer"
                  >
                    ✕ Quitar
                  </button>
                )}
              </div>
              
              <div 
                onClick={() => {
                  if (modoEdicion) {
                    fileInputRef.current?.click()
                  }
                }}
                className={`h-[105px] bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white my-1 flex items-center justify-center overflow-hidden relative ${
                  modoEdicion ? 'cursor-pointer group hover:opacity-95' : 'cursor-default'
                }`}
                title={modoEdicion ? 'Haga clic para subir o cambiar fotografía' : 'Modo sólo lectura. Presione EDITAR para modificar.'}
              >
                {clienteForm.foto || clienteForm.fotografia || clienteForm.foto_url ? (
                  <img
                    src={clienteForm.foto || clienteForm.fotografia || clienteForm.foto_url}
                    alt="Fotografía Abonado"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <span className="text-2xl">📷</span>
                    <span className="text-[9px] text-gray-500 font-bold mt-1">Sin fotografía</span>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
              />

              <button
                type="button"
                disabled={!modoEdicion}
                onClick={() => {
                  if (modoEdicion) fileInputRef.current?.click()
                }}
                className={`w-full bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-[9px] py-1 font-bold uppercase tracking-wider text-gray-800 flex items-center justify-center gap-1 shadow-xs ${
                  modoEdicion ? 'hover:bg-[#e0e0e0] active:border-t-gray-700 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                }`}
                title={modoEdicion ? 'Subir o cambiar fotografía' : 'Presione EDITAR para subir o cambiar fotografía'}
              >
                <span>📸</span>
                <span>{clienteForm.foto ? 'CAMBIAR FOTO (MÓVIL / PC)' : 'SUBIR FOTO (MÓVIL / PC)'}</span>
              </button>
            </div>

          </div>

          {/* FILA 2: PESTAÑAS MEDIAS (TELEFONOS EMERGENTES + CARACTERISTICAS) */}
          <div className="flex flex-col md:flex-row gap-2 shrink-0">
            
            {/* Lado Izquierdo: Pestañas Telefónicas / Horarios / Cámaras */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex gap-0.5 text-[9px]">
                <button
                  type="button"
                  onClick={() => setTabEmergentes('telefonos')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabEmergentes === 'telefonos' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  TELEFONOS EMERGENTES
                </button>
                <button
                  type="button"
                  onClick={() => setTabEmergentes('horarios')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabEmergentes === 'horarios' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  HORARIOS APERTURA Y CIERRE
                </button>
                <button
                  type="button"
                  onClick={() => setTabEmergentes('camara')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabEmergentes === 'camara' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  CAMARA DE VERIFICACION
                </button>
                <button
                  type="button"
                  onClick={() => setTabEmergentes('servicio_tecnico')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabEmergentes === 'servicio_tecnico' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  🛠️ SERVICIO TECNICO ({ordenesCuenta.length})
                </button>
              </div>

              {/* Contenedor Pestaña Izquierda */}
              <div className="border border-white bg-[#d4d0c8] p-1 flex-1 flex flex-col justify-start">
                {tabEmergentes === 'telefonos' && (
                  <div className="border border-gray-400 p-1 relative flex-1 bg-[#d4d0c8] flex flex-col mt-0.5">
                    <div className="absolute -top-2.5 left-2 bg-[#d4d0c8] px-1 text-[8px] font-bold text-gray-700 uppercase">
                      NUMEROS DE EMERGENCIA
                    </div>
                    <div className="mt-1">
                      <table className="w-full border-collapse text-[10px] text-left">
                        <thead>
                          <tr className="text-gray-800 font-bold text-[10px]">
                            <th className="p-0.5 w-[30%] text-center">Nombre</th>
                            <th className="p-0.5 w-[28%] text-center">Dirección</th>
                            <th className="p-0.5 w-[22%] text-center">Cargo/Afinidad</th>
                            <th className="p-0.5 w-[20%] text-center">Teléfono</th>
                          </tr>
                        </thead>
                        <tbody className="space-y-0.5">
                          {Array.from({ length: 7 }).map((_, idx) => {
                            const num = idx + 1
                            return (
                              <tr key={num}>
                                <td className="p-0.5">
                                  <input
                                    type="text"
                                    value={clienteForm[`nombre${num}`] || ''}
                                    readOnly={!modoEdicion}
                                    onChange={(e) => updateField(`nombre${num}`, e.target.value.toUpperCase())}
                                    className={`w-full border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1 py-0.5 font-bold text-blue-900 text-[10px] focus:outline-none ${
                                      modoEdicion ? 'bg-white' : 'bg-[#ffffd0]'
                                    }`}
                                  />
                                </td>
                                <td className="p-0.5">
                                  <input
                                    type="text"
                                    value={clienteForm[`direccion${num}`] || ''}
                                    readOnly={!modoEdicion}
                                    onChange={(e) => updateField(`direccion${num}`, e.target.value.toUpperCase())}
                                    className={`w-full border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1 py-0.5 font-bold text-blue-900 text-[10px] focus:outline-none ${
                                      modoEdicion ? 'bg-white' : 'bg-[#ffffd0]'
                                    }`}
                                  />
                                </td>
                                <td className="p-0.5">
                                  <input
                                    type="text"
                                    value={clienteForm[`carg${num}`] || ''}
                                    readOnly={!modoEdicion}
                                    onChange={(e) => updateField(`carg${num}`, e.target.value.toUpperCase())}
                                    className={`w-full border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1 py-0.5 font-bold text-blue-900 text-[10px] focus:outline-none ${
                                      modoEdicion ? 'bg-white' : 'bg-[#ffffd0]'
                                    }`}
                                  />
                                </td>
                                <td className="p-0.5">
                                  <div className="flex items-center gap-0.5">
                                    <input
                                      type="text"
                                      value={clienteForm[`t${num}`] || ''}
                                      readOnly={!modoEdicion}
                                      onChange={(e) => updateField(`t${num}`, e.target.value)}
                                      className={`flex-1 min-w-0 border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1 py-0.5 font-bold text-blue-900 text-[10px] focus:outline-none ${
                                        modoEdicion ? 'bg-white' : 'bg-[#ffffd0]'
                                      }`}
                                    />
                                    {clienteForm[`t${num}`] && (
                                      <div className="flex items-center gap-0.5 shrink-0">
                                        <a
                                          href={`tel:${(clienteForm[`t${num}`] || '').replace(/[^0-9+]/g, '')}`}
                                          title="Llamar teléfono"
                                          className="px-1 py-0.5 bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-[9px] hover:bg-white active:border-t-gray-700 cursor-pointer"
                                        >
                                          📞
                                        </a>
                                        <a
                                          href={`https://wa.me/${(clienteForm[`t${num}`] || '').replace(/[^0-9]/g, '')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          title="Abrir chat de WhatsApp"
                                          className="px-1 py-0.5 bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-[9px] hover:bg-white active:border-t-gray-700 cursor-pointer text-green-700 font-bold"
                                        >
                                          💬
                                        </a>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const tLimpio = (clienteForm[`t${num}`] || '').trim()
                                            navigator.clipboard.writeText(tLimpio)
                                            setStatusMsg({ tipo: 'ok', texto: `📋 Teléfono copiado: ${tLimpio}` })
                                            setTimeout(() => setStatusMsg(null), 2000)
                                          }}
                                          title="Copiar teléfono al portapapeles"
                                          className="px-1 py-0.5 bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-[9px] hover:bg-white active:border-t-gray-700 cursor-pointer"
                                        >
                                          📋
                                        </button>
                                      </div>
                                    )}
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

                {tabEmergentes === 'horarios' && (
                  <div className="border border-gray-400 bg-[#d4d0c8] p-1.5 flex flex-col gap-1 text-[10px]">
                    <div className="font-bold text-blue-950 mb-1">⏰ HORARIOS DE APERTURA Y CIERRE [{cuentaActiva || 'SIN SELECCIÓN'}]</div>
                    <div className="overflow-y-auto max-h-[140px] bg-white border border-gray-500">
                      <table className="w-full text-[10px]">
                        <thead className="bg-[#b0b0b0] font-bold">
                          <tr>
                            <th className="p-1 border-r">Día</th>
                            <th className="p-1 border-r text-center">Estado</th>
                            <th className="p-1 border-r text-center">Apertura</th>
                            <th className="p-1 border-r text-center">Cierre</th>
                          </tr>
                        </thead>
                        <tbody>
                          {horariosDias.map((d, i) => (
                            <tr key={d.dia} className="border-b">
                              <td className="p-1 font-bold">{d.label}</td>
                              <td className="p-1 text-center">
                                <button
                                  type="button"
                                  disabled={!modoEdicion}
                                  onClick={() => {
                                    const next = [...horariosDias]
                                    next[i] = { ...next[i], habilitado: !d.habilitado }
                                    setHorariosDias(next)
                                  }}
                                  className={`px-1.5 py-0.2 text-[8px] font-bold ${d.habilitado ? 'bg-green-700 text-white' : 'bg-gray-400 text-black'}`}
                                >
                                  {d.habilitado ? 'ABIERTO' : 'CERRADO'}
                                </button>
                              </td>
                              <td className="p-1 text-center">
                                <input
                                  type="time"
                                  disabled={!d.habilitado || !modoEdicion}
                                  value={d.apertura}
                                  onChange={(e) => {
                                    const next = [...horariosDias]
                                    next[i] = { ...next[i], apertura: e.target.value }
                                    setHorariosDias(next)
                                  }}
                                  className="bg-[#ffffd0] border border-gray-400 font-mono px-1"
                                />
                              </td>
                              <td className="p-1 text-center">
                                <input
                                  type="time"
                                  disabled={!d.habilitado || !modoEdicion}
                                  value={d.cierre}
                                  onChange={(e) => {
                                    const next = [...horariosDias]
                                    next[i] = { ...next[i], cierre: e.target.value }
                                    setHorariosDias(next)
                                  }}
                                  className="bg-[#ffffd0] border border-gray-400 font-mono px-1"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={guardarHorariosExpediente}
                        disabled={guardandoHorarios}
                        className="bg-[#000080] text-white font-bold px-3 py-0.5 text-[9px]"
                      >
                        {guardandoHorarios ? 'Guardando...' : '💾 Guardar Horarios'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lado Derecho: Pestañas Características / Referencias / Observaciones */}
            <div className="w-full md:w-[360px] flex flex-col shrink-0">
              <div className="flex gap-0.5 text-[9px]">
                <button
                  type="button"
                  onClick={() => setTabInfo('caracteristicas')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInfo === 'caracteristicas' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  CARACTERISTICAS
                </button>
                <button
                  type="button"
                  onClick={() => setTabInfo('referencias')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInfo === 'referencias' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  REFERENCIAS
                </button>
                <button
                  type="button"
                  onClick={() => setTabInfo('observaciones')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInfo === 'observaciones' ? 'bg-[#d4d0c8] pb-1 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  OBSERVACIONES
                </button>
              </div>

              <div className="border border-white bg-[#d4d0c8] p-1 flex-1 flex flex-col">
                <div className="border border-gray-400 p-1 relative flex-1 bg-[#d4d0c8] flex flex-col mt-0.5">
                  <div className="absolute -top-2.5 left-2 bg-[#d4d0c8] px-1 text-[8px] font-bold text-gray-700 uppercase">
                    {tabInfo === 'caracteristicas' ? 'CARACTERISTICAS' : tabInfo === 'referencias' ? 'REFERENCIAS' : 'OBSERVACIONES'}
                  </div>
                  <textarea
                    value={
                      tabInfo === 'caracteristicas'
                        ? clienteForm['caract adic1'] || ''
                        : tabInfo === 'referencias'
                        ? clienteForm['referencia1'] || ''
                        : clienteForm['observacion1'] || ''
                    }
                    readOnly={!modoEdicion}
                    onChange={(e) => {
                      const k = tabInfo === 'caracteristicas' ? 'caract adic1' : tabInfo === 'referencias' ? 'referencia1' : 'observacion1'
                      updateField(k, e.target.value)
                    }}
                    rows={7}
                    className={`w-full h-full border border-t-gray-700 border-l-gray-700 border-b-white border-r-white p-1 font-bold text-blue-900 text-[10px] resize-none focus:outline-none mt-1 ${
                      modoEdicion ? 'bg-white' : 'bg-[#ffffd0]'
                    }`}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* FILA 3: INSTALACION + BUSCAR USUARIO + BOTONES LATERALES */}
          <div className="flex flex-col md:flex-row gap-2 shrink-0">
            
            {/* Pestañas de Instalación / U. Control */}
            <div className="w-full md:w-[280px] flex flex-col shrink-0">
              <div className="flex gap-0.5 text-[9px]">
                <button
                  type="button"
                  onClick={() => setTabInstalacion('instalacion')}
                  className={`px-1.5 py-0.5 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInstalacion === 'instalacion' ? 'bg-[#d4d0c8] pb-1' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  INSTALACION
                </button>
                <button
                  type="button"
                  onClick={() => setTabInstalacion('ucontrol')}
                  className={`px-1.5 py-0.5 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInstalacion === 'ucontrol' ? 'bg-[#d4d0c8] pb-1' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  U. CONTROL
                </button>
                <button
                  type="button"
                  onClick={() => setTabInstalacion('tiempos')}
                  className={`px-1.5 py-0.5 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInstalacion === 'tiempos' ? 'bg-[#d4d0c8] pb-1' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  TIEMPOS
                </button>
                <button
                  type="button"
                  onClick={() => setTabInstalacion('teclados')}
                  className={`px-1.5 py-0.5 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInstalacion === 'teclados' ? 'bg-[#d4d0c8] pb-1' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  TECLADOS
                </button>
                <button
                  type="button"
                  onClick={() => setTabInstalacion('sirenas')}
                  className={`px-1.5 py-0.5 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInstalacion === 'sirenas' ? 'bg-[#d4d0c8] pb-1' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  SIRENAS
                </button>
              </div>

              <div className="border border-white bg-[#d4d0c8] p-2 flex-1 flex flex-col justify-center gap-1.5">
                {tabInstalacion === 'instalacion' && (
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex items-center gap-1">
                      <span className="font-bold w-28 text-right">Fecha de Instalación:</span>
                      <input
                        type="text"
                        value={clienteForm.fecha || ''}
                        readOnly={!modoEdicion}
                        onChange={(e) => updateField('fecha', e.target.value)}
                        className={`flex-1 border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 font-bold text-blue-900 focus:outline-none ${
                          modoEdicion ? 'bg-white' : 'bg-[#ffffd0]'
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold w-28 text-right">Instalador:</span>
                      <input
                        type="text"
                        value={clienteForm.instalador || ''}
                        readOnly={!modoEdicion}
                        onChange={(e) => updateField('instalador', e.target.value)}
                        className={`flex-1 border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 font-bold text-blue-900 truncate focus:outline-none ${
                          modoEdicion ? 'bg-white' : 'bg-[#ffffd0]'
                        }`}
                      />
                    </div>
                  </div>
                )}
                {tabInstalacion === 'ucontrol' && (
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex items-center gap-1">
                      <span className="font-bold w-20 text-right">Marca/Mod:</span>
                      <input
                        type="text"
                        value={`${clienteForm.marca || ''} ${clienteForm.modelo || ''}`.trim()}
                        readOnly={!modoEdicion}
                        onChange={(e) => updateField('modelo', e.target.value)}
                        className={`flex-1 border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 font-bold text-blue-900 focus:outline-none ${
                          modoEdicion ? 'bg-white' : 'bg-[#ffffd0]'
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold w-20 text-right">Ubicación UC:</span>
                      <input
                        type="text"
                        value={clienteForm.ubicacion_uc || ''}
                        readOnly={!modoEdicion}
                        onChange={(e) => updateField('ubicacion_uc', e.target.value)}
                        className={`flex-1 border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 font-bold text-blue-900 truncate focus:outline-none ${
                          modoEdicion ? 'bg-white' : 'bg-[#ffffd0]'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BUSCAR USUARIO */}
            <div className="flex-1 border border-gray-400 p-2 relative bg-[#d4d0c8] flex flex-col gap-1 min-h-[110px] mt-0.5">
              <div className="absolute -top-2.5 left-2 bg-[#d4d0c8] px-1 text-[8px] font-bold text-gray-700 uppercase">
                BUSCAR USUARIO
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[10px]">CUENTA:</span>
                  <input
                    type="text"
                    value={cuentaActiva}
                    readOnly
                    placeholder="—"
                    className="w-16 bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-mono font-bold px-1.5 py-0.5 text-black"
                  />
                </div>
                <div className="flex-1 flex items-center gap-1">
                  <span className="font-bold text-[10px]">NOMBRE:</span>
                  <input
                    ref={buscarInputRef}
                    type="text"
                    value={buscarCuentaInput}
                    onChange={(e) => setBuscarCuentaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (listaFiltrada.length > 0) {
                          if (modoEdicion) {
                            if (!confirm('Tiene cambios sin guardar. ¿Desea cambiar de cuenta y descartarlos?')) return
                          }
                          const cTarget = listaFiltrada[0].cuenta.toUpperCase().trim()
                          setCuentaActiva(cTarget)
                          const target = clientesMap[cTarget] || clientesGeneralFallback[cTarget] || { cuenta: cTarget }
                          setClienteForm(target)
                          setBuscarCuentaInput('')
                          setModoEdicion(false)
                          setEsNuevo(false)
                        }
                      }
                    }}
                    className="flex-1 bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-black text-[10px] focus:outline-blue-700"
                    placeholder="Ingrese cuenta o nombre y presione ENTER para cargar"
                  />
                </div>
              </div>

              {/* Lista Azul Marino con scroll */}
              <div className="h-[70px] bg-[#000080] text-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white overflow-y-auto font-mono text-[10px]">
                {listaFiltrada.map((item) => (
                  <div
                    key={item.cuenta}
                    onClick={() => {
                      if (modoEdicion) {
                        if (!confirm('Tiene cambios sin guardar. ¿Desea cambiar de cuenta y descartarlos?')) return
                      }
                      const cTarget = item.cuenta.toUpperCase().trim()
                      setCuentaActiva(cTarget)
                      const target = clientesMap[cTarget] || clientesGeneralFallback[cTarget] || { cuenta: cTarget }
                      setClienteForm(target)
                      setBuscarCuentaInput('')
                      setModoEdicion(false)
                      setEsNuevo(false)
                    }}
                    className={`px-1.5 py-0.5 cursor-pointer select-none font-bold ${
                      cuentaActiva === item.cuenta ? 'bg-yellow-400 text-black' : 'hover:bg-blue-900'
                    }`}
                  >
                    {item.cuenta.padEnd(6, ' ')} | {item.nombre}
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMNA DE 6 BOTONES A LA DERECHA */}
            <div className="w-full md:w-[105px] flex md:flex-col gap-1 justify-between shrink-0">
              <button
                type="button"
                onClick={handleEditar}
                className="flex-1 md:flex-none h-7 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-gray-900 font-extrabold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer hover:bg-[#e0e0e0] text-[10px] shadow-xs"
              >
                EDITAR
              </button>
              <button
                type="button"
                onClick={handleGuardar}
                disabled={guardando || !modoEdicion}
                className="flex-1 md:flex-none h-7 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-gray-900 font-extrabold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer hover:bg-[#e0e0e0] text-[10px] shadow-xs disabled:opacity-50"
              >
                {guardando ? 'GUARDANDO...' : 'GUARDAR'}
              </button>
              <button
                type="button"
                onClick={handleNuevo}
                className="flex-1 md:flex-none h-7 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-gray-900 font-extrabold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer hover:bg-[#e0e0e0] text-[10px] shadow-xs"
              >
                NUEVO
              </button>
              <button
                type="button"
                onClick={handleEliminar}
                disabled={guardando || !cuentaActiva}
                className="flex-1 md:flex-none h-7 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-gray-900 font-extrabold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer hover:bg-[#e0e0e0] text-[10px] shadow-xs disabled:opacity-50"
              >
                ELIMINAR
              </button>
              <button
                type="button"
                onClick={handleCancelar}
                className="flex-1 md:flex-none h-7 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-gray-900 font-extrabold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer hover:bg-[#e0e0e0] text-[10px] shadow-xs"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 md:flex-none h-7 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-gray-900 font-extrabold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer hover:bg-[#e0e0e0] text-[10px] shadow-xs"
              >
                SALIR
              </button>
            </div>

          </div>

          {/* Feedback Bar */}
          {statusMsg && (
            <div className={`px-2 py-1 text-center text-[10px] font-bold rounded-xs shadow-xs ${
              statusMsg.tipo === 'ok' ? 'bg-green-800 text-white' :
              statusMsg.tipo === 'error' ? 'bg-red-800 text-white' :
              statusMsg.tipo === 'warn' ? 'bg-amber-400 text-black' :
              'bg-blue-900 text-white animate-pulse'
            }`}>
              {statusMsg.texto}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
