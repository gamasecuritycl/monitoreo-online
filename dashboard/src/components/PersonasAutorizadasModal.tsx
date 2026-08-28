'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import personasAutorizadasFallback from '@/lib/personas_autorizadas.json'

interface PersonaAutorizada {
  prioridad: number
  nombre: string
  nombre_raw?: string
  contrasena: string
  cargo: string
  direccion: string
  telefono: string
}

interface PersonasAutorizadasModalProps {
  isOpen: boolean
  onClose: () => void
  cuentaInicial?: string
  nombreInicial?: string
  clientesMap?: Record<string, Record<string, string>>
}

export default function PersonasAutorizadasModal({
  isOpen,
  onClose,
  cuentaInicial = '0462',
  nombreInicial = '',
  clientesMap = {}
}: PersonasAutorizadasModalProps) {
  // Mapa de todas las cuentas y sus personas autorizadas
  const [mapaAutorizados, setMapaAutorizados] = useState<Record<string, PersonaAutorizada[]>>(
    personasAutorizadasFallback as Record<string, PersonaAutorizada[]>
  )
  const [cuentaActiva, setCuentaActiva] = useState<string>(cuentaInicial || '0462')
  const [personaSeleccionadaIdx, setPersonaSeleccionadaIdx] = useState<number>(0)
  const [busquedaUsuario, setBusquedaUsuario] = useState<string>('')
  const [mostrarContrasena, setMostrarContrasena] = useState<boolean>(true)
  const [copiadoIdx, setCopiadoIdx] = useState<string | null>(null)

  // Cargar desde Supabase para tener siempre la versión más fresca
  useEffect(() => {
    async function cargarDesdeSupabase() {
      try {
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'PERSONAS_AUTORIZADAS')
          .order('id', { ascending: false })
          .limit(1)

        if (data && data.length > 0 && data[0].nombre_abonado) {
          try {
            const parsed = JSON.parse(data[0].nombre_abonado)
            if (parsed && typeof parsed === 'object') {
              setMapaAutorizados(parsed)
            }
          } catch {}
        }
      } catch (err) {
        console.error('Error cargando personas autorizadas desde Supabase:', err)
      }
    }
    if (isOpen) {
      cargarDesdeSupabase()
    }
  }, [isOpen])

  // Actualizar cuenta activa si cambia la prop
  useEffect(() => {
    if (cuentaInicial) {
      setCuentaActiva(cuentaInicial)
      setPersonaSeleccionadaIdx(0)
    }
  }, [cuentaInicial, isOpen])

  // Lista de cuentas disponibles ordenadas
  const listaCuentas = useMemo(() => {
    const setCuentas = new Set<string>()
    Object.keys(mapaAutorizados).forEach(c => setCuentas.add(c.toUpperCase()))
    Object.keys(clientesMap).forEach(c => setCuentas.add(c.toUpperCase()))
    return Array.from(setCuentas).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }, [mapaAutorizados, clientesMap])

  // Resolver personas autorizadas para la cuenta activa (con fallbacks normalizados)
  const personasCuenta = useMemo(() => {
    const cClean = cuentaActiva.trim().toUpperCase()
    if (mapaAutorizados[cClean]) return mapaAutorizados[cClean]
    if (cClean.startsWith('C') && mapaAutorizados[cClean.slice(1)]) return mapaAutorizados[cClean.slice(1)]
    if (!cClean.startsWith('C') && mapaAutorizados[`C${cClean}`]) return mapaAutorizados[`C${cClean}`]
    const zf = cClean.replace(/^C/, '').padStart(4, '0')
    if (mapaAutorizados[zf]) return mapaAutorizados[zf]
    if (mapaAutorizados[`C${zf}`]) return mapaAutorizados[`C${zf}`]
    return []
  }, [cuentaActiva, mapaAutorizados])

  // Resolver nombre de la cuenta
  const nombreCuenta = useMemo(() => {
    if (nombreInicial && cuentaActiva === cuentaInicial) return nombreInicial
    const cClean = cuentaActiva.trim().toUpperCase()
    const cl = clientesMap[cClean] || clientesMap[cClean.replace(/^C/, '')] || clientesMap[`C${cClean}`]
    if (cl && (cl.nombre || cl.NOMBRE)) return cl.nombre || cl.NOMBRE
    if (cClean === '0462' || cClean === 'C0462' || cClean === '462') return 'CROSS PLAZA RENUNCIADO22 10/NOV/2020'
    return 'ABONADO GAMA SEGURIDAD'
  }, [cuentaActiva, nombreInicial, cuentaInicial, clientesMap])

  // Persona activa seleccionada
  const personaActiva = personasCuenta[personaSeleccionadaIdx] || {
    prioridad: 1,
    nombre: '',
    contrasena: '',
    cargo: '',
    direccion: '',
    telefono: ''
  }

  // Filtrado de búsqueda en panel derecho
  const resultadosBusqueda = useMemo(() => {
    const q = busquedaUsuario.trim().toUpperCase()
    if (!q) return []
    const results: { cuenta: string; persona: PersonaAutorizada }[] = []
    
    // Buscar en todas las cuentas
    for (const [cta, perList] of Object.entries(mapaAutorizados)) {
      for (const p of perList) {
        const fullTxt = `${cta} ${p.nombre} ${p.cargo} ${p.contrasena} ${p.telefono} ${p.direccion}`.toUpperCase()
        if (fullTxt.includes(q)) {
          results.push({ cuenta: cta, persona: p })
          if (results.length >= 40) return results
        }
      }
    }
    return results
  }, [busquedaUsuario, mapaAutorizados])

  const copiarAlPortapapeles = (texto: string, key: string) => {
    if (!texto) return
    navigator.clipboard.writeText(texto)
    setCopiadoIdx(key)
    setTimeout(() => setCopiadoIdx(null), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-2 backdrop-blur-xs select-none">
      {/* Ventana Estilo Clásico Scorpion */}
      <div 
        className="w-full max-w-4xl bg-[#d4d0c8] text-black border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-xs"
        style={{ fontFamily: "'Arial', 'Tahoma', sans-serif" }}
      >
        {/* Barra de Título Azul Windows / Scorpion */}
        <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center justify-between font-bold shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-sm">🔑</span>
            <span className="tracking-wide text-xs">Scorpion - Personas Autorizadas</span>
          </div>
          <button 
            onClick={onClose}
            className="w-5 h-5 bg-[#d4d0c8] text-black font-bold flex items-center justify-center border border-t-white border-l-white border-b-gray-800 border-r-gray-800 hover:bg-red-600 hover:text-white text-xs leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Título Principal */}
        <div className="p-3 bg-[#ece9d8] border-b border-gray-400">
          <h2 className="text-center text-lg font-black text-[#000080] tracking-widest uppercase drop-shadow-xs">
            PERSONAS AUTORIZADAS
          </h2>

          {/* Selector de Cuenta y Nombre */}
          <div className="mt-2 grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-[#d4d0c8] p-2 border border-gray-400 shadow-inner">
            <div className="md:col-span-4 flex items-center gap-2">
              <label className="font-bold whitespace-nowrap text-[#000080]">CUENTA:</label>
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={cuentaActiva}
                  onChange={(e) => {
                    setCuentaActiva(e.target.value.toUpperCase())
                    setPersonaSeleccionadaIdx(0)
                  }}
                  list="cuentas-autorizadas-list"
                  className="w-full bg-white px-2 py-1 border border-gray-600 font-mono font-bold text-blue-900 focus:outline-none focus:border-blue-700"
                  placeholder="Ej: 0462 o C701"
                />
                <datalist id="cuentas-autorizadas-list">
                  {listaCuentas.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="md:col-span-8 flex items-center gap-2">
              <label className="font-bold whitespace-nowrap text-[#000080]">NOMBRE:</label>
              <input 
                type="text" 
                value={nombreCuenta}
                readOnly
                className="w-full bg-[#f4f4f4] px-2 py-1 border border-gray-600 font-bold text-gray-800 focus:outline-none truncate"
              />
            </div>
          </div>
        </div>

        {/* Cuerpo del Modal: 2 Columnas */}
        <div className="p-3 bg-[#ece9d8] grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* COLUMNA IZQUIERDA: Lista de Personas Autorizadas y Detalle Formulario */}
          <div className="md:col-span-7 flex flex-col gap-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-gray-900 text-xs">
                  Personas Autorizadas: <span className="text-blue-900 font-bold">({personasCuenta.length} registradas)</span>
                </label>
                <span className="text-[10px] text-gray-600">Haz clic en una persona para ver/editar</span>
              </div>
              
              {/* Listbox de personas */}
              <div className="h-44 bg-white border-2 border-gray-600 overflow-y-auto p-1 font-mono text-xs shadow-inner divide-y divide-gray-100">
                {personasCuenta.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 italic text-center p-4">
                    Sin personas autorizadas registradas para la cuenta {cuentaActiva}
                  </div>
                ) : (
                  personasCuenta.map((p, idx) => {
                    const numStr = String(p.prioridad || idx + 1).padStart(2, '0')
                    const isSelected = idx === personaSeleccionadaIdx
                    return (
                      <div 
                        key={idx}
                        onClick={() => setPersonaSeleccionadaIdx(idx)}
                        className={`px-2 py-1 cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected 
                            ? 'bg-[#000080] text-white font-bold' 
                            : 'hover:bg-blue-100 text-gray-900'
                        }`}
                      >
                        <span className="truncate">
                          [{numStr}] {p.nombre || 'SIN NOMBRE'}
                        </span>
                        {p.cargo && (
                          <span className={`text-[10px] uppercase truncate ml-2 max-w-[120px] ${isSelected ? 'text-cyan-200' : 'text-gray-500'}`}>
                            {p.cargo}
                          </span>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Formulario de Detalle de la Persona Seleccionada */}
            <div className="bg-[#d4d0c8] p-2.5 border border-gray-500 rounded-xs flex flex-col gap-2 shadow-xs">
              <div className="grid grid-cols-12 gap-1.5 items-center">
                <label className="col-span-3 text-right font-bold text-gray-800">Nombre:</label>
                <input 
                  type="text" 
                  value={personaActiva.nombre}
                  readOnly
                  className="col-span-9 bg-white px-2 py-1 border border-gray-600 font-bold text-gray-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-12 gap-1.5 items-center">
                <label className="col-span-3 text-right font-bold text-red-900">Contraseña:</label>
                <div className="col-span-9 flex items-center gap-1">
                  <div className="relative flex-1">
                    <input 
                      type={mostrarContrasena ? 'text' : 'password'}
                      value={personaActiva.contrasena}
                      readOnly
                      className="w-full bg-[#ffffcc] px-2 py-1 border border-amber-500 font-mono font-black text-red-900 tracking-wider focus:outline-none"
                      placeholder="Sin clave registrada"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setMostrarContrasena(!mostrarContrasena)}
                    title={mostrarContrasena ? 'Ocultar contraseña' : 'Ver contraseña'}
                    className="px-2 py-1 bg-[#ece9d8] border border-gray-600 font-bold text-gray-700 hover:bg-white cursor-pointer text-[11px]"
                  >
                    {mostrarContrasena ? '👁 Ocultar' : '👁 Ver'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => copiarAlPortapapeles(personaActiva.contrasena, 'pass')}
                    title="Copiar contraseña verbal"
                    className="px-2 py-1 bg-amber-200 border border-amber-600 font-bold text-amber-900 hover:bg-amber-300 cursor-pointer text-[11px]"
                  >
                    {copiadoIdx === 'pass' ? '✓ Copiado' : '📋 Copiar'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-1.5 items-center">
                <label className="col-span-3 text-right font-bold text-gray-800">Cargo/Vínculo:</label>
                <input 
                  type="text" 
                  value={personaActiva.cargo}
                  readOnly
                  className="col-span-9 bg-white px-2 py-1 border border-gray-600 text-gray-900 focus:outline-none"
                  placeholder="Ej: GERENTE / ADMINISTRADOR / CONSERJE"
                />
              </div>

              <div className="grid grid-cols-12 gap-1.5 items-center">
                <label className="col-span-3 text-right font-bold text-gray-800">Dirección:</label>
                <input 
                  type="text" 
                  value={personaActiva.direccion}
                  readOnly
                  className="col-span-9 bg-white px-2 py-1 border border-gray-600 text-gray-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-12 gap-1.5 items-center">
                <label className="col-span-3 text-right font-bold text-blue-900">Teléfono:</label>
                <div className="col-span-9 flex items-center gap-1">
                  <input 
                    type="text" 
                    value={personaActiva.telefono}
                    readOnly
                    className="flex-1 bg-white px-2 py-1 border border-gray-600 font-mono font-bold text-blue-900 focus:outline-none"
                    placeholder="Sin teléfono registrado"
                  />
                  {personaActiva.telefono && (
                    <>
                      <a 
                        href={`tel:${personaActiva.telefono.replace(/[^0-9+]/g, '')}`}
                        className="px-2 py-1 bg-blue-600 text-white font-bold border border-blue-800 hover:bg-blue-700 cursor-pointer text-[11px] flex items-center gap-1"
                      >
                        📞 Llamar
                      </a>
                      <a 
                        href={`https://wa.me/${personaActiva.telefono.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 bg-emerald-600 text-white font-bold border border-emerald-800 hover:bg-emerald-700 cursor-pointer text-[11px] flex items-center gap-1"
                      >
                        💬 WA
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Búsqueda Global de Usuarios */}
          <div className="md:col-span-5 flex flex-col gap-2 bg-[#d4d0c8] p-2.5 border border-gray-500 shadow-inner">
            <div>
              <label className="font-bold text-[#000080] block mb-1 text-xs uppercase tracking-wider">
                Búsqueda de Usuario:
              </label>
              <div className="flex items-center gap-1">
                <label className="font-bold text-gray-800">Nombre:</label>
                <input 
                  type="text" 
                  value={busquedaUsuario}
                  onChange={(e) => setBusquedaUsuario(e.target.value)}
                  placeholder="Escribe para buscar..."
                  className="flex-1 bg-white px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-700"
                />
                {busquedaUsuario && (
                  <button 
                    onClick={() => setBusquedaUsuario('')}
                    className="px-1.5 py-0.5 bg-gray-300 border border-gray-500 hover:bg-gray-400 text-[10px]"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Listbox de resultados de búsqueda */}
            <div className="flex-1 min-h-[260px] bg-white border-2 border-gray-600 overflow-y-auto p-1 font-mono text-xs shadow-inner">
              {busquedaUsuario.trim() === '' ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                  <span className="text-2xl mb-1">🔍</span>
                  <span>Escribe el nombre de cualquier persona autorizada para localizar su cuenta y clave de inmediato.</span>
                </div>
              ) : resultadosBusqueda.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 italic p-4 text-center">
                  No se encontraron personas con el criterio &quot;{busquedaUsuario}&quot;
                </div>
              ) : (
                resultadosBusqueda.map((res, rIdx) => (
                  <div 
                    key={rIdx}
                    onClick={() => {
                      setCuentaActiva(res.cuenta)
                      const targetIdx = (mapaAutorizados[res.cuenta] || []).findIndex(
                        p => p.nombre === res.persona.nombre && p.contrasena === res.persona.contrasena
                      )
                      setPersonaSeleccionadaIdx(targetIdx >= 0 ? targetIdx : 0)
                    }}
                    className="p-1.5 border-b border-gray-200 hover:bg-blue-50 cursor-pointer text-[11px]"
                  >
                    <div className="flex items-center justify-between font-bold text-blue-900">
                      <span>[{res.cuenta}] {res.persona.nombre}</span>
                      {res.persona.contrasena && (
                        <span className="bg-amber-100 text-red-900 px-1 border border-amber-400 text-[10px]">
                          🔑 {res.persona.contrasena}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-600 mt-0.5">
                      <span>{res.persona.cargo || 'Sin cargo'}</span>
                      <span>{res.persona.telefono || 'Sin tel.'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Barra de Botones Inferior estilo Scorpion */}
        <div className="p-2 bg-[#d4d0c8] border-t-2 border-white flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button 
              type="button" 
              onClick={() => alert('Modo edición remota: Para agregar o modificar personas autorizadas en Scorpion, las órdenes se sincronizarán mediante el Worker local.')}
              className="px-3 py-1 bg-[#ece9d8] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 font-bold hover:bg-white active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white cursor-pointer"
            >
              NUEVO
            </button>
            <button 
              type="button" 
              onClick={() => alert('Modo edición remota activado.')}
              className="px-3 py-1 bg-[#ece9d8] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 font-bold hover:bg-white active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white cursor-pointer"
            >
              EDITAR
            </button>
            <button 
              type="button" 
              onClick={() => alert('Datos guardados.')}
              className="px-3 py-1 bg-[#ece9d8] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 font-bold text-gray-400 cursor-not-allowed"
              disabled
            >
              GUARDAR
            </button>
            <button 
              type="button" 
              onClick={() => alert('Opción eliminar.')}
              className="px-3 py-1 bg-[#ece9d8] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 font-bold text-gray-400 cursor-not-allowed"
              disabled
            >
              ELIMINAR
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="px-3 py-1 bg-[#ece9d8] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 font-bold hover:bg-white active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white cursor-pointer"
            >
              CANCELAR
            </button>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-1 bg-[#ece9d8] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 font-black text-[#800000] hover:bg-red-700 hover:text-white active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white cursor-pointer tracking-wider"
          >
            SALIR
          </button>
        </div>
      </div>
    </div>
  )
}
