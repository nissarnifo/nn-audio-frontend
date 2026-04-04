export function formatProduct(p: {
  id: string; name: string; slug: string; sku: string; description: string
  category: string; badge?: string | null; specs: unknown; rating: number
  reviewCount: number; salePrice?: number | null; saleStartAt?: Date | null; saleEndAt?: Date | null
  isActive: boolean; createdAt: Date
  images: { id: string; url: string; isPrimary: boolean; order: number }[]
  variants: { id: string; label: string; price: number; stockQty: number; isActive: boolean }[]
}) {
  const now = new Date()
  const onSale = p.salePrice != null &&
    (p.saleStartAt == null || p.saleStartAt <= now) &&
    (p.saleEndAt == null || p.saleEndAt > now)

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
    sale_price: p.salePrice ?? null,
    sale_start_at: p.saleStartAt ?? null,
    sale_end_at: p.saleEndAt ?? null,
    on_sale: onSale,
    is_active: p.isActive,
    created_at: p.createdAt,
    images: p.images.map((img) => ({ id: img.id, url: img.url, is_primary: img.isPrimary, order: img.order })),
    variants: p.variants.map((v) => ({ id: v.id, label: v.label, price: v.price, stock_qty: v.stockQty, is_active: v.isActive })),
  }
}
