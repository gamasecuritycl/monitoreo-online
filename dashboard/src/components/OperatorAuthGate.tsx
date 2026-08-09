'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'

export interface Operator {
  codigo: string
  nombre: string
  rol: 'Administrador' | 'Supervisor' | 'Operador'
  clave: string
}

export const OPERADORES_PREDETERMINADOS: Operator[] = [
  { codigo: '01', nombre: 'Central Operativa GAMA Security', rol: 'Administrador', clave: 'gama2026' },
  { codigo: '02', nombre: 'Supervisor de Turno Central', rol: 'Supervisor', clave: 'gama8899' },
  { codigo: '03', nombre: 'Operador de Monitoreo 24/7', rol: 'Operador', clave: 'gama1234' },
]

interface OperatorAuthGateProps {
  children: React.ReactNode
}

export default function OperatorAuthGate({ children }: OperatorAuthGateProps) {
  const [operatorList, setOperatorList] = useState<Operator[]>(OPERADORES_PREDETERMINADOS)
  const [operator, setOperator] = useState<Operator | null>(null)
  const [checking, setChecking] = useState(true)

  // Login form state
  const [selectedCod, setSelectedCod] = useState('01')
  const [claveInput, setClaveInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Admin Modal state
  const [mostrarModalGestion, setMostrarModalGestion] = useState(false)
  const [editandoCod, setEditandoCod] = useState<string | null>(null)
  const [formCodigo, setFormCodigo] = useState('')
  const [formNombre, setFormNombre] = useState('')
  const [formRol, setFormRol] = useState<'Administrador' | 'Supervisor' | 'Operador'>('Operador')
  const [formClave, setFormClave] = useState('')
  const [gestionError, setGestionError] = useState('')
  const [gestionExito, setGestionExito] = useState('')

  // Cargar lista de operadores desde localStorage
  useEffect(() => {
    try {
      const savedList = localStorage.getItem('gama_operadores_list')
      if (savedList) {
        const parsed = JSON.parse(savedList)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOperatorList(parsed)
        }
      }

      const savedAuth = sessionStorage.getItem('gama_operator_auth') || localStorage.getItem('gama_operator_auth')
      if (savedAuth) {
        setOperator(JSON.parse(savedAuth))
      }
    } catch (e) {}
    setChecking(false)
  }, [])

  // Guardar lista en localStorage
  const guardarLista = (nuevaLista: Operator[]) => {
    setOperatorList(nuevaLista)
    localStorage.setItem('gama_operadores_list', JSON.stringify(nuevaLista))
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

    sessionStorage.setItem('gama_operator_auth', JSON.stringify(op))
    localStorage.setItem('gama_operator_auth', JSON.stringify(op))
    setOperator(op)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('gama_operator_auth')
    localStorage.removeItem('gama_operator_auth')
    setOperator(null)
    setClaveInput('')
    setMostrarModalGestion(false)
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
          return { ...op, codigo: codClean, nombre: nomClean, rol: formRol, clave: claClean }
        }
        return op
      })
      guardarLista(nuevaLista)
      setGestionExito(`Operador ${codClean} actualizado con éxito.`)
    } else {
      // Crear nuevo
      if (operatorList.some(op => op.codigo === codClean)) {
        setGestionError(`El código de operador ${codClean} ya existe.`)
        return
      }
      const nuevo: Operator = { codigo: codClean, nombre: nomClean, rol: formRol, clave: claClean }
      const nuevaLista = [...operatorList, nuevo]
      guardarLista(nuevaLista)
      setGestionExito(`Nuevo operador ${codClean} - ${nomClean} agregado con éxito.`)
    }

    limpiarFormularioGestion()
  }

  const handleEditarClick = (op: Operator) => {
    setEditandoCod(op.codigo)
    setFormCodigo(op.codigo)
    setFormNombre(op.nombre)
    setFormRol(op.rol)
    setFormClave(op.clave)
    setGestionError('')
    setGestionExito('')
  }

  const handleEliminarClick = (cod: string) => {
    if (operatorList.length <= 1) {
      setGestionError('Debe existir al menos un operador registrado en el sistema.')
      return
    }
    if (confirm(`¿Estás seguro de eliminar el operador código ${cod}?`)) {
      const nuevaLista = operatorList.filter(o => o.codigo !== cod)
      guardarLista(nuevaLista)
      setGestionExito(`Operador ${cod} eliminado con éxito.`)
      if (editandoCod === cod) limpiarFormularioGestion()
    }
  }

  const limpiarFormularioGestion = () => {
    setEditandoCod(null)
    setFormCodigo('')
    setFormNombre('')
    setFormRol('Operador')
    setFormClave('')
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#050d1a] flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-[#2997ff] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-sans">Verificando credenciales de operador...</span>
        </div>
      </div>
    )
  }

  if (!operator) {
    return (
      <div className="min-h-screen bg-[#050d1a] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
        
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0066cc]/15 blur-[140px] rounded-full pointer-events-none" />

        <div className="relative z-10 w-full max-w-md bg-[#0a1628]/90 backdrop-blur-xl border border-[#1e3a5f] rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          
          {/* Header Badge & Logo */}
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
                🔒 ACCESO RESTRINGIDO A OPERADORES
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Central Operativa GAMA
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Portal CRM 360° & Monitoreo 24/7
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Operator Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Operador / Credencial Autorizada:
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

            {/* Password input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Clave de Seguridad / PIN de Acceso:
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={claveInput}
                  onChange={(e) => setClaveInput(e.target.value)}
                  placeholder="Introduce tu clave o PIN..."
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
              Ingresar a Central de Operaciones →
            </button>
          </form>

          {/* Footer Warning */}
          <div className="mt-8 pt-6 border-t border-[#1e3a5f]/60 text-center text-[10px] text-slate-500 leading-relaxed">
            Sistema auditado y monitoreado. Todo acceso fallido o no autorizado es registrado por la Central de Operaciones GAMA Security.
          </div>

        </div>
      </div>
    )
  }

  // Render CRM with Operator Control Header Strip
  return (
    <div className="relative">
      
      {/* Top Authenticated Operator Bar */}
      <div className="bg-[#050d1a] border-b border-[#1e3a5f] px-4 py-2 flex items-center justify-between text-xs text-slate-300 font-sans sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="font-semibold text-white">CENTRAL OPERATIVA CONECTADA</span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-[#2997ff] font-medium hidden sm:inline">
            Operador: <strong>{operator.nombre}</strong> ({operator.rol})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Managed Password & Operators Button */}
          <button
            onClick={() => setMostrarModalGestion(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0066cc]/20 hover:bg-[#0066cc]/30 border border-[#0066cc]/40 text-[#2997ff] text-xs font-semibold transition-colors cursor-pointer"
          >
            🔑 Gestionar Claves & Operadores
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold transition-colors cursor-pointer"
          >
            🔒 Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Admin / Key Management Modal */}
      {mostrarModalGestion && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 font-sans text-white">
          <div className="bg-[#0a1628] border border-[#1e3a5f] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-[#050d1a] px-6 py-4 border-b border-[#1e3a5f] flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🔑</span> Gestión de Operadores & Claves de Acceso
                </h3>
                <p className="text-xs text-slate-400">
                  Crea, edita claves o elimina usuarios autorizados de la Central Operativa.
                </p>
              </div>
              <button
                onClick={() => setMostrarModalGestion(false)}
                className="w-8 h-8 rounded-full bg-[#162a4a] hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center font-bold text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
              
              {/* Form Crear / Editar */}
              <form onSubmit={handleGuardarOperador} className="bg-[#050d1a] border border-[#1e3a5f] rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1e3a5f]/60 pb-2">
                  <h4 className="text-xs font-bold text-[#2997ff] uppercase tracking-wider">
                    {editandoCod ? `✏️ Editar Operador Código ${editandoCod}` : '➕ Registrar Nuevo Operador'}
                  </h4>
                  {editandoCod && (
                    <button
                      type="button"
                      onClick={limpiarFormularioGestion}
                      className="text-[10px] text-slate-400 hover:text-white underline"
                    >
                      Cancelar Edición
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Código</label>
                    <input
                      type="text"
                      placeholder="04"
                      value={formCodigo}
                      onChange={(e) => setFormCodigo(e.target.value)}
                      disabled={!!editandoCod}
                      required
                      className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#2997ff]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Nombre Operador</label>
                    <input
                      type="text"
                      placeholder="Ej: Pedro Morales"
                      value={formNombre}
                      onChange={(e) => setFormNombre(e.target.value)}
                      required
                      className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#2997ff]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Rol</label>
                    <select
                      value={formRol}
                      onChange={(e: any) => setFormRol(e.target.value)}
                      className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#2997ff]"
                    >
                      <option value="Operador">Operador</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Administrador">Administrador</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Clave de Acceso / PIN</label>
                  <input
                    type="text"
                    placeholder="Ej: gama5544 o 5544"
                    value={formClave}
                    onChange={(e) => setFormClave(e.target.value)}
                    required
                    className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#2997ff]"
                  />
                </div>

                {gestionError && (
                  <div className="text-red-400 text-xs font-semibold p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    ⚠️ {gestionError}
                  </div>
                )}
                {gestionExito && (
                  <div className="text-green-400 text-xs font-semibold p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    ✓ {gestionExito}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="btn-apple-primary text-xs py-2 px-5"
                  >
                    {editandoCod ? 'Guardar Cambios' : 'Guardar Nuevo Operador'}
                  </button>
                </div>
              </form>

              {/* Tabla de Operadores */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Operadores Registrados ({operatorList.length})
                </h4>

                <div className="bg-[#050d1a] border border-[#1e3a5f] rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#0a1628] border-b border-[#1e3a5f] text-slate-400 font-mono uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">Código</th>
                        <th className="px-4 py-2.5">Nombre</th>
                        <th className="px-4 py-2.5">Rol</th>
                        <th className="px-4 py-2.5">Clave Acceso</th>
                        <th className="px-4 py-2.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e3a5f]/40">
                      {operatorList.map(op => (
                        <tr key={op.codigo} className="hover:bg-[#0f2240]/30 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-[#2997ff]">{op.codigo}</td>
                          <td className="px-4 py-3 font-semibold text-white">{op.nombre}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              op.rol === 'Administrador' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                              op.rol === 'Supervisor' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                              'bg-green-500/20 text-green-300 border border-green-500/40'
                            }`}>
                              {op.rol}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-300">{op.clave}</td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              onClick={() => handleEditarClick(op)}
                              className="px-2 py-1 rounded bg-[#1e3a5f] hover:bg-[#2997ff] text-white text-[10px] font-semibold transition-colors"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => handleEliminarClick(op.codigo)}
                              className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white text-[10px] font-semibold transition-colors"
                            >
                              🗑️ Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-[#050d1a] px-6 py-3 border-t border-[#1e3a5f] flex justify-end">
              <button
                onClick={() => setMostrarModalGestion(false)}
                className="btn-apple-secondary-dark text-xs py-2 px-5"
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
