import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireAdmin, err } from '@/lib/api-helpers'
import Razorpay from 'razorpay'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const user = await requireUser(req)
  if (user instanceof NextResponse) return user

  const body = await req.json()
  const { amount } = body

  if (!amount || amount <= 0) return err('Invalid amount', 400)

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt: 'rcpt_' + Date.now(),
  })

  return NextResponse.json({
    razorpay_order_id: order.id,
    amount: order.amount,
    currency: order.currency,
  })
}
