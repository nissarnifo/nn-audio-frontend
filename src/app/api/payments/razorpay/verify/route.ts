import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { requireAuth, apiError } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  try {
    requireAuth(req)
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`)
    const expected = hmac.digest('hex')

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    return NextResponse.json({ verified: true })
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
