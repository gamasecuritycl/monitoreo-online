'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'

export interface Operator {
  codigo: string
  nombre: string
  rol: 'Administrador' | 'Supervisor' | 'Operador'
  clave: string
}

export const OPERADORES_SISTEMA: Operator[] = [
  { codigo: '01', nombre: 'Central Operativa GAMA Security', rol: 'Administrador', clave: 'gama2026' },
  { codigo: '02', nombre: 'Supervisor de Turno Central', rol: 'Supervisor', clave: 'gama8899' },
  { codigo: '03', nombre: 'Operador de Monitoreo 24/7', rol: 'Operador', clave: 'gama1234' },
]

interface OperatorAuthGateProps {
  children: React.ReactNode
  onOperatorLogin?: (op: Operator) => void
}

export default function OperatorAuthGate({ children }: OperatorAuthGateProps) {
  const [operator, setOperator] = useState<Operator | null>(null)
  const [checking, setChecking] = useState(true)

  const [selectedCod, setSelectedCod] = useState('01')
  const [claveInput, setClaveInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('gama_operator_auth') || localStorage.getItem('gama_operator_auth')
      if (saved) {
        setOperator(JSON.parse(saved))
      }
    } catch (e) {}
    setChecking(false)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const op = OPERADORES_SISTEMA.find(o => o.codigo === selectedCod)
    if (!op) {
      setErrorMsg('Operador no encontrado.')
      return
    }

    // Permitir clave con o sin prefijo "gama" (ej. "2026" o "gama2026")
    const claveLimpia = claveInput.trim().toLowerCase()
    const claveEsperada = op.clave.toLowerCase()
    const pinEsperado = claveEsperada.replace('gama', '')

    if (claveLimpia !== claveEsperada && claveLimpia !== pinEsperado) {
      setErrorMsg('Clave de seguridad o PIN de acceso incorrecto.')
      return
    }

    // Guardar sesión
    sessionStorage.setItem('gama_operator_auth', JSON.stringify(op))
    localStorage.setItem('gama_operator_auth', JSON.stringify(op))
    setOperator(op)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('gama_operator_auth')
    localStorage.removeItem('gama_operator_auth')
    setOperator(null)
    setClaveInput('')
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
                {OPERADORES_SISTEMA.map(op => (
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

  // Render CRM with Logout Header Strip
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

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold transition-colors cursor-pointer"
        >
          🔒 Cerrar Sesión
        </button>
      </div>

      {children}
    </div>
  )
}
