'use client'

import React, { useState } from 'react'
import Contacto from './Contacto'
import Footer from './Footer'
import CookieConsentBanner from './CookieConsentBanner'
import ModalLegalPublico, { PestañaLegal } from './ModalLegalPublico'

export default function LandingInteractiveLayer() {
  const [modalLegalOpen, setModalLegalOpen] = useState(false)
  const [pestañaLegalActiva, setPestañaLegalActiva] = useState<PestañaLegal>('privacidad')

  const handleOpenLegal = (pestaña: PestañaLegal) => {
    setPestañaLegalActiva(pestaña)
    setModalLegalOpen(true)
  }

  return (
    <>
      <Contacto onOpenLegal={handleOpenLegal} />
      <Footer onOpenLegal={handleOpenLegal} />
      <CookieConsentBanner onOpenLegal={handleOpenLegal} />
      <ModalLegalPublico
        isOpen={modalLegalOpen}
        onClose={() => setModalLegalOpen(false)}
        pestañaInicial={pestañaLegalActiva}
      />
    </>
  )
}
