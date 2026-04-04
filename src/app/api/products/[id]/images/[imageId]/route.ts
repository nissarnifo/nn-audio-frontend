import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, apiError } from '@/lib/api-auth'
import { deleteFromCloudinary } from '@/lib/cloudinary'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    requireAdmin(req)
    const image = await prisma.productImage.findUnique({ where: { id: params.imageId } })
    if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    await deleteFromCloudinary(image.publicId)
    await prisma.productImage.delete({ where: { id: params.imageId } })
    return NextResponse.json({ message: 'Image deleted' })
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
