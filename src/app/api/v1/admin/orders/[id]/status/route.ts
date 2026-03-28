import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { formatOrder, orderInclude } from '@/lib/formatters'

const adminOrderInclude = {
  ...orderInclude,
  user: { select: { id: true, name: true, email: true } },
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user: authUser, err } = requireAdmin(req)
    if (err) return err
    const { status } = await req.json()
    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status },
      include: adminOrderInclude,
    })
    return Response.json(formatOrder(order))
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
