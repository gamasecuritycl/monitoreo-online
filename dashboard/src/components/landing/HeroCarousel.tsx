'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MessageSquare, Shield, Clock, Award, PhoneCall, Sparkles, ArrowRight } from 'lucide-react';
import { HeroSlide, DEFAULT_LANDING_MARKETING_CONFIG } from '@/lib/landing-marketing/types';

interface HeroCarouselProps {
  slides?: HeroSlide[];
}

const STATS = [
  { n: '+20', label: 'Años de trayectoria en Chile', icon: Award },
  { n: '500+', label: 'Empresas y hogares protegidos', icon: Shield },
  { n: '< 2 min', label: 'Tiempo medio de respuesta', icon: Clock },
  { n: '100%', label: 'Equipos en propiedad (sin arriendo)', icon: Sparkles },
];

export default function HeroCarousel({ slides: propSlides }: HeroCarouselProps) {
  const [slides, setSlides] = useState<HeroSlide[]>(
    propSlides && propSlides.length > 0
      ? propSlides.filter((s) => s.activo)
      : DEFAULT_LANDING_MARKETING_CONFIG.heroSlides.filter((s) => s.activo)
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar configuración en vivo desde la API si no vino precargada
  useEffect(() => {
    let isMounted = true;
    fetch('/api/landing-marketing')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.heroSlides && Array.isArray(data.heroSlides)) {
          const actives = data.heroSlides.filter((s: HeroSlide) => s.activo);
          if (actives.length > 0) {
            setSlides(actives);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const totalSlides = slides.length || 1;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Autoplay cada 7 segundos
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    timerRef.current = setInterval(() => {
      nextSlide();
    }, 7000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [nextSlide, isPaused, totalSlides]);

  const handleAction = (tipo: 'whatsapp' | 'chatbot' | 'link', url?: string, contextText?: string) => {
    if (tipo === 'chatbot') {
      window.dispatchEvent(
        new CustomEvent('open-sales-gama', {
          detail: { initialMessage: contextText || 'Hola, deseo cotizar la solución de seguridad vista en la portada.' },
        })
      );
    } else if (tipo === 'whatsapp') {
      const waUrl = url || 'https://wa.me/56991016912?text=Hola%20GAMA%20Seguridad,%20deseo%20m%C3%A1s%20informaci%C3%B3n.';
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } else if (url) {
      if (url.startsWith('#')) {
        const el = document.querySelector(url);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = url;
      }
    }
  };

  const currentSlide = slides[currentIndex] || DEFAULT_LANDING_MARKETING_CONFIG.heroSlides[0];

  return (
    <section
      id="inicio"
      className="relative min-h-[90vh] lg:min-h-screen flex flex-col justify-between pt-28 pb-12 overflow-hidden bg-[#050d1a]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── AMBIENT BACKGROUND GLOW ── */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#0066cc]/15 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[600px] h-[450px] bg-[#dc2626]/10 blur-[150px] rounded-full pointer-events-none" />

      {/* ── SLIDE CONTENT & IMAGERY ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id || currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center"
          >
            {/* ── COLUMNA IZQUIERDA: TEXTOS & LLAMADOS A LA ACCIÓN ── */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
              {/* Badge Dinámico */}
              <div className="inline-flex items-center gap-2.5 bg-[#0b172c]/90 backdrop-blur-md border border-[#2997ff]/40 shadow-lg shadow-blue-950/50 rounded-full px-4 py-1.5 text-xs text-blue-200 font-sans">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-semibold tracking-wide uppercase text-[11px]">{currentSlide.badge}</span>
              </div>

              {/* Título Principal */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] font-sans">
                  {currentSlide.titulo}{' '}
                  <span className="bg-gradient-to-r from-[#2997ff] via-[#60a5fa] to-[#38bdf8] bg-clip-text text-transparent block sm:inline">
                    {currentSlide.tituloHighlight}
                  </span>
                </h1>
              </div>

              {/* Bajada Comercial */}
              <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-xl leading-relaxed font-sans">
                {currentSlide.bajada}
              </p>

              {/* Botones de Conversión */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                {/* Botón Primario */}
                <button
                  onClick={() =>
                    handleAction(
                      currentSlide.btnPrimarioTipo,
                      currentSlide.btnPrimarioUrl,
                      `Quiero cotizar: ${currentSlide.titulo}`
                    )
                  }
                  className="bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white font-bold text-sm sm:text-base py-3.5 px-7 rounded-2xl shadow-xl shadow-blue-900/30 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer border border-blue-400/30"
                >
                  {currentSlide.btnPrimarioTipo === 'whatsapp' ? (
                    <PhoneCall className="w-4 h-4 text-emerald-300" />
                  ) : currentSlide.btnPrimarioTipo === 'chatbot' ? (
                    <MessageSquare className="w-4 h-4 text-blue-200" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-white" />
                  )}
                  <span>{currentSlide.btnPrimarioTexto}</span>
                </button>

                {/* Botón Secundario (Asesor Virtual o Info) */}
                <button
                  onClick={() =>
                    handleAction(
                      currentSlide.btnSecundarioTipo,
                      currentSlide.btnSecundarioUrl,
                      `Consulta rápida sobre: ${currentSlide.titulo}`
                    )
                  }
                  className="bg-[#0b172c]/90 hover:bg-[#112344] text-slate-200 hover:text-white border border-slate-700/80 hover:border-blue-400/50 font-semibold text-sm sm:text-base py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer backdrop-blur-md shadow-md"
                >
                  <MessageSquare className="w-4 h-4 text-[#2997ff]" />
                  <span>{currentSlide.btnSecundarioTexto}</span>
                </button>
              </div>

              {/* Micro-Garantía de Confianza */}
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 font-mono">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> Evaluación presencial $0
                </span>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> Respuesta en &lt; 2 min
                </span>
              </div>
            </div>

            {/* ── COLUMNA DERECHA: AFICHE O FOTO DEL SLIDE ── */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              <div className="relative w-full max-w-[460px] aspect-[4/3] sm:aspect-square rounded-3xl overflow-hidden border border-blue-900/40 bg-gradient-to-br from-[#0c182c] to-[#070e1b] shadow-2xl shadow-blue-950/80 group">
                <Image
                  src={currentSlide.imagenUrl}
                  alt={currentSlide.titulo}
                  fill
                  className="object-contain p-2 sm:p-4 group-hover:scale-105 transition-transform duration-700 ease-out"
                  priority
                  sizes="(max-width: 768px) 100vw, 460px"
                />

                {/* Overlay sutil de viñeta */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050d1a]/80 via-transparent to-transparent pointer-events-none" />

                {/* Badge Flotante en la Imagen */}
                <div className="absolute bottom-4 left-4 right-4 bg-[#070e1b]/90 backdrop-blur-md border border-slate-700/60 rounded-2xl p-3 flex items-center justify-between shadow-lg">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">SEGURIDAD VERIFICADA</span>
                    <span className="text-xs font-bold text-white block">GAMA Security 24/7</span>
                  </div>
                  <button
                    onClick={() =>
                      handleAction('chatbot', undefined, `Quiero información sobre ${currentSlide.titulo}`)
                    }
                    className="bg-[#2997ff]/20 hover:bg-[#2997ff]/30 text-[#2997ff] border border-[#2997ff]/40 text-[11px] font-bold py-1.5 px-3 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Preguntar</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── CONTROLES DEL CARRUSEL (FLECHAS Y PUNTOS INDICADORES) ── */}
        {totalSlides > 1 && (
          <div className="flex items-center justify-between pt-8 sm:pt-10">
            {/* Puntos / Dots con barra de progreso */}
            <div className="flex items-center gap-2.5">
              {slides.map((s, idx) => (
                <button
                  key={s.id || idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx
                      ? 'w-10 bg-gradient-to-r from-[#2997ff] to-[#60a5fa] shadow-md shadow-blue-500/50'
                      : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                  }`}
                  aria-label={`Ir al slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Flechas Prev / Next */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="w-10 h-10 rounded-2xl bg-[#0b172c] hover:bg-[#112344] border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
                aria-label="Slide anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="w-10 h-10 rounded-2xl bg-[#0b172c] hover:bg-[#112344] border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
                aria-label="Slide siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── BARRA INFERIOR DE STATS & CONFIANZA ── */}
      <div className="relative z-10 border-t border-slate-800/80 bg-[#070e1b]/70 backdrop-blur-xl py-6 mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="flex flex-col items-center justify-center space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-4 h-4 text-[#2997ff]" />
                    <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-mono tracking-tight">
                      {stat.n}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-sans max-w-[160px] leading-tight">
                    {stat.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
