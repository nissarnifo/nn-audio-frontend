export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, apiError } from '@/lib/api-auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    requireAdmin(req)
    const image = await prisma.productImage.findUnique({ where: { id: params.imageId } })
    if (!image || image.productId !== params.id) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.productImage.updateMany({ where: { productId: params.id }, data: { isPrimary: false } }),
      prisma.productImage.update({ where: { id: params.imageId }, data: { isPrimary: true } }),
    ])

    const images = await prisma.productImage.findMany({
      where: { productId: params.id },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(images.map((img) => ({ id: img.id, url: img.url, is_primary: img.isPrimary, order: img.order })))
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
