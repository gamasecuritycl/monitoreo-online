'use client'

import { useState } from 'react'

const inputCls =
  'w-full bg-[#0f2240] border border-[#1e3a5f] rounded-lg px-4 py-3 text-white placeholder:text-slate-500'

const SERVICIOS = [
  { value: 'general', label: 'Cotización integral de seguridad' },
  { value: 'vetti', label: 'Alarma inteligente Vetti & App CLICK' },
  { value: 'monitoreo', label: 'Monitoreo central 24/7 con verificación IA' },
  { value: 'camaras', label: 'Cámaras 4K con IA' },
  { value: 'cercos', label: 'Cercos eléctricos perimetrales' },
  { value: 'dsc', label: 'Teclados y alarmas DSC' },
  { value: 'prevencion', label: 'Prevención de robo y disuasión' },
  { value: 'incendio', label: 'Detección de incendio y humo' },
]

export default function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('sending')
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries())
    try {
      const res = await fetch('/api/contacto-landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setState(res.ok ? 'ok' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'ok') {
    return (
      <div className="apple-card-dark p-8 text-center space-y-3">
        <h3 className="text-white text-xl font-semibold">¡Solicitud recibida!</h3>
        <p className="text-slate-300">Te contactaremos dentro de las próximas 24 horas hábiles.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="apple-card-dark p-6 sm:p-8 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <input name="name" required placeholder="Nombre y apellido" aria-label="Nombre" className={inputCls} />
        <input name="phone" required placeholder="Teléfono" aria-label="Teléfono" className={inputCls} />
      </div>
      <input name="email" type="email" required placeholder="Email" aria-label="Email" className={inputCls} />
      <select name="service" defaultValue="general" aria-label="Servicio" className={inputCls}>
        {SERVICIOS.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <textarea
        name="message" required rows={4}
        placeholder="¿Qué necesitas proteger? (casa, negocio, oficina…)"
        aria-label="Mensaje" className={inputCls}
      />
      <button type="submit" disabled={state === 'sending'} className="btn-apple-primary w-full justify-center py-3">
        {state === 'sending' ? 'Enviando…' : 'Enviar solicitud'}
      </button>
      {state === 'error' && (
        <p className="text-red-400 text-sm">
          No se pudo enviar. Escríbenos por WhatsApp al +56 9 9101 6912.
        </p>
      )}
    </form>
  )
}
