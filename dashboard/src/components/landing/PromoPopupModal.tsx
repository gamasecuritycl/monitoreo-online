'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PhoneCall, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';
import { PromoPopupConfig, DEFAULT_LANDING_MARKETING_CONFIG } from '@/lib/landing-marketing/types';

interface PromoPopupModalProps {
  initialConfig?: PromoPopupConfig;
}

export default function PromoPopupModal({ initialConfig }: PromoPopupModalProps) {
  const [config, setConfig] = useState<PromoPopupConfig>(
    initialConfig || DEFAULT_LANDING_MARKETING_CONFIG.popup
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Cargar config desde la API si no vino inicial
    let isMounted = true;
    fetch('/api/landing-marketing')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.popup) {
          setConfig(data.popup);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!config.activo) return;

    // Verificar si ya fue cerrado en esta sesión de navegación
    const hasSeenPopup = sessionStorage.getItem('gama_promo_popup_seen');
    if (hasSeenPopup === 'true') return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, (config.delaySeconds || 3) * 1000);

    return () => clearTimeout(timer);
  }, [config.activo, config.delaySeconds]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('gama_promo_popup_seen', 'true');
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      config.btnWhatsappMensaje ||
        'Hola GAMA Seguridad, vi la promoción en la web y deseo cotizar con instalación bonificada.'
    );
    window.open(`https://wa.me/56991016912?text=${text}`, '_blank', 'noopener,noreferrer');
    handleClose();
  };

  const handleBot = () => {
    window.dispatchEvent(
      new CustomEvent('open-sales-gama', {
        detail: {
          initialMessage: `Hola, me interesa la promoción: "${config.titulo}". ¿Me das los detalles y valores?`,
        },
      })
    );
    handleClose();
  };

  if (!config.activo) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop con blur profundo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleClose}
            className="fixed inset-0 bg-[#020611]/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg sm:max-w-xl bg-gradient-to-b from-[#0b172c] to-[#070e1b] border border-blue-500/30 rounded-3xl shadow-2xl shadow-blue-950/80 overflow-hidden z-10 p-5 sm:p-7 text-left font-sans"
          >
            {/* Botón Cerrar X */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-600/50 shadow-md active:scale-90"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Badge de Promoción */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[11px] font-bold tracking-wider uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span>{config.badge || 'OFERTA DESTACADA'}</span>
            </div>

            {/* Imagen del Afiche */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-blue-900/50 bg-[#050d1a] mb-4 group shadow-inner">
              <Image
                src={config.imagenUrl || '/ads/vetti_ad_oficial_master.png'}
                alt={config.titulo}
                fill
                className="object-contain p-1 group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, 550px"
              />
            </div>

            {/* Título & Subtítulo */}
            <div className="space-y-1.5 mb-5">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                {config.titulo}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {config.subtitulo}
              </p>
            </div>

            {/* Botones de Acción */}
            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              {/* Botón WhatsApp */}
              <button
                onClick={handleWhatsApp}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-lg shadow-emerald-900/30 hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer border border-emerald-400/40"
              >
                <PhoneCall className="w-4 h-4 text-emerald-100" />
                <span>{config.btnWhatsappTexto || 'Aprovechar por WhatsApp'}</span>
              </button>

              {/* Botón Asesor Bot */}
              <button
                onClick={handleBot}
                className="w-full bg-[#1e40af] hover:bg-[#2563eb] text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-lg shadow-blue-900/30 hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer border border-blue-400/40"
              >
                <MessageSquare className="w-4 h-4 text-blue-200" />
                <span>{config.btnBotTexto || 'Preguntar al Asesor Bot'}</span>
              </button>
            </div>

            {/* Micro Nota de Confianza */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 mt-4 font-mono text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>GAMA Security · Evaluación Técnica a costo $0 sin compromiso</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
