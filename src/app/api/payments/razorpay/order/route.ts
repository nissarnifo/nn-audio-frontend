export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { requireAuth, apiError } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  try {
    requireAuth(req)
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

    return NextResponse.json({
      razorpay_order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
