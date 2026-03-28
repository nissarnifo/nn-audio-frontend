import { NextRequest } from 'next/server'
import slugify from 'slugify'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { formatProduct, productInclude } from '@/lib/formatters'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
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
    else if (sort === 'newest') orderBy = { createdAt: 'desc' }

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, include: productInclude, orderBy, skip, take: limit }),
      prisma.product.count({ where }),
    ])

    return Response.json({
      data: products.map(formatProduct),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, err } = requireAdmin(req)
    if (err) return err
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
          create: variants?.map((v: any) => ({
            label: v.label,
            price: v.price,
            stockQty: v.stock_qty ?? 0,
          })) || [],
        },
      },
      include: productInclude,
    })

    return Response.json(formatProduct(product), { status: 201 })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
