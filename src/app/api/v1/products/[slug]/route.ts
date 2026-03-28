import { NextRequest } from 'next/server'
import slugify from 'slugify'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { formatProduct, productInclude } from '@/lib/formatters'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: productInclude,
    })
    if (!product) return Response.json({ error: 'Product not found' }, { status: 404 })
    return Response.json(formatProduct(product))
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { user: authUser, err } = requireAdmin(req)
    if (err) return err
    const { name, description, category, badge, specs, is_active, variants } = await req.json()
    const data: any = {}
    if (name) { data.name = name; data.slug = slugify(name, { lower: true, strict: true }) }
    if (description) data.description = description
    if (category) data.category = category
    if (badge !== undefined) data.badge = badge?.replace(' ', '_') || null
    if (specs) data.specs = specs
    if (is_active !== undefined) data.isActive = is_active

    const product = await prisma.product.update({
      where: { id: params.slug },
      data: {
        ...data,
        ...(variants && {
          variants: {
            deleteMany: {},
            create: variants.map((v: any) => ({
              label: v.label,
              price: v.price,
              stockQty: v.stock_qty ?? 0,
              isActive: v.is_active ?? true,
            })),
          },
        }),
      },
      include: productInclude,
    })
    return Response.json(formatProduct(product))
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { user: authUser, err } = requireAdmin(req)
    if (err) return err
    await prisma.product.delete({ where: { id: params.slug } })
    return Response.json({ message: 'Product deleted' })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
