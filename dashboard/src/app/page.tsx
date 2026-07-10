import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import QuienesSomos from '@/components/landing/QuienesSomos'
import Servicios from '@/components/landing/Servicios'
import PorQueNosotros from '@/components/landing/PorQueNosotros'
import Tecnologia from '@/components/landing/Tecnologia'
import Testimonios from '@/components/landing/Testimonios'
import ClientesSection from '@/components/landing/ClientesSection'
import Contacto from '@/components/landing/Contacto'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050810]">
      <Navbar />
      <Hero />
      <QuienesSomos />
      <Servicios />
      <PorQueNosotros />
      <Tecnologia />
      <Testimonios />
      <ClientesSection />
      <Contacto />
      <Footer />
    </main>
  )
}
