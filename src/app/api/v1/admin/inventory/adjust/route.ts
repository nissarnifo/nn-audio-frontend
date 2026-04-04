import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (admin instanceof NextResponse) return admin

    const body = await req.json()
    const { variantId, qty, note } = body

    if (!variantId || typeof qty !== 'number') {
      return err('variantId and qty are required', 400)
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    })

    if (!variant) return err('Variant not found', 404)

    const newQty = Math.max(0, variant.stockQty + qty)

    const [updated] = await prisma.$transaction([
      prisma.productVariant.update({
        where: { id: variantId },
        data: { stockQty: newQty },
      }),
      prisma.stockMovement.create({
        data: {
          variantId,
          type: 'ADJUSTMENT',
          qty,
          note: note ?? null,
        },
      }),
    ])

    return NextResponse.json({ id: updated.id, stock_qty: updated.stockQty })
  } catch (e) {
    return err('Failed to adjust stock', 500)
  }
}
