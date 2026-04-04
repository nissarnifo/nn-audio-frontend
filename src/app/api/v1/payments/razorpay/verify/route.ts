import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireAdmin, err } from '@/lib/api-helpers'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const user = await requireUser(req)
  if (user instanceof NextResponse) return user

  const body = await req.json()
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return err('Missing required payment verification fields', 400)
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (expectedSignature !== razorpay_signature) {
    return err('Invalid payment signature', 400)
  }

  return NextResponse.json({ verified: true })
}
