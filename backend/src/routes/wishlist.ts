import { Router } from 'express'
import { prisma, requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

const productInclude = {
  images: { orderBy: { order: 'asc' as const } },
  variants: true,
}

function formatProduct(p: any) {
  const now = new Date()
  const onSale =
    p.salePrice != null &&
    (p.saleStartAt == null || p.saleStartAt <= now) &&
    (p.saleEndAt == null || p.saleEndAt > now)

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    description: p.description,
    category: p.category,
    badge: p.badge?.replace('_', ' ') ?? null,
    specs: p.specs,
    rating: p.rating,
    review_count: p.reviewCount,
    sale_price: p.salePrice ?? null,
    sale_start_at: p.saleStartAt ?? null,
    sale_end_at: p.saleEndAt ?? null,
    on_sale: onSale,
    is_active: p.isActive,
    created_at: p.createdAt,
    images: p.images.map((img: any) => ({ id: img.id, url: img.url, is_primary: img.isPrimary, order: img.order })),
    variants: p.variants.map((v: any) => ({ id: v.id, label: v.label, price: v.price, stock_qty: v.stockQty, is_active: v.isActive })),
  }
}

// GET /api/v1/wishlist
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.user!.id },
    include: { product: { include: productInclude } },
    orderBy: { createdAt: 'desc' },
  })
  res.json(items.map((i) => formatProduct(i.product)))
})

// POST /api/v1/wishlist  — { productId }
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const { productId } = req.body
  if (!productId) { res.status(400).json({ error: 'productId is required' }); return }

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) { res.status(404).json({ error: 'Product not found' }); return }

  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: req.user!.id, productId } },
    update: {},
    create: { userId: req.user!.id, productId },
  })

  res.status(201).json({ ok: true })
})

// DELETE /api/v1/wishlist/:productId
router.delete('/:productId', requireAuth, async (req: AuthRequest, res) => {
  await prisma.wishlistItem.deleteMany({
    where: { userId: req.user!.id, productId: req.params.productId },
  })
  res.json({ ok: true })
})

// DELETE /api/v1/wishlist  — clear all
router.delete('/', requireAuth, async (req: AuthRequest, res) => {
  await prisma.wishlistItem.deleteMany({ where: { userId: req.user!.id } })
  res.json({ ok: true })
})

export default router
