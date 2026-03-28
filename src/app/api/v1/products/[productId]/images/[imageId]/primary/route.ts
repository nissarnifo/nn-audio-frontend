import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'

export async function PUT(req: NextRequest, { params }: { params: { productId: string; imageId: string } }) {
  try {
    const { user: authUser, err } = requireAdmin(req)
    if (err) return err
    const image = await prisma.productImage.findUnique({ where: { id: params.imageId } })
    if (!image || image.productId !== params.productId)
      return Response.json({ error: 'Image not found' }, { status: 404 })

    await prisma.$transaction([
      prisma.productImage.updateMany({ where: { productId: params.productId }, data: { isPrimary: false } }),
      prisma.productImage.update({ where: { id: params.imageId }, data: { isPrimary: true } }),
    ])

    const images = await prisma.productImage.findMany({ where: { productId: params.productId }, orderBy: { order: 'asc' } })
    return Response.json(images.map(img => ({ id: img.id, url: img.url, is_primary: img.isPrimary, order: img.order })))
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
