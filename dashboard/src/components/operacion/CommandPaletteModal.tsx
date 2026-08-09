'use client'

import React, { useState, useEffect } from 'react'
import { Search, User, FileText, Wrench, DollarSign, Megaphone, ArrowRight, X, Sparkles } from 'lucide-react'

interface CommandPaletteItem {
  id: string
  titulo: string
  subtitulo: string
  categoria: 'Abonado' | 'Cliente' | 'Cotización' | 'Orden de Trabajo' | 'Factura' | 'Comando'
  accion: () => void
}

interface CommandPaletteModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectSearchItem: (query: string) => void
  onNavigateModule: (modId: string) => void
  clientesMaestros: Record<string, any>
  abonadosCentrosCosto: Record<string, any>
}

export default function CommandPaletteModal({
  isOpen,
  onClose,
  onSelectSearchItem,
  onNavigateModule,
  clientesMaestros,
  abonadosCentrosCosto
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState('')

  // Listener para escuchar atajo de teclado Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else setQuery('')
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Filtrar resultados
  const searchLower = query.toLowerCase().trim()

  const commandItems: CommandPaletteItem[] = [
    {
      id: 'cmd-ficha',
      titulo: 'Ir a Ficha 360° de Clientes',
      subtitulo: 'Búsqueda por abonado, señales en vivo y expediente maestro',
      categoria: 'Comando',
      accion: () => { onNavigateModule('ficha360'); onClose() }
    },
    {
      id: 'cmd-cot',
      titulo: 'Ir a Presupuestos & Cotizaciones',
      subtitulo: 'Gestión de DTE, cotizador rápido y pipeline comercial',
      categoria: 'Comando',
      accion: () => { onNavigateModule('presupuestos'); onClose() }
    },
    {
      id: 'cmd-[#2997ff]',
      titulo: 'Ir a Cobranzas & Abonos',
      subtitulo: 'Facturación del mes, saldos pendientes y registro de pagos',
      categoria: 'Comando',
      accion: () => { onNavigateModule('facturacion'); onClose() }
    },
    {
      id: 'cmd-[#34c759]',
      titulo: 'Ir a Servicios Técnicos (OTs)',
      subtitulo: 'Gestión de visitas técnicas, asignación y SLAs',
      categoria: 'Comando',
      accion: () => { onNavigateModule('serv_tecnico'); onClose() }
    },
    {
      id: 'cmd-[#ff9500]',
      titulo: 'Ir a Marketing B2B & Prospectos',
      subtitulo: 'Auto-descubrimiento V Región y campañas de email outreach',
      categoria: 'Comando',
      accion: () => { onNavigateModule('marketing'); onClose() }
    }
  ]

  // Búsqueda en abonados y clientes
  const dynamicItems: CommandPaletteItem[] = []

  if (searchLower.length > 0) {
    Object.entries(abonadosCentrosCosto || {}).forEach(([cuentaKey, ccVal]: [string, any]) => {
      const cCode = (cuentaKey || '').toLowerCase()
      const cAlias = String(ccVal?.alias_centro_costo || ccVal?.nombre || '').toLowerCase()
      const cRut = String(ccVal?.rut_cliente || '').toLowerCase()

      if (cCode.includes(searchLower) || cAlias.includes(searchLower) || cRut.includes(searchLower)) {
        dynamicItems.push({
          id: `cc-${cuentaKey}`,
          titulo: `Abonado #${cuentaKey.toUpperCase()} — ${ccVal?.alias_centro_costo || 'Centro de Costo'}`,
          subtitulo: `RUT: ${ccVal?.rut_cliente || 'N/A'} • ${ccVal?.direccion || 'Dirección Registrada'}`,
          categoria: 'Abonado',
          accion: () => {
            onSelectSearchItem(cuentaKey.toUpperCase())
            onNavigateModule('ficha360')
            onClose()
          }
        })
      }
    })

    Object.entries(clientesMaestros || {}).forEach(([rutKey, cliVal]: [string, any]) => {
      const rStr = String(cliVal?.rut || rutKey || '').toLowerCase()
      const nStr = String(cliVal?.razon_social || '').toLowerCase()

      if (rStr.includes(searchLower) || nStr.includes(searchLower)) {
        const yaExiste = dynamicItems.some(i => i.id === `cli-${rutKey}`)
        if (!yaExiste) {
          dynamicItems.push({
            id: `cli-${rutKey}`,
            titulo: `Cliente: ${cliVal?.razon_social || rutKey}`,
            subtitulo: `RUT: ${cliVal?.rut || rutKey} • ${cliVal?.cuentas_abonados?.length || 0} abonados asociados`,
            categoria: 'Cliente',
            accion: () => {
              onSelectSearchItem(cliVal?.rut || rutKey)
              onNavigateModule('ficha360')
              onClose()
            }
          })
        }
      }
    })
  }

  const resultadosMostrados = searchLower.length > 0
    ? [...dynamicItems.slice(0, 10), ...commandItems.filter(c => c.titulo.toLowerCase().includes(searchLower))]
    : commandItems

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4 font-sans animate-fadeIn">
      <div
        className="bg-[#0a1628] border border-[#1e3a5f] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col text-white transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Spotlight Input Header */}
        <div className="relative border-b border-[#1e3a5f] px-5 py-4 flex items-center gap-3 bg-[#050d1a]">
          <Search className="h-5 w-5 text-[#2997ff] stroke-[1.5] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por abonado (#0014, C7C9), cliente, RUT o ejecutar comando..."
            autoFocus
            className="w-full bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none font-mono"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-1 rounded bg-[#0f2240] border border-[#1e3a5f] text-[10px] text-slate-400 font-mono">
              ESC para cerrar
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto max-h-[60vh] space-y-1">
          {resultadosMostrados.length > 0 ? (
            resultadosMostrados.map((item) => (
              <div
                key={item.id}
                onClick={item.accion}
                className="group flex items-center justify-between p-3.5 rounded-2xl hover:bg-[#0066cc]/15 border border-transparent hover:border-[#0066cc]/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#050d1a] border border-[#1e3a5f] flex items-center justify-center text-[#2997ff] group-hover:border-[#2997ff] transition-colors shrink-0">
                    {item.categoria === 'Abonado' ? <User className="h-4 w-4 stroke-[1.5]" /> :
                     item.categoria === 'Cliente' ? <FileText className="h-4 w-4 stroke-[1.5]" /> :
                     <Sparkles className="h-4 w-4 stroke-[1.5]" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-[#2997ff] transition-colors flex items-center gap-2">
                      <span>{item.titulo}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1e3a5f]/60 text-slate-300">
                        {item.categoria}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-sans">
                      {item.subtitulo}
                    </div>
                  </div>
                </div>

                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-[#2997ff] transition-colors opacity-0 group-hover:opacity-100" />
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              No se encontraron coincidencias para &ldquo;{query}&rdquo;. Prueba buscando un número de cuenta (ej. 0999) o RUT.
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="bg-[#050d1a] px-5 py-3 border-t border-[#1e3a5f] flex items-center justify-between text-[11px] text-slate-400 font-sans">
          <span>💡 Tip: Usa <strong>Cmd + K</strong> para abrir esta consola desde cualquier lugar</span>
          <span>Central Operativa GAMA</span>
        </div>
      </div>
    </div>
  )
}
