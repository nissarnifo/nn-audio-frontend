export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiError } from '@/lib/api-auth'
import { formatCart, cartInclude } from '../../_shared'

// PUT /api/cart/items/[itemId] — update quantity
export async function PUT(req: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const auth = requireAuth(req)
    const { qty } = await req.json()
    if (qty < 1) return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 })
    await prisma.cartItem.update({ where: { id: params.itemId }, data: { qty } })
    const cart = await prisma.cart.findUnique({ where: { userId: auth.id }, include: cartInclude })
    return NextResponse.json(formatCart(cart))
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}

// DELETE /api/cart/items/[itemId] — remove item
export async function DELETE(req: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const auth = requireAuth(req)
    await prisma.cartItem.delete({ where: { id: params.itemId } })
    const cart = await prisma.cart.findUnique({ where: { userId: auth.id }, include: cartInclude })
    return NextResponse.json(formatCart(cart))
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
