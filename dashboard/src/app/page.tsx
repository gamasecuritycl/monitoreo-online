import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Servicios from '@/components/landing/Servicios'
import VettiShowcase from '@/components/landing/VettiShowcase'
import QuienesSomos from '@/components/landing/QuienesSomos'
import Tecnologia from '@/components/landing/Tecnologia'
import Testimonios from '@/components/landing/Testimonios'
import CTAEmergencia from '@/components/landing/CTAEmergencia'
import Contacto from '@/components/landing/Contacto'
import Footer from '@/components/landing/Footer'
import WhatsAppFloating from '@/components/landing/WhatsAppFloating'

export const metadata = {
  title: 'GAMA SECURITY — Monitoreo Electrónico y Alarmas Vetti 24/7 en Chile',
  description: 'Empresa líder en monitoreo electrónico 24/7, Alarma Inteligente Vetti con App NT CLICK, teclados DSC PK5501, cámaras 4K y cercos eléctricos. Más de 20 años de experiencia protegiendo a Chile. www.gamasecurity.cl',
  keywords: 'seguridad, monitoreo 24/7, Alarma Vetti, App NT CLICK, DSC PK5501, cercos eléctricos, cámaras IA, Chile, GAMA Security, gamasecurity.cl',
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050d1a] relative">
      <Navbar />
      <Hero />
      <Servicios />
      <VettiShowcase />
      <QuienesSomos />
      <Tecnologia />
      <Testimonios />
      <CTAEmergencia />
      <Contacto />
      <Footer />
      <WhatsAppFloating />
    </main>
  )
}
