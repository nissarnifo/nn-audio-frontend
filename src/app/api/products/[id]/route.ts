import { NextRequest, NextResponse } from 'next/server'
import slugify from 'slugify'
import { prisma } from '@/lib/prisma'
import { requireAdmin, apiError } from '@/lib/api-auth'
import { formatProduct } from '../route'

const productInclude = {
  images: { orderBy: { order: 'asc' as const } },
  variants: true,
}

// GET /api/products/[id] — get by slug (public) or by cuid (admin)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    // Try slug first (public), then by cuid ID
    const product =
      (await prisma.product.findUnique({ where: { slug: id }, include: productInclude })) ??
      (await prisma.product.findUnique({ where: { id }, include: productInclude }))

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    return NextResponse.json(formatProduct(product))
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}

// PUT /api/products/[id] — update by ID (admin)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(req)
    const { name, description, category, badge, specs, is_active, variants } = await req.json()
    const data: any = {}
    if (name) { data.name = name; data.slug = slugify(name, { lower: true, strict: true }) }
    if (description) data.description = description
    if (category) data.category = category
    if (badge !== undefined) data.badge = badge?.replace(' ', '_') || null
    if (specs) data.specs = specs
    if (is_active !== undefined) data.isActive = is_active

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...data,
        ...(variants && {
          variants: {
            deleteMany: {},
            create: variants.map((v: any) => ({
              label: v.label, price: v.price, stockQty: v.stock_qty ?? 0, isActive: v.is_active ?? true,
            })),
          },
        }),
      },
      include: productInclude,
    })
    return NextResponse.json(formatProduct(product))
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}

// DELETE /api/products/[id] — delete by ID (admin)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(req)
    await prisma.product.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Product deleted' })
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
