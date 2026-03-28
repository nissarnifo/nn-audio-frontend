import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'
import { uploadToCloudinary } from '@/lib/cloudinary-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const user = await requireAdmin(req)
    if (user instanceof NextResponse) return user

    // Note: [slug] here is actually a product ID (matching original Express routes /:id/images)
    const productId = params.slug

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const imageCount = await prisma.productImage.count({ where: { productId: product.id } })
    const isPrimary = imageCount === 0

    const result = await uploadToCloudinary(buffer)

    const image = await prisma.productImage.create({
      data: {
        productId: product.id,
        url: result.url,
        publicId: result.publicId,
        isPrimary,
        order: imageCount,
      },
    })

    return NextResponse.json(
      { id: image.id, url: image.url, is_primary: image.isPrimary, order: image.order },
      { status: 201 }
    )
  } catch (e) {
    return err('Internal server error', 500)
  }
}
