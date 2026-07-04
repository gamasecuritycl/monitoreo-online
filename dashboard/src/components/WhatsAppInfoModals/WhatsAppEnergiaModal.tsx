import React from 'react'

interface Props { onClose: () => void }

export default function WhatsAppEnergiaModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="bg-yellow-700 text-white px-2 py-1 flex justify-between items-center shrink-0">
          <div className="font-bold text-sm tracking-wide">⚡ ALERTAS DE ENERGÍA ELÉCTRICA</div>
          <button onClick={onClose} className="bg-[#c0c0c0] text-black font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 leading-none hover:bg-[#d0d0d0]">X</button>
        </div>
        <div className="p-4 overflow-y-auto text-xs text-black font-bold leading-relaxed">
          <div className="bg-yellow-50 border-2 border-yellow-400 p-3 mb-3">
            <div className="text-yellow-800 text-sm font-bold mb-2">DETECCIÓN AUTOMÁTICA</div>
            <p>Cuando Scorpion detecta una falla de energía eléctrica, el sistema envía automáticamente un WhatsApp al cliente con la siguiente información:</p>
          </div>

          <div className="bg-gray-50 border border-gray-300 p-3 mb-3">
            <div className="text-gray-800 font-bold mb-2">MENSAJE ENVIADO AL CLIENTE</div>
            <div className="bg-white border border-gray-300 p-2 font-mono text-[10px]">
              ⚡ ALERTA DE ENERGÍA ELÉCTRICA<br/><br/>
              Cliente: [CUENTA] - [NOMBRE]<br/>
              Dirección: [DIRECCIÓN]<br/>
              Hora: [FECHA Y HORA]<br/><br/>
              Se ha detectado un corte o falla de energía eléctrica.<br/>
              Su sistema de seguridad está operando con batería de respaldo.<br/>
              Tiempo estimado de batería: 72 horas.<br/><br/>
              Responda OK para confirmar recepción.<br/>
              Si necesita asistencia, responda AYUDA.
            </div>
          </div>

          <div className="bg-green-50 border border-green-300 p-3 mb-3">
            <div className="text-green-800 font-bold mb-1">ACUSE DE RECIBO</div>
            <p>El cliente debe responder <span className="bg-green-200 px-1">OK</span> para confirmar que recibió la notificación.</p>
            <p className="mt-1">Si responde <span className="bg-orange-200 px-1">AYUDA</span>, se activa el circuito de escalamiento.</p>
          </div>

          <div className="bg-blue-50 border border-blue-300 p-3">
            <div className="text-blue-800 font-bold mb-1">INFORMACIÓN EN EL MENSAJE</div>
            <ul className="list-disc ml-4 space-y-1">
              <li><strong>Tipo de evento:</strong> FALLA ENERGÍA ELÉCTRICA</li>
              <li><strong>Estado del sistema:</strong> Operando con batería de respaldo</li>
              <li><strong>Tiempo estimado:</strong> 72 horas con batería</li>
              <li><strong>Acción requerida:</strong> Confirmar recepción (OK)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
