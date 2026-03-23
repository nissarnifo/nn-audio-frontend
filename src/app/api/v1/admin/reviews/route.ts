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
    const rating = params.get('rating')
    const search = params.get('search') ?? ''
    const limit = 20

    const where: any = {}

    if (rating) where.rating = parseInt(rating)

    if (search) {
      where.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ])

    return NextResponse.json({
      data: reviews,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    })
  } catch (e) {
    return err('Failed to fetch reviews', 500)
  }
}
