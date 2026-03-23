import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (admin instanceof NextResponse) return admin

    const [dailyRevenue, categoryRevenue, newCustomers, couponUsage] = await Promise.all([
      prisma.$queryRaw<{ date: string; revenue: number; orders: number }[]>`
        SELECT TO_CHAR(DATE_TRUNC('day', "created_at"), 'YYYY-MM-DD') as date,
               COALESCE(SUM(total), 0)::float as revenue,
               COUNT(*)::int as orders
        FROM orders
        WHERE status != 'CANCELLED'
          AND "created_at" >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', "created_at")
        ORDER BY DATE_TRUNC('day', "created_at")
      `,
      prisma.$queryRaw<{ category: string; revenue: number; units: number }[]>`
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
      prisma.$queryRaw<{ month: string; new_customers: number }[]>`
        SELECT TO_CHAR(DATE_TRUNC('month', "created_at"), 'Mon') as month,
               COUNT(*)::int as new_customers
        FROM users
        WHERE role = 'CUSTOMER'
          AND "created_at" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "created_at")
        ORDER BY DATE_TRUNC('month', "created_at")
      `,
      prisma.$queryRaw<{ coupon_code: string; uses: number; total_discount: number }[]>`
        SELECT coupon_code,
               COUNT(*)::int as uses,
               COALESCE(SUM(discount), 0)::float as total_discount
        FROM orders
        WHERE coupon_code IS NOT NULL
          AND status != 'CANCELLED'
        GROUP BY coupon_code
        ORDER BY uses DESC
        LIMIT 10
      `,
    ])

    return NextResponse.json({
      daily_revenue: dailyRevenue,
      category_revenue: categoryRevenue,
      new_customers: newCustomers,
      coupon_usage: couponUsage,
    })
  } catch (e) {
    return err('Failed to fetch analytics', 500)
  }
}
