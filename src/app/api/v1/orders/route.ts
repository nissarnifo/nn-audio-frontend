import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { formatOrder, orderInclude, SHIPPING_THRESHOLD, SHIPPING_FEE } from '@/lib/formatters'
import { sendOrderNotification } from '@/lib/notify'

export async function GET(req: NextRequest) {
  try {
    const { user: authUser, err } = requireAuth(req)
    if (err) return err
    const orders = await prisma.order.findMany({
      where: { userId: authUser.id },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    })
    return Response.json(orders.map(formatOrder))
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, err } = requireAuth(req)
    if (err) return err
    const { paymentMethod, addressId, razorpay } = await req.json()

    const cart = await prisma.cart.findUnique({
      where: { userId: authUser.id },
      include: { items: { include: { variant: true, product: true } } },
    })
    if (!cart || cart.items.length === 0)
      return Response.json({ error: 'Cart is empty' }, { status: 400 })

    const subtotal = cart.items.reduce((sum, i) => sum + i.variant.price * i.qty, 0)
    const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
    const total = subtotal + shipping
    const orderNumber = `NNA-${Date.now()}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: authUser.id,
        addressId,
        paymentMethod,
        paymentStatus: paymentMethod === 'RAZORPAY' ? 'PAID' : 'PENDING',
        subtotal,
        shipping,
        total,
        razorpayOrderId: razorpay?.razorpay_order_id ?? null,
        razorpayPaymentId: razorpay?.razorpay_payment_id ?? null,
        items: {
          create: cart.items.map(i => ({
            productId: i.productId,
            variantId: i.variantId,
            qty: i.qty,
            price: i.variant.price,
          })),
        },
      },
      include: orderInclude,
    })

    await Promise.all(cart.items.flatMap(i => [
      prisma.productVariant.update({
        where: { id: i.variantId },
        data: { stockQty: { decrement: i.qty } },
      }),
      prisma.stockMovement.create({
        data: { variantId: i.variantId, type: 'SALE', qty: -i.qty, note: `Order ${orderNumber}` },
      }),
    ]))

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })

    prisma.user.findUnique({ where: { id: authUser.id } }).then(user => {
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
          name: (order as any).address.name,
          phone: (order as any).address.phone,
          line1: (order as any).address.line1,
          line2: (order as any).address.line2,
          city: (order as any).address.city,
          state: (order as any).address.state,
          pin: (order as any).address.pin,
        },
        items: cart.items.map(i => ({
          productName: i.product.name,
          variantLabel: i.variant.label,
          qty: i.qty,
          price: i.variant.price,
        })),
      })
    }).catch(() => {})

    return Response.json(formatOrder(order), { status: 201 })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
