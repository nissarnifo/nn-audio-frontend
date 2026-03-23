import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'
import { sendStockAlertEmail } from '@/lib/notify'

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
      include: { product: { select: { name: true, slug: true } } },
    })

    if (!variant) return err('Variant not found', 404)

    const wasOutOfStock = variant.stockQty === 0

    const [updated] = await prisma.$transaction([
      prisma.productVariant.update({
        where: { id: variantId },
        data: { stockQty: { increment: qty } },
      }),
      prisma.stockMovement.create({
        data: {
          variantId,
          type: 'PURCHASE',
          qty,
          note: note ?? null,
        },
      }),
    ])

    if (wasOutOfStock) {
      const alerts = await prisma.stockAlert.findMany({
        where: { variantId, notifiedAt: null },
      })

      const frontendUrl = process.env.FRONTEND_URL || 'https://nnaudio.in'

      for (const alert of alerts) {
        sendStockAlertEmail({
          toEmail: alert.email,
          productName: variant.product.name,
          productSlug: variant.product.slug,
          variantLabel: variant.label,
          frontendUrl,
        }).catch(() => {})
      }

      if (alerts.length > 0) {
        await prisma.stockAlert.updateMany({
          where: { id: { in: alerts.map((a) => a.id) } },
          data: { notifiedAt: new Date() },
        })
      }
    }

    return NextResponse.json({ id: updated.id, stock_qty: updated.stockQty })
  } catch (e) {
    return err('Failed to restock', 500)
  }
}
