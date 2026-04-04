export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/api-helpers'

function formatProduct(p: any) {
  const now = new Date()
  const onSale = p.salePrice != null && (p.saleStartAt == null || p.saleStartAt <= now) && (p.saleEndAt == null || p.saleEndAt > now)
  return { id: p.id, name: p.name, slug: p.slug, sku: p.sku, description: p.description, category: p.category, badge: p.badge?.replace('_', ' ') ?? null, specs: p.specs, rating: p.rating, review_count: p.reviewCount, sale_price: p.salePrice ?? null, sale_start_at: p.saleStartAt ?? null, sale_end_at: p.saleEndAt ?? null, on_sale: onSale, is_active: p.isActive, created_at: p.createdAt, images: p.images.map((img: any) => ({ id: img.id, url: img.url, is_primary: img.isPrimary, order: img.order })), variants: p.variants.map((v: any) => ({ id: v.id, label: v.label, price: v.price, stock_qty: v.stockQty, is_active: v.isActive })) }
}

const productInclude = { images: { orderBy: { order: 'asc' as const } }, variants: true }

export async function GET(req: NextRequest) {
  const user = requireUser(req)
  if (user instanceof NextResponse) return user

  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: { product: { include: productInclude } },
    })
    return NextResponse.json(items.map((item: any) => formatProduct(item.product)))
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = requireUser(req)
  if (user instanceof NextResponse) return user

  try {
    const body = await req.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      update: {},
      create: { userId: user.id, productId },
    })

    return NextResponse.json({ message: 'Added to wishlist' }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = requireUser(req)
  if (user instanceof NextResponse) return user

  try {
    await prisma.wishlistItem.deleteMany({ where: { userId: user.id } })
    return NextResponse.json({ message: 'Wishlist cleared' })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
