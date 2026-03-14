import { NextResponse } from 'next/server'
import { API_BASE_URL } from '@/config'

const HEALTH_URL = API_BASE_URL.replace('/api/v1', '') + '/health'

export async function GET() {
  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(60000) })
    if (res.ok) return NextResponse.json({ status: 'ok' })
    return NextResponse.json({ status: 'error' }, { status: 503 })
  } catch {
    return NextResponse.json({ status: 'sleeping' }, { status: 503 })
  }
}
