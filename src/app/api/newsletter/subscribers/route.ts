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
    const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') ?? '50')))
    const search = params.get('search') ?? ''
    const filter = params.get('filter') ?? 'all'

    const where: any = {}

    if (filter === 'active') {
      where.unsubscribed = false
    } else if (filter === 'unsubscribed') {
      where.unsubscribed = true
    }

    if (search) {
      where.email = { contains: search, mode: 'insensitive' }
    }

    const [subscribers, total] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.newsletterSubscriber.count({ where }),
    ])

    return NextResponse.json({
      subscribers,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    })
  } catch (e) {
    return err('Failed to fetch subscribers', 500)
  }
}
