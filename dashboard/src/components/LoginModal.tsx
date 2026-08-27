'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Operator, ensureUserAttributes } from '@/types/operator'

interface LoginModalProps {
  onClose: () => void
  onLoginSuccess: (op: Operator) => void
  operadores: Operator[]
  usuarioActual?: Operator
}

export default function LoginModal({
  onClose,
  onLoginSuccess,
  operadores,
  usuarioActual,
}: LoginModalProps) {
  const [selectedCod, setSelectedCod] = useState(usuarioActual?.codigo || operadores[0]?.codigo || '01')
  const [claveInput, setClaveInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    
    const op = operadores.find(o => o.codigo === selectedCod)
    if (!op) {
      setErrorMsg('Operador no encontrado.')
      return
    }

    const claveLimpia = claveInput.trim().toLowerCase()
    const claveEsperada = (op.clave || '').toLowerCase()
    const pinEsperado = claveEsperada.replace('gama', '')

    if (claveLimpia !== claveEsperada && claveLimpia !== pinEsperado) {
      setErrorMsg('Clave de seguridad o PIN de acceso incorrecto.')
      return
    }

    const opConAtributos: Operator = {
      ...op,
      atributos: ensureUserAttributes(op),
    }

    // Sincronizar en almacenamiento de sesión para unificar con el portal
    try {
      sessionStorage.setItem('gama_operator_auth', JSON.stringify(opConAtributos))
      localStorage.setItem('gama_operator_auth', JSON.stringify(opConAtributos))
      localStorage.setItem('gama_usuario_activo', JSON.stringify(opConAtributos))
    } catch {}

    // Éxito
    onLoginSuccess(opConAtributos)
    onClose()
  }

  const opSeleccionado = operadores.find(o => o.codigo === selectedCod)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-sans text-white animate-in fade-in duration-200">
      
      {/* Glow de Fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-[#0066cc]/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-[#0a1628]/95 backdrop-blur-2xl border border-[#1e3a5f] rounded-3xl p-7 shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col">
        
        {/* Header con Logo GAMA */}
        <div className="text-center mb-6 space-y-2">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-1">
            <Image
              src="/logo-gama.png"
              alt="GAMA Security Logo"
              width={60}
              height={60}
              className="object-contain filter drop-shadow-[0_4px_12px_rgba(0,102,204,0.6)]"
            />
          </div>
          <div>
            <span className="inline-block px-3 py-0.5 rounded-full bg-[#0066cc]/25 border border-[#0066cc]/50 text-[10px] font-bold text-[#2997ff] uppercase tracking-widest mb-1.5">
              🔑 CAMBIO DE TURNO / RELEVO 24/7
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Identificación de Operador
            </h2>
            <p className="text-xs text-slate-400">
              Seleccione el operador entrante para registrar el relevo activo
            </p>
          </div>
        </div>

        {/* Formulario Unificado */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Selección de Operador */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Operador / Funcionario Entrante:
            </label>
            <select
              value={selectedCod}
              onChange={(e) => setSelectedCod(e.target.value)}
              className="w-full bg-[#050d1a] border border-[#1e3a5f] rounded-xl px-3.5 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-[#2997ff] transition-colors cursor-pointer"
            >
              {operadores.map(op => (
                <option key={op.codigo} value={op.codigo} className="bg-[#0a1628] text-white">
                  {op.codigo} — {op.nombre} ({op.rol})
                </option>
              ))}
            </select>
          </div>

          {/* Input de Clave o PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Clave de Seguridad / PIN:
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={claveInput}
                onChange={(e) => setClaveInput(e.target.value)}
                placeholder="Introduce contraseña o PIN..."
                required
                autoFocus
                className="w-full bg-[#050d1a] border border-[#1e3a5f] rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#2997ff] transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[11px] font-semibold px-1.5 py-0.5"
              >
                {showPass ? 'OCULTAR' : 'VER'}
              </button>
            </div>
          </div>

          {/* Mensaje de Error */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 text-slate-300 font-semibold text-xs py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#2997ff] to-[#0066cc] hover:from-[#1a88f0] hover:to-[#0055b3] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-[#0066cc]/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Iniciar Turno</span>
              <span>→</span>
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="mt-5 pt-4 border-t border-[#1e3a5f]/60 text-center text-[10px] text-slate-500">
          Relevo seguro sin interrupción de telemetría • GAMA Security 24/7
        </div>

      </div>
    </div>
  )
}
