import { NextResponse } from 'next/server'

// Instant response — everything is on Vercel, no external backend to warm up
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
