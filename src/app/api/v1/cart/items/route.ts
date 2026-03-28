import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { formatCart, cartInclude } from '@/lib/formatters'

async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({ where: { userId }, include: cartInclude })
  if (!cart) cart = await prisma.cart.create({ data: { userId }, include: cartInclude })
  return cart
}

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, err } = requireAuth(req)
    if (err) return err
    const { variantId, qty = 1 } = await req.json()
    const cart = await getOrCreateCart(authUser.id)

    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })
    if (!variant) return Response.json({ error: 'Variant not found' }, { status: 404 })

    const existing = (cart as any).items.find((i: any) => i.variant.id === variantId)
    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { qty: existing.qty + qty } })
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId: variant.productId, variantId, qty },
      })
    }

    const updated = await prisma.cart.findUnique({ where: { userId: authUser.id }, include: cartInclude })
    return Response.json(formatCart(updated))
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
