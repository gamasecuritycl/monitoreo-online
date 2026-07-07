'use client'

import React, { useState } from 'react'

interface Operator {
  codigo: string
  nombre: string
  rol: 'Administrador' | 'Supervisor' | 'Operadora' | 'Técnico'
  clave: string
}

interface LoginModalProps {
  onClose: () => void
  onLoginSuccess: (op: Operator) => void
  operadores: Operator[]
}

export default function LoginModal({ onClose, onLoginSuccess, operadores }: LoginModalProps) {
  const [selectedCod, setSelectedCod] = useState(operadores[0]?.codigo || '01')
  const [claveInput, setClaveInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    
    const op = operadores.find(o => o.codigo === selectedCod)
    if (!op) {
      setErrorMsg('Operador no encontrado.')
      return
    }

    if (op.clave !== claveInput) {
      setErrorMsg('Clave de seguridad incorrecta.')
      return
    }

    // Success
    onLoginSuccess(op)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-mono text-black">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 w-full max-w-sm flex flex-col shadow-2xl">
        
        {/* Title bar */}
        <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center shrink-0">
          <div className="font-bold text-xs tracking-wide">Inicio de Sesión - Scorpion Central</div>
          <button 
            onClick={onClose} 
            className="bg-[#c0c0c0] text-black font-bold border border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-1 leading-none hover:bg-[#d0d0d0] cursor-pointer text-[10px]"
          >
            X
          </button>
        </div>

        {/* Content Windows login design */}
        <form onSubmit={handleLogin} className="p-4 space-y-4">
          
          <div className="flex items-center gap-3">
            <span className="text-3xl select-none">🔑</span>
            <div className="flex-1">
              <h3 className="font-bold text-xs text-[#000080] uppercase tracking-wide">Identificación de Operador</h3>
              <p className="text-[9px] text-gray-600 leading-tight">Seleccione su nombre e introduzca su clave de acceso.</p>
            </div>
          </div>

          <div className="space-y-3 bg-[#d4d0c8] p-3 border border-t-gray-400 border-l-gray-400 border-b-white border-r-white rounded-sm">
            
            {/* Operator select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-700 uppercase">Operador / Funcionario:</label>
              <select
                value={selectedCod}
                onChange={(e) => setSelectedCod(e.target.value)}
                className="bg-white border border-gray-400 font-bold px-2 py-1 text-xs text-black focus:outline-none w-full"
              >
                {operadores.map(op => (
                  <option key={op.codigo} value={op.codigo}>
                    {op.codigo} - {op.nombre} ({op.rol})
                  </option>
                ))}
              </select>
            </div>

            {/* Password input */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-700 uppercase">Clave de Acceso:</label>
              <input
                type="password"
                value={claveInput}
                onChange={(e) => setClaveInput(e.target.value)}
                placeholder="Clave numérica o contraseña..."
                className="bg-white border border-gray-400 font-bold px-2 py-1 text-xs text-black select-text focus:outline-none w-full font-mono"
                required
                autoFocus
              />
            </div>

          </div>

          {errorMsg && (
            <div className="text-red-700 text-[10px] font-bold text-center bg-red-100 border border-red-300 p-1">
              ❌ {errorMsg}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 border-t border-gray-300 pt-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#d4d0c8] hover:bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-4 py-1 font-bold text-xs cursor-pointer active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white shadow-sm"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="bg-[#d4d0c8] hover:bg-[#e0e0e0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-6 py-1 font-bold text-xs cursor-pointer active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white shadow-sm"
            >
              ACEPTAR
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
