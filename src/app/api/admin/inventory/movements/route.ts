import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, apiError } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const type = searchParams.get('type') ?? undefined
    const limit = 30
    const skip = (page - 1) * limit

    const where: any = {}
    if (type) where.type = type

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          variant: { include: { product: { select: { name: true, sku: true, category: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stockMovement.count({ where }),
    ])

    return NextResponse.json({
      data: movements.map((m) => ({
        id: m.id, type: m.type, qty: m.qty, note: m.note, created_at: m.createdAt,
        variant: { id: m.variant.id, label: m.variant.label, price: m.variant.price },
        product: { name: m.variant.product.name, sku: m.variant.product.sku, category: m.variant.product.category },
      })),
      total,
      page,
      total_pages: Math.ceil(total / limit),
    })
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
