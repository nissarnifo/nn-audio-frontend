import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (admin instanceof NextResponse) return admin

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [newOrders, pendingReturns, unansweredQuestions, lowStockVariants] = await Promise.all([
      prisma.order.count({ where: { status: 'PROCESSING', createdAt: { gte: since24h } } }),
      prisma.return.count({ where: { status: 'REQUESTED' } }),
      prisma.question.count({ where: { answer: null } }),
      prisma.productVariant.count({ where: { stockQty: { lte: 5, gt: 0 }, isActive: true } }),
    ])

    return NextResponse.json({
      total: newOrders + pendingReturns + unansweredQuestions + lowStockVariants,
      new_orders: newOrders,
      pending_returns: pendingReturns,
      unanswered_questions: unansweredQuestions,
      low_stock_variants: lowStockVariants,
    })
  } catch (e) {
    return err('Failed to fetch notifications', 500)
  }
}
