import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const product = await prisma.product.findUnique({ where: { slug: params.slug } })
    if (!product) return Response.json({ error: 'Product not found' }, { status: 404 })

    const reviews = await prisma.review.findMany({
      where: { productId: product.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(reviews.map(r => ({
      id: r.id,
      user_name: r.user.name,
      rating: r.rating,
      comment: r.comment,
      created_at: r.createdAt,
    })))
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { user: authUser, err } = requireAuth(req)
    if (err) return err
    const { rating, comment } = await req.json()
    const product = await prisma.product.findUnique({ where: { slug: params.slug } })
    if (!product) return Response.json({ error: 'Product not found' }, { status: 404 })

    const review = await prisma.review.create({
      data: { productId: product.id, userId: authUser.id, rating: parseInt(rating), comment },
      include: { user: { select: { name: true } } },
    })

    const agg = await prisma.review.aggregate({ where: { productId: product.id }, _avg: { rating: true }, _count: true })
    await prisma.product.update({
      where: { id: product.id },
      data: { rating: agg._avg.rating ?? 0, reviewCount: agg._count },
    })

    return Response.json({ id: review.id, user_name: review.user.name, rating: review.rating, comment: review.comment, created_at: review.createdAt }, { status: 201 })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
