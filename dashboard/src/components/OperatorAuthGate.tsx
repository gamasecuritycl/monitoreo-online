'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import operadoresFallback from '@/lib/operadores.json'
import {
  Operator,
  UserRole,
  UserAttributes,
  DEFAULT_ATTRIBUTES_BY_ROLE,
  ATRIBUTOS_DESCRIPCION,
  ensureUserAttributes,
  OPERADORES_PREDETERMINADOS,
} from '@/types/operator'

export type { Operator } from '@/types/operator'
export { OPERADORES_PREDETERMINADOS } from '@/types/operator'

interface OperatorAuthGateProps {
  children: React.ReactNode
}

export default function OperatorAuthGate({ children }: OperatorAuthGateProps) {
  const [operatorList, setOperatorList] = useState<Operator[]>(OPERADORES_PREDETERMINADOS)
  const [operator, setOperator] = useState<Operator | null>(null)
  const [checking, setChecking] = useState(true)

  // Formulario de Inicio de Sesión
  const [selectedCod, setSelectedCod] = useState('01')
  const [claveInput, setClaveInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Estado del Modal de Gestión de Usuarios y Permisos
  const [mostrarModalGestion, setMostrarModalGestion] = useState(false)
  const [editandoCod, setEditandoCod] = useState<string | null>(null)
  const [formCodigo, setFormCodigo] = useState('')
  const [formNombre, setFormNombre] = useState('')
  const [formRol, setFormRol] = useState<UserRole>('Operadora')
  const [formClave, setFormClave] = useState('')
  const [formAtributos, setFormAtributos] = useState<UserAttributes>(DEFAULT_ATTRIBUTES_BY_ROLE.Operadora)
  const [gestionError, setGestionError] = useState('')
  const [gestionExito, setGestionExito] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Cargar lista de operadores desde Supabase, localStorage o archivo local
  useEffect(() => {
    async function cargarOperadores() {
      try {
        // 1. Intentar cargar desde Supabase fila 'OPERADORES'
        const { data } = await supabase
          .from('eventos_monitoreo')
          .select('nombre_abonado')
          .eq('cuenta', 'OPERADORES')
          .order('id', { ascending: false })
          .limit(1)

        if (data && data.length > 0 && data[0].nombre_abonado) {
          try {
            const parsed = JSON.parse(data[0].nombre_abonado)
            if (Array.isArray(parsed) && parsed.length > 0) {
              const san = parsed.map((op: any) => ({
                ...op,
                atributos: ensureUserAttributes(op),
              }))
              setOperatorList(san)
              localStorage.setItem('gama_operadores_list', JSON.stringify(san))
              setChecking(false)
              return
            }
          } catch {}
        }
      } catch (err) {
        console.warn('Fallo de red Supabase operadores, usando local.')
      }

      // 2. Fallback a localStorage
      try {
        const savedList = localStorage.getItem('gama_operadores_list')
        if (savedList) {
          const parsed = JSON.parse(savedList)
          if (Array.isArray(parsed) && parsed.length > 0 && parsed.some((p: any) => p.nombre === 'Nancy Delgadillo' || p.nombre === 'admin')) {
            const san = parsed.map((op: any) => ({
              ...op,
              atributos: ensureUserAttributes(op),
            }))
            setOperatorList(san)
            setChecking(false)
            return
          }
        }
      } catch {}

      // 3. Fallback a archivo operadores.json / OPERADORES_PREDETERMINADOS
      setOperatorList(OPERADORES_PREDETERMINADOS)
      localStorage.setItem('gama_operadores_list', JSON.stringify(OPERADORES_PREDETERMINADOS))
      setChecking(false)
    }

    cargarOperadores()

    // Recuperar sesión activa
    try {
      const savedAuth = sessionStorage.getItem('gama_operator_auth') || localStorage.getItem('gama_operator_auth')
      if (savedAuth) {
        const parsedAuth = JSON.parse(savedAuth)
        if (parsedAuth && parsedAuth.codigo) {
          setOperator({
            ...parsedAuth,
            atributos: ensureUserAttributes(parsedAuth),
          })
        }
      }
    } catch {}
  }, [])

  // Guardar lista en localStorage y Supabase
  const guardarLista = async (nuevaLista: Operator[]) => {
    setOperatorList(nuevaLista)
    localStorage.setItem('gama_operadores_list', JSON.stringify(nuevaLista))

    try {
      await supabase.from('eventos_monitoreo').insert({
        cuenta: 'OPERADORES',
        evento: 'CONFIGURACION_OPERADORES',
        nombre_abonado: JSON.stringify(nuevaLista),
        fecha_hora: new Date().toISOString(),
        zona: 'SYS',
        usuario: operator?.codigo || '01'
      })
    } catch (e) {
      console.error('Error sincronizando operadores en Supabase:', e)
    }

    // Si editamos el operador activo actualmente, actualizar sesión activa
    if (operator) {
      const actual = nuevaLista.find(o => o.codigo === operator.codigo)
      if (actual) {
        const actualizado = { ...actual, atributos: ensureUserAttributes(actual) }
        setOperator(actualizado)
        sessionStorage.setItem('gama_operator_auth', JSON.stringify(actualizado))
        localStorage.setItem('gama_operator_auth', JSON.stringify(actualizado))
      }
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const op = operatorList.find(o => o.codigo === selectedCod)
    if (!op) {
      setErrorMsg('Operador no encontrado.')
      return
    }

    const claveIngresada = claveInput.trim()
    const claveEsperada = op.clave.trim()

    if (claveIngresada !== claveEsperada) {
      setErrorMsg('Contraseña de seguridad incorrecta. Verifique mayúsculas, minúsculas y caracteres.')
      return
    }

    const opConAtributos: Operator = {
      ...op,
      atributos: ensureUserAttributes(op),
    }

    sessionStorage.setItem('gama_operator_auth', JSON.stringify(opConAtributos))
    localStorage.setItem('gama_operator_auth', JSON.stringify(opConAtributos))
    setOperator(opConAtributos)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('gama_operator_auth')
    localStorage.removeItem('gama_operator_auth')
    setOperator(null)
    setClaveInput('')
    setMostrarModalGestion(false)
  }

  // Cambio de rol -> carga preset de atributos de ese rol (modificable individualmente)
  const handleRolChange = (nuevoRol: UserRole) => {
    setFormRol(nuevoRol)
    setFormAtributos(DEFAULT_ATTRIBUTES_BY_ROLE[nuevoRol] || DEFAULT_ATTRIBUTES_BY_ROLE.Operador)
  }

  // Toggle atributo individual
  const toggleAtributo = (key: keyof UserAttributes) => {
    setFormAtributos(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // Guardar o Editar Operador
  const handleGuardarOperador = (e: React.FormEvent) => {
    e.preventDefault()
    setGestionError('')
    setGestionExito('')

    const codClean = formCodigo.trim().padStart(2, '0')
    const nomClean = formNombre.trim()
    const claClean = formClave.trim()

    if (!codClean || !nomClean || !claClean) {
      setGestionError('Todos los campos son obligatorios.')
      return
    }

    const existenteIdx = operatorList.findIndex(o => o.codigo === codClean)

    if (editandoCod) {
      // Modo Edición
      const nuevaLista = operatorList.map(o => {
        if (o.codigo === editandoCod) {
          return {
            ...o,
            codigo: codClean,
            nombre: nomClean,
            rol: formRol,
            clave: claClean,
            atributos: formAtributos,
          }
        }
        return o
      })
      guardarLista(nuevaLista)
      setGestionExito(`Operador ${codClean} (${nomClean}) actualizado correctamente.`)
      limpiarFormularioGestion()
    } else {
      // Modo Creación
      if (existenteIdx >= 0) {
        setGestionError(`Ya existe un operador con el código ${codClean}.`)
        return
      }

      const nuevoOp: Operator = {
        codigo: codClean,
        nombre: nomClean,
        rol: formRol,
        clave: claClean,
        atributos: formAtributos,
      }

      const nuevaLista = [...operatorList, nuevoOp]
      guardarLista(nuevaLista)
      setGestionExito(`Operador ${codClean} (${nomClean}) creado correctamente.`)
      limpiarFormularioGestion()
    }
  }

  const handleEditarClick = (op: Operator) => {
    setEditandoCod(op.codigo)
    setFormCodigo(op.codigo)
    setFormNombre(op.nombre)
    setFormRol(op.rol)
    setFormClave(op.clave)
    setFormAtributos(ensureUserAttributes(op))
    setGestionError('')
    setGestionExito('')
  }

  const handleEliminarClick = (cod: string) => {
    if (operatorList.length <= 1) {
      setGestionError('Debe existir al menos un usuario registrado en el sistema.')
      return
    }
    if (confirm(`¿Estás seguro de eliminar el usuario con código ${cod}?`)) {
      const nuevaLista = operatorList.filter(o => o.codigo !== cod)
      guardarLista(nuevaLista)
      setGestionExito(`Usuario ${cod} eliminado con éxito.`)
      if (editandoCod === cod) limpiarFormularioGestion()
    }
  }

  const limpiarFormularioGestion = () => {
    setEditandoCod(null)
    setFormCodigo('')
    setFormNombre('')
    setFormRol('Operador')
    setFormClave('')
    setFormAtributos(DEFAULT_ATTRIBUTES_BY_ROLE.Operador)
  }

  const filteredOperators = operatorList.filter(op => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      op.codigo.toLowerCase().includes(q) ||
      op.nombre.toLowerCase().includes(q) ||
      op.rol.toLowerCase().includes(q) ||
      op.clave.toLowerCase().includes(q)
    )
  })

  if (checking) {
    return (
      <div className="min-h-screen bg-[#004080] flex items-center justify-center text-white font-sans">
        <div className="bg-[#d4d0c8] text-black border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-4 shadow-2xl flex items-center gap-3">
          <span className="w-4 h-4 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold font-mono">Verificando credenciales y permisos de usuario...</span>
        </div>
      </div>
    )
  }

  if (!operator) {
    return (
      <div className="min-h-screen bg-[#004e92] bg-gradient-to-br from-[#003366] via-[#004080] to-[#001f3f] text-black flex items-center justify-center p-3 font-sans select-none">
        
        {/* Ventana de Login Estilo Clásico Scorpion Windows 95 */}
        <div className="w-full max-w-md bg-[#d4d0c8] text-black border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-1 shadow-[8px_8px_24px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden">
          
          {/* Barra de Título */}
          <div className="bg-[#000080] text-white font-bold px-2 py-1 flex items-center justify-between h-6 select-none shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🔒</span>
              <span className="text-[11px] tracking-wide font-mono uppercase font-bold">
                Scorpion - Control de Acceso y Operadores
              </span>
            </div>
            <div className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-black border-r-black text-black font-bold flex items-center justify-center text-[10px] pb-0.5">
              ✕
            </div>
          </div>

          {/* Cuerpo */}
          <div className="p-4 space-y-4 bg-[#d4d0c8]">
            
            {/* Cabecera / Banner */}
            <div className="bg-[#e0e0e0] border border-gray-400 p-3 flex items-center gap-3 shadow-inner">
              <div className="w-12 h-12 bg-[#000080] text-white font-black text-xl flex items-center justify-center rounded border border-gray-600 shrink-0 shadow">
                G
              </div>
              <div>
                <h1 className="text-xs font-black text-[#000080] tracking-wide uppercase">
                  CENTRAL OPERATIVA GAMA SECURITY
                </h1>
                <p className="text-[10px] text-gray-700 font-bold mt-0.5">
                  Autenticación de Operadores • Monitoreo 24/7
                </p>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleLogin} className="space-y-3">
              
              {/* Selección de Usuario */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-800 uppercase block">
                  Seleccionar Operador / Responsable:
                </label>
                <select
                  value={selectedCod}
                  onChange={(e) => setSelectedCod(e.target.value)}
                  className="w-full bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-2 py-1.5 text-xs text-black font-bold focus:outline-blue-700"
                >
                  {operatorList.map(op => (
                    <option key={op.codigo} value={op.codigo}>
                      [{op.codigo}] — {op.nombre} ({op.rol})
                    </option>
                  ))}
                </select>
              </div>

              {/* Input Contraseña */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-800 uppercase block">
                  Contraseña de Seguridad:
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={claveInput}
                    onChange={(e) => setClaveInput(e.target.value)}
                    placeholder="Ingrese su contraseña..."
                    required
                    autoFocus
                    className="w-full bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-2 py-1.5 text-xs text-black font-bold focus:outline-blue-700 font-mono tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-1 px-2 py-0.5 bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-[9px] font-bold text-gray-800 hover:bg-white active:border-t-gray-700 cursor-pointer"
                  >
                    {showPass ? 'OCULTAR' : 'VER'}
                  </button>
                </div>
              </div>

              {/* Mensaje de Error */}
              {errorMsg && (
                <div className="p-2 bg-red-100 border border-red-500 text-red-900 text-[11px] font-bold flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Botón Ingreso */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#000080] text-white border-2 border-t-blue-400 border-l-blue-400 border-b-black border-r-black font-black text-xs py-2 uppercase hover:bg-blue-900 active:translate-y-0.5 shadow flex items-center justify-center gap-2 cursor-pointer tracking-wider"
                >
                  <span>🔑</span>
                  <span>INGRESAR AL SISTEMA</span>
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="border-t border-gray-400 pt-2 text-center text-[9px] font-bold text-gray-600">
              Acceso restringido y auditado. Cada acción queda firmada en la Bitácora Central.
            </div>

          </div>
        </div>
      </div>
    )
  }

  const handleResetClave = (op: Operator) => {
    const nuevaClave = prompt(`Ingrese la nueva contraseña de seguridad para ${op.nombre} [Código ${op.codigo}]:`, '')
    if (nuevaClave && nuevaClave.trim().length >= 4) {
      const claClean = nuevaClave.trim()
      const nuevaLista = operatorList.map(o => o.codigo === op.codigo ? { ...o, clave: claClean } : o)
      guardarLista(nuevaLista)
      setGestionExito(`Contraseña de ${op.nombre} actualizada correctamente.`)
    }
  }

  const activeAttrs = ensureUserAttributes(operator)
  const canManageUsers = activeAttrs.verConfiguracion || operator.rol === 'Administrador'

  return (
    <div className="relative">
      
      {/* Barra Superior con Estado del Usuario e Indicador de Rol */}
      <div className="bg-[#000080] text-white border-b-2 border-gray-800 px-3 py-1.5 flex items-center justify-between text-xs font-sans select-none sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <span className="font-black tracking-wide text-xs">CENTRAL OPERATIVA GAMA</span>
          <span className="text-blue-300 opacity-60">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-100 font-bold">
              Operador: <strong>{operator.nombre}</strong>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/20 text-yellow-300 border border-white/30">
              {operator.rol}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón de Gestión de Claves y Módulos (disponible si verConfiguracion es true o es Admin) */}
          {canManageUsers && (
            <button
              onClick={() => setMostrarModalGestion(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 text-black text-xs font-bold hover:bg-white active:border-t-gray-800 cursor-pointer shadow-xs"
            >
              ⚙️ Gestión de Operadores & Claves
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 text-red-900 text-xs font-bold hover:bg-red-700 hover:text-white active:border-t-gray-800 cursor-pointer shadow-xs"
          >
            🔒 Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Modal de Gestión de Usuarios y Claves (Scorpion Windows 95 Clásico) */}
      {mostrarModalGestion && (
        <div className="fixed inset-0 z-50 bg-black/60 font-sans p-2 select-none overflow-y-auto flex items-center justify-center animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-[#d4d0c8] text-black border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-1 shadow-[4px_4px_12px_rgba(0,0,0,0.6)] flex flex-col justify-between max-h-[92vh]">
            
            {/* Barra de Título */}
            <div className="bg-[#000080] text-white font-bold px-2 py-1 flex justify-between items-center select-none shrink-0 h-6">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">⚙️</span>
                <span className="text-[11px] tracking-wide font-mono uppercase font-bold">
                  Scorpion - Gestión de Operadores, Permisos y Claves de Seguridad
                </span>
              </div>
              <button
                onClick={() => setMostrarModalGestion(false)}
                className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-black border-r-black text-black font-bold flex items-center justify-center text-[10px] pb-0.5 cursor-pointer hover:bg-red-600 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-3 overflow-y-auto space-y-3 flex-1 text-left bg-[#d4d0c8]">
              
              {/* Formulario Crear / Editar */}
              <form onSubmit={handleGuardarOperador} className="bg-[#d4d0c8] border border-gray-400 p-3 space-y-3 relative shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-400 pb-1.5">
                  <h4 className="text-[11px] font-bold text-[#000080] uppercase tracking-wider flex items-center gap-1.5">
                    <span>{editandoCod ? '✏️' : '➕'}</span>
                    <span>{editandoCod ? `Editar Configuración del Operador [Código ${editandoCod}]` : 'Registrar Nuevo Operador en el Sistema'}</span>
                  </h4>
                  {editandoCod && (
                    <button
                      type="button"
                      onClick={limpiarFormularioGestion}
                      className="text-xs text-blue-900 font-bold hover:underline cursor-pointer"
                    >
                      Cancelar Edición
                    </button>
                  )}
                </div>

                {/* Campos Principales */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-800 uppercase mb-0.5">
                      Código ID:
                    </label>
                    <input
                      type="text"
                      placeholder="07"
                      value={formCodigo}
                      onChange={(e) => setFormCodigo(e.target.value)}
                      disabled={!!editandoCod}
                      required
                      className="w-full bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-2 py-1 text-xs text-black font-mono font-bold focus:outline-blue-700"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-800 uppercase mb-0.5">
                      Nombre Completo del Operador:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Claudia Soto"
                      value={formNombre}
                      onChange={(e) => setFormNombre(e.target.value)}
                      required
                      className="w-full bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-2 py-1 text-xs text-black font-bold focus:outline-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-800 uppercase mb-0.5">
                      Perfil / Rol:
                    </label>
                    <select
                      value={formRol}
                      onChange={(e: any) => handleRolChange(e.target.value)}
                      className="w-full bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-2 py-1 text-xs text-black font-bold focus:outline-blue-700"
                    >
                      <option value="Operadora">🟢 Operadora</option>
                      <option value="Operador">🟢 Operador</option>
                      <option value="Técnico">🟡 Técnico</option>
                      <option value="Supervisor">🔵 Supervisor</option>
                      <option value="Administrador">🟣 Administrador</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-800 uppercase mb-0.5">
                      Contraseña de Seguridad:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: ClaudiaGama2026*"
                      value={formClave}
                      onChange={(e) => setFormClave(e.target.value)}
                      required
                      className="w-full bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-2 py-1 text-xs text-black font-mono font-bold focus:outline-blue-700"
                    />
                  </div>

                  <div className="flex items-end gap-1.5 pb-0.5">
                    <span className="text-[10px] text-gray-700 font-bold mr-1">Presets:</span>
                    {(['Operadora', 'Técnico', 'Supervisor', 'Administrador'] as UserRole[]).map(rolBtn => (
                      <button
                        key={rolBtn}
                        type="button"
                        onClick={() => handleRolChange(rolBtn)}
                        className={`text-[10px] px-2 py-0.5 font-bold border transition-colors cursor-pointer ${
                          formRol === rolBtn
                            ? 'bg-[#000080] text-white border-black shadow'
                            : 'bg-[#d4d0c8] text-black border-t-white border-l-white border-b-gray-700 border-r-gray-700 hover:bg-white'
                        }`}
                      >
                        {rolBtn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seleccionador de Módulos Visibles (Atributos Granulares) */}
                <div className="border-t border-gray-400 pt-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-gray-900 uppercase">
                      🎯 Módulos y Permisos Asignados al Perfil:
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                    {(Object.keys(ATRIBUTOS_DESCRIPCION) as (keyof UserAttributes)[]).map(key => {
                      const info = ATRIBUTOS_DESCRIPCION[key]
                      const activo = formAtributos[key]
                      return (
                        <div
                          key={key}
                          onClick={() => toggleAtributo(key)}
                          className={`p-1.5 border rounded-xs transition-all cursor-pointer select-none flex items-center justify-between ${
                            activo
                              ? 'bg-blue-100 border-blue-800 text-black font-bold'
                              : 'bg-white/80 border-gray-300 text-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{info.icon}</span>
                            <span className="text-[10px]">{info.label}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={activo}
                            onChange={() => {}}
                            className="rounded border-gray-500 text-blue-900 focus:ring-0 cursor-pointer"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {gestionError && (
                  <div className="text-red-900 text-xs font-bold p-2 bg-red-100 border border-red-500">
                    ⚠️ {gestionError}
                  </div>
                )}
                {gestionExito && (
                  <div className="text-emerald-900 text-xs font-bold p-2 bg-emerald-100 border border-emerald-500">
                    ✓ {gestionExito}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  {editandoCod && (
                    <button
                      type="button"
                      onClick={limpiarFormularioGestion}
                      className="px-3 py-1 bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 text-black font-bold text-xs hover:bg-white cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-1 bg-[#000080] text-white border-2 border-t-blue-400 border-l-blue-400 border-b-black border-r-black font-black text-xs uppercase hover:bg-blue-900 active:translate-y-0.5 cursor-pointer shadow"
                  >
                    {editandoCod ? 'Guardar Cambios' : 'Guardar y Registrar Operador'}
                  </button>
                </div>
              </form>

              {/* Tabla de Usuarios Registrados */}
              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[10px] font-black text-gray-800 uppercase">
                    👥 Operadores Registrados en el Sistema ({filteredOperators.length}):
                  </span>

                  {/* Buscar */}
                  <input
                    type="text"
                    placeholder="🔍 Buscar por nombre o rol..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white border border-t-gray-700 border-l-gray-700 border-b-white border-r-white px-2 py-0.5 text-xs text-black font-bold focus:outline-blue-700 w-full sm:w-64"
                  />
                </div>

                <div className="border border-gray-400 overflow-hidden bg-white">
                  <div className="overflow-x-auto max-h-[220px]">
                    <table className="w-full text-xs text-left font-mono">
                      <thead className="bg-[#c0c0c0] text-gray-900 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 border-b-2 border-gray-400">
                        <tr>
                          <th className="px-2 py-1 border-r border-gray-400">Código</th>
                          <th className="px-2 py-1 border-r border-gray-400">Operador / Funcionario</th>
                          <th className="px-2 py-1 border-r border-gray-400">Rol</th>
                          <th className="px-2 py-1 border-r border-gray-400">Contraseña</th>
                          <th className="px-2 py-1 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredOperators.map(op => {
                          return (
                            <tr key={op.codigo} className="hover:bg-blue-50 font-bold">
                              <td className="px-2 py-1 border-r border-gray-200 text-blue-900">{op.codigo}</td>
                              <td className="px-2 py-1 border-r border-gray-200 text-black font-sans">{op.nombre}</td>
                              <td className="px-2 py-1 border-r border-gray-200 font-sans">
                                <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold ${
                                  op.rol === 'Administrador' ? 'bg-purple-100 text-purple-900' :
                                  op.rol === 'Supervisor' ? 'bg-blue-100 text-blue-900' :
                                  op.rol === 'Técnico' ? 'bg-amber-100 text-amber-900' :
                                  'bg-emerald-100 text-emerald-900'
                                }`}>
                                  {op.rol}
                                </span>
                              </td>
                              <td className="px-2 py-1 border-r border-gray-200 text-gray-700">{op.clave}</td>
                              <td className="px-2 py-1 text-right space-x-1.5 shrink-0">
                                <button
                                  onClick={() => handleResetClave(op)}
                                  className="px-2 py-0.5 bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-blue-900 text-[10px] font-bold hover:bg-white cursor-pointer"
                                  title="Resetear o cambiar contraseña"
                                >
                                  🔑 Reset Clave
                                </button>
                                <button
                                  onClick={() => handleEditarClick(op)}
                                  className="px-2 py-0.5 bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-700 border-r-gray-700 text-black text-[10px] font-bold hover:bg-white cursor-pointer"
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  onClick={() => handleEliminarClick(op.codigo)}
                                  className="px-2 py-0.5 bg-red-100 border border-red-400 text-red-900 text-[10px] font-bold hover:bg-red-600 hover:text-white cursor-pointer"
                                >
                                  🗑️ Baja
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer del Modal */}
            <div className="bg-[#d4d0c8] px-3 py-1.5 border-t border-gray-400 flex justify-end shrink-0">
              <button
                onClick={() => setMostrarModalGestion(false)}
                className="px-4 py-1 bg-[#d4d0c8] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 text-black font-bold text-xs hover:bg-white cursor-pointer"
              >
                CERRAR
              </button>
            </div>

          </div>
        </div>
      )}

      {children}
    </div>
  )
}
