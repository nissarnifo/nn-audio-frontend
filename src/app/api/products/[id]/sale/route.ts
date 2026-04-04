export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'
import { formatProduct } from '../../_shared'

const productInclude = { images: { orderBy: { order: 'asc' as const } }, variants: true }

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireAdmin(req)
    if (user instanceof NextResponse) return user

    const product = await prisma.product.findFirst({
      where: { OR: [{ slug: params.id }, { id: params.id }] },
    })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const { sale_price, sale_start_at, sale_end_at } = await req.json()

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        salePrice: sale_price ?? null,
        saleStartAt: sale_start_at ? new Date(sale_start_at) : null,
        saleEndAt: sale_end_at ? new Date(sale_end_at) : null,
      },
      include: productInclude,
    })

    return NextResponse.json(formatProduct(updated))
  } catch (e) {
    return err('Internal server error', 500)
  }
}
