import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

function calcDiscount(coupon: { type: string; value: number }, subtotal: number): number {
  if (coupon.type === 'PERCENT') return Math.round((subtotal * coupon.value) / 100 * 100) / 100
  return Math.min(coupon.value, subtotal)
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const subtotalParam = req.nextUrl.searchParams.get('subtotal')

  if (!code) return err('code is required', 400)
  if (!subtotalParam) return err('subtotal is required', 400)

  const subtotal = parseFloat(subtotalParam)
  if (isNaN(subtotal) || subtotal < 0) return err('Invalid subtotal', 400)

  const coupon = await prisma.coupon.findUnique({ where: { code } })

  if (!coupon) return err('Invalid coupon code', 400)
  if (!coupon.isActive) return err('Coupon is not active', 400)
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return err('Coupon has expired', 400)
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return err('Coupon usage limit reached', 400)
  if (coupon.minOrder !== null && subtotal < coupon.minOrder) return err(`Minimum order amount is ${coupon.minOrder}`, 400)

  const discount = calcDiscount(coupon, subtotal)

  return NextResponse.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount,
  })
}
