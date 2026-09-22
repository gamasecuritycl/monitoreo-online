export default function Hashtags({ tags }: { tags: string[] }) {
  if (!tags?.length) return null
  return (
    <div className="flex flex-wrap gap-2 pt-8" aria-label="Etiquetas">
      {tags.map(t => (
        <span key={t} className="text-xs font-mono text-[#2997ff] bg-[#0f2240] border border-[#1e3a5f] rounded-full px-3 py-1">
          #{t}
        </span>
      ))}
    </div>
  )
}
