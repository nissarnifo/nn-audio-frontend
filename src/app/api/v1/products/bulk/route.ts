import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAdmin(req)
    if (user instanceof NextResponse) return user

    const body = await req.json()
    const { ids, action } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids must be a non-empty array' }, { status: 400 })
    }

    if (action !== 'activate' && action !== 'deactivate') {
      return NextResponse.json({ error: 'action must be "activate" or "deactivate"' }, { status: 400 })
    }

    const result = await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { isActive: action === 'activate' },
    })

    return NextResponse.json({ updated: result.count })
  } catch (e) {
    return err('Internal server error', 500)
  }
}
