export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, apiError } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    const variants = await prisma.productVariant.findMany({
      include: {
        product: {
          select: { id: true, name: true, sku: true, category: true, images: { where: { isPrimary: true }, take: 1 } },
        },
      },
      orderBy: { stockQty: 'asc' },
    })

    const totalValue = variants.reduce((s, v) => s + v.price * v.stockQty, 0)
    const outOfStock = variants.filter((v) => v.stockQty === 0).length
    const lowStock = variants.filter((v) => v.stockQty > 0 && v.stockQty <= 5).length

    return NextResponse.json({
      variants: variants.map((v) => ({
        id: v.id, label: v.label, price: v.price, stock_qty: v.stockQty, is_active: v.isActive,
        product: {
          id: v.product.id, name: v.product.name, sku: v.product.sku,
          category: v.product.category, image: v.product.images[0]?.url ?? null,
        },
      })),
      summary: { total_skus: variants.length, out_of_stock: outOfStock, low_stock: lowStock, total_value: totalValue },
    })
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
