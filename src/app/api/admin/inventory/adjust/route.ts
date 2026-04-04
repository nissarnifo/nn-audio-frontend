import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, apiError } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
    const { variantId, qty, note } = await req.json()
    if (!variantId || qty === undefined) {
      return NextResponse.json({ error: 'variantId and qty are required' }, { status: 400 })
    }

    const current = await prisma.productVariant.findUnique({ where: { id: variantId } })
    if (!current) return NextResponse.json({ error: 'Variant not found' }, { status: 404 })

    const newQty = Math.max(0, current.stockQty + qty)
    const [variant] = await prisma.$transaction([
      prisma.productVariant.update({ where: { id: variantId }, data: { stockQty: newQty } }),
      prisma.stockMovement.create({ data: { variantId, type: 'ADJUSTMENT', qty, note: note || null } }),
    ])

    return NextResponse.json({ id: variant.id, stock_qty: variant.stockQty })
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
