import type { Metadata, Viewport } from 'next'
import PortalTecnicoMovil from '@/components/portal/PortalTecnicoMovil'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a'
}

export const metadata: Metadata = {
  title: 'Gama Seguridad | Módulo Técnico en Terreno',
  description: 'Portal Móvil de Atención Técnica PWA en Terreno para Gama Seguridad 24/7'
}

export default function TecnicoPage() {
  return <PortalTecnicoMovil />
}
