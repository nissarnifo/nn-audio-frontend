import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { formatOrder, orderInclude } from '@/lib/formatters'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user: authUser, err } = requireAuth(req)
    if (err) return err
    const order = await prisma.order.findFirst({
      where: { id: params.id, userId: authUser.id },
      include: orderInclude,
    })
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 })
    return Response.json(formatOrder(order))
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
