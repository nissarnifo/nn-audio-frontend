'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product, ProductVariant } from '@/types'
import { getShipping } from '@/lib/utils'

interface CartState {
  items: CartItem[]
  count: number
  subtotal: number
  shipping: number
  total: number
  addItem: (product: Product, variant: ProductVariant, qty?: number) => void
  removeItem: (itemId: string) => void
  updateQty: (itemId: string, qty: number) => void
  clearCart: () => void
  syncPrices: (updates: Array<{ variantId: string; newPrice: number }>) => void
}

function calcTotals(items: CartItem[]) {
  const count = items.reduce((s, i) => s + i.qty, 0)
  const subtotal = items.reduce((s, i) => s + i.variant.price * i.qty, 0)
  const shipping = getShipping(subtotal)
  return { count, subtotal, shipping, total: subtotal + shipping }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      count: 0,
      subtotal: 0,
      shipping: 0,
      total: 0,

      addItem(product, variant, qty = 1) {
        const items = get().items
        const existing = items.find(
          (i) => i.product.id === product.id && i.variant.id === variant.id
        )
        const updated = existing
          ? items.map((i) =>
              i.id === existing.id ? { ...i, qty: i.qty + qty } : i
            )
          : [
              ...items,
              {
                id: `${product.id}-${variant.id}`,
                product,
                variant,
                qty,
              },
            ]
        set({ items: updated, ...calcTotals(updated) })
      },

      removeItem(itemId) {
        const updated = get().items.filter((i) => i.id !== itemId)
        set({ items: updated, ...calcTotals(updated) })
      },

      updateQty(itemId, qty) {
        if (qty < 1) return get().removeItem(itemId)
        const updated = get().items.map((i) =>
          i.id === itemId ? { ...i, qty } : i
        )
        set({ items: updated, ...calcTotals(updated) })
      },

      clearCart() {
        set({ items: [], count: 0, subtotal: 0, shipping: 0, total: 0 })
      },

      syncPrices(updates) {
        const updated = get().items.map((i) => {
          const u = updates.find((x) => x.variantId === i.variant.id)
          return u ? { ...i, variant: { ...i.variant, price: u.newPrice } } : i
        })
        set({ items: updated, ...calcTotals(updated) })
      },
    }),
    { name: 'nn-cart' }
  )
)
