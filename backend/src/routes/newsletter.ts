import { Router } from 'express'
import { prisma, requireAdmin } from '../middleware/auth'

const router = Router()

// POST /api/v1/newsletter/subscribe  — public
router.post('/subscribe', async (req, res) => {
  const { email, source = 'footer' } = req.body as { email?: string; source?: string }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Valid email required' })
    return
  }

  try {
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } })
    if (existing) {
      if (existing.unsubscribed) {
        // Re-subscribe
        await prisma.newsletterSubscriber.update({ where: { email }, data: { unsubscribed: false } })
        res.json({ ok: true, message: 'You have been re-subscribed!' })
      } else {
        res.json({ ok: true, message: 'You are already subscribed.' })
      }
      return
    }
    await prisma.newsletterSubscriber.create({ data: { email, source } })
    res.status(201).json({ ok: true, message: 'Subscribed successfully!' })
  } catch {
    res.status(500).json({ error: 'Subscription failed, please try again.' })
  }
})

// POST /api/v1/newsletter/unsubscribe  — public (one-click unsubscribe by email)
router.post('/unsubscribe', async (req, res) => {
  const { email } = req.body as { email?: string }
  if (!email) { res.status(400).json({ error: 'Email required' }); return }
  await prisma.newsletterSubscriber.updateMany({
    where: { email },
    data: { unsubscribed: true },
  })
  res.json({ ok: true })
})

// GET /api/v1/newsletter/subscribers  — admin only
router.get('/subscribers', requireAdmin, async (req, res) => {
  const page   = Math.max(1, parseInt(String(req.query.page  ?? '1')))
  const limit  = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '50'))))
  const search = String(req.query.search ?? '').trim()
  const filter = String(req.query.filter ?? 'active') // 'active' | 'unsubscribed' | 'all'

  const where: Record<string, unknown> = {}
  if (filter === 'active')       where.unsubscribed = false
  if (filter === 'unsubscribed') where.unsubscribed = true
  if (search) where.email = { contains: search, mode: 'insensitive' }

  const [total, subscribers] = await Promise.all([
    prisma.newsletterSubscriber.count({ where }),
    prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, email: true, source: true, unsubscribed: true, createdAt: true },
    }),
  ])

  res.json({ subscribers, total, page, limit, pages: Math.ceil(total / limit) })
})

// DELETE /api/v1/newsletter/subscribers/:id  — admin only (hard delete)
router.delete('/subscribers/:id', requireAdmin, async (req, res) => {
  const { id } = req.params
  await prisma.newsletterSubscriber.delete({ where: { id } })
  res.json({ ok: true })
})

// GET /api/v1/newsletter/export  — admin only (CSV download)
router.get('/export', requireAdmin, async (_req, res) => {
  const rows = await prisma.newsletterSubscriber.findMany({
    where: { unsubscribed: false },
    orderBy: { createdAt: 'desc' },
    select: { email: true, source: true, createdAt: true },
  })
  const csv = ['email,source,subscribed_at']
    .concat(rows.map((r) => `${r.email},${r.source},${r.createdAt.toISOString()}`))
    .join('\n')
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="newsletter_subscribers.csv"')
  res.send(csv)
})

export default router
