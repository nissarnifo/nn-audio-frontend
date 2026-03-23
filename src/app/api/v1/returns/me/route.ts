export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = requireUser(req)
  if (user instanceof NextResponse) return user

  try {
    const returns = await prisma.return.findMany({
      where: { userId: user.id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            createdAt: true,
            total: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const mapped = returns.map((r) => ({
      id: r.id,
      order_number: r.order.orderNumber,
      order_total: r.order.total,
      order_date: r.order.createdAt,
      reason: r.reason,
      notes: r.notes,
      status: r.status,
      admin_note: r.adminNote,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    }))

    return NextResponse.json(mapped)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
