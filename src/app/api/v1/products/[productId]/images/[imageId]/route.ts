import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { deleteFromCloudinary } from '@/lib/cloudinary-server'

export async function DELETE(req: NextRequest, { params }: { params: { productId: string; imageId: string } }) {
  try {
    const { user: authUser, err } = requireAdmin(req)
    if (err) return err
    const image = await prisma.productImage.findUnique({ where: { id: params.imageId } })
    if (!image) return Response.json({ error: 'Image not found' }, { status: 404 })
    await deleteFromCloudinary(image.publicId)
    await prisma.productImage.delete({ where: { id: params.imageId } })
    return Response.json({ message: 'Image deleted' })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
