/* eslint-disable @typescript-eslint/no-explicit-any */

export function formatProduct(p: any) {
  return {
    id: p.id, name: p.name, slug: p.slug, sku: p.sku,
    description: p.description, category: p.category,
    badge: p.badge?.replace('_', ' ') ?? null,
    specs: p.specs, rating: p.rating,
    review_count: p.reviewCount, is_active: p.isActive,
    created_at: p.createdAt,
    images: (p.images ?? []).map((img: any) => ({ id: img.id, url: img.url, is_primary: img.isPrimary, order: img.order })),
    variants: (p.variants ?? []).map((v: any) => ({ id: v.id, label: v.label, price: v.price, stock_qty: v.stockQty, is_active: v.isActive })),
  }
}

export function safeUser(u: any) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone ?? '', role: u.role, created_at: u.createdAt }
}

export const productInclude = {
  images: { orderBy: { order: 'asc' as const } },
  variants: true,
}

export const SHIPPING_THRESHOLD = 5000
export const SHIPPING_FEE = 299

export function formatCart(cart: any) {
  const items = (cart.items ?? []).map((item: any) => ({
    id: item.id,
    product: formatProduct(item.product),
    variant: { id: item.variant.id, label: item.variant.label, price: item.variant.price, stock_qty: item.variant.stockQty, is_active: item.variant.isActive },
    qty: item.qty,
  }))
  const subtotal = items.reduce((s: number, i: any) => s + i.variant.price * i.qty, 0)
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  return { items, count: items.reduce((s: number, i: any) => s + i.qty, 0), subtotal, shipping, total: subtotal + shipping }
}

export const cartInclude = {
  items: {
    include: {
      product: { include: { images: { orderBy: { order: 'asc' as const } }, variants: true } },
      variant: true,
    },
  },
}

export const orderInclude = {
  items: {
    include: {
      product: { include: { images: { orderBy: { order: 'asc' as const } }, variants: true } },
      variant: true,
    },
  },
  address: true,
}

export function formatOrder(o: any) {
  return {
    id: o.id, order_number: o.orderNumber, status: o.status,
    payment_method: o.paymentMethod, payment_status: o.paymentStatus,
    subtotal: o.subtotal, shipping: o.shipping, total: o.total,
    created_at: o.createdAt, updated_at: o.updatedAt,
    user: o.user ?? undefined,
    address: { id: o.address.id, label: o.address.label, name: o.address.name, phone: o.address.phone, line1: o.address.line1, line2: o.address.line2, city: o.address.city, state: o.address.state, pin: o.address.pin, is_default: o.address.isDefault },
    items: (o.items ?? []).map((item: any) => ({
      id: item.id, qty: item.qty, price: item.price,
      product: formatProduct(item.product),
      variant: { id: item.variant.id, label: item.variant.label, price: item.variant.price, stock_qty: item.variant.stockQty, is_active: item.variant.isActive },
    })),
  }
}
