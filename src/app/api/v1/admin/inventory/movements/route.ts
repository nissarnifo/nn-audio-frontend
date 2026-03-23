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
    const type = params.get('type')
    const limit = 30

    const where: any = {}
    if (type) where.type = type

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          variant: {
            select: {
              id: true,
              label: true,
              product: {
                select: {
                  name: true,
                  sku: true,
                  category: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockMovement.count({ where }),
    ])

    return NextResponse.json({
      data: movements,
      total,
      page,
      total_pages: Math.ceil(total / limit),
    })
  } catch (e) {
    return err('Failed to fetch movements', 500)
  }
}
