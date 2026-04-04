export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import slugify from 'slugify'
import { prisma } from '@/lib/prisma'
import { requireAdmin, apiError } from '@/lib/api-auth'
import { formatProduct } from './_shared'

const productInclude = {
  images: { orderBy: { order: 'asc' as const } },
  variants: true,
}

// GET /api/products — list with filters/pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') ?? undefined
    const search = searchParams.get('search') ?? undefined
    const sort = searchParams.get('sort') ?? undefined
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '12')
    const skip = (page - 1) * limit

    const where: any = { isActive: true }
    if (category) where.category = category
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]

    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'price_asc') orderBy = { variants: { _min: { price: 'asc' } } }
    else if (sort === 'price_desc') orderBy = { variants: { _min: { price: 'desc' } } }
    else if (sort === 'rating') orderBy = { rating: 'desc' }

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, include: productInclude, orderBy, skip, take: limit }),
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
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}

// POST /api/products — create (admin)
export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
    const { name, description, category, badge, specs, variants, sku } = await req.json()
    const slug = slugify(name, { lower: true, strict: true })

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        sku: sku || slug,
        description,
        category,
        badge: badge?.replace(' ', '_') || null,
        specs: specs || {},
        variants: {
          create: variants?.map((v: any) => ({ label: v.label, price: v.price, stockQty: v.stock_qty ?? 0 })) || [],
        },
      },
      include: productInclude,
    })

    return NextResponse.json(formatProduct(product), { status: 201 })
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
