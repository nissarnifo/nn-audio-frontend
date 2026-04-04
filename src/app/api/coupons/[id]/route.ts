import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

function formatCoupon(c: any) {
  return { id: c.id, code: c.code, type: c.type, value: c.value, min_order: c.minOrder, max_uses: c.maxUses, used_count: c.usedCount, expires_at: c.expiresAt, is_active: c.isActive, created_at: c.createdAt }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin

  const body = await req.json()
  const { code, type, value, min_order, max_uses, expires_at, is_active } = body

  const existing = await prisma.coupon.findUnique({ where: { id: params.id } })
  if (!existing) return err('Coupon not found', 404)

  // Check uniqueness if code is being changed
  if (code && code !== existing.code) {
    const codeConflict = await prisma.coupon.findUnique({ where: { code } })
    if (codeConflict) return err('Coupon code already exists', 409)
  }

  const coupon = await prisma.coupon.update({
    where: { id: params.id },
    data: {
      ...(code !== undefined && { code }),
      ...(type !== undefined && { type }),
      ...(value !== undefined && { value }),
      ...(min_order !== undefined && { minOrder: min_order }),
      ...(max_uses !== undefined && { maxUses: max_uses }),
      ...(expires_at !== undefined && { expiresAt: expires_at ? new Date(expires_at) : null }),
      ...(is_active !== undefined && { isActive: is_active }),
    },
  })

  return NextResponse.json(formatCoupon(coupon))
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin

  const existing = await prisma.coupon.findUnique({ where: { id: params.id } })
  if (!existing) return err('Coupon not found', 404)

  await prisma.coupon.delete({ where: { id: params.id } })

  return NextResponse.json({ message: 'Coupon deleted' })
}
