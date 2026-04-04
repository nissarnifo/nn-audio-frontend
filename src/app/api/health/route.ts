export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/health — verify DB connectivity and product count
export async function GET() {
  try {
    const [productCount, activeCount] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
    ])
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      products: { total: productCount, active: activeCount },
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[health] DB error:', e)
    return NextResponse.json(
      { status: 'error', db: 'disconnected', error: String(e), timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
