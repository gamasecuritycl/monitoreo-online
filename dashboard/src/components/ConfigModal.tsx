'use client'

import { useState } from 'react'

const STORAGE_KEY = 'gemini_prompt_config'

const PROMPT_DEFAULT = `Eres un experto en seguridad y análisis de datos de Gama Seguridad Chile. Recibes los registros de la bitácora de eventos del turno. Tu tarea es generar un INFORME RESUMIDO Y CONCLUYENTE.

NO analices evento por evento. Solo debes enfocarte en lo TRASCENDENTAL:

- Alarmas de robo / intrusiones
- Cortes de energía / fallas de batería
- Fallas de comunicación
- Aperturas fuera de horario
- Cualquier evento que un experto en seguridad considere importante

Por cada evento trascendental:
1. Identifica el cliente por su nombre
2. Coteja si la señal recibida tiene registro en bitácora y qué acción se tomó
3. Concluye: ¿requiere servicio técnico? ¿llamada? ¿notificar supervisor? ¿solo monitoreo?

Al final entrega un resumen ejecutivo con:
- Clientes que requieren atención urgente
- Recomendaciones operativas concretas
- Estado general del turno (normal / crítico / con observaciones)

Reglas:
- Sé concluyente, no descriptivo
- Formato profesional pero natural (no parezca generado por IA)
- Sin saludos ni despedidas
- En español, viñetas cortas donde corresponda

Datos del período {rango}:
- Total eventos: {total}
- Desglose por tipo: {porTipo}
- Top 5 clientes: {topClientes}
- Eventos de falla/energía: {fallas}
- Aperturas/cierres: {aperturas}

Registros de bitácora del período:
{eventosDetalle}`

export function getPromptConfig(): string {
  if (typeof window === 'undefined') return PROMPT_DEFAULT
  return localStorage.getItem(STORAGE_KEY) || PROMPT_DEFAULT
}

export default function ConfigModal({ onClose }: { onClose: () => void }) {
  const [prompt, setPrompt] = useState(() => getPromptConfig())
  const [guardado, setGuardado] = useState(false)

  const guardar = () => {
    localStorage.setItem(STORAGE_KEY, prompt)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-2 pt-[5vh] overflow-y-auto" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full md:w-[700px] h-[90vh] bg-[#0f172a] border border-[#1e293b] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-[#1e293b] flex justify-between items-center px-4 py-2 shrink-0 border-b border-[#334155]">
          <span className="text-slate-100 font-bold text-base tracking-wide">⚙ CONFIGURACIÓN</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold px-1.5 leading-none hover:bg-slate-700 rounded">&times;</button>
        </div>
        <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
          <div>
            <div className="text-cyan-400 font-bold text-sm mb-2">PROMPT DEL ANÁLISIS IA</div>
            <p className="text-slate-400 text-xs mb-3">
              Este prompt se envía a Gemini cuando haces clic en <strong>🤖 IA</strong> en Reportes. Puedes editarlo libremente.
              Las variables <code className="text-yellow-400">{'{rango}'}</code>, <code className="text-yellow-400">{'{total}'}</code>, etc. se reemplazan automáticamente con los datos del filtro.
            </p>
            <textarea
              className="w-full h-[400px] bg-[#1e293b] border border-[#334155] rounded text-sm text-slate-200 p-3 font-mono resize-none focus:outline-none focus:border-cyan-700"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={guardar} className="bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-bold px-4 py-2 rounded transition-colors">
              {guardado ? '✓ GUARDADO' : 'GUARDAR'}
            </button>
            <button onClick={() => { setPrompt(PROMPT_DEFAULT); localStorage.setItem(STORAGE_KEY, PROMPT_DEFAULT); setGuardado(true); setTimeout(() => setGuardado(false), 2000) }} className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold px-4 py-2 rounded transition-colors">
              RESTAURAR DEFAULT
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
