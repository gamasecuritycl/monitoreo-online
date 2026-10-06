'use client'

import React, { useState, useMemo } from 'react'
import type { ArticuloContent } from '@/lib/content'
import ArticleCard from '@/components/seo/ArticleCard'

interface Props {
  articulos: ArticuloContent[]
}

const CATEGORIAS = [
  { id: 'todas', label: 'Todos los Artículos', icon: '📚' },
  { id: 'precios', label: 'Precios & Comparativas', icon: '💰' },
  { id: 'residencial', label: 'Alarmas Residenciales', icon: '🏠' },
  { id: 'empresas', label: 'Seguridad Empresas', icon: '🏢' },
  { id: 'cctv', label: 'CCTV & Perimetral', icon: '📹' },
]

export default function BlogListClient({ articulos }: Props) {
  const [categoriaActiva, setCategoriaActiva] = useState('todas')
  const [busqueda, setBusqueda] = useState('')

  const articulosFiltrados = useMemo(() => {
    return articulos.filter((a) => {
      // Filtro por categoría
      if (categoriaActiva === 'precios') {
        const match = a.slug.includes('verisure') || a.slug.includes('adt') || a.slug.includes('comparativa') || a.slug.includes('cuanto-cuesta')
        if (!match) return false
      } else if (categoriaActiva === 'residencial') {
        const match = a.slug.includes('casa') || a.slug.includes('inalambrica') || a.slug.includes('app-celular') || a.slug.includes('domotica')
        if (!match) return false
      } else if (categoriaActiva === 'empresas') {
        const match = a.slug.includes('empresa') || a.slug.includes('comercio') || a.slug.includes('negocio') || a.slug.includes('control-de-acceso') || a.slug.includes('redes')
        if (!match) return false
      } else if (categoriaActiva === 'cctv') {
        const match = a.slug.includes('camara') || a.slug.includes('cctv') || a.slug.includes('cerco') || a.slug.includes('incendio') || a.slug.includes('citofonia')
        if (!match) return false
      }

      // Filtro por búsqueda
      if (busqueda.trim()) {
        const term = busqueda.toLowerCase().trim()
        const matchText = (a.title + ' ' + a.description + ' ' + a.slug).toLowerCase()
        return matchText.includes(term)
      }

      return true
    })
  }, [articulos, categoriaActiva, busqueda])

  return (
    <div className="space-y-8">
      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between pb-6 border-b border-slate-800">
        {/* Pestañas de categoría */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIAS.map((cat) => {
            const activa = categoriaActiva === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setCategoriaActiva(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activa
                    ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/25 scale-105'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* Buscador */}
        <div className="relative min-w-[260px] sm:min-w-[320px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por marca, tema o precio..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
        <span>Mostrando {articulosFiltrados.length} de {articulos.length} artículos</span>
        {busqueda && <span>Filtrado por: "{busqueda}"</span>}
      </div>

      {/* Grilla de Artículos */}
      {articulosFiltrados.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articulosFiltrados.map((a) => (
            <ArticleCard key={a.slug} articulo={a} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4">
          <div className="text-4xl">🔎</div>
          <h3 className="text-xl font-bold text-white">No se encontraron artículos</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            No encontramos resultados para tu búsqueda. Prueba con otros términos como "Verisure", "ADT", "CCTV" o "Monitoreo".
          </p>
          <button
            onClick={() => {
              setCategoriaActiva('todas')
              setBusqueda('')
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition"
          >
            Restablecer Filtros
          </button>
        </div>
      )}
    </div>
  )
}
