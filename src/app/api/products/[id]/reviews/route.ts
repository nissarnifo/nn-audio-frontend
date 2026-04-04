import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiError } from '@/lib/api-auth'

// GET /api/products/[id]/reviews — id can be slug or cuid
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product =
      (await prisma.product.findUnique({ where: { slug: params.id } })) ??
      (await prisma.product.findUnique({ where: { id: params.id } }))
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const reviews = await prisma.review.findMany({
      where: { productId: product.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reviews.map((r) => ({
      id: r.id,
      user_name: r.user.name,
      rating: r.rating,
      comment: r.comment,
      created_at: r.createdAt,
    })))
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}

// POST /api/products/[id]/reviews
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(req)
    const { rating, comment } = await req.json()

    const product =
      (await prisma.product.findUnique({ where: { slug: params.id } })) ??
      (await prisma.product.findUnique({ where: { id: params.id } }))
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const review = await prisma.review.create({
      data: { productId: product.id, userId: auth.id, rating: parseInt(rating), comment },
      include: { user: { select: { name: true } } },
    })

    const agg = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: true,
    })
    await prisma.product.update({
      where: { id: product.id },
      data: { rating: agg._avg.rating ?? 0, reviewCount: agg._count },
    })

    return NextResponse.json(
      { id: review.id, user_name: review.user.name, rating: review.rating, comment: review.comment, created_at: review.createdAt },
      { status: 201 }
    )
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
