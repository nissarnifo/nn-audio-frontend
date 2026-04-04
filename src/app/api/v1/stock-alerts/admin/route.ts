export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = requireAdmin(req)
  if (user instanceof NextResponse) return user

  try {
    const alerts = await prisma.stockAlert.findMany({
      where: { notifiedAt: null },
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ alerts })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
