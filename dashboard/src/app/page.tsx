import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Servicios from '@/components/landing/Servicios'
import Galeria from '@/components/landing/Galeria'
import QuienesSomos from '@/components/landing/QuienesSomos'
import Tecnologia from '@/components/landing/Tecnologia'
import Testimonios from '@/components/landing/Testimonios'
import CTAEmergencia from '@/components/landing/CTAEmergencia'
import Contacto from '@/components/landing/Contacto'
import Footer from '@/components/landing/Footer'

export const metadata = {
  title: 'GAMA SERVICIOS — Monitoreo y Seguridad Electrónica 24/7 en Chile',
  description: 'Empresa líder en monitoreo electrónico 24/7, instalación de cámaras, cercos eléctricos y sistemas de alarma. Certificados OS-10. Tecnología Scorpion.',
  keywords: 'seguridad, monitoreo, alarmas, cerco eléctrico, cámaras, Chile, Santiago, OS-10',
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050d1a]">
      <Navbar />
      <Hero />
      <Servicios />
      <Galeria />
      <QuienesSomos />
      <Tecnologia />
      <Testimonios />
      <CTAEmergencia />
      <Contacto />
      <Footer />
    </main>
  )
}
