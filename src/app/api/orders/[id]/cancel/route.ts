import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiError } from '@/lib/api-auth'
import { orderInclude, formatOrder } from '../../_shared'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(req)
    const order = await prisma.order.findFirst({
      where: { id: params.id, userId: auth.id },
      include: { items: true },
    })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.status !== 'PROCESSING') {
      return NextResponse.json({ error: 'Order cannot be cancelled at this stage' }, { status: 400 })
    }

    // Restore stock + log RETURN movements
    await Promise.all(
      order.items.flatMap((i) => [
        prisma.productVariant.update({ where: { id: i.variantId }, data: { stockQty: { increment: i.qty } } }),
        prisma.stockMovement.create({
          data: { variantId: i.variantId, type: 'RETURN', qty: i.qty, note: `Order ${order.orderNumber} cancelled` },
        }),
      ])
    )

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : order.paymentStatus,
      },
      include: orderInclude,
    })
    return NextResponse.json(formatOrder(updated))
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
