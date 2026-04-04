export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'

export async function PATCH(req: NextRequest) {
  try {
    const user = requireAdmin(req)
    if (user instanceof NextResponse) return user

    const { ids, action } = await req.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) return err('ids array is required', 400)
    if (!['activate', 'deactivate'].includes(action)) return err('action must be activate or deactivate', 400)

    const result = await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { isActive: action === 'activate' },
    })

    return NextResponse.json({ updated: result.count })
  } catch (e) {
    return err('Internal server error', 500)
  }
}
