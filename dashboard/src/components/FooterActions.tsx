'use client'

interface FooterActionsProps {
  onModalOpen: (id: string) => void
}

const BOTONES = [
  { id: 'tools', label: 'Tools', icon: '🔧' },
  { id: 'user-key', label: 'User', icon: '🔑' },
  { id: 'file-edit', label: 'File', icon: '📝' },
  { id: 'network', label: 'Network', icon: '🔗' },
  { id: 'shield', label: 'Shield', icon: '🛡️' },
  { id: 'book', label: 'Library', icon: '📖' },
  { id: 'grid-check', label: 'Grid', icon: '✅' },
  { id: 'list-details', label: 'List', icon: '📋' },
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'archive', label: 'Archive', icon: '📦' },
]

export default function FooterActions({ onModalOpen }: FooterActionsProps) {
  return (
    <footer className="shrink-0 bg-[#0d1225] border-t border-[#1a2340] px-2 py-1.5">
      <div className="flex items-center justify-center gap-1">
        {BOTONES.map((btn) => (
          <button
            key={btn.id}
            onClick={() => onModalOpen(btn.id)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded text-[10px] text-slate-500 hover:text-slate-200 hover:bg-blue-500/10 hover:border-blue-500/30 border border-transparent transition-all min-w-[56px]"
          >
            <span className="text-sm">{btn.icon}</span>
            <span className="tracking-wider uppercase">{btn.label}</span>
          </button>
        ))}
      </div>
    </footer>
  )
}
