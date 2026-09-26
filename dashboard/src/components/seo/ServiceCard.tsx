import Link from 'next/link'
import Image from 'next/image'
import type { ServicioContent } from '@/lib/content'

const SERVICE_IMAGES: Record<string, string> = {
  'monitoreo-de-alarmas-24-7': '/central-monitoreo.webp',
  'camaras-de-seguridad': '/camaras-cctv.webp',
  'camaras-ip': '/camaras-cctv.webp',
  'cerco-electrico': '/cerco-electrico.webp',
  'alarmas-para-casa': '/vetti-click-app.webp',
  'alarmas-para-negocios': '/dsc-power.webp',
  'alarma-con-app': '/vetti-click-app.webp',
  'sistema-alarma-inalambrico': '/vetti-alarm.webp',
  'sistema-alarma-cableada': '/dsc-pk5501.webp',
  'sistemas-de-alarma-para-empresas': '/dsc-panels.webp',
  'prevencion-de-robo': '/prevencion-robo.webp',
  'deteccion-de-incendio': '/deteccion-incendio.webp',
  'control-de-acceso': '/dsc-panels.webp',
  'mantencion-de-sistemas-de-seguridad': '/central-monitoreo.webp',
}

export default function ServiceCard({ servicio }: { servicio: ServicioContent }) {
  const imgSrc = SERVICE_IMAGES[servicio.slug] || '/central-monitoreo.webp'

  return (
    <Link
      href={`/servicios/${servicio.slug}`}
      className="apple-card-dark overflow-hidden flex flex-col justify-between group border border-[#1e3a5f] hover:border-[#2997ff]/60 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,102,204,0.25)] rounded-2xl bg-[#0a1628]"
    >
      <div>
        {/* Imagen del Servicio en WebP */}
        <div className="relative h-44 w-full bg-[#050d1a] overflow-hidden">
          <Image
            src={imgSrc}
            alt={servicio.title}
            width={600}
            height={380}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent opacity-90" />
          
          <div className="absolute top-3 right-3 bg-[#050d1a]/85 backdrop-blur-md border border-[#1e3a5f] rounded-full px-2.5 py-0.5 text-[10.5px] font-mono text-[#2997ff]">
            Cobertura Local
          </div>
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-2.5 text-left">
          <h3 className="text-lg font-semibold text-white tracking-tight group-hover:text-[#2997ff] transition-colors">
            {servicio.title}
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-3">
            {servicio.description}
          </p>
        </div>
      </div>

      <div className="px-5 pb-5 pt-3 text-left flex items-center justify-between border-t border-[#1e3a5f]/40 mt-2">
        <span className="text-xs font-semibold text-[#2997ff] group-hover:underline flex items-center gap-1">
          Ver detalles y planes →
        </span>
        <span className="text-[11px] font-mono text-slate-400">
          Respuesta &lt; 2 min
        </span>
      </div>
    </Link>
  )
}
