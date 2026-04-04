export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiError } from '@/lib/api-auth'
import { formatCart, cartInclude } from './_shared'

// GET /api/cart
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    let cart = await prisma.cart.findUnique({ where: { userId: auth.id }, include: cartInclude })
    if (!cart) cart = await prisma.cart.create({ data: { userId: auth.id }, include: cartInclude })
    return NextResponse.json(formatCart(cart))
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}

// DELETE /api/cart — clear cart
export async function DELETE(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    const cart = await prisma.cart.findUnique({ where: { userId: auth.id } })
    if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    return NextResponse.json({ message: 'Cart cleared' })
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
