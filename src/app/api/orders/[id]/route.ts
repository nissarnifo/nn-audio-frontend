import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiError } from '@/lib/api-auth'
import { orderInclude, formatOrder } from '../_shared'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(req)
    const order = await prisma.order.findFirst({
      where: { id: params.id, userId: auth.id },
      include: orderInclude,
    })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    return NextResponse.json(formatOrder(order))
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
