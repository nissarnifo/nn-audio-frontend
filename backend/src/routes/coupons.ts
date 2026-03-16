import { Router } from 'express'
import { prisma, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

function calcDiscount(coupon: { type: string; value: number }, subtotal: number): number {
  if (coupon.type === 'PERCENT') {
    return Math.round((subtotal * coupon.value) / 100 * 100) / 100
  }
  return Math.min(coupon.value, subtotal)
}

function formatCoupon(c: any) {
  return {
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    min_order: c.minOrder,
    max_uses: c.maxUses,
    used_count: c.usedCount,
    expires_at: c.expiresAt,
    is_active: c.isActive,
    created_at: c.createdAt,
  }
}

// GET /api/v1/coupons/validate?code=X&subtotal=N
router.get('/validate', async (req, res) => {
  const { code, subtotal } = req.query as Record<string, string>
  if (!code || !subtotal) {
    res.status(400).json({ error: 'code and subtotal are required' })
    return
  }
  const sub = parseFloat(subtotal)

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
  if (!coupon || !coupon.isActive) {
    res.status(404).json({ valid: false, error: 'Invalid or inactive coupon' })
    return
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    res.status(400).json({ valid: false, error: 'Coupon has expired' })
    return
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    res.status(400).json({ valid: false, error: 'Coupon usage limit reached' })
    return
  }
  if (sub < coupon.minOrder) {
    res.status(400).json({ valid: false, error: `Minimum order of ₹${coupon.minOrder} required` })
    return
  }

  const discount = calcDiscount(coupon, sub)
  res.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount,
  })
})

// ── Admin-only CRUD ───────────────────────────────────────────────

// GET /api/v1/coupons
router.get('/', requireAdmin, async (_req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(coupons.map(formatCoupon))
})

// POST /api/v1/coupons
router.post('/', requireAdmin, async (req: AuthRequest, res) => {
  const { code, type, value, min_order, max_uses, expires_at } = req.body
  if (!code || !type || value == null) {
    res.status(400).json({ error: 'code, type, value are required' })
    return
  }
  const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
  if (existing) {
    res.status(409).json({ error: 'Coupon code already exists' })
    return
  }
  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      type,
      value: parseFloat(value),
      minOrder: min_order ? parseFloat(min_order) : 0,
      maxUses: max_uses ? parseInt(max_uses) : null,
      expiresAt: expires_at ? new Date(expires_at) : null,
    },
  })
  res.status(201).json(formatCoupon(coupon))
})

// PUT /api/v1/coupons/:id
router.put('/:id', requireAdmin, async (req: AuthRequest, res) => {
  const { value, min_order, max_uses, expires_at, is_active } = req.body
  const coupon = await prisma.coupon.update({
    where: { id: req.params.id },
    data: {
      ...(value != null && { value: parseFloat(value) }),
      ...(min_order != null && { minOrder: parseFloat(min_order) }),
      ...(max_uses !== undefined && { maxUses: max_uses ? parseInt(max_uses) : null }),
      ...(expires_at !== undefined && { expiresAt: expires_at ? new Date(expires_at) : null }),
      ...(is_active != null && { isActive: Boolean(is_active) }),
    },
  })
  res.json(formatCoupon(coupon))
})

// DELETE /api/v1/coupons/:id
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

export { calcDiscount }
export default router
