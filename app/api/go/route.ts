import { NextRequest, NextResponse } from 'next/server'
import { openUrlFromToken } from '@/lib/token'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const t = (url.searchParams.get('t') || '').trim()
    if (!t) return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    const real = openUrlFromToken(t)
    return NextResponse.redirect(real, 302)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Invalid or expired link' }, { status: 400 })
  }
}


