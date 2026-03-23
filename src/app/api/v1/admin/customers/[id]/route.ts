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
            address: true,
            items: { include: { product: { select: { id: true, name: true, slug: true } }, variant: true } },
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
      created_at: customer.createdAt,
      stats: {
        total_orders: customer._count.orders,
        total_returns: customer._count.returns,
        total_reviews: customer._count.reviews,
        total_spend: totalSpend,
        avg_order_value: avgOrderValue,
      },
      orders: customer.orders,
      returns: customer.returns,
      reviews: customer.reviews,
    })
  } catch (e) {
    return err('Failed to fetch customer', 500)
  }
}
