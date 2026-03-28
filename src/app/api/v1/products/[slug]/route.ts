import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'
import slugify from 'slugify'

export const dynamic = 'force-dynamic'

const productInclude = {
  images: { orderBy: { order: 'asc' as const } },
  variants: true,
}

function formatProduct(p: any) {
  const now = new Date()
  const onSale = p.salePrice != null && (p.saleStartAt == null || p.saleStartAt <= now) && (p.saleEndAt == null || p.saleEndAt > now)
  return {
    id: p.id, name: p.name, slug: p.slug, sku: p.sku, description: p.description,
    category: p.category, badge: p.badge?.replace('_', ' ') ?? null, specs: p.specs,
    rating: p.rating, review_count: p.reviewCount, sale_price: p.salePrice ?? null,
    sale_start_at: p.saleStartAt ?? null, sale_end_at: p.saleEndAt ?? null, on_sale: onSale,
    is_active: p.isActive, created_at: p.createdAt,
    images: p.images.map((img: any) => ({ id: img.id, url: img.url, is_primary: img.isPrimary, order: img.order })),
    variants: p.variants.map((v: any) => ({ id: v.id, label: v.label, price: v.price, stock_qty: v.stockQty, is_active: v.isActive })),
  }
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params

    const product = await prisma.product.findUnique({
      where: { slug },
      include: productInclude,
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(formatProduct(product))
  } catch (e) {
    return err('Internal server error', 500)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const user = await requireAdmin(req)
    if (user instanceof NextResponse) return user

    const { slug } = params

    const product = await prisma.product.findUnique({ where: { slug } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, description, category, badge, specs, is_active, variants } = body

    const updateData: any = {}
    if (name !== undefined) {
      updateData.name = name
      updateData.slug = slugify(name, { lower: true, strict: true })
    }
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (badge !== undefined) updateData.badge = badge
    if (specs !== undefined) updateData.specs = specs
    if (is_active !== undefined) updateData.isActive = is_active

    if (variants !== undefined) {
      await prisma.productVariant.deleteMany({ where: { productId: product.id } })
      updateData.variants = {
        create: variants.map((v: any) => ({
          label: v.label,
          price: v.price,
          stockQty: v.stock_qty ?? v.stockQty ?? 0,
          isActive: v.is_active ?? v.isActive ?? true,
        })),
      }
    }

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: updateData,
      include: productInclude,
    })

    return NextResponse.json(formatProduct(updated))
  } catch (e) {
    return err('Internal server error', 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const user = await requireAdmin(req)
    if (user instanceof NextResponse) return user

    const { slug } = params

    const product = await prisma.product.findUnique({ where: { slug } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    await prisma.product.delete({ where: { id: product.id } })

    return NextResponse.json({ message: 'Product deleted' })
  } catch (e) {
    return err('Internal server error', 500)
  }
}
