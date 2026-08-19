'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
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
  const [formRol, setFormRol] = useState<UserRole>('Operador')
  const [formClave, setFormClave] = useState('')
  const [formAtributos, setFormAtributos] = useState<UserAttributes>(DEFAULT_ATTRIBUTES_BY_ROLE.Operador)
  const [gestionError, setGestionError] = useState('')
  const [gestionExito, setGestionExito] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Cargar lista de operadores e inicio de sesión guardado
  useEffect(() => {
    try {
      const savedList = localStorage.getItem('gama_operadores_list')
      if (savedList) {
        const parsed = JSON.parse(savedList)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const san = parsed.map((op: any) => ({
            ...op,
            atributos: ensureUserAttributes(op),
          }))
          setOperatorList(san)
        }
      }

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
    } catch (e) {}
    setChecking(false)
  }, [])

  // Guardar lista en localStorage
  const guardarLista = (nuevaLista: Operator[]) => {
    setOperatorList(nuevaLista)
    localStorage.setItem('gama_operadores_list', JSON.stringify(nuevaLista))

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

    const claveLimpia = claveInput.trim().toLowerCase()
    const claveEsperada = op.clave.toLowerCase()
    const pinEsperado = claveEsperada.replace('gama', '')

    if (claveLimpia !== claveEsperada && claveLimpia !== pinEsperado) {
      setErrorMsg('Clave de seguridad o PIN de acceso incorrecto.')
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

    if (editandoCod) {
      // Actualizar existente
      const nuevaLista = operatorList.map(op => {
        if (op.codigo === editandoCod) {
          return {
            ...op,
            codigo: codClean,
            nombre: nomClean,
            rol: formRol,
            clave: claClean,
            atributos: formAtributos,
          }
        }
        return op
      })
      guardarLista(nuevaLista)
      setGestionExito(`Usuario ${codClean} (${nomClean}) actualizado con sus permisos asignados.`)
    } else {
      // Crear nuevo
      if (operatorList.some(op => op.codigo === codClean)) {
        setGestionError(`El código de usuario ${codClean} ya existe.`)
        return
      }
      const nuevo: Operator = {
        codigo: codClean,
        nombre: nomClean,
        rol: formRol,
        clave: claClean,
        atributos: formAtributos,
      }
      const nuevaLista = [...operatorList, nuevo]
      guardarLista(nuevaLista)
      setGestionExito(`Nuevo usuario ${codClean} - ${nomClean} (${formRol}) registrado con éxito.`)
    }

    limpiarFormularioGestion()
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
      <div className="min-h-screen bg-[#050d1a] flex items-center justify-center text-white font-sans">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-[#2997ff] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Verificando credenciales y permisos de usuario...</span>
        </div>
      </div>
    )
  }

  if (!operator) {
    return (
      <div className="min-h-screen bg-[#050d1a] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
        
        {/* Glow de Fondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0066cc]/15 blur-[140px] rounded-full pointer-events-none" />

        <div className="relative z-10 w-full max-w-md bg-[#0a1628]/90 backdrop-blur-xl border border-[#1e3a5f] rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          
          {/* Logo & Encabezado */}
          <div className="text-center mb-8 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[#050d1a] border border-[#1e3a5f] flex items-center justify-center mx-auto p-3 shadow-inner">
              <Image
                src="/logo-gama.png"
                alt="GAMA Security Logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#0066cc]/20 border border-[#0066cc]/40 text-[10px] font-bold text-[#2997ff] uppercase tracking-widest mb-2">
                🔒 ACCESO RESTRINGIDO POR ROLES & ATRIBUTOS
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Central Operativa GAMA
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Administradores • Operadores • Técnicos • Supervisores
              </p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Selección de Usuario */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Seleccionar Usuario Autorizado:
              </label>
              <select
                value={selectedCod}
                onChange={(e) => setSelectedCod(e.target.value)}
                className="w-full bg-[#050d1a] border border-[#1e3a5f] rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-[#2997ff] transition-colors"
              >
                {operatorList.map(op => (
                  <option key={op.codigo} value={op.codigo}>
                    {op.codigo} — {op.nombre} ({op.rol})
                  </option>
                ))}
              </select>
            </div>

            {/* Input Clave */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Clave de Seguridad / PIN:
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={claveInput}
                  onChange={(e) => setClaveInput(e.target.value)}
                  placeholder="Introduce clave o PIN..."
                  required
                  autoFocus
                  className="w-full bg-[#050d1a] border border-[#1e3a5f] rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#2997ff] transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-semibold px-2 py-1"
                >
                  {showPass ? 'OCULTAR' : 'VER'}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold text-center">
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full btn-apple-primary justify-center text-sm font-semibold py-3 px-6 shadow-lg shadow-[#0066cc]/30"
            >
              Ingresar al Sistema →
            </button>
          </form>

          {/* Footer Warning */}
          <div className="mt-8 pt-6 border-t border-[#1e3a5f]/60 text-center text-[10px] text-slate-500 leading-relaxed">
            Acceso controlado por permisos de perfil. Monitoreado en tiempo real por GAMA Security.
          </div>

        </div>
      </div>
    )
  }

  const activeAttrs = ensureUserAttributes(operator)
  const canManageUsers = activeAttrs.verConfiguracion || operator.rol === 'Administrador'

  return (
    <div className="relative">
      
      {/* Barra Superior con Estado del Usuario e Indicador de Rol */}
      <div className="bg-[#050d1a] border-b border-[#1e3a5f] px-4 py-2 flex items-center justify-between text-xs text-slate-300 font-sans sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-white">CENTRAL OPERATIVA CONECTADA</span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-medium">
              Usuario: <strong>{operator.nombre}</strong>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                operator.rol === 'Administrador'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : operator.rol === 'Supervisor'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : operator.rol === 'Técnico'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {operator.rol}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón de Gestión de Claves y Módulos (disponible si verConfiguracion es true o es Admin) */}
          {canManageUsers && (
            <button
              onClick={() => setMostrarModalGestion(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0066cc]/20 hover:bg-[#0066cc]/30 border border-[#0066cc]/40 text-[#2997ff] text-xs font-semibold transition-colors cursor-pointer"
            >
              ⚙️ Área de Configuración & Permisos
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold transition-colors cursor-pointer"
          >
            🔒 Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Modal de Gestión de Usuarios y Selección Granular de Módulos */}
      {mostrarModalGestion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans text-white">
          <div className="bg-[#0a1628] border border-[#1e3a5f] rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            
            {/* Encabezado del Modal */}
            <div className="bg-[#050d1a] px-6 py-4 border-b border-[#1e3a5f] flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>⚙️</span> Área de Configuración: CRUD de Usuarios & Módulos Visibles
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Asigna qué módulos de la Central Operativa puede ver y utilizar cada perfil (Administrador, Operador, Técnico, Supervisor).
                </p>
              </div>
              <button
                onClick={() => setMostrarModalGestion(false)}
                className="w-8 h-8 rounded-full bg-[#162a4a] hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
              
              {/* Formulario Crear / Editar */}
              <form onSubmit={handleGuardarOperador} className="bg-[#050d1a] border border-[#1e3a5f] rounded-2xl p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-[#1e3a5f]/60 pb-3">
                  <h4 className="text-xs font-bold text-[#2997ff] uppercase tracking-wider flex items-center gap-2">
                    <span>{editandoCod ? '✏️' : '➕'}</span>
                    {editandoCod ? `Editar Configuración del Usuario [Código ${editandoCod}]` : 'Registrar Nuevo Usuario en el Sistema'}
                  </h4>
                  {editandoCod && (
                    <button
                      type="button"
                      onClick={limpiarFormularioGestion}
                      className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Cancelar Edición
                    </button>
                  )}
                </div>

                {/* Campos Principales */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Código ID
                    </label>
                    <input
                      type="text"
                      placeholder="05"
                      value={formCodigo}
                      onChange={(e) => setFormCodigo(e.target.value)}
                      disabled={!!editandoCod}
                      required
                      className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#2997ff]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Nombre Completo del Usuario
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Carlos Mendoza (Técnico de Terreno)"
                      value={formNombre}
                      onChange={(e) => setFormNombre(e.target.value)}
                      required
                      className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#2997ff]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Perfil / Rol
                    </label>
                    <select
                      value={formRol}
                      onChange={(e: any) => handleRolChange(e.target.value)}
                      className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-xl px-3.5 py-2 text-xs text-white font-semibold focus:outline-none focus:border-[#2997ff]"
                    >
                      <option value="Operador">🟢 Operador</option>
                      <option value="Técnico">🟡 Técnico</option>
                      <option value="Supervisor">🔵 Supervisor</option>
                      <option value="Administrador">🟣 Administrador</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Clave de Acceso / PIN Secreto
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: gama7788"
                      value={formClave}
                      onChange={(e) => setFormClave(e.target.value)}
                      required
                      className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#2997ff]"
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <span className="text-[10px] text-slate-400">Presets rápidos de permisos:</span>
                    {(['Operador', 'Técnico', 'Supervisor', 'Administrador'] as UserRole[]).map(rolBtn => (
                      <button
                        key={rolBtn}
                        type="button"
                        onClick={() => handleRolChange(rolBtn)}
                        className={`text-[9px] px-2 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                          formRol === rolBtn ? 'bg-[#2997ff]/20 text-[#2997ff] border-[#2997ff]' : 'bg-[#0a1628] text-slate-400 border-[#1e3a5f] hover:text-white'
                        }`}
                      >
                        {rolBtn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seleccionador de Módulos Visibles (Atributos Granulares) */}
                <div className="border-t border-[#1e3a5f]/60 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-[#2997ff] uppercase tracking-wider">
                      🎯 Módulos & Atributos Visibles para este Usuario:
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Marca o desmarca los módulos que este usuario tendrá autorizados en su menú.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(Object.keys(ATRIBUTOS_DESCRIPCION) as (keyof UserAttributes)[]).map(key => {
                      const info = ATRIBUTOS_DESCRIPCION[key]
                      const activo = formAtributos[key]
                      return (
                        <div
                          key={key}
                          onClick={() => toggleAtributo(key)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                            activo
                              ? 'bg-[#0066cc]/15 border-[#2997ff] text-white shadow-[0_0_15px_rgba(41,151,255,0.15)]'
                              : 'bg-[#0a1628] border-[#1e3a5f]/80 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{info.icon}</span>
                              <span className="text-xs font-bold text-white">{info.label}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={activo}
                              onChange={() => {}} // Manejado por onClick contenedor
                              className="rounded border-[#1e3a5f] text-[#2997ff] focus:ring-0 cursor-pointer mt-0.5"
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight mt-2">
                            {info.desc}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {gestionError && (
                  <div className="text-red-400 text-xs font-semibold p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    ⚠️ {gestionError}
                  </div>
                )}
                {gestionExito && (
                  <div className="text-emerald-400 text-xs font-semibold p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    ✓ {gestionExito}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  {editandoCod && (
                    <button
                      type="button"
                      onClick={limpiarFormularioGestion}
                      className="btn-apple-secondary-dark text-xs py-2.5 px-5"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn-apple-primary text-xs py-2.5 px-6 shadow-md shadow-[#0066cc]/30"
                  >
                    {editandoCod ? 'Guardar Cambios de Módulos' : 'Guardar y Registrar Usuario'}
                  </button>
                </div>
              </form>

              {/* Tabla de Usuarios Registrados */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <span>👥</span> Usuarios Registrados en el Sistema ({filteredOperators.length})
                  </h4>

                  {/* Buscar */}
                  <input
                    type="text"
                    placeholder="🔍 Buscar por nombre, código o rol..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#050d1a] border border-[#1e3a5f] rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2997ff] w-full sm:w-64"
                  />
                </div>

                <div className="bg-[#050d1a] border border-[#1e3a5f] rounded-2xl overflow-hidden shadow-inner">
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#0a1628] border-b border-[#1e3a5f] text-slate-400 font-mono uppercase text-[10px] sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3">Código</th>
                          <th className="px-4 py-3">Usuario / Funcionario</th>
                          <th className="px-4 py-3">Rol</th>
                          <th className="px-4 py-3">Clave PIN</th>
                          <th className="px-4 py-3">Módulos Visibles Asignados</th>
                          <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e3a5f]/40">
                        {filteredOperators.map(op => {
                          const attrs = ensureUserAttributes(op)
                          return (
                            <tr key={op.codigo} className="hover:bg-[#0f2240]/40 transition-colors">
                              <td className="px-4 py-3 font-mono font-bold text-[#2997ff]">{op.codigo}</td>
                              <td className="px-4 py-3 font-semibold text-white">{op.nombre}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  op.rol === 'Administrador' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                                  op.rol === 'Supervisor' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                                  op.rol === 'Técnico' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                                  'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                }`}>
                                  {op.rol}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-300">{op.clave}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {(Object.keys(ATRIBUTOS_DESCRIPCION) as (keyof UserAttributes)[]).map(key => {
                                    if (!attrs[key]) return null
                                    const info = ATRIBUTOS_DESCRIPCION[key]
                                    return (
                                      <span
                                        key={key}
                                        title={`${info.label}: ${info.desc}`}
                                        className="px-1.5 py-0.5 rounded bg-[#162a4a] border border-[#1e3a5f] text-[9px] font-mono text-slate-200"
                                      >
                                        {info.icon} {info.label.split(' ')[0]}
                                      </span>
                                    )
                                  })}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right space-x-2 shrink-0">
                                <button
                                  onClick={() => handleEditarClick(op)}
                                  className="px-2.5 py-1 rounded-lg bg-[#1e3a5f] hover:bg-[#2997ff] text-white text-[10px] font-semibold transition-colors cursor-pointer"
                                >
                                  ✏️ Configurar
                                </button>
                                <button
                                  onClick={() => handleEliminarClick(op.codigo)}
                                  className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white text-[10px] font-semibold transition-colors cursor-pointer"
                                >
                                  🗑️ Eliminar
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
            <div className="bg-[#050d1a] px-6 py-4 border-t border-[#1e3a5f] flex justify-end shrink-0">
              <button
                onClick={() => setMostrarModalGestion(false)}
                className="btn-apple-secondary-dark text-xs py-2 px-6"
              >
                Cerrar Ventana
              </button>
            </div>

          </div>
        </div>
      )}

      {children}
    </div>
  )
}
