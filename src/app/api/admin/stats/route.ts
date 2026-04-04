import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, apiError } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalRevenue, monthRevenue, totalOrders, monthOrders,
      totalCustomers, pendingOrders, monthlyRaw, topProductsRaw, ordersByStatus,
    ] = await Promise.all([
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

    return NextResponse.json({
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
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
