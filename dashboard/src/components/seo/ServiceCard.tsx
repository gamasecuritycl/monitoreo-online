import Link from 'next/link'
import type { ServicioContent } from '@/lib/content'

export default function ServiceCard({ servicio }: { servicio: ServicioContent }) {
  return (
    <Link
      href={`/servicios/${servicio.slug}`}
      className="apple-card-dark p-6 block group hover:border-[#2997ff]/50 transition-colors"
    >
      <h3 className="text-white font-semibold mb-2 group-hover:text-[#2997ff] transition-colors">
        {servicio.title}
      </h3>
      <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">{servicio.description}</p>
      <span className="inline-block mt-4 text-sm text-[#2997ff]">Ver más →</span>
    </Link>
  )
}
