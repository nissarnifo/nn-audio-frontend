import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireAdmin, err } from '@/lib/api-helpers'

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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireUser(req)
  if (user instanceof NextResponse) return user

  const order = await prisma.order.findFirst({
    where: { id: params.id, userId: user.id },
    include: orderInclude,
  })

  if (!order) return err('Order not found', 404)

  if (order.status !== 'PROCESSING') return err('Only orders in PROCESSING status can be cancelled', 400)

  // Restore stock + create RETURN stockMovements
  for (const item of order.items) {
    await prisma.productVariant.update({
      where: { id: item.variantId },
      data: { stockQty: { increment: item.qty } },
    })
    await prisma.stockMovement.create({
      data: {
        variantId: item.variantId,
        type: 'RETURN',
        qty: item.qty,
        note: `Cancelled order ${order.orderNumber}`,
      },
    })
  }

  // Update status to CANCELLED, paymentStatus to REFUNDED if was PAID
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'CANCELLED',
      paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : order.paymentStatus,
    },
    include: orderInclude,
  })

  return NextResponse.json(formatOrder(updatedOrder))
}
