import type { Metadata, Viewport } from 'next'
import FichaActualizacionCliente from '@/components/portal/FichaActualizacionCliente'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0B2545'
}

export const metadata: Metadata = {
  title: 'Ficha Oficial de Actualización de Contactos · Gama Security',
  description: 'Portal de auto-actualización de información de abonados, contactos de emergencia y procedimientos de Gama Seguridad.'
}

export default function ActualizarClientePage() {
  return <FichaActualizacionCliente />
}
