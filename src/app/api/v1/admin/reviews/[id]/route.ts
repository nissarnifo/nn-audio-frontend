import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req)
    if (admin instanceof NextResponse) return admin

    const review = await prisma.review.findUnique({ where: { id: params.id } })
    if (!review) return err('Review not found', 404)

    await prisma.review.delete({ where: { id: params.id } })

    const agg = await prisma.review.aggregate({
      where: { productId: review.productId },
      _avg: { rating: true },
      _count: true,
    })

    await prisma.product.update({
      where: { id: review.productId },
      data: { rating: agg._avg.rating ?? 0, reviewCount: agg._count },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return err('Failed to delete review', 500)
  }
}
