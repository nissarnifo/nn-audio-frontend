import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma, requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

function signToken(id: string, role: string) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET!, { expiresIn: '30d' })
}

function safeUser(user: { id: string; name: string; email: string; phone?: string | null; role: string; createdAt: Date }) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone ?? '', role: user.role, created_at: user.createdAt }
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
  if (!user || !user.password || !(await bcrypt.compare(password as string, user.password))) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }
  res.json({ user: safeUser(user), token: signToken(user.id, user.role) })
})

// POST /api/v1/auth/oauth  — unified for Google, GitHub, Discord via NextAuth
router.post('/oauth', async (req, res) => {
  const { provider, providerId, email, name } = req.body as {
    provider: 'google' | 'github' | 'discord'
    providerId: string
    email: string
    name: string
  }
  if (!provider || !providerId || !email) {
    res.status(400).json({ error: 'provider, providerId and email are required' })
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma.user as any

  // Find by provider ID first, then by email
  const providerWhere =
    provider === 'google' ? { googleId: providerId }
    : provider === 'github' ? { githubId: providerId }
    : { discordId: providerId }

  let user = (await db.findUnique({ where: providerWhere })) ?? (await db.findUnique({ where: { email } }))

  const providerData =
    provider === 'google' ? { googleId: providerId }
    : provider === 'github' ? { githubId: providerId }
    : { discordId: providerId }

  if (user) {
    const alreadyLinked = user[`${provider}Id`]
    if (!alreadyLinked) {
      user = await db.update({ where: { id: user.id }, data: providerData })
    }
  } else {
    user = await db.create({ data: { name: name || email, email, ...providerData } })
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
  const { name, phone, email } = req.body

  // If email is being changed, check uniqueness
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing && existing.id !== req.user!.id) {
      res.status(409).json({ error: 'Email already in use by another account' })
      return
    }
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(email && { email }),
    },
  })
  res.json(safeUser(user))
})

// PUT /api/v1/auth/me/password
router.put('/me/password', requireAuth, async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user || !user.password || !(await bcrypt.compare(currentPassword, user.password))) {
    res.status(400).json({ error: 'Current password is incorrect' })
    return
  }
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { password: await bcrypt.hash(newPassword, 10) },
  })
  res.json({ message: 'Password updated' })
})

// DELETE /api/v1/auth/me  — delete own account
router.delete('/me', requireAuth, async (req: AuthRequest, res) => {
  await prisma.user.delete({ where: { id: req.user!.id } })
  res.json({ message: 'Account deleted' })
})

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  if (!email) {
    res.status(400).json({ error: 'Email is required' })
    return
  }

  const user = await prisma.user.findUnique({ where: { email } })

  // Always respond with success to prevent email enumeration
  if (!user) {
    res.json({ message: 'If that email exists, a reset link has been sent.' })
    return
  }

  // Generate a secure random token valid for 1 hour
  const token = crypto.randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  })

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
  const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`

  // Try to send email if configured
  const emailUser = process.env.EMAIL_USER
  const emailPass = process.env.EMAIL_PASS
  const emailFrom = process.env.EMAIL_FROM || emailUser

  if (emailUser && emailPass) {
    try {
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.default.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: { user: emailUser, pass: emailPass },
      })
      await transporter.sendMail({
        from: `"N & N Audio" <${emailFrom}>`,
        to: user.email,
        subject: 'Reset your N & N Audio password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto">
            <h2 style="color:#00D4FF">Reset Your Password</h2>
            <p>Hi ${user.name},</p>
            <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
            <a href="${resetLink}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#00D4FF;color:#000;text-decoration:none;border-radius:4px;font-weight:bold">
              Reset Password
            </a>
            <p style="color:#888;font-size:12px">If you didn't request this, ignore this email.</p>
          </div>
        `,
      })
    } catch (err) {
      console.error('Email send failed:', err)
    }
  } else {
    // No email configured — log a redacted notice only (never log the token)
    console.info(`[auth] Password reset requested for ${user.email} — configure EMAIL_USER/EMAIL_PASS to send the link.`)
  }

  res.json({ message: 'If that email exists, a reset link has been sent.' })
})

// POST /api/v1/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body
  if (!token || !newPassword) {
    res.status(400).json({ error: 'Token and new password are required' })
    return
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  })

  if (!user) {
    res.status(400).json({ error: 'Invalid or expired reset token' })
    return
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await bcrypt.hash(newPassword, 10),
      resetToken: null,
      resetTokenExpiry: null,
    },
  })

  res.json({ message: 'Password reset successfully. You can now log in.' })
})

// POST /api/v1/auth/logout
router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out' })
})

export default router
