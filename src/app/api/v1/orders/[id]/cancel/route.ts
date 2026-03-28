import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { formatOrder, orderInclude } from '@/lib/formatters'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user: authUser, err } = requireAuth(req)
    if (err) return err
    const order = await prisma.order.findFirst({
      where: { id: params.id, userId: authUser.id },
      include: { items: true },
    })
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 })
    if (order.status !== 'PROCESSING')
      return Response.json({ error: 'Order cannot be cancelled at this stage' }, { status: 400 })

    await Promise.all(order.items.flatMap(i => [
      prisma.productVariant.update({
        where: { id: i.variantId },
        data: { stockQty: { increment: i.qty } },
      }),
      prisma.stockMovement.create({
        data: { variantId: i.variantId, type: 'RETURN', qty: i.qty, note: `Order ${order.orderNumber} cancelled` },
      }),
    ]))

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: { status: 'CANCELLED', paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : order.paymentStatus },
      include: orderInclude,
    })
    return Response.json(formatOrder(updated))
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
