import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, apiError } from '@/lib/api-auth'
import { formatOrder } from '../../../../orders/_shared'

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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(req)
    const { status } = await req.json()
    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status },
      include: orderInclude,
    })
    return NextResponse.json(formatOrder(order))
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
