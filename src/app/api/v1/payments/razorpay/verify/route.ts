import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { requireAuth } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, err } = requireAuth(req)
    if (err) return err
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()
    const body = `${razorpay_order_id}|${razorpay_payment_id}`
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')
    if (expected !== razorpay_signature)
      return Response.json({ error: 'Invalid payment signature' }, { status: 400 })
    return Response.json({ verified: true })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
