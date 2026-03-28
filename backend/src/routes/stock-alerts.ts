import { Router } from 'express'
import { prisma, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

// POST /api/v1/stock-alerts  — subscribe for back-in-stock notification
router.post('/', async (req, res) => {
  const { email, variantId } = req.body as { email: string; variantId: string }

  if (!email || !variantId) {
    res.status(400).json({ error: 'email and variantId are required' })
    return
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(email)) {
    res.status(400).json({ error: 'Invalid email address' })
    return
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { name: true } } },
  })

  if (!variant) {
    res.status(404).json({ error: 'Variant not found' })
    return
  }

  if (variant.stockQty > 0) {
    res.status(400).json({ error: 'This variant is already in stock' })
    return
  }

  // Upsert — prevent duplicates
  await prisma.stockAlert.upsert({
    where: { email_variantId: { email: email.toLowerCase(), variantId } },
    create: { email: email.toLowerCase(), variantId },
    update: { notifiedAt: null }, // re-subscribe if previously notified
  })

  res.json({ ok: true, message: `We'll notify ${email} when it's back in stock.` })
})

// GET /api/v1/stock-alerts/admin  — admin: list all pending (unnotified) alerts
router.get('/admin', requireAdmin, async (_req: AuthRequest, res) => {
  const alerts = await prisma.stockAlert.findMany({
    where: { notifiedAt: null },
    include: {
      variant: {
        include: {
          product: { select: { id: true, name: true, slug: true, sku: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(
    alerts.map((a) => ({
      id: a.id,
      email: a.email,
      created_at: a.createdAt,
      variant: {
        id: a.variant.id,
        label: a.variant.label,
        stock_qty: a.variant.stockQty,
        product: a.variant.product,
      },
    }))
  )
})

export default router
