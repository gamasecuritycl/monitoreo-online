import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Servicios from '@/components/landing/Servicios'
import QuienesSomos from '@/components/landing/QuienesSomos'
import Tecnologia from '@/components/landing/Tecnologia'
import Testimonios from '@/components/landing/Testimonios'
import CTAEmergencia from '@/components/landing/CTAEmergencia'
import Contacto from '@/components/landing/Contacto'
import Footer from '@/components/landing/Footer'

export const metadata = {
  title: 'GAMA SECURITY — Monitoreo Electrónico y Protección 24/7 en Chile',
  description: 'Empresa líder en monitoreo electrónico 24/7, cámaras 4K con IA, cercos eléctricos y alarmas DSC Power Series. Más de 20 años de experiencia protegiendo a Chile. www.gamasecurity.cl',
  keywords: 'seguridad, monitoreo 24/7, alarmas DSC, cercos eléctricos, cámaras IA, Chile, GAMA Security, gamasecurity.cl',
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050d1a]">
      <Navbar />
      <Hero />
      <Servicios />
      <QuienesSomos />
      <Tecnologia />
      <Testimonios />
      <CTAEmergencia />
      <Contacto />
      <Footer />
    </main>
  )
}
