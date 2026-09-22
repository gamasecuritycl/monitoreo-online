import Link from 'next/link'
import type { ComunaContent } from '@/lib/content'

export default function ComunaCard({ comuna }: { comuna: ComunaContent }) {
  return (
    <Link
      href={`/comunas/${comuna.region}/${comuna.slug}`}
      className="apple-card-dark p-5 block group hover:border-[#2997ff]/50 transition-colors"
    >
      <h3 className="text-white font-semibold group-hover:text-[#2997ff] transition-colors">
        {comuna.name}
      </h3>
      <p className="text-slate-400 text-xs mt-1 line-clamp-2">{comuna.description}</p>
    </Link>
  )
}
