export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiError } from '@/lib/api-auth'
import { sendOrderNotification } from '@/lib/notify'
import { orderInclude, formatOrder } from './_shared'

const SHIPPING_THRESHOLD = 5000
const SHIPPING_FEE = 299

// POST /api/orders — create order from cart
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    const { paymentMethod, addressId, razorpay } = await req.json()

    const cart = await prisma.cart.findUnique({
      where: { userId: auth.id },
      include: { items: { include: { variant: true, product: true } } },
    })
    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const subtotal = cart.items.reduce((sum, i) => sum + i.variant.price * i.qty, 0)
    const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
    const total = subtotal + shipping
    const orderNumber = `NNA-${Date.now()}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: auth.id,
        addressId,
        paymentMethod,
        paymentStatus: paymentMethod === 'RAZORPAY' ? 'PAID' : 'PENDING',
        subtotal,
        shipping,
        total,
        razorpayOrderId: razorpay?.razorpay_order_id ?? null,
        razorpayPaymentId: razorpay?.razorpay_payment_id ?? null,
        items: {
          create: cart.items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            qty: i.qty,
            price: i.variant.price,
          })),
        },
      },
      include: orderInclude,
    })

    // Deduct stock + log SALE movements
    await Promise.all(
      cart.items.flatMap((i) => [
        prisma.productVariant.update({ where: { id: i.variantId }, data: { stockQty: { decrement: i.qty } } }),
        prisma.stockMovement.create({ data: { variantId: i.variantId, type: 'SALE', qty: -i.qty, note: `Order ${orderNumber}` } }),
      ])
    )

    // Clear cart
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })

    // Fire-and-forget admin notification
    prisma.user
      .findUnique({ where: { id: auth.id } })
      .then((user) => {
        if (!user) return
        return sendOrderNotification({
          orderNumber,
          customerName: user.name,
          customerEmail: user.email,
          customerPhone: user.phone ?? '',
          subtotal,
          shipping,
          total,
          paymentMethod,
          paymentStatus: paymentMethod === 'RAZORPAY' ? 'PAID' : 'PENDING',
          address: {
            name: order.address.name, phone: order.address.phone,
            line1: order.address.line1, line2: order.address.line2,
            city: order.address.city, state: order.address.state, pin: order.address.pin,
          },
          items: cart.items.map((i) => ({
            productName: i.product.name, variantLabel: i.variant.label, qty: i.qty, price: i.variant.price,
          })),
        })
      })
      .catch(() => {})

    return NextResponse.json(formatOrder(order), { status: 201 })
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}

// GET /api/orders — list user's orders
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    const orders = await prisma.order.findMany({
      where: { userId: auth.id },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders.map(formatOrder))
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
