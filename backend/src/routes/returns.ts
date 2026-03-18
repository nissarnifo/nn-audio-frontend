import { Router } from 'express'
import { prisma, requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

const RETURN_WINDOW_DAYS = 30

// POST /api/v1/returns  — customer submits a return request
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id
  const { orderId, reason, notes } = req.body

  if (!orderId || !reason) {
    return res.status(400).json({ error: 'orderId and reason are required' })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { return: true },
  })

  if (!order || order.userId !== userId) {
    return res.status(404).json({ error: 'Order not found' })
  }

  if (order.status !== 'DELIVERED') {
    return res.status(400).json({ error: 'Only delivered orders can be returned' })
  }

  const daysSinceDelivery = (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
    return res.status(400).json({ error: `Return window of ${RETURN_WINDOW_DAYS} days has passed` })
  }

  if (order.return) {
    return res.status(409).json({ error: 'A return request already exists for this order' })
  }

  const ret = await prisma.return.create({
    data: { orderId, userId, reason, notes: notes ?? null },
  })

  res.status(201).json({ id: ret.id, status: ret.status, created_at: ret.createdAt })
})

// GET /api/v1/returns/me  — customer's own return requests
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id

  const returns = await prisma.return.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      order: {
        select: { orderNumber: true, total: true, createdAt: true },
      },
    },
  })

  res.json(
    returns.map((r) => ({
      id: r.id,
      order_number: r.order.orderNumber,
      order_total: r.order.total,
      order_date: r.order.createdAt,
      reason: r.reason,
      notes: r.notes,
      status: r.status,
      admin_note: r.adminNote,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    }))
  )
})

export default router
