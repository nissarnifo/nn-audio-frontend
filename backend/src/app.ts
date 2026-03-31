import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import authRoutes from './routes/auth'
import productRoutes from './routes/products'
import cartRoutes from './routes/cart'
import orderRoutes from './routes/orders'
import addressRoutes from './routes/addresses'
import paymentRoutes from './routes/payments'
import adminRoutes from './routes/admin'

const app = express()

app.use(helmet())

const allowedOrigins = [
  'http://localhost:3000',
  'https://audiosetstest.store',
  'https://www.audiosetstest.store',
  'https://staging.audiosetstest.store',
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

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/products', productRoutes)
app.use('/api/v1/cart', cartRoutes)
app.use('/api/v1/orders', orderRoutes)
app.use('/api/v1/addresses', addressRoutes)
app.use('/api/v1/payments', paymentRoutes)
app.use('/api/v1/admin', adminRoutes)

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

export default app
