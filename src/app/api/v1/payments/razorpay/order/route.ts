import { NextRequest } from 'next/server'
import Razorpay from 'razorpay'
import { requireAuth } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, err } = requireAuth(req)
    if (err) return err
    const { amount } = await req.json()
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    })
    return Response.json({ razorpay_order_id: order.id, amount: order.amount, currency: order.currency })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
