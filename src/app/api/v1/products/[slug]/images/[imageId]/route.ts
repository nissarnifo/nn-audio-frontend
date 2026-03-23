import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'
import { deleteFromCloudinary } from '@/lib/cloudinary-server'

export const dynamic = 'force-dynamic'

export async function DELETE(req: NextRequest, { params }: { params: { slug: string; imageId: string } }) {
  try {
    const user = await requireAdmin(req)
    if (user instanceof NextResponse) return user

    const { imageId } = params

    const image = await prisma.productImage.findUnique({ where: { id: imageId } })
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    if (image.publicId) {
      await deleteFromCloudinary(image.publicId)
    }

    await prisma.productImage.delete({ where: { id: imageId } })

    return NextResponse.json({ message: 'Image deleted' })
  } catch (e) {
    return err('Internal server error', 500)
  }
}
