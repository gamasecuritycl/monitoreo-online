import Link from 'next/link'
import type { ArticuloContent } from '@/lib/content'

export default function ArticleCard({ articulo }: { articulo: ArticuloContent }) {
  return (
    <Link
      href={`/blog/${articulo.slug}`}
      className="apple-card-dark p-6 block group hover:border-[#2997ff]/50 transition-colors"
    >
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 font-mono">
        <time dateTime={articulo.date}>{articulo.date}</time>
        <span>· {articulo.readingMinutes} min de lectura</span>
      </div>
      <h3 className="text-white font-semibold group-hover:text-[#2997ff] transition-colors">
        {articulo.title}
      </h3>
      <p className="text-slate-400 text-sm mt-2 line-clamp-3">{articulo.description}</p>
    </Link>
  )
}
