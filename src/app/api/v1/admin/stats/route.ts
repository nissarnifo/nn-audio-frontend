import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (admin instanceof NextResponse) return admin

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalRevenueResult,
      monthRevenueResult,
      totalOrders,
      monthOrders,
      totalCustomers,
      pendingOrders,
      monthlyRaw,
      topProductsRaw,
      ordersByStatus,
      lowStockRaw,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: 'CANCELLED' } },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: 'CANCELLED' }, createdAt: { gte: monthStart } },
      }),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.$queryRaw<{ month: string; revenue: number }[]>`
        SELECT TO_CHAR(DATE_TRUNC('month', "created_at"), 'Mon') as month,
               COALESCE(SUM(total), 0)::float as revenue
        FROM orders
        WHERE status != 'CANCELLED'
          AND "created_at" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "created_at")
        ORDER BY DATE_TRUNC('month', "created_at")
      `,
      prisma.$queryRaw<{ product_id: string; name: string; revenue: number; units: number }[]>`
        SELECT oi.product_id, p.name, COALESCE(SUM(oi.price * oi.qty), 0)::float as revenue, SUM(oi.qty)::int as units
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status != 'CANCELLED'
        GROUP BY oi.product_id, p.name
        ORDER BY revenue DESC
        LIMIT 5
      `,
      prisma.order.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.productVariant.findMany({
        where: { stockQty: { lte: 5 }, isActive: true },
        take: 8,
        include: { product: { select: { id: true, name: true, sku: true } } },
        orderBy: { stockQty: 'asc' },
      }),
    ])

    return NextResponse.json({
      total_revenue: totalRevenueResult._sum.total ?? 0,
      month_revenue: monthRevenueResult._sum.total ?? 0,
      total_orders: totalOrders,
      month_orders: monthOrders,
      total_customers: totalCustomers,
      pending_orders: pendingOrders,
      monthly_revenue: monthlyRaw,
      top_products: topProductsRaw,
      orders_by_status: ordersByStatus.map((s) => ({ status: s.status, count: s._count })),
      low_stock_variants: lowStockRaw.map((v) => ({
        id: v.id,
        label: v.label,
        stock_qty: v.stockQty,
        product_id: v.product.id,
        product_name: v.product.name,
        sku: v.product.sku,
      })),
    })
  } catch (e) {
    return err('Failed to fetch stats', 500)
  }
}
