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

export async function PUT(req: NextRequest, { params }: { params: { itemId: string } }) {
  const user = await requireUser(req)
  if (user instanceof NextResponse) return user

  const body = await req.json()
  const { qty } = body

  if (!qty || qty < 1) return err('qty must be at least 1', 400)

  const cartItem = await prisma.cartItem.findUnique({ where: { id: params.itemId }, include: { cart: true } })
  if (!cartItem) return err('Cart item not found', 404)
  if (cartItem.cart.userId !== user.id) return err('Forbidden', 403)

  await prisma.cartItem.update({ where: { id: params.itemId }, data: { qty } })

  const cart = await prisma.cart.findUnique({ where: { id: cartItem.cartId }, include: cartInclude })
  return NextResponse.json(await formatCart(cart))
}

export async function DELETE(req: NextRequest, { params }: { params: { itemId: string } }) {
  const user = await requireUser(req)
  if (user instanceof NextResponse) return user

  const cartItem = await prisma.cartItem.findUnique({ where: { id: params.itemId }, include: { cart: true } })
  if (!cartItem) return err('Cart item not found', 404)
  if (cartItem.cart.userId !== user.id) return err('Forbidden', 403)

  await prisma.cartItem.delete({ where: { id: params.itemId } })

  const cart = await prisma.cart.findUnique({ where: { id: cartItem.cartId }, include: cartInclude })
  return NextResponse.json(await formatCart(cart))
}
