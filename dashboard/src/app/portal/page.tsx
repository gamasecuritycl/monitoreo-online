import type { Metadata, Viewport } from 'next'
import PortalAbonado from '@/components/portal/PortalAbonado'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#070b14'
}

export const metadata: Metadata = {
  title: 'Mi Alarma Gama | Portal de Abonados',
  description: 'Portal de Seguridad & Monitoreo en Tiempo Real para Abonados de Gama Seguridad'
}

export default function PortalPage() {
  return <PortalAbonado />
}
