import { Router } from 'express'
import { prisma, requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

function fmt(a: any) {
  return {
    id: a.id,
    label: a.label,
    name: a.name,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 ?? undefined,
    city: a.city,
    state: a.state,
    pin: a.pin,
    is_default: a.isDefault,
  }
}

// GET /api/v1/addresses
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const addresses = await prisma.address.findMany({ where: { userId: req.user!.id }, orderBy: { isDefault: 'desc' } })
  res.json(addresses.map(fmt))
})

// POST /api/v1/addresses
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const { label, name, phone, line1, line2, city, state, pin } = req.body

  // If first address, set as default
  const count = await prisma.address.count({ where: { userId: req.user!.id } })
  const address = await prisma.address.create({
    data: { userId: req.user!.id, label, name, phone, line1, line2, city, state, pin, isDefault: count === 0 },
  })
  res.status(201).json(fmt(address))
})

// PUT /api/v1/addresses/:id
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  const { label, name, phone, line1, line2, city, state, pin } = req.body
  const address = await prisma.address.update({
    where: { id: req.params.id, userId: req.user!.id },
    data: { label, name, phone, line1, line2, city, state, pin },
  })
  res.json(fmt(address))
})

// DELETE /api/v1/addresses/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  await prisma.address.delete({ where: { id: req.params.id, userId: req.user!.id } })
  res.json({ message: 'Address deleted' })
})

// PUT /api/v1/addresses/:id/default
router.put('/:id/default', requireAuth, async (req: AuthRequest, res) => {
  await prisma.address.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } })
  const address = await prisma.address.update({
    where: { id: req.params.id, userId: req.user!.id },
    data: { isDefault: true },
  })
  res.json(fmt(address))
})

export default router
