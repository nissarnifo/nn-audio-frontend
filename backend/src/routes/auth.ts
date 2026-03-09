import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma, requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

function signToken(id: string, role: string) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET!, { expiresIn: '30d' })
}

function safeUser(user: { id: string; name: string; email: string; phone: string; role: string; createdAt: Date }) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, created_at: user.createdAt }
}

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body
  if (!name || !email || !phone || !password) {
    res.status(400).json({ error: 'All fields required' })
    return
  }
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    res.status(409).json({ error: 'Email already in use' })
    return
  }
  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { name, email, phone, password: hashed } })
  res.status(201).json({ user: safeUser(user), token: signToken(user.id, user.role) })
})

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }
  res.json({ user: safeUser(user), token: signToken(user.id, user.role) })
})

// GET /api/v1/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user) { res.status(404).json({ error: 'Not found' }); return }
  res.json(safeUser(user))
})

// PUT /api/v1/auth/me
router.put('/me', requireAuth, async (req: AuthRequest, res) => {
  const { name, phone } = req.body
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { ...(name && { name }), ...(phone && { phone }) },
  })
  res.json(safeUser(user))
})

// PUT /api/v1/auth/me/password
router.put('/me/password', requireAuth, async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    res.status(400).json({ error: 'Current password is incorrect' })
    return
  }
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { password: await bcrypt.hash(newPassword, 10) },
  })
  res.json({ message: 'Password updated' })
})

// POST /api/v1/auth/logout
router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out' })
})

export default router
