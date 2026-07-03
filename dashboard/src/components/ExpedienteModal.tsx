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
  
  // Cuenta y cliente activo en el modal (por defecto el del evento recibido)
  const [cuentaActiva, setCuentaActiva] = useState(evento.cuenta.toUpperCase().trim() || 'C745')
  const [buscarCuentaInput, setBuscarCuentaInput] = useState('')
  
  // Pestañas independientes del panel original de Scorpion
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

  // Buscar el registro completo del cliente en la base de datos
  const cliente = clientesGeneral[cuentaActiva] || {
    cuenta: cuentaActiva,
    nombre: evento.nombre_abonado || 'SIN NOMBRE REGISTRADO',
    ciudad: 'SANTIAGO',
    direccion: 'DIRECCIÓN NO DISPONIBLE',
    sector: 'NO DISPONIBLE'
  }

  // Lista de todos los clientes para el buscador de abajo
  const listaAbonados = Object.values(clientesGeneral).map(c => ({
    cuenta: c.cuenta || '',
    nombre: c.nombre || ''
  })).sort((a, b) => a.cuenta.localeCompare(b.cuenta))

  // Filtrar lista de abonados según el input de búsqueda
  const listaFiltrada = buscarCuentaInput.trim()
    ? listaAbonados.filter(a => 
        a.cuenta.toLowerCase().includes(buscarCuentaInput.toLowerCase()) ||
        a.nombre.toLowerCase().includes(buscarCuentaInput.toLowerCase())
      )
    : listaAbonados.slice(0, 100) // Mostrar primeros 100 por rendimiento de renderizado

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 font-mono"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Ventana de Diálogo Estilo Clásico Bevel Windows 95/98 */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-[960px] bg-[#d0d0d0] text-black border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 p-2 shadow-[4px_4px_10px_rgba(0,0,0,0.5)] focus:outline-none flex flex-col gap-2 select-none"
        style={{ fontSize: '11px' }}
      >
        {/* Barra de Título */}
        <div className="bg-[#000080] text-white font-bold px-2 py-1 flex justify-between items-center select-none">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">📖</span>
            <span className="text-xs tracking-wide">Scorpion - Expediente de Usuario</span>
          </div>
          <button 
            onClick={onClose} 
            className="w-5 h-5 bg-[#d0d0d0] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-black font-bold flex items-center justify-center active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white text-[10px] pb-0.5"
          >
            x
          </button>
        </div>

        {/* Sección Superior: Información Básica + Fotografía */}
        <div className="grid grid-cols-3 gap-2">
          
          {/* INFORMACION BASICA (Ocupa 2 de las 3 columnas) */}
          <div className="col-span-2 border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 p-2 flex flex-col gap-2 relative">
            <div className="absolute -top-2 left-3 bg-[#d0d0d0] px-1 font-bold text-[10px]">
              INFORMACION BASICA:
            </div>
            
            {/* Cuenta y Nombre */}
            <div className="grid grid-cols-12 gap-2 items-center mt-1">
              <div className="col-span-3 flex items-center gap-1">
                <span>Cuenta:</span>
                <input 
                  type="text" 
                  readOnly 
                  value={cliente.cuenta || ''} 
                  className="w-full bg-[#ffffe0] border border-gray-400 font-bold px-1 py-0.5 text-blue-900 focus:outline-none" 
                />
              </div>
              <div className="col-span-9 flex items-center gap-1">
                <span>Nombre:</span>
                <input 
                  type="text" 
                  readOnly 
                  value={cliente.nombre || ''} 
                  className="w-full bg-[#ffffe0] border border-gray-400 font-bold px-1 py-0.5 text-blue-900 focus:outline-none truncate" 
                />
              </div>
            </div>

            {/* Ciudad, Plan y Tipo */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-1">
                <span>Ciudad:</span>
                <select disabled className="w-full bg-[#ffffe0] border border-gray-400 font-bold py-0.5 px-0.5 text-black">
                  <option>{cliente.ciudad || 'SANTIAGO'}</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span>Plan:</span>
                <input type="text" readOnly value={cliente.plan || ''} className="w-full bg-[#ffffe0] border border-gray-400 font-bold px-1 py-0.5" />
              </div>
              <div className="flex items-center gap-1">
                <span>Tipo:</span>
                <input type="text" readOnly value={cliente.tipo1 || ''} className="w-full bg-[#ffffe0] border border-gray-400 font-bold px-1 py-0.5" />
              </div>
            </div>

            {/* Dirección y Sector */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1">
                <span>Dirección:</span>
                <input type="text" readOnly value={cliente.direccion || ''} className="w-full bg-[#ffffe0] border border-gray-400 font-bold px-1 py-0.5 truncate" />
              </div>
              <div className="flex items-center gap-1">
                <span>Sector:</span>
                <input type="text" readOnly value={cliente.sector || ''} className="w-full bg-[#ffffe0] border border-gray-400 font-bold px-1 py-0.5 truncate" />
              </div>
            </div>

            {/* TELEFONOS */}
            <div className="border border-gray-400 p-1.5 relative mt-1">
              <div className="absolute -top-2.5 left-2 bg-[#d0d0d0] px-1 text-[9px] font-bold text-gray-700">
                TELEFONOS:
              </div>
              <div className="grid grid-cols-6 gap-1 mt-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    readOnly
                    value={cliente[`telefono${i + 1}`] || ''}
                    className="w-full bg-[#ffffe0] border border-gray-400 px-1 py-0.5 text-center font-bold text-gray-800"
                    placeholder="---"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* FOTOGRAFIA (Columna de la derecha) */}
          <div className="border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 p-1 flex flex-col justify-between bg-[#e0e0e0] h-full min-h-[140px]">
            <div className="bg-[#b0b0b0] text-center font-bold text-[9px] py-0.5 border border-gray-500">
              FOTOGRAFIA
            </div>
            {/* Espacio para imagen vacía gris */}
            <div className="flex-1 bg-white border border-gray-400 my-1 flex items-center justify-center">
              <span className="text-gray-300 text-3xl">👤</span>
            </div>
            <button disabled className="w-full bg-[#d0d0d0] border border-t-white border-l-white border-b-gray-500 border-r-gray-500 text-[9px] py-0.5 font-bold uppercase tracking-wider text-gray-500">
              Insertar / Cambiar Fotografia
            </button>
          </div>

        </div>

        {/* Sección Media: Pestañas de Emergencia e Información Adicional */}
        <div className="grid grid-cols-12 gap-2">
          
          {/* Pestañas de Emergencia (Ocupa 7 de 12 columnas) */}
          <div className="col-span-7 flex flex-col">
            {/* Headers de Pestañas */}
            <div className="flex gap-0.5 text-[10px]">
              <button
                onClick={() => setTabEmergentes('telefonos')}
                className={`px-3 py-1 font-bold border-t-2 border-l-2 border-r-2 border-white rounded-t-sm cursor-pointer ${
                  tabEmergentes === 'telefonos' ? 'bg-[#d0d0d0] pb-1.5 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                }`}
              >
                TELEFONOS EMERGENTES
              </button>
              <button
                onClick={() => setTabEmergentes('horarios')}
                className={`px-3 py-1 font-bold border-t-2 border-l-2 border-r-2 border-white rounded-t-sm cursor-pointer ${
                  tabEmergentes === 'horarios' ? 'bg-[#d0d0d0] pb-1.5 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                }`}
              >
                HORARIOS APERTURA Y CIERRE
              </button>
              <button
                onClick={() => setTabEmergentes('camara')}
                className={`px-3 py-1 font-bold border-t-2 border-l-2 border-r-2 border-white rounded-t-sm cursor-pointer ${
                  tabEmergentes === 'camara' ? 'bg-[#d0d0d0] pb-1.5 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                }`}
              >
                CAMARA DE VERIFICACION
              </button>
            </div>
            {/* Contenido Pestaña Emergencia */}
            <div className="border-2 border-white bg-[#d0d0d0] p-2 flex-1 min-h-[160px] flex flex-col justify-start">
              
              {tabEmergentes === 'telefonos' && (
                <div className="border border-gray-400 p-1.5 relative w-full flex-1 bg-[#d0d0d0]">
                  <div className="absolute -top-2.5 left-2 bg-[#d0d0d0] px-1 text-[9px] font-bold text-gray-700">
                    NUMEROS DE EMERGENCIA
                  </div>
                  <div className="overflow-x-auto w-full h-[120px] bg-white border border-gray-500">
                    <table className="w-full border-collapse text-[10px] text-left">
                      <thead>
                        <tr className="bg-[#b0b0b0] border-b border-gray-400">
                          <th className="p-1 font-bold border-r border-gray-400 w-1/4">Nombre</th>
                          <th className="p-1 font-bold border-r border-gray-400 w-1/3">Dirección</th>
                          <th className="p-1 font-bold border-r border-gray-400 w-1/5">Cargo/Afinidad</th>
                          <th className="p-1 font-bold">Teléfono</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-300">
                        {telefonosEmergencia.map((tel, idx) => (
                          <tr key={idx} className="hover:bg-blue-100 font-bold">
                            <td className="p-1 border-r border-gray-300 truncate max-w-[80px]">{tel.nombre}</td>
                            <td className="p-1 border-r border-gray-300 truncate max-w-[120px]">{tel.direccion}</td>
                            <td className="p-1 border-r border-gray-300 truncate max-w-[60px]">{tel.cargo}</td>
                            <td className="p-1 font-mono text-blue-900">{tel.telefono}</td>
                          </tr>
                        ))}
                        {telefonosEmergencia.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-gray-400 italic">No hay contactos de emergencia registrados</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tabEmergentes === 'horarios' && (
                <div className="p-2 text-center text-gray-500 font-bold border border-gray-400 flex-1 flex items-center justify-center bg-white">
                  [Horarios de Apertura/Cierre — Sin configuración especial]
                </div>
              )}

              {tabEmergentes === 'camara' && (
                <div className="p-2 text-center text-gray-500 font-bold border border-gray-400 flex-1 flex items-center justify-center bg-black text-green-400">
                  🎥 CÁMARA DE VERIFICACIÓN NO CONECTADA
                </div>
              )}

            </div>
          </div>

          {/* Pestañas de Información Adicional (Ocupa 5 de 12 columnas) */}
          <div className="col-span-5 flex flex-col">
            {/* Headers de Pestañas */}
            <div className="flex gap-0.5 text-[10px]">
              <button
                onClick={() => setTabInfo('caracteristicas')}
                className={`px-3 py-1 font-bold border-t-2 border-l-2 border-r-2 border-white rounded-t-sm cursor-pointer ${
                  tabInfo === 'caracteristicas' ? 'bg-[#d0d0d0] pb-1.5 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                }`}
              >
                CARACTERISTICAS
              </button>
              <button
                onClick={() => setTabInfo('referencias')}
                className={`px-3 py-1 font-bold border-t-2 border-l-2 border-r-2 border-white rounded-t-sm cursor-pointer ${
                  tabInfo === 'referencias' ? 'bg-[#d0d0d0] pb-1.5 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                }`}
              >
                REFERENCIAS
              </button>
              <button
                onClick={() => setTabInfo('observaciones')}
                className={`px-3 py-1 font-bold border-t-2 border-l-2 border-r-2 border-white rounded-t-sm cursor-pointer ${
                  tabInfo === 'observaciones' ? 'bg-[#d0d0d0] pb-1.5 -mb-0.5 z-10' : 'bg-[#b0b0b0] text-gray-700'
                }`}
              >
                OBSERVACIONES
              </button>
            </div>
            {/* Contenido Pestaña */}
            <div className="border-2 border-white bg-[#d0d0d0] p-2 flex-1 min-h-[160px] flex flex-col justify-start">
              
              {tabInfo === 'caracteristicas' && (
                <div className="border border-gray-400 p-1 relative flex-1 flex flex-col bg-[#d0d0d0]">
                  <div className="absolute -top-2.5 left-2 bg-[#d0d0d0] px-1 text-[9px] font-bold text-gray-700">
                    CARACTERISTICAS
                  </div>
                  <textarea
                    readOnly
                    value={cliente.caract_adic1 || ''}
                    className="w-full flex-1 bg-[#ffffe0] border border-gray-500 p-1.5 font-bold font-mono text-[10px] text-gray-800 resize-none focus:outline-none"
                    placeholder="Sin características asignadas..."
                  />
                </div>
              )}

              {tabInfo === 'referencias' && (
                <div className="border border-gray-400 p-1 relative flex-1 flex flex-col bg-[#d0d0d0]">
                  <div className="absolute -top-2.5 left-2 bg-[#d0d0d0] px-1 text-[9px] font-bold text-gray-700">
                    REFERENCIAS
                  </div>
                  <textarea
                    readOnly
                    value={cliente.referencia1 || ''}
                    className="w-full flex-1 bg-[#ffffe0] border border-gray-500 p-1.5 font-bold font-mono text-[10px] text-gray-800 resize-none focus:outline-none"
                    placeholder="Sin referencias de ubicación..."
                  />
                </div>
              )}

              {tabInfo === 'observaciones' && (
                <div className="border border-gray-400 p-1 relative flex-1 flex flex-col bg-[#d0d0d0]">
                  <div className="absolute -top-2.5 left-2 bg-[#d0d0d0] px-1 text-[9px] font-bold text-gray-700">
                    OBSERVACIONES
                  </div>
                  <textarea
                    readOnly
                    value={cliente.observacion1 || ''}
                    className="w-full flex-1 bg-[#ffffe0] border border-gray-500 p-1.5 font-bold font-mono text-[10px] text-gray-800 resize-none focus:outline-none"
                    placeholder="Sin observaciones generales..."
                  />
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Sección Inferior: Instalación + Buscador + Botones Acciones */}
        <div className="grid grid-cols-12 gap-2 mt-1">
          
          {/* Instalación / U. Control (Ocupa 5 de 12) */}
          <div className="col-span-5 flex flex-col">
            <div className="flex gap-0.5 text-[9px]">
              <button
                onClick={() => setTabInstalacion('instalacion')}
                className={`px-2 py-0.5 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                  tabInstalacion === 'instalacion' ? 'bg-[#d0d0d0] pb-1' : 'bg-[#b0b0b0] text-gray-700'
                }`}
              >
                INSTALACION
              </button>
              <button
                onClick={() => setTabInstalacion('ucontrol')}
                className={`px-2 py-0.5 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                  tabInstalacion === 'ucontrol' ? 'bg-[#d0d0d0] pb-1' : 'bg-[#b0b0b0] text-gray-700'
                }`}
              >
                U. CONTROL
              </button>
              <button
                onClick={() => setTabInstalacion('tiempos')}
                className={`px-2 py-0.5 font-bold border-t border-l border-r border-white rounded-t-sm cursor-pointer ${
                  tabInstalacion === 'tiempos' ? 'bg-[#d0d0d0] pb-1' : 'bg-[#b0b0b0] text-gray-700'
                }`}
              >
                TIEMPOS
              </button>
            </div>
            <div className="border border-white bg-[#d0d0d0] p-2 flex-1 min-h-[90px] flex flex-col justify-center gap-1.5">
              
              {tabInstalacion === 'instalacion' && (
                <div className="space-y-1.5 text-[10px]">
                  <div className="grid grid-cols-3 items-center gap-1">
                    <span className="text-right">Fecha de Instalación:</span>
                    <input type="text" readOnly value={cliente.fecha || ''} className="col-span-2 bg-[#ffffe0] border border-gray-400 px-1 py-0.5 font-bold" />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-1">
                    <span className="text-right">Instalador:</span>
                    <input type="text" readOnly value={cliente.instalador || ''} className="col-span-2 bg-[#ffffe0] border border-gray-400 px-1 py-0.5 font-bold" />
                  </div>
                </div>
              )}

              {tabInstalacion === 'ucontrol' && (
                <div className="space-y-1.5 text-[10px]">
                  <div className="grid grid-cols-3 items-center gap-1">
                    <span className="text-right">Marca/Modelo:</span>
                    <input type="text" readOnly value={`${cliente.marca || ''} ${cliente.modelo || ''}`} className="col-span-2 bg-[#ffffe0] border border-gray-400 px-1 py-0.5 font-bold" />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-1">
                    <span className="text-right">Ubicación UC:</span>
                    <input type="text" readOnly value={cliente.ubicacion_uc || ''} className="col-span-2 bg-[#ffffe0] border border-gray-400 px-1 py-0.5 font-bold truncate" />
                  </div>
                </div>
              )}

              {tabInstalacion === 'tiempos' && (
                <div className="p-2 text-center text-gray-400 italic text-[10px]">Tiempos de Test automáticos estándar.</div>
              )}

            </div>
          </div>

          {/* BUSCADOR DE USUARIOS (Ocupa 5 de 12) */}
          <div className="col-span-5 border border-gray-400 p-1.5 relative bg-[#d0d0d0] flex flex-col gap-1">
            <div className="absolute -top-2.5 left-2 bg-[#d0d0d0] px-1 text-[9px] font-bold text-gray-700">
              BUSCAR USUARIO
            </div>
            
            <div className="grid grid-cols-4 gap-1 items-center mt-1">
              <span className="font-bold">CUENTA:</span>
              <input
                type="text"
                value={buscarCuentaInput}
                onChange={(e) => setBuscarCuentaInput(e.target.value)}
                className="col-span-3 bg-white border border-gray-500 font-bold px-1"
                placeholder="Filtro (C745 / Nombre)..."
              />
            </div>
            
            {/* Lista desplegable en azul marino con scroll */}
            <div className="flex-1 bg-[#000080] text-white border border-gray-500 overflow-y-auto h-[70px] text-[10px]">
              {listaFiltrada.map((item) => (
                <div
                  key={item.cuenta}
                  onClick={() => {
                    setCuentaActiva(item.cuenta.toUpperCase().trim())
                    setBuscarCuentaInput('')
                  }}
                  className={`px-1 py-0.5 cursor-pointer font-mono font-bold select-none ${
                    cuentaActiva === item.cuenta ? 'bg-yellow-500 text-black' : 'hover:bg-blue-900'
                  }`}
                >
                  {item.cuenta.padEnd(6, ' ')} | {item.nombre}
                </div>
              ))}
              {listaFiltrada.length === 0 && (
                <div className="p-2 text-center text-blue-300 italic">No se encontraron coincidencias</div>
              )}
            </div>
          </div>

          {/* BOTONES ACCIONES (Ocupa 2 de 12) */}
          <div className="col-span-2 flex flex-col gap-0.5 justify-end">
            <button className="w-full bg-[#d0d0d0] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 py-0.5 font-bold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer select-none hover:bg-gray-200">
              EDITAR
            </button>
            <button disabled className="w-full bg-[#d0d0d0] border border-gray-400 py-0.5 font-bold text-gray-500 select-none">
              GUARDAR
            </button>
            <button className="w-full bg-[#d0d0d0] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 py-0.5 font-bold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer select-none hover:bg-gray-200">
              NUEVO
            </button>
            <button className="w-full bg-[#d0d0d0] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 py-0.5 font-bold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer select-none hover:bg-gray-200">
              ELIMINAR
            </button>
            <button disabled className="w-full bg-[#d0d0d0] border border-gray-400 py-0.5 font-bold text-gray-500 select-none">
              CANCELAR
            </button>
            <button 
              onClick={onClose}
              className="w-full bg-[#d0d0d0] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 py-0.5 font-bold active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white cursor-pointer select-none hover:bg-gray-200"
            >
              SALIR
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
