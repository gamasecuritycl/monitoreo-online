'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'

export default function LiveCameraPage() {
  const params = useParams()
  const cuenta = (params?.cuenta as string || '').toUpperCase()
  const [activeCam, setActiveCam] = useState<'cam1' | 'cam2' | 'cam3'>('cam1')

  // Servidor de Medios Cloud central
  const MEDIA_SERVER_HOST = 'cloud.gamasecurity.cl'

  // El stream ID para cada cámara
  const streamId = activeCam === 'cam1' ? cuenta : `${cuenta}-${activeCam}`

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col font-sans select-none">
      {/* Header */}
      <header className="bg-[#0f131a] border-b border-gray-800 py-3 px-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <div>
            <h1 className="text-sm font-black tracking-wider text-green-400">GAMA SEGURIDAD</h1>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none">VERIFICACIÓN POR VIDEO</p>
          </div>
        </div>
        <div className="bg-red-950/80 border border-red-800 text-red-400 font-mono text-[9px] font-black px-2 py-0.5 rounded animate-pulse">
          🔴 EN VIVO
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 flex flex-col p-4 max-w-4xl w-full mx-auto justify-between gap-4">
        
        {/* Abonado Card */}
        <div className="bg-[#0f131a] border border-gray-800 p-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-2 shadow">
          <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase">Código Abonado</div>
            <div className="text-lg font-black text-white font-mono">{cuenta || 'N/A'}</div>
          </div>
          <div className="flex gap-2.5">
            <div className="bg-[#121824] border border-gray-800 px-3 py-1.5 rounded text-center min-w-[80px]">
              <div className="text-[8px] text-gray-500 uppercase">Señal</div>
              <div className="text-xs font-bold text-green-400">ONLINE</div>
            </div>
            <div className="bg-[#121824] border border-gray-800 px-3 py-1.5 rounded text-center min-w-[80px]">
              <div className="text-[8px] text-gray-500 uppercase">Encriptación</div>
              <div className="text-xs font-bold text-gray-300">WHEP / TLS</div>
            </div>
          </div>
        </div>

        {/* Video Player Box */}
        <div className="flex-1 bg-black border border-gray-800 rounded-lg overflow-hidden relative shadow-inner aspect-video flex flex-col justify-center items-center min-h-[250px]">
          {cuenta ? (
            <iframe
              key={streamId}
              src={`http://${MEDIA_SERVER_HOST}:8889/${streamId.toLowerCase()}`}
              className="w-full h-full border-0 absolute inset-0"
              allow="autoplay; encrypted-media; picture-in-picture"
              title={`Streaming en vivo ${activeCam}`}
            />
          ) : (
            <div className="text-gray-500 text-xs font-mono">ID de cuenta inválido o ausente</div>
          )}
          {/* Overlay HUD */}
          <div className="absolute top-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[8px] tracking-wider z-20 font-mono text-gray-300">
            {activeCam.toUpperCase()} · DIRECT FEED
          </div>
        </div>

        {/* Selector de Canales */}
        <div className="grid grid-cols-3 gap-2">
          {(['cam1', 'cam2', 'cam3'] as const).map((cam) => {
            const label = cam === 'cam1' ? 'CAM-01 (Frontis)' : cam === 'cam2' ? 'CAM-02 (Lateral)' : 'CAM-03 (Bodega)'
            const active = activeCam === cam
            return (
              <button
                key={cam}
                onClick={() => setActiveCam(cam)}
                className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                  active
                    ? 'bg-green-700 text-white border-green-500 shadow-md shadow-green-950/20'
                    : 'bg-[#0f131a] text-gray-400 border-gray-800 hover:bg-[#151a24] hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Info/Warning footer */}
        <div className="bg-[#121620]/50 border border-gray-900 rounded p-2.5 text-[9px] text-gray-500 leading-normal font-mono text-center">
          Esta transmisión es privada y está sujeta a los protocolos de seguridad de Gama Seguridad.
          <br />
          No comparta este enlace con terceros no autorizados.
        </div>
      </main>
    </div>
  )
}
