import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireAdmin, err } from '@/lib/api-helpers'
import { sendOrderNotification, sendOrderConfirmationEmail } from '@/lib/notify'

export const dynamic = 'force-dynamic'

const orderInclude = {
  items: {
    include: {
      product: { include: { images: { orderBy: { order: 'asc' as const } }, variants: true } },
      variant: true,
    },
  },
  address: true,
}

function formatOrder(o: any) {
  return {
    id: o.id, order_number: o.orderNumber, status: o.status,
    payment_method: o.paymentMethod, payment_status: o.paymentStatus,
    subtotal: o.subtotal, shipping: o.shipping, discount: o.discount,
    coupon_code: o.couponCode ?? null, total: o.total,
    tracking_number: o.trackingNumber ?? null, tracking_url: o.trackingUrl ?? null,
    notes: o.notes ?? null, created_at: o.createdAt, updated_at: o.updatedAt,
    address: { id: o.address.id, label: o.address.label, name: o.address.name, phone: o.address.phone, line1: o.address.line1, line2: o.address.line2, city: o.address.city, state: o.address.state, pin: o.address.pin, is_default: o.address.isDefault },
    items: o.items.map((item: any) => ({
      id: item.id, qty: item.qty, price: item.price,
      product: { id: item.product.id, name: item.product.name, slug: item.product.slug, sku: item.product.sku, description: item.product.description, category: item.product.category, badge: item.product.badge?.replace('_', ' ') ?? null, specs: item.product.specs, rating: item.product.rating, review_count: item.product.reviewCount, is_active: item.product.isActive, created_at: item.product.createdAt, images: item.product.images.map((img: any) => ({ id: img.id, url: img.url, is_primary: img.isPrimary, order: img.order })), variants: item.product.variants.map((v: any) => ({ id: v.id, label: v.label, price: v.price, stock_qty: v.stockQty, is_active: v.isActive })) },
      variant: { id: item.variant.id, label: item.variant.label, price: item.variant.price, stock_qty: item.variant.stockQty, is_active: item.variant.isActive },
    })),
  }
}

function calcDiscount(coupon: { type: string; value: number }, subtotal: number): number {
  if (coupon.type === 'PERCENT') return Math.round((subtotal * coupon.value) / 100 * 100) / 100
  return Math.min(coupon.value, subtotal)
}

async function getShippingSettings(): Promise<{ threshold: number; fee: number }> {
  const rows = await prisma.setting.findMany({ where: { key: { in: ['shipping_threshold', 'shipping_fee'] } } })
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value
  return {
    threshold: parseFloat(map.shipping_threshold ?? '5000'),
    fee: parseFloat(map.shipping_fee ?? '299'),
  }
}

export async function GET(req: NextRequest) {
  const user = await requireUser(req)
  if (user instanceof NextResponse) return user

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(orders.map(formatOrder))
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req)
  if (user instanceof NextResponse) return user

  const body = await req.json()
  const { paymentMethod, addressId, razorpay, couponCode, notes } = body

  // Get cart with items
  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  })

  if (!cart || cart.items.length === 0) return err('Cart is empty', 400)

  // Calculate subtotal
  const subtotal = cart.items.reduce((sum: number, item: any) => sum + item.variant.price * item.qty, 0)

  // Calculate shipping
  const { threshold, fee } = await getShippingSettings()
  const shipping = subtotal >= threshold ? 0 : fee

  // Apply coupon if provided
  let discount = 0
  let appliedCouponCode: string | null = null
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } })
    if (!coupon) return err('Invalid coupon code', 400)
    if (!coupon.isActive) return err('Coupon is not active', 400)
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return err('Coupon has expired', 400)
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return err('Coupon usage limit reached', 400)
    if (coupon.minOrder !== null && subtotal < coupon.minOrder) return err(`Minimum order amount is ${coupon.minOrder}`, 400)

    discount = calcDiscount(coupon, subtotal)
    appliedCouponCode = coupon.code

    await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } })
  }

  const total = subtotal + shipping - discount

  // Determine payment status
  const paymentStatus = razorpay ? 'PAID' : 'PENDING'

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

  // Create order with items
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      orderNumber,
      status: 'PROCESSING',
      paymentMethod,
      paymentStatus,
      subtotal,
      shipping,
      discount,
      couponCode: appliedCouponCode,
      total,
      addressId,
      notes: notes ?? null,
      razorpayOrderId: razorpay?.razorpay_order_id ?? null,
      razorpayPaymentId: razorpay?.razorpay_payment_id ?? null,
      items: {
        create: cart.items.map((item: any) => ({
          productId: item.productId,
          variantId: item.variantId,
          qty: item.qty,
          price: item.variant.price,
        })),
      },
    },
    include: orderInclude,
  })

  // Deduct stock + create SALE stockMovements for each item
  for (const item of cart.items) {
    await prisma.productVariant.update({
      where: { id: item.variantId },
      data: { stockQty: { decrement: item.qty } },
    })
    await prisma.stockMovement.create({
      data: {
        variantId: item.variantId,
        type: 'SALE',
        qty: item.qty,
        note: `Order ${orderNumber}`,
      },
    })
  }

  // Clear cart items
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })

  // Fire notifications (fire-and-forget)
  prisma.user.findUnique({ where: { id: user.id } }).then((u) => {
    if (!u) return
    const payload = {
      orderNumber,
      customerName: u.name,
      customerEmail: u.email,
      customerPhone: u.phone ?? '',
      subtotal,
      shipping,
      total,
      paymentMethod,
      paymentStatus,
      address: {
        name: order.address.name,
        phone: order.address.phone,
        line1: order.address.line1,
        line2: order.address.line2,
        city: order.address.city,
        state: order.address.state,
        pin: order.address.pin,
      },
      items: cart.items.map((i: any) => ({
        productName: i.product.name,
        variantLabel: i.variant.label,
        qty: i.qty,
        price: i.variant.price,
      })),
    }
    return Promise.all([
      sendOrderNotification(payload),
      sendOrderConfirmationEmail(payload),
    ])
  }).catch(() => {})

  return NextResponse.json(formatOrder(order), { status: 201 })
}
