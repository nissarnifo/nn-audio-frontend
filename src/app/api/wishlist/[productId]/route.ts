export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/api-helpers'

export async function DELETE(req: NextRequest, { params }: { params: { productId: string } }) {
  const user = requireUser(req)
  if (user instanceof NextResponse) return user

  try {
    await prisma.wishlistItem.deleteMany({
      where: { userId: user.id, productId: params.productId },
    })
    return NextResponse.json({ message: 'Removed from wishlist' })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
