import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin

  const coupon = await prisma.coupon.findUnique({ where: { id: params.id } })
  if (!coupon) return err('Coupon not found', 404)

  const orders = await prisma.order.findMany({
    where: { couponCode: coupon.code },
    orderBy: { createdAt: 'desc' },
  })

  const totalDiscount = orders.reduce((sum: number, o: any) => sum + (o.discount ?? 0), 0)

  return NextResponse.json({
    code: coupon.code,
    used_count: coupon.usedCount,
    max_uses: coupon.maxUses,
    total_discount: totalDiscount,
    orders: orders.map((o: any) => ({
      id: o.id,
      order_number: o.orderNumber,
      status: o.status,
      subtotal: o.subtotal,
      discount: o.discount,
      total: o.total,
      created_at: o.createdAt,
    })),
  })
}
