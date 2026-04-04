import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const orderInclude = {
  items: { include: { product: { include: { images: { orderBy: { order: 'asc' as const } }, variants: true } }, variant: true } },
  address: true,
  user: { select: { id: true, name: true, email: true } },
}

function formatOrder(o: any) {
  return { id: o.id, order_number: o.orderNumber, status: o.status, payment_method: o.paymentMethod, payment_status: o.paymentStatus, subtotal: o.subtotal, shipping: o.shipping, discount: o.discount, coupon_code: o.couponCode ?? null, total: o.total, tracking_number: o.trackingNumber ?? null, tracking_url: o.trackingUrl ?? null, notes: o.notes ?? null, created_at: o.createdAt, updated_at: o.updatedAt, user: o.user, address: { id: o.address.id, label: o.address.label, name: o.address.name, phone: o.address.phone, line1: o.address.line1, line2: o.address.line2, city: o.address.city, state: o.address.state, pin: o.address.pin, is_default: o.address.isDefault }, items: o.items.map((item: any) => ({ id: item.id, qty: item.qty, price: item.price, product: { id: item.product.id, name: item.product.name, slug: item.product.slug, sku: item.product.sku, description: item.product.description, category: item.product.category, badge: item.product.badge?.replace('_', ' ') ?? null, specs: item.product.specs, rating: item.product.rating, review_count: item.product.reviewCount, is_active: item.product.isActive, created_at: item.product.createdAt, images: item.product.images.map((img: any) => ({ id: img.id, url: img.url, is_primary: img.isPrimary, order: img.order })), variants: item.product.variants.map((v: any) => ({ id: v.id, label: v.label, price: v.price, stock_qty: v.stockQty, is_active: v.isActive })) }, variant: { id: item.variant.id, label: item.variant.label, price: item.variant.price, stock_qty: item.variant.stockQty, is_active: item.variant.isActive } })) }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (admin instanceof NextResponse) return admin

    const params = req.nextUrl.searchParams
    const status = params.get('status')
    const page = Math.max(1, parseInt(params.get('page') ?? '1'))
    const limit = Math.max(1, parseInt(params.get('limit') ?? '20'))
    const from = params.get('from')
    const to = params.get('to')
    const search = params.get('search') ?? ''

    const where: any = {}

    if (status) where.status = status

    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { address: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      data: orders.map(formatOrder),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    })
  } catch (e) {
    return err('Failed to fetch orders', 500)
  }
}
