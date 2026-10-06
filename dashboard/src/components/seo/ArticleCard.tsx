import Link from 'next/link'
import type { ArticuloContent } from '@/lib/content'

function getCategoria(slug: string): { label: string; badgeColor: string; icon: string } {
  if (slug.includes('verisure') || slug.includes('adt') || slug.includes('comparativa') || slug.includes('cuanto-cuesta')) {
    return { label: 'Precios & Comparativas', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: '💰' }
  }
  if (slug.includes('casa') || slug.includes('inalambrica') || slug.includes('app-celular') || slug.includes('domotica')) {
    return { label: 'Alarmas Residenciales', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: '🏠' }
  }
  if (slug.includes('empresa') || slug.includes('comercio') || slug.includes('negocio') || slug.includes('control-de-acceso') || slug.includes('redes')) {
    return { label: 'Seguridad Empresas', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: '🏢' }
  }
  if (slug.includes('camara') || slug.includes('cctv') || slug.includes('cerco') || slug.includes('incendio') || slug.includes('citofonia')) {
    return { label: 'CCTV & Perimetral', badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30', icon: '📹' }
  }
  return { label: 'Guía Especializada', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '🛡️' }
}

export default function ArticleCard({ articulo }: { articulo: ArticuloContent }) {
  const cat = getCategoria(articulo.slug)

  return (
    <Link
      href={`/blog/${articulo.slug}`}
      className="group flex flex-col justify-between bg-gradient-to-b from-slate-900/90 to-slate-950/90 rounded-2xl p-6 border border-slate-800/80 hover:border-sky-500/50 hover:shadow-2xl hover:shadow-sky-950/50 transition-all duration-300 hover:-translate-y-1"
    >
      <div>
        {/* Categoría y Tiempo */}
        <div className="flex items-center justify-between gap-2 mb-4 text-xs font-mono">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${cat.badgeColor}`}>
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </span>
          <span className="text-slate-400 font-sans flex items-center gap-1">
            ⏱️ {articulo.readingMinutes} min
          </span>
        </div>

        {/* Título */}
        <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-sky-400 transition-colors leading-snug tracking-tight mb-3">
          {articulo.title}
        </h3>

        {/* Descripción */}
        <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 mb-6">
          {articulo.description}
        </p>
      </div>

      {/* Footer de la tarjeta */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <time dateTime={articulo.date} className="text-slate-500 font-mono">
          {articulo.date}
        </time>
        <span className="text-sky-400 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
          Leer análisis <span>→</span>
        </span>
      </div>
    </Link>
  )
}
