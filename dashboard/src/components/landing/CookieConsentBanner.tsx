'use client'

import React, { useState, useEffect } from 'react'
import { Cookie, ShieldCheck, Settings, X, Check } from 'lucide-react'
import { PestañaLegal } from './ModalLegalPublico'

interface CookieConsentBannerProps {
  onOpenLegal: (pestaña: PestañaLegal) => void
}

export default function CookieConsentBanner({ onOpenLegal }: CookieConsentBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem('gama_cookies_consent')
      if (!consent) {
        // Mostrar con un leve retraso para suavidad visual
        const t = setTimeout(() => setVisible(true), 1200)
        return () => clearTimeout(t)
      }
    } catch (e) {}
  }, [])

  const handleAceptarTodas = () => {
    try {
      localStorage.setItem('gama_cookies_consent', 'all')
    } catch (e) {}
    setVisible(false)
  }

  const handleSoloEsenciales = () => {
    try {
      localStorage.setItem('gama_cookies_consent', 'essential')
    } catch (e) {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-6 max-w-4xl mx-auto z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#0c182b]/95 backdrop-blur-2xl border border-white/15 p-5 sm:p-6 rounded-3xl shadow-2xl text-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        
        <div className="flex items-start gap-3.5 flex-1">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/30 shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm tracking-tight flex items-center gap-1.5">
                Privacidad & Cookies · Ley N° 21.719 de Chile
              </span>
              <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30 hidden sm:inline">
                APDP Compliant
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              En Gama Seguridad utilizamos cookies técnicas estrictamente necesarias para la seguridad del portal y cookies analíticas para mejorar su experiencia de cotización. No realizamos publicidad invasiva ni venta de datos a terceros.
            </p>
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => onOpenLegal('cookies')}
                className="text-[11px] text-blue-400 hover:text-blue-300 underline font-semibold cursor-pointer"
              >
                Ver Política de Cookies & Derechos ARCO+ →
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end flex-wrap">
          <button
            type="button"
            onClick={handleSoloEsenciales}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold border border-white/10 transition-all cursor-pointer flex-1 md:flex-none text-center"
          >
            Solo Esenciales
          </button>
          <button
            type="button"
            onClick={handleAceptarTodas}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 flex-1 md:flex-none"
          >
            <Check className="w-4 h-4" />
            <span>Aceptar Todas</span>
          </button>
        </div>

      </div>
    </div>
  )
}
