'use client'

import { useRef, useEffect, useState, useCallback } from 'react'

interface Deteccion {
  bbox: [number, number, number, number]
  clase: string
  score: number
}

const CLASES_VISIBLES = new Set([
  'person', 'car', 'truck', 'motorcycle', 'bicycle',
  'dog', 'cat', 'bird', 'horse', 'sheep', 'cow',
  'backpack', 'umbrella', 'handbag', 'suitcase'
])

const COLOR_MAP: Record<string, string> = {
  person: '#FF4444',
  car: '#44AAFF',
  truck: '#44AAFF',
  motorcycle: '#44AAFF',
  bicycle: '#44AAFF',
  dog: '#44FF44',
  cat: '#44FF44',
}

interface Props {
  imgRef: React.RefObject<HTMLImageElement | null>
  activo: boolean
  onToggle: () => void
}

export default function AIOverlay({ imgRef, activo, onToggle }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const modelRef = useRef<any>(null)
  const detectionsRef = useRef<Deteccion[]>([])
  const rafRef = useRef<number>(0)
  const ultimaDeteccionRef = useRef(0)

  const [modeloListo, setModeloListo] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [ultimoResumen, setUltimoResumen] = useState('')
  const [personas, setPersonas] = useState(0)

  // Cargar modelo TF.js + COCO-SSD
  useEffect(() => {
    if (!activo || modeloListo) return
    let cancelado = false
    setCargando(true)
    ;(async () => {
      try {
        const [tf, cocossd] = await Promise.all([
          import('@tensorflow/tfjs'),
          import('@tensorflow-models/coco-ssd')
        ])
        await tf.ready()
        const model = await cocossd.load()
        if (!cancelado) {
          modelRef.current = model
          setModeloListo(true)
          setCargando(false)
        }
      } catch (e) {
        if (!cancelado) {
          setCargando(false)
        }
      }
    })()
    return () => { cancelado = true }
  }, [activo, modeloListo])

  // Loop de detección
  const detectar = useCallback(async () => {
    const img = imgRef?.current
    const canvas = canvasRef.current
    const model = modelRef.current
    if (!img || !canvas || !model || !img.complete || img.naturalWidth === 0) {
      rafRef.current = requestAnimationFrame(detectar)
      return
    }

    // Throttle: max 1 detección cada 800ms
    const ahora = Date.now()
    if (ahora - ultimaDeteccionRef.current < 800) {
      rafRef.current = requestAnimationFrame(detectar)
      return
    }
    ultimaDeteccionRef.current = ahora

    try {
      // Dibujar el frame actual en el canvas (mismas dimensiones que el img)
      const rect = img.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height

      const ctx = canvas.getContext('2d')
      if (!ctx) { rafRef.current = requestAnimationFrame(detectar); return }

      // Escalar la imagen al canvas para que coincida
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Detectar objetos
      const predictions = await model.detect(img)
      const detecciones: Deteccion[] = predictions
        .filter((p: any) => p.score > 0.4 && CLASES_VISIBLES.has(p.class))
        .map((p: any) => ({
          bbox: p.bbox,
          clase: p.class,
          score: p.score,
        }))

      detectionsRef.current = detecciones

      // Dibujar bounding boxes
      const escalaX = canvas.width / img.naturalWidth
      const escalaY = canvas.height / img.naturalHeight

      for (const d of detecciones) {
        const [x, y, w, h] = d.bbox
        const color = COLOR_MAP[d.clase] || '#FFAA00'
        ctx.strokeStyle = color
        ctx.lineWidth = Math.max(2, canvas.width / 300)
        ctx.strokeRect(x * escalaX, y * escalaY, w * escalaX, h * escalaY)

        ctx.fillStyle = color
        const label = `${d.clase} ${(d.score * 100).toFixed(0)}%`
        ctx.font = `${Math.max(12, canvas.width / 50)}px sans-serif`
        const textW = ctx.measureText(label).width
        ctx.fillRect(x * escalaX, y * escalaY - 22, textW + 8, 22)
        ctx.fillStyle = '#000'
        ctx.fillText(label, x * escalaX + 4, y * escalaY - 6)
      }

      // Resumen textual
      const countMap: Record<string, number> = {}
      for (const d of detecciones) {
        countMap[d.clase] = (countMap[d.clase] || 0) + 1
      }
      const partes = Object.entries(countMap).map(([c, n]) => `${n} ${c}${n > 1 ? 's' : ''}`)
      setUltimoResumen(partes.join(', ') || 'sin detecciones')
      setPersonas(countMap['person'] || 0)
    } catch {}

    rafRef.current = requestAnimationFrame(detectar)
  }, [imgRef])

  // Iniciar/detener loop según activo
  useEffect(() => {
    if (activo && modeloListo) {
      rafRef.current = requestAnimationFrame(detectar)
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [activo, modeloListo, detectar])

  return (
    <>
      {/* Canvas overlay */}
      {activo && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
      )}

      {/* Botón y barra de estado */}
      <div className="absolute bottom-2 left-2 z-20 flex items-center gap-2">
        <button
          onClick={onToggle}
          disabled={cargando}
          className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition cursor-pointer ${
            activo
              ? modeloListo
                ? 'bg-green-700 text-white border border-green-500'
                : 'bg-yellow-700 text-white border border-yellow-500'
              : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
          }`}
        >
          {cargando ? 'CARGANDO IA...' : activo ? (modeloListo ? `IA ${personas > 0 ? '🚨' : '🔍'}` : 'IA...') : 'IA OFF'}
        </button>

        {activo && modeloListo && ultimoResumen && (
          <span className={`text-[10px] font-mono px-2 py-1 rounded bg-black/70 border ${
            personas > 0 ? 'border-red-500 text-red-300' : 'border-gray-700 text-gray-400'
          }`}>
            {ultimoResumen}
          </span>
        )}
      </div>
    </>
  )
}
