// ════════════════════════════════════════════════════════════════════
//  🔒 LOCKED — NO MODIFICAR
//  Modal genérico de visualización de cámaras Dahua.
//  Carga lista de /api/dahua-camaras y frames de /api/dahua-stream.
//  Funciona para cualquier cámara registrada. No tocar.
// ════════════════════════════════════════════════════════════════════
'use client'

import React, { useState, useEffect, useRef } from 'react'

interface CamaraDahua {
  id: string
  nombre: string
  serialNumber: string
  usuario: string
  password?: string
  canal: number
  substream: boolean
  activa: boolean
}

interface Props {
  onClose: () => void
  cuenta: string
}

export default function CamaraGridModal({ onClose, cuenta }: Props) {
  const [camaras, setCamaras] = useState<CamaraDahua[]>([])
  const [frames, setFrames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const pollingRef = useRef(true)

  useEffect(() => {
    const fetchCamaras = async () => {
      try {
        setLoading(true)
        const r = await fetch(`/api/dahua-camaras?cuenta=${encodeURIComponent(cuenta)}`)
        const data = await r.json()
        if (data.cameras?.length > 0) {
          setCamaras(data.cameras)
        } else {
          setError('No se encontraron camaras activas para esta cuenta')
        }
      } catch (e) {
        setError('Error al cargar camaras')
      } finally {
        setLoading(false)
      }
    }
    fetchCamaras()
  }, [cuenta])

  useEffect(() => {
    pollingRef.current = true
    const poll = async () => {
      while (pollingRef.current) {
        for (const cam of camaras) {
          if (!pollingRef.current) break
          const key = `${cam.serialNumber}_${cam.canal}`
          try {
            const ts = Date.now()
            const r = await fetch(`/api/dahua-stream?sn=${cam.serialNumber}&canal=${cam.canal}&t=${ts}`)
            if (!r.ok) continue
            const ct = r.headers.get('content-type') || ''
            if (ct.includes('jpeg')) {
              const blob = await r.blob()
              const url = URL.createObjectURL(blob)
              setFrames(prev => {
                if (prev[key]) URL.revokeObjectURL(prev[key])
                return { ...prev, [key]: url }
              })
            }
          } catch {}
        }
        await new Promise(r => setTimeout(r, 1500))
      }
    }
    if (camaras.length > 0) poll()
    return () => {
      pollingRef.current = false
      Object.values(frames).forEach(u => URL.revokeObjectURL(u))
    }
  }, [camaras])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#f59e0b] text-xs font-mono">Cargando camaras...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
        <div className="bg-[#0a0f1a] border border-red-800 rounded-lg p-6 text-center max-w-md" onClick={e => e.stopPropagation()}>
          <p className="text-red-400 text-sm font-mono mb-4">{error}</p>
          <button onClick={onClose} className="bg-red-800 hover:bg-red-700 text-white px-4 py-1 text-xs rounded">CERRAR</button>
        </div>
      </div>
    )
  }

  const cols = camaras.length <= 4 ? 2 : camaras.length <= 9 ? 3 : 4

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="relative w-[98vw] h-[96vh] bg-[#0a0f1a] rounded-lg overflow-hidden border border-[#1e293b]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2 bg-[#0f1629] border-b border-[#1e293b]">
          <h2 className="text-xs font-bold text-[#f59e0b] tracking-wider uppercase">
            LIVE VIEW — {cuenta} ({camaras.length} camaras)
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-lg leading-none">&times;</button>
        </div>
        <div className="p-2 h-[calc(100%-40px)] overflow-hidden" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '4px' }}>
          {camaras.map(cam => {
            const key = `${cam.serialNumber}_${cam.canal}`
            const imgUrl = frames[key]
            return (
              <div key={key} className="relative bg-black rounded overflow-hidden border border-[#1e293b] flex items-center justify-center" style={{ minHeight: 0 }}>
                {imgUrl ? (
                  <img src={imgUrl} alt={cam.nombre} className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#555]">
                    <div className="w-8 h-8 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-[10px] font-mono">{cam.nombre}</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
                  <span className="text-[10px] text-white/60 font-mono">{cam.nombre}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
