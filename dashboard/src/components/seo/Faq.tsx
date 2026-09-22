import type { FaqItem } from '@/lib/content'
import JsonLd from './JsonLd'

export default function Faq({ items, heading = 'Preguntas frecuentes' }: { items: FaqItem[]; heading?: string }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(i => ({
      '@type': 'Question', name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    })),
  }
  return (
    <section className="max-w-4xl mx-auto py-16 space-y-8">
      <JsonLd data={jsonLd} />
      <h2 className="apple-display-lg text-white text-center">{heading}</h2>
      <dl className="space-y-6">
        {items.map(i => (
          <div key={i.question} className="apple-card-dark p-6">
            <dt className="text-white font-semibold mb-2">{i.question}</dt>
            <dd className="text-slate-300 text-sm leading-relaxed">{i.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
