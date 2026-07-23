import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dir = searchParams.get('dir') || 'right'

  try {
    const resp = await fetch(`http://127.0.0.1:8000/ptz?dir=${dir}`, {
      signal: AbortSignal.timeout(2000)
    })
    if (resp.ok) {
      return NextResponse.json({ status: 'ok', dir })
    }
  } catch (e) {}

  return NextResponse.json({ status: 'sent', dir })
}
