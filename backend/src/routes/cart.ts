import { Router } from 'express'
import { prisma, requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

async function getShippingSettings(): Promise<{ threshold: number; fee: number }> {
  const rows = await prisma.setting.findMany({ where: { key: { in: ['shipping_threshold', 'shipping_fee'] } } })
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value
  return {
    threshold: parseFloat(map.shipping_threshold ?? '5000'),
    fee: parseFloat(map.shipping_fee ?? '299'),
  }
}

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

function formatCart(cart: any) {
  const items = cart.items.map((item: any) => ({
    id: item.id,
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      sku: item.product.sku,
      description: item.product.description,
      category: item.product.category,
      badge: item.product.badge?.replace('_', ' ') ?? null,
      specs: item.product.specs,
      rating: item.product.rating,
      review_count: item.product.reviewCount,
      is_active: item.product.isActive,
      created_at: item.product.createdAt,
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

// GET /api/v1/cart
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const cart = await getOrCreateCart(req.user!.id)
  res.json(formatCart(cart))
})

// POST /api/v1/cart/items
router.post('/items', requireAuth, async (req: AuthRequest, res) => {
  const { variantId, qty = 1 } = req.body
  const cart = await getOrCreateCart(req.user!.id)

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })
  if (!variant) { res.status(404).json({ error: 'Variant not found' }); return }

  const existing = cart.items.find((i: any) => i.variant.id === variantId)
  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { qty: existing.qty + qty } })
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId: variant.productId, variantId, qty },
    })
  }

  const updated = await prisma.cart.findUnique({ where: { userId: req.user!.id }, include: cartInclude })
  res.json(formatCart(updated))
})

// PUT /api/v1/cart/items/:itemId
router.put('/items/:itemId', requireAuth, async (req: AuthRequest, res) => {
  const { qty } = req.body
  if (qty < 1) { res.status(400).json({ error: 'Quantity must be at least 1' }); return }
  await prisma.cartItem.update({ where: { id: req.params.itemId }, data: { qty } })
  const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id }, include: cartInclude })
  res.json(formatCart(cart))
})

// DELETE /api/v1/cart/items/:itemId
router.delete('/items/:itemId', requireAuth, async (req: AuthRequest, res) => {
  await prisma.cartItem.delete({ where: { id: req.params.itemId } })
  const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id }, include: cartInclude })
  res.json(formatCart(cart))
})

// DELETE /api/v1/cart
router.delete('/', requireAuth, async (req: AuthRequest, res) => {
  const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } })
  if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
  res.json({ message: 'Cart cleared' })
})

export default router
