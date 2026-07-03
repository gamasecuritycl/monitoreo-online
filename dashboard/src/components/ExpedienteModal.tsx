'use client'

import { useEffect, useRef, useState } from 'react'
import type { EventoMonitoreo } from '@/lib/supabase'

// Importamos la base de datos de 464 clientes reales de GENERAL.mdb convertida a JSON
import clientesDataRaw from '@/lib/clientes_general.json'

const clientesGeneral = clientesDataRaw as Record<string, Record<string, string>>

interface ExpedienteModalProps {
  evento: EventoMonitoreo
  onClose: () => void
}

export default function ExpedienteModal({ evento, onClose }: ExpedienteModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  
  // Cuenta activa cargada en el expediente
  const [cuentaActiva, setCuentaActiva] = useState(evento.cuenta.toUpperCase().trim() || 'C745')
  const [buscarCuentaInput, setBuscarCuentaInput] = useState('')
  
  // Control de pestañas independientes del panel original de Scorpion
  const [tabEmergentes, setTabEmergentes] = useState<'telefonos' | 'horarios' | 'camara'>('telefonos')
  const [tabInfo, setTabInfo] = useState<'caracteristicas' | 'referencias' | 'observaciones'>('caracteristicas')
  const [tabInstalacion, setTabInstalacion] = useState<'instalacion' | 'ucontrol' | 'tiempos' | 'teclados' | 'sirenas'>('instalacion')

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  useEffect(() => {
    modalRef.current?.focus()
  }, [])

  // Buscar el registro completo del cliente en la base de datos local JSON
  const cliente = clientesGeneral[cuentaActiva] || {
    cuenta: cuentaActiva,
    nombre: evento.nombre_abonado || 'SIN NOMBRE REGISTRADO',
    ciudad: 'SANTIAGO',
    direccion: 'DIRECCIÓN NO DISPONIBLE',
    sector: 'NO DISPONIBLE'
  }

  // Lista de todos los clientes para el buscador de abajo
  const listaAbonados = Object.values(clientesGeneral).map(c => ({
    cuenta: (c.cuenta || '').toUpperCase().trim(),
    nombre: (c.nombre || '').toUpperCase().trim()
  })).sort((a, b) => a.cuenta.localeCompare(b.cuenta))

  // Filtrar lista de abonados según el input de búsqueda
  const listaFiltrada = buscarCuentaInput.trim()
    ? listaAbonados.filter(a => 
        a.cuenta.toLowerCase().includes(buscarCuentaInput.toLowerCase()) ||
        a.nombre.toLowerCase().includes(buscarCuentaInput.toLowerCase())
      )
    : listaAbonados

  // Extraer teléfonos de emergencia indexados de la base de datos (NOMBRE1, DIRECCION1, T1...)
  const telefonosEmergencia = []
  for (let i = 1; i <= 7; i++) {
    const nom = cliente[`nombre${i}`] || ''
    const dir = cliente[`direccion${i}`] || ''
    const carg = cliente[`carg${i}`] || ''
    const tel = cliente[`t${i}`] || ''
    if (nom || tel) {
      telefonosEmergencia.push({
        num: i,
        nombre: nom,
        direccion: dir,
        cargo: carg,
        telefono: tel
      })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 font-mono overflow-auto p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* 
        VENTANA RETRO PIXEL-PERFECT (Ancho 950px, Alto 690px fijo)
        Esto replica de manera exacta la distribución 3D bevel gris de Windows 95/98
      */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-[950px] h-[690px] bg-[#d4d0c8] text-black border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-1 shadow-[4px_4px_12px_rgba(0,0,0,0.6)] focus:outline-none flex flex-col justify-between shrink-0 select-none"
        style={{ fontSize: '11px' }}
      >
        {/* Barra de Título */}
        <div className="bg-[#000080] text-white font-bold px-2 py-1 flex justify-between items-center select-none shrink-0 h-6">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">📖</span>
            <span className="text-[11px] tracking-wide">Scorpion - Expediente de Usuario</span>
          </div>
          <button 
            onClick={onClose} 
            className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-black border-r-black text-black font-bold flex items-center justify-center active:border-t-black active:border-l-black active:border-b-white active:border-r-white text-[9px] pb-0.5 cursor-pointer"
          >
            r
          </button>
        </div>

        {/* CONTENEDOR DE LA DISTRIBUCIÓN PRINCIPAL (Altura fija para evitar desbordes) */}
        <div className="flex-1 p-1 flex flex-col gap-2.5 overflow-hidden">
          
          {/* FILA 1: INFORMACIÓN BÁSICA + FOTOGRAFÍA (Altura: 160px) */}
          <div className="h-[160px] flex gap-2 shrink-0">
            
            {/* Caja Información Básica */}
            <div className="flex-1 border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white p-2.5 relative pt-4 flex flex-col justify-between">
              <div className="absolute -top-2 left-3 bg-[#d4d0c8] px-1 font-bold text-[10px] uppercase tracking-wider text-gray-700">
                INFORMACION BASICA:
              </div>

              {/* Cuenta y Nombre */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="font-bold">Cuenta:</span>
                  <input 
                    type="text" 
                    readOnly 
                    value={cliente.cuenta || ''} 
                    className="w-[70px] bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-blue-900 focus:outline-none text-[11px]" 
                  />
                </div>
                <div className="flex-1 flex items-center gap-1">
                  <span className="font-bold">Nombre:</span>
                  <input 
                    type="text" 
                    readOnly 
                    value={cliente.nombre || ''} 
                    className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-blue-900 focus:outline-none text-[11px] truncate" 
                  />
                </div>
              </div>

              {/* Ciudad, Plan y Tipo */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-1">
                  <span className="font-bold">Ciudad:</span>
                  <select disabled className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold py-0.5 px-1 text-black text-[11px]">
                    <option>{cliente.ciudad || 'SANTIAGO'}</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold">Plan:</span>
                  <input type="text" readOnly value={cliente.plan || ''} className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-[11px]" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold">Tipo:</span>
                  <input type="text" readOnly value={cliente.tipo1 || ''} className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-[11px]" />
                </div>
              </div>

              {/* Dirección y Sector */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <span className="font-bold">Dirección:</span>
                  <input type="text" readOnly value={cliente.direccion || ''} className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-[11px] truncate" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold">Sector:</span>
                  <input type="text" readOnly value={cliente.sector || ''} className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-[11px] truncate" />
                </div>
              </div>

              {/* Fila de Teléfonos del Cliente */}
              <div className="border border-gray-400 p-1.5 relative mt-1 bg-[#d4d0c8]">
                <div className="absolute -top-2 left-2 bg-[#d4d0c8] px-1 text-[9px] font-bold text-gray-700">
                  TELEFONOS:
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      readOnly
                      value={cliente[`telefono${i + 1}`] || ''}
                      className="w-full bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1 py-0.5 text-center font-bold text-gray-800 text-[10px]"
                      placeholder=""
                    />
                  ))}
                </div>
              </div>

            </div>

            {/* Caja de Fotografía */}
            <div className="w-[220px] border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white p-1 flex flex-col justify-between bg-[#d4d0c8] shrink-0">
              <div className="bg-[#808080] text-white text-center font-bold text-[9px] py-0.5 border border-t-black border-l-black border-b-white border-r-white">
                FOTOGRAFIA
              </div>
              <div className="flex-1 bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white my-1 flex items-center justify-center">
                <span className="text-gray-300 text-3xl">👤</span>
              </div>
              <button disabled className="w-full bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-[9px] py-0.5 font-bold uppercase tracking-wider text-gray-500">
                Insertar / Cambiar Fotografia
              </button>
            </div>

          </div>

          {/* FILA 2: PESTAÑAS MEDIAS (Emergentes a la izq, Características a la derecha) (Altura: 260px) */}
          <div className="h-[260px] flex gap-2 shrink-0">
            
            {/* Lado Izquierdo: Teléfonos Emergentes (Ancho: 530px) */}
            <div className="w-[530px] flex flex-col shrink-0">
              <div className="flex gap-0.5 text-[9px]">
                <button
                  onClick={() => setTabEmergentes('telefonos')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabEmergentes === 'telefonos' ? 'bg-[#d4d0c8] pb-1.5 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  TELEFONOS EMERGENTES
                </button>
                <button
                  onClick={() => setTabEmergentes('horarios')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabEmergentes === 'horarios' ? 'bg-[#d4d0c8] pb-1.5 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  HORARIOS APERTURA Y CIERRE
                </button>
                <button
                  onClick={() => setTabEmergentes('camara')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabEmergentes === 'camara' ? 'bg-[#d4d0c8] pb-1.5 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  CAMARA DE VERIFICACION
                </button>
              </div>
              
              <div className="border-2 border-white bg-[#d4d0c8] p-2 flex-1 flex flex-col justify-start overflow-hidden">
                {tabEmergentes === 'telefonos' && (
                  <div className="border border-gray-400 p-2 relative flex-1 bg-[#d4d0c8] flex flex-col overflow-hidden">
                    <div className="absolute -top-2 left-2 bg-[#d4d0c8] px-1 text-[9px] font-bold text-gray-700">
                      NUMEROS DE EMERGENCIA
                    </div>
                    <div className="flex-1 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white overflow-y-auto">
                      <table className="w-full border-collapse text-[10px] text-left">
                        <thead>
                          <tr className="bg-[#b0b0b0] border-b border-gray-400 font-bold sticky top-0">
                            <th className="p-1 border-r border-gray-400 w-1/4">Nombre</th>
                            <th className="p-1 border-r border-gray-400 w-2/5">Dirección</th>
                            <th className="p-1 border-r border-gray-400 w-1/6">Cargo/Afinidad</th>
                            <th className="p-1">Teléfono</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300">
                          {telefonosEmergencia.map((tel, idx) => (
                            <tr key={idx} className="hover:bg-blue-100 font-bold text-gray-800">
                              <td className="p-1 border-r border-gray-300 truncate max-w-[120px]">{tel.nombre}</td>
                              <td className="p-1 border-r border-gray-300 truncate max-w-[180px]">{tel.direccion}</td>
                              <td className="p-1 border-r border-gray-300 truncate max-w-[80px]">{tel.cargo}</td>
                              <td className="p-1 font-mono text-blue-900">{tel.telefono}</td>
                            </tr>
                          ))}
                          {telefonosEmergencia.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-gray-400 italic">No hay contactos de emergencia</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {tabEmergentes === 'horarios' && (
                  <div className="p-2 text-center text-gray-500 font-bold border border-gray-400 flex-1 flex items-center justify-center bg-white text-[10px]">
                    [Horarios de Apertura/Cierre — Configuración Estándar]
                  </div>
                )}

                {tabEmergentes === 'camara' && (
                  <div className="p-2 text-center text-gray-400 font-bold border border-gray-400 flex-1 flex items-center justify-center bg-black text-[10px]">
                    🎥 MÓDULO DE CÁMARA INACTIVO
                  </div>
                )}
              </div>
            </div>

            {/* Lado Derecho: Características (Ancho: 380px) */}
            <div className="w-[380px] flex flex-col shrink-0">
              <div className="flex gap-0.5 text-[9px]">
                <button
                  onClick={() => setTabInfo('caracteristicas')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInfo === 'caracteristicas' ? 'bg-[#d4d0c8] pb-1.5 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  CARACTERISTICAS
                </button>
                <button
                  onClick={() => setTabInfo('referencias')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInfo === 'referencias' ? 'bg-[#d4d0c8] pb-1.5 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  REFERENCIAS
                </button>
                <button
                  onClick={() => setTabInfo('observaciones')}
                  className={`px-2 py-1 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInfo === 'observaciones' ? 'bg-[#d4d0c8] pb-1.5 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  OBSERVACIONES
                </button>
              </div>

              <div className="border-2 border-white bg-[#d4d0c8] p-2 flex-1 flex flex-col justify-start overflow-hidden">
                <div className="border border-gray-400 p-1.5 relative flex-1 flex flex-col bg-[#d4d0c8]">
                  <div className="absolute -top-2.5 left-2 bg-[#d4d0c8] px-1 text-[9px] font-bold text-gray-700 uppercase">
                    {tabInfo}
                  </div>
                  <textarea
                    readOnly
                    value={
                      tabInfo === 'caracteristicas' ? cliente.caract_adic1 :
                      tabInfo === 'referencias' ? cliente.referencia1 :
                      cliente.observacion1
                    }
                    className="w-full flex-1 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white p-1.5 font-bold font-mono text-[10px] text-gray-800 resize-none focus:outline-none leading-normal h-full overflow-y-auto"
                    placeholder="Vacío"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* FILA 3: INSTALACIÓN + BUSCADOR + ACCIONES (Altura: 210px) */}
          <div className="h-[210px] flex gap-2 shrink-0">
            
            {/* Instalación / U. Control (Ancho: 440px) */}
            <div className="w-[440px] flex flex-col shrink-0">
              <div className="flex gap-0.5 text-[9px]">
                <button
                  onClick={() => setTabInstalacion('instalacion')}
                  className={`px-2 py-0.5 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInstalacion === 'instalacion' ? 'bg-[#d4d0c8] pb-1' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  INSTALACION
                </button>
                <button
                  onClick={() => setTabInstalacion('ucontrol')}
                  className={`px-2 py-0.5 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                    tabInstalacion === 'ucontrol' ? 'bg-[#d4d0c8] pb-1' : 'bg-[#b0b0b0] text-gray-700'
                  }`}
                >
                  U. CONTROL
                </button>
              </div>
              <div className="border border-white bg-[#d4d0c8] p-3 flex-1 flex flex-col justify-center gap-2">
                {tabInstalacion === 'instalacion' && (
                  <div className="space-y-2 text-[10px]">
                    <div className="grid grid-cols-3 items-center gap-1">
                      <span className="font-bold text-right text-gray-700">Fecha de Instalación:</span>
                      <input type="text" readOnly value={cliente.fecha || ''} className="col-span-2 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 font-bold text-gray-800" />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-1">
                      <span className="font-bold text-right text-gray-700">Instalador:</span>
                      <input type="text" readOnly value={cliente.instalador || ''} className="col-span-2 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 font-bold text-gray-800" />
                    </div>
                  </div>
                )}

                {tabInstalacion === 'ucontrol' && (
                  <div className="space-y-2 text-[10px]">
                    <div className="grid grid-cols-3 items-center gap-1">
                      <span className="font-bold text-right text-gray-700">Marca / Modelo:</span>
                      <input type="text" readOnly value={`${cliente.marca || ''} ${cliente.modelo || ''}`} className="col-span-2 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 font-bold text-gray-800" />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-1">
                      <span className="font-bold text-right text-gray-700">Ubicación UC:</span>
                      <input type="text" readOnly value={cliente.ubicacion_uc || ''} className="col-span-2 bg-[#ffffd0] border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-1.5 py-0.5 font-bold text-gray-800 truncate" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BUSCADOR DE USUARIO (Ancho: 360px) */}
            <div className="w-[360px] border border-gray-400 p-2 relative bg-[#d4d0c8] flex flex-col gap-1.5 shrink-0">
              <div className="absolute -top-2 left-2 bg-[#d4d0c8] px-1 text-[9px] font-bold text-gray-700">
                BUSCAR USUARIO
              </div>
              
              <div className="grid grid-cols-4 gap-1 items-center mt-1">
                <span className="font-bold text-gray-700">CUENTA:</span>
                <input
                  type="text"
                  value={buscarCuentaInput}
                  onChange={(e) => setBuscarCuentaInput(e.target.value)}
                  className="col-span-3 bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white font-bold px-1.5 py-0.5 text-black"
                  placeholder="Filtro de búsqueda..."
                />
              </div>

              {/* Lista azul marino (Scroll y altura fija para evitar rotura) */}
              <div className="h-[120px] bg-[#000080] text-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white overflow-y-auto text-[10px]">
                {listaFiltrada.map((item) => (
                  <div
                    key={item.cuenta}
                    onClick={() => {
                      setCuentaActiva(item.cuenta.toUpperCase().trim())
                      setBuscarCuentaInput('')
                    }}
                    className={`px-1.5 py-0.5 cursor-pointer font-mono font-bold select-none ${
                      cuentaActiva === item.cuenta ? 'bg-yellow-500 text-black' : 'hover:bg-blue-900'
                    }`}
                  >
                    {item.cuenta.padEnd(6, ' ')} | {item.nombre}
                  </div>
                ))}
                {listaFiltrada.length === 0 && (
                  <div className="p-2 text-center text-blue-300 italic">No hay coincidencias</div>
                )}
              </div>
            </div>

            {/* BOTONES ACCIONES (Ancho: 110px) */}
            <div className="w-[110px] flex flex-col gap-1 shrink-0 justify-end h-full">
              <button className="w-full h-6 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-gray-800 font-bold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer select-none hover:bg-gray-200">
                EDITAR
              </button>
              <button disabled className="w-full h-6 bg-[#d4d0c8] border border-gray-400 text-gray-400 font-bold select-none">
                GUARDAR
              </button>
              <button className="w-full h-6 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-gray-800 font-bold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer select-none hover:bg-gray-200">
                NUEVO
              </button>
              <button className="w-full h-6 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-gray-800 font-bold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer select-none hover:bg-gray-200">
                ELIMINAR
              </button>
              <button disabled className="w-full h-6 bg-[#d4d0c8] border border-gray-400 text-gray-400 font-bold select-none">
                CANCELAR
              </button>
              <button 
                onClick={onClose}
                className="w-full h-6 bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-gray-800 font-bold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer select-none hover:bg-gray-200"
              >
                SALIR
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
