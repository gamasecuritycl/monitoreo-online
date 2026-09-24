"use client";

import React, { useState } from "react";
import { BotConfigModal } from "./Modal/BotConfigModal";
import { BotLeadsModal } from "./Modal/BotLeadsModal";
import { ChatWidget } from "./ChatWidget";
import { SalesGamaAvatar } from "@/components/SalesGamaAvatar";

export function OperacionesBotHub() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isLeadsOpen, setIsLeadsOpen] = useState(false);
  const [isChatTestOpen, setIsChatTestOpen] = useState(false);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1d3a] via-[#102a54] to-[#0a162b] border border-blue-900/50 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-xs font-semibold text-blue-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              SALES-GAMA • Motor de Ventas 24/7 Activo
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Centro de Control <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">SALES-GAMA</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
              Administra el prompt de persuasión comercial, gestiona el catálogo de productos y promociones en UF/CLP,
              y revisa en tiempo real los prospectos calientes capturados por el agente androide.
            </p>
          </div>

          {/* Mini 3D Avatar Preview */}
          <div className="flex flex-col items-center">
            <div className="w-36 h-28 relative rounded-xl bg-slate-900/60 border border-blue-900/60 flex items-center justify-center overflow-hidden shadow-inner">
              <SalesGamaAvatar state="idle" variant="desk" size={110} />
            </div>
            <span className="text-[11px] text-blue-300/80 mt-1 font-mono">SALES-GAMA 3D v2.0</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Modals Trigger Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* MODAL 1: CONFIGURACIÓN SALES-BOT */}
        <div className="relative group rounded-2xl bg-[#081224] border border-blue-900/40 p-6 hover:border-blue-500/60 transition-all duration-300 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-2xl shadow-inner">
                ⚙️
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800/40">
                Ajustes & Catálogo
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                Configuración Sales-Bot
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Control total del comportamiento de la IA y del inventario de ventas comercial de GAMA Seguridad.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-blue-950">
              <li className="flex items-center gap-2">
                <span className="text-blue-400 font-bold">✓</span>
                <span><strong>Prompt del Sistema:</strong> Monitoreo desde 0,9 UF + IVA mensual, disuasión comercial y captura progresiva.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400 font-bold">✓</span>
                <span><strong>CRUD de Productos & Promos:</strong> Agrega, edita o elimina alarmas, cámaras y planes.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400 font-bold">✓</span>
                <span><strong>Parámetros Gemini:</strong> Temperatura, rate limit y WhatsApp de derivación directa.</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-4 border-t border-blue-900/30">
            <button
              onClick={() => setIsConfigOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-950/60 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>⚙️</span> Abrir Configuración Sales-Bot
            </button>
          </div>
        </div>

        {/* MODAL 2: LEADS - BOT */}
        <div className="relative group rounded-2xl bg-[#081224] border border-amber-900/40 p-6 hover:border-amber-500/60 transition-all duration-300 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner">
                📋
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800/40 animate-pulse">
                🔥 Captura Automática
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                Leads - Bot
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Base de datos centralizada de cotizaciones y prospectos recopilados automáticamente por el bot.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-blue-950">
              <li className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                <span><strong>Detección Progresiva:</strong> Nombre, Comuna validada, Dirección, Email y Teléfono.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                <span><strong>Atención Inmediata:</strong> Botón 1-clic a WhatsApp Web para cerrar la venta.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                <span><strong>Transcripción Completa & CSV:</strong> Revisa el diálogo exacto y exporta para tu equipo.</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-4 border-t border-amber-900/30">
            <button
              onClick={() => setIsLeadsOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-sm shadow-lg shadow-amber-950/60 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>📋</span> Abrir Leads - Bot
            </button>
          </div>
        </div>

      </div>

      {/* Simulator / Test Box */}
      <div className="rounded-2xl bg-[#060e1d] border border-blue-900/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-lg">
            💬
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Simulador en Vivo de SALES-GAMA</h3>
            <p className="text-xs text-slate-400">
              Prueba la conversación interactiva, la validación de comuna por botones (Sí/No) y la disuasión humana antes de publicar.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsChatTestOpen((prev) => !prev)}
          className="px-5 py-2.5 rounded-xl bg-blue-900/50 hover:bg-blue-800/60 text-blue-200 border border-blue-700/50 text-xs font-semibold whitespace-nowrap transition-colors"
        >
          {isChatTestOpen ? "Ocultar Simulador" : "Probar Chat en Vivo"}
        </button>
      </div>

      {/* Live Chat Drawer if toggled */}
      {isChatTestOpen && (
        <div className="rounded-2xl border border-blue-500/30 bg-[#071124] p-4 shadow-2xl flex flex-col items-center">
          <div className="w-full max-w-lg">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-blue-900/40 text-xs text-slate-400">
              <span>Simulador Activo (Modo Prueba)</span>
              <button
                onClick={() => setIsChatTestOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕ Cerrar
              </button>
            </div>
            <ChatWidget />
          </div>
        </div>
      )}

      {/* Modals */}
      <BotConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
      <BotLeadsModal isOpen={isLeadsOpen} onClose={() => setIsLeadsOpen(false)} />
    </div>
  );
}
