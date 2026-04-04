const SHIPPING_THRESHOLD = 5000
const SHIPPING_FEE = 299

export const cartInclude = {
  items: {
    include: {
      product: { include: { images: { orderBy: { order: 'asc' as const } }, variants: true } },
      variant: true,
    },
  },
}

export function formatCart(cart: any) {
  const items = cart.items.map((item: any) => ({
    id: item.id,
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      sku: item.product.sku,
      description: item.product.description,
      category: item.product.category,
      badge: item.product.badge?.replace('_', ' ') ?? null,
      specs: item.product.specs,
      rating: item.product.rating,
      review_count: item.product.reviewCount,
      is_active: item.product.isActive,
      created_at: item.product.createdAt,
      images: item.product.images.map((img: any) => ({ id: img.id, url: img.url, is_primary: img.isPrimary, order: img.order })),
      variants: item.product.variants.map((v: any) => ({ id: v.id, label: v.label, price: v.price, stock_qty: v.stockQty, is_active: v.isActive })),
    },
    variant: { id: item.variant.id, label: item.variant.label, price: item.variant.price, stock_qty: item.variant.stockQty, is_active: item.variant.isActive },
    qty: item.qty,
  }))

  const subtotal = items.reduce((sum: number, i: any) => sum + i.variant.price * i.qty, 0)
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  return { items, count: items.reduce((s: number, i: any) => s + i.qty, 0), subtotal, shipping, total: subtotal + shipping }
}
