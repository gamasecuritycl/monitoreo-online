import Link from 'next/link'
import JsonLd from './JsonLd'

interface Crumb { label: string; href: string }

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ label: 'Inicio', href: '/' }, ...items]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({
      '@type': 'ListItem', position: i + 1, name: c.label,
      item: `https://www.gamasecurity.cl${c.href}`,
    })),
  }
  return (
    <>
      <JsonLd data={jsonLd} />
      <nav aria-label="Migas de pan" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-slate-400">
        <ol className="flex flex-wrap items-center gap-2">
          {all.map((c, i) => (
            <li key={`${c.href}-${i}`} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden>›</span>}
              {i === all.length - 1 ? (
                <span className="text-white" aria-current="page">{c.label}</span>
              ) : (
                <Link href={c.href} className="hover:text-[#2997ff] transition-colors">{c.label}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
