import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { formatCart, cartInclude } from '@/lib/formatters'

async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({ where: { userId }, include: cartInclude })
  if (!cart) cart = await prisma.cart.create({ data: { userId }, include: cartInclude })
  return cart
}

export async function GET(req: NextRequest) {
  try {
    const { user: authUser, err } = requireAuth(req)
    if (err) return err
    const cart = await getOrCreateCart(authUser.id)
    return Response.json(formatCart(cart))
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user: authUser, err } = requireAuth(req)
    if (err) return err
    const cart = await prisma.cart.findUnique({ where: { userId: authUser.id } })
    if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    return Response.json({ message: 'Cart cleared' })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
