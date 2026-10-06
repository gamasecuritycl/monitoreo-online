'use client'

import React, { useState } from 'react'

export interface CotizacionData {
  tipoPropiedad: 'casa' | 'depto' | 'local' | 'empresa'
  tieneAlarma: 'si_adt' | 'no_nueva'
  puertas: number
  ventanas: number
  sensoresMovimiento: number
  camarasExtra: number
  sirenaExterior: boolean
  botonPanico: boolean
  // Datos del cliente
  nombre: string
  telefono: string
  direccion: string
  comuna: string
  email: string
  comentario: string
}

const COMUNAS_CHILE = [
  // RM Sector Oriente
  'Las Condes', 'Providencia', 'Vitacura', 'Lo Barnechea', 'La Reina', 'Ñuñoa',
  // RM Centro y Poniente
  'Santiago Centro', 'San Miguel', 'Macul', 'La Florida', 'Peñalolén', 'Maipú', 'Estación Central',
  'Pudahuel', 'Quilicura', 'Renca', 'Conchalí', 'Independencia', 'Recoleta', 'Huechuraba',
  // RM Sur y Norte
  'Puente Alto', 'San Bernardo', 'La Cisterna', 'San Ramón', 'La Granja', 'El Bosque', 'Lo Espejo', 'Pedro Aguirre Cerda',
  'Colina (Chicureo)', 'Lampa', 'Buin', 'Paine', 'Talagante', 'Peñaflor', 'Padre Hurtado', 'Melipilla',
  // V Región
  'Viña del Mar', 'Valparaíso', 'Concón', 'Quilpué', 'Villa Alemana', 'Limache', 'Quillota', 'San Antonio',
  // Otras
  'Rancagua', 'Machalí', 'La Serena', 'Coquimbo', 'Concepción', 'Otra Comuna / Regiones'
]

export default function CotizadorOnline({ origen = 'web' }: { origen?: string }) {
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1)
  const [enviando, setEnviando] = useState(false)
  const [enviadoExito, setEnviadoExito] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [form, setForm] = useState<CotizacionData>({
    tipoPropiedad: 'casa',
    tieneAlarma: 'si_adt',
    puertas: 2,
    ventanas: 2,
    sensoresMovimiento: 2,
    camarasExtra: 0,
    sirenaExterior: true,
    botonPanico: false,
    nombre: '',
    telefono: '',
    direccion: '',
    comuna: 'Santiago Centro',
    email: '',
    comentario: ''
  })

  // Cálculos dinámicos de cotización
  const esMigracion = form.tieneAlarma === 'si_adt'

  // Costo inicial estimado
  const costoActivacion = esMigracion ? 29900 : 199900 // Kit Vetti base o reprogramación
  const costoSensoresExtra = esMigracion ? 0 : (
    Math.max(0, form.puertas - 2) * 19900 +
    Math.max(0, form.ventanas - 2) * 19900 +
    Math.max(0, form.sensoresMovimiento - 1) * 24900
  )
  const costoCamaras = form.camarasExtra * 39900
  const costoSirena = (!esMigracion && form.sirenaExterior) ? 29900 : 0
  const costoPanico = form.botonPanico ? 19900 : 0

  const totalInicialEstimado = costoActivacion + costoSensoresExtra + costoCamaras + costoSirena + costoPanico
  const mensualidadMonitoreoUF = '0,9 UF + IVA'
  const mensualidadAproxCLP = 35000 // Aprox en pesos

  // Comparativa contra Verisure / ADT (Promedio $65.000 / mes)
  const costoMensualCompetencia = 65000
  const ahorroMensual = costoMensualCompetencia - mensualidadAproxCLP
  const ahorroAnual = ahorroMensual * 12

  const handleEnviarCotizacion = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!form.nombre.trim()) {
      setErrorMsg('Por favor ingresa tu nombre y apellido.')
      return
    }
    if (!form.telefono.trim() || form.telefono.replace(/[^0-9]/g, '').length < 8) {
      setErrorMsg('Por favor ingresa un teléfono o WhatsApp de contacto válido.')
      return
    }
    if (!form.direccion.trim()) {
      setErrorMsg('Por favor ingresa tu dirección (calle y número).')
      return
    }

    setEnviando(true)

    try {
      const res = await fetch('/api/cotizador/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          origen,
          totalInicialEstimado,
          mensualidadAproxCLP,
          ahorroAnualEstimado: ahorroAnual
        })
      })

      if (res.ok) {
        setEnviadoExito(true)
      } else {
        const d = await res.json()
        setErrorMsg(d.error || 'Hubo un inconveniente guardando tu cotización. Intenta por WhatsApp.')
      }
    } catch (err: any) {
      setErrorMsg('Error de conexión. Puedes solicitar tu cotización directamente por WhatsApp.')
    } finally {
      setEnviando(false)
    }
  }

  const generarMensajeWhatsApp = () => {
    let msg = `Hola Gama Seguridad! Coticé en su web y quiero coordinar la visita técnica:\n\n`
    msg += `👤 *Nombre:* ${form.nombre}\n`
    msg += `📍 *Dirección:* ${form.direccion}, ${form.comuna}\n`
    msg += `📞 *Teléfono:* ${form.telefono}\n`
    msg += `🏠 *Inmueble:* ${form.tipoPropiedad.toUpperCase()}\n`
    msg += `🔄 *Tipo:* ${esMigracion ? 'MIGRACIÓN ALARMA EXISTENTE (ADT/DSC)' : 'KIT NUEVO AL COSTO'}\n`
    msg += `💰 *Plan Elegido:* 0,9 UF + IVA mensual\n`
    if (form.comentario) msg += `📝 *Obs:* ${form.comentario}\n`
    return encodeURIComponent(msg)
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-gradient-to-b from-[#0a1628] to-[#050d1a] border border-blue-500/30 rounded-3xl p-5 sm:p-8 md:p-10 shadow-2xl text-slate-100 font-sans">
      
      {/* Encabezado */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 bg-blue-500/20 text-sky-300 border border-blue-400/30 px-3.5 py-1 rounded-full text-xs font-mono font-bold">
          <span>⚡</span> COTIZADOR EN LÍNEA GAMA 2026
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Calcula tu plan de seguridad en 30 segundos
        </h2>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Precios transparentes al costo. Compara lo que ahorrarías frente a Verisure o ADT y solicita tu visita técnica sin compromiso.
        </p>

        {/* Barra de Pasos */}
        <div className="flex justify-center items-center gap-2 sm:gap-4 pt-4">
          {[
            { num: 1, label: 'Inmueble' },
            { num: 2, label: 'Situación' },
            { num: 3, label: 'Ubicación y Datos' },
            { num: 4, label: 'Presupuesto' }
          ].map(p => (
            <button
              key={p.num}
              type="button"
              onClick={() => p.num < paso && setPaso(p.num as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                paso === p.num
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105'
                  : paso > p.num
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 cursor-pointer'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center text-[11px]">
                {paso > p.num ? '✓' : p.num}
              </span>
              <span className="hidden sm:inline">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── PASO 1: Tipo de Inmueble ── */}
      {paso === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">1. ¿Qué tipo de propiedad necesitas proteger?</h3>
            <p className="text-slate-400 text-xs sm:text-sm">Selecciona tu inmueble para dimensionar el nivel de cobertura necesario.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { id: 'casa', label: 'Casa', sub: '1 o 2 Pisos / Parcela', icon: '🏠' },
              { id: 'depto', label: 'Departamento', sub: 'Piso bajo o intermedio', icon: '🏢' },
              { id: 'local', label: 'Local Comercial', sub: 'Tienda, Stripcenter o Farmacia', icon: '🏪' },
              { id: 'empresa', label: 'Empresa / Bodega', sub: 'Galpón, Industria o Taller', icon: '🏭' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setForm(prev => ({ ...prev, tipoPropiedad: item.id as any }))
                  setPaso(2)
                }}
                className={`p-5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 hover:scale-105 ${
                  form.tipoPropiedad === item.id
                    ? 'bg-blue-950/80 border-sky-400 text-white shadow-xl shadow-blue-500/20'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-3xl sm:text-4xl">{item.icon}</span>
                <span className="font-extrabold text-sm sm:text-base text-white">{item.label}</span>
                <span className="text-[11px] text-slate-400 leading-tight">{item.sub}</span>
              </button>
            ))}
          </div>

          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => setPaso(2)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-8 py-3 rounded-xl transition-all shadow cursor-pointer"
            >
              Continuar al Paso 2 →
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 2: Situación Actual (Migración vs Kit Nuevo) ── */}
      {paso === 2 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">2. ¿Tienes un sistema de alarma instalado actualmente?</h3>
            <p className="text-slate-400 text-xs sm:text-sm">Si ya tienes una alarma con otra empresa, puedes ahorrar reutilizando tus sensores.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Opción 1: Migración ADT */}
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, tieneAlarma: 'si_adt' }))}
              className={`p-6 rounded-2xl border text-left transition-all cursor-pointer relative ${
                form.tieneAlarma === 'si_adt'
                  ? 'bg-emerald-950/60 border-emerald-400 shadow-xl shadow-emerald-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">🔄</span>
                <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full">
                  MÁXIMO AHORRO
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-white mb-1">
                Ya tengo alarma (ADT, DSC, Honeywell u otra)
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Reutilizamos todos tus sensores y cableado existente. <strong>Costo en equipos: $0</strong>. Solo reprogramamos hacia nuestra central 24/7 y bajas tu mensualidad a <strong>0,9 UF + IVA</strong>.
              </p>
            </button>

            {/* Opción 2: Kit Nuevo */}
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, tieneAlarma: 'no_nueva' }))}
              className={`p-6 rounded-2xl border text-left transition-all cursor-pointer relative ${
                form.tieneAlarma === 'no_nueva'
                  ? 'bg-blue-950/60 border-sky-400 shadow-xl shadow-blue-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">📦</span>
                <span className="text-[11px] font-black uppercase tracking-wider bg-blue-500 text-white px-2.5 py-0.5 rounded-full">
                  EQUIPO AL COSTO
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-white mb-1">
                No tengo alarma (Instalación desde cero)
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Te instalamos un Kit Inteligente Vetti o DSC de última generación al costo de importación, con app móvil y contrato justo donde <strong>el equipo queda a tu nombre</strong>.
              </p>
            </button>
          </div>

          {/* Opciones adicionales si es kit nuevo */}
          {!esMigracion && (
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h5 className="text-xs font-bold text-sky-400 uppercase tracking-wider">Dimensionamiento inicial estimado:</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Puertas a proteger:</label>
                  <select
                    value={form.puertas}
                    onChange={e => setForm(prev => ({ ...prev, puertas: parseInt(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 p-2 rounded-lg text-white font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'puerta' : 'puertas'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Ventanas vulnerables:</label>
                  <select
                    value={form.ventanas}
                    onChange={e => setForm(prev => ({ ...prev, ventanas: parseInt(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 p-2 rounded-lg text-white font-bold"
                  >
                    {[1, 2, 3, 4, 6, 8, 10].map(n => <option key={n} value={n}>{n} ventanas</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Sensores de movimiento (PIR):</label>
                  <select
                    value={form.sensoresMovimiento}
                    onChange={e => setForm(prev => ({ ...prev, sensoresMovimiento: parseInt(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 p-2 rounded-lg text-white font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'sensor' : 'sensores'}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => setPaso(1)}
              className="text-slate-400 hover:text-white text-xs font-bold px-4 py-2"
            >
              ← Volver
            </button>
            <button
              type="button"
              onClick={() => setPaso(3)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-8 py-3 rounded-xl transition-all shadow cursor-pointer"
            >
              Continuar a Datos de Ubicación →
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 3: Datos de Contacto y Ubicación (Obligatorios) ── */}
      {paso === 3 && (
        <form onSubmit={(e) => { e.preventDefault(); setPaso(4); }} className="space-y-5 animate-fadeIn">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">3. ¿Dónde se encuentra la propiedad a proteger?</h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              Necesitamos tus datos para ubicar el inmueble, validar cobertura técnica y preparar la cotización oficial.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nombre y Apellido <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Juan Pérez Morales"
                value={form.nombre}
                onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* Teléfono / WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Teléfono / WhatsApp de contacto <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="Ej: +56 9 9123 4567"
                value={form.telefono}
                onChange={e => setForm(prev => ({ ...prev, telefono: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-sky-400 font-mono"
              />
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Dirección exacta (Calle y Número) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Av. Providencia 1234, Depto 402"
                value={form.direccion}
                onChange={e => setForm(prev => ({ ...prev, direccion: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* Comuna */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Comuna <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={form.comuna}
                onChange={e => setForm(prev => ({ ...prev, comuna: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-sky-400 font-bold"
              >
                {COMUNAS_CHILE.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Correo Electrónico (Para enviar presupuesto en PDF)
              </label>
              <input
                type="email"
                placeholder="Ej: juan.perez@correo.cl"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Comentarios u horarios para coordinar visita:
              </label>
              <input
                type="text"
                placeholder="Ej: Llamar por la tarde / Casa en condominio"
                value={form.comentario}
                onChange={e => setForm(prev => ({ ...prev, comentario: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => setPaso(2)}
              className="text-slate-400 hover:text-white text-xs font-bold px-4 py-2"
            >
              ← Volver
            </button>
            <button
              type="submit"
              disabled={!form.nombre || !form.telefono || !form.direccion}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm px-8 py-3.5 rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              Ver Mi Presupuesto y Comparativa →
            </button>
          </div>
        </form>
      )}

      {/* ── PASO 4: Resumen de Cotización y Cierre de Lead ── */}
      {paso === 4 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-black text-white mb-1">
              Tu Propuesta Personalizada de Seguridad 24/7
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm">
              Propiedad en <strong>{form.direccion}, {form.comuna}</strong> ({form.tipoPropiedad.toUpperCase()})
            </p>
          </div>

          {/* Tarjetas de Precios y Ahorro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Tarjeta 1: Equipos / Activación */}
            <div className="bg-slate-900/90 border border-slate-700 p-5 rounded-2xl text-center space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Inversión Inicial en Equipos</span>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {esMigracion ? '$29.900' : `$${totalInicialEstimado.toLocaleString('es-CL')}`}
              </div>
              <p className="text-[11px] text-slate-400">
                {esMigracion ? 'Reutilizando tus sensores existentes' : 'Kit al costo con instalación incluida'}
              </p>
              <div className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 py-1 rounded">
                ✓ EQUIPO 100% TUYO (SIN COMODATO)
              </div>
            </div>

            {/* Tarjeta 2: Mensualidad Monitoreo */}
            <div className="bg-blue-950/80 border border-sky-400 p-5 rounded-2xl text-center space-y-1 shadow-xl">
              <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider">Monitoreo Central 24/7</span>
              <div className="text-2xl sm:text-3xl font-black text-sky-300 font-mono">
                {mensualidadMonitoreoUF}
              </div>
              <p className="text-[11px] text-slate-300">
                Aprox. <strong>${mensualidadAproxCLP.toLocaleString('es-CL')} / mes</strong>
              </p>
              <div className="text-[10px] text-sky-200 font-bold bg-blue-900/60 py-1 rounded">
                ✓ RESPUESTA CARABINEROS & WHATSAPP
              </div>
            </div>

            {/* Tarjeta 3: Comparativa de Ahorro */}
            <div className="bg-emerald-950/70 border border-emerald-400 p-5 rounded-2xl text-center space-y-1 shadow-xl">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Tu Ahorro Frente a Verisure/ADT</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
                ${ahorroAnual.toLocaleString('es-CL')}
              </div>
              <p className="text-[11px] text-emerald-200">
                Ahorro neto garantizado cada año
              </p>
              <div className="text-[10px] text-emerald-300 font-black bg-emerald-900/60 py-1 rounded">
                🔥 HASTA 45% MENOS MENSUAL
              </div>
            </div>

          </div>

          {/* Estado de Envío */}
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 text-xs rounded-xl text-center font-bold">
              ⚠️ {errorMsg}
            </div>
          )}

          {enviadoExito ? (
            <div className="bg-emerald-950/80 border border-emerald-500 p-6 rounded-2xl text-center space-y-3 shadow-2xl animate-fadeIn">
              <span className="text-4xl">🎉</span>
              <h4 className="text-xl font-black text-white">¡Cotización Registrada con Éxito!</h4>
              <p className="text-slate-200 text-sm max-w-md mx-auto">
                Tus datos fueron recibidos por nuestra Central en <strong>{form.comuna}</strong>. Un especialista técnico te contactará al <strong>{form.telefono}</strong> para coordinar la visita.
              </p>
              <div className="pt-2">
                <a
                  href={`https://wa.me/56991016912?text=${generarMensajeWhatsApp()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-all text-sm"
                >
                  <span>📱</span> Chatear con un Asesor por WhatsApp Ahora →
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="text-center">
                <p className="text-xs text-slate-300 mb-3">
                  Para coordinar la inspección técnica o cerrar tu contrato con tarifa de <strong>0,9 UF</strong>:
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={handleEnviarCotizacion}
                    disabled={enviando}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm px-8 py-4 rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {enviando ? '⏳ Guardando Solicitud...' : '✅ Confirmar Solicitud de Visita Técnica'}
                  </button>

                  <a
                    href={`https://wa.me/56991016912?text=${generarMensajeWhatsApp()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      // Intentar guardar lead silenciosamente en background al hacer clic en WhatsApp
                      fetch('/api/cotizador/lead', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...form, origen: 'click_wa', totalInicialEstimado, mensualidadAproxCLP, ahorroAnualEstimado: ahorroAnual })
                      }).catch(() => {})
                    }}
                    className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-sm px-8 py-4 rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>📱</span> Enviar Directo a WhatsApp Central →
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setPaso(3)}
              className="text-slate-400 hover:text-white text-xs font-bold px-4 py-2"
            >
              ← Modificar mis datos
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
