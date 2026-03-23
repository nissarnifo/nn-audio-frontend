import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (admin instanceof NextResponse) return admin

    const variants = await prisma.productVariant.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
      orderBy: { stockQty: 'asc' },
    })

    const total_skus = variants.length
    const out_of_stock = variants.filter((v) => v.stockQty === 0).length
    const low_stock = variants.filter((v) => v.stockQty > 0 && v.stockQty <= 5).length
    const total_value = variants.reduce((sum, v) => sum + v.price * v.stockQty, 0)

    return NextResponse.json({
      variants: variants.map((v) => ({
        id: v.id,
        label: v.label,
        price: v.price,
        stock_qty: v.stockQty,
        is_active: v.isActive,
        product: {
          id: v.product.id,
          name: v.product.name,
          sku: v.product.sku,
          category: v.product.category,
          primary_image: v.product.images[0]?.url ?? null,
        },
      })),
      summary: { total_skus, out_of_stock, low_stock, total_value },
    })
  } catch (e) {
    return err('Failed to fetch inventory', 500)
  }
}
