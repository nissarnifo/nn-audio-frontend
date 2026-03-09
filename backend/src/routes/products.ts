import { Router } from 'express'
import slugify from 'slugify'
import { prisma, requireAuth, requireAdmin, AuthRequest } from '../middleware/auth'
import { upload, uploadToCloudinary, deleteFromCloudinary } from '../lib/cloudinary'

const router = Router()

const productInclude = {
  images: { orderBy: { order: 'asc' as const } },
  variants: true,
}

function formatProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    description: p.description,
    category: p.category,
    badge: p.badge?.replace('_', ' ') ?? null,
    specs: p.specs,
    rating: p.rating,
    review_count: p.reviewCount,
    is_active: p.isActive,
    created_at: p.createdAt,
    images: p.images.map((img: any) => ({
      id: img.id,
      url: img.url,
      is_primary: img.isPrimary,
      order: img.order,
    })),
    variants: p.variants.map((v: any) => ({
      id: v.id,
      label: v.label,
      price: v.price,
      stock_qty: v.stockQty,
      is_active: v.isActive,
    })),
  }
}

// GET /api/v1/products
router.get('/', async (req, res) => {
  const { category, search, sort, page = '1', limit = '12' } = req.query as Record<string, string>
  const skip = (parseInt(page) - 1) * parseInt(limit)

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
    prisma.product.findMany({ where, include: productInclude, orderBy, skip, take: parseInt(limit) }),
    prisma.product.count({ where }),
  ])

  res.json({
    data: products.map(formatProduct),
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    total_pages: Math.ceil(total / parseInt(limit)),
  })
})

// GET /api/v1/products/id/:id
router.get('/id/:id', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: productInclude,
  })
  if (!product) { res.status(404).json({ error: 'Product not found' }); return }
  res.json(formatProduct(product))
})

// GET /api/v1/products/:slug
router.get('/:slug', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: productInclude,
  })
  if (!product) { res.status(404).json({ error: 'Product not found' }); return }
  res.json(formatProduct(product))
})

// POST /api/v1/products (admin)
router.post('/', requireAdmin, async (req: AuthRequest, res) => {
  const { name, description, category, badge, specs, variants, sku } = req.body
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

  res.status(201).json(formatProduct(product))
})

// PUT /api/v1/products/:id (admin)
router.put('/:id', requireAdmin, async (req: AuthRequest, res) => {
  const { name, description, category, badge, specs, is_active, variants } = req.body
  const data: any = {}
  if (name) { data.name = name; data.slug = slugify(name, { lower: true, strict: true }) }
  if (description) data.description = description
  if (category) data.category = category
  if (badge !== undefined) data.badge = badge?.replace(' ', '_') || null
  if (specs) data.specs = specs
  if (is_active !== undefined) data.isActive = is_active

  const product = await prisma.product.update({
    where: { id: req.params.id },
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

  res.json(formatProduct(product))
})

// DELETE /api/v1/products/:id (admin)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  await prisma.product.delete({ where: { id: req.params.id } })
  res.json({ message: 'Product deleted' })
})

// POST /api/v1/products/:id/images (admin)
router.post('/:id/images', requireAdmin, upload.single('image'), async (req: AuthRequest, res) => {
  if (!req.file) { res.status(400).json({ error: 'No image provided' }); return }
  const { url, publicId } = await uploadToCloudinary(req.file.buffer)

  const imageCount = await prisma.productImage.count({ where: { productId: req.params.id } })
  const image = await prisma.productImage.create({
    data: {
      productId: req.params.id,
      url,
      publicId,
      isPrimary: imageCount === 0,
      order: imageCount,
    },
  })

  res.status(201).json({ id: image.id, url: image.url, is_primary: image.isPrimary, order: image.order })
})

// DELETE /api/v1/products/:productId/images/:imageId (admin)
router.delete('/:productId/images/:imageId', requireAdmin, async (req: AuthRequest, res) => {
  const image = await prisma.productImage.findUnique({ where: { id: req.params.imageId } })
  if (!image) { res.status(404).json({ error: 'Image not found' }); return }
  await deleteFromCloudinary(image.publicId)
  await prisma.productImage.delete({ where: { id: req.params.imageId } })
  res.json({ message: 'Image deleted' })
})

// GET /api/v1/products/:slug/reviews
router.get('/:slug/reviews', async (req, res) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } })
  if (!product) { res.status(404).json({ error: 'Product not found' }); return }

  const reviews = await prisma.review.findMany({
    where: { productId: product.id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  res.json(reviews.map((r) => ({
    id: r.id,
    user_name: r.user.name,
    rating: r.rating,
    comment: r.comment,
    created_at: r.createdAt,
  })))
})

// POST /api/v1/products/:slug/reviews (auth)
router.post('/:slug/reviews', requireAuth, async (req: AuthRequest, res) => {
  const { rating, comment } = req.body
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } })
  if (!product) { res.status(404).json({ error: 'Product not found' }); return }

  const review = await prisma.review.create({
    data: { productId: product.id, userId: req.user!.id, rating: parseInt(rating), comment },
    include: { user: { select: { name: true } } },
  })

  // Update product rating
  const agg = await prisma.review.aggregate({ where: { productId: product.id }, _avg: { rating: true }, _count: true })
  await prisma.product.update({
    where: { id: product.id },
    data: { rating: agg._avg.rating ?? 0, reviewCount: agg._count },
  })

  res.status(201).json({ id: review.id, user_name: review.user.name, rating: review.rating, comment: review.comment, created_at: review.createdAt })
})

export default router
