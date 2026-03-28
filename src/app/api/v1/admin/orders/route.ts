import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { formatOrder, orderInclude } from '@/lib/formatters'

const adminOrderInclude = {
  ...orderInclude,
  user: { select: { id: true, name: true, email: true } },
}

export async function GET(req: NextRequest) {
  try {
    const { user: authUser, err } = requireAdmin(req)
    if (err) return err
    const { searchParams } = req.nextUrl
    const status = searchParams.get('status') ?? undefined
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status

    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, include: adminOrderInclude, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.order.count({ where }),
    ])

    return Response.json({ data: orders.map(formatOrder), total, page, limit, total_pages: Math.ceil(total / limit) })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
