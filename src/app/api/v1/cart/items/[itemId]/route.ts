import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { formatCart, cartInclude } from '@/lib/formatters'

export async function PUT(req: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const { user: authUser, err } = requireAuth(req)
    if (err) return err
    const { qty } = await req.json()
    if (qty < 1) return Response.json({ error: 'Quantity must be at least 1' }, { status: 400 })
    await prisma.cartItem.update({ where: { id: params.itemId }, data: { qty } })
    const cart = await prisma.cart.findUnique({ where: { userId: authUser.id }, include: cartInclude })
    return Response.json(formatCart(cart))
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const { user: authUser, err } = requireAuth(req)
    if (err) return err
    await prisma.cartItem.delete({ where: { id: params.itemId } })
    const cart = await prisma.cart.findUnique({ where: { userId: authUser.id }, include: cartInclude })
    return Response.json(formatCart(cart))
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
