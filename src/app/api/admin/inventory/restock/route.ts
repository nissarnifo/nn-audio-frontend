export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, apiError } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
    const { variantId, qty, note } = await req.json()
    if (!variantId || !qty || qty < 1) {
      return NextResponse.json({ error: 'variantId and qty (≥1) are required' }, { status: 400 })
    }

    const [variant] = await prisma.$transaction([
      prisma.productVariant.update({ where: { id: variantId }, data: { stockQty: { increment: qty } } }),
      prisma.stockMovement.create({ data: { variantId, type: 'PURCHASE', qty, note: note || null } }),
    ])

    return NextResponse.json({ id: variant.id, stock_qty: variant.stockQty })
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
