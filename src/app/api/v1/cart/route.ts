import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const cartInclude = {
  items: {
    include: {
      product: { include: { images: { orderBy: { order: 'asc' as const } }, variants: true } },
      variant: true,
    },
  },
}

async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({ where: { userId }, include: cartInclude })
  if (!cart) cart = await prisma.cart.create({ data: { userId }, include: cartInclude })
  return cart
}

async function getShippingSettings(): Promise<{ threshold: number; fee: number }> {
  const rows = await prisma.setting.findMany({ where: { key: { in: ['shipping_threshold', 'shipping_fee'] } } })
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value
  return {
    threshold: parseFloat(map.shipping_threshold ?? '5000'),
    fee: parseFloat(map.shipping_fee ?? '299'),
  }
}

async function formatCart(cart: any) {
  const items = cart.items.map((item: any) => ({
    id: item.id,
    product: {
      id: item.product.id, name: item.product.name, slug: item.product.slug, sku: item.product.sku,
      description: item.product.description, category: item.product.category,
      badge: item.product.badge?.replace('_', ' ') ?? null, specs: item.product.specs,
      rating: item.product.rating, review_count: item.product.reviewCount,
      is_active: item.product.isActive, created_at: item.product.createdAt,
      images: item.product.images.map((img: any) => ({ id: img.id, url: img.url, is_primary: img.isPrimary, order: img.order })),
      variants: item.product.variants.map((v: any) => ({ id: v.id, label: v.label, price: v.price, stock_qty: v.stockQty, is_active: v.isActive })),
    },
    variant: { id: item.variant.id, label: item.variant.label, price: item.variant.price, stock_qty: item.variant.stockQty, is_active: item.variant.isActive },
    qty: item.qty,
  }))
  const subtotal = items.reduce((sum: number, i: any) => sum + i.variant.price * i.qty, 0)
  const { threshold, fee } = await getShippingSettings()
  const shipping = subtotal >= threshold ? 0 : fee
  return { items, count: items.reduce((s: number, i: any) => s + i.qty, 0), subtotal, shipping, total: subtotal + shipping }
}

export async function GET(req: NextRequest) {
  const user = await requireUser(req)
  if (user instanceof NextResponse) return user

  const cart = await getOrCreateCart(user.id)
  return NextResponse.json(await formatCart(cart))
}

export async function DELETE(req: NextRequest) {
  const user = await requireUser(req)
  if (user instanceof NextResponse) return user

  const cart = await prisma.cart.findUnique({ where: { userId: user.id } })
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
  }

  return NextResponse.json({ message: 'Cart cleared' })
}
