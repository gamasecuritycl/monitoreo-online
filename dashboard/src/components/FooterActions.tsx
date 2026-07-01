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
    <footer className="shrink-0 bg-[#0d1117] border-t border-[#2a2a4a] px-3 py-2">
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {BOTONES.map((btn) => (
          <button
            key={btn.id}
            onClick={() => onModalOpen(btn.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e8e8e8] hover:bg-[#d4d4d4] active:bg-[#c0c0c0] border border-[#8a8a8a] rounded shadow-sm text-[11px] text-[#1a1a1a] font-medium transition-all min-w-[68px] select-none"
            style={{ fontFamily: "'Segoe UI', 'Tahoma', sans-serif" }}
          >
            <span className="text-sm leading-none">{btn.icon}</span>
            <span>{btn.label}</span>
          </button>
        ))}
      </div>
    </footer>
  )
}
