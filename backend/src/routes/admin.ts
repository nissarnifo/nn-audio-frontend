import { Router } from 'express'
import { prisma, requireAdmin, AuthRequest } from '../middleware/auth'
import { sendStockAlertEmail } from '../utils/notify'

const router = Router()

const orderInclude = {
  items: {
    include: {
      product: { include: { images: { orderBy: { order: 'asc' as const } }, variants: true } },
      variant: true,
    },
  },
  address: true,
  user: { select: { id: true, name: true, email: true } },
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
    user: o.user,
    address: { id: o.address.id, label: o.address.label, name: o.address.name, phone: o.address.phone, line1: o.address.line1, line2: o.address.line2, city: o.address.city, state: o.address.state, pin: o.address.pin, is_default: o.address.isDefault },
    items: o.items.map((item: any) => ({
      id: item.id,
      qty: item.qty,
      price: item.price,
      product: { id: item.product.id, name: item.product.name, slug: item.product.slug, sku: item.product.sku, description: item.product.description, category: item.product.category, badge: item.product.badge?.replace('_', ' ') ?? null, specs: item.product.specs, rating: item.product.rating, review_count: item.product.reviewCount, is_active: item.product.isActive, created_at: item.product.createdAt, images: item.product.images.map((img: any) => ({ id: img.id, url: img.url, is_primary: img.isPrimary, order: img.order })), variants: item.product.variants.map((v: any) => ({ id: v.id, label: v.label, price: v.price, stock_qty: v.stockQty, is_active: v.isActive })) },
      variant: { id: item.variant.id, label: item.variant.label, price: item.variant.price, stock_qty: item.variant.stockQty, is_active: item.variant.isActive },
    })),
  }
}

// GET /api/v1/admin/stats
router.get('/stats', requireAdmin, async (_req: AuthRequest, res) => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalRevenue, monthRevenue, totalOrders, monthOrders, totalCustomers, pendingOrders, monthlyRaw, topProductsRaw, ordersByStatus] = await Promise.all([
    prisma.order.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { status: { not: 'CANCELLED' }, createdAt: { gte: monthStart } }, _sum: { total: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.count({ where: { status: 'PROCESSING' } }),
    prisma.$queryRaw<Array<{ month: string; revenue: number }>>`
      SELECT TO_CHAR(DATE_TRUNC('month', "created_at"), 'Mon') as month,
             COALESCE(SUM(total), 0)::float as revenue
      FROM orders
      WHERE status != 'CANCELLED'
        AND "created_at" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "created_at")
      ORDER BY DATE_TRUNC('month', "created_at")
    `,
    prisma.$queryRaw<Array<{ name: string; revenue: number }>>`
      SELECT p.name, COALESCE(SUM(oi.price * oi.qty), 0)::float as revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status != 'CANCELLED'
      GROUP BY p.id, p.name
      ORDER BY revenue DESC
      LIMIT 5
    `,
    prisma.order.groupBy({ by: ['status'], _count: { status: true } }),
  ])

  res.json({
    total_revenue: totalRevenue._sum.total ?? 0,
    month_revenue: monthRevenue._sum.total ?? 0,
    total_orders: totalOrders,
    month_orders: monthOrders,
    total_customers: totalCustomers,
    pending_orders: pendingOrders,
    monthly_revenue: monthlyRaw,
    top_products: topProductsRaw,
    orders_by_status: ordersByStatus.map((o) => ({ status: o.status, count: o._count.status })),
  })
})

// GET /api/v1/admin/orders
router.get('/orders', requireAdmin, async (req: AuthRequest, res) => {
  const { status, page = '1', limit = '20' } = req.query as Record<string, string>
  const skip = (parseInt(page) - 1) * parseInt(limit)

  const where: any = {}
  if (status) where.status = status

  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, include: orderInclude, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
    prisma.order.count({ where }),
  ])

  res.json({
    data: orders.map(formatOrder),
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    total_pages: Math.ceil(total / parseInt(limit)),
  })
})

// PUT /api/v1/admin/orders/:id/status
router.put('/orders/:id/status', requireAdmin, async (req: AuthRequest, res) => {
  const { status } = req.body
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status },
    include: orderInclude,
  })
  res.json(formatOrder(order))
})

// GET /api/v1/admin/customers
router.get('/customers', requireAdmin, async (req: AuthRequest, res) => {
  const { page = '1', search } = req.query as Record<string, string>
  const limit = 20
  const skip = (parseInt(page) - 1) * limit

  const where: any = { role: 'CUSTOMER' }
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
  ]

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  res.json({
    data: customers.map((c) => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, role: c.role, created_at: c.createdAt, order_count: c._count.orders })),
    total,
    page: parseInt(page),
    limit,
    total_pages: Math.ceil(total / limit),
  })
})

// ─── Inventory ────────────────────────────────────────────────────────────────

// GET /api/v1/admin/inventory  — all variants with product info + stock
router.get('/inventory', requireAdmin, async (_req: AuthRequest, res) => {
  const variants = await prisma.productVariant.findMany({
    include: {
      product: { select: { id: true, name: true, sku: true, category: true, images: { where: { isPrimary: true }, take: 1 } } },
    },
    orderBy: { stockQty: 'asc' },
  })

  const [totalValue, outOfStock, lowStock] = [
    variants.reduce((s, v) => s + v.price * v.stockQty, 0),
    variants.filter(v => v.stockQty === 0).length,
    variants.filter(v => v.stockQty > 0 && v.stockQty <= 5).length,
  ]

  res.json({
    variants: variants.map(v => ({
      id: v.id,
      label: v.label,
      price: v.price,
      stock_qty: v.stockQty,
      is_active: v.isActive,
      product: {
        id: v.product.id,
        name: v.product.name,
        sku: v.product.sku,
        category: v.product.category,
        image: v.product.images[0]?.url ?? null,
      },
    })),
    summary: {
      total_skus: variants.length,
      out_of_stock: outOfStock,
      low_stock: lowStock,
      total_value: totalValue,
    },
  })
})

// POST /api/v1/admin/inventory/restock  — purchase stock in
router.post('/inventory/restock', requireAdmin, async (req: AuthRequest, res) => {
  const { variantId, qty, note } = req.body as { variantId: string; qty: number; note?: string }
  if (!variantId || !qty || qty < 1) {
    res.status(400).json({ error: 'variantId and qty (≥1) are required' })
    return
  }

  // Capture whether variant was out of stock BEFORE restocking
  const before = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { name: true, slug: true } } },
  })
  const wasOutOfStock = before && before.stockQty === 0

  const [variant] = await prisma.$transaction([
    prisma.productVariant.update({
      where: { id: variantId },
      data: { stockQty: { increment: qty } },
    }),
    prisma.stockMovement.create({
      data: { variantId, type: 'PURCHASE', qty, note: note || null },
    }),
  ])

  // Fire back-in-stock emails if variant just came back in stock
  if (wasOutOfStock && before) {
    const pendingAlerts = await prisma.stockAlert.findMany({
      where: { variantId, notifiedAt: null },
    })
    const frontendUrl = process.env.FRONTEND_URL || 'https://nnaudio.in'
    await Promise.allSettled(
      pendingAlerts.map(async (alert) => {
        await sendStockAlertEmail({
          toEmail: alert.email,
          productName: before.product.name,
          variantLabel: before.label,
          productSlug: before.product.slug,
          frontendUrl,
        })
        await prisma.stockAlert.update({
          where: { id: alert.id },
          data: { notifiedAt: new Date() },
        })
      })
    )
    if (pendingAlerts.length > 0) {
      console.log(`[restock] Sent ${pendingAlerts.length} back-in-stock alerts for variant ${variantId}`)
    }
  }

  res.json({ id: variant.id, stock_qty: variant.stockQty })
})

// POST /api/v1/admin/inventory/adjust  — manual adjustment (can be negative)
router.post('/inventory/adjust', requireAdmin, async (req: AuthRequest, res) => {
  const { variantId, qty, note } = req.body as { variantId: string; qty: number; note?: string }
  if (!variantId || qty === undefined) {
    res.status(400).json({ error: 'variantId and qty are required' })
    return
  }
  const current = await prisma.productVariant.findUnique({ where: { id: variantId } })
  if (!current) { res.status(404).json({ error: 'Variant not found' }); return }
  const newQty = Math.max(0, current.stockQty + qty)
  const [variant] = await prisma.$transaction([
    prisma.productVariant.update({
      where: { id: variantId },
      data: { stockQty: newQty },
    }),
    prisma.stockMovement.create({
      data: { variantId, type: 'ADJUSTMENT', qty, note: note || null },
    }),
  ])
  res.json({ id: variant.id, stock_qty: variant.stockQty })
})

// GET /api/v1/admin/inventory/movements  — stock movement log
router.get('/inventory/movements', requireAdmin, async (req: AuthRequest, res) => {
  const { page = '1', type } = req.query as Record<string, string>
  const limit = 30
  const skip = (parseInt(page) - 1) * limit
  const where: any = {}
  if (type) where.type = type

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        variant: {
          include: {
            product: { select: { name: true, sku: true, category: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.stockMovement.count({ where }),
  ])

  res.json({
    data: movements.map(m => ({
      id: m.id,
      type: m.type,
      qty: m.qty,
      note: m.note,
      created_at: m.createdAt,
      variant: { id: m.variant.id, label: m.variant.label, price: m.variant.price },
      product: { name: m.variant.product.name, sku: m.variant.product.sku, category: m.variant.product.category },
    })),
    total,
    page: parseInt(page),
    total_pages: Math.ceil(total / limit),
  })
})

// GET /api/v1/admin/analytics  — chart data
router.get('/analytics', requireAdmin, async (_req: AuthRequest, res) => {
  const [dailyRevenue, categoryRevenue, newCustomers, couponUsage] = await Promise.all([
    // Daily revenue — last 30 days
    prisma.$queryRaw<Array<{ day: string; revenue: number; orders: number }>>`
      SELECT TO_CHAR(DATE_TRUNC('day', "created_at"), 'DD Mon') as day,
             COALESCE(SUM(total), 0)::float as revenue,
             COUNT(*)::int as orders
      FROM orders
      WHERE status != 'CANCELLED'
        AND "created_at" >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', "created_at")
      ORDER BY DATE_TRUNC('day', "created_at")
    `,
    // Revenue by category — all time
    prisma.$queryRaw<Array<{ category: string; revenue: number; units: number }>>`
      SELECT p.category,
             COALESCE(SUM(oi.price * oi.qty), 0)::float as revenue,
             COALESCE(SUM(oi.qty), 0)::int as units
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status != 'CANCELLED'
      GROUP BY p.category
      ORDER BY revenue DESC
    `,
    // New customers per month — last 6 months
    prisma.$queryRaw<Array<{ month: string; count: number }>>`
      SELECT TO_CHAR(DATE_TRUNC('month', "created_at"), 'Mon YY') as month,
             COUNT(*)::int as count
      FROM users
      WHERE role = 'CUSTOMER'
        AND "created_at" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "created_at")
      ORDER BY DATE_TRUNC('month', "created_at")
    `,
    // Coupon usage — top 10 by savings
    prisma.$queryRaw<Array<{ code: string; uses: number; total_savings: number }>>`
      SELECT coupon_code as code,
             COUNT(*)::int as uses,
             COALESCE(SUM(discount), 0)::float as total_savings
      FROM orders
      WHERE coupon_code IS NOT NULL
        AND status != 'CANCELLED'
      GROUP BY coupon_code
      ORDER BY total_savings DESC
      LIMIT 10
    `,
  ])

  res.json({
    daily_revenue: dailyRevenue,
    category_revenue: categoryRevenue,
    new_customers: newCustomers,
    coupon_usage: couponUsage,
  })
})

// GET /api/v1/admin/returns  — list all return requests
router.get('/returns', requireAdmin, async (req: AuthRequest, res) => {
  const { page = '1', status } = req.query as Record<string, string>
  const limit = 20
  const skip = (parseInt(page) - 1) * limit
  const where: any = {}
  if (status) where.status = status

  const [returns, total] = await Promise.all([
    prisma.return.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { orderNumber: true, total: true, createdAt: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.return.count({ where }),
  ])

  res.json({
    data: returns.map((r) => ({
      id: r.id,
      order_number: r.order.orderNumber,
      order_total: r.order.total,
      order_date: r.order.createdAt,
      user: r.user,
      reason: r.reason,
      notes: r.notes,
      status: r.status,
      admin_note: r.adminNote,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    })),
    total,
    page: parseInt(page),
    total_pages: Math.ceil(total / limit),
  })
})

// PUT /api/v1/admin/returns/:id/status  — approve / reject / refund
router.put('/returns/:id/status', requireAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params
  const { status, admin_note } = req.body

  const allowed = ['APPROVED', 'REJECTED', 'REFUNDED']
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${allowed.join(', ')}` })
  }

  const ret = await prisma.return.update({
    where: { id },
    data: { status, adminNote: admin_note ?? null },
  })

  // If refunded, mark the order payment status as REFUNDED too
  if (status === 'REFUNDED') {
    await prisma.order.update({
      where: { id: ret.orderId },
      data: { paymentStatus: 'REFUNDED' },
    })
  }

  res.json({ id: ret.id, status: ret.status, admin_note: ret.adminNote })
})

export default router
