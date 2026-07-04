import { NextResponse } from 'next/server'
import { sendMessage } from '@/lib/whatsapp'

export async function GET() {
  const telefono = '56991016912'
  const texto = [
    '🛡️ *GAMA SEGURIDAD*',
    '━━━━━━━━━━━━━━━━━━━━━',
    '',
    '⚠️ *NOTIFICACIÓN* - PRUEBA SISTEMA',
    '',
    '👤 Cliente: *0001* - PRUEBA',
    '📍 Dirección: Av. Test 1234',
    '🕐 Hora: ' + new Date().toLocaleString('es-CL'),
    '',
    'Hemos registrado una activación en su sistema.',
    'Estamos atentos.',
    '',
    '━━━━━━━━━━━━━━━━━━━━━',
    'Responda:',
    '✅ *OK* → Confirmado',
    '🆘 *AYUDA* → Necesito asistencia',
    '',
    '⚡ Si no responde en 1 hora,',
    'no se volverá a notificar.',
    '',
    '_Gama Seguridad - Monitoreo 24/7_',
  ].join('\n')

  const enviado = await sendMessage(telefono, texto)

  return NextResponse.json({
    success: enviado,
    mensaje: enviado ? 'Prueba enviada a ' + telefono : 'Error al enviar',
  })
}
