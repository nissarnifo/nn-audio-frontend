import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, err } = requireAdmin(req)
    if (err) return err
    const { variantId, qty, note } = await req.json() as { variantId: string; qty: number; note?: string }
    if (!variantId || !qty || qty < 1)
      return Response.json({ error: 'variantId and qty (≥1) are required' }, { status: 400 })

    const [variant] = await prisma.$transaction([
      prisma.productVariant.update({
        where: { id: variantId },
        data: { stockQty: { increment: qty } },
      }),
      prisma.stockMovement.create({
        data: { variantId, type: 'PURCHASE', qty, note: note || null },
      }),
    ])
    return Response.json({ id: variant.id, stock_qty: variant.stockQty })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
