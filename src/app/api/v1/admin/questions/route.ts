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
    const answered = params.get('answered')
    const limit = 20

    const where: any = {}
    if (answered === 'true') where.answer = { not: null }
    else if (answered === 'false') where.answer = null

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ answer: 'asc' }, { createdAt: 'desc' }],
        include: {
          product: { select: { id: true, name: true, slug: true } },
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.question.count({ where }),
    ])

    return NextResponse.json({
      data: questions,
      total,
      page,
      total_pages: Math.ceil(total / limit),
    })
  } catch (e) {
    return err('Failed to fetch questions', 500)
  }
}
