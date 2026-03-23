import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (admin instanceof NextResponse) return admin

    const params = req.nextUrl.searchParams
    const page = Math.max(1, parseInt(params.get('page') ?? '1'))
    const status = params.get('status')
    const limit = 20

    const where: any = {}
    if (status) where.status = status

    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { orderNumber: true, total: true, createdAt: true } },
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.return.count({ where }),
    ])

    return NextResponse.json({
      data: returns,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    })
  } catch (e) {
    return err('Failed to fetch returns', 500)
  }
}
