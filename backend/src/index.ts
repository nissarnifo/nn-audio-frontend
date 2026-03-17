import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

import authRoutes from './routes/auth'
import productRoutes from './routes/products'
import cartRoutes from './routes/cart'
import orderRoutes from './routes/orders'
import addressRoutes from './routes/addresses'
import paymentRoutes from './routes/payments'
import adminRoutes from './routes/admin'
import couponRoutes from './routes/coupons'
import stockAlertRoutes from './routes/stock-alerts'
import returnRoutes from './routes/returns'
import wishlistRoutes from './routes/wishlist'
import settingsRoutes from './routes/settings'
import newsletterRoutes from './routes/newsletter'

const prisma = new PrismaClient()

async function ensureAdminExists() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  if (!admin) {
    await prisma.user.upsert({
      where: { email: 'admin@nnaudio.com' },
      update: {},
      create: {
        name: 'Admin',
        email: 'admin@nnaudio.com',
        phone: '9999999999',
        password: await bcrypt.hash('admin123', 10),
        role: 'ADMIN',
      },
    })
    console.info('[startup] Default admin created: admin@nnaudio.com')
  }
}

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true)
    if (
      allowedOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true)
    }
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// ── Rate limiters ───────────────────────────────────────────────────
// Strict limiter for auth endpoints (login, register, password reset)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => req.method === 'GET', // only throttle mutating calls
})

// Looser limiter for coupon validation to prevent brute-force guessing
const couponLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many coupon attempts, please try again later.' },
})

// General API limiter — catches everything else
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

// Limiter for user-generated content (reviews, questions, stock alerts)
// Prevents spam: 10 submissions per 10 minutes per IP
const contentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'You are submitting too frequently, please try again later.' },
  skip: (req) => req.method !== 'POST',
})

app.use('/api/v1', generalLimiter)
app.use('/api/v1/auth', authLimiter)
app.use('/api/v1/coupons/validate', couponLimiter)
// Apply content limiter to UGC endpoints
app.use('/api/v1/products', contentLimiter)   // reviews + questions (POST only)
app.use('/api/v1/stock-alerts', contentLimiter)
app.use('/api/v1/newsletter', contentLimiter)

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/products', productRoutes)
app.use('/api/v1/cart', cartRoutes)
app.use('/api/v1/orders', orderRoutes)
app.use('/api/v1/addresses', addressRoutes)
app.use('/api/v1/payments', paymentRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/coupons', couponRoutes)
app.use('/api/v1/stock-alerts', stockAlertRoutes)
app.use('/api/v1/returns', returnRoutes)
app.use('/api/v1/wishlist', wishlistRoutes)
app.use('/api/v1/settings', settingsRoutes)
app.use('/api/v1/newsletter', newsletterRoutes)

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

ensureAdminExists()
  .then(() => app.listen(PORT, () => console.info(`[startup] Server listening on port ${PORT}`)))
  .catch((err) => { console.error('Startup error:', err); process.exit(1) })
