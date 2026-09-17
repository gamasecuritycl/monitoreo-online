import type { Metadata, Viewport } from 'next'
import AreaClientesPortal from '@/components/portal/AreaClientesPortal'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#030712'
}

export const metadata: Metadata = {
  title: 'Mi Alarma Gama · Portal de Abonados HomeKit',
  description: 'Portal de Seguridad & Monitoreo en Tiempo Real para Abonados de Gama Seguridad'
}

export default function PortalPage() {
  return <AreaClientesPortal />
}
