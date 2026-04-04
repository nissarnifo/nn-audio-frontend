export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, apiError } from '@/lib/api-auth'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(req)
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const { url, publicId } = await uploadToCloudinary(buffer)

    const imageCount = await prisma.productImage.count({ where: { productId: params.id } })
    const image = await prisma.productImage.create({
      data: { productId: params.id, url, publicId, isPrimary: imageCount === 0, order: imageCount },
    })

    return NextResponse.json(
      { id: image.id, url: image.url, is_primary: image.isPrimary, order: image.order },
      { status: 201 }
    )
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
