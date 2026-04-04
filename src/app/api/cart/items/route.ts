export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiError } from '@/lib/api-auth'
import { formatCart, cartInclude } from '../_shared'

// POST /api/cart/items — add item to cart
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    const { variantId, qty = 1 } = await req.json()

    let cart = await prisma.cart.findUnique({ where: { userId: auth.id }, include: cartInclude })
    if (!cart) cart = await prisma.cart.create({ data: { userId: auth.id }, include: cartInclude })

    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })
    if (!variant) return NextResponse.json({ error: 'Variant not found' }, { status: 404 })

    const existing = cart.items.find((i: any) => i.variant.id === variantId)
    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { qty: existing.qty + qty } })
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId: variant.productId, variantId, qty },
      })
    }

    const updated = await prisma.cart.findUnique({ where: { userId: auth.id }, include: cartInclude })
    return NextResponse.json(formatCart(updated))
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
