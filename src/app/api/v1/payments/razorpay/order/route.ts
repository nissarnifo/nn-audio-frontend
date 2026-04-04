import { NextRequest, NextResponse } from 'next/server'
import { requireUser, err } from '@/lib/api-helpers'
import { validateBody, schemas } from '@/lib/validate'
import { limiters, getIp, rateLimitResponse } from '@/lib/rate-limit'
import Razorpay from 'razorpay'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const rl = rateLimitResponse(limiters.payment(getIp(req.headers)))
  if (rl) return rl

  const user = requireUser(req)
  if (user instanceof NextResponse) return user

  const { data, error } = await validateBody(req, schemas.razorpayOrder)
  if (error) return error

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    const order = await razorpay.orders.create({
      amount: Math.round(data.amount * 100),
      currency: 'INR',
      receipt: 'rcpt_' + Date.now(),
    })

    return NextResponse.json({
      razorpay_order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (e) {
    console.error('[razorpay/order]', e)
    return err('Failed to create payment order', 500)
  }
}
