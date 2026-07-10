import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import QuienesSomos from '@/components/landing/QuienesSomos'
import Servicios from '@/components/landing/Servicios'
import ClientesSection from '@/components/landing/ClientesSection'
import Contacto from '@/components/landing/Contacto'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0e1a]">
      <Navbar />
      <Hero />
      <QuienesSomos />
      <Servicios />
      <ClientesSection />
      <Contacto />
      <Footer />
    </main>
  )
}
