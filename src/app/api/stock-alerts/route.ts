export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, variantId } = body

    if (!email || !variantId) {
      return NextResponse.json({ error: 'email and variantId are required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check variant exists and is out of stock
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })
    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    if (variant.stockQty > 0) {
      return NextResponse.json({ error: 'Variant is currently in stock' }, { status: 400 })
    }

    // Upsert stock alert
    const alert = await prisma.stockAlert.upsert({
      where: { email_variantId: { email, variantId } },
      update: { notifiedAt: null },
      create: { email, variantId },
    })

    return NextResponse.json({ alert }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
