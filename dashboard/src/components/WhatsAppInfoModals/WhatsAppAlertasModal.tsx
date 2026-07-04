import React from 'react'

interface Props { onClose: () => void }

export default function WhatsAppAlertasModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center shrink-0">
          <div className="font-bold text-sm tracking-wide">WHATSAPP - SISTEMA DE ALERTAS</div>
          <button onClick={onClose} className="bg-[#c0c0c0] text-black font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 leading-none hover:bg-[#d0d0d0]">X</button>
        </div>
        <div className="p-4 overflow-y-auto text-xs text-black font-bold leading-relaxed">
          <div className="bg-[#e0e0e0] border border-gray-400 p-3 mb-3">
            <div className="text-[#000080] text-sm font-bold mb-2">COMO FUNCIONA</div>
            <p className="mb-2">Cuando se detecta una alarma en el sistema Scorpion, se envía automáticamente un WhatsApp al cliente registrado.</p>
            <p>El sistema analiza el patrón de eventos para determinar la severidad:</p>
          </div>

          <div className="bg-green-50 border border-green-300 p-3 mb-3">
            <div className="text-green-800 font-bold mb-1">NOTIFICACIÓN INFORMATIVA (1 zona, 1 evento)</div>
            <p>Se envía cuando hay una sola activación en una zona.</p>
            <p className="text-gray-600 mt-1">Respuesta del cliente: AYUDA (si necesita asistencia)</p>
          </div>

          <div className="bg-red-50 border border-red-300 p-3 mb-3">
            <div className="text-red-800 font-bold mb-1">ALERTA CRÍTICA (múltiples zonas o eventos repetidos)</div>
            <p>Se activa cuando hay 2+ activaciones o múltiples zonas afectadas.</p>
            <p className="text-gray-600 mt-1">Se informa: "SE DESPACHARÁ UNIDAD DE EMERGENCIA"</p>
          </div>

          <div className="bg-blue-50 border border-blue-300 p-3 mb-3">
            <div className="text-blue-800 font-bold mb-1">RESPUESTAS DEL CLIENTE</div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="bg-white border border-gray-300 p-2 text-center">
                <div className="font-bold text-green-700">OK</div>
                <div className="text-[10px]">Todo controlado</div>
              </div>
              <div className="bg-white border border-gray-300 p-2 text-center">
                <div className="font-bold text-orange-700">AYUDA</div>
                <div className="text-[10px]">Solicita asistencia</div>
              </div>
              <div className="bg-white border border-gray-300 p-2 text-center">
                <div className="font-bold text-gray-700">SILENCIO</div>
                <div className="text-[10px]">No molestar 1hr</div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-300 p-3">
            <div className="text-yellow-800 font-bold mb-1">CIRCUITO DE ESCALAMIENTO</div>
            <p>Si el cliente no responde en 5 minutos:</p>
            <ul className="list-disc ml-4 mt-1">
              <li>Se notifica al contacto secundario</li>
              <li>Si tampoco responde en 3 min → contacto terciario</li>
              <li>Se abre canal directo con operador</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
