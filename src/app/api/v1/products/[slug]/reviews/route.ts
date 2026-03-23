import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params

    const product = await prisma.product.findUnique({ where: { slug } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const reviews = await prisma.review.findMany({
      where: { productId: product.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reviews)
  } catch (e) {
    return err('Internal server error', 500)
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const user = await requireUser(req)
    if (user instanceof NextResponse) return user

    const { slug } = params

    const product = await prisma.product.findUnique({ where: { slug } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const body = await req.json()
    const { rating, comment } = body

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId: product.id,
        rating: parseInt(rating),
        comment,
      },
      include: { user: { select: { name: true } } },
    })

    // Update product rating aggregate
    const aggregate = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { rating: true },
    })

    await prisma.product.update({
      where: { id: product.id },
      data: {
        rating: aggregate._avg.rating ?? 0,
        reviewCount: aggregate._count.rating,
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (e) {
    return err('Internal server error', 500)
  }
}
