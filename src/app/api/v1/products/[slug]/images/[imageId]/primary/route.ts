import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { slug: string; imageId: string } }) {
  try {
    const user = await requireAdmin(req)
    if (user instanceof NextResponse) return user

    // params.slug is the product ID here
    const productId = params.slug
    const { imageId } = params

    const image = await prisma.productImage.findUnique({ where: { id: imageId } })
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      }),
      prisma.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ])

    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(
      images.map((img) => ({ id: img.id, url: img.url, is_primary: img.isPrimary, order: img.order }))
    )
  } catch (e) {
    return err('Internal server error', 500)
  }
}
