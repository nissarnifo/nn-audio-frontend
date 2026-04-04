import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

function formatCoupon(c: any) {
  return { id: c.id, code: c.code, type: c.type, value: c.value, min_order: c.minOrder, max_uses: c.maxUses, used_count: c.usedCount, expires_at: c.expiresAt, is_active: c.isActive, created_at: c.createdAt }
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(coupons.map(formatCoupon))
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin

  const body = await req.json()
  const { code, type, value, min_order, max_uses, expires_at } = body

  if (!code) return err('code is required', 400)
  if (!type) return err('type is required', 400)
  if (value === undefined || value === null) return err('value is required', 400)

  const existing = await prisma.coupon.findUnique({ where: { code } })
  if (existing) return err('Coupon code already exists', 409)

  const coupon = await prisma.coupon.create({
    data: {
      code,
      type,
      value,
      minOrder: min_order ?? null,
      maxUses: max_uses ?? null,
      expiresAt: expires_at ? new Date(expires_at) : null,
    },
  })

  return NextResponse.json(formatCoupon(coupon), { status: 201 })
}
