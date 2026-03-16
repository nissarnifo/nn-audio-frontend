import { Router } from 'express'
import { prisma, requireAuth, AuthRequest } from '../middleware/auth'
import { sendOrderNotification } from '../utils/notify'
import { calcDiscount } from './coupons'

const router = Router()

const SHIPPING_THRESHOLD = 5000
const SHIPPING_FEE = 299

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
    id: o.id,
    order_number: o.orderNumber,
    status: o.status,
    payment_method: o.paymentMethod,
    payment_status: o.paymentStatus,
    subtotal: o.subtotal,
    shipping: o.shipping,
    discount: o.discount,
    coupon_code: o.couponCode ?? null,
    total: o.total,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
    address: {
      id: o.address.id,
      label: o.address.label,
      name: o.address.name,
      phone: o.address.phone,
      line1: o.address.line1,
      line2: o.address.line2,
      city: o.address.city,
      state: o.address.state,
      pin: o.address.pin,
      is_default: o.address.isDefault,
    },
    items: o.items.map((item: any) => ({
      id: item.id,
      qty: item.qty,
      price: item.price,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        sku: item.product.sku,
        description: item.product.description,
        category: item.product.category,
        badge: item.product.badge?.replace('_', ' ') ?? null,
        specs: item.product.specs,
        rating: item.product.rating,
        review_count: item.product.reviewCount,
        is_active: item.product.isActive,
        created_at: item.product.createdAt,
        images: item.product.images.map((img: any) => ({ id: img.id, url: img.url, is_primary: img.isPrimary, order: img.order })),
        variants: item.product.variants.map((v: any) => ({ id: v.id, label: v.label, price: v.price, stock_qty: v.stockQty, is_active: v.isActive })),
      },
      variant: { id: item.variant.id, label: item.variant.label, price: item.variant.price, stock_qty: item.variant.stockQty, is_active: item.variant.isActive },
    })),
  }
}

// POST /api/v1/orders
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const { paymentMethod, addressId, razorpay, couponCode } = req.body

  const cart = await prisma.cart.findUnique({
    where: { userId: req.user!.id },
    include: { items: { include: { variant: true, product: true } } },
  })
  if (!cart || cart.items.length === 0) {
    res.status(400).json({ error: 'Cart is empty' })
    return
  }

  const subtotal = cart.items.reduce((sum, i) => sum + i.variant.price * i.qty, 0)
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE

  // Apply coupon
  let discount = 0
  let appliedCouponCode: string | null = null
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: String(couponCode).toUpperCase() } })
    if (coupon && coupon.isActive && subtotal >= coupon.minOrder &&
        (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
        (coupon.maxUses === null || coupon.usedCount < coupon.maxUses)) {
      discount = calcDiscount(coupon, subtotal)
      appliedCouponCode = coupon.code
      // Increment usedCount
      await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } })
    }
  }

  const total = Math.max(0, subtotal + shipping - discount)

  const orderNumber = `NNA-${Date.now()}`

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: req.user!.id,
      addressId,
      paymentMethod,
      paymentStatus: paymentMethod === 'RAZORPAY' ? 'PAID' : 'PENDING',
      subtotal,
      shipping,
      discount,
      couponCode: appliedCouponCode,
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
  await Promise.all(cart.items.flatMap((i) => [
    prisma.productVariant.update({
      where: { id: i.variantId },
      data: { stockQty: { decrement: i.qty } },
    }),
    prisma.stockMovement.create({
      data: { variantId: i.variantId, type: 'SALE', qty: -i.qty, note: `Order ${orderNumber}` },
    }),
  ]))

  // Clear cart
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })

  // Notify admin about new order (fire-and-forget — never blocks response)
  prisma.user.findUnique({ where: { id: req.user!.id } }).then((user) => {
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
        name: order.address.name,
        phone: order.address.phone,
        line1: order.address.line1,
        line2: order.address.line2,
        city: order.address.city,
        state: order.address.state,
        pin: order.address.pin,
      },
      items: cart.items.map((i) => ({
        productName: i.product.name,
        variantLabel: i.variant.label,
        qty: i.qty,
        price: i.variant.price,
      })),
    })
  }).catch(() => {}) // swallow errors — notification failure must not break order

  res.status(201).json(formatOrder(order))
})

// GET /api/v1/orders
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
  })
  res.json(orders.map(formatOrder))
})

// GET /api/v1/orders/:id
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: orderInclude,
  })
  if (!order) { res.status(404).json({ error: 'Order not found' }); return }
  res.json(formatOrder(order))
})

// PUT /api/v1/orders/:id/cancel
router.put('/:id/cancel', requireAuth, async (req: AuthRequest, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { items: true },
  })
  if (!order) { res.status(404).json({ error: 'Order not found' }); return }
  if (order.status !== 'PROCESSING') {
    res.status(400).json({ error: 'Order cannot be cancelled at this stage' })
    return
  }

  // Restore stock + log RETURN movements
  await Promise.all(order.items.flatMap((i) => [
    prisma.productVariant.update({
      where: { id: i.variantId },
      data: { stockQty: { increment: i.qty } },
    }),
    prisma.stockMovement.create({
      data: { variantId: i.variantId, type: 'RETURN', qty: i.qty, note: `Order ${order.orderNumber} cancelled` },
    }),
  ]))

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED', paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : order.paymentStatus },
    include: orderInclude,
  })
  res.json(formatOrder(updated))
})

export default router
