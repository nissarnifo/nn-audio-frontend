export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/api-helpers'

export async function POST(req: NextRequest) {
  const user = requireUser(req)
  if (user instanceof NextResponse) return user

  try {
    const body = await req.json()
    const { orderId, reason, notes } = body

    if (!orderId || !reason) {
      return NextResponse.json({ error: 'orderId and reason are required' }, { status: 400 })
    }

    // Check order exists and belongs to user
    const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check order status is DELIVERED
    if (order.status !== 'DELIVERED') {
      return NextResponse.json({ error: 'Only delivered orders can be returned' }, { status: 400 })
    }

    // Check within 30 days
    const daysSinceOrder = (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceOrder > 30) {
      return NextResponse.json({ error: 'Return window of 30 days has expired' }, { status: 400 })
    }

    // Check no existing return
    const existingReturn = await prisma.return.findFirst({ where: { orderId } })
    if (existingReturn) {
      return NextResponse.json({ error: 'A return request already exists for this order' }, { status: 409 })
    }

    const returnRequest = await prisma.return.create({
      data: { orderId, userId: user.id, reason, notes: notes ?? null },
    })

    return NextResponse.json({ return: returnRequest }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
