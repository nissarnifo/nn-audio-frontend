import { Router } from 'express'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { requireAuth } from '../middleware/auth'

const router = Router()

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

// POST /api/v1/payments/razorpay/order
router.post('/razorpay/order', requireAuth, async (req, res) => {
  const { amount } = req.body
  const razorpay = getRazorpay()

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // paise
    currency: 'INR',
    receipt: `rcpt_${Date.now()}`,
  })

  res.json({
    razorpay_order_id: order.id,
    amount: order.amount,
    currency: order.currency,
  })
})

// POST /api/v1/payments/razorpay/verify
router.post('/razorpay/verify', requireAuth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

  const body = `${razorpay_order_id}|${razorpay_payment_id}`
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex')

  if (expected !== razorpay_signature) {
    res.status(400).json({ error: 'Invalid payment signature' })
    return
  }

  res.json({ verified: true })
})

export default router
