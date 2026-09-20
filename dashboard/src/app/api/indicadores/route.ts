import { NextResponse } from 'next/server'

interface CacheIndicadores {
  data: any
  timestamp: number
}

let memoryCache: CacheIndicadores | null = null
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hora de caché

export async function GET() {
  try {
    const now = Date.now()
    if (memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        cached: true,
        ...memoryCache.data
      })
    }

    // Petición a mindicador.cl (Gratis, sin API Key)
    const res = await fetch('https://mindicador.cl/api', {
      headers: {
        'User-Agent': 'GamaSecurity-CommandCenter/2.0'
      },
      next: { revalidate: 3600 }
    })

    if (!res.ok) {
      throw new Error(`mindicador.cl respondió con status ${res.status}`)
    }

    const json = await res.json()

    const payload = {
      uf: {
        valor: json.uf?.valor || 38500,
        fecha: json.uf?.fecha || new Date().toISOString(),
        nombre: json.uf?.nombre || 'Unidad de Fomento (UF)'
      },
      dolar: {
        valor: json.dolar?.valor || 950,
        fecha: json.dolar?.fecha || new Date().toISOString()
      },
      utm: {
        valor: json.utm?.valor || 67000,
        fecha: json.utm?.fecha || new Date().toISOString()
      },
      origen: 'mindicador.cl (Banco Central de Chile)',
      actualizado_at: new Date().toISOString()
    }

    memoryCache = {
      data: payload,
      timestamp: now
    }

    return NextResponse.json({
      success: true,
      cached: false,
      ...payload
    })
  } catch (error: any) {
    console.warn('[API INDICADORES] Error consultando mindicador.cl, usando valores de respaldo:', error?.message)
    
    // Si la API falla o hay problemas de red, retornar valores de respaldo razonables
    const fallback = {
      uf: {
        valor: 38550.00,
        fecha: new Date().toISOString(),
        nombre: 'Unidad de Fomento (UF) - Estimado Respaldo'
      },
      dolar: {
        valor: 955.00,
        fecha: new Date().toISOString()
      },
      utm: {
        valor: 67200.00,
        fecha: new Date().toISOString()
      },
      origen: 'Respaldo Gama Seguridad',
      actualizado_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      cached: true,
      fallback: true,
      ...fallback
    })
  }
}
