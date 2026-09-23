'use client'

import React, { useState } from 'react'
import Contacto from './Contacto'
import Footer, { type FooterLink } from './Footer'
import CookieConsentBanner from './CookieConsentBanner'
import ModalLegalPublico, { PestañaLegal } from './ModalLegalPublico'

interface LandingInteractiveLayerProps {
  footerServicios: FooterLink[]
  footerComunas: FooterLink[]
  footerArticulos: FooterLink[]
}

export default function LandingInteractiveLayer({
  footerServicios,
  footerComunas,
  footerArticulos,
}: LandingInteractiveLayerProps) {
  const [modalLegalOpen, setModalLegalOpen] = useState(false)
  const [pestañaLegalActiva, setPestañaLegalActiva] = useState<PestañaLegal>('privacidad')

  const handleOpenLegal = (pestaña: PestañaLegal) => {
    setPestañaLegalActiva(pestaña)
    setModalLegalOpen(true)
  }

  return (
    <>
      <Contacto onOpenLegal={handleOpenLegal} />
      <Footer
        onOpenLegal={handleOpenLegal}
        servicios={footerServicios}
        comunas={footerComunas}
        articulos={footerArticulos}
      />
      <CookieConsentBanner onOpenLegal={handleOpenLegal} />
      <ModalLegalPublico
        isOpen={modalLegalOpen}
        onClose={() => setModalLegalOpen(false)}
        pestañaInicial={pestañaLegalActiva}
      />
    </>
  )
}
