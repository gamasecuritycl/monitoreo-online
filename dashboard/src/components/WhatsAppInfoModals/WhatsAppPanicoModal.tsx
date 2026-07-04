import React from 'react'

interface Props { onClose: () => void }

export default function WhatsAppPanicoModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="bg-red-800 text-white px-2 py-1 flex justify-between items-center shrink-0">
          <div className="font-bold text-sm tracking-wide">🚨 BOTÓN DE PÁNICO - WHATSAPP</div>
          <button onClick={onClose} className="bg-[#c0c0c0] text-black font-bold border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 px-2 leading-none hover:bg-[#d0d0d0]">X</button>
        </div>
        <div className="p-4 overflow-y-auto text-xs text-black font-bold leading-relaxed">
          <div className="bg-red-50 border-2 border-red-400 p-3 mb-3">
            <div className="text-red-800 text-sm font-bold mb-2">PROTOCOLO DE EMERGENCIA</div>
            <p>El cliente puede activar el protocolo de pánico enviando un mensaje de WhatsApp con cualquiera de estas palabras:</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="bg-red-600 text-white px-2 py-1 rounded">SOCORRO</span>
              <span className="bg-red-600 text-white px-2 py-1 rounded">PÁNICO</span>
              <span className="bg-red-600 text-white px-2 py-1 rounded">SOS</span>
              <span className="bg-red-600 text-white px-2 py-1 rounded">EMERGENCIA</span>
              <span className="bg-red-600 text-white px-2 py-1 rounded">AYUDA YA</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-300 p-3 mb-3">
            <div className="text-blue-800 font-bold mb-1">QUE OCURRE AL ACTIVARLO</div>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Se confirma la emergencia al cliente</li>
              <li>Se notifica a TODOS los contactos de escalamiento</li>
              <li>Si el cliente comparte ubicación GPS, se envía link a Google Maps</li>
              <li>Se registra el evento con estado "EMERGENCIA" en la base de datos</li>
              <li>El operador es alertado inmediatamente</li>
            </ol>
          </div>

          <div className="bg-green-50 border border-green-300 p-3 mb-3">
            <div className="text-green-800 font-bold mb-1">COMPARTIR UBICACIÓN GPS</div>
            <p>El cliente puede enviar su ubicación desde WhatsApp:</p>
            <ol className="list-decimal ml-4 mt-1">
              <li>En WhatsApp, tocar el ícono de adjuntar (📎)</li>
              <li>Seleccionar "Ubicación"</li>
              <li>Compartir ubicación actual</li>
            </ol>
            <p className="mt-2 text-gray-600">El sistema extraerá las coordenadas y generará un link directo a Google Maps.</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-300 p-3">
            <div className="text-yellow-800 font-bold mb-1">MENSAJE A CONTACTOS DE ESCALAMIENTO</div>
            <div className="bg-white border border-gray-300 p-2 mt-1 font-mono text-[10px]">
              🚨 EMERGENCIA - [CUENTA]<br/>
              Contacto: [NOMBRE]<br/>
              📍 GPS: https://maps.google.com/?q=[LAT],[LNG]<br/>
              Despache unidad urgente.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
