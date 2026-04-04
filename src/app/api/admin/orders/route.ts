export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, apiError } from '@/lib/api-auth'
import { formatOrder } from '../../orders/_shared'

const orderInclude = {
  items: {
    include: {
      product: { include: { images: { orderBy: { order: 'asc' as const } }, variants: true } },
      variant: true,
    },
  },
  address: true,
  user: { select: { id: true, name: true, email: true } },
}

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? undefined
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = 20
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status

    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, include: orderInclude, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      data: orders.map(formatOrder),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    })
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
