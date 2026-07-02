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
    <footer className="shrink-0 bg-[#070b13] border-t border-[#1e293b] px-3 py-2">
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {BOTONES.map((btn) => (
          <button
            key={btn.id}
            onClick={() => onModalOpen(btn.id)}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#1e293b] hover:bg-[#2d3a4f] text-slate-200 border border-slate-700 hover:border-slate-500 rounded text-[11px] font-semibold transition-all min-w-[80px] select-none cursor-pointer shadow-[inset_1px_1px_0px_rgba(255,255,255,0.15),2px_2px_4px_rgba(0,0,0,0.4)] active:translate-y-[1px] active:shadow-none"
            style={{ fontFamily: "'Consolas', 'Courier New', monospace" }}
          >
            <span className="text-[12px] leading-none">{btn.icon}</span>
            <span>{btn.label.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </footer>
  )
}
