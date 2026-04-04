import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const productInclude = {
  images: { orderBy: { order: 'asc' as const } },
  variants: true,
}

function formatProduct(p: any) {
  const now = new Date()
  const onSale = p.salePrice != null && (p.saleStartAt == null || p.saleStartAt <= now) && (p.saleEndAt == null || p.saleEndAt > now)
  return {
    id: p.id, name: p.name, slug: p.slug, sku: p.sku, description: p.description,
    category: p.category, badge: p.badge?.replace('_', ' ') ?? null, specs: p.specs,
    rating: p.rating, review_count: p.reviewCount, sale_price: p.salePrice ?? null,
    sale_start_at: p.saleStartAt ?? null, sale_end_at: p.saleEndAt ?? null, on_sale: onSale,
    is_active: p.isActive, created_at: p.createdAt,
    images: p.images.map((img: any) => ({ id: img.id, url: img.url, is_primary: img.isPrimary, order: img.order })),
    variants: p.variants.map((v: any) => ({ id: v.id, label: v.label, price: v.price, stock_qty: v.stockQty, is_active: v.isActive })),
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const user = await requireAdmin(req)
    if (user instanceof NextResponse) return user

    const { slug } = params

    const product = await prisma.product.findUnique({ where: { slug } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const body = await req.json()
    const { sale_price, sale_start_at, sale_end_at } = body

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        salePrice: sale_price,
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
