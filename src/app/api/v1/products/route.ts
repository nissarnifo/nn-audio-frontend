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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort')
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '12')
    const min_price = searchParams.get('min_price')
    const max_price = searchParams.get('max_price')
    const in_stock = searchParams.get('in_stock')
    const min_rating = searchParams.get('min_rating')
    const on_sale = searchParams.get('on_sale')
    const ids = searchParams.get('ids')

    const where: any = {}

    if (ids) {
      const idList = ids.split(',').map((id) => id.trim()).filter(Boolean)
      where.id = { in: idList }
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (min_rating) {
      where.rating = { gte: parseFloat(min_rating) }
    }

    if (on_sale === 'true') {
      const now = new Date()
      where.salePrice = { not: null }
      where.AND = [
        {
          OR: [
            { saleStartAt: null },
            { saleStartAt: { lte: now } },
          ],
        },
        {
          OR: [
            { saleEndAt: null },
            { saleEndAt: { gt: now } },
          ],
        },
      ]
    }

    const variantWhere: any = {}
    if (min_price) variantWhere.price = { ...variantWhere.price, gte: parseFloat(min_price) }
    if (max_price) variantWhere.price = { ...variantWhere.price, lte: parseFloat(max_price) }
    if (in_stock === 'true') variantWhere.stockQty = { gt: 0 }

    if (Object.keys(variantWhere).length > 0) {
      where.variants = { some: variantWhere }
    }

    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'price_asc') {
      orderBy = { variants: { _min: { price: 'asc' } } }
    } else if (sort === 'price_desc') {
      orderBy = { variants: { _min: { price: 'desc' } } }
    } else if (sort === 'rating') {
      orderBy = { rating: 'desc' }
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' }
    }

    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      data: products.map(formatProduct),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    })
  } catch (e) {
    return err('Internal server error', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin(req)
    if (user instanceof NextResponse) return user

    const body = await req.json()
    const { name, description, category, badge, specs, variants, sku } = body

    const slug = slugify(name, { lower: true, strict: true })

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        sku,
        description,
        category,
        badge,
        specs,
        variants: variants
          ? {
              create: variants.map((v: any) => ({
                label: v.label,
                price: v.price,
                stockQty: v.stock_qty ?? v.stockQty ?? 0,
                isActive: v.is_active ?? v.isActive ?? true,
              })),
            }
          : undefined,
      },
      include: productInclude,
    })

    return NextResponse.json(formatProduct(product), { status: 201 })
  } catch (e) {
    return err('Internal server error', 500)
  }
}
