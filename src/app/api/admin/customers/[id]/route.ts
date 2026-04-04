import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req)
    if (admin instanceof NextResponse) return admin

    const customer = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
          },
        },
        returns: {
          orderBy: { createdAt: 'desc' },
          include: { order: { select: { orderNumber: true, total: true } } },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: { product: { select: { id: true, name: true, slug: true } } },
        },
        _count: {
          select: { orders: true, returns: true, reviews: true },
        },
      },
    })

    if (!customer) return err('Customer not found', 404)

    const completedOrders = customer.orders.filter((o) => o.status !== 'CANCELLED')
    const totalSpend = completedOrders.reduce((sum, o) => sum + o.total, 0)
    const avgOrderValue = completedOrders.length > 0 ? totalSpend / completedOrders.length : 0

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? null,
      role: customer.role,
      created_at: customer.createdAt,
      stats: {
        total_spend: totalSpend,
        avg_order_value: avgOrderValue,
        order_count: customer._count.orders,
        return_count: customer._count.returns,
        review_count: customer._count.reviews,
      },
      orders: customer.orders.map((o) => ({
        id: o.id,
        order_number: o.orderNumber,
        status: o.status,
        payment_status: o.paymentStatus,
        total: o.total,
        item_count: o.items.length,
        created_at: o.createdAt,
      })),
      returns: customer.returns.map((r) => ({
        id: r.id,
        status: r.status,
        reason: r.reason,
        admin_note: r.adminNote ?? null,
        order_number: r.order.orderNumber,
        order_total: r.order.total,
        created_at: r.createdAt,
      })),
      reviews: customer.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        product_name: r.product.name,
        product_slug: r.product.slug,
        created_at: r.createdAt,
      })),
    })
  } catch (e) {
    return err('Failed to fetch customer', 500)
  }
}
